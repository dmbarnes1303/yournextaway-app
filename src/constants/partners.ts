// src/constants/partners.ts
// Canonical Phase 2 partner registry.
//
// Single source of truth for:
// - canonical partner ids
// - canonical category vocabularies
// - display metadata
// - aliases / legacy id resolution
// - live / affiliate / api / utility / internal capability flags
// - fallback metadata
// - tracked config metadata
//
// Important:
// - Keep this data-first.
// - Do not put outbound URL construction logic here.
// - Do not recreate a legacy switch-first registry.
// - Compatibility exports remain here only because surrounding files still import them.

export const COMMERCIAL_PARTNER_CATEGORIES = [
  "tickets",
  "flights",
  "stays",
  "trains",
  "buses",
  "transfers",
  "insurance",
  "things",
  "car_hire",
] as const;

export const UTILITY_PARTNER_CATEGORIES = ["maps", "official_site"] as const;

export const INTERNAL_PARTNER_CATEGORIES = ["claim", "note", "other"] as const;

export const ALL_PARTNER_CATEGORIES = [
  ...COMMERCIAL_PARTNER_CATEGORIES,
  ...UTILITY_PARTNER_CATEGORIES,
  ...INTERNAL_PARTNER_CATEGORIES,
] as const;

export type CommercialCategory = (typeof COMMERCIAL_PARTNER_CATEGORIES)[number];
export type UtilityCategory = (typeof UTILITY_PARTNER_CATEGORIES)[number];
export type InternalCategory = (typeof INTERNAL_PARTNER_CATEGORIES)[number];
export type PartnerCategory = (typeof ALL_PARTNER_CATEGORIES)[number];

export const CANONICAL_PARTNER_IDS = [
  // Tickets
  "footballticketnet",
  "sportsevents365",
  "stubhub",
  "gigsberg",

  // Flights
  "aviasales",

  // Stays / car hire
  "expedia",

  // Rail / bus
  "omio",

  // Transfers
  "kiwitaxi",
  "welcomepickups",

  // Insurance
  "ekta",
  "safetywing",

  // Things
  "getyourguide",
  "tiqets",
  "klook",
  "wegotrip",

  // Claims compatibility
  "airhelp",
  "compensair",

  // Utility
  "google",
  "official_site",

  // Internal
  "internal_claim",
  "internal_note",
  "internal_other",
] as const;

export type PartnerId = (typeof CANONICAL_PARTNER_IDS)[number];
export type CanonicalPartnerId = PartnerId;

export type PartnerFallbackPolicyMode =
  | "none"
  | "category_fallback"
  | "generic_search"
  | "official_site_only"
  | "internal_only"
  | "partner_fallback";

export type PartnerCapabilityFlags = {
  affiliate: boolean;
  api: boolean;
  utility: boolean;
  internal: boolean;
};

export type PartnerDisplay = {
  name: string;
  badgeText: string;
};

export type PartnerFallbackPolicy = {
  mode: PartnerFallbackPolicyMode;
  reason?: string;
  partnerIds?: readonly PartnerId[];
  baseUrl?: string | null;
};

export type PartnerDefinition = {
  id: PartnerId;
  display: PartnerDisplay;
  categories: readonly PartnerCategory[];
  primaryCategory: PartnerCategory;
  live: boolean;
  capabilities: PartnerCapabilityFlags;
  aliases: readonly string[];
  baseUrl: string;
  trackedConfigKey?: keyof typeof AffiliateConfig;
  fallback: PartnerFallbackPolicy;
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
 * Tracked / affiliate config.
 *
 * Validation scripts in this repo inspect these exact keys directly.
 * Keep required keys present and non-empty.
 * Optional/deprecated integrations can remain present for migration coverage.
 *
 * Important:
 * - A non-empty config value does NOT automatically mean the partner is live.
 * - Empty values here are compatibility placeholders only.
 */
export const AffiliateConfig = {
  // Flights
  aviasalesMarker: "700937",
  aviasalesFallback: "https://www.aviasales.com/",

  // Stays
  expediaToken: "yna-expedia",
  expediaTracked: "https://www.expedia.co.uk/Hotel-Search?affcid=yna-expedia",

  // Rail / bus
  omioTracked: "https://www.omio.com/?partner_id=yna",

  // Transfers
  kiwitaxiTracked: "https://kiwitaxi.tp.st/yna",
  welcomepickupsTracked: "",

  // Tickets
  sportsevents365Tracked: "https://www.sportsevents365.com/?a_aid=yna",
  footballticketnetTracked: "",
  stubhubTracked: "https://stubhubinternational.sjv.io/xJJoL5",
  gigsbergTracked: "",

  // Things
  getyourguidePartnerId: "MAQJREP",
  tiqetsTracked: "",
  klookTracked: "",
  wegotripTracked: "",

  // Insurance
  ektaTracked: "",
  safetywingTracked: "",

  // Claims
  airhelpTracked: "",
  compensairTracked: "",

  // Utility
  googleMapsBase: "https://www.google.com/maps/search/?api=1",
} as const;

export const PARTNER_REGISTRY = [
  {
    id: "footballticketnet",
    display: { name: "FootballTicketNet", badgeText: "FTN" },
    categories: ["tickets"],
    primaryCategory: "tickets",
    live: true,
    capabilities: { affiliate: false, api: false, utility: false, internal: false },
    aliases: [
      "footballticketnet",
      "football_ticket_net",
      "football-ticket-net",
      "footballticketsnet",
      "football_tickets_net",
      "ftn",
    ],
    baseUrl: "https://www.footballticketnet.com/",
    trackedConfigKey: "footballticketnetTracked",
    fallback: {
      mode: "partner_fallback",
      reason:
        "Operational ticket marketplace fallback. Reachable in app, but not currently affiliate-wired.",
      partnerIds: ["sportsevents365", "stubhub", "gigsberg"],
      baseUrl: "https://www.footballticketnet.com/",
    },
  },
  {
    id: "sportsevents365",
    display: { name: "SportsEvents365", badgeText: "SE365" },
    categories: ["tickets"],
    primaryCategory: "tickets",
    live: true,
    capabilities: { affiliate: true, api: false, utility: false, internal: false },
    aliases: ["sportsevents365", "sports_events_365", "sports-events-365", "se365"],
    baseUrl: "https://www.sportsevents365.com/",
    trackedConfigKey: "sportsevents365Tracked",
    fallback: {
      mode: "partner_fallback",
      reason: "Fallback to other ticket providers if needed.",
      partnerIds: ["footballticketnet", "stubhub", "gigsberg"],
      baseUrl: "https://www.sportsevents365.com/",
    },
  },
  {
    id: "stubhub",
    display: { name: "StubHub International", badgeText: "SH" },
    categories: ["tickets"],
    primaryCategory: "tickets",
    live: true,
    capabilities: { affiliate: true, api: false, utility: false, internal: false },
    aliases: [
      "stubhub",
      "stubhub_international",
      "stubhub-international",
      "stubhubinternational",
      "sh",
    ],
    baseUrl: "https://www.stubhub.ie/",
    trackedConfigKey: "stubhubTracked",
    fallback: {
      mode: "partner_fallback",
      reason: "Affiliate fallback ticket marketplace when direct ticket matches are weak.",
      partnerIds: ["sportsevents365", "footballticketnet", "gigsberg"],
      baseUrl: "https://www.stubhub.ie/",
    },
  },
  {
    id: "gigsberg",
    display: { name: "Gigsberg", badgeText: "GIG" },
    categories: ["tickets"],
    primaryCategory: "tickets",
    live: true,
    capabilities: { affiliate: false, api: false, utility: false, internal: false },
    aliases: ["gigsberg"],
    baseUrl: "https://www.gigsberg.com/",
    trackedConfigKey: "gigsbergTracked",
    fallback: {
      mode: "partner_fallback",
      reason:
        "Operational ticket marketplace fallback. Reachable in app, but not currently affiliate-wired.",
      partnerIds: ["sportsevents365", "footballticketnet", "stubhub"],
      baseUrl: "https://www.gigsberg.com/",
    },
  },
  {
    id: "aviasales",
    display: { name: "Aviasales", badgeText: "AVA" },
    categories: ["flights"],
    primaryCategory: "flights",
    live: true,
    capabilities: { affiliate: true, api: true, utility: false, internal: false },
    aliases: ["aviasales", "avia_sales"],
    baseUrl: "https://www.aviasales.com/",
    fallback: {
      mode: "generic_search",
      reason: "Flight search can degrade to a generic search URL if route data is incomplete.",
      baseUrl: "https://www.aviasales.com/",
    },
  },
  {
    id: "expedia",
    display: { name: "Expedia", badgeText: "EXP" },
    categories: ["stays", "car_hire"],
    primaryCategory: "stays",
    live: true,
    capabilities: { affiliate: true, api: false, utility: false, internal: false },
    aliases: ["expedia"],
    baseUrl: "https://www.expedia.co.uk/",
    trackedConfigKey: "expediaTracked",
    fallback: {
      mode: "generic_search",
      reason: "Generic destination/date hotel search is acceptable fallback behaviour.",
      baseUrl: "https://www.expedia.co.uk/Hotel-Search",
    },
  },
  {
    id: "omio",
    display: { name: "Omio", badgeText: "OM" },
    categories: ["trains", "buses"],
    primaryCategory: "trains",
    live: true,
    capabilities: { affiliate: true, api: true, utility: false, internal: false },
    aliases: ["omio"],
    baseUrl: "https://www.omio.com/",
    trackedConfigKey: "omioTracked",
    fallback: {
      mode: "generic_search",
      reason: "Journey flow can fall back to a broad route search.",
      baseUrl: "https://www.omio.com/",
    },
  },
  {
    id: "kiwitaxi",
    display: { name: "KiwiTaxi", badgeText: "KT" },
    categories: ["transfers"],
    primaryCategory: "transfers",
    live: true,
    capabilities: { affiliate: true, api: false, utility: false, internal: false },
    aliases: ["kiwitaxi", "kiwi_taxi", "kiwi-taxi"],
    baseUrl: "https://kiwitaxi.com/",
    trackedConfigKey: "kiwitaxiTracked",
    fallback: {
      mode: "partner_fallback",
      reason: "Fallback to Welcome Pickups if KiwiTaxi is unavailable.",
      partnerIds: ["welcomepickups"],
      baseUrl: "https://kiwitaxi.com/",
    },
  },
  {
    id: "welcomepickups",
    display: { name: "Welcome Pickups", badgeText: "WP" },
    categories: ["transfers"],
    primaryCategory: "transfers",
    live: false,
    capabilities: { affiliate: false, api: false, utility: false, internal: false },
    aliases: ["welcomepickups", "welcome_pickups", "welcome-pickups"],
    baseUrl: "https://www.welcomepickups.com/",
    trackedConfigKey: "welcomepickupsTracked",
    fallback: {
      mode: "generic_search",
      reason: "Compatibility-only transfer partner. Not currently live in app.",
      baseUrl: "https://www.welcomepickups.com/",
    },
  },
  {
    id: "ekta",
    display: { name: "EKTA", badgeText: "EK" },
    categories: ["insurance"],
    primaryCategory: "insurance",
    live: false,
    capabilities: { affiliate: false, api: false, utility: false, internal: false },
    aliases: ["ekta"],
    baseUrl: "https://ektatraveling.com/",
    trackedConfigKey: "ektaTracked",
    fallback: {
      mode: "generic_search",
      reason:
        "Compatibility-only insurance placeholder. Do not treat as live until real outbound tracking is wired.",
      baseUrl: "https://ektatraveling.com/",
    },
  },
  {
    id: "safetywing",
    display: { name: "SafetyWing", badgeText: "SW" },
    categories: ["insurance"],
    primaryCategory: "insurance",
    live: false,
    capabilities: { affiliate: false, api: false, utility: false, internal: false },
    aliases: ["safetywing", "safety_wing"],
    baseUrl: "https://safetywing.com/",
    trackedConfigKey: "safetywingTracked",
    fallback: {
      mode: "partner_fallback",
      reason: "Compatibility-only legacy insurance partner.",
      partnerIds: ["ekta"],
      baseUrl: "https://safetywing.com/",
    },
  },
  {
    id: "getyourguide",
    display: { name: "GetYourGuide", badgeText: "GYG" },
    categories: ["things"],
    primaryCategory: "things",
    live: true,
    capabilities: { affiliate: true, api: true, utility: false, internal: false },
    aliases: ["getyourguide", "get_your_guide", "gyg"],
    baseUrl: "https://www.getyourguide.com/",
    fallback: {
      mode: "partner_fallback",
      reason: "Primary things-to-do partner; other providers are compatibility-only placeholders.",
      partnerIds: ["tiqets", "klook", "wegotrip"],
      baseUrl: "https://www.getyourguide.com/",
    },
  },
  {
    id: "tiqets",
    display: { name: "Tiqets", badgeText: "TQ" },
    categories: ["things"],
    primaryCategory: "things",
    live: false,
    capabilities: { affiliate: false, api: false, utility: false, internal: false },
    aliases: ["tiqets"],
    baseUrl: "https://www.tiqets.com/",
    trackedConfigKey: "tiqetsTracked",
    fallback: {
      mode: "partner_fallback",
      reason: "Compatibility-only things partner while not live.",
      partnerIds: ["getyourguide", "klook", "wegotrip"],
      baseUrl: "https://www.tiqets.com/",
    },
  },
  {
    id: "klook",
    display: { name: "Klook", badgeText: "KL" },
    categories: ["things"],
    primaryCategory: "things",
    live: false,
    capabilities: { affiliate: false, api: false, utility: false, internal: false },
    aliases: ["klook"],
    baseUrl: "https://www.klook.com/",
    trackedConfigKey: "klookTracked",
    fallback: {
      mode: "partner_fallback",
      reason: "Compatibility-only things partner while not live.",
      partnerIds: ["getyourguide", "tiqets", "wegotrip"],
      baseUrl: "https://www.klook.com/",
    },
  },
  {
    id: "wegotrip",
    display: { name: "WeGoTrip", badgeText: "WGT" },
    categories: ["things"],
    primaryCategory: "things",
    live: false,
    capabilities: { affiliate: false, api: false, utility: false, internal: false },
    aliases: ["wegotrip", "wego_trip", "wego-trip"],
    baseUrl: "https://wegotrip.com/",
    trackedConfigKey: "wegotripTracked",
    fallback: {
      mode: "partner_fallback",
      reason: "Compatibility-only things partner while not live.",
      partnerIds: ["getyourguide", "tiqets", "klook"],
      baseUrl: "https://wegotrip.com/",
    },
  },
  {
    id: "airhelp",
    display: { name: "AirHelp", badgeText: "AH" },
    categories: ["claim"],
    primaryCategory: "claim",
    live: false,
    capabilities: { affiliate: false, api: false, utility: false, internal: false },
    aliases: ["airhelp", "air_help"],
    baseUrl: "https://www.airhelp.com/",
    trackedConfigKey: "airhelpTracked",
    fallback: {
      mode: "internal_only",
      reason:
        "Compatibility-only legacy claim provider. Claims are not live external partner flows in current app architecture.",
      baseUrl: "https://www.airhelp.com/",
    },
  },
  {
    id: "compensair",
    display: { name: "Compensair", badgeText: "CA" },
    categories: ["claim"],
    primaryCategory: "claim",
    live: false,
    capabilities: { affiliate: false, api: false, utility: false, internal: false },
    aliases: ["compensair"],
    baseUrl: "https://compensair.com/",
    trackedConfigKey: "compensairTracked",
    fallback: {
      mode: "internal_only",
      reason:
        "Compatibility-only legacy claim provider. Claims are not live external partner flows in current app architecture.",
      baseUrl: "https://compensair.com/",
    },
  },
  {
    id: "google",
    display: { name: "Google Maps", badgeText: "MAP" },
    categories: ["maps"],
    primaryCategory: "maps",
    live: true,
    capabilities: { affiliate: false, api: false, utility: true, internal: false },
    aliases: ["google", "google_maps", "googlemaps", "maps", "gmaps"],
    baseUrl: "https://www.google.com/maps/",
    fallback: {
      mode: "none",
      reason: "Utility destination only.",
      baseUrl: "https://www.google.com/maps/",
    },
  },
  {
    id: "official_site",
    display: { name: "Official Site", badgeText: "OFF" },
    categories: ["official_site"],
    primaryCategory: "official_site",
    live: true,
    capabilities: { affiliate: false, api: false, utility: true, internal: false },
    aliases: ["official_site", "official", "club_site", "venue_site", "officialsite"],
    baseUrl: "",
    fallback: {
      mode: "official_site_only",
      reason: "Official destination only.",
      baseUrl: null,
    },
  },
  {
    id: "internal_claim",
    display: { name: "Internal Claim", badgeText: "CLM" },
    categories: ["claim"],
    primaryCategory: "claim",
    live: true,
    capabilities: { affiliate: false, api: false, utility: false, internal: true },
    aliases: ["internal_claim"],
    baseUrl: "",
    fallback: {
      mode: "internal_only",
      reason: "Internal workflow only.",
      baseUrl: null,
    },
  },
  {
    id: "internal_note",
    display: { name: "Internal Note", badgeText: "NOTE" },
    categories: ["note"],
    primaryCategory: "note",
    live: true,
    capabilities: { affiliate: false, api: false, utility: false, internal: true },
    aliases: ["internal_note"],
    baseUrl: "",
    fallback: {
      mode: "internal_only",
      reason: "Internal workflow only.",
      baseUrl: null,
    },
  },
  {
    id: "internal_other",
    display: { name: "Internal Other", badgeText: "OTHER" },
    categories: ["other"],
    primaryCategory: "other",
    live: true,
    capabilities: { affiliate: false, api: false, utility: false, internal: true },
    aliases: ["internal_other"],
    baseUrl: "",
    fallback: {
      mode: "internal_only",
      reason: "Internal workflow only.",
      baseUrl: null,
    },
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
const UTILITY_CATEGORY_SET = new Set<string>(UTILITY_PARTNER_CATEGORIES);
const INTERNAL_CATEGORY_SET = new Set<string>(INTERNAL_PARTNER_CATEGORIES);
const ALL_CATEGORY_SET = new Set<string>(ALL_PARTNER_CATEGORIES);
const PARTNER_ID_SET = new Set<string>(CANONICAL_PARTNER_IDS);

/* -------------------------------------------------------------------------- */
/* Category guards                                                            */
/* -------------------------------------------------------------------------- */

export function isCommercialCategory(
  value: string | null | undefined
): value is CommercialCategory {
  return COMMERCIAL_CATEGORY_SET.has(clean(value));
}

export function isUtilityCategory(
  value: string | null | undefined
): value is UtilityCategory {
  return UTILITY_CATEGORY_SET.has(clean(value));
}

export function isInternalCategory(
  value: string | null | undefined
): value is InternalCategory {
  return INTERNAL_CATEGORY_SET.has(clean(value));
}

export function isKnownPartnerCategory(
  value: string | null | undefined
): value is PartnerCategory {
  return ALL_CATEGORY_SET.has(clean(value));
}

/* -------------------------------------------------------------------------- */
/* Canonical id resolution                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Registry lookups                                                           */
/* -------------------------------------------------------------------------- */

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

export function getPartnersByCategory(category: PartnerCategory): PartnerDefinition[] {
  return PARTNER_REGISTRY.filter((partner) => partner.categories.includes(category));
}

export function getLivePartnersByCategory(category: PartnerCategory): PartnerDefinition[] {
  return PARTNER_REGISTRY.filter(
    (partner) => partner.live && partner.categories.includes(category)
  );
}

export function getCommercialPartners(): PartnerDefinition[] {
  return PARTNER_REGISTRY.filter((partner) =>
    partner.categories.some((category) => isCommercialCategory(category))
  );
}

export function getUtilityPartners(): PartnerDefinition[] {
  return PARTNER_REGISTRY.filter((partner) =>
    partner.categories.some((category) => isUtilityCategory(category))
  );
}

export function getInternalPartners(): PartnerDefinition[] {
  return PARTNER_REGISTRY.filter((partner) =>
    partner.categories.some((category) => isInternalCategory(category))
  );
}

export function listAllPartners(): PartnerDefinition[] {
  return [...PARTNER_REGISTRY];
}

/* -------------------------------------------------------------------------- */
/* Capability / support helpers                                               */
/* -------------------------------------------------------------------------- */

export function isPartnerLive(input: PartnerId | string | null | undefined): boolean {
  const partner = getPartnerOrNull(input);
  return Boolean(partner?.live);
}

export function isUtilityPartner(input: PartnerId | string | null | undefined): boolean {
  const partner = getPartnerOrNull(input);
  return Boolean(partner?.capabilities.utility);
}

export function isInternalPartner(input: PartnerId | string | null | undefined): boolean {
  const partner = getPartnerOrNull(input);
  return Boolean(partner?.capabilities.internal);
}

export function supportsCategory(
  input: PartnerId | string | null | undefined,
  category: PartnerCategory
): boolean {
  const partner = getPartnerOrNull(input);
  return Boolean(partner?.categories.includes(category));
}

/* -------------------------------------------------------------------------- */
/* Tracked config / fallback helpers                                          */
/* -------------------------------------------------------------------------- */

export function getTrackedConfigValue(
  input: PartnerId | string | null | undefined
): string | null {
  const partner = getPartnerOrNull(input);
  if (!partner?.trackedConfigKey) return null;

  const value = AffiliateConfig[partner.trackedConfigKey];
  const cleaned = clean(value);

  return cleaned || null;
}

export function getPartnerFallbackBaseUrl(
  input: PartnerId | string | null | undefined
): string | null {
  const partner = getPartnerOrNull(input);
  if (!partner) return null;

  const fallbackBase = clean(partner.fallback.baseUrl);
  if (fallbackBase) return fallbackBase;

  const ownBase = clean(partner.baseUrl);
  return ownBase || null;
}

/* -------------------------------------------------------------------------- */
/* Backwards-compatible aliases for newer names used elsewhere                */
/* -------------------------------------------------------------------------- */

export const PARTNER_REGISTRY_LIST = PARTNER_REGISTRY;
export const ALL_PARTNERS = PARTNER_REGISTRY;
