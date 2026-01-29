// src/constants/cityTeams.ts
import { teams, type TeamRecord } from "@/src/data/teams";
import { normalizeCityKey } from "@/src/utils/city";

/**
 * Canonical city <-> teams mapping.
 *
 * IMPORTANT:
 * - This map is derived from src/data/teams (single source of truth).
 * - City keys MUST match your routing normalization (normalizeCityKey).
 * - Team keys come directly from TeamRecord.teamKey.
 *
 * This avoids manual lists that drift and break links.
 */

export type CityTeamsMap = Record<string, string[]>;

function stableSort(arr: string[]) {
  return arr.slice().sort((a, b) => a.localeCompare(b));
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

/**
 * Optional city aliases to collapse different labels onto one city key.
 * Keep this SMALL and only add when you see real-world mismatches.
 *
 * Example use-case:
 * - A team uses "Newcastle upon Tyne" but your guide key is "newcastle"
 *
 * If normalizeCityKey already produces what you want, you don't need this.
 */
const CITY_KEY_OVERRIDES: Record<string, string> = {
  // "newcastle-upon-tyne": "newcastle",
  // "san-sebastian": "san-sebastian", // (example)
};

function cityKeyFromTeam(t: TeamRecord): string | null {
  const rawCity = String(t.city ?? "").trim();
  if (!rawCity) return null;

  const norm = normalizeCityKey(rawCity);
  if (!norm) return null;

  return CITY_KEY_OVERRIDES[norm] ?? norm;
}

/**
 * Build the full City -> Teams map from the team registry.
 * Deterministic and safe to run at import time.
 */
export function buildCityTeamsMap(): CityTeamsMap {
  const map: CityTeamsMap = {};

  Object.values(teams).forEach((t) => {
    const cityKey = cityKeyFromTeam(t);
    if (!cityKey) return;

    const teamKey = String(t.teamKey ?? "").trim();
    if (!teamKey) return;

    if (!map[cityKey]) map[cityKey] = [];
    map[cityKey].push(teamKey);
  });

  // De-dupe + stable sort per city
  Object.keys(map).forEach((cityKey) => {
    map[cityKey] = stableSort(uniq(map[cityKey]));
  });

  return map;
}

/**
 * Canonical export used across the app.
 */
export const CITY_TEAMS: CityTeamsMap = buildCityTeamsMap();

/**
 * Convenience: sorted list of city keys that have at least one team.
 */
export const CITY_KEYS_WITH_TEAMS: string[] = stableSort(Object.keys(CITY_TEAMS));

/**
 * Debug helpers (optional but useful in dev).
 */
export function getCityTeamsDebugSnapshot() {
  const cityCount = CITY_KEYS_WITH_TEAMS.length;

  let teamCount = 0;
  Object.values(CITY_TEAMS).forEach((list) => (teamCount += list.length));

  // Cities with the most teams (top 10)
  const topCities = Object.entries(CITY_TEAMS)
    .map(([cityKey, list]) => ({ cityKey, count: list.length }))
    .sort((a, b) => b.count - a.count || a.cityKey.localeCompare(b.cityKey))
    .slice(0, 10);

  // Teams missing city
  const missingCity = Object.values(teams)
    .filter((t) => !String(t.city ?? "").trim())
    .map((t) => ({ teamKey: t.teamKey, name: t.name }))
    .slice(0, 50);

  return {
    cityCount,
    teamCount,
    topCities,
    missingCityCount: missingCity.length,
    missingCitySample: missingCity,
  };
}
