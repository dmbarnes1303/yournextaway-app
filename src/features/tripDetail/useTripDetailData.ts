import { useEffect, useMemo, useState } from "react";

import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
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

type PricePoint = {
  amount: number | null;
  currency: string | null;
  text: string | null;
  source: "saved_item" | "metadata" | "price_text" | null;
};

type BookingPriceBoard = {
  tickets: PricePoint | null;
  flights: PricePoint | null;
  hotels: PricePoint | null;
  transfers: PricePoint | null;
  experiences: PricePoint | null;
  tripTotal: PricePoint | null;
};

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

function getPrimaryLeagueId(
  trip: Trip | null,
  primaryFixture: FixtureListRow | null
): number | undefined {
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

function getPrimaryKickoffIso(
  trip: Trip | null,
  primaryFixture: FixtureListRow | null
): string | null {
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

function currencySymbolToCode(symbol: string): string | null {
  if (symbol === "£") return "GBP";
  if (symbol === "€") return "EUR";
  if (symbol === "$") return "USD";
  return null;
}

function parsePriceText(raw: unknown): PricePoint | null {
  const text = clean(raw);
  if (!text) return null;

  const normalized = text.replace(/\s+/g, " ");

  const symbolFirst = normalized.match(/([£€$])\s?(\d{1,3}(?:[,\d]{0,})(?:\.\d{1,2})?)/);
  if (symbolFirst) {
    const currency = currencySymbolToCode(symbolFirst[1]);
    const amount = Number(symbolFirst[2].replace(/,/g, ""));
    if (Number.isFinite(amount)) {
      return {
        amount,
        currency,
        text: `${symbolFirst[1]}${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`,
        source: "price_text",
      };
    }
  }

  const codeFirst = normalized.match(
    /\b(GBP|EUR|USD)\b\s?(\d{1,3}(?:[,\d]{0,})(?:\.\d{1,2})?)/i
  );
  if (codeFirst) {
    const currency = codeFirst[1].toUpperCase();
    const amount = Number(codeFirst[2].replace(/,/g, ""));
    if (Number.isFinite(amount)) {
      return {
        amount,
        currency,
        text: `${currency} ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`,
        source: "price_text",
      };
    }
  }

  return null;
}

function buildPricePointFromItem(item: SavedItem | null): PricePoint | null {
  if (!item) return null;

  const meta = (item.metadata ?? {}) as Record<string, any>;

  const numericCandidates = [
    meta.priceAmount,
    meta.amount,
    meta.totalAmount,
    meta.priceTotal,
    meta.totalPrice,
    meta.resolvedPriceAmount,
  ];

  for (const candidate of numericCandidates) {
    const amount = Number(candidate);
    if (Number.isFinite(amount) && amount > 0) {
      const currency =
        clean(meta.currency).toUpperCase() ||
        clean(meta.priceCurrency).toUpperCase() ||
        clean(meta.resolvedCurrency).toUpperCase() ||
        null;

      return {
        amount,
        currency: currency || null,
        text: currency ? `${currency} ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}` : `${amount}`,
        source: "metadata",
      };
    }
  }

  const textCandidates = [
    meta.resolvedPriceText,
    meta.priceText,
    meta.displayPrice,
    meta.livePrice,
    meta.price,
    item.title,
  ];

  for (const candidate of textCandidates) {
    const parsed = parsePriceText(candidate);
    if (parsed) return parsed;
  }

  return null;
}

function chooseBestPricePoint(items: SavedItem[]): PricePoint | null {
  const points = items
    .filter((x) => x.status !== "archived")
    .map((x) => buildPricePointFromItem(x))
    .filter(Boolean) as PricePoint[];

  if (points.length === 0) return null;

  const withAmounts = points.filter((x) => typeof x.amount === "number" && Number.isFinite(x.amount));
  if (withAmounts.length === 0) return points[0] ?? null;

  const preferredCurrency =
    withAmounts.find((x) => x.currency === "GBP")?.currency ||
    withAmounts[0]?.currency ||
    null;

  const sameCurrency = withAmounts.filter((x) => x.currency === preferredCurrency);
  const pool = sameCurrency.length > 0 ? sameCurrency : withAmounts;

  return (
    pool.reduce<PricePoint | null>((best, current) => {
      if (!best) return current;
      if ((current.amount ?? Infinity) < (best.amount ?? Infinity)) return current;
      return best;
    }, null) ?? null
  );
}

function sumTripCorePrice(args: {
  tickets: PricePoint | null;
  flights: PricePoint | null;
  hotels: PricePoint | null;
}): PricePoint | null {
  const { tickets, flights, hotels } = args;
  if (!tickets?.amount || !flights?.amount || !hotels?.amount) return null;

  const currencies = [tickets.currency, flights.currency, hotels.currency].filter(Boolean);
  const unique = Array.from(new Set(currencies));

  if (unique.length > 1) return null;

  const amount = tickets.amount + flights.amount + hotels.amount;
  const currency = unique[0] ?? null;

  return {
    amount,
    currency,
    text: currency ? `${currency} ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}` : `${amount}`,
    source: "saved_item",
  };
}

function buildBookingPriceBoard(savedItems: SavedItem[]): BookingPriceBoard {
  const active = savedItems.filter((x) => x.status !== "archived");

  const tickets = chooseBestPricePoint(active.filter((x) => x.type === "tickets"));
  const flights = chooseBestPricePoint(active.filter((x) => x.type === "flight"));
  const hotels = chooseBestPricePoint(active.filter((x) => x.type === "hotel"));
  const transfers = chooseBestPricePoint(
    active.filter((x) => x.type === "transfer" || x.type === "train")
  );
  const experiences = chooseBestPricePoint(active.filter((x) => x.type === "things"));

  const tripTotal = sumTripCorePrice({
    tickets,
    flights,
    hotels,
  });

  return {
    tickets,
    flights,
    hotels,
    transfers,
    experiences,
    tripTotal,
  };
}

function priceLine(point: PricePoint | null, prefix = "From"): string | null {
  if (!point?.amount) return null;

  if (point.text) {
    if (/^(GBP|EUR|USD)\s/i.test(point.text)) return `${prefix} ${point.text}`;
    if (/^[£€$]/.test(point.text)) return `${prefix} ${point.text}`;
  }

  if (point.currency) return `${prefix} ${point.currency} ${point.amount}`;
  return `${prefix} ${point.amount}`;
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

  const bookingPriceBoard = useMemo(
    () => buildBookingPriceBoard(savedItems),
    [savedItems]
  );

  const ticketsPriceFrom = useMemo(
    () => priceLine(bookingPriceBoard.tickets),
    [bookingPriceBoard.tickets]
  );

  const flightsPriceFrom = useMemo(
    () => priceLine(bookingPriceBoard.flights),
    [bookingPriceBoard.flights]
  );

  const hotelsPriceFrom = useMemo(
    () => priceLine(bookingPriceBoard.hotels),
    [bookingPriceBoard.hotels]
  );

  const transfersPriceFrom = useMemo(
    () => priceLine(bookingPriceBoard.transfers),
    [bookingPriceBoard.transfers]
  );

  const experiencesPriceFrom = useMemo(
    () => priceLine(bookingPriceBoard.experiences),
    [bookingPriceBoard.experiences]
  );

  const tripPriceFrom = useMemo(
    () => priceLine(bookingPriceBoard.tripTotal),
    [bookingPriceBoard.tripTotal]
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
