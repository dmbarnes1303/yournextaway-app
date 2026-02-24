// src/data/matchdayLogistics/ligue1.ts
import type { MatchdayLogistics } from "./types";

/**
 * Ligue 1 Matchday Logistics (18 teams — per your list)
 *
 * Rules:
 * - Useful + conservative (no fake venue names / no specific pub names).
 * - Stable transport anchors: main rail hubs + major Metro/Tram stops.
 * - Neutral traveller framing.
 *
 * IMPORTANT:
 * Keys MUST match normalizeClubKey(homeTeamName) from src/data/clubKey.ts
 */

const ligue1Logistics: Record<string, MatchdayLogistics> = {
  "paris-saint-germain": {
    stadium: "Parc des Princes",
    city: "Paris",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Paris Gare du Nord", type: "train", notes: "Major arrival hub (Eurostar + national rail). Connect to Metro/RER." },
        { name: "Porte de Saint-Cloud (Metro)", type: "metro", notes: "Common matchday stop; short walk." },
        { name: "Michel-Ange – Molitor (Metro)", type: "metro", notes: "Good alternative station option to spread crowds." },
      ],
      tips: [
        "Stay central and use the Metro for the last leg; driving is rarely worth it in Paris.",
        "Post-match: walk 10–15 minutes away from the stadium zone before entering the Metro if it’s packed.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Paris matchday driving is painful: congestion + restrictions + limited parking.",
      officialLots: ["Prefer Metro/RER. If you must drive, park outside central Paris and use transit in."],
    },
    foodDrink: [
      { name: "16th arrondissement (near stadium)", type: "mixed", notes: "Convenient but can feel busy and expensive." },
      { name: "Central Paris", type: "mixed", notes: "Better variety; then Metro out to the match." },
    ],
    stay: {
      bestAreas: [
        { area: "Central Paris (1–7 arr.)", notes: "Best tourist base; easy Metro access everywhere." },
        { area: "Saint-Germain / Invalides area", notes: "Great base and easy transit." },
      ],
      budgetAreas: [{ area: "Near Gare du Nord / Gare de l’Est", budgetFriendly: true, notes: "Practical for arrivals; choose carefully by exact street." }],
    },
    arrivalTips: [
      "Arrive 60–90 mins early if you want a calm entry and time to find your gate.",
      "If you’re doing a same-day return (Eurostar/flight), build a big buffer post-match.",
    ],
  },

  "lens": {
    stadium: "Stade Bollaert-Delelis",
    city: "Lens",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Lille Flandres", type: "train", notes: "Common base rail station; easy regional access to Lens." },
        { name: "Lille Europe", type: "train", notes: "Eurostar/HSR hub; convenient base for visitors." },
        { name: "Lens (rail)", type: "train", notes: "Local station; last leg is typically walk/taxi depending on route." },
      ],
      tips: [
        "Most visitors stay in Lille and do Lens as a simple train day trip.",
        "Check return train times before kickoff; late options can be less frequent.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but matchday congestion builds around the stadium zone.",
      officialLots: ["If driving, arrive early and follow signed event parking."],
    },
    foodDrink: [
      { name: "Lille (base)", type: "mixed", notes: "Best variety and nightlife if you’re making a weekend of it." },
      { name: "Lens town centre", type: "mixed", notes: "Practical pre/post if you’re not rushing trains." },
    ],
    stay: {
      bestAreas: [{ area: "Lille city centre", notes: "Best base for visitors; great food/nightlife + easy rail." }],
      budgetAreas: [{ area: "Near Lille Flandres/Europe stations", budgetFriendly: true, notes: "Practical and often better value." }],
    },
    arrivalTips: [
      "Don’t cut your return tight if you’re relying on trains after full-time.",
      "Arrive early if you want to keep the last leg calm and avoid queues.",
    ],
  },

  "lyon": {
    stadium: "Groupama Stadium",
    city: "Lyon",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Lyon Part-Dieu", type: "train", notes: "Main arrival hub for visitors; key interchange." },
        { name: "Lyon Perrache", type: "train", notes: "Secondary hub; depends on where you stay." },
        { name: "Tram/metro to stadium district", type: "tram", notes: "Standard matchday approach; follow event routing/signage." },
      ],
      tips: [
        "Base near Part-Dieu for the easiest rail + city movement.",
        "Post-match: expect controlled flows; waiting 10–15 minutes can be calmer.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but congestion is real; public transport is usually easier.",
      officialLots: ["Use official/event parking only if driving; arrive early."],
    },
    foodDrink: [
      { name: "Presqu’île (central)", type: "mixed", notes: "Best visitor base for food/drink." },
      { name: "Part-Dieu area", type: "mixed", notes: "Practical if you’re train-based." },
    ],
    stay: {
      bestAreas: [
        { area: "Presqu’île", notes: "Best tourist base and walkable city break." },
        { area: "Part-Dieu", notes: "Best for logistics and rail convenience." },
      ],
      budgetAreas: [{ area: "Near Part-Dieu station", budgetFriendly: true, notes: "Often strong value + practical." }],
    },
    arrivalTips: [
      "If you’re connecting back by train, build buffer post-match.",
      "Have your transit route saved offline — matchday networks can be busy.",
    ],
  },

  "marseille": {
    stadium: "Orange Vélodrome",
    city: "Marseille",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Marseille Saint-Charles", type: "train", notes: "Main arrival hub; Metro connections are straightforward." },
        { name: "Rond-Point du Prado (Metro)", type: "metro", notes: "Common matchday stop; short walk to the stadium." },
        { name: "Castellane (Metro)", type: "metro", notes: "Useful interchange station depending on where you’re staying." },
      ],
      tips: [
        "Stay central or near the coast and use the Metro for matchday.",
        "Post-match: expect crowding on Metro platforms — move away from the stadium zone first if needed.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving near the Vélodrome is slow on matchdays; parking is limited.",
      officialLots: ["Use Metro. If driving, park well outside the stadium zone and transit in."],
    },
    foodDrink: [
      { name: "Vieux-Port", type: "mixed", notes: "Best tourist base and atmosphere pre/post." },
      { name: "Prado area (near stadium)", type: "mixed", notes: "Convenient but matchday-busy." },
    ],
    stay: {
      bestAreas: [
        { area: "Vieux-Port", notes: "Best weekend base; walkable and tourist-friendly." },
        { area: "Cours Julien / La Plaine", notes: "Good food/nightlife area; check exact location." },
      ],
      budgetAreas: [{ area: "Near Saint-Charles station", budgetFriendly: true, notes: "Practical for arrivals/returns; be selective by street." }],
    },
    arrivalTips: [
      "Arrive early if you want a calm entry and to find your gate without rushing.",
      "If you’re catching an early train/flight next day, keep your evening plan realistic.",
    ],
  },

  "lille": {
    stadium: "Stade Pierre-Mauroy (Decathlon Arena – Stade Pierre-Mauroy)",
    city: "Lille",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Lille Flandres", type: "train", notes: "Central station; good base for visitors." },
        { name: "Lille Europe", type: "train", notes: "Eurostar/HSR hub; extremely practical." },
        { name: "Metro to stadium area", type: "metro", notes: "Typical last leg; expect crowding post-match." },
      ],
      tips: [
        "Lille is one of the best ‘match + weekend’ cities: compact centre + great food + easy rail links.",
        "Post-match: Metro queues are normal—waiting 10–15 minutes can be smoother.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but the easiest visitor approach is rail + Metro.",
      officialLots: ["If driving, use official/signed event parking and arrive early."],
    },
    foodDrink: [
      { name: "Vieux Lille (old town)", type: "mixed", notes: "Best food/drink density for visitors." },
      { name: "Near Lille Europe/Flandres", type: "mixed", notes: "Practical if you’re train-based." },
    ],
    stay: {
      bestAreas: [
        { area: "Vieux Lille", notes: "Best tourist base: restaurants, bars, walkability." },
        { area: "Near Lille Europe/Flandres", notes: "Best for logistics (Eurostar/HSR)." },
      ],
      budgetAreas: [{ area: "Euralille edge", budgetFriendly: true, notes: "Often better value while staying close to stations." }],
    },
    arrivalTips: [
      "If you’re coming from London/Brussels, Lille is ridiculously convenient—just don’t cut the return too tight.",
      "Screenshot your return booking in case the station gets busy post-match.",
    ],
  },

  "rennes": {
    stadium: "Roazhon Park",
    city: "Rennes",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Rennes (rail)", type: "train", notes: "Main arrival hub; TGV access from Paris is common." },
        { name: "City centre transit", type: "metro", notes: "Use local transit/walking for the last leg depending on your base." },
        { name: "Stadium district (walk/bus)", type: "bus", notes: "Last leg often bus/walk; allow time near kickoff." },
      ],
      tips: [
        "Rennes is compact—stay central and keep matchday simple with transit/walking.",
        "If you’re doing a Paris day trip, check the last return trains before kickoff.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but city-centre stays + transit usually beat matchday traffic.",
      officialLots: ["Use city parking + transit/walk for the last leg if possible."],
    },
    foodDrink: [
      { name: "Historic centre", type: "mixed", notes: "Best visitor base for food/drink." },
      { name: "Near the station", type: "mixed", notes: "Practical for short stays and early departures." },
    ],
    stay: {
      bestAreas: [{ area: "Rennes city centre", notes: "Best weekend base; walkable and tourist-friendly." }],
      budgetAreas: [{ area: "Near Rennes station", budgetFriendly: true, notes: "Often best value + practical." }],
    },
    arrivalTips: [
      "Arrive early if you’re unfamiliar with the last-leg route to the ground.",
      "If you’re relying on late trains, keep buffer after full-time.",
    ],
  },

  "strasbourg": {
    stadium: "Stade de la Meinau",
    city: "Strasbourg",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Strasbourg (rail)", type: "train", notes: "Main arrival hub; strong regional and TGV links." },
        { name: "Tram network (city)", type: "tram", notes: "Best way to move around Strasbourg; typical matchday last leg." },
        { name: "City centre / Grande Île", type: "walk", notes: "Excellent tourist base; trams are easy from here." },
      ],
      tips: [
        "Strasbourg is perfect for a weekend: stay central and use trams for everything.",
        "Post-match: trams can be packed—waiting briefly can make it calmer.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but Strasbourg is transit-first; trams are usually the smart move.",
      officialLots: ["If driving, use park-and-ride style parking and tram in."],
    },
    foodDrink: [
      { name: "Grande Île / Petite France", type: "mixed", notes: "Best visitor zone: food, bars, sightseeing." },
      { name: "Near the station", type: "mixed", notes: "Practical for short stays." },
    ],
    stay: {
      bestAreas: [{ area: "Grande Île / central", notes: "Best tourist base and easiest logistics." }],
      budgetAreas: [{ area: "Near Strasbourg station", budgetFriendly: true, notes: "Often best value while staying connected." }],
    },
    arrivalTips: [
      "If you’re coming from Germany/Switzerland, check return times before kickoff.",
      "Arrive early if you want time to explore the centre pre-match.",
    ],
  },

  "monaco": {
    stadium: "Stade Louis II",
    city: "Monaco",
    country: "Monaco",
    transport: {
      primaryStops: [
        { name: "Nice-Ville", type: "train", notes: "Common base for visitors; frequent regional rail along the coast." },
        { name: "Monaco–Monte-Carlo (rail)", type: "train", notes: "Primary arrival point; expect walking and elevation changes." },
        { name: "Coastal rail corridor (Villefranche/Èze area)", type: "train", notes: "Useful if staying along the coast; confirm schedules." },
      ],
      tips: [
        "Most visitors stay in Nice and train in for the match — simplest setup.",
        "Monaco involves hills/stairs; wear shoes that handle walking.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Parking in Monaco is expensive and can be stressful on event days. Train is smarter.",
      officialLots: ["Use regional rail; if driving, plan a paid garage and expect delays."],
    },
    foodDrink: [
      { name: "Nice (base)", type: "mixed", notes: "Best variety and better value than Monaco." },
      { name: "Monaco harbour area", type: "mixed", notes: "Scenic but expensive; book ahead if you want sit-down." },
    ],
    stay: {
      bestAreas: [{ area: "Nice (base)", notes: "Best all-round base for visitors; easy train in/out." }],
      budgetAreas: [{ area: "Near Nice-Ville station", budgetFriendly: true, notes: "Practical for matchday rail." }],
    },
    arrivalTips: [
      "Check late return trains if you’re not staying overnight.",
      "Arrive early—Monaco walking routes can take longer than you expect.",
    ],
  },

  "lorient": {
    stadium: "Stade du Moustoir",
    city: "Lorient",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Lorient (rail)", type: "train", notes: "Main arrival hub; regional services." },
        { name: "Rennes (base option)", type: "train", notes: "Bigger base city; day trip possible with planning." },
        { name: "Nantes (base option)", type: "train", notes: "Alternative base; check journey times." },
      ],
      tips: [
        "This is a smaller-city matchday: plan train times (especially return) before kickoff.",
        "If you want nightlife and easy logistics, base in a bigger city and day trip.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but matchday congestion can build around the stadium zone.",
      officialLots: ["Arrive early if driving; use signed/event parking where available."],
    },
    foodDrink: [
      { name: "Lorient centre", type: "mixed", notes: "Practical pre/post option; keep timings flexible." },
      { name: "Rennes (base)", type: "mixed", notes: "Best variety if you’re staying there." },
    ],
    stay: {
      bestAreas: [{ area: "Rennes (base)", notes: "Best all-round base for visitors." }],
      budgetAreas: [{ area: "Near Lorient station", budgetFriendly: true, notes: "Practical if staying locally." }],
    },
    arrivalTips: [
      "Lock your return plan before kickoff—regional transport has less margin for error.",
      "Arrive early; smaller towns have fewer last-minute options.",
    ],
  },

  "toulouse": {
    stadium: "Stadium de Toulouse",
    city: "Toulouse",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Toulouse-Matabiau", type: "train", notes: "Main arrival hub; connect to Metro/bus." },
        { name: "Jean-Jaurès (Metro)", type: "metro", notes: "Key interchange in the centre; good base point." },
        { name: "Bus/Metro to stadium area", type: "bus", notes: "Last leg varies; allow time near kickoff." },
      ],
      tips: [
        "Stay central and treat Matabiau/Jean-Jaurès as your routing anchors.",
        "Post-match: walking away from the immediate stadium zone can make transit easier.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible, but transit from central Toulouse is usually easier on matchdays.",
      officialLots: ["If driving, arrive early and use signed/event parking where available."],
    },
    foodDrink: [
      { name: "Capitole / central", type: "mixed", notes: "Best visitor base for food/drink." },
      { name: "Near Matabiau", type: "mixed", notes: "Practical for short stays and early departures." },
    ],
    stay: {
      bestAreas: [{ area: "City centre (Capitole area)", notes: "Best weekend base; walkable and lively." }],
      budgetAreas: [{ area: "Near Matabiau station", budgetFriendly: true, notes: "Often best value while staying practical." }],
    },
    arrivalTips: [
      "If you’re doing a day trip, don’t cut the return tight after full-time.",
      "Arrive early if you’re unfamiliar with the last-leg bus/Metro routing.",
    ],
  },

  "brest": {
    stadium: "Stade Francis-Le Blé",
    city: "Brest",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Brest (rail)", type: "train", notes: "Main arrival hub; long-distance rail is possible but plan timings." },
        { name: "Rennes (connection hub)", type: "train", notes: "Common transfer point; check schedules before kickoff." },
        { name: "City buses to stadium area", type: "bus", notes: "Last leg typically bus/taxi/walk depending on your base." },
      ],
      tips: [
        "This is a longer journey city break—confirm rail schedules both ways before you commit.",
        "If you’re on a tight schedule, staying overnight is usually smarter than same-day returns.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible; buses and local transit are usually fine if you’re staying central.",
      officialLots: ["If driving, arrive early and follow signed event parking."],
    },
    foodDrink: [
      { name: "Brest centre", type: "mixed", notes: "Practical pre/post option." },
      { name: "Rennes (base)", type: "mixed", notes: "If you’re using it as a bigger base city, it has better variety." },
    ],
    stay: {
      bestAreas: [{ area: "Brest centre", notes: "Practical base; check exact location for ease." }],
      budgetAreas: [{ area: "Near Brest station", budgetFriendly: true, notes: "Practical for arrivals/returns." }],
    },
    arrivalTips: [
      "If you’re relying on long rail legs, build buffer and don’t cut last trains tight.",
      "Arrive early if you want a calm last-leg route to the ground.",
    ],
  },

  "angers": {
    stadium: "Stade Raymond-Kopa",
    city: "Angers",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Angers Saint-Laud", type: "train", notes: "Main arrival hub; straightforward for visitors." },
        { name: "Nantes (base option)", type: "train", notes: "Good weekend base; day trip possible." },
        { name: "Paris (day trip)", type: "train", notes: "Possible via TGV but plan returns carefully." },
      ],
      tips: [
        "Angers works well as a Nantes base day trip if you want more nightlife.",
        "Check return trains before kickoff—don’t assume frequent late options.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible; city parking + walk/transit can be simplest.",
      officialLots: ["Arrive early and use signed event/city parking; avoid last-minute street hunting."],
    },
    foodDrink: [
      { name: "Angers centre", type: "mixed", notes: "Practical pre/post; good for a relaxed pace." },
      { name: "Nantes (base)", type: "mixed", notes: "Better variety if you’re staying there." },
    ],
    stay: {
      bestAreas: [{ area: "Angers centre", notes: "Simple and practical for a quieter weekend." }],
      budgetAreas: [{ area: "Near Angers Saint-Laud", budgetFriendly: true, notes: "Often good value + very practical." }],
    },
    arrivalTips: [
      "If you’re day-tripping, keep buffer after full-time before heading to the station.",
      "Arrive early if you want time to eat before entry.",
    ],
  },

  "le-havre": {
    stadium: "Stade Océane",
    city: "Le Havre",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Le Havre (rail)", type: "train", notes: "Main arrival hub; regional services." },
        { name: "Paris Saint-Lazare (route)", type: "train", notes: "Common visitor origin; check return schedules." },
        { name: "Bus/tram connections", type: "tram", notes: "Local transit for last leg; allow time near kickoff." },
      ],
      tips: [
        "If you’re doing this from Paris, check the last return train before the match starts.",
        "Le Havre works well as a coastal weekend add-on if you stay overnight.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible; local transit is often simpler if you’re staying central.",
      officialLots: ["Use signed/event parking and arrive early if driving."],
    },
    foodDrink: [
      { name: "Le Havre centre", type: "mixed", notes: "Practical pre/post option." },
      { name: "Honfleur / Deauville (nearby add-on)", type: "mixed", notes: "Nice coastal add-ons if you’re making a weekend of it." },
    ],
    stay: {
      bestAreas: [{ area: "Le Havre centre", notes: "Practical base; keep transit simple." }],
      budgetAreas: [{ area: "Near Le Havre station", budgetFriendly: true, notes: "Often best value + practical." }],
    },
    arrivalTips: [
      "Don’t cut the return tight if you’re train-based.",
      "Arrive early if you need time to figure out last-leg local transit.",
    ],
  },

  "nice": {
    stadium: "Allianz Riviera",
    city: "Nice",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Nice-Ville", type: "train", notes: "Main arrival hub for visitors." },
        { name: "Jean Médecin / central tram corridor", type: "tram", notes: "Key city axis; useful for routing." },
        { name: "Stadium area (tram/bus)", type: "tram", notes: "Typical last leg; expect busy services post-match." },
      ],
      tips: [
        "Nice is a great base city; use tram/public transport to avoid matchday driving stress.",
        "Post-match: if transit is packed, wait 10–15 minutes or walk away from the stadium zone first.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but congestion happens; public transport is usually better.",
      officialLots: ["If driving, use official/signed parking and arrive early."],
    },
    foodDrink: [
      { name: "Old Town (Vieux Nice)", type: "mixed", notes: "Best tourist base for food/drink." },
      { name: "Promenade / seafront", type: "bar", notes: "Great for a weekend vibe; tourist-heavy." },
    ],
    stay: {
      bestAreas: [
        { area: "Vieux Nice / centre", notes: "Best for visitors: walkable + lively." },
        { area: "Near Nice-Ville station", notes: "Best for logistics if you’re rail-hopping." },
      ],
      budgetAreas: [{ area: "Near the station (edge streets)", budgetFriendly: true, notes: "Often best value; be selective by exact street." }],
    },
    arrivalTips: [
      "If you’re pairing with Monaco, rail is the easiest way to combine both.",
      "Arrive early if you want time to enjoy the old town pre-match.",
    ],
  },

  "paris-fc": {
    stadium: "Stade Charléty",
    city: "Paris",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Paris Gare de Lyon", type: "train", notes: "Major hub; good city connections." },
        { name: "Denfert-Rochereau (RER/Metro)", type: "metro", notes: "Useful interchange near the south of Paris." },
        { name: "Porte d’Italie / south Paris transit", type: "metro", notes: "Practical area for reaching Charléty by transit/bus/tram depending on route." },
      ],
      tips: [
        "Stay central and use Metro/RER to keep matchday simple.",
        "Post-match: Paris transit is frequent, but stations can be busy—avoid rushing platforms.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Central Paris driving/parking is not worth it for most visitors.",
      officialLots: ["Use public transport. If driving, park outside central zones and transit in."],
    },
    foodDrink: [
      { name: "Latin Quarter / Left Bank", type: "mixed", notes: "Great visitor area; easy to reach south Paris." },
      { name: "Central Paris", type: "mixed", notes: "Best variety; then transit out." },
    ],
    stay: {
      bestAreas: [
        { area: "Left Bank (5th/6th)", notes: "Great base; strong transport links." },
        { area: "Central Paris", notes: "Best all-round." },
      ],
      budgetAreas: [{ area: "Near major stations", budgetFriendly: true, notes: "Practical but choose carefully by exact street." }],
    },
    arrivalTips: [
      "Arrive early if you want time to find the correct entrance and avoid rushing.",
      "Keep your return plan flexible if you’re connecting to long-distance rail.",
    ],
  },

  "auxerre": {
    stadium: "Stade de l'Abbé-Deschamps",
    city: "Auxerre",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Auxerre Saint-Gervais (rail)", type: "train", notes: "Local arrival point; services can be less frequent than big cities." },
        { name: "Paris (Bercy/Gare de Lyon corridor)", type: "train", notes: "Common visitor origin; check return schedules carefully." },
        { name: "Dijon (base option)", type: "train", notes: "Alternative base; check journey times." },
      ],
      tips: [
        "Smaller-city matchday = planning: check your trains before you commit to timings.",
        "If you’re doing a day trip, avoid tight returns after full-time.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible and often simplest in smaller cities; still expect local congestion near kickoff.",
      officialLots: ["Arrive early and use signed/city parking; walk the last leg."],
    },
    foodDrink: [
      { name: "Auxerre centre", type: "mixed", notes: "Practical pre/post option; keep timing flexible." },
      { name: "Paris (base)", type: "mixed", notes: "If you’re making it part of a bigger trip." },
    ],
    stay: {
      bestAreas: [{ area: "Auxerre centre", notes: "Practical for a quiet overnight." }],
      budgetAreas: [{ area: "Near Auxerre station", budgetFriendly: true, notes: "Most practical if you’re in/out quickly." }],
    },
    arrivalTips: [
      "Confirm return rail options before kickoff — don’t assume late frequency.",
      "Arrive early; smaller cities have less room for last-minute improvisation.",
    ],
  },

  "nantes": {
    stadium: "Stade de la Beaujoire",
    city: "Nantes",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Nantes (rail)", type: "train", notes: "Main arrival hub; easy city-wide connections." },
        { name: "Tram network (city)", type: "tram", notes: "Strong local transit; typical matchday last leg." },
        { name: "City centre / Commerce area", type: "tram", notes: "Useful central interchange for routing." },
      ],
      tips: [
        "Stay central and use trams to keep matchday simple.",
        "Post-match: trams can be busy—waiting 10–15 minutes can improve comfort.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but transit is usually easier for visitors staying central.",
      officialLots: ["If driving, arrive early and use signed/event parking."],
    },
    foodDrink: [
      { name: "Bouffay / city centre", type: "mixed", notes: "Best food/drink base for visitors." },
      { name: "Île de Nantes", type: "mixed", notes: "Good modern area; depends on your vibe." },
    ],
    stay: {
      bestAreas: [{ area: "City centre", notes: "Best base for a weekend; walkable and lively." }],
      budgetAreas: [{ area: "Near Nantes station", budgetFriendly: true, notes: "Often best value + practical." }],
    },
    arrivalTips: [
      "If you’re doing a coastal add-on trip, Nantes is a strong base city.",
      "Arrive early if you’re unfamiliar with tram routing to the stadium area.",
    ],
  },

  "metz": {
    stadium: "Stade Saint-Symphorien",
    city: "Metz",
    country: "France",
    transport: {
      primaryStops: [
        { name: "Metz-Ville (rail)", type: "train", notes: "Main arrival hub; regional + some TGV links." },
        { name: "Luxembourg (base option)", type: "train", notes: "Common base for visitors; check cross-border schedules." },
        { name: "Nancy (base option)", type: "train", notes: "Nearby base; easy regional access." },
      ],
      tips: [
        "Metz works well as a Luxembourg/Nancy base day trip if you want more hotel choice.",
        "Check return trains before kickoff; cross-border services can be less forgiving late.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible; city parking + walking can be straightforward.",
      officialLots: ["Arrive early and use signed/city parking; walk the last leg if needed."],
    },
    foodDrink: [
      { name: "Metz centre", type: "mixed", notes: "Practical pre/post option." },
      { name: "Luxembourg (base)", type: "mixed", notes: "More variety if you’re staying there." },
    ],
    stay: {
      bestAreas: [{ area: "Metz centre", notes: "Simple and practical for an overnight." }],
      budgetAreas: [{ area: "Near Metz-Ville station", budgetFriendly: true, notes: "Often best value + practical." }],
    },
    arrivalTips: [
      "If you’re crossing borders for this, double-check late return options before kickoff.",
      "Arrive early if you want time to eat and keep the last leg calm.",
    ],
  },
};

export default ligue1Logistics;
