// src/state/trips.ts
import storage from "@/src/services/storage";

export interface Trip {
  id: string;
  cityId: string;     // v1: store a simple city label (we’ll map to slugs later)
  matchIds: string[];
  startDate: string;
  endDate: string;
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

async function persist() {
  await storage.setJSON(STORAGE_KEY, state.trips);
}

async function loadTrips() {
  const saved = await storage.getJSON<Trip[]>(STORAGE_KEY);
  state = {
    loaded: true,
    trips: Array.isArray(saved) ? saved : [],
  };
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
  state = { ...state, trips: [t, ...state.trips] };
  emit();
  await persist();
  return t;
}

async function updateTrip(id: string, patch: Partial<Omit<Trip, "id">>) {
  state = {
    ...state,
    trips: state.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
  emit();
  await persist();
}

async function removeTrip(id: string) {
  state = { ...state, trips: state.trips.filter((t) => t.id !== id) };
  emit();
  await persist();
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
