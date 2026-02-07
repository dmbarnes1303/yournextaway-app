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
} from "@/src/services/partnerClicks";

import { pickAndStoreAttachmentForItem } from "@/src/services/walletAttachments";

/**
 * Phase-1 truth:
 * We cannot reliably detect “booking completed” from affiliates.
 * So we prompt on return: Yes → mark booked, No → keep pending.
 *
 * Enhancement:
 * After Yes → show confirmation (“Added to Wallet”) and offer to add booking proof (PDF/screenshot).
 * Android-safe: keep button counts low and avoid nested alerts firing in same tick.
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
    Alert.alert("Couldn’t add attachment", msg || "Try again.", [{ text: "OK" }], { cancelable: true });
  }
}

function showBookedConfirmationAndProofPrompt(item: SavedItem | null) {
  const itemId = String(item?.id ?? "").trim();
  if (!itemId) return;

  const title = String(item?.title ?? "").trim() || "Booking";
  const atts = getAttachments(item);

  // If they already have proof stored, just confirm the Wallet update.
  if (atts.length > 0) {
    Alert.alert(
      "Added to Wallet",
      `"${title}" is now marked as booked and saved in your Wallet.`,
      [{ text: "OK" }],
      { cancelable: true }
    );
    return;
  }

  // Otherwise: confirm + offer proof upload.
  // Keep button count low for Android reliability.
  Alert.alert(
    "Added to Wallet",
    `"${title}" is now marked as booked.\n\nWant to add booking proof (PDF/screenshot) for offline access?`,
    [
      { text: "Not now", style: "cancel" },
      {
        text: "Add booking proof",
        onPress: () => {
          // Run picker after alert closes
          defer(() => {
            promptAddProof(itemId);
          });
        },
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

    // Don’t stack prompts for the same item.
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

        // Re-read item from store after transition (so UI state is correct).
        await ensureSavedItemsLoaded();
        const updated = savedItemsStore.getState().items.find((x) => x.id === itemId) ?? null;

        // Show confirmation + offer to add proof, but not in the same tick.
        defer(() => showBookedConfirmationAndProofPrompt(updated));
      };

      // Android: max 3 buttons.
      if (Platform.OS === "android") {
        Alert.alert(
          "Did you book it?",
          message,
          [
            { text: "Not now", style: "cancel", onPress: () => markNotBooked(itemId) },
            { text: "No", onPress: () => markNotBooked(itemId) },
            { text: "Yes — booked", onPress: onYesBooked },
          ],
          { cancelable: true }
        );
        return;
      }

      // iOS: keep identical for now (same behaviour, predictable UX).
      Alert.alert(
        "Did you book it?",
        message,
        [
          { text: "Not now", style: "cancel", onPress: () => markNotBooked(itemId) },
          { text: "No", onPress: () => markNotBooked(itemId) },
          { text: "Yes — booked", onPress: onYesBooked },
        ],
        { cancelable: true }
      );
    } finally {
      // Remove after the initial prompt is shown/handled.
      // If user hits Yes and then uploads proof, that flow is separate and doesn’t need this lock.
      defer(() => inFlightForItem.delete(String(click?.itemId ?? "").trim()));
    }
  });
}
