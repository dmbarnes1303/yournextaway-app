// src/features/discover/discoverEngine.ts

import type { FixtureListRow } from "@/src/services/apiFootball";
import {
  buildDiscoverSignals,
  buildDiscoverSignalsForFixtures,
  type DiscoverReason,
  type DiscoverScores,
} from "./discoverSignals";

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
/* Compatibility exports                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Canonical single-fixture discover scoring entry point.
 *
 * This file is now intentionally thin.
 * All heavy signal logic lives in discoverSignals.ts.
 */
export function scoreFixture(fixture: FixtureListRow): DiscoverFixture {
  return buildDiscoverSignals(fixture);
}

/**
 * Canonical bulk discover scoring entry point.
 */
export function buildDiscoverScores(fixtures: FixtureListRow[]): DiscoverFixture[] {
  return buildDiscoverSignalsForFixtures(fixtures);
}
