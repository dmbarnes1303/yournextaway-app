import type { StadiumRecord } from "./types";

const czechFirstLeagueStadiums: Record<string, StadiumRecord> = {
  "epet-arena": {
    stadiumKey: "epet-arena",
    name: "epet Arena",
    city: "Prague",
    country: "Czech Republic",
    capacity: 19000,
    opened: 1917,
    airport: "Václav Havel Airport Prague (PRG)",
    distanceFromAirportKm: 15,
    teamKeys: ["sparta-prague"],
    transit: [
      { label: "Hradčanská", minutes: 15 },
      { label: "Praha hlavní nádraží", minutes: 25, note: "best main rail hub" },
    ],
    stayAreas: [
      { area: "Old Town", why: "Best all-round Prague visitor base" },
      { area: "Malá Strana / Hradčany", why: "Best scenic area and useful west-side location" },
    ],
    tips: [
      "One of the strongest football atmospheres in the country",
      "Prague city centre is the correct base, not the immediate stadium area",
    ],
  },

  "fortuna-arena-prague": {
    stadiumKey: "fortuna-arena-prague",
    name: "Fortuna Arena",
    city: "Prague",
    country: "Czech Republic",
    capacity: 21000,
    opened: 2008,
    airport: "Václav Havel Airport Prague (PRG)",
    distanceFromAirportKm: 22,
    teamKeys: ["slavia-prague"],
    transit: [
      { label: "Želivského", minutes: 12 },
      { label: "Praha hlavní nádraží", minutes: 20, note: "best wider city and rail access" },
    ],
    stayAreas: [
      { area: "Old Town", why: "Best classic Prague base" },
      { area: "Vinohrady", why: "Great bars, food and easier east-side access" },
    ],
    tips: [
      "Very easy Prague football trip when paired with a central city stay",
      "Vinohrady is often the smartest compromise between atmosphere and convenience",
    ],
  },

  "dosan-arena": {
    stadiumKey: "dosan-arena",
    name: "Doosan Arena",
    city: "Plzeň",
    country: "Czech Republic",
    capacity: 11700,
    opened: 1955,
    airport: "Václav Havel Airport Prague (PRG)",
    distanceFromAirportKm: 89,
    teamKeys: ["plzen"],
    transit: [
      { label: "Plzeň hlavní nádraží", minutes: 20 },
      { label: "Plzeň city centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Plzeň Centre", why: "Best practical base close to bars and restaurants" },
      { area: "Near Plzeň hlavní nádraží", why: "Best for rail-based arrival and departure" },
    ],
    tips: [
      "Better as a one-night football city than many people expect",
      "Easy enough to do from Prague, but staying locally gives a better football feel",
    ],
  },

  "mestsky-stadion-ostrava": {
    stadiumKey: "mestsky-stadion-ostrava",
    name: "Městský stadion",
    city: "Ostrava",
    country: "Czech Republic",
    capacity: 15000,
    opened: 2015,
    airport: "Leoš Janáček Airport Ostrava (OSR)",
    distanceFromAirportKm: 20,
    teamKeys: ["banik-ostrava"],
    transit: [
      { label: "Ostrava hlavní nádraží", minutes: 30 },
      { label: "Ostrava-Svinov", minutes: 20, note: "useful rail arrival point" },
    ],
    stayAreas: [
      { area: "Ostrava Centre", why: "Best practical visitor base" },
      { area: "Stodolní area", why: "Best nightlife-heavy option" },
    ],
    tips: [
      "More of a football-driven trip than a classic tourist city break",
      "Best done if you want atmosphere and a more industrial, different kind of away weekend",
    ],
  },

  "andr-stadium": {
    stadiumKey: "andr-stadium",
    name: "Andrův stadion",
    city: "Olomouc",
    country: "Czech Republic",
    capacity: 12500,
    opened: 1940,
    airport: "Brno Airport (BRQ)",
    distanceFromAirportKm: 78,
    teamKeys: ["sigma-olomouc"],
    transit: [
      { label: "Olomouc hlavní nádraží", minutes: 25 },
      { label: "Olomouc historic centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Historic Centre", why: "Best overall base with the nicest city atmosphere" },
      { area: "Near Olomouc hlavní nádraží", why: "Best for practical rail travel" },
    ],
    tips: [
      "Underrated small-city football trip with a genuinely pleasant centre",
      "One of the better Czech trips if you want football plus architecture and cafés",
    ],
  },

  "stadion-u-nisy": {
    stadiumKey: "stadion-u-nisy",
    name: "Stadion U Nisy",
    city: "Liberec",
    country: "Czech Republic",
    capacity: 9900,
    opened: 1933,
    airport: "Václav Havel Airport Prague (PRG)",
    distanceFromAirportKm: 124,
    teamKeys: ["slovan-liberec"],
    transit: [
      { label: "Liberec centre", minutes: 15 },
      { label: "Liberec bus station", minutes: 20, note: "key arrival point for many visitors" },
    ],
    stayAreas: [
      { area: "Liberec Centre", why: "Best practical local base" },
      { area: "Around the old town", why: "Best atmosphere and easiest walking access" },
    ],
    tips: [
      "A more niche football trip, but useful if combining city and mountain-region travel",
      "Better suited to a broader northern Czech weekend than a pure marquee football stop",
    ],
  },

  "lokotrans-arena": {
    stadiumKey: "lokotrans-arena",
    name: "Lokotrans Arena",
    city: "Mladá Boleslav",
    country: "Czech Republic",
    capacity: 5000,
    opened: 1965,
    airport: "Václav Havel Airport Prague (PRG)",
    distanceFromAirportKm: 70,
    teamKeys: ["mlada-boleslav"],
    transit: [
      { label: "Mladá Boleslav centre", minutes: 15 },
      { label: "Bus station", minutes: 15, note: "most practical arrival point" },
    ],
    stayAreas: [
      { area: "Mladá Boleslav Centre", why: "Simplest local option if staying over" },
      { area: "Prague", why: "Much stronger base if combining football with city travel" },
    ],
    tips: [
      "Functional football stop rather than a premium city-break destination",
      "Usually best treated as a Prague-based side trip if logistics allow",
    ],
  },

  "dolicek": {
    stadiumKey: "dolicek",
    name: "Ďolíček Stadium",
    city: "Prague",
    country: "Czech Republic",
    capacity: 6300,
    opened: 1932,
    airport: "Václav Havel Airport Prague (PRG)",
    distanceFromAirportKm: 23,
    teamKeys: ["bohemians-1905"],
    transit: [
      { label: "Vršovické náměstí", minutes: 5 },
      { label: "Praha hlavní nádraží", minutes: 20, note: "best central rail hub" },
    ],
    stayAreas: [
      { area: "Vinohrady", why: "Best nearby district with bars and local feel" },
      { area: "Old Town", why: "Best overall Prague base if making a full city trip of it" },
    ],
    tips: [
      "Small but characterful ground and a very good alternative Prague football experience",
      "This is the kind of trip that gets better if you lean into neighbourhood atmosphere",
    ],
  },

  "malso-vicka-arena": {
    stadiumKey: "malso-vicka-arena",
    name: "Malšovická Arena",
    city: "Hradec Králové",
    country: "Czech Republic",
    capacity: 9300,
    opened: 2023,
    airport: "Václav Havel Airport Prague (PRG)",
    distanceFromAirportKm: 130,
    teamKeys: ["hradec-kralove"],
    transit: [
      { label: "Hradec Králové centre", minutes: 20 },
      { label: "Main bus station", minutes: 25, note: "most practical arrival point" },
    ],
    stayAreas: [
      { area: "City Centre", why: "Best practical base for a short stay" },
      { area: "Near main square", why: "Best atmosphere and walkability" },
    ],
    tips: [
      "Newer stadium gives the club a cleaner, more modern trip feel than before",
      "Still more of a football stop than a headline European away weekend",
    ],
  },

  "agc-arena": {
    stadiumKey: "agc-arena",
    name: "AGC Arena",
    city: "Teplice",
    country: "Czech Republic",
    capacity: 18000,
    opened: 1973,
    airport: "Václav Havel Airport Prague (PRG)",
    distanceFromAirportKm: 88,
    teamKeys: ["teplice"],
    transit: [
      { label: "Teplice centre", minutes: 20 },
      { label: "Teplice bus/train area", minutes: 20, note: "best practical arrival zone" },
    ],
    stayAreas: [
      { area: "Teplice Centre", why: "Best local practical base" },
      { area: "Prague", why: "Stronger city-break option if not staying purely for the match" },
    ],
    tips: [
      "Works better as a regional football stop than a glamour weekend",
      "Prague may still be the smarter overnight base if transport timings suit",
    ],
  },
};

export default czechFirstLeagueStadiums;
