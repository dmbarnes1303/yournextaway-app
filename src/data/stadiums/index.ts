// src/data/stadiums/index.ts
import type { StadiumRecord } from "./types";

function normalizeTeamKey(name?: string) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export const STADIUMS: StadiumRecord[] = [
  {
    clubName: "Arsenal",
    teamKeys: ["arsenal"],
    stadiumName: "Emirates Stadium",
    city: "London",
    address: "Hornsey Rd, London N7 7AJ",
    capacity: 60704,
    transit: [
      { label: "Arsenal (Piccadilly line)", minutes: 8, note: "closest for most approaches" },
      { label: "Finsbury Park (Victoria/Piccadilly + National Rail)", minutes: 18, note: "good for fast onward travel" },
      { label: "Highbury & Islington (Victoria/Overground)", minutes: 20 },
    ],
    stayAreas: [
      { area: "Kings Cross", why: "major rail hub, easy Tube links" },
      { area: "Angel", why: "good food/drink, quick to stadium area" },
      { area: "Finsbury Park", why: "closer + great for getting in/out" },
    ],
    tips: [
      "Arrive early if you want less queueing at security and concessions.",
      "Plan your exit route (different stations can be faster depending on your onward travel).",
    ],
    officialInfoUrl: "https://www.arsenal.com/emirates-stadium",
  },
  {
    clubName: "Chelsea",
    teamKeys: ["chelsea"],
    stadiumName: "Stamford Bridge",
    city: "London",
    address: "Fulham Rd., London SW6 1HS",
    capacity: 40343,
    transit: [
      { label: "Fulham Broadway (District line)", minutes: 10, note: "most common" },
      { label: "West Brompton (Overground/District)", minutes: 15 },
    ],
    stayAreas: [
      { area: "South Kensington", why: "central, easy District line access" },
      { area: "Earl's Court", why: "convenient for Tube + hotels" },
      { area: "Hammersmith", why: "good transport + value hotels" },
    ],
    tips: ["Fulham Broadway gets crowded—consider West Brompton for a calmer exit."],
    officialInfoUrl: "https://www.chelseafc.com/en/stamford-bridge",
  },
  {
    clubName: "Tottenham Hotspur",
    teamKeys: ["tottenham hotspur", "tottenham", "spurs"],
    stadiumName: "Tottenham Hotspur Stadium",
    city: "London",
    address: "782 High Rd, London N17 0BX",
    capacity: 62850,
    transit: [
      { label: "White Hart Lane (Overground)", minutes: 10, note: "very popular for matchdays" },
      { label: "Northumberland Park (National Rail)", minutes: 15, note: "often good for dispersal" },
      { label: "Tottenham Hale (Victoria line + Rail)", minutes: 30, note: "useful for quick central access" },
    ],
    stayAreas: [
      { area: "Kings Cross", why: "fast to Tottenham via Victoria line connections" },
      { area: "Liverpool Street", why: "easy Overground options + central" },
      { area: "Stratford", why: "transport hub + hotel choice" },
    ],
    tips: ["Expect crowd control on exit—build buffer time if you’ve got a tight train."],
    officialInfoUrl: "https://www.tottenhamhotspur.com/the-stadium/",
  },
  {
    clubName: "Everton",
    teamKeys: ["everton"],
    stadiumName: "Everton Stadium",
    city: "Liverpool",
    capacity: 52888,
    tips: [
      "Build buffer time for transport in/out on matchday.",
      "Pick your stay based on your arrival station/airport for a smoother weekend.",
    ],
  },
];

export function getStadiumByHomeTeam(homeTeamName?: string) {
  const key = normalizeTeamKey(homeTeamName);
  if (!key) return null;

  // exact match on teamKeys first
  for (const s of STADIUMS) {
    if (s.teamKeys.some((k) => normalizeTeamKey(k) === key)) return s;
  }

  // fuzzy contain match second (handles small API variations)
  for (const s of STADIUMS) {
    if (s.teamKeys.some((k) => key.includes(normalizeTeamKey(k)) || normalizeTeamKey(k).includes(key))) return s;
  }

  return null;
}
