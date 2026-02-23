// src/services/partnerReturnBootstrap.ts
import { Alert } from "react-native";

import {
  ensurePartnerReturnWatcher,
  getLastClick,
  markBooked,
  markNotBooked,
  type LastPartnerClick,
} from "@/src/services/partnerClicks";

import savedItemsStore from "@/src/state/savedItems";
import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";

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

  await ensureSavedLoaded();

  const itemExists = savedItemsStore.getState().items.some((x) => x.id === click.itemId);
  if (!itemExists) return;

  prompting = true;

  const title = safeTitleFromClick(click);

  const unlock = () => {
    prompting = false;
  };

  Alert.alert(
    "Did you complete the booking?",
    title,
    [
      {
        text: "Not now",
        style: "cancel",
        onPress: unlock, // keep pending, ask again next time a partner is opened
      },
      {
        text: "No",
        style: "default",
        onPress: () => {
          Promise.resolve(markNotBooked(click.itemId)).finally(unlock);
        },
      },
      {
        text: "Yes",
        style: "default",
        onPress: () => {
          (async () => {
            await markBooked(click.itemId);
            try {
              await confirmBookedAndOfferProof(click.itemId);
            } catch {
              // ignore
            }
          })().finally(unlock);
        },
      },
    ],
    {
      cancelable: true,
      onDismiss: unlock, // ✅ critical: Android back/outside tap
    }
  );
}

export function bootstrapPartnerReturnPrompt() {
  if (bootstrapped) return;
  bootstrapped = true;

  if (typeof ensurePartnerReturnWatcher !== "function") {
    console.warn(
      "[partnerReturnBootstrap] ensurePartnerReturnWatcher is not a function. Metro cache / duplicate module likely."
    );
    return;
  }

  ensurePartnerReturnWatcher((click) => handleReturn(click));

  // Catch any persisted click that happened before watcher was ready
  setTimeout(() => {
    const click = getLastClick();
    if (click) handleReturn(click).catch(() => null);
  }, 600);
}
