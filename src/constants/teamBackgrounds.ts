// src/constants/teamBackgrounds.ts
import type { ImageSourcePropType } from "react-native";

/**
 * Team hero backgrounds (remote).
 *
 * Design goals:
 * - No crashes if a team is missing.
 * - V1-safe: works even when team metadata is incomplete.
 * - Uses remote images (no local assets) via Unsplash Source.
 *
 * Notes:
 * - You can gradually “pin” specific teams to specific hero images later
 *   by adding them to TEAM_HERO_OVERRIDES.
 * - Fallback uses a stadium/city/name query.
 */

type TeamHeroInput = {
  teamKey?: string | null;
  teamName?: string | null;
  stadium?: string | null;
  city?: string | null;
  country?: string | null;
};

/**
 * If you want specific hand-picked images per team, add overrides here.
 * Keys MUST be normalized (kebab-case).
 */
const TEAM_HERO_OVERRIDES: Record<string, string> = {
  // Examples (leave empty or add later):
  // "arsenal": "https://images.unsplash.com/photo-XXXXXXXXXXXX?auto=format&fit=crop&w=1600&q=80",
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeKey(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function joinQuery(parts: Array<string | null | undefined>): string {
  const out = parts
    .map((p) => (isNonEmptyString(p) ? p.trim() : ""))
    .filter(Boolean);

  // Keep query short but meaningful
  return out.slice(0, 3).join(" ");
}

/**
 * Uses Unsplash Source endpoint for a relevant, high-quality remote image.
 * This returns a valid remote image URL without you having to curate IDs now.
 */
function makeUnsplashSource(query: string): string {
  const q = encodeURIComponent(query || "football stadium");
  // 1600x2400 gives a nice tall hero crop for mobile.
  return `https://source.unsplash.com/1600x2400/?${q}`;
}

export function getTeamHeroBackground(input: TeamHeroInput): ImageSourcePropType {
  const key = normalizeKey(input.teamKey);

  const overrideUrl = key ? TEAM_HERO_OVERRIDES[key] : null;
  if (isNonEmptyString(overrideUrl)) {
    return { uri: overrideUrl };
  }

  // Build a best-effort query from available metadata.
  const query = joinQuery([
    input.stadium ?? null,
    input.teamName ?? null,
    input.city ?? null,
    input.country ?? null,
  ]);

  return { uri: makeUnsplashSource(query) };
}

export default getTeamHeroBackground;
