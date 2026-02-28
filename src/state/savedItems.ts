// src/state/savedItems.ts
import { create } from "zustand";

import { readJson, writeJson } from "@/src/state/persist";
import { makeId } from "@/src/core/id";
import type { SavedItem, SavedItemStatus, SavedItemType } from "@/src/core/savedItemTypes";

const STORAGE_KEY = "yna_saved_items_v1";

const VALID_TYPES: ReadonlySet<SavedItemType> = new Set([
  "tickets",
  "stay",
  "flight",
  "train",
  "transfer",
  "things",
  "insurance",
  "claim",
  "note",
  "other",
]);

const VALID_STATUS: ReadonlySet<SavedItemStatus> = new Set(["saved", "pending", "booked"]);

function now() {
  return Date.now();
}

function isPlainObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function cleanString(v: unknown) {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function cleanOptionalString(v: unknown) {
  const s = cleanString(v);
  return s ? s : undefined;
}

function cleanOptionalNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function defaultPriceTextForType(type: SavedItemType): string | undefined {
  // Notes are not “priced”. Everything else shows a consistent CTA-style label.
  if (type === "note") return undefined;
  return "View live price";
}

function cleanLoadedItem(raw: any): SavedItem | null {
  if (!isPlainObject(raw)) return null;

  const id = cleanString(raw.id);
  const type = cleanString(raw.type) as SavedItemType;
  const status = cleanString(raw.status) as SavedItemStatus;

  if (!id) return null;
  if (!VALID_TYPES.has(type)) return null;
  if (!VALID_STATUS.has(status)) return null;

  const createdAt =
    Number.isFinite(Number(raw.createdAt)) && Number(raw.createdAt) > 0 ? Number(raw.createdAt) : now();

  const updatedAt =
    Number.isFinite(Number(raw.updatedAt)) && Number(raw.updatedAt) > 0 ? Number(raw.updatedAt) : createdAt;

  // Backfill: if there is no explicit priceText stored, we still show a consistent
  // “price row” label in UI (unless note).
  const priceText =
    typeof raw.priceText === "string" && raw.priceText.trim()
      ? raw.priceText.trim()
      : defaultPriceTextForType(type);

  const item: SavedItem = {
    // start from raw to preserve unknown metadata fields
    ...(raw as any),

    id,
    type,
    status,

    tripId: cleanOptionalString(raw.tripId),

    title: cleanString(raw.title),
    subtitle: cleanOptionalString(raw.subtitle),

    partnerId: cleanOptionalString(raw.partnerId),
    partnerUrl: cleanOptionalString(raw.partnerUrl),

    priceText,
    currency: cleanOptionalString(raw.currency),

    metadata: isPlainObject(raw.metadata) ? raw.metadata : undefined,

    createdAt,
    updatedAt,
  };

  if (!item.title) return null;

  return item;
}

async function persistItems(items: SavedItem[]) {
  await writeJson(STORAGE_KEY, items);
}

function sortItems(items: SavedItem[]) {
  const copy = [...items];
  copy.sort((a, b) => (Number(b.updatedAt ?? 0) || 0) - (Number(a.updatedAt ?? 0) || 0));
  return copy;
}

type SavedItemsState = {
  loaded: boolean;
  items: SavedItem[];

  load: () => Promise<void>;

  add: (args: {
    tripId?: string;
    type: SavedItemType;
    status?: SavedItemStatus;
    title: string;
    subtitle?: string;

    partnerId?: string;
    partnerUrl?: string;

    priceText?: string;
    currency?: string;

    metadata?: Record<string, any>;
  }) => Promise<SavedItem>;

  update: (id: string, patch: Partial<Omit<SavedItem, "id" | "createdAt">>) => Promise<void>;

  remove: (id: string) => Promise<void>;

  clearAll: (opts?: { deleteAttachmentFiles?: boolean }) => Promise<void>;

  clearTrip: (tripId: string, opts?: { deleteAttachmentFiles?: boolean }) => Promise<void>;

  clearOrphans: (validTripIds: string[], opts?: { deleteAttachmentFiles?: boolean }) => Promise<void>;
};

let inflightLoad: Promise<void> | null = null;

const useSavedItemsStore = create<SavedItemsState>((set, get) => ({
  loaded: false,
  items: [],

  load: async () => {
    if (get().loaded) return;
    if (inflightLoad) return inflightLoad;

    inflightLoad = (async () => {
      const raw = await readJson<any>(STORAGE_KEY, []);
      const arr = Array.isArray(raw) ? raw : [];
      const cleaned = arr.map(cleanLoadedItem).filter(Boolean) as SavedItem[];
      const sorted = sortItems(cleaned);

      set({ items: sorted, loaded: true });
    })()
      .catch(() => {
        set({ items: [], loaded: true });
      })
      .finally(() => {
        inflightLoad = null;
      });

    return inflightLoad;
  },

  add: async (args) => {
    if (!get().loaded) await get().load();

    const type = cleanString(args.type) as SavedItemType;
    if (!VALID_TYPES.has(type)) throw new Error("Invalid item type");

    const status = (cleanString(args.status ?? "saved") as SavedItemStatus) || "saved";
    if (!VALID_STATUS.has(status)) throw new Error("Invalid item status");

    const title = cleanString(args.title);
    if (!title) throw new Error("title required");

    const createdAt = now();
    const updatedAt = createdAt;

    const priceText =
      typeof args.priceText === "string" && args.priceText.trim()
        ? args.priceText.trim()
        : defaultPriceTextForType(type);

    const item: SavedItem = {
      id: makeId(),

      tripId: cleanOptionalString(args.tripId),

      type,
      status,

      title,
      subtitle: cleanOptionalString(args.subtitle),

      partnerId: cleanOptionalString(args.partnerId),
      partnerUrl: cleanOptionalString(args.partnerUrl),

      priceText,
      currency: cleanOptionalString(args.currency),

      metadata: isPlainObject(args.metadata) ? args.metadata : undefined,

      createdAt,
      updatedAt,
    };

    const next = sortItems([item, ...get().items]);
    set({ items: next, loaded: true });

    try {
      await persistItems(next);
    } catch {
      // best-effort
    }

    return item;
  },

  update: async (id, patch) => {
    if (!get().loaded) await get().load();

    const cleanId = cleanString(id);
    if (!cleanId) return;

    const next = get().items.map((it) => {
      if (it.id !== cleanId) return it;

      const p: any = { ...(patch as any) };

      if ("tripId" in p) p.tripId = cleanOptionalString(p.tripId);

      if ("title" in p) p.title = cleanString(p.title);
      if ("subtitle" in p) p.subtitle = cleanOptionalString(p.subtitle);

      if ("partnerId" in p) p.partnerId = cleanOptionalString(p.partnerId);
      if ("partnerUrl" in p) p.partnerUrl = cleanOptionalString(p.partnerUrl);

      if ("priceText" in p) p.priceText = cleanOptionalString(p.priceText);
      if ("currency" in p) p.currency = cleanOptionalString(p.currency);

      if ("type" in p) {
        const t = cleanString(p.type) as SavedItemType;
        if (VALID_TYPES.has(t)) p.type = t;
        else delete p.type;
      }

      if ("status" in p) {
        const s = cleanString(p.status) as SavedItemStatus;
        if (VALID_STATUS.has(s)) p.status = s;
        else delete p.status;
      }

      if ("metadata" in p) {
        p.metadata = isPlainObject(p.metadata) ? p.metadata : undefined;
      }

      // IMPORTANT:
      // If priceText was cleared/undefined, we do NOT auto-reinfer here.
      // Inference is applied on load and on add. Update respects explicit edits.
      return { ...(it as any), ...p, updatedAt: now() } as SavedItem;
    });

    const sorted = sortItems(next);
    set({ items: sorted, loaded: true });

    try {
      await persistItems(sorted);
    } catch {
      // best-effort
    }
  },

  remove: async (id) => {
    if (!get().loaded) await get().load();
    const cleanId = cleanString(id);
    if (!cleanId) return;

    const next = get().items.filter((x) => x.id !== cleanId);
    set({ items: next, loaded: true });

    try {
      await persistItems(next);
    } catch {}
  },

  clearAll: async () => {
    set({ items: [], loaded: true });
    try {
      await persistItems([]);
    } catch {}
  },

  clearTrip: async (tripId) => {
    if (!get().loaded) await get().load();
    const t = cleanString(tripId);
    if (!t) return;

    const next = get().items.filter((x) => x.tripId !== t);
    set({ items: next, loaded: true });

    try {
      await persistItems(next);
    } catch {}
  },

  clearOrphans: async (validTripIds) => {
    if (!get().loaded) await get().load();

    const setIds = new Set((validTripIds ?? []).map((x) => cleanString(x)).filter(Boolean));
    const next = get().items.filter((x) => !x.tripId || setIds.has(String(x.tripId)));

    set({ items: next, loaded: true });

    try {
      await persistItems(next);
    } catch {}
  },
}));

/* -------------------------------------------------------------------------- */
/* Wrapper */
/* -------------------------------------------------------------------------- */

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

  getByTripId: (tripId?: string) => {
    const t = cleanOptionalString(tripId);
    const s = useSavedItemsStore.getState();
    if (!t) return [];
    return s.items.filter((x) => x.tripId === t);
  },
};

export default savedItemsStore;
export { useSavedItemsStore };
