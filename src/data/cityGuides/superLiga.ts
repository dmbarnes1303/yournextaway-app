import type { CityGuide } from "./types";

const GYG = {
  bucharest:
    "https://www.getyourguide.com/en-gb/bucharest-l111/?partner_id=MAQJREP&utm_medium=online_publisher",
  "cluj-napoca":
    "https://www.getyourguide.com/en-gb/cluj-napoca-l325/?partner_id=MAQJREP&utm_medium=online_publisher",
  craiova:
    "https://www.getyourguide.com/en-gb/craiova-l1159/?partner_id=MAQJREP&utm_medium=online_publisher",
  sibiu:
    "https://www.getyourguide.com/en-gb/sibiu-l1430/?partner_id=MAQJREP&utm_medium=online_publisher",
  constanta:
    "https://www.getyourguide.com/en-gb/constanta-l1182/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const superLigaCityGuides: Record<string, CityGuide> = {
  bucharest: {
    cityId: "bucharest",
    name: "Bucharest",
    country: "Romania",
    thingsToDoUrl: GYG.bucharest,

    overview:
      "Bucharest is the obvious heavyweight football base in Romania: biggest city, biggest football culture, biggest stadium scale, and enough nightlife and neighbourhood variation that a match trip never has to feel one-dimensional. The key to using Bucharest properly is simple: stay central, use the Metro intelligently, and treat stadium travel as one deliberate move rather than a whole-day logistics problem. Do that and the city feels fast, lively, and easy. Do it badly and you waste hours crossing a city that is larger and more spread out than first-time visitors expect.",

    topThings: [
      { title: "Old Town evening block", tip: "Best used as a drinks-and-dinner zone, not as your entire view of Bucharest." },
      { title: "Calea Victoriei walk", tip: "One of the cleanest daytime routes for architecture, cafés, and a more polished city feel." },
      { title: "Palace of the Parliament", tip: "Worth seeing for scale alone, but don’t let one mega-building eat half your day." },
      { title: "Romanian Athenaeum area", tip: "Strong elegant central stop that pairs well with Victoriei wandering." },
      { title: "Herăstrău / King Michael I Park", tip: "Best daylight reset if you want green space before a night match." },
      { title: "Local beer hall or grill house", tip: "Good match-weekend move if you want something more grounded than tourist-strip dining." },
      { title: "Arena Națională exterior approach", tip: "Arrive early in big-match settings — the scale reads far better when you’re not rushing." },
      { title: "Giulești / club-neighbourhood contrast", tip: "Useful if you want to feel how different Bucharest’s football identities are, not just see one generic capital." },
      { title: "Evening boulevard walk", tip: "Bucharest often feels better after dark than in the middle of a hot, traffic-heavy afternoon." },
      { title: "One proper café session", tip: "The city’s café culture is part of the product, not wasted time between football stops." },
    ],

    tips: [
      "Old Town, Universitate, or Piața Romană are usually the smartest stay bases.",
      "Use the Metro for the heavy lifting; taxis are useful but traffic can punish bad timing.",
      "Bucharest works best when you cluster the trip by area rather than zig-zagging.",
      "Big-match weekends justify booking dinner and accommodation early.",
      "This is the easiest Romanian city to build around multiple football options in one trip.",
    ],

    food: [
      "Traditional Romanian grills",
      "Old Town restaurants if you choose carefully",
      "Modern bistros along central boulevards",
      "Craft beer bars with food",
      "Late-night shawarma or kebab if needed",
    ],

    transport:
      "The Bucharest Metro does most of the important work if you stay central and plan matchday sensibly. Surface traffic can be slow, so use taxis and rides only when they genuinely save a transfer or a long walk.",

    accommodation:
      "Old Town is strongest for nightlife, Universitate is better balanced, and Piața Romană / Victoriei often give the best mix of city feel and practical movement. Staying near a stadium is usually the wrong answer unless price is unusually strong.",
  },

  "cluj-napoca": {
    cityId: "cluj-napoca",
    name: "Cluj-Napoca",
    country: "Romania",
    thingsToDoUrl: GYG["cluj-napoca"],

    overview:
      "Cluj-Napoca is one of the cleanest all-round football weekends in Romania because it combines proper city-break quality with serious football relevance. Two notable clubs, a compact and attractive centre, strong food options, and a younger, nightlife-friendly atmosphere make Cluj easy to recommend. The city is not huge, which helps. If you stay central and keep the plan walkable, you can fit football, food, bars, and daytime sightseeing into one trip without it ever feeling stretched or overplanned.",

    topThings: [
      { title: "Union Square / central old core", tip: "The obvious starting point and still the correct one." },
      { title: "Central Park", tip: "A very easy daylight reset before heading toward the stadium zones." },
      { title: "Cluj Arena surroundings", tip: "Good sports-district feel and a useful pre-match orientation walk." },
      { title: "Old Town restaurant circuit", tip: "Best to book one strong dinner rather than bounce between average places." },
      { title: "Student-heavy bar streets", tip: "Cluj’s younger energy is part of what makes the city feel alive at night." },
      { title: "Matthias Corvinus / central landmark loop", tip: "Works well as a short architecture-and-coffee block." },
      { title: "Riverside or park-side walking", tip: "Useful if you want the trip to breathe between meals and football." },
      { title: "Pre-match central drinks", tip: "Cluj handles this better than trying to improvise around the grounds." },
      { title: "Night square return", tip: "The centre usually looks and feels better after dark." },
      { title: "Slow morning café reset", tip: "Strong city for a calm day-after recovery before travel home." },
    ],

    tips: [
      "Stay central; Cluj rewards walkability.",
      "This is one of the easiest Romanian football cities to use efficiently.",
      "Good choice if you want football plus proper nightlife and food depth.",
      "The city is compact enough that overusing taxis is often pointless.",
      "Ideal for a clean two-night trip.",
    ],

    food: [
      "Transylvanian cuisine",
      "Modern Romanian restaurants",
      "Wine bars",
      "Student-area burgers and casual spots",
      "Strong brunch cafés",
    ],

    transport:
      "Central Cluj is largely walkable for visitors. Taxis and rides are useful for stadium movements or airport links, but most city-break movement should stay simple and central.",

    accommodation:
      "Old Town or the central core is the clear best base. Staying farther out usually saves less than you think once you factor in time and transport friction.",
  },

  craiova: {
    cityId: "craiova",
    name: "Craiova",
    country: "Romania",
    thingsToDoUrl: GYG.craiova,

    overview:
      "Craiova is a football-first Romanian trip, but a better one than outsiders often assume. The city’s main asset is obvious: Universitatea Craiova and one of the strongest modern stadium experiences in the country. Beyond that, the city is compact, easy enough to navigate, and perfectly usable for a one- or two-night football break. This is not Bucharest and it is not trying to be. The appeal is a serious football environment, a straightforward centre, and a trip structure that stays clean if you do not overcomplicate it.",

    topThings: [
      { title: "Ion Oblemenco Stadium exterior and approach", tip: "One of the city’s headline assets — arrive early and take it in properly." },
      { title: "Nicolae Romanescu Park", tip: "Best daylight reset if you want a break from urban matchday rhythm." },
      { title: "Old Town dining zone", tip: "Small enough to stay efficient, lively enough to work for dinner and drinks." },
      { title: "Art Museum / palace area", tip: "Good if you want a short culture block without burning the whole day." },
      { title: "Central square and pedestrian streets", tip: "Use them for orientation and a relaxed pre-match wander." },
      { title: "University district feel", tip: "Adds a bit of youth and movement to the city beyond football." },
      { title: "Pre-match café session", tip: "Craiova works better when you keep the build-up calm and central." },
      { title: "One strong traditional dinner", tip: "Better than picking at random around the stadium zone." },
      { title: "Evening central walk", tip: "The city centre reads best once it cools down and lights come on." },
      { title: "Morning-after local bakery or coffee stop", tip: "Good low-friction finish to a football-led overnight." },
    ],

    tips: [
      "Craiova is primarily about the football product, and that’s fine.",
      "Stay central rather than trying to live beside the stadium.",
      "One-night trips work well here, but two nights are comfortable if you want a slower pace.",
      "Do not expect endless sightseeing — expect a solid football city with enough around it.",
      "Best when treated as a focused football weekend rather than a giant sightseeing mission.",
    ],

    food: [
      "Traditional Romanian restaurants",
      "Old Town grills and bistros",
      "Central cafés",
      "Late simple food near the centre",
    ],

    transport:
      "Craiova is manageable if you keep everything central. Matchday should be one clear outward movement rather than a transport puzzle. Short taxi rides can be useful, but much of the useful city core is easy enough to handle without overthinking it.",

    accommodation:
      "Central Craiova and the Old Town area are the strongest bases. They give you the easiest balance of food, nightlife, and straightforward stadium access.",
  },

  sibiu: {
    cityId: "sibiu",
    name: "Sibiu",
    country: "Romania",
    thingsToDoUrl: GYG.sibiu,

    overview:
      "Sibiu is one of the strongest city-break football trips in Romania because the city is genuinely attractive before you even factor in the match. The old town is beautiful, compact, and easy to use; the food and café scene are strong enough for a relaxed weekend; and Hermannstadt’s presence gives the trip a proper football anchor without overwhelming the wider city experience. This is one of those places where the football and the city actually improve each other rather than competing for your time.",

    topThings: [
      { title: "Large Square", tip: "The natural centrepoint for almost every Sibiu weekend plan." },
      { title: "Bridge of Lies", tip: "Touristy, yes — still worth doing because it fits the old town flow perfectly." },
      { title: "Old Town street wander", tip: "Best done slowly rather than turned into a rushed checklist." },
      { title: "Council Tower viewpoint", tip: "Good short effort-to-reward ratio if you want a city overview." },
      { title: "Traditional Transylvanian dinner", tip: "One properly chosen meal goes further here than several average ones." },
      { title: "Old Town evening drinks", tip: "Sibiu suits calm quality over chaotic nightlife." },
      { title: "Pre-match central coffee block", tip: "A strong city for low-pressure build-up before kickoff." },
      { title: "Local squares after dark", tip: "The old centre has a properly atmospheric evening feel." },
      { title: "Morning pastry and coffee", tip: "Very strong place for a calm second-day rhythm." },
      { title: "Short culture stop", tip: "Pick one museum or church at most unless history is your main priority." },
    ],

    tips: [
      "Stay in or right beside the Old Town.",
      "Sibiu is one of Romania’s easiest football-plus-city-break combinations.",
      "You do not need to over-schedule this city — it works best when allowed to breathe.",
      "Great choice for couples or slower-paced football weekends.",
      "Two nights is the sweet spot.",
    ],

    food: [
      "Transylvanian cuisine",
      "Old Town restaurants",
      "Wine bars",
      "Coffee and pastry spots",
      "Casual central bistros",
    ],

    transport:
      "Sibiu’s central old core is highly walkable. Most of the useful visitor experience should happen on foot, with short taxi hops only where they genuinely simplify stadium or airport movements.",

    accommodation:
      "Old Town is the obvious best answer. Central Sibiu just outside the old core is also fine, but the closer you stay to the historic centre, the better the weekend usually feels.",
  },

  constanta: {
    cityId: "constanta",
    name: "Constanța",
    country: "Romania",
    thingsToDoUrl: GYG.constanta,

    overview:
      "Constanța gives Romanian football travel something most of the rest of the league cannot: proper Black Sea atmosphere. Farul may not offer the biggest stadium spectacle in the country, but the coastal setting changes the trip completely. This is one of the strongest football-plus-leisure weekends in Romania when the weather behaves. The correct way to frame it is obvious: sea, promenade, seafood, and football as part of a wider relaxed coastal break rather than a hard-edged urban football mission.",

    topThings: [
      { title: "Constanța Casino seafront area", tip: "The city’s iconic visual anchor and still the right place to start." },
      { title: "Black Sea waterfront walk", tip: "Best at golden hour or early evening." },
      { title: "Old Town core", tip: "Worth doing, but do not expect it to carry the whole weekend by itself." },
      { title: "Mamaia add-on", tip: "Useful if you want nightlife or a more resort-style extension in season." },
      { title: "Seafood dinner", tip: "This is one city where the meal choice genuinely shapes the quality of the trip." },
      { title: "Harbour district feel", tip: "Adds some working-city reality beyond the resort image." },
      { title: "Pre-match drink by the sea", tip: "One of the nicest football build-ups in the league if the weather is good." },
      { title: "Beach or promenade reset", tip: "Best used as a low-pressure second-day block." },
      { title: "Morning coastal coffee", tip: "Excellent calm start after a later night." },
      { title: "Farul matchday plan", tip: "Treat the stadium move as one simple transfer from the coast-side base." },
    ],

    tips: [
      "Weather matters more here than on inland trips.",
      "Constanța is best when sold honestly as football plus coast, not football alone.",
      "Stay near the coast or in the central core rather than forcing the immediate stadium area.",
      "Summer or shoulder-season weekends usually give the best version of this trip.",
      "One of Romania’s strongest relaxed football weekends.",
    ],

    food: [
      "Seafood",
      "Black Sea coast dining",
      "Old Town restaurants",
      "Seafront cafés",
      "Simple beachside breakfasts",
    ],

    transport:
      "Constanța is straightforward if you keep your base around the centre or the coast. The football movement is secondary to the wider city-break structure, so keep it simple and do not overengineer the day.",

    accommodation:
      "Central Constanța is the strongest all-round base. Mamaia works if you want more resort energy or summer nightlife, but central stays usually keep the football weekend more balanced.",
  },

  pitesti: {
    cityId: "pitesti",
    name: "Pitești",
    country: "Romania",

    overview:
      "Pitești is a practical football stop rather than a glamour destination, but that does not make it useless. For Argeș trips, the key is honesty: this is about football, a manageable overnight, and keeping logistics simple. Treat it like a giant city-break and it disappoints. Treat it like a clean Romanian football stop and it works perfectly well.",

    topThings: [
      { title: "City-centre loop", tip: "Enough for orientation, food, and a sense of place without pretending the city is endless." },
      { title: "Nicolae Dobrin football context", tip: "The club identity matters more than trying to force a tourist-heavy narrative." },
      { title: "Local restaurant stop", tip: "One decent meal is enough to anchor the evening." },
      { title: "Central café session", tip: "Useful low-effort downtime before or after travel." },
      { title: "Park or boulevard wander", tip: "Good if you want a short reset before matchday." },
      { title: "Pre-match planning block", tip: "This trip works best when logistics are decided early." },
      { title: "Short evening in the centre", tip: "Keep expectations realistic and it’s perfectly fine." },
      { title: "One-night football stay", tip: "This is the cleanest way to frame the city." },
      { title: "Morning coffee before departure", tip: "Good low-friction end to the trip." },
      { title: "Mioveni linkage if needed", tip: "Important if the club is not using its natural long-term home context." },
    ],

    tips: [
      "Best approached as a football-led overnight.",
      "Keep the plan central and simple.",
      "Do not oversell Pitești as a major city-break.",
      "Works much better when expectations are realistic.",
      "Useful part of a complete Romanian league map.",
    ],

    food: [
      "Traditional Romanian dining",
      "Central cafés",
      "Straightforward grills",
      "Bakery breakfast options",
    ],

    transport:
      "Pitești is manageable if you stay central and keep the trip compact. The main mistake is overcomplicating connections for what should be a straightforward football stop.",

    accommodation:
      "Central Pitești is the clear best base. It gives the easiest route to food, a short city walk, and whatever match logistics the trip requires.",
  },

  arad: {
    cityId: "arad",
    name: "Arad",
    country: "Romania",

    overview:
      "Arad is one of the cleaner and more understated football trips in Romania: a decent-looking city centre, a modern stadium, and a structure that makes a one-night stay feel easy rather than forced. It is not a huge headline destination, but it is absolutely a credible football weekend for people who care about domestic depth and not just the obvious capital or Transylvanian names.",

    topThings: [
      { title: "Central Arad architecture walk", tip: "The city’s Habsburg-era feel is one of its better surprises." },
      { title: "Theatre quarter / central boulevards", tip: "Best area for the city’s more elegant urban feel." },
      { title: "Mureș river area", tip: "Useful for a calmer pre-match or morning walk." },
      { title: "Arena Francisc Neuman approach", tip: "A modern ground that improves the trip a lot." },
      { title: "One proper dinner in the centre", tip: "Better than wandering aimlessly for food after dark." },
      { title: "Local café stop", tip: "Arad suits a measured pace more than overstacked planning." },
      { title: "Evening centre wander", tip: "Good city for a simple night rather than a huge one." },
      { title: "Pre-match central drinks", tip: "Usually the cleanest formula here." },
      { title: "Morning bakery or coffee", tip: "Works well as a tidy end to the trip." },
      { title: "Timișoara linkage if routing wider", tip: "Useful if you are building a broader western Romania trip." },
    ],

    tips: [
      "Good one-night football trip.",
      "Stay central rather than near the stadium.",
      "A stronger city than many people expect at first glance.",
      "Best for travellers who value low-friction football weekends.",
      "Modern ground makes the trip cleaner than older domestic stops.",
    ],

    food: [
      "Romanian and Central European-style dining",
      "Central cafés",
      "Simple grills",
      "Wine and beer bars",
    ],

    transport:
      "Arad is easiest when handled from a central base. Most useful city movement is short and simple, with taxis filling the stadium gap without much stress.",

    accommodation:
      "Central Arad is the best answer. It keeps the architecture, food, and matchday movement all in the same manageable orbit.",
  },

  botosani: {
    cityId: "botosani",
    name: "Botoșani",
    country: "Romania",

    overview:
      "Botoșani is a football-first stop in the truest sense. This is not a city you sell as a polished European weekend break. The value is elsewhere: covering a less-obvious part of the Romanian map, seeing a proper domestic club in its own setting, and keeping the trip honest, short, and efficient. That is enough. It does not need false glamour added on top.",

    topThings: [
      { title: "Central Botoșani walk", tip: "Useful for orientation and enough for a small-city feel." },
      { title: "Old-centre café stop", tip: "A practical anchor before or after matchday." },
      { title: "Local restaurant dinner", tip: "Keep it simple and central." },
      { title: "Stadionul Municipal approach", tip: "Football is clearly the main reason you’re here." },
      { title: "Morning square loop", tip: "Good if you are staying one night and leaving the next day." },
      { title: "Short local shopping streets", tip: "Useful filler, not a headline attraction." },
      { title: "Pre-match food plan", tip: "Decide it early rather than relying on late improvisation." },
      { title: "One-night football framing", tip: "The correct way to think about the city." },
      { title: "Regional route linkage", tip: "Best if you are building a broader north-east Romania trip." },
      { title: "Simple coffee-and-go exit", tip: "Low-friction departures suit this kind of stop." },
    ],

    tips: [
      "Treat Botoșani as a proper football stop, not a glamour destination.",
      "One night is usually enough.",
      "Stay central and keep the trip simple.",
      "This is about league depth and club identity, not tourist volume.",
      "Best for serious domestic-football coverage.",
    ],

    food: [
      "Simple Romanian restaurants",
      "Central cafés",
      "Straightforward grills",
      "Bakery breakfasts",
    ],

    transport:
      "The city itself is manageable once you arrive. The broader travel planning matters more than inner-city movement, so keep the local part clean and central.",

    accommodation:
      "Central Botoșani or the old-centre-adjacent area is the strongest base. There is little upside in staying farther out.",
  },

  galati: {
    cityId: "galati",
    name: "Galați",
    country: "Romania",

    overview:
      "Galați is a more committed football trip by Romanian standards because distance and logistics matter more here than in the obvious hubs. That is part of the appeal. Oțelul are a proper identity club, and the city has enough Danube-side character to stop the trip feeling dead, but this is still more football-first than city-break-first. Treat it as a serious domestic stop and it works. Pretend it is a polished easy-weekend tourism product and you are setting it up to fail.",

    topThings: [
      { title: "Danube-front walk", tip: "The city’s best simple visual asset and a useful reset block." },
      { title: "Central Galați loop", tip: "Enough for food, orientation, and a feel for the city." },
      { title: "Oțelul matchday build-up", tip: "The football identity is the main point here." },
      { title: "River-adjacent dinner", tip: "Best way to give the trip some atmosphere beyond the stadium." },
      { title: "Local café stop", tip: "Useful in a city that works better slowly than through overplanning." },
      { title: "Pre-match simple meal", tip: "Sort it centrally before heading out." },
      { title: "Short evening in the centre", tip: "Keep expectations realistic and it works fine." },
      { title: "Morning Danube coffee", tip: "Good low-pressure start before travel." },
      { title: "Regional Brăila linkage", tip: "Useful if you are shaping a broader lower-Danube route." },
      { title: "Committed overnight framing", tip: "This is not the easiest Romanian trip, but that’s part of the point." },
    ],

    tips: [
      "Plan travel early — Galați is not a lazy last-minute trip.",
      "Better as a football-led overnight than a long sightseeing weekend.",
      "Stay central and keep the city part simple.",
      "The Danube setting helps more than the city’s reputation suggests.",
      "Best for serious league travellers rather than casual dabblers.",
    ],

    food: [
      "Traditional Romanian meals",
      "Riverfront dining where available",
      "Central cafés",
      "Simple local grills",
    ],

    transport:
      "Once in Galați, local movement is manageable. The harder part is getting there cleanly, so the trip improves a lot if the local stay remains central and uncomplicated.",

    accommodation:
      "Central Galați or the Danube-adjacent central area is the best base. It gives you the easiest balance of city feel and match practicality.",
  },

  ploiesti: {
    cityId: "ploiesti",
    name: "Ploiești",
    country: "Romania",

    overview:
      "Ploiești is a football-first domestic trip with real club culture but limited need for exaggeration. Petrolul are the headline, not the city’s tourism portfolio. The city works if you respect that. A clean overnight, a serious matchday, and a simple central base are enough to make the trip worthwhile for anyone who actually values club identity over glossy packaging.",

    topThings: [
      { title: "Ilie Oană matchday approach", tip: "The stadium and club atmosphere are the main reason the trip works." },
      { title: "Central Ploiești walk", tip: "Useful for orientation, not for endless discovery." },
      { title: "Local restaurant dinner", tip: "Best done centrally and without overthinking it." },
      { title: "Short central café stop", tip: "Good pre-match time filler if kept simple." },
      { title: "One-night football stay", tip: "The correct framing for most visitors." },
      { title: "Morning bakery or coffee", tip: "Low-effort but effective end to the trip." },
      { title: "Pre-match pub or bar", tip: "Worth doing if you want a more club-led feel to the day." },
      { title: "Simple evening route", tip: "Ploiești is better handled cleanly than overpacked." },
      { title: "Bucharest linkage", tip: "Useful if building a wider Romania route." },
      { title: "Football-over-tourism mindset", tip: "Important here — the trip improves when framed honestly." },
    ],

    tips: [
      "Ploiești is about Petrolul first.",
      "Stay central and keep matchday simple.",
      "Do not oversell this as a major city-break.",
      "Works well as an overnighter or focused side trip.",
      "Good stop for real domestic-football coverage.",
    ],

    food: [
      "Traditional grills",
      "Central cafés",
      "Simple Romanian dining",
      "Late casual food if needed",
    ],

    transport:
      "Ploiești is straightforward if you keep your base central. The city is not complicated enough to justify elaborate planning, which is one of its strengths for a football overnight.",

    accommodation:
      "Central Ploiești is the best option. It keeps the trip tight and avoids pointless extra movement.",
  },

  "miercurea-ciuc": {
    cityId: "miercurea-ciuc",
    name: "Miercurea Ciuc",
    country: "Romania",

    overview:
      "Miercurea Ciuc is one of the most niche trips in the Romanian map, and that is exactly why it matters. This is not a mainstream football weekend. It is a smaller-scale, regionally distinct, football-led stop with a colder-climate, local-identity feel that is completely different from Bucharest or Cluj. It is not for everyone. It is for people who actually care about the full league and want variety in what football travel means.",

    topThings: [
      { title: "Compact town-centre loop", tip: "Enough to understand the place without pretending it is huge." },
      { title: "Local café or pastry stop", tip: "Simple, useful, and appropriate for the town’s scale." },
      { title: "Municipal stadium approach", tip: "The match is clearly the anchor here." },
      { title: "Short evening in the centre", tip: "Keep expectations aligned and it works well enough." },
      { title: "Regional atmosphere absorb-and-go", tip: "Part of the appeal is just feeling a different football geography." },
      { title: "One-night football framing", tip: "The correct way to structure this trip." },
      { title: "Morning coffee before departure", tip: "Useful low-friction finish." },
      { title: "Cool-weather realism", tip: "Dress properly — conditions matter more here." },
      { title: "Rail linkage planning", tip: "Important because the town is not a lazy spontaneous add-on." },
      { title: "Regional Transylvania extension", tip: "Best if folded into a wider route." },
    ],

    tips: [
      "This is a niche domestic-football trip, not a broad tourism play.",
      "Keep the trip simple and realistic.",
      "One night is usually enough.",
      "The appeal is regional identity and league completeness.",
      "Dress for the conditions rather than the calendar.",
    ],

    food: [
      "Simple local restaurants",
      "Town-centre cafés",
      "Bakery breakfasts",
      "Straightforward matchday food",
    ],

    transport:
      "The town itself is manageable. The broader route in and out matters more than local travel, so keep the stay compact and practical.",

    accommodation:
      "Central Miercurea Ciuc is the best base. There is little reason to complicate a trip whose main value is clarity and local football texture.",
  },

  slobozia: {
    cityId: "slobozia",
    name: "Slobozia",
    country: "Romania",

    overview:
      "Slobozia is one of the purest practicality-first trips in the whole project. There is no point pretending otherwise. This is a football stop, not a dream city break. That does not make it worthless. It makes it honest. The value is in giving proper depth to the league map, showing where clubs actually live, and handling the trip efficiently rather than trying to decorate it with fake glamour.",

    topThings: [
      { title: "Central Slobozia loop", tip: "Enough for orientation and a basic town feel." },
      { title: "Short pre-match meal", tip: "Decide it early and keep expectations simple." },
      { title: "Local café stop", tip: "Useful for low-friction downtime." },
      { title: "Stadionul 1 Mai approach", tip: "Football is clearly the main event here." },
      { title: "One-night practical stay", tip: "This is the natural product." },
      { title: "Morning coffee and exit", tip: "Best clean finish to the trip." },
      { title: "Bucharest linkage", tip: "Important for broader route planning." },
      { title: "No-overcomplication rule", tip: "Critical in a place like this." },
      { title: "Simple town-centre dinner", tip: "Good enough if framed properly." },
      { title: "Match-first scheduling", tip: "The city does not need padding to work." },
    ],

    tips: [
      "Treat Slobozia as a football stop and nothing more.",
      "Keep logistics tight.",
      "One night is enough for almost everyone.",
      "Useful for serious whole-league coverage.",
      "Do not waste time trying to make it something it isn’t.",
    ],

    food: [
      "Simple local dining",
      "Town-centre cafés",
      "Bakery breakfast options",
      "Straightforward pre-match meals",
    ],

    transport:
      "Local movement is easy because there is not much point in overextending the trip. The bigger issue is how Slobozia fits into your wider Romania route.",

    accommodation:
      "Central Slobozia is the only sensible answer if you are staying. Anything else just adds friction without adding value.",
  },
};

export default superLigaCityGuides;
