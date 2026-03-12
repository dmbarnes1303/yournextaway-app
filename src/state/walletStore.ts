// src/state/walletStore.ts
import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem, SavedItemStatus, SavedItemType } from "@/src/core/savedItemTypes";

export type WalletBooking = {
  id: string;
  tripId?: string;
  type: SavedItemType;
  title: string;
  status: SavedItemStatus;
  provider?: string | null;
  url?: string | null;
  fixtureId?: number | null;
  home?: string | null;
  away?: string | null;
  kickoffIso?: string | null;
  attachmentCount: number;
  hasProof: boolean;
  createdAt: number;
  updatedAt: number;
};

export type WalletTicket = WalletBooking & {
  type: "tickets";
  status: "pending" | "booked";
};

export type WalletTripGroup = {
  tripId: string;
  items: WalletBooking[];
  bookedCount: number;
  pendingCount: number;
  savedCount: number;
  proofCount: number;
  updatedAt: number;
};

export type WalletSummary = {
  total: number;
  booked: number;
  pending: number;
  saved: number;
  archived: number;
  withProof: number;
  withoutProof: number;
};

function cleanString(v: unknown) {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function toNumberOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getAttachments(item: SavedItem) {
  return Array.isArray(item.attachments) ? item.attachments : [];
}

function mapSavedItemToWalletBooking(item: SavedItem): WalletBooking {
  const attachments = getAttachments(item);

  return {
    id: String(item.id),
    tripId: cleanString(item.tripId) || undefined,
    type: item.type,
    title: item.title ?? "Untitled",
    status: item.status,
    provider: item.partnerId ?? null,
    url: item.partnerUrl ?? null,
    fixtureId: toNumberOrNull(item.metadata?.fixtureId),
    home: item.metadata?.home ?? null,
    away: item.metadata?.away ?? null,
    kickoffIso: item.metadata?.kickoffIso ?? null,
    attachmentCount: attachments.length,
    hasProof: attachments.length > 0,
    createdAt: Number(item.createdAt ?? Date.now()),
    updatedAt: Number(item.updatedAt ?? item.createdAt ?? Date.now()),
  };
}

function byUpdatedDesc<T extends { updatedAt?: number; createdAt?: number }>(a: T, b: T) {
  const aTime = Number(a.updatedAt ?? a.createdAt ?? 0) || 0;
  const bTime = Number(b.updatedAt ?? b.createdAt ?? 0) || 0;
  return bTime - aTime;
}

async function ensureLoaded() {
  if (savedItemsStore.getState().loaded) return;
  await savedItemsStore.load();
}

async function getAllWalletItems(): Promise<WalletBooking[]> {
  await ensureLoaded();

  return savedItemsStore
    .getAll()
    .map(mapSavedItemToWalletBooking)
    .sort(byUpdatedDesc);
}

async function getVisibleWalletItems(): Promise<WalletBooking[]> {
  const all = await getAllWalletItems();
  return all.filter((item) => item.status !== "archived");
}

async function getBookedItems(): Promise<WalletBooking[]> {
  const all = await getAllWalletItems();
  return all.filter((item) => item.status === "booked");
}

async function getPendingItems(): Promise<WalletBooking[]> {
  const all = await getAllWalletItems();
  return all.filter((item) => item.status === "pending");
}

async function getSavedItems(): Promise<WalletBooking[]> {
  const all = await getAllWalletItems();
  return all.filter((item) => item.status === "saved");
}

async function getItemsForTrip(tripId: string): Promise<WalletBooking[]> {
  const t = cleanString(tripId);
  if (!t) return [];

  const all = await getAllWalletItems();
  return all.filter((item) => item.tripId === t);
}

async function getVisibleItemsForTrip(tripId: string): Promise<WalletBooking[]> {
  const items = await getItemsForTrip(tripId);
  return items.filter((item) => item.status !== "archived");
}

async function getGroupedByTrip(): Promise<WalletTripGroup[]> {
  const all = await getVisibleWalletItems();

  const groups = new Map<string, WalletBooking[]>();

  for (const item of all) {
    const tripId = cleanString(item.tripId);
    if (!tripId) continue;

    const existing = groups.get(tripId) ?? [];
    existing.push(item);
    groups.set(tripId, existing);
  }

  return Array.from(groups.entries())
    .map(([tripId, items]) => {
      const sorted = [...items].sort(byUpdatedDesc);

      return {
        tripId,
        items: sorted,
        bookedCount: sorted.filter((x) => x.status === "booked").length,
        pendingCount: sorted.filter((x) => x.status === "pending").length,
        savedCount: sorted.filter((x) => x.status === "saved").length,
        proofCount: sorted.filter((x) => x.hasProof).length,
        updatedAt: Number(sorted[0]?.updatedAt ?? sorted[0]?.createdAt ?? 0),
      } as WalletTripGroup;
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

async function getWalletSummary(): Promise<WalletSummary> {
  const all = await getAllWalletItems();

  const booked = all.filter((x) => x.status === "booked").length;
  const pending = all.filter((x) => x.status === "pending").length;
  const saved = all.filter((x) => x.status === "saved").length;
  const archived = all.filter((x) => x.status === "archived").length;
  const withProof = all.filter((x) => x.hasProof).length;
  const withoutProof = all.length - withProof;

  return {
    total: all.length,
    booked,
    pending,
    saved,
    archived,
    withProof,
    withoutProof,
  };
}

/* -------------------------------------------------------------------------- */
/* Backward-compatible ticket selectors                                        */
/* -------------------------------------------------------------------------- */

function asWalletTicket(item: WalletBooking): WalletTicket | null {
  if (item.type !== "tickets") return null;
  if (item.status !== "pending" && item.status !== "booked") return null;

  return {
    ...item,
    type: "tickets",
    status: item.status,
  };
}

async function getAllTickets(): Promise<WalletTicket[]> {
  const all = await getAllWalletItems();
  return all.map(asWalletTicket).filter(Boolean) as WalletTicket[];
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
  const items = await getItemsForTrip(tripId);
  return items.map(asWalletTicket).filter(Boolean) as WalletTicket[];
}

export default {
  getAllWalletItems,
  getVisibleWalletItems,
  getBookedItems,
  getPendingItems,
  getSavedItems,
  getItemsForTrip,
  getVisibleItemsForTrip,
  getGroupedByTrip,
  getWalletSummary,

  getAllTickets,
  getPendingTickets,
  getBookedTickets,
  getTicketsForTrip,
};
