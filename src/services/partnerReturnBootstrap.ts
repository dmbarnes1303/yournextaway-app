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

/**
 * Phase-1 truth:
 * We cannot reliably detect “booking completed” from affiliates.
 * So we prompt on return: Yes → mark booked, No → keep pending.
 *
 * This must be bootstrapped at app root so it works from any screen.
 */

let bootstrapped = false;

function safePartnerName(partnerId: string) {
  try {
    return getPartner(partnerId as any).name;
  } catch {
    return "partner";
  }
}

async function findItem(click: LastPartnerClick): Promise<SavedItem | null> {
  try {
    if (!savedItemsStore.getState().loaded) {
      await savedItemsStore.load();
    }
  } catch {
    // ignore
  }

  const items = savedItemsStore.getState().items;
  const item = items.find((x) => x.id === click.itemId) ?? null;
  return item;
}

function shouldPrompt(item: SavedItem | null) {
  if (!item) return false;
  // If user already handled it elsewhere, do nothing.
  if (item.status === "booked" || item.status === "archived") return false;
  // We only prompt for pending items (created by beginPartnerClick)
  if (item.status !== "pending") return false;
  return true;
}

export function bootstrapPartnerReturnPrompt() {
  if (bootstrapped) return;
  bootstrapped = true;

  ensurePartnerReturnWatcher(async (click) => {
    const item = await findItem(click);
    if (!shouldPrompt(item)) return;

    const partnerName = safePartnerName(click.partnerId);
    const title = String(item?.title ?? "").trim() || "this booking";

    // Android Alert can be a bit “strict” with button counts.
    // Keep it to 3 buttons max on Android for reliability.
    const isAndroid = Platform.OS === "android";

    const message =
      `You just returned from ${partnerName}.\n\n` +
      `Did you book:\n"${title}"?\n\n` +
      `We can’t auto-detect checkout success, so you confirm it here.`;

    if (isAndroid) {
      Alert.alert(
        "Did you book it?",
        message,
        [
          { text: "Not now", style: "cancel", onPress: () => markNotBooked(click.itemId) },
          { text: "No", onPress: () => markNotBooked(click.itemId) },
          {
            text: "Yes — booked",
            onPress: async () => {
              try {
                await markBooked(click.itemId);
              } catch {
                // If anything fails, do not crash; leave it pending.
              }
            },
          },
        ],
        { cancelable: true }
      );
      return;
    }

    // iOS can handle a slightly richer prompt if you want later,
    // but keep it identical for now.
    Alert.alert(
      "Did you book it?",
      message,
      [
        { text: "Not now", style: "cancel", onPress: () => markNotBooked(click.itemId) },
        { text: "No", onPress: () => markNotBooked(click.itemId) },
        {
          text: "Yes — booked",
          onPress: async () => {
            try {
              await markBooked(click.itemId);
            } catch {
              // leave pending
            }
          },
        },
      ],
      { cancelable: true }
    );
  });
}
