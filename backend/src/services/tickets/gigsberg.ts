import { env, hasGigsbergConfig } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";

type GigsbergEvent = {
  id?: number | string;
  name?: string;
  event_name?: string;
  date?: string;
  event_date?: string;
  time?: string;
  city?: string;
  venue?: string;
  venue_name?: string;
  country?: string;
  country_name?: string;
  performer1?: string;
  performer2?: string;
  type?: string;
  type_name?: string;
  subtype?: string;
  subtype_name?: string;
  active?: number | boolean;
};

type GigsbergEventsResponse =
  | {
      data?: GigsbergEvent[];
      items?: GigsbergEvent[];
      total?: number;
      nextPage?: string | number | null;
      prevPage?: string | number | null;
      lastPage?: string | number | null;
    }
  | GigsbergEvent[]
  | null;

type GigsbergListing = {
  id?: number | string;
  listing_id?: number | string;
  event_id?: number | string;
  event?: string;
  category?: string;
  category_id?: number | string;
  block?: string;
  row?: string;
  quantity?: number | string;
  price?: number | string;
  total_price?: number | string;
  totalPrice?: number | string;
  price_per_ticket?: number | string;
  currency?: string;
  currency_code?: string;
  split_type?: string;
  active?: number | boolean;
};

type GigsbergListingsResponse =
  | {
      data?: GigsbergListing[];
      items?: GigsbergListing[];
      total?: number;
      nextPage?: string | number | null;
      prevPage?: string | number | null;
      lastPage?: string | number | null;
    }
  | GigsbergListing[]
  | null;

type GigsbergMarketDataResponse =
  | {
      object?: {
        min_price?: number | string;
        lowest_price?: number | string;
        avg_price?: number | string;
        median_price?: number | string;
        currency?: string;
        currency_code?: string;
        listings_count?: number | string;
        tickets_count?: number | string;
      };
      data?: {
        min_price?: number | string;
        lowest_price?: number | string;
        avg_price?: number | string;
        median_price?: number | string;
        currency?: string;
        currency_code?: string;
        listings_count?: number | string;
        tickets_count?: number | string;
      };
    }
  | null;

type ScoredEvent = {
  ev: GigsbergEvent;
  score: number;
  exactTeams: boolean;
  sameDay: boolean;
  reasons: string[];
};

type ScoredListing = {
  listing: GigsbergListing;
  score: number;
};

const GIGSBERG_FETCH_TIMEOUT_MS = 7000;
const EVENTS_PER_PAGE = 30;
const LISTINGS_PER_PAGE = 30;

const MIN_PUBLIC_FALLBACK_SCORE = 18;
const GIGSBERG_MIN_STRONG_EVENT_SCORE = 72;
const GIGSBERG_MIN_EXACT_EVENT_SCORE = 95;
const GIGSBERG_SEARCH_FALLBACK_PENALTY = 42;
const GIGSBERG_LISTING_BONUS_CAP = 12;
const GIGSBERG_MARKETDATA_BONUS_CAP = 8;

const EVENT_SEARCH_PATH = "/event/search";
const LISTING_SEARCH_PATH = "/listing/search";
const MARKET_DATA_PATH = "/listing/market-data";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function norm(v: unknown): string {
  return clean(v).toLowerCase();
}

function safeDate(v?: string | null): Date | null {
  const s = clean(v);
  if (!s) return null;

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function absDays(a: Date, b: Date): number {
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / 86400000);
}

function formatYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function buildDateWindow(kickoffIso: string): { from?: string; to?: string } {
  const kickoff = safeDate(kickoffIso);
  if (!kickoff) return {};

  return {
    from: formatYmd(addDays(kickoff, -2)),
    to: formatYmd(addDays(kickoff, 2)),
  };
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const trimmed = clean(value);
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(trimmed);
  }

  return out;
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const raw = clean(v);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPositiveInt(v: unknown, fallback: number): number {
  const parsed = toNumber(v);
  if (parsed == null || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function eventId(ev: GigsbergEvent): string {
  return clean(ev.id);
}

function eventName(ev: GigsbergEvent): string {
  return clean(ev.name) || clean(ev.event_name);
}

function eventDate(ev: GigsbergEvent): string {
  return clean(ev.date) || clean(ev.event_date);
}

function eventVenue(ev: GigsbergEvent): string {
  return clean(ev.venue_name) || clean(ev.venue);
}

function eventCity(ev: GigsbergEvent): string {
  return clean(ev.city);
}

function eventCountry(ev: GigsbergEvent): string {
  return clean(ev.country_name) || clean(ev.country);
}

function eventType(ev: GigsbergEvent): string {
  return clean(ev.type_name) || clean(ev.type);
}

function eventSubtype(ev: GigsbergEvent): string {
  return clean(ev.subtype_name) || clean(ev.subtype);
}

function eventPerformer1(ev: GigsbergEvent): string {
  return clean(ev.performer1);
}

function eventPerformer2(ev: GigsbergEvent): string {
  return clean(ev.performer2);
}

function listingId(listing: GigsbergListing): string {
  return clean(listing.id) || clean(listing.listing_id);
}

function listingEventId(listing: GigsbergListing): string {
  return clean(listing.event_id);
}

function listingQuantity(listing: GigsbergListing): number | null {
  return toNumber(listing.quantity);
}

function listingCurrency(listing: GigsbergListing): string {
  return clean(listing.currency_code) || clean(listing.currency);
}

function listingPriceValue(listing: GigsbergListing): number | null {
  return (
    toNumber(listing.price) ??
    toNumber(listing.price_per_ticket) ??
    toNumber(listing.total_price) ??
    toNumber(listing.totalPrice) ??
    null
  );
}

function listingPriceText(listing: GigsbergListing): string | null {
  const value = listingPriceValue(listing);
  const currency = listingCurrency(listing);

  if (value == null && !currency) return null;
  if (value != null && currency) return `${value} ${currency}`.trim();
  if (value != null) return String(value);
  return currency || null;
}

function marketDataMinPriceText(data: GigsbergMarketDataResponse): string | null {
  const obj =
    (data && typeof data === "object" && "object" in data && data.object) ||
    (data && typeof data === "object" && "data" in data && data.data) ||
    null;

  if (!obj || typeof obj !== "object") return null;

  const price =
    toNumber((obj as any).min_price) ??
    toNumber((obj as any).lowest_price) ??
    null;

  const currency =
    clean((obj as any).currency_code) ||
    clean((obj as any).currency) ||
    "";

  if (price == null && !currency) return null;
  if (price != null && currency) return `${price} ${currency}`.trim();
  if (price != null) return String(price);
  return currency || null;
}

function buildApiUrl(path: string): string {
  const base = env.gigsbergBaseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function buildPublicSearchUrl(input: TicketResolveInput): string | null {
  const home = getPreferredTeamName(input.homeName);
  const away = getPreferredTeamName(input.awayName);
  const league = clean(input.leagueName);

  const query = league ? `${home} vs ${away} ${league}` : `${home} vs ${away}`;
  if (!query) return null;

  const url = new URL("https://www.gigsberg.com/search");
  url.searchParams.set("query", query);

  const affiliateId = clean(env.gigsbergAffiliateId);
  if (affiliateId) {
    url.searchParams.set("aff", affiliateId);
  }

  return url.toString();
}

function buildEventSearchUrl(eventNameValue: string): string {
  const url = new URL("https://www.gigsberg.com/search");
  url.searchParams.set("query", eventNameValue);

  const affiliateId = clean(env.gigsbergAffiliateId);
  if (affiliateId) {
    url.searchParams.set("aff", affiliateId);
  }

  return url.toString();
}

function buildEventSearchBodies(input: TicketResolveInput): Array<Record<string, unknown>> {
  const preferredHome = getPreferredTeamName(input.homeName);
  const preferredAway = getPreferredTeamName(input.awayName);
  const rawHome = clean(input.homeName);
  const rawAway = clean(input.awayName);
  const league = clean(input.leagueName);
  const dateWindow = buildDateWindow(input.kickoffIso);

  const keywordQueries = uniqueStrings([
    `${preferredHome} vs ${preferredAway}`,
    `${preferredHome} ${preferredAway}`,
    `${rawHome} vs ${rawAway}`,
    `${rawHome} ${rawAway}`,
    league ? `${preferredHome} vs ${preferredAway} ${league}` : "",
    league ? `${rawHome} vs ${rawAway} ${league}` : "",
  ]);

  const bodies: Array<Record<string, unknown>> = [];

  for (const keyword of keywordQueries) {
    bodies.push({
      page: 1,
      per_page: EVENTS_PER_PAGE,
      keyword,
      future_events_only: true,
      date: {
        from: dateWindow.from,
        to: dateWindow.to,
      },
    });
  }

  bodies.push({
    page: 1,
    per_page: EVENTS_PER_PAGE,
    performer1: preferredHome,
    performer2: preferredAway,
    future_events_only: true,
    date: {
      from: dateWindow.from,
      to: dateWindow.to,
    },
  });

  bodies.push({
    page: 1,
    per_page: EVENTS_PER_PAGE,
    name: `${preferredHome} vs ${preferredAway}`,
    future_events_only: true,
    date: {
      from: dateWindow.from,
      to: dateWindow.to,
    },
  });

  return bodies;
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
  text: string,
  homeVariants: string[],
  awayVariants: string[]
): boolean {
  const n = norm(text);
  const hasHome = homeVariants.some((home) => n.includes(norm(home)));
  const hasAway = awayVariants.some((away) => n.includes(norm(away)));
  return hasHome && hasAway;
}

function scoreEvent(ev: GigsbergEvent, input: TicketResolveInput): ScoredEvent {
  let score = 0;
  const reasons: string[] = [];

  const name = eventName(ev);
  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));
  const homeVariants = expandTeamAliases(input.homeName);
  const awayVariants = expandTeamAliases(input.awayName);

  if (!name || isBadVariant(name)) {
    return {
      ev,
      score: -1000,
      exactTeams: false,
      sameDay: false,
      reasons: ["bad_or_missing_name"],
    };
  }

  const joinedText = [
    eventName(ev),
    eventPerformer1(ev),
    eventPerformer2(ev),
    eventVenue(ev),
    eventCity(ev),
  ]
    .filter(Boolean)
    .join(" ");

  const exactTeams = containsTeamsLoose(joinedText, homeVariants, awayVariants);

  if (!exactTeams) {
    return {
      ev,
      score: -1000,
      exactTeams: false,
      sameDay: false,
      reasons: ["team_match_failed"],
    };
  }

  score += 58;
  reasons.push("teams_matched");

  const perf1 = eventPerformer1(ev);
  const perf2 = eventPerformer2(ev);

  if (perf1 && perf2) {
    const perfText = `${perf1} ${perf2}`;
    if (containsTeamsLoose(perfText, homeVariants, awayVariants)) {
      score += 10;
      reasons.push("performers_match");
    }
  }

  let sameDay = false;
  if (kickoff && evDt) {
    const diff = absDays(kickoff, evDt);
    if (diff === 0) {
      score += 26;
      sameDay = true;
      reasons.push("same_day");
    } else if (diff === 1) {
      score += 8;
      reasons.push("one_day_off");
    } else if (diff === 2) {
      score += 2;
      reasons.push("two_days_off");
    } else {
      score -= 1000;
      reasons.push(`date_mismatch_${diff}`);
    }
  } else {
    score -= 15;
    reasons.push("missing_event_date");
  }

  const typeText = `${eventType(ev)} ${eventSubtype(ev)}`.toLowerCase();
  if (typeText.includes("football") || typeText.includes("soccer")) {
    score += 6;
    reasons.push("football_type_hint");
  }

  if (eventVenue(ev)) {
    score += 2;
    reasons.push("has_venue");
  }

  if (eventCity(ev)) {
    score += 1;
    reasons.push("has_city");
  }

  if (eventCountry(ev)) {
    score += 1;
    reasons.push("has_country");
  }

  return {
    ev,
    score,
    exactTeams,
    sameDay,
    reasons,
  };
}

function isStrongEnoughEvent(score: number): boolean {
  return score >= GIGSBERG_MIN_STRONG_EVENT_SCORE;
}

function isExactEvent(scored: ScoredEvent, finalScore: number): boolean {
  return scored.exactTeams && scored.sameDay && finalScore >= GIGSBERG_MIN_EXACT_EVENT_SCORE;
}

function scoreListing(listing: GigsbergListing): number {
  let score = 0;

  const qty = listingQuantity(listing);
  const price = listingPriceValue(listing);
  const block = clean(listing.block);
  const category = clean(listing.category);
  const splitType = clean(listing.split_type);
  const active = listing.active;

  if (listingId(listing)) score += 3;
  if (listingEventId(listing)) score += 3;

  if (qty != null) {
    if (qty >= 2) score += 4;
    else if (qty === 1) score += 2;
  }

  if (price != null) score += 4;
  if (block) score += 2;
  if (category) score += 2;

  if (active === true || String(active) === "1") {
    score += 2;
  }

  if (splitType) {
    const split = norm(splitType);
    if (split.includes("avoid")) score -= 3;
    if (split.includes("none")) score += 1;
    if (split.includes("pairs")) score += 2;
  }

  return Math.min(GIGSBERG_LISTING_BONUS_CAP, score);
}

function scoreMarketData(data: GigsbergMarketDataResponse): number {
  const obj =
    (data && typeof data === "object" && "object" in data && data.object) ||
    (data && typeof data === "object" && "data" in data && data.data) ||
    null;

  if (!obj || typeof obj !== "object") return 0;

  let score = 0;

  const minPrice =
    toNumber((obj as any).min_price) ??
    toNumber((obj as any).lowest_price) ??
    null;

  const listingsCount = toNumber((obj as any).listings_count);
  const ticketsCount = toNumber((obj as any).tickets_count);

  if (minPrice != null && minPrice > 0) score += 4;
  if (listingsCount != null && listingsCount > 0) score += 2;
  if (ticketsCount != null && ticketsCount > 0) score += 2;

  return Math.min(GIGSBERG_MARKETDATA_BONUS_CAP, score);
}

function summarizeEvent(ev: GigsbergEvent) {
  return {
    id: eventId(ev) || null,
    name: eventName(ev) || null,
    date: eventDate(ev) || null,
    performer1: eventPerformer1(ev) || null,
    performer2: eventPerformer2(ev) || null,
    venue: eventVenue(ev) || null,
    city: eventCity(ev) || null,
    country: eventCountry(ev) || null,
    type: eventType(ev) || null,
    subtype: eventSubtype(ev) || null,
  };
}

function summarizeListing(listing: GigsbergListing) {
  return {
    id: listingId(listing) || null,
    eventId: listingEventId(listing) || null,
    event: clean(listing.event) || null,
    quantity: listingQuantity(listing),
    priceText: listingPriceText(listing),
    block: clean(listing.block) || null,
    category: clean(listing.category) || null,
    splitType: clean(listing.split_type) || null,
    active: listing.active ?? null,
  };
}

function eventDedupKey(ev: GigsbergEvent): string {
  return [
    eventId(ev),
    eventName(ev),
    eventDate(ev),
    eventVenue(ev),
    eventPerformer1(ev),
    eventPerformer2(ev),
  ]
    .join("|")
    .toLowerCase();
}

function dedupeEvents(events: GigsbergEvent[]): GigsbergEvent[] {
  const map = new Map<string, GigsbergEvent>();

  for (const ev of events) {
    const key = eventDedupKey(ev);
    if (!key.replace(/\|/g, "")) continue;
    if (!map.has(key)) {
      map.set(key, ev);
    }
  }

  return Array.from(map.values());
}

function dedupeListings(listings: GigsbergListing[]): GigsbergListing[] {
  const map = new Map<string, GigsbergListing>();

  for (const listing of listings) {
    const key = [
      listingId(listing),
      listingEventId(listing),
      clean(listing.block),
      clean(listing.row),
      clean(listing.category),
      String(listingQuantity(listing) ?? ""),
      String(listingPriceValue(listing) ?? ""),
      clean(listingCurrency(listing)),
    ]
      .join("|")
      .toLowerCase();

    if (!key.replace(/\|/g, "")) continue;
    if (!map.has(key)) {
      map.set(key, listing);
    }
  }

  return Array.from(map.values());
}

function extractEvents(parsed: GigsbergEventsResponse): GigsbergEvent[] {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.data)) return parsed.data;
  if (Array.isArray(parsed.items)) return parsed.items;
  return [];
}

function extractListings(parsed: GigsbergListingsResponse): GigsbergListing[] {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.data)) return parsed.data;
  if (Array.isArray(parsed.items)) return parsed.items;
  return [];
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GIGSBERG_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": env.gigsbergApiKey,
        ...(init?.headers ?? {}),
      },
    });

    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "";
    }

    return {
      ok: res.ok,
      status: res.status,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function postJson<TResponse>(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; parsed: TResponse | null; raw: string }> {
  const url = buildApiUrl(path);
  const response = await fetchWithTimeout(url, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    ok: response.ok,
    status: response.status,
    parsed: safeJsonParse<TResponse>(response.body),
    raw: response.body,
  };
}

async function searchEvents(input: TicketResolveInput): Promise<GigsbergEvent[]> {
  const bodies = buildEventSearchBodies(input);
  const collected: GigsbergEvent[] = [];

  for (const body of bodies) {
    console.log("[Gigsberg] event search request", {
      path: EVENT_SEARCH_PATH,
      body,
    });

    let response:
      | { ok: boolean; status: number; parsed: GigsbergEventsResponse | null; raw: string }
      | null = null;

    try {
      response = await postJson<GigsbergEventsResponse>(EVENT_SEARCH_PATH, body);
    } catch (error) {
      console.log("[Gigsberg] event search failed", {
        body,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    if (!response.ok) {
      console.log("[Gigsberg] event search non-200", {
        status: response.status,
        body,
        raw: response.raw.slice(0, 500),
      });
      continue;
    }

    const events = extractEvents(response.parsed);

    console.log("[Gigsberg] event search response", {
      body,
      count: events.length,
      sample: events.slice(0, 5).map(summarizeEvent),
    });

    if (events.length > 0) {
      collected.push(...events);
    }

    if (collected.length >= EVENTS_PER_PAGE) {
      break;
    }
  }

  return dedupeEvents(collected);
}

async function searchListingsForEvent(eventIdValue: string): Promise<GigsbergListing[]> {
  if (!eventIdValue) return [];

  const body = {
    page: 1,
    per_page: LISTINGS_PER_PAGE,
    event_id: Number.isFinite(Number(eventIdValue)) ? Number(eventIdValue) : eventIdValue,
    currency: "EUR",
  };

  console.log("[Gigsberg] listing search request", {
    path: LISTING_SEARCH_PATH,
    body,
  });

  let response:
    | { ok: boolean; status: number; parsed: GigsbergListingsResponse | null; raw: string }
    | null = null;

  try {
    response = await postJson<GigsbergListingsResponse>(LISTING_SEARCH_PATH, body);
  } catch (error) {
    console.log("[Gigsberg] listing search failed", {
      body,
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }

  if (!response.ok) {
    console.log("[Gigsberg] listing search non-200", {
      status: response.status,
      body,
      raw: response.raw.slice(0, 500),
    });
    return [];
  }

  const listings = dedupeListings(extractListings(response.parsed));

  console.log("[Gigsberg] listing search response", {
    body,
    count: listings.length,
    sample: listings.slice(0, 5).map(summarizeListing),
  });

  return listings;
}

async function fetchMarketDataForEvent(eventIdValue: string): Promise<GigsbergMarketDataResponse> {
  if (!eventIdValue) return null;

  const body = {
    event_id: Number.isFinite(Number(eventIdValue)) ? Number(eventIdValue) : eventIdValue,
    currency_id: 1,
  };

  console.log("[Gigsberg] market-data request", {
    path: MARKET_DATA_PATH,
    body,
  });

  try {
    const response = await postJson<GigsbergMarketDataResponse>(MARKET_DATA_PATH, body);

    if (!response.ok) {
      console.log("[Gigsberg] market-data non-200", {
        status: response.status,
        body,
        raw: response.raw.slice(0, 500),
      });
      return null;
    }

    console.log("[Gigsberg] market-data response", {
      body,
      parsed: response.parsed,
    });

    return response.parsed;
  } catch (error) {
    console.log("[Gigsberg] market-data failed", {
      body,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function resolveGigsbergCandidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasGigsbergConfig()) {
    console.log("[Gigsberg] skipped: missing config");
    return null;
  }

  const homeName = clean(input.homeName);
  const awayName = clean(input.awayName);
  const kickoffIso = clean(input.kickoffIso);

  if (!homeName || !awayName || !kickoffIso) {
    console.log("[Gigsberg] skipped: missing required input", {
      homeName,
      awayName,
      kickoffIso,
    });
    return null;
  }

  const events = await searchEvents(input);

  if (!events.length) {
    const fallbackUrl = buildPublicSearchUrl(input);

    console.log("[Gigsberg] no events found, using public fallback", {
      fallbackUrl,
    });

    if (!fallbackUrl) return null;

    return {
      provider: "gigsberg",
      exact: false,
      score: MIN_PUBLIC_FALLBACK_SCORE,
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const scoredEvents = events
    .map((ev) => scoreEvent(ev, input))
    .filter((x) => isStrongEnoughEvent(x.score))
    .sort((a, b) => {
      if (a.exactTeams !== b.exactTeams) return a.exactTeams ? -1 : 1;
      if (a.sameDay !== b.sameDay) return a.sameDay ? -1 : 1;
      return b.score - a.score;
    });

  console.log("[Gigsberg] scored events", {
    totalEvents: events.length,
    strongEvents: scoredEvents.length,
    top: scoredEvents.slice(0, 5).map((x) => ({
      ...summarizeEvent(x.ev),
      score: x.score,
      exactTeams: x.exactTeams,
      sameDay: x.sameDay,
      reasons: x.reasons,
    })),
  });

  if (!scoredEvents.length) {
    const fallbackUrl = buildPublicSearchUrl(input);

    console.log("[Gigsberg] events found but no strong match", {
      fallbackUrl,
    });

    if (!fallbackUrl) return null;

    return {
      provider: "gigsberg",
      exact: false,
      score: MIN_PUBLIC_FALLBACK_SCORE,
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const bestEvent = scoredEvents[0];
  const bestEventId = eventId(bestEvent.ev);
  const bestEventName = eventName(bestEvent.ev);

  if (!bestEventId) {
    const fallbackUrl = buildPublicSearchUrl(input);

    console.log("[Gigsberg] best event missing id", {
      bestEvent: {
        ...summarizeEvent(bestEvent.ev),
        score: bestEvent.score,
        reasons: bestEvent.reasons,
      },
      fallbackUrl,
    });

    if (!fallbackUrl) return null;

    return {
      provider: "gigsberg",
      exact: false,
      score: Math.max(20, bestEvent.score - GIGSBERG_SEARCH_FALLBACK_PENALTY),
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: null,
      reason: "search_fallback",
    };
  }

  const [listings, marketData] = await Promise.all([
    searchListingsForEvent(bestEventId),
    fetchMarketDataForEvent(bestEventId),
  ]);

  if (!listings.length) {
    const fallbackUrl = buildEventSearchUrl(bestEventName || `${homeName} vs ${awayName}`);

    console.log("[Gigsberg] matched event but no listings, using event fallback", {
      bestEvent: {
        ...summarizeEvent(bestEvent.ev),
        score: bestEvent.score,
        reasons: bestEvent.reasons,
      },
      fallbackUrl,
      marketData,
    });

    const finalScore = Math.max(20, bestEvent.score - GIGSBERG_SEARCH_FALLBACK_PENALTY);

    return {
      provider: "gigsberg",
      exact: false,
      score: finalScore,
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: marketDataMinPriceText(marketData),
      reason: "search_fallback",
    };
  }

  const scoredListings: ScoredListing[] = listings
    .map((listing) => ({
      listing,
      score: scoreListing(listing),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aPrice = listingPriceValue(a.listing);
      const bPrice = listingPriceValue(b.listing);

      if (aPrice != null && bPrice != null && aPrice !== bPrice) {
        return aPrice - bPrice;
      }

      return 0;
    });

  const bestListing = scoredListings[0];
  const listingUrl = buildEventSearchUrl(bestEventName || `${homeName} vs ${awayName}`);
  const marketDataBonus = scoreMarketData(marketData);

  const combinedScore = Math.min(
    100,
    bestEvent.score +
      Math.min(GIGSBERG_LISTING_BONUS_CAP, bestListing?.score ?? 0) +
      marketDataBonus
  );

  const exact = isExactEvent(bestEvent, combinedScore);

  console.log("[Gigsberg] matched event/listing", {
    event: {
      ...summarizeEvent(bestEvent.ev),
      eventScore: bestEvent.score,
      exact,
      reasons: bestEvent.reasons,
    },
    listing: bestListing
      ? {
          ...summarizeListing(bestListing.listing),
          listingScore: bestListing.score,
        }
      : null,
    marketData,
    marketDataBonus,
    combinedScore,
    resolvedUrl: listingUrl,
  });

  return {
    provider: "gigsberg",
    exact,
    score: combinedScore,
    url: listingUrl,
    title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
    priceText:
      listingPriceText(bestListing.listing) ||
      marketDataMinPriceText(marketData),
    reason: exact ? "exact_event" : "partial_match",
  };
      }
