import { Buffer } from "node:buffer";

import { env, hasSe365Config } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

const API_BASE = String(env.se365BaseUrl || "").replace(/\/+$/, "");
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
  score: number;
  raw: any;
};

type EventMatch = {
  id: string;
  name: string;
  score: number;
  raw: any;
};

type TicketSummary = {
  priceText: string | null;
  hasTickets: boolean;
  raw: any;
};

const PARTICIPANT_POOL_CACHE = new Map<string, any[]>();
const EVENTS_CACHE = new Map<string, EventMatch[]>();
const TICKETS_CACHE = new Map<string, TicketSummary | null>();

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function stripAccents(value: unknown): string {
  return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value: unknown): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b1\b/g, "")
    .replace(/\bfc\b/g, "")
    .replace(/\bsc\b/g, "")
    .replace(/\bsv\b/g, "")
    .replace(/\bss\b/g, "")
    .replace(/\bas\b/g, "")
    .replace(/\bac\b/g, "")
    .replace(/\bcf\b/g, "")
    .replace(/\bclub\b/g, "")
    .replace(/\bfootball\b/g, "")
    .replace(/\bsoccer\b/g, "")
    .replace(/\bcalcio\b/g, "")
    .replace(/\bmuenchen\b/g, "munich")
    .replace(/\bmunchen\b/g, "munich")
    .replace(/\bmünchen\b/g, "munich")
    .replace(/\bmoenchengladbach\b/g, "monchengladbach")
    .replace(/\bmönchengladbach\b/g, "monchengladbach")
    .replace(/\bkoln\b/g, "cologne")
    .replace(/\bköln\b/g, "cologne")
    .replace(/\binternazionale\b/g, "inter")
    .replace(/\bmilano\b/g, "milan")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: unknown): string {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function teamAliases(name: string): string[] {
  const base = normalize(name);
  const out = new Set<string>([base]);

  const c = compact(base);

  if (c.includes("bayern")) out.add("bayern munich");
  if (c.includes("augsburg")) out.add("augsburg");
  if (c.includes("monchengladbach") || c.includes("gladbach")) {
    out.add("borussia monchengladbach");
    out.add("monchengladbach");
    out.add("gladbach");
  }
  if (c.includes("koln") || c.includes("cologne")) {
    out.add("cologne");
    out.add("koln");
    out.add("1 fc cologne");
  }
  if (c.includes("hoffenheim")) out.add("hoffenheim");
  if (c.includes("werder") || c.includes("bremen")) {
    out.add("werder bremen");
    out.add("bremen");
  }

  return Array.from(out).filter(Boolean);
}

function namesMatch(a: string, b: string): boolean {
  const aa = normalize(a);
  const bb = normalize(b);
  const ca = compact(a);
  const cb = compact(b);

  if (!aa || !bb || !ca || !cb) return false;

  if (aa === bb || ca === cb) return true;
  if (aa.includes(bb) || bb.includes(aa)) return true;
  if (ca.includes(cb) || cb.includes(ca)) return true;

  const aTokens = new Set(aa.split(" ").filter((x) => x.length >= 3));
  const bTokens = bb.split(" ").filter((x) => x.length >= 3);

  if (!bTokens.length) return false;

  const matched = bTokens.filter((token) => aTokens.has(token)).length;
  return matched / bTokens.length >= 0.65;
}

function anyAliasMatches(value: string, target: string): boolean {
  return teamAliases(target).some((alias) => namesMatch(value, alias));
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
  const apiKey = clean(env.se365ApiKey);
  if (apiKey) url.searchParams.set("apiKey", apiKey);
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
      path: url.pathname,
      status: res.status,
      ok: res.ok,
      preview: text.slice(0, 220),
    });

    if (!res.ok) return { ok: false, status: res.status, json: null };

    try {
      return { ok: true, status: res.status, json: JSON.parse(text) };
    } catch {
      return { ok: true, status: res.status, json: null };
    }
  } catch (error) {
    console.log("[SE365] fetch error", {
      path: url.pathname,
      error: error instanceof Error ? error.message : String(error),
    });

    return { ok: false, status: 0, json: null };
  }
}

function unwrapData(json: any): any {
  return json?.data ?? json?.result ?? json?.results ?? json;
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

function participantId(p: any): string {
  return clean(p?.id ?? p?.participantId ?? p?.participant_id);
}

function participantName(p: any): string {
  return clean(p?.name ?? p?.title ?? p?.participantName ?? p?.caption);
}

function eventId(e: any): string {
  return clean(e?.id ?? e?.eventId ?? e?.event_id);
}

function eventName(e: any): string {
  return clean(e?.name ?? e?.title ?? e?.caption ?? e?.eventName ?? e?.description);
}

function eventDate(e: any): string {
  return clean(e?.date ?? e?.eventDate ?? e?.event_date ?? e?.startDate ?? e?.start_date);
}

function teamName(e: any, side: "home" | "away"): string {
  if (side === "home") return clean(e?.homeTeam?.name ?? e?.home?.name ?? e?.homeName);
  return clean(e?.awayTeam?.name ?? e?.away?.name ?? e?.awayName);
}

function participantNamesFromEvent(e: any): string[] {
  if (!Array.isArray(e?.participants)) return [];
  return e.participants.map(participantName).filter(Boolean);
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
  from.setDate(from.getDate() - 7);

  const to = new Date(d);
  to.setDate(to.getDate() + 7);

  return {
    from: formatDateDdMmYyyy(from),
    to: formatDateDdMmYyyy(to),
  };
}

function dateScore(eventRaw: any, kickoffIso: string): number {
  const eventRawDate = eventDate(eventRaw);
  if (!eventRawDate) return 0;

  const kickoff = new Date(kickoffIso);
  const ev = new Date(eventRawDate);

  if (!Number.isFinite(kickoff.getTime()) || !Number.isFinite(ev.getTime())) return 0;

  const diff = Math.abs(
    Date.UTC(kickoff.getUTCFullYear(), kickoff.getUTCMonth(), kickoff.getUTCDate()) -
      Date.UTC(ev.getUTCFullYear(), ev.getUTCMonth(), ev.getUTCDate())
  );

  const days = Math.round(diff / 86_400_000);

  if (days === 0) return 35;
  if (days <= 1) return 18;
  if (days <= 3) return 8;
  return 0;
}

function scoreParticipant(p: any, team: string): number {
  const name = participantName(p);
  if (!name) return 0;

  if (teamAliases(team).some((alias) => normalize(name) === normalize(alias))) return 100;
  if (teamAliases(team).some((alias) => namesMatch(name, alias))) return 82;

  return 0;
}

function pickParticipants(pool: any[], team: string): ParticipantMatch[] {
  return pool
    .map((p) => ({
      id: participantId(p),
      name: participantName(p),
      score: scoreParticipant(p, team),
      raw: p,
    }))
    .filter((p) => p.id && p.name && p.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function scoreEvent(e: any, home: string, away: string, kickoffIso: string): number {
  const fields = [
    eventName(e),
    teamName(e, "home"),
    teamName(e, "away"),
    ...participantNamesFromEvent(e),
  ].filter(Boolean);

  const homeHit = fields.some((field) => anyAliasMatches(field, home));
  const awayHit = fields.some((field) => anyAliasMatches(field, away));

  if (!homeHit || !awayHit) return 0;

  let score = 80;
  score += dateScore(e, kickoffIso);

  if (eventName(e)) score += 5;
  if (eventId(e)) score += 5;

  return score;
}

function pickBestEvent(events: EventMatch[]): EventMatch | null {
  return [...events].sort((a, b) => b.score - a.score)[0] ?? null;
}

async function fetchParticipantPool(): Promise<any[]> {
  const cacheKey = "football_participants_v2";

  if (PARTICIPANT_POOL_CACHE.has(cacheKey)) {
    return PARTICIPANT_POOL_CACHE.get(cacheKey) ?? [];
  }

  const endpoints = ["/participants", "/participants/top"];
  const all: any[] = [];

  for (const endpoint of endpoints) {
    const url = appendApiKey(new URL(`${API_BASE}${endpoint}`));
    url.searchParams.set("eventTypeId", FOOTBALL_EVENT_TYPE_ID);
    url.searchParams.set("perPage", "1000");

    const result = await fetchJson(url);
    const participants = extractParticipants(result.json);

    console.log("[SE365] participant pool", {
      endpoint,
      status: result.status,
      count: participants.length,
    });

    all.push(...participants);
  }

  const deduped = new Map<string, any>();

  for (const p of all) {
    const id = participantId(p);
    if (id && !deduped.has(id)) deduped.set(id, p);
  }

  const pool = Array.from(deduped.values());
  PARTICIPANT_POOL_CACHE.set(cacheKey, pool);

  return pool;
}

async function findParticipantMatches(team: string): Promise<ParticipantMatch[]> {
  const pool = await fetchParticipantPool();
  const matches = pickParticipants(pool, team);

  console.log("[SE365] participant matches", {
    team,
    poolCount: pool.length,
    matches: matches.map((m) => ({ id: m.id, name: m.name, score: m.score })),
  });

  return matches;
}

async function findEventsByParticipant(
  participant: ParticipantMatch,
  kickoffIso: string
): Promise<EventMatch[]> {
  const { from, to } = getDateRange(kickoffIso);
  const cacheKey = `${participant.id}|${from}|${to}`;

  if (EVENTS_CACHE.has(cacheKey)) return EVENTS_CACHE.get(cacheKey) ?? [];

  const url = appendApiKey(new URL(`${API_BASE}/events/participant/${participant.id}`));
  url.searchParams.set("eventTypeId", FOOTBALL_EVENT_TYPE_ID);
  url.searchParams.set("dateFrom", from);
  url.searchParams.set("dateTo", to);
  url.searchParams.set("perPage", "100");

  const result = await fetchJson(url);
  const events = extractEvents(result.json)
    .map((raw) => ({
      id: eventId(raw),
      name: eventName(raw),
      score: 0,
      raw,
    }))
    .filter((e) => e.id);

  console.log("[SE365] events by participant", {
    participantId: participant.id,
    participantName: participant.name,
    status: result.status,
    count: events.length,
    from,
    to,
    sample: events.slice(0, 6).map((e) => ({
      id: e.id,
      name: e.name,
      home: teamName(e.raw, "home"),
      away: teamName(e.raw, "away"),
      participants: participantNamesFromEvent(e.raw),
    })),
  });

  EVENTS_CACHE.set(cacheKey, events);
  return events;
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
  return clean(ticket?.currency ?? ticket?.priceCurrency ?? ticket?.ticket?.currency) || "GBP";
}

function formatPrice(amount: number, currency: string): string {
  const code = clean(currency).toUpperCase();

  if (code === "GBP") return `£${amount}`;
  if (code === "EUR") return `€${amount}`;
  if (code === "USD") return `$${amount}`;

  return `${code} ${amount}`;
}

function extractTicketSummary(json: any): TicketSummary | null {
  const tickets = extractTickets(json);

  if (!tickets.length) {
    return {
      hasTickets: false,
      priceText: null,
      raw: json,
    };
  }

  const priced = tickets
    .map((ticket) => ({
      ticket,
      price: priceFromTicket(ticket),
      currency: currencyFromTicket(ticket),
    }))
    .filter((x) => x.price != null)
    .sort((a, b) => Number(a.price) - Number(b.price));

  const cheapest = priced[0];

  return {
    hasTickets: true,
    priceText:
      cheapest?.price != null ? formatPrice(Number(cheapest.price), cheapest.currency) : "View live price",
    raw: json,
  };
}

async function getTicketsForEvent(id: string): Promise<TicketSummary | null> {
  const eventIdValue = clean(id);
  if (!eventIdValue) return null;

  if (TICKETS_CACHE.has(eventIdValue)) return TICKETS_CACHE.get(eventIdValue) ?? null;

  const url = appendApiKey(new URL(`${API_BASE}/tickets/${eventIdValue}`));
  const result = await fetchJson(url);
  const summary = result.ok ? extractTicketSummary(result.json) : null;

  console.log("[SE365] tickets by event", {
    eventId: eventIdValue,
    status: result.status,
    hasTickets: Boolean(summary?.hasTickets),
    priceText: summary?.priceText ?? null,
  });

  TICKETS_CACHE.set(eventIdValue, summary);
  return summary;
}

function isUsablePublicEventUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return (
      (host === "sportsevents365.com" || host === "www.sportsevents365.com") &&
      parsed.pathname.toLowerCase().startsWith("/event/")
    );
  } catch {
    return false;
  }
}

function affiliateUrlFromEvent(event: any, id: string): string {
  const affiliateId = clean(env.se365AffiliateId);

  const rawUrls = [
    event?.eventUrl,
    event?.pageUrl,
    event?.websiteUrl,
    event?.publicUrl,
    event?.url,
    event?.link,
    event?.affiliateUrl,
  ]
    .map(clean)
    .filter(Boolean);

  for (const raw of rawUrls) {
    if (!isUsablePublicEventUrl(raw)) continue;

    const url = new URL(raw);
    if (affiliateId) url.searchParams.set("a_aid", affiliateId);

    return url.toString();
  }

  const fallback = new URL(`${PUBLIC_BASE}/event/${id}`);
  if (affiliateId) fallback.searchParams.set("a_aid", affiliateId);

  return fallback.toString();
}

function candidateFromEvent(
  event: EventMatch,
  home: string,
  away: string,
  ticketSummary: TicketSummary | null
): TicketCandidate {
  const priceText = ticketSummary?.priceText ?? "View live price";

  return {
    provider: "sportsevents365",
    exact: event.score >= 100,
    score: ticketSummary?.hasTickets ? event.score + 20 : event.score,
    rawScore: event.score,
    url: affiliateUrlFromEvent(event.raw, event.id),
    title: event.name || `Tickets: ${home} vs ${away}`,
    priceText,
    reason: event.score >= 100 ? "exact_event" : "partial_match",
    urlQuality: "event",
  };
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) {
    console.log("[SE365] skipped: missing config");
    return null;
  }

  const home = clean(input.homeName);
  const away = clean(input.awayName);
  const kickoff = clean(input.kickoffIso);

  if (!API_BASE || !home || !away || !kickoff) {
    console.log("[SE365] skipped: missing input", {
      apiBase: API_BASE,
      home,
      away,
      kickoff,
    });
    return null;
  }

  console.log("[SE365] resolving", {
    home,
    away,
    kickoff,
    apiBase: API_BASE,
  });

  const [homeParticipants, awayParticipants] = await Promise.all([
    findParticipantMatches(home),
    findParticipantMatches(away),
  ]);

  const participantMap = new Map<string, ParticipantMatch>();

  for (const p of [...homeParticipants, ...awayParticipants]) {
    if (!participantMap.has(p.id)) participantMap.set(p.id, p);
  }

  const participants = Array.from(participantMap.values());

  if (!participants.length) {
    console.log("[SE365] no participants found", { home, away });
    return null;
  }

  const eventLists = await Promise.all(
    participants.map((participant) => findEventsByParticipant(participant, kickoff))
  );

  const eventMap = new Map<string, EventMatch>();

  for (const event of eventLists.flat()) {
    const score = scoreEvent(event.raw, home, away, kickoff);
    if (score <= 0) continue;

    const existing = eventMap.get(event.id);
    const scoredEvent = { ...event, score };

    if (!existing || scoredEvent.score > existing.score) {
      eventMap.set(event.id, scoredEvent);
    }
  }

  const bestEvent = pickBestEvent(Array.from(eventMap.values()));

  if (!bestEvent) {
    console.log("[SE365] no matching event found", {
      home,
      away,
      participantCount: participants.length,
    });
    return null;
  }

  const ticketSummary = await getTicketsForEvent(bestEvent.id);

  const candidate = candidateFromEvent(bestEvent, home, away, ticketSummary);

  console.log("[SE365] result", {
    found: true,
    eventId: bestEvent.id,
    title: candidate.title,
    url: candidate.url,
    priceText: candidate.priceText,
    hasTickets: Boolean(ticketSummary?.hasTickets),
    score: candidate.score,
  });

  return candidate;
      }
