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

function normalizeResolutionResult(input: TicketResolutionResult | null): TicketResolutionResult | null {
  if (!input) return null;

  return {
    ok: Boolean(input.ok),
    provider: clean(input.provider) || null,
    exact: Boolean(input.exact),
    score: typeof input.score === "number" && Number.isFinite(input.score) ? input.score : null,
    url: clean(input.url) || null,
    title: clean(input.title) || null,
    priceText: clean(input.priceText) || null,
    reason:
      input.reason === "exact_event" || input.reason === "search_fallback" || input.reason === "not_found"
        ? input.reason
        : "not_found",
    checkedProviders: Array.isArray(input.checkedProviders)
      ? input.checkedProviders.map((x) => clean(x)).filter(Boolean)
      : [],
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
      error: "network_error",
    };
  }
}
