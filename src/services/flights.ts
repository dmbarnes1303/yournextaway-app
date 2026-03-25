import { getBackendBaseUrl } from "@/src/config/env";

export type FlightOffer = {
  id: string;
  price: number;
  currency: string;

  origin: string;
  destination: string;

  departureTime: string;
  arrivalTime: string;

  returnDepartureTime?: string | null;
  returnArrivalTime?: string | null;

  airline: string;
  flightNumber?: string | null;

  deepLink: string;
  provider: "aviasales";

  durationMinutes?: number | null;
  stops?: number;
};

export type FlightSearchResult = {
  ok: boolean;
  offers: FlightOffer[];
  cheapest: FlightOffer | null;

  cached: boolean;
  fromCacheAgeMs: number | null;

  error?: string;
};

/* ---------------- helpers ---------------- */

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function buildUrl(params: {
  originIata: string;
  destinationIata: string;
  departureDate: string;
  returnDate?: string | null;
  currency?: string;
  oneWay?: boolean;
  direct?: boolean;
  limit?: number;
  page?: number;
}) {
  const base = getBackendBaseUrl();
  if (!base) return null;

  const qs = new URLSearchParams({
    originIata: clean(params.originIata),
    destinationIata: clean(params.destinationIata),
    departureDate: clean(params.departureDate),
  });

  if (params.returnDate) qs.set("returnDate", clean(params.returnDate));
  if (params.currency) qs.set("currency", clean(params.currency));
  if (params.oneWay) qs.set("oneWay", "1");
  if (params.direct) qs.set("direct", "1");
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.page) qs.set("page", String(params.page));

  qs.set("_ts", String(Date.now())); // bust cache if needed

  return `${base}/flights/search?${qs.toString()}`;
}

/* ---------------- main function ---------------- */

export async function searchFlights(params: {
  originIata: string;
  destinationIata: string;
  departureDate: string;
  returnDate?: string | null;
  currency?: string;
  oneWay?: boolean;
  direct?: boolean;
  limit?: number;
  page?: number;
}): Promise<FlightSearchResult> {
  const url = buildUrl(params);

  if (!url) {
    return {
      ok: false,
      offers: [],
      cheapest: null,
      cached: false,
      fromCacheAgeMs: null,
      error: "missing_backend_url",
    };
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    const raw = await res.text();

    let parsed: FlightSearchResult | null = null;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        ok: false,
        offers: [],
        cheapest: null,
        cached: false,
        fromCacheAgeMs: null,
        error: "invalid_json",
      };
    }

    if (!parsed) {
      return {
        ok: false,
        offers: [],
        cheapest: null,
        cached: false,
        fromCacheAgeMs: null,
        error: "empty_response",
      };
    }

    if (!res.ok) {
      return {
        ...parsed,
        ok: false,
        error: parsed.error || `http_${res.status}`,
      };
    }

    return parsed;
  } catch (e: any) {
    return {
      ok: false,
      offers: [],
      cheapest: null,
      cached: false,
      fromCacheAgeMs: null,
      error: "network_error",
    };
  }
}
