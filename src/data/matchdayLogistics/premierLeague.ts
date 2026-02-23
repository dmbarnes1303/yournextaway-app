// src/data/matchdayLogistics/premierLeague.ts
import type { MatchdayLogistics } from "./types";

/**
 * EPL Matchday Logistics (your current 20-team set)
 *
 * Rules:
 * - Useful + conservative. No fake pub names.
 * - Written for neutral travellers.
 * - Prefer stable transport guidance.
 * - Keys are simple slugs you can map to from team names.
 */

const premierLeagueLogistics: Record<string, MatchdayLogistics> = {
  /* -------------------------------------------------------------------------- */
  /* London                                                                      */
  /* -------------------------------------------------------------------------- */

  "arsenal": {
    stadium: "Emirates Stadium",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Arsenal (Tube)", type: "metro", notes: "Piccadilly line. Closest stop but can bottleneck post-match." },
        { name: "Finsbury Park", type: "train", notes: "Best all-round hub (Victoria + Piccadilly + National Rail)." },
        { name: "Highbury & Islington", type: "train", notes: "Good alternative; short walk with better flow." },
      ],
      tips: [
        "If you're staying central, Finsbury Park is usually the smoothest in/out.",
        "Post-match: walk 10–15 minutes away from the stadium before entering the Tube to reduce queues.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving is usually a bad idea. Street restrictions + event controls make it slow and stressful.",
      officialLots: ["Prefer rail/Tube. If you must drive, park further out near a rail hub and finish by train."],
    },
    foodDrink: [
      { name: "Finsbury Park area pubs/bars", type: "pub", notes: "Practical pre/post stop with fast onward travel." },
      { name: "Islington (Upper Street) food options", type: "food", notes: "Better sit-down choices; easy after-match route." },
    ],
    stay: {
      bestAreas: [
        { area: "King’s Cross / St Pancras", notes: "Great base + easy access to Finsbury Park." },
        { area: "Islington", notes: "Food-heavy area and quick rail links." },
      ],
      budgetAreas: [{ area: "Finsbury Park", budgetFriendly: true, notes: "Often cheaper than Zone 1; very connected." }],
    },
    arrivalTips: ["Arrive 60–90 mins pre-kickoff if you want a calm entry.", "Have a post-match station plan before full-time."],
  },

  "chelsea": {
    stadium: "Stamford Bridge",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Fulham Broadway (Tube)", type: "metro", notes: "District line. Standard stop but queues are normal." },
        { name: "West Brompton", type: "train", notes: "Often less chaotic; smart post-match fallback." },
        { name: "Earl’s Court", type: "metro", notes: "Useful interchange for cross-London travel." },
      ],
      tips: [
        "Expect Fulham Broadway to be busy post-match; walking to West Brompton can be quicker overall.",
        "Build buffer time — District line platforms can be managed/queued on busy fixtures.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "West London matchdays are brutal for parking and traffic. Driving rarely wins.",
      officialLots: ["If you must use a taxi, get picked up a few streets away to avoid gridlock."],
    },
    foodDrink: [
      { name: "Fulham Broadway matchday pubs", type: "pub", notes: "Convenient but busy." },
      { name: "Fulham / Parsons Green food options", type: "food", notes: "Better choice density; short hop away." },
    ],
    stay: {
      bestAreas: [
        { area: "South Kensington", notes: "Tourist-friendly base; simple District line routes." },
        { area: "Paddington", notes: "Strong transport hub + lots of hotels." },
      ],
      budgetAreas: [{ area: "Hammersmith", budgetFriendly: true, notes: "Often better value while still very connected." }],
    },
    arrivalTips: ["Allow for delays and crowding on the District line.", "After full-time, consider a 10–15 minute walk before calling a taxi."],
  },

  "crystal-palace": {
    stadium: "Selhurst Park",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "London Bridge / Victoria", type: "train", notes: "Common arrival routes into South London rail." },
        { name: "Selhurst (Rail)", type: "train", notes: "Typical matchday station; follow the crowd flow." },
        { name: "Thornton Heath (Rail)", type: "train", notes: "Common alternative; can disperse crowds better." },
      ],
      tips: [
        "This is a National Rail-style matchday rather than Tube-first.",
        "Post-match: walking a few minutes and choosing the quieter station often saves time.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Residential restrictions + congestion make driving poor value.",
      officialLots: ["If driving, park further out near a rail hub and finish by train."],
    },
    foodDrink: [
      { name: "Central London pre-game then rail down", type: "mixed", notes: "More choice if you're making a day of it." },
      { name: "Station high-street options", type: "mixed", notes: "Practical quick bite before walking to the ground." },
    ],
    stay: {
      bestAreas: [
        { area: "London Bridge / South Bank", notes: "Tourist base with easy rail routes south." },
        { area: "Victoria / Pimlico", notes: "Good hotel supply and simple connections." },
      ],
      budgetAreas: [{ area: "Croydon", budgetFriendly: true, notes: "Often cheaper; strong rail connectivity." }],
    },
    arrivalTips: ["Aim to arrive early—local streets get busy close to kickoff.", "Don’t book a tight post-match train if you want a relaxed exit."],
  },

  "fulham": {
    stadium: "Craven Cottage",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Putney Bridge (Tube)", type: "metro", notes: "District line. Common approach with a walk-in." },
        { name: "Hammersmith", type: "metro", notes: "Major interchange; reliable fallback." },
        { name: "Putney (Rail)", type: "train", notes: "Useful if arriving via National Rail." },
      ],
      tips: [
        "Expect a walk from Tube/rail — don’t bank on taxis being fast near kickoff.",
        "Post-match: walk away from the immediate river-side pinch points before calling transport.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "West London residential controls + traffic. Driving is rarely worth it.",
      officialLots: ["If you must drive, park away from the stadium and finish by Tube/rail."],
    },
    foodDrink: [
      { name: "Putney / Fulham food corridors", type: "food", notes: "Better choice density than right at the stadium." },
      { name: "Hammersmith pre/post options", type: "mixed", notes: "Practical if you want smoother transport links." },
    ],
    stay: {
      bestAreas: [
        { area: "Hammersmith", notes: "Practical base; strong transport." },
        { area: "South Kensington", notes: "Tourist-friendly with District line access." },
      ],
      budgetAreas: [{ area: "Earl’s Court", budgetFriendly: true, notes: "Often better value, still connected." }],
    },
    arrivalTips: ["Leave extra time for the walk-in and queues.", "If weather is bad, assume slower entry and slower exits."],
  },

  "tottenham-hotspur": {
    stadium: "Tottenham Hotspur Stadium",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "White Hart Lane", type: "train", notes: "Closest rail stop; controlled flow post-match." },
        { name: "Northumberland Park", type: "train", notes: "Often recommended for dispersal." },
        { name: "Tottenham Hale", type: "metro", notes: "Victoria line hub; best link back into central London." },
      ],
      tips: [
        "Pick your station based on where you're heading: Tottenham Hale for central London is usually best.",
        "Post-match: queues are normal; follow routing and don’t panic.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "North London matchday driving is slow and frustrating. Avoid unless pre-booked.",
      officialLots: ["If driving: park further out on a Victoria line/Overground route and rail in."],
    },
    foodDrink: [
      { name: "Tottenham Hale practical food options", type: "food", notes: "Good if arriving via Victoria line." },
      { name: "Local pubs near stadium", type: "pub", notes: "Atmosphere strong; very busy." },
    ],
    stay: {
      bestAreas: [
        { area: "King’s Cross / St Pancras", notes: "Strong base + simple routes north." },
        { area: "Liverpool Street / Shoreditch", notes: "Great weekend base; easy to Tottenham area." },
      ],
      budgetAreas: [{ area: "Tottenham Hale", budgetFriendly: true, notes: "Often cheaper than Zone 1 and very connected." }],
    },
    arrivalTips: ["Have a station plan in advance.", "Allow time if you want food/drink without rushing."],
  },

  "west-ham-united": {
    stadium: "London Stadium",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Stratford", type: "train", notes: "Major hub (Tube + Elizabeth line + National Rail). Best for tourists." },
        { name: "Stratford International", type: "train", notes: "Useful depending on route; close to the park." },
        { name: "Pudding Mill Lane (DLR)", type: "tram", notes: "Smart fallback if Stratford is chaos." },
      ],
      tips: [
        "Stratford can bottleneck. Pudding Mill Lane is often the smoother exit.",
        "If you’re staying central, Elizabeth line → Stratford is usually the cleanest route.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Do not plan to park near the stadium. Use rail.",
      officialLots: ["If driving: park further out on a rail line and come in via Stratford."],
    },
    foodDrink: [
      { name: "Westfield Stratford food options", type: "food", notes: "Reliable pre-game option." },
      { name: "Hackney Wick bars/food", type: "bar", notes: "Good vibe; short walk along canals." },
    ],
    stay: {
      bestAreas: [
        { area: "Liverpool Street / Shoreditch", notes: "Fast to Stratford + good weekend base." },
        { area: "Canary Wharf", notes: "Modern base; easy DLR links." },
      ],
      budgetAreas: [{ area: "Stratford", budgetFriendly: true, notes: "Lots of hotel stock; often good value." }],
    },
    arrivalTips: ["Plan your post-match exit (wait 10–15 mins or walk to a quieter stop).", "This is one of the easiest London stadiums logistically."],
  },

  /* -------------------------------------------------------------------------- */
  /* Manchester & Liverpool                                                      */
  /* -------------------------------------------------------------------------- */

  "manchester-city": {
    stadium: "Etihad Stadium",
    city: "Manchester",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Manchester Piccadilly", type: "train", notes: "Main arrival hub for most visitors." },
        { name: "Etihad Campus (Metrolink)", type: "tram", notes: "Direct matchday option; busy post-match." },
        { name: "Piccadilly Gardens (Tram hub)", type: "tram", notes: "Useful city-centre interchange." },
      ],
      tips: [
        "Metrolink is the cleanest route; expect crowding after full-time.",
        "Walking back toward the centre can beat tram queues if you’re able.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than London, but still fills early on big games.",
      officialLots: ["Use official event parking / pre-book where possible."],
    },
    foodDrink: [
      { name: "Northern Quarter food & pubs", type: "mixed", notes: "Great visitor base; then tram out." },
      { name: "City centre near Piccadilly", type: "mixed", notes: "Convenient if arriving by train." },
    ],
    stay: {
      bestAreas: [
        { area: "Manchester city centre", notes: "Best base for a weekend." },
        { area: "Northern Quarter", notes: "Food/nightlife heavy; walkable." },
      ],
      budgetAreas: [{ area: "Near Victoria / Salford edge", budgetFriendly: true, notes: "Sometimes better value; still close." }],
    },
    arrivalTips: ["Leave buffer time if you’re catching a long-distance train after the match.", "Tram platforms can be managed/queued — normal on matchdays."],
  },

  "manchester-united": {
    stadium: "Old Trafford",
    city: "Manchester",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Manchester Piccadilly", type: "train", notes: "Main arrival hub for visitors." },
        { name: "Deansgate / Castlefield", type: "train", notes: "Useful connector area to Metrolink." },
        { name: "Metrolink (Old Trafford area)", type: "tram", notes: "Standard route; follow matchday flow." },
      ],
      tips: [
        "Expect crowd management post-match — it’s normal here.",
        "For a smoother exit, wait 15–20 minutes or walk partway back toward the centre.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but roads choke up. Pre-booked is best.",
      officialLots: ["Use official parking if available; otherwise park out and tram in."],
    },
    foodDrink: [
      { name: "Spinningfields / Deansgate pre-game", type: "mixed", notes: "Better choice than right by the stadium." },
      { name: "Stadium-adjacent pubs", type: "pub", notes: "Atmosphere strong; queues expected." },
    ],
    stay: {
      bestAreas: [
        { area: "Manchester city centre", notes: "Best weekend base." },
        { area: "Deansgate", notes: "Convenient for transport + nightlife." },
      ],
      budgetAreas: [{ area: "Near Piccadilly", budgetFriendly: true, notes: "Often cheaper than premium central spots." }],
    },
    arrivalTips: ["Build in time for slow dispersal if you’re doing a same-day return.", "Screenshot your ticket/booking in case signal is overloaded."],
  },

  "liverpool": {
    stadium: "Anfield",
    city: "Liverpool",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Liverpool Lime Street", type: "train", notes: "Main arrival station for most visitors." },
        { name: "Moorfields", type: "train", notes: "Useful city-centre stop; good for dispersal." },
        { name: "Matchday buses from city centre", type: "bus", notes: "Often easiest; check signage/routing on the day." },
      ],
      tips: [
        "Anfield isn’t next to a major rail stop — most visitors use buses/taxis from the centre.",
        "Post-match: walking part way back toward the centre can beat the taxi queue.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible, but streets fill early on big games. Pre-book if you must drive.",
      officialLots: ["Pre-booked/official parking is the only sane approach if driving."],
    },
    foodDrink: [
      { name: "Liverpool city centre (pre-game)", type: "mixed", notes: "Best variety; then travel out." },
      { name: "Pubs near Anfield", type: "pub", notes: "Big matchday atmosphere; busy." },
    ],
    stay: {
      bestAreas: [
        { area: "Liverpool city centre", notes: "Best for visitors; walkable + nightlife." },
        { area: "Baltic Triangle", notes: "Trendy base; strong food/bars." },
      ],
      budgetAreas: [{ area: "Edge Hill", budgetFriendly: true, notes: "Can be cheaper; check exact property area + transport." }],
    },
    arrivalTips: ["If you’re coming from Manchester by train, keep return flexible.", "Arrive earlier if you want a calm entry and pre-match food."],
  },

  "everton": {
    stadium: "Goodison Park",
    city: "Liverpool",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Liverpool Lime Street", type: "train", notes: "Main arrival hub; connect onward via local routes." },
        { name: "City centre bus corridors", type: "bus", notes: "Common approach; allow time for matchday traffic." },
        { name: "Taxi drop-off (short walk remaining)", type: "taxi", notes: "Useful if time-tight; avoid being dropped right at the gates." },
      ],
      tips: [
        "Most visitors base in the city centre and travel out by bus/taxi.",
        "Post-match taxi queues surge—walk 10 minutes away before ordering.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible but roads and residential areas get congested close to kickoff.",
      officialLots: ["If driving, arrive early and don’t rely on last-minute street parking."],
    },
    foodDrink: [
      { name: "Liverpool city centre (pre/post)", type: "mixed", notes: "Best choice density for visitors." },
      { name: "Near-stadium pubs", type: "pub", notes: "Atmosphere strong; busy and queue-heavy." },
    ],
    stay: {
      bestAreas: [
        { area: "Liverpool city centre", notes: "Best weekend base." },
        { area: "Waterfront / docks", notes: "Good city-break vibe + restaurants." },
      ],
      budgetAreas: [{ area: "Edge-of-centre", budgetFriendly: true, notes: "Often better value; check transport links." }],
    },
    arrivalTips: ["Don’t leave stadium travel to the last hour if arriving by train.", "Keep return bookings flexible if you want a calmer exit."],
  },

  /* -------------------------------------------------------------------------- */
  /* Midlands                                                                    */
  /* -------------------------------------------------------------------------- */

  "aston-villa": {
    stadium: "Villa Park",
    city: "Birmingham",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Birmingham New Street", type: "train", notes: "Main arrival hub; connect onward by local rail." },
        { name: "Witton (Train)", type: "train", notes: "Common matchday station for Villa Park." },
        { name: "Aston (Train)", type: "train", notes: "Alternative nearby station; check matchday routes." },
      ],
      tips: [
        "Birmingham is easy for visitors: strong rail links + lots of hotels.",
        "If you’re coming from London/Manchester, New Street makes it simple.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More doable than London, but plan ahead on big games.",
      officialLots: ["Use official/pre-booked parking if possible; otherwise park near a rail stop and go in."],
    },
    foodDrink: [
      { name: "Birmingham city centre food/bar districts", type: "mixed", notes: "Most choice before heading out." },
      { name: "Jewellery Quarter", type: "mixed", notes: "Great pre/post spot if you want nicer options." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre / near New Street", notes: "Best base; easiest logistics." },
        { area: "Jewellery Quarter", notes: "Good vibe + food; short hop to centre." },
      ],
      budgetAreas: [{ area: "Digbeth edge", budgetFriendly: true, notes: "Often better value; check exact area." }],
    },
    arrivalTips: ["Use rail where possible to avoid traffic.", "If you’re doing a weekend, Birmingham is strong for hotel value."],
  },

  "nottingham-forest": {
    stadium: "The City Ground",
    city: "Nottingham",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Nottingham Station", type: "train", notes: "Main arrival hub; connect onward via tram/bus/taxi." },
        { name: "Tram network", type: "tram", notes: "Useful depending on hotel location; check matchday frequency." },
        { name: "City centre bus/taxi", type: "bus", notes: "Practical last-mile option; allow time for traffic." },
      ],
      tips: [
        "Base yourself central and travel out with margin — matchday routes can bottleneck.",
        "Post-match: walking away from the immediate stadium area makes taxis much easier.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible, but matchday congestion is real. Park away and finish by public transport if you can.",
      officialLots: ["Prefer pre-booked/official options where available; avoid last-minute street parking."],
    },
    foodDrink: [
      { name: "City centre (Lace Market / Hockley style areas)", type: "mixed", notes: "Best pre-game density for visitors." },
      { name: "Old Market Square area", type: "mixed", notes: "Practical and central." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Best base; walkable + nightlife." },
        { area: "Lace Market", notes: "Good weekend vibe + food." },
      ],
      budgetAreas: [{ area: "Near station / edge-of-centre", budgetFriendly: true, notes: "Often better value; easy access." }],
    },
    arrivalTips: ["Arrive early if you want relaxed entry.", "Keep return travel flexible if you’re catching a train."],
  },

  /* -------------------------------------------------------------------------- */
  /* North East                                                                  */
  /* -------------------------------------------------------------------------- */

  "newcastle-united": {
    stadium: "St James’ Park",
    city: "Newcastle",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Newcastle Central Station", type: "train", notes: "Main arrival hub; walkable to stadium." },
        { name: "St James (Metro)", type: "metro", notes: "Closest Metro stop; very convenient." },
        { name: "Monument (Metro)", type: "metro", notes: "Central stop; great for food/bars + short walk." },
      ],
      tips: [
        "Newcastle is elite for visitors: compact city + walkable stadium.",
        "Base central and you can do matchday without taxis.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible via city-centre car parks, but matchday traffic can slow you down.",
      officialLots: ["Use city-centre car parks and walk/Metro. Don’t aim to park right by the ground."],
    },
    foodDrink: [
      { name: "City centre bar streets", type: "bar", notes: "Loads of choice; can be lively." },
      { name: "Grey Street / Quayside food areas", type: "food", notes: "Better sit-down options; strong pre-game plan." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Perfect base: walkable + nightlife." },
        { area: "Quayside", notes: "Great weekend vibe + restaurants." },
      ],
      budgetAreas: [{ area: "Near Central Station", budgetFriendly: true, notes: "Often best value for visitors." }],
    },
    arrivalTips: ["If you’re doing a weekend: Newcastle is top-tier for football + city break.", "Book return trains with buffer if you want post-match drinks/food."],
  },

  "sunderland": {
    stadium: "Stadium of Light",
    city: "Sunderland",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Sunderland Station", type: "train", notes: "Main arrival hub; connect onward by local routes." },
        { name: "Tyne and Wear Metro", type: "metro", notes: "Often the most reliable in/out option on matchday." },
        { name: "Newcastle Central (visitor base)", type: "train", notes: "Common approach: stay Newcastle, travel to Sunderland." },
      ],
      tips: [
        "Many visitors base in Newcastle and use rail/Metro into Sunderland for matchday.",
        "Post-match: don’t plan an ultra-tight connection — crowding is normal.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than major cities, but roads still thicken around kickoff/full-time.",
      officialLots: ["If driving, arrive early and aim for pre-booked/event parking if available."],
    },
    foodDrink: [
      { name: "Newcastle pre-game then travel", type: "mixed", notes: "Best variety if you’re doing a weekend." },
      { name: "Sunderland city centre options", type: "mixed", notes: "Practical, but busy close to kickoff." },
    ],
    stay: {
      bestAreas: [
        { area: "Newcastle city centre", notes: "Best tourist base; easy travel to Sunderland." },
        { area: "Sunderland city centre", notes: "Simplest matchday logistics; quieter base." },
      ],
      budgetAreas: [{ area: "Near Sunderland station", budgetFriendly: true, notes: "Often best value if staying local." }],
    },
    arrivalTips: ["Allow extra time if using Metro after full-time.", "Keep your phone charged for tickets + route checks."],
  },

  /* -------------------------------------------------------------------------- */
  /* Other: compact / smaller-capacity clubs                                    */
  /* -------------------------------------------------------------------------- */

  "brentford": {
    stadium: "Gtech Community Stadium",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Kew Bridge (Rail)", type: "train", notes: "Common closest station; short walk." },
        { name: "Gunnersbury (Tube/Overground)", type: "train", notes: "District + Overground; strong alternative." },
        { name: "Hammersmith (interchange)", type: "metro", notes: "Useful hub for many routes." },
      ],
      tips: [
        "This is rail + walk. Don’t bank on taxis near kickoff.",
        "If you want a smoother exit, wait 10–15 minutes after full-time.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Parking is tight and controlled; driving is rarely worth the hassle.",
      officialLots: ["Use public transport; if driving, park further out and finish by rail."],
    },
    foodDrink: [
      { name: "Chiswick / Kew food areas", type: "food", notes: "Better density than immediate stadium perimeter." },
      { name: "Central London pre-game then rail out", type: "mixed", notes: "Best variety if you’re making a day of it." },
    ],
    stay: {
      bestAreas: [
        { area: "Hammersmith", notes: "Great transport and hotel options." },
        { area: "Paddington", notes: "Hub base if doing London tourism too." },
      ],
      budgetAreas: [{ area: "Ealing", budgetFriendly: true, notes: "Often better value; still connected." }],
    },
    arrivalTips: ["Arrive early if you want food/drink nearby—places get busy fast.", "Use rail/Tube; driving will feel slow."],
  },

  "afc-bournemouth": {
    stadium: "Vitality Stadium",
    city: "Bournemouth",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Bournemouth Station", type: "train", notes: "Main arrival hub; onward by bus/taxi." },
        { name: "Town centre buses", type: "bus", notes: "Often simplest; check matchday routing/signage." },
        { name: "Taxi drop-off (short walk remaining)", type: "taxi", notes: "Useful if time-tight; expect traffic near kickoff." },
      ],
      tips: [
        "Treat Bournemouth as a weekend trip: base in town, then travel out early.",
        "If arriving close to kickoff, taxis can crawl — build margin.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Local roads and a small-stadium area make parking awkward on matchday.",
      officialLots: ["Only rely on pre-booked/official parking or park further out and taxi/bus in."],
    },
    foodDrink: [
      { name: "Bournemouth town centre (pre-game)", type: "mixed", notes: "Best variety before heading to stadium area." },
      { name: "Station-area quick food", type: "food", notes: "Practical if arriving close to kickoff." },
    ],
    stay: {
      bestAreas: [
        { area: "Town centre / seafront", notes: "Best weekend vibe." },
        { area: "Near the station", notes: "Practical for rail travellers." },
      ],
      budgetAreas: [{ area: "Edge-of-centre", budgetFriendly: true, notes: "Often better value; confirm transport options." }],
    },
    arrivalTips: ["Arrive earlier than you think if you’re driving.", "Keep return travel flexible if day-tripping."],
  },

  "brighton": {
    stadium: "American Express Stadium",
    city: "Brighton",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Brighton Station", type: "train", notes: "Most visitors arrive here." },
        { name: "Falmer (Train)", type: "train", notes: "Key matchday stop for the stadium; follow signage." },
        { name: "London Victoria / London Bridge routes", type: "train", notes: "Common route for day-trippers." },
      ],
      tips: [
        "If you’re staying in Brighton, train to Falmer is the default move.",
        "If you’re day-tripping from London, expect busy return trains post-match.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving can work but traffic and the last-mile are awkward. Train usually wins.",
      officialLots: ["If driving: use official/pre-book parking where offered; otherwise plan remote parking + rail."],
    },
    foodDrink: [
      { name: "The Lanes (food)", type: "food", notes: "Strong density; easy before heading out." },
      { name: "Seafront pubs/bars", type: "pub", notes: "Tourist-friendly; good pre-game base." },
    ],
    stay: {
      bestAreas: [
        { area: "Seafront", notes: "Best tourist base + vibe." },
        { area: "The Lanes", notes: "Great for food + walking." },
      ],
      budgetAreas: [{ area: "Preston Park / Hove edge", budgetFriendly: true, notes: "Often better value; still accessible." }],
    },
    arrivalTips: ["Brighton is ideal for a city-break weekend.", "Keep return travel flexible if you want a calm exit."],
  },

  "leeds-united": {
    stadium: "Elland Road",
    city: "Leeds",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Leeds Station", type: "train", notes: "Main arrival hub for visitors." },
        { name: "City centre buses/taxis", type: "bus", notes: "Typical matchday route to Elland Road; allow time." },
        { name: "Walk/short taxi from central base", type: "other", notes: "Depends on weather and timing; build margin." },
      ],
      tips: [
        "Most visitors base in the city centre and travel out by bus/taxi.",
        "Post-match taxi queues can be heavy — walk away from the stadium area before ordering.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but can be chaotic on big fixtures. Expect slow roads near kickoff.",
      officialLots: ["If driving: only rely on pre-booked/official options or park out and taxi/bus in."],
    },
    foodDrink: [
      { name: "Leeds city centre food/nightlife districts", type: "mixed", notes: "Best pre-game choice density." },
      { name: "Station-area quick options", type: "food", notes: "Useful if arriving late." },
    ],
    stay: {
      bestAreas: [
        { area: "Leeds city centre", notes: "Best weekend base." },
        { area: "Near the station", notes: "Best for train travellers." },
      ],
      budgetAreas: [{ area: "Edge-of-centre", budgetFriendly: true, notes: "Often better value; check transport links." }],
    },
    arrivalTips: ["If you’re doing a same-day return, leave buffer time after full-time.", "Arrive early if you want a relaxed entry."],
  },

  "burnley": {
    stadium: "Turf Moor",
    city: "Burnley",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Manchester (visitor base)", type: "train", notes: "Common base city; connect by regional rail." },
        { name: "Burnley rail stations", type: "train", notes: "Local stations serve the town; allow time for last-mile." },
        { name: "Town centre taxis/buses", type: "bus", notes: "Practical for last-mile; demand rises near kickoff." },
      ],
      tips: [
        "Approach as a regional trip: base Manchester or stay locally.",
        "If relying on rail, build margin — regional connections can be less frequent.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than big cities, but local roads still thicken near kickoff.",
      officialLots: ["If driving, arrive early and consider parking a bit further out and walking in."],
    },
    foodDrink: [
      { name: "Town centre pubs/food", type: "mixed", notes: "Most practical for visitors." },
      { name: "Manchester pre-game then travel", type: "mixed", notes: "More choice if you’re doing a weekend." },
    ],
    stay: {
      bestAreas: [
        { area: "Manchester", notes: "Best weekend base; day-trip to Burnley." },
        { area: "Burnley town centre", notes: "Simplest matchday logistics if staying local." },
      ],
      budgetAreas: [{ area: "Local edge-of-town hotels", budgetFriendly: true, notes: "Often better value; check taxi availability." }],
    },
    arrivalTips: ["Arrive early if you’re driving.", "Keep return travel flexible if using regional rail."],
  },

  "wolves": {
    stadium: "Molineux Stadium",
    city: "Wolverhampton",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Wolverhampton Station", type: "train", notes: "Main arrival hub; stadium is typically walkable from central areas." },
        { name: "Birmingham New Street (visitor base)", type: "train", notes: "Common base; easy regional rail connection." },
        { name: "City centre buses/taxis", type: "bus", notes: "Useful if weather is poor; allow matchday time." },
      ],
      tips: [
        "Many visitors base in Birmingham and do Wolves as a day trip.",
        "If walking from the station, build in extra time for matchday crowds.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than London, but central roads still slow near kickoff/full-time.",
      officialLots: ["Pre-book official/event parking where possible; otherwise park centrally and walk."],
    },
    foodDrink: [
      { name: "Wolverhampton city centre", type: "mixed", notes: "Most practical base for visitors." },
      { name: "Birmingham pre/post then rail over", type: "mixed", notes: "More variety if you’re doing a weekend." },
    ],
    stay: {
      bestAreas: [
        { area: "Birmingham city centre", notes: "Best weekend base; simple rail to Wolverhampton." },
        { area: "Wolverhampton centre", notes: "Practical if staying local." },
      ],
      budgetAreas: [{ area: "Near station / rail corridor", budgetFriendly: true, notes: "Often better value; check exact location." }],
    },
    arrivalTips: ["If returning by train, leave buffer for crowd dispersal.", "If driving, arrive early to avoid last-minute traffic."],
  },

  /* -------------------------------------------------------------------------- */
  /* Alias key safety (same object)                                             */
  /* -------------------------------------------------------------------------- */

  "wolverhampton-wanderers": {
    stadium: "Molineux Stadium",
    city: "Wolverhampton",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Wolverhampton Station", type: "train", notes: "Main arrival hub; stadium is typically walkable from central areas." },
        { name: "Birmingham New Street (visitor base)", type: "train", notes: "Common base; easy regional rail connection." },
        { name: "City centre buses/taxis", type: "bus", notes: "Useful if weather is poor; allow matchday time." },
      ],
      tips: [
        "Many visitors base in Birmingham and do Wolves as a day trip.",
        "If walking from the station, build in extra time for matchday crowds.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than London, but central roads still slow near kickoff/full-time.",
      officialLots: ["Pre-book official/event parking where possible; otherwise park centrally and walk."],
    },
    foodDrink: [
      { name: "Wolverhampton city centre", type: "mixed", notes: "Most practical base for visitors." },
      { name: "Birmingham pre/post then rail over", type: "mixed", notes: "More variety if you’re doing a weekend." },
    ],
    stay: {
      bestAreas: [
        { area: "Birmingham city centre", notes: "Best weekend base; simple rail to Wolverhampton." },
        { area: "Wolverhampton centre", notes: "Practical if staying local." },
      ],
      budgetAreas: [{ area: "Near station / rail corridor", budgetFriendly: true, notes: "Often better value; check exact location." }],
    },
    arrivalTips: ["If returning by train, leave buffer for crowd dispersal.", "If driving, arrive early to avoid last-minute traffic."],
  },
};

export default premierLeagueLogistics;
