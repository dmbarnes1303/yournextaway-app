import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points.
 * Keep this central so monetised city links stay easy to maintain.
 */
const GYG = {
  brussels:
    "https://www.getyourguide.com/en-gb/brussels-l8/?partner_id=MAQJREP&utm_medium=online_publisher",
  bruges:
    "https://www.getyourguide.com/en-gb/bruges-l854/?partner_id=MAQJREP&utm_medium=online_publisher",
  antwerp:
    "https://www.getyourguide.com/en-gb/antwerp-l1028/?partner_id=MAQJREP&utm_medium=online_publisher",
  ghent:
    "https://www.getyourguide.com/en-gb/ghent-l1487/?partner_id=MAQJREP&utm_medium=online_publisher",
  liege:
    "https://www.getyourguide.com/en-gb/liege-l32275/?partner_id=MAQJREP&utm_medium=online_publisher",
  leuven:
    "https://www.getyourguide.com/en-gb/leuven-l1532/?partner_id=MAQJREP&utm_medium=online_publisher",
  mechelen:
    "https://www.getyourguide.com/en-gb/mechelen-l34046/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const proLeagueCityGuides: Record<string, CityGuide> = {
  brussels: {
    cityId: "brussels",
    name: "Brussels",
    country: "Belgium",
    thingsToDoUrl: GYG.brussels,
    overview:
      "Brussels works best when you stop treating it like a generic capital and start treating it as a set of distinct zones. The centre gives you the postcard buildings and easy beer bars, Ixelles and Saint-Gilles give you better local energy, and matchday transport is usually simpler than people expect. It is not a city that rewards frantic attraction-ticking. Pick two good neighbourhood blocks, eat well, and keep stadium travel planned rather than improvised.",
    topThings: [
      { title: "Grand Place", tip: "Go early morning or after dark. Midday crowds are the weakest version of the square." },
      { title: "Galeries Royales Saint-Hubert", tip: "Good quick central stop when weather turns. Do not overstay it." },
      { title: "Mont des Arts viewpoint", tip: "Short payoff, big visual return. Works well before dinner." },
      { title: "Sablon district", tip: "Better for a slower afternoon: cafés, antiques, chocolate, less chaos than the core." },
      { title: "Ixelles evening", tip: "Good choice if you want a more lived-in night than tourist-centre bars." },
      { title: "European Quarter walk", tip: "Worth doing only if you want modern institutional Brussels. Otherwise keep it secondary." },
      { title: "Comic art spots", tip: "Nice add-on, not a full-day mission unless you genuinely care." },
      { title: "Beer bar session", tip: "Choose one strong bar and sit properly. Belgium punishes random quantity-chasing." },
      { title: "Pre-match neighbourhood meal", tip: "Eat before the stadium zone unless you already know the local setup." },
      { title: "Train-based day structure", tip: "Brussels is a strong base if you are combining football with Bruges, Ghent or Antwerp." },
    ],
    tips: [
      "Central Brussels is easiest, but Ixelles and Saint-Gilles often feel better at night.",
      "Belgian beer is stronger than people act like it is. Do not be stupid before a match.",
      "Public transport is fine if you know your route in advance.",
      "The city centre can feel scruffy in patches; that is normal, not a reason to panic.",
      "If you are doing football plus sightseeing, keep one low-effort block in reserve.",
    ],
    food: [
      "Frites from a proper fritkot",
      "Moules-frites if you actually want the classic",
      "Waffles as a snack, not a meal plan",
      "Beer cafés with proper glassware",
      "Brasserie dinner booked in advance on Fridays and Saturdays",
    ],
    transport:
      "Brussels has usable metro, tram and train connections. For football trips, the main rule is simple: know your exact stadium route before you leave your hotel. The city is not hard, but it gets annoying fast if you wing connections.",
    accommodation:
      "Central Brussels is efficient for short stays, but Ixelles, Saint-Gilles and parts of the upper town can give you a better evening base. Prioritise rail or metro access over chasing the cheapest room.",
  },

  bruges: {
    cityId: "bruges",
    name: "Bruges",
    country: "Belgium",
    thingsToDoUrl: GYG.bruges,
    overview:
      "Bruges is one of the easiest football-trip cities in Europe because the core is compact, visually strong and walkable. The mistake is trying to overcomplicate it. Bruges is about canals, quiet streets, good food, beer done properly, and a match layered into a city that already feels like a weekend break. One night works. Two nights is comfortable. More than that only makes sense if you love slow travel.",
    topThings: [
      { title: "Market Square", tip: "Best early or later in the evening once the day-trippers thin out." },
      { title: "Canal walk", tip: "Do it on foot first before paying for anything. The city reads better at walking pace." },
      { title: "Belfry area", tip: "Good visual anchor, but do not build the whole day around one tower." },
      { title: "Groeninge / quieter side streets", tip: "The best Bruges moments are often just off the main route." },
      { title: "Beer tasting bar", tip: "Choose one serious place rather than bouncing around weak tourist traps." },
      { title: "Chocolate shops", tip: "Buy from somewhere proper, not the first obvious shiny window." },
      { title: "Churches and courtyards", tip: "Bruges rewards slowing down more than checklisting." },
      { title: "Evening canal-side dinner", tip: "Book it. Bruges weekends are not the place for lazy walk-in optimism." },
      { title: "Matchday stroll to the ground", tip: "Build in time and enjoy it. Bruges is a city where walking is part of the trip." },
      { title: "Morning coffee loop", tip: "A quiet Bruges morning is better than most cities at full volume." },
    ],
    tips: [
      "Stay central and walk everywhere.",
      "Bruges is expensive when you do lazy tourist choices.",
      "Book dinner and hotel early on football weekends.",
      "This is a city for pace control, not rushing.",
      "If you are choosing between Bruges and Brussels for atmosphere, Bruges wins on charm immediately.",
    ],
    food: [
      "Belgian brasserie classics",
      "Moules-frites",
      "Local beer pairings",
      "Chocolate from reputable shops",
      "A proper breakfast café before checkout",
    ],
    transport:
      "Bruges is extremely walkable in the centre. Rail access is simple from Brussels and other Belgian cities. Taxis are rarely the point unless you are arriving late or leaving very early.",
    accommodation:
      "Stay inside or just beside the historic centre. That is the whole advantage of Bruges. Do not save a tiny amount of money by staying inconveniently far out and then ruin the rhythm.",
  },

  antwerp: {
    cityId: "antwerp",
    name: "Antwerp",
    country: "Belgium",
    thingsToDoUrl: GYG.antwerp,
    overview:
      "Antwerp is one of the strongest all-round football weekend cities because it combines proper city scale with manageable logistics. You get architecture, nightlife, fashion, good food, and enough neighbourhood variation to make a longer stay feel justified. It is less theatrical than Bruges and less messy than Brussels. For a neutral traveller, that is often the sweet spot.",
    topThings: [
      { title: "Antwerp Central area", tip: "The station is worth seeing, but move beyond it quickly." },
      { title: "Old Town and Grote Markt", tip: "Classic central block. Good first walk, better in the evening than at peak daytime crowd." },
      { title: "Cathedral and surrounding lanes", tip: "Take the area in as a cluster, not as isolated single stops." },
      { title: "Het Zuid", tip: "One of the better neighbourhoods for food and evening drinks." },
      { title: "Museum district", tip: "Pick one museum with intent. Collecting museums is dead time." },
      { title: "Scheldt riverside walk", tip: "Useful as a reset block before dinner or after checkout." },
      { title: "Fashion quarter", tip: "Better for browsing and atmosphere than panic-shopping." },
      { title: "Beer café night", tip: "Antwerp does this very well. Sit down and do it properly." },
      { title: "Pre-match meal in town", tip: "Town beats stadium-adjacent convenience most of the time." },
      { title: "Late evening old-city loop", tip: "Antwerp looks better once the pressure of the day drops off." },
    ],
    tips: [
      "Antwerp is a stronger two-night city than many football destinations.",
      "Central location matters less than staying in the right zone with food and bars nearby.",
      "The station area is useful, not always the best vibe.",
      "Do not underestimate how much walking you will do.",
      "If you like cities with style and structure, Antwerp is one of Belgium’s best.",
    ],
    food: [
      "Modern Belgian bistros",
      "Beer-focused food bars",
      "Good bakery breakfasts",
      "Proper fries without turning it into a joke purchase",
      "One booked dinner in Het Zuid or the old centre",
    ],
    transport:
      "Trams help, walking covers a lot, and rail connections are excellent. Antwerp is easiest when you pick one side of the city per half-day rather than crossing it repeatedly for no reason.",
    accommodation:
      "Historic centre, Zuid, or near Antwerp Central depending on your priorities. For football weekends, being able to walk to bars and back is worth more than a marginal hotel saving.",
  },

  ghent: {
    cityId: "ghent",
    name: "Ghent",
    country: "Belgium",
    thingsToDoUrl: GYG.ghent,
    overview:
      "Ghent is arguably Belgium’s best-balanced city for a football weekend: beautiful without feeling fake, lively without feeling exhausting, and compact enough to be easy. It has enough culture for a proper city break and enough bars and food quality to avoid ever feeling flat. If Bruges is the polished postcard, Ghent is the better all-rounder.",
    topThings: [
      { title: "Graslei and Korenlei", tip: "This is the postcard zone. Early and late are the right times." },
      { title: "Canal-side wandering", tip: "Ghent rewards aimless walking more than rigid routing." },
      { title: "Gravensteen area", tip: "Worth seeing, but the surrounding district matters as much as the castle itself." },
      { title: "Patershol", tip: "Strong area for dinner and a more intimate evening feel." },
      { title: "Cathedral and old-town spine", tip: "Easy central block to link most of your day." },
      { title: "Student quarter energy", tip: "Ghent has a younger edge than Bruges. Use that if you want livelier evenings." },
      { title: "Beer bar with local focus", tip: "Do not default to only famous labels; local picks are half the point." },
      { title: "Evening waterside drink", tip: "Simple and effective. One of the easiest good finishes to a day in Belgium." },
      { title: "Pre-match central meal", tip: "Better value and atmosphere than trying to solve food late near the ground." },
      { title: "Morning bakery run", tip: "Ghent mornings are strong if you do them properly." },
    ],
    tips: [
      "Ghent is one of the least stressful football city breaks in Europe.",
      "Stay central if possible.",
      "The city is compact enough that overplanning is usually the real mistake.",
      "Book dinner if staying on a Friday or Saturday.",
      "Ghent is ideal if you want culture and nightlife without a huge-city penalty.",
    ],
    food: [
      "Belgian classics in Patershol",
      "Bakery breakfast",
      "Good beer-led bars",
      "Seasonal local menus",
      "One waterside dinner if weather allows",
    ],
    transport:
      "Central Ghent is highly walkable, with trams filling the gaps. For stadium trips, just map the route once and keep it simple. Rail links from Brussels and Bruges are easy.",
    accommodation:
      "Stay in or near the old centre. Ghent works because it is compact. Do not blunt that advantage by staying awkwardly far out.",
  },

  genk: {
    cityId: "genk",
    name: "Genk",
    country: "Belgium",
    overview:
      "Genk is not a grand-tour Belgian city break; it is a practical football stop with regional personality. The logic here is different. You are not chasing picture-postcard streets all day. You are building a clean, efficient trip around the match, a decent meal, and a few well-chosen local blocks. If you approach Genk like Antwerp or Bruges, you will be disappointed. If you approach it honestly, it works.",
    topThings: [
      { title: "Thor Park area", tip: "Useful if you want a modern regenerated district rather than forced old-town tourism." },
      { title: "C-mine site", tip: "One of the more worthwhile local stops. Industrial heritage beats fake checklisting." },
      { title: "Nearby green space", tip: "Good reset if you are staying overnight and do not want to sit in bars all day." },
      { title: "Local café session", tip: "Genk is better when you stop pretending every stop has to be iconic." },
      { title: "Football-first structure", tip: "This is the real point of the trip, so build around kickoff properly." },
      { title: "Regional food stop", tip: "Go for one solid meal rather than chasing city-break fantasy." },
      { title: "Short centre loop", tip: "Enough to get your bearings, not enough to build your whole trip around." },
      { title: "Pre-match arrival window", tip: "Give yourself breathing room; regional transport is where sloppy planning gets punished." },
      { title: "Post-match transport plan", tip: "Know it before kickoff. That matters more here than in bigger cities." },
      { title: "Nearby base logic", tip: "Some travellers may prefer staying in a better-connected nearby city and travelling in." },
    ],
    tips: [
      "Treat Genk as a football-led stop, not a classic city-break destination.",
      "Transport planning matters more than attraction planning.",
      "One-night stays make more sense than trying to stretch it too far.",
      "Regional realism beats fake glamour every time.",
      "If you need a prettier base, stay elsewhere and travel in.",
    ],
    food: [
      "One proper regional dinner",
      "Bakery or café breakfast",
      "Straightforward local brasserie food",
      "Simple drinks rather than all-night bar-hopping",
    ],
    transport:
      "This is where the trip is won or lost. Check rail and last-leg connections properly. Regional moves are manageable, but only if you stop assuming big-city frequency.",
    accommodation:
      "Stay in Genk only if you want a direct football-first trip. Otherwise, a stronger nearby base with cleaner transport logic can be the smarter move.",
  },

  liege: {
    cityId: "liege",
    name: "Liège",
    country: "Belgium",
    thingsToDoUrl: GYG.liege,
    overview:
      "Liège feels different from the postcard version of Belgium. It is rougher around the edges, more direct, more regional, and in many ways more honest. That makes it a strong football city. If you want polished prettiness, pick Bruges. If you want local energy, strong food, and a city where football fits naturally into the broader atmosphere, Liège is a better bet.",
    topThings: [
      { title: "Old town core", tip: "Take it in as atmosphere, not as a perfect architectural fantasy." },
      { title: "Montagne de Bueren", tip: "Do it once, not as a heroic personality test." },
      { title: "Riverside walk", tip: "Good way to reset the day without forcing more indoor stops." },
      { title: "Local market area", tip: "Worth doing if timing works, but not worth wrecking the day to force it." },
      { title: "Carré nightlife zone", tip: "Useful if you want energy. Less useful if you want a quiet pint." },
      { title: "Brasserie dinner", tip: "Liège rewards proper food choices more than flashy ones." },
      { title: "Regional beer stop", tip: "One good bar beats three lazy ones." },
      { title: "Pre-match town block", tip: "Let the city breathe before heading stadium-side." },
      { title: "Post-match crowd management", tip: "Liège can feel emotionally charged around football. Plan around that, not against it." },
      { title: "Morning recovery route", tip: "Coffee and a short walk are the right answer here." },
    ],
    tips: [
      "Liège is better when you lean into its local personality.",
      "Do not expect Bruges prettiness.",
      "Food and crowd energy are major strengths.",
      "Football feels embedded here rather than decorative.",
      "Pick a hotel in a sensible area and know your night-return route.",
    ],
    food: [
      "Classic brasserie meals",
      "Regional beer bars",
      "Bakeries and coffee stops",
      "One booked evening meal in the centre",
    ],
    transport:
      "Liège is manageable, but route planning still matters. The city is more functional than elegant in transport terms. Know how you are getting to and from the stadium before you go out.",
    accommodation:
      "Central areas make the most sense for a short trip. Prioritise a hotel that gives you an easy night return over one that only looks cheaper on paper.",
  },

  charleroi: {
    cityId: "charleroi",
    name: "Charleroi",
    country: "Belgium",
    overview:
      'Charleroi has a bad reputation because people lazily compare it to the wrong places. It is not Bruges. It is not trying to be. For football travellers, Charleroi is a practical, no-nonsense stop where the trip should be built around logistics, one or two decent local blocks, and the match itself. If you come expecting romance, that is your mistake. If you come expecting a workable football trip, it can do the job.',
    topThings: [
      { title: "Central practical loop", tip: "Enough to orient yourself. Do not force a full sightseeing fantasy." },
      { title: "Industrial character spots", tip: "This city makes more sense if you accept its industrial identity." },
      { title: "One strong meal choice", tip: "Food planning matters more than attraction planning here." },
      { title: "Airport logic", tip: "Useful stopover potential if you are flying in or out through Charleroi." },
      { title: "Football-first planning", tip: "The match is the anchor, so treat the rest as supporting structure." },
      { title: "Short café stop", tip: "Keep the rhythm calm and efficient." },
      { title: "Pre-match movement", tip: "Get your route right before the day starts." },
      { title: "Post-match exit route", tip: "Know it. Do not improvise late." },
      { title: "Simple overnight", tip: "One night is usually the right amount." },
      { title: "Regional combination trip", tip: "Charleroi can work as part of a bigger Belgium football swing rather than a standalone glamour stop." },
    ],
    tips: [
      "This is a football-first trip, not a beauty-contest city break.",
      "Airport convenience is a real advantage.",
      "Planning beats spontaneity here.",
      "Do not waste energy pretending there is more to do than there is.",
      "Get in, do it properly, get out cleanly.",
    ],
    food: [
      "One proper brasserie meal",
      "Simple café breakfast",
      "Straightforward local bar food",
    ],
    transport:
      "Transport is the key variable. If Charleroi is linked to a flight, build the whole trip around clean timing. This is not the place to be casual about connections.",
    accommodation:
      "Keep it practical. Stay where your match and onward transport make sense. This is not a destination where aesthetics should outweigh logistics.",
  },

  mechelen: {
    cityId: "mechelen",
    name: "Mechelen",
    country: "Belgium",
    thingsToDoUrl: GYG.mechelen,
    overview:
      "Mechelen is exactly the sort of city football travellers underrate: small enough to be easy, attractive enough to feel like a proper trip, and calm enough to avoid the friction of bigger urban bases. It is not a blockbuster city, but that is why it works. For one or two nights around a match, Mechelen is efficient and pleasant.",
    topThings: [
      { title: "Central square and cathedral zone", tip: "This is the obvious anchor and it works well." },
      { title: "Riverside / canal walk", tip: "Good low-effort city-reading block." },
      { title: "Old streets loop", tip: "Mechelen is best on foot, not via overplanned routing." },
      { title: "Tower or viewpoint stop", tip: "Worth it if weather is right. Skip if visibility is poor." },
      { title: "Local café afternoon", tip: "This is a city that suits relaxed pacing." },
      { title: "Evening central dinner", tip: "Keep it central and simple." },
      { title: "Matchday walk", tip: "Use the city’s compactness to your advantage." },
      { title: "Morning bakery stop", tip: "Small-city Belgium does mornings well." },
      { title: "Beer bar with restraint", tip: "One strong venue is enough." },
      { title: "Neighbouring city flexibility", tip: "Mechelen also works as a calmer base between Antwerp and Brussels." },
    ],
    tips: [
      "Excellent one-night football city.",
      "Walkability is the main selling point.",
      "Do not force a long attraction list.",
      "Calm cities are useful when matchday is the main event.",
      "Mechelen is underrated because people chase bigger names.",
    ],
    food: [
      "Central Belgian brasserie dinner",
      "Bakery breakfast",
      "Beer café stop",
      "Casual lunch in the old centre",
    ],
    transport:
      "Rail access is strong and the centre is compact. Once you arrive, most of the point is that you can stop thinking so hard about transport.",
    accommodation:
      "Stay central. That is the full logic of Mechelen. Anything else is wasting the city’s main advantage.",
  },

  leuven: {
    cityId: "leuven",
    name: "Leuven",
    country: "Belgium",
    thingsToDoUrl: GYG.leuven,
    overview:
      "Leuven is a very good football weekend city if you want something lively but not huge. It has a strong student energy, enough beauty to feel like a real trip, and a compact centre that makes the whole thing easy. It is not trying to overwhelm you with attractions. It is trying to be a place where cafés, bars, city walking and football fit together naturally. That is exactly why it works.",
    topThings: [
      { title: "Old Market Square", tip: "The social core. Good day, better evening." },
      { title: "Town Hall and centre loop", tip: "This is the visual anchor; use it to structure the first walk." },
      { title: "Student quarter atmosphere", tip: "Leuven feels more alive because of this. Lean into it." },
      { title: "University-related streets", tip: "The city identity is tightly tied to student life and knowledge culture." },
      { title: "Beer café session", tip: "Leuven is made for this if you do it sensibly." },
      { title: "Compact centre wandering", tip: "The city is best absorbed casually on foot." },
      { title: "Pre-match meal in the centre", tip: "Easy move, low risk, good rhythm." },
      { title: "Night return simplicity", tip: "Pick a base that lets you walk back without admin." },
      { title: "Morning coffee and reset", tip: "Leuven recovers well after a late night." },
      { title: "Short cultural add-on", tip: "You only need one. The rest of Leuven is about feel rather than attraction volume." },
    ],
    tips: [
      "Leuven is one of the easiest short football trips in Belgium.",
      "The student vibe helps the city feel alive.",
      "Stay central and walk.",
      "Good option if Brussels feels too messy and Bruges too polished.",
      "Ideal for one or two nights, not as a long-stay base.",
    ],
    food: [
      "Beer-led bars",
      "Casual bistro dinner",
      "Good café breakfasts",
      "Late evening drinks around the square",
    ],
    transport:
      "Leuven is well-connected by rail and very walkable once there. That is the full value proposition. Keep the trip simple and it rewards you.",
    accommodation:
      "Central Leuven is the obvious play. Prioritise being able to walk the evening and morning without transport friction.",
  },

  sint-truiden: {
    cityId: "sint-truiden",
    name: "Sint-Truiden",
    country: "Belgium",
    overview:
      "Sint-Truiden is another football-led destination rather than a heavyweight sightseeing city. That is fine. Not every trip needs to pretend to be a grand cultural expedition. The best Sint-Truiden trip is straightforward: one clean base, one decent meal, simple transport, and the matchday itself as the core experience.",
    topThings: [
      { title: "Town centre loop", tip: "Short and practical. Enough to get the feel of the place." },
      { title: "Market square", tip: "Use it as your anchor, not as your full entertainment plan." },
      { title: "Local café or bakery", tip: "Small places like this work best when you stop overcomplicating them." },
      { title: "Quiet evening dinner", tip: "Keep expectations realistic and choose one good local option." },
      { title: "Matchday approach", tip: "This is the point of the trip, so build everything around it." },
      { title: "Nearby countryside feel", tip: "Useful if you want a slower rhythm rather than city intensity." },
      { title: "Early arrival window", tip: "Give yourself breathing room; smaller places punish late sloppy timing." },
      { title: "Post-match return plan", tip: "Know the route before kickoff." },
      { title: "One-night logic", tip: "Usually enough unless you are combining with nearby areas." },
      { title: "Football-first honesty", tip: "Treat it for what it is and it works much better." },
    ],
    tips: [
      "This is a football stop, not a major city break.",
      "Do not overbuild the itinerary.",
      "Transport planning matters.",
      "One proper meal and a clean hotel is enough.",
      "Small-city realism beats fake city-break ambition.",
    ],
    food: [
      "Bakery breakfast",
      "Simple Belgian brasserie dinner",
      "Local café stop",
    ],
    transport:
      "Keep travel simple and checked in advance. Smaller destinations are fine until you assume big-city frequency and get burned.",
    accommodation:
      "Stay as close to your practical needs as possible. This trip is about efficiency and matchday ease.",
  },

  denderleeuw: {
    cityId: "denderleeuw",
    name: "Denderleeuw",
    country: "Belgium",
    overview:
      "Denderleeuw is pure football-trip realism. You are not going here for a polished tourism weekend. You are going because the football is the point. That means the smart move is to keep the trip stripped back: efficient arrival, functional base, good timing, no fantasy itinerary, no wasted motion.",
    topThings: [
      { title: "Functional town loop", tip: "Enough to get your bearings. No more than that." },
      { title: "Station-area planning", tip: "Transport logic is the real attraction here." },
      { title: "One decent meal", tip: "Find it early and stop pretending the town owes you more." },
      { title: "Pre-match timing", tip: "Do not cut it fine. That is how small-place trips become annoying." },
      { title: "Post-match transport certainty", tip: "Know your way home before you leave the hotel." },
      { title: "Regional base alternative", tip: "A stronger nearby city base may be the smarter option." },
      { title: "Football-first mindset", tip: "This trip only works if you accept what it is." },
      { title: "Simple overnight", tip: "One night max usually makes sense." },
      { title: "Minimal-friction schedule", tip: "Keep dead time low." },
      { title: "Neighbouring city combo", tip: "Often better as part of a wider Belgium football route." },
    ],
    tips: [
      "Be honest: this is a logistics trip.",
      "Transport matters more than sightseeing.",
      "Stay nearby if it makes the route cleaner.",
      "Do not overcomplicate a simple football stop.",
      "Plan cleanly and it will be fine.",
    ],
    food: ["One simple meal", "Basic café breakfast"],
    transport:
      "Everything depends on the transport plan. Build the trip around arrival and exit certainty. Do not leave it vague.",
    accommodation:
      "Only stay local if it is clearly the easiest option. Otherwise, use a better nearby base and commute in.",
  },

  westerlo: {
    cityId: "westerlo",
    name: "Westerlo",
    country: "Belgium",
    overview:
      "Westerlo is another honest football-first destination. The upside is simplicity. The downside is that there is no point pretending it is a dense city-break location. If you want a low-drama, match-centred stop with a manageable rhythm, it can work well. If you want a weekend packed with urban attractions, pick somewhere else and travel in.",
    topThings: [
      { title: "Small-town centre block", tip: "Keep it short and practical." },
      { title: "Café stop", tip: "The right scale of activity here is modest, not ambitious." },
      { title: "Pre-match meal planning", tip: "Solve food early rather than trusting luck." },
      { title: "Calm overnight structure", tip: "This is a trip for simplicity, not complexity." },
      { title: "Regional driving / transit logic", tip: "Know how you are moving well before kickoff." },
      { title: "Football-first pacing", tip: "The match is the day’s real centre." },
      { title: "Nearby countryside feel", tip: "Useful if you want quiet rather than city buzz." },
      { title: "Post-match route certainty", tip: "Small places become annoying when you improvise." },
      { title: "Short stay discipline", tip: "Do not try to stretch this into something it is not." },
      { title: "Better-base option", tip: "A nearby stronger city may make more sense for some travellers." },
    ],
    tips: [
      "Simple wins here.",
      "Know your route.",
      "Sort food before the rush.",
      "One-night stay logic is usually strongest.",
      "Do not force a sightseeing weekend where none exists.",
    ],
    food: ["Local brasserie meal", "Simple breakfast", "One café stop"],
    transport:
      "Regional planning matters. This is not hard if you prepare, but it gets irritating fast if you do not.",
    accommodation:
      "Choose the base that makes your transport easiest, not the one that only looks nicest on paper.",
  },

  waregem: {
    cityId: "waregem",
    name: "Waregem",
    country: "Belgium",
    overview:
      "Waregem is another straight football stop. The good version of this trip is disciplined and efficient: arrive cleanly, stay somewhere sensible, eat once well, do the match properly, leave without drama. The bad version is expecting a big-city weekend from a place that is not built for it.",
    topThings: [
      { title: "Town-centre orientation walk", tip: "Good enough to understand the place. Do not force more." },
      { title: "One proper meal", tip: "This matters more than chasing weak filler activities." },
      { title: "Calm pre-match setup", tip: "Keep the day measured and avoid unnecessary movement." },
      { title: "Simple café time", tip: "Small-town football trips benefit from accepting the smaller scale." },
      { title: "Transport route check", tip: "Do it early and properly." },
      { title: "Post-match exit plan", tip: "Smaller places are least forgiving when you wing the return." },
      { title: "One-night football trip", tip: "Usually the right amount." },
      { title: "Regional combo logic", tip: "Can work as part of a broader Belgium ground-hop." },
      { title: "Minimal admin strategy", tip: "The more straightforward the plan, the better the trip." },
      { title: "Football as the anchor", tip: "That is the point. Everything else is support work." },
    ],
    tips: [
      "Do not overbuild this trip.",
      "Sort transport first.",
      "Keep hotel choice practical.",
      "One solid meal beats three filler stops.",
      "Football-first honesty is the key.",
    ],
    food: ["Simple Belgian dinner", "Bakery breakfast", "One café stop"],
    transport:
      "Regional transport can be totally fine if you respect the timetable. It becomes a mess only when you assume too much flexibility.",
    accommodation:
      "Stay only where the matchday and onward route make sense. This is an efficiency trip.",
  },

  la-louviere: {
    cityId: "la-louviere",
    name: "La Louvière",
    country: "Belgium",
    overview:
      "La Louvière is not a prestige city-break destination, but that does not make it useless. For football travellers, it is a workable, grounded stop where the trip should be built around clean planning and realistic expectations. The error would be pretending otherwise. Do the basics well and it can be a perfectly solid football weekend.",
    topThings: [
      { title: "Town-centre loop", tip: "Keep it practical. This is orientation, not a grand day out." },
      { title: "Local café or brasserie", tip: "Good choice matters more than quantity of options." },
      { title: "Industrial / regional context", tip: "The place makes more sense if you accept its working identity." },
      { title: "Pre-match calm block", tip: "Give yourself a low-stress run-in to kickoff." },
      { title: "Transport check", tip: "This is where the trip gets won or lost." },
      { title: "Post-match return route", tip: "Know it before kickoff, not after a few beers." },
      { title: "Short-stay discipline", tip: "One night is usually enough." },
      { title: "Regional combination trip", tip: "Could fit well into a wider Belgium football route." },
      { title: "Simple evening structure", tip: "Eat well, have a drink, stop overcomplicating it." },
      { title: "Football-first mindset", tip: "That is the correct framing from start to finish." },
    ],
    tips: [
      "Do not pretend this is Bruges.",
      "This is a football stop first.",
      "Transport logic matters.",
      "Choose practicality over aesthetics.",
      "Keep the trip clean and realistic.",
    ],
    food: ["One proper evening meal", "Bakery or café breakfast", "Simple local drinks stop"],
    transport:
      "Smaller-place rule applies again: route certainty matters. Plan arrival and departure properly and the trip stays easy.",
    accommodation:
      "Pick the hotel or base that reduces friction. This is not the destination to chase style points at the expense of logistics.",
  },
};

export default proLeagueCityGuides;
