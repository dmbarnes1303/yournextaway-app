// src/services/apiFootball.ts
// API-Football (API-Sports) client — returns RAW API rows (fixture/league/teams/goals/score)
// Key point: In Expo/EAS builds, use process.env.EXPO_PUBLIC_* (inlined at build time).
// Do NOT rely on app.json "extra" interpolation for secrets.

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

  // support both naming styles used in the app
  from?: string;
  to?: string;
  fromIso?: string;
  toIso?: string;
};

const API_BASE = "https://v3.football.api-sports.io";

// Set to true temporarily if you want logs in dev builds.
// Keep false for normal use.
const DEBUG = false;

function isPlaceholder(v: string) {
  // Catches literal strings like "${EXPO_PUBLIC_API_FOOTBALL_KEY}"
  return v.includes("${") || v.includes("EXPO_PUBLIC_") || v.includes("API_FOOTBALL");
}

function getApiKey(): string {
  const raw = (process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ?? "").trim();

  if (!raw) {
    if (DEBUG) console.warn("[YNA] API-Football key missing (EXPO_PUBLIC_API_FOOTBALL_KEY)");
    return "";
  }

  if (isPlaceholder(raw)) {
    if (DEBUG)
      console.warn(
        `[YNA] API-Football key looks like a placeholder ("${raw}"). Fix EAS env vars / app config.`
      );
    return "";
  }

  if (DEBUG) console.log("[YNA] API-Football key length:", raw.length);
  return raw;
}

async function apiFetch<TResponseRows>(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>
): Promise<TResponseRows> {
  const url = new URL(API_BASE + path);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.append(k, String(v));
    }
  }

  const key = getApiKey();
  if (!key) {
    throw new Error(
      "API-Football key missing at runtime. Set EXPO_PUBLIC_API_FOOTBALL_KEY in EAS Environment Variables and rebuild."
    );
  }

  const res = await fetch(url.toString(), {
    headers: {
      // Correct API-Sports header:
      "x-apisports-key": key,
    },
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    // Give you maximum signal without crashing the app with huge logs.
    const snippet = text ? text.slice(0, 600) : "";
    throw new Error(`API-Football ${res.status} — ${snippet || "Request failed"}`);
  }

  // API-Sports responses are JSON with { response: [...] }
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("API-Football returned non-JSON response.");
  }

  return json?.response as TResponseRows;
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
    from,
    to,
  });

  return Array.isArray(rows) ? rows : [];
}

/**
 * Fixture by id
 */
export async function getFixtureById(id: number | string): Promise<FixtureListRow | null> {
  if (!id) return null;

  const rows = await apiFetch<any[]>("/fixtures", { id });
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0] as FixtureListRow;
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

  return (rows || []).map((r) => ({
    name: r?.name,
    code: r?.code,
    flag: r?.flag,
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

  return (rows || [])
    .map((r) => ({
      id: r?.team?.id,
      name: r?.team?.name,
      logo: r?.team?.logo ?? null,
    }))
    .filter((t) => typeof t.id === "number" && !!t.name);
}
