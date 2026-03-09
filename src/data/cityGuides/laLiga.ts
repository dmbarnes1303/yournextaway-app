// src/data/cityGuides/laLiga.ts
import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
 *
 * If a city doesn't have a clean GYG city landing page, leave it undefined and
 * let UI fall back to buildAffiliateLinks({ city }).experiencesUrl.
 */
const GYG = {
  barcelona: "https://www.getyourguide.com/en-gb/barcelona-l45/?partner_id=MAQJREP&utm_medium=online_publisher",
  madrid: "https://www.getyourguide.com/en-gb/madrid-l46/?partner_id=MAQJREP&utm_medium=online_publisher",
  bilbao: "https://www.getyourguide.com/en-gb/bilbao-l93/?partner_id=MAQJREP&utm_medium=online_publisher",
  valencia: "https://www.getyourguide.com/en-gb/valencia-l49/?partner_id=MAQJREP&utm_medium=online_publisher",
  seville: "https://www.getyourguide.com/en-gb/seville-l48/?partner_id=MAQJREP&utm_medium=online_publisher",
  "san-sebastian":
    "https://www.getyourguide.com/en-gb/san-sebastian-l94/?partner_id=MAQJREP&utm_medium=online_publisher",
  // Palma city landing exists but the slug can vary; this ID-based page is stable.
  "palma-de-mallorca": "https://www.getyourguide.com/en-gb/-l1260/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const laLigaCityGuides: Record<string, CityGuide> = {
  barcelona: {
    cityId: "barcelona",
    name: "Barcelona",
    country: "Spain",
    thingsToDoUrl: GYG.barcelona,

    overview:
      "Barcelona is football + Mediterranean city life done properly: walkable neighbourhoods, great metro coverage, and enough standout sights to fill a weekend without over-planning. The win is pacing—cluster your days by area, book the one or two big attractions you care about, and keep matchday logistics boring and predictable.",

    topThings: [
      { title: "Sagrada Família", tip: "Book timed entry ahead. Early morning or late afternoon is the cleanest crowd profile." },
      { title: "Gothic Quarter wander", tip: "Use Las Ramblas only as a corridor—your time belongs in the side streets." },
      { title: "Park Güell", tip: "Get tickets online. If sold out, the upper/free areas still deliver strong viewpoints." },
      { title: "El Born evenings", tip: "Pick one dinner booking, then let the rest be pintxo/tapas-style roaming." },
      { title: "Montjuïc half-day loop", tip: "Cable car + castle + Olympic area works as one coherent block." },
      { title: "La Boqueria market", tip: "Go early and walk past the first few stalls; the front row is tourist pricing." },
      { title: "Beach reset (Barceloneta)", tip: "Morning is calmer. Afternoon can be noisy—choose it intentionally." },
      { title: "Modernisme house (Casa Batlló OR Casa Milà)", tip: "Choose one unless you’re genuinely architecture-obsessed." },
      { title: "Rooftop sunset", tip: "Hotel rooftops often beat crowded viewpoints for comfort + views." },
      { title: "Matchday neighbourhood walk", tip: "Arrive early and walk the stadium area. The build-up is part of the experience." },
    ],

    tips: [
      "Dinner runs late (8:30pm+). Don’t panic—plan around it.",
      "Pickpocket risk is real in tourist corridors. Zip pockets + cross-body bag.",
      "Metro is faster than taxis during peak congestion.",
      "Book big attractions for weekends—walk-ins get punished.",
      "Avoid photo-menu restaurants in the busiest tourist strips.",
      "On matchdays, build buffer time for metro queues near the ground.",
    ],

    food: [
      "Tapas in El Born",
      "Seafood rice near the coast",
      "Jamón + pan con tomate",
      "Bakeries for quick breakfast",
      "Late-night churros and chocolate",
    ],

    transport:
      "Metro is simple and extensive. Walking is best in Ciutat Vella/Eixample. If you’ll do multiple rides, a multi-journey/multi-day option usually pays back quickly.",

    accommodation:
      "Best bases: Eixample for convenience, El Born for atmosphere, Poble-sec for value. Prioritise being near a strong metro line over being ‘near the beach’.",
  },

  madrid: {
    cityId: "madrid",
    name: "Madrid",
    country: "Spain",
    thingsToDoUrl: GYG.madrid,

    overview:
      "Madrid is one of Europe’s best football-weekend cities: lively late, walkable central districts, and neighbourhoods that feel distinct without needing long travel. Build days around food and one strong cultural block, then let the evening carry itself.",

    topThings: [
      { title: "Prado Museum", tip: "Go early. Pick 2–3 sections rather than trying to ‘complete’ it." },
      { title: "Retiro Park", tip: "Perfect mid-day reset between sightseeing blocks." },
      { title: "Gran Vía after dark", tip: "The street reads better at night—lights, energy, people." },
      { title: "Sol → Plaza Mayor loop", tip: "Quick photos, then move on. Don’t burn prime time here." },
      { title: "Temple of Debod sunset", tip: "Arrive early for space; it’s small but scenic." },
      { title: "La Latina tapas", tip: "Late afternoon into evening is the sweet spot." },
      { title: "Malasaña night", tip: "Bars wake up after 10pm—don’t show up at 8 and call it dead." },
      { title: "One rooftop terrace", tip: "Skyline views without a museum-style queue." },
      { title: "Neighbourhood coffee loop", tip: "Madrid is a ‘walk and stop’ city. Keep it loose and it’s better." },
      { title: "Matchday approach", tip: "Plan your transport in/out. Post-match crowds make improvisation expensive." },
    ],

    tips: [
      "Lunch is often 2–4pm; dinner 8:30pm onwards—plan meals, don’t fight the rhythm.",
      "Metro beats taxis when the city is busy.",
      "Build days by neighbourhood (not scattered pins on a map).",
      "Book stadium tours and popular restaurants on weekends.",
      "Carry a bit of cash for small cafés/bakeries.",
    ],

    food: [
      "Bocadillo de calamares",
      "Churros con chocolate",
      "Jamón ibérico",
      "Tortilla española",
      "Vermouth bars",
    ],

    transport:
      "Madrid Metro is extensive and easy. Walking covers the centre well; use metro for longer jumps and to avoid wasting time in traffic.",

    accommodation:
      "Best bases: Sol/Gran Vía for first-timers, Malasaña for nightlife, Salamanca for quieter upscale. Prioritise walkability to food + metro access.",
  },

  bilbao: {
    cityId: "bilbao",
    name: "Bilbao",
    country: "Spain",
    thingsToDoUrl: GYG.bilbao,

    overview:
      "Bilbao is elite for football trips: compact, characterful, and built around food. It’s a city where a simple plan wins—one cultural anchor, one long pintxos evening, and a matchday that’s calm because logistics are easy.",

    topThings: [
      { title: "Guggenheim (inside or just exterior loop)", tip: "Even if you skip entry, do the riverside exterior walk—high impact, low time." },
      { title: "Casco Viejo (Old Town)", tip: "Base for bars and atmosphere. Wander, don’t route-plan." },
      { title: "Pintxos crawl", tip: "One drink + one bite, then move. Don’t camp in one place." },
      { title: "Ribera Market", tip: "Strong daytime food stop. Go hungry." },
      { title: "Mount Artxanda viewpoint", tip: "Best city overview. Ideal before dinner." },
      { title: "Riverside walk", tip: "A simple connector that makes the city feel coherent." },
      { title: "Azkuna Zentroa", tip: "Good indoor reset and coffee stop." },
      { title: "Abando district", tip: "Shopping + nicer hotels; good ‘base’ area." },
      { title: "Coastal add-on (Getxo)", tip: "If you have a spare half-day, it’s a strong contrast to the city core." },
      { title: "Matchday approach", tip: "Arrive early and walk the stadium area—Bilbao build-up is quality." },
    ],

    tips: [
      "Budget to eat well—this is a food city.",
      "Rain is common; pack a light waterproof.",
      "Book Friday/Saturday dinner if you want a specific restaurant.",
      "Most of the core is walkable—taxis are usually unnecessary.",
      "Treat pintxos as a ‘many stops’ game, not one big meal.",
    ],

    food: ["Pintxos", "Txuleta steak", "Bacalao dishes", "Basque cheesecake"],

    transport:
      "Metro and tram are simple. Walking covers most central routes. Use public transport for coast/outskirts rather than taxis.",

    accommodation:
      "Old Town for atmosphere, Abando for convenience and hotel choice. Prioritise walkability to food + easy transit.",
  },

  valencia: {
    cityId: "valencia",
    name: "Valencia",
    country: "Spain",
    thingsToDoUrl: GYG.valencia,

    overview:
      "Valencia is one of Spain’s most rounded weekend cities: historic old town, futuristic architecture, and beach lifestyle in a single place. It’s easy to structure days cleanly—one culture block, one food block, one sea-air reset—and still have plenty left for matchday.",

    topThings: [
      { title: "City of Arts & Sciences", tip: "Go early or near sunset for the best photos and fewer crowds." },
      { title: "Central Market (Mercado Central)", tip: "Best for breakfast/lunch supplies. Don’t go when you’re already full." },
      { title: "Turia Gardens", tip: "Walk or cycle; it’s the city’s best ‘reset’ corridor." },
      { title: "Cathedral + Miguelete Tower", tip: "Climb for orientation—then the city makes more sense." },
      { title: "La Lonja de la Seda", tip: "Quick historic highlight with high payoff." },
      { title: "Ruzafa", tip: "Strong food/cocktail neighbourhood; ideal evening base." },
      { title: "El Carmen", tip: "Old streets + bars; best at night." },
      { title: "Malvarrosa Beach", tip: "Weekday mornings are calm. Pair with seafood lunch." },
      { title: "Paella proper", tip: "Do it once, do it well—avoid tourist strip traps." },
      { title: "Matchday timing", tip: "Eat before heading to the stadium area—post-match kitchens can be chaos." },
    ],

    tips: [
      "This is paella territory—order intentionally (and don’t expect it in 10 minutes).",
      "Dinner runs late; plan one earlier meal if you hate 10pm dining.",
      "City centre is walkable; use metro/tram for beach and longer jumps.",
      "Book Fri/Sat restaurants if you care where you eat.",
      "Heat can be serious in summer—do sightseeing early/late.",
    ],

    food: ["Paella Valenciana", "Seafood rice", "Horchata + fartons", "Fresh orange juice", "Tapas in Ruzafa"],

    transport:
      "Metro links airport; trams run to the beach. Walking covers the central core. Bikes are popular for the Turia corridor.",

    accommodation:
      "Old Town for sightseeing, Ruzafa for nightlife/food, or near the centre for a clean all-round base. Prioritise walkability over ‘luxury’ rooms.",
  },

  seville: {
    cityId: "seville",
    name: "Seville",
    country: "Spain",
    thingsToDoUrl: GYG.seville,

    overview:
      "Seville is high-impact: historic architecture, intense street life, and a food culture built for roaming and small plates. It’s perfect for football trips because the centre is walkable and the atmosphere is consistent day to night.",

    topThings: [
      { title: "Cathedral & Giralda", tip: "Go early. The tower views are worth the effort." },
      { title: "Real Alcázar", tip: "Timed tickets in advance—walk-ins get destroyed in peak periods." },
      { title: "Plaza de España", tip: "Best at sunrise or sunset. Midday heat can be brutal." },
      { title: "Barrio Santa Cruz", tip: "Wander without a route; it’s built for getting slightly lost." },
      { title: "Triana", tip: "Cross the river for a more local-feeling evening." },
      { title: "Metropol Parasol (Las Setas)", tip: "Strong sunset viewpoint if you time it right." },
      { title: "Tapas crawl", tip: "Small orders, many stops. Don’t turn it into one long sit-down." },
      { title: "Flamenco (small venue)", tip: "Book a smaller spot; big tourist shows are often sterile." },
      { title: "Guadalquivir river walk", tip: "Easy evening reset and a clean connector between areas." },
      { title: "Matchday build-up", tip: "Arrive early; the stadium-area atmosphere builds properly here." },
    ],

    tips: [
      "Summer heat is no joke—start early and rest midday.",
      "Some places still run siesta hours; plan meals around closures.",
      "Walkability is a superpower here—don’t overuse taxis.",
      "Derby weeks tighten tickets and hotels quickly—book early.",
      "Aim for one ‘anchor’ booking each day, then roam.",
    ],

    food: ["Jamón ibérico", "Salmorejo", "Croquetas", "Espinacas con garbanzos", "Vermouth + olives"],

    transport:
      "Walking covers the core. Buses handle longer jumps; metro is limited but useful in specific corridors.",

    accommodation:
      "Old Town for first visits; Triana for a slightly calmer base with strong local vibe. Keep it walkable and your trip becomes effortless.",
  },

  "san-sebastian": {
    cityId: "san-sebastian",
    name: "San Sebastián",
    country: "Spain",
    thingsToDoUrl: GYG["san-sebastian"],

    overview:
      "San Sebastián (Donostia) is compact, polished, and built around food. It’s one of the best ‘football + eating’ weekends in Europe because the city is walkable, the bay is stunning, and you don’t need logistics to have a great time.",

    topThings: [
      { title: "La Concha bay walk", tip: "Do it early morning for calm and clean photos." },
      { title: "Parte Vieja (Old Town)", tip: "The correct plan is pintxos roaming, not one big sit-down meal." },
      { title: "Monte Urgull viewpoints", tip: "Free, easy, and gives instant orientation." },
      { title: "Monte Igueldo funicular", tip: "Classic viewpoint; best in clear weather." },
      { title: "Zurriola Beach", tip: "Surf vibe and a calmer alternative to the main bay." },
      { title: "San Telmo Museum", tip: "Good Basque context without being a time sink." },
      { title: "Harbour evening loop", tip: "Low effort, high vibe after dinner." },
      { title: "One booked restaurant", tip: "If you want a specific place, reserve. Walk-ins get punished." },
      { title: "Coffee + pastry morning", tip: "This city rewards slow mornings." },
      { title: "Matchday timing", tip: "Bars fill steadily—arrive early if you want your pick of spots." },
    ],

    tips: [
      "It can be pricier than other Spanish cities—budget accordingly.",
      "Walk almost everywhere; taxis are rarely necessary.",
      "Book weekends if you care where you eat.",
      "Even summer evenings can be cool—bring a layer.",
      "If weather is poor, pivot to food and museums, not forced viewpoints.",
    ],

    food: ["Pintxos", "Txuleta steak", "Basque cheesecake", "Seafood rice dishes"],

    transport:
      "Walkable centre; buses cover beaches and outer areas. Keep your base central and you won’t think about transport.",

    accommodation:
      "Centro or Old Town for short stays. Prioritise location over room size—your time will be outside eating.",
  },

  // Smaller / less consistently indexed by GYG city landing pages → leave thingsToDoUrl undefined.
  // UI will fall back to buildAffiliateLinks({ city }).experiencesUrl.

  villarreal: {
    cityId: "villarreal",
    name: "Villarreal",
    country: "Spain",

    overview:
      "Villarreal is a compact football town that’s best treated as a relaxed base: simple matchday logistics, easy walking, and quick access to the wider Castellón coast. The trip works when you keep expectations realistic—this is football + calm Spanish rhythm, not a headline attraction city.",

    topThings: [
      { title: "Town centre loop", tip: "You can cover the core quickly—use it as a vibe check, not an all-day plan." },
      { title: "Plaza Mayor coffee stop", tip: "Best simple people-watching base." },
      { title: "Local tapas near centre", tip: "Choose busy local bars; quiet tourist-facing spots are weaker." },
      { title: "Short walk before matchday", tip: "A calm pre-match reset makes the day feel like a ‘trip’ not just a game." },
      { title: "Castellón de la Plana add-on", tip: "Easy for broader dining and nightlife choice." },
      { title: "Coast half-day (if staying longer)", tip: "Pair beach time with seafood lunch to make the weekend feel bigger." },
      { title: "Evening stroll", tip: "Spanish small-city evenings are built for slow walking + stopping." },
      { title: "Matchday bar timing", tip: "Arrive earlier than you think if you want seating." },
      { title: "Post-match exit plan", tip: "Have a plan for trains/taxis if returning to Castellón—surges happen." },
      { title: "One strong meal booking", tip: "A single reservation makes the whole trip feel organised." },
    ],

    tips: [
      "Don’t over-plan—small city rhythm wins here.",
      "If you want hotel choice, Castellón is often the smarter base.",
      "Basic Spanish helps more than in big tourist hubs.",
      "After the match, transport back can spike—leave buffer time.",
      "Treat it as football-led and it delivers.",
    ],

    food: ["Tapas", "Seafood rice dishes", "Simple grills", "Local bakeries for breakfast"],

    transport:
      "Walking covers most of Villarreal. Regional rail/bus connections make Castellón and the coast easy if you plan timings.",

    accommodation:
      "Limited central hotel stock—Castellón can be a practical base if prices/availability are better.",
  },

  vigo: {
    cityId: "vigo",
    name: "Vigo",
    country: "Spain",

    overview:
      "Vigo is a working Atlantic port city in Galicia: less tourist gloss, more authenticity, excellent seafood, and a calm everyday rhythm. It’s ideal if you want a real local-feeling football weekend instead of a highlight-reel city break.",

    topThings: [
      { title: "Casco Vello (Old Town)", tip: "Walk uphill from the port for bars and viewpoints." },
      { title: "Monte O Castro viewpoint", tip: "Best panoramic view over the bay." },
      { title: "Port & marina evening walk", tip: "Strong low-effort sunset loop." },
      { title: "Seafood in O Berbés", tip: "Pick busy local spots—Galicia does seafood properly." },
      { title: "Samil Beach", tip: "Best city beach option; calmer earlier in the day." },
      { title: "Day trip (Cíes Islands, seasonal)", tip: "Book ahead in summer if you want it—capacity can be limited." },
      { title: "Praza da Constitución", tip: "Good café base in the centre." },
      { title: "Market visit", tip: "Morning is best for energy and atmosphere." },
      { title: "Neighbourhood bar crawl", tip: "Small bars beat ‘designed’ tourist venues here." },
      { title: "Matchday pre-walk", tip: "Arrive early and let the build-up happen around the ground." },
    ],

    tips: [
      "Expect more rain than southern Spain—bring a light waterproof.",
      "English is less common; basic Spanish helps.",
      "Seafood is the move—don’t waste meals on generic options.",
      "Walking shoes matter (hills).",
      "Keep plans simple and the city shines.",
    ],

    food: ["Pulpo a la gallega", "Shellfish", "Empanadas", "Seafood stews"],

    transport:
      "Centre is walkable; buses and taxis fill gaps. Don’t over-think it—Vigo is straightforward.",

    accommodation:
      "Old Town or waterfront areas give the best atmosphere and easiest evenings.",
  },

  pamplona: {
    cityId: "pamplona",
    name: "Pamplona",
    country: "Spain",

    overview:
      "Pamplona is compact and historic with a strong food culture. Outside festival periods it’s calm, walkable, and perfect for a short football-led break where you want good eating, easy logistics, and zero stress.",

    topThings: [
      { title: "Plaza del Castillo", tip: "The natural base for coffee and a slow start." },
      { title: "Old Town walk", tip: "Wander without a route—the streets are the point." },
      { title: "Cathedral area", tip: "Quick cultural stop that anchors the historic core." },
      { title: "Ciudadela Park", tip: "Good green reset between food blocks." },
      { title: "Pintxos crawl", tip: "Small plates, many stops—don’t do one giant meal." },
      { title: "Bull Run route (seasonal context)", tip: "Worth a quick look for the story even if you’re not here in July." },
      { title: "Local markets", tip: "Good for casual lunch supplies." },
      { title: "Evening squares", tip: "The city comes alive in concentrated pockets—easy night." },
      { title: "Pre-match plan", tip: "Eat earlier; queues and packed kitchens are common on matchdays." },
      { title: "Post-match move", tip: "Either leave cleanly or commit to one bar—don’t hover in the surge zone." },
    ],

    tips: [
      "Very walkable—taxis are rarely needed.",
      "Book early if you overlap with festival periods.",
      "Food quality is high; avoid tourist traps near the most obvious squares.",
      "Evenings are lively but not chaotic.",
      "1–2 days is the ideal pace.",
    ],

    food: ["Pintxos", "Chistorra sausage", "Local stews", "Navarra wines"],

    transport:
      "Walkable centre; local buses cover outer areas. Simple city, simple logistics.",

    accommodation:
      "Old Town or near Plaza del Castillo gives the best short-break feel.",
  },

  girona: {
    cityId: "girona",
    name: "Girona",
    country: "Spain",

    overview:
      "Girona is a compact Catalan gem: medieval streets, great food, and a calm pace that suits football-led weekends perfectly. It’s the right choice when you want ‘Barcelona energy’ nearby without Barcelona intensity and prices.",

    topThings: [
      { title: "Girona Cathedral", tip: "Go early or near sunset for lighter crowds and better photos." },
      { title: "Jewish Quarter (El Call)", tip: "Get lost on purpose—this area rewards wandering." },
      { title: "City Walls walk", tip: "Do the full stretch if weather allows—best skyline views." },
      { title: "Onyar River houses", tip: "Best viewpoints from Pont de Pedra and Eiffel Bridge." },
      { title: "Plaça de la Independència", tip: "Ideal lunch/dinner square—simple choice that works." },
      { title: "Rambla de la Llibertat", tip: "Coffee strip and walking spine." },
      { title: "Arab Baths", tip: "Quick cultural hit (30–45 minutes). Don’t overcommit." },
      { title: "Devesa Park", tip: "Good reset space between sightseeing blocks." },
      { title: "Slow evening roam", tip: "Girona evenings are built for walking + stopping, not rushing." },
      { title: "Matchday pacing", tip: "Eat before heading toward the stadium area. Keep it calm." },
    ],

    tips: [
      "Girona is small—plan slow rather than stacking 10 things.",
      "Stone streets and steps: comfortable shoes matter.",
      "Book Fri–Sun dining if you care where you eat.",
      "If arriving via Barcelona, train logistics are simple—don’t overthink it.",
      "The win is calm + quality meals + atmosphere.",
    ],

    food: ["Catalan set-menu lunches", "Tapas & vermouth bars", "Bakery breakfast + coffee", "Ice cream along the Rambla"],

    transport:
      "Historic centre is fully walkable. Trains connect Girona with Barcelona and wider Catalonia.",

    accommodation:
      "Old Town for atmosphere, Eixample for modern hotels and easy access. Location beats luxury here.",
  },

  elche: {
    cityId: "elche",
    name: "Elche",
    country: "Spain",

    overview:
      "Elche (Elx) is relaxed and sunny, best known for its UNESCO-listed palm groves and everyday Spanish rhythm. It’s a football weekend for travellers who want low intensity: warm weather, simple sightseeing, and easy access to the Alicante coast.",

    topThings: [
      { title: "Palmeral (Palm Grove) walk", tip: "Do it in the morning or golden hour—this is the city’s signature." },
      { title: "Huerto del Cura", tip: "45–60 minutes is enough. It’s a clean paid garden visit with a standout ‘Imperial Palm’." },
      { title: "Basilica of Santa Maria", tip: "Quick stop, then coffee nearby." },
      { title: "Altamira Palace area", tip: "Small historic block—good context without being a time sink." },
      { title: "MAHE (archaeology museum)", tip: "A solid indoor option if heat or weather turns." },
      { title: "Central squares (Glorieta)", tip: "People-watching and cafés—simple but effective." },
      { title: "Shopping streets", tip: "Compact pedestrian zones; don’t burn prime hours here." },
      { title: "Santa Pola beach add-on", tip: "Short bus ride for sea air and a seafood lunch." },
      { title: "Menú del día lunch", tip: "Best value meal format—use it." },
      { title: "Matchday bar plan", tip: "Choose busy local bars near centre rather than hunting ‘stadium attractions’." },
    ],

    tips: [
      "Elche is calm—embrace the slower rhythm.",
      "Most sightseeing fits half a day; don’t force a packed plan.",
      "Shops can close mid-afternoon (siesta effect).",
      "Hydration matters in hot months—plan shade breaks.",
      "Dinner runs late as standard.",
    ],

    food: ["Arroz con costra (local)", "Rice dishes", "Tapas", "Bakery breakfasts", "Seafood near the coast"],

    transport:
      "Centre is walkable; buses connect to the coast and Alicante. Alicante–Elche airport proximity is a practical bonus.",

    accommodation:
      "Central Elche for simplicity, or base in Alicante for more hotel choice and do Elche as matchday.",
  },

  "vitoria-gasteiz": {
    cityId: "vitoria-gasteiz",
    name: "Vitoria-Gasteiz",
    country: "Spain",

    overview:
      "Vitoria-Gasteiz is compact, tidy, and quietly brilliant: a medieval old town, strong pintxos culture, and a calm local vibe that makes football weekends feel easy. It’s a great Basque option if you want authenticity without the intensity (and prices) of the bigger neighbours.",

    topThings: [
      { title: "Casco Viejo (Medieval Old Town)", tip: "Start at Plaza de la Virgen Blanca and wander uphill." },
      { title: "Santa Maria Cathedral", tip: "Guided tour is the best version—don’t just do a quick exterior photo." },
      { title: "Cuchillería Street pintxos", tip: "Keep it to many small stops, not one big sit-down." },
      { title: "Florida Park", tip: "Short green reset near the centre." },
      { title: "Los Arquillos", tip: "A quick ‘this is different’ architectural moment." },
      { title: "Museo Artium", tip: "Modern art option if you want one cultural anchor." },
      { title: "Green Ring paths", tip: "Good if you want a light walk outside the centre." },
      { title: "Coffee loop", tip: "This city rewards slow mornings." },
      { title: "Pre-match pacing", tip: "Eat earlier, then drift towards the stadium area calmly." },
      { title: "Post-match plan", tip: "Commit to one bar or leave cleanly—don’t get trapped in the surge." },
    ],

    tips: [
      "Very walkable; taxis are rarely necessary.",
      "Pintxos can be better value than Bilbao/San Sebastián.",
      "Dinner runs late; plan accordingly.",
      "Quiet midweek nightlife—weekend is livelier.",
      "Keep the plan simple and it’s a perfect 1–2 night stop.",
    ],

    food: ["Pintxos", "Txuleta steak", "Basque cheesecake", "Rioja Alavesa wine"],

    transport:
      "Walking covers most of what you want. Trams and buses are reliable for longer jumps.",

    accommodation:
      "Old Town/centre is the best base. Prioritise walkability to food and a simple matchday route.",
  },

  getafe: {
    cityId: "getafe",
    name: "Getafe",
    country: "Spain",

    overview:
      "Getafe is essentially a matchday satellite of Madrid. Treat it that way: stay and sightsee in Madrid, then travel into Getafe for the football. If you try to make Getafe a standalone tourist base, you’ll be forcing it.",

    topThings: [
      { title: "Madrid as your main city block", tip: "Do the culture/food/neighbourhood time in Madrid, not here." },
      { title: "Simple pre-match plan", tip: "Eat in Madrid or near Getafe centre before heading to the ground." },
      { title: "Local café stop", tip: "Getafe centre is fine for coffee and a calm start." },
      { title: "Matchday early arrival", tip: "Arrive 60–90 minutes early—options around the ground are limited." },
      { title: "Post-match exit strategy", tip: "Walk away from the immediate surge before committing to transport." },
      { title: "One calm drink", tip: "Either have one planned drink or leave—hovering is the worst option." },
      { title: "Neighbourhood realism", tip: "Expect everyday Spain, not polished tourist infrastructure." },
      { title: "Madrid night after", tip: "If you want nightlife, go back into Madrid—don’t try to force it locally." },
      { title: "Quick essentials run", tip: "Use local shops for basics; keep it functional." },
      { title: "Comfort-first pacing", tip: "This is about efficient football logistics, not sightseeing volume." },
    ],

    tips: [
      "Base in Madrid unless price forces you otherwise.",
      "Plan return transport timing, especially for late kickoffs.",
      "Expect a no-frills matchday environment—good, but not touristy.",
      "Buffer time is required; crowds stack near kickoff and full-time.",
      "Cash can still help in smaller bars.",
    ],

    food: ["Menú del día lunches", "Simple tapas", "Bakery breakfasts", "Grilled meats"],

    transport:
      "Best approached from Madrid via metro/train connections. Treat the whole thing as a planned out-and-back rather than a spontaneous hop.",

    accommodation:
      "Madrid is the correct base for almost everyone. Only stay in Getafe if price or proximity is the priority.",
  },

  "palma-de-mallorca": {
    cityId: "palma-de-mallorca",
    name: "Palma de Mallorca",
    country: "Spain",
    thingsToDoUrl: GYG["palma-de-mallorca"],

    overview:
      "Palma turns a football trip into a mini-holiday: historic old town, waterfront walks, strong food scene, and beach options without needing a packed itinerary. The trick is split-days—old town in the morning, sea air later, match in the evening.",

    topThings: [
      { title: "Palma Cathedral (La Seu)", tip: "Early morning for better light and fewer crowds; pair with a waterfront walk." },
      { title: "Old Town wander", tip: "No rigid route—small squares and shaded streets are the value." },
      { title: "Passeig del Born", tip: "Great for daytime strolling and evening atmosphere." },
      { title: "Bellver Castle", tip: "Go for views; taxi/bus unless you love uphill walks." },
      { title: "Port promenade at sunset", tip: "Easy win with drinks/dinner afterwards." },
      { title: "Santa Catalina", tip: "One of the best food/bar neighbourhoods—ideal evening base." },
      { title: "Beach reset", tip: "Choose a calmer beach window (morning/late afternoon) rather than peak midday." },
      { title: "Market stop", tip: "Good for a casual food hit without a full restaurant sit-down." },
      { title: "Matchday transport plan", tip: "Stadium isn’t central—decide taxi/bus timing early." },
      { title: "One strong dinner booking", tip: "Peak season punishes walk-ins—book if you care where you eat." },
    ],

    tips: [
      "Split your day: old town + sea air beats trying to do everything at once.",
      "Book restaurants Fri/Sat in peak season.",
      "Stadium travel needs buffer time—expect queues after full-time.",
      "Hydrate and plan shade if visiting in high summer.",
      "Palma works best when it’s relaxed.",
    ],

    food: ["Seafood", "Pa amb oli", "Tapas", "Ensaimadas (pastry)", "Mediterranean grills"],

    transport:
      "Good bus network and cheap taxis. Plan stadium travel as a deliberate out-and-back rather than winging it.",

    accommodation:
      "Old Town, Santa Catalina, or near Passeig del Born are the best bases. Location to food + walking beats stadium proximity.",
  },

  oviedo: {
    cityId: "oviedo",
    name: "Oviedo",
    country: "Spain",

    overview:
      "Oviedo is compact, elegant, and food-forward, with a historic centre that’s easy to explore on foot. It’s ideal for travellers who prefer culture, walkability, and a calmer northern Spain vibe over beach intensity.",

    topThings: [
      { title: "Old Town loop", tip: "Walkable in under two hours, but allow longer for cafés and small squares." },
      { title: "Cathedral of San Salvador", tip: "Anchor point for the historic core—do it early." },
      { title: "Campo de San Francisco Park", tip: "Best mid-day reset space." },
      { title: "Statue trail", tip: "Treat it as a casual scavenger hunt while you wander." },
      { title: "Plaza del Fontán", tip: "Strong food/drinks square—great evening base." },
      { title: "Sidrerías (cider houses)", tip: "Try several small pours; it’s part of the ritual." },
      { title: "Monte Naranco viewpoints", tip: "Taxi/bus recommended; do it in clear weather." },
      { title: "Local shopping spine", tip: "Useful connector, not a destination." },
      { title: "Pre-match food plan", tip: "Eat earlier before travelling to the stadium area." },
      { title: "Post-match calm exit", tip: "Leave cleanly or commit to one planned stop—avoid the surge zone." },
    ],

    tips: [
      "Bring a light rain jacket—northern Spain is greener for a reason.",
      "Food quality is strong across the city; avoid lazy tourist traps.",
      "Cider culture is a ‘thing’ here—lean into it.",
      "Book Fri/Sat dining if you care where you eat.",
      "Centre is walkable—keep transport minimal.",
    ],

    food: ["Fabada asturiana", "Local cheeses", "Seafood stews", "Sidra (cider)"],

    transport:
      "City centre is walkable; buses and taxis cover the stadium corridor in ~20–30 minutes depending on traffic.",

    accommodation:
      "Stay near Old Town or Plaza del Fontán for the best atmosphere + easiest evenings.",
  },

  vallecas: {
    cityId: "vallecas",
    name: "Vallecas",
    country: "Spain",

    overview:
      "Vallecas is not a traditional tourist destination — and that’s exactly the point. This working-class Madrid district is one of the most authentic football neighbourhoods in Spain, built around strong local identity, community pride, and a rebellious culture that defines Rayo Vallecano. A trip to Vallecas is less about sightseeing and more about experiencing raw, local football atmosphere inside a dense urban neighbourhood where the club genuinely belongs to its people.",

    topThings: [
      { title: "Estadio de Vallecas exterior walk", tip: "Arrive early and walk around the stadium area — matchday build-up is part of the experience." },
      { title: "Vallecas neighbourhood bars", tip: "Choose busy local bars rather than searching for tourist-friendly venues." },
      { title: "Matchday fan build-up", tip: "Supporters gather early in surrounding streets — soak in the atmosphere before kickoff." },
      { title: "Avenida de la Albufera walk", tip: "Main spine of the district with everyday Madrid life on display." },
      { title: "Local tapas stops", tip: "Keep it simple: beer + tapas in smaller neighbourhood bars works best." },
      { title: "Street art and murals", tip: "Vallecas has strong political and cultural street art — keep your eyes open walking around." },
      { title: "Neighbourhood cafés", tip: "Morning coffee spots feel local and relaxed compared to central Madrid." },
      { title: "Plaza Roja area", tip: "A gathering point for supporters and local community life." },
      { title: "Post-match walk", tip: "Leave the stadium slowly and experience the neighbourhood dispersing." },
      { title: "Madrid evening afterwards", tip: "Most visitors head back into central Madrid after the match for wider nightlife options." },
    ],

    tips: [
      "Treat Vallecas as a football district rather than a sightseeing destination.",
      "Arrive early — the pre-match street atmosphere is one of the best parts of the experience.",
      "Expect a raw, authentic matchday environment rather than polished tourist infrastructure.",
      "Use Madrid as your main accommodation base.",
      "Metro is the easiest way to reach the stadium area.",
      "The neighbourhood has strong political identity — respect local culture and atmosphere.",
    ],

    food: [
      "Simple tapas bars",
      "Spanish tortillas",
      "Local grilled meats",
      "Neighbourhood bakeries",
      "Beer and small plates",
    ],

    transport:
      "Vallecas is easily reached from central Madrid via the Madrid Metro network. Most visitors travel in and out on matchday using metro lines connecting the district to the city centre. Walking around the neighbourhood near the stadium is straightforward once you arrive.",

    accommodation:
      "Most travellers stay in central Madrid (Sol, Gran Vía, Malasaña or La Latina) and travel to Vallecas for the match. Accommodation inside Vallecas itself is limited and usually chosen only for proximity to the stadium.",
  },
};

export default laLigaCityGuides;
