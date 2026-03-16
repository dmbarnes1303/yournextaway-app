// src/features/discover/discoverPresentation.ts

import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import type { FixtureListRow } from "@/src/services/apiFootball";
import type { DiscoverCategory } from "./discoverCategories";
import type { DiscoverTripLength, DiscoverVibe } from "./discoverEngine";

const EUROPEAN_COMPETITION_IDS = new Set([2, 3, 848]);

const KNOWN_DERBY_LABELS: Record<string, string> = {
  "ajax|feyenoord": "De Klassieker",
  "arsenal|tottenham": "North London Derby",
  "atletico-madrid|real-madrid": "Madrid Derby",
  "celtic|rangers": "Old Firm",
  "fenerbahce|galatasaray": "Intercontinental Derby",
  "inter|milan": "Derby della Madonnina",
  "lazio|roma": "Rome Derby",
  "manchester-city|manchester-united": "Manchester Derby",
  "marseille|paris-saint-germain": "Le Classique",
  "olympiacos|panathinaikos": "Derby of the Eternal Enemies",
  "real-betis|sevilla": "Seville Derby",
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function toSlug(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
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
  const city = getCity(row);
  const venue = getVenue(row);
  const tail = [venue, city].filter(Boolean).join(" • ");
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
  const a = toSlug(homeName(row));
  const b = toSlug(awayName(row));
  if (!a || !b) return "";
  return [a, b].sort().join("|");
}

export function trendingLabelForFixture(row: FixtureListRow) {
  const pair = getFixturePairKey(row);
  const city = getCity(row);

  if (KNOWN_DERBY_LABELS[pair]) return KNOWN_DERBY_LABELS[pair];
  if (isEuropeanCompetition(row)) return "European night";
  if (city) return `${city} football trip`;
  return "Trending football trip";
}

export function whyThisFits(
  row: FixtureListRow,
  category: DiscoverCategory,
  vibes: DiscoverVibe[],
  tripLength: DiscoverTripLength
) {
  if (category === "easyTickets") return "Cleaner route for a simpler football trip.";
  if (category === "bigMatches") return "Stronger occasion feel with more travel pull.";
  if (category === "derbies") return "History, hostility and genuine rivalry tension.";
  if (category === "atmospheres") return "Higher-upside crowd energy and matchday force.";
  if (category === "valueTrips") return "Better experience-per-pound potential.";
  if (category === "europeanNights") {
    return isEuropeanCompetition(row)
      ? "Continental occasion with stronger night-game pull."
      : "Still strong enough to survive a Europe-first ranking.";
  }
  if (category === "multiMatchTrips") {
    return "Good anchor fixture for stacking a bigger football trip.";
  }
  if (category === "weekendTrips") {
    return isWeekendFixture(row)
      ? "Weekend-timed fixture that fits a cleaner football break."
      : "Still workable for a weekend if paired correctly.";
  }
  if (category === "nightMatches") {
    return isLateKickoff(row)
      ? "Later kick-off gives it better lights-on energy."
      : "Good fit for an occasion-led evening trip.";
  }
  if (category === "matchdayCulture") {
    return "Better city + football balance beyond the 90 minutes.";
  }
  if (category === "iconicCities") {
    return "The city itself adds real pull beyond the fixture.";
  }
  if (category === "legendaryStadiums") {
    return "Ground and club pull are doing the heavy lifting.";
  }
  if (tripLength === "2" || tripLength === "3") {
    return "Strong shape for a football city break.";
  }
  if (isMidweekFixture(row)) {
    return "Midweek-worthy fixture with enough travel pull.";
  }
  if (vibes.includes("easy")) {
    return "Lower-friction option from your current setup.";
  }
  if (vibes.includes("big")) {
    return "Leans more toward atmosphere, weight and occasion.";
  }
  return "One of the stronger live options from your current setup.";
}

export function rankLabel(index: number) {
  if (index === 0) return "Top fit";
  if (index === 1) return "Strong";
  if (index === 2) return "Hot";
  return `#${index + 1}`;
}

export function trendingScore(row: FixtureListRow, baseScore: number) {
  let score = baseScore;

  const pair = getFixturePairKey(row);
  if (KNOWN_DERBY_LABELS[pair]) score += 80;
  if (isEuropeanCompetition(row)) score += 48;
  if (isLateKickoff(row)) score += 14;
  if (isMidweekFixture(row)) score += 10;

  const leagueId = getLeagueId(row);
  if (leagueId === 39) score += 14;
  if (leagueId === 140) score += 14;
  if (leagueId === 135) score += 14;
  if (leagueId === 78) score += 14;
  if (leagueId === 61) score += 10;

  return score;
}

export function fixtureIsoDateOnly(row: FixtureListRow) {
  const raw = clean(row?.fixture?.date);
  return raw ? raw.slice(0, 10) : "";
}
