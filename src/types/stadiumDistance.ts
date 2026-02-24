// src/utils/stadiumDistance.ts

import type { StadiumContext } from "@/src/types/stadiumContext";

export interface StadiumProximity {
  distanceKm: number;
  travelMinutes: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export function getStadiumProximity(ctx: StadiumContext): StadiumProximity {
  const distanceKmRaw = haversineKm(ctx.lat, ctx.lon, ctx.cityCentreLat, ctx.cityCentreLon);

  return {
    distanceKm: Math.round(distanceKmRaw * 10) / 10,
    travelMinutes: ctx.primaryTransport.typicalMinutes,
  };
}
