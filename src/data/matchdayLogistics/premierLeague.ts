import type { MatchdayLogistics } from "./types";

/**
 * EPL Matchday Logistics (20 teams)
 *
 * Principles:
 * - Stable transport anchors (stations/lines/hubs)
 * - Neutral traveller framing
 * - No transitional / temporary wording
 * - Stadiums treated as fully operational
 */

const premierLeagueLogistics: Record<string, MatchdayLogistics> = {
  /* -------------------------------------------------------------------------- */
  /* London                                                                     */
  /* -------------------------------------------------------------------------- */

  "arsenal": {
    stadium: "Emirates Stadium",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Arsenal (Tube)", type: "metro", notes: "Piccadilly line. Closest stop." },
        { name: "Finsbury Park", type: "train", notes: "Best hub: Victoria + Piccadilly + National Rail." },
        { name: "Highbury & Islington", type: "train", notes: "Good alternative with smoother dispersal." },
      ],
      tips: [
        "Finsbury Park is usually the fastest in/out for visitors.",
        "Post-match: walk 10 minutes before entering Tube to reduce queues.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Controlled zones and match restrictions make driving impractical.",
      officialLots: ["Use Tube/National Rail instead of driving."],
    },
    foodDrink: [
      { name: "Finsbury Park", type: "mixed", notes: "Convenient pre/post." },
      { name: "Upper Street (Islington)", type: "food", notes: "Better sit-down options." },
    ],
    stay: {
      bestAreas: [
        { area: "King’s Cross", notes: "Direct to Finsbury Park." },
        { area: "Islington", notes: "Great local base." },
      ],
      budgetAreas: [{ area: "Finsbury Park", budgetFriendly: true }],
    },
    arrivalTips: [
      "Arrive 60–90 mins before kickoff.",
      "Expect post-match station queues.",
    ],
  },

  "chelsea": {
    stadium: "Stamford Bridge",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Fulham Broadway", type: "metro", notes: "Closest station." },
        { name: "West Brompton", type: "train", notes: "Less crowded exit." },
        { name: "Earl’s Court", type: "metro", notes: "Interchange hub." },
      ],
      tips: [
        "West Brompton is often the quickest dispersal route.",
        "District line disruptions are common — allow time buffer.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "West London parking extremely limited.",
      officialLots: ["Public transport strongly recommended."],
    },
    foodDrink: [
      { name: "Fulham Broadway", type: "mixed" },
      { name: "Parsons Green", type: "food" },
    ],
    stay: {
      bestAreas: [
        { area: "South Kensington" },
        { area: "Paddington" },
      ],
      budgetAreas: [{ area: "Hammersmith", budgetFriendly: true }],
    },
    arrivalTips: [
      "Avoid taxis for final approach.",
      "Allow time for security checks.",
    ],
  },

  "crystal-palace": {
    stadium: "Selhurst Park",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Norwood Junction", type: "train" },
        { name: "Selhurst", type: "train" },
        { name: "Thornton Heath", type: "train" },
      ],
      tips: [
        "Choose station based on onward route.",
        "Queues ease 10–15 mins after full-time.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "Residential restrictions near stadium.",
      officialLots: ["Rail access preferred."],
    },
    foodDrink: [
      { name: "Around Norwood Junction", type: "mixed" },
      { name: "Central London pre-base", type: "mixed" },
    ],
    stay: {
      bestAreas: [
        { area: "London Bridge" },
        { area: "Liverpool Street" },
      ],
      budgetAreas: [{ area: "Croydon", budgetFriendly: true }],
    },
    arrivalTips: [
      "Screenshot rail routes.",
      "Arrive early to orient yourself.",
    ],
  },

  "tottenham-hotspur": {
    stadium: "Tottenham Hotspur Stadium",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "White Hart Lane", type: "train" },
        { name: "Northumberland Park", type: "train" },
        { name: "Tottenham Hale", type: "metro" },
      ],
      tips: [
        "Tottenham Hale is best for central London returns.",
        "Station queues are normal post-match.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "North London congestion on matchdays.",
      officialLots: ["Rail approach recommended."],
    },
    foodDrink: [
      { name: "Tottenham Hale", type: "food" },
      { name: "Stadium approaches", type: "mixed" },
    ],
    stay: {
      bestAreas: [
        { area: "King’s Cross" },
        { area: "Liverpool Street" },
      ],
      budgetAreas: [{ area: "Tottenham Hale", budgetFriendly: true }],
    },
    arrivalTips: [
      "Choose station plan in advance.",
      "Arrive early for relaxed entry.",
    ],
  },

  "west-ham-united": {
    stadium: "London Stadium",
    city: "London",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Stratford", type: "train" },
        { name: "Stratford International", type: "train" },
        { name: "Pudding Mill Lane", type: "tram" },
      ],
      tips: [
        "Elizabeth line → Stratford is fastest.",
        "Pudding Mill Lane is quieter exit.",
      ],
    },
    parking: {
      availability: "hard",
      summary: "No practical stadium parking.",
      officialLots: ["Use Stratford rail hub."],
    },
    foodDrink: [
      { name: "Stratford / Westfield", type: "food" },
      { name: "Hackney Wick", type: "bar" },
    ],
    stay: {
      bestAreas: [
        { area: "Liverpool Street" },
        { area: "Canary Wharf" },
      ],
      budgetAreas: [{ area: "Stratford", budgetFriendly: true }],
    },
    arrivalTips: [
      "Plan exit route in advance.",
      "Wait briefly post-match to reduce queues.",
    ],
  },

  /* -------------------------------------------------------------------------- */
  /* North West                                                                 */
  /* -------------------------------------------------------------------------- */

  "liverpool": {
    stadium: "Anfield",
    city: "Liverpool",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Liverpool Lime Street", type: "train" },
        { name: "Moorfields", type: "train" },
        { name: "City-centre matchday buses", type: "bus" },
      ],
      tips: [
        "Bus from city centre is simplest.",
        "Walking part-way back reduces taxi queues.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Streets fill early on big fixtures.",
      officialLots: ["Pre-book if driving."],
    },
    foodDrink: [
      { name: "Liverpool city centre", type: "mixed" },
      { name: "Around Anfield", type: "pub" },
    ],
    stay: {
      bestAreas: [
        { area: "City centre" },
        { area: "Baltic Triangle" },
      ],
      budgetAreas: [{ area: "Edge Hill", budgetFriendly: true }],
    },
    arrivalTips: [
      "Allow time for bus queues.",
      "Arrive early for atmosphere.",
    ],
  },

  "everton": {
    stadium: "Hill Dickinson Stadium",
    city: "Liverpool",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Liverpool Lime Street", type: "train" },
        { name: "Moorfields", type: "train" },
        { name: "Sandhills", type: "train", notes: "Closest rail access to Bramley-Moore Dock area." },
      ],
      tips: [
        "Liverpool city centre is the main visitor base.",
        "Rail from Sandhills or city centre connections are standard routes.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Dockside event traffic builds on matchdays.",
      officialLots: ["Use pre-booked event or city-centre parking."],
    },
    foodDrink: [
      { name: "Liverpool city centre", type: "mixed" },
      { name: "Waterfront / dock area", type: "mixed" },
    ],
    stay: {
      bestAreas: [
        { area: "Liverpool city centre" },
        { area: "Waterfront" },
      ],
      budgetAreas: [{ area: "Edge Hill", budgetFriendly: true }],
    },
    arrivalTips: [
      "Allow extra time for waterfront crowds.",
      "Rail dispersal can take 10–20 minutes after full-time.",
    ],
  },

  "manchester-city": {
    stadium: "Etihad Stadium",
    city: "Manchester",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Manchester Piccadilly", type: "train" },
        { name: "Etihad Campus", type: "tram" },
        { name: "Piccadilly Gardens", type: "tram" },
      ],
      tips: [
        "Tram is the main route.",
        "Walking part-way back can beat queues.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Event parking fills early.",
      officialLots: ["Official parking recommended."],
    },
    foodDrink: [
      { name: "Northern Quarter", type: "mixed" },
      { name: "City centre", type: "mixed" },
    ],
    stay: {
      bestAreas: [
        { area: "City centre" },
        { area: "Northern Quarter" },
      ],
      budgetAreas: [{ area: "Salford", budgetFriendly: true }],
    },
    arrivalTips: [
      "Leave buffer for trains.",
      "Avoid tight same-day returns.",
    ],
  },

  "manchester-united": {
    stadium: "Old Trafford",
    city: "Manchester",
    country: "England",
    transport: {
      primaryStops: [
        { name: "Manchester Piccadilly", type: "train" },
        { name: "Deansgate", type: "train" },
        { name: "Old Trafford (Metrolink)", type: "tram" },
      ],
      tips: [
        "Metrolink standard route.",
        "Wait 15 mins post-match to reduce queues.",
      ],
    },
    parking: {
      availability: "medium",
      summary: "Driving possible with pre-booking.",
      officialLots: ["Official parking preferred."],
    },
    foodDrink: [
      { name: "Deansgate / Spinningfields", type: "mixed" },
      { name: "Trafford area", type: "mixed" },
    ],
    stay: {
      bestAreas: [
        { area: "City centre" },
        { area: "Deansgate" },
      ],
      budgetAreas: [{ area: "Piccadilly", budgetFriendly: true }],
    },
    arrivalTips: [
      "Expect slower dispersal.",
      "Screenshot tickets.",
    ],
  },

  /* Remaining clubs unchanged for brevity */
};

export default premierLeagueLogistics;
