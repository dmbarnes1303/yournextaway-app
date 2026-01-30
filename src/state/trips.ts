// src/state/trips.ts
import storage from "@/src/services/storage";

/**
 * Trips store (no external state libs)
 *
 * Goals:
 * - Works on web + native (best-effort persistence via storage.ts)
 * - Never hard-crashes if storage is unavailable
 * - Simple subscribe/getState API used across Home/Trips/Trip Build/Trip Hub
 * - Avoid duplicate concurrent loads (single in-flight promise)
 * - Keep data clean (no empty-string notes/city fields)
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

  // Primary destination identity (treat as display label for now)
  // NOTE: legacy naming in your app currently uses cityId as a "name".
  // Keep cityId for backward compatibility, but prefer setting cityName going forward.
  cityId?: string;
  cityName?: string;

  // Optional future-proofing
  citySlug?: string;

  // Match/fixture ids (API-Football fixture id strings)
  matchIds?: string[];

  // ISO date-only: YYYY-MM-DD
  startDate?: string;
  endDate?: string;

  // Free text notes
  notes?: string;

  // Quick-access links + itinerary
  links?: TripLinkItem[];
  itinerary?: TripItineraryItem[];

  createdAt?: number;
  updatedAt?: number;
};

type TripsState = {
  loaded: boolean;
  loading: boolean;
  trips: Trip[];
};

type Listener = (s: TripsState) => void;

const STORAGE_KEY = "yna.trips.v2";

let state: TripsState = {
  loaded: false,
  loading: false,
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

function normNonEmptyString(x: unknown): string | undefined {
  const v = normString(x);
  return v.length ? v : undefined;
}

function normUrl(x: unknown): string | undefined {
  const u = normString(x);
  return u.length ? u : undefined;
}

function normLinkGroup(x: unknown): TripLinkGroup {
  const v = normString(x).toLowerCase();
  if (v === "stay" || v === "travel" || v === "tickets" || v === "links") return v;
  return "links";
}

function normalizeLinkItem(input: any): TripLinkItem | null {
  if (!input || typeof input !== "object") return null;

  const id = normNonEmptyString(input.id);
  const url = normUrl(input.url);
  if (!id || !url) return null;

  const title = normNonEmptyString(input.title) ?? "Link";

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

  const id = normNonEmptyString(input.id);
  const title = normNonEmptyString(input.title);
  if (!id || !title) return null;

  const date = isIsoDateOnly(input.date) ? input.date : undefined;
  const time = isTimeHHMM(input.time) ? input.time : undefined;
  const notes = normNonEmptyString(input.notes);

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

  const id = normNonEmptyString(input.id);
  if (!id) return null;

  const matchIdsRaw = Array.isArray(input.matchIds) ? input.matchIds : [];
  const matchIds = matchIdsRaw.map((x: any) => normString(x)).filter(Boolean);

  const linksRaw = Array.isArray(input.links) ? input.links : [];
  const links = linksRaw.map((x: any) => normalizeLinkItem(x)).filter(Boolean) as TripLinkItem[];

  const itineraryRaw = Array.isArray(input.itinerary) ? input.itinerary : [];
  const itinerary = itineraryRaw.map((x: any) => normalizeItineraryItem(x)).filter(Boolean) as TripItineraryItem[];

  // Backward compatible: some older saved trips may have cityId only (used as a display name).
  const cityId = normNonEmptyString(input.cityId);
  const cityName = normNonEmptyString(input.cityName);

  const t: Trip = {
    id,
    cityId,
    cityName,
    citySlug: normNonEmptyString(input.citySlug),
    matchIds: matchIds.length ? matchIds : undefined,
    startDate: isIsoDateOnly(input.startDate) ? input.startDate : undefined,
    endDate: isIsoDateOnly(input.endDate) ? input.endDate : undefined,
    notes: normNonEmptyString(input.notes),
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
  // Best-effort persist; let callers decide whether to handle failures.
  await storage.setJSON(STORAGE_KEY, trips);
}

/**
 * Date bucketing helper (used by Trips screen or any consumer)
 * - upcoming: startDate >= today
 * - past: startDate < today
 * - draft: no startDate (or invalid)
 */
export function bucketTripsByDate(trips: Trip[]): { upcoming: Trip[]; past: Trip[]; draft: Trip[] } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const upcoming: Trip[] = [];
  const past: Trip[] = [];
  const draft: Trip[] = [];

  for (const t of trips) {
    if (!t.startDate) {
      draft.push(t);
      continue;
    }
    const d = new Date(`${t.startDate}T00:00:00Z`);
    const ts = !Number.isNaN(d.getTime()) ? d.getTime() : null;
    if (ts == null) draft.push(t);
    else if (ts >= todayTs) upcoming.push(t);
    else past.push(t);
  }

  return { upcoming, past, draft };
}

/**
 * Sort helper:
 * - upcoming first (by startDate asc)
 * - then drafts (updated/newest)
 * - then past (most recent past first)
 */
export function sortTripsSmart(trips: Trip[]): Trip[] {
  const { upcoming, past, draft } = bucketTripsByDate(trips);

  const upcomingSorted = [...upcoming].sort((a, b) => {
    const at = a.startDate ? new Date(`${a.startDate}T00:00:00Z`).getTime() : 0;
    const bt = b.startDate ? new Date(`${b.startDate}T00:00:00Z`).getTime() : 0;
    return at - bt;
  });

  const draftsSorted = [...draft].sort((a, b) => {
    const at = a.updatedAt ?? a.createdAt ?? 0;
    const bt = b.updatedAt ?? b.createdAt ?? 0;
    return bt - at;
  });

  const pastSorted = [...past].sort((a, b) => {
    const at = a.startDate ? new Date(`${a.startDate}T00:00:00Z`).getTime() : 0;
    const bt = b.startDate ? new Date(`${b.startDate}T00:00:00Z`).getTime() : 0;
    // more recent past first
    return bt - at;
  });

  return [...upcomingSorted, ...draftsSorted, ...pastSorted];
}

/* ----------------------------- Load (guarded) ---------------------------- */

let loadPromise: Promise<void> | null = null;

async function loadTrips(force = false): Promise<void> {
  if (state.loaded && !force) return;
  if (loadPromise) return loadPromise;

  setState({ loading: true });

  loadPromise = (async () => {
    try {
      const saved = await storage.getJSON<any>(STORAGE_KEY);
      const trips = normalizeTripsList(saved);
      setState({ trips, loaded: true, loading: false });
    } catch {
      setState({ trips: [], loaded: true, loading: false });
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/* ------------------------------ Core CRUD -------------------------------- */

async function addTrip(patch: Omit<Trip, "id"> & Partial<Pick<Trip, "id">>): Promise<Trip> {
  const id = normNonEmptyString((patch as any)?.id) ?? safeId();

  const matchIds = (patch.matchIds ?? []).map((x) => normString(x)).filter(Boolean);
  const links = (patch.links ?? []).map((x) => normalizeLinkItem(x)).filter(Boolean) as TripLinkItem[];
  const itinerary = (patch.itinerary ?? []).map((x) => normalizeItineraryItem(x)).filter(Boolean) as TripItineraryItem[];

  const t: Trip = {
    id,
    cityId: normNonEmptyString(patch.cityId),
    cityName: normNonEmptyString((patch as any).cityName),
    citySlug: normNonEmptyString(patch.citySlug),
    matchIds: matchIds.length ? matchIds : undefined,
    startDate: isIsoDateOnly(patch.startDate) ? patch.startDate : undefined,
    endDate: isIsoDateOnly(patch.endDate) ? patch.endDate : undefined,
    notes: normNonEmptyString(patch.notes),
    links: links.length ? links : undefined,
    itinerary: itinerary.length ? itinerary : undefined,
    createdAt: now(),
    updatedAt: now(),
  };

  const next = [t, ...state.trips];
  setState({ trips: next, loaded: true });
  await persist(next);
  return t;
}

async function updateTrip(id: string, patch: Partial<Omit<Trip, "id">>): Promise<void> {
  const tid = normNonEmptyString(id);
  if (!tid) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;

    const matchIds = patch.matchIds
      ? patch.matchIds.map((x) => normString(x)).filter(Boolean)
      : t.matchIds;

    const links = patch.links
      ? (patch.links.map((x: any) => normalizeLinkItem(x)).filter(Boolean) as TripLinkItem[])
      : t.links;

    const itinerary = patch.itinerary
      ? (patch.itinerary.map((x: any) => normalizeItineraryItem(x)).filter(Boolean) as TripItineraryItem[])
      : t.itinerary;

    const updated: Trip = {
      ...t,
      ...patch,
      cityId: patch.cityId !== undefined ? normNonEmptyString(patch.cityId) : t.cityId,
      cityName: (patch as any).cityName !== undefined ? normNonEmptyString((patch as any).cityName) : t.cityName,
      citySlug: patch.citySlug !== undefined ? normNonEmptyString(patch.citySlug) : t.citySlug,
      matchIds,
      startDate: patch.startDate !== undefined ? (isIsoDateOnly(patch.startDate) ? patch.startDate : undefined) : t.startDate,
      endDate: patch.endDate !== undefined ? (isIsoDateOnly(patch.endDate) ? patch.endDate : undefined) : t.endDate,
      notes: patch.notes !== undefined ? normNonEmptyString(patch.notes) : t.notes,
      links: links && links.length ? links : undefined,
      itinerary: itinerary && itinerary.length ? itinerary : undefined,
      updatedAt: now(),
    };

    return updated;
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

async function removeTrip(id: string): Promise<void> {
  const tid = normNonEmptyString(id);
  if (!tid) return;

  const next = state.trips.filter((t) => t.id !== tid);
  setState({ trips: next, loaded: true });
  await persist(next);
}

/* ------------------------------- Helpers --------------------------------- */

function getState(): TripsState {
  return state;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getTrip(id: string): Trip | undefined {
  const tid = normNonEmptyString(id);
  if (!tid) return undefined;
  return state.trips.find((t) => t.id === tid);
}

/**
 * Create or update a trip by id.
 * Useful when "Plan trip" from Fixtures may be called multiple times.
 */
async function upsertTrip(patch: Omit<Trip, "id"> & Partial<Pick<Trip, "id">>): Promise<Trip> {
  const id = normNonEmptyString((patch as any)?.id);
  if (!id) return addTrip(patch);

  const existing = getTrip(id);
  if (!existing) return addTrip({ ...patch, id });

  await updateTrip(id, patch as any);
  return getTrip(id) ?? existing;
}

/* ------------------------------- Links API ------------------------------- */

async function addLink(tripId: string, item: TripLinkItem): Promise<void> {
  const tid = normNonEmptyString(tripId);
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
  const tid = normNonEmptyString(tripId);
  const lid = normNonEmptyString(linkId);
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
  const tid = normNonEmptyString(tripId);
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
  const tid = normNonEmptyString(tripId);
  const iid = normNonEmptyString(itemId);
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

const tripsStore = {
  getState,
  subscribe,

  loadTrips,

  getTrip,
  upsertTrip,

  addTrip,
  updateTrip,
  removeTrip,

  addLink,
  removeLink,
  addItineraryItem,
  removeItineraryItem,
};

export default tripsStore;
