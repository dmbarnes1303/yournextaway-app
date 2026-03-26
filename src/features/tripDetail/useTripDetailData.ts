// src/features/tripDetail/useTripDetailData.ts

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
} from "@/src/features/tripDetail/helpers";

import {
  buildAffiliateUrls,
  getBookingWindow,
  resolveFlightDestinationIata,
} from "@/src/features/tripDetail/tripDetailAffiliates";
import {
  normalizeAreas,
  normalizeTips,
  normalizeTransportStops,
} from "@/src/features/tripDetail/tripDetailLogistics";
import {
  buildBookingPriceBoard,
  priceLine,
  type BookingPriceBoard,
  type PricePoint,
} from "@/src/features/tripDetail/tripDetailPricing";
import {
  buildDateIsoForPrimaryMatch,
  buildPrimaryFixture,
  buildPrimaryTicketItem,
  buildTicketsByMatchId,
  buildTripFinderSummary,
  getPrimaryHomeName,
  getPrimaryKickoffIso,
  getPrimaryLeagueId,
  getPrimaryLeagueName,
  getTripCity,
  pickPrimaryMatchId,
  type FixtureMap,
  type TicketMap,
} from "@/src/features/tripDetail/tripDetailSelectors";

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import { getTripHealth, getTripProgress } from "@/src/services/tripProgress";
import { searchFlights } from "@/src/services/flights";
import {
  buildLogisticsSnippet,
  getMatchdayLogistics,
} from "@/src/data/matchdayLogistics";
import rankTrips from "@/src/features/tripFinder/rankTrips";
import type { RankedTrip } from "@/src/features/tripFinder/types";
import type { Trip } from "@/src/state/trips";

type Props = {
  trip: Trip | null;
  savedItems: SavedItem[];
  originIata: string;
};

type FlightState = {
  loading: boolean;
  pricePoint: PricePoint | null;
};

export default function useTripDetailData({ trip, savedItems, originIata }: Props) {
  const [fixturesById, setFixturesById] = useState<FixtureMap>({});
  const [fxLoading, setFxLoading] = useState(false);
  const [flightState, setFlightState] = useState<FlightState>({
    loading: false,
    pricePoint: null,
  });

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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!trip || !cityName || cityName === "Trip") {
        if (!cancelled) {
          setFlightState({ loading: false, pricePoint: null });
        }
        return;
      }

      const origin = cleanUpper3(originIata, "LON");
      const destination = resolveFlightDestinationIata(cityName);

      if (!destination || origin === destination) {
        if (!cancelled) {
          setFlightState({ loading: false, pricePoint: null });
        }
        return;
      }

      const bookingWindow = getBookingWindow({
        trip,
        primaryKickoffIso,
      });

      const departureDate = bookingWindow.startDate;
      const returnDate = bookingWindow.endDate;

      if (!departureDate) {
        if (!cancelled) {
          setFlightState({ loading: false, pricePoint: null });
        }
        return;
      }

      setFlightState({ loading: true, pricePoint: null });

      try {
        const result = await searchFlights({
          originIata: origin,
          destinationIata: destination,
          departureDate,
          returnDate,
          limit: 1,
        });

        if (!result.ok || !result.cheapest) {
          if (!cancelled) {
            setFlightState({ loading: false, pricePoint: null });
          }
          return;
        }

        const cheapest = result.cheapest;

        const pricePoint: PricePoint = {
          amount: cheapest.price,
          currency: cheapest.currency,
          text: `${cheapest.currency} ${cheapest.price}`,
          source: "metadata",
        };

        if (!cancelled) {
          setFlightState({
            loading: false,
            pricePoint,
          });
        }
      } catch {
        if (!cancelled) {
          setFlightState({ loading: false, pricePoint: null });
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [trip, cityName, primaryKickoffIso, originIata]);

  const affiliateUrls = useMemo<AffiliateUrls | null>(() => {
    return buildAffiliateUrls({
      trip,
      cityName,
      originIata,
      primaryKickoffIso,
      buildMapsSearchUrl,
    });
  }, [trip, cityName, originIata, primaryKickoffIso]);

  const kickoffMeta = useMemo(() => {
    return formatKickoffMeta(primaryFixture, trip);
  }, [primaryFixture, trip]);

  const primaryLogistics = useMemo(() => {
    if (!primaryHomeName) return null;

    return getMatchdayLogistics({
      homeTeamName: primaryHomeName,
      leagueName: primaryLeagueName,
    });
  }, [primaryHomeName, primaryLeagueName]);

  const primaryLogisticsSnippet = useMemo(() => {
    return primaryLogistics ? buildLogisticsSnippet(primaryLogistics) : "";
  }, [primaryLogistics]);

  const stadiumName = useMemo(() => {
    return clean((primaryLogistics as any)?.stadium);
  }, [primaryLogistics]);

  const stadiumCity = useMemo(() => {
    return clean((primaryLogistics as any)?.city ?? cityName);
  }, [primaryLogistics, cityName]);

  const stadiumMapsUrl = useMemo(() => {
    const query = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ").trim();
    return buildMapsSearchUrl(query);
  }, [stadiumName, stadiumCity]);

  const stayBestAreas = useMemo<GuidanceArea[]>(() => {
    return normalizeAreas((primaryLogistics as any)?.stay?.bestAreas);
  }, [primaryLogistics]);

  const stayBudgetAreas = useMemo<GuidanceArea[]>(() => {
    return normalizeAreas((primaryLogistics as any)?.stay?.budgetAreas);
  }, [primaryLogistics]);

  const transportStops = useMemo<string[]>(() => {
    return normalizeTransportStops((primaryLogistics as any)?.transport?.primaryStops);
  }, [primaryLogistics]);

  const transportTips = useMemo<string[]>(() => {
    return normalizeTips((primaryLogistics as any)?.transport?.tips);
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
    return buildTripFinderSummary(rankedTrip, {
      difficultyLabel,
      confidencePctLabel,
      rankReasonsText,
    });
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
    const base = buildBookingPriceBoard(savedItems);
    const flights = flightState.pricePoint || base.flights;

    return {
      ...base,
      flights,
      tripTotal:
        base.tickets?.amount && flights?.amount && base.hotels?.amount
          ? {
              amount: base.tickets.amount + flights.amount + base.hotels.amount,
              currency:
                base.tickets.currency === flights.currency &&
                flights.currency === base.hotels.currency
                  ? base.tickets.currency
                  : null,
              text:
                base.tickets.currency === flights.currency &&
                flights.currency === base.hotels.currency &&
                base.tickets.currency
                  ? `${base.tickets.currency} ${(
                      base.tickets.amount +
                      flights.amount +
                      base.hotels.amount
                    ).toFixed(
                      (base.tickets.amount + flights.amount + base.hotels.amount) % 1 === 0 ? 0 : 2
                    )}`
                  : null,
              source: "saved_item",
            }
          : null,
    };
  }, [savedItems, flightState.pricePoint]);

  const ticketsPriceFrom = useMemo(() => {
    return priceLine(bookingPriceBoard.tickets);
  }, [bookingPriceBoard.tickets]);

  const flightsPriceFrom = useMemo(() => {
    return priceLine(bookingPriceBoard.flights);
  }, [bookingPriceBoard.flights]);

  const hotelsPriceFrom = useMemo(() => {
    return priceLine(bookingPriceBoard.hotels);
  }, [bookingPriceBoard.hotels]);

  const transfersPriceFrom = useMemo(() => {
    return priceLine(bookingPriceBoard.transfers);
  }, [bookingPriceBoard.transfers]);

  const experiencesPriceFrom = useMemo(() => {
    return priceLine(bookingPriceBoard.experiences);
  }, [bookingPriceBoard.experiences]);

  const tripPriceFrom = useMemo(() => {
    return priceLine(bookingPriceBoard.tripTotal);
  }, [bookingPriceBoard.tripTotal]);

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
    if (!activeTripId) return { score: 0, missing: [] as string[] };
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
    ticketsPriceFrom,
    flightsPriceFrom,
    hotelsPriceFrom,
    transfersPriceFrom,
    experiencesPriceFrom,
    tripPriceFrom,
    progress,
    readiness,
    dateIsoForPrimaryMatch,
    flightSearchLoading: flightState.loading,
    liveFlightPricePoint: flightState.pricePoint,
  };
        }
