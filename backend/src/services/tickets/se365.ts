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
  url?: string;
  event_url?: string;
  eventUrl?: string;
  startDate?: string;
  start_date?: string;
  date?: string;
  event_date?: string;
  eventDate?: string;
  localDate?: string;
  country?: string;
  city?: string;
  venue?: string;
  category?: string;
  categoryName?: string;
};

type Se365Ticket = {
  id?: number | string;
  ticketId?: number | string;
  eventId?: number | string;
  event_id?: number | string;
  price?: number | string;
  minPrice?: number | string;
  min_price?: number | string;
  lowestPrice?: number | string;
  lowest_price?: number | string;
  quantity?: number | string;
  qty?: number | string;
  section?: string;
  block?: string;
  category?: string;
  currency?: string;
  currencyCode?: string;
  split?: string;
  splitType?: string;
  ticketUrl?: string;
  url?: string;
};

type Se365Envelope =
  | {
      data?: unknown;
      events?: unknown;
      items?: unknown;
      response?: unknown;
      results?: unknown;
    }
  | null;

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

function numberFromUnknown(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const raw = clean(v);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
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
    clean(ev.eventDate) ||
    clean(ev.localDate)
  );
}

function ticketId(ticket: Se365Ticket): string {
  return clean(ticket.id) || clean(ticket.ticketId);
}

function ticketEventId(ticket: Se365Ticket): string {
  return clean(ticket.eventId) || clean(ticket.event_id);
}

function ticketPriceValue(ticket: Se365Ticket): number | null {
  return (
    numberFromUnknown(ticket.minPrice) ??
    numberFromUnknown(ticket.min_price) ??
    numberFromUnknown(ticket.lowestPrice) ??
    numberFromUnknown(ticket.lowest_price) ??
    numberFromUnknown(ticket.price) ??
    null
  );
}

function ticketCurrency(ticket: Se365Ticket): string {
  return clean(ticket.currencyCode) || clean(ticket.currency);
}

function ticketPriceText(ticket: Se365Ticket): string | null {
  const value = ticketPriceValue(ticket);
  const currency = ticketCurrency(ticket);

  if (value == null && !currency) return null;
  if (value != null && currency) return `${value} ${currency}`.trim();
  if (value != null) return String(value);
  return currency || null;
}

function ticketQuantity(ticket: Se365Ticket): number | null {
  return numberFromUnknown(ticket.quantity) ?? numberFromUnknown(ticket.qty);
}

function ticketSection(ticket: Se365Ticket): string {
  return clean(ticket.section) || clean(ticket.block) || clean(ticket.category);
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

function buildApiUrl(path: string): URL {
  const base = env.se365BaseUrl.replace(/\/+$/, "");
  return new URL(`${base}${path}`);
}

async function fetchJson(url: URL): Promise<unknown | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SE365_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: buildRequestHeaders(),
      signal: controller.signal,
    });

    const body = await res.text();

    if (!res.ok) {
      console.log("[SE365] non-200 response", {
        url: url.toString(),
        status: res.status,
        body: body.slice(0, 500),
      });
      return null;
    }

    try {
      return body ? JSON.parse(body) : null;
    } catch {
      console.log("[SE365] invalid JSON response", {
        url: url.toString(),
        body: body.slice(0, 500),
      });
      return null;
    }
  } catch (error) {
    console.log("[SE365] fetch error", {
      url: url.toString(),
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function arrayFromUnknown(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function extractEvents(payload: unknown): Se365Event[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;

  const direct =
    arrayFromUnknown(root.events) ||
    arrayFromUnknown(root.items) ||
    arrayFromUnknown(root.response) ||
    arrayFromUnknown(root.results) ||
    arrayFromUnknown(root.data);

  if (direct.length) {
    return direct as Se365Event[];
  }

  const data = root.data;
  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;

    if (Array.isArray(nested.events)) return nested.events as Se365Event[];
    if (Array.isArray(nested.items)) return nested.items as Se365Event[];
    if (Array.isArray(nested.response)) return nested.response as Se365Event[];
    if (Array.isArray(nested.results)) return nested.results as Se365Event[];
  }

  return [];
}

function extractTickets(payload: unknown): Se365Ticket[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;

  if (Array.isArray(root.tickets)) return root.tickets as Se365Ticket[];
  if (Array.isArray(root.items)) return root.items as Se365Ticket[];
  if (Array.isArray(root.response)) return root.response as Se365Ticket[];
  if (Array.isArray(root.results)) return root.results as Se365Ticket[];
  if (Array.isArray(root.data)) return root.data as Se365Ticket[];

  const data = root.data;
  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;

    if (Array.isArray(nested.tickets)) return nested.tickets as Se365Ticket[];
    if (Array.isArray(nested.items)) return nested.items as Se365Ticket[];
    if (Array.isArray(nested.response)) return nested.response as Se365Ticket[];
    if (Array.isArray(nested.results)) return nested.results as Se365Ticket[];
  }

  return [];
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

function scoreEvent(ev: Se365Event, input: TicketResolveInput): number {
  let score = 0;

  const name = eventName(ev);
  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));
  const homeVariants = expandTeamAliases(input.homeName);
  const awayVariants = expandTeamAliases(input.awayName);

  if (name && containsTeamsLoose(name, homeVariants, awayVariants)) {
    score += 65;
  }

  if (name && isBadVariant(name)) {
    score -= 1000;
  }

  if (kickoff && evDt) {
    const diff = absDays(kickoff, evDt);
    if (diff === 0) score += 25;
    else if (diff === 1) score += 15;
    else if (diff === 2) score += 8;
    else if (diff > 2) score -= 1000;
  }

  if (clean(ev.venue)) score += 2;
  if (clean(ev.city)) score += 1;
  if (clean(ev.country)) score += 1;

  return score;
}

function isStrongEnoughEvent(score: number): boolean {
  return score >= 55;
}

function isExactEvent(
  ev: Se365Event,
  input: TicketResolveInput,
  score: number
): boolean {
  const name = eventName(ev);
  if (!name || isBadVariant(name)) return false;

  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));

  if (!kickoff || !evDt) return false;
  if (!containsTeamsLoose(name, expandTeamAliases(input.homeName), expandTeamAliases(input.awayName))) {
    return false;
  }

  return absDays(kickoff, evDt) === 0 && score >= 85;
}

function scoreTicket(ticket: Se365Ticket): number {
  let score = 0;

  const price = ticketPriceValue(ticket);
  const qty = ticketQuantity(ticket);
  const section = ticketSection(ticket);
  const split = clean(ticket.split) || clean(ticket.splitType);

  if (ticketId(ticket)) score += 5;
  if (ticketEventId(ticket)) score += 5;
  if (price != null) score += 10;
  if (qty != null) {
    if (qty >= 2) score += 10;
    else if (qty === 1) score += 5;
  }
  if (section) score += 4;
  if (split) {
    score += 2;
    if (norm(split).includes("avoid")) score -= 3;
  }

  return score;
}

function summarizeEvent(ev: Se365Event) {
  return {
    id: eventId(ev) || null,
    name: eventName(ev) || null,
    date: eventDate(ev) || null,
    city: clean(ev.city) || null,
    venue: clean(ev.venue) || null,
  };
}

function summarizeTicket(ticket: Se365Ticket) {
  return {
    id: ticketId(ticket) || null,
    eventId: ticketEventId(ticket) || null,
    priceText: ticketPriceText(ticket),
    quantity: ticketQuantity(ticket),
    section: ticketSection(ticket) || null,
  };
}

function dedupeEvents(events: Se365Event[]): Se365Event[] {
  const map = new Map<string, Se365Event>();

  for (const ev of events) {
    const key = [
      eventId(ev),
      eventName(ev),
      eventDate(ev),
      clean(ev.venue),
      clean(ev.city),
    ]
      .join("|")
      .toLowerCase();

    if (!key.replace(/\|/g, "")) continue;
    if (!map.has(key)) map.set(key, ev);
  }

  return Array.from(map.values());
}

function buildEventUrl(): URL {
  const url = buildApiUrl(`/events/event-type/${FOOTBALL_EVENT_TYPE_ID}`);
  url.searchParams.set("apiKey", clean(env.se365ApiKey));
  return url;
}

function buildTicketsUrl(eventIdValue: string): URL {
  const url = buildApiUrl(`/tickets/${encodeURIComponent(eventIdValue)}`);
  url.searchParams.set("apiKey", clean(env.se365ApiKey));
  url.searchParams.set("page", "1");
  return url;
}

async function fetchFootballEvents(): Promise<Se365Event[]> {
  const url = buildEventUrl();
  const payload = await fetchJson(url);
  const events = extractEvents(payload);

  console.log("[SE365] events response", {
    url: url.toString(),
    count: events.length,
    sample: events.slice(0, 5).map(summarizeEvent),
  });

  return events;
}

async function fetchTicketsForEvent(eventIdValue: string): Promise<Se365Ticket[]> {
  const url = buildTicketsUrl(eventIdValue);
  const payload = await fetchJson(url);
  const tickets = extractTickets(payload);

  console.log("[SE365] tickets response", {
    url: url.toString(),
    eventId: eventIdValue,
    count: tickets.length,
    sample: tickets.slice(0, 5).map(summarizeTicket),
  });

  return tickets;
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

  const events = dedupeEvents(await fetchFootballEvents());

  if (!events.length) {
    const fallbackUrl = buildTrackedSearchFallback(input);
    console.log("[SE365] no events from API, using fallback", { fallbackUrl });

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

  const scoredEvents = events
    .map((ev) => ({
      ev,
      score: scoreEvent(ev, input),
    }))
    .filter((x) => isStrongEnoughEvent(x.score))
    .sort((a, b) => b.score - a.score);

  console.log("[SE365] scored events", {
    total: events.length,
    strongCount: scoredEvents.length,
    top: scoredEvents.slice(0, 5).map((x) => ({
      ...summarizeEvent(x.ev),
      score: x.score,
    })),
  });

  if (!scoredEvents.length) {
    const fallbackUrl = buildTrackedSearchFallback(input);
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

  const bestEvent = scoredEvents[0];
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
      score: Math.max(SE365_FALLBACK_SCORE, bestEvent.score - 15),
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const tickets = await fetchTicketsForEvent(bestEventId);

  if (!tickets.length) {
    const fallbackUrl = buildTrackedSearchFallback(input);
    console.log("[SE365] matched event but no tickets, using fallback", {
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
      exact,
      score: exact ? bestEvent.score : Math.max(SE365_FALLBACK_SCORE, bestEvent.score - 10),
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: null,
      reason: exact ? "partial_match" : "search_fallback",
    };
  }

  const scoredTickets = tickets
    .map((ticket) => ({
      ticket,
      score: scoreTicket(ticket),
    }))
    .sort((a, b) => {
      const aPrice = ticketPriceValue(a.ticket);
      const bPrice = ticketPriceValue(b.ticket);

      if (aPrice != null && bPrice != null && aPrice !== bPrice) {
        return aPrice - bPrice;
      }

      return b.score - a.score;
    });

  const bestTicket = scoredTickets[0];
  const combinedScore = Math.min(
    100,
    bestEvent.score + Math.min(18, bestTicket?.score ?? 0)
  );

  const fallbackPublicUrl = buildTrackedSearchFallback(input);
  const finalUrl = fallbackPublicUrl ? appendAffiliate(fallbackPublicUrl) : "";

  console.log("[SE365] matched event/ticket", {
    event: {
      ...summarizeEvent(bestEvent.ev),
      eventScore: bestEvent.score,
      exact,
    },
    ticket: bestTicket
      ? {
          ...summarizeTicket(bestTicket.ticket),
          ticketScore: bestTicket.score,
        }
      : null,
    combinedScore,
    resolvedUrl: finalUrl,
  });

  if (!finalUrl) {
    return null;
  }

  return {
    provider: "sportsevents365",
    exact,
    score: combinedScore,
    url: finalUrl,
    title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
    priceText: bestTicket ? ticketPriceText(bestTicket.ticket) : null,
    reason: exact ? "exact_event" : "partial_match",
  };
    }
