import { Buffer } from "node:buffer";

import { env, hasSe365Config } from "../../lib/env.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

const API_BASE = String(env.se365BaseUrl ?? "").replace(/\/+$/, "");
const PUBLIC_BASE = "https://www.sportsevents365.com";
const FOOTBALL_EVENT_TYPE_ID = "1000";

type FetchResult = {
  ok: boolean;
  status: number;
  json: any | null;
  bodyPreview: string;
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
  hasTickets: boolean;
  priceText: string | null;
  raw: any;
};

const PARTICIPANTS_CACHE = new Map<string, any[]>();
const EVENTS_CACHE = new Map<string, EventMatch[]>();
const TICKETS_CACHE = new Map<string, TicketSummary | null>();

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function stripAccents(value: unknown): string {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalize(value: unknown): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bfootball\b/g, " ")
    .replace(/\bsoccer\b/g, " ")
    .replace(/\bclub\b/g, " ")
    .replace(/\bfc\b/g, " ")
    .replace(/\bcf\b/g, " ")
    .replace(/\bsc\b/g, " ")
    .replace(/\bss\b/g, " ")
    .replace(/\bas\b/g, " ")
    .replace(/\bac\b/g, " ")
    .replace(/\bsv\b/g, " ")
    .replace(/\bbalompie\b/g, "betis")
    .replace(/\bbalompié\b/g, "betis")
    .replace(/\bmunchen\b/g, "munich")
    .replace(/\bmuenchen\b/g, "munich")
    .replace(/\bmönchengladbach\b/g, "monchengladbach")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: unknown): string {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function getAliases(name: string): string[] {
  const preferred = getPreferredTeamName(name);
  return Array.from(
    new Set([name, preferred, ...expandTeamAliases(name), ...expandTeamAliases(preferred)])
  )
    .map(normalize)
    .filter(Boolean);
}

function namesMatch(a: string, b: string): boolean {
  const aa = normalize(a);
  const bb = normalize(b);
  const ca = compact(a);
  const cb = compact(b);

  if (!aa || !bb || !ca || !cb) return false;

  return aa === bb || aa.includes(bb) || bb.includes(aa) || ca === cb || ca.includes(cb) || cb.includes(ca);
}

function aliasMatches(value: string, aliases: string[]): boolean {
  return aliases.some((alias) => namesMatch(value, alias));
}

function scoreNameAgainstAliases(value: string, aliases: string[]): number {
  const raw = normalize(value);
  const rawCompact = compact(value);
  if (!raw || !rawCompact) return 0;

  let best = 0;

  for (const alias of aliases) {
    const aliasCompact = compact(alias);
    if (!alias || !aliasCompact) continue;

    if (raw === alias || rawCompact === aliasCompact) best = Math.max(best, 100);
    else if (raw.includes(alias) || rawCompact.includes(aliasCompact)) best = Math.max(best, 90);
    else if (alias.includes(raw) || aliasCompact.includes(rawCompact)) best = Math.max(best, 78);
    else {
      const rawTokens = new Set(raw.split(" ").filter(Boolean));
      const aliasTokens = alias.split(" ").filter(Boolean);
      const matched = aliasTokens.filter((token) => rawTokens.has(token)).length;
      if (aliasTokens.length) best = Math.max(best, Math.round((matched / aliasTokens.length) * 70));
    }
  }

  return best;
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

function apiUrl(path: string): URL {
  const url = new URL(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`);
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

    const body = await res.text().catch(() => "");
    const bodyPreview = body.slice(0, 500);

    let json: any = null;
    try {
      json = body ? JSON.parse(body) : null;
    } catch {
      json = null;
    }

    console.log("[SE365] fetch", {
      url: url.toString(),
      status: res.status,
      ok: res.ok,
      bodyPreview,
    });

    return {
      ok: res.ok,
      status: res.status,
      json,
      bodyPreview,
    };
  } catch (error) {
    console.log("[SE365] fetch error", {
      url: url.toString(),
      message: error instanceof Error ? error.message : String(error),
    });

    return {
      ok: false,
      status: 0,
      json: null,
      bodyPreview: "",
    };
  }
}

function unwrap(json: any): any {
  return json?.data ?? json?.result ?? json?.results ?? json;
}

function extractArray(json: any, keys: string[]): any[] {
  const data = unwrap(json);

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(json?.[key])) return json[key];
  }

  return [];
}

function participantId(p: any): string {
  return clean(p?.id ?? p?.participantId ?? p?.participant_id);
}

function participantName(p: any): string {
  return clean(p?.name ?? p?.title ?? p?.caption ?? p?.participantName ?? p?.participant_name);
}

function eventId(e: any): string {
  return clean(e?.id ?? e?.eventId ?? e?.event_id);
}

function eventName(e: any): string {
  return clean(e?.name ?? e?.title ?? e?.caption ?? e?.eventName ?? e?.event_name ?? e?.description);
}

function eventHome(e: any): string {
  return clean(e?.homeTeam?.name ?? e?.home?.name ?? e?.homeName ?? e?.home_team_name ?? e?.home_team);
}

function eventAway(e: any): string {
  return clean(e?.awayTeam?.name ?? e?.away?.name ?? e?.awayName ?? e?.away_team_name ?? e?.away_team);
}

function participantNamesFromEvent(e: any): string[] {
  if (!Array.isArray(e?.participants)) return [];
  return e.participants.map(participantName).filter(Boolean);
}

function formatDateDdMmYyyy(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function getDateRange(kickoffIso: string): { from: string; to: string } {
  const base = new Date(kickoffIso);

  const from = new Date(base);
  from.setDate(from.getDate() - 4);

  const to = new Date(base);
  to.setDate(to.getDate() + 4);

  return {
    from: formatDateDdMmYyyy(from),
    to: formatDateDdMmYyyy(to),
  };
}

async function fetchParticipants(): Promise<any[]> {
  const cacheKey = "football_participants_v2";

  if (PARTICIPANTS_CACHE.has(cacheKey)) {
    return PARTICIPANTS_CACHE.get(cacheKey) ?? [];
  }

  const routes = ["/participants", "/participants/top"];
  const all: any[] = [];

  for (const route of routes) {
    const url = apiUrl(route);
    url.searchParams.set("eventTypeId", FOOTBALL_EVENT_TYPE_ID);
    url.searchParams.set("perPage", "1000");

    const result = await fetchJson(url);
    const participants = extractArray(result.json, ["participants", "items", "data", "results"]);

    console.log("[SE365] participants route", {
      route,
      status: result.status,
      count: participants.length,
      sample: participants.slice(0, 8).map((p) => ({
        id: participantId(p),
        name: participantName(p),
      })),
    });

    all.push(...participants);
  }

  const deduped = new Map<string, any>();

  for (const participant of all) {
    const id = participantId(participant);
    if (id && !deduped.has(id)) deduped.set(id, participant);
  }

  const finalList = Array.from(deduped.values());
  PARTICIPANTS_CACHE.set(cacheKey, finalList);

  return finalList;
}

async function findParticipant(teamName: string): Promise<ParticipantMatch | null> {
  const aliases = getAliases(teamName);
  const participants = await fetchParticipants();

  const ranked = participants
    .map((participant) => {
      const id = participantId(participant);
      const name = participantName(participant);
      return {
        id,
        name,
        raw: participant,
        score: scoreNameAgainstAliases(name, aliases),
      };
    })
    .filter((entry) => entry.id && entry.name && entry.score >= 60)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0] ?? null;

  console.log("[SE365] participant lookup", {
    teamName,
    aliases,
    poolCount: participants.length,
    matched: best ? { id: best.id, name: best.name, score: best.score } : null,
    top: ranked.slice(0, 5).map((x) => ({ id: x.id, name: x.name, score: x.score })),
  });

  return best;
}

async function fetchEventsByParticipant(
  participant: ParticipantMatch,
  kickoffIso: string
): Promise<EventMatch[]> {
  const { from, to } = getDateRange(kickoffIso);
  const cacheKey = `${participant.id}|${from}|${to}`;

  if (EVENTS_CACHE.has(cacheKey)) {
    return EVENTS_CACHE.get(cacheKey) ?? [];
  }

  const url = apiUrl(`/events/participant/${participant.id}`);
  url.searchParams.set("eventTypeId", FOOTBALL_EVENT_TYPE_ID);
  url.searchParams.set("dateFrom", from);
  url.searchParams.set("dateTo", to);
  url.searchParams.set("perPage", "100");

  const result = await fetchJson(url);
  const events = extractArray(result.json, ["events", "items", "data", "results"]);

  const mapped = events
    .map((event) => ({
      id: eventId(event),
      name: eventName(event),
      raw: event,
      score: 0,
    }))
    .filter((event) => event.id);

  console.log("[SE365] events by participant", {
    participantId: participant.id,
    participantName: participant.name,
    status: result.status,
    from,
    to,
    count: mapped.length,
    sample: mapped.slice(0, 8).map((event) => ({
      id: event.id,
      name: event.name,
      home: eventHome(event.raw),
      away: eventAway(event.raw),
      participants: participantNamesFromEvent(event.raw),
    })),
  });

  EVENTS_CACHE.set(cacheKey, mapped);
  return mapped;
}

function scoreEvent(event: EventMatch, homeName: string, awayName: string): number {
  const homeAliases = getAliases(homeName);
  const awayAliases = getAliases(awayName);

  const fields = [
    event.name,
    eventHome(event.raw),
    eventAway(event.raw),
    ...participantNamesFromEvent(event.raw),
  ].filter(Boolean);

  const homeHit = fields.some((field) => aliasMatches(field, homeAliases));
  const awayHit = fields.some((field) => aliasMatches(field, awayAliases));

  if (!homeHit || !awayHit) return 0;

  let score = 100;

  if (aliasMatches(eventHome(event.raw), homeAliases)) score += 25;
  if (aliasMatches(eventAway(event.raw), awayAliases)) score += 25;
  if (aliasMatches(event.name, homeAliases)) score += 15;
  if (aliasMatches(event.name, awayAliases)) score += 15;

  return score;
}

function pickBestEvent(events: EventMatch[], homeName: string, awayName: string): EventMatch | null {
  const scored = events
    .map((event) => ({
      ...event,
      score: scoreEvent(event, homeName, awayName),
    }))
    .filter((event) => event.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log("[SE365] event match scoring", {
    homeName,
    awayName,
    count: scored.length,
    top: scored.slice(0, 5).map((event) => ({
      id: event.id,
      name: event.name,
      score: event.score,
      home: eventHome(event.raw),
      away: eventAway(event.raw),
      participants: participantNamesFromEvent(event.raw),
    })),
  });

  return scored[0] ?? null;
}

function extractTickets(json: any): any[] {
  return extractArray(json, ["tickets", "items", "data", "results", "ticketOptions"]);
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
    ticket?.ticket_price ??
    null;

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function currencyFromTicket(ticket: any): string {
  return clean(ticket?.currency ?? ticket?.priceCurrency ?? ticket?.ticket?.currency ?? "GBP").toUpperCase();
}

function formatPrice(amount: number, currency: string): string {
  if (currency === "GBP") return `£${amount}`;
  if (currency === "EUR") return `€${amount}`;
  if (currency === "USD") return `$${amount}`;
  return `${currency || "GBP"} ${amount}`;
}

function extractTicketSummary(json: any): TicketSummary {
  const tickets = extractTickets(json);

  const priced = tickets
    .map((ticket) => ({
      ticket,
      price: priceFromTicket(ticket),
      currency: currencyFromTicket(ticket),
    }))
    .filter((entry) => entry.price != null)
    .sort((a, b) => Number(a.price) - Number(b.price));

  const cheapest = priced[0] ?? null;

  return {
    hasTickets: tickets.length > 0,
    priceText: cheapest?.price != null ? formatPrice(Number(cheapest.price), cheapest.currency) : "View live price",
    raw: json,
  };
}

async function getTicketsForEvent(eventIdValue: string): Promise<TicketSummary | null> {
  const id = clean(eventIdValue);
  if (!id) return null;

  if (TICKETS_CACHE.has(id)) {
    return TICKETS_CACHE.get(id) ?? null;
  }

  const url = apiUrl(`/tickets/${id}`);

  const result = await fetchJson(url);
  const summary = result.ok ? extractTicketSummary(result.json) : null;

  console.log("[SE365] tickets by event", {
    eventId: id,
    status: result.status,
    hasTickets: Boolean(summary?.hasTickets),
    priceText: summary?.priceText ?? null,
  });

  TICKETS_CACHE.set(id, summary);
  return summary;
}

function eventPublicUrl(event: any, id: string): string {
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

  for (const rawUrl of rawUrls) {
    try {
      const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `${PUBLIC_BASE}${rawUrl}`);
      const host = parsed.hostname.toLowerCase();

      if (
        host === "sportsevents365.com" ||
        host === "www.sportsevents365.com" ||
        host === "tickets-partners.com" ||
        host === "www.tickets-partners.com"
      ) {
        if (affiliateId) parsed.searchParams.set("a_aid", affiliateId);
        return parsed.toString();
      }
    } catch {
      // ignore bad URL
    }
  }

  const fallback = new URL(`${PUBLIC_BASE}/event/${id}`);
  if (affiliateId) fallback.searchParams.set("a_aid", affiliateId);
  return fallback.toString();
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) {
    console.log("[SE365] skipped: missing config");
    return null;
  }

  const homeName = clean(input.homeName);
  const awayName = clean(input.awayName);
  const kickoffIso = clean(input.kickoffIso);

  if (!API_BASE || !homeName || !awayName || !kickoffIso) {
    console.log("[SE365] skipped: missing input", {
      apiBase: API_BASE,
      homeName,
      awayName,
      kickoffIso,
    });
    return null;
  }

  console.log("[SE365] resolving basic flow", {
    homeName,
    awayName,
    kickoffIso,
    apiBase: API_BASE,
  });

  const [homeParticipant, awayParticipant] = await Promise.all([
    findParticipant(homeName),
    findParticipant(awayName),
  ]);

  const participants = [homeParticipant, awayParticipant].filter(Boolean) as ParticipantMatch[];

  if (participants.length === 0) {
    console.log("[SE365] no participant found", { homeName, awayName });
    return null;
  }

  const eventLists = await Promise.all(
    participants.map((participant) => fetchEventsByParticipant(participant, kickoffIso))
  );

  const eventMap = new Map<string, EventMatch>();

  for (const event of eventLists.flat()) {
    if (!eventMap.has(event.id)) eventMap.set(event.id, event);
  }

  const bestEvent = pickBestEvent(Array.from(eventMap.values()), homeName, awayName);

  if (!bestEvent) {
    console.log("[SE365] no matching event found", {
      homeName,
      awayName,
      eventCount: eventMap.size,
    });
    return null;
  }

  const ticketSummary = await getTicketsForEvent(bestEvent.id);

  const url = eventPublicUrl(bestEvent.raw, bestEvent.id);

  const candidate: TicketCandidate = {
    provider: "sportsevents365",
    exact: true,
    score: ticketSummary?.hasTickets ? 120 : 95,
    rawScore: ticketSummary?.hasTickets ? 120 : 95,
    url,
    title: bestEvent.name || `${homeName} vs ${awayName}`,
    priceText: ticketSummary?.priceText ?? "View live price",
    reason: "exact_event",
    urlQuality: "event",
  };

  console.log("[SE365] candidate accepted", {
    eventId: bestEvent.id,
    title: candidate.title,
    url: candidate.url,
    priceText: candidate.priceText,
    hasTickets: Boolean(ticketSummary?.hasTickets),
  });

  return candidate;
}
