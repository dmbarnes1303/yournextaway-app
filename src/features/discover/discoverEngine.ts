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

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function lower(v: unknown) {
  return clean(v).toLowerCase();
}

function includesAny(text: string, keys: string[]) {
  return keys.some((k) => text.includes(k));
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
  { home: ["arsenal"], away: ["tottenham", "spurs"], score: 4 },
  { home: ["barcelona", "barca"], away: ["real madrid"], score: 5 },
  { home: ["manchester united"], away: ["manchester city"], score: 4 },
  { home: ["liverpool"], away: ["everton"], score: 4 },
  { home: ["celtic"], away: ["rangers"], score: 5 },
  { home: ["inter"], away: ["milan"], score: 5 },
  { home: ["roma"], away: ["lazio"], score: 4 },
  { home: ["bayern"], away: ["dortmund"], score: 4 },
  { home: ["sevilla"], away: ["betis"], score: 4 },
  { home: ["juventus"], away: ["torino"], score: 3 },
  { home: ["porto"], away: ["boavista"], score: 3 },
];

/* -------------------------------------------------------------------------- */
/* Club prestige signals                                                      */
/* -------------------------------------------------------------------------- */

const LEGENDARY_CLUBS = [
  "real madrid",
  "barcelona",
  "manchester united",
  "liverpool",
  "bayern",
  "milan",
  "inter",
  "juventus",
  "dortmund",
  "ajax",
  "celtic",
  "rangers",
  "benfica",
  "porto",
  "sporting",
];

const STRONG_ATMOSPHERE_CLUBS = [
  "dortmund",
  "galatasaray",
  "fenerbahce",
  "napoli",
  "marseille",
  "celtic",
  "rangers",
  "ajax",
];

/* -------------------------------------------------------------------------- */
/* Value signals                                                              */
/* -------------------------------------------------------------------------- */

const STRONG_VALUE_LEAGUES = [
  "bundesliga",
  "primeira",
  "belgium",
  "austria",
  "czech",
  "croatia",
  "poland",
  "switzerland",
];

const MID_VALUE_LEAGUES = [
  "netherlands",
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

function nightMatchScore(dateIso?: string | null) {
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
/* Stadium / club prestige                                                    */
/* -------------------------------------------------------------------------- */

function stadiumScore(home: string) {
  const h = lower(home);

  if (LEGENDARY_CLUBS.some((c) => h.includes(c))) return 3;

  if (
    STRONG_ATMOSPHERE_CLUBS.some((c) => h.includes(c))
  )
    return 2;

  return 0;
}

/* -------------------------------------------------------------------------- */
/* Value scoring                                                              */
/* -------------------------------------------------------------------------- */

function valueScore(f: FixtureListRow) {
  const league = lower(f.league?.name);
  const country = lower((f.league as any)?.country);

  const combined = `${league} ${country}`;

  if (STRONG_VALUE_LEAGUES.some((k) => combined.includes(k))) return 3;
  if (MID_VALUE_LEAGUES.some((k) => combined.includes(k))) return 2;

  return 1;
}

/* -------------------------------------------------------------------------- */
/* Title drama scoring                                                        */
/* -------------------------------------------------------------------------- */

function titleDramaScore(f: FixtureListRow) {
  const round = lower(f.league?.round);

  if (!round) return 0;

  const match = round.match(/(\d+)/);
  const roundNum = match ? Number(match[1]) : null;

  if (!roundNum) return 0;

  if (roundNum >= 34) return 3;
  if (roundNum >= 30) return 2;
  if (roundNum >= 26) return 1;

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

export function buildDiscoverScores(fixtures: FixtureListRow[]) {
  return fixtures.map(scoreFixture);
}
