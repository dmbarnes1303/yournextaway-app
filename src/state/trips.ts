// src/state/trips.ts
import storage from "@/src/services/storage";

/**
 * Trips store (no external state libs)
 *
 * Goals:
 * - Works on web + native (best-effort persistence via storage.ts)
 * - Never hard-crashes if storage is unavailable
 * - Simple subscribe/getState API used across Home/Trips/Trip Build/Trip Hub
 */

export type TripLinkGroup = "stay" | "travel" | "tickets" | "links";

export type TripLinkItem = {
  id: string;
  title: string;
  url: string;
  group: TripLinkGroup;
  createdAt?: number;
  updatedAt?: number;
};

export type TripItineraryItem = {
  id: string;
  title: string;
  date?: string; // ISO date-only YYYY-MM-DD
  time?: string; // HH:MM
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
};

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

  // Free text notes
  notes?: string;

  // New: quick-access links + itinerary
  links?: TripLinkItem[];
  itinerary?: TripItineraryItem[];

  createdAt?: number;
  updatedAt?: number;
};

type TripsState = {
  loaded: boolean;
  trips: Trip[];
};

type Listener = (s: TripsState) => void;

const STORAGE_KEY = "yna.trips.v2";

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
  return `t_${now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function isIsoDateOnly(s: unknown): s is string {
  if (typeof s !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

function isTimeHHMM(s: unknown): s is string {
  if (typeof s !== "string") return false;
  return /^\d{2}:\d{2}$/.test(s.trim());
}

function normString(x: unknown): string {
  return String(x ?? "").trim();
}

function normUrl(x: unknown): string {
  const u = normString(x);
  return u;
}

function normLinkGroup(x: unknown): TripLinkGroup {
  const v = normString(x).toLowerCase();
  if (v === "stay" || v === "travel" || v === "tickets" || v === "links") return v;
  return "links";
}

function normalizeLinkItem(input: any): TripLinkItem | null {
  if (!input || typeof input !== "object") return null;

  const id = normString(input.id);
  const url = normUrl(input.url);
  if (!id || !url) return null;

  const title = normString(input.title) || "Link";

  return {
    id,
    title,
    url,
    group: normLinkGroup(input.group),
    createdAt: typeof input.createdAt === "number" ? input.createdAt : undefined,
    updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : undefined,
  };
}

function normalizeItineraryItem(input: any): TripItineraryItem | null {
  if (!input || typeof input !== "object") return null;

  const id = normString(input.id);
  const title = normString(input.title);
  if (!id || !title) return null;

  const date = isIsoDateOnly(input.date) ? input.date : undefined;
  const time = isTimeHHMM(input.time) ? input.time : undefined;
  const notes = normString(input.notes) || undefined;

  return {
    id,
    title,
    date,
    time,
    notes,
    createdAt: typeof input.createdAt === "number" ? input.createdAt : undefined,
    updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : undefined,
  };
}

function normalizeTrip(input: any): Trip | null {
  if (!input || typeof input !== "object") return null;

  const id = normString(input.id);
  if (!id) return null;

  const matchIdsRaw = Array.isArray(input.matchIds) ? input.matchIds : [];
  const matchIds = matchIdsRaw.map((x: any) => normString(x)).filter(Boolean);

  const linksRaw = Array.isArray(input.links) ? input.links : [];
  const links = linksRaw
    .map((x: any) => normalizeLinkItem(x))
    .filter(Boolean) as TripLinkItem[];

  const itineraryRaw = Array.isArray(input.itinerary) ? input.itinerary : [];
  const itinerary = itineraryRaw
    .map((x: any) => normalizeItineraryItem(x))
    .filter(Boolean) as TripItineraryItem[];

  const t: Trip = {
    id,
    cityId: typeof input.cityId === "string" ? input.cityId : undefined,
    citySlug: typeof input.citySlug === "string" ? input.citySlug : undefined,
    matchIds: matchIds.length ? matchIds : undefined,
    startDate: isIsoDateOnly(input.startDate) ? input.startDate : undefined,
    endDate: isIsoDateOnly(input.endDate) ? input.endDate : undefined,
    notes: typeof input.notes === "string" ? input.notes : undefined,
    links: links.length ? links : undefined,
    itinerary: itinerary.length ? itinerary : undefined,
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
  await storage.setJSON(STORAGE_KEY, trips);
}

async function loadTrips(): Promise<void> {
  try {
    const saved = await storage.getJSON<any>(STORAGE_KEY);
    const trips = normalizeTripsList(saved);
    setState({ trips, loaded: true });
  } catch {
    setState({ trips: [], loaded: true });
  }
}

async function addTrip(patch: Omit<Trip, "id"> & Partial<Pick<Trip, "id">>): Promise<Trip> {
  const id = normString((patch as any)?.id) || safeId();

  const t: Trip = {
    id,
    cityId: patch.cityId,
    citySlug: patch.citySlug,
    matchIds: patch.matchIds?.map((x) => normString(x)).filter(Boolean),
    startDate: patch.startDate,
    endDate: patch.endDate,
    notes: patch.notes ?? "",
    links: (patch.links ?? []).slice(),
    itinerary: (patch.itinerary ?? []).slice(),
    createdAt: now(),
    updatedAt: now(),
  };

  const next = [t, ...state.trips];
  setState({ trips: next, loaded: true });
  await persist(next);
  return t;
}

async function updateTrip(id: string, patch: Partial<Omit<Trip, "id">>): Promise<void> {
  const tid = normString(id);
  if (!tid) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;

    const updated: Trip = {
      ...t,
      ...patch,
      matchIds: patch.matchIds ? patch.matchIds.map((x) => normString(x)).filter(Boolean) : t.matchIds,
      links: patch.links ? patch.links.slice() : t.links,
      itinerary: patch.itinerary ? patch.itinerary.slice() : t.itinerary,
      updatedAt: now(),
    };

    return updated;
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

async function removeTrip(id: string): Promise<void> {
  const tid = normString(id);
  if (!tid) return;

  const next = state.trips.filter((t) => t.id !== tid);
  setState({ trips: next, loaded: true });
  await persist(next);
}

/* ------------------------------- Links API ------------------------------- */

async function addLink(tripId: string, item: TripLinkItem): Promise<void> {
  const tid = normString(tripId);
  if (!tid) return;

  const it = normalizeLinkItem(item);
  if (!it) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;
    const links = Array.isArray(t.links) ? t.links.slice() : [];
    links.unshift({ ...it, updatedAt: now(), createdAt: it.createdAt ?? now() });
    return { ...t, links, updatedAt: now() };
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

async function removeLink(tripId: string, linkId: string): Promise<void> {
  const tid = normString(tripId);
  const lid = normString(linkId);
  if (!tid || !lid) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;
    const links = (t.links ?? []).filter((l) => normString(l.id) !== lid);
    return { ...t, links: links.length ? links : undefined, updatedAt: now() };
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

/* ---------------------------- Itinerary API ----------------------------- */

async function addItineraryItem(tripId: string, item: TripItineraryItem): Promise<void> {
  const tid = normString(tripId);
  if (!tid) return;

  const it = normalizeItineraryItem(item);
  if (!it) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;
    const itinerary = Array.isArray(t.itinerary) ? t.itinerary.slice() : [];
    itinerary.unshift({ ...it, updatedAt: now(), createdAt: it.createdAt ?? now() });
    return { ...t, itinerary, updatedAt: now() };
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

async function removeItineraryItem(tripId: string, itemId: string): Promise<void> {
  const tid = normString(tripId);
  const iid = normString(itemId);
  if (!tid || !iid) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;
    const itinerary = (t.itinerary ?? []).filter((x) => normString(x.id) !== iid);
    return { ...t, itinerary: itinerary.length ? itinerary : undefined, updatedAt: now() };
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

/* ------------------------------ Store API ------------------------------ */

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

  // New APIs used by Trip Hub
  addLink,
  removeLink,
  addItineraryItem,
  removeItineraryItem,
};

export default tripsStore;
