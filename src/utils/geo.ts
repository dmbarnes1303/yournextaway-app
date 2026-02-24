// src/utils/geo.ts
export type LatLng = { lat: number; lng: number };

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

/**
 * Heuristic travel times (no routing API):
 * - 0–2km: walking
 * - 2–8km: metro/bus
 * - 8–30km: transit/taxi
 */
export function estimateTravelTimeMinutes(distanceKm: number): {
  mode: "walk" | "transit" | "taxi";
  minutes: number;
} {
  const d = Math.max(0, distanceKm);

  if (d <= 2) {
    const minutes = Math.round((d / 4.8) * 60); // 4.8 km/h
    return { mode: "walk", minutes: Math.max(8, minutes) };
  }

  if (d <= 8) {
    const minutes = Math.round((d / 18) * 60 + 10); // average + wait
    return { mode: "transit", minutes: Math.max(12, minutes) };
  }

  const minutes = Math.round((d / 28) * 60 + 12); // faster but still buffer
  return { mode: "taxi", minutes: Math.max(18, minutes) };
}

export function formatKm(km: number) {
  if (!Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function formatMins(mins: number) {
  if (!Number.isFinite(mins)) return "—";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
