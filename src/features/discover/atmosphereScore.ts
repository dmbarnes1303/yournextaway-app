const HIGH_ATMOSPHERE_TEAMS = [
  "Borussia Dortmund",
  "Napoli",
  "Galatasaray",
  "Marseille",
  "Boca Juniors",
  "River Plate",
  "Red Star Belgrade",
  "Fenerbahce",
];

export function atmosphereScore(homeTeam: string) {
  if (!homeTeam) return 2;

  if (HIGH_ATMOSPHERE_TEAMS.includes(homeTeam)) return 5;

  return 3;
}
