import { Alert } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem, WalletAttachment } from "@/src/core/savedItemTypes";
import { pickAndStoreAttachmentForItem } from "@/src/services/walletAttachments";

/**
 * Compatibility wrapper used across existing screens.
 *
 * Important truth rules:
 * - proof is only attachable to user-confirmed booked items
 * - this is not ticket-only despite the legacy function name
 * - duplicate attachments are blocked by id/uri match
 * - returns boolean so older call sites stay simple
 */

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

async function ensureSavedItemsLoaded() {
  if (savedItemsStore.getState().loaded) return;

  try {
    await savedItemsStore.load();
  } catch {
    // keep caller-facing handling simple
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

function isDuplicateAttachment(
  existing: WalletAttachment[],
  incoming: WalletAttachment
): boolean {
  return existing.some(
    (entry) => entry.id === incoming.id || cleanString(entry.uri) === cleanString(incoming.uri)
  );
}

export async function attachTicketProof(itemId: string): Promise<boolean> {
  const id = cleanString(itemId);
  if (!id) return false;

  try {
    await ensureSavedItemsLoaded();

    const current = savedItemsStore.getById(id) ?? null;
    if (!current) {
      showError("This booking could not be found.");
      return false;
    }

    if (current.status !== "booked") {
      showError("Only booked items can store proof.");
      return false;
    }

    const attachment = await pickAndStoreAttachmentForItem(id);
    if (!attachment) return false;

    await ensureSavedItemsLoaded();

    const refreshed = savedItemsStore.getById(id) ?? null;
    if (!refreshed) {
      showError("This booking could not be found.");
      return false;
    }

    const existingAttachments = getAttachments(refreshed);
    if (!isDuplicateAttachment(existingAttachments, attachment)) {
      await savedItemsStore.addAttachment(id, attachment);
    }

    return true;
  } catch (error: any) {
    const message = cleanString(error?.message);

    if (message.toLowerCase() === "cancelled") {
      return false;
    }

    showError(message || "Try again.");
    return false;
  }
}
