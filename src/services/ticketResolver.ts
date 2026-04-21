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

function getReasonRank(reason: TicketResolutionOption["reason"]): number {
  if (reason === "exact_event") return 3;
  if (reason === "partial_match") return 2;
  if (reason === "search_fallback") return 1;
  return 0;
}

function getUrlQualityRank(urlQuality?: TicketUrlQuality): number {
  const q = normalizeUrlQuality(urlQuality);
  if (q === "event") return 4;
  if (q === "listing") return 3;
  if (q === "search") return 1;
  return 0;
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

  if (aPrice != null && bPrice != null && aPrice !== bPrice) {
    return aPrice - bPrice;
  }

  const aHasPrice = aPrice != null;
  const bHasPrice = bPrice != null;
  if (aHasPrice && !bHasPrice) return -1;
  if (!aHasPrice && bHasPrice) return 1;

  const aTie = providerTieBreak(a.provider);
  const bTie = providerTieBreak(b.provider);
  if (aTie !== bTie) return aTie - bTie;

  return clean(a.provider).localeCompare(clean(b.provider));
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

    if (compareOptions(option, existing) < 0) {
      byKey.set(key, option);
    }
  }

  return Array.from(byKey.values()).sort(compareOptions);
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
    typeof input.exact === "boolean" ? input.exact : Boolean(fallbackTop?.exact);

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
