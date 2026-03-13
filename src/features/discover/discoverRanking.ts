import type { FixtureListRow } from "@/src/services/apiFootball";
import { atmosphereScore } from "./atmosphereScore";

export function rankDiscoverMatches(fixtures: FixtureListRow[]) {
  return fixtures
    .map((f) => {
      const home = f.teams?.home?.name || "";

      const score =
        atmosphereScore(home) * 2 +
        (f.league?.name?.includes("Champions") ? 2 : 0);

      return {
        fixture: f,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.fixture);
}
