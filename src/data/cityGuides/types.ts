export type CityTopThing = {
  title: string;
  tip: string;
};

export interface CityGuide {
  /** Stable slug key used for routing + lookup, e.g. "london" */
  cityId: string;

  /** Display name */
  name: string;

  /** Country display name */
  country: string;

  /** Intro paragraph */
  overview: string;

  /**
   * Primary monetised experiences link.
   * Usually a GetYourGuide city landing page.
   */
  thingsToDoUrl?: string;

  /**
   * Deprecated legacy field kept only for backward compatibility.
   * Do not create new values for this.
   */
  tripAdvisorTopThingsUrl?: string;

  /** Core visitor recommendations */
  topThings: CityTopThing[];

  /** Practical city tips */
  tips: string[];

  /** Optional supporting sections */
  food?: string[];
  transport?: string;
  accommodation?: string;
}

export type CityGuideRegistry = Record<string, CityGuide>;
