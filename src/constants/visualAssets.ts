// src/constants/visualAssets.ts

export type VisualAsset = {
  backdrop: string;
};

const FLAG_BASE =
  "https://raw.githubusercontent.com/dmbarnes1303/yournextaway-app/main/assets/flags";

const flag = (fileName: string) => `${FLAG_BASE}/${fileName}.png`;

export const COMPETITION_VISUALS: Record<number, VisualAsset> = {
  2: { backdrop: flag("ucl") },
  3: { backdrop: flag("uel") },
  848: { backdrop: flag("uecl") },
};

export const COUNTRY_VISUALS: Record<string, VisualAsset> = {
  ENG: { backdrop: flag("england") },
  ES: { backdrop: flag("spain") },
  IT: { backdrop: flag("italy") },
  DE: { backdrop: flag("germany") },
  FR: { backdrop: flag("france") },
  NL: { backdrop: flag("netherlands") },
  PT: { backdrop: flag("portugal") },
  SCO: { backdrop: flag("scotland") },
  TR: { backdrop: flag("turkey") },
  BE: { backdrop: flag("belgium") },
  AT: { backdrop: flag("austria") },
  CH: { backdrop: flag("switzerland") },
  GR: { backdrop: flag("greece") },
  IE: { backdrop: flag("ireland") },
  DK: { backdrop: flag("denmark") },
  PL: { backdrop: flag("poland") },
  CZ: { backdrop: flag("czech") },
  HR: { backdrop: flag("croatia") },
  RS: { backdrop: flag("serbia") },
  HU: { backdrop: flag("hungary") },
  RO: { backdrop: flag("romania") },
  BG: { backdrop: flag("bulgaria") },
  SK: { backdrop: flag("slovakia") },
  SI: { backdrop: flag("slovenia") },
  CY: { backdrop: flag("cyprus") },
  BA: { backdrop: flag("bosnia") },
  SE: { backdrop: flag("sweden") },
  NO: { backdrop: flag("norway") },
  FI: { backdrop: flag("finland") },
  IS: { backdrop: flag("iceland") },
};

export function getFixtureBackdrop(params: {
  leagueId?: number | null;
  countryCode?: string | null;
}): string | null {
  const leagueId =
    typeof params.leagueId === "number" ? params.leagueId : Number(params.leagueId);

  if (Number.isFinite(leagueId) && COMPETITION_VISUALS[leagueId]) {
    return COMPETITION_VISUALS[leagueId].backdrop;
  }

  const countryCode = String(params.countryCode ?? "").trim().toUpperCase();

  if (countryCode && COUNTRY_VISUALS[countryCode]) {
    return COUNTRY_VISUALS[countryCode].backdrop;
  }

  return null;
}

export function getCountryBackdrop(code?: string | null): string | null {
  const countryCode = String(code ?? "").trim().toUpperCase();
  return COUNTRY_VISUALS[countryCode]?.backdrop ?? null;
}
