import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";
import { writeJson } from "@/src/state/persist";

const LAST_BOOKED_KEY = "yna_last_booked_v2";

export type BookingProofRequestMode = "offer" | "success" | "info";

export type BookingProofRequest = {
  itemId: string;
  tripId: string;
  title: string;
  mode: BookingProofRequestMode;
};

let pendingProofRequest: BookingProofRequest | null = null;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

async function ensureSavedItemsLoaded() {
  if (savedItemsStore.getState().loaded) return;

  try {
    await savedItemsStore.load();
  } catch {
    // Best effort only.
  }
}

function getAttachmentCount(item?: SavedItem | null): number {
  return Array.isArray(item?.attachments) ? item.attachments.length : 0;
}

async function persistLastBooked(item?: SavedItem | null) {
  const itemId = cleanString(item?.id);
  const tripId = cleanString(item?.tripId);

  if (!itemId || !tripId) return;

  try {
    await writeJson(LAST_BOOKED_KEY, {
      itemId,
      tripId,
      at: Date.now(),
    });
  } catch {
    // Best effort only.
  }
}

/**
 * Called after user marks an item as booked.
 *
 * Truth model:
 * - booked = user-confirmed
 * - proof = optional wallet evidence
 * - no native Alert UI belongs in this service
 */
export async function requestBookingProofFlow(itemId: string): Promise<BookingProofRequest | null> {
  const id = cleanString(itemId);
  if (!id) return null;

  await ensureSavedItemsLoaded();

  const item = savedItemsStore.getById(id) ?? null;
  if (!item || item.status !== "booked") return null;

  await persistLastBooked(item);

  const title = cleanString(item.title) || "Booking";
  const tripId = cleanString(item.tripId);
  const attachmentCount = getAttachmentCount(item);

  if (!tripId) return null;

  pendingProofRequest = {
    itemId: id,
    tripId,
    title,
    mode: attachmentCount > 0 ? "info" : "offer",
  };

  return pendingProofRequest;
}

export function consumeBookingProofRequest(): BookingProofRequest | null {
  const request = pendingProofRequest;
  pendingProofRequest = null;
  return request;
}

export function peekBookingProofRequest(): BookingProofRequest | null {
  return pendingProofRequest;
}

export function completeBookingProofFlow() {
  pendingProofRequest = null;
}

/**
 * Backwards-compatible name for older callers.
 * Do not show UI here.
 */
export async function confirmBookedAndOfferProof(itemId: string): Promise<BookingProofRequest | null> {
  return requestBookingProofFlow(itemId);
}
