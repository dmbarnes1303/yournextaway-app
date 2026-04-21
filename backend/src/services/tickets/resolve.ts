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
  baseAdjustedScore: number;
  finalAdjustedScore: number;
  providerBias: number;
  urlBias: number;
  reasonBias: number;
  priceBonus: number;
  valueAdjustment: number;
};

const CACHE = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 1000 * 60 * 10;
const MAX_RETURNED_OPTIONS = 4;
const RESOLVER_VERSION = "v12-trust-first-routing";

const MIN_EXACT_EVENT_SCORE = 62;
const MIN_PARTIAL_MATCH_SCORE = 50;
const MIN_SEARCH_FALLBACK_SCORE = 40;
const MIN_SELECTED_SCORE = 42;

const PROVIDER_PRIORITY: Record<TicketProviderId, number> = {
  sportsevents365: 1,
  footballticketnet: 2,
};

const PROVIDER_TIMEOUTS_MS: Record<TicketProviderId, number> = {
  footballticketnet: 9000,
  sportsevents365: 14000,
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

function inferUrlQualityFromUrl(candidate: Pick<TicketCandidate, "url">): CandidateUrlQuality {
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
      query.includes("event_id=") ||
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

function getCandidateUrlQuality(candidate: TicketCandidate): CandidateUrlQuality {
  if (candidate.urlQuality) return candidate.urlQuality;
  return inferUrlQualityFromUrl(candidate);
}

function getProviderBias(
  provider: TicketProviderId,
  reason: TicketCandidate["reason"],
  urlQuality: CandidateUrlQuality
): number {
  if (provider === "sportsevents365") {
    if (reason === "exact_event" && urlQuality === "event") return 12;
    if (reason === "exact_event" && urlQuality === "listing") return 7;
    if (reason === "partial_match" && urlQuality === "event") return 7;
    if (reason === "partial_match" && urlQuality === "listing") return 4;
    if (reason === "search_fallback") return -2;
    if (urlQuality === "search") return -4;
    if (urlQuality === "unknown") return -5;
    return 1;
  }

  if (provider === "footballticketnet") {
    if (reason === "exact_event" && urlQuality === "event") return 8;
    if (reason === "exact_event" && urlQuality === "listing") return 4;
    if (reason === "partial_match" && urlQuality === "event") return 5;
    if (reason === "partial_match" && urlQuality === "listing") return 3;
    if (reason === "search_fallback") return -4;
    if (urlQuality === "search") return -6;
    if (urlQuality === "unknown") return -7;
    return 0;
  }

  return 0;
}

function getUrlBias(urlQuality: CandidateUrlQuality): number {
  if (urlQuality === "event") return 12;
  if (urlQuality === "listing") return 7;
  if (urlQuality === "search") return -12;
  if (urlQuality === "unknown") return -8;
  return -12;
}

function getReasonBias(reason: TicketCandidate["reason"]): number {
  if (reason === "exact_event") return 8;
  if (reason === "partial_match") return 0;
  return -3;
}

function getPriceBonus(candidate: TicketCandidate): number {
  const amount = parsePriceAmount(candidate.priceText);
  if (amount == null) return 0;

  if (amount > 0 && amount <= 60) return 2;
  if (amount <= 120) return 1;
  return 0;
}

function getBaseAssessment(
  candidate: TicketCandidate
): Omit<CandidateAssessment, "finalAdjustedScore" | "valueAdjustment"> {
  const urlQuality = getCandidateUrlQuality(candidate);
  const urlBias = getUrlBias(urlQuality);
  const reasonBias = getReasonBias(candidate.reason);
  const providerBias = getProviderBias(candidate.provider, candidate.reason, urlQuality);
  const priceBonus = getPriceBonus(candidate);

  let baseAdjustedScore =
    candidate.score +
    urlBias +
    reasonBias +
    providerBias +
    priceBonus;

  if (candidate.reason === "exact_event" && urlQuality !== "event") {
    baseAdjustedScore -= 18;
  }

  if (candidate.reason === "partial_match" && urlQuality === "search") {
    baseAdjustedScore -= 8;
  }

  if (candidate.reason === "partial_match" && urlQuality === "unknown") {
    baseAdjustedScore -= 6;
  }

  return {
    urlQuality,
    baseAdjustedScore: Math.max(0, baseAdjustedScore),
    providerBias,
    urlBias,
    reasonBias,
    priceBonus,
  };
}

function getValueAdjustment(
  candidate: TicketCandidate,
  peers: TicketCandidate[]
): number {
  const candidatePrice = parsePriceAmount(candidate.priceText);
  if (candidatePrice == null) return 0;

  const pricedPeers = peers
    .map((peer) => parsePriceAmount(peer.priceText))
    .filter((price): price is number => price != null && price > 0);

  if (pricedPeers.length < 2) return 0;

  const minPrice = Math.min(...pricedPeers);
  const maxPrice = Math.max(...pricedPeers);

  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || maxPrice <= minPrice) {
    return 0;
  }

  const spreadRatio = (maxPrice - minPrice) / Math.max(minPrice, 1);
  const maxSwing = Math.min(10, Math.max(1, Math.round(spreadRatio * 4)));

  const position = (candidatePrice - minPrice) / (maxPrice - minPrice);
  const centered = 1 - position * 2;

  return Math.round(centered * maxSwing);
}

function candidateIsTrustedEnoughForValue(candidate: TicketCandidate): boolean {
  const base = getBaseAssessment(candidate);

  if (candidate.reason === "search_fallback") return false;
  if (base.urlQuality === "search" || base.urlQuality === "unknown") return false;
  if (base.baseAdjustedScore < MIN_PARTIAL_MATCH_SCORE) return false;

  return true;
}

function assessCandidate(
  candidate: TicketCandidate,
  peers: TicketCandidate[] = [candidate]
): CandidateAssessment {
  const base = getBaseAssessment(candidate);

  const trustedPeers = peers.filter(candidateIsTrustedEnoughForValue);
  const allowValueLayer =
    candidateIsTrustedEnoughForValue(candidate) && trustedPeers.length >= 2;

  const valueAdjustment = allowValueLayer
    ? getValueAdjustment(candidate, trustedPeers)
    : 0;

  const finalAdjustedScore = Math.max(0, base.baseAdjustedScore + valueAdjustment);

  return {
    ...base,
    valueAdjustment,
    finalAdjustedScore,
  };
}

function summarizeCandidate(
  candidate: TicketCandidate | null,
  peers: TicketCandidate[] = candidate ? [candidate] : []
) {
  if (!candidate) return null;

  const assessment = assessCandidate(candidate, peers);

  return {
    provider: candidate.provider,
    exact: candidate.exact,
    rawScore: candidate.rawScore ?? candidate.score,
    providerScore: candidate.score,
    baseAdjustedScore: assessment.baseAdjustedScore,
    finalAdjustedScore: assessment.finalAdjustedScore,
    valueAdjustment: assessment.valueAdjustment,
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
  fn: () => Promise<T>
): Promise<TimedResult<T>> {
  const startedAt = Date.now();
  const timeoutMs = PROVIDER_TIMEOUTS_MS[provider];

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

    const currentAssessment = assessCandidate(candidate, candidates);
    const existingAssessment = assessCandidate(existing, candidates);

    if (currentAssessment.finalAdjustedScore > existingAssessment.finalAdjustedScore) {
      map.set(key, candidate);
      continue;
    }

    if (currentAssessment.finalAdjustedScore === existingAssessment.finalAdjustedScore) {
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
  const assessment = assessCandidate(candidate, [candidate]);
  const adjusted = assessment.baseAdjustedScore;
  const urlQuality = assessment.urlQuality;

  if (candidate.reason === "exact_event") {
    return urlQuality === "event" && adjusted >= MIN_EXACT_EVENT_SCORE;
  }

  if (candidate.reason === "partial_match") {
    return (urlQuality === "event" || urlQuality === "listing") &&
      adjusted >= MIN_PARTIAL_MATCH_SCORE;
  }

  if (candidate.reason === "search_fallback") {
    return urlQuality === "search" && adjusted >= MIN_SEARCH_FALLBACK_SCORE;
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

    const aAssessment = assessCandidate(a, candidates);
    const bAssessment = assessCandidate(b, candidates);

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

    if (aAssessment.finalAdjustedScore !== bAssessment.finalAdjustedScore) {
      return bAssessment.finalAdjustedScore - aAssessment.finalAdjustedScore;
    }

    const aPrice = parsePriceAmount(a.priceText);
    const bPrice = parsePriceAmount(b.priceText);

    if (
      aAssessment.urlQuality !== "search" &&
      bAssessment.urlQuality !== "search" &&
      aPrice != null &&
      bPrice != null &&
      aPrice !== bPrice
    ) {
      return aPrice - bPrice;
    }

    const aHasPrice = hasPriceText(a);
    const bHasPrice = hasPriceText(b);
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    return providerRank(a.provider) - providerRank(b.provider);
  });
}

function toOption(candidate: TicketCandidate, peers: TicketCandidate[]) {
  const assessment = assessCandidate(candidate, peers);

  return {
    provider: candidate.provider,
    exact: candidate.exact,
    score: assessment.finalAdjustedScore,
    rawScore: candidate.rawScore ?? candidate.score,
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
  const deduped = dedupeCandidates(candidates);
  const filtered = filterWeakCandidates(deduped);
  const sorted = sortCandidates(filtered);
  const top = sorted.slice(0, MAX_RETURNED_OPTIONS);

  if (top.length === 0) {
    return buildNotFound(checkedProviders);
  }

  const best = top[0];
  const bestAssessment = assessCandidate(best, top);

  if (bestAssessment.finalAdjustedScore < MIN_SELECTED_SCORE) {
    return buildNotFound(checkedProviders);
  }

  return {
    ok: true,
    provider: best.provider,
    exact: best.exact,
    score: bestAssessment.finalAdjustedScore,
    rawScore: best.rawScore ?? best.score,
    url: best.url,
    title: best.title,
    priceText: best.priceText ?? null,
    reason: best.reason,
    checkedProviders,
    options: top.map((candidate) => toOption(candidate, top)),
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
    providerTimeoutsMs: PROVIDER_TIMEOUTS_MS,
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
        candidate: summarizeCandidate(result.value, candidates),
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
    "[tickets] final candidates",
    candidates.map((c) => {
      const assessment = assessCandidate(c, candidates);
      return {
        provider: c.provider,
        reason: c.reason,
        providerScore: c.score,
        rawScore: c.rawScore ?? c.score,
        baseAdjusted: assessment.baseAdjustedScore,
        valueAdjustment: assessment.valueAdjustment,
        finalAdjusted: assessment.finalAdjustedScore,
        urlQuality: assessment.urlQuality,
        priceText: c.priceText ?? null,
        parsedPrice: parsePriceAmount(c.priceText),
      };
    })
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
        parsedPrice: parsePriceAmount(option.priceText),
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
