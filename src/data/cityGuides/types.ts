// src/data/cityGuides/types.ts

export type CityGuideThing = {
  title: string;
  tip: string;
};

export interface CityGuide {
  /** Slug key used in routes + lookup (e.g. "london") */
  cityId: string;

  /** Display fields */
  name: string;
  country: string;

  /** Short narrative */
  overview: string;

  /** “Top 10 things to do” with a useful tip for each */
  topThings: CityGuideThing[];

  /** Local, practical tips (short bullets) */
  tips: string[];

  /** Optional sections (expand later) */
  transport?: string;
  accommodation?: string;

  /** Optional external link */
  tripAdvisorTopThingsUrl?: string;
}

export default CityGuide;
