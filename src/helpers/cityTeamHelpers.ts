// src/helpers/cityTeamHelpers.ts
import { getTeamKeysForCity } from "@/src/constants/cityTeams";
import { teams, type TeamRecord } from "@/src/data/teams";
import { getCityGuide, cityGuides } from "@/src/data/cityGuides";
import { normalizeCityKey } from "@/src/utils/city";

export type CityTeamLink = {
  teamKey: string;
  name: string;
  country?: string;
  city?: string;
  stadium?: string;
  leagueId?: number;
};

function byName(a: CityTeamLink, b: CityTeamLink) {
  return a.name.localeCompare(b.name);
}

export function getTeamsForCity(cityInput: string): CityTeamLink[] {
  const cityKey = normalizeCityKey(cityInput);
  if (!cityKey) return [];

  const keys = getTeamKeysForCity(cityKey);
  if (keys.length === 0) return [];

  return keys
    .map((teamKey) => {
      const rec = teams[teamKey];
      if (!rec) return null;
      const t: TeamRecord = rec;

      return {
        teamKey: t.teamKey,
        name: t.name,
        country: t.country,
        city: t.city,
        stadium: t.stadium, // may be undefined (fine)
        leagueId: t.leagueId,
      } as CityTeamLink;
    })
    .filter(Boolean) as CityTeamLink[];
}

/**
 * Reverse lookup: what cityKey should we link to from a team?
 * Preference order:
 * 1) If city guide exists for team.city -> use that normalized key
 * 2) else: fallback to normalized team.city (even if guide missing)
 */
export function getCityKeyForTeam(teamKey: string): string | null {
  const t = teams[teamKey];
  if (!t?.city) return null;

  const candidate = normalizeCityKey(t.city);
  if (!candidate) return null;

  // If there is a guide for this city, use it
  const guide = getCityGuide(candidate);
  if (guide) return candidate;

  // If any guide matches by name normalization, accept that too
  if (cityGuides[candidate]) return candidate;

  return candidate; // fallback key (may show "coming soon" on city screen)
}

/**
 * Useful for rendering "Other clubs in this city" on Team screen.
 */
export function getSiblingTeams(teamKey: string): CityTeamLink[] {
  const t = teams[teamKey];
  if (!t?.city) return [];

  const cityTeams = getTeamsForCity(t.city);
  return cityTeams.filter((x) => x.teamKey !== teamKey).sort(byName);
}
