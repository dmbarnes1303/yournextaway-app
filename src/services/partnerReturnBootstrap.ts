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

  // ✅ Crash-proof guard (prevents the exact error you hit)
  if (typeof ensurePartnerReturnWatcher !== "function") {
    console.warn(
      "[partnerReturnBootstrap] ensurePartnerReturnWatcher is not a function. Metro cache / duplicate module likely."
    );
    return;
  }

  ensurePartnerReturnWatcher((click) => handleReturn(click));

  setTimeout(() => {
    const click = getLastClick();
    if (click) handleReturn(click).catch(() => null);
  }, 600);
}
