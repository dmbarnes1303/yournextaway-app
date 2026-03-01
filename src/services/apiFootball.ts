// src/services/apiFootball.ts
// API-Football client — secure Expo runtime key loading

import Constants from "expo-constants";

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

const API_BASE = "https://v3.football.api-sports.io";

/**
 * Expo runtime env resolver
 * Works in:
 * - local dev
 * - Expo Go
 * - APK
 * - EAS builds
 */
function getApiKey(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as any;

  const key =
    process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ||
    extra.EXPO_PUBLIC_API_FOOTBALL_KEY ||
    "";

  const cleaned = String(key).trim();

  if (!cleaned) {
    console.warn("[YNA] API-Football key missing");
  }

  return cleaned;
}

async function apiFetch<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(API_BASE + path);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.append(k, String(v));
      }
    });
  }

  const key = getApiKey();

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": key
    }
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API-Football ${res.status} — ${txt}`);
  }

  const json = await res.json();
  return json.response as T;
}

export async function getFixtures(params: FixturesParams): Promise<FixtureListRow[]> {
  const league = params.league ?? params.leagueId;
  const from = params.from ?? params.fromIso;
  const to = params.to ?? params.toIso;

  if (!league || !params.season) return [];

  const rows = await apiFetch<FixtureListRow[]>("/fixtures", {
    league,
    season: params.season,
    from,
    to
  });

  return Array.isArray(rows) ? rows : [];
}

export async function getFixtureById(id: number | string): Promise<FixtureListRow | null> {
  const rows = await apiFetch<any[]>("/fixtures", { id });
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
}

export async function getFixturesByRound(opts: {
  leagueId: number;
  season: number;
  round: string;
}): Promise<FixtureListRow[]> {
  if (!opts.leagueId || !opts.season || !opts.round) return [];

  const rows = await apiFetch<FixtureListRow[]>("/fixtures", {
    league: opts.leagueId,
    season: opts.season,
    round: opts.round
  });

  return rows;
}

export async function getCountries(): Promise<
  { name: string; code: string; flag: string }[]
> {
  const rows = await apiFetch<any[]>("/countries");

  return (rows || []).map((r) => ({
    name: r.name,
    code: r.code,
    flag: r.flag
  }));
}

export async function getTeams(opts: {
  leagueId: number;
  season: number;
}): Promise<{ id: number; name: string; logo?: string | null }[]> {
  if (!opts.leagueId || !opts.season) return [];

  const rows = await apiFetch<any[]>("/teams", {
    league: opts.leagueId,
    season: opts.season
  });

  return (rows || []).map((r) => ({
    id: r.team?.id,
    name: r.team?.name,
    logo: r.team?.logo ?? null
  }));
}
