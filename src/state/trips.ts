// src/state/trips.ts
import storage from "@/src/services/storage";

export interface Trip {
  id: string;
  cityId: string; // v1 label (we’ll map to slugs later)
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

async function loadTrips() {
  try {
    const saved = await storage.getJSON<Trip[]>(STORAGE_KEY);
    state = {
      loaded: true,
      trips: Array.isArray(saved) ? saved : [],
    };
  } catch {
    state = { loaded: true, trips: [] };
  }
  emit();
}

function getState() {
  return state;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function addTrip(input: Omit<Trip, "id">) {
  const t: Trip = { id: uid(), ...input };
  const nextTrips = [t, ...state.trips];

  state = { ...state, trips: nextTrips };
  emit();

  await persistSafe(nextTrips);
  return t;
}

async function updateTrip(id: string, patch: Partial<Omit<Trip, "id">>) {
  const nextTrips = state.trips.map((t) => (t.id === id ? { ...t, ...patch } : t));

  state = { ...state, trips: nextTrips };
  emit();

  await persistSafe(nextTrips);
}

async function removeTrip(id: string) {
  const nextTrips = state.trips.filter((t) => t.id !== id);

  state = { ...state, trips: nextTrips };
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
