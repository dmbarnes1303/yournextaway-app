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

type TimedResult<T> = {
  value: T | null;
  timedOut: boolean;
};

type CandidateAssessment = {
  urlQuality: CandidateUrlQuality;
  usableTier: "direct" | "fallback" | "reject";
  normalizedReason: TicketCandidate["reason"];
  exact: boolean;
};

const RESOLVER_VERSION = "resolve_v5_force_se365_basic_flow";

const PROVIDERS = [
  { id: "footballticketnet", fn: resolveFtnCandidate },
  { id: "sportsevents365", fn: resolveSe365Candidate },
] as const;

const CACHE = new Map<string, CacheEntry>();

// Keep cache effectively off while SE365 is being debugged.
// Once SE365 is stable, change this back to 1000 * 60 * 10.
const CACHE_TTL_MS = 0;

const PROVIDER_TIMEOUTS_MS: Record<TicketProviderId, number> = {
  footballticketnet: 9000,
  sportsevents365: 20000,
};

const PROVIDER_PRIORITY: Record<TicketProviderId, number> = {
  footballticketnet: 1,
  sportsevents365: 2,
};

const PROVIDER_HOST_ALLOWLIST: Record<TicketProviderId, string[]> = {
  footballticketnet: [
    "footballticketnet.com",
    "www.footballticketnet.com",
    "footballticketsnet.com",
    "www.footballticketsnet.com",
  ],
  sportsevents365: [
    "sportsevents365.com",
    "www.sportsevents365.com",
    "tickets-partners.com",
    "www.tickets-partners.com",
  ],
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalize(value: unknown): string {
  return clean(value).toLowerCase();
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
  if (CACHE_TTL_MS <= 0) return null;

  const entry = CACHE.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    CACHE.delete(key);
    return null;
  }

  return entry.value;
}

function setCache(key: string, value: TicketResolution): void {
  if (CACHE_TTL_MS <= 0) return;

  CACHE.set(key, {
    expires: Date.now() + CACHE_TTL_MS,
    value,
  });
}

function deleteCache(key: string): void {
  CACHE.delete(key);
}

function shouldCacheResolution(value: TicketResolution): boolean {
  if (CACHE_TTL_MS <= 0) return false;
  if (!value.ok) return false;
  if (!clean(value.url)) return false;

  const urlQuality = normalize(value.urlQuality);
  const reason = normalize(value.reason);

  if (urlQuality === "search") return false;
  if (reason === "search_fallback") return false;

  return true;
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

function parsePriceAmount(priceText?: string | null): number | null {
  const raw = clean(priceText);
  if (!raw) return null;

  const match = raw.match(/(\d{1,3}(?:[,\d]{0,})(?:\.\d{1,2})?)/);
  if (!match) return null;

  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function hasPriceText(candidate: TicketCandidate): boolean {
  return parsePriceAmount(candidate.priceText) != null || Boolean(clean(candidate.priceText));
}

function getUrlHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isTicketsPartnersUrl(url: string): boolean {
  const host = getUrlHost(url);
  return host === "tickets-partners.com" || host === "www.tickets-partners.com";
}

function detectUrlQuality(
  candidate: Pick<TicketCandidate, "url" | "urlQuality">
): CandidateUrlQuality {
  const explicit = normalize(candidate.urlQuality);

  if (
    explicit === "event" ||
    explicit === "listing" ||
    explicit === "search" ||
    explicit === "unknown"
  ) {
    return explicit;
  }

  const raw = clean(candidate.url);
  if (!raw) return "unknown";

  try {
    const parsed = new URL(raw);
    const path = parsed.pathname.toLowerCase();
    const query = parsed.search.toLowerCase();

    if (isTicketsPartnersUrl(raw)) {
      if (path.includes("/event")) return "event";
      if (query.includes("q=eq")) return "event";
      return "listing";
    }

    if (path.includes("/checkout-aff-link")) return "listing";
    if (path.startsWith("/search") && query.includes("event_id=")) return "listing";

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

function normalizeCandidate(candidate: TicketCandidate): TicketCandidate {
  const urlQuality = detectUrlQuality(candidate);

  let reason: TicketCandidate["reason"] = candidate.reason;

  if (urlQuality === "search") {
    reason = "search_fallback";
  } else if (urlQuality === "unknown" && reason === "exact_event") {
    reason = "partial_match";
  }

  const exact =
    Boolean(candidate.exact) &&
    reason === "exact_event" &&
    (urlQuality === "event" || urlQuality === "listing");

  return {
    ...candidate,
    exact,
    reason,
    urlQuality,
  };
}

function assessCandidate(candidate: TicketCandidate): CandidateAssessment {
  const urlQuality = detectUrlQuality(candidate);

  const normalizedReason =
    urlQuality === "search"
      ? "search_fallback"
      : candidate.reason === "exact_event" || candidate.reason === "partial_match"
        ? candidate.reason
        : "search_fallback";

  if (urlQuality === "event" || urlQuality === "listing") {
    return {
      urlQuality,
      usableTier: "direct",
      normalizedReason,
      exact:
        Boolean(candidate.exact) &&
        normalizedReason === "exact_event" &&
        (urlQuality === "event" || urlQuality === "listing"),
    };
  }

  if (urlQuality === "search") {
    return {
      urlQuality,
      usableTier: "fallback",
      normalizedReason: "search_fallback",
      exact: false,
    };
  }

  if (candidate.provider === "sportsevents365" && isTicketsPartnersUrl(candidate.url)) {
    return {
      urlQuality: "listing",
      usableTier: "direct",
      normalizedReason,
      exact: false,
    };
  }

  return {
    urlQuality,
    usableTier: "reject",
    normalizedReason: candidate.reason,
    exact: false,
  };
}

function sanitizeCandidate(candidate: TicketCandidate | null): TicketCandidate | null {
  if (!candidate) return null;

  if (!clean(candidate.url) || !clean(candidate.title)) {
    console.log("[tickets] candidate rejected: missing url/title", {
      provider: candidate.provider,
      hasUrl: Boolean(clean(candidate.url)),
      hasTitle: Boolean(clean(candidate.title)),
    });
    return null;
  }

  if (!isAllowedProviderUrl(candidate.provider, candidate.url)) {
    console.log("[tickets] candidate rejected: host not allowlisted", {
      provider: candidate.provider,
      url: candidate.url,
      host: getUrlHost(candidate.url),
      allowlist: PROVIDER_HOST_ALLOWLIST[candidate.provider],
    });
    return null;
  }

  const normalizedCandidate = normalizeCandidate(candidate);
  const assessment = assessCandidate(normalizedCandidate);

  if (assessment.usableTier === "reject") {
    console.log("[tickets] candidate rejected: unusable url quality", {
      provider: normalizedCandidate.provider,
      url: normalizedCandidate.url,
      urlQuality: assessment.urlQuality,
      reason: normalizedCandidate.reason,
    });
    return null;
  }

  return normalizedCandidate;
}

async function withTimeout<T>(
  provider: TicketProviderId,
  fn: () => Promise<T>
): Promise<TimedResult<T>> {
  const timeoutMs = PROVIDER_TIMEOUTS_MS[provider];

  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.log(`[tickets] ${provider} timeout`, { timeoutMs });
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

        console.log(`[tickets] ${provider} error`, {
          timeoutMs,
          message: error instanceof Error ? error.message : String(error),
        });

        resolve({ value: null, timedOut: false });
      });
  });
}

async function runProvider(
  provider: TicketProviderId,
  fn: () => Promise<TicketCandidate | null>
): Promise<TicketCandidate | null> {
  console.log("[tickets] provider start", { provider });

  const { value, timedOut } = await withTimeout(provider, fn);

  if (timedOut) {
    console.log("[tickets] provider returned null after timeout", { provider });
    return null;
  }

  const sanitized = sanitizeCandidate(value);

  console.log("[tickets] provider result", {
    provider,
    hadRawCandidate: Boolean(value),
    accepted: Boolean(sanitized),
    rawUrl: value?.url ?? null,
    acceptedUrl: sanitized?.url ?? null,
    rawReason: value?.reason ?? null,
    acceptedReason: sanitized?.reason ?? null,
    rawUrlQuality: value?.urlQuality ?? null,
    acceptedUrlQuality: sanitized?.urlQuality ?? null,
    rawPriceText: value?.priceText ?? null,
    acceptedPriceText: sanitized?.priceText ?? null,
  });

  return sanitized;
}

function reasonRank(reason: TicketCandidate["reason"]): number {
  if (reason === "exact_event") return 3;
  if (reason === "partial_match") return 2;
  return 1;
}

function urlQualityRank(urlQuality: CandidateUrlQuality): number {
  if (urlQuality === "event") return 3;
  if (urlQuality === "listing") return 2;
  if (urlQuality === "search") return 1;
  return 0;
}

function compareCandidates(a: TicketCandidate, b: TicketCandidate): number {
  const aa = assessCandidate(a);
  const bb = assessCandidate(b);

  const aPrice = parsePriceAmount(a.priceText);
  const bPrice = parsePriceAmount(b.priceText);

  if (aa.usableTier === "direct" && bb.usableTier !== "direct") return -1;
  if (aa.usableTier !== "direct" && bb.usableTier === "direct") return 1;

  if (aa.exact && !bb.exact) return -1;
  if (!aa.exact && bb.exact) return 1;

  if (aPrice != null && bPrice != null && aPrice !== bPrice) {
    return aPrice - bPrice;
  }

  const aHasPrice = hasPriceText(a);
  const bHasPrice = hasPriceText(b);
  if (aHasPrice && !bHasPrice) return -1;
  if (!aHasPrice && bHasPrice) return 1;

  const aReasonRank = reasonRank(aa.normalizedReason);
  const bReasonRank = reasonRank(bb.normalizedReason);
  if (aReasonRank !== bReasonRank) return bReasonRank - aReasonRank;

  const aQualityRank = urlQualityRank(aa.urlQuality);
  const bQualityRank = urlQualityRank(bb.urlQuality);
  if (aQualityRank !== bQualityRank) return bQualityRank - aQualityRank;

  if (a.score !== b.score) return b.score - a.score;

  const aPriority = PROVIDER_PRIORITY[a.provider] ?? 99;
  const bPriority = PROVIDER_PRIORITY[b.provider] ?? 99;
  if (aPriority !== bPriority) return aPriority - bPriority;

  return a.provider.localeCompare(b.provider);
}

function dedupeCandidates(candidates: TicketCandidate[]): TicketCandidate[] {
  const map = new Map<string, TicketCandidate>();

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeCandidate(candidate);
    const key = [
      normalize(normalizedCandidate.provider),
      normalize(normalizedCandidate.url),
    ].join("|");

    const existing = map.get(key);
    if (!existing) {
      map.set(key, normalizedCandidate);
      continue;
    }

    if (compareCandidates(normalizedCandidate, existing) < 0) {
      map.set(key, normalizedCandidate);
    }
  }

  return Array.from(map.values());
}

function toOption(candidate: TicketCandidate) {
  const assessment = assessCandidate(candidate);

  return {
    provider: candidate.provider,
    exact: assessment.exact,
    score: candidate.score,
    rawScore: candidate.rawScore ?? null,
    url: candidate.url,
    title: candidate.title,
    priceText: candidate.priceText ?? null,
    reason: assessment.normalizedReason,
    urlQuality: assessment.urlQuality,
  };
}

function pickPrimary(candidates: TicketCandidate[]): TicketCandidate {
  return [...candidates].sort(compareCandidates)[0];
}

function buildResolution(
  candidates: TicketCandidate[],
  checkedProviders: TicketResolution["checkedProviders"]
): TicketResolution {
  const deduped = dedupeCandidates(candidates).sort(compareCandidates);

  if (deduped.length === 0) {
    return buildNotFound(checkedProviders);
  }

  const primary = pickPrimary(deduped);
  const primaryAssessment = assessCandidate(primary);

  return {
    ok: true,
    provider: primary.provider,
    exact: primaryAssessment.exact,
    score: primary.score,
    rawScore: primary.rawScore ?? null,
    url: primary.url,
    title: primary.title,
    priceText: primary.priceText ?? null,
    reason: primaryAssessment.normalizedReason,
    checkedProviders,
    options: deduped.map(toOption),
    urlQuality: primaryAssessment.urlQuality,
  };
}

export async function resolveTicket(
  input: TicketResolveInput
): Promise<TicketResolution> {
  const cacheKey = buildCacheKey(input);
  const debugNoCache = Boolean((input as { debugNoCache?: unknown }).debugNoCache);

  if (debugNoCache) {
    deleteCache(cacheKey);
  } else {
    const cached = getCache(cacheKey);
    if (cached) {
      console.log("[tickets] cache hit", {
        cacheKey,
        resolverVersion: RESOLVER_VERSION,
        provider: cached.provider,
        reason: cached.reason,
        url: cached.url,
        urlQuality: cached.urlQuality ?? null,
        optionCount: cached.options.length,
      });
      return cached;
    }
  }

  const checkedProviders: TicketResolution["checkedProviders"] = [
    "footballticketnet",
    "sportsevents365",
  ];

  console.log("[tickets] resolver start", {
    resolverVersion: RESOLVER_VERSION,
    cacheDisabled: CACHE_TTL_MS <= 0,
    homeName: input.homeName,
    awayName: input.awayName,
    kickoffIso: input.kickoffIso,
    fixtureId: input.fixtureId ?? null,
    leagueId: input.leagueId ?? null,
    leagueName: input.leagueName ?? null,
  });

  const settled = await Promise.allSettled(
    PROVIDERS.map((provider) => runProvider(provider.id, () => provider.fn(input)))
  );

  const candidates: TicketCandidate[] = [];

  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) {
      candidates.push(result.value);
    }

    if (result.status === "rejected") {
      console.log("[tickets] provider promise rejected", {
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  console.log(
    "[tickets] resolver candidates",
    candidates.map((candidate) => {
      const assessment = assessCandidate(candidate);
      return {
        provider: candidate.provider,
        reason: candidate.reason,
        normalizedReason: assessment.normalizedReason,
        exact: assessment.exact,
        score: candidate.score,
        rawScore: candidate.rawScore ?? null,
        url: candidate.url,
        host: getUrlHost(candidate.url),
        urlQuality: assessment.urlQuality,
        usableTier: assessment.usableTier,
        priceText: candidate.priceText ?? null,
      };
    })
  );

  const result = buildResolution(candidates, checkedProviders);

  console.log("[tickets] resolver result", {
    ok: result.ok,
    provider: result.provider,
    reason: result.reason,
    url: result.url,
    urlQuality: result.urlQuality ?? null,
    optionCount: result.options.length,
    options: result.options.map((option) => ({
      provider: option.provider,
      reason: option.reason,
      url: option.url,
      urlQuality: option.urlQuality ?? null,
      priceText: option.priceText ?? null,
    })),
  });

  if (!debugNoCache) {
    if (shouldCacheResolution(result)) {
      setCache(cacheKey, result);
      console.log("[tickets] cache set", {
        cacheKey,
        resolverVersion: RESOLVER_VERSION,
        provider: result.provider,
        reason: result.reason,
        url: result.url,
        urlQuality: result.urlQuality ?? null,
        optionCount: result.options.length,
      });
    } else {
      deleteCache(cacheKey);
      console.log("[tickets] cache skipped", {
        cacheKey,
        resolverVersion: RESOLVER_VERSION,
        provider: result.provider,
        reason: result.reason,
        url: result.url,
        urlQuality: result.urlQuality ?? null,
        optionCount: result.options.length,
      });
    }
  }

  return result;
              }
