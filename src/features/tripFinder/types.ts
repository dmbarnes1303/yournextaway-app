import type { FixtureListRow } from "@/src/services/apiFootball";
import type { StadiumRecord } from "@/src/data/stadiums/types";

export type TravelDifficulty = "easy" | "moderate" | "hard" | "complex";

export type TripScoreBreakdown = {
  travelDifficulty: TravelDifficulty;
  travelDifficultyScore: number; // 0-100
  weekendTripScore: number; // 0-100
  atmosphereScore: number; // 0-100
  matchInterestScore: number; // 0-100
  combinedScore: number; // 0-100
  reasonLines: string[];
};

export type RankedTrip = {
  fixture: FixtureListRow;
  stadium: StadiumRecord | null;
  city: string;
  country: string;
  stadiumName: string;
  kickoffIso: string | null;
  breakdown: TripScoreBreakdown;
};

export type WeekendBucket = {
  key: string;
  from: string;
  to: string;
  label: string;
  trips: RankedTrip[];
  topScore: number;
  avgScore: number;
};
