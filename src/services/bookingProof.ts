import { Alert } from "react-native";

import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem, WalletAttachment } from "@/src/core/savedItemTypes";
import { pickAndStoreAttachmentForItem } from "@/src/services/walletAttachments";
import { writeJson } from "@/src/state/persist";

const LAST_BOOKED_KEY = "yna_last_booked_v1";

let proofPromptInFlightForItemId: string | null = null;

function defer(fn: () => void) {
  setTimeout(fn, 60);
}

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

function showOkAlert(title: string, message: string) {
  Alert.alert(title, message, [{ text: "OK" }], { cancelable: true });
}

async function persistLastBookedPointer(item?: SavedItem | null) {
  const itemId = cleanString(item?.id);
  const tripId = cleanString(item?.tripId);

  if (!itemId || !tripId) return;

  try {
    await writeJson(LAST_BOOKED_KEY, {
      itemId,
      tripId,
      at: Date.now(),
    });
  } catch {
    // best-effort only
  }
}

async function addProofIfMissing(itemId: string) {
  const id = cleanString(itemId);
  if (!id) return;

  if (proofPromptInFlightForItemId === id) return;
  proofPromptInFlightForItemId = id;

  try {
    await ensureSavedItemsLoaded();

    const before = savedItemsStore.getById(id) ?? null;
    if (!before) {
      showOkAlert("Booking not found", "This booking could not be found.");
      return;
    }

    if (before.status !== "booked") {
      showOkAlert("Not booked", "Only booked items can store booking proof.");
      return;
    }

    if (getAttachments(before).length > 0) {
      showOkAlert("Already added", "This booking already has proof stored in Wallet.");
      return;
    }

    const attachment = await pickAndStoreAttachmentForItem(id);

    // Defensive: the picker may throw or may return nothing on cancel in some implementations.
    if (!attachment) return;

    await ensureSavedItemsLoaded();

    const afterPick = savedItemsStore.getById(id) ?? null;
    const alreadyAttached = getAttachments(afterPick).some(
      (existing) => existing.id === attachment.id || existing.uri === attachment.uri
    );

    if (!alreadyAttached) {
      await savedItemsStore.addAttachment(id, attachment);
    }

    showOkAlert("Saved", "Booking proof stored in Wallet for offline access.");
  } catch (error: unknown) {
    const message =
      error instanceof Error ? cleanString(error.message) : cleanString(error);

    if (message.toLowerCase() === "cancelled") return;

    showOkAlert("Couldn’t add attachment", message || "Try again.");
  } finally {
    proofPromptInFlightForItemId = null;
  }
}

/**
 * Call after an item is marked "booked".
 * - stores a last-booked pointer for Wallet highlighting
 * - confirms wallet state
 * - offers proof upload if no proof exists yet
 */
export async function confirmBookedAndOfferProof(itemId: string) {
  const id = cleanString(itemId);
  if (!id) return;

  await ensureSavedItemsLoaded();

  const item = savedItemsStore.getById(id) ?? null;
  if (!item) return;
  if (item.status !== "booked") return;

  await persistLastBookedPointer(item);

  const title = cleanString(item.title) || "Booking";
  const attachments = getAttachments(item);

  if (attachments.length > 0) {
    showOkAlert("Added to Wallet", `"${title}" is booked and saved in your Wallet.`);
    return;
  }

  const message =
    `"${title}" is now marked as booked.\n\n` +
    `Want to add booking proof (PDF or screenshot) for offline access?`;

  Alert.alert(
    "Added to Wallet",
    message,
    [
      { text: "Not now", style: "cancel" },
      {
        text: "Add booking proof",
        onPress: () => defer(() => void addProofIfMissing(id)),
      },
    ],
    { cancelable: true }
  );
}
