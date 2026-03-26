import { create } from "zustand";

import { makeTripId } from "@/src/core/id";
import type { FixtureId, Trip } from "@/src/core/tripTypes";
import { buildMockSavedItemsForSeed } from "@/src/data/mockTripItems";
import { MOCK_TRIP_SEEDS } from "@/src/data/mockTrips";
import { readJson, writeJson } from "@/src/state/persist";
import savedItemsStore from "@/src/state/savedItems";

const STORAGE_KEY = "yna_trips_v1";

type TripSnapshotPatch = Partial<
  Pick<
    Trip,
    | "displayCity"
    | "fixtureIdPrimary"
    | "homeTeamId"
    | "awayTeamId"
    | "homeName"
    | "awayName"
    | "leagueId"
    | "leagueName"
    | "round"
    | "kickoffIso"
    | "kickoffTbc"
    | "venueName"
    | "venueCity"
    | "sportsevents365EventId"
    | "sportsevents365EventUrl"
  >
>;

type AddTripInput = {
  cityId: string;
  citySlug?: string;
  displayCity?: string;
  startDate: string;
  endDate: string;
  matchIds?: FixtureId[];
  fixtureIdPrimary?: FixtureId;
  notes?: string;
} & TripSnapshotPatch;

type UpdateTripInput = Partial<
  Pick<Trip, "cityId" | "citySlug" | "displayCity" | "startDate" | "endDate" | "matchIds" | "fixtureIdPrimary" | "notes">
> &
  TripSnapshotPatch;

type TripsState = {
  loaded: boolean;
  trips: Trip[];

  loadTrips: () => Promise<void>;

  addTrip: (input: AddTripInput) => Promise<Trip>;
  updateTrip: (tripId: string, patch: UpdateTripInput) => Promise<void>;

  addMatchToTrip: (
    tripId: string,
    fixtureId: string,
    opts?: { setPrimary?: boolean }
  ) => Promise<void>;

  removeMatchFromTrip: (tripId: string, fixtureId: string) => Promise<void>;

  setPrimaryMatchForTrip: (tripId: string, fixtureId: string) => Promise<void>;

  /**
   * Canonical atomic helper for primary-match changes.
   * Ensures the match is present, marks it primary, and updates the root snapshot
   * in one write.
   */
  applyPrimaryMatchSelection: (
    tripId: string,
    fixtureId: string,
    snapshot?: TripSnapshotPatch
  ) => Promise<void>;

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
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

function cleanMatchIds(value: unknown): FixtureId[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((matchId) => cleanString(matchId))
    .filter(Boolean)
    .filter((entry, index, array) => array.indexOf(entry) === index);
}

function uniqPush(arr: string[], id: string) {
  if (!arr.includes(id)) arr.push(id);
  return arr;
}

function removeFrom(arr: string[], id: string) {
  return arr.filter((entry) => entry !== id);
}

function sortTrips(trips: Trip[]) {
  const copy = [...trips];
  copy.sort((a, b) => (Number(b.updatedAt ?? 0) || 0) - (Number(a.updatedAt ?? 0) || 0));
  return copy;
}

function cloneTrip<T extends Trip | null | undefined>(trip: T): T {
  if (!trip) return trip;
  return { ...trip };
}

function normalizeFixtureMembership(
  matchIdsRaw: unknown,
  primaryRaw: unknown
): { matchIds: FixtureId[]; fixtureIdPrimary?: FixtureId } {
  const matchIds = cleanMatchIds(matchIdsRaw);
  let fixtureIdPrimary = cleanString(primaryRaw);

  if (fixtureIdPrimary && !matchIds.includes(fixtureIdPrimary)) {
    matchIds.push(fixtureIdPrimary);
  }

  if (!fixtureIdPrimary && matchIds.length > 0) {
    fixtureIdPrimary = String(matchIds[0]);
  }

  return {
    matchIds,
    fixtureIdPrimary: fixtureIdPrimary || undefined,
  };
}

function normalizeSnapshotPatch(input: TripSnapshotPatch): TripSnapshotPatch {
  const next: TripSnapshotPatch = {};

  if ("displayCity" in input) next.displayCity = toOptionalString(input.displayCity);
  if ("fixtureIdPrimary" in input) next.fixtureIdPrimary = toOptionalString(input.fixtureIdPrimary);

  if ("homeTeamId" in input) next.homeTeamId = toOptionalNumber(input.homeTeamId);
  if ("awayTeamId" in input) next.awayTeamId = toOptionalNumber(input.awayTeamId);

  if ("homeName" in input) next.homeName = toOptionalString(input.homeName);
  if ("awayName" in input) next.awayName = toOptionalString(input.awayName);

  if ("leagueId" in input) next.leagueId = toOptionalNumber(input.leagueId);
  if ("leagueName" in input) next.leagueName = toOptionalString(input.leagueName);
  if ("round" in input) next.round = toOptionalString(input.round);

  if ("kickoffIso" in input) next.kickoffIso = toOptionalString(input.kickoffIso);
  if ("kickoffTbc" in input) next.kickoffTbc = toOptionalBool(input.kickoffTbc);

  if ("venueName" in input) next.venueName = toOptionalString(input.venueName);
  if ("venueCity" in input) next.venueCity = toOptionalString(input.venueCity);

  if ("sportsevents365EventId" in input) {
    next.sportsevents365EventId = toOptionalNumber(input.sportsevents365EventId);
  }

  if ("sportsevents365EventUrl" in input) {
    next.sportsevents365EventUrl = toOptionalString(input.sportsevents365EventUrl);
  }

  return next;
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

  const membership = normalizeFixtureMembership(raw.matchIds, raw.fixtureIdPrimary);

  const displayCity =
    typeof raw.displayCity === "string" && raw.displayCity.trim()
      ? raw.displayCity.trim()
      : rawCityId && rawCityId !== cityId
        ? rawCityId
        : undefined;

  const trip: Trip = {
    id,
    cityId,
    citySlug: cityId,
    displayCity,
    startDate,
    endDate,
    matchIds: membership.matchIds,
    fixtureIdPrimary: membership.fixtureIdPrimary,
    notes: typeof raw.notes === "string" ? raw.notes.trim() || undefined : undefined,

    homeTeamId: toOptionalNumber(raw.homeTeamId),
    awayTeamId: toOptionalNumber(raw.awayTeamId),
    homeName: toOptionalString(raw.homeName),
    awayName: toOptionalString(raw.awayName),
    leagueId: toOptionalNumber(raw.leagueId),
    leagueName: toOptionalString(raw.leagueName),
    round: toOptionalString(raw.round),
    kickoffIso: toOptionalString(raw.kickoffIso),
    kickoffTbc: toOptionalBool(raw.kickoffTbc),
    venueName: toOptionalString(raw.venueName),
    venueCity: toOptionalString(raw.venueCity),
    sportsevents365EventId: toOptionalNumber(raw.sportsevents365EventId),
    sportsevents365EventUrl: toOptionalString(raw.sportsevents365EventUrl),

    createdAt,
    updatedAt,
  };

  return trip;
}

function normalizeTripPatch(current: Trip, patch: UpdateTripInput): UpdateTripInput {
  const next: UpdateTripInput = {};

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

  if ("displayCity" in patch) next.displayCity = toOptionalString(patch.displayCity);

  if ("matchIds" in patch) next.matchIds = cleanMatchIds(patch.matchIds);
  if ("fixtureIdPrimary" in patch) next.fixtureIdPrimary = toOptionalString(patch.fixtureIdPrimary);

  if ("notes" in patch) {
    next.notes =
      typeof patch.notes === "string" ? patch.notes.trim() || undefined : undefined;
  }

  return {
    ...next,
    ...normalizeSnapshotPatch(patch),
  };
}

function mergeTrip(current: Trip, patch: UpdateTripInput): Trip {
  const merged: Trip = {
    ...current,
    ...patch,
    updatedAt: now(),
  };

  const membership = normalizeFixtureMembership(merged.matchIds, merged.fixtureIdPrimary);
  merged.matchIds = membership.matchIds;
  merged.fixtureIdPrimary = membership.fixtureIdPrimary;

  merged.cityId = normalizeCityKey(merged.cityId);
  merged.citySlug = merged.cityId;

  return merged;
}

function applyPrimarySelection(
  trip: Trip,
  fixtureId: string,
  snapshot?: TripSnapshotPatch
): Trip {
  const fid = cleanString(fixtureId);
  if (!fid) return trip;

  const nextMatchIds = uniqPush([...(trip.matchIds ?? [])], fid);
  const next: Trip = {
    ...trip,
    matchIds: nextMatchIds,
    fixtureIdPrimary: fid,
    updatedAt: now(),
  };

  const normalizedSnapshot = normalizeSnapshotPatch(snapshot ?? {});
  return {
    ...next,
    ...normalizedSnapshot,
  };
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
      const cleaned = arr.map(cleanLoadedTrip).filter((trip): trip is Trip => trip !== null);
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

    const cityId = normalizeCityKey(input.cityId);
    const startDate = cleanString(input.startDate);
    const endDate = cleanString(input.endDate);

    if (!cityId) throw new Error("cityId required");
    if (!isIsoDateOnly(startDate)) throw new Error("startDate must be YYYY-MM-DD");
    if (!isIsoDateOnly(endDate)) throw new Error("endDate must be YYYY-MM-DD");

    const membership = normalizeFixtureMembership(input.matchIds, input.fixtureIdPrimary);
    const snapshot = normalizeSnapshotPatch(input);

    const createdAt = now();

    const trip: Trip = {
      id: makeTripId(),
      cityId,
      citySlug: cityId,
      displayCity: toOptionalString(input.displayCity),
      startDate,
      endDate,
      matchIds: membership.matchIds,
      fixtureIdPrimary: membership.fixtureIdPrimary,
      notes: typeof input.notes === "string" ? input.notes.trim() || undefined : undefined,
      ...snapshot,
      createdAt,
      updatedAt: createdAt,
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
      const merged = mergeTrip(trip, normalizedPatch);
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

      const mergedIds = uniqPush([...(trip.matchIds ?? [])], fid);

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

      const after = removeFrom(trip.matchIds ?? [], fid);

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
    if (!get().loaded) await get().loadTrips();

    const id = cleanString(tripId);
    const fid = cleanString(fixtureId);
    if (!id || !fid) return;

    const next = get().trips.map((trip) => {
      if (trip.id !== id) return trip;
      return applyPrimarySelection(trip, fid);
    });

    const sorted = sortTrips(next);
    set({ trips: sorted, loaded: true });

    try {
      await persistTrips(sorted);
    } catch {}
  },

  applyPrimaryMatchSelection: async (tripId, fixtureId, snapshot) => {
    if (!get().loaded) await get().loadTrips();

    const id = cleanString(tripId);
    const fid = cleanString(fixtureId);
    if (!id || !fid) return;

    const next = get().trips.map((trip) => {
      if (trip.id !== id) return trip;
      return applyPrimarySelection(trip, fid, snapshot);
    });

    const sorted = sortTrips(next);
    set({ trips: sorted, loaded: true });

    try {
      await persistTrips(sorted);
    } catch {}
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

  addTrip: async (input: AddTripInput) => {
    return await useTripsStore.getState().addTrip(input);
  },

  updateTrip: async (tripId: string, patch: UpdateTripInput) => {
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

  applyPrimaryMatchSelection: async (
    tripId: string,
    fixtureId: string,
    snapshot?: TripSnapshotPatch
  ) => {
    await useTripsStore.getState().applyPrimaryMatchSelection(tripId, fixtureId, snapshot);
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

  upsertTripSnapshot: async (tripId: string, snapshot: TripSnapshotPatch) => {
    const id = cleanString(tripId);
    if (!id) return;

    await useTripsStore.getState().updateTrip(id, normalizeSnapshotPatch(snapshot));
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
export type { AddTripInput, Trip, TripSnapshotPatch, UpdateTripInput };
