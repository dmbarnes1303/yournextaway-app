import { useEffect, useMemo, useState } from "react";

import type { SavedItem } from "@/src/core/savedItemTypes";
import type {
  AffiliateUrls,
  GuidanceArea,
  TripFinderSummary,
} from "@/src/features/tripDetail/helpers";
import {
  buildMapsSearchUrl,
  clean,
  cleanUpper3,
  confidencePctLabel,
  difficultyLabel,
  formatKickoffMeta,
  getIsoDateOnly,
  isLateKickoff,
  isNumericId,
  rankReasonsText,
  titleCaseCity,
} from "@/src/features/tripDetail/helpers";

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import { getTripHealth, getTripProgress } from "@/src/services/tripProgress";
import { resolveAffiliateUrl } from "@/src/services/partnerLinks";
import { buildLogisticsSnippet, getMatchdayLogistics } from "@/src/data/matchdayLogistics";
import rankTrips from "@/src/features/tripFinder/rankTrips";
import type { RankedTrip } from "@/src/features/tripFinder/types";
import type { Trip } from "@/src/state/trips";

type Props = {
  trip: Trip | null;
  savedItems: SavedItem[];
  originIata: string;
};

type FixtureMap = Record<string, FixtureListRow>;
type TicketMap = Record<string, SavedItem | null>;

function pickPrimaryMatchId(trip: Trip | null, numericMatchIds: string[]): string | null {
  const preferred = clean((trip as any)?.fixtureIdPrimary);
  if (preferred && numericMatchIds.includes(preferred)) return preferred;
  return numericMatchIds[0] ?? null;
}

function getTripCity(trip: Trip | null, primaryFixture: FixtureListRow | null): string {
  const raw =
    clean((trip as any)?.displayCity) ||
    clean((trip as any)?.venueCity) ||
    clean((primaryFixture as any)?.fixture?.venue?.city) ||
    clean(trip?.cityId) ||
    "Trip";

  return titleCaseCity(raw);
}

function getPrimaryLeagueId(trip: Trip | null, primaryFixture: FixtureListRow | null): number | undefined {
  const fromFixture = (primaryFixture as any)?.league?.id;
  if (typeof fromFixture === "number") return fromFixture;

  const fromTrip = (trip as any)?.leagueId;
  return typeof fromTrip === "number" ? fromTrip : undefined;
}

function getPrimaryHomeName(trip: Trip | null, primaryFixture: FixtureListRow | null): string {
  return clean((primaryFixture as any)?.teams?.home?.name) || clean((trip as any)?.homeName);
}

function getPrimaryLeagueName(trip: Trip | null, primaryFixture: FixtureListRow | null): string {
  return clean((primaryFixture as any)?.league?.name) || clean((trip as any)?.leagueName);
}

function getPrimaryKickoffIso(trip: Trip | null, primaryFixture: FixtureListRow | null): string | null {
  return clean((primaryFixture as any)?.fixture?.date ?? (trip as any)?.kickoffIso) || null;
}

function normalizeAreas(raw: any): GuidanceArea[] {
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .map((x: any) => ({
      area: clean(x?.area),
      notes: clean(x?.notes) || undefined,
    }))
    .filter((x: GuidanceArea) => Boolean(x.area));
}

function normalizeTransportStops(raw: any): string[] {
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .slice(0, 3)
    .map((s: any) => `${clean(s?.name)}${s?.notes ? ` — ${clean(s.notes)}` : ""}`)
    .filter(Boolean);
}

function normalizeTips(raw: any): string[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.slice(0, 3).map((x: any) => clean(x)).filter(Boolean);
}

function buildAffiliateUrls(args: {
  trip: Trip | null;
  cityName: string;
  originIata: string;
}): AffiliateUrls | null {
  const { trip, cityName, originIata } = args;

  if (!trip || !clean(cityName) || cityName === "Trip") return null;

  const ctx = {
    city: clean(cityName),
    startDate: trip.startDate || null,
    endDate: trip.endDate || null,
    originIata: cleanUpper3(originIata, "LON"),
  };

  return {
    flightsUrl: resolveAffiliateUrl("aviasales", ctx) || "",
    hotelsUrl: resolveAffiliateUrl("expedia", ctx) || "",
    omioUrl: resolveAffiliateUrl("omio", ctx) || "",
    transfersUrl: resolveAffiliateUrl("kiwitaxi", ctx) || "",
    experiencesUrl: resolveAffiliateUrl("getyourguide", ctx) || "",
    mapsUrl: buildMapsSearchUrl(`${ctx.city} travel`),
  };
}

function buildTicketsByMatchId(args: {
  numericMatchIds: string[];
  savedItems: SavedItem[];
}): TicketMap {
  const { numericMatchIds, savedItems } = args;

  const next: TicketMap = {};
  const ticketCandidates = savedItems.filter(
    (x) => x.type === "tickets" && x.status !== "archived"
  );

  for (const mid of numericMatchIds) {
    const exact = ticketCandidates.filter(
      (x) => clean((x.metadata as any)?.fixtureId) === clean(mid)
    );

    const pool = exact.length > 0 ? exact : ticketCandidates;

    next[String(mid)] =
      pool.find((x) => x.status === "pending") ??
      pool.find((x) => x.status === "saved") ??
      pool.find((x) => x.status === "booked") ??
      null;
  }

  return next;
}

export default function useTripDetailData({ trip, savedItems, originIata }: Props) {
  const [fixturesById, setFixturesById] = useState<FixtureMap>({});
  const [fxLoading, setFxLoading] = useState(false);

  const activeTripId = useMemo(() => clean(trip?.id) || null, [trip?.id]);

  const numericMatchIds = useMemo(() => {
    const ids = Array.isArray(trip?.matchIds) ? trip.matchIds : [];
    return ids.map((x) => String(x).trim()).filter(isNumericId);
  }, [trip?.matchIds]);

  const primaryMatchId = useMemo(
    () => pickPrimaryMatchId(trip, numericMatchIds),
    [trip, numericMatchIds]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (numericMatchIds.length === 0) {
        setFixturesById({});
        setFxLoading(false);
        return;
      }

      setFxLoading(true);

      try {
        const next: FixtureMap = {};

        for (const id of numericMatchIds) {
          try {
            const row = await getFixtureById(id);
            if (row) next[String(id)] = row;
          } catch {
            // ignore per-fixture failure
          }
        }

        if (!cancelled) {
          setFixturesById(next);
        }
      } finally {
        if (!cancelled) {
          setFxLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [numericMatchIds]);

  const primaryFixture = useMemo(
    () => (primaryMatchId ? fixturesById[String(primaryMatchId)] ?? null : null),
    [primaryMatchId, fixturesById]
  );

  const cityName = useMemo(() => getTripCity(trip, primaryFixture), [trip, primaryFixture]);

  const primaryLeagueId = useMemo(
    () => getPrimaryLeagueId(trip, primaryFixture),
    [trip, primaryFixture]
  );

  const affiliateUrls = useMemo(
    () =>
      buildAffiliateUrls({
        trip,
        cityName,
        originIata,
      }),
    [trip, cityName, originIata]
  );

  const primaryHomeName = useMemo(
    () => getPrimaryHomeName(trip, primaryFixture),
    [trip, primaryFixture]
  );

  const primaryLeagueName = useMemo(
    () => getPrimaryLeagueName(trip, primaryFixture),
    [trip, primaryFixture]
  );

  const primaryKickoffIso = useMemo(
    () => getPrimaryKickoffIso(trip, primaryFixture),
    [trip, primaryFixture]
  );

  const kickoffMeta = useMemo(
    () => formatKickoffMeta(primaryFixture, trip),
    [primaryFixture, trip]
  );

  const primaryLogistics = useMemo(() => {
    if (!primaryHomeName) return null;

    return getMatchdayLogistics({
      homeTeamName: primaryHomeName,
      leagueName: primaryLeagueName,
    });
  }, [primaryHomeName, primaryLeagueName]);

  const primaryLogisticsSnippet = useMemo(
    () => (primaryLogistics ? buildLogisticsSnippet(primaryLogistics) : ""),
    [primaryLogistics]
  );

  const stadiumName = useMemo(
    () => clean((primaryLogistics as any)?.stadium),
    [primaryLogistics]
  );

  const stadiumCity = useMemo(
    () => clean((primaryLogistics as any)?.city ?? cityName),
    [primaryLogistics, cityName]
  );

  const stadiumMapsUrl = useMemo(() => {
    const query = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
    return buildMapsSearchUrl(query);
  }, [stadiumName, stadiumCity]);

  const stayBestAreas = useMemo(
    () => normalizeAreas((primaryLogistics as any)?.stay?.bestAreas),
    [primaryLogistics]
  );

  const stayBudgetAreas = useMemo(
    () => normalizeAreas((primaryLogistics as any)?.stay?.budgetAreas),
    [primaryLogistics]
  );

  const transportStops = useMemo(
    () => normalizeTransportStops((primaryLogistics as any)?.transport?.primaryStops),
    [primaryLogistics]
  );

  const transportTips = useMemo(
    () => normalizeTips((primaryLogistics as any)?.transport?.tips),
    [primaryLogistics]
  );

  const lateTransportNote = useMemo(() => {
    const explicit = clean((primaryLogistics as any)?.transport?.lateNightNote);
    if (explicit) return explicit;

    if (isLateKickoff(primaryKickoffIso)) {
      return "Late kickoff: check last trains/metros and pre-book a taxi/Uber fallback after the match.";
    }

    return "";
  }, [primaryLogistics, primaryKickoffIso]);

  const rankedTrip = useMemo<RankedTrip | null>(() => {
    if (!trip || !primaryFixture) return null;

    try {
      const ranked = rankTrips([
        {
          tripId: String(trip.id),
          fixture: primaryFixture,
          cityName,
          originIata: cleanUpper3(originIata, "LON"),
          startDate: trip.startDate,
          endDate: trip.endDate,
          kickoffIso: primaryKickoffIso ?? undefined,
        } as any,
      ]);

      return Array.isArray(ranked) && ranked.length > 0 ? ranked[0] : null;
    } catch {
      return null;
    }
  }, [trip, primaryFixture, cityName, originIata, primaryKickoffIso]);

  const tripFinderSummary = useMemo<TripFinderSummary | null>(() => {
    if (!rankedTrip) return null;

    const rawScore = (rankedTrip as any)?.score;

    return {
      difficulty: difficultyLabel((rankedTrip as any)?.travelDifficulty ?? null),
      confidence: confidencePctLabel((rankedTrip as any)?.confidence ?? null),
      reasons: rankReasonsText(rankedTrip),
      score: typeof rawScore === "number" && Number.isFinite(rawScore) ? Math.round(rawScore) : null,
    };
  }, [rankedTrip]);

  const ticketsByMatchId = useMemo(
    () =>
      buildTicketsByMatchId({
        numericMatchIds,
        savedItems,
      }),
    [numericMatchIds, savedItems]
  );

  const primaryTicketItem = useMemo(
    () => (primaryMatchId ? ticketsByMatchId[String(primaryMatchId)] ?? null : null),
    [primaryMatchId, ticketsByMatchId]
  );

  const progress = useMemo(() => {
    if (!activeTripId) {
      return {
        tickets: "empty",
        flight: "empty",
        hotel: "empty",
        transfer: "empty",
        things: "empty",
      } as const;
    }

    return getTripProgress(activeTripId);
  }, [activeTripId, savedItems]);

  const readiness = useMemo(() => {
    if (!activeTripId) return { score: 0, missing: [] as string[] };
    return getTripHealth(activeTripId);
  }, [activeTripId, savedItems]);

  const dateIsoForPrimaryMatch = useMemo(
    () => trip?.startDate || getIsoDateOnly(primaryKickoffIso),
    [trip?.startDate, primaryKickoffIso]
  );

  return {
    fixturesById,
    fxLoading,
    numericMatchIds,
    primaryMatchId,
    primaryFixture,
    cityName,
    primaryLeagueId,
    affiliateUrls,
    primaryHomeName,
    primaryLeagueName,
    primaryKickoffIso,
    kickoffMeta,
    primaryLogisticsSnippet,
    stadiumName,
    stadiumCity,
    stadiumMapsUrl,
    stayBestAreas,
    stayBudgetAreas,
    transportStops,
    transportTips,
    lateTransportNote,
    rankedTrip,
    tripFinderSummary,
    ticketsByMatchId,
    primaryTicketItem,
    progress,
    readiness,
    dateIsoForPrimaryMatch,
  };
}
