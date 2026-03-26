// src/features/tripDetail/tripDetailLogistics.ts

import type {
  GuidanceArea,
  TripFinderSummary,
} from "@/src/features/tripDetail/helpers";
import {
  buildMapsSearchUrl,
  clean,
  confidencePctLabel,
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

function normalizeAreas(raw: unknown): GuidanceArea[] {
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .map((entry) => {
      const x = entry as Record<string, unknown>;
      return {
        area: clean(x?.area),
        notes: clean(x?.notes) || undefined,
      };
    })
    .filter((item): item is GuidanceArea => Boolean(item.area));
}

function normalizeTransportStops(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .slice(0, 3)
    .map((entry) => {
      const x = entry as Record<string, unknown>;
      const name = clean(x?.name);
      const notes = clean(x?.notes);
      return `${name}${notes ? ` — ${notes}` : ""}`.trim();
    })
    .filter(Boolean);
}

function normalizeTips(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.slice(0, 3).map((x) => clean(x)).filter(Boolean);
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
  return clean((primaryLogistics as Record<string, unknown> | null)?.stadium);
}

export function getStadiumCity(args: {
  primaryLogistics: unknown;
  cityName: string;
}): string {
  return (
    clean((args.primaryLogistics as Record<string, unknown> | null)?.city) ||
    clean(args.cityName)
  );
}

export function getStadiumMapsUrl(args: {
  stadiumName: string;
  stadiumCity: string;
}): string {
  const query = [args.stadiumName || "stadium", args.stadiumCity]
    .filter(Boolean)
    .join(" ")
    .trim();

  return buildMapsSearchUrl(query);
}

export function getStayBestAreas(primaryLogistics: unknown): GuidanceArea[] {
  return normalizeAreas(
    (primaryLogistics as Record<string, any> | null)?.stay?.bestAreas
  );
}

export function getStayBudgetAreas(primaryLogistics: unknown): GuidanceArea[] {
  return normalizeAreas(
    (primaryLogistics as Record<string, any> | null)?.stay?.budgetAreas
  );
}

export function getTransportStops(primaryLogistics: unknown): string[] {
  return normalizeTransportStops(
    (primaryLogistics as Record<string, any> | null)?.transport?.primaryStops
  );
}

export function getTransportTips(primaryLogistics: unknown): string[] {
  return normalizeTips(
    (primaryLogistics as Record<string, any> | null)?.transport?.tips
  );
}

export function getLateTransportNote(args: {
  primaryLogistics: unknown;
  primaryKickoffIso: string | null;
}): string {
  const explicit = clean(
    (args.primaryLogistics as Record<string, any> | null)?.transport?.lateNightNote
  );

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
        cityName,
        originIata,
        startDate: trip.startDate,
        endDate: trip.endDate,
        kickoffIso: primaryKickoffIso ?? undefined,
      } as any,
    ]);

    return Array.isArray(ranked) && ranked.length > 0 ? ranked[0] : null;
  } catch {
    return null;
  }
}

export function getTripFinderSummary(
  rankedTrip: RankedTrip | null
): TripFinderSummary | null {
  if (!rankedTrip) return null;

  const rawScore = (rankedTrip as any)?.score;

  return {
    difficulty: difficultyLabel((rankedTrip as any)?.travelDifficulty ?? null),
    confidence: confidencePctLabel((rankedTrip as any)?.confidence ?? null),
    reasons: rankReasonsText(rankedTrip),
    score:
      typeof rawScore === "number" && Number.isFinite(rawScore)
        ? Math.round(rawScore)
        : null,
  };
}
