import { Alert } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem, WalletAttachment } from "@/src/core/savedItemTypes";
import { pickAndStoreAttachmentForItem } from "@/src/services/walletAttachments";

/**
 * Legacy compatibility wrapper.
 * Some older flows still call attachTicketProof(itemId).
 *
 * Behaviour:
 * - ensure saved items are loaded
 * - verify item exists
 * - verify item is booked
 * - pick/store attachment
 * - attach only if not already attached
 * - return boolean for simple call sites
 */

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

async function ensureSavedItemsLoaded() {
  if (savedItemsStore.getState().loaded) return;

  try {
    await savedItemsStore.load();
  } catch {
    // ignore
  }
}

function getAttachments(item?: SavedItem | null): WalletAttachment[] {
  return Array.isArray(item?.attachments) ? item.attachments : [];
}

function showError(message: string) {
  Alert.alert("Couldn’t add attachment", message || "Try again.", [{ text: "OK" }], {
    cancelable: true,
  });
}

export async function attachTicketProof(itemId: string): Promise<boolean> {
  const id = cleanString(itemId);
  if (!id) return false;

  try {
    await ensureSavedItemsLoaded();

    const before = savedItemsStore.getById(id) ?? null;
    if (!before) {
      showError("This booking could not be found.");
      return false;
    }

    if (before.status !== "booked") {
      showError("Only booked items can store proof.");
      return false;
    }

    const attachment = await pickAndStoreAttachmentForItem(id);
    if (!attachment) return false;

    await ensureSavedItemsLoaded();

    const afterPick = savedItemsStore.getById(id) ?? null;
    if (!afterPick) {
      showError("This booking could not be found.");
      return false;
    }

    const alreadyAttached = getAttachments(afterPick).some(
      (existing) => existing.id === attachment.id || existing.uri === attachment.uri
    );

    if (!alreadyAttached) {
      await savedItemsStore.addAttachment(id, attachment);
    }

    return true;
  } catch (error: any) {
    const message = cleanString(error?.message);

    if (message.toLowerCase() === "cancelled") return false;

    showError(message || "Try again.");
    return false;
  }
}
