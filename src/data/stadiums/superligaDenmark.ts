import type { StadiumRecord } from "./types";

const superligaDenmarkStadiums: Record<string, StadiumRecord> = {
  "parken-stadium": {
    stadiumKey: "parken-stadium",
    name: "Parken Stadium",
    city: "Copenhagen",
    country: "Denmark",
    capacity: 38065,
    opened: 1992,
    airport: "Copenhagen Airport (CPH)",
    distanceFromAirportKm: 11,
    teamKeys: ["fc-copenhagen"],
    transit: [
      { label: "Trianglen (Metro)", minutes: 10 },
      { label: "Østerport", minutes: 15, note: "best wider central access" },
    ],
    stayAreas: [
      { area: "Indre By", why: "Best classic Copenhagen city-break base" },
      { area: "Vesterbro", why: "Best bars, restaurants and nightlife" },
    ],
    tips: [
      "One of the easiest premium football city breaks in the Nordics",
      "Stay central Copenhagen rather than around the stadium itself",
    ],
  },

  "brondby-stadium": {
    stadiumKey: "brondby-stadium",
    name: "Brøndby Stadium",
    city: "Brøndby",
    country: "Denmark",
    capacity: 29000,
    opened: 1965,
    airport: "Copenhagen Airport (CPH)",
    distanceFromAirportKm: 24,
    teamKeys: ["brondby"],
    transit: [
      { label: "Brøndbyøster / local rail-bus approach", minutes: 20 },
      { label: "Copenhagen Central Station", minutes: 30, note: "best wider trip base" },
    ],
    stayAreas: [
      { area: "Vesterbro", why: "Best practical Copenhagen base for nightlife and transport" },
      { area: "Indre By", why: "Best central city-break base overall" },
    ],
    tips: [
      "This is a Copenhagen trip first and a Brøndby trip second",
      "Central Copenhagen remains the right base unless you only care about match logistics",
    ],
  },

  "mch-arena": {
    stadiumKey: "mch-arena",
    name: "MCH Arena",
    city: "Herning",
    country: "Denmark",
    capacity: 11800,
    opened: 2004,
    airport: "Billund Airport (BLL)",
    distanceFromAirportKm: 55,
    teamKeys: ["midtjylland"],
    transit: [
      { label: "Herning Station", minutes: 25 },
      { label: "City centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Herning Centre", why: "Best local practical base" },
      { area: "Near station", why: "Best for a straightforward overnight stay" },
    ],
    tips: [
      "More of a football stop than a glamour city-break weekend",
      "Works well for a compact overnight if you want league coverage depth",
    ],
  },

  "ceres-park": {
    stadiumKey: "ceres-park",
    name: "Ceres Park",
    city: "Aarhus",
    country: "Denmark",
    capacity: 20000,
    opened: 1920,
    airport: "Aarhus Airport (AAR)",
    distanceFromAirportKm: 42,
    teamKeys: ["aarhus"],
    transit: [
      { label: "Aarhus H", minutes: 20 },
      { label: "Latin Quarter / centre", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Latin Quarter", why: "Best atmosphere and city-break feel" },
      { area: "Around Aarhus H", why: "Best practical rail-led base" },
    ],
    tips: [
      "One of the strongest football city-breaks in Denmark outside Copenhagen",
      "Aarhus is a genuinely good weekend city, so central stays make sense",
    ],
  },

  "right-to-dream-park": {
    stadiumKey: "right-to-dream-park",
    name: "Right to Dream Park",
    city: "Farum",
    country: "Denmark",
    capacity: 10000,
    opened: 1999,
    airport: "Copenhagen Airport (CPH)",
    distanceFromAirportKm: 38,
    teamKeys: ["nordsjaelland"],
    transit: [
      { label: "Farum Station", minutes: 15 },
      { label: "Nørreport", minutes: 35, note: "best wider Copenhagen hub" },
    ],
    stayAreas: [
      { area: "Indre By", why: "Best central Copenhagen base" },
      { area: "Nørrebro", why: "Best bars, food and slightly more local feel" },
    ],
    tips: [
      "This is another Copenhagen-region trip rather than a Farum destination weekend",
      "Stay in Copenhagen and travel out",
    ],
  },

  "jysk-park": {
    stadiumKey: "jysk-park",
    name: "JYSK Park",
    city: "Silkeborg",
    country: "Denmark",
    capacity: 10000,
    opened: 2017,
    airport: "Billund Airport (BLL)",
    distanceFromAirportKm: 60,
    teamKeys: ["silkeborg"],
    transit: [
      { label: "Silkeborg Station", minutes: 20 },
      { label: "Town centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Silkeborg Centre", why: "Best local practical base" },
      { area: "Lakeside area", why: "Best scenic stay option" },
    ],
    tips: [
      "A calmer football trip with better scenery than many small-club weekends",
      "Good if you want football plus a relaxed Danish town stay",
    ],
  },

  "cepheus-park": {
    stadiumKey: "cepheus-park",
    name: "Cepheus Park",
    city: "Randers",
    country: "Denmark",
    capacity: 10000,
    opened: 2006,
    airport: "Aarhus Airport (AAR)",
    distanceFromAirportKm: 45,
    teamKeys: ["randers"],
    transit: [
      { label: "Randers Station", minutes: 20 },
      { label: "City centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Randers Centre", why: "Best local practical option" },
      { area: "Aarhus", why: "Better broader city-break base if combining travel" },
    ],
    tips: [
      "Functional football stop rather than a premium weekend destination",
      "Aarhus may be the better overnight base if you want more off-pitch value",
    ],
  },

  "nature-energy-park": {
    stadiumKey: "nature-energy-park",
    name: "Nature Energy Park",
    city: "Odense",
    country: "Denmark",
    capacity: 15800,
    opened: 1941,
    airport: "Copenhagen Airport (CPH)",
    distanceFromAirportKm: 170,
    teamKeys: ["odense"],
    transit: [
      { label: "Odense Station", minutes: 20 },
      { label: "City centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Odense Centre", why: "Best practical local base" },
      { area: "Near station", why: "Best for a simple rail-led trip" },
    ],
    tips: [
      "Odense works better as a tidy short football city than people might expect",
      "Good one-night stop, but not on Copenhagen or Aarhus level for a full weekend",
    ],
  },

  "energi-viborg-arena": {
    stadiumKey: "energi-viborg-arena",
    name: "Energi Viborg Arena",
    city: "Viborg",
    country: "Denmark",
    capacity: 9600,
    opened: 2000,
    airport: "Billund Airport (BLL)",
    distanceFromAirportKm: 85,
    teamKeys: ["viborg"],
    transit: [
      { label: "Viborg Station", minutes: 20 },
      { label: "City centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Viborg Centre", why: "Best local practical base" },
      { area: "Near cathedral / centre", why: "Best if you want the more attractive central area" },
    ],
    tips: [
      "A smaller football stop with a cleaner, more pleasant town feel than some leagues offer",
      "Best for a simple overnight rather than a long city-break weekend",
    ],
  },

  "vejle-stadium": {
    stadiumKey: "vejle-stadium",
    name: "Vejle Stadium",
    city: "Vejle",
    country: "Denmark",
    capacity: 10400,
    opened: 1924,
    airport: "Billund Airport (BLL)",
    distanceFromAirportKm: 30,
    teamKeys: ["vejle"],
    transit: [
      { label: "Vejle Station", minutes: 20 },
      { label: "Town centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Vejle Centre", why: "Best practical local base" },
      { area: "Waterfront / centre", why: "Best local scenic stay option" },
    ],
    tips: [
      "A simple Danish football stop with decent practicality",
      "Not a glamour weekend, but coherent and easy enough to work into a larger Denmark trip",
    ],
  },

  "lyngby-stadium": {
    stadiumKey: "lyngby-stadium",
    name: "Lyngby Stadium",
    city: "Lyngby",
    country: "Denmark",
    capacity: 10000,
    opened: 1942,
    airport: "Copenhagen Airport (CPH)",
    distanceFromAirportKm: 24,
    teamKeys: ["lyngby"],
    transit: [
      { label: "Lyngby Station", minutes: 15 },
      { label: "Nørreport", minutes: 25, note: "best wider Copenhagen base" },
    ],
    stayAreas: [
      { area: "Indre By", why: "Best central Copenhagen base" },
      { area: "Østerbro / Nørrebro", why: "Good mix of atmosphere and practical access" },
    ],
    tips: [
      "Another Copenhagen-region fixture rather than a stand-alone suburban trip",
      "Copenhagen should almost always be the overnight base",
    ],
  },

  "sydbank-park": {
    stadiumKey: "sydbank-park",
    name: "Sydbank Park",
    city: "Haderslev",
    country: "Denmark",
    capacity: 10000,
    opened: 2000,
    airport: "Billund Airport (BLL)",
    distanceFromAirportKm: 85,
    teamKeys: ["sonderjyske"],
    transit: [
      { label: "Haderslev centre", minutes: 15 },
      { label: "Main bus area", minutes: 15, note: "best practical arrival point" },
    ],
    stayAreas: [
      { area: "Haderslev Centre", why: "Most practical local option" },
      { area: "Kolding", why: "Better wider regional base if combining travel" },
    ],
    tips: [
      "Very much a football stop rather than a destination weekend",
      "Useful for depth and coverage, but not one of the glamour trip products",
    ],
  },
};

export default superligaDenmarkStadiums;
