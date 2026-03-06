// src/data/stadiums/index.ts

export type StadiumRecord = {
  /** Stable key used across routes / lookups */
  stadiumKey: string;

  /** Stadium display name */
  name: string;

  /** City the stadium is in */
  city: string;

  /** Country the stadium is in */
  country: string;

  /** Optional stadium capacity */
  capacity?: number;

  /** Optional opening year */
  opened?: number;

  /** Team keys that use this stadium */
  teamKeys: string[];
};

export const stadiums: Record<string, StadiumRecord> = {
  // -------------------------
  // Premier League
  // -------------------------
  "anfield": {
    stadiumKey: "anfield",
    name: "Anfield",
    city: "Liverpool",
    country: "England",
    capacity: 61276,
    opened: 1884,
    teamKeys: ["liverpool"],
  },

  "city-ground": {
    stadiumKey: "city-ground",
    name: "City Ground",
    city: "Nottingham",
    country: "England",
    capacity: 30445,
    opened: 1898,
    teamKeys: ["nottingham-forest"],
  },

  "craven-cottage": {
    stadiumKey: "craven-cottage",
    name: "Craven Cottage",
    city: "London",
    country: "England",
    capacity: 29589,
    opened: 1896,
    teamKeys: ["fulham"],
  },

  "emirates-stadium": {
    stadiumKey: "emirates-stadium",
    name: "Emirates Stadium",
    city: "London",
    country: "England",
    capacity: 60704,
    opened: 2006,
    teamKeys: ["arsenal"],
  },

  "etihad-stadium": {
    stadiumKey: "etihad-stadium",
    name: "Etihad Stadium",
    city: "Manchester",
    country: "England",
    capacity: 53400,
    opened: 2003,
    teamKeys: ["manchester-city"],
  },

"hill-dickinson-stadium": {
  stadiumKey: "hill-dickinson-stadium",
  name: "Hill Dickinson Stadium",
  city: "Liverpool",
  country: "England",
  capacity: 52769,
  opened: 2025,
  teamKeys: ["everton"],
},

  "gtech-community-stadium": {
    stadiumKey: "gtech-community-stadium",
    name: "Gtech Community Stadium",
    city: "London",
    country: "England",
    capacity: 17250,
    opened: 2020,
    teamKeys: ["brentford"],
  },

  "old-trafford": {
    stadiumKey: "old-trafford",
    name: "Old Trafford",
    city: "Manchester",
    country: "England",
    capacity: 74310,
    opened: 1910,
    teamKeys: ["manchester-united"],
  },

  "selhurst-park": {
    stadiumKey: "selhurst-park",
    name: "Selhurst Park",
    city: "London",
    country: "England",
    capacity: 25486,
    opened: 1924,
    teamKeys: ["crystal-palace"],
  },

  "st-james-park": {
    stadiumKey: "st-james-park",
    name: "St James' Park",
    city: "Newcastle upon Tyne",
    country: "England",
    capacity: 52305,
    opened: 1892,
    teamKeys: ["newcastle-united"],
  },

  "stamford-bridge": {
    stadiumKey: "stamford-bridge",
    name: "Stamford Bridge",
    city: "London",
    country: "England",
    capacity: 40341,
    opened: 1877,
    teamKeys: ["chelsea"],
  },

  "tottenham-hotspur-stadium": {
    stadiumKey: "tottenham-hotspur-stadium",
    name: "Tottenham Hotspur Stadium",
    city: "London",
    country: "England",
    capacity: 62850,
    opened: 2019,
    teamKeys: ["tottenham-hotspur"],
  },

  "turf-moor": {
    stadiumKey: "turf-moor",
    name: "Turf Moor",
    city: "Burnley",
    country: "England",
    capacity: 21944,
    opened: 1883,
    teamKeys: ["burnley"],
  },

  "vitality-stadium": {
    stadiumKey: "vitality-stadium",
    name: "Vitality Stadium",
    city: "Bournemouth",
    country: "England",
    capacity: 11307,
    opened: 1910,
    teamKeys: ["afc-bournemouth"],
  },

  "villa-park": {
    stadiumKey: "villa-park",
    name: "Villa Park",
    city: "Birmingham",
    country: "England",
    capacity: 42785,
    opened: 1897,
    teamKeys: ["aston-villa"],
  },

  "amex-stadium": {
    stadiumKey: "amex-stadium",
    name: "Amex Stadium",
    city: "Brighton",
    country: "England",
    capacity: 31876,
    opened: 2011,
    teamKeys: ["brighton-hove-albion"],
  },

  "elland-road": {
    stadiumKey: "elland-road",
    name: "Elland Road",
    city: "Leeds",
    country: "England",
    capacity: 37645,
    opened: 1897,
    teamKeys: ["leeds-united"],
  },

  "stadium-of-light": {
    stadiumKey: "stadium-of-light",
    name: "Stadium of Light",
    city: "Sunderland",
    country: "England",
    capacity: 49000,
    opened: 1997,
    teamKeys: ["sunderland"],
  },

  "london-stadium": {
    stadiumKey: "london-stadium",
    name: "London Stadium",
    city: "London",
    country: "England",
    capacity: 62500,
    opened: 2012,
    teamKeys: ["west-ham-united"],
  },

  "molineux": {
    stadiumKey: "molineux",
    name: "Molineux",
    city: "Wolverhampton",
    country: "England",
    capacity: 31750,
    opened: 1889,
    teamKeys: ["wolves"],
  },
};

export function getStadium(stadiumKey: string): StadiumRecord | null {
  const key = String(stadiumKey ?? "").trim().toLowerCase();
  return stadiums[key] ?? null;
}

export function getStadiumByTeam(teamKey: string): StadiumRecord | null {
  const key = String(teamKey ?? "").trim().toLowerCase();
  if (!key) return null;

  return (
    Object.values(stadiums).find((stadium) =>
      stadium.teamKeys.some((team) => String(team).trim().toLowerCase() === key)
    ) ?? null
  );
}

export function getStadiumsByCountry(country: string): StadiumRecord[] {
  const value = String(country ?? "").trim().toLowerCase();
  if (!value) return [];

  return Object.values(stadiums).filter(
    (stadium) => String(stadium.country ?? "").trim().toLowerCase() === value
  );
}

export function getStadiumsByCity(city: string): StadiumRecord[] {
  const value = String(city ?? "").trim().toLowerCase();
  if (!value) return [];

  return Object.values(stadiums).filter(
    (stadium) => String(stadium.city ?? "").trim().toLowerCase() === value
  );
}

export default stadiums;
