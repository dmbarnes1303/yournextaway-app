// src/data/matchdayLogistics/premierLeague.ts
import type { MatchdayLogistics } from "./types";

/**
 * EPL Matchday Logistics (MVP seed set)
 *
 * Notes:
 * - Keep content “useful + conservative”. No fake pub names.
 * - We bias toward transport guidance that doesn't become wrong weekly.
 * - Distances are intentionally omitted unless we’re confident.
 */

const premierLeagueLogistics: Record<string, MatchdayLogistics> = {
  /* -------------------------------------------------------------------------- */
  /* Big 6                                                                       */
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
        "Post-match: walk 10–15 minutes away from the stadium before entering the Tube to avoid queues.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Driving is usually a bad idea. Street restrictions + residents + event controls.",
      officialLots: ["Use official / pre-booked parking only (rare). Prefer park-and-ride via a Tube/National Rail hub."],
    },
    foodDrink: [
      { name: "Pubs/bars around Finsbury Park", type: "pub", notes: "Fastest option if you want a drink before heading in." },
      { name: "Upper Street (Islington) food spots", type: "food", notes: "Better food choices; short ride/walk after." },
    ],
    stay: {
      bestAreas: [
        { area: "King’s Cross / St Pancras", notes: "Easy access to Finsbury Park; great for weekend base." },
        { area: "Islington", notes: "Walkable vibe + food; quick access to Highbury & Islington." },
      ],
      budgetAreas: [
        { area: "Finsbury Park", budgetFriendly: true, notes: "Often cheaper than Zone 1; direct transport." },
      ],
    },
    arrivalTips: [
      "Aim to arrive at least 60–90 mins pre-kickoff if you want no stress.",
      "Have a return plan: Tube lines often queue hard right after full-time.",
    ],
  },

  "chelsea": {
    stadium: "Stamford Bridge",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Fulham Broadway (Tube)", type: "metro", notes: "District line. Standard stop but queues are normal." },
        { name: "West Brompton", type: "train", notes: "Often less chaotic; good fallback." },
        { name: "Earls Court", type: "metro", notes: "Useful interchange if you're moving across London." },
      ],
      tips: [
        "Expect Fulham Broadway to be busy post-match; walking to West Brompton can be quicker overall.",
        "If you're staying central, District line is straightforward but allow extra time.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "West London event days are brutal for parking. Do not rely on on-street parking.",
      officialLots: ["Prefer public transport or taxi drop-off away from the stadium streets."],
    },
    foodDrink: [
      { name: "Fulham Broadway area pubs", type: "pub", notes: "Convenient, busy, and mostly matchday-focused." },
      { name: "Fulham / Parsons Green food", type: "food", notes: "Better food options; short hop away." },
    ],
    stay: {
      bestAreas: [
        { area: "South Kensington", notes: "Good base; quick District line access." },
        { area: "Paddington", notes: "Solid transport hub + hotel supply." },
      ],
      budgetAreas: [
        { area: "Hammersmith", budgetFriendly: true, notes: "Often better value; still very connected." },
      ],
    },
    arrivalTips: [
      "District line delays happen — buffer your arrival.",
      "After full-time, consider a short walk before calling a taxi to avoid gridlock.",
    ],
  },

  "liverpool": {
    stadium: "Anfield",
    city: "Liverpool",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Liverpool Lime Street", type: "train", notes: "Main arrival station for most visitors." },
        { name: "Moorfields", type: "train", notes: "Useful city-centre stop; good for dispersal." },
        { name: "Matchday buses from city centre", type: "bus", notes: "Typical easiest option; check local signage on the day." },
      ],
      tips: [
        "Anfield isn't right next to a major rail stop — most tourists use buses/taxis from the centre.",
        "Post-match: walking part way back toward the centre can beat the taxi queue.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible, but you need a plan. Streets fill up early on big games.",
      officialLots: ["Pre-booked parking is the only sane approach if you must drive."],
    },
    foodDrink: [
      { name: "City centre (Concert Square / Baltic Triangle) pre-game", type: "mixed", notes: "Best variety before heading out." },
      { name: "Pubs near Anfield", type: "pub", notes: "Atmosphere is strong; expect queues." },
    ],
    stay: {
      bestAreas: [
        { area: "Liverpool city centre", notes: "Best for tourists; walkable + nightlife." },
        { area: "Baltic Triangle", notes: "Trendy base; good food + bars." },
      ],
      budgetAreas: [
        { area: "Edge Hill area", budgetFriendly: true, notes: "Can be cheaper; check exact location and transport." },
      ],
    },
    arrivalTips: [
      "If you're coming from Manchester by train, book flexible return times — post-match crowds can be slow.",
      "Aim to be around Anfield early if you want stress-free entry.",
    ],
  },

  "manchester-city": {
    stadium: "Etihad Stadium",
    city: "Manchester",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Manchester Piccadilly", type: "train", notes: "Main arrival hub for most visitors." },
        { name: "Etihad Campus (Tram)", type: "tram", notes: "Direct matchday option; can be busy post-match." },
        { name: "Piccadilly Gardens (Tram hub)", type: "tram", notes: "Useful city-centre tram interchange." },
      ],
      tips: [
        "Tram is the cleanest route, but expect crowding after full-time.",
        "If you’re fit, walking back toward the centre can be faster than queueing immediately.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More feasible than central London, but still fills early on big fixtures.",
      officialLots: ["Use official event parking / pre-book where possible."],
    },
    foodDrink: [
      { name: "Northern Quarter food & pubs", type: "mixed", notes: "Best tourist area pre-game; then tram out." },
      { name: "City centre near Piccadilly", type: "mixed", notes: "Convenient if arriving by train." },
    ],
    stay: {
      bestAreas: [
        { area: "Manchester city centre", notes: "Best base for a weekend." },
        { area: "Northern Quarter", notes: "Food/nightlife heavy; walkable." },
      ],
      budgetAreas: [
        { area: "Salford / near Victoria", budgetFriendly: true, notes: "Sometimes better value; still close." },
      ],
    },
    arrivalTips: [
      "If you’re connecting back to London by train, leave buffer time after full-time.",
      "Tram platforms can be controlled/queued; don’t panic — it’s normal.",
    ],
  },

  "manchester-united": {
    stadium: "Old Trafford",
    city: "Manchester",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Manchester Piccadilly", type: "train", notes: "Main arrival hub for tourists." },
        { name: "Deansgate / Castlefield", type: "train", notes: "Useful connector area to tram/Metrolink." },
        { name: "Metrolink to Old Trafford area", type: "tram", notes: "Standard route; follow matchday flow." },
      ],
      tips: [
        "Expect heavy crowd management post-match — it’s normal around Old Trafford.",
        "If you want a smoother exit, hang back for 15–20 minutes or walk partway toward the centre.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving is possible but roads choke up. Pre-booked is best.",
      officialLots: ["Use official parking if available; otherwise plan to park out and tram in."],
    },
    foodDrink: [
      { name: "Spinningfields / Deansgate pre-game", type: "mixed", notes: "Better food/bar choice than near the stadium." },
      { name: "Stadium-adjacent pubs", type: "pub", notes: "Atmosphere strong; queues expected." },
    ],
    stay: {
      bestAreas: [
        { area: "Manchester city centre", notes: "Best weekend base." },
        { area: "Deansgate", notes: "Convenient for transport + nightlife." },
      ],
      budgetAreas: [
        { area: "Near Piccadilly", budgetFriendly: true, notes: "Often cheaper than premium central spots." },
      ],
    },
    arrivalTips: [
      "If you're doing a same-day return, build in time for slow dispersal.",
      "Screenshots of your ticket/booking help if mobile signal is overloaded.",
    ],
  },

  "tottenham-hotspur": {
    stadium: "Tottenham Hotspur Stadium",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "White Hart Lane", type: "train", notes: "Closest rail stop; controlled flow post-match." },
        { name: "Northumberland Park", type: "train", notes: "Good alternative for dispersal; often recommended." },
        { name: "Tottenham Hale", type: "metro", notes: "Victoria line hub; useful if you're coming from central London." },
      ],
      tips: [
        "Tottenham Hale is usually your best bet for getting back into central London.",
        "Post-match queues are normal; choose the station based on where you're heading next.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "North London matchday driving is pain. Avoid unless pre-booked.",
      officialLots: ["If driving: park further out (Victoria line / Overground) and use rail in."],
    },
    foodDrink: [
      { name: "Tottenham Hale area food (before heading in)", type: "food", notes: "Good practical stop if arriving via Victoria line." },
      { name: "Local pubs near the stadium", type: "pub", notes: "Atmosphere, but busy. Expect queues." },
    ],
    stay: {
      bestAreas: [
        { area: "King’s Cross / St Pancras", notes: "Strong base + good connections to North London." },
        { area: "Liverpool Street / Shoreditch", notes: "Great for weekend; easy routes to Tottenham area." },
      ],
      budgetAreas: [
        { area: "Tottenham Hale", budgetFriendly: true, notes: "Often cheaper than Zone 1 and very connected." },
      ],
    },
    arrivalTips: [
      "Have a station plan in advance: WHL vs Northumberland Park vs Tottenham Hale.",
      "Allow extra time if you want a stress-free entry and a drink/food nearby.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* 4 tourist-heavy                                                           */
  /* -------------------------------------------------------------------------- */

  "west-ham-united": {
    stadium: "London Stadium",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Stratford", type: "train", notes: "Major hub (Tube + Elizabeth line + National Rail). Best for tourists." },
        { name: "Stratford International", type: "train", notes: "Useful depending on your route; close to the park." },
        { name: "Pudding Mill Lane (DLR)", type: "tram", notes: "Great alternative if Stratford is chaos." },
      ],
      tips: [
        "Stratford is the obvious choice but can bottleneck. Pudding Mill Lane is a smart fallback.",
        "If you're staying central, Elizabeth line → Stratford is typically quick.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Do not plan to park near the stadium. Use rail.",
      officialLots: ["If you must drive: park further out on a rail line and come in via Stratford."],
    },
    foodDrink: [
      { name: "Stratford / Westfield food court (practical)", type: "food", notes: "Easy and reliable pre-game option." },
      { name: "Hackney Wick bars", type: "bar", notes: "Good vibe; short walk along canals." },
    ],
    stay: {
      bestAreas: [
        { area: "Liverpool Street / Shoreditch", notes: "Tourist-friendly + fast to Stratford." },
        { area: "Canary Wharf", notes: "Modern base; easy DLR links." },
      ],
      budgetAreas: [
        { area: "Stratford", budgetFriendly: true, notes: "Lots of hotel stock; good value vs Zone 1." },
      ],
    },
    arrivalTips: [
      "Plan your post-match exit: either wait 15 minutes or walk to a less-busy station.",
      "This is one of the easiest London stadiums for tourists because of Stratford.",
    ],
  },

  "newcastle-united": {
    stadium: "St James’ Park",
    city: "Newcastle",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Newcastle Central Station", type: "train", notes: "Main arrival hub; walkable to stadium." },
        { name: "St James (Metro)", type: "metro", notes: "Closest Metro stop; very convenient." },
        { name: "Monument (Metro)", type: "metro", notes: "Central stop; great for bars/food + short walk." },
      ],
      tips: [
        "Newcastle is elite for tourists: compact city + walkable stadium.",
        "Base yourself central and you can do matchday without taxis at all.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible with city-centre parking, but matchday traffic can slow you down.",
      officialLots: ["Use city-centre car parks and walk/Metro. Don’t aim to park right by the ground."],
    },
    foodDrink: [
      { name: "Bigg Market / Collingwood Street (bars)", type: "bar", notes: "Classic nightlife; can be lively." },
      { name: "Grey Street / Quayside food", type: "food", notes: "Better sit-down choices; great pre-game." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre", notes: "Perfect base: walkable + nightlife." },
        { area: "Quayside", notes: "Great weekend vibe + restaurants." },
      ],
      budgetAreas: [
        { area: "Near Central Station", budgetFriendly: true, notes: "Often best value for tourists." },
      ],
    },
    arrivalTips: [
      "If you’re doing a weekend: Newcastle is a top-tier ‘football + city break’ combo.",
      "Book return train with buffer if you want a drink after full-time.",
    ],
  },

  "brighton": {
    stadium: "American Express Stadium",
    city: "Brighton",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Brighton Station", type: "train", notes: "Most visitors arrive here." },
        { name: "Falmer (Train)", type: "train", notes: "Key matchday stop for the stadium; follow signage." },
        { name: "London Victoria / London Bridge routes", type: "train", notes: "Common tourist route from London." },
      ],
      tips: [
        "If you’re staying in Brighton, train to Falmer is the standard move.",
        "If you’re day-tripping from London: expect return trains to be busy post-match.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Possible, but it’s a trek + traffic. Train is usually smarter.",
      officialLots: ["If driving: use official/pre-book parking where offered; otherwise plan remote parking + rail."],
    },
    foodDrink: [
      { name: "Brighton seafront pubs/bars", type: "pub", notes: "Tourist-friendly; good pre-game if you're in the city." },
      { name: "The Lanes food", type: "food", notes: "Strong food density; easy before heading out." },
    ],
    stay: {
      bestAreas: [
        { area: "Seafront", notes: "Best tourist base + vibe." },
        { area: "The Lanes", notes: "Great for food + walking." },
      ],
      budgetAreas: [
        { area: "Near Preston Park / Hove edge", budgetFriendly: true, notes: "Often better value; still very accessible." },
      ],
    },
    arrivalTips: [
      "Brighton is a perfect add-on weekend: match + beach/town.",
      "If you’re doing London → Brighton same day, keep your return flexible.",
    ],
  },

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
        "Birmingham is easy for tourists: strong rail links + lots of hotels.",
        "If you’re coming from London/Manchester, New Street makes it simple.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "More doable than London, but plan ahead on big games.",
      officialLots: ["Use official/pre-booked parking if possible; otherwise park near a rail stop and go in."],
    },
    foodDrink: [
      { name: "Birmingham city centre (Broad St / Brindleyplace)", type: "mixed", notes: "Easy pre-game base with lots of options." },
      { name: "Jewellery Quarter food/bars", type: "mixed", notes: "Good for a nicer pre/post match stop." },
    ],
    stay: {
      bestAreas: [
        { area: "City centre / near New Street", notes: "Best tourist base; easiest logistics." },
        { area: "Jewellery Quarter", notes: "Good vibe + food; short hop to centre." },
      ],
      budgetAreas: [
        { area: "Near New Street / Digbeth edge", budgetFriendly: true, notes: "Often better value; check exact property area." },
      ],
    },
    arrivalTips: [
      "If you’re doing a weekend, Birmingham gives you cheap hotels + easy rail.",
      "Use rail to/from the stadium where possible to avoid traffic.",
    ],
  },
};

export default premierLeagueLogistics;
