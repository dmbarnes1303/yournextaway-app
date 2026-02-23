// src/data/matchdayLogistics/types.ts

export type TransportStop = {
  name: string;
  type: "metro" | "train" | "tram" | "bus";
  distanceMeters?: number;
  notes?: string;
};

export type FoodDrinkPlace = {
  name: string;
  type: "pub" | "bar" | "food" | "mixed";
  distanceMeters?: number;
  notes?: string;
};

export type ParkingInfo = {
  availability: "easy" | "medium" | "hard" | "avoid";
  summary: string;
  officialLots?: string[];
};

export type StayArea = {
  area: string;
  travelTimeMinutes?: number;
  notes?: string;
  budgetFriendly?: boolean;
};

export type MatchdayLogistics = {
  stadium: string;
  city: string;
  country: string;

  transport: {
    primaryStops: TransportStop[];
    tips?: string[];
  };

  parking?: ParkingInfo;

  foodDrink?: FoodDrinkPlace[];

  stay?: {
    bestAreas?: StayArea[];
    budgetAreas?: StayArea[];
  };

  arrivalTips?: string[];
};
