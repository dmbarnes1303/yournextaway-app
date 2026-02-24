// src/data/matchdayLogistics/laLiga.ts
import type { MatchdayLogistics } from "./types";

/**
 * La Liga Matchday Logistics (20 teams)
 *
 * Rules:
 * - Useful + conservative (no fake pub/restaurant names).
 * - Prefer stable transport guidance (key stations/lines/hubs).
 * - Keep it “neutral traveller” oriented.
 *
 * IMPORTANT:
 * Keys must match normalizeClubKey(homeTeamName) from src/data/ticketGuides.
 * We use hyphenated slugs for multi-word clubs (e.g. "real-madrid").
 */

const laLigaLogistics: Record<string, MatchdayLogistics> = {
  /* -------------------------------------------------------------------------- */
  /* Barcelona                                                                   */
  /* -------------------------------------------------------------------------- */

  "barcelona": {
    stadium: "Estadi Olímpic Lluís Companys (Montjuïc)",
    city: "Barcelona",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Plaça d’Espanya", type: "metro", notes: "Major hub; common approach to Montjuïc area (expect uphill walking/queues)." },
        { name: "Sants Estació", type: "train", notes: "Main rail hub; easy to reach Plaça d’Espanya / central connections." },
        { name: "Catalunya / Passeig de Gràcia area", type: "metro", notes: "Central hubs; good for pre/post base and dispersal." },
      ],
      tips: [
        "Montjuïc access is more walking than most stadiums — arrive earlier than you think.",
        "After full-time, walk 10–15 minutes away from the immediate exit points before trying taxis/rideshare.",
        "If you’re doing a city break, base centrally and treat match travel as a metro + walk day.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Central Barcelona driving is slow and parking is limited. Treat public transport + walking as the default.",
      officialLots: ["If you must drive: park outside the centre and use metro/rail in to avoid city congestion."],
    },
    foodDrink: [
      { name: "Eixample", type: "food", notes: "High density of reliable options; good pre/post base." },
      { name: "Poble-sec", type: "mixed", notes: "Practical if approaching from Montjuïc side; timing-dependent." },
    ],
    stay: {
      bestAreas: [
        { area: "Eixample", notes: "Best all-round city base; easy metro connections." },
        { area: "Passeig de Gràcia / Catalunya area", notes: "Central, walkable, great for weekend trips." },
      ],
      budgetAreas: [{ area: "Sants", budgetFriendly: true, notes: "Good value + strong rail/metro links." }],
    },
    arrivalTips: [
      "Aim for 75–90 minutes pre-kickoff due to walking + crowd control.",
      "Keep return plans flexible if kickoff is TBC; late finishes can bottleneck transport.",
    ],
  },

  "espanyol": {
    stadium: "RCDE Stadium",
    city: "Cornellà de Llobregat (Barcelona area)",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Barcelona Sants", type: "train", notes: "Main hub; connect outward toward Cornellà/El Prat side." },
        { name: "Cornellà Centre", type: "train", notes: "Common local connection point; last-mile depends on route." },
        { name: "Zona Universitària (Metro area)", type: "metro", notes: "Useful interchange point depending on where you’re staying." },
      ],
      tips: [
        "This is an ‘outer-city’ stadium: plan the last-mile connection in advance.",
        "Base yourself central (Eixample/Catalunya) and travel out; it’s usually simpler than staying near the ground.",
        "After full-time, give it 10–15 minutes before moving if platforms/roads are controlled.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than central Barcelona, but traffic still builds around kickoff.",
      officialLots: ["If driving: arrive early and use official/signed parking where available."],
    },
    foodDrink: [
      { name: "Eixample (pre/post base)", type: "mixed", notes: "Best variety; then travel out." },
      { name: "Cornellà area", type: "mixed", notes: "Practical, local options; keep timing flexible." },
    ],
    stay: {
      bestAreas: [
        { area: "Eixample", notes: "Best weekend base for Barcelona trips." },
        { area: "Sants", notes: "Practical for transport; often good hotel value." },
      ],
      budgetAreas: [{ area: "El Prat / L’Hospitalet edge", budgetFriendly: true, notes: "Often cheaper; check exact connectivity." }],
    },
    arrivalTips: [
      "Confirm your outbound route before leaving the centre; last-mile can vary.",
      "Arrive early if you want a relaxed entry — outer-city routing can surprise you.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Madrid                                                                       */
  /* -------------------------------------------------------------------------- */

  "real-madrid": {
    stadium: "Santiago Bernabéu",
    city: "Madrid",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Santiago Bernabéu (Metro)", type: "metro", notes: "Closest stop; expect crowd management after the match." },
        { name: "Nuevos Ministerios", type: "metro", notes: "Major interchange; often the best ‘disperse’ option." },
        { name: "Chamartín", type: "train", notes: "Big rail hub; useful depending on your arrival/return." },
      ],
      tips: [
        "Nuevos Ministerios is the practical hub for visitors: loads of connections and easier dispersal.",
        "Post-match: walking 10–15 minutes away from the immediate metro entrance usually saves time.",
        "Madrid’s metro is efficient — default to metro over taxis near kickoff.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving in central Madrid near Bernabéu is slow and parking is tight on matchdays.",
      officialLots: ["Use metro. If you must drive: park outside the centre and ride in."],
    },
    foodDrink: [
      { name: "Azca / Nuevos Ministerios area", type: "mixed", notes: "Business district; practical options pre/post." },
      { name: "Malasaña / Chueca", type: "food", notes: "Better nightlife/food; metro back is easy." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro (Sol / Gran Vía)", notes: "Best tourist base; easy metro to the stadium." },
        { area: "Chamberí", notes: "Great local vibe; strong metro connectivity." },
      ],
      budgetAreas: [{ area: "Argüelles / Moncloa edge", budgetFriendly: true, notes: "Often better value; good metro links." }],
    },
    arrivalTips: [
      "Arrive 60–75 minutes pre-kickoff for security + easier seating.",
      "If kickoff is TBC, avoid tight same-day connections (Madrid traffic + crowd control adds time).",
    ],
  },

  "atletico-madrid": {
    stadium: "Cívitas Metropolitano",
    city: "Madrid",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Estadio Metropolitano (Metro)", type: "metro", notes: "Closest stop; purpose-built for matchday flow." },
        { name: "Canillejas (Metro)", type: "metro", notes: "Useful alternative depending on crowd control routing." },
        { name: "Avenida de América", type: "metro", notes: "Major interchange; good for visitors coming from central areas." },
      ],
      tips: [
        "This stadium is ‘metro-first’ — treat the metro as the default in/out.",
        "Post-match queues are normal; consider waiting 10 minutes before heading to the platform.",
        "If you’re staying central, Avenida de América is a strong hub to route through.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than central stadiums, but event traffic can still slow you down.",
      officialLots: ["If driving: arrive early and use signed/official parking where possible."],
    },
    foodDrink: [
      { name: "Salamanca (pre/post base)", type: "food", notes: "Good quality options; easy metro connections." },
      { name: "Centro (Sol / Gran Vía)", type: "mixed", notes: "Tourist base; easy metro out to the ground." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro (Sol / Gran Vía)", notes: "Best tourist base; metro access is easy." },
        { area: "Salamanca", notes: "Upscale base; still convenient." },
      ],
      budgetAreas: [{ area: "Prosperidad / Cartagena edge", budgetFriendly: true, notes: "Often better value with good metro links." }],
    },
    arrivalTips: [
      "Allow extra time for the last metro hop and stadium entry flow.",
      "Have your return plan ready — crowd control can redirect exits.",
    ],
  },

  "getafe": {
    stadium: "Coliseum",
    city: "Getafe (Madrid area)",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Madrid Atocha", type: "train", notes: "Main hub; connect toward Getafe via local services." },
        { name: "Madrid Sol / Centro", type: "metro", notes: "Tourist base; connect outward via rail/metro." },
        { name: "Getafe Central", type: "train", notes: "Common local hub; last-mile depends on your route." },
      ],
      tips: [
        "Treat this as a ‘Madrid base + travel out’ matchday.",
        "Confirm the final local connection before leaving central Madrid; last-mile options vary by time.",
        "Post-match: expect slower movement back through local lines—don’t cut it tight for trains/airport.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Outer-city driving is more feasible than central Madrid, but congestion still builds near kickoff.",
      officialLots: ["If driving: arrive early; use signed/official options when available."],
    },
    foodDrink: [
      { name: "Madrid Centro (pre/post base)", type: "mixed", notes: "Best variety; then travel out." },
      { name: "Getafe town area", type: "mixed", notes: "Practical local options; keep timing flexible." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro (Sol / Gran Vía)", notes: "Best for weekend trips; easy to day-trip outward." },
        { area: "Atocha / Retiro edge", notes: "Good for rail connections + parks/museums." },
      ],
      budgetAreas: [{ area: "Getafe / South Madrid edge", budgetFriendly: true, notes: "Often cheaper; check connectivity and return times." }],
    },
    arrivalTips: [
      "Plan for a bit of slack after full-time—local returns can be slower than expected.",
      "If kickoff is TBC, avoid non-refundable tight travel plans.",
    ],
  },

  "rayo-vallecano": {
    stadium: "Estadio de Vallecas",
    city: "Madrid",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Puente de Vallecas (Metro)", type: "metro", notes: "Closest metro area; expect crowding around entrances." },
        { name: "Atocha", type: "train", notes: "Major hub; easy connection to Vallecas side." },
        { name: "Sol / Centro", type: "metro", notes: "Tourist base; direct metro routing is common." },
      ],
      tips: [
        "Vallecas is straightforward by metro, but streets are tight near kickoff — arrive earlier.",
        "Post-match: walk a few blocks away before trying taxis.",
        "If you’re staying central, metro beats road travel almost every time.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Dense neighbourhood + limited space. Driving close to the stadium is rarely worth it.",
      officialLots: ["Use metro; if driving, park outside and ride in."],
    },
    foodDrink: [
      { name: "Centro (pre/post)", type: "mixed", notes: "Best variety; easy metro back." },
      { name: "Retiro / Atocha area", type: "food", notes: "Good for museums + meals if you’re doing a full day." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro (Sol / Gran Vía)", notes: "Best tourist base; simple metro access." },
        { area: "Retiro / Atocha", notes: "Great for daytime sightseeing + transport links." },
      ],
      budgetAreas: [{ area: "Lavapiés edge", budgetFriendly: true, notes: "Often better value; check exact street feel." }],
    },
    arrivalTips: [
      "Aim for 60–75 minutes pre-kickoff due to tight approach streets.",
      "Keep return plans flexible on busy matchdays.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Basque / North                                                              */
  /* -------------------------------------------------------------------------- */

  "athletic-club": {
    stadium: "San Mamés",
    city: "Bilbao",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Bilbao Abando", type: "train", notes: "Central rail hub; good for visitors." },
        { name: "San Mamés (Interchange)", type: "train", notes: "Major transport interchange; very convenient." },
        { name: "Moyua / Indautxu area", type: "metro", notes: "Central areas with easy access and good base options." },
      ],
      tips: [
        "Bilbao is compact and visitor-friendly — walking + metro usually solves matchday.",
        "San Mamés interchange makes this one of the easiest logistics in Spain.",
        "Post-match dispersal is steady; if you’re dining after, base central and walk/metro back.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible using city parking, but matchday congestion exists. Public transport is usually simpler.",
      officialLots: ["Use central car parks and walk/metro rather than trying to park right by the stadium."],
    },
    foodDrink: [
      { name: "Indautxu / Moyua area", type: "mixed", notes: "Best central base for food/drink." },
      { name: "Casco Viejo (Old Town)", type: "food", notes: "Great for a city break; allow extra travel time to/from." },
    ],
    stay: {
      bestAreas: [
        { area: "Indautxu", notes: "Best all-round base: central + practical." },
        { area: "Casco Viejo", notes: "Best vibe; easy access with a short metro hop." },
      ],
      budgetAreas: [{ area: "Near Abando / station edge", budgetFriendly: true, notes: "Often good value + practical for arrivals/returns." }],
    },
    arrivalTips: [
      "Arrive early if you want time to explore the riverfront/Old Town before the match.",
      "If you’re day-tripping, don’t cut return trains too tight.",
    ],
  },

  "real-sociedad": {
    stadium: "Reale Arena",
    city: "San Sebastián (Donostia)",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "San Sebastián-Donostia Station", type: "train", notes: "Main arrival hub for visitors." },
        { name: "City centre (Old Town / Centro)", type: "walk", notes: "Common base; last-mile is typically bus/walk depending on route." },
        { name: "Local bus corridors", type: "bus", notes: "Most visitors use buses/taxis for the final stretch; route varies by day/time." },
      ],
      tips: [
        "San Sebastián is compact but the stadium isn’t always a pure walk for everyone — plan the last-mile.",
        "If you’re doing a weekend, base central and keep match travel simple (bus/walk).",
        "Post-match: taxis can bottleneck; walking away from the immediate stadium zone helps.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Parking in a tourist city is limited; matchday adds pressure. Public transport is safer.",
      officialLots: ["Use public transport; if driving, park outside the core and come in."],
    },
    foodDrink: [
      { name: "Parte Vieja (Old Town)", type: "food", notes: "Best food density; ideal pre/post base." },
      { name: "Gros", type: "mixed", notes: "Great vibe; often good value vs Old Town core." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro", notes: "Best all-round base; walkable sightseeing." },
        { area: "Gros", notes: "Good vibe + value; easy access." },
      ],
      budgetAreas: [{ area: "Station edge / Amara area", budgetFriendly: true, notes: "Often cheaper; check exact walk/bus route." }],
    },
    arrivalTips: [
      "If you want a stress-free entry, arrive early and avoid last-minute taxis.",
      "If kickoff is TBC, keep dinner/return plans flexible.",
    ],
  },

  "osasuna": {
    stadium: "Estadio El Sadar",
    city: "Pamplona",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Pamplona city centre", type: "walk", notes: "Most visitors base centrally; stadium access often via walk/bus." },
        { name: "Pamplona bus corridors", type: "bus", notes: "Local buses are commonly used; routes vary by day." },
        { name: "Regional rail/coach arrivals", type: "bus", notes: "Many visitors arrive by coach; plan last-mile from arrival point." },
      ],
      tips: [
        "Pamplona is manageable as a compact city break — keep your base central.",
        "If arriving same-day, confirm return options before kickoff (services can be limited late).",
        "Walking can be the simplest option depending on your accommodation.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than big cities, but congestion still builds near kickoff.",
      officialLots: ["Use city parking and walk/bus in rather than searching near the stadium."],
    },
    foodDrink: [
      { name: "Old Town / Centro", type: "food", notes: "Best variety; easy for visitors." },
      { name: "Ensanche", type: "mixed", notes: "Practical for pre/post without tight Old Town crowds." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro / Old Town edge", notes: "Best visitor base; walkable." },
        { area: "Ensanche", notes: "More space + practical hotels." },
      ],
      budgetAreas: [{ area: "Station/coach arrival edge", budgetFriendly: true, notes: "Often cheaper; check late-night return practicality." }],
    },
    arrivalTips: [
      "Plan returns in advance if you’re not staying overnight.",
      "Arrive early if you want a relaxed meal in the centre first.",
    ],
  },

  "deportivo-alaves": {
    stadium: "Mendizorrotza",
    city: "Vitoria-Gasteiz",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Vitoria-Gasteiz Station", type: "train", notes: "Main arrival hub; connect onward locally." },
        { name: "City centre", type: "walk", notes: "Common base; stadium access often by walk/bus depending on route." },
        { name: "Regional bus/coach arrivals", type: "bus", notes: "Many arrivals are coach-based; last-mile varies." },
      ],
      tips: [
        "Vitoria is compact — walking from central areas is often practical.",
        "If you’re day-tripping from Bilbao, check return timing and build in buffer post-match.",
        "Keep last-mile simple: centre → stadium → centre.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More drivable than major cities, but matchday still creates pinch points.",
      officialLots: ["Use city parking and walk rather than trying to park on the stadium streets."],
    },
    foodDrink: [
      { name: "City centre", type: "mixed", notes: "Best variety; easiest visitor base." },
      { name: "Near the main shopping streets", type: "food", notes: "Practical for a pre/post meal." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Best base for visitors; walkable." },
      ],
      budgetAreas: [{ area: "Station edge", budgetFriendly: true, notes: "Often cheaper and practical for arrivals/returns." }],
    },
    arrivalTips: [
      "If connecting onward by train/coach, leave buffer after full-time.",
      "Arrive early if you want to orient yourself; smaller cities have fewer last-minute options.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Valencia / East                                                             */
  /* -------------------------------------------------------------------------- */

  "valencia": {
    stadium: "Mestalla",
    city: "Valencia",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Xàtiva / Estació del Nord", type: "train", notes: "Central hub for visitors; easy onward movement." },
        { name: "Colón area (Metro)", type: "metro", notes: "Central node; good for staying/dining and dispersal." },
        { name: "Aragón area (Metro)", type: "metro", notes: "Common approach corridor depending on your route." },
      ],
      tips: [
        "Mestalla is fairly central — walking from central areas is often workable.",
        "Post-match: avoid taxis right at the stadium; walk 10 minutes outward first.",
        "If you’re doing a beach + match weekend, keep your base connected to the centre/metro lines.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Central event-day driving is slow and parking is limited.",
      officialLots: ["Use metro/walk; if driving, park outside the core and ride in."],
    },
    foodDrink: [
      { name: "Ruzafa", type: "food", notes: "Strong food/nightlife; easy to route via the centre." },
      { name: "Ciutat Vella / Centro", type: "mixed", notes: "Tourist base; good for pre/post." },
    ],
    stay: {
      bestAreas: [
        { area: "Ruzafa", notes: "Best vibe for a weekend; great food/nightlife." },
        { area: "Centro / Ciutat Vella edge", notes: "Tourist-friendly base; walkable." },
      ],
      budgetAreas: [{ area: "Near Estació del Nord / Arrivals edge", budgetFriendly: true, notes: "Often better value; very practical." }],
    },
    arrivalTips: [
      "Arrive 60–75 minutes pre-kickoff to avoid tight streets near entry.",
      "If kickoff is TBC, avoid rigid dinner/transport bookings.",
    ],
  },

  "villarreal": {
    stadium: "Estadio de la Cerámica",
    city: "Villarreal",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Valencia (rail hub)", type: "train", notes: "Common base city for visitors; connect onward by regional rail." },
        { name: "Castellón de la Plana", type: "train", notes: "Key nearby hub; onward link to Villarreal." },
        { name: "Villarreal station / town centre", type: "train", notes: "Local arrival point; stadium is typically manageable from town." },
      ],
      tips: [
        "Most visitors treat this as a day trip from Valencia or Castellón — check return times before kickoff.",
        "Smaller-town matchdays mean fewer late options; plan food and transport in advance.",
        "Walking from the town area is often simplest once you arrive.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than big cities, but traffic still builds near kickoff.",
      officialLots: ["If driving: arrive early and use town parking + walk."],
    },
    foodDrink: [
      { name: "Valencia (base)", type: "mixed", notes: "Best variety if you’re making a weekend of it." },
      { name: "Villarreal town centre", type: "mixed", notes: "Practical local options; limited late-night flexibility." },
    ],
    stay: {
      bestAreas: [
        { area: "Valencia (Ruzafa/Centro)", notes: "Best weekend base; day-trip to the match." },
        { area: "Castellón (central)", notes: "Closer base; practical if prioritising the match." },
      ],
      budgetAreas: [{ area: "Villarreal town", budgetFriendly: true, notes: "Often cheaper; just confirm return logistics if not staying." }],
    },
    arrivalTips: [
      "Double-check regional rail schedules for your return — don’t assume frequent late trains.",
      "Arrive early in town if you want a calm pre-match meal.",
    ],
  },

  "levante": {
    stadium: "Estadi Ciutat de València",
    city: "Valencia",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Xàtiva / Estació del Nord", type: "train", notes: "Central hub for visitors." },
        { name: "Colón area (Metro)", type: "metro", notes: "Useful central node for routing outward." },
        { name: "Benimaclet area", type: "metro", notes: "Practical transit area depending on where you stay." },
      ],
      tips: [
        "Valencia is an easy city for metro-based matchdays — avoid taxis near kickoff.",
        "Base in central areas for the best weekend experience; travel out for the match.",
        "Post-match: walk a few blocks away before requesting rideshare.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than Mestalla area depending on timing, but still congested on matchday.",
      officialLots: ["If driving: park a bit away and walk the last stretch."],
    },
    foodDrink: [
      { name: "Ruzafa", type: "food", notes: "Best food/nightlife base; easy routing." },
      { name: "Centro / Ciutat Vella", type: "mixed", notes: "Tourist base; reliable pre/post." },
    ],
    stay: {
      bestAreas: [
        { area: "Ruzafa", notes: "Top base for weekend trips." },
        { area: "Centro / Ciutat Vella edge", notes: "Tourist-friendly and walkable." },
      ],
      budgetAreas: [{ area: "Near Estació del Nord edge", budgetFriendly: true, notes: "Often better value + practical." }],
    },
    arrivalTips: [
      "Arrive early if you’re unfamiliar with the local metro routing.",
      "If kickoff is TBC, keep return plans flexible.",
    ],
  },

  "mallorca": {
    stadium: "Estadi Mallorca Son Moix",
    city: "Palma (Mallorca)",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Palma city centre", type: "bus", notes: "Most visitors base here; last-mile often via bus/taxi depending on route." },
        { name: "Palma Intermodal Station", type: "train", notes: "Key transport hub (rail/bus); good anchor point for routing." },
        { name: "Airport arrivals (PMI)", type: "bus", notes: "If arriving same day, plan airport-to-centre first; then match routing." },
      ],
      tips: [
        "Treat Palma centre as your base; the stadium trip is usually a short transfer from there.",
        "Island transport can be time-sensitive — avoid cutting it tight if kickoff time shifts.",
        "Post-match: taxis can bottleneck; walking away from the immediate zone helps.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible, but matchday congestion and parking demand rise sharply.",
      officialLots: ["If driving: arrive early and use signed/official parking where available."],
    },
    foodDrink: [
      { name: "Palma Old Town", type: "food", notes: "Best visitor area; strong food density." },
      { name: "Santa Catalina", type: "mixed", notes: "Great vibe; good for a weekend base." },
    ],
    stay: {
      bestAreas: [
        { area: "Old Town (Casco Antiguo)", notes: "Best tourist base; walkable." },
        { area: "Santa Catalina", notes: "Best vibe; easy access to centre." },
      ],
      budgetAreas: [{ area: "Near Intermodal Station edge", budgetFriendly: true, notes: "Often better value; practical for transport." }],
    },
    arrivalTips: [
      "If you’re arriving same day via airport, build in slack for transfers.",
      "Keep return plans flexible if kickoff is TBC — island logistics can be less forgiving.",
    ],
  },

  "girona": {
    stadium: "Estadi Montilivi",
    city: "Girona",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Girona Station (rail)", type: "train", notes: "Main arrival hub; many visitors come via Barcelona." },
        { name: "Barcelona Sants (rail hub)", type: "train", notes: "Common base for visitors; connect to Girona by train." },
        { name: "Girona city centre", type: "walk", notes: "Good base; last-mile to stadium often walk/bus depending on accommodation." },
      ],
      tips: [
        "This is a great ‘Barcelona base + Girona day trip’ match if you’re doing a weekend.",
        "Check return train times before kickoff—late services can be less frequent.",
        "Walking can be practical depending on where you stay; plan your route in advance.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible, but traffic and parking demand rise around kickoff.",
      officialLots: ["Use city parking and walk/bus rather than hunting near the stadium."],
    },
    foodDrink: [
      { name: "Girona Old Town", type: "food", notes: "Best visitor area; good for a full day trip." },
      { name: "Barcelona (Eixample/Centro)", type: "mixed", notes: "Best variety if using Barcelona as the base." },
    ],
    stay: {
      bestAreas: [
        { area: "Girona Old Town / Centre", notes: "Best vibe if staying in Girona." },
        { area: "Barcelona (Eixample)", notes: "Best base if you’re combining multiple activities." },
      ],
      budgetAreas: [{ area: "Near Girona Station edge", budgetFriendly: true, notes: "Often cheaper; practical for returns." }],
    },
    arrivalTips: [
      "If day-tripping, don’t cut it tight for your last return train.",
      "Arrive early to enjoy the Old Town before match travel.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Andalusia / South                                                           */
  /* -------------------------------------------------------------------------- */

  "sevilla": {
    stadium: "Ramón Sánchez-Pizjuán",
    city: "Seville",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Sevilla Santa Justa", type: "train", notes: "Main arrival station; good anchor point." },
        { name: "Nervión area", type: "metro", notes: "Stadium-adjacent district; very practical for matchday." },
        { name: "City centre (Old Town)", type: "walk", notes: "Tourist base; connect by walk/metro/taxi depending on heat/time." },
      ],
      tips: [
        "Seville is very walkable, but heat can change your plan — don’t overcommit to long walks in summer.",
        "Nervión is the practical matchday base: easy access and good dispersal.",
        "Post-match: walk a bit away from the stadium streets before trying taxis.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Central Seville driving is slow; parking demand spikes on matchdays.",
      officialLots: ["Use public transport/walk; if driving, park outside the core and ride in."],
    },
    foodDrink: [
      { name: "Nervión", type: "mixed", notes: "Practical pre/post hub." },
      { name: "Old Town (Centro)", type: "food", notes: "Best tourist base; great dinner options." },
    ],
    stay: {
      bestAreas: [
        { area: "Old Town / Centro", notes: "Best for a city break; sightseeing + food." },
        { area: "Nervión", notes: "Best pure match logistics; very practical." },
      ],
      budgetAreas: [{ area: "Near Santa Justa edge", budgetFriendly: true, notes: "Often better value; practical for rail arrivals." }],
    },
    arrivalTips: [
      "Arrive early if temperatures are high—moving slower is normal.",
      "If kickoff is TBC, keep return plans flexible (especially late-night travel).",
    ],
  },

  "real-betis": {
    stadium: "Benito Villamarín",
    city: "Seville",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Sevilla Santa Justa", type: "train", notes: "Main arrival station; connect onward locally." },
        { name: "City centre (Old Town)", type: "walk", notes: "Tourist base; common staging point." },
        { name: "Local bus corridors toward the stadium", type: "bus", notes: "Many visitors rely on buses/taxis for the final stretch; route varies by day." },
      ],
      tips: [
        "Treat the city centre as your base, then bus/taxi out for the match.",
        "If it’s hot, minimise walking time and plan the last-mile carefully.",
        "Post-match: taxis are slow right outside — walk away from the immediate zone first.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than very central venues, but matchday congestion is real.",
      officialLots: ["If driving: arrive early; consider parking further out and using bus/taxi for the final leg."],
    },
    foodDrink: [
      { name: "Old Town / Centro", type: "food", notes: "Best for visitors; then travel out." },
      { name: "Triana", type: "mixed", notes: "Great vibe area; check your route/timing to the stadium." },
    ],
    stay: {
      bestAreas: [
        { area: "Old Town / Centro", notes: "Best tourist base; food + sights." },
        { area: "Triana", notes: "Great vibe; still workable for match travel." },
      ],
      budgetAreas: [{ area: "Near Santa Justa edge", budgetFriendly: true, notes: "Often better value; practical for rail." }],
    },
    arrivalTips: [
      "Have your last-mile plan ready (bus/taxi) — don’t improvise at the last minute.",
      "Keep return plans flexible if kickoff is TBC.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Galicia                                                                      */
  /* -------------------------------------------------------------------------- */

  "celta-vigo": {
    stadium: "Abanca-Balaídos",
    city: "Vigo",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Vigo-Guixar / Vigo-Urzáiz", type: "train", notes: "Key arrival points; confirm which station your train uses." },
        { name: "City centre / waterfront", type: "bus", notes: "Common base; last-mile via bus/taxi depending on route." },
        { name: "Regional coach arrivals", type: "bus", notes: "Many visitors arrive by coach; plan the final connection." },
      ],
      tips: [
        "Vigo is a good weekend city break; base central and use buses/taxis for match travel.",
        "Check return timing before kickoff if you’re not staying overnight.",
        "Post-match: taxis can bottleneck; walking away from the immediate roads helps.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible with planning, but matchday traffic builds around the stadium district.",
      officialLots: ["Use city parking and connect by bus/taxi; avoid last-minute street hunting."],
    },
    foodDrink: [
      { name: "Casco Vello / centre", type: "food", notes: "Best visitor area for food + atmosphere." },
      { name: "Waterfront area", type: "mixed", notes: "Good for a weekend vibe; keep timings flexible." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre / waterfront", notes: "Best base for visitors." },
        { area: "Old Town edge", notes: "Great for vibe; check exact walking practicality." },
      ],
      budgetAreas: [{ area: "Near main stations edge", budgetFriendly: true, notes: "Often cheaper; practical for arrivals/returns." }],
    },
    arrivalTips: [
      "Confirm which Vigo station you’re using before travel — it affects last-mile.",
      "Build in slack for post-match return movement if you’re catching trains.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Alicante / Costa Blanca                                                     */
  /* -------------------------------------------------------------------------- */

  "elche": {
    stadium: "Estadio Martínez Valero",
    city: "Elche",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Alicante (rail hub)", type: "train", notes: "Common base city for visitors; connect onward to Elche." },
        { name: "Elche / Elx rail connections", type: "train", notes: "Local arrival; last-mile depends on station and timing." },
        { name: "Alicante Airport (ALC)", type: "bus", notes: "If arriving same day, plan airport→base first; then match travel." },
      ],
      tips: [
        "Treat this as an Alicante-base day trip unless you’re staying local.",
        "Check regional transport schedules (especially late returns) before kickoff.",
        "Plan the last-mile from Elche arrival point — it can be the friction point.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than major cities, but still congested near kickoff.",
      officialLots: ["If driving: arrive early and use signed/official parking where possible."],
    },
    foodDrink: [
      { name: "Alicante centre", type: "mixed", notes: "Best variety for a weekend base." },
      { name: "Elche town area", type: "mixed", notes: "Practical local options if staying nearby." },
    ],
    stay: {
      bestAreas: [
        { area: "Alicante centre", notes: "Best weekend base; easy beach + city break." },
        { area: "Elche town", notes: "Works if you want to be close; confirm transport links." },
      ],
      budgetAreas: [{ area: "Near Alicante rail edge", budgetFriendly: true, notes: "Often cheaper; practical for day trips." }],
    },
    arrivalTips: [
      "If you’re flying in, don’t stack tight connections—airport + regional travel can add time.",
      "Confirm return options before kickoff if you’re not staying overnight.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Others                                                                       */
  /* -------------------------------------------------------------------------- */

  "real-oviedo": {
    stadium: "Estadio Carlos Tartiere",
    city: "Oviedo",
    country: "Spain",
    transport: {
      primaryStops: [
        { name: "Oviedo (rail station)", type: "train", notes: "Main arrival for visitors; connect onward locally." },
        { name: "City centre", type: "walk", notes: "Common base; last-mile often walk/bus depending on your accommodation." },
        { name: "Regional coach arrivals", type: "bus", notes: "Many arrivals are coach-based; plan last-mile in advance." },
      ],
      tips: [
        "Oviedo works well as a compact city break — keep your base central.",
        "If you’re day-tripping from a bigger city, check late return options before kickoff.",
        "Walking can be practical; keep your route simple and plan your return early.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than major cities, but matchday still adds congestion.",
      officialLots: ["Use city parking and walk/bus; avoid last-minute searching near the stadium."],
    },
    foodDrink: [
      { name: "Old Town / Centro", type: "food", notes: "Best visitor area; strong local food options." },
      { name: "Near main pedestrian streets", type: "mixed", notes: "Practical for pre/post without overthinking." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Best base for visitors." },
      ],
      budgetAreas: [{ area: "Station edge", budgetFriendly: true, notes: "Often cheaper and practical for arrivals/returns." }],
    },
    arrivalTips: [
      "If you’re relying on regional rail/coach, confirm your return before kickoff.",
      "Arrive early if you want time for a proper meal before heading to the stadium.",
    ],
  },
};

export default laLigaLogistics;
