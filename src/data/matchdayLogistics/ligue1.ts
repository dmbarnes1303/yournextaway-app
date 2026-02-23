// src/data/matchdayLogistics/ligue1.ts
import type { MatchdayLogistics } from "./types";

/**
 * Ligue 1 Matchday Logistics (18 teams — your list)
 *
 * Rules:
 * - Useful + conservative (no fake pub/restaurant names).
 * - Stable transport anchors: main rail hubs + major metro/tram stops.
 * - Neutral traveller framing.
 *
 * Keys should match normalizeClubKey(homeTeamName).
 */

const ligue1Logistics: Record<string, MatchdayLogistics> = {
  "paris saint-germain": {
    stadium: "Parc des Princes",
    city: "Paris",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Porte de Saint-Cloud (Metro)", type: "metro", notes: "Common stop for the stadium; queues post-match are normal." },
        { name: "Porte d’Auteuil (Metro)", type: "metro", notes: "Useful alternative depending on your approach." },
        { name: "Saint-Lazare / Châtelet (metro hubs)", type: "metro", notes: "Major interchanges if you’re crossing Paris." },
      ],
      tips: [
        "Stay central and use Metro—driving around the stadium district is rarely worth it.",
        "Post-match: consider walking 10–15 minutes away from the immediate stadium exits before entering the Metro.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "West Paris matchday driving is painful. Expect restrictions and heavy congestion.",
      officialLots: ["If you must drive, park outside the stadium district and use Metro for the final leg."],
    },
    foodDrink: [
      { name: "16th arrondissement (practical)", type: "mixed", notes: "Convenient but busy near kickoff." },
      { name: "Central Paris pre-game", type: "mixed", notes: "Better variety; then Metro out to the stadium." },
    ],
    stay: {
      bestAreas: [
        { area: "Central Paris (Louvre / Châtelet area)", notes: "Best weekend base; easy Metro access." },
        { area: "Saint-Lazare / Opéra", notes: "Great transport hub + hotel supply." },
      ],
      budgetAreas: [
        { area: "Nation / République side", budgetFriendly: true, notes: "Often better value; still well connected by Metro." },
      ],
    },
    arrivalTips: [
      "Arrive 60–90 minutes early for smooth entry and security checks.",
      "Screenshot tickets/QRs before you travel—signal can be busy on big fixtures.",
    ],
  },

  "lens": {
    stadium: "Stade Bollaert-Delelis",
    city: "Lens",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Lens (rail station)", type: "train", notes: "Main arrival point; typically walkable/short local transfer to stadium area." },
        { name: "Lille Flandres / Lille Europe", type: "train", notes: "Common visitor base; easy regional rail access." },
        { name: "Arras (rail)", type: "train", notes: "Alternative base/connection depending on your route." },
      ],
      tips: [
        "Treat this as a Lille-based day trip if you want the easiest visitor setup.",
        "Plan your return train before kickoff—regional services can be busy after full-time.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but matchday congestion builds around the ground.",
      officialLots: ["Use signed/event parking where available; arrive early."],
    },
    foodDrink: [
      { name: "Lille (base)", type: "mixed", notes: "Best variety for a weekend; easy rail to Lens." },
      { name: "Lens town centre", type: "mixed", notes: "Practical if arriving early; keep it simple and walk to the stadium area." },
    ],
    stay: {
      bestAreas: [{ area: "Lille", notes: "Best base for visitors (transport + hotels + nightlife)." }],
      budgetAreas: [{ area: "Near Lille Flandres", budgetFriendly: true, notes: "Very practical; often better value than prime centre." }],
    },
    arrivalTips: [
      "Arrive early if you want a calm walk-in and time to orient yourself.",
      "If you’re day-tripping, build buffer after full-time for station crowds.",
    ],
  },

  "lyon": {
    stadium: "Groupama Stadium",
    city: "Lyon",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Lyon Part-Dieu", type: "train", notes: "Main arrival hub; connect onward by tram/metro." },
        { name: "Tram to stadium district", type: "tram", notes: "Standard matchday approach; allow time for queues near kickoff." },
        { name: "Bellecour (metro hub)", type: "metro", notes: "Central base point; useful if you’re staying in the centre." },
      ],
      tips: [
        "Lyon is easy if you base centrally (Bellecour/Presqu’île) and use tram/metro for the last leg.",
        "Post-match: expect controlled tram queues; waiting briefly can be less stressful.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but matchday traffic is real around the stadium site.",
      officialLots: ["If driving, use official/signed stadium parking only and arrive early."],
    },
    foodDrink: [
      { name: "Presqu’île / Bellecour", type: "mixed", notes: "Best food density; good pre/post match." },
      { name: "Part-Dieu area (practical)", type: "mixed", notes: "Convenient if arriving by rail." },
    ],
    stay: {
      bestAreas: [
        { area: "Presqu’île (central)", notes: "Best weekend base; walkable + transport." },
        { area: "Vieux Lyon", notes: "Great for tourists; quick Metro access." },
      ],
      budgetAreas: [{ area: "Near Part-Dieu", budgetFriendly: true, notes: "Often better value; super practical for trains." }],
    },
    arrivalTips: [
      "Arrive 60–90 minutes early if you want time for food and a calm entry.",
      "If you’re catching a late train, don’t cut timing tight—stadium egress can be slow.",
    ],
  },

  "marseille": {
    stadium: "Stade Vélodrome",
    city: "Marseille",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Marseille Saint-Charles", type: "train", notes: "Main arrival hub; connect via metro." },
        { name: "Rond-Point du Prado (Metro)", type: "metro", notes: "Primary stop for the stadium district; busy post-match." },
        { name: "Castellane (Metro)", type: "metro", notes: "Useful interchange; good for staying central-ish." },
      ],
      tips: [
        "Metro is the cleanest matchday route; expect crowding after full-time.",
        "If you want a smoother exit, walk 10–15 minutes away from the immediate stadium area before entering the Metro.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Parking around the Vélodrome zone is difficult on matchdays. Use Metro where possible.",
      officialLots: ["If driving, plan park-and-ride style via a Metro-accessible area."],
    },
    foodDrink: [
      { name: "Old Port (Vieux-Port)", type: "mixed", notes: "Best tourist base; then Metro to the stadium." },
      { name: "Prado district (practical)", type: "mixed", notes: "Convenient but crowded near kickoff." },
    ],
    stay: {
      bestAreas: [
        { area: "Vieux-Port", notes: "Best weekend base for tourists." },
        { area: "Castellane / central", notes: "Practical for Metro routing." },
      ],
      budgetAreas: [{ area: "Near Saint-Charles", budgetFriendly: true, notes: "Very practical; choose carefully by exact street." }],
    },
    arrivalTips: [
      "Arrive early—security/entry and crowds are heavier for big fixtures.",
      "Keep your post-match plan simple (Metro + short walk) rather than taxis in gridlock.",
    ],
  },

  "lille": {
    stadium: "Decathlon Arena – Stade Pierre-Mauroy",
    city: "Villeneuve-d’Ascq (Lille)",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Lille Europe", type: "train", notes: "Main international rail hub; easy Metro connections." },
        { name: "Lille Flandres", type: "train", notes: "Central rail station; strong Metro access." },
        { name: "Metro to Villeneuve-d’Ascq area", type: "metro", notes: "Standard matchday approach; expect queues post-match." },
      ],
      tips: [
        "Lille is ideal for a weekend: compact centre + easy Metro out to the stadium area.",
        "Post-match Metro can be busy; waiting briefly often improves comfort.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but matchday traffic is common around the stadium district.",
      officialLots: ["If driving, use official/signed stadium parking and arrive early."],
    },
    foodDrink: [
      { name: "Vieux Lille", type: "mixed", notes: "Best pre/post atmosphere and food." },
      { name: "Near Lille Flandres/Europe (practical)", type: "mixed", notes: "Convenient if you’re in/out by train." },
    ],
    stay: {
      bestAreas: [
        { area: "Vieux Lille", notes: "Best tourist base and vibe." },
        { area: "City centre near stations", notes: "Most practical for rail-heavy trips." },
      ],
      budgetAreas: [{ area: "Near Lille Flandres", budgetFriendly: true, notes: "Often the best value while staying central." }],
    },
    arrivalTips: [
      "If you’re coming from the UK/Belgium by rail, book return trains with buffer after full-time.",
      "Arrive early if you want time to eat in Vieux Lille before heading out.",
    ],
  },

  "rennes": {
    stadium: "Roazhon Park",
    city: "Rennes",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Rennes (rail station)", type: "train", notes: "Main arrival hub; city is compact for visitors." },
        { name: "Rennes Metro", type: "metro", notes: "Useful for cross-city movement; last leg may be walk/bus depending on route." },
        { name: "City centre", type: "walk", notes: "Good base; many areas are walkable." },
      ],
      tips: [
        "Rennes is straightforward: stay central and plan a simple walk/bus last leg.",
        "If day-tripping from Paris, confirm late returns before kickoff.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but central matchday traffic can slow you down.",
      officialLots: ["Use city parking + public transport/walk for the last leg where possible."],
    },
    foodDrink: [
      { name: "Historic centre", type: "mixed", notes: "Best visitor area for food and atmosphere." },
      { name: "Near station (practical)", type: "mixed", notes: "Good if you’re doing quick in/out rail." },
    ],
    stay: {
      bestAreas: [{ area: "City centre / historic core", notes: "Best base for a weekend." }],
      budgetAreas: [{ area: "Near Rennes station", budgetFriendly: true, notes: "Practical and often better value." }],
    },
    arrivalTips: [
      "Arrive early if you want a relaxed pre-match meal in the centre.",
      "Have a return plan—regional trains can feel ‘suddenly busy’ after full-time.",
    ],
  },

  "strasbourg": {
    stadium: "Stade de la Meinau",
    city: "Strasbourg",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Strasbourg (rail station)", type: "train", notes: "Main arrival hub; good tram connections." },
        { name: "Tram to stadium district", type: "tram", notes: "Standard last leg; allow time near kickoff." },
        { name: "Grand Île (city centre)", type: "walk", notes: "Tourist base; easy tram access." },
      ],
      tips: [
        "Strasbourg is ideal for a city break: stay central and use tram for the last leg.",
        "Post-match: trams can be packed; waiting 10–15 minutes often helps.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Central Strasbourg driving/parking is rarely worth it. Tram is the obvious option.",
      officialLots: ["If driving, park outside the centre and use tram/park-and-ride style approach."],
    },
    foodDrink: [
      { name: "Grand Île", type: "mixed", notes: "Best tourist zone; lots of options." },
      { name: "Krutenau", type: "bar", notes: "Good nightlife/food district; still central." },
    ],
    stay: {
      bestAreas: [
        { area: "Grand Île / central", notes: "Best base for tourists." },
        { area: "Krutenau", notes: "Great for evenings; still walkable/connected." },
      ],
      budgetAreas: [{ area: "Near Strasbourg station", budgetFriendly: true, notes: "Practical for rail-heavy trips; check exact area." }],
    },
    arrivalTips: [
      "If you’re crossing from Germany, confirm your late return options before kickoff.",
      "Arrive early to enjoy the centre—Strasbourg is a great weekend city.",
    ],
  },

  "as monaco": {
    stadium: "Stade Louis II",
    city: "Monaco",
    country: "Monaco",
    transport: {
      primaryStops: [
        { name: "Monaco–Monte-Carlo (rail)", type: "train", notes: "Main arrival point; walking is common but expect hills/steps." },
        { name: "Nice-Ville (base option)", type: "train", notes: "Common visitor base; frequent regional trains." },
        { name: "Mentons (base option)", type: "train", notes: "Alternative base along the coast depending on price/availability." },
      ],
      tips: [
        "Most visitors base in Nice and take the regional train—simple and frequent (but busy).",
        "In Monaco, walking is normal but the terrain can be steep; allow extra time.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving/parking in Monaco is expensive and stressful on event days. Train is the smarter plan.",
      officialLots: ["If you drive, use official public car parks and expect cost/queues."],
    },
    foodDrink: [
      { name: "Nice (base)", type: "mixed", notes: "Best value and variety for most travellers." },
      { name: "Monaco harbour area", type: "mixed", notes: "Convenient but can be pricey; book ahead if needed." },
    ],
    stay: {
      bestAreas: [{ area: "Nice", notes: "Best value base; easy train to Monaco." }],
      budgetAreas: [{ area: "Mentons", budgetFriendly: true, notes: "Sometimes cheaper than Nice/Monaco; still on the rail line." }],
    },
    arrivalTips: [
      "Build buffer: trains can be busy and Monaco walking routes take longer than expected.",
      "If you’re returning late to Nice, check last train times before kickoff.",
    ],
  },

  "lorient": {
    stadium: "Stade du Moustoir",
    city: "Lorient",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Lorient (rail station)", type: "train", notes: "Main arrival hub; last leg often walk/bus/taxi." },
        { name: "Rennes (base option)", type: "train", notes: "Bigger base city; rail connections across Brittany." },
        { name: "Vannes (base option)", type: "train", notes: "Alternative nearby base depending on availability." },
      ],
      tips: [
        "Brittany trips are easier when you plan trains first, match second (especially for day trips).",
        "Expect a simple walk/bus last leg from town—arrive early if you want it stress-free.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but local congestion builds near kickoff around the stadium zone.",
      officialLots: ["Use city parking + walk where possible."],
    },
    foodDrink: [
      { name: "Lorient town centre", type: "mixed", notes: "Practical pre/post base; keep it simple." },
      { name: "Rennes (base)", type: "mixed", notes: "Best bigger-city base if you’re doing a wider trip." },
    ],
    stay: {
      bestAreas: [{ area: "Lorient centre", notes: "Simple and practical for match-focused trips." }],
      budgetAreas: [{ area: "Near Lorient station", budgetFriendly: true, notes: "Often best value for short stays." }],
    },
    arrivalTips: [
      "If you’re day-tripping, confirm return trains before kickoff—don’t wing it.",
      "Arrive early if you want time for food before entry.",
    ],
  },

  "toulouse": {
    stadium: "Stadium de Toulouse",
    city: "Toulouse",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Toulouse Matabiau", type: "train", notes: "Main rail hub; connect via metro/bus." },
        { name: "Jean-Jaurès (Metro hub)", type: "metro", notes: "Key interchange; useful base point for routing." },
        { name: "Metro/bus to stadium district", type: "bus", notes: "Last leg commonly metro + walk or bus depending on routing." },
      ],
      tips: [
        "Stay central and use Metro; Toulouse is visitor-friendly for match weekends.",
        "Post-match: walking a little away from the stadium area can help with taxi/ride pickup.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but the stadium district can clog up close to kickoff/full-time.",
      officialLots: ["If driving, use official/signed parking where offered; arrive early."],
    },
    foodDrink: [
      { name: "Capitole / central", type: "mixed", notes: "Best tourist base for food and atmosphere." },
      { name: "Near Matabiau (practical)", type: "mixed", notes: "Convenient if you’re arriving/departing by rail." },
    ],
    stay: {
      bestAreas: [{ area: "Capitole / city centre", notes: "Best base for a weekend." }],
      budgetAreas: [{ area: "Near Matabiau", budgetFriendly: true, notes: "Very practical and often better value." }],
    },
    arrivalTips: [
      "Arrive early if you want a relaxed pre-match meal in the centre.",
      "If you’re catching a late train, build buffer—dispersal can be slow.",
    ],
  },

  "brest": {
    stadium: "Stade Francis-Le Blé",
    city: "Brest",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Brest (rail station)", type: "train", notes: "Main arrival hub; last leg likely bus/taxi." },
        { name: "Rennes (base option)", type: "train", notes: "Common base for Brittany trips; connects onward to Brest." },
        { name: "City buses", type: "bus", notes: "Likely the practical last leg; confirm routes/timing on matchday." },
      ],
      tips: [
        "This is a ‘long rail’ destination—plan the full travel day, not just the match.",
        "If you’re day-tripping, lock return options early; frequencies can drop later.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but local matchday congestion can build near the stadium zone.",
      officialLots: ["Use city parking and plan a short last-leg walk/bus if needed."],
    },
    foodDrink: [
      { name: "City centre", type: "mixed", notes: "Best practical base for food pre/post." },
      { name: "Rennes (base)", type: "mixed", notes: "Better variety if you’re not staying in Brest." },
    ],
    stay: {
      bestAreas: [{ area: "Brest centre", notes: "Simple and practical if staying overnight." }],
      budgetAreas: [{ area: "Near Brest station", budgetFriendly: true, notes: "Often best value; very practical." }],
    },
    arrivalTips: [
      "Double-check return travel timing—Brittany routes can be unforgiving if you miss a connection.",
      "Arrive early; local buses/taxis can bottleneck near kickoff.",
    ],
  },

  "angers": {
    stadium: "Stade Raymond-Kopa",
    city: "Angers",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Angers Saint-Laud", type: "train", notes: "Main arrival hub; city is compact for visitors." },
        { name: "Nantes (base option)", type: "train", notes: "Easy base; short rail hop to Angers." },
        { name: "Paris (day trip option)", type: "train", notes: "Possible with planning; confirm late returns." },
      ],
      tips: [
        "Angers is easy as a Nantes-based day trip if you want a bigger weekend city.",
        "Plan your return train before kickoff to avoid stress after full-time.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but matchday traffic near the ground can still slow you down.",
      officialLots: ["Use city parking + walk where possible."],
    },
    foodDrink: [
      { name: "Angers centre", type: "mixed", notes: "Practical pre/post base." },
      { name: "Nantes (base)", type: "mixed", notes: "Better variety for a full weekend." },
    ],
    stay: {
      bestAreas: [{ area: "Angers centre", notes: "Simple and walkable for match weekends." }],
      budgetAreas: [{ area: "Near Angers Saint-Laud", budgetFriendly: true, notes: "Practical and often better value." }],
    },
    arrivalTips: [
      "If you’re day-tripping, allow buffer after full-time—stations can get busy.",
      "Arrive early to keep the last leg calm and simple.",
    ],
  },

  "le havre": {
    stadium: "Stade Océane",
    city: "Le Havre",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Le Havre (rail station)", type: "train", notes: "Main arrival hub; last leg likely tram/bus/taxi." },
        { name: "Rouen (base option)", type: "train", notes: "Regional base option depending on prices." },
        { name: "Paris (base option)", type: "train", notes: "Possible as a base; confirm late returns if day-tripping." },
      ],
      tips: [
        "Treat as a Normandy rail trip—plan your return before kickoff.",
        "Last-leg public transport can be less frequent than big cities; arrive early.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible; still expect matchday congestion near the stadium zone.",
      officialLots: ["Use official/signed parking where offered; otherwise city parking + last-leg walk/tram."],
    },
    foodDrink: [
      { name: "City centre / waterfront", type: "mixed", notes: "Best visitor base for food pre/post." },
      { name: "Rouen (base)", type: "mixed", notes: "Better variety if you’re not staying in Le Havre." },
    ],
    stay: {
      bestAreas: [{ area: "Le Havre centre", notes: "Practical base if staying overnight." }],
      budgetAreas: [{ area: "Near Le Havre station", budgetFriendly: true, notes: "Often best value; very practical." }],
    },
    arrivalTips: [
      "Check your return train plan early—don’t leave it to after the match.",
      "Arrive early if you’re relying on local buses/trams for the last leg.",
    ],
  },

  "nice": {
    stadium: "Allianz Riviera",
    city: "Nice",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Nice-Ville", type: "train", notes: "Main arrival hub; connect via tram." },
        { name: "Tram to stadium district", type: "tram", notes: "Standard approach; allow extra time near kickoff." },
        { name: "Jean Médecin / central tram corridor", type: "tram", notes: "Useful if you’re staying central; easy connection." },
      ],
      tips: [
        "Stay central (near tram) and use public transport—driving to the stadium is rarely worth it.",
        "Post-match: trams can be packed; waiting 10–15 minutes often makes it calmer.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but matchday congestion and event management can slow you down.",
      officialLots: ["If driving, use official/signed stadium parking; arrive early."],
    },
    foodDrink: [
      { name: "Old Town / Promenade area", type: "mixed", notes: "Best tourist base; then tram out." },
      { name: "Libération district", type: "food", notes: "Great food area; still connected by tram." },
    ],
    stay: {
      bestAreas: [
        { area: "Old Town / central", notes: "Best weekend base." },
        { area: "Jean Médecin corridor", notes: "Most practical for tram routing." },
      ],
      budgetAreas: [{ area: "Near Nice-Ville", budgetFriendly: true, notes: "Practical and often better value." }],
    },
    arrivalTips: [
      "If you’re also doing Monaco/Italian Riviera, check train times before kickoff.",
      "Arrive early to keep the last leg (tram + walk) stress-free.",
    ],
  },

  "paris fc": {
    stadium: "Stade Charléty",
    city: "Paris",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Gare Montparnasse", type: "train", notes: "Major rail hub; good Metro connections." },
        { name: "Denfert-Rochereau (Metro/RER)", type: "metro", notes: "Useful hub for southern Paris routing." },
        { name: "RER/Tram/Bus options (south Paris)", type: "other", notes: "Charléty area is well served; choose based on where you’re staying." },
      ],
      tips: [
        "This is a simpler Paris matchday than PSG for crowds—still use Metro and avoid driving.",
        "Pick a base near a major interchange so you’re not doing awkward transfers late.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Paris driving/parking remains a poor plan—use Metro/RER where possible.",
      officialLots: ["If driving, park outside central zones and use transit for the last leg."],
    },
    foodDrink: [
      { name: "Latin Quarter area (base)", type: "mixed", notes: "Great visitor zone; easy southern Paris access." },
      { name: "Montparnasse area (practical)", type: "mixed", notes: "Good transport hub; lots of simple options." },
    ],
    stay: {
      bestAreas: [
        { area: "Latin Quarter / central-south", notes: "Great tourist base + routing." },
        { area: "Montparnasse", notes: "Transport-heavy and practical." },
      ],
      budgetAreas: [{ area: "Nation / outer central", budgetFriendly: true, notes: "Often better value; still well connected." }],
    },
    arrivalTips: [
      "Arrive 60 minutes early if you want a calm entry and time to find your seat.",
      "Have a post-match route planned—Paris transfers are easy when you choose a good hub.",
    ],
  },

  "auxerre": {
    stadium: "Stade de l’Abbé-Deschamps",
    city: "Auxerre",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Auxerre-St-Gervais (rail)", type: "train", notes: "Main arrival; last leg likely walk/bus/taxi." },
        { name: "Paris (base option)", type: "train", notes: "Possible as a base; confirm late returns if day-tripping." },
        { name: "Dijon (base option)", type: "train", notes: "Alternative base depending on route and pricing." },
      ],
      tips: [
        "This is a smaller-city day trip: the key is return train planning before kickoff.",
        "Allow extra time for the last leg—local transport is less frequent than big cities.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible and can be practical; still arrive early to avoid local congestion.",
      officialLots: ["Use signed/city parking and plan a short walk to the ground."],
    },
    foodDrink: [
      { name: "Auxerre centre", type: "mixed", notes: "Practical pre/post base; keep it simple." },
      { name: "Paris (base)", type: "mixed", notes: "Best variety if you’re not staying locally." },
    ],
    stay: {
      bestAreas: [{ area: "Auxerre centre", notes: "Simple and practical if staying overnight." }],
      budgetAreas: [{ area: "Near Auxerre rail station", budgetFriendly: true, notes: "Often best value for short stays." }],
    },
    arrivalTips: [
      "Confirm late returns before kickoff—missing a train can mean a long wait.",
      "Arrive early; smaller towns have less ‘slack’ for last-minute changes.",
    ],
  },

  "nantes": {
    stadium: "Stade de la Beaujoire",
    city: "Nantes",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Nantes (rail station)", type: "train", notes: "Main arrival hub; connect via tram/bus." },
        { name: "Tram to stadium district", type: "tram", notes: "Typical approach; allow time near kickoff." },
        { name: "Commerce (tram hub)", type: "tram", notes: "Central interchange; useful if you’re staying in the centre." },
      ],
      tips: [
        "Nantes is a great weekend base: stay central and tram out to the stadium district.",
        "Post-match: trams can be busy; waiting briefly can make it easier.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but matchday congestion can slow you near the stadium.",
      officialLots: ["Use park-and-ride style approach where possible; tram for the last leg."],
    },
    foodDrink: [
      { name: "Bouffay / city centre", type: "mixed", notes: "Best tourist base for food and bars." },
      { name: "Île de Nantes", type: "mixed", notes: "Modern area with options; still connected." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre (Bouffay/Commerce)", notes: "Best base for visitors." },
        { area: "Île de Nantes", notes: "Good alternative base; modern hotels." },
      ],
      budgetAreas: [{ area: "Near Nantes station", budgetFriendly: true, notes: "Practical and often better value." }],
    },
    arrivalTips: [
      "Arrive early if you want time in the centre before heading out.",
      "If you’re day-tripping from Paris, check late returns before kickoff.",
    ],
  },

  "metz": {
    stadium: "Stade Saint-Symphorien",
    city: "Metz",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Metz-Ville", type: "train", notes: "Main arrival hub; city is compact for visitors." },
        { name: "Nancy (base option)", type: "train", notes: "Alternative base city; regional access." },
        { name: "Luxembourg (base option)", type: "train", notes: "Possible base; check cross-border train timing." },
      ],
      tips: [
        "Metz is straightforward: stay central and keep last-leg movement simple (walk/bus).",
        "If you’re basing in Luxembourg, confirm late return trains before kickoff.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but matchday congestion can build near the stadium zone.",
      officialLots: ["Use city parking + walk for the last leg where possible."],
    },
    foodDrink: [
      { name: "Metz centre", type: "mixed", notes: "Practical pre/post base." },
      { name: "Luxembourg (base)", type: "mixed", notes: "Stronger weekend base if you’re doing a wider trip." },
    ],
    stay: {
      bestAreas: [{ area: "Metz centre", notes: "Best for a simple overnight match trip." }],
      budgetAreas: [{ area: "Near Metz-Ville", budgetFriendly: true, notes: "Practical and often better value." }],
    },
    arrivalTips: [
      "If you’re crossing borders, always check last train times before kickoff.",
      "Arrive early—local buses/taxis can bottleneck close to kickoff.",
    ],
  },
};

export default ligue1Logistics;
