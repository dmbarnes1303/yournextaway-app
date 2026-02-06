// src/core/partners.ts

import type { PartnerID } from "./id";
import { asPartnerId } from "./id";

export type PartnerCategory =
  | "tickets"
  | "stay"
  | "flights"
  | "trains"
  | "transfers"
  | "things"
  | "insurance";

export type Partner = {
  id: PartnerID;
  name: string;
  categories: PartnerCategory[];
  deepLinkCapable: boolean;

  /**
   * Optional tracking/templating metadata.
   * UI must NOT build URLs itself; it can request URLs from a link builder layer.
   */
  websiteDomain?: string;
};

export const PARTNERS: Record<string, Partner> = {
  booking: {
    id: asPartnerId("booking" as any),
    name: "Booking.com",
    categories: ["stay"],
    deepLinkCapable: true,
    websiteDomain: "booking.com",
  },

  skyscanner: {
    id: asPartnerId("skyscanner" as any),
    name: "Skyscanner",
    categories: ["flights"],
    deepLinkCapable: true,
    websiteDomain: "skyscanner.net",
  },

  omio: {
    id: asPartnerId("omio" as any),
    name: "Omio",
    categories: ["trains"],
    deepLinkCapable: true,
    websiteDomain: "omio.com",
  },

  getyourguide: {
    id: asPartnerId("getyourguide" as any),
    name: "GetYourGuide",
    categories: ["things"],
    deepLinkCapable: true,
    websiteDomain: "getyourguide.com",
  },

  googlemaps: {
    id: asPartnerId("googlemaps" as any),
    name: "Google Maps",
    categories: ["things", "transfers", "stay", "trains", "flights"],
    deepLinkCapable: true,
    websiteDomain: "google.com",
  },
} as const;

export function getPartner(id: PartnerID): Partner | null {
  const found = Object.values(PARTNERS).find((p) => p.id === id);
  return found ?? null;
}
