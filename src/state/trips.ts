// src/state/trips.ts
import { create } from "zustand";
import { readJson, writeJson } from "@/src/state/persist";
import { makeTripId } from "@/src/core/id";
import type { Trip } from "@/src/core/tripTypes";
import savedItemsStore from "@/src/state/savedItems";

import { MOCK_TRIP_SEEDS } from "@/src/data/mockTrips";
import { buildMockSavedItemsForSeed } from "@/src/data/mockTripItems";

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
   * Deletes the trip AND deletes all SavedItems (and attachment files) belonging to the trip.
   */
  deleteTripCascade: (tripId: string) => Promise<void>;

  clearAll: () => Promise<void>;

  /** Dev convenience: seed mock trips + items if none exist */
  seedMockTrips: () => Promise<void>;
};

const useTripsStore = create<TripsState>((set, get) => ({
  loaded: false,
  trips: [],

  loadTrips: async () => {
    if (get().loaded) return;

    const raw = await readJson<any>(STORAGE_KEY, []);
    const arr = Array.isArray(raw) ? raw : [];
    const cleaned = arr.map(cleanLoadedTrip).filter(Boolean) as Trip[];

    const sorted = sortTrips(cleaned);
    set({ trips: sorted, loaded: true });

    // Dev-only: if you have zero trips, seed a couple so UI isn't dead.
    // @ts-ignore
    if (typeof __DEV__ !== "undefined" && __DEV__ && sorted.length === 0) {
      await get().seedMockTrips();
    }
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

    // 2) Remove all SavedItems + their attachment files
    try {
      await savedItemsStore.clearTrip(id, { deleteAttachmentFiles: true });
    } catch {
      // best-effort
    }

    // 3) Optional hardening: clear any lingering orphans
    try {
      const valid = nextTrips.map((t) => String(t.id));
      await savedItemsStore.clearOrphans(valid, { deleteAttachmentFiles: true });
    } catch {
      // best-effort
    }
  },

  clearAll: async () => {
    set({ trips: [], loaded: true });
    await persist([]);

    try {
      await savedItemsStore.clearAll({ deleteAttachmentFiles: true });
    } catch {
      // ignore
    }
  },

  seedMockTrips: async () => {
    if (!get().loaded) await get().loadTrips();
    if (get().trips.length > 0) return;

    // Ensure saved items store loaded before adding items
    try {
      await savedItemsStore.load();
    } catch {
      // best-effort
    }

    for (const seed of MOCK_TRIP_SEEDS) {
      const trip = await get().addTrip({
        cityId: seed.cityId,
        citySlug: seed.citySlug,
        startDate: seed.startDate,
        endDate: seed.endDate,
        matchIds: seed.matchIds ?? [],
        notes: seed.notes,
      });

      // Build realistic saved items for the trip workspace
      const matchTitle =
        seed.matchIds && seed.matchIds.length
          ? seed.matchIds[0].replace(/-/g, " ")
          : undefined;

      const built = buildMockSavedItemsForSeed({
        tripId: trip.id,
        cityName: seed.cityId,
        startDate: seed.startDate,
        endDate: seed.endDate,
        matchTitle,
      });

      for (const it of built.items) {
        try {
          await savedItemsStore.add({
            tripId: built.tripId,
            type: it.type,
            status: it.status,
            title: it.title,
            partnerId: it.partnerId,
            partnerUrl: it.partnerUrl,
            priceText: it.priceText,
            currency: it.currency,
            metadata: it.metadata,
          });
        } catch {
          // best-effort; don't block seeding if one item fails
        }
      }
    }
  },
}));

/* -------------------------------------------------------------------------- */
/* Wrapper */
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

  // Backwards-compat alias
  removeTrip: async (tripId: string) => {
    await useTripsStore.getState().deleteTripCascade(tripId);
  },

  clearAll: async () => {
    await useTripsStore.getState().clearAll();
  },

  seedMockTrips: async () => {
    await useTripsStore.getState().seedMockTrips();
  },

  /**
   * Lookup helpers for Follow → Trip conversion.
   */
  getTripByMatchId: (fixtureId: string) => {
    const id = String(fixtureId ?? "").trim();
    if (!id) return null;
    const s = useTripsStore.getState();
    return s.trips.find((t) => Array.isArray(t.matchIds) && t.matchIds.includes(id)) ?? null;
  },

  getTripIdByMatchId: (fixtureId: string) => {
    const t = tripsStore.getTripByMatchId(fixtureId);
    return t?.id ?? null;
  },
};

export default tripsStore;
export { useTripsStore };
export type { Trip };
