export type TicketProviderId = "footballticketnet" | "sportsevents365";

export type CandidateUrlQuality = "event" | "listing" | "search" | "unknown";

export type TicketCandidateReason = "exact_event" | "partial_match" | "search_fallback";

export type TicketCandidate = {
  provider: TicketProviderId;
  exact: boolean;
  score: number;
  url: string;
  title: string;
  priceText?: string | null;
  reason: TicketCandidateReason;
};

export type TicketResolutionOption = {
  provider: TicketProviderId;
  exact: boolean;
  score: number;
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
  score: number | null;
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
