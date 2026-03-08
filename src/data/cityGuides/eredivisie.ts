import type { CityGuide } from "./types";

const GYG = {
  amsterdam: "https://www.getyourguide.com/en-gb/amsterdam-l36/?partner_id=MAQJREP&utm_medium=online_publisher",
  rotterdam: "https://www.getyourguide.com/en-gb/rotterdam-l37/?partner_id=MAQJREP&utm_medium=online_publisher",
  utrecht: "https://www.getyourguide.com/en-gb/utrecht-l32239/?partner_id=MAQJREP&utm_medium=online_publisher",
  eindhoven: "https://www.getyourguide.com/en-gb/eindhoven-l982/?partner_id=MAQJREP&utm_medium=online_publisher",
  alkmaar: "https://www.getyourguide.com/en-gb/alkmaar-l1291/?partner_id=MAQJREP&utm_medium=online_publisher",
  groningen: "https://www.getyourguide.com/en-gb/groningen-l32376/?partner_id=MAQJREP&utm_medium=online_publisher",
  nijmegen: "https://www.getyourguide.com/en-gb/nijmegen-l32377/?partner_id=MAQJREP&utm_medium=online_publisher",
  breda: "https://www.getyourguide.com/en-gb/breda-l1292/?partner_id=MAQJREP&utm_medium=online_publisher",
  volendam: "https://www.getyourguide.com/en-gb/volendam-l32672/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const eredivisieCityGuides: Record<string, CityGuide> = {
  amsterdam: {
    cityId: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    thingsToDoUrl: GYG.amsterdam,
    overview:
      "Amsterdam is one of Europe’s easiest football weekends if you avoid the obvious tourist mistakes. The city is compact, walkable, and visually strong, but the trap is wasting time in overcrowded central zones and blowing the whole trip on canals, queues, and average restaurants. Base yourself smartly, move by tram or metro when needed, and treat matchday as one block within a wider city trip rather than the only event.",
    topThings: [
      { title: "Canal belt walk", tip: "Best early morning or late evening. Midday is peak tourist clutter." },
      { title: "Jordaan", tip: "Better for atmosphere and cafés than trying to force Dam Square to be enjoyable." },
      { title: "Museumplein", tip: "Pick one museum and do it properly. Doing three badly is stupid." },
      { title: "De Pijp", tip: "One of the best food-and-bars districts without the worst tourist overload." },
      { title: "A'DAM Lookout / Noord ferry", tip: "The free ferry is useful and gives the trip a proper Amsterdam feel." },
      { title: "Vondelpark", tip: "Good reset if you’ve overdone nightlife or need air before matchday." },
      { title: "Nine Streets", tip: "Better for wandering than shopping missions." },
      { title: "Canal cruise", tip: "Do it only if weather is decent and you haven’t spent all day near the water already." },
      { title: "Local brown café", tip: "Walk away from the most central strips for a better crowd and less tourist pricing." },
      { title: "Arena district timing", tip: "For Ajax, leave enough time for metro flow and pre-match congestion." },
    ],
    tips: [
      "Stay outside the worst tourist core unless you actually want noise and inflated prices.",
      "Amsterdam works best when walked in neighbourhood chunks, not zig-zagged.",
      "Public transport is better than taxis for most journeys.",
      "Book popular dinners on Friday and Saturday.",
      "Matchday plus nightlife is easy here, but pace it or you’ll waste the next day.",
    ],
    food: ["Indonesian rijsttafel", "Modern Dutch bistros", "Canal-side wine bars", "De Pijp cafés"],
    transport:
      "Trams, metro, and walking cover almost everything. Schiphol links are strong. For Ajax matchdays, the metro to the Arena area is the cleanest move.",
    accommodation:
      "De Pijp, Oud-West, Museum Quarter, and Jordaan are strong bases. Absolute city-centre tourist strips are usually the worst value.",
  },

  rotterdam: {
    cityId: "rotterdam",
    name: "Rotterdam",
    country: "Netherlands",
    thingsToDoUrl: GYG.rotterdam,
    overview:
      "Rotterdam is not Amsterdam-lite. It’s sharper, more modern, more architectural, and better when treated as an urban weekend rather than a postcard hunt. The city rewards people who like skyline, riverfront, strong food halls, and a more grown-up vibe. For football travel, it’s excellent because the centre is practical and matchday feels properly big-club without drowning in tourism.",
    topThings: [
      { title: "Markthal", tip: "Go for the scale and food options, but don’t turn it into a half-day." },
      { title: "Cube Houses", tip: "See them, photograph them, move on." },
      { title: "Erasmus Bridge walk", tip: "Best around golden hour when the skyline actually earns the effort." },
      { title: "Witte de Withstraat", tip: "A proper evening street for bars and food." },
      { title: "Euromast", tip: "Worth it on a clear day. Useless in poor visibility." },
      { title: "Kop van Zuid", tip: "A good contrast area if you want the city’s more polished modern side." },
      { title: "Harbour tour", tip: "Only if industry / port scale genuinely interests you." },
      { title: "Local beer spot", tip: "Rotterdam has enough good casual bar options that chains are a waste." },
      { title: "Feyenoord matchday build-up", tip: "Treat this as part of the trip, not a last-minute add-on." },
      { title: "Neighbourhood café breakfast", tip: "Better than default hotel breakfast almost every time." },
    ],
    tips: [
      "Rotterdam is stronger at food, design, and city feel than classic sightseeing.",
      "Book dinner in popular central districts at weekends.",
      "Feyenoord is the heavyweight football pull here, but Sparta and Excelsior give different flavours.",
      "Weather and river wind matter more than you think.",
      "Don’t compare everything to Amsterdam. It’s a different city and better judged on its own terms.",
    ],
    food: ["Markthal stalls", "Modern Dutch", "Surinamese", "Riverside dining", "Witte de With bars"],
    transport:
      "Metro, trams, and walking are efficient. Rotterdam Centraal makes arrival simple. Stadium access varies by club, so check route discipline rather than improvising.",
    accommodation:
      "Central Station area, Witte de Withstraat, and Kop van Zuid are the cleanest bases for most football weekends.",
  },

  eindhoven: {
    cityId: "eindhoven",
    name: "Eindhoven",
    country: "Netherlands",
    thingsToDoUrl: GYG.eindhoven,
    overview:
      "Eindhoven is a very efficient football city: compact centre, easy station-to-stadium flow, good nightlife, and no need to overcomplicate the trip. It is less about grand sightseeing and more about a clean, modern city break where football, bars, and decent restaurants fit together properly.",
    topThings: [
      { title: "Strijp-S", tip: "Best area if you want Eindhoven’s creative / modern side." },
      { title: "Philips Museum", tip: "Actually relevant to the city and the club. Worth doing." },
      { title: "Station to centre loop", tip: "You can understand most of central Eindhoven quickly on foot." },
      { title: "Van Abbemuseum", tip: "A strong option if you want one serious cultural stop." },
      { title: "Market Square bars", tip: "Simple, easy, social. Good if you don’t want to overthink the night." },
      { title: "PSV matchday area", tip: "One of the easiest big-club stadium approaches in Europe." },
      { title: "Design District pockets", tip: "Good for cafés and a different feel from standard centre strips." },
      { title: "Pre-match dinner", tip: "Book it on big weekends. The city centre fills." },
      { title: "Post-match drinks", tip: "Stay central and keep it easy. No need to overtravel." },
      { title: "Morning coffee run", tip: "Eindhoven’s café scene is better than people expect." },
    ],
    tips: [
      "This is a low-friction trip. Don’t turn it into a logistical mess.",
      "PSV weekends tighten hotel supply more than casual visitors expect.",
      "You can do a lot of Eindhoven on foot.",
      "A single-night stay works, but two nights makes it much better.",
      "Best city for efficiency, not necessarily romance.",
    ],
    food: ["Modern casual dining", "Beer bars", "Centre cafés", "Good brunch spots"],
    transport:
      "Very walkable in the centre. Rail links are strong. For PSV, the stadium is conveniently close to the station and city core.",
    accommodation:
      "Stay central. This is not a city where being far out makes any sense unless price forces it.",
  },

  enschede: {
    cityId: "enschede",
    name: "Enschede",
    country: "Netherlands",
    overview:
      "Enschede is a football-first Dutch trip rather than a blockbuster tourist city. That’s not a criticism. It means the trip works best when structured around FC Twente, local bars, easy central wandering, and a straightforward overnight rather than a massive sightseeing checklist.",
    topThings: [
      { title: "Old Market Square", tip: "Best place to anchor the city centre and start the evening." },
      { title: "Twentsche Foodhall", tip: "Simple win if you want variety without wasting time." },
      { title: "Local beer bars", tip: "The centre is compact enough that you can choose by vibe, not logistics." },
      { title: "University area / green edges", tip: "Only if you have extra time and want a calmer stretch." },
      { title: "FC Twente build-up", tip: "This is the real point of the trip. Don’t treat it like an afterthought." },
      { title: "City centre breakfast", tip: "Better to go local than default hotel options." },
      { title: "Short centre wander", tip: "Enough to get the feel without forcing it." },
      { title: "Matchday pub stop", tip: "Arrive early rather than searching late." },
      { title: "Evening drinks", tip: "Stay central; the city works best when kept simple." },
      { title: "Morning reset walk", tip: "Useful if you’ve had a proper night." },
    ],
    tips: [
      "This is a focused football trip, not an attractions marathon.",
      "Stay central and keep the whole thing easy.",
      "One strong night is enough for most visitors.",
      "Twente is the reason to come, so give matchday proper room.",
      "Good trip if you want something authentic without tourist overload.",
    ],
    food: ["Food hall", "Centre grills", "Beer bars", "Casual Dutch dining"],
    transport:
      "Enschede centre is straightforward on foot. Rail gets you in cleanly, then local buses / short taxi hops cover the stadium if needed.",
    accommodation:
      "Central station / city centre area is the obvious choice.",
  },

  nijmegen: {
    cityId: "nijmegen",
    name: "Nijmegen",
    country: "Netherlands",
    thingsToDoUrl: GYG.nijmegen,
    overview:
      "Nijmegen feels older, warmer, and less corporate than some Dutch city-trip options. It works well because it has enough historic texture, enough bars, and a proper local rhythm without requiring a huge schedule. For an NEC weekend, that is exactly what you want.",
    topThings: [
      { title: "Waalkade riverfront", tip: "Best for an easy walk and city feel." },
      { title: "Old town centre", tip: "Compact enough to wander without a map-heavy day." },
      { title: "Valkhof area", tip: "One of the city’s stronger scenic / historical zones." },
      { title: "Great Market bars", tip: "Easy central choice for drinks." },
      { title: "Local cafés", tip: "Nijmegen is strong at relaxed café culture." },
      { title: "NEC matchday", tip: "The football gives the city weekend its proper edge." },
      { title: "Bridge / skyline view", tip: "Good for a short late-afternoon walk." },
      { title: "Book one dinner", tip: "A smart booking improves the whole trip quickly." },
      { title: "Morning bakery / coffee", tip: "A better use of time than hotel breakfast." },
      { title: "Neighbourhood pubs", tip: "Push slightly away from the busiest strip for better value." },
    ],
    tips: [
      "This is a very workable two-night football city.",
      "Historic core + riverfront is the cleanest way to structure your time.",
      "NEC gives it a more serious football angle than casual visitors might expect.",
      "Stay central and walk.",
      "A good choice if you want a Dutch city that feels less overprocessed.",
    ],
    food: ["Central cafés", "Bistros", "Beer spots", "Riverside drinks"],
    transport:
      "City centre is compact. Train links are good. Walking covers most visitor needs once you’ve arrived.",
    accommodation:
      "Stay in or near the old centre for the best overall trip flow.",
  },

  alkmaar: {
    cityId: "alkmaar",
    name: "Alkmaar",
    country: "Netherlands",
    thingsToDoUrl: GYG.alkmaar,
    overview:
      "Alkmaar is one of those cities that works because it doesn’t try too hard. Attractive centre, canals, good walking, a real football club, and less tourist nonsense than Amsterdam. It’s not huge, but that’s the point.",
    topThings: [
      { title: "Historic centre canals", tip: "Best seen on foot, not via overplanned itinerary." },
      { title: "Cheese market area", tip: "Fine if timing aligns, but don’t build the whole weekend around it." },
      { title: "Old streets and bridges", tip: "Alkmaar is strongest when wandered." },
      { title: "Beer museum / local drinks", tip: "A good optional stop if weather is poor." },
      { title: "AZ matchday", tip: "This is what turns the trip from nice to worthwhile." },
      { title: "Canal-side lunch", tip: "Best on a calm day when you can sit outside." },
      { title: "Town square evening", tip: "Simple, social, easy." },
      { title: "Neighbourhood dinner", tip: "Book if visiting on match weekend." },
      { title: "Short market stop", tip: "Useful, but don’t mistake it for a whole day’s entertainment." },
      { title: "Morning city loop", tip: "A compact city rewards early wandering." },
    ],
    tips: [
      "Alkmaar is best kept relaxed.",
      "AZ is the anchor, city wandering is the support act.",
      "One or two nights is enough for most people.",
      "Avoid trying to make this into Amsterdam North. It isn’t.",
      "A very good weekend if you want football plus an attractive smaller Dutch city.",
    ],
    food: ["Canal-side restaurants", "Dutch cafés", "Beer bars", "Local bakeries"],
    transport:
      "Compact centre and good rail access. Very manageable without needing taxis.",
    accommodation:
      "Historic centre is the obvious base and usually the best one.",
  },

  heerenveen: {
    cityId: "heerenveen",
    name: "Heerenveen",
    country: "Netherlands",
    overview:
      "Heerenveen is a football-led stop built around club identity, calm town scale, and easy logistics. You do not come here for massive sightseeing. You come because SC Heerenveen means something, the trip is simple, and the whole weekend feels grounded rather than overdesigned.",
    topThings: [
      { title: "Town centre wander", tip: "Quick and enough. Don’t force a bigger city agenda onto it." },
      { title: "Canal-side coffee", tip: "This is a small-town rhythm place, not a rush place." },
      { title: "Thialf area if relevant", tip: "Useful if you care about Dutch sporting culture more broadly." },
      { title: "SC Heerenveen matchday", tip: "Main event. Build around it properly." },
      { title: "Local pub evening", tip: "Keep it low-friction and central." },
      { title: "Morning walk", tip: "A short reset is enough here." },
      { title: "Casual dinner", tip: "Book on busy weekends, otherwise stay flexible." },
      { title: "Neighbourhood café", tip: "Better than generic chain food." },
      { title: "Town square drink", tip: "The easy play if you want a simple evening." },
      { title: "Arrival planning", tip: "This is a place where neat planning matters more than endless options." },
    ],
    tips: [
      "Football-first trip. Accept that and it works.",
      "Stay central and don’t overcomplicate it.",
      "One-night trip is viable here.",
      "The club is the draw, not a huge attractions list.",
      "Good for a proper Dutch football stop without tourist theatre.",
    ],
    food: ["Simple Dutch dining", "Town-centre bars", "Casual cafés"],
    transport:
      "Small scale. Walking and short local journeys cover most needs.",
    accommodation:
      "Central Heerenveen is enough. No need to be clever.",
  },

  utrecht: {
    cityId: "utrecht",
    name: "Utrecht",
    country: "Netherlands",
    thingsToDoUrl: GYG.utrecht,
    overview:
      "Utrecht is one of the best all-round city breaks in the Netherlands because it gives you canals, atmosphere, bars, proper city energy, and less tourist saturation than Amsterdam. For football travel, that makes it a serious asset. It is easy to sell because it is actually good.",
    topThings: [
      { title: "Oudegracht canal level walk", tip: "One of the city’s best features and genuinely different." },
      { title: "Dom Tower area", tip: "Obvious, but obvious for a reason." },
      { title: "Canal-side restaurants", tip: "Book ahead at weekends." },
      { title: "Museum quarter", tip: "Good if you want one culture block without killing the day." },
      { title: "Neighbourhood cafés", tip: "Utrecht does relaxed day drinking and coffee very well." },
      { title: "FC Utrecht matchday", tip: "Adds edge to a city that already works without football." },
      { title: "Evening bar circuit", tip: "Keep it around the centre and canals and it’s hard to get wrong." },
      { title: "Morning bakery stop", tip: "Better use of time than hotel breakfast." },
      { title: "Short bike / walk route", tip: "The city is made for low-effort movement." },
      { title: "Station-to-centre flow", tip: "Very straightforward and traveller-friendly." },
    ],
    tips: [
      "One of the strongest non-Amsterdam Dutch city weekends.",
      "Book dinner and popular bars on key weekends.",
      "A very easy two-night football trip.",
      "You get proper city energy without the same tourist overload.",
      "If someone says Utrecht is boring, they’ve done it badly.",
    ],
    food: ["Canal dining", "Modern Dutch", "Wine bars", "Coffee spots", "Brunch cafés"],
    transport:
      "Very easy on foot in the centre. Excellent rail hub. No need to make travel complicated.",
    accommodation:
      "Historic centre or close to the station both work very well.",
  },

  groningen: {
    cityId: "groningen",
    name: "Groningen",
    country: "Netherlands",
    thingsToDoUrl: GYG.groningen,
    overview:
      "Groningen is one of the Netherlands’ best nightlife-and-football combinations outside the obvious cities. Student energy keeps it alive, the centre is easy, and the city has enough identity to feel worth the trip beyond the match itself.",
    topThings: [
      { title: "Grote Markt", tip: "Natural centre point for food, drinks, and orientation." },
      { title: "Martinitoren area", tip: "Quick landmark value without wasting time." },
      { title: "Canal walk", tip: "Best as a morning reset or pre-dinner loop." },
      { title: "Student quarter bars", tip: "This is where the city’s energy really shows." },
      { title: "Forum Groningen", tip: "Good modern city stop with views and flexible use." },
      { title: "FC Groningen matchday", tip: "The city’s football identity matters here." },
      { title: "Late-night drinks", tip: "One of the stronger Dutch cities for it." },
      { title: "Coffee + bakery morning", tip: "Very easy to do well here." },
      { title: "Compact centre wandering", tip: "Enough to fill time without overplanning." },
      { title: "Neighbourhood dinner", tip: "Book if you want something specific on a busy weekend." },
    ],
    tips: [
      "Great city if you want football plus nightlife.",
      "Stay central and everything becomes easy.",
      "Student energy keeps it lively even without over-tourism.",
      "Good value compared with some bigger-name cities.",
      "Two nights is the sweet spot.",
    ],
    food: ["Student bars", "Casual bistros", "Coffee spots", "Central restaurants"],
    transport:
      "Walkable centre and straightforward local movement once you arrive by train.",
    accommodation:
      "Central Groningen only. Don’t stay out of town unless price leaves no alternative.",
  },

  sittard: {
    cityId: "sittard",
    name: "Sittard",
    country: "Netherlands",
    overview:
      "Sittard is a niche football trip, not a giant city weekend. That’s fine. The value is in doing a different Dutch stop properly: compact centre, relaxed pace, and Fortuna Sittard as the anchor.",
    topThings: [
      { title: "Historic centre", tip: "Small but enough for an easy wander." },
      { title: "Town square bars", tip: "Best for a simple evening without overthinking it." },
      { title: "Local cafés", tip: "Keep expectations realistic and the trip works." },
      { title: "Fortuna matchday", tip: "This is the trip’s reason to exist." },
      { title: "Short morning loop", tip: "Useful if you only have one night." },
      { title: "Regional Limburg feel", tip: "The city’s appeal is in being different, not bigger." },
      { title: "Simple dinner booking", tip: "One decent reservation makes a lot of difference here." },
      { title: "Arrival planning", tip: "A neat trip beats an ambitious one." },
      { title: "Town-centre drink", tip: "Better than wandering trying to invent hidden gems." },
      { title: "Low-pressure city break", tip: "That is the point here." },
    ],
    tips: [
      "Don’t oversell the city to yourself. Treat it as a focused football stop.",
      "Fortuna is the anchor.",
      "One-night stay is enough for most people.",
      "Stay central and keep it neat.",
      "Works best for collectors of proper football trips, not generic tourists.",
    ],
    food: ["Town-centre restaurants", "Casual Limburg dining", "Simple bars"],
    transport:
      "Small scale, manageable on foot with simple rail access.",
    accommodation:
      "Stay near the centre and keep it basic but practical.",
  },

  deventer: {
    cityId: "deventer",
    name: "Deventer",
    country: "Netherlands",
    overview:
      "Deventer is one of the better smaller Dutch football cities because it has genuine old-town character instead of feeling like a blank stop on the rail map. For Go Ahead Eagles, it gives you enough city charm to make the weekend feel rounded rather than purely functional.",
    topThings: [
      { title: "Historic centre", tip: "This is the city’s strength. Walk it properly." },
      { title: "Brink square", tip: "Anchor point for drinks and food." },
      { title: "IJssel river walk", tip: "Best in decent weather, obvious but effective." },
      { title: "Book market / local shops", tip: "Nice add-on if timings align." },
      { title: "Go Ahead Eagles matchday", tip: "A proper old-school football anchor." },
      { title: "Neighbourhood dinner", tip: "Worth reserving something decent." },
      { title: "Morning coffee route", tip: "The centre suits slow starts well." },
      { title: "Old streets photography", tip: "A genuinely attractive place to wander." },
      { title: "Local pub stop", tip: "Better than chain drinking by default." },
      { title: "One-night simplicity", tip: "Easy city to keep efficient." },
    ],
    tips: [
      "One of the better smaller Dutch city breaks.",
      "Old town plus football is the formula.",
      "No need to overplan it.",
      "Stay central.",
      "Good for a more classic-feeling trip.",
    ],
    food: ["Square-side restaurants", "Pubs", "Coffee spots", "Bakeries"],
    transport:
      "Compact and straightforward once in the centre.",
    accommodation:
      "Historic centre is where you should be.",
  },

  zwolle: {
    cityId: "zwolle",
    name: "Zwolle",
    country: "Netherlands",
    overview:
      "Zwolle is a clean, attractive, practical Dutch city that suits a football weekend because it is easy to handle. It is not trying to be edgy or glamorous. It just works.",
    topThings: [
      { title: "Historic core", tip: "Strong enough for an easy half-day wander." },
      { title: "Sassenpoort area", tip: "Quick landmark value." },
      { title: "Canal edges", tip: "Good for a calmer walk." },
      { title: "Town centre food stop", tip: "Keep it simple and central." },
      { title: "PEC Zwolle matchday", tip: "Adds purpose to the weekend." },
      { title: "Local bars", tip: "The city is best enjoyed casually." },
      { title: "Morning coffee", tip: "Strong move before travel out." },
      { title: "Short centre loop", tip: "Enough city content without overreach." },
      { title: "Book one decent dinner", tip: "Always helps." },
      { title: "Station-to-centre flow", tip: "Simple city, simple trip." },
    ],
    tips: [
      "Practical city, low-friction football weekend.",
      "One or two nights both work.",
      "Stay central.",
      "Don’t try to manufacture a huge attractions list.",
      "A neat football trip rather than a grand tour.",
    ],
    food: ["Central Dutch dining", "Cafés", "Simple evening bars"],
    transport:
      "Walkable and easy once in the centre.",
    accommodation:
      "City centre or near the station both work.",
  },

  volendam: {
    cityId: "volendam",
    name: "Volendam",
    country: "Netherlands",
    thingsToDoUrl: GYG.volendam,
    overview:
      "Volendam is a very specific kind of trip: scenic, small, touristy in parts, and absolutely not a major city break. That is fine if you understand the brief. Done right, it’s a short, distinctive football-and-waterfront weekend.",
    topThings: [
      { title: "Harbourfront walk", tip: "This is the whole point visually. Do it early or late for fewer crowds." },
      { title: "Waterside cafés", tip: "Easy, obvious, and usually worth it." },
      { title: "Traditional centre stroll", tip: "Nice in small doses. Don’t force hours of it." },
      { title: "Boat / water view stop", tip: "Useful if weather behaves." },
      { title: "FC Volendam matchday", tip: "Makes the trip more than just a pretty village visit." },
      { title: "Short seafood meal", tip: "The right choice here, provided you avoid total tourist traps." },
      { title: "Neighbouring Edam add-on", tip: "Only if you have spare time and want more local texture." },
      { title: "Morning coffee by the water", tip: "Best use of the setting." },
      { title: "Photography walk", tip: "Very easy win in decent weather." },
      { title: "Short-stay discipline", tip: "This is not a place to overstay unless you love the calm pace." },
    ],
    tips: [
      "Good short trip, not a long one.",
      "The scenery is the appeal; accept that.",
      "Matchday gives it purpose.",
      "Best in decent weather.",
      "Avoid overpaying in the most obvious waterfront spots if possible.",
    ],
    food: ["Seafood", "Waterside cafés", "Simple Dutch dining"],
    transport:
      "Easy enough as a compact destination, but plan arrival cleanly rather than improvising.",
    accommodation:
      "Harbour area if staying overnight; otherwise short-stay practicality is enough.",
  },

  breda: {
    cityId: "breda",
    name: "Breda",
    country: "Netherlands",
    thingsToDoUrl: GYG.breda,
    overview:
      "Breda is one of the better lower-key Dutch city weekends because it has a proper centre, nightlife, and enough beauty without feeling overexposed. Add NAC and you have a city that works very well for a football-first trip.",
    topThings: [
      { title: "Grote Markt", tip: "Best natural base for food and drinks." },
      { title: "Historic centre", tip: "Compact, attractive, and easy to enjoy on foot." },
      { title: "Canal / park edge walk", tip: "Useful if you want a calmer daytime block." },
      { title: "NAC matchday", tip: "This is where the city gets its sharper edge." },
      { title: "Bar night", tip: "Breda is better for this than many similarly sized cities." },
      { title: "Local dinner booking", tip: "Book one good meal and the trip improves fast." },
      { title: "Morning café", tip: "Strong city for relaxed starts." },
      { title: "Old church / square area", tip: "Simple sightseeing value without effort." },
      { title: "Neighbourhood pub", tip: "Worth moving slightly off the busiest strip for." },
      { title: "Short city loop", tip: "Good city for doing just enough." },
    ],
    tips: [
      "Very solid football weekend city.",
      "Better nightlife than people expect.",
      "Stay central.",
      "NAC gives it a proper football identity.",
      "A good two-night trip.",
    ],
    food: ["Square-side restaurants", "Beer bars", "Casual modern Dutch", "Brunch cafés"],
    transport:
      "Easy on foot through the main centre.",
    accommodation:
      "Historic centre / Grote Markt area is the best base.",
  },

  almelo: {
    cityId: "almelo",
    name: "Almelo",
    country: "Netherlands",
    overview:
      "Almelo is another football-led trip where the club matters more than any giant city narrative. If you understand that, it works. If you expect a blockbuster city break, you are setting yourself up wrong.",
    topThings: [
      { title: "Town centre loop", tip: "Short and enough." },
      { title: "Local bars", tip: "Keep it practical and central." },
      { title: "Heracles matchday", tip: "Main event by a distance." },
      { title: "Canal-side wander", tip: "Useful for a quiet stretch." },
      { title: "Casual dinner", tip: "One decent booking beats random wandering." },
      { title: "Morning coffee", tip: "Simple reset before moving on." },
      { title: "Neighbourhood pub", tip: "Better than overthinking hidden gems." },
      { title: "Compact football trip", tip: "That’s the right mindset." },
      { title: "Arrival planning", tip: "Keep rail and hotel neat." },
      { title: "One-night stay", tip: "Usually enough." },
    ],
    tips: [
      "Football-first, not tourism-first.",
      "Heracles is the anchor.",
      "Stay central.",
      "One night is usually enough.",
      "Works well if you like proper club-collector trips.",
    ],
    food: ["Simple Dutch dining", "Centre bars", "Casual cafés"],
    transport:
      "Small scale and manageable once you arrive.",
    accommodation:
      "Central Almelo is enough.",
  },

  "velsen-zuid": {
    cityId: "velsen-zuid",
    name: "Velsen-Zuid",
    country: "Netherlands",
    overview:
      "Velsen-Zuid is not a classic city break. It is a niche football destination attached to the Telstar experience and the wider North Holland area. So don’t lie to yourself about what the trip is. Keep it short, neat, and football-focused.",
    topThings: [
      { title: "Telstar matchday", tip: "Main reason to go. Treat it like that." },
      { title: "Nearby coastal add-on", tip: "Worth considering if weather is good." },
      { title: "Short local walk", tip: "Enough to get your bearings, nothing more." },
      { title: "Simple pre-match food", tip: "Plan it; options are not endless." },
      { title: "Rail-based day structure", tip: "Best if tied to a larger Amsterdam / Haarlem plan." },
      { title: "Local bar stop", tip: "Keep expectations realistic." },
      { title: "Short stay discipline", tip: "Don’t overstay the brief." },
      { title: "Neighbouring area add-on", tip: "Useful if you want the trip to feel fuller." },
      { title: "Morning move-on", tip: "Good place for a focused stop, not a long base." },
      { title: "Lower-profile football value", tip: "That is the appeal." },
    ],
    tips: [
      "This is a niche football stop.",
      "Better as part of a wider North Holland itinerary.",
      "Keep it short and practical.",
      "Don’t expect a huge standalone city weekend.",
      "Useful for proper ground-collector energy.",
    ],
    food: ["Simple local dining", "Short-stop cafés"],
    transport:
      "Best handled with clear rail / local travel planning rather than improvisation.",
    accommodation:
      "Often better paired with a base elsewhere unless you specifically want the immediate area.",
  },
};

export default eredivisieCityGuides;
