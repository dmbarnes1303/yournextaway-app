import type { StadiumRecord } from "./types";

const SERBIA = "Serbia";

export const superLigaSerbiaStadiums: Record<string, StadiumRecord> = {
  "rajko-mitic-stadium": {
    stadiumKey: "rajko-mitic-stadium",
    name: "Rajko Mitić Stadium",
    city: "Belgrade",
    country: SERBIA,
    capacity: 51755,
    opened: 1963,
    teamKeys: ["red-star-belgrade"],
    airport: "Belgrade Nikola Tesla Airport (BEG)",
    distanceFromAirportKm: 20,
    transit: [
      { label: "Autokomanda", minutes: 15, note: "best wider city connection point" },
      { label: "Belgrade Centre (Prokop)", minutes: 20, note: "best main rail anchor" },
    ],
    stayAreas: [
      { area: "Vračar", why: "Best all-round base for food, bars and easier stadium access" },
      { area: "Stari Grad", why: "Best city-break base with nightlife and central sightseeing" },
    ],
    tips: [
      "One of the biggest and most intense stadium experiences in the region",
      "Arrive early for major games because access and exit flows can be slow",
    ],
  },

  "partizan-stadium": {
    stadiumKey: "partizan-stadium",
    name: "Partizan Stadium",
    city: "Belgrade",
    country: SERBIA,
    capacity: 29775,
    opened: 1949,
    teamKeys: ["partizan"],
    airport: "Belgrade Nikola Tesla Airport (BEG)",
    distanceFromAirportKm: 19,
    transit: [
      { label: "Autokomanda", minutes: 12, note: "best practical public-transport anchor" },
      { label: "Belgrade Centre (Prokop)", minutes: 20, note: "best rail arrival point" },
    ],
    stayAreas: [
      { area: "Vračar", why: "Best balance of central feel and stadium convenience" },
      { area: "Stari Grad", why: "Better if you want a fuller Belgrade city-break base" },
    ],
    tips: [
      "The Partizan and Red Star stadium areas are close, so derby days need extra planning",
      "Stay central rather than by the ground unless convenience is your only priority",
    ],
  },

  "karadjordje-stadium": {
    stadiumKey: "karadjordje-stadium",
    name: "Karađorđe Stadium",
    city: "Novi Sad",
    country: SERBIA,
    capacity: 14458,
    opened: 1924,
    teamKeys: ["vojvodina"],
    airport: "Belgrade Nikola Tesla Airport (BEG)",
    distanceFromAirportKm: 86,
    transit: [
      { label: "Novi Sad centre", minutes: 15, note: "best practical base" },
      { label: "Novi Sad railway station", minutes: 20, note: "best intercity anchor" },
    ],
    stayAreas: [
      { area: "Stari Grad / Centre", why: "Best overall base for restaurants, bars and walkability" },
      { area: "Danube / Petrovaradin side", why: "Better for a more scenic stay" },
    ],
    tips: [
      "Novi Sad is one of the easiest and nicest football weekend cities in the region",
      "Treat this as a proper city-break stop, not just a match detour",
    ],
  },

  "sc-mladost-stadium": {
    stadiumKey: "sc-mladost-stadium",
    name: "SC Mladost Stadium",
    city: "Pančevo",
    country: SERBIA,
    capacity: 2300,
    opened: 1970,
    teamKeys: ["zeleznicar-pancevo"],
    airport: "Belgrade Nikola Tesla Airport (BEG)",
    distanceFromAirportKm: 42,
    transit: [
      { label: "Pančevo centre", minutes: 15, note: "best local anchor" },
      { label: "Belgrade centre", minutes: 45, note: "better wider stay base" },
    ],
    stayAreas: [
      { area: "Belgrade", why: "Best overall option for hotels, nightlife and broader trip quality" },
      { area: "Pančevo Centre", why: "Closest practical base if you want simplicity" },
    ],
    tips: [
      "Small-ground trip, so build the wider weekend around Belgrade if staying overnight",
      "This is convenience-first, not a glamour football stop",
    ],
  },

  "novi-pazar-city-stadium": {
    stadiumKey: "novi-pazar-city-stadium",
    name: "Novi Pazar City Stadium",
    city: "Novi Pazar",
    country: SERBIA,
    capacity: 10000,
    opened: 1960,
    teamKeys: ["novi-pazar"],
    airport: "Niš Constantine the Great Airport (INI)",
    distanceFromAirportKm: 168,
    transit: [
      { label: "Novi Pazar centre", minutes: 10, note: "best practical base" },
    ],
    stayAreas: [
      { area: "Novi Pazar Centre", why: "Best simple base with everything close by" },
    ],
    tips: [
      "Longer-travel domestic stop, so plan transport first and football second",
      "Best treated as a focused football trip rather than a casual add-on",
    ],
  },

  "surdulica-city-stadium": {
    stadiumKey: "surdulica-city-stadium",
    name: "Surdulica City Stadium",
    city: "Surdulica",
    country: SERBIA,
    capacity: 3312,
    opened: 1969,
    teamKeys: ["radnik-surdulica"],
    airport: "Niš Constantine the Great Airport (INI)",
    distanceFromAirportKm: 103,
    transit: [
      { label: "Surdulica centre", minutes: 10, note: "best local anchor" },
      { label: "Vranje", minutes: 30, note: "better nearby service base" },
    ],
    stayAreas: [
      { area: "Vranje", why: "Better practical overnight base than relying on Surdulica alone" },
      { area: "Surdulica", why: "Closest option for pure match convenience" },
    ],
    tips: [
      "This is a small, football-first stop",
      "Sort transport and lodging early because options are thinner than in the big cities",
    ],
  },

  "cukaricki-stadium": {
    stadiumKey: "cukaricki-stadium",
    name: "Čukarički Stadium",
    city: "Belgrade",
    country: SERBIA,
    capacity: 4070,
    opened: 1977,
    teamKeys: ["cukaricki"],
    airport: "Belgrade Nikola Tesla Airport (BEG)",
    distanceFromAirportKm: 19,
    transit: [
      { label: "Banovo Brdo", minutes: 10, note: "best local anchor" },
      { label: "Stari Grad", minutes: 25, note: "best wider city base" },
    ],
    stayAreas: [
      { area: "Stari Grad", why: "Best overall city-break base" },
      { area: "Vračar", why: "Good central stay with easier access across Belgrade" },
    ],
    tips: [
      "Small venue, so build the trip around Belgrade rather than the stadium area itself",
      "Central Belgrade is the right overnight answer for most users",
    ],
  },

  "cair-stadium": {
    stadiumKey: "cair-stadium",
    name: "Čair Stadium",
    city: "Niš",
    country: SERBIA,
    capacity: 18151,
    opened: 1963,
    teamKeys: ["radnicki-nis"],
    airport: "Niš Constantine the Great Airport (INI)",
    distanceFromAirportKm: 5,
    transit: [
      { label: "Niš centre", minutes: 15, note: "best practical visitor base" },
      { label: "Niš bus / rail area", minutes: 20, note: "best travel anchor" },
    ],
    stayAreas: [
      { area: "Niš Centre", why: "Best overall base for food, hotels and simple match travel" },
    ],
    tips: [
      "Very easy airport-linked city trip by regional standards",
      "Niš works well as a compact one-night football break",
    ],
  },

  "kraljevica-stadium": {
    stadiumKey: "kraljevica-stadium",
    name: "Kraljevica Stadium",
    city: "Zaječar",
    country: SERBIA,
    capacity: 8168,
    opened: 2023,
    teamKeys: ["ofk-beograd"],
    airport: "Niš Constantine the Great Airport (INI)",
    distanceFromAirportKm: 104,
    transit: [
      { label: "Zaječar centre", minutes: 10, note: "best local anchor" },
    ],
    stayAreas: [
      { area: "Zaječar Centre", why: "Closest simple overnight option" },
      { area: "Belgrade", why: "Only better if you are building a wider trip and can handle the travel" },
    ],
    tips: [
      "OFK Beograd are listed as using Kraljevica temporarily this season",
      "Do not assume a normal Belgrade home setup here",
    ],
  },

  "cika-daca-stadium": {
    stadiumKey: "cika-daca-stadium",
    name: "Čika Dača Stadium",
    city: "Kragujevac",
    country: SERBIA,
    capacity: 15100,
    opened: 1957,
    teamKeys: ["radnicki-1923"],
    airport: "Belgrade Nikola Tesla Airport (BEG)",
    distanceFromAirportKm: 145,
    transit: [
      { label: "Kragujevac centre", minutes: 15, note: "best practical base" },
    ],
    stayAreas: [
      { area: "Kragujevac Centre", why: "Best simple base for the stadium and city essentials" },
    ],
    tips: [
      "Straightforward football stop with fewer complications than Belgrade",
      "Best as a simple overnight or focused match trip",
    ],
  },

  "tsc-arena": {
    stadiumKey: "tsc-arena",
    name: "TSC Arena",
    city: "Bačka Topola",
    country: SERBIA,
    capacity: 4500,
    opened: 2021,
    teamKeys: ["tsc-backa-topola"],
    airport: "Belgrade Nikola Tesla Airport (BEG)",
    distanceFromAirportKm: 113,
    transit: [
      { label: "Bačka Topola centre", minutes: 10, note: "best local base" },
      { label: "Subotica", minutes: 35, note: "better nearby stay base" },
    ],
    stayAreas: [
      { area: "Subotica", why: "Better for hotel choice and a nicer wider trip" },
      { area: "Bačka Topola", why: "Closest if convenience matters most" },
    ],
    tips: [
      "Small modern stadium, but not a major-city trip",
      "Subotica is often the stronger overnight base",
    ],
  },

  "lagator-stadium": {
    stadiumKey: "lagator-stadium",
    name: "Lagator Stadium",
    city: "Loznica",
    country: SERBIA,
    capacity: 8030,
    opened: 2023,
    teamKeys: ["imt"],
    airport: "Belgrade Nikola Tesla Airport (BEG)",
    distanceFromAirportKm: 139,
    transit: [
      { label: "Loznica centre", minutes: 10, note: "best local anchor" },
    ],
    stayAreas: [
      { area: "Loznica Centre", why: "Best practical base if doing the trip simply" },
    ],
    tips: [
      "IMT are listed as using Lagator Stadium this season",
      "Check home venue carefully before travel because temporary arrangements can change faster than normal",
    ],
  },

  "stadion-kraj-moravice": {
    stadiumKey: "stadion-kraj-moravice",
    name: "Stadion kraj Moravice",
    city: "Ivanjica",
    country: SERBIA,
    capacity: 5000,
    opened: 1978,
    teamKeys: ["javor"],
    airport: "Belgrade Nikola Tesla Airport (BEG)",
    distanceFromAirportKm: 193,
    transit: [
      { label: "Ivanjica centre", minutes: 10, note: "best local base" },
      { label: "Čačak", minutes: 45, note: "better nearby service hub" },
    ],
    stayAreas: [
      { area: "Ivanjica", why: "Best for pure match convenience" },
      { area: "Čačak", why: "Better if you want more accommodation options" },
    ],
    tips: [
      "Longer-travel inland football stop",
      "Plan logistics early because this is not a casual late-booking city break",
    ],
  },

  "src-mr-rados-milovanovic": {
    stadiumKey: "src-mr-rados-milovanovic",
    name: "SRC Mladost MR Radoš Milovanović",
    city: "Lučani",
    country: SERBIA,
    capacity: 3600,
    opened: 1972,
    teamKeys: ["mladost-lucani"],
    airport: "Belgrade Nikola Tesla Airport (BEG)",
    distanceFromAirportKm: 161,
    transit: [
      { label: "Lučani centre", minutes: 10, note: "best local anchor" },
      { label: "Čačak", minutes: 30, note: "better nearby overnight base" },
    ],
    stayAreas: [
      { area: "Čačak", why: "Better practical base with more services and hotel choice" },
      { area: "Lučani", why: "Closest for simplicity only" },
    ],
    tips: [
      "Very small-ground trip",
      "This is football-first and logistics matter more than polish",
    ],
  },

  "subotica-city-stadium": {
    stadiumKey: "subotica-city-stadium",
    name: "Subotica City Stadium",
    city: "Subotica",
    country: SERBIA,
    capacity: 13000,
    opened: 1945,
    teamKeys: ["spartak-subotica"],
    airport: "Belgrade Nikola Tesla Airport (BEG)",
    distanceFromAirportKm: 186,
    transit: [
      { label: "Subotica centre", minutes: 15, note: "best overall base" },
      { label: "Subotica station", minutes: 20, note: "best travel anchor" },
    ],
    stayAreas: [
      { area: "Subotica Centre", why: "Best for architecture, food and easy local movement" },
    ],
    tips: [
      "Subotica is a better city stop than many of the smaller league locations",
      "Worth doing as a proper overnight rather than a rushed day trip",
    ],
  },

  "mladost-stadium-krusevac": {
    stadiumKey: "mladost-stadium-krusevac",
    name: "Mladost Stadium",
    city: "Kruševac",
    country: SERBIA,
    capacity: 10331,
    opened: 1976,
    teamKeys: ["napredak"],
    airport: "Niš Constantine the Great Airport (INI)",
    distanceFromAirportKm: 74,
    transit: [
      { label: "Kruševac centre", minutes: 15, note: "best practical base" },
    ],
    stayAreas: [
      { area: "Kruševac Centre", why: "Best simple base close to everything important" },
    ],
    tips: [
      "More functional than glamorous as a football trip",
      "Good if you want a cleaner lower-hassle stop rather than a major-city weekend",
    ],
  },
};

export default superLigaSerbiaStadiums;
