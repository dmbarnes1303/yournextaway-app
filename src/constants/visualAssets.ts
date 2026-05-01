// src/constants/visualAssets.ts

export type VisualAsset = {
  backdrop: string;
};

const asset = (name: string) =>
  `https://your-cdn-or-github-path/assets/flags/${name}.png`;

/**
 * COMPETITION FIRST (priority)
 */
export const COMPETITION_VISUALS: Record<number, VisualAsset> = {
  // UEFA
  2: { backdrop: asset("champions-league") },
  3: { backdrop: asset("europa-league") },
  848: { backdrop: asset("conference-league") },
};

/**
 * COUNTRY FALLBACK
 */
export const COUNTRY_VISUALS: Record<string, VisualAsset> = {
  ENG: { backdrop: asset("england") },
  ES: { backdrop: asset("spain") },
  IT: { backdrop: asset("italy") },
  DE: { backdrop: asset("germany") },
  FR: { backdrop: asset("france") },
  NL: { backdrop: asset("netherlands") },
  PT: { backdrop: asset("portugal") },
  SCO: { backdrop: asset("scotland") },
  TR: { backdrop: asset("turkey") },
  BE: { backdrop: asset("belgium") },
  AT: { backdrop: asset("austria") },
  CH: { backdrop: asset("switzerland") },
  GR: { backdrop: asset("greece") },
  IE: { backdrop: asset("ireland") },
  DK: { backdrop: asset("denmark") },
  PL: { backdrop: asset("poland") },
  CZ: { backdrop: asset("czech") },
  HR: { backdrop: asset("croatia") },
  RS: { backdrop: asset("serbia") },
  HU: { backdrop: asset("hungary") },
  RO: { backdrop: asset("romania") },
  BG: { backdrop: asset("bulgaria") },
  SK: { backdrop: asset("slovakia") },
  SI: { backdrop: asset("slovenia") },
  CY: { backdrop: asset("cyprus") },
  BA: { backdrop: asset("bosnia") },
  SE: { backdrop: asset("sweden") },
  NO: { backdrop: asset("norway") },
  FI: { backdrop: asset("finland") },
  IS: { backdrop: asset("iceland") },
};

/**
 * SINGLE SOURCE OF TRUTH
 */
export function getFixtureBackdrop(params: {
  leagueId?: number | null;
  countryCode?: string | null;
}): string | null {
  const { leagueId, countryCode } = params;

  // 1. Competition override
  if (leagueId && COMPETITION_VISUALS[leagueId]) {
    return COMPETITION_VISUALS[leagueId].backdrop;
  }

  // 2. Country fallback
  if (countryCode && COUNTRY_VISUALS[countryCode]) {
    return COUNTRY_VISUALS[countryCode].backdrop;
  }

  return null;
}
