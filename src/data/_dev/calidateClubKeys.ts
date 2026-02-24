import { normalizeClubKey } from "@/src/data/clubKey";

import premierLeagueLogistics from "@/src/data/matchdayLogistics/premierLeague";
import laLigaLogistics from "@/src/data/matchdayLogistics/laLiga";
import serieALogistics from "@/src/data/matchdayLogistics/serieA";
import bundesligaLogistics from "@/src/data/matchdayLogistics/bundesliga";
import ligue1Logistics from "@/src/data/matchdayLogistics/ligue1";

const ALL_MAPS = {
  premierLeagueLogistics,
  laLigaLogistics,
  serieALogistics,
  bundesligaLogistics,
  ligue1Logistics,
};

function validateMap(name: string, map: Record<string, any>) {
  const keys = Object.keys(map);

  for (const k of keys) {
    const normalized = normalizeClubKey(k);

    if (normalized !== k) {
      console.warn(
        `[ClubKeyMismatch] ${name}: key "${k}" normalizes to "${normalized}". Fix key or alias.`
      );
    }
  }
}

export function validateAllClubKeys() {
  Object.entries(ALL_MAPS).forEach(([name, map]) =>
    validateMap(name, map)
  );
}
