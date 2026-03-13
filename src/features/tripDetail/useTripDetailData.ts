import { useEffect, useMemo, useState } from "react";

import type { SavedItem } from "@/src/core/savedItemTypes";
import type { AffiliateUrls, GuidanceArea, TripFinderSummary } from "@/src/features/tripDetail/helpers";
import {
  buildMapsSearchUrl,
  clean,
  cleanUpper3,
  difficultyLabel,
  confidencePctLabel,
  formatKickoffMeta,
  getIsoDateOnly,
  isLateKickoff,
  isNumericId,
  rankReasonsText,
  titleCaseCity,
} from "@/src/features/tripDetail/helpers";

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import { getTripProgress, getTripHealth } from "@/src/services/tripProgress";
import { resolveAffiliateUrl } from "@/src/services/partnerLinks";
import { getMatchdayLogistics, buildLogisticsSnippet } from "@/src/data/matchdayLogistics";
import rankTrips from "@/src/features/tripFinder/rankTrips";
import type { RankedTrip } from "@/src/features/tripFinder/types";
import type { Trip } from "@/src/state/trips";

type Props = {
  trip: Trip | null;
  savedItems: SavedItem[];
  originIata: string;
};

export default function useTripDetailData({ trip, savedItems, originIata }: Props) {
  const [fixturesById, setFixturesById] = useState<Record<string, FixtureListRow>>({});
  const [fxLoading, setFxLoading] = useState(false);

  const activeTripId = useMemo(() => clean(trip?.id) || null, [trip?.id]);

  const numericMatchIds = useMemo(() => {
    const ids = Array.isArray(trip?.matchIds) ? trip.matchIds : [];
    return ids.map((x) => String(x).trim()).filter(isNumericId);
  }, [trip?.matchIds]);

  const primaryMatchId = useMemo(() => {
    const preferred = clean((trip as any)?.fixtureIdPrimary);
    if (preferred && numericMatchIds.includes(preferred)) return preferred;
    return numericMatchIds[0] ?? null;
  }, [trip, numericMatchIds]);

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
        const next: Record<string, FixtureListRow> = {};
        for (const id of numericMatchIds) {
          try {
            const row = await getFixtureById(id);
            if (row) next[String(id)] = row;
          } catch {}
        }
        if (!cancelled) setFixturesById(next);
      } finally {
        if (!cancelled) setFxLoading(false);
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

  const cityName = useMemo(() => {
    const raw =
      clean((trip as any)?.displayCity) ||
      clean((trip as any)?.venueCity) ||
      clean((primaryFixture as any)?.fixture?.venue?.city) ||
      clean(trip?.cityId) ||
      "Trip";

    return titleCaseCity(raw);
  }, [trip, primaryFixture]);

  const primaryLeagueId = useMemo(() => {
    const fromFixture = (primaryFixture as any)?.league?.id;
    if (typeof fromFixture === "number") return fromFixture;

    const fromTrip = (trip as any)?.leagueId;
    return typeof fromTrip === "number" ? fromTrip : undefined;
  }, [primaryFixture, trip]);

  const affiliateUrls = useMemo<AffiliateUrls | null>(() => {
    if (!trip || !clean(cityName) || cityName === "Trip") return null;

    const ctx = {
      city: clean(cityName),
      startDate: trip.startDate || null,
      endDate: trip.endDate || null,
      originIata: cleanUpper3(originIata, "LON"),
    };

    return {
      flightsUrl: resolveAffiliateUrl("aviasales", ctx),
      hotelsUrl: resolveAffiliateUrl("expedia", ctx),
      omioUrl: resolveAffiliateUrl("omio", ctx),
      transfersUrl: resolveAffiliateUrl("kiwitaxi", ctx),
      experiencesUrl: resolveAffiliateUrl("getyourguide", ctx),
      mapsUrl: buildMapsSearchUrl(`${ctx.city} travel`),
    };
  }, [trip, cityName, originIata]);

  const primaryHomeName = useMemo(
    () => clean((primaryFixture as any)?.teams?.home?.name) || clean((trip as any)?.homeName),
    [primaryFixture, trip]
  );

  const primaryLeagueName = useMemo(
    () => clean((primaryFixture as any)?.league?.name) || clean((trip as any)?.leagueName),
    [primaryFixture, trip]
  );

  const primaryKickoffIso = useMemo(
    () => clean((primaryFixture as any)?.fixture?.date ?? (trip as any)?.kickoffIso) || null,
    [primaryFixture, trip]
  );

  const kickoffMeta = useMemo(() => formatKickoffMeta(primaryFixture, trip), [primaryFixture, trip]);

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

  const stadiumName = useMemo(() => clean((primaryLogistics as any)?.stadium), [primaryLogistics]);

  const stadiumCity = useMemo(
    () => clean((primaryLogistics as any)?.city ?? cityName),
    [primaryLogistics, cityName]
  );

  const stadiumMapsUrl = useMemo(() => {
    const query = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
    return buildMapsSearchUrl(query);
  }, [stadiumName, stadiumCity]);

  const stayBestAreas = useMemo<GuidanceArea[]>(() => {
    const arr = Array.isArray((primaryLogistics as any)?.stay?.bestAreas)
      ? (primaryLogistics as any).stay.bestAreas
      : [];
    return arr
      .map((x: any) => ({
        area: clean(x?.area),
        notes: clean(x?.notes) || undefined,
      }))
      .filter((x: GuidanceArea) => x.area);
  }, [primaryLogistics]);

  const stayBudgetAreas = useMemo<GuidanceArea[]>(() => {
    const arr = Array.isArray((primaryLogistics as any)?.stay?.budgetAreas)
      ? (primaryLogistics as any).stay.budgetAreas
      : [];
    return arr
      .map((x: any) => ({
        area: clean(x?.area),
        notes: clean(x?.notes) || undefined,
      }))
      .filter((x: GuidanceArea) => x.area);
  }, [primaryLogistics]);

  const transportStops = useMemo(() => {
    const stops = Array.isArray((primaryLogistics as any)?.transport?.primaryStops)
      ? (primaryLogistics as any).transport.primaryStops
      : [];
    return stops
      .slice(0, 3)
      .map((s: any) => `${clean(s?.name)}${s?.notes ? ` — ${clean(s.notes)}` : ""}`)
      .filter(Boolean);
  }, [primaryLogistics]);

  const transportTips = useMemo(() => {
    const tips = Array.isArray((primaryLogistics as any)?.transport?.tips)
      ? (primaryLogistics as any).transport.tips
      : [];
    return tips.slice(0, 3).map((x: any) => clean(x)).filter(Boolean);
  }, [primaryLogistics]);

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

    return {
      difficulty: difficultyLabel((rankedTrip as any)?.travelDifficulty ?? null),
      confidence: confidencePctLabel((rankedTrip as any)?.confidence ?? null),
      reasons: rankReasonsText(rankedTrip),
      score:
        typeof (rankedTrip as any)?.score === "number" && Number.isFinite((rankedTrip as any)?.score)
          ? Math.round((rankedTrip as any).score)
          : null,
    };
  }, [rankedTrip]);

  const ticketsByMatchId = useMemo(() => {
    const next: Record<string, SavedItem | null> = {};
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
  }, [numericMatchIds, savedItems]);

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
