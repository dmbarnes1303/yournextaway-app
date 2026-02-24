// src/data/matchdayLogistics/premierLeague.ts
import type { MatchdayLogistics } from "./types";

/**
 * EPL Matchday Logistics (20 teams)
 *
 * Rules:
 * - Useful + conservative (no fake pub/restaurant names).
 * - Prefer stable transport guidance (key stations/lines/hubs).
 * - Keep it “neutral traveller” oriented.
 *
 * IMPORTANT:
 * Keys must match normalizeClubKey(homeTeamName) from src/data/ticketGuides.
 */

const premierLeagueLogistics: Record<string, MatchdayLogistics> = {
  /* -------------------------------------------------------------------------- */
  /* London                                                                      */
  /* -------------------------------------------------------------------------- */

  "arsenal": {
    stadium: "Emirates Stadium",
    city: "London",
    country: "England",
    stadiumLat: 51.5549,
    stadiumLng: -0.1084,
    transport: {
      primaryStops: [
        { name: "Arsenal (Tube)", type: "metro", notes: "Piccadilly line. Closest stop but can bottleneck after full-time." },
        { name: "Finsbury Park", type: "train", notes: "Best all-round hub (Victoria + Piccadilly + National Rail)." },
        { name: "Highbury & Islington", type: "train", notes: "Good alternative; usually smoother flow than Arsenal station." },
      ],
      tips: [
        "If you’re staying central, Finsbury Park is usually the most reliable in/out.",
        "Post-match: walking 10–15 minutes away from the stadium before entering the Tube often saves time.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving is usually a mistake. Controlled parking zones + residents + event restrictions.",
      officialLots: ["Prefer public transport or park further out and use Tube/National Rail in."],
    },
    foodDrink: [
      { name: "Finsbury Park area (practical pre/post)", type: "mixed", notes: "Convenient if you want something before heading in." },
      { name: "Upper Street / Islington", type: "food", notes: "Better food density; good option after the match." },
    ],
    stay: {
      bestAreas: [
        { area: "King’s Cross / St Pancras", notes: "Easy access to Finsbury Park; strong weekend base.", lat: 51.5308, lng: -0.1238 },
        { area: "Islington", notes: "Great food + vibe; quick to Highbury & Islington.", lat: 51.5380, lng: -0.1020 },
      ],
      budgetAreas: [
        { area: "Finsbury Park", budgetFriendly: true, notes: "Often cheaper than Zone 1; very connected.", lat: 51.5646, lng: -0.1059 },
      ],
    },
    arrivalTips: [
      "Aim to arrive 60–90 mins pre-kickoff for a stress-free entry.",
      "Have a return plan: queues are normal immediately after full-time.",
    ],
  },

  "chelsea": {
    stadium: "Stamford Bridge",
    city: "London",
    country: "England",
    stadiumLat: 51.4817,
    stadiumLng: -0.1910,
    transport: {
      primaryStops: [
        { name: "Fulham Broadway (Tube)", type: "metro", notes: "District line. Closest; queues are normal after the match." },
        { name: "West Brompton", type: "train", notes: "Often less chaotic; a smart alternative for dispersal." },
        { name: "Earl’s Court", type: "metro", notes: "Useful interchange if you’re moving across London." },
      ],
      tips: [
        "Post-match: consider walking to West Brompton rather than fighting Fulham Broadway queues.",
        "District line disruptions happen — leave buffer time.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "West London parking is painful on event days. Don’t rely on street parking.",
      officialLots: ["Use public transport or get dropped off away from the tight stadium streets."],
    },
    foodDrink: [
      { name: "Fulham Broadway area", type: "mixed", notes: "Convenient, busy, matchday-focused." },
      { name: "Fulham / Parsons Green", type: "food", notes: "Better sit-down options; short hop away." },
    ],
    stay: {
      bestAreas: [
        { area: "South Kensington", notes: "Good base; straightforward District line access.", lat: 51.4941, lng: -0.1749 },
        { area: "Paddington", notes: "Transport hub + lots of hotels.", lat: 51.5154, lng: -0.1756 },
      ],
      budgetAreas: [
        { area: "Hammersmith", budgetFriendly: true, notes: "Often better value; still very connected.", lat: 51.4927, lng: -0.2244 },
      ],
    },
    arrivalTips: [
      "If you’re doing dinner after, plan to walk a bit before calling a taxi to avoid gridlock.",
      "Allow extra time for security and turnstiles on big fixtures.",
    ],
  },

  "crystal-palace": {
    stadium: "Selhurst Park",
    city: "London",
    country: "England",
    stadiumLat: 51.3983,
    stadiumLng: -0.0856,
    transport: {
      primaryStops: [
        { name: "Norwood Junction", type: "train", notes: "Common hub for visitors; steady flow on matchdays." },
        { name: "Selhurst", type: "train", notes: "Close option; can be busy post-match." },
        { name: "Thornton Heath", type: "train", notes: "Another nearby station; choose based on route." },
      ],
      tips: [
        "Rail is the move. Choose the station that aligns with your onward route to avoid unnecessary transfers.",
        "Post-match: wait 10–15 minutes or walk to a different station to reduce queuing.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Residential restrictions + limited space make driving awkward.",
      officialLots: ["If driving, park further out near a suitable rail line and come in by train."],
    },
    foodDrink: [
      { name: "Around the nearby stations", type: "mixed", notes: "Practical pre/post options; expect crowds." },
      { name: "Central London (pre-game base)", type: "mixed", notes: "Often better variety; then take rail down." },
    ],
    stay: {
      bestAreas: [
        { area: "London Bridge / South Bank", notes: "Good rail access and a solid tourist base.", lat: 51.5055, lng: -0.0865 },
        { area: "Shoreditch / Liverpool Street", notes: "Good weekend vibe; rail options to South London.", lat: 51.5246, lng: -0.0786 },
      ],
      budgetAreas: [
        { area: "Croydon", budgetFriendly: true, notes: "Often cheaper; easy rail access to Selhurst/Norwood Junction.", lat: 51.3721, lng: -0.0962 },
      ],
    },
    arrivalTips: [
      "If you’re unfamiliar with South London rail, screenshot your route in case signal is busy post-match.",
      "Arrive early if you want to find your bearings—streets can feel tight near kickoff.",
    ],
  },

  "fulham": {
    stadium: "Craven Cottage",
    city: "London",
    country: "England",
    stadiumLat: 51.4749,
    stadiumLng: -0.2216,
    transport: {
      primaryStops: [
        { name: "Putney Bridge (Tube)", type: "metro", notes: "District line. Popular route; short walk." },
        { name: "Hammersmith (Tube)", type: "metro", notes: "Major interchange; useful fallback if Putney Bridge is packed." },
        { name: "Putney (Rail)", type: "train", notes: "Good option depending on where you’re staying." },
      ],
      tips: [
        "Allow time for the walk from the Tube/rail — it’s part of the Craven Cottage routine.",
        "Post-match: Putney Bridge can bottleneck; consider walking a bit further before entering.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Riverside residential streets + event controls make parking unreliable.",
      officialLots: ["Prefer public transport; if driving, park at a Tube/rail hub further out and ride in."],
    },
    foodDrink: [
      { name: "Putney Bridge / Fulham Palace Road area", type: "mixed", notes: "Convenient and busy on matchdays." },
      { name: "Hammersmith", type: "mixed", notes: "More options; strong transport links." },
    ],
    stay: {
      bestAreas: [
        { area: "Hammersmith", notes: "Great connectivity + practical base.", lat: 51.4927, lng: -0.2244 },
        { area: "South Kensington", notes: "Tourist base with easy District line access.", lat: 51.4941, lng: -0.1749 },
      ],
      budgetAreas: [
        { area: "Earl’s Court", budgetFriendly: true, notes: "Often better value for West London; good Tube access.", lat: 51.4915, lng: -0.1930 },
      ],
    },
    arrivalTips: [
      "If you’re doing the river walk, factor it into your arrival time.",
      "Traffic is slow near kickoff—avoid taxis for the final stretch where possible.",
    ],
  },

  "tottenham-hotspur": {
    stadium: "Tottenham Hotspur Stadium",
    city: "London",
    country: "England",
    stadiumLat: 51.6043,
    stadiumLng: -0.0665,
    transport: {
      primaryStops: [
        { name: "White Hart Lane", type: "train", notes: "Closest rail stop; controlled flow post-match." },
        { name: "Northumberland Park", type: "train", notes: "Good alternative for dispersal; often recommended." },
        { name: "Tottenham Hale", type: "metro", notes: "Victoria line hub; strong route back into central London." },
      ],
      tips: [
        "Tottenham Hale is usually the cleanest route for tourists heading back to central London.",
        "Post-match queues are normal; pick the station based on where you’re going next.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "North London matchday driving is rough. Avoid unless you have pre-booked parking.",
      officialLots: ["If driving: park further out on a Victoria line/Overground-friendly area and rail in."],
    },
    foodDrink: [
      { name: "Tottenham Hale (practical pre/post)", type: "food", notes: "Good stop if arriving via Victoria line." },
      { name: "Around the stadium approach routes", type: "mixed", notes: "Atmosphere is strong; queues expected." },
    ],
    stay: {
      bestAreas: [
        { area: "King’s Cross / St Pancras", notes: "Strong base + easy routes to North London.", lat: 51.5308, lng: -0.1238 },
        { area: "Liverpool Street / Shoreditch", notes: "Great weekend vibe; workable routes to Tottenham area.", lat: 51.5176, lng: -0.0820 },
      ],
      budgetAreas: [
        { area: "Tottenham Hale", budgetFriendly: true, notes: "Often cheaper than Zone 1 and very connected.", lat: 51.5886, lng: -0.0595 },
      ],
    },
    arrivalTips: [
      "Have a station plan in advance: White Hart Lane vs Northumberland Park vs Tottenham Hale.",
      "Arrive early if you want time for food/drink and a relaxed entry.",
    ],
  },

  "west-ham-united": {
    stadium: "London Stadium",
    city: "London",
    country: "England",
    stadiumLat: 51.5386,
    stadiumLng: -0.0165,
    transport: {
      primaryStops: [
        { name: "Stratford", type: "train", notes: "Major hub (Tube + Elizabeth line + National Rail). Best for visitors." },
        { name: "Stratford International", type: "train", notes: "Useful depending on your route; near the park." },
        { name: "Pudding Mill Lane (DLR)", type: "tram", notes: "Smart fallback if Stratford is chaotic." },
      ],
      tips: [
        "Stratford is the obvious choice but can bottleneck. Pudding Mill Lane is the underrated exit.",
        "If you’re central: Elizabeth line to Stratford is typically the quickest route.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Do not plan to park near the stadium. Use rail.",
      officialLots: ["If you must drive: park further out on a rail line and come in via Stratford."],
    },
    foodDrink: [
      { name: "Stratford / Westfield", type: "food", notes: "Reliable, practical pre-game option." },
      { name: "Hackney Wick (canalside)", type: "bar", notes: "Good vibe; short walk along canals." },
    ],
    stay: {
      bestAreas: [
        { area: "Liverpool Street / Shoreditch", notes: "Fast to Stratford; solid weekend base.", lat: 51.5176, lng: -0.0820 },
        { area: "Canary Wharf", notes: "Modern base; easy DLR links.", lat: 51.5054, lng: -0.0235 },
      ],
      budgetAreas: [
        { area: "Stratford", budgetFriendly: true, notes: "Often best value due to hotel stock.", lat: 51.5413, lng: -0.0036 },
      ],
    },
    arrivalTips: [
      "Plan your post-match exit: wait 10–15 minutes or walk to a less-busy station/DLR stop.",
      "This is one of the easiest London matchdays for tourists because of Stratford connectivity.",
    ],
  },

  "brentford": {
    stadium: "Gtech Community Stadium",
    city: "London",
    country: "England",
    stadiumLat: 51.4907,
    stadiumLng: -0.2887,
    transport: {
      primaryStops: [
        { name: "Kew Bridge (Rail)", type: "train", notes: "Closest rail stop; can be very busy post-match." },
        { name: "Gunnersbury (Tube/Overground)", type: "metro", notes: "District line + Overground; strong alternative route." },
        { name: "Chiswick / Brentford area buses", type: "bus", notes: "Useful for local movement; allow extra time." },
      ],
      tips: [
        "If Kew Bridge is jammed, Gunnersbury can be a smarter exit route.",
        "West London traffic is slow near kickoff—public transport is safer.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Tight urban parking. Driving is risky without a pre-booked plan.",
      officialLots: ["Prefer rail/Tube; if driving, park further out and use public transport in."],
    },
    foodDrink: [
      { name: "Chiswick High Road", type: "mixed", notes: "Good density of options; short hop away." },
      { name: "Around Gunnersbury / Kew Bridge", type: "mixed", notes: "Practical but busy on matchday." },
    ],
    stay: {
      bestAreas: [
        { area: "Hammersmith", notes: "Connected and practical for West London matches.", lat: 51.4927, lng: -0.2244 },
        { area: "Paddington", notes: "Good hotel supply + easy transport.", lat: 51.5154, lng: -0.1756 },
      ],
      budgetAreas: [
        { area: "Ealing", budgetFriendly: true, notes: "Often better value; good transport links into West London.", lat: 51.5136, lng: -0.3040 },
      ],
    },
    arrivalTips: [
      "Arrive early if you want to avoid crowding on the footbridges and station approaches.",
      "Have a fallback station in mind for the return.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* North West                                                                  */
  /* -------------------------------------------------------------------------- */

  "liverpool": {
    stadium: "Anfield",
    city: "Liverpool",
    country: "England",
    stadiumLat: 53.4308,
    stadiumLng: -2.9608,
    transport: {
      primaryStops: [
        { name: "Liverpool Lime Street", type: "train", notes: "Main arrival station for most visitors." },
        { name: "Moorfields", type: "train", notes: "Useful city-centre stop; good for dispersal." },
        { name: "Matchday buses from city centre", type: "bus", notes: "Typically easiest option; follow signage/queues on the day." },
      ],
      tips: [
        "Anfield isn’t next to a major rail stop — most visitors use buses/taxis from the centre.",
        "Post-match: walking partway back toward the centre can beat the taxi queue.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible but streets fill early on bigger games. You need a plan.",
      officialLots: ["Pre-booked parking is the only sane approach if you must drive."],
    },
    foodDrink: [
      { name: "Liverpool city centre (pre-game)", type: "mixed", notes: "Best variety; then bus/taxi out." },
      { name: "Around Anfield approaches", type: "pub", notes: "Strong atmosphere; queues expected." },
    ],
    stay: {
      bestAreas: [
        { area: "Liverpool city centre", notes: "Best for a weekend: walkable + nightlife.", lat: 53.4084, lng: -2.9916 },
        { area: "Baltic Triangle", notes: "Trendy base; strong food/bar options.", lat: 53.3958, lng: -2.9785 },
      ],
      budgetAreas: [{ area: "Edge Hill", budgetFriendly: true, notes: "Can be cheaper; check exact location and rail links.", lat: 53.4090, lng: -2.9370 }],
    },
    arrivalTips: [
      "If you’re arriving from Manchester by train, keep return times flexible — dispersal can be slow.",
      "Arrive early if you want a no-stress entry and time to soak up atmosphere.",
    ],
  },

  "manchester-city": {
    stadium: "Etihad Stadium",
    city: "Manchester",
    country: "England",
    stadiumLat: 53.4831,
    stadiumLng: -2.2004,
    transport: {
      primaryStops: [
        { name: "Manchester Piccadilly", type: "train", notes: "Main arrival hub for visitors." },
        { name: "Etihad Campus (Metrolink)", type: "tram", notes: "Direct matchday option; can be crowded post-match." },
        { name: "Piccadilly Gardens (Metrolink hub)", type: "tram", notes: "Useful city-centre interchange." },
      ],
      tips: [
        "Tram is the cleanest route, but platforms can be controlled/queued after full-time.",
        "If you’re able, walking part-way back toward the centre can be quicker than queueing immediately.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than London, but still fills early on big fixtures.",
      officialLots: ["Use official event parking where possible; otherwise park out and tram in."],
    },
    foodDrink: [
      { name: "Northern Quarter", type: "mixed", notes: "Best visitor area for food/drink pre-game; then tram out." },
      { name: "City centre near Piccadilly", type: "mixed", notes: "Convenient if arriving by train." },
    ],
    stay: {
      bestAreas: [
        { area: "Manchester city centre", notes: "Best base for weekend trips.", lat: 53.4808, lng: -2.2426 },
        { area: "Northern Quarter", notes: "Food/nightlife heavy; walkable.", lat: 53.4840, lng: -2.2350 },
      ],
      budgetAreas: [{ area: "Salford / near Victoria", budgetFriendly: true, notes: "Sometimes better value; still close.", lat: 53.4862, lng: -2.2496 }],
    },
    arrivalTips: [
      "If connecting back to London by train, leave buffer time after full-time.",
      "If kickoff is TBC, avoid tight same-day travel connections.",
    ],
  },

  "manchester-united": {
    stadium: "Old Trafford",
    city: "Manchester",
    country: "England",
    stadiumLat: 53.4631,
    stadiumLng: -2.2913,
    transport: {
      primaryStops: [
        { name: "Manchester Piccadilly", type: "train", notes: "Main arrival hub for tourists." },
        { name: "Deansgate / Castlefield", type: "train", notes: "Useful connector area for tram/Metrolink routes." },
        { name: "Metrolink (Old Trafford area)", type: "tram", notes: "Standard route; follow matchday flow." },
      ],
      tips: [
        "Expect crowd management post-match — normal around Old Trafford.",
        "For a smoother exit: hang back 15–20 minutes or walk partway toward Deansgate before boarding.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but roads choke. Pre-booked parking helps a lot.",
      officialLots: ["Use official parking where available; otherwise park out and tram in."],
    },
    foodDrink: [
      { name: "Spinningfields / Deansgate (pre-game)", type: "mixed", notes: "Better variety than right next to the stadium." },
      { name: "Trafford area (post-match practical)", type: "mixed", notes: "Expect crowds; plan a little extra time." },
    ],
    stay: {
      bestAreas: [
        { area: "Manchester city centre", notes: "Best weekend base.", lat: 53.4808, lng: -2.2426 },
        { area: "Deansgate", notes: "Convenient for transport + nightlife.", lat: 53.4766, lng: -2.2514 },
      ],
      budgetAreas: [{ area: "Near Piccadilly", budgetFriendly: true, notes: "Often better value than premium central spots.", lat: 53.4774, lng: -2.2313 }],
    },
    arrivalTips: [
      "If you’re doing a same-day return, plan for slower dispersal than you expect.",
      "Screenshot tickets/booking confirmations in case mobile signal is overloaded.",
    ],
  },

  "everton": {
    stadium: "Hill Dickinson Stadium (Bramley-Moore Dock)",
    city: "Liverpool",
    country: "England",
    stadiumLat: 53.4099,
    stadiumLng: -2.9977,
    transport: {
      primaryStops: [
        { name: "Liverpool Lime Street", type: "train", notes: "Main arrival hub for most visitors." },
        { name: "City centre connections", type: "bus", notes: "Matchday routing can vary; follow official/event signage on the day." },
        { name: "Moorfields", type: "train", notes: "Useful for city-centre dispersal and onward planning." },
      ],
      tips: [
        "As a visitor, treat Liverpool city centre as your base and connect from there.",
        "Post-match: allow extra time for crowd dispersal around the dock area.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible with planning, but expect event traffic. Pre-book where you can.",
      officialLots: ["Prefer official/pre-booked event parking or city-centre car parks + onward travel."],
    },
    foodDrink: [
      { name: "Liverpool city centre (pre/post)", type: "mixed", notes: "Best variety and easiest for tourists." },
      { name: "Dock/Waterfront area (if staying nearby)", type: "mixed", notes: "Practical option; crowds expected on matchdays." },
    ],
    stay: {
      bestAreas: [
        { area: "Liverpool city centre", notes: "Safest bet for logistics + nightlife.", lat: 53.4084, lng: -2.9916 },
        { area: "Waterfront / docks", notes: "Good weekend feel; check walking/transit practicality.", lat: 53.4046, lng: -2.9950 },
      ],
      budgetAreas: [{ area: "Edge Hill area", budgetFriendly: true, notes: "Often cheaper; ensure transport links fit your plan.", lat: 53.4090, lng: -2.9370 }],
    },
    arrivalTips: [
      "If kickoff timing is uncertain, book flexible transport and avoid tight return connections.",
      "Arrive early if you want to explore the waterfront area without rushing.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* North East                                                                  */
  /* -------------------------------------------------------------------------- */

  "newcastle-united": {
    stadium: "St James’ Park",
    city: "Newcastle",
    country: "England",
    stadiumLat: 54.9756,
    stadiumLng: -1.6217,
    transport: {
      primaryStops: [
        { name: "Newcastle Central Station", type: "train", notes: "Main arrival hub; walkable to the stadium." },
        { name: "St James (Metro)", type: "metro", notes: "Closest Metro stop; very convenient." },
        { name: "Monument (Metro)", type: "metro", notes: "Central stop; great for food/drink + short walk." },
      ],
      tips: [
        "Newcastle is ideal for visitors: compact city + walkable stadium.",
        "Base yourself central and you can do matchday without taxis at all.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible using city-centre car parks, but matchday traffic can slow you down.",
      officialLots: ["Use city-centre car parks and walk/Metro. Don’t aim to park right next to the ground."],
    },
    foodDrink: [
      { name: "City centre (near Monument)", type: "mixed", notes: "Easiest pre-game hub with lots of choice." },
      { name: "Quayside (post-match)", type: "food", notes: "Better sit-down options; great for a weekend vibe." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Perfect base: walkable + nightlife.", lat: 54.9783, lng: -1.6178 },
        { area: "Quayside", notes: "Good weekend feel + restaurants.", lat: 54.9706, lng: -1.6037 },
      ],
      budgetAreas: [{ area: "Near Central Station", budgetFriendly: true, notes: "Often best value for visitors.", lat: 54.9680, lng: -1.6175 }],
    },
    arrivalTips: [
      "If you want a drink after full-time, book return trains with buffer.",
      "This is one of the easiest ‘football + city break’ combinations in England.",
    ],
  },

  "sunderland": {
    stadium: "Stadium of Light",
    city: "Sunderland",
    country: "England",
    stadiumLat: 54.9144,
    stadiumLng: -1.3883,
    transport: {
      primaryStops: [
        { name: "Sunderland (Rail/Metro)", type: "train", notes: "Key arrival point; connect onward locally." },
        { name: "Stadium of Light (Metro)", type: "metro", notes: "Very convenient stop on matchdays." },
        { name: "Newcastle Central Station", type: "train", notes: "Common tourist base; connect via Metro/rail." },
      ],
      tips: [
        "If you’re visiting, consider staying in Newcastle and day-tripping to the match.",
        "Metro is usually the simplest way to handle matchday crowds.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than major cities, but traffic still builds near kickoff.",
      officialLots: ["If driving, plan arrival early and use signed event parking where available."],
    },
    foodDrink: [
      { name: "Newcastle city centre (pre/post base)", type: "mixed", notes: "Best variety for visitors if you’re staying up the road." },
      { name: "Sunderland city centre", type: "mixed", notes: "Practical option; keep timings flexible." },
    ],
    stay: {
      bestAreas: [
        { area: "Newcastle city centre", notes: "Best tourist base; easy connection to Sunderland.", lat: 54.9783, lng: -1.6178 },
        { area: "Sunderland centre", notes: "Works if you want a quieter base; check exact location.", lat: 54.9069, lng: -1.3838 },
      ],
      budgetAreas: [{ area: "Near Sunderland station", budgetFriendly: true, notes: "Often better value; good connectivity.", lat: 54.9060, lng: -1.3822 }],
    },
    arrivalTips: [
      "Have a clear plan for the return Metro/rail — queues can be heavy but move steadily.",
      "Arrive early if you want to explore the riverside area without rushing.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Midlands / Yorkshire                                                       */
  /* -------------------------------------------------------------------------- */

  "aston-villa": {
    stadium: "Villa Park",
    city: "Birmingham",
    country: "England",
    stadiumLat: 52.5090,
    stadiumLng: -1.8853,
    transport: {
      primaryStops: [
        { name: "Birmingham New Street", type: "train", notes: "Main arrival hub; connect onward by local rail." },
        { name: "Witton (Train)", type: "train", notes: "Common matchday station for Villa Park." },
        { name: "Aston (Train)", type: "train", notes: "Alternative nearby station; routes vary by day." },
      ],
      tips: [
        "Use rail for the final stretch where possible — driving near kickoff is slower than it looks.",
        "If you’re coming from London/Manchester, New Street makes logistics easy.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More doable than London, but plan ahead on big fixtures.",
      officialLots: ["Use official/pre-booked parking if possible; otherwise park near a rail stop and go in."],
    },
    foodDrink: [
      { name: "Birmingham city centre", type: "mixed", notes: "Best visitor base for food/drink pre-game." },
      { name: "Jewellery Quarter", type: "mixed", notes: "Good for nicer pre/post match options." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre / near New Street", notes: "Best tourist base; easiest logistics.", lat: 52.4777, lng: -1.8986 },
        { area: "Jewellery Quarter", notes: "Great vibe + food; short hop to centre.", lat: 52.4896, lng: -1.9127 },
      ],
      budgetAreas: [{ area: "Digbeth edge", budgetFriendly: true, notes: "Often better value; check property surroundings carefully.", lat: 52.4721, lng: -1.8852 }],
    },
    arrivalTips: [
      "If you’re doing a weekend: Birmingham often has strong value hotels and easy rail links.",
      "Allow extra time if you’re unfamiliar with local rail stations around the ground.",
    ],
  },

  "leeds-united": {
    stadium: "Elland Road",
    city: "Leeds",
    country: "England",
    stadiumLat: 53.7778,
    stadiumLng: -1.5721,
    transport: {
      primaryStops: [
        { name: "Leeds Station", type: "train", notes: "Main arrival hub for visitors." },
        { name: "City centre matchday buses", type: "bus", notes: "Common way to reach Elland Road; follow signage/queues." },
        { name: "Taxi/rideshare from centre", type: "other", notes: "Works if timed early; heavy traffic near kickoff." },
      ],
      tips: [
        "If you’re visiting, base yourself in the city centre and travel to the ground from there.",
        "Post-match: buses and taxis queue hard — consider waiting 15 minutes or walking away from the stadium district first.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but congestion is real. Plan early arrival if you must drive.",
      officialLots: ["Use official/pre-booked parking where available; avoid last-minute street searching."],
    },
    foodDrink: [
      { name: "Leeds city centre", type: "mixed", notes: "Best variety and easiest for tourists." },
      { name: "Areas near the ground (practical)", type: "mixed", notes: "Expect crowds; keep timing flexible." },
    ],
    stay: {
      bestAreas: [
        { area: "Leeds city centre", notes: "Best base for visitors; walkable + nightlife.", lat: 53.8008, lng: -1.5491 },
        { area: "Near the station", notes: "Most convenient for day trips and returns.", lat: 53.7940, lng: -1.5471 },
      ],
      budgetAreas: [{ area: "South/West Leeds edge", budgetFriendly: true, notes: "Can be cheaper; check transit practicality and area.", lat: 53.7760, lng: -1.5850 }],
    },
    arrivalTips: [
      "If you’re returning by train same day, don’t cut it tight — dispersal can be slow.",
      "Have a plan for transport back into the centre; it’s often the hardest part.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* South Coast                                                                 */
  /* -------------------------------------------------------------------------- */

  "afc-bournemouth": {
    stadium: "Vitality Stadium",
    city: "Bournemouth",
    country: "England",
    stadiumLat: 50.7353,
    stadiumLng: -1.8383,
    transport: {
      primaryStops: [
        { name: "Bournemouth Station", type: "train", notes: "Main arrival point for most visitors." },
        { name: "Town centre connections", type: "bus", notes: "Local buses/taxis typically used for the last leg." },
        { name: "Coach / intercity bus arrivals", type: "bus", notes: "If you’re coming from London, coaches can be cost-effective." },
      ],
      tips: [
        "Base yourself around the town centre for the easiest logistics.",
        "Post-match: taxis can be slow—walking a bit away from the ground helps pickup.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible, but space is limited and traffic builds close to kickoff.",
      officialLots: ["If driving, arrive early and use official/pre-booked options where available."],
    },
    foodDrink: [
      { name: "Bournemouth town centre", type: "mixed", notes: "Best variety; easy before/after." },
      { name: "Near the stadium (practical)", type: "mixed", notes: "Limited choice; expect crowds." },
    ],
    stay: {
      bestAreas: [
        { area: "Town centre / seafront", notes: "Best for a weekend; walkable and tourist-friendly.", lat: 50.7192, lng: -1.8808 },
      ],
      budgetAreas: [{ area: "Near the station", budgetFriendly: true, notes: "Often better value; practical for arrivals/returns.", lat: 50.7277, lng: -1.8642 }],
    },
    arrivalTips: [
      "If you’re day-tripping, keep return travel flexible — queues can add time.",
      "Arrive early if you want a relaxed pre-game in town.",
    ],
  },

  "brighton": {
    stadium: "American Express Stadium",
    city: "Brighton",
    country: "England",
    stadiumLat: 50.8619,
    stadiumLng: -0.0837,
    transport: {
      primaryStops: [
        { name: "Brighton Station", type: "train", notes: "Most visitors arrive here." },
        { name: "Falmer (Train)", type: "train", notes: "Key matchday stop for the stadium; follow signage." },
        { name: "London Victoria / London Bridge routes", type: "train", notes: "Common visitor route from London." },
      ],
      tips: [
        "If you’re staying in Brighton, train to Falmer is the standard move.",
        "If you’re day-tripping from London: expect busy return trains post-match.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible but often slower than rail. Train is usually smarter.",
      officialLots: ["If driving: use official/pre-book parking where offered; otherwise plan remote parking + rail."],
    },
    foodDrink: [
      { name: "The Lanes", type: "food", notes: "Strong food density; easy before heading out." },
      { name: "Seafront area", type: "bar", notes: "Tourist-friendly pre/post vibe." },
    ],
    stay: {
      bestAreas: [
        { area: "Seafront", notes: "Best tourist base + vibe.", lat: 50.8198, lng: -0.1367 },
        { area: "The Lanes", notes: "Best for food + walking.", lat: 50.8218, lng: -0.1412 },
      ],
      budgetAreas: [{ area: "Preston Park / Hove edge", budgetFriendly: true, notes: "Often better value; still accessible.", lat: 50.8367, lng: -0.1495 }],
    },
    arrivalTips: [
      "Brighton is a great weekend combo: match + beach/town.",
      "If kickoff is early/late, plan your London return to avoid last-train panic.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Midlands / West                                                             */
  /* -------------------------------------------------------------------------- */

  "wolverhampton-wanderers": {
    stadium: "Molineux Stadium",
    city: "Wolverhampton",
    country: "England",
    stadiumLat: 52.5903,
    stadiumLng: -2.1304,
    transport: {
      primaryStops: [
        { name: "Wolverhampton Station", type: "train", notes: "Main arrival point; walkable to the stadium." },
        { name: "Birmingham New Street", type: "train", notes: "Major hub for visitors; quick onward rail." },
        { name: "City centre walk routes", type: "walk", notes: "If you’re near the centre, walking is often easiest." },
      ],
      tips: [
        "Wolves is visitor-friendly: station-to-stadium is manageable on foot.",
        "If you’re day-tripping, keep a little buffer for post-match station crowds.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible; still expect event congestion near kickoff.",
      officialLots: ["Use official/pre-booked parking where available; otherwise use city-centre car parks and walk."],
    },
    foodDrink: [
      { name: "Wolverhampton city centre", type: "mixed", notes: "Practical pre/post option; easy logistics." },
      { name: "Birmingham (weekend base)", type: "mixed", notes: "If you’re staying in Birmingham, do the match as a day trip." },
    ],
    stay: {
      bestAreas: [
        { area: "Wolverhampton city centre", notes: "Practical base; easy walk/rail.", lat: 52.5862, lng: -2.1287 },
        { area: "Birmingham city centre", notes: "Bigger weekend base; easy rail connection.", lat: 52.4777, lng: -1.8986 },
      ],
      budgetAreas: [{ area: "Near Wolverhampton Station", budgetFriendly: true, notes: "Often good value; most practical for visitors.", lat: 52.5872, lng: -2.1192 }],
    },
    arrivalTips: [
      "Walking from the station can be the fastest option versus waiting for taxis.",
      "Arrive early if you want a relaxed pre-game meal in the centre.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Nottingham / Midlands                                                       */
  /* -------------------------------------------------------------------------- */

  "nottingham-forest": {
    stadium: "The City Ground",
    city: "Nottingham",
    country: "England",
    stadiumLat: 52.9399,
    stadiumLng: -1.1322,
    transport: {
      primaryStops: [
        { name: "Nottingham Station", type: "train", notes: "Main arrival hub for visitors." },
        { name: "City centre tram network", type: "tram", notes: "Useful for moving around Nottingham; route planning depends on where you stay." },
        { name: "Riverside walk routes", type: "walk", notes: "Depending on your base, walking can be a practical option." },
      ],
      tips: [
        "Base yourself in the city centre and travel from there — it keeps everything simple.",
        "Post-match: expect pinch points; walking away from the immediate stadium area helps.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible, but matchday traffic builds. City-centre parking + onward movement is often easier.",
      officialLots: ["Use city-centre car parks and continue by tram/walk where practical."],
    },
    foodDrink: [
      { name: "Nottingham city centre", type: "mixed", notes: "Best visitor choice for variety and ease." },
      { name: "West Bridgford area", type: "mixed", notes: "Popular local area; can be busy on matchday." },
    ],
    stay: {
      bestAreas: [
        { area: "Nottingham city centre", notes: "Best base for tourists; easy rail access.", lat: 52.9548, lng: -1.1581 },
      ],
      budgetAreas: [{ area: "Near Nottingham Station", budgetFriendly: true, notes: "Often decent value and practical for returns.", lat: 52.9470, lng: -1.1467 }],
    },
    arrivalTips: [
      "If you’re day-tripping, plan a little buffer to get back to the station after full-time.",
      "If you’re new to the city, keep your route simple: station → centre → match.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* Lancashire / North West                                                     */
  /* -------------------------------------------------------------------------- */

  "burnley": {
    stadium: "Turf Moor",
    city: "Burnley",
    country: "England",
    stadiumLat: 53.7890,
    stadiumLng: -2.2302,
    transport: {
      primaryStops: [
        { name: "Burnley Manchester Road", type: "train", notes: "Useful rail stop depending on your route; check schedules." },
        { name: "Burnley Central", type: "train", notes: "Another option; choose based on your arrival direction." },
        { name: "Manchester (rail hub)", type: "train", notes: "Common base city for visitors; connect onward by train." },
      ],
      tips: [
        "Many visitors base in Manchester and do the match as a rail day trip.",
        "Check return train timings before kickoff so you’re not trapped after full-time.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than big cities, but local congestion builds near kickoff.",
      officialLots: ["Arrive early if driving; consider town parking and walking the last part."],
    },
    foodDrink: [
      { name: "Manchester (pre/post base)", type: "mixed", notes: "Best variety if you’re using it as a weekend base." },
      { name: "Burnley town centre", type: "mixed", notes: "Practical option; timing can be tight on day trips." },
    ],
    stay: {
      bestAreas: [
        { area: "Manchester city centre", notes: "Best weekend base; easy onward rail.", lat: 53.4808, lng: -2.2426 },
        { area: "Burnley town area", notes: "Works if you want a quieter overnight; check exact property location.", lat: 53.7896, lng: -2.2446 },
      ],
      budgetAreas: [{ area: "Near Burnley rail stops", budgetFriendly: true, notes: "Often cheaper; useful for day trips.", lat: 53.7920, lng: -2.2480 }],
    },
    arrivalTips: [
      "If travelling by train, keep your return flexible and expect busy services post-match.",
      "Arrive early if you want to orient yourself; smaller towns can have fewer last-minute options.",
    ],
  },
};

export default premierLeagueLogistics;
