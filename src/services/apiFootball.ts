// src/services/apiFootball.ts
import { API_FOOTBALL_BASE_URL, assertApiFootballKey } from "@/src/config/apiFootball";
import { normalizeCityName } from "@/src/constants/iataCities";

type ApiSportsEnvelope<T> = {
  errors?: Record<string, unknown> | unknown[] | string | null;
  message?: unknown;
  results?: number;
  response?: T;
};

function enc(q: Record<string, string | number | undefined>) {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

function stringifySafe(x: unknown) {
  try {
    return typeof x === "string" ? x : JSON.stringify(x);
  } catch {
    return String(x);
  }
}

function extractApiSportsError(json: ApiSportsEnvelope<any>): string | null {
  const e = json?.errors;
  if (!e) return null;

  if (typeof e === "object" && !Array.isArray(e)) {
    const obj = e as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return null;
    return `API-Football error: ${stringifySafe(obj)}`;
  }

  if (Array.isArray(e) && e.length) return `API-Football error: ${stringifySafe(e)}`;
  if (typeof e === "string" && e.trim()) return `API-Football error: ${e.trim()}`;

  return null;
}

async function apiGet<T>(path: string): Promise<T> {
  const key = assertApiFootballKey();
  const url = `${API_FOOTBALL_BASE_URL}${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "x-apisports-key": key },
  });

  const text = await res.text();

  let json: ApiSportsEnvelope<T>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("API-Football returned invalid JSON");
  }

  const apiErr = extractApiSportsError(json);

  if (!res.ok) {
    throw new Error(apiErr ?? `API-Football HTTP ${res.status}: ${text}`);
  }

  if (apiErr) throw new Error(apiErr);

  return (json?.response as T) ?? ([] as any);
}

/**
 * Minimal fixture shape we actually use in UI.
 * NOTE: includes team logos so we can render crests.
 * NOTE: includes venue.id because City filtering needs it.
 */
export type FixtureListRow = {
  fixture?: {
    id?: number;
    date?: string; // ISO
    venue?: { id?: number; name?: string; city?: string };
    status?: { long?: string; short?: string };
  };
  league?: {
    id?: number;
    name?: string;
    round?: string;
    season?: number;
    country?: string;
  };
  teams?: {
    home?: { id?: number; name?: string; logo?: string };
    away?: { id?: number; name?: string; logo?: string };
  };
};

/**
 * Teams endpoint row (we use it for automatic city registry).
 */
export type ApiFootballTeamRow = {
  team?: { id?: number; name?: string; logo?: string; country?: string };
  venue?: { id?: number; name?: string; city?: string };
};

export type ApiFootballCountryRow = {
  name?: string;
  code?: string; // ISO2
  flag?: string;
};

/* -------------------------------------------------------------------------- */
/* Normalization */
/* -------------------------------------------------------------------------- */

function normalizeFixtureCityInPlace(row: FixtureListRow | null | undefined) {
  const raw = row?.fixture?.venue?.city;
  if (!raw) return row;
  const canon = normalizeCityName(raw);
  if (canon && canon !== raw) row!.fixture!.venue!.city = canon;
  return row;
}

function normalizeRows(rows: FixtureListRow[]): FixtureListRow[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  for (const r of rows) normalizeFixtureCityInPlace(r);
  return rows;
}

/* -------------------------------------------------------------------------- */
/* In-memory caching */
/* -------------------------------------------------------------------------- */

const FIXTURES_TTL_MS = 10 * 60 * 1000; // 10 minutes
const FIXTURE_BY_ID_TTL_MS = 30 * 60 * 1000; // 30 minutes
const FIXTURES_BY_ROUND_TTL_MS = 30 * 60 * 1000; // 30 minutes
const TEAMS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const COUNTRIES_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type CacheEntry<T> = {
  ts: number;
  value?: T;
  inflight?: Promise<T>;
};

const fixturesCache = new Map<string, CacheEntry<FixtureListRow[]>>();
const fixtureByIdCache = new Map<string, CacheEntry<FixtureListRow | null>>();
const fixturesByRoundCache = new Map<string, CacheEntry<FixtureListRow[]>>();
const teamsCache = new Map<string, CacheEntry<ApiFootballTeamRow[]>>();
const countriesCache = new Map<string, CacheEntry<ApiFootballCountryRow[]>>();

function now() {
  return Date.now();
}
function isFresh(ts: number, ttlMs: number) {
  return now() - ts < ttlMs;
}

function fixturesKey(params: { league: number; season: number; from: string; to: string }) {
  return `fixtures:${params.league}:${params.season}:${params.from}:${params.to}`;
}
function fixtureIdKey(id: string | number) {
  return `fixture:${String(id)}`;
}
function fixturesByRoundKey(params: { league: number; season: number; round: string }) {
  return `fixturesRound:${params.league}:${params.season}:${params.round}`;
}
function teamsKey(params: { league: number; season: number }) {
  return `teams:${params.league}:${params.season}`;
}
function countriesKey() {
  return `countries`;
}

/* -------------------------------------------------------------------------- */
/* Public API */
/* -------------------------------------------------------------------------- */

export async function getFixtures(params: {
  league: number;
  season: number;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}): Promise<FixtureListRow[]> {
  const key = fixturesKey(params);
  const existing = fixturesCache.get(key);

  if (existing?.value && isFresh(existing.ts, FIXTURES_TTL_MS)) return existing.value;
  if (existing?.inflight) return existing.inflight;

  const qs = enc({ league: params.league, season: params.season, from: params.from, to: params.to });

  const inflight = apiGet<FixtureListRow[]>(`/fixtures${qs}`)
    .then((rows) => (Array.isArray(rows) ? rows : []))
    .then((rows) => normalizeRows(rows))
    .then((rows) => {
      fixturesCache.set(key, { ts: now(), value: rows });
      return rows;
    })
    .catch((err) => {
      fixturesCache.delete(key);
      throw err;
    });

  fixturesCache.set(key, { ts: now(), inflight });
  return inflight;
}

export async function getFixtureById(fixtureId: string | number): Promise<FixtureListRow | null> {
  const key = fixtureIdKey(fixtureId);
  const existing = fixtureByIdCache.get(key);

  if (existing && "value" in existing && isFresh(existing.ts, FIXTURE_BY_ID_TTL_MS)) return existing.value ?? null;
  if (existing?.inflight) return existing.inflight;

  const qs = enc({ id: fixtureId });

  const inflight = apiGet<FixtureListRow[]>(`/fixtures${qs}`)
    .then((rows) => (Array.isArray(rows) ? rows : []))
    .then((rows) => rows?.[0] ?? null)
    .then((row) => normalizeFixtureCityInPlace(row) ?? row)
    .then((row) => {
      fixtureByIdCache.set(key, { ts: now(), value: row });
      return row;
    })
    .catch((err) => {
      fixtureByIdCache.delete(key);
      throw err;
    });

  fixtureByIdCache.set(key, { ts: now(), inflight });
  return inflight;
}

export async function getFixturesByRound(params: { league: number; season: number; round: string }): Promise<FixtureListRow[]> {
  const round = String(params.round ?? "").trim();
  if (!round) return [];

  const key = fixturesByRoundKey({ league: params.league, season: params.season, round });
  const existing = fixturesByRoundCache.get(key);

  if (existing?.value && isFresh(existing.ts, FIXTURES_BY_ROUND_TTL_MS)) return existing.value;
  if (existing?.inflight) return existing.inflight;

  const qs = enc({ league: params.league, season: params.season, round });

  const inflight = apiGet<FixtureListRow[]>(`/fixtures${qs}`)
    .then((rows) => (Array.isArray(rows) ? rows : []))
    .then((rows) => normalizeRows(rows))
    .then((rows) => {
      fixturesByRoundCache.set(key, { ts: now(), value: rows });
      return rows;
    })
    .catch((err) => {
      fixturesByRoundCache.delete(key);
      throw err;
    });

  fixturesByRoundCache.set(key, { ts: now(), inflight });
  return inflight;
}

/**
 * Fetch teams for a league+season (used to build automatic city registry).
 */
export async function getTeams(params: { league: number; season: number }): Promise<ApiFootballTeamRow[]> {
  const key = teamsKey(params);
  const existing = teamsCache.get(key);

  if (existing?.value && isFresh(existing.ts, TEAMS_TTL_MS)) return existing.value;
  if (existing?.inflight) return existing.inflight;

  const qs = enc({ league: params.league, season: params.season });

  const inflight = apiGet<ApiFootballTeamRow[]>(`/teams${qs}`)
    .then((rows) => (Array.isArray(rows) ? rows : []))
    .then((rows) => {
      teamsCache.set(key, { ts: now(), value: rows });
      return rows;
    })
    .catch((err) => {
      teamsCache.delete(key);
      throw err;
    });

  teamsCache.set(key, { ts: now(), inflight });
  return inflight;
}

/**
 * Fetch countries list to map country name -> ISO2 code.
 */
export async function getCountries(): Promise<ApiFootballCountryRow[]> {
  const key = countriesKey();
  const existing = countriesCache.get(key);

  if (existing?.value && isFresh(existing.ts, COUNTRIES_TTL_MS)) return existing.value;
  if (existing?.inflight) return existing.inflight;

  const inflight = apiGet<ApiFootballCountryRow[]>(`/countries`)
    .then((rows) => (Array.isArray(rows) ? rows : []))
    .then((rows) => {
      countriesCache.set(key, { ts: now(), value: rows });
      return rows;
    })
    .catch((err) => {
      countriesCache.delete(key);
      throw err;
    });

  countriesCache.set(key, { ts: now(), inflight });
  return inflight;
}

export function __clearApiFootballCache() {
  fixturesCache.clear();
  fixtureByIdCache.clear();
  fixturesByRoundCache.clear();
  teamsCache.clear();
  countriesCache.clear();
}
