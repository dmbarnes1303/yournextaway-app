import { useCallback, useEffect, useMemo, useState } from "react";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import preferencesStore from "@/src/state/preferences";

import type { SavedItem } from "@/src/core/savedItemTypes";
import type { TripWorkspace, WorkspaceSectionKey } from "@/src/core/tripWorkspace";
import {
  WORKSPACE_SECTIONS,
  buildTripWorkspace,
  groupSavedItemsBySection,
} from "@/src/core/tripWorkspace";

import { clean, cleanUpper3 } from "@/src/features/tripDetail/helpers";

type Params = {
  routeTripId: string | null;
};

const DEFAULT_SECTION_ORDER = Object.keys(WORKSPACE_SECTIONS) as WorkspaceSectionKey[];

function resolveActiveSection(
  requested: WorkspaceSectionKey | null,
  workspace: TripWorkspace | null
): WorkspaceSectionKey {
  const fallback = DEFAULT_SECTION_ORDER[0] ?? "tickets";

  if (!requested) return fallback;
  if (!workspace) return requested;

  return DEFAULT_SECTION_ORDER.includes(requested) ? requested : fallback;
}

export default function useTripWorkspace({ routeTripId }: Params) {
  const cleanedRouteTripId = useMemo(() => clean(routeTripId), [routeTripId]);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripsLoaded, setTripsLoaded] = useState<boolean>(tripsStore.getState().loaded);

  const [savedLoaded, setSavedLoaded] = useState<boolean>(savedItemsStore.getState().loaded);
  const [allSavedItems, setAllSavedItems] = useState<SavedItem[]>(
    Array.isArray(savedItemsStore.getState().items) ? savedItemsStore.getState().items : []
  );

  const [preferencesLoaded, setPreferencesLoaded] = useState<boolean>(
    preferencesStore.getState().loaded
  );
  const [originIata, setOriginIata] = useState<string>(
    cleanUpper3(preferencesStore.getPreferredOriginIata(), "LON")
  );

  const [activeSection, setActiveSectionState] = useState<WorkspaceSectionKey>("tickets");

  useEffect(() => {
    const sync = () => {
      const state = tripsStore.getState();
      setTripsLoaded(state.loaded);

      const nextTrip =
        state.trips.find((item) => clean(item.id) === cleanedRouteTripId) ?? null;

      setTrip(nextTrip);
    };

    const unsub = tripsStore.subscribe(sync);
    sync();

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().finally(sync);
    }

    return () => unsub();
  }, [cleanedRouteTripId]);

  useEffect(() => {
    const sync = () => {
      const state = savedItemsStore.getState();
      setSavedLoaded(state.loaded);
      setAllSavedItems(Array.isArray(state.items) ? state.items : []);
    };

    const unsub = savedItemsStore.subscribe(sync);
    sync();

    if (!savedItemsStore.getState().loaded) {
      savedItemsStore.load().finally(sync);
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    const sync = () => {
      const state = preferencesStore.getState();
      setPreferencesLoaded(state.loaded);
      setOriginIata(cleanUpper3(state.preferredOriginIata, "LON"));
    };

    const unsub = preferencesStore.subscribe(sync);
    sync();

    if (!preferencesStore.getState().loaded) {
      preferencesStore.load().finally(sync);
    }

    return () => unsub();
  }, []);

  const activeTripId = useMemo(() => {
    return clean(trip?.id) || cleanedRouteTripId || null;
  }, [trip?.id, cleanedRouteTripId]);

  const savedItems = useMemo(() => {
    if (!activeTripId) return [];
    return allSavedItems.filter((item) => clean(item.tripId) === activeTripId);
  }, [allSavedItems, activeTripId]);

  const pending = useMemo(
    () => savedItems.filter((item) => item.status === "pending"),
    [savedItems]
  );

  const saved = useMemo(
    () => savedItems.filter((item) => item.status === "saved"),
    [savedItems]
  );

  const booked = useMemo(
    () => savedItems.filter((item) => item.status === "booked"),
    [savedItems]
  );

  const grouped = useMemo(() => {
    return groupSavedItemsBySection(savedItems);
  }, [savedItems]);

  const workspace = useMemo<TripWorkspace | null>(() => {
    if (!activeTripId) return null;

    return buildTripWorkspace({
      tripId: activeTripId,
      items: savedItems,
    });
  }, [activeTripId, savedItems]);

  const sectionOrder = useMemo<WorkspaceSectionKey[]>(() => {
    return DEFAULT_SECTION_ORDER;
  }, []);

  useEffect(() => {
    setActiveSectionState((current) => resolveActiveSection(current, workspace));
  }, [workspace]);

  const setActiveSection = useCallback((section: WorkspaceSectionKey) => {
    setActiveSectionState(resolveActiveSection(section, null));
  }, []);

  const toggleSection = useCallback(
    async (section: WorkspaceSectionKey) => {
      if (!workspace || !activeTripId) return;

      const nextCollapsed = !Boolean(workspace.collapsed?.[section]);

      try {
        await tripsStore.setWorkspaceSectionCollapsed(activeTripId, section, nextCollapsed);
      } catch {
        // ignore
      }
    },
    [workspace, activeTripId]
  );

  const sectionActiveTotals = useMemo(() => {
    return sectionOrder.reduce<Record<WorkspaceSectionKey, number>>((acc, sectionKey) => {
      acc[sectionKey] = grouped[sectionKey]?.filter((item) => item.status !== "archived").length ?? 0;
      return acc;
    }, {} as Record<WorkspaceSectionKey, number>);
  }, [grouped, sectionOrder]);

  const activeTotal = useMemo(() => {
    return Object.values(sectionActiveTotals).reduce((sum, value) => sum + value, 0);
  }, [sectionActiveTotals]);

  const workspaceSnapshot = useMemo(() => {
    return {
      activeTotal,
      sectionActiveTotals,
    };
  }, [activeTotal, sectionActiveTotals]);

  const workspaceLoaded = tripsLoaded && savedLoaded && preferencesLoaded;

  return {
    trip,
    tripsLoaded,
    savedLoaded,
    preferencesLoaded,
    workspaceLoaded,
    originIata,

    savedItems,
    pending,
    saved,
    booked,
    grouped,

    workspace,
    workspaceSnapshot,
    sectionOrder,
    activeSection,

    activeTripId,

    setActiveSection,
    toggleSection,
  };
}
