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

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function safeRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getTicketPriority(item: SavedItem): number {
  if (item.status === "booked") return 0;
  if (item.status === "pending") return 1;
  if (item.status === "saved") return 2;
  return 99;
}

function getSavedItemTimestamp(item: SavedItem, key: "updatedAt" | "createdAt"): number {
  const raw = (item as SavedItem & { updatedAt?: unknown; createdAt?: unknown })[key];
  return toFiniteNumber(raw) ?? 0;
}

function sortTicketCandidates(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => {
    const statusDiff = getTicketPriority(a) - getTicketPriority(b);
    if (statusDiff !== 0) return statusDiff;

    const updatedDiff = getSavedItemTimestamp(b, "updatedAt") - getSavedItemTimestamp(a, "updatedAt");
    if (updatedDiff !== 0) return updatedDiff;

    const createdDiff = getSavedItemTimestamp(b, "createdAt") - getSavedItemTimestamp(a, "createdAt");
    if (createdDiff !== 0) return createdDiff;

    return clean(a.id).localeCompare(clean(b.id));
  });
}

function itemFixtureId(item: SavedItem): string {
  return (
    clean(item.metadata?.fixtureId) ||
    clean((item.metadata as Record<string, unknown> | undefined)?.matchId) ||
    clean((item.metadata as Record<string, unknown> | undefined)?.primaryMatchId) ||
    ""
  );
}

export function pickPrimaryMatchId(
  trip: Trip | null,
  numericMatchIds: string[]
): string | null {
  if (!Array.isArray(numericMatchIds) || numericMatchIds.length === 0) return null;

  const preferred = clean(trip?.fixtureIdPrimary);
  if (preferred && numericMatchIds.includes(preferred)) {
    return preferred;
  }

  const first = clean(numericMatchIds[0]);
  return first || null;
}

export function getTripCity(
  trip: Trip | null,
  primaryFixture: FixtureListRow | null
): string {
  const raw =
    clean(trip?.displayCity) ||
    clean(trip?.venueCity) ||
    clean(primaryFixture?.fixture?.venue?.city) ||
    clean((trip as Trip & { city?: unknown })?.city) ||
    clean(trip?.cityId) ||
    "Trip";

  return titleCaseCity(raw);
}

export function getPrimaryLeagueId(
  trip: Trip | null,
  primaryFixture: FixtureListRow | null
): number | undefined {
  const fromFixture = toFiniteNumber(primaryFixture?.league?.id);
  if (fromFixture != null) return fromFixture;

  const fromTrip = toFiniteNumber(trip?.leagueId);
  if (fromTrip != null) return fromTrip;

  return undefined;
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

  for (const rawMid of numericMatchIds) {
    const matchId = clean(rawMid);
    if (!matchId) continue;

    const exact = ticketCandidates.filter((item) => itemFixtureId(item) === matchId);
    next[matchId] = sortTicketCandidates(exact)[0] ?? null;
  }

  return next;
}

export function buildPrimaryFixture(
  primaryMatchId: string | null,
  fixturesById: FixtureMap
): FixtureListRow | null {
  if (!primaryMatchId) return null;
  return fixturesById[clean(primaryMatchId)] ?? null;
}

export function buildPrimaryTicketItem(
  primaryMatchId: string | null,
  ticketsByMatchId: TicketMap
): SavedItem | null {
  if (!primaryMatchId) return null;
  return ticketsByMatchId[clean(primaryMatchId)] ?? null;
}

export function buildDateIsoForPrimaryMatch(args: {
  trip: Trip | null;
  primaryKickoffIso: string | null;
  getIsoDateOnly: (raw?: string | null) => string | undefined;
}): string | undefined {
  return clean(args.trip?.startDate) || args.getIsoDateOnly(args.primaryKickoffIso);
}

export function buildTripFinderSummary(
  rankedTrip: RankedTrip | null,
  helpers: TripFinderSummaryHelpers
) {
  if (!rankedTrip) return null;

  const rankedTripRecord = safeRecord(rankedTrip);
  const breakdown = safeRecord(rankedTripRecord?.breakdown);

  const rawScore =
    toFiniteNumber(breakdown?.combinedScore) ??
    toFiniteNumber(rankedTripRecord?.score) ??
    null;

  const rawDifficulty =
    breakdown?.travelDifficulty ??
    rankedTripRecord?.travelDifficulty ??
    null;

  const rawConfidence = toFiniteNumber(rankedTripRecord?.confidence);

  return {
    difficulty: helpers.difficultyLabel(rawDifficulty),
    confidence: helpers.confidencePctLabel(rawConfidence),
    reasons: helpers.rankReasonsText(rankedTrip),
    score: rawScore != null ? Math.round(rawScore) : null,
  };
}
