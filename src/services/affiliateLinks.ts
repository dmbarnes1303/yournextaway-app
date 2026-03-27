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

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function enc(value: unknown): string {
  return encodeURIComponent(clean(value));
}

function normalizeYmd(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  try {
    return formatIsoToYmd(raw);
  } catch {
    return null;
  }
}

function toCompactYmd(value: string | null): string | null {
  return value ? value.replace(/-/g, "") : null;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function normalizeCabinClass(value: unknown): CabinClass {
  const raw = clean(value).toLowerCase();

  if (raw === "premium") return "premium";
  if (raw === "business") return "business";
  if (raw === "first") return "first";
  return "economy";
}

function safeUrl(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (!/^https?:$/i.test(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function appendQuery(
  base: string,
  params: Record<string, string | null | undefined>
): string {
  const safeBase = clean(base);
  if (!safeBase) return "";

  const entries = Object.entries(params).filter(([, value]) => clean(value));
  if (!entries.length) return safeBase;

  const joiner = safeBase.includes("?") ? "&" : "?";
  const qs = entries.map(([key, value]) => `${enc(key)}=${enc(value)}`).join("&");

  return `${safeBase}${joiner}${qs}`;
}

function buildMapsSearchUrl(query: string): string | null {
  const q = clean(query);
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
}

function normalizeOriginIata(value: unknown): string {
  const raw = clean(value).toUpperCase();
  return /^[A-Z]{3}$/.test(raw) ? raw : "LON";
}

function resolveDestinationIata(city: string): string | null {
  const resolved = clean(getIataCityCodeForCity(city)).toUpperCase();
  return /^[A-Z]{3}$/.test(resolved) ? resolved : null;
}

function trackedOrFallbackUrl(
  trackedValue: unknown,
  fallback: string | null = null
): string | null {
  return safeUrl(trackedValue) || safeUrl(fallback);
}

function buildFlightsUrl(args: {
  city: string;
  originIata: string;
  startDate: string | null;
  endDate: string | null;
  passengers: number;
  cabinClass: CabinClass;
}): string | null {
  const city = clean(args.city);
  const origin = normalizeOriginIata(args.originIata);
  const destination = resolveDestinationIata(city);
  const outbound = toCompactYmd(args.startDate);
  const inbound = toCompactYmd(args.endDate);
  const marker = clean(AffiliateConfig.aviasalesMarker);

  const fallback =
    trackedOrFallbackUrl(AffiliateConfig.aviasalesFallback) ||
    trackedOrFallbackUrl("https://www.aviasales.com/");

  if (!destination || !outbound) {
    return fallback;
  }

  const routeToken = `${origin}${outbound}${destination}${inbound || ""}${Math.max(
    1,
    args.passengers
  )}`;

  const base = `https://www.aviasales.com/search/${routeToken}`;

  return appendQuery(base, {
    marker: marker || null,
    cabin: args.cabinClass !== "economy" ? args.cabinClass : null,
  });
}

function buildHotelsUrl(args: {
  city: string;
  startDate: string | null;
  endDate: string | null;
  passengers: number;
}): string | null {
  const city = clean(args.city);
  if (!city) return null;

  const base =
    trackedOrFallbackUrl(AffiliateConfig.expediaTracked) ||
    trackedOrFallbackUrl("https://www.expedia.co.uk/Hotel-Search");

  if (!base) return null;

  return appendQuery(base, {
    destination: city,
    startDate: args.startDate,
    endDate: args.endDate,
    adults: String(Math.max(1, args.passengers)),
    rooms: "1",
  });
}

function omioOriginLabel(originIata: string): string {
  if (originIata === "LON") return "London";
  if (originIata === "PAR") return "Paris";
  if (originIata === "MIL") return "Milan";
  if (originIata === "ROM") return "Rome";
  return originIata;
}

function buildOmioUrl(args: {
  city: string;
  originIata: string;
  startDate: string | null;
  endDate: string | null;
}): string | null {
  const city = clean(args.city);

  const base =
    trackedOrFallbackUrl(AffiliateConfig.omioTracked) ||
    trackedOrFallbackUrl("https://www.omio.com/");

  if (!base || !city) return base;

  return appendQuery(base, {
    departureLocation: omioOriginLabel(normalizeOriginIata(args.originIata)),
    arrivalLocation: city,
    departureDate: args.startDate,
    arrivalDate: args.endDate,
  });
}

function buildTransfersUrl(args: {
  city: string;
  date: string | null;
}): string | null {
  const city = clean(args.city);
  if (!city) return null;

  const base = trackedOrFallbackUrl(AffiliateConfig.kiwitaxiTracked);
  if (!base) return null;

  return appendQuery(base, {
    to: city,
    destination: city,
    date: args.date,
  });
}

function buildTicketsUrl(args: {
  city: string;
  startDate: string | null;
  endDate: string | null;
}): string | null {
  const base = trackedOrFallbackUrl(AffiliateConfig.sportsevents365Tracked);
  if (!base) return null;

  const city = clean(args.city);

  return appendQuery(base, {
    q: city || null,
    city: city || null,
    from: args.startDate,
    to: args.endDate,
  });
}

function buildExperiencesUrl(city: string): string | null {
  const cityName = clean(city);
  const partnerId = clean(AffiliateConfig.getyourguidePartnerId);

  if (!cityName || !partnerId) return null;

  return `https://www.getyourguide.com/s/?q=${enc(cityName)}&partner_id=${enc(partnerId)}`;
}

function buildInsuranceUrl(): string | null {
  return trackedOrFallbackUrl(AffiliateConfig.ektaTracked);
}

function buildClaimsUrl(): string | null {
  return (
    trackedOrFallbackUrl(AffiliateConfig.airhelpTracked) ||
    trackedOrFallbackUrl(AffiliateConfig.compensairTracked) ||
    null
  );
}

export function buildAffiliateLinks(args: BuildAffiliateLinksArgs): BuiltAffiliateLinks {
  const city = clean(args.city);
  const startDate = normalizeYmd(args.startDate);
  const endDate = normalizeYmd(args.endDate);
  const originIata = normalizeOriginIata(args.originIata);
  const passengers = clampInt(args.passengers, 1, 9, 1);
  const cabinClass = normalizeCabinClass(args.cabinClass);

  const omioUrl = buildOmioUrl({
    city,
    originIata,
    startDate,
    endDate,
  });

  return {
    flightsUrl: buildFlightsUrl({
      city,
      originIata,
      startDate,
      endDate,
      passengers,
      cabinClass,
    }),
    hotelsUrl: buildHotelsUrl({
      city,
      startDate,
      endDate,
      passengers,
    }),
    transfersUrl: buildTransfersUrl({
      city,
      date: startDate,
    }),
    ticketsUrl: buildTicketsUrl({
      city,
      startDate,
      endDate,
    }),
    experiencesUrl: buildExperiencesUrl(city),
    transportUrl: omioUrl,
    omioUrl,
    insuranceUrl: buildInsuranceUrl(),
    claimsUrl: buildClaimsUrl(),
    mapsUrl: buildMapsSearchUrl(city),
  };
}
