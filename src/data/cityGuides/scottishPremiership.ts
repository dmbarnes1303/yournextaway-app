import type { CityGuide } from "./types";

const GYG = {
  glasgow:
    "https://www.getyourguide.com/en-gb/glasgow-l438/?partner_id=MAQJREP&utm_medium=online_publisher",
  edinburgh:
    "https://www.getyourguide.com/en-gb/edinburgh-l44/?partner_id=MAQJREP&utm_medium=online_publisher",
  aberdeen:
    "https://www.getyourguide.com/en-gb/aberdeen-l936/?partner_id=MAQJREP&utm_medium=online_publisher",
  dundee:
    "https://www.getyourguide.com/en-gb/dundee-l1604/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const scottishPremiershipCityGuides: Record<string, CityGuide> = {
  glasgow: {
    cityId: "glasgow",
    name: "Glasgow",
    country: "Scotland",
    thingsToDoUrl: GYG.glasgow,
    overview:
      "Glasgow is one of the strongest football-trip cities in Britain: big-club culture, proper edge, excellent pubs, and enough food and nightlife to make a full weekend worthwhile. It is less polished than Edinburgh and better for atmosphere, pub culture, and football energy.",
    topThings: [
      { title: "Kelvingrove Art Gallery and Museum", tip: "One of the easiest high-value daytime stops in the city. Free and actually worth your time." },
      { title: "West End walk", tip: "Best area for cafés, bars, and a more relaxed daytime feel before the football intensity kicks in." },
      { title: "Ashton Lane", tip: "Good for an easy evening circuit. Compact, simple, hard to mess up." },
      { title: "Merchant City", tip: "Stronger if you want dinner and drinks rather than sightseeing." },
      { title: "Glasgow Cathedral and Necropolis", tip: "Do both together. Strong historical stop without eating half your day." },
      { title: "Riverside Museum", tip: "Best for transport and engineering interest. Works well in bad weather." },
      { title: "George Square", tip: "Useful anchor point, not a destination. Don’t waste too long here." },
      { title: "Central station pub loop", tip: "Good if you want a practical pre-match or post-check-in route." },
      { title: "Stadium district walk", tip: "Arrive early and let the build-up happen. Glasgow football is about the surrounding energy as much as the 90 minutes." },
      { title: "One proper old-school pub", tip: "Don’t chain-hop all day. Pick one proper pub and let the city breathe." },
    ],
    tips: [
      "Glasgow is best when treated as a football city first and a sightseeing city second.",
      "Old Firm weekends change the whole city mood. Plan accordingly.",
      "Stay central or West End unless you have a specific reason not to.",
      "Book dinner on Friday and Saturday; don’t assume walk-ins.",
      "Matchday pub choices matter more here than in softer tourist cities.",
    ],
    food: [
      "Traditional pubs with kitchens",
      "Indian and curry houses",
      "West End brunch spots",
      "Steak and grill restaurants",
      "Late-night takeaway after the game",
    ],
    transport:
      "The city centre is very walkable, and the subway helps for short hops. Taxis are easy enough, but post-match surges slow everything down. If you can walk 15 minutes away from the ground first, do it.",
    accommodation:
      "City Centre and West End are the best bases. Central is easiest for stations and nightlife; West End is better if you want a less hectic feel.",
  },

  edinburgh: {
    cityId: "edinburgh",
    name: "Edinburgh",
    country: "Scotland",
    thingsToDoUrl: GYG.edinburgh,
    overview:
      "Edinburgh is the cleaner, prettier, more tourism-heavy Scottish football trip. It gives you excellent visuals, easy city walking, and enough bars and restaurants to keep a weekend strong. It is less raw than Glasgow but better for a full football-plus-city break.",
    topThings: [
      { title: "Royal Mile walk", tip: "Do it early or late. Midday crowds make it more annoying than impressive." },
      { title: "Edinburgh Castle area", tip: "Even if you do not go inside, the surrounding viewpoint value is huge." },
      { title: "Victoria Street and Old Town lanes", tip: "Best for atmosphere and photos, but don’t let it become a slow tourist shuffle." },
      { title: "Calton Hill", tip: "One of the easiest big-payoff viewpoints in the city." },
      { title: "Arthur’s Seat", tip: "Worth it if weather is decent and you have proper footwear. Don’t attempt it half-heartedly." },
      { title: "Dean Village", tip: "A calm contrast to the busy centre. Good for a softer daytime stretch." },
      { title: "Leith waterfront", tip: "Better for food and drinks than ticking off monuments." },
      { title: "Grassmarket pubs", tip: "Good energy, but quality varies. Choose carefully." },
      { title: "Matchday walk through Gorgie or Leith", tip: "The area around the clubs gives better football context than staying purely in tourist mode." },
      { title: "One strong dinner booking", tip: "Edinburgh rewards planning. Lazy food decisions get expensive fast." },
    ],
    tips: [
      "Edinburgh is walkable, but hills and cobbles slow you down more than you think.",
      "Stay central unless you’re deliberately choosing Leith.",
      "Weather can flip quickly. Pack properly.",
      "Tourist-heavy does not mean easy; book the good places.",
      "For football atmosphere, the local areas around the grounds matter more than the Royal Mile.",
    ],
    food: [
      "Gastropubs",
      "Scottish dining spots",
      "Leith seafood",
      "Brunch cafés",
      "Late drinks bars in the centre",
    ],
    transport:
      "Central Edinburgh is best on foot. Trams help for airport movements and some corridor travel, but most football-trip movement is easier by walking plus the occasional taxi.",
    accommodation:
      "Old Town/New Town is the easiest all-round base. Leith works if you want more food and drink focus and are happy not to be right in the historic centre.",
  },

  aberdeen: {
    cityId: "aberdeen",
    name: "Aberdeen",
    country: "Scotland",
    thingsToDoUrl: GYG.aberdeen,
    overview:
      "Aberdeen is a more functional football trip than a romantic one. It is compact enough, easy to navigate, and works best when you lean into the pub, coastal, and matchday side of the city rather than expecting a packed attractions list.",
    topThings: [
      { title: "Beachfront walk", tip: "Best simple reset in the city. Go if the weather is tolerable." },
      { title: "Footdee", tip: "Short but worthwhile if you want something local and distinct." },
      { title: "Marischal College exterior", tip: "Strong visual stop. Quick hit, not a long session." },
      { title: "Union Street pub run", tip: "Pick carefully. Some spots are better than others by a mile." },
      { title: "Old Aberdeen", tip: "A better atmosphere than trying to force big-city sightseeing." },
      { title: "Seaton Park", tip: "Useful if you want a lighter daytime hour before the football." },
      { title: "Harbour area", tip: "More about atmosphere than attractions." },
      { title: "Matchday around Pittodrie district", tip: "Get there with time to spare. The football context matters." },
      { title: "One strong seafood or grill dinner", tip: "Aberdeen works best with one deliberate evening plan." },
      { title: "Windproof coast stop", tip: "Dress properly or you’ll hate it." },
    ],
    tips: [
      "Aberdeen is a football-and-pubs city trip, not a landmark marathon.",
      "The weather can be brutal. Don’t pack optimistically.",
      "Central stay is easiest.",
      "Don’t overbuild the itinerary. Keep it tight.",
      "Pittodrie trips are better when you embrace the local feel rather than looking for polish.",
    ],
    food: ["Seafood", "Steak/grill", "Traditional pubs", "Casual cafés"],
    transport:
      "The centre is manageable on foot. Taxis are useful for shorter weather-dependent hops. Most visitors do not need to overthink local transport.",
    accommodation:
      "Stay central. That keeps station, bars, and stadium access simplest.",
  },

  dundee: {
    cityId: "dundee",
    name: "Dundee",
    country: "Scotland",
    thingsToDoUrl: GYG.dundee,
    overview:
      "Dundee is a compact football city where the novelty is obvious: two clubs, two grounds, very close together, and a trip that can be kept simple. It is not a huge city, but for a football-led break that is actually an advantage.",
    topThings: [
      { title: "V&A Dundee", tip: "Best non-football stop in the city. Strong building, quick win." },
      { title: "Waterfront walk", tip: "Good for a calm pre- or post-match stretch." },
      { title: "The McManus", tip: "Easy cultural stop that does not eat the whole day." },
      { title: "Law Hill viewpoint", tip: "Best if visibility is decent." },
      { title: "City centre pub circuit", tip: "Keep it simple rather than trying to over-curate Dundee." },
      { title: "Dual-stadium area walk", tip: "One of the city’s most distinctive football quirks. Worth seeing properly." },
      { title: "Riverside area", tip: "More useful as a filler than a headline attraction." },
      { title: "One proper matchday meal", tip: "Dundee works better with one solid food anchor." },
      { title: "Pre-match local pub", tip: "The football culture around the grounds is part of the point." },
      { title: "Short, sharp city loop", tip: "Dundee rewards efficiency, not overplanning." },
    ],
    tips: [
      "Dundee is best as a focused football weekend, not a sprawling city break.",
      "The two-stadium story is a genuine selling point.",
      "Stay central and keep life easy.",
      "Bad weather limits the city quickly, so have one indoor backup.",
      "Do not overestimate how much there is to ‘see’ beyond the football and waterfront core.",
    ],
    food: ["Pubs", "Casual grills", "Waterfront dining", "Brunch cafés"],
    transport:
      "Dundee is straightforward and compact. Walking covers most of what a football traveller needs.",
    accommodation:
      "City centre is the obvious base. There is no need to get clever.",
  },

  motherwell: {
    cityId: "motherwell",
    name: "Motherwell",
    country: "Scotland",
    overview:
      "Motherwell is not a tourism-first destination. It works as a practical match trip, especially if paired with Glasgow. Treat it honestly: local pubs, proper football culture, simple logistics.",
    topThings: [
      { title: "Strathclyde Country Park", tip: "Best if you want some air before or after the game." },
      { title: "Town-centre pub stop", tip: "Keep expectations grounded. Go local, not fancy." },
      { title: "Fir Park area walk", tip: "The matchday setting matters more than any attraction list." },
      { title: "Pair with Glasgow", tip: "That is the smart play if staying longer." },
      { title: "One simple meal", tip: "Don’t overcomplicate this stop." },
      { title: "Nearby rail access", tip: "Use Motherwell as a clean football branch off a bigger base." },
      { title: "Pre-match local atmosphere", tip: "That is the real value of the trip." },
      { title: "Short-town loop", tip: "Enough for an hour, not a full day." },
      { title: "Football-first planning", tip: "This is not a sightseeing city." },
      { title: "Efficient over ambitious", tip: "That is the right mindset here." },
    ],
    tips: [
      "Best done as a football-led stop from Glasgow.",
      "Local and practical beats stylish here.",
      "Keep logistics tight.",
      "Do not overbuild time in the town.",
      "Fir Park is the anchor, not an add-on.",
    ],
    food: ["Local pubs", "Casual takeaways", "Simple chain dining"],
    transport:
      "Rail links make Motherwell easy enough from Glasgow. Local matchday movement is straightforward.",
    accommodation:
      "Usually better to stay in Glasgow unless you have a specific reason to stay local.",
  },

  paisley: {
    cityId: "paisley",
    name: "Paisley",
    country: "Scotland",
    overview:
      "Paisley is another football-first stop rather than a classic city break. It is best used as a St Mirren trip or as part of a wider Glasgow weekend.",
    topThings: [
      { title: "Paisley Abbey", tip: "The obvious local heritage stop. Quick and worthwhile." },
      { title: "Town-centre pub", tip: "Local over polished is the right call." },
      { title: "St Mirren Park area", tip: "The football context is the point of the visit." },
      { title: "Short heritage loop", tip: "Enough to give the place a bit of shape." },
      { title: "Glasgow combo", tip: "Smartest way to make the trip fuller." },
      { title: "One meal, one pub, one match", tip: "That is the clean formula." },
      { title: "Rail access", tip: "Very manageable if based in Glasgow." },
      { title: "Pre-match local spot", tip: "Better than trying to touristify Paisley." },
      { title: "Simple planning", tip: "Works better than forcing a full-day agenda." },
      { title: "Football-led timing", tip: "Build the day around the ground." },
    ],
    tips: [
      "Best as a St Mirren trip from a Glasgow base.",
      "Do not expect a full-scale tourism city.",
      "Keep the day simple and local.",
      "Rail access is your friend.",
      "The football element is what justifies the stop.",
    ],
    food: ["Local pubs", "Casual dining", "Basic pre-match food"],
    transport:
      "Paisley is easy from Glasgow by rail and manageable on foot once there.",
    accommodation:
      "Usually better to stay in Glasgow unless airport convenience matters.",
  },

  kilmarnock: {
    cityId: "kilmarnock",
    name: "Kilmarnock",
    country: "Scotland",
    overview:
      "Kilmarnock is a straight football trip. It is best approached with zero nonsense: get there, enjoy Rugby Park, use a couple of local pubs, and move on.",
    topThings: [
      { title: "Dean Castle Country Park", tip: "Best non-football option if you need one." },
      { title: "Town-centre pub stop", tip: "Keep it classic and local." },
      { title: "Rugby Park area walk", tip: "The ground is the main event." },
      { title: "Pre-match local food", tip: "Plan it; options are not endless." },
      { title: "Short-town circuit", tip: "Enough for an hour or two." },
      { title: "Pair with Glasgow", tip: "Often the better wider-trip strategy." },
      { title: "Local football culture", tip: "That is what you came for." },
      { title: "Practical, not pretty", tip: "Accept that and the trip works." },
      { title: "Efficient planning", tip: "You do not need a bloated itinerary." },
      { title: "One solid matchday pub", tip: "That matters more than attractions." },
    ],
    tips: [
      "Kilmarnock is football-led, not sightseeing-led.",
      "Plan food before the match.",
      "Use it as a proper football stop rather than a city break.",
      "Rugby Park is the anchor.",
      "A Glasgow base can make more sense for a longer trip.",
    ],
    food: ["Pubs", "Casual grills", "Basic local dining"],
    transport:
      "Rail connections are workable. Once in town, it is mostly about simple matchday movement.",
    accommodation:
      "Usually better as a day trip or one-night stop unless you specifically want to stay local.",
  },

  falkirk: {
    cityId: "falkirk",
    name: "Falkirk",
    country: "Scotland",
    overview:
      "Falkirk is a practical football stop with a couple of decent add-ons. It is stronger as a straightforward weekend branch rather than a headline destination.",
    topThings: [
      { title: "The Kelpies", tip: "The obvious landmark and actually worth doing." },
      { title: "Helix Park walk", tip: "Pairs naturally with The Kelpies." },
      { title: "Callendar House and Park", tip: "Best if you want one calm daytime block." },
      { title: "Town-centre pub", tip: "Keep it local and uncomplicated." },
      { title: "Falkirk Stadium area", tip: "Football first, always." },
      { title: "Simple pre-match meal", tip: "Plan one, don’t wing it late." },
      { title: "Short rail-linked trip", tip: "Works well from bigger-city bases too." },
      { title: "One landmark, one pub, one match", tip: "That is the clean formula." },
      { title: "Don’t oversell the town", tip: "The football trip works when expectations are sensible." },
      { title: "Weather-flex planning", tip: "Outdoor value drops fast in poor conditions." },
    ],
    tips: [
      "The Kelpies are the clear extra attraction.",
      "Falkirk works best as a simple football-plus-one-add-on trip.",
      "Do not overplan the town centre.",
      "Keep the trip efficient.",
      "The stadium and landmark combo is enough.",
    ],
    food: ["Pubs", "Casual dining", "Simple chain options"],
    transport:
      "Rail and road access are decent. Once there, keep movement simple.",
    accommodation:
      "Can be done as a stay, but often works just as well from a larger nearby base.",
  },

  livingston: {
    cityId: "livingston",
    name: "Livingston",
    country: "Scotland",
    overview:
      "Livingston is not a romantic football trip. It is a practical one. If you treat it honestly, it works: clean logistics, football first, and easy access from Edinburgh or Glasgow.",
    topThings: [
      { title: "Almondvale area", tip: "The football trip centres on this. Don’t pretend otherwise." },
      { title: "Designer Outlet / practical shopping stop", tip: "Useful filler if you need to kill time, not a highlight." },
      { title: "Local pre-match meal", tip: "Keep it easy and practical." },
      { title: "One nearby pub stop", tip: "Good enough if chosen well." },
      { title: "Edinburgh combo", tip: "Often the smarter wider-trip move." },
      { title: "Simple rail/bus planning", tip: "Livingston is about convenience." },
      { title: "Football-led timing", tip: "Build around the match, not around attractions." },
      { title: "Short-stay mindset", tip: "This is not where you invent a big weekend itinerary." },
      { title: "Weather-proof practicality", tip: "Indoor options matter here." },
      { title: "No-nonsense trip design", tip: "That is how Livingston makes sense." },
    ],
    tips: [
      "Livingston is about convenience, not charm.",
      "Better as a football stop than a leisure destination.",
      "Can be paired with Edinburgh easily.",
      "Keep expectations realistic.",
      "Short, clean, practical trips suit it best.",
    ],
    food: ["Casual dining", "Shopping-centre food options", "Basic pubs"],
    transport:
      "Access is straightforward enough by road and public transport. It is one of the easier Scottish away-day style logistics setups.",
    accommodation:
      "Usually better to stay in Edinburgh or Glasgow unless you specifically want maximum convenience near the match.",
  },
};

export default scottishPremiershipCityGuides;
