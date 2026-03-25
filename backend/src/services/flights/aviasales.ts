import { env, hasAviasalesConfig } from "../../lib/env.js";

export type AviasalesFlightSearchInput = {
  originIata: string;
  destinationIata: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string | null; // YYYY-MM-DD
  currency?: string | null; // GBP, EUR, USD etc
  oneWay?: boolean;
  direct?: boolean;
  limit?: number;
  page?: number;
  market?: string | null;
};

export type AviasalesFlightOffer = {
  origin: string;
  destination: string;
  departureAt: string | null;
  returnAt: string | null;
  airline: string | null;
  flightNumber: string | null;
  transfers: number | null;
  returnTransfers: number | null;
  duration: number | null;
  durationTo: number | null;
  durationBack: number | null;
  price: number | null;
  currency: string;
  link: string | null;
  expiresAt: string | null;
  searchAt: string | null;
  gate: string | null;
  foundVia: "prices_for_dates";
};

export type AviasalesFlightSearchResult = {
  ok: boolean;
  source: "aviasales_data_api";
  cached: boolean;
  fromCacheAgeMs: number | null;
  offers: AviasalesFlightOffer[];
  cheapest: AviasalesFlightOffer | null;
  error?: string;
};

type AviasalesPricesForDatesItem = {
  origin?: string;
  destination?: string;
  departure_at?: string;
  return_at?: string;
  airline?: string;
  flight_number?: string | number;
  transfers?: number;
  return_transfers?: number;
  duration?: number;
  duration_to?: number;
  duration_back?: number;
  price?: number | string;
  link?: string;
  expires_at?: string;
  search_at?: string;
  gate?: string;
};

type AviasalesPricesForDatesResponse =
  | {
      success?: boolean;
      error?: string | null;
      currency?: string;
      data?: unknown;
    }
  | null;

type CacheEntry = {
  at: number;
  value: AviasalesFlightSearchResult;
};

const AVIASALES_TIMEOUT_MS = 10000;
const AVIASALES_CACHE_TTL_MS = 1000 * 60 * 30; // 30 mins
const AVIASALES_MAX_LIMIT = 50;

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<AviasalesFlightSearchResult>>();

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function upper(value: unknown): string {
  return clean(value).toUpperCase();
}

function toBool(value: unknown, fallback = false): boolean {
  const raw = clean(value).toLowerCase();
  if (!raw) return fallback;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return fallback;
}

function toPositiveInt(value: unknown, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

function toSafePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const raw = clean(value);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function isIsoDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(clean(value));
}

function normalizeIata(value: unknown): string {
  const raw = upper(value);
  return /^[A-Z]{3}$/.test(raw) ? raw : "";
}

function normalizeCurrency(value: unknown): string {
  const raw = upper(value);
  return /^[A-Z]{3}$/.test(raw) ? raw : "GBP";
}

function normalizeDate(value: unknown): string {
  const raw = clean(value);
  return isIsoDateOnly(raw) ? raw : "";
}

function clampLimit(value: unknown): number {
  const n = toPositiveInt(value, 10);
  return Math.max(1, Math.min(AVIASALES_MAX_LIMIT, n));
}

function clampPage(value: unknown): number {
  return Math.max(1, toPositiveInt(value, 1));
}

function buildCacheKey(input: AviasalesFlightSearchInput): string {
  return [
    normalizeIata(input.originIata),
    normalizeIata(input.destinationIata),
    normalizeDate(input.departureDate),
    normalizeDate(input.returnDate),
    normalizeCurrency(input.currency),
    String(toBool(input.oneWay, !clean(input.returnDate))),
    String(toBool(input.direct, false)),
    String(clampLimit(input.limit)),
    String(clampPage(input.page)),
    clean(input.market).toLowerCase(),
  ].join("|");
}

function getCached(key: string): AviasalesFlightSearchResult | null {
  const hit = cache.get(key);
  if (!hit) return null;

  const age = Date.now() - hit.at;
  if (age > AVIASALES_CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return {
    ...hit.value,
    cached: true,
    fromCacheAgeMs: age,
  };
}

function setCached(key: string, value: AviasalesFlightSearchResult): void {
  cache.set(key, {
    at: Date.now(),
    value: {
      ...value,
      cached: false,
      fromCacheAgeMs: null,
    },
  });
}

function buildBaseUrl(): string {
  return clean(env.aviasalesBaseUrl).replace(/\/+$/, "");
}

function buildPricesForDatesUrl(input: AviasalesFlightSearchInput): string {
  const url = new URL(`${buildBaseUrl()}/aviasales/v3/prices_for_dates`);

  const origin = normalizeIata(input.originIata);
  const destination = normalizeIata(input.destinationIata);
  const departureDate = normalizeDate(input.departureDate);
  const returnDate = normalizeDate(input.returnDate);
  const currency = normalizeCurrency(input.currency);
  const oneWay = toBool(input.oneWay, !returnDate);
  const direct = toBool(input.direct, false);
  const limit = clampLimit(input.limit);
  const page = clampPage(input.page);
  const market = clean(input.market);

  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("departure_at", departureDate);
  url.searchParams.set("one_way", String(oneWay));
  url.searchParams.set("direct", String(direct));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));
  url.searchParams.set("sorting", "price");
  url.searchParams.set("currency", currency);

  if (!oneWay && returnDate) {
    url.searchParams.set("return_at", returnDate);
  }

  if (market) {
    url.searchParams.set("market", market);
  }

  return url.toString();
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractItemsFromData(data: unknown): AviasalesPricesForDatesItem[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.filter(isObjectRecord) as AviasalesPricesForDatesItem[];
  }

  if (isObjectRecord(data)) {
    const values = Object.values(data);

    if (values.every((entry) => Array.isArray(entry))) {
      return values
        .flat()
        .filter(isObjectRecord) as AviasalesPricesForDatesItem[];
    }

    if (values.every((entry) => isObjectRecord(entry))) {
      return values.filter(isObjectRecord) as AviasalesPricesForDatesItem[];
    }
  }

  return [];
}

function normalizeOffer(
  item: AviasalesPricesForDatesItem,
  currency: string
): AviasalesFlightOffer | null {
  const origin = normalizeIata(item.origin);
  const destination = normalizeIata(item.destination);
  const price = toSafePrice(item.price);

  if (!origin || !destination || price == null) return null;

  return {
    origin,
    destination,
    departureAt: clean(item.departure_at) || null,
    returnAt: clean(item.return_at) || null,
    airline: clean(item.airline) || null,
    flightNumber: clean(item.flight_number) || null,
    transfers:
      typeof item.transfers === "number" && Number.isFinite(item.transfers)
        ? item.transfers
        : null,
    returnTransfers:
      typeof item.return_transfers === "number" && Number.isFinite(item.return_transfers)
        ? item.return_transfers
        : null,
    duration:
      typeof item.duration === "number" && Number.isFinite(item.duration)
        ? item.duration
        : null,
    durationTo:
      typeof item.duration_to === "number" && Number.isFinite(item.duration_to)
        ? item.duration_to
        : null,
    durationBack:
      typeof item.duration_back === "number" && Number.isFinite(item.duration_back)
        ? item.duration_back
        : null,
    price,
    currency,
    link: clean(item.link) || null,
    expiresAt: clean(item.expires_at) || null,
    searchAt: clean(item.search_at) || null,
    gate: clean(item.gate) || null,
    foundVia: "prices_for_dates",
  };
}

function sortOffers(a: AviasalesFlightOffer, b: AviasalesFlightOffer): number {
  const aPrice = a.price ?? Number.POSITIVE_INFINITY;
  const bPrice = b.price ?? Number.POSITIVE_INFINITY;
  if (aPrice !== bPrice) return aPrice - bPrice;

  const aTransfers = a.transfers ?? Number.POSITIVE_INFINITY;
  const bTransfers = b.transfers ?? Number.POSITIVE_INFINITY;
  if (aTransfers !== bTransfers) return aTransfers - bTransfers;

  const aDepart = clean(a.departureAt);
  const bDepart = clean(b.departureAt);
  return aDepart.localeCompare(bDepart);
}

function validateInput(input: AviasalesFlightSearchInput): string | null {
  if (!hasAviasalesConfig()) return "aviasales_not_configured";
  if (!normalizeIata(input.originIata)) return "invalid_origin_iata";
  if (!normalizeIata(input.destinationIata)) return "invalid_destination_iata";
  if (!normalizeDate(input.departureDate)) return "invalid_departure_date";

  const returnDate = normalizeDate(input.returnDate);
  const oneWay = toBool(input.oneWay, !returnDate);

  if (!oneWay && !returnDate) return "return_date_required_for_roundtrip";

  return null;
}

async function fetchJson(
  url: string
): Promise<{ ok: boolean; status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AVIASALES_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Access-Token": clean(env.aviasalesToken),
        "Accept-Encoding": "gzip, deflate",
      },
      signal: controller.signal,
    });

    const body = await res.text().catch(() => "");

    return {
      ok: res.ok,
      status: res.status,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFresh(
  input: AviasalesFlightSearchInput
): Promise<AviasalesFlightSearchResult> {
  const currency = normalizeCurrency(input.currency);
  const url = buildPricesForDatesUrl(input);

  const response = await fetchJson(url);

  if (!response.ok) {
    return {
      ok: false,
      source: "aviasales_data_api",
      cached: false,
      fromCacheAgeMs: null,
      offers: [],
      cheapest: null,
      error: `aviasales_http_${response.status}:${response.body.slice(0, 300)}`,
    };
  }

  let parsed: AviasalesPricesForDatesResponse = null;

  try {
    parsed = response.body
      ? (JSON.parse(response.body) as AviasalesPricesForDatesResponse)
      : null;
  } catch {
    return {
      ok: false,
      source: "aviasales_data_api",
      cached: false,
      fromCacheAgeMs: null,
      offers: [],
      cheapest: null,
      error: "aviasales_bad_json",
    };
  }

  if (!parsed?.success) {
    return {
      ok: false,
      source: "aviasales_data_api",
      cached: false,
      fromCacheAgeMs: null,
      offers: [],
      cheapest: null,
      error: clean(parsed?.error) || "aviasales_unsuccessful_response",
    };
  }

  const apiCurrency = normalizeCurrency((parsed as any)?.currency || currency);
  const items = extractItemsFromData(parsed.data);

  const offers = items
    .map((item) => normalizeOffer(item, apiCurrency))
    .filter((item): item is AviasalesFlightOffer => item !== null)
    .sort(sortOffers);

  return {
    ok: true,
    source: "aviasales_data_api",
    cached: false,
    fromCacheAgeMs: null,
    offers,
    cheapest: offers[0] ?? null,
  };
}

export async function searchAviasalesFlights(
  input: AviasalesFlightSearchInput
): Promise<AviasalesFlightSearchResult> {
  const validationError = validateInput(input);
  if (validationError) {
    return {
      ok: false,
      source: "aviasales_data_api",
      cached: false,
      fromCacheAgeMs: null,
      offers: [],
      cheapest: null,
      error: validationError,
    };
  }

  const key = buildCacheKey(input);
  const cached = getCached(key);
  if (cached) return cached;

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = fetchFresh(input)
    .then((result) => {
      if (result.ok) {
        setCached(key, result);
      }
      return result;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export async function getCheapestAviasalesFlight(
  input: AviasalesFlightSearchInput
): Promise<AviasalesFlightOffer | null> {
  const result = await searchAviasalesFlights({
    ...input,
    limit: input.limit ?? 10,
    page: input.page ?? 1,
  });

  return result.ok ? result.cheapest : null;
    }
