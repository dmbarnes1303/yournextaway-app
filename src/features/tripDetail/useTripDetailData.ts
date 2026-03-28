import { useEffect, useMemo, useState } from "react";

import type { SavedItem } from "@/src/core/savedItemTypes";
import type { AffiliateUrls } from "@/src/features/tripDetail/helpers";
import {
  clean,
  cleanUpper3,
  formatKickoffMeta,
  getIsoDateOnly,
  isNumericId,
} from "@/src/features/tripDetail/helpers";

import { buildAffiliateUrls } from "@/src/features/tripDetail/tripDetailAffiliates";

import {
  getLateTransportNote,
  getPrimaryLogistics,
  getPrimaryLogisticsSnippet,
  getRankedTrip,
  getStadiumCity,
  getStadiumMapsUrl,
  getStadiumName,
  getStayBestAreas,
  getStayBudgetAreas,
  getTransportStops,
  getTransportTips,
  getTripFinderSummary,
} from "@/src/features/tripDetail/tripDetailLogistics";

import {
  buildBookingPriceBoard,
  type BookingPriceBoard,
} from "@/src/features/tripDetail/tripDetailPricing";

import {
  buildDateIsoForPrimaryMatch,
  buildPrimaryFixture,
  buildPrimaryTicketItem,
  buildTicketsByMatchId,
  getPrimaryHomeName,
  getPrimaryKickoffIso,
  getPrimaryLeagueId,
  getPrimaryLeagueName,
  getTripCity,
  pickPrimaryMatchId,
  type FixtureMap,
  type TicketMap,
} from "@/src/features/tripDetail/tripDetailSelectors";

import { getFixtureById } from "@/src/services/apiFootball";
import { getTripHealth, getTripProgress } from "@/src/services/tripProgress";
import type { Trip } from "@/src/state/trips";

type Props = {
  trip: Trip | null;
  savedItems: SavedItem[];
  originIata: string;
};

export default function useTripDetailData({
  trip,
  savedItems,
  originIata,
}: Props) {
  const [fixturesById, setFixturesById] = useState<FixtureMap>({});
  const [fxLoading, setFxLoading] = useState(false);

  const activeTripId = useMemo(() => clean(trip?.id) || null, [trip?.id]);

  const numericMatchIds = useMemo(() => {
    const ids = Array.isArray(trip?.matchIds) ? trip.matchIds : [];
    return ids.map((id) => String(id).trim()).filter(isNumericId);
  }, [trip?.matchIds]);

  const primaryMatchId = useMemo(() => {
    return pickPrimaryMatchId(trip, numericMatchIds);
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

    void run();

    return () => {
      cancelled = true;
    };
  }, [numericMatchIds]);

  const primaryFixture = useMemo(() => {
    return buildPrimaryFixture(primaryMatchId, fixturesById);
  }, [primaryMatchId, fixturesById]);

  const cityName = useMemo(() => {
    return getTripCity(trip, primaryFixture);
  }, [trip, primaryFixture]);

  const primaryLeagueId = useMemo(() => {
    return getPrimaryLeagueId(trip, primaryFixture);
  }, [trip, primaryFixture]);

  const primaryHomeName = useMemo(() => {
    return getPrimaryHomeName(trip, primaryFixture);
  }, [trip, primaryFixture]);

  const primaryLeagueName = useMemo(() => {
    return getPrimaryLeagueName(trip, primaryFixture);
  }, [trip, primaryFixture]);

  const primaryKickoffIso = useMemo(() => {
    return getPrimaryKickoffIso(trip, primaryFixture);
  }, [trip, primaryFixture]);

  const affiliateUrls = useMemo<AffiliateUrls | null>(() => {
    return buildAffiliateUrls({
      trip,
      cityName,
      originIata,
      primaryKickoffIso,
    });
  }, [trip, cityName, originIata, primaryKickoffIso]);

  const kickoffMeta = useMemo(() => {
    return formatKickoffMeta(primaryFixture, trip);
  }, [primaryFixture, trip]);

  const primaryLogistics = useMemo(() => {
    return getPrimaryLogistics({
      primaryHomeName,
      primaryLeagueName,
    });
  }, [primaryHomeName, primaryLeagueName]);

  const primaryLogisticsSnippet = useMemo(() => {
    return getPrimaryLogisticsSnippet(primaryLogistics);
  }, [primaryLogistics]);

  const stadiumName = useMemo(() => {
    return getStadiumName(primaryLogistics);
  }, [primaryLogistics]);

  const stadiumCity = useMemo(() => {
    return getStadiumCity({
      primaryLogistics,
      cityName,
    });
  }, [primaryLogistics, cityName]);

  const stadiumMapsUrl = useMemo(() => {
    return getStadiumMapsUrl({
      stadiumName,
      stadiumCity,
    });
  }, [stadiumName, stadiumCity]);

  const stayBestAreas = useMemo(() => {
    return getStayBestAreas(primaryLogistics);
  }, [primaryLogistics]);

  const stayBudgetAreas = useMemo(() => {
    return getStayBudgetAreas(primaryLogistics);
  }, [primaryLogistics]);

  const transportStops = useMemo(() => {
    return getTransportStops(primaryLogistics);
  }, [primaryLogistics]);

  const transportTips = useMemo(() => {
    return getTransportTips(primaryLogistics);
  }, [primaryLogistics]);

  const lateTransportNote = useMemo(() => {
    return getLateTransportNote({
      primaryLogistics,
      primaryKickoffIso,
    });
  }, [primaryLogistics, primaryKickoffIso]);

  const rankedTrip = useMemo(() => {
    return getRankedTrip({
      trip,
      primaryFixture,
      cityName,
      originIata: cleanUpper3(originIata, "LON"),
      primaryKickoffIso,
    });
  }, [trip, primaryFixture, cityName, originIata, primaryKickoffIso]);

  const tripFinderSummary = useMemo(() => {
    return getTripFinderSummary(rankedTrip);
  }, [rankedTrip]);

  const ticketsByMatchId = useMemo<TicketMap>(() => {
    return buildTicketsByMatchId({
      numericMatchIds,
      savedItems,
    });
  }, [numericMatchIds, savedItems]);

  const primaryTicketItem = useMemo(() => {
    return buildPrimaryTicketItem(primaryMatchId, ticketsByMatchId);
  }, [primaryMatchId, ticketsByMatchId]);

  const bookingPriceBoard = useMemo<BookingPriceBoard>(() => {
    return buildBookingPriceBoard(savedItems);
  }, [savedItems]);

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
  }, [activeTripId]);

  const readiness = useMemo(() => {
    if (!activeTripId) {
      return { score: 0, missing: [] as string[] };
    }

    return getTripHealth(activeTripId);
  }, [activeTripId]);

  const dateIsoForPrimaryMatch = useMemo(() => {
    return buildDateIsoForPrimaryMatch({
      trip,
      primaryKickoffIso,
      getIsoDateOnly,
    });
  }, [trip, primaryKickoffIso]);

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
    bookingPriceBoard,
    progress,
    readiness,
    dateIsoForPrimaryMatch,
  };
}
