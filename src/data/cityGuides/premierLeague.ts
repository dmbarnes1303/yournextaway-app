// src/data/cityGuides/premierLeague.ts
import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
 *
 * Important:
 * - Use verified city landing pages only.
 * - If a city does not have a reliable clean city landing page, leave it undefined
 *   and let UI fall back to buildAffiliateLinks({ city }).experiencesUrl.
 */
const GYG = {
  london:
    "https://www.getyourguide.com/en-gb/london-l57/?partner_id=MAQJREP&utm_medium=online_publisher",
  manchester:
    "https://www.getyourguide.com/en-gb/manchester-l1128/?partner_id=MAQJREP&utm_medium=online_publisher",
  liverpool:
    "https://www.getyourguide.com/en-gb/liverpool-l210/?partner_id=MAQJREP&utm_medium=online_publisher",
  birmingham:
    "https://www.getyourguide.com/en-gb/birmingham-l2525/?partner_id=MAQJREP&utm_medium=online_publisher",
  "newcastle-upon-tyne":
    "https://www.getyourguide.com/en-gb/newcastle-upon-tyne-l444/?partner_id=MAQJREP&utm_medium=online_publisher",
  leeds:
    "https://www.getyourguide.com/en-gb/leeds-l1023/?partner_id=MAQJREP&utm_medium=online_publisher",
  nottingham:
    "https://www.getyourguide.com/en-gb/nottingham-l145813/?partner_id=MAQJREP&utm_medium=online_publisher",
  brighton:
    "https://www.getyourguide.com/en-gb/brighton-l440/?partner_id=MAQJREP&utm_medium=online_publisher",
  bournemouth:
    "https://www.getyourguide.com/en-gb/bournemouth-l1022/?partner_id=MAQJREP&utm_medium=online_publisher",
  burnley:
    "https://www.getyourguide.com/en-gb/burnley-l100710/?partner_id=MAQJREP&utm_medium=online_publisher",
  wolverhampton:
    "https://www.getyourguide.com/en-gb/wolverhampton-l103158/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const premierLeagueCityGuides: Record<string, CityGuide> = {
  london: {
    cityId: "london",
    name: "London",
    country: "England",
    thingsToDoUrl: GYG.london,

    overview:
      "London isn’t one place — it’s a set of neighbourhoods connected by world-class transport. The winning weekend formula is simple: choose a base on a great Tube line, plan days by area (not by “attractions”), and keep matchday travel deliberately boring. Do that and the city feels smooth instead of chaotic.",

    topThings: [
      {
        title: "Westminster → South Bank walk",
        tip: "Free skyline moments. Go near golden hour and you’ll beat most paid viewpoints.",
      },
      {
        title: "Borough Market",
        tip: "Go early or mid-afternoon. Pick 1–2 standout stalls and skip the queue-collector mindset.",
      },
      {
        title: "British Museum",
        tip: "Choose 2–3 galleries max. Trying to “do it all” is a guaranteed fatigue trap.",
      },
      {
        title: "Soho & Covent Garden evening",
        tip: "Anchor it with a booking (dinner or show). London nights are better with one fixed plan.",
      },
      {
        title: "Greenwich",
        tip: "Use the Thames Clipper one way — transport + sightseeing in one clean move.",
      },
      {
        title: "Notting Hill & Portobello Road",
        tip: "Weekday mornings for photos; weekends for atmosphere.",
      },
      {
        title: "Camden Markets",
        tip: "Go for the street food and people-watching. Shopping is optional noise.",
      },
      {
        title: "Primrose Hill viewpoint",
        tip: "Short walk, big payoff. Sunset is obvious for a reason.",
      },
      {
        title: "Neighbourhood pub session",
        tip: "Avoid landmark-adjacent pubs. Walk 5–10 minutes into residential streets for better value and vibe.",
      },
      {
        title: "Matchday area wander",
        tip: "Arrive early and walk around the ground. It’s often the best ‘local’ slice of your day.",
      },
    ],

    tips: [
      "Use contactless — daily caps usually beat single tickets.",
      "One main area per day is the sweet spot (London punishes zig-zagging).",
      "Don’t Uber across central: walking + Tube is typically quicker.",
      "On matchdays, build buffer time for station queues and crowd flow.",
      "After full-time, walk 10 minutes away before calling a taxi.",
    ],

    food: [
      "Borough Market",
      "Dishoom (book ahead)",
      "Sunday roast (reserve)",
      "Proper fish & chips",
      "Late-night kebab if needed",
    ],

    transport:
      "Contactless works on Tube, buses, and many rail routes. The Underground is fast but harsh at peaks — minimise transfers and use Citymapper/Maps to avoid accidental time-wasters.",

    accommodation:
      "Prioritise being near a Tube line over being ‘central’. A strong Zone 2 base near a top station usually beats Zone 1 for value and stress.",
  },

  manchester: {
    cityId: "manchester",
    name: "Manchester",
    country: "England",
    thingsToDoUrl: GYG.manchester,

    overview:
      "Manchester is elite for a weekend: compact core, serious food, and neighbourhoods that actually feel different. The best trip has one strong daytime block, one strong evening block, and minimal dead travel time.",

    topThings: [
      {
        title: "Northern Quarter wander",
        tip: "Best all-round base area: bars, cafés, indie shops, and a tight grid you can’t mess up.",
      },
      {
        title: "John Rylands Library",
        tip: "Fastest ‘wow’ stop in the city. Go early if you want it quieter.",
      },
      {
        title: "Science and Industry Museum",
        tip: "A proper half-day if you’re into how cities get built (not just how they party).",
      },
      {
        title: "Castlefield canals",
        tip: "Great reset walk before dinner. Easy drinks area too.",
      },
      {
        title: "Manchester Museum",
        tip: "Free, good quality, and a strong weather-proof option.",
      },
      {
        title: "Afflecks",
        tip: "More vibe than mission. Mid-afternoon is the sweet spot.",
      },
      {
        title: "MediaCityUK (Salford Quays)",
        tip: "Tram out if you have spare time — waterside + easy food options.",
      },
      {
        title: "Piccadilly → Market Street loop",
        tip: "Use it as a connector, not a destination.",
      },
      {
        title: "Etihad Campus area",
        tip: "If you’re going, arrive early — the scale reads better on foot.",
      },
      {
        title: "Old Trafford area",
        tip: "Plan transport in/out. Distances and crowds punish improvisation.",
      },
    ],

    tips: [
      "Central Manchester is walkable — taxis are usually wasted money.",
      "Friday/Saturday dinner fills quickly; book it.",
      "After matches, walk 10–15 minutes before calling a taxi.",
      "If you’re doing football + nightlife, schedule an afternoon reset.",
      "Bring a light waterproof — weather flips fast.",
    ],

    food: [
      "Mackie Mayor (street food)",
      "Pizza in Northern Quarter",
      "Curry Mile (Rusholme)",
      "Modern British small plates",
      "Proper breakfast cafés",
    ],

    transport:
      "Trams cover the most useful routes (Etihad, Quays). Walking wins inside the centre. Contactless is everywhere.",

    accommodation:
      "Northern Quarter/Ancoats are the cleanest choice. Deansgate is central but pricier. If you stay farther out, be near a tram stop.",
  },

  liverpool: {
    cityId: "liverpool",
    name: "Liverpool",
    country: "England",
    thingsToDoUrl: GYG.liverpool,

    overview:
      "Liverpool is a low-friction weekend: a compact centre, a proper waterfront, and nightlife that’s concentrated enough to feel lively without needing logistics. Two days is plenty if you keep the plan clean.",

    topThings: [
      {
        title: "Albert Dock",
        tip: "Start here — waterfront, museums, bars, and the easiest ‘Liverpool’ feeling in one spot.",
      },
      {
        title: "Pier Head & waterfront loop",
        tip: "Best late afternoon into evening when the lights come on.",
      },
      {
        title: "Tate Liverpool / Maritime Museum",
        tip: "Pick one. Don’t try to ‘collect’ museums like trophies.",
      },
      {
        title: "Cavern Quarter",
        tip: "Short visit for music history. Don’t let it become a whole evening by accident.",
      },
      {
        title: "Baltic Triangle",
        tip: "Relaxed drinks + food halls. A strong post-match option.",
      },
      {
        title: "Georgian Quarter",
        tip: "Quieter streets and better pubs for actual conversation.",
      },
      {
        title: "Sefton Park",
        tip: "Morning reset if you stayed out.",
      },
      {
        title: "Mersey Ferry",
        tip: "A simple scenic add-on if you have spare time.",
      },
      {
        title: "Matchday area pre-walk",
        tip: "Arrive early — the build-up is part of the weekend.",
      },
      {
        title: "Dockside dinner",
        tip: "Book it. Walk-ins get punished on weekends.",
      },
    ],

    tips: [
      "Stay central — it’s the difference between ‘easy’ and ‘annoying’.",
      "Weekend restaurant demand spikes; book ahead.",
      "After matches, walk away from the stadium zone before calling taxis.",
      "Waterfront routes are the fastest way to ‘see’ the city properly.",
      "Pace the first night — Liverpool weekends run late.",
    ],

    food: [
      "Baltic Market",
      "Independent burger spots",
      "Seafood by the docks",
      "Italian in the centre",
      "Traditional pubs with kitchens",
    ],

    transport:
      "Most central routes are walkable. Merseyrail helps for suburbs. Taxis exist but slow down right after events.",

    accommodation:
      "Albert Dock, Liverpool ONE and Ropewalks are strong bases. Avoid far-out hotels unless you’re on a rail line.",
  },

  birmingham: {
    cityId: "birmingham",
    name: "Birmingham",
    country: "England",
    thingsToDoUrl: GYG.birmingham,

    overview:
      "Birmingham is a practical football weekend: big-city choice, good-value hotels, and simple transport. It’s not a checklist city — pick two strong neighbourhood blocks, then let food and nightlife do the rest.",

    topThings: [
      {
        title: "Canals at Brindleyplace",
        tip: "Best walk-and-eat zone. Easy to make it your evening base.",
      },
      {
        title: "Mailbox → canals loop",
        tip: "A clean route that naturally connects food, bars, and water.",
      },
      {
        title: "Jewellery Quarter",
        tip: "Best neighbourhood feel + pubs. Do it daytime, stay for dinner.",
      },
      {
        title: "Digbeth",
        tip: "Street art and nightlife. Best late afternoon into evening.",
      },
      {
        title: "Birmingham Museum & Art Gallery",
        tip: "High-value free option when weather turns.",
      },
      {
        title: "Victoria Square",
        tip: "Good meeting point. Not a long stop.",
      },
      {
        title: "Bullring & Grand Central",
        tip: "Do it quickly if you need essentials. Don’t burn prime time shopping.",
      },
      {
        title: "Cadbury World (optional)",
        tip: "Only if you genuinely want it — otherwise it’s a time sink.",
      },
      {
        title: "Pre-match meal",
        tip: "Eat early. Match weekends make kitchens chaotic.",
      },
      {
        title: "Post-match exit plan",
        tip: "Queues and slow exits are normal — build buffer time.",
      },
    ],

    tips: [
      "Plan by neighbourhood: centre + Digbeth + Jewellery Quarter is a clean split.",
      "If you’re staying out, base near New Street for easy returns.",
      "Book dinner Fri/Sat — walk-ins get punished.",
      "Use trains/trams where possible for match travel.",
      "After full-time, walk first before calling taxis.",
    ],

    food: [
      "Balti Triangle curry",
      "Independent pizza",
      "Street food in Digbeth",
      "Modern British bistros",
      "Canal-side restaurants",
    ],

    transport:
      "New Street connects everything. Trams cover key centre routes. Uber is common but slow immediately after events.",

    accommodation:
      "Stay near New Street, Brindleyplace, or Jewellery Quarter for the best balance.",
  },

  "newcastle-upon-tyne": {
    cityId: "newcastle-upon-tyne",
    name: "Newcastle upon Tyne",
    country: "England",
    thingsToDoUrl: GYG["newcastle-upon-tyne"],

    overview:
      "Newcastle is one of England’s best weekend cities: compact centre, proper food scene, and nightlife that’s energetic without needing a car. It’s easy to navigate, feels like a real break in 24–48 hours, and pairs perfectly with a match.",

    topThings: [
      {
        title: "Quayside & bridges walk",
        tip: "Walk both sides of the Tyne — best in the evening when it’s lit.",
      },
      {
        title: "Grey Street & Grainger Town",
        tip: "Architecture + cafés in one neat daytime loop.",
      },
      {
        title: "Ouseburn Valley",
        tip: "Creative quarter with breweries and venues. Ideal chilled evening.",
      },
      {
        title: "Baltic Centre (view level)",
        tip: "Free entry, strong views, low effort.",
      },
      {
        title: "Newcastle Castle",
        tip: "Small but central — worth it for context and viewpoint.",
      },
      {
        title: "Tynemouth day trip",
        tip: "Metro to the coast for a beach walk and proper fish & chips.",
      },
      {
        title: "Victoria Tunnel",
        tip: "Book ahead. Don’t assume walk-ins.",
      },
      {
        title: "Jesmond Dene",
        tip: "The best morning reset if you went hard the night before.",
      },
      {
        title: "Eldon Square (only if needed)",
        tip: "Use it if weather forces you indoors. Otherwise skip.",
      },
      {
        title: "Matchday pre-walk",
        tip: "Arrive early and let the build-up happen — Newcastle does it well.",
      },
    ],

    tips: [
      "You can do most of Newcastle on foot — base location matters less than in London.",
      "Friday/Saturday gets busy fast; book dinner.",
      "Metro is the cleanest move for airport + coast.",
      "After matches, expect crowds — build exit time.",
      "Pack layers: wind and rain can flip quickly.",
    ],

    food: [
      "Traditional pub food",
      "Seafood in Tynemouth",
      "Modern British bistros",
      "Street food in Ouseburn",
    ],

    transport:
      "Tyne & Wear Metro connects airport, city, coast. Walking covers most central routes. Taxis are plentiful at night.",

    accommodation:
      "City Centre and Quayside are the easiest bases. Jesmond is quieter with strong Metro links.",
  },

  leeds: {
    cityId: "leeds",
    name: "Leeds",
    country: "England",
    thingsToDoUrl: GYG.leeds,

    overview:
      "Leeds is a high-output weekend city: compact centre, strong bars, and a simple rhythm — coffee, culture, food, then nightlife. It rewards basic structure and punishes overplanning.",

    topThings: [
      {
        title: "Royal Armouries",
        tip: "Free and genuinely good — give it 60–90 minutes, not five.",
      },
      {
        title: "Corn Exchange",
        tip: "Best small landmark: indie shops + great architecture.",
      },
      {
        title: "Trinity Leeds & Victoria Quarter",
        tip: "A clean central loop for coffee, food and a quick browse.",
      },
      {
        title: "Calls Landing / waterfront",
        tip: "Easy early-evening bar zone by the water.",
      },
      {
        title: "Leeds City Museum",
        tip: "Short, easy cultural stop if you have spare time.",
      },
      {
        title: "Roundhay Park",
        tip: "Big green reset — best on a calm morning.",
      },
      {
        title: "Kirkstall Abbey",
        tip: "Combine with a pub nearby. Don’t overthink it.",
      },
      {
        title: "Local brewery session",
        tip: "Good for a relaxed evening. Busy weekends.",
      },
      {
        title: "Matchday logistics",
        tip: "If you’re heading to Elland Road, decide transport early.",
      },
      {
        title: "Evening bar crawl",
        tip: "Call Lane is the obvious cluster — start earlier than you think.",
      },
    ],

    tips: [
      "Leeds centre is walkable. Don’t default to taxis.",
      "Match weekends spike hotel demand — book early.",
      "Nightlife clusters: Call Lane + Merrion Street.",
      "Elland Road travel needs planning — don’t wing it last minute.",
      "If you’re combining cities, Leeds–Manchester trains are frequent.",
    ],

    food: [
      "Trinity Kitchen",
      "Bundobust",
      "Kirkgate Market food hall",
      "Steak/modern grills",
      "Strong brunch cafés",
    ],

    transport:
      "Leeds is a major rail hub. Buses and taxis fill gaps; most central trips are best on foot.",

    accommodation:
      "City Centre, near the Arena, or near the Station. Prioritise walkability over ‘nice’ rooms.",
  },

  /**
   * IMPORTANT: only ONE Nottingham entry.
   */
  nottingham: {
    cityId: "nottingham",
    name: "Nottingham",
    country: "England",
    thingsToDoUrl: GYG.nottingham,

    overview:
      "Nottingham is a compact weekend city with real character: historic pubs, independent streets, and just enough heritage to feel distinct without needing a long itinerary. It’s perfect for a football-led break because you can keep everything walkable and efficient.",

    topThings: [
      {
        title: "Old Market Square",
        tip: "Use it as your navigation anchor — everything branches cleanly from here.",
      },
      {
        title: "Ye Olde Trip to Jerusalem",
        tip: "Go early. Weekends and matchdays fill fast and the queues are not worth your time.",
      },
      {
        title: "Lace Market evening",
        tip: "Best neighbourhood feel for bars and dinner — more atmosphere than the main shopping streets.",
      },
      {
        title: "Hockley wander",
        tip: "Indie shops, coffee, and casual bars. Best in daylight.",
      },
      {
        title: "Nottingham Castle viewpoint",
        tip: "Treat it as a views stop. Don’t overcommit time to exhibitions unless you’re genuinely into them.",
      },
      {
        title: "City of Caves (optional)",
        tip: "Do it if you want the history. Skip it if your priority is food + matchday.",
      },
      {
        title: "River Trent walk",
        tip: "A simple pre-match reset if the weather behaves.",
      },
      {
        title: "Pre-match pub route",
        tip: "Start central then move gradually towards the ground — don’t camp in one spot too early.",
      },
      {
        title: "Post-match plan",
        tip: "Either leave fast or commit to one drink. Sitting in the middle of the surge is the worst option.",
      },
      {
        title: "One good dinner",
        tip: "Book it. The best places aren’t built for last-minute walk-ins on peak nights.",
      },
    ],

    tips: [
      "Stay central — your trip will feel twice as smooth.",
      "On big fixtures, accommodation tightens quickly. Book early.",
      "Eat earlier on matchdays to avoid queues and rushed kitchens.",
      "Most of the city works on foot; taxis are rarely necessary.",
      "Short on time? Do: Hockley + Lace Market + one historic pub.",
    ],

    food: [
      "Gastropubs in the Lace Market",
      "Independent pizza",
      "Casual small plates",
      "Indian near the centre",
      "Late-night kebab if needed",
    ],

    transport:
      "City centre is walkable. Public transport covers suburbs; taxis are easy but slow right after events.",

    accommodation:
      "City centre or Lace Market gives the best nightlife + easy stadium travel balance.",
  },

  brighton: {
    cityId: "brighton",
    name: "Brighton",
    country: "England",
    thingsToDoUrl: GYG.brighton,

    overview:
      "Brighton is a match weekend with a real ‘get away’ feel: sea air, strong cafés, and an easy day-to-night rhythm. The only rule is logistics — the stadium isn’t central, so plan transport and everything stays smooth.",

    topThings: [
      {
        title: "Seafront walk",
        tip: "Walk west towards Hove for calmer stretches and better morning coffee.",
      },
      {
        title: "The Lanes",
        tip: "Best for wandering. Do it daytime, then return for drinks.",
      },
      {
        title: "North Laine",
        tip: "Indie shops and food — it feels more ‘Brighton’ than the main strip.",
      },
      {
        title: "Brighton Palace Pier",
        tip: "Do it as a pass-through, not a time sink.",
      },
      {
        title: "i360 (weather dependent)",
        tip: "Only on a clear day. If visibility is poor, skip.",
      },
      {
        title: "Town pubs pre-match",
        tip: "Atmosphere is better in town than near the stadium.",
      },
      {
        title: "Falmer travel plan",
        tip: "Train is the cleanest route. Expect packed carriages on matchdays.",
      },
      {
        title: "Beach breakfast",
        tip: "Perfect morning-after reset if you stayed out.",
      },
      {
        title: "Small restaurants",
        tip: "Brighton excels at casual dining — book Fri/Sat.",
      },
      {
        title: "Sunset drinks",
        tip: "When weather hits, it’s elite. Time it properly.",
      },
    ],

    tips: [
      "Stay central Brighton or Hove — not near the stadium.",
      "Use trains to Falmer; it’s the cleanest route.",
      "Bring layers — coastal wind is common even when it looks fine.",
      "Book restaurants on Friday/Saturday nights.",
      "If weather’s rough, pivot to cafés + The Lanes and don’t force the seafront.",
    ],

    food: [
      "Seafood by the seafront",
      "Independent burgers",
      "Vegan/vegetarian cafés",
      "Small wine bars",
      "Strong brunch spots",
    ],

    transport:
      "Falmer station serves the stadium and is ~10 minutes by train from Brighton Station. Trains are frequent but busy on matchdays.",

    accommodation:
      "Central Brighton or Hove. Avoid staying at Falmer unless you have a specific reason.",
  },

  burnley: {
    cityId: "burnley",
    name: "Burnley",
    country: "England",
    thingsToDoUrl: GYG.burnley,

    overview:
      "Burnley is football-first: compact, local, and straightforward. Keep expectations aligned — this is about matchday and a simple overnight, not a big-city attraction checklist.",

    topThings: [
      {
        title: "Town centre loop",
        tip: "Quick loop for food and a feel of the place — don’t stretch it.",
      },
      {
        title: "Towneley Park",
        tip: "Best daytime option if you’re staying overnight.",
      },
      {
        title: "Towneley Hall (optional)",
        tip: "Only if you genuinely have spare time.",
      },
      {
        title: "Local breakfast café",
        tip: "Go early; options thin out quickly.",
      },
      {
        title: "Pre-match pubs",
        tip: "Arrive early if you want a seat — capacity fills fast.",
      },
      {
        title: "Post-match pint",
        tip: "Move quickly after full-time; the good spots fill fast.",
      },
      {
        title: "Countryside add-on (if you have a car)",
        tip: "Lancashire scenery is the real bonus if you extend the trip.",
      },
      {
        title: "Keep plans simple",
        tip: "This isn’t the place to chase 10 attractions in a day.",
      },
      {
        title: "Weather realism",
        tip: "Cold/wet is common — dress like you mean it.",
      },
      {
        title: "Transport planning",
        tip: "Most routes run via Manchester/Preston — check timings early.",
      },
    ],

    tips: [
      "Hotels are limited — book as soon as you commit.",
      "Plan food before matchday rush, especially if arriving late.",
      "Dress for cold and wet. Don’t be optimistic.",
      "If you want nightlife, stay in Manchester and commute.",
      "Treat it as a focused football stop, not a tourist city.",
    ],

    food: [
      "Traditional pubs",
      "Fish & chips",
      "Curry houses",
      "Simple cafés",
    ],

    transport:
      "Burnley Manchester Road is the main station. Town is walkable; taxis fill gaps.",

    accommodation:
      "Limited options in town. Manchester/Blackburn can be practical alternatives.",
  },

  wolverhampton: {
    cityId: "wolverhampton",
    name: "Wolverhampton",
    country: "England",
    thingsToDoUrl: GYG.wolverhampton,

    overview:
      "Wolverhampton is a focused Midlands base: strong rail links, straightforward matchday, and easy access to Birmingham if you want bigger nightlife. It’s a football-led stop with practical upside.",

    topThings: [
      {
        title: "City centre loop",
        tip: "Cover the core quickly — use it as a warm-up, not the main event.",
      },
      {
        title: "Art Gallery",
        tip: "Free, easy, and a solid indoor fallback.",
      },
      {
        title: "West Park",
        tip: "Good pre-match walk if weather behaves.",
      },
      {
        title: "Grand Theatre (if staying longer)",
        tip: "Check listings — sometimes there’s a genuinely strong show.",
      },
      {
        title: "Black Country Living Museum (nearby)",
        tip: "Worth it if you have half a day and want something properly different.",
      },
      {
        title: "Birmingham side trip",
        tip: "Trains are quick — use it for nightlife or extra sightseeing.",
      },
      {
        title: "Classic pub session",
        tip: "Traditional pubs tend to beat ‘trendy’ bars here.",
      },
      {
        title: "Matchday timing",
        tip: "Arrive early — queues spike around kick-off.",
      },
      {
        title: "Post-match exit",
        tip: "Walk away from the stadium zone before calling taxis.",
      },
      {
        title: "Food anchor",
        tip: "One decent booking makes the day feel planned without effort.",
      },
    ],

    tips: [
      "Book accommodation early for home weekends — availability tightens quickly.",
      "If you want city energy, use Birmingham and commute.",
      "Eat earlier on matchdays — kitchens get overwhelmed.",
      "Weather can be grim — dress properly.",
      "Keep the plan simple and it’s a great stop.",
    ],

    food: [
      "British pub food",
      "Strong Indian/Bangladeshi options",
      "Casual grills",
      "Post-match takeaway",
    ],

    transport:
      "The station sits next to the centre; most routes are walkable. Trains to Birmingham are frequent and quick.",

    accommodation:
      "City centre or near the station is easiest. For more choice, stay in Birmingham and travel over.",
  },

  sunderland: {
    cityId: "sunderland",
    name: "Sunderland",
    country: "England",

    // No reliable clean GYG Sunderland city landing page confirmed here.
    // Leave undefined and let UI fall back to buildAffiliateLinks({ city }).experiencesUrl.

    overview:
      "Sunderland is a football-first coastal stop with simple logistics and a strong local feel. If you want a bigger nightlife layer, pair it with Newcastle (easy by Metro). If you treat Sunderland as an honest match-led trip, it works well.",

    topThings: [
      {
        title: "Seaburn & Roker seafront",
        tip: "Best morning-after reset: coffee, sea air, long walk.",
      },
      {
        title: "National Glass Centre",
        tip: "Quick, free, and actually linked to the city’s identity.",
      },
      {
        title: "Penshaw Monument (nearby)",
        tip: "Worth it if you have transport and clear weather.",
      },
      {
        title: "City centre quick loop",
        tip: "Keep it tight — this isn’t a ‘wander for hours’ centre.",
      },
      {
        title: "Newcastle add-on",
        tip: "If you want nightlife, just do it. Metro makes it easy.",
      },
      {
        title: "Coastal fish & chips",
        tip: "Eat by the sea, not in chain spots.",
      },
      {
        title: "Pre-match timing",
        tip: "Arrive early if you want seats — capacity is limited.",
      },
      {
        title: "Post-match plan",
        tip: "Leave fast or commit to one drink. The middle-of-the-surge option is the worst.",
      },
      {
        title: "Weather realism",
        tip: "Coastal wind makes it feel colder. Dress properly.",
      },
      {
        title: "Keep expectations aligned",
        tip: "It’s about authenticity, not polish — and that’s fine.",
      },
    ],

    tips: [
      "If you need more ‘city’, stay in Newcastle and take the Metro.",
      "Book hotels early on big fixtures/derby weekends.",
      "Wrap up — coastal wind is no joke.",
      "Eat early on matchdays to avoid queues.",
      "Keep it simple: coast + matchday + one decent meal.",
    ],

    food: [
      "Fish & chips by the seafront",
      "Traditional pubs",
      "Casual Italian/grill",
      "Breakfast cafés",
    ],

    transport:
      "Sunderland station and Metro connect to Newcastle and wider Tyne & Wear. Stadium of Light has its own Metro stop.",

    accommodation:
      "City centre or Seaburn seafront. For more choice, stay in Newcastle and commute.",
  },

  bournemouth: {
    cityId: "bournemouth",
    name: "Bournemouth",
    country: "England",
    thingsToDoUrl: GYG.bournemouth,

    overview:
      "Bournemouth is a straight seaside weekend: beach walks, simple dining, and an easy matchday. It’s best when you treat it as a reset — don’t overstuff the itinerary.",

    topThings: [
      {
        title: "Beachfront walk",
        tip: "Early morning or sunset is best. Midday gets crowded in season.",
      },
      {
        title: "Pier stroll",
        tip: "Quick vibe hit — don’t overcommit time.",
      },
      {
        title: "Lower Gardens",
        tip: "Easy green route linking beach to town.",
      },
      {
        title: "Boscombe stretch",
        tip: "A quieter alternative to central beach.",
      },
      {
        title: "Poole Harbour (nearby)",
        tip: "Good views and restaurants if you extend the trip.",
      },
      {
        title: "Jurassic Coast day trip (if longer stay)",
        tip: "Only if you have real spare time — not on a tight match weekend.",
      },
      {
        title: "Town centre bars",
        tip: "Small cluster. Easy night without chaos.",
      },
      {
        title: "Pre-match plan",
        tip: "Capacity is limited — plan food/drinks early.",
      },
      {
        title: "Stadium walk-in timing",
        tip: "Arrive early — queues build quickly due to concourse size.",
      },
      {
        title: "Sunset ender",
        tip: "Finish on the seafront. Simple, but it works.",
      },
    ],

    tips: [
      "Weekend fixtures tighten hotel availability — book early.",
      "Vitality Stadium is walkable from centre (~25 mins).",
      "Eat away from the immediate seafront for better value.",
      "Weather dictates the vibe — keep an indoor backup.",
      "Bournemouth works best when it’s relaxed.",
    ],

    food: [
      "Seafood near the beach",
      "Casual grills",
      "Italian in the centre",
      "Promenade breakfast cafés",
    ],

    transport:
      "Mainline station with direct services from London. Local buses cover town and beaches. Taxis work for short hops.",

    accommodation:
      "Town centre or West Cliff for walkability. Beachfront costs more in peak season.",
  },
};

export default premierLeagueCityGuides;
