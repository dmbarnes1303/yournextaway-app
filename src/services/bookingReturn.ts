// src/services/bookingReturn.ts
import { AppState } from "react-native";
import savedItemsStore from "@/src/state/savedItems";

type PendingOpen = {
  itemId: string;
  provider: string;
  openedAt: number;
};

let pending: PendingOpen | null = null;
let subscribed = false;

function now() {
  return Date.now();
}

/**
 * Call when user opens external booking provider
 */
export function registerExternalBookingOpen(itemId: string, provider: string) {
  pending = {
    itemId,
    provider,
    openedAt: now(),
  };
}

/**
 * Subscribe once in app root
 */
export function initBookingReturnListener(onReturn: (itemId: string, provider: string) => void) {
  if (subscribed) return;
  subscribed = true;

  AppState.addEventListener("change", (state) => {
    if (state !== "active") return;
    if (!pending) return;

    const elapsed = now() - pending.openedAt;

    // Only trigger within 30 minutes
    if (elapsed < 30 * 60 * 1000) {
      const p = pending;
      pending = null;
      onReturn(p.itemId, p.provider);
    } else {
      pending = null;
    }
  });
}

/**
 * Mark saved item booked
 */
export async function markBookingComplete(itemId: string) {
  await savedItemsStore.transitionStatus(itemId, "booked");
}
