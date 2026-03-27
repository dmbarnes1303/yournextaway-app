import { create } from "zustand";

import { readJson, writeJson } from "@/src/state/persist";
import { makeSavedItemId } from "@/src/core/id";
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

const VALID_STATUS: ReadonlySet<SavedItemStatus> = new Set([
  "saved",
  "pending",
  "booked",
  "archived",
]);

function now(): number {
  return Date.now();
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function cleanOptionalString(value: unknown): string | undefined {
  const next = cleanString(value);
  return next || undefined;
}

function cleanPositiveNumber(value: unknown): number | undefined {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

function safeUrl(value: unknown): string | undefined {
  const raw = cleanString(value);
  if (!raw) return undefined;

  try {
    const parsed = new URL(raw);
    if (!/^https?:$/i.test(parsed.protocol)) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function defaultPriceTextForItem(args: {
  type: SavedItemType;
  status: SavedItemStatus;
  incoming?: unknown;
}): string | undefined {
  const explicit = cleanOptionalString(args.incoming);
  if (explicit) return explicit;

  if (args.type === "note") return undefined;
  if (args.status === "booked") return undefined;

  return "View live price";
}

function sortAttachments(items: WalletAttachment[]): WalletAttachment[] {
  return [...items].sort((a, b) => {
    const bTime = Number(b.createdAt ?? 0) || 0;
    const aTime = Number(a.createdAt ?? 0) || 0;
    return bTime - aTime;
  });
}

function normalizeAttachment(raw: unknown): WalletAttachment | null {
  if (!isPlainObject(raw)) return null;

  const id = cleanString(raw.id);
  const uri = cleanString(raw.uri);
  if (!id || !uri) return null;

  const createdAt =
    Number.isFinite(Number(raw.createdAt)) && Number(raw.createdAt) > 0
      ? Number(raw.createdAt)
      : now();

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
  const out: WalletAttachment[] = [];

  for (const entry of raw) {
    const next = normalizeAttachment(entry);
    if (!next) continue;
    if (seen.has(next.id)) continue;
    seen.add(next.id);
    out.push(next);
  }

  if (out.length === 0) return undefined;
  return sortAttachments(out);
}

function cloneItem(item: SavedItem): SavedItem {
  return {
    ...item,
    metadata: item.metadata ? { ...item.metadata } : undefined,
    attachments: item.attachments ? [...item.attachments] : undefined,
  };
}

function cloneItems(items: SavedItem[]): SavedItem[] {
  return items.map(cloneItem);
}

function sortItems(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => {
    const bTime = Number(b.updatedAt ?? 0) || 0;
    const aTime = Number(a.updatedAt ?? 0) || 0;
    return bTime - aTime;
  });
}

function cleanLoadedItem(raw: unknown): SavedItem | null {
  if (!isPlainObject(raw)) return null;

  const id = cleanString(raw.id);
  const type = normalizeSavedItemType(raw.type);
  const status = normalizeSavedItemStatus(raw.status);

  if (!id || !type || !status || !VALID_STATUS.has(status)) return null;

  const title = cleanString(raw.title);
  if (!title) return null;

  const createdAt =
    Number.isFinite(Number(raw.createdAt)) && Number(raw.createdAt) > 0
      ? Number(raw.createdAt)
      : now();

  const updatedAt =
    Number.isFinite(Number(raw.updatedAt)) && Number(raw.updatedAt) > 0
      ? Number(raw.updatedAt)
      : createdAt;

  return {
    ...(raw as SavedItem),
    id,
    type,
    status,
    title,
    tripId: cleanOptionalString(raw.tripId),
    partnerId: cleanOptionalString(raw.partnerId),
    partnerUrl: safeUrl(raw.partnerUrl),
    priceText: defaultPriceTextForItem({
      type,
      status,
      incoming: raw.priceText,
    }),
    currency: cleanOptionalString(raw.currency),
    metadata: isPlainObject(raw.metadata) ? raw.metadata : undefined,
    attachments: normalizeAttachments(raw.attachments),
    createdAt,
    updatedAt,
  };
}

async function persistItems(items: SavedItem[]) {
  await writeJson(STORAGE_KEY, items);
}

async function deleteOwnedFilesForItems(items: SavedItem[]) {
  for (const item of items) {
    const attachments = Array.isArray(item.attachments) ? item.attachments : [];
    for (const attachment of attachments) {
      try {
        await deleteAttachmentFile(attachment);
      } catch {
        // best-effort only
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
      const raw = await readJson<unknown>(STORAGE_KEY, []);
      const arr = Array.isArray(raw) ? raw : [];
      const cleaned = arr
        .map(cleanLoadedItem)
        .filter((item): item is SavedItem => item !== null);

      const sorted = sortItems(cleaned);

      set({
        items: sorted,
        loaded: true,
      });

      try {
        await persistItems(sorted);
      } catch {
        // best-effort only
      }
    })()
      .catch(() => {
        set({
          items: [],
          loaded: true,
        });
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

    const item: SavedItem = {
      id: makeSavedItemId(),
      tripId: cleanOptionalString(args.tripId),
      type,
      status,
      title,
      partnerId: cleanOptionalString(args.partnerId),
      partnerUrl: safeUrl(args.partnerUrl),
      priceText: defaultPriceTextForItem({
        type,
        status,
        incoming: args.priceText,
      }),
      currency: cleanOptionalString(args.currency),
      metadata: isPlainObject(args.metadata) ? args.metadata : undefined,
      attachments: normalizeAttachments(args.attachments),
      createdAt,
      updatedAt,
    };

    const next = sortItems([item, ...get().items]);

    set({
      items: next,
      loaded: true,
    });

    try {
      await persistItems(next);
    } catch {
      // best-effort only
    }

    return cloneItem(item);
  },

  update: async (id, patch) => {
    if (!get().loaded) await get().load();

    const cleanId = cleanString(id);
    if (!cleanId) return;

    let didChange = false;

    const next = get().items.map((item) => {
      if (item.id !== cleanId) return item;

      const p: Record<string, unknown> = { ...(patch as Record<string, unknown>) };

      if ("tripId" in p) p.tripId = cleanOptionalString(p.tripId);
      if ("title" in p) p.title = cleanString(p.title) || item.title;
      if ("partnerId" in p) p.partnerId = cleanOptionalString(p.partnerId);
      if ("partnerUrl" in p) p.partnerUrl = safeUrl(p.partnerUrl);
      if ("priceText" in p) {
        p.priceText = defaultPriceTextForItem({
          type: ("type" in p && normalizeSavedItemType(p.type)) || item.type,
          status: ("status" in p && normalizeSavedItemStatus(p.status)) || item.status,
          incoming: p.priceText,
        });
      }
      if ("currency" in p) p.currency = cleanOptionalString(p.currency);

      if ("type" in p) {
        const nextType = normalizeSavedItemType(p.type);
        if (nextType) p.type = nextType;
        else delete p.type;
      }

      if ("status" in p) {
        const nextStatus = normalizeSavedItemStatus(p.status);
        if (nextStatus && VALID_STATUS.has(nextStatus)) p.status = nextStatus;
        else delete p.status;
      }

      if ("metadata" in p) {
        p.metadata = isPlainObject(p.metadata) ? p.metadata : undefined;
      }

      if ("attachments" in p) {
        p.attachments = normalizeAttachments(p.attachments);
      }

      didChange = true;

      return {
        ...item,
        ...p,
        updatedAt: now(),
      } as SavedItem;
    });

    if (!didChange) return;

    const sorted = sortItems(next);

    set({
      items: sorted,
      loaded: true,
    });

    try {
      await persistItems(sorted);
    } catch {
      // best-effort only
    }
  },

  transitionStatus: async (id, to) => {
    if (!get().loaded) await get().load();

    const cleanId = cleanString(id);
    if (!cleanId) return;

    const target = normalizeSavedItemStatus(to);
    if (!target || !VALID_STATUS.has(target)) {
      throw new Error("Invalid target status");
    }

    const current = get().items.find((x) => x.id === cleanId);
    if (!current) return;
    if (current.status === target) return;

    assertTransition(current.status, target);

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
    const deduped = current.filter(
      (x) => x.id !== normalized.id && x.uri !== normalized.uri
    );

    await get().update(cleanId, {
      attachments: sortAttachments([...deduped, normalized]),
    });
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
        // best-effort only
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

    const current = get().items;
    const item = current.find((x) => x.id === cleanId);
    if (item) {
      await deleteOwnedFilesForItems([item]);
    }

    const next = current.filter((x) => x.id !== cleanId);

    set({
      items: next,
      loaded: true,
    });

    try {
      await persistItems(next);
    } catch {
      // best-effort only
    }
  },

  clearAll: async (opts) => {
    if (!get().loaded) await get().load();

    const existing = get().items;

    if (opts?.deleteAttachmentFiles) {
      await deleteOwnedFilesForItems(existing);
    }

    set({
      items: [],
      loaded: true,
    });

    try {
      await persistItems([]);
    } catch {
      // best-effort only
    }
  },

  clearTrip: async (tripId, opts) => {
    if (!get().loaded) await get().load();

    const tripKey = cleanString(tripId);
    if (!tripKey) return;

    const current = get().items;
    const removed = current.filter((x) => x.tripId === tripKey);
    const next = current.filter((x) => x.tripId !== tripKey);

    if (opts?.deleteAttachmentFiles) {
      await deleteOwnedFilesForItems(removed);
    }

    set({
      items: next,
      loaded: true,
    });

    try {
      await persistItems(next);
    } catch {
      // best-effort only
    }
  },

  clearOrphans: async (validTripIds, opts) => {
    if (!get().loaded) await get().load();

    const validIds = new Set(
      (validTripIds ?? []).map((x) => cleanString(x)).filter(Boolean)
    );

    const current = get().items;

    const removed = current.filter(
      (x) => x.tripId && !validIds.has(cleanString(x.tripId))
    );

    const next = current.filter(
      (x) => !x.tripId || validIds.has(cleanString(x.tripId))
    );

    if (opts?.deleteAttachmentFiles) {
      await deleteOwnedFilesForItems(removed);
    }

    set({
      items: next,
      loaded: true,
    });

    try {
      await persistItems(next);
    } catch {
      // best-effort only
    }
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

  clearOrphans: async (
    validTripIds: string[],
    opts?: { deleteAttachmentFiles?: boolean }
  ) => {
    await useSavedItemsStore.getState().clearOrphans(validTripIds, opts);
  },

  getAll: () => {
    return cloneItems(useSavedItemsStore.getState().items);
  },

  getById: (id?: string) => {
    const cleanId = cleanOptionalString(id);
    if (!cleanId) return undefined;

    const item = useSavedItemsStore.getState().items.find((x) => x.id === cleanId);
    return item ? cloneItem(item) : undefined;
  },

  getByTripId: (tripId?: string) => {
    const cleanTripId = cleanOptionalString(tripId);
    if (!cleanTripId) return [];

    return useSavedItemsStore
      .getState()
      .items
      .filter((x) => x.tripId === cleanTripId)
      .map(cloneItem);
  },
};

export default savedItemsStore;
export { useSavedItemsStore };
