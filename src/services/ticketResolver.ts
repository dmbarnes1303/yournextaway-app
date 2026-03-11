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
};

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getBackendBaseUrl(): string {
  const raw =
    clean(process.env.EXPO_PUBLIC_BACKEND_URL) ||
    clean((process.env as any)?.EXPO_PUBLIC_BACKEND_BASE_URL);

  return raw.replace(/\/+$/, "");
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

  return `${base}/tickets/resolve?${qs.toString()}`;
}

function normalizeOption(input: unknown): TicketResolutionOption | null {
  if (!input || typeof input !== "object") return null;

  const obj = input as Record<string, unknown>;
  const provider = clean(obj.provider);
  const url = clean(obj.url);
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
    ? input.options.map((x) => normalizeOption(x)).filter(Boolean) as TicketResolutionOption[]
    : [];

  const fallbackTop = normalizedOptions[0] ?? null;

  const provider = clean(input.provider) || fallbackTop?.provider || null;
  const url = clean(input.url) || fallbackTop?.url || null;
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

export async function resolveTicketForFixture(
  args: ResolveTicketArgs
): Promise<TicketResolutionResult | null> {
  const base = getBackendBaseUrl();
  const url = buildResolveUrl(base, args);

  if (!url) return null;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const raw = await res.text();
    const parsed = safeJsonParse<TicketResolutionResult>(raw);
    const normalized = normalizeResolutionResult(parsed);

    if (!normalized) {
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
        error: res.ok ? "invalid_backend_json" : `http_${res.status}`,
      };
    }

    if (!res.ok) {
      return {
        ...normalized,
        ok: false,
        error: normalized.error || `http_${res.status}`,
      };
    }

    return normalized;
  } catch {
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
      error: "network_error",
    };
  }
          }
