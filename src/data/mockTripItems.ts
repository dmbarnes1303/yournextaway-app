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
      priceText: "Compare flight options",
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
      type: "insurance",
      title: "Travel insurance",
      status: "saved",
      partnerId: "safetywing",
      priceText: "Check cover",
      currency: "GBP",
      metadata: { city: cityName, startDate, endDate },
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
    {
      type: "note",
      title: "Local transport reminder",
      status: "saved",
      metadata: {
        text:
          `Transport is not connected to a live booking partner in this build.\n` +
          `Track airport, hotel and stadium movement manually here.`,
      },
    },
  ];

  return { tripId, items };
}
