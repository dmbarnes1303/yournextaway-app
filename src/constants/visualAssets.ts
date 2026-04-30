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
  accentLeft: string;
  accentRight: string;
};

const FLAG_BASE = "https://flagcdn.com/w640";

export const COUNTRY_VISUALS: Record<string, CountryVisualAsset> = {
  england: {
    countryKey: "england",
    name: "England",
    flagUrl: `${FLAG_BASE}/gb-eng.png`,
    accentLeft: "#FFFFFF",
    accentRight: "#C8102E",
  },
  scotland: {
    countryKey: "scotland",
    name: "Scotland",
    flagUrl: `${FLAG_BASE}/gb-sct.png`,
    accentLeft: "#005EB8",
    accentRight: "#FFFFFF",
  },
  spain: {
    countryKey: "spain",
    name: "Spain",
    flagUrl: `${FLAG_BASE}/es.png`,
    accentLeft: "#AA151B",
    accentRight: "#F1BF00",
  },
  germany: {
    countryKey: "germany",
    name: "Germany",
    flagUrl: `${FLAG_BASE}/de.png`,
    accentLeft: "#DD0000",
    accentRight: "#FFCE00",
  },
  italy: {
    countryKey: "italy",
    name: "Italy",
    flagUrl: `${FLAG_BASE}/it.png`,
    accentLeft: "#009246",
    accentRight: "#CE2B37",
  },
  france: {
    countryKey: "france",
    name: "France",
    flagUrl: `${FLAG_BASE}/fr.png`,
    accentLeft: "#0055A4",
    accentRight: "#EF4135",
  },
  portugal: {
    countryKey: "portugal",
    name: "Portugal",
    flagUrl: `${FLAG_BASE}/pt.png`,
    accentLeft: "#006600",
    accentRight: "#FF0000",
  },
  netherlands: {
    countryKey: "netherlands",
    name: "Netherlands",
    flagUrl: `${FLAG_BASE}/nl.png`,
    accentLeft: "#AE1C28",
    accentRight: "#21468B",
  },
  belgium: {
    countryKey: "belgium",
    name: "Belgium",
    flagUrl: `${FLAG_BASE}/be.png`,
    accentLeft: "#FAE042",
    accentRight: "#ED2939",
  },
  turkey: {
    countryKey: "turkey",
    name: "Turkey",
    flagUrl: `${FLAG_BASE}/tr.png`,
    accentLeft: "#E30A17",
    accentRight: "#FFFFFF",
  },
  greece: {
    countryKey: "greece",
    name: "Greece",
    flagUrl: `${FLAG_BASE}/gr.png`,
    accentLeft: "#0D5EAF",
    accentRight: "#FFFFFF",
  },
  austria: {
    countryKey: "austria",
    name: "Austria",
    flagUrl: `${FLAG_BASE}/at.png`,
    accentLeft: "#ED2939",
    accentRight: "#FFFFFF",
  },
  switzerland: {
    countryKey: "switzerland",
    name: "Switzerland",
    flagUrl: `${FLAG_BASE}/ch.png`,
    accentLeft: "#D52B1E",
    accentRight: "#FFFFFF",
  },
  denmark: {
    countryKey: "denmark",
    name: "Denmark",
    flagUrl: `${FLAG_BASE}/dk.png`,
    accentLeft: "#C60C30",
    accentRight: "#FFFFFF",
  },
  czechia: {
    countryKey: "czechia",
    name: "Czechia",
    flagUrl: `${FLAG_BASE}/cz.png`,
    accentLeft: "#11457E",
    accentRight: "#D7141A",
  },
  poland: {
    countryKey: "poland",
    name: "Poland",
    flagUrl: `${FLAG_BASE}/pl.png`,
    accentLeft: "#FFFFFF",
    accentRight: "#DC143C",
  },
  croatia: {
    countryKey: "croatia",
    name: "Croatia",
    flagUrl: `${FLAG_BASE}/hr.png`,
    accentLeft: "#171796",
    accentRight: "#FF0000",
  },
  serbia: {
    countryKey: "serbia",
    name: "Serbia",
    flagUrl: `${FLAG_BASE}/rs.png`,
    accentLeft: "#0C4076",
    accentRight: "#C6363C",
  },
  slovakia: {
    countryKey: "slovakia",
    name: "Slovakia",
    flagUrl: `${FLAG_BASE}/sk.png`,
    accentLeft: "#0B4EA2",
    accentRight: "#EE1C25",
  },
  slovenia: {
    countryKey: "slovenia",
    name: "Slovenia",
    flagUrl: `${FLAG_BASE}/si.png`,
    accentLeft: "#005DA4",
    accentRight: "#ED1C24",
  },
  hungary: {
    countryKey: "hungary",
    name: "Hungary",
    flagUrl: `${FLAG_BASE}/hu.png`,
    accentLeft: "#477050",
    accentRight: "#CD2A3E",
  },
  sweden: {
    countryKey: "sweden",
    name: "Sweden",
    flagUrl: `${FLAG_BASE}/se.png`,
    accentLeft: "#006AA7",
    accentRight: "#FECC00",
  },
  norway: {
    countryKey: "norway",
    name: "Norway",
    flagUrl: `${FLAG_BASE}/no.png`,
    accentLeft: "#BA0C2F",
    accentRight: "#00205B",
  },
  finland: {
    countryKey: "finland",
    name: "Finland",
    flagUrl: `${FLAG_BASE}/fi.png`,
    accentLeft: "#FFFFFF",
    accentRight: "#002F6C",
  },
  ireland: {
    countryKey: "ireland",
    name: "Ireland",
    flagUrl: `${FLAG_BASE}/ie.png`,
    accentLeft: "#169B62",
    accentRight: "#FF883E",
  },
  bulgaria: {
    countryKey: "bulgaria",
    name: "Bulgaria",
    flagUrl: `${FLAG_BASE}/bg.png`,
    accentLeft: "#00966E",
    accentRight: "#D62612",
  },
  cyprus: {
    countryKey: "cyprus",
    name: "Cyprus",
    flagUrl: `${FLAG_BASE}/cy.png`,
    accentLeft: "#D57800",
    accentRight: "#FFFFFF",
  },
  "bosnia-and-herzegovina": {
    countryKey: "bosnia-and-herzegovina",
    name: "Bosnia and Herzegovina",
    flagUrl: `${FLAG_BASE}/ba.png`,
    accentLeft: "#002395",
    accentRight: "#FECB00",
  },
  iceland: {
    countryKey: "iceland",
    name: "Iceland",
    flagUrl: `${FLAG_BASE}/is.png`,
    accentLeft: "#02529C",
    accentRight: "#DC1E35",
  },
};

const COUNTRY_ALIASES: Record<string, string> = {
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
  greece: "greece",
  austria: "austria",
  switzerland: "switzerland",
  denmark: "denmark",
  "czech-republic": "czechia",
  czechia: "czechia",
  poland: "poland",
  croatia: "croatia",
  serbia: "serbia",
  slovakia: "slovakia",
  slovenia: "slovenia",
  hungary: "hungary",
  sweden: "sweden",
  norway: "norway",
  finland: "finland",
  ireland: "ireland",
  bulgaria: "bulgaria",
  cyprus: "cyprus",
  "bosnia-herzegovina": "bosnia-and-herzegovina",
  "bosnia-and-herzegovina": "bosnia-and-herzegovina",
  iceland: "iceland",
};

export function resolveCountryKey(input?: string | null): string {
  const key = normalize(input);
  if (!key) return "italy";
  return COUNTRY_ALIASES[key] ?? key;
}

export function getCountryVisual(input?: string | null): CountryVisualAsset {
  const key = resolveCountryKey(input);
  return COUNTRY_VISUALS[key] ?? COUNTRY_VISUALS.italy;
}

export function getCountryFlagUrl(input?: string | null): string {
  return getCountryVisual(input).flagUrl;
}

export default COUNTRY_VISUALS;
