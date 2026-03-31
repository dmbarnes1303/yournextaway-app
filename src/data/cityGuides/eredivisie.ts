// src/data/cityGuides/eredivisie.ts
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
    bookingLinks: {
      thingsToDo: GYG.amsterdam,
    },
    thingsToDoUrl: GYG.amsterdam,

    overview:
      "Amsterdam is one of Europe’s easiest football weekends if you stop behaving like a first-time tourist. The city is compact, highly walkable by neighbourhood, and strong enough to carry a trip beyond the match, but it punishes bad planning fast. The worst version is obvious attractions, tram-hopping without logic, overpriced central bars, and a late scramble to the Arena. The good version is simple: stay in a liveable district, split the city into clean geographic blocks, and let football sit inside a wider city weekend rather than swallowing the whole plan.",

    topThings: [
      { title: "Canal Belt morning walk", tip: "Do it early before the rental-bike chaos and canal-cruise crowd make it feel fake." },
      { title: "Jordaan", tip: "Better for actual city atmosphere than camping around Dam Square like a tourist hostage." },
      { title: "Museumplein", tip: "Pick one museum and do it properly. Trying to speed-run three is idiotic." },
      { title: "De Pijp", tip: "One of the best all-round districts for food, bars, and a less annoying local feel." },
      { title: "Nine Streets", tip: "Good for wandering and coffee; bad for pretending shopping counts as a whole day." },
      { title: "Noord ferry crossing", tip: "Free, useful, and one of the easiest ways to make the trip feel more like Amsterdam than just central congestion." },
      { title: "Vondelpark reset", tip: "Best used after a late night or before matchday if you need air and space." },
      { title: "Brown café session", tip: "Walk away from the busiest tourist strips and you will usually get the better pub." },
      { title: "Canal cruise", tip: "Only worth it if weather is decent and you have not already spent half the day on canal edges." },
      { title: "Arena district timing", tip: "For Ajax, leave proper buffer time. Metro flow is easy until everyone has the same idea." },
    ],

    tips: [
      "Stay outside the worst central tourist core unless you actively enjoy noise and overpriced mediocrity.",
      "Amsterdam works best by district, not random zig-zagging.",
      "Trams, metro, and walking beat taxis for almost every normal journey.",
      "Book popular Friday and Saturday dinners in advance.",
      "Ajax plus nightlife is easy, but overdo night one and you will wreck the rest of the weekend.",
    ],

    food: ["Indonesian rijsttafel", "De Pijp cafés", "Brown-pub snacks", "Modern Dutch bistros", "Canal-side wine bars"],

    transport:
      "Trams, metro, and walking cover almost everything. Schiphol links are excellent. For Ajax matchdays, the metro to Amsterdam Bijlmer ArenA is the cleanest move by far.",

    accommodation:
      "De Pijp, Oud-West, Jordaan, and the Museum Quarter are strong bases. The most obvious tourist-centre strips are usually the worst-value option unless convenience is literally your only criterion.",
  },

  rotterdam: {
    cityId: "rotterdam",
    name: "Rotterdam",
    country: "Netherlands",
    bookingLinks: {
      thingsToDo: GYG.rotterdam,
    },
    thingsToDoUrl: GYG.rotterdam,

    overview:
      "Rotterdam is not Amsterdam’s younger brother and people who treat it that way miss the whole point. This is a sharper, more modern, more architectural city built around skyline, riverfront, food halls, and a harder urban feel. It is less about postcard beauty and more about design, scale, and movement. For football travel it is excellent because the centre is practical, the nightlife is strong, and matchday can feel properly serious without drowning in souvenir-shop tourism.",

    topThings: [
      { title: "Erasmus Bridge walk", tip: "Best around golden hour when the skyline actually justifies the effort." },
      { title: "Markthal", tip: "Useful for food and visual impact, but if you spend half a day there you are wasting your own time." },
      { title: "Cube Houses", tip: "See them, photograph them, and move on. They are not a full programme." },
      { title: "Witte de Withstraat", tip: "One of the best evening streets in the country for bars and food without forced pretension." },
      { title: "Kop van Zuid", tip: "Good for seeing the city’s cleaner, polished side and breaking up the centre properly." },
      { title: "Euromast", tip: "Worth doing only in clear weather. In poor visibility it is a self-inflicted letdown." },
      { title: "Harbour tour", tip: "Only if you actually care about port scale and industry. Do not force it as default sightseeing." },
      { title: "Neighbourhood beer stop", tip: "Rotterdam is good enough for local bar choices. Chains are lazy." },
      { title: "Feyenoord matchday build-up", tip: "Part of the trip, not something to bolt on late once you are already rushed." },
      { title: "City-break breakfast run", tip: "Neighbourhood cafés beat hotel breakfast almost every time." },
    ],

    tips: [
      "Rotterdam is better judged on food, architecture, and city feel than on tourist-box ticking.",
      "Book dinner in the better central districts on weekends.",
      "Feyenoord is the heavyweight football draw, but Sparta gives a different and very worthwhile angle.",
      "River wind and weather matter more than people think.",
      "Do not waste the trip constantly comparing it to Amsterdam.",
    ],

    food: ["Markthal stalls", "Witte de With bars", "Modern Dutch dining", "Surinamese food", "Riverside restaurants"],

    transport:
      "Metro, trams, and walking are efficient. Rotterdam Centraal keeps arrival clean. Stadium access depends on club, so plan it once properly instead of improvising badly.",

    accommodation:
      "Rotterdam Centrum, Witte de Withstraat, and Kop van Zuid are the strongest bases for most football weekends.",
  },

  eindhoven: {
    cityId: "eindhoven",
    name: "Eindhoven",
    country: "Netherlands",
    bookingLinks: {
      thingsToDo: GYG.eindhoven,
    },
    thingsToDoUrl: GYG.eindhoven,

    overview:
      "Eindhoven is one of the most efficient football cities in Europe. That is its strength. It is not trying to seduce you with massive sightseeing depth or fake old-town romance. It gives you a compact centre, a city-centre stadium, strong station links, good bars, and enough modern-city personality to make the whole thing work cleanly. For PSV weekends, that low-friction setup is a huge advantage.",

    topThings: [
      { title: "Philips Museum", tip: "Actually relevant to both city and club, which already makes it smarter than generic sightseeing filler." },
      { title: "Strijp-S", tip: "Best area if you want Eindhoven’s creative / design-heavy side rather than generic centre loops." },
      { title: "Van Abbemuseum", tip: "A solid serious culture stop if you want one proper museum and not a checklist." },
      { title: "18 Septemberplein / centre walk", tip: "You can get a strong read on central Eindhoven without burning half a day." },
      { title: "Market Square bars", tip: "Good simple play if you want an easy social evening without overthinking it." },
      { title: "PSV matchday district", tip: "One of the easiest major-stadium approaches in Europe. Do not still find a way to make it stressful." },
      { title: "Design pockets and cafés", tip: "The city rewards shorter modern-city blocks more than all-day tourist hunting." },
      { title: "Pre-match dinner", tip: "Book it on bigger weekends. Central options fill faster than people assume." },
      { title: "Post-match drinks", tip: "Stay central and keep it easy. There is no need for hero-level logistics." },
      { title: "Morning coffee run", tip: "Eindhoven’s café scene is better than lazy stereotypes suggest." },
    ],

    tips: [
      "This is a low-friction football trip. Do not turn it into an overplanned mess.",
      "PSV weekends tighten hotel supply more than casual visitors expect.",
      "You can do most of the city centre on foot.",
      "One night works, but two nights makes the trip feel a lot less rushed.",
      "This city wins on ease and quality, not on theatrical romance.",
    ],

    food: ["Modern casual dining", "Beer bars", "Brunch cafés", "Centre coffee spots"],

    transport:
      "Very walkable in the centre. Rail links are strong. Philips Stadion is close enough to the station and city core that matchday travel is almost idiot-proof.",

    accommodation:
      "Stay central. Being far out in Eindhoven is usually just a worse decision unless price is forcing your hand.",
  },

  enschede: {
    cityId: "enschede",
    name: "Enschede",
    country: "Netherlands",

    overview:
      "Enschede is a football-first Dutch trip rather than a giant sightseeing city, and that is completely fine. The value is in FC Twente, a compact centre, a proper local night, and a trip that feels authentic rather than over-curated. People who complain there is not enough to do are usually the same people who cannot enjoy a city unless it has five monuments and a canal cruise. Enschede works because it is straightforward.",

    topThings: [
      { title: "Old Market Square", tip: "Natural centre point for bars, food, and evening flow. Start here and stop overcomplicating it." },
      { title: "Twentsche Foodhall", tip: "Good low-effort win if you want variety without wasting half the day." },
      { title: "Local beer bars", tip: "The centre is compact enough that you can choose by vibe rather than transport logic." },
      { title: "City-centre loop", tip: "Enough to get the feel quickly without pretending this needs a huge sightseeing itinerary." },
      { title: "Short green-space reset", tip: "Useful only if you have extra time or need a hangover walk." },
      { title: "FC Twente build-up", tip: "This is the reason for the trip. Stop treating it like background entertainment." },
      { title: "Matchday pub stop", tip: "Arrive early enough to choose, not late enough to take whatever is left." },
      { title: "Centre dinner booking", tip: "One proper dinner reservation instantly makes the weekend cleaner." },
      { title: "Simple morning coffee", tip: "Enschede is better when kept relaxed rather than scheduled to death." },
      { title: "Post-match central drinks", tip: "Keep the whole night central and the trip stays easy." },
    ],

    tips: [
      "This is a focused football trip, not an attractions marathon.",
      "Stay central and keep the weekend simple.",
      "One strong night is enough for most visitors.",
      "Twente are the anchor. Let that shape the plan properly.",
      "Good trip if you want authenticity without tourist overload.",
    ],

    food: ["Food hall", "Centre grills", "Beer bars", "Casual Dutch dining"],

    transport:
      "Enschede centre is easy on foot. Rail gets you in cleanly, then local buses or short taxi hops cover the stadium if needed.",

    accommodation:
      "Station and city-centre area is the obvious answer. Anything else is usually just making life harder for no gain.",
  },

  nijmegen: {
    cityId: "nijmegen",
    name: "Nijmegen",
    country: "Netherlands",
    bookingLinks: {
      thingsToDo: GYG.nijmegen,
    },
    thingsToDoUrl: GYG.nijmegen,

    overview:
      "Nijmegen feels older, warmer, and more relaxed than a lot of Dutch city-trip options. It has enough history, enough bars, and enough scenic value to carry a football weekend without feeling overdesigned. It is not trying to be a giant metropolis. Good. That is exactly why it works so well for NEC.",

    topThings: [
      { title: "Waalkade riverfront", tip: "Best for an easy walk and some actual city feel rather than artificial attraction-chasing." },
      { title: "Old town centre", tip: "Compact enough to wander naturally without a map-led military exercise." },
      { title: "Valkhof area", tip: "One of the strongest scenic and historical blocks in the city." },
      { title: "Great Market bars", tip: "Simple central option for drinks that usually does the job well." },
      { title: "Neighbourhood cafés", tip: "Nijmegen is strong at relaxed day drinking and low-pressure coffee stops." },
      { title: "NEC matchday", tip: "This is what gives the weekend proper edge rather than just nice-city energy." },
      { title: "Bridge / skyline viewpoint", tip: "Good late-afternoon add-on, not a whole event." },
      { title: "Booked evening meal", tip: "One smart reservation improves the trip quickly." },
      { title: "Morning bakery run", tip: "A far better use of time than dead-eyed hotel breakfast." },
      { title: "Short district pub drift", tip: "Walk slightly off the busiest strip for better value and less generic atmosphere." },
    ],

    tips: [
      "This is a strong two-night football city.",
      "Historic core plus riverfront is the cleanest structure for your free time.",
      "NEC gives it more football seriousness than outsiders often expect.",
      "Stay central and walk.",
      "A very good choice if you want a Dutch city with less processed tourist energy.",
    ],

    food: ["Central cafés", "Riverside drinks", "Bistros", "Beer spots"],

    transport:
      "Centre is compact. Rail links are strong. Walking covers most visitor needs once you have arrived.",

    accommodation:
      "Stay in or near the old centre. That is the smartest base and there is no cleverer answer.",
  },

  alkmaar: {
    cityId: "alkmaar",
    name: "Alkmaar",
    country: "Netherlands",
    bookingLinks: {
      thingsToDo: GYG.alkmaar,
    },
    thingsToDoUrl: GYG.alkmaar,

    overview:
      "Alkmaar works because it does not try too hard. Attractive centre, canals, easy walking, a serious football club, and nowhere near the same tourist nonsense as Amsterdam. It is not massive, but that is part of the strength. For an AZ weekend, it gives you enough city charm without drowning the football in noise.",

    topThings: [
      { title: "Historic canal centre", tip: "Best seen on foot and without pretending you need a full itinerary to enjoy it." },
      { title: "Cheese market area", tip: "Fine if timing lines up, but building the whole trip around it would be stupid." },
      { title: "Old streets and bridges", tip: "Alkmaar is strongest when wandered, not overprogrammed." },
      { title: "Beer museum / drinks stop", tip: "Useful optional fallback if the weather turns bad." },
      { title: "AZ matchday", tip: "This is what turns the city from pleasant into properly worthwhile." },
      { title: "Canal-side lunch", tip: "Best in decent weather when outside seating is actually worth it." },
      { title: "Town-square evening", tip: "Simple, social, and usually enough." },
      { title: "Neighbourhood dinner", tip: "Book if you are going on a busy football weekend." },
      { title: "Short market pass", tip: "Useful for texture, not a half-day mission." },
      { title: "Morning centre loop", tip: "A compact city rewards early wandering more than late chaos." },
    ],

    tips: [
      "Alkmaar is best kept relaxed.",
      "AZ is the anchor, city wandering is the support act.",
      "One or two nights is enough for most people.",
      "Do not try to turn this into Amsterdam North. It isn’t.",
      "A very good weekend if you want football plus an attractive smaller Dutch city.",
    ],

    food: ["Canal-side restaurants", "Dutch cafés", "Beer bars", "Local bakeries"],

    transport:
      "Compact centre and good rail access. Very manageable without needing taxis or complicated planning.",

    accommodation:
      "Historic centre is the obvious base and usually the best one by a distance.",
  },

  heerenveen: {
    cityId: "heerenveen",
    name: "Heerenveen",
    country: "Netherlands",

    overview:
      "Heerenveen is a football-led stop built around club identity, calm town scale, and easy logistics. You do not come here for massive sightseeing lists. You come because SC Heerenveen matters locally, the stadium atmosphere is real, and the town makes for a relaxed football weekend without unnecessary complexity.",

    topThings: [
      { title: "Town centre wander", tip: "Quick and enough. Do not try to force a bigger-city agenda onto it." },
      { title: "Canal-side coffee", tip: "The town rewards slower mornings more than overplanned schedules." },
      { title: "Thialf ice arena area", tip: "Worth a look if you are interested in Dutch sporting culture beyond football." },
      { title: "SC Heerenveen matchday", tip: "Main event by a long distance. Build the day around it." },
      { title: "Local pub evening", tip: "Simple and central works better than trying to chase nightlife." },
      { title: "Morning reset walk", tip: "Short loop through town is enough to start the day." },
      { title: "Casual dinner stop", tip: "Book ahead on busy match weekends." },
      { title: "Neighbourhood café", tip: "Better than default hotel breakfasts." },
      { title: "Town-square drinks", tip: "Central bars provide the easiest social atmosphere." },
      { title: "Short-stay discipline", tip: "This trip works best when kept simple." },
    ],

    tips: [
      "Football-first destination rather than a major tourism city.",
      "Stay central and keep logistics simple.",
      "One-night stays work perfectly well.",
      "The club is the main reason to come.",
      "Great for people who enjoy authentic football towns.",
    ],

    food: ["Simple Dutch dining", "Town-centre pubs", "Casual cafés"],

    transport:
      "Small and manageable town. Walking covers most movement once you arrive.",

    accommodation:
      "Central Heerenveen is the only base you realistically need.",
  },

  utrecht: {
    cityId: "utrecht",
    name: "Utrecht",
    country: "Netherlands",
    bookingLinks: {
      thingsToDo: GYG.utrecht,
    },
    thingsToDoUrl: GYG.utrecht,

    overview:
      "Utrecht is arguably the most balanced city break in the Netherlands. It combines canals, nightlife, architecture, and football culture without the tourist overload of Amsterdam. For football travellers this makes it one of the strongest destinations in the league.",

    topThings: [
      { title: "Oudegracht canal walk", tip: "Lower-level canalside cafés make this one of the most distinctive walks in the country." },
      { title: "Dom Tower area", tip: "Obvious landmark but genuinely impressive." },
      { title: "Canal-side restaurants", tip: "Book ahead for weekend evenings." },
      { title: "Museum quarter", tip: "Best cultural district if you want one museum stop." },
      { title: "Neighbourhood cafés", tip: "Utrecht excels at relaxed café culture." },
      { title: "FC Utrecht matchday", tip: "Adds real football energy to an already strong city break." },
      { title: "Central bar crawl", tip: "Stay around the canals and you cannot really go wrong." },
      { title: "Morning bakery stop", tip: "Much better than hotel breakfast." },
      { title: "Short cycling route", tip: "The city is very bike-friendly." },
      { title: "Station-to-centre walk", tip: "One of the easiest arrivals in the Netherlands." },
    ],

    tips: [
      "One of the best two-night football city trips in the country.",
      "Book restaurants early on match weekends.",
      "The canal district is the natural centre of the trip.",
      "Easily walkable for visitors.",
      "A better football weekend than many people expect.",
    ],

    food: ["Canal dining", "Wine bars", "Dutch cafés", "Brunch spots"],

    transport:
      "Extremely easy rail hub. Most of the centre is walkable once you arrive.",

    accommodation:
      "Historic centre or close to Utrecht Centraal station both work well.",
  },

  groningen: {
    cityId: "groningen",
    name: "Groningen",
    country: "Netherlands",
    bookingLinks: {
      thingsToDo: GYG.groningen,
    },
    thingsToDoUrl: GYG.groningen,

    overview:
      "Groningen is one of the liveliest football cities outside the biggest Dutch destinations. Student culture keeps the nightlife active, the centre is compact, and FC Groningen provides a strong local football identity.",

    topThings: [
      { title: "Grote Markt", tip: "Central square and main hub for restaurants and bars." },
      { title: "Martinitoren", tip: "Iconic tower that anchors the city skyline." },
      { title: "Forum Groningen", tip: "Modern cultural building with views over the city." },
      { title: "Canal walks", tip: "Best done in the morning or early evening." },
      { title: "Student district bars", tip: "One of the liveliest nightlife areas in the country." },
      { title: "FC Groningen matchday", tip: "Adds a strong football atmosphere to the city weekend." },
      { title: "Late-night drinks", tip: "Groningen is famous for staying open late." },
      { title: "Morning coffee", tip: "Great independent café culture." },
      { title: "Compact centre exploration", tip: "Everything is close together." },
      { title: "Dinner reservation", tip: "Good restaurants fill quickly on weekends." },
    ],

    tips: [
      "Excellent nightlife city.",
      "Compact and easy to navigate.",
      "Strong football culture locally.",
      "Great for two-night trips.",
      "Better value than bigger Dutch cities.",
    ],

    food: ["Student bars", "Bistros", "Coffee houses", "Central restaurants"],

    transport:
      "City centre is easily walkable with good rail access.",

    accommodation:
      "Stay within the historic centre or near Grote Markt.",
  },

  breda: {
    cityId: "breda",
    name: "Breda",
    country: "Netherlands",
    bookingLinks: {
      thingsToDo: GYG.breda,
    },
    thingsToDoUrl: GYG.breda,

    overview:
      "Breda is one of the better smaller Dutch city breaks thanks to its lively central square, strong bar culture, and attractive historic streets. Add NAC Breda and it becomes a very enjoyable football weekend.",

    topThings: [
      { title: "Grote Markt", tip: "Central square filled with restaurants and bars." },
      { title: "Historic centre", tip: "Compact and attractive for casual wandering." },
      { title: "Breda Castle area", tip: "Adds historical interest to the city centre." },
      { title: "NAC matchday", tip: "The real highlight of the weekend." },
      { title: "Evening bar scene", tip: "Breda has a surprisingly strong nightlife for its size." },
      { title: "Central cafés", tip: "Ideal for relaxed daytime breaks." },
      { title: "Neighbourhood pubs", tip: "Often better than the busiest square bars." },
      { title: "Morning coffee", tip: "Plenty of independent options." },
      { title: "City walk", tip: "Enough attractions for an easy half-day wander." },
      { title: "Dinner reservation", tip: "Worth booking ahead for weekends." },
    ],

    tips: [
      "Strong football city weekend.",
      "Stay central around the square.",
      "Two nights works perfectly.",
      "Lively nightlife scene.",
      "One of the more underrated Dutch trips.",
    ],

    food: ["Square restaurants", "Beer bars", "Dutch cafés", "Brunch spots"],

    transport:
      "City centre is compact and walkable from the station.",

    accommodation:
      "Historic centre around Grote Markt is the best base.",
  },

  volendam: {
    cityId: "volendam",
    name: "Volendam",
    country: "Netherlands",
    bookingLinks: {
      thingsToDo: GYG.volendam,
    },
    thingsToDoUrl: GYG.volendam,

    overview:
      "Volendam is a small waterfront town that offers a completely different feel to the major Dutch cities. Scenic harbour views, traditional houses, and FC Volendam create a distinctive football trip.",

    topThings: [
      { title: "Harbourfront walk", tip: "The main scenic highlight of the town." },
      { title: "Waterfront cafés", tip: "Best enjoyed outside on a clear day." },
      { title: "Traditional centre", tip: "Small but charming for a short stroll." },
      { title: "Boat harbour views", tip: "Great photography location." },
      { title: "FC Volendam matchday", tip: "The reason most visitors come." },
      { title: "Seafood dinner", tip: "Local fish restaurants are the obvious choice." },
      { title: "Edam day trip", tip: "Easy nearby addition if you want more exploration." },
      { title: "Morning coffee by the water", tip: "Peaceful start before day-trippers arrive." },
      { title: "Short photography walk", tip: "The town’s visual charm is its main appeal." },
      { title: "Relaxed evening", tip: "This is not a big nightlife destination." },
    ],

    tips: [
      "Best as a short stay.",
      "Great in good weather.",
      "Football gives the trip real purpose.",
      "Do not expect a big-city weekend.",
      "Scenery is the main draw.",
    ],

    food: ["Seafood restaurants", "Harbour cafés", "Dutch bakeries"],

    transport:
      "Reachable by bus connections from Amsterdam.",

    accommodation:
      "Harbour area hotels provide the best experience.",
  },
};

export default eredivisieCityGuides;
