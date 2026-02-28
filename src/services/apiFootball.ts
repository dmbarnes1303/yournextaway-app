// src/services/apiFootball.ts
// API-Football fixtures service.
// This file includes safe SE365 enrichment for fixtures (best-effort, non-blocking).

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

const toRow = (f: ApiFootballFixture): FixtureListRow => {
  return {
    id: f.fixture.id,
    kickoffIso: new Date(f.fixture.date).toISOString(),

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
  if (apiKey) {
    headers["x-rapidapi-key"] = apiKey;
  }

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

const enrichOne = async (row: FixtureListRow): Promise<FixtureListRow> => {
  try {
    const { eventId, eventUrl } = await resolveSe365EventForFixture({
      fixtureId: row.id,
      homeName: row.homeName,
      awayName: row.awayName,
      kickoffIso: row.kickoffIso,
      leagueName: row.leagueName,
      leagueId: row.leagueId,
    });

    return {
      ...row,
      se365EventId: eventId ?? null,
      se365EventUrl: eventUrl ?? null,
    };
  } catch {
    return row;
  }
};

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
      } catch (e) {
        // mapper should handle errors, but keep safe
        out[cur] = items[cur] as any;
      }
    }
  });

  await Promise.all(workers);
  return out;
};

const safeGetResponseArray = (json: any): ApiFootballFixture[] => {
  const arr = json?.response;
  return Array.isArray(arr) ? (arr as ApiFootballFixture[]) : [];
};

export async function getFixtures(params: {
  leagueId: number;
  season: number;
  fromIso: string;
  toIso: string;
}): Promise<FixtureListRow[]> {
  const path = `/fixtures?league=${encodeURIComponent(String(params.leagueId))}&season=${encodeURIComponent(
    String(params.season)
  )}&from=${encodeURIComponent(params.fromIso.slice(0, 10))}&to=${encodeURIComponent(
    params.toIso.slice(0, 10)
  )}`;

  const json = await fetchJson(path);
  const fixtures = safeGetResponseArray(json);
  const rows = fixtures.map(toRow);

  // Enrich with SE365 - best effort, non-blocking, concurrency-limited
  return await pMap(rows, async (r) => await enrichOne(r), 6);
}

export async function getFixturesByRound(params: {
  leagueId: number;
  season: number;
  round: string;
}): Promise<FixtureListRow[]> {
  const path = `/fixtures?league=${encodeURIComponent(String(params.leagueId))}&season=${encodeURIComponent(
    String(params.season)
  )}&round=${encodeURIComponent(params.round)}`;

  const json = await fetchJson(path);
  const fixtures = safeGetResponseArray(json);
  const rows = fixtures.map(toRow);

  return await pMap(rows, async (r) => await enrichOne(r), 6);
}

export async function getFixtureById(fixtureId: number): Promise<FixtureListRow | null> {
  const path = `/fixtures?id=${encodeURIComponent(String(fixtureId))}`;
  const json = await fetchJson(path);
  const fixtures = safeGetResponseArray(json);
  const first = fixtures[0];
  if (!first) return null;

  const row = toRow(first);
  return await enrichOne(row);
}
