import { Buffer } from "node:buffer";

import { env, hasSe365Config } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

const API_BASE = env.se365BaseUrl;
const PUBLIC_BASE = "https://www.sportsevents365.com";
const FOOTBALL_EVENT_TYPE_ID = "1000";

type FetchResult = {
  ok: boolean;
  status: number;
  json: any | null;
};

type ParticipantMatch = {
  id: string;
  name: string;
  raw: any;
};

type EventMatch = {
  id: string;
  name: string;
  raw: any;
};

type TicketSummary = {
  priceText: string | null;
  hasTickets: boolean;
  raw: any;
};

const PARTICIPANT_CACHE = new Map<string, ParticipantMatch | null>();
const PARTICIPANT_POOL_CACHE = new Map<string, any[]>();
const EVENTS_CACHE = new Map<string, EventMatch[]>();
const TICKETS_CACHE = new Map<string, TicketSummary | null>();

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function normalize(v: unknown): string {
  return clean(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/\b(fc|ss|as|ac|cf|afc|sc|sk|club|football club)\b/g, " ")
    .replace(/\bmilano\b/g, "milan")
    .replace(/\binternazionale\b/g, "inter")
    .replace(/\bmunchen\b/g, "munich")
    .replace(/\bmuenchen\b/g, "munich")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(v: unknown): string {
  return normalize(v).replace(/[^a-z0-9]/g, "");
}

function buildHeaders(): Record<string, string> {
  const username = clean(env.se365HttpUsername);
  const password = clean(env.se365ApiPassword);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (username && password) {
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  return headers;
}

function appendApiKey(url: URL): URL {
  url.searchParams.set("apiKey", clean(env.se365ApiKey));
  return url;
}

async function fetchJson(url: URL): Promise<FetchResult> {
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: buildHeaders(),
    });

    const text = await res.text();

    console.log("[SE365] fetch", {
      url: url.toString(),
      status: res.status,
      ok: res.ok,
      bodyPreview: text.slice(0, 350),
    });

    if (!res.ok) return { ok: false, status: res.status, json: null };

    try {
      return { ok: true, status: res.status, json: JSON.parse(text) };
    } catch {
      return { ok: true, status: res.status, json: null };
    }
  } catch (err) {
    console.log("[SE365] fetch error", {
      url: url.toString(),
      error: err instanceof Error ? err.message : String(err),
    });

    return { ok: false, status: 0, json: null };
  }
}

function unwrapData(json: any): any {
  if (!json) return null;
  return json.data ?? json.result ?? json.results ?? json;
}

function extractArray(json: any, keys: string[]): any[] {
  if (!json) return [];

  const data = unwrapData(json);

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(json?.[key])) return json[key];
  }

  return [];
}

function extractParticipants(json: any): any[] {
  return extractArray(json, ["participants", "items", "data", "results"]);
}

function extractEvents(json: any): any[] {
  return extractArray(json, ["events", "items", "data", "results"]);
}

function extractTickets(json: any): any[] {
  return extractArray(json, ["tickets", "items", "data", "results"]);
}

function formatDateDdMmYyyy(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}/${date.getFullYear()}`;
}

function getDateRange(kickoffIso: string): { from: string; to: string } {
  const d = new Date(kickoffIso);

  const from = new Date(d);
  from.setDate(from.getDate() - 5);

  const to = new Date(d);
  to.setDate(to.getDate() + 5);

  return {
    from: formatDateDdMmYyyy(from),
    to: formatDateDdMmYyyy(to),
  };
}

function eventName(ev: any): string {
  return clean(ev?.name || ev?.title || ev?.caption || ev?.eventName || ev?.meta?.title || ev?.description);
}

function participantName(participant: any): string {
  return clean(participant?.name || participant?.title || participant?.participantName || participant?.caption);
}

function participantId(participant: any): string {
  return clean(participant?.id || participant?.participantId);
}

function eventId(event: any): string {
  return clean(event?.id || event?.eventId);
}

function teamName(ev: any, side: "home" | "away"): string {
  if (side === "home") return clean(ev?.homeTeam?.name || ev?.home?.name || ev?.homeName);
  return clean(ev?.awayTeam?.name || ev?.away?.name || ev?.awayName);
}

function participantNamesFromEvent(ev: any): string[] {
  if (!Array.isArray(ev?.participants)) return [];
  return ev.participants.map((participant: any) => participantName(participant)).filter(Boolean);
}

function namesLooselyMatch(a: string, b: string): boolean {
  const aa = normalize(a);
  const bb = normalize(b);
  const ca = compact(a);
  const cb = compact(b);

  if (!aa || !bb || !ca || !cb) return false;

  return aa === bb || aa.includes(bb) || bb.includes(aa) || ca === cb || ca.includes(cb) || cb.includes(ca);
}

function matchEvent(ev: any, home: string, away: string): boolean {
  const fields = [eventName(ev), teamName(ev, "home"), teamName(ev, "away"), ...participantNamesFromEvent(ev)].filter(Boolean);

  return fields.some((field) => namesLooselyMatch(field, home)) && fields.some((field) => namesLooselyMatch(field, away));
}

function scoreParticipant(candidate: any, team: string): number {
  const name = participantName(candidate);
  const n = normalize(name);
  const t = normalize(team);
  const cn = compact(name);
  const ct = compact(team);

  if (!name || !t) return 0;
  if (n === t || cn === ct) return 100;
  if (n.includes(t) || cn.includes(ct)) return 90;
  if (t.includes(n) || ct.includes(cn)) return 75;

  return 0;
}

function pickBestParticipant(participants: any[], team: string): ParticipantMatch | null {
  const ranked = participants
    .map((participant) => ({
      participant,
      id: participantId(participant),
      name: participantName(participant),
      score: scoreParticipant(participant, team),
    }))
    .filter((entry) => entry.id && entry.name && entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best) return null;

  return {
    id: best.id,
    name: best.name,
    raw: best.participant,
  };
}

function isBlockedPartnerUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return host === "tickets-partners.com" || host === "www.tickets-partners.com";
  } catch {
    return false;
  }
}

function isUsablePublicEventUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    return (host === "sportsevents365.com" || host === "www.sportsevents365.com") && path.startsWith("/event/");
  } catch {
    return false;
  }
}

function affiliateUrlFromEvent(event: any, id: string): string {
  const affiliateId = clean(env.se365AffiliateId);

  const possibleApiUrls = [
    clean(event?.eventUrl),
    clean(event?.pageUrl),
    clean(event?.websiteUrl),
    clean(event?.publicUrl),
    clean(event?.url),
    clean(event?.link),
    clean(event?.affiliateUrl),
  ].filter(Boolean);

  for (const rawUrl of possibleApiUrls) {
    if (isBlockedPartnerUrl(rawUrl)) continue;
    if (!isUsablePublicEventUrl(rawUrl)) continue;

    const parsed = new URL(rawUrl);
    if (affiliateId) parsed.searchParams.set("a_aid", affiliateId);
    return parsed.toString();
  }

  const fallbackUrl = new URL(`${PUBLIC_BASE}/event/${id}`);
  if (affiliateId) fallbackUrl.searchParams.set("a_aid", affiliateId);

  return fallbackUrl.toString();
}

function priceFromTicket(ticket: any): number | null {
  const raw =
    ticket?.ticketPrice ??
    ticket?.price ??
    ticket?.salePrice ??
    ticket?.minPrice ??
    ticket?.amount ??
    ticket?.totalPrice ??
    ticket?.ticket?.price ??
    null;

  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function currencyFromTicket(ticket: any): string {
  return clean(ticket?.currency) || clean(ticket?.priceCurrency) || clean(ticket?.ticket?.currency) || "GBP";
}

function formatPrice(amount: number, currency: string): string {
  const code = clean(currency).toUpperCase();

  if (code === "GBP") return `£${amount}`;
  if (code === "EUR") return `€${amount}`;
  if (code === "USD") return `$${amount}`;

  return `${code || "GBP"} ${amount}`;
}

function extractTicketSummary(json: any): TicketSummary | null {
  const tickets = extractTickets(json);

  if (tickets.length === 0) {
    return { hasTickets: false, priceText: null, raw: json };
  }

  const priced = tickets
    .map((ticket) => ({
      ticket,
      price: priceFromTicket(ticket),
      currency: currencyFromTicket(ticket),
    }))
    .filter((entry) => entry.price != null)
    .sort((a, b) => Number(a.price) - Number(b.price));

  const cheapest = priced[0];

  return {
    hasTickets: true,
    priceText: cheapest?.price != null ? formatPrice(Number(cheapest.price), cheapest.currency) : "View live price",
    raw: json,
  };
}

function candidateFromEvent(event: any, home: string, away: string, ticketSummary: TicketSummary | null): TicketCandidate | null {
  const id = eventId(event);
  if (!id) return null;

  const hasTicketProof = Boolean(ticketSummary?.hasTickets);

  return {
    provider: "sportsevents365",
    exact: true,
    score: hasTicketProof ? 98 : 86,
    rawScore: hasTicketProof ? 98 : 86,
    url: affiliateUrlFromEvent(event, id),
    title: eventName(event) || `Tickets: ${home} vs ${away}`,
    priceText: ticketSummary?.priceText ?? "View live price",
    reason: "exact_event",
    urlQuality: "event",
  };
}

async function fetchParticipantPool(): Promise<any[]> {
  const cacheKey = "football_participants";

  if (PARTICIPANT_POOL_CACHE.has(cacheKey)) {
    return PARTICIPANT_POOL_CACHE.get(cacheKey) ?? [];
  }

  const urls = [new URL(`${API_BASE}/participants/top`), new URL(`${API_BASE}/participants`)];
  const all: any[] = [];

  for (const rawUrl of urls) {
    const url = appendApiKey(rawUrl);
    url.searchParams.set("perPage", "1000");
    url.searchParams.set("eventTypeId", FOOTBALL_EVENT_TYPE_ID);

    const result = await fetchJson(url);
    const participants = extractParticipants(result.json);

    console.log("[SE365] participant pool", {
      route: rawUrl.pathname,
      status: result.status,
      count: participants.length,
      sample: participants.slice(0, 10).map((participant) => ({
        id: participantId(participant),
        name: participantName(participant),
      })),
    });

    all.push(...participants);
  }

  const deduped = new Map<string, any>();

  for (const participant of all) {
    const id = participantId(participant);
    if (id && !deduped.has(id)) deduped.set(id, participant);
  }

  const pool = Array.from(deduped.values());
  PARTICIPANT_POOL_CACHE.set(cacheKey, pool);
  return pool;
}

async function findParticipant(team: string): Promise<ParticipantMatch | null> {
  const cacheKey = normalize(team);

  if (PARTICIPANT_CACHE.has(cacheKey)) {
    return PARTICIPANT_CACHE.get(cacheKey) ?? null;
  }

  const pool = await fetchParticipantPool();
  const match = pickBestParticipant(pool, team);

  console.log("[SE365] participant lookup", {
    team,
    poolCount: pool.length,
    matched: match ? { id: match.id, name: match.name } : null,
  });

  PARTICIPANT_CACHE.set(cacheKey, match);
  return match;
}

async function findEventsByParticipant(participant: ParticipantMatch, kickoffIso: string): Promise<EventMatch[]> {
  const { from, to } = getDateRange(kickoffIso);
  const cacheKey = `${participant.id}|${from}|${to}`;

  if (EVENTS_CACHE.has(cacheKey)) {
    return EVENTS_CACHE.get(cacheKey) ?? [];
  }

  const url = appendApiKey(new URL(`${API_BASE}/events/participant/${participant.id}`));
  url.searchParams.set("perPage", "100");
  url.searchParams.set("eventTypeId", FOOTBALL_EVENT_TYPE_ID);
  url.searchParams.set("dateFrom", from);
  url.searchParams.set("dateTo", to);

  const result = await fetchJson(url);
  const events = extractEvents(result.json);

  const mapped = events
    .map((event) => ({
      id: eventId(event),
      name: eventName(event),
      raw: event,
    }))
    .filter((event) => event.id);

  console.log("[SE365] events by participant", {
    participantId: participant.id,
    participantName: participant.name,
    status: result.status,
    count: mapped.length,
    from,
    to,
    sample: mapped.slice(0, 8).map((event) => ({
      id: event.id,
      name: event.name,
      home: teamName(event.raw, "home"),
      away: teamName(event.raw, "away"),
      participants: participantNamesFromEvent(event.raw),
    })),
  });

  EVENTS_CACHE.set(cacheKey, mapped);
  return mapped;
}

async function getTicketsForEvent(eventIdValue: string): Promise<TicketSummary | null> {
  const cacheKey = clean(eventIdValue);

  if (TICKETS_CACHE.has(cacheKey)) {
    return TICKETS_CACHE.get(cacheKey) ?? null;
  }

  const url = appendApiKey(new URL(`${API_BASE}/tickets/${cacheKey}`));
  const result = await fetchJson(url);
  const summary = result.ok ? extractTicketSummary(result.json) : null;

  console.log("[SE365] tickets by event", {
    eventId: cacheKey,
    status: result.status,
    hasTickets: Boolean(summary?.hasTickets),
    priceText: summary?.priceText ?? null,
  });

  TICKETS_CACHE.set(cacheKey, summary);
  return summary;
}

function pickBestEvent(events: EventMatch[], home: string, away: string): EventMatch | null {
  const matches = events.filter((event) => matchEvent(event.raw, home, away));
  return matches[0] ?? null;
}

export async function resolveSe365Candidate(input: TicketResolveInput): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) {
    console.log("[SE365] skipped: missing config");
    return null;
  }

  const home = clean(input.homeName);
  const away = clean(input.awayName);
  const kickoff = clean(input.kickoffIso);

  if (!home || !away || !kickoff) {
    console.log("[SE365] skipped: missing input", { home, away, kickoff });
    return null;
  }

  console.log("[SE365] resolving", {
    home,
    away,
    kickoff,
    apiBase: API_BASE,
  });

  const [homeParticipant, awayParticipant] = await Promise.all([findParticipant(home), findParticipant(away)]);

  if (!homeParticipant && !awayParticipant) {
    console.log("[SE365] no participants found; returning null", { home, away });
    return null;
  }

  const eventSources = [homeParticipant, awayParticipant].filter(Boolean) as ParticipantMatch[];
  const eventLists = await Promise.all(eventSources.map((participant) => findEventsByParticipant(participant, kickoff)));

  const dedupedEvents = new Map<string, EventMatch>();

  for (const event of eventLists.flat()) {
    if (!dedupedEvents.has(event.id)) dedupedEvents.set(event.id, event);
  }

  const bestEvent = pickBestEvent(Array.from(dedupedEvents.values()), home, away);

  if (!bestEvent) {
    console.log("[SE365] no matching event found; returning null", {
      home,
      away,
      eventCount: dedupedEvents.size,
    });
    return null;
  }

  const ticketSummary = await getTicketsForEvent(bestEvent.id);
  const candidate = candidateFromEvent(bestEvent.raw, home, away, ticketSummary);

  console.log("[SE365] result", {
    found: Boolean(candidate),
    eventId: bestEvent.id,
    hasTicketProof: Boolean(ticketSummary?.hasTickets),
    title: candidate?.title ?? null,
    url: candidate?.url ?? null,
    priceText: candidate?.priceText ?? null,
  });

  return candidate;
}
