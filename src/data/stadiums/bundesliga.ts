import type { StadiumRecord } from "./types";

export const bundesligaStadiums: Record<string, StadiumRecord> = {
  "wwk-arena": {
    stadiumKey: "wwk-arena",
    name: "WWK Arena",
    city: "Augsburg",
    country: "Germany",
    capacity: 30660,
    opened: 2009,
    teamKeys: ["augsburg"],
    airport: "Munich Airport (MUC)",
    distanceFromAirportKm: 85,
    transit: [
      { label: "Augsburg Hbf", minutes: 25, note: "tram connection needed" },
      { label: "Königsplatz", minutes: 20, note: "main city tram interchange" },
    ],
    stayAreas: [
      { area: "Augsburg Old Town", why: "Best visitor base for food, bars and atmosphere" },
      { area: "Near Augsburg Hbf", why: "Best for practical rail-based travel" },
    ],
    tips: [
      "Easy enough football stop, but more of a neat city-break add-on than a headline trip",
      "Stay central Augsburg rather than out by the stadium",
    ],
  },

  "bayarena": {
    stadiumKey: "bayarena",
    name: "BayArena",
    city: "Leverkusen",
    country: "Germany",
    capacity: 30210,
    opened: 1958,
    teamKeys: ["bayer-leverkusen"],
    airport: "Cologne Bonn Airport (CGN)",
    distanceFromAirportKm: 26,
    transit: [
      { label: "Leverkusen Mitte", minutes: 20 },
      { label: "Cologne Hbf", minutes: 30, note: "best wider trip base" },
    ],
    stayAreas: [
      { area: "Cologne City Centre", why: "Best all-round base with stronger nightlife and hotels" },
      { area: "Leverkusen Mitte", why: "Best local practical option if keeping it simple" },
    ],
    tips: [
      "Usually better as a Cologne-based football trip than a pure Leverkusen stay",
      "Fast regional rail makes Cologne the smarter visitor choice",
    ],
  },

  "allianz-arena": {
    stadiumKey: "allianz-arena",
    name: "Allianz Arena",
    city: "Munich",
    country: "Germany",
    capacity: 75024,
    opened: 2005,
    teamKeys: ["bayern-munich"],
    airport: "Munich Airport (MUC)",
    distanceFromAirportKm: 26,
    transit: [
      { label: "Fröttmaning", minutes: 10 },
      { label: "München Hbf", minutes: 30, note: "best mainline arrival hub" },
    ],
    stayAreas: [
      { area: "Altstadt / Marienplatz", why: "Best classic Munich base" },
      { area: "Hauptbahnhof", why: "Best practical base for rail and airport links" },
    ],
    tips: [
      "One of Europe’s easiest major stadium trips because Munich transport is excellent",
      "Stay central Munich, not near the stadium",
    ],
  },

  "signal-iduna-park": {
    stadiumKey: "signal-iduna-park",
    name: "Signal Iduna Park",
    city: "Dortmund",
    country: "Germany",
    capacity: 81365,
    opened: 1974,
    teamKeys: ["borussia-dortmund"],
    airport: "Dortmund Airport (DTM)",
    distanceFromAirportKm: 13,
    transit: [
      { label: "Dortmund Hbf", minutes: 25 },
      { label: "Signal Iduna Park Station", minutes: 8, note: "matchday useful" },
    ],
    stayAreas: [
      { area: "Dortmund City Centre", why: "Best all-round base for transport and nightlife" },
      { area: "Around Westenhellweg", why: "Best central visitor zone" },
    ],
    tips: [
      "One of the best football atmospheres in the world so arrival well before kick-off is worth it",
      "The city is functional rather than glamorous, but the football experience is elite",
    ],
  },

  "borussia-park": {
    stadiumKey: "borussia-park",
    name: "Borussia-Park",
    city: "Mönchengladbach",
    country: "Germany",
    capacity: 54057,
    opened: 2004,
    teamKeys: ["borussia-mgladbach"],
    airport: "Düsseldorf Airport (DUS)",
    distanceFromAirportKm: 33,
    transit: [
      { label: "Mönchengladbach Hbf", minutes: 25, note: "bus/shuttle onward" },
      { label: "Düsseldorf Hbf", minutes: 45, note: "better wider visitor base" },
    ],
    stayAreas: [
      { area: "Mönchengladbach Centre", why: "Simplest local option" },
      { area: "Düsseldorf City Centre", why: "Better hotels, nightlife and trip quality" },
    ],
    tips: [
      "Usually works better as part of a wider Rhine-Ruhr football trip",
      "Düsseldorf is often the better overnight base unless you want maximum simplicity",
    ],
  },

  "deutsche-bank-park": {
    stadiumKey: "deutsche-bank-park",
    name: "Deutsche Bank Park",
    city: "Frankfurt",
    country: "Germany",
    capacity: 58000,
    opened: 1925,
    teamKeys: ["eintracht-frankfurt"],
    airport: "Frankfurt Airport (FRA)",
    distanceFromAirportKm: 9,
    transit: [
      { label: "Frankfurt Stadion", minutes: 10 },
      { label: "Frankfurt Hbf", minutes: 20, note: "best city rail hub" },
    ],
    stayAreas: [
      { area: "Innenstadt", why: "Best central sightseeing and transport base" },
      { area: "Bahnhofsviertel", why: "Best practical base near the station, though rougher around the edges" },
    ],
    tips: [
      "Very strong football city with major-hub convenience",
      "Excellent one for flying in and out quickly because the airport is so close",
    ],
  },

  "rhein-energie-stadion": {
    stadiumKey: "rhein-energie-stadion",
    name: "RheinEnergieStadion",
    city: "Cologne",
    country: "Germany",
    capacity: 50000,
    opened: 2004,
    teamKeys: ["fc-cologne"],
    airport: "Cologne Bonn Airport (CGN)",
    distanceFromAirportKm: 25,
    transit: [
      { label: "RheinEnergieSTADION", minutes: 5 },
      { label: "Cologne Hbf", minutes: 25, note: "best wider rail and visitor hub" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best atmosphere and city-break feel" },
      { area: "Belgisches Viertel", why: "Best bars, food and local vibe" },
    ],
    tips: [
      "Cologne is one of the best all-round football weekend cities in Germany",
      "Stay central and use the tram rather than staying near the ground",
    ],
  },

  "voith-arena": {
    stadiumKey: "voith-arena",
    name: "Voith-Arena",
    city: "Heidenheim",
    country: "Germany",
    capacity: 15000,
    opened: 1972,
    teamKeys: ["fc-heidenheim"],
    airport: "Stuttgart Airport (STR)",
    distanceFromAirportKm: 85,
    transit: [
      { label: "Heidenheim Station", minutes: 25 },
      { label: "Town centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Heidenheim Centre", why: "Best local practical base" },
      { area: "Stuttgart", why: "Better bigger-city base if combining wider travel" },
    ],
    tips: [
      "More niche football stop than major destination",
      "Good one for committed groundhoppers rather than luxury trip-seekers",
    ],
  },

  "europa-park-stadion": {
    stadiumKey: "europa-park-stadion",
    name: "Europa-Park Stadion",
    city: "Freiburg",
    country: "Germany",
    capacity: 34700,
    opened: 2021,
    teamKeys: ["freiburg"],
    airport: "Basel EuroAirport (BSL)",
    distanceFromAirportKm: 70,
    transit: [
      { label: "Freiburg Hbf", minutes: 20 },
      { label: "Freiburg Old Town", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best overall base and best city atmosphere" },
      { area: "Near Freiburg Hbf", why: "Best for straightforward rail movement" },
    ],
    tips: [
      "Freiburg is one of the nicest smaller Bundesliga city trips",
      "A very good football + scenic weekend option",
    ],
  },

  "volksparkstadion": {
    stadiumKey: "volksparkstadion",
    name: "Volksparkstadion",
    city: "Hamburg",
    country: "Germany",
    capacity: 57000,
    opened: 1953,
    teamKeys: ["hamburger-sv"],
    airport: "Hamburg Airport (HAM)",
    distanceFromAirportKm: 11,
    transit: [
      { label: "Hamburg Hbf", minutes: 30 },
      { label: "Stellingen", minutes: 20, note: "common local access point" },
    ],
    stayAreas: [
      { area: "St. Georg / Hbf", why: "Best practical arrival base" },
      { area: "St. Pauli", why: "Best nightlife and city atmosphere" },
    ],
    tips: [
      "Hamburg is one of the strongest city-break football cities in Europe",
      "Stay central Hamburg, not by the stadium",
    ],
  },

  "prezero-arena": {
    stadiumKey: "prezero-arena",
    name: "PreZero Arena",
    city: "Sinsheim",
    country: "Germany",
    capacity: 30150,
    opened: 2009,
    teamKeys: ["hoffenheim"],
    airport: "Stuttgart Airport (STR)",
    distanceFromAirportKm: 90,
    transit: [
      { label: "Sinsheim Museum/Arena", minutes: 10 },
      { label: "Heidelberg", minutes: 35, note: "better wider trip base" },
    ],
    stayAreas: [
      { area: "Sinsheim Centre", why: "Simplest local option" },
      { area: "Heidelberg", why: "Far better city-break base with atmosphere and hotels" },
    ],
    tips: [
      "Better handled as a Heidelberg-based trip than a pure Sinsheim stay",
      "Efficient rather than romantic football destination",
    ],
  },

  "meva-arena": {
    stadiumKey: "meva-arena",
    name: "MEWA Arena",
    city: "Mainz",
    country: "Germany",
    capacity: 34000,
    opened: 2011,
    teamKeys: ["mainz-05"],
    airport: "Frankfurt Airport (FRA)",
    distanceFromAirportKm: 32,
    transit: [
      { label: "Mainz Hbf", minutes: 25 },
      { label: "Mainz City Centre", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best bars, food and Rhine atmosphere" },
      { area: "Near Mainz Hbf", why: "Best practical base for rail and airport access" },
    ],
    tips: [
      "Mainz is a very good understated football weekend city",
      "Easy to combine with Frankfurt travel if needed",
    ],
  },

  "red-bull-arena-leipzig": {
    stadiumKey: "red-bull-arena-leipzig",
    name: "Red Bull Arena",
    city: "Leipzig",
    country: "Germany",
    capacity: 47069,
    opened: 2004,
    teamKeys: ["rb-leipzig"],
    airport: "Leipzig/Halle Airport (LEJ)",
    distanceFromAirportKm: 16,
    transit: [
      { label: "Leipzig Hbf", minutes: 25 },
      { label: "Leipzig Innenstadt", minutes: 20, note: "best city base" },
    ],
    stayAreas: [
      { area: "Innenstadt", why: "Best overall base with bars, restaurants and transport" },
      { area: "Around Leipzig Hbf", why: "Best practical base for rail arrivals" },
    ],
    tips: [
      "Leipzig is one of the easiest Bundesliga cities to turn into a proper weekend trip",
      "Stay central and treat the stadium as a short tram/walk outing",
    ],
  },

  "millerntor-stadion": {
    stadiumKey: "millerntor-stadion",
    name: "Millerntor-Stadion",
    city: "Hamburg",
    country: "Germany",
    capacity: 29546,
    opened: 1963,
    teamKeys: ["st-pauli"],
    airport: "Hamburg Airport (HAM)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "St. Pauli", minutes: 8 },
      { label: "Landungsbrücken", minutes: 15, note: "great wider city access" },
    ],
    stayAreas: [
      { area: "St. Pauli", why: "Best for nightlife and atmosphere" },
      { area: "Schanzenviertel", why: "Best food, bars and local feel" },
    ],
    tips: [
      "One of the strongest culture-heavy football trips in Europe",
      "Excellent stadium to combine with a wider Hamburg weekend",
    ],
  },

  "alte-foersterei": {
    stadiumKey: "alte-foersterei",
    name: "Stadion An der Alten Försterei",
    city: "Berlin",
    country: "Germany",
    capacity: 22012,
    opened: 1920,
    teamKeys: ["union-berlin"],
    airport: "Berlin Brandenburg Airport (BER)",
    distanceFromAirportKm: 18,
    transit: [
      { label: "Köpenick", minutes: 20 },
      { label: "Ostkreuz", minutes: 30, note: "best wider Berlin connection hub" },
    ],
    stayAreas: [
      { area: "Alexanderplatz", why: "Best practical central Berlin base" },
      { area: "Friedrichshain", why: "Best nightlife and city-break feel" },
    ],
    tips: [
      "Traditional-feel ground with a much more characterful experience than many modern arenas",
      "Stay central Berlin, not in Köpenick unless you want a very local trip",
    ],
  },

  "mhp-arena": {
    stadiumKey: "mhp-arena",
    name: "MHP Arena",
    city: "Stuttgart",
    country: "Germany",
    capacity: 60449,
    opened: 1933,
    teamKeys: ["vfb-stuttgart"],
    airport: "Stuttgart Airport (STR)",
    distanceFromAirportKm: 15,
    transit: [
      { label: "Bad Cannstatt", minutes: 12 },
      { label: "Stuttgart Hbf", minutes: 20, note: "main city rail hub" },
    ],
    stayAreas: [
      { area: "Stuttgart Mitte", why: "Best city-centre visitor base" },
      { area: "Bad Cannstatt", why: "Closest practical option with local atmosphere" },
    ],
    tips: [
      "Strong traditional football city with easy transport",
      "Good option for a straightforward Bundesliga weekend",
    ],
  },

  "wohninvest-weser-stadion": {
    stadiumKey: "wohninvest-weser-stadion",
    name: "Weserstadion",
    city: "Bremen",
    country: "Germany",
    capacity: 42100,
    opened: 1947,
    teamKeys: ["werder-bremen"],
    airport: "Bremen Airport (BRE)",
    distanceFromAirportKm: 5,
    transit: [
      { label: "Bremen Hbf", minutes: 25 },
      { label: "Bremen Altstadt", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best central Bremen stay" },
      { area: "Viertel", why: "Best bars and more local atmosphere" },
    ],
    tips: [
      "Very solid city-break football trip thanks to compact central Bremen",
      "Easy one for a short football weekend because airport and city are both close",
    ],
  },

  "volkswagen-arena": {
    stadiumKey: "volkswagen-arena",
    name: "Volkswagen Arena",
    city: "Wolfsburg",
    country: "Germany",
    capacity: 30000,
    opened: 2002,
    teamKeys: ["wolfsburg"],
    airport: "Hannover Airport (HAJ)",
    distanceFromAirportKm: 90,
    transit: [
      { label: "Wolfsburg Hbf", minutes: 20 },
      { label: "Autostadt", minutes: 15, note: "useful central landmark area" },
    ],
    stayAreas: [
      { area: "Wolfsburg Centre", why: "Most practical local option" },
      { area: "Hannover", why: "Better broader city base if combining travel" },
    ],
    tips: [
      "Functional trip rather than one of Germany’s most atmospheric city breaks",
      "Works best if paired with wider northern Germany travel plans",
    ],
  },
};

export default bundesligaStadiums;
