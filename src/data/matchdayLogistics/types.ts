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

export type AreaRec = {
  area: string;
  notes?: string;
  budgetFriendly?: boolean;

  /**
   * Optional centroid for distance sorting
   * (lat/lng of neighbourhood centre)
   */
  lat?: number;
  lng?: number;
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

  /**
   * Stadium coordinates (required for distance logic)
   */
  stadiumLat: number;
  stadiumLng: number;

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
