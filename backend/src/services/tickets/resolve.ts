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
const RESOLVER_VERSION = "v8-launch-fallback-friendly";

const MIN_EXACT_EVENT_SCORE = 72;
const MIN_PARTIAL_MATCH_SCORE = 50;
const MIN_SEARCH_FALLBACK_SCORE = 18;
const MIN_SELECTED_SCORE = 18;

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
    if (reason === "exact_event" && urlQuality === "event") return 12;
    if (reason === "exact_event" && urlQuality === "listing") return 8;
    if (reason === "partial_match" && urlQuality === "event") return 8;
    if (reason === "partial_match" && urlQuality === "listing") return 6;
    if (reason === "search_fallback") return 0;
    if (urlQuality === "search") return -2;
    if (urlQuality === "unknown") return -2;
    return 2;
  }

  if (provider === "footballticketnet") {
    if (reason === "exact_event" && urlQuality === "event") return 10;
    if (reason === "exact_event" && urlQuality === "listing") return 7;
    if (reason === "partial_match" && urlQuality === "event") return 7;
    if (reason === "partial_match" && urlQuality === "listing") return 5;
    if (reason === "search_fallback") return 0;
    if (urlQuality === "search") return -2;
    if (urlQuality === "unknown") return -2;
    return 1;
  }

  return 0;
}

function getUrlBias(urlQuality: CandidateUrlQuality): number {
  if (urlQuality === "event") return 12;
  if (urlQuality === "listing") return 8;
  if (urlQuality === "unknown") return -2;
  return -4;
}

function getReasonBias(reason: TicketCandidate["reason"]): number {
  if (reason === "exact_event") return 8;
  if (reason === "partial_match") return 2;
  return 0;
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
    adjustedScore -= 10;
  }

  if (candidate.reason === "exact_event" && urlQuality === "unknown") {
    adjustedScore -= 6;
  }

  if (candidate.reason === "partial_match" && urlQuality === "search") {
    adjustedScore -= 4;
  }

  if (candidate.reason === "partial_match" && urlQuality === "unknown") {
    adjustedScore -= 2;
  }

  if (candidate.reason === "search_fallback" && urlQuality !== "search" && urlQuality !== "unknown") {
    adjustedScore += 2;
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
  const urlQuality = assessment.urlQuality;

  if (candidate.reason === "exact_event") {
    return adjusted >= MIN_EXACT_EVENT_SCORE;
  }

  if (candidate.reason === "partial_match") {
    if (urlQuality === "search") return adjusted >= MIN_SEARCH_FALLBACK_SCORE;
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




import { getBackendBaseUrl } from "../config/env";

export type TicketUrlQuality = "event" | "listing" | "search" | "unknown";

export type TicketResolutionOption = {
  provider: string;
  exact: boolean;
  score: number;
  rawScore?: number | null;
  url: string;
  title: string;
  priceText?: string | null;
  reason: "exact_event" | "search_fallback" | "partial_match";
  urlQuality?: TicketUrlQuality;
};

export type TicketResolutionResult = {
  ok: boolean;
  provider: string | null;
  exact: boolean;
  score: number | null;
  rawScore?: number | null;
  url: string | null;
  title: string | null;
  priceText?: string | null;
  reason: "exact_event" | "search_fallback" | "partial_match" | "not_found";
  urlQuality?: TicketUrlQuality;
  checkedProviders?: string[];
  options?: TicketResolutionOption[];
  error?: string;
};

export type ResolveTicketArgs = {
  fixtureId?: string | number;
  homeName: string;
  awayName: string;
  kickoffIso: string;
  leagueName?: string;
  leagueId?: string | number;
  debugNoCache?: boolean;
};

const REQUEST_TIMEOUT_MS = 20000;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function normalizeProvider(provider: unknown): string {
  return clean(provider).toLowerCase();
}

function isSe365(provider: unknown): boolean {
  const p = normalizeProvider(provider);
  return p === "sportsevents365" || p === "se365";
}

function isFtn(provider: unknown): boolean {
  const p = normalizeProvider(provider);
  return (
    p === "footballticketnet" ||
    p === "footballticketsnet" ||
    p === "footballticketnet.com" ||
    p === "footballticketsnet.com" ||
    p === "ftn"
  );
}

function providerPriority(provider: unknown): number {
  if (isSe365(provider)) return 300;
  if (isFtn(provider)) return 200;
  return 100;
}

function canonicalizeProvider(provider: unknown): string {
  if (isSe365(provider)) return "sportsevents365";
  if (isFtn(provider)) return "footballticketnet";
  return clean(provider);
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function safeUrl(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function buildResolveUrl(base: string, args: ResolveTicketArgs): string | null {
  const normalizedBase = clean(base);
  const homeName = clean(args.homeName);
  const awayName = clean(args.awayName);
  const kickoffIso = clean(args.kickoffIso);

  if (!normalizedBase || !homeName || !awayName || !kickoffIso) return null;

  const qs = new URLSearchParams({
    homeName,
    awayName,
    kickoffIso,
    _ts: String(Date.now()),
  });

  const fixtureId = clean(args.fixtureId);
  const leagueName = clean(args.leagueName);
  const leagueId = clean(args.leagueId);

  if (fixtureId) qs.set("fixtureId", fixtureId);
  if (leagueName) qs.set("leagueName", leagueName);
  if (leagueId) qs.set("leagueId", leagueId);
  if (args.debugNoCache) qs.set("debugNoCache", "1");

  return `${normalizedBase}/tickets/resolve?${qs.toString()}`;
}

function normalizeUrlQuality(value: unknown): TicketUrlQuality {
  const raw = clean(value).toLowerCase();

  if (raw === "event") return "event";
  if (raw === "listing") return "listing";
  if (raw === "search") return "search";
  return "unknown";
}

function normalizeReason(value: unknown): TicketResolutionOption["reason"] {
  const raw = clean(value);

  if (raw === "exact_event") return "exact_event";
  if (raw === "partial_match") return "partial_match";
  return "search_fallback";
}

function normalizeTopLevelReason(
  value: unknown,
  hasProvider: boolean,
  hasOptions: boolean
): TicketResolutionResult["reason"] {
  const raw = clean(value);

  if (raw === "exact_event") return "exact_event";
  if (raw === "partial_match") return "partial_match";
  if (raw === "search_fallback") return "search_fallback";
  if (raw === "not_found") return "not_found";

  return hasProvider || hasOptions ? "search_fallback" : "not_found";
}

function normalizeScore(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeOption(input: unknown): TicketResolutionOption | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const obj = input as Record<string, unknown>;

  const provider = canonicalizeProvider(obj.provider);
  const url = safeUrl(obj.url);
  const title = clean(obj.title);
  const score = normalizeScore(obj.score);

  if (!provider || !url || !title || score == null) return null;

  return {
    provider,
    exact: Boolean(obj.exact),
    score,
    rawScore: normalizeScore(obj.rawScore),
    url,
    title,
    priceText: clean(obj.priceText) || null,
    reason: normalizeReason(obj.reason),
    urlQuality: normalizeUrlQuality(obj.urlQuality),
  };
}

function dedupeAndSortOptions(options: TicketResolutionOption[]): TicketResolutionOption[] {
  const byKey = new Map<string, TicketResolutionOption>();

  for (const option of options) {
    const key = `${normalizeProvider(option.provider)}|${option.url}`;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, option);
      continue;
    }

    const shouldReplace =
      (option.exact && !existing.exact) ||
      option.score > existing.score ||
      (option.score === existing.score &&
        Boolean(clean(option.priceText)) &&
        !Boolean(clean(existing.priceText)));

    if (shouldReplace) {
      byKey.set(key, option);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const aPriority = providerPriority(a.provider);
    const bPriority = providerPriority(b.provider);

    if (a.exact && !b.exact) return -1;
    if (!a.exact && b.exact) return 1;

    if (aPriority !== bPriority) return bPriority - aPriority;
    if (b.score !== a.score) return b.score - a.score;

    const aHasPrice = Boolean(clean(a.priceText));
    const bHasPrice = Boolean(clean(b.priceText));
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    return a.provider.localeCompare(b.provider);
  });
}

function normalizeCheckedProviders(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const entry of value) {
    const next = canonicalizeProvider(entry);
    if (!next) continue;
    const key = next.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
  }

  return out;
}

function hasUsablePrimaryFields(args: {
  provider: string | null;
  url: string | null;
  title: string | null;
}): boolean {
  return Boolean(args.provider && args.url && args.title);
}

function isUsableOption(option: TicketResolutionOption | null | undefined): boolean {
  if (!option) return false;
  if (!option.provider || !option.url || !option.title) return false;

  const urlQuality = normalizeUrlQuality(option.urlQuality);

  if (isSe365(option.provider) || isFtn(option.provider)) {
    return (
      urlQuality === "event" ||
      urlQuality === "listing" ||
      urlQuality === "search" ||
      urlQuality === "unknown"
    );
  }

  return false;
}

function isUsablePrimary(args: {
  provider: string | null;
  url: string | null;
  title: string | null;
  urlQuality: TicketUrlQuality;
}): boolean {
  if (!hasUsablePrimaryFields(args)) return false;

  if (isSe365(args.provider) || isFtn(args.provider)) {
    return (
      args.urlQuality === "event" ||
      args.urlQuality === "listing" ||
      args.urlQuality === "search" ||
      args.urlQuality === "unknown"
    );
  }

  return false;
}

function normalizeResolutionResult(
  input: TicketResolutionResult | null
): TicketResolutionResult | null {
  if (!input) return null;

  const normalizedOptions = dedupeAndSortOptions(
    Array.isArray(input.options)
      ? input.options
          .map((x) => normalizeOption(x))
          .filter((x): x is TicketResolutionOption => x !== null)
      : []
  );

  const fallbackTop = normalizedOptions[0] ?? null;

  const provider = canonicalizeProvider(clean(input.provider) || fallbackTop?.provider || null);
  const url = safeUrl(input.url) || fallbackTop?.url || null;
  const title = clean(input.title) || fallbackTop?.title || null;
  const priceText = clean(input.priceText) || fallbackTop?.priceText || null;

  const score = normalizeScore(input.score) ?? fallbackTop?.score ?? null;
  const rawScore = normalizeScore(input.rawScore) ?? fallbackTop?.rawScore ?? null;

  const exact =
    typeof input.exact === "boolean"
      ? input.exact
      : Boolean(fallbackTop?.exact);

  const topLevelReason = normalizeTopLevelReason(
    input.reason,
    Boolean(provider),
    normalizedOptions.length > 0
  );

  const topLevelUrlQuality = normalizeUrlQuality(input.urlQuality ?? fallbackTop?.urlQuality);

  const hasUsablePrimary = isUsablePrimary({
    provider,
    url,
    title,
    urlQuality: topLevelUrlQuality,
  });

  const hasUsableOptions = normalizedOptions.some((option) => isUsableOption(option));

  return {
    ok: hasUsablePrimary || hasUsableOptions,
    provider,
    exact,
    score,
    rawScore,
    url,
    title,
    priceText,
    reason: topLevelReason,
    urlQuality: topLevelUrlQuality,
    checkedProviders: normalizeCheckedProviders(input.checkedProviders),
    options: normalizedOptions,
    error:
      clean(input.error) ||
      (!hasUsablePrimary && normalizedOptions.length === 0 ? "not_found" : undefined),
  };
}

function makeErrorResult(error: string): TicketResolutionResult {
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
    urlQuality: "unknown",
    checkedProviders: [],
    options: [],
    error,
  };
}

export async function resolveTicketForFixture(
  args: ResolveTicketArgs
): Promise<TicketResolutionResult | null> {
  const base = clean(getBackendBaseUrl());

  if (!base) {
    return makeErrorResult("missing_backend_url");
  }

  const url = buildResolveUrl(base, args);

  if (!url) {
    return makeErrorResult("invalid_resolve_args");
  }

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;

  const timeout = controller
    ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    : null;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      cache: "no-store",
      signal: controller?.signal,
    });

    const raw = await res.text();
    const parsed = safeJsonParse<TicketResolutionResult>(raw);
    const normalized = normalizeResolutionResult(parsed);

    if (!normalized) {
      return makeErrorResult(res.ok ? "invalid_backend_json" : `http_${res.status}`);
    }

    if (!res.ok) {
      return {
        ...normalized,
        ok: normalized.ok,
        error: normalized.error || `http_${res.status}`,
      };
    }

    return normalized;
  } catch (error: any) {
    const name = String(error?.name ?? "");

    if (name === "AbortError") {
      return makeErrorResult("timeout");
    }

    return makeErrorResult("network_error");
  } finally {
    if (timeout) clearTimeout(timeout);
  }
    }
