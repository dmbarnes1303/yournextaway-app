import { env, hasGigsbergConfig } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";
import { expandTeamAliases, getPreferredTeamName } from "./teamAliases.js";

type GigsbergEvent = {
  id?: number | string;
  name?: string;
  event_name?: string;
  date?: string;
  event_date?: string;
  city?: string;
  venue?: string;
  venue_name?: string;
  country?: string;
  country_name?: string;
  type?: string;
  type_name?: string;
  subtype?: string;
  subtype_name?: string;
};

type GigsbergEventsResponse = {
  data?: GigsbergEvent[];
  total?: number;
  nextPage?: string | number | null;
  prevPage?: string | number | null;
  lastPage?: string | number | null;
};

type GigsbergListing = {
  id?: number | string;
  listing_id?: number | string;
  event_id?: number | string;
  block?: string;
  category?: string;
  split_type?: string;
  quantity?: number | string;
  total_price?: number | string;
  totalPrice?: number | string;
  price?: number | string;
  price_per_ticket?: number | string;
  currency?: string;
  currency_code?: string;
};

type GigsbergListingsResponse = {
  data?: GigsbergListing[];
  total?: number;
  nextPage?: string | number | null;
  prevPage?: string | number | null;
  lastPage?: string | number | null;
};

const GIGSBERG_FETCH_TIMEOUT_MS = 6500;
const EVENTS_PER_PAGE = 25;
const LISTINGS_PER_PAGE = 20;
const MIN_PUBLIC_FALLBACK_SCORE = 22;

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

function listingId(listing: GigsbergListing): string {
  return clean(listing.id) || clean(listing.listing_id);
}

function listingEventId(listing: GigsbergListing): string {
  return clean(listing.event_id);
}

function numberFromUnknown(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const raw = clean(v);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function listingQuantity(listing: GigsbergListing): number | null {
  return numberFromUnknown(listing.quantity);
}

function listingCurrency(listing: GigsbergListing): string {
  return clean(listing.currency_code) || clean(listing.currency);
}

function listingPriceValue(listing: GigsbergListing): number | null {
  return (
    numberFromUnknown(listing.total_price) ??
    numberFromUnknown(listing.totalPrice) ??
    numberFromUnknown(listing.price_per_ticket) ??
    numberFromUnknown(listing.price) ??
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

function buildDateWindow(kickoffIso: string): { dateFrom?: string; dateTo?: string } {
  const kickoff = safeDate(kickoffIso);
  if (!kickoff) return {};

  return {
    dateFrom: formatYmd(addDays(kickoff, -2)),
    dateTo: formatYmd(addDays(kickoff, 2)),
  };
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

function buildListingUrl(eventNameValue: string): string {
  const url = new URL("https://www.gigsberg.com/search");
  url.searchParams.set("query", eventNameValue);

  const affiliateId = clean(env.gigsbergAffiliateId);
  if (affiliateId) {
    url.searchParams.set("aff", affiliateId);
  }

  return url.toString();
}

function containsTeamsLoose(name: string, homeVariants: string[], awayVariants: string[]): boolean {
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

function exactNameMatch(ev: GigsbergEvent, input: TicketResolveInput): boolean {
  const name = eventName(ev);
  if (!name || isBadVariant(name)) return false;

  const homeVariants = expandTeamAliases(input.homeName);
  const awayVariants = expandTeamAliases(input.awayName);

  return containsTeamsLoose(name, homeVariants, awayVariants);
}

function scoreEvent(ev: GigsbergEvent, input: TicketResolveInput): number {
  let score = 0;

  const name = eventName(ev);
  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));
  const homeVariants = expandTeamAliases(input.homeName);
  const awayVariants = expandTeamAliases(input.awayName);

  if (name && containsTeamsLoose(name, homeVariants, awayVariants)) {
    score += 62;
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

  const typeText = `${eventType(ev)} ${eventSubtype(ev)}`.toLowerCase();
  if (typeText.includes("sport")) score += 3;
  if (typeText.includes("football")) score += 8;
  if (eventVenue(ev)) score += 2;
  if (eventCity(ev)) score += 1;
  if (eventCountry(ev)) score += 1;

  return score;
}

function isStrongEnoughEvent(score: number): boolean {
  return score >= 55;
}

function isExactEvent(ev: GigsbergEvent, input: TicketResolveInput, score: number): boolean {
  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));

  if (!exactNameMatch(ev, input)) return false;
  if (!kickoff || !evDt) return false;

  return absDays(kickoff, evDt) === 0 && score >= 85;
}

function scoreListing(listing: GigsbergListing): number {
  let score = 0;

  const qty = listingQuantity(listing);
  const price = listingPriceValue(listing);
  const block = clean(listing.block);
  const category = clean(listing.category);
  const splitType = clean(listing.split_type);

  if (listingId(listing)) score += 5;
  if (listingEventId(listing)) score += 5;

  if (qty != null) {
    if (qty >= 2) score += 10;
    else if (qty === 1) score += 5;
  }

  if (price != null) score += 8;
  if (block) score += 3;
  if (category) score += 3;

  if (splitType) {
    score += 2;
    if (norm(splitType).includes("avoid")) score -= 3;
    if (norm(splitType).includes("none")) score += 1;
  }

  return score;
}

function summarizeEvent(ev: GigsbergEvent) {
  return {
    id: clean(ev.id) || null,
    name: eventName(ev) || null,
    date: eventDate(ev) || null,
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
    quantity: listingQuantity(listing),
    priceText: listingPriceText(listing),
    block: clean(listing.block) || null,
    category: clean(listing.category) || null,
    splitType: clean(listing.split_type) || null,
  };
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

async function searchEvents(input: TicketResolveInput): Promise<GigsbergEvent[]> {
  const base = env.gigsbergBaseUrl.replace(/\/+$/, "");
  const home = getPreferredTeamName(input.homeName);
  const away = getPreferredTeamName(input.awayName);
  const name = `${home} ${away}`.trim();
  const dateWindow = buildDateWindow(input.kickoffIso);

  const url = new URL(`${base}/search/events`);
  if (name) url.searchParams.set("name", name);
  if (dateWindow.dateFrom) url.searchParams.set("date_from", dateWindow.dateFrom);
  if (dateWindow.dateTo) url.searchParams.set("date_to", dateWindow.dateTo);
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", String(EVENTS_PER_PAGE));
  url.searchParams.set("sort_by", "id");
  url.searchParams.set("sort_order", "desc");

  console.log("[Gigsberg] events request start", {
    requestUrl: url.toString(),
    homeName: clean(input.homeName),
    awayName: clean(input.awayName),
    kickoffIso: clean(input.kickoffIso),
    leagueName: clean(input.leagueName) || null,
    leagueId: clean(input.leagueId) || null,
  });

  let response: { ok: boolean; status: number; body: string };
  try {
    response = await fetchWithTimeout(url.toString(), { method: "GET" });
  } catch (error) {
    console.log("[Gigsberg] events request failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }

  if (!response.ok) {
    console.log("[Gigsberg] events non-200 response", {
      status: response.status,
      body: response.body.slice(0, 500),
      requestUrl: url.toString(),
    });
    return [];
  }

  const parsed = safeJsonParse<GigsbergEventsResponse>(response.body);
  const events = Array.isArray(parsed?.data) ? parsed.data : [];

  console.log("[Gigsberg] events response", {
    count: events.length,
    sample: events.slice(0, 5).map(summarizeEvent),
  });

  return events;
}

async function searchListingsForEvent(eventId: string): Promise<GigsbergListing[]> {
  const base = env.gigsbergBaseUrl.replace(/\/+$/, "");
  const url = `${base}/search/listings`;

  const body = {
    event_id: Number.isFinite(Number(eventId)) ? Number(eventId) : eventId,
    currency_code: "EUR",
  };

  console.log("[Gigsberg] listings request start", {
    eventId,
    requestUrl: url,
    body,
  });

  let response: { ok: boolean; status: number; body: string };
  try {
    response = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.log("[Gigsberg] listings request failed", {
      eventId,
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }

  if (!response.ok) {
    console.log("[Gigsberg] listings non-200 response", {
      eventId,
      status: response.status,
      body: response.body.slice(0, 500),
      requestUrl: url,
    });
    return [];
  }

  const parsed = safeJsonParse<GigsbergListingsResponse>(response.body);
  const listings = Array.isArray(parsed?.data)
    ? parsed.data.slice(0, LISTINGS_PER_PAGE)
    : [];

  console.log("[Gigsberg] listings response", {
    eventId,
    count: listings.length,
    sample: listings.slice(0, 5).map(summarizeListing),
  });

  return listings;
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
    .map((ev) => ({
      ev,
      score: scoreEvent(ev, input),
    }))
    .filter((x) => isStrongEnoughEvent(x.score))
    .sort((a, b) => b.score - a.score);

  if (!scoredEvents.length) {
    const fallbackUrl = buildPublicSearchUrl(input);

    console.log("[Gigsberg] events found but no strong match", {
      sample: events.slice(0, 5).map((ev) => ({
        ...summarizeEvent(ev),
        score: scoreEvent(ev, input),
      })),
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
  const bestEventId = clean(bestEvent.ev.id);
  const bestEventName = eventName(bestEvent.ev);
  const exact = isExactEvent(bestEvent.ev, input, bestEvent.score);

  if (!bestEventId) {
    const fallbackUrl = buildPublicSearchUrl(input);

    console.log("[Gigsberg] best event missing id", {
      bestEvent: {
        ...summarizeEvent(bestEvent.ev),
        score: bestEvent.score,
        exact,
      },
      fallbackUrl,
    });

    if (!fallbackUrl) return null;

    return {
      provider: "gigsberg",
      exact,
      score: Math.max(25, bestEvent.score - 15),
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: null,
      reason: exact ? "partial_match" : "search_fallback",
    };
  }

  const listings = await searchListingsForEvent(bestEventId);

  if (!listings.length) {
    const fallbackUrl = buildListingUrl(bestEventName || `${homeName} vs ${awayName}`);

    console.log("[Gigsberg] matched event but no listings, using event fallback", {
      bestEvent: {
        ...summarizeEvent(bestEvent.ev),
        score: bestEvent.score,
        exact,
      },
      fallbackUrl,
    });

    return {
      provider: "gigsberg",
      exact,
      score: exact ? bestEvent.score : Math.max(30, bestEvent.score - 10),
      url: fallbackUrl,
      title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
      priceText: null,
      reason: exact ? "partial_match" : "search_fallback",
    };
  }

  const scoredListings = listings
    .map((listing) => ({
      listing,
      score: scoreListing(listing),
    }))
    .sort((a, b) => b.score - a.score);

  const bestListing = scoredListings[0];
  const listingUrl = buildListingUrl(bestEventName || `${homeName} vs ${awayName}`);
  const combinedScore = Math.min(
    100,
    bestEvent.score + Math.min(18, bestListing?.score ?? 0)
  );

  console.log("[Gigsberg] matched event/listing", {
    event: {
      ...summarizeEvent(bestEvent.ev),
      eventScore: bestEvent.score,
      exact,
    },
    listing: bestListing
      ? {
          ...summarizeListing(bestListing.listing),
          listingScore: bestListing.score,
        }
      : null,
    combinedScore,
    resolvedUrl: listingUrl,
  });

  return {
    provider: "gigsberg",
    exact,
    score: combinedScore,
    url: listingUrl,
    title: `Tickets: ${getPreferredTeamName(input.homeName)} vs ${getPreferredTeamName(input.awayName)}`,
    priceText: bestListing ? listingPriceText(bestListing.listing) : null,
    reason: exact ? "exact_event" : "partial_match",
  };
}
