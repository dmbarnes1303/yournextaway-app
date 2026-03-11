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
const PROVIDER_TIMEOUT_MS = 7000;

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

function deleteCache(key: string) {
  CACHE.delete(key);
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

function summarizeInput(input: TicketResolveInput) {
  return {
    fixtureId: clean(input.fixtureId) || null,
    homeName: clean(input.homeName) || null,
    awayName: clean(input.awayName) || null,
    kickoffIso: clean(input.kickoffIso) || null,
    leagueId: clean(input.leagueId) || null,
    leagueName: clean(input.leagueName) || null,
    debugNoCache: Boolean(input.debugNoCache),
  };
}

function summarizeCandidate(candidate: TicketCandidate | null) {
  if (!candidate) return null;

  return {
    provider: candidate.provider,
    exact: candidate.exact,
    score: candidate.score,
    reason: candidate.reason,
    title: candidate.title,
    priceText: candidate.priceText ?? null,
    hasUrl: Boolean(clean(candidate.url)),
  };
}

async function withTimeout<T>(
  label: string,
  fn: () => Promise<T>,
  timeoutMs = PROVIDER_TIMEOUT_MS
): Promise<T | null> {
  const startedAt = Date.now();

  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), timeoutMs);
  });

  try {
    const result = (await Promise.race([fn(), timeoutPromise])) as T | null;
    const durationMs = Date.now() - startedAt;

    if (result === null) {
      console.log(`[tickets] ${label} timeout-or-null`, {
        durationMs,
        timeoutMs,
      });
      return null;
    }

    console.log(`[tickets] ${label} completed`, {
      durationMs,
      timeoutMs,
    });
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.log(`[tickets] ${label} error`, {
      durationMs,
      timeoutMs,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function buildResolution(
  candidate: TicketCandidate,
  checkedProviders: TicketResolution["checkedProviders"]
): TicketResolution {
  return {
    ok: true,
    provider: candidate.provider,
    exact: candidate.exact,
    score: candidate.score,
    url: candidate.url,
    title: candidate.title,
    priceText: candidate.priceText ?? null,
    reason: candidate.reason,
    checkedProviders,
  };
}

export async function resolveTicket(input: TicketResolveInput): Promise<TicketResolution> {
  const cacheKey = buildCacheKey(input);
  const debugNoCache = Boolean(input.debugNoCache);

  if (debugNoCache) {
    deleteCache(cacheKey);
    console.log("[tickets] cache bypass requested", {
      key: cacheKey,
      input: summarizeInput(input),
    });
  } else {
    const cached = getCache(cacheKey);

    if (cached) {
      console.log("[tickets] cache hit", {
        key: cacheKey,
        input: summarizeInput(input),
        cachedProvider: cached.provider,
        cachedReason: cached.reason,
        cachedScore: cached.score,
        cachedOk: cached.ok,
      });
      return cached;
    }
  }

  console.log("[tickets] resolve start", {
    key: cacheKey,
    input: summarizeInput(input),
  });

  const checkedProviders: TicketResolution["checkedProviders"] = [];
  const candidates: TicketCandidate[] = [];

  const [ftn, se365] = await Promise.all([
    withTimeout("footballticketsnet", () => resolveFtnCandidate(input)),
    withTimeout("sportsevents365", () => resolveSe365Candidate(input)),
  ]);

  checkedProviders.push("footballticketsnet");
  console.log("[tickets] provider result", {
    provider: "footballticketsnet",
    candidate: summarizeCandidate(ftn),
  });
  if (ftn) candidates.push(ftn);

  checkedProviders.push("sportsevents365");
  console.log("[tickets] provider result", {
    provider: "sportsevents365",
    candidate: summarizeCandidate(se365),
  });
  if (se365) candidates.push(se365);

  const bestDirect = chooseBestDirect(candidates);
  if (bestDirect) {
    const result = buildResolution(bestDirect, checkedProviders);

    console.log("[tickets] resolved direct", {
      selected: summarizeCandidate(bestDirect),
      checkedProviders,
      debugNoCache,
    });

    if (!debugNoCache) {
      setCache(cacheKey, result);
    }

    return result;
  }

  const gigsberg = await withTimeout("gigsberg", () => resolveGigsbergCandidate(input));

  checkedProviders.push("gigsberg");
  console.log("[tickets] provider result", {
    provider: "gigsberg",
    candidate: summarizeCandidate(gigsberg),
  });
  if (gigsberg) candidates.push(gigsberg);

  const bestFallback = chooseBestFallback(candidates);
  if (bestFallback) {
    const result = buildResolution(bestFallback, checkedProviders);

    console.log("[tickets] resolved fallback", {
      selected: summarizeCandidate(bestFallback),
      checkedProviders,
      debugNoCache,
    });

    if (!debugNoCache) {
      setCache(cacheKey, result);
    }

    return result;
  }

  const notFound = buildNotFound(checkedProviders);

  console.log("[tickets] no result", {
    checkedProviders,
    input: summarizeInput(input),
    debugNoCache,
  });

  if (!debugNoCache) {
    setCache(cacheKey, notFound);
  }

  return notFound;
}
