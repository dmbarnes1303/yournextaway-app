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

const PROVIDERS = [
  { id: "footballticketnet", fn: resolveFtnCandidate },
  { id: "sportsevents365", fn: resolveSe365Candidate },
] as const;

const CACHE = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 1000 * 60 * 10;

const PROVIDER_TIMEOUTS_MS: Record<TicketProviderId, number> = {
  footballticketnet: 9000,
  sportsevents365: 14000,
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
  sportsevents365: ["sportsevents365.com", "www.sportsevents365.com"],
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalize(value: unknown): string {
  return clean(value).toLowerCase();
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

function detectUrlQuality(candidate: Pick<TicketCandidate, "url" | "urlQuality">): CandidateUrlQuality {
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

  return {
    urlQuality,
    usableTier: "reject",
    normalizedReason: candidate.reason,
    exact: false,
  };
}

function sanitizeCandidate(candidate: TicketCandidate | null): TicketCandidate | null {
  if (!candidate) return null;
  if (!clean(candidate.url) || !clean(candidate.title)) return null;
  if (!isAllowedProviderUrl(candidate.provider, candidate.url)) return null;

  const normalizedCandidate = normalizeCandidate(candidate);
  const assessment = assessCandidate(normalizedCandidate);

  if (assessment.usableTier === "reject") return null;
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
  const { value, timedOut } = await withTimeout(provider, fn);
  if (timedOut) return null;
  return sanitizeCandidate(value);
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

  if (aa.exact && !bb.exact) return -1;
  if (!aa.exact && bb.exact) return 1;

  const aReasonRank = reasonRank(aa.normalizedReason);
  const bReasonRank = reasonRank(bb.normalizedReason);
  if (aReasonRank !== bReasonRank) return bReasonRank - aReasonRank;

  const aQualityRank = urlQualityRank(aa.urlQuality);
  const bQualityRank = urlQualityRank(bb.urlQuality);
  if (aQualityRank !== bQualityRank) return bQualityRank - aQualityRank;

  const aHasPrice = hasPriceText(a);
  const bHasPrice = hasPriceText(b);
  if (aHasPrice && !bHasPrice) return -1;
  if (!aHasPrice && bHasPrice) return 1;

  const aPrice = parsePriceAmount(a.priceText);
  const bPrice = parsePriceAmount(b.priceText);
  if (aPrice != null && bPrice != null && aPrice !== bPrice) return aPrice - bPrice;

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
      normalize(normalizedCandidate.reason),
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
  const deduped = dedupeCandidates(candidates);

  const directCandidates = deduped
    .filter((candidate) => assessCandidate(candidate).usableTier === "direct")
    .sort(compareCandidates);

  const fallbackCandidates = deduped
    .filter((candidate) => assessCandidate(candidate).usableTier === "fallback")
    .sort(compareCandidates);

  const chosenPool = directCandidates.length > 0 ? directCandidates : fallbackCandidates;

  if (chosenPool.length === 0) {
    return buildNotFound(checkedProviders);
  }

  const primary = pickPrimary(chosenPool);
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
    options: chosenPool.map(toOption),
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
    if (cached) return cached;
  }

  const checkedProviders: TicketResolution["checkedProviders"] = [
    "footballticketnet",
    "sportsevents365",
  ];

  const settled = await Promise.allSettled(
    PROVIDERS.map((provider) => runProvider(provider.id, () => provider.fn(input)))
  );

  const candidates: TicketCandidate[] = [];

  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) {
      candidates.push(result.value);
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
        urlQuality: assessment.urlQuality,
        usableTier: assessment.usableTier,
        priceText: candidate.priceText ?? null,
      };
    })
  );

  const result = buildResolution(candidates, checkedProviders);

  if (!debugNoCache) {
    setCache(cacheKey, result);
  }

  return result;
}
