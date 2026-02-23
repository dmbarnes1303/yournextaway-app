// src/data/matchdayLogistics/laLiga.ts
import type { MatchdayLogistics } from "./types";

/**
 * LaLiga Matchday Logistics (20 teams)
 *
 * Rules:
 * - Useful + conservative (no fake venue names / no specific pub names).
 * - Prefer stable transport guidance: main rail hubs + metro/tram stops.
 * - Neutral traveller framing (you’re visiting the city, not “away end” content).
 *
 * IMPORTANT:
 * Keys should match normalizeClubKey(homeTeamName).
 * Use simple lowercase keys; include common variants where useful.
 */

const laLigaLogistics: Record<string, MatchdayLogistics> = {
  "barcelona": {
    stadium: "Spotify Camp Nou",
    city: "Barcelona",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Sants Estació", type: "train", notes: "Main rail hub for visitors; easy metro connections." },
        { name: "Collblanc (Metro)", type: "metro", notes: "Common approach stop; expect crowds close to kickoff." },
        { name: "Les Corts (Metro)", type: "metro", notes: "Useful alternative stop depending on your route." },
      ],
      tips: [
        "Barcelona is visitor-friendly: base centrally and use Metro for the last leg.",
        "Post-match: walk 10–15 minutes before entering the Metro to avoid the worst queues.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving near the stadium is rarely worth it. Use Metro and walk.",
      officialLots: ["If you must drive: park outside the stadium district and continue by Metro."],
    },
    foodDrink: [
      { name: "Eixample (pre/post base)", type: "mixed", notes: "Reliable area for food/drink and easy Metro access." },
      { name: "Les Corts area", type: "mixed", notes: "Practical matchday zone; busy near kickoff." },
    ],
    stay: {
      bestAreas: [
        { area: "Eixample", notes: "Best all-round base: central + easy Metro connections." },
        { area: "Gothic Quarter / El Born", notes: "Tourist-heavy, walkable, great for a weekend." },
      ],
      budgetAreas: [{ area: "Sants", budgetFriendly: true, notes: "Good value and extremely convenient for transport." }],
    },
    arrivalTips: [
      "Arrive 60–90 minutes early if you want time for food and a relaxed entry.",
      "If kickoff is late, plan your return Metro route so you’re not improvising at night.",
    ],
  },

  "real madrid": {
    stadium: "Santiago Bernabéu",
    city: "Madrid",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Nuevos Ministerios", type: "train", notes: "Major hub (metro + Cercanías). Strong for arrivals/returns." },
        { name: "Santiago Bernabéu (Metro)", type: "metro", notes: "Closest stop; will be crowded on matchdays." },
        { name: "Chamartín", type: "train", notes: "Big rail station; good if you’re arriving by train." },
      ],
      tips: [
        "Use Metro for the final leg; the stadium is embedded in the city grid so it’s straightforward.",
        "Post-match: walk to Nuevos Ministerios or another major hub for faster dispersal.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Central Madrid driving is slow and parking is tight. Public transport is the move.",
      officialLots: ["If driving: use park-and-ride outside the centre and Metro in."],
    },
    foodDrink: [
      { name: "AZCA / Nuevos Ministerios area", type: "mixed", notes: "High-density and practical for matchday." },
      { name: "Chamberí", type: "food", notes: "Great for a nicer pre/post meal; short Metro ride." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro / Sol area", notes: "Tourist base; easy Metro everywhere." },
        { area: "Chamberí", notes: "Good vibe + food; still central." },
      ],
      budgetAreas: [{ area: "Tetuán edge", budgetFriendly: true, notes: "Often cheaper while still close to the stadium zone." }],
    },
    arrivalTips: [
      "If you’re doing a day trip, keep return travel flexible — dispersal can be slow.",
      "Screenshot tickets/QR codes before you leave your hotel (busy networks happen).",
    ],
  },

  "villarreal": {
    stadium: "Estadio de la Cerámica",
    city: "Villarreal",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Valencia (rail hub)", type: "train", notes: "Common base city for visitors; connect onward by train/bus." },
        { name: "Castelló de la Plana", type: "train", notes: "Regional rail hub; useful connection point." },
        { name: "Villarreal station / town access", type: "train", notes: "Final stop depends on routing; check schedules early." },
      ],
      tips: [
        "Many visitors stay in Valencia or Castelló and do Villarreal as a day trip.",
        "Check return times before kickoff — smaller towns have less frequent late services.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible compared to big cities, but matchday congestion still builds close to kickoff.",
      officialLots: ["Arrive early and use signed event parking or town parking + walk."],
    },
    foodDrink: [
      { name: "Town centre (pre/post)", type: "mixed", notes: "Most practical option in smaller cities." },
      { name: "Valencia (weekend base)", type: "mixed", notes: "Best variety if you’re turning it into a city break." },
    ],
    stay: {
      bestAreas: [
        { area: "Valencia city centre", notes: "Best weekend base; strong transport and plenty to do." },
        { area: "Castelló centre", notes: "Closer and often cheaper; simpler logistics." },
      ],
      budgetAreas: [{ area: "Near regional rail stops", budgetFriendly: true, notes: "Good for night-before stays; check late check-in." }],
    },
    arrivalTips: [
      "If you’re relying on trains, don’t leave return planning until after the match.",
      "Arrive early to avoid last-minute transport improvisation.",
    ],
  },

  "atletico madrid": {
    stadium: "Cívitas Metropolitano",
    city: "Madrid",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Estadio Metropolitano (Metro)", type: "metro", notes: "Direct Metro stop; designed for matchday flow." },
        { name: "Avenida de América", type: "metro", notes: "Major interchange hub; useful if you’re crossing the city." },
        { name: "Nuevos Ministerios", type: "train", notes: "Big hub for Cercanías + Metro; good for visitors." },
      ],
      tips: [
        "Metro is the default and usually the fastest; allow extra time right after full-time.",
        "Base central and treat the stadium as a dedicated Metro trip rather than driving.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than central stadiums, but traffic still piles up near kickoff/full-time.",
      officialLots: ["If driving: arrive early and use official/signed event parking where possible."],
    },
    foodDrink: [
      { name: "Central Madrid (pre-game base)", type: "mixed", notes: "Best variety; then Metro out." },
      { name: "Stadium district (practical)", type: "mixed", notes: "Convenient but crowded; queues expected." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro / Sol", notes: "Tourist base; easy Metro network." },
        { area: "Chamberí", notes: "Great food + vibe; still central." },
      ],
      budgetAreas: [{ area: "Avenida de América area", budgetFriendly: true, notes: "Often better value; very connected." }],
    },
    arrivalTips: [
      "If you want a smoother exit, wait 10–15 minutes before entering the Metro.",
      "Keep your route simple: central base → Metro → stadium.",
    ],
  },

  "real betis": {
    stadium: "Estadio Benito Villamarín",
    city: "Seville",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Sevilla-Santa Justa", type: "train", notes: "Main arrival station for visitors." },
        { name: "City centre connections", type: "bus", notes: "Common last-leg option; routes vary so allow time." },
        { name: "Walk/taxi from central districts", type: "other", notes: "Works if timed early; traffic builds near kickoff." },
      ],
      tips: [
        "Seville is compact: stay central and treat matchday as a planned taxi/bus trip.",
        "Post-match: walking away from the immediate stadium roads helps with taxi pickup.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible with planning, but traffic and restrictions make it unpredictable near kickoff.",
      officialLots: ["If driving: arrive early and use official/signed lots where possible."],
    },
    foodDrink: [
      { name: "Triana", type: "mixed", notes: "Great for food/drink and a strong Seville vibe." },
      { name: "Centro / historic core", type: "mixed", notes: "Tourist-friendly base; easy pre/post match." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro (historic centre)", notes: "Best weekend base for sightseeing + food." },
        { area: "Triana", notes: "Great vibe and restaurants; still very accessible." },
      ],
      budgetAreas: [{ area: "Near Santa Justa", budgetFriendly: true, notes: "Often better value and practical for arrivals." }],
    },
    arrivalTips: [
      "If it’s a hot day, plan hydration and shade—Seville heat can be brutal.",
      "Arrive early if you want to move calmly through security and find your seat.",
    ],
  },

  "celta vigo": {
    stadium: "Estadio Abanca-Balaídos",
    city: "Vigo",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Vigo-Guixar", type: "train", notes: "One of Vigo’s rail stations; check which one your train uses." },
        { name: "Vigo-Urzáiz", type: "train", notes: "Another main station; useful for visitors." },
        { name: "City buses / taxi", type: "bus", notes: "Typical last-leg option to the stadium district." },
      ],
      tips: [
        "Base in central Vigo and use bus/taxi for the last leg.",
        "Check return options if you’re day-tripping from another Galician city.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but expect congestion near kickoff.",
      officialLots: ["Arrive early; use city parking and finish by bus/walk where practical."],
    },
    foodDrink: [
      { name: "Vigo centre", type: "mixed", notes: "Best variety and easiest logistics." },
      { name: "Old town/port area", type: "food", notes: "Good for post-match meal; check timing." },
    ],
    stay: {
      bestAreas: [{ area: "Vigo city centre", notes: "Best base for visitors; practical transport." }],
      budgetAreas: [{ area: "Near rail stations", budgetFriendly: true, notes: "Often good value; convenient for arrivals." }],
    },
    arrivalTips: [
      "If weather is wet/windy (common in Galicia), plan a simple route and buffer time.",
      "Have your taxi/bus plan ready before you leave the centre.",
    ],
  },

  "espanyol": {
    stadium: "Stage Front Stadium (RCDE Stadium)",
    city: "Barcelona area (Cornellà/El Prat)",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Barcelona Sants", type: "train", notes: "Main hub for visitors; connect onward by rail/metro." },
        { name: "Cornellà Centre (rail/metro)", type: "train", notes: "Common approach point; check local routing." },
        { name: "Llobregat area connections", type: "metro", notes: "Use local lines; allow time for transfers." },
      ],
      tips: [
        "Treat this as a ‘greater Barcelona’ trip: base central Barcelona and connect out.",
        "Post-match: crowds can concentrate at local stations—waiting 10 minutes can help.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than central Barcelona, but still expect matchday congestion.",
      officialLots: ["Use official/signed stadium parking if offered; arrive early."],
    },
    foodDrink: [
      { name: "Central Barcelona (pre/post base)", type: "mixed", notes: "Best variety; travel out for the match." },
      { name: "Cornellà area (practical)", type: "mixed", notes: "Convenient but limited; matchday crowds." },
    ],
    stay: {
      bestAreas: [{ area: "Eixample / central Barcelona", notes: "Best base and easiest for tourists." }],
      budgetAreas: [{ area: "Sants", budgetFriendly: true, notes: "Good value + strong connections to the stadium area." }],
    },
    arrivalTips: [
      "Check the exact local rail/metro route earlier in the day so you don’t improvise at night.",
      "Keep your return plan simple: same line back to a major hub.",
    ],
  },

  "athletic club": {
    stadium: "San Mamés",
    city: "Bilbao",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Bilbao-Abando", type: "train", notes: "Main rail arrival for many visitors; central." },
        { name: "San Mamés (Metro)", type: "metro", notes: "Key stop; extremely convenient and well signposted." },
        { name: "Intermodal station area", type: "train", notes: "Good for buses/coach links; very practical." },
      ],
      tips: [
        "Bilbao is very walkable; many visitors can do stadium access without taxis.",
        "Post-match: Metro is efficient but busy—walking 10 minutes can smooth it out.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Central event parking is tight; public transport is easier.",
      officialLots: ["If driving, use city parking and walk/metro to the stadium area."],
    },
    foodDrink: [
      { name: "Abando / city centre", type: "mixed", notes: "Best visitor base for food/drink." },
      { name: "Old Town (Casco Viejo)", type: "food", notes: "Great for pintxos; ideal post-match." },
    ],
    stay: {
      bestAreas: [
        { area: "Abando", notes: "Best transport + hotel base." },
        { area: "Casco Viejo", notes: "Best vibe for a weekend; still walkable." },
      ],
      budgetAreas: [{ area: "Near the intermodal station", budgetFriendly: true, notes: "Often practical and good value." }],
    },
    arrivalTips: [
      "If you’re doing a weekend, Bilbao is excellent for food + match logistics.",
      "Arrive early if you want to explore Casco Viejo before heading to the ground.",
    ],
  },

  "osasuna": {
    stadium: "Estadio El Sadar",
    city: "Pamplona",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Pamplona (bus/rail access)", type: "train", notes: "Connections vary; check your arrival mode and timing." },
        { name: "City centre", type: "walk", notes: "Good base; many routes to the stadium start here." },
        { name: "Local buses / taxi", type: "bus", notes: "Typical last-leg option; allow extra time near kickoff." },
      ],
      tips: [
        "Pamplona is compact: stay central and keep matchday simple (walk/bus/taxi).",
        "If you’re day-tripping, check late return options before kickoff.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but streets near the stadium tighten up close to kickoff.",
      officialLots: ["Use city parking and walk the last part where practical."],
    },
    foodDrink: [
      { name: "Old Town / centre", type: "mixed", notes: "Best density of options; easy before/after." },
    ],
    stay: {
      bestAreas: [{ area: "City centre", notes: "Best base; easiest logistics." }],
      budgetAreas: [{ area: "Near intercity bus areas", budgetFriendly: true, notes: "Often better value; check walkability." }],
    },
    arrivalTips: [
      "If weather is cold/wet, plan a short route and arrive early to avoid rushing.",
      "Keep cashless payments ready; small venues can get busy fast on matchday.",
    ],
  },

  "real sociedad": {
    stadium: "Reale Arena (Anoeta)",
    city: "San Sebastián",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "San Sebastián-Donostia", type: "train", notes: "Main rail station for visitors." },
        { name: "Local rail/bus to Anoeta area", type: "bus", notes: "Common last-leg option; check signage." },
        { name: "City centre walk routes", type: "walk", notes: "Depending on your base, walking can be practical." },
      ],
      tips: [
        "San Sebastián is small and walkable — great for a weekend match trip.",
        "If you’re staying central, you can often avoid taxis entirely with planning.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Parking is limited and expensive; public transport/walking is easier.",
      officialLots: ["If driving, use city parking and continue by bus/walk."],
    },
    foodDrink: [
      { name: "Old Town (Parte Vieja)", type: "food", notes: "Elite for pintxos; ideal pre/post match." },
      { name: "Centro", type: "mixed", notes: "Tourist-friendly base; easy logistics." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro", notes: "Best all-round base for transport + sightseeing." },
        { area: "Old Town edge", notes: "Best vibe; can be pricier." },
      ],
      budgetAreas: [{ area: "Near the main station", budgetFriendly: true, notes: "Often more practical and better value." }],
    },
    arrivalTips: [
      "If you’re doing a food-heavy weekend, book key restaurants early (it gets busy).",
      "Arrive early if you want a calm entry and time to find your section.",
    ],
  },

  "sevilla": {
    stadium: "Estadio Ramón Sánchez-Pizjuán",
    city: "Seville",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Sevilla-Santa Justa", type: "train", notes: "Main arrival station; relatively close to the stadium district." },
        { name: "Nervión district", type: "walk", notes: "Stadium is in a built-up area with lots of services." },
        { name: "City centre connections", type: "metro", notes: "Use metro/bus/taxi depending on where you stay." },
      ],
      tips: [
        "This is one of the easier LaLiga matchdays: central base + short transfers.",
        "Post-match: traffic can choke — walking to a calmer pickup point helps.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Urban stadium district makes parking unpredictable. Prefer walking/public transport.",
      officialLots: ["If driving, use city car parks and walk the last part."],
    },
    foodDrink: [
      { name: "Nervión area", type: "mixed", notes: "Practical matchday zone with plenty around." },
      { name: "Centro / Triana", type: "mixed", notes: "Better tourist vibe for a full weekend." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro", notes: "Best weekend base for sightseeing and food." },
        { area: "Nervión", notes: "Most practical for match logistics; shorter transfers." },
      ],
      budgetAreas: [{ area: "Near Santa Justa", budgetFriendly: true, notes: "Often best value for visitors." }],
    },
    arrivalTips: [
      "In hot months, plan shade/water and avoid long walks at peak heat.",
      "Arrive early if you want to take it slow — entries can tighten near kickoff.",
    ],
  },

  "getafe": {
    stadium: "Coliseum",
    city: "Getafe (Madrid area)",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Atocha (Madrid rail hub)", type: "train", notes: "Common base point for visitors; Cercanías connections." },
        { name: "Getafe Centro (Cercanías)", type: "train", notes: "Typical rail approach into Getafe." },
        { name: "Madrid Metro/Cercanías to Getafe", type: "metro", notes: "Use whichever is simplest from your base." },
      ],
      tips: [
        "Treat this as a Madrid trip: stay in Madrid, travel out for the match.",
        "Post-match: return is usually straightforward, but services can be busy.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than central Madrid, but still expect matchday congestion.",
      officialLots: ["If driving, arrive early and use signed local parking."],
    },
    foodDrink: [
      { name: "Madrid centre (pre/post)", type: "mixed", notes: "Best variety; simplest if you’re spending the weekend in Madrid." },
      { name: "Getafe town centre", type: "mixed", notes: "Practical if you’re arriving early." },
    ],
    stay: {
      bestAreas: [{ area: "Madrid Centro / Sol", notes: "Best base; easiest for tourists." }],
      budgetAreas: [{ area: "Atocha area", budgetFriendly: true, notes: "Often good value and extremely connected for day trips." }],
    },
    arrivalTips: [
      "Check your return route before you head out — don’t rely on last-minute planning.",
      "If kickoff is late, plan your Madrid night return logistics in advance.",
    ],
  },

  "girona": {
    stadium: "Estadi Montilivi",
    city: "Girona",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Girona Station", type: "train", notes: "Main arrival hub; strong links from Barcelona." },
        { name: "Barcelona Sants", type: "train", notes: "Common tourist base; fast trains to Girona." },
        { name: "City buses / taxi (last leg)", type: "bus", notes: "Montilivi is not directly at the station; plan last leg." },
      ],
      tips: [
        "Girona is excellent as a day trip from Barcelona if you plan trains properly.",
        "Post-match: allow time to get back to the station if you’re catching a late train.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but local congestion can build near kickoff.",
      officialLots: ["Use city parking and bus/taxi/walk the last part where practical."],
    },
    foodDrink: [
      { name: "Girona old town", type: "food", notes: "Best vibe for a pre/post meal; allow walking time." },
      { name: "Barcelona (if basing there)", type: "mixed", notes: "Best variety for a full weekend." },
    ],
    stay: {
      bestAreas: [
        { area: "Girona old town", notes: "Best for a romantic/food-focused weekend." },
        { area: "Barcelona (base)", notes: "If you want maximum activities, do Girona as a day trip." },
      ],
      budgetAreas: [{ area: "Near Girona station", budgetFriendly: true, notes: "Most practical for late arrivals/early departures." }],
    },
    arrivalTips: [
      "Train planning matters here: check the return schedule before kickoff.",
      "If you’re walking to/from the stadium, allow extra time (it can be hilly depending on route).",
    ],
  },

  "rayo vallecano": {
    stadium: "Estadio de Vallecas",
    city: "Madrid",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Atocha", type: "train", notes: "Key Madrid hub; good for tourists." },
        { name: "Vallecas area (Metro)", type: "metro", notes: "Use Metro to reach the neighbourhood; stops depend on routing." },
        { name: "Sol / Gran Vía (Metro hubs)", type: "metro", notes: "Easy starting points from central Madrid." },
      ],
      tips: [
        "This is a classic ‘city stadium’ match: stay central and use Metro.",
        "Post-match: the neighbourhood is busy — walk a few minutes before calling a taxi.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "City streets + restrictions make driving a hassle. Metro is best.",
      officialLots: ["Avoid driving; use Metro from a central base."],
    },
    foodDrink: [
      { name: "Central Madrid (pre/post)", type: "mixed", notes: "Best choice for visitors." },
      { name: "Local Vallecas spots (practical)", type: "mixed", notes: "Neighbourhood feel; limited space on matchdays." },
    ],
    stay: {
      bestAreas: [{ area: "Madrid Centro", notes: "Best tourist base + simplest Metro routes." }],
      budgetAreas: [{ area: "Atocha / Retiro edge", budgetFriendly: true, notes: "Often better value; great transport." }],
    },
    arrivalTips: [
      "Arrive early to avoid tight street approaches right before kickoff.",
      "Keep valuables secure like any big-city crowd environment.",
    ],
  },

  "deportivo alaves": {
    stadium: "Estadio de Mendizorroza",
    city: "Vitoria-Gasteiz",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Vitoria-Gasteiz (rail/bus access)", type: "train", notes: "Connections vary; check your arrival plan early." },
        { name: "Bilbao (base option)", type: "train", notes: "Common tourist base; day trip possible with planning." },
        { name: "City centre walk routes", type: "walk", notes: "Smaller city; walking can be practical from central stays." },
      ],
      tips: [
        "This is a smaller-city matchday: plan your arrival/return times in advance.",
        "If you’re basing in Bilbao, check late return options before kickoff.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than major cities, but expect local congestion near kickoff.",
      officialLots: ["Use city parking and walk the last part where practical."],
    },
    foodDrink: [
      { name: "Vitoria city centre", type: "mixed", notes: "Best practical base for pre/post." },
      { name: "Bilbao (weekend base)", type: "mixed", notes: "Better variety if you’re making a weekend of it." },
    ],
    stay: {
      bestAreas: [{ area: "Vitoria city centre", notes: "Simple, walkable, practical." }],
      budgetAreas: [{ area: "Near the station/bus access", budgetFriendly: true, notes: "Often good value; convenient for day trips." }],
    },
    arrivalTips: [
      "Confirm your return transport before kickoff if you’re not staying overnight.",
      "Arrive early to keep everything calm and simple.",
    ],
  },

  "valencia": {
    stadium: "Mestalla",
    city: "Valencia",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "València Nord / Joaquín Sorolla", type: "train", notes: "Main rail arrivals; connect by metro/bus/taxi." },
        { name: "Xàtiva / Colón (Metro)", type: "metro", notes: "Central metro stops; useful for moving around the city." },
        { name: "City centre walking routes", type: "walk", notes: "If you’re staying central, walking can be practical." },
      ],
      tips: [
        "Valencia is excellent for visitors: base central and walk/metro to the stadium.",
        "Post-match: the city grid disperses crowds well—walking 10 minutes helps.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Urban stadium district makes parking unreliable. Prefer public transport or walking.",
      officialLots: ["If driving, use city car parks and walk the last part."],
    },
    foodDrink: [
      { name: "City centre", type: "mixed", notes: "Best density of options and easiest logistics." },
      { name: "Ruzafa", type: "food", notes: "Great for restaurants and bars; strong weekend base." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Best for tourists; easy access everywhere." },
        { area: "Ruzafa", notes: "Great vibe for a weekend; very walkable." },
      ],
      budgetAreas: [{ area: "Near Nord/Joaquín Sorolla", budgetFriendly: true, notes: "Often practical and good value." }],
    },
    arrivalTips: [
      "If you’re planning beaches too, keep matchday separate and simple (metro/walk).",
      "Arrive early if you want to avoid last-minute queues at entry points.",
    ],
  },

  "elche": {
    stadium: "Estadio Manuel Martínez Valero",
    city: "Elche",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Alicante (base option)", type: "train", notes: "Common tourist base; connect onward by rail/bus." },
        { name: "Elche city access", type: "train", notes: "Arrival depends on routing; check schedules." },
        { name: "Taxi/bus (last leg)", type: "bus", notes: "Stadium is outside the tight centre; plan the last leg." },
      ],
      tips: [
        "Most visitors will base in Alicante and do Elche as a day trip.",
        "Check return options before kickoff — late services can be less frequent.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but allow for matchday traffic near the stadium.",
      officialLots: ["Arrive early; use signed stadium parking where available."],
    },
    foodDrink: [
      { name: "Alicante centre (weekend base)", type: "mixed", notes: "Best variety if you’re doing a coastal weekend." },
      { name: "Elche centre", type: "mixed", notes: "Practical if you arrive early; keep timings flexible." },
    ],
    stay: {
      bestAreas: [{ area: "Alicante city centre", notes: "Best tourist base and easiest logistics." }],
      budgetAreas: [{ area: "Near Elche rail access", budgetFriendly: true, notes: "Often cheaper; check last-leg transport to stadium." }],
    },
    arrivalTips: [
      "Don’t assume walkability from station to stadium—plan last leg (bus/taxi).",
      "Confirm the return plan before you leave your base city.",
    ],
  },

  "mallorca": {
    stadium: "Estadi Mallorca Son Moix",
    city: "Palma",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Palma city centre", type: "bus", notes: "Most visitors base here; buses/taxis for the last leg." },
        { name: "Airport connections", type: "bus", notes: "If arriving same day, leave big buffer for airport delays." },
        { name: "Taxi/rideshare", type: "other", notes: "Practical on an island; traffic builds close to kickoff." },
      ],
      tips: [
        "If you’re on a short break, stay central Palma and keep matchday transport simple.",
        "Post-match: taxis can queue — walking a bit away from the immediate area helps pickup.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but event congestion can slow you down.",
      officialLots: ["Use official/signed parking if available; arrive early."],
    },
    foodDrink: [
      { name: "Palma old town", type: "mixed", notes: "Best weekend vibe and food density." },
      { name: "Seafront area", type: "bar", notes: "Good for pre/post drinks; tourist-friendly." },
    ],
    stay: {
      bestAreas: [
        { area: "Palma old town", notes: "Best vibe for a weekend." },
        { area: "Seafront", notes: "Tourist-friendly and easy to move around." },
      ],
      budgetAreas: [{ area: "Near transport corridors", budgetFriendly: true, notes: "Often cheaper; verify late-night return practicality." }],
    },
    arrivalTips: [
      "If you’re doing airport → match same day, build big buffer time.",
      "Plan your return route before you go — island transport can feel limited late.",
    ],
  },

  "levante": {
    stadium: "Estadi Ciutat de València",
    city: "Valencia",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "València Nord / Joaquín Sorolla", type: "train", notes: "Main arrivals; connect by metro/tram/bus." },
        { name: "Central Valencia Metro", type: "metro", notes: "Use Metro for the last leg; stops depend on routing." },
        { name: "City centre", type: "walk", notes: "Good base; easy transport options." },
      ],
      tips: [
        "Treat this as a Valencia weekend: stay central and metro out for the match.",
        "Post-match: avoid taxis immediately at full-time; walk a bit for easier pickup.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Urban matchday parking is unreliable. Public transport is better.",
      officialLots: ["If driving, use city parking and finish by metro/walk."],
    },
    foodDrink: [
      { name: "Ruzafa", type: "mixed", notes: "Great for restaurants and bars." },
      { name: "City centre", type: "mixed", notes: "Most practical for tourists." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Best base for visitors." },
        { area: "Ruzafa", notes: "Best vibe for a weekend." },
      ],
      budgetAreas: [{ area: "Near main stations", budgetFriendly: true, notes: "Often good value and very practical." }],
    },
    arrivalTips: [
      "If you’re combining match + beach, keep matchday logistics simple (metro/walk).",
      "Arrive early if you want to avoid last-minute congestion at entry points.",
    ],
  },

  "real oviedo": {
    stadium: "Estadio Carlos Tartiere",
    city: "Oviedo",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Oviedo (rail access)", type: "train", notes: "Main arrival point; check schedules if day-tripping." },
        { name: "Gijón (base option)", type: "train", notes: "Nearby coastal base; day trip possible." },
        { name: "Taxi/bus (last leg)", type: "bus", notes: "Plan the last leg depending on your accommodation." },
      ],
      tips: [
        "Asturias is great for a weekend: consider basing on the coast and day-tripping in.",
        "Check return schedules before kickoff — late services can be less frequent.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible compared to big cities, but matchday congestion still builds.",
      officialLots: ["Arrive early; use signed lots or city parking + walk/bus."],
    },
    foodDrink: [
      { name: "Oviedo old town", type: "food", notes: "Strong for cider/food; ideal pre/post match." },
      { name: "Gijón (coastal base)", type: "mixed", notes: "Good for a weekend vibe if you’re staying nearby." },
    ],
    stay: {
      bestAreas: [
        { area: "Oviedo city centre", notes: "Best for logistics and walking." },
        { area: "Gijón centre", notes: "Coastal base; easy day trip connections." },
      ],
      budgetAreas: [{ area: "Near Oviedo station", budgetFriendly: true, notes: "Often better value and practical for arrivals." }],
    },
    arrivalTips: [
      "If you’re day-tripping, lock in your return plan before kickoff.",
      "Arrive early if you want to enjoy the old town without rushing.",
    ],
  },
};

export default laLigaLogistics;
