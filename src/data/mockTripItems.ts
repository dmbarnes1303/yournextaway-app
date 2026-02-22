// src/data/mockTripItems.ts
import type { SavedItemStatus, SavedItemType } from "@/src/core/savedItemTypes";

export type SavedItemSeed = {
  type: SavedItemType;
  title: string;
  status?: SavedItemStatus;
  partnerId?: string;
  partnerUrl?: string;
  priceText?: string;
  currency?: string;
  metadata?: Record<string, any>;
};

export function buildMockSavedItemsForSeed(args: {
  tripId: string;
  cityName: string;
  startDate: string;
  endDate: string;
  matchTitle?: string;
}) {
  const { tripId, cityName, startDate, endDate, matchTitle } = args;

  const items: SavedItemSeed[] = [
    {
      type: "tickets",
      title: matchTitle ? `Tickets shortlist — ${matchTitle}` : "Tickets shortlist",
      status: "saved",
      partnerId: "sportsevents365",
      priceText: "View live availability",
      currency: "EUR",
      metadata: { city: cityName },
    },
    {
      type: "flight",
      title: `Flights to ${cityName}`,
      status: "saved",
      partnerId: "aviasales",
      priceText: "Compare options",
      currency: "GBP",
      metadata: { city: cityName },
    },
    {
      type: "hotel",
      title: `Hotels in ${cityName}`,
      status: "pending",
      partnerId: "expedia",
      priceText: `${startDate} → ${endDate}`,
      currency: "GBP",
      metadata: { city: cityName, startDate, endDate },
    },
    {
      type: "transfer",
      title: `Airport transfer — ${cityName}`,
      status: "saved",
      partnerId: "welcomepickups",
      priceText: "Check prices",
      currency: "EUR",
      metadata: { city: cityName },
    },
    {
      type: "things",
      title: `Experiences in ${cityName}`,
      status: "saved",
      partnerId: "getyourguide",
      priceText: "Browse top picks",
      currency: "EUR",
      metadata: { city: cityName },
    },
    {
      type: "insurance",
      title: "Travel insurance",
      status: "saved",
      partnerId: "safetywing",
      priceText: "Get cover",
      currency: "GBP",
      metadata: { city: cityName, startDate, endDate },
    },
    {
      type: "claim",
      title: "Flight compensation check",
      status: "saved",
      partnerId: "airhelp",
      priceText: "Check eligibility",
      currency: "GBP",
      metadata: { city: cityName },
    },
    {
      type: "note",
      title: "Plan",
      status: "saved",
      metadata: {
        text:
          `Trip plan:\n` +
          `• Arrive: ${startDate}\n` +
          `• Leave: ${endDate}\n` +
          `• Save 2–3 hotel options\n` +
          `• Confirm kickoff time before booking anything non-refundable`,
      },
    },
  ];

  return { tripId, items };
}
