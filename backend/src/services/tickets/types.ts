export type TicketProviderId =
  | "footballticketsnet"
  | "sportsevents365"
  | "gigsberg";

export type TicketResolveReason =
  | "exact_event"
  | "search_fallback"
  | "partial_match"
  | "not_found";

export type TicketResolveInput = {
  fixtureId?: string | number;
  homeName: string;
  awayName: string;
  kickoffIso: string;
  leagueName?: string;
  leagueId?: string | number;
};

export type TicketCandidate = {
  provider: TicketProviderId;
  exact: boolean;
  score: number;
  url: string;
  title: string;
  priceText?: string | null;
  reason: Exclude<TicketResolveReason, "not_found">;
};

export type TicketResolution = {
  ok: boolean;
  provider: TicketProviderId | null;
  exact: boolean;
  score: number | null;
  url: string | null;
  title: string | null;
  priceText?: string | null;
  reason: TicketResolveReason;
  checkedProviders: TicketProviderId[];
};
