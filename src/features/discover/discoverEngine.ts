import type { FixtureListRow } from "@/src/services/apiFootball";
import { getTicketDifficultyBadge } from "@/src/data/ticketGuides";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";
import { POPULAR_TEAM_IDS, getTeam, normalizeTeamKey } from "@/src/data/teams";
import { getLeagueById } from "@/src/constants/football";
import { atmosphereScore } from "./atmosphereScore";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type DiscoverReason =
  | "Major derby"
  | "Strong atmosphere club"
  | "Legendary stadium"
  | "Good value league"
  | "Evening kickoff"
  | "Late-season stakes"
  | "Easier home ticket route"
  | "Strong city-break potential"
  | "Better for a short trip"
  | "Strong nightlife destination"
  | "Warmer-weather option"
  | "Less obvious high-upside trip"
  | "Champions League night"
  | "Europa League trip"
  | "Conference League value"
  | "Continental occasion"
  | "Multi-match city potential"
  | "Weekend double potential";

export type DiscoverScores = {
  derbyScore: number;
  atmosphereScore: number;
  stadiumScore: number;
  valueScore: number;
  nightScore: number;
  titleDramaScore: number;
  cityScore: number;
  cultureScore: number;
  nightlifeScore: number;
  warmWeatherScore: number;
  ticketEaseScore: number;
  tripEaseScore: number;
  glamourScore: number;
  underratedScore: number;
  europeScore: number;
  multiMatchScore: number;
  weekendTripScore: number;
};

export type DiscoverFixture = {
  fixture: FixtureListRow;
  scores: DiscoverScores;
  reasons: DiscoverReason[];
};

export type DiscoverTripLength = "day" | "1" | "2" | "3";
export type DiscoverVibe = "easy" | "big" | "nightlife" | "culture" | "warm";

export type DiscoverContext = {
  origin?: string | null;
  tripLength?: DiscoverTripLength | null;
  vibes?: DiscoverVibe[];
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function lower(v: unknown): string {
  return clean(v).toLowerCase();
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hasPopularTeam(id: unknown): boolean {
  return typeof id === "number" && POPULAR_TEAM_IDS.has(id);
}

function parseFixtureDate(dateIso?: string | null): Date | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function getLeagueId(f: FixtureListRow): number | null {
  return f?.league?.id != null ? Number(f.league.id) : null;
}

function getLeagueCountry(f: FixtureListRow): string {
  const fromFixture = lower((f.league as any)?.country);
  if (fromFixture) return fromFixture;

  const leagueId = getLeagueId(f);
  if (!leagueId) return "";
  return lower(getLeagueById(leagueId)?.country);
}

function teamKey(name: string): string {
  const raw = clean(name);
  if (!raw) return "";
  const direct = getTeam(raw);
  if (direct?.teamKey) return direct.teamKey;
  return normalizeTeamKey(raw);
}

function includesTeamKey(target: string, values: string[]): boolean {
  return values.some((value) => target.includes(value));
}

function ticketDifficultyRank(d: TicketDifficulty | "unknown") {
  switch (d) {
    case "easy":
      return 5;
    case "medium":
      return 3;
    case "hard":
      return 2;
    case "very_hard":
      return 1;
    default:
      return 2;
  }
}

function isChampionsLeague(f: FixtureListRow): boolean {
  return getLeagueId(f) === 2;
}

function isEuropaLeague(f: FixtureListRow): boolean {
  return getLeagueId(f) === 3;
}

function isConferenceLeague(f: FixtureListRow): boolean {
  return getLeagueId(f) === 848;
}

function isEuropeanCompetition(f: FixtureListRow): boolean {
  const id = getLeagueId(f);
  return id === 2 || id === 3 || id === 848;
}

function isWeekendFixture(f: FixtureListRow): boolean {
  const d = parseFixtureDate(f?.fixture?.date);
  if (!d) return false;
  const day = d.getUTCDay();
  return day === 5 || day === 6 || day === 0;
}

function cityKey(f: FixtureListRow): string {
  return lower(f?.fixture?.venue?.city);
}

/* -------------------------------------------------------------------------- */
/* League profiles                                                            */
/* -------------------------------------------------------------------------- */

type LeagueProfile = {
  prestige: number;
  value: number;
  travelEase: number;
  culture: number;
  nightlife: number;
  warmth: number;
  stackability: number;
};

const DEFAULT_LEAGUE_PROFILE: LeagueProfile = {
  prestige: 2,
  value: 2,
  travelEase: 2,
  culture: 2,
  nightlife: 2,
  warmth: 1,
  stackability: 1,
};

const LEAGUE_PROFILES: Record<number, LeagueProfile> = {
  2: { prestige: 5, value: 1, travelEase: 4, culture: 4, nightlife: 3, warmth: 1, stackability: 3 },
  3: { prestige: 4, value: 2, travelEase: 4, culture: 4, nightlife: 3, warmth: 1, stackability: 3 },
  848: { prestige: 3, value: 4, travelEase: 4, culture: 3, nightlife: 2, warmth: 1, stackability: 3 },

  39: { prestige: 5, value: 1, travelEase: 5, culture: 4, nightlife: 4, warmth: 0, stackability: 4 },
  140: { prestige: 5, value: 2, travelEase: 4, culture: 4, nightlife: 4, warmth: 4, stackability: 4 },
  135: { prestige: 5, value: 2, travelEase: 4, culture: 5, nightlife: 4, warmth: 4, stackability: 4 },
  78: { prestige: 4, value: 4, travelEase: 4, culture: 4, nightlife: 3, warmth: 0, stackability: 3 },
  61: { prestige: 4, value: 2, travelEase: 4, culture: 3, nightlife: 4, warmth: 1, stackability: 3 },
  88: { prestige: 4, value: 3, travelEase: 4, culture: 4, nightlife: 4, warmth: 0, stackability: 3 },
  94: { prestige: 4, value: 4, travelEase: 4, culture: 4, nightlife: 4, warmth: 4, stackability: 3 },
  179: { prestige: 4, value: 3, travelEase: 3, culture: 5, nightlife: 3, warmth: 0, stackability: 2 },
  203: { prestige: 4, value: 4, travelEase: 3, culture: 5, nightlife: 4, warmth: 3, stackability: 4 },
  144: { prestige: 3, value: 4, travelEase: 4, culture: 3, nightlife: 3, warmth: 0, stackability: 2 },
  218: { prestige: 3, value: 4, travelEase: 3, culture: 3, nightlife: 3, warmth: 0, stackability: 2 },
  207: { prestige: 3, value: 4, travelEase: 3, culture: 3, nightlife: 2, warmth: 0, stackability: 2 },
  197: { prestige: 3, value: 4, travelEase: 3, culture: 5, nightlife: 3, warmth: 3, stackability: 2 },
  119: { prestige: 3, value: 4, travelEase: 3, culture: 3, nightlife: 3, warmth: 0, stackability: 2 },
  345: { prestige: 3, value: 4, travelEase: 3, culture: 4, nightlife: 3, warmth: 0, stackability: 2 },
  106: { prestige: 3, value: 4, travelEase: 3, culture: 4, nightlife: 3, warmth: 0, stackability: 2 },
  210: { prestige: 3, value: 4, travelEase: 3, culture: 4, nightlife: 3, warmth: 3, stackability: 2 },
  286: { prestige: 3, value: 4, travelEase: 2, culture: 5, nightlife: 3, warmth: 1, stackability: 2 },
  271: { prestige: 2, value: 4, travelEase: 3, culture: 3, nightlife: 3, warmth: 1, stackability: 2 },
  283: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 3, warmth: 1, stackability: 2 },
  332: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 3, warmth: 0, stackability: 2 },
  373: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 2, warmth: 1, stackability: 2 },
  172: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 2, warmth: 1, stackability: 1 },
  318: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 3, warmth: 4, stackability: 1 },
  315: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 2, warmth: 1, stackability: 1 },
  357: { prestige: 2, value: 4, travelEase: 3, culture: 3, nightlife: 3, warmth: 0, stackability: 2 },
  113: { prestige: 2, value: 4, travelEase: 3, culture: 4, nightlife: 3, warmth: 0, stackability: 2 },
  103: { prestige: 2, value: 4, travelEase: 3, culture: 4, nightlife: 2, warmth: 0, stackability: 2 },
  244: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 2, warmth: 0, stackability: 1 },
  164: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 2, warmth: 0, stackability: 1 },
};

function getLeagueProfile(f: FixtureListRow): LeagueProfile {
  const leagueId = getLeagueId(f);
  if (!leagueId) return DEFAULT_LEAGUE_PROFILE;
  return LEAGUE_PROFILES[leagueId] ?? DEFAULT_LEAGUE_PROFILE;
}

/* -------------------------------------------------------------------------- */
/* Derby / club / city signals                                                */
/* -------------------------------------------------------------------------- */

type DerbyDefinition = {
  home: string[];
  away: string[];
  score: number;
};

const DERBIES: DerbyDefinition[] = [
  { home: ["arsenal"], away: ["tottenham", "tottenham-hotspur", "spurs"], score: 5 },
  { home: ["manchester-united"], away: ["manchester-city"], score: 5 },
  { home: ["liverpool"], away: ["everton"], score: 5 },
  { home: ["real-madrid"], away: ["barcelona"], score: 5 },
  { home: ["atletico-madrid"], away: ["real-madrid"], score: 4 },
  { home: ["real-betis"], away: ["sevilla"], score: 4 },
  { home: ["inter"], away: ["milan"], score: 5 },
  { home: ["roma"], away: ["lazio"], score: 5 },
  { home: ["juventus"], away: ["torino"], score: 4 },
  { home: ["bayern-munich"], away: ["borussia-dortmund"], score: 4 },
  { home: ["paris-saint-germain"], away: ["marseille"], score: 5 },
  { home: ["ajax"], away: ["feyenoord"], score: 5 },
  { home: ["ajax"], away: ["psv"], score: 4 },
  { home: ["benfica"], away: ["sporting-cp"], score: 5 },
  { home: ["porto"], away: ["benfica"], score: 4 },
  { home: ["porto"], away: ["boavista"], score: 4 },
  { home: ["celtic"], away: ["rangers"], score: 5 },
  { home: ["galatasaray"], away: ["fenerbahce"], score: 5 },
  { home: ["besiktas"], away: ["galatasaray"], score: 4 },
  { home: ["besiktas"], away: ["fenerbahce"], score: 4 },
  { home: ["olympiacos"], away: ["panathinaikos"], score: 5 },
  { home: ["sparta-prague"], away: ["slavia-prague"], score: 5 },
  { home: ["dinamo-zagreb"], away: ["hajduk-split"], score: 5 },
  { home: ["red-star-belgrade"], away: ["partizan"], score: 5 },
  { home: ["rapid-vienna"], away: ["austria-vienna"], score: 4 },
  { home: ["shamrock-rovers"], away: ["bohemians"], score: 4 },
];

const LEGENDARY_CLUB_KEYS = new Set<string>([
  "real-madrid",
  "barcelona",
  "manchester-united",
  "liverpool",
  "bayern-munich",
  "milan",
  "inter",
  "juventus",
  "borussia-dortmund",
  "ajax",
  "celtic",
  "rangers",
  "benfica",
  "porto",
  "sporting-cp",
  "galatasaray",
  "marseille",
  "napoli",
]);

const STRONG_SECOND_TIER_STADIUM_CLUB_KEYS = new Set<string>([
  "arsenal",
  "tottenham-hotspur",
  "chelsea",
  "atletico-madrid",
  "athletic-club",
  "roma",
  "lazio",
  "sevilla",
  "real-betis",
  "fenerbahce",
  "besiktas",
  "psv",
  "feyenoord",
  "anderlecht",
  "club-brugge",
  "olympiacos",
  "slavia-prague",
  "sparta-prague",
  "dinamo-zagreb",
  "red-star-belgrade",
  "partizan",
]);

const HIGH_CULTURE_CLUB_KEYS = new Set<string>([
  "athletic-club",
  "napoli",
  "marseille",
  "galatasaray",
  "fenerbahce",
  "ajax",
  "celtic",
  "rangers",
  "olympiacos",
  "panathinaikos",
  "red-star-belgrade",
  "partizan",
  "dinamo-zagreb",
  "hajduk-split",
  "slavia-prague",
  "sparta-prague",
  "rapid-vienna",
  "ferencvaros",
  "legia-warsaw",
  "shamrock-rovers",
  "bohemians",
]);

const HIGH_ATMOSPHERE_CLUB_KEYS = new Set<string>([
  "borussia-dortmund",
  "eintracht-frankfurt",
  "napoli",
  "marseille",
  "galatasaray",
  "fenerbahce",
  "besiktas",
  "celtic",
  "rangers",
  "ajax",
  "feyenoord",
  "psv",
  "benfica",
  "porto",
  "sporting-cp",
  "olympiacos",
  "panathinaikos",
  "red-star-belgrade",
  "partizan",
  "dinamo-zagreb",
  "hajduk-split",
  "slavia-prague",
  "sparta-prague",
  "legia-warsaw",
  "ferencvaros",
  "malmo",
  "aik",
  "bodo-glimt",
]);

const ELITE_CITIES = [
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
];

const STRONG_CITIES = [
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
  "salzburg",
  "dortmund",
  "copenhagen",
  "stockholm",
  "belgrade",
  "budapest",
];

const NICE_EXTRA_CITIES = [
  "bologna",
  "valencia",
  "bilbao",
  "hamburg",
  "brussels",
  "ghent",
  "antalya",
  "split",
  "nice",
  "lyon",
  "dublin",
];

const NIGHTLIFE_CITIES = [
  "berlin",
  "amsterdam",
  "lisbon",
  "barcelona",
  "madrid",
  "istanbul",
  "rome",
  "milan",
  "paris",
  "porto",
  "prague",
  "budapest",
  "seville",
  "naples",
  "manchester",
  "liverpool",
  "athens",
];

const WARM_COUNTRIES = [
  "spain",
  "portugal",
  "italy",
  "greece",
  "turkey",
  "cyprus",
  "croatia",
];

const WARM_CITIES = [
  "barcelona",
  "madrid",
  "seville",
  "lisbon",
  "porto",
  "rome",
  "naples",
  "istanbul",
  "athens",
  "split",
  "nicosia",
  "valencia",
  "marseille",
];

const STACKABLE_CITIES = new Set<string>([
  "london",
  "istanbul",
  "madrid",
  "milan",
  "rome",
  "manchester",
  "liverpool",
  "glasgow",
  "lisbon",
  "porto",
  "athens",
  "prague",
  "vienna",
  "amsterdam",
  "barcelona",
  "seville",
  "belgrade",
]);

/* -------------------------------------------------------------------------- */
/* Score calculators                                                          */
/* -------------------------------------------------------------------------- */

function derbyScore(home: string, away: string): number {
  const h = teamKey(home);
  const a = teamKey(away);

  for (const d of DERBIES) {
    const forward = includesTeamKey(h, d.home) && includesTeamKey(a, d.away);
    const reverse = includesTeamKey(h, d.away) && includesTeamKey(a, d.home);
    if (forward || reverse) return d.score;
  }

  return 0;
}

function nightMatchScore(dateIso?: string | null): number {
  const d = parseFixtureDate(dateIso);
  if (!d) return 0;

  const hour = d.getUTCHours();

  if (hour >= 20) return 5;
  if (hour >= 18) return 4;
  if (hour >= 16) return 2;
  return 0;
}

function stadiumScore(home: string, away: string): number {
  const homeKey = teamKey(home);
  const awayKey = teamKey(away);

  if (LEGENDARY_CLUB_KEYS.has(homeKey)) return 5;
  if (STRONG_SECOND_TIER_STADIUM_CLUB_KEYS.has(homeKey)) return 4;
  if (LEGENDARY_CLUB_KEYS.has(awayKey)) return 3;
  if (STRONG_SECOND_TIER_STADIUM_CLUB_KEYS.has(awayKey)) return 2;

  return 1;
}

function valueScore(f: FixtureListRow): number {
  const leagueId = getLeagueId(f);
  const profile = getLeagueProfile(f);

  if (leagueId === 848) return 5;
  if (leagueId === 3) return 4;
  if (leagueId === 2) return 1;

  return clamp(profile.value, 1, 5);
}

function titleDramaScore(f: FixtureListRow): number {
  if (isChampionsLeague(f)) return 4;
  if (isEuropaLeague(f)) return 3;
  if (isConferenceLeague(f)) return 2;

  const round = lower(f.league?.round);
  if (!round) return 0;

  const match = round.match(/(\d{1,2})/);
  const roundNum = match ? Number(match[1]) : null;
  if (!roundNum || !Number.isFinite(roundNum)) return 0;

  if (roundNum >= 34) return 5;
  if (roundNum >= 30) return 4;
  if (roundNum >= 26) return 3;
  if (roundNum >= 22) return 2;
  return 1;
}

function cityScore(city: string): number {
  const c = lower(city);
  if (!c) return 0;
  if (ELITE_CITIES.includes(c)) return 5;
  if (STRONG_CITIES.includes(c)) return 4;
  if (NICE_EXTRA_CITIES.includes(c)) return 2;
  return 1;
}

function cultureScore(
  home: string,
  away: string,
  city: string,
  stadium: number,
  atmosphere: number,
  f: FixtureListRow
): number {
  const homeKey = teamKey(home);
  const awayKey = teamKey(away);

  let score = getLeagueProfile(f).culture;

  if (HIGH_CULTURE_CLUB_KEYS.has(homeKey)) score += 2;
  if (HIGH_CULTURE_CLUB_KEYS.has(awayKey)) score += 1;
  if (stadium >= 4) score += 1;
  if (atmosphere >= 4) score += 1;

  const c = lower(city);
  if (ELITE_CITIES.includes(c) || STRONG_CITIES.includes(c)) score += 1;

  return clamp(score, 1, 5);
}

function nightlifeScore(city: string, night: number, f: FixtureListRow): number {
  const c = lower(city);
  let score = getLeagueProfile(f).nightlife;

  if (NIGHTLIFE_CITIES.includes(c)) score += 2;
  if (night >= 4) score += 1;

  return clamp(score, 1, 5);
}

function warmWeatherScore(f: FixtureListRow): number {
  const city = lower(f.fixture?.venue?.city);
  const country = getLeagueCountry(f);

  let score = getLeagueProfile(f).warmth;
  if (WARM_COUNTRIES.some((k) => country.includes(k))) score += 1;
  if (WARM_CITIES.includes(city)) score += 2;

  return clamp(score, 0, 5);
}

function ticketEaseScore(f: FixtureListRow): number {
  const home = clean(f?.teams?.home?.name);
  const rawDifficulty = home ? getTicketDifficultyBadge(home) : null;
  const difficulty: TicketDifficulty | "unknown" = rawDifficulty ?? "unknown";
  return ticketDifficultyRank(difficulty);
}

function tripEaseScore(f: FixtureListRow): number {
  const city = lower(f.fixture?.venue?.city);
  let score = getLeagueProfile(f).travelEase;

  if (
    city === "london" ||
    city === "amsterdam" ||
    city === "paris" ||
    city === "madrid" ||
    city === "barcelona" ||
    city === "rome" ||
    city === "milan" ||
    city === "lisbon" ||
    city === "manchester" ||
    city === "berlin"
  ) {
    score += 1;
  }

  if (isEuropeanCompetition(f)) score += 1;

  return clamp(score, 1, 5);
}

function glamourScore(
  f: FixtureListRow,
  stadium: number,
  city: number,
  derby: number,
  atmosphere: number
): number {
  let score = getLeagueProfile(f).prestige;

  const homeId = f?.teams?.home?.id;
  const awayId = f?.teams?.away?.id;

  if (hasPopularTeam(homeId)) score += 2;
  if (hasPopularTeam(awayId)) score += 2;
  if (stadium >= 4) score += 1;
  if (city >= 4) score += 1;
  if (derby >= 4) score += 1;
  if (atmosphere >= 4) score += 1;
  if (isChampionsLeague(f)) score += 2;
  else if (isEuropaLeague(f)) score += 1;

  return clamp(score, 1, 8);
}

function underratedScore(
  f: FixtureListRow,
  atmosphere: number,
  value: number,
  glamour: number,
  cityPull: number
): number {
  let score = 1;

  if (atmosphere >= 4) score += 2;
  if (value >= 4) score += 2;
  if (cityPull >= 3) score += 1;
  if (glamour <= 4) score += 2;
  if (isConferenceLeague(f)) score += 1;

  const homeId = f?.teams?.home?.id;
  const awayId = f?.teams?.away?.id;

  if (hasPopularTeam(homeId)) score -= 2;
  if (hasPopularTeam(awayId)) score -= 2;

  return clamp(score, 0, 6);
}

function europeScore(f: FixtureListRow, glamour: number, atmosphere: number): number {
  if (isChampionsLeague(f)) {
    return clamp(3 + (glamour >= 6 ? 1 : 0) + (atmosphere >= 4 ? 1 : 0), 0, 5);
  }
  if (isEuropaLeague(f)) {
    return clamp(2 + (atmosphere >= 4 ? 1 : 0) + (glamour >= 5 ? 1 : 0), 0, 5);
  }
  if (isConferenceLeague(f)) {
    return clamp(2 + (atmosphere >= 4 ? 1 : 0), 0, 4);
  }
  return 0;
}

function multiMatchScore(f: FixtureListRow, cityPull: number, tripEase: number): number {
  const city = cityKey(f);
  let score = getLeagueProfile(f).stackability;

  if (cityPull >= 4) score += 1;
  else if (cityPull >= 3) score += 0.5;

  if (tripEase >= 4) score += 1;
  if (STACKABLE_CITIES.has(city)) score += 2;
  if (isEuropeanCompetition(f)) score += 1;

  return clamp(Math.round(score), 0, 5);
}

function weekendTripScore(
  f: FixtureListRow,
  night: number,
  cityPull: number,
  nightlife: number,
  multiMatch: number
): number {
  let score = 0;

  if (isWeekendFixture(f)) score += 2;
  if (night >= 4) score += 1;
  if (cityPull >= 3) score += 1;
  if (nightlife >= 4) score += 1;
  if (multiMatch >= 4) score += 1;

  return clamp(score, 0, 5);
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                    */
/* -------------------------------------------------------------------------- */

export function scoreFixture(f: FixtureListRow): DiscoverFixture {
  const home = clean(f.teams?.home?.name);
  const away = clean(f.teams?.away?.name);
  const city = clean(f.fixture?.venue?.city);

  const derby = derbyScore(home, away);

  let atmosphere = Math.max(
    atmosphereScore(home),
    atmosphereScore(away),
    getLeagueProfile(f).culture
  );

  const homeKey = teamKey(home);
  const awayKey = teamKey(away);

  if (HIGH_ATMOSPHERE_CLUB_KEYS.has(homeKey)) atmosphere += 1;
  if (HIGH_ATMOSPHERE_CLUB_KEYS.has(awayKey)) atmosphere += 1;
  if (derby >= 4) atmosphere += 1;
  atmosphere = clamp(atmosphere, 1, 5);

  const stadium = stadiumScore(home, away);
  const value = valueScore(f);
  const night = nightMatchScore(f.fixture?.date);
  const drama = titleDramaScore(f);
  const cityPull = cityScore(city);
  const culture = cultureScore(home, away, city, stadium, atmosphere, f);
  const nightlife = nightlifeScore(city, night, f);
  const warmth = warmWeatherScore(f);
  const ticketEase = ticketEaseScore(f);
  const tripEase = tripEaseScore(f);
  const glamour = glamourScore(f, stadium, cityPull, derby, atmosphere);
  const underrated = underratedScore(f, atmosphere, value, glamour, cityPull);
  const europe = europeScore(f, glamour, atmosphere);
  const multiMatch = multiMatchScore(f, cityPull, tripEase);
  const weekendTrip = weekendTripScore(f, night, cityPull, nightlife, multiMatch);

  const reasons: DiscoverReason[] = [];

  if (derby >= 4) reasons.push("Major derby");
  if (atmosphere >= 4) reasons.push("Strong atmosphere club");
  if (stadium >= 4) reasons.push("Legendary stadium");
  if (value >= 4) reasons.push("Good value league");
  if (night >= 4) reasons.push("Evening kickoff");
  if (drama >= 4) reasons.push("Late-season stakes");
  if (ticketEase >= 4) reasons.push("Easier home ticket route");
  if (cityPull >= 4) reasons.push("Strong city-break potential");
  if (tripEase >= 4) reasons.push("Better for a short trip");
  if (nightlife >= 4) reasons.push("Strong nightlife destination");
  if (warmth >= 4) reasons.push("Warmer-weather option");
  if (underrated >= 4) reasons.push("Less obvious high-upside trip");

  if (isChampionsLeague(f) && europe >= 4) reasons.push("Champions League night");
  if (isEuropaLeague(f) && europe >= 3) reasons.push("Europa League trip");
  if (isConferenceLeague(f) && value >= 3) reasons.push("Conference League value");
  if (isEuropeanCompetition(f) && (glamour >= 5 || atmosphere >= 4)) {
    reasons.push("Continental occasion");
  }
  if (multiMatch >= 4) reasons.push("Multi-match city potential");
  if (weekendTrip >= 4) reasons.push("Weekend double potential");

  const scores: DiscoverScores = {
    derbyScore: derby,
    atmosphereScore: atmosphere,
    stadiumScore: stadium,
    valueScore: value,
    nightScore: night,
    titleDramaScore: drama,
    cityScore: cityPull,
    cultureScore: culture,
    nightlifeScore: nightlife,
    warmWeatherScore: warmth,
    ticketEaseScore: ticketEase,
    tripEaseScore: tripEase,
    glamourScore: glamour,
    underratedScore: underrated,
    europeScore: europe,
    multiMatchScore: multiMatch,
    weekendTripScore: weekendTrip,
  };

  return {
    fixture: f,
    scores,
    reasons: uniq(reasons),
  };
}

export function buildDiscoverScores(fixtures: FixtureListRow[]): DiscoverFixture[] {
  return fixtures.map(scoreFixture);
}
