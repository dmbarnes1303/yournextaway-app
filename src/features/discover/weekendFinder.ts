import type { FixtureListRow } from "@/src/services/apiFootball";

export type WeekendTrip = {
  city: string;
  matches: FixtureListRow[];
};

export function findWeekendTrips(fixtures: FixtureListRow[]): WeekendTrip[] {
  const trips: WeekendTrip[] = [];

  const byCity: Record<string, FixtureListRow[]> = {};

  for (const f of fixtures) {
    const city = f.fixture?.venue?.city;
    if (!city) continue;

    if (!byCity[city]) byCity[city] = [];
    byCity[city].push(f);
  }

  for (const city in byCity) {
    const matches = byCity[city];

    if (matches.length >= 2) {
      trips.push({
        city,
        matches,
      });
    }
  }

  return trips;
}
