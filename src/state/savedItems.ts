// src/state/savedItems.ts
import { create } from "zustand";

import { readJson, writeJson } from "@/src/state/persist";
import { makeSavedItemId } from "@/src/core/id";
import type {
  SavedItem,
  SavedItemStatus,
  SavedItemType,
  WalletAttachment,
} from "@/src/core/savedItemTypes";
import { assertTransition } from "@/src/core/savedItemTypes";

/* -------------------------------------------------------------------------- */
/* Types */
/* -------------------------------------------------------------------------- */

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

  /** Field updates ONLY (status changes must use transitionStatus) */
  update: (
    id: string,
    patch: Partial<Omit<SavedItem, "id" | "tripId" | "createdAt" | "status">>
  ) => Promise<void>;

  transitionStatus: (id: string, to: SavedItemStatus) => Promise<void>;

  /** Attachments */
  addAttachment: (itemId: string, att: WalletAttachment) => Promise<void>;
  removeAttachment: (itemId: string, attachmentId: string) => Promise<void>;
  clearAttachments: (itemId: string) => Promise<void>;

  remove: (id: string) => Promise<void>;
  clearTrip: (tripId: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "yna_saved_items_v1";

/* -------------------------------------------------------------------------- */
/* Validation */
/* -------------------------------------------------------------------------- */

const VALID_TYPES: ReadonlySet<SavedItemType> = new Set([
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

const VALID_STATUSES: ReadonlySet<SavedItemStatus> = new Set([
  "saved",
  "pending",
  "booked",
  "archived",
]);

function isValidType(x: any): x is SavedItemType {
  return typeof x === "string" && VALID_TYPES.has(x as SavedItemType);
}

function isValidStatus(x: any): x is SavedItemStatus {
  return typeof x === "string" && VALID_STATUSES.has(x as SavedItemStatus);
}

function now() {
  return Date.now();
}

/* -------------------------------------------------------------------------- */
/* Ordering */
/* -------------------------------------------------------------------------- */

function statusOrder(s: SavedItemStatus): number {
  if (s === "pending") return 0;
  if (s === "saved") return 1;
  if (s === "booked") return 2;
  return 3; // archived
}

function sortItems(items: SavedItem[]): SavedItem[] {
  const copy = [...items];
  copy.sort((a, b) => {
    const so = statusOrder(a.status) - statusOrder(b.status);
    if (so !== 0) return so;
    return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
  });
  return copy;
}

/* -------------------------------------------------------------------------- */

async function persist(items: SavedItem[]) {
  await writeJson(STORAGE_KEY, items);
}

function normalizeTripId(tripId: string) {
  const id = String(tripId ?? "").trim();
  if (!id) throw new Error("tripId is required");
  return id;
}

/* -------------------------------------------------------------------------- */
/* Attachments normalisation */
/* -------------------------------------------------------------------------- */

function cleanAttachment(x: any): WalletAttachment | null {
  if (!x || typeof x !== "object") return null;

  const id = String(x.id ?? "").trim();
  const uri = String(x.uri ?? "").trim();
  const kind = String(x.kind ?? "").trim();

  if (!id || !uri) return null;

  const safeKind =
    kind === "image" || kind === "pdf" || kind === "file" ? (kind as any) : "file";

  const createdAt = Number(x.createdAt);
  return {
    id,
    uri,
    kind: safeKind,
    name: typeof x.name === "string" ? x.name : undefined,
    mimeType: typeof x.mimeType === "string" ? x.mimeType : undefined,
    size: Number.isFinite(Number(x.size)) ? Number(x.size) : undefined,
    createdAt: Number.isFinite(createdAt) ? createdAt : now(),
  };
}

/* -------------------------------------------------------------------------- */
/* Normalisation */
/* -------------------------------------------------------------------------- */

function cleanLoadedItem(x: any): SavedItem | null {
  if (!x || typeof x !== "object") return null;

  const id = String(x.id ?? "").trim();
  const tripId = String(x.tripId ?? "").trim();
  const title = String(x.title ?? "").trim();
  const type = x.type;
  const status = x.status;

  if (!id || !tripId || !title) return null;
  if (!isValidType(type)) return null;
  if (!isValidStatus(status)) return null;

  const createdAt = Number(x.createdAt);
  const updatedAt = Number(x.updatedAt);

  const attachmentsRaw = Array.isArray(x.attachments) ? x.attachments : [];
  const attachments = attachmentsRaw.map(cleanAttachment).filter(Boolean) as WalletAttachment[];

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
    metadata: typeof x.metadata === "object" ? x.metadata : undefined,
    attachments,
    createdAt: Number.isFinite(createdAt) ? createdAt : now(),
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : now(),
  };
}

/* -------------------------------------------------------------------------- */
/* Store */
/* -------------------------------------------------------------------------- */

const useSavedItemsStore = create<SavedItemsState>((set, get) => {
  async function ensureLoaded() {
    if (get().loaded) return;
    await get().load();
  }

  return {
    loaded: false,
    items: [],

    load: async () => {
      if (get().loaded) return;

      const raw = await readJson<any>(STORAGE_KEY, []);
      const arr = Array.isArray(raw) ? raw : [];

      const cleaned = arr.map(cleanLoadedItem).filter(Boolean) as SavedItem[];
      set({ items: sortItems(cleaned), loaded: true });
    },

    getByTrip: (tripId) => {
      const id = String(tripId ?? "").trim();
      if (!id) return [];
      return get().items.filter((x) => x.tripId === id);
    },

    getByTripAndStatus: (tripId, status) => {
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

      if (!isValidType(type)) throw new Error("Invalid saved item type");
      if (!isValidStatus(status)) throw new Error("Invalid saved item status");
      if (!title) throw new Error("Title required");

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
        attachments: [],
        createdAt: now(),
        updatedAt: now(),
      };

      const next = sortItems([item, ...get().items]);
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

        const nextType = (patch as any).type;
        if (nextType !== undefined && !isValidType(nextType)) return x;

        const nextAttachments = (patch as any).attachments;
        if (nextAttachments !== undefined && !Array.isArray(nextAttachments)) return x;

        return {
          ...x,
          ...patch,
          updatedAt: now(),
        };
      });

      const sorted = sortItems(next);
      set({ items: sorted, loaded: true });
      await persist(sorted);
    },

    transitionStatus: async (id, to) => {
      await ensureLoaded();

      const key = String(id ?? "").trim();
      if (!key || !isValidStatus(to)) return;

      const cur = get().items.find((x) => x.id === key);
      if (!cur) return;

      assertTransition(cur.status, to);

      const next = get().items.map((x) =>
        x.id === key ? { ...x, status: to, updatedAt: now() } : x
      );

      const sorted = sortItems(next);
      set({ items: sorted, loaded: true });
      await persist(sorted);
    },

    addAttachment: async (itemId, att) => {
      await ensureLoaded();

      const id = String(itemId ?? "").trim();
      if (!id) return;

      const next = get().items.map((x) => {
        if (x.id !== id) return x;

        const existing = Array.isArray(x.attachments) ? x.attachments : [];
        const withoutDup = existing.filter((a) => a.id !== att.id);

        return {
          ...x,
          attachments: [att, ...withoutDup],
          updatedAt: now(),
        };
      });

      const sorted = sortItems(next);
      set({ items: sorted, loaded: true });
      await persist(sorted);
    },

    removeAttachment: async (itemId, attachmentId) => {
      await ensureLoaded();

      const id = String(itemId ?? "").trim();
      const aid = String(attachmentId ?? "").trim();
      if (!id || !aid) return;

      const next = get().items.map((x) => {
        if (x.id !== id) return x;
        const existing = Array.isArray(x.attachments) ? x.attachments : [];
        return {
          ...x,
          attachments: existing.filter((a) => a.id !== aid),
          updatedAt: now(),
        };
      });

      const sorted = sortItems(next);
      set({ items: sorted, loaded: true });
      await persist(sorted);
    },

    clearAttachments: async (itemId) => {
      await ensureLoaded();

      const id = String(itemId ?? "").trim();
      if (!id) return;

      const next = get().items.map((x) => (x.id === id ? { ...x, attachments: [], updatedAt: now() } : x));
      const sorted = sortItems(next);
      set({ items: sorted, loaded: true });
      await persist(sorted);
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

/* -------------------------------------------------------------------------- */
/* Wrapper (matches tripsStore pattern) */
/* -------------------------------------------------------------------------- */

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

  addAttachment: async (itemId: string, att: WalletAttachment) => {
    await useSavedItemsStore.getState().addAttachment(itemId, att);
  },

  removeAttachment: async (itemId: string, attachmentId: string) => {
    await useSavedItemsStore.getState().removeAttachment(itemId, attachmentId);
  },

  clearAttachments: async (itemId: string) => {
    await useSavedItemsStore.getState().clearAttachments(itemId);
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
