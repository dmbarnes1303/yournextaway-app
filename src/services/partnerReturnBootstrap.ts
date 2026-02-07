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

import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";

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
 * After Yes -> show confirmation + offer booking proof upload (if none exists).
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
  return item.status === "pending";
}

function defer(fn: () => void) {
  setTimeout(fn, 60);
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

        // Confirm + offer proof upload (not in same tick)
        defer(() => {
          confirmBookedAndOfferProof(itemId).catch(() => null);
        });
      };

      const onNo = async () => {
        // Option B: move pending -> saved
        try {
          await markNotBooked(itemId);
        } catch {
          // ignore
        }
      };

      const onNotNow = async () => {
        // keep pending; stop re-prompt loops
        dismissReturnPrompt(itemId);
      };

      // Android: max 3 buttons
      const buttons =
        Platform.OS === "android"
          ? [
              { text: "Not now", style: "cancel" as const, onPress: () => onNotNow() },
              { text: "No", onPress: () => onNo() },
              { text: "Yes — booked", onPress: () => onYesBooked() },
            ]
          : [
              { text: "Not now", style: "cancel" as const, onPress: () => onNotNow() },
              { text: "No", onPress: () => onNo() },
              { text: "Yes — booked", onPress: () => onYesBooked() },
            ];

      Alert.alert("Did you book it?", message, buttons as any, { cancelable: true });
    } finally {
      defer(() => inFlightForItem.delete(String(click?.itemId ?? "").trim()));
    }
  });
}
