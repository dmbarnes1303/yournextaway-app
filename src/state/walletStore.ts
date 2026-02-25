import savedItemsStore from "@/src/state/savedItems";

export type WalletTicket = {
  id: string;
  tripId: string;
  title: string;
  status: "pending" | "booked";
  provider?: string | null;
  url?: string | null;
  fixtureId?: number | null;
  home?: string | null;
  away?: string | null;
  kickoffIso?: string | null;
  createdAt?: number;
};

function mapSavedItemToTicket(item: any): WalletTicket {
  return {
    id: String(item.id),
    tripId: String(item.tripId),
    title: item.title ?? "Tickets",
    status: item.status ?? "pending",
    provider: item.partnerId ?? null,
    url: item.partnerUrl ?? null,
    fixtureId: item.metadata?.fixtureId ?? null,
    home: item.metadata?.home ?? null,
    away: item.metadata?.away ?? null,
    kickoffIso: item.metadata?.kickoffIso ?? null,
    createdAt: item.createdAt ?? Date.now(),
  };
}

async function getAllTickets(): Promise<WalletTicket[]> {
  const all = await savedItemsStore.getAll();
  return all
    .filter((i: any) => i.type === "tickets")
    .map(mapSavedItemToTicket)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

async function getPendingTickets(): Promise<WalletTicket[]> {
  const all = await getAllTickets();
  return all.filter((t) => t.status === "pending");
}

async function getBookedTickets(): Promise<WalletTicket[]> {
  const all = await getAllTickets();
  return all.filter((t) => t.status === "booked");
}

async function getTicketsForTrip(tripId: string): Promise<WalletTicket[]> {
  const all = await getAllTickets();
  return all.filter((t) => t.tripId === String(tripId));
}

export default {
  getAllTickets,
  getPendingTickets,
  getBookedTickets,
  getTicketsForTrip,
};
