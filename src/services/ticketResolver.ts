// src/services/ticketResolver.ts

export type TicketResolutionOption = {
  provider: string;
  exact: boolean;
  score: number;
  url: string;
  title: string;
  priceText?: string | null;
  reason: "exact_event" | "search_fallback" | "partial_match";
};

export type TicketResolutionResult = {
  ok: boolean;
  provider: string | null;
  exact: boolean;
  score: number | null;
  url: string | null;
  title: string | null;
  priceText?: string | null;
  reason: "exact_event" | "search_fallback" | "not_found";
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

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
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
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

function getBackendBaseUrl(): string {
  const raw =
    clean(process.env.EXPO_PUBLIC_BACKEND_URL) ||
    clean((process.env as any)?.EXPO_PUBLIC_BACKEND_BASE_URL);

  const safe = safeUrl(raw);
  return safe ? safe.replace(/\/+$/, "") : "";
}

function buildResolveUrl(base: string, args: ResolveTicketArgs): string | null {
  const homeName = clean(args.homeName);
  const awayName = clean(args.awayName);
  const kickoffIso = clean(args.kickoffIso);

  if (!base || !homeName || !awayName || !kickoffIso) return null;

  const qs = new URLSearchParams({
    homeName,
    awayName,
    kickoffIso,
  });

  const fixtureId = clean(args.fixtureId);
  const leagueName = clean(args.leagueName);
  const leagueId = clean(args.leagueId);

  if (fixtureId) qs.set("fixtureId", fixtureId);
  if (leagueName) qs.set("leagueName", leagueName);
  if (leagueId) qs.set("leagueId", leagueId);
  if (args.debugNoCache) qs.set("debugNoCache", "1");

  qs.set("_ts", String(Date.now()));

  return `${base}/tickets/resolve?${qs.toString()}`;
}

function normalizeOption(input: unknown): TicketResolutionOption | null {
  if (!input || typeof input !== "object") return null;

  const obj = input as Record<string, unknown>;
  const provider = clean(obj.provider);
  const url = safeUrl(obj.url);
  const title = clean(obj.title);
  const reason = clean(obj.reason);

  const score =
    typeof obj.score === "number" && Number.isFinite(obj.score)
      ? obj.score
      : null;

  if (!provider || !url || !title || score == null) return null;

  const normalizedReason =
    reason === "exact_event" ||
    reason === "search_fallback" ||
    reason === "partial_match"
      ? (reason as TicketResolutionOption["reason"])
      : "search_fallback";

  return {
    provider,
    exact: Boolean(obj.exact),
    score,
    url,
    title,
    priceText: clean(obj.priceText) || null,
    reason: normalizedReason,
  };
}

function normalizeResolutionResult(
  input: TicketResolutionResult | null
): TicketResolutionResult | null {
  if (!input) return null;

  const normalizedOptions = Array.isArray(input.options)
    ? (input.options
        .map((x) => normalizeOption(x))
        .filter(Boolean) as TicketResolutionOption[])
    : [];

  const fallbackTop = normalizedOptions[0] ?? null;

  const provider = clean(input.provider) || fallbackTop?.provider || null;
  const url = safeUrl(input.url) || fallbackTop?.url || null;
  const title = clean(input.title) || fallbackTop?.title || null;
  const priceText = clean(input.priceText) || fallbackTop?.priceText || null;

  const score =
    typeof input.score === "number" && Number.isFinite(input.score)
      ? input.score
      : typeof fallbackTop?.score === "number"
      ? fallbackTop.score
      : null;

  const exact =
    typeof input.exact === "boolean"
      ? input.exact
      : Boolean(fallbackTop?.exact);

  const rawReason = clean(input.reason);
  const reason =
    rawReason === "exact_event" ||
    rawReason === "search_fallback" ||
    rawReason === "not_found"
      ? (rawReason as TicketResolutionResult["reason"])
      : provider
      ? "search_fallback"
      : "not_found";

  return {
    ok: Boolean(input.ok),
    provider,
    exact,
    score,
    url,
    title,
    priceText,
    reason,
    checkedProviders: Array.isArray(input.checkedProviders)
      ? input.checkedProviders.map((x) => clean(x)).filter(Boolean)
      : [],
    options: normalizedOptions,
    error: clean(input.error) || undefined,
  };
}

function makeErrorResult(error: string): TicketResolutionResult {
  return {
    ok: false,
    provider: null,
    exact: false,
    score: null,
    url: null,
    title: null,
    priceText: null,
    reason: "not_found",
    checkedProviders: [],
    options: [],
    error,
  };
}

export async function resolveTicketForFixture(
  args: ResolveTicketArgs
): Promise<TicketResolutionResult | null> {
  const base = getBackendBaseUrl();

  if (!base) {
    console.log("[ticketResolver] missing backend base url", {
      EXPO_PUBLIC_BACKEND_URL: clean(process.env.EXPO_PUBLIC_BACKEND_URL),
      EXPO_PUBLIC_BACKEND_BASE_URL: clean(
        (process.env as any)?.EXPO_PUBLIC_BACKEND_BASE_URL
      ),
    });
    return makeErrorResult("missing_backend_url");
  }

  const url = buildResolveUrl(base, args);

  if (!url) {
    console.log("[ticketResolver] could not build resolve url", {
      base,
      fixtureId: clean(args.fixtureId),
      homeName: clean(args.homeName),
      awayName: clean(args.awayName),
      kickoffIso: clean(args.kickoffIso),
      leagueName: clean(args.leagueName),
      leagueId: clean(args.leagueId),
    });
    return makeErrorResult("invalid_resolve_args");
  }

  console.log("[ticketResolver] request start", {
    base,
    url,
    fixtureId: clean(args.fixtureId),
    homeName: clean(args.homeName),
    awayName: clean(args.awayName),
    kickoffIso: clean(args.kickoffIso),
    leagueName: clean(args.leagueName),
    leagueId: clean(args.leagueId),
    debugNoCache: Boolean(args.debugNoCache),
  });

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

    console.log("[ticketResolver] raw response", {
      status: res.status,
      ok: res.ok,
      bodyPreview: raw.slice(0, 800),
    });

    const parsed = safeJsonParse<TicketResolutionResult>(raw);
    const normalized = normalizeResolutionResult(parsed);

    if (!normalized) {
      console.log("[ticketResolver] invalid backend json", {
        status: res.status,
        raw,
      });
      return makeErrorResult(res.ok ? "invalid_backend_json" : `http_${res.status}`);
    }

    if (!res.ok) {
      console.log("[ticketResolver] backend non-ok normalized response", normalized);
      return {
        ...normalized,
        ok: false,
        error: normalized.error || `http_${res.status}`,
      };
    }

    console.log("[ticketResolver] normalized success", {
      provider: normalized.provider,
      reason: normalized.reason,
      score: normalized.score,
      optionsCount: Array.isArray(normalized.options)
        ? normalized.options.length
        : 0,
      checkedProviders: normalized.checkedProviders ?? [],
    });

    return normalized;
  } catch (e: any) {
    const name = String(e?.name ?? "");
    const message = String(e?.message ?? "");

    console.log("[ticketResolver] fetch failed", {
      name,
      message,
      url,
    });

    if (name === "AbortError") {
      return makeErrorResult("timeout");
    }

    return makeErrorResult("network_error");
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
