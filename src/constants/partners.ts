// src/constants/partners.ts
// Canonical commercial partner registry.
//
// This file is the single source of truth for:
// - canonical commercial / utility / internal categories
// - canonical partner IDs
// - partner display metadata
// - partner capability flags
// - supported categories per partner
// - alias handling
// - live/configured status
// - fallback policy metadata
//
// IMPORTANT:
// - Keep this file data-first.
// - Do not move full outbound URL-building logic into this file.
// - URL generation belongs in the dedicated affiliate/commercial link layer.
// - Downstream consumers may still use AffiliateConfig during migration.

export type CommercialCategory =
  | "tickets"
  | "flights"
  | "stays"
  | "trains"
  | "buses"
  | "transfers"
  | "insurance"
  | "things"
  | "car_hire";

export type UtilityCategory = "maps" | "official_site";

export type InternalCategory = "claim" | "note" | "other";

export type PartnerCategory = CommercialCategory | UtilityCategory | InternalCategory;

export type PartnerCapabilityFlags = {
  affiliate: boolean;
  api: boolean;
  utility: boolean;
};

export type PartnerFallbackPolicy =
  | "none"
  | "generic_home"
  | "generic_search"
  | "official_site_only"
  | "manual_review";

export type PartnerId =
  | "aviasales"
  | "expedia"
  | "omio"
  | "kiwitaxi"
  | "welcomepickups"
  | "sportsevents365"
  | "footballticketsnet"
  | "gigsberg"
  | "seatpick"
  | "getyourguide"
  | "klook"
  | "tiqets"
  | "wegotrip"
  | "ekta"
  | "safetywing"
  | "airhelp"
  | "compensair"
  | "googlemaps"
  | "official_club_site";

export type PartnerDisplay = {
  name: string;
  shortName: string;
  badgeText: string;
};

export type PartnerConfigKey =
  | "aviasalesMarker"
  | "expediaTracked"
  | "expediaToken"
  | "kiwitaxiTracked"
  | "welcomepickupsTracked"
  | "omioTracked"
  | "sportsevents365Tracked"
  | "getyourguidePartnerId"
  | "klookTracked"
  | "tiqetsTracked"
  | "wegotripTracked"
  | "ektaTracked"
  | "airhelpTracked"
  | "compensairTracked";

export type PartnerDefinition = {
  id: PartnerId;
  display: PartnerDisplay;

  /**
   * Canonical categories this partner can serve.
   * One partner may support multiple categories.
   * Example: Omio can currently serve trains + buses.
   */
  categories: readonly PartnerCategory[];

  /**
   * Kept as a convenience for old consumers that expect a single primary category.
   * For new commercial logic, prefer `categories`.
   */
  primaryCategory: PartnerCategory;

  capabilities: PartnerCapabilityFlags;

  /**
   * Config keys required for the partner to be considered configured/live.
   * Empty = always available utility/internal partner.
   * All keys here are treated as OR unless `requireAllConfigKeys` is true.
   */
  configKeys?: readonly PartnerConfigKey[];
  requireAllConfigKeys?: boolean;

  /**
   * Canonical base URLs only.
   * These are metadata, not the final outbound URL contract.
   */
  baseUrl?: string;
  trackedUrlKey?: PartnerConfigKey;

  /**
   * Generic fallback metadata for the downstream link-generation layer.
   * This file does not build the final URL.
   */
  fallbackPolicy: PartnerFallbackPolicy;
  fallbackBaseUrl?: string | null;

  /**
   * Provider aliases or legacy IDs that should normalize to this canonical partner.
   */
  aliases?: readonly string[];

  /**
   * Lightweight notes for migration/debugging only.
   */
  notes?: string;
};

/* -------------------------------------------------------------------------- */
/* Raw config                                                                  */
/* -------------------------------------------------------------------------- */

export const AffiliateConfig = {
  // Flights
  aviasalesMarker: "700937",

  // Stays
  expediaTracked: "",
  expediaToken: "HQeXTbR",

  // Transfers / transport
  kiwitaxiTracked: "https://kiwitaxi.tpm.lv/oFUnzcw9",
  welcomepickupsTracked: "",
  omioTracked: "https://omio.sjv.io/KBjDon",

  // Tickets
  sportsevents365Tracked: "https://www.sportsevents365.com/?a_aid=69834e80ec9d3",

  // Things
  getyourguidePartnerId: "MAQJIREP",
  klookTracked: "",
  tiqetsTracked: "",
  wegotripTracked: "https://wegotrip.tpm.lv/2TmC2jxD",

  // Insurance / claims
  ektaTracked: "",
  airhelpTracked: "https://airhelp.tpm.lv/G53R3pcD",
  compensairTracked: "https://compensair.tpm.lv/crv6X5hT",
} as const;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function isTruthyConfigValue(value: unknown): boolean {
  return Boolean(clean(value));
}

function hasConfigKey(key: PartnerConfigKey): boolean {
  return isTruthyConfigValue(AffiliateConfig[key]);
}

function hasAnyConfig(keys: readonly PartnerConfigKey[] | undefined): boolean {
  if (!keys || keys.length === 0) return true;
  return keys.some((key) => hasConfigKey(key));
}

function hasAllConfig(keys: readonly PartnerConfigKey[] | undefined): boolean {
  if (!keys || keys.length === 0) return true;
  return keys.every((key) => hasConfigKey(key));
}

/* -------------------------------------------------------------------------- */
/* Canonical registry                                                          */
/* -------------------------------------------------------------------------- */

export const PARTNERS = [
  {
    id: "aviasales",
    display: { name: "Aviasales", shortName: "Aviasales", badgeText: "AV" },
    categories: ["flights"],
    primaryCategory: "flights",
    capabilities: { affiliate: true, api: true, utility: false },
    configKeys: ["aviasalesMarker"],
    baseUrl: "https://www.aviasales.com/",
    fallbackPolicy: "generic_search",
    fallbackBaseUrl: "https://www.aviasales.com/",
    aliases: [],
  },

  {
    id: "expedia",
    display: { name: "Expedia", shortName: "Expedia", badgeText: "EX" },
    categories: ["stays"],
    primaryCategory: "stays",
    capabilities: { affiliate: true, api: false, utility: false },
    configKeys: ["expediaTracked", "expediaToken"],
    baseUrl: "https://www.expedia.co.uk/",
    trackedUrlKey: "expediaTracked",
    fallbackPolicy: "generic_search",
    fallbackBaseUrl: "https://www.expedia.co.uk/Hotel-Search",
    aliases: ["expedia_stays"],
    notes: "Token fallback remains allowed during migration.",
  },

  {
    id: "omio",
    display: { name: "Omio", shortName: "Omio", badgeText: "OM" },
    categories: ["trains", "buses"],
    primaryCategory: "trains",
    capabilities: { affiliate: true, api: false, utility: false },
    configKeys: ["omioTracked"],
    baseUrl: "https://www.omio.com/",
    trackedUrlKey: "omioTracked",
    fallbackPolicy: "generic_home",
    fallbackBaseUrl: "https://www.omio.com/",
    aliases: [],
    notes: "Current canonical partner for both train and bus journeys.",
  },

  {
    id: "kiwitaxi",
    display: { name: "KiwiTaxi", shortName: "KiwiTaxi", badgeText: "KT" },
    categories: ["transfers"],
    primaryCategory: "transfers",
    capabilities: { affiliate: true, api: false, utility: false },
    configKeys: ["kiwitaxiTracked"],
    baseUrl: "https://kiwitaxi.com/",
    trackedUrlKey: "kiwitaxiTracked",
    fallbackPolicy: "none",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "welcomepickups",
    display: { name: "Welcome Pickups", shortName: "Welcome", badgeText: "WP" },
    categories: ["transfers"],
    primaryCategory: "transfers",
    capabilities: { affiliate: true, api: false, utility: false },
    configKeys: ["welcomepickupsTracked"],
    baseUrl: "https://www.welcomepickups.com/",
    trackedUrlKey: "welcomepickupsTracked",
    fallbackPolicy: "none",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "sportsevents365",
    display: { name: "SportsEvents365", shortName: "SE365", badgeText: "365" },
    categories: ["tickets"],
    primaryCategory: "tickets",
    capabilities: { affiliate: true, api: true, utility: false },
    configKeys: ["sportsevents365Tracked"],
    baseUrl: "https://www.sportsevents365.com/",
    trackedUrlKey: "sportsevents365Tracked",
    fallbackPolicy: "none",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "footballticketsnet",
    display: { name: "FootballTicketNet", shortName: "FTN", badgeText: "FTN" },
    categories: ["tickets"],
    primaryCategory: "tickets",
    capabilities: { affiliate: true, api: true, utility: false },
    baseUrl: "https://www.footballticketnet.com/",
    fallbackPolicy: "manual_review",
    fallbackBaseUrl: null,
    aliases: [],
    notes: "Known provider identity retained for ticket normalization even if not yet configured here.",
  },

  {
    id: "gigsberg",
    display: { name: "Gigsberg", shortName: "Gigsberg", badgeText: "G" },
    categories: ["tickets"],
    primaryCategory: "tickets",
    capabilities: { affiliate: true, api: true, utility: false },
    baseUrl: "https://www.gigsberg.com/",
    fallbackPolicy: "manual_review",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "seatpick",
    display: { name: "SeatPick", shortName: "SeatPick", badgeText: "SP" },
    categories: ["tickets"],
    primaryCategory: "tickets",
    capabilities: { affiliate: true, api: false, utility: false },
    baseUrl: "https://seatpick.com/",
    fallbackPolicy: "manual_review",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "getyourguide",
    display: { name: "GetYourGuide", shortName: "GYG", badgeText: "GYG" },
    categories: ["things"],
    primaryCategory: "things",
    capabilities: { affiliate: true, api: false, utility: false },
    configKeys: ["getyourguidePartnerId"],
    baseUrl: "https://www.getyourguide.com/",
    fallbackPolicy: "none",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "klook",
    display: { name: "Klook", shortName: "Klook", badgeText: "KL" },
    categories: ["things"],
    primaryCategory: "things",
    capabilities: { affiliate: true, api: false, utility: false },
    configKeys: ["klookTracked"],
    baseUrl: "https://www.klook.com/",
    trackedUrlKey: "klookTracked",
    fallbackPolicy: "none",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "tiqets",
    display: { name: "Tiqets", shortName: "Tiqets", badgeText: "TQ" },
    categories: ["things"],
    primaryCategory: "things",
    capabilities: { affiliate: true, api: false, utility: false },
    configKeys: ["tiqetsTracked"],
    baseUrl: "https://www.tiqets.com/",
    trackedUrlKey: "tiqetsTracked",
    fallbackPolicy: "none",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "wegotrip",
    display: { name: "WeGoTrip", shortName: "WeGoTrip", badgeText: "WGT" },
    categories: ["things"],
    primaryCategory: "things",
    capabilities: { affiliate: true, api: false, utility: false },
    configKeys: ["wegotripTracked"],
    baseUrl: "https://wegotrip.com/",
    trackedUrlKey: "wegotripTracked",
    fallbackPolicy: "none",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "ekta",
    display: { name: "EKTA", shortName: "EKTA", badgeText: "EK" },
    categories: ["insurance"],
    primaryCategory: "insurance",
    capabilities: { affiliate: true, api: false, utility: false },
    configKeys: ["ektaTracked"],
    baseUrl: "https://ektatraveling.com/",
    trackedUrlKey: "ektaTracked",
    fallbackPolicy: "none",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "safetywing",
    display: { name: "SafetyWing", shortName: "SafetyWing", badgeText: "SW" },
    categories: ["insurance"],
    primaryCategory: "insurance",
    capabilities: { affiliate: true, api: false, utility: false },
    baseUrl: "https://safetywing.com/",
    fallbackPolicy: "manual_review",
    fallbackBaseUrl: null,
    aliases: [],
    notes: "Kept as canonical legacy provider identity during migration, even though EKTA is the configured tracked insurance source today.",
  },

  {
    id: "airhelp",
    display: { name: "AirHelp", shortName: "AirHelp", badgeText: "AH" },
    categories: ["claim"],
    primaryCategory: "claim",
    capabilities: { affiliate: true, api: false, utility: false },
    configKeys: ["airhelpTracked"],
    baseUrl: "https://www.airhelp.com/",
    trackedUrlKey: "airhelpTracked",
    fallbackPolicy: "none",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "compensair",
    display: { name: "Compensair", shortName: "Compensair", badgeText: "CP" },
    categories: ["claim"],
    primaryCategory: "claim",
    capabilities: { affiliate: true, api: false, utility: false },
    configKeys: ["compensairTracked"],
    baseUrl: "https://www.compensair.com/",
    trackedUrlKey: "compensairTracked",
    fallbackPolicy: "none",
    fallbackBaseUrl: null,
    aliases: [],
  },

  {
    id: "googlemaps",
    display: { name: "Google Maps", shortName: "Maps", badgeText: "MAP" },
    categories: ["maps"],
    primaryCategory: "maps",
    capabilities: { affiliate: false, api: false, utility: true },
    baseUrl: "https://www.google.com/maps",
    fallbackPolicy: "none",
    fallbackBaseUrl: null,
    aliases: ["google"],
  },

  {
    id: "official_club_site",
    display: { name: "Official Club Site", shortName: "Official", badgeText: "OFF" },
    categories: ["official_site"],
    primaryCategory: "official_site",
    capabilities: { affiliate: false, api: false, utility: true },
    fallbackPolicy: "official_site_only",
    fallbackBaseUrl: null,
    aliases: ["official", "club_official_site"],
  },
] as const satisfies readonly PartnerDefinition[];

/* -------------------------------------------------------------------------- */
/* Derived maps                                                                */
/* -------------------------------------------------------------------------- */

type PartnerMap = Record<PartnerId, PartnerDefinition>;

export const PARTNER_MAP: PartnerMap = Object.fromEntries(
  PARTNERS.map((partner) => [partner.id, partner])
) as PartnerMap;

const PARTNER_ALIAS_MAP: Record<string, PartnerId> = (() => {
  const entries: Array<[string, PartnerId]> = [];

  for (const partner of PARTNERS) {
    entries.push([partner.id, partner.id]);

    for (const alias of partner.aliases ?? []) {
      const key = clean(alias).toLowerCase();
      if (key) entries.push([key, partner.id]);
    }
  }

  return Object.fromEntries(entries);
})();

const PARTNERS_BY_CATEGORY: Record<PartnerCategory, PartnerDefinition[]> = (() => {
  const seed: Record<PartnerCategory, PartnerDefinition[]> = {
    tickets: [],
    flights: [],
    stays: [],
    trains: [],
    buses: [],
    transfers: [],
    insurance: [],
    things: [],
    car_hire: [],
    maps: [],
    official_site: [],
    claim: [],
    note: [],
    other: [],
  };

  for (const partner of PARTNERS) {
    for (const category of partner.categories) {
      seed[category].push(partner);
    }
  }

  return seed;
})();

/* -------------------------------------------------------------------------- */
/* Public helpers                                                              */
/* -------------------------------------------------------------------------- */

export function canonicalizePartnerId(id: string | null | undefined): PartnerId | null {
  const raw = clean(id).toLowerCase();
  if (!raw) return null;
  return PARTNER_ALIAS_MAP[raw] ?? null;
}

export function isPartnerId(id: string | null | undefined): id is PartnerId {
  return canonicalizePartnerId(id) != null;
}

export function getPartner(id: PartnerId | string): PartnerDefinition {
  const canonical = canonicalizePartnerId(id);
  if (!canonical) {
    throw new Error(`Unknown partner id: ${clean(id)}`);
  }
  return PARTNER_MAP[canonical];
}

export function getPartnerOrNull(id: string | null | undefined): PartnerDefinition | null {
  const canonical = canonicalizePartnerId(id);
  return canonical ? PARTNER_MAP[canonical] : null;
}

export function getCanonicalPartnerId(id: PartnerId | string): PartnerId {
  return getPartner(id).id;
}

export function getPartnersByCategory(category: PartnerCategory): PartnerDefinition[] {
  return [...(PARTNERS_BY_CATEGORY[category] ?? [])];
}

export function supportsCategory(
  partnerId: PartnerId | string,
  category: PartnerCategory
): boolean {
  const partner = getPartner(partnerId);
  return partner.categories.includes(category);
}

export function isPartnerConfigured(partnerId: PartnerId | string): boolean {
  const partner = getPartner(partnerId);

  if (!partner.configKeys || partner.configKeys.length === 0) {
    return true;
  }

  return partner.requireAllConfigKeys
    ? hasAllConfig(partner.configKeys)
    : hasAnyConfig(partner.configKeys);
}

export function isPartnerLive(partnerId: PartnerId | string): boolean {
  return isPartnerConfigured(partnerId);
}

export function getLivePartners(): PartnerDefinition[] {
  return PARTNERS.filter((partner) => isPartnerLive(partner.id));
}

export function getLivePartnersByCategory(category: PartnerCategory): PartnerDefinition[] {
  return getPartnersByCategory(category).filter((partner) => isPartnerLive(partner.id));
}

export function getTrackedConfigValue(partnerId: PartnerId | string): string | null {
  const partner = getPartner(partnerId);
  const key = partner.trackedUrlKey;
  if (!key) return null;

  const value = clean(AffiliateConfig[key]);
  return value || null;
}

export function getPartnerBaseUrl(partnerId: PartnerId | string): string | null {
  const partner = getPartner(partnerId);
  return clean(partner.baseUrl) || null;
}

export function getPartnerFallbackBaseUrl(partnerId: PartnerId | string): string | null {
  const partner = getPartner(partnerId);
  return clean(partner.fallbackBaseUrl) || null;
}

export function isUtilityPartner(partnerId: PartnerId | string): boolean {
  return Boolean(getPartner(partnerId).capabilities.utility);
}

export function isCommercialCategory(category: PartnerCategory): category is CommercialCategory {
  return (
    category === "tickets" ||
    category === "flights" ||
    category === "stays" ||
    category === "trains" ||
    category === "buses" ||
    category === "transfers" ||
    category === "insurance" ||
    category === "things" ||
    category === "car_hire"
  );
}

export function isUtilityCategory(category: PartnerCategory): category is UtilityCategory {
  return category === "maps" || category === "official_site";
}

export function isInternalCategory(category: PartnerCategory): category is InternalCategory {
  return category === "claim" || category === "note" || category === "other";
}
