// src/state/savedItems.ts
import { create } from "zustand";

import type { SavedItem, SavedItemStatus, SavedItemType } from "@/src/core/savedItemTypes";
import { assertTransition } from "@/src/core/savedItemTypes";
import { makeSavedItemId } from "@/src/core/id";
import { readJson, writeJson } from "@/src/state/persist";

type SavedItemsState = {
  loaded: boolean;
  items: SavedItem[];

  loadSavedItems: () => Promise<void>;

  addItem: (input: {
    tripId: string;
    type: SavedItemType;
    title: string;
    partnerId?: string;
    partnerUrl?: string;
    priceText?: string;
    currency?: string;
    metadata?: Record<string, any>;
  }) => Promise<SavedItem>;

  updateItem: (id: string, patch: Partial<Omit<SavedItem, "id" | "createdAt">>) => Promise<SavedItem>;

  transitionStatus: (id: string, nextStatus: SavedItemStatus) => Promise<SavedItem>;

  removeItem: (id: string) => Promise<void>;

  listByTrip: (tripId: string) => SavedItem[];
  listBookedForWallet: () => SavedItem[];

  clearAllSavedItems: () => Promise<void>;
};

const STORAGE_KEY = "yna_saved_items_v1";

function now() {
  return Date.now();
}

function normalizeItem(x: any): SavedItem | null {
  if (!x || typeof x !== "object") return null;

  const id = String(x.id ?? "").trim();
  const tripId = String(x.tripId ?? "").trim();
  const type = String(x.type ?? "").trim() as SavedItemType;
  const status = String(x.status ?? "").trim() as SavedItemStatus;
  const title = String(x.title ?? "").trim();

  if (!id || !tripId || !type || !status || !title) return null;

  const createdAt = Number.isFinite(Number(x.createdAt)) ? Number(x.createdAt) : now();
  const updatedAt = Number.isFinite(Number(x.updatedAt)) ? Number(x.updatedAt) : createdAt;

  return {
    id: id as any,
    tripId: tripId as any,
    type,
    status,
    title,
    partnerId: typeof x.partnerId === "string" ? x.partnerId : undefined,
    partnerUrl: typeof x.partnerUrl === "string" ? x.partnerUrl : undefined,
    priceText: typeof x.priceText === "string" ? x.priceText : undefined,
    currency: typeof x.currency === "string" ? x.currency : undefined,
    createdAt,
    updatedAt,
    metadata: x.metadata && typeof x.metadata === "object" ? x.metadata : undefined,
  };
}

async function persist(items: SavedItem[]) {
  await writeJson(STORAGE_KEY, items);
}

function sortItems(items: SavedItem[]): SavedItem[] {
  const copy = [...items];
  copy.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  return copy;
}

const useSavedItemsStore = create<SavedItemsState>((set, get) => ({
  loaded: false,
  items: [],

  loadSavedItems: async () => {
    const raw = await readJson<any[]>(STORAGE_KEY, []);
    const parsed = raw.map(normalizeItem).filter(Boolean) as SavedItem[];
    set({ items: sortItems(parsed), loaded: true });
  },

  addItem: async (input) => {
    const id = makeSavedItemId() as unknown as string;

    const item: SavedItem = {
      id: id as any,
      tripId: String(input.tripId) as any,
      type: input.type,
      status: "saved",
      title: String(input.title).trim(),
      partnerId: input.partnerId ? String(input.partnerId) : undefined,
      partnerUrl: input.partnerUrl ? String(input.partnerUrl) : undefined,
      priceText: input.priceText ? String(input.priceText) : undefined,
      currency: input.currency ? String(input.currency) : undefined,
      metadata: input.metadata,
      createdAt: now(),
      updatedAt: now(),
    };

    const next = sortItems([item, ...get().items]);
    set({ items: next, loaded: true });
    await persist(next);

    return item;
  },

  updateItem: async (id, patch) => {
    const cur = get().items;
    const idx = cur.findIndex((x) => String(x.id) === String(id));
    if (idx < 0) throw new Error("Saved item not found");

    const existing = cur[idx];

    const nextItem: SavedItem = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: now(),
    };

    const next = [...cur];
    next[idx] = nextItem;

    const sorted = sortItems(next);
    set({ items: sorted, loaded: true });
    await persist(sorted);

    return nextItem;
  },

  transitionStatus: async (id, nextStatus) => {
    const cur = get().items;
    const idx = cur.findIndex((x) => String(x.id) === String(id));
    if (idx < 0) throw new Error("Saved item not found");

    const existing = cur[idx];
    assertTransition(existing.status, nextStatus);

    const nextItem: SavedItem = {
      ...existing,
      status: nextStatus,
      updatedAt: now(),
    };

    const next = [...cur];
    next[idx] = nextItem;

    const sorted = sortItems(next);
    set({ items: sorted, loaded: true });
    await persist(sorted);

    return nextItem;
  },

  removeItem: async (id) => {
    const next = get().items.filter((x) => String(x.id) !== String(id));
    set({ items: next, loaded: true });
    await persist(next);
  },

  listByTrip: (tripId) => {
    return get().items.filter((x) => String(x.tripId) === String(tripId));
  },

  listBookedForWallet: () => {
    // Wallet reads BOOKED only. Pending stays in workspace until confirmed.
    return get().items.filter((x) => x.status === "booked");
  },

  clearAllSavedItems: async () => {
    set({ items: [], loaded: true });
    await persist([]);
  },
}));

/**
 * Mirror tripsStore pattern for consistency.
 */
const savedItemsStore = {
  getState: useSavedItemsStore.getState,
  setState: useSavedItemsStore.setState,
  subscribe: useSavedItemsStore.subscribe,

  loadSavedItems: async () => {
    await useSavedItemsStore.getState().loadSavedItems();
  },

  addItem: async (input: Parameters<SavedItemsState["addItem"]>[0]) => {
    return await useSavedItemsStore.getState().addItem(input);
  },

  updateItem: async (id: string, patch: Parameters<SavedItemsState["updateItem"]>[1]) => {
    return await useSavedItemsStore.getState().updateItem(id, patch);
  },

  transitionStatus: async (id: string, nextStatus: SavedItemStatus) => {
    return await useSavedItemsStore.getState().transitionStatus(id, nextStatus);
  },

  removeItem: async (id: string) => {
    await useSavedItemsStore.getState().removeItem(id);
  },

  clearAllSavedItems: async () => {
    await useSavedItemsStore.getState().clearAllSavedItems();
  },
};

export default savedItemsStore;
export { useSavedItemsStore };
