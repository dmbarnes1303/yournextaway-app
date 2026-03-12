import { create } from "zustand";

import { readJson, writeJson } from "@/src/state/persist";
import { makeId } from "@/src/core/id";
import type {
  SavedItem,
  SavedItemStatus,
  SavedItemType,
  WalletAttachment,
} from "@/src/core/savedItemTypes";
import {
  assertTransition,
  normalizeSavedItemStatus,
  normalizeSavedItemType,
  normalizeWalletAttachmentKind,
} from "@/src/core/savedItemTypes";
import { deleteAttachmentFile } from "@/src/services/walletAttachments";

const STORAGE_KEY = "yna_saved_items_v1";

const VALID_STATUS: ReadonlySet<SavedItemStatus> = new Set(["saved", "pending", "booked", "archived"]);

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

function cleanPositiveNumber(v: unknown): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

function defaultPriceTextForType(type: SavedItemType): string | undefined {
  if (type === "note") return undefined;
  return "View live price";
}

function sortAttachments(items: WalletAttachment[]): WalletAttachment[] {
  const copy = [...items];
  copy.sort((a, b) => (Number(b.createdAt ?? 0) || 0) - (Number(a.createdAt ?? 0) || 0));
  return copy;
}

function normalizeAttachment(raw: any): WalletAttachment | null {
  if (!raw || typeof raw !== "object") return null;

  const id = cleanString(raw.id);
  const uri = cleanString(raw.uri);
  if (!id || !uri) return null;

  const createdAt =
    Number.isFinite(Number(raw.createdAt)) && Number(raw.createdAt) > 0 ? Number(raw.createdAt) : now();

  return {
    id,
    uri,
    kind: normalizeWalletAttachmentKind(raw.kind),
    name: cleanOptionalString(raw.name),
    mimeType: cleanOptionalString(raw.mimeType),
    size: cleanPositiveNumber(raw.size),
    createdAt,
  };
}

function normalizeAttachments(raw: unknown): WalletAttachment[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const seen = new Set<string>();
  const cleaned: WalletAttachment[] = [];

  for (const entry of raw) {
    const attachment = normalizeAttachment(entry);
    if (!attachment) continue;
    if (seen.has(attachment.id)) continue;
    seen.add(attachment.id);
    cleaned.push(attachment);
  }

  if (!cleaned.length) return undefined;
  return sortAttachments(cleaned);
}

function cleanLoadedItem(raw: any): SavedItem | null {
  if (!isPlainObject(raw)) return null;

  const id = cleanString(raw.id);
  const type = normalizeSavedItemType(raw.type);
  const status = normalizeSavedItemStatus(raw.status);

  if (!id) return null;
  if (!type) return null;
  if (!status || !VALID_STATUS.has(status)) return null;

  const createdAt =
    Number.isFinite(Number(raw.createdAt)) && Number(raw.createdAt) > 0 ? Number(raw.createdAt) : now();

  const updatedAt =
    Number.isFinite(Number(raw.updatedAt)) && Number(raw.updatedAt) > 0 ? Number(raw.updatedAt) : createdAt;

  const title = cleanString(raw.title);
  if (!title) return null;

  const priceText =
    typeof raw.priceText === "string" && raw.priceText.trim()
      ? raw.priceText.trim()
      : defaultPriceTextForType(type);

  const item: SavedItem = {
    ...(raw as any),

    id,
    type,
    status,
    title,

    tripId: cleanOptionalString(raw.tripId),

    partnerId: cleanOptionalString(raw.partnerId),
    partnerUrl: cleanOptionalString(raw.partnerUrl),

    priceText,
    currency: cleanOptionalString(raw.currency),

    metadata: isPlainObject(raw.metadata) ? raw.metadata : undefined,
    attachments: normalizeAttachments(raw.attachments),

    createdAt,
    updatedAt,
  };

  return item;
}

async function persistItems(items: SavedItem[]) {
  await writeJson(STORAGE_KEY, items);
}

function sortItems(items: SavedItem[]) {
  const copy = [...items];
  copy.sort((a, b) => {
    const bTime = Number(b.updatedAt ?? 0) || 0;
    const aTime = Number(a.updatedAt ?? 0) || 0;
    return bTime - aTime;
  });
  return copy;
}

function cloneItems(items: SavedItem[]) {
  return items.map((item) => ({
    ...item,
    metadata: item.metadata ? { ...item.metadata } : undefined,
    attachments: item.attachments ? [...item.attachments] : undefined,
  }));
}

async function deleteOwnedFilesForItems(items: SavedItem[]) {
  for (const item of items) {
    const attachments = Array.isArray(item.attachments) ? item.attachments : [];
    for (const att of attachments) {
      try {
        await deleteAttachmentFile(att);
      } catch {
        // best-effort
      }
    }
  }
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

    partnerId?: string;
    partnerUrl?: string;

    priceText?: string;
    currency?: string;

    metadata?: Record<string, any>;
    attachments?: WalletAttachment[];
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

      try {
        await persistItems(sorted);
      } catch {}
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

    const type = normalizeSavedItemType(args.type);
    if (!type) throw new Error("Invalid item type");

    const status = normalizeSavedItemStatus(args.status ?? "saved");
    if (!status || !VALID_STATUS.has(status)) throw new Error("Invalid item status");

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
      partnerId: cleanOptionalString(args.partnerId),
      partnerUrl: cleanOptionalString(args.partnerUrl),
      priceText,
      currency: cleanOptionalString(args.currency),
      metadata: isPlainObject(args.metadata) ? args.metadata : undefined,
      attachments: normalizeAttachments(args.attachments),
      createdAt,
      updatedAt,
    };

    const next = sortItems([item, ...get().items]);
    set({ items: next, loaded: true });

    try {
      await persistItems(next);
    } catch {}

    return item;
  },

  update: async (id, patch) => {
    if (!get().loaded) await get().load();

    const cleanId = cleanString(id);
    if (!cleanId) return;

    let changed = false;

    const next = get().items.map((it) => {
      if (it.id !== cleanId) return it;

      const p: any = { ...(patch as any) };

      if ("tripId" in p) p.tripId = cleanOptionalString(p.tripId);
      if ("title" in p) p.title = cleanString(p.title);

      if ("partnerId" in p) p.partnerId = cleanOptionalString(p.partnerId);
      if ("partnerUrl" in p) p.partnerUrl = cleanOptionalString(p.partnerUrl);

      if ("priceText" in p) p.priceText = cleanOptionalString(p.priceText);
      if ("currency" in p) p.currency = cleanOptionalString(p.currency);

      if ("type" in p) {
        const t = normalizeSavedItemType(p.type);
        if (t) p.type = t;
        else delete p.type;
      }

      if ("status" in p) {
        const s = normalizeSavedItemStatus(p.status);
        if (s && VALID_STATUS.has(s)) p.status = s;
        else delete p.status;
      }

      if ("metadata" in p) {
        p.metadata = isPlainObject(p.metadata) ? p.metadata : undefined;
      }

      if ("attachments" in p) {
        p.attachments = normalizeAttachments(p.attachments);
      }

      if ("title" in p && !p.title) {
        p.title = it.title;
      }

      changed = true;
      return { ...it, ...p, updatedAt: now() } as SavedItem;
    });

    if (!changed) return;

    const sorted = sortItems(next);
    set({ items: sorted, loaded: true });

    try {
      await persistItems(sorted);
    } catch {}
  },

  transitionStatus: async (id, to) => {
    if (!get().loaded) await get().load();

    const cleanId = cleanString(id);
    if (!cleanId) return;

    const target = normalizeSavedItemStatus(to);
    if (!target || !VALID_STATUS.has(target)) throw new Error("Invalid target status");

    const cur = get().items.find((x) => x.id === cleanId);
    if (!cur) return;
    if (cur.status === target) return;

    assertTransition(cur.status, target);
    await get().update(cleanId, { status: target });
  },

  addAttachment: async (id, attachment) => {
    if (!get().loaded) await get().load();

    const cleanId = cleanString(id);
    if (!cleanId) throw new Error("id required");

    const normalized = normalizeAttachment(attachment);
    if (!normalized) throw new Error("Invalid attachment");

    const item = get().items.find((x) => x.id === cleanId);
    if (!item) throw new Error("Saved item not found");

    const current = Array.isArray(item.attachments) ? [...item.attachments] : [];
    const deduped = current.filter((x) => x.id !== normalized.id && x.uri !== normalized.uri);
    const nextAttachments = sortAttachments([...deduped, normalized]);

    await get().update(cleanId, { attachments: nextAttachments });
  },

  removeAttachment: async (id, attachmentId) => {
    if (!get().loaded) await get().load();

    const cleanId = cleanString(id);
    const cleanAttachmentId = cleanString(attachmentId);

    if (!cleanId || !cleanAttachmentId) return;

    const item = get().items.find((x) => x.id === cleanId);
    if (!item) return;

    const current = Array.isArray(item.attachments) ? item.attachments : [];
    const toRemove = current.find((x) => x.id === cleanAttachmentId);
    const nextAttachments = current.filter((x) => x.id !== cleanAttachmentId);

    if (toRemove) {
      try {
        await deleteAttachmentFile(toRemove);
      } catch {
        // best-effort
      }
    }

    await get().update(cleanId, {
      attachments: nextAttachments.length ? nextAttachments : undefined,
    });
  },

  remove: async (id) => {
    if (!get().loaded) await get().load();

    const cleanId = cleanString(id);
    if (!cleanId) return;

    const item = get().items.find((x) => x.id === cleanId);
    if (item) {
      await deleteOwnedFilesForItems([item]);
    }

    const next = get().items.filter((x) => x.id !== cleanId);
    set({ items: next, loaded: true });

    try {
      await persistItems(next);
    } catch {}
  },

  clearAll: async (opts) => {
    const existing = get().items;
    if (opts?.deleteAttachmentFiles) {
      await deleteOwnedFilesForItems(existing);
    }

    set({ items: [], loaded: true });
    try {
      await persistItems([]);
    } catch {}
  },

  clearTrip: async (tripId, opts) => {
    if (!get().loaded) await get().load();

    const t = cleanString(tripId);
    if (!t) return;

    const current = get().items;
    const removed = current.filter((x) => x.tripId === t);
    const next = current.filter((x) => x.tripId !== t);

    if (opts?.deleteAttachmentFiles) {
      await deleteOwnedFilesForItems(removed);
    }

    set({ items: next, loaded: true });

    try {
      await persistItems(next);
    } catch {}
  },

  clearOrphans: async (validTripIds, opts) => {
    if (!get().loaded) await get().load();

    const setIds = new Set((validTripIds ?? []).map((x) => cleanString(x)).filter(Boolean));
    const current = get().items;

    const removed = current.filter((x) => x.tripId && !setIds.has(String(x.tripId)));
    const next = current.filter((x) => !x.tripId || setIds.has(String(x.tripId)));

    if (opts?.deleteAttachmentFiles) {
      await deleteOwnedFilesForItems(removed);
    }

    set({ items: next, loaded: true });

    try {
      await persistItems(next);
    } catch {}
  },
}));

function cleanOptionalString2(v: unknown) {
  const s = cleanString(v);
  return s ? s : undefined;
}

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

  getAll: () => {
    const s = useSavedItemsStore.getState();
    return cloneItems(s.items);
  },

  getById: (id?: string) => {
    const cleanId = cleanOptionalString2(id);
    if (!cleanId) return undefined;

    const s = useSavedItemsStore.getState();
    const item = s.items.find((x) => x.id === cleanId);
    if (!item) return undefined;

    return {
      ...item,
      metadata: item.metadata ? { ...item.metadata } : undefined,
      attachments: item.attachments ? [...item.attachments] : undefined,
    };
  },

  getByTripId: (tripId?: string) => {
    const t = cleanOptionalString2(tripId);
    const s = useSavedItemsStore.getState();
    if (!t) return [];

    return s.items
      .filter((x) => x.tripId === t)
      .map((item) => ({
        ...item,
        metadata: item.metadata ? { ...item.metadata } : undefined,
        attachments: item.attachments ? [...item.attachments] : undefined,
      }));
  },
};

export default savedItemsStore;
export { useSavedItemsStore };
