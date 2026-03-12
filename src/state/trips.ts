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
/* utils                                                                      */
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

function toOptionalString(v: unknown): string | undefined {
  const s = cleanString(v);
  return s || undefined;
}

function isPlainObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Canonical city key normalizer:
 * - lowercases
 * - "&" -> "and"
 * - strips punctuation
 * - spaces -> "-"
 * - collapses repeated "-"
 */
function normalizeCityKey(cityRaw: unknown): string {
  const s = cleanString(cityRaw).toLowerCase();
  if (!s) return "trip";

  const out =
    s
      .replace(/&/g, "and")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "trip";

  return out;
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

function toOptionalNumber(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toOptionalBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

function uniqPush(arr: string[], id: string) {
  if (!arr.includes(id)) arr.push(id);
  return arr;
}

function removeFrom(arr: string[], id: string) {
  return arr.filter((x) => x !== id);
}

function cloneTrip<T extends Trip | null | undefined>(trip: T): T {
  if (!trip) return trip;
  return { ...(trip as any) };
}

/* -------------------------------------------------------------------------- */
/* cleaning + normalization                                                   */
/* -------------------------------------------------------------------------- */

function cleanLoadedTrip(raw: any): Trip | null {
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
    Number.isFinite(Number(raw.createdAt)) && Number(raw.createdAt) > 0 ? Number(raw.createdAt) : now();

  const updatedAt =
    Number.isFinite(Number(raw.updatedAt)) && Number(raw.updatedAt) > 0 ? Number(raw.updatedAt) : createdAt;

  const matchIds = cleanMatchIds(raw.matchIds);

  let fixtureIdPrimary = cleanString(raw.fixtureIdPrimary) || (matchIds[0] ? String(matchIds[0]) : "");
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

  const tripAny: any = {
    ...raw,

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

  return tripAny as Trip;
}

function normalizeTripPatch(
  current: Trip,
  patch: Partial<Omit<Trip, "id" | "createdAt">> & Record<string, any>
): Record<string, any> {
  const p: Record<string, any> = {};

  if ("startDate" in patch) {
    const v = cleanString(patch.startDate);
    if (isIsoDateOnly(v)) p.startDate = v;
  }

  if ("endDate" in patch) {
    const v = cleanString(patch.endDate);
    if (isIsoDateOnly(v)) p.endDate = v;
  }

  if ("cityId" in patch) {
    p.cityId = normalizeCityKey(patch.cityId);
    p.citySlug = p.cityId;
  }

  if ("citySlug" in patch && !("cityId" in patch)) {
    p.citySlug = normalizeCityKey(patch.citySlug ?? current.cityId);
  }

  if ("displayCity" in patch) {
    p.displayCity = toOptionalString(patch.displayCity);
  }

  if ("matchIds" in patch) {
    p.matchIds = cleanMatchIds(patch.matchIds);
  }

  if ("fixtureIdPrimary" in patch) {
    p.fixtureIdPrimary = toOptionalString(patch.fixtureIdPrimary);
  }

  if ("notes" in patch) {
    p.notes = typeof patch.notes === "string" ? patch.notes.trim() || undefined : undefined;
  }

  if ("homeTeamId" in patch) p.homeTeamId = toOptionalNumber(patch.homeTeamId);
  if ("awayTeamId" in patch) p.awayTeamId = toOptionalNumber(patch.awayTeamId);
  if ("leagueId" in patch) p.leagueId = toOptionalNumber(patch.leagueId);
  if ("sportsevents365EventId" in patch) p.sportsevents365EventId = toOptionalNumber(patch.sportsevents365EventId);
  if ("kickoffTbc" in patch) p.kickoffTbc = toOptionalBool(patch.kickoffTbc);

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
      p[key] = toOptionalString(patch[key]);
    }
  }

  return p;
}

function normalizeMergedTrip(current: Trip, patch: Record<string, any>): Trip {
  const merged: any = { ...(current as any), ...patch };

  const mids: string[] = Array.isArray(merged.matchIds) ? cleanMatchIds(merged.matchIds) : [];
  let primary = cleanString(merged.fixtureIdPrimary);

  if (primary && !mids.includes(primary)) {
    merged.matchIds = [...mids, primary];
  } else {
    merged.matchIds = mids;
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

  return merged as Trip;
}

async function persistTrips(trips: Trip[]) {
  await writeJson(STORAGE_KEY, trips);
}

/* -------------------------------------------------------------------------- */
/* state                                                                      */
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
    fixtureIdPrimary?: string;
    notes?: string;
    [k: string]: any;
  }) => Promise<Trip>;

  updateTrip: (tripId: string, patch: Partial<Omit<Trip, "id" | "createdAt">> & Record<string, any>) => Promise<void>;

  addMatchToTrip: (tripId: string, fixtureId: string, opts?: { setPrimary?: boolean }) => Promise<void>;
  removeMatchFromTrip: (tripId: string, fixtureId: string) => Promise<void>;
  setPrimaryMatchForTrip: (tripId: string, fixtureId: string) => Promise<void>;

  deleteTripCascade: (tripId: string) => Promise<void>;
  clearAll: () => Promise<void>;
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

      // @ts-ignore
      if (typeof __DEV__ !== "undefined" && __DEV__ && sorted.length === 0) {
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
    const fixtureIdPrimary = fixtureIdPrimaryRaw || (matchIds[0] ? String(matchIds[0]) : "");

    const nextMatchIds = fixtureIdPrimary ? uniqPush([...matchIds], fixtureIdPrimary) : matchIds;

    const displayCity =
      typeof input.displayCity === "string" && input.displayCity.trim()
        ? input.displayCity.trim()
        : undefined;

    const tripAny: any = {
      ...input,

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

    const next = sortTrips([tripAny as Trip, ...get().trips]);
    set({ trips: next, loaded: true });

    try {
      await persistTrips(next);
    } catch {}

    return tripAny as Trip;
  },

  updateTrip: async (tripId, patch) => {
    if (!get().loaded) await get().loadTrips();

    const id = cleanString(tripId);
    if (!id) return;

    let changed = false;

    const next = get().trips.map((t) => {
      if (t.id !== id) return t;

      const normalizedPatch = normalizeTripPatch(t, patch);
      const merged = normalizeMergedTrip(t, normalizedPatch);
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

    const setPrimary = !!opts?.setPrimary;

    const next = get().trips.map((t) => {
      if (t.id !== id) return t;

      const mids = Array.isArray(t.matchIds) ? cleanMatchIds(t.matchIds) : [];
      const mergedIds = uniqPush([...mids], fid);

      const out: any = {
        ...(t as any),
        matchIds: mergedIds,
        fixtureIdPrimary: setPrimary ? fid : cleanString((t as any).fixtureIdPrimary) || mergedIds[0] || undefined,
        updatedAt: now(),
      };

      return out as Trip;
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

    const next = get().trips.map((t) => {
      if (t.id !== id) return t;

      const mids = Array.isArray(t.matchIds) ? cleanMatchIds(t.matchIds) : [];
      const after = removeFrom(mids, fid);

      const out: any = { ...(t as any), matchIds: after, updatedAt: now() };

      const primary = cleanString(out.fixtureIdPrimary);
      if (primary === fid) out.fixtureIdPrimary = after[0] || undefined;
      if (!out.fixtureIdPrimary && after.length > 0) out.fixtureIdPrimary = after[0];

      return out as Trip;
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

    const nextTrips = get().trips.filter((t) => t.id !== id);
    set({ trips: nextTrips, loaded: true });

    try {
      await persistTrips(nextTrips);
    } catch {}

    try {
      const validTripIds = nextTrips.map((t) => String(t.id));
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
/* wrapper                                                                    */
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

    const s = useTripsStore.getState();
    const trip = s.trips.find((t) => t.id === id) ?? null;
    return cloneTrip(trip);
  },

  getByCityId: (cityId?: string) => {
    const id = normalizeCityKey(cityId);
    const s = useTripsStore.getState();

    return s.trips
      .filter((t) => normalizeCityKey(t.cityId) === id)
      .map((t) => cloneTrip(t) as Trip);
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
      Record<string, any>
  ) => {
    const id = cleanString(tripId);
    if (!id) return;

    await useTripsStore.getState().updateTrip(id, snapshot as any);
  },

  getTripByMatchId: (fixtureId: string) => {
    const id = cleanString(fixtureId);
    if (!id) return null;

    const s = useTripsStore.getState();
    const trip = s.trips.find((t) => Array.isArray(t.matchIds) && t.matchIds.includes(id)) ?? null;
    return cloneTrip(trip);
  },

  getTripIdByMatchId: (fixtureId: string) => {
    const t = tripsStore.getTripByMatchId(fixtureId);
    return t?.id ?? null;
  },
};

export default tripsStore;
export { useTripsStore };
export type { Trip };
