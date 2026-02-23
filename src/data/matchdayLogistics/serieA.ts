// src/data/matchdayLogistics/serieA.ts
import type { MatchdayLogistics } from "./types";

/**
 * Serie A Matchday Logistics (20 teams — your list)
 *
 * Rules:
 * - Useful + conservative (no fake venue names / no specific pub names).
 * - Use stable transport anchors: main rail hubs + major metro/tram stops.
 * - Neutral traveller framing.
 *
 * Keys should match normalizeClubKey(homeTeamName).
 */

const serieALogistics: Record<string, MatchdayLogistics> = {
  "inter": {
    stadium: "San Siro (Stadio Giuseppe Meazza)",
    city: "Milan",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Milano Centrale", type: "train", notes: "Main arrival station for visitors; connect by Metro onward." },
        { name: "San Siro Stadio (Metro)", type: "metro", notes: "Closest matchday stop; queues are normal post-match." },
        { name: "Lotto (Metro)", type: "metro", notes: "Major interchange; good alternative for dispersal." },
      ],
      tips: [
        "Milan is easy: base central and use Metro for the final leg to San Siro.",
        "Post-match: consider walking 10–15 minutes away before entering the Metro to reduce queue time.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving near San Siro is rarely worth it due to congestion and controls.",
      officialLots: ["If you must drive: park outside the stadium zone and continue by Metro."],
    },
    foodDrink: [
      { name: "City centre (pre/post base)", type: "mixed", notes: "Best variety; then Metro out to the stadium." },
      { name: "Stadium district (practical)", type: "mixed", notes: "Convenient but crowded close to kickoff." },
    ],
    stay: {
      bestAreas: [
        { area: "Duomo / Centro", notes: "Best tourist base; easy Metro connectivity." },
        { area: "Porta Garibaldi / Isola", notes: "Great for food/bars; well connected." },
      ],
      budgetAreas: [{ area: "Near Milano Centrale", budgetFriendly: true, notes: "Often better value; extremely practical for arrivals." }],
    },
    arrivalTips: [
      "Arrive 60–90 minutes early if you want a calm entry and time to find your gate/section.",
      "Screenshot your ticket/QR before leaving your hotel (networks can be busy).",
    ],
  },

  "ac milan": {
    stadium: "San Siro (Stadio Giuseppe Meazza)",
    city: "Milan",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Milano Centrale", type: "train", notes: "Main arrival hub; Metro onward." },
        { name: "San Siro Stadio (Metro)", type: "metro", notes: "Closest; heavy crowding post-match is normal." },
        { name: "Lotto (Metro)", type: "metro", notes: "Good interchange and alternative exit route." },
      ],
      tips: [
        "Plan your return: immediate Metro queues are standard after full-time.",
        "If you’re heading to Centrale for trains, allow extra buffer post-match.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving near San Siro is high friction on matchdays. Prefer Metro.",
      officialLots: ["If driving, park out and take Metro for the last leg."],
    },
    foodDrink: [
      { name: "Navigli (pre/post)", type: "bar", notes: "Best nightlife vibe; go after, not right before kickoff." },
      { name: "Centro (Duomo area)", type: "mixed", notes: "Easy tourist base; quick Metro access." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro (Duomo)", notes: "Tourist-friendly and connected." },
        { area: "Porta Garibaldi / Isola", notes: "Great food + bars; solid transport." },
      ],
      budgetAreas: [{ area: "Centrale area", budgetFriendly: true, notes: "Practical for arrivals; choose carefully by exact street." }],
    },
    arrivalTips: [
      "If you’re doing a same-day return by train, don’t cut it tight after full-time.",
      "Arrive early if you want food before entering—queues build fast near kickoff.",
    ],
  },

  "as roma": {
    stadium: "Stadio Olimpico",
    city: "Rome",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Roma Termini", type: "train", notes: "Main arrival station for visitors; connect by metro/bus." },
        { name: "Ottaviano (Metro)", type: "metro", notes: "Useful Metro stop; last leg often bus/walk." },
        { name: "Flaminio / Piazza del Popolo area", type: "metro", notes: "Practical for tram/bus connections toward the stadium zone." },
      ],
      tips: [
        "Rome matchdays are about patience: use Metro + bus/tram, then walk with the crowd.",
        "Post-match traffic is heavy; avoid relying on taxis right outside the stadium.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving is not recommended; congestion and controls are common on event days.",
      officialLots: ["If you must drive, park well away and use public transport for the last leg."],
    },
    foodDrink: [
      { name: "Prati", type: "mixed", notes: "Good practical district near Vatican; easy pre/post." },
      { name: "Historic centre", type: "mixed", notes: "Best tourist base; just allow more travel time." },
    ],
    stay: {
      bestAreas: [
        { area: "Prati", notes: "Practical for Olimpico logistics and still tourist-friendly." },
        { area: "Centro Storico", notes: "Best sightseeing; accept longer transfers." },
      ],
      budgetAreas: [{ area: "Termini area", budgetFriendly: true, notes: "Convenient but choose accommodation carefully." }],
    },
    arrivalTips: [
      "Aim for 90 minutes pre-kickoff if it’s your first time—routes can feel confusing.",
      "Have your return plan locked before you go; last-mile options thin out fast post-match.",
    ],
  },

  "napoli": {
    stadium: "Stadio Diego Armando Maradona",
    city: "Naples",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Napoli Centrale", type: "train", notes: "Main arrival hub for visitors." },
        { name: "Campi Flegrei (rail)", type: "train", notes: "Common rail approach toward the stadium district." },
        { name: "Metro connections (city network)", type: "metro", notes: "Combine metro + local rail/bus depending on your base." },
      ],
      tips: [
        "Naples can feel chaotic—keep the route simple: central base → rail/metro → walk.",
        "Post-match: expect heavy crowding; build buffer time if you’re catching trains.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving is high-stress on matchdays; street patterns and congestion make it unreliable.",
      officialLots: ["Prefer public transport; if driving, park outside and use rail/metro in."],
    },
    foodDrink: [
      { name: "Chiaia", type: "mixed", notes: "Good for a nicer pre/post base and coastal vibe." },
      { name: "Centro Storico", type: "food", notes: "Best for classic Naples food; allow travel time to/from stadium." },
    ],
    stay: {
      bestAreas: [
        { area: "Chiaia", notes: "Great weekend base; safer/cleaner feel for many tourists." },
        { area: "Centro Storico", notes: "Best for sightseeing + food; can be intense/noisy." },
      ],
      budgetAreas: [{ area: "Near Napoli Centrale", budgetFriendly: true, notes: "Very practical for arrivals; pick carefully by exact location." }],
    },
    arrivalTips: [
      "Arrive early if you’re unfamiliar with Naples transport—last-leg decisions matter.",
      "If you’ve got luggage, store it first; don’t try to combine station chaos + match entry.",
    ],
  },

  "juventus": {
    stadium: "Allianz Stadium",
    city: "Turin",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Torino Porta Nuova", type: "train", notes: "Main rail hub; central base for visitors." },
        { name: "Torino Porta Susa", type: "train", notes: "Another major station; useful depending on arrival." },
        { name: "Tram/bus routes to stadium district", type: "tram", notes: "Last-leg typically tram/bus; allow time." },
      ],
      tips: [
        "Turin is a great weekend city: base central and use tram/bus out to the stadium.",
        "Post-match: the last leg back can be busy—waiting 10–15 minutes can help.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is more feasible than big city centres, but matchday congestion still applies.",
      officialLots: ["Use official/signed event parking if available; arrive early."],
    },
    foodDrink: [
      { name: "Centro (Porta Nuova area)", type: "mixed", notes: "Best for tourists; easy rail access." },
      { name: "Quadrilatero Romano", type: "mixed", notes: "Good bars/food; strong pre/post option." },
    ],
    stay: {
      bestAreas: [
        { area: "Centro / Porta Nuova", notes: "Best base for visitors and transport." },
        { area: "Quadrilatero / Centro Storico", notes: "Best vibe for evenings; walkable." },
      ],
      budgetAreas: [{ area: "Porta Susa area", budgetFriendly: true, notes: "Often good value and very connected." }],
    },
    arrivalTips: [
      "If you’re day-tripping from Milan, keep return trains flexible.",
      "Arrive early to avoid last-minute tram/bus crowding.",
    ],
  },

  "como": {
    stadium: "Stadio Giuseppe Sinigaglia",
    city: "Como",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Milano Centrale", type: "train", notes: "Common base; frequent trains to Como." },
        { name: "Como San Giovanni", type: "train", notes: "Main station for many visitors; walkable toward lakefront." },
        { name: "Como Lago / town centre", type: "walk", notes: "Como is compact; walking is often practical." },
      ],
      tips: [
        "Como is ideal as a day trip from Milan—just plan the return train after the match.",
        "If you’re staying lakeside, walking to/from the stadium area is usually straightforward.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Lake town streets can choke up; parking is limited and can be expensive.",
      officialLots: ["Use city car parks early and walk; avoid last-minute driving near kickoff."],
    },
    foodDrink: [
      { name: "Lakefront / town centre", type: "mixed", notes: "Best visitor option; easy before/after." },
      { name: "Milan (if basing there)", type: "mixed", notes: "Best variety for a full weekend." },
    ],
    stay: {
      bestAreas: [
        { area: "Como centre / lakefront", notes: "Best weekend base; walkable and scenic." },
        { area: "Milan (base)", notes: "If you want city break + day trip match." },
      ],
      budgetAreas: [{ area: "Near Como San Giovanni", budgetFriendly: true, notes: "Often more practical and better value." }],
    },
    arrivalTips: [
      "If you’re relying on trains, check late return options before kickoff.",
      "Allow buffer if you’re combining matchday with lake activities.",
    ],
  },

  "atalanta": {
    stadium: "Gewiss Stadium",
    city: "Bergamo",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Milano Centrale", type: "train", notes: "Common base; frequent trains to Bergamo." },
        { name: "Bergamo Station", type: "train", notes: "Main arrival; last leg typically bus/taxi/walk depending on base." },
        { name: "Città Alta / centre connections", type: "bus", notes: "Great tourist area; plan last-leg transport." },
      ],
      tips: [
        "Bergamo is perfect for a weekend: Città Alta + match is a strong combo.",
        "If you’re day-tripping from Milan, plan your return train early.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but stadium-area streets can tighten near kickoff.",
      officialLots: ["Use city parking and finish by bus/walk where practical."],
    },
    foodDrink: [
      { name: "Città Alta", type: "mixed", notes: "Best vibe for visitors; great pre/post." },
      { name: "Modern centre", type: "mixed", notes: "Practical for transport and hotels." },
    ],
    stay: {
      bestAreas: [
        { area: "Città Alta edge", notes: "Best weekend vibe; can be pricier." },
        { area: "Bergamo centre", notes: "More practical and often better value." },
      ],
      budgetAreas: [{ area: "Near Bergamo Station", budgetFriendly: true, notes: "Most practical for arrivals and day trips." }],
    },
    arrivalTips: [
      "If you’re arriving late, stay near the station and keep matchday simple.",
      "Build a buffer after full-time if you’re catching a train back to Milan.",
    ],
  },

  "sassuolo": {
    stadium: "MAPEI Stadium – Città del Tricolore",
    city: "Reggio Emilia",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Reggio Emilia (rail access)", type: "train", notes: "Use regional rail from larger hubs; check your exact stop." },
        { name: "Bologna Centrale", type: "train", notes: "Common visitor base and major hub." },
        { name: "Modena (base option)", type: "train", notes: "Nearby city; day trip possible with planning." },
      ],
      tips: [
        "Treat this as an Emilia-Romagna base trip (Bologna/Modena) then rail out for the match.",
        "Check return schedules before kickoff—late services can be less frequent.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than city-centre stadiums, but arrive early to avoid congestion.",
      officialLots: ["Use official/signed parking if offered; otherwise city parking + walk."],
    },
    foodDrink: [
      { name: "Bologna (base)", type: "mixed", notes: "Best choice for a full weekend." },
      { name: "Modena (base)", type: "food", notes: "Great food-focused base; simple day trip logistics." },
    ],
    stay: {
      bestAreas: [
        { area: "Bologna city centre", notes: "Best all-round base for visitors." },
        { area: "Modena centre", notes: "Excellent food city; good value." },
      ],
      budgetAreas: [{ area: "Near regional rail stops", budgetFriendly: true, notes: "Practical for late arrivals; confirm connectivity." }],
    },
    arrivalTips: [
      "If you’re day-tripping, confirm the return train times before you head out.",
      "Arrive early—smaller cities have less ‘forgiving’ transport frequency.",
    ],
  },

  "lazio": {
    stadium: "Stadio Olimpico",
    city: "Rome",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Roma Termini", type: "train", notes: "Main arrival hub; connect by metro/bus." },
        { name: "Ottaviano (Metro)", type: "metro", notes: "Useful Metro stop; last leg often bus/walk." },
        { name: "Flaminio area", type: "metro", notes: "Good for tram/bus approaches toward the stadium zone." },
      ],
      tips: [
        "Olimpico logistics are the same pattern: Metro → bus/tram → walk with the crowd.",
        "Avoid planning a tight taxi pickup immediately after full-time.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Event-day driving is unreliable; congestion and controls are typical.",
      officialLots: ["If driving, park far out and use public transport for the last leg."],
    },
    foodDrink: [
      { name: "Prati", type: "mixed", notes: "Practical district for visitors and easy matchday routing." },
      { name: "Centro Storico", type: "mixed", notes: "Best sightseeing base; longer transfers accepted." },
    ],
    stay: {
      bestAreas: [
        { area: "Prati", notes: "Best mix of practicality + visitor friendliness." },
        { area: "Centro Storico", notes: "Best for tourism; plan transport." },
      ],
      budgetAreas: [{ area: "Termini area", budgetFriendly: true, notes: "Convenient; choose carefully." }],
    },
    arrivalTips: [
      "Plan to arrive early; the last leg can feel slower than expected.",
      "Keep your return route simple and confirmed before you go.",
    ],
  },

  "bologna": {
    stadium: "Stadio Renato Dall'Ara",
    city: "Bologna",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Bologna Centrale", type: "train", notes: "Major hub; easiest base for visitors." },
        { name: "City centre (walk/bus)", type: "bus", notes: "From central Bologna, bus/walk routes are typical." },
        { name: "Porta Saragozza area", type: "train", notes: "Useful local access area depending on routing." },
      ],
      tips: [
        "Bologna is compact and tourist-friendly—stay central and bus/walk to the stadium.",
        "If you’re doing food-heavy weekend plans, Bologna is top-tier.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible, but matchday streets can tighten near kickoff.",
      officialLots: ["Use city car parks and finish by bus/walk."],
    },
    foodDrink: [
      { name: "Centro / Quadrilatero area", type: "food", notes: "Elite for food; best pre/post base." },
      { name: "University district", type: "bar", notes: "Livelier, cheaper options; matchday busy." },
    ],
    stay: {
      bestAreas: [{ area: "City centre", notes: "Best base for tourists + transport." }],
      budgetAreas: [{ area: "Near Bologna Centrale", budgetFriendly: true, notes: "Very practical; often better value." }],
    },
    arrivalTips: [
      "Arrive early if you want time for food before you head to the ground.",
      "If you’re catching a late train after the match, build a buffer for dispersal.",
    ],
  },

  "udinese": {
    stadium: "Bluenergy Stadium (Stadio Friuli)",
    city: "Udine",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Udine Station", type: "train", notes: "Main arrival for visitors; last leg by bus/taxi." },
        { name: "Venice (base option)", type: "train", notes: "Possible base; day trip requires planning." },
        { name: "Trieste (base option)", type: "train", notes: "Nearby city base; check schedules." },
      ],
      tips: [
        "This is a smaller-city matchday: plan the last leg (bus/taxi) in advance.",
        "If you’re day-tripping, confirm late return services before kickoff.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible; still arrive early to avoid local congestion.",
      officialLots: ["Use signed event parking or city parking + short taxi/bus."],
    },
    foodDrink: [
      { name: "Udine centre", type: "mixed", notes: "Best practical base for pre/post." },
      { name: "Venice (weekend base)", type: "mixed", notes: "Best tourist choice if you’re making a full weekend." },
    ],
    stay: {
      bestAreas: [{ area: "Udine centre", notes: "Simple and practical." }],
      budgetAreas: [{ area: "Near Udine station", budgetFriendly: true, notes: "Often best value and easiest for arrivals." }],
    },
    arrivalTips: [
      "Don’t assume walkability from station to stadium—plan bus/taxi.",
      "Keep your return plan locked if you’re not staying overnight.",
    ],
  },

  "parma": {
    stadium: "Stadio Ennio Tardini",
    city: "Parma",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Parma Station", type: "train", notes: "Main arrival for visitors; city is compact." },
        { name: "Bologna Centrale", type: "train", notes: "Major hub; good base option." },
        { name: "Milan (base option)", type: "train", notes: "Possible base; day trip feasible with planning." },
      ],
      tips: [
        "Parma is compact—staying central usually means easy walking logistics.",
        "If you’re day-tripping, check return schedules before kickoff.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but city-centre parking can still fill on matchdays.",
      officialLots: ["Use city car parks and walk the last part."],
    },
    foodDrink: [
      { name: "Parma centre", type: "food", notes: "Great for food; ideal pre/post." },
      { name: "Bologna (base)", type: "mixed", notes: "Best all-round base if you’re touring the region." },
    ],
    stay: {
      bestAreas: [{ area: "Parma centre", notes: "Best for walking + food." }],
      budgetAreas: [{ area: "Near Parma station", budgetFriendly: true, notes: "Often better value; practical for arrivals." }],
    },
    arrivalTips: [
      "If you’re combining match + dinner, book your dinner plans early on weekends.",
      "Arrive early to keep entry stress low.",
    ],
  },

  "cagliari": {
    stadium: "Unipol Domus",
    city: "Cagliari",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Cagliari (city centre)", type: "bus", notes: "Most visitors base here; last leg by bus/taxi." },
        { name: "Cagliari station area", type: "train", notes: "Practical anchor point for visitors." },
        { name: "Airport connections", type: "bus", notes: "If arriving same day, leave a big buffer." },
      ],
      tips: [
        "Treat as a coastal weekend: stay central and use bus/taxi to the stadium area.",
        "Post-match taxis can queue—walking to a calmer pickup point helps.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but matchday congestion still applies near the stadium.",
      officialLots: ["Use signed parking where available; arrive early."],
    },
    foodDrink: [
      { name: "Marina / city centre", type: "mixed", notes: "Best tourist base for pre/post." },
      { name: "Poetto beach area", type: "bar", notes: "Good weekend add-on; plan timing." },
    ],
    stay: {
      bestAreas: [{ area: "Cagliari centre / Marina", notes: "Best base for visitors." }],
      budgetAreas: [{ area: "Near central transport", budgetFriendly: true, notes: "Often better value; confirm late check-in." }],
    },
    arrivalTips: [
      "If you’re flying in, don’t cut the timing close—airports add uncertainty.",
      "Plan your last leg before you set off; options can thin late.",
    ],
  },

  "genoa": {
    stadium: "Stadio Luigi Ferraris",
    city: "Genoa",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Genova Piazza Principe", type: "train", notes: "Main arrival station for many visitors." },
        { name: "Genova Brignole", type: "train", notes: "Another major station; useful depending on your base." },
        { name: "City buses / walk", type: "bus", notes: "Last leg typically bus/walk from central areas." },
      ],
      tips: [
        "Genoa is dense and hilly—pick a central base and keep transport simple.",
        "Post-match: traffic can choke; prefer walking back toward major hubs before taxis.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Hills + narrow streets make matchday driving stressful. Public transport is easier.",
      officialLots: ["If driving, use city car parks and finish by bus/walk."],
    },
    foodDrink: [
      { name: "Old Port / Centro Storico edge", type: "mixed", notes: "Great for a weekend; plenty of options." },
      { name: "Near Brignole area", type: "mixed", notes: "Practical for transport connections." },
    ],
    stay: {
      bestAreas: [
        { area: "Old Port / central", notes: "Best for visitors; weekend vibe." },
        { area: "Near Brignole", notes: "Practical and connected." },
      ],
      budgetAreas: [{ area: "Near Piazza Principe", budgetFriendly: true, notes: "Often good value; practical for arrivals." }],
    },
    arrivalTips: [
      "Allow extra time for getting around—Genoa geography can slow you down.",
      "Arrive early if you want to navigate calmly and avoid last-minute hills/steps.",
    ],
  },

  "torino": {
    stadium: "Stadio Olimpico Grande Torino",
    city: "Turin",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Torino Porta Nuova", type: "train", notes: "Main visitor hub; easy city connections." },
        { name: "Torino Porta Susa", type: "train", notes: "Alternate major station; useful for some arrivals." },
        { name: "Tram/bus to stadium district", type: "tram", notes: "Common last leg; allow time near kickoff." },
      ],
      tips: [
        "Turin is easy to navigate—base central and use tram/bus to the stadium.",
        "Post-match: avoid trying to taxi immediately from the stadium perimeter.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than mega-cities, but traffic still builds around full-time.",
      officialLots: ["Use official/signed parking if offered; otherwise city parking + tram."],
    },
    foodDrink: [
      { name: "Centro / Porta Nuova area", type: "mixed", notes: "Best for visitors; lots of options." },
      { name: "Quadrilatero Romano", type: "mixed", notes: "Strong pre/post food and bars." },
    ],
    stay: {
      bestAreas: [{ area: "Centro / Porta Nuova", notes: "Best base for a weekend." }],
      budgetAreas: [{ area: "Porta Susa area", budgetFriendly: true, notes: "Often better value and very connected." }],
    },
    arrivalTips: [
      "If you’re combining with Juventus later in the trip, keep your base central and use public transport.",
      "Arrive early for stress-free entry and to find your section calmly.",
    ],
  },

  "fiorentina": {
    stadium: "Stadio Artemio Franchi",
    city: "Florence",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Firenze Santa Maria Novella", type: "train", notes: "Main arrival hub for visitors." },
        { name: "Campo di Marte (rail)", type: "train", notes: "Useful local station option depending on routing." },
        { name: "City buses / walk from centre", type: "bus", notes: "Often easiest last leg; Florence is walkable but allow time." },
      ],
      tips: [
        "Florence is extremely tourist-friendly—base central and plan a simple bus/walk last leg.",
        "Post-match: walking back toward the centre can be faster than waiting for taxis.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Florence driving/parking is painful (ZTL restrictions). Avoid unless you know exactly what you’re doing.",
      officialLots: ["If driving, park outside ZTL zones and use public transport/walk."],
    },
    foodDrink: [
      { name: "Historic centre (pre/post)", type: "mixed", notes: "Best tourist base; huge density of options." },
      { name: "Near Santa Croce / central districts", type: "mixed", notes: "Good for evening plans after the match." },
    ],
    stay: {
      bestAreas: [{ area: "Centro Storico", notes: "Best base for a weekend; walkable everywhere." }],
      budgetAreas: [{ area: "Near SMN station", budgetFriendly: true, notes: "Practical and often better value; check noise/area." }],
    },
    arrivalTips: [
      "Florence is busy year-round—book accommodation early for popular weekends.",
      "Plan your route so you don’t depend on taxis near ZTL-restricted streets.",
    ],
  },

  "cremonese": {
    stadium: "Stadio Giovanni Zini",
    city: "Cremona",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Cremona Station", type: "train", notes: "Main arrival point; check regional schedules carefully." },
        { name: "Milan (base option)", type: "train", notes: "Possible base; day trip requires planning." },
        { name: "Brescia (base option)", type: "train", notes: "Regional base option depending on routing." },
      ],
      tips: [
        "Smaller-city matchday: plan the last-leg walk/bus and the return train before kickoff.",
        "Avoid leaving return planning until after full-time—services can be less frequent.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but arrive early to avoid local congestion.",
      officialLots: ["Use city parking and walk the last part."],
    },
    foodDrink: [{ name: "Cremona centre", type: "mixed", notes: "Best practical pre/post option." }],
    stay: {
      bestAreas: [{ area: "Cremona centre", notes: "Simple and walkable." }],
      budgetAreas: [{ area: "Near Cremona station", budgetFriendly: true, notes: "Often best value and practical." }],
    },
    arrivalTips: [
      "If you’re day-tripping, confirm the return schedule before kickoff.",
      "Arrive early—regional logistics have less margin for error.",
    ],
  },

  "lecce": {
    stadium: "Stadio Via del Mare",
    city: "Lecce",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Lecce Station", type: "train", notes: "Main arrival; check regional schedules." },
        { name: "Bari (base option)", type: "train", notes: "Possible base; travel time needs planning." },
        { name: "City buses / taxi", type: "bus", notes: "Last leg varies; allow time near kickoff." },
      ],
      tips: [
        "Lecce is great for a weekend in Puglia—stay central and keep matchday transport simple.",
        "If you’re travelling far that day, buffer heavily—southern rail can be slower.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but local matchday congestion still builds.",
      officialLots: ["Use signed parking where available; arrive early."],
    },
    foodDrink: [
      { name: "Lecce old town", type: "mixed", notes: "Best pre/post vibe; excellent food options." },
      { name: "Coastal add-on towns", type: "mixed", notes: "Great weekend extension; plan transport times." },
    ],
    stay: {
      bestAreas: [{ area: "Centro Storico", notes: "Best for a weekend base." }],
      budgetAreas: [{ area: "Near Lecce station", budgetFriendly: true, notes: "Practical and often better value." }],
    },
    arrivalTips: [
      "If you’re combining match + coast, keep matchday itself simple and punctual.",
      "Arrive early if it’s your first time—last leg can feel less obvious than big cities.",
    ],
  },

  "pisa": {
    stadium: "Arena Garibaldi – Stadio Romeo Anconetani",
    city: "Pisa",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Pisa Centrale", type: "train", notes: "Main arrival hub; very walkable city." },
        { name: "Florence (base option)", type: "train", notes: "Easy base; short regional train trip." },
        { name: "Lucca (base option)", type: "train", notes: "Nearby base; day trip possible." },
      ],
      tips: [
        "Pisa is compact—walking from central areas is often practical.",
        "If you’re flying in/out, don’t cut timing close—airports add uncertainty.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible, but city-centre parking can fill and restrictions exist.",
      officialLots: ["Use city car parks and walk; avoid last-minute driving near kickoff."],
    },
    foodDrink: [
      { name: "Historic centre / river area", type: "mixed", notes: "Best visitor base for pre/post." },
      { name: "Florence (base)", type: "mixed", notes: "Best variety if you’re doing a bigger weekend." },
    ],
    stay: {
      bestAreas: [{ area: "Pisa centre", notes: "Best for walking and simplicity." }],
      budgetAreas: [{ area: "Near Pisa Centrale", budgetFriendly: true, notes: "Often best value and very practical." }],
    },
    arrivalTips: [
      "If you’re day-tripping from Florence, check late return trains before kickoff.",
      "Arrive early if you want a relaxed walk-in and time to find your entrance.",
    ],
  },

  "hellas verona": {
    stadium: "Stadio Marcantonio Bentegodi",
    city: "Verona",
    country: "Italy",
    transport: {
      primaryStops: [
        { name: "Verona Porta Nuova", type: "train", notes: "Main arrival station for visitors." },
        { name: "City buses / taxi", type: "bus", notes: "Typical last leg; Verona is compact but allow time." },
        { name: "Venice (base option)", type: "train", notes: "Easy weekend pairing; day trip feasible." },
      ],
      tips: [
        "Verona is a strong weekend city—stay central and use bus/taxi to the stadium.",
        "Post-match: walking toward Porta Nuova can be efficient if you have a train.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is feasible but don’t expect to park right by the stadium without planning.",
      officialLots: ["Use city parking and walk/bus the last part."],
    },
    foodDrink: [
      { name: "Centro Storico", type: "mixed", notes: "Best weekend vibe and food options." },
      { name: "Near Porta Nuova", type: "mixed", notes: "Practical if you’re travelling by train." },
    ],
    stay: {
      bestAreas: [{ area: "Historic centre", notes: "Best for a weekend base; walkable." }],
      budgetAreas: [{ area: "Near Porta Nuova", budgetFriendly: true, notes: "Often best value and extremely practical." }],
    },
    arrivalTips: [
      "If you’re doing Venice → Verona day trip, keep return trains flexible.",
      "Arrive early if you want to enjoy the city before the match.",
    ],
  },
};

export default serieALogistics;
