// src/services/partnerReturnBootstrap.ts
import { Alert, Platform } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import { getPartner } from "@/src/core/partners";
import type { SavedItem } from "@/src/core/savedItemTypes";

import {
  ensurePartnerReturnWatcher,
  type LastPartnerClick,
  markBooked,
  markNotBooked,
  dismissReturnPrompt,
} from "@/src/services/partnerClicks";

import { pickAndStoreAttachmentForItem } from "@/src/services/walletAttachments";

/**
 * Phase-1 truth:
 * We cannot reliably detect “booking completed” from affiliates.
 *
 * Option B:
 * - Yes -> booked
 * - No  -> saved (not pending)
 * - Not now -> keep pending
 *
 * Enhancement:
 * After Yes -> show confirmation (“Added to Wallet”) and offer to add booking proof (PDF/screenshot).
 */

let bootstrapped = false;

/** Prevent duplicate prompts / double-handling */
const inFlightForItem = new Set<string>();

function safePartnerName(partnerId: string) {
  try {
    return getPartner(partnerId as any).name;
  } catch {
    return "partner";
  }
}

async function ensureSavedItemsLoaded() {
  if (savedItemsStore.getState().loaded) return;
  try {
    await savedItemsStore.load();
  } catch {
    // ignore
  }
}

async function findItem(click: LastPartnerClick): Promise<SavedItem | null> {
  await ensureSavedItemsLoaded();
  const items = savedItemsStore.getState().items;
  return items.find((x) => x.id === click.itemId) ?? null;
}

function shouldPrompt(item: SavedItem | null) {
  if (!item) return false;
  if (item.status === "booked" || item.status === "archived") return false;
  if (item.status !== "pending") return false;
  return true;
}

function getAttachments(item: SavedItem | null) {
  const atts = Array.isArray(item?.attachments) ? item!.attachments! : [];
  return atts;
}

function defer(fn: () => void) {
  // Avoid nested Alert timing quirks (esp. Android)
  setTimeout(fn, 60);
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
    Alert.alert("Couldn’t add attachment", msg || "Try again.", [{ text: "OK" }], {
      cancelable: true,
    });
  }
}

function showBookedConfirmationAndProofPrompt(item: SavedItem | null) {
  const itemId = String(item?.id ?? "").trim();
  if (!itemId) return;

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

  Alert.alert(
    "Added to Wallet",
    `"${title}" is now marked as booked.\n\nWant to add booking proof (PDF/screenshot) for offline access?`,
    [
      { text: "Not now", style: "cancel" },
      {
        text: "Add booking proof",
        onPress: () => defer(() => promptAddProof(itemId)),
      },
    ],
    { cancelable: true }
  );
}

export function bootstrapPartnerReturnPrompt() {
  if (bootstrapped) return;
  bootstrapped = true;

  ensurePartnerReturnWatcher(async (click) => {
    const itemId = String(click?.itemId ?? "").trim();
    if (!itemId) return;

    if (inFlightForItem.has(itemId)) return;
    inFlightForItem.add(itemId);

    try {
      const item = await findItem(click);
      if (!shouldPrompt(item)) return;

      const partnerName = safePartnerName(String(click.partnerId));
      const title = String(item?.title ?? "").trim() || "this booking";

      const message =
        `You just returned from ${partnerName}.\n\n` +
        `Did you book:\n"${title}"?\n\n` +
        `We can’t auto-detect checkout success, so you confirm it here.`;

      const onYesBooked = async () => {
        try {
          await markBooked(itemId);
        } catch {
          // leave pending
          return;
        }

        await ensureSavedItemsLoaded();
        const updated = savedItemsStore.getState().items.find((x) => x.id === itemId) ?? null;

        defer(() => showBookedConfirmationAndProofPrompt(updated));
      };

      const onNo = async () => {
        // Option B: move pending -> saved
        await markNotBooked(itemId);
      };

      const onNotNow = async () => {
        // keep pending; just stop re-prompt loops
        dismissReturnPrompt(itemId);
      };

      // Android: max 3 buttons
      if (Platform.OS === "android") {
        Alert.alert(
          "Did you book it?",
          message,
          [
            { text: "Not now", style: "cancel", onPress: () => onNotNow() },
            { text: "No", onPress: () => onNo() },
            { text: "Yes — booked", onPress: () => onYesBooked() },
          ],
          { cancelable: true }
        );
        return;
      }

      // iOS: keep identical for predictable UX
      Alert.alert(
        "Did you book it?",
        message,
        [
          { text: "Not now", style: "cancel", onPress: () => onNotNow() },
          { text: "No", onPress: () => onNo() },
          { text: "Yes — booked", onPress: () => onYesBooked() },
        ],
        { cancelable: true }
      );
    } finally {
      defer(() => inFlightForItem.delete(String(click?.itemId ?? "").trim()));
    }
  });
}
