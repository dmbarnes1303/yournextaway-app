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

const APPROVED_PROVIDERS = ["footballticketnet", "sportsevents365"] as const;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function normalizeProvider(provider: unknown): string {
  return clean(provider)
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.com$/, "")
    .replace(/[\s_-]+/g, "");
}

function isSe365(provider: unknown): boolean {
  const p = normalizeProvider(provider);
  return p === "sportsevents365" || p === "sportsevents" || p === "se365" || p === "sports365";
}

function isFtn(provider: unknown): boolean {
  const p = normalizeProvider(provider);
  return (
    p === "footballticketnet" ||
    p === "footballticketsnet" ||
    p === "footballticket" ||
    p === "footballtickets" ||
    p === "ftn"
  );
}

function canonicalizeProvider(provider: unknown): string {
  if (isSe365(provider)) return "sportsevents365";
  if (isFtn(provider)) return "footballticketnet";
  return clean(provider);
}

function isApprovedProvider(provider: unknown): boolean {
  const canonical = canonicalizeProvider(provider);
  return APPROVED_PROVIDERS.includes(canonical as (typeof APPROVED_PROVIDERS)[number]);
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

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function buildResolveUrl(base: string, args: ResolveTicketArgs): string | null {
  const normalizedBase = clean(base).replace(/\/+$/, "");
  const homeName = clean(args.homeName);
  const awayName = clean(args.awayName);
  const kickoffIso = clean(args.kickoffIso);

  if (!normalizedBase || !homeName || !awayName || !kickoffIso) return null;

  const qs = new URLSearchParams({
    homeName,
    awayName,
    kickoffIso,
    includeProviders: "footballticketnet,sportsevents365",
    includeAllProviders: "1",
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

function parsePriceAmount(priceText?: string | null): number | null {
  const raw = clean(priceText);
  if (!raw) return null;

  const match = raw.match(/(\d{1,3}(?:[,\d]{0,})(?:\.\d{1,2})?)/);
  if (!match) return null;

  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function normalizeOption(input: unknown): TicketResolutionOption | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const obj = input as Record<string, unknown>;

  const provider = canonicalizeProvider(obj.provider);
  const url = safeUrl(obj.url);
  const title = clean(obj.title);
  const score = normalizeScore(obj.score) ?? 0;

  if (!provider || !url || !title) return null;
  if (!isApprovedProvider(provider)) return null;

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

function extractCandidateOptions(input: unknown): unknown[] {
  const out: unknown[] = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) return out;

  const obj = input as Record<string, unknown>;

  if (Array.isArray(obj.options)) out.push(...obj.options);
  if (Array.isArray(obj.results)) out.push(...obj.results);
  if (Array.isArray(obj.providerResults)) out.push(...obj.providerResults);
  if (Array.isArray(obj.ticketOptions)) out.push(...obj.ticketOptions);

  const providers = obj.providers;

  if (providers && typeof providers === "object" && !Array.isArray(providers)) {
    for (const [provider, value] of Object.entries(providers)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          out.push({
            ...(typeof item === "object" && item ? (item as Record<string, unknown>) : {}),
            provider,
          });
        }
      } else if (value && typeof value === "object") {
        out.push({
          ...(value as Record<string, unknown>),
          provider,
        });
      }
    }
  }

  return out;
}

function getReasonRank(reason: TicketResolutionOption["reason"]): number {
  if (reason === "exact_event") return 3;
  if (reason === "partial_match") return 2;
  return 1;
}

function getUrlQualityRank(urlQuality?: TicketUrlQuality): number {
  const q = normalizeUrlQuality(urlQuality);
  if (q === "event") return 4;
  if (q === "listing") return 3;
  if (q === "search") return 2;
  return 1;
}

function providerTieBreak(provider: string): number {
  if (isFtn(provider)) return 1;
  if (isSe365(provider)) return 2;
  return 9;
}

function compareOptions(a: TicketResolutionOption, b: TicketResolutionOption): number {
  if (a.exact && !b.exact) return -1;
  if (!a.exact && b.exact) return 1;

  const aReason = getReasonRank(a.reason);
  const bReason = getReasonRank(b.reason);
  if (aReason !== bReason) return bReason - aReason;

  const aQuality = getUrlQualityRank(a.urlQuality);
  const bQuality = getUrlQualityRank(b.urlQuality);
  if (aQuality !== bQuality) return bQuality - aQuality;

  if (a.score !== b.score) return b.score - a.score;

  const aPrice = parsePriceAmount(a.priceText);
  const bPrice = parsePriceAmount(b.priceText);

  if (aPrice != null && bPrice != null && aPrice !== bPrice) return aPrice - bPrice;
  if (aPrice != null && bPrice == null) return -1;
  if (aPrice == null && bPrice != null) return 1;

  const aTie = providerTieBreak(a.provider);
  const bTie = providerTieBreak(b.provider);
  if (aTie !== bTie) return aTie - bTie;

  return clean(a.provider).localeCompare(clean(b.provider));
}

function dedupeAndSortOptions(options: TicketResolutionOption[]): TicketResolutionOption[] {
  const byKey = new Map<string, TicketResolutionOption>();

  for (const option of options) {
    const provider = canonicalizeProvider(option.provider);
    const key = `${provider}|${option.url}`;
    const existing = byKey.get(key);
    const next = { ...option, provider };

    if (!existing || compareOptions(next, existing) < 0) {
      byKey.set(key, next);
    }
  }

  return Array.from(byKey.values()).sort(compareOptions);
}

function normalizeCheckedProviders(value: unknown): string[] {
  const rawProviders = Array.isArray(value) ? value : [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const entry of rawProviders) {
    const next = canonicalizeProvider(entry);
    if (!next || !isApprovedProvider(next)) continue;

    const key = next.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(next);
  }

  return out;
}

function isUsableOption(option: TicketResolutionOption | null | undefined): boolean {
  if (!option) return false;
  if (!option.provider || !option.url || !option.title) return false;
  return isApprovedProvider(option.provider);
}

function normalizeResolutionResult(input: TicketResolutionResult | null): TicketResolutionResult | null {
  if (!input || typeof input !== "object") return null;

  const rawOptions = extractCandidateOptions(input);

  const normalizedOptions = dedupeAndSortOptions(
    rawOptions
      .map((x) => normalizeOption(x))
      .filter((x): x is TicketResolutionOption => x !== null)
      .filter(isUsableOption)
  );

  const topLevelOption = normalizeOption({
    provider: input.provider,
    exact: input.exact,
    score: input.score,
    rawScore: input.rawScore,
    url: input.url,
    title: input.title,
    priceText: input.priceText,
    reason: input.reason,
    urlQuality: input.urlQuality,
  });

  const allOptions = dedupeAndSortOptions(
    [topLevelOption, ...normalizedOptions].filter(
      (x): x is TicketResolutionOption => x !== null && isUsableOption(x)
    )
  );

  const fallbackTop = allOptions[0] ?? null;

  const fallbackProvider = canonicalizeProvider(input.provider);
  const provider = fallbackTop?.provider ?? (fallbackProvider || null);
  const url = fallbackTop?.url ?? safeUrl(input.url) ?? null;
  const title = fallbackTop?.title ?? (clean(input.title) || null);
  const priceText = fallbackTop?.priceText ?? (clean(input.priceText) || null);
  const score = fallbackTop?.score ?? normalizeScore(input.score);
  const rawScore = fallbackTop?.rawScore ?? normalizeScore(input.rawScore);
  const exact = fallbackTop?.exact ?? Boolean(input.exact);
  const urlQuality = normalizeUrlQuality(fallbackTop?.urlQuality ?? input.urlQuality);

  const checkedProviderSet = new Set<string>(normalizeCheckedProviders(input.checkedProviders));

  for (const option of allOptions) {
    checkedProviderSet.add(option.provider);
  }

  const ok = allOptions.length > 0;

  return {
    ok,
    provider: ok ? provider : null,
    exact,
    score: ok ? score ?? null : null,
    rawScore: ok ? rawScore ?? null : null,
    url: ok ? url : null,
    title: ok ? title : null,
    priceText: ok ? priceText : null,
    reason: normalizeTopLevelReason(input.reason, Boolean(provider), ok),
    urlQuality,
    checkedProviders: Array.from(checkedProviderSet),
    options: allOptions,
    error: clean(input.error) || (!ok ? "not_found" : undefined),
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

  if (!base) return makeErrorResult("missing_backend_url");

  const url = buildResolveUrl(base, args);

  if (!url) return makeErrorResult("invalid_resolve_args");

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;

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
        error: normalized.error || `http_${res.status}`,
      };
    }

    return normalized;
  } catch (error: any) {
    const name = String(error?.name ?? "");

    if (name === "AbortError") return makeErrorResult("timeout");

    return makeErrorResult("network_error");
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
