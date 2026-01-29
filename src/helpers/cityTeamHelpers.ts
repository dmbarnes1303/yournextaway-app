// src/helpers/cityTeamHelpers.ts
import CITY_TEAMS from "@/src/constants/cityTeams";
import { teams as teamsRegistry, normalizeTeamKey, type TeamRecord } from "@/src/data/teams";
import { normalizeCityKey } from "@/src/utils/city";

export type CityTeamSummary = {
  teamKey: string;
  name: string;
  city?: string;
  country?: string;
  stadium?: string;
  leagueId?: number;
};

function toSummary(t: TeamRecord): CityTeamSummary {
  return {
    teamKey: t.teamKey,
    name: t.name,
    city: t.city,
    country: t.country,
    stadium: (t as any)?.stadium, // only if you later add it to TeamRecord
    leagueId: t.leagueId,
  };
}

/**
 * Get teams that belong to a city (normalized cityKey).
 * Returns full summaries pulled from the teams registry.
 */
export function getTeamsForCity(cityInput: string): CityTeamSummary[] {
  const cityKey = normalizeCityKey(cityInput);
  if (!cityKey) return [];

  const teamKeys = CITY_TEAMS[cityKey] ?? [];
  if (teamKeys.length === 0) return [];

  const out: CityTeamSummary[] = [];

  for (const key of teamKeys) {
    const norm = normalizeTeamKey(key);
    const rec = (teamsRegistry as any)?.[norm] as TeamRecord | undefined;
    if (!rec) continue;
    out.push(toSummary(rec));
  }

  // stable sort
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/**
 * Get the cityKey for a team.
 * Uses the teams registry (authoritative).
 */
export function getCityKeyForTeam(teamInput: string): string | null {
  const norm = normalizeTeamKey(teamInput);
  const rec = (teamsRegistry as any)?.[norm] as TeamRecord | undefined;
  if (!rec?.city) return null;

  const cityKey = normalizeCityKey(rec.city);
  return cityKey || null;
}

/**
 * Get city display name (from the team registry).
 */
export function getCityNameForTeam(teamInput: string): string | null {
  const norm = normalizeTeamKey(teamInput);
  const rec = (teamsRegistry as any)?.[norm] as TeamRecord | undefined;
  const city = String(rec?.city ?? "").trim();
  return city ? city : null;
}

/**
 * Reverse lookup: get all teams in the same city as the provided team.
 * Useful for “also in this city” suggestions on team pages.
 */
export function getTeamsInSameCityAsTeam(teamInput: string): CityTeamSummary[] {
  const norm = normalizeTeamKey(teamInput);
  const rec = (teamsRegistry as any)?.[norm] as TeamRecord | undefined;
  if (!rec?.city) return [];

  return getTeamsForCity(rec.city).filter((t) => normalizeTeamKey(t.teamKey) !== norm);
}
