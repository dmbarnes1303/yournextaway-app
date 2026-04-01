// src/services/tripProgress.ts
import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";

export type ProgressState = "empty" | "saved" | "pending" | "booked";

export type TripProgress = {
  tickets: ProgressState;
  flight: ProgressState;
  hotel: ProgressState;
  transfer: ProgressState;
  things: ProgressState;
};

export type TripHealth = {
  score: number;
  missing: string[];
};

type ProgressBucketKey = keyof TripProgress;

const EMPTY_PROGRESS: TripProgress = {
  tickets: "empty",
  flight: "empty",
  hotel: "empty",
  transfer: "empty",
  things: "empty",
};

const PROGRESS_BUCKET_TYPES: Record<ProgressBucketKey, SavedItemType[]> = {
  tickets: ["tickets"],
  flight: ["flight"],
  hotel: ["hotel"],
  transfer: ["train", "transfer"],
  things: ["things"],
};

const HEALTH_WEIGHTS: Record<ProgressBucketKey, number> = {
  tickets: 40,
  hotel: 25,
  flight: 20,
  transfer: 10,
  things: 5,
};

const HEALTH_MISSING_LABELS: Record<ProgressBucketKey, string> = {
  tickets: "tickets",
  hotel: "hotel",
  flight: "flights",
  transfer: "transport",
  things: "things to do",
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function isActiveItem(item: SavedItem): boolean {
  return item.status !== "archived";
}

function isBookedLike(item: SavedItem): boolean {
  return item.status === "booked";
}

function isPendingLike(item: SavedItem): boolean {
  return item.status === "pending";
}

function isSavedLike(item: SavedItem): boolean {
  return item.status === "saved";
}

function filterItemsForTrip(items: SavedItem[], tripId: string): SavedItem[] {
  const id = clean(tripId);
  if (!id) return [];

  return items.filter((item) => clean(item.tripId) === id && isActiveItem(item));
}

function filterByTypes(items: SavedItem[], types: SavedItemType[]): SavedItem[] {
  if (!items.length || !types.length) return [];
  return items.filter((item) => types.includes(item.type));
}

function reduceState(items: SavedItem[]): ProgressState {
  if (!items.length) return "empty";
  if (items.some(isBookedLike)) return "booked";
  if (items.some(isPendingLike)) return "pending";
  if (items.some(isSavedLike)) return "saved";
  return "empty";
}

function getStateScore(state: ProgressState, weight: number): number {
  if (state === "booked") return weight;
  return 0;
}

export function getTripProgress(tripId: string): TripProgress {
  const id = clean(tripId);
  if (!id) return { ...EMPTY_PROGRESS };

  const tripItems = filterItemsForTrip(savedItemsStore.getAll(), id);
  if (!tripItems.length) return { ...EMPTY_PROGRESS };

  return {
    tickets: reduceState(filterByTypes(tripItems, PROGRESS_BUCKET_TYPES.tickets)),
    flight: reduceState(filterByTypes(tripItems, PROGRESS_BUCKET_TYPES.flight)),
    hotel: reduceState(filterByTypes(tripItems, PROGRESS_BUCKET_TYPES.hotel)),
    transfer: reduceState(filterByTypes(tripItems, PROGRESS_BUCKET_TYPES.transfer)),
    things: reduceState(filterByTypes(tripItems, PROGRESS_BUCKET_TYPES.things)),
  };
}

export function getTripHealth(tripId: string): TripHealth {
  const progress = getTripProgress(tripId);

  let score = 0;
  const missing: string[] = [];

  (Object.keys(progress) as ProgressBucketKey[]).forEach((key) => {
    const state = progress[key];
    const weight = HEALTH_WEIGHTS[key];

    score += getStateScore(state, weight);

    if (state !== "booked") {
      missing.push(HEALTH_MISSING_LABELS[key]);
    }
  });

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    missing,
  };
}
