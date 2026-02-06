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

let booted = false;
let prompting = false;

async function ensureSavedItemsLoaded() {
  if (savedItemsStore.getState().loaded) return;
  try {
    await savedItemsStore.load();
  } catch {
    // best-effort
  }
}

function safePartnerName(pid: PartnerId): string {
  try {
    return getPartner(pid).name;
  } catch {
    return "Partner";
  }
}

function getItemForClick(click: LastPartnerClick) {
  try {
    return savedItemsStore.getState().items.find((x) => x.id === click.itemId) ?? null;
  } catch {
    return null;
  }
}

function safeItemTitle(fallback: string, title?: string | null) {
  const t = String(title ?? "").trim();
  return t || fallback || "Your booking";
}

async function archivePendingItem(itemId: string) {
  try {
    await ensureSavedItemsLoaded();
    await savedItemsStore.transitionStatus(itemId, "archived");
  } catch {
    // ignore
  } finally {
    clearLastClick(itemId);
  }
}

async function handleReturn(click: LastPartnerClick) {
  if (prompting) return;
  prompting = true;

  const finish = () => {
    prompting = false;
  };

  try {
    await ensureSavedItemsLoaded();

    const item = getItemForClick(click);

    // If item is missing, already booked, or not pending anymore, do NOT prompt.
    if (!item) {
      clearLastClick(click.itemId);
      finish();
      return;
    }

    if (item.status !== "pending") {
      clearLastClick(click.itemId);
      finish();
      return;
    }

    const partnerName = safePartnerName(click.partnerId);
    const title = safeItemTitle("Your booking", item.title);

    Alert.alert(
      "Did you book it?",
      `${partnerName}\n\n${title}\n\nIf you booked it, we’ll move it into Wallet.`,
      [
        {
          text: "Not yet",
          style: "cancel",
          onPress: async () => {
            try {
              await markNotBooked(click.itemId); // keeps pending (Phase 1)
            } finally {
              finish();
            }
          },
        },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              await archivePendingItem(click.itemId);
            } finally {
              finish();
            }
          },
        },
        {
          text: "Booked",
          onPress: async () => {
            try {
              await markBooked(click.itemId); // pending -> booked
            } finally {
              finish();
            }
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          // Treat dismissal as “not yet”, but clear click to avoid re-prompt loops.
          try {
            clearLastClick(click.itemId);
          } finally {
            finish();
          }
        },
      }
    );
  } catch {
    try {
      clearLastClick(click.itemId);
    } finally {
      finish();
    }
  }
}

export function bootstrapPartnerReturnPrompt() {
  if (booted) return;
  booted = true;

  ensurePartnerReturnWatcher(async (click) => {
    await handleReturn(click);
  });
}
