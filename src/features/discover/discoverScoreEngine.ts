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
/* Core helpers                                                               */
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

function clampScore(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function getRoundLabel(f: FixtureListRow): string {
  return lower(f?.league?.round);
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

/* -------------------------------------------------------------------------- */
/* League profiles                                                            */
/* -------------------------------------------------------------------------- */

type LeagueProfile = {
  prestige: number;     // big-club / glamour baseline
  value: number;        // better pound-for-experience
  travelEase: number;   // accessibility / airport / common routes
  culture: number;      // football culture density
  nightlife: number;    // destination nightlife pull
  warmth: number;       // climate pull
  stackability: number; // multi-match / city stacking potential
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
  2:   { prestige: 5, value: 1, travelEase: 3, culture: 4, nightlife: 3, warmth: 1, stackability: 3 }, // UCL
  3:   { prestige: 4, value: 2, travelEase: 3, culture: 4, nightlife: 3, warmth: 1, stackability: 3 }, // UEL
  848: { prestige: 3, value: 4, travelEase: 3, culture: 3, nightlife: 2, warmth: 1, stackability: 3 }, // UECL

  39:  { prestige: 5, value: 1, travelEase: 5, culture: 4, nightlife: 4, warmth: 0, stackability: 4 }, // EPL
  140: { prestige: 5, value: 2, travelEase: 4, culture: 4, nightlife: 4, warmth: 4, stackability: 4 }, // La Liga
  135: { prestige: 5, value: 2, travelEase: 4, culture: 5, nightlife: 4, warmth: 4, stackability: 4 }, // Serie A
  78:  { prestige: 4, value: 4, travelEase: 4, culture: 4, nightlife: 3, warmth: 0, stackability: 3 }, // Bundesliga
  61:  { prestige: 4, value: 2, travelEase: 4, culture: 3, nightlife: 4, warmth: 1, stackability: 3 }, // Ligue 1
  88:  { prestige: 4, value: 3, travelEase: 4, culture: 4, nightlife: 4, warmth: 0, stackability: 3 }, // Eredivisie
  94:  { prestige: 4, value: 4, travelEase: 4, culture: 4, nightlife: 4, warmth: 4, stackability: 3 }, // Primeira Liga
  179: { prestige: 4, value: 3, travelEase: 3, culture: 5, nightlife: 3, warmth: 0, stackability: 2 }, // Scotland
  203: { prestige: 4, value: 4, travelEase: 3, culture: 5, nightlife: 4, warmth: 3, stackability: 4 }, // Turkey
  144: { prestige: 3, value: 4, travelEase: 4, culture: 3, nightlife: 3, warmth: 0, stackability: 2 }, // Belgium
  218: { prestige: 3, value: 4, travelEase: 3, culture: 3, nightlife: 3, warmth: 0, stackability: 2 }, // Austria
  207: { prestige: 3, value: 4, travelEase: 3, culture: 3, nightlife: 2, warmth: 0, stackability: 2 }, // Switzerland
  197: { prestige: 3, value: 4, travelEase: 3, culture: 5, nightlife: 3, warmth: 3, stackability: 2 }, // Greece
  119: { prestige: 3, value: 4, travelEase: 3, culture: 3, nightlife: 3, warmth: 0, stackability: 2 }, // Denmark
  345: { prestige: 3, value: 4, travelEase: 3, culture: 4, nightlife: 3, warmth: 0, stackability: 2 }, // Czech
  106: { prestige: 3, value: 4, travelEase: 3, culture: 4, nightlife: 3, warmth: 0, stackability: 2 }, // Poland
  210: { prestige: 3, value: 4, travelEase: 3, culture: 4, nightlife: 3, warmth: 3, stackability: 2 }, // Croatia
  286: { prestige: 3, value: 4, travelEase: 2, culture: 5, nightlife: 3, warmth: 1, stackability: 2 }, // Serbia
  271: { prestige: 2, value: 4, travelEase: 3, culture: 3, nightlife: 3, warmth: 1, stackability: 2 }, // Hungary
  283: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 3, warmth: 1, stackability: 2 }, // Romania
  332: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 3, warmth: 0, stackability: 2 }, // Slovakia
  373: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 2, warmth: 1, stackability: 2 }, // Slovenia
  172: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 2, warmth: 1, stackability: 1 }, // Bulgaria
  318: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 3, warmth: 4, stackability: 1 }, // Cyprus
  315: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 2, warmth: 1, stackability: 1 }, // Bosnia
  357: { prestige: 2, value: 4, travelEase: 3, culture: 3, nightlife: 3, warmth: 0, stackability: 2 }, // Ireland
  113: { prestige: 2, value: 4, travelEase: 3, culture: 4, nightlife: 3, warmth: 0, stackability: 2 }, // Sweden
  103: { prestige: 2, value: 4, travelEase: 3, culture: 4, nightlife: 2, warmth: 0, stackability: 2 }, // Norway
  244: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 2, warmth: 0, stackability: 1 }, // Finland
  164: { prestige: 2, value: 4, travelEase: 2, culture: 3, nightlife: 2, warmth: 0, stackability: 1 }, // Iceland
};

function getLeagueProfile(f: FixtureListRow): LeagueProfile {
  return LEAGUE_PROFILES[getLeagueId(f) ?? -1] ?? DEFAULT_LEAGUE_PROFILE;
}

/* -------------------------------------------------------------------------- */
/* Club / city / derby datasets                                               */
/* -------------------------------------------------------------------------- */

type DerbyDefinition = {
  home: string[];
  away: string[];
  score: number;
};

const DERBIES: DerbyDefinition[] = [
  { home: ["arsenal"], away: ["tottenham-hotspur"], score: 5 },
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
  { home: ["borussia-monchengladbach"], away: ["fc-koln"], score: 4 },
  { home: ["paris-saint-germain"], away: ["marseille"], score: 5 },
  { home: ["lyon"], away: ["saint-etienne"], score: 4 },
  { home: ["ajax"], away: ["feyenoord"], score: 5 },
  { home: ["ajax"], away: ["psv"], score: 4 },
  { home: ["benfica"], away: ["sporting-cp"], score: 5 },
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
  { home: ["red-star-belgrade"], away: ["partizan"], score: 5 },
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

const ELITE_CLUB_KEYS = new Set<string>([
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

const LEGENDARY_STADIUM_CLUB_KEYS = new Set<string>([
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

const HIGH_CULTURE_CLUB_KEYS = new Set<string>([
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

const HIGH_ATMOSPHERE_CLUB_KEYS = new Set<string>([
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

const WARM_COUNTRY_KEYS = [
  "spain",
  "portugal",
  "italy",
  "greece",
  "turkey",
  "cyprus",
  "croatia",
];

/* -------------------------------------------------------------------------- */
/* Score calculators                                                          */
/* -------------------------------------------------------------------------- */

function includesAnyTeamKey(key: string, list: string[]) {
  return list.some((candidate) => key.includes(candidate));
}

function derbyScore(homeName: string, awayName: string): number {
  const homeKey = teamKey(homeName);
  const awayKey = teamKey(awayName);

  for (const d of DERBIES) {
    const forward = includesAnyTeamKey(homeKey, d.home) && includesAnyTeamKey(awayKey, d.away);
    const reverse = includesAnyTeamKey(homeKey, d.away) && includesAnyTeamKey(awayKey, d.home);
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

function stadiumScore(homeName: string, awayName: string): number {
  const homeKey = teamKey(homeName);
  const awayKey = teamKey(awayName);

  if (LEGENDARY_STADIUM_CLUB_KEYS.has(homeKey)) return 5;
  if (LEGENDARY_STADIUM_CLUB_KEYS.has(awayKey)) return 3;
  if (ELITE_CLUB_KEYS.has(homeKey)) return 3;
  if (ELITE_CLUB_KEYS.has(awayKey)) return 2;
  return 1;
}

function valueScore(f: FixtureListRow): number {
  const profile = getLeagueProfile(f);

  if (isChampionsLeague(f)) return 1;
  if (isEuropaLeague(f)) return 3;
  if (isConferenceLeague(f)) return 5;

  return clampScore(profile.value, 1, 5);
}

function titleDramaScore(f: FixtureListRow): number {
  if (isChampionsLeague(f)) return 4;
  if (isEuropaLeague(f)) return 3;
  if (isConferenceLeague(f)) return 2;

  const round = getRoundLabel(f);
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
  return CITY_PULL_SCORES[lower(city)] ?? 1;
}

function cultureScore(
  homeName: string,
  awayName: string,
  city: string,
  stadium: number,
  atmosphere: number,
  f: FixtureListRow
): number {
  const homeKey = teamKey(homeName);
  const awayKey = teamKey(awayName);
  const profile = getLeagueProfile(f);

  let score = Math.max(1, profile.culture);

  if (HIGH_CULTURE_CLUB_KEYS.has(homeKey)) score += 2;
  if (HIGH_CULTURE_CLUB_KEYS.has(awayKey)) score += 1;
  if (stadium >= 4) score += 1;
  if (atmosphere >= 4) score += 1;
  if ((CITY_PULL_SCORES[lower(city)] ?? 0) >= 4) score += 1;

  return clampScore(score, 1, 5);
}

function nightlifeScore(city: string, night: number, f: FixtureListRow): number {
  const profile = getLeagueProfile(f);
  let score = Math.max(1, profile.nightlife);

  score += NIGHTLIFE_CITY_SCORES[lower(city)] ?? 0;
  if (night >= 4) score += 1;

  return clampScore(score, 1, 5);
}

function warmWeatherScore(f: FixtureListRow): number {
  const city = lower(f.fixture?.venue?.city);
  const country =
    lower((f.league as any)?.country) || lower(getLeagueById(getLeagueId(f) ?? -1)?.country);

  let score = getLeagueProfile(f).warmth;
  if (WARM_COUNTRY_KEYS.some((key) => country.includes(key))) score += 1;
  score += WARM_CITY_SCORES[city] ?? 0;

  return clampScore(score, 0, 5);
}

function ticketEaseScore(f: FixtureListRow): number {
  const home = clean(f?.teams?.home?.name);
  const rawDifficulty = home ? getTicketDifficultyBadge(home) : null;
  const difficulty: TicketDifficulty | "unknown" = rawDifficulty ?? "unknown";
  return ticketDifficultyRank(difficulty);
}

function tripEaseScore(f: FixtureListRow): number {
  const city = lower(f.fixture?.venue?.city);
  const profile = getLeagueProfile(f);

  let score = Math.max(1, profile.travelEase);

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
  return clampScore(score, 1, 5);
}

function glamourScore(
  f: FixtureListRow,
  stadium: number,
  cityPull: number,
  derby: number,
  atmosphere: number
): number {
  const homeKey = teamKey(f?.teams?.home?.name);
  const awayKey = teamKey(f?.teams?.away?.name);
  const profile = getLeagueProfile(f);

  let score = profile.prestige;

  if (ELITE_CLUB_KEYS.has(homeKey)) score += 2;
  if (ELITE_CLUB_KEYS.has(awayKey)) score += 2;
  if (hasPopularTeam(f?.teams?.home?.id)) score += 1;
  if (hasPopularTeam(f?.teams?.away?.id)) score += 1;
  if (stadium >= 4) score += 1;
  if (cityPull >= 4) score += 1;
  if (derby >= 4) score += 1;
  if (atmosphere >= 4) score += 1;
  if (isChampionsLeague(f)) score += 2;
  else if (isEuropaLeague(f)) score += 1;

  return clampScore(score, 1, 8);
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

  if (hasPopularTeam(f?.teams?.home?.id)) score -= 2;
  if (hasPopularTeam(f?.teams?.away?.id)) score -= 2;

  return clampScore(score, 0, 6);
}

function europeScore(f: FixtureListRow, glamour: number, atmosphere: number): number {
  if (isChampionsLeague(f)) {
    return clampScore(3 + (glamour >= 6 ? 1 : 0) + (atmosphere >= 4 ? 1 : 0), 0, 5);
  }
  if (isEuropaLeague(f)) {
    return clampScore(2 + (atmosphere >= 4 ? 1 : 0) + (glamour >= 5 ? 1 : 0), 0, 5);
  }
  if (isConferenceLeague(f)) {
    return clampScore(2 + (atmosphere >= 4 ? 1 : 0), 0, 4);
  }
  return 0;
}

function multiMatchScore(f: FixtureListRow, cityPull: number, tripEase: number): number {
  const city = cityKey(f);
  const profile = getLeagueProfile(f);

  let score = profile.stackability;
  score += STACKABLE_CITY_SCORES[city] ?? 0;
  if (cityPull >= 4) score += 1;
  if (tripEase >= 4) score += 1;
  if (isEuropeanCompetition(f)) score += 1;

  return clampScore(score, 0, 5);
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

  return clampScore(score, 0, 5);
}

/* -------------------------------------------------------------------------- */
/* Main scoring                                                               */
/* -------------------------------------------------------------------------- */

export function scoreFixture(f: FixtureListRow): DiscoverFixture {
  const home = clean(f.teams?.home?.name);
  const away = clean(f.teams?.away?.name);
  const city = clean(f.fixture?.venue?.city);

  const leagueProfile = getLeagueProfile(f);

  const derby = derbyScore(home, away);

  let atmosphere = Math.max(atmosphereScore(home), atmosphereScore(away), leagueProfile.culture);
  if (HIGH_ATMOSPHERE_CLUB_KEYS.has(teamKey(home))) atmosphere += 1;
  if (HIGH_ATMOSPHERE_CLUB_KEYS.has(teamKey(away))) atmosphere += 1;
  if (derby >= 4) atmosphere += 1;
  atmosphere = clampScore(atmosphere, 1, 5);

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

  if (isChampionsLeague(f)) reasons.push("Champions League night");
  if (isEuropaLeague(f)) reasons.push("Europa League trip");
  if (isConferenceLeague(f) && value >= 3) reasons.push("Conference League value");
  if (isEuropeanCompetition(f) && (glamour >= 5 || atmosphere >= 4)) reasons.push("Continental occasion");
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
