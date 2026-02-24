// src/data/matchdayLogistics/bundesliga.ts
import type { MatchdayLogistics } from "./types";

/**
 * Bundesliga Matchday Logistics (18 teams)
 *
 * Rules:
 * - Useful + conservative (no fake venue names / no specific pub names).
 * - Stable transport anchors: main rail hubs + major U/S-Bahn/tram stops.
 * - Neutral traveller framing.
 *
 * IMPORTANT:
 * Keys MUST match normalizeClubKey(homeTeamName) from src/data/clubKey.ts
 * (e.g. "bayern-munich", "borussia-dortmund", "tsg-hoffenheim", etc).
 */

const bundesligaLogistics: Record<string, MatchdayLogistics> = {
  "bayern-munich": {
    stadium: "Allianz Arena",
    city: "Munich",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "München Hbf", type: "train", notes: "Main arrival hub; connect to U-Bahn." },
        { name: "Fröttmaning (U-Bahn)", type: "metro", notes: "Primary matchday station; controlled flow and queues are normal." },
        { name: "Marienplatz", type: "metro", notes: "Central interchange (S/U-Bahn); good base point for routing." },
      ],
      tips: [
        "U-Bahn to Fröttmaning is the standard route; expect crowd management post-match.",
        "Leaving 10–15 minutes after full-time often means a smoother station experience.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but congestion is real; public transport is usually faster overall.",
      officialLots: ["If driving, use official arena parking only and arrive early."],
    },
    foodDrink: [
      { name: "Altstadt (city centre)", type: "mixed", notes: "Best variety before heading to the arena." },
      { name: "Schwabing", type: "bar", notes: "Good evening base; easy U-Bahn access." },
    ],
    stay: {
      bestAreas: [
        { area: "Altstadt / Marienplatz area", notes: "Best tourist base; easiest routing." },
        { area: "Schwabing", notes: "Great bars/food; well connected." },
      ],
      budgetAreas: [{ area: "Near München Hbf", budgetFriendly: true, notes: "Practical for arrivals; check exact street." }],
    },
    arrivalTips: [
      "Arrive 60–90 minutes early if you want a calm entry and time to find your gate.",
      "Screenshot your ticket/QR before you travel—networks can be busy on big matchdays.",
    ],
  },

  "borussia-dortmund": {
    stadium: "Signal Iduna Park",
    city: "Dortmund",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Dortmund Hbf", type: "train", notes: "Main visitor hub; frequent local connections on matchdays." },
        { name: "Signal Iduna Park (S-Bahn)", type: "train", notes: "Direct matchday stop; can bottleneck post-match." },
        { name: "Westfalenhallen (U-Bahn)", type: "metro", notes: "Useful alternative depending on routing." },
      ],
      tips: [
        "For most visitors: base near Hbf and follow the matchday rail flow to stadium-area stops.",
        "Post-match queues are normal—waiting briefly or walking part-way can help.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but matchday traffic/closures can slow you near the stadium zone.",
      officialLots: ["Use official event parking if you drive; arrive early."],
    },
    foodDrink: [
      { name: "City centre near Hbf", type: "mixed", notes: "Practical pre-game base; then rail out." },
      { name: "Stadium district (practical)", type: "mixed", notes: "Convenient but crowded near kickoff." },
    ],
    stay: {
      bestAreas: [{ area: "Dortmund city centre", notes: "Best base for logistics; easy rail." }],
      budgetAreas: [{ area: "Near Dortmund Hbf", budgetFriendly: true, notes: "Most practical for short stays." }],
    },
    arrivalTips: [
      "If you’re day-tripping from another Ruhr city, lock your return plan early.",
      "Arrive early for big fixtures—security/entry lines can be slow.",
    ],
  },

  "tsg-hoffenheim": {
    stadium: "PreZero Arena",
    city: "Sinsheim",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Sinsheim (rail)", type: "train", notes: "Local rail access; matchday services can be busier." },
        { name: "Heidelberg Hbf (base option)", type: "train", notes: "Common visitor base; regional connections." },
        { name: "Mannheim Hbf (base option)", type: "train", notes: "Major hub; easy regional access." },
      ],
      tips: [
        "This is a regional matchday: plan trains before kickoff, including the return.",
        "If staying in Heidelberg/Mannheim, it’s a straightforward day trip with planning.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible and often used; still arrive early to avoid congestion.",
      officialLots: ["Use official/signed parking where possible."],
    },
    foodDrink: [
      { name: "Heidelberg (base)", type: "mixed", notes: "Best visitor option for food/atmosphere pre/post." },
      { name: "Mannheim (base)", type: "mixed", notes: "Practical big-city base with transport links." },
    ],
    stay: {
      bestAreas: [
        { area: "Heidelberg", notes: "Great tourist base; easy matchday logistics." },
        { area: "Mannheim", notes: "Major hub; often better value." },
      ],
      budgetAreas: [{ area: "Near Mannheim Hbf", budgetFriendly: true, notes: "Practical for arrivals and onward travel." }],
    },
    arrivalTips: [
      "Double-check your return connections before you leave your accommodation.",
      "Arrive early—smaller towns mean less forgiving transport frequency.",
    ],
  },

  "vfb-stuttgart": {
    stadium: "MHPArena (Stuttgart)",
    city: "Stuttgart",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Stuttgart Hbf", type: "train", notes: "Main arrival hub; connect via S-Bahn." },
        { name: "Neckarpark (S-Bahn)", type: "train", notes: "Common matchday stop; walk to stadium district." },
        { name: "Bad Cannstatt", type: "train", notes: "Useful alternative area; good dispersal option." },
      ],
      tips: [
        "From the centre, S-Bahn to Neckarpark/Bad Cannstatt is the standard approach.",
        "Post-match: walk a bit before re-entering transit if platforms are congested.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but the stadium district gets congested and managed on matchdays.",
      officialLots: ["Use official/event parking or park further out and use S-Bahn."],
    },
    foodDrink: [
      { name: "Bad Cannstatt", type: "mixed", notes: "Practical pre/post area and close to transit." },
      { name: "Stuttgart centre", type: "mixed", notes: "Best base for a weekend; then S-Bahn out." },
    ],
    stay: {
      bestAreas: [{ area: "Stuttgart centre", notes: "Best base for visitors." }],
      budgetAreas: [{ area: "Near Stuttgart Hbf", budgetFriendly: true, notes: "Practical for short stays and onward rail." }],
    },
    arrivalTips: [
      "Give yourself time for the last-leg walk from S-Bahn stops.",
      "If you’re catching a train after, build buffer for crowd dispersal.",
    ],
  },

  "rb-leipzig": {
    stadium: "Red Bull Arena",
    city: "Leipzig",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Leipzig Hbf", type: "train", notes: "Main arrival hub; easy city-wide connections." },
        { name: "City centre (Markt / Augustusplatz area)", type: "tram", notes: "Good base point; trams/walk routes are common." },
        { name: "Arena district (walk/tram)", type: "walk", notes: "Stadium area is reachable by tram and walking routes from centre." },
      ],
      tips: [
        "Leipzig is compact—staying central makes matchday simple.",
        "Walking from the centre can be a good option if weather/time allows.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but event traffic can be slow; public transport is usually easier.",
      officialLots: ["If driving, use official/signed event parking where available."],
    },
    foodDrink: [
      { name: "City centre", type: "mixed", notes: "Best variety; then tram/walk to the stadium." },
      { name: "Südvorstadt", type: "bar", notes: "Good nightlife district; easy to reach from centre." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Best base for logistics." },
        { area: "Südvorstadt", notes: "Great for evening plans; still connected." },
      ],
      budgetAreas: [{ area: "Near Leipzig Hbf", budgetFriendly: true, notes: "Very practical and often good value." }],
    },
    arrivalTips: [
      "Arrive early if you want a relaxed walk-in and time to find your entrance.",
      "If you’re day-tripping, check late returns before kickoff.",
    ],
  },

  "bayer-leverkusen": {
    stadium: "BayArena",
    city: "Leverkusen",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Köln Hbf", type: "train", notes: "Common visitor base; frequent regional trains." },
        { name: "Düsseldorf Hbf", type: "train", notes: "Alternate major base; easy access." },
        { name: "Leverkusen Mitte", type: "train", notes: "Local hub; last leg often bus/taxi/walk depending on routing." },
      ],
      tips: [
        "Treat as a Cologne/Düsseldorf weekend base, then regional rail to Leverkusen.",
        "Plan return trains before kickoff—regional services are frequent but still worth checking.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but matchday traffic builds around the stadium zone.",
      officialLots: ["Use official/signed parking where offered; arrive early."],
    },
    foodDrink: [
      { name: "Cologne (base)", type: "mixed", notes: "Best weekend city choice; huge variety." },
      { name: "Düsseldorf (base)", type: "mixed", notes: "Strong alternative base for food/nightlife." },
    ],
    stay: {
      bestAreas: [
        { area: "Cologne city centre", notes: "Best all-round base." },
        { area: "Düsseldorf city centre", notes: "Great alternative base." },
      ],
      budgetAreas: [{ area: "Near Köln Hbf", budgetFriendly: true, notes: "Practical for quick trips; check exact street." }],
    },
    arrivalTips: [
      "If you’re doing multiple Rhine/Ruhr matches, keep bases near major Hbf stations.",
      "Arrive early to avoid last-minute congestion on local connections.",
    ],
  },

  "sc-freiburg": {
    stadium: "Europa-Park Stadion",
    city: "Freiburg",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Freiburg (Breisgau) Hbf", type: "train", notes: "Main arrival hub; connect onward by tram/bus." },
        { name: "Tram/bus to stadium district", type: "tram", notes: "Standard last leg; allow time near kickoff." },
        { name: "Old town / city centre", type: "walk", notes: "Great base; compact and walkable." },
      ],
      tips: [
        "Freiburg is compact and easy—stay central and use tram/bus for the last leg.",
        "Post-match: public transport can be busy; waiting briefly can be calmer.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but public transport is usually smoother on matchday.",
      officialLots: ["Use official/signed parking if driving; otherwise park-and-ride works well."],
    },
    foodDrink: [
      { name: "Altstadt (old town)", type: "mixed", notes: "Best for tourists; strong pre/post." },
      { name: "Near Hbf", type: "mixed", notes: "Practical if you’re travelling in/out the same day." },
    ],
    stay: {
      bestAreas: [{ area: "Old town / centre", notes: "Best base for a weekend." }],
      budgetAreas: [{ area: "Near Freiburg Hbf", budgetFriendly: true, notes: "Often best value and extremely practical." }],
    },
    arrivalTips: [
      "If you’re coming from Basel/Strasbourg, check late returns before kickoff.",
      "Arrive early if you want time to enjoy the old town pre-match.",
    ],
  },

  "eintracht-frankfurt": {
    stadium: "Deutsche Bank Park",
    city: "Frankfurt",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Frankfurt (Main) Hbf", type: "train", notes: "Main arrival hub for visitors." },
        { name: "Frankfurt Flughafen (Airport)", type: "train", notes: "If flying in, it’s well connected; still allow buffer." },
        { name: "Stadion (S-Bahn/Regional)", type: "train", notes: "Primary stadium station; crowding post-match is normal." },
      ],
      tips: [
        "Frankfurt is very transit-friendly: Hbf → Stadion is the standard move.",
        "Post-match: crowd management is normal; waiting 10–15 minutes can reduce stress.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but can be slow around the stadium zone on matchdays.",
      officialLots: ["If driving, use official/signed event parking; arrive early."],
    },
    foodDrink: [
      { name: "Innenstadt (city centre)", type: "mixed", notes: "Best variety before heading to the stadium." },
      { name: "Sachsenhausen", type: "bar", notes: "Classic nightlife area; good post-match option." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Best for visitors; easy routing." },
        { area: "Sachsenhausen", notes: "Great for evenings; still connected." },
      ],
      budgetAreas: [{ area: "Near Frankfurt Hbf", budgetFriendly: true, notes: "Very practical; choose carefully by exact street." }],
    },
    arrivalTips: [
      "If you’re flying out after the match, do not cut timing close—build a big buffer.",
      "Screenshot tickets and plan your platform/connection back to Hbf early.",
    ],
  },

  "union-berlin": {
    stadium: "Stadion An der Alten Försterei",
    city: "Berlin",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Berlin Hbf", type: "train", notes: "Main arrival hub; connect via S/U-Bahn." },
        { name: "Ostkreuz", type: "train", notes: "Key interchange; useful for reaching the southeast." },
        { name: "Köpenick area (S-Bahn)", type: "train", notes: "Typical approach for the stadium district; expect walking last leg." },
      ],
      tips: [
        "Berlin is huge—pick a base near strong interchanges to simplify routing.",
        "Expect a walk and local crowd flow near the ground—normal for this venue.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving into Berlin stadium districts is rarely worth it. Public transport is the move.",
      officialLots: ["If driving, park outside and use S-Bahn for the last leg."],
    },
    foodDrink: [
      { name: "Mitte (base)", type: "mixed", notes: "Practical for tourists and transit." },
      { name: "Friedrichshain / Kreuzberg (base)", type: "mixed", notes: "Great weekend areas; good connections." },
    ],
    stay: {
      bestAreas: [
        { area: "Mitte", notes: "Best for first-time visitors." },
        { area: "Friedrichshain", notes: "Great nightlife; good transit." },
      ],
      budgetAreas: [{ area: "Near Ostkreuz", budgetFriendly: true, notes: "Practical and often better value." }],
    },
    arrivalTips: [
      "Arrive early—last-leg walking routes can be slower than you expect.",
      "Have a return plan; Berlin distances punish improvisation late at night.",
    ],
  },

  "augsburg": {
    stadium: "WWK ARENA",
    city: "Augsburg",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Augsburg Hbf", type: "train", notes: "Main arrival hub; regional trains from Munich are common." },
        { name: "Munich (base option)", type: "train", notes: "Easy base for a weekend; day trip feasible." },
        { name: "Tram/bus to stadium district", type: "tram", notes: "Last leg typically tram/bus; allow time near kickoff." },
      ],
      tips: [
        "Treat as a Munich-base day trip if you want simplicity: Munich → Augsburg rail, then local transit.",
        "Confirm return trains before kickoff if you’re not staying overnight.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but matchday congestion applies around the arena.",
      officialLots: ["Use official/signed parking if offered; arrive early."],
    },
    foodDrink: [
      { name: "Augsburg centre", type: "mixed", notes: "Best practical pre/post base." },
      { name: "Munich (base)", type: "mixed", notes: "Best variety for a full weekend." },
    ],
    stay: {
      bestAreas: [{ area: "Augsburg centre", notes: "Simple and practical." }],
      budgetAreas: [{ area: "Near Augsburg Hbf", budgetFriendly: true, notes: "Often best value and most practical." }],
    },
    arrivalTips: [
      "Regional day trips work best when you lock return times before kickoff.",
      "Arrive early—local trams/buses can fill close to kickoff.",
    ],
  },

  "hamburger-sv": {
    stadium: "Volksparkstadion",
    city: "Hamburg",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Hamburg Hbf", type: "train", notes: "Main arrival hub; connect via S/U-Bahn." },
        { name: "Altona", type: "train", notes: "Major station; useful depending on where you stay." },
        { name: "Stellingen (S-Bahn)", type: "train", notes: "Common matchday stop for the stadium district; walk last leg." },
      ],
      tips: [
        "Base central (Hbf/Altona) and use S-Bahn for the last leg.",
        "Post-match: walking to a less-crowded station entrance can save time.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but city traffic builds; public transport is usually easier.",
      officialLots: ["Use official/signed parking if driving; arrive early."],
    },
    foodDrink: [
      { name: "Altstadt / city centre", type: "mixed", notes: "Best all-round visitor base." },
      { name: "St Pauli / Reeperbahn (base)", type: "bar", notes: "Nightlife heavy; good post-match, not always calm." },
    ],
    stay: {
      bestAreas: [
        { area: "Altstadt / central", notes: "Best tourist base and logistics." },
        { area: "St Pauli", notes: "Great nightlife; expect noise." },
      ],
      budgetAreas: [{ area: "Near Hamburg Hbf", budgetFriendly: true, notes: "Practical and often better value." }],
    },
    arrivalTips: [
      "Hamburg weekends book up—secure accommodation early for big fixtures.",
      "Arrive early if you want a calm entry and time to find your section.",
    ],
  },

  "fc-koln": {
    stadium: "RheinEnergieSTADION",
    city: "Cologne",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Köln Hbf", type: "train", notes: "Main visitor hub; excellent connections." },
        { name: "Köln Messe/Deutz", type: "train", notes: "Useful alternative station; good dispersal option." },
        { name: "Tram to stadium district", type: "tram", notes: "Standard last leg; allow time near kickoff." },
      ],
      tips: [
        "Cologne is very visitor-friendly—base central and tram out to the stadium.",
        "Post-match trams can be packed; waiting 10–15 minutes can improve comfort.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving can be annoying in Cologne match traffic; tram is usually better.",
      officialLots: ["If driving, use official/signed parking and arrive early."],
    },
    foodDrink: [
      { name: "Old town / riverside", type: "mixed", notes: "Best pre/post vibe; lots of options." },
      { name: "Belgian Quarter", type: "bar", notes: "Great bars/food; strong weekend base." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre / old town", notes: "Best for tourists + logistics." },
        { area: "Belgian Quarter", notes: "Great nightlife/food; still connected." },
      ],
      budgetAreas: [{ area: "Near Köln Hbf", budgetFriendly: true, notes: "Very practical; check exact street." }],
    },
    arrivalTips: [
      "If you’re doing Cologne + Leverkusen in one trip, keep your base near Köln Hbf.",
      "Arrive early for busy fixtures—entry and transit can slow down.",
    ],
  },

  "mainz-05": {
    stadium: "MEWA ARENA",
    city: "Mainz",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Mainz Hbf", type: "train", notes: "Main arrival hub; easy city routing." },
        { name: "Frankfurt Hbf (base option)", type: "train", notes: "Major base; short regional hop to Mainz." },
        { name: "Wiesbaden (base option)", type: "train", notes: "Nearby base; easy regional access." },
      ],
      tips: [
        "Mainz works well as a Frankfurt day trip—confirm return schedules.",
        "Keep it simple: rail in, walk/tram last leg, rail out.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but event traffic can slow you near the arena.",
      officialLots: ["Use official/signed parking if offered; arrive early."],
    },
    foodDrink: [
      { name: "Mainz old town", type: "mixed", notes: "Great pre/post base; walkable." },
      { name: "Frankfurt (base)", type: "mixed", notes: "Best variety if you’re doing a bigger weekend." },
    ],
    stay: {
      bestAreas: [{ area: "Mainz centre", notes: "Best for a simple weekend." }],
      budgetAreas: [{ area: "Near Mainz Hbf", budgetFriendly: true, notes: "Practical and often better value." }],
    },
    arrivalTips: [
      "If you’re connecting via Frankfurt Airport, build buffer—don’t cut it tight.",
      "Arrive early if you want time for food before entry.",
    ],
  },

  "borussia-monchengladbach": {
    stadium: "BORUSSIA-PARK",
    city: "Mönchengladbach",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Mönchengladbach Hbf", type: "train", notes: "Local hub; last leg often bus/shuttle/taxi." },
        { name: "Düsseldorf Hbf (base option)", type: "train", notes: "Strong base; frequent regional trains." },
        { name: "Köln Hbf (base option)", type: "train", notes: "Another strong base; easy regional access." },
      ],
      tips: [
        "Regional-stadium pattern: rail to town, then bus/shuttle last leg.",
        "Confirm return options before kickoff if you’re day-tripping.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible and common, but matchday congestion still applies near the stadium.",
      officialLots: ["Use official/signed event parking; arrive early."],
    },
    foodDrink: [
      { name: "Düsseldorf (base)", type: "mixed", notes: "Great weekend nightlife + food." },
      { name: "Cologne (base)", type: "mixed", notes: "Great alternative base; lots of options." },
    ],
    stay: {
      bestAreas: [
        { area: "Düsseldorf city centre", notes: "Best all-round base." },
        { area: "Cologne city centre", notes: "Best alternative base." },
      ],
      budgetAreas: [{ area: "Near Düsseldorf Hbf", budgetFriendly: true, notes: "Practical for short stays and onward travel." }],
    },
    arrivalTips: [
      "If you’re planning a Rhine/Ruhr trip, base in Cologne/Düsseldorf and day-trip matches.",
      "Arrive early—last-leg buses/shuttles can stack up near kickoff.",
    ],
  },

  "wolfsburg": {
    stadium: "Volkswagen Arena",
    city: "Wolfsburg",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Wolfsburg Hbf", type: "train", notes: "Main arrival hub; stadium is relatively close by city standards." },
        { name: "Berlin Hbf (base option)", type: "train", notes: "Possible base; day trip requires planning." },
        { name: "Hannover Hbf (base option)", type: "train", notes: "Another strong base option; easy access." },
      ],
      tips: [
        "This works well as a Berlin/Hannover day trip if you plan return trains in advance.",
        "Expect a walkable last leg from the station area depending on routing.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible; arrive early to avoid congestion near kickoff.",
      officialLots: ["Use official/signed parking if offered."],
    },
    foodDrink: [
      { name: "Berlin (base)", type: "mixed", notes: "Best variety if you’re pairing with a city break." },
      { name: "Hannover (base)", type: "mixed", notes: "Practical base with good rail links." },
    ],
    stay: {
      bestAreas: [{ area: "Berlin (base)", notes: "Best weekend city base; then day trip." }],
      budgetAreas: [{ area: "Near Wolfsburg Hbf", budgetFriendly: true, notes: "Practical if staying locally." }],
    },
    arrivalTips: [
      "If you’re day-tripping, don’t rely on tight return timings after full-time.",
      "Arrive early to keep last-leg logistics calm.",
    ],
  },

  "st-pauli": {
    stadium: "Millerntor-Stadion",
    city: "Hamburg",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Hamburg Hbf", type: "train", notes: "Main arrival hub; U/S-Bahn connections are easy." },
        { name: "St. Pauli (U-Bahn)", type: "metro", notes: "Closest and most obvious stop; can bottleneck post-match." },
        { name: "Reeperbahn (S-Bahn)", type: "train", notes: "Useful alternative stop; good for dispersal." },
      ],
      tips: [
        "One of the easiest stadiums in Germany for tourists: central and transit-heavy.",
        "If St. Pauli station is packed, walk to an alternative stop for a faster exit.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Central Hamburg driving/parking is not worth it on matchdays.",
      officialLots: ["Use public transport; if driving, park outside and use U/S-Bahn."],
    },
    foodDrink: [
      { name: "St Pauli district", type: "mixed", notes: "Huge choice; can be busy and noisy." },
      { name: "City centre", type: "mixed", notes: "More flexible options if you want calmer." },
    ],
    stay: {
      bestAreas: [
        { area: "St Pauli", notes: "Best for nightlife and instant access." },
        { area: "Altstadt / central", notes: "More balanced base; still easy routing." },
      ],
      budgetAreas: [{ area: "Near Hamburg Hbf", budgetFriendly: true, notes: "Practical and often better value." }],
    },
    arrivalTips: [
      "Arrive early if you want a calmer entry—areas around the ground can be packed.",
      "If you’re staying in St Pauli, you can avoid taxis entirely.",
    ],
  },

  "werder-bremen": {
    stadium: "Weserstadion",
    city: "Bremen",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Bremen Hbf", type: "train", notes: "Main arrival hub; tram connections are straightforward." },
        { name: "City trams/buses", type: "tram", notes: "Standard last leg; allow time near kickoff." },
        { name: "Old town / river area", type: "walk", notes: "Great visitor base; walking can be practical depending on location." },
      ],
      tips: [
        "Bremen is compact—stay central and use tram/walk to the stadium area.",
        "Walking away from the stadium toward the centre can be efficient post-match.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but tram/public transport is usually easier on matchday.",
      officialLots: ["Use city parking + tram/walk for the last leg."],
    },
    foodDrink: [
      { name: "Schnoor / old town", type: "mixed", notes: "Best tourist vibe and food options." },
      { name: "City centre near Hbf", type: "mixed", notes: "Practical for arrivals and quick trips." },
    ],
    stay: {
      bestAreas: [{ area: "City centre / old town", notes: "Best weekend base." }],
      budgetAreas: [{ area: "Near Bremen Hbf", budgetFriendly: true, notes: "Often best value and most practical." }],
    },
    arrivalTips: [
      "If you’re day-tripping, confirm return trains before kickoff.",
      "Arrive early if you want time for food before entering.",
    ],
  },

  "fc-heidenheim": {
    stadium: "Voith-Arena",
    city: "Heidenheim an der Brenz",
    country: "Germany",
    transport: {
      primaryStops: [
        { name: "Heidenheim (rail)", type: "train", notes: "Regional rail access; services can be less frequent." },
        { name: "Ulm Hbf (base option)", type: "train", notes: "Practical base; regional access." },
        { name: "Stuttgart Hbf (base option)", type: "train", notes: "Bigger base; day trip possible with planning." },
      ],
      tips: [
        "Small-city matchday: plan trains and last-leg options before kickoff.",
        "Don’t assume frequent late returns—check schedules early.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible and often practical; still arrive early to avoid local congestion.",
      officialLots: ["Use signed/event parking where offered; otherwise city parking + walk."],
    },
    foodDrink: [
      { name: "Ulm (base)", type: "mixed", notes: "Good base for a weekend with easy rail access." },
      { name: "Stuttgart (base)", type: "mixed", notes: "Best bigger-city base if you want more nightlife." },
    ],
    stay: {
      bestAreas: [{ area: "Ulm (base)", notes: "Best practical base for visitors." }],
      budgetAreas: [{ area: "Near regional stations", budgetFriendly: true, notes: "Practical for short stays; confirm connectivity." }],
    },
    arrivalTips: [
      "Lock your return plan before the match—regional transport has less margin for error.",
      "Arrive early; last-leg services can bunch up near kickoff.",
    ],
  },
};

export default bundesligaLogistics;
