// src/utils/stadiumProximity.ts

import { getStadium } from "./stadiums";

export interface StadiumProximity {
  distanceKm: number;
  travelMinutes: number;
  areaType: string;
  lateReturnRisk: string;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns proximity info for a team’s stadium relative to city centre.
 */
export function getStadiumProximity(teamKey: string): StadiumProximity | null {
  const s = getStadium(teamKey);
  if (!s) return null;

  const distance = haversineKm(
    s.lat,
    s.lon,
    s.cityCentreLat,
    s.cityCentreLon
  );

  return {
    distanceKm: Math.round(distance * 10) / 10,
    travelMinutes: s.primaryTransport.typicalMinutes,
    areaType: s.areaType,
    lateReturnRisk: s.lateReturnRisk
  };
}
