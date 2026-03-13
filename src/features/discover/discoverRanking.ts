import type { FixtureListRow } from "@/src/services/apiFootball";
import { getTicketDifficultyBadge } from "@/src/data/ticketGuides";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";
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

function leagueWeight(leagueId: number | null): number {
  if (leagueId === 39) return 120;
  if (leagueId === 140) return 105;
  if (leagueId === 135) return 100;
  if (leagueId === 78) return 95;
  if (leagueId === 61) return 90;
  if (leagueId === 88) return 82;
  if (leagueId === 94) return 80;
  if (leagueId === 203) return 78;
  if (leagueId === 179) return 75;
  return 60;
}

export function baseFixtureScore(r: FixtureListRow): number {
  const lid = r?.league?.id != null ? Number(r.league.id) : null;
  let s = leagueWeight(lid);

  const homeId = r?.teams?.home?.id;
  const awayId = r?.teams?.away?.id;

  if (typeof homeId === "number" && POPULAR_TEAM_IDS.has(homeId)) s += 60;
  if (typeof awayId === "number" && POPULAR_TEAM_IDS.has(awayId)) s += 60;

  const venue = String(r?.fixture?.venue?.name ?? "").trim();
  const city = String(r?.fixture?.venue?.city ?? "").trim();

  if (venue) s += 10;
  if (city) s += 6;

  const dt = r?.fixture?.date ? new Date(r.fixture.date) : null;
  if (dt && !Number.isNaN(dt.getTime())) {
    const day = dt.getDay();
    if (day === 5 || day === 6 || day === 0) s += 12;

    const hr = dt.getHours();
    if (hr >= 17 && hr <= 21) s += 8;
  }

  return s;
}

function ticketDifficultyRank(d: TicketDifficulty | "unknown") {
  switch (d) {
    case "easy":
      return 4;
    case "medium":
      return 3;
    case "hard":
      return 2;
    case "very_hard":
      return 1;
    default:
      return 0;
  }
}

function vibesFromContext(ctx?: DiscoverContext | null): DiscoverVibe[] {
  return Array.isArray(ctx?.vibes) ? ctx!.vibes.filter(Boolean) : [];
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
      boost += scored.scores.ticketEaseScore * 10 + scored.scores.tripEaseScore * 8;
    } else if (vibe === "big") {
      boost += scored.scores.derbyScore * 10 + scored.scores.glamourScore * 8;
    } else if (vibe === "nightlife") {
      boost += scored.scores.nightlifeScore * 10 + scored.scores.nightScore * 8;
    } else if (vibe === "culture") {
      boost += scored.scores.cultureScore * 10 + scored.scores.cityScore * 8;
    } else if (vibe === "warm") {
      boost += scored.scores.warmWeatherScore * 12;
    }
  }

  return boost;
}

function tripLengthBoost(scored: DiscoverFixture, ctx?: DiscoverContext | null) {
  const tripLength = tripLengthFromContext(ctx);
  if (!tripLength) return 0;

  if (tripLength === "day") {
    return scored.scores.tripEaseScore * 14 + scored.scores.ticketEaseScore * 8;
  }

  if (tripLength === "1") {
    return scored.scores.tripEaseScore * 10 + scored.scores.cityScore * 6;
  }

  if (tripLength === "2") {
    return scored.scores.cityScore * 10 + scored.scores.cultureScore * 8;
  }

  return (
    scored.scores.cityScore * 12 +
    scored.scores.cultureScore * 10 +
    scored.scores.nightlifeScore * 8 +
    scored.scores.warmWeatherScore * 6
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
    cityPrestigeScore(city) * 50 +
    baseFixtureScore(scored.fixture) +
    scored.scores.stadiumScore * 18 +
    scored.scores.cultureScore * 16 +
    scored.scores.nightlifeScore * 10
  );
}

function bucketListScore(scored: DiscoverFixture) {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.stadiumScore * 36 +
    scored.scores.atmosphereScore * 26 +
    scored.scores.derbyScore * 18 +
    scored.scores.nightScore * 12 +
    scored.scores.cityScore * 14
  );
}

function perfectTripScore(scored: DiscoverFixture) {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.atmosphereScore * 24 +
    scored.scores.valueScore * 20 +
    scored.scores.cityScore * 18 +
    scored.scores.cultureScore * 18 +
    scored.scores.tripEaseScore * 18 +
    scored.scores.nightlifeScore * 12 +
    scored.scores.ticketEaseScore * 10
  );
}

function underratedTripScore(scored: DiscoverFixture) {
  const r = scored.fixture;
  const base = baseFixtureScore(r);

  const homeId = r?.teams?.home?.id;
  const awayId = r?.teams?.away?.id;

  const glamourPenalty =
    (typeof homeId === "number" && POPULAR_TEAM_IDS.has(homeId) ? 28 : 0) +
    (typeof awayId === "number" && POPULAR_TEAM_IDS.has(awayId) ? 28 : 0);

  return (
    base +
    scored.scores.underratedScore * 34 +
    scored.scores.atmosphereScore * 18 +
    scored.scores.valueScore * 18 +
    scored.scores.cityScore * 10 -
    glamourPenalty
  );
}

export function discoverScoreForCategory(
  category: DiscoverCategory,
  scored: DiscoverFixture,
  ctx?: DiscoverContext | null
): number {
  const r = scored.fixture;
  const base = baseFixtureScore(r);

  const home = String(r?.teams?.home?.name ?? "");
  const rawDifficulty = home ? getTicketDifficultyBadge(home) : null;
  const difficulty: TicketDifficulty | "unknown" = rawDifficulty ?? "unknown";
  const easyRank = ticketDifficultyRank(difficulty);

  let score = 0;

  switch (category) {
    case "bigMatches":
      score =
        base +
        scored.scores.derbyScore * 34 +
        scored.scores.atmosphereScore * 22 +
        scored.scores.glamourScore * 16 +
        scored.scores.nightScore * 12 +
        scored.scores.titleDramaScore * 18;
      break;

    case "derbies":
      score =
        base +
        scored.scores.derbyScore * 60 +
        scored.scores.atmosphereScore * 16 +
        scored.scores.nightScore * 8;
      break;

    case "atmospheres":
      score =
        base +
        scored.scores.atmosphereScore * 42 +
        scored.scores.derbyScore * 14 +
        scored.scores.cultureScore * 10 +
        scored.scores.nightScore * 10;
      break;

    case "valueTrips":
      score =
        base * 0.4 +
        scored.scores.valueScore * 58 +
        scored.scores.ticketEaseScore * 12 +
        scored.scores.tripEaseScore * 10 +
        scored.scores.nightScore * 6;
      break;

    case "legendaryStadiums":
      score =
        base +
        scored.scores.stadiumScore * 52 +
        scored.scores.atmosphereScore * 10 +
        scored.scores.cityScore * 12 +
        scored.scores.derbyScore * 8;
      break;

    case "iconicCities":
      score = iconicCityScore(scored);
      break;

    case "perfectTrips":
      score = perfectTripScore(scored);
      break;

    case "nightMatches":
      score =
        base +
        scored.scores.nightScore * 56 +
        scored.scores.nightlifeScore * 18 +
        scored.scores.atmosphereScore * 14 +
        scored.scores.derbyScore * 10;
      break;

    case "titleDrama":
      score =
        base +
        scored.scores.titleDramaScore * 60 +
        scored.scores.derbyScore * 10 +
        scored.scores.atmosphereScore * 10;
      break;

    case "easyTickets":
      score =
        easyRank * 80 +
        scored.scores.ticketEaseScore * 18 +
        scored.scores.tripEaseScore * 12 +
        scored.scores.valueScore * 10 +
        base * 0.18;
      break;

    case "bucketList":
      score = bucketListScore(scored);
      break;

    case "matchdayCulture":
      score =
        base +
        scored.scores.cultureScore * 34 +
        scored.scores.atmosphereScore * 24 +
        scored.scores.cityScore * 16 +
        scored.scores.derbyScore * 12;
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
