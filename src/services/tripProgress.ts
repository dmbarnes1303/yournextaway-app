import savedItemsStore from "@/src/state/savedItems";
import type {
  SavedItem,
  SavedItemPartnerCategory,
  SavedItemType,
} from "@/src/core/savedItemTypes";

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

export type TripProgressCounts = {
  bookedCore: number;
  totalCore: number;
  bookedOptional: number;
  totalOptional: number;
};

type ProgressBucketKey = keyof TripProgress;

const EMPTY_PROGRESS: TripProgress = {
  tickets: "empty",
  flight: "empty",
  hotel: "empty",
  transfer: "empty",
  things: "empty",
};

const CORE_BUCKETS: ProgressBucketKey[] = ["tickets", "flight", "hotel"];
const OPTIONAL_BUCKETS: ProgressBucketKey[] = ["transfer", "things"];

const HEALTH_WEIGHTS: Record<ProgressBucketKey, number> = {
  tickets: 45,
  flight: 30,
  hotel: 20,
  transfer: 3,
  things: 2,
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

function lower(value: unknown): string {
  return clean(value).toLowerCase();
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

function getPartnerCategory(item: SavedItem): SavedItemPartnerCategory | null {
  const category = lower(item.partnerCategory);

  if (
    category === "tickets" ||
    category === "flights" ||
    category === "hotels" ||
    category === "insurance"
  ) {
    return category;
  }

  return null;
}

function getSourceSection(item: SavedItem): string {
  return lower(item.sourceSection || item.metadata?.sourceSection);
}

function getSourceSurface(item: SavedItem): string {
  return lower(item.sourceSurface || item.metadata?.sourceSurface);
}

function getProviderHint(item: SavedItem): string {
  return lower(item.partnerId || item.metadata?.provider || item.metadata?.partnerId);
}

function itemBelongsToBucket(item: SavedItem, bucketKey: ProgressBucketKey): boolean {
  const type = item.type;
  const partnerCategory = getPartnerCategory(item);
  const sourceSection = getSourceSection(item);
  const sourceSurface = getSourceSurface(item);
  const providerHint = getProviderHint(item);

  if (bucketKey === "tickets") {
    return (
      type === "tickets" ||
      partnerCategory === "tickets" ||
      sourceSection === "tickets"
    );
  }

  if (bucketKey === "flight") {
    return (
      type === "flight" ||
      partnerCategory === "flights" ||
      sourceSection === "travel" ||
      providerHint === "aviasales"
    );
  }

  if (bucketKey === "hotel") {
    return (
      type === "hotel" ||
      partnerCategory === "hotels" ||
      sourceSection === "stay" ||
      providerHint === "expedia"
    );
  }

  if (bucketKey === "transfer") {
    return (
      type === "train" ||
      type === "transfer" ||
      sourceSection === "transfers" ||
      sourceSection === "transport"
    );
  }

  if (bucketKey === "things") {
    return (
      type === "things" ||
      sourceSection === "things" ||
      sourceSection === "extras" ||
      sourceSurface === "things"
    );
  }

  return false;
}

function filterBucketItems(items: SavedItem[], bucketKey: ProgressBucketKey): SavedItem[] {
  return items.filter((item) => itemBelongsToBucket(item, bucketKey));
}

function reduceProgressState(items: SavedItem[]): ProgressState {
  if (items.length === 0) return "empty";
  if (items.some(isBooked)) return "booked";
  if (items.some(isPending)) return "pending";
  if (items.some(isSaved)) return "saved";
  return "empty";
}

function getBookedOnlyHealthPoints(state: ProgressState, weight: number): number {
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

export function getTripProgressCounts(tripId: string): TripProgressCounts {
  const progress = getTripProgress(tripId);

  const bookedCore = CORE_BUCKETS.filter((key) => progress[key] === "booked").length;
  const bookedOptional = OPTIONAL_BUCKETS.filter((key) => progress[key] === "booked").length;

  return {
    bookedCore,
    totalCore: CORE_BUCKETS.length,
    bookedOptional,
    totalOptional: OPTIONAL_BUCKETS.length,
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
