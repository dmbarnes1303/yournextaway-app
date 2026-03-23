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
  // identity
  homeTeamName?: string;
  clubName?: string;
  league?: string;
  country?: string;

  // stadium context
  stadium?: string;
  city?: string;

  // stay guidance
  stay?: {
    bestAreas?: StayArea[];
    budgetAreas?: StayArea[];
    notes?: string[];
  };

  // transport guidance
  transport?: {
    primaryStops?: LogisticsStop[];
    tips?: string[];
  };

  // driving / parking guidance
  parking?: {
    availability?: ParkingAvailability;
    options?: ParkingOption[];
    tips?: string[];
    notes?: string[];
  };
};
