// src/data/cityGuides/index.ts
import cityGuides from "./cityGuides";
import type CityGuide from "./types";

/**
 * Normalise a city-ish string from APIs into a stable key.
 * - lowercases
 * - removes punctuation
 * - collapses whitespace
 * - strips common suffixes like ", UK"
 */
export function normalizeCityKey(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      // replace separators with spaces
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
      // collapse whitespace
      .replace(/\s+/g, " ")
      // remove common country fragments (kept conservative)
      .replace(/\b(uk|u k|united kingdom|england|scotland|wales|spain|italy|france|germany|netherlands)\b/g, "")
      .replace(/\s+/g, " ")
      .trim()
      // convert spaces to hyphenated id
      .replace(/\s+/g, "-")
  );
}

/**
 * Return a CityGuide by:
 * - direct key lookup (cityId)
 * - alias match (normalized)
 */
export function findCityGuideByCityName(cityName: string | undefined | null): CityGuide | null {
  if (!cityName) return null;

  const norm = normalizeCityKey(cityName);

  // 1) direct key match (cityId stored as key)
  const direct = (cityGuides as Record<string, CityGuide>)[norm];
  if (direct) return direct;

  // 2) scan aliases
  const all = Object.values(cityGuides as Record<string, CityGuide>);
  for (const g of all) {
    if (!g) continue;
    if (normalizeCityKey(g.cityId) === norm) return g;

    const aliases = Array.isArray(g.aliases) ? g.aliases : [];
    for (const a of aliases) {
      if (normalizeCityKey(a) === norm) return g;
    }

    // also check display name if present
    if ((g as any).name && normalizeCityKey((g as any).name) === norm) return g;
  }

  return null;
}

/**
 * TripAdvisor link: we do NOT scrape or hard-code “top 10” from TripAdvisor.
 * We generate a search URL that lands users on the right surface.
 */
export function getTripAdvisorThingsToDoUrl(cityName: string): string {
  const q = encodeURIComponent(`${cityName} things to do`);
  // Using TripAdvisor search endpoint (stable enough for link-out)
  return `https://www.tripadvisor.com/Search?q=${q}`;
}

/**
 * Convenience for Trip Build: return a ready-to-render “Top 10” bundle.
 * - Uses curated list if we have a guide
 * - Always provides TripAdvisor link-out
 */
export function getTopThingsToDoForTrip(cityName: string | undefined | null): {
  title: string;
  items: { title: string; description?: string }[];
  tripAdvisorUrl: string;
  hasGuide: boolean;
  quickTips: string[];
} {
  const safeCity = (cityName ?? "").trim() || "your destination";
  const guide = findCityGuideByCityName(cityName);
  const tripAdvisorUrl = getTripAdvisorThingsToDoUrl(safeCity);

  if (!guide) {
    return {
      title: `Top things to do in ${safeCity}`,
      items: [],
      tripAdvisorUrl,
      hasGuide: false,
      quickTips: [],
    };
  }

  const items = (guide.topThingsToDo ?? []).slice(0, 10).map((x) => ({
    title: x.title,
    description: x.description,
  }));

  return {
    title: `Top things to do in ${guide.name}`,
    items,
    tripAdvisorUrl,
    hasGuide: true,
    quickTips: Array.isArray(guide.quickTips) ? guide.quickTips : [],
  };
}
