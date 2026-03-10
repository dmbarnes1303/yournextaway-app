// src/utils/fixtureTiming.ts

import { LEAGUE_SLOT_RULES } from "@/src/constants/football";
import type { FixtureTiming } from "@/src/types/fixtureTiming";

type RawFixtureForTiming = {
  leagueId: number;
  kickoffIso?: string | null;
  previousKickoffIso?: string | null;
};

export function resolveFixtureTiming(raw: RawFixtureForTiming): FixtureTiming {
  const kickoffIso = raw.kickoffIso ?? undefined;
  const previousKickoffIso = raw.previousKickoffIso ?? undefined;

  // Confirmed kickoff
  if (kickoffIso) {
    if (previousKickoffIso && previousKickoffIso !== kickoffIso) {
      return {
        kickoffIso,
        originalKickoffIso: previousKickoffIso,
        certainty: "changed",
        safeToBook: "yes",
      };
    }

    return {
      kickoffIso,
      certainty: "confirmed",
      safeToBook: "yes",
    };
  }

  // Likely slot based on league heuristics
  const rule = LEAGUE_SLOT_RULES.find((r) => r.leagueId === raw.leagueId);

  if (rule) {
    return {
      certainty: "likely",
      likelySlot: rule.primarySlot,
      safeToBook: "hotel",
    };
  }

  // Fully unknown kickoff
  return {
    certainty: "tbc",
    safeToBook: "no",
  };
}
