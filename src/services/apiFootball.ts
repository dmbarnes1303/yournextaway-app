// src/services/apiFootball.ts
// API-Football fixtures service.
// Includes SAFE + CACHED SE365 enrichment (best-effort, non-blocking).
//
// Key fixes vs previous version:
// 1) Preserve kickoffIso as the API source string (do NOT force toISOString() -> can shift times)
// 2) Add SE365 cache + in-flight de-dupe so we don’t spam SE365 across lists/screens
// 3) Make getFixtureById accept string|number (your Trip screen calls it with a string)

import Constants from "expo-constants";
import { resolveSe365EventForFixture } from "@/src/services/se365";

type ApiFootballEnv = {
  baseUrl: string;
  apiKey?: string;
  host?: string;
};

const getEnv = (): ApiFootballEnv => {
  const extra =
    (Constants?.expoConfig?.extra as any) ||
    (Constants as any)?.manifest2?.extra ||
    (Constants as any)?.manifest?.extra ||
    {};

  const baseUrl =
    process.env.EXPO_PUBLIC_API_FOOTBALL_BASE_URL ||
    extra?.EXPO_PUBLIC_API_FOOTBALL_BASE_URL ||
    extra?.API_FOOTBALL_BASE_URL ||
    "https://v3.football.api-sports.io";

  const apiKey =
    process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
    extra?.EXPO_PUBLIC_API_FOOTBALL_KEY ||
    extra?.API_FOOTBALL_KEY ||
    process.env.API_FOOTBALL_KEY;

  const host =
    process.env.EXPO_PUBLIC_API_FOOTBALL_HOST ||
    extra?.EXPO_PUBLIC_API_FOOTBALL_HOST ||
    extra?.API_FOOTBALL_HOST ||
    "v3.football.api-sports.io";

  return { baseUrl, apiKey, host };
};

export type FixtureListRow = {
  id: number;

  // IMPORTANT: keep the source string from API-Football. Do not toISOString().
  kickoffIso: string;

  leagueId: number;
  leagueName: string;
  countryName?: string | null;
  season?: number | null;

  homeId: number;
  homeName: string;
  homeLogo?: string | null;

  awayId: number;
  awayName: string;
  awayLogo?: string | null;

  venueName?: string | null;
  venueCity?: string | null;

  statusShort?: string | null;
  statusLong?: string | null;

  // SE365 enrichment (optional)
  se365EventId?: number | null;
  se365EventUrl?: string | null;
};

type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    timestamp?: number;
    venue?: { name?: string; city?: string };
    status?: { short?: string; long?: string };
  };
  league: {
    id: number;
    name: string;
    country?: string;
    season?: number;
  };
  teams: {
    home: { id: number; name: string; logo?: string };
    away: { id: number; name: string; logo?: string };
  };
  [k: string]: any;
};

const clean = (v: any) => String(v ?? "").trim();

/* -------------------------------------------------------------------------- */
/* SE365 cache + in-flight de-dupe                                             */
/* -------------------------------------------------------------------------- */

type Se365CacheValue = {
  eventId: number | null;
  eventUrl: string | null;
  ts: number; // ms
  reason?: string;
};

const SE365_TTL_MS_DEFAULT = 24 * 60 * 60 * 1000; // 24h
const SE365_TTL_MS_NEAR_KICKOFF = 6 * 60 * 60 * 1000; // 6h when kickoff is near

const se365Cache = new Map<number, Se365CacheValue>();
const se365Inflight = new Map<number, Promise<Se365CacheValue>>();

function safeDate(iso: string): Date | null {
  const s = clean(iso);
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function ttlForKickoffIso(kickoffIso: string): number {
  const d = safeDate(kickoffIso);
  if (!d) return SE365_TTL_MS_DEFAULT;

  const now = Date.now();
  const diffMs = Math.abs(d.getTime() - now);
  const diffDays = diffMs / (24 * 60 * 60 * 1000);

  // If match is within ~14 days, refresh more often (SE365 listings can change)
  return diffDays <= 14 ? SE365_TTL_MS_NEAR_KICKOFF : SE365_TTL_MS_DEFAULT;
}

function isCacheFresh(v: Se365CacheValue, kickoffIso: string): boolean {
  const ttl = ttlForKickoffIso(kickoffIso);
  return Date.now() - v.ts < ttl;
}

async function resolveSe365Cached(row: FixtureListRow): Promise<Se365CacheValue> {
  const fixtureId = row.id;

  // Guard: don’t even try if required fields are missing
  const home = clean(row.homeName);
  const away = clean(row.awayName);
  const kickoffIso = clean(row.kickoffIso);
  if (!home || !away || !kickoffIso) {
    return { eventId: null, eventUrl: null, ts: Date.now(), reason: "missing_match_fields" };
  }

  const cached = se365Cache.get(fixtureId);
  if (cached && isCacheFresh(cached, kickoffIso)) return cached;

  const inflight = se365Inflight.get(fixtureId);
  if (inflight) return await inflight;

  const p = (async () => {
    try {
      const r = await resolveSe365EventForFixture({
        fixtureId,
        homeName: home,
        awayName: away,
        kickoffIso,
        leagueName: row.leagueName,
        leagueId: row.leagueId,
      });

      const v: Se365CacheValue = {
        eventId: r.eventId ?? null,
        eventUrl: r.eventUrl ?? null,
        reason: r.reason,
        ts: Date.now(),
      };

      se365Cache.set(fixtureId, v);
      return v;
    } catch {
      const v: Se365CacheValue = {
        eventId: null,
        eventUrl: null,
        reason: "resolver_error",
        ts: Date.now(),
      };
      se365Cache.set(fixtureId, v);
      return v;
    } finally {
      se365Inflight.delete(fixtureId);
    }
  })();

  se365Inflight.set(fixtureId, p);
  return await p;
}

/* -------------------------------------------------------------------------- */
/* Mapping                                                                      */
/* -------------------------------------------------------------------------- */

const toRow = (f: ApiFootballFixture): FixtureListRow => {
  return {
    id: f.fixture.id,

    // Preserve original API-Football datetime string.
    kickoffIso: clean(f.fixture.date),

    leagueId: f.league.id,
    leagueName: f.league.name,
    countryName: f.league.country ?? null,
    season: f.league.season ?? null,

    homeId: f.teams.home.id,
    homeName: f.teams.home.name,
    homeLogo: f.teams.home.logo ?? null,

    awayId: f.teams.away.id,
    awayName: f.teams.away.name,
    awayLogo: f.teams.away.logo ?? null,

    venueName: f.fixture.venue?.name ?? null,
    venueCity: f.fixture.venue?.city ?? null,

    statusShort: f.fixture.status?.short ?? null,
    statusLong: f.fixture.status?.long ?? null,

    se365EventId: null,
    se365EventUrl: null,
  };
};

const fetchJson = async (path: string): Promise<any> => {
  const { baseUrl, apiKey, host } = getEnv();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "x-rapidapi-host": host,
  };
  if (apiKey) headers["x-rapidapi-key"] = apiKey;

  const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, { method: "GET", headers });
  const txt = await res.text();

  let json: any;
  try {
    json = JSON.parse(txt);
  } catch {
    json = { _raw: txt };
  }

  if (!res.ok) {
    const msg = json?.message || json?.errors || json?._raw || `HTTP ${res.status}`;
    throw new Error(`API-Football error: ${msg}`);
  }

  return json;
};

const safeGetResponseArray = (json: any): ApiFootballFixture[] => {
  const arr = json?.response;
  return Array.isArray(arr) ? (arr as ApiFootballFixture[]) : [];
};

/* -------------------------------------------------------------------------- */
/* Concurrency-limited map                                                     */
/* -------------------------------------------------------------------------- */

const pMap = async <T, R>(
  items: T[],
  mapper: (t: T, idx: number) => Promise<R>,
  concurrency = 6
): Promise<R[]> => {
  const out: R[] = new Array(items.length) as any;
  let idx = 0;

  const workers = new Array(Math.max(1, concurrency)).fill(0).map(async () => {
    while (idx < items.length) {
      const cur = idx++;
      try {
        out[cur] = await mapper(items[cur], cur);
      } catch {
        out[cur] = items[cur] as any;
      }
    }
  });

  await Promise.all(workers);
  return out;
};

/* -------------------------------------------------------------------------- */
/* Enrichment                                                                   */
/* -------------------------------------------------------------------------- */

const enrichOne = async (row: FixtureListRow): Promise<FixtureListRow> => {
  // Don’t re-enrich if already present
  if (row.se365EventUrl || row.se365EventId) return row;

  const r = await resolveSe365Cached(row);
  return {
    ...row,
    se365EventId: r.eventId ?? null,
    se365EventUrl: r.eventUrl ?? null,
  };
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                   */
/* -------------------------------------------------------------------------- */

export async function getFixtures(params: {
  leagueId: number;
  season: number;
  fromIso: string;
  toIso: string;
  // Optional safety: enrich only first N fixtures (keeps huge lists snappy)
  enrichLimit?: number;
}): Promise<FixtureListRow[]> {
  const path = `/fixtures?league=${encodeURIComponent(String(params.leagueId))}&season=${encodeURIComponent(
    String(params.season)
  )}&from=${encodeURIComponent(clean(params.fromIso).slice(0, 10))}&to=${encodeURIComponent(
    clean(params.toIso).slice(0, 10)
  )}`;

  const json = await fetchJson(path);
  const fixtures = safeGetResponseArray(json);
  const rows = fixtures.map(toRow);

  const limit = typeof params.enrichLimit === "number" && params.enrichLimit >= 0 ? params.enrichLimit : rows.length;

  // Enrich with SE365 - best effort, non-blocking, concurrency-limited, cached
  const head = rows.slice(0, limit);
  const tail = rows.slice(limit);

  const headEnriched = await pMap(head, async (r) => await enrichOne(r), 6);
  return headEnriched.concat(tail);
}

export async function getFixturesByRound(params: {
  leagueId: number;
  season: number;
  round: string;
  enrichLimit?: number;
}): Promise<FixtureListRow[]> {
  const path = `/fixtures?league=${encodeURIComponent(String(params.leagueId))}&season=${encodeURIComponent(
    String(params.season)
  )}&round=${encodeURIComponent(clean(params.round))}`;

  const json = await fetchJson(path);
  const fixtures = safeGetResponseArray(json);
  const rows = fixtures.map(toRow);

  const limit = typeof params.enrichLimit === "number" && params.enrichLimit >= 0 ? params.enrichLimit : rows.length;
  const head = rows.slice(0, limit);
  const tail = rows.slice(limit);

  const headEnriched = await pMap(head, async (r) => await enrichOne(r), 6);
  return headEnriched.concat(tail);
}

export async function getFixtureById(fixtureId: string | number): Promise<FixtureListRow | null> {
  const id = clean(fixtureId);
  if (!id) return null;

  const path = `/fixtures?id=${encodeURIComponent(id)}`;
  const json = await fetchJson(path);
  const fixtures = safeGetResponseArray(json);
  const first = fixtures[0];
  if (!first) return null;

  const row = toRow(first);
  return await enrichOne(row);
}
