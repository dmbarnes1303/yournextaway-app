import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";

export type WalletItemType =
  | "ticket"
  | "flight"
  | "hotel"
  | "transfer"
  | "experience"
  | "other";

export type WalletItem = {
  id: string;
  tripId?: string;
  title: string;

  type: WalletItemType;
  status: "pending" | "booked";

  partner?: string;
  url?: string;

  attachments?: number;

  createdAt?: number;
};

function mapType(type: string): WalletItemType {
  switch (type) {
    case "tickets":
      return "ticket";

    case "flights":
      return "flight";

    case "stays":
      return "hotel";

    case "transfers":
      return "transfer";

    case "experiences":
      return "experience";

    default:
      return "other";
  }
}

function toWalletItem(item: SavedItem): WalletItem {
  return {
    id: item.id,
    tripId: item.tripId,
    title: item.title,

    type: mapType(item.type),
    status: item.status === "booked" ? "booked" : "pending",

    partner: item.partnerId,
    url: item.partnerUrl,

    attachments: item.attachments?.length ?? 0,

    createdAt: item.createdAt,
  };
}

async function ensureLoaded() {
  if (!savedItemsStore.getState().loaded) {
    await savedItemsStore.load();
  }
}

async function getAll(): Promise<WalletItem[]> {
  await ensureLoaded();

  const items = savedItemsStore.getAll();

  return items
    .filter((i) => i.status === "pending" || i.status === "booked")
    .map(toWalletItem)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

async function getBooked(): Promise<WalletItem[]> {
  const all = await getAll();
  return all.filter((i) => i.status === "booked");
}

async function getPending(): Promise<WalletItem[]> {
  const all = await getAll();
  return all.filter((i) => i.status === "pending");
}

async function getForTrip(tripId: string): Promise<WalletItem[]> {
  const all = await getAll();
  return all.filter((i) => i.tripId === tripId);
}

async function getBookedWithoutProof(): Promise<WalletItem[]> {
  const all = await getAll();
  return all.filter((i) => i.status === "booked" && (i.attachments ?? 0) === 0);
}

export default {
  getAll,
  getBooked,
  getPending,
  getForTrip,
  getBookedWithoutProof,
};
