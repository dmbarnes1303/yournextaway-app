// src/types/fixtureTiming.ts

export type FixtureTimingCertainty = "confirmed" | "changed" | "likely" | "tbc";
export type FixtureTimingSafeToBook = "yes" | "hotel" | "no";

export type FixtureTiming = {
  certainty: FixtureTimingCertainty;
  safeToBook: FixtureTimingSafeToBook;

  kickoffIso?: string;
  originalKickoffIso?: string;
  likelySlot?: string;
};
