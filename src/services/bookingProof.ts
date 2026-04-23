import { Alert } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";
import { attachTicketProof } from "@/src/services/ticketAttachment";
import { writeJson } from "@/src/state/persist";

const LAST_BOOKED_KEY = "yna_last_booked_v2";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

async function ensureSavedItemsLoaded() {
  if (savedItemsStore.getState().loaded) return;

  try {
    await savedItemsStore.load();
  } catch {
    // silent
  }
}

function getAttachmentCount(item?: SavedItem | null): number {
  return Array.isArray(item?.attachments) ? item!.attachments.length : 0;
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

/**
 * Called immediately after user marks an item as booked.
 *
 * Truth model:
 * - "booked" = user-confirmed (not app verified)
 * - proof is optional but strengthens wallet credibility
 */
export async function confirmBookedAndOfferProof(itemId: string) {
  const id = cleanString(itemId);
  if (!id) return;

  await ensureSavedItemsLoaded();

  const item = savedItemsStore.getById(id) ?? null;
  if (!item || item.status !== "booked") return;

  await persistLastBooked(item);

  const title = cleanString(item.title) || "Booking";
  const attachmentCount = getAttachmentCount(item);

  // Already has proof → simple confirmation
  if (attachmentCount > 0) {
    Alert.alert(
      "Saved in Wallet",
      `"${title}" is marked as booked and stored in your Wallet.`
    );
    return;
  }

  // Offer proof
  Alert.alert(
    "Saved in Wallet",
    `"${title}" is marked as booked.\n\nAdd booking proof (PDF or screenshot) for offline access?`,
    [
      { text: "Not now", style: "cancel" },
      {
        text: "Add proof",
        onPress: async () => {
          const success = await attachTicketProof(id);

          if (success) {
            Alert.alert(
              "Proof added",
              "Your booking proof is now stored in Wallet."
            );
          }
        },
      },
    ],
    { cancelable: true }
  );
}
