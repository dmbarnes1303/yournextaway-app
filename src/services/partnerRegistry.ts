// src/services/partnerRegistry.ts
import type { PartnerLink, Provider, ISODate } from "@/src/core/tripTypes";

function enc(v: string) {
  return encodeURIComponent(String(v ?? "").trim());
}

export type PartnerContext = {
  city: string;
  startDate?: ISODate;
  endDate?: ISODate;
};

export function makePartnerLink(input: {
  provider: Provider;
  title: string;
  url: string;
  campaign?: string;
}): PartnerLink {
  return {
    id: `${input.provider}-${Date.now()}`,
    provider: input.provider,
    title: input.title,
    url: input.url,
    openMode: "in_app_browser",
    campaign: input.campaign,
    createdAt: Date.now(),
  };
}

/**
 * Phase 1: keep this dumb + reliable.
 * Phase 2: swap URLs to real affiliate templates.
 */
export function getPartnerLinksForTrip(ctx: PartnerContext): PartnerLink[] {
  const city = String(ctx.city ?? "").trim();
  if (!city) return [];

  // NOTE: Replace these with your true affiliate URLs as you wire providers.
  const hotels = `https://www.google.com/search?q=${enc(`${city} hotels`)}`;
  const flights = `https://www.google.com/search?q=${enc(`flights to ${city}`)}`;
  const trains = `https://www.google.com/search?q=${enc(`${city} train tickets`)}`;
  const experiences = `https://www.getyourguide.com/s/?q=${enc(city)}`;
  const maps = `https://www.google.com/maps/search/?api=1&query=${enc(city)}`;

  return [
    makePartnerLink({ provider: "google", title: "Hotels", url: hotels, campaign: "trip_hotels" }),
    makePartnerLink({ provider: "google", title: "Flights", url: flights, campaign: "trip_flights" }),
    makePartnerLink({ provider: "google", title: "Trains", url: trains, campaign: "trip_trains" }),
    makePartnerLink({ provider: "getyourguide", title: "GetYourGuide", url: experiences, campaign: "trip_gyg" }),
    makePartnerLink({ provider: "google", title: "Maps", url: maps, campaign: "trip_maps" }),
  ];
}
