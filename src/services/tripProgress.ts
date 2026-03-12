import savedItemsStore from "@/src/state/savedItems";
import type { SavedItem } from "@/src/core/savedItemTypes";

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

function reduceState(items: SavedItem[]): ProgressState {
  if (!items.length) return "empty";

  if (items.some((i) => i.status === "booked")) return "booked";
  if (items.some((i) => i.status === "pending")) return "pending";
  if (items.some((i) => i.status === "saved")) return "saved";

  return "empty";
}

export function getTripProgress(tripId: string): TripProgress {
  const items = savedItemsStore.getByTripId(tripId);

  const byType = (type: string) => items.filter((i) => i.type === type);

  return {
    tickets: reduceState(byType("tickets")),
    flight: reduceState(byType("flight")),
    hotel: reduceState(byType("hotel")),
    transfer: reduceState(
      items.filter((i) => i.type === "train" || i.type === "transfer")
    ),
    things: reduceState(byType("things")),
  };
}

export function getTripHealth(tripId: string): TripHealth {
  const p = getTripProgress(tripId);

  let score = 0;
  const missing: string[] = [];

  const weights = {
    tickets: 40,
    hotel: 25,
    flight: 20,
    transfer: 10,
    things: 5,
  };

  Object.entries(p).forEach(([k, state]) => {
    const weight = (weights as any)[k] ?? 0;

    if (state === "booked") {
      score += weight;
    } else if (state === "pending") {
      score += weight * 0.6;
    } else if (state === "saved") {
      score += weight * 0.3;
    } else {
      missing.push(k);
    }
  });

  return {
    score: Math.round(score),
    missing,
  };
}
