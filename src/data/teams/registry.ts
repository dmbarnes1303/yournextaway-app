// src/data/teams/registry.ts

export type PopularTeam = {
  teamKey: string;      // must match teamGuides registry key
  name: string;
  apiFootballTeamId: number;
};

export const POPULAR_TEAMS: PopularTeam[] = [
  { teamKey: "real-madrid", name: "Real Madrid", apiFootballTeamId: 0 }, // TODO
  { teamKey: "arsenal", name: "Arsenal", apiFootballTeamId: 0 }, // TODO
  { teamKey: "bayern-munich", name: "Bayern Munich", apiFootballTeamId: 0 }, // TODO
  { teamKey: "inter-milan", name: "Inter Milan", apiFootballTeamId: 0 }, // TODO
  { teamKey: "borussia-dortmund", name: "Borussia Dortmund", apiFootballTeamId: 0 }, // TODO
];
