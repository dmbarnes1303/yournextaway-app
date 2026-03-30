export type CityTopThing = {
  title: string;
  tip: string;
};

export type CityGuideBookingLinks = {
  /**
   * Primary experiences / activities provider.
   * Usually a GetYourGuide city landing page.
   */
  thingsToDo?: string;

  /**
   * Optional city-relevant car hire landing page.
   * Use only when a real partner is live.
   */
  carHire?: string;

  /**
   * Optional eSIM / connectivity landing page.
   * Use only when a real partner is live.
   */
  esim?: string;

  /**
   * Optional airport / local transfer landing page.
   * Only use if this is genuinely useful at city level.
   */
  airportTransfer?: string;
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
   * Canonical grouped monetisation / booking links for city-level planning.
   * New work should use this block instead of adding more top-level URL fields.
   */
  bookingLinks?: CityGuideBookingLinks;

  /**
   * Legacy primary monetised experiences link.
   * Kept temporarily for backward compatibility while guides/screens migrate.
   * Do not add new guide data using this field.
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
