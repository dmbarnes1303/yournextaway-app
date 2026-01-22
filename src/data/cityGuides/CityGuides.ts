// src/data/cityGuides/cityGuides.ts
import type CityGuide from "./types";

/**
 * Registry keyed by normalized cityId:
 *   "madrid", "barcelona", "london", "manchester", etc.
 */
export const cityGuides: Record<string, CityGuide> = {};

/**
 * Default export used by index helpers.
 */
export default cityGuides;
