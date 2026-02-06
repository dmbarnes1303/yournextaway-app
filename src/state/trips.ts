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

  if (!id || !cityId || !startDate || !endDate) return null;

  const matchIds = Array.isArray(x.matchIds) ? x.matchIds.map((m: any) => String(m).trim()).filter(Boolean) : [];

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
   * Deletes the trip AND deletes all SavedItems belonging to the trip.
   * This is the only delete we should use in Phase 1 to prevent orphaned Wallet items.
   */
  deleteTripCascade: (tripId: string) => Promise<void>;

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
      matchIds: Array.isArray(input.matchIds) ? input.matchIds.map((m) => String(m).trim()).filter(Boolean) : [],
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

    const next = get().trips.map((t) => {
      if (t.id !== id) return t;
      return { ...t, ...patch, updatedAt: now() };
    });

    const sorted = sortTrips(next);
    set({ trips: sorted, loaded: true });
    await persist(sorted);
  },

  deleteTripCascade: async (tripId) => {
    if (!get().loaded) await get().loadTrips();

    const id = String(tripId ?? "").trim();
    if (!id) return;

    // 1) Remove trip
    const nextTrips = get().trips.filter((t) => t.id !== id);
    set({ trips: nextTrips, loaded: true });
    await persist(nextTrips);

    // 2) Remove all SavedItems associated to that trip (prevents orphaned Wallet items)
    try {
      await savedItemsStore.clearTrip(id);
    } catch {
      // best-effort: trip is gone, but we REALLY want savedItems cleared.
      // If this fails, you'll see orphaned items again.
    }
  },

  clearAll: async () => {
    set({ trips: [], loaded: true });
    await persist([]);
    try {
      await savedItemsStore.clearAll();
    } catch {
      // ignore
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

  clearAll: async () => {
    await useTripsStore.getState().clearAll();
  },
};

export default tripsStore;
export { useTripsStore };
export type { Trip };
