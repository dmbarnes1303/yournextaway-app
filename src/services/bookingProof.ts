// src/services/bookingProof.ts
import { Alert } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";
import { pickAndStoreAttachmentForItem } from "@/src/services/walletAttachments";
import { writeJson } from "@/src/state/persist";

const LAST_BOOKED_KEY = "yna_last_booked_v1";

/**
 * Small delay avoids nested Alert timing quirks (esp Android)
 */
function defer(fn: () => void) {
  setTimeout(fn, 60);
}

async function ensureSavedItemsLoaded() {
  if (savedItemsStore.getState().loaded) return;
  try {
    await savedItemsStore.load();
  } catch {
    // ignore
  }
}

function getAttachments(item: SavedItem | null) {
  return Array.isArray(item?.attachments) ? item!.attachments! : [];
}

async function persistLastBookedPointer(item: SavedItem | null) {
  const itemId = String(item?.id ?? "").trim();
  const tripId = String(item?.tripId ?? "").trim();
  if (!itemId || !tripId) return;

  try {
    await writeJson(LAST_BOOKED_KEY, { itemId, tripId, at: Date.now() });
  } catch {
    // best-effort
  }
}

async function promptAddProof(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  try {
    const att = await pickAndStoreAttachmentForItem(id);

    await ensureSavedItemsLoaded();
    await savedItemsStore.addAttachment(id, att);

    Alert.alert("Saved", "Booking proof stored in Wallet for offline access.", [{ text: "OK" }], {
      cancelable: true,
    });
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg === "cancelled") return;

    Alert.alert("Couldn’t add attachment", msg || "Try again.", [{ text: "OK" }], {
      cancelable: true,
    });
  }
}

/**
 * Call after an item is marked "booked".
 * - Sets "last booked" pointer (for Wallet highlight + back-to-trip)
 * - Confirms it was added to Wallet
 * - If no attachments exist, offers proof upload (PDF/screenshot) for offline access
 */
export async function confirmBookedAndOfferProof(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  await ensureSavedItemsLoaded();
  const item = savedItemsStore.getState().items.find((x) => x.id === id) ?? null;

  // Persist pointer only if item exists (prevents junk pointers)
  if (item) {
    await persistLastBookedPointer(item);
  }

  const title = String(item?.title ?? "").trim() || "Booking";
  const atts = getAttachments(item);

  // If proof already exists, don't ask again.
  if (atts.length > 0) {
    Alert.alert("Added to Wallet", `"${title}" is booked and saved in your Wallet.`, [{ text: "OK" }], {
      cancelable: true,
    });
    return;
  }

  const message =
    `"${title}" is now marked as booked.\n\n` +
    `Want to add booking proof (PDF/screenshot) for offline access?`;

  Alert.alert(
    "Added to Wallet",
    message,
    [
      { text: "Not now", style: "cancel" as const },
      { text: "Add booking proof", onPress: () => defer(() => promptAddProof(id)) },
    ] as any,
    { cancelable: true }
  );
}
