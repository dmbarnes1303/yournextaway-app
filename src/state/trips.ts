// src/state/trips.ts
import { create } from "zustand";
import { readJson, writeJson } from "@/src/state/persist";
import { makeTripId } from "@/src/core/id";
import type { Trip } from "@/src/core/tripTypes";
import savedItemsStore from "@/src/state/savedItems";

const STORAGE_KEY = "yna_trips_v1";

function now() {
  return Date.now();
}

function sortTrips(trips: Trip[]) {
  const copy = [...trips];
  copy.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  return copy;
}

async function persist(trips: Trip[]) {
  await writeJson(STORAGE_KEY, trips);
}

function cleanLoadedTrip(x: any): Trip | null {
  if (!x || typeof x !== "object") return null;

  const id = String(x.id ?? "").trim();
  const cityId = String(x.cityId ?? "").trim();
  const startDate = String(x.startDate ?? "").trim();
  const endDate = String(x.endDate ?? "").trim();

  // Phase 1: require these to keep trip rows stable
  if (!id || !cityId || !startDate || !endDate) return null;

  const matchIds = Array.isArray(x.matchIds)
    ? x.matchIds.map((m: any) => String(m).trim()).filter(Boolean)
    : [];

  const createdAt = Number.isFinite(Number(x.createdAt)) ? Number(x.createdAt) : now();
  const updatedAt = Number.isFinite(Number(x.updatedAt)) ? Number(x.updatedAt) : createdAt;

  return {
    id,
    cityId,
    citySlug: typeof x.citySlug === "string" ? x.citySlug : undefined,
    startDate,
    endDate,
    matchIds,
    notes: typeof x.notes === "string" ? x.notes : undefined,
    createdAt,
    updatedAt,
  };
}

type TripsState = {
  loaded: boolean;
  trips: Trip[];

  loadTrips: () => Promise<void>;

  addTrip: (input: {
    cityId: string;
    citySlug?: string;
    startDate: string;
    endDate: string;
    matchIds?: string[];
    notes?: string;
  }) => Promise<Trip>;

  updateTrip: (tripId: string, patch: Partial<Omit<Trip, "id" | "createdAt">>) => Promise<void>;

  /**
   * Canonical delete for Phase 1.
   * Deletes all wallet items + attachment files for this trip, THEN deletes the trip.
   * If cascade fails, we DO NOT delete the trip (prevents ghost wallet state).
   */
  deleteTripCascade: (tripId: string) => Promise<void>;

  /**
   * Backwards compatible alias.
   * Old screens call removeTrip() — we route it to deleteTripCascade().
   */
  removeTrip: (tripId: string) => Promise<void>;

  clearAll: () => Promise<void>;
};

const useTripsStore = create<TripsState>((set, get) => ({
  loaded: false,
  trips: [],

  loadTrips: async () => {
    if (get().loaded) return;

    const raw = await readJson<any>(STORAGE_KEY, []);
    const arr = Array.isArray(raw) ? raw : [];
    const cleaned = arr.map(cleanLoadedTrip).filter(Boolean) as Trip[];

    set({ trips: sortTrips(cleaned), loaded: true });
  },

  addTrip: async (input) => {
    if (!get().loaded) await get().loadTrips();

    const cityId = String(input.cityId ?? "").trim();
    const startDate = String(input.startDate ?? "").trim();
    const endDate = String(input.endDate ?? "").trim();

    if (!cityId) throw new Error("cityId required");
    if (!startDate) throw new Error("startDate required");
    if (!endDate) throw new Error("endDate required");

    const trip: Trip = {
      id: makeTripId(),
      cityId,
      citySlug: input.citySlug ? String(input.citySlug).trim() : undefined,
      startDate,
      endDate,
      matchIds: Array.isArray(input.matchIds)
        ? input.matchIds.map((m) => String(m).trim()).filter(Boolean)
        : [],
      notes: input.notes ? String(input.notes) : undefined,
      createdAt: now(),
      updatedAt: now(),
    };

    const next = sortTrips([trip, ...get().trips]);
    set({ trips: next, loaded: true });
    await persist(next);

    return trip;
  },

  updateTrip: async (tripId, patch) => {
    if (!get().loaded) await get().loadTrips();

    const id = String(tripId ?? "").trim();
    if (!id) return;

    const next = get().trips.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now() } : t));
    const sorted = sortTrips(next);

    set({ trips: sorted, loaded: true });
    await persist(sorted);
  },

  deleteTripCascade: async (tripId) => {
    if (!get().loaded) await get().loadTrips();

    const id = String(tripId ?? "").trim();
    if (!id) return;

    // Ensure saved items store is loaded too (avoid edge cases on fresh install)
    if (!savedItemsStore.getState().loaded) {
      try {
        await savedItemsStore.load();
      } catch {
        // if saved items can't load, deleting is unsafe (could orphan files/items)
        throw new Error("Wallet not ready. Try again.");
      }
    }

    // 1) Delete saved items + attachments FIRST.
    // If this fails, abort trip deletion — prevents orphaned wallet state.
    try {
      await savedItemsStore.clearTrip(id);
    } catch {
      throw new Error("Couldn’t remove wallet items for this trip. Try again.");
    }

    // 2) Now delete the trip
    const existing = get().trips;
    if (!existing.some((t) => t.id === id)) return;

    const nextTrips = existing.filter((t) => t.id !== id);
    set({ trips: nextTrips, loaded: true });

    try {
      await persist(nextTrips);
    } catch {
      // Persist failed. We can't reliably restore deleted wallet items,
      // so surface a hard error.
      throw new Error("Couldn’t save trip deletion. Try again.");
    }
  },

  removeTrip: async (tripId) => {
    await get().deleteTripCascade(tripId);
  },

  clearAll: async () => {
    // Clear wallet first to avoid orphans if trip persist fails
    try {
      if (!savedItemsStore.getState().loaded) await savedItemsStore.load();
      await savedItemsStore.clearAll();
    } catch {
      throw new Error("Couldn’t clear wallet. Try again.");
    }

    set({ trips: [], loaded: true });

    try {
      await persist([]);
    } catch {
      throw new Error("Couldn’t clear trips. Try again.");
    }
  },
}));

/* -------------------------------------------------------------------------- */
/* Wrapper (matches your existing tripsStore usage pattern) */
/* -------------------------------------------------------------------------- */

const tripsStore = {
  getState: useTripsStore.getState,
  setState: useTripsStore.setState,
  subscribe: useTripsStore.subscribe,

  loadTrips: async () => {
    await useTripsStore.getState().loadTrips();
  },

  addTrip: async (input: Parameters<TripsState["addTrip"]>[0]) => {
    return await useTripsStore.getState().addTrip(input);
  },

  updateTrip: async (tripId: string, patch: Parameters<TripsState["updateTrip"]>[1]) => {
    await useTripsStore.getState().updateTrip(tripId, patch);
  },

  deleteTripCascade: async (tripId: string) => {
    await useTripsStore.getState().deleteTripCascade(tripId);
  },

  // Back-compat: screens that call removeTrip keep working
  removeTrip: async (tripId: string) => {
    await useTripsStore.getState().removeTrip(tripId);
  },

  clearAll: async () => {
    await useTripsStore.getState().clearAll();
  },
};

export default tripsStore;
export { useTripsStore };
export type { Trip };
