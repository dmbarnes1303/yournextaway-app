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
        title: "Hotels",
        url: links.hotelsUrl,
        campaign: "trip_hotels",
      })
    );
  }

  if (links.flightsUrl) {
    output.push(
      makePartnerLink({
        provider: asProvider("aviasales"),
        title: "Flights",
        url: links.flightsUrl,
        campaign: "trip_flights",
      })
    );
  }

  if (links.ticketsPrimaryUrl) {
    output.push(
      makePartnerLink({
        provider: asProvider("sportsevents365"),
        title: "Tickets",
        url: links.ticketsPrimaryUrl,
        campaign: "trip_tickets_primary",
      })
    );
  }

  if (links.ticketsSecondaryUrl) {
    output.push(
      makePartnerLink({
        provider: asProvider("footballticketsnet"),
        title: "More ticket options",
        url: links.ticketsSecondaryUrl,
        campaign: "trip_tickets_secondary",
      })
    );
  }

  if (links.insuranceUrl) {
    output.push(
      makePartnerLink({
        provider: asProvider("safetywing"),
        title: "Insurance",
        url: links.insuranceUrl,
        campaign: "trip_insurance",
      })
    );
  }

  return output;
}
