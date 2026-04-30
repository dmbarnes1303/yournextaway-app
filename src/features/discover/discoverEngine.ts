// src/features/discover/discoverEngine.ts

import type { FixtureListRow } from "@/src/services/apiFootball";
import {
  buildDiscoverSignals,
  buildDiscoverSignalsForFixtures,
  type DiscoverReason,
  type DiscoverScores,
} from "@/src/features/discover/discoverSignals";

/* -------------------------------------------------------------------------- */
/* Public types                                                               */
/* -------------------------------------------------------------------------- */

export type DiscoverFixture = {
  fixture: FixtureListRow;
  scores: DiscoverScores;
  reasons: DiscoverReason[];
};

export type DiscoverTripLength = "day" | "1" | "2" | "3";

export type DiscoverVibe = "easy" | "big" | "nightlife" | "culture" | "warm";

export type DiscoverContext = {
  origin?: string | null;
  tripLength?: DiscoverTripLength | null;
  vibes?: DiscoverVibe[];
};

/* -------------------------------------------------------------------------- */
/* Canonical scoring entry points                                             */
/* -------------------------------------------------------------------------- */

/**
 * Score one fixture for Discover.
 *
 * Keep this file thin. The actual signal logic belongs in discoverSignals.ts.
 */
export function scoreFixture(fixture: FixtureListRow): DiscoverFixture {
  return buildDiscoverSignals(fixture);
}

/**
 * Score a fixture pool for Discover.
 */
export function buildDiscoverScores(fixtures: FixtureListRow[]): DiscoverFixture[] {
  return buildDiscoverSignalsForFixtures(fixtures);
}
