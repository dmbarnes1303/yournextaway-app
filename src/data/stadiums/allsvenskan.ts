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
    distanceFromAirportKm: 34,
    transit: [
      { label: "Solna Station", minutes: 8, note: "best rail-linked matchday anchor" },
      { label: "Stockholm Central Station", minutes: 15, note: "best mainline visitor base" },
    ],
    stayAreas: [
      { area: "Central Stockholm", why: "Best overall base for hotels, nightlife and easy onward rail links" },
      { area: "Solna", why: "Best pure convenience option if the AIK match is your main focus" },
    ],
    tips: [
      "This is the biggest arena trip in the league, so build in a bit more time for entry and exit flow.",
      "Central Stockholm is usually the smarter overnight base unless you only care about being close to AIK.",
      "Treat the ground as a transport move from the city rather than a reason to relocate your whole weekend.",
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
      { label: "Gullmarsplan", minutes: 10, note: "best metro-linked approach point" },
      { label: "Stockholm Central Station", minutes: 18, note: "best mainline base for most visitors" },
    ],
    stayAreas: [
      { area: "Södermalm", why: "Best football-weekend base for bars, food and easy 3Arena access" },
      { area: "Central Stockholm", why: "Best all-round base if you want cleaner rail links and broader hotel choice" },
    ],
    tips: [
      "Shared major arena, so event-style entry flow can feel bigger and slower than a normal club ground.",
      "Södermalm is the strongest base if you want atmosphere before and after Djurgården or Hammarby games.",
      "Do not stay near the arena just for convenience unless the deal is unusually good.",
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
      { area: "Central Gothenburg", why: "Best all-round base for bars, restaurants and matchday simplicity" },
      { area: "Avenyn", why: "Best for nightlife and a stronger full-weekend feel" },
    ],
    tips: [
      "One of the easiest stadiums in the entire project because the city centre and the ground fit together so well.",
      "Shared use means the venue works perfectly as part of a wider Gothenburg weekend rather than a football-only stop.",
      "Stay central and walk or tram in; there is almost no reason to complicate this one.",
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
      { label: "Central Gothenburg", minutes: 20, note: "best visitor base for hotels, bars and nightlife" },
    ],
    stayAreas: [
      { area: "Central Gothenburg", why: "Best choice for hotels, food, nightlife and simple match travel" },
      { area: "Lindholmen", why: "Closer west-side option if you want a quieter stay without sacrificing access" },
    ],
    tips: [
      "Do not build your whole stay around the immediate stadium area unless the price difference is huge.",
      "Central Gothenburg gives you a far better overall trip than staying out on Hisingen for convenience alone.",
      "This is best treated as a Gothenburg trip first and a Häcken ground move second.",
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
      { label: "Halmstad Central Station", minutes: 25, note: "best rail hub before the final local leg" },
      { label: "Halmstad city centre", minutes: 15, note: "best practical visitor base" },
    ],
    stayAreas: [
      { area: "Halmstad City Centre", why: "Best practical base for hotels, food and easy onward transport" },
      { area: "Seafront / beach area", why: "Best if you want more of a coastal overnight feel in good weather" },
    ],
    tips: [
      "Classic older ground with more character than many newer mid-sized replacements.",
      "Very easy one to combine with a relaxed coastal overnight rather than a rushed in-and-out trip.",
      "If weather is decent, the city adds more to the weekend than people expect.",
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
      { label: "Stockholm Central Station", minutes: 25, note: "best mainline base" },
    ],
    stayAreas: [
      { area: "Central Stockholm", why: "Best all-round visitor base for transport, nightlife and food" },
      { area: "Bromma", why: "Closest simple option if convenience matters more than atmosphere" },
    ],
    tips: [
      "Small-scale ground, so treat this as a Stockholm trip first and a stadium stop second.",
      "Central Stockholm is usually the right answer for staying overnight.",
      "This is a niche-capital-club experience, not a giant arena day out.",
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
      { label: "Borås city centre", minutes: 15, note: "best practical overnight base" },
    ],
    stayAreas: [
      { area: "Borås City Centre", why: "Best practical option for station access and short matchday movement" },
      { area: "Central Gothenburg", why: "Better if you want stronger nightlife and are happy to travel in" },
    ],
    tips: [
      "Borås works as a simple football stop, but Gothenburg is often the stronger overnight city-break base.",
      "Good option if you want a straightforward matchday without major-city hassle.",
      "Plan the post-match return early if you are not staying over.",
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
      { area: "Uppsala City Centre", why: "Best overall base for a compact walkable football trip" },
      { area: "Around the station", why: "Best if rail convenience matters most" },
    ],
    tips: [
      "Very manageable trip because Uppsala is compact and easy to handle without overplanning.",
      "Best treated as a clean one-night football city break rather than a same-day dash if you have the time.",
      "The city-to-stadium move is easy enough that central accommodation is the obvious choice.",
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
      { area: "Kvarnholmen", why: "Best if you want a more visitor-friendly historic-centre feel" },
    ],
    tips: [
      "Easy stadium to pair with a relaxed short city break.",
      "Staying centrally works much better than trying to stay near the ground itself.",
      "Kalmar is calm rather than high-intensity, so build the weekend around that.",
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
      "One of the best Scandinavian football-weekend bases because the city adds a lot beyond the match.",
      "Buy early for bigger Malmö games because domestic demand can jump quickly.",
      "The stadium is easy enough from central Malmö that there is no need to stay out near the ground.",
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
      { label: "Sölvesborg", minutes: 20, note: "best nearby transport anchor before the final leg" },
      { label: "Hällevik centre", minutes: 10, note: "closest local anchor to the ground" },
    ],
    stayAreas: [
      { area: "Hällevik", why: "Closest possible base for a pure football-place stop" },
      { area: "Sölvesborg", why: "Best practical nearby stay with more hotel and transport options" },
    ],
    tips: [
      "Unique small-ground setting and one of the most distinctive trips in Sweden.",
      "Treat this as a niche football pilgrimage rather than a polished city-break destination.",
      "The surrounding village and coastline are part of what make the trip worth doing.",
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
      { area: "Degerfors", why: "Best for pure match convenience and football-place immersion" },
      { area: "Karlskoga", why: "Better for hotel choice and a more practical overnight stop" },
    ],
    tips: [
      "Very old-school football stop with limited frills, which is exactly why some people will love it.",
      "This is a football-first trip, not a glamour city break.",
      "Plan food and transport early because small-town margin for improvisation is low.",
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
      { area: "Near Central Station", why: "Best if train convenience matters most" },
    ],
    tips: [
      "Simple practical football stop rather than a giant arena experience.",
      "City-centre Västerås is the right base unless you only care about ground proximity.",
      "Works well for one overnight if you keep expectations realistic and the plan tidy.",
    ],
  },
};

export default allsvenskanStadiums;
