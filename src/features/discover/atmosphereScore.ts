const HIGH_ATMOSPHERE_TEAMS = [
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
];

const STRONG_ATMOSPHERE_TEAMS = [
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
];

function norm(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function includesAny(name: string, keys: string[]) {
  return keys.some((k) => name.includes(k));
}

export function atmosphereScore(homeTeam: string) {
  const key = norm(homeTeam);
  if (!key) return 1;

  if (includesAny(key, HIGH_ATMOSPHERE_TEAMS)) return 5;
  if (includesAny(key, STRONG_ATMOSPHERE_TEAMS)) return 4;

  if (
    key.includes("ultras") ||
    key.includes("dinamo") ||
    key.includes("derby") ||
    key.includes("athletic")
  ) {
    return 4;
  }

  return 2;
}
