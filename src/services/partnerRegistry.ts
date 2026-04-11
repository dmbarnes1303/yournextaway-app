// src/services/partnerRegistry.ts

import type { PartnerLink, Provider, ISODate } from "@/src/core/tripTypes";
import { buildAffiliateLinks } from "@/src/services/affiliateLinks";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export type PartnerContext = {
  city: string;
  startDate?: ISODate;
  endDate?: ISODate;
  originIata?: string | null;
  passengers?: number | null;
  cabinClass?: "economy" | "premium" | "business" | "first" | null;
};

function asProvider(value: string): Provider {
  return value as Provider;
}

export function makePartnerLink(input: {
  provider: Provider;
  title: string;
  url: string;
  campaign?: string;
  openMode?: PartnerLink["openMode"];
}): PartnerLink {
  return {
    id: `${input.provider}-${input.title}-${Date.now()}`,
    provider: input.provider,
    title: input.title,
    url: input.url,
    openMode: input.openMode ?? "in_app_browser",
    campaign: input.campaign,
    createdAt: Date.now(),
  };
}

export function getPartnerLinksForTrip(ctx: PartnerContext): PartnerLink[] {
  const city = clean(ctx.city);
  if (!city) return [];

  const links = buildAffiliateLinks({
    city,
    startDate: ctx.startDate ?? null,
    endDate: ctx.endDate ?? null,
    originIata: ctx.originIata ?? null,
    passengers: ctx.passengers ?? null,
    cabinClass: ctx.cabinClass ?? null,
  });

  const output: PartnerLink[] = [];

  if (links.hotelsUrl) {
    output.push(
      makePartnerLink({
        provider: asProvider("expedia"),
        title: "Hotel search",
        url: links.hotelsUrl,
        campaign: "tier1_trip_hotels_expedia",
      })
    );
  }

  if (links.flightsUrl) {
    output.push(
      makePartnerLink({
        provider: asProvider("aviasales"),
        title: "Flight search",
        url: links.flightsUrl,
        campaign: "tier1_trip_flights_aviasales",
      })
    );
  }

  if (links.ticketsPrimaryUrl) {
    output.push(
      makePartnerLink({
        provider: asProvider("sportsevents365"),
        title: "Best ticket option",
        url: links.ticketsPrimaryUrl,
        campaign: "tier1_trip_tickets_se365",
      })
    );
  }

  if (links.ticketsSecondaryUrl) {
    output.push(
      makePartnerLink({
        provider: asProvider("footballticketnet"),
        title: "Compare more ticket options",
        url: links.ticketsSecondaryUrl,
        campaign: "tier2_trip_tickets_ftn",
      })
    );
  }

  if (links.insuranceUrl) {
    output.push(
      makePartnerLink({
        provider: asProvider("safetywing"),
        title: "Travel insurance",
        url: links.insuranceUrl,
        campaign: "tier1_trip_insurance_safetywing",
      })
    );
  }

  return output;
}
