import { assertBackendBaseUrl } from "../config/env";

export type FixtureListRow = {
  fixture: {
    id: number;
    date: string | null;
    status?: { short?: string | null; long?: string | null };
    venue?: { name?: string | null; city?: string | null };
  };
  league: {
    id: number;
    name?: string | null;
    season?: number | null;
    round?: string | null;
    flag?: string | null;
    country?: string | null;
  };
  teams: {
    home?: { id?: number; name?: string | null; logo?: string | null };
    away?: { id?: number; name?: string | null; logo?: string | null };
  };
  goals?: { home?: number | null; away?: number | null };
  score?: any;
};

type FixturesParams = {
  league?: number;
  leagueId?: number;
  season?: number;
  from?: string;
  to?: string;
  fromIso?: string;
  toIso?: string;
};

type BackendEnvelope<T> = {
  ok?: boolean;
  response?: T;
  error?: string;
  debug?: string;
  requestId?: string;
};

const REQUEST_TIMEOUT_MS = 20000;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined | null>
): string {
  const base = assertBackendBaseUrl();
  const url = new URL(`${base}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function safeJson<T>(res: Response): Promise<T | null> {
  const text = await res.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function backendFetch<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>
): Promise<T> {
  const url = buildUrl(path, params);

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

    const parsed = await safeJson<BackendEnvelope<T>>(res);

    if (!res.ok) {
      const errorText =
        clean(parsed?.debug) || clean(parsed?.error) || `backend_http_${res.status}`;
      throw new Error(errorText);
    }

    if (!parsed || !("response" in parsed)) {
      throw new Error("invalid_backend_response");
    }

    return parsed.response as T;
  } catch (error: any) {
    if (String(error?.name ?? "") === "AbortError") {
      throw new Error("backend_timeout");
    }

    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function getFixtures(params: FixturesParams): Promise<FixtureListRow[]> {
  const league = params.league ?? params.leagueId;
  const from = params.from ?? params.fromIso;
  const to = params.to ?? params.toIso;

  if (!league || !params.season) return [];

  const rows = await backendFetch<FixtureListRow[]>("/football/fixtures", {
    league,
    season: params.season,
    from,
    to,
  });

  return Array.isArray(rows) ? rows : [];
}

export async function getFixtureById(id: number | string): Promise<FixtureListRow | null> {
  const rows = await backendFetch<FixtureListRow[]>("/football/fixture", { id });

  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0] as FixtureListRow;
}

export async function getFixturesByRound(opts: {
  leagueId: number;
  season: number;
  round: string;
}): Promise<FixtureListRow[]> {
  if (!opts.leagueId || !opts.season || !opts.round) return [];

  const rows = await backendFetch<FixtureListRow[]>("/football/fixtures/by-round", {
    league: opts.leagueId,
    season: opts.season,
    round: opts.round,
  });

  return Array.isArray(rows) ? rows : [];
}

export async function getCountries(): Promise<
  { name: string; code: string; flag: string }[]
> {
  const rows = await backendFetch<any[]>("/football/countries");

  return (Array.isArray(rows) ? rows : []).map((r) => ({
    name: clean(r?.name),
    code: clean(r?.code),
    flag: clean(r?.flag),
  }));
}

export async function getTeams(opts: {
  leagueId: number;
  season: number;
}): Promise<{ id: number; name: string; logo?: string | null }[]> {
  if (!opts.leagueId || !opts.season) return [];

  const rows = await backendFetch<any[]>("/football/teams", {
    league: opts.leagueId,
    season: opts.season,
  });

  return (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      id: Number(r?.team?.id),
      name: clean(r?.team?.name),
      logo: clean(r?.team?.logo) || null,
    }))
    .filter((team) => Number.isFinite(team.id) && !!team.name);
}
