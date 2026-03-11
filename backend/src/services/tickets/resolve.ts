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
const MAX_RETURNED_OPTIONS = 3;
const MIN_FALLBACK_SCORE = 20;

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

function buildNotFound(
  checkedProviders: TicketResolution["checkedProviders"]
): TicketResolution {
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
    options: [],
  };
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

function dedupeCandidates(candidates: TicketCandidate[]): TicketCandidate[] {
  const map = new Map<string, TicketCandidate>();

  for (const candidate of candidates) {
    const key = [
      clean(candidate.provider).toLowerCase(),
      clean(candidate.url).toLowerCase(),
      clean(candidate.title).toLowerCase(),
    ].join("|");

    const existing = map.get(key);

    if (!existing) {
      map.set(key, candidate);
      continue;
    }

    if (candidate.exact && !existing.exact) {
      map.set(key, candidate);
      continue;
    }

    if (candidate.score > existing.score) {
      map.set(key, candidate);
    }
  }

  return Array.from(map.values());
}

function sortCandidates(candidates: TicketCandidate[]): TicketCandidate[] {
  return [...candidates].sort((a, b) => {
    if (a.reason === "exact_event" && b.reason !== "exact_event") return -1;
    if (a.reason !== "exact_event" && b.reason === "exact_event") return 1;

    if (a.reason === "partial_match" && b.reason === "search_fallback") return -1;
    if (a.reason === "search_fallback" && b.reason === "partial_match") return 1;

    if (a.exact && !b.exact) return -1;
    if (!a.exact && b.exact) return 1;

    if (b.score !== a.score) return b.score - a.score;

    const aHasPrice = Boolean(clean(a.priceText));
    const bHasPrice = Boolean(clean(b.priceText));
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    return a.provider.localeCompare(b.provider);
  });
}

function filterFallbacks(candidates: TicketCandidate[]): TicketCandidate[] {
  return candidates.filter((candidate) => {
    if (candidate.reason === "exact_event") return true;
    if (candidate.reason === "partial_match") return candidate.score >= Math.max(35, MIN_FALLBACK_SCORE);
    return candidate.score >= MIN_FALLBACK_SCORE;
  });
}

function buildResolution(
  candidates: TicketCandidate[],
  checkedProviders: TicketResolution["checkedProviders"]
): TicketResolution {
  const filtered = filterFallbacks(dedupeCandidates(candidates));
  const sorted = sortCandidates(filtered);
  const top = sorted.slice(0, MAX_RETURNED_OPTIONS);

  if (!top.length) {
    return buildNotFound(checkedProviders);
  }

  const best = top[0];

  return {
    ok: true,
    provider: best.provider,
    exact: best.exact,
    score: best.score,
    url: best.url,
    title: best.title,
    priceText: best.priceText ?? null,
    reason: best.reason,
    checkedProviders,
    options: top.map((candidate) => ({
      provider: candidate.provider,
      exact: candidate.exact,
      score: candidate.score,
      url: candidate.url,
      title: candidate.title,
      priceText: candidate.priceText ?? null,
      reason: candidate.reason,
    })),
  };
}

export async function resolveTicket(
  input: TicketResolveInput
): Promise<TicketResolution> {
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
        cachedOptions: Array.isArray(cached.options) ? cached.options.length : 0,
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

  const gigsberg = await withTimeout("gigsberg", () =>
    resolveGigsbergCandidate(input)
  );

  checkedProviders.push("gigsberg");
  console.log("[tickets] provider result", {
    provider: "gigsberg",
    candidate: summarizeCandidate(gigsberg),
  });
  if (gigsberg) candidates.push(gigsberg);

  const result = buildResolution(candidates, checkedProviders);

  if (result.ok) {
    console.log("[tickets] resolved", {
      selectedProvider: result.provider,
      selectedReason: result.reason,
      selectedScore: result.score,
      selectedExact: result.exact,
      checkedProviders,
      options: Array.isArray(result.options)
        ? result.options.map((option) => ({
            provider: option.provider,
            reason: option.reason,
            score: option.score,
            exact: option.exact,
            priceText: option.priceText ?? null,
          }))
        : [],
      debugNoCache,
    });
  } else {
    console.log("[tickets] no result", {
      checkedProviders,
      input: summarizeInput(input),
      debugNoCache,
    });
  }

  if (!debugNoCache) {
    setCache(cacheKey, result);
  }

  return result;
}
