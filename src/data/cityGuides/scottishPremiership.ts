import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
 */
const GYG = {
  glasgow:
    "https://www.getyourguide.com/en-gb/glasgow-l438/?partner_id=MAQJREP&utm_medium=online_publisher",
  edinburgh:
    "https://www.getyourguide.com/en-gb/edinburgh-l44/?partner_id=MAQJREP&utm_medium=online_publisher",
  aberdeen:
    "https://www.getyourguide.com/en-gb/aberdeen-l936/?partner_id=MAQJREP&utm_medium=online_publisher",
  dundee:
    "https://www.getyourguide.com/en-gb/dundee-l919/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const scottishPremiershipCityGuides: Record<string, CityGuide> = {
  glasgow: {
    cityId: "glasgow",
    name: "Glasgow",
    country: "Scotland",
    thingsToDoUrl: GYG.glasgow,

    overview:
      "Glasgow is one of the best football cities in Europe because the football is not an add-on — it sits in the middle of the city’s identity. This is a place where club culture, neighbourhood identity, pubs, music, and general city energy all feed into the same weekend. The winning formula is simple: stay central, pick your match carefully, and treat the football as the spine of the trip rather than trying to squeeze it awkwardly between tourist filler. Glasgow rewards confidence. If you overplan, you slow it down. If you keep the structure clean, it becomes one of the easiest and most memorable football weekends in the app.",

    topThings: [
      { title: "Merchant City → Trongate → city-centre pub route", tip: "Best all-round pre-match and evening block if you want atmosphere without overcomplicating logistics." },
      { title: "Kelvingrove Museum and west-end loop", tip: "High-value daytime option if you want something worthwhile without killing the football rhythm." },
      { title: "Finnieston food and bar run", tip: "Strongest non-tourist-feeling evening area for a proper Glasgow night." },
      { title: "Ashton Lane / west end", tip: "Good if you want a polished version of Glasgow nightlife rather than the rougher central-city pub circuit." },
      { title: "George Square and central orientation walk", tip: "Useful at the start just to get the city shape into your head." },
      { title: "Riverside walk and Hydro side", tip: "A decent low-effort daytime connector, not a thing to build a whole day around." },
      { title: "One proper Glasgow pub session", tip: "Do not treat the pubs as afterthoughts. In Glasgow they are part of the football experience." },
      { title: "Old Firm or major Glasgow fixture planning", tip: "This is where the city goes from good to elite, but planning and timing matter far more." },
      { title: "Subway-led stadium day", tip: "The city is at its best when you let the compact transport system keep the day simple." },
      { title: "Late walk back through the centre", tip: "Glasgow nights often feel better when you move between areas rather than locking into one venue too early." },
    ],

    tips: [
      "Stay central or west-central. It makes the whole weekend smoother.",
      "Pick the fixture properly. Not every Glasgow football day carries the same weight.",
      "Book Saturday dinner if the weekend is busy.",
      "Do not rely on taxis after major matches unless you enjoy wasted time.",
      "Glasgow is a football city first. Lean into that rather than fighting it.",
    ],

    food: [
      "Classic Glasgow pubs",
      "Good curry options",
      "West-end small plates and bar food",
      "Steak or grill spot for one proper dinner",
      "Late takeaway that is actually part of the city experience",
    ],

    transport:
      "The Subway is one of the simplest football-weekend systems in Britain and should be used properly. Central Glasgow is walkable in useful chunks, and rail links help with wider Scotland connections. Taxis are fine until everyone leaves a stadium at once, then they become dead time.",

    accommodation:
      "City Centre, Merchant City, and Finnieston are the strongest bases. West End works well if nightlife and restaurants matter more than pure station convenience. Staying too far out is stupid unless price savings are massive.",
  },

  edinburgh: {
    cityId: "edinburgh",
    name: "Edinburgh",
    country: "Scotland",
    thingsToDoUrl: GYG.edinburgh,

    overview:
      "Edinburgh is one of the easiest football city breaks in the entire app because the city already works brilliantly without the match. Add Hearts or Hibernian properly and you get a weekend that feels complete rather than stitched together. The mistake people make is turning Edinburgh into a giant checklist city and then trying to wedge football around it. Wrong approach. The smarter play is to choose two or three strong city blocks, keep travel minimal, and let the match anchor the day. Do that and Edinburgh becomes elite: scenic, walkable, pub-friendly, and properly football-relevant.",

    topThings: [
      { title: "Old Town and Royal Mile loop", tip: "Do it once, do it properly, and then move on. Do not spend your whole weekend trapped in tourist flow." },
      { title: "Grassmarket pub stretch", tip: "Great for atmosphere, but better earlier than late when it gets too obvious and crowded." },
      { title: "Calton Hill or Arthur's Seat viewpoint", tip: "Pick one. Collecting viewpoints is lazy itinerary writing." },
      { title: "Stockbridge brunch or coffee block", tip: "Excellent morning-after reset if you stayed out." },
      { title: "Leith food and bar run", tip: "Best if you want the city to feel less touristy and more lived-in." },
      { title: "Haymarket → West End practical base", tip: "This is often the smartest football-weekend zone, especially for Hearts." },
      { title: "Edinburgh derby planning", tip: "One of the best domestic city-derby trips in Britain if timed right." },
      { title: "Princes Street Gardens connector walk", tip: "Useful for city flow, not a major destination in itself." },
      { title: "One proper Scottish pub meal", tip: "Worth doing because Edinburgh can become too café-and-snack if you are careless." },
      { title: "Nightcap away from the loudest tourist strip", tip: "The city improves fast when you step slightly off the obvious routes." },
    ],

    tips: [
      "Stay central, Haymarket, or just off the Old Town fringe.",
      "Edinburgh punishes overplanning less than London, but it still punishes zig-zagging.",
      "For Hearts, Haymarket is especially strong. For Hibs, central plus Leith-side works well.",
      "The city is very walkable, but hills and weather matter more than people pretend.",
      "Do not waste prime football-weekend hours in endless souvenir-shop territory.",
    ],

    food: [
      "Classic pub food",
      "Leith seafood or better-value restaurants",
      "Good brunch spots",
      "One proper whisky bar if that is your thing",
      "Scottish comfort food done properly rather than tourist trash",
    ],

    transport:
      "Edinburgh is highly walkable if you base yourself properly. Trams help with airport access and west-side movement, while buses fill the gaps. Taxis are useful, but most football-weekend routes should be solved by location choice rather than constant rides.",

    accommodation:
      "Haymarket, West End, central Old Town fringe, and parts of New Town are the strongest football-weekend bases. Leith works if you specifically want its food and bar scene. Do not stay too far out just to save a few quid and then burn it on time and taxis.",
  },

  aberdeen: {
    cityId: "aberdeen",
    name: "Aberdeen",
    country: "Scotland",
    thingsToDoUrl: GYG.aberdeen,

    overview:
      "Aberdeen is not Scotland’s prettiest football weekend on first impression, but that is exactly why people underrate it. Done properly, it works very well: compact enough to handle easily, enough pubs and food to hold an overnight, and a proper major-club football stop in Aberdeen FC. The trick is not to oversell the city as some glamorous break it is not. It works best as a solid, northern football city with a slightly harder edge and enough harbour-city character to give the trip shape. Treat it honestly and it delivers.",

    topThings: [
      { title: "Union Street and central pub route", tip: "Best starting spine for understanding the city and building a simple football day." },
      { title: "Old Aberdeen short detour", tip: "Worth it if you want one distinctly different area without wasting half the day." },
      { title: "Harbour or seafront block", tip: "Good atmospheric add-on, especially if you want the city to feel less urban-monotone." },
      { title: "Pittodrie approach on foot", tip: "Useful because the ground itself is part of why you came." },
      { title: "One proper pre-match pint circuit", tip: "Aberdeen works better when you let the football lead the day instead of hiding it in the schedule." },
      { title: "Evening food booking near the centre", tip: "Makes the overnight feel deliberate rather than improvised." },
      { title: "Compact one-night football stay", tip: "Usually the sweet spot. Two nights can work, but one is often enough." },
      { title: "Beachfront morning reset", tip: "A good next-day cleanser if you had a proper night out." },
      { title: "Station-area practicality block", tip: "Useful if you are rail-led and want the trip to stay friction-free." },
      { title: "Classic northern football-city mindset", tip: "That is the right lens for Aberdeen. Do not expect Edinburgh with a different accent." },
    ],

    tips: [
      "Keep the plan compact. Aberdeen is better when treated as a focused football overnight.",
      "Stay central or near the station.",
      "Pittodrie is a major reason to come, so do not reduce the day to pure logistics.",
      "The city is better than outsiders give it credit for, but only if expectations are realistic.",
      "This is a football city break, not a luxury lifestyle weekend.",
    ],

    food: [
      "Good central pubs",
      "One proper seafood option if you want it",
      "Solid grills and comfort-food spots",
      "Practical breakfast cafés",
      "A booked dinner rather than random wandering",
    ],

    transport:
      "Central Aberdeen is manageable on foot in useful chunks, and that is the right way to use it. The stadium approach is straightforward enough from central areas. Once you are based properly, the city should feel low-friction rather than sprawling.",

    accommodation:
      "City Centre and station-adjacent areas are the best choices. Waterfront can work if you like a slightly neater feel, but central practicality matters more than a supposedly nicer room further out.",
  },

  dundee: {
    cityId: "dundee",
    name: "Dundee",
    country: "Scotland",
    thingsToDoUrl: GYG.dundee,

    overview:
      "Dundee is one of the best football-led city stops in Scotland because the football identity of the place is absurdly strong for its size. Two clubs, two famous old grounds, and one of the strangest derby geographies in Britain give it immediate value. The city itself is not trying to be Edinburgh and should not be judged like it. Dundee works when you treat it as a compact football stop with enough modern waterfront polish and enough pub-life practicality to support a proper overnight. That makes it a very good football weekend, even if it is not a flashy one.",

    topThings: [
      { title: "Dundee derby context walk", tip: "Even if there is no derby on, understanding how close the two grounds are is part of the point of the city." },
      { title: "Waterfront and V&A exterior area", tip: "Good modern-city contrast to the older football feel." },
      { title: "City-centre pub session", tip: "Best done simply. Dundee is not a city for over-curated nightlife routes." },
      { title: "One ground-area wander before kickoff", tip: "Essential here because the football geography is such a big part of the trip." },
      { title: "Dundee station to city-core loop", tip: "Useful for keeping the trip friction-free if arriving by rail." },
      { title: "One practical dinner booking", tip: "Dundee improves when you commit to one decent evening anchor." },
      { title: "Short waterfront morning reset", tip: "A good simple morning-after move." },
      { title: "Traditional football-city framing", tip: "This city is at its best when you let football be the headline, not the side quest." },
      { title: "Compact one-night stay", tip: "Usually enough to get the full point of Dundee unless you are specifically hunting both club experiences." },
      { title: "Old-school Scottish football stop", tip: "That is the right mentality. Dundee is about football texture, not luxury gloss." },
    ],

    tips: [
      "Dundee is stronger as a football stop than as a mainstream city-break destination.",
      "Stay central or by the waterfront.",
      "The grounds are the real stars, so leave time to absorb them.",
      "One night is usually enough unless fixtures line up perfectly.",
      "Do not try to force Edinburgh-style sightseeing value out of Dundee. That is not what it is for.",
    ],

    food: [
      "Simple pub food",
      "Waterfront or centre dinner spots",
      "Solid breakfast cafés",
      "One practical pre-match meal",
    ],

    transport:
      "Dundee works best on foot once you are central. The station, centre, waterfront, and football logic all join up reasonably well. The city is compact enough that overusing taxis usually just means you planned badly.",

    accommodation:
      "Dundee Centre and the Waterfront are the obvious strongest bases. Anything too far out is usually false economy on a football weekend.",
  },

  motherwell: {
    cityId: "motherwell",
    name: "Motherwell",
    country: "Scotland",

    overview:
      "Motherwell is not a luxury city break and there is no point pretending otherwise. It is a football-first stop built around Fir Park and the practical reality of west-central Scotland travel. That is fine. Not every stop needs to sell itself as some polished weekend fantasy. Motherwell works when you are honest about what you are here for: the club, the ground, and a proper local football experience. If you want bigger nightlife, stronger restaurants, and more city energy, Glasgow is the better base and Motherwell becomes the match leg of the trip.",

    topThings: [
      { title: "Fir Park matchday", tip: "The entire reason the stop matters. Build around it properly." },
      { title: "Simple town-centre practical loop", tip: "Enough to give the place context without wasting time." },
      { title: "Glasgow-plus-Motherwell split", tip: "Usually the smartest move for most visitors." },
      { title: "One local pub pre-match", tip: "Worth doing because the whole point here is club realism and local feel." },
      { title: "Quick overnight stop", tip: "Works fine if the football is the sole focus." },
      { title: "Station-led easy planning", tip: "Useful if you want no drama and minimal wasted time." },
      { title: "No-fake-glamour mindset", tip: "This stop improves when you stop trying to force it into being something bigger than it is." },
      { title: "West-of-Scotland football route building", tip: "Motherwell works well when paired with Glasgow fixtures or wider regional planning." },
      { title: "One practical dinner", tip: "Keep it simple and the trip stays clean." },
      { title: "Early return to Glasgow", tip: "Often the right call if you want the evening to have more life." },
    ],

    tips: [
      "Motherwell is a football stop, not a luxury city-break play.",
      "Glasgow is usually the stronger stay base.",
      "Best treated honestly and simply.",
      "Fir Park is the reason to come, so do not bury the football in the schedule.",
      "Works well in a wider west-central Scotland football plan.",
    ],

    food: [
      "Simple local pubs",
      "One practical sit-down meal",
      "Rail-friendly quick food options",
      "Better wider dinner choices in Glasgow",
    ],

    transport:
      "The transport logic is simple: most visitors should think Glasgow first, Motherwell second. Rail links make this easy enough, and there is no serious reason to make the trip more complicated than that.",

    accommodation:
      "Motherwell Centre works if you want the most direct football-first overnight. Glasgow City Centre is the better all-round base for almost everyone else.",
  },

  paisley: {
    cityId: "paisley",
    name: "Paisley",
    country: "Scotland",

    overview:
      "Paisley is a practical football stop rather than a full-scale destination weekend. The reason it matters is St Mirren and the fact that it sits so conveniently within the Glasgow orbit. That makes it useful and easy, but you need to be honest about what it is. If you want a broad city weekend, stay in Glasgow. If you want a low-friction, airport-friendly football stop with some local identity of its own, Paisley works perfectly well.",

    topThings: [
      { title: "St Mirren matchday", tip: "The only real reason the stop belongs in the route, so treat it as the anchor." },
      { title: "Paisley town-centre pub and meal block", tip: "Enough to make the trip feel local without pretending Paisley is trying to outshine Glasgow." },
      { title: "Airport-to-football convenience plan", tip: "One of the strongest use-cases for this stop." },
      { title: "Quick overnight football stay", tip: "Very efficient if timing matters more than glamour." },
      { title: "Glasgow-plus-Paisley split", tip: "Usually the smartest overall option for visitors." },
      { title: "One practical local pint", tip: "Worth doing because the club’s local context matters." },
      { title: "Short station-area planning", tip: "Keeps the stop friction-free if you are moving fast." },
      { title: "No-nonsense west-Scotland football routing", tip: "Paisley is good precisely because it does not need to be overcomplicated." },
      { title: "Arrival-day or departure-day football", tip: "One of the best Scottish stops for this exact purpose." },
      { title: "Simple football-first pacing", tip: "That is the right way to handle Paisley." },
    ],

    tips: [
      "Paisley is mostly about practicality and St Mirren.",
      "Excellent if you are flying through Glasgow Airport.",
      "Better as a football stop than as a standalone leisure weekend.",
      "Glasgow is still the better broader stay base.",
      "The trip works best when kept simple.",
    ],

    food: [
      "Local pubs",
      "Simple pre-match meal options",
      "One practical dinner",
      "Better late-night options in Glasgow",
    ],

    transport:
      "This is one of the easiest stops in the league for airport-led planning. Rail and road links are straightforward, and the main decision is whether you want to sleep in Paisley for convenience or in Glasgow for overall weekend quality.",

    accommodation:
      "Paisley works for pure convenience, especially near the station or airport corridor. Glasgow is the stronger base if you want the trip to feel like more than just a match stop.",
  },

  kilmarnock: {
    cityId: "kilmarnock",
    name: "Kilmarnock",
    country: "Scotland",

    overview:
      "Kilmarnock is a traditional football-town stop, not a polished city-break flex. That is exactly why it works for the right kind of traveller. Rugby Park gives the town real football value, and the club’s age and standing mean this is not some throwaway lower-tier detour disguised as a top-flight destination. The smart version of the trip is straightforward: keep it football-led, stay practical, and stop expecting big-city nightlife or endless sightseeing. If you want that, Glasgow is the obvious wider base.",

    topThings: [
      { title: "Rugby Park matchday", tip: "The reason to come. The football is the headline here." },
      { title: "Town-centre practical walk", tip: "Enough to understand the place without inventing fake attractions." },
      { title: "One proper pre-match pub", tip: "Important because old-club stops work better when they feel rooted locally." },
      { title: "West-of-Scotland football pairing", tip: "Kilmarnock works better when linked intelligently with Glasgow or another regional stop." },
      { title: "One-night football stay", tip: "Usually enough unless you have a very specific extra reason to linger." },
      { title: "Glasgow-base alternative", tip: "Still the stronger move if nightlife matters more than local immersion." },
      { title: "Traditional-club framing", tip: "This stop is about football history and local texture, not city glamour." },
      { title: "Simple local meal block", tip: "Keep it clean and practical." },
      { title: "Rail-led easy movement", tip: "Useful if you want the whole trip to stay low-drama." },
      { title: "No-overplanning football stop", tip: "That is how Kilmarnock is best used." },
    ],

    tips: [
      "This is a football-first stop.",
      "Rugby Park and the club’s heritage are the main draw.",
      "One night is enough for most visitors.",
      "Glasgow is the better wider base if you want more evening life.",
      "Do not try to turn Kilmarnock into something it is not.",
    ],

    food: [
      "Traditional pubs",
      "Simple town-centre meal options",
      "One practical sit-down dinner",
      "Basic breakfast café stop",
    ],

    transport:
      "The town is practical enough once you are in it. The real choice is whether to stay local for football convenience or use Glasgow as the stronger wider-weekend base and travel in.",

    accommodation:
      "Kilmarnock Centre is best for local practicality. Glasgow is better if you want a stronger all-round football weekend with more nightlife and hotel depth.",
  },

  falkirk: {
    cityId: "falkirk",
    name: "Falkirk",
    country: "Scotland",

    overview:
      "Falkirk is not a tourism-first stop, but as a football-led trip it has real value because the club carries more weight than casual outsiders assume. The place sits in a very usable part of central Scotland, which makes it practical, and the football matters enough to give the trip a proper reason for existing. This is one of those stops that works if you are serious about football geography, league coverage, or traditional Scottish clubs with ambition. It works badly if you expect a glamorous standalone city break.",

    topThings: [
      { title: "Falkirk matchday", tip: "The clear anchor. This stop only makes sense when the football is treated as the point." },
      { title: "Simple station-to-town practical route", tip: "Good for keeping the trip clean and easy." },
      { title: "One local pub block", tip: "Enough to give the place character without overdoing it." },
      { title: "Central-Scotland football routing", tip: "Where Falkirk becomes especially useful." },
      { title: "Short football overnight", tip: "Often enough if the fixture is the headline." },
      { title: "Glasgow or Edinburgh split-base option", tip: "Valid if you want a broader city layer on top of the football." },
      { title: "No-fuss football stop", tip: "That is the correct mindset here." },
      { title: "One proper pre-match meal", tip: "Helpful because a clean anchor improves smaller-town trips a lot." },
      { title: "Ambitious-club context framing", tip: "This is part of why Falkirk are interesting compared with more anonymous stops." },
      { title: "Low-drama transport planning", tip: "One of the practical strengths of the stop." },
    ],

    tips: [
      "Falkirk is a football-first stop.",
      "Best used either as a focused overnight or as part of a wider central-Scotland route.",
      "Do not oversell the town itself.",
      "The club has more emotional weight than the place’s tourism profile suggests.",
      "Keep the trip practical and it works well.",
    ],

    food: [
      "Straightforward pubs",
      "Simple town-centre dining",
      "One practical sit-down meal",
      "Coffee stop before or after rail travel",
    ],

    transport:
      "Falkirk’s big strength is location. It is easy enough to fit into wider Scottish travel if you plan sensibly. Once there, the stop should remain practical rather than complicated.",

    accommodation:
      "Falkirk town-centre options are fine for a direct football overnight. Glasgow or Edinburgh are better if you want a stronger broader-trip layer.",
  },

  livingston: {
    cityId: "livingston",
    name: "Livingston",
    country: "Scotland",

    overview:
      "Livingston is not one of Scotland’s romantic football stops. It is a practical one. That is not a criticism. It just means the logic of the trip is different. You are not coming for old streets, iconic pubs, or heritage architecture. You are coming because the fixture works, the location is useful, and the club offers part of the Scottish football picture that older glamour clubs do not. If you handle it that way, Livingston is perfectly functional. If you try to force it into being a dreamy football weekend, it falls flat immediately.",

    topThings: [
      { title: "Livingston matchday", tip: "The only real reason the stop exists in the route — so treat it as the point." },
      { title: "Practical overnight near the ground or town core", tip: "Useful if convenience is your top priority." },
      { title: "Glasgow / Edinburgh split-base option", tip: "Often smarter if you want actual nightlife or city atmosphere on the same trip." },
      { title: "One simple pre-match pub or meal", tip: "Enough to structure the day without pretending there is more to squeeze from the town than there is." },
      { title: "Rail-and-road logistics play", tip: "This is where Livingston is strongest: convenience, not glamour." },
      { title: "No-fake-romance football stop", tip: "Exactly the right mindset for this city." },
      { title: "Short football detour in a wider Scotland route", tip: "Very valid use-case." },
      { title: "Quick post-match exit strategy", tip: "Good if you are using it as a branch trip from a bigger city." },
      { title: "One-night match-focused stop", tip: "Enough for most people." },
      { title: "Modern-club context stop", tip: "Useful if you care about understanding the full shape of Scottish football, not just the heritage clubs." },
    ],

    tips: [
      "Livingston is about practicality, not romance.",
      "The stop works when you accept that.",
      "Better used as a football branch than as a major standalone weekend.",
      "Glasgow or Edinburgh are stronger wider bases.",
      "Keep it efficient and it does its job.",
    ],

    food: [
      "Practical chain and casual dining options",
      "One simple pre-match meal",
      "Coffee stop and quick breakfast",
      "Better evening food in Glasgow or Edinburgh if you split the trip",
    ],

    transport:
      "Transport convenience is the main asset here. The city is useful because it sits well within central-Scotland movement patterns. That is the point. Use it that way.",

    accommodation:
      "Livingston is fine for convenience-led overnight stays. Glasgow and Edinburgh are better if you want the football trip to feel broader and more enjoyable beyond the match itself.",
  },
};

export default scottishPremiershipCityGuides;
