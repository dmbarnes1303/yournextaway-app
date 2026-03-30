export type TicketProviderId =
  | "footballticketsnet"
  | "sportsevents365"
  | "stubhub"
  | "gigsberg";

export type TicketResolveReason =
  | "exact_event"
  | "search_fallback"
  | "partial_match"
  | "not_found";

export type CandidateUrlQuality =
  | "event"
  | "listing"
  | "search"
  | "unknown";

export type TicketResolveInput = {
  fixtureId?: string | number;
  homeName: string;
  awayName: string;
  kickoffIso: string;
  leagueName?: string;
  leagueId?: string | number;
  debugNoCache?: boolean;
};

export type TicketCandidate = {
  provider: TicketProviderId;
  exact: boolean;

  /**
   * Provider-native score before resolver penalties/bonuses.
   * This should reflect how strongly the provider match logic
   * believes the candidate matches the requested fixture.
   */
  score: number;

  url: string;
  title: string;
  priceText?: string | null;
  reason: Exclude<TicketResolveReason, "not_found">;
};

export type TicketOption = {
  provider: TicketProviderId;
  exact: boolean;

  /**
   * Final resolver-selected score after adjustments.
   */
  score: number;

  /**
   * Original provider-native score before resolver adjustments.
   */
  rawScore?: number | null;

  url: string;
  title: string;
  priceText?: string | null;
  reason: Exclude<TicketResolveReason, "not_found">;

  /**
   * Resolver assessment of what kind of destination this URL is.
   */
  urlQuality?: CandidateUrlQuality;
};

export type TicketResolution = {
  ok: boolean;
  provider: TicketProviderId | null;
  exact: boolean;

  /**
   * Final resolver-selected score after adjustments.
   */
  score: number | null;

  /**
   * Original provider-native score before resolver adjustments.
   */
  rawScore?: number | null;

  url: string | null;
  title: string | null;
  priceText?: string | null;
  reason: TicketResolveReason;
  checkedProviders: TicketProviderId[];
  options: TicketOption[];

  /**
   * Resolver assessment of the selected URL.
   */
  urlQuality?: CandidateUrlQuality;
};
