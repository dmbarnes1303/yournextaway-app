// src/constants/partners.ts
// Canonical approved commercial partner registry.

export const COMMERCIAL_PARTNER_CATEGORIES = [
  "tickets",
  "flights",
  "hotels",
  "insurance",
] as const;

export type CommercialCategory = (typeof COMMERCIAL_PARTNER_CATEGORIES)[number];
export type PartnerCategory = CommercialCategory;
export type PartnerTier = "tier1" | "tier2";

export const CANONICAL_PARTNER_IDS = [
  "sportsevents365",
  "footballticketnet",
  "aviasales",
  "expedia",
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
  logoUrl?: string;
};

export type PartnerDefinition = {
  id: PartnerId;
  display: PartnerDisplay;
  category: CommercialCategory;
  primaryCategory: PartnerCategory;
  categories: readonly PartnerCategory[];
  tier: PartnerTier;
  classification: PartnerClassification;
  live: true;
  capabilities: PartnerCapabilityFlags;
  aliases: readonly string[];
  baseUrl: string;
  trackedConfigKey?: keyof typeof AffiliateConfig;
};

const PARTNER_LOGO_BASE =
  "https://raw.githubusercontent.com/dmbarnes1303/yournextaway-app/main/assets/partners";

const partnerLogo = (fileName: string) => `${PARTNER_LOGO_BASE}/${fileName}.png`;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function normalizeKey(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\s\-]+/g, "_");
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

export const AffiliateConfig = {
  aviasalesMarker: "700937",
  aviasalesFallback: "https://www.aviasales.com/",
  expediaTracked: "https://www.expedia.co.uk/Hotel-Search?affcid=yna-expedia",
  sportsevents365Tracked: "https://www.sportsevents365.com/?a_aid=yna",
  footballticketnetTracked: "https://www.footballticketnet.com/",
  safetywingAffiliateUrl:
    "https://safetywing.com/?referenceID=26471369&utm_source=26471369&utm_medium=Ambassador",
} as const;

export const PARTNER_REGISTRY = [
  {
    id: "sportsevents365",
    display: {
      name: "SportsEvents365",
      badgeText: "SE365",
      logoUrl: partnerLogo("sportsevents365"),
    },
    category: "tickets",
    primaryCategory: "tickets",
    categories: ["tickets"] as const,
    tier: "tier1",
    classification: "TIER_1_MONETISED",
    live: true,
    capabilities: { affiliate: true, api: false },
    aliases: ["sportsevents365", "sports_events_365", "sports-events-365", "se365"],
    baseUrl: "https://www.sportsevents365.com/",
    trackedConfigKey: "sportsevents365Tracked",
  },
  {
    id: "footballticketnet",
    display: {
      name: "FootballTicketNet",
      badgeText: "FTN",
      logoUrl: partnerLogo("footballticketnet"),
    },
    category: "tickets",
    primaryCategory: "tickets",
    categories: ["tickets"] as const,
    tier: "tier2",
    classification: "TIER_2_STRATEGIC",
    live: true,
    capabilities: { affiliate: false, api: true },
    aliases: [
      "footballticketnet",
      "footballticketsnet",
      "football_ticket_net",
      "football-ticket-net",
      "footballticketsnet.com",
      "footballticketnet.com",
      "ftn",
    ],
    baseUrl: "https://www.footballticketnet.com/",
    trackedConfigKey: "footballticketnetTracked",
  },
  {
    id: "aviasales",
    display: { name: "Aviasales", badgeText: "AVA" },
    category: "flights",
    primaryCategory: "flights",
    categories: ["flights"] as const,
    tier: "tier1",
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
    primaryCategory: "hotels",
    categories: ["hotels"] as const,
    tier: "tier1",
    classification: "TIER_1_MONETISED",
    live: true,
    capabilities: { affiliate: true, api: false },
    aliases: ["expedia"],
    baseUrl: "https://www.expedia.co.uk/",
    trackedConfigKey: "expediaTracked",
  },
  {
    id: "safetywing",
    display: { name: "SafetyWing", badgeText: "SW" },
    category: "insurance",
    primaryCategory: "insurance",
    categories: ["insurance"] as const,
    tier: "tier1",
    classification: "TIER_1_MONETISED",
    live: true,
    capabilities: { affiliate: true, api: false },
    aliases: ["safetywing", "safety_wing", "safety-wing"],
    baseUrl: "https://safetywing.com/",
    trackedConfigKey: "safetywingAffiliateUrl",
  },
] as const satisfies readonly PartnerDefinition[];

export const PARTNER_REGISTRY_BY_ID: Readonly<Record<PartnerId, PartnerDefinition>> = Object.freeze(
  PARTNER_REGISTRY.reduce((acc, partner) => {
    acc[partner.id] = partner;
    return acc;
  }, {} as Record<PartnerId, PartnerDefinition>)
);

export const PARTNER_ALIAS_INDEX: Readonly<Record<string, PartnerId>> = Object.freeze(
  PARTNER_REGISTRY.reduce((acc, partner) => {
    const keys = unique([partner.id, partner.display.name, ...partner.aliases]).map(normalizeKey);
    for (const key of keys) acc[key] = partner.id;
    return acc;
  }, {} as Record<string, PartnerId>)
);

const PARTNER_ID_SET = new Set<string>(CANONICAL_PARTNER_IDS);
const CATEGORY_SET = new Set<string>(COMMERCIAL_PARTNER_CATEGORIES);

export function isCommercialCategory(value: string | null | undefined): value is CommercialCategory {
  return CATEGORY_SET.has(clean(value));
}

export function isKnownPartnerCategory(value: string | null | undefined): value is PartnerCategory {
  return isCommercialCategory(value);
}

export function canonicalizePartnerId(input: string | null | undefined): PartnerId | null {
  const raw = clean(input);
  if (!raw) return null;
  return PARTNER_ALIAS_INDEX[normalizeKey(raw)] ?? null;
}

export function isPartnerId(input: string | null | undefined): input is PartnerId {
  const canonical = canonicalizePartnerId(input);
  return Boolean(canonical && PARTNER_ID_SET.has(canonical));
}

export function getCanonicalPartnerId(input: PartnerId | string): PartnerId {
  const canonical = canonicalizePartnerId(input);
  if (!canonical) throw new Error(`Unknown canonical partner id: ${clean(input)}`);
  return canonical;
}

export function getPartnerOrNull(input: PartnerId | string | null | undefined): PartnerDefinition | null {
  const canonical = canonicalizePartnerId(input);
  return canonical ? PARTNER_REGISTRY_BY_ID[canonical] ?? null : null;
}

export function getPartner(input: PartnerId | string): PartnerDefinition {
  const partner = getPartnerOrNull(input);
  if (!partner) throw new Error(`Unknown partner id: ${clean(input)}`);
  return partner;
}

export function getPartnerLogoUrl(input: PartnerId | string | null | undefined): string | null {
  return clean(getPartnerOrNull(input)?.display?.logoUrl) || null;
}

export function getPartnerBadgeText(input: PartnerId | string | null | undefined): string {
  return clean(getPartnerOrNull(input)?.display?.badgeText) || "YN";
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
  return Boolean(getPartnerOrNull(input)?.live);
}

export function supportsCategory(
  input: PartnerId | string | null | undefined,
  category: CommercialCategory
): boolean {
  return getPartnerOrNull(input)?.category === category;
}

export function getTrackedConfigValue(input: PartnerId | string | null | undefined): string | null {
  const partner = getPartnerOrNull(input);
  if (!partner?.trackedConfigKey) return null;
  const value = AffiliateConfig[partner.trackedConfigKey];
  return clean(value) || null;
}

export function isTier1MonetisedPartner(input: PartnerId | string | null | undefined): boolean {
  return getPartnerOrNull(input)?.tier === "tier1";
}

export function isTier2StrategicPartner(input: PartnerId | string | null | undefined): boolean {
  return getPartnerOrNull(input)?.tier === "tier2";
}

export function getPartnerTier(input: PartnerId | string | null | undefined): PartnerTier | null {
  return getPartnerOrNull(input)?.tier ?? null;
}

export function isUtilityPartner(_input: PartnerId | string | null | undefined): boolean {
  return false;
}

export const PARTNER_REGISTRY_LIST = PARTNER_REGISTRY;
export const ALL_PARTNERS = PARTNER_REGISTRY;
