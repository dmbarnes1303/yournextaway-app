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

const REQUEST_TIMEOUT_MS = 9000;
const FIXTURE_CACHE_TTL_MS = 5 * 60 * 1000;
const FIXTURE_DETAIL_CACHE_TTL_MS = 2 * 60 * 1000;
const COUNTRIES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const TEAMS_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const FIXTURES_BY_ROUND_CACHE_TTL_MS = 5 * 60 * 1000;

type TimedCacheEntry<T> = {
  at: number;
  value: T;
};

const fixtureCache = new Map<string, TimedCacheEntry<FixtureListRow[]>>();
const fixtureDetailCache = new Map<string, TimedCacheEntry<FixtureListRow | null>>();
const fixturesByRoundCache = new Map<string, TimedCacheEntry<FixtureListRow[]>>();
const countriesCache = new Map<
  string,
  TimedCacheEntry<{ name: string; code: string; flag: string }[]>
>();
const teamsCache = new Map<
  string,
  TimedCacheEntry<{ id: number; name: string; logo?: string | null }[]>
>();

const inflightFixtures = new Map<string, Promise<FixtureListRow[]>>();
const inflightFixtureDetail = new Map<string, Promise<FixtureListRow | null>>();
const inflightFixturesByRound = new Map<string, Promise<FixtureListRow[]>>();
const inflightCountries = new Map<
  string,
  Promise<{ name: string; code: string; flag: string }[]>
>();
const inflightTeams = new Map<
  string,
  Promise<{ id: number; name: string; logo?: string | null }[]>
>();

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
      },
      signal: controller?.signal,
    });

    const parsed = await safeJson<BackendEnvelope<T>>(res);

    if (!res.ok) {
      const errorText =
        clean(parsed?.debug) ||
        clean(parsed?.error) ||
        `backend_http_${res.status}`;
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

function getTimedCache<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
  ttlMs: number
): TimedCacheEntry<T> | null {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.at > ttlMs) {
    cache.delete(key);
    return null;
  }

  return cached;
}

function setTimedCache<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
  value: T
): void {
  cache.set(key, {
    at: Date.now(),
    value,
  });
}

function fixtureCacheKey(params: {
  league: number;
  season: number;
  from?: string;
  to?: string;
}) {
  return [
    `league:${params.league}`,
    `season:${params.season}`,
    `from:${params.from ?? ""}`,
    `to:${params.to ?? ""}`,
  ].join("|");
}

function fixtureByIdCacheKey(id: number | string): string {
  return `fixture:${String(id)}`;
}

function fixturesByRoundCacheKey(opts: {
  leagueId: number;
  season: number;
  round: string;
}): string {
  return [
    `league:${opts.leagueId}`,
    `season:${opts.season}`,
    `round:${opts.round}`,
  ].join("|");
}

function teamsCacheKey(opts: { leagueId: number; season: number }): string {
  return `league:${opts.leagueId}|season:${opts.season}`;
}

function normalizeFixtureRows(rows: unknown): FixtureListRow[] {
  if (!Array.isArray(rows)) return [];

  return rows.filter((row: any) => {
    const id = Number(row?.fixture?.id);
    return Number.isFinite(id) && id > 0;
  }) as FixtureListRow[];
}

async function fetchFixturesNetwork(args: {
  key: string;
  league: number;
  season: number;
  from?: string;
  to?: string;
}): Promise<FixtureListRow[]> {
  const existing = inflightFixtures.get(args.key);
  if (existing) return existing;

  const request = backendFetch<FixtureListRow[]>("/football/fixtures", {
    league: args.league,
    season: args.season,
    from: args.from,
    to: args.to,
  })
    .then((rows) => {
      const normalized = normalizeFixtureRows(rows);
      setTimedCache(fixtureCache, args.key, normalized);
      return normalized;
    })
    .finally(() => {
      inflightFixtures.delete(args.key);
    });

  inflightFixtures.set(args.key, request);
  return request;
}

async function fetchFixtureByIdNetwork(key: string, id: number | string) {
  const existing = inflightFixtureDetail.get(key);
  if (existing) return existing;

  const request = backendFetch<FixtureListRow[]>("/football/fixture", { id })
    .then((rows) => {
      const normalized = normalizeFixtureRows(rows);
      const value = normalized[0] ?? null;
      setTimedCache(fixtureDetailCache, key, value);
      return value;
    })
    .finally(() => {
      inflightFixtureDetail.delete(key);
    });

  inflightFixtureDetail.set(key, request);
  return request;
}

async function fetchFixturesByRoundNetwork(opts: {
  key: string;
  leagueId: number;
  season: number;
  round: string;
}): Promise<FixtureListRow[]> {
  const existing = inflightFixturesByRound.get(opts.key);
  if (existing) return existing;

  const request = backendFetch<FixtureListRow[]>("/football/fixtures/by-round", {
    league: opts.leagueId,
    season: opts.season,
    round: opts.round,
  })
    .then((rows) => {
      const normalized = normalizeFixtureRows(rows);
      setTimedCache(fixturesByRoundCache, opts.key, normalized);
      return normalized;
    })
    .finally(() => {
      inflightFixturesByRound.delete(opts.key);
    });

  inflightFixturesByRound.set(opts.key, request);
  return request;
}

async function fetchCountriesNetwork(
  key: string
): Promise<{ name: string; code: string; flag: string }[]> {
  const existing = inflightCountries.get(key);
  if (existing) return existing;

  const request = backendFetch<any[]>("/football/countries")
    .then((rows) => {
      const value = (Array.isArray(rows) ? rows : []).map((r) => ({
        name: clean(r?.name),
        code: clean(r?.code),
        flag: clean(r?.flag),
      }));
      setTimedCache(countriesCache, key, value);
      return value;
    })
    .finally(() => {
      inflightCountries.delete(key);
    });

  inflightCountries.set(key, request);
  return request;
}

async function fetchTeamsNetwork(opts: {
  key: string;
  leagueId: number;
  season: number;
}): Promise<{ id: number; name: string; logo?: string | null }[]> {
  const existing = inflightTeams.get(opts.key);
  if (existing) return existing;

  const request = backendFetch<any[]>("/football/teams", {
    league: opts.leagueId,
    season: opts.season,
  })
    .then((rows) => {
      const value = (Array.isArray(rows) ? rows : [])
        .map((r) => ({
          id: Number(r?.team?.id),
          name: clean(r?.team?.name),
          logo: clean(r?.team?.logo) || null,
        }))
        .filter((team) => Number.isFinite(team.id) && !!team.name);

      setTimedCache(teamsCache, opts.key, value);
      return value;
    })
    .finally(() => {
      inflightTeams.delete(opts.key);
    });

  inflightTeams.set(opts.key, request);
  return request;
}

export async function getFixtures(params: FixturesParams): Promise<FixtureListRow[]> {
  const league = params.league ?? params.leagueId;
  const from = params.from ?? params.fromIso;
  const to = params.to ?? params.toIso;
  const season = params.season;

  if (!league || !season) return [];

  const key = fixtureCacheKey({ league, season, from, to });
  const cached = getTimedCache(fixtureCache, key, FIXTURE_CACHE_TTL_MS);

  if (cached) {
    return cached.value;
  }

  const stale = fixtureCache.get(key);
  if (stale) {
    void fetchFixturesNetwork({ key, league, season, from, to }).catch(() => null);
    return stale.value;
  }

  return fetchFixturesNetwork({ key, league, season, from, to });
}

export async function getFixtureById(id: number | string): Promise<FixtureListRow | null> {
  const key = fixtureByIdCacheKey(id);
  const cached = getTimedCache(fixtureDetailCache, key, FIXTURE_DETAIL_CACHE_TTL_MS);

  if (cached) {
    return cached.value;
  }

  const stale = fixtureDetailCache.get(key);
  if (stale) {
    void fetchFixtureByIdNetwork(key, id).catch(() => null);
    return stale.value;
  }

  return fetchFixtureByIdNetwork(key, id);
}

export async function getFixturesByRound(opts: {
  leagueId: number;
  season: number;
  round: string;
}): Promise<FixtureListRow[]> {
  if (!opts.leagueId || !opts.season || !opts.round) return [];

  const key = fixturesByRoundCacheKey(opts);
  const cached = getTimedCache(
    fixturesByRoundCache,
    key,
    FIXTURES_BY_ROUND_CACHE_TTL_MS
  );

  if (cached) {
    return cached.value;
  }

  const stale = fixturesByRoundCache.get(key);
  if (stale) {
    void fetchFixturesByRoundNetwork({ key, ...opts }).catch(() => null);
    return stale.value;
  }

  return fetchFixturesByRoundNetwork({ key, ...opts });
}

export async function getCountries(): Promise<
  { name: string; code: string; flag: string }[]
> {
  const key = "countries";
  const cached = getTimedCache(countriesCache, key, COUNTRIES_CACHE_TTL_MS);

  if (cached) {
    return cached.value;
  }

  const stale = countriesCache.get(key);
  if (stale) {
    void fetchCountriesNetwork(key).catch(() => null);
    return stale.value;
  }

  return fetchCountriesNetwork(key);
}

export async function getTeams(opts: {
  leagueId: number;
  season: number;
}): Promise<{ id: number; name: string; logo?: string | null }[]> {
  if (!opts.leagueId || !opts.season) return [];

  const key = teamsCacheKey(opts);
  const cached = getTimedCache(teamsCache, key, TEAMS_CACHE_TTL_MS);

  if (cached) {
    return cached.value;
  }

  const stale = teamsCache.get(key);
  if (stale) {
    void fetchTeamsNetwork({ key, ...opts }).catch(() => null);
    return stale.value;
  }

  return fetchTeamsNetwork({ key, ...opts });
}
