import type { FixtureListRow } from "@/src/services/apiFootball";
import { rankDiscoverMatches } from "./discoverRanking";
import { findWeekendTrips } from "./weekendFinder";

export function buildDiscover(fixtures: FixtureListRow[]) {
  const ranked = rankDiscoverMatches(fixtures);

  return {
    bigMatches: ranked.slice(0, 10),
    weekendTrips: findWeekendTrips(fixtures),
  };
}
