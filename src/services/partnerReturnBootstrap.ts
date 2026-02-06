// src/services/partnerReturnBootstrap.ts
import { Alert } from "react-native";

import {
  ensurePartnerReturnWatcher,
  markBooked,
  markNotBooked,
  clearLastClick,
  type LastPartnerClick,
} from "@/src/services/partnerClicks";

import savedItemsStore from "@/src/state/savedItems";
import { getPartner } from "@/src/core/partners";

/**
 * Call once at app boot (e.g. app/_layout.tsx).
 *
 * Phase 1 behaviour:
 * - When returning from partner, ask if booking completed
 * - If booked → transition to booked
 * - If not yet → remain pending
 * - If dismissed → do nothing but clear lastClick
 *
 * This file is the SINGLE authority for:
 * - when user is prompted
 * - when lastClick is cleared
 */
export function bootstrapPartnerReturnPrompt() {
  ensurePartnerReturnWatcher(async (click: LastPartnerClick) => {
    try {
      // Ensure store ready (cold start safe)
      if (!savedItemsStore.getState().loaded) {
        await savedItemsStore.load();
      }

      const item = savedItemsStore
        .getState()
        .items.find((x) => x.id === click.itemId);

      if (!item) {
        clearLastClick(click.itemId);
        return;
      }

      let partnerName = "the partner";
      try {
        const p = getPartner(click.partnerId);
        if (p?.name) partnerName = p.name;
      } catch {
        // ignore
      }

      Alert.alert(
        "Did you complete your booking?",
        `We opened ${partnerName}. Mark this as booked?`,
        [
          {
            text: "Not yet",
            style: "cancel",
            onPress: async () => {
              try {
                await markNotBooked(click.itemId);
              } finally {
                clearLastClick(click.itemId);
              }
            },
          },
          {
            text: "Booked",
            onPress: async () => {
              try {
                await markBooked(click.itemId);
              } finally {
                clearLastClick(click.itemId);
              }
            },
          },
        ],
        {
          cancelable: true,
          onDismiss: () => {
            clearLastClick(click.itemId);
          },
        }
      );
    } catch {
      // never crash on return
      try {
        clearLastClick(click.itemId);
      } catch {
        // ignore
      }
    }
  });
}
