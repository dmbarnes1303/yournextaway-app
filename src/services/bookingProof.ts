// src/services/bookingProof.ts
import { Alert } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";
import { pickAndStoreAttachmentForItem } from "@/src/services/walletAttachments";
import { writeJson } from "@/src/state/persist";

const LAST_BOOKED_KEY = "yna_last_booked_v1";

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

function getAttachments(item?: SavedItem | null) {
  return Array.isArray(item?.attachments) ? item.attachments : [];
}

async function persistLastBookedPointer(item?: SavedItem | null) {
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
    const existingBefore = savedItemsStore.getById(id);
    if (existingBefore && getAttachments(existingBefore).length > 0) {
      Alert.alert("Already added", "This booking already has proof stored in Wallet.", [{ text: "OK" }], {
        cancelable: true,
      });
      return;
    }

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
 * - stores a "last booked" pointer for Wallet highlighting
 * - confirms Wallet presence
 * - offers proof upload if no proof exists yet
 */
export async function confirmBookedAndOfferProof(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  await ensureSavedItemsLoaded();

  const item = savedItemsStore.getById(id) ?? null;
  if (!item) return;

  if (item.status !== "booked") {
    // Do not lie to the user. If the item is not booked, don't show Wallet-booked messaging.
    return;
  }

  await persistLastBookedPointer(item);

  const title = String(item.title ?? "").trim() || "Booking";
  const atts = getAttachments(item);

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
