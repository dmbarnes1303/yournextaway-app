import type { FixtureListRow } from "@/src/services/apiFootball"
import { buildDiscoverScores } from "./discoverEngine"

export function rankDiscoverMatches(fixtures: FixtureListRow[]) {
  const scored = buildDiscoverScores(fixtures)

  return scored
    .map((s) => ({
      fixture: s.fixture,
      score:
        s.scores.atmosphereScore +
        s.scores.derbyScore +
        s.scores.stadiumScore +
        s.scores.nightScore +
        s.scores.titleDramaScore,
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.fixture)
}
