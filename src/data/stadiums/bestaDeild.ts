import type { StadiumRecord } from "./types";

const ICELAND = "Iceland";

export const bestaDeildStadiums: Record<string, StadiumRecord> = {
  "kopavogsvollur": {
    stadiumKey: "kopavogsvollur",
    name: "Kópavogsvöllur",
    city: "Kópavogur",
    country: ICELAND,
    capacity: 5501,
    opened: 1975,
    teamKeys: ["breidablik"],
    airport: "Keflavík International Airport (KEF)",
    distanceFromAirportKm: 45,
    transit: [
      { label: "Hamraborg", minutes: 15, note: "best wider local bus hub" },
      { label: "Central Reykjavík", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Central Reykjavík", why: "Best overall base for nightlife, hotels and day-to-day transport" },
      { area: "Kópavogur", why: "Closer and quieter if you want a simpler match-focused stay" },
    ],
    tips: [
      "Treat this as a Reykjavík-area football trip rather than a pure Kópavogur city break",
      "Central Reykjavík is usually the better overnight base unless convenience matters more than atmosphere",
    ],
  },

  "kaplakriki": {
    stadiumKey: "kaplakriki",
    name: "Kaplakriki",
    city: "Hafnarfjörður",
    country: ICELAND,
    capacity: 6450,
    opened: 1973,
    teamKeys: ["fh"],
    airport: "Keflavík International Airport (KEF)",
    distanceFromAirportKm: 40,
    transit: [
      { label: "Hafnarfjörður centre", minutes: 15, note: "best local anchor" },
      { label: "Central Reykjavík", minutes: 25, note: "best for most visitors staying overnight" },
    ],
    stayAreas: [
      { area: "Central Reykjavík", why: "Best all-round stay for hotels, food and nightlife" },
      { area: "Hafnarfjörður", why: "More convenient if you want shorter matchday travel" },
    ],
    tips: [
      "Easy to combine with a Reykjavík stay rather than basing the whole trip around Hafnarfjörður",
      "One of the more established top-flight grounds in Iceland, so it feels more purpose-built than some smaller venues",
    ],
  },

  "lambhagavollurinn": {
    stadiumKey: "lambhagavollurinn",
    name: "Lambhagavöllurinn",
    city: "Reykjavík",
    country: ICELAND,
    capacity: 1650,
    opened: 2022,
    teamKeys: ["fram"],
    airport: "Keflavík International Airport (KEF)",
    distanceFromAirportKm: 52,
    transit: [
      { label: "Mjódd", minutes: 20, note: "useful bus interchange for the eastern side of Reykjavík" },
      { label: "Central Reykjavík", minutes: 25, note: "best base for most visitors" },
    ],
    stayAreas: [
      { area: "Central Reykjavík", why: "Best hotel and nightlife base" },
      { area: "East Reykjavík", why: "Closer if you want a simpler match-first setup" },
    ],
    tips: [
      "Fram’s newer home is more practical than romantic, so build the trip around Reykjavík itself",
      "Central Reykjavík still makes more sense than trying to stay beside the ground",
    ],
  },

  "akranesvollur": {
    stadiumKey: "akranesvollur",
    name: "Akranesvöllur",
    city: "Akranes",
    country: ICELAND,
    capacity: 5550,
    opened: 1935,
    teamKeys: ["ia"],
    airport: "Keflavík International Airport (KEF)",
    distanceFromAirportKm: 72,
    transit: [
      { label: "Akranes centre", minutes: 10, note: "best local base" },
      { label: "Central Reykjavík", minutes: 55, note: "best if you want stronger nightlife and broader hotel choice" },
    ],
    stayAreas: [
      { area: "Akranes", why: "Best for a simple football-first stop" },
      { area: "Central Reykjavík", why: "Better if you want to turn it into a broader Iceland trip" },
    ],
    tips: [
      "Strong old-ground feel by Icelandic standards",
      "Akranes works for a simple overnight, but many visitors will prefer to stay in Reykjavík and travel in",
    ],
  },

  "hasteinsvollur": {
    stadiumKey: "hasteinsvollur",
    name: "Hásteinsvöllur",
    city: "Vestmannaeyjar",
    country: ICELAND,
    capacity: 3034,
    opened: 1912,
    teamKeys: ["ibv"],
    airport: "Vestmannaeyjar Airport (VEY)",
    distanceFromAirportKm: 2,
    transit: [
      { label: "Vestmannaeyjar town centre", minutes: 10, note: "best local stay anchor" },
      { label: "Herjólfsdalur / harbour area", minutes: 12, note: "practical for island arrivals" },
    ],
    stayAreas: [
      { area: "Vestmannaeyjar town centre", why: "Best for walkability, harbour access and food options" },
      { area: "Near the harbour", why: "Best if ferry logistics are central to your trip" },
    ],
    tips: [
      "This is one of the most distinctive football trips in Europe because of the island setting",
      "Do not treat it like a normal city-break stadium — transport planning matters far more here",
    ],
  },

  "greifavollurinn": {
    stadiumKey: "greifavollurinn",
    name: "Greifavöllurinn",
    city: "Akureyri",
    country: ICELAND,
    capacity: 1645,
    opened: 1911,
    teamKeys: ["ka"],
    airport: "Akureyri Airport (AEY)",
    distanceFromAirportKm: 4,
    transit: [
      { label: "Akureyri town centre", minutes: 15, note: "best overall base" },
      { label: "Akureyri Airport", minutes: 10, note: "very easy airport-to-city movement" },
    ],
    stayAreas: [
      { area: "Akureyri town centre", why: "Best for food, bars and a clean walkable base" },
      { area: "Near the harbour", why: "Better if you want the nicest short-break setting" },
    ],
    tips: [
      "Akureyri is one of the stronger non-Reykjavík football bases in Iceland",
      "A proper overnight stay makes more sense than trying to rush this as a same-day stop",
    ],
  },

  "hs-orku-vollurinn": {
    stadiumKey: "hs-orku-vollurinn",
    name: "HS Orku völlurinn",
    city: "Keflavík",
    country: ICELAND,
    capacity: 2554,
    opened: 1977,
    teamKeys: ["keflavik"],
    airport: "Keflavík International Airport (KEF)",
    distanceFromAirportKm: 5,
    transit: [
      { label: "Keflavík town centre", minutes: 15, note: "best simple local base" },
      { label: "Keflavík International Airport", minutes: 10, note: "one of the easiest airport-linked grounds in the league" },
    ],
    stayAreas: [
      { area: "Keflavík / Reykjanesbær", why: "Best for airport convenience and short transfers" },
      { area: "Central Reykjavík", why: "Better if you want nightlife and a fuller city-break experience" },
    ],
    tips: [
      "This is one of the easiest Icelandic top-flight grounds to pair with an airport stay",
      "Great for convenience, weaker for atmosphere outside matchday than central Reykjavík",
    ],
  },

  "kr-vollur": {
    stadiumKey: "kr-vollur",
    name: "KR-völlur",
    city: "Reykjavík",
    country: ICELAND,
    capacity: 2801,
    opened: 1951,
    teamKeys: ["kr-reykjavik"],
    airport: "Keflavík International Airport (KEF)",
    distanceFromAirportKm: 49,
    transit: [
      { label: "Central Reykjavík", minutes: 10, note: "best practical visitor base" },
      { label: "Vesturbær", minutes: 10, note: "closest attractive local area" },
    ],
    stayAreas: [
      { area: "Central Reykjavík", why: "Best all-round base for transport, bars and hotels" },
      { area: "Vesturbær", why: "Closest neighbourhood feel and easy access to the ground" },
    ],
    tips: [
      "Compact, old-school Reykjavík football stop",
      "Because it is so close to central Reykjavík, there is no good reason to stay far away",
    ],
  },

  "samsung-vollurinn": {
    stadiumKey: "samsung-vollurinn",
    name: "Samsung völlurinn",
    city: "Garðabær",
    country: ICELAND,
    capacity: 1292,
    opened: 1977,
    teamKeys: ["stjarnan"],
    airport: "Keflavík International Airport (KEF)",
    distanceFromAirportKm: 43,
    transit: [
      { label: "Garðabær centre", minutes: 10, note: "best local anchor" },
      { label: "Central Reykjavík", minutes: 20, note: "best overall stay base" },
    ],
    stayAreas: [
      { area: "Central Reykjavík", why: "Best for nightlife, hotels and stronger overall trip value" },
      { area: "Garðabær", why: "Simpler if you want shorter matchday travel" },
    ],
    tips: [
      "Small stadium, so think of this as a wider Reykjavík-area trip",
      "Central Reykjavík is still the stronger place to stay unless convenience is your only priority",
    ],
  },

  "vis-vollurinn": {
    stadiumKey: "vis-vollurinn",
    name: "Vís völlurinn",
    city: "Akureyri",
    country: ICELAND,
    capacity: 2984,
    opened: 2007,
    teamKeys: ["thor-akureyri"],
    airport: "Akureyri Airport (AEY)",
    distanceFromAirportKm: 4,
    transit: [
      { label: "Akureyri town centre", minutes: 15, note: "best practical base" },
      { label: "Akureyri Airport", minutes: 10, note: "simple airport access" },
    ],
    stayAreas: [
      { area: "Akureyri town centre", why: "Best for a compact football city break" },
      { area: "Near the harbour", why: "Best for a stronger scenic overnight stay" },
    ],
    tips: [
      "Good option if you want to pair football with north-Iceland travel",
      "Akureyri is compact enough that staying central is the obvious answer",
    ],
  },

  "n1-vollurinn-hlidarenda": {
    stadiumKey: "n1-vollurinn-hlidarenda",
    name: "N1-völlurinn Hlíðarenda",
    city: "Reykjavík",
    country: ICELAND,
    capacity: 2465,
    opened: 2008,
    teamKeys: ["valur"],
    airport: "Keflavík International Airport (KEF)",
    distanceFromAirportKm: 47,
    transit: [
      { label: "Hlemmur / central bus corridor", minutes: 15, note: "best central access point" },
      { label: "Central Reykjavík", minutes: 10, note: "best base overall" },
    ],
    stayAreas: [
      { area: "Central Reykjavík", why: "Best all-round base for food, bars and transport" },
      { area: "Hlíðar", why: "Closer and quieter while still near the city core" },
    ],
    tips: [
      "Easy stadium to work into a Reykjavík weekend",
      "Because the ground is close to the city core, central Reykjavík is the obvious place to stay",
    ],
  },

  "vikingsvollur": {
    stadiumKey: "vikingsvollur",
    name: "Víkingsvöllur",
    city: "Reykjavík",
    country: ICELAND,
    capacity: 1449,
    opened: 2004,
    teamKeys: ["vikingur-reykjavik"],
    airport: "Keflavík International Airport (KEF)",
    distanceFromAirportKm: 50,
    transit: [
      { label: "Mjódd", minutes: 15, note: "best bus interchange nearby" },
      { label: "Central Reykjavík", minutes: 15, note: "best stay base" },
    ],
    stayAreas: [
      { area: "Central Reykjavík", why: "Best overall for hotels, nightlife and simple match travel" },
      { area: "South-east Reykjavík", why: "Closer if you want a more practical, quieter base" },
    ],
    tips: [
      "Compact modern-feel Reykjavík ground rather than a huge arena experience",
      "Still best treated as part of a Reykjavík trip, not a separate destination on its own",
    ],
  },
};

export default bestaDeildStadiums;
