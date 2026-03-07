import type { StadiumRecord } from "./types";

export const ligue1Stadiums: Record<string, StadiumRecord> = {
  "raymond-kopa": {
    stadiumKey: "raymond-kopa",
    name: "Stade Raymond Kopa",
    city: "Angers",
    country: "France",
    capacity: 19000,
    opened: 1912,
    airport: "Nantes Atlantique Airport (NTE)",
    distanceFromAirportKm: 100,
    teamKeys: ["angers"],
    transit: [
      { label: "Angers Saint-Laud", minutes: 20 },
      { label: "City centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Centre-Ville", why: "Best practical base for restaurants, bars and rail access" },
      { area: "Near Angers Saint-Laud", why: "Best option for easy arrival and departure" },
    ],
    tips: [
      "More of a neat one-night football stop than a marquee long-weekend destination",
      "Stay central Angers rather than around the ground itself",
    ],
  },

  "stade-louis-ii": {
    stadiumKey: "stade-louis-ii",
    name: "Stade Louis II",
    city: "Monaco",
    country: "France",
    capacity: 18523,
    opened: 1985,
    airport: "Nice Côte d'Azur Airport (NCE)",
    distanceFromAirportKm: 30,
    teamKeys: ["as-monaco"],
    transit: [
      { label: "Monaco-Monte-Carlo", minutes: 20 },
      { label: "Fontvieille", minutes: 10, note: "closest local area" },
    ],
    stayAreas: [
      { area: "Monaco / Monte Carlo", why: "Best premium local base if budget is not an issue" },
      { area: "Nice", why: "Much broader and often better-value city-break base" },
    ],
    tips: [
      "Better treated as a Riviera football trip than just a single-stadium visit",
      "Many visitors will get better value by staying in Nice and travelling in",
    ],
  },

  "stade-abbe-deschamps": {
    stadiumKey: "stade-abbe-deschamps",
    name: "Stade de l'Abbé-Deschamps",
    city: "Auxerre",
    country: "France",
    capacity: 23467,
    opened: 1918,
    airport: "Paris Orly Airport (ORY)",
    distanceFromAirportKm: 170,
    teamKeys: ["auxerre"],
    transit: [
      { label: "Auxerre-Saint-Gervais", minutes: 25 },
      { label: "Old town / centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Auxerre Centre", why: "Best local practical base with the nicest atmosphere" },
      { area: "Near station", why: "Best if planning a rail-led in-and-out trip" },
    ],
    tips: [
      "A more old-school football stop than a glamorous modern city break",
      "Works best as a simple overnight rather than a long luxury weekend",
    ],
  },

  "francis-le-ble": {
    stadiumKey: "francis-le-ble",
    name: "Stade Francis-Le Blé",
    city: "Brest",
    country: "France",
    capacity: 15000,
    opened: 1922,
    airport: "Brest Bretagne Airport (BES)",
    distanceFromAirportKm: 11,
    teamKeys: ["brest"],
    transit: [
      { label: "Brest Centre", minutes: 15 },
      { label: "Brest Station", minutes: 20 },
    ],
    stayAreas: [
      { area: "City Centre", why: "Best practical base for hotels, food and movement" },
      { area: "Near harbour", why: "Best scenic local option if making a weekend of it" },
    ],
    tips: [
      "A more regional football trip than a classic glamour weekend",
      "Useful if combining football with a Brittany coastal trip",
    ],
  },

  "stade-oceane": {
    stadiumKey: "stade-oceane",
    name: "Stade Océane",
    city: "Le Havre",
    country: "France",
    capacity: 25178,
    opened: 2012,
    airport: "Paris Charles de Gaulle (CDG)",
    distanceFromAirportKm: 200,
    teamKeys: ["le-havre"],
    transit: [
      { label: "Le Havre Station", minutes: 20 },
      { label: "City centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Centre-Ville", why: "Best practical base near station, restaurants and seafront access" },
      { area: "Seafront", why: "Best if you want more of the coastal-city feel" },
    ],
    tips: [
      "Best viewed as a Normandy football stop rather than a premium football-break destination",
      "Can be stronger if paired with wider Normandy travel plans",
    ],
  },

  "bollaert-delelis": {
    stadiumKey: "bollaert-delelis",
    name: "Stade Bollaert-Delelis",
    city: "Lens",
    country: "France",
    capacity: 38223,
    opened: 1933,
    airport: "Lille Airport (LIL)",
    distanceFromAirportKm: 35,
    teamKeys: ["lens"],
    transit: [
      { label: "Lens Station", minutes: 15 },
      { label: "Lille Europe / Lille Flandres", minutes: 40, note: "best wider base" },
    ],
    stayAreas: [
      { area: "Lens Centre", why: "Best local option for pure match convenience" },
      { area: "Lille Centre", why: "Much stronger city-break base with nightlife and hotels" },
    ],
    tips: [
      "One of France’s strongest atmosphere-led football trips",
      "Many visitors should stay in Lille and travel in rather than overnight in Lens",
    ],
  },

  "pierre-mauroy": {
    stadiumKey: "pierre-mauroy",
    name: "Stade Pierre-Mauroy",
    city: "Lille",
    country: "France",
    capacity: 50083,
    opened: 2012,
    airport: "Lille Airport (LIL)",
    distanceFromAirportKm: 7,
    teamKeys: ["lille"],
    transit: [
      { label: "Villeneuve-d'Ascq Hôtel de Ville", minutes: 10 },
      { label: "Lille Europe / Lille Flandres", minutes: 20, note: "best city and rail hub" },
    ],
    stayAreas: [
      { area: "Vieux-Lille", why: "Best atmosphere and food scene" },
      { area: "Lille Centre", why: "Best all-round city-break base" },
    ],
    tips: [
      "Very easy northern France football weekend with strong rail and airport access",
      "Vieux-Lille is usually the best base if you want the trip to feel premium",
    ],
  },

  "moustoir": {
    stadiumKey: "moustoir",
    name: "Stade du Moustoir",
    city: "Lorient",
    country: "France",
    capacity: 18000,
    opened: 1959,
    airport: "Lorient South Brittany Airport (LRT)",
    distanceFromAirportKm: 7,
    teamKeys: ["lorient"],
    transit: [
      { label: "Lorient Station", minutes: 20 },
      { label: "City centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Centre-Ville", why: "Best practical local base" },
      { area: "Harbour area", why: "Best if you want the more coastal-maritime feel" },
    ],
    tips: [
      "Useful small football trip if you are already travelling through Brittany",
      "Not one of the headline Ligue 1 weekends, but coherent enough for a short stay",
    ],
  },

  "groupama-stadium": {
    stadiumKey: "groupama-stadium",
    name: "Groupama Stadium",
    city: "Lyon",
    country: "France",
    capacity: 59186,
    opened: 2016,
    airport: "Lyon Saint-Exupéry Airport (LYS)",
    distanceFromAirportKm: 10,
    teamKeys: ["lyon"],
    transit: [
      { label: "Décines Grand Large", minutes: 10 },
      { label: "Lyon Part-Dieu", minutes: 25, note: "best city and rail hub" },
    ],
    stayAreas: [
      { area: "Presqu'île", why: "Best all-round Lyon city-break base" },
      { area: "Part-Dieu", why: "Best practical rail and airport-connected option" },
    ],
    tips: [
      "One of France’s best overall football-city-break combinations",
      "Stay central Lyon, not out near the stadium",
    ],
  },

  "velodrome": {
    stadiumKey: "velodrome",
    name: "Stade Vélodrome",
    city: "Marseille",
    country: "France",
    capacity: 67394,
    opened: 1937,
    airport: "Marseille Provence Airport (MRS)",
    distanceFromAirportKm: 30,
    teamKeys: ["marseille"],
    transit: [
      { label: "Rond-Point du Prado", minutes: 10 },
      { label: "Marseille Saint-Charles", minutes: 25, note: "main rail hub" },
    ],
    stayAreas: [
      { area: "Vieux-Port", why: "Best classic Marseille base" },
      { area: "Prado / Castellane", why: "Better practical option for stadium access" },
    ],
    tips: [
      "One of Europe’s best pure atmosphere stadium trips",
      "Vieux-Port is usually the right base unless you want to optimise purely for the stadium",
    ],
  },

  "saint-symphorien": {
    stadiumKey: "saint-symphorien",
    name: "Stade Saint-Symphorien",
    city: "Metz",
    country: "France",
    capacity: 30000,
    opened: 1923,
    airport: "Luxembourg Airport (LUX)",
    distanceFromAirportKm: 70,
    teamKeys: ["metz"],
    transit: [
      { label: "Metz-Ville", minutes: 20 },
      { label: "City centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Centre-Ville", why: "Best practical and attractive local base" },
      { area: "Near Metz-Ville", why: "Best option for quick rail movement" },
    ],
    tips: [
      "A good-looking smaller city and a cleaner football stop than people expect",
      "Better as a one-night football city than a long glamour weekend",
    ],
  },

  "la-beaujoire": {
    stadiumKey: "la-beaujoire",
    name: "Stade de la Beaujoire",
    city: "Nantes",
    country: "France",
    capacity: 35322,
    opened: 1984,
    airport: "Nantes Atlantique Airport (NTE)",
    distanceFromAirportKm: 15,
    teamKeys: ["nantes"],
    transit: [
      { label: "Beaujoire", minutes: 5 },
      { label: "Nantes Station / city centre", minutes: 20, note: "best broader base" },
    ],
    stayAreas: [
      { area: "Centre-Ville", why: "Best hotels, food and city atmosphere" },
      { area: "Bouffay", why: "Best bars and nightlife feel" },
    ],
    tips: [
      "Strong city-break football trip if you want a smaller French city with real life to it",
      "Central Nantes is the right base, not the stadium area",
    ],
  },

  "allianz-riviera": {
    stadiumKey: "allianz-riviera",
    name: "Allianz Riviera",
    city: "Nice",
    country: "France",
    capacity: 35624,
    opened: 2013,
    airport: "Nice Côte d'Azur Airport (NCE)",
    distanceFromAirportKm: 7,
    teamKeys: ["nice"],
    transit: [
      { label: "Saint-Isidore", minutes: 10 },
      { label: "Nice-Ville", minutes: 25, note: "best wider visitor base" },
    ],
    stayAreas: [
      { area: "Vieux Nice", why: "Best atmosphere and city-break feel" },
      { area: "Promenade des Anglais", why: "Best scenic premium base" },
    ],
    tips: [
      "One of Ligue 1’s best football-and-sun city-break combinations",
      "Stay central or by the seafront, not around the stadium",
    ],
  },

  "charlety": {
    stadiumKey: "charlety",
    name: "Stade Charléty",
    city: "Paris",
    country: "France",
    capacity: 20000,
    opened: 1939,
    airport: "Paris Orly Airport (ORY)",
    distanceFromAirportKm: 12,
    teamKeys: ["paris-fc"],
    transit: [
      { label: "Cité Universitaire", minutes: 10 },
      { label: "Denfert-Rochereau", minutes: 15, note: "best central practical hub" },
    ],
    stayAreas: [
      { area: "Latin Quarter", why: "Best left-bank city-break base" },
      { area: "Montparnasse", why: "Best practical south-side Paris base" },
    ],
    tips: [
      "This is a Paris trip first, club trip second",
      "Stay central Paris and treat the ground as a quick local journey",
    ],
  },

  "parc-des-princes": {
    stadiumKey: "parc-des-princes",
    name: "Parc des Princes",
    city: "Paris",
    country: "France",
    capacity: 47929,
    opened: 1972,
    airport: "Paris Orly Airport (ORY)",
    distanceFromAirportKm: 18,
    teamKeys: ["paris-saint-germain"],
    transit: [
      { label: "Porte de Saint-Cloud", minutes: 5 },
      { label: "Saint-Lazare / central Paris", minutes: 25, note: "best broader base" },
    ],
    stayAreas: [
      { area: "Saint-Germain-des-Prés", why: "Best polished central Paris base" },
      { area: "Opéra / Madeleine", why: "Best practical central luxury base" },
    ],
    tips: [
      "One of Europe’s marquee football-city-break combinations",
      "Central Paris is the correct base unless you are optimising only for matchday proximity",
    ],
  },

  "roazhon-park": {
    stadiumKey: "roazhon-park",
    name: "Roazhon Park",
    city: "Rennes",
    country: "France",
    capacity: 29778,
    opened: 1912,
    airport: "Rennes Airport (RNS)",
    distanceFromAirportKm: 8,
    teamKeys: ["rennes"],
    transit: [
      { label: "Rennes Station", minutes: 20 },
      { label: "City centre / République", minutes: 20 },
    ],
    stayAreas: [
      { area: "Centre Historique", why: "Best local atmosphere and bars" },
      { area: "Near Rennes Station", why: "Best practical rail-led base" },
    ],
    tips: [
      "Underrated football city with a lively centre and good trip quality",
      "Best as a central Rennes stay with the stadium as a short local journey",
    ],
  },

  "meinau": {
    stadiumKey: "meinau",
    name: "Stade de la Meinau",
    city: "Strasbourg",
    country: "France",
    capacity: 26109,
    opened: 1914,
    airport: "Strasbourg Airport (SXB)",
    distanceFromAirportKm: 18,
    teamKeys: ["strasbourg"],
    transit: [
      { label: "Krimmeri-Meinau", minutes: 10 },
      { label: "Strasbourg-Ville", minutes: 20, note: "main rail and city hub" },
    ],
    stayAreas: [
      { area: "Grande Île", why: "Best classic Strasbourg base" },
      { area: "Petite France", why: "Best scenic and high-quality city-break option" },
    ],
    tips: [
      "One of the nicest-looking football city trips in France",
      "Stay central Strasbourg and enjoy the city — the stadium is an easy tram/rail trip",
    ],
  },

  "municipal-toulouse": {
    stadiumKey: "municipal-toulouse",
    name: "Stadium de Toulouse",
    city: "Toulouse",
    country: "France",
    capacity: 33150,
    opened: 1937,
    airport: "Toulouse Blagnac Airport (TLS)",
    distanceFromAirportKm: 10,
    teamKeys: ["toulouse"],
    transit: [
      { label: "Empalot / Saint-Michel", minutes: 15 },
      { label: "Toulouse Matabiau", minutes: 25, note: "best rail hub" },
    ],
    stayAreas: [
      { area: "Centre-Ville", why: "Best all-round Toulouse base" },
      { area: "Capitole / Carmes", why: "Best bars, restaurants and city-break feel" },
    ],
    tips: [
      "Very strong southern France city-break football destination",
      "Central Toulouse is the right move rather than staying around the ground",
    ],
  },
};

export default ligue1Stadiums;
