// src/state/trips.ts
import storage from "@/src/services/storage";
import type { SavedItem, Trip as CoreTrip, Id } from "@/src/core/tripTypes";

/**
 * Trips store (no external state libs)
 *
 * Goals:
 * - Works on web + native (best-effort persistence via storage.ts)
 * - Never hard-crashes if storage is unavailable
 * - Simple subscribe/getState API used across Home/Trips/Trip Build/Trip Hub
 * - Guard against concurrent loads / race conditions
 * - Normalize persisted shape (avoid empty strings/arrays unless meaningful)
 * - CRITICAL: never overwrite storage before hydration completes
 *
 * Spine alignment (Phase 1):
 * - Trip includes: title, cityName/citySlug, fixtureId/matchIds, date range
 * - Adds "saved" items (SavedItem[]) for saved→pending→booked pipeline
 * - Keeps legacy "links" + "itinerary" for now (UI uses them)
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

/**
 * Local Trip shape = CoreTrip + legacy fields we still render.
 * IMPORTANT: keep it stable for current screens.
 */
export type Trip = {
  id: string;

  title?: string;

  // Prefer cityName, but keep old cityId/citySlug for compatibility
  cityName?: string;
  cityId?: string;
  citySlug?: string;

  // Spine (fixture-centric)
  fixtureId?: string;

  // Legacy (some screens still use matchIds)
  matchIds?: string[];

  // ISO date-only: YYYY-MM-DD
  startDate?: string;
  endDate?: string;

  notes?: string;

  // Legacy organiser (kept for now)
  links?: TripLinkItem[];
  itinerary?: TripItineraryItem[];

  // Spine SavedItem pipeline
  saved?: SavedItem[];

  createdAt?: number;
  updatedAt?: number;
};

type TripsState = {
  loaded: boolean;
  trips: Trip[];
};

type Listener = (s: TripsState) => void;

// Current + legacy keys (migration safety)
const STORAGE_KEY_V3 = "yna.trips.v3"; // new canonical
const STORAGE_KEY_V2 = "yna.trips.v2";
const STORAGE_KEY_V1 = "yna.trips.v1";

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

function now(): number {
  return Date.now();
}

function safeId(): string {
  return `t_${now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normString(x: unknown): string {
  return String(x ?? "").trim();
}

function isIsoDateOnly(s: unknown): s is string {
  if (typeof s !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

function isTimeHHMM(s: unknown): s is string {
  if (typeof s !== "string") return false;
  return /^\d{2}:\d{2}$/.test(s.trim());
}

function normUrl(x: unknown): string {
  return normString(x);
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

function normalizeSavedItem(input: any, tripId: string): SavedItem | null {
  if (!input || typeof input !== "object") return null;

  const id = normString(input.id);
  const category = normString(input.category) as any;
  const status = normString(input.status) as any;
  const title = normString(input.title);

  if (!id || !title) return null;

  // Minimal defensive shape: keep unknown fields out
  const createdAt = typeof input.createdAt === "number" ? input.createdAt : now();
  const updatedAt = typeof input.updatedAt === "number" ? input.updatedAt : createdAt;

  const provider = normString(input.provider) || "other";

  const out: SavedItem = {
    id,
    tripId,
    category: category || "other",
    status: status || "saved",
    title,
    subtitle: normString(input.subtitle) || undefined,
    provider: provider as any,
    partner: input.partner && typeof input.partner === "object" ? input.partner : undefined,
    price: input.price && typeof input.price === "object" ? input.price : undefined,
    reference: normString(input.reference) || undefined,
    notes: normString(input.notes) || undefined,
    walletItemIds: Array.isArray(input.walletItemIds) ? input.walletItemIds.map((x: any) => normString(x)).filter(Boolean) : undefined,
    createdAt,
    updatedAt,
  };

  return out;
}

function compactTrip(t: Trip): Trip {
  const out: Trip = { ...t };

  if (!normString(out.title)) delete out.title;

  if (!normString(out.cityName)) delete out.cityName;
  if (!normString(out.cityId)) delete out.cityId;
  if (!normString(out.citySlug)) delete out.citySlug;

  if (!normString(out.fixtureId)) delete out.fixtureId;

  if (!isIsoDateOnly(out.startDate)) delete out.startDate;
  if (!isIsoDateOnly(out.endDate)) delete out.endDate;

  if (!normString(out.notes)) delete out.notes;

  if (Array.isArray(out.matchIds)) {
    const ids = out.matchIds.map((x) => normString(x)).filter(Boolean);
    if (ids.length) out.matchIds = ids;
    else delete out.matchIds;
  }

  if (Array.isArray(out.links)) {
    const links = out.links.map((x) => normalizeLinkItem(x)).filter(Boolean) as TripLinkItem[];
    if (links.length) out.links = links;
    else delete out.links;
  }

  if (Array.isArray(out.itinerary)) {
    const it = out.itinerary.map((x) => normalizeItineraryItem(x)).filter(Boolean) as TripItineraryItem[];
    if (it.length) out.itinerary = it;
    else delete out.itinerary;
  }

  if (Array.isArray(out.saved)) {
    const saved = out.saved
      .map((x: any) => normalizeSavedItem(x, out.id))
      .filter(Boolean) as SavedItem[];
    if (saved.length) out.saved = saved;
    else delete out.saved;
  }

  return out;
}

function normalizeTrip(input: any): Trip | null {
  if (!input || typeof input !== "object") return null;

  const id = normString(input.id);
  if (!id) return null;

  const matchIdsRaw = Array.isArray(input.matchIds) ? input.matchIds : [];
  const matchIds = matchIdsRaw.map((x: any) => normString(x)).filter(Boolean);

  const linksRaw = Array.isArray(input.links) ? input.links : [];
  const links = linksRaw.map((x: any) => normalizeLinkItem(x)).filter(Boolean) as TripLinkItem[];

  const itineraryRaw = Array.isArray(input.itinerary) ? input.itinerary : [];
  const itinerary = itineraryRaw.map((x: any) => normalizeItineraryItem(x)).filter(Boolean) as TripItineraryItem[];

  const savedRaw = Array.isArray(input.saved) ? input.saved : [];
  const saved = savedRaw.map((x: any) => normalizeSavedItem(x, id)).filter(Boolean) as SavedItem[];

  // Derive fixtureId if missing but matchIds has at least one
  const fixtureId =
    typeof input.fixtureId === "string"
      ? normString(input.fixtureId) || undefined
      : matchIds.length
        ? matchIds[0]
        : undefined;

  // cityName: prefer input.cityName, else allow old cityId fallback
  const cityName =
    typeof input.cityName === "string"
      ? normString(input.cityName) || undefined
      : typeof input.cityId === "string"
        ? normString(input.cityId) || undefined
        : undefined;

  const title =
    typeof input.title === "string"
      ? normString(input.title) || undefined
      : cityName
        ? `${cityName} trip`
        : undefined;

  const t: Trip = {
    id,
    title,

    cityName,
    cityId: typeof input.cityId === "string" ? normString(input.cityId) || undefined : undefined,
    citySlug: typeof input.citySlug === "string" ? normString(input.citySlug) || undefined : undefined,

    fixtureId,
    matchIds: matchIds.length ? matchIds : undefined,

    startDate: isIsoDateOnly(input.startDate) ? input.startDate : undefined,
    endDate: isIsoDateOnly(input.endDate) ? input.endDate : undefined,

    notes: typeof input.notes === "string" ? normString(input.notes) || undefined : undefined,

    links: links.length ? links : undefined,
    itinerary: itinerary.length ? itinerary : undefined,
    saved: saved.length ? saved : undefined,

    createdAt: typeof input.createdAt === "number" ? input.createdAt : undefined,
    updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : undefined,
  };

  return compactTrip(t);
}

function normalizeTripsList(input: any): Trip[] {
  const arr = Array.isArray(input) ? input : [];
  const out: Trip[] = [];

  for (const item of arr) {
    const t = normalizeTrip(item);
    if (t) out.push(t);
  }

  // Newest first
  out.sort((a, b) => {
    const at = a.updatedAt ?? a.createdAt ?? 0;
    const bt = b.updatedAt ?? b.createdAt ?? 0;
    return bt - at;
  });

  return out;
}

/**
 * IMPORTANT: Only persist after hydration.
 * If you persist before loadTrips resolves, you can overwrite real stored trips with an empty in-memory array.
 */
let hydrated = false;

/** Guards concurrent loads */
let loadPromise: Promise<void> | null = null;

/** Best-effort persist. Never throws. */
async function persist(trips: Trip[]): Promise<void> {
  if (!hydrated) return;
  try {
    const compacted = trips.map(compactTrip);
    await storage.setJSON(STORAGE_KEY_V3, compacted);
  } catch {
    // ignore (best-effort)
  }
}

async function loadTrips(): Promise<void> {
  if (state.loaded) {
    hydrated = true;
    return;
  }

  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      // Try v3 first
      const savedV3 = await storage.getJSON<any>(STORAGE_KEY_V3);
      let trips = normalizeTripsList(savedV3);

      // Fallback v2
      if (trips.length === 0) {
        const savedV2 = await storage.getJSON<any>(STORAGE_KEY_V2);
        const v2Trips = normalizeTripsList(savedV2);
        if (v2Trips.length) {
          trips = v2Trips;
          hydrated = true;
          await persist(trips);
        }
      }

      // Fallback v1
      if (trips.length === 0) {
        const savedV1 = await storage.getJSON<any>(STORAGE_KEY_V1);
        const v1Trips = normalizeTripsList(savedV1);
        if (v1Trips.length) {
          trips = v1Trips;
          hydrated = true;
          await persist(trips);
        }
      }

      setState({ trips, loaded: true });
      hydrated = true;
    } catch {
      setState({ trips: [], loaded: true });
      hydrated = true;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/**
 * Ensure hydration before any mutating op.
 * This prevents the classic race: addTrip() runs before loadTrips() and overwrites storage.
 */
async function ensureLoaded(): Promise<void> {
  if (state.loaded && hydrated) return;
  await loadTrips();
}

async function addTrip(patch: Omit<Trip, "id"> & Partial<Pick<Trip, "id">>): Promise<Trip> {
  await ensureLoaded();

  const id = normString((patch as any)?.id) || safeId();

  const matchIds = patch.matchIds?.map((x) => normString(x)).filter(Boolean);

  const cityName = normString(patch.cityName) || (typeof patch.cityId === "string" ? normString(patch.cityId) : "") || undefined;

  const t: Trip = compactTrip({
    id,
    title: normString(patch.title) || (cityName ? `${cityName} trip` : undefined),

    cityName,
    cityId: patch.cityId,
    citySlug: patch.citySlug,

    fixtureId: normString(patch.fixtureId) || (matchIds?.[0] ?? undefined),
    matchIds: matchIds?.length ? matchIds : undefined,

    startDate: patch.startDate,
    endDate: patch.endDate,

    notes: normString(patch.notes) || undefined,

    links: Array.isArray(patch.links) ? patch.links.slice() : undefined,
    itinerary: Array.isArray(patch.itinerary) ? patch.itinerary.slice() : undefined,
    saved: Array.isArray(patch.saved) ? patch.saved.slice() : undefined,

    createdAt: now(),
    updatedAt: now(),
  });

  const next = [t, ...state.trips];
  setState({ trips: next, loaded: true });
  await persist(next);
  return t;
}

async function updateTrip(id: string, patch: Partial<Omit<Trip, "id">>): Promise<void> {
  await ensureLoaded();

  const tid = normString(id);
  if (!tid) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;

    const nextMatchIds = patch.matchIds ? patch.matchIds.map((x) => normString(x)).filter(Boolean) : t.matchIds;

    const merged: Trip = compactTrip({
      ...t,
      ...patch,

      // Keep derived fields consistent
      title:
        typeof patch.title === "string"
          ? normString(patch.title) || undefined
          : t.title,

      cityName:
        typeof patch.cityName === "string"
          ? normString(patch.cityName) || undefined
          : typeof patch.cityId === "string"
            ? normString(patch.cityId) || undefined
            : t.cityName,

      fixtureId:
        typeof patch.fixtureId === "string"
          ? normString(patch.fixtureId) || undefined
          : nextMatchIds?.[0] ?? t.fixtureId,

      matchIds: nextMatchIds,

      links: patch.links ? patch.links.slice() : t.links,
      itinerary: patch.itinerary ? patch.itinerary.slice() : t.itinerary,
      saved: patch.saved ? patch.saved.slice() : t.saved,

      notes: typeof patch.notes === "string" ? normString(patch.notes) || undefined : t.notes,
      updatedAt: now(),
    });

    return merged;
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

async function removeTrip(id: string): Promise<void> {
  await ensureLoaded();

  const tid = normString(id);
  if (!tid) return;

  const next = state.trips.filter((t) => t.id !== tid);
  setState({ trips: next, loaded: true });
  await persist(next);
}

/* ------------------------------- Links API ------------------------------- */

async function addLink(tripId: string, item: TripLinkItem): Promise<void> {
  await ensureLoaded();

  const tid = normString(tripId);
  if (!tid) return;

  const it = normalizeLinkItem(item);
  if (!it) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;

    const links = Array.isArray(t.links) ? t.links.slice() : [];
    links.unshift({ ...it, createdAt: it.createdAt ?? now(), updatedAt: now() });

    return compactTrip({ ...t, links, updatedAt: now() });
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

async function removeLink(tripId: string, linkId: string): Promise<void> {
  await ensureLoaded();

  const tid = normString(tripId);
  const lid = normString(linkId);
  if (!tid || !lid) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;

    const links = (t.links ?? []).filter((l) => normString(l.id) !== lid);
    return compactTrip({ ...t, links: links.length ? links : undefined, updatedAt: now() });
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

/* ---------------------------- Itinerary API ----------------------------- */

async function addItineraryItem(tripId: string, item: TripItineraryItem): Promise<void> {
  await ensureLoaded();

  const tid = normString(tripId);
  if (!tid) return;

  const it = normalizeItineraryItem(item);
  if (!it) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;

    const itinerary = Array.isArray(t.itinerary) ? t.itinerary.slice() : [];
    itinerary.unshift({ ...it, createdAt: it.createdAt ?? now(), updatedAt: now() });

    return compactTrip({ ...t, itinerary, updatedAt: now() });
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

async function removeItineraryItem(tripId: string, itemId: string): Promise<void> {
  await ensureLoaded();

  const tid = normString(tripId);
  const iid = normString(itemId);
  if (!tid || !iid) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;

    const itinerary = (t.itinerary ?? []).filter((x) => normString(x.id) !== iid);
    return compactTrip({ ...t, itinerary: itinerary.length ? itinerary : undefined, updatedAt: now() });
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

/* --------------------------- SavedItem (spine) --------------------------- */

function newSavedId(prefix = "s") {
  return `${prefix}_${now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

async function addSavedItem(tripId: string, item: Omit<SavedItem, "id" | "tripId" | "createdAt" | "updatedAt"> & Partial<Pick<SavedItem, "id">>) {
  await ensureLoaded();

  const tid = normString(tripId);
  if (!tid) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;

    const saved = Array.isArray(t.saved) ? t.saved.slice() : [];

    const id = normString((item as any)?.id) || newSavedId("sv");
    const createdAt = now();

    const toAdd: SavedItem = {
      id,
      tripId: tid,
      category: item.category,
      status: item.status,
      title: normString(item.title) || "Saved item",
      subtitle: normString(item.subtitle) || undefined,
      provider: item.provider,
      partner: item.partner,
      price: item.price,
      reference: normString(item.reference) || undefined,
      notes: normString(item.notes) || undefined,
      walletItemIds: item.walletItemIds,
      createdAt,
      updatedAt: createdAt,
    };

    saved.unshift(toAdd);
    return compactTrip({ ...t, saved, updatedAt: now() });
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

async function updateSavedItem(tripId: string, savedId: string, patch: Partial<Omit<SavedItem, "id" | "tripId">>) {
  await ensureLoaded();

  const tid = normString(tripId);
  const sid = normString(savedId);
  if (!tid || !sid) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;

    const saved = (t.saved ?? []).map((s) => {
      if (s.id !== sid) return s;
      return {
        ...s,
        ...patch,
        title: typeof patch.title === "string" ? normString(patch.title) || s.title : s.title,
        subtitle: typeof patch.subtitle === "string" ? normString(patch.subtitle) || undefined : s.subtitle,
        reference: typeof patch.reference === "string" ? normString(patch.reference) || undefined : s.reference,
        notes: typeof patch.notes === "string" ? normString(patch.notes) || undefined : s.notes,
        updatedAt: now(),
      };
    });

    return compactTrip({ ...t, saved: saved.length ? saved : undefined, updatedAt: now() });
  });

  setState({ trips: next, loaded: true });
  await persist(next);
}

async function removeSavedItem(tripId: string, savedId: string) {
  await ensureLoaded();

  const tid = normString(tripId);
  const sid = normString(savedId);
  if (!tid || !sid) return;

  const next = state.trips.map((t) => {
    if (t.id !== tid) return t;
    const saved = (t.saved ?? []).filter((s) => s.id !== sid);
    return compactTrip({ ...t, saved: saved.length ? saved : undefined, updatedAt: now() });
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

  addLink,
  removeLink,
  addItineraryItem,
  removeItineraryItem,

  // spine
  addSavedItem,
  updateSavedItem,
  removeSavedItem,
};

export default tripsStore;
