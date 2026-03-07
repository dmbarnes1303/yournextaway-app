import type { FixtureListRow } from "@/src/services/apiFootball";
import type { StadiumRecord } from "@/src/data/stadiums/types";
import {
  getAllStadiums,
  getStadiumByTeamFromRegistry,
} from "@/src/data/stadiumRegistry";
import { normalizeTeamKey } from "@/src/data/teams";
import { getTripFinderBreakdown } from "./scoring";
import type { RankedTrip } from "./types";

function stripDiacritics(input: string): string {
  try {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return input;
  }
}

function normalizeValue(input: string): string {
  return stripDiacritics(String(input ?? ""))
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const VENUE_ALIASES: Record<string, string[]> = {
  "estadio-do-sport-lisboa-e-benfica": ["estadio-da-luz"],
  "estadio-do-fc-porto": ["estadio-do-dragao"],
  "estadio-jose-alvalade-xxi": ["estadio-jose-alvalade"],
  "allianz-arena-munchen": ["allianz-arena"],
  "signal-iduna-park-dortmund": ["signal-iduna-park"],
  "parc-des-princes-paris": ["parc-des-princes"],
  "stade-velodrome-marseille": ["velodrome"],
  "san-siro": ["san-siro"],
};

function resolveStadium(row: FixtureListRow): StadiumRecord | null {
  const all = getAllStadiums();

  const homeName = String(row?.teams?.home?.name ?? "").trim();
  const venueName = String(row?.fixture?.venue?.name ?? "").trim();

  if (homeName) {
    const teamKey = normalizeTeamKey(homeName);
    const byTeam = getStadiumByTeamFromRegistry(teamKey);
    if (byTeam) return byTeam;
  }

  if (!venueName) return null;

  const venueKey = normalizeValue(venueName);

  const exactKeyHit =
    all.find((s) => normalizeValue(s.stadiumKey) === venueKey) ?? null;
  if (exactKeyHit) return exactKeyHit;

  const exactNameHit =
    all.find((s) => normalizeValue(s.name) === venueKey) ?? null;
  if (exactNameHit) return exactNameHit;

  const aliases = VENUE_ALIASES[venueKey] ?? [];
  if (aliases.length > 0) {
    const aliasHit =
      all.find((s) =>
        aliases.some((alias) => normalizeValue(s.stadiumKey) === normalizeValue(alias))
      ) ?? null;
    if (aliasHit) return aliasHit;
  }

  const looseNameHit =
    all.find((s) => {
      const stadiumName = normalizeValue(s.name);
      return stadiumName.includes(venueKey) || venueKey.includes(stadiumName);
    }) ?? null;
  if (looseNameHit) return looseNameHit;

  return null;
}

export function rankTrips(rows: FixtureListRow[]): RankedTrip[] {
  return rows
    .filter((row) => row?.fixture?.id != null)
    .map((row) => {
      const stadium = resolveStadium(row);

      const city = String(stadium?.city ?? row?.fixture?.venue?.city ?? "").trim();
      const country = String(stadium?.country ?? "").trim();
      const stadiumName = String(stadium?.name ?? row?.fixture?.venue?.name ?? "").trim();
      const kickoffIso = String(row?.fixture?.date ?? "").trim() || null;

      const breakdown = getTripFinderBreakdown(row, stadium);

      return {
        fixture: row,
        stadium,
        city,
        country,
        stadiumName,
        kickoffIso,
        breakdown,
      };
    })
    .sort((a, b) => {
      if (b.breakdown.combinedScore !== a.breakdown.combinedScore) {
        return b.breakdown.combinedScore - a.breakdown.combinedScore;
      }

      const ad = String(a.kickoffIso ?? "");
      const bd = String(b.kickoffIso ?? "");
      return ad.localeCompare(bd);
    });
}

export default rankTrips;
