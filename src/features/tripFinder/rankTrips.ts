import type { FixtureListRow } from "@/src/services/apiFootball";
import type { StadiumRecord } from "@/src/data/stadiums/types";
import stadiums from "@/src/data/stadiums";
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

function resolveStadium(row: FixtureListRow): StadiumRecord | null {
  const homeName = String(row?.teams?.home?.name ?? "").trim();
  const venueName = String(row?.fixture?.venue?.name ?? "").trim();

  const all = Object.values(stadiums);

  if (homeName) {
    const teamKey = normalizeTeamKey(homeName);
    const byTeam =
      all.find((s) => s.teamKeys.some((k) => normalizeValue(k) === normalizeValue(teamKey))) ?? null;
    if (byTeam) return byTeam;
  }

  if (venueName) {
    const venueKey = normalizeValue(venueName);

    const byKey = all.find((s) => normalizeValue(s.stadiumKey) === venueKey) ?? null;
    if (byKey) return byKey;

    const byName = all.find((s) => normalizeValue(s.name) === venueKey) ?? null;
    if (byName) return byName;
  }

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
