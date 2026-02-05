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
   * Legacy / fallback only (avoid showing in UI if monetised link exists).
   * Keep temporarily while you build coverage; remove later if you want.
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
