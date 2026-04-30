// src/features/discover/discoverRanking.ts

import type { FixtureListRow } from "@/src/services/apiFootball";
import { POPULAR_TEAM_IDS } from "@/src/data/teams";

import type {
  DiscoverContext,
  DiscoverFixture,
  DiscoverTripLength,
  DiscoverVibe,
} from "./discoverEngine";
import type { DiscoverCategory } from "./discoverCategories";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function norm(value: unknown): string {
  return clean(value).toLowerCase();
}

function hasPopularTeam(id: unknown): boolean {
  return typeof id === "number" && POPULAR_TEAM_IDS.has(id);
}

function getLeagueId(row: FixtureListRow): number | null {
  return row?.league?.id != null ? Number(row.league.id) : null;
}

function parseFixtureDate(row: FixtureListRow): Date | null {
  const raw = row?.fixture?.date;
  if (!raw) return null;

  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function fixtureHour(row: FixtureListRow): number | null {
  const dt = parseFixtureDate(row);
  return dt ? dt.getHours() : null;
}

function isWeekendFixture(row: FixtureListRow): boolean {
  const dt = parseFixtureDate(row);
  if (!dt) return false;

  const day = dt.getDay();
  return day === 5 || day === 6 || day === 0;
}

function isMidweekFixture(row: FixtureListRow): boolean {
  const dt = parseFixtureDate(row);
  if (!dt) return false;

  const day = dt.getDay();
  return day >= 1 && day <= 4;
}

function isEveningFixture(row: FixtureListRow): boolean {
  const hour = fixtureHour(row);
  return hour != null && hour >= 18 && hour <= 22;
}

function hasConfirmedVenue(row: FixtureListRow): boolean {
  return !!clean(row?.fixture?.venue?.name);
}

function hasConfirmedCity(row: FixtureListRow): boolean {
  return !!clean(row?.fixture?.venue?.city);
}

const EUROPEAN_COMPETITION_IDS = new Set([2, 3, 848]);
const ELITE_DOMESTIC_LEAGUES = new Set([39, 140, 135, 78, 61]);
const STRONG_SECOND_TIER_LEAGUES = new Set([88, 94, 203, 179, 144, 218, 207, 197]);
const VALUE_DEPTH_LEAGUES = new Set([
  119, 345, 106, 210, 286, 271, 283, 332, 373, 172, 318, 315, 357, 113, 103, 244, 164,
]);

function isEuropeanCompetitionFixture(row: FixtureListRow): boolean {
  const leagueId = getLeagueId(row);
  return leagueId != null && EUROPEAN_COMPETITION_IDS.has(leagueId);
}

const CITY_PRESTIGE_TIER_3 = new Set([
  "london",
  "madrid",
  "barcelona",
  "milan",
  "rome",
  "munich",
  "amsterdam",
  "lisbon",
  "paris",
  "glasgow",
  "istanbul",
  "liverpool",
  "manchester",
  "naples",
]);

const CITY_PRESTIGE_TIER_2 = new Set([
  "porto",
  "seville",
  "turin",
  "rotterdam",
  "marseille",
  "berlin",
  "vienna",
  "prague",
  "zagreb",
  "athens",
  "dortmund",
  "salzburg",
  "copenhagen",
  "stockholm",
  "brussels",
  "budapest",
  "split",
]);

const CITY_PRESTIGE_TIER_1 = new Set([
  "bologna",
  "valencia",
  "bilbao",
  "ghent",
  "lyon",
  "hamburg",
  "nicosia",
  "basel",
  "krakow",
  "bratislava",
  "sofia",
  "bucharest",
  "belgrade",
  "warsaw",
]);

function cityPrestigeScore(city: string): number {
  const key = norm(city);
  if (!key) return 0;
  if (CITY_PRESTIGE_TIER_3.has(key)) return 3;
  if (CITY_PRESTIGE_TIER_2.has(key)) return 2;
  if (CITY_PRESTIGE_TIER_1.has(key)) return 1;
  return 0;
}

function leagueWeight(leagueId: number | null): number {
  if (leagueId == null) return 54;

  if (leagueId === 2) return 136;
  if (leagueId === 3) return 106;
  if (leagueId === 848) return 88;

  if (leagueId === 140) return 124;
  if (leagueId === 135) return 120;
  if (leagueId === 78) return 116;
  if (leagueId === 61) return 106;
  if (leagueId === 39) return 104;

  if (leagueId === 88) return 92;
  if (leagueId === 94) return 90;
  if (leagueId === 203) return 82;
  if (leagueId === 179) return 80;
  if (leagueId === 144) return 78;
  if (leagueId === 218) return 76;
  if (leagueId === 207) return 75;
  if (leagueId === 197) return 75;

  if (leagueId === 119) return 72;
  if (leagueId === 345) return 72;
  if (leagueId === 106) return 71;
  if (leagueId === 210) return 70;
  if (leagueId === 286) return 70;
  if (leagueId === 271) return 68;
  if (leagueId === 283) return 68;
  if (leagueId === 332) return 66;
  if (leagueId === 373) return 65;
  if (leagueId === 172) return 65;
  if (leagueId === 318) return 64;
  if (leagueId === 315) return 63;

  if (leagueId === 357) return 60;
  if (leagueId === 113) return 59;
  if (leagueId === 103) return 59;
  if (leagueId === 244) return 57;
  if (leagueId === 164) return 55;

  return 54;
}

function leagueBreadthBonus(leagueId: number | null): number {
  if (leagueId == null) return 0;
  if (EUROPEAN_COMPETITION_IDS.has(leagueId)) return 20;
  if (ELITE_DOMESTIC_LEAGUES.has(leagueId)) return 14;
  if (STRONG_SECOND_TIER_LEAGUES.has(leagueId)) return 8;
  if (VALUE_DEPTH_LEAGUES.has(leagueId)) return 5;
  return 3;
}

export function baseFixtureScore(row: FixtureListRow): number {
  const leagueId = getLeagueId(row);
  let score = leagueWeight(leagueId) + leagueBreadthBonus(leagueId);

  const homeId = row?.teams?.home?.id;
  const awayId = row?.teams?.away?.id;

  if (hasPopularTeam(homeId)) score += 30;
  if (hasPopularTeam(awayId)) score += 30;

  if (hasConfirmedVenue(row)) score += 8;
  if (hasConfirmedCity(row)) score += 7;

  score += cityPrestigeScore(String(row?.fixture?.venue?.city ?? "")) * 8;

  const hour = fixtureHour(row);
  if (hour != null) {
    if (hour >= 19 && hour <= 21) score += 11;
    else if (hour >= 17 && hour <= 22) score += 7;
  }

  if (isWeekendFixture(row)) score += 9;
  if (isMidweekFixture(row) && isEuropeanCompetitionFixture(row)) score += 10;
  if (isEuropeanCompetitionFixture(row)) score += 22;

  return score;
}

function vibesFromContext(ctx?: DiscoverContext | null): DiscoverVibe[] {
  return Array.isArray(ctx?.vibes) ? ctx.vibes.filter(Boolean) : [];
}

function tripLengthFromContext(ctx?: DiscoverContext | null): DiscoverTripLength | null {
  const value = String(ctx?.tripLength ?? "").trim();
  if (value === "day" || value === "1" || value === "2" || value === "3") return value;
  return null;
}

function vibeBoost(scored: DiscoverFixture, ctx?: DiscoverContext | null): number {
  const vibes = vibesFromContext(ctx);
  if (!vibes.length) return 0;

  let boost = 0;

  for (const vibe of vibes) {
    switch (vibe) {
      case "easy":
        boost += scored.scores.ticketEaseScore * 10;
        boost += scored.scores.tripEaseScore * 10;
        boost += scored.scores.valueScore * 5;
        boost -= scored.scores.derbyScore >= 4 ? 6 : 0;
        break;

      case "big":
        boost += scored.scores.derbyScore * 13;
        boost += scored.scores.glamourScore * 9;
        boost += scored.scores.atmosphereScore * 6;
        boost += scored.scores.europeScore * 6;
        break;

      case "nightlife":
        boost += scored.scores.nightlifeScore * 10;
        boost += scored.scores.nightScore * 8;
        boost += scored.scores.cityScore * 4;
        break;

      case "culture":
        boost += scored.scores.cultureScore * 10;
        boost += scored.scores.cityScore * 6;
        boost += scored.scores.atmosphereScore * 4;
        break;

      case "warm":
        boost += scored.scores.warmWeatherScore * 12;
        boost += scored.scores.cityScore * 3;
        boost += scored.scores.valueScore * 2;
        break;
    }
  }

  return boost;
}

function tripLengthBoost(scored: DiscoverFixture, ctx?: DiscoverContext | null): number {
  const tripLength = tripLengthFromContext(ctx);
  if (!tripLength) return 0;

  switch (tripLength) {
    case "day":
      return (
        scored.scores.tripEaseScore * 14 +
        scored.scores.ticketEaseScore * 8 +
        scored.scores.cityScore * 2 -
        scored.scores.multiMatchScore * 2
      );

    case "1":
      return (
        scored.scores.tripEaseScore * 10 +
        scored.scores.cityScore * 6 +
        scored.scores.nightScore * 3
      );

    case "2":
      return (
        scored.scores.cityScore * 10 +
        scored.scores.cultureScore * 8 +
        scored.scores.tripEaseScore * 8 +
        scored.scores.nightlifeScore * 4 +
        scored.scores.multiMatchScore * 4
      );

    case "3":
      return (
        scored.scores.cityScore * 12 +
        scored.scores.cultureScore * 10 +
        scored.scores.nightlifeScore * 8 +
        scored.scores.warmWeatherScore * 6 +
        scored.scores.valueScore * 3 +
        scored.scores.multiMatchScore * 5
      );

    default:
      return 0;
  }
}

function scoreBigMatches(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.derbyScore * 30 +
    scored.scores.atmosphereScore * 21 +
    scored.scores.glamourScore * 20 +
    scored.scores.titleDramaScore * 16 +
    scored.scores.europeScore * 12 +
    scored.scores.nightScore * 6
  );
}

function scoreDerbies(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.derbyScore * 64 +
    scored.scores.atmosphereScore * 13 +
    scored.scores.cultureScore * 10 +
    scored.scores.nightScore * 5
  );
}

function scoreAtmospheres(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.atmosphereScore * 44 +
    scored.scores.cultureScore * 14 +
    scored.scores.derbyScore * 10 +
    scored.scores.nightScore * 8 +
    scored.scores.stadiumScore * 6
  );
}

function scoreValueTrips(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) * 0.28 +
    scored.scores.valueScore * 56 +
    scored.scores.ticketEaseScore * 16 +
    scored.scores.tripEaseScore * 14 +
    scored.scores.cityScore * 8 +
    scored.scores.underratedScore * 12
  );
}

function scorePerfectTrips(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.atmosphereScore * 16 +
    scored.scores.valueScore * 15 +
    scored.scores.cityScore * 18 +
    scored.scores.cultureScore * 16 +
    scored.scores.tripEaseScore * 16 +
    scored.scores.ticketEaseScore * 10 +
    scored.scores.nightlifeScore * 8 +
    scored.scores.multiMatchScore * 8 +
    scored.scores.weekendTripScore * 7
  );
}

function scoreEasyTickets(scored: DiscoverFixture): number {
  return (
    scored.scores.ticketEaseScore * 82 +
    scored.scores.tripEaseScore * 18 +
    scored.scores.valueScore * 12 +
    scored.scores.cityScore * 6 +
    baseFixtureScore(scored.fixture) * 0.12
  );
}

function scoreLegendaryStadiums(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.stadiumScore * 58 +
    scored.scores.atmosphereScore * 12 +
    scored.scores.cityScore * 10 +
    scored.scores.derbyScore * 6 +
    scored.scores.glamourScore * 9
  );
}

function scoreIconicCities(scored: DiscoverFixture): number {
  const city = String(scored.fixture?.fixture?.venue?.city ?? "");
  const cityPrestige = cityPrestigeScore(city);

  return (
    baseFixtureScore(scored.fixture) +
    cityPrestige * 48 +
    scored.scores.cityScore * 22 +
    scored.scores.cultureScore * 18 +
    scored.scores.stadiumScore * 10 +
    scored.scores.nightlifeScore * 10 +
    scored.scores.atmosphereScore * 8
  );
}

function scoreNightMatches(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.nightScore * 58 +
    scored.scores.nightlifeScore * 22 +
    scored.scores.atmosphereScore * 12 +
    scored.scores.derbyScore * 8 +
    scored.scores.cityScore * 6
  );
}

function titleDramaWeight(scored: DiscoverFixture): number {
  const leagueId = getLeagueId(scored.fixture);

  if (leagueId != null && ELITE_DOMESTIC_LEAGUES.has(leagueId)) return 1.1;
  if (leagueId != null && STRONG_SECOND_TIER_LEAGUES.has(leagueId)) return 1.03;
  return 1;
}

function scoreTitleDrama(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.titleDramaScore * 56 * titleDramaWeight(scored) +
    scored.scores.derbyScore * 10 +
    scored.scores.atmosphereScore * 10 +
    scored.scores.glamourScore * 8
  );
}

function scoreBucketList(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.stadiumScore * 36 +
    scored.scores.atmosphereScore * 27 +
    scored.scores.derbyScore * 18 +
    scored.scores.cityScore * 14 +
    scored.scores.glamourScore * 15 +
    scored.scores.europeScore * 9 +
    scored.scores.nightScore * 6
  );
}

function scoreMatchdayCulture(scored: DiscoverFixture): number {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.cultureScore * 38 +
    scored.scores.atmosphereScore * 22 +
    scored.scores.cityScore * 14 +
    scored.scores.derbyScore * 10 +
    scored.scores.stadiumScore * 8
  );
}

function scoreUnderratedTrips(scored: DiscoverFixture): number {
  const row = scored.fixture;

  let glamourPenalty = 0;
  if (hasPopularTeam(row?.teams?.home?.id)) glamourPenalty += 16;
  if (hasPopularTeam(row?.teams?.away?.id)) glamourPenalty += 16;

  return (
    baseFixtureScore(row) * 0.7 +
    scored.scores.underratedScore * 36 +
    scored.scores.atmosphereScore * 16 +
    scored.scores.valueScore * 18 +
    scored.scores.cityScore * 10 +
    scored.scores.cultureScore * 8 -
    glamourPenalty
  );
}

function scoreEuropeanNights(scored: DiscoverFixture): number {
  const row = scored.fixture;

  let score =
    baseFixtureScore(row) +
    scored.scores.europeScore * 44 +
    scored.scores.glamourScore * 19 +
    scored.scores.atmosphereScore * 18 +
    scored.scores.nightScore * 16 +
    scored.scores.cityScore * 10 +
    scored.scores.stadiumScore * 8;

  if (isEuropeanCompetitionFixture(row)) score += 128;
  if (scored.scores.derbyScore >= 3) score += 8;
  if (isMidweekFixture(row)) score += 12;
  if (isEveningFixture(row)) score += 8;

  return score;
}

function scoreMultiMatchTrips(scored: DiscoverFixture): number {
  const row = scored.fixture;

  let score =
    baseFixtureScore(row) +
    scored.scores.multiMatchScore * 38 +
    scored.scores.tripEaseScore * 18 +
    scored.scores.cityScore * 18 +
    scored.scores.cultureScore * 12 +
    scored.scores.ticketEaseScore * 8 +
    scored.scores.valueScore * 8 +
    scored.scores.nightScore * 6;

  if (isEuropeanCompetitionFixture(row)) score += 12;
  if (isWeekendFixture(row)) score += 14;

  return score;
}

function scoreWeekendTrips(scored: DiscoverFixture): number {
  const row = scored.fixture;

  let score =
    baseFixtureScore(row) +
    scored.scores.weekendTripScore * 38 +
    scored.scores.tripEaseScore * 16 +
    scored.scores.cityScore * 14 +
    scored.scores.cultureScore * 10 +
    scored.scores.ticketEaseScore * 8 +
    scored.scores.valueScore * 8 +
    scored.scores.nightlifeScore * 8;

  if (isWeekendFixture(row)) score += 100;
  if (isEuropeanCompetitionFixture(row)) score -= 4;

  return score;
}

export function discoverScoreForCategory(
  category: DiscoverCategory,
  scored: DiscoverFixture,
  ctx?: DiscoverContext | null
): number {
  let score: number;

  switch (category) {
    case "bigMatches":
      score = scoreBigMatches(scored);
      break;
    case "derbies":
      score = scoreDerbies(scored);
      break;
    case "atmospheres":
      score = scoreAtmospheres(scored);
      break;
    case "valueTrips":
      score = scoreValueTrips(scored);
      break;
    case "perfectTrips":
      score = scorePerfectTrips(scored);
      break;
    case "easyTickets":
      score = scoreEasyTickets(scored);
      break;
    case "legendaryStadiums":
      score = scoreLegendaryStadiums(scored);
      break;
    case "iconicCities":
      score = scoreIconicCities(scored);
      break;
    case "nightMatches":
      score = scoreNightMatches(scored);
      break;
    case "titleDrama":
      score = scoreTitleDrama(scored);
      break;
    case "bucketList":
      score = scoreBucketList(scored);
      break;
    case "matchdayCulture":
      score = scoreMatchdayCulture(scored);
      break;
    case "underratedTrips":
      score = scoreUnderratedTrips(scored);
      break;
    case "europeanNights":
      score = scoreEuropeanNights(scored);
      break;
    case "multiMatchTrips":
      score = scoreMultiMatchTrips(scored);
      break;
    case "weekendTrips":
      score = scoreWeekendTrips(scored);
      break;
    default:
      score = baseFixtureScore(scored.fixture);
      break;
  }

  score += vibeBoost(scored, ctx);
  score += tripLengthBoost(scored, ctx);

  return Math.round(score);
}
