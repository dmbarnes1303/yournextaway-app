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
    if (!savedItemsStore.getState().loaded) {
      try {
        await savedItemsStore.load();
      } catch {
        // ignore
      }
    }

    const partnerName = safePartnerName(click.partnerId);
    const title = safeTitle(click);

    const finish = () => {
      prompting = false;
    };

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
              finish();
            }
          },
        },
        {
          text: "Booked",
          onPress: async () => {
            try {
              await markBooked(click.itemId);
            } finally {
              finish();
            }
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          // Treat dismissal as "not yet", but still clear lastClick to avoid loops
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
      prompting = false;
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
