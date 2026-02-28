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

/**
 * Canonical city key normalizer (Option 1):
 * - lowercases
 * - "&" -> "and"
 * - strips punctuation
 * - spaces -> "-"
 * - collapses repeated "-"
 *
 * IMPORTANT: This is the *source of truth* for Trip.cityId.
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

/**
 * Conservative cleaner + snapshot-preserving:
 * - requires id, cityId, startDate, endDate
 * - start/end must be YYYY-MM-DD
 * - matchIds coerced to string[]
 * - createdAt/updatedAt defaulted sanely
 * - normalizes cityId
 * - ensures fixtureIdPrimary (if present) is in matchIds; otherwise uses matchIds[0]
 * - preserves extra fields from storage so trip stays readable
 */
function cleanLoadedTrip(raw: any): Trip | null {
  if (!raw || typeof raw !== "object") return null;

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

  // Primary fixture sanity
  const rawPrimary = cleanString(raw.fixtureIdPrimary);
  let fixtureIdPrimary = rawPrimary || (matchIds[0] ? String(matchIds[0]) : "");

  // Ensure primary is included in matchIds
  let nextMatchIds = matchIds;
  if (fixtureIdPrimary && !nextMatchIds.includes(fixtureIdPrimary)) {
    nextMatchIds = [...nextMatchIds, fixtureIdPrimary];
  }

  // If no matchIds but primary exists, set matchIds = [primary]
  if (fixtureIdPrimary && nextMatchIds.length === 0) nextMatchIds = [fixtureIdPrimary];

  // If still no primary but matchIds exist, set primary = first
  if (!fixtureIdPrimary && nextMatchIds.length > 0) fixtureIdPrimary = String(nextMatchIds[0]);

  // Preserve a nice displayCity when legacy cityId looked human
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

    // Coerce known snapshot fields to correct types
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

async function persistTrips(trips: Trip[]) {
  await writeJson(STORAGE_KEY, trips);
}

function uniqPush(arr: string[], id: string) {
  if (!arr.includes(id)) arr.push(id);
  return arr;
}

function removeFrom(arr: string[], id: string) {
  return arr.filter((x) => x !== id);
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
    fixtureIdPrimary?: string;
    notes?: string;

    // allow snapshots without changing Trip type yet
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

      notes: typeof input.notes === "string" ? input.notes.trim() : undefined,

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

    const next = get().trips.map((t) => {
      if (t.id !== id) return t;

      const p: any = { ...(patch as any) };

      if ("startDate" in p && !isIsoDateOnly(p.startDate)) delete p.startDate;
      if ("endDate" in p && !isIsoDateOnly(p.endDate)) delete p.endDate;

      if ("cityId" in p) p.cityId = normalizeCityKey(p.cityId);
      if ("citySlug" in p) p.citySlug = normalizeCityKey(p.cityId ?? t.cityId);

      if ("matchIds" in p) p.matchIds = cleanMatchIds(p.matchIds);

      if ("fixtureIdPrimary" in p) {
        const fp = cleanString(p.fixtureIdPrimary);
        p.fixtureIdPrimary = fp || undefined;
      }

      if ("notes" in p && typeof p.notes === "string") p.notes = p.notes.trim();

      if ("displayCity" in p && typeof p.displayCity === "string") {
        const dc = p.displayCity.trim();
        p.displayCity = dc || undefined;
      }

      // Coerce common snapshot numeric fields if provided
      if ("homeTeamId" in p) p.homeTeamId = toOptionalNumber(p.homeTeamId);
      if ("awayTeamId" in p) p.awayTeamId = toOptionalNumber(p.awayTeamId);
      if ("leagueId" in p) p.leagueId = toOptionalNumber(p.leagueId);
      if ("sportsevents365EventId" in p) p.sportsevents365EventId = toOptionalNumber(p.sportsevents365EventId);

      if ("kickoffTbc" in p) {
        const kb = toOptionalBool(p.kickoffTbc);
        p.kickoffTbc = kb;
      }

      // Post-normalize: if we have matchIds and primary, ensure consistency
      const merged: any = { ...(t as any), ...p };

      const mids: string[] = Array.isArray(merged.matchIds) ? cleanMatchIds(merged.matchIds) : [];
      let primary = cleanString(merged.fixtureIdPrimary);

      if (primary && !mids.includes(primary)) merged.matchIds = [...mids, primary];
      else merged.matchIds = mids;

      if (!primary && merged.matchIds.length > 0) primary = String(merged.matchIds[0]);
      merged.fixtureIdPrimary = primary || undefined;

      return { ...merged, updatedAt: now() } as Trip;
    });

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
      const merged = uniqPush([...mids], fid);

      const out: any = { ...(t as any), matchIds: merged, updatedAt: now() };
      if (setPrimary) out.fixtureIdPrimary = fid;
      if (!out.fixtureIdPrimary) out.fixtureIdPrimary = merged[0] || undefined;

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
/* Wrapper                                                                     */
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
