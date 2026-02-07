// src/state/savedItems.ts
import { create } from "zustand";

import { readJson, writeJson } from "@/src/state/persist";
import { makeSavedItemId } from "@/src/core/id";
import type { SavedItem, SavedItemStatus, SavedItemType, WalletAttachment } from "@/src/core/savedItemTypes";
import { assertTransition } from "@/src/core/savedItemTypes";
import { deleteAttachmentFile } from "@/src/services/walletAttachments";

/* -------------------------------------------------------------------------- */
/* Types */
/* -------------------------------------------------------------------------- */

type ClearOpts = {
  /** Best-effort delete files in app-owned storage */
  deleteAttachmentFiles?: boolean;
};

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
  update: (id: string, patch: Partial<Omit<SavedItem, "id" | "tripId" | "createdAt" | "status">>) => Promise<void>;

  transitionStatus: (id: string, to: SavedItemStatus) => Promise<void>;

  /** Attachments (Phase 1) */
  addAttachment: (itemId: string, att: WalletAttachment) => Promise<void>;
  removeAttachment: (itemId: string, attachmentId: string, opts?: ClearOpts) => Promise<void>;

  remove: (id: string, opts?: ClearOpts) => Promise<void>;
  clearTrip: (tripId: string, opts?: ClearOpts) => Promise<void>;

  clearOrphans: (validTripIds: string[], opts?: ClearOpts) => Promise<void>;
  clearAll: (opts?: ClearOpts) => Promise<void>;
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

const VALID_STATUSES: ReadonlySet<SavedItemStatus> = new Set(["saved", "pending", "booked", "archived"]);

function isValidType(x: any): x is SavedItemType {
  return typeof x === "string" && VALID_TYPES.has(x as SavedItemType);
}

function isValidStatus(x: any): x is SavedItemStatus {
  return typeof x === "string" && VALID_STATUSES.has(x as SavedItemStatus);
}

function now() {
  return Date.now();
}

function isPlainObject(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
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
/* Persistence queue (prevents interleaved writes) */
/* -------------------------------------------------------------------------- */

let writeQueue: Promise<void> = Promise.resolve();

function persistQueued(items: SavedItem[]) {
  // Serialize writes to avoid last-write-wins with stale state.
  writeQueue = writeQueue
    .catch(() => {
      // swallow previous persist errors so queue continues
    })
    .then(() => writeJson(STORAGE_KEY, items));

  return writeQueue;
}

/* -------------------------------------------------------------------------- */

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
    metadata: isPlainObject(x.metadata) ? x.metadata : undefined,
    attachments: attachments.length ? attachments : undefined,
    createdAt: Number.isFinite(createdAt) ? createdAt : now(),
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : now(),
  };
}

/* -------------------------------------------------------------------------- */
/* File deletion helpers */
/* -------------------------------------------------------------------------- */

async function deleteAllAttachmentsForItem(item: SavedItem) {
  const atts = Array.isArray(item.attachments) ? item.attachments : [];
  if (atts.length === 0) return;

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
  // Prevent double-load races
  let loadPromise: Promise<void> | null = null;

  async function ensureLoaded() {
    if (get().loaded) return;
    await get().load();
  }

  function setAndPersist(nextItems: SavedItem[]) {
    const sorted = sortItems(nextItems);
    set({ items: sorted, loaded: true });
    return persistQueued(sorted);
  }

  return {
    loaded: false,
    items: [],

    load: async () => {
      if (get().loaded) return;
      if (loadPromise) return loadPromise;

      loadPromise = (async () => {
        const raw = await readJson<any>(STORAGE_KEY, []);
        const arr = Array.isArray(raw) ? raw : [];
        const cleaned = arr.map(cleanLoadedItem).filter(Boolean) as SavedItem[];
        set({ items: sortItems(cleaned), loaded: true });
      })().finally(() => {
        loadPromise = null;
      });

      return loadPromise;
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
        partnerId: typeof args.partnerId === "string" ? args.partnerId : undefined,
        partnerUrl: typeof args.partnerUrl === "string" ? args.partnerUrl : undefined,
        priceText: typeof args.priceText === "string" ? args.priceText : undefined,
        currency: typeof args.currency === "string" ? args.currency : undefined,
        metadata: isPlainObject(args.metadata) ? args.metadata : undefined,
        attachments: undefined,
        createdAt: now(),
        updatedAt: now(),
      };

      const next = [item, ...get().items];
      await setAndPersist(next);
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

        const nextMeta = (patch as any).metadata;
        const safePatch: any = { ...patch };
        if (nextMeta !== undefined) {
          safePatch.metadata = isPlainObject(nextMeta) ? nextMeta : undefined;
        }

        return {
          ...x,
          ...safePatch,
          updatedAt: now(),
        };
      });

      await setAndPersist(next);
    },

    transitionStatus: async (id, to) => {
      await ensureLoaded();

      const key = String(id ?? "").trim();
      if (!key || !isValidStatus(to)) return;

      const cur = get().items.find((x) => x.id === key);
      if (!cur) return;

      // Throws if invalid transition (that’s good)
      assertTransition(cur.status, to);

      const next = get().items.map((x) => (x.id === key ? { ...x, status: to, updatedAt: now() } : x));
      await setAndPersist(next);
    },

    addAttachment: async (itemId, att) => {
      await ensureLoaded();

      const id = String(itemId ?? "").trim();
      if (!id) return;
      if (!att || typeof att !== "object") throw new Error("Attachment required");

      const next = get().items.map((x) => {
        if (x.id !== id) return x;

        const existing = Array.isArray(x.attachments) ? x.attachments : [];
        const filtered = existing.filter((a) => a.id !== att.id);

        return {
          ...x,
          attachments: [att, ...filtered],
          updatedAt: now(),
        };
      });

      await setAndPersist(next);
    },

    removeAttachment: async (itemId, attachmentId, opts) => {
      await ensureLoaded();

      const id = String(itemId ?? "").trim();
      const aid = String(attachmentId ?? "").trim();
      if (!id || !aid) return;

      const cur = get().items.find((x) => x.id === id);
      const atts = Array.isArray(cur?.attachments) ? cur!.attachments! : [];
      const toDelete = atts.find((a) => a.id === aid);

      const next = get().items.map((x) => {
        if (x.id !== id) return x;

        const existing = Array.isArray(x.attachments) ? x.attachments : [];
        const kept = existing.filter((a) => a.id !== aid);

        return {
          ...x,
          attachments: kept.length ? kept : undefined,
          updatedAt: now(),
        };
      });

      await setAndPersist(next);

      if (opts?.deleteAttachmentFiles && toDelete) {
        try {
          await deleteAttachmentFile(toDelete);
        } catch {
          // best-effort
        }
      }
    },

    remove: async (id, opts) => {
      await ensureLoaded();

      const key = String(id ?? "").trim();
      if (!key) return;

      const cur = get().items.find((x) => x.id === key);
      const next = get().items.filter((x) => x.id !== key);

      await setAndPersist(next);

      if (opts?.deleteAttachmentFiles && cur) {
        await deleteAllAttachmentsForItem(cur);
      }
    },

    clearTrip: async (tripId, opts) => {
      await ensureLoaded();

      const id = String(tripId ?? "").trim();
      if (!id) return;

      const doomed = get().items.filter((x) => x.tripId === id);
      const next = get().items.filter((x) => x.tripId !== id);

      await setAndPersist(next);

      if (opts?.deleteAttachmentFiles) {
        for (const it of doomed) {
          await deleteAllAttachmentsForItem(it);
        }
      }
    },

    clearOrphans: async (validTripIds, opts) => {
      await ensureLoaded();

      const setIds = new Set((validTripIds ?? []).map((x) => String(x).trim()).filter(Boolean));
      const doomed = get().items.filter((x) => !setIds.has(String(x.tripId)));
      const next = get().items.filter((x) => setIds.has(String(x.tripId)));

      await setAndPersist(next);

      if (opts?.deleteAttachmentFiles) {
        for (const it of doomed) {
          await deleteAllAttachmentsForItem(it);
        }
      }
    },

    clearAll: async (opts) => {
      await ensureLoaded();

      const doomed = get().items;
      await setAndPersist([]);

      if (opts?.deleteAttachmentFiles) {
        for (const it of doomed) {
          await deleteAllAttachmentsForItem(it);
        }
      }
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

  removeAttachment: async (itemId: string, attachmentId: string, opts?: ClearOpts) => {
    await useSavedItemsStore.getState().removeAttachment(itemId, attachmentId, opts);
  },

  remove: async (id: string, opts?: ClearOpts) => {
    await useSavedItemsStore.getState().remove(id, opts);
  },

  clearTrip: async (tripId: string, opts?: ClearOpts) => {
    await useSavedItemsStore.getState().clearTrip(tripId, opts);
  },

  clearOrphans: async (validTripIds: string[], opts?: ClearOpts) => {
    await useSavedItemsStore.getState().clearOrphans(validTripIds, opts);
  },

  clearAll: async (opts?: ClearOpts) => {
    await useSavedItemsStore.getState().clearAll(opts);
  },
};

export default savedItemsStore;
export { useSavedItemsStore };
