// src/services/searchIndex.ts

import type { FixtureListRow } from "@/src/services/apiFootball";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { normalizeCityKey } from "@/src/utils/city";
import { cityGuides } from "@/src/data/cityGuides";
import { getCityGuide } from "@/src/data/cityGuides";
import { getTeamGuide, hasTeamGuide, normalizeTeamKey } from "@/src/data/teamGuides";
import { searchStaticTargets, resolveCountryKey, type SearchTarget } from "@/src/constants/search";
import { LEAGUES } from "@/src/constants/football";

/**
 * Global search index (V1)
 *
 * What we index:
 * - Teams (from fixtures list; unique by normalized team key)
 * - Cities (from fixtures + city guides; unique by normalized city key)
 * - Venues (from fixtures list)
 * - Matches (fixture rows)
 * - Static targets (countries/leagues) via src/constants/search.ts
 *
 * What we return (priority order):
 * 1) Teams
 * 2) Cities
 * 3) Static (Country/League)
 * 4) Venues
 * 5) Matches
 *
 * Important behavior:
 * - If a team/city guide does not exist yet, we still return the result and route to the guide screen.
 *   The guide screen can show “Coming soon” + still show fixtures filtered for that entity.
 */

export type SearchKind = "team" | "city" | "country" | "league" | "venue" | "match";

export type SearchResultBase = {
  kind: SearchKind;
  key: string; // stable unique key per kind
  title: string;
  subtitle?: string;
  // For UI ranking
  score: number;
};

export type TeamResult = SearchResultBase & {
  kind: "team";
  teamKey: string; // normalized
  teamName: string;
  hasGuide: boolean;
};

export type CityResult = SearchResultBase & {
  kind: "city";
  cityKey: string; // normalized
  cityName: string;
  hasGuide: boolean;
  country?: string;
};

export type CountryResult = SearchResultBase & {
  kind: "country";
  countryKey: string;
  leagueId?: number;
  season?: number;
  leagueLabel?: string;
};

export type LeagueResult = SearchResultBase & {
  kind: "league";
  leagueId: number;
  season: number;
};

export type VenueResult = SearchResultBase & {
  kind: "venue";
  venueName: string;
  venueCity?: string;
};

export type MatchResult = SearchResultBase & {
  kind: "match";
  fixtureId: string;
  home: string;
  away: string;
  kickoff?: string;
  venue?: string;
  city?: string;
};

export type SearchResult = TeamResult | CityResult | CountryResult | LeagueResult | VenueResult | MatchResult;

function norm(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function includesLoose(hay: string, needle: string): boolean {
  if (!needle) return false;
  if (!hay) return false;
  return hay.includes(needle);
}

function scoreForMatch(hay: string, q: string): number {
  // Simple scoring:
  // - exact start match gets higher
  // - contains gets base
  // - shorter is slightly better
  const h = hay;
  if (!h || !q) return 0;

  if (h === q) return 100;
  if (h.startsWith(q)) return 70;
  if (h.includes(` ${q}`)) return 55;
  if (h.includes(q)) return 45;
  return 0;
}

export type SearchIndex = {
  teams: Map<string, TeamResult>;
  cities: Map<string, CityResult>;
  venues: Map<string, VenueResult>;
  matches: MatchResult[]; // keep list, rank per-query
};

export function buildSearchIndex(fixtures: FixtureListRow[]): SearchIndex {
  const teams = new Map<string, TeamResult>();
  const cities = new Map<string, CityResult>();
  const venues = new Map<string, VenueResult>();
  const matches: MatchResult[] = [];

  const rows = Array.isArray(fixtures) ? fixtures : [];

  // Seed cities from guides so they exist even if fixtures window has none
  for (const [cityKey, guide] of Object.entries(cityGuides)) {
    const ck = normalizeCityKey(guide?.name ?? guide?.cityId ?? cityKey);
    if (!ck) continue;

    if (!cities.has(ck)) {
      cities.set(ck, {
        kind: "city",
        key: `city:${ck}`,
        cityKey: ck,
        cityName: guide.name ?? guide.cityId ?? cityKey,
        hasGuide: true,
        country: guide.country,
        title: guide.name ?? guide.cityId ?? cityKey,
        subtitle: guide.country ? `${guide.country} • City guide` : "City guide",
        score: 0,
      });
    }
  }

  for (const r of rows) {
    const fixtureIdRaw = r?.fixture?.id;
    const fixtureId = fixtureIdRaw != null ? String(fixtureIdRaw) : null;

    const home = String(r?.teams?.home?.name ?? "").trim();
    const away = String(r?.teams?.away?.name ?? "").trim();

    const venueName = String(r?.fixture?.venue?.name ?? "").trim();
    const venueCity = String(r?.fixture?.venue?.city ?? "").trim();

    // Teams
    if (home) {
      const tk = normalizeTeamKey(home);
      if (tk && !teams.has(tk)) {
        teams.set(tk, {
          kind: "team",
          key: `team:${tk}`,
          teamKey: tk,
          teamName: home,
          hasGuide: hasTeamGuide(home),
          title: home,
          subtitle: hasTeamGuide(home) ? "Team guide" : "Team guide (coming soon)",
          score: 0,
        });
      }
    }
    if (away) {
      const tk = normalizeTeamKey(away);
      if (tk && !teams.has(tk)) {
        teams.set(tk, {
          kind: "team",
          key: `team:${tk}`,
          teamKey: tk,
          teamName: away,
          hasGuide: hasTeamGuide(away),
          title: away,
          subtitle: hasTeamGuide(away) ? "Team guide" : "Team guide (coming soon)",
          score: 0,
        });
      }
    }

    // Cities (from fixtures)
    if (venueCity) {
      const ck = normalizeCityKey(venueCity);
      if (ck && !cities.has(ck)) {
        const guide = getCityGuide(venueCity);
        cities.set(ck, {
          kind: "city",
          key: `city:${ck}`,
          cityKey: ck,
          cityName: venueCity,
          hasGuide: !!guide,
          country: guide?.country,
          title: guide?.name ?? venueCity,
          subtitle: guide?.country ? `${guide.country} • City guide` : "City guide",
          score: 0,
        });
      }
    }

    // Venues
    if (venueName) {
      const vk = norm(`${venueName} ${venueCity}`); // stable-ish
      const key = vk ? vk.replace(/\s+/g, "-") : "";
      if (key && !venues.has(key)) {
        venues.set(key, {
          kind: "venue",
          key: `venue:${key}`,
          venueName,
          venueCity: venueCity || undefined,
          title: venueName,
          subtitle: venueCity ? `${venueCity} • Fixtures` : "Fixtures",
          score: 0,
        });
      }
    }

    // Matches list
    if (fixtureId && (home || away)) {
      const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
      matches.push({
        kind: "match",
        key: `match:${fixtureId}`,
        fixtureId,
        home: home || "Home",
        away: away || "Away",
        kickoff: kickoff || undefined,
        venue: venueName || undefined,
        city: venueCity || undefined,
        title: `${home || "Home"} vs ${away || "Away"}`,
        subtitle: [kickoff, venueName, venueCity].filter(Boolean).join(" • "),
        score: 0,
      });
    }
  }

  return { teams, cities, venues, matches };
}

/**
 * Query the index.
 * Returns ranked results with hard caps per section, then merged.
 */
export function searchAll(
  index: SearchIndex,
  input: string,
  opts?: {
    maxTeams?: number;
    maxCities?: number;
    maxStatic?: number;
    maxVenues?: number;
    maxMatches?: number;
  }
): SearchResult[] {
  const q = norm(input);
  if (!q) return [];

  const maxTeams = opts?.maxTeams ?? 6;
  const maxCities = opts?.maxCities ?? 6;
  const maxStatic = opts?.maxStatic ?? 6;
  const maxVenues = opts?.maxVenues ?? 6;
  const maxMatches = opts?.maxMatches ?? 6;

  // Teams
  const teamHits: TeamResult[] = [];
  for (const t of index.teams.values()) {
    const hay = norm(t.teamName);
    const s = scoreForMatch(hay, q);
    if (s <= 0) continue;
    teamHits.push({ ...t, score: s });
  }
  teamHits.sort((a, b) => b.score - a.score);

  // Cities
  const cityHits: CityResult[] = [];
  for (const c of index.cities.values()) {
    const hay = norm(c.cityName);
    const s = scoreForMatch(hay, q);
    if (s <= 0) continue;
    cityHits.push({ ...c, score: s });
  }
  cityHits.sort((a, b) => b.score - a.score);

  // Static targets (countries/leagues)
  const staticTargets = searchStaticTargets(q, maxStatic);
  const staticHits: (CountryResult | LeagueResult)[] = staticTargets
    .map((t: SearchTarget) => {
      if (t.category === "country") {
        const leagueId = t.league?.leagueId;
        const season = t.league?.season;
        return {
          kind: "country" as const,
          key: `country:${t.key}`,
          countryKey: t.key,
          title: t.label,
          subtitle: t.league ? `${t.league.label} • Fixtures` : "Fixtures",
          leagueId,
          season,
          leagueLabel: t.league?.label,
          score: 50, // countries are strong intent
        };
      }
      // league
      return {
        kind: "league" as const,
        key: `league:${t.leagueId}`,
        leagueId: t.leagueId,
        season: t.season,
        title: t.label,
        subtitle: "Fixtures",
        score: 45,
      };
    })
    .slice(0, maxStatic);

  // Venues
  const venueHits: VenueResult[] = [];
  for (const v of index.venues.values()) {
    const hay = norm(`${v.venueName} ${v.venueCity ?? ""}`);
    const s = scoreForMatch(hay, q);
    if (s <= 0) continue;
    venueHits.push({ ...v, score: s });
  }
  venueHits.sort((a, b) => b.score - a.score);

  // Matches (rank per query, then slice)
  const matchHits: MatchResult[] = index.matches
    .map((m) => {
      const hay = norm(`${m.home} ${m.away} ${m.venue ?? ""} ${m.city ?? ""}`);
      const s = scoreForMatch(hay, q);
      return { ...m, score: s };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxMatches);

  // Merge in priority order
  const merged: SearchResult[] = [
    ...teamHits.slice(0, maxTeams),
    ...cityHits.slice(0, maxCities),
    ...staticHits,
    ...venueHits.slice(0, maxVenues),
    ...matchHits,
  ];

  // Final de-dupe by kind:key
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of merged) {
    const k = `${r.kind}:${r.key}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }

  return out;
}

/**
 * Convenience for direct “country typed” resolution (Austria -> Austrian Bundesliga).
 * You can use this to create a one-tap behavior in the UI if you want.
 */
export function resolveCountryToLeague(input: string): { leagueId: number; season: number } | null {
  const countryKey = resolveCountryKey(input);
  if (!countryKey) return null;

  // Find the league target in search targets
  // If not found, fallback to “first in LEAGUES” (but this should not happen if mapping is correct)
  const fromLeagues = LEAGUES.find((l) => l.label.toLowerCase().includes(countryKey));
  if (fromLeagues) return { leagueId: fromLeagues.leagueId, season: fromLeagues.season };

  return null;
}
