import { useEffect, useMemo, useState } from "react";

import { searchFlights } from "@/src/services/flights"; // ✅ NEW

// ... keep ALL your existing imports unchanged ...

// ADD THIS TYPE
type FlightState = {
  loading: boolean;
  pricePoint: PricePoint | null;
};

/* ---------------- main hook ---------------- */

export default function useTripDetailData({ trip, savedItems, originIata }: Props) {
  const [fixturesById, setFixturesById] = useState<FixtureMap>({});
  const [fxLoading, setFxLoading] = useState(false);

  // ✅ NEW: flights state
  const [flightState, setFlightState] = useState<FlightState>({
    loading: false,
    pricePoint: null,
  });

  const activeTripId = useMemo(() => clean(trip?.id) || null, [trip?.id]);

  const numericMatchIds = useMemo(() => {
    const ids = Array.isArray(trip?.matchIds) ? trip.matchIds : [];
    return ids.map((x) => String(x).trim()).filter(isNumericId);
  }, [trip?.matchIds]);

  const primaryMatchId = useMemo(() => {
    return pickPrimaryMatchId(trip, numericMatchIds);
  }, [trip, numericMatchIds]);

  /* ---------------- fixtures load ---------------- */

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

  const primaryFixture = useMemo(() => {
    return primaryMatchId ? fixturesById[String(primaryMatchId)] ?? null : null;
  }, [primaryMatchId, fixturesById]);

  const cityName = useMemo(() => getTripCity(trip, primaryFixture), [trip, primaryFixture]);

  const primaryKickoffIso = useMemo(() => {
    return getPrimaryKickoffIso(trip, primaryFixture);
  }, [trip, primaryFixture]);

  /* ---------------- ✅ FLIGHTS FETCH ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!cityName || !primaryKickoffIso) return;

      const departureDate = getIsoDateOnly(primaryKickoffIso);
      if (!departureDate) return;

      setFlightState({ loading: true, pricePoint: null });

      try {
        const result = await searchFlights({
          originIata: cleanUpper3(originIata, "LON"),
          destinationIata: "AUTO", // 🔴 IMPORTANT (see note below)
          departureDate,
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

    run();

    return () => {
      cancelled = true;
    };
  }, [cityName, primaryKickoffIso, originIata]);

  /* ---------------- pricing ---------------- */

  const bookingPriceBoard = useMemo(() => {
    const base = buildBookingPriceBoard(savedItems);

    // ✅ OVERRIDE flights with real data if available
    const flights = flightState.pricePoint || base.flights;

    const tripTotal = sumTripCorePrice({
      tickets: base.tickets,
      flights,
      hotels: base.hotels,
    });

    return {
      ...base,
      flights,
      tripTotal,
    };
  }, [savedItems, flightState.pricePoint]);

  const ticketsPriceFrom = useMemo(() => priceLine(bookingPriceBoard.tickets), [bookingPriceBoard.tickets]);
  const flightsPriceFrom = useMemo(() => priceLine(bookingPriceBoard.flights), [bookingPriceBoard.flights]);
  const hotelsPriceFrom = useMemo(() => priceLine(bookingPriceBoard.hotels), [bookingPriceBoard.hotels]);
  const transfersPriceFrom = useMemo(() => priceLine(bookingPriceBoard.transfers), [bookingPriceBoard.transfers]);
  const experiencesPriceFrom = useMemo(() => priceLine(bookingPriceBoard.experiences), [bookingPriceBoard.experiences]);
  const tripPriceFrom = useMemo(() => priceLine(bookingPriceBoard.tripTotal), [bookingPriceBoard.tripTotal]);

  /* ---------------- rest unchanged ---------------- */

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
    return trip?.startDate || getIsoDateOnly(primaryKickoffIso);
  }, [trip?.startDate, primaryKickoffIso]);

  return {
    fixturesById,
    fxLoading,
    numericMatchIds,
    primaryMatchId,
    primaryFixture,
    cityName,
    primaryKickoffIso,

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
  };
}
