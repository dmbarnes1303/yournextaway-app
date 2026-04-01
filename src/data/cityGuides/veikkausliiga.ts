import type { CityGuide } from "./types";

const GYG = {
  helsinki:
    "https://www.getyourguide.com/en-gb/helsinki-l13/?partner_id=MAQJREP&utm_medium=online_publisher",
  turku:
    "https://www.getyourguide.com/en-gb/turku-l104793/?partner_id=MAQJREP&utm_medium=online_publisher",
  tampere:
    "https://www.getyourguide.com/en-gb/tampere-l45587/?partner_id=MAQJREP&utm_medium=online_publisher",
  mariehamn:
    "https://www.getyourguide.com/en-gb/mariehamn-l151076/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const veikkausliigaCityGuides: Record<string, CityGuide> = {
  helsinki: {
    cityId: "helsinki",
    name: "Helsinki",
    country: "Finland",
    thingsToDoUrl: GYG.helsinki,
    overview:
      "Helsinki is the strongest overall football city break in Finnish domestic football because it gives you the best balance of flight access, hotel stock, nightlife, transport, and club choice. HJK provide the heavyweight option, while Gnistan give you a smaller-scale local contrast. The right way to do Helsinki is simple: stay central or around Töölö/Pasila, use public transport properly, and treat the football as part of a wider city weekend rather than the entire plan.",

    topThings: [
      {
        title: "Senate Square and cathedral area",
        tip: "Do it early or late when the city looks cleaner and less touristy.",
      },
      {
        title: "Market Square and harbourfront",
        tip: "Worth doing once, especially if you want the obvious Helsinki first impression.",
      },
      {
        title: "Design District walk",
        tip: "Good if you want the city to feel like more than a stadium stop.",
      },
      {
        title: "Töölö and Olympic Stadium surroundings",
        tip: "Ideal if you are pairing HJK with a football-focused city day.",
      },
      {
        title: "Pasila transport hub area",
        tip: "Useful for logistics, not where you spend your whole day.",
      },
      {
        title: "Suomenlinna ferry trip",
        tip: "Only do it if you actually have time; rushing it is pointless.",
      },
      {
        title: "Kallio bars and late evening",
        tip: "Better value and more character than default polished hotel bars.",
      },
      {
        title: "Pre-match city-centre food stop",
        tip: "Eat centrally and move out later rather than camping around the ground.",
      },
      {
        title: "Post-match central reset",
        tip: "Go back into town after the game. Helsinki rewards keeping the evening alive.",
      },
      {
        title: "Morning harbour or waterfront walk",
        tip: "Good final-hour move before checkout or airport travel.",
      },
    ],

    tips: [
      "Helsinki is the trip; the stadium is only one part of it.",
      "HJK is the premium football option. Gnistan is the niche local option.",
      "Stay central, in Töölö, or around Pasila if you want the best balance of travel and city life.",
      "Public transport is strong enough that overusing taxis is usually a waste of money.",
      "This is the easiest Veikkausliiga city for an international football weekend.",
    ],

    food: [
      "Central Nordic bistro dining",
      "Kallio bars and more casual food spots",
      "Harbour-area meals if you want a more polished evening",
      "Coffee and bakery stops around the city centre",
      "Simple pre-match burger or pub options near the core",
    ],

    transport:
      "Helsinki public transport is the best in the Finnish league set. Bolt Arena is easy from the centre via Töölö/Pasila logic, while Mustapekka Areena is better treated as a Helsinki trip first and a smaller suburban football move second. Helsinki Central and Pasila are the key anchors.",

    accommodation:
      "City centre is the safest all-round base. Töölö works very well if HJK is the main event. Pasila is strong if rail convenience matters, but pure central Helsinki is still the best overall football-weekend option.",
  },

  turku: {
    cityId: "turku",
    name: "Turku",
    country: "Finland",
    thingsToDoUrl: GYG.turku,
    overview:
      "Turku is one of the strongest city-guide entries in the whole Finnish league because it combines two clubs, a shared stadium, riverfront nightlife, walkable central areas, and a proper short-break feel. Inter and TPS give the city football depth, and the wider city does enough to make the trip feel worthwhile even before kickoff. The smart move is staying central or by the Aura riverside and treating the stadium as a simple transport move from there.",

    topThings: [
      {
        title: "Aura riverside walk",
        tip: "One of the best low-effort football-weekend city features in Finland.",
      },
      {
        title: "Turku Cathedral area",
        tip: "Good daytime stop if you want the city to feel more rounded.",
      },
      {
        title: "Castle and harbour zone",
        tip: "Worth seeing if you have the time, but do not force it into a rushed schedule.",
      },
      {
        title: "Riverside bars and restaurants",
        tip: "This is where Turku starts feeling like a proper weekend city.",
      },
      {
        title: "Central coffee stop",
        tip: "Ideal before a matchday afternoon rather than wasting time near the ground.",
      },
      {
        title: "Old-town style centre wander",
        tip: "Turku is best when you let it breathe rather than ticking boxes.",
      },
      {
        title: "Pre-match riverside meal",
        tip: "Better than defaulting to generic stadium-adjacent food.",
      },
      {
        title: "Veritas Stadion out-and-back",
        tip: "Treat the ground as a football stop from central Turku, not your whole trip base.",
      },
      {
        title: "Post-match central drinks",
        tip: "Very easy city to keep the evening going after full-time.",
      },
      {
        title: "Morning river reset",
        tip: "Strong final move before heading home.",
      },
    ],

    tips: [
      "Turku is one of the best football city-breaks in Finland outside Helsinki.",
      "Stay central or by the Aura riverside.",
      "The city derby context makes Turku more interesting than a one-club destination.",
      "Veritas is shared, so build the trip around the city, not the stadium footprint.",
      "A full overnight works better than a rushed same-day trip.",
    ],

    food: [
      "Riverside restaurants for the best all-round evening",
      "Casual burgers and pub food before the match",
      "Coffee and pastries in the centre",
      "More polished sit-down dining around the Aura river",
      "Late drinks and simple food centrally after the game",
    ],

    transport:
      "Turku is very manageable. The centre is the right anchor, and Veritas Stadion is an easy move from there. You do not need a complicated transport plan; you just need to avoid staying in the wrong place and making the trip harder than it is.",

    accommodation:
      "Turku city centre or the riverside is the correct base nearly every time. You get football convenience, nightlife, and the best city feel in one package. There is almost no good reason to prioritise staying by the stadium instead.",
  },

  lahti: {
    cityId: "lahti",
    name: "Lahti",
    country: "Finland",
    overview:
      "Lahti is a practical football stop rather than a high-end city break, and pretending otherwise would be stupid. What it does well is simplicity: good rail logic, an easy city centre, and a club-trip structure that works if you keep expectations realistic. This is the kind of place that makes sense for football people filling out a league properly, not for someone chasing Helsinki-level weekend polish.",

    topThings: [
      {
        title: "City-centre walk",
        tip: "Enough to give the trip shape without pretending there is endless content.",
      },
      {
        title: "Harbour or lakefront area",
        tip: "Worth a short stop if the weather helps.",
      },
      {
        title: "Ski jump / sports area surroundings",
        tip: "Useful for city identity, even if you are not turning it into a sports-history day.",
      },
      {
        title: "Station-to-centre route",
        tip: "Part of why Lahti works so well logistically.",
      },
      {
        title: "Simple central dinner",
        tip: "Pick one decent option and stop overthinking it.",
      },
      {
        title: "Pre-match coffee stop",
        tip: "The city is compact enough that you do not need much planning.",
      },
      {
        title: "Lahti Stadium approach",
        tip: "Easy enough if you keep the centre as your base.",
      },
      {
        title: "Post-match low-key evening",
        tip: "This is more practical overnight than all-night city session.",
      },
      {
        title: "Morning central reset",
        tip: "Useful final-hour move before rail travel.",
      },
      {
        title: "Rail-linked day or overnight trip",
        tip: "The city’s biggest strength is how straightforward it is.",
      },
    ],

    tips: [
      "Lahti is best treated as a clean football stop, not a luxury weekend.",
      "Stay central or near the station and keep the whole trip simple.",
      "Rail access is one of the city’s main advantages.",
      "One overnight is enough for most people.",
      "This is a grounded trip for grounded expectations.",
    ],

    food: [
      "Simple central bistro meals",
      "Coffee and pastries near the centre or station",
      "Casual pre-match pub food",
      "A practical central dinner rather than destination dining",
    ],

    transport:
      "Lahti is easy if you use the railway station and city centre as your anchors. The stadium move is straightforward from there, and there is no need for complicated local transport strategy.",

    accommodation:
      "City centre or station area is the right answer. The city is too manageable to justify clever district strategy beyond keeping everything easy and central.",
  },

  oulu: {
    cityId: "oulu",
    name: "Oulu",
    country: "Finland",
    overview:
      "Oulu is one of the more regionally distinctive football stops in the Finnish set because of its northern location and different travel rhythm. It is not a polished capital-style weekend, but it has enough urban structure and enough local identity to make the trip worthwhile if you understand what you are buying. This is football-plus-region rather than football-plus-luxury city break.",

    topThings: [
      {
        title: "Market Square and waterfront area",
        tip: "Best first move because it gives the city a clearer shape immediately.",
      },
      {
        title: "Torinranta walk",
        tip: "Good if you want a scenic central reset before food or football.",
      },
      {
        title: "City-centre loop",
        tip: "Enough to give the trip structure without overbuilding it.",
      },
      {
        title: "Pre-match central meal",
        tip: "Better than wasting time trying to build the day around the ground.",
      },
      {
        title: "Raatti Stadium approach",
        tip: "Simple from the centre if you stop overcomplicating the route.",
      },
      {
        title: "Post-match central return",
        tip: "The centre is where the evening still has some life.",
      },
      {
        title: "Coffee stop by the market area",
        tip: "Good low-effort move if you stayed over.",
      },
      {
        title: "River or waterfront photography",
        tip: "Useful if you want the trip to feel more like a place and less like a checklist.",
      },
      {
        title: "Practical overnight",
        tip: "Oulu works better as a proper stop than as a frantic same-day mission.",
      },
      {
        title: "Morning central reset before departure",
        tip: "Strong final move if you have one overnight only.",
      },
    ],

    tips: [
      "Stay central. That is the right answer nearly every time.",
      "Oulu is more football-region trip than glamorous city weekend.",
      "AC Oulu adds character because the city feels different from the league’s southern corridor.",
      "Good for travellers who want to explore the full geographic spread of the league.",
      "Keep logistics simple and let the city do just enough around the match.",
    ],

    food: [
      "Central casual dining",
      "Waterfront or market-area food stops",
      "Coffee and pastries in the centre",
      "Pub food before or after the game",
    ],

    transport:
      "Oulu is manageable if you use the city centre and railway station as your anchors. Raatti is easy enough from there, and the city is much more about keeping things practical than about building a transport-heavy itinerary.",

    accommodation:
      "City centre or around the market square is the strongest base. You get walkability, food options, and simple match movement without making the trip harder than it needs to be.",
  },

  pietarsaari: {
    cityId: "pietarsaari",
    name: "Pietarsaari",
    country: "Finland",
    overview:
      "Pietarsaari is a football-first stop and should be planned exactly that way. It is a smaller place where the club and the local setting are the point. This is not where you chase big-city nightlife or overdesigned weekend itineraries. It works when you accept it as a grounded, local, community-scale football trip.",

    topThings: [
      {
        title: "Town-centre walk",
        tip: "Enough to get the place under your skin without trying to force scale onto it.",
      },
      {
        title: "Project Liv Arena approach",
        tip: "The ground is one of the core reasons for the trip, so arrive with time.",
      },
      {
        title: "Harbour or coastal local stop",
        tip: "Good if you want the town to feel like more than just a stadium visit.",
      },
      {
        title: "Simple central meal",
        tip: "Keep it practical and book only if options are clearly limited.",
      },
      {
        title: "Pre-match local café",
        tip: "A better use of time than pacing around too early.",
      },
      {
        title: "Post-match low-key evening",
        tip: "This is not a giant night-out destination, so keep expectations sensible.",
      },
      {
        title: "Morning local reset",
        tip: "Useful if you stayed over and want the trip to feel complete.",
      },
      {
        title: "Football photo stop",
        tip: "Good for people who like compact club environments and newer grounds.",
      },
      {
        title: "Nearby Kokkola add-on",
        tip: "Makes sense if you want a slightly broader overnight base.",
      },
      {
        title: "One-night football rhythm",
        tip: "Exactly the right tempo for this city.",
      },
    ],

    tips: [
      "Treat Pietarsaari honestly as a football stop, not a luxury city weekend.",
      "Stay central if simplicity is the priority.",
      "Kokkola can work as a wider practical base if needed.",
      "Best for neutrals who like smaller-club trips with local character.",
      "Do not overbuild the plan. The city is too compact for that.",
    ],

    food: [
      "Simple local dining in the centre",
      "Coffee and bakery stops",
      "Basic pub or café food around matchday",
    ],

    transport:
      "Pietarsaari is a small-place logistics trip. The correct move is to keep the town centre or a practical local anchor as your base and avoid assuming the flexibility of a larger city.",

    accommodation:
      "Pietarsaari centre is the best base for match convenience. Kokkola is the stronger backup option if you want more accommodation choice and are happy to travel in.",
  },

  mariehamn: {
    cityId: "mariehamn",
    name: "Mariehamn",
    country: "Finland",
    thingsToDoUrl: GYG.mariehamn,
    overview:
      "Mariehamn is one of the most distinctive city guides in the whole project because the island context changes the trip completely. This is not just a football weekend with some sightseeing attached; the island journey, ferry logic, compact town, and unusual atmosphere are the point. If you go, go properly and let the place be the story alongside the match.",

    topThings: [
      {
        title: "Town-centre walk",
        tip: "Compact enough that you can understand the place properly in very little time.",
      },
      {
        title: "Harbour area",
        tip: "Especially useful if your route includes ferry travel.",
      },
      {
        title: "Seafront and marina loop",
        tip: "One of the simplest ways to feel the island nature of the trip.",
      },
      {
        title: "Wiklöf Holding Arena approach",
        tip: "Build in time and let the football-place feeling register.",
      },
      {
        title: "Simple island dinner",
        tip: "Better to choose one good local meal than drift around expecting endless options.",
      },
      {
        title: "Pre-match local café stop",
        tip: "The compactness of the city makes this very easy.",
      },
      {
        title: "Post-match central return",
        tip: "Everything is close enough that the city and football blend naturally.",
      },
      {
        title: "Morning waterfront reset",
        tip: "A strong move if you stayed overnight or are waiting on ferry timing.",
      },
      {
        title: "Ferry-linked football break",
        tip: "One of the most unusual and memorable travel combinations in the app.",
      },
      {
        title: "Island slow pace",
        tip: "Do not fight it. The city works best when you lean into the different rhythm.",
      },
    ],

    tips: [
      "Mariehamn is destination-led. The island setting is the reason to go.",
      "Everything is compact, so stay central or near the harbour.",
      "This is one of the easiest places in the app for walkable matchday logistics.",
      "If you like unusual football trips, this is top-tier.",
      "Treat ferry and travel timing seriously. That is part of the trip logic.",
    ],

    food: [
      "Local seafood or coastal dining when available",
      "Simple harbour-area meals",
      "Coffee and pastries in the centre",
      "Relaxed sit-down dinner rather than rushed matchday eating",
    ],

    transport:
      "Once you are in Mariehamn, the city is extremely easy. The real planning is getting there cleanly. After that, centre, harbour, and stadium all sit close enough that the trip becomes very low-friction.",

    accommodation:
      "Mariehamn centre is the best all-round base. Harbour-adjacent stays are useful if ferry convenience matters. The city is small enough that there is no need for complicated district thinking.",
  },

  tampere: {
    cityId: "tampere",
    name: "Tampere",
    country: "Finland",
    thingsToDoUrl: GYG.tampere,
    overview:
      "Tampere is one of the strongest football city breaks in Finland because it actually feels like a proper weekend city rather than just a place with a club in it. Ilves give it football relevance, the new stadium improves the matchday experience, and the city itself has enough bars, food, and waterfront character to justify the trip even before kickoff. This is one of the smartest cities in the Finnish section of the app.",

    topThings: [
      {
        title: "Central Tampere and main streets loop",
        tip: "Easy first move after check-in to understand the city quickly.",
      },
      {
        title: "Lakeside or waterfront walk",
        tip: "One of the city’s strongest background features, especially in decent weather.",
      },
      {
        title: "Tammela district walk",
        tip: "Worth doing if football is the reason you came, because the stadium integration matters.",
      },
      {
        title: "Tampere Market Hall or central food stop",
        tip: "Good if you want the day to feel more local and less generic.",
      },
      {
        title: "Observation tower or city-view stop",
        tip: "Useful if visibility is decent and you want the city to feel more complete.",
      },
      {
        title: "Pre-match central bars",
        tip: "Much better than defaulting to too much time around the ground.",
      },
      {
        title: "Tammelan Stadion approach",
        tip: "One of the better city-to-stadium transitions in the league.",
      },
      {
        title: "Post-match central return",
        tip: "Very easy city for carrying the evening on after football.",
      },
      {
        title: "Morning café or bakery stop",
        tip: "Good final-hour move if you stayed overnight.",
      },
      {
        title: "One- or two-night football city break",
        tip: "Tampere is one of the few Finnish league cities where two nights can actually make sense.",
      },
    ],

    tips: [
      "Tampere is one of the best all-round football city breaks in Finland.",
      "Stay central or in Tammela if the pricing makes sense.",
      "Ilves plus the city makes a stronger package than many people expect.",
      "The new stadium improves the whole travel proposition massively.",
      "Very good option if you want football and nightlife without Helsinki pricing.",
    ],

    food: [
      "Central bistro-style dining",
      "Casual bars and burger spots before the match",
      "Coffee and pastry stops in the centre",
      "More polished dinner options for a full weekend evening",
      "Late drinks and simple food after the game",
    ],

    transport:
      "Tampere is highly manageable. Central station, city core, and Tammela work very neatly together. This is a city where walking does a lot of the work and makes the whole football weekend feel low-friction.",

    accommodation:
      "City centre is the best base. Tammela is also strong if you want to be close to the stadium while still staying properly inside the city. There is no good reason to overcomplicate the location choice here.",
  },

  kuopio: {
    cityId: "kuopio",
    name: "Kuopio",
    country: "Finland",
    overview:
      "Kuopio is a strong football-first city break because it is compact, easy to handle, and paired with one of the league’s most serious clubs. It does not have Helsinki’s scale or Tampere’s city-break strength, but it is a very clean, competent football trip. The smart play is staying central and using the city’s compactness as an advantage rather than expecting giant-city variety.",

    topThings: [
      {
        title: "Market Square area",
        tip: "Best natural anchor for understanding the city quickly.",
      },
      {
        title: "Harbour walk",
        tip: "Strong low-effort move if weather is decent.",
      },
      {
        title: "Central restaurant stop",
        tip: "Good choice before or after football because the city is compact.",
      },
      {
        title: "Puijo viewpoint or nature add-on",
        tip: "Worth it if you have time and the weather behaves.",
      },
      {
        title: "Pre-match coffee in the centre",
        tip: "The city is manageable enough that this is all you really need.",
      },
      {
        title: "Väre Areena approach",
        tip: "Keep it simple from the centre and it works well.",
      },
      {
        title: "Post-match harbour or central reset",
        tip: "Useful if you want the city to stay part of the trip after full-time.",
      },
      {
        title: "Morning market-area walk",
        tip: "A good final move before leaving.",
      },
      {
        title: "One-night football overnight",
        tip: "Usually the ideal rhythm here.",
      },
      {
        title: "Compact city planning",
        tip: "Kuopio rewards simple decisions more than long itineraries.",
      },
    ],

    tips: [
      "Kuopio is best as a clean football-first city break.",
      "Stay central or near the market/harbour area.",
      "KuPS gives the football side genuine competitive relevance.",
      "This is one of the easier non-capital league trips to plan properly.",
      "Do not overcomplicate it. The city is too manageable for that.",
    ],

    food: [
      "Central Nordic or Finnish bistro dining",
      "Harbour-side meals in decent weather",
      "Coffee and bakery stops around the market area",
      "Simple pre-match pub or burger options",
    ],

    transport:
      "Kuopio works best from the city centre. From there, stadium movement is simple and the wider city remains highly manageable. The city is compact enough that good hotel placement solves almost everything.",

    accommodation:
      "City centre is the obvious base. Harbour or market-adjacent stays are especially good if you want the city to feel slightly more relaxed and scenic around the football.",
  },

  seinajoki: {
    cityId: "seinajoki",
    name: "Seinäjoki",
    country: "Finland",
    overview:
      "Seinäjoki is a football stop more than a broad destination break. That is not an insult. It just means the trip should be planned honestly. SJK give the city a modern football reason to exist inside the app, but the wider city is mainly about practicality, rail logic, and a low-fuss overnight rather than romance or big-city variety.",

    topThings: [
      {
        title: "City-centre walk",
        tip: "Enough to give the stop some structure without forcing a fake tourism agenda.",
      },
      {
        title: "Station-to-centre route",
        tip: "Useful because rail practicality is one of the city’s strengths.",
      },
      {
        title: "Architectural or civic centre stop",
        tip: "A decent add-on if you want the city to feel more rounded.",
      },
      {
        title: "Simple central dinner",
        tip: "Keep it straightforward rather than chasing a destination-food experience.",
      },
      {
        title: "Pre-match café or pub stop",
        tip: "The centre is the right place to stage the day from.",
      },
      {
        title: "OmaSP Stadion approach",
        tip: "Easy enough if you use the centre or station as your anchor.",
      },
      {
        title: "Post-match low-key evening",
        tip: "This is more practical overnight than big nightlife city.",
      },
      {
        title: "Morning rail departure rhythm",
        tip: "Part of why Seinäjoki works as a clean football stop.",
      },
      {
        title: "Football-first overnight",
        tip: "Exactly the right attitude for this city.",
      },
      {
        title: "Simple scheduling",
        tip: "Do not overbuild the trip. That just makes it worse.",
      },
    ],

    tips: [
      "Seinäjoki is a football stop first and a city break second.",
      "Stay central or near the station for easiest logistics.",
      "SJK makes the city interesting from a league-structure point of view.",
      "One overnight is usually enough.",
      "Good for travellers who prioritise the full league over just glamorous destinations.",
    ],

    food: [
      "Simple central dining",
      "Casual pub food pre-match",
      "Coffee and pastry stops near the centre or station",
      "A practical dinner rather than a memorable culinary weekend",
    ],

    transport:
      "Rail station and city centre are the key anchors. From there, stadium movement is straightforward enough. The city is not complicated, which is exactly why trying to optimise it too hard becomes counterproductive.",

    accommodation:
      "Seinäjoki centre or station area are the correct choices. You want ease, not fantasy district strategy.",
  },

  vaasa: {
    cityId: "vaasa",
    name: "Vaasa",
    country: "Finland",
    overview:
      "Vaasa is a very workable compact football city: not giant, not flashy, but easy enough to turn into a tidy overnight around VPS. The city’s main value is that it is manageable and low-friction rather than chaotic or expensive. For a football app, that matters. Vaasa is a good example of a trip that works because it does not try too hard to be something bigger than it is.",

    topThings: [
      {
        title: "City-centre walk",
        tip: "Enough to settle into the city without wasting time.",
      },
      {
        title: "Market square or central core",
        tip: "Useful starting point before deciding the rest of the day.",
      },
      {
        title: "Waterfront or harbour area",
        tip: "Worth a short stop if the weather is decent.",
      },
      {
        title: "Pre-match central meal",
        tip: "Eat in town rather than drifting aimlessly near the ground.",
      },
      {
        title: "Lemonsoft Stadion approach",
        tip: "Simple if you keep the centre as your base.",
      },
      {
        title: "Post-match central drinks",
        tip: "Vaasa works fine for one easy evening rather than a huge night out.",
      },
      {
        title: "Morning coffee stop",
        tip: "Good if you stayed one night and want the city to register a bit more.",
      },
      {
        title: "Rail or airport-linked planning",
        tip: "Useful because Vaasa works well as a clean travel node.",
      },
      {
        title: "One-night football stop",
        tip: "Usually the ideal rhythm here.",
      },
      {
        title: "Compact city pacing",
        tip: "Vaasa improves if you stop trying to fill every hour with something major.",
      },
    ],

    tips: [
      "Vaasa is a compact football stop, and that is exactly how it should be treated.",
      "Stay central unless you have a very specific reason not to.",
      "VPS make it a proper club trip rather than just a random overnight.",
      "Good for neutrals who like practical, low-fuss travel.",
      "One night is enough for most people.",
    ],

    food: [
      "Simple central dining",
      "Pub food before or after the match",
      "Coffee and pastry stops around the centre",
      "Harbour-adjacent dinner if weather and timing line up",
    ],

    transport:
      "Vaasa is best handled from the city centre or station area. The stadium move is easy enough from there, and the whole point of the city is that it keeps travel friction low.",

    accommodation:
      "Vaasa centre is the strongest all-round base. Hietalahti is only worth prioritising if stadium convenience matters more than broader city value.",
  },
};

export default veikkausliigaCityGuides;
