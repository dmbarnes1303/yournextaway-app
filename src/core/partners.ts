// src/core/partners.ts
/**
 * Partner registry = single source of truth for:
 * - partner IDs
 * - labels
 * - which SavedItem.type to create for clicks
 *
 * IMPORTANT:
 * - Do not scatter partner names/logic across screens.
 * - Screens call partnerClicks.beginPartnerClick() with partnerId + url.
 */

import type { SavedItemType } from "@/src/core/savedItemTypes";

export type PartnerId =
  | "booking"
  | "skyscanner"
  | "omio"
  | "getyourguide"
  | "googlemaps"
  | "unknown";

export type PartnerCategory = "stay" | "travel" | "things" | "links";

export type Partner = {
  id: PartnerId;
  name: string;
  category: PartnerCategory;

  /**
   * Default SavedItem type when user clicks this partner.
   * (Screens can override if needed.)
   */
  defaultSavedItemType: SavedItemType;

  /**
   * Optional: domains used for “best effort” return detection or URL sanity checks later.
   */
  domains?: string[];
};

export const PARTNERS: Record<PartnerId, Partner> = {
  booking: {
    id: "booking",
    name: "Booking.com",
    category: "stay",
    defaultSavedItemType: "hotel",
    domains: ["booking.com"],
  },
  skyscanner: {
    id: "skyscanner",
    name: "Skyscanner",
    category: "travel",
    defaultSavedItemType: "flight",
    domains: ["skyscanner.net", "skyscanner.com"],
  },
  omio: {
    id: "omio",
    name: "Omio",
    category: "travel",
    defaultSavedItemType: "train",
    domains: ["omio.com"],
  },
  getyourguide: {
    id: "getyourguide",
    name: "GetYourGuide",
    category: "things",
    defaultSavedItemType: "things",
    domains: ["getyourguide.com"],
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
