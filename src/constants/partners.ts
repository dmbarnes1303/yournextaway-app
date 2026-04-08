// src/constants/partners.ts
// Clean commercial partner registry.
// Only approved partners exist here.
// Tier model:
// - Tier 1 = live monetised now
// - Tier 2 = strategic / API-led / not monetised through affiliate tracking yet

export const COMMERCIAL_PARTNER_CATEGORIES = [
  "tickets",
  "flights",
  "hotels",
  "insurance",
] as const;

export const ALL_PARTNER_CATEGORIES = [...COMMERCIAL_PARTNER_CATEGORIES] as const;

export type CommercialCategory = (typeof COMMERCIAL_PARTNER_CATEGORIES)[number];
export type PartnerCategory = (typeof ALL_PARTNER_CATEGORIES)[number];

export const CANONICAL_PARTNER_IDS = [
  "aviasales",
  "expedia",
  "sportsevents365",
  "footballticketnet",
  "safetywing",
] as const;

export type PartnerId = (typeof CANONICAL_PARTNER_IDS)[number];
export type CanonicalPartnerId = PartnerId;

export type PartnerClassification = "TIER_1_MONETISED" | "TIER_2_STRATEGIC";

export type PartnerCapabilityFlags = {
  affiliate: boolean;
  api: boolean;
};

export type PartnerDisplay = {
  name: string;
  badgeText: string;
};

export type PartnerDefinition = {
  id: PartnerId;
  display: PartnerDisplay;
  category: CommercialCategory;
  classification: PartnerClassification;
  live: true;
  capabilities: PartnerCapabilityFlags;
  aliases: readonly string[];
  baseUrl: string;
  trackedConfigKey?: keyof typeof AffiliateConfig;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function normalizeKey(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\s\-]+/g, "_");
}

function unique<T>(items: readonly T[]): T[] {
  return Array.from(new Set(items));
}

/**
 * Affiliate configuration.
 *
 * Rules:
 * - no deleted partner config remains
 * - no legacy safetywingTracked remains
 * - no fake tracking params are invented
 * - FTN is API / strategic right now, so this stays as a clean direct URL
 *   until a real monetised outbound or API checkout implementation exists
 */
export const AffiliateConfig = {
  aviasalesMarker: "700937",
  aviasalesFallback: "https://www.aviasales.com/",

  expediaTracked: "https://www.expedia.co.uk/Hotel-Search?affcid=yna-expedia",

  sportsevents365Tracked: "https://www.sportsevents365.com/?a_aid=yna",

  // FTN is currently strategic / API-led, not affiliate-monetised.
  footballticketnetTracked: "https://www.footballticketnet.com/",

  safetywingAffiliateUrl:
    "https://safetywing.com/?referenceID=26471369&utm_source=26471369&utm_medium=Ambassador",
} as const;

export const PARTNER_REGISTRY = [
  {
    id: "aviasales",
    display: { name: "Aviasales", badgeText: "AVA" },
    category: "flights",
    classification: "TIER_1_MONETISED",
    live: true,
    capabilities: { affiliate: true, api: true },
    aliases: ["aviasales", "avia_sales"],
    baseUrl: "https://www.aviasales.com/",
  },
  {
    id: "expedia",
    display: { name: "Expedia", badgeText: "EXP" },
    category: "hotels",
    classification: "TIER_1_MONETISED",
    live: true,
    capabilities: { affiliate: true, api: false },
    aliases: ["expedia"],
    baseUrl: "https://www.expedia.co.uk/",
    trackedConfigKey: "expediaTracked",
  },
  {
    id: "sportsevents365",
    display: { name: "SportsEvents365", badgeText: "SE365" },
    category: "tickets",
    classification: "TIER_1_MONETISED",
    live: true,
    capabilities: { affiliate: true, api: false },
    aliases: ["sportsevents365", "sports_events_365", "sports-events-365", "se365"],
    baseUrl: "https://www.sportsevents365.com/",
    trackedConfigKey: "sportsevents365Tracked",
  },
  {
    id: "footballticketnet",
    display: { name: "FootballTicketNet", badgeText: "FTN" },
    category: "tickets",
    classification: "TIER_2_STRATEGIC",
    live: true,
    capabilities: { affiliate: false, api: true },
    aliases: [
      "footballticketnet",
      "football_ticket_net",
      "football-ticket-net",
      "ftn",
    ],
    baseUrl: "https://www.footballticketnet.com/",
    trackedConfigKey: "footballticketnetTracked",
  },
  {
    id: "safetywing",
    display: { name: "SafetyWing", badgeText: "SW" },
    category: "insurance",
    classification: "TIER_1_MONETISED",
    live: true,
    capabilities: { affiliate: true, api: false },
    aliases: ["safetywing", "safety_wing", "safety-wing"],
    baseUrl: "https://safetywing.com/",
    trackedConfigKey: "safetywingAffiliateUrl",
  },
] as const satisfies readonly PartnerDefinition[];

export const PARTNER_REGISTRY_BY_ID: Readonly<Record<PartnerId, PartnerDefinition>> =
  Object.freeze(
    PARTNER_REGISTRY.reduce((acc, partner) => {
      acc[partner.id] = partner;
      return acc;
    }, {} as Record<PartnerId, PartnerDefinition>)
  );

export const PARTNER_ALIAS_INDEX: Readonly<Record<string, PartnerId>> = Object.freeze(
  PARTNER_REGISTRY.reduce((acc, partner) => {
    const keys = unique([partner.id, partner.display.name, ...partner.aliases]).map(normalizeKey);

    for (const key of keys) {
      acc[key] = partner.id;
    }

    return acc;
  }, {} as Record<string, PartnerId>)
);

const COMMERCIAL_CATEGORY_SET = new Set<string>(COMMERCIAL_PARTNER_CATEGORIES);
const PARTNER_ID_SET = new Set<string>(CANONICAL_PARTNER_IDS);

export function isCommercialCategory(
  value: string | null | undefined
): value is CommercialCategory {
  return COMMERCIAL_CATEGORY_SET.has(clean(value));
}

export function isKnownPartnerCategory(
  value: string | null | undefined
): value is PartnerCategory {
  return COMMERCIAL_CATEGORY_SET.has(clean(value));
}

export function canonicalizePartnerId(input: string | null | undefined): PartnerId | null {
  const raw = clean(input);
  if (!raw) return null;

  const byAlias = PARTNER_ALIAS_INDEX[normalizeKey(raw)];
  return byAlias ?? null;
}

export function isPartnerId(input: string | null | undefined): input is PartnerId {
  const canonical = canonicalizePartnerId(input);
  return Boolean(canonical && PARTNER_ID_SET.has(canonical));
}

export function getCanonicalPartnerId(input: PartnerId | string): PartnerId {
  const canonical = canonicalizePartnerId(input);
  if (!canonical) {
    throw new Error(`Unknown canonical partner id: ${clean(input)}`);
  }
  return canonical;
}

export function getPartnerOrNull(
  input: PartnerId | string | null | undefined
): PartnerDefinition | null {
  const canonical = canonicalizePartnerId(input);
  return canonical ? PARTNER_REGISTRY_BY_ID[canonical] ?? null : null;
}

export function getPartner(input: PartnerId | string): PartnerDefinition {
  const partner = getPartnerOrNull(input);
  if (!partner) {
    throw new Error(`Unknown partner id: ${clean(input)}`);
  }
  return partner;
}

export function mustGetPartnerById(input: PartnerId | string): PartnerDefinition {
  return getPartner(input);
}

export function getPartnersByCategory(category: CommercialCategory): PartnerDefinition[] {
  return PARTNER_REGISTRY.filter((partner) => partner.category === category);
}

export function getLivePartnersByCategory(category: CommercialCategory): PartnerDefinition[] {
  return PARTNER_REGISTRY.filter((partner) => partner.live && partner.category === category);
}

export function getCommercialPartners(): PartnerDefinition[] {
  return [...PARTNER_REGISTRY];
}

export function listAllPartners(): PartnerDefinition[] {
  return [...PARTNER_REGISTRY];
}

export function isPartnerLive(input: PartnerId | string | null | undefined): boolean {
  const partner = getPartnerOrNull(input);
  return Boolean(partner?.live);
}

export function supportsCategory(
  input: PartnerId | string | null | undefined,
  category: CommercialCategory
): boolean {
  const partner = getPartnerOrNull(input);
  return Boolean(partner?.category === category);
}

export function getTrackedConfigValue(
  input: PartnerId | string | null | undefined
): string | null {
  const partner = getPartnerOrNull(input);
  if (!partner?.trackedConfigKey) return null;

  const value = AffiliateConfig[partner.trackedConfigKey];
  const cleaned = clean(value);

  return cleaned || null;
}

export function isTier1MonetisedPartner(
  input: PartnerId | string | null | undefined
): boolean {
  const partner = getPartnerOrNull(input);
  return partner?.classification === "TIER_1_MONETISED";
}

export function isTier2StrategicPartner(
  input: PartnerId | string | null | undefined
): boolean {
  const partner = getPartnerOrNull(input);
  return partner?.classification === "TIER_2_STRATEGIC";
}

export const PARTNER_REGISTRY_LIST = PARTNER_REGISTRY;
export const ALL_PARTNERS = PARTNER_REGISTRY;
