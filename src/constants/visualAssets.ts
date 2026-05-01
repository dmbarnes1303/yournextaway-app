// src/constants/visualAssets.ts

export type VisualAsset = {
  backdrop: string;
};

export type CountryVisual = {
  code: string;
  flagUrl: string;
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

const DOMESTIC_LEAGUE_COUNTRY_CODE: Record<number, string> = {
  39: "ENG",
  140: "ES",
  135: "IT",
  78: "DE",
  61: "FR",
  88: "NL",
  94: "PT",
  179: "SCO",
  203: "TR",
  144: "BE",
  218: "AT",
  207: "CH",
  197: "GR",
  357: "IE",
  119: "DK",
  106: "PL",
  345: "CZ",
  210: "HR",
  286: "RS",
  271: "HU",
  283: "RO",
  172: "BG",
  332: "SK",
  373: "SI",
  318: "CY",
  315: "BA",
  113: "SE",
  103: "NO",
  244: "FI",
  164: "IS",
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  england: "ENG",
  spain: "ES",
  italy: "IT",
  germany: "DE",
  france: "FR",
  netherlands: "NL",
  holland: "NL",
  portugal: "PT",
  scotland: "SCO",
  turkey: "TR",
  belgium: "BE",
  austria: "AT",
  switzerland: "CH",
  greece: "GR",
  ireland: "IE",
  "republic of ireland": "IE",
  denmark: "DK",
  poland: "PL",
  czech: "CZ",
  czechia: "CZ",
  "czech republic": "CZ",
  croatia: "HR",
  serbia: "RS",
  hungary: "HU",
  romania: "RO",
  bulgaria: "BG",
  slovakia: "SK",
  slovenia: "SI",
  cyprus: "CY",
  bosnia: "BA",
  "bosnia and herzegovina": "BA",
  sweden: "SE",
  norway: "NO",
  finland: "FI",
  iceland: "IS",
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normaliseName(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveCountryCode(params: {
  leagueId?: number | string | null;
  countryCode?: string | null;
  countryName?: string | null;
}): string | null {
  const rawCode = clean(params.countryCode).toUpperCase();

  if (rawCode && COUNTRY_VISUALS[rawCode]) return rawCode;

  const leagueId = Number(params.leagueId);

  if (Number.isFinite(leagueId) && DOMESTIC_LEAGUE_COUNTRY_CODE[leagueId]) {
    return DOMESTIC_LEAGUE_COUNTRY_CODE[leagueId];
  }

  const countryName = normaliseName(params.countryName);

  if (countryName && COUNTRY_NAME_TO_CODE[countryName]) {
    return COUNTRY_NAME_TO_CODE[countryName];
  }

  return null;
}

export function getFixtureBackdrop(params: {
  leagueId?: number | string | null;
  countryCode?: string | null;
  countryName?: string | null;
}): string | null {
  const leagueId = Number(params.leagueId);

  if (Number.isFinite(leagueId) && COMPETITION_VISUALS[leagueId]) {
    return COMPETITION_VISUALS[leagueId].backdrop;
  }

  const countryCode = resolveCountryCode(params);

  if (countryCode && COUNTRY_VISUALS[countryCode]) {
    return COUNTRY_VISUALS[countryCode].backdrop;
  }

  return null;
}

export function getCountryBackdrop(
  code?: string | null,
  countryName?: string | null
): string | null {
  const countryCode = resolveCountryCode({
    countryCode: code,
    countryName,
  });

  return countryCode ? COUNTRY_VISUALS[countryCode]?.backdrop ?? null : null;
}

export function getCountryVisual(country?: string | null): CountryVisual {
  const countryCode = resolveCountryCode({
    countryCode: country,
    countryName: country,
  });

  const safeCode = countryCode && COUNTRY_VISUALS[countryCode] ? countryCode : "ENG";
  const backdrop = COUNTRY_VISUALS[safeCode]?.backdrop ?? COUNTRY_VISUALS.ENG.backdrop;

  return {
    code: safeCode,
    flagUrl: backdrop,
    backdrop,
  };
}
