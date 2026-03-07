import type { StadiumRecord } from "./types";

export const premierLeagueStadiums: Record<string, StadiumRecord> = {
  "old-trafford": {
    stadiumKey: "old-trafford",
    name: "Old Trafford",
    city: "Manchester",
    country: "England",
    capacity: 74310,
    opened: 1910,
    teamKeys: ["manchester-united"],
    airport: "Manchester Airport (MAN)",
    distanceFromAirportKm: 14,
    transit: [
      { label: "Old Trafford (Metrolink)", minutes: 8 },
      { label: "Manchester Piccadilly", minutes: 25, note: "best mainline rail hub" },
    ],
    stayAreas: [
      { area: "Deansgate / Castlefield", why: "Best central base for nightlife, bars and transport" },
      { area: "Spinningfields", why: "More polished city-centre stay with easy tram access" },
    ],
    tips: [
      "One of the biggest matchday draws in England so leave extra time for arrival and exit",
      "Best experience usually comes from staying centrally rather than right by the ground",
    ],
  },

  "tottenham-hotspur-stadium": {
    stadiumKey: "tottenham-hotspur-stadium",
    name: "Tottenham Hotspur Stadium",
    city: "London",
    country: "England",
    capacity: 62850,
    opened: 2019,
    teamKeys: ["tottenham-hotspur"],
    airport: "London Stansted (STN)",
    distanceFromAirportKm: 46,
    transit: [
      { label: "White Hart Lane", minutes: 8 },
      { label: "Tottenham Hale", minutes: 20, note: "useful for airport and Underground links" },
    ],
    stayAreas: [
      { area: "Liverpool Street / Shoreditch", why: "Strong nightlife and decent rail links north" },
      { area: "King's Cross", why: "Best all-round London transport hub for visitors" },
    ],
    tips: [
      "Modern stadium with strong pre-match food and drink options around the concourse",
      "Do not stay near the ground unless price is exceptional — central London is the better base",
    ],
  },

  "london-stadium": {
    stadiumKey: "london-stadium",
    name: "London Stadium",
    city: "London",
    country: "England",
    capacity: 62500,
    opened: 2012,
    teamKeys: ["west-ham-united"],
    airport: "London City Airport (LCY)",
    distanceFromAirportKm: 6,
    transit: [
      { label: "Stratford", minutes: 12 },
      { label: "Stratford International", minutes: 18, note: "useful for rail connections" },
    ],
    stayAreas: [
      { area: "Stratford", why: "Closest practical base with shopping, hotels and fast transport" },
      { area: "Liverpool Street", why: "Better central option with direct East London access" },
    ],
    tips: [
      "One of the easiest stadiums in the league for public transport access",
      "Stratford gets busy after full-time so hang back a little if you hate queues",
    ],
  },

  "anfield": {
    stadiumKey: "anfield",
    name: "Anfield",
    city: "Liverpool",
    country: "England",
    capacity: 61276,
    opened: 1884,
    teamKeys: ["liverpool"],
    airport: "Liverpool John Lennon Airport (LPL)",
    distanceFromAirportKm: 14,
    transit: [
      { label: "Liverpool Lime Street", minutes: 35, note: "main rail hub then bus/taxi onward" },
      { label: "Sandhills", minutes: 30, note: "useful on some matchday shuttle routes" },
    ],
    stayAreas: [
      { area: "Ropewalks", why: "Best nightlife-heavy central base" },
      { area: "Waterfront / Albert Dock", why: "Most visitor-friendly central stay area" },
    ],
    tips: [
      "One of the strongest atmospheres in Europe so arriving early is worth it",
      "Staying in the city centre is smarter than staying around the ground itself",
    ],
  },

  "emirates-stadium": {
    stadiumKey: "emirates-stadium",
    name: "Emirates Stadium",
    city: "London",
    country: "England",
    capacity: 60704,
    opened: 2006,
    teamKeys: ["arsenal"],
    airport: "London Heathrow (LHR)",
    distanceFromAirportKm: 30,
    transit: [
      { label: "Arsenal Station", minutes: 5 },
      { label: "Highbury & Islington", minutes: 15, note: "best wider London connections" },
    ],
    stayAreas: [
      { area: "King's Cross", why: "Best transport base and easy access to the stadium" },
      { area: "Angel / Islington", why: "Best atmosphere locally with bars and restaurants" },
    ],
    tips: [
      "One of the easiest major London grounds for Tube access",
      "King's Cross is usually the best compromise between convenience and wider city access",
    ],
  },

  "etihad-stadium": {
    stadiumKey: "etihad-stadium",
    name: "Etihad Stadium",
    city: "Manchester",
    country: "England",
    capacity: 52900,
    opened: 2003,
    teamKeys: ["manchester-city"],
    airport: "Manchester Airport (MAN)",
    distanceFromAirportKm: 16,
    transit: [
      { label: "Etihad Campus (Metrolink)", minutes: 6 },
      { label: "Manchester Piccadilly", minutes: 20, note: "best mainline arrival point" },
    ],
    stayAreas: [
      { area: "Northern Quarter", why: "Best bars, food and city atmosphere" },
      { area: "Deansgate", why: "Well-connected and strong hotel choice" },
    ],
    tips: [
      "Very easy stadium for tram-based access from central Manchester",
      "Stay central rather than east Manchester unless you specifically want ground proximity",
    ],
  },

  "hill-dickinson-stadium": {
    stadiumKey: "hill-dickinson-stadium",
    name: "Hill Dickinson Stadium",
    city: "Liverpool",
    country: "England",
    capacity: 52769,
    opened: 2025,
    teamKeys: ["everton"],
    airport: "Liverpool John Lennon Airport (LPL)",
    distanceFromAirportKm: 15,
    transit: [
      { label: "Liverpool Lime Street", minutes: 30, note: "best central entry point" },
      { label: "Moorfields / Waterfront area", minutes: 20, note: "useful for dockside access" },
    ],
    stayAreas: [
      { area: "Waterfront / Pier Head", why: "Best fit for dockside stadium access and city views" },
      { area: "Ropewalks", why: "Better nightlife while staying close enough for match travel" },
    ],
    tips: [
      "New stadium means matchday flow and transport patterns may still settle over time",
      "Waterfront stays make the most sense if you want football + city break convenience",
    ],
  },

  "st-james-park": {
    stadiumKey: "st-james-park",
    name: "St James' Park",
    city: "Newcastle upon Tyne",
    country: "England",
    capacity: 52258,
    opened: 1892,
    teamKeys: ["newcastle-united"],
    airport: "Newcastle International Airport (NCL)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "St James", minutes: 3 },
      { label: "Newcastle Central Station", minutes: 15, note: "best rail hub" },
    ],
    stayAreas: [
      { area: "City Centre", why: "Best overall base because the stadium is effectively central" },
      { area: "Quayside", why: "Best riverside stay with bars and restaurants" },
    ],
    tips: [
      "One of the best city-centre stadium locations in the country",
      "Very easy weekend-trip ground because you can do almost everything on foot",
    ],
  },

  "stadium-of-light": {
    stadiumKey: "stadium-of-light",
    name: "Stadium of Light",
    city: "Sunderland",
    country: "England",
    capacity: 48707,
    opened: 1997,
    teamKeys: ["sunderland"],
    airport: "Newcastle International Airport (NCL)",
    distanceFromAirportKm: 34,
    transit: [
      { label: "Stadium of Light", minutes: 5 },
      { label: "Sunderland Station", minutes: 18, note: "best rail / Metro interchange" },
    ],
    stayAreas: [
      { area: "Sunderland City Centre", why: "Closest practical base for the stadium" },
      { area: "Newcastle City Centre", why: "Better hotel and nightlife choice if doing a wider trip" },
    ],
    tips: [
      "Good public transport setup thanks to the Tyne and Wear Metro",
      "For a more lively city break, many visitors will prefer staying in Newcastle and travelling in",
    ],
  },

  "villa-park": {
    stadiumKey: "villa-park",
    name: "Villa Park",
    city: "Birmingham",
    country: "England",
    capacity: 42918,
    opened: 1897,
    teamKeys: ["aston-villa"],
    airport: "Birmingham Airport (BHX)",
    distanceFromAirportKm: 16,
    transit: [
      { label: "Witton", minutes: 8 },
      { label: "Birmingham New Street", minutes: 25, note: "main city-centre rail hub" },
    ],
    stayAreas: [
      { area: "Birmingham City Centre", why: "Best for hotels, nightlife and onward transport" },
      { area: "Brindleyplace", why: "More polished stay with canalside food and drink" },
    ],
    tips: [
      "Classic English stadium feel with a stronger experience than the surrounding area suggests",
      "City-centre Birmingham is the right base unless you only care about match proximity",
    ],
  },

  "stamford-bridge": {
    stadiumKey: "stamford-bridge",
    name: "Stamford Bridge",
    city: "London",
    country: "England",
    capacity: 40341,
    opened: 1877,
    teamKeys: ["chelsea"],
    airport: "London Heathrow (LHR)",
    distanceFromAirportKm: 23,
    transit: [
      { label: "Fulham Broadway", minutes: 5 },
      { label: "West Brompton", minutes: 15, note: "useful District / Overground option" },
    ],
    stayAreas: [
      { area: "South Kensington", why: "Best upscale west London base" },
      { area: "Victoria", why: "Stronger all-round transport links for visitors" },
    ],
    tips: [
      "Very easy London stadium to pair with a wider city trip",
      "West London stays are convenient but often pricier than more central options",
    ],
  },

  "elland-road": {
    stadiumKey: "elland-road",
    name: "Elland Road",
    city: "Leeds",
    country: "England",
    capacity: 37890,
    opened: 1897,
    teamKeys: ["leeds-united"],
    airport: "Leeds Bradford Airport (LBA)",
    distanceFromAirportKm: 13,
    transit: [
      { label: "Leeds Station", minutes: 30, note: "main rail hub then taxi/bus onward" },
      { label: "City Centre", minutes: 25, note: "best practical starting point" },
    ],
    stayAreas: [
      { area: "Leeds City Centre", why: "Best hotel, food and nightlife base" },
      { area: "Call Lane / Brewery Wharf", why: "Best for bars and evening atmosphere" },
    ],
    tips: [
      "Ground is not as rail-simple as some others, so allow extra arrival time",
      "Leeds city centre is compact enough to make it the clear best stay choice",
    ],
  },

  "city-ground": {
    stadiumKey: "city-ground",
    name: "City Ground",
    city: "Nottingham",
    country: "England",
    capacity: 30445,
    opened: 1898,
    teamKeys: ["nottingham-forest"],
    airport: "East Midlands Airport (EMA)",
    distanceFromAirportKm: 24,
    transit: [
      { label: "Nottingham Station", minutes: 25 },
      { label: "Lace Market / Hockley", minutes: 25, note: "good central starting area" },
    ],
    stayAreas: [
      { area: "Lace Market", why: "Best atmosphere and independent bars" },
      { area: "Old Market Square", why: "Best central transport and hotel access" },
    ],
    tips: [
      "Pleasant away day because the riverside setting feels more relaxed than many grounds",
      "Nottingham centre is usually the right answer for both convenience and nightlife",
    ],
  },

  "amex-stadium": {
    stadiumKey: "amex-stadium",
    name: "Amex Stadium",
    city: "Brighton",
    country: "England",
    capacity: 31876,
    opened: 2011,
    teamKeys: ["brighton-hove-albion"],
    airport: "London Gatwick (LGW)",
    distanceFromAirportKm: 46,
    transit: [
      { label: "Falmer", minutes: 5 },
      { label: "Brighton Station", minutes: 20, note: "best city base and rail hub" },
    ],
    stayAreas: [
      { area: "Brighton Seafront", why: "Best classic weekend-break base" },
      { area: "North Laine", why: "Best food, bars and independent feel" },
    ],
    tips: [
      "Great choice for a football weekend because the city adds a lot beyond the match",
      "Stay in central Brighton, not by the stadium",
    ],
  },

  "molineux": {
    stadiumKey: "molineux",
    name: "Molineux",
    city: "Wolverhampton",
    country: "England",
    capacity: 31750,
    opened: 1889,
    teamKeys: ["wolves"],
    airport: "Birmingham Airport (BHX)",
    distanceFromAirportKm: 40,
    transit: [
      { label: "Wolverhampton Station", minutes: 18 },
      { label: "City Centre", minutes: 12 },
    ],
    stayAreas: [
      { area: "Wolverhampton City Centre", why: "Best practical short-stay option near the ground" },
      { area: "Birmingham City Centre", why: "Better nightlife and wider hotel choice" },
    ],
    tips: [
      "Easy enough as a football stop, but Birmingham is often the stronger overnight base",
      "Good option to pair with wider Midlands travel rather than treat as a pure luxury city break",
    ],
  },

  "selhurst-park": {
    stadiumKey: "selhurst-park",
    name: "Selhurst Park",
    city: "London",
    country: "England",
    capacity: 25486,
    opened: 1924,
    teamKeys: ["crystal-palace"],
    airport: "London Gatwick (LGW)",
    distanceFromAirportKm: 26,
    transit: [
      { label: "Norwood Junction", minutes: 12 },
      { label: "East Croydon", minutes: 25, note: "best wider rail hub" },
    ],
    stayAreas: [
      { area: "London Bridge", why: "Better central London base with good southbound links" },
      { area: "Croydon", why: "Closest practical value option for the ground" },
    ],
    tips: [
      "Traditional-feel stadium with a stronger old-school atmosphere than many larger grounds",
      "Central London stay usually beats staying locally unless budget is the priority",
    ],
  },

  "craven-cottage": {
    stadiumKey: "craven-cottage",
    name: "Craven Cottage",
    city: "London",
    country: "England",
    capacity: 29589,
    opened: 1896,
    teamKeys: ["fulham"],
    airport: "London Heathrow (LHR)",
    distanceFromAirportKm: 21,
    transit: [
      { label: "Putney Bridge", minutes: 18 },
      { label: "Hammersmith", minutes: 25, note: "strong wider transport hub" },
    ],
    stayAreas: [
      { area: "Hammersmith", why: "Best practical west London base for transport and value" },
      { area: "South Kensington", why: "Stronger higher-end London stay option" },
    ],
    tips: [
      "One of the prettiest stadium settings in England thanks to the riverside location",
      "Excellent stadium for a relaxed football-and-city-break weekend",
    ],
  },

  "gtech-community-stadium": {
    stadiumKey: "gtech-community-stadium",
    name: "Gtech Community Stadium",
    city: "London",
    country: "England",
    capacity: 17250,
    opened: 2020,
    teamKeys: ["brentford"],
    airport: "London Heathrow (LHR)",
    distanceFromAirportKm: 11,
    transit: [
      { label: "Kew Bridge", minutes: 6 },
      { label: "Gunnersbury", minutes: 18, note: "Underground / Overground access" },
    ],
    stayAreas: [
      { area: "Chiswick", why: "Best local area with better atmosphere than pure airport stays" },
      { area: "Hammersmith", why: "Best west London transport base" },
    ],
    tips: [
      "Very convenient for Heathrow-based travellers",
      "West London base works best here — no need to overcomplicate the trip",
    ],
  },

  "vitality-stadium": {
    stadiumKey: "vitality-stadium",
    name: "Vitality Stadium",
    city: "Bournemouth",
    country: "England",
    capacity: 11307,
    opened: 1910,
    teamKeys: ["afc-bournemouth"],
    airport: "Bournemouth Airport (BOH)",
    distanceFromAirportKm: 10,
    transit: [
      { label: "Bournemouth Station", minutes: 30, note: "main rail hub then taxi/bus onward" },
      { label: "Town Centre", minutes: 25 },
    ],
    stayAreas: [
      { area: "Bournemouth Seafront", why: "Best overall visitor base" },
      { area: "Town Centre", why: "Best practical choice for rail, shops and nightlife" },
    ],
    tips: [
      "Small stadium but a strong football-weekend location because of the seaside setting",
      "Great one to pair with a short coastal break rather than just a day trip",
    ],
  },

  "turf-moor": {
    stadiumKey: "turf-moor",
    name: "Turf Moor",
    city: "Burnley",
    country: "England",
    capacity: 21944,
    opened: 1883,
    teamKeys: ["burnley"],
    airport: "Manchester Airport (MAN)",
    distanceFromAirportKm: 55,
    transit: [
      { label: "Burnley Manchester Road", minutes: 20 },
      { label: "Burnley Central", minutes: 25 },
    ],
    stayAreas: [
      { area: "Burnley Town Centre", why: "Closest practical stay if keeping the trip simple" },
      { area: "Manchester City Centre", why: "Better option if you want stronger hotels and nightlife" },
    ],
    tips: [
      "Classic old-school English football stop rather than a glamorous city-break destination",
      "Manchester is often the stronger overnight base unless you want maximum simplicity",
    ],
  },
};

export default premierLeagueStadiums;
