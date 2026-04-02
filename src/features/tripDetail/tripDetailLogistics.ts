import type {
  GuidanceArea,
  TripFinderSummary,
} from "@/src/features/tripDetail/helpers";
import {
  buildMapsSearchUrl,
  clean,
  difficultyLabel,
  isLateKickoff,
  rankReasonsText,
} from "@/src/features/tripDetail/helpers";

import {
  buildLogisticsSnippet,
  getMatchdayLogistics,
} from "@/src/data/matchdayLogistics";

import rankTrips from "@/src/features/tripFinder/rankTrips";
import type { RankedTrip } from "@/src/features/tripFinder/types";

import type { FixtureListRow } from "@/src/services/apiFootball";
import type { Trip } from "@/src/state/trips";

function safeRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function normalizeAreas(raw: unknown): GuidanceArea[] {
  return safeArray(raw)
    .map((entry) => {
      const record = safeRecord(entry);
      const area = clean(record?.area);
      const notes = clean(record?.notes) || undefined;

      if (!area) return null;

      return {
        area,
        notes,
      };
    })
    .filter((item): item is GuidanceArea => Boolean(item?.area));
}

export function normalizeTransportStops(raw: unknown): string[] {
  return safeArray(raw)
    .slice(0, 3)
    .map((entry) => {
      const record = safeRecord(entry);
      const name = clean(record?.name);
      const notes = clean(record?.notes);

      if (!name) return "";

      return `${name}${notes ? ` — ${notes}` : ""}`.trim();
    })
    .filter(Boolean);
}

export function normalizeTips(raw: unknown): string[] {
  return safeArray(raw)
    .slice(0, 3)
    .map((entry) => clean(entry))
    .filter(Boolean);
}

export function getPrimaryLogistics(args: {
  primaryHomeName: string;
  primaryLeagueName: string;
}) {
  const { primaryHomeName, primaryLeagueName } = args;

  if (!clean(primaryHomeName)) return null;

  return getMatchdayLogistics({
    homeTeamName: primaryHomeName,
    leagueName: primaryLeagueName,
  });
}

export function getPrimaryLogisticsSnippet(primaryLogistics: unknown): string {
  return primaryLogistics ? buildLogisticsSnippet(primaryLogistics) : "";
}

export function getStadiumName(primaryLogistics: unknown): string {
  const record = safeRecord(primaryLogistics);
  return clean(record?.stadium);
}

export function getStadiumCity(args: {
  primaryLogistics: unknown;
  cityName: string;
}): string {
  const record = safeRecord(args.primaryLogistics);
  return clean(record?.city) || clean(args.cityName);
}

export function getStadiumMapsUrl(args: {
  stadiumName: string;
  stadiumCity: string;
}): string {
  const query = [clean(args.stadiumName) || "stadium", clean(args.stadiumCity)]
    .filter(Boolean)
    .join(" ")
    .trim();

  return buildMapsSearchUrl(query);
}

export function getStayBestAreas(primaryLogistics: unknown): GuidanceArea[] {
  const record = safeRecord(primaryLogistics);
  const stay = safeRecord(record?.stay);
  return normalizeAreas(stay?.bestAreas);
}

export function getStayBudgetAreas(primaryLogistics: unknown): GuidanceArea[] {
  const record = safeRecord(primaryLogistics);
  const stay = safeRecord(record?.stay);
  return normalizeAreas(stay?.budgetAreas);
}

export function getTransportStops(primaryLogistics: unknown): string[] {
  const record = safeRecord(primaryLogistics);
  const transport = safeRecord(record?.transport);
  return normalizeTransportStops(transport?.primaryStops);
}

export function getTransportTips(primaryLogistics: unknown): string[] {
  const record = safeRecord(primaryLogistics);
  const transport = safeRecord(record?.transport);
  return normalizeTips(transport?.tips);
}

export function getLateTransportNote(args: {
  primaryLogistics: unknown;
  primaryKickoffIso: string | null;
}): string {
  const record = safeRecord(args.primaryLogistics);
  const transport = safeRecord(record?.transport);

  const explicit = clean(transport?.lateNightNote);
  if (explicit) return explicit;

  if (isLateKickoff(args.primaryKickoffIso)) {
    return "Late kickoff: check last trains/metros and pre-book a taxi/Uber fallback after the match.";
  }

  return "";
}

export function getRankedTrip(args: {
  trip: Trip | null;
  primaryFixture: FixtureListRow | null;
  cityName: string;
  originIata: string;
  primaryKickoffIso: string | null;
}): RankedTrip | null {
  const { trip, primaryFixture, cityName, originIata, primaryKickoffIso } = args;

  if (!trip || !primaryFixture) return null;

  try {
    const ranked = rankTrips([
      {
        tripId: String(trip.id),
        fixture: primaryFixture,
        cityName: clean(cityName),
        originIata: clean(originIata),
        startDate: trip.startDate,
        endDate: trip.endDate,
        kickoffIso: primaryKickoffIso ?? undefined,
      } as Parameters<typeof rankTrips>[0][number],
    ]);

    return Array.isArray(ranked) && ranked.length > 0 ? ranked[0] ?? null : null;
  } catch {
    return null;
  }
}

export function getTripFinderSummary(
  rankedTrip: RankedTrip | null
): TripFinderSummary | null {
  if (!rankedTrip) return null;

  const rankedTripRecord = safeRecord(rankedTrip);
  const breakdown = safeRecord(rankedTripRecord?.breakdown);

  const rawScore =
    toFiniteNumber(breakdown?.combinedScore) ??
    toFiniteNumber(rankedTripRecord?.score) ??
    null;

  const rawDifficulty = breakdown?.travelDifficulty ?? rankedTripRecord?.travelDifficulty ?? null;

  return {
    difficulty: difficultyLabel(rawDifficulty),
    confidence: null,
    reasons: rankReasonsText(rankedTrip),
    score: rawScore != null ? Math.round(rawScore) : null,
  };
}
