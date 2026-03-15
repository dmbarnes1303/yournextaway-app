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

function hasPopularTeam(id: unknown): boolean {
  return typeof id === "number" && POPULAR_TEAM_IDS.has(id);
}

function leagueWeight(leagueId: number | null): number {
  if (leagueId === 2) return 118; // Champions League
  if (leagueId === 3) return 96; // Europa League
  if (leagueId === 848) return 84; // Conference League
  if (leagueId === 39) return 112; // Premier League
  if (leagueId === 140) return 102; // La Liga
  if (leagueId === 135) return 98; // Serie A
  if (leagueId === 78) return 94; // Bundesliga
  if (leagueId === 61) return 90; // Ligue 1
  if (leagueId === 88) return 82; // Eredivisie
  if (leagueId === 94) return 80; // Primeira Liga
  if (leagueId === 203) return 78; // Super Lig
  if (leagueId === 179) return 75; // Scottish Premiership
  return 60;
}

function isEuropeanCompetition(leagueId: number | null): boolean {
  return leagueId === 2 || leagueId === 3 || leagueId === 848;
}

function isWeekendFixture(dateIso?: string | null): boolean {
  if (!dateIso) return false;
  const dt = new Date(dateIso);
  if (Number.isNaN(dt.getTime())) return false;
  const day = dt.getUTCDay();
  return day === 5 || day === 6 || day === 0;
}

export function baseFixtureScore(r: FixtureListRow): number {
  const lid = r?.league?.id != null ? Number(r.league.id) : null;
  let score = leagueWeight(lid);

  const homeId = r?.teams?.home?.id;
  const awayId = r?.teams?.away?.id;

  if (hasPopularTeam(homeId)) score += 48;
  if (hasPopularTeam(awayId)) score += 48;

  const venue = String(r?.fixture?.venue?.name ?? "").trim();
  const city = String(r?.fixture?.venue?.city ?? "").trim();

  if (venue) score += 10;
  if (city) score += 6;

  const dt = r?.fixture?.date ? new Date(r.fixture.date) : null;
  if (dt && !Number.isNaN(dt.getTime())) {
    const day = dt.getUTCDay();
    if (day === 5 || day === 6 || day === 0) score += 12;

    const hr = dt.getUTCHours();
    if (hr >= 17 && hr <= 21) score += 8;
  }

  if (isEuropeanCompetition(lid)) score += 10;

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
      boost +=
        scored.scores.ticketEaseScore * 8 +
        scored.scores.tripEaseScore * 6 +
        scored.scores.weekendTripScore * 2;
    } else if (vibe === "big") {
      boost +=
        scored.scores.derbyScore * 8 +
        scored.scores.glamourScore * 6 +
        scored.scores.europeScore * 8;
    } else if (vibe === "nightlife") {
      boost +=
        scored.scores.nightlifeScore * 8 +
        scored.scores.nightScore * 6 +
        scored.scores.weekendTripScore * 3;
    } else if (vibe === "culture") {
      boost +=
        scored.scores.cultureScore * 8 +
        scored.scores.cityScore * 6 +
        scored.scores.multiMatchScore * 4;
    } else if (vibe === "warm") {
      boost += scored.scores.warmWeatherScore * 10;
    }
  }

  return boost;
}

function tripLengthBoost(scored: DiscoverFixture, ctx?: DiscoverContext | null) {
  const tripLength = tripLengthFromContext(ctx);
  if (!tripLength) return 0;

  if (tripLength === "day") {
    return (
      scored.scores.tripEaseScore * 12 +
      scored.scores.ticketEaseScore * 6 -
      scored.scores.multiMatchScore * 2
    );
  }

  if (tripLength === "1") {
    return (
      scored.scores.tripEaseScore * 8 +
      scored.scores.cityScore * 5 +
      scored.scores.weekendTripScore * 4
    );
  }

  if (tripLength === "2") {
    return (
      scored.scores.cityScore * 8 +
      scored.scores.cultureScore * 6 +
      scored.scores.multiMatchScore * 8 +
      scored.scores.weekendTripScore * 6
    );
  }

  return (
    scored.scores.cityScore * 10 +
    scored.scores.cultureScore * 8 +
    scored.scores.nightlifeScore * 6 +
    scored.scores.warmWeatherScore * 4 +
    scored.scores.multiMatchScore * 12 +
    scored.scores.weekendTripScore * 8
  );
}

function cityPrestigeScore(city: string): number {
  const key = norm(city);

  if (
    [
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
      "dortmund",
      "liverpool",
      "manchester",
      "naples",
    ].includes(key)
  ) {
    return 3;
  }

  if (
    [
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
    ].includes(key)
  ) {
    return 2;
  }

  return 0;
}

function iconicCityScore(scored: DiscoverFixture) {
  const city = String(scored.fixture?.fixture?.venue?.city ?? "");

  return (
    cityPrestigeScore(city) * 42 +
    baseFixtureScore(scored.fixture) +
    scored.scores.cityScore * 18 +
    scored.scores.cultureScore * 16 +
    scored.scores.stadiumScore * 14 +
    scored.scores.nightlifeScore * 10 +
    scored.scores.multiMatchScore * 12
  );
}

function bucketListScore(scored: DiscoverFixture) {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.stadiumScore * 30 +
    scored.scores.atmosphereScore * 24 +
    scored.scores.derbyScore * 16 +
    scored.scores.cityScore * 14 +
    scored.scores.glamourScore * 10 +
    scored.scores.nightScore * 8 +
    scored.scores.europeScore * 18
  );
}

function perfectTripScore(scored: DiscoverFixture) {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.atmosphereScore * 20 +
    scored.scores.valueScore * 20 +
    scored.scores.cityScore * 16 +
    scored.scores.cultureScore * 16 +
    scored.scores.tripEaseScore * 18 +
    scored.scores.ticketEaseScore * 12 +
    scored.scores.nightlifeScore * 10 +
    scored.scores.multiMatchScore * 10 +
    scored.scores.weekendTripScore * 8
  );
}

function underratedTripScore(scored: DiscoverFixture) {
  const r = scored.fixture;
  const base = baseFixtureScore(r);

  const homeId = r?.teams?.home?.id;
  const awayId = r?.teams?.away?.id;

  const glamourPenalty =
    (hasPopularTeam(homeId) ? 24 : 0) +
    (hasPopularTeam(awayId) ? 24 : 0);

  return (
    base +
    scored.scores.underratedScore * 32 +
    scored.scores.atmosphereScore * 16 +
    scored.scores.valueScore * 16 +
    scored.scores.cityScore * 8 +
    scored.scores.multiMatchScore * 6 -
    glamourPenalty
  );
}

function europeanNightsScore(scored: DiscoverFixture) {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.europeScore * 46 +
    scored.scores.nightScore * 18 +
    scored.scores.glamourScore * 16 +
    scored.scores.atmosphereScore * 14 +
    scored.scores.cityScore * 8
  );
}

function multiMatchTripsScore(scored: DiscoverFixture) {
  return (
    baseFixtureScore(scored.fixture) * 0.55 +
    scored.scores.multiMatchScore * 52 +
    scored.scores.weekendTripScore * 20 +
    scored.scores.cityScore * 18 +
    scored.scores.cultureScore * 14 +
    scored.scores.tripEaseScore * 10 +
    scored.scores.europeScore * 8
  );
}

function weekendTripsScore(scored: DiscoverFixture) {
  return (
    baseFixtureScore(scored.fixture) * 0.48 +
    scored.scores.weekendTripScore * 58 +
    scored.scores.multiMatchScore * 18 +
    scored.scores.nightlifeScore * 14 +
    scored.scores.cityScore * 12 +
    scored.scores.tripEaseScore * 10 +
    scored.scores.nightScore * 8
  );
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
        scored.scores.derbyScore * 32 +
        scored.scores.atmosphereScore * 20 +
        scored.scores.glamourScore * 16 +
        scored.scores.titleDramaScore * 16 +
        scored.scores.nightScore * 10 +
        scored.scores.europeScore * 20;
      break;

    case "derbies":
      score =
        base +
        scored.scores.derbyScore * 58 +
        scored.scores.atmosphereScore * 14 +
        scored.scores.nightScore * 6;
      break;

    case "atmospheres":
      score =
        base +
        scored.scores.atmosphereScore * 40 +
        scored.scores.cultureScore * 12 +
        scored.scores.derbyScore * 12 +
        scored.scores.nightScore * 8 +
        scored.scores.europeScore * 10;
      break;

    case "valueTrips":
      score =
        base * 0.32 +
        scored.scores.valueScore * 56 +
        scored.scores.ticketEaseScore * 14 +
        scored.scores.tripEaseScore * 12 +
        scored.scores.cityScore * 6 +
        scored.scores.weekendTripScore * 6;
      break;

    case "perfectTrips":
      score = perfectTripScore(scored);
      break;

    case "easyTickets":
      score =
        scored.scores.ticketEaseScore * 82 +
        scored.scores.tripEaseScore * 14 +
        scored.scores.valueScore * 10 +
        base * 0.14;
      break;

    case "legendaryStadiums":
      score =
        base +
        scored.scores.stadiumScore * 50 +
        scored.scores.atmosphereScore * 10 +
        scored.scores.cityScore * 10 +
        scored.scores.derbyScore * 6 +
        scored.scores.europeScore * 10;
      break;

    case "iconicCities":
      score = iconicCityScore(scored);
      break;

    case "nightMatches":
      score =
        base +
        scored.scores.nightScore * 54 +
        scored.scores.nightlifeScore * 20 +
        scored.scores.atmosphereScore * 12 +
        scored.scores.derbyScore * 8 +
        scored.scores.europeScore * 16;
      break;

    case "titleDrama":
      score =
        base +
        scored.scores.titleDramaScore * 54 +
        scored.scores.derbyScore * 10 +
        scored.scores.atmosphereScore * 10 +
        scored.scores.europeScore * 8;
      break;

    case "bucketList":
      score = bucketListScore(scored);
      break;

    case "matchdayCulture":
      score =
        base +
        scored.scores.cultureScore * 34 +
        scored.scores.atmosphereScore * 22 +
        scored.scores.cityScore * 14 +
        scored.scores.derbyScore * 10 +
        scored.scores.multiMatchScore * 10;
      break;

    case "underratedTrips":
      score = underratedTripScore(scored);
      break;

    case "europeanNights":
      score = europeanNightsScore(scored);
      break;

    case "multiMatchTrips":
      score = multiMatchTripsScore(scored);
      break;

    case "weekendTrips":
      score = weekendTripsScore(scored);
      break;

    default:
      score = base;
      break;
  }

  score += vibeBoost(scored, ctx);
  score += tripLengthBoost(scored, ctx);

  if (isWeekendFixture(r?.fixture?.date)) {
    score += 3;
  }

  return score;
                                  }
