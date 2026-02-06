// src/state/savedItems.ts
import { create } from "zustand";

import { readJson, writeJson } from "@/src/state/persist";
import { makeSavedItemId } from "@/src/core/id";
import type { SavedItem, SavedItemStatus, SavedItemType } from "@/src/core/savedItemTypes";
import { assertTransition } from "@/src/core/savedItemTypes";

type SavedItemsState = {
  loaded: boolean;

  /** All items across all trips */
  items: SavedItem[];

  load: () => Promise<void>;

  /** Trip-scoped selectors */
  getByTrip: (tripId: string) => SavedItem[];
  getByTripAndStatus: (tripId: string, status: SavedItemStatus) => SavedItem[];

  /** Core mutations */
  add: (args: {
    tripId: string;
    type: SavedItemType;
    title: string;
    status?: SavedItemStatus;
    partnerId?: string;
    partnerUrl?: string;
    priceText?: string;
    currency?: string;
    metadata?: Record<string, any>;
  }) => Promise<SavedItem>;

  update: (id: string, patch: Partial<Omit<SavedItem, "id" | "tripId" | "createdAt">>) => Promise<void>;

  transitionStatus: (id: string, to: SavedItemStatus) => Promise<void>;

  remove: (id: string) => Promise<void>;
  clearTrip: (tripId: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const STORAGE_KEY = "yna_saved_items_v1";

function now() {
  return Date.now();
}

async function persist(items: SavedItem[]) {
  await writeJson(STORAGE_KEY, items);
}

function normalizeTripId(tripId: string) {
  const id = String(tripId ?? "").trim();
  if (!id) throw new Error("tripId is required");
  return id;
}

const useSavedItemsStore = create<SavedItemsState>((set, get) => ({
  loaded: false,
  items: [],

  load: async () => {
    const raw = await readJson<any>(STORAGE_KEY, []);
    const arr = Array.isArray(raw) ? raw : [];
    const cleaned: SavedItem[] = arr
      .map((x: any) => {
        if (!x || typeof x !== "object") return null;

        const id = String(x.id ?? "").trim();
        const tripId = String(x.tripId ?? "").trim();
        const type = String(x.type ?? "").trim() as SavedItemType;
        const status = String(x.status ?? "").trim() as SavedItemStatus;
        const title = String(x.title ?? "").trim();

        if (!id || !tripId || !type || !status || !title) return null;

        return {
          id,
          tripId,
          type,
          status,
          title,
          partnerId: typeof x.partnerId === "string" ? x.partnerId : undefined,
          partnerUrl: typeof x.partnerUrl === "string" ? x.partnerUrl : undefined,
          priceText: typeof x.priceText === "string" ? x.priceText : undefined,
          currency: typeof x.currency === "string" ? x.currency : undefined,
          metadata: x.metadata && typeof x.metadata === "object" ? x.metadata : undefined,
          createdAt: Number.isFinite(Number(x.createdAt)) ? Number(x.createdAt) : now(),
          updatedAt: Number.isFinite(Number(x.updatedAt)) ? Number(x.updatedAt) : now(),
        } as SavedItem;
      })
      .filter(Boolean) as SavedItem[];

    set({ items: cleaned, loaded: true });
  },

  getByTrip: (tripId: string) => {
    const id = String(tripId ?? "").trim();
    if (!id) return [];
    return get().items.filter((x) => x.tripId === id);
  },

  getByTripAndStatus: (tripId: string, status: SavedItemStatus) => {
    const id = String(tripId ?? "").trim();
    if (!id) return [];
    return get().items.filter((x) => x.tripId === id && x.status === status);
  },

  add: async (args) => {
    const tripId = normalizeTripId(args.tripId);
    const type = args.type;
    const status: SavedItemStatus = args.status ?? "saved";
    const title = String(args.title ?? "").trim();

    if (!title) throw new Error("Saved item title is required");

    const item: SavedItem = {
      id: makeSavedItemId(),
      tripId,
      type,
      status,
      title,
      partnerId: args.partnerId,
      partnerUrl: args.partnerUrl,
      priceText: args.priceText,
      currency: args.currency,
      metadata: args.metadata,
      createdAt: now(),
      updatedAt: now(),
    };

    const next = [item, ...get().items];
    set({ items: next, loaded: true });
    await persist(next);

    return item;
  },

  update: async (id, patch) => {
    const key = String(id ?? "").trim();
    if (!key) return;

    const next = get().items.map((x) => {
      if (x.id !== key) return x;
      return { ...x, ...patch, updatedAt: now() };
    });

    set({ items: next, loaded: true });
    await persist(next);
  },

  transitionStatus: async (id, to) => {
    const key = String(id ?? "").trim();
    if (!key) return;

    const cur = get().items.find((x) => x.id === key);
    if (!cur) return;

    assertTransition(cur.status, to);

    const next = get().items.map((x) => (x.id === key ? { ...x, status: to, updatedAt: now() } : x));
    set({ items: next, loaded: true });
    await persist(next);
  },

  remove: async (id) => {
    const key = String(id ?? "").trim();
    if (!key) return;

    const next = get().items.filter((x) => x.id !== key);
    set({ items: next, loaded: true });
    await persist(next);
  },

  clearTrip: async (tripId) => {
    const id = String(tripId ?? "").trim();
    if (!id) return;

    const next = get().items.filter((x) => x.tripId !== id);
    set({ items: next, loaded: true });
    await persist(next);
  },

  clearAll: async () => {
    set({ items: [], loaded: true });
    await persist([]);
  },
}));

/**
 * tripsStore-style wrapper (keeps your codebase consistent).
 */
const savedItemsStore = {
  getState: useSavedItemsStore.getState,
  setState: useSavedItemsStore.setState,
  subscribe: useSavedItemsStore.subscribe,

  load: async () => {
    await useSavedItemsStore.getState().load();
  },

  getByTrip: (tripId: string) => {
    return useSavedItemsStore.getState().getByTrip(tripId);
  },

  getByTripAndStatus: (tripId: string, status: SavedItemStatus) => {
    return useSavedItemsStore.getState().getByTripAndStatus(tripId, status);
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

  remove: async (id: string) => {
    await useSavedItemsStore.getState().remove(id);
  },

  clearTrip: async (tripId: string) => {
    await useSavedItemsStore.getState().clearTrip(tripId);
  },

  clearAll: async () => {
    await useSavedItemsStore.getState().clearAll();
  },
};

export default savedItemsStore;
export { useSavedItemsStore };
