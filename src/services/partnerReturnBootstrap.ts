// src/services/partnerReturnBootstrap.ts
import { Alert } from "react-native";
import { ensurePartnerReturnWatcher, markBooked, markNotBooked } from "@/src/services/partnerClicks";
import savedItemsStore from "@/src/state/savedItems";
import { getPartner } from "@/src/core/partners";

/**
 * Call once at app boot (e.g. app/_layout.tsx useEffect).
 * This is a minimal Phase-1 fallback prompt.
 *
 * You can replace this Alert UI later with your Trip Workspace confirmation screen.
 */
export function bootstrapPartnerReturnPrompt() {
  ensurePartnerReturnWatcher(async (click) => {
    const item = savedItemsStore.getState().items.find((x) => x.id === click.itemId);
    if (!item) return;

    const partner = getPartner(click.partnerId);

    Alert.alert(
      "Did you complete your booking?",
      `We opened ${partner.name}. Mark this as booked?`,
      [
        { text: "Not yet", style: "cancel", onPress: () => markNotBooked(click.itemId) },
        { text: "Booked", onPress: () => markBooked(click.itemId) },
      ]
    );
  });
}
