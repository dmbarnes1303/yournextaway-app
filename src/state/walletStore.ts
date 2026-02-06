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

async function persist(items: WalletItem[]) {
  await storage.setJSON(KEY, items);
}

export const useWalletStore = create<WalletState>((set, get) => ({
  loaded: false,
  items: [],

  load: async () => {
    const existing = (await storage.getJSON<WalletItem[]>(KEY)) ?? [];
    set({ items: Array.isArray(existing) ? existing : [], loaded: true });
  },

  addText: async (input) => {
    const item: WalletItem = {
      id: newId("wtxt"),
      tripId: input.tripId,
      type: "text",
      title: input.title,
      subtitle: input.subtitle,
      reference: input.text,
      category: input.category,
      createdAt: now(),
      updatedAt: now(),
    };

    const next = [item, ...get().items];
    set({ items: next });
    await persist(next);
    return item;
  },

  addLink: async (input) => {
    const item: WalletItem = {
      id: newId("wlink"),
      tripId: input.tripId,
      type: "link",
      title: input.title,
      subtitle: input.subtitle,
      sourceUrl: input.url,
      category: input.category,
      createdAt: now(),
      updatedAt: now(),
    };

    const next = [item, ...get().items];
    set({ items: next });
    await persist(next);
    return item;
  },

  remove: async (id) => {
    const next = get().items.filter((x) => x.id !== id);
    set({ items: next });
    await persist(next);
  },

  clearAll: async () => {
    set({ items: [] });
    await storage.remove(KEY);
  },

  getByTrip: (tripId) => get().items.filter((x) => x.tripId === tripId),
}));
