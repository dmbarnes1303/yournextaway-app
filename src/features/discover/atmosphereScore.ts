const HIGH_ATMOSPHERE_TEAMS = new Set([
  "borussia dortmund",
  "napoli",
  "galatasaray",
  "marseille",
  "red star belgrade",
  "crvena zvezda",
  "fenerbahce",
  "celtic",
  "rangers",
  "ajax",
  "feyenoord",
  "psv",
  "benfica",
  "porto",
  "sporting",
  "sporting cp",
  "besiktas",
  "olympiacos",
  "panathinaikos",
  "hajduk split",
  "dinamo zagreb",
  "legia warsaw",
  "slavia prague",
  "sparta prague",
  "partizan",
  "rapid vienna",
  "ferencvaros",
]);

const STRONG_ATMOSPHERE_TEAMS = new Set([
  "liverpool",
  "newcastle",
  "aston villa",
  "atletico madrid",
  "athletic club",
  "athletic bilbao",
  "real betis",
  "sevilla",
  "roma",
  "lazio",
  "inter",
  "inter milan",
  "ac milan",
  "milan",
  "juventus",
  "bayern munich",
  "bayern",
  "eintracht frankfurt",
  "union berlin",
  "st pauli",
  "paok",
  "aik",
  "malmo",
  "rosenborg",
  "bodo glimt",
  "shamrock rovers",
  "bohemians",
]);

// lightweight alias normalisation (fixes duplicate names properly)
const TEAM_ALIASES: Record<string, string> = {
  "inter milan": "inter",
  "ac milan": "milan",
  "sporting cp": "sporting",
  "athletic bilbao": "athletic club",
  "bayern": "bayern munich",
};

function norm(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function normaliseTeam(name: string): string {
  const key = norm(name);
  return TEAM_ALIASES[key] ?? key;
}

function keywordBoost(name: string): number {
  let score = 0;

  if (name.includes("derby")) score += 1;
  if (name.includes("dinamo")) score += 1;
  if (name.includes("ultras")) score += 1;
  if (name.includes("athletic")) score += 0.5;

  return score;
}

/**
 * Atmosphere scale:
 * 5 = elite (bucket list atmospheres)
 * 4 = consistently strong
 * 3 = solid / above average
 * 2 = normal
 * 1 = weak / unknown
 */
export function atmosphereScore(homeTeam: string): number {
  const team = normaliseTeam(homeTeam);
  if (!team) return 1;

  if (HIGH_ATMOSPHERE_TEAMS.has(team)) return 5;
  if (STRONG_ATMOSPHERE_TEAMS.has(team)) return 4;

  // softer heuristic layer (instead of dumb includes)
  const boost = keywordBoost(team);

  if (boost >= 2) return 4;
  if (boost >= 1) return 3;

  return 2;
}
