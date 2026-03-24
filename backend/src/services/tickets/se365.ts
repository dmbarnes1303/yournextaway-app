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
  venue?: {
    name?: string;
    city?: string;
    country?: string;
  };
  category?: {
    id?: number | string;
    name?: string;
  };
  country?: string;
  city?: string;
};

type Se365EventsResponse =
  | {
      events?: Se365Event[];
      data?: Se365Event[] | { events?: Se365Event[]; items?: Se365Event[] };
      items?: Se365Event[];
      response?: Se365Event[];
      results?: Se365Event[];
    }
  | Se365Event[]
  | null;

type Se365Ticket = {
  id?: number | string;
  ticketId?: number | string;
  price?: number | string;
  minPrice?: number | string;
  min_price?: number | string;
  lowestPrice?: number | string;
  lowest_price?: number | string;
  faceValue?: number | string;
  currency?: string;
  currencyCode?: string;
  quantity?: number | string;
  qty?: number | string;
};

type Se365TicketsResponse =
  | {
      tickets?: Se365Ticket[];
      data?: Se365Ticket[] | { tickets?: Se365Ticket[]; items?: Se365Ticket[] };
      items?: Se365Ticket[];
      response?: Se365Ticket[];
      results?: Se365Ticket[];
    }
  | Se365Ticket[]
  | null;

const SE365_FETCH_TIMEOUT_MS = 7000;
const SE365_FALLBACK_SCORE = 24;
const SE365_EVENT_TYPE_ID = "1000";
const SE365_MAX_EVENT_PAGES = 8;

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

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(value: string): string {
  return stripAccents(clean(value))
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bfc\b/g, " ")
    .replace(/\bcf\b/g, " ")
    .replace(/\bafc\b/g, " ")
    .replace(/\bsc\b/g, " ")
    .replace(/\bsk\b/g, " ")
    .replace(/\bjk\b/g, " ")
    .replace(/\bclub\b/g, " ")
    .replace(/\bde\b/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function eventUrl(ev: Se365Event): string {
  return clean(ev.url) || clean(ev.event_url) || clean(ev.eventUrl);
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

function ticketCurrency(ticket: Se365Ticket): string {
  return clean(ticket.currency) || clean(ticket.currencyCode);
}

function numberFromUnknown(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const raw = clean(v);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function ticketQuantity(ticket: Se365Ticket): number | null {
  return numberFromUnknown(ticket.quantity) ?? numberFromUnknown(ticket.qty);
}

function ticketPriceValue(ticket: Se365Ticket): number | null {
  return (
    numberFromUnknown(ticket.minPrice) ??
    numberFromUnknown(ticket.min_price) ??
    numberFromUnknown(ticket.lowestPrice) ??
    numberFromUnknown(ticket.lowest_price) ??
    numberFromUnknown(ticket.price) ??
    numberFromUnknown(ticket.faceValue) ??
    null
  );
}

function ticketPriceText(ticket: Se365Ticket): string | null {
  const amount = ticketPriceValue(ticket);
  const currency = ticketCurrency(ticket);

  if (amount == null && !currency) return null;
  if (amount != null && currency) return `${amount} ${currency}`.trim();
  if (amount != null) return String(amount);
  return currency || null;
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

function containsTeamsLoose(name: string, home: string, away: string): boolean {
  const n = normalizeName(name);
  return n.includes(normalizeName(home)) && n.includes(normalizeName(away));
}

function textContainsVariant(name: string, variant: string): boolean {
  const haystack = ` ${normalizeName(name)} `;
  const needle = ` ${normalizeName(variant)} `;
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

  const n = normalizeName(name);
  if (/(^|[\s-])ii($|[\s-])/.test(n)) return true;
  if (/(^|[\s-])b($|[\s-])/.test(n)) return true;

  return false;
}

function nameMatchDetails(
  name: string,
  input: TicketResolveInput
): {
  homeMatched: string | null;
  awayMatched: string | null;
  homeMatchedLoose: string | null;
  awayMatchedLoose: string | null;
  bothMatched: boolean;
} {
  const homeVariants = expandTeamAliases(input.homeName);
  const awayVariants = expandTeamAliases(input.awayName);

  const normalizedEvent = normalizeName(name);

  const homeMatched =
    homeVariants.find((home) => normalizedEvent.includes(normalizeName(home))) ?? null;

  const awayMatched =
    awayVariants.find((away) => normalizedEvent.includes(normalizeName(away))) ?? null;

  const homeTokens = normalizeName(input.homeName).split(" ").filter(Boolean);
  const awayTokens = normalizeName(input.awayName).split(" ").filter(Boolean);

  const homeMatchedLoose =
    homeMatched ??
    homeTokens.find((token) => token.length >= 4 && normalizedEvent.includes(token)) ??
    null;

  const awayMatchedLoose =
    awayMatched ??
    awayTokens.find((token) => token.length >= 4 && normalizedEvent.includes(token)) ??
    null;

  return {
    homeMatched,
    awayMatched,
    homeMatchedLoose,
    awayMatchedLoose,
    bothMatched: Boolean(homeMatchedLoose && awayMatchedLoose),
  };
}

function scoreEvent(
  ev: Se365Event,
  input: TicketResolveInput
): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  const name = eventName(ev);
  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));

  if (!name) {
    return { score: -1000, reasons: ["missing_name"] };
  }

  if (isBadVariant(name)) {
    score -= 1000;
    reasons.push("bad_variant");
  }

  const match = nameMatchDetails(name, input);

  if (match.homeMatched && match.awayMatched) {
    score += 60;
    reasons.push("both_aliases_matched");
  } else if (match.bothMatched) {
    score += 42;
    reasons.push("both_loose_tokens_matched");
  } else if (match.homeMatchedLoose || match.awayMatchedLoose) {
    score += 12;
    reasons.push("single_team_partial_match");
  } else {
    score -= 250;
    reasons.push("teams_not_matched");
  }

  if (kickoff && evDt) {
    const diff = absDays(kickoff, evDt);

    if (diff === 0) {
      score += 25;
      reasons.push("same_day");
    } else if (diff === 1) {
      score += 15;
      reasons.push("one_day_off");
    } else if (diff === 2) {
      score += 5;
      reasons.push("two_days_off");
    } else {
      score -= 1000;
      reasons.push(`date_mismatch_${diff}_days`);
    }
  } else if (!evDt) {
    reasons.push("missing_event_date");
  } else {
    reasons.push("missing_input_kickoff");
  }

  if (eventUrl(ev)) {
    score += 5;
    reasons.push("has_event_url");
  }

  return { score, reasons };
}

function scoreTickets(
  tickets: Se365Ticket[]
): {
  score: number;
  bestTicket: Se365Ticket | null;
} {
  if (!tickets.length) {
    return {
      score: 0,
      bestTicket: null,
    };
  }

  let score = 0;

  const quantities = tickets
    .map((ticket) => ticketQuantity(ticket))
    .filter((value): value is number => value != null);

  const priced = tickets
    .map((ticket) => ({
      ticket,
      amount: ticketPriceValue(ticket),
    }))
    .sort((a, b) => {
      if (a.amount == null && b.amount == null) return 0;
      if (a.amount == null) return 1;
      if (b.amount == null) return -1;
      return a.amount - b.amount;
    });

  const bestTicket = priced[0]?.ticket ?? null;

  score += 10;

  if (priced.some((entry) => entry.amount != null)) {
    score += 8;
  }

  if (quantities.some((qty) => qty >= 2)) {
    score += 8;
  } else if (quantities.some((qty) => qty === 1)) {
    score += 4;
  }

  return {
    score,
    bestTicket,
  };
}

function isStrongEnough(score: number): boolean {
  return score >= 35;
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

  const match = nameMatchDetails(name, input);
  if (!(match.homeMatched && match.awayMatched)) return false;

  return absDays(kickoff, evDt) === 0 && score >= 80;
}

function summarizeEvent(ev: Se365Event) {
  return {
    id: eventId(ev) || null,
    name: eventName(ev) || null,
    date: eventDate(ev) || null,
    url: eventUrl(ev) || null,
  };
}

function summarizeTicket(ticket: Se365Ticket) {
  return {
    id: clean(ticket.id) || clean(ticket.ticketId) || null,
    priceText: ticketPriceText(ticket),
    quantity: ticketQuantity(ticket),
  };
}

function extractEvents(json: Se365EventsResponse): Se365Event[] {
  if (!json) return [];

  if (Array.isArray(json)) return json;
  if (Array.isArray(json.events)) return json.events;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.response)) return json.response;
  if (Array.isArray(json.results)) return json.results;
  if (Array.isArray(json.data)) return json.data;

  if (json.data && typeof json.data === "object") {
    const obj = json.data as Record<string, unknown>;
    if (Array.isArray(obj.events)) return obj.events as Se365Event[];
    if (Array.isArray(obj.items)) return obj.items as Se365Event[];
  }

  return [];
}

function extractTickets(json: Se365TicketsResponse): Se365Ticket[] {
  if (!json) return [];

  if (Array.isArray(json)) return json;
  if (Array.isArray(json.tickets)) return json.tickets;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.response)) return json.response;
  if (Array.isArray(json.results)) return json.results;
  if (Array.isArray(json.data)) return json.data;

  if (json.data && typeof json.data === "object") {
    const obj = json.data as Record<string, unknown>;
    if (Array.isArray(obj.tickets)) return obj.tickets as Se365Ticket[];
    if (Array.isArray(obj.items)) return obj.items as Se365Ticket[];
  }

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

function buildBaseUrl(): string {
  const raw = clean(env.se365BaseUrl);
  if (!raw) return "https://api-v2.sandbox365.com";
  return raw.replace(/\/+$/, "");
}

function buildEventsUrl(page: number): string {
  const url = new URL(`${buildBaseUrl()}/events/event-type/${SE365_EVENT_TYPE_ID}`);
  url.searchParams.set("apiKey", clean(env.se365ApiKey));
  url.searchParams.set("page", String(page));
  return url.toString();
}

function buildTicketsUrl(eventIdValue: string): string {
  const url = new URL(`${buildBaseUrl()}/tickets/${encodeURIComponent(eventIdValue)}`);
  url.searchParams.set("apiKey", clean(env.se365ApiKey));
  return url.toString();
}

async function fetchJson(
  url: string
): Promise<{ ok: boolean; status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SE365_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: buildRequestHeaders(),
      signal: controller.signal,
    });

    const body = await res.text().catch(() => "");

    return {
      ok: res.ok,
      status: res.status,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchEventPages(): Promise<Se365Event[]> {
  const out: Se365Event[] = [];

  for (let page = 1; page <= SE365_MAX_EVENT_PAGES; page += 1) {
    const url = buildEventsUrl(page);
    const res = await fetchJson(url);

    if (!res.ok) {
      console.log("[SE365] events non-200 response", {
        page,
        url,
        status: res.status,
        body: res.body.slice(0, 500),
      });

      if (page === 1) return [];
      break;
    }

    let parsed: Se365EventsResponse = null;
    try {
      parsed = res.body ? (JSON.parse(res.body) as Se365EventsResponse) : null;
    } catch {
      console.log("[SE365] events invalid JSON", {
        page,
        url,
        body: res.body.slice(0, 500),
      });

      if (page === 1) return [];
      break;
    }

    const events = extractEvents(parsed);

    console.log("[SE365] events page result", {
      page,
      url,
      count: events.length,
      sample: events.slice(0, 5).map(summarizeEvent),
    });

    if (!events.length) break;

    out.push(...events);

    if (events.length < 20) break;
  }

  return out;
}

async function fetchTicketsForEvent(eventIdValue: string): Promise<Se365Ticket[]> {
  if (!eventIdValue) return [];

  const url = buildTicketsUrl(eventIdValue);
  const res = await fetchJson(url);

  if (!res.ok) {
    console.log("[SE365] tickets non-200 response", {
      eventId: eventIdValue,
      url,
      status: res.status,
      body: res.body.slice(0, 500),
    });
    return [];
  }

  let parsed: Se365TicketsResponse = null;
  try {
    parsed = res.body ? (JSON.parse(res.body) as Se365TicketsResponse) : null;
  } catch {
    console.log("[SE365] tickets invalid JSON", {
      eventId: eventIdValue,
      url,
      body: res.body.slice(0, 500),
    });
    return [];
  }

  const tickets = extractTickets(parsed);

  console.log("[SE365] tickets result", {
    eventId: eventIdValue,
    url,
    count: tickets.length,
    sample: tickets.slice(0, 5).map(summarizeTicket),
  });

  return tickets;
}

export async function resolveSe365Candidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  console.log("[SE365 CONFIG CHECK]", {
    hasSe365Config: hasSe365Config(),
    apiKeyPresent: Boolean(clean(env.se365ApiKey)),
    baseUrl: env.se365BaseUrl,
    username: env.se365HttpUsername,
    passwordPresent: Boolean(clean(env.se365ApiPassword)),
  });

  if (!hasSe365Config()) {
    console.log("[SE365] skipped: missing config");
    return null;
  }

  console.log("[SE365] resolve start", {
    baseUrl: buildBaseUrl(),
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

  const allEvents = await fetchEventPages();

  if (!allEvents.length) {
    const fallbackUrl = buildTrackedSearchFallback(input);

    console.log("[SE365] no events from API, using fallback", {
      fallbackUrl,
    });

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

  const deduped = Array.from(
    new Map(
      allEvents.map((ev) => [
        `${eventId(ev)}|${eventName(ev)}|${eventDate(ev)}`,
        ev,
      ])
    ).values()
  );

  console.log(
    "[SE365 RAW DEDUPED EVENTS]",
    deduped.slice(0, 10).map((ev) => ({
      ...summarizeEvent(ev),
      normalizedName: normalizeName(eventName(ev)),
    }))
  );

  const scored = deduped
    .map((ev) => {
      const scoredEvent = scoreEvent(ev, input);
      return {
        ev,
        score: scoredEvent.score,
        reasons: scoredEvent.reasons,
      };
    })
    .sort((a, b) => b.score - a.score);

  console.log(
    "[SE365 SCORED EVENTS]",
    scored.slice(0, 10).map((x) => ({
      ...summarizeEvent(x.ev),
      score: x.score,
      reasons: x.reasons,
      exact: isExactEvent(x.ev, input, x.score),
    }))
  );

  const strong = scored.filter((x) => isStrongEnough(x.score));

  console.log("[SE365] scored candidates", {
    totalEvents: allEvents.length,
    dedupedCount: deduped.length,
    strongCount: strong.length,
    top: strong.slice(0, 5).map((x) => ({
      ...summarizeEvent(x.ev),
      score: x.score,
      reasons: x.reasons,
    })),
  });

  if (!strong.length) {
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

  const best = strong[0];
  const bestEventId = eventId(best.ev);
  const tickets = await fetchTicketsForEvent(bestEventId);
  const ticketScore = scoreTickets(tickets);
  const exact = isExactEvent(best.ev, input, best.score);
  const totalScore = Math.min(100, best.score + ticketScore.score);

  const rawUrl = eventUrl(best.ev);
  const fallbackUrl = buildTrackedSearchFallback(input);
  const resolvedUrl = rawUrl ? appendAffiliate(rawUrl) : fallbackUrl;

  console.log("[SE365] matched event", {
    best: {
      ...summarizeEvent(best.ev),
      score: best.score,
      reasons: best.reasons,
      exact,
      ticketCount: tickets.length,
      bestTicket: ticketScore.bestTicket
        ? summarizeTicket(ticketScore.bestTicket)
        : null,
      ticketScore: ticketScore.score,
      finalScore: totalScore,
      resolvedUrl: resolvedUrl || null,
    },
  });

  if (!resolvedUrl) return null;

  return {
    provider: "sportsevents365",
    exact,
    score: totalScore,
    url: resolvedUrl,
    title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
    priceText: ticketScore.bestTicket
      ? ticketPriceText(ticketScore.bestTicket)
      : null,
    reason: rawUrl ? (exact ? "exact_event" : "partial_match") : "search_fallback",
  };
}
