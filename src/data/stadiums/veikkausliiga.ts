// src/data/stadiums/veikkausliiga.ts
import type { StadiumRecord } from "./types";

const FINLAND = "Finland";

export const veikkausliigaStadiums: Record<string, StadiumRecord> = {
  "raatti-stadium": {
    stadiumKey: "raatti-stadium",
    name: "Raatti Stadium",
    city: "Oulu",
    country: FINLAND,
    capacity: 4392,
    opened: 1953,
    teamKeys: ["ac-oulu"],
    airport: "Oulu Airport (OUL)",
    distanceFromAirportKm: 15,
    transit: [
      { label: "Oulu city centre", minutes: 12, note: "best practical base" },
      { label: "Oulu railway station", minutes: 20, note: "best rail hub" },
    ],
    stayAreas: [
      { area: "City Centre", why: "Best overall base for hotels, food and easy access to the ground" },
      { area: "Torinranta / Market Square", why: "Best if you want a more scenic central stay" },
    ],
    tips: [
      "Compact stadium trip, so keep it simple and stay central.",
      "This is a practical football stop rather than a glam city-break stadium.",
    ],
  },

  "veritas-stadion": {
    stadiumKey: "veritas-stadion",
    name: "Veritas Stadion",
    city: "Turku",
    country: FINLAND,
    capacity: 9072,
    opened: 1952,
    teamKeys: ["inter-turku", "tps"],
    airport: "Turku Airport (TKU)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "Turku city centre", minutes: 20, note: "best visitor base" },
      { label: "Turku railway station", minutes: 25, note: "best rail arrival point" },
    ],
    stayAreas: [
      { area: "Turku City Centre", why: "Best all-round base for hotels, bars and transport" },
      { area: "Riverside / Aura", why: "Best weekend-break feel with restaurants and nightlife" },
    ],
    tips: [
      "Shared stadium, so build the trip around central Turku, not the ground itself.",
      "Turku works well as a proper overnight football city break.",
    ],
  },

  "lahti-stadium": {
    stadiumKey: "lahti-stadium",
    name: "Lahti Stadium",
    city: "Lahti",
    country: FINLAND,
    capacity: 7465,
    opened: 1981,
    teamKeys: ["fc-lahti"],
    airport: "Helsinki Airport (HEL)",
    distanceFromAirportKm: 98,
    transit: [
      { label: "Lahti railway station", minutes: 20, note: "best mainline access" },
      { label: "Lahti city centre", minutes: 15, note: "best practical base" },
    ],
    stayAreas: [
      { area: "Lahti City Centre", why: "Best for hotels, food and straightforward match travel" },
      { area: "Station area", why: "Best if train convenience matters most" },
    ],
    tips: [
      "Simple rail-friendly trip if you base yourself centrally.",
      "This is more of a clean practical football stop than a flashy destination.",
    ],
  },

  "project-liv-arena": {
    stadiumKey: "project-liv-arena",
    name: "Project Liv Arena",
    city: "Pietarsaari",
    country: FINLAND,
    capacity: 3616,
    opened: 2025,
    teamKeys: ["ff-jaro"],
    airport: "Kokkola-Pietarsaari Airport (KOK)",
    distanceFromAirportKm: 31,
    transit: [
      { label: "Pietarsaari centre", minutes: 10, note: "best local base" },
      { label: "Jakobstad travel centre", minutes: 15, note: "best practical transport anchor" },
    ],
    stayAreas: [
      { area: "Pietarsaari Centre", why: "Best practical overnight base close to the stadium" },
      { area: "Kokkola", why: "Better if you want a larger nearby base and more hotel choice" },
    ],
    tips: [
      "Modern compact ground, but the wider trip is still more football-first than city-break luxury.",
      "Keep logistics simple and do not overbuild this one.",
    ],
  },

  "bolt-arena": {
    stadiumKey: "bolt-arena",
    name: "Bolt Arena",
    city: "Helsinki",
    country: FINLAND,
    capacity: 10770,
    opened: 2000,
    teamKeys: ["hjk"],
    airport: "Helsinki Airport (HEL)",
    distanceFromAirportKm: 19,
    transit: [
      { label: "Pasila", minutes: 15, note: "best wider rail interchange" },
      { label: "Helsinki Central", minutes: 20, note: "best mainline city base" },
    ],
    stayAreas: [
      { area: "Helsinki City Centre", why: "Best all-round base for transport, nightlife and hotels" },
      { area: "Töölö / Pasila", why: "Best if you want easier stadium access" },
    ],
    tips: [
      "Helsinki is the trip; the stadium is just one part of it.",
      "Stay central unless you have a very good reason not to.",
    ],
  },

  "mustapekka-areena": {
    stadiumKey: "mustapekka-areena",
    name: "Mustapekka Areena",
    city: "Helsinki",
    country: FINLAND,
    capacity: 2700,
    opened: 1934,
    teamKeys: ["gnistan"],
    airport: "Helsinki Airport (HEL)",
    distanceFromAirportKm: 14,
    transit: [
      { label: "Oulunkylä", minutes: 10, note: "closest practical local anchor" },
      { label: "Pasila", minutes: 20, note: "best wider interchange" },
    ],
    stayAreas: [
      { area: "Helsinki City Centre", why: "Best all-round visitor base" },
      { area: "Pasila", why: "Better if you want easier access without going fully suburban" },
    ],
    tips: [
      "Small-scale ground, so this should be treated as a Helsinki trip first.",
      "Do not stay near the ground unless price is clearly better.",
    ],
  },

  "wiklof-holding-arena": {
    stadiumKey: "wiklof-holding-arena",
    name: "Wiklöf Holding Arena",
    city: "Mariehamn",
    country: FINLAND,
    capacity: 1635,
    opened: 1932,
    teamKeys: ["ifk-mariehamn"],
    airport: "Mariehamn Airport (MHQ)",
    distanceFromAirportKm: 4,
    transit: [
      { label: "Mariehamn centre", minutes: 10, note: "best simple base" },
      { label: "West Harbour", minutes: 20, note: "useful if arriving by ferry" },
    ],
    stayAreas: [
      { area: "Mariehamn Centre", why: "Best overall base because everything is compact and easy" },
      { area: "Harbour area", why: "Good if you are combining ferry travel with the match" },
    ],
    tips: [
      "One of the easiest leagues for walkable logistics once you are in the city.",
      "This is more about the island-trip experience than raw stadium scale.",
    ],
  },

  "tammelan-stadion": {
    stadiumKey: "tammelan-stadion",
    name: "Tammelan Stadion",
    city: "Tampere",
    country: FINLAND,
    capacity: 8017,
    opened: 2024,
    teamKeys: ["ilves"],
    airport: "Tampere-Pirkkala Airport (TMP)",
    distanceFromAirportKm: 18,
    transit: [
      { label: "Tampere Central Station", minutes: 10, note: "best mainline base" },
      { label: "Tammela / city centre", minutes: 10, note: "easy walkable setup" },
    ],
    stayAreas: [
      { area: "Tampere City Centre", why: "Best all-round base for hotels, bars and transport" },
      { area: "Tammela", why: "Best if you want the stadium on your doorstep" },
    ],
    tips: [
      "Excellent modern football-weekend option because the stadium is tied closely into the city.",
      "Tampere is one of the strongest overall away-trip style city breaks in the league.",
    ],
  },

  "vare-areena": {
    stadiumKey: "vare-areena",
    name: "Väre Areena",
    city: "Kuopio",
    country: FINLAND,
    capacity: 5000,
    opened: 2005,
    teamKeys: ["kups"],
    airport: "Kuopio Airport (KUO)",
    distanceFromAirportKm: 20,
    transit: [
      { label: "Kuopio city centre", minutes: 15, note: "best practical base" },
      { label: "Kuopio railway station", minutes: 20, note: "best rail anchor" },
    ],
    stayAreas: [
      { area: "Kuopio City Centre", why: "Best for hotels, restaurants and simple onward travel" },
      { area: "Harbour / market area", why: "Best if you want a more relaxed city-break feel" },
    ],
    tips: [
      "Straightforward, compact football trip with no need to overcomplicate logistics.",
      "Central Kuopio is the clear best base.",
    ],
  },

  "omasp-stadion": {
    stadiumKey: "omasp-stadion",
    name: "OmaSP Stadion",
    city: "Seinäjoki",
    country: FINLAND,
    capacity: 5900,
    opened: 2016,
    teamKeys: ["sjk"],
    airport: "Vaasa Airport (VAA)",
    distanceFromAirportKm: 76,
    transit: [
      { label: "Seinäjoki railway station", minutes: 25, note: "best mainline rail base" },
      { label: "Seinäjoki city centre", minutes: 20, note: "best practical stay base" },
    ],
    stayAreas: [
      { area: "Seinäjoki Centre", why: "Best practical option for hotels and rail access" },
      { area: "Station area", why: "Best if train convenience matters most" },
    ],
    tips: [
      "Purpose-built football trip rather than broader tourism destination.",
      "Keep the overnight simple and central.",
    ],
  },

  "lemonsoft-stadion": {
    stadiumKey: "lemonsoft-stadion",
    name: "Lemonsoft Stadion",
    city: "Vaasa",
    country: FINLAND,
    capacity: 6009,
    opened: 1936,
    teamKeys: ["vps"],
    airport: "Vaasa Airport (VAA)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "Vaasa city centre", minutes: 15, note: "best visitor base" },
      { label: "Vaasa railway station", minutes: 20, note: "best rail anchor" },
    ],
    stayAreas: [
      { area: "Vaasa Centre", why: "Best all-round base for hotels, restaurants and transport" },
      { area: "Hietalahti", why: "Closer option if stadium convenience matters most" },
    ],
    tips: [
      "Good compact football stop with simple city logistics.",
      "Central Vaasa is usually the best answer for an overnight stay.",
    ],
  },
};

export default veikkausliigaStadiums;
