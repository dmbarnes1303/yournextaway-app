import { useEffect, useMemo, useState } from "react";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import preferencesStore from "@/src/state/preferences";

import type { SavedItem } from "@/src/core/savedItemTypes";
import { groupSavedItemsBySection } from "@/src/core/tripWorkspace";

import { clean, cleanUpper3 } from "@/src/features/tripDetail/helpers";

type Params = {
  routeTripId: string | null;
};

export default function useTripWorkspace({ routeTripId }: Params) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripsLoaded, setTripsLoaded] = useState<boolean>(
    tripsStore.getState().loaded
  );

  const [savedLoaded, setSavedLoaded] = useState<boolean>(
    savedItemsStore.getState().loaded
  );
  const [allSavedItems, setAllSavedItems] = useState<SavedItem[]>([]);

  const [originIata, setOriginIata] = useState<string>(
    preferencesStore.getPreferredOriginIata()
  );

  // Trips
  useEffect(() => {
    const sync = () => {
      const state = tripsStore.getState();
      setTripsLoaded(state.loaded);
      setTrip(state.trips.find((t) => t.id === routeTripId) ?? null);
    };

    const unsub = tripsStore.subscribe(sync);
    sync();

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().finally(sync);
    }

    return () => unsub();
  }, [routeTripId]);

  // Saved items
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

  // Preferences
  useEffect(() => {
    const sync = () => {
      const state = preferencesStore.getState();
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
    return clean(trip?.id) || clean(routeTripId) || null;
  }, [trip?.id, routeTripId]);

  const savedItems = useMemo(() => {
    if (!activeTripId) return [];
    return allSavedItems.filter((i) => clean(i.tripId) === activeTripId);
  }, [allSavedItems, activeTripId]);

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

  const grouped = useMemo(() => {
    return groupSavedItemsBySection(savedItems);
  }, [savedItems]);

  return {
    trip,
    tripsLoaded,
    savedLoaded,
    originIata,

    savedItems,
    pending,
    saved,
    booked,
    grouped,

    activeTripId,
  };
}
