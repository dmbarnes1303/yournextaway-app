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

export type DiscoverSignals = {
  homeTeamKey: string;
  awayTeamKey: string;
  leagueId: number | null;
  leagueCountry: string;
  cityKey: string;
  isEuropeanCompetition: boolean;
  isChampionsLeague: boolean;
  isEuropaLeague: boolean;
  isConferenceLeague: boolean;
  isWeekendFixture: boolean;
  isEveningKickoff: boolean;
  hasPopularHomeTeam: boolean;
  hasPopularAwayTeam: boolean;
  ticketDifficulty: TicketDifficulty | "unknown";
};

export type DiscoverFixture = {
  fixture: FixtureListRow;
  scores: DiscoverScores;
  reasons: DiscoverReason[];
  signals: DiscoverSignals;
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

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function lower(value: unknown): string {
  return clean(value).toLowerCase();
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function clampScore(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hasPopularTeam(id: unknown): boolean {
  return typeof id === "number" && POPULAR_TEAM_IDS.has(id);
}

function parseFixtureDate(dateIso?: string | null): Date | null {
  const value = clean(dateIso);
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLeagueId(fixture: FixtureListRow): number | null {
  return fixture?.league?.id != null ? Number(fixture.league.id) : null;
}

function getLeagueCountry(fixture: FixtureListRow): string {
  const fromFixture = lower((fixture.league as any)?.country);
  if (fromFixture) return fromFixture;

  const leagueId = getLeagueId(fixture);
  if (!leagueId) return "";

  return lower(getLeagueById(leagueId)?.country);
}

function getRoundLabel(fixture: FixtureListRow): string {
  return lower(fixture?.league?.round);
}

function isChampionsLeague(fixture: FixtureListRow): boolean {
  return getLeagueId(fixture) === 2;
}

function isEuropaLeague(fixture: FixtureListRow): boolean {
  return getLeagueId(fixture) === 3;
}

function isConferenceLeague(fixture: FixtureListRow): boolean {
  return getLeagueId(fixture) === 848;
}

function isEuropeanCompetition(fixture: FixtureListRow): boolean {
  return isChampionsLeague(fixture) || isEuropaLeague(fixture) || isConferenceLeague(fixture);
}

function isWeekendFixture(fixture: FixtureListRow): boolean {
  const date = parseFixtureDate(fixture?.fixture?.date);
  if (!date) return false;

  const day = date.getUTCDay();
  return day === 5 || day === 6 || day === 0;
}

function isEveningKickoff(fixture: FixtureListRow): boolean {
  const date = parseFixtureDate(fixture?.fixture?.date);
  if (!date) return false;

  return date.getUTCHours() >= 18;
}

function cityKey(fixture: FixtureListRow): string {
  return lower(fixture?.fixture?.venue?.city);
}

function resolveTeamMeta(input?: string | null) {
  const raw = clean(input);
  if (!raw) return null;
  return getTeam(raw) ?? null;
}

function teamKey(input?: string | null): string {
  const meta = resolveTeamMeta(input);
  if (meta?.teamKey) return meta.teamKey;
  return normalizeTeamKey(clean(input));
}

function ticketDifficultyRank(difficulty: TicketDifficulty | "unknown"): number {
  switch (difficulty) {
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

/* -------------------------------------------------------------------------- */
/* Profiles                                                                   */
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
  2: { prestige: 5, value: 1, travelEase: 3, culture: 4, nightlife: 3, warmth: 1, stackability: 3 },
  3: { prestige: 4, value: 2, travelEase: 3, culture: 4, nightlife: 3, warmth: 1, stackability: 3 },
  848: { prestige: 3, value: 4, travelEase: 3, culture: 3, nightlife: 2, warmth: 1, stackability: 3 },

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

function getLeagueProfile(fixture: FixtureListRow): LeagueProfile {
  return LEAGUE_PROFILES[getLeagueId(fixture) ?? -1] ?? DEFAULT_LEAGUE_PROFILE;
}

/* -------------------------------------------------------------------------- */
/* Datasets                                                                   */
/* -------------------------------------------------------------------------- */

type DerbyDefinition = {
  home: string[];
  away: string[];
  score: number;
};

const DERBIES: DerbyDefinition[] = [
  { home: ["arsenal"], away: ["tottenham-hotspur", "tottenham"], score: 5 },
  { home: ["manchester-united"], away: ["manchester-city"], score: 5 },
  { home: ["liverpool"], away: ["everton"], score: 5 },
  { home: ["newcastle-united"], away: ["sunderland"], score: 4 },
  { home: ["real-madrid"], away: ["barcelona"], score: 5 },
  { home: ["atletico-madrid"], away: ["real-madrid"], score: 4 },
  { home: ["real-betis"], away: ["sevilla"], score: 4 },
  { home: ["athletic-club"], away: ["real-sociedad"], score: 4 },
  { home: ["inter"], away: ["milan"], score: 5 },
  { home: ["roma"], away: ["lazio"], score: 5 },
  { home: ["juventus"], away: ["torino"], score: 4 },
  { home: ["napoli"], away: ["roma"], score: 3 },
  { home: ["bayern-munich"], away: ["borussia-dortmund"], score: 4 },
  { home: ["hamburger-sv"], away: ["st-pauli"], score: 4 },
  { home: ["borussia-monchengladbach"], away: ["fc-koln", "koln"], score: 4 },
  { home: ["paris-saint-germain"], away: ["marseille"], score: 5 },
  { home: ["lyon"], away: ["saint-etienne"], score: 4 },
  { home: ["ajax"], away: ["feyenoord"], score: 5 },
  { home: ["ajax"], away: ["psv"], score: 4 },
  { home: ["benfica"], away: ["sporting-cp", "sporting"], score: 5 },
  { home: ["porto"], away: ["benfica"], score: 4 },
  { home: ["porto"], away: ["boavista"], score: 4 },
  { home: ["celtic"], away: ["rangers"], score: 5 },
  { home: ["galatasaray"], away: ["fenerbahce"], score: 5 },
  { home: ["besiktas"], away: ["galatasaray"], score: 4 },
  { home: ["besiktas"], away: ["fenerbahce"], score: 4 },
  { home: ["anderlecht"], away: ["club-brugge"], score: 4 },
  { home: ["olympiacos"], away: ["panathinaikos"], score: 5 },
  { home: ["aek-athens"], away: ["panathinaikos"], score: 4 },
  { home: ["aek-athens"], away: ["olympiacos"], score: 4 },
  { home: ["rapid-vienna"], away: ["austria-vienna"], score: 4 },
  { home: ["sparta-prague"], away: ["slavia-prague"], score: 5 },
  { home: ["legia-warsaw"], away: ["lech-poznan"], score: 4 },
  { home: ["dinamo-zagreb"], away: ["hajduk-split"], score: 5 },
  { home: ["red-star-belgrade", "crvena-zvezda"], away: ["partizan"], score: 5 },
  { home: ["ferencvaros"], away: ["ujpest"], score: 4 },
  { home: ["fcsb"], away: ["dinamo-bucuresti"], score: 4 },
  { home: ["slovan-bratislava"], away: ["spartak-trnava"], score: 4 },
  { home: ["maribor"], away: ["olimpija-ljubljana"], score: 4 },
  { home: ["levski-sofia"], away: ["cska-sofia"], score: 4 },
  { home: ["apoel"], away: ["omonia-nicosia"], score: 4 },
  { home: ["shamrock-rovers"], away: ["bohemians"], score: 4 },
  { home: ["malmo"], away: ["aik"], score: 3 },
  { home: ["ifk-goteborg"], away: ["malmo"], score: 3 },
  { home: ["rosenborg"], away: ["valerenga"], score: 3 },
];

const ELITE_CLUB_KEYS = new Set([
  "real-madrid",
  "barcelona",
  "atletico-madrid",
  "arsenal",
  "liverpool",
  "manchester-united",
  "manchester-city",
  "chelsea",
  "tottenham-hotspur",
  "inter",
  "milan",
  "juventus",
  "napoli",
  "roma",
  "lazio",
  "bayern-munich",
  "borussia-dortmund",
  "paris-saint-germain",
  "marseille",
  "ajax",
  "psv",
  "feyenoord",
  "benfica",
  "porto",
  "sporting-cp",
  "celtic",
  "rangers",
  "galatasaray",
  "fenerbahce",
  "besiktas",
]);

const LEGENDARY_STADIUM_CLUB_KEYS = new Set([
  "real-madrid",
  "barcelona",
  "manchester-united",
  "liverpool",
  "arsenal",
  "bayern-munich",
  "borussia-dortmund",
  "milan",
  "inter",
  "roma",
  "napoli",
  "ajax",
  "benfica",
  "porto",
  "celtic",
  "rangers",
  "galatasaray",
  "olympiacos",
  "marseille",
  "atletico-madrid",
  "athletic-club",
]);

const HIGH_CULTURE_CLUB_KEYS = new Set([
  "athletic-club",
  "real-betis",
  "sevilla",
  "napoli",
  "roma",
  "lazio",
  "marseille",
  "ajax",
  "feyenoord",
  "celtic",
  "rangers",
  "galatasaray",
  "fenerbahce",
  "besiktas",
  "olympiacos",
  "panathinaikos",
  "red-star-belgrade",
  "partizan",
  "dinamo-zagreb",
  "hajduk-split",
  "legia-warsaw",
  "sparta-prague",
  "slavia-prague",
  "rapid-vienna",
  "ferencvaros",
  "shamrock-rovers",
  "bohemians",
]);

const HIGH_ATMOSPHERE_CLUB_KEYS = new Set([
  "borussia-dortmund",
  "eintracht-frankfurt",
  "st-pauli",
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
  "paok",
  "red-star-belgrade",
  "partizan",
  "dinamo-zagreb",
  "hajduk-split",
  "slavia-prague",
  "sparta-prague",
  "rapid-vienna",
  "ferencvaros",
  "legia-warsaw",
  "malmo",
  "aik",
  "bodo-glimt",
]);

const CITY_PULL_SCORES: Record<string, number> = {
  london: 5,
  madrid: 5,
  barcelona: 5,
  milan: 5,
  rome: 5,
  munich: 4,
  amsterdam: 4,
  lisbon: 4,
  paris: 4,
  istanbul: 4,
  liverpool: 4,
  manchester: 4,
  naples: 4,
  glasgow: 4,
  porto: 3,
  seville: 3,
  turin: 3,
  marseille: 3,
  berlin: 3,
  vienna: 3,
  prague: 3,
  zagreb: 3,
  athens: 3,
  split: 3,
  bologna: 2,
  valencia: 2,
  bilbao: 2,
  copenhagen: 2,
  stockholm: 2,
  budapest: 2,
  rotterdam: 2,
  salzburg: 2,
};

const NIGHTLIFE_CITY_SCORES: Record<string, number> = {
  berlin: 5,
  amsterdam: 5,
  barcelona: 5,
  madrid: 5,
  lisbon: 4,
  istanbul: 4,
  rome: 4,
  milan: 4,
  paris: 4,
  porto: 4,
  prague: 4,
  budapest: 4,
  seville: 3,
  naples: 3,
  manchester: 3,
  liverpool: 3,
  athens: 3,
  glasgow: 3,
};

const WARM_CITY_SCORES: Record<string, number> = {
  barcelona: 4,
  madrid: 3,
  seville: 5,
  lisbon: 4,
  porto: 3,
  rome: 4,
  naples: 4,
  athens: 4,
  split: 4,
  nicosia: 5,
  istanbul: 3,
  valencia: 4,
  marseille: 3,
};

const STACKABLE_CITY_SCORES: Record<string, number> = {
  london: 5,
  istanbul: 5,
  madrid: 4,
  milan: 4,
  rome: 4,
  manchester: 4,
  liverpool: 4,
  glasgow: 4,
  lisbon: 4,
  porto: 3,
  athens: 3,
  vienna: 3,
  prague: 3,
  amsterdam: 3,
  barcelona: 3,
  seville: 3,
  belgrade: 3,
};

const EASY_TRAVEL_CITIES = new Set([
  "london",
  "amsterdam",
  "paris",
  "madrid",
  "barcelona",
  "rome",
  "milan",
  "lisbon",
  "manchester",
  "berlin",
]);

const WARM_COUNTRY_KEYS = ["spain", "portugal", "italy", "greece", "turkey", "cyprus", "croatia"];

/* -------------------------------------------------------------------------- */
/* Score calculators                                                          */
/* -------------------------------------------------------------------------- */

function includesAnyTeamKey(key: string, list: string[]): boolean {
  return list.some((candidate) => key.includes(candidate));
}

function derbyScore(homeName: string, awayName: string): number {
  const home = teamKey(homeName);
  const away = teamKey(awayName);

  for (const derby of DERBIES) {
    const forward = includesAnyTeamKey(home, derby.home) && includesAnyTeamKey(away, derby.away);
    const reverse = includesAnyTeamKey(home, derby.away) && includesAnyTeamKey(away, derby.home);
    if (forward || reverse) return derby.score;
  }

  return 0;
}

function nightMatchScore(dateIso?: string | null): number {
  const date = parseFixtureDate(dateIso);
  if (!date) return 0;

  const hour = date.getUTCHours();
  if (hour >= 20) return 5;
  if (hour >= 18) return 4;
  if (hour >= 16) return 2;
  return 0;
}

function stadiumScore(homeName: string, awayName: string): number {
  const home = teamKey(homeName);
  const away = teamKey(awayName);

  if (LEGENDARY_STADIUM_CLUB_KEYS.has(home)) return 5;
  if (LEGENDARY_STADIUM_CLUB_KEYS.has(away)) return 3;
  if (ELITE_CLUB_KEYS.has(home)) return 3;
  if (ELITE_CLUB_KEYS.has(away)) return 2;
  return 1;
}

function valueScore(fixture: FixtureListRow): number {
  const profile = getLeagueProfile(fixture);

  if (isChampionsLeague(fixture)) return 1;
  if (isEuropaLeague(fixture)) return 3;
  if (isConferenceLeague(fixture)) return 5;

  return clampScore(profile.value, 1, 5);
}

function titleDramaScore(fixture: FixtureListRow): number {
  if (isChampionsLeague(fixture)) return 4;
  if (isEuropaLeague(fixture)) return 3;
  if (isConferenceLeague(fixture)) return 2;

  const round = getRoundLabel(fixture);
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
  return CITY_PULL_SCORES[lower(city)] ?? 1;
}

function cultureScore(args: {
  fixture: FixtureListRow;
  home: string;
  away: string;
  city: string;
  stadium: number;
  atmosphere: number;
}): number {
  const profile = getLeagueProfile(args.fixture);
  const homeKey = teamKey(args.home);
  const awayKey = teamKey(args.away);

  let score = Math.max(1, profile.culture);

  if (HIGH_CULTURE_CLUB_KEYS.has(homeKey)) score += 2;
  if (HIGH_CULTURE_CLUB_KEYS.has(awayKey)) score += 1;
  if (args.stadium >= 4) score += 1;
  if (args.atmosphere >= 4) score += 1;
  if (cityScore(args.city) >= 4) score += 1;

  return clampScore(score, 1, 5);
}

function nightlifeScore(fixture: FixtureListRow, city: string, night: number): number {
  let score = Math.max(1, getLeagueProfile(fixture).nightlife);

  score += NIGHTLIFE_CITY_SCORES[lower(city)] ?? 0;
  if (night >= 4) score += 1;

  return clampScore(score, 1, 5);
}

function warmWeatherScore(fixture: FixtureListRow): number {
  const city = cityKey(fixture);
  const country = getLeagueCountry(fixture);

  let score = getLeagueProfile(fixture).warmth;

  if (WARM_COUNTRY_KEYS.some((key) => country.includes(key))) score += 1;
  score += WARM_CITY_SCORES[city] ?? 0;

  return clampScore(score, 0, 5);
}

function getTicketDifficulty(fixture: FixtureListRow): TicketDifficulty | "unknown" {
  const home = clean(fixture?.teams?.home?.name);
  const away = clean(fixture?.teams?.away?.name);
  const leagueId = getLeagueId(fixture);

  return (
    (home ? getTicketDifficultyBadge(home, leagueId) : null) ??
    (away ? getTicketDifficultyBadge(away, leagueId) : null) ??
    "unknown"
  );
}

function ticketEaseScore(fixture: FixtureListRow): number {
  return ticketDifficultyRank(getTicketDifficulty(fixture));
}

function tripEaseScore(fixture: FixtureListRow): number {
  const city = cityKey(fixture);
  let score = Math.max(1, getLeagueProfile(fixture).travelEase);

  if (EASY_TRAVEL_CITIES.has(city)) score += 1;
  if (isEuropeanCompetition(fixture)) score += 1;

  return clampScore(score, 1, 5);
}

function glamourScore(args: {
  fixture: FixtureListRow;
  homeKey: string;
  awayKey: string;
  stadium: number;
  cityPull: number;
  derby: number;
  atmosphere: number;
}): number {
  let score = getLeagueProfile(args.fixture).prestige;

  if (ELITE_CLUB_KEYS.has(args.homeKey)) score += 2;
  if (ELITE_CLUB_KEYS.has(args.awayKey)) score += 2;
  if (hasPopularTeam(args.fixture?.teams?.home?.id)) score += 1;
  if (hasPopularTeam(args.fixture?.teams?.away?.id)) score += 1;
  if (args.stadium >= 4) score += 1;
  if (args.cityPull >= 4) score += 1;
  if (args.derby >= 4) score += 1;
  if (args.atmosphere >= 4) score += 1;
  if (isChampionsLeague(args.fixture)) score += 2;
  else if (isEuropaLeague(args.fixture)) score += 1;

  return clampScore(score, 1, 8);
}

function underratedScore(args: {
  fixture: FixtureListRow;
  atmosphere: number;
  value: number;
  glamour: number;
  cityPull: number;
}): number {
  let score = 1;

  if (args.atmosphere >= 4) score += 2;
  if (args.value >= 4) score += 2;
  if (args.cityPull >= 3) score += 1;
  if (args.glamour <= 4) score += 2;
  if (isConferenceLeague(args.fixture)) score += 1;

  if (hasPopularTeam(args.fixture?.teams?.home?.id)) score -= 2;
  if (hasPopularTeam(args.fixture?.teams?.away?.id)) score -= 2;

  return clampScore(score, 0, 6);
}

function europeScore(fixture: FixtureListRow, glamour: number, atmosphere: number): number {
  if (isChampionsLeague(fixture)) {
    return clampScore(3 + (glamour >= 6 ? 1 : 0) + (atmosphere >= 4 ? 1 : 0), 0, 5);
  }

  if (isEuropaLeague(fixture)) {
    return clampScore(2 + (glamour >= 5 ? 1 : 0) + (atmosphere >= 4 ? 1 : 0), 0, 5);
  }

  if (isConferenceLeague(fixture)) {
    return clampScore(2 + (atmosphere >= 4 ? 1 : 0), 0, 4);
  }

  return 0;
}

function multiMatchScore(fixture: FixtureListRow, cityPull: number, tripEase: number): number {
  const city = cityKey(fixture);
  let score = getLeagueProfile(fixture).stackability;

  score += STACKABLE_CITY_SCORES[city] ?? 0;
  if (cityPull >= 4) score += 1;
  if (tripEase >= 4) score += 1;
  if (isEuropeanCompetition(fixture)) score += 1;

  return clampScore(score, 0, 5);
}

function weekendTripScore(args: {
  fixture: FixtureListRow;
  night: number;
  cityPull: number;
  nightlife: number;
  multiMatch: number;
}): number {
  let score = 0;

  if (isWeekendFixture(args.fixture)) score += 2;
  if (args.night >= 4) score += 1;
  if (args.cityPull >= 3) score += 1;
  if (args.nightlife >= 4) score += 1;
  if (args.multiMatch >= 4) score += 1;

  return clampScore(score, 0, 5);
}

function buildSignals(fixture: FixtureListRow, homeTeamKey: string, awayTeamKey: string): DiscoverSignals {
  return {
    homeTeamKey,
    awayTeamKey,
    leagueId: getLeagueId(fixture),
    leagueCountry: getLeagueCountry(fixture),
    cityKey: cityKey(fixture),
    isEuropeanCompetition: isEuropeanCompetition(fixture),
    isChampionsLeague: isChampionsLeague(fixture),
    isEuropaLeague: isEuropaLeague(fixture),
    isConferenceLeague: isConferenceLeague(fixture),
    isWeekendFixture: isWeekendFixture(fixture),
    isEveningKickoff: isEveningKickoff(fixture),
    hasPopularHomeTeam: hasPopularTeam(fixture?.teams?.home?.id),
    hasPopularAwayTeam: hasPopularTeam(fixture?.teams?.away?.id),
    ticketDifficulty: getTicketDifficulty(fixture),
  };
}

/* -------------------------------------------------------------------------- */
/* Main scoring                                                               */
/* -------------------------------------------------------------------------- */

export function scoreFixture(fixture: FixtureListRow): DiscoverFixture {
  const home = clean(fixture?.teams?.home?.name);
  const away = clean(fixture?.teams?.away?.name);
  const city = clean(fixture?.fixture?.venue?.city);

  const homeTeamKey = teamKey(home);
  const awayTeamKey = teamKey(away);
  const leagueProfile = getLeagueProfile(fixture);

  const derby = derbyScore(home, away);

  let atmosphere = Math.max(atmosphereScore(home), atmosphereScore(away), leagueProfile.culture);
  if (HIGH_ATMOSPHERE_CLUB_KEYS.has(homeTeamKey)) atmosphere += 1;
  if (HIGH_ATMOSPHERE_CLUB_KEYS.has(awayTeamKey)) atmosphere += 1;
  if (derby >= 4) atmosphere += 1;
  atmosphere = clampScore(atmosphere, 1, 5);

  const stadium = stadiumScore(home, away);
  const value = valueScore(fixture);
  const night = nightMatchScore(fixture?.fixture?.date);
  const drama = titleDramaScore(fixture);
  const cityPull = cityScore(city);
  const culture = cultureScore({ fixture, home, away, city, stadium, atmosphere });
  const nightlife = nightlifeScore(fixture, city, night);
  const warmth = warmWeatherScore(fixture);
  const ticketEase = ticketEaseScore(fixture);
  const tripEase = tripEaseScore(fixture);
  const glamour = glamourScore({
    fixture,
    homeKey: homeTeamKey,
    awayKey: awayTeamKey,
    stadium,
    cityPull,
    derby,
    atmosphere,
  });
  const underrated = underratedScore({ fixture, atmosphere, value, glamour, cityPull });
  const europe = europeScore(fixture, glamour, atmosphere);
  const multiMatch = multiMatchScore(fixture, cityPull, tripEase);
  const weekendTrip = weekendTripScore({
    fixture,
    night,
    cityPull,
    nightlife,
    multiMatch,
  });

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
  if (isChampionsLeague(fixture)) reasons.push("Champions League night");
  if (isEuropaLeague(fixture)) reasons.push("Europa League trip");
  if (isConferenceLeague(fixture) && value >= 3) reasons.push("Conference League value");
  if (isEuropeanCompetition(fixture) && (glamour >= 5 || atmosphere >= 4)) {
    reasons.push("Continental occasion");
  }
  if (multiMatch >= 4) reasons.push("Multi-match city potential");
  if (weekendTrip >= 4) reasons.push("Weekend double potential");

  return {
    fixture,
    scores: {
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
    },
    reasons: uniq(reasons),
    signals: buildSignals(fixture, homeTeamKey, awayTeamKey),
  };
}

export function buildDiscoverScores(fixtures: FixtureListRow[]): DiscoverFixture[] {
  return fixtures.map(scoreFixture);
                                                    }
