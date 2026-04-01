// src/features/tripDetail/tripDetailPricing.ts
import type { SavedItem } from "@/src/core/savedItemTypes";

export type PricePointSource =
  | "saved_item"
  | "metadata"
  | "price_text"
  | "live_api"
  | null;

export type PriceDisplayMode = "booked";

export type PricePoint = {
  amount: number | null;
  currency: string | null;
  text: string | null;
  source: PricePointSource;
  displayMode: PriceDisplayMode;
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

function upper(value: unknown): string {
  return clean(value).toUpperCase();
}

function isPositiveAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function toPositiveAmount(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function currencySymbolToCode(symbol: string): string | null {
  if (symbol === "£") return "GBP";
  if (symbol === "€") return "EUR";
  if (symbol === "$") return "USD";
  return null;
}

function normalizeCurrency(value: unknown): string | null {
  const raw = upper(value);
  if (!raw) return null;

  if (raw === "GBP" || raw === "EUR" || raw === "USD") {
    return raw;
  }

  if (raw === "£") return "GBP";
  if (raw === "€") return "EUR";
  if (raw === "$") return "USD";

  return null;
}

function formatAmount(amount: number): string {
  return amount % 1 === 0 ? String(amount.toFixed(0)) : String(amount.toFixed(2));
}

function formatPriceText(currency: string | null, amount: number): string {
  if (currency) return `${currency} ${formatAmount(amount)}`;
  return formatAmount(amount);
}

function sameCurrency(points: Array<PricePoint | null>): string | null {
  const currencies = points
    .map((point) => point?.currency || null)
    .filter((value): value is string => Boolean(value));

  if (currencies.length === 0) return null;

  const unique = Array.from(new Set(currencies));
  return unique.length === 1 ? unique[0] : null;
}

function rankSource(source: PricePointSource): number {
  if (source === "saved_item") return 0;
  if (source === "metadata") return 1;
  if (source === "price_text") return 2;
  if (source === "live_api") return 3;
  return 4;
}

export function parsePriceText(raw: unknown): Omit<PricePoint, "displayMode"> | null {
  const text = clean(raw);
  if (!text) return null;

  const normalized = text.replace(/\s+/g, " ");

  const symbolFirst = normalized.match(
    /([£€$])\s?(\d{1,3}(?:[,\d]{0,})(?:\.\d{1,2})?)/
  );

  if (symbolFirst) {
    const currency = currencySymbolToCode(symbolFirst[1]);
    const amount = Number(symbolFirst[2].replace(/,/g, ""));

    if (Number.isFinite(amount) && amount > 0) {
      return {
        amount,
        currency,
        text: `${symbolFirst[1]}${formatAmount(amount)}`,
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

    if (Number.isFinite(amount) && amount > 0) {
      return {
        amount,
        currency,
        text: `${currency} ${formatAmount(amount)}`,
        source: "price_text",
      };
    }
  }

  return null;
}

function buildSavedItemPricePoint(item: SavedItem): PricePoint | null {
  if (item.status !== "booked") return null;

  const directText = parsePriceText(item.priceText);
  if (!directText) return null;

  return {
    amount: directText.amount,
    currency: directText.currency,
    text: directText.text,
    source: "saved_item",
    displayMode: "booked",
  };
}

function buildMetadataNumericPricePoint(item: SavedItem): PricePoint | null {
  if (item.status !== "booked") return null;

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
    const amount = toPositiveAmount(candidate);
    if (amount == null) continue;

    const currency =
      normalizeCurrency(meta.currency) ||
      normalizeCurrency(meta.priceCurrency) ||
      normalizeCurrency(meta.resolvedCurrency);

    return {
      amount,
      currency,
      text: formatPriceText(currency, amount),
      source: "metadata",
      displayMode: "booked",
    };
  }

  return null;
}

function buildMetadataTextPricePoint(item: SavedItem): PricePoint | null {
  if (item.status !== "booked") return null;

  const meta = (item.metadata ?? {}) as Record<string, unknown>;

  const textCandidates = [
    meta.resolvedPriceText,
    meta.priceText,
    meta.displayPrice,
    meta.livePrice,
    meta.price,
  ];

  for (const candidate of textCandidates) {
    const parsed = parsePriceText(candidate);
    if (!parsed) continue;

    return {
      ...parsed,
      displayMode: "booked",
    };
  }

  return null;
}

export function buildPricePointFromItem(item: SavedItem | null): PricePoint | null {
  if (!item) return null;
  if (item.status !== "booked") return null;

  const savedPoint = buildSavedItemPricePoint(item);
  const metadataNumericPoint = buildMetadataNumericPricePoint(item);
  const metadataTextPoint = buildMetadataTextPricePoint(item);

  const candidates = [savedPoint, metadataNumericPoint, metadataTextPoint].filter(
    (point): point is PricePoint => point !== null
  );

  if (candidates.length === 0) return null;

  return choosePreferredPoint(candidates);
}

function choosePreferredPoint(points: PricePoint[]): PricePoint | null {
  if (points.length === 0) return null;

  const withAmounts = points.filter(
    (point) =>
      typeof point.amount === "number" &&
      Number.isFinite(point.amount) &&
      point.amount > 0
  );

  if (withAmounts.length === 0) return null;

  const preferredCurrency =
    withAmounts.find((point) => point.currency === "GBP")?.currency ||
    withAmounts[0]?.currency ||
    null;

  const samePreferredCurrency = withAmounts.filter(
    (point) => (point.currency || null) === preferredCurrency
  );

  const pool = samePreferredCurrency.length > 0 ? samePreferredCurrency : withAmounts;

  return (
    pool.sort((a, b) => {
      const sourceRankDiff = rankSource(a.source) - rankSource(b.source);
      if (sourceRankDiff !== 0) return sourceRankDiff;

      const aAmount = a.amount ?? Number.POSITIVE_INFINITY;
      const bAmount = b.amount ?? Number.POSITIVE_INFINITY;
      if (aAmount !== bAmount) return aAmount - bAmount;

      const aText = clean(a.text);
      const bText = clean(b.text);
      return aText.localeCompare(bText);
    })[0] ?? null
  );
}

export function chooseBestPricePoint(
  items: SavedItem[],
  opts?: {
    includeStatuses?: Array<SavedItem["status"]>;
  }
): PricePoint | null {
  const allowedStatuses = opts?.includeStatuses ?? ["booked"];

  const points = items
    .filter((item) => item.status !== "archived")
    .filter((item) => allowedStatuses.includes(item.status))
    .map((item) => buildPricePointFromItem(item))
    .filter((point): point is PricePoint => point !== null);

  return choosePreferredPoint(points);
}

export function sumTripCorePrice(args: {
  tickets: PricePoint | null;
  flights: PricePoint | null;
  hotels: PricePoint | null;
}): PricePoint | null {
  const { tickets, flights, hotels } = args;

  if (!tickets || !flights || !hotels) return null;

  if (
    !isPositiveAmount(tickets.amount) ||
    !isPositiveAmount(flights.amount) ||
    !isPositiveAmount(hotels.amount)
  ) {
    return null;
  }

  const currency = sameCurrency([tickets, flights, hotels]);
  if (!currency) return null;

  const total = tickets.amount + flights.amount + hotels.amount;

  return {
    amount: total,
    currency,
    text: formatPriceText(currency, total),
    source: "saved_item",
    displayMode: "booked",
  };
}

export function buildBookingPriceBoard(savedItems: SavedItem[]): BookingPriceBoard {
  const activeItems = savedItems.filter((item) => item.status !== "archived");

  const tickets = chooseBestPricePoint(
    activeItems.filter((item) => item.type === "tickets"),
    { includeStatuses: ["booked"] }
  );

  const flights = chooseBestPricePoint(
    activeItems.filter((item) => item.type === "flight"),
    { includeStatuses: ["booked"] }
  );

  const hotels = chooseBestPricePoint(
    activeItems.filter((item) => item.type === "hotel"),
    { includeStatuses: ["booked"] }
  );

  const transfers = chooseBestPricePoint(
    activeItems.filter((item) => item.type === "transfer" || item.type === "train"),
    { includeStatuses: ["booked"] }
  );

  const experiences = chooseBestPricePoint(
    activeItems.filter((item) => item.type === "things"),
    { includeStatuses: ["booked"] }
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
  flightPricePoint: Omit<PricePoint, "displayMode"> | null;
}): BookingPriceBoard {
  void args;

  // Locked decision:
  // do not surface non-booked pricing in Trip Detail for now,
  // even if flights are API-backed.
  return args.board;
}

export function priceLine(point: PricePoint | null): string | null {
  if (!point) return null;
  if (!isPositiveAmount(point.amount)) return null;
  if (point.displayMode !== "booked") return null;

  const base =
    point.text && /^(GBP|EUR|USD)\s/i.test(point.text)
      ? point.text
      : point.text && /^[£€$]/.test(point.text)
        ? point.text
        : formatPriceText(point.currency || null, point.amount);

  return `Booked ${base}`;
}
