// src/data/matchdayLogistics/types.ts

export type StayArea = { area: string; notes?: string };
export type LogisticsStop = { name: string; notes?: string };

export type MatchdayLogistics = {
  // identity
  homeTeamName?: string; // optional - helps matching
  clubName?: string; // optional - helps matching
  league?: string;

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
};
