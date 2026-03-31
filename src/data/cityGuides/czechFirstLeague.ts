import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate city entry points.
 * Keep this city-led and practical.
 */
const GYG = {
  prague:
    "https://www.getyourguide.com/en-gb/prague-l10/?partner_id=MAQJREP&utm_medium=online_publisher",
  plzen:
    "https://www.getyourguide.com/en-gb/plzen-l32572/?partner_id=MAQJREP&utm_medium=online_publisher",
  olomouc:
    "https://www.getyourguide.com/en-gb/olomouc-l32500/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const czechFirstLeagueCityGuides: Record<string, CityGuide> = {
  prague: {
    cityId: "prague",
    name: "Prague",
    country: "Czech Republic",
    bookingLinks: {
      thingsToDo: GYG.prague,
    },
    thingsToDoUrl: GYG.prague,

    overview:
      "Prague is one of the strongest football city-breaks in the whole app because the city is already elite before you even add the match. The correct formula is simple: stay central or in Vinohrady, treat football as one anchor in a wider weekend, and avoid wasting time on cross-city zig-zagging. Prague rewards compact planning, tram discipline, and doing fewer things properly instead of trying to collect every tourist cliché in one day.",

    topThings: [
      {
        title: "Old Town Square and Astronomical Clock",
        tip: "Do it early or late. Midday crowds make it worse than it actually is.",
      },
      {
        title: "Charles Bridge walk",
        tip: "Sunrise or late evening is the smart move. Midday is tourist traffic, not atmosphere.",
      },
      {
        title: "Prague Castle and Hradčany",
        tip: "Give it a proper block of time. Rushing this area is pointless.",
      },
      {
        title: "Malá Strana wander",
        tip: "One of the best areas for slower walking and better photo spots without constant chaos.",
      },
      {
        title: "Vinohrady bars and cafés",
        tip: "Best if you want Prague without wall-to-wall tourist nonsense.",
      },
      {
        title: "Letná beer garden / viewpoint",
        tip: "Great for a relaxed pre-evening stop, especially in decent weather.",
      },
      {
        title: "Wenceslas Square area",
        tip: "Useful as a connector and practical hub, not as your main cultural plan.",
      },
      {
        title: "Jewish Quarter",
        tip: "Worth doing properly, not as a rushed add-on between random stops.",
      },
      {
        title: "Local pub session",
        tip: "Walk one or two streets off the major tourist drag and the value improves immediately.",
      },
      {
        title: "Prague derby or smaller-club matchday build-up",
        tip: "Prague is one of the few cities where you can choose different football experiences without changing hotel base.",
      },
    ],

    tips: [
      "Old Town is convenient but more tourist-heavy than it needs to be.",
      "Vinohrady is one of the smartest bases in the entire app.",
      "Use trams and metro properly; taxis are often wasted money here.",
      "Do not overstuff Prague. Two strong day blocks beat six rushed landmarks.",
      "Sparta, Slavia and Bohemians all work from one Prague base, which makes fixture selection more flexible.",
    ],

    food: [
      "Traditional Czech pubs with proper mains rather than snack-only stops",
      "Beer halls away from the most obvious tourist traps",
      "Vinohrady brunch and café culture",
      "Heavier local food for one meal, not every meal",
      "Late beers in neighbourhood bars rather than only Old Town venues",
    ],

    transport:
      "Prague is one of the easiest cities in the project for public transport. Metro and trams do nearly all the heavy lifting if you stay central. Old Town, New Town, Vinohrady, Malá Strana and Letná all connect well enough that bad planning is usually the only real mistake.",

    accommodation:
      "Vinohrady is the smartest all-round base. Old Town is convenient but more expensive and busier. Malá Strana is scenic but less practical for nightlife. If football is part of a wider city break, central Prague beats staying near any stadium.",
  },

  plzen: {
    cityId: "plzen",
    name: "Plzeň",
    country: "Czech Republic",
    bookingLinks: {
      thingsToDo: GYG.plzen,
    },
    thingsToDoUrl: GYG.plzen,

    overview:
      "Plzeň is one of those cities people underestimate because they frame it only as a football stop or beer brand destination. That is lazy. The city is compact, easy, and genuinely useful for a one- or two-night football break. The right version of Plzeň is simple: centre-based stay, proper beer-and-food rhythm, then Viktoria as the anchor.",

    topThings: [
      {
        title: "Pilsner Urquell Brewery",
        tip: "Obvious, yes, but still worth doing properly once rather than pretending you are above it.",
      },
      {
        title: "Republic Square",
        tip: "Best as your central orientation point rather than a long stop in itself.",
      },
      {
        title: "Cathedral tower viewpoint",
        tip: "Worth it on a clear day. Skip if the weather is poor and your schedule is tight.",
      },
      {
        title: "Historic centre wander",
        tip: "Compact enough to do without pressure. That is one of the city’s strengths.",
      },
      {
        title: "Beer hall dinner",
        tip: "This city punishes anyone trying to eat generic chain food.",
      },
      {
        title: "Viktoria matchday build-up",
        tip: "Keep it centre-first, stadium-second. That is the cleanest flow.",
      },
      {
        title: "Underground / historic cellars tour",
        tip: "Good if you want one non-football indoor block without wasting half the day.",
      },
      {
        title: "Evening central pub circuit",
        tip: "Small enough to keep simple. No need to overplan it.",
      },
      {
        title: "Local café stop",
        tip: "Useful for slowing the trip down rather than just drinking through it.",
      },
      {
        title: "One-night football city break",
        tip: "That is the ideal way to frame Plzeň for most users.",
      },
    ],

    tips: [
      "Staying central is the obvious move.",
      "Plzeň works best as one or two nights, not a longer city break.",
      "The city-centre-to-stadium flow is easy if you do not complicate it.",
      "This is one of the better non-capital football weekends in this route.",
      "Beer tourism and football fit together naturally here, but do not make the whole trip about one thing.",
    ],

    food: [
      "Classic Czech pub food",
      "Beer hall dining",
      "Central café breakfasts",
      "Simple local grills and tavern-style spots",
    ],

    transport:
      "Plzeň is easy. Stay central and most of the trip becomes walkable, with simple local transport or short taxis if needed. The whole point is low friction.",

    accommodation:
      "City centre or near the main station are the right choices. Centre is better for trip feel; station is better for pure rail practicality.",
  },

  ostrava: {
    cityId: "ostrava",
    name: "Ostrava",
    country: "Czech Republic",

    overview:
      "Ostrava is not a polished fairy-tale city break and trying to sell it like Prague-lite would be stupid. Its value is different: edge, football culture, industrial character, and a matchday that feels more serious than cute. If you want something grittier and more football-led, Ostrava is one of the strongest specialist trips in the Czech set.",

    topThings: [
      {
        title: "Stodolní area evening",
        tip: "Best nightlife cluster, but go in with realistic expectations rather than inflated hype.",
      },
      {
        title: "Lower Vítkovice",
        tip: "The most distinctive non-football thing in the city. Worth doing if you want character.",
      },
      {
        title: "Masaryk Square / centre loop",
        tip: "Good for orientation, not for pretending the centre is endlessly deep.",
      },
      {
        title: "Baník matchday build-up",
        tip: "The football is the main reason to be here. Lean into that.",
      },
      {
        title: "Industrial heritage block",
        tip: "This is where Ostrava becomes more interesting than casual visitors expect.",
      },
      {
        title: "Pre-match pub stop",
        tip: "Choose local and practical over polished and overpriced.",
      },
      {
        title: "Simple overnight city break",
        tip: "One or two nights is usually enough unless the fixture is the main obsession.",
      },
      {
        title: "Neighbourhood beer session",
        tip: "Better when it feels local, not when you try to force tourist polish.",
      },
      {
        title: "Football-first weekend",
        tip: "Ostrava improves when you accept what it is rather than what it isn’t.",
      },
      {
        title: "Regional rail / road stop",
        tip: "Useful if you are building a broader central-European football run.",
      },
    ],

    tips: [
      "This is a football trip first, city-break second.",
      "Best for people who like rougher-edged football weekends.",
      "One or two nights is enough for most users.",
      "Stay central and keep logistics simple.",
      "Baník is the real headline product here, not generic sightseeing.",
    ],

    food: [
      "Local pubs",
      "Hearty Czech food",
      "Simple beer-led meals",
      "Casual centre restaurants before matchday",
    ],

    transport:
      "Ostrava is manageable if you stay central and plan the stadium move. Do not assume everything is as compact as Prague. Build a bit more travel buffer.",

    accommodation:
      "Central Ostrava is the safest choice. Stodolní works if nightlife matters. This is not a place to overcomplicate base selection.",
  },

  olomouc: {
    cityId: "olomouc",
    name: "Olomouc",
    country: "Czech Republic",
    bookingLinks: {
      thingsToDo: GYG.olomouc,
    },
    thingsToDoUrl: GYG.olomouc,

    overview:
      "Olomouc is one of the best underrated city-break football stops in the entire project. It has enough beauty, enough food value, and enough compactness to feel like a proper trip without the burden of big-city friction. Sigma gives it football substance, but the city itself is already strong enough to justify the stop.",

    topThings: [
      {
        title: "Holy Trinity Column and main square",
        tip: "Use it as the heart of the city, not just a photo stop.",
      },
      {
        title: "Astronomical Clock area",
        tip: "Worth folding into the centre walk rather than treating as a separate mission.",
      },
      {
        title: "Historic centre wander",
        tip: "One of the easiest city-centre strolls in this whole project.",
      },
      {
        title: "Sigma matchday block",
        tip: "A neat, easy football add-on because the city is so manageable.",
      },
      {
        title: "Café and bar session in the old town",
        tip: "This city works best at a slower pace.",
      },
      {
        title: "Cathedral visit",
        tip: "Worth doing if you want one proper non-football landmark block.",
      },
      {
        title: "Local beer and dinner",
        tip: "Easy city for one strong meal and one relaxed evening.",
      },
      {
        title: "Short cultural weekend",
        tip: "That is exactly the right framing here.",
      },
      {
        title: "Central square evening loop",
        tip: "Simple and effective without needing a complicated itinerary.",
      },
      {
        title: "One- or two-night football break",
        tip: "Arguably the perfect length for Olomouc.",
      },
    ],

    tips: [
      "Olomouc is stronger than most people expect.",
      "Stay in or near the historic centre.",
      "This is one of the best smaller-city football weekends in the app.",
      "Do not overplan it; the city is good because it is easy.",
      "Sigma plus the old town is already enough for a quality trip.",
    ],

    food: [
      "Historic-centre restaurants",
      "Czech pub classics",
      "Old-town cafés",
      "Beer-led evening dining",
    ],

    transport:
      "Olomouc is easy if you stay central. Once you arrive, the city is compact enough that most of the weekend feels low-friction.",

    accommodation:
      "Historic centre is the obvious best base. Near the station is fine for practicality, but central is better for trip quality.",
  },

  liberec: {
    cityId: "liberec",
    name: "Liberec",
    country: "Czech Republic",

    overview:
      "Liberec is more niche than Prague or Plzeň, but it has a useful football-weekend shape if you want a smaller northern stop with some scenery and a slightly different feel. The key is not to oversell it. This is a regional football trip with city-and-mountain-side upside, not a giant marquee away weekend.",

    topThings: [
      {
        title: "Old town and centre walk",
        tip: "Short but worthwhile. Enough for a solid town-centre block.",
      },
      {
        title: "Ještěd extension",
        tip: "Worth it if weather and timing allow; one of the city’s main extra-value plays.",
      },
      {
        title: "Slovan matchday",
        tip: "The football is still the main anchor of the trip.",
      },
      {
        title: "Town square coffee stop",
        tip: "Good for slowing the pace and letting the city work for you.",
      },
      {
        title: "Regional mountain feel",
        tip: "This is one of the reasons Liberec stands out from generic smaller-league stops.",
      },
      {
        title: "Simple overnight stay",
        tip: "Best for one or two nights, not a long urban weekend.",
      },
      {
        title: "Local pub dinner",
        tip: "Keep it practical and local rather than chasing false polish.",
      },
      {
        title: "Bus-station-linked stop",
        tip: "This can work well as part of a broader regional itinerary.",
      },
      {
        title: "Weather-dependent scenic block",
        tip: "The city benefits from clear-weather timing more than some others.",
      },
      {
        title: "Football plus northern-Czech routing",
        tip: "That is the right product framing here.",
      },
    ],

    tips: [
      "Better as a niche football weekend than a mainstream city break.",
      "One or two nights is enough.",
      "Good if combined with wider northern travel.",
      "Stay central and keep it simple.",
      "Ještěd is the main non-football multiplier if conditions are right.",
    ],

    food: [
      "Town-centre pubs",
      "Simple Czech meals",
      "Casual cafés",
      "Beer-focused evening spots",
    ],

    transport:
      "Liberec is easiest when treated as a compact regional stop. Once in town, keep the base central and avoid unnecessary movement.",

    accommodation:
      "Town centre is the best base. You are not gaining much by staying elsewhere.",
  },

  "mlada-boleslav": {
    cityId: "mlada-boleslav",
    name: "Mladá Boleslav",
    country: "Czech Republic",

    overview:
      "Mladá Boleslav is a functional football stop. That is the honest truth. It is not the place to oversell with fake romance. The right framing is a practical, smaller club trip that works best either as a one-night stop or as a Prague-linked side mission.",

    topThings: [
      {
        title: "Town-centre walk",
        tip: "Enough for orientation, not enough to justify fantasy-itinerary nonsense.",
      },
      {
        title: "Local pre-match meal",
        tip: "Keep it simple and central.",
      },
      {
        title: "FK Mladá Boleslav matchday",
        tip: "The football is the clear reason to be here.",
      },
      {
        title: "Short overnight stop",
        tip: "This is the correct scale of trip for most people.",
      },
      {
        title: "Prague side-trip logic",
        tip: "Often the smarter overall travel frame if timings work.",
      },
      {
        title: "Town-square coffee",
        tip: "Good for a low-pressure stop rather than forced sightseeing.",
      },
      {
        title: "Simple evening pub session",
        tip: "No need to make this more complex than it is.",
      },
      {
        title: "Regional football routing",
        tip: "Useful if you are doing a broader Czech football run.",
      },
      {
        title: "Centre-based stay",
        tip: "Anything else is usually pointless.",
      },
      {
        title: "One-game football mission",
        tip: "That is the product. Keep it honest.",
      },
    ],

    tips: [
      "Functional, not glamorous.",
      "Best as a Prague-linked side trip or short stop.",
      "Stay central if sleeping over.",
      "Do not oversell the city itself.",
      "Useful for coverage depth, not flagship marketing.",
    ],

    food: [
      "Simple local pubs",
      "Town-centre grills",
      "Basic Czech dining",
      "Short pre-match café stop",
    ],

    transport:
      "This is a practical trip. Treat it that way. Arrival, centre, match, overnight if needed, move on.",

    accommodation:
      "Town centre only. If you want a more complete city-break experience, stay in Prague instead.",
  },

  "hradec-kralove": {
    cityId: "hradec-kralove",
    name: "Hradec Králové",
    country: "Czech Republic",

    overview:
      "Hradec Králové is a cleaner, more pleasant stop than many people will assume from just reading the league table. It is not a giant football-tourism product, but it has enough order, enough compactness, and enough city-centre usability to work well as a short football break.",

    topThings: [
      {
        title: "Main square and centre loop",
        tip: "A neat, easy orientation block without much friction.",
      },
      {
        title: "Cathedral / historic core",
        tip: "Worth doing if you want one proper non-football city block.",
      },
      {
        title: "Malšovická Arena matchday",
        tip: "The newer stadium improves the overall trip feel a lot.",
      },
      {
        title: "Riverside / short walk",
        tip: "Useful as a relaxed reset if you have the time.",
      },
      {
        title: "Central pub dinner",
        tip: "Best kept simple and local.",
      },
      {
        title: "One-night football break",
        tip: "The ideal framing here.",
      },
      {
        title: "Pre-match central coffee",
        tip: "Good way to slow the day down and avoid rushing.",
      },
      {
        title: "Compact city wandering",
        tip: "The city works because it is manageable, not because it is endless.",
      },
      {
        title: "Regional stopover",
        tip: "Useful in a broader Czech or central-European trip.",
      },
      {
        title: "Short city-plus-football rhythm",
        tip: "That is what this destination does well.",
      },
    ],

    tips: [
      "A tidy short-stop football city.",
      "Best as one night or a compact two-night stay.",
      "The newer stadium helps the whole product.",
      "Stay central and walk where possible.",
      "Not a flagship destination, but better than a purely functional stop.",
    ],

    food: [
      "Central pubs",
      "Traditional Czech meals",
      "Simple cafés",
      "Low-key beer spots",
    ],

    transport:
      "Easy if you keep the stay central. The city’s main advantage is that it is not hard work.",

    accommodation:
      "City centre or near the main square is the right move. Keep the trip compact.",
  },

  teplice: {
    cityId: "teplice",
    name: "Teplice",
    country: "Czech Republic",

    overview:
      "Teplice is not a glamour football weekend. It is a useful regional football stop that can work either as a local overnight or as a Prague-linked plan depending on timings. The mistake would be trying to market it like Prague or Olomouc. It is not that. It is a practical football stop with just enough local city substance to make sense.",

    topThings: [
      {
        title: "Town-centre walk",
        tip: "Enough for a solid orientation block without pretending there is huge depth.",
      },
      {
        title: "Spa-town feel",
        tip: "This is one of the more distinctive non-football angles of the city.",
      },
      {
        title: "Teplice matchday",
        tip: "The football remains the central reason to visit.",
      },
      {
        title: "Local dinner and pub stop",
        tip: "Simple and central usually works best.",
      },
      {
        title: "Short overnight stay",
        tip: "One night is the natural scale for most users.",
      },
      {
        title: "Prague-linked side trip",
        tip: "Often the smarter overall travel move if schedule and transport suit.",
      },
      {
        title: "Town-square coffee stop",
        tip: "Useful for slowing the trip down without trying to overbuild it.",
      },
      {
        title: "Regional football routing",
        tip: "Best used in a broader itinerary rather than sold alone as a major destination.",
      },
      {
        title: "Simple centre-based weekend",
        tip: "Keep the trip low-friction.",
      },
      {
        title: "Football-first stop",
        tip: "That is the correct expectation.",
      },
    ],

    tips: [
      "Functional and regional rather than premium.",
      "One night is enough for most travellers.",
      "Can work as a Prague-based side trip.",
      "Stay central if you are sleeping over.",
      "Do not overcomplicate this destination.",
    ],

    food: [
      "Town-centre pubs",
      "Traditional Czech food",
      "Simple pre-match meals",
      "Casual local bars",
    ],

    transport:
      "Treat Teplice as a practical move. Stay central, do the town on foot, and keep matchday simple.",

    accommodation:
      "Teplice centre if staying locally. Prague if the wider trip matters more than local immersion.",
  },
};

export default czechFirstLeagueCityGuides;
