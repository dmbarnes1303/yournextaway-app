import type { CityGuide } from "./types";

export const laLigaCityGuides: Record<string, CityGuide> = {

barcelona: {
  cityId: "barcelona",
  name: "Barcelona",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187497-Activities-Barcelona_Catalonia.html",
  overview:
    "Barcelona combines world-class football, Mediterranean beaches, striking architecture, and one of Europe’s strongest food cultures. It is compact, walkable in the centre, and easy to navigate by metro, making it ideal for short football-focused breaks or longer city stays. Expect late nights, busy matchdays, and a strong street-life culture in almost every neighbourhood.",

  topThings: [
    {
      title: "Sagrada Família",
      tip: "Book timed tickets several days ahead. Go early morning or late afternoon to avoid peak crowds.",
    },
    {
      title: "Las Ramblas → Gothic Quarter walk",
      tip: "Use Las Ramblas only as a corridor. Spend time in the Gothic Quarter’s side streets instead.",
    },
    {
      title: "Park Güell",
      tip: "Buy tickets online. Upper free areas still give good views if tickets sell out.",
    },
    {
      title: "Barceloneta Beach",
      tip: "Morning is calmer. Afternoons get busy and loud.",
    },
    {
      title: "Montjuïc Hill",
      tip: "Combine cable car, castle, and Olympic area in one half-day loop.",
    },
    {
      title: "La Boqueria Market",
      tip: "Go early and walk past the first few stalls for better prices.",
    },
    {
      title: "El Born district",
      tip: "Great area for evening food and bars. Wander, don’t plan tightly.",
    },
    {
      title: "Casa Batlló or Casa Milà",
      tip: "Choose one modernist house, not both, unless you’re an architecture fanatic.",
    },
    {
      title: "Camp Nou / Olympic Stadium area",
      tip: "Allow extra travel time on matchdays. Metro queues can be heavy.",
    },
    {
      title: "Rooftop bar sunset",
      tip: "Hotel rooftops offer better views than crowded viewpoints.",
    },
  ],

  tips: [
    "Dinner rarely starts before 8pm. Many kitchens peak 9–10pm.",
    "Pickpocketing exists in tourist zones. Zip pockets and cross-body bags.",
    "Metro is faster than taxis at rush hour.",
    "Book stadium tours and big attractions in advance on weekends.",
    "Avoid restaurants with photo menus in tourist zones.",
    "Pre-match drinks near stadiums fill early.",
  ],

  food: [
    "Tapas in El Born",
    "Seafood paella by the coast",
    "Bombas (potato croquettes)",
    "Jamón + pan con tomate",
    "Late-night churros and chocolate",
  ],

  transport:
    "Barcelona Metro is cheap, clean, and extensive. A multi-day transport card usually pays for itself. Walking is ideal inside Ciutat Vella and Eixample. Airport trains and metro go directly into the city.",

  accommodation:
    "Best bases: Eixample for central access, El Born for atmosphere, Poble-sec for value. Prioritise being near a metro line over being beachfront.",

  // Football context
  teams: [
    {
      name: "FC Barcelona",
      teamId: "barcelona",
      teamGuidePath: "/team/barcelona",
    },
    {
      name: "RCD Espanyol",
      teamId: "espanyol",
      teamGuidePath: "/team/espanyol",
    },
  ],

  // Monetisation entry points (future-wired)
  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  // Fixtures surface hint (handled by app logic)
  showUpcomingFixtures: true,
},

madrid: {
  cityId: "madrid",
  name: "Madrid",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187514-Activities-Madrid.html",
  overview:
    "Madrid is energetic, walkable, and built around food, nightlife, and football culture. The city feels alive late into the night, yet is easy to navigate and friendly for short trips. It’s one of Europe’s best cities for combining big-club football with neighbourhood exploration and relaxed daytime sightseeing.",

  topThings: [
    {
      title: "Prado Museum",
      tip: "Go early. Pick specific galleries instead of trying to see everything.",
    },
    {
      title: "Retiro Park",
      tip: "Ideal mid-day reset between sightseeing blocks.",
    },
    {
      title: "Gran Vía evening walk",
      tip: "Better after dark when the street lights up.",
    },
    {
      title: "Puerta del Sol → Plaza Mayor",
      tip: "Quick photos then move on; don’t linger too long.",
    },
    {
      title: "Temple of Debod sunset",
      tip: "Arrive early for space. Small but scenic.",
    },
    {
      title: "La Latina tapas crawl",
      tip: "Late afternoon into evening is best.",
    },
    {
      title: "Malasaña nightlife",
      tip: "Bars fill after 10pm.",
    },
    {
      title: "Bernabéu area",
      tip: "Explore before matchday to avoid crowds.",
    },
    {
      title: "Metropolitano district",
      tip: "Modern stadium area, plan transport ahead.",
    },
    {
      title: "Rooftop terrace",
      tip: "Many hotels offer skyline views without museum-style queues.",
    },
  ],

  tips: [
    "Lunch is typically 2–4pm. Dinner 8:30pm onwards.",
    "Metro is faster than taxis at busy times.",
    "Carry small change for cafés and bakeries.",
    "Book stadium tours in advance on weekends.",
    "Build days by neighbourhood rather than criss-crossing the city.",
  ],

  food: [
    "Bocadillo de calamares",
    "Churros con chocolate",
    "Jamón ibérico",
    "Tortilla española",
    "Vermouth bars",
  ],

  transport:
    "Extensive metro network with clear signage. Multi-journey tickets are good value. Walking works well in central districts.",

  accommodation:
    "Best areas: Sol/Gran Vía for first visits, Malasaña for nightlife, Salamanca for quieter upscale stays.",

  // Football context
  teams: [
    {
      name: "Real Madrid",
      teamId: "real-madrid",
      teamGuidePath: "/team/real-madrid",
    },
    {
      name: "Atlético Madrid",
      teamId: "atletico-madrid",
      teamGuidePath: "/team/atletico-madrid",
    },
    {
      name: "Rayo Vallecano",
      teamId: "rayo-vallecano",
      teamGuidePath: "/team/rayo-vallecano",
    },
    {
      name: "Getafe CF",
      teamId: "getafe",
      teamGuidePath: "/team/getafe",
    },
  ],

  // Monetisation entry points
  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  // Fixtures surface hint
  showUpcomingFixtures: true,
},

villarreal: {
  cityId: "villarreal",
  name: "Villarreal",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g1028711-Activities-Villarreal_Province_of_Castellon_Valencian_Community.html",
  overview:
    "Villarreal is a compact football-focused town best known for punching far above its weight through Villarreal CF. It’s ideal for travellers who want a relaxed base, easy matchday logistics, and access to the Costa del Azahar coastline without big-city crowds.",

  topThings: [
    {
      title: "Estadio de la Cerámica",
      tip: "Do the stadium tour if available. On matchday arrive early for atmosphere.",
    },
    {
      title: "Plaza Mayor",
      tip: "Central square for coffee, drinks, and people-watching.",
    },
    {
      title: "Iglesia Arciprestal San Jaime",
      tip: "Quick historic stop near the centre.",
    },
    {
      title: "Villarreal town walk",
      tip: "Entire centre is walkable in under an hour.",
    },
    {
      title: "Castellón de la Plana",
      tip: "15–20 minutes by train for bigger city dining options.",
    },
    {
      title: "Grao de Castellón beach",
      tip: "Combine beach time with seafood lunch.",
    },
    {
      title: "Local ceramics shops",
      tip: "Town is historically linked to ceramics manufacturing.",
    },
    {
      title: "Tapas near stadium",
      tip: "Bars around the ground fill up pre-match.",
    },
    {
      title: "Café culture",
      tip: "Late morning coffee is a local habit.",
    },
    {
      title: "Matchday wandering",
      tip: "Arrive 60–90 minutes before kickoff for best atmosphere.",
    },
  ],

  tips: [
    "Villarreal is small—don’t over-plan.",
    "Most visitors stay in Castellón for more hotel choice.",
    "English is less widely spoken than big cities; basic Spanish helps.",
    "Match tickets often sell well—buy early.",
    "Post-match trains back to Castellón get busy.",
  ],

  food: [
    "Paella Valenciana",
    "Seafood rice dishes",
    "Tapas",
    "Local pastries",
  ],

  transport:
    "Villarreal has a train station with regional connections. Walking covers most of the town.",

  accommodation:
    "Limited hotel stock in town. Castellón de la Plana offers more choice and easy rail access.",

  // Football context
  teams: [
    {
      name: "Villarreal CF",
      teamId: "villarreal",
      teamGuidePath: "/team/villarreal",
    },
  ],

  // Monetisation entry points
  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  // Fixtures surface hint
  showUpcomingFixtures: true,
},

seville: {
  cityId: "seville",
  name: "Seville",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187443-Activities-Seville_Province_of_Seville_Andalucia.html",
  overview:
    "Seville is one of Spain’s great cultural capitals, famous for historic architecture, tapas culture, and intense football rivalries. It delivers high-impact sightseeing, strong nightlife, and excellent value compared with Madrid or Barcelona.",

  topThings: [
    {
      title: "Seville Cathedral & Giralda Tower",
      tip: "Go early. Climb the tower for city views.",
    },
    {
      title: "Real Alcázar",
      tip: "Book timed tickets in advance.",
    },
    {
      title: "Plaza de España",
      tip: "Best visited early morning or sunset.",
    },
    {
      title: "Barrio Santa Cruz",
      tip: "Wander without a map.",
    },
    {
      title: "Metropol Parasol (Las Setas)",
      tip: "Great sunset viewpoint.",
    },
    {
      title: "Triana district",
      tip: "Authentic tapas and flamenco roots.",
    },
    {
      title: "Guadalquivir river walk",
      tip: "Evening stroll is ideal.",
    },
    {
      title: "Flamenco show",
      tip: "Book a small venue rather than tourist mega-shows.",
    },
    {
      title: "Mercado de Triana",
      tip: "Casual food stop.",
    },
    {
      title: "Matchday walk-up",
      tip: "Stadium areas build atmosphere hours before kickoff.",
    },
  ],

  tips: [
    "Siesta hours still affect some businesses.",
    "Summer daytime sightseeing is brutal—start early.",
    "Most central areas are walkable.",
    "Book major sights ahead in peak season.",
    "Derby days sell out fast.",
  ],

  food: [
    "Jamón ibérico",
    "Salmorejo",
    "Croquetas",
    "Espinacas con garbanzos",
  ],

  transport:
    "Metro is limited but useful. Walking and buses cover most routes.",

  accommodation:
    "Old Town and Triana are strong bases. Avoid staying too far out.",

  // Football context
  teams: [
    {
      name: "Sevilla FC",
      teamId: "sevilla",
      teamGuidePath: "/team/sevilla",
    },
    {
      name: "Real Betis",
      teamId: "real-betis",
      teamGuidePath: "/team/real-betis",
    },
  ],

  // Monetisation entry points
  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  // Fixtures surface hint
  showUpcomingFixtures: true,
},

vigo: {
  cityId: "vigo",
  name: "Vigo",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187509-Activities-Vigo_Province_of_Pontevedra_Galicia.html",
  overview:
    "Vigo is a working Atlantic port city in Galicia with strong maritime identity, excellent seafood, and a proud football culture centred on Celta Vigo. It feels more local and less touristic than Spain’s major cities, making it ideal for travellers who want authenticity over spectacle.",

  topThings: [
    {
      title: "Casco Vello (Old Town)",
      tip: "Walk uphill from the port for bars and viewpoints.",
    },
    {
      title: "Monte O Castro",
      tip: "Best panoramic views over the city and bay.",
    },
    {
      title: "Port area & marina",
      tip: "Good for evening strolls.",
    },
    {
      title: "Cíes Islands boat trip",
      tip: "Book ahead in summer.",
    },
    {
      title: "Samil Beach",
      tip: "Best city beach option.",
    },
    {
      title: "Seafood restaurants in O Berbés",
      tip: "Look for busy local spots.",
    },
    {
      title: "Praza da Constitución",
      tip: "Good café base.",
    },
    {
      title: "Shopping on Príncipe Street",
      tip: "Compact pedestrian zone.",
    },
    {
      title: "Seafood market visit",
      tip: "Morning best.",
    },
    {
      title: "Matchday walk-up",
      tip: "Bars around Balaídos fill early.",
    },
  ],

  tips: [
    "Expect rain more often than southern Spain.",
    "Seafood quality is outstanding.",
    "English less widely spoken—basic Spanish helps.",
    "Walking shoes useful.",
    "Relaxed pace of life.",
  ],

  food: [
    "Pulpo a la gallega",
    "Grilled octopus",
    "Empanadas",
    "Fresh shellfish",
  ],

  transport:
    "City buses cover most areas. Taxis inexpensive. Centre is walkable.",

  accommodation:
    "Stay near Old Town or waterfront for best atmosphere.",

  // Football context
  teams: [
    {
      name: "RC Celta Vigo",
      teamId: "celta-vigo",
      teamGuidePath: "/team/celta-vigo",
    },
  ],

  // Monetisation entry points
  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  // Fixtures surface hint
  showUpcomingFixtures: true,
},

san-sebastian: {
  cityId: "san-sebastian",
  name: "San Sebastián",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187457-Activities-San_Sebastian_Donostia_Province_of_Guipuzcoa_Basque_Country.html",
  overview:
    "San Sebastián (Donostia) is a compact, polished coastal city famous for beaches, food, and walkability. It delivers one of the best short-break football + food combinations in Europe, with everything concentrated around the bay and old town.",

  topThings: [
    {
      title: "La Concha Beach",
      tip: "Morning walk is best before crowds arrive.",
    },
    {
      title: "Parte Vieja (Old Town)",
      tip: "Base for pintxos hopping.",
    },
    {
      title: "Monte Urgull",
      tip: "Free viewpoints over the bay.",
    },
    {
      title: "Monte Igueldo funicular",
      tip: "Classic city viewpoint.",
    },
    {
      title: "Zurriola Beach",
      tip: "Surf-focused beach area.",
    },
    {
      title: "San Telmo Museum",
      tip: "Good Basque culture overview.",
    },
    {
      title: "Boulevard area",
      tip: "Easy walking hub.",
    },
    {
      title: "Pintxos crawl",
      tip: "Small plates, many stops.",
    },
    {
      title: "Evening harbour walk",
      tip: "Relaxed atmosphere.",
    },
    {
      title: "Matchday stroll",
      tip: "Bars around stadium fill steadily.",
    },
  ],

  tips: [
    "One of Spain’s more expensive food cities.",
    "Eat earlier than Madrid but later than UK.",
    "Compact centre—walk almost everywhere.",
    "Book restaurants ahead on weekends.",
    "Bring layers even in summer evenings.",
  ],

  food: [
    "Pintxos",
    "Txuleta steak",
    "Cheesecake (Basque style)",
    "Seafood rice",
  ],

  transport:
    "Walkable centre. Local buses for beaches and stadium.",

  accommodation:
    "Old Town and Centro best for short stays.",

  // Football context
  teams: [
    {
      name: "Real Sociedad",
      teamId: "real-sociedad",
      teamGuidePath: "/team/real-sociedad",
    },
  ],

  // Monetisation entry points
  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  // Fixtures surface hint
  showUpcomingFixtures: true,
},

  pamplona: {
  cityId: "pamplona",
  name: "Pamplona",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187520-Activities-Pamplona_Navarra.html",
  overview:
    "Pamplona is a compact historic city in northern Spain best known for the Running of the Bulls, but year-round it offers a relaxed old town, strong food culture, and an easy football-focused short break.",

  topThings: [
    {
      title: "Plaza del Ayuntamiento",
      tip: "Central old town hub.",
    },
    {
      title: "Ciudadela Park",
      tip: "Green space near centre.",
    },
    {
      title: "Pamplona Cathedral",
      tip: "Historic core landmark.",
    },
    {
      title: "Plaza del Castillo",
      tip: "Good café square.",
    },
    {
      title: "Old Town walk",
      tip: "Easy wandering streets.",
    },
    {
      title: "Bull Run route",
      tip: "Marked path through streets.",
    },
    {
      title: "Tapas crawl",
      tip: "Try several bars.",
    },
    {
      title: "Yamaguchi Park",
      tip: "Quieter park area.",
    },
    {
      title: "Local markets",
      tip: "Good for lunch supplies.",
    },
    {
      title: "Pre-match drinks area",
      tip: "Bars around centre fill first.",
    },
  ],

  tips: [
    "Very walkable centre.",
    "Food quality is high for size of city.",
    "Book hotels early if match + festival periods.",
    "Evenings are relaxed rather than wild.",
    "Small city—1–2 days is ideal.",
  ],

  food: [
    "Pintxos",
    "Chistorra sausage",
    "Lamb stews",
    "Local wine",
  ],

  transport:
    "Walkable centre. Local buses cover suburbs and stadium area.",

  accommodation:
    "Old Town or near Plaza del Castillo works best.",

  // Football context
  teams: [
    {
      name: "Osasuna",
      teamId: "osasuna",
      teamGuidePath: "/team/osasuna",
    },
  ],

  // Monetisation entry points
  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  // Fixtures surface hint
  showUpcomingFixtures: true,
},

  girona: {
  cityId: "girona",
  name: "Girona",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187499-Activities-Girona_Province_of_Girona_Catalonia.html",

  overview:
    "Girona is a beautiful, compact Catalan city with medieval architecture, excellent food culture, and a relaxed pace that suits a football-led weekend perfectly. It offers a strong alternative to Barcelona: cheaper, calmer, highly walkable, and still rich in history, atmosphere, and dining quality. Girona works especially well for short breaks built around a match plus old-town wandering and slow meals.",

  topThings: [
    {
      title: "Girona Cathedral",
      tip: "Climb the steps early morning or near sunset for lighter crowds and better photos. Go inside — the nave is the widest Gothic nave in the world."
    },
    {
      title: "Onyar River Houses",
      tip: "Best viewpoints from Eiffel Bridge and Pont de Pedra. Morning light is best for colour."
    },
    {
      title: "Jewish Quarter (El Call)",
      tip: "Get lost on purpose. Narrow lanes, stone staircases, and hidden courtyards."
    },
    {
      title: "City Walls Walk",
      tip: "Walk the full stretch if weather allows. Great skyline views and easy orientation."
    },
    {
      title: "Plaça de la Independència",
      tip: "Main dining square for lunch or early evening."
    },
    {
      title: "Rambla de la Llibertat",
      tip: "Coffee strip and shopping spine."
    },
    {
      title: "Arab Baths",
      tip: "Quick cultural stop (30 minutes)."
    },
    {
      title: "Sant Feliu Church",
      tip: "Nice interior and river views nearby."
    },
    {
      title: "Devesa Park",
      tip: "Good reset space between sightseeing blocks."
    },
    {
      title: "Pre-match old town walk",
      tip: "Start in centre, walk outward toward stadium area gradually."
    }
  ],

  tips: [
    "Girona is small — plan slow, not stacked itineraries.",
    "Most restaurants close mid-afternoon; plan lunch earlier.",
    "Book top restaurants Fri–Sun.",
    "Comfortable shoes matter (stone streets + steps).",
    "Matchday: eat before heading toward stadium zone.",
    "If flying into Barcelona, train to Girona is simple.",
  ],

  food: [
    "Catalan set-menu lunches",
    "Seafood rice dishes",
    "Tapas & vermouth bars",
    "Bakery breakfast + coffee",
    "Ice cream along the Rambla",
  ],

  transport:
    "Historic centre is fully walkable. Local buses serve outer districts. Trains connect Girona with Barcelona and the Costa Brava region.",

  accommodation:
    "Old Town for atmosphere. Eixample district for modern hotels and easy access. Prioritise walkability over luxury.",

  // Football context
  teams: [
    {
      name: "Girona FC",
      teamId: "girona",
      teamGuidePath: "/team/girona",
    },
  ],

  // Monetisation entry points
  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  // Fixtures surface hint
  showUpcomingFixtures: true,
},

  elche: {
  cityId: "elche",
  name: "Elche",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187524-Activities-Elche_Province_of_Alicante_Valencian_Community.html",

  overview:
    "Elche (Elx) is a relaxed southeastern Spanish city best known for its vast palm groves, UNESCO-listed landscape, and calm everyday rhythm. It suits travellers who want a lower-intensity football weekend combined with warm weather, simple sightseeing, and easy access to beaches via nearby Alicante or Santa Pola. Elche is not about blockbuster attractions — it’s about space, sunshine, and slow, local Spanish living.",

  topThings: [
    {
      title: "Palmeral of Elche (Palm Grove)",
      tip: "Walk the central park paths in the morning or golden hour. It’s the city’s defining feature."
    },
    {
      title: "Huerto del Cura Garden",
      tip: "Paid botanical garden with the famous Imperial Palm. 45–60 minute visit."
    },
    {
      title: "Basilica of Santa Maria",
      tip: "Go inside, then walk around the square for coffee."
    },
    {
      title: "Altamira Palace",
      tip: "Small archaeological museum inside medieval fortress."
    },
    {
      title: "Elche Archaeological Museum (MAHE)",
      tip: "Good context for Iberian and Roman history."
    },
    {
      title: "Municipal Park (Parque Municipal)",
      tip: "Green space near river and palm groves."
    },
    {
      title: "Glorieta area",
      tip: "Central square for cafés and people-watching."
    },
    {
      title: "Shopping streets (Corredora / Major de la Vila)",
      tip: "Compact pedestrian zone."
    },
    {
      title: "Santa Pola beach trip",
      tip: "30 minutes by bus for seaside afternoon."
    },
    {
      title: "Pre-match local bar crawl",
      tip: "Small bars around centre rather than stadium zone."
    }
  ],

  tips: [
    "Elche runs at a slow pace — embrace it.",
    "Most sightseeing fits into half a day.",
    "Lunch menus (menú del día) offer best value.",
    "Shops may close mid-afternoon.",
    "Hydrate well in warmer months.",
    "Evenings start late; dinner 8:30–10pm is normal.",
  ],

  food: [
    "Arroz con costra (local speciality)",
    "Paella / rice dishes",
    "Tapas bars",
    "Bakery breakfast",
    "Seafood near coast",
  ],

  transport:
    "City centre is walkable. Buses connect to beaches and Alicante. Alicante-Elche airport is nearby for arrivals.",

  accommodation:
    "Central Elche for simplicity. Alternatively stay in Alicante and train/bus in for matchday.",

  // Football context
  teams: [
    {
      name: "Elche CF",
      teamId: "elche",
      teamGuidePath: "/team/elche",
    },
  ],

  // Monetisation entry points
  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  // Fixtures surface hint
  showUpcomingFixtures: true,
},

  bilbao: {
  cityId: "bilbao",
  name: "Bilbao",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187454-Activities-Bilbao_Province_of_Vizcaya_Basque_Country.html",

  overview:
    "Bilbao is one of Spain’s best football-trip cities: compact, characterful, food-obsessed, and culturally rich. The city blends industrial heritage with modern architecture and an extremely strong local identity. It works perfectly for 2–3 night breaks combining football, pintxos crawling, and relaxed sightseeing.",

  topThings: [
    {
      title: "Guggenheim Museum Bilbao",
      tip: "Visit early morning or late afternoon. Even if you skip inside, walk the exterior."
    },
    {
      title: "Casco Viejo (Old Town)",
      tip: "Base yourself here for bars, food, and atmosphere."
    },
    {
      title: "Pintxos crawl",
      tip: "Small plates, one drink per bar, move often."
    },
    {
      title: "Ribera Market",
      tip: "Good daytime food stop."
    },
    {
      title: "Zubizuri Bridge",
      tip: "Short riverside walk."
    },
    {
      title: "Funicular to Mount Artxanda",
      tip: "Best city viewpoint."
    },
    {
      title: "San Mamés Stadium exterior",
      tip: "Walk past even on non-matchdays."
    },
    {
      title: "Azkuna Zentroa",
      tip: "Cultural centre with cafés."
    },
    {
      title: "Abando district",
      tip: "Shopping and restaurants."
    },
    {
      title: "Day trip to Getxo coast",
      tip: "If staying longer."
    }
  ],

  tips: [
    "Food culture is elite — budget for eating well.",
    "Book restaurants Friday/Saturday.",
    "Rain is common — pack waterproofs.",
    "Most sightseeing fits in walking radius.",
    "Pre-match bars cluster near San Mamés.",
  ],

  food: [
    "Pintxos",
    "Txuleta steak",
    "Bacalao dishes",
    "Cheesecake Basque-style",
  ],

  transport:
    "Metro and tram are simple. Centre is walkable.",

  accommodation:
    "Old Town or Abando are best bases.",

  teams: [
    {
      name: "Athletic Club Bilbao",
      teamId: "athletic-bilbao",
      teamGuidePath: "/team/athletic-bilbao",
    },
  ],

  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  showUpcomingFixtures: true,
},

  valencia: {
  cityId: "valencia",
  name: "Valencia",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187529-Activities-Valencia_Province_of_Valencia_Valencian_Community.html",

  overview:
    "Valencia blends historic old town, futuristic architecture, and a Mediterranean beach lifestyle into one of Spain’s most rounded football-trip cities. It offers strong sightseeing value, excellent food, reliable transport, and two major football clubs — making it ideal for both short weekend breaks and longer stays.",

  topThings: [
    {
      title: "City of Arts & Sciences",
      tip: "Go early morning or near sunset for best photos and fewer crowds."
    },
    {
      title: "Valencia Cathedral & Miguelete Tower",
      tip: "Climb for city views."
    },
    {
      title: "Central Market (Mercado Central)",
      tip: "Great breakfast or lunch stop."
    },
    {
      title: "Turia Gardens",
      tip: "Walk or cycle through former riverbed park."
    },
    {
      title: "La Lonja de la Seda",
      tip: "Quick historic highlight."
    },
    {
      title: "Malvarrosa Beach",
      tip: "Combine with seafood lunch."
    },
    {
      title: "El Carmen district",
      tip: "Bars, street art, nightlife."
    },
    {
      title: "Oceanogràfic",
      tip: "Half-day attraction if interested."
    },
    {
      title: "Ruzafa neighbourhood",
      tip: "Trendy food and cocktail area."
    },
    {
      title: "Mestalla exterior",
      tip: "Walk past even if not attending match."
    }
  ],

  tips: [
    "This is the home of paella — order paella Valenciana (rabbit/chicken) if you want authentic.",
    "Most attractions are walkable or bikeable.",
    "Evenings start late; dinner after 8pm.",
    "Book match tickets early for big games.",
    "Beaches are best weekday mornings."
  ],

  food: [
    "Paella Valenciana",
    "Seafood rice",
    "Horchata + fartons",
    "Fresh orange juice",
  ],

  transport:
    "Metro links airport to city. Trams run to beach. Bikes popular.",

  accommodation:
    "Old Town for sightseeing, Ruzafa for nightlife, near Mestalla for match-focused stays.",

  teams: [
    {
      name: "Valencia CF",
      teamId: "valencia",
      teamGuidePath: "/team/valencia",
    },
    {
      name: "Levante UD",
      teamId: "levante",
      teamGuidePath: "/team/levante",
    },
  ],

  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  showUpcomingFixtures: true,
},

  "vitoria-gasteiz": {
  cityId: "vitoria-gasteiz",
  name: "Vitoria-Gasteiz",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187457-Activities-Vitoria_Gasteiz_Province_of_Alava_Basque_Country.html",

  overview:
    "Vitoria-Gasteiz is the compact, well-organised capital of Spain’s Basque Country and one of the most liveable cities in the region. It combines a beautifully preserved medieval old town, strong food culture, and a calm, authentic local atmosphere. For football travellers, it offers a relaxed alternative to larger Basque cities while still delivering a proper top-flight matchday experience through Deportivo Alavés.",

  topThings: [
    {
      title: "Medieval Old Town (Casco Viejo)",
      tip: "Start at Plaza de la Virgen Blanca and wander uphill."
    },
    {
      title: "Santa María Cathedral",
      tip: "Guided tours access towers and restoration areas."
    },
    {
      title: "Plaza de la Virgen Blanca",
      tip: "Main social square; good coffee stop."
    },
    {
      title: "Florida Park",
      tip: "Short green break near city centre."
    },
    {
      title: "Basque Pintxos crawl",
      tip: "Stick around Cuchillería Street."
    },
    {
      title: "Green Ring cycle paths",
      tip: "Easy cycling routes around city."
    },
    {
      title: "Museo Artium",
      tip: "Basque modern art focus."
    },
    {
      title: "Los Arquillos",
      tip: "Historic stepped arcades."
    },
    {
      title: "Salburua Wetlands",
      tip: "Nature reserve tram-accessible."
    },
    {
      title: "Mendizorroza area walk",
      tip: "Pre-match stroll near stadium."
    }
  ],

  tips: [
    "City is very walkable.",
    "Pintxos are cheaper than Bilbao/San Sebastián.",
    "Dinner times run late.",
    "Book stadium tickets early for big opponents.",
    "Expect quiet nightlife midweek."
  ],

  food: [
    "Pintxos",
    "Txuleta steak",
    "Basque cheesecake",
    "Local Rioja Alavesa wine"
  ],

  transport:
    "Compact city; walking covers most areas. Trams and buses reliable.",

  accommodation:
    "Stay near Old Town or along tram lines for easy stadium access.",

  teams: [
    {
      name: "Deportivo Alavés",
      teamId: "alaves",
      teamGuidePath: "/team/alaves",
    }
  ],

  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  showUpcomingFixtures: true,
},

    "getafe": {
  cityId: "getafe",
  name: "Getafe",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g562657-Activities-Getafe.html",

  overview:
    "Getafe is a working-class city immediately south of Madrid that functions primarily as a residential and football-focused destination rather than a classic tourist base. Most visitors will treat Getafe as a matchday satellite of Madrid: you stay or spend time in Madrid proper, then travel into Getafe specifically for the football. That dynamic suits short breaks perfectly — combine big-city sightseeing with a smaller-city La Liga matchday experience.",

  topThings: [
    {
      title: "Coliseum Stadium area",
      tip: "Arrive at least 60–90 minutes before kickoff. There are limited attractions around the ground itself, so use this time for food, drinks, and soaking up pre-match atmosphere rather than sightseeing."
    },
    {
      title: "Getafe city centre (Plaza General Palacio)",
      tip: "Small but walkable hub with cafés, bakeries, and everyday Spanish life. Useful for a casual pre-match coffee or lunch."
    },
    {
      title: "Cerro de los Ángeles",
      tip: "Symbolic geographical centre of Spain. Best visited by taxi or rideshare if you have spare time and want a quiet viewpoint."
    },
    {
      title: "Juan Carlos I Park (Madrid)",
      tip: "Large modern park reachable via Metro if you are staying south of Madrid."
    },
    {
      title: "Madrid city day exploration",
      tip: "Treat Madrid itself as your main sightseeing base: museums, parks, neighbourhood walks, and food scenes."
    },
    {
      title: "La Latina tapas zone (Madrid)",
      tip: "Excellent pre-evening match food option if kickoff is late."
    },
    {
      title: "Malasaña nightlife (Madrid)",
      tip: "Better for post-match drinks than staying in Getafe."
    },
    {
      title: "Retiro Park (Madrid)",
      tip: "Good daytime break between sightseeing blocks."
    },
    {
      title: "Bernabéu / Metropolitano areas",
      tip: "If combining multiple matches, cluster Madrid stadium visits efficiently."
    },
    {
      title: "Local neighbourhood bars",
      tip: "Stick to busy, simple bars with locals rather than empty tourist-facing venues."
    }
  ],

  tips: [
    "Base yourself in Madrid unless you have a specific reason to stay overnight in Getafe. Transport links are fast and reliable.",
    "Use Metro Line 12 (MetroSur) or Cercanías trains to reach Getafe; check return times for late kickoffs.",
    "Eat in Madrid before travelling to the stadium area if you want broader choice.",
    "Expect a more traditional, no-frills stadium environment rather than a polished tourist experience.",
    "Allow buffer time on matchdays because MetroSur trains can become busy close to kickoff.",
    "If attending a high-profile opponent match, secure tickets earlier than usual.",
    "Spanish dinner runs late — plan food around kickoff rather than after if you dislike eating at 10pm+.",
    "Cash is still useful in smaller neighbourhood bars.",
    "Wear comfortable shoes: you’ll likely combine heavy walking in Madrid with transit to Getafe.",
    "Treat Getafe as a football stop, not a sightseeing destination."
  ],

  food: [
    "Traditional Spanish menus del día",
    "Grilled meats",
    "Simple tapas (patatas bravas, croquettes, calamari)",
    "Coffee + pastries from local bakeries"
  ],

  transport:
    "Getafe is connected by Metro Line 12 (MetroSur), Cercanías trains, and buses. From central Madrid, expect roughly 30–40 minutes travel time. Walking inside Getafe is straightforward once you arrive.",

  accommodation:
    "Stay in Madrid city centre or along Metro Line 12 / Cercanías routes. Only stay in Getafe itself if price or proximity to the stadium is a priority.",

  teams: [
    {
      name: "Getafe CF",
      teamId: "getafe",
      teamGuidePath: "/team/getafe",
    }
  ],

  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  showUpcomingFixtures: true,
},

    "palma-de-mallorca": {
  cityId: "palma-de-mallorca",
  name: "Palma de Mallorca",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187463-Activities-Palma_de_Mallorca_Majorca_Balearic_Islands.html",

  overview:
    "Palma de Mallorca combines beach city energy with a historic old town and strong food scene, making it one of the easiest Mediterranean football trips to turn into a short holiday. It works well for travellers who want a balance of sightseeing, relaxed daytime pacing, and an evening match — without needing a packed itinerary.",

  topThings: [
    {
      title: "Palma Cathedral (La Seu)",
      tip: "Visit early morning for fewer crowds and better light. Combine with a walk along the seafront afterwards."
    },
    {
      title: "Old Town (Casco Antiguo)",
      tip: "Wander without a rigid route. The value is in small squares, cafés, and shaded streets rather than ticking landmarks."
    },
    {
      title: "Passeig del Born",
      tip: "Good daytime stroll and evening atmosphere zone with cafés and bars."
    },
    {
      title: "Bellver Castle",
      tip: "Offers elevated views over Palma. Taxi or bus recommended unless you enjoy uphill walks."
    },
    {
      title: "Port of Palma promenade",
      tip: "Nice sunset walk; pair with drinks or dinner afterwards."
    },
    {
      title: "City beach (Can Pere Antoni)",
      tip: "Closest beach to the centre. Convenient rather than spectacular."
    },
    {
      title: "Cala Major",
      tip: "Better swimming beach reachable by bus or taxi."
    },
    {
      title: "Santa Catalina neighbourhood",
      tip: "One of the best food and bar areas in Palma."
    },
    {
      title: "Mercat de l’Olivar",
      tip: "Good daytime food stop or ingredient browsing."
    },
    {
      title: "Matchday area (Estadi Mallorca Son Moix)",
      tip: "Plan transport ahead; it’s outside the central walking zone."
    }
  ],

  tips: [
    "Palma is compact enough to walk most central areas comfortably.",
    "Beach + city split days work better than trying to do everything in one block.",
    "Book restaurants for Friday and Saturday nights in peak season.",
    "Allow buffer time getting to Son Moix — it’s not central.",
    "If visiting in summer, do sightseeing early and late; rest midday.",
    "Tap water is drinkable.",
    "Light clothing plus one warmer layer for evenings outside peak summer.",
    "Matchday transport back can be slow; expect queues."
  ],

  food: [
    "Seafood rice dishes",
    "Pa amb oli",
    "Tapas",
    "Mallorcan pastries (ensaimadas)",
    "Mediterranean fish restaurants"
  ],

  transport:
    "Palma has a good bus network and cheap taxis. From the centre to Son Moix, allow roughly 20–30 minutes by taxi or bus depending on traffic.",

  accommodation:
    "Best areas: Old Town, Santa Catalina, or near Passeig del Born. Prioritise walkable access to food and nightlife rather than stadium proximity.",

  teams: [
    {
      name: "RCD Mallorca",
      teamId: "mallorca",
      teamGuidePath: "/team/mallorca",
    }
  ],

  bookingLinks: {
    hotels: true,
    flights: true,
    trains: false,
    experiences: true,
  },

  showUpcomingFixtures: true,
},

    "oviedo": {
  cityId: "oviedo",
  name: "Oviedo",
  country: "Spain",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187454-Activities-Oviedo_Asturias.html",

  overview:
    "Oviedo is a compact, elegant northern Spanish city with a historic centre, strong food culture, and a relaxed pace compared to Spain’s southern and coastal hubs. It suits travellers who prefer culture, walkability, and traditional Spanish atmosphere rather than beach-focused itineraries.",

  topThings: [
    {
      title: "Oviedo Old Town",
      tip: "Walkable in under two hours, but allow longer for cafés, shops, and small plazas."
    },
    {
      title: "Cathedral of San Salvador",
      tip: "Central landmark; combine with Old Town wandering."
    },
    {
      title: "Campo de San Francisco Park",
      tip: "Good green break between sightseeing blocks."
    },
    {
      title: "Statue Trail",
      tip: "Oviedo’s streets are dotted with sculptures — treat it as a casual scavenger hunt."
    },
    {
      title: "Monte Naranco viewpoints",
      tip: "Taxi or bus recommended for hilltop views and monuments."
    },
    {
      title: "Sidrerías (cider houses)",
      tip: "Core Asturian experience — try several small pours rather than one big order."
    },
    {
      title: "Plaza del Fontán",
      tip: "Lively square with bars and restaurants."
    },
    {
      title: "Shopping streets (Calle Uría)",
      tip: "Good central spine connecting areas."
    },
    {
      title: "Pre-match bar stop",
      tip: "Look near city centre before heading out."
    },
    {
      title: "Matchday at Estadio Carlos Tartiere",
      tip: "Modern stadium outside the historic core."
    }
  ],

  tips: [
    "Oviedo is easy to explore entirely on foot.",
    "Food quality is high across the city; avoid tourist-only menus near main monuments.",
    "Cider is traditionally poured from height — don’t be surprised.",
    "Evenings are lively but not rowdy.",
    "Bring a light rain jacket; northern Spain is greener for a reason.",
    "Allow 25–30 minutes to reach the stadium.",
    "Book restaurants Friday and Saturday nights.",
    "Cash still useful in smaller bars."
  ],

  food: [
    "Fabada asturiana",
    "Chorizo in cider",
    "Seafood stews",
    "Local cheeses",
    "Sidra (cider)"
  ],

  transport:
    "City centre is walkable. Buses and taxis connect to Carlos Tartiere in around 20–30 minutes.",

  accommodation:
    "Stay near Old Town or Plaza del Fontán for best atmosphere and walkability.",

  teams: [
    {
      name: "Real Oviedo",
      teamId: "real-oviedo",
      teamGuidePath: "/team/real-oviedo",
    }
  ],

  bookingLinks: {
    hotels: true,
    flights: true,
    trains: true,
    experiences: true,
  },

  showUpcomingFixtures: true,
},

    };

export default laLigaCityGuides;
