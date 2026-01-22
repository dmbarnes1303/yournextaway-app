// src/data/cityGuides/types.ts

export type CityGuideLink = {
  label: string;
  url: string;
};

export type CityGuideItem = {
  title: string;
  description?: string;
  area?: string; // e.g. "Centro", "Old Town", "Near stadium"
  tags?: string[]; // e.g. ["free", "family", "nightlife"]
  link?: CityGuideLink;
};

export type CityFoodAndDrink = {
  specialties?: string[]; // local dishes/drinks
  areasToEat?: string[]; // neighbourhoods
  pubsAndBars?: CityGuideItem[]; // away-day friendly pubs, etc.
  restaurants?: CityGuideItem[];
  quickBites?: CityGuideItem[];
};

export type CityTransport = {
  gettingAround: string[]; // bullets
  airport?: string[]; // bullets
  rail?: string[]; // bullets
  matchday?: string[]; // bullets: how to get to stadium, last train, etc.
  taxis?: string[]; // bullets
  safety?: string[]; // bullets (scams/areas)
};

export type CityStay = {
  bestAreas: CityGuideItem[]; // where to stay + why
  avoidAreas?: CityGuideItem[]; // optional, but useful
  budgetTips?: string[];
};

export type CityMatchday = {
  vibe?: string; // short paragraph
  beforeMatch?: CityGuideItem[]; // where to go before kick-off
  afterMatch?: CityGuideItem[]; // where to go after
  stadiumTips?: string[]; // entry times, bag policy reminders, etc.
  awayFans?: string[]; // tone and practical tips
};

export interface CityGuide {
  /**
   * Canonical id/slug for routing + storage. Example: "madrid", "london", "milan".
   */
  cityId: string;

  /**
   * Display name. Example: "Madrid".
   */
  name: string;

  /**
   * Aliases used to match data coming from fixtures/APIs:
   * Example: ["Madrid", "Madrid, Spain", "Comunidad de Madrid"].
   */
  aliases: string[];

  /**
   * Short summary suitable for cards.
   */
  tagline: string;

  /**
   * Longer overview for the guide page.
   */
  overview: string;

  /**
   * Curated "Top things to do" (your own list). This powers in-app value.
   */
  topThingsToDo: CityGuideItem[];

  /**
   * Food + drink details.
   */
  foodAndDrink: CityFoodAndDrink;

  /**
   * Transport guidance.
   */
  transport: CityTransport;

  /**
   * Where to stay.
   */
  accommodation: CityStay;

  /**
   * Matchday-specific content (what your app is about).
   */
  matchday: CityMatchday;

  /**
   * Useful links (TripAdvisor, official tourism board, transit maps, etc).
   * TripAdvisor can be generated dynamically too, but storing a slot is helpful.
   */
  links?: CityGuideLink[];

  /**
   * Lightweight, reusable “quick tips” for surfaces like Trip Build.
   * Keep these short; the detailed content lives in the sections above.
   */
  quickTips: string[];
}

export default CityGuide;
