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
import { buildAffiliateLinks } from "@/src/services/affiliateLinks";
import { searchFlights } from "@/src/services/flights";
import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import {
  buildLogisticsSnippet,
  getMatchdayLogistics,
} from "@/src/data/matchdayLogistics";

import rankTrips from "@/src/features/tripFinder/rankTrips";
import type { RankedTrip } from "@/src/features/tripFinder/types";
import type { Trip } from "@/src/state/trips";

/* ---------------- TYPES ---------------- */

type Props = {
  trip: Trip | null;
  savedItems: SavedItem[];
  originIata: string;
};

type FixtureMap = Record<string, FixtureListRow>;
type TicketMap = Record<string, SavedItem | null>;

type PricePoint = {
  amount: number | null;
  currency: string | null;
  text: string | null;
};

type BookingPriceBoard = {
  tickets: PricePoint | null;
  flights: PricePoint | null;
  hotels: PricePoint | null;
  transfers: PricePoint | null;
  experiences: PricePoint | null;
  tripTotal: PricePoint | null;
};

/* ---------------- CORE HELPERS ---------------- */

function pickPrimaryMatchId(
  trip: Trip | null,
  ids: string[]
): string | null {
  const preferred = clean((trip as any)?.fixtureIdPrimary);
  if (preferred && ids.includes(preferred)) return preferred;
  return ids[0] ?? null;
}

function extractCity(trip: Trip | null, fixture: FixtureListRow | null) {
  return titleCaseCity(
    clean((trip as any)?.displayCity) ||
      clean((trip as any)?.venueCity) ||
      clean(fixture?.fixture?.venue?.city) ||
      clean(trip?.cityId) ||
      "Trip"
  );
}

function extractKickoff(trip: Trip | null, fixture: FixtureListRow | null) {
  return clean(fixture?.fixture?.date ?? (trip as any)?.kickoffIso) || null;
}

/* ---------------- PRICE HELPERS ---------------- */

function parsePrice(text?: string | null): PricePoint | null {
  const raw = clean(text);
  if (!raw) return null;

  const match = raw.match(/([£€$])\s?(\d+)/);
  if (!match) return null;

  const amount = Number(match[2]);
  if (!Number.isFinite(amount)) return null;

  return {
    amount,
    currency: match[1] === "£" ? "GBP" : match[1] === "€" ? "EUR" : "USD",
    text: `${match[1]}${amount}`,
  };
}

function bestPrice(items: SavedItem[], type: string): PricePoint | null {
  const candidates = items
    .filter((x) => x.type === type && x.status !== "archived")
    .map((x) => parsePrice((x.metadata as any)?.priceText || x.title))
    .filter(Boolean) as PricePoint[];

  if (!candidates.length) return null;

  return candidates.reduce((a, b) =>
    (b.amount ?? Infinity) < (a.amount ?? Infinity) ? b : a
  );
}

function sumCorePrices(
  tickets: PricePoint | null,
  flights: PricePoint | null,
  hotels: PricePoint | null
): PricePoint | null {
  if (!tickets?.amount || !flights?.amount || !hotels?.amount) return null;

  const total = tickets.amount + flights.amount + hotels.amount;

  return {
    amount: total,
    currency: tickets.currency,
    text: `${tickets.currency} ${total}`,
  };
}

/* ---------------- MAIN HOOK ---------------- */

export default function useTripDetailData({
  trip,
  savedItems,
  originIata,
}: Props) {
  const [fixturesById, setFixturesById] = useState<FixtureMap>({});
  const [fxLoading, setFxLoading] = useState(false);

  /* ---------------- MATCH IDS ---------------- */

  const numericMatchIds = useMemo(() => {
    return (trip?.matchIds ?? [])
      .map((x) => String(x).trim())
      .filter(isNumericId);
  }, [trip?.matchIds]);

  const primaryMatchId = useMemo(
    () => pickPrimaryMatchId(trip, numericMatchIds),
    [trip, numericMatchIds]
  );

  /* ---------------- FIXTURE LOAD ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!numericMatchIds.length) {
        setFixturesById({});
        return;
      }

      setFxLoading(true);

      const map: FixtureMap = {};

      for (const id of numericMatchIds) {
        try {
          const fx = await getFixtureById(id);
          if (fx) map[id] = fx;
        } catch {}
      }

      if (!cancelled) {
        setFixturesById(map);
        setFxLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [numericMatchIds]);

  const primaryFixture = useMemo(
    () => (primaryMatchId ? fixturesById[primaryMatchId] ?? null : null),
    [primaryMatchId, fixturesById]
  );

  /* ---------------- CORE DATA ---------------- */

  const cityName = useMemo(
    () => extractCity(trip, primaryFixture),
    [trip, primaryFixture]
  );

  const primaryKickoffIso = useMemo(
    () => extractKickoff(trip, primaryFixture),
    [trip, primaryFixture]
  );

  /* ---------------- AFFILIATE LINKS ---------------- */

  const affiliateUrls = useMemo(() => {
    if (!trip || !cityName || cityName === "Trip") return null;

    return buildAffiliateLinks({
      city: cityName,
      originIata: cleanUpper3(originIata, "LON"),
      startDate: trip.startDate,
      endDate: trip.endDate,
    });
  }, [trip, cityName, originIata]);

  /* ---------------- LOGISTICS ---------------- */

  const logistics = useMemo(() => {
    if (!primaryFixture) return null;

    return getMatchdayLogistics({
      homeTeamName: primaryFixture.teams?.home?.name,
      leagueName: primaryFixture.league?.name,
    });
  }, [primaryFixture]);

  const logisticsSnippet = useMemo(
    () => (logistics ? buildLogisticsSnippet(logistics) : ""),
    [logistics]
  );

  /* ---------------- PRICING ---------------- */

  const bookingPriceBoard = useMemo(() => {
    const tickets = bestPrice(savedItems, "tickets");
    const flights = bestPrice(savedItems, "flight");
    const hotels = bestPrice(savedItems, "hotel");
    const transfers = bestPrice(savedItems, "transfer");
    const experiences = bestPrice(savedItems, "things");

    return {
      tickets,
      flights,
      hotels,
      transfers,
      experiences,
      tripTotal: sumCorePrices(tickets, flights, hotels),
    };
  }, [savedItems]);

  /* ---------------- PROGRESS ---------------- */

  const progress = useMemo(() => {
    if (!trip?.id) {
      return {
        tickets: "empty",
        flight: "empty",
        hotel: "empty",
        transfer: "empty",
        things: "empty",
      } as const;
    }

    return getTripProgress(trip.id);
  }, [trip?.id]);

  const readiness = useMemo(() => {
    if (!trip?.id) return { score: 0, missing: [] as string[] };
    return getTripHealth(trip.id);
  }, [trip?.id]);

  /* ---------------- RETURN ---------------- */

  return {
    fixturesById,
    fxLoading,
    numericMatchIds,
    primaryMatchId,
    primaryFixture,
    cityName,
    primaryKickoffIso,
    affiliateUrls,
    logisticsSnippet,
    bookingPriceBoard,
    progress,
    readiness,
  };
}
