// src/services/bookingProof.ts
import { Alert, Platform } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";
import { pickAndStoreAttachmentForItem } from "@/src/services/walletAttachments";

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
 * - Always confirms it was added to Wallet
 * - If no attachments exist, offers proof upload (PDF/screenshot) for offline access
 *
 * Android reliability rules:
 * - keep <= 2 actions (+ implicit cancelable) to avoid flaky nested alert behavior
 */
export async function confirmBookedAndOfferProof(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  await ensureSavedItemsLoaded();
  const item = savedItemsStore.getState().items.find((x) => x.id === id) ?? null;

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

  const buttons =
    Platform.OS === "android"
      ? [
          { text: "Not now", style: "cancel" as const },
          { text: "Add booking proof", onPress: () => defer(() => promptAddProof(id)) },
        ]
      : [
          { text: "Not now", style: "cancel" as const },
          { text: "Add booking proof", onPress: () => defer(() => promptAddProof(id)) },
        ];

  Alert.alert("Added to Wallet", message, buttons as any, { cancelable: true });
}
