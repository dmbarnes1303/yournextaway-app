// src/helpers/cityTeamHelpers.ts
import { CITY_TEAMS, CITY_KEYS_WITH_TEAMS } from "@/src/constants/cityTeams";
import { normalizeCityKey } from "@/src/utils/city";

import { getCityGuide } from "@/src/data/cityGuides";
import teamsRegistry, { teams, type TeamRecord, normalizeTeamKey } from "@/src/data/teams";

import { getTeamGuide } from "@/src/data/teamGuides";
import type { TeamGuide } from "@/src/data/teamGuides/types";

export type CitySummary = {
  cityKey: string;
  name: string;
  country?: string;
  hasGuide: boolean;
};

export type TeamSummary = {
  teamKey: string;
  name: string;
  country?: string;
  city?: string;
  cityKey?: string | null;
  stadium?: string | null;
  hasGuide: boolean;
};

function titleFromKey(key: string): string {
  return String(key ?? "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function safeTrim(x: unknown): string | null {
  const s = typeof x === "string" ? x.trim() : "";
  return s ? s : null;
}

/**
 * City summary from a cityKey (normalized).
 * Uses city guide if present for proper name/country.
 */
export function getCitySummary(cityInput: string): CitySummary | null {
  const cityKey = normalizeCityKey(cityInput);
  if (!cityKey) return null;

  const guide = getCityGuide(cityKey);
  return {
    cityKey,
    name: guide?.name ?? titleFromKey(cityKey),
    country: guide?.country,
    hasGuide: !!guide,
  };
}

/**
 * Team summary from a teamKey (normalized).
 * Pulls from teams registry first, then team guide if needed.
 */
export function getTeamSummary(teamInput: string): TeamSummary | null {
  const teamKey = normalizeTeamKey(teamInput);
  if (!teamKey) return null;

  // registry keyed by canonical keys; prefer that
  const reg: TeamRecord | null = (teams as any)?.[teamKey] ?? (teamsRegistry as any)?.[teamKey] ?? null;

  // guide keyed by teamKey too
  const guide: TeamGuide | null = getTeamGuide(teamKey) ?? null;

  const name = reg?.name ?? guide?.name ?? titleFromKey(teamKey);

  const country = reg?.country ?? guide?.country ?? undefined;
  const city = reg?.city ?? guide?.city ?? undefined;

  // Prefer cityKey if present on guide; otherwise derive from city string.
  const cityKey =
    safeTrim((guide as any)?.cityKey) ? normalizeCityKey(String((guide as any).cityKey)) :
    city ? normalizeCityKey(city) :
    null;

  const stadium = safeTrim(reg?.stadium) ?? safeTrim(guide?.stadium) ?? null;

  return {
    teamKey,
    name,
    country,
    city,
    cityKey,
    stadium,
    hasGuide: !!guide,
  };
}

/**
 * Returns team summaries for a city (from CITY_TEAMS map).
 * This is the main entry point for City -> Teams linking.
 */
export function getTeamsForCity(cityInput: string): TeamSummary[] {
  const cityKey = normalizeCityKey(cityInput);
  if (!cityKey) return [];

  const teamKeys = CITY_TEAMS[cityKey] ?? [];
  if (!teamKeys.length) return [];

  const unique = Array.from(new Set(teamKeys.map((k) => normalizeTeamKey(k)).filter(Boolean)));

  const out: TeamSummary[] = [];
  for (const k of unique) {
    const t = getTeamSummary(k);
    if (t) out.push(t);
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/**
 * Reverse lookup: find city for a team.
 *
 * Priority:
 * 1) team guide cityKey (or derived cityKey from city string)
 * 2) CITY_TEAMS reverse scan
 */
export function getCityForTeam(teamInput: string): CitySummary | null {
  const teamKey = normalizeTeamKey(teamInput);
  if (!teamKey) return null;

  const team = getTeamSummary(teamKey);
  if (team?.cityKey) {
    const c = getCitySummary(team.cityKey);
    if (c) return c;
  }

  for (const cityKey of CITY_KEYS_WITH_TEAMS) {
    const list = CITY_TEAMS[cityKey] ?? [];
    const hit = list.some((k) => normalizeTeamKey(k) === teamKey);
    if (hit) return getCitySummary(cityKey);
  }

  return null;
}

/**
 * Convenience: other teams in same city as this team.
 */
export function getOtherTeamsInSameCity(teamInput: string): TeamSummary[] {
  const teamKey = normalizeTeamKey(teamInput);
  if (!teamKey) return [];

  const city = getCityForTeam(teamKey);
  if (!city?.cityKey) return [];

  return getTeamsForCity(city.cityKey).filter((t) => t.teamKey !== teamKey);
}

/**
 * Debug snapshot (optional).
 */
export function getCityTeamHelpersDebugSnapshot() {
  const cities = CITY_KEYS_WITH_TEAMS;
  let teamsTotal = 0;
  for (const k of cities) teamsTotal += (CITY_TEAMS[k]?.length ?? 0);

  const citiesWithNoGuides = cities
    .map((cityKey) => ({ cityKey, hasGuide: !!getCityGuide(cityKey) }))
    .filter((x) => !x.hasGuide)
    .slice(0, 50);

  return {
    citiesCount: cities.length,
    teamsTotal,
    citiesWithNoGuidesCount: citiesWithNoGuides.length,
    citiesWithNoGuidesSample: citiesWithNoGuides,
  };
}
