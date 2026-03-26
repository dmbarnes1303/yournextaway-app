// src/core/partners.ts
//
// LEGACY COMPATIBILITY SHIM
//
// This file is no longer a source of truth.
// Canonical commercial partner data now lives in:
//   src/constants/partners.ts
//
// Keep this file thin and boring so old imports do not keep a second registry alive.

import {
  canonicalizePartnerId as canonicalizePartnerIdFromRegistry,
  getCanonicalPartnerId as getCanonicalPartnerIdFromRegistry,
  getPartner as getPartnerFromRegistry,
  getPartnerOrNull as getPartnerOrNullFromRegistry,
  getPartnersByCategory as getPartnersByCategoryFromRegistry,
  isPartnerId as isPartnerIdFromRegistry,
  type PartnerId as CanonicalPartnerId,
  type PartnerDefinition,
} from "@/src/constants/partners";

export type PartnerCategory =
  | "tickets"
  | "flights"
  | "rail"
  | "stays"
  | "transfers"
  | "experiences"
  | "insurance"
  | "compensation"
  | "utility";

export type Partner = {
  id: string;
  name: string;
  category: PartnerCategory;
  affiliate: boolean;
  api: boolean;
  deepLinkBase?: string;
  canonicalId?: string;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function toLegacyCategory(partner: PartnerDefinition): PartnerCategory {
  if (partner.categories.includes("tickets")) return "tickets";
  if (partner.categories.includes("flights")) return "flights";
  if (partner.categories.includes("stays")) return "stays";
  if (partner.categories.includes("transfers")) return "transfers";
  if (partner.categories.includes("insurance")) return "insurance";
  if (partner.categories.includes("things")) return "experiences";
  if (partner.categories.includes("claim")) return "compensation";
  if (partner.categories.includes("maps") || partner.categories.includes("official_site")) {
    return "utility";
  }
  if (partner.categories.includes("trains") || partner.categories.includes("buses")) {
    return "rail";
  }

  return "utility";
}

function toLegacyPartner(partner: PartnerDefinition): Partner {
  return {
    id: partner.id,
    name: partner.display.name,
    category: toLegacyCategory(partner),
    affiliate: partner.capabilities.affiliate,
    api: partner.capabilities.api,
    deepLinkBase: partner.baseUrl,
    canonicalId: partner.id,
  };
}

/**
 * Legacy exported list.
 * This is derived from the canonical registry, not independently maintained.
 */
export const PARTNERS = [
  ...new Map(
    [
      "googlemaps",
      "footballticketsnet",
      "sportsevents365",
      "gigsberg",
      "seatpick",
      "aviasales",
      "omio",
      "expedia",
      "kiwitaxi",
      "welcomepickups",
      "tiqets",
      "klook",
      "getyourguide",
      "wegotrip",
      "safetywing",
      "ekta",
      "airhelp",
      "compensair",
    ].map((id) => {
      const canonical = getPartnerFromRegistry(id);
      return [canonical.id, toLegacyPartner(canonical)] as const;
    })
  ).values(),
] as const satisfies readonly Partner[];

export type PartnerId = CanonicalPartnerId;

const PARTNER_MAP: Record<string, Partner> = Object.fromEntries(
  PARTNERS.map((partner) => [partner.id, partner])
);

const PARTNERS_BY_CATEGORY: Record<PartnerCategory, Partner[]> = {
  tickets: [],
  flights: [],
  rail: [],
  stays: [],
  transfers: [],
  experiences: [],
  insurance: [],
  compensation: [],
  utility: [],
};

for (const partner of PARTNERS) {
  PARTNERS_BY_CATEGORY[partner.category].push(partner);
}

export function getPartnersByCategory(category: PartnerCategory): Partner[] {
  if (category === "tickets") {
    return getPartnersByCategoryFromRegistry("tickets").map(toLegacyPartner);
  }
  if (category === "flights") {
    return getPartnersByCategoryFromRegistry("flights").map(toLegacyPartner);
  }
  if (category === "rail") {
    const trains = getPartnersByCategoryFromRegistry("trains");
    const buses = getPartnersByCategoryFromRegistry("buses");
    return [...new Map([...trains, ...buses].map((p) => [p.id, toLegacyPartner(p)])).values()];
  }
  if (category === "stays") {
    return getPartnersByCategoryFromRegistry("stays").map(toLegacyPartner);
  }
  if (category === "transfers") {
    return getPartnersByCategoryFromRegistry("transfers").map(toLegacyPartner);
  }
  if (category === "experiences") {
    return getPartnersByCategoryFromRegistry("things").map(toLegacyPartner);
  }
  if (category === "insurance") {
    return getPartnersByCategoryFromRegistry("insurance").map(toLegacyPartner);
  }
  if (category === "compensation") {
    return getPartnersByCategoryFromRegistry("claim").map(toLegacyPartner);
  }
  return [
    ...getPartnersByCategoryFromRegistry("maps").map(toLegacyPartner),
    ...getPartnersByCategoryFromRegistry("official_site").map(toLegacyPartner),
  ];
}

export function getPartnerOrNull(id: string | null | undefined): Partner | null {
  const canonical = canonicalizePartnerIdFromRegistry(id);
  if (!canonical) return null;

  const partner = getPartnerOrNullFromRegistry(canonical);
  return partner ? toLegacyPartner(partner) : null;
}

export function getPartner(id: PartnerId | string): Partner {
  const canonical = canonicalizePartnerIdFromRegistry(id);

  if (!canonical) {
    throw new Error(`Unknown partner id: ${clean(id)}`);
  }

  const partner = getPartnerFromRegistry(canonical);
  return toLegacyPartner(partner);
}

export function isPartnerId(id: string | null | undefined): id is PartnerId {
  return isPartnerIdFromRegistry(id);
}

export function getCanonicalPartnerId(id: PartnerId | string): string {
  return getCanonicalPartnerIdFromRegistry(id);
}

export function isSamePartner(a?: string | null, b?: string | null): boolean {
  const left = clean(a);
  const right = clean(b);

  if (!left || !right) return false;

  try {
    return getCanonicalPartnerId(left) === getCanonicalPartnerId(right);
  } catch {
    return false;
  }
}

/**
 * Optional helper for migration/debugging.
 * Lets callers explicitly normalize legacy ids through the canonical registry.
 */
export function canonicalizePartnerId(id: string | null | undefined): PartnerId | null {
  return canonicalizePartnerIdFromRegistry(id);
}
