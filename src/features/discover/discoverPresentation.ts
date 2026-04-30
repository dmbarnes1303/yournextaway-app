// src/features/discover/discoverPresentation.ts

import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import type { FixtureListRow } from "@/src/services/apiFootball";
import type { DiscoverCategory } from "./discoverCategories";
import type { DiscoverTripLength, DiscoverVibe } from "./discoverEngine";

const EUROPEAN_COMPETITION_IDS = new Set([2, 3, 848]);

const ELITE_LEAGUE_IDS = new Set([39, 140, 135, 78, 61]);
const STRONG_TRAVEL_LEAGUE_IDS = new Set([88, 94, 179, 203]);

const KNOWN_DERBY_LABELS: Record<string, string> = {
  "ajax|feyenoord": "De Klassieker",
  "arsenal|tottenham-hotspur": "North London Derby",
  "atletico-madrid|real-madrid": "Madrid Derby",
  "celtic|rangers": "Old Firm",
  "everton|liverpool": "Merseyside Derby",
  "fenerbahce|galatasaray": "Intercontinental Derby",
  "inter|milan": "Derby della Madonnina",
  "lazio|roma": "Rome Derby",
  "manchester-city|manchester-united": "Manchester Derby",
  "marseille|paris-saint-germain": "Le Classique",
  "olympiacos|panathinaikos": "Derby of the Eternal Enemies",
  "real-betis|sevilla": "Seville Derby",
  "barcelona|real-madrid": "El Clásico",
  "bayern-munich|borussia-dortmund": "Der Klassiker",
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function toSlug(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/&/g, "and")
    .replace(/\bfc\b/g, "")
    .replace(/\bac\b/g, "")
    .replace(/\bss\b/g, "")
    .replace(/\bclub\b/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normaliseTeamSlug(value: string) {
  const slug = toSlug(value);

  if (slug === "tottenham" || slug === "spurs") return "tottenham-hotspur";
  if (slug === "atletico" || slug === "atlético-madrid") return "atletico-madrid";
  if (slug === "psg") return "paris-saint-germain";
  if (slug === "man-united" || slug === "manchester-utd") return "manchester-united";
  if (slug === "man-city") return "manchester-city";
  if (slug === "bayern") return "bayern-munich";
  if (slug === "dortmund") return "borussia-dortmund";
  if (slug === "sporting") return "sporting-cp";

  return slug;
}

function fixtureDate(row: FixtureListRow): Date | null {
  const raw = clean(row?.fixture?.date);
  if (!raw) return null;
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function getLeagueId(row: FixtureListRow): number | null {
  return row?.league?.id != null ? Number(row.league.id) : null;
}

function getLeagueName(row: FixtureListRow): string {
  return clean(row?.league?.name);
}

function getCity(row: FixtureListRow): string {
  return clean(row?.fixture?.venue?.city);
}

function getVenue(row: FixtureListRow): string {
  return clean(row?.fixture?.venue?.name);
}

function homeName(row: FixtureListRow): string {
  return clean(row?.teams?.home?.name) || "Home";
}

function awayName(row: FixtureListRow): string {
  return clean(row?.teams?.away?.name) || "Away";
}

export function fixtureTitle(row: FixtureListRow) {
  return `${homeName(row)} vs ${awayName(row)}`;
}

export function fixtureMeta(row: FixtureListRow) {
  const kickoff = formatUkDateTimeMaybe(row?.fixture?.date);
  const venue = getVenue(row);
  const city = getCity(row);
  const league = getLeagueName(row);

  const place = [venue, city].filter(Boolean).join(" • ");
  const tail = [place, league].filter(Boolean).join(" • ");

  return tail ? `${kickoff} • ${tail}` : kickoff;
}

export function isMidweekFixture(row: FixtureListRow) {
  const dt = fixtureDate(row);
  if (!dt) return false;
  const day = dt.getDay();
  return day >= 1 && day <= 4;
}

export function isLateKickoff(row: FixtureListRow) {
  const dt = fixtureDate(row);
  if (!dt) return false;
  const h = dt.getHours();
  return h >= 19 && h <= 22;
}

export function isWeekendFixture(row: FixtureListRow) {
  const dt = fixtureDate(row);
  if (!dt) return false;
  const day = dt.getDay();
  return day === 5 || day === 6 || day === 0;
}

export function isEuropeanCompetition(row: FixtureListRow) {
  const leagueId = getLeagueId(row);
  return leagueId != null && EUROPEAN_COMPETITION_IDS.has(leagueId);
}

function getFixturePairKey(row: FixtureListRow) {
  const a = normaliseTeamSlug(homeName(row));
  const b = normaliseTeamSlug(awayName(row));
  if (!a || !b) return "";
  return [a, b].sort().join("|");
}

function derbyLabel(row: FixtureListRow): string | null {
  const pair = getFixturePairKey(row);
  return KNOWN_DERBY_LABELS[pair] ?? null;
}

function leagueStrengthLabel(row: FixtureListRow): string | null {
  const leagueId = getLeagueId(row);

  if (leagueId === 2) return "Champions League route";
  if (leagueId === 3) return "Europa League route";
  if (leagueId === 848) return "Conference League route";
  if (leagueId != null && ELITE_LEAGUE_IDS.has(leagueId)) return "Major league trip";
  if (leagueId != null && STRONG_TRAVEL_LEAGUE_IDS.has(leagueId)) return "Strong football-trip route";

  return null;
}

export function trendingLabelForFixture(row: FixtureListRow) {
  const derby = derbyLabel(row);
  if (derby) return derby;

  if (isEuropeanCompetition(row)) return leagueStrengthLabel(row) ?? "European night";

  const city = getCity(row);
  if (city && isLateKickoff(row)) return `${city} night fixture`;
  if (city && isWeekendFixture(row)) return `${city} weekend route`;
  if (city) return `${city} football trip`;

  return leagueStrengthLabel(row) ?? "Strong live route";
}

export function whyThisFits(
  row: FixtureListRow,
  category: DiscoverCategory,
  vibes: DiscoverVibe[],
  tripLength: DiscoverTripLength
) {
  const derby = derbyLabel(row);
  const city = getCity(row);
  const leagueId = getLeagueId(row);
  const isEliteLeague = leagueId != null && ELITE_LEAGUE_IDS.has(leagueId);

  if (derby) return `${derby}: bigger edge, stronger story and more reason to travel.`;

  if (category === "easyTickets") {
    return "Cleaner route for a simpler football trip, with less planning friction.";
  }

  if (category === "bigMatches") {
    if (isEuropeanCompetition(row)) return "European fixture with stronger occasion value.";
    if (isEliteLeague) return "Major-league fixture with better travel pull.";
    return "One of the stronger fixtures in the current live pool.";
  }

  if (category === "derbies") {
    return "Rivalry angle gives this more edge than a standard fixture.";
  }

  if (category === "atmospheres") {
    return "Higher-upside crowd energy and stronger matchday feel.";
  }

  if (category === "valueTrips") {
    return "Better experience-per-pound potential without defaulting to the obvious.";
  }

  if (category === "europeanNights") {
    return isEuropeanCompetition(row)
      ? "Continental fixture with a stronger lights-on travel feel."
      : "Not European competition, but still strong enough for this route.";
  }

  if (category === "multiMatchTrips") {
    return city
      ? `${city} gives this anchor fixture better stacking potential.`
      : "Useful anchor fixture for building a bigger football break.";
  }

  if (category === "weekendTrips") {
    return isWeekendFixture(row)
      ? "Weekend-timed fixture that fits a cleaner football break."
      : "Not perfectly timed, but still workable if the wider trip stacks well.";
  }

  if (category === "nightMatches") {
    return isLateKickoff(row)
      ? "Later kick-off gives it better lights-on energy."
      : "Good enough for an evening-led football route.";
  }

  if (category === "matchdayCulture") {
    return "Better city-and-football balance beyond just the 90 minutes.";
  }

  if (category === "iconicCities") {
    return city ? `${city} adds real pull beyond the fixture.` : "The destination adds value beyond the match.";
  }

  if (category === "legendaryStadiums") {
    return "Ground, club and occasion value are doing the heavy lifting.";
  }

  if (category === "titleDrama") {
    return "Sharper sporting stakes make this more than a casual fixture.";
  }

  if (category === "bucketList") {
    return "The sort of fixture route that feels worth building a trip around.";
  }

  if (category === "underratedTrips") {
    return "Less obvious route with stronger upside than it first looks.";
  }

  if (tripLength === "2" || tripLength === "3") {
    return city ? `Good shape for a ${city} football city break.` : "Strong shape for a football city break.";
  }

  if (isMidweekFixture(row) && isEuropeanCompetition(row)) {
    return "Midweek European fixture with enough pull to justify the trip.";
  }

  if (vibes.includes("easy")) {
    return "Lower-friction option from your current setup.";
  }

  if (vibes.includes("big")) {
    return "Leans toward atmosphere, weight and occasion.";
  }

  if (vibes.includes("nightlife") && isLateKickoff(row)) {
    return "Later kick-off pairs better with a nightlife-led trip.";
  }

  if (vibes.includes("culture")) {
    return "Better fit for a trip where the football culture matters.";
  }

  if (vibes.includes("warm")) {
    return "Better fit for a warmer, city-led football break.";
  }

  return "One of the stronger live options from your current setup.";
}

export function rankLabel(index: number) {
  if (index === 0) return "Top fit";
  if (index === 1) return "Strong pick";
  if (index === 2) return "Good route";
  return `#${index + 1}`;
}

export function trendingScore(row: FixtureListRow, baseScore: number) {
  let score = baseScore;

  const derby = derbyLabel(row);
  const leagueId = getLeagueId(row);

  if (derby) score += 90;

  if (leagueId === 2) score += 72;
  else if (leagueId === 3) score += 42;
  else if (leagueId === 848) score += 28;
  else if (leagueId != null && ELITE_LEAGUE_IDS.has(leagueId)) score += 30;
  else if (leagueId != null && STRONG_TRAVEL_LEAGUE_IDS.has(leagueId)) score += 16;

  if (isLateKickoff(row)) score += 16;
  if (isWeekendFixture(row)) score += 14;
  if (isMidweekFixture(row) && isEuropeanCompetition(row)) score += 18;

  if (getVenue(row)) score += 6;
  if (getCity(row)) score += 6;

  return score;
}

export function fixtureIsoDateOnly(row: FixtureListRow) {
  const raw = clean(row?.fixture?.date);
  return raw ? raw.slice(0, 10) : "";
}
