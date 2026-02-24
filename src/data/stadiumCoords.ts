// src/data/stadiumCoords.ts
import { STADIUM_COORDS, type StadiumCoordEntry } from "@/src/data/stadiumCoords.generated";
import { normalizeClubKey } from "@/src/data/clubKey";

export type ClubStadiumCoord = {
  key: string;
  clubName?: string;
  stadiumName?: string;
  lat: number;
  lng: number;
};

export function getStadiumCoordByClubName(clubName?: string | null): ClubStadiumCoord | null {
  const key = normalizeClubKey(String(clubName ?? ""));
  if (!key) return null;

  const hit = (STADIUM_COORDS as Record<string, StadiumCoordEntry>)[key];
  if (!hit) return null;

  return {
    key,
    clubName: hit.clubName,
    stadiumName: hit.stadiumName,
    lat: hit.lat,
    lng: hit.lng,
  };
}

export function hasStadiumCoordsForClub(clubName?: string | null): boolean {
  const key = normalizeClubKey(String(clubName ?? ""));
  if (!key) return false;
  return Boolean((STADIUM_COORDS as Record<string, StadiumCoordEntry>)[key]);
}
