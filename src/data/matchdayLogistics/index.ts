// src/data/matchdayLogistics/types.ts

export type LogisticsStopType =
  | "train"
  | "metro"
  | "tram"
  | "bus"
  | "ferry"
  | "walk"
  | "other";

export type LogisticsStop = {
  name: string;
  type: LogisticsStopType;
  notes?: string;
};

export type ProximityMode = "walk" | "metro" | "tram" | "bus" | "train" | "taxi" | "rideshare" | "other";

export type AreaProximity = {
  /**
   * Estimated time from the area to the stadium on a typical matchday.
   * Keep it simple: don’t pretend it’s precise.
   */
  minutes?: number;

  /**
   * Optional rough distance. Useful for “near-ish” vs “far”.
   */
  distanceKm?: number;

  /**
   * Dominant mode to reach the stadium from this area.
   */
  mode?: ProximityMode;

  /**
   * Optional short qualifier, e.g. “allow extra time after full-time”
   */
  notes?: string;
};

export type AreaRec = {
  area: string;
  notes?: string;
  budgetFriendly?: boolean;

  /**
   * Optional: used for “stadium proximity” badges.
   * If absent, the UI should not display a proximity badge.
   */
  proximity?: AreaProximity;
};

export type FoodDrinkRec = {
  name: string;
  type: "pub" | "bar" | "food" | "mixed";
  notes?: string;
};

export type ParkingAvailability = "easy" | "medium" | "hard";

export type MatchdayLogistics = {
  stadium: string;
  city: string;
  country: string;

  transport: {
    primaryStops: LogisticsStop[];
    tips?: string[];
  };

  parking: {
    availability: ParkingAvailability;
    summary: string;
    officialLots?: string[];
  };

  foodDrink?: FoodDrinkRec[];

  stay?: {
    bestAreas?: AreaRec[];
    budgetAreas?: AreaRec[];
  };

  arrivalTips?: string[];
};
