// src/constants/search.ts

import { LEAGUES, type LeagueOption } from "@/src/constants/football";

/**
 * Search configuration (V1)
 *
 * Goals:
 * 1) Let users type countries like “Austria” and still find the relevant league (Austrian Bundesliga),
 *    even if they don’t know the league name.
 * 2) Provide a single, reusable mapping layer for Home search (and later any global search).
 *
 * Notes:
 * - This file is intentionally “data + tiny helpers”.
 * - Do NOT import React or app screens here.
 */

export type SearchCategory = "team" | "city" | "country" | "league" | "venue";

export type CountrySearchTarget = {
  category: "country";
  key: string; // normalized (e.g. "austria")
  label: string; // display label
  // Primary league the user likely expects when searching this country
  league?: { leagueId: number; season: number; label: string };
};

export type LeagueSearchTarget = {
  category: "league";
  key: string; // normalized (e.g. "austrian-bundesliga")
  label: string;
  leagueId: number;
  season: number;
  countryKey?: string; // optional for linking
};

export type SearchTarget = CountrySearchTarget | LeagueSearchTarget;

function norm(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function uniq<T>(arr: T[]): T[] {
  const out: T[] = [];
  const set = new Set<string>();
  for (const item of arr) {
    const k = JSON.stringify(item);
    if (set.has(k)) continue;
    set.add(k);
    out.push(item);
  }
  return out;
}

/**
 * Country -> “primary league users mean”.
 * This is the crucial “Austria” fix.
 *
 * Keep it lightweight in V1:
 * - Only countries you support (or that you want to map) need to be included.
 * - You can expand this without touching Home search logic.
 */
const COUNTRY_TO_PRIMARY_LEAGUE: Record<
  string,
  {
    label: string;
    leagueId: number;
    season?: number;
    leagueLabelOverride?: string;
    aliases?: string[];
  }
> = {
  england: {
    label: "England",
    leagueId: 39,
    aliases: ["uk", "u-k", "united-kingdom", "britain", "great-britain"],
  },
  spain: { label: "Spain", leagueId: 140 },
  italy: { label: "Italy", leagueId: 135 },
  germany: { label: "Germany", leagueId: 78 },
  france: { label: "France", leagueId: 61 },

  // IMPORTANT: requested example
  austria: {
    label: "Austria",
    leagueId: 218, // API-Football Austrian Bundesliga
    leagueLabelOverride: "Austrian Bundesliga",
    aliases: ["osterreich", "österreich"],
  },

  // Add more when you add more leagues in LEAGUES:
  // netherlands: { label: "Netherlands", leagueId: 88, aliases: ["holland"] },
  // portugal: { label: "Portugal", leagueId: 94 },
};

function getLeagueOptionById(leagueId: number): LeagueOption | null {
  const match = LEAGUES.find((l) => l.leagueId === leagueId);
  return match ?? null;
}

/**
 * Build league targets from:
 * - LEAGUES (your app’s “top leagues”), PLUS
 * - extra countries you want searchable even if they’re not in LEAGUES yet.
 *
 * This keeps Home search “powerful” even before you add a league to the UI chips.
 */
export const SEARCH_LEAGUE_TARGETS: LeagueSearchTarget[] = uniq(
  [
    // From LEAGUES
    ...LEAGUES.map((l) => ({
      category: "league" as const,
      key: norm(l.label),
      label: l.label,
      leagueId: l.leagueId,
      season: l.season,
    })),

    // From country mapping (ensures Austria works even if not in LEAGUES)
    ...Object.entries(COUNTRY_TO_PRIMARY_LEAGUE).map(([countryKey, cfg]) => {
      const opt = getLeagueOptionById(cfg.leagueId);
      return {
        category: "league" as const,
        key: norm(cfg.leagueLabelOverride ?? opt?.label ?? `${cfg.label} League`),
        label: cfg.leagueLabelOverride ?? opt?.label ?? `${cfg.label} League`,
        leagueId: cfg.leagueId,
        season: cfg.season ?? opt?.season ?? LEAGUES[0]?.season ?? 2025,
        countryKey,
      };
    }),
  ].filter(Boolean) as LeagueSearchTarget[]
);

/**
 * Country targets (what to show if a user types “Austria”).
 */
export const SEARCH_COUNTRY_TARGETS: CountrySearchTarget[] = Object.entries(COUNTRY_TO_PRIMARY_LEAGUE).map(
  ([countryKey, cfg]) => {
    const opt = getLeagueOptionById(cfg.leagueId);
    return {
      category: "country" as const,
      key: countryKey,
      label: cfg.label,
      league: {
        leagueId: cfg.leagueId,
        season: cfg.season ?? opt?.season ?? LEAGUES[0]?.season ?? 2025,
        label: cfg.leagueLabelOverride ?? opt?.label ?? `${cfg.label} League`,
      },
    };
  }
);

/**
 * Aliases for country search (Austria, Österreich, Osterreich, etc.)
 * Returns a normalized country key (e.g. "austria") if matched.
 */
export function resolveCountryKey(input: string): string | null {
  const q = norm(input);
  if (!q) return null;

  // Exact key
  if (COUNTRY_TO_PRIMARY_LEAGUE[q]) return q;

  // Match aliases
  for (const [countryKey, cfg] of Object.entries(COUNTRY_TO_PRIMARY_LEAGUE)) {
    const aliases = (cfg.aliases ?? []).map((a) => norm(a));
    if (aliases.includes(q)) return countryKey;
  }

  return null;
}

/**
 * Search helper used by Home search.
 * This only searches “static targets” (countries/leagues).
 *
 * Team/city/venue searching will be done dynamically on Home using:
 * - fixtures rows (team/venue/city strings)
 * - city guide registry (city names)
 * - team guide registry (team slugs) later
 */
export function searchStaticTargets(input: string, limit = 8): SearchTarget[] {
  const q = norm(input);
  if (!q) return [];

  const hits: SearchTarget[] = [];

  // Countries first (because user intent is often “type country”)
  for (const c of SEARCH_COUNTRY_TARGETS) {
    if (c.key.includes(q) || norm(c.label).includes(q)) hits.push(c);
    const cfg = COUNTRY_TO_PRIMARY_LEAGUE[c.key];
    const aliases = (cfg?.aliases ?? []).map((a) => norm(a));
    if (aliases.some((a) => a.includes(q) || q.includes(a))) hits.push(c);
  }

  // Leagues next
  for (const l of SEARCH_LEAGUE_TARGETS) {
    if (l.key.includes(q) || norm(l.label).includes(q)) hits.push(l);
  }

  // De-dupe by category+key
  const seen = new Set<string>();
  const deduped: SearchTarget[] = [];
  for (const h of hits) {
    const k = `${h.category}:${h.key}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(h);
  }

  return deduped.slice(0, limit);
}
