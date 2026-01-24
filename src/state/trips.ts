// src/state/trips.ts
import storage from "@/src/services/storage";

export interface Trip {
  id: string;

  /**
   * Display label (legacy v1 naming).
   * Keep this for UI and backwards compatibility.
   */
  cityId: string;

  /**
   * Stable key used for guides/lookup (e.g. "london", "madrid", "paris").
   * Optional so older saved trips still load.
   */
  citySlug?: string;

  matchIds: string[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  notes: string;
}

type TripsState = {
  loaded: boolean;
  trips: Trip[];
};

type Listener = (state: TripsState) => void;

const STORAGE_KEY = "trips_v1";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Simple, dependency-free slugify.
 * - lowercases
 * - removes diacritics
 * - collapses whitespace/underscores to hyphens
 * - strips non [a-z0-9-]
 */
function slugify(input: string): string {
  const s = String(input ?? "").trim().toLowerCase();
  if (!s) return "";

  const noMarks = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return noMarks
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * If we later decide to map venue cities to canonical slugs,
 * we can add rules here (e.g. "munich" -> "munchen" if we choose).
 */
function deriveCitySlug(t: Pick<Trip, "citySlug" | "cityId">): string | undefined {
  const existing = t.citySlug ? slugify(t.citySlug) : "";
  if (existing) return existing;

  const fromLabel = t.cityId ? slugify(t.cityId) : "";
  return fromLabel || undefined;
}

let state: TripsState = { loaded: false, trips: [] };
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(state);
}

/**
 * Best-effort persistence:
 * - Never throw (UI should not get bricked by storage).
 * - If persistence fails, app still functions (state remains in memory).
 */
async function persistSafe(trips: Trip[]) {
  try {
    await storage.setJSON(STORAGE_KEY, trips);
  } catch {
    // swallow
  }
}

/**
 * Normalizes saved trips and backfills new fields.
 * This is your "migration" layer without changing the storage key.
 */
function normalizeTrips(raw: any): Trip[] {
  if (!Array.isArray(raw)) return [];

  const out: Trip[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;

    const id = typeof x.id === "string" ? x.id : uid();
    const cityId = typeof x.cityId === "string" ? x.cityId : "Trip";
    const matchIds = Array.isArray(x.matchIds) ? x.matchIds.map(String) : [];
    const startDate = typeof x.startDate === "string" ? x.startDate : "";
    const endDate = typeof x.endDate === "string" ? x.endDate : "";
    const notes = typeof x.notes === "string" ? x.notes : "";

    const base: Trip = {
      id,
      cityId,
      matchIds,
      startDate,
      endDate,
      notes,
    };

    const citySlug = deriveCitySlug({ cityId: base.cityId, citySlug: (x as any).citySlug });

    out.push({
      ...base,
      ...(citySlug ? { citySlug } : {}),
    });
  }

  return out;
}

async function loadTrips() {
  let nextTrips: Trip[] = [];
  try {
    const saved = await storage.getJSON<any>(STORAGE_KEY);
    nextTrips = normalizeTrips(saved);
  } catch {
    nextTrips = [];
  }

  state = { loaded: true, trips: nextTrips };
  emit();

  // If we backfilled citySlug for older items, persist quietly.
  await persistSafe(nextTrips);
}

function getState() {
  return state;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function addTrip(input: Omit<Trip, "id">) {
  const citySlug = deriveCitySlug({ cityId: input.cityId, citySlug: input.citySlug });

  const t: Trip = {
    id: uid(),
    ...input,
    ...(citySlug ? { citySlug } : {}),
  };

  const nextTrips = [t, ...state.trips];

  state = { loaded: true, trips: nextTrips };
  emit();

  await persistSafe(nextTrips);
  return t;
}

async function updateTrip(id: string, patch: Partial<Omit<Trip, "id">>) {
  const nextTrips = state.trips.map((t) => {
    if (t.id !== id) return t;

    const next = { ...t, ...patch };

    const patchTouchesCitySlug = Object.prototype.hasOwnProperty.call(patch, "citySlug");
    const patchTouchesCityId = Object.prototype.hasOwnProperty.call(patch, "cityId");

    if (!patchTouchesCitySlug && patchTouchesCityId) {
      const derived = deriveCitySlug({ cityId: next.cityId, citySlug: next.citySlug });
      return { ...next, ...(derived ? { citySlug: derived } : {}) };
    }

    if (patchTouchesCitySlug) {
      const normalized = next.citySlug ? slugify(next.citySlug) : undefined;
      return { ...next, ...(normalized ? { citySlug: normalized } : { citySlug: undefined }) };
    }

    return next;
  });

  state = { loaded: true, trips: nextTrips };
  emit();

  await persistSafe(nextTrips);
}

async function removeTrip(id: string) {
  const nextTrips = state.trips.filter((t) => t.id !== id);

  state = { loaded: true, trips: nextTrips };
  emit();

  await persistSafe(nextTrips);
}

export default {
  STORAGE_KEY,
  getState,
  subscribe,
  loadTrips,
  addTrip,
  updateTrip,
  removeTrip,
};
