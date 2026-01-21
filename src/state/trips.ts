// src/state/trips.ts
import storage from "@/src/services/storage";

export type Trip = {
  id: string;
  cityId: string; // keep as string slug/id for now
  matchIds: string[]; // fixture ids as strings
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  notes: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

type TripDraft = Omit<Trip, "id" | "createdAt" | "updatedAt">;

type TripState = {
  loaded: boolean;
  trips: Trip[];
};

const STORAGE_KEY = "trips";

let state: TripState = { loaded: false, trips: [] };
const listeners = new Set<(s: TripState) => void>();

function emit() {
  for (const l of listeners) l(state);
}

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  // good enough for v1; if you want UUID later, we can add it
  return `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function persist() {
  await storage.setJSON(STORAGE_KEY, state.trips);
}

export function subscribe(listener: (s: TripState) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return state;
}

export async function loadTrips() {
  const saved = await storage.getJSON<Trip[]>(STORAGE_KEY);
  state = {
    loaded: true,
    trips: Array.isArray(saved) ? saved : [],
  };
  emit();
}

export async function addTrip(draft: TripDraft) {
  const t: Trip = {
    id: makeId(),
    ...draft,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state = { ...state, trips: [t, ...state.trips] };
  emit();
  await persist();
  return t;
}

export async function updateTrip(id: string, patch: Partial<TripDraft>) {
  const idx = state.trips.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const updated: Trip = {
    ...state.trips[idx],
    ...patch,
    updatedAt: nowIso(),
  };

  const next = state.trips.slice();
  next[idx] = updated;

  state = { ...state, trips: next };
  emit();
  await persist();
  return updated;
}

export async function removeTrip(id: string) {
  const next = state.trips.filter((t) => t.id !== id);
  state = { ...state, trips: next };
  emit();
  await persist();
}

export async function clearTrips() {
  state = { ...state, trips: [] };
  emit();
  await storage.remove(STORAGE_KEY);
}

export default {
  subscribe,
  getState,
  loadTrips,
  addTrip,
  updateTrip,
  removeTrip,
  clearTrips,
};
