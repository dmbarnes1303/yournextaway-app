import { resolveFtnCandidate } from "./ftn.js";
import { resolveSe365Candidate } from "./se365.js";
import { resolveGigsbergCandidate } from "./gigsberg.js";
import type { TicketCandidate, TicketResolution, TicketResolveInput } from "./types.js";

type CacheEntry = {
  expires: number;
  value: TicketResolution;
};

const CACHE = new Map<string, CacheEntry>();

// 10 minutes cache
const CACHE_TTL = 1000 * 60 * 10;

function buildCacheKey(input: TicketResolveInput): string {
  return [
    input.homeName,
    input.awayName,
    input.kickoffIso,
    input.leagueId ?? "",
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

export async function resolveTicket(
  input: TicketResolveInput
): Promise<TicketResolution> {

  const cacheKey = buildCacheKey(input);
  const cached = getCache(cacheKey);

  if (cached) {
    return cached;
  }

  const checkedProviders: TicketResolution["checkedProviders"] = [];

  const candidates: TicketCandidate[] = [];

  const [ftn, se365, gigsberg] = await Promise.all([
    resolveFtnCandidate(input),
    resolveSe365Candidate(input),
    resolveGigsbergCandidate(input),
  ]);

  checkedProviders.push("footballticketsnet");
  if (ftn) candidates.push(ftn);

  checkedProviders.push("sportsevents365");
  if (se365) candidates.push(se365);

  checkedProviders.push("gigsberg");
  if (gigsberg) candidates.push(gigsberg);

  if (!candidates.length) {
    const result: TicketResolution = {
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

    setCache(cacheKey, result);
    return result;
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  const result: TicketResolution = {
    ok: true,
    provider: best.provider,
    exact: best.exact,
    score: best.score,
    url: best.url,
    title: best.title,
    priceText: best.priceText ?? null,
    reason: best.reason,
    checkedProviders,
  };

  setCache(cacheKey, result);

  return result;
}
