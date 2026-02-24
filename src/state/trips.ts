// src/state/trips.ts
import { create } from "zustand";

import { readJson, writeJson } from "@/src/state/persist";
import { makeTripId } from "@/src/core/id";
import type { Trip } from "@/src/core/tripTypes";

import savedItemsStore from "@/src/state/savedItems";
import { MOCK_TRIP_SEEDS } from "@/src/data/mockTrips";
import { buildMockSavedItemsForSeed } from "@/src/data/mockTripItems";

const STORAGE_KEY = "yna_trips_v1";

/* -------------------------------------------------------------------------- */
/* utils */
/* -------------------------------------------------------------------------- */

function now() {
  return Date.now();
}

function isIsoDateOnly(s: unknown) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

function cleanString(v: unknown) {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function cleanMatchIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((m) => cleanString(m))
    .filter(Boolean)
    .filter((x, i, arr) => arr.indexOf(x) === i);
}

function sortTrips(trips: Trip[]) {
  const copy = [...trips];
  copy.sort((a, b) => (Number(b.updatedAt ?? 0) || 0) - (Number(a.updatedAt ?? 0) || 0));
  return copy;
}

function cleanOptString(v: unknown): string | undefined {
  const s = cleanString(v);
  return s ? s : undefined;
}

function cleanOptBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  return undefined;
}

/**
 * Conservative cleaner:
 * - requires id, cityId, startDate, endDate
 * - start/end must be YYYY-MM-DD
 * - matchIds coerced to string[]
 * - createdAt/updatedAt defaulted sanely
 * - ✅ preserves optional “snapshot” fields used for durability
 *
 * If something is unusable -> null (dropped).
 */
function cleanLoadedTrip(raw: any): Trip | null {
  if (!raw || typeof raw !== "object") return null;

  const id = cleanString(raw.id);
  const cityId = cleanString(raw.cityId);
  const startDate = cleanString(raw.startDate);
  const endDate = cleanString(raw.endDate);

  if (!id || !cityId) return null;
  if (!isIsoDateOnly(startDate) || !isIsoDateOnly(endDate)) return null;

  const createdAt =
    Number.isFinite(Number(raw.createdAt)) && Number(raw.createdAt) > 0 ? Number(raw.createdAt) : now();

  const updatedAt =
    Number.isFinite(Number(raw.updatedAt)) && Number(raw.updatedAt) > 0 ? Number(raw.updatedAt) : createdAt;

  const trip: Trip = {
    id,
    cityId,
    citySlug: typeof raw.citySlug === "string" ? raw.citySlug : undefined,
    startDate,
    endDate,
    matchIds: cleanMatchIds(raw.matchIds),
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
    createdAt,
    updatedAt,
  };

  // ✅ Snapshot fields (safe to keep even if Trip type hasn’t been extended yet)
  const anyTrip = trip as any;
  anyTrip.displayCity = cleanOptString(raw.displayCity);
  anyTrip.homeName = cleanOptString(raw.homeName);
  anyTrip.awayName = cleanOptString(raw.awayName);
  anyTrip.leagueName = cleanOptString(raw.leagueName);
  anyTrip.venueName = cleanOptString(raw.venueName);
  anyTrip.kickoffIso = cleanOptString(raw.kickoffIso);
  anyTrip.kickoffTbc = cleanOptBool(raw.kickoffTbc);

  return trip;
}

async function persistTrips(trips: Trip[]) {
  await writeJson(STORAGE_KEY, trips);
}

/* -------------------------------------------------------------------------- */
/* state */
/* -------------------------------------------------------------------------- */

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

    // ✅ optional snapshot fields
    displayCity?: string;
    homeName?: string | null;
    awayName?: string | null;
    leagueName?: string | null;
    venueName?: string | null;
    kickoffIso?: string | null;
    kickoffTbc?: boolean;
  }) => Promise<Trip>;

  updateTrip: (tripId: string, patch: Partial<Omit<Trip, "id" | "createdAt">> & Record<string, any>) => Promise<void>;

  /**
   * Deletes the trip AND deletes all SavedItems (and attachment files) belonging to the trip.
   */
  deleteTripCascade: (tripId: string) => Promise<void>;

  clearAll: () => Promise<void>;

  /** Dev convenience: seed mock trips + items if none exist */
  seedMockTrips: () => Promise<void>;
};

let inflightLoad: Promise<void> | null = null;

const useTripsStore = create<TripsState>((set, get) => ({
  loaded: false,
  trips: [],

  loadTrips: async () => {
    if (get().loaded) return;
    if (inflightLoad) return inflightLoad;

    inflightLoad = (async () => {
      const raw = await readJson<any>(STORAGE_KEY, []);
      const arr = Array.isArray(raw) ? raw : [];
      const cleaned = arr.map(cleanLoadedTrip).filter(Boolean) as Trip[];
      const sorted = sortTrips(cleaned);

      set({ trips: sorted, loaded: true });

      // Dev-only seed: keep UI alive during development.
      // IMPORTANT: only seed when truly empty.
      // @ts-ignore
      if (typeof __DEV__ !== "undefined" && __DEV__ && sorted.length === 0) {
        try {
          await get().seedMockTrips();
        } catch {
          // dev-only, ignore
        }
      }
    })()
      .catch(() => {
        // If load fails, don't brick the app: mark loaded but empty so UI can still run.
        set({ trips: [], loaded: true });
      })
      .finally(() => {
        inflightLoad = null;
      });

    return inflightLoad;
  },

  addTrip: async (input) => {
    if (!get().loaded) await get().loadTrips();

    const cityId = cleanString(input.cityId);
    const startDate = cleanString(input.startDate);
    const endDate = cleanString(input.endDate);

    if (!cityId) throw new Error("cityId required");
    if (!isIsoDateOnly(startDate)) throw new Error("startDate must be YYYY-MM-DD");
    if (!isIsoDateOnly(endDate)) throw new Error("endDate must be YYYY-MM-DD");

    const trip: Trip = {
      id: makeTripId(),
      cityId,
      citySlug: input.citySlug ? cleanString(input.citySlug) : undefined,
      startDate,
      endDate,
      matchIds: Array.isArray(input.matchIds) ? cleanMatchIds(input.matchIds) : [],
      notes: typeof input.notes === "string" ? input.notes : undefined,
      createdAt: now(),
      updatedAt: now(),
    };

    const anyTrip = trip as any;
    anyTrip.displayCity = cleanOptString(input.displayCity);
    anyTrip.homeName = cleanOptString(input.homeName);
    anyTrip.awayName = cleanOptString(input.awayName);
    anyTrip.leagueName = cleanOptString(input.leagueName);
    anyTrip.venueName = cleanOptString(input.venueName);
    anyTrip.kickoffIso = cleanOptString(input.kickoffIso);
    anyTrip.kickoffTbc = cleanOptBool(input.kickoffTbc);

    const next = sortTrips([trip, ...get().trips]);
    set({ trips: next, loaded: true });

    try {
      await persistTrips(next);
    } catch {
      // keep in-memory state
    }

    return trip;
  },

  updateTrip: async (tripId, patch) => {
    if (!get().loaded) await get().loadTrips();

    const id = cleanString(tripId);
    if (!id) return;

    const next = get().trips.map((t) => {
      if (t.id !== id) return t;

      const p: any = { ...(patch as any) };

      // Guard: never allow an invalid date shape to enter storage.
      if ("startDate" in p && !isIsoDateOnly(p.startDate)) delete p.startDate;
      if ("endDate" in p && !isIsoDateOnly(p.endDate)) delete p.endDate;

      if ("cityId" in p) p.cityId = cleanString(p.cityId);
      if ("citySlug" in p && typeof p.citySlug === "string") p.citySlug = p.citySlug.trim();
      if ("matchIds" in p) p.matchIds = cleanMatchIds(p.matchIds);

      // Snapshot field hygiene (best-effort)
      if ("displayCity" in p) p.displayCity = cleanOptString(p.displayCity);
      if ("homeName" in p) p.homeName = cleanOptString(p.homeName);
      if ("awayName" in p) p.awayName = cleanOptString(p.awayName);
      if ("leagueName" in p) p.leagueName = cleanOptString(p.leagueName);
      if ("venueName" in p) p.venueName = cleanOptString(p.venueName);
      if ("kickoffIso" in p) p.kickoffIso = cleanOptString(p.kickoffIso);
      if ("kickoffTbc" in p) p.kickoffTbc = cleanOptBool(p.kickoffTbc);

      const merged = { ...t, ...p, updatedAt: now() } as any;
      return merged as Trip;
    });

    const sorted = sortTrips(next);
    set({ trips: sorted, loaded: true });

    try {
      await persistTrips(sorted);
    } catch {
      // best-effort
    }
  },

  deleteTripCascade: async (tripId) => {
    if (!get().loaded) await get().loadTrips();

    const id = cleanString(tripId);
    if (!id) return;

    try {
      await savedItemsStore.clearTrip(id, { deleteAttachmentFiles: true });
    } catch {
      // best-effort
    }

    const nextTrips = get().trips.filter((t) => t.id !== id);
    set({ trips: nextTrips, loaded: true });

    try {
      await persistTrips(nextTrips);
    } catch {
      // best-effort
    }

    try {
      const validTripIds = nextTrips.map((t) => String(t.id));
      await savedItemsStore.clearOrphans(validTripIds, { deleteAttachmentFiles: true });
    } catch {
      // best-effort
    }
  },

  clearAll: async () => {
    set({ trips: [], loaded: true });

    try {
      await persistTrips([]);
    } catch {}

    try {
      await savedItemsStore.clearAll({ deleteAttachmentFiles: true });
    } catch {}
  },

  seedMockTrips: async () => {
    if (!get().loaded) await get().loadTrips();
    if (get().trips.length > 0) return;

    try {
      await savedItemsStore.load();
    } catch {}

    for (const seed of MOCK_TRIP_SEEDS) {
      const trip = await get().addTrip({
        cityId: seed.cityId,
        citySlug: seed.citySlug,
        startDate: seed.startDate,
        endDate: seed.endDate,
        matchIds: seed.matchIds ?? [],
        notes: seed.notes,
      });

      const matchTitle =
        seed.matchIds && seed.matchIds.length ? String(seed.matchIds[0]).replace(/-/g, " ") : undefined;

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
        } catch {}
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

  getTripByMatchId: (fixtureId: string) => {
    const id = cleanString(fixtureId);
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
