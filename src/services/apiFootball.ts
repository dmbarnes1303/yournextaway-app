// src/services/apiFootball.ts
// API-Football client — returns RAW API rows (fixture/league/teams/goals/score)
// Compatible with existing UI expectations across Fixtures, Match, Follow, etc.

import Constants from "expo-constants";

export type FixtureListRow = {
  fixture: {
    id: number;
    date: string | null;
    status?: { short?: string | null };
    venue?: { name?: string | null; city?: string | null };
  };
  league: {
    id: number;
    name?: string | null;
    season?: number | null;
    round?: string | null;
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

function cleanKey(v: unknown): string {
  const s = String(v ?? "").trim();
  return s;
}

/**
 * Expo env rules:
 * - Use EXPO_PUBLIC_* for values available at runtime.
 * - process.env.EXPO_PUBLIC_* is available (after restart with -c).
 * - Constants.expoConfig.extra is only available if you wire it in app.config/app.json.
 */
function getApiKey(): string {
  const fromExtra =
    (Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_API_FOOTBALL_KEY ??
    (Constants.expoConfig?.extra as any)?.API_FOOTBALL_KEY;

  const fromEnv =
    process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ??
    process.env.API_FOOTBALL_KEY;

  const key = cleanKey(fromExtra ?? fromEnv);

  if (!key) {
    console.warn("[YNA] API-Football key missing (expected EXPO_PUBLIC_API_FOOTBALL_KEY)");
  }

  return key;
}

async function apiFetch<T>(path: string, params?: Record<string, any>): Promise<T> {
  const key = getApiKey();
  if (!key) return [] as unknown as T; // fail soft for UI (prevents endless throws)

  const url = new URL(API_BASE + path);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.append(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": key,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API-Football ${res.status}${body ? ` — ${body.slice(0, 140)}` : ""}`);
  }

  const json = await res.json();
  return (json?.response ?? []) as T;
}

/**
 * Get fixtures list
 * Accepts both:
 *  - { league, season, from, to }
 *  - { leagueId, season, fromIso, toIso }
 */
export async function getFixtures(params: FixturesParams): Promise<FixtureListRow[]> {
  const league = params.league ?? params.leagueId;
  const from = params.from ?? params.fromIso;
  const to = params.to ?? params.toIso;

  if (!league || !params.season) return [];

  const rows = await apiFetch<FixtureListRow[]>("/fixtures", {
    league,
    season: params.season,
    from,
    to,
  });

  return Array.isArray(rows) ? rows : [];
}

/**
 * Fixtures by round
 */
export async function getFixturesByRound(opts: {
  leagueId: number;
  season: number;
  round: string;
}): Promise<FixtureListRow[]> {
  if (!opts.leagueId || !opts.season || !opts.round) return [];

  const rows = await apiFetch<FixtureListRow[]>("/fixtures", {
    league: opts.leagueId,
    season: opts.season,
    round: opts.round,
  });

  return Array.isArray(rows) ? rows : [];
}

/**
 * Countries list
 */
export async function getCountries(): Promise<{ name: string; code: string; flag: string }[]> {
  const rows = await apiFetch<any[]>("/countries");
  const arr = Array.isArray(rows) ? rows : [];

  return arr.map((r) => ({
    name: r?.name,
    code: r?.code,
    flag: r?.flag,
  }));
}

/**
 * Teams in league+season
 */
export async function getTeams(opts: { leagueId: number; season: number }): Promise<{ id: number; name: string; logo?: string | null }[]> {
  if (!opts.leagueId || !opts.season) return [];

  const rows = await apiFetch<any[]>("/teams", {
    league: opts.leagueId,
    season: opts.season,
  });

  const arr = Array.isArray(rows) ? rows : [];

  return arr.map((r) => ({
    id: r?.team?.id,
    name: r?.team?.name,
    logo: r?.team?.logo ?? null,
  }));
}
