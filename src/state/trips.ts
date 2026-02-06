// src/state/trips.ts
import { create } from "zustand";

import type { Trip as CoreTrip } from "@/src/core/tripTypes";
import { makeTripId } from "@/src/core/id";
import { readJson, writeJson } from "@/src/state/persist";

export type Trip = CoreTrip;

type TripState = {
  loaded: boolean;
  trips: Trip[];

  loadTrips: () => Promise<void>;

  addTrip: (input: Partial<Omit<Trip, "id" | "createdAt" | "updatedAt">> & { cityId: string; startDate: string; endDate: string }) => Promise<Trip>;

  updateTrip: (id: string, patch: Partial<Omit<Trip, "id" | "createdAt">>) => Promise<Trip>;

  removeTrip: (id: string) => Promise<void>;

  getTripById: (id: string) => Trip | null;

  /**
   * Useful during development / resets.
   */
  clearAllTrips: () => Promise<void>;
};

const STORAGE_KEY = "yna_trips_v2";

function now() {
  return Date.now();
}

function normalizeTrip(t: any): Trip | null {
  if (!t || typeof t !== "object") return null;

  const id = String(t.id ?? "").trim();
  const cityId = String(t.cityId ?? "").trim();
  const startDate = String(t.startDate ?? "").trim();
  const endDate = String(t.endDate ?? "").trim();

  if (!id || !cityId || !startDate || !endDate) return null;

  const matchIdsRaw = Array.isArray(t.matchIds) ? t.matchIds : [];
  const matchIds = matchIdsRaw.map((x) => String(x)).filter(Boolean);

  const createdAt = Number.isFinite(Number(t.createdAt)) ? Number(t.createdAt) : now();
  const updatedAt = Number.isFinite(Number(t.updatedAt)) ? Number(t.updatedAt) : createdAt;

  const notes = typeof t.notes === "string" ? t.notes : undefined;
  const citySlug = typeof t.citySlug === "string" ? t.citySlug : undefined;

  return {
    id: id as any,
    cityId,
    citySlug,
    startDate,
    endDate,
    matchIds,
    notes,
    createdAt,
    updatedAt,
  };
}

function sortTrips(trips: Trip[]): Trip[] {
  // Most recent upcoming (startDate) first; fallback updatedAt desc.
  const copy = [...trips];
  copy.sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate < b.startDate ? 1 : -1;
    return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
  });
  return copy;
}

async function persistTrips(trips: Trip[]) {
  await writeJson(STORAGE_KEY, trips);
}

const useTripsStore = create<TripState>((set, get) => ({
  loaded: false,
  trips: [],

  loadTrips: async () => {
    const raw = await readJson<any[]>(STORAGE_KEY, []);
    const parsed = raw.map(normalizeTrip).filter(Boolean) as Trip[];
    set({ trips: sortTrips(parsed), loaded: true });
  },

  addTrip: async (input) => {
    const id = makeTripId() as unknown as string;
    const t: Trip = {
      id: id as any,
      cityId: String(input.cityId).trim(),
      citySlug: typeof (input as any).citySlug === "string" ? String((input as any).citySlug).trim() : undefined,
      startDate: String(input.startDate).trim(),
      endDate: String(input.endDate).trim(),
      matchIds: Array.isArray((input as any).matchIds)
        ? (input as any).matchIds.map((x: any) => String(x)).filter(Boolean)
        : [],
      notes: typeof input.notes === "string" ? input.notes : undefined,
      createdAt: now(),
      updatedAt: now(),
    };

    const next = sortTrips([t, ...get().trips]);
    set({ trips: next, loaded: true });
    await persistTrips(next);
    return t;
  },

  updateTrip: async (id, patch) => {
    const cur = get().trips;
    const idx = cur.findIndex((x) => String(x.id) === String(id));
    if (idx < 0) throw new Error("Trip not found");

    const existing = cur[idx];

    const nextTrip: Trip = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: now(),
      cityId: typeof patch.cityId === "string" ? patch.cityId : existing.cityId,
      startDate: typeof patch.startDate === "string" ? patch.startDate : existing.startDate,
      endDate: typeof patch.endDate === "string" ? patch.endDate : existing.endDate,
      matchIds: Array.isArray((patch as any).matchIds)
        ? (patch as any).matchIds.map((x: any) => String(x)).filter(Boolean)
        : existing.matchIds,
      notes: typeof patch.notes === "string" ? patch.notes : existing.notes,
      citySlug: typeof (patch as any).citySlug === "string" ? String((patch as any).citySlug).trim() : existing.citySlug,
    };

    const next = [...cur];
    next[idx] = nextTrip;

    const sorted = sortTrips(next);
    set({ trips: sorted, loaded: true });
    await persistTrips(sorted);

    return nextTrip;
  },

  removeTrip: async (id) => {
    const next = get().trips.filter((t) => String(t.id) !== String(id));
    set({ trips: next, loaded: true });
    await persistTrips(next);
  },

  getTripById: (id) => {
    const t = get().trips.find((x) => String(x.id) === String(id));
    return t ?? null;
  },

  clearAllTrips: async () => {
    set({ trips: [], loaded: true });
    await persistTrips([]);
  },
}));

/**
 * Export pattern matching your current usage:
 * - tripsStore.getState()
 * - tripsStore.loadTrips()
 */
const tripsStore = {
  getState: useTripsStore.getState,
  setState: useTripsStore.setState,

  subscribe: useTripsStore.subscribe,

  loadTrips: async () => {
    await useTripsStore.getState().loadTrips();
  },

  addTrip: async (input: Parameters<TripState["addTrip"]>[0]) => {
    return await useTripsStore.getState().addTrip(input);
  },

  updateTrip: async (id: string, patch: Parameters<TripState["updateTrip"]>[1]) => {
    return await useTripsStore.getState().updateTrip(id, patch);
  },

  removeTrip: async (id: string) => {
    await useTripsStore.getState().removeTrip(id);
  },

  clearAllTrips: async () => {
    await useTripsStore.getState().clearAllTrips();
  },
};

export default tripsStore;
export { useTripsStore };
