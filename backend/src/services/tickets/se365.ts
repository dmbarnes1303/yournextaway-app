import { Buffer } from "node:buffer";

import { env, hasSe365Config } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

const API_BASE = env.se365BaseUrl;
const PUBLIC_BASE = "https://www.sportsevents365.com";

const FOOTBALL_EVENT_TYPE_ID = "1";

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
const EVENTS_CACHE = new Map<string, EventMatch[]>();
const TICKETS_CACHE = new Map<string, TicketSummary | null>();

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function normalize(v: unknown): string {
  return clean(v)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bfc\b/g, "")
    .replace(/\bss\b/g, "")
    .replace(/\bas\b/g, "")
    .replace(/\bcalcio\b/g, "")
    .replace(/\bfootball club\b/g, "")
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

function addCommonParams(url: URL): URL {
  appendApiKey(url);
  url.searchParams.set("perPage", "100");
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

    if (!res.ok) {
      return { ok: false, status: res.status, json: null };
    }

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
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function getDateRange(kickoffIso: string): { from: string; to: string } {
  const d = new Date(kickoffIso);

  const from = new Date(d);
  from.setDate(from.getDate() - 2);

  const to = new Date(d);
  to.setDate(to.getDate() + 2);

  return {
    from: formatDateDdMmYyyy(from),
    to: formatDateDdMmYyyy(to),
  };
}

function eventName(ev: any): string {
  return clean(
    ev?.name ||
      ev?.title ||
      ev?.caption ||
      ev?.eventName ||
      ev?.meta?.title ||
      ev?.description
  );
}

function participantName(participant: any): string {
  return clean(
    participant?.name ||
      participant?.title ||
      participant?.participantName ||
      participant?.caption
  );
}

function participantId(participant: any): string {
  return clean(participant?.id || participant?.participantId);
}

function eventId(event: any): string {
  return clean(event?.id || event?.eventId);
}

function teamName(ev: any, side: "home" | "away"): string {
  if (side === "home") {
    return clean(ev?.homeTeam?.name || ev?.home?.name || ev?.homeName);
  }

  return clean(ev?.awayTeam?.name || ev?.away?.name || ev?.awayName);
}

function participantNamesFromEvent(ev: any): string[] {
  if (!Array.isArray(ev?.participants)) return [];

  return ev.participants
    .map((participant: any) => participantName(participant))
    .filter(Boolean);
}

function possibleTextFields(value: any): string[] {
  const fields = [
    eventName(value),
    teamName(value, "home"),
    teamName(value, "away"),
    ...participantNamesFromEvent(value),
  ];

  return fields.map(clean).filter(Boolean);
}

function namesLooselyMatch(a: string, b: string): boolean {
  const aa = normalize(a);
  const bb = normalize(b);
  const ca = compact(a);
  const cb = compact(b);

  if (!aa || !bb || !ca || !cb) return false;

  return (
    aa === bb ||
    aa.includes(bb) ||
    bb.includes(aa) ||
    ca === cb ||
    ca.includes(cb) ||
    cb.includes(ca)
  );
}

function participantMatchesTeam(participant: any, team: string): boolean {
  const name = participantName(participant);
  return namesLooselyMatch(name, team);
}

function matchEvent(ev: any, home: string, away: string): boolean {
  const fields = possibleTextFields(ev);

  const hasHome = fields.some((field) => namesLooselyMatch(field, home));
  const hasAway = fields.some((field) => namesLooselyMatch(field, away));

  return hasHome && hasAway;
}

function eventDateText(event: any): string {
  return clean(
    event?.dateOfEvent ||
      event?.date ||
      event?.eventDate ||
      event?.startDate ||
      event?.kickoff ||
      event?.kickoffIso
  );
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

function buildPublicSearchUrl(home: string, away: string, kickoffIso: string): string {
  const affiliateId = clean(env.se365AffiliateId);
  const kickoffDate = clean(kickoffIso).slice(0, 10);

  const url = new URL(`${PUBLIC_BASE}/search`);
  url.searchParams.set("q", `${home} ${away}`);

  if (kickoffDate) {
    url.searchParams.set("date", kickoffDate);
  }

  if (affiliateId) {
    url.searchParams.set("a_aid", affiliateId);
  }

  return url.toString();
}

function affiliateUrlFromEvent(event: any, id: string): string {
  const affiliateId = clean(env.se365AffiliateId);

  const apiUrl =
    clean(event?.eventUrl) ||
    clean(event?.url) ||
    clean(event?.link) ||
    clean(event?.affiliateUrl);

  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      if (affiliateId) parsed.searchParams.set("a_aid", affiliateId);
      return parsed.toString();
    } catch {
      // fall through
    }
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
  return (
    clean(ticket?.currency) ||
    clean(ticket?.priceCurrency) ||
    clean(ticket?.ticket?.currency) ||
    "GBP"
  );
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
    .filter((entry) => entry.price != null)
    .sort((a, b) => Number(a.price) - Number(b.price));

  const cheapest = priced[0];

  return {
    hasTickets: true,
    priceText:
      cheapest?.price != null
        ? formatPrice(Number(cheapest.price), cheapest.currency)
        : "View live price",
    raw: json,
  };
}

function fallbackSearchCandidate(
  home: string,
  away: string,
  kickoffIso: string
): TicketCandidate {
  return {
    provider: "sportsevents365",
    exact: false,
    score: 45,
    rawScore: 45,
    url: buildPublicSearchUrl(home, away, kickoffIso),
    title: `SportsEvents365: ${home} vs ${away}`,
    priceText: "View live price",
    reason: "search_fallback",
    urlQuality: "search",
  };
}

function candidateFromEvent(
  event: any,
  home: string,
  away: string,
  ticketSummary: TicketSummary | null
): TicketCandidate | null {
  const id = eventId(event);
  if (!id) return null;

  return {
    provider: "sportsevents365",
    exact: true,
    score: ticketSummary?.hasTickets ? 98 : 90,
    rawScore: ticketSummary?.hasTickets ? 98 : 90,
    url: affiliateUrlFromEvent(event, id),
    title: eventName(event) || `Tickets: ${home} vs ${away}`,
    priceText: ticketSummary?.priceText ?? "View live price",
    reason: "exact_event",
    urlQuality: "event",
  };
}

async function findParticipant(team: string): Promise<ParticipantMatch | null> {
  const cacheKey = normalize(team);
  if (PARTICIPANT_CACHE.has(cacheKey)) {
    return PARTICIPANT_CACHE.get(cacheKey) ?? null;
  }

  const url = addCommonParams(new URL(`${API_BASE}/participants`));
  url.searchParams.set("q", team);
  url.searchParams.set("search", team);
  url.searchParams.set("eventTypeId", FOOTBALL_EVENT_TYPE_ID);

  const result = await fetchJson(url);
  const participants = extractParticipants(result.json);
  const match = pickBestParticipant(participants, team);

  console.log("[SE365] participant lookup", {
    team,
    status: result.status,
    count: participants.length,
    matched: match ? { id: match.id, name: match.name } : null,
    sample: participants.slice(0, 8).map((participant) => ({
      id: participantId(participant),
      name: participantName(participant),
    })),
  });

  PARTICIPANT_CACHE.set(cacheKey, match);
  return match;
}

async function findEventsByParticipant(
  participant: ParticipantMatch,
  kickoffIso: string
): Promise<EventMatch[]> {
  const { from, to } = getDateRange(kickoffIso);
  const cacheKey = `${participant.id}|${from}|${to}`;

  if (EVENTS_CACHE.has(cacheKey)) {
    return EVENTS_CACHE.get(cacheKey) ?? [];
  }

  const url = addCommonParams(new URL(`${API_BASE}/events/participant/${participant.id}`));
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
      date: eventDateText(event.raw),
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

async function tryDirectEventBySe365Id(
  maybeSe365Id: string,
  home: string,
  away: string
): Promise<EventMatch | null> {
  if (!maybeSe365Id) return null;

  const url = appendApiKey(new URL(`${API_BASE}/events/${maybeSe365Id}`));
  url.searchParams.set("perPage", "25");

  const result = await fetchJson(url);
  const event = unwrapData(result.json);

  if (event?.id && matchEvent(event, home, away)) {
    const match = {
      id: eventId(event),
      name: eventName(event),
      raw: event,
    };

    console.log("[SE365] direct event match", {
      fixtureId: maybeSe365Id,
      eventId: match.id,
      name: match.name,
    });

    return match;
  }

  console.log("[SE365] direct event id did not match", {
    fixtureId: maybeSe365Id,
    status: result.status,
    returnedId: event?.id ?? null,
    returnedName: eventName(event),
    returnedParticipants: participantNamesFromEvent(event),
  });

  return null;
}

function pickBestEvent(
  events: EventMatch[],
  home: string,
  away: string
): EventMatch | null {
  const matches = events.filter((event) => matchEvent(event.raw, home, away));

  if (matches.length === 0) return null;

  return matches.sort((a, b) => {
    const aExactName =
      normalize(a.name).includes(normalize(home)) &&
      normalize(a.name).includes(normalize(away));
    const bExactName =
      normalize(b.name).includes(normalize(home)) &&
      normalize(b.name).includes(normalize(away));

    if (aExactName && !bExactName) return -1;
    if (!aExactName && bExactName) return 1;

    return a.name.localeCompare(b.name);
  })[0];
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) {
    console.log("[SE365] skipped: missing config", {
      hasBaseUrl: Boolean(clean(env.se365BaseUrl)),
      hasApiKey: Boolean(clean(env.se365ApiKey)),
      hasUsername: Boolean(clean(env.se365HttpUsername)),
      hasPassword: Boolean(clean(env.se365ApiPassword)),
      hasAffiliateId: Boolean(clean(env.se365AffiliateId)),
    });

    return null;
  }

  const home = clean(input.homeName);
  const away = clean(input.awayName);
  const kickoff = clean(input.kickoffIso);
  const fixtureId = clean(input.fixtureId);

  if (!home || !away || !kickoff) {
    console.log("[SE365] skipped: missing input", { home, away, kickoff });
    return null;
  }

  console.log("[SE365] resolving", {
    home,
    away,
    kickoff,
    fixtureId,
    apiBase: API_BASE,
    hasApiKey: Boolean(clean(env.se365ApiKey)),
    hasUsername: Boolean(clean(env.se365HttpUsername)),
    hasPassword: Boolean(clean(env.se365ApiPassword)),
    hasAffiliateId: Boolean(clean(env.se365AffiliateId)),
  });

  const directEvent = await tryDirectEventBySe365Id(fixtureId, home, away);

  if (directEvent) {
    const ticketSummary = await getTicketsForEvent(directEvent.id);
    const candidate = candidateFromEvent(directEvent.raw, home, away, ticketSummary);

    if (candidate) {
      console.log("[SE365] result from direct event", {
        eventId: directEvent.id,
        title: candidate.title,
        url: candidate.url,
        priceText: candidate.priceText,
      });

      return candidate;
    }
  }

  const [homeParticipant, awayParticipant] = await Promise.all([
    findParticipant(home),
    findParticipant(away),
  ]);

  if (!homeParticipant && !awayParticipant) {
    console.log("[SE365] no participants found; returning fallback", {
      home,
      away,
      kickoff,
    });

    return fallbackSearchCandidate(home, away, kickoff);
  }

  const eventSources = [homeParticipant, awayParticipant].filter(Boolean) as ParticipantMatch[];

  const eventLists = await Promise.all(
    eventSources.map((participant) => findEventsByParticipant(participant, kickoff))
  );

  const allEvents = eventLists.flat();
  const dedupedEvents = new Map<string, EventMatch>();

  for (const event of allEvents) {
    if (!dedupedEvents.has(event.id)) {
      dedupedEvents.set(event.id, event);
    }
  }

  const bestEvent = pickBestEvent(Array.from(dedupedEvents.values()), home, away);

  if (!bestEvent) {
    console.log("[SE365] no matching event found after participant discovery; returning fallback", {
      home,
      away,
      kickoff,
      participants: eventSources.map((participant) => ({
        id: participant.id,
        name: participant.name,
      })),
      eventCount: dedupedEvents.size,
    });

    return fallbackSearchCandidate(home, away, kickoff);
  }

  const ticketSummary = await getTicketsForEvent(bestEvent.id);
  const candidate = candidateFromEvent(bestEvent.raw, home, away, ticketSummary);

  if (!candidate) {
    console.log("[SE365] matched event but could not build candidate; returning fallback", {
      eventId: bestEvent.id,
      name: bestEvent.name,
    });

    return fallbackSearchCandidate(home, away, kickoff);
  }

  console.log("[SE365] result", {
    eventId: bestEvent.id,
    title: candidate.title,
    url: candidate.url,
    priceText: candidate.priceText,
    hasTickets: Boolean(ticketSummary?.hasTickets),
  });

  return candidate;
}
