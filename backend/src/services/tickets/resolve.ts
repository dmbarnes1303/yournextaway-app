import { resolveFtnCandidate } from "./ftn.js";
import { resolveSe365Candidate } from "./se365.js";
import { resolveGigsbergCandidate } from "./gigsberg.js";
import type {
  TicketCandidate,
  TicketResolution,
  TicketResolveInput,
  TicketProviderId,
} from "./types.js";

type CacheEntry = {
  expires: number;
  value: TicketResolution;
};

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 10;
const PROVIDER_TIMEOUT_MS = 7000;
const MAX_RETURNED_OPTIONS = 3;
const MIN_FALLBACK_SCORE = 20;

const PROVIDER_PRIORITY: Record<TicketProviderId, number> = {
  footballticketsnet: 1,
  sportsevents365: 2,
  gigsberg: 3,
};

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function normalize(v: unknown): string {
  return clean(v).toLowerCase();
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

function setCache(key: string, value: TicketResolution): void {
  CACHE.set(key, {
    expires: Date.now() + CACHE_TTL_MS,
    value,
  });
}

function deleteCache(key: string): void {
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
      normalize(candidate.provider),
      normalize(candidate.url),
      normalize(candidate.title),
    ].join("|");

    const existing = map.get(key);

    if (!existing) {
      map.set(key, candidate);
      continue;
    }

    if (candidate.score > existing.score) {
      map.set(key, candidate);
      continue;
    }

    if (candidate.score === existing.score) {
      const currentRank = PROVIDER_PRIORITY[candidate.provider] ?? 99;
      const existingRank = PROVIDER_PRIORITY[existing.provider] ?? 99;

      if (currentRank < existingRank) {
        map.set(key, candidate);
      }
    }
  }

  return Array.from(map.values());
}

function reasonRank(reason: TicketCandidate["reason"]): number {
  if (reason === "exact_event") return 1;
  if (reason === "partial_match") return 2;
  return 3;
}

function providerRank(provider: TicketProviderId): number {
  return PROVIDER_PRIORITY[provider] ?? 99;
}

function sortCandidates(candidates: TicketCandidate[]): TicketCandidate[] {
  return [...candidates].sort((a, b) => {
    const aReasonRank = reasonRank(a.reason);
    const bReasonRank = reasonRank(b.reason);

    if (aReasonRank !== bReasonRank) {
      return aReasonRank - bReasonRank;
    }

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const aHasPrice = Boolean(clean(a.priceText));
    const bHasPrice = Boolean(clean(b.priceText));

    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    return providerRank(a.provider) - providerRank(b.provider);
  });
}

function filterFallbacks(candidates: TicketCandidate[]): TicketCandidate[] {
  return candidates.filter((candidate) => {
    if (candidate.reason === "exact_event") return true;
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

  if (top.length === 0) {
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
  if (ftn) {
    candidates.push(ftn);
  }

  checkedProviders.push("sportsevents365");
  console.log("[tickets] provider result", {
    provider: "sportsevents365",
    candidate: summarizeCandidate(se365),
  });
  if (se365) {
    candidates.push(se365);
  }

  const gigsberg = await withTimeout("gigsberg", () =>
    resolveGigsbergCandidate(input)
  );

  checkedProviders.push("gigsberg");
  console.log("[tickets] provider result", {
    provider: "gigsberg",
    candidate: summarizeCandidate(gigsberg),
  });
  if (gigsberg) {
    candidates.push(gigsberg);
  }

  const result = buildResolution(candidates, checkedProviders);

  if (result.ok) {
    console.log("[tickets] resolved", {
      selectedProvider: result.provider,
      selectedReason: result.reason,
      selectedScore: result.score,
      selectedExact: result.exact,
      checkedProviders,
      options: result.options.map((option) => ({
        provider: option.provider,
        reason: option.reason,
        score: option.score,
        exact: option.exact,
        priceText: option.priceText ?? null,
      })),
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
