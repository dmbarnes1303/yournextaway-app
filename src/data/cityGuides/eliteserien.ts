import type { CityGuide } from "./types";

const GYG = {
  oslo: "https://www.getyourguide.com/en-gb/oslo-l38/?partner_id=MAQJREP&utm_medium=online_publisher",
  bergen: "https://www.getyourguide.com/en-gb/bergen-l1132/?partner_id=MAQJREP&utm_medium=online_publisher",
  trondheim: "https://www.getyourguide.com/en-gb/trondheim-l32375/?partner_id=MAQJREP&utm_medium=online_publisher",
  stavanger: "https://www.getyourguide.com/en-gb/stavanger-l4561/?partner_id=MAQJREP&utm_medium=online_publisher",
  tromso: "https://www.getyourguide.com/en-gb/tromso-l32375/?partner_id=MAQJREP&utm_medium=online_publisher",
  alesund: "https://www.getyourguide.com/en-gb/alesund-l4559/?partner_id=MAQJREP&utm_medium=online_publisher",
  kristiansand: "https://www.getyourguide.com/en-gb/kristiansand-l32378/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const eliteserienCityGuides: Record<string, CityGuide> = {
  oslo: {
    cityId: "oslo",
    name: "Oslo",
    country: "Norway",
    thingsToDoUrl: GYG.oslo,
    overview:
      "Oslo is one of the easiest football weekends in the app because it gives you scale without chaos. You get a proper capital city, reliable transport, strong hotel stock, and two very different football experiences in Vålerenga and KFUM. The trick is not overcomplicating it: stay central, keep your day grouped by area, and treat stadium travel as a short transport move rather than a relocation exercise.",

    topThings: [
      { title: "Aker Brygge and waterfront", tip: "Best early-evening area if you want clean visuals and easy food options." },
      { title: "Opera House roof", tip: "Worth doing once; quick payoff, no need to overthink it." },
      { title: "Bjørvika walk", tip: "Good modern-city reset before bars or football." },
      { title: "Grønland food stop", tip: "Better value and more character than default tourist strips." },
      { title: "Karl Johans gate loop", tip: "Useful for orientation, not where you spend your whole day." },
      { title: "Vigeland Park", tip: "Good if the weather is decent and you want a longer daytime block." },
      { title: "Munch Museum option", tip: "Pick it if you actually care; do not force museum time for the sake of it." },
      { title: "Pre-match central pub session", tip: "Much smarter than trying to build the whole day around the ground area." },
      { title: "Post-match city-centre reset", tip: "Head back central; Oslo rewards keeping the night moving." },
      { title: "Harbour sunrise or late walk", tip: "A good final-hour move if you stayed over." },
    ],

    tips: [
      "Stay central or in Bjørvika/Grønland rather than near the stadiums.",
      "Vålerenga is the bigger football experience; KFUM is the niche contrast option.",
      "Public transport is strong enough that taxis are often unnecessary.",
      "Oslo is expensive, so be deliberate with food and hotel choices.",
      "A full football weekend works better than a rushed one-night hit-and-run.",
    ],

    food: [
      "Grønland for better-value and broader food options",
      "Waterfront dining if you want a cleaner polished evening",
      "Burgers and casual pre-match food centrally",
      "Coffee and bakery stops across the central core",
      "Late drinks and small plates in the city centre",
    ],

    transport:
      "Oslo’s public transport is excellent by football-trip standards. Intility Arena is simple from the centre, while KFUM Arena is best treated as an Oslo trip first and a smaller local-ground move second. Oslo Central remains the obvious anchor point for almost everything.",

    accommodation:
      "City centre, Bjørvika, or Grønland are the strongest bases. You get transport, nightlife, and easy onward movement without sacrificing the wider city-break feel. There is very little logic in staying hyper-close to either ground unless the hotel deal is exceptional.",
  },

  bergen: {
    cityId: "bergen",
    name: "Bergen",
    country: "Norway",
    thingsToDoUrl: GYG.bergen,
    overview:
      "Bergen is one of the strongest football cities in the whole Norway section because the city itself is already a proper destination. Brann give you the football reason, but the waterfront, hills, food, and atmosphere do the rest. The smart move is staying central and using light rail properly rather than building the whole trip around the stadium district.",

    topThings: [
      { title: "Bryggen waterfront", tip: "Yes it is obvious, but it is obvious for a reason." },
      { title: "Fløibanen / Mount Fløyen", tip: "Do it early if the weather is clear; visibility is the whole point." },
      { title: "Fish market area", tip: "More useful as a walk-through than as a guaranteed value meal stop." },
      { title: "City-centre bar loop", tip: "Best way to keep a football weekend alive after the match." },
      { title: "Harbour walk in poor weather", tip: "Bergen weather is part of the deal, so plan around it instead of whining." },
      { title: "Bergenhus area", tip: "Good historical stop if you want a daytime block before food or football." },
      { title: "Neighbourhood coffee stop", tip: "Bergen rewards slower wandering more than overstuffed itineraries." },
      { title: "Pre-match central meal", tip: "Eat central, then light rail out. Easier and smarter." },
      { title: "Post-match waterfront reset", tip: "One of the better cities in the app for carrying the evening onward." },
      { title: "Scenic morning before checkout", tip: "Worth it if you stayed overnight; the city looks different in softer light." },
    ],

    tips: [
      "Central Bergen is the right base nearly every time.",
      "Use light rail to the match and stop trying to reinvent the wheel.",
      "Weather matters, so bring proper layers and stop pretending it will sort itself out.",
      "Brann plus Bergen is one of the league’s best all-round combinations.",
      "If picking one Norway weekend from pure city value, Bergen is near the top.",
    ],

    food: [
      "Seafood if you actually want the city’s obvious strength",
      "Casual central burgers and pub meals before football",
      "Waterfront dining for a more polished evening",
      "Coffee and pastries in side streets off the main tourist routes",
      "Late bars and simple post-match food centrally",
    ],

    transport:
      "Bergen is compact enough that central walking handles a lot, and the light rail solves the rest. Brann Stadion is easy from the centre, which is exactly why there is no reason to stay near the ground instead of in the better visitor districts.",

    accommodation:
      "Stay in Bergen city centre or around Bryggen/Vågen if you want the fullest weekend feel. You get easy stadium access, food, nightlife, and far more atmosphere than you would by choosing a purely practical edge-of-city hotel.",
  },

  trondheim: {
    cityId: "trondheim",
    name: "Trondheim",
    country: "Norway",
    thingsToDoUrl: GYG.trondheim,
    overview:
      "Trondheim is one of the best balanced football cities in Norway. It has enough history and character to feel like a proper city break, but it is also simple enough that you do not waste half the trip in transit. Rosenborg give the football trip real weight, and the city gives it enough texture to become more than a stadium stop.",

    topThings: [
      { title: "Bakklandet walk", tip: "One of the most worthwhile low-effort city areas in the league set." },
      { title: "Nidaros Cathedral", tip: "The obvious landmark and very much worth seeing." },
      { title: "Riverfront stroll", tip: "Best as a transition between sightseeing and food rather than a formal activity." },
      { title: "Old Town Bridge", tip: "Quick photo stop, no need to overcomplicate it." },
      { title: "Central food and beer stop", tip: "A strong city for a proper evening rather than rushed chain-food nonsense." },
      { title: "Bakklandet café block", tip: "Ideal if you want the trip to feel calm before matchday intensity." },
      { title: "Pre-match central lunch", tip: "Eat in town and move out later toward the ground." },
      { title: "Lerkendal approach", tip: "Arrive with time; Rosenborg games deserve proper rhythm." },
      { title: "Post-match central drinks", tip: "Much better than disappearing immediately back to the hotel." },
      { title: "Morning city reset", tip: "Useful if you only have one overnight and want the city to register properly." },
    ],

    tips: [
      "Stay centrally or in Bakklandet and keep it simple.",
      "Rosenborg makes this one of the must-do Norway football weekends.",
      "The city is compact enough that overplanning becomes counterproductive.",
      "This is a strong all-round weekend, not just a football-only stop.",
      "One proper overnight is enough, but two is better if you want the city to breathe.",
    ],

    food: [
      "Bakklandet cafés and casual dining",
      "Central Norwegian bistro food",
      "Pub meals before the match",
      "Beer-focused evening stops in the centre",
      "Pastries and coffee the morning after",
    ],

    transport:
      "Trondheim is manageable. Central walking covers a lot, and onward movement to Lerkendal is simple from a central base. The trick is using the centre as your anchor rather than trying to optimise around it.",

    accommodation:
      "Trondheim centre is the safest all-round base. Bakklandet is the more characterful choice if you want the city to feel memorable rather than merely functional. Either works better than staying near the ground unless the hotel deal is exceptional.",
  },

  stavanger: {
    cityId: "stavanger",
    name: "Stavanger",
    country: "Norway",
    thingsToDoUrl: GYG.stavanger,
    overview:
      "Stavanger is one of the better all-round Norwegian football cities because it has both a proper club and a very workable city-break layout. Viking give the football trip weight, while the old town, harbour, and food scene make the rest of the weekend easy. The winning formula is central stay, light planning, and treating the ground as a transport move rather than your whole universe.",

    topThings: [
      { title: "Old Stavanger", tip: "Best done in daylight when the area actually shows itself properly." },
      { title: "Harbourfront walk", tip: "Low-effort and worth it as a reset before dinner or drinks." },
      { title: "Central food scene", tip: "One of the stronger Norwegian football cities for a proper evening meal." },
      { title: "Street-and-waterfront loop", tip: "Good first-day orientation move after check-in." },
      { title: "Coffee stop in the old quarter", tip: "Ideal for slowing the pace before matchday." },
      { title: "Pre-match central pub", tip: "Better than wasting hours in the immediate stadium area." },
      { title: "Jåttåvågen route check", tip: "Know the route once and the whole stadium move becomes effortless." },
      { title: "Post-match central return", tip: "Stavanger rewards keeping the evening alive in town." },
      { title: "Museum or light cultural block", tip: "Fine if the weather turns, but do not overstuff the day." },
      { title: "Morning harbour reset", tip: "Strong final move before travel home." },
    ],

    tips: [
      "Stay central, not by the ground.",
      "Viking plus Stavanger is one of the better-value football weekends in the app.",
      "The city is compact enough that simple planning wins.",
      "You do not need a huge itinerary here; the place carries itself.",
      "Good choice for travellers who want football and a clean, civilised weekend.",
    ],

    food: [
      "Harbour-area dining for a polished evening",
      "Casual burgers and pub food before the game",
      "Seafood if you want something more location-specific",
      "Coffee and bakery stops in the centre",
      "Late drinks in the central core after the match",
    ],

    transport:
      "Stavanger is easy if you use the city centre as the base and rail/public transport to Jåttåvågen or the stadium area. The whole trip becomes much smoother once you stop treating stadium proximity as the top priority.",

    accommodation:
      "Stavanger centre is the correct base nearly every time. Old Stavanger adds more character if the pricing is sensible. There is little upside in staying right by the ground unless the hotel deal is dramatically better.",
  },

  tromso: {
    cityId: "tromso",
    name: "Tromsø",
    country: "Norway",
    thingsToDoUrl: GYG.tromso,
    overview:
      "Tromsø is one of the most distinctive destinations in the whole app, full stop. This is not just a football trip with a city attached; the city itself is a major reason to go. The club, the weather, the latitude, the pace of the place, and the wider travel feel all make it stand out. The main rule is obvious: plan properly, because conditions matter here more than in most football weekends.",

    topThings: [
      { title: "Harbourfront and central walk", tip: "Simple but effective first move after arrival." },
      { title: "Arctic Cathedral area", tip: "Best as a visual stop, not a full-day obsession." },
      { title: "Cable car / viewpoint", tip: "Do it when visibility is good or do not bother." },
      { title: "Northern-light or seasonal tour", tip: "Only if timing and season actually line up. No fantasy planning." },
      { title: "Central bars and restaurants", tip: "Tromsø is better at this than many people assume." },
      { title: "Slow daytime city wander", tip: "The place itself is the attraction; do not rush it." },
      { title: "Pre-match warm indoor stop", tip: "Weather planning is not optional here." },
      { title: "Romssa Arena matchday move", tip: "Keep it simple and leave time for weather variation." },
      { title: "Post-match central evening", tip: "One of the best places in the app for a memorable atmosphere after the game." },
      { title: "Morning Arctic-light walk", tip: "If conditions are good, the city looks incredible with very little effort." },
    ],

    tips: [
      "Treat weather and season as core planning factors, not side notes.",
      "Stay centrally and keep the whole trip walkable or simple.",
      "Tromsø is destination-led; let the city do some of the work.",
      "This is one of the best premium-feel football trips in the whole project.",
      "Do not underpack. That is amateur behaviour and the city will punish it.",
    ],

    food: [
      "Seafood if you want something local and properly memorable",
      "Central bars with good comfort-food options",
      "Coffee-and-pastry stops to break up the day in bad weather",
      "Warm sit-down meals before the match",
      "Late drinks in the centre if conditions allow",
    ],

    transport:
      "Tromsø is manageable if you stay central and stop pretending every trip needs a complicated transport strategy. Short onward moves, simple city-centre anchors, and proper weather-aware timing are the keys.",

    accommodation:
      "Tromsø centre is the only sensible base for most visitors. You want bars, restaurants, easy match movement, and the strongest wider city feel. Remote or overly cheap edge stays are false economy here.",
  },

  alesund: {
    cityId: "alesund",
    name: "Ålesund",
    country: "Norway",
    thingsToDoUrl: GYG.alesund,
    overview:
      "Ålesund is one of the strongest scenic football destinations in the Norway section. Even if the club were smaller than they are, the city would still justify attention. The architecture, water, and overall visual quality lift the whole football trip. The obvious mistake would be trying to rush it like a throwaway match stop.",

    topThings: [
      { title: "Art Nouveau centre walk", tip: "This is the city’s biggest asset, so actually take time over it." },
      { title: "Aksla viewpoint", tip: "Strong payoff if weather behaves; pointless if you rush it badly." },
      { title: "Harbourfront loop", tip: "An easy way to understand why the city works so well visually." },
      { title: "Coffee with a view stop", tip: "Good move before the match or the morning after." },
      { title: "Simple central dinner", tip: "Ålesund is better with one proper meal than with random grazing." },
      { title: "Pre-match centre-to-stadium move", tip: "Straightforward if you do not overcomplicate it." },
      { title: "Post-match waterfront return", tip: "Lets the city keep carrying the trip after full-time." },
      { title: "Photography walk", tip: "One of the better cities in the project for people who like visual trips." },
      { title: "Rain-proof slow day", tip: "Weather is part of the place; adapt instead of complaining." },
      { title: "Morning scenic reset", tip: "Strong final block before departure if you stayed overnight." },
    ],

    tips: [
      "Stay centrally; there is no cleverer answer.",
      "This works better as a full overnight than as a rushed day trip.",
      "Ålesund is one of the app’s better football-plus-scenery combinations.",
      "Weather matters, but the city is still worth it when conditions are mixed.",
      "Aalesund as a club benefit hugely from the destination around them.",
    ],

    food: [
      "Seafood and harbour-adjacent dining",
      "Casual central bistro meals",
      "Coffee and pastries in the centre",
      "Simple pre-match pub or burger options",
      "A cleaner sit-down dinner for the main evening",
    ],

    transport:
      "Ålesund is best handled from the centre with simple onward local movement. The trip does not need transport heroics; it needs you to keep the city centre as the anchor and stop overengineering it.",

    accommodation:
      "Ålesund centre is the obvious and best base. You want the scenery, the restaurants, and the easy stadium move all from one place. Anything else is usually making the trip worse for no real gain.",
  },

  kristiansand: {
    cityId: "kristiansand",
    name: "Kristiansand",
    country: "Norway",
    thingsToDoUrl: GYG.kristiansand,
    overview:
      "Kristiansand is better as a football overnight than people assume. It is not trying to overwhelm you with giant-city options, but it does enough well: clean centre, coastal feel, decent food rhythm, and a club that gives the trip a proper purpose. The right approach is simple planning and one good overnight rather than overblown expectations.",

    topThings: [
      { title: "City-centre walk", tip: "Useful first-hour move to get your bearings and settle the pace." },
      { title: "Harbourfront area", tip: "Best for a cleaner evening feel before or after food." },
      { title: "Beach/coastal edge", tip: "Weather-dependent, but a good add-on if conditions are decent." },
      { title: "Central dinner", tip: "Book if it is a busy weekend; the good options fill before the bad ones." },
      { title: "Pre-match centre base", tip: "Eat and drink in town first, then move to the ground later." },
      { title: "Post-match central return", tip: "The city works better when you keep the evening going in the centre." },
      { title: "Morning waterfront reset", tip: "A good final move before checkout or departure." },
      { title: "Simple old-town style wander", tip: "This city rewards relaxed pacing more than checklist tourism." },
      { title: "Café stop before football", tip: "Useful if you want the day to feel like a break rather than a mission." },
      { title: "One-night football rhythm", tip: "This city is at its best when you accept that clean simplicity is the point." },
    ],

    tips: [
      "Stay centrally and let the rest of the weekend stay easy.",
      "Kristiansand is stronger as an overnight than as a frantic same-day turn.",
      "Start gives the trip purpose, but the city does enough to support it.",
      "Good weather adds a lot here.",
      "This is a clean, civilised football stop rather than a loud spectacle weekend.",
    ],

    food: [
      "Central sit-down restaurants",
      "Harbour-area evening dining",
      "Casual burgers or pub food before the match",
      "Coffee and bakery stops in the centre",
      "Simple post-match drinks and light food centrally",
    ],

    transport:
      "Kristiansand is not difficult. The city centre is the right anchor, and onward movement to the stadium is simple enough that you should not waste energy trying to optimise around it.",

    accommodation:
      "Stay in the city centre. You get the best mix of convenience, evening options, and easy matchday movement. There is very little reason to choose a stadium-adjacent base over a better central stay.",
  },

  molde: {
    cityId: "molde",
    name: "Molde",
    country: "Norway",
    overview:
      "Molde is a compact, very manageable football city that benefits from both scenery and low-friction logistics. It is not a huge nightlife machine, but it works extremely well for a football-first overnight because the city, stadium, and practical travel pieces line up cleanly. The smart move is staying central and keeping the whole trip simple.",

    topThings: [
      { title: "Waterfront walk", tip: "Best easy orientation move after arrival." },
      { title: "Central town loop", tip: "Good for understanding the city quickly without wasting time." },
      { title: "Viewpoint or nearby scenic stop", tip: "Worth doing if weather is on your side." },
      { title: "Aker Stadion approach", tip: "One of the easier stadium moves in the whole Norway set." },
      { title: "Pre-match central meal", tip: "Keep it simple and close to your hotel." },
      { title: "Post-match harbour return", tip: "Lets the city still feel part of the football trip after full-time." },
      { title: "Morning coffee with a view", tip: "Best if you stayed over and are not sprinting out immediately." },
      { title: "Light city-centre bars", tip: "Fine for an evening, just do not expect Oslo-scale variety." },
      { title: "Photography stop near the ground", tip: "Useful because the stadium setting is one of the city’s assets." },
      { title: "Simple overnight rhythm", tip: "Molde works because it does not require overplanning." },
    ],

    tips: [
      "Stay centrally; everything works better that way.",
      "Molde is a great football-first overnight, not a giant urban weekend.",
      "The stadium setting is one of the city’s genuine strengths.",
      "Weather can improve or diminish the trip a lot, so plan honestly.",
      "Good for travellers who want quality football with minimal fuss.",
    ],

    food: [
      "Central bistro-style dinners",
      "Harbour-adjacent meals in decent weather",
      "Casual burgers or pub food pre-match",
      "Coffee and pastry stops in town",
    ],

    transport:
      "Molde is extremely manageable. The city centre should be your anchor, and the stadium is easy enough to fold into the rest of the trip without a complicated transport plan.",

    accommodation:
      "Molde city centre is the obvious base and there is no need to get clever beyond that. You want walkability, food, and simple access to the ground in one clean package.",
  },

  fredrikstad: {
    cityId: "fredrikstad",
    name: "Fredrikstad",
    country: "Norway",
    overview:
      "Fredrikstad is a practical football stop with enough history and local character to stop it feeling sterile. It is not a giant destination weekend on its own, but it does work well if you like clubs with heritage and cities that are easy to navigate without stress. The mistake would be expecting luxury-city scale from what is really a grounded football trip.",

    topThings: [
      { title: "Old Town area", tip: "Best obvious city asset and worth doing properly." },
      { title: "Riverfront walk", tip: "Good simple daytime block before food or football." },
      { title: "Town-centre dinner", tip: "Keep it central and practical." },
      { title: "Stadium approach", tip: "Arrive with time and let the football side of the trip carry the weight." },
      { title: "Pre-match local pub", tip: "Better than trying to turn the day into something it is not." },
      { title: "Post-match central return", tip: "Lets the evening feel slightly fuller than just hotel-and-sleep." },
      { title: "Morning old-town coffee", tip: "Good final-hour move if you stayed over." },
      { title: "Football photo stop", tip: "A useful city for people who like classic-club context." },
      { title: "One-night heritage loop", tip: "The city works better when you accept its scale." },
      { title: "Regional stopover", tip: "Good if part of a wider multi-city Norway trip." },
    ],

    tips: [
      "Stay centrally and keep the whole trip low-fuss.",
      "This is a history-led football stop rather than a luxury city break.",
      "Fredrikstad works well for one night.",
      "Good choice if the club matters to you more than nightlife density.",
      "Oslo can be the broader base if you are chaining cities together.",
    ],

    food: [
      "Central sit-down dining",
      "Simple pub food before the match",
      "Coffee and bakery stops near the centre",
      "A practical dinner rather than a destination-food obsession",
    ],

    transport:
      "Fredrikstad is best handled from the centre and station area. The key is basic clean timing rather than any complicated local transport strategy.",

    accommodation:
      "Stay in Fredrikstad centre if the match is your focus. If this is one stop in a broader trip and nightlife matters more, Oslo can be the stronger overall base.",
  },

  hamar: {
    cityId: "hamar",
    name: "Hamar",
    country: "Norway",
    overview:
      "Hamar is a practical football city and nothing more complicated than that. If you understand the brief, it works. If you expect a huge destination weekend, you are setting yourself up badly. HamKam make it a proper football stop, but the city is really about ease and realism rather than spectacle.",

    topThings: [
      { title: "Lakefront area", tip: "Best visual reset in the city if weather behaves." },
      { title: "Town-centre walk", tip: "Enough for a daytime block without overcommitting." },
      { title: "Briskeby approach", tip: "The football setting is the core point of the trip." },
      { title: "Simple central meal", tip: "Choose one decent place and stop trying to optimise everything." },
      { title: "Coffee near the station", tip: "Useful if you are coming in and out by rail." },
      { title: "Pre-match pub stop", tip: "Keep it functional and local." },
      { title: "Post-match low-key evening", tip: "This is more calm overnight than big-city night out." },
      { title: "Morning walk before departure", tip: "Enough to round off a one-night stay properly." },
      { title: "Rail-linked stopover", tip: "Works well if Oslo is the wider base." },
      { title: "Football-first planning", tip: "Hamar is better when you stop forcing tourist grandeur onto it." },
    ],

    tips: [
      "Hamar works best as a football-first practical overnight.",
      "Oslo can be a stronger wider base if you want nightlife.",
      "Do not overplan; the city is too small for that.",
      "This is a grounded trip for grounded travellers.",
      "HamKam are the reason you come here, not a giant attraction stack.",
    ],

    food: [
      "Simple local dining in the centre",
      "Coffee and pastries near central areas",
      "Basic pre-match pub food",
    ],

    transport:
      "Hamar is straightforward, especially if you are rail-linked. Use the station and centre as your anchors and keep onward matchday movement simple.",

    accommodation:
      "Stay in Hamar centre if you want the easiest football trip. If your weekend priority is broader city life, use Oslo and travel in.",
  },

  lillestrom: {
    cityId: "lillestrom",
    name: "Lillestrøm",
    country: "Norway",
    overview:
      "Lillestrøm is one of the easiest serious football trips in Norway because it sits in such a useful place between Oslo and the airport corridor. It is not trying to outshine the capital as a destination, but for practical football value it is excellent. The club’s weight does the heavy lifting.",

    topThings: [
      { title: "Town-centre pub and food loop", tip: "Best move if you are staying local for the match." },
      { title: "Åråsen approach", tip: "One of the easier classic-club stadium arrivals in the app." },
      { title: "Station-to-centre walk", tip: "Good because it shows how practical the whole trip is." },
      { title: "Pre-match local session", tip: "A better use of time than bouncing back and forth to Oslo unnecessarily." },
      { title: "Post-match train option", tip: "Useful if you chose Oslo as the wider base." },
      { title: "Simple overnight stay", tip: "Works well if the football is the main point." },
      { title: "Morning rail departure", tip: "Part of why this trip is so efficient." },
      { title: "Short city-centre wander", tip: "Enough to give the stop shape without pretending it is massive." },
      { title: "Football-photo stop", tip: "Good if club heritage is what brought you." },
      { title: "Airport-linked routing", tip: "One of the best league stops for clean travel planning." },
    ],

    tips: [
      "Lillestrøm is about football value and logistics, not scenic tourism.",
      "Staying local is great for convenience; Oslo is better for nightlife.",
      "Åråsen is one of the better classic grounds in the project.",
      "Good choice if you want to minimise wasted time.",
      "This is one of the strongest practical club trips in Norway.",
    ],

    food: [
      "Local pub meals in the centre",
      "Casual pre-match burgers",
      "Coffee and bakery stops near the station",
      "Simple sit-down dinners close to the core",
    ],

    transport:
      "Rail is the whole point here. Lillestrøm is brilliantly placed for Oslo and the airport, and the stadium move is easy from the centre. Stop overcomplicating it and the trip becomes excellent.",

    accommodation:
      "Stay in Lillestrøm if you want pure football convenience. Stay in central Oslo if you want the broader weekend experience and do not mind an easy train in and out.",
  },

  kristiansund: {
    cityId: "kristiansund",
    name: "Kristiansund",
    country: "Norway",
    overview:
      "Kristiansund is a small, practical football destination and should be treated exactly that way. It is not a polished giant city break, but it has enough local identity and enough compactness to work well if the goal is a clean football stop. Keep the plan simple and it does the job well.",

    topThings: [
      { title: "Harbour and centre walk", tip: "Best first move because it gives the place shape quickly." },
      { title: "Nordmøre Stadion approach", tip: "The club is the main purpose of the stop, so build around that honestly." },
      { title: "Simple central meal", tip: "Sort it early and keep expectations proportionate." },
      { title: "Local pub stop", tip: "Useful if you want a grounded pre- or post-match rhythm." },
      { title: "Morning harbour reset", tip: "Good if you stayed overnight and want the city to register a bit more." },
      { title: "Compact-town wander", tip: "Works because the city is small enough to understand fast." },
      { title: "Football photography stop", tip: "Good for travellers who like niche local-club settings." },
      { title: "Post-match low-key evening", tip: "This is not the place for forcing giant-city nightlife." },
      { title: "One-night practical stay", tip: "Exactly what the city is built for in travel terms." },
      { title: "Regional routing stop", tip: "Useful if you are linking multiple Norwegian football destinations." },
    ],

    tips: [
      "Keep the trip simple. That is the whole point.",
      "Kristiansund is a football stop first and a broader break second.",
      "Good for travellers who like smaller club environments.",
      "Do not expect giant-city variety.",
      "A one-night stay is usually enough.",
    ],

    food: [
      "Simple central dinners",
      "Local pub food",
      "Coffee and pastries in the centre",
    ],

    transport:
      "Kristiansund is manageable because of its small scale. The correct strategy is simply using the centre as your anchor and keeping onward match movement basic.",

    accommodation:
      "Stay centrally. There is no cleverer answer and the city is too compact to benefit from elaborate hotel strategy.",
  },

  sandefjord: {
    cityId: "sandefjord",
    name: "Sandefjord",
    country: "Norway",
    overview:
      "Sandefjord is a useful football stop because it is clean, easy, and airport-linked. That does not make it glamorous, but it does make it practical. If you want a low-fuss overnight or a tidy trip in a wider route, it works well enough. Just do not lie to yourself about what kind of city it is.",

    topThings: [
      { title: "Harbourfront walk", tip: "Best easy visual block in the city." },
      { title: "Town-centre loop", tip: "Enough to give the trip shape without pretending there is endless content." },
      { title: "Jotun Arena approach", tip: "Straightforward and low-stress if you keep the plan simple." },
      { title: "Pre-match central meal", tip: "Better than hovering around the ground with nothing to do." },
      { title: "Post-match local drink", tip: "Fine if you want one easy evening stop before bed." },
      { title: "Morning coastal reset", tip: "A decent final-hour move in good weather." },
      { title: "Airport-linked stopover", tip: "One of the strongest practical arguments for the city." },
      { title: "Rail-plus-football routing", tip: "Useful if you are building a clean Norway itinerary." },
      { title: "Photography by the waterfront", tip: "Good if you want the trip to feel slightly fuller than just stadium-hotel." },
      { title: "One-night ease", tip: "The city’s main strength, bluntly." },
    ],

    tips: [
      "Sandefjord works because it is easy, not because it is huge.",
      "Torp makes this a useful routing city.",
      "Good for one night, no need to force more than that.",
      "This is a practical football stop for practical travellers.",
      "Keep everything central and low-drama.",
    ],

    food: [
      "Simple central meals",
      "Casual pub food before the match",
      "Coffee and bakery stops",
      "Harbour-adjacent dining in decent weather",
    ],

    transport:
      "Sandefjord is all about practical anchors: station, centre, airport, ground. Once you accept that, the city becomes very easy to handle.",

    accommodation:
      "Stay in the centre and keep the whole trip walkable or near-walkable. There is no reason to get fancy with districts here.",
  },

  sarpsborg: {
    cityId: "sarpsborg",
    name: "Sarpsborg",
    country: "Norway",
    overview:
      "Sarpsborg is a football-first stop rather than a glamorous destination weekend. That is not a flaw; it just means the city should be planned honestly. The club give the trip its reason, and the city gives enough infrastructure to make it work cleanly for one night or as part of a wider eastern-Norway route.",

    topThings: [
      { title: "Town-centre walk", tip: "Enough to get your bearings without overinvesting time." },
      { title: "Sarpsborg Stadion approach", tip: "The main point of the trip, so let the football lead it." },
      { title: "Simple local meal", tip: "Keep it practical and central." },
      { title: "Pre-match pub stop", tip: "Good if you want a basic local rhythm before kickoff." },
      { title: "Post-match low-key evening", tip: "This is not where you hunt giant-city nightlife." },
      { title: "Morning central coffee", tip: "Useful final-hour move before departure." },
      { title: "Rail-linked eastern routing", tip: "Good if Oslo is your wider travel anchor." },
      { title: "Football photography stop", tip: "Helpful if you enjoy filling out the league with grounded club visits." },
      { title: "One-night football stop", tip: "Exactly what the city is best at." },
      { title: "Regional add-on", tip: "Works better if paired with other nearby fixtures or stops." },
    ],

    tips: [
      "Treat Sarpsborg honestly as a football stop, not a luxury weekend.",
      "One overnight is usually enough.",
      "Oslo can be the broader base if you want more city life.",
      "Best for neutrals filling out the league seriously.",
      "Keep the plan central and simple.",
    ],

    food: [
      "Simple central dinners",
      "Local pub food",
      "Coffee and bakery stops around the core",
    ],

    transport:
      "Sarpsborg works best from the centre and station with simple onward movement. This is not a city where transport complexity should even enter your head.",

    accommodation:
      "Stay centrally if the match is the priority. If the wider weekend matters more than the city itself, use Oslo and travel in.",
  },
};

export default eliteserienCityGuides;
