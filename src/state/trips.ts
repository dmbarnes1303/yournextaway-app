// src/state/trips.ts
import storage from "@/src/services/storage";

/**
 * Trips store (no external state libs)
 *
 * Goals:
 * - Works on web + native (best-effort persistence via storage.ts)
 * - Never hard-crashes if storage is unavailable
 * - Simple subscribe/getState API used across Home/Trips/Trip Build
 */

export type Trip = {
  id: string;

  // Primary destination identity (can be a city name for now)
  cityId?: string;

  // Optional future-proofing
  citySlug?: string;

  // Match/fixture ids (API-Football fixture id strings)
  matchIds?: string[];

  // ISO date-only: YYYY-MM-DD
  startDate?: string;
  endDate?: string;

  notes?: string;

  createdAt?: number;
  updatedAt?: number;
};

type TripsState = {
  loaded: boolean;
  trips: Trip[];
};

type Listener = (s: TripsState) => void;

const STORAGE_KEY = "yna.trips.v1";

let state: TripsState = {
  loaded: false,
  trips: [],
};

const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(state);
}

function setState(next: Partial<TripsState>) {
  state = { ...state, ...next };
  emit();
}

function now() {
  return Date.now();
}

function safeId(): string {
  // No deps. Good enough uniqueness for local storage.
  return `t_${now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function isIsoDateOnly(s: unknown): s is string {
  if (typeof s !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

function normalizeTrip(input: any): Trip | null {
  if (!input || typeof input !== "object") return null;

  const id = String(input.id ?? "").trim();
  if (!id) return null;

  const matchIdsRaw = Array.isArray(input.matchIds) ? input.matchIds : [];
  const matchIds = matchIdsRaw
    .map((x: any) => String(x ?? "").trim())
    .filter(Boolean);

  const t: Trip = {
    id,
    cityId: typeof input.cityId === "string" ? input.cityId : undefined,
    citySlug: typeof input.citySlug === "string" ? input.citySlug : undefined,
    matchIds: matchIds.length ? matchIds : undefined,
    startDate: isIsoDateOnly(input.startDate) ? input.startDate : undefined,
    endDate: isIsoDateOnly(input.endDate) ? input.endDate : undefined,
    notes: typeof input.notes === "string" ? input.notes : undefined,
    createdAt: typeof input.createdAt === "number" ? input.createdAt : undefined,
    updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : undefined,
  };

  return t;
}

function normalizeTripsList(input: any): Trip[] {
  const arr = Array.isArray(input) ? input : [];
  const out: Trip[] = [];
  for (const item of arr) {
    const t = normalizeTrip(item);
    if (t) out.push(t);
  }

  // Keep newest first (use updatedAt/createdAt fallback)
  out.sort((a, b) => {
    const at = a.updatedAt ?? a.createdAt ?? 0;
    const bt = b.updatedAt ?? b.createdAt ?? 0;
    return bt - at;
  });

  return out;
}

async function persist(trips: Trip[]) {
  // Best-effort; storage.ts already avoids throwing.
  await storage.setJSON(STORAGE_KEY, trips);
}

async function loadTrips(): Promise<void> {
  try {
    const saved = await storage.getJSON<any>(STORAGE_KEY);
    const trips = normalizeTripsList(saved);
    setState({ trips, loaded: true });
  } catch {
    // Never block the app if persistence fails
    setState({ trips: [], loaded: true });
  }
}

async function addTrip(patch: Omit<Trip, "id"> & Partial<Pick<Trip, "id">>): Promise<Trip> {
  const id = String((patch as any)?.id ?? "").trim() || safeId();
  const t: Trip = {
    id,
    cityId: patch.cityId,
    citySlug: patch.citySlug,
    matchIds: patch.matchIds?.map((x) => String(x)) ?? [],
    startDate: patch.startDate,
    endDate: patch.endDate,
    notes: patch.notes ?? "",
    createdAt: now(),
    updatedAt: now(),
  };

  const next = [t, ...state.trips];
  setState({ trips: next, loaded: true });
  await persist(next);
  return t;
}

async function updateTrip(id: string, patch: Partial<Omit<Trip, "id">>): Promise<void> {
  const tid = String(id ?? "").trim();
  if (!tid) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;

    const updated: Trip = {
      ...t,
      ...patch,
      matchIds: patch.matchIds
        ? patch.matchIds.map((x) => String(x)).filter(Boolean)
        : t.matchIds,
      updatedAt: now(),
    };

    return updated;
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

async function removeTrip(id: string): Promise<void> {
  const tid = String(id ?? "").trim();
  if (!tid) return;

  const next = state.trips.filter((t) => t.id !== tid);
  setState({ trips: next, loaded: true });
  await persist(next);
}

function getState(): TripsState {
  return state;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const tripsStore = {
  getState,
  subscribe,
  loadTrips,
  addTrip,
  updateTrip,
  removeTrip,
};

export default tripsStore;
