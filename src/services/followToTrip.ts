// src/services/followToTrip.ts
import tripsStore, { type Trip } from "@/src/state/trips";
import useFollowStore from "@/src/state/followStore";
import { addDaysIso, clampFromIsoToTomorrow } from "@/src/constants/football";

function isoDateOnlyFromKickoffIso(kickoffIso: string | null): string | null {
  if (!kickoffIso) return null;
  const s = String(kickoffIso).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function todayIsoDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Create (or reuse) a Trip from a followed match fixtureId.
 * Idempotent: if any trip already contains this fixtureId in matchIds, returns that trip.
 */
export async function createTripFromFollowedMatch(fixtureId: string): Promise<Trip> {
  const id = String(fixtureId ?? "").trim();
  if (!id) throw new Error("fixtureId required");

  // Ensure trips are loaded
  if (!tripsStore.getState().loaded) await tripsStore.loadTrips();

  // 1) Reuse if already exists
  const existing = tripsStore.getTripByMatchId(id);
  if (existing) return existing;

  // 2) Pull followed metadata
  const followed = useFollowStore.getState().followed.find((x) => String(x.fixtureId).trim() === id) ?? null;

  const city =
    (followed?.city && String(followed.city).trim()) ||
    (followed?.venue && String(followed.venue).trim()) ||
    "Trip";

  const startFromKick = isoDateOnlyFromKickoffIso(followed?.kickoffIso ?? null);
  const startDate = clampFromIsoToTomorrow(startFromKick ?? todayIsoDateOnly());
  const endDate = addDaysIso(startDate, 2);

  // 3) Create
  const trip = await tripsStore.addTrip({
    cityId: city,
    startDate,
    endDate,
    matchIds: [id],
    notes: undefined,
  });

  return trip;
}
