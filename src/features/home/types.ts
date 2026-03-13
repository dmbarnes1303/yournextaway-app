import type { FixtureListRow } from "@/src/services/apiFootball";
import type { Trip } from "@/src/state/trips";

export type NextTripData = {
  trip: Trip | null;
  cityTitle: string;
  flagUrl: string;
  teamId: number | null;
  cityImage: string;
};

export type UpcomingFixturesData = {
  loading: boolean;
  error: string | null;
  featured: FixtureListRow | null;
  list: FixtureListRow[];
};
