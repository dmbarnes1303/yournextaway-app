// src/data/teamGuides/teamGuides.ts
import type { TeamGuide } from "./types";

/**
 * Registry keyed by normalized teamKey:
 *   "arsenal", "real-madrid", "bayern-munich", etc.
 *
 * V1 NOTE:
 * - Keep the registry valid even if empty.
 * - Add guides gradually without changing the export shape.
 */
export const teamGuides: Record<string, TeamGuide> = {};

export default teamGuides;
