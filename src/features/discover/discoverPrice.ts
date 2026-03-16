import { getLeagueById } from "@/src/constants/football";
import { getTicketDifficultyBadge } from "@/src/data/ticketGuides";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";
import { getTeam } from "@/src/data/teams";
import type { FixtureListRow } from "@/src/services/apiFootball";

export type DiscoverPriceConfidence = "low" | "medium" | "high";

export type DiscoverPriceEstimate = {
  ticketFromGbp: number | null;
  tripFromGbp: number | null;
  hotelNightFromGbp: number | null;
  flightFromGbp: number | null;
  confidence: DiscoverPriceConfidence;
  ticketLabel: string | null;
  tripLabel: string | null;
};

type LeaguePricingProfile = {
  ticketBase: number;
  hotelBase: number;
  flightBase: number;
  prestige: number; // 1-5
  value: number; // 1-5 (higher = better value / cheaper relative trip)
};

type CityCostProfile = {
  hotelDelta: number;
  flightDelta: number;
};

const DEFAULT_LEAGUE_PROFILE: LeaguePricingProfile = {
  ticketBase: 28,
  hotelBase: 68,
  flightBase: 78,
  prestige: 2,
  value: 3,
};

const LEAGUE_PRICING: Record<number, LeaguePricingProfile> = {
  // UEFA
  2: { ticketBase: 105, hotelBase: 92, flightBase: 84, prestige: 5, value: 1 },
  3: { ticketBase: 72, hotelBase: 84, flightBase: 78, prestige: 4, value: 2 },
  848: { ticketBase: 48, hotelBase: 76, flightBase: 72, prestige: 3, value: 4 },

  // Big 5
  39: { ticketBase: 82, hotelBase: 96, flightBase: 58, prestige: 5, value: 1 },
  140: { ticketBase: 66, hotelBase: 86, flightBase: 74, prestige: 5, value: 2 },
  135: { ticketBase: 62, hotelBase: 88, flightBase: 76, prestige: 5, value: 2 },
  78: { ticketBase: 54, hotelBase: 84, flightBase: 68, prestige: 4, value: 4 },
  61: { ticketBase: 52, hotelBase: 86, flightBase: 70, prestige: 4, value: 2 },

  // Strong second tier
  88: { ticketBase: 42, hotelBase: 82, flightBase: 62, prestige: 4, value: 3 },
  94: { ticketBase: 38, hotelBase: 74, flightBase: 70, prestige: 4, value: 4 },
  203: { ticketBase: 40, hotelBase: 70, flightBase: 82, prestige: 4, value: 4 },
  179: { ticketBase: 34, hotelBase: 82, flightBase: 52, prestige: 4, value: 3 },
  144: { ticketBase: 32, hotelBase: 78, flightBase: 58, prestige: 3, value: 4 },
  218: { ticketBase: 28, hotelBase: 76, flightBase: 64, prestige: 3, value: 4 },
  197: { ticketBase: 30, hotelBase: 70, flightBase: 84, prestige: 3, value: 4 },
  119: { ticketBase: 28, hotelBase: 78, flightBase: 64, prestige: 3, value: 4 },
  345: { ticketBase: 26, hotelBase: 68, flightBase: 66, prestige: 3, value: 4 },
  106: { ticketBase: 26, hotelBase: 64, flightBase: 68, prestige: 3, value: 4 },
  210: { ticketBase: 25, hotelBase: 66, flightBase: 74, prestige: 3, value: 4 },
  286: { ticketBase: 24, hotelBase: 62, flightBase: 78, prestige: 3, value: 4 },
  207: { ticketBase: 24, hotelBase: 82, flightBase: 68, prestige: 3, value: 3 },

  // Value depth
  271: { ticketBase: 22, hotelBase: 58, flightBase: 72, prestige: 2, value: 4 },
  283: { ticketBase: 22, hotelBase: 56, flightBase: 76, prestige: 2, value: 4 },
  332: { ticketBase: 21, hotelBase: 58, flightBase: 72, prestige: 2, value: 4 },
  373: { ticketBase: 21, hotelBase: 60, flightBase: 72, prestige: 2, value: 4 },
  172: { ticketBase: 20, hotelBase: 54, flightBase: 76, prestige: 2, value: 4 },
  318: { ticketBase: 22, hotelBase: 62, flightBase: 88, prestige: 2, value: 4 },
  315: { ticketBase: 20, hotelBase: 52, flightBase: 78, prestige: 2, value: 4 },

  // Calendar / Nordics / Ireland
  357: { ticketBase: 22, hotelBase: 74, flightBase: 50, prestige: 2, value: 4 },
  113: { ticketBase: 24, hotelBase: 82, flightBase: 72, prestige: 2, value: 4 },
  103: { ticketBase: 24, hotelBase: 88, flightBase: 78, prestige: 2, value: 4 },
  244: { ticketBase: 24, hotelBase: 84, flightBase: 82, prestige: 2, value: 4 },
  164: { ticketBase: 24, hotelBase: 96, flightBase: 110, prestige: 2, value: 3 },
};

const CITY_COSTS: Record<string, CityCostProfile> = {
  london: { hotelDelta: 30, flightDelta: -20 },
  manchester: { hotelDelta: 14, flightDelta: -18 },
  liverpool: { hotelDelta: 10, flightDelta: -18 },
  glasgow: { hotelDelta: 12, flightDelta: -15 },

  paris: { hotelDelta: 28, flightDelta: -8 },
  amsterdam: { hotelDelta: 26, flightDelta: -8 },
  munich: { hotelDelta: 24, flightDelta: -4 },
  milan: { hotelDelta: 18, flightDelta: 0 },
  rome: { hotelDelta: 18, flightDelta: 2 },

  madrid: { hotelDelta: 14, flightDelta: 4 },
  barcelona: { hotelDelta: 18, flightDelta: 6 },
  lisbon: { hotelDelta: 10, flightDelta: 6 },
  porto: { hotelDelta: 4, flightDelta: 8 },

  istanbul: { hotelDelta: 8, flightDelta: 18 },
  athens: { hotelDelta: 4, flightDelta: 18 },
  naples: { hotelDelta: 4, flightDelta: 10 },
  seville: { hotelDelta: 2, flightDelta: 10 },
  valencia: { hotelDelta: 0, flightDelta: 10 },
  marseille: { hotelDelta: 4, flightDelta: 8 },
  prague: { hotelDelta: -4, flightDelta: 8 },
  vienna: { hotelDelta: 8, flightDelta: 6 },
  budapest: { hotelDelta: -8, flightDelta: 10 },
  zagreb: { hotelDelta: -6, flightDelta: 12 },
  split: { hotelDelta: 2, flightDelta: 18 },
  reykjavik: { hotelDelta: 28, flightDelta: 34 },
  nicosia: { hotelDelta: 8, flightDelta: 26 },
};

const BIG_CLUB_TOKENS = [
  "real madrid",
  "barcelona",
  "atletico madrid",
  "arsenal",
  "chelsea",
  "liverpool",
  "manchester city",
  "manchester united",
  "tottenham",
  "newcastle",
  "inter",
  "milan",
  "ac milan",
  "juventus",
  "napoli",
  "roma",
  "lazio",
  "bayern",
  "borussia dortmund",
  "paris saint-germain",
  "psg",
  "marseille",
  "ajax",
  "feyenoord",
  "psv",
  "benfica",
  "porto",
  "sporting",
  "celtic",
  "rangers",
  "galatasaray",
  "fenerbahce",
  "besiktas",
];

const DERBY_PAIRS: Array<[string[], string[], number]> = [
  [["arsenal"], ["tottenham", "spurs"], 4],
  [["barcelona", "barca"], ["real madrid"], 5],
  [["manchester united", "man united"], ["manchester city", "man city"], 4],
  [["liverpool"], ["everton"], 4],
  [["celtic"], ["rangers"], 5],
  [["inter"], ["milan", "ac milan"], 5],
  [["roma"], ["lazio"], 4],
  [["fenerbahce"], ["galatasaray"], 5],
  [["real betis", "betis"], ["sevilla"], 4],
  [["atletico madrid"], ["real madrid"], 4],
  [["ajax"], ["feyenoord"], 5],
  [["olympiacos"], ["panathinaikos"], 5],
  [["red star", "crvena zvezda"], ["partizan"], 5],
  [["dinamo zagreb"], ["hajduk split"], 5],
  [["sparta prague"], ["slavia prague"], 5],
  [["benfica"], ["sporting"], 5],
  [["porto"], ["benfica"], 4],
];

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function lower(value: unknown): string {
  return clean(value).toLowerCase();
}

function safeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function roundToNearest5(value: number): number {
  return Math.max(0, Math.round(value / 5) * 5);
}

function getLeagueId(row: FixtureListRow): number | null {
  const id = row?.league?.id;
  return typeof id === "number" ? id : safeNumber(id);
}

function getLeagueName(row: FixtureListRow): string {
  return clean(row?.league?.name);
}

function getLeagueCountry(row: FixtureListRow): string {
  const fromFixture = clean((row?.league as any)?.country);
  if (fromFixture) return fromFixture;

  const leagueId = getLeagueId(row);
  if (!leagueId) return "";

  return clean(getLeagueById(leagueId)?.country);
}

function getCity(row: FixtureListRow): string {
  return clean(row?.fixture?.venue?.city);
}

function getVenue(row: FixtureListRow): string {
  return clean(row?.fixture?.venue?.name);
}

function getHomeName(row: FixtureListRow): string {
  return clean(row?.teams?.home?.name);
}

function getAwayName(row: FixtureListRow): string {
  return clean(row?.teams?.away?.name);
}

function kickoffDate(row: FixtureListRow): Date | null {
  const raw = clean(row?.fixture?.date);
  if (!raw) return null;
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isWeekend(row: FixtureListRow): boolean {
  const dt = kickoffDate(row);
  if (!dt) return false;
  const day = dt.getUTCDay();
  return day === 5 || day === 6 || day === 0;
}

function isEvening(row: FixtureListRow): boolean {
  const dt = kickoffDate(row);
  if (!dt) return false;
  const hour = dt.getUTCHours();
  return hour >= 18 && hour <= 21;
}

function isEuropeanCompetition(row: FixtureListRow): boolean {
  const leagueId = getLeagueId(row);
  if (leagueId === 2 || leagueId === 3 || leagueId === 848) return true;

  const league = lower(getLeagueName(row));
  return (
    league.includes("champions league") ||
    league.includes("europa league") ||
    league.includes("conference league")
  );
}

function leagueProfile(row: FixtureListRow): LeaguePricingProfile {
  const leagueId = getLeagueId(row);
  if (leagueId && LEAGUE_PRICING[leagueId]) return LEAGUE_PRICING[leagueId];

  const league = lower(getLeagueName(row));
  const country = lower(getLeagueCountry(row));
  const combined = `${league} ${country}`;

  if (combined.includes("champions league")) return LEAGUE_PRICING[2];
  if (combined.includes("europa league")) return LEAGUE_PRICING[3];
  if (combined.includes("conference league")) return LEAGUE_PRICING[848];
  if (combined.includes("premier league")) return LEAGUE_PRICING[39];
  if (combined.includes("la liga")) return LEAGUE_PRICING[140];
  if (combined.includes("serie a")) return LEAGUE_PRICING[135];
  if (combined.includes("bundesliga")) return LEAGUE_PRICING[78];
  if (combined.includes("ligue 1")) return LEAGUE_PRICING[61];
  if (combined.includes("eredivisie")) return LEAGUE_PRICING[88];
  if (combined.includes("primeira liga")) return LEAGUE_PRICING[94];
  if (combined.includes("super lig")) return LEAGUE_PRICING[203];

  return DEFAULT_LEAGUE_PROFILE;
}

function isBigClub(name: string): boolean {
  const key = lower(name);
  if (!key) return false;
  return BIG_CLUB_TOKENS.some((club) => key.includes(club));
}

function derbyIntensity(row: FixtureListRow): number {
  const home = lower(getHomeName(row));
  const away = lower(getAwayName(row));

  for (const [a, b, score] of DERBY_PAIRS) {
    const forward = a.some((x) => home.includes(x)) && b.some((x) => away.includes(x));
    const reverse = a.some((x) => away.includes(x)) && b.some((x) => home.includes(x));
    if (forward || reverse) return score;
  }

  return 0;
}

function ticketDifficulty(row: FixtureListRow): TicketDifficulty {
  const home = getHomeName(row);
  const away = getAwayName(row);

  const guideDifficulty =
    getTicketDifficultyBadge(home, getLeagueId(row)) ??
    getTicketDifficultyBadge(away, getLeagueId(row)) ??
    null;

  if (guideDifficulty) return guideDifficulty;

  const profile = leagueProfile(row);
  const derby = derbyIntensity(row);
  const bigCount = Number(isBigClub(home)) + Number(isBigClub(away));

  if (derby >= 5) return "very_hard";
  if (isEuropeanCompetition(row) && bigCount >= 1) return "very_hard";
  if (profile.prestige >= 5 && bigCount >= 2) return "hard";
  if (profile.prestige >= 4 && derby >= 3) return "hard";
  if (profile.prestige >= 4 && bigCount >= 1) return "medium";
  if (profile.value >= 4 && profile.prestige <= 2) return "easy";

  return "medium";
}

function cityCostProfile(city: string): CityCostProfile {
  return CITY_COSTS[lower(city)] ?? { hotelDelta: 0, flightDelta: 0 };
}

function countryHotelAdjustment(country: string): number {
  const key = lower(country);

  if (
    ["spain", "portugal", "italy", "greece", "turkey", "croatia"].some((x) =>
      key.includes(x)
    )
  ) {
    return -6;
  }

  if (
    ["france", "germany", "netherlands", "belgium", "switzerland", "austria"].some((x) =>
      key.includes(x)
    )
  ) {
    return 4;
  }

  if (
    ["poland", "czech", "hungary", "romania", "slovakia", "slovenia", "serbia", "bulgaria", "bosnia"].some(
      (x) => key.includes(x)
    )
  ) {
    return -10;
  }

  if (["iceland", "norway", "sweden", "finland", "denmark"].some((x) => key.includes(x))) {
    return 14;
  }

  return 0;
}

function countryFlightAdjustment(country: string): number {
  const key = lower(country);

  if (["england", "scotland", "ireland"].some((x) => key.includes(x))) return -14;
  if (
    ["france", "germany", "netherlands", "belgium"].some((x) => key.includes(x))
  ) {
    return -4;
  }
  if (
    ["spain", "portugal", "italy", "austria", "switzerland", "czech republic"].some((x) =>
      key.includes(x)
    )
  ) {
    return 6;
  }
  if (
    ["greece", "turkey", "croatia", "cyprus", "iceland"].some((x) => key.includes(x))
  ) {
    return 18;
  }

  return 10;
}

function hotelNightFloor(row: FixtureListRow): number {
  const profile = leagueProfile(row);
  const city = getCity(row);
  const country = getLeagueCountry(row);
  const cityAdj = cityCostProfile(city);

  let value =
    profile.hotelBase +
    cityAdj.hotelDelta +
    countryHotelAdjustment(country);

  if (isWeekend(row)) value += 8;
  if (isEuropeanCompetition(row)) value += 6;

  return roundToNearest5(value);
}

function flightFloor(row: FixtureListRow): number {
  const profile = leagueProfile(row);
  const city = getCity(row);
  const country = getLeagueCountry(row);
  const cityAdj = cityCostProfile(city);

  let value =
    profile.flightBase +
    cityAdj.flightDelta +
    countryFlightAdjustment(country);

  if (isWeekend(row)) value += 6;
  if (isEuropeanCompetition(row)) value += 4;

  return roundToNearest5(value);
}

function ticketFloor(row: FixtureListRow): number {
  const profile = leagueProfile(row);
  const home = getHomeName(row);
  const away = getAwayName(row);
  const difficulty = ticketDifficulty(row);
  const derby = derbyIntensity(row);

  let value = profile.ticketBase;

  if (isBigClub(home)) value += 10;
  if (isBigClub(away)) value += 10;

  if (derby >= 5) value += 35;
  else if (derby >= 4) value += 24;
  else if (derby >= 3) value += 14;

  if (isWeekend(row)) value += 8;
  if (isEvening(row)) value += 5;
  if (isEuropeanCompetition(row)) value += 10;

  if (difficulty === "easy") value -= 10;
  if (difficulty === "medium") value += 0;
  if (difficulty === "hard") value += 14;
  if (difficulty === "very_hard") value += 30;

  return roundToNearest5(value);
}

function tripFloor(
  row: FixtureListRow,
  hotelNightFromGbp: number,
  flightFromGbp: number,
  ticketFromGbp: number
): number {
  let value = hotelNightFromGbp + flightFromGbp + ticketFromGbp;

  if (isWeekend(row)) value += 12;
  if (isEvening(row)) value += 4;

  return roundToNearest5(value);
}

function confidenceFor(row: FixtureListRow): DiscoverPriceConfidence {
  const venue = getVenue(row);
  const city = getCity(row);
  const league = getLeagueName(row);
  const country = getLeagueCountry(row);
  const home = getHomeName(row);
  const away = getAwayName(row);
  const leagueId = getLeagueId(row);
  const kickoff = kickoffDate(row);

  let score = 0;

  if (venue) score += 1;
  if (city) score += 1;
  if (league) score += 1;
  if (country) score += 1;
  if (home) score += 1;
  if (away) score += 1;
  if (leagueId != null) score += 1;
  if (kickoff) score += 1;

  if (getTeam(home)?.teamKey) score += 1;
  if (getTeam(away)?.teamKey) score += 1;

  if (getTicketDifficultyBadge(home, leagueId) || getTicketDifficultyBadge(away, leagueId)) {
    score += 2;
  }

  if (score >= 10) return "high";
  if (score >= 7) return "medium";
  return "low";
}

export function formatFromPrice(value: number | null, prefix = "From"): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return `${prefix} £${Math.round(value)}`;
}

export function estimateFixturePricing(row: FixtureListRow): DiscoverPriceEstimate {
  const hotelNightFromGbp = hotelNightFloor(row);
  const flightFromGbp = flightFloor(row);
  const ticketFromGbp = ticketFloor(row);
  const tripFromGbp = tripFloor(row, hotelNightFromGbp, flightFromGbp, ticketFromGbp);
  const confidence = confidenceFor(row);

  return {
    ticketFromGbp,
    tripFromGbp,
    hotelNightFromGbp,
    flightFromGbp,
    confidence,
    ticketLabel: formatFromPrice(ticketFromGbp),
    tripLabel: formatFromPrice(tripFromGbp),
  };
}
