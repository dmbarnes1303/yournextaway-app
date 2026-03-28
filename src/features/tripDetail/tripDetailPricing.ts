import type { SavedItem } from "@/src/core/savedItemTypes";

export type PricePointSource =
  | "saved_item"
  | "metadata"
  | "price_text"
  | "live_api"
  | null;

export type PriceDisplayMode = "booked" | "live_from" | "est_from";

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
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
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
  if (raw === "GBP" || raw === "EUR" || raw === "USD") return raw;
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

function displayModeForItem(item: SavedItem): PriceDisplayMode {
  return item.status === "booked" ? "booked" : "est_from";
}

function rankDisplayMode(mode: PriceDisplayMode): number {
  if (mode === "booked") return 0;
  if (mode === "live_from") return 1;
  return 2;
}

function rankSource(source: PricePointSource): number {
  if (source === "saved_item") return 0;
  if (source === "live_api") return 1;
  if (source === "metadata") return 2;
  if (source === "price_text") return 3;
  return 4;
}

function isTotalEligible(point: PricePoint | null): point is PricePoint {
  if (!point) return false;
  if (!isPositiveAmount(point.amount)) return false;

  if (point.displayMode === "booked") {
    return point.source === "saved_item" || point.source === "metadata";
  }

  if (point.displayMode === "live_from") {
    return point.source === "live_api";
  }

  return false;
}

function withDisplayMode(
  point: Omit<PricePoint, "displayMode">,
  displayMode: PriceDisplayMode
): PricePoint {
  return {
    ...point,
    displayMode,
  };
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
  const directText = parsePriceText(item.priceText);

  if (!directText) return null;

  return {
    amount: directText.amount,
    currency: directText.currency,
    text: directText.text,
    source: "saved_item",
    displayMode: displayModeForItem(item),
  };
}

function buildMetadataNumericPricePoint(item: SavedItem): PricePoint | null {
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
      displayMode: displayModeForItem(item),
    };
  }

  return null;
}

function buildMetadataTextPricePoint(item: SavedItem): PricePoint | null {
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
      displayMode: displayModeForItem(item),
    };
  }

  return null;
}

export function buildPricePointFromItem(item: SavedItem | null): PricePoint | null {
  if (!item) return null;

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
      const modeRankDiff = rankDisplayMode(a.displayMode) - rankDisplayMode(b.displayMode);
      if (modeRankDiff !== 0) return modeRankDiff;

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
  const allowedStatuses = opts?.includeStatuses ?? ["saved", "pending", "booked"];

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

  if (!isTotalEligible(tickets) || !isTotalEligible(flights) || !isTotalEligible(hotels)) {
    return null;
  }

  if (
    tickets.displayMode !== flights.displayMode ||
    flights.displayMode !== hotels.displayMode
  ) {
    return null;
  }

  const currency = sameCurrency([tickets, flights, hotels]);
  if (!currency) return null;

  const amount = tickets.amount + flights.amount + hotels.amount;
  const displayMode = tickets.displayMode;

  return {
    amount,
    currency,
    text: formatPriceText(currency, amount),
    source: displayMode === "live_from" ? "live_api" : "saved_item",
    displayMode,
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
    activeItems.filter((item) => item.type === "transfer" || item.type === "train")
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
  flightPricePoint: Omit<PricePoint, "displayMode"> | null;
}): BookingPriceBoard {
  const override = args.flightPricePoint
    ? withDisplayMode(
        {
          amount: args.flightPricePoint.amount,
          currency: args.flightPricePoint.currency,
          text: args.flightPricePoint.text,
          source: "live_api",
        },
        "live_from"
      )
    : null;

  const flights = override || args.board.flights;

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

export function priceLine(point: PricePoint | null): string | null {
  if (!isPositiveAmount(point?.amount)) return null;

  const base =
    point.text && /^(GBP|EUR|USD)\s/i.test(point.text)
      ? point.text
      : point.text && /^[£€$]/.test(point.text)
        ? point.text
        : formatPriceText(point?.currency || null, point.amount);

  if (point?.displayMode === "booked") return `Booked ${base}`;
  if (point?.displayMode === "live_from") return `Live from ${base}`;
  return `Est. from ${base}`;
}
