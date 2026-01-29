// src/helpers/cityTeamHelpers.ts
import { CITY_TEAMS } from "@/src/constants/cityTeams";
import { normalizeCityKey } from "@/src/utils/city";
import { normalizeTeamKey } from "@/src/data/teamGuides";
import { getCityGuide } from "@/src/data/cityGuides";
import { getTeamGuide } from "@/src/data/teamGuides";
import { teams as teamsRegistry } from "@/src/data/teams";

export type CitySummary = {
  cityKey: string;
  name: string;
  country?: string;
};

export type TeamSummary = {
  teamKey: string;
  name: string;
  cityKey?: string | null;
  cityName?: string | null;
  country?: string | null;
  stadium?: string | null;
};

function titleCaseFromKey(key: string) {
  return String(key ?? "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getCitySummary(cityKeyRaw: string): CitySummary | null {
  const cityKey = normalizeCityKey(cityKeyRaw);
  if (!cityKey) return null;

  const g = getCityGuide(cityKey);
  return {
    cityKey,
    name: g?.name ?? titleCaseFromKey(cityKey),
    country: g?.country,
  };
}

export function getTeamSummary(teamKeyRaw: string): TeamSummary | null {
  const teamKey = normalizeTeamKey(teamKeyRaw);
  if (!teamKey) return null;

  const guide: any = getTeamGuide(teamKey) ?? null;
  const reg: any = (teamsRegistry as any)?.[teamKey] ?? null;

  const name =
    guide?.name ??
    reg?.name ??
    titleCaseFromKey(teamKey);

  const cityName: string | null =
    (typeof guide?.city === "string" && guide.city.trim()) ? guide.city.trim() :
    (typeof reg?.city === "string" && reg.city.trim()) ? reg.city.trim() :
    null;

  const cityKeyFromGuide: string | null =
    (typeof guide?.cityKey === "string" && guide.cityKey.trim()) ? normalizeCityKey(guide.cityKey) :
    cityName ? normalizeCityKey(cityName) :
    null;

  const country: string | null =
    (typeof guide?.country === "string" && guide.country.trim()) ? guide.country.trim() :
    (typeof reg?.country === "string" && reg.country.trim()) ? reg.country.trim() :
    null;

  const stadium: string | null =
    (typeof guide?.stadium === "string" && guide.stadium.trim()) ? guide.stadium.trim() :
    (typeof reg?.stadium === "string" && reg.stadium.trim()) ? reg.stadium.trim() :
    null;

  return {
    teamKey,
    name,
    cityKey: cityKeyFromGuide,
    cityName,
    country,
    stadium,
  };
}

/**
 * Returns teams for a city, based on CITY_TEAMS mapping.
 * Unknown teams are filtered out safely.
 */
export function getTeamsForCity(cityKeyRaw: string): TeamSummary[] {
  const cityKey = normalizeCityKey(cityKeyRaw);
  if (!cityKey) return [];

  const keys = CITY_TEAMS[cityKey] ?? [];
  const unique = Array.from(new Set(keys.map((k) => normalizeTeamKey(k)).filter(Boolean)));

  const out: TeamSummary[] = [];
  for (const k of unique) {
    const t = getTeamSummary(k);
    if (t) out.push(t);
  }

  // Sort by display name
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/**
 * Finds city for a team:
 * - First checks guide.cityKey / guide.city
 * - Then checks CITY_TEAMS reverse mapping
 */
export function getCityForTeam(teamKeyRaw: string): CitySummary | null {
  const teamKey = normalizeTeamKey(teamKeyRaw);
  if (!teamKey) return null;

  const team = getTeamSummary(teamKey);
  const fromGuide = team?.cityKey ? getCitySummary(team.cityKey) : null;
  if (fromGuide) return fromGuide;

  // Reverse mapping fallback
  for (const [cityKey, teamKeys] of Object.entries(CITY_TEAMS)) {
    const hits = (teamKeys ?? []).some((k) => normalizeTeamKey(k) === teamKey);
    if (hits) return getCitySummary(cityKey);
  }

  return null;
}

/**
 * Convenience: other clubs in same city (excluding this team).
 */
export function getOtherTeamsInSameCity(teamKeyRaw: string): TeamSummary[] {
  const teamKey = normalizeTeamKey(teamKeyRaw);
  if (!teamKey) return [];

  const city = getCityForTeam(teamKey);
  if (!city?.cityKey) return [];

  const all = getTeamsForCity(city.cityKey);
  return all.filter((t) => t.teamKey !== teamKey);
  }
