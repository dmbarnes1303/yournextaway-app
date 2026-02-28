// src/services/ticketAttachment.ts
import { Alert } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import { pickAndStoreAttachmentForItem } from "@/src/services/walletAttachments";

/**
 * LEGACY WRAPPER (Phase 1):
 * This exists because some UI flows still call attachTicketProof(itemId).
 *
 * Rules:
 * - Use the same picker + storage path as Wallet (pickAndStoreAttachmentForItem)
 * - Then attach it onto the SavedItem so it appears in Wallet offline
 * - Return boolean for simple call sites
 *
 * IMPORTANT:
 * This is NOT tickets-only anymore. It's just "attach booking proof".
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
    const att = await pickAndStoreAttachmentForItem(id);

    await ensureSavedItemsLoaded();
    await savedItemsStore.addAttachment(id, att);

    return true;
  } catch (e: any) {
    const msg = String(e?.message ?? "");

    // walletAttachments uses this convention
    if (msg === "cancelled") return false;

    // Best-effort feedback; don't crash any booking flow
    Alert.alert("Couldn’t add attachment", msg || "Try again.", [{ text: "OK" }], { cancelable: true });
    return false;
  }
}
