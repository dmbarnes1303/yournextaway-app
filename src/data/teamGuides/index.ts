// src/data/teamGuides/index.ts
import type { TeamGuide } from "./types";
import teamGuides from "./teamGuides";

/**
 * Team Guide registry + helpers.
 *
 * V1 note:
 * - The registry can stay empty and the app still functions (we link out).
 * - As you add guides, keep the registry keys as stable “team keys” (slugs).
 *
 * Examples:
 * - "arsenal"
 * - "real-madrid"
 * - "paris-saint-germain"
 */

export { teamGuides };

export function normalizeTeamKey(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function getTeamGuide(teamInput: string): TeamGuide | null {
  const key = normalizeTeamKey(teamInput);
  return (teamGuides as Record<string, TeamGuide>)[key] ?? null;
}

/**
 * Convenience helper for UI: whether a guide exists.
 */
export function hasTeamGuide(teamInput: string): boolean {
  return !!getTeamGuide(teamInput);
}

export default teamGuides;
