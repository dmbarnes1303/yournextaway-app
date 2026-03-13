// src/data/cityImages.ts

export type CityImageRecord = {
  cityKey: string;
  city: string;
  country?: string;
  imageUrl: string;
  aliases?: string[];
};

export type CityImageResolution = {
  imageUrl: string;
  matchType: "city" | "country" | "fallback";
  cityKey?: string | null;
  countryKey?: string | null;
};

function stripDiacritics(input: string): string {
  try {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return input;
  }
}

export function normalizeCityKey(input: string): string {
  return stripDiacritics(String(input ?? ""))
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeCountryKey(input: string): string {
  return normalizeCityKey(input);
}

export const CITY_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80";

const countryImageFallbacks: Record<string, string> = {
  england:
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80",
  scotland:
    "https://images.unsplash.com/photo-1506377585622-bedcbb027afc?auto=format&fit=crop&w=1600&q=80",
  spain:
    "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1600&q=80",
  italy:
    "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1600&q=80",
  germany:
    "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1600&q=80",
  france:
    "https://images.unsplash.com/photo-1502602898536-47ad22581b52?auto=format&fit=crop&w=1600&q=80",
  portugal:
    "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1600&q=80",
  netherlands:
    "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1600&q=80",
  belgium:
    "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=80",
  austria:
    "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1600&q=80",
  switzerland:
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  denmark:
    "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=80",
  turkey:
    "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80",
  greece:
    "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1600&q=80",
  "czech-republic":
    "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1600&q=80",
  poland:
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
  monaco:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
};

const cityImages: Record<string, CityImageRecord> = {
  // England
  london: {
    cityKey: "london",
    city: "London",
    country: "England",
    imageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80",
  },
  manchester: {
    cityKey: "manchester",
    city: "Manchester",
    country: "England",
    imageUrl:
      "https://images.unsplash.com/photo-1515586838455-8f8f940d6853?auto=format&fit=crop&w=1600&q=80",
  },
  liverpool: {
    cityKey: "liverpool",
    city: "Liverpool",
    country: "England",
    imageUrl:
      "https://images.unsplash.com/photo-1505765050516-f72dcac9c60d?auto=format&fit=crop&w=1600&q=80",
  },
  birmingham: {
    cityKey: "birmingham",
    city: "Birmingham",
    country: "England",
    imageUrl:
      "https://images.unsplash.com/photo-1593766827228-8737b4534aa6?auto=format&fit=crop&w=1600&q=80",
  },
  brighton: {
    cityKey: "brighton",
    city: "Brighton",
    country: "England",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  },
  bournemouth: {
    cityKey: "bournemouth",
    city: "Bournemouth",
    country: "England",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
  },
  leeds: {
    cityKey: "leeds",
    city: "Leeds",
    country: "England",
    imageUrl:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80",
  },
  "newcastle-upon-tyne": {
    cityKey: "newcastle-upon-tyne",
    city: "Newcastle upon Tyne",
    country: "England",
    aliases: ["newcastle"],
    imageUrl:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
  },
  nottingham: {
    cityKey: "nottingham",
    city: "Nottingham",
    country: "England",
    imageUrl:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80",
  },
  wolverhampton: {
    cityKey: "wolverhampton",
    city: "Wolverhampton",
    country: "England",
    imageUrl:
      "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1600&q=80",
  },

  // Scotland
  glasgow: {
    cityKey: "glasgow",
    city: "Glasgow",
    country: "Scotland",
    imageUrl:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
  },
  edinburgh: {
    cityKey: "edinburgh",
    city: "Edinburgh",
    country: "Scotland",
    imageUrl:
      "https://images.unsplash.com/photo-1506377585622-bedcbb027afc?auto=format&fit=crop&w=1600&q=80",
  },
  aberdeen: {
    cityKey: "aberdeen",
    city: "Aberdeen",
    country: "Scotland",
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
  },

  // Spain
  madrid: {
    cityKey: "madrid",
    city: "Madrid",
    country: "Spain",
    imageUrl:
      "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1600&q=80",
  },
  barcelona: {
    cityKey: "barcelona",
    city: "Barcelona",
    country: "Spain",
    imageUrl:
      "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1600&q=80",
  },
  valencia: {
    cityKey: "valencia",
    city: "Valencia",
    country: "Spain",
    imageUrl:
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1600&q=80",
  },
  seville: {
    cityKey: "seville",
    city: "Seville",
    country: "Spain",
    aliases: ["sevilla"],
    imageUrl:
      "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1600&q=80",
  },
  bilbao: {
    cityKey: "bilbao",
    city: "Bilbao",
    country: "Spain",
    imageUrl:
      "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?auto=format&fit=crop&w=1600&q=80",
  },
  girona: {
    cityKey: "girona",
    city: "Girona",
    country: "Spain",
    imageUrl:
      "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=1600&q=80",
  },
  "san-sebastian": {
    cityKey: "san-sebastian",
    city: "San Sebastián",
    country: "Spain",
    aliases: ["san-sebastian-donostia", "donostia"],
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
  },
  palma: {
    cityKey: "palma",
    city: "Palma",
    country: "Spain",
    aliases: ["palma-de-mallorca"],
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  },
  "vitoria-gasteiz": {
    cityKey: "vitoria-gasteiz",
    city: "Vitoria-Gasteiz",
    country: "Spain",
    aliases: ["vitoria"],
    imageUrl:
      "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1600&q=80",
  },

  // Italy
  rome: {
    cityKey: "rome",
    city: "Rome",
    country: "Italy",
    aliases: ["roma"],
    imageUrl:
      "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1600&q=80",
  },
  milan: {
    cityKey: "milan",
    city: "Milan",
    country: "Italy",
    aliases: ["milano"],
    imageUrl:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
  },
  turin: {
    cityKey: "turin",
    city: "Turin",
    country: "Italy",
    aliases: ["torino"],
    imageUrl:
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1600&q=80",
  },
  naples: {
    cityKey: "naples",
    city: "Naples",
    country: "Italy",
    aliases: ["napoli"],
    imageUrl:
      "https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&w=1600&q=80",
  },
  bologna: {
    cityKey: "bologna",
    city: "Bologna",
    country: "Italy",
    imageUrl:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1600&q=80",
  },
  florence: {
    cityKey: "florence",
    city: "Florence",
    country: "Italy",
    aliases: ["firenze"],
    imageUrl:
      "https://images.unsplash.com/photo-1543429776-2782fcf1d548?auto=format&fit=crop&w=1600&q=80",
  },
  genoa: {
    cityKey: "genoa",
    city: "Genoa",
    country: "Italy",
    aliases: ["genova"],
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
  },
  como: {
    cityKey: "como",
    city: "Como",
    country: "Italy",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  },
  bergamo: {
    cityKey: "bergamo",
    city: "Bergamo",
    country: "Italy",
    imageUrl:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
  },
  verona: {
    cityKey: "verona",
    city: "Verona",
    country: "Italy",
    imageUrl:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
  },
  udine: {
    cityKey: "udine",
    city: "Udine",
    country: "Italy",
    imageUrl:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80",
  },

  // Germany
  berlin: {
    cityKey: "berlin",
    city: "Berlin",
    country: "Germany",
    imageUrl:
      "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1600&q=80",
  },
  munich: {
    cityKey: "munich",
    city: "Munich",
    country: "Germany",
    aliases: ["munchen", "muenchen"],
    imageUrl:
      "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1600&q=80",
  },
  dortmund: {
    cityKey: "dortmund",
    city: "Dortmund",
    country: "Germany",
    imageUrl:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1600&q=80",
  },
  hamburg: {
    cityKey: "hamburg",
    city: "Hamburg",
    country: "Germany",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  },
  frankfurt: {
    cityKey: "frankfurt",
    city: "Frankfurt",
    country: "Germany",
    imageUrl:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80",
  },
  cologne: {
    cityKey: "cologne",
    city: "Cologne",
    country: "Germany",
    aliases: ["koln", "koeln"],
    imageUrl:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&q=80",
  },
  leipzig: {
    cityKey: "leipzig",
    city: "Leipzig",
    country: "Germany",
    imageUrl:
      "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1600&q=80",
  },
  stuttgart: {
    cityKey: "stuttgart",
    city: "Stuttgart",
    country: "Germany",
    imageUrl:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80",
  },
  bremen: {
    cityKey: "bremen",
    city: "Bremen",
    country: "Germany",
    imageUrl:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
  },

  // France
  paris: {
    cityKey: "paris",
    city: "Paris",
    country: "France",
    imageUrl:
      "https://images.unsplash.com/photo-1502602898536-47ad22581b52?auto=format&fit=crop&w=1600&q=80",
  },
  marseille: {
    cityKey: "marseille",
    city: "Marseille",
    country: "France",
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
  },
  lyon: {
    cityKey: "lyon",
    city: "Lyon",
    country: "France",
    imageUrl:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1600&q=80",
  },
  nice: {
    cityKey: "nice",
    city: "Nice",
    country: "France",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  },
  lille: {
    cityKey: "lille",
    city: "Lille",
    country: "France",
    imageUrl:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
  },
  strasbourg: {
    cityKey: "strasbourg",
    city: "Strasbourg",
    country: "France",
    imageUrl:
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1600&q=80",
  },
  toulouse: {
    cityKey: "toulouse",
    city: "Toulouse",
    country: "France",
    imageUrl:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1600&q=80",
  },
  monaco: {
    cityKey: "monaco",
    city: "Monaco",
    country: "Monaco",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  },

  // Portugal
  lisbon: {
    cityKey: "lisbon",
    city: "Lisbon",
    country: "Portugal",
    aliases: ["lisboa"],
    imageUrl:
      "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1600&q=80",
  },
  porto: {
    cityKey: "porto",
    city: "Porto",
    country: "Portugal",
    imageUrl:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1600&q=80",
  },
  braga: {
    cityKey: "braga",
    city: "Braga",
    country: "Portugal",
    imageUrl:
      "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1600&q=80",
  },
  faro: {
    cityKey: "faro",
    city: "Faro",
    country: "Portugal",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  },
  funchal: {
    cityKey: "funchal",
    city: "Funchal",
    country: "Portugal",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  },

  // Netherlands
  amsterdam: {
    cityKey: "amsterdam",
    city: "Amsterdam",
    country: "Netherlands",
    imageUrl:
      "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1600&q=80",
  },
  rotterdam: {
    cityKey: "rotterdam",
    city: "Rotterdam",
    country: "Netherlands",
    imageUrl:
      "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80",
  },
  utrecht: {
    cityKey: "utrecht",
    city: "Utrecht",
    country: "Netherlands",
    imageUrl:
      "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80",
  },
  eindhoven: {
    cityKey: "eindhoven",
    city: "Eindhoven",
    country: "Netherlands",
    imageUrl:
      "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80",
  },
  alkmaar: {
    cityKey: "alkmaar",
    city: "Alkmaar",
    country: "Netherlands",
    imageUrl:
      "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80",
  },

  // Belgium
  brussels: {
    cityKey: "brussels",
    city: "Brussels",
    country: "Belgium",
    imageUrl:
      "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=80",
  },
  antwerp: {
    cityKey: "antwerp",
    city: "Antwerp",
    country: "Belgium",
    imageUrl:
      "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=80",
  },
  bruges: {
    cityKey: "bruges",
    city: "Bruges",
    country: "Belgium",
    imageUrl:
      "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=80",
  },
  ghent: {
    cityKey: "ghent",
    city: "Ghent",
    country: "Belgium",
    imageUrl:
      "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=80",
  },
  liege: {
    cityKey: "liege",
    city: "Liège",
    country: "Belgium",
    imageUrl:
      "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=80",
  },

  // Austria
  vienna: {
    cityKey: "vienna",
    city: "Vienna",
    country: "Austria",
    aliases: ["wien"],
    imageUrl:
      "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1600&q=80",
  },
  salzburg: {
    cityKey: "salzburg",
    city: "Salzburg",
    country: "Austria",
    imageUrl:
      "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1600&q=80",
  },
  graz: {
    cityKey: "graz",
    city: "Graz",
    country: "Austria",
    imageUrl:
      "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1600&q=80",
  },
  innsbruck: {
    cityKey: "innsbruck",
    city: "Innsbruck",
    country: "Austria",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  },
  linz: {
    cityKey: "linz",
    city: "Linz",
    country: "Austria",
    imageUrl:
      "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1600&q=80",
  },

  // Switzerland
  zurich: {
    cityKey: "zurich",
    city: "Zurich",
    country: "Switzerland",
    aliases: ["zuerich"],
    imageUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  },
  basel: {
    cityKey: "basel",
    city: "Basel",
    country: "Switzerland",
    imageUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  },
  bern: {
    cityKey: "bern",
    city: "Bern",
    country: "Switzerland",
    imageUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  },
  geneva: {
    cityKey: "geneva",
    city: "Geneva",
    country: "Switzerland",
    imageUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  },
  lausanne: {
    cityKey: "lausanne",
    city: "Lausanne",
    country: "Switzerland",
    imageUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  },
  lugano: {
    cityKey: "lugano",
    city: "Lugano",
    country: "Switzerland",
    imageUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  },

  // Denmark
  copenhagen: {
    cityKey: "copenhagen",
    city: "Copenhagen",
    country: "Denmark",
    aliases: ["kobenhavn"],
    imageUrl:
      "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=80",
  },
  aarhus: {
    cityKey: "aarhus",
    city: "Aarhus",
    country: "Denmark",
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
  },

  // Turkey
  istanbul: {
    cityKey: "istanbul",
    city: "Istanbul",
    country: "Turkey",
    imageUrl:
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80",
  },
  ankara: {
    cityKey: "ankara",
    city: "Ankara",
    country: "Turkey",
    imageUrl:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1600&q=80",
  },
  antalya: {
    cityKey: "antalya",
    city: "Antalya",
    country: "Turkey",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  },

  // Greece
  athens: {
    cityKey: "athens",
    city: "Athens",
    country: "Greece",
    imageUrl:
      "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1600&q=80",
  },
  thessaloniki: {
    cityKey: "thessaloniki",
    city: "Thessaloniki",
    country: "Greece",
    imageUrl:
      "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1600&q=80",
  },
  piraeus: {
    cityKey: "piraeus",
    city: "Piraeus",
    country: "Greece",
    imageUrl:
      "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1600&q=80",
  },

  // Czech Republic
  prague: {
    cityKey: "prague",
    city: "Prague",
    country: "Czech Republic",
    aliases: ["praha"],
    imageUrl:
      "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1600&q=80",
  },
  plzen: {
    cityKey: "plzen",
    city: "Plzeň",
    country: "Czech Republic",
    aliases: ["plzen"],
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
  },

  // Poland
  warsaw: {
    cityKey: "warsaw",
    city: "Warsaw",
    country: "Poland",
    aliases: ["warszawa"],
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
  },
  krakow: {
    cityKey: "krakow",
    city: "Kraków",
    country: "Poland",
    aliases: ["krakow", "kraków"],
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
  },
  gdansk: {
    cityKey: "gdansk",
    city: "Gdańsk",
    country: "Poland",
    aliases: ["gdansk", "gdańsk"],
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
  },
};

const aliasMap: Record<string, string> = {};

Object.values(cityImages).forEach((entry) => {
  const canonical = normalizeCityKey(entry.cityKey);

  aliasMap[canonical] = canonical;
  aliasMap[normalizeCityKey(entry.city)] = canonical;

  (entry.aliases ?? []).forEach((alias) => {
    aliasMap[normalizeCityKey(alias)] = canonical;
  });
});

export function getCountryImageUrl(
  countryInput?: string | null,
  fallback: string = CITY_IMAGE_FALLBACK
): string {
  const key = normalizeCountryKey(String(countryInput ?? ""));
  return countryImageFallbacks[key] ?? fallback;
}

export function getCityImageRecord(cityInput?: string | null): CityImageRecord | null {
  const key = normalizeCityKey(String(cityInput ?? ""));
  if (!key) return null;

  const canonical = aliasMap[key] ?? key;
  return cityImages[canonical] ?? null;
}

export function resolveCityImage(
  cityInput?: string | null,
  countryInput?: string | null,
  fallback: string = CITY_IMAGE_FALLBACK
): CityImageResolution {
  const cityRecord = getCityImageRecord(cityInput);

  if (cityRecord) {
    return {
      imageUrl: cityRecord.imageUrl,
      matchType: "city",
      cityKey: cityRecord.cityKey,
      countryKey: cityRecord.country ? normalizeCountryKey(cityRecord.country) : null,
    };
  }

  const countryKey = normalizeCountryKey(String(countryInput ?? ""));
  const countryImage = getCountryImageUrl(countryKey, "");

  if (countryImage) {
    return {
      imageUrl: countryImage,
      matchType: "country",
      cityKey: null,
      countryKey: countryKey || null,
    };
  }

  return {
    imageUrl: fallback,
    matchType: "fallback",
    cityKey: null,
    countryKey: null,
  };
}

export function getCityImageUrl(
  cityInput?: string | null,
  fallback: string = CITY_IMAGE_FALLBACK,
  countryInput?: string | null
): string {
  return resolveCityImage(cityInput, countryInput, fallback).imageUrl;
}

export function hasCityImage(cityInput?: string | null): boolean {
  return !!getCityImageRecord(cityInput);
}

export function hasExactCityImage(cityInput?: string | null): boolean {
  return !!getCityImageRecord(cityInput);
}

export function getAllCityImages(): CityImageRecord[] {
  return Object.values(cityImages);
}

export default cityImages;
