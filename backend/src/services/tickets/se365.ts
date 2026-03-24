import { env, hasSe365Config } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";

type Se365Event = {
  id?: number | string;
  eventId?: number | string;
  name?: string;
  event_name?: string;
  title?: string;
  eventTitle?: string;
  startDate?: string;
  start_date?: string;
  date?: string;
  event_date?: string;
  eventDate?: string;
  venue?: {
    name?: string;
    city?: string;
    country?: string;
  };
  category?: {
    id?: number | string;
    name?: string;
  };
  url?: string;
  event_url?: string;
  eventUrl?: string;
};

type Se365EventsResponse = {
  events?: Se365Event[];
  data?: Se365Event[];
  items?: Se365Event[];
  response?: Se365Event[];
  results?: Se365Event[];
};

type Se365TicketItem = {
  id?: number | string;
  ticketId?: number | string;
  minPrice?: number | string;
  min_price?: number | string;
  lowestPrice?: number | string;
  lowest_price?: number | string;
  price?: number | string;
  priceTotal?: number | string;
  price_total?: number | string;
  pricePerTicket?: number | string;
  price_per_ticket?: number | string;
  currency?: string;
  currencyCode?: string;
  currency_code?: string;
  url?: string;
  event_url?: string;
  eventUrl?: string;
};

type Se365TicketsResponse = {
  tickets?: Se365TicketItem[];
  data?: Se365TicketItem[];
  items?: Se365TicketItem[];
  response?: Se365TicketItem[];
  results?: Se365TicketItem[];
};

const SE365_FETCH_TIMEOUT_MS = 7000;
const SE365_FALLBACK_SCORE = 24;
const FOOTBALL_EVENT_TYPE_ID = "1000";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function norm(v: unknown): string {
  return clean(v).toLowerCase();
}

function safeDate(v?: string): Date | null {
  const s = clean(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function absDays(a: Date, b: Date): number {
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / 86400000);
}

function eventId(ev: Se365Event): string {
  return clean(ev.id) || clean(ev.eventId);
}

function eventName(ev: Se365Event): string {
  return (
    clean(ev.name) ||
    clean(ev.event_name) ||
    clean(ev.title) ||
    clean(ev.eventTitle)
  );
}

function eventDate(ev: Se365Event): string {
  return (
    clean(ev.startDate) ||
    clean(ev.start_date) ||
    clean(ev.date) ||
    clean(ev.event_date) ||
    clean(ev.eventDate)
  );
}

function eventUrl(ev: Se365Event): string {
  return clean(ev.url) || clean(ev.event_url) || clean(ev.eventUrl);
}

function eventVenueName(ev: Se365Event): string {
  return clean(ev.venue?.name);
}

function eventVenueCity(ev: Se365Event): string {
  return clean(ev.venue?.city);
}

function eventVenueCountry(ev: Se365Event): string {
  return clean(ev.venue?.country);
}

function eventCategoryName(ev: Se365Event): string {
  return clean(ev.category?.name);
}

function appendAffiliate(url: string): string {
  const base = clean(url);
  if (!base) return "";
  if (/\ba_aid=/.test(base)) return base;

  const affiliateId = clean(env.se365AffiliateId);
  if (!affiliateId) return base;

  const joiner = base.includes("?") ? "&" : "?";

  if (affiliateId.includes("=")) {
    return `${base}${joiner}${affiliateId}`;
  }

  return `${base}${joiner}a_aid=${encodeURIComponent(affiliateId)}`;
}

function numberFromUnknown(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const raw = clean(v);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function ticketPriceNumber(ticket: Se365TicketItem): number | null {
  return (
    numberFromUnknown(ticket.minPrice) ??
    numberFromUnknown(ticket.min_price) ??
    numberFromUnknown(ticket.lowestPrice) ??
    numberFromUnknown(ticket.lowest_price) ??
    numberFromUnknown(ticket.pricePerTicket) ??
    numberFromUnknown(ticket.price_per_ticket) ??
    numberFromUnknown(ticket.price) ??
    numberFromUnknown(ticket.priceTotal) ??
    numberFromUnknown(ticket.price_total) ??
    null
  );
}

function ticketCurrency(ticket: Se365TicketItem): string {
  return (
    clean(ticket.currencyCode) ||
    clean(ticket.currency_code) ||
    clean(ticket.currency)
  );
}

function ticketPriceText(ticket: Se365TicketItem): string | null {
  const price = ticketPriceNumber(ticket);
  const currency = ticketCurrency(ticket);

  if (price == null && !currency) return null;
  if (price != null && currency) return `${price} ${currency}`.trim();
  if (price != null) return String(price);
  return currency || null;
}

function ticketUrl(ticket: Se365TicketItem): string {
  return clean(ticket.url) || clean(ticket.event_url) || clean(ticket.eventUrl);
}

function containsTeamsLoose(
  name: string,
  homeVariants: string[],
  awayVariants: string[]
): boolean {
  const n = norm(name);
  const hasHome = homeVariants.some((home) => n.includes(norm(home)));
  const hasAway = awayVariants.some((away) => n.includes(norm(away)));
  return hasHome && hasAway;
}

function textContainsVariant(name: string, variant: string): boolean {
  const haystack = ` ${norm(name)} `;
  const needle = ` ${norm(variant)} `;
  return haystack.includes(needle);
}

function isBadVariant(name: string): boolean {
  const variants = [
    "women",
    "women's",
    "ladies",
    "female",
    "feminine",
    "femeni",
    "femenino",
    "feminino",
    "u17",
    "u18",
    "u19",
    "u20",
    "u21",
    "u23",
    "youth",
    "academy",
    "b team",
    "reserves",
    "reserve",
    "legends",
  ];

  for (const variant of variants) {
    if (textContainsVariant(name, variant)) return true;
  }

  const n = norm(name);
  if (/(^|[\s-])ii($|[\s-])/.test(n)) return true;
  if (/(^|[\s-])b($|[\s-])/.test(n)) return true;

  return false;
}

function scoreEvent(ev: Se365Event, input: TicketResolveInput): number {
  let score = 0;

  const name = eventName(ev);
  const homeVariants = expandTeamAliases(input.homeName);
  const awayVariants = expandTeamAliases(input.awayName);

  if (name && containsTeamsLoose(name, homeVariants, awayVariants)) {
    score += 62;
  }

  if (name && isBadVariant(name)) {
    score -= 1000;
  }

  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));

  if (kickoff && evDt) {
    const diff = absDays(kickoff, evDt);
    if (diff === 0) score += 25;
    else if (diff === 1) score += 15;
    else if (diff === 2) score += 8;
    else if (diff > 2) score -= 1000;
  }

  if (eventVenueName(ev)) score += 2;
  if (eventVenueCity(ev)) score += 1;
  if (eventVenueCountry(ev)) score += 1;

  const category = norm(eventCategoryName(ev));
  if (category.includes("football")) score += 5;
  if (eventUrl(ev)) score += 3;

  return score;
}

function isStrongEnough(score: number): boolean {
  return score >= 55;
}

function isExactEvent(
  ev: Se365Event,
  input: TicketResolveInput,
  score: number
): boolean {
  const name = eventName(ev);
  const homeVariants = expandTeamAliases(input.homeName);
  const awayVariants = expandTeamAliases(input.awayName);

  if (!name || isBadVariant(name)) return false;
  if (!containsTeamsLoose(name, homeVariants, awayVariants)) return false;

  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));
  if (!kickoff || !evDt) return false;

  return absDays(kickoff, evDt) === 0 && score >= 85;
}

function summarizeEvent(ev: Se365Event) {
  return {
    id: eventId(ev) || null,
    name: eventName(ev) || null,
    date: eventDate(ev) || null,
    venue: eventVenueName(ev) || null,
    city: eventVenueCity(ev) || null,
    country: eventVenueCountry(ev) || null,
    category: eventCategoryName(ev) || null,
    url: eventUrl(ev) || null,
  };
}

function summarizeTicket(ticket: Se365TicketItem) {
  return {
    id: clean(ticket.id) || clean(ticket.ticketId) || null,
    priceText: ticketPriceText(ticket),
    url: ticketUrl(ticket) || null,
  };
}

function extractEvents(json: Se365EventsResponse | null): Se365Event[] {
  if (!json) return [];
  if (Array.isArray(json.events)) return json.events;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.response)) return json.response;
  if (Array.isArray(json.results)) return json.results;
  return [];
}

function extractTickets(json: Se365TicketsResponse | null): Se365TicketItem[] {
  if (!json) return [];
  if (Array.isArray(json.tickets)) return json.tickets;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.response)) return json.response;
  if (Array.isArray(json.results)) return json.results;
  return [];
}

function buildTrackedSearchFallback(input: TicketResolveInput): string | null {
  const home = getPreferredTeamName(input.homeName);
  const away = getPreferredTeamName(input.awayName);
  const league = clean(input.leagueName);

  const q = league ? `${home} vs ${away} ${league}` : `${home} vs ${away}`;
  if (!q) return null;

  const url = new URL("https://www.sportsevents365.com/events/search");
  url.searchParams.set("q", q);

  const aidRaw = clean(env.se365AffiliateId);
  if (aidRaw) {
    if (aidRaw.includes("=")) {
      const [k, v] = aidRaw.split("=");
      if (k && v) url.searchParams.set(k, v);
    } else {
      url.searchParams.set("a_aid", aidRaw);
    }
  }

  return url.toString();
}

function buildBasicAuthHeader(): string | null {
  const username =
    clean(env.se365HttpUsername) || clean(env.se365HttpSource) || "";
  const password = clean(env.se365ApiPassword);

  if (!username || !password) return null;

  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function buildRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const basicAuth = buildBasicAuthHeader();
  if (basicAuth) {
    headers.Authorization = basicAuth;
  }

  return headers;
}

function buildEventsUrl(page: number): string {
  const base = env.se365BaseUrl.replace(/\/+$/, "");
  const url = new URL(
    `${base}/events/event-type/${encodeURIComponent(FOOTBALL_EVENT_TYPE_ID)}`
  );

  if (clean(env.se365ApiKey)) {
    url.searchParams.set("apiKey", clean(env.se365ApiKey));
  }

  url.searchParams.set("page", String(page));
  return url.toString();
}

function buildTicketsUrl(eventIdValue: string): string {
  const base = env.se365BaseUrl.replace(/\/+$/, "");
  const url = new URL(`${base}/tickets/${encodeURIComponent(eventIdValue)}`);

  if (clean(env.se365ApiKey)) {
    url.searchParams.set("apiKey", clean(env.se365ApiKey));
  }

  return url.toString();
}

async function fetchJson<T>(url: string): Promise<{
  ok: boolean;
  status: number;
  text: string;
  json: T | null;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SE365_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: buildRequestHeaders(),
      signal: controller.signal,
    });

    const text = await res.text().catch(() => "");
    let json: T | null = null;

    try {
      json = text ? (JSON.parse(text) as T) : null;
    } catch {
      json = null;
    }

    return {
      ok: res.ok,
      status: res.status,
      text,
      json,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchEventsPage(page: number): Promise<Se365Event[]> {
  const url = buildEventsUrl(page);

  try {
    const result = await fetchJson<Se365EventsResponse>(url);

    if (!result.ok) {
      console.log("[SE365] events non-200 response", {
        url,
        status: result.status,
        body: result.text.slice(0, 500),
      });
      return [];
    }

    const events = extractEvents(result.json);

    console.log("[SE365] events page result", {
      page,
      url,
      count: events.length,
      sample: events.slice(0, 3).map(summarizeEvent),
    });

    return events;
  } catch (error) {
    console.log("[SE365] events fetch error", {
      page,
      url,
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function fetchTicketsForEvent(eventIdValue: string): Promise<Se365TicketItem[]> {
  const url = buildTicketsUrl(eventIdValue);

  try {
    const result = await fetchJson<Se365TicketsResponse>(url);

    if (!result.ok) {
      console.log("[SE365] tickets non-200 response", {
        eventId: eventIdValue,
        url,
        status: result.status,
        body: result.text.slice(0, 500),
      });
      return [];
    }

    const tickets = extractTickets(result.json);

    console.log("[SE365] tickets result", {
      eventId: eventIdValue,
      url,
      count: tickets.length,
      sample: tickets.slice(0, 5).map(summarizeTicket),
    });

    return tickets;
  } catch (error) {
    console.log("[SE365] tickets fetch error", {
      eventId: eventIdValue,
      url,
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function chooseBestTicket(tickets: Se365TicketItem[]): Se365TicketItem | null {
  if (!tickets.length) return null;

  const sorted = [...tickets].sort((a, b) => {
    const aPrice = ticketPriceNumber(a);
    const bPrice = ticketPriceNumber(b);

    if (aPrice != null && bPrice != null && aPrice !== bPrice) {
      return aPrice - bPrice;
    }

    if (aPrice != null && bPrice == null) return -1;
    if (aPrice == null && bPrice != null) return 1;

    const aHasUrl = Boolean(ticketUrl(a));
    const bHasUrl = Boolean(ticketUrl(b));

    if (aHasUrl && !bHasUrl) return -1;
    if (!aHasUrl && bHasUrl) return 1;

    return 0;
  });

  return sorted[0] ?? null;
}

function dedupeEvents(events: Se365Event[]): Se365Event[] {
  const map = new Map<string, Se365Event>();

  for (const ev of events) {
    const key = `${eventId(ev)}|${eventName(ev)}|${eventDate(ev)}`.toLowerCase();
    if (!key.replace(/\|/g, "")) continue;
    if (!map.has(key)) map.set(key, ev);
  }

  return Array.from(map.values());
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasSe365Config()) {
    console.log("[SE365] skipped: missing config");
    return null;
  }

  console.log("[SE365] resolve start", {
    baseUrl: env.se365BaseUrl,
    hasApiKey: Boolean(clean(env.se365ApiKey)),
    hasApiPassword: Boolean(clean(env.se365ApiPassword)),
    hasHttpUsername: Boolean(clean(env.se365HttpUsername)),
    hasHttpSource: Boolean(clean(env.se365HttpSource)),
    hasAffiliateId: Boolean(clean(env.se365AffiliateId)),
    homeName: clean(input.homeName),
    awayName: clean(input.awayName),
    kickoffIso: clean(input.kickoffIso),
    leagueName: clean(input.leagueName) || null,
    leagueId: clean(input.leagueId) || null,
  });

  const allEvents: Se365Event[] = [];

  for (const page of [1, 2, 3]) {
    const pageEvents = await fetchEventsPage(page);
    if (!pageEvents.length) continue;
    allEvents.push(...pageEvents);
  }

  const deduped = dedupeEvents(allEvents);

  const scored = deduped
    .map((ev) => ({
      ev,
      score: scoreEvent(ev, input),
    }))
    .filter((x) => isStrongEnough(x.score))
    .sort((a, b) => b.score - a.score);

  console.log("[SE365] scored events", {
    totalFetched: allEvents.length,
    dedupedCount: deduped.length,
    strongCount: scored.length,
    top: scored.slice(0, 5).map((x) => ({
      ...summarizeEvent(x.ev),
      score: x.score,
    })),
  });

  if (!scored.length) {
    const fallbackUrl = buildTrackedSearchFallback(input);
    console.log("[SE365] no strong API match, using fallback", { fallbackUrl });

    if (!fallbackUrl) return null;

    return {
      provider: "sportsevents365",
      exact: false,
      score: SE365_FALLBACK_SCORE,
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const bestEvent = scored[0];
  const bestEventId = eventId(bestEvent.ev);
  const exact = isExactEvent(bestEvent.ev, input, bestEvent.score);

  if (!bestEventId) {
    const fallbackUrl = buildTrackedSearchFallback(input);

    console.log("[SE365] best event missing id, using fallback", {
      bestEvent: {
        ...summarizeEvent(bestEvent.ev),
        score: bestEvent.score,
        exact,
      },
      fallbackUrl,
    });

    if (!fallbackUrl) return null;

    return {
      provider: "sportsevents365",
      exact: false,
      score: Math.max(SE365_FALLBACK_SCORE, bestEvent.score - 20),
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const tickets = await fetchTicketsForEvent(bestEventId);
  const bestTicket = chooseBestTicket(tickets);

  let resolvedUrl =
    ticketUrl(bestTicket ?? {}) ||
    eventUrl(bestEvent.ev) ||
    buildTrackedSearchFallback(input) ||
    "";

  if (!resolvedUrl) {
    console.log("[SE365] no usable URL after event/tickets lookup", {
      bestEvent: {
        ...summarizeEvent(bestEvent.ev),
        score: bestEvent.score,
        exact,
      },
      bestTicket: bestTicket ? summarizeTicket(bestTicket) : null,
    });
    return null;
  }

  resolvedUrl = appendAffiliate(resolvedUrl);

  const priceText = bestTicket ? ticketPriceText(bestTicket) : null;

  console.log("[SE365] matched event/ticket", {
    event: {
      ...summarizeEvent(bestEvent.ev),
      score: bestEvent.score,
      exact,
    },
    ticket: bestTicket ? summarizeTicket(bestTicket) : null,
    resolvedUrl,
    priceText,
  });

  return {
    provider: "sportsevents365",
    exact,
    score: bestTicket ? Math.min(100, bestEvent.score + 6) : bestEvent.score,
    url: resolvedUrl,
    title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
    priceText,
    reason: exact ? "exact_event" : "partial_match",
  };
}
