// src/data/leagues/index.ts

import {
  LEAGUES,
  FEATURED_LEAGUES,
  HOME_LEAGUES,
  BROWSEABLE_LEAGUES,
  FOOTBALL_BY_COUNTRY,
  getLeagueById as getLeagueOptionById,
  getLeagueBySlug as getLeagueOptionBySlug,
  getCountryFootballConfig,
  type LeagueOption,
  type LeagueBrowseRegion,
  type CountryFootballConfig,
} from "@/src/constants/football";

export type League = {
  /**
   * Stable internal slug used across routes / lookups.
   * Example: "premier-league", "eliteserien"
   */
  id: string;

  /**
   * Display label.
   */
  name: string;

  /**
   * Country display name.
   */
  country: string;

  /**
   * Country code / flag code used by UI.
   */
  countryCode: string;

  /**
   * API-Football league id.
   */
  leagueId: number;

  /**
   * Current season context.
   */
  season: number;

  /**
   * League logo URL.
   */
  logo: string;

  /**
   * Region bucket for browse UI.
   */
  browseRegion: LeagueBrowseRegion | null;

  /**
   * Home / featured surfacing flags.
   */
  featured: boolean;
  homeVisible: boolean;

  /**
   * Canonical featured club keys for league cards / promos.
   */
  featuredClubKeys: string[];
};

function toLeague(option: LeagueOption): League {
  return {
    id: option.slug,
    name: option.label,
    country: option.country,
    countryCode: option.countryCode,
    leagueId: option.leagueId,
    season: option.season,
    logo: option.logo,
    browseRegion: option.browseRegion,
    featured: option.featured,
    homeVisible: option.homeVisible,
    featuredClubKeys: Array.isArray(option.featuredClubKeys)
      ? [...option.featuredClubKeys]
      : [],
  };
}

export const leagues: League[] = LEAGUES.map(toLeague);

export const featuredLeagues: League[] = FEATURED_LEAGUES.map(toLeague);
export const homeLeagues: League[] = HOME_LEAGUES.map(toLeague);
export const browseableLeagues: League[] = BROWSEABLE_LEAGUES.map(toLeague);

export function getLeagueById(leagueId: number): League | null {
  const found = getLeagueOptionById(leagueId);
  return found ? toLeague(found) : null;
}

export function getLeagueBySlug(slug: string): League | null {
  const found = getLeagueOptionBySlug(slug);
  return found ? toLeague(found) : null;
}

export function getLeaguesByCountry(country: string): League[] {
  const value = String(country ?? "").trim().toLowerCase();
  if (!value) return [];

  return leagues.filter(
    (league) => String(league.country ?? "").trim().toLowerCase() === value
  );
}

export function getLeaguesByCountryCode(countryCode: string): League[] {
  const value = String(countryCode ?? "").trim().toLowerCase();
  if (!value) return [];

  return leagues.filter(
    (league) => String(league.countryCode ?? "").trim().toLowerCase() === value
  );
}

export function getLeaguesByBrowseRegion(region: LeagueBrowseRegion): League[] {
  return leagues.filter((league) => league.browseRegion === region);
}

export function hasLeagueBySlug(slug: string): boolean {
  return !!getLeagueBySlug(slug);
}

export function hasLeagueById(leagueId: number): boolean {
  return !!getLeagueById(leagueId);
}

export function getAllLeagues(): League[] {
  return [...leagues];
}

export function getAllCountryFootballConfigs(): Record<string, CountryFootballConfig> {
  return FOOTBALL_BY_COUNTRY;
}

export function getCountryConfig(countryKey: string): CountryFootballConfig | null {
  return getCountryFootballConfig(countryKey);
}

export function getLeaguesDebugSnapshot() {
  return {
    count: leagues.length,
    featuredCount: featuredLeagues.length,
    homeVisibleCount: homeLeagues.length,
    browseableCount: browseableLeagues.length,
    countriesCount: Object.keys(FOOTBALL_BY_COUNTRY).length,
    leagues: leagues.map((league) => ({
      id: league.id,
      name: league.name,
      country: league.country,
      countryCode: league.countryCode,
      leagueId: league.leagueId,
      season: league.season,
      browseRegion: league.browseRegion,
      featured: league.featured,
      homeVisible: league.homeVisible,
      featuredClubKeysCount: league.featuredClubKeys.length,
    })),
    missingFeaturedClubKeys: leagues
      .filter((league) => !league.featuredClubKeys || league.featuredClubKeys.length === 0)
      .map((league) => ({
        id: league.id,
        name: league.name,
        country: league.country,
        leagueId: league.leagueId,
      })),
  };
}

export type {
  LeagueOption,
  LeagueBrowseRegion,
  CountryFootballConfig,
};

export default leagues;
