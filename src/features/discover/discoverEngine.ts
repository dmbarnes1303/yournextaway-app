import type { FixtureListRow } from "@/src/services/apiFootball";
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
  | "Late-season stakes";

export type DiscoverScores = {
  derbyScore: number;
  atmosphereScore: number;
  stadiumScore: number;
  valueScore: number;
  nightScore: number;
  titleDramaScore: number;
};

export type DiscoverFixture = {
  fixture: FixtureListRow;
  scores: DiscoverScores;
  reasons: DiscoverReason[];
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
];

/* -------------------------------------------------------------------------- */
/* Club prestige / atmosphere signals                                         */
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
];

const STRONG_SECOND_TIER_STADIUM_CLUBS = [
  "arsenal",
  "tottenham",
  "tottenham hotspur",
  "chelsea",
  "atletico",
  "atletico madrid",
  "napoli",
  "marseille",
  "galatasaray",
  "fenerbahce",
  "besiktas",
  "psv",
  "feyenoord",
  "anderlecht",
  "club brugge",
  "sevilla",
  "roma",
  "lazio",
];

/* -------------------------------------------------------------------------- */
/* Value signals                                                              */
/* -------------------------------------------------------------------------- */

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
];

const MID_VALUE_LEAGUES = [
  "netherlands",
  "eredivisie",
  "scotland",
  "denmark",
  "norway",
  "sweden",
];

/* -------------------------------------------------------------------------- */
/* Derby detection                                                            */
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

/* -------------------------------------------------------------------------- */
/* Night kickoff scoring                                                      */
/* -------------------------------------------------------------------------- */

function nightMatchScore(dateIso?: string | null): number {
  if (!dateIso) return 0;

  const d = new Date(dateIso);
  if (!Number.isFinite(d.getTime())) return 0;

  const hour = d.getHours();

  if (hour >= 20) return 3;
  if (hour >= 18) return 2;
  if (hour >= 16) return 1;

  return 0;
}

/* -------------------------------------------------------------------------- */
/* Stadium / prestige scoring                                                 */
/* -------------------------------------------------------------------------- */

function stadiumScore(home: string): number {
  const h = lower(home);

  if (LEGENDARY_CLUBS.some((club) => h.includes(club))) return 3;
  if (STRONG_SECOND_TIER_STADIUM_CLUBS.some((club) => h.includes(club))) return 2;

  return 0;
}

/* -------------------------------------------------------------------------- */
/* Value scoring                                                              */
/* -------------------------------------------------------------------------- */

function valueScore(f: FixtureListRow): number {
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

/* -------------------------------------------------------------------------- */
/* Title drama scoring                                                        */
/* -------------------------------------------------------------------------- */

function titleDramaScore(f: FixtureListRow): number {
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

/* -------------------------------------------------------------------------- */
/* Scoring                                                                    */
/* -------------------------------------------------------------------------- */

export function scoreFixture(f: FixtureListRow): DiscoverFixture {
  const home = clean(f.teams?.home?.name);
  const away = clean(f.teams?.away?.name);

  const derby = derbyScore(home, away);
  const atmosphere = atmosphereScore(home);
  const stadium = stadiumScore(home);
  const value = valueScore(f);
  const night = nightMatchScore(f.fixture?.date);
  const drama = titleDramaScore(f);

  const reasons: DiscoverReason[] = [];

  if (derby >= 4) reasons.push("Major derby");
  if (atmosphere >= 3) reasons.push("Strong atmosphere club");
  if (stadium >= 3) reasons.push("Legendary stadium");
  if (value >= 3) reasons.push("Good value league");
  if (night >= 2) reasons.push("Evening kickoff");
  if (drama >= 2) reasons.push("Late-season stakes");

  const scores: DiscoverScores = {
    derbyScore: derby,
    atmosphereScore: atmosphere,
    stadiumScore: stadium,
    valueScore: value,
    nightScore: night,
    titleDramaScore: drama,
  };

  return {
    fixture: f,
    scores,
    reasons,
  };
}

export function buildDiscoverScores(fixtures: FixtureListRow[]): DiscoverFixture[] {
  return fixtures.map(scoreFixture);
}
