import { create } from "zustand";

import { makeSavedItemId } from "@/src/core/id";
import {
  assertTransition,
  normalizeSavedItem,
  normalizeSavedItems,
  normalizeSavedItemStatus,
  normalizeSavedItemType,
  normalizeWalletAttachment,
  normalizeWalletAttachments,
  type SavedItem,
  type SavedItemStatus,
  type SavedItemType,
  type WalletAttachment,
} from "@/src/core/savedItemTypes";
import { readJson, writeJson } from "@/src/state/persist";
import { deleteAttachmentFile } from "@/src/services/walletAttachments";

const STORAGE_KEY = "yna_saved_items_v2";
const VALID_STATUS: ReadonlySet<SavedItemStatus> = new Set(["saved", "pending", "booked", "archived"]);

type SavedItemsState = {
  loaded: boolean;
  items: SavedItem[];
  load: () => Promise<void>;
  add: (args: {
    tripId?: string;
    type: SavedItemType;
    status?: SavedItemStatus;
    title: string;
    partnerId?: string;
    partnerUrl?: string;
    partnerClickId?: string;
    partnerTier?: "tier1" | "tier2";
    partnerCategory?: "tickets" | "flights" | "hotels" | "insurance";
    sourceSurface?: string;
    sourceSection?: string;
    priceText?: string;
    currency?: string;
    metadata?: Record<string, unknown>;
    attachments?: WalletAttachment[];
    bookedAt?: number;
  }) => Promise<SavedItem>;
  update: (id: string, patch: Partial<Omit<SavedItem, "id" | "createdAt">>) => Promise<void>;
  transitionStatus: (id: string, to: SavedItemStatus) => Promise<void>;
  addAttachment: (id: string, attachment: WalletAttachment) => Promise<void>;
  removeAttachment: (id: string, attachmentId: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: (opts?: { deleteAttachmentFiles?: boolean }) => Promise<void>;
  clearTrip: (tripId: string, opts?: { deleteAttachmentFiles?: boolean }) => Promise<void>;
  clearOrphans: (validTripIds: string[], opts?: { deleteAttachmentFiles?: boolean }) => Promise<void>;
};

function now() {
  return Date.now();
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function cleanOptionalString(value: unknown): string | undefined {
  const cleaned = cleanString(value);
  return cleaned || undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeUrl(value: unknown): string | undefined {
  const raw = cleanString(value);
  if (!raw) return undefined;
  try {
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(url);
    if (!/^https?:$/i.test(parsed.protocol)) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function cloneItem<T extends SavedItem | null | undefined>(item: T): T {
  if (!item) return item;
  return {
    ...item,
    metadata: item.metadata ? { ...item.metadata } : undefined,
    attachments: Array.isArray(item.attachments) ? [...item.attachments] : undefined,
  } as T;
}

function cloneItems(items: SavedItem[]): SavedItem[] {
  return items.map((item) => cloneItem(item) as SavedItem);
}

function sortItems(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
}

async function persistItems(items: SavedItem[]) {
  await writeJson(STORAGE_KEY, items);
}

async function deleteOwnedFilesForItems(items: SavedItem[]) {
  for (const item of items) {
    for (const attachment of item.attachments ?? []) {
      try {
        await deleteAttachmentFile(attachment);
      } catch {
        // best effort
      }
    }
  }
}

let inflightLoad: Promise<void> | null = null;

const useSavedItemsStore = create<SavedItemsState>((set, get) => ({
  loaded: false,
  items: [],

  load: async () => {
    if (get().loaded) return;
    if (inflightLoad) return inflightLoad;

    inflightLoad = (async () => {
      const raw = await readJson<unknown>(STORAGE_KEY, []);
      const items = normalizeSavedItems(raw);
      const sorted = sortItems(items);
      set({ loaded: true, items: sorted });
      await persistItems(sorted);
    })()
      .catch(() => {
        set({ loaded: true, items: [] });
      })
      .finally(() => {
        inflightLoad = null;
      });

    return inflightLoad;
  },

  add: async (args) => {
    if (!get().loaded) await get().load();

    const type = normalizeSavedItemType(args.type);
    const status = normalizeSavedItemStatus(args.status ?? "saved");
    const title = cleanString(args.title);

    if (!type) throw new Error("Invalid item type");
    if (!status || !VALID_STATUS.has(status)) throw new Error("Invalid item status");
    if (!title) throw new Error("title required");

    const createdAt = now();
    const item = normalizeSavedItem({
      id: makeSavedItemId(),
      tripId: cleanOptionalString(args.tripId),
      type,
      status,
      title,
      partnerId: cleanOptionalString(args.partnerId),
      partnerUrl: safeUrl(args.partnerUrl),
      partnerClickId: cleanOptionalString(args.partnerClickId),
      partnerTier: cleanOptionalString(args.partnerTier),
      partnerCategory: cleanOptionalString(args.partnerCategory),
      sourceSurface: cleanOptionalString(args.sourceSurface),
      sourceSection: cleanOptionalString(args.sourceSection),
      priceText: cleanOptionalString(args.priceText),
      currency: cleanOptionalString(args.currency),
      metadata: isPlainObject(args.metadata) ? args.metadata : undefined,
      attachments: normalizeWalletAttachments(args.attachments),
      bookedAt: Number.isFinite(Number(args.bookedAt)) ? Number(args.bookedAt) : undefined,
      createdAt,
      updatedAt: createdAt,
    });

    if (!item) throw new Error("Could not create saved item");

    const next = sortItems([item, ...get().items]);
    set({ loaded: true, items: next });
    await persistItems(next);
    return cloneItem(item) as SavedItem;
  },

  update: async (id, patch) => {
    if (!get().loaded) await get().load();
    const cleanId = cleanString(id);
    if (!cleanId) return;

    let changed = false;
    const next = get().items.map((item) => {
      if (item.id !== cleanId) return item;
      changed = true;
      const merged: SavedItem = {
        ...item,
        ...patch,
        tripId: "tripId" in patch ? cleanOptionalString(patch.tripId) : item.tripId,
        title: "title" in patch ? cleanString(patch.title) || item.title : item.title,
        partnerId: "partnerId" in patch ? cleanOptionalString(patch.partnerId) : item.partnerId,
        partnerUrl: "partnerUrl" in patch ? safeUrl(patch.partnerUrl) : item.partnerUrl,
        partnerClickId:
          "partnerClickId" in patch ? cleanOptionalString(patch.partnerClickId) : item.partnerClickId,
        partnerTier:
          "partnerTier" in patch ? (cleanOptionalString(patch.partnerTier) as any) : item.partnerTier,
        partnerCategory:
          "partnerCategory" in patch
            ? (cleanOptionalString(patch.partnerCategory) as any)
            : item.partnerCategory,
        sourceSurface:
          "sourceSurface" in patch ? cleanOptionalString(patch.sourceSurface) : item.sourceSurface,
        sourceSection:
          "sourceSection" in patch ? cleanOptionalString(patch.sourceSection) : item.sourceSection,
        priceText: "priceText" in patch ? cleanOptionalString(patch.priceText) : item.priceText,
        currency: "currency" in patch ? cleanOptionalString(patch.currency) : item.currency,
        metadata:
          "metadata" in patch
            ? (isPlainObject(patch.metadata) ? patch.metadata : undefined)
            : item.metadata,
        attachments:
          "attachments" in patch
            ? normalizeWalletAttachments(patch.attachments)
            : item.attachments,
        bookedAt:
          "bookedAt" in patch && Number.isFinite(Number(patch.bookedAt))
            ? Number(patch.bookedAt)
            : "bookedAt" in patch
              ? undefined
              : item.bookedAt,
        updatedAt: now(),
      };

      const normalized = normalizeSavedItem(merged);
      if (!normalized) throw new Error("Invalid saved item update");
      return normalized;
    });

    if (!changed) return;
    const sorted = sortItems(next);
    set({ loaded: true, items: sorted });
    await persistItems(sorted);
  },

  transitionStatus: async (id, to) => {
    if (!get().loaded) await get().load();
    const cleanId = cleanString(id);
    const target = normalizeSavedItemStatus(to);
    if (!cleanId || !target || !VALID_STATUS.has(target)) {
      throw new Error("Invalid target status");
    }

    const current = get().items.find((x) => x.id === cleanId);
    if (!current) return;
    if (current.status === target) return;

    assertTransition(current.status, target);

    await get().update(cleanId, {
      status: target,
      bookedAt: target === "booked" ? now() : current.bookedAt,
    });
  },

  addAttachment: async (id, attachment) => {
    if (!get().loaded) await get().load();
    const cleanId = cleanString(id);
    const normalized = normalizeWalletAttachment(attachment);
    if (!cleanId || !normalized) throw new Error("Invalid attachment");

    const item = get().items.find((entry) => entry.id === cleanId);
    if (!item) throw new Error("Saved item not found");

    const existing = item.attachments ?? [];
    const nextAttachments = [...existing.filter((x) => x.id !== normalized.id && x.uri !== normalized.uri), normalized]
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

    await get().update(cleanId, { attachments: nextAttachments });
  },

  removeAttachment: async (id, attachmentId) => {
    if (!get().loaded) await get().load();
    const cleanId = cleanString(id);
    const cleanAttachmentId = cleanString(attachmentId);
    if (!cleanId || !cleanAttachmentId) return;

    const item = get().items.find((entry) => entry.id === cleanId);
    if (!item) return;

    const current = item.attachments ?? [];
    const toRemove = current.find((entry) => entry.id === cleanAttachmentId);
    if (toRemove) {
      try {
        await deleteAttachmentFile(toRemove);
      } catch {
        // best effort
      }
    }

    await get().update(cleanId, {
      attachments: current.filter((entry) => entry.id !== cleanAttachmentId),
    });
  },

  remove: async (id) => {
    if (!get().loaded) await get().load();
    const cleanId = cleanString(id);
    if (!cleanId) return;
    const current = get().items;
    const removed = current.filter((entry) => entry.id === cleanId);
    await deleteOwnedFilesForItems(removed);
    const next = current.filter((entry) => entry.id !== cleanId);
    set({ loaded: true, items: next });
    await persistItems(next);
  },

  clearAll: async (opts) => {
    if (!get().loaded) await get().load();
    const current = get().items;
    if (opts?.deleteAttachmentFiles) {
      await deleteOwnedFilesForItems(current);
    }
    set({ loaded: true, items: [] });
    await persistItems([]);
  },

  clearTrip: async (tripId, opts) => {
    if (!get().loaded) await get().load();
    const tripKey = cleanString(tripId);
    if (!tripKey) return;
    const current = get().items;
    const removed = current.filter((entry) => cleanString(entry.tripId) === tripKey);
    const next = current.filter((entry) => cleanString(entry.tripId) !== tripKey);
    if (opts?.deleteAttachmentFiles) {
      await deleteOwnedFilesForItems(removed);
    }
    set({ loaded: true, items: next });
    await persistItems(next);
  },

  clearOrphans: async (validTripIds, opts) => {
    if (!get().loaded) await get().load();
    const valid = new Set((validTripIds ?? []).map((entry) => cleanString(entry)).filter(Boolean));
    const current = get().items;
    const removed = current.filter((entry) => entry.tripId && !valid.has(cleanString(entry.tripId)));
    const next = current.filter((entry) => !entry.tripId || valid.has(cleanString(entry.tripId)));
    if (opts?.deleteAttachmentFiles) {
      await deleteOwnedFilesForItems(removed);
    }
    set({ loaded: true, items: next });
    await persistItems(next);
  },
}));

const savedItemsStore = {
  getState: useSavedItemsStore.getState,
  setState: useSavedItemsStore.setState,
  subscribe: useSavedItemsStore.subscribe,
  load: async () => {
    await useSavedItemsStore.getState().load();
  },
  add: async (args: Parameters<SavedItemsState["add"]>[0]) => {
    return await useSavedItemsStore.getState().add(args);
  },
  update: async (id: string, patch: Parameters<SavedItemsState["update"]>[1]) => {
    await useSavedItemsStore.getState().update(id, patch);
  },
  transitionStatus: async (id: string, to: SavedItemStatus) => {
    await useSavedItemsStore.getState().transitionStatus(id, to);
  },
  addAttachment: async (id: string, attachment: WalletAttachment) => {
    await useSavedItemsStore.getState().addAttachment(id, attachment);
  },
  removeAttachment: async (id: string, attachmentId: string) => {
    await useSavedItemsStore.getState().removeAttachment(id, attachmentId);
  },
  remove: async (id: string) => {
    await useSavedItemsStore.getState().remove(id);
  },
  clearAll: async (opts?: { deleteAttachmentFiles?: boolean }) => {
    await useSavedItemsStore.getState().clearAll(opts);
  },
  clearTrip: async (tripId: string, opts?: { deleteAttachmentFiles?: boolean }) => {
    await useSavedItemsStore.getState().clearTrip(tripId, opts);
  },
  clearOrphans: async (validTripIds: string[], opts?: { deleteAttachmentFiles?: boolean }) => {
    await useSavedItemsStore.getState().clearOrphans(validTripIds, opts);
  },
  getAll: () => cloneItems(useSavedItemsStore.getState().items),
  getById: (id?: string) => {
    const cleanId = cleanOptionalString(id);
    if (!cleanId) return undefined;
    const item = useSavedItemsStore.getState().items.find((entry) => entry.id === cleanId);
    return item ? (cloneItem(item) as SavedItem) : undefined;
  },
  getByTripId: (tripId?: string) => {
    const cleanTripId = cleanOptionalString(tripId);
    if (!cleanTripId) return [];
    return useSavedItemsStore.getState().items.filter((entry) => entry.tripId === cleanTripId).map((entry) => cloneItem(entry) as SavedItem);
  },
};

export default savedItemsStore;
export { useSavedItemsStore };
