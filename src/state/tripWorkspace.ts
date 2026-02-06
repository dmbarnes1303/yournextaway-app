// src/state/tripWorkspace.ts
import { create } from "zustand";

import { readJson, writeJson } from "@/src/state/persist";
import type { TripWorkspace, WorkspaceSectionKey } from "@/src/core/tripWorkspace";
import { makeDefaultTripWorkspace, normalizeOrder } from "@/src/core/tripWorkspace";

type WorkspaceMap = Record<string, TripWorkspace>;

type TripWorkspaceState = {
  loaded: boolean;
  workspaces: WorkspaceMap;

  loadWorkspaces: () => Promise<void>;

  /** Ensure a workspace exists for a tripId and return it */
  ensureWorkspace: (tripId: string) => TripWorkspace;

  getWorkspace: (tripId: string) => TripWorkspace | null;

  setActiveSection: (tripId: string, section: WorkspaceSectionKey) => Promise<void>;

  setSectionOrder: (tripId: string, order: WorkspaceSectionKey[]) => Promise<void>;

  toggleCollapsed: (tripId: string, section: WorkspaceSectionKey) => Promise<void>;

  setCollapsed: (tripId: string, section: WorkspaceSectionKey, collapsed: boolean) => Promise<void>;

  removeWorkspace: (tripId: string) => Promise<void>;

  clearAllWorkspaces: () => Promise<void>;
};

const STORAGE_KEY = "yna_trip_workspaces_v1";

function now() {
  return Date.now();
}

function normalizeWorkspace(x: any): TripWorkspace | null {
  if (!x || typeof x !== "object") return null;

  const tripId = String(x.tripId ?? "").trim();
  if (!tripId) return null;

  const sectionOrder = normalizeOrder(Array.isArray(x.sectionOrder) ? x.sectionOrder : undefined);

  const collapsedRaw = x.collapsed && typeof x.collapsed === "object" ? x.collapsed : {};
  const collapsed: Partial<Record<WorkspaceSectionKey, boolean>> = {};
  for (const k of Object.keys(collapsedRaw)) {
    const key = k as WorkspaceSectionKey;
    collapsed[key] = !!(collapsedRaw as any)[k];
  }

  const activeSection =
    typeof x.activeSection === "string" && x.activeSection.trim() ? (x.activeSection.trim() as WorkspaceSectionKey) : undefined;

  const createdAt = Number.isFinite(Number(x.createdAt)) ? Number(x.createdAt) : now();
  const updatedAt = Number.isFinite(Number(x.updatedAt)) ? Number(x.updatedAt) : createdAt;

  return {
    tripId,
    sectionOrder,
    collapsed,
    activeSection,
    createdAt,
    updatedAt,
  };
}

async function persist(workspaces: WorkspaceMap) {
  await writeJson(STORAGE_KEY, workspaces);
}

const useTripWorkspaceStore = create<TripWorkspaceState>((set, get) => ({
  loaded: false,
  workspaces: {},

  loadWorkspaces: async () => {
    const raw = await readJson<Record<string, any>>(STORAGE_KEY, {});
    const next: WorkspaceMap = {};

    for (const key of Object.keys(raw)) {
      const ws = normalizeWorkspace(raw[key]);
      if (ws) next[ws.tripId] = ws;
    }

    set({ workspaces: next, loaded: true });
  },

  ensureWorkspace: (tripId: string) => {
    const id = String(tripId ?? "").trim();
    if (!id) throw new Error("ensureWorkspace: tripId is required");

    const existing = get().workspaces[id];
    if (existing) return existing;

    const ws = makeDefaultTripWorkspace(id);
    const next = { ...get().workspaces, [id]: ws };
    set({ workspaces: next, loaded: true });

    // Fire-and-forget persist (but still awaited by callers if needed via explicit methods)
    void persist(next);

    return ws;
  },

  getWorkspace: (tripId: string) => {
    const id = String(tripId ?? "").trim();
    if (!id) return null;
    return get().workspaces[id] ?? null;
  },

  setActiveSection: async (tripId, section) => {
    const id = String(tripId ?? "").trim();
    if (!id) return;

    const cur = get().workspaces[id] ?? makeDefaultTripWorkspace(id);
    const nextWs: TripWorkspace = { ...cur, activeSection: section, updatedAt: now() };

    const next = { ...get().workspaces, [id]: nextWs };
    set({ workspaces: next, loaded: true });
    await persist(next);
  },

  setSectionOrder: async (tripId, order) => {
    const id = String(tripId ?? "").trim();
    if (!id) return;

    const cur = get().workspaces[id] ?? makeDefaultTripWorkspace(id);
    const nextOrder = normalizeOrder(order);

    const nextWs: TripWorkspace = { ...cur, sectionOrder: nextOrder, updatedAt: now() };
    const next = { ...get().workspaces, [id]: nextWs };

    set({ workspaces: next, loaded: true });
    await persist(next);
  },

  toggleCollapsed: async (tripId, section) => {
    const id = String(tripId ?? "").trim();
    if (!id) return;

    const cur = get().workspaces[id] ?? makeDefaultTripWorkspace(id);
    const prev = !!cur.collapsed?.[section];

    const nextWs: TripWorkspace = {
      ...cur,
      collapsed: { ...cur.collapsed, [section]: !prev },
      updatedAt: now(),
    };

    const next = { ...get().workspaces, [id]: nextWs };
    set({ workspaces: next, loaded: true });
    await persist(next);
  },

  setCollapsed: async (tripId, section, collapsed) => {
    const id = String(tripId ?? "").trim();
    if (!id) return;

    const cur = get().workspaces[id] ?? makeDefaultTripWorkspace(id);

    const nextWs: TripWorkspace = {
      ...cur,
      collapsed: { ...cur.collapsed, [section]: !!collapsed },
      updatedAt: now(),
    };

    const next = { ...get().workspaces, [id]: nextWs };
    set({ workspaces: next, loaded: true });
    await persist(next);
  },

  removeWorkspace: async (tripId) => {
    const id = String(tripId ?? "").trim();
    if (!id) return;

    const next = { ...get().workspaces };
    delete next[id];

    set({ workspaces: next, loaded: true });
    await persist(next);
  },

  clearAllWorkspaces: async () => {
    set({ workspaces: {}, loaded: true });
    await persist({});
  },
}));

/**
 * Convenience wrapper, matches your tripsStore style.
 */
const tripWorkspaceStore = {
  getState: useTripWorkspaceStore.getState,
  setState: useTripWorkspaceStore.setState,
  subscribe: useTripWorkspaceStore.subscribe,

  loadWorkspaces: async () => {
    await useTripWorkspaceStore.getState().loadWorkspaces();
  },

  ensureWorkspace: (tripId: string) => {
    return useTripWorkspaceStore.getState().ensureWorkspace(tripId);
  },

  getWorkspace: (tripId: string) => {
    return useTripWorkspaceStore.getState().getWorkspace(tripId);
  },

  setActiveSection: async (tripId: string, section: WorkspaceSectionKey) => {
    await useTripWorkspaceStore.getState().setActiveSection(tripId, section);
  },

  setSectionOrder: async (tripId: string, order: WorkspaceSectionKey[]) => {
    await useTripWorkspaceStore.getState().setSectionOrder(tripId, order);
  },

  toggleCollapsed: async (tripId: string, section: WorkspaceSectionKey) => {
    await useTripWorkspaceStore.getState().toggleCollapsed(tripId, section);
  },

  setCollapsed: async (tripId: string, section: WorkspaceSectionKey, collapsed: boolean) => {
    await useTripWorkspaceStore.getState().setCollapsed(tripId, section, collapsed);
  },

  removeWorkspace: async (tripId: string) => {
    await useTripWorkspaceStore.getState().removeWorkspace(tripId);
  },

  clearAllWorkspaces: async () => {
    await useTripWorkspaceStore.getState().clearAllWorkspaces();
  },
};

export default tripWorkspaceStore;
export { useTripWorkspaceStore };
