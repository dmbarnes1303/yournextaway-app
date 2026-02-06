// src/services/partnerReturnBootstrap.ts
import { Alert } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import { getPartner, type PartnerId } from "@/src/core/partners";
import {
  ensurePartnerReturnWatcher,
  markBooked,
  markNotBooked,
  clearLastClick,
  type LastPartnerClick,
} from "@/src/services/partnerClicks";

/**
 * Global return prompt bootstrap.
 *
 * Phase-1 bible rules enforced:
 * - Pending is created BEFORE opening partner.
 * - On return, ask "Did you book it?"
 * - If "Booked" -> markBooked (moves into Wallet)
 * - If "Not yet" -> keep Pending
 * - If dismiss -> clearLastClick to avoid loops
 *
 * HARDENING:
 * - Boot only once (even with fast refresh)
 * - Guard against multiple prompts at the same time
 * - Best-effort item lookup for nicer copy
 */

let booted = false;
let prompting = false;

function safeTitle(click: LastPartnerClick): string {
  try {
    const s = savedItemsStore.getState();
    const item = s.items.find((x) => x.id === click.itemId);
    const t = String(item?.title ?? "").trim();
    return t || "Your booking";
  } catch {
    return "Your booking";
  }
}

function safePartnerName(pid: PartnerId): string {
  try {
    return getPartner(pid).name;
  } catch {
    return "Partner";
  }
}

async function handleReturn(click: LastPartnerClick) {
  if (prompting) return;
  prompting = true;

  try {
    // Ensure items are available for lookup (cold start safety)
    if (!savedItemsStore.getState().loaded) {
      try {
        await savedItemsStore.load();
      } catch {
        // ignore
      }
    }

    const partnerName = safePartnerName(click.partnerId);
    const title = safeTitle(click);

    Alert.alert(
      "Did you book it?",
      `${partnerName}\n\n${title}\n\nIf you booked it, we’ll move it into Wallet.`,
      [
        {
          text: "Not yet",
          style: "cancel",
          onPress: async () => {
            try {
              await markNotBooked(click.itemId);
            } finally {
              prompting = false;
            }
          },
        },
        {
          text: "Booked",
          style: "default",
          onPress: async () => {
            try {
              await markBooked(click.itemId);
            } finally {
              prompting = false;
            }
          },
        },
        {
          text: "Dismiss",
          style: "destructive",
          onPress: () => {
            try {
              clearLastClick(click.itemId);
            } finally {
              prompting = false;
            }
          },
        },
      ],
      { cancelable: true, onDismiss: () => {
        // If user dismisses via tapping outside on Android etc,
        // clear to avoid re-prompt loops.
        try {
          clearLastClick(click.itemId);
        } finally {
          prompting = false;
        }
      }}
    );
  } catch {
    // Never crash app on prompt logic.
    try {
      clearLastClick(click.itemId);
    } finally {
      prompting = false;
    }
  }
}

/**
 * Call once from app startup (RootLayout).
 */
export function bootstrapPartnerReturnPrompt() {
  if (booted) return;
  booted = true;

  ensurePartnerReturnWatcher(async (click) => {
    await handleReturn(click);
  });
}
