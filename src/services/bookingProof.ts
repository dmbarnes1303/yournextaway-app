// src/services/bookingProof.ts
import { Alert, Platform } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";
import { pickAndStoreAttachmentForItem } from "@/src/services/walletAttachments";

function defer(fn: () => void) {
  // avoid nested Alert timing quirks (esp Android)
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
  try {
    const att = await pickAndStoreAttachmentForItem(itemId);
    await ensureSavedItemsLoaded();
    await savedItemsStore.addAttachment(itemId, att);

    Alert.alert("Saved", "Booking proof stored in Wallet for offline access.", [{ text: "OK" }], {
      cancelable: true,
    });
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg === "cancelled") return;
    Alert.alert("Couldn’t add attachment", msg || "Try again.", [{ text: "OK" }], { cancelable: true });
  }
}

/**
 * After an item is marked booked, call this to:
 * - show confirmation
 * - offer proof upload if no attachments exist
 */
export async function confirmBookedAndOfferProof(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  await ensureSavedItemsLoaded();
  const item = savedItemsStore.getState().items.find((x) => x.id === id) ?? null;

  const title = String(item?.title ?? "").trim() || "Booking";
  const atts = getAttachments(item);

  if (atts.length > 0) {
    Alert.alert(
      "Added to Wallet",
      `"${title}" is now marked as booked and saved in your Wallet.`,
      [{ text: "OK" }],
      { cancelable: true }
    );
    return;
  }

  // keep button count low for Android reliability
  const buttons =
    Platform.OS === "android"
      ? [
          { text: "Not now", style: "cancel" as const },
          {
            text: "Add booking proof",
            onPress: () => defer(() => promptAddProof(id)),
          },
        ]
      : [
          { text: "Not now", style: "cancel" as const },
          {
            text: "Add booking proof",
            onPress: () => defer(() => promptAddProof(id)),
          },
        ];

  Alert.alert(
    "Added to Wallet",
    `"${title}" is now marked as booked.\n\nWant to add booking proof (PDF/screenshot) for offline access?`,
    buttons as any,
    { cancelable: true }
  );
}
