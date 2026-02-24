import { normalizeClubKey } from "@/src/data/clubKey";

import premierLeagueLogistics from "@/src/data/matchdayLogistics/premierLeague";
import laLigaLogistics from "@/src/data/matchdayLogistics/laLiga";
import serieALogistics from "@/src/data/matchdayLogistics/serieA";
import bundesligaLogistics from "@/src/data/matchdayLogistics/bundesliga";
import ligue1Logistics from "@/src/data/matchdayLogistics/ligue1";

/**
 * DEV VALIDATION:
 * Ensures all registry keys already match normalizeClubKey().
 *
 * Why this matters:
 * - Prevents lookup failures in getMatchdayLogistics()
 * - Prevents silent missing logistics in UI
 * - Catches typos immediately after edits
 *
 * Runs once at app bootstrap in DEV only.
 */

const ALL_MAPS: Record<string, Record<string, unknown>> = {
  premierLeagueLogistics,
  laLigaLogistics,
  serieALogistics,
  bundesligaLogistics,
  ligue1Logistics,
};

function validateMap(name: string, map: Record<string, unknown>) {
  const keys = Object.keys(map);

  for (const k of keys) {
    const normalized = normalizeClubKey(k);

    if (normalized !== k) {
      console.warn(
        `[ClubKeyMismatch] ${name}: key "${k}" normalizes to "${normalized}".`
      );
    }
  }
}

export function validateAllClubKeys() {
  Object.entries(ALL_MAPS).forEach(([name, map]) =>
    validateMap(name, map)
  );
}
