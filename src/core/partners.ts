// src/core/partners.ts
import type { SavedItemType } from "@/src/core/savedItemTypes";

/**
 * Partner registry = single source of truth for:
 * - partner IDs
 * - labels
 * - default SavedItem.type
 *
 * Screens should NOT hardcode partner strings.
 * They call beginPartnerClick({ partnerId, url, ... }).
 */

export type PartnerId = "booking" | "skyscanner" | "omio" | "getyourguide" | "googlemaps" | "unknown";

export type PartnerCategory = "stay" | "travel" | "things" | "links";

export type Partner = {
  id: PartnerId;
  name: string;
  category: PartnerCategory;

  /** Default SavedItem type when user clicks this partner. */
  defaultSavedItemType: SavedItemType;

  /** Optional: domains used for best-effort validation/inference later. */
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

/**
 * Optional helper (Phase 2+): infer partner from a URL.
 * Harmless to ship now; useful when you ingest arbitrary links later.
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
