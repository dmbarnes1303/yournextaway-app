// src/constants/cityTeams.ts
/**
 * Canonical city <-> teams mapping
 *
 * IMPORTANT:
 * - We do NOT hand-write this list. It is derived from src/data/teams (your V1 team registry).
 * - City keys are normalized via normalizeCityKey() to match routes: /city/[cityKey]
 * - Team keys are the canonical teamKey used by: /team/[teamKey] and teamGuides registry.
 *
 * If a team has no city in the registry, it will not appear here.
 */

import { teams, type TeamRecord } from "@/src/data/teams";
import { normalizeCityKey } from "@/src/utils/city";

export type CityTeamsMap = Record<string, string[]>;

function uniqSorted(list: string[]): string[] {
  return Array.from(new Set(list.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function buildCityTeamsMapFromRegistry(registry: Record<string, TeamRecord>): CityTeamsMap {
  const map: CityTeamsMap = {};

  Object.values(registry).forEach((t) => {
    const city = String(t?.city ?? "").trim();
    if (!city) return;

    const cityKey = normalizeCityKey(city);
    if (!cityKey) return;

    const teamKey = String(t?.teamKey ?? "").trim();
    if (!teamKey) return;

    if (!map[cityKey]) map[cityKey] = [];
    map[cityKey].push(teamKey);
  });

  // de-dupe + sort for determinism
  Object.keys(map).forEach((k) => {
    map[k] = uniqSorted(map[k]);
  });

  return map;
}

/**
 * This is the canonical derived mapping.
 * It updates automatically as you edit src/data/teams.
 */
export const CITY_TEAMS: CityTeamsMap = buildCityTeamsMapFromRegistry(teams);

export default CITY_TEAMS;
