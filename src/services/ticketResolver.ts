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
  return p === "footballticketnet" || p === "ftn";
}

function providerPriority(provider: unknown): number {
  if (isSe365(provider)) return 300;
  if (isFtn(provider)) return 200;
  return 100;
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

  const provider = clean(obj.provider);
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
    const next = clean(entry);
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

function isStrongOption(option: TicketResolutionOption | null | undefined): boolean {
  if (!option) return false;
  if (!option.provider || !option.url || !option.title) return false;

  const reason = option.reason;
  const urlQuality = normalizeUrlQuality(option.urlQuality);

  if (isSe365(option.provider)) {
    if (option.exact || reason === "exact_event") {
      return urlQuality === "event" || urlQuality === "listing" || urlQuality === "unknown";
    }

    if (reason === "partial_match") {
      return urlQuality === "event" || urlQuality === "listing";
    }

    return false;
  }

  if (isFtn(option.provider)) {
    if (option.exact || reason === "exact_event") {
      return urlQuality === "event" || urlQuality === "listing";
    }

    if (reason === "partial_match") {
      return urlQuality === "event" || urlQuality === "listing";
    }

    return false;
  }

  if (option.exact || reason === "exact_event") {
    return urlQuality === "event" || urlQuality === "listing" || urlQuality === "unknown";
  }

  if (reason === "partial_match") {
    return urlQuality === "event" || urlQuality === "listing";
  }

  return false;
}

function isStrongPrimary(args: {
  provider: string | null;
  url: string | null;
  title: string | null;
  exact: boolean;
  reason: TicketResolutionResult["reason"];
  urlQuality: TicketUrlQuality;
}): boolean {
  if (!hasUsablePrimaryFields(args)) return false;

  if (isSe365(args.provider)) {
    if (args.exact || args.reason === "exact_event") {
      return args.urlQuality === "event" || args.urlQuality === "listing" || args.urlQuality === "unknown";
    }

    if (args.reason === "partial_match") {
      return args.urlQuality === "event" || args.urlQuality === "listing";
    }

    return false;
  }

  if (isFtn(args.provider)) {
    if (args.exact || args.reason === "exact_event") {
      return args.urlQuality === "event" || args.urlQuality === "listing";
    }

    if (args.reason === "partial_match") {
      return args.urlQuality === "event" || args.urlQuality === "listing";
    }

    return false;
  }

  if (args.exact || args.reason === "exact_event") {
    return args.urlQuality === "event" || args.urlQuality === "listing" || args.urlQuality === "unknown";
  }

  if (args.reason === "partial_match") {
    return args.urlQuality === "event" || args.urlQuality === "listing";
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

  const provider = clean(input.provider) || fallbackTop?.provider || null;
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

  const hasUsablePrimary = hasUsablePrimaryFields({ provider, url, title });
  const hasUsableOptions = normalizedOptions.length > 0;

  const hasStrongPrimary = isStrongPrimary({
    provider,
    url,
    title,
    exact,
    reason: topLevelReason,
    urlQuality: topLevelUrlQuality,
  });

  const hasStrongOptions = normalizedOptions.some((option) => isStrongOption(option));

  return {
    ok: hasStrongPrimary || hasStrongOptions,
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
      (!hasUsablePrimary && !hasUsableOptions ? "not_found" : undefined),
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
      const hasStrongData = Boolean(normalized.ok);

      return {
        ...normalized,
        ok: hasStrongData,
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
