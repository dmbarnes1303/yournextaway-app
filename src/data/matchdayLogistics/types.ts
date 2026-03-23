// src/data/matchdayLogistics/types.ts

export type StayArea = {
  area: string;
  notes?: string;
  budgetFriendly?: boolean;
};

export type LogisticsStop = {
  name: string;
  notes?: string;
  type?: string;
};

export type ParkingOption = {
  name?: string;
  location?: string;
  notes?: string;
  prebookRecommended?: boolean;
  official?: boolean;
};

export type ParkingAvailability = "easy" | "medium" | "hard" | "very_hard";

export type MatchdayLogistics = {
  homeTeamName?: string;
  clubName?: string;
  league?: string;
  country?: string;

  stadium?: string;
  city?: string;

  stay?: {
    bestAreas?: StayArea[];
    budgetAreas?: StayArea[];
    notes?: string[];
  };

  transport?: {
    primaryStops?: LogisticsStop[];
    tips?: string[];
  };

  parking?: {
    availability?: ParkingAvailability;
    summary?: string;
    options?: ParkingOption[];
    tips?: string[];
    notes?: string[];
  };
};
