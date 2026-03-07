import type { StadiumRecord } from "./types";

export const serieAStadiums: Record<string, StadiumRecord> = {
  "san-siro": {
    stadiumKey: "san-siro",
    name: "San Siro",
    city: "Milan",
    country: "Italy",
    capacity: 75817,
    opened: 1926,
    teamKeys: ["ac-milan", "inter"],
    airport: "Milan Malpensa (MXP)",
    distanceFromAirportKm: 48,
    transit: [
      { label: "San Siro Stadio (Metro)", minutes: 5 },
      { label: "Milano Centrale", minutes: 30, note: "best wider rail hub" },
    ],
    stayAreas: [
      { area: "Duomo / Centro", why: "Best all-round Milan base for a full city trip" },
      { area: "Navigli", why: "Best bars, restaurants and nightlife" },
    ],
    tips: [
      "One of Europe’s iconic football trips, even if the stadium area itself is not where you stay",
      "Central Milan is the correct base unless you only care about match proximity",
    ],
  },

  "gewiss-stadium": {
    stadiumKey: "gewiss-stadium",
    name: "Gewiss Stadium",
    city: "Bergamo",
    country: "Italy",
    capacity: 24000,
    opened: 1928,
    teamKeys: ["atalanta"],
    airport: "Milan Bergamo (BGY)",
    distanceFromAirportKm: 6,
    transit: [
      { label: "Bergamo Station", minutes: 20 },
      { label: "Città Alta / centre", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Città Alta", why: "Best atmosphere and city-break feel" },
      { area: "Lower Town / station area", why: "Best practical base for airport and rail access" },
    ],
    tips: [
      "One of the best hidden-value football weekends in Italy because Bergamo itself is excellent",
      "Very easy to combine football with a proper city break",
    ],
  },

  "stadio-olimpico": {
    stadiumKey: "stadio-olimpico",
    name: "Stadio Olimpico",
    city: "Rome",
    country: "Italy",
    capacity: 70634,
    opened: 1937,
    teamKeys: ["as-roma", "lazio"],
    airport: "Rome Fiumicino (FCO)",
    distanceFromAirportKm: 32,
    transit: [
      { label: "Ottaviano / Lepanto", minutes: 25, note: "common practical approach" },
      { label: "Roma Termini", minutes: 35, note: "best main rail hub" },
    ],
    stayAreas: [
      { area: "Centro Storico", why: "Best classic Rome city-break base" },
      { area: "Prati", why: "Best practical option for Vatican side and stadium access" },
    ],
    tips: [
      "This is one of Europe’s flagship football-city-break combinations because Rome does so much off the pitch",
      "Do not stay by the stadium unless convenience matters more than trip quality",
    ],
  },

  "stadio-dallara": {
    stadiumKey: "stadio-dallara",
    name: "Stadio Renato Dall'Ara",
    city: "Bologna",
    country: "Italy",
    capacity: 36462,
    opened: 1927,
    teamKeys: ["bologna"],
    airport: "Bologna Airport (BLQ)",
    distanceFromAirportKm: 7,
    transit: [
      { label: "Bologna Centrale", minutes: 25 },
      { label: "Centro Storico", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Centro Storico", why: "Best all-round Bologna base" },
      { area: "Quadrilatero / Piazza Maggiore", why: "Best food, bars and atmosphere" },
    ],
    tips: [
      "One of the strongest food-and-football weekend cities in Europe",
      "Central Bologna is the right base, not the stadium district",
    ],
  },

  "unipol-domus": {
    stadiumKey: "unipol-domus",
    name: "Unipol Domus",
    city: "Cagliari",
    country: "Italy",
    capacity: 16416,
    opened: 2017,
    teamKeys: ["cagliari"],
    airport: "Cagliari Elmas (CAG)",
    distanceFromAirportKm: 9,
    transit: [
      { label: "Cagliari centre", minutes: 20 },
      { label: "Marina / Castello", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Marina", why: "Best restaurants and atmosphere" },
      { area: "Castello", why: "Best historic and scenic base" },
    ],
    tips: [
      "Very good football-and-sun trip because Sardinia adds real leisure value",
      "Best as a proper weekend rather than a rushed in-and-out fixture trip",
    ],
  },

  "stadio-sinigaglia": {
    stadiumKey: "stadio-sinigaglia",
    name: "Stadio Giuseppe Sinigaglia",
    city: "Como",
    country: "Italy",
    capacity: 13602,
    opened: 1927,
    teamKeys: ["como-1907"],
    airport: "Milan Malpensa (MXP)",
    distanceFromAirportKm: 52,
    transit: [
      { label: "Como San Giovanni", minutes: 10 },
      { label: "Lakefront / centre", minutes: 10, note: "best local base" },
    ],
    stayAreas: [
      { area: "Como Centre", why: "Best all-round local base" },
      { area: "Lakefront", why: "Best scenic premium option" },
    ],
    tips: [
      "One of the most visually appealing football trips in Europe because of the lake setting",
      "A rare case where the wider destination can outshine the football itself",
    ],
  },

  "stadio-zini": {
    stadiumKey: "stadio-zini",
    name: "Stadio Giovanni Zini",
    city: "Cremona",
    country: "Italy",
    capacity: 20500,
    opened: 1919,
    teamKeys: ["cremonese"],
    airport: "Milan Linate (LIN)",
    distanceFromAirportKm: 90,
    transit: [
      { label: "Cremona Station", minutes: 20 },
      { label: "Historic centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Cremona Centre", why: "Best local practical base" },
      { area: "Milan", why: "Better wider base if combining football with a larger trip" },
    ],
    tips: [
      "More of a neat northern Italy football stop than a premium stand-alone city break",
      "Works well if folded into a broader Lombardy trip",
    ],
  },

  "stadio-franchi": {
    stadiumKey: "stadio-franchi",
    name: "Stadio Artemio Franchi",
    city: "Florence",
    country: "Italy",
    capacity: 43147,
    opened: 1931,
    teamKeys: ["fiorentina"],
    airport: "Florence Airport (FLR)",
    distanceFromAirportKm: 8,
    transit: [
      { label: "Firenze Santa Maria Novella", minutes: 25 },
      { label: "Centro Storico", minutes: 20, note: "best city-break base" },
    ],
    stayAreas: [
      { area: "Duomo / Centro Storico", why: "Best classic Florence base" },
      { area: "Santa Croce", why: "Best bars, food and atmosphere" },
    ],
    tips: [
      "One of the best football-and-city-break combinations in Italy because Florence is elite off the pitch",
      "Stay central and treat the stadium as a short local trip",
    ],
  },

  "luigi-ferraris": {
    stadiumKey: "luigi-ferraris",
    name: "Stadio Luigi Ferraris",
    city: "Genoa",
    country: "Italy",
    capacity: 36603,
    opened: 1911,
    teamKeys: ["genoa"],
    airport: "Genoa Airport (GOA)",
    distanceFromAirportKm: 10,
    transit: [
      { label: "Genova Brignole", minutes: 20 },
      { label: "Centro Storico", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Centro Storico", why: "Best atmosphere and city character" },
      { area: "Brignole / central area", why: "Best practical rail-led option" },
    ],
    tips: [
      "Strong old-school football feel in one of Italy’s more underrated historic cities",
      "Very good if you want football plus proper city character rather than polished luxury",
    ],
  },

  "stadio-bentegodi": {
    stadiumKey: "stadio-bentegodi",
    name: "Stadio Marcantonio Bentegodi",
    city: "Verona",
    country: "Italy",
    capacity: 39211,
    opened: 1963,
    teamKeys: ["hellas-verona"],
    airport: "Verona Airport (VRN)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "Verona Porta Nuova", minutes: 20 },
      { label: "City centre / Arena district", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Centro Storico", why: "Best overall Verona base" },
      { area: "Near Porta Nuova", why: "Best practical rail and airport option" },
    ],
    tips: [
      "Verona is strong enough to make this a proper city-break football trip",
      "Central Verona is where the value is, not the stadium area",
    ],
  },

  "allianz-stadium-turin": {
    stadiumKey: "allianz-stadium-turin",
    name: "Allianz Stadium",
    city: "Turin",
    country: "Italy",
    capacity: 41507,
    opened: 2011,
    teamKeys: ["juventus"],
    airport: "Turin Airport (TRN)",
    distanceFromAirportKm: 16,
    transit: [
      { label: "Porta Susa", minutes: 25 },
      { label: "Centro / Porta Nuova", minutes: 30, note: "best broader city base" },
    ],
    stayAreas: [
      { area: "Centro", why: "Best all-round Turin base" },
      { area: "Quadrilatero Romano", why: "Best bars, restaurants and local nightlife" },
    ],
    tips: [
      "Turin is one of Italy’s best understated football weekend cities",
      "Stay central Turin rather than near the stadium",
    ],
  },

  "via-del-mare": {
    stadiumKey: "via-del-mare",
    name: "Stadio Via del Mare",
    city: "Lecce",
    country: "Italy",
    capacity: 33876,
    opened: 1966,
    teamKeys: ["lecce"],
    airport: "Brindisi Airport (BDS)",
    distanceFromAirportKm: 45,
    transit: [
      { label: "Lecce Station", minutes: 25 },
      { label: "Historic centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Centro Storico", why: "Best local atmosphere and city-break quality" },
      { area: "Near station", why: "Best practical arrival/departure option" },
    ],
    tips: [
      "Excellent southern Italy football trip if you want warmth, food and architecture with the match",
      "One of the better hidden-value Serie A weekends",
    ],
  },

  "diego-armando-maradona": {
    stadiumKey: "diego-armando-maradona",
    name: "Stadio Diego Armando Maradona",
    city: "Naples",
    country: "Italy",
    capacity: 54726,
    opened: 1959,
    teamKeys: ["napoli"],
    airport: "Naples Airport (NAP)",
    distanceFromAirportKm: 11,
    transit: [
      { label: "Campi Flegrei", minutes: 10 },
      { label: "Napoli Centrale", minutes: 30, note: "best wider rail hub" },
    ],
    stayAreas: [
      { area: "Centro Storico", why: "Best atmosphere and food" },
      { area: "Chiaia", why: "Best polished stay with seafront access" },
    ],
    tips: [
      "One of Europe’s great football experiences when Napoli is full and loud",
      "Naples adds huge city-break value, but stay central rather than near the ground",
    ],
  },

  "stadio-tardini": {
    stadiumKey: "stadio-tardini",
    name: "Stadio Ennio Tardini",
    city: "Parma",
    country: "Italy",
    capacity: 27906,
    opened: 1923,
    teamKeys: ["parma"],
    airport: "Bologna Airport (BLQ)",
    distanceFromAirportKm: 95,
    transit: [
      { label: "Parma Station", minutes: 20 },
      { label: "Historic centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Centro Storico", why: "Best all-round Parma base" },
      { area: "Near station", why: "Best practical rail option" },
    ],
    tips: [
      "A very tidy food-and-football northern Italy stop",
      "Good for a one-night football trip with proper restaurant value",
    ],
  },

  "arena-garibaldi": {
    stadiumKey: "arena-garibaldi",
    name: "Arena Garibaldi",
    city: "Pisa",
    country: "Italy",
    capacity: 14869,
    opened: 1919,
    teamKeys: ["pisa"],
    airport: "Pisa Airport (PSA)",
    distanceFromAirportKm: 4,
    transit: [
      { label: "Pisa Centrale", minutes: 20 },
      { label: "City centre / Leaning Tower area", minutes: 15 },
    ],
    stayAreas: [
      { area: "Historic Centre", why: "Best local base for atmosphere and sightseeing" },
      { area: "Near station", why: "Best practical short-stay option" },
    ],
    tips: [
      "Excellent short football city because airport and centre are so easy",
      "Very good value if you want an easy in-and-out Italian away weekend",
    ],
  },

  "mapei-stadium": {
    stadiumKey: "mapei-stadium",
    name: "Mapei Stadium",
    city: "Reggio Emilia",
    country: "Italy",
    capacity: 21525,
    opened: 1995,
    teamKeys: ["sassuolo"],
    airport: "Bologna Airport (BLQ)",
    distanceFromAirportKm: 60,
    transit: [
      { label: "Reggio Emilia Station", minutes: 20 },
      { label: "Modena", minutes: 25, note: "better wider food-and-stay base" },
    ],
    stayAreas: [
      { area: "Reggio Emilia Centre", why: "Most practical local option" },
      { area: "Modena", why: "Better wider city-break base with stronger food and atmosphere" },
    ],
    tips: [
      "Works better as part of a broader Emilia-Romagna football and food trip",
      "Useful, but not one of the most glamorous stand-alone Serie A weekends",
    ],
  },

  "stadio-olimpico-grande-torino": {
    stadiumKey: "stadio-olimpico-grande-torino",
    name: "Stadio Olimpico Grande Torino",
    city: "Turin",
    country: "Italy",
    capacity: 27958,
    opened: 1933,
    teamKeys: ["torino"],
    airport: "Turin Airport (TRN)",
    distanceFromAirportKm: 22,
    transit: [
      { label: "Porta Nuova", minutes: 25 },
      { label: "Centro", minutes: 25, note: "best wider city base" },
    ],
    stayAreas: [
      { area: "Centro", why: "Best all-round Turin base" },
      { area: "San Salvario", why: "Best nightlife and local bars" },
    ],
    tips: [
      "Turin makes this a far stronger trip than the stadium area alone suggests",
      "Best as part of a full Turin weekend rather than a ground-area stay",
    ],
  },

  "stadio-friuli": {
    stadiumKey: "stadio-friuli",
    name: "Stadio Friuli",
    city: "Udine",
    country: "Italy",
    capacity: 25144,
    opened: 1976,
    teamKeys: ["udinese"],
    airport: "Trieste Airport (TRS)",
    distanceFromAirportKm: 43,
    transit: [
      { label: "Udine Station", minutes: 25 },
      { label: "City centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Udine Centre", why: "Best practical local base" },
      { area: "Trieste", why: "Better wider city-break option if combining football with regional travel" },
    ],
    tips: [
      "A useful northeastern Italy football stop rather than a glamour destination",
      "Best if combined with a broader Friuli or Trieste trip",
    ],
  },
};

export default serieAStadiums;
