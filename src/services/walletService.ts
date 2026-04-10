import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";

export type WalletItemType =
  | "ticket"
  | "flight"
  | "hotel"
  | "transfer"
  | "experience"
  | "other";

export type WalletItemStatus = "saved" | "pending" | "booked";

export type WalletItem = {
  id: string;
  tripId?: string;
  title: string;
  type: WalletItemType;
  status: WalletItemStatus;
  partner?: string;
  url?: string;
  attachments?: number;
  createdAt?: number;
};

function mapType(type: string): WalletItemType {
  switch (type) {
    case "ticket":
    case "tickets":
      return "ticket";
    case "flight":
    case "flights":
      return "flight";
    case "hotel":
    case "stays":
      return "hotel";
    case "transfer":
    case "transfers":
      return "transfer";
    case "things":
    case "experiences":
      return "experience";
    default:
      return "other";
  }
}

function mapStatus(status: SavedItem["status"]): WalletItemStatus | null {
  if (status === "saved") return "saved";
  if (status === "pending") return "pending";
  if (status === "booked") return "booked";
  return null;
}

function toWalletItem(item: SavedItem): WalletItem | null {
  const status = mapStatus(item.status);
  if (!status) return null;

  return {
    id: item.id,
    tripId: item.tripId,
    title: item.title,
    type: mapType(item.type),
    status,
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
    .map(toWalletItem)
    .filter(Boolean)
    .sort((a, b) => (b!.createdAt ?? 0) - (a!.createdAt ?? 0)) as WalletItem[];
}

async function getBooked(): Promise<WalletItem[]> {
  const all = await getAll();
  return all.filter((i) => i.status === "booked");
}

async function getPending(): Promise<WalletItem[]> {
  const all = await getAll();
  return all.filter((i) => i.status === "pending");
}

async function getSaved(): Promise<WalletItem[]> {
  const all = await getAll();
  return all.filter((i) => i.status === "saved");
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
  getSaved,
  getForTrip,
  getBookedWithoutProof,
};
