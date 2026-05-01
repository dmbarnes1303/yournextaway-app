// src/constants/visualAssets.ts

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalize(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type CountryVisualAsset = {
  countryKey: string;
  name: string;
  flagUrl: string;
  backdropUrl: string;
  accentLeft: string;
  accentRight: string;
};

export type LeagueVisualAsset = {
  leagueId: number;
  leagueKey: string;
  name: string;
  countryKey: string;
  backdropUrl: string;
  fallbackFlagUrl: string;
  accentLeft: string;
  accentRight: string;
};

const FLAG_BASE = "https://flagcdn.com/w640";

/**
 * Temporary remote placeholders.
 * Replace these URLs with your saved/uploaded cinematic generated images later.
 */
export const LOCAL_BACKDROP_PLACEHOLDER = {
  england: "",
  scotland: "",
  spain: "",
  germany: "",
  italy: "",
  france: "",
  portugal: "",
  netherlands: "",
  belgium: "",
  turkey: "",
  generic: "",
};

export const COUNTRY_VISUALS: Record<string, CountryVisualAsset> = {
  england: {
    countryKey: "england",
    name: "England",
    flagUrl: `${FLAG_BASE}/gb-eng.png`,
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.england,
    accentLeft: "#FFFFFF",
    accentRight: "#C8102E",
  },
  scotland: {
    countryKey: "scotland",
    name: "Scotland",
    flagUrl: `${FLAG_BASE}/gb-sct.png`,
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.scotland,
    accentLeft: "#005EB8",
    accentRight: "#FFFFFF",
  },
  spain: {
    countryKey: "spain",
    name: "Spain",
    flagUrl: `${FLAG_BASE}/es.png`,
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.spain,
    accentLeft: "#AA151B",
    accentRight: "#F1BF00",
  },
  germany: {
    countryKey: "germany",
    name: "Germany",
    flagUrl: `${FLAG_BASE}/de.png`,
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.germany,
    accentLeft: "#DD0000",
    accentRight: "#FFCE00",
  },
  italy: {
    countryKey: "italy",
    name: "Italy",
    flagUrl: `${FLAG_BASE}/it.png`,
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.italy,
    accentLeft: "#009246",
    accentRight: "#CE2B37",
  },
  france: {
    countryKey: "france",
    name: "France",
    flagUrl: `${FLAG_BASE}/fr.png`,
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.france,
    accentLeft: "#0055A4",
    accentRight: "#EF4135",
  },
  portugal: {
    countryKey: "portugal",
    name: "Portugal",
    flagUrl: `${FLAG_BASE}/pt.png`,
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.portugal,
    accentLeft: "#006600",
    accentRight: "#FF0000",
  },
  netherlands: {
    countryKey: "netherlands",
    name: "Netherlands",
    flagUrl: `${FLAG_BASE}/nl.png`,
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.netherlands,
    accentLeft: "#AE1C28",
    accentRight: "#21468B",
  },
  belgium: {
    countryKey: "belgium",
    name: "Belgium",
    flagUrl: `${FLAG_BASE}/be.png`,
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.belgium,
    accentLeft: "#FAE042",
    accentRight: "#ED2939",
  },
  turkey: {
    countryKey: "turkey",
    name: "Turkey",
    flagUrl: `${FLAG_BASE}/tr.png`,
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.turkey,
    accentLeft: "#E30A17",
    accentRight: "#FFFFFF",
  },
};

export const COUNTRY_ALIASES: Record<string, string> = {
  uk: "england",
  gb: "england",
  "united-kingdom": "england",
  "great-britain": "england",
  england: "england",
  scotland: "scotland",
  spain: "spain",
  germany: "germany",
  italy: "italy",
  france: "france",
  portugal: "portugal",
  holland: "netherlands",
  netherlands: "netherlands",
  belgium: "belgium",
  turkey: "turkey",
  turkiye: "turkey",
};

export const LEAGUE_VISUALS: Record<number, LeagueVisualAsset> = {
  39: {
    leagueId: 39,
    leagueKey: "premier-league",
    name: "Premier League",
    countryKey: "england",
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.england,
    fallbackFlagUrl: COUNTRY_VISUALS.england.flagUrl,
    accentLeft: "#FFFFFF",
    accentRight: "#C8102E",
  },
  140: {
    leagueId: 140,
    leagueKey: "laliga",
    name: "LaLiga",
    countryKey: "spain",
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.spain,
    fallbackFlagUrl: COUNTRY_VISUALS.spain.flagUrl,
    accentLeft: "#AA151B",
    accentRight: "#F1BF00",
  },
  135: {
    leagueId: 135,
    leagueKey: "serie-a",
    name: "Serie A",
    countryKey: "italy",
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.italy,
    fallbackFlagUrl: COUNTRY_VISUALS.italy.flagUrl,
    accentLeft: "#009246",
    accentRight: "#CE2B37",
  },
  78: {
    leagueId: 78,
    leagueKey: "bundesliga",
    name: "Bundesliga",
    countryKey: "germany",
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.germany,
    fallbackFlagUrl: COUNTRY_VISUALS.germany.flagUrl,
    accentLeft: "#DD0000",
    accentRight: "#FFCE00",
  },
  61: {
    leagueId: 61,
    leagueKey: "ligue-1",
    name: "Ligue 1",
    countryKey: "france",
    backdropUrl: LOCAL_BACKDROP_PLACEHOLDER.france,
    fallbackFlagUrl: COUNTRY_VISUALS.france.flagUrl,
    accentLeft: "#0055A4",
    accentRight: "#EF4135",
  },
};

export function resolveCountryKey(input?: string | null): string {
  const key = normalize(input);
  if (!key) return "england";
  return COUNTRY_ALIASES[key] ?? key;
}

export function getCountryVisual(input?: string | null): CountryVisualAsset {
  const key = resolveCountryKey(input);
  return COUNTRY_VISUALS[key] ?? COUNTRY_VISUALS.england;
}

export function getCountryFlagUrl(input?: string | null): string {
  return getCountryVisual(input).flagUrl;
}

export function getCountryBackdropUrl(input?: string | null): string {
  const visual = getCountryVisual(input);
  return visual.backdropUrl || visual.flagUrl;
}

export function getLeagueVisual(input?: number | string | null): LeagueVisualAsset | null {
  const raw = clean(input);
  const id = Number(raw);
  if (!Number.isFinite(id)) return null;
  return LEAGUE_VISUALS[id] ?? null;
}

export function getLeagueBackdropUrl(input?: number | string | null): string {
  const visual = getLeagueVisual(input);
  if (!visual) return COUNTRY_VISUALS.england.flagUrl;
  return visual.backdropUrl || visual.fallbackFlagUrl;
}

export function getVisualKey(input?: string | number | null): string {
  return normalize(input);
}

export default COUNTRY_VISUALS;
