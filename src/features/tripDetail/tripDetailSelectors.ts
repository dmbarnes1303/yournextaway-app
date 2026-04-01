// src/features/tripDetail/tripDetailSelectors.ts

import type { SavedItem } from "@/src/core/savedItemTypes";
import type { FixtureListRow } from "@/src/services/apiFootball";
import type { RankedTrip } from "@/src/features/tripFinder/types";
import type { Trip } from "@/src/state/trips";

import { clean, titleCaseCity } from "@/src/features/tripDetail/helpers";

export type FixtureMap = Record<string, FixtureListRow>;
export type TicketMap = Record<string, SavedItem | null>;

type TripFinderSummaryHelpers = {
  difficultyLabel: (value?: unknown) => string | null;
  confidencePctLabel: (value?: number | null) => string | null;
  rankReasonsText: (trip: RankedTrip | null) => string | null;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getTicketPriority(item: SavedItem): number {
  if (item.status === "booked") return 0;
  if (item.status === "pending") return 1;
  if (item.status === "saved") return 2;
  return 99;
}

function sortTicketCandidates(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => {
    const statusDiff = getTicketPriority(a) - getTicketPriority(b);
    if (statusDiff !== 0) return statusDiff;

    const aUpdated = isFiniteNumber((a as { updatedAt?: unknown }).updatedAt)
      ? Number((a as { updatedAt?: unknown }).updatedAt)
      : 0;
    const bUpdated = isFiniteNumber((b as { updatedAt?: unknown }).updatedAt)
      ? Number((b as { updatedAt?: unknown }).updatedAt)
      : 0;

    if (aUpdated !== bUpdated) return bUpdated - aUpdated;

    const aCreated = isFiniteNumber((a as { createdAt?: unknown }).createdAt)
      ? Number((a as { createdAt?: unknown }).createdAt)
      : 0;
    const bCreated = isFiniteNumber((b as { createdAt?: unknown }).createdAt)
      ? Number((b as { createdAt?: unknown }).createdAt)
      : 0;

    if (aCreated !== bCreated) return bCreated - aCreated;

    return clean(a.id).localeCompare(clean(b.id));
  });
}

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
    const matchId = clean(mid);

    if (!matchId) {
      continue;
    }

    const exact = ticketCandidates.filter(
      (item) => clean(item.metadata?.fixtureId) === matchId
    );

    next[matchId] = sortTicketCandidates(exact)[0] ?? null;
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
  helpers: TripFinderSummaryHelpers
) {
  if (!rankedTrip) return null;

  const rankedTripRecord = rankedTrip as unknown as Record<string, unknown>;
  const breakdown =
    rankedTripRecord.breakdown && typeof rankedTripRecord.breakdown === "object"
      ? (rankedTripRecord.breakdown as Record<string, unknown>)
      : null;

  const rawScore = isFiniteNumber(breakdown?.combinedScore)
    ? breakdown?.combinedScore
    : isFiniteNumber(rankedTripRecord.score)
      ? (rankedTripRecord.score as number)
      : null;

  const rawDifficulty = breakdown?.travelDifficulty ?? rankedTripRecord.travelDifficulty ?? null;

  const rawConfidence = isFiniteNumber(rankedTripRecord.confidence)
    ? (rankedTripRecord.confidence as number)
    : null;

  return {
    difficulty: helpers.difficultyLabel(rawDifficulty),
    confidence: helpers.confidencePctLabel(rawConfidence),
    reasons: helpers.rankReasonsText(rankedTrip),
    score: isFiniteNumber(rawScore) ? Math.round(rawScore) : null,
  };
}
