// src/data/cityGuides/types.ts

export type CityTopThing = {
  title: string;
  tip: string;
};

export interface CityGuide {
  /** Slug key used for routing + lookup (e.g. "london") */
  cityId: string;

  name: string;
  country: string;

  /** Short intro paragraph */
  overview: string;

  /**
   * Monetised "things to do" deep link.
   * Primary use: GetYourGuide affiliate landing page for the city.
   */
  thingsToDoUrl?: string;

  /**
   * Legacy link (TripAdvisor) - DEPRECATED.
   * Kept only so older guide files don't break at compile time.
   * Do not show this in UI. Do not create new values for it.
   */
  tripAdvisorTopThingsUrl?: string;

  /** Top 10 things to do (with a practical tip for each) */
  topThings: CityTopThing[];

  /** Local tips (short, punchy, useful) */
  tips: string[];

  /** Optional “nice to have” blocks */
  food?: string[];
  transport?: string;
  accommodation?: string;
}

export default CityGuide;
