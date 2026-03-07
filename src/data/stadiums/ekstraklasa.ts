import type { StadiumRecord } from "./types";

const ekstraklasaStadiums: Record<string, StadiumRecord> = {
  "polish-army-stadium": {
    stadiumKey: "polish-army-stadium",
    name: "Polish Army Stadium",
    city: "Warsaw",
    country: "Poland",
    capacity: 31500,
    opened: 1930,
    airport: "Warsaw Chopin Airport (WAW)",
    distanceFromAirportKm: 10,
    teamKeys: ["legia-warsaw"],
    transit: [
      { label: "Centrum", minutes: 20, note: "best central Warsaw base" },
      { label: "Warszawa Centralna", minutes: 25, note: "main rail hub" },
    ],
    stayAreas: [
      { area: "Śródmieście", why: "Best overall Warsaw base for hotels, bars and transport" },
      { area: "Nowy Świat / Centrum", why: "Best atmosphere and city-break feel" },
    ],
    tips: [
      "One of the strongest football trips in Poland thanks to club size and capital-city convenience",
      "Central Warsaw is the right base rather than staying near the ground",
    ],
  },

  "poznan-stadium": {
    stadiumKey: "poznan-stadium",
    name: "Poznań Stadium",
    city: "Poznań",
    country: "Poland",
    capacity: 41609,
    opened: 1980,
    airport: "Poznań Airport (POZ)",
    distanceFromAirportKm: 6,
    teamKeys: ["lech-poznan"],
    transit: [
      { label: "Poznań Główny", minutes: 20 },
      { label: "City centre / Stary Rynek", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Stary Rynek", why: "Best bars, restaurants and city atmosphere" },
      { area: "Near Poznań Główny", why: "Best practical rail and airport access" },
    ],
    tips: [
      "Very strong football-weekend city with a lively centre",
      "Best handled as a central Poznań stay with stadium travel as a simple add-on",
    ],
  },

  "rakow-stadium": {
    stadiumKey: "rakow-stadium",
    name: "Raków Stadium",
    city: "Częstochowa",
    country: "Poland",
    capacity: 5500,
    opened: 1955,
    airport: "Katowice Airport (KTW)",
    distanceFromAirportKm: 52,
    teamKeys: ["rakow"],
    transit: [
      { label: "Częstochowa Station", minutes: 25 },
      { label: "City centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Częstochowa Centre", why: "Most practical local base" },
      { area: "Katowice", why: "Better wider city base if combining football with regional travel" },
    ],
    tips: [
      "More of a focused football stop than a headline city-break destination",
      "Best treated as a simple match trip rather than a luxury weekend away",
    ],
  },

  "florian-krygier-stadium": {
    stadiumKey: "florian-krygier-stadium",
    name: "Florian Krygier Stadium",
    city: "Szczecin",
    country: "Poland",
    capacity: 21163,
    opened: 1925,
    airport: "Solidarity Szczecin-Goleniów Airport (SZZ)",
    distanceFromAirportKm: 45,
    teamKeys: ["pogon-szczecin"],
    transit: [
      { label: "Szczecin Główny", minutes: 20 },
      { label: "City centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Old Town / Centrum", why: "Best practical visitor base" },
      { area: "Around Wały Chrobrego", why: "Best scenic city setting" },
    ],
    tips: [
      "Underrated city for a football weekend if you want something different from the usual capitals",
      "Stay central and use local transport or taxi rather than staying near the ground",
    ],
  },

  "polsat-plus-arena": {
    stadiumKey: "polsat-plus-arena",
    name: "Polsat Plus Arena",
    city: "Gdańsk",
    country: "Poland",
    capacity: 41620,
    opened: 2011,
    airport: "Gdańsk Airport (GDN)",
    distanceFromAirportKm: 14,
    teamKeys: ["lechia-gdansk"],
    transit: [
      { label: "Gdańsk Główny", minutes: 25 },
      { label: "Wrzeszcz", minutes: 20, note: "useful local hub" },
    ],
    stayAreas: [
      { area: "Old Town", why: "Best all-round base for visitors" },
      { area: "Wrzeszcz", why: "Best practical midpoint between airport, city and stadium" },
    ],
    tips: [
      "One of the best pure city-break football trips in Poland because Gdańsk adds so much beyond the match",
      "Strong option for a longer weekend, especially if combining with the Baltic coast vibe",
    ],
  },

  "arena-zabrze": {
    stadiumKey: "arena-zabrze",
    name: "Arena Zabrze",
    city: "Zabrze",
    country: "Poland",
    capacity: 24563,
    opened: 1934,
    airport: "Katowice Airport (KTW)",
    distanceFromAirportKm: 38,
    teamKeys: ["gornik-zabrze"],
    transit: [
      { label: "Zabrze Centre", minutes: 15 },
      { label: "Katowice", minutes: 30, note: "better wider region base" },
    ],
    stayAreas: [
      { area: "Zabrze Centre", why: "Simplest local option" },
      { area: "Katowice", why: "Better hotels, nightlife and wider city value" },
    ],
    tips: [
      "Best treated as part of a wider Silesia football trip",
      "Katowice is usually the smarter overnight base unless you want pure simplicity",
    ],
  },

  "bialystok-city-stadium": {
    stadiumKey: "bialystok-city-stadium",
    name: "Białystok City Stadium",
    city: "Białystok",
    country: "Poland",
    capacity: 22372,
    opened: 2014,
    airport: "Warsaw Chopin Airport (WAW)",
    distanceFromAirportKm: 195,
    teamKeys: ["jagiellonia"],
    transit: [
      { label: "Białystok Station", minutes: 25 },
      { label: "City centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Białystok Centre", why: "Best local practical base" },
      { area: "Around Kościuszko Market Square", why: "Best atmosphere and walkability" },
    ],
    tips: [
      "Longer-haul domestic trip by Polish standards, so planning matters more here",
      "More of a football-led trip than a mainstream European city-break destination",
    ],
  },

  "marshal-pilsudski-stadium": {
    stadiumKey: "marshal-pilsudski-stadium",
    name: "Marshal Józef Piłsudski Stadium",
    city: "Kraków",
    country: "Poland",
    capacity: 15016,
    opened: 1912,
    airport: "Kraków Airport (KRK)",
    distanceFromAirportKm: 13,
    teamKeys: ["cracovia"],
    transit: [
      { label: "Kraków Główny", minutes: 20 },
      { label: "Old Town", minutes: 15, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Old Town", why: "Best classic Kraków stay" },
      { area: "Kazimierz", why: "Best bars, food and city atmosphere" },
    ],
    tips: [
      "Excellent city-break football trip because Kraków is one of the best leisure cities in the region",
      "Kazimierz is often the best balance of nightlife and trip quality",
    ],
  },

  "gliwice-arena": {
    stadiumKey: "gliwice-arena",
    name: "Stadion Miejski Gliwice",
    city: "Gliwice",
    country: "Poland",
    capacity: 10037,
    opened: 2011,
    airport: "Katowice Airport (KTW)",
    distanceFromAirportKm: 50,
    teamKeys: ["piast-gliwice"],
    transit: [
      { label: "Gliwice Station", minutes: 20 },
      { label: "City centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Gliwice Centre", why: "Best local practical base" },
      { area: "Katowice", why: "Better city-break and nightlife option" },
    ],
    tips: [
      "Another one best treated as part of a wider Silesia football run",
      "Useful, coherent trip but not one of the glamour destinations in the league",
    ],
  },

  "widzew-stadium": {
    stadiumKey: "widzew-stadium",
    name: "Widzew Stadium",
    city: "Łódź",
    country: "Poland",
    capacity: 18018,
    opened: 2017,
    airport: "Łódź Airport (LCJ)",
    distanceFromAirportKm: 10,
    teamKeys: ["widzew-lodz"],
    transit: [
      { label: "Łódź Fabryczna", minutes: 20 },
      { label: "Piotrkowska area", minutes: 20, note: "best nightlife base" },
    ],
    stayAreas: [
      { area: "Piotrkowska Street", why: "Best bars, restaurants and city character" },
      { area: "Near Łódź Fabryczna", why: "Best practical rail base" },
    ],
    tips: [
      "Łódź is a better football weekend than people expect if you stay central",
      "Piotrkowska is usually the right answer for atmosphere and convenience",
    ],
  },
};

export default ekstraklasaStadiums;
