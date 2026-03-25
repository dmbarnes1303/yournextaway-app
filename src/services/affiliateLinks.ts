import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

export type CabinClass = "economy" | "premium" | "business" | "first";

export type BuildAffiliateLinksArgs = {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;
  passengers?: number | null;
  cabinClass?: CabinClass | null;
};

export type BuiltAffiliateLinks = {
  flightsUrl: string | null;
  hotelsUrl: string | null;
  transfersUrl: string | null;
  ticketsUrl: string | null;
  experiencesUrl: string | null;
  transportUrl: string | null;
  omioUrl: string | null;
  insuranceUrl: string | null;
  claimsUrl: string | null;
  mapsUrl: string | null;
};

/* ----------------------------- UTIL ----------------------------- */

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function enc(v: unknown) {
  return encodeURIComponent(clean(v));
}

function ymd(v: unknown): string | null {
  const raw = clean(v);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  try {
    return formatIsoToYmd(raw);
  } catch {
    return null;
  }
}

function yyyymmdd(v: string | null) {
  return v ? v.replace(/-/g, "") : null;
}

function clamp(n: unknown, min: number, max: number, fallback: number) {
  const num = Number(n);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(num)));
}

function safeUrl(v: unknown): string | null {
  const raw = clean(v);
  if (!raw) return null;
  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

function appendQuery(base: string, params: Record<string, any>) {
  if (!base) return "";
  const entries = Object.entries(params).filter(([, v]) => clean(v));
  if (!entries.length) return base;

  const join = base.includes("?") ? "&" : "?";
  const qs = entries.map(([k, v]) => `${enc(k)}=${enc(v)}`).join("&");
  return base + join + qs;
}

function mapsUrl(q: string) {
  const query = clean(q);
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${enc(query)}`;
}

function originIata(v: unknown) {
  const o = clean(v).toUpperCase();
  return o || "LON";
}

/* ----------------------------- CORE ----------------------------- */

function getDestinationIata(city: string): string | null {
  return clean(getIataCityCodeForCity(city)).toUpperCase() || null;
}

/* ----------------------------- FLIGHTS ----------------------------- */

function buildFlights(args: {
  city: string;
  origin: string;
  start: string | null;
  end: string | null;
  passengers: number;
  cabin: CabinClass;
}): string | null {
  const dest = getDestinationIata(args.city);
  const out = yyyymmdd(args.start);
  const back = yyyymmdd(args.end);

  // HARD RULE:
  // If we don’t have destination OR date → go generic
  if (!dest || !out) {
    return "https://www.aviasales.com/";
  }

  // Stable route format
  const route = `${args.origin}${out}${dest}${back || ""}${args.passengers}`;

  const base = `https://www.aviasales.com/search/${route}`;

  return appendQuery(base, {
    marker: AffiliateConfig.aviasalesMarker || null,
    cabin: args.cabin !== "economy" ? args.cabin : null,
  });
}

/* ----------------------------- HOTELS ----------------------------- */

function buildHotels(city: string, start: string | null, end: string | null, pax: number) {
  const base =
    safeUrl(AffiliateConfig.expediaTracked) ||
    "https://www.expedia.co.uk/Hotel-Search";

  return appendQuery(base, {
    destination: city,
    startDate: start,
    endDate: end,
    adults: String(Math.max(1, pax)),
    rooms: "1",
  });
}

/* ----------------------------- TRANSPORT ----------------------------- */

function buildOmio(city: string, origin: string, start: string | null, end: string | null) {
  const base =
    safeUrl(AffiliateConfig.omioTracked) ||
    "https://www.omio.com/";

  // FIX:
  // DO NOT pass IATA → useless for trains
  return appendQuery(base, {
    departureLocation: origin === "LON" ? "London" : origin,
    arrivalLocation: city,
    departureDate: start,
    arrivalDate: end,
  });
}

/* ----------------------------- TRANSFERS ----------------------------- */

function buildTransfers(city: string, date: string | null) {
  const base = safeUrl(AffiliateConfig.kiwitaxiTracked);
  if (!base) return null;

  return appendQuery(base, {
    to: city,
    date,
  });
}

/* ----------------------------- TICKETS ----------------------------- */

function buildTickets(city: string, start: string | null, end: string | null) {
  const base = safeUrl(AffiliateConfig.sportsevents365Tracked);
  if (!base) return null;

  return appendQuery(base, {
    q: city,
    from: start,
    to: end,
  });
}

/* ----------------------------- EXPERIENCES ----------------------------- */

function buildExperiences(city: string) {
  const id = clean(AffiliateConfig.getyourguidePartnerId);
  if (!city || !id) return null;

  return `https://www.getyourguide.com/s/?q=${enc(city)}&partner_id=${enc(id)}`;
}

/* ----------------------------- CLAIMS ----------------------------- */

function buildClaims() {
  return (
    safeUrl(AffiliateConfig.airhelpTracked) ||
    safeUrl(AffiliateConfig.compensairTracked) ||
    null
  );
}

/* ----------------------------- MAIN ----------------------------- */

export function buildAffiliateLinks(args: BuildAffiliateLinksArgs): BuiltAffiliateLinks {
  const city = clean(args.city);
  const start = ymd(args.startDate);
  const end = ymd(args.endDate);
  const origin = originIata(args.originIata);
  const passengers = clamp(args.passengers, 1, 9, 1);
  const cabin = (clean(args.cabinClass).toLowerCase() as CabinClass) || "economy";

  const omioUrl = buildOmio(city, origin, start, end);

  return {
    flightsUrl: buildFlights({
      city,
      origin,
      start,
      end,
      passengers,
      cabin,
    }),
    hotelsUrl: buildHotels(city, start, end, passengers),
    transfersUrl: buildTransfers(city, start),
    ticketsUrl: buildTickets(city, start, end),
    experiencesUrl: buildExperiences(city),
    transportUrl: omioUrl,
    omioUrl,
    insuranceUrl: safeUrl(AffiliateConfig.ektaTracked),
    claimsUrl: buildClaims(),
    mapsUrl: mapsUrl(city),
  };
}
