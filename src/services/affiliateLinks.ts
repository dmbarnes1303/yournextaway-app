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

function ymdOrNull(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  try {
    return formatIsoToYmd(raw);
  } catch {
    return null;
  }
}

function yyyymmdd(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/-/g, "");
}

function slugCity(city: string): string {
  return clean(city)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return Math.max(min, Math.min(max, i));
}

function normalizeCabinClass(value: unknown): CabinClass {
  const raw = clean(value).toLowerCase();

  if (raw === "premium") return "premium";
  if (raw === "business") return "business";
  if (raw === "first") return "first";
  return "economy";
}

function appendQuery(
  base: string,
  params: Record<string, string | null | undefined>
): string {
  const safeBase = clean(base);
  if (!safeBase) return "";

  const entries = Object.entries(params).filter(([, v]) => clean(v));
  if (!entries.length) return safeBase;

  const joiner = safeBase.includes("?") ? "&" : "?";
  const qs = entries.map(([k, v]) => `${enc(k)}=${enc(v)}`).join("&");
  return `${safeBase}${joiner}${qs}`;
}

function safeTrackedUrl(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

function googleMapsSearchUrl(query: string): string | null {
  const q = clean(query);
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
}

function buildAviasalesUrl(args: {
  city: string;
  originIata: string;
  startDate: string | null;
  endDate: string | null;
  passengers: number;
  cabinClass: CabinClass;
}): string | null {
  const marker = clean(AffiliateConfig.aviasalesMarker);
  const trackedFallback = safeTrackedUrl(AffiliateConfig.aviasalesFallback);

  const cityName = clean(args.city);
  const origin = clean(args.originIata) || "LON";
  const destination = cityName ? getIataCityCodeForCity(cityName) : null;
  const outbound = yyyymmdd(args.startDate);
  const inbound = yyyymmdd(args.endDate);

  if (marker && destination && outbound) {
    const routeToken = `${origin}${destination}${outbound}1`;
    const base = `https://www.aviasales.com/search/${routeToken}?marker=${enc(marker)}`;

    return appendQuery(base, {
      return_date: inbound,
      adults: args.passengers > 1 ? String(args.passengers) : null,
      cabin: args.cabinClass !== "economy" ? args.cabinClass : null,
    });
  }

  return trackedFallback;
}

function buildExpediaUrl(args: {
  city: string;
  startDate: string | null;
  endDate: string | null;
  passengers: number;
}): string | null {
  const cityName = clean(args.city);
  const token = clean(AffiliateConfig.expediaToken);

  if (!cityName || !token) return null;

  const slug = slugCity(cityName);
  const base = `https://expedia.com/affiliates/hotel-search-${slug}.${token}`;

  return appendQuery(base, {
    startDate: args.startDate,
    endDate: args.endDate,
    adults: String(args.passengers),
  });
}

function buildKiwitaxiUrl(args: {
  city: string;
  startDate: string | null;
}): string | null {
  const tracked = safeTrackedUrl(AffiliateConfig.kiwitaxiTracked);
  if (!tracked) return null;

  const cityName = clean(args.city);
  if (!cityName) return tracked;

  return appendQuery(tracked, {
    to: cityName,
    destination: cityName,
    date: args.startDate,
  });
}

function buildSportsEvents365Url(args: {
  city: string;
  startDate: string | null;
  endDate: string | null;
}): string | null {
  const tracked = safeTrackedUrl(AffiliateConfig.sportsevents365Tracked);
  if (!tracked) return null;

  const cityName = clean(args.city);

  return appendQuery(tracked, {
    q: cityName || null,
    city: cityName || null,
    from: args.startDate,
    to: args.endDate,
  });
}

function buildGetYourGuideUrl(city: string): string | null {
  const cityName = clean(city);
  const partnerId = clean(AffiliateConfig.getyourguidePartnerId);

  if (!cityName || !partnerId) return null;

  return `https://www.getyourguide.com/s/?q=${enc(cityName)}&partner_id=${enc(partnerId)}`;
}

function buildOmioUrl(args: {
  city: string;
  startDate: string | null;
  endDate: string | null;
}): string | null {
  const base = safeTrackedUrl(AffiliateConfig.omioTracked);
  if (!base) return null;

  const city = clean(args.city);

  return appendQuery(base, {
    destination: city || null,
    destination_name: city || null,
    outboundDate: args.startDate,
    departureDate: args.startDate,
    inboundDate: args.endDate,
    returnDate: args.endDate,
  });
}

function buildTrackedOnlyUrl(value: unknown): string | null {
  return safeTrackedUrl(value);
}

function buildClaimsUrl(): string | null {
  return (
    buildTrackedOnlyUrl(AffiliateConfig.airhelpTracked) ??
    buildTrackedOnlyUrl(AffiliateConfig.compensairTracked) ??
    null
  );
}

/**
 * Canonical affiliate builder.
 * Returns only real partner URLs that are actually configured.
 * No fake Google commercial fallbacks.
 */
export function buildAffiliateLinks(args: BuildAffiliateLinksArgs): BuiltAffiliateLinks {
  const cityName = clean(args.city);
  const startDate = ymdOrNull(args.startDate);
  const endDate = ymdOrNull(args.endDate);
  const originIata = clean(args.originIata) || "LON";
  const passengers = clampInt(args.passengers, 1, 9, 1);
  const cabinClass = normalizeCabinClass(args.cabinClass);

  return {
    flightsUrl: buildAviasalesUrl({
      city: cityName,
      originIata,
      startDate,
      endDate,
      passengers,
      cabinClass,
    }),
    hotelsUrl: buildExpediaUrl({
      city: cityName,
      startDate,
      endDate,
      passengers,
    }),
    transfersUrl: buildKiwitaxiUrl({
      city: cityName,
      startDate,
    }),
    ticketsUrl: buildSportsEvents365Url({
      city: cityName,
      startDate,
      endDate,
    }),
    experiencesUrl: buildGetYourGuideUrl(cityName),
    transportUrl: buildOmioUrl({
      city: cityName,
      startDate,
      endDate,
    }),
    insuranceUrl: buildTrackedOnlyUrl(AffiliateConfig.ektaTracked),
    claimsUrl: buildClaimsUrl(),
    mapsUrl: googleMapsSearchUrl(cityName),
  };
    }
