import type { FixtureListRow } from "@/src/services/apiFootball";
import type { DiscoverReason } from "@/src/features/discover/discoverEngine";

export type RankedFixtureRow = FixtureListRow & {
  discoverReasons?: DiscoverReason[];
};

export type FixtureScreenContext = {
  from: string;
  to: string;
};

export type FixtureRouteCtx = {
  leagueId?: number | null;
  season?: number | null;
};
