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
import { deleteAttachmentFile } from "@/src/services/walletAttachments";

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

  /** Attachments (Phase 1) */
  addAttachment: (itemId: string, att: WalletAttachment) => Promise<void>;
  removeAttachment: (itemId: string, attachmentId: string) => Promise<void>;

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
/* Attachments normalization */
/* -------------------------------------------------------------------------- */

function cleanAttachment(x: any): WalletAttachment | null {
  if (!x || typeof x !== "object") return null;

  const id = String(x.id ?? "").trim();
  const uri = String(x.uri ?? "").trim();
  const kind = String(x.kind ?? "").trim();

  if (!id || !uri) return null;
  if (kind !== "pdf" && kind !== "image" && kind !== "file") return null;

  const createdAt = Number(x.createdAt);
  return {
    id,
    uri,
    kind: kind as any,
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

  const attsRaw = Array.isArray(x.attachments) ? x.attachments : [];
  const attachments = attsRaw.map(cleanAttachment).filter(Boolean) as WalletAttachment[];

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
    attachments: attachments.length ? attachments : undefined,
    createdAt: Number.isFinite(createdAt) ? createdAt : now(),
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : now(),
  };
}

/* -------------------------------------------------------------------------- */
/* Attachment file deletion (best-effort) */
/* -------------------------------------------------------------------------- */

async function tryDeleteFiles(atts: WalletAttachment[]) {
  for (const a of atts) {
    try {
      await deleteAttachmentFile(a);
    } catch {
      // best-effort
    }
  }
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
        attachments: undefined,
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

        // do NOT allow status changes here
        if ((patch as any).status !== undefined) return x;

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
      if (!att || typeof att !== "object") throw new Error("Attachment required");

      const next = get().items.map((x) => {
        if (x.id !== id) return x;

        const existing = Array.isArray(x.attachments) ? x.attachments : [];
        // prevent dup ids
        const filtered = existing.filter((a) => a.id !== att.id);

        return {
          ...x,
          attachments: [att, ...filtered],
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

      // delete file first (best-effort), then remove metadata
      const cur = get().items.find((x) => x.id === id);
      const existing = Array.isArray(cur?.attachments) ? (cur!.attachments as WalletAttachment[]) : [];
      const target = existing.find((a) => a.id === aid);
      if (target) {
        await tryDeleteFiles([target]);
      }

      const next = get().items.map((x) => {
        if (x.id !== id) return x;

        const ex = Array.isArray(x.attachments) ? x.attachments : [];
        const kept = ex.filter((a) => a.id !== aid);

        return {
          ...x,
          attachments: kept.length ? kept : undefined,
          updatedAt: now(),
        };
      });

      const sorted = sortItems(next);
      set({ items: sorted, loaded: true });
      await persist(sorted);
    },

    remove: async (id) => {
      await ensureLoaded();

      const key = String(id ?? "").trim();
      if (!key) return;

      // if removing an item entirely, delete any attachments too
      const cur = get().items.find((x) => x.id === key);
      const atts = Array.isArray(cur?.attachments) ? (cur!.attachments as WalletAttachment[]) : [];
      if (atts.length) await tryDeleteFiles(atts);

      const next = get().items.filter((x) => x.id !== key);
      set({ items: next, loaded: true });
      await persist(next);
    },

    clearTrip: async (tripId) => {
      await ensureLoaded();

      const id = String(tripId ?? "").trim();
      if (!id) return;

      // delete all attachments for items in this trip
      const tripItems = get().items.filter((x) => x.tripId === id);
      const allAtts: WalletAttachment[] = [];
      for (const it of tripItems) {
        const atts = Array.isArray(it.attachments) ? it.attachments : [];
        allAtts.push(...atts);
      }
      if (allAtts.length) await tryDeleteFiles(allAtts);

      const next = get().items.filter((x) => x.tripId !== id);
      set({ items: next, loaded: true });
      await persist(next);
    },

    clearAll: async () => {
      await ensureLoaded();

      // delete everything we can
      const allAtts: WalletAttachment[] = [];
      for (const it of get().items) {
        const atts = Array.isArray(it.attachments) ? it.attachments : [];
        allAtts.push(...atts);
      }
      if (allAtts.length) await tryDeleteFiles(allAtts);

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
