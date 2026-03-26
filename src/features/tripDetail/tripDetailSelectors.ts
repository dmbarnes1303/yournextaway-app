// src/features/tripDetail/tripDetailSelectors.ts

import type { SavedItem } from "@/src/core/savedItemTypes";
import type { FixtureListRow } from "@/src/services/apiFootball";
import type { RankedTrip } from "@/src/features/tripFinder/types";
import type { Trip } from "@/src/state/trips";

import {
  clean,
  titleCaseCity,
} from "@/src/features/tripDetail/helpers";

export type FixtureMap = Record<string, FixtureListRow>;
export type TicketMap = Record<string, SavedItem | null>;

export function pickPrimaryMatchId(
  trip: Trip | null,
  numericMatchIds: string[]
): string | null {
  const preferred = clean(trip?.fixtureIdPrimary);
  if (preferred && numericMatchIds.includes(preferred)) return preferred;
  return numericMatchIds[0] ?? null;
}

export function getTripCity(
  trip: Trip | null,
  primaryFixture: FixtureListRow | null
): string {
  const raw =
    clean(trip?.displayCity) ||
    clean(trip?.venueCity) ||
    clean(primaryFixture?.fixture?.venue?.city) ||
    clean(trip?.cityId) ||
    "Trip";

  return titleCaseCity(raw);
}

export function getPrimaryLeagueId(
  trip: Trip | null,
  primaryFixture: FixtureListRow | null
): number | undefined {
  const fromFixture = primaryFixture?.league?.id;
  if (typeof fromFixture === "number") return fromFixture;

  const fromTrip = trip?.leagueId;
  return typeof fromTrip === "number" ? fromTrip : undefined;
}

export function getPrimaryHomeName(
  trip: Trip | null,
  primaryFixture: FixtureListRow | null
): string {
  return clean(primaryFixture?.teams?.home?.name) || clean(trip?.homeName);
}

export function getPrimaryLeagueName(
  trip: Trip | null,
  primaryFixture: FixtureListRow | null
): string {
  return clean(primaryFixture?.league?.name) || clean(trip?.leagueName);
}

export function getPrimaryKickoffIso(
  trip: Trip | null,
  primaryFixture: FixtureListRow | null
): string | null {
  return clean(primaryFixture?.fixture?.date ?? trip?.kickoffIso) || null;
}

export function buildTicketsByMatchId(args: {
  numericMatchIds: string[];
  savedItems: SavedItem[];
}): TicketMap {
  const { numericMatchIds, savedItems } = args;

  const next: TicketMap = {};
  const ticketCandidates = savedItems.filter(
    (item) => item.type === "tickets" && item.status !== "archived"
  );

  for (const mid of numericMatchIds) {
    const exact = ticketCandidates.filter(
      (item) => clean(item.metadata?.fixtureId) === clean(mid)
    );

    const pool = exact.length > 0 ? exact : ticketCandidates;

    next[String(mid)] =
      pool.find((item) => item.status === "pending") ??
      pool.find((item) => item.status === "saved") ??
      pool.find((item) => item.status === "booked") ??
      null;
  }

  return next;
}

export function buildPrimaryFixture(
  primaryMatchId: string | null,
  fixturesById: FixtureMap
): FixtureListRow | null {
  return primaryMatchId ? fixturesById[String(primaryMatchId)] ?? null : null;
}

export function buildPrimaryTicketItem(
  primaryMatchId: string | null,
  ticketsByMatchId: TicketMap
): SavedItem | null {
  return primaryMatchId ? ticketsByMatchId[String(primaryMatchId)] ?? null : null;
}

export function buildDateIsoForPrimaryMatch(args: {
  trip: Trip | null;
  primaryKickoffIso: string | null;
  getIsoDateOnly: (raw?: string | null) => string | undefined;
}): string | undefined {
  return args.trip?.startDate || args.getIsoDateOnly(args.primaryKickoffIso);
}

export function buildTripFinderSummary(
  rankedTrip: RankedTrip | null,
  helpers: {
    difficultyLabel: (value?: any) => string | null;
    confidencePctLabel: (value?: number | null) => string | null;
    rankReasonsText: (trip: RankedTrip | null) => string | null;
  }
) {
  if (!rankedTrip) return null;

  const rawScore = (rankedTrip as any)?.score;

  return {
    difficulty: helpers.difficultyLabel((rankedTrip as any)?.travelDifficulty ?? null),
    confidence: helpers.confidencePctLabel((rankedTrip as any)?.confidence ?? null),
    reasons: helpers.rankReasonsText(rankedTrip),
    score:
      typeof rawScore === "number" && Number.isFinite(rawScore)
        ? Math.round(rawScore)
        : null,
  };
}
