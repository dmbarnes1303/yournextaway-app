// src/services/partnerReturnBootstrap.ts
import { Alert } from "react-native";

import {
  ensurePartnerReturnWatcher,
  getLastClick,
  markBooked,
  markNotBooked,
  dismissReturnPrompt,
  type LastPartnerClick,
} from "@/src/services/partnerClicks";

import savedItemsStore from "@/src/state/savedItems";
import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";

/**
 * Global bootstrap for:
 * partner click → return detection → “Booked?” prompt
 *
 * Called once from app/_layout.tsx
 */

let bootstrapped = false;
let prompting = false;

function safeTitleFromClick(click: LastPartnerClick): string {
  try {
    const it = savedItemsStore.getState().items.find((x) => x.id === click.itemId);
    const t = String(it?.title ?? "").trim();
    return t || "Your booking";
  } catch {
    return "Your booking";
  }
}

async function ensureSavedLoaded() {
  if (savedItemsStore.getState().loaded) return;
  try {
    await savedItemsStore.load();
  } catch {
    // ignore
  }
}

async function handleReturn(click: LastPartnerClick) {
  if (prompting) return;

  // If we don’t have the item anymore, just clear prompt state and bail.
  await ensureSavedLoaded();
  const itemExists = savedItemsStore.getState().items.some((x) => x.id === click.itemId);
  if (!itemExists) {
    await dismissReturnPrompt(click.itemId);
    return;
  }

  prompting = true;

  const title = safeTitleFromClick(click);

  Alert.alert(
    "Did you complete the booking?",
    title,
    [
      {
        text: "Not now",
        style: "cancel",
        onPress: () => {
          // Keep status pending, but avoid immediate reprompt
          Promise.resolve(dismissReturnPrompt(click.itemId)).finally(() => {
            prompting = false;
          });
        },
      },
      {
        text: "No",
        style: "default",
        onPress: () => {
          Promise.resolve(markNotBooked(click.itemId)).finally(() => {
            prompting = false;
          });
        },
      },
      {
        text: "Yes",
        style: "default",
        onPress: () => {
          (async () => {
            await markBooked(click.itemId);
            // Phase-1 Wallet proof: prompt to add PDF/screenshot if missing
            try {
              await confirmBookedAndOfferProof(click.itemId);
            } catch {
              // ignore
            }
          })().finally(() => {
            prompting = false;
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

  // Register watcher (AppState -> active)
  ensurePartnerReturnWatcher((click) => handleReturn(click));

  // Optional: if there’s an already-cached lastClick (e.g. browser dismiss path),
  // prompt shortly after boot so user doesn’t miss it.
  // Safe: handleReturn() is guarded against duplicates.
  setTimeout(() => {
    const click = getLastClick();
    if (click) handleReturn(click).catch(() => null);
  }, 600);
}
