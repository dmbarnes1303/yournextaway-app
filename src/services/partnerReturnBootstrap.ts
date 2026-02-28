// src/services/partnerReturnBootstrap.ts
import savedItemsStore from "@/src/state/savedItems";
import {
  ensurePartnerReturnWatcher,
  markBooked,
  markNotBooked,
  dismissReturnPrompt,
  type LastPartnerClick,
} from "@/src/services/partnerClicks";

/**
 * Root-level bootstrap:
 * - Subscribes to partner return watcher
 * - On return, tells UI "show modal for itemId"
 *
 * UI decides:
 * - YES -> markBooked(itemId)
 * - NO  -> markNotBooked(itemId)
 * - NOT NOW -> dismissReturnPrompt(itemId) (keeps pending)
 */

let bootstrapped = false;
let handler: ((itemId: string, click: LastPartnerClick) => void) | null = null;

export function registerReturnModalHandler(fn: (itemId: string, click: LastPartnerClick) => void) {
  handler = fn;
}

/**
 * Call once from app/_layout.tsx
 */
export function bootstrapPartnerReturnPrompt() {
  if (bootstrapped) return;
  bootstrapped = true;

  // Ensure store is available; watcher itself loads click state.
  savedItemsStore.load().catch(() => null);

  ensurePartnerReturnWatcher(async (click) => {
    const fn = handler;
    if (!fn) return; // keep click persisted in partnerClicks until handler exists
    fn(click.itemId, click);
  });
}

/** UI action: user confirms booking */
export async function markItemBooked(itemId: string) {
  await markBooked(itemId);
}

/** UI action: user says they did NOT book */
export async function markItemNotBooked(itemId: string) {
  await markNotBooked(itemId);
}

/** UI action: user dismisses ("Not now") */
export async function dismissPartnerReturn(itemId?: string) {
  await dismissReturnPrompt(itemId);
}
