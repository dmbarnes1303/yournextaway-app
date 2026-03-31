import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
 */
const GYG = {
  dublin:
    "https://www.getyourguide.com/en-gb/dublin-l31/?partner_id=MAQJREP&utm_medium=online_publisher",
  galway:
    "https://www.getyourguide.com/en-gb/galway-l804/?partner_id=MAQJREP&utm_medium=online_publisher",
  waterford:
    "https://www.getyourguide.com/en-gb/waterford-l2817/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const leagueOfIrelandPremierCityGuides: Record<string, CityGuide> = {
  dublin: {
    cityId: "dublin",
    name: "Dublin",
    country: "Ireland",
    bookingLinks: {
      thingsToDo: GYG.dublin,
    },
    thingsToDoUrl: GYG.dublin,

    overview:
      "Dublin is the strongest all-round football city in the League of Ireland because it gives you multiple clubs, strong pub culture, easy airport access, and enough walkable neighbourhood variety to make a proper weekend of it. The smart approach is not to treat Dublin like one giant attraction list. Pick a base with easy public transport, split the trip into neighbourhood blocks, and handle matchday like a local: eat and drink in town first, then move toward the ground with buffer time. Do that and the city feels easy rather than messy.",

    topThings: [
      {
        title: "Temple Bar pass-through, not a full night",
        tip: "See it, have one drink if you must, then move elsewhere for better value and less tourist overload.",
      },
      {
        title: "Grafton Street → St Stephen's Green loop",
        tip: "A clean daytime route that helps you orient yourself fast without wasting hours.",
      },
      {
        title: "Trinity College area",
        tip: "Best treated as a city-centre anchor rather than a whole afternoon mission unless you are genuinely doing the main attractions.",
      },
      {
        title: "Guinness Storehouse",
        tip: "Only worth the time if you actually care. If football and pubs matter more, skip the queue and spend the hours better.",
      },
      {
        title: "Kilmainham / Liberties area",
        tip: "Good if you want the city to feel more like Dublin and less like a postcard.",
      },
      {
        title: "Smithfield and Stoneybatter pubs",
        tip: "Better for a more relaxed evening than defaulting to Temple Bar every time.",
      },
      {
        title: "Camden Street nightlife strip",
        tip: "A stronger modern night-out zone if you want energy without pure tourist theatre.",
      },
      {
        title: "Dalymount / Tolka / Richmond local pre-walk",
        tip: "These older Dublin grounds reward arriving early and walking the surrounding streets.",
      },
      {
        title: "Tallaght matchday planning",
        tip: "This is the only Dublin club trip where lazy timing gets punished harder, so sort transport properly.",
      },
      {
        title: "Morning coffee and river walk",
        tip: "A simple reset after a late night and usually a better use of time than chasing one more attraction.",
      },
    ],

    tips: [
      "Dublin works best when you plan by area, not by random attraction order.",
      "City centre is the easiest base for Bohs, Shels, and St Pat's. Tallaght needs more deliberate transport planning.",
      "Avoid building your whole weekend around Temple Bar unless you enjoy paying extra for less.",
      "The best football weekends here combine one strong daytime block, one proper pub session, and one well-timed matchday route.",
      "For League of Ireland travel, Dublin is the easiest city in the project to do without a car.",
    ],

    food: [
      "Traditional pubs with decent kitchens rather than tourist-trap menus",
      "Modern Irish bistros if you want one stronger dinner booking",
      "Camden Street casual dining",
      "Stoneybatter for better-value local options",
      "Late takeaway only if you accept Dublin city-centre late-night standards are uneven",
    ],

    transport:
      "Dublin is manageable on foot in the centre, with buses, Luas tram routes, and taxis filling the gaps. Dalymount, Tolka, and Richmond are all relatively easy from a central base. Tallaght is the one that needs proper timing rather than improvisation. Dublin Airport access is a major plus and makes this the cleanest League of Ireland weekend for most travellers.",

    accommodation:
      "City centre is the safest all-round base. Smithfield, Stoneybatter, or around the south side of the centre can work very well if you want pubs and easier breathing room. Stay central if you want to mix football with nightlife properly. Do not stay near Tallaght just because there is a match there; it makes the rest of the trip worse.",
  },

  derry: {
    cityId: "derry",
    name: "Derry",
    country: "Ireland",

    overview:
      "Derry is one of the best destination-led football trips in the League of Ireland because the city already has strong identity before you even get to the football. The walls, compact centre, pubs, and political-historical atmosphere give the place a seriousness and texture many domestic football towns simply do not have. The correct way to do Derry is simple: stay central, walk everywhere, and let the city and club reinforce each other instead of overplanning the weekend.",

    topThings: [
      {
        title: "City walls walk",
        tip: "Do this early. It is the fastest way to understand the city properly.",
      },
      {
        title: "Guildhall and central square area",
        tip: "Good anchor point before deciding whether you want history, pubs, or football next.",
      },
      {
        title: "Bogside murals and political-history walk",
        tip: "Worth doing properly. Do not reduce it to a few rushed photos.",
      },
      {
        title: "Peace Bridge route",
        tip: "Best as part of a wider evening or morning city loop rather than a standalone event.",
      },
      {
        title: "Traditional pub session in the centre",
        tip: "Derry works best when you let the city’s pub culture do some of the heavy lifting.",
      },
      {
        title: "Brandywell early arrival",
        tip: "One of the better League of Ireland grounds for feeling the local build-up if you do not turn up late.",
      },
      {
        title: "Post-match city-centre return",
        tip: "The city is compact enough that the football and evening flow together naturally.",
      },
      {
        title: "Riverside walk",
        tip: "Good reset if you stayed overnight and want one calmer block before leaving.",
      },
      {
        title: "One strong dinner booking",
        tip: "Worth it here. The city can carry a proper football weekend, not just a rushed pint-and-pie stop.",
      },
      {
        title: "Morning-after compact city loop",
        tip: "Derry rewards one more hour on foot before departure more than another overplanned attraction.",
      },
    ],

    tips: [
      "Derry is one of the strongest all-round away-style city breaks in the league.",
      "Stay in the city centre. There is no need to get clever with location here.",
      "The football trip works best when you actually give the city time and do not reduce it to stadium-only.",
      "Brandywell is close enough to the centre that the whole weekend feels walkable and smooth.",
      "One overnight is good. Two can be even better if you want the city to breathe properly.",
    ],

    food: [
      "Traditional pubs with proper food",
      "Central bistro-style dinners",
      "Simple pre-match pub meals rather than chain defaults",
      "Coffee and bakery stops around the centre",
      "A stronger sit-down dinner if you are turning it into a full city break",
    ],

    transport:
      "Derry is one of the easiest cities in the project once you arrive. The centre is compact, the Brandywell is close, and walking does most of the work. Taxis are there if needed, but the real strength is that you often do not need them. City of Derry Airport is close enough to keep the trip practical.",

    accommodation:
      "Stay in the city centre or just off it. That gives you pubs, history, and easy stadium access all in one. Anything outside the centre is usually making the trip worse for no good reason.",
  },

  drogheda: {
    cityId: "drogheda",
    name: "Drogheda",
    country: "Ireland",

    overview:
      "Drogheda is a football-first town stop rather than a polished destination weekend. That is not a flaw, it is just the reality. If you approach it honestly, it works well enough: compact town, local feel, and an easy enough route from Dublin if you are building a wider Ireland football trip. The mistake would be pretending Drogheda is trying to compete with Dublin or Galway as a weekend city. It is not. It is a grounded club trip.",

    topThings: [
      {
        title: "Town-centre walk",
        tip: "Enough to get the shape of the place without forcing an attraction-heavy plan.",
      },
      {
        title: "River Boyne area",
        tip: "Useful as a short visual reset before food or football.",
      },
      {
        title: "St Laurence Gate / local history stop",
        tip: "Worth a quick look if you want the town to feel more rooted than just a stadium visit.",
      },
      {
        title: "Simple local pub session",
        tip: "This is the right kind of city for keeping it local rather than over-curating the night.",
      },
      {
        title: "Weavers Park early arrival",
        tip: "Because the ground is small, arriving with time helps the matchday feel more complete.",
      },
      {
        title: "Post-match town-centre drink",
        tip: "A better move than rushing straight out unless you are commuting back to Dublin immediately.",
      },
      {
        title: "One practical dinner booking",
        tip: "Do not overthink it. Just choose one decent place and keep the trip smooth.",
      },
      {
        title: "Morning coffee before moving on",
        tip: "Best if Drogheda is one stop in a wider route rather than your entire weekend.",
      },
      {
        title: "Short overnight football stop",
        tip: "This is the correct rhythm for Drogheda if you are staying over at all.",
      },
      {
        title: "Dublin-linked routing",
        tip: "Often the smartest way to do Drogheda is as part of a bigger Dublin-based football weekend.",
      },
    ],

    tips: [
      "Drogheda is a football stop, not a luxury city break.",
      "A Dublin base can work well if you want stronger hotel and nightlife options.",
      "Stay local only if you want the matchday to feel more rooted and less commuter-style.",
      "Weavers Park works best when you treat it as a compact local-club experience.",
      "Keep plans simple and the trip is perfectly decent.",
    ],

    food: [
      "Local pubs with solid basic food",
      "Simple central dinners",
      "Coffee stops in the town centre",
      "Practical pre-match food rather than destination dining",
    ],

    transport:
      "Drogheda is manageable, but this is not a city where complicated transport planning makes sense. Keep the centre as your anchor and the football piece becomes straightforward. Dublin Airport distance also makes it usable for route-building, even if many visitors will choose to base elsewhere.",

    accommodation:
      "Drogheda town centre is fine if the football is your main point. Dublin is the stronger wider base if you want nightlife, more hotel choice, and a bigger-city feel around the match.",
  },

  galway: {
    cityId: "galway",
    name: "Galway",
    country: "Ireland",
    bookingLinks: {
      thingsToDo: GYG.galway,
    },
    thingsToDoUrl: GYG.galway,

    overview:
      "Galway is one of the best overall away-style trips in the League of Ireland because it is a genuinely strong city break on its own, then adds football on top. The pubs, walkability, compact centre, and atmosphere make it one of the easiest places in the project to enjoy even if the fixture ends up being average. The smart move is staying central, building the weekend around the city first, and treating the match as the anchor rather than the whole plan.",

    topThings: [
      {
        title: "Latin Quarter pub and street loop",
        tip: "This is the city’s biggest strength, so actually give it time.",
      },
      {
        title: "Spanish Arch and riverside area",
        tip: "Good first stop to settle into Galway without overcommitting time.",
      },
      {
        title: "Eyre Square base point",
        tip: "Useful navigation anchor, not where you spend your whole day.",
      },
      {
        title: "Traditional music pub session",
        tip: "A major part of why Galway works so well as a football weekend.",
      },
      {
        title: "Salthill add-on",
        tip: "Worth it if the weather is decent and you want a slightly broader city feel.",
      },
      {
        title: "Pre-match central food stop",
        tip: "Eat in town and then move out. Do not waste prime Galway time hanging around too early by the ground.",
      },
      {
        title: "Eamonn Deacy Park approach",
        tip: "Straightforward enough from the centre if you stay disciplined with timing.",
      },
      {
        title: "Post-match city-centre return",
        tip: "Galway is one of the best cities in the league for carrying the night onward after football.",
      },
      {
        title: "Morning-after coffee and walk",
        tip: "Galway rewards a slower final morning better than a rushed checkout sprint.",
      },
      {
        title: "One good dinner booking",
        tip: "Worth doing here because the city is good enough to support a proper weekend meal.",
      },
    ],

    tips: [
      "Galway is one of the strongest city-guide entries in the whole League of Ireland set.",
      "Stay central. The whole point is that the city works on foot.",
      "This is one of the few league trips where two nights can make complete sense.",
      "Football plus pubs plus walkability is the winning formula. Do not overcomplicate it.",
      "If someone wants the best pure city-break trip in the league, Galway is right near the top.",
    ],

    food: [
      "Traditional pubs with music and proper food",
      "Seafood if you want the obvious local win",
      "Casual bistro and modern Irish dining in the centre",
      "Coffee and bakery stops around Eyre Square and the Latin Quarter",
      "Late-night simple food after the pubs",
    ],

    transport:
      "Galway is best because it is simple. The centre is walkable, and once you are in town you rarely need complicated transport. Eamonn Deacy Park is close enough that the football side can be folded into the wider weekend without stress.",

    accommodation:
      "Stay in or just off the city centre. Eyre Square, the Latin Quarter, or any central riverside spot works well. The city is at its best when you can walk between football, food, and pubs without thinking about logistics.",
  },

  sligo: {
    cityId: "sligo",
    name: "Sligo",
    country: "Ireland",

    overview:
      "Sligo is one of the better smaller-town football breaks in the league because the place itself has enough atmosphere and scenery to stop the weekend feeling flat. It is not as strong a city break as Galway and not as easy as Dublin, but it does have a distinct west-of-Ireland feel that improves the football trip if you lean into it properly. The smart plan is one overnight, central stay, and a relaxed pace instead of trying to cram too much into a small place.",

    topThings: [
      {
        title: "Town-centre wander",
        tip: "Best first move to get your bearings and settle the pace of the trip.",
      },
      {
        title: "Garavogue riverfront walk",
        tip: "Good short reset before food, pubs, or football.",
      },
      {
        title: "Traditional pub stop",
        tip: "Sligo’s pub culture is part of what makes the trip worthwhile.",
      },
      {
        title: "Yeats-related town landmarks",
        tip: "Worth a short look if you want the place to feel more grounded in its own identity.",
      },
      {
        title: "Coastal or scenic add-on",
        tip: "Only if you have transport or extra time. Do not force it into a rushed matchday.",
      },
      {
        title: "Pre-match central meal",
        tip: "The town is compact enough that staying central keeps everything easy.",
      },
      {
        title: "The Showgrounds early arrival",
        tip: "A smart move because the local-ground feel is part of the appeal here.",
      },
      {
        title: "Post-match pub return",
        tip: "One of those towns where football and pub rhythm fit together naturally.",
      },
      {
        title: "Morning-after slow reset",
        tip: "A better use of time than trying to squeeze in random extra attractions.",
      },
      {
        title: "One-night football town stay",
        tip: "Usually the ideal tempo for Sligo.",
      },
    ],

    tips: [
      "Sligo is a strong football-town stop, not a giant attraction city.",
      "Stay central and keep the weekend walkable.",
      "The best version of this trip is football plus pubs plus a bit of scenery.",
      "Do not overplan. Smaller places punish that.",
      "Very good choice for travellers who want a more relaxed League of Ireland weekend.",
    ],

    food: [
      "Traditional pub food",
      "Simple town-centre bistro meals",
      "Coffee and pastries in the centre",
      "A decent evening meal rather than endless stop-start grazing",
    ],

    transport:
      "Sligo centre is compact enough that walking does most of the work. The Showgrounds is manageable from a central base, and the town is one of those places where a simple plan always beats a clever one.",

    accommodation:
      "Stay in Sligo town centre. That gives you pubs, food, and easy enough stadium movement. Anything else usually creates unnecessary friction.",
  },

  waterford: {
    cityId: "waterford",
    name: "Waterford",
    country: "Ireland",
    bookingLinks: {
      thingsToDo: GYG.waterford,
    },
    thingsToDoUrl: GYG.waterford,

    overview:
      "Waterford is a practical football city with more historical character than some people expect. It is not trying to be Galway, and it should not be judged like that. What it does offer is a manageable centre, some real city history, and a football stop that works cleanly if approached as a one-night or football-led break. The right way to do Waterford is to stay central, keep the itinerary light, and let the city’s older character add texture around the match.",

    topThings: [
      {
        title: "Viking Triangle area",
        tip: "The clearest starting point if you want the city to feel like more than a stadium run.",
      },
      {
        title: "Medieval Museum / Reginald's Tower zone",
        tip: "Pick one or two things properly rather than speed-running all of it badly.",
      },
      {
        title: "Quays and riverfront walk",
        tip: "Best as a simple daytime block or post-breakfast reset.",
      },
      {
        title: "Central pub session",
        tip: "Waterford works better with one grounded local session than with overplanned nightlife hops.",
      },
      {
        title: "Simple old-city wander",
        tip: "The place rewards slower walking more than checklist tourism.",
      },
      {
        title: "Pre-match central dinner",
        tip: "Eat in town before heading out. It keeps the whole football day cleaner.",
      },
      {
        title: "Regional Sports Centre approach",
        tip: "Treat the stadium as the football task, not the heart of the wider city experience.",
      },
      {
        title: "Post-match central return",
        tip: "Better if you want the city to remain part of the trip after full-time.",
      },
      {
        title: "Morning historic-core loop",
        tip: "A strong final-hour move before departure if you only stayed one night.",
      },
      {
        title: "One-night football city stop",
        tip: "Usually the right rhythm for Waterford.",
      },
    ],

    tips: [
      "Waterford is best approached as a football-first overnight with some genuine city history around it.",
      "Stay in the centre. The football venue is not the place to build your whole trip around.",
      "The city adds more value than outsiders sometimes assume, but it is still not a giant nightlife destination.",
      "Good weather improves the riverfront side of the trip a lot.",
      "Keep the weekend simple and it works well enough.",
    ],

    food: [
      "Traditional pubs with good kitchens",
      "Simple central dinners",
      "Coffee and bakery stops in the centre",
      "A proper sit-down meal if you are doing one overnight only",
    ],

    transport:
      "Waterford works best from a central base. The city centre is the anchor, and the stadium movement is simple enough from there. This is not a city where transport should become a major problem unless you make bad location choices.",

    accommodation:
      "Waterford city centre is the best base. It gives you the history, the food, and the easiest matchday logic all together. There is little value in staying away from the centre unless price forces the issue.",
  },
};

export default leagueOfIrelandPremierCityGuides;
