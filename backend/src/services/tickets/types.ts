export type TicketProviderId = "footballticketnet" | "sportsevents365";

export type CandidateUrlQuality = "event" | "listing" | "search" | "unknown";

export type TicketCandidateReason =
  | "exact_event"
  | "partial_match"
  | "search_fallback";

export type TicketCandidate = {
  provider: TicketProviderId;
  exact: boolean;
  /**
   * Provider-level confidence after that provider has done its own matching.
   * This is not shown to users.
   */
  score: number;
  /**
   * Optional raw matcher score before any provider-specific URL/fallback penalties.
   * Kept for internal ranking/debug only.
   */
  rawScore?: number | null;
  url: string;
  title: string;
  priceText?: string | null;
  reason: TicketCandidateReason;
  /**
   * Providers can pass explicit URL quality so the resolver does not have to guess.
   */
  urlQuality?: CandidateUrlQuality;
};

export type TicketResolutionOption = {
  provider: TicketProviderId;
  exact: boolean;
  /**
   * Final resolver-selected internal score. Not for UI display.
   */
  score: number;
  /**
   * Raw upstream/provider score for internal use only.
   */
  rawScore: number | null;
  url: string;
  title: string;
  priceText: string | null;
  reason: TicketCandidateReason;
  urlQuality?: CandidateUrlQuality;
};

export type TicketResolution = {
  ok: boolean;
  provider: TicketProviderId | null;
  exact: boolean;
  /**
   * Final selected internal score. Not for UI display.
   */
  score: number | null;
  /**
   * Raw provider/internal score. Not for UI display.
   */
  rawScore: number | null;
  url: string | null;
  title: string | null;
  priceText: string | null;
  reason: TicketCandidateReason | "not_found";
  checkedProviders: TicketProviderId[];
  options: TicketResolutionOption[];
  urlQuality?: CandidateUrlQuality;
};

export type TicketResolveInput = {
  fixtureId?: string | number;
  homeName: string;
  awayName: string;
  kickoffIso: string;
  leagueId?: string | number;
  leagueName?: string;
  debugNoCache?: boolean;
};
