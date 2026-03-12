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

function isActiveItem(item: SavedItem): boolean {
  return item.status !== "archived";
}

function reduceState(items: SavedItem[]): ProgressState {
  const active = items.filter(isActiveItem);

  if (active.length === 0) return "empty";
  if (active.some((item) => item.status === "booked")) return "booked";
  if (active.some((item) => item.status === "pending")) return "pending";
  if (active.some((item) => item.status === "saved")) return "saved";

  return "empty";
}

function filterByTypes(items: SavedItem[], types: SavedItemType[]): SavedItem[] {
  return items.filter((item) => types.includes(item.type));
}

export function getTripProgress(tripId: string): TripProgress {
  const id = String(tripId ?? "").trim();
  if (!id) {
    return {
      tickets: "empty",
      flight: "empty",
      hotel: "empty",
      transfer: "empty",
      things: "empty",
    };
  }

  const items = savedItemsStore.getByTripId(id).filter(isActiveItem);

  return {
    tickets: reduceState(filterByTypes(items, ["tickets"])),
    flight: reduceState(filterByTypes(items, ["flight"])),
    hotel: reduceState(filterByTypes(items, ["hotel"])),
    transfer: reduceState(filterByTypes(items, ["train", "transfer"])),
    things: reduceState(filterByTypes(items, ["things"])),
  };
}

export function getTripHealth(tripId: string): TripHealth {
  const progress = getTripProgress(tripId);

  const weights: Record<keyof TripProgress, number> = {
    tickets: 40,
    hotel: 25,
    flight: 20,
    transfer: 10,
    things: 5,
  };

  const missingLabels: Record<keyof TripProgress, string> = {
    tickets: "tickets",
    hotel: "hotel",
    flight: "flights",
    transfer: "transport",
    things: "things to do",
  };

  let score = 0;
  const missing: string[] = [];

  (Object.keys(progress) as Array<keyof TripProgress>).forEach((key) => {
    const state = progress[key];
    const weight = weights[key];

    if (state === "booked") {
      score += weight;
      return;
    }

    if (state === "pending") {
      score += weight * 0.6;
      return;
    }

    if (state === "saved") {
      score += weight * 0.3;
      return;
    }

    missing.push(missingLabels[key]);
  });

  return {
    score: Math.round(score),
    missing,
  };
}
