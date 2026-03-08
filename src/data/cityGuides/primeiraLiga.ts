import type { CityGuide } from "./types";

const GYG = {
  lisbon:
    "https://www.getyourguide.com/en-gb/lisbon-l42/?partner_id=MAQJREP&utm_medium=online_publisher",
  porto:
    "https://www.getyourguide.com/en-gb/porto-l151/?partner_id=MAQJREP&utm_medium=online_publisher",
  guimaraes:
    "https://www.getyourguide.com/en-gb/guimaraes-l4960/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const primeiraLigaCityGuides: Record<string, CityGuide> = {
  lisbon: {
    cityId: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    thingsToDoUrl: GYG.lisbon,
    overview:
      "Lisbon is one of the strongest football-trip cities in Europe because it works as both a major capital break and a club city. Transport is simple by southern-European standards, the food scene is deep, and you can build a trip around football without sacrificing the city itself. The mistake people make is underestimating hills, overpacking neighbourhoods into one day, and treating matchday as just another sightseeing slot.",
    topThings: [
      { title: "Alfama wander", tip: "Go early or late. Midday crowds kill the atmosphere and the heat can be brutal." },
      { title: "Baixa and Praça do Comércio", tip: "Best used as your central connector, not a whole afternoon." },
      { title: "Belém", tip: "Do Jerónimos, riverside walk and pastries in one block rather than bouncing in and out." },
      { title: "Tram 28 area walk", tip: "Take the photos, but don’t build your day around queueing for the tram." },
      { title: "Miradouros", tip: "Pick two viewpoints max. More than that becomes repetitive fast." },
      { title: "Time Out Market", tip: "Good for variety, worse for authenticity. Use it when the group wants easy choices." },
      { title: "LX Factory", tip: "Best for a relaxed afternoon, coffee and light browsing." },
      { title: "Riverside sunset drinks", tip: "One of Lisbon’s easiest wins. Don’t overcomplicate evenings here." },
      { title: "Sintra day trip", tip: "Only do it if you have a full spare day. Half-doing Sintra is pointless." },
      { title: "Matchday district walk", tip: "Build at least 90 minutes pre-kickoff around the ground area." },
    ],
    tips: [
      "Lisbon is hillier than people expect. Comfortable shoes are not optional.",
      "Use metro/trams for efficiency, then walk neighbourhood clusters.",
      "Bairro Alto is better late than early.",
      "Book key restaurants in advance on weekends.",
      "On matchdays, keep your final transport leg boring and predictable.",
    ],
    food: [
      "Pastéis de nata in Belém",
      "Seafood rice",
      "Grilled sardines",
      "Prego steak sandwich",
      "Petiscos in local taverns",
    ],
    transport:
      "Metro is the cleanest base system. Trams and buses help for awkward hills, but walking still does a lot of the real work. Uber/Bolt are common, but traffic can waste time in peak periods.",
    accommodation:
      "Baixa/Chiado is best for first-timers. Avenida gives cleaner hotel convenience. Alfama is atmospheric but less practical with luggage. If football is the anchor, prioritise easy metro access over postcard charm.",
  },

  porto: {
    cityId: "porto",
    name: "Porto",
    country: "Portugal",
    thingsToDoUrl: GYG.porto,
    overview:
      "Porto is the best all-round football weekend in Portugal if you want compactness, atmosphere and easy city rhythm. It feels tighter and more manageable than Lisbon, which makes it ideal for two-night trips built around a match. The city wins on scenery, walkability and general vibe, but the hills still punish lazy planning.",
    topThings: [
      { title: "Ribeira riverfront", tip: "Best late afternoon into evening. Earlier in the day it can feel more tourist conveyor belt than charm." },
      { title: "Dom Luís I Bridge walk", tip: "Do the upper level once for the views and move on." },
      { title: "Port lodge visit in Gaia", tip: "Pick one serious tasting, not three mediocre ones." },
      { title: "São Bento Station", tip: "Quick stop, not a full activity." },
      { title: "Clérigos area", tip: "Good for central wandering and evening drinks." },
      { title: "Bolhão Market", tip: "Best for a daytime food stop rather than a destination in itself." },
      { title: "Foz riverside/coast", tip: "Strong reset option if you have extra time beyond the match." },
      { title: "Livraria Lello area", tip: "Fine for photos; don’t waste your day in ticket queues." },
      { title: "Miradouro viewpoints", tip: "Golden hour is the obvious play and the right one." },
      { title: "Pre-match city meal", tip: "Eat central and move toward the stadium after, not the other way round." },
    ],
    tips: [
      "Porto works best when you keep the plan dense and local.",
      "Ribeira is worth seeing but not worth living in all day.",
      "Metro is simple and reliable for core movement.",
      "Friday and Saturday dinner spots fill quickly.",
      "The city is compact enough that overplanning usually makes the trip worse.",
    ],
    food: [
      "Francesinha",
      "Bacalhau dishes",
      "Petiscos and wine bars",
      "Seafood in Matosinhos",
      "Port tasting with snacks",
    ],
    transport:
      "The Metro is the backbone and links the airport cleanly. Central Porto is very walkable, but gradients slow you down. Bolt/Uber are useful late or when legs are gone.",
    accommodation:
      "Stay central near Aliados, Trindade or São Bento for the cleanest mix of nightlife, sightseeing and metro access. Ribeira is scenic but less practical as a base.",
  },

  braga: {
    cityId: "braga",
    name: "Braga",
    country: "Portugal",
    overview:
      "Braga is one of Portugal’s best underappreciated football cities: compact, historic, clean and easy to handle over a short stay. It is not trying to be Lisbon or Porto, and that is exactly why it works. If you want a calmer, football-led city break with very little friction, Braga is strong.",
    topThings: [
      { title: "Bom Jesus do Monte", tip: "Do this early or near sunset. Middle of the day is the weakest version." },
      { title: "Braga Cathedral area", tip: "Best as part of a wider old-town loop." },
      { title: "Historic centre walk", tip: "This is a city to walk, not over-transport." },
      { title: "Santa Barbara Garden", tip: "Short stop, high visual payoff." },
      { title: "Local café circuit", tip: "Braga rewards slow mornings more than frantic sightseeing." },
      { title: "Arco da Porta Nova", tip: "A natural anchor point for the old city." },
      { title: "Municipal market stop", tip: "Good for local rhythm, not a long visit." },
      { title: "Evening square drinks", tip: "The city comes alive more gently than loudly." },
      { title: "Matchday stadium approach", tip: "Build time for the setting as much as the match itself." },
      { title: "Guimarães add-on", tip: "Easy combo if you have a spare half-day." },
    ],
    tips: [
      "Braga is simple. Don’t invent complexity.",
      "One night works, two nights is ideal.",
      "The city centre is compact and walkable.",
      "The football trip is stronger if you lean into the slower pace.",
      "Pairing Braga with Guimarães is a smart move if time allows.",
    ],
    food: [
      "Minho-region dishes",
      "Roast meats",
      "Cod dishes",
      "Pastries and coffee in the centre",
    ],
    transport:
      "Walk the centre. Taxis and rideshares cover the rest. Rail links to Porto and Guimarães make multi-stop planning easy enough.",
    accommodation:
      "Stay in or just off the historic centre. You do not need to stay far out in Braga unless price forces it.",
  },

  barcelos: {
    cityId: "barcelos",
    name: "Barcelos",
    country: "Portugal",
    overview:
      "Barcelos is a smaller football stop, not a heavyweight city break. Treat it honestly and it works: local, manageable and easy to pair with Braga or Porto. Expect charm and slower rhythm, not endless attractions.",
    topThings: [
      { title: "Historic centre walk", tip: "The value is in atmosphere, not ticking off sites." },
      { title: "Barcelos market culture", tip: "Timing matters; check local market days before building your trip around it." },
      { title: "Cávado riverside area", tip: "Good low-effort walking route." },
      { title: "Old churches and squares", tip: "Take them as part of the walk, not standalone destinations." },
      { title: "Ceramics and rooster symbolism", tip: "A better souvenir city than people expect." },
      { title: "Local pastry stop", tip: "Small city, slow travel, good coffee — that’s the formula." },
      { title: "Train-day pairing", tip: "Works well combined with Braga." },
      { title: "Evening centre drinks", tip: "Keep expectations realistic; this is not a late-night giant." },
      { title: "Pre-match town circuit", tip: "Get your food and drinks in town before moving toward football mode." },
      { title: "Short-stay reset", tip: "This is a place to keep the plan light." },
    ],
    tips: [
      "Best used as a football-led stop rather than a standalone long weekend.",
      "Pair it with Braga or Porto for more depth.",
      "You do not need a packed itinerary here.",
      "Lean local and simple.",
      "Check rail timing in advance.",
    ],
    food: ["Minho classics", "Simple grilled dishes", "Pastries", "Local cafés"],
    transport:
      "Small and easy locally. Public transport matters more for getting in and out than for moving around once there.",
    accommodation:
      "Central is the obvious play. If options are poor, stay in Braga and travel in.",
  },

  "vila-nova-de-famalicao": {
    cityId: "vila-nova-de-famalicao",
    name: "Vila Nova de Famalicão",
    country: "Portugal",
    overview:
      "Famalicão is a practical football town rather than a destination city. That is not an insult; it just means the trip should be shaped around matchday, local food and efficient movement, not fantasy-city-break expectations.",
    topThings: [
      { title: "Town centre loop", tip: "Keep it brief and local." },
      { title: "Central cafés", tip: "This is where the town works best." },
      { title: "Municipal gardens", tip: "Useful reset space, not a must-see landmark." },
      { title: "Market and shopping streets", tip: "Good for local rhythm more than spectacle." },
      { title: "Short Braga/Porto pairing", tip: "Best way to add travel value to the trip." },
      { title: "Pre-match meal", tip: "Eat centrally; don’t rely on stadium-adjacent options." },
      { title: "Slow afternoon plan", tip: "This is not a city you rush around." },
      { title: "Neighbourhood bar stop", tip: "Pick one good local place and be done with it." },
      { title: "Rail connection planning", tip: "Important if you’re not driving." },
      { title: "Football-first mindset", tip: "That is how the trip makes sense." },
    ],
    tips: [
      "Do not overrate the sightseeing ceiling.",
      "Use it as a clean football stop.",
      "Porto or Braga can act as a stronger base if needed.",
      "Town centre convenience matters more than hotel luxury.",
      "Matchday should be the anchor.",
    ],
    food: ["Grilled meats", "Traditional Portuguese plates", "Local bakery breakfasts"],
    transport:
      "Manageable locally. Check rail and taxi availability ahead of time if staying elsewhere.",
    accommodation:
      "Central if staying in town. Otherwise Braga is a strong fallback base.",
  },

  "moreira-de-conegos": {
    cityId: "moreira-de-conegos",
    name: "Moreira de Cónegos",
    country: "Portugal",
    overview:
      "Moreira de Cónegos is a pure football stop. It is a village-scale trip, not a broad travel product. The right move is either a short match-focused visit or using Guimarães/Braga as your actual base.",
    topThings: [
      { title: "Village-centre walk", tip: "This is about local feel, not sightseeing depth." },
      { title: "Local café stop", tip: "The simplest experiences are the right ones here." },
      { title: "Guimarães pairing", tip: "This is the smart way to make the trip richer." },
      { title: "Pre-match local food", tip: "Go simple and local." },
      { title: "Matchday atmosphere build-up", tip: "Arrive with time; that is where the value is." },
      { title: "Short local wander", tip: "Enough to feel the place without pretending it is a city break." },
      { title: "Taxi timing plan", tip: "Especially important if staying outside the village." },
      { title: "Regional road trip stop", tip: "Works best by car or paired with nearby cities." },
      { title: "Post-match exit buffer", tip: "Do not assume instant onward travel." },
      { title: "Keep it realistic", tip: "Football is the reason you are here." },
    ],
    tips: [
      "Base in Guimarães if you want an easier trip.",
      "Do not force extra activities here.",
      "Matchday and local food are the point.",
      "Transport planning matters more than attraction planning.",
      "Small-place logic wins.",
    ],
    food: ["Simple regional restaurants", "Café culture", "Northern Portuguese comfort food"],
    transport:
      "Local movement is minimal. The real issue is how you arrive and leave, especially without a car.",
    accommodation:
      "Stay in Guimarães unless you specifically want the smallest-possible local stop.",
  },

  estoril: {
    cityId: "estoril",
    name: "Estoril",
    country: "Portugal",
    overview:
      "Estoril is one of the easiest football-trip add-ons in Portugal because it gives you coast, sun, and low-friction travel from Lisbon. It is ideal if you want a calmer base without giving up access to the capital.",
    topThings: [
      { title: "Seafront promenade", tip: "Best asset in town. Walk it, especially near sunset." },
      { title: "Cascais pairing", tip: "Almost essential. The two work better together." },
      { title: "Beach stop", tip: "Weather-dependent, obvious, worth it." },
      { title: "Casino Estoril area", tip: "Good for evening atmosphere more than serious gambling plans." },
      { title: "Café and pastry circuit", tip: "Morning pace suits Estoril." },
      { title: "Rail into Lisbon", tip: "Use the train; do not make this complicated." },
      { title: "Coastal drinks", tip: "Simple and effective." },
      { title: "Short Cascais old-town walk", tip: "Strong day extension." },
      { title: "Pre-match beachfront meal", tip: "Better than eating in a rushed generic area." },
      { title: "Relaxed recovery day", tip: "Excellent post-match base if you stayed out late in Lisbon." },
    ],
    tips: [
      "Estoril is best when treated as a coastal base, not a major city.",
      "Lisbon access is easy enough that you don’t need to choose one or the other.",
      "Cascais should usually be part of the plan.",
      "Beach weather changes the whole feel of the trip.",
      "A relaxed itinerary suits the place.",
    ],
    food: ["Seafood", "Pastries", "Beachfront cafés", "Simple Portuguese grills"],
    transport:
      "The Lisbon-Cascais rail line makes the whole area easy. Walking handles most of Estoril itself.",
    accommodation:
      "Strong if you want coast plus football. Better value and calmer energy than central Lisbon in some cases.",
  },

  guimaraes: {
    cityId: "guimaraes",
    name: "Guimarães",
    country: "Portugal",
    thingsToDoUrl: GYG.guimaraes,
    overview:
      "Guimarães is one of Portugal’s best football-and-history combinations. It feels more self-contained and atmospheric than many bigger cities, with a strong old-town core and an identity that suits a proper weekend rather than a rushed stop.",
    topThings: [
      { title: "Historic centre", tip: "This is the backbone of the city and worth real time." },
      { title: "Guimarães Castle", tip: "Do it for context and feel, not because it is huge." },
      { title: "Palace of the Dukes", tip: "Pair with the castle block and move on." },
      { title: "Old squares and lanes", tip: "Best city in this league for just wandering aimlessly and enjoying it." },
      { title: "Penha cable car area", tip: "Good if you have spare daylight and decent weather." },
      { title: "Evening centre drinks", tip: "The city carries atmosphere well at night." },
      { title: "Local restaurants", tip: "Good quality, less tourist churn than bigger hubs." },
      { title: "Braga combo trip", tip: "Very easy and worth considering." },
      { title: "Matchday old-town build-up", tip: "One of the best pre-match city settings in Portugal." },
      { title: "Slow morning coffee stop", tip: "Guimarães rewards taking your time." },
    ],
    tips: [
      "Great for a two-night football weekend.",
      "Historic centre location matters for your hotel.",
      "Don’t rush the old town.",
      "Pairing with Braga is smart if you have extra time.",
      "One of the strongest smaller-city trips in Portugal.",
    ],
    food: ["Minho dishes", "Roast meats", "Traditional taverns", "Pastries and coffee"],
    transport:
      "Walk the centre. Rail and road links to Braga and Porto are good enough for multi-stop planning.",
    accommodation:
      "Stay in or near the old town. This is one of those places where central atmosphere is part of the product.",
  },

  alverca: {
    cityId: "alverca",
    name: "Alverca do Ribatejo",
    country: "Portugal",
    overview:
      "Alverca is effectively a Lisbon-adjacent football stop rather than a classic standalone destination. That is not a weakness if you plan properly: use Lisbon as the depth layer and Alverca as the match-specific extension.",
    topThings: [
      { title: "Town-centre walk", tip: "Short and functional, not destination-grade." },
      { title: "Lisbon pairing", tip: "This is the whole logic of the trip." },
      { title: "Riverside local feel", tip: "Useful if you want a slower edge away from Lisbon chaos." },
      { title: "Local café stop", tip: "Keep it simple." },
      { title: "Pre-match town meal", tip: "Better than gambling on rushed matchday timing." },
      { title: "Quick station-area logistics", tip: "Know your route in advance." },
      { title: "Football-first pacing", tip: "The place makes sense when you stay honest about what it is." },
      { title: "Day-trip framing", tip: "Usually better than a long stay." },
      { title: "Short local drinks", tip: "Functional rather than nightlife-heavy." },
      { title: "Return-to-Lisbon plan", tip: "Plan this before kick-off, not after." },
    ],
    tips: [
      "Use Lisbon as the proper city base if possible.",
      "Do not overrate Alverca’s sightseeing value.",
      "Transport planning matters more than attraction planning.",
      "Works well for a football-focused side trip.",
      "Short and efficient beats ambitious here.",
    ],
    food: ["Simple local restaurants", "Portuguese grills", "Café snacks"],
    transport:
      "The main benefit is proximity to Lisbon rather than internal city transport complexity.",
    accommodation:
      "Stay in Lisbon unless you specifically want to be very close to the club.",
  },

  arouca: {
    cityId: "arouca",
    name: "Arouca",
    country: "Portugal",
    overview:
      "Arouca is a niche football trip, but a genuinely interesting one if you like mountain-town scenery and want something less obvious. It is not a big-city football weekend. It is a quieter regional stop where the match becomes part of a broader northern-Portugal feel.",
    topThings: [
      { title: "Arouca town centre", tip: "Small, manageable, and best treated gently." },
      { title: "Paiva Walkways region", tip: "Only if you have enough time and energy. Don’t bolt it onto a rushed football day." },
      { title: "Suspension bridge area", tip: "Weather and time matter. Do not force it." },
      { title: "Mountain scenery drive", tip: "Much better if you have a car." },
      { title: "Monastery/heritage stop", tip: "Useful for local context." },
      { title: "Regional food lunch", tip: "One of the stronger reasons to come." },
      { title: "Quiet evening", tip: "This is not a nightlife destination." },
      { title: "Football-focused overnight", tip: "Works best with one relaxed night." },
      { title: "Porto-based extension", tip: "An option if you do not want to stay locally." },
      { title: "Slow travel mindset", tip: "Critical here." },
    ],
    tips: [
      "Arouca is more regional escape than city break.",
      "Car access helps a lot.",
      "Do not try to cram adventure tourism and football into one rushed day.",
      "Local food and scenery are the extra value.",
      "Best for people who actively want something different.",
    ],
    food: ["Regional meats", "Mountain cuisine", "Simple traditional restaurants"],
    transport:
      "This is one of the less frictionless Primeira Liga destinations without a car. Plan transport properly.",
    accommodation:
      "Stay local if you want the full regional feel. Otherwise use Porto as a stronger base and accept the travel trade-off.",
  },

  amadora: {
    cityId: "amadora",
    name: "Amadora",
    country: "Portugal",
    overview:
      "Amadora works as a Lisbon football extension rather than a separate trip. Treating it as its own grand city break is wrong. Treating it as part of wider Lisbon planning is correct.",
    topThings: [
      { title: "Lisbon access", tip: "This is the real value." },
      { title: "Local neighbourhood feel", tip: "Useful if you want normal-city Portugal, not polished tourism." },
      { title: "Pre-match meal in wider Lisbon zone", tip: "Often smarter than leaving everything to the last second." },
      { title: "Simple local café stop", tip: "Keep expectations grounded." },
      { title: "Metro/suburban planning", tip: "Know your route and return before heading out." },
      { title: "Day-trip framing", tip: "Usually the right approach." },
      { title: "Local matchday build-up", tip: "Arrive with enough margin to read the area." },
      { title: "Short local walk", tip: "Functional, not tourist-heavy." },
      { title: "Lisbon evening return", tip: "Best post-match move for most users." },
      { title: "Football-first planning", tip: "Again: that is the point." },
    ],
    tips: [
      "Base in Lisbon.",
      "Do not chase a separate Amadora sightseeing itinerary.",
      "Transport planning is more important than attractions.",
      "Use the club as the reason to visit the area, not the area as the reason to visit the club.",
      "Short and practical wins.",
    ],
    food: ["Local grills", "Portuguese cafés", "Simple suburban dining"],
    transport:
      "The Lisbon suburban transport network is the main story here, not internal tourism movement.",
    accommodation:
      "Lisbon base is the obvious and usually correct choice.",
  },

  funchal: {
    cityId: "funchal",
    name: "Funchal",
    country: "Portugal",
    overview:
      "Funchal is one of the most attractive football-trip destinations in the league because the city itself is a proper travel product. If you are doing Nacional, do not think like a routine mainland away day. Think island break with football built in.",
    topThings: [
      { title: "Old town and waterfront", tip: "The natural first-day loop." },
      { title: "Cable car and Monte", tip: "Classic tourist move because it works." },
      { title: "Botanical gardens", tip: "Good weather play, not a rainy backup." },
      { title: "Market stop", tip: "Worth seeing, but don’t let it eat the morning." },
      { title: "Levadas or scenic walks", tip: "Only if your schedule genuinely allows it." },
      { title: "Atlantic-view drinks", tip: "One of the easiest wins in Funchal." },
      { title: "Seafood dinner", tip: "This is not the place to eat generic food." },
      { title: "Island driving day", tip: "High reward if you extend beyond football." },
      { title: "Matchday built into island plan", tip: "The football should sit inside a wider Madeira trip." },
      { title: "Relaxed final day", tip: "Do not overstuff Funchal. The point is enjoying it." },
    ],
    tips: [
      "This is one of the best multi-night league trips.",
      "Flights and timing matter more than on mainland trips.",
      "Use the football as one pillar, not the whole itinerary.",
      "Weather can shift quickly on the island.",
      "Madeira rewards a slower pace.",
    ],
    food: ["Espetada", "Scabbardfish dishes", "Seafood", "Bolo do caco", "Poncha"],
    transport:
      "Local buses and taxis work, but hills and wider-island exploration often make car hire attractive if you have time.",
    accommodation:
      "Funchal centre/waterfront is the right base for most users. It gives restaurants, views and easy movement.",
  },

  "vila-do-conde": {
    cityId: "vila-do-conde",
    name: "Vila do Conde",
    country: "Portugal",
    overview:
      "Vila do Conde is a smart understated football stop: coastal, calmer than Porto, and easy enough to pair with bigger northern-city plans. It works well for users who want a less hectic base.",
    topThings: [
      { title: "Beachfront walk", tip: "Simple and worthwhile." },
      { title: "Town centre and river area", tip: "Good for low-pressure wandering." },
      { title: "Monastery/aqueduct area", tip: "Adds local character without requiring huge time." },
      { title: "Seafood lunch", tip: "A smart use of the place." },
      { title: "Porto add-on", tip: "Easy enough if you want city contrast." },
      { title: "Sunset coastal stop", tip: "One of the city’s best low-effort plays." },
      { title: "Local café reset", tip: "A place that suits slow travel." },
      { title: "Pre-match relaxed pacing", tip: "Don’t create unnecessary stress here." },
      { title: "Neighbourhood dinner", tip: "Better than generic central convenience." },
      { title: "Short beach morning", tip: "Strong if weather cooperates." },
    ],
    tips: [
      "Good coastal alternative to staying in Porto.",
      "Works well for calmer football weekends.",
      "Seafood is the obvious move.",
      "Keep the plan relaxed.",
      "Transport is simple enough if planned.",
    ],
    food: ["Seafood", "Fish restaurants", "Portuguese coastal dishes", "Pastries and cafés"],
    transport:
      "Rail and road links make Porto pairing viable. Local movement is straightforward.",
    accommodation:
      "Good if you want coast and quiet. Less good if you want big nightlife.",
  },

  tondela: {
    cityId: "tondela",
    name: "Tondela",
    country: "Portugal",
    overview:
      "Tondela is another honest football stop rather than a heavyweight travel city. The trip works if you accept that the football and local-region feel are the main value, not giant sightseeing depth.",
    topThings: [
      { title: "Small-town centre walk", tip: "Keep it simple." },
      { title: "Regional scenery", tip: "Useful if driving, harder if not." },
      { title: "Local food stop", tip: "One of the strongest reasons to enjoy the place properly." },
      { title: "Quiet evening", tip: "This is not a nightlife market." },
      { title: "Pre-match town pacing", tip: "The right mindset is relaxed, not hectic." },
      { title: "Dão-region wine logic", tip: "Relevant if you extend the trip by car." },
      { title: "Short overnight stay", tip: "Usually enough." },
      { title: "Nearby-city pairing", tip: "Consider using a larger base if needed." },
      { title: "Post-match exit planning", tip: "Important in smaller destinations." },
      { title: "Football-first structure", tip: "That is how the trip makes sense." },
    ],
    tips: [
      "Do not force a big-city itinerary onto Tondela.",
      "Regional Portugal is the value-add.",
      "Car access helps.",
      "Good for quieter football travel.",
      "One-night logic usually works best.",
    ],
    food: ["Regional meats", "Traditional Portuguese cooking", "Local wine-region dining"],
    transport:
      "A smaller-destination trip. Transport planning matters more than attraction planning.",
    accommodation:
      "Stay local for simplicity or use a larger regional base if hotel stock is weak.",
  },

  "ponta-delgada": {
    cityId: "ponta-delgada",
    name: "Ponta Delgada",
    country: "Portugal",
    overview:
      "Ponta Delgada is a brilliant football add-on because the city is only one part of the value. The real product is São Miguel as a whole. If you are doing Santa Clara, think island football break, not normal away-day logic.",
    topThings: [
      { title: "Historic centre", tip: "Good opener, but not the whole trip." },
      { title: "Marina and waterfront", tip: "Best for easy evening movement." },
      { title: "Sete Cidades / island scenery", tip: "Major payoff if you have time and transport." },
      { title: "Furnas day trip", tip: "A proper extra-day move, not a rushed add-on." },
      { title: "Ocean-view café stops", tip: "The island rewards slower pacing." },
      { title: "Botanical/nature spots", tip: "Weather shapes the value massively." },
      { title: "Seafood and local produce", tip: "Use the island properly; don’t eat lazily." },
      { title: "Coastal drives", tip: "Strong if hiring a car." },
      { title: "Matchday inside wider-island trip", tip: "Football should sit inside a bigger Azores plan." },
      { title: "Recovery day after match", tip: "One of the best places in the league for it." },
    ],
    tips: [
      "This is a trip to São Miguel with football included.",
      "Flights and timing matter a lot.",
      "Car hire can massively improve the trip.",
      "Build extra time if you can.",
      "One of the league’s best scenery-plus-football destinations.",
    ],
    food: ["Seafood", "Cozido-style island cuisine", "Local cheeses", "Pineapple products"],
    transport:
      "Walkable centre, but island exploration usually pushes you toward car hire or organised tours.",
    accommodation:
      "Ponta Delgada is the obvious base for first-timers. It balances football logistics with island convenience.",
  },

  "vila-das-aves": {
    cityId: "vila-das-aves",
    name: "Vila das Aves",
    country: "Portugal",
    overview:
      "Vila das Aves is another football-first destination. It makes sense as a focused stop or as an extension from a stronger northern base. Pretending it is a broad city-break destination is the mistake.",
    topThings: [
      { title: "Local centre walk", tip: "Keep it short and grounded." },
      { title: "Northern Portugal pairing", tip: "Use nearby bigger cities for depth." },
      { title: "Simple café stop", tip: "Small-town logic applies." },
      { title: "Matchday local build-up", tip: "This is the real reason to be here." },
      { title: "Short regional drive", tip: "Better with a car." },
      { title: "Pre-match meal", tip: "Plan it; don’t assume endless options." },
      { title: "Post-match travel plan", tip: "Sort this in advance." },
      { title: "Quiet overnight", tip: "Useful if you want low drama." },
      { title: "Neighbouring-city base option", tip: "Often the smarter move." },
      { title: "Football-led pacing", tip: "Again, that is the truth of the trip." },
    ],
    tips: [
      "Use a nearby bigger base if you want more depth.",
      "This is a club-town stop, not a major tourism city.",
      "Keep the plan simple.",
      "Transport needs checking in advance.",
      "Local experience over attraction-counting.",
    ],
    food: ["Local grills", "Traditional Portuguese plates", "Simple cafés"],
    transport:
      "Small-destination rules apply: check how you get in and out before the day itself.",
    accommodation:
      "Only stay here if you actively want the local feel. Otherwise use Guimarães, Braga or Porto.",
  },
};

export default primeiraLigaCityGuides;
