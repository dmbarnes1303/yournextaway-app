// src/constants/visualAssets.ts

export type VisualAsset = {
  flagBackdrop: string;
  countryName: string;
  primaryColor: string;
  secondaryColor: string;
};

/**
 * TEMP SOURCE:
 * These are currently remote placeholder images.
 *
 * LOCKED NEXT STEP:
 * Replace every flagBackdrop below with our own generated wavy flag assets,
 * saved/uploaded into the app, then referenced here.
 */
const placeholder = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=90`;

export const COUNTRY_VISUALS: Record<string, VisualAsset> = {
  ENG: {
    countryName: "England",
    flagBackdrop: placeholder("photo-1521295121783-8a321d551ad2"),
    primaryColor: "#FFFFFF",
    secondaryColor: "#C8102E",
  },

  SCO: {
    countryName: "Scotland",
    flagBackdrop: placeholder("photo-1506377247377-2a5b3b417ebb"),
    primaryColor: "#005EB8",
    secondaryColor: "#FFFFFF",
  },

  ES: {
    countryName: "Spain",
    flagBackdrop: placeholder("photo-1505739771261-7f6a5d6f8c0f"),
    primaryColor: "#AA151B",
    secondaryColor: "#F1BF00",
  },

  IT: {
    countryName: "Italy",
    flagBackdrop: placeholder("photo-1523906630133-f6934a1ab2b9"),
    primaryColor: "#009246",
    secondaryColor: "#CE2B37",
  },

  DE: {
    countryName: "Germany",
    flagBackdrop: placeholder("photo-1467269204594-9661b134dd2b"),
    primaryColor: "#DD0000",
    secondaryColor: "#FFCE00",
  },

  FR: {
    countryName: "France",
    flagBackdrop: placeholder("photo-1502602898657-3e91760cbb34"),
    primaryColor: "#0055A4",
    secondaryColor: "#EF4135",
  },

  NL: {
    countryName: "Netherlands",
    flagBackdrop: placeholder("photo-1505761671935-60b3a7427bad"),
    primaryColor: "#AE1C28",
    secondaryColor: "#21468B",
  },

  PT: {
    countryName: "Portugal",
    flagBackdrop: placeholder("photo-1513735492246-483525079686"),
    primaryColor: "#006600",
    secondaryColor: "#FF0000",
  },

  TR: {
    countryName: "Turkey",
    flagBackdrop: placeholder("photo-1527838832700-5059252407fa"),
    primaryColor: "#E30A17",
    secondaryColor: "#FFFFFF",
  },

  BE: {
    countryName: "Belgium",
    flagBackdrop: placeholder("photo-1491557345352-5929e343eb89"),
    primaryColor: "#FAE042",
    secondaryColor: "#ED2939",
  },

  AT: {
    countryName: "Austria",
    flagBackdrop: placeholder("photo-1516550893885-985c258ba1d7"),
    primaryColor: "#ED2939",
    secondaryColor: "#FFFFFF",
  },

  CH: {
    countryName: "Switzerland",
    flagBackdrop: placeholder("photo-1527668752968-14dc70a27c95"),
    primaryColor: "#D52B1E",
    secondaryColor: "#FFFFFF",
  },

  GR: {
    countryName: "Greece",
    flagBackdrop: placeholder("photo-1507525428034-b723cf961d3e"),
    primaryColor: "#0D5EAF",
    secondaryColor: "#FFFFFF",
  },

  DK: {
    countryName: "Denmark",
    flagBackdrop: placeholder("photo-1513622470522-26c3c8a854bc"),
    primaryColor: "#C60C30",
    secondaryColor: "#FFFFFF",
  },

  CZ: {
    countryName: "Czech Republic",
    flagBackdrop: placeholder("photo-1541849546-216549ae216d"),
    primaryColor: "#11457E",
    secondaryColor: "#D7141A",
  },

  PL: {
    countryName: "Poland",
    flagBackdrop: placeholder("photo-1519197924294-4ba991a11128"),
    primaryColor: "#FFFFFF",
    secondaryColor: "#DC143C",
  },

  HR: {
    countryName: "Croatia",
    flagBackdrop: placeholder("photo-1555990538-c48dbe0e2c5a"),
    primaryColor: "#171796",
    secondaryColor: "#FF0000",
  },

  RS: {
    countryName: "Serbia",
    flagBackdrop: placeholder("photo-1545044846-351ba102b6d5"),
    primaryColor: "#0C4076",
    secondaryColor: "#C6363C",
  },

  HU: {
    countryName: "Hungary",
    flagBackdrop: placeholder("photo-1563720223185-11003d516935"),
    primaryColor: "#477050",
    secondaryColor: "#CD2A3E",
  },

  RO: {
    countryName: "Romania",
    flagBackdrop: placeholder("photo-1500530855697-b586d89ba3ee"),
    primaryColor: "#002B7F",
    secondaryColor: "#FCD116",
  },

  SK: {
    countryName: "Slovakia",
    flagBackdrop: placeholder("photo-1541849546-216549ae216d"),
    primaryColor: "#0B4EA2",
    secondaryColor: "#EE1C25",
  },

  SI: {
    countryName: "Slovenia",
    flagBackdrop: placeholder("photo-1500530855697-b586d89ba3ee"),
    primaryColor: "#005DA4",
    secondaryColor: "#ED1C24",
  },

  BG: {
    countryName: "Bulgaria",
    flagBackdrop: placeholder("photo-1571867424486-1c8e7b7c3a6d"),
    primaryColor: "#00966E",
    secondaryColor: "#D62612",
  },

  CY: {
    countryName: "Cyprus",
    flagBackdrop: placeholder("photo-1507525428034-b723cf961d3e"),
    primaryColor: "#D57800",
    secondaryColor: "#FFFFFF",
  },

  BA: {
    countryName: "Bosnia and Herzegovina",
    flagBackdrop: placeholder("photo-1545044846-351ba102b6d5"),
    primaryColor: "#002395",
    secondaryColor: "#FECB00",
  },

  IE: {
    countryName: "Ireland",
    flagBackdrop: placeholder("photo-1506377247377-2a5b3b417ebb"),
    primaryColor: "#169B62",
    secondaryColor: "#FF883E",
  },

  SE: {
    countryName: "Sweden",
    flagBackdrop: placeholder("photo-1500530855697-b586d89ba3ee"),
    primaryColor: "#006AA7",
    secondaryColor: "#FECC00",
  },

  NO: {
    countryName: "Norway",
    flagBackdrop: placeholder("photo-1506377247377-2a5b3b417ebb"),
    primaryColor: "#BA0C2F",
    secondaryColor: "#00205B",
  },

  FI: {
    countryName: "Finland",
    flagBackdrop: placeholder("photo-1500530855697-b586d89ba3ee"),
    primaryColor: "#FFFFFF",
    secondaryColor: "#002F6C",
  },

  IS: {
    countryName: "Iceland",
    flagBackdrop: placeholder("photo-1506377247377-2a5b3b417ebb"),
    primaryColor: "#02529C",
    secondaryColor: "#DC1E35",
  },

  EU: {
    countryName: "Europe",
    flagBackdrop: placeholder("photo-1521295121783-8a321d551ad2"),
    primaryColor: "#003399",
    secondaryColor: "#FFCC00",
  },
};

export function normaliseCountryCode(code?: string | null): string {
  return String(code ?? "").trim().toUpperCase();
}

export function getCountryVisual(code?: string | null): VisualAsset | null {
  const key = normaliseCountryCode(code);
  if (!key) return null;
  return COUNTRY_VISUALS[key] ?? null;
}

export function getCountryBackdrop(code?: string | null): string | null {
  return getCountryVisual(code)?.flagBackdrop ?? null;
}

export function getCountryAccentColors(code?: string | null): {
  primaryColor: string;
  secondaryColor: string;
} | null {
  const visual = getCountryVisual(code);
  if (!visual) return null;

  return {
    primaryColor: visual.primaryColor,
    secondaryColor: visual.secondaryColor,
  };
}
