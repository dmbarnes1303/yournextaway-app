// src/features/tripDetail/tripDetailPricing.ts

import type { SavedItem } from "@/src/core/savedItemTypes";

export type PricePointSource = "saved_item" | "metadata" | "price_text" | null;

export type PricePoint = {
  amount: number | null;
  currency: string | null;
  text: string | null;
  source: PricePointSource;
};

export type BookingPriceBoard = {
  tickets: PricePoint | null;
  flights: PricePoint | null;
  hotels: PricePoint | null;
  transfers: PricePoint | null;
  experiences: PricePoint | null;
  tripTotal: PricePoint | null;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function currencySymbolToCode(symbol: string): string | null {
  if (symbol === "£") return "GBP";
  if (symbol === "€") return "EUR";
  if (symbol === "$") return "USD";
  return null;
}

export function parsePriceText(raw: unknown): PricePoint | null {
  const text = clean(raw);
  if (!text) return null;

  const normalized = text.replace(/\s+/g, " ");

  const symbolFirst = normalized.match(
    /([£€$])\s?(\d{1,3}(?:[,\d]{0,})(?:\.\d{1,2})?)/
  );

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

export function buildPricePointFromItem(item: SavedItem | null): PricePoint | null {
  if (!item) return null;

  const meta = (item.metadata ?? {}) as Record<string, unknown>;

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
        text: currency
          ? `${currency} ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`
          : `${amount}`,
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

export function chooseBestPricePoint(items: SavedItem[]): PricePoint | null {
  const points = items
    .filter((item) => item.status !== "archived")
    .map((item) => buildPricePointFromItem(item))
    .filter(Boolean) as PricePoint[];

  if (points.length === 0) return null;

  const withAmounts = points.filter(
    (point) => typeof point.amount === "number" && Number.isFinite(point.amount)
  );

  if (withAmounts.length === 0) {
    return points[0] ?? null;
  }

  const preferredCurrency =
    withAmounts.find((point) => point.currency === "GBP")?.currency ||
    withAmounts[0]?.currency ||
    null;

  const sameCurrency = withAmounts.filter(
    (point) => point.currency === preferredCurrency
  );

  const pool = sameCurrency.length > 0 ? sameCurrency : withAmounts;

  return (
    pool.reduce<PricePoint | null>((best, current) => {
      if (!best) return current;
      if ((current.amount ?? Infinity) < (best.amount ?? Infinity)) return current;
      return best;
    }, null) ?? null
  );
}

export function sumTripCorePrice(args: {
  tickets: PricePoint | null;
  flights: PricePoint | null;
  hotels: PricePoint | null;
}): PricePoint | null {
  const { tickets, flights, hotels } = args;

  if (!tickets?.amount || !flights?.amount || !hotels?.amount) {
    return null;
  }

  const currencies = [tickets.currency, flights.currency, hotels.currency].filter(Boolean);
  const uniqueCurrencies = Array.from(new Set(currencies));

  if (uniqueCurrencies.length > 1) {
    return null;
  }

  const amount = tickets.amount + flights.amount + hotels.amount;
  const currency = uniqueCurrencies[0] ?? null;

  return {
    amount,
    currency,
    text: currency
      ? `${currency} ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`
      : `${amount}`,
    source: "saved_item",
  };
}

export function buildBookingPriceBoard(savedItems: SavedItem[]): BookingPriceBoard {
  const activeItems = savedItems.filter((item) => item.status !== "archived");

  const tickets = chooseBestPricePoint(
    activeItems.filter((item) => item.type === "tickets")
  );

  const flights = chooseBestPricePoint(
    activeItems.filter((item) => item.type === "flight")
  );

  const hotels = chooseBestPricePoint(
    activeItems.filter((item) => item.type === "hotel")
  );

  const transfers = chooseBestPricePoint(
    activeItems.filter(
      (item) => item.type === "transfer" || item.type === "train"
    )
  );

  const experiences = chooseBestPricePoint(
    activeItems.filter((item) => item.type === "things")
  );

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

export function withFlightPriceOverride(args: {
  board: BookingPriceBoard;
  flightPricePoint: PricePoint | null;
}): BookingPriceBoard {
  const flights = args.flightPricePoint || args.board.flights;

  const tripTotal = sumTripCorePrice({
    tickets: args.board.tickets,
    flights,
    hotels: args.board.hotels,
  });

  return {
    ...args.board,
    flights,
    tripTotal,
  };
}

export function priceLine(
  point: PricePoint | null,
  prefix = "From"
): string | null {
  if (!point?.amount) return null;

  if (point.text) {
    if (/^(GBP|EUR|USD)\s/i.test(point.text)) return `${prefix} ${point.text}`;
    if (/^[£€$]/.test(point.text)) return `${prefix} ${point.text}`;
  }

  if (point.currency) return `${prefix} ${point.currency} ${point.amount}`;
  return `${prefix} ${point.amount}`;
}
