// src/state/walletStore.ts
import { create } from "zustand";
import storage from "@/src/services/storage";
import type { WalletItem, Id } from "@/src/core/tripTypes";

const KEY = "yna_wallet_v1";

function now() {
  return Date.now();
}

function newId(prefix = "w"): Id {
  return `${prefix}_${now()}_${Math.random().toString(16).slice(2)}`;
}

function cleanItem(x: any): WalletItem | null {
  if (!x || typeof x !== "object") return null;

  const id = String(x.id ?? "").trim();
  const title = String(x.title ?? "").trim();
  const type = String(x.type ?? "").trim();

  if (!id || !title) return null;
  if (type !== "text" && type !== "link") return null;

  const tripId = x.tripId != null ? String(x.tripId).trim() : undefined;

  const createdAt = Number.isFinite(Number(x.createdAt)) ? Number(x.createdAt) : now();
  const updatedAt = Number.isFinite(Number(x.updatedAt)) ? Number(x.updatedAt) : createdAt;

  const out: WalletItem = {
    id: id as any,
    tripId: tripId || undefined,
    type: type as any,
    title,
    subtitle: typeof x.subtitle === "string" ? x.subtitle : undefined,
    category: typeof x.category === "string" ? x.category : undefined,
    createdAt,
    updatedAt,
  };

  if (type === "text") {
    const text = typeof x.reference === "string" ? x.reference : typeof x.text === "string" ? x.text : "";
    out.reference = String(text ?? "");
  } else {
    const url = typeof x.sourceUrl === "string" ? x.sourceUrl : typeof x.url === "string" ? x.url : "";
    out.sourceUrl = String(url ?? "");
  }

  return out;
}

function sort(items: WalletItem[]) {
  const copy = [...items];
  copy.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  return copy;
}

async function persist(items: WalletItem[]) {
  await storage.setJSON(KEY, items);
}

type WalletState = {
  loaded: boolean;
  items: WalletItem[];

  load: () => Promise<void>;

  addText: (input: {
    tripId?: Id;
    title: string;
    subtitle?: string;
    text: string;
    category?: WalletItem["category"];
  }) => Promise<WalletItem>;

  addLink: (input: {
    tripId?: Id;
    title: string;
    subtitle?: string;
    url: string;
    category?: WalletItem["category"];
  }) => Promise<WalletItem>;

  remove: (id: Id) => Promise<void>;
  clearAll: () => Promise<void>;

  getByTrip: (tripId: Id) => WalletItem[];
};

export const useWalletStore = create<WalletState>((set, get) => ({
  loaded: false,
  items: [],

  load: async () => {
    const existing = (await storage.getJSON<any[]>(KEY)) ?? [];
    const arr = Array.isArray(existing) ? existing : [];
    const cleaned = arr.map(cleanItem).filter(Boolean) as WalletItem[];
    set({ items: sort(cleaned), loaded: true });
  },

  addText: async (input) => {
    const title = String(input.title ?? "").trim();
    if (!title) throw new Error("Title required");

    const item: WalletItem = {
      id: newId("wtxt"),
      tripId: input.tripId ? String(input.tripId).trim() : undefined,
      type: "text",
      title,
      subtitle: input.subtitle,
      reference: String(input.text ?? ""),
      category: input.category,
      createdAt: now(),
      updatedAt: now(),
    };

    const next = sort([item, ...get().items]);
    set({ items: next, loaded: true });
    await persist(next);
    return item;
  },

  addLink: async (input) => {
    const title = String(input.title ?? "").trim();
    const url = String(input.url ?? "").trim();
    if (!title) throw new Error("Title required");
    if (!url) throw new Error("URL required");

    const item: WalletItem = {
      id: newId("wlink"),
      tripId: input.tripId ? String(input.tripId).trim() : undefined,
      type: "link",
      title,
      subtitle: input.subtitle,
      sourceUrl: url,
      category: input.category,
      createdAt: now(),
      updatedAt: now(),
    };

    const next = sort([item, ...get().items]);
    set({ items: next, loaded: true });
    await persist(next);
    return item;
  },

  remove: async (id) => {
    const key = String(id ?? "").trim();
    if (!key) return;

    const next = get().items.filter((x) => x.id !== key);
    set({ items: next, loaded: true });
    await persist(next);
  },

  clearAll: async () => {
    set({ items: [], loaded: true });
    await storage.remove(KEY);
  },

  getByTrip: (tripId) => get().items.filter((x) => x.tripId === tripId),
}));
