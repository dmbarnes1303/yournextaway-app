import type { CityGuide } from "./types";

const GYG = {
  zagreb:
    "https://www.getyourguide.com/en-gb/zagreb-l803/?partner_id=MAQJREP&utm_medium=online_publisher",
  split:
    "https://www.getyourguide.com/en-gb/split-l268/?partner_id=MAQJREP&utm_medium=online_publisher",
  rijeka:
    "https://www.getyourguide.com/en-gb/rijeka-l1110/?partner_id=MAQJREP&utm_medium=online_publisher",
  pula:
    "https://www.getyourguide.com/en-gb/pula-l344/?partner_id=MAQJREP&utm_medium=online_publisher",
  osijek:
    "https://www.getyourguide.com/en-gb/osijek-l145200/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const hnlCityGuides: Record<string, CityGuide> = {
  zagreb: {
    cityId: "zagreb",
    name: "Zagreb",
    country: "Croatia",
    thingsToDoUrl: GYG.zagreb,
    overview:
      "Zagreb is the cleanest big-city base in Croatian football: proper capital-city infrastructure, strong café culture, a compact central core, and enough nightlife and museum depth that a football trip never has to feel one-dimensional. The correct formula is simple: stay central, use the tram system properly, and treat matchday as one clear movement rather than an all-day sprawl.",
    topThings: [
      { title: "Ban Jelačić Square and central core", tip: "Use this as your anchor, not as your whole day." },
      { title: "Upper Town walk", tip: "Best done in daylight when the city reads clearly." },
      { title: "Tkalčićeva Street", tip: "Strong café and bar strip, especially late afternoon into evening." },
      { title: "Dolac Market", tip: "Go earlier, before it becomes more symbolic than useful." },
      { title: "Maksimir Park", tip: "Excellent reset before a match if you want air and space." },
      { title: "Museum block", tip: "Pick one or two; don’t over-collect indoor stops." },
      { title: "Craft beer / local wine evening", tip: "Zagreb does relaxed nights well if you don’t force them." },
      { title: "Daytime café session", tip: "The city’s café rhythm is part of the culture, not dead time." },
      { title: "Pre-match tram plan", tip: "Sort it in advance and the whole day stays easy." },
      { title: "Post-match central return", tip: "Usually better than lingering too long around the ground." },
    ],
    tips: [
      "Lower Town is the best base for almost everyone.",
      "Use trams and walking instead of defaulting to taxis.",
      "Zagreb works best when you keep the plan central and compact.",
      "Big match weekends justify booking dinner ahead.",
      "Best football-city utility base in Croatia.",
    ],
    food: [
      "Modern Croatian bistros",
      "Central cafés",
      "Tkalčićeva bars and restaurants",
      "Simple bakery and coffee breakfasts",
    ],
    transport:
      "Zagreb’s trams do most of the important work. If you stay central, the city is low-friction and matchday travel is manageable without drama.",
    accommodation:
      "Lower Town is the strongest all-round option. Around Ban Jelačić Square or the main station works well for transport and nightlife balance.",
  },

  split: {
    cityId: "split",
    name: "Split",
    country: "Croatia",
    thingsToDoUrl: GYG.split,
    overview:
      "Split is one of the strongest football travel cities anywhere in this project because the city is already elite before the football even starts. Coastal setting, old-town texture, waterfront energy, and Hajduk’s emotional weight combine into a trip that barely needs selling. The only real mistake is overcomplicating it.",
    topThings: [
      { title: "Diocletian’s Palace / Old Town", tip: "Walk it repeatedly at different times instead of trying to ‘finish’ it once." },
      { title: "Riva waterfront", tip: "The city’s social spine. Best around late afternoon and evening." },
      { title: "Marjan Hill", tip: "Best daylight reset and view play if you want some balance." },
      { title: "Bačvice area", tip: "Useful if you want a beach-plus-city rhythm." },
      { title: "Local seafood meal", tip: "This is not the city for a lazy chain dinner." },
      { title: "Coffee and slow morning", tip: "Split suits a slower start before ramping up later." },
      { title: "Poljud exterior approach", tip: "Arrive early. The setting matters." },
      { title: "Harbour / ferry zone walk", tip: "Good orientation point if arriving by bus or ferry." },
      { title: "Night drinks in the old core", tip: "Strong atmosphere, but choose a couple of good places not ten average ones." },
      { title: "Sunday low-pressure seafront block", tip: "A clean finish to the weekend." },
    ],
    tips: [
      "Stay central. It changes the whole quality of the trip.",
      "Split is best when football and city flow together naturally.",
      "Book dinner in busy periods.",
      "Arrive early for Poljud — it’s part of the experience.",
      "One of the app’s strongest full-weekend cities.",
    ],
    food: [
      "Seafood",
      "Dalmatian local cooking",
      "Waterfront dining",
      "Late old-town casual bites",
    ],
    transport:
      "Central Split is very walkable. Most useful football-weekend movement is on foot plus short local transport where needed.",
    accommodation:
      "Old Town / Waterfront is best for most visitors. Bačvice works if you want beach access without losing centrality.",
  },

  rijeka: {
    cityId: "rijeka",
    name: "Rijeka",
    country: "Croatia",
    thingsToDoUrl: GYG.rijeka,
    overview:
      "Rijeka is a more functional and characterful football city than postcard-pretty. That is not a criticism. It is a port city with edge, slopes, sea, and a more grounded urban feel than Croatia’s obvious tourism giants. It works well if you accept it on its own terms rather than expecting Split 2.0.",
    topThings: [
      { title: "Korzo", tip: "Use it as the city’s movement spine, not a destination in itself." },
      { title: "Trsat Castle", tip: "One of the best viewpoint moves in the city." },
      { title: "Port and waterfront zones", tip: "Part of the city’s identity even if not all of it is picturesque." },
      { title: "Central café and bar block", tip: "Rijeka is better at relaxed urban rhythm than hard tourist spectacle." },
      { title: "Opatija add-on", tip: "Strong if you want a more polished coastal layer nearby." },
      { title: "Market / local produce stop", tip: "Useful in the morning before the day sprawls." },
      { title: "Pre-match city-centre meal", tip: "Usually better than trying to improvise around the ground." },
      { title: "Rujevica trip plan", tip: "Treat it as one purposeful move." },
      { title: "Evening drinks", tip: "Rijeka is best when you let the city feel lived-in rather than hyper-curated." },
      { title: "Kvarner coast extension", tip: "Worth it if you have extra time." },
    ],
    tips: [
      "Expect more real-city texture than postcard polish.",
      "Stay central unless you deliberately want a coastal resort-style base.",
      "Rijeka works best when paired with the wider coast if time allows.",
      "Big football value without giant-tourist noise.",
      "Good city for serious travellers rather than checklist tourists.",
    ],
    food: [
      "Seafood",
      "Port-city bistros",
      "Cafés around the centre",
      "Simple Croatian dinner spots",
    ],
    transport:
      "Central Rijeka is manageable on foot with short transport hops where needed. The stadium movement is straightforward if planned once.",
    accommodation:
      "Rijeka City Centre is best for practicality. Opatija works if you want a more polished stay and do not mind travelling in.",
  },

  koprivnica: {
    cityId: "koprivnica",
    name: "Koprivnica",
    country: "Croatia",
    overview:
      "Koprivnica is football-first and low-frills. This is not the place to fake a luxury city-break narrative. The correct framing is a clean, practical overnight or a day-trip football stop for people who actually care about full league coverage.",
    topThings: [
      { title: "Compact centre walk", tip: "Enough for orientation and a meal, not for a sprawling itinerary." },
      { title: "Local café stop", tip: "Best done simply rather than overplanned." },
      { title: "Town square / centre", tip: "Use it as your anchor." },
      { title: "Pre-match local food", tip: "Sort this early and keep the day easy." },
      { title: "Rail arrival block", tip: "If arriving by train, keep the logistics tight." },
      { title: "Simple overnight", tip: "This is the honest product here." },
      { title: "Zagreb-linked route", tip: "Usually the smartest wider-trip framing." },
      { title: "Morning coffee exit plan", tip: "Useful if treating it as a one-night stop." },
      { title: "Match-first schedule", tip: "Don’t overdecorate the trip." },
      { title: "Regional northern Croatia route", tip: "Where it makes most sense." },
    ],
    tips: [
      "This is a practical football stop, not a glamour break.",
      "Zagreb can be the stronger wider base.",
      "One night is plenty for most travellers.",
      "Keep it simple and it works.",
      "Useful for proper league-depth travel.",
    ],
    food: [
      "Simple local restaurants",
      "Town-centre cafés",
      "Straightforward pre-match food",
      "Bakery breakfast options",
    ],
    transport:
      "The town is manageable once you arrive. The main thing is broader route planning rather than inner-city complexity.",
    accommodation:
      "Koprivnica Centre is best for simplicity. Zagreb is stronger if you want better hotels and nightlife.",
  },

  varazdin: {
    cityId: "varazdin",
    name: "Varaždin",
    country: "Croatia",
    overview:
      "Varaždin is one of the nicest smaller football cities in Croatia because the centre is attractive, compact, and easy to use. This is the kind of place where a one-night football stop can actually feel pleasant rather than purely functional.",
    topThings: [
      { title: "Old Town stroll", tip: "The city’s main asset. Walk it properly instead of rushing." },
      { title: "Castle / historic core", tip: "Good for light sightseeing without wasting the day." },
      { title: "Main square café session", tip: "Best used as part of the city rhythm." },
      { title: "Short museum / church loop", tip: "Only if you want some cultural depth." },
      { title: "Pre-match meal in the centre", tip: "This is the obvious move." },
      { title: "Evening walk", tip: "Varaždin suits a calm football overnight." },
      { title: "Local bakery breakfast", tip: "Good low-effort morning plan." },
      { title: "Matchday walkability", tip: "One of the city’s strengths." },
      { title: "Zagreb add-on", tip: "Easy enough if combining cities." },
      { title: "One-night reset city", tip: "That is where it excels." },
    ],
    tips: [
      "Good city to stay locally rather than commute.",
      "Compact centre makes the whole trip easy.",
      "Do not overstuff the day — Varaždin works because it is simple.",
      "Better city feel than many clubs at this level get.",
      "Strong smaller-stop quality.",
    ],
    food: [
      "Local Croatian dining",
      "Town-centre cafés",
      "Simple wine bars",
      "Bakery breakfasts",
    ],
    transport:
      "Walkability is the main advantage. Keep the trip compact and transport barely matters.",
    accommodation:
      "Old Town / Centre is the obvious and best base.",
  },

  pula: {
    cityId: "pula",
    name: "Pula",
    country: "Croatia",
    thingsToDoUrl: GYG.pula,
    overview:
      "Pula is one of the strongest city-over-club football destinations in the Croatian map. The city is the draw first, and the football becomes a high-quality add-on to a genuinely good coastal break. That is not a weakness. It is a very saleable product if you frame it honestly.",
    topThings: [
      { title: "Pula Arena", tip: "The obvious landmark and worth seeing properly." },
      { title: "Old Town / Roman core", tip: "Best explored casually, not with rigid checklists." },
      { title: "Harbour and waterfront", tip: "Useful as part of the city flow rather than a standalone attraction." },
      { title: "Coastal swim / sea block", tip: "A big part of why Pula works." },
      { title: "Seafood dinner", tip: "The city is too good for lazy food choices." },
      { title: "Aldo Drosina approach", tip: "Keep matchday movement simple from the centre." },
      { title: "Morning coffee in the old core", tip: "Strong slow-start city." },
      { title: "Nearby beaches", tip: "Worth it if the weather is right." },
      { title: "Evening drinks", tip: "Pula is more relaxed than Split, which suits some travellers better." },
      { title: "Istria extension", tip: "Huge upside if you have time." },
    ],
    tips: [
      "The city is the bigger product; football strengthens it.",
      "Stay central unless you deliberately want resort mode.",
      "Pula suits a slower, nicer coastal football weekend.",
      "One of the easiest football-plus-leisure combinations in the HNL.",
      "Weather matters more here than in inland trips.",
    ],
    food: [
      "Seafood",
      "Istrian local cuisine",
      "Wine bars",
      "Old-town restaurants",
    ],
    transport:
      "Pula is manageable if you stay central. Most useful movement is simple and short-distance.",
    accommodation:
      "Pula Centre is best for football plus city. Verudela works if you want more resort-style coastal stay.",
  },

  "velika-gorica": {
    cityId: "velika-gorica",
    name: "Velika Gorica",
    country: "Croatia",
    overview:
      "Velika Gorica is a functional football stop more than a destination city. Its main advantages are obvious: proximity to Zagreb airport, easy access, and a simple matchday product. Try to oversell it as a major break and you’re lying.",
    topThings: [
      { title: "Simple centre loop", tip: "Enough to orient yourself, not enough for a full city fantasy." },
      { title: "Pre-match meal", tip: "Keep it practical and early." },
      { title: "Airport-linked overnight", tip: "A real use case here." },
      { title: "Zagreb side trip", tip: "Usually the smarter broader trip move." },
      { title: "Short local café stop", tip: "Low-fuss is the point." },
      { title: "Match-first planning", tip: "This should be a simple day." },
      { title: "Late arrival / early departure utility", tip: "One of the city’s real strengths." },
      { title: "Rail/bus planning", tip: "Keep connections clean." },
      { title: "No-overcomplication rule", tip: "Critical here." },
      { title: "Zagreb return after match", tip: "Usually the correct decision." },
    ],
    tips: [
      "Most visitors should stay in Zagreb and travel in.",
      "Useful airport-linked football stop.",
      "Do not try to turn it into something it isn’t.",
      "Good utility, limited glamour.",
      "Works best as part of a Zagreb trip.",
    ],
    food: [
      "Simple grills",
      "Local cafés",
      "Straightforward pre-match meals",
      "Bakery options",
    ],
    transport:
      "The whole point is convenience. Keep movement simple and don’t overengineer it.",
    accommodation:
      "Velika Gorica is fine for airport convenience. Zagreb is better for almost everything else.",
  },

  osijek: {
    cityId: "osijek",
    name: "Osijek",
    country: "Croatia",
    thingsToDoUrl: GYG.osijek,
    overview:
      "Osijek is one of the most underrated proper city trips in the HNL map. It has riverfront quality, a distinct eastern-Croatia feel, enough urban depth to justify an overnight, and now a stronger stadium product to match. This is not just a day-trip football stop.",
    topThings: [
      { title: "Tvrđa", tip: "Best historical and atmospheric zone in the city." },
      { title: "Drava riverfront", tip: "Excellent simple walk that makes the city feel open and easy." },
      { title: "Centre cafés", tip: "Osijek suits a slower café-led rhythm." },
      { title: "Opus Arena plan", tip: "Treat matchday as one deliberate move from the centre." },
      { title: "Evening drinks in Tvrđa", tip: "Best if you want the city to feel alive without chaos." },
      { title: "Morning river walk", tip: "Strong reset before travel." },
      { title: "Good local dinner", tip: "Worth doing properly rather than lazily." },
      { title: "Short museum or cultural block", tip: "Useful if you have extra time." },
      { title: "Tram / local transport use", tip: "Keeps the city easy." },
      { title: "Slavonia extension", tip: "Real upside if building a longer route." },
    ],
    tips: [
      "Treat Osijek as a proper city stop, not just a fixture detour.",
      "Tvrđa / centre is the best base.",
      "One of the cleanest non-obvious football weekends in Croatia.",
      "New stadium improves the full product massively.",
      "Very good value in the broader app map.",
    ],
    food: [
      "Slavonian local dishes",
      "Tvrđa restaurants",
      "Riverfront cafés",
      "Simple breakfast bakeries",
    ],
    transport:
      "Osijek is manageable and calm by regional-city standards. The city works well if you keep your base central.",
    accommodation:
      "Tvrđa / Centre is best for atmosphere and practicality. River-adjacent stays also work well.",
  },

  vukovar: {
    cityId: "vukovar",
    name: "Vukovar",
    country: "Croatia",
    overview:
      "Vukovar is not a standard football-weekend city because the city’s historical and civic weight changes the tone of the trip immediately. This is a place to approach seriously. The football matters, but it sits inside a wider context that should not be treated lightly.",
    topThings: [
      { title: "Danube riverfront", tip: "A simple walk that gives the city context quickly." },
      { title: "Memorial / history sites", tip: "Only do this properly if you are willing to approach it seriously." },
      { title: "Town-centre orientation loop", tip: "Enough to understand the city’s scale and feel." },
      { title: "Pre-match simple meal", tip: "Keep the day straightforward." },
      { title: "Football-first visit", tip: "This is the cleanest way to frame it unless staying longer for historical reasons." },
      { title: "Morning coffee block", tip: "Useful if staying one night." },
      { title: "Osijek pairing", tip: "Usually the strongest broader-trip structure." },
      { title: "Quiet evening approach", tip: "The city suits seriousness more than forced nightlife." },
      { title: "Matchday planning", tip: "Keep logistics simple and respectful." },
      { title: "Context over quantity", tip: "Do fewer things properly here." },
    ],
    tips: [
      "Approach the city seriously, not as a throwaway stop.",
      "Better paired with Osijek for a stronger wider base.",
      "Football here is about place as much as spectacle.",
      "Do not expect a polished major-city weekend.",
      "One of the league’s most context-heavy trips.",
    ],
    food: [
      "Simple local Croatian food",
      "Town-centre cafés",
      "Straightforward dinners",
      "Bakery breakfasts",
    ],
    transport:
      "Keep movement simple. This is not a complex city, but the wider region matters more than intra-city transport.",
    accommodation:
      "Vukovar Centre works for simplicity. Osijek is stronger if you want a broader city base.",
  },
};

export default hnlCityGuides;
