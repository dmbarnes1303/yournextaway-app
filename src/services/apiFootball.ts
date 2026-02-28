// src/services/apiFootball.ts
// API-Football client — returns RAW API rows (fixture/league/teams/goals/score)
// Matches UI usage in Fixtures + kickoffTbc + followStore.

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

function getApiKey(): string {
  // Prefer Expo public env var (works with .env + EAS)
  const envKey = (process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ?? "").trim();

  // Fallback: app config extra (only if you inject it)
  const extraKey = String((Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_API_FOOTBALL_KEY ?? "").trim();

  const key = envKey || extraKey;

  if (!key) console.warn("[YNA] API-Football key missing (EXPO_PUBLIC_API_FOOTBALL_KEY)");
  return key;
}

async function apiFetch<T>(path: string, params?: Record<string, any>): Promise<T> {
  const key = getApiKey();
  if (!key) throw new Error("API-Football key missing");

  const url = new URL(API_BASE + path);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.append(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": key,
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    // API-Football often returns useful error payloads on 4xx
    const payload = json ? JSON.stringify(json) : text;
    throw new Error(`API-Football ${res.status} — ${payload}`);
  }

  // API-Football shape: { response: [...] }
  const response = json?.response;
  return response as T;
}

/**
 * Get fixtures list
 * Accepts both:
 *  - { league, season, from, to }
 *  - { leagueId, season, fromIso, toIso }
 */
export async function getFixtures(params: FixturesParams): Promise<FixtureListRow[]> {
  const league = params.league ?? params.leagueId;
  const season = params.season;
  const from = params.from ?? params.fromIso;
  const to = params.to ?? params.toIso;

  if (!league || !season) return [];

  const rows = await apiFetch<FixtureListRow[]>("/fixtures", {
    league,
    season,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  });

  return Array.isArray(rows) ? rows : [];
}

/**
 * Get a single fixture by id
 */
export async function getFixtureById(id: string | number): Promise<FixtureListRow | null> {
  const fid = String(id ?? "").trim();
  if (!fid) return null;

  const rows = await apiFetch<FixtureListRow[]>("/fixtures", { id: fid });
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0] ?? null;
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
  if (!Array.isArray(rows)) return [];

  return rows.map((r) => ({
    name: r?.name ?? "",
    code: r?.code ?? "",
    flag: r?.flag ?? "",
  }));
}

/**
 * Teams in league+season
 */
export async function getTeams(opts: {
  leagueId: number;
  season: number;
}): Promise<{ id: number; name: string; logo?: string | null }[]> {
  if (!opts.leagueId || !opts.season) return [];

  const rows = await apiFetch<any[]>("/teams", {
    league: opts.leagueId,
    season: opts.season,
  });

  if (!Array.isArray(rows)) return [];

  return rows
    .map((r) => ({
      id: Number(r?.team?.id ?? 0),
      name: String(r?.team?.name ?? "").trim(),
      logo: r?.team?.logo ?? null,
    }))
    .filter((t) => Number.isFinite(t.id) && t.id > 0 && !!t.name);
}
