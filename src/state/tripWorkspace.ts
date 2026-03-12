import { create } from "zustand";

import { readJson, writeJson } from "@/src/state/persist";
import type { TripWorkspace, WorkspaceSectionKey } from "@/src/core/tripWorkspace";
import {
  cloneWorkspace,
  isWorkspaceSectionKey,
  makeDefaultTripWorkspace,
  normalizeActiveSection,
  normalizeCollapsed,
  normalizeOrder,
} from "@/src/core/tripWorkspace";

type WorkspaceMap = Record<string, TripWorkspace>;

type TripWorkspaceState = {
  loaded: boolean;
  workspaces: WorkspaceMap;

  loadWorkspaces: () => Promise<void>;

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

let inflightLoad: Promise<void> | null = null;

function now() {
  return Date.now();
}

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeWorkspace(raw: unknown): TripWorkspace | null {
  if (!isPlainObject(raw)) return null;

  const tripId = cleanString(raw.tripId);
  if (!tripId) return null;

  const createdAt =
    Number.isFinite(Number(raw.createdAt)) && Number(raw.createdAt) > 0 ? Number(raw.createdAt) : now();

  const updatedAt =
    Number.isFinite(Number(raw.updatedAt)) && Number(raw.updatedAt) > 0 ? Number(raw.updatedAt) : createdAt;

  return {
    tripId,
    sectionOrder: normalizeOrder(Array.isArray(raw.sectionOrder) ? (raw.sectionOrder as WorkspaceSectionKey[]) : undefined),
    collapsed: normalizeCollapsed(isPlainObject(raw.collapsed) ? (raw.collapsed as Record<string, unknown>) : undefined),
    activeSection: normalizeActiveSection(raw.activeSection),
    createdAt,
    updatedAt,
  };
}

function cloneWorkspaceMap(map: WorkspaceMap): WorkspaceMap {
  const out: WorkspaceMap = {};
  for (const key of Object.keys(map)) {
    out[key] = cloneWorkspace(map[key]);
  }
  return out;
}

async function persist(workspaces: WorkspaceMap) {
  await writeJson(STORAGE_KEY, cloneWorkspaceMap(workspaces));
}

function getOrCreateWorkspace(map: WorkspaceMap, tripId: string): TripWorkspace {
  const id = cleanString(tripId);
  if (!id) throw new Error("tripId is required");

  const existing = map[id];
  return existing ? cloneWorkspace(existing) : makeDefaultTripWorkspace(id);
}

const useTripWorkspaceStore = create<TripWorkspaceState>((set, get) => ({
  loaded: false,
  workspaces: {},

  loadWorkspaces: async () => {
    if (get().loaded) return;
    if (inflightLoad) return inflightLoad;

    inflightLoad = (async () => {
      const raw = await readJson<Record<string, unknown>>(STORAGE_KEY, {});
      const next: WorkspaceMap = {};

      if (isPlainObject(raw)) {
        for (const key of Object.keys(raw)) {
          const ws = normalizeWorkspace(raw[key]);
          if (!ws) continue;
          next[ws.tripId] = ws;
        }
      }

      set({
        workspaces: next,
        loaded: true,
      });

      try {
        await persist(next);
      } catch {
        // best effort
      }
    })()
      .catch(() => {
        set({ workspaces: {}, loaded: true });
      })
      .finally(() => {
        inflightLoad = null;
      });

    return inflightLoad;
  },

  ensureWorkspace: (tripId: string) => {
    const id = cleanString(tripId);
    if (!id) throw new Error("ensureWorkspace: tripId is required");

    const existing = get().workspaces[id];
    if (existing) return cloneWorkspace(existing);

    const ws = makeDefaultTripWorkspace(id);
    const next = { ...get().workspaces, [id]: ws };

    set({
      workspaces: next,
      loaded: true,
    });

    void persist(next);
    return cloneWorkspace(ws);
  },

  getWorkspace: (tripId: string) => {
    const id = cleanString(tripId);
    if (!id) return null;

    const existing = get().workspaces[id];
    return existing ? cloneWorkspace(existing) : null;
  },

  setActiveSection: async (tripId, section) => {
    const id = cleanString(tripId);
    if (!id || !isWorkspaceSectionKey(section)) return;

    const current = getOrCreateWorkspace(get().workspaces, id);

    const nextWs: TripWorkspace = {
      ...current,
      activeSection: section,
      updatedAt: now(),
    };

    const next = { ...get().workspaces, [id]: nextWs };

    set({
      workspaces: next,
      loaded: true,
    });

    await persist(next);
  },

  setSectionOrder: async (tripId, order) => {
    const id = cleanString(tripId);
    if (!id) return;

    const current = getOrCreateWorkspace(get().workspaces, id);

    const nextWs: TripWorkspace = {
      ...current,
      sectionOrder: normalizeOrder(order),
      updatedAt: now(),
    };

    const next = { ...get().workspaces, [id]: nextWs };

    set({
      workspaces: next,
      loaded: true,
    });

    await persist(next);
  },

  toggleCollapsed: async (tripId, section) => {
    const id = cleanString(tripId);
    if (!id || !isWorkspaceSectionKey(section)) return;

    const current = getOrCreateWorkspace(get().workspaces, id);
    const previous = Boolean(current.collapsed?.[section]);

    const nextWs: TripWorkspace = {
      ...current,
      collapsed: {
        ...current.collapsed,
        [section]: !previous,
      },
      updatedAt: now(),
    };

    const next = { ...get().workspaces, [id]: nextWs };

    set({
      workspaces: next,
      loaded: true,
    });

    await persist(next);
  },

  setCollapsed: async (tripId, section, collapsed) => {
    const id = cleanString(tripId);
    if (!id || !isWorkspaceSectionKey(section)) return;

    const current = getOrCreateWorkspace(get().workspaces, id);

    const nextWs: TripWorkspace = {
      ...current,
      collapsed: {
        ...current.collapsed,
        [section]: Boolean(collapsed),
      },
      updatedAt: now(),
    };

    const next = { ...get().workspaces, [id]: nextWs };

    set({
      workspaces: next,
      loaded: true,
    });

    await persist(next);
  },

  removeWorkspace: async (tripId) => {
    const id = cleanString(tripId);
    if (!id) return;

    const next = { ...get().workspaces };
    delete next[id];

    set({
      workspaces: next,
      loaded: true,
    });

    await persist(next);
  },

  clearAllWorkspaces: async () => {
    set({
      workspaces: {},
      loaded: true,
    });

    await persist({});
  },
}));

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
