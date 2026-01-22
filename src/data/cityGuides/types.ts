// src/data/cityGuides/types.ts

export type CityTopThing = {
  title: string;
  tip: string; // short, practical note
};

export interface CityGuide {
  /**
   * IMPORTANT:
   * In the current app, tripsStore saves `cityId` as a free-text label (often venue city).
   * So we key guides by a normalized value (e.g. "london", "madrid").
   */
  cityId: string; // normalized key, e.g. "london"

  name: string; // display name, e.g. "London"
  country: string;

  overview: string;

  /** One TripAdvisor link for "Top things to do" */
  tripAdvisorTopThingsUrl: string;

  /** Exactly the kind of “top 10 things” users want at trip time */
  topThings: CityTopThing[];

  /** Practical, away-day style advice */
  tips: string[];

  /** Optional extra structured info (kept compatible with your older placeholder fields) */
  attractions?: string[];
  food?: string[];
  transport?: string;
  accommodation?: string;
}

export default CityGuide;
