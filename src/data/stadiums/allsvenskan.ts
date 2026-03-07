import type { StadiumRecord } from "./types";

const SWEDEN = "Sweden";

export const allsvenskanStadiums: Record<string, StadiumRecord> = {
  "strawberry-arena": {
    stadiumKey: "strawberry-arena",
    name: "Strawberry Arena",
    city: "Stockholm",
    country: SWEDEN,
    capacity: 50000,
    opened: 2012,
    teamKeys: ["aik"],
    airport: "Stockholm Arlanda Airport (ARN)",
    distanceFromAirportKm: 36,
    transit: [
      { label: "Solna Station", minutes: 8, note: "best direct rail option" },
      { label: "Stockholm Odenplan", minutes: 15, note: "strong city transfer point" },
      { label: "Stockholm Central", minutes: 20, note: "best mainline hub" },
    ],
    stayAreas: [
      { area: "Norrmalm / Central Stockholm", why: "Best all-round base for hotels, nightlife and transport" },
      { area: "Solna", why: "Closest practical stay if stadium convenience matters most" },
    ],
    tips: [
      "Huge national-arena setup, so give yourself extra time for entry and exit on major matchdays",
      "Central Stockholm is usually the smarter overnight base unless you want pure ground proximity",
    ],
  },

  "3arena": {
    stadiumKey: "3arena",
    name: "3Arena",
    city: "Stockholm",
    country: SWEDEN,
    capacity: 30000,
    opened: 2013,
    teamKeys: ["djurgarden", "hammarby"],
    airport: "Stockholm Arlanda Airport (ARN)",
    distanceFromAirportKm: 43,
    transit: [
      { label: "Globen", minutes: 6, note: "closest simple metro access" },
      { label: "Gullmarsplan", minutes: 10, note: "best wider metro interchange" },
      { label: "Stockholm Central", minutes: 15, note: "best mainline rail base" },
    ],
    stayAreas: [
      { area: "Södermalm", why: "Best nightlife-heavy base and very convenient for the arena" },
      { area: "Norrmalm / Central Stockholm", why: "Best all-round hotel and transport choice" },
    ],
    tips: [
      "Shared major arena, so event-style security and entry flow can feel bigger than a typical club ground",
      "Södermalm is the strongest football-weekend base if you want bars and easy pre/post-match movement",
    ],
  },

  "gamla-ullevi": {
    stadiumKey: "gamla-ullevi",
    name: "Gamla Ullevi",
    city: "Gothenburg",
    country: SWEDEN,
    capacity: 18454,
    opened: 2009,
    teamKeys: ["gais", "goteborg", "ois"],
    airport: "Gothenburg Landvetter Airport (GOT)",
    distanceFromAirportKm: 25,
    transit: [
      { label: "Gothenburg Central Station", minutes: 10, note: "best mainline rail arrival point" },
      { label: "Ullevi / Scandinavium tram stops", minutes: 6, note: "easiest local public transport access" },
    ],
    stayAreas: [
      { area: "Central Gothenburg", why: "Best all-round base for bars, restaurants and transport" },
      { area: "Avenyn", why: "Best for nightlife and a stronger weekend-break feel" },
    ],
    tips: [
      "Excellent city-break stadium because central Gothenburg works better than trying to stay by the ground",
      "Shared use means the venue is very easy to pair with wider city plans",
    ],
  },

  "nordic-wellness-arena": {
    stadiumKey: "nordic-wellness-arena",
    name: "Nordic Wellness Arena",
    city: "Gothenburg",
    country: SWEDEN,
    capacity: 6316,
    opened: 2015,
    teamKeys: ["hacken"],
    airport: "Gothenburg Landvetter Airport (GOT)",
    distanceFromAirportKm: 29,
    transit: [
      { label: "Hjalmar Brantingsplatsen", minutes: 15, note: "best wider public transport interchange on Hisingen" },
      { label: "Central Gothenburg", minutes: 20, note: "best visitor base for hotels and nightlife" },
    ],
    stayAreas: [
      { area: "Central Gothenburg", why: "Best choice for hotels, food, nightlife and simple match travel" },
      { area: "Lindholmen", why: "Closer west-side option if you want a quieter stay" },
    ],
    tips: [
      "Do not build your stay around the immediate stadium area unless price is exceptional",
      "Central Gothenburg gives you a much stronger trip overall than staying out on Hisingen",
    ],
  },

  "orjans-vall": {
    stadiumKey: "orjans-vall",
    name: "Örjans Vall",
    city: "Halmstad",
    country: SWEDEN,
    capacity: 10873,
    opened: 1922,
    teamKeys: ["halmstad"],
    airport: "Halmstad Airport (HAD)",
    distanceFromAirportKm: 3,
    transit: [
      { label: "Halmstad Central Station", minutes: 25, note: "best rail hub then bus/taxi onward" },
      { label: "Halmstad city centre", minutes: 15, note: "best practical visitor base" },
    ],
    stayAreas: [
      { area: "Halmstad City Centre", why: "Best practical base for hotels, food and onward transport" },
      { area: "West Bay / seafront area", why: "Better if you want more of a summer city-break feel" },
    ],
    tips: [
      "Classic older ground with a more local feel than the big-city arenas",
      "Very easy one to combine with a simple coastal overnight rather than overcomplicate the trip",
    ],
  },

  "grimsta-ip": {
    stadiumKey: "grimsta-ip",
    name: "Grimsta IP",
    city: "Stockholm",
    country: SWEDEN,
    capacity: 6400,
    opened: 1963,
    teamKeys: ["brommapojkarna"],
    airport: "Stockholm Arlanda Airport (ARN)",
    distanceFromAirportKm: 36,
    transit: [
      { label: "Brommaplan", minutes: 15, note: "best metro-linked starting point" },
      { label: "Stockholm Central", minutes: 25, note: "best mainline base" },
    ],
    stayAreas: [
      { area: "Central Stockholm", why: "Best all-round visitor base for transport and nightlife" },
      { area: "Bromma", why: "Closest simple option if convenience matters more than atmosphere" },
    ],
    tips: [
      "Small-scale ground, so treat this as a Stockholm trip first and a stadium stop second",
      "Central Stockholm is usually the right answer for staying overnight",
    ],
  },

  "boras-arena": {
    stadiumKey: "boras-arena",
    name: "Borås Arena",
    city: "Borås",
    country: SWEDEN,
    capacity: 16284,
    opened: 2005,
    teamKeys: ["elfsborg"],
    airport: "Gothenburg Landvetter Airport (GOT)",
    distanceFromAirportKm: 40,
    transit: [
      { label: "Borås Central Station", minutes: 20, note: "best rail entry point" },
      { label: "Borås city centre", minutes: 15, note: "best practical base" },
    ],
    stayAreas: [
      { area: "Borås City Centre", why: "Best practical option for station access and short walks" },
      { area: "Central Gothenburg", why: "Better if you want stronger nightlife and are happy to travel in" },
    ],
    tips: [
      "Borås works as a simple football stop, but Gothenburg is often the stronger overnight city-break base",
      "Good option if you want a straightforward matchday without major-city hassle",
    ],
  },

  "studenternas-ip": {
    stadiumKey: "studenternas-ip",
    name: "Studenternas IP",
    city: "Uppsala",
    country: SWEDEN,
    capacity: 10522,
    opened: 2020,
    teamKeys: ["sirius"],
    airport: "Stockholm Arlanda Airport (ARN)",
    distanceFromAirportKm: 36,
    transit: [
      { label: "Uppsala Central Station", minutes: 20, note: "best rail hub" },
      { label: "Uppsala city centre", minutes: 12, note: "easy walkable visitor base" },
    ],
    stayAreas: [
      { area: "Uppsala City Centre", why: "Best overall base for a compact, walkable football trip" },
      { area: "Around the station", why: "Best if rail convenience matters most" },
    ],
    tips: [
      "Very manageable trip because Uppsala is compact and easy to do without overplanning",
      "Best treated as a clean one-night football city break rather than a pure day trip if you have time",
    ],
  },

  "guldfageln-arena": {
    stadiumKey: "guldfageln-arena",
    name: "Guldfågeln Arena",
    city: "Kalmar",
    country: SWEDEN,
    capacity: 12150,
    opened: 2011,
    teamKeys: ["kalmar"],
    airport: "Kalmar Airport (KLR)",
    distanceFromAirportKm: 6,
    transit: [
      { label: "Kalmar Central Station", minutes: 20, note: "best rail entry point" },
      { label: "Kalmar city centre", minutes: 15, note: "best practical stay base" },
    ],
    stayAreas: [
      { area: "Kalmar City Centre", why: "Best for restaurants, hotels and simple onward transport" },
      { area: "Near Kvarnholmen", why: "Best visitor-friendly historic centre feel" },
    ],
    tips: [
      "Easy stadium to pair with a relaxed short city break",
      "Staying centrally works much better than trying to stay near the ground itself",
    ],
  },

  "eleda-stadion": {
    stadiumKey: "eleda-stadion",
    name: "Eleda Stadion",
    city: "Malmö",
    country: SWEDEN,
    capacity: 22500,
    opened: 2009,
    teamKeys: ["malmo"],
    airport: "Malmö Airport (MMX)",
    distanceFromAirportKm: 30,
    transit: [
      { label: "Triangeln Station", minutes: 15, note: "best central rail access" },
      { label: "Malmö Central Station", minutes: 20, note: "mainline arrival point" },
    ],
    stayAreas: [
      { area: "Triangeln / City Centre", why: "Best all-round base for food, bars and easy match travel" },
      { area: "Lilla Torg", why: "Best nightlife-heavy central stay area" },
    ],
    tips: [
      "One of the best Scandinavian football-weekend bases because the city adds a lot beyond the match",
      "Buy early for big games because domestic sell-outs are common",
    ],
  },

  "strandvallen": {
    stadiumKey: "strandvallen",
    name: "Strandvallen",
    city: "Hällevik",
    country: SWEDEN,
    capacity: 6000,
    opened: 1953,
    teamKeys: ["mjalby"],
    airport: "Ronneby Airport (RNB)",
    distanceFromAirportKm: 45,
    transit: [
      { label: "Sölvesborg", minutes: 20, note: "best nearby transport anchor before final leg" },
      { label: "Hällevik centre", minutes: 10, note: "small local base close to the ground" },
    ],
    stayAreas: [
      { area: "Hällevik", why: "Closest possible base for a pure football stop" },
      { area: "Sölvesborg", why: "Best practical nearby stay with more options" },
    ],
    tips: [
      "Unique small-ground setting and one of the most distinctive trips in Sweden",
      "Treat this as a niche football pilgrimage rather than a polished city-break destination",
    ],
  },

  "stora-valla": {
    stadiumKey: "stora-valla",
    name: "Stora Valla",
    city: "Degerfors",
    country: SWEDEN,
    capacity: 5880,
    opened: 1938,
    teamKeys: ["degersfors"],
    airport: "Örebro Airport (ORB)",
    distanceFromAirportKm: 55,
    transit: [
      { label: "Degerfors station", minutes: 20, note: "best local rail starting point" },
      { label: "Karlskoga", minutes: 20, note: "best nearby larger base" },
    ],
    stayAreas: [
      { area: "Degerfors", why: "Best for pure match convenience" },
      { area: "Karlskoga", why: "Better for hotel choice and a more practical overnight stop" },
    ],
    tips: [
      "Very old-school football stop with limited frills",
      "This is a football-first trip, not a glamour city break",
    ],
  },

  "hitachi-energy-arena": {
    stadiumKey: "hitachi-energy-arena",
    name: "Hitachi Energy Arena",
    city: "Västerås",
    country: SWEDEN,
    capacity: 8900,
    opened: 2008,
    teamKeys: ["vasteras"],
    airport: "Stockholm Västerås Airport (VST)",
    distanceFromAirportKm: 6,
    transit: [
      { label: "Västerås Central Station", minutes: 20, note: "best rail hub" },
      { label: "Rocklunda area", minutes: 10, note: "closest practical local anchor" },
    ],
    stayAreas: [
      { area: "Västerås City Centre", why: "Best for hotels, food and onward transport" },
      { area: "Near central station", why: "Best if train convenience matters most" },
    ],
    tips: [
      "Simple, practical football stop rather than a huge arena experience",
      "City-centre Västerås is the right base unless you only care about ground proximity",
    ],
  },
};

export default allsvenskanStadiums;
