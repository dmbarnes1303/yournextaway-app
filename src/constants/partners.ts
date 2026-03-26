// src/services/affiliateLinks.ts
//
// Canonical outbound commercial link generation layer.
//
// This file consumes the canonical partner registry in src/constants/partners.ts
// and builds runtime-ready URLs for supported partners/categories.
//
// IMPORTANT:
// - Keep provider/category truth in the registry, not here.
// - Keep this file focused on building URLs from normalized context.
// - Do not redesign downstream consumers here.
// - Maintain compatibility output fields during migration.

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import {
  AffiliateConfig,
  getCanonicalPartnerId,
  getPartner,
  getPartnerFallbackBaseUrl,
  getTrackedConfigValue,
  isPartnerLive,
  supportsCategory,
  type CommercialCategory,
  type PartnerId,
} from "@/src/constants/partners";
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
  /* ---------------------------------------------------------------------- */
  /* Canonical category outputs                                             */
  /* ---------------------------------------------------------------------- */
  ticketsUrl: string | null;
  flightsUrl: string | null;
  staysUrl: string | null;
  trainsUrl: string | null;
  busesUrl: string | null;
  transfersUrl: string | null;
  insuranceUrl: string | null;
  thingsUrl: string | null;
  carHireUrl: string | null;

  /* ---------------------------------------------------------------------- */
  /* Utility outputs                                                        */
  /* ---------------------------------------------------------------------- */
  mapsUrl: string | null;
  officialSiteUrl: string | null;

  /* ---------------------------------------------------------------------- */
  /* Internal/non-commercial outputs                                        */
  /* ---------------------------------------------------------------------- */
  claimsUrl: string | null;

  /* ---------------------------------------------------------------------- */
  /* Migration compatibility aliases                                        */
  /* ---------------------------------------------------------------------- */
  hotelsUrl: string | null;
  experiencesUrl: string | null;
  transportUrl: string | null;
  omioUrl: string | null;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

function appendQuery(
  base: string | null,
  params: Record<string, string | null | undefined>
): string | null {
  const safeBase = clean(base);
  if (!safeBase) return null;

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

function getTrackedOrFallbackBase(partnerId: PartnerId): string | null {
  const tracked = getTrackedConfigValue(partnerId);
  if (tracked) return safeUrl(tracked);

  const fallback = getPartnerFallbackBaseUrl(partnerId);
  if (fallback) return safeUrl(fallback);

  const base = clean(getPartner(partnerId).baseUrl);
  return safeUrl(base);
}

function buildGenericPartnerBase(partnerId: PartnerId): string | null {
  const base = clean(getPartner(partnerId).baseUrl);
  return safeUrl(base);
}

function canBuildCommercialCategory(partnerId: PartnerId, category: CommercialCategory): boolean {
  return isPartnerLive(partnerId) && supportsCategory(partnerId, category);
}

function getPartnerId(input: PartnerId | string): PartnerId {
  return getCanonicalPartnerId(input);
}

/* -------------------------------------------------------------------------- */
/* Category-specific builders                                                 */
/* -------------------------------------------------------------------------- */

function buildFlightsUrl(args: {
  city: string;
  originIata: string;
  startDate: string | null;
  endDate: string | null;
  passengers: number;
  cabinClass: CabinClass;
}): string | null {
  const partnerId = getPartnerId("aviasales");
  if (!canBuildCommercialCategory(partnerId, "flights")) return null;

  const city = clean(args.city);
  const origin = normalizeOriginIata(args.originIata);
  const destination = resolveDestinationIata(city);
  const outbound = toCompactYmd(args.startDate);
  const inbound = toCompactYmd(args.endDate);
  const marker = clean(AffiliateConfig.aviasalesMarker);

  if (!destination || !outbound) {
    return getTrackedOrFallbackBase(partnerId);
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

function buildStaysUrl(args: {
  city: string;
  startDate: string | null;
  endDate: string | null;
  passengers: number;
}): string | null {
  const partnerId = getPartnerId("expedia");
  if (!canBuildCommercialCategory(partnerId, "stays")) return null;

  const city = clean(args.city);
  if (!city) return null;

  const trackedBase = safeUrl(clean(AffiliateConfig.expediaTracked));
  if (trackedBase) {
    return appendQuery(trackedBase, {
      destination: city,
      startDate: args.startDate,
      endDate: args.endDate,
      adults: String(Math.max(1, args.passengers)),
      rooms: "1",
    });
  }

  const fallbackBase = getPartnerFallbackBaseUrl(partnerId);
  return appendQuery(fallbackBase, {
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

function buildOmioJourneyUrl(args: {
  city: string;
  originIata: string;
  startDate: string | null;
  endDate: string | null;
}): string | null {
  const partnerId = getPartnerId("omio");
  if (!isPartnerLive(partnerId)) return null;

  const city = clean(args.city);
  const base = getTrackedOrFallbackBase(partnerId);

  if (!base || !city) return base;

  return appendQuery(base, {
    departureLocation: omioOriginLabel(normalizeOriginIata(args.originIata)),
    arrivalLocation: city,
    departureDate: args.startDate,
    arrivalDate: args.endDate,
  });
}

function buildTransfersUrl(args: { city: string; date: string | null }): string | null {
  const primaryPartnerId = getPartnerId("kiwitaxi");
  const fallbackPartnerId = getPartnerId("welcomepickups");

  const chosenPartner = isPartnerLive(primaryPartnerId)
    ? primaryPartnerId
    : isPartnerLive(fallbackPartnerId)
      ? fallbackPartnerId
      : null;

  if (!chosenPartner) return null;

  const base = getTrackedOrFallbackBase(chosenPartner);
  if (!base) return null;

  return appendQuery(base, {
    to: clean(args.city),
    destination: clean(args.city),
    date: args.date,
  });
}

function buildTicketsUrl(args: {
  city: string;
  startDate: string | null;
  endDate: string | null;
}): string | null {
  const partnerId = getPartnerId("sportsevents365");
  if (!canBuildCommercialCategory(partnerId, "tickets")) return null;

  const base = getTrackedOrFallbackBase(partnerId);
  if (!base) return null;

  const city = clean(args.city);

  return appendQuery(base, {
    q: city || null,
    city: city || null,
    from: args.startDate,
    to: args.endDate,
  });
}

function buildThingsUrl(city: string): string | null {
  const primaryPartnerId = getPartnerId("getyourguide");
  if (!canBuildCommercialCategory(primaryPartnerId, "things")) return null;

  const cityName = clean(city);
  const partnerId = clean(AffiliateConfig.getyourguidePartnerId);

  if (!cityName || !partnerId) return null;

  return `https://www.getyourguide.com/s/?q=${enc(cityName)}&partner_id=${enc(partnerId)}`;
}

function buildInsuranceUrl(): string | null {
  const ektaId = getPartnerId("ekta");
  if (isPartnerLive(ektaId)) {
    return getTrackedOrFallbackBase(ektaId);
  }

  const safetyWingId = getPartnerId("safetywing");
  if (isPartnerLive(safetyWingId)) {
    return getTrackedOrFallbackBase(safetyWingId) || buildGenericPartnerBase(safetyWingId);
  }

  return null;
}

function buildClaimsUrl(): string | null {
  const airhelpId = getPartnerId("airhelp");
  const compensairId = getPartnerId("compensair");

  if (isPartnerLive(airhelpId)) {
    return getTrackedOrFallbackBase(airhelpId);
  }

  if (isPartnerLive(compensairId)) {
    return getTrackedOrFallbackBase(compensairId);
  }

  return null;
}

function buildMapsUrl(city: string): string | null {
  return buildMapsSearchUrl(city);
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

export function buildAffiliateLinks(args: BuildAffiliateLinksArgs): BuiltAffiliateLinks {
  const city = clean(args.city);
  const startDate = normalizeYmd(args.startDate);
  const endDate = normalizeYmd(args.endDate);
  const originIata = normalizeOriginIata(args.originIata);
  const passengers = clampInt(args.passengers, 1, 9, 1);
  const cabinClass = normalizeCabinClass(args.cabinClass);

  const flightsUrl = buildFlightsUrl({
    city,
    originIata,
    startDate,
    endDate,
    passengers,
    cabinClass,
  });

  const staysUrl = buildStaysUrl({
    city,
    startDate,
    endDate,
    passengers,
  });

  const omioUrl = buildOmioJourneyUrl({
    city,
    originIata,
    startDate,
    endDate,
  });

  const transfersUrl = buildTransfersUrl({
    city,
    date: startDate,
  });

  const ticketsUrl = buildTicketsUrl({
    city,
    startDate,
    endDate,
  });

  const thingsUrl = buildThingsUrl(city);
  const insuranceUrl = buildInsuranceUrl();
  const claimsUrl = buildClaimsUrl();
  const mapsUrl = buildMapsUrl(city);

  return {
    /* Canonical */
    ticketsUrl,
    flightsUrl,
    staysUrl,
    trainsUrl: omioUrl,
    busesUrl: omioUrl,
    transfersUrl,
    insuranceUrl,
    thingsUrl,
    carHireUrl: null,

    /* Utility */
    mapsUrl,
    officialSiteUrl: null,

    /* Internal */
    claimsUrl,

    /* Compatibility aliases */
    hotelsUrl: staysUrl,
    experiencesUrl: thingsUrl,
    transportUrl: omioUrl,
    omioUrl,
  };
}
