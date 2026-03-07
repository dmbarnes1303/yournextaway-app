import type { FixtureListRow } from "@/src/services/apiFootball";
import { POPULAR_TEAM_IDS } from "@/src/data/teams";
import type { StadiumRecord } from "@/src/data/stadiums/types";
import type { TravelDifficulty, TripScoreBreakdown } from "./types";

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function toKey(input: string) {
  return String(input ?? "").trim().toLowerCase();
}

function kickoffIsoOrNull(row: FixtureListRow): string | null {
  const raw = String(row?.fixture?.date ?? "").trim();
  return raw || null;
}

function cityAppealScore(city: string, country: string): number {
  const c = toKey(city);
  const k = `${c}|${toKey(country)}`;

  const elite = new Set([
    "barcelona|spain",
    "madrid|spain",
    "rome|italy",
    "milan|italy",
    "naples|italy",
    "amsterdam|netherlands",
    "lisbon|portugal",
    "porto|portugal",
    "paris|france",
    "munich|germany",
    "berlin|germany",
    "hamburg|germany",
    "copenhagen|denmark",
    "zurich|switzerland",
    "geneva|switzerland",
    "basel|switzerland",
    "bern|switzerland",
    "florence|italy",
    "seville|spain",
    "valencia|spain",
    "bilbao|spain",
    "athens|greece",
    "istanbul|turkey",
    "glasgow|scotland",
    "edinburgh|scotland",
    "vienna|austria",
    "prague|czech republic",
    "budapest|hungary",
    "belgrade|serbia",
    "ljubljana|slovenia",
    "split|croatia",
    "dubrovnik|croatia",
    "antalya|turkey",
    "lugano|switzerland",
    "lucerne|switzerland",
    "lausanne|switzerland",
    "thessaloniki|greece",
  ]);

  const strong = new Set([
    "dortmund|germany",
    "cologne|germany",
    "frankfurt|germany",
    "lyon|france",
    "marseille|france",
    "lille|france",
    "nice|france",
    "bologna|italy",
    "turin|italy",
    "verona|italy",
    "bergamo|italy",
    "genoa|italy",
    "lecce|italy",
    "cagliari|italy",
    "girona|spain",
    "san-sebastian|spain",
    "palma|spain",
    "rotterdam|netherlands",
    "utrecht|netherlands",
    "eindhoven|netherlands",
    "aarhus|denmark",
    "salzburg|austria",
    "graz|austria",
    "bruges|belgium",
    "brussels|belgium",
    "ghent|belgium",
    "basel|switzerland",
    "bern|switzerland",
    "geneva|switzerland",
    "lausanne|switzerland",
    "trabzon|turkey",
    "naples|italy",
  ]);

  if (elite.has(k)) return 95;
  if (strong.has(k)) return 80;
  if (c) return 60;
  return 40;
}

function leagueStrengthScore(leagueId?: number | null): number {
  if (leagueId === 39) return 96;
  if (leagueId === 140) return 93;
  if (leagueId === 135) return 92;
  if (leagueId === 78) return 90;
  if (leagueId === 61) return 85;
  if (leagueId === 88) return 80;
  if (leagueId === 94) return 78;
  if (leagueId === 203) return 72;
  if (leagueId === 179) return 70;
  if (leagueId === 197) return 69;
  if (leagueId === 207) return 67;
  if (leagueId === 218) return 66;
  if (leagueId === 119) return 64;
  if (leagueId === 244) return 58;
  if (leagueId === 103) return 62;
  if (leagueId === 113) return 61;
  return 55;
}

export function getTravelDifficulty(stadium: StadiumRecord | null): TravelDifficulty {
  const km = stadium?.distanceFromAirportKm;

  if (typeof km !== "number") {
    return stadium?.transit?.length ? "moderate" : "hard";
  }

  if (km <= 15) return "easy";
  if (km <= 35) return "moderate";
  if (km <= 80) return "hard";
  return "complex";
}

export function getTravelDifficultyScore(stadium: StadiumRecord | null): number {
  const difficulty = getTravelDifficulty(stadium);

  let score =
    difficulty === "easy" ? 92 :
    difficulty === "moderate" ? 74 :
    difficulty === "hard" ? 48 :
    24;

  if (stadium?.transit?.length) score += 6;
  if (stadium?.stayAreas?.length) score += 4;

  return clamp(score);
}

export function getWeekendTripScore(row: FixtureListRow, stadium: StadiumRecord | null): number {
  const city = String(stadium?.city ?? row?.fixture?.venue?.city ?? "").trim();
  const country = String(stadium?.country ?? "").trim();

  let score = 0;

  score += cityAppealScore(city, country) * 0.45;
  score += getTravelDifficultyScore(stadium) * 0.25;

  if (stadium?.stayAreas?.length) score += 12;
  if (stadium?.tips?.length) score += 8;
  if (stadium?.transit?.length) score += 8;

  const iso = kickoffIsoOrNull(row);
  if (iso) {
    const dt = new Date(iso);
    if (!Number.isNaN(dt.getTime())) {
      const day = dt.getDay();
      const hour = dt.getHours();

      if (day === 5 || day === 6 || day === 0) score += 8;
      if (hour >= 17 && hour <= 21) score += 6;
    }
  }

  return clamp(Math.round(score));
}

export function getAtmosphereScore(row: FixtureListRow, stadium: StadiumRecord | null): number {
  const leagueId = Number(row?.league?.id ?? 0);
  const homeId = typeof row?.teams?.home?.id === "number" ? row.teams.home.id : null;
  const awayId = typeof row?.teams?.away?.id === "number" ? row.teams.away.id : null;
  const homeName = String(row?.teams?.home?.name ?? "").toLowerCase();
  const awayName = String(row?.teams?.away?.name ?? "").toLowerCase();
  const city = String(stadium?.city ?? row?.fixture?.venue?.city ?? "").toLowerCase();

  let score = leagueStrengthScore(leagueId) * 0.45;

  if (homeId && POPULAR_TEAM_IDS.has(homeId)) score += 18;
  if (awayId && POPULAR_TEAM_IDS.has(awayId)) score += 16;

  if (stadium?.capacity && stadium.capacity >= 50000) score += 10;
  else if (stadium?.capacity && stadium.capacity >= 30000) score += 6;

  const rivalryHints = [
    ["real madrid", "atletico"],
    ["barcelona", "espanyol"],
    ["milan", "inter"],
    ["roma", "lazio"],
    ["celtic", "rangers"],
    ["galatasaray", "fenerbahce"],
    ["olympiacos", "panathinaikos"],
    ["ajax", "feyenoord"],
    ["benfica", "porto"],
    ["partizan", "red star"],
  ];

  const isRivalry = rivalryHints.some(
    ([a, b]) =>
      (homeName.includes(a) && awayName.includes(b)) ||
      (homeName.includes(b) && awayName.includes(a))
  );

  if (isRivalry) score += 18;

  if (city === "istanbul" || city === "athens" || city === "glasgow" || city === "naples" || city === "dortmund") {
    score += 4;
  }

  return clamp(Math.round(score));
}

export function getMatchInterestScore(row: FixtureListRow): number {
  const leagueId = Number(row?.league?.id ?? 0);
  const homeId = typeof row?.teams?.home?.id === "number" ? row.teams.home.id : null;
  const awayId = typeof row?.teams?.away?.id === "number" ? row.teams.away.id : null;
  const round = String(row?.league?.round ?? "").toLowerCase();

  let score = leagueStrengthScore(leagueId) * 0.5;

  if (homeId && POPULAR_TEAM_IDS.has(homeId)) score += 15;
  if (awayId && POPULAR_TEAM_IDS.has(awayId)) score += 15;
  if (homeId && awayId && POPULAR_TEAM_IDS.has(homeId) && POPULAR_TEAM_IDS.has(awayId)) score += 12;

  if (round.includes("playoff") || round.includes("final")) score += 10;

  const iso = kickoffIsoOrNull(row);
  if (iso) {
    const dt = new Date(iso);
    if (!Number.isNaN(dt.getTime())) {
      const day = dt.getDay();
      const hour = dt.getHours();
      if (day === 5 || day === 6 || day === 0) score += 6;
      if (hour >= 17 && hour <= 21) score += 4;
    }
  }

  return clamp(Math.round(score));
}

export function getTripFinderBreakdown(row: FixtureListRow, stadium: StadiumRecord | null): TripScoreBreakdown {
  const travelDifficulty = getTravelDifficulty(stadium);
  const travelDifficultyScore = getTravelDifficultyScore(stadium);
  const weekendTripScore = getWeekendTripScore(row, stadium);
  const atmosphereScore = getAtmosphereScore(row, stadium);
  const matchInterestScore = getMatchInterestScore(row);

  const combinedScore = clamp(
    Math.round(
      weekendTripScore * 0.35 +
      atmosphereScore * 0.25 +
      matchInterestScore * 0.20 +
      travelDifficultyScore * 0.20
    )
  );

  const reasonLines: string[] = [];

  if (weekendTripScore >= 85) reasonLines.push("Excellent city-break potential");
  else if (weekendTripScore >= 72) reasonLines.push("Strong weekend-trip base");

  if (atmosphereScore >= 85) reasonLines.push("Big-match atmosphere potential");
  else if (atmosphereScore >= 72) reasonLines.push("Strong football atmosphere");

  if (travelDifficulty === "easy") reasonLines.push("Easy airport-to-stadium logistics");
  else if (travelDifficulty === "moderate") reasonLines.push("Manageable travel logistics");

  if (!reasonLines.length) reasonLines.push("Solid overall trip option");

  return {
    travelDifficulty,
    travelDifficultyScore,
    weekendTripScore,
    atmosphereScore,
    matchInterestScore,
    combinedScore,
    reasonLines: reasonLines.slice(0, 3),
  };
    }
