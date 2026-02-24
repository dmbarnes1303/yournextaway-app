// src/types/stadiumContext.ts

export type StadiumAreaType = "central" | "district" | "suburb" | "remote";
export type TransportMode = "metro" | "tram" | "rail" | "bus" | "walk" | "mixed";
export type LateReturnRisk = "easy" | "moderate" | "risky";

export interface StadiumTransport {
  mode: TransportMode;
  line?: string;
  direct: boolean;
  typicalMinutes: number;
}

export interface StadiumContext {
  stadiumId: string;
  name: string;

  lat: number;
  lon: number;

  cityCentreLat: number;
  cityCentreLon: number;

  areaType: StadiumAreaType;

  primaryTransport: StadiumTransport;

  lateReturnRisk: LateReturnRisk;
}
