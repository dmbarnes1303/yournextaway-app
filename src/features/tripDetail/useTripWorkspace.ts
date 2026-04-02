// src/features/tripDetail/useTripWorkspace.ts

import { useCallback, useEffect, useMemo, useState } from "react";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import preferencesStore from "@/src/state/preferences";

import type { SavedItem } from "@/src/core/savedItemTypes";
import type { WorkspaceSectionKey } from "@/src/core/tripWorkspace";
import {
  WORKSPACE_SECTIONS,
  groupSavedItemsBySection,
} from "@/src/core/tripWorkspace";

import { clean, cleanUpper3 } from "@/src/features/tripDetail/helpers";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SECTION_KEYS = Object.keys(WORKSPACE_SECTIONS) as WorkspaceSectionKey[];

function resolveValidSection(value: unknown): WorkspaceSectionKey {
  if (typeof value === "string" && SECTION_KEYS.includes(value as WorkspaceSectionKey)) {
    return value as WorkspaceSectionKey;
  }
  return SECTION_KEYS[0] ?? "tickets";
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

type Params = {
  routeTripId: string | null;
};

export default function useTripWorkspace({ routeTripId }: Params) {
  const cleanedRouteTripId = useMemo(() => clean(routeTripId), [routeTripId]);

  /* ---------------------------------------------------------------------- */
  /* Trips                                                                  */
  /* ---------------------------------------------------------------------- */

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripsLoaded, setTripsLoaded] = useState<boolean>(tripsStore.getState().loaded);

  useEffect(() => {
    const sync = () => {
      const state = tripsStore.getState();
      setTripsLoaded(state.loaded);

      const nextTrip =
        state.trips.find((t) => clean(t.id) === cleanedRouteTripId) ?? null;

      setTrip(nextTrip);
    };

    const unsub = tripsStore.subscribe(sync);
    sync();

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().finally(sync);
    }

    return () => unsub();
  }, [cleanedRouteTripId]);

  /* ---------------------------------------------------------------------- */
  /* Saved Items                                                            */
  /* ---------------------------------------------------------------------- */

  const [savedLoaded, setSavedLoaded] = useState<boolean>(savedItemsStore.getState().loaded);
  const [allSavedItems, setAllSavedItems] = useState<SavedItem[]>(
    savedItemsStore.getState().items ?? []
  );

  useEffect(() => {
    const sync = () => {
      const state = savedItemsStore.getState();
      setSavedLoaded(state.loaded);
      setAllSavedItems(state.items ?? []);
    };

    const unsub = savedItemsStore.subscribe(sync);
    sync();

    if (!savedItemsStore.getState().loaded) {
      savedItemsStore.load().finally(sync);
    }

    return () => unsub();
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Preferences                                                            */
  /* ---------------------------------------------------------------------- */

  const [preferencesLoaded, setPreferencesLoaded] = useState<boolean>(
    preferencesStore.getState().loaded
  );

  const [originIata, setOriginIata] = useState<string>(
    cleanUpper3(preferencesStore.getPreferredOriginIata(), "LON")
  );

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

  /* ---------------------------------------------------------------------- */
  /* Trip Resolution                                                        */
  /* ---------------------------------------------------------------------- */

  const activeTripId = useMemo(() => {
    return clean(trip?.id) || cleanedRouteTripId || null;
  }, [trip?.id, cleanedRouteTripId]);

  const savedItems = useMemo(() => {
    if (!activeTripId) return [];
    return allSavedItems.filter((item) => clean(item.tripId) === activeTripId);
  }, [allSavedItems, activeTripId]);

  /* ---------------------------------------------------------------------- */
  /* Status Buckets                                                         */
  /* ---------------------------------------------------------------------- */

  const pending = useMemo(
    () => savedItems.filter((i) => i.status === "pending"),
    [savedItems]
  );

  const saved = useMemo(
    () => savedItems.filter((i) => i.status === "saved"),
    [savedItems]
  );

  const booked = useMemo(
    () => savedItems.filter((i) => i.status === "booked"),
    [savedItems]
  );

  /* ---------------------------------------------------------------------- */
  /* Section Grouping                                                       */
  /* ---------------------------------------------------------------------- */

  const grouped = useMemo(() => {
    return groupSavedItemsBySection(savedItems);
  }, [savedItems]);

  const sectionActiveTotals = useMemo(() => {
    const out = {} as Record<WorkspaceSectionKey, number>;

    for (const key of SECTION_KEYS) {
      out[key] =
        grouped[key]?.filter((i) => i.status !== "archived").length ?? 0;
    }

    return out;
  }, [grouped]);

  const activeTotal = useMemo(() => {
    return Object.values(sectionActiveTotals).reduce((sum, v) => sum + v, 0);
  }, [sectionActiveTotals]);

  const workspaceSnapshot = useMemo(() => {
    return {
      activeTotal,
      sectionActiveTotals,
    };
  }, [activeTotal, sectionActiveTotals]);

  /* ---------------------------------------------------------------------- */
  /* UI State (local only — NOT persisted)                                  */
  /* ---------------------------------------------------------------------- */

  const [activeSection, setActiveSectionState] =
    useState<WorkspaceSectionKey>("tickets");

  const setActiveSection = useCallback((section: WorkspaceSectionKey) => {
    setActiveSectionState(resolveValidSection(section));
  }, []);

  const toggleSection = useCallback(() => {
    // intentionally no-op for now
    // collapse persistence is NOT part of Phase 1 spine
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Final                                                                  */
  /* ---------------------------------------------------------------------- */

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
    sectionActiveTotals,
    activeTotal,
    workspaceSnapshot,

    sectionOrder: SECTION_KEYS,
    activeSection,
    activeTripId,

    setActiveSection,
    toggleSection,
  };
}
