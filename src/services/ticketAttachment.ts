// src/services/ticketAttachment.ts
import { Alert } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import { pickAndStoreAttachmentForItem } from "@/src/services/walletAttachments";

/**
 * Legacy compatibility wrapper.
 * Some older flows still call attachTicketProof(itemId).
 *
 * This now behaves as:
 * - load saved items
 * - verify item exists
 * - pick and store attachment
 * - attach proof to the saved item
 * - return boolean for simple call sites
 */
async function ensureSavedItemsLoaded() {
  if (savedItemsStore.getState().loaded) return;

  try {
    await savedItemsStore.load();
  } catch {
    // ignore
  }
}

export async function attachTicketProof(itemId: string): Promise<boolean> {
  const id = String(itemId ?? "").trim();
  if (!id) return false;

  try {
    await ensureSavedItemsLoaded();

    const item = savedItemsStore.getById(id);
    if (!item) {
      Alert.alert("Couldn’t add attachment", "This booking could not be found.", [{ text: "OK" }], {
        cancelable: true,
      });
      return false;
    }

    const att = await pickAndStoreAttachmentForItem(id);
    await savedItemsStore.addAttachment(id, att);

    return true;
  } catch (e: any) {
    const msg = String(e?.message ?? "");

    if (msg === "cancelled") return false;

    Alert.alert("Couldn’t add attachment", msg || "Try again.", [{ text: "OK" }], {
      cancelable: true,
    });
    return false;
  }
}
