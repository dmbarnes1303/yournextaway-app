import type { StadiumRecord } from "./types";

const ROMANIA = "Romania";

export const superLigaStadiums: Record<string, StadiumRecord> = {
  "stadionul-ion-oblemenko": {
    stadiumKey: "stadionul-ion-oblemenko",
    name: "Stadionul Ion Oblemenco",
    city: "Craiova",
    country: ROMANIA,
    capacity: 30929,
    opened: 2017,
    teamKeys: ["universitatea-craiova"],
    airport: "Craiova Airport (CRA)",
    distanceFromAirportKm: 7,
    transit: [
      { label: "Craiova city centre", minutes: 15, note: "best practical visitor base" },
      { label: "Craiova railway station", minutes: 20, note: "main rail hub then taxi/bus onward" },
    ],
    stayAreas: [
      { area: "Central Craiova", why: "Best base for hotels, restaurants and easy match travel" },
      { area: "Old Town", why: "Best for nightlife and atmosphere before and after the match" },
    ],
    tips: [
      "One of the strongest modern stadium experiences in Romania outside Bucharest.",
      "Stay central rather than near the ground unless price is exceptional.",
    ],
  },

  "superbet-arena-giulesti": {
    stadiumKey: "superbet-arena-giulesti",
    name: "Superbet Arena Giulești",
    city: "Bucharest",
    country: ROMANIA,
    capacity: 14047,
    opened: 2022,
    teamKeys: ["rapid-bucuresti"],
    airport: "Bucharest Henri Coandă Airport (OTP)",
    distanceFromAirportKm: 16,
    transit: [
      { label: "Basarab", minutes: 12, note: "best wider rail / metro interchange" },
      { label: "Gara de Nord", minutes: 20, note: "mainline rail hub" },
    ],
    stayAreas: [
      { area: "Gara de Nord / Basarab", why: "Best practical option for transport and quick stadium access" },
      { area: "Old Town / Universitate", why: "Best for nightlife while staying central" },
    ],
    tips: [
      "Compact modern ground with a stronger atmosphere than the size alone suggests.",
      "Central Bucharest is usually the better overnight base than forcing a stay near the stadium.",
    ],
  },

  "cluj-arena": {
    stadiumKey: "cluj-arena",
    name: "Cluj Arena",
    city: "Cluj-Napoca",
    country: ROMANIA,
    capacity: 30335,
    opened: 2011,
    teamKeys: ["u-cluj"],
    airport: "Cluj-Napoca Airport (CLJ)",
    distanceFromAirportKm: 10,
    transit: [
      { label: "Cluj-Napoca city centre", minutes: 15, note: "best visitor base" },
      { label: "Cluj-Napoca railway station", minutes: 20, note: "best rail arrival point" },
    ],
    stayAreas: [
      { area: "Old Town / Centre", why: "Best all-round base for food, bars and walking access" },
      { area: "Central Cluj", why: "Best hotel concentration and easiest transport setup" },
    ],
    tips: [
      "Excellent city-break stadium because Cluj adds a lot beyond the football itself.",
      "One of the easiest Romanian away-style city trips to build around a weekend.",
    ],
  },

  "stadionul-arcul-de-triumf": {
    stadiumKey: "stadionul-arcul-de-triumf",
    name: "Stadionul Arcul de Triumf",
    city: "Bucharest",
    country: ROMANIA,
    capacity: 8207,
    opened: 2021,
    teamKeys: ["dinamo-bucuresti"],
    airport: "Bucharest Henri Coandă Airport (OTP)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "Piața Presei / northern Bucharest transport links", minutes: 12, note: "best practical local access" },
      { label: "Aviatorilor / Victoriei area", minutes: 20, note: "best wider city base" },
    ],
    stayAreas: [
      { area: "Victoriei", why: "Best central-north Bucharest base with strong transport options" },
      { area: "Old Town / Universitate", why: "Best nightlife-heavy central option" },
    ],
    tips: [
      "Treat Bucharest as the main trip anchor rather than planning around this smaller venue area.",
      "Useful stadium for a football weekend because the city gives you plenty beyond the match.",
    ],
  },

  "stadionul-dr-constantin-radulescu": {
    stadiumKey: "stadionul-dr-constantin-radulescu",
    name: "Stadionul Dr. Constantin Rădulescu",
    city: "Cluj-Napoca",
    country: ROMANIA,
    capacity: 23500,
    opened: 1973,
    teamKeys: ["cfr-cluj"],
    airport: "Cluj-Napoca Airport (CLJ)",
    distanceFromAirportKm: 9,
    transit: [
      { label: "Cluj-Napoca city centre", minutes: 15, note: "best practical stay base" },
      { label: "Cluj-Napoca railway station", minutes: 12, note: "handy for rail arrivals" },
    ],
    stayAreas: [
      { area: "Central Cluj", why: "Best hotel and nightlife base" },
      { area: "Old Town", why: "Best for restaurants and walkable city-break feel" },
    ],
    tips: [
      "Cluj is strong enough that central stays beat trying to stay beside the ground.",
      "Good football trip when paired with a full city weekend rather than a pure match in/out.",
    ],
  },

  "stadionul-orasenesc-mioveni": {
    stadiumKey: "stadionul-orasenesc-mioveni",
    name: "Stadionul Orășenesc Mioveni",
    city: "Mioveni",
    country: ROMANIA,
    capacity: 10000,
    opened: 2000,
    teamKeys: ["arges-pitesti"],
    airport: "Bucharest Henri Coandă Airport (OTP)",
    distanceFromAirportKm: 115,
    transit: [
      { label: "Pitești city centre", minutes: 25, note: "best nearby urban base" },
      { label: "Mioveni town centre", minutes: 10, note: "closest simple local anchor" },
    ],
    stayAreas: [
      { area: "Pitești", why: "Best practical overnight base while the club is using Mioveni" },
      { area: "Mioveni", why: "Closest option if pure convenience matters more than atmosphere" },
    ],
    tips: [
      "This is the practical current venue choice, not the long-term glamour answer.",
      "For most visitors, staying in Pitești makes more sense than forcing a stay in Mioveni.",
    ],
  },

  "arena-nationala": {
    stadiumKey: "arena-nationala",
    name: "Arena Națională",
    city: "Bucharest",
    country: ROMANIA,
    capacity: 55634,
    opened: 2011,
    teamKeys: ["fcsb"],
    airport: "Bucharest Henri Coandă Airport (OTP)",
    distanceFromAirportKm: 18,
    transit: [
      { label: "Piața Muncii", minutes: 15, note: "best metro-led stadium approach" },
      { label: "Old Town / Universitate", minutes: 25, note: "best central visitor base" },
    ],
    stayAreas: [
      { area: "Old Town", why: "Best nightlife and city-break energy" },
      { area: "Universitate / Unirii", why: "Best all-round central location for transport and hotels" },
    ],
    tips: [
      "This is the biggest Romanian football-stage experience and feels more event-scale than most league venues.",
      "Central Bucharest is the right base; don’t over-prioritise staying near the stadium.",
    ],
  },

  "arena-francisc-neuman": {
    stadiumKey: "arena-francisc-neuman",
    name: "Arena Francisc Neuman",
    city: "Arad",
    country: ROMANIA,
    capacity: 12584,
    opened: 2020,
    teamKeys: ["uta-arad"],
    airport: "Timișoara Airport (TSR)",
    distanceFromAirportKm: 52,
    transit: [
      { label: "Arad city centre", minutes: 15, note: "best practical base" },
      { label: "Arad railway station", minutes: 20, note: "best rail anchor" },
    ],
    stayAreas: [
      { area: "Central Arad", why: "Best for food, hotels and simple match travel" },
      { area: "Near the centre / theatre quarter", why: "Best for a more pleasant short city stay" },
    ],
    tips: [
      "Clean, modern ground and one of the easier straightforward football stops in the league.",
      "Good one-night trip rather than a long luxury city break.",
    ],
  },

  "stadionul-municipal-botosani": {
    stadiumKey: "stadionul-municipal-botosani",
    name: "Stadionul Municipal",
    city: "Botoșani",
    country: ROMANIA,
    capacity: 7782,
    opened: 1987,
    teamKeys: ["botosani"],
    airport: "Suceava Airport (SCV)",
    distanceFromAirportKm: 32,
    transit: [
      { label: "Botoșani city centre", minutes: 12, note: "best local base" },
      { label: "Suceava", minutes: 45, note: "useful if arriving wider-region first" },
    ],
    stayAreas: [
      { area: "Central Botoșani", why: "Best practical base for hotels and short journeys" },
      { area: "Near the old centre", why: "Better if you want a bit more atmosphere" },
    ],
    tips: [
      "This is more of a football-first stop than a destination city break.",
      "Keep the trip simple and central rather than overthinking logistics.",
    ],
  },

  "stadionul-otelul": {
    stadiumKey: "stadionul-otelul",
    name: "Stadionul Oțelul",
    city: "Galați",
    country: ROMANIA,
    capacity: 13500,
    opened: 1982,
    teamKeys: ["otelul-galati"],
    airport: "Bucharest Henri Coandă Airport (OTP)",
    distanceFromAirportKm: 240,
    transit: [
      { label: "Galați city centre", minutes: 15, note: "best practical base" },
      { label: "Brăila / regional transfer routes", minutes: 35, note: "useful wider-area reference point" },
    ],
    stayAreas: [
      { area: "Central Galați", why: "Best for simple logistics, food and hotels" },
      { area: "Danube-front central area", why: "Best if you want a slightly nicer city feel" },
    ],
    tips: [
      "Longer-haul domestic trip by Romanian standards, so plan transport early.",
      "More of a committed football trip than a polished fly-in city break.",
    ],
  },

  "stadionul-central-academia-hagi": {
    stadiumKey: "stadionul-central-academia-hagi",
    name: "Academia Hagi Stadium",
    city: "Ovidiu",
    country: ROMANIA,
    capacity: 4500,
    opened: 2021,
    teamKeys: ["farul-constanta"],
    airport: "Constanța Airport (CND)",
    distanceFromAirportKm: 20,
    transit: [
      { label: "Constanța city centre", minutes: 25, note: "best real visitor base" },
      { label: "Mamaia", minutes: 20, note: "best resort-style stay option in season" },
    ],
    stayAreas: [
      { area: "Constanța", why: "Best overall base for transport, food and city access" },
      { area: "Mamaia", why: "Best if you want a Black Sea weekend around the football" },
    ],
    tips: [
      "Small-capacity venue, so this trip is more about the wider coast + football mix.",
      "Constanța or Mamaia makes more sense than trying to stay in Ovidiu itself.",
    ],
  },

  "stadionul-ilie-oana": {
    stadiumKey: "stadionul-ilie-oana",
    name: "Stadionul Ilie Oană",
    city: "Ploiești",
    country: ROMANIA,
    capacity: 15073,
    opened: 2011,
    teamKeys: ["petrolul-ploiesti"],
    airport: "Bucharest Henri Coandă Airport (OTP)",
    distanceFromAirportKm: 45,
    transit: [
      { label: "Ploiești city centre", minutes: 15, note: "best practical base" },
      { label: "Ploiești Vest / rail access", minutes: 20, note: "useful wider transport anchor" },
    ],
    stayAreas: [
      { area: "Central Ploiești", why: "Best for hotels and easy stadium access" },
      { area: "North Ploiești", why: "Useful if road access matters more than city feel" },
    ],
    tips: [
      "Straightforward football trip, but not one to romanticise as a big city-break destination.",
      "Usually easiest done as a simple overnighter or strong day trip from Bucharest side.",
    ],
  },

  "stadionul-municipal-miercurea-ciuc": {
    stadiumKey: "stadionul-municipal-miercurea-ciuc",
    name: "Stadionul Municipal",
    city: "Miercurea Ciuc",
    country: ROMANIA,
    capacity: 4000,
    opened: 2016,
    teamKeys: ["csikszereda"],
    airport: "Bacău Airport (BCM)",
    distanceFromAirportKm: 85,
    transit: [
      { label: "Miercurea Ciuc centre", minutes: 10, note: "closest practical town base" },
      { label: "Miercurea Ciuc station", minutes: 15, note: "best rail reference point" },
    ],
    stayAreas: [
      { area: "Central Miercurea Ciuc", why: "Best practical overnight base" },
      { area: "Near the station", why: "Best if rail convenience matters most" },
    ],
    tips: [
      "This is a niche football trip with much more of a local feel than the major Romanian venues.",
      "Keep planning simple and realistic; this is not a slick metro-city weekend.",
    ],
  },

  "stadionul-1-mai-slobozia": {
    stadiumKey: "stadionul-1-mai-slobozia",
    name: "Stadionul 1 Mai",
    city: "Slobozia",
    country: ROMANIA,
    capacity: 7000,
    opened: 1970,
    teamKeys: ["unirea-slobozia"],
    airport: "Bucharest Henri Coandă Airport (OTP)",
    distanceFromAirportKm: 120,
    transit: [
      { label: "Slobozia centre", minutes: 10, note: "best local anchor" },
      { label: "Bucharest", minutes: 90, note: "most likely wider arrival city" },
    ],
    stayAreas: [
      { area: "Slobozia centre", why: "Best if you want match convenience with minimal fuss" },
      { area: "Bucharest", why: "Better for hotel choice if you are prepared for the transfer" },
    ],
    tips: [
      "Pure practicality matters here more than glamour.",
      "This is the kind of trip where keeping logistics tight matters more than trying to make it fancy.",
    ],
  },

  "stadionul-municipal-sibiu": {
    stadiumKey: "stadionul-municipal-sibiu",
    name: "Stadionul Municipal Sibiu",
    city: "Sibiu",
    country: ROMANIA,
    capacity: 12363,
    opened: 2022,
    teamKeys: ["hermannstadt"],
    airport: "Sibiu Airport (SBZ)",
    distanceFromAirportKm: 5,
    transit: [
      { label: "Sibiu Old Town", minutes: 15, note: "best visitor base" },
      { label: "Sibiu railway station", minutes: 20, note: "main rail anchor" },
    ],
    stayAreas: [
      { area: "Old Town", why: "Best football-plus-city-break base in Sibiu" },
      { area: "Central Sibiu", why: "Best overall for hotels and easy access" },
    ],
    tips: [
      "One of the stronger Romanian football weekends because Sibiu is genuinely attractive beyond the match.",
      "Old Town stays are the obvious smart move unless price goes silly.",
    ],
  },

  "clinceni-arena": {
    stadiumKey: "clinceni-arena",
    name: "Clinceni Arena",
    city: "Clinceni",
    country: ROMANIA,
    capacity: 4500,
    opened: 2011,
    teamKeys: ["metaloglobus"],
    airport: "Bucharest Henri Coandă Airport (OTP)",
    distanceFromAirportKm: 28,
    transit: [
      { label: "West Bucharest", minutes: 25, note: "best practical city-side approach" },
      { label: "Old Town / central Bucharest", minutes: 40, note: "best visitor stay base" },
    ],
    stayAreas: [
      { area: "Central Bucharest", why: "Best by far for hotels, nightlife and transport" },
      { area: "West Bucharest", why: "Useful only if you want shorter matchday travel" },
    ],
    tips: [
      "Treat this as a Bucharest trip first, then a stadium journey second.",
      "There is no good reason to build your whole stay around Clinceni itself.",
    ],
  },
};

export default superLigaStadiums;
