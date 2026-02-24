// src/utils/geo.ts

export type LatLng = { lat: number; lng: number };

function toNum(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function coerceLatLng(input: any): LatLng | null {
  if (!input) return null;

  const lat = toNum(input.lat ?? input.latitude);
  const lng = toNum(input.lng ?? input.lon ?? input.longitude);

  if (lat == null || lng == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return { lat, lng };
}

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

/**
 * Great-circle distance (Haversine).
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.lng - a.lng);

  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);

  const q =
    s1 * s1 +
    Math.cos(deg2rad(a.lat)) * Math.cos(deg2rad(b.lat)) * s2 * s2;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(q)));
}

/**
 * A pragmatic, offline “travel time” heuristic.
 * - Walk for <= 2.5 km
 * - Transit for > 2.5 km
 * Assumes:
 * - walking 4.8 km/h
 * - urban transit 18 km/h (includes waiting)
 */
export function estimateTravelMinutes(distanceKm: number): { mode: "walk" | "transit"; minutes: number } {
  const km = Math.max(0, distanceKm);

  if (km <= 2.5) {
    const minutes = Math.round((km / 4.8) * 60);
    return { mode: "walk", minutes: Math.max(5, minutes) };
  }

  const minutes = Math.round((km / 18) * 60);
  return { mode: "transit", minutes: Math.max(10, minutes) };
}

export function formatKm(km: number): string {
  if (!Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function formatMinutes(min: number): string {
  if (!Number.isFinite(min)) return "—";
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}
