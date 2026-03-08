import type { StadiumRecord } from "./types";

const NORWAY = "Norway";

export const eliteserienStadiums: Record<string, StadiumRecord> = {
  "aker-stadion": {
    stadiumKey: "aker-stadion",
    name: "Aker Stadion",
    city: "Molde",
    country: NORWAY,
    capacity: 11249,
    opened: 1998,
    teamKeys: ["molde"],
    airport: "Molde Airport, Årø (MOL)",
    distanceFromAirportKm: 6,
    transit: [
      { label: "Molde city centre", minutes: 15, note: "best simple walking base" },
      { label: "Molde traffic terminal", minutes: 18, note: "best public transport anchor" },
    ],
    stayAreas: [
      { area: "Molde City Centre", why: "Best overall base for hotels, food and easy stadium access" },
    ],
    tips: [
      "Compact, easy matchday city where staying central makes the most sense",
      "Very manageable football stop rather than a trip that needs heavy planning",
    ],
  },

  "arasen-stadion": {
    stadiumKey: "arasen-stadion",
    name: "Åråsen Stadion",
    city: "Lillestrøm",
    country: NORWAY,
    capacity: 12342,
    opened: 1951,
    teamKeys: ["lillestrom"],
    airport: "Oslo Airport Gardermoen (OSL)",
    distanceFromAirportKm: 31,
    transit: [
      { label: "Lillestrøm Station", minutes: 15, note: "best rail hub" },
      { label: "Oslo Central Station", minutes: 25, note: "best wider city base if staying in Oslo" },
    ],
    stayAreas: [
      { area: "Lillestrøm Centre", why: "Best practical base for match convenience" },
      { area: "Central Oslo", why: "Better hotels and nightlife if you do not mind the train in" },
    ],
    tips: [
      "Very easy rail-linked ground if you are coming via Oslo or the airport",
      "Oslo is often the better overnight base unless this is a pure football stop",
    ],
  },

  "aspmyra-stadion": {
    stadiumKey: "aspmyra-stadion",
    name: "Aspmyra Stadion",
    city: "Bodø",
    country: NORWAY,
    capacity: 8270,
    opened: 1966,
    teamKeys: ["bodo-glimt"],
    airport: "Bodø Airport (BOO)",
    distanceFromAirportKm: 2,
    transit: [
      { label: "Bodø city centre", minutes: 15, note: "best walkable base" },
      { label: "Bodø Station", minutes: 20, note: "best rail anchor" },
    ],
    stayAreas: [
      { area: "Bodø City Centre", why: "Best overall base for a simple and walkable trip" },
    ],
    tips: [
      "One of the easiest airport-to-stadium trips you will get anywhere",
      "Weather can matter a lot more here than in bigger southern-city trips",
    ],
  },

  "brann-stadion": {
    stadiumKey: "brann-stadion",
    name: "Brann Stadion",
    city: "Bergen",
    country: NORWAY,
    capacity: 17317,
    opened: 1919,
    teamKeys: ["brann"],
    airport: "Bergen Airport, Flesland (BGO)",
    distanceFromAirportKm: 17,
    transit: [
      { label: "Brann Stadion light rail stop", minutes: 4, note: "best direct local access" },
      { label: "Bergen city centre", minutes: 15, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Bergen City Centre", why: "Best all-round base for hotels, nightlife and light rail access" },
      { area: "Bryggen / Vågen", why: "Best scenic visitor area for a wider city-break feel" },
    ],
    tips: [
      "Bergen is one of the strongest overall football weekend cities in Norway",
      "Stay central and use the light rail rather than trying to stay near the stadium",
    ],
  },

  "briskeby-arena": {
    stadiumKey: "briskeby-arena",
    name: "Briskeby Arena",
    city: "Hamar",
    country: NORWAY,
    capacity: 8068,
    opened: 1936,
    teamKeys: ["hamkam"],
    airport: "Oslo Airport Gardermoen (OSL)",
    distanceFromAirportKm: 88,
    transit: [
      { label: "Hamar Station", minutes: 20, note: "best rail anchor" },
      { label: "Hamar city centre", minutes: 15, note: "best practical stay area" },
    ],
    stayAreas: [
      { area: "Hamar Centre", why: "Best simple overnight base for station access and food" },
      { area: "Central Oslo", why: "Better if you want a stronger city break and are happy to travel" },
    ],
    tips: [
      "This is a practical football stop, not a glamour trip",
      "If you want nightlife or a wider weekend, stay in Oslo and train in",
    ],
  },

  "color-line-stadion": {
    stadiumKey: "color-line-stadion",
    name: "Color Line Stadion",
    city: "Ålesund",
    country: NORWAY,
    capacity: 10778,
    opened: 2005,
    teamKeys: ["aalesund"],
    airport: "Ålesund Airport, Vigra (AES)",
    distanceFromAirportKm: 18,
    transit: [
      { label: "Ålesund city centre", minutes: 15, note: "best visitor base" },
      { label: "Ålesund bus terminal", minutes: 18, note: "best transport anchor" },
    ],
    stayAreas: [
      { area: "Ålesund Centre", why: "Best overall base for scenery, food and easy match travel" },
    ],
    tips: [
      "Ålesund is a far stronger city-break destination than many clubs at this level",
      "Good one to combine with a proper overnight rather than a rushed in-and-out trip",
    ],
  },

  "fredrikstad-stadion": {
    stadiumKey: "fredrikstad-stadion",
    name: "Fredrikstad Stadion",
    city: "Fredrikstad",
    country: NORWAY,
    capacity: 12565,
    opened: 2007,
    teamKeys: ["fredrikstad"],
    airport: "Oslo Airport Gardermoen (OSL)",
    distanceFromAirportKm: 140,
    transit: [
      { label: "Fredrikstad Station", minutes: 20, note: "best rail entry point" },
      { label: "Fredrikstad city centre", minutes: 15, note: "best practical base" },
    ],
    stayAreas: [
      { area: "Fredrikstad Centre", why: "Best simple base for the stadium and local food options" },
      { area: "Oslo", why: "Better if this is only one leg of a wider Norway trip" },
    ],
    tips: [
      "Best treated as a straightforward football stop rather than a full luxury city break",
      "Central Fredrikstad works fine if you want to keep the trip simple",
    ],
  },

  "intility-arena": {
    stadiumKey: "intility-arena",
    name: "Intility Arena",
    city: "Oslo",
    country: NORWAY,
    capacity: 16555,
    opened: 2017,
    teamKeys: ["valerenga"],
    airport: "Oslo Airport Gardermoen (OSL)",
    distanceFromAirportKm: 47,
    transit: [
      { label: "Helsfyr", minutes: 10, note: "best local metro / bus hub" },
      { label: "Oslo Central Station", minutes: 15, note: "best mainline base" },
    ],
    stayAreas: [
      { area: "Oslo City Centre", why: "Best all-round base for hotels, nightlife and public transport" },
      { area: "Grønland / Bjørvika", why: "Closer east-side option with strong food and city access" },
    ],
    tips: [
      "Oslo is one of the easiest cities in this set to build a full football weekend around",
      "Stay central and treat the ground as part of a wider city break",
    ],
  },

  "jotun-arena": {
    stadiumKey: "jotun-arena",
    name: "Jotun Arena",
    city: "Sandefjord",
    country: NORWAY,
    capacity: 6582,
    opened: 2007,
    teamKeys: ["sandefjord"],
    airport: "Sandefjord Airport Torp (TRF)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "Sandefjord Station", minutes: 20, note: "best rail anchor" },
      { label: "Sandefjord centre", minutes: 15, note: "best practical visitor base" },
    ],
    stayAreas: [
      { area: "Sandefjord Centre", why: "Best simple base for the match and local restaurants" },
    ],
    tips: [
      "Useful airport-linked football stop if you are building a practical Norway routing",
      "Not a huge-city experience, so keep expectations realistic",
    ],
  },

  "kfum-arena": {
    stadiumKey: "kfum-arena",
    name: "KFUM Arena",
    city: "Oslo",
    country: NORWAY,
    capacity: 3300,
    opened: 2007,
    teamKeys: ["kfum-oslo"],
    airport: "Oslo Airport Gardermoen (OSL)",
    distanceFromAirportKm: 50,
    transit: [
      { label: "Nationaltheatret / central Oslo", minutes: 20, note: "best wider city base" },
      { label: "Ekeberg area", minutes: 10, note: "closest local anchor" },
    ],
    stayAreas: [
      { area: "Oslo City Centre", why: "Best by far for hotels, nightlife and transport" },
      { area: "Gamlebyen / Bjørvika", why: "Good east-side option closer to the ground area" },
    ],
    tips: [
      "This is a small-scale venue, so build the trip around Oslo rather than the stadium itself",
      "Oslo central stays make far more sense than trying to stay hyper-local",
    ],
  },

  "lerkendal-stadion": {
    stadiumKey: "lerkendal-stadion",
    name: "Lerkendal Stadion",
    city: "Trondheim",
    country: NORWAY,
    capacity: 21421,
    opened: 1947,
    teamKeys: ["rosenborg"],
    airport: "Trondheim Airport Værnes (TRD)",
    distanceFromAirportKm: 32,
    transit: [
      { label: "Lerkendal Station", minutes: 8, note: "best nearby rail anchor" },
      { label: "Trondheim Central Station", minutes: 20, note: "best city base" },
    ],
    stayAreas: [
      { area: "Trondheim Centre", why: "Best overall base for hotels, nightlife and simple stadium access" },
      { area: "Bakklandet", why: "Best character area for a more memorable city stay" },
    ],
    tips: [
      "One of the better classic football-city combinations in Norway",
      "Trondheim centre is the correct base unless you have a very specific reason not to stay there",
    ],
  },

  "nordmore-stadion": {
    stadiumKey: "nordmore-stadion",
    name: "Nordmøre Stadion",
    city: "Kristiansund",
    country: NORWAY,
    capacity: 4444,
    opened: 2007,
    teamKeys: ["kristiansund"],
    airport: "Kristiansund Airport, Kvernberget (KSU)",
    distanceFromAirportKm: 8,
    transit: [
      { label: "Kristiansund centre", minutes: 15, note: "best practical stay base" },
    ],
    stayAreas: [
      { area: "Kristiansund Centre", why: "Best simple base for local food, hotels and easy onward movement" },
    ],
    tips: [
      "Small-club trip, so keep it simple and do not overbuild the plan",
      "More about the novelty and local feel than a giant matchday production",
    ],
  },

  "romssa-arena": {
    stadiumKey: "romssa-arena",
    name: "Romssa Arena",
    city: "Tromsø",
    country: NORWAY,
    capacity: 6801,
    opened: 1980,
    teamKeys: ["tromso"],
    airport: "Tromsø Airport (TOS)",
    distanceFromAirportKm: 5,
    transit: [
      { label: "Tromsø city centre", minutes: 20, note: "best visitor base" },
      { label: "Tromsø bridge / island routes", minutes: 10, note: "useful local anchor" },
    ],
    stayAreas: [
      { area: "Tromsø Centre", why: "Best all-round base for bars, restaurants and simple match transport" },
    ],
    tips: [
      "One of the most distinctive travel experiences in the whole app because the destination itself carries the trip",
      "Weather and seasonal conditions matter more here than in most leagues",
    ],
  },

  "sarpsborg-stadion": {
    stadiumKey: "sarpsborg-stadion",
    name: "Sarpsborg Stadion",
    city: "Sarpsborg",
    country: NORWAY,
    capacity: 8022,
    opened: 1948,
    teamKeys: ["sarpsborg-08"],
    airport: "Oslo Airport Gardermoen (OSL)",
    distanceFromAirportKm: 135,
    transit: [
      { label: "Sarpsborg Station", minutes: 20, note: "best rail anchor" },
      { label: "Sarpsborg centre", minutes: 15, note: "best practical base" },
    ],
    stayAreas: [
      { area: "Sarpsborg Centre", why: "Best simple base for match convenience" },
      { area: "Oslo", why: "Better if you are doing a wider Norway trip and can travel in" },
    ],
    tips: [
      "Keep this one practical and realistic",
      "More of a football stop than a glamorous city-break destination",
    ],
  },

  "sor-arena": {
    stadiumKey: "sor-arena",
    name: "Sør Arena",
    city: "Kristiansand",
    country: NORWAY,
    capacity: 14563,
    opened: 2007,
    teamKeys: ["start"],
    airport: "Kristiansand Airport, Kjevik (KRS)",
    distanceFromAirportKm: 14,
    transit: [
      { label: "Kristiansand Station", minutes: 20, note: "best rail anchor" },
      { label: "Kristiansand centre", minutes: 15, note: "best stay base" },
    ],
    stayAreas: [
      { area: "Kristiansand Centre", why: "Best overall base for a clean football city break" },
    ],
    tips: [
      "Kristiansand works better as an overnight city stop than many people assume",
      "City-centre stays are the obvious choice here",
    ],
  },

  "sr-bank-arena": {
    stadiumKey: "sr-bank-arena",
    name: "SR-Bank Arena",
    city: "Stavanger",
    country: NORWAY,
    capacity: 16300,
    opened: 2004,
    teamKeys: ["viking"],
    airport: "Stavanger Airport, Sola (SVG)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "Stavanger city centre", minutes: 20, note: "best overall visitor base" },
      { label: "Jåttåvågen Station", minutes: 8, note: "best nearby rail anchor" },
    ],
    stayAreas: [
      { area: "Stavanger Centre", why: "Best all-round base for hotels, nightlife and rail access" },
      { area: "Old Stavanger", why: "Stronger character stay if you want more atmosphere" },
    ],
    tips: [
      "Stavanger is one of the better all-round away-trip cities in Norway",
      "Stay central rather than by the ground unless price is exceptional",
    ],
  },
};

export default eliteserienStadiums;
