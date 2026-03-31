export type CityTopThing = {
  title: string;
  tip: string;
};

export type CityGuideBookingLinks = {
  /**
   * Canonical city-level experiences / activities link.
   * This should usually be the GetYourGuide city landing page.
   *
   * This is the primary commercial field for "things" and should be preferred
   * everywhere over legacy top-level URL fields.
   */
  thingsToDo?: string;

  /**
   * Optional city-level car hire landing page.
   * Only populate when a real live partner exists and is actually surfaced in app.
   */
  carHire?: string;

  /**
   * Optional city-level eSIM / connectivity landing page.
   * Only populate when a real live partner exists and is actually surfaced in app.
   */
  esim?: string;

  /**
   * Optional city-level airport / local transfer landing page.
   * Only populate when there is a genuinely useful partner destination for this city.
   */
  airportTransfer?: string;
};

export interface CityGuide {
  /**
   * Stable slug key used for routing + lookup.
   * Example: "london"
   */
  cityId: string;

  /**
   * Human-readable city name.
   */
  name: string;

  /**
   * Human-readable country name.
   */
  country: string;

  /**
   * Lead intro paragraph for the city.
   */
  overview: string;

  /**
   * Canonical grouped booking / monetisation links for city-level planning.
   *
   * This is the primary source of truth for city commercial links.
   * New guide data should be added here, not via legacy top-level URL fields.
   */
  bookingLinks?: CityGuideBookingLinks;

  /**
   * Legacy experiences link.
   *
   * Transitional fallback only while old guides / screens are being migrated.
   * Do not add new guide data using this field.
   * Consumers should prefer bookingLinks.thingsToDo first.
   */
  thingsToDoUrl?: string;

  /**
   * Deprecated legacy field kept only for backward compatibility.
   *
   * Do not add new values.
   * Do not build new UI against this field.
   */
  tripAdvisorTopThingsUrl?: string;

  /**
   * Core visitor recommendations for the city.
   */
  topThings: CityTopThing[];

  /**
   * Practical city-level tips.
   */
  tips: string[];

  /**
   * Optional supporting sections.
   */
  food?: string[];
  transport?: string;
  accommodation?: string;
}

export type CityGuideRegistry = Record<string, CityGuide>;
