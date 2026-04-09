// src/core/partners.ts
// Compatibility shim over the canonical approved partner registry.

import {
  canonicalizePartnerId as canonicalizePartnerIdFromRegistry,
  getCanonicalPartnerId as getCanonicalPartnerIdFromRegistry,
  getPartner as getPartnerFromRegistry,
  getPartnerOrNull as getPartnerOrNullFromRegistry,
  getPartnersByCategory as getPartnersByCategoryFromRegistry,
  isPartnerId as isPartnerIdFromRegistry,
  listAllPartners,
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
  if (partner.category === "tickets") return "tickets";
  if (partner.category === "flights") return "flights";
  if (partner.category === "hotels") return "stays";
  if (partner.category === "insurance") return "insurance";
  return "utility";
}

function toLegacyPartner(partner: PartnerDefinition): Partner {
  return {
    id: partner.id,
    name: partner.display.name,
    category: toLegacyCategory(partner),
    affiliate: partner.capabilities.affiliate,
    api: partner.capabilities.api,
    deepLinkBase: partner.baseUrl || undefined,
    canonicalId: partner.id,
  };
}

export const PARTNERS = listAllPartners().map(toLegacyPartner) as readonly Partner[];
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
  if (category === "stays") {
    return getPartnersByCategoryFromRegistry("hotels").map(toLegacyPartner);
  }
  if (category === "insurance") {
    return getPartnersByCategoryFromRegistry("insurance").map(toLegacyPartner);
  }
  return [];
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
  return toLegacyPartner(getPartnerFromRegistry(canonical));
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

export function canonicalizePartnerId(id: string | null | undefined): PartnerId | null {
  return canonicalizePartnerIdFromRegistry(id);
}

export { PARTNER_MAP, PARTNERS_BY_CATEGORY };
