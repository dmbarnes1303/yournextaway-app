// src/services/partnerLinks.ts
// Central place to build outbound partner URLs.
// Tickets are Sportsevents365 and use SE365 enrichment where available.

import { buildAffiliateUrl } from "@/src/services/se365";

export type PartnerKey = "tickets" | "flights" | "hotels" | "transfers" | "things";

export type PartnerLinkContext = {
  // Tickets:
  se365EventUrl?: string | null;

  // General:
  cityName?: string;
  countryName?: string;
  startDateIso?: string;
  endDateIso?: string;

  // Flights:
  originIata?: string;
  destinationIata?: string;

  // Hotels / things:
  lat?: number;
  lng?: number;
};

export function getPartnerLink(partner: PartnerKey, ctx: PartnerLinkContext): string | null {
  if (partner === "tickets") {
    if (!ctx.se365EventUrl) return null;
    return buildAffiliateUrl(ctx.se365EventUrl);
  }

  // Other partners are already wired elsewhere in your app.
  // This file acts as a light glue layer and should not duplicate existing integrations.
  // Return null here to allow existing buttons/services to handle their own URL building.
  return null;
}
