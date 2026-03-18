import { create } from "zustand";

import { makeTripId } from "@/src/core/id";
import type { Trip } from "@/src/core/tripTypes";
import { buildMockSavedItemsForSeed } from "@/src/data/mockTripItems";
import { MOCK_TRIP_SEEDS } from "@/src/data/mockTrips";
import { readJson, writeJson } from "@/src/state/persist";
import savedItemsStore from "@/src/state/savedItems";

const STORAGE_KEY = "yna_trips_v1";

type UnknownRecord = Record<string, unknown>;

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
    fixtureIdPrimary?: string;
    notes?: string;
    [key: string]: unknown;
  }) => Promise<Trip>;
  updateTrip: (
    tripId: string,
    patch: Partial<Omit<Trip, "id" | "createdAt">> & UnknownRecord
  ) => Promise<void>;
  addMatchToTrip: (
    tripId: string,
    fixtureId: string,
    opts?: { setPrimary?: boolean }
  ) => Promise<void>;
  removeMatchFromTrip: (tripId: string, fixtureId: string) => Promise<void>;
  setPrimaryMatchForTrip: (tripId: string, fixtureId: string) => Promise<void>;
  deleteTripCascade: (tripId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  seedMockTrips: () => Promise<void>;
};

function now() {
  return Date.now();
}

function isIsoDateOnly(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function toOptionalString(value: unknown): string | undefined {
  const cleaned = cleanString(value);
  return cleaned || undefined;
}

function isPlainObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDevRuntime(): boolean {
  const runtime = globalThis as { __DEV__?: unknown };
  return runtime.__DEV__ === true;
}

function normalizeCityKey(cityRaw: unknown): string {
  const cleaned = cleanString(cityRaw).toLowerCase();
  if (!cleaned) return "trip";

  return (
    cleaned
      .replace(/&/g, "and")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "trip"
  );
}

function cleanMatchIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((matchId) => cleanString(matchId))
    .filter(Boolean)
    .filter((entry, index, array) => array.indexOf(entry) === index);
}

function sortTrips(trips: Trip[]) {
  const copy = [...trips];
  copy.sort((a, b) => (Number(b.updatedAt ?? 0) || 0) - (Number(a.updatedAt ?? 0) || 0));
  return copy;
}

function toOptionalNumber(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function toOptionalBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function uniqPush(arr: string[], id: string) {
  if (!arr.includes(id)) arr.push(id);
  return arr;
}

function removeFrom(arr: string[], id: string) {
  return arr.filter((entry) => entry !== id);
}

function cloneTrip<T extends Trip | null | undefined>(trip: T): T {
  if (!trip) return trip;
  return { ...trip };
}

function cleanLoadedTrip(raw: unknown): Trip | null {
  if (!isPlainObject(raw)) return null;

  const id = cleanString(raw.id);
  const rawCityId = cleanString(raw.cityId);
  const rawCitySlug = typeof raw.citySlug === "string" ? cleanString(raw.citySlug) : "";

  const citySource = rawCityId || rawCitySlug || cleanString(raw.displayCity);
  const cityId = normalizeCityKey(citySource);

  const startDate = cleanString(raw.startDate);
  const endDate = cleanString(raw.endDate);

  if (!id || !cityId) return null;
  if (!isIsoDateOnly(startDate) || !isIsoDateOnly(endDate)) return null;

  const createdAt =
    Number.isFinite(Number(raw.createdAt)) && Number(raw.createdAt) > 0
      ? Number(raw.createdAt)
      : now();

  const updatedAt =
    Number.isFinite(Number(raw.updatedAt)) && Number(raw.updatedAt) > 0
      ? Number(raw.updatedAt)
      : createdAt;

  const matchIds = cleanMatchIds(raw.matchIds);

  let fixtureIdPrimary =
    cleanString(raw.fixtureIdPrimary) || (matchIds[0] ? String(matchIds[0]) : "");
  let nextMatchIds = matchIds;

  if (fixtureIdPrimary && !nextMatchIds.includes(fixtureIdPrimary)) {
    nextMatchIds = [...nextMatchIds, fixtureIdPrimary];
  }

  if (fixtureIdPrimary && nextMatchIds.length === 0) nextMatchIds = [fixtureIdPrimary];
  if (!fixtureIdPrimary && nextMatchIds.length > 0) fixtureIdPrimary = String(nextMatchIds[0]);

  const displayCity =
    typeof raw.displayCity === "string" && raw.displayCity.trim()
      ? raw.displayCity.trim()
      : rawCityId && rawCityId !== cityId
        ? rawCityId
        : undefined;

  const trip: Trip = {
    ...(raw as Trip),
    id,
    cityId,
    citySlug: cityId,
    startDate,
    endDate,
    matchIds: nextMatchIds,
    fixtureIdPrimary: fixtureIdPrimary || undefined,
    notes: typeof raw.notes === "string" ? raw.notes.trim() : undefined,
    ...(displayCity ? { displayCity } : {}),
    homeTeamId: toOptionalNumber(raw.homeTeamId),
    awayTeamId: toOptionalNumber(raw.awayTeamId),
    leagueId: toOptionalNumber(raw.leagueId),
    sportsevents365EventId: toOptionalNumber(raw.sportsevents365EventId),
    kickoffTbc: toOptionalBool(raw.kickoffTbc),
    createdAt,
    updatedAt,
  };

  return trip;
}

function normalizeTripPatch(
  current: Trip,
  patch: Partial<Omit<Trip, "id" | "createdAt">> & UnknownRecord
): UnknownRecord {
  const next: UnknownRecord = {};

  if ("startDate" in patch) {
    const value = cleanString(patch.startDate);
    if (isIsoDateOnly(value)) next.startDate = value;
  }

  if ("endDate" in patch) {
    const value = cleanString(patch.endDate);
    if (isIsoDateOnly(value)) next.endDate = value;
  }

  if ("cityId" in patch) {
    next.cityId = normalizeCityKey(patch.cityId);
    next.citySlug = next.cityId;
  }

  if ("citySlug" in patch && !("cityId" in patch)) {
    next.citySlug = normalizeCityKey(patch.citySlug ?? current.cityId);
  }

  if ("displayCity" in patch) {
    next.displayCity = toOptionalString(patch.displayCity);
  }

  if ("matchIds" in patch) {
    next.matchIds = cleanMatchIds(patch.matchIds);
  }

  if ("fixtureIdPrimary" in patch) {
    next.fixtureIdPrimary = toOptionalString(patch.fixtureIdPrimary);
  }

  if ("notes" in patch) {
    next.notes =
      typeof patch.notes === "string" ? patch.notes.trim() || undefined : undefined;
  }

  if ("homeTeamId" in patch) next.homeTeamId = toOptionalNumber(patch.homeTeamId);
  if ("awayTeamId" in patch) next.awayTeamId = toOptionalNumber(patch.awayTeamId);
  if ("leagueId" in patch) next.leagueId = toOptionalNumber(patch.leagueId);
  if ("sportsevents365EventId" in patch) {
    next.sportsevents365EventId = toOptionalNumber(patch.sportsevents365EventId);
  }
  if ("kickoffTbc" in patch) next.kickoffTbc = toOptionalBool(patch.kickoffTbc);

  const passthroughStringKeys = [
    "homeName",
    "awayName",
    "leagueName",
    "kickoffIso",
    "venueName",
    "venueCity",
  ] as const;

  for (const key of passthroughStringKeys) {
    if (key in patch) {
      next[key] = toOptionalString(patch[key]);
    }
  }

  return next;
}

function normalizeMergedTrip(current: Trip, patch: UnknownRecord): Trip {
  const merged = { ...current, ...patch } as Trip & {
    matchIds?: unknown;
    fixtureIdPrimary?: unknown;
    cityId?: unknown;
    citySlug?: unknown;
    updatedAt?: unknown;
  };

  const matchIds = Array.isArray(merged.matchIds) ? cleanMatchIds(merged.matchIds) : [];
  let primary = cleanString(merged.fixtureIdPrimary);

  if (primary && !matchIds.includes(primary)) {
    merged.matchIds = [...matchIds, primary];
  } else {
    merged.matchIds = matchIds;
  }

  if (!primary && merged.matchIds.length > 0) {
    primary = String(merged.matchIds[0]);
  }

  merged.fixtureIdPrimary = primary || undefined;

  if ("cityId" in merged) {
    merged.cityId = normalizeCityKey(merged.cityId);
    merged.citySlug = merged.cityId;
  }

  merged.updatedAt = now();

  return merged;
}

async function persistTrips(trips: Trip[]) {
  await writeJson(STORAGE_KEY, trips);
}

let inflightLoad: Promise<void> | null = null;

const useTripsStore = create<TripsState>((set, get) => ({
  loaded: false,
  trips: [],

  loadTrips: async () => {
    if (get().loaded) return;
    if (inflightLoad) return inflightLoad;

    inflightLoad = (async () => {
      const raw = await readJson<unknown>(STORAGE_KEY, []);
      const arr = Array.isArray(raw) ? raw : [];
      const cleaned = arr
        .map(cleanLoadedTrip)
        .filter((trip): trip is Trip => trip !== null);
      const sorted = sortTrips(cleaned);

      set({ trips: sorted, loaded: true });

      if (isDevRuntime() && sorted.length === 0) {
        try {
          await get().seedMockTrips();
        } catch {
          // dev-only
        }
      }
    })()
      .catch(() => {
        set({ trips: [], loaded: true });
      })
      .finally(() => {
        inflightLoad = null;
      });

    return inflightLoad;
  },

  addTrip: async (input) => {
    if (!get().loaded) await get().loadTrips();

    const cityIdNorm = normalizeCityKey(input.cityId);
    const startDate = cleanString(input.startDate);
    const endDate = cleanString(input.endDate);

    if (!cityIdNorm) throw new Error("cityId required");
    if (!isIsoDateOnly(startDate)) throw new Error("startDate must be YYYY-MM-DD");
    if (!isIsoDateOnly(endDate)) throw new Error("endDate must be YYYY-MM-DD");

    const matchIds = Array.isArray(input.matchIds) ? cleanMatchIds(input.matchIds) : [];
    const fixtureIdPrimaryRaw = cleanString(input.fixtureIdPrimary);
    const fixtureIdPrimary =
      fixtureIdPrimaryRaw || (matchIds[0] ? String(matchIds[0]) : "");

    const nextMatchIds = fixtureIdPrimary
      ? uniqPush([...matchIds], fixtureIdPrimary)
      : matchIds;

    const displayCity =
      typeof input.displayCity === "string" && input.displayCity.trim()
        ? input.displayCity.trim()
        : undefined;

    const trip: Trip = {
      ...(input as Trip),
      id: makeTripId(),
      cityId: cityIdNorm,
      citySlug: cityIdNorm,
      startDate,
      endDate,
      matchIds: nextMatchIds,
      fixtureIdPrimary: fixtureIdPrimary || undefined,
      notes: typeof input.notes === "string" ? input.notes.trim() || undefined : undefined,
      ...(displayCity ? { displayCity } : {}),
      createdAt: now(),
      updatedAt: now(),
    };

    const next = sortTrips([trip, ...get().trips]);
    set({ trips: next, loaded: true });

    try {
      await persistTrips(next);
    } catch {}

    return trip;
  },

  updateTrip: async (tripId, patch) => {
    if (!get().loaded) await get().loadTrips();

    const id = cleanString(tripId);
    if (!id) return;

    let changed = false;

    const next = get().trips.map((trip) => {
      if (trip.id !== id) return trip;

      const normalizedPatch = normalizeTripPatch(trip, patch);
      const merged = normalizeMergedTrip(trip, normalizedPatch);
      changed = true;
      return merged;
    });

    if (!changed) return;

    const sorted = sortTrips(next);
    set({ trips: sorted, loaded: true });

    try {
      await persistTrips(sorted);
    } catch {}
  },

  addMatchToTrip: async (tripId, fixtureId, opts) => {
    if (!get().loaded) await get().loadTrips();

    const id = cleanString(tripId);
    const fid = cleanString(fixtureId);
    if (!id || !fid) return;

    const setPrimary = Boolean(opts?.setPrimary);

    const next = get().trips.map((trip) => {
      if (trip.id !== id) return trip;

      const matchIds = Array.isArray(trip.matchIds) ? cleanMatchIds(trip.matchIds) : [];
      const mergedIds = uniqPush([...matchIds], fid);

      return {
        ...trip,
        matchIds: mergedIds,
        fixtureIdPrimary: setPrimary
          ? fid
          : cleanString(trip.fixtureIdPrimary) || mergedIds[0] || undefined,
        updatedAt: now(),
      };
    });

    const sorted = sortTrips(next);
    set({ trips: sorted, loaded: true });

    try {
      await persistTrips(sorted);
    } catch {}
  },

  removeMatchFromTrip: async (tripId, fixtureId) => {
    if (!get().loaded) await get().loadTrips();

    const id = cleanString(tripId);
    const fid = cleanString(fixtureId);
    if (!id || !fid) return;

    const next = get().trips.map((trip) => {
      if (trip.id !== id) return trip;

      const matchIds = Array.isArray(trip.matchIds) ? cleanMatchIds(trip.matchIds) : [];
      const after = removeFrom(matchIds, fid);

      const nextTrip: Trip = {
        ...trip,
        matchIds: after,
        updatedAt: now(),
      };

      const primary = cleanString(nextTrip.fixtureIdPrimary);
      if (primary === fid) nextTrip.fixtureIdPrimary = after[0] || undefined;
      if (!nextTrip.fixtureIdPrimary && after.length > 0) {
        nextTrip.fixtureIdPrimary = after[0];
      }

      return nextTrip;
    });

    const sorted = sortTrips(next);
    set({ trips: sorted, loaded: true });

    try {
      await persistTrips(sorted);
    } catch {}
  },

  setPrimaryMatchForTrip: async (tripId, fixtureId) => {
    await get().addMatchToTrip(tripId, fixtureId, { setPrimary: true });
  },

  deleteTripCascade: async (tripId) => {
    if (!get().loaded) await get().loadTrips();

    const id = cleanString(tripId);
    if (!id) return;

    try {
      await savedItemsStore.clearTrip(id, { deleteAttachmentFiles: true });
    } catch {}

    const nextTrips = get().trips.filter((trip) => trip.id !== id);
    set({ trips: nextTrips, loaded: true });

    try {
      await persistTrips(nextTrips);
    } catch {}

    try {
      const validTripIds = nextTrips.map((trip) => String(trip.id));
      await savedItemsStore.clearOrphans(validTripIds, { deleteAttachmentFiles: true });
    } catch {}
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
        fixtureIdPrimary: seed.matchIds?.[0] ? String(seed.matchIds[0]) : undefined,
        notes: seed.notes,
      });

      const matchTitle =
        seed.matchIds && seed.matchIds.length
          ? String(seed.matchIds[0]).replace(/-/g, " ")
          : undefined;

      const built = buildMockSavedItemsForSeed({
        tripId: trip.id,
        cityName: seed.cityId,
        startDate: seed.startDate,
        endDate: seed.endDate,
        matchTitle,
      });

      for (const item of built.items) {
        try {
          await savedItemsStore.add({
            tripId: built.tripId,
            type: item.type,
            status: item.status,
            title: item.title,
            partnerId: item.partnerId,
            partnerUrl: item.partnerUrl,
            priceText: item.priceText,
            currency: item.currency,
            metadata: item.metadata,
          });
        } catch {}
      }
    }
  },
}));

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

  addMatchToTrip: async (tripId: string, fixtureId: string, opts?: { setPrimary?: boolean }) => {
    await useTripsStore.getState().addMatchToTrip(tripId, fixtureId, opts);
  },

  removeMatchFromTrip: async (tripId: string, fixtureId: string) => {
    await useTripsStore.getState().removeMatchFromTrip(tripId, fixtureId);
  },

  setPrimaryMatchForTrip: async (tripId: string, fixtureId: string) => {
    await useTripsStore.getState().setPrimaryMatchForTrip(tripId, fixtureId);
  },

  deleteTripCascade: async (tripId: string) => {
    await useTripsStore.getState().deleteTripCascade(tripId);
  },

  removeTrip: async (tripId: string) => {
    await useTripsStore.getState().deleteTripCascade(tripId);
  },

  clearAll: async () => {
    await useTripsStore.getState().clearAll();
  },

  seedMockTrips: async () => {
    await useTripsStore.getState().seedMockTrips();
  },

  getById: (tripId?: string) => {
    const id = cleanString(tripId);
    if (!id) return null;

    const state = useTripsStore.getState();
    const trip = state.trips.find((entry) => entry.id === id) ?? null;
    return cloneTrip(trip);
  },

  getByCityId: (cityId?: string) => {
    const id = normalizeCityKey(cityId);
    const state = useTripsStore.getState();

    return state.trips
      .filter((trip) => normalizeCityKey(trip.cityId) === id)
      .map((trip) => cloneTrip(trip) as Trip);
  },

  upsertTripSnapshot: async (
    tripId: string,
    snapshot: Partial<
      Pick<
        Trip,
        | "homeName"
        | "awayName"
        | "leagueName"
        | "leagueId"
        | "kickoffIso"
        | "kickoffTbc"
        | "venueName"
        | "venueCity"
        | "displayCity"
      >
    > &
      UnknownRecord
  ) => {
    const id = cleanString(tripId);
    if (!id) return;

    await useTripsStore.getState().updateTrip(id, snapshot);
  },

  getTripByMatchId: (fixtureId: string) => {
    const id = cleanString(fixtureId);
    if (!id) return null;

    const state = useTripsStore.getState();
    const trip =
      state.trips.find((entry) => Array.isArray(entry.matchIds) && entry.matchIds.includes(id)) ??
      null;

    return cloneTrip(trip);
  },

  getTripIdByMatchId: (fixtureId: string) => {
    const trip = tripsStore.getTripByMatchId(fixtureId);
    return trip?.id ?? null;
  },
};

export default tripsStore;
export { useTripsStore };
export type { Trip };
