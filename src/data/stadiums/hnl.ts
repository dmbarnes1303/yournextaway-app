import type { StadiumRecord } from "./types";

const CROATIA = "Croatia";

export const hnlStadiums: Record<string, StadiumRecord> = {
  "maksimir-stadium": {
    stadiumKey: "maksimir-stadium",
    name: "Maksimir Stadium",
    city: "Zagreb",
    country: CROATIA,
    capacity: 25074,
    opened: 1912,
    teamKeys: ["dinamo-zagreb", "nk-lokomotiva"],
    airport: "Zagreb Franjo Tuđman Airport (ZAG)",
    distanceFromAirportKm: 16,
    transit: [
      { label: "Maksimirska / Svetice", minutes: 8, note: "best tram approach" },
      { label: "Zagreb Main Station", minutes: 20, note: "best mainline rail hub" },
    ],
    stayAreas: [
      { area: "Lower Town", why: "Best all-round base for hotels, nightlife and tram access" },
      { area: "Maksimir", why: "Closest practical stay if stadium proximity matters most" },
    ],
    tips: [
      "Shared stadium for Dinamo Zagreb and NK Lokomotiva in the current setup",
      "Central Zagreb is usually the smarter overnight base than staying by the ground",
    ],
  },

  "stadion-poljud": {
    stadiumKey: "stadion-poljud",
    name: "Stadion Poljud",
    city: "Split",
    country: CROATIA,
    capacity: 33987,
    opened: 1979,
    teamKeys: ["hajduk-split"],
    airport: "Split Airport (SPU)",
    distanceFromAirportKm: 24,
    transit: [
      { label: "Split city centre", minutes: 20, note: "best visitor base" },
      { label: "Split Ferry Port / Bus Station", minutes: 25, note: "best wider travel hub" },
    ],
    stayAreas: [
      { area: "Old Town / Waterfront", why: "Best football-weekend base with food, bars and atmosphere" },
      { area: "Bačvice", why: "Good beach-plus-city option with easy access into town" },
    ],
    tips: [
      "One of the best stadium settings in the region and worth arriving early for",
      "Stay central in Split rather than near the ground itself",
    ],
  },

  "stadion-rujevica": {
    stadiumKey: "stadion-rujevica",
    name: "Stadion Rujevica",
    city: "Rijeka",
    country: CROATIA,
    capacity: 8279,
    opened: 2015,
    teamKeys: ["rijeka"],
    airport: "Rijeka Airport (RJK)",
    distanceFromAirportKm: 29,
    transit: [
      { label: "Rijeka city centre", minutes: 20, note: "best practical base" },
      { label: "Main bus station", minutes: 20, note: "best intercity arrival point" },
    ],
    stayAreas: [
      { area: "Rijeka City Centre", why: "Best for hotels, bars and simple pre/post-match movement" },
      { area: "Opatija", why: "Better if you want a more polished coastal stay and do not mind travelling in" },
    ],
    tips: [
      "Compact modern ground that works well as part of a Kvarner coast trip",
      "Rijeka centre is the easiest football-first base",
    ],
  },

  "gradski-stadion-koprivnica": {
    stadiumKey: "gradski-stadion-koprivnica",
    name: "Gradski stadion Ivan Kušek Apaš",
    city: "Koprivnica",
    country: CROATIA,
    capacity: 3134,
    opened: 1987,
    teamKeys: ["slaven-belupo"],
    airport: "Zagreb Franjo Tuđman Airport (ZAG)",
    distanceFromAirportKm: 108,
    transit: [
      { label: "Koprivnica station", minutes: 20, note: "best rail anchor" },
      { label: "Koprivnica centre", minutes: 15, note: "best practical local base" },
    ],
    stayAreas: [
      { area: "Koprivnica Centre", why: "Best simple overnight base close to everything important" },
      { area: "Zagreb", why: "Better if you want stronger hotel and nightlife options and are happy to travel in" },
    ],
    tips: [
      "This is a small, practical football stop rather than a glamour city break",
      "Use Zagreb as the stronger overnight base unless convenience is the only priority",
    ],
  },

  "stadion-varteks": {
    stadiumKey: "stadion-varteks",
    name: "Stadion Varteks",
    city: "Varaždin",
    country: CROATIA,
    capacity: 8800,
    opened: 1931,
    teamKeys: ["varazdin"],
    airport: "Zagreb Franjo Tuđman Airport (ZAG)",
    distanceFromAirportKm: 86,
    transit: [
      { label: "Varaždin station", minutes: 20, note: "best rail arrival point" },
      { label: "Varaždin centre", minutes: 15, note: "best stay base" },
    ],
    stayAreas: [
      { area: "Varaždin Old Town / Centre", why: "Best compact base with easy walking and nicer city feel" },
      { area: "Zagreb", why: "Better if you want a larger-city trip and travel in for the match" },
    ],
    tips: [
      "Good option for a cleaner, lower-hassle football trip",
      "Varaždin works well as a one-night stay because the centre is compact and pleasant",
    ],
  },

  "stadion-aldo-drosina": {
    stadiumKey: "stadion-aldo-drosina",
    name: "Stadion Aldo Drosina",
    city: "Pula",
    country: CROATIA,
    capacity: 9000,
    opened: 2011,
    teamKeys: ["istra-1961"],
    airport: "Pula Airport (PUY)",
    distanceFromAirportKm: 9,
    transit: [
      { label: "Pula city centre", minutes: 20, note: "best practical base" },
      { label: "Pula bus station", minutes: 20, note: "best intercity anchor" },
    ],
    stayAreas: [
      { area: "Pula Centre", why: "Best for restaurants, Roman sites and easy match travel" },
      { area: "Verudela", why: "Better if you want more of a resort-style coastal stay" },
    ],
    tips: [
      "Pula is stronger as a wider coastal trip than as a pure match-only stop",
      "Staying centrally is usually better than staying right by the stadium",
    ],
  },

  "stadion-radnik": {
    stadiumKey: "stadion-radnik",
    name: "Stadion Radnik",
    city: "Velika Gorica",
    country: CROATIA,
    capacity: 8000,
    opened: 1987,
    teamKeys: ["hnk-gorica"],
    airport: "Zagreb Franjo Tuđman Airport (ZAG)",
    distanceFromAirportKm: 6,
    transit: [
      { label: "Velika Gorica centre", minutes: 15, note: "closest practical base" },
      { label: "Zagreb Main Station", minutes: 30, note: "best wider city hub" },
    ],
    stayAreas: [
      { area: "Zagreb", why: "Best all-round option for nightlife, hotels and a better city-break feel" },
      { area: "Velika Gorica", why: "Closest simple stay, especially for airport convenience" },
    ],
    tips: [
      "Very easy airport-linked ground",
      "Most visitors will have a better trip staying in Zagreb and travelling in",
    ],
  },

  "opus-arena": {
    stadiumKey: "opus-arena",
    name: "Opus Arena",
    city: "Osijek",
    country: CROATIA,
    capacity: 13005,
    opened: 2023,
    teamKeys: ["osijek"],
    airport: "Osijek Airport (OSI)",
    distanceFromAirportKm: 18,
    transit: [
      { label: "Osijek centre", minutes: 20, note: "best practical base" },
      { label: "Osijek railway / bus area", minutes: 20, note: "best intercity anchor" },
    ],
    stayAreas: [
      { area: "Tvrđa / Centre", why: "Best for atmosphere, food and easy city exploring" },
      { area: "Near the Drava riverfront", why: "Good for a cleaner city-break feel" },
    ],
    tips: [
      "One of the strongest modern stadium experiences in Croatia",
      "Osijek is worth treating as a proper city stop rather than just a day trip",
    ],
  },

  "stadion-borovo-naselje": {
    stadiumKey: "stadion-borovo-naselje",
    name: "Gradski stadion u Borovu naselju",
    city: "Vukovar",
    country: CROATIA,
    capacity: 6000,
    opened: 1987,
    teamKeys: ["vukovar-1991"],
    airport: "Osijek Airport (OSI)",
    distanceFromAirportKm: 34,
    transit: [
      { label: "Vukovar centre", minutes: 15, note: "best practical local base" },
      { label: "Vukovar bus station", minutes: 15, note: "best intercity arrival point" },
    ],
    stayAreas: [
      { area: "Vukovar Centre", why: "Best simple base for the stadium and town" },
      { area: "Osijek", why: "Better if you want more hotel and nightlife choice and are happy to travel in" },
    ],
    tips: [
      "Football-first stop rather than a polished major-city stadium trip",
      "Use Osijek as the stronger wider base if you want more around the match",
    ],
  },
};

export default hnlStadiums;
