import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";
import { attachTicketProof } from "@/src/services/ticketAttachment";
import { writeJson } from "@/src/state/persist";

const LAST_BOOKED_KEY = "yna_last_booked_v2";

export type BookingProofRequest = {
  itemId: string;
  tripId: string;
  title: string;
  hasProof: boolean;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

async function ensureSavedItemsLoaded() {
  if (savedItemsStore.getState().loaded) return;

  try {
    await savedItemsStore.load();
  } catch {
    // best-effort only
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
    // best-effort only
  }
}

export async function requestBookingProofFlow(
  itemId: string
): Promise<BookingProofRequest | null> {
  const id = cleanString(itemId);
  if (!id) return null;

  await ensureSavedItemsLoaded();

  const item = savedItemsStore.getById(id) ?? null;
  if (!item || item.status !== "booked") return null;

  await persistLastBooked(item);

  return {
    itemId: item.id,
    tripId: cleanString(item.tripId),
    title: cleanString(item.title) || "Booking",
    hasProof: getAttachmentCount(item) > 0,
  };
}

export async function addBookingProof(itemId: string): Promise<boolean> {
  const id = cleanString(itemId);
  if (!id) return false;

  await ensureSavedItemsLoaded();

  const item = savedItemsStore.getById(id) ?? null;
  if (!item || item.status !== "booked") return false;

  return await attachTicketProof(id);
}
