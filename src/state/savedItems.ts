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

const VALID_TYPES: ReadonlySet<SavedItemType> = new Set<SavedItemType>([
  "tickets",
  "hotel",
  "flight",
  "train",
  "transfer",
  "things",
  "insurance",
  "claim",
  "note",
  "other",
]);

const VALID_STATUSES: ReadonlySet<SavedItemStatus> = new Set<SavedItemStatus>([
  "saved",
  "pending",
  "booked",
  "archived",
]);

function now() {
  return Date.now();
}

async function persist(items: SavedItem[]) {
  // Best-effort persistence lives in persist.ts, but we still keep this async boundary explicit.
  await writeJson(STORAGE_KEY, items);
}

function normalizeTripId(tripId: string) {
  const id = String(tripId ?? "").trim();
  if (!id) throw new Error("tripId is required");
  return id;
}

function isValidType(x: any): x is SavedItemType {
  return typeof x === "string" && VALID_TYPES.has(x as SavedItemType);
}

function isValidStatus(x: any): x is SavedItemStatus {
  return typeof x === "string" && VALID_STATUSES.has(x as SavedItemStatus);
}

function cleanLoadedItem(x: any): SavedItem | null {
  if (!x || typeof x !== "object") return null;

  const id = String((x as any).id ?? "").trim();
  const tripId = String((x as any).tripId ?? "").trim();
  const title = String((x as any).title ?? "").trim();

  const typeRaw = (x as any).type;
  const statusRaw = (x as any).status;

  if (!id || !tripId || !title) return null;
  if (!isValidType(typeRaw)) return null;
  if (!isValidStatus(statusRaw)) return null;

  const createdAt = Number((x as any).createdAt);
  const updatedAt = Number((x as any).updatedAt);

  return {
    id,
    tripId,
    type: typeRaw,
    status: statusRaw,
    title,
    partnerId: typeof (x as any).partnerId === "string" ? (x as any).partnerId : undefined,
    partnerUrl: typeof (x as any).partnerUrl === "string" ? (x as any).partnerUrl : undefined,
    priceText: typeof (x as any).priceText === "string" ? (x as any).priceText : undefined,
    currency: typeof (x as any).currency === "string" ? (x as any).currency : undefined,
    metadata: (x as any).metadata && typeof (x as any).metadata === "object" ? (x as any).metadata : undefined,
    createdAt: Number.isFinite(createdAt) ? createdAt : now(),
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : now(),
  };
}

const useSavedItemsStore = create<SavedItemsState>((set, get) => {
  async function ensureLoaded() {
    if (get().loaded) return;
    await get().load();
  }

  return {
    loaded: false,
    items: [],

    load: async () => {
      // idempotent
      if (get().loaded) return;

      const raw = await readJson<any>(STORAGE_KEY, []);
      const arr = Array.isArray(raw) ? raw : [];

      const cleaned: SavedItem[] = arr.map(cleanLoadedItem).filter(Boolean) as SavedItem[];

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
      await ensureLoaded();

      const tripId = normalizeTripId(args.tripId);
      const type = args.type;
      const status: SavedItemStatus = args.status ?? "saved";
      const title = String(args.title ?? "").trim();

      if (!isValidType(type)) throw new Error("Saved item type is invalid");
      if (!isValidStatus(status)) throw new Error("Saved item status is invalid");
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
      await ensureLoaded();

      const key = String(id ?? "").trim();
      if (!key) return;

      const next = get().items.map((x) => {
        if (x.id !== key) return x;

        // Prevent accidental invalid enum writes via patch
        const nextType = (patch as any).type;
        const nextStatus = (patch as any).status;

        if (nextType !== undefined && !isValidType(nextType)) return x;
        if (nextStatus !== undefined && !isValidStatus(nextStatus)) return x;

        return { ...x, ...patch, updatedAt: now() };
      });

      set({ items: next, loaded: true });
      await persist(next);
    },

    transitionStatus: async (id, to) => {
      await ensureLoaded();

      const key = String(id ?? "").trim();
      if (!key) return;
      if (!isValidStatus(to)) return;

      const cur = get().items.find((x) => x.id === key);
      if (!cur) return;

      assertTransition(cur.status, to);

      const next = get().items.map((x) => (x.id === key ? { ...x, status: to, updatedAt: now() } : x));
      set({ items: next, loaded: true });
      await persist(next);
    },

    remove: async (id) => {
      await ensureLoaded();

      const key = String(id ?? "").trim();
      if (!key) return;

      const next = get().items.filter((x) => x.id !== key);
      set({ items: next, loaded: true });
      await persist(next);
    },

    clearTrip: async (tripId) => {
      await ensureLoaded();

      const id = String(tripId ?? "").trim();
      if (!id) return;

      const next = get().items.filter((x) => x.tripId !== id);
      set({ items: next, loaded: true });
      await persist(next);
    },

    clearAll: async () => {
      await ensureLoaded();

      set({ items: [], loaded: true });
      await persist([]);
    },
  };
});

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
