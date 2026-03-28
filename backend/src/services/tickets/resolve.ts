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

type ProviderStats = {
  calls: number;
  successes: number;
  nulls: number;
  timeouts: number;
  errors: number;
  lastDurationMs: number | null;
  lastSuccessAt: number | null;
  lastErrorAt: number | null;
};

type TimedResult<T> = {
  value: T | null;
  timedOut: boolean;
};

type CandidateUrlQuality = "event" | "listing" | "search" | "unknown";

type CandidateAssessment = {
  urlQuality: CandidateUrlQuality;
  adjustedScore: number;
};

const CACHE = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 1000 * 60 * 10;
const PROVIDER_TIMEOUT_MS = 4500;
const MAX_RETURNED_OPTIONS = 3;

/**
 * Hard floors.
 * Search results should almost never survive unless everything else fails.
 */
const MIN_EXACT_EVENT_SCORE = 70;
const MIN_PARTIAL_MATCH_SCORE = 58;
const MIN_SEARCH_FALLBACK_SCORE = 52;
const MIN_SELECTED_SCORE = 60;

const PROVIDER_PRIORITY: Record<TicketProviderId, number> = {
  footballticketsnet: 1,
  sportsevents365: 2,
  gigsberg: 3,
};

const PROVIDER_HOST_ALLOWLIST: Record<TicketProviderId, string[]> = {
  footballticketsnet: [
    "footballticketnet.com",
    "www.footballticketnet.com",
    "footballticketsnet.com",
    "www.footballticketsnet.com",
  ],
  sportsevents365: ["sportsevents365.com", "www.sportsevents365.com"],
  gigsberg: ["gigsberg.com", "www.gigsberg.com"],
};

const PROVIDER_STATS: Record<TicketProviderId, ProviderStats> = {
  footballticketsnet: {
    calls: 0,
    successes: 0,
    nulls: 0,
    timeouts: 0,
    errors: 0,
    lastDurationMs: null,
    lastSuccessAt: null,
    lastErrorAt: null,
  },
  sportsevents365: {
    calls: 0,
    successes: 0,
    nulls: 0,
    timeouts: 0,
    errors: 0,
    lastDurationMs: null,
    lastSuccessAt: null,
    lastErrorAt: null,
  },
  gigsberg: {
    calls: 0,
    successes: 0,
    nulls: 0,
    timeouts: 0,
    errors: 0,
    lastDurationMs: null,
    lastSuccessAt: null,
    lastErrorAt: null,
  },
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
    debugNoCache: Boolean((input as { debugNoCache?: unknown }).debugNoCache),
  };
}

function parsePriceAmount(priceText?: string | null): number | null {
  const raw = clean(priceText);
  if (!raw) return null;

  const match = raw.match(/(\d{1,3}(?:[,\d]{0,})(?:\.\d{1,2})?)/);
  if (!match) return null;

  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function isAllowedProviderUrl(provider: TicketProviderId, url: string): boolean {
  const raw = clean(url);
  if (!raw) return false;

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    const allowedRoots = PROVIDER_HOST_ALLOWLIST[provider] ?? [];

    return allowedRoots.some((root) => host === root || host.endsWith(`.${root}`));
  } catch {
    return false;
  }
}

function detectUrlQuality(candidate: TicketCandidate): CandidateUrlQuality {
  const raw = clean(candidate.url);
  if (!raw) return "unknown";

  try {
    const parsed = new URL(raw);
    const path = parsed.pathname.toLowerCase();
    const query = parsed.search.toLowerCase();

    const looksSearch =
      path === "/search" ||
      path.startsWith("/search/") ||
      path.includes("/events/search") ||
      path.includes("/event/search") ||
      path.includes("/search-results") ||
      query.includes("q=") ||
      query.includes("query=") ||
      query.includes("text=");

    if (looksSearch) return "search";

    if (path.includes("/listing") || path.includes("/listings")) return "listing";
    if (path.includes("/event") || path.includes("/events")) return "event";
    if (path.includes("/ticket") || path.includes("/tickets")) return "event";

    return "unknown";
  } catch {
    return "unknown";
  }
}

function assessCandidate(candidate: TicketCandidate): CandidateAssessment {
  const urlQuality = detectUrlQuality(candidate);

  let adjustedScore = candidate.score;

  if (urlQuality === "event") adjustedScore += 12;
  else if (urlQuality === "listing") adjustedScore += 8;
  else if (urlQuality === "unknown") adjustedScore -= 6;
  else if (urlQuality === "search") adjustedScore -= 24;

  if (candidate.reason === "exact_event") adjustedScore += 6;
  if (candidate.reason === "partial_match") adjustedScore += 0;
  if (candidate.reason === "search_fallback") adjustedScore -= 10;

  if (candidate.reason === "exact_event" && urlQuality === "search") {
    adjustedScore -= 35;
  }

  if (candidate.reason === "partial_match" && urlQuality === "search") {
    adjustedScore -= 18;
  }

  if (candidate.reason === "search_fallback" && urlQuality !== "search") {
    adjustedScore -= 4;
  }

  return {
    urlQuality,
    adjustedScore: Math.max(0, adjustedScore),
  };
}

function summarizeCandidate(candidate: TicketCandidate | null) {
  if (!candidate) return null;

  const assessment = assessCandidate(candidate);

  return {
    provider: candidate.provider,
    exact: candidate.exact,
    score: candidate.score,
    adjustedScore: assessment.adjustedScore,
    reason: candidate.reason,
    title: candidate.title,
    priceText: candidate.priceText ?? null,
    hasUrl: Boolean(clean(candidate.url)),
    url: clean(candidate.url) || null,
    urlQuality: assessment.urlQuality,
  };
}

function sanitizeCandidate(candidate: TicketCandidate | null): TicketCandidate | null {
  if (!candidate) return null;
  if (!clean(candidate.url) || !clean(candidate.title)) return null;

  if (!isAllowedProviderUrl(candidate.provider, candidate.url)) {
    console.log("[tickets] rejected by host allowlist", {
      provider: candidate.provider,
      url: candidate.url,
    });
    return null;
  }

  return candidate;
}

function recordProviderCall(
  provider: TicketProviderId,
  outcome: "success" | "null" | "timeout" | "error",
  durationMs: number
): void {
  const stats = PROVIDER_STATS[provider];
  stats.calls += 1;
  stats.lastDurationMs = durationMs;

  if (outcome === "success") {
    stats.successes += 1;
    stats.lastSuccessAt = Date.now();
    return;
  }

  if (outcome === "null") {
    stats.nulls += 1;
    return;
  }

  if (outcome === "timeout") {
    stats.timeouts += 1;
    stats.lastErrorAt = Date.now();
    return;
  }

  stats.errors += 1;
  stats.lastErrorAt = Date.now();
}

async function withTimeout<T>(
  provider: TicketProviderId,
  fn: () => Promise<T>,
  timeoutMs = PROVIDER_TIMEOUT_MS
): Promise<TimedResult<T>> {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;

      const durationMs = Date.now() - startedAt;
      console.log(`[tickets] ${provider} timeout`, { durationMs, timeoutMs });
      recordProviderCall(provider, "timeout", durationMs);

      resolve({ value: null, timedOut: true });
    }, timeoutMs);

    fn()
      .then((result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ value: result, timedOut: false });
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        const durationMs = Date.now() - startedAt;
        console.log(`[tickets] ${provider} error`, {
          durationMs,
          timeoutMs,
          message: error instanceof Error ? error.message : String(error),
        });
        recordProviderCall(provider, "error", durationMs);

        resolve({ value: null, timedOut: false });
      });
  });
}

async function runProvider(
  provider: TicketProviderId,
  fn: () => Promise<TicketCandidate | null>
): Promise<TicketCandidate | null> {
  const startedAt = Date.now();
  const { value, timedOut } = await withTimeout(provider, fn);

  if (timedOut) return null;

  const durationMs = Date.now() - startedAt;
  const sanitized = sanitizeCandidate(value);

  if (!value) {
    recordProviderCall(provider, "null", durationMs);
    return null;
  }

  if (!sanitized) {
    console.log(`[tickets] ${provider} rejected candidate`, {
      candidate: summarizeCandidate(value),
    });
    recordProviderCall(provider, "null", durationMs);
    return null;
  }

  recordProviderCall(provider, "success", durationMs);
  return sanitized;
}

function reasonRank(reason: TicketCandidate["reason"]): number {
  if (reason === "exact_event") return 1;
  if (reason === "partial_match") return 2;
  if (reason === "search_fallback") return 5;
  return 10;
}

function providerRank(provider: TicketProviderId): number {
  return PROVIDER_PRIORITY[provider] ?? 99;
}

function dedupeCandidates(candidates: TicketCandidate[]): TicketCandidate[] {
  const map = new Map<string, TicketCandidate>();

  for (const candidate of candidates) {
    const key = [
      normalize(candidate.provider),
      normalize(candidate.url),
      normalize(candidate.title),
      normalize(candidate.reason),
    ].join("|");

    const existing = map.get(key);
    if (!existing) {
      map.set(key, candidate);
      continue;
    }

    const currentAssessment = assessCandidate(candidate);
    const existingAssessment = assessCandidate(existing);

    if (currentAssessment.adjustedScore > existingAssessment.adjustedScore) {
      map.set(key, candidate);
      continue;
    }

    if (currentAssessment.adjustedScore === existingAssessment.adjustedScore) {
      const currentRank = PROVIDER_PRIORITY[candidate.provider] ?? 99;
      const existingRank = PROVIDER_PRIORITY[existing.provider] ?? 99;

      if (currentRank < existingRank) {
        map.set(key, candidate);
      }
    }
  }

  return Array.from(map.values());
}

function passesReasonFloor(candidate: TicketCandidate): boolean {
  const adjusted = assessCandidate(candidate).adjustedScore;

  if (candidate.reason === "exact_event") {
    return adjusted >= MIN_EXACT_EVENT_SCORE;
  }

  if (candidate.reason === "partial_match") {
    return adjusted >= MIN_PARTIAL_MATCH_SCORE;
  }

  return adjusted >= MIN_SEARCH_FALLBACK_SCORE;
}

function filterWeakCandidates(candidates: TicketCandidate[]): TicketCandidate[] {
  return candidates.filter(passesReasonFloor);
}

function sortCandidates(candidates: TicketCandidate[]): TicketCandidate[] {
  return [...candidates].sort((a, b) => {
    const aReasonRank = reasonRank(a.reason);
    const bReasonRank = reasonRank(b.reason);
    if (aReasonRank !== bReasonRank) return aReasonRank - bReasonRank;

    const aAssessment = assessCandidate(a);
    const bAssessment = assessCandidate(b);
    if (aAssessment.adjustedScore !== bAssessment.adjustedScore) {
      return bAssessment.adjustedScore - aAssessment.adjustedScore;
    }

    const aPrice = parsePriceAmount(a.priceText);
    const bPrice = parsePriceAmount(b.priceText);

    if (aPrice != null && bPrice != null && aPrice !== bPrice) {
      return aPrice - bPrice;
    }

    const aHasPrice = Boolean(clean(a.priceText));
    const bHasPrice = Boolean(clean(b.priceText));
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    return providerRank(a.provider) - providerRank(b.provider);
  });
}

function buildResolution(
  candidates: TicketCandidate[],
  checkedProviders: TicketResolution["checkedProviders"]
): TicketResolution {
  const filtered = filterWeakCandidates(dedupeCandidates(candidates));
  const sorted = sortCandidates(filtered);
  const top = sorted.slice(0, MAX_RETURNED_OPTIONS);

  if (top.length === 0) {
    return buildNotFound(checkedProviders);
  }

  const best = top[0];
  const bestAdjustedScore = assessCandidate(best).adjustedScore;

  if (bestAdjustedScore < MIN_SELECTED_SCORE) {
    return buildNotFound(checkedProviders);
  }

  return {
    ok: true,
    provider: best.provider,
    exact: best.exact,
    score: bestAdjustedScore,
    url: best.url,
    title: best.title,
    priceText: best.priceText ?? null,
    reason: best.reason,
    checkedProviders,
    options: top.map((candidate) => ({
      provider: candidate.provider,
      exact: candidate.exact,
      score: assessCandidate(candidate).adjustedScore,
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
  const debugNoCache = Boolean((input as { debugNoCache?: unknown }).debugNoCache);

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

  const checkedProviders: TicketResolution["checkedProviders"] = [
    "footballticketsnet",
    "sportsevents365",
    "gigsberg",
  ];

  const providerPromises: Array<Promise<TicketCandidate | null>> = [
    runProvider("footballticketsnet", () => resolveFtnCandidate(input)),
    runProvider("sportsevents365", () => resolveSe365Candidate(input)),
    runProvider("gigsberg", () => resolveGigsbergCandidate(input)),
  ];

  const settled = await Promise.allSettled(providerPromises);

  const candidates: TicketCandidate[] = [];
  const providerOrder: TicketProviderId[] = [
    "footballticketsnet",
    "sportsevents365",
    "gigsberg",
  ];

  for (let i = 0; i < settled.length; i += 1) {
    const provider = providerOrder[i];
    const result = settled[i];

    if (result.status === "fulfilled") {
      console.log("[tickets] provider result", {
        provider,
        candidate: summarizeCandidate(result.value),
      });

      if (result.value) {
        candidates.push(result.value);
      }
    } else {
      console.log("[tickets] provider promise rejected", {
        provider,
        message:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
    }
  }

  const result = buildResolution(candidates, checkedProviders);

  if (result.ok) {
    console.log("[tickets] resolved", {
      selectedProvider: result.provider,
      selectedReason: result.reason,
      selectedScore: result.score,
      selectedExact: result.exact,
      checkedProviders,
      options: (result.options ?? []).map((option) => ({
        provider: option.provider,
        reason: option.reason,
        score: option.score,
        exact: option.exact,
        priceText: option.priceText ?? null,
        url: option.url,
        urlQuality: detectUrlQuality(option),
      })),
      debugNoCache,
    });
  } else {
    console.log("[tickets] no result", {
      checkedProviders,
      input: summarizeInput(input),
      debugNoCache,
      providerStats: PROVIDER_STATS,
    });
  }

  if (!debugNoCache) {
    setCache(cacheKey, result);
  }

  return result;
    }
