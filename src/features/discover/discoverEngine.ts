import type { FixtureListRow } from "@/src/services/apiFootball";
import { getTicketDifficultyBadge } from "@/src/data/ticketGuides";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";
import { POPULAR_TEAM_IDS } from "@/src/data/teams";
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
  | "European away-day feel"
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

function includesAny(text: string, keys: string[]): boolean {
  return keys.some((k) => text.includes(lower(k)));
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
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

function hasPopularTeam(id: unknown): boolean {
  return typeof id === "number" && POPULAR_TEAM_IDS.has(id);
}

function hasClubSignal(name: string, clubs: string[]): boolean {
  const key = lower(name);
  if (!key) return false;
  return clubs.some((club) => key.includes(club));
}

function parseFixtureDate(dateIso?: string | null): Date | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function getLeagueId(f: FixtureListRow): number | null {
  return f?.league?.id != null ? Number(f.league.id) : null;
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
/* Derby definitions                                                          */
/* -------------------------------------------------------------------------- */

type DerbyDefinition = {
  home: string[];
  away: string[];
  score: number;
};

const DERBIES: DerbyDefinition[] = [
  { home: ["arsenal"], away: ["tottenham", "spurs", "tottenham hotspur"], score: 4 },
  { home: ["barcelona", "fc barcelona", "barca"], away: ["real madrid"], score: 5 },
  { home: ["manchester united", "man united"], away: ["manchester city", "man city"], score: 4 },
  { home: ["liverpool"], away: ["everton"], score: 4 },
  { home: ["celtic"], away: ["rangers"], score: 5 },
  { home: ["inter", "inter milan", "internazionale"], away: ["milan", "ac milan"], score: 5 },
  { home: ["roma", "as roma"], away: ["lazio"], score: 4 },
  { home: ["bayern", "bayern munich"], away: ["dortmund", "borussia dortmund"], score: 4 },
  { home: ["sevilla"], away: ["betis", "real betis"], score: 4 },
  { home: ["juventus"], away: ["torino"], score: 3 },
  { home: ["porto", "fc porto"], away: ["boavista"], score: 3 },
  { home: ["olympiacos"], away: ["panathinaikos"], score: 4 },
  { home: ["partizan"], away: ["red star", "red star belgrade", "crvena zvezda"], score: 5 },
  { home: ["hajduk split"], away: ["dinamo zagreb"], score: 4 },
  { home: ["slavia prague"], away: ["sparta prague"], score: 4 },
  { home: ["rapid vienna"], away: ["austria vienna"], score: 4 },
  { home: ["fenerbahce"], away: ["galatasaray"], score: 5 },
  { home: ["besiktas"], away: ["galatasaray"], score: 4 },
  { home: ["besiktas"], away: ["fenerbahce"], score: 4 },
];

/* -------------------------------------------------------------------------- */
/* Prestige / destination / warmth signals                                    */
/* -------------------------------------------------------------------------- */

const LEGENDARY_CLUBS = [
  "real madrid",
  "barcelona",
  "fc barcelona",
  "manchester united",
  "man united",
  "liverpool",
  "bayern",
  "bayern munich",
  "milan",
  "ac milan",
  "inter",
  "inter milan",
  "juventus",
  "dortmund",
  "borussia dortmund",
  "ajax",
  "celtic",
  "rangers",
  "benfica",
  "porto",
  "fc porto",
  "sporting",
  "sporting cp",
  "galatasaray",
  "marseille",
  "napoli",
];

const STRONG_SECOND_TIER_STADIUM_CLUBS = [
  "arsenal",
  "tottenham",
  "tottenham hotspur",
  "chelsea",
  "atletico",
  "atletico madrid",
  "athletic club",
  "athletic bilbao",
  "napoli",
  "marseille",
  "fenerbahce",
  "besiktas",
  "psv",
  "feyenoord",
  "anderlecht",
  "club brugge",
  "sevilla",
  "roma",
  "lazio",
  "olympiacos",
];

const STRONG_VALUE_LEAGUES = [
  "bundesliga",
  "primeira",
  "portugal",
  "belgium",
  "jupiler",
  "austria",
  "czech",
  "croatia",
  "poland",
  "switzerland",
  "greece",
  "turkey",
];

const MID_VALUE_LEAGUES = [
  "netherlands",
  "eredivisie",
  "scotland",
  "denmark",
  "norway",
  "sweden",
  "ireland",
];

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
];

const CULTURE_CLUBS = [
  "athletic",
  "napoli",
  "marseille",
  "galatasaray",
  "fenerbahce",
  "ajax",
  "celtic",
  "rangers",
  "boca",
];

/* -------------------------------------------------------------------------- */
/* Individual score calculators                                               */
/* -------------------------------------------------------------------------- */

function derbyScore(home: string, away: string): number {
  const h = lower(home);
  const a = lower(away);

  for (const d of DERBIES) {
    const forward = includesAny(h, d.home) && includesAny(a, d.away);
    const reverse = includesAny(h, d.away) && includesAny(a, d.home);
    if (forward || reverse) return d.score;
  }

  return 0;
}

function nightMatchScore(dateIso?: string | null): number {
  const d = parseFixtureDate(dateIso);
  if (!d) return 0;

  const hour = d.getUTCHours();

  if (hour >= 20) return 3;
  if (hour >= 18) return 2;
  if (hour >= 16) return 1;
  return 0;
}

function stadiumScore(home: string, away: string): number {
  const homeLegendary = hasClubSignal(home, LEGENDARY_CLUBS);
  const awayLegendary = hasClubSignal(away, LEGENDARY_CLUBS);

  if (homeLegendary) return 3;
  if (hasClubSignal(home, STRONG_SECOND_TIER_STADIUM_CLUBS)) return 2;

  if (awayLegendary) return 2;
  if (hasClubSignal(away, STRONG_SECOND_TIER_STADIUM_CLUBS)) return 1;

  return 0;
}

function valueScore(f: FixtureListRow): number {
  const leagueId = getLeagueId(f);
  if (leagueId === 848) return 3;
  if (leagueId === 3) return 2;
  if (leagueId === 2) return 0;

  const league = lower(f.league?.name);
  const country = lower((f.league as any)?.country);
  const combined = `${league} ${country}`.trim();

  if (!combined) return 0;
  if (STRONG_VALUE_LEAGUES.some((k) => combined.includes(k))) return 3;
  if (MID_VALUE_LEAGUES.some((k) => combined.includes(k))) return 2;

  if (
    combined.includes("premier league") ||
    combined.includes("la liga") ||
    combined.includes("laliga") ||
    combined.includes("serie a") ||
    combined.includes("champions league")
  ) {
    return 0;
  }

  return 1;
}

function titleDramaScore(f: FixtureListRow): number {
  if (isEuropeanCompetition(f)) return 2;

  const round = lower(f.league?.round);
  const league = lower(f.league?.name);

  if (!round) return 0;

  const match = round.match(/(\d{1,2})/);
  const roundNum = match ? Number(match[1]) : null;

  if (!roundNum || !Number.isFinite(roundNum)) return 0;

  const isLongLeague =
    league.includes("premier") ||
    league.includes("championship") ||
    league.includes("serie a") ||
    league.includes("liga") ||
    league.includes("bundesliga") ||
    league.includes("eredivisie") ||
    league.includes("primeira") ||
    league.includes("scottish") ||
    league.includes("super lig");

  if (isLongLeague) {
    if (roundNum >= 34) return 3;
    if (roundNum >= 30) return 2;
    if (roundNum >= 26) return 1;
    return 0;
  }

  if (roundNum >= 28) return 2;
  if (roundNum >= 24) return 1;

  return 0;
}

function cityScore(city: string): number {
  const c = lower(city);
  if (!c) return 0;
  if (ELITE_CITIES.includes(c)) return 3;
  if (STRONG_CITIES.includes(c)) return 2;
  if (NICE_EXTRA_CITIES.includes(c)) return 1;
  return 0;
}

function cultureScore(
  home: string,
  away: string,
  city: string,
  stadium: number,
  atmosphere: number
): number {
  let score = 0;

  score += stadium;
  score += atmosphere >= 4 ? 2 : atmosphere >= 3 ? 1 : 0;

  const c = lower(city);
  if (ELITE_CITIES.includes(c) || STRONG_CITIES.includes(c)) score += 1;

  if (hasClubSignal(home, CULTURE_CLUBS)) score += 1;
  if (hasClubSignal(away, CULTURE_CLUBS)) score += 1;

  return Math.min(score, 5);
}

function nightlifeScore(city: string, night: number): number {
  const c = lower(city);
  let score = night;
  if (NIGHTLIFE_CITIES.includes(c)) score += 2;
  return Math.min(score, 5);
}

function warmWeatherScore(f: FixtureListRow): number {
  const city = lower(f.fixture?.venue?.city);
  const country = lower((f.league as any)?.country);

  let score = 0;
  if (WARM_COUNTRIES.some((k) => country.includes(k))) score += 2;
  if (WARM_CITIES.includes(city)) score += 2;

  return Math.min(score, 4);
}

function ticketEaseScore(f: FixtureListRow): number {
  const home = clean(f?.teams?.home?.name);
  const rawDifficulty = home ? getTicketDifficultyBadge(home) : null;
  const difficulty: TicketDifficulty | "unknown" = rawDifficulty ?? "unknown";
  return ticketDifficultyRank(difficulty);
}

function tripEaseScore(f: FixtureListRow): number {
  const city = lower(f.fixture?.venue?.city);
  const league = lower(f.league?.name);
  const country = lower((f.league as any)?.country);
  const combined = `${city} ${league} ${country}`.trim();

  let score = 0;

  if (
    combined.includes("london") ||
    combined.includes("amsterdam") ||
    combined.includes("paris") ||
    combined.includes("madrid") ||
    combined.includes("barcelona") ||
    combined.includes("rome") ||
    combined.includes("milan") ||
    combined.includes("lisbon")
  ) {
    score += 2;
  }

  if (
    combined.includes("premier league") ||
    combined.includes("la liga") ||
    combined.includes("serie a") ||
    combined.includes("eredivisie") ||
    combined.includes("primeira") ||
    combined.includes("champions league") ||
    combined.includes("europa league") ||
    combined.includes("conference league")
  ) {
    score += 1;
  }

  return Math.min(score, 4);
}

function glamourScore(
  f: FixtureListRow,
  stadium: number,
  city: number,
  derby: number,
  atmosphere: number
): number {
  let score = stadium + city;

  const homeId = f?.teams?.home?.id;
  const awayId = f?.teams?.away?.id;

  if (hasPopularTeam(homeId)) score += 2;
  if (hasPopularTeam(awayId)) score += 2;
  if (derby >= 4) score += 1;
  if (atmosphere >= 4) score += 1;
  if (isChampionsLeague(f)) score += 2;
  else if (isEuropaLeague(f)) score += 1;

  return Math.min(score, 8);
}

function underratedScore(
  f: FixtureListRow,
  atmosphere: number,
  value: number,
  glamour: number
): number {
  let score = atmosphere + value;

  if (glamour <= 3) score += 2;
  if (isConferenceLeague(f)) score += 1;

  const homeId = f?.teams?.home?.id;
  const awayId = f?.teams?.away?.id;

  if (hasPopularTeam(homeId)) score -= 2;
  if (hasPopularTeam(awayId)) score -= 2;

  return Math.max(0, Math.min(score, 6));
}

function europeScore(f: FixtureListRow, glamour: number, atmosphere: number): number {
  if (isChampionsLeague(f)) return Math.min(5, 3 + (glamour >= 5 ? 1 : 0) + (atmosphere >= 4 ? 1 : 0));
  if (isEuropaLeague(f)) return Math.min(4, 2 + (atmosphere >= 4 ? 1 : 0));
  if (isConferenceLeague(f)) return 2;
  return 0;
}

function multiMatchScore(f: FixtureListRow, cityPull: number, tripEase: number): number {
  const city = cityKey(f);

  let score = 0;
  if (cityPull >= 3) score += 2;
  else if (cityPull >= 2) score += 1;

  if (tripEase >= 3) score += 1;

  if (
    city === "london" ||
    city === "istanbul" ||
    city === "madrid" ||
    city === "milan" ||
    city === "rome" ||
    city === "manchester" ||
    city === "liverpool" ||
    city === "glasgow"
  ) {
    score += 2;
  }

  if (isEuropeanCompetition(f)) score += 1;

  return Math.min(score, 5);
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
  if (night >= 2) score += 1;
  if (cityPull >= 2) score += 1;
  if (nightlife >= 3) score += 1;
  if (multiMatch >= 3) score += 1;

  return Math.min(score, 5);
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                    */
/* -------------------------------------------------------------------------- */

export function scoreFixture(f: FixtureListRow): DiscoverFixture {
  const home = clean(f.teams?.home?.name);
  const away = clean(f.teams?.away?.name);
  const city = clean(f.fixture?.venue?.city);

  const derby = derbyScore(home, away);
  const atmosphere = Math.max(atmosphereScore(home), atmosphereScore(away));
  const stadium = stadiumScore(home, away);
  const value = valueScore(f);
  const night = nightMatchScore(f.fixture?.date);
  const drama = titleDramaScore(f);
  const cityPull = cityScore(city);
  const culture = cultureScore(home, away, city, stadium, atmosphere);
  const nightlife = nightlifeScore(city, night);
  const warmth = warmWeatherScore(f);
  const ticketEase = ticketEaseScore(f);
  const tripEase = tripEaseScore(f);
  const glamour = glamourScore(f, stadium, cityPull, derby, atmosphere);
  const underrated = underratedScore(f, atmosphere, value, glamour);
  const europe = europeScore(f, glamour, atmosphere);
  const multiMatch = multiMatchScore(f, cityPull, tripEase);
  const weekendTrip = weekendTripScore(f, night, cityPull, nightlife, multiMatch);

  const reasons: DiscoverReason[] = [];

  if (derby >= 4) reasons.push("Major derby");
  if (atmosphere >= 4) reasons.push("Strong atmosphere club");
  if (stadium >= 3) reasons.push("Legendary stadium");
  if (value >= 3) reasons.push("Good value league");
  if (night >= 2) reasons.push("Evening kickoff");
  if (drama >= 2) reasons.push("Late-season stakes");
  if (ticketEase >= 4) reasons.push("Easier home ticket route");
  if (cityPull >= 2) reasons.push("Strong city-break potential");
  if (tripEase >= 3) reasons.push("Better for a short trip");
  if (nightlife >= 4) reasons.push("Strong nightlife destination");
  if (warmth >= 3) reasons.push("Warmer-weather option");
  if (underrated >= 4) reasons.push("Less obvious high-upside trip");

  if (isChampionsLeague(f)) reasons.push("Champions League night");
  if (isEuropaLeague(f)) reasons.push("Europa League trip");
  if (isConferenceLeague(f) && value >= 2) reasons.push("Conference League value");
  if (isEuropeanCompetition(f) && atmosphere >= 3) reasons.push("European away-day feel");
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
