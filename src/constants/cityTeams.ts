// src/constants/cityTeams.ts
import { teams, type TeamRecord } from "@/src/data/teams";
import { normalizeCityKey } from "@/src/utils/city";

/**
 * Canonical city <-> teams mapping.
 *
 * We generate this from the Team Registry so you don't maintain the same truth twice.
 * This becomes the single source of truth for cross-linking city guides <-> team guides.
 *
 * Keys: normalized city keys used by city routes (e.g. "munich", "manchester").
 * Values: normalized team keys used by /team/[teamKey] and teamGuides registry.
 */

export type CityTeamsMap = Record<string, string[]>;

/**
 * City key overrides for known "non-obvious" cases.
 * (Example: team.city may be "Newcastle upon Tyne" but your city guide key might be "newcastle".)
 *
 * Left side = normalizeCityKey(team.city)
 * Right side = city guide key you want to use
 */
const CITY_KEY_OVERRIDES: Record<string, string> = {
  // Common variants / simplifications
  "newcastle-upon-tyne": "newcastle",
  "monchengladbach": "monchengladbach",
  "vitoria-gasteiz": "vitoria-gasteiz",
  "san-sebastian": "san-sebastian",

  // You can add more as you notice mismatches between team.city and city guide keys.
};

function applyCityOverride(cityKey: string): string {
  const k = String(cityKey ?? "").trim();
  if (!k) return "";
  return CITY_KEY_OVERRIDES[k] ?? k;
}

function uniqSorted(list: string[]): string[] {
  return Array.from(new Set(list.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function buildCityTeamsMapFromRegistry(): CityTeamsMap {
  const out: Record<string, string[]> = {};

  Object.values(teams).forEach((t: TeamRecord) => {
    const rawCity = String(t.city ?? "").trim();
    if (!rawCity) return;

    const base = normalizeCityKey(rawCity);
    if (!base) return;

    const cityKey = applyCityOverride(base);
    if (!cityKey) return;

    const teamKey = String(t.teamKey ?? "").trim();
    if (!teamKey) return;

    if (!out[cityKey]) out[cityKey] = [];
    out[cityKey].push(teamKey);
  });

  // Final clean + deterministic sort
  Object.keys(out).forEach((k) => {
    out[k] = uniqSorted(out[k]);
  });

  return out;
}

/**
 * Generated mapping (single source of truth).
 */
export const CITY_TEAMS: CityTeamsMap = buildCityTeamsMapFromRegistry();

/**
 * Convenience: teams for cityKey (normalized).
 */
export function getTeamKeysForCity(cityInput: string): string[] {
  const key = applyCityOverride(normalizeCityKey(cityInput));
  return CITY_TEAMS[key] ?? [];
}

export default CITY_TEAMS;
