// src/data/stadiums.ts

import type { StadiumContext } from "@/src/types/stadiumContext";

/**
 * Structured stadium dataset for logistics + proximity features.
 * teamKey must match teamGuides + teams registry.
 */

export const stadiums: Record<string, StadiumContext> = {
  arsenal: {
    stadiumId: "emirates",
    name: "Emirates Stadium",
    lat: 51.5549,
    lon: -0.1084,
    cityCentreLat: 51.5074,
    cityCentreLon: -0.1278,
    areaType: "district",
    primaryTransport: {
      mode: "metro",
      line: "Piccadilly",
      direct: true,
      typicalMinutes: 15
    },
    lateReturnRisk: "easy"
  },

  "aston-villa": {
    stadiumId: "villa-park",
    name: "Villa Park",
    lat: 52.5092,
    lon: -1.8849,
    cityCentreLat: 52.4862,
    cityCentreLon: -1.8904,
    areaType: "district",
    primaryTransport: {
      mode: "rail",
      line: "West Midlands Railway",
      direct: true,
      typicalMinutes: 12
    },
    lateReturnRisk: "moderate"
  },

  "afc-bournemouth": {
    stadiumId: "vitality",
    name: "Vitality Stadium",
    lat: 50.7352,
    lon: -1.8380,
    cityCentreLat: 50.7192,
    cityCentreLon: -1.8808,
    areaType: "suburb",
    primaryTransport: {
      mode: "bus",
      direct: false,
      typicalMinutes: 20
    },
    lateReturnRisk: "moderate"
  },

  "crystal-palace": {
    stadiumId: "selhurst",
    name: "Selhurst Park",
    lat: 51.3983,
    lon: -0.0856,
    cityCentreLat: 51.5074,
    cityCentreLon: -0.1278,
    areaType: "district",
    primaryTransport: {
      mode: "rail",
      line: "Southern / Overground",
      direct: true,
      typicalMinutes: 25
    },
    lateReturnRisk: "moderate"
  },

  everton: {
    stadiumId: "hill-dickinson",
    name: "Hill Dickinson Stadium",
    lat: 53.4499,
    lon: -2.9943,
    cityCentreLat: 53.4084,
    cityCentreLon: -2.9916,
    areaType: "district",
    primaryTransport: {
      mode: "walk",
      direct: true,
      typicalMinutes: 20
    },
    lateReturnRisk: "easy"
  }
};
