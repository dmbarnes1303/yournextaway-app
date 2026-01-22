// src/data/cityGuides/types.ts

export type CityArea = {
  name: string;
  vibe: string;
  whyStay: string;
  goodFor?: string[]; // e.g. ["first-timers", "nightlife", "food"]
};

export type CityThingToDo = {
  title: string;
  tip: string; // short, actionable, not fluffy
};

export interface CityGuide {
  cityId: string; // slug key, e.g. "london"
  name: string;
  country: string;

  airports?: string; // simple human string e.g. "LHR / LGW / STN..."
  coversTeams?: string[]; // optional, but useful for football-first routing later
  hasGuide: boolean;

  vibe: string; // short “feel of the city”
  whyGo: string; // why this city is worth the trip

  bestAreasToStay: CityArea[];

  // Core travel utilities
  transportTips: string;
  accommodationTips: string;

  // Matchday-specific, but still city-first
  matchdayTips: string[];
  stadiumAreaTips: string;

  // Content depth
  topThingsToDo: CityThingToDo[]; // target: 10 items
  foodAndDrink: string[]; // quick hits, not essays
  nightlife: string;
  budgetTips: string;

  // External link (you requested this)
  tripAdvisorTopThingsUrl: string;

  // “Local hacks” / practical tips
  cityTips: string[];
}

export default CityGuide;
