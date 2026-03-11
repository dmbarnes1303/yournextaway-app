import { resolveFtnCandidate } from "./ftn.js";
import { resolveSe365Candidate } from "./se365.js";
import { resolveGigsbergCandidate } from "./gigsberg.js";
import type { TicketCandidate, TicketResolution, TicketResolveInput } from "./types.js";

type CacheEntry = {
  expires: number;
  value: TicketResolution;
};

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 10;

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function buildCacheKey(input: TicketResolveInput): string {
  return [
    clean(input.fixtureId),
    clean(input.homeName),
    clean(input.awayName),
    clean(input.kickoffIso),
    clean(input.leagueId),
    clean(input.leagueName),
  ]
    .join("|")
    .toLowerCase();
}

function getCache(key: string): TicketResolution | null {
  const entry = CACHE.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    CACHE.delete(key);
    return null;
  }

  return entry.value;
}

function setCache(key: string, value: TicketResolution) {
  CACHE.set(key, {
    expires: Date.now() + CACHE_TTL,
    value,
  });
}

function buildNotFound(checkedProviders: TicketResolution["checkedProviders"]): TicketResolution {
  return {
    ok: false,
    provider: null,
    exact: false,
    score: null,
    url: null,
    title: null,
    priceText: null,
    reason: "not_found",
    checkedProviders,
  };
}

function chooseBestDirect(candidates: TicketCandidate[]): TicketCandidate | null {
  const direct = candidates.filter((x) => x.reason === "exact_event");
  if (!direct.length) return null;

  direct.sort((a, b) => b.score - a.score);
  return direct[0] ?? null;
}

function chooseBestFallback(candidates: TicketCandidate[]): TicketCandidate | null {
  const fallbacks = candidates.filter((x) => x.reason === "search_fallback");
  if (!fallbacks.length) return null;

  fallbacks.sort((a, b) => b.score - a.score);
  return fallbacks[0] ?? null;
}

export async function resolveTicket(
  input: TicketResolveInput
): Promise<TicketResolution> {
  const cacheKey = buildCacheKey(input);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const checkedProviders: TicketResolution["checkedProviders"] = [];
  const candidates: TicketCandidate[] = [];

  const [ftn, se365] = await Promise.all([
    resolveFtnCandidate(input),
    resolveSe365Candidate(input),
  ]);

  checkedProviders.push("footballticketsnet");
  if (ftn) candidates.push(ftn);

  checkedProviders.push("sportsevents365");
  if (se365) candidates.push(se365);

  // First preference: exact/direct event matches only.
  const bestDirect = chooseBestDirect(candidates);
  if (bestDirect) {
    const result: TicketResolution = {
      ok: true,
      provider: bestDirect.provider,
      exact: bestDirect.exact,
      score: bestDirect.score,
      url: bestDirect.url,
      title: bestDirect.title,
      priceText: bestDirect.priceText ?? null,
      reason: bestDirect.reason,
      checkedProviders,
    };

    setCache(cacheKey, result);
    return result;
  }

  // Only try Gigsberg if no direct FTN/SE365 match was found.
  const gigsberg = await resolveGigsbergCandidate(input);
  checkedProviders.push("gigsberg");
  if (gigsberg) {
    candidates.push(gigsberg);
  }

  const bestFallback = chooseBestFallback(candidates);
  if (bestFallback) {
    const result: TicketResolution = {
      ok: true,
      provider: bestFallback.provider,
      exact: bestFallback.exact,
      score: bestFallback.score,
      url: bestFallback.url,
      title: bestFallback.title,
      priceText: bestFallback.priceText ?? null,
      reason: bestFallback.reason,
      checkedProviders,
    };

    setCache(cacheKey, result);
    return result;
  }

  const notFound = buildNotFound(checkedProviders);
  setCache(cacheKey, notFound);
  return notFound;
}
