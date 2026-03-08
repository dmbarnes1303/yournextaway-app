// src/data/cityGuides/superLeagueGreece.ts
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
      "Athens is one of the best football-and-city-break combinations in Europe if you plan it properly. The winning formula is simple: stay central, treat the football as one anchor point in a wider city weekend, and don’t waste time zig-zagging across the city without purpose. Athens rewards neighbourhood-based planning far more than attraction-collecting chaos.",

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
        tip: "Worth it if you are doing Olympiacos or port-side dining, otherwise don’t force it.",
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
      "Street-food gyros, but don’t make every meal a shortcut meal",
      "Psyrri and Monastiraki for casual evening food clusters",
    ],

    transport:
      "Athens is manageable if you stay central. Metro covers the key visitor zones and makes most football movement straightforward. Taxis can be useful, but central traffic can waste time fast. Walking between Syntagma, Plaka, Monastiraki, Psyrri and parts of Kolonaki is often the smartest move.",

    accommodation:
      "Syntagma is the best all-round base. Plaka is ideal if you want classic postcard Athens. Monastiraki and Psyrri are strongest for nightlife and food. Kolonaki is better for a more polished, quieter stay. Unless your entire trip is football-only, don’t stay out by the stadium districts.",
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
        title: "Toumba or Aris matchday build-up",
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
        tip: "Low-key and local usually beats trying to force a polished ‘city-break’ evening.",
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

  lamia: {
    cityId: "lamia",
    name: "Lamia",
    country: "Greece",

    overview:
      "Lamia is a functional football location rather than a premium football-weekend destination. That does not make it useless. It makes it a specialist stop: good for league coverage, good for a practical overnight, and good if you understand it is a route stop rather than a showcase city. Get that framing right and it does the job.",

    topThings: [
      {
        title: "Town-centre walk",
        tip: "Enough for basic orientation and an easy couple of hours.",
      },
      {
        title: "Castle viewpoint area",
        tip: "Useful if you want one simple elevated look at the town.",
      },
      {
        title: "Central café stop",
        tip: "The sort of place where slowing down works better than chasing activities.",
      },
      {
        title: "Local taverna dinner",
        tip: "Keep it simple and practical rather than hunting for a ‘special occasion’ scene.",
      },
      {
        title: "Lamia matchday block",
        tip: "The football is the point here.",
      },
      {
        title: "Road or rail stopover",
        tip: "Best used as a connector in a wider trip rather than a destination centerpiece.",
      },
      {
        title: "Short overnight break",
        tip: "Treat it as a clean stop, not a deep urban experience.",
      },
      {
        title: "Regional route planning",
        tip: "The city’s usefulness is logistical more than cultural.",
      },
      {
        title: "Neighbourhood stroll",
        tip: "Good for low-effort decompression, not bucket-list tourism.",
      },
      {
        title: "Pre-match town-centre meal",
        tip: "One decent meal and one night is often enough here.",
      },
    ],

    tips: [
      "Useful, practical, not glamorous.",
      "Works best as a football stop or wider-route sleepover.",
      "Do not oversell it and do not overbuild the itinerary.",
      "Town-centre stay is the obvious choice.",
      "One night is usually enough unless the wider trip dictates otherwise.",
    ],

    food: [
      "Simple tavernas",
      "Local grills",
      "Cafés around the centre",
      "Low-key Greek comfort food",
    ],

    transport:
      "Lamia is a logistics-first stop. Once there, keep the stay compact and central.",

    accommodation:
      "Stay centrally and do not overthink it. This is about practicality.",
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
};

export default superLeagueGreeceCityGuides;
