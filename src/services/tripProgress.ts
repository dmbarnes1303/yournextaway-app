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

function isArchived(item: SavedItem): boolean {
  return item.status === "archived";
}

function isBooked(item: SavedItem): boolean {
  return item.status === "booked";
}

function isPending(item: SavedItem): boolean {
  return item.status === "pending";
}

function isSaved(item: SavedItem): boolean {
  return item.status === "saved";
}

function getTripItems(tripId: string): SavedItem[] {
  const id = clean(tripId);
  if (!id) return [];

  return savedItemsStore
    .getAll()
    .filter((item) => clean(item.tripId) === id)
    .filter((item) => !isArchived(item));
}

function filterBucketItems(
  items: SavedItem[],
  bucketKey: ProgressBucketKey
): SavedItem[] {
  const allowedTypes = PROGRESS_BUCKET_TYPES[bucketKey];
  return items.filter((item) => allowedTypes.includes(item.type));
}

function reduceProgressState(items: SavedItem[]): ProgressState {
  if (items.length === 0) return "empty";
  if (items.some(isBooked)) return "booked";
  if (items.some(isPending)) return "pending";
  if (items.some(isSaved)) return "saved";
  return "empty";
}

function getBookedOnlyHealthPoints(
  state: ProgressState,
  weight: number
): number {
  return state === "booked" ? weight : 0;
}

export function getTripProgress(tripId: string): TripProgress {
  const id = clean(tripId);
  if (!id) return { ...EMPTY_PROGRESS };

  const tripItems = getTripItems(id);
  if (tripItems.length === 0) return { ...EMPTY_PROGRESS };

  return {
    tickets: reduceProgressState(filterBucketItems(tripItems, "tickets")),
    flight: reduceProgressState(filterBucketItems(tripItems, "flight")),
    hotel: reduceProgressState(filterBucketItems(tripItems, "hotel")),
    transfer: reduceProgressState(filterBucketItems(tripItems, "transfer")),
    things: reduceProgressState(filterBucketItems(tripItems, "things")),
  };
}

export function getTripHealth(tripId: string): TripHealth {
  const progress = getTripProgress(tripId);

  let score = 0;
  const missing: string[] = [];

  (Object.keys(progress) as ProgressBucketKey[]).forEach((key) => {
    const state = progress[key];
    const weight = HEALTH_WEIGHTS[key];

    score += getBookedOnlyHealthPoints(state, weight);

    if (state !== "booked") {
      missing.push(HEALTH_MISSING_LABELS[key]);
    }
  });

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    missing,
  };
}
