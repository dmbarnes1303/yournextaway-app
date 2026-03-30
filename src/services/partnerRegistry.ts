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
        provider: "expedia",
        title: "Hotels",
        url: links.hotelsUrl,
        campaign: "trip_hotels",
      })
    );
  }

  if (links.flightsUrl) {
    output.push(
      makePartnerLink({
        provider: "aviasales",
        title: "Flights",
        url: links.flightsUrl,
        campaign: "trip_flights",
      })
    );
  }

  if (links.transfersUrl) {
    output.push(
      makePartnerLink({
        provider: "kiwitaxi",
        title: "Transfers",
        url: links.transfersUrl,
        campaign: "trip_transfers",
      })
    );
  }

  if (links.ticketsUrl) {
    output.push(
      makePartnerLink({
        provider: "sportsevents365",
        title: "Tickets",
        url: links.ticketsUrl,
        campaign: "trip_tickets",
      })
    );
  }

  if (links.experiencesUrl) {
    output.push(
      makePartnerLink({
        provider: "getyourguide",
        title: "Things to do",
        url: links.experiencesUrl,
        campaign: "trip_experiences",
      })
    );
  }

  if (links.transportUrl) {
    output.push(
      makePartnerLink({
        provider: "omio",
        title: "Train & coach",
        url: links.transportUrl,
        campaign: "trip_transport",
      })
    );
  }

  if (links.mapsUrl) {
    output.push(
      makePartnerLink({
        provider: "google",
        title: "Maps",
        url: links.mapsUrl,
        campaign: "trip_maps",
      })
    );
  }

  return output;
}
