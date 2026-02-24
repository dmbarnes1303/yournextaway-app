// src/data/matchdayLogistics/serieA.ts
import type { MatchdayLogistics } from "./types";

/**
 * Serie A Matchday Logistics (20 teams) — neutral traveller oriented.
 *
 * Rules:
 * - Useful + conservative (no fake pub/restaurant names).
 * - Prefer stable transport guidance (key stations/lines/hubs).
 * - Keep it “neutral traveller” oriented.
 *
 * IMPORTANT:
 * Keys must match normalizeClubKey(homeTeamName) used by your registries.
 * Use hyphenated slugs for multi-word clubs (e.g. "hellas-verona").
 */

const serieALogistics: Record<string, MatchdayLogistics> = {
  /* -------------------------------------------------------------------------- */
  /* Milan                                                                       */
  /* -------------------------------------------------------------------------- */

  "inter": {
    stadium: "Stadio San Siro (Giuseppe Meazza)",
    city: "Milan",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "San Siro Stadio (Metro)", type: "metro", notes: "M5 (purple). Most direct for visitors; heavy crowd control post-match." },
        { name: "Lotto (Metro)", type: "metro", notes: "M1/M5 interchange; solid fallback if San Siro Stadio queues are intense." },
        { name: "Milano Centrale", type: "train", notes: "Main arrival hub; connect to Metro for stadium." },
      ],
      tips: [
        "M5 is the cleanest route. Post-match: expect managed queues — waiting 10–15 minutes often makes it smoother.",
        "If you’re central, aim to base around a Metro line (M1/M2/M3) to simplify your weekend.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving to San Siro on matchday is slow and parking is constrained. Public transport is safer.",
      officialLots: ["Use Metro (M5) or park further out and ride in. Avoid last-minute street parking near the stadium."],
    },
    foodDrink: [
      { name: "City centre (Duomo / Brera)", type: "mixed", notes: "Best density for food/drink; then Metro out." },
      { name: "Navigli canals area", type: "bar", notes: "Classic evening base; plan Metro back." },
    ],
    stay: {
      bestAreas: [
        { area: "Duomo / Centro Storico", notes: "Best tourist base; easy Metro access." },
        { area: "Porta Garibaldi / Isola", notes: "Great weekend vibe; well connected." },
      ],
      budgetAreas: [
        { area: "Lambrate", budgetFriendly: true, notes: "Often better value; check Metro/rail links." },
        { area: "Bicocca", budgetFriendly: true, notes: "Good value; straightforward transit." },
      ],
    },
    arrivalTips: [
      "Aim to arrive 60–90 mins pre-kickoff to avoid late bottlenecks at the Metro and turnstiles.",
      "Screenshot your route for the return — post-match signal can be busy.",
    ],
  },

  "milan": {
    stadium: "Stadio San Siro (Giuseppe Meazza)",
    city: "Milan",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "San Siro Stadio (Metro)", type: "metro", notes: "M5 (purple). Most direct for visitors; queues normal post-match." },
        { name: "Lotto (Metro)", type: "metro", notes: "M1/M5 interchange; best fallback option." },
        { name: "Milano Centrale", type: "train", notes: "Main arrival station; connect to Metro." },
      ],
      tips: [
        "M5 is the simplest. If it’s packed, walk to Lotto and hop on there.",
        "If kickoff is uncertain, don’t book tight same-day return trains.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "San Siro matchdays are not driving-friendly. Expect congestion and limited parking.",
      officialLots: ["Use Metro. If driving, park outside the immediate stadium zone and ride in."],
    },
    foodDrink: [
      { name: "Brera", type: "food", notes: "Strong food area; ideal pre/post base." },
      { name: "Navigli", type: "bar", notes: "Good evening atmosphere; plan transit." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro / Duomo", notes: "Best for a short break; simplest logistics." },
        { area: "Porta Garibaldi / Isola", notes: "Modern, lively, well connected." },
      ],
      budgetAreas: [{ area: "Near Milano Centrale", budgetFriendly: true, notes: "Often practical and good value; check hotel quality." }],
    },
    arrivalTips: [
      "After full-time, crowd control is normal—give yourself time before your next plan.",
      "If you’re using taxis, walk away from the stadium perimeter for easier pickup.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Rome                                                                        */
  /* -------------------------------------------------------------------------- */

  "roma": {
    stadium: "Stadio Olimpico",
    city: "Rome",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Ottaviano (Metro)", type: "metro", notes: "Line A. Common visitor route; you’ll still have a walk/bus connection." },
        { name: "Flaminio (Metro)", type: "metro", notes: "Line A + tram connections; practical depending on your base." },
        { name: "Roma Termini", type: "train", notes: "Main rail hub; connect to Metro A for the stadium area." },
      ],
      tips: [
        "Expect a last-leg walk or bus/tram connection — Olimpico isn’t a doorstep Metro stop.",
        "Plan your return: the area can bottleneck; leaving 10–15 minutes after full-time helps.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Event-day traffic around the stadium is heavy and parking is unreliable.",
      officialLots: ["Public transport + walking is typically faster than trying to park near Olimpico."],
    },
    foodDrink: [
      { name: "Prati", type: "mixed", notes: "Visitor-friendly base near Metro A; good pre/post options." },
      { name: "Centro Storico", type: "food", notes: "Best overall food density; then travel to match." },
    ],
    stay: {
      bestAreas: [
        { area: "Prati", notes: "Strong tourist base + practical match logistics." },
        { area: "Centro Storico", notes: "Best ‘Rome weekend’ base; slightly more travel to match." },
      ],
      budgetAreas: [{ area: "San Giovanni", budgetFriendly: true, notes: "Often better value; Metro A access." }],
    },
    arrivalTips: [
      "Give yourself time for the final stretch to the stadium — it’s part of the matchday routine in Rome.",
      "If kickoff is TBC, keep dinner/transport flexible.",
    ],
  },

  "lazio": {
    stadium: "Stadio Olimpico",
    city: "Rome",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Ottaviano (Metro)", type: "metro", notes: "Line A. Common access point; final leg by walk/bus." },
        { name: "Flaminio (Metro)", type: "metro", notes: "Line A + tram connections; practical option." },
        { name: "Roma Termini", type: "train", notes: "Main arrival hub for visitors; Metro A onwards." },
      ],
      tips: [
        "Olimpico requires a last-leg connection. Don’t assume it’s a 2-minute Metro hop.",
        "Post-match: plan extra time — queues and traffic are normal.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving close to the stadium is slow and parking is constrained on matchdays.",
      officialLots: ["Use Metro A + last-leg connection. If driving, park further out and transit in."],
    },
    foodDrink: [
      { name: "Prati", type: "mixed", notes: "Convenient base; lots of choice." },
      { name: "Trastevere", type: "bar", notes: "Strong evening vibe; plan transport back." },
    ],
    stay: {
      bestAreas: [
        { area: "Prati", notes: "Practical + tourist-friendly." },
        { area: "Centro Storico", notes: "Best short-break base; more travel to match." },
      ],
      budgetAreas: [{ area: "Tiburtina area", budgetFriendly: true, notes: "Often better value; check exact transit." }],
    },
    arrivalTips: [
      "Arrive 60–90 mins early to avoid rushing the last-leg connection.",
      "For taxis after the match, walk away from the stadium perimeter first.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Naples                                                                      */
  /* -------------------------------------------------------------------------- */

  "napoli": {
    stadium: "Stadio Diego Armando Maradona",
    city: "Naples",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Napoli Centrale (Garibaldi)", type: "train", notes: "Main arrival hub for visitors; connect to Metro for city travel." },
        { name: "Line 2 (Campi Flegrei / Fuorigrotta area)", type: "train", notes: "Common rail approach to the stadium district; check matchday routing." },
        { name: "City centre Metro links", type: "metro", notes: "Use Metro to get near Fuorigrotta, then walk the last stretch." },
      ],
      tips: [
        "Treat the Fuorigrotta/Campi Flegrei area as your stadium district reference.",
        "Post-match: expect crowding on the return — build buffer time if you’re catching a train.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Matchday driving is messy. Expect congestion and difficult parking near the stadium district.",
      officialLots: ["If you must drive, park away from the stadium district and come in by Metro/rail."],
    },
    foodDrink: [
      { name: "Centro Storico", type: "food", notes: "Best food experience for visitors; then travel to the match." },
      { name: "Chiaia", type: "bar", notes: "Good evening area; plan transit." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro Storico", notes: "Best tourist base for Naples." },
        { area: "Chiaia", notes: "Nice base, good evening options." },
      ],
      budgetAreas: [{ area: "Near Napoli Centrale", budgetFriendly: true, notes: "Often practical; check the exact street and hotel reviews." }],
    },
    arrivalTips: [
      "If you’re unfamiliar with Naples transit, screenshot your route and allow extra time.",
      "Keep return rail connections flexible if kickoff is uncertain.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Turin                                                                       */
  /* -------------------------------------------------------------------------- */

  "juventus": {
    stadium: "Allianz Stadium",
    city: "Turin",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Torino Porta Susa", type: "train", notes: "High-speed/rail hub; common tourist arrival point." },
        { name: "Torino Porta Nuova", type: "train", notes: "Central station; good for city base." },
        { name: "Stadium district bus/tram connections", type: "tram", notes: "Use city transit to the stadium area; matchday routing can vary." },
      ],
      tips: [
        "Base in central Turin and use public transport for the stadium district.",
        "Post-match: taxis can be slow—public transport or a short walk away helps pickup.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than big cities, but expect matchday congestion around the stadium zone.",
      officialLots: ["If driving, pre-book official/event parking where possible. Otherwise park central and use transit."],
    },
    foodDrink: [
      { name: "Centro / Porta Nuova area", type: "mixed", notes: "Best base for visitors; easy access to transit." },
      { name: "Quadrilatero Romano", type: "bar", notes: "Popular evening area for short breaks." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Best for weekends + easy transit." },
        { area: "Near Porta Susa", notes: "Practical if arriving by high-speed rail." },
      ],
      budgetAreas: [{ area: "Lingotto edge", budgetFriendly: true, notes: "Can be good value; check transit links." }],
    },
    arrivalTips: [
      "Arrive with a return plan — matchday crowd management can slow the first 20–30 minutes after full-time.",
      "If you’re day-tripping by train, don’t book the earliest return slot.",
    ],
  },

  "torino": {
    stadium: "Stadio Olimpico Grande Torino",
    city: "Turin",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Torino Porta Nuova", type: "train", notes: "Central hub; good base for visitors." },
        { name: "Torino Porta Susa", type: "train", notes: "High-speed/rail hub; easy to connect into the city." },
        { name: "City tram/bus to stadium area", type: "tram", notes: "Standard last-leg approach; matchday routing varies." },
      ],
      tips: [
        "Stay central and use tram/bus for the last leg to the stadium area.",
        "Post-match: walk 10–15 minutes before calling a taxi if you want a faster pickup.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but congestion builds near kickoff. Pre-planning helps.",
      officialLots: ["Use city car parks and transit/walk the last leg. Avoid searching street parking near kickoff."],
    },
    foodDrink: [
      { name: "City centre", type: "mixed", notes: "Best variety for visitors." },
      { name: "Quadrilatero Romano", type: "food", notes: "Good option for post-match dinner." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Best weekend base." },
        { area: "Near Porta Nuova", notes: "Convenient for rail arrivals." },
      ],
      budgetAreas: [{ area: "Near Porta Susa", budgetFriendly: true, notes: "Often good value; still central." }],
    },
    arrivalTips: [
      "Build buffer time if you have a train to catch after the match.",
      "If kickoff is TBC, keep evening plans flexible.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Bergamo                                                                      */
  /* -------------------------------------------------------------------------- */

  "atalanta": {
    stadium: "Gewiss Stadium",
    city: "Bergamo",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Bergamo Station", type: "train", notes: "Main arrival hub; connects to Milan." },
        { name: "Bergamo city centre bus routes", type: "bus", notes: "Standard approach to the stadium district." },
        { name: "Milan (base city) rail links", type: "train", notes: "Many visitors stay in Milan and day-trip by train." },
      ],
      tips: [
        "Bergamo is a strong day-trip from Milan: rail in, then local bus/walk.",
        "Plan your return train time pre-kickoff so you’re not rushing after full-time.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible, but city traffic can slow down near kickoff.",
      officialLots: ["If driving, arrive early and use official/city parking then walk."],
    },
    foodDrink: [
      { name: "Città Alta", type: "food", notes: "Best visitor area for atmosphere and dining." },
      { name: "Lower town centre", type: "mixed", notes: "Practical for transit and a quick bite." },
    ],
    stay: {
      bestAreas: [
        { area: "Città Alta", notes: "Great weekend vibe; slightly less convenient for transit." },
        { area: "Lower town near station", notes: "Most practical base for trains." },
      ],
      budgetAreas: [{ area: "Near Bergamo Station", budgetFriendly: true, notes: "Often best value for short stays." }],
    },
    arrivalTips: [
      "If staying in Milan, build buffer for post-match dispersal before your return train.",
      "Arrive early if you want time in Città Alta pre-match.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Bologna                                                                     */
  /* -------------------------------------------------------------------------- */

  "bologna": {
    stadium: "Stadio Renato Dall'Ara",
    city: "Bologna",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Bologna Centrale", type: "train", notes: "Major rail hub; best base point for visitors." },
        { name: "City bus routes to stadium", type: "bus", notes: "Common last-leg method; allow extra time near kickoff." },
        { name: "City centre walk options", type: "walk", notes: "Depending on where you stay, walking can be viable." },
      ],
      tips: [
        "Base in the city centre near the station — Bologna is compact and visitor-friendly.",
        "Post-match: buses can queue; consider walking partway back toward centre.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible, but ZTL/restrictions and congestion can catch tourists out.",
      officialLots: ["Use city car parks outside restricted zones, then bus/walk."],
    },
    foodDrink: [
      { name: "Centro / around Piazza Maggiore", type: "food", notes: "Best food density; ideal base." },
      { name: "University area", type: "bar", notes: "Good evening vibe; short walk from centre." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Best weekend base; walkable." },
        { area: "Near Bologna Centrale", notes: "Most practical for rail travel." },
      ],
      budgetAreas: [{ area: "Bolognina edge", budgetFriendly: true, notes: "Often cheaper; check exact area + walking route." }],
    },
    arrivalTips: [
      "If you’re taking an early train the next day, don’t cut post-match timing tight.",
      "If kickoff is late, plan your last transport back to your accommodation.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Udine                                                                       */
  /* -------------------------------------------------------------------------- */

  "udinese": {
    stadium: "Bluenergy Stadium (Stadio Friuli)",
    city: "Udine",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Udine Station", type: "train", notes: "Main arrival hub; connect onward by bus/taxi." },
        { name: "City buses to stadium area", type: "bus", notes: "Common last-leg option; check matchday frequency." },
        { name: "Trieste / Venice rail connections", type: "train", notes: "Useful if you’re basing elsewhere in the region." },
      ],
      tips: [
        "Treat Udine as a rail-in + bus/taxi last-leg matchday.",
        "If day-tripping, confirm return trains before kickoff.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than big cities, but still busy close to kickoff.",
      officialLots: ["Arrive early if driving; prefer signed event parking or city car parks with a walk."],
    },
    foodDrink: [
      { name: "Udine city centre", type: "mixed", notes: "Best for a pre/post match meal; then transit to stadium area." },
      { name: "Near the station", type: "mixed", notes: "Practical if you’re day-tripping." },
    ],
    stay: {
      bestAreas: [
        { area: "Udine city centre", notes: "Best base if you’re staying overnight." },
      ],
      budgetAreas: [{ area: "Near Udine Station", budgetFriendly: true, notes: "Often practical and cheaper." }],
    },
    arrivalTips: [
      "If you’re relying on buses, keep a small time buffer for matchday delays.",
      "Screenshot your return rail details before the match.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Parma                                                                       */
  /* -------------------------------------------------------------------------- */

  "parma": {
    stadium: "Stadio Ennio Tardini",
    city: "Parma",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Parma Station", type: "train", notes: "Main arrival hub; often walkable to city centre." },
        { name: "City centre walk routes", type: "walk", notes: "Depending on your base, walking to the stadium can be practical." },
        { name: "Local buses", type: "bus", notes: "Useful if you’re staying further out." },
      ],
      tips: [
        "Parma is compact — a very easy ‘match + food weekend’ city.",
        "If you’re day-tripping by train, allow a buffer post-match for station crowds.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible; city traffic increases near kickoff.",
      officialLots: ["Use city car parks and walk the last part. Avoid last-minute street parking."],
    },
    foodDrink: [
      { name: "Centro Storico", type: "food", notes: "Best area for dinner; ideal for visitors." },
      { name: "Near the station", type: "mixed", notes: "Practical for quick pre/post options." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Best base for a short break." },
      ],
      budgetAreas: [{ area: "Near Parma Station", budgetFriendly: true, notes: "Often best value and practical." }],
    },
    arrivalTips: [
      "If kickoff is uncertain, keep dinner reservations flexible.",
      "Arrive early if you want a relaxed walk-in and time to find your entrance.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Florence                                                                    */
  /* -------------------------------------------------------------------------- */

  "fiorentina": {
    stadium: "Stadio Artemio Franchi",
    city: "Florence",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Firenze Santa Maria Novella (SMN)", type: "train", notes: "Main arrival hub for visitors." },
        { name: "Campo di Marte (Rail)", type: "train", notes: "Useful rail stop closer to the stadium district (depending on your route)." },
        { name: "City buses to stadium area", type: "bus", notes: "Common last-leg option; allow extra time near kickoff." },
      ],
      tips: [
        "Florence is extremely walkable — base centrally and treat the stadium trip as a short transit leg.",
        "Post-match: crowds build near the stadium district; walking away before taxi pickup helps.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Florence traffic + restricted zones make driving awkward for visitors.",
      officialLots: ["Use public transport and walking. If driving, park outside restricted zones and transit in."],
    },
    foodDrink: [
      { name: "Centro Storico", type: "food", notes: "Best tourist base for dining; then travel to match." },
      { name: "San Lorenzo / Mercato area", type: "food", notes: "Good pre/post food density." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro Storico", notes: "Best base for a Florence weekend." },
        { area: "Near SMN station", notes: "Practical for day trips and rail connections." },
      ],
      budgetAreas: [{ area: "Novoli edge", budgetFriendly: true, notes: "Often better value; check transit links." }],
    },
    arrivalTips: [
      "If you’re mixing sightseeing + match, schedule the stadium travel as its own block (don’t rush it).",
      "If kickoff is late, plan your return transit — some routes thin out at night.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Genoa                                                                       */
  /* -------------------------------------------------------------------------- */

  "genoa": {
    stadium: "Stadio Luigi Ferraris",
    city: "Genoa",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Genova Piazza Principe", type: "train", notes: "Main arrival hub for many visitors; connect by bus/taxi." },
        { name: "Genova Brignole", type: "train", notes: "Useful station depending on your accommodation; short onward connection." },
        { name: "City buses to stadium area", type: "bus", notes: "Common last-leg method; allow extra time." },
      ],
      tips: [
        "Base near one of the main stations for the easiest logistics.",
        "Genoa is hilly—factor that into walking plans (good shoes).",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Dense city streets + congestion make driving awkward on matchdays.",
      officialLots: ["Use train + bus/taxi last leg. If driving, park centrally and walk/transit."],
    },
    foodDrink: [
      { name: "Old Town / Porto Antico", type: "mixed", notes: "Best visitor area for atmosphere and food." },
      { name: "Near Brignole area", type: "mixed", notes: "Practical base depending on your route." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro / Porto Antico", notes: "Best short-break base; good evening vibe." },
        { area: "Near Brignole", notes: "Practical for transit; check the immediate street quality." },
      ],
      budgetAreas: [{ area: "Near Piazza Principe", budgetFriendly: true, notes: "Often practical and better value." }],
    },
    arrivalTips: [
      "If you’re day-tripping, don’t book a super-tight return train — city dispersal takes time.",
      "Screenshot your navigation; narrow streets can be confusing if you’re new to Genoa.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Sardinia                                                                    */
  /* -------------------------------------------------------------------------- */

  "cagliari": {
    stadium: "Unipol Domus",
    city: "Cagliari",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Cagliari (Central rail/bus area)", type: "train", notes: "Main arrival point in the city; connect locally." },
        { name: "City buses to stadium area", type: "bus", notes: "Standard last-leg option; check matchday frequency." },
        { name: "Airport transfers", type: "other", notes: "If flying in, plan airport ↔ centre transport first, then stadium." },
      ],
      tips: [
        "Treat it as: airport/arrival → city centre base → bus/taxi to stadium area.",
        "If you’re doing a beach-style weekend, keep matchday transport simple and allow extra time.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but don’t assume easy parking close to kickoff.",
      officialLots: ["Arrive early if driving; otherwise bus/taxi from the centre is easiest."],
    },
    foodDrink: [
      { name: "Marina district", type: "mixed", notes: "Good base for food and evening atmosphere." },
      { name: "Historic centre", type: "food", notes: "Strong dining options for visitors." },
    ],
    stay: {
      bestAreas: [
        { area: "Marina / waterfront", notes: "Best vibe for a weekend break." },
        { area: "City centre", notes: "Most practical for transport." },
      ],
      budgetAreas: [{ area: "Near central transit hubs", budgetFriendly: true, notes: "Often better value; check walkability." }],
    },
    arrivalTips: [
      "If you’re timing flights around kickoff, keep buffers — local travel can be slower than expected.",
      "Arrive early if you want a relaxed pre-match meal in the centre.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Lecce                                                                       */
  /* -------------------------------------------------------------------------- */

  "lecce": {
    stadium: "Stadio Via del Mare",
    city: "Lecce",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Lecce Station", type: "train", notes: "Main arrival hub; connect onward locally." },
        { name: "City buses to stadium area", type: "bus", notes: "Typical last-leg; check matchday frequency." },
        { name: "Local taxi/rideshare", type: "other", notes: "Works if timed early; demand spikes near kickoff." },
      ],
      tips: [
        "Base in the historic centre for the best weekend experience, then travel to the stadium.",
        "If you’re day-tripping by train, confirm return times before kickoff.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible with planning, but matchday congestion is real.",
      officialLots: ["Arrive early if driving; otherwise use city parking and a short taxi/bus ride."],
    },
    foodDrink: [
      { name: "Historic centre", type: "food", notes: "Best for visitors; great dining base." },
      { name: "Near the station", type: "mixed", notes: "Practical if you’re day-tripping." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro Storico", notes: "Best base for a short break." },
      ],
      budgetAreas: [{ area: "Near Lecce Station", budgetFriendly: true, notes: "Often cheaper and practical." }],
    },
    arrivalTips: [
      "Keep buffers if you’re connecting via regional trains—delays happen.",
      "Arrive early if you want time to find your entrance and settle in.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Verona                                                                      */
  /* -------------------------------------------------------------------------- */

  "hellas-verona": {
    stadium: "Stadio Marcantonio Bentegodi",
    city: "Verona",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Verona Porta Nuova", type: "train", notes: "Main arrival hub; connect onward by bus/taxi." },
        { name: "City buses to stadium area", type: "bus", notes: "Typical last-leg; allow extra time near kickoff." },
        { name: "City centre walk options", type: "walk", notes: "Depending on accommodation, walking may be viable." },
      ],
      tips: [
        "Base centrally (or near Porta Nuova) and keep matchday simple: bus/taxi/walk last leg.",
        "Post-match: taxis can bottleneck—walking a bit away helps pickup.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but congestion builds around kickoff and full-time.",
      officialLots: ["Use city car parks and walk/bus the last stretch. Avoid last-minute street parking."],
    },
    foodDrink: [
      { name: "Centro Storico", type: "mixed", notes: "Best weekend base for visitors." },
      { name: "Near Porta Nuova", type: "mixed", notes: "Practical if you’re day-tripping." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro Storico", notes: "Best for sightseeing + food." },
        { area: "Near Porta Nuova", notes: "Most practical for trains." },
      ],
      budgetAreas: [{ area: "Borgo Roma edge", budgetFriendly: true, notes: "Can be better value; check transit." }],
    },
    arrivalTips: [
      "If you’re returning by train the same day, don’t cut it tight.",
      "If kickoff is TBC, keep dinner reservations flexible.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Sassuolo                                                                     */
  /* -------------------------------------------------------------------------- */

  "sassuolo": {
    stadium: "Mapei Stadium – Città del Tricolore",
    city: "Reggio Emilia",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Reggio Emilia Station", type: "train", notes: "Main arrival hub for the city; connect onward locally." },
        { name: "Reggio Emilia AV (High-speed)", type: "train", notes: "If arriving by high-speed rail, you’ll still need a local connection." },
        { name: "Local buses/taxis to stadium area", type: "bus", notes: "Typical last-leg method; allow time." },
      ],
      tips: [
        "Treat this as a rail-in + last-leg transit matchday. It’s usually easiest from a city centre base.",
        "If you’re basing in Bologna/Modena, check your return routing before kickoff.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible with planning, but event traffic still builds.",
      officialLots: ["Use official/event parking where offered, or park centrally and taxi/bus the last leg."],
    },
    foodDrink: [
      { name: "Reggio Emilia centre", type: "mixed", notes: "Best practical base for pre/post." },
      { name: "Bologna (nearby base)", type: "mixed", notes: "If you’re staying in Bologna, do this as a day trip." },
    ],
    stay: {
      bestAreas: [
        { area: "Reggio Emilia centre", notes: "Best if staying overnight." },
      ],
      budgetAreas: [{ area: "Near Reggio Emilia station", budgetFriendly: true, notes: "Often practical and better value." }],
    },
    arrivalTips: [
      "If you’re connecting by train, build buffer time—regional services can be tight after matches.",
      "Arrive early if you’re unfamiliar with local transit connections.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Como                                                                        */
  /* -------------------------------------------------------------------------- */

  "como": {
    stadium: "Stadio Giuseppe Sinigaglia",
    city: "Como",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Como San Giovanni", type: "train", notes: "Main rail arrival for many visitors; easy if day-tripping from Milan." },
        { name: "Como Lago", type: "train", notes: "Useful depending on your route; very close to the lakefront." },
        { name: "Milan (base city) rail links", type: "train", notes: "Many visitors stay in Milan and day-trip by train." },
      ],
      tips: [
        "Como is perfect as a ‘lake + match’ day trip: train in, walkable centre, simple logistics.",
        "Post-match: train platforms can be busy—check the next departures before kickoff.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Lakefront cities can be awkward for driving/parking. Train is usually smarter.",
      officialLots: ["If driving, use car parks outside the tight centre and walk/transit in."],
    },
    foodDrink: [
      { name: "Lakefront / central Como", type: "mixed", notes: "Best visitor area; strong pre/post atmosphere." },
      { name: "Milan (base city)", type: "mixed", notes: "If staying in Milan, do Como as a day trip." },
    ],
    stay: {
      bestAreas: [
        { area: "Central Como / lakefront", notes: "Best weekend vibe; walkable." },
      ],
      budgetAreas: [{ area: "Near Como San Giovanni", budgetFriendly: true, notes: "Often more practical and better value." }],
    },
    arrivalTips: [
      "If you’re returning to Milan the same night, don’t cut it tight — allow for station crowds.",
      "Bring comfortable shoes: Como matchdays are very walkable if you stay central.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Pisa                                                                        */
  /* -------------------------------------------------------------------------- */

  "pisa": {
    stadium: "Arena Garibaldi – Stadio Romeo Anconetani",
    city: "Pisa",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Pisa Centrale", type: "train", notes: "Main arrival hub; easy for day trips from Florence." },
        { name: "Pisa San Rossore", type: "train", notes: "Useful depending on route; closer to some stadium approaches." },
        { name: "City buses / walk routes", type: "bus", notes: "Pisa is compact; walking can be practical from central areas." },
      ],
      tips: [
        "Pisa is very walkable — base centrally and treat matchday as a short transit/walk.",
        "If day-tripping, check last return trains before kickoff.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but city traffic and limited central parking can slow you down.",
      officialLots: ["Use city car parks and walk the final stretch where possible."],
    },
    foodDrink: [
      { name: "Historic centre", type: "mixed", notes: "Best visitor base; easy pre/post." },
      { name: "Near Pisa Centrale", type: "mixed", notes: "Practical if you’re in/out by train." },
    ],
    stay: {
      bestAreas: [{ area: "Historic centre", notes: "Best base for a short break; walkable." }],
      budgetAreas: [{ area: "Near Pisa Centrale", budgetFriendly: true, notes: "Often better value and practical." }],
    },
    arrivalTips: [
      "If you’re connecting via Florence, keep return timing flexible.",
      "Arrive early if you want time to orient yourself and find your entrance.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Cremona                                                                     */
  /* -------------------------------------------------------------------------- */

  "cremonese": {
    stadium: "Stadio Giovanni Zini",
    city: "Cremona",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Cremona Station", type: "train", notes: "Main arrival hub; connect onward by walk/bus/taxi." },
        { name: "Local buses", type: "bus", notes: "Useful for the last leg depending on accommodation." },
        { name: "Milan (regional base) rail links", type: "train", notes: "If you’re staying in Milan, you may day-trip by train." },
      ],
      tips: [
        "Smaller-city matchdays can have fewer last-minute options — plan your return transport early.",
        "Base near the centre/station to keep it simple.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but local congestion still builds near kickoff.",
      officialLots: ["Arrive early if driving; otherwise train + short taxi/bus is easiest."],
    },
    foodDrink: [
      { name: "Cremona centre", type: "mixed", notes: "Best place for pre/post meal; then travel to stadium." },
      { name: "Near the station", type: "mixed", notes: "Practical for day trips." },
    ],
    stay: {
      bestAreas: [{ area: "City centre", notes: "Best base for overnight stays." }],
      budgetAreas: [{ area: "Near Cremona Station", budgetFriendly: true, notes: "Often practical and cheaper." }],
    },
    arrivalTips: [
      "Check return trains before kickoff — services can be less frequent late.",
      "Arrive early if you’re unfamiliar with the local walk/bus routes.",
    ],
  },
};

export default serieALogistics;
