// src/utils/fixtureTiming.ts

import { LEAGUE_SLOT_RULES } from "@/src/constants/football";
import type { FixtureTiming } from "@/src/types/fixtureTiming";

type RawFixtureForTiming = {
  leagueId: number;
  kickoffIso?: string | null;
  previousKickoffIso?: string | null; // if you store this after refresh diffing
};

export function resolveFixtureTiming(raw: RawFixtureForTiming): FixtureTiming {
  const kickoffIso = raw.kickoffIso ?? undefined;
  const previousKickoffIso = raw.previousKickoffIso ?? undefined;

  // Confirmed (and possibly changed)
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

  // Likely (league heuristic)
  const rule = LEAGUE_SLOT_RULES.find((r) => r.leagueId === raw.leagueId);
  if (rule) {
    return {
      certainty: "likely",
      likelySlot: rule.primarySlot,
      safeToBook: "hotel",
    };
  }

  // TBC fallback
  return {
    certainty: "tbc",
    safeToBook: "no",
  };
}
