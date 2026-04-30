// src/features/discover/weekendFinder.ts

import type { FixtureListRow } from "@/src/services/apiFootball";

export type WeekendTrip = {
  city: string;
  matches: FixtureListRow[];
  from: string;
  to: string;
  matchCount: number;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function cityKey(value: unknown): string {
  return clean(value).toLowerCase();
}

function fixtureId(row: FixtureListRow): string {
  return row?.fixture?.id != null ? String(row.fixture.id) : "";
}

function fixtureDate(row: FixtureListRow): Date | null {
  const raw = clean(row?.fixture?.date);
  if (!raw) return null;

  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isoDateOnly(row: FixtureListRow): string {
  return clean(row?.fixture?.date).slice(0, 10);
}

function isWeekendFixture(row: FixtureListRow): boolean {
  const dt = fixtureDate(row);
  if (!dt) return false;

  const day = dt.getDay();
  return day === 5 || day === 6 || day === 0;
}

function hasUsableShape(row: FixtureListRow): boolean {
  return Boolean(
    fixtureId(row) &&
      clean(row?.fixture?.date) &&
      clean(row?.fixture?.venue?.city) &&
      clean(row?.teams?.home?.name) &&
      clean(row?.teams?.away?.name)
  );
}

function uniqueRows(rows: FixtureListRow[]): FixtureListRow[] {
  const map = new Map<string, FixtureListRow>();

  for (const row of rows) {
    const id = fixtureId(row);
    if (!id) continue;
    map.set(id, row);
  }

  return Array.from(map.values());
}

export function findWeekendTrips(fixtures: FixtureListRow[]): WeekendTrip[] {
  const byCity = new Map<string, { city: string; matches: FixtureListRow[] }>();

  for (const row of uniqueRows(fixtures)) {
    if (!hasUsableShape(row)) continue;
    if (!isWeekendFixture(row)) continue;

    const city = clean(row?.fixture?.venue?.city);
    const key = cityKey(city);
    if (!key) continue;

    const bucket = byCity.get(key) ?? { city, matches: [] };
    bucket.matches.push(row);
    byCity.set(key, bucket);
  }

  return Array.from(byCity.values())
    .map((bucket) => {
      const matches = bucket.matches.sort((a, b) =>
        clean(a?.fixture?.date).localeCompare(clean(b?.fixture?.date))
      );

      return {
        city: bucket.city,
        matches,
        from: isoDateOnly(matches[0]),
        to: isoDateOnly(matches[matches.length - 1]),
        matchCount: matches.length,
      };
    })
    .filter((trip) => trip.matchCount >= 2)
    .sort((a, b) => b.matchCount - a.matchCount || a.from.localeCompare(b.from));
}
