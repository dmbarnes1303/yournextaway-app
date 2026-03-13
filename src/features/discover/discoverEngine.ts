import type { FixtureListRow } from "@/src/services/apiFootball";
import { atmosphereScore } from "./atmosphereScore";

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
};

type ClubSignal = {
  keys: string[];
};

type DerbyDefinition = {
  name: string;
  home: string[];
  away: string[];
  score: number;
};

const DERBIES: DerbyDefinition[] = [
  {
    name: "North London Derby",
    home: ["arsenal"],
    away: ["tottenham", "spurs", "tottenham hotspur"],
    score: 4,
  },
  {
    name: "El Clasico",
    home: ["barcelona", "fc barcelona", "barca"],
    away: ["real madrid"],
    score: 5,
  },
  {
    name: "Manchester Derby",
    home: ["manchester united", "man united"],
    away: ["manchester city", "man city"],
    score: 4,
  },
  {
    name: "Merseyside Derby",
    home: ["liverpool"],
    away: ["everton"],
    score: 4,
  },
  {
    name: "Old Firm",
    home: ["celtic"],
    away: ["rangers"],
    score: 5,
  },
  {
    name: "Derby della Madonnina",
    home: ["inter", "inter milan", "internazionale"],
    away: ["milan", "ac milan"],
    score: 5,
  },
  {
    name: "Derby della Capitale",
    home: ["roma", "as roma"],
    away: ["lazio"],
    score: 4,
  },
  {
    name: "Der Klassiker",
    home: ["bayern", "bayern munich"],
    away: ["dortmund", "borussia dortmund"],
    score: 4,
  },
  {
    name: "Seville Derby",
    home: ["sevilla"],
    away: ["real betis", "betis"],
    score: 4,
  },
  {
    name: "Turin Derby",
    home: ["juventus"],
    away: ["torino"],
    score: 3,
  },
  {
    name: "Rome Derby",
    home: ["roma", "as roma"],
    away: ["lazio"],
    score: 4,
  },
  {
    name: "Porto Derby",
    home: ["porto", "fc porto"],
    away: ["boavista"],
    score: 3,
  },
];

const LEGENDARY_HOME_CLUBS: ClubSignal[] = [
  { keys: ["real madrid"] },
  { keys: ["barcelona", "fc barcelona", "barca"] },
  { keys: ["manchester united", "man united"] },
  { keys: ["liverpool"] },
  { keys: ["bayern", "bayern munich"] },
  { keys: ["milan", "ac milan"] },
  { keys: ["inter", "inter milan", "internazionale"] },
  { keys: ["juventus"] },
  { keys: ["borussia dortmund", "dortmund"] },
  { keys: ["ajax"] },
  { keys: ["celtic"] },
  { keys: ["rangers"] },
  { keys: ["benfica"] },
  { keys: ["porto", "fc porto"] },
  { keys: ["sporting", "sporting cp"] },
];

const STRONG_VALUE_LEAGUE_KEYS = [
  "bundesliga",
  "eredi",
  "portugal",
  "primeira",
  "belgium",
  "jupiler",
  "austria",
  "bundesliga austria",
  "czech",
  "croatia",
  "poland",
  "switzerland",
];

const MID_VALUE_LEAGUE_KEYS = [
  "netherlands",
  "scotland",
  "denmark",
  "norway",
  "sweden",
];

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function lower(value: unknown): string {
  return clean(value).toLowerCase();
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(lower(needle)));
}

function clubMatches(name: string, signal: ClubSignal) {
  return includesAny(name, signal.keys);
}

function matchPairEitherWay(
  homeName: string,
  awayName: string,
  left: string[],
  right: string[]
) {
  const home = lower(homeName);
  const away = lower(awayName);

  const forward = includesAny(home, left) && includesAny(away, right);
  const reverse = includesAny(home, right) && includesAny(away, left);

  return forward || reverse;
}

function isDerby(home: string, away: string): number {
  for (const derby of DERBIES) {
    if (matchPairEitherWay(home, away, derby.home, derby.away)) {
      return derby.score;
    }
  }
  return 0;
}

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

function stadiumScore(home: string): number {
  const homeLower = lower(home);

  if (LEGENDARY_HOME_CLUBS.some((club) => clubMatches(homeLower, club))) return 3;

  if (
    includesAny(homeLower, [
      "atletico",
      "arsenal",
      "chelsea",
      "tottenham",
      "marseille",
      "napoli",
      "fenerbahce",
      "galatasaray",
      "besiktas",
      "psv",
      "feyenoord",
      "anderlecht",
      "club brugge",
    ])
  ) {
    return 2;
  }

  return 0;
}

function valueScore(f: FixtureListRow): number {
  const league = lower(f.league?.name);
  const country = lower((f.league as any)?.country);

  const combined = `${league} ${country}`.trim();

  if (STRONG_VALUE_LEAGUE_KEYS.some((k) => combined.includes(k))) return 3;
  if (MID_VALUE_LEAGUE_KEYS.some((k) => combined.includes(k))) return 2;

  if (
    combined.includes("champions league") ||
    combined.includes("premier league") ||
    combined.includes("serie a") ||
    combined.includes("laliga") ||
    combined.includes("la liga")
  ) {
    return 0;
  }

  return 1;
}

function titleDramaScore(f: FixtureListRow): number {
  const round = lower(f.league?.round);
  const league = lower(f.league?.name);

  if (!round) return 0;

  const roundMatch = round.match(/(\d{1,2})/);
  const roundNum = roundMatch ? Number(roundMatch[1]) : null;

  if (!roundNum || !Number.isFinite(roundNum)) return 0;

  if (
    league.includes("premier") ||
    league.includes("championship") ||
    league.includes("serie a") ||
    league.includes("liga") ||
    league.includes("bundesliga") ||
    league.includes("eredivisie") ||
    league.includes("primeira") ||
    league.includes("scottish") ||
    league.includes("super lig")
  ) {
    if (roundNum >= 34) return 3;
    if (roundNum >= 30) return 2;
    if (roundNum >= 26) return 1;
    return 0;
  }

  if (roundNum >= 28) return 2;
  if (roundNum >= 24) return 1;

  return 0;
}

export function scoreFixture(f: FixtureListRow): DiscoverFixture {
  const home = clean(f.teams?.home?.name);
  const away = clean(f.teams?.away?.name);

  const scores: DiscoverScores = {
    derbyScore: isDerby(home, away),
    atmosphereScore: atmosphereScore(home),
    stadiumScore: stadiumScore(home),
    valueScore: valueScore(f),
    nightScore: nightMatchScore(f.fixture?.date),
    titleDramaScore: titleDramaScore(f),
  };

  return {
    fixture: f,
    scores,
  };
}

export function buildDiscoverScores(fixtures: FixtureListRow[]) {
  return fixtures.map(scoreFixture);
    }
