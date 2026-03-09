import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
 */
const GYG = {
  nicosia:
    "https://www.getyourguide.com/en-gb/nicosia-l425/?partner_id=MAQJREP&utm_medium=online_publisher",
  limassol:
    "https://www.getyourguide.com/en-gb/limassol-l127698/?partner_id=MAQJREP&utm_medium=online_publisher",
  larnaca:
    "https://www.getyourguide.com/en-gb/larnaca-l1588/?partner_id=MAQJREP&utm_medium=online_publisher",
  paphos:
    "https://www.getyourguide.com/en-gb/paphos-l426/?partner_id=MAQJREP&utm_medium=online_publisher",
  protaras:
    "https://www.getyourguide.com/en-gb/protaras-l129698/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const firstDivisionCyprusCityGuides: Record<string, CityGuide> = {
  nicosia: {
    cityId: "nicosia",
    name: "Nicosia",
    country: "Cyprus",
    thingsToDoUrl: GYG.nicosia,

    overview:
      "Nicosia is the most important football city in Cyprus because it holds the biggest clubs, the biggest domestic derby, and the clearest sense that football still matters here as something deeper than leisure entertainment. It is also the least resort-like major base on the island, which is exactly why it works for football. The smart version of a Nicosia trip is simple: stay central, use the old city and modern centre as your social base, and treat GSP as a deliberate matchday branch rather than trying to live next to the ground. This is the place to come if your priority is Cypriot football culture first and sunshine second.",

    topThings: [
      {
        title: "Old City and Venetian Walls walk",
        tip: "Best first move in Nicosia because it gives the city shape and immediately separates it from the coast-heavy Cyprus trips.",
      },
      {
        title: "Ledra Street and central crossing area",
        tip: "Worth doing because the city’s political geography is part of what makes Nicosia feel different, not because it is some giant attraction machine.",
      },
      {
        title: "Laiki Geitonia evening loop",
        tip: "Good for dinner and atmosphere, but do not over-romanticise it into your whole trip.",
      },
      {
        title: "Cyprus Museum or one serious historical stop",
        tip: "Do one proper cultural block, not five weak ones. Nicosia rewards focus.",
      },
      {
        title: "APOEL or Omonia matchday",
        tip: "This is the reason the city matters most in the app. Build the day around it properly.",
      },
      {
        title: "Nicosia derby planning",
        tip: "If APOEL v Omonia is on, everything else is secondary. That is the premium football event in Cyprus.",
      },
      {
        title: "Olympiakos contrast stop",
        tip: "Useful if you want to understand Nicosia as a layered football city rather than a two-club postcard.",
      },
      {
        title: "One strong central dinner booking",
        tip: "Book it properly. Nicosia is better when you make one good evening decision instead of six average ones.",
      },
      {
        title: "Coffee and pastry morning in the centre",
        tip: "This city suits a slower, more deliberate football-weekend rhythm.",
      },
      {
        title: "Post-match central return",
        tip: "The trip works best when the football and the old-city/social core remain clearly connected.",
      },
    ],

    tips: [
      "Stay central. Do not stay near GSP unless convenience is your only goal.",
      "Nicosia is the best city on the island for football-first travellers.",
      "The APOEL-Omonia match is the biggest domestic fixture in Cyprus.",
      "This is not a beach trip, and that is exactly why it works.",
      "One strong sightseeing block per day is enough. The football should stay central.",
    ],

    food: [
      "Traditional Cypriot tavernas",
      "Modern central Mediterranean restaurants",
      "Meze dinner",
      "Coffee and pastry cafés",
      "One proper pre-match booking instead of random late choices",
    ],

    transport:
      "Nicosia is straightforward if you stay in the centre and accept that matchday movement to GSP is a branch journey rather than a walkable old-town experience. Taxis and local road travel matter more than rail-style public transport because Cyprus generally works that way. The real mistake is staying too far out and pretending you have solved anything.",

    accommodation:
      "Stay in central Nicosia or near the old city. That gives you the strongest mix of food, nightlife, city atmosphere, and workable matchday access. Strovolos only makes sense if stadium convenience matters more than the city itself.",
  },

  limassol: {
    cityId: "limassol",
    name: "Limassol",
    country: "Cyprus",
    thingsToDoUrl: GYG.limassol,

    overview:
      "Limassol is arguably the strongest all-round football city-break on the island because it combines multiple serious clubs with real nightlife, a seafront, and enough urban energy that the weekend can feel big even before kickoff. Apollon, AEL, and Aris make it one of the most important football cities in Cyprus, and the city itself gives you far more weekend range than Nicosia if you want football plus bars, coast, and a broader social feel. The key is not to stay by the stadium. Stay in Limassol proper and use the ground as a matchday destination rather than your base.",

    topThings: [
      {
        title: "Marina and old town loop",
        tip: "Best first-day block because it gives you food, walking, and city identity in one hit.",
      },
      {
        title: "Seafront promenade walk",
        tip: "Ideal morning or late-afternoon move. Do not waste peak football time on it.",
      },
      {
        title: "Limassol derby or upper-end fixture",
        tip: "This is when the city’s football identity becomes most obvious. Build the whole trip around it if possible.",
      },
      {
        title: "Apollon / AEL / Aris contrast planning",
        tip: "The real strength here is that Limassol lets you understand three different club identities inside one city.",
      },
      {
        title: "One strong marina or old-town dinner",
        tip: "Book properly. Limassol is too good a food city to leave dinner to luck.",
      },
      {
        title: "Beach-side reset block",
        tip: "Useful if you want the city-break side of the weekend, but do not let it dominate the football logic.",
      },
      {
        title: "Pre-match drinks in the centre",
        tip: "Better atmosphere and more choice than hovering near the stadium too early.",
      },
      {
        title: "Castle area stop",
        tip: "Good as a connector block, not as a full-day mission.",
      },
      {
        title: "Late-night Limassol bar session",
        tip: "One of the city’s real strengths. This is why it beats smaller football towns.",
      },
      {
        title: "One-night or two-night split",
        tip: "Two nights is the sweet spot if you want football plus actual city time.",
      },
    ],

    tips: [
      "Stay in Limassol itself, not by Alphamega Stadium.",
      "This is one of the best football-plus-city weekends in Cyprus.",
      "Derbies and top-end fixtures are the premium trips.",
      "The city has enough nightlife and food to justify staying central every time.",
      "Treat the stadium as an event destination, not as the centre of the trip.",
    ],

    food: [
      "Seafront seafood",
      "Traditional Cypriot meze",
      "Old-town tavernas",
      "Modern Mediterranean small plates",
      "Late-night bars with proper food options",
    ],

    transport:
      "Limassol works best with a central base and short taxi journeys. The city’s value is all in the marina-old-town-seafront core, and the stadium sits outside that logic. Once you accept that, everything becomes cleaner. Stay central, enjoy the city properly, then travel to the match.",

    accommodation:
      "Limassol Marina, Old Town, and the stronger central seafront districts are the right answers. Germasogeia works if you want a more resort-heavy hotel zone, but Old Town and the Marina usually give the best football-weekend balance.",
  },

  larnaca: {
    cityId: "larnaca",
    name: "Larnaca",
    country: "Cyprus",
    thingsToDoUrl: GYG.larnaca,

    overview:
      "Larnaca is one of the easiest football bases in the entire app because the airport is close, the seafront is practical, the city is compact, and both AEK Larnaca and Anorthosis-linked trips route cleanly from one sensible base. It does not have the intensity of Nicosia or the wider social scale of Limassol, but it may be the easiest clean football weekend on the island. That matters. The smart Larnaca trip is about frictionless planning: stay by Finikoudes or central Larnaca, keep the trip compact, and let the football sit naturally inside a coastal city break.",

    topThings: [
      {
        title: "Finikoudes seafront",
        tip: "The obvious base area for a reason. It solves most of the trip without effort.",
      },
      {
        title: "Larnaca old quarter and St Lazarus area",
        tip: "A good central walk that adds enough shape without demanding too much time.",
      },
      {
        title: "AEK Larnaca matchday",
        tip: "One of the cleanest football logistics on the island. Very easy to execute well.",
      },
      {
        title: "Anorthosis contrast trip",
        tip: "Essential if you want to understand the city’s football depth rather than only the easiest modern setup.",
      },
      {
        title: "One seafront dinner booking",
        tip: "Do this properly because Larnaca is at its best when the football and the coast feel naturally connected.",
      },
      {
        title: "Beach and coffee morning",
        tip: "The city is compact enough that this can fit around the football without stress.",
      },
      {
        title: "Salt Lake / mosque area stop",
        tip: "Good short add-on if you want one non-football scenic block.",
      },
      {
        title: "Airport-to-hotel efficiency",
        tip: "One of Larnaca’s biggest strengths is how quickly the trip starts feeling easy.",
      },
      {
        title: "Pre-match central drinks",
        tip: "Better than wasting too much time around the stadium zone.",
      },
      {
        title: "One-night or two-night clean break",
        tip: "Both work. One night is enough. Two nights makes it feel properly relaxed.",
      },
    ],

    tips: [
      "Larnaca is the easiest football base in Cyprus.",
      "Stay around Finikoudes or central Larnaca.",
      "AEK is the clean modern trip; Anorthosis adds traditional weight.",
      "Perfect if you want football without any major logistical nonsense.",
      "This is a very strong app city because it is simple and effective.",
    ],

    food: [
      "Seafront seafood",
      "Cypriot meze",
      "Central tavernas",
      "Coffee and breakfast cafés",
      "One proper evening booking by the water",
    ],

    transport:
      "Larnaca is brutally simple in the best possible way. Airport transfer is easy, city centre is compact, and stadium travel is manageable from one sensible base. This is not a city where you need to be clever. You just need to avoid stupid hotel choices.",

    accommodation:
      "Finikoudes is the best all-round base, with central Larnaca just behind it. That gives you the easiest balance of beach, restaurants, bars, and football access.",
  },

  paphos: {
    cityId: "paphos",
    name: "Paphos",
    country: "Cyprus",
    thingsToDoUrl: GYG.paphos,

    overview:
      "Paphos is one of the strongest lifestyle football trips in the entire footprint because it combines a serious modern club in Pafos with one of the most holiday-friendly destinations in Cyprus. It is not the island’s deepest football city culturally, but it might be one of the smartest football weekends overall because the non-football side is so strong. The correct approach is obvious: stay in Kato Paphos, treat the seafront and old archaeological layers as the supporting cast, and let the football turn a beach-and-history weekend into an actual football trip rather than just a resort stay.",

    topThings: [
      {
        title: "Kato Paphos seafront and harbour",
        tip: "The natural centre of the trip and the right base area for almost everyone.",
      },
      {
        title: "Pafos matchday",
        tip: "The club have real modern significance now, so do not treat the football as an optional add-on.",
      },
      {
        title: "Archaeological park and mosaics",
        tip: "Worth doing because Paphos has genuine depth beyond resort energy, but do not make it the whole weekend.",
      },
      {
        title: "Seafront dinner and drinks",
        tip: "One of the city’s biggest strengths. Book well and let it carry the evening.",
      },
      {
        title: "Beach or coastal reset block",
        tip: "Easy value, but keep the football central if that is why you came.",
      },
      {
        title: "Akritas Chlorakas area add-on",
        tip: "Useful only if you want to deepen the football route. Otherwise Pafos remains the obvious main focus.",
      },
      {
        title: "Sunset harbour walk",
        tip: "Simple, obvious, and still worth doing.",
      },
      {
        title: "Wine or village excursion",
        tip: "Only if you have a longer stay. Do not overcomplicate the football weekend.",
      },
      {
        title: "One proper lunch, one proper dinner",
        tip: "Paphos is better when you do the basics well instead of trying to conquer the whole map.",
      },
      {
        title: "Two-night football break",
        tip: "Probably the sweet spot if you want both the football and the city to breathe.",
      },
    ],

    tips: [
      "Stay in Kato Paphos unless you have a very specific reason not to.",
      "This is one of the best football-plus-holiday breaks in the app.",
      "Pafos are now strong enough that the football deserves proper respect.",
      "Do not build the whole trip around stadium proximity.",
      "Excellent if you want football without sacrificing leisure value.",
    ],

    food: [
      "Seafront seafood",
      "Cypriot tavernas",
      "Modern Mediterranean dinner spots",
      "Wine bars",
      "Coffee and breakfast with sea views",
    ],

    transport:
      "Paphos is easy as long as you stay in the right zone. Kato Paphos gives you the holiday layer, the restaurants, and a simple enough route to the football. The city is not something to over-engineer. A central/tourist base solves almost everything.",

    accommodation:
      "Kato Paphos is the best base by a distance. It gives the trip the strongest overall feel and makes the football easy to layer into a proper coastal weekend.",
  },

  "aradippou": {
    cityId: "aradippou",
    name: "Aradippou",
    country: "Cyprus",

    overview:
      "Aradippou is not a destination football weekend in its own right. The correct way to think about it is as a football branch off a Larnaca base. Omonia Aradippou may matter inside the league, but the city-break logic is clearly Larnaca, not Aradippou. That is not a flaw. It is just the truth. Treat the match as the football event and let Larnaca carry the wider trip quality.",

    topThings: [
      {
        title: "Larnaca-based stay",
        tip: "This is not optional. It is the obvious correct plan for almost every visitor.",
      },
      {
        title: "Omonia Aradippou matchday",
        tip: "Treat it as a football-depth stop, not a standalone tourism event.",
      },
      {
        title: "Simple pre-match food in Larnaca",
        tip: "Stronger choice than trying to build the whole day around Aradippou itself.",
      },
      {
        title: "Short local orientation only if needed",
        tip: "Enough to settle the area, but do not pretend there is a giant weekend here.",
      },
      {
        title: "Post-match return to Larnaca",
        tip: "The smarter move almost every time.",
      },
      {
        title: "Football-route layering",
        tip: "Works well if you are stacking AEK or Anorthosis into the same broader trip.",
      },
      {
        title: "One-night route stop",
        tip: "Usually enough if this fixture is a main target.",
      },
      {
        title: "Larnaca seafront recovery block",
        tip: "Use the stronger nearby city to make the whole trip better.",
      },
      {
        title: "Smaller-club mindset",
        tip: "This trip only makes sense if you actually value league breadth.",
      },
      {
        title: "Morning move-on",
        tip: "Keep it tidy and practical.",
      },
    ],

    tips: [
      "Stay in Larnaca, not Aradippou.",
      "This is a football-depth stop, not a premium destination weekend.",
      "Use the fixture as part of a wider east-coast football route.",
      "Keep the planning simple.",
      "Good for serious domestic-football travellers.",
    ],

    food: [
      "Better dining in Larnaca",
      "Simple local pre-match meals",
      "Coffee and pastry stops",
      "One proper seafront dinner back in Larnaca",
    ],

    transport:
      "The only real decision is where you base yourself, and the answer is Larnaca. Once you accept that, the trip becomes straightforward.",

    accommodation:
      "Stay in Larnaca, ideally around Finikoudes or the centre. There is very little argument for sleeping in Aradippou unless logistics force it.",
  },

  "chloraka": {
    cityId: "chloraka",
    name: "Chloraka",
    country: "Cyprus",

    overview:
      "Chloraka is not a destination football city in its own right. It is part of the wider Paphos football and leisure zone, and that is how it should be planned. Akritas Chlorakas may give the area league meaning, but the smart visitor move is still to use Paphos as the real base and treat Chloraka as the site of the match rather than the heart of the trip.",

    topThings: [
      {
        title: "Paphos-based stay",
        tip: "The correct answer for almost every visitor. Paphos carries the trip; Chloraka carries the fixture.",
      },
      {
        title: "Akritas Chlorakas matchday",
        tip: "Useful for league-depth travellers, but do not oversell it into a giant occasion.",
      },
      {
        title: "Kato Paphos pre-match route",
        tip: "Stronger and more enjoyable than trying to spend all day in Chloraka itself.",
      },
      {
        title: "Simple Chloraka local orientation",
        tip: "Enough if you want to understand the area, but keep it brief.",
      },
      {
        title: "Post-match return to Paphos",
        tip: "The trip quality improves immediately when you do this.",
      },
      {
        title: "Paphos harbour dinner",
        tip: "Use the better nearby city to make the football stop feel worthwhile overall.",
      },
      {
        title: "Football-plus-coast route",
        tip: "This is how the trip makes the most sense.",
      },
      {
        title: "One-night add-on fixture logic",
        tip: "Works if you are already in the Paphos area.",
      },
      {
        title: "League-completion mindset",
        tip: "This is not for casual football tourists; it is for people who want the full map.",
      },
      {
        title: "Morning coastal reset",
        tip: "Done in Paphos, not in a forced local Chloraka itinerary.",
      },
    ],

    tips: [
      "Stay in Paphos, not Chloraka.",
      "Treat this as a Paphos-area football trip.",
      "Akritas are a league-depth stop, not a glamour recommendation.",
      "Keep the weekend coast-led and football-supported.",
      "Best for serious domestic-football travellers.",
    ],

    food: [
      "Better restaurants in Paphos",
      "Seafront seafood",
      "Simple local dining if needed",
      "One proper dinner in Kato Paphos",
    ],

    transport:
      "Once you accept that Paphos is the base, the transport becomes simple. The mistake would be trying to pretend Chloraka needs to carry the whole weekend on its own.",

    accommodation:
      "Stay in Kato Paphos. There is little good reason to choose Chloraka itself over the stronger nearby base unless pure convenience is your only concern.",
  },

  "ypsonas": {
    cityId: "ypsonas",
    name: "Ypsonas",
    country: "Cyprus",

    overview:
      "Ypsonas is a football stop, not a football city break. The right way to do it is through Limassol. Digenis Ypsonas may give the area league relevance, but the wider value of the weekend comes from Limassol’s food, nightlife, and city feel. That is the obvious answer and pretending otherwise wastes time.",

    topThings: [
      {
        title: "Limassol-based stay",
        tip: "This is the only smart broad planning choice for most visitors.",
      },
      {
        title: "Digenis Ypsonas matchday",
        tip: "A useful smaller-club stop if you care about full league coverage.",
      },
      {
        title: "Limassol marina or old-town pre-match block",
        tip: "Much better than trying to fabricate a whole day around Ypsonas.",
      },
      {
        title: "Short local orientation only if needed",
        tip: "Enough to understand the area, nothing more.",
      },
      {
        title: "Post-match return to Limassol",
        tip: "The correct move for almost everyone.",
      },
      {
        title: "One proper Limassol dinner",
        tip: "Use the stronger nearby city to carry the trip quality.",
      },
      {
        title: "Football-depth branch trip",
        tip: "This is how Ypsonas makes sense in the app.",
      },
      {
        title: "One-night fixture add-on",
        tip: "Works well if added to a wider Limassol plan.",
      },
      {
        title: "Smaller-club realism",
        tip: "Only worth doing if you genuinely value league breadth.",
      },
      {
        title: "Morning city reset in Limassol",
        tip: "Again, let the main city do the heavy lifting.",
      },
    ],

    tips: [
      "Stay in Limassol, not Ypsonas.",
      "Treat this as a smaller-club branch off a stronger city base.",
      "Do not overcomplicate the weekend.",
      "Best for serious domestic-football travellers.",
      "Keep the football trip honest and practical.",
    ],

    food: [
      "Limassol old-town dining",
      "Marina restaurants",
      "Simple pre-match meal",
      "Late-night bars and food back in Limassol",
    ],

    transport:
      "The trip becomes easy once you accept that Ypsonas is the football site and Limassol is the actual base. Most problems come from resisting that reality.",

    accommodation:
      "Stay in Limassol Marina, Old Town, or the main central seafront districts. Ypsonas itself is only for pure convenience and offers much less overall value.",
  },

  "achna": {
    cityId: "achna",
    name: "Achna",
    country: "Cyprus",

    overview:
      "Achna is a regional football stop and should be treated exactly that way. Ethnikos Achna give it football significance, but the wider trip logic usually belongs either to Larnaca or to the east-coast resort corridor. This is not a criticism. It is just how the trip works best. You come for the club and let a stronger nearby base do the rest.",

    topThings: [
      {
        title: "Ethnikos Achna matchday",
        tip: "The football is the clear reason to come. Treat it that way.",
      },
      {
        title: "Larnaca or east-coast base choice",
        tip: "This is the key trip decision. Solve it early and the rest becomes easy.",
      },
      {
        title: "Dasaki Stadium arrival with time",
        tip: "A good smaller-club stop if you want the full domestic map.",
      },
      {
        title: "Short local orientation if needed",
        tip: "Enough to understand the area, no more.",
      },
      {
        title: "Coastal dinner after the match",
        tip: "A smarter play than trying to force big-night energy in Achna itself.",
      },
      {
        title: "Ayia Napa / Protaras pair-up",
        tip: "Works if you want a resort base with football layered in.",
      },
      {
        title: "Larnaca practical pair-up",
        tip: "Better if you want cleaner travel and less resort-heavy trip energy.",
      },
      {
        title: "One-night football stop",
        tip: "Usually enough unless you are staying on the coast anyway.",
      },
      {
        title: "League-depth mindset",
        tip: "This is for people who want the full Cyprus football picture.",
      },
      {
        title: "Morning move-on from a stronger base",
        tip: "Keep the trip efficient and realistic.",
      },
    ],

    tips: [
      "Achna is football-first and route-dependent.",
      "Most visitors should stay in Larnaca, Ayia Napa, or Protaras instead.",
      "Ethnikos are the point of the trip.",
      "Best for serious domestic-football travellers.",
      "Keep the planning practical.",
    ],

    food: [
      "Better wider dining on the coast",
      "Simple local pre-match meals",
      "One proper dinner back in your stronger base",
      "Coffee and breakfast in Larnaca or Protaras",
    ],

    transport:
      "The key transport question is where you are sleeping, not how you move around Achna itself. Choose the right coastal or city base and the football stop becomes straightforward.",

    accommodation:
      "Larnaca is the cleanest practical base. Protaras or Ayia Napa work if you want a stronger beach/resort dimension around the football.",
  },

  paralimni: {
    cityId: "paralimni",
    name: "Paralimni",
    country: "Cyprus",
    thingsToDoUrl: GYG.protaras,

    overview:
      "Paralimni works best as a football stop inside a broader east-coast Cyprus break. Enosis Paralimni give the town football meaning, but the stronger visitor base is often Protaras nearby because it offers more obvious hotel, beach, and leisure value. The smart play is to admit that immediately: use the east coast properly, let the football anchor one part of the trip, and do not try to force Paralimni into a giant standalone urban weekend that it is not built to be.",

    topThings: [
      {
        title: "Enosis Paralimni matchday",
        tip: "The clear football reason to be here and worth treating as the anchor event.",
      },
      {
        title: "Protaras-based stay",
        tip: "Usually the smartest broad travel decision if you want overall weekend quality.",
      },
      {
        title: "Paralimni centre orientation",
        tip: "Enough to settle the town, but do not overstate its city-break depth.",
      },
      {
        title: "East-coast beach block",
        tip: "This is part of why the wider route works so well.",
      },
      {
        title: "Post-match Protaras dinner",
        tip: "A cleaner and stronger move than forcing the entire evening into the football town itself.",
      },
      {
        title: "One-night or two-night east-coast trip",
        tip: "Two nights works well if you want football plus coast without rushing.",
      },
      {
        title: "Morning coffee by the sea",
        tip: "Easy value and one of the reasons the east coast is a smart football-travel zone.",
      },
      {
        title: "Nearby cove or coastal walk",
        tip: "Only if you have the time. The football should still be central if that is the trip’s stated purpose.",
      },
      {
        title: "Smaller-club realism",
        tip: "Enosis are a real club with local meaning, but this is not the island’s main atmosphere pilgrimage.",
      },
      {
        title: "East-Cyprus route logic",
        tip: "This is how the trip makes the most sense in the app overall.",
      },
    ],

    tips: [
      "Stay in Protaras or nearby east-coast resorts if you want the strongest overall trip.",
      "Paralimni works best as a football stop inside a broader east-coast weekend.",
      "Enosis are the reason to go, not giant-city energy.",
      "Good for a more relaxed football-plus-coast route.",
      "Keep expectations realistic and the trip works well.",
    ],

    food: [
      "Protaras seafront restaurants",
      "Cypriot tavernas",
      "Seafood",
      "Casual beach-area lunches",
      "One proper dinner after the football",
    ],

    transport:
      "This is another Cyprus trip where the hotel base matters more than anything else. Protaras gives you the broadest visitor value, and from there the football stop in Paralimni is easy to layer in.",

    accommodation:
      "Protaras is the strongest all-round base. Paralimni itself only makes sense if your priority is maximum match simplicity over overall trip quality.",
  },
};

export default firstDivisionCyprusCityGuides;
