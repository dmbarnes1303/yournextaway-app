import type { StadiumRecord } from "./types";

const GERMANY = "Germany";

export const bundesligaStadiums: Record<string, StadiumRecord> = {
  "wwk-arena": {
    stadiumKey: "wwk-arena",
    name: "WWK Arena",
    city: "Augsburg",
    country: GERMANY,
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
      { area: "Augsburg Old Town", why: "Best visitor base for food, bars and a proper city feel" },
      { area: "Near Augsburg Hbf", why: "Best practical base for rail-based travel and easy arrival" },
    ],
    tips: [
      "Augsburg works best as a neat football city-break add-on rather than a flagship Bundesliga trip",
      "Stay central and tram out rather than wasting the trip by sleeping near the ground",
    ],
  },

  bayarena: {
    stadiumKey: "bayarena",
    name: "BayArena",
    city: "Leverkusen",
    country: GERMANY,
    capacity: 30210,
    opened: 1958,
    teamKeys: ["bayer-leverkusen"],
    airport: "Cologne Bonn Airport (CGN)",
    distanceFromAirportKm: 26,
    transit: [
      { label: "Leverkusen Mitte", minutes: 20, note: "best local rail anchor" },
      { label: "Cologne Hbf", minutes: 30, note: "best wider trip base by far" },
    ],
    stayAreas: [
      { area: "Cologne City Centre", why: "Best all-round base with better nightlife, hotels and city-break value" },
      { area: "Leverkusen Mitte", why: "Best local practical option if keeping the trip simple" },
    ],
    tips: [
      "Usually better as a Cologne-based football trip than a pure Leverkusen overnight",
      "Regional rail makes this one easy, so there is little upside in forcing a Leverkusen-only stay",
    ],
  },

  "allianz-arena": {
    stadiumKey: "allianz-arena",
    name: "Allianz Arena",
    city: "Munich",
    country: GERMANY,
    capacity: 75000,
    opened: 2005,
    teamKeys: ["bayern-munich"],
    airport: "Munich Airport (MUC)",
    distanceFromAirportKm: 26,
    transit: [
      { label: "Fröttmaning", minutes: 10, note: "direct matchday U-Bahn access point" },
      { label: "Marienplatz", minutes: 25, note: "best classic central Munich anchor" },
    ],
    stayAreas: [
      { area: "Altstadt / Marienplatz", why: "Best classic Munich base for first-time visitors" },
      { area: "Schwabing / Maxvorstadt", why: "Better mix of bars, food and neighbourhood feel" },
    ],
    tips: [
      "One of Europe’s easiest major-stadium trips because Munich transport is so good",
      "Stay central Munich and treat the stadium as a clean U-Bahn leg, not a hotel district",
    ],
  },

  "signal-iduna-park": {
    stadiumKey: "signal-iduna-park",
    name: "Signal Iduna Park",
    city: "Dortmund",
    country: GERMANY,
    capacity: 81365,
    opened: 1974,
    teamKeys: ["borussia-dortmund"],
    airport: "Dortmund Airport (DTM)",
    distanceFromAirportKm: 13,
    transit: [
      { label: "Dortmund Hbf", minutes: 25, note: "best main city rail anchor" },
      { label: "Signal Iduna Park Station", minutes: 8, note: "very useful on matchday" },
    ],
    stayAreas: [
      { area: "Dortmund City Centre", why: "Best all-round base for transport and easy matchday flow" },
      { area: "Kreuzviertel", why: "Best local-feel stay with better bars and restaurants" },
    ],
    tips: [
      "One of the best football atmospheres in the world, so getting there early is not optional if you want the full experience",
      "Dortmund is functional more than beautiful, but the football payoff is elite enough that it does not matter",
    ],
  },

  "borussia-park": {
    stadiumKey: "borussia-park",
    name: "Borussia-Park",
    city: "Mönchengladbach",
    country: GERMANY,
    capacity: 54042,
    opened: 2004,
    teamKeys: ["borussia-mgladbach"],
    airport: "Düsseldorf Airport (DUS)",
    distanceFromAirportKm: 33,
    transit: [
      { label: "Mönchengladbach Hbf", minutes: 25, note: "bus/shuttle onward from the main rail hub" },
      { label: "Düsseldorf Hbf", minutes: 45, note: "better wider city base for most visitors" },
    ],
    stayAreas: [
      { area: "Mönchengladbach Centre", why: "Simplest local option if the match is the whole point" },
      { area: "Düsseldorf City Centre", why: "Better hotels, nightlife and wider trip quality" },
    ],
    tips: [
      "Usually works better as part of a wider Rhine-Ruhr football run than as a pure standalone luxury weekend",
      "Düsseldorf is often the smarter overnight base unless you want maximum simplicity and nothing else",
    ],
  },

  "deutsche-bank-park": {
    stadiumKey: "deutsche-bank-park",
    name: "Deutsche Bank Park",
    city: "Frankfurt",
    country: GERMANY,
    capacity: 59500,
    opened: 1925,
    teamKeys: ["eintracht-frankfurt"],
    airport: "Frankfurt Airport (FRA)",
    distanceFromAirportKm: 9,
    transit: [
      { label: "Frankfurt Stadion", minutes: 10, note: "main matchday station" },
      { label: "Frankfurt Hbf", minutes: 20, note: "best city rail hub and easiest practical base" },
    ],
    stayAreas: [
      { area: "Innenstadt", why: "Best central sightseeing and transport base" },
      { area: "Sachsenhausen", why: "Better bars, food and more local evening feel" },
    ],
    tips: [
      "One of Germany’s strongest football-city combinations because the stadium, airport and city all link so easily",
      "Excellent for fly-in, fly-out football planning, but still strong enough for a full weekend",
    ],
  },

  "rhein-energie-stadion": {
    stadiumKey: "rhein-energie-stadion",
    name: "RheinEnergieStadion",
    city: "Cologne",
    country: GERMANY,
    capacity: 50000,
    opened: 1923,
    teamKeys: ["fc-cologne"],
    airport: "Cologne Bonn Airport (CGN)",
    distanceFromAirportKm: 25,
    transit: [
      { label: "RheinEnergieSTADION", minutes: 5, note: "stadium tram stop" },
      { label: "Cologne Hbf", minutes: 25, note: "best wider rail and visitor hub" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best classic Cologne atmosphere and easiest city-break feel" },
      { area: "Belgisches Viertel", why: "Best bars, food and stronger local nightlife" },
    ],
    tips: [
      "Cologne is one of the best all-round football weekend cities in Germany, full stop",
      "Stay central and use the tram rather than throwing away the city just to sleep near the ground",
    ],
  },

  "voith-arena": {
    stadiumKey: "voith-arena",
    name: "Voith-Arena",
    city: "Heidenheim",
    country: GERMANY,
    capacity: 15000,
    opened: 1972,
    teamKeys: ["fc-heidenheim"],
    airport: "Stuttgart Airport (STR)",
    distanceFromAirportKm: 85,
    transit: [
      { label: "Heidenheim Station", minutes: 25, note: "main local rail arrival point" },
      { label: "Heidenheim Centre", minutes: 20, note: "best local practical base" },
    ],
    stayAreas: [
      { area: "Heidenheim Centre", why: "Best local practical base if the match is the whole point" },
      { area: "Stuttgart", why: "Better bigger-city base if combining football with wider travel" },
    ],
    tips: [
      "More niche football stop than major destination, so sell it honestly",
      "Good for committed groundhoppers and league-depth travellers rather than luxury weekend seekers",
    ],
  },

  "europa-park-stadion": {
    stadiumKey: "europa-park-stadion",
    name: "Europa-Park Stadion",
    city: "Freiburg",
    country: GERMANY,
    capacity: 34700,
    opened: 2021,
    teamKeys: ["freiburg"],
    airport: "Basel EuroAirport (BSL)",
    distanceFromAirportKm: 70,
    transit: [
      { label: "Freiburg Hbf", minutes: 20, note: "best rail anchor" },
      { label: "Freiburg Old Town", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best overall base and strongest city atmosphere" },
      { area: "Near Freiburg Hbf", why: "Best for practical rail movement and short stays" },
    ],
    tips: [
      "Freiburg is one of the nicest smaller Bundesliga city trips and should be treated that way",
      "A genuinely strong football plus scenic-weekend option rather than just a minor stop",
    ],
  },

  volksparkstadion: {
    stadiumKey: "volksparkstadion",
    name: "Volksparkstadion",
    city: "Hamburg",
    country: GERMANY,
    capacity: 57000,
    opened: 1953,
    teamKeys: ["hamburger-sv"],
    airport: "Hamburg Airport (HAM)",
    distanceFromAirportKm: 11,
    transit: [
      { label: "Stellingen", minutes: 20, note: "common local matchday access point" },
      { label: "Hamburg Hbf", minutes: 30, note: "best main city rail anchor" },
    ],
    stayAreas: [
      { area: "St. Georg / Hbf", why: "Best practical arrival base with easy network access" },
      { area: "St. Pauli", why: "Best nightlife, bars and wider city atmosphere" },
    ],
    tips: [
      "Hamburg is one of the strongest city-break football cities in Europe and the stadium should be sold as part of that",
      "Stay central Hamburg, never by the stadium unless convenience is literally your only goal",
    ],
  },

  "prezero-arena": {
    stadiumKey: "prezero-arena",
    name: "PreZero Arena",
    city: "Sinsheim",
    country: GERMANY,
    capacity: 30150,
    opened: 2009,
    teamKeys: ["hoffenheim"],
    airport: "Stuttgart Airport (STR)",
    distanceFromAirportKm: 90,
    transit: [
      { label: "Sinsheim Museum/Arena", minutes: 10, note: "local rail stop for stadium access" },
      { label: "Heidelberg Hbf", minutes: 35, note: "far better wider trip base" },
    ],
    stayAreas: [
      { area: "Sinsheim Centre", why: "Simplest local option if keeping it purely football-focused" },
      { area: "Heidelberg", why: "Much stronger city-break base with atmosphere, food and hotel choice" },
    ],
    tips: [
      "Much better handled as a Heidelberg-based trip than a pure Sinsheim stay",
      "Efficient rather than romantic football destination, so do not oversell it",
    ],
  },

  "mewa-arena": {
    stadiumKey: "mewa-arena",
    name: "MEWA Arena",
    city: "Mainz",
    country: GERMANY,
    capacity: 33305,
    opened: 2011,
    teamKeys: ["mainz-05"],
    airport: "Frankfurt Airport (FRA)",
    distanceFromAirportKm: 32,
    transit: [
      { label: "Mainz Hbf", minutes: 25, note: "best rail anchor" },
      { label: "Mainz Altstadt", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best bars, food and Rhine atmosphere" },
      { area: "Near Mainz Hbf", why: "Best practical base for rail and airport access" },
    ],
    tips: [
      "Mainz is a very good understated football weekend city and should not be treated as filler",
      "Easy to combine with Frankfurt if needed, but better when it gets its own proper evening",
    ],
  },

  "red-bull-arena-leipzig": {
    stadiumKey: "red-bull-arena-leipzig",
    name: "Red Bull Arena",
    city: "Leipzig",
    country: GERMANY,
    capacity: 47800,
    opened: 2004,
    teamKeys: ["rb-leipzig"],
    airport: "Leipzig/Halle Airport (LEJ)",
    distanceFromAirportKm: 16,
    transit: [
      { label: "Leipzig Hbf", minutes: 25, note: "best main rail anchor" },
      { label: "Augustusplatz / Innenstadt", minutes: 20, note: "best city base" },
    ],
    stayAreas: [
      { area: "Innenstadt", why: "Best overall base with bars, restaurants and walkable city-break value" },
      { area: "Waldstraßenviertel", why: "Closest attractive stay area if you want easier stadium access and a smarter neighbourhood feel" },
    ],
    tips: [
      "Leipzig is one of the easiest Bundesliga cities to turn into a proper weekend and should be sold that way",
      "Stay central and treat the stadium as a short tram or walk leg rather than a separate district trip",
    ],
  },

  "millerntor-stadion": {
    stadiumKey: "millerntor-stadion",
    name: "Millerntor-Stadion",
    city: "Hamburg",
    country: GERMANY,
    capacity: 29546,
    opened: 1963,
    teamKeys: ["st-pauli"],
    airport: "Hamburg Airport (HAM)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "St. Pauli", minutes: 8, note: "closest U-Bahn anchor" },
      { label: "Landungsbrücken", minutes: 15, note: "great wider city access point" },
    ],
    stayAreas: [
      { area: "St. Pauli", why: "Best for nightlife, atmosphere and shortest matchday movement" },
      { area: "Schanzenviertel", why: "Best food, bars and strong local Hamburg feel" },
    ],
    tips: [
      "One of the strongest culture-heavy football trips in Europe, not just in Germany",
      "Excellent stadium to combine with a wider Hamburg weekend because the district itself carries the trip",
    ],
  },

  "alte-foersterei": {
    stadiumKey: "alte-foersterei",
    name: "Stadion An der Alten Försterei",
    city: "Berlin",
    country: GERMANY,
    capacity: 22012,
    opened: 1920,
    teamKeys: ["union-berlin"],
    airport: "Berlin Brandenburg Airport (BER)",
    distanceFromAirportKm: 18,
    transit: [
      { label: "Köpenick", minutes: 20, note: "best local anchor" },
      { label: "Ostkreuz", minutes: 30, note: "best wider Berlin connection hub" },
    ],
    stayAreas: [
      { area: "Friedrichshain", why: "Best blend of nightlife, bars and sensible matchday access" },
      { area: "Alexanderplatz / Mitte", why: "Best practical central Berlin base for first-time visitors" },
    ],
    tips: [
      "Traditional-feel ground with far more character than most modern arenas, so arrival timing matters",
      "Stay central Berlin, not in Köpenick, unless you deliberately want a very local and quieter trip",
    ],
  },

  "mhp-arena": {
    stadiumKey: "mhp-arena",
    name: "MHP Arena",
    city: "Stuttgart",
    country: GERMANY,
    capacity: 60058,
    opened: 1933,
    teamKeys: ["vfb-stuttgart"],
    airport: "Stuttgart Airport (STR)",
    distanceFromAirportKm: 15,
    transit: [
      { label: "Bad Cannstatt", minutes: 12, note: "best local matchday rail anchor" },
      { label: "Stuttgart Hbf", minutes: 20, note: "main city rail hub" },
    ],
    stayAreas: [
      { area: "Stuttgart Mitte", why: "Best city-centre visitor base" },
      { area: "Bad Cannstatt", why: "Closest practical option with more local football-day feel" },
    ],
    tips: [
      "Strong traditional football city with easy transport and a very manageable weekend structure",
      "Good option for a straightforward Bundesliga weekend without much wasted movement",
    ],
  },

  "wohninvest-weser-stadion": {
    stadiumKey: "wohninvest-weser-stadion",
    name: "Weserstadion",
    city: "Bremen",
    country: GERMANY,
    capacity: 42100,
    opened: 1947,
    teamKeys: ["werder-bremen"],
    airport: "Bremen Airport (BRE)",
    distanceFromAirportKm: 5,
    transit: [
      { label: "Bremen Hbf", minutes: 25, note: "best rail anchor" },
      { label: "Bremen Altstadt", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best central Bremen stay and easiest city-break flow" },
      { area: "Viertel", why: "Best bars and stronger local atmosphere" },
    ],
    tips: [
      "Very solid city-break football trip thanks to compact central Bremen and the river setting",
      "Easy one for a short football weekend because airport, city and stadium all connect cleanly",
    ],
  },

  "volkswagen-arena": {
    stadiumKey: "volkswagen-arena",
    name: "Volkswagen Arena",
    city: "Wolfsburg",
    country: GERMANY,
    capacity: 28917,
    opened: 2002,
    teamKeys: ["wolfsburg"],
    airport: "Hannover Airport (HAJ)",
    distanceFromAirportKm: 90,
    transit: [
      { label: "Wolfsburg Hbf", minutes: 20, note: "best main rail anchor" },
      { label: "Autostadt", minutes: 15, note: "useful central landmark area" },
    ],
    stayAreas: [
      { area: "Wolfsburg Centre", why: "Most practical local option if keeping it simple" },
      { area: "Hannover", why: "Better broader city base if combining wider northern Germany travel" },
    ],
    tips: [
      "Functional trip rather than one of Germany’s great atmosphere-plus-city weekends",
      "Works best if paired with wider travel plans rather than oversold as a standalone flagship",
    ],
  },
};

export default bundesligaStadiums;
