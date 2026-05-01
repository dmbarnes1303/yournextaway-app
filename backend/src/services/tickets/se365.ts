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

type Participant = {
  id: string;
  name: string;
  raw: any;
  score: number;
};

type EventCandidate = {
  id: string;
  name: string;
  raw: any;
  score: number;
};

type TicketSummary = {
  hasTickets: boolean;
  priceText: string | null;
  raw: any;
};

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
    .replace(/\bsl\b/g, " ")
    .replace(/\bsv\b/g, " ")
    .replace(/\bbalompie\b/g, "betis")
    .replace(/\bmunchen\b/g, "munich")
    .replace(/\bmuenchen\b/g, "munich")
    .replace(/\bmönchengladbach\b/g, "monchengladbach")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: unknown): string {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function aliasesFor(name: string): string[] {
  const preferred = getPreferredTeamName(name);

  return Array.from(
    new Set([
      name,
      preferred,
      ...expandTeamAliases(name),
      ...expandTeamAliases(preferred),
    ])
  )
    .map(normalize)
    .filter(Boolean);
}

function scoreAgainstAliases(value: string, aliases: string[]): number {
  const raw = normalize(value);
  const rawCompact = compact(value);

  if (!raw || !rawCompact) return 0;

  let best = 0;

  for (const alias of aliases) {
    const aliasCompact = compact(alias);
    if (!alias || !aliasCompact) continue;

    if (raw === alias || rawCompact === aliasCompact) best = Math.max(best, 100);
    else if (raw.includes(alias) || rawCompact.includes(aliasCompact)) best = Math.max(best, 90);
    else if (alias.includes(raw) || aliasCompact.includes(rawCompact)) best = Math.max(best, 75);
    else {
      const rawTokens = new Set(raw.split(" ").filter(Boolean));
      const aliasTokens = alias.split(" ").filter(Boolean);
      const matched = aliasTokens.filter((token) => rawTokens.has(token)).length;

      if (aliasTokens.length > 0) {
        best = Math.max(best, Math.round((matched / aliasTokens.length) * 70));
      }
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

function makeApiUrl(path: string): URL {
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
    const bodyPreview = body.slice(0, 600);

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
  if (!json) return [];

  const data = unwrap(json);

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(json?.[key])) return json[key];
  }

  return [];
}

function participantId(value: any): string {
  return clean(value?.id ?? value?.participantId ?? value?.participant_id);
}

function participantName(value: any): string {
  return clean(
    value?.name ??
      value?.title ??
      value?.caption ??
      value?.participantName ??
      value?.participant_name
  );
}

function eventId(value: any): string {
  return clean(value?.id ?? value?.eventId ?? value?.event_id);
}

function eventName(value: any): string {
  return clean(
    value?.name ??
      value?.title ??
      value?.caption ??
      value?.eventName ??
      value?.event_name ??
      value?.description
  );
}

function eventHome(value: any): string {
  return clean(
    value?.homeTeam?.name ??
      value?.home?.name ??
      value?.homeName ??
      value?.home_team_name ??
      value?.home_team
  );
}

function eventAway(value: any): string {
  return clean(
    value?.awayTeam?.name ??
      value?.away?.name ??
      value?.awayName ??
      value?.away_team_name ??
      value?.away_team
  );
}

function eventParticipants(value: any): string[] {
  if (!Array.isArray(value?.participants)) return [];

  return value.participants
    .map((participant: any) => participantName(participant))
    .filter(Boolean);
}

function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}/${date.getFullYear()}`;
}

function getDateRange(kickoffIso: string): { from: string; to: string } {
  const base = new Date(kickoffIso);

  const from = new Date(base);
  from.setDate(from.getDate() - 4);

  const to = new Date(base);
  to.setDate(to.getDate() + 4);

  return {
    from: formatDate(from),
    to: formatDate(to),
  };
}

async function fetchParticipantsForSearch(): Promise<any[]> {
  const routes = ["/participants", "/participants/top"];
  const all: any[] = [];

  for (const route of routes) {
    const url = makeApiUrl(route);
    url.searchParams.set("eventTypeId", FOOTBALL_EVENT_TYPE_ID);
    url.searchParams.set("perPage", "1000");

    const result = await fetchJson(url);
    const participants = extractArray(result.json, ["participants", "items", "data", "results"]);

    console.log("[SE365] participants", {
      route,
      status: result.status,
      count: participants.length,
      sample: participants.slice(0, 8).map((participant) => ({
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

  return Array.from(deduped.values());
}

async function findBestParticipant(teamName: string): Promise<Participant | null> {
  const aliases = aliasesFor(teamName);
  const participants = await fetchParticipantsForSearch();

  const ranked = participants
    .map((participant) => {
      const id = participantId(participant);
      const name = participantName(participant);

      return {
        id,
        name,
        raw: participant,
        score: scoreAgainstAliases(name, aliases),
      };
    })
    .filter((entry) => entry.id && entry.name && entry.score >= 55)
    .sort((a, b) => b.score - a.score);

  console.log("[SE365] participant lookup", {
    teamName,
    aliases,
    poolCount: participants.length,
    matched: ranked[0] ? { id: ranked[0].id, name: ranked[0].name, score: ranked[0].score } : null,
    top: ranked.slice(0, 6).map((entry) => ({
      id: entry.id,
      name: entry.name,
      score: entry.score,
    })),
  });

  return ranked[0] ?? null;
}

async function fetchEventsByParticipant(
  participant: Participant,
  kickoffIso: string
): Promise<EventCandidate[]> {
  const { from, to } = getDateRange(kickoffIso);

  const url = makeApiUrl(`/events/participant/${participant.id}`);
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
      participants: eventParticipants(event.raw),
    })),
  });

  return mapped;
}

function scoreEvent(event: EventCandidate, homeName: string, awayName: string): number {
  const homeAliases = aliasesFor(homeName);
  const awayAliases = aliasesFor(awayName);

  const fields = [
    event.name,
    eventHome(event.raw),
    eventAway(event.raw),
    ...eventParticipants(event.raw),
  ].filter(Boolean);

  const homeScore = Math.max(...fields.map((field) => scoreAgainstAliases(field, homeAliases)), 0);
  const awayScore = Math.max(...fields.map((field) => scoreAgainstAliases(field, awayAliases)), 0);

  if (homeScore < 55 || awayScore < 55) return 0;

  let score = homeScore + awayScore;

  score += scoreAgainstAliases(eventHome(event.raw), homeAliases) >= 55 ? 25 : 0;
  score += scoreAgainstAliases(eventAway(event.raw), awayAliases) >= 55 ? 25 : 0;

  return score;
}

function pickBestEvent(
  events: EventCandidate[],
  homeName: string,
  awayName: string
): EventCandidate | null {
  const ranked = events
    .map((event) => ({
      ...event,
      score: scoreEvent(event, homeName, awayName),
    }))
    .filter((event) => event.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log("[SE365] event scoring", {
    homeName,
    awayName,
    count: ranked.length,
    top: ranked.slice(0, 8).map((event) => ({
      id: event.id,
      name: event.name,
      score: event.score,
      home: eventHome(event.raw),
      away: eventAway(event.raw),
      participants: eventParticipants(event.raw),
    })),
  });

  return ranked[0] ?? null;
}

function extractTickets(json: any): any[] {
  return extractArray(json, ["tickets", "items", "data", "results", "ticketOptions"]);
}

function priceFromTicket(ticket: any): number | null {
  const raw =
    ticket?.ticketPrice ??
    ticket?.ticket_price ??
    ticket?.price ??
    ticket?.salePrice ??
    ticket?.minPrice ??
    ticket?.amount ??
    ticket?.totalPrice ??
    ticket?.ticket?.price ??
    null;

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function currencyFromTicket(ticket: any): string {
  return clean(
    ticket?.currency ??
      ticket?.priceCurrency ??
      ticket?.ticketCurrency ??
      ticket?.ticket?.currency ??
      "GBP"
  ).toUpperCase();
}

function formatPrice(amount: number, currency: string): string {
  if (currency === "GBP") return `£${amount}`;
  if (currency === "EUR") return `€${amount}`;
  if (currency === "USD") return `$${amount}`;
  return `${currency || "GBP"} ${amount}`;
}

function summarizeTickets(json: any): TicketSummary {
  const tickets = extractTickets(json);

  const priced = tickets
    .map((ticket) => ({
      price: priceFromTicket(ticket),
      currency: currencyFromTicket(ticket),
    }))
    .filter((entry) => entry.price != null)
    .sort((a, b) => Number(a.price) - Number(b.price));

  const cheapest = priced[0] ?? null;

  return {
    hasTickets: tickets.length > 0,
    priceText: cheapest?.price != null
      ? formatPrice(Number(cheapest.price), cheapest.currency)
      : tickets.length > 0
        ? "View live price"
        : null,
    raw: json,
  };
}

async function fetchTickets(eventIdValue: string): Promise<TicketSummary | null> {
  const id = clean(eventIdValue);
  if (!id) return null;

  const url = makeApiUrl(`/tickets/${id}`);

  const result = await fetchJson(url);

  if (!result.ok) {
    console.log("[SE365] tickets failed", {
      eventId: id,
      status: result.status,
    });
    return null;
  }

  const summary = summarizeTickets(result.json);

  console.log("[SE365] tickets", {
    eventId: id,
    status: result.status,
    hasTickets: summary.hasTickets,
    priceText: summary.priceText,
  });

  return summary;
}

function buildPublicUrl(event: any, id: string): string {
  const affiliateId = clean(env.se365AffiliateId);

  const possibleUrls = [
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

  for (const value of possibleUrls) {
    try {
      const parsed = new URL(value.startsWith("http") ? value : `${PUBLIC_BASE}${value}`);
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
      // ignore
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

  console.log("[SE365] resolve start", {
    homeName,
    awayName,
    kickoffIso,
    apiBase: API_BASE,
  });

  const [homeParticipant, awayParticipant] = await Promise.all([
    findBestParticipant(homeName),
    findBestParticipant(awayName),
  ]);

  const participants = [homeParticipant, awayParticipant].filter(Boolean) as Participant[];

  if (participants.length === 0) {
    console.log("[SE365] no participant IDs found", {
      homeName,
      awayName,
    });
    return null;
  }

  const eventLists = await Promise.all(
    participants.map((participant) => fetchEventsByParticipant(participant, kickoffIso))
  );

  const eventMap = new Map<string, EventCandidate>();

  for (const event of eventLists.flat()) {
    if (!eventMap.has(event.id)) eventMap.set(event.id, event);
  }

  const bestEvent = pickBestEvent(Array.from(eventMap.values()), homeName, awayName);

  if (!bestEvent) {
    console.log("[SE365] no matching event", {
      homeName,
      awayName,
      eventCount: eventMap.size,
    });
    return null;
  }

  const ticketSummary = await fetchTickets(bestEvent.id);

  // Important: still return the event if found. SE365 sometimes lists public tickets even
  // when the ticket endpoint shape is odd or fails parsing. The UI needs the route.
  const url = buildPublicUrl(bestEvent.raw, bestEvent.id);

  const candidate: TicketCandidate = {
    provider: "sportsevents365",
    exact: true,
    score: ticketSummary?.hasTickets ? 130 : 105,
    rawScore: ticketSummary?.hasTickets ? 130 : 105,
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
    hasTickets: Boolean(ticketSummary?.hasTickets),
    priceText: candidate.priceText,
  });

  return candidate;
}
