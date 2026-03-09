import type { StadiumRecord } from "./types";

const SLOVAKIA = "Slovakia";

export const superLigaSlovakiaStadiums: Record<string, StadiumRecord> = {

  "tehelne-pole": {
    stadiumKey: "tehelne-pole",
    name: "Tehelné pole",
    city: "Bratislava",
    country: SLOVAKIA,
    capacity: 22500,
    opened: 2019,
    teamKeys: ["slovan-bratislava"],
    airport: "Bratislava Airport (BTS)",
    distanceFromAirportKm: 9,
    transit: [
      { label: "Tehelné pole tram stop", minutes: 5, note: "closest tram access" },
      { label: "Bratislava Main Station", minutes: 12, note: "best rail hub" }
    ],
    stayAreas: [
      { area: "Old Town (Staré Mesto)", why: "Best for nightlife, food and sightseeing" },
      { area: "Nové Mesto", why: "Closest practical stay to the stadium" }
    ],
    tips: [
      "One of the newest stadiums in Central Europe",
      "Best to stay in Old Town and take tram to the stadium"
    ]
  },

  "mol-arena": {
    stadiumKey: "mol-arena",
    name: "MOL Aréna",
    city: "Dunajská Streda",
    country: SLOVAKIA,
    capacity: 12700,
    opened: 2019,
    teamKeys: ["dunajska-streda"],
    airport: "Bratislava Airport (BTS)",
    distanceFromAirportKm: 48,
    transit: [
      { label: "Dunajská Streda station", minutes: 15, note: "main rail access" }
    ],
    stayAreas: [
      { area: "Dunajská Streda Centre", why: "Closest practical option" },
      { area: "Bratislava", why: "Better nightlife and hotels" }
    ],
    tips: [
      "DAC have one of the strongest atmospheres in Slovakia",
      "Most travellers base in Bratislava and travel in"
    ]
  },

  "stadion-pod-dubnom": {
    stadiumKey: "stadion-pod-dubnom",
    name: "Štadión pod Dubňom",
    city: "Žilina",
    country: SLOVAKIA,
    capacity: 10280,
    opened: 1941,
    teamKeys: ["zilina"],
    airport: "Žilina Airport (ILZ)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "Žilina Station", minutes: 15, note: "main rail hub" }
    ],
    stayAreas: [
      { area: "Žilina Centre", why: "Best hotels and nightlife" }
    ],
    tips: [
      "Žilina produces some of the best young players in Slovakia",
      "Compact stadium close to the city centre"
    ]
  },

  "anton-malatinseho-stadium": {
    stadiumKey: "anton-malatinseho-stadium",
    name: "Anton Malatinský Stadium",
    city: "Trnava",
    country: SLOVAKIA,
    capacity: 18159,
    opened: 2015,
    teamKeys: ["spartak-trnava"],
    airport: "Bratislava Airport (BTS)",
    distanceFromAirportKm: 47,
    transit: [
      { label: "Trnava Station", minutes: 15, note: "rail hub" }
    ],
    stayAreas: [
      { area: "Trnava Old Town", why: "Best bars and restaurants" },
      { area: "Bratislava", why: "Better overall travel base" }
    ],
    tips: [
      "Trnava fans create one of the best atmospheres in Slovakia",
      "Short train ride from Bratislava"
    ]
  },

  "zelpo-arena": {
    stadiumKey: "zelpo-arena",
    name: "ZELPO Aréna",
    city: "Podbrezová",
    country: SLOVAKIA,
    capacity: 4000,
    opened: 1959,
    teamKeys: ["podbrezova"],
    airport: "Poprad–Tatry Airport (TAT)",
    distanceFromAirportKm: 83,
    transit: [
      { label: "Podbrezová station", minutes: 10, note: "local rail access" }
    ],
    stayAreas: [
      { area: "Banská Bystrica", why: "Better hotels and nightlife" }
    ],
    tips: [
      "Very small ground in a scenic mountain region",
      "Often paired with trips to Banská Bystrica"
    ]
  },

  "mestsky-futbalovy-stadion-michalovce": {
    stadiumKey: "mestsky-futbalovy-stadion-michalovce",
    name: "Mestský futbalový štadión Michalovce",
    city: "Michalovce",
    country: SLOVAKIA,
    capacity: 4400,
    teamKeys: ["michalovce"],
    airport: "Košice Airport (KSC)",
    distanceFromAirportKm: 58,
    transit: [
      { label: "Michalovce station", minutes: 10, note: "best rail access" }
    ],
    stayAreas: [
      { area: "Košice", why: "Better travel base and nightlife" }
    ],
    tips: [
      "Small eastern Slovakia club",
      "Most travellers stay in Košice"
    ]
  },

  "kosicka-futbalova-arena": {
    stadiumKey: "kosicka-futbalova-arena",
    name: "Košická Futbalová Aréna",
    city: "Košice",
    country: SLOVAKIA,
    capacity: 12555,
    opened: 2022,
    teamKeys: ["fc-kosice"],
    airport: "Košice Airport (KSC)",
    distanceFromAirportKm: 6,
    transit: [
      { label: "Košice Station", minutes: 15, note: "main transport hub" }
    ],
    stayAreas: [
      { area: "Košice Old Town", why: "Best hotels and nightlife" }
    ],
    tips: [
      "One of the newest stadiums in the region",
      "Košice is Slovakia's second largest city"
    ]
  },

  "vion-arena": {
    stadiumKey: "vion-arena",
    name: "ViOn Aréna",
    city: "Zlaté Moravce",
    country: SLOVAKIA,
    capacity: 4000,
    teamKeys: ["komarno"],
    airport: "Bratislava Airport (BTS)",
    distanceFromAirportKm: 135,
    transit: [
      { label: "Zlaté Moravce station", minutes: 10, note: "local rail access" }
    ],
    stayAreas: [
      { area: "Nitra", why: "Better overnight base nearby" }
    ],
    tips: [
      "Temporary ground currently used by Komárno"
    ]
  },

  "stadion-mfk-ruzomberok": {
    stadiumKey: "stadion-mfk-ruzomberok",
    name: "Štadión pod Čebraťom",
    city: "Ružomberok",
    country: SLOVAKIA,
    capacity: 4876,
    teamKeys: ["ruzomberok"],
    airport: "Poprad–Tatry Airport (TAT)",
    distanceFromAirportKm: 75,
    transit: [
      { label: "Ružomberok station", minutes: 15, note: "main rail hub" }
    ],
    stayAreas: [
      { area: "Ružomberok Centre", why: "Best practical option" }
    ],
    tips: [
      "Scenic mountain setting"
    ]
  },

  "sihoť-stadium": {
    stadiumKey: "sihoť-stadium",
    name: "Štadión Sihoť",
    city: "Trenčín",
    country: SLOVAKIA,
    capacity: 6366,
    teamKeys: ["trencin"],
    airport: "Piešťany Airport (PZY)",
    distanceFromAirportKm: 43,
    transit: [
      { label: "Trenčín station", minutes: 15, note: "rail hub" }
    ],
    stayAreas: [
      { area: "Trenčín Old Town", why: "Best restaurants and hotels" }
    ],
    tips: [
      "Stadium sits under the famous Trenčín castle"
    ]
  },

  "futbal-tatran-arena": {
    stadiumKey: "futbal-tatran-arena",
    name: "Futbal Tatran Arena",
    city: "Prešov",
    country: SLOVAKIA,
    capacity: 6500,
    teamKeys: ["tatran-presov"],
    airport: "Košice Airport (KSC)",
    distanceFromAirportKm: 45,
    transit: [
      { label: "Prešov station", minutes: 15, note: "rail hub" }
    ],
    stayAreas: [
      { area: "Prešov Centre", why: "Best simple base" }
    ],
    tips: [
      "New stadium opened recently"
    ]
  },

  "mestsky-stadion-skalica": {
    stadiumKey: "mestsky-stadion-skalica",
    name: "Mestský štadión Skalica",
    city: "Skalica",
    country: SLOVAKIA,
    capacity: 2500,
    teamKeys: ["skalica"],
    airport: "Bratislava Airport (BTS)",
    distanceFromAirportKm: 95,
    transit: [
      { label: "Skalica station", minutes: 15, note: "local rail access" }
    ],
    stayAreas: [
      { area: "Skalica Centre", why: "Closest base" },
      { area: "Brno", why: "Better hotels and nightlife across the border" }
    ],
    tips: [
      "Small ground near the Czech border"
    ]
  }

};

export default superLigaSlovakiaStadiums;
