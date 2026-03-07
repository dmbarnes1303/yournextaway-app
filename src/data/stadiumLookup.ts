// src/data/stadiumLookup.ts
// Runtime-safe stadium lookup helpers (RN-safe).
// Primary source: matchdayLogistics (human-curated)
// Optional enrichment: stadiumCoords (lat/lng) when available.

import { getMatchdayLogistics } from "@/src/data/matchdayLogistics";
import { normalizeClubKey } from "@/src/data/clubKey";
import { getStadiumCoordByClubName } from "@/src/data/stadiumCoords";

export type StadiumInfo = {
  key: string;
  clubName?: string;
  leagueName?: string;
  stadiumName?: string;
  city?: string;
  lat?: number;
  lng?: number;
  source: "matchdayLogistics" | "stadiumCoords" | "unknown";
};

function clean(s: unknown) {
  return String(s ?? "").trim();
}

/**
 * Main API used by app/match/[id].tsx (based on your error).
 * Returns null if we can't infer anything.
 */
export function getStadiumByHomeTeam(args: {
  homeTeamName?: string | null;
  leagueName?: string | null;
}): StadiumInfo | null {
  const homeTeamName = clean(args.homeTeamName);
  const leagueName = clean(args.leagueName);

  const key = normalizeClubKey(homeTeamName);
  if (!key) return null;

  // 1) Best source: matchdayLogistics (gives stadium + city consistently)
  try {
    const logistics = getMatchdayLogistics({ homeTeamName, leagueName: leagueName || undefined });
    if (logistics) {
      const stadiumName = clean((logistics as any).stadium);
      const city = clean((logistics as any).city);

      // enrich with coords if we have them
      const coord = getStadiumCoordByClubName(homeTeamName);

      return {
        key,
        clubName: homeTeamName || coord?.clubName,
        leagueName: leagueName || undefined,
        stadiumName: stadiumName || coord?.stadiumName,
        city: city || undefined,
        lat: coord?.lat,
        lng: coord?.lng,
        source: "matchdayLogistics",
      };
    }
  } catch {
    // ignore and fallback
  }

  // 2) Fallback: coords dataset (may still include stadiumName)
  const coord = getStadiumCoordByClubName(homeTeamName);
  if (coord) {
    return {
      key,
      clubName: coord.clubName || homeTeamName,
      leagueName: leagueName || undefined,
      stadiumName: coord.stadiumName,
      city: undefined,
      lat: coord.lat,
      lng: coord.lng,
      source: "stadiumCoords",
    };
  }

  // 3) Last-resort: at least return the key
  return {
    key,
    clubName: homeTeamName,
    leagueName: leagueName || undefined,
    source: "unknown",
  };
}

/** Convenience: just coords if you need it somewhere else. */
export function getStadiumCoordsByHomeTeam(homeTeamName?: string | null) {
  const coord = getStadiumCoordByClubName(homeTeamName);
  if (!coord) return null;
  return { lat: coord.lat, lng: coord.lng };
}
