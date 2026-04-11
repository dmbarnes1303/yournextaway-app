import savedItemsStore from "@/src/state/savedItems";
import {
  getSavedItemStatusLabel,
  type SavedItem,
  type SavedItemStatus,
  type SavedItemType,
  type SavedItemBookingVerificationStatus,
} from "@/src/core/savedItemTypes";

export type WalletItem = {
  id: string;
  tripId?: string;
  type: SavedItemType;
  title: string;
  status: SavedItemStatus;
  statusLabel: string;
  providerId?: string | null;
  providerTier?: "tier1" | "tier2" | null;
  providerCategory?: string | null;
  partnerClickId?: string | null;
  url?: string | null;
  fixtureId?: number | null;
  home?: string | null;
  away?: string | null;
  kickoffIso?: string | null;
  attachmentCount: number;
  hasProof: boolean;
  bookingConfidence: "none" | "user_confirmed" | "proof_attached";
  bookingVerificationStatus: SavedItemBookingVerificationStatus;
  createdAt: number;
  updatedAt: number;
  bookedAt?: number | null;
};

export type WalletTicket = WalletItem & {
  type: "tickets";
  status: "pending" | "booked";
};

export type WalletTripGroup = {
  tripId: string;
  items: WalletItem[];
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

function cleanString(v: unknown): string {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function toNumberOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getAttachments(item: SavedItem) {
  return Array.isArray(item.attachments) ? item.attachments : [];
}

function getHomeName(item: SavedItem): string | null {
  const modern = cleanString(item.metadata?.homeName);
  if (modern) return modern;

  const legacy = cleanString(item.metadata?.home);
  return legacy || null;
}

function getAwayName(item: SavedItem): string | null {
  const modern = cleanString(item.metadata?.awayName);
  if (modern) return modern;

  const legacy = cleanString(item.metadata?.away);
  return legacy || null;
}

function deriveBookingVerificationStatus(item: SavedItem): SavedItemBookingVerificationStatus {
  const attachments = getAttachments(item);

  if (item.status !== "booked") return "none";
  if (attachments.length > 0) return "proof_attached";
  return "unverified";
}

function deriveBookingConfidence(
  verificationStatus: SavedItemBookingVerificationStatus
): WalletItem["bookingConfidence"] {
  if (verificationStatus === "proof_attached") return "proof_attached";
  if (verificationStatus === "unverified") return "user_confirmed";
  return "none";
}

function mapSavedItemToWalletItem(item: SavedItem): WalletItem {
  const attachments = getAttachments(item);
  const bookingVerificationStatus = deriveBookingVerificationStatus(item);

  return {
    id: String(item.id),
    tripId: cleanString(item.tripId) || undefined,
    type: item.type,
    title: item.title ?? "Untitled",
    status: item.status,
    statusLabel: getSavedItemStatusLabel(item.status),
    providerId: item.partnerId ?? null,
    providerTier: item.partnerTier ?? null,
    providerCategory: item.partnerCategory ?? null,
    partnerClickId: item.partnerClickId ?? null,
    url: item.partnerUrl ?? null,
    fixtureId: toNumberOrNull(item.metadata?.fixtureId),
    home: getHomeName(item),
    away: getAwayName(item),
    kickoffIso: cleanString(item.metadata?.kickoffIso) || null,
    attachmentCount: attachments.length,
    hasProof: attachments.length > 0,
    bookingConfidence: deriveBookingConfidence(bookingVerificationStatus),
    bookingVerificationStatus,
    createdAt: Number(item.createdAt ?? Date.now()),
    updatedAt: Number(item.updatedAt ?? item.createdAt ?? Date.now()),
    bookedAt: Number.isFinite(Number(item.bookedAt)) ? Number(item.bookedAt) : null,
  };
}

function byUpdatedDesc<T extends { updatedAt?: number; createdAt?: number }>(a: T, b: T) {
  const aTime = Number(a.updatedAt ?? a.createdAt ?? 0) || 0;
  const bTime = Number(b.updatedAt ?? b.createdAt ?? 0) || 0;
  return bTime - aTime;
}

function isBooked(item: WalletItem): boolean {
  return item.status === "booked";
}

function isPending(item: WalletItem): boolean {
  return item.status === "pending";
}

function isSaved(item: WalletItem): boolean {
  return item.status === "saved";
}

function isArchived(item: WalletItem): boolean {
  return item.status === "archived";
}

function isBookedWithoutProof(item: WalletItem): boolean {
  return isBooked(item) && !item.hasProof;
}

async function ensureLoaded() {
  if (savedItemsStore.getState().loaded) return;
  await savedItemsStore.load();
}

async function getAllWalletItems(): Promise<WalletItem[]> {
  await ensureLoaded();
  return savedItemsStore.getAll().map(mapSavedItemToWalletItem).sort(byUpdatedDesc);
}

async function getVisibleWalletItems(): Promise<WalletItem[]> {
  const all = await getAllWalletItems();
  return all.filter((item) => !isArchived(item));
}

async function getBookedItems(): Promise<WalletItem[]> {
  const all = await getAllWalletItems();
  return all.filter(isBooked);
}

async function getPendingItems(): Promise<WalletItem[]> {
  const all = await getAllWalletItems();
  return all.filter(isPending);
}

async function getSavedItems(): Promise<WalletItem[]> {
  const all = await getAllWalletItems();
  return all.filter(isSaved);
}

async function getItemsForTrip(tripId: string): Promise<WalletItem[]> {
  const key = cleanString(tripId);
  if (!key) return [];

  const all = await getAllWalletItems();
  return all.filter((item) => item.tripId === key);
}

async function getVisibleItemsForTrip(tripId: string): Promise<WalletItem[]> {
  const items = await getItemsForTrip(tripId);
  return items.filter((item) => !isArchived(item));
}

async function getGroupedByTrip(): Promise<WalletTripGroup[]> {
  const all = await getVisibleWalletItems();
  const groups = new Map<string, WalletItem[]>();

  for (const item of all) {
    const tripId = cleanString(item.tripId);
    if (!tripId) continue;
    groups.set(tripId, [...(groups.get(tripId) ?? []), item]);
  }

  return Array.from(groups.entries())
    .map(([tripId, items]) => {
      const sorted = [...items].sort(byUpdatedDesc);

      return {
        tripId,
        items: sorted,
        bookedCount: sorted.filter(isBooked).length,
        pendingCount: sorted.filter(isPending).length,
        savedCount: sorted.filter(isSaved).length,
        proofCount: sorted.filter((x) => x.hasProof).length,
        updatedAt: Number(sorted[0]?.updatedAt ?? sorted[0]?.createdAt ?? 0),
      };
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

async function getWalletSummary(): Promise<WalletSummary> {
  const all = await getAllWalletItems();

  const bookedItems = all.filter(isBooked);
  const withProof = bookedItems.filter((x) => x.hasProof).length;
  const withoutProof = bookedItems.filter(isBookedWithoutProof).length;

  return {
    total: all.length,
    booked: bookedItems.length,
    pending: all.filter(isPending).length,
    saved: all.filter(isSaved).length,
    archived: all.filter(isArchived).length,
    withProof,
    withoutProof,
  };
}

function asWalletTicket(item: WalletItem): WalletTicket | null {
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
