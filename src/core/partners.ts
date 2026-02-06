// src/core/partners.ts
import type { SavedItemType } from "@/src/core/savedItemTypes";

/**
 * Partner registry = single source of truth for:
 * - partner IDs (ONLY ones you actually have / want live)
 * - labels
 * - default SavedItem.type
 *
 * Screens should NOT hardcode partner strings.
 * They call beginPartnerClick({ partnerId, url, ... }).
 */

export type PartnerId =
  | "getyourguide"
  | "safetywing"
  | "aviasales"
  | "kiwitaxi"
  | "tiqets"
  | "klook"
  | "welcomepickups"
  | "ekta"
  | "airhelp"
  | "wegotrip"
  | "searadar"
  | "compensair"
  | "sportsevents365"
  | "expedia"
  | "googlemaps"
  | "unknown";

export type PartnerCategory =
  | "stay"
  | "travel"
  | "things"
  | "insurance"
  | "claims"
  | "tickets"
  | "links";

export type Partner = {
  id: PartnerId;
  name: string;
  category: PartnerCategory;

  /** Default SavedItem type when user clicks this partner. */
  defaultSavedItemType: SavedItemType;

  /** Optional: domains used for best-effort inference/validation. */
  domains?: string[];
};

export const PARTNERS: Record<PartnerId, Partner> = {
  /* -------------------- Things / activities -------------------- */
  getyourguide: {
    id: "getyourguide",
    name: "GetYourGuide",
    category: "things",
    defaultSavedItemType: "things",
    domains: ["getyourguide.com"],
  },
  tiqets: {
    id: "tiqets",
    name: "Tiqets",
    category: "things",
    defaultSavedItemType: "things",
    domains: ["tiqets.com"],
  },
  klook: {
    id: "klook",
    name: "Klook",
    category: "things",
    defaultSavedItemType: "things",
    domains: ["klook.com"],
  },
  wegotrip: {
    id: "wegotrip",
    name: "WeGoTrip",
    category: "things",
    defaultSavedItemType: "things",
    domains: ["wegotrip.com"],
  },
  searadar: {
    id: "searadar",
    name: "SeaRadar",
    category: "things",
    defaultSavedItemType: "things",
    domains: ["searadar.com"],
  },

  /* -------------------- Stay -------------------- */
  expedia: {
    id: "expedia",
    name: "Expedia",
    category: "stay",
    defaultSavedItemType: "hotel",
    domains: ["expedia.com", "expedia.co.uk", "expedia.ie"],
  },

  /* -------------------- Travel -------------------- */
  aviasales: {
    id: "aviasales",
    name: "AVIASALES",
    category: "travel",
    defaultSavedItemType: "flight",
    domains: ["aviasales.com", "aviasales.ru", "aviasales.net"],
  },
  kiwitaxi: {
    id: "kiwitaxi",
    name: "KiwiTaxi",
    category: "travel",
    defaultSavedItemType: "transfer",
    domains: ["kiwitaxi.com"],
  },
  welcomepickups: {
    id: "welcomepickups",
    name: "Welcome Pickups",
    category: "travel",
    defaultSavedItemType: "transfer",
    domains: ["welcomepickups.com"],
  },

  /* -------------------- Insurance -------------------- */
  safetywing: {
    id: "safetywing",
    name: "SafetyWing",
    category: "insurance",
    defaultSavedItemType: "insurance",
    domains: ["safetywing.com"],
  },

  /* -------------------- Claims / compensation -------------------- */
  airhelp: {
    id: "airhelp",
    name: "AirHelp",
    category: "claims",
    defaultSavedItemType: "claim",
    domains: ["airhelp.com"],
  },
  compensair: {
    id: "compensair",
    name: "Compensair",
    category: "claims",
    defaultSavedItemType: "claim",
    domains: ["compensair.com"],
  },

  /* -------------------- Tickets / events -------------------- */
  sportsevents365: {
    id: "sportsevents365",
    name: "SportsEvents365",
    category: "tickets",
    defaultSavedItemType: "tickets",
    domains: ["sportsevents365.com"],
  },

  /* -------------------- Other / link tools -------------------- */
  ekta: {
    id: "ekta",
    name: "Ekta",
    category: "links",
    defaultSavedItemType: "other",
  },
  googlemaps: {
    id: "googlemaps",
    name: "Google Maps",
    category: "links",
    defaultSavedItemType: "other",
    domains: ["google.com", "maps.google.com"],
  },
  unknown: {
    id: "unknown",
    name: "Partner",
    category: "links",
    defaultSavedItemType: "other",
  },
};

export function getPartner(id: string | null | undefined): Partner {
  const key = String(id ?? "").trim().toLowerCase() as PartnerId;
  return PARTNERS[key] ?? PARTNERS.unknown;
}

/**
 * Optional helper: infer partner from a URL.
 * Useful when you ingest arbitrary links.
 */
export function inferPartnerIdFromUrl(url: string): PartnerId {
  const u = String(url ?? "").trim().toLowerCase();
  if (!u) return "unknown";

  const host = u.replace(/^https?:\/\//, "").split("/")[0] ?? "";
  const h = host.replace(/^www\./, "");

  for (const [pid, p] of Object.entries(PARTNERS) as Array<[PartnerId, Partner]>) {
    if (!p.domains?.length) continue;
    if (p.domains.some((d) => h === d || h.endsWith(`.${d}`))) return pid;
  }

  return "unknown";
}
