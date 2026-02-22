// src/data/mockTrips.ts

export type MockTripSeed = {
  cityId: string;
  citySlug?: string;
  startDate: string; // ISO date-only
  endDate: string;   // ISO date-only
  matchIds?: string[];
  notes?: string;
};

export const MOCK_TRIP_SEEDS: MockTripSeed[] = [
  {
    cityId: "Barcelona",
    citySlug: "barcelona",
    startDate: "2026-03-20",
    endDate: "2026-03-23",
    matchIds: ["barca-v-rma-2026-03-22"],
    notes: "Weekend in Barcelona. Keep Saturday flexible for Sagrada + food.",
  },
  {
    cityId: "Milan",
    citySlug: "milan",
    startDate: "2026-02-07",
    endDate: "2026-02-09",
    matchIds: ["inter-v-milan-2026-02-08"],
    notes: "Derby trip. Prioritise tickets early; keep transfers simple.",
  },
];
