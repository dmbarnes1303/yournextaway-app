import { resolveFtnCandidate } from "./ftn.js";
import { resolveSe365Candidate } from "./se365.js";
import type {
  CandidateUrlQuality,
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

type CandidateAssessment = {
  urlQuality: CandidateUrlQuality;
  adjustedScore: number;
  providerBias: number;
  urlBias: number;
  reasonBias: number;
  priceBonus: number;
};

const CACHE = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 1000 * 60 * 10;
const PROVIDER_TIMEOUT_MS = 4500;
const MAX_RETURNED_OPTIONS = 4;
const RESOLVER_VERSION = "v9-launch-fallback-friendly";

const MIN_EXACT_EVENT_SCORE = 60;
const MIN_PARTIAL_MATCH_SCORE = 48;
const MIN_SEARCH_FALLBACK_SCORE = 40;
const MIN_SELECTED_SCORE = 40;

const PROVIDER_PRIORITY: Record<TicketProviderId, number> = {
  sportsevents365: 1,
  footballticketnet: 2,
};

const PROVIDER_HOST_ALLOWLIST: Record<TicketProviderId, string[]> = {
  footballticketnet: [
    "footballticketnet.com",
    "www.footballticketnet.com",
    "footballticketsnet.com",
    "www.footballticketsnet.com",
  ],
  sportsevents365: ["sportsevents365.com", "www.sportsevents365.com"],
};

const PROVIDER_STATS: Record<TicketProviderId, ProviderStats> = {
  footballticketnet: {
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
};

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function normalize(v: unknown): string {
  return clean(v).toLowerCase();
}

function buildCacheKey(input: TicketResolveInput): string {
  return [
    RESOLVER_VERSION,
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
    rawScore: null,
    url: null,
    title: null,
    priceText: null,
    reason: "not_found",
    checkedProviders,
    options: [],
    urlQuality: undefined,
  };
}

function summarizeInput(input: TicketResolveInput) {
  return {
    resolverVersion: RESOLVER_VERSION,
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

function hasPriceText(candidate: TicketCandidate): boolean {
  return Boolean(clean(candidate.priceText));
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

function detectUrlQuality(candidate: Pick<TicketCandidate, "url">): CandidateUrlQuality {
  const raw = clean(candidate.url);
  if (!raw) return "unknown";

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    const query = parsed.search.toLowerCase();

    if (host.includes("sjv.io")) return "search";

    const looksSearch =
      path === "/search" ||
      path.startsWith("/search/") ||
      path.includes("/events/search") ||
      path.includes("/event/search") ||
      path.includes("/search-results") ||
      query.includes("q=") ||
      query.includes("query=") ||
      query.includes("text=") ||
      query.includes("search");

    if (looksSearch) return "search";
    if (path.includes("/listing") || path.includes("/listings")) return "listing";
    if (path.includes("/event") || path.includes("/events")) return "event";
    if (path.includes("/ticket") || path.includes("/tickets")) return "event";

    return "unknown";
  } catch {
    return "unknown";
  }
}

function getProviderBias(
  provider: TicketProviderId,
  reason: TicketCandidate["reason"],
  urlQuality: CandidateUrlQuality
): number {
  if (provider === "sportsevents365") {
    if (reason === "exact_event" && urlQuality === "event") return 14;
    if (reason === "exact_event" && urlQuality === "listing") return 9;
    if (reason === "partial_match" && urlQuality === "event") return 8;
    if (reason === "partial_match" && urlQuality === "listing") return 5;
    if (reason === "search_fallback") return -2;
    if (urlQuality === "search") return -4;
    if (urlQuality === "unknown") return -4;
    return 2;
  }

  if (provider === "footballticketnet") {
    if (reason === "exact_event" && urlQuality === "event") return 11;
    if (reason === "exact_event" && urlQuality === "listing") return 6;
    if (reason === "partial_match" && urlQuality === "event") return 7;
    if (reason === "partial_match" && urlQuality === "listing") return 4;
    if (reason === "search_fallback") return -4;
    if (urlQuality === "search") return -6;
    if (urlQuality === "unknown") return -6;
    return 1;
  }

  return 0;
}

function getUrlBias(urlQuality: CandidateUrlQuality): number {
  if (urlQuality === "event") return 12;
  if (urlQuality === "listing") return 8;
  if (urlQuality === "search") return -10;
  if (urlQuality === "unknown") return -6;
  return -10;
}

function getReasonBias(reason: TicketCandidate["reason"]): number {
  if (reason === "exact_event") return 8;
  if (reason === "partial_match") return 0;
  return -2;
}

function getPriceBonus(candidate: TicketCandidate): number {
  const amount = parsePriceAmount(candidate.priceText);
  if (amount == null) return 0;

  if (amount > 0 && amount <= 60) return 5;
  if (amount <= 120) return 4;
  if (amount <= 250) return 3;
  return 2;
}

function assessCandidate(candidate: TicketCandidate): CandidateAssessment {
  const urlQuality = detectUrlQuality(candidate);
  const urlBias = getUrlBias(urlQuality);
  const reasonBias = getReasonBias(candidate.reason);
  const providerBias = getProviderBias(candidate.provider, candidate.reason, urlQuality);
  const priceBonus = getPriceBonus(candidate);

  let adjustedScore =
    candidate.score +
    urlBias +
    reasonBias +
    providerBias +
    priceBonus;

  if (candidate.reason === "exact_event" && urlQuality === "search") {
    adjustedScore -= 15;
  }

  if (candidate.reason === "exact_event" && urlQuality === "unknown") {
    adjustedScore -= 8;
  }

  if (candidate.reason === "partial_match" && urlQuality === "search") {
    adjustedScore -= 6;
  }

  if (candidate.reason === "partial_match" && urlQuality === "unknown") {
    adjustedScore -= 4;
  }

  return {
    urlQuality,
    adjustedScore: Math.max(0, adjustedScore),
    providerBias,
    urlBias,
    reasonBias,
    priceBonus,
  };
}

function summarizeCandidate(candidate: TicketCandidate | null) {
  if (!candidate) return null;

  const assessment = assessCandidate(candidate);

  return {
    provider: candidate.provider,
    exact: candidate.exact,
    rawScore: candidate.score,
    adjustedScore: assessment.adjustedScore,
    reason: candidate.reason,
    title: candidate.title,
    priceText: candidate.priceText ?? null,
    hasUrl: Boolean(clean(candidate.url)),
    url: clean(candidate.url) || null,
    urlQuality: assessment.urlQuality,
    providerBias: assessment.providerBias,
    urlBias: assessment.urlBias,
    reasonBias: assessment.reasonBias,
    priceBonus: assessment.priceBonus,
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
  if (reason === "search_fallback") return 3;
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
  const assessment = assessCandidate(candidate);
  const adjusted = assessment.adjustedScore;

  if (candidate.reason === "exact_event") {
    return adjusted >= MIN_EXACT_EVENT_SCORE;
  }

  if (candidate.reason === "partial_match") {
    return adjusted >= MIN_PARTIAL_MATCH_SCORE;
  }

  if (candidate.reason === "search_fallback") {
    return adjusted >= MIN_SEARCH_FALLBACK_SCORE;
  }

  return false;
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

    const aQualityRank =
      aAssessment.urlQuality === "event"
        ? 1
        : aAssessment.urlQuality === "listing"
          ? 2
          : aAssessment.urlQuality === "search"
            ? 3
            : 4;

    const bQualityRank =
      bAssessment.urlQuality === "event"
        ? 1
        : bAssessment.urlQuality === "listing"
          ? 2
          : bAssessment.urlQuality === "search"
            ? 3
            : 4;

    if (aQualityRank !== bQualityRank) return aQualityRank - bQualityRank;

    if (aAssessment.adjustedScore !== bAssessment.adjustedScore) {
      return bAssessment.adjustedScore - aAssessment.adjustedScore;
    }

    const aPrice = parsePriceAmount(a.priceText);
    const bPrice = parsePriceAmount(b.priceText);

    if (aPrice != null && bPrice != null && aPrice !== bPrice) {
      return aPrice - bPrice;
    }

    const aHasPrice = hasPriceText(a);
    const bHasPrice = hasPriceText(b);
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    return providerRank(a.provider) - providerRank(b.provider);
  });
}

function toOption(candidate: TicketCandidate) {
  const assessment = assessCandidate(candidate);

  return {
    provider: candidate.provider,
    exact: candidate.exact,
    score: assessment.adjustedScore,
    rawScore: candidate.score,
    url: candidate.url,
    title: candidate.title,
    priceText: candidate.priceText ?? null,
    reason: candidate.reason,
    urlQuality: assessment.urlQuality,
  };
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
  const bestAssessment = assessCandidate(best);

  if (bestAssessment.adjustedScore < MIN_SELECTED_SCORE) {
    return buildNotFound(checkedProviders);
  }

  return {
    ok: true,
    provider: best.provider,
    exact: best.exact,
    score: bestAssessment.adjustedScore,
    rawScore: best.score,
    url: best.url,
    title: best.title,
    priceText: best.priceText ?? null,
    reason: best.reason,
    checkedProviders,
    options: top.map(toOption),
    urlQuality: bestAssessment.urlQuality,
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
        cachedRawScore: cached.rawScore ?? null,
        cachedUrlQuality: cached.urlQuality ?? null,
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
    "footballticketnet",
    "sportsevents365",
  ];

  const providerPromises: Array<Promise<TicketCandidate | null>> = [
    runProvider("footballticketnet", () => resolveFtnCandidate(input)),
    runProvider("sportsevents365", () => resolveSe365Candidate(input)),
  ];

  const settled = await Promise.allSettled(providerPromises);

  const candidates: TicketCandidate[] = [];

  const providerOrder: TicketProviderId[] = [
    "footballticketnet",
    "sportsevents365",
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

  console.log(
    "FINAL CANDIDATES",
    candidates.map((c) => ({
      provider: c.provider,
      reason: c.reason,
      raw: c.score,
      adjusted: assessCandidate(c).adjustedScore,
      urlQuality: detectUrlQuality(c),
    }))
  );

  const result = buildResolution(candidates, checkedProviders);

  if (result.ok) {
    console.log("[tickets] resolved", {
      selectedProvider: result.provider,
      selectedReason: result.reason,
      selectedScore: result.score,
      selectedRawScore: result.rawScore ?? null,
      selectedExact: result.exact,
      selectedUrlQuality: result.urlQuality ?? null,
      checkedProviders,
      options: (result.options ?? []).map((option) => ({
        provider: option.provider,
        reason: option.reason,
        score: option.score,
        rawScore: option.rawScore ?? null,
        exact: option.exact,
        priceText: option.priceText ?? null,
        url: option.url,
        urlQuality: option.urlQuality ?? null,
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
