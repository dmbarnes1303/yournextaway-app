import type { FixtureListRow } from "@/src/services/apiFootball";
import { POPULAR_TEAM_IDS } from "@/src/data/teams";

import type {
  DiscoverContext,
  DiscoverFixture,
  DiscoverTripLength,
  DiscoverVibe,
} from "./discoverEngine";
import type { DiscoverCategory } from "./discoverCategories";

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function clean(s: unknown) {
  return String(s ?? "").trim();
}

function hasPopularTeam(id: unknown): boolean {
  return typeof id === "number" && POPULAR_TEAM_IDS.has(id);
}

const EUROPEAN_COMPETITION_IDS = new Set([2, 3, 848]);

const ELITE_DOMESTIC_LEAGUES = new Set([39, 140, 135, 78, 61]);
const STRONG_SECOND_TIER_LEAGUES = new Set([88, 94, 203, 179, 144, 218, 207, 197]);
const DEEP_VALUE_LEAGUES = new Set([
  119, 345, 106, 210, 286, 271, 283, 332, 373, 172, 318, 315, 357, 113, 103, 244, 164,
]);

const CITY_PRESTIGE_3 = new Set([
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

const CITY_PRESTIGE_2 = new Set([
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

const CITY_PRESTIGE_1 = new Set([
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

function getLeagueId(r: FixtureListRow): number | null {
  return r?.league?.id != null ? Number(r.league.id) : null;
}

function isEuropeanCompetitionFixture(r: FixtureListRow): boolean {
  const leagueId = getLeagueId(r);
  return leagueId != null && EUROPEAN_COMPETITION_IDS.has(leagueId);
}

function isWeekendFixture(r: FixtureListRow): boolean {
  const raw = r?.fixture?.date;
  if (!raw) return false;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return false;
  const day = dt.getDay();
  return day === 5 || day === 6 || day === 0;
}

function isMidweekFixture(r: FixtureListRow): boolean {
  const raw = r?.fixture?.date;
  if (!raw) return false;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return false;
  const day = dt.getDay();
  return day >= 1 && day <= 4;
}

function hasConfirmedVenue(r: FixtureListRow): boolean {
  return !!clean(r?.fixture?.venue?.name);
}

function hasConfirmedCity(r: FixtureListRow): boolean {
  return !!clean(r?.fixture?.venue?.city);
}

function localHourOrNull(r: FixtureListRow): number | null {
  const raw = r?.fixture?.date;
  if (!raw) return null;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.getHours();
}

function cityPrestigeScore(city: string): number {
  const key = norm(city);
  if (!key) return 0;
  if (CITY_PRESTIGE_3.has(key)) return 3;
  if (CITY_PRESTIGE_2.has(key)) return 2;
  if (CITY_PRESTIGE_1.has(key)) return 1;
  return 0;
}

function leagueWeight(leagueId: number | null): number {
  if (leagueId == null) return 58;

  if (leagueId === 2) return 132; // UCL
  if (leagueId === 3) return 106; // UEL
  if (leagueId === 848) return 92; // UECL

  if (leagueId === 39) return 122; // Premier League
  if (leagueId === 140) return 114; // La Liga
  if (leagueId === 135) return 110; // Serie A
  if (leagueId === 78) return 106; // Bundesliga
  if (leagueId === 61) return 98; // Ligue 1

  if (leagueId === 88) return 90; // Eredivisie
  if (leagueId === 94) return 88; // Primeira Liga
  if (leagueId === 203) return 86; // Super Lig
  if (leagueId === 179) return 84; // Scottish Premiership
  if (leagueId === 144) return 82; // Belgium
  if (leagueId === 218) return 79; // Austria
  if (leagueId === 207) return 78; // Switzerland
  if (leagueId === 197) return 78; // Greece

  if (leagueId === 119) return 74; // Denmark
  if (leagueId === 345) return 74; // Czechia
  if (leagueId === 106) return 73; // Poland
  if (leagueId === 210) return 72; // Croatia
  if (leagueId === 286) return 72; // Serbia
  if (leagueId === 271) return 70; // Hungary
  if (leagueId === 283) return 70; // Romania
  if (leagueId === 332) return 68; // Slovakia
  if (leagueId === 373) return 67; // Slovenia
  if (leagueId === 172) return 67; // Bulgaria
  if (leagueId === 318) return 66; // Cyprus
  if (leagueId === 315) return 65; // Bosnia

  if (leagueId === 357) return 62; // Ireland
  if (leagueId === 113) return 60; // Sweden
  if (leagueId === 103) return 60; // Norway
  if (leagueId === 244) return 58; // Finland
  if (leagueId === 164) return 56; // Iceland

  return 58;
}

function leagueBreadthBonus(leagueId: number | null): number {
  if (leagueId == null) return 0;
  if (EUROPEAN_COMPETITION_IDS.has(leagueId)) return 18;
  if (ELITE_DOMESTIC_LEAGUES.has(leagueId)) return 12;
  if (STRONG_SECOND_TIER_LEAGUES.has(leagueId)) return 9;
  if (DEEP_VALUE_LEAGUES.has(leagueId)) return 6;
  return 4;
}

export function baseFixtureScore(r: FixtureListRow): number {
  const lid = getLeagueId(r);
  let score = leagueWeight(lid) + leagueBreadthBonus(lid);

  const homeId = r?.teams?.home?.id;
  const awayId = r?.teams?.away?.id;

  if (hasPopularTeam(homeId)) score += 34;
  if (hasPopularTeam(awayId)) score += 34;

  if (hasConfirmedVenue(r)) score += 8;
  if (hasConfirmedCity(r)) score += 6;

  const cityPrestige = cityPrestigeScore(String(r?.fixture?.venue?.city ?? ""));
  score += cityPrestige * 8;

  const hr = localHourOrNull(r);
  if (hr != null) {
    if (hr >= 19 && hr <= 21) score += 10;
    else if (hr >= 17 && hr <= 22) score += 6;
  }

  if (isWeekendFixture(r)) score += 10;
  if (isMidweekFixture(r) && isEuropeanCompetitionFixture(r)) score += 8;
  if (isEuropeanCompetitionFixture(r)) score += 20;

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

function vibeBoost(scored: DiscoverFixture, ctx?: DiscoverContext | null) {
  const vibes = vibesFromContext(ctx);
  if (!vibes.length) return 0;

  let boost = 0;

  for (const vibe of vibes) {
    if (vibe === "easy") {
      boost += scored.scores.ticketEaseScore * 10;
      boost += scored.scores.tripEaseScore * 9;
      boost += scored.scores.valueScore * 4;
    } else if (vibe === "big") {
      boost += scored.scores.derbyScore * 10;
      boost += scored.scores.glamourScore * 8;
      boost += scored.scores.atmosphereScore * 5;
      if (isEuropeanCompetitionFixture(scored.fixture)) boost += 20;
    } else if (vibe === "nightlife") {
      boost += scored.scores.nightlifeScore * 10;
      boost += scored.scores.nightScore * 8;
      boost += scored.scores.cityScore * 3;
    } else if (vibe === "culture") {
      boost += scored.scores.cultureScore * 10;
      boost += scored.scores.cityScore * 7;
      boost += scored.scores.atmosphereScore * 3;
    } else if (vibe === "warm") {
      boost += scored.scores.warmWeatherScore * 12;
      boost += scored.scores.cityScore * 3;
      boost += scored.scores.valueScore * 2;
    }
  }

  return boost;
}

function tripLengthBoost(scored: DiscoverFixture, ctx?: DiscoverContext | null) {
  const tripLength = tripLengthFromContext(ctx);
  if (!tripLength) return 0;

  if (tripLength === "day") {
    return (
      scored.scores.tripEaseScore * 14 +
      scored.scores.ticketEaseScore * 8 +
      scored.scores.cityScore * 2
    );
  }

  if (tripLength === "1") {
    return (
      scored.scores.tripEaseScore * 10 +
      scored.scores.cityScore * 6 +
      scored.scores.nightScore * 3
    );
  }

  if (tripLength === "2") {
    return (
      scored.scores.cityScore * 10 +
      scored.scores.cultureScore * 8 +
      scored.scores.tripEaseScore * 8 +
      scored.scores.nightlifeScore * 4
    );
  }

  return (
    scored.scores.cityScore * 12 +
    scored.scores.cultureScore * 10 +
    scored.scores.nightlifeScore * 8 +
    scored.scores.warmWeatherScore * 6 +
    scored.scores.valueScore * 3
  );
}

function iconicCityScore(scored: DiscoverFixture) {
  const city = String(scored.fixture?.fixture?.venue?.city ?? "");
  const cityPrestige = cityPrestigeScore(city);

  return (
    baseFixtureScore(scored.fixture) +
    cityPrestige * 48 +
    scored.scores.cityScore * 22 +
    scored.scores.cultureScore * 18 +
    scored.scores.stadiumScore * 12 +
    scored.scores.nightlifeScore * 10 +
    scored.scores.atmosphereScore * 8
  );
}

function bucketListScore(scored: DiscoverFixture) {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.stadiumScore * 34 +
    scored.scores.atmosphereScore * 26 +
    scored.scores.derbyScore * 18 +
    scored.scores.cityScore * 14 +
    scored.scores.glamourScore * 14 +
    scored.scores.europeScore * 8 +
    scored.scores.nightScore * 6
  );
}

function perfectTripScore(scored: DiscoverFixture) {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.atmosphereScore * 18 +
    scored.scores.valueScore * 18 +
    scored.scores.cityScore * 18 +
    scored.scores.cultureScore * 18 +
    scored.scores.tripEaseScore * 18 +
    scored.scores.ticketEaseScore * 12 +
    scored.scores.nightlifeScore * 8 +
    scored.scores.multiMatchScore * 8
  );
}

function underratedTripScore(scored: DiscoverFixture) {
  const r = scored.fixture;

  const homeId = r?.teams?.home?.id;
  const awayId = r?.teams?.away?.id;

  let glamourPenalty = 0;
  if (hasPopularTeam(homeId)) glamourPenalty += 18;
  if (hasPopularTeam(awayId)) glamourPenalty += 18;

  return (
    baseFixtureScore(r) * 0.72 +
    scored.scores.underratedScore * 34 +
    scored.scores.atmosphereScore * 16 +
    scored.scores.valueScore * 18 +
    scored.scores.cityScore * 10 +
    scored.scores.cultureScore * 8 -
    glamourPenalty
  );
}

function europeanNightsScore(scored: DiscoverFixture) {
  const r = scored.fixture;

  let score =
    baseFixtureScore(r) +
    scored.scores.europeScore * 42 +
    scored.scores.glamourScore * 18 +
    scored.scores.atmosphereScore * 18 +
    scored.scores.nightScore * 16 +
    scored.scores.cityScore * 10 +
    scored.scores.stadiumScore * 8;

  if (isEuropeanCompetitionFixture(r)) score += 120;
  if (scored.scores.derbyScore >= 3) score += 10;
  if (isMidweekFixture(r)) score += 12;

  return score;
}

function multiMatchTripsScore(scored: DiscoverFixture) {
  const r = scored.fixture;

  let score =
    baseFixtureScore(r) +
    scored.scores.multiMatchScore * 34 +
    scored.scores.tripEaseScore * 18 +
    scored.scores.cityScore * 18 +
    scored.scores.cultureScore * 12 +
    scored.scores.ticketEaseScore * 8 +
    scored.scores.valueScore * 8 +
    scored.scores.nightScore * 6;

  if (isEuropeanCompetitionFixture(r)) score += 14;
  if (isWeekendFixture(r)) score += 14;

  return score;
}

function weekendTripsScore(scored: DiscoverFixture) {
  const r = scored.fixture;

  let score =
    baseFixtureScore(r) +
    scored.scores.weekendTripScore * 34 +
    scored.scores.tripEaseScore * 16 +
    scored.scores.cityScore * 14 +
    scored.scores.cultureScore * 10 +
    scored.scores.ticketEaseScore * 8 +
    scored.scores.valueScore * 8 +
    scored.scores.nightlifeScore * 8;

  if (isWeekendFixture(r)) score += 96;
  if (isEuropeanCompetitionFixture(r)) score -= 6;

  return score;
}

function titleDramaWeight(scored: DiscoverFixture) {
  const leagueId = getLeagueId(scored.fixture);

  if (leagueId != null && ELITE_DOMESTIC_LEAGUES.has(leagueId)) return 1.1;
  if (leagueId != null && STRONG_SECOND_TIER_LEAGUES.has(leagueId)) return 1.02;
  return 1;
}

export function discoverScoreForCategory(
  category: DiscoverCategory,
  scored: DiscoverFixture,
  ctx?: DiscoverContext | null
): number {
  const r = scored.fixture;
  const base = baseFixtureScore(r);

  let score = 0;

  switch (category) {
    case "bigMatches":
      score =
        base +
        scored.scores.derbyScore * 30 +
        scored.scores.atmosphereScore * 22 +
        scored.scores.glamourScore * 20 +
        scored.scores.titleDramaScore * 18 +
        scored.scores.europeScore * 12 +
        scored.scores.nightScore * 8;
      break;

    case "derbies":
      score =
        base +
        scored.scores.derbyScore * 62 +
        scored.scores.atmosphereScore * 14 +
        scored.scores.cultureScore * 10 +
        scored.scores.nightScore * 6;
      break;

    case "atmospheres":
      score =
        base +
        scored.scores.atmosphereScore * 42 +
        scored.scores.cultureScore * 14 +
        scored.scores.derbyScore * 10 +
        scored.scores.nightScore * 8 +
        scored.scores.stadiumScore * 6;
      break;

    case "valueTrips":
      score =
        base * 0.26 +
        scored.scores.valueScore * 58 +
        scored.scores.ticketEaseScore * 16 +
        scored.scores.tripEaseScore * 14 +
        scored.scores.cityScore * 8 +
        scored.scores.underratedScore * 8;
      break;

    case "perfectTrips":
      score = perfectTripScore(scored);
      break;

    case "easyTickets":
      score =
        scored.scores.ticketEaseScore * 84 +
        scored.scores.tripEaseScore * 18 +
        scored.scores.valueScore * 10 +
        scored.scores.cityScore * 6 +
        base * 0.1;
      break;

    case "multiMatchTrips":
      score = multiMatchTripsScore(scored);
      break;

    case "weekendTrips":
      score = weekendTripsScore(scored);
      break;

    case "europeanNights":
      score = europeanNightsScore(scored);
      break;

    case "legendaryStadiums":
      score =
        base +
        scored.scores.stadiumScore * 54 +
        scored.scores.atmosphereScore * 12 +
        scored.scores.cityScore * 10 +
        scored.scores.derbyScore * 6 +
        scored.scores.glamourScore * 8;
      break;

    case "iconicCities":
      score = iconicCityScore(scored);
      break;

    case "nightMatches":
      score =
        base +
        scored.scores.nightScore * 56 +
        scored.scores.nightlifeScore * 22 +
        scored.scores.atmosphereScore * 12 +
        scored.scores.derbyScore * 8 +
        scored.scores.cityScore * 6;
      break;

    case "titleDrama":
      score =
        base +
        scored.scores.titleDramaScore * 56 * titleDramaWeight(scored) +
        scored.scores.derbyScore * 10 +
        scored.scores.atmosphereScore * 10 +
        scored.scores.glamourScore * 8;
      break;

    case "bucketList":
      score = bucketListScore(scored);
      break;

    case "matchdayCulture":
      score =
        base +
        scored.scores.cultureScore * 36 +
        scored.scores.atmosphereScore * 22 +
        scored.scores.cityScore * 14 +
        scored.scores.derbyScore * 10 +
        scored.scores.stadiumScore * 8;
      break;

    case "underratedTrips":
      score = underratedTripScore(scored);
      break;

    default:
      score = base;
      break;
  }

  score += vibeBoost(scored, ctx);
  score += tripLengthBoost(scored, ctx);

  return score;
}
