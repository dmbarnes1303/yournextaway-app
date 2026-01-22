// src/data/cityGuides/types.ts
export type CityTopThing = {
  title: string;
  tip: string;
};

export interface CityGuide {
  cityId: string; // slug key e.g. "london"
  name: string;   // display name e.g. "London"
  country: string;

  overview: string;

  // core requirement
  tripAdvisorTopThingsUrl?: string;
  topThings: CityTopThing[]; // use 10 items for capitals
  tips: string[];            // city-specific tips

  // optional / legacy
  attractions?: string[];
  food?: string[];
  transport?: string;
  accommodation?: string;
}

export default CityGuide;
