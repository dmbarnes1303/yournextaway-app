import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate city entry points.
 * Keep this simple and city-level. Where a perfect city landing page is weak,
 * use the nearest strong visitor entry point rather than inventing junk.
 */
const GYG = {
  athens:
    "https://www.getyourguide.com/en-gb/athens-l91/?partner_id=MAQJREP&utm_medium=online_publisher",
  thessaloniki:
    "https://www.getyourguide.com/en-gb/thessaloniki-l115/?partner_id=MAQJREP&utm_medium=online_publisher",
  heraklion:
    "https://www.getyourguide.com/en-gb/heraklion-l1806/?partner_id=MAQJREP&utm_medium=online_publisher",
  volos:
    "https://www.getyourguide.com/en-gb/volos-l1488/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const superLeagueGreeceCityGuides: Record<string, CityGuide> = {
  athens: {
    cityId: "athens",
    name: "Athens",
    country: "Greece",
    thingsToDoUrl: GYG.athens,

    overview:
      "Athens is one of the best football-and-city-break combinations in Europe if you plan it properly. The winning formula is simple: stay central, treat the football as one anchor point in a wider city weekend, and do not waste time zig-zagging across the city without purpose. Athens rewards neighbourhood-based planning far more than attraction-collecting chaos.",

    topThings: [
      {
        title: "Acropolis & Acropolis Museum",
        tip: "Do them together and do them early. Heat and queues punish bad timing.",
      },
      {
        title: "Plaka wander",
        tip: "Good for atmosphere, but avoid turning it into souvenir-only dead time.",
      },
      {
        title: "Monastiraki evening",
        tip: "Strong for rooftop views, casual food, and a natural evening circuit.",
      },
      {
        title: "Syntagma → Ermou → Monastiraki walk",
        tip: "Best first-day orientation route. Easy, practical, and visually strong.",
      },
      {
        title: "Kolonaki coffee or dinner",
        tip: "Use it if you want a cleaner, more polished Athens feel.",
      },
      {
        title: "Psyrri bars and food",
        tip: "One of the best nighttime zones if you want atmosphere without overthinking logistics.",
      },
      {
        title: "Lycabettus Hill viewpoint",
        tip: "Go late afternoon or near sunset. Midday is pointless.",
      },
      {
        title: "National Garden reset walk",
        tip: "Useful if you need a low-effort calm block between sightseeing and matchday.",
      },
      {
        title: "Piraeus add-on",
        tip: "Worth it if you are doing Olympiacos or port-side dining, otherwise do not force it.",
      },
      {
        title: "Neighbourhood taverna dinner",
        tip: "Walk slightly off the main tourist corridors for better food and less nonsense.",
      },
    ],

    tips: [
      "Stay central Athens unless the match itself gives you a specific reason not to.",
      "Syntagma, Plaka, Monastiraki, Psyrri and Kolonaki are the strongest visitor bases.",
      "Athens works best when you plan by district, not by random map pins.",
      "In warmer months, do big sightseeing early and keep afternoons lighter.",
      "For football weekends, central base + metro/taxi out to the ground is usually the right move.",
    ],

    food: [
      "Classic taverna dinners in Plaka or just outside it",
      "Modern Greek small plates in central Athens",
      "Rooftop dinner with Acropolis view if you want one polished evening",
      "Street-food gyros, but do not make every meal a shortcut meal",
      "Psyrri and Monastiraki for casual evening food clusters",
    ],

    transport:
      "Athens is manageable if you stay central. Metro covers the key visitor zones and makes most football movement straightforward. Taxis can be useful, but central traffic can waste time fast. Walking between Syntagma, Plaka, Monastiraki, Psyrri and parts of Kolonaki is often the smartest move.",

    accommodation:
      "Syntagma is the best all-round base. Plaka is ideal if you want classic postcard Athens. Monastiraki and Psyrri are strongest for nightlife and food. Kolonaki is better for a more polished, quieter stay. Unless your entire trip is football-only, do not stay out by the stadium districts.",
  },

  piraeus: {
    cityId: "piraeus",
    name: "Piraeus",
    country: "Greece",
    thingsToDoUrl: GYG.athens,

    overview:
      "Piraeus is not a pure sightseeing destination on the level of central Athens, but it is far more useful than people assume. For an Olympiacos trip, a port-led weekend, or a split Athens–islands itinerary, it works well. The right mindset is simple: use Piraeus for matchday convenience, marina walks, seafood, and ferry logic, not for pretending it is central Athens.",

    topThings: [
      {
        title: "Marina Zeas walk",
        tip: "Best clean waterfront circuit with restaurants and a more polished feel.",
      },
      {
        title: "Mikrolimano meal stop",
        tip: "Strong for seafood and waterside atmosphere, especially in the evening.",
      },
      {
        title: "Port and ferry district loop",
        tip: "Only useful if ferries or island connections are part of your trip.",
      },
      {
        title: "Karaiskakis matchday area",
        tip: "Arrive with time. This is one of the best local football anchors in Greece.",
      },
      {
        title: "Short metro into central Athens",
        tip: "The smartest play if you want the city without paying central-stay prices.",
      },
      {
        title: "Coffee by the marina",
        tip: "Good low-effort start to a matchday.",
      },
      {
        title: "Seafood lunch",
        tip: "Piraeus is one of the better places in the Athens area to do this properly.",
      },
      {
        title: "Evening waterfront drink",
        tip: "Worth doing if you stay locally rather than rushing back immediately.",
      },
      {
        title: "Port viewpoint / harbour watch",
        tip: "Simple, but part of what makes the place feel distinct.",
      },
      {
        title: "Athens split-base add-on",
        tip: "Better as 1–2 nights within a wider Athens trip than as a long standalone city break.",
      },
    ],

    tips: [
      "Best for Olympiacos, ferry departures, or a hybrid Athens-port trip.",
      "Do not choose Piraeus expecting the full central-Athens sightseeing experience.",
      "If your priority is nightlife and monuments, central Athens still wins.",
      "If your priority is port ease and Olympiacos access, Piraeus is logical.",
      "Marina Zeas is one of the strongest stay areas here.",
    ],

    food: [
      "Seafood around Mikrolimano",
      "Waterside dinners at Marina Zeas",
      "Casual port-side cafés",
      "Simple Greek grills and tavernas",
    ],

    transport:
      "Piraeus links well into Athens by metro and rail, which is why it works. For most visitors, the correct strategy is either stay here for Olympiacos/port reasons or stay central Athens and come in for the match.",

    accommodation:
      "Marina Zeas is the best-looking base. Port-area hotels are practical but less characterful. If this is your first Athens trip, a split of central Athens plus one Piraeus night can be smarter than doing the whole stay here.",
  },

  thessaloniki: {
    cityId: "thessaloniki",
    name: "Thessaloniki",
    country: "Greece",
    thingsToDoUrl: GYG.thessaloniki,

    overview:
      "Thessaloniki is elite for football weekends because the city itself is strong enough to carry the trip even before the match. Food is excellent, nightlife is easy, the seafront gives it breathing room, and the city is compact enough to avoid constant logistical drag. If Athens is the bigger cultural heavyweight, Thessaloniki is the easier football-city weekend.",

    topThings: [
      {
        title: "Seafront promenade walk",
        tip: "Best simple reset route in the city. Sunrise and sunset both work.",
      },
      {
        title: "White Tower area",
        tip: "More of a landmark anchor than a long stop, but worth using in your route.",
      },
      {
        title: "Ladadika evening",
        tip: "One of the cleanest dinner-and-drinks zones in southeastern Europe.",
      },
      {
        title: "Ano Poli",
        tip: "Best for views, character and a less polished old-city feel.",
      },
      {
        title: "Rotunda and Roman sites",
        tip: "Good if you want history without overloading the schedule.",
      },
      {
        title: "Aristotelous Square",
        tip: "Useful as a central reference point, not as a full activity block.",
      },
      {
        title: "PAOK or Aris matchday build-up",
        tip: "Football culture matters here. Arrive early and let the atmosphere do the work.",
      },
      {
        title: "Late-night food stop",
        tip: "This city suits long evenings better than rushed, early shut-down plans.",
      },
      {
        title: "Neighbourhood coffee culture",
        tip: "Do not underestimate how much of Thessaloniki’s appeal is just sitting in the right place at the right time.",
      },
      {
        title: "Seafront dinner",
        tip: "Good option if you want one more polished evening instead of a full nightlife loop.",
      },
    ],

    tips: [
      "Ladadika and the seafront are the easiest high-value stay bases.",
      "Thessaloniki is one of the best pure football-weekend cities in the app.",
      "Stay central; local movement is then simple and low-friction.",
      "This is a city where food and atmosphere can carry the trip even with a lower-profile fixture.",
      "PAOK and Aris both benefit from using the city as the base, not the stadium districts.",
    ],

    food: [
      "Ladadika tavernas and late-night bars",
      "Seafront seafood",
      "Pastries and bougatsa in the morning",
      "Meze-style dinners with long, late service",
      "Casual grills and local bakeries between matchday blocks",
    ],

    transport:
      "Thessaloniki is much simpler than Athens. A central stay makes most of the trip walkable, with taxis filling the gaps to stadium areas. Keep it compact and you avoid nearly all friction.",

    accommodation:
      "Ladadika is the strongest all-round base for nightlife and food. White Tower / seafront is better if you want a scenic, slightly cleaner-feel stay. Ano Poli is more niche and characterful, but less universally practical.",
  },

  tripoli: {
    cityId: "tripoli",
    name: "Tripoli",
    country: "Greece",

    overview:
      "Tripoli is not a glamour football trip, and pretending otherwise is stupid. It is a useful, lower-profile stop with genuine local value if you are deliberately covering the league or combining football with a wider Peloponnese itinerary. The right way to frame it is simple: compact, practical, football-first, and regionally useful rather than spectacular.",

    topThings: [
      {
        title: "Central square and old-town walk",
        tip: "Short, practical orientation block rather than a full-day plan.",
      },
      {
        title: "Local coffee stop",
        tip: "Best done slowly; this is a place where pace matters more than attractions count.",
      },
      {
        title: "Asteras matchday area",
        tip: "The football is the anchor here, not a giant city itinerary.",
      },
      {
        title: "Peloponnese routing base",
        tip: "Useful if you are threading multiple stops together.",
      },
      {
        title: "Evening taverna meal",
        tip: "Low-key and local usually beats trying to force a polished city-break evening.",
      },
      {
        title: "Town-centre wander",
        tip: "Enough for an hour or two, not for pretending there is endless sightseeing.",
      },
      {
        title: "Regional road-trip stop",
        tip: "One of the better reasons to include Tripoli in a wider Greek trip.",
      },
      {
        title: "Pre-match relaxed lunch",
        tip: "The trip works better when you keep the tempo calm.",
      },
      {
        title: "Simple overnight reset",
        tip: "Treat it as a clean football sleepover, not a luxury escape.",
      },
      {
        title: "Nearby wider-region add-on",
        tip: "Tripoli improves when it is part of something bigger.",
      },
    ],

    tips: [
      "This is a football stop, not a heavyweight city-break product.",
      "Best for app depth, league coverage and wider Peloponnese routing.",
      "Keep expectations realistic and the trip becomes far better.",
      "One or two nights is the sweet spot.",
      "Use town-centre accommodation and keep everything simple.",
    ],

    food: [
      "Traditional tavernas",
      "Simple central cafés",
      "Local grills",
      "Low-key evening wine and meze",
    ],

    transport:
      "Tripoli works best if you are driving or moving through the Peloponnese with intent. Once in town, keep everything central and practical.",

    accommodation:
      "Town centre is the obvious move. There is no serious upside in overcomplicating the stay here.",
  },

  heraklion: {
    cityId: "heraklion",
    name: "Heraklion",
    country: "Greece",
    thingsToDoUrl: GYG.heraklion,

    overview:
      "Heraklion is one of the strongest non-capital football cities in this project because Crete gives the trip genuine extra value. You are not relying on the match alone. Good food, island atmosphere, port movement, history, and the option to stretch the trip beyond football all make this stronger than a standard one-club stop.",

    topThings: [
      {
        title: "Heraklion old centre",
        tip: "Best starting point. Compact, useful and easy to pair with food.",
      },
      {
        title: "Venetian harbour walk",
        tip: "Simple, obvious, and worth doing anyway.",
      },
      {
        title: "Koules Fortress area",
        tip: "Good as part of the harbour loop rather than as a standalone half-day.",
      },
      {
        title: "Archaeological Museum",
        tip: "One of the city’s highest-value non-football stops.",
      },
      {
        title: "OFI matchday block",
        tip: "Heraklion works best when football is one layer of a wider Cretan weekend.",
      },
      {
        title: "Central market food stop",
        tip: "Good way to add local texture without overcomplicating the day.",
      },
      {
        title: "Seafront dinner",
        tip: "A reliable polished option for one evening.",
      },
      {
        title: "Day-trip logic for wider Crete",
        tip: "Huge upside if you have extra time and transport.",
      },
      {
        title: "Port-side morning walk",
        tip: "Strong relaxed start before a later matchday.",
      },
      {
        title: "Neighbourhood coffee culture",
        tip: "Crete suits slower, longer stops rather than rushed city-chasing.",
      },
    ],

    tips: [
      "One of the best football-plus-leisure combinations in the league.",
      "Better as a wider Crete trip than a pure in-and-out football stop.",
      "Stay central or near the old town/port.",
      "The city is compact enough to keep movement simple.",
      "If you have more than one night, use the island advantage.",
    ],

    food: [
      "Cretan tavernas",
      "Seafood by the harbour",
      "Central market snacks and lunch",
      "Long dinners with local wine and meze",
      "Bakeries and coffee stops through the day",
    ],

    transport:
      "Heraklion is manageable on foot in the core visitor areas. Taxis are enough for short football transfers. The airport proximity helps, which makes this a very usable long-weekend product.",

    accommodation:
      "Old town and harbour-adjacent areas are the best base. They let you combine football, food and general city use without dead travel time.",
  },

  volos: {
    cityId: "volos",
    name: "Volos",
    country: "Greece",
    thingsToDoUrl: GYG.volos,

    overview:
      "Volos is an underrated coastal football stop. It is not Athens or Thessaloniki, but it has enough waterfront appeal, enough food value, and enough simplicity to work very well as a one- or two-night break. The mistake would be underrating it as just another lower-tier city. The right coastal framing makes it stronger than that.",

    topThings: [
      {
        title: "Waterfront promenade",
        tip: "The obvious walk, but still the right one.",
      },
      {
        title: "Tsipouradika food stop",
        tip: "One of the city’s best non-football selling points. Do this properly.",
      },
      {
        title: "Port and seafront evening",
        tip: "Best natural social block in the city.",
      },
      {
        title: "Volos matchday block",
        tip: "Works well because the city itself is compact and manageable.",
      },
      {
        title: "Coffee with sea view",
        tip: "Low-effort, high-return way to start the day.",
      },
      {
        title: "Simple old-centre wander",
        tip: "Keep expectations realistic; this is a compact city, not an attraction machine.",
      },
      {
        title: "Pelion foothills extension",
        tip: "Useful if you have a car or are deliberately broadening the trip.",
      },
      {
        title: "Harbour dinner",
        tip: "Good for a more polished evening without much planning stress.",
      },
      {
        title: "Pre-match lunch by the water",
        tip: "One of the easiest wins in the city.",
      },
      {
        title: "One- or two-night coastal football break",
        tip: "This is the cleanest way to frame the product.",
      },
    ],

    tips: [
      "Volos is better than it looks on paper if you like coastal-city weekends.",
      "Best as a one- or two-night stay.",
      "Waterfront base is the smart move.",
      "The food scene adds more value than many smaller football cities.",
      "Do not overbuild the schedule; the city works because it is easy.",
    ],

    food: [
      "Tsipouradika small plates",
      "Waterfront seafood",
      "Casual harbour cafés",
      "Simple Greek dinners with sea access",
    ],

    transport:
      "Volos is easy if you stay central or near the waterfront. Most useful visitor movement is short and low-friction.",

    accommodation:
      "Waterfront / centre is the obvious base. It gives the trip nearly all of its upside immediately.",
  },

  livadeia: {
    cityId: "livadeia",
    name: "Livadeia",
    country: "Greece",

    overview:
      "Livadeia is not a glamour football weekend and there is no value in pretending it is one. Its strength is that it is compact, practical, and useful for serious league coverage. If you frame it as a tidy one-night football stop with low wasted movement, it works. If you try to sell it like Athens-lite, it falls apart immediately.",

    topThings: [
      {
        title: "Old-town centre walk",
        tip: "Enough for a relaxed orientation block, not a full-day sightseeing mission.",
      },
      {
        title: "Erkina river area",
        tip: "One of the nicer local walking sections if you want a calm, low-effort route.",
      },
      {
        title: "Castle hill viewpoint",
        tip: "Worth it for a simple elevated look over the town, but do not overhype it.",
      },
      {
        title: "Levadiakos matchday block",
        tip: "The football is the anchor here. Build the day around that reality.",
      },
      {
        title: "Central square coffee stop",
        tip: "Useful because the city suits slower pacing more than checklist tourism.",
      },
      {
        title: "Short local taverna dinner",
        tip: "Keep it honest and simple. That is the right way to use the place.",
      },
      {
        title: "Rail or road stopover logic",
        tip: "Livadeia makes more sense when it fits into a wider Greece route.",
      },
      {
        title: "Neighbourhood evening stroll",
        tip: "Better for decompression than for ‘must-do’ value.",
      },
      {
        title: "Pre-match lunch in town",
        tip: "A clean easy win before heading to the ground.",
      },
      {
        title: "One-night football stop",
        tip: "That is the correct product framing for most travellers.",
      },
    ],

    tips: [
      "This is a football stop, not a premium city-break product.",
      "One night is usually enough.",
      "Use the town centre and keep everything compact.",
      "Best for league coverage or wider route-building.",
      "Do not try to force a big itinerary onto a small place.",
    ],

    food: [
      "Traditional town-centre tavernas",
      "Simple grills",
      "Cafés around the square",
      "Low-key Greek comfort food",
    ],

    transport:
      "Livadeia works best as a practical stop. Keep your stay central and movement short. The city improves when you treat it efficiently.",

    accommodation:
      "Town-centre stay is the obvious answer. There is no upside in complicating this one.",
  },

  agrinio: {
    cityId: "agrinio",
    name: "Agrinio",
    country: "Greece",

    overview:
      "Agrinio is a committed domestic-football stop rather than a marquee Greek weekend. That sounds harsh, but it is accurate. The point here is a proper local-feel football base, a manageable central stay, and a city that does the basics well enough if you stop pretending it should be a giant tourism product.",

    topThings: [
      {
        title: "Central square walk",
        tip: "Good for orientation and an easy first loop, not for hours of forced wandering.",
      },
      {
        title: "Panetolikos matchday block",
        tip: "This is the main reason most people will be here, so anchor the trip around it.",
      },
      {
        title: "Town-centre café session",
        tip: "Agrinio works better when you accept its slower rhythm.",
      },
      {
        title: "Local market streets",
        tip: "Useful for a bit of everyday-city texture, not for headline attractions.",
      },
      {
        title: "Simple evening taverna dinner",
        tip: "Best kept local and unfussy.",
      },
      {
        title: "Neighbourhood wander",
        tip: "Enough for an hour or so, then move on with your day.",
      },
      {
        title: "Regional route stop",
        tip: "Works better if you are building a broader western Greece itinerary.",
      },
      {
        title: "Pre-match central lunch",
        tip: "Easy, practical and usually the smartest use of the day.",
      },
      {
        title: "Relaxed overnight stop",
        tip: "Agrinio is strongest when used cleanly rather than overworked.",
      },
      {
        title: "One-night football coverage trip",
        tip: "That is the right scale for most visitors.",
      },
    ],

    tips: [
      "Better as a football-first stop than as a pure tourism weekend.",
      "Keep the stay central and practical.",
      "One night is enough for most users.",
      "Works best within a wider Greece route.",
      "Do not oversell the city and the trip becomes cleaner immediately.",
    ],

    food: [
      "Central tavernas",
      "Simple grills",
      "Casual cafés",
      "Straightforward Greek home-style food",
    ],

    transport:
      "Agrinio is easiest when treated as a compact overnight stop. Keep everything near the centre and avoid unnecessary movement.",

    accommodation:
      "Town centre is the right base. This is a practicality-first stay.",
  },

  larissa: {
    cityId: "larissa",
    name: "Larissa",
    country: "Greece",

    overview:
      "Larissa is stronger than the lower-hype Greek cities because it feels like a real, functioning regional city rather than just a football stop with a few cafés stuck to it. It is still not Athens or Thessaloniki, but it can absolutely work as a neat one- or two-night football trip if you build it around the centre, food, and the club rather than around fake sightseeing fluff.",

    topThings: [
      {
        title: "Central square and shopping streets",
        tip: "Best place to orient yourself quickly and keep the stay practical.",
      },
      {
        title: "Ancient theatre area",
        tip: "Worth including because it gives the city a bit more substance than some comparable stops.",
      },
      {
        title: "Pineios river walk",
        tip: "Good if you want a calm reset block without trying too hard.",
      },
      {
        title: "AEL matchday block",
        tip: "This is the football anchor, so build the day around it properly.",
      },
      {
        title: "Evening food in the centre",
        tip: "Larissa does straightforward city dining better than some of the smaller stops.",
      },
      {
        title: "Coffee culture stop",
        tip: "Useful because the city has enough everyday life to carry a relaxed few hours.",
      },
      {
        title: "Neighbourhood evening loop",
        tip: "Good for atmosphere, not for turning into a major attraction hunt.",
      },
      {
        title: "One polished dinner",
        tip: "A smart move if you are staying two nights rather than one.",
      },
      {
        title: "Regional rail or road break",
        tip: "Larissa also works well as a practical connector city.",
      },
      {
        title: "Short city-football weekend",
        tip: "This is the cleanest way to pitch it.",
      },
    ],

    tips: [
      "Larissa is one of the better non-glamour Greek football bases.",
      "Town centre is the obvious place to stay.",
      "One or two nights works well here.",
      "AEL plus central-city stay is the core product.",
      "Do not overcomplicate the trip; Larissa works because it is simple.",
    ],

    food: [
      "Town-centre tavernas",
      "Modern Greek casual dining",
      "Good local cafés",
      "Straightforward late dinners in the centre",
    ],

    transport:
      "Larissa is best used from a central stay. Once you are in the middle of the city, most of the useful trip becomes easy to manage.",

    accommodation:
      "Stay central. It gives you the best balance of food, walkability and matchday practicality.",
  },

  serres: {
    cityId: "serres",
    name: "Serres",
    country: "Greece",

    overview:
      "Serres is not a polished showcase destination, but it is a useful northern Greece football stop with a proper local feel. It works best when you sell it honestly: central stay, football-first, one-night practicality, and maybe part of a wider regional trip rather than a standalone luxury weekend.",

    topThings: [
      {
        title: "Town-centre walk",
        tip: "Enough for orientation and a decent local feel, not for a giant sightseeing day.",
      },
      {
        title: "Serres matchday block",
        tip: "The football is the main reason to be here, so do not pretend otherwise.",
      },
      {
        title: "Central café stop",
        tip: "Useful because the city suits slower pacing more than hard itinerary stacking.",
      },
      {
        title: "Local taverna dinner",
        tip: "Better kept simple and local than overplanned.",
      },
      {
        title: "Neighbourhood evening stroll",
        tip: "Good for atmosphere and decompression rather than attraction value.",
      },
      {
        title: "Regional stopover logic",
        tip: "Serres improves when used as part of a broader northern Greece route.",
      },
      {
        title: "Short central-market wander",
        tip: "Useful for everyday texture, not for headline tourism.",
      },
      {
        title: "Pre-match lunch in town",
        tip: "Easy win before heading to the ground.",
      },
      {
        title: "One-night football stop",
        tip: "That is the right product scale for most visitors.",
      },
      {
        title: "Northern Greece add-on base",
        tip: "Better when tied into a larger itinerary than when forced into a premium city-break frame.",
      },
    ],

    tips: [
      "This is a football-coverage stop, not a glamour product.",
      "Keep the stay central and low-friction.",
      "One night is enough for most users.",
      "Works best in a wider northern Greece route.",
      "Do not oversell the city and the trip becomes more useful immediately.",
    ],

    food: [
      "Simple town-centre tavernas",
      "Local grills",
      "Cafés and bakeries",
      "Low-key Greek comfort food",
    ],

    transport:
      "Serres works best when you keep everything central and practical. It is not a city that rewards overcomplication.",

    accommodation:
      "Town centre is the correct base. This is a clean overnight football stop.",
  },
};

export default superLeagueGreeceCityGuides;
