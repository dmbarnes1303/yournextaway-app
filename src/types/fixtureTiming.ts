// src/types/fixtureTiming.ts

export type FixtureCertainty = "tbc" | "likely" | "confirmed" | "changed";
export type SafeToBookLevel = "no" | "hotel" | "yes";

export interface FixtureTiming {
  kickoffIso?: string;          // confirmed kickoff datetime (ISO)
  originalKickoffIso?: string;  // previous kickoff if changed
  certainty: FixtureCertainty;
  likelySlot?: string;          // e.g. "Sat 15:00" (display-only)
  safeToBook: SafeToBookLevel;
}
