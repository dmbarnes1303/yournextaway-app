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
 * Call once at app boot (e.g. app/_layout.tsx useEffect).
 * Minimal Phase-1 fallback prompt.
 *
 * Later: replace Alert with your Trip Workspace confirmation screen.
 */
export function bootstrapPartnerReturnPrompt() {
  ensurePartnerReturnWatcher(async (click: LastPartnerClick) => {
    try {
      if (!savedItemsStore.getState().loaded) {
        await savedItemsStore.load();
      }

      const item = savedItemsStore.getState().items.find((x) => x.id === click.itemId);
      if (!item) return;

      let partnerName = "the partner";
      try {
        const partner = getPartner(click.partnerId);
        if (partner?.name) partnerName = partner.name;
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
            onPress: () => markNotBooked(click.itemId),
          },
          {
            text: "Booked",
            onPress: () => markBooked(click.itemId),
          },
        ],
        {
          cancelable: true,
          onDismiss: () => clearLastClick(click.itemId),
        } as any
      );
    } catch {
      // never crash on return
    }
  });
}
