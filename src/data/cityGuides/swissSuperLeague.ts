import type { CityGuide } from "./types";

const GYG = {
  bern: "https://www.getyourguide.com/en-gb/bern-l52/?partner_id=MAQJREP&utm_medium=online_publisher",
  basel: "https://www.getyourguide.com/en-gb/basel-l51/?partner_id=MAQJREP&utm_medium=online_publisher",
  zurich: "https://www.getyourguide.com/en-gb/zurich-l55/?partner_id=MAQJREP&utm_medium=online_publisher",
  geneva: "https://www.getyourguide.com/en-gb/geneva-l54/?partner_id=MAQJREP&utm_medium=online_publisher",
  lausanne: "https://www.getyourguide.com/en-gb/lausanne-l463/?partner_id=MAQJREP&utm_medium=online_publisher",
  lugano: "https://www.getyourguide.com/en-gb/lugano-l2528/?partner_id=MAQJREP&utm_medium=online_publisher",
  "st-gallen":
    "https://www.getyourguide.com/en-gb/st-gallen-l1536/?partner_id=MAQJREP&utm_medium=online_publisher",
  lucerne: "https://www.getyourguide.com/en-gb/lucerne-l867/?partner_id=MAQJREP&utm_medium=online_publisher",
  winterthur:
    "https://www.getyourguide.com/en-gb/winterthur-l1763/?partner_id=MAQJREP&utm_medium=online_publisher",
  sion: "https://www.getyourguide.com/en-gb/sion-l1467/?partner_id=MAQJREP&utm_medium=online_publisher",
  thun: "https://www.getyourguide.com/en-gb/thun-l1753/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const swissSuperLeagueCityGuides: Record<string, CityGuide> = {
  bern: {
    cityId: "bern",
    name: "Bern",
    country: "Switzerland",
    thingsToDoUrl: GYG.bern,
    overview:
      "Bern is one of the cleanest football city-break products in the whole app: compact old town, strong rail practicality, very little urban friction, and a stadium trip that is easy without killing the rest of the weekend. It is not a chaotic nightlife city, and that is exactly why it works so well for a football-first neutral traveller.",
    topThings: [
      { title: "Altstadt wander", tip: "This is the obvious starting point and still the right one. Bern works best on foot." },
      { title: "Zytglogge area", tip: "Good for orientation, not for overcommitting half the day." },
      { title: "Aare river viewpoints", tip: "One of the best free visual payoffs in the city." },
      { title: "Bear Park", tip: "Worth doing if you are already walking the river route, not as a standalone mission." },
      { title: "Rosengarten", tip: "Go for the city view rather than pretending the garden itself is the whole attraction." },
      { title: "Arcade shopping streets", tip: "Best used as part of a slow city circuit rather than a retail mission." },
      { title: "Young Boys matchday trip", tip: "Central Bern to Wankdorf is easy enough that there is no excuse for bad planning." },
      { title: "Old-town dinner", tip: "A strong move for the night before or after the match." },
      { title: "Short rail-based Swiss base", tip: "Bern works brilliantly if you are combining more than one city." },
      { title: "Aare-side coffee stop", tip: "Exactly the kind of low-friction pause that suits this city." },
    ],
    tips: [
      "Stay central, not near the ground.",
      "Bern is one of the easiest walking cities in the project.",
      "This is a football-plus-old-town weekend, not a giant nightlife trip.",
      "Rail links make Bern an excellent wider Swiss base.",
      "One or two nights is the sweet spot.",
    ],
    food: [
      "Old-town Swiss brasseries",
      "Riverside cafés",
      "Classic fondue or rösti if you want the obvious Swiss meal",
      "Low-key wine bars and relaxed evening dining",
    ],
    transport:
      "Bern is extremely manageable. Stay central, walk most of the city, and use local rail/tram only when needed. Wankdorf access is simple enough that the city-to-stadium move should feel routine, not stressful.",
    accommodation:
      "Altstadt is the best overall base. Around Hauptbahnhof is the best practical base if you are rail-heavy. There is very little upside in staying near the stadium district.",
  },

  basel: {
    cityId: "basel",
    name: "Basel",
    country: "Switzerland",
    thingsToDoUrl: GYG.basel,
    overview:
      "Basel is one of the strongest all-round football city breaks in the app: compact centre, easy airport access, proper football relevance, and a city that feels high quality without being stiff. If you want a clean Swiss weekend with real matchday value, Basel is near the front of the queue.",
    topThings: [
      { title: "Altstadt loop", tip: "The core city walk is one of the easiest wins in Swiss travel." },
      { title: "Rhine river walk", tip: "Best in decent weather and one of the main reasons Basel feels so easy." },
      { title: "Münster area", tip: "Good visual anchor and worth pairing with the old-town route." },
      { title: "Kleinbasel evening", tip: "Useful if you want a slightly less polished, more social vibe." },
      { title: "Museum stop", tip: "Basel has real museum depth, but pick one and stop being greedy." },
      { title: "Market Square", tip: "Best used as a route marker rather than a time sink." },
      { title: "Basel matchday block", tip: "One of the better Swiss big-club products because the city adds real value." },
      { title: "Rhine-side dinner", tip: "A good polished evening move." },
      { title: "Cross-border trip logic", tip: "Basel is useful if you are thinking wider than one city." },
      { title: "Station-area practical base", tip: "Less romantic than Altstadt, but extremely functional." },
    ],
    tips: [
      "Central Basel is the correct base for almost everyone.",
      "This is one of the best pure city-and-football pairings in Switzerland.",
      "You do not need to overcomplicate the itinerary here.",
      "Altstadt beats stadium-adjacent staying by a mile.",
      "Basel is very easy to run as a one- or two-night trip.",
    ],
    food: [
      "Rhine-side restaurants",
      "Classic Swiss/French-influenced dining",
      "Old-town cafés",
      "Better-value local spots slightly outside the most obvious core",
    ],
    transport:
      "Basel is simple. The centre is compact, the airport access is good, and St. Jakob is easy enough to reach without turning matchday into a military operation.",
    accommodation:
      "Altstadt is the best all-round option. Basel SBB area is best if you value airport and rail ease over charm. Do not choose the stadium area unless you are making a weirdly logistics-only trip.",
  },

  zurich: {
    cityId: "zurich",
    name: "Zurich",
    country: "Switzerland",
    thingsToDoUrl: GYG.zurich,
    overview:
      "Zurich is one of the best pure football-plus-city products in the whole database. It has proper city-break weight, strong transport, good nightlife, and two clubs sharing one stadium, which gives the city extra football utility. It is expensive, yes, but the quality is real.",
    topThings: [
      { title: "Altstadt walk", tip: "Still the foundation of the trip. Zurich is best when you keep the city core simple." },
      { title: "Lakefront route", tip: "One of the highest-value low-effort city activities in Switzerland." },
      { title: "Bahnhofstrasse and central core", tip: "Useful for orientation, not for pretending shopping is your culture plan." },
      { title: "Langstrasse evening", tip: "Best if you want nightlife and a less polished atmosphere." },
      { title: "Niederdorf bars", tip: "Good for a more classic central evening." },
      { title: "Grossmünster / river area", tip: "Works well folded into a central walking loop." },
      { title: "Letzigrund matchday", tip: "Easy enough from central Zurich that there is no excuse for turning up late and flustered." },
      { title: "Day-trip flexibility", tip: "Zurich is a great rail hub if you are planning wider movement." },
      { title: "Lake-view coffee or lunch", tip: "Very Zurich, very easy, very worth it." },
      { title: "Neighbourhood-based evening", tip: "Pick one area and stay in it instead of zig-zagging pointlessly." },
    ],
    tips: [
      "Zurich is expensive, so build smarter rather than pretending prices are fine.",
      "City centre or Langstrasse/Kreis 4 are the strongest bases.",
      "This is a top-tier city-break product with football added, not the other way round.",
      "Letzigrund is easy to reach from central areas.",
      "Works brilliantly for FC Zurich and Grasshoppers.",
    ],
    food: [
      "Central Zurich brasseries",
      "Lakefront dining if you want one polished evening",
      "Kreis 4 / Langstrasse for a more varied and lively food scene",
      "Smart-casual cafés and bars rather than ultra-cheap options",
    ],
    transport:
      "Zurich is one of the easiest cities in Europe to move around if you are not lazy or stupid about it. Public transport is excellent, the centre is walkable, and Letzigrund is a simple scheduled stadium trip.",
    accommodation:
      "Altstadt / city centre is the classic choice. Langstrasse / Kreis 4 is better for nightlife and more local energy. Near Zürich HB is the most practical if you are rail-heavy.",
  },

  geneva: {
    cityId: "geneva",
    name: "Geneva",
    country: "Switzerland",
    thingsToDoUrl: GYG.geneva,
    overview:
      "Geneva is polished, efficient, expensive, and easy. That is the truth. It is not the rawest football city in the app, but it is a very strong city-break base if you want clean logistics, comfort, and an easy Servette trip without chaos.",
    topThings: [
      { title: "Lake Geneva waterfront", tip: "A core part of the trip, not an optional extra." },
      { title: "Old Town", tip: "Best for slower walking and a more classic Geneva feel." },
      { title: "Jet d’Eau area", tip: "Do it, see it, move on. Do not pretend it needs half your day." },
      { title: "Pâquis district", tip: "Better food value and more life than the most obvious polished zones." },
      { title: "Cornavin-centred practicality", tip: "Very good if your trip is rail and airport driven." },
      { title: "Servette matchday", tip: "A simple stadium move from central Geneva if you do not overcomplicate it." },
      { title: "UN / international district", tip: "Only if that genuinely interests you. Otherwise skip the obligation tourism." },
      { title: "Lakefront dinner", tip: "A good polished evening play if budget allows." },
      { title: "Old-town coffee stop", tip: "Good lower-tempo break during the day." },
      { title: "Short Swiss-French route base", tip: "Geneva works well as a wider-movement base too." },
    ],
    tips: [
      "Geneva is expensive, so budget honestly.",
      "This is a polished city-trip football product, not a hardcore atmosphere-first trip.",
      "Cornavin and the centre are the most practical bases.",
      "Servette works best when folded into a wider Geneva weekend.",
      "Lakefront and old-town balance is the right city formula.",
    ],
    food: [
      "Lakefront dining",
      "Pâquis for better-value casual food",
      "Old-town restaurants",
      "Smart central cafés and brasseries",
    ],
    transport:
      "Geneva is easy. Cornavin is your practical hub, the centre is straightforward, and the stadium trip is simple if you leave on time.",
    accommodation:
      "City centre / Cornavin is the most practical base. Old Town or lakefront is better if you want a more premium scenic stay. Do not stay by the stadium just to save a few minutes on matchday.",
  },

  lausanne: {
    cityId: "lausanne",
    name: "Lausanne",
    country: "Switzerland",
    thingsToDoUrl: GYG.lausanne,
    overview:
      "Lausanne is stronger than the club alone would suggest. That is the correct reading. The lake setting, the steep city layout, and the general quality of the place make it a very good football-plus-scenery weekend, even if Lausanne-Sport are not one of the league’s giant institutions.",
    topThings: [
      { title: "Ouchy lakefront", tip: "One of the main reasons to come. Do not skip it." },
      { title: "Old Town / cathedral area", tip: "Best higher-ground historic section and worth pairing with the lake." },
      { title: "Terraced city walks", tip: "Lausanne is hilly, so plan accordingly instead of whining later." },
      { title: "Lausanne matchday block", tip: "Works well because the city has more value than the club’s weight alone suggests." },
      { title: "Lake-view meal", tip: "A strong polished evening option." },
      { title: "Station-to-centre route", tip: "Useful to understand early because the city’s layout is not flat and obvious." },
      { title: "Museum stop", tip: "Lausanne has enough quality for this if you have time, but do not force it." },
      { title: "Short rail-link base", tip: "Good if you are combining multiple Swiss stops." },
      { title: "Coffee in the upper town", tip: "A good slower travel move." },
      { title: "Simple two-night city break", tip: "That is the cleanest way to frame Lausanne." },
    ],
    tips: [
      "Lausanne is hilly, so stop planning it like a flat city.",
      "Centre or Ouchy are the strongest bases.",
      "This is a city-break-first football product.",
      "Very good for scenic value and slower weekends.",
      "The club may be smaller, but the trip quality is still high.",
    ],
    food: [
      "Lakefront dining in Ouchy",
      "Old-town cafés",
      "Smart casual Swiss/French restaurants",
      "Wine-led evenings rather than huge nightlife energy",
    ],
    transport:
      "Lausanne is very workable, but you need to respect the slopes and plan accordingly. Public transport does the heavy lifting well, and the stadium move is simple if scheduled properly.",
    accommodation:
      "Centre is the best practical base. Ouchy is the best scenic base. Choose based on whether you want easier city movement or stronger lake atmosphere.",
  },

  lugano: {
    cityId: "lugano",
    name: "Lugano",
    country: "Switzerland",
    thingsToDoUrl: GYG.lugano,
    overview:
      "Lugano is one of the best pure scenery-plus-football products in the app. If you want a Swiss football weekend that actually feels like a leisure trip and not just a match mission, Lugano is a serious option. The city has real destination value.",
    topThings: [
      { title: "Lakefront walk", tip: "Core activity, obvious for a reason." },
      { title: "Piazza della Riforma area", tip: "Good central anchor for food, coffee and evening movement." },
      { title: "Parco Ciani", tip: "A very high-value low-effort stop." },
      { title: "Old centre stroll", tip: "Enough for a good wander without pretending it is endless." },
      { title: "Lugano matchday", tip: "Works because the city itself already justifies the weekend." },
      { title: "Viewpoint or funicular add-on", tip: "Worth it if weather is good and you actually have time." },
      { title: "Lakefront dinner", tip: "One of the better polished football-trip evenings in the database." },
      { title: "Relaxed coffee culture", tip: "Exactly the kind of city where that matters." },
      { title: "Italian-influenced food stop", tip: "A major part of the city’s value." },
      { title: "Longer scenic weekend", tip: "Lugano benefits more than most from adding an extra day." },
    ],
    tips: [
      "This is a scenery-led football weekend and should be sold that way.",
      "Centre or lakefront are the obvious bases.",
      "Lugano is one of the app’s best football-plus-leisure products.",
      "Do not undersell the destination by making it sound like just another league stop.",
      "A two-night stay makes more sense than a rushed overnight.",
    ],
    food: [
      "Italian-influenced lakefront dining",
      "Central piazza restaurants",
      "Coffee-and-pastry stops",
      "Polished evening meals with a strong scenic setting",
    ],
    transport:
      "Lugano is easy if you stay central. The city is compact enough for low-friction movement, and the stadium trip is straightforward without dominating the day.",
    accommodation:
      "Lugano Centre is the best all-round base. Lakefront is the premium scenic option. Do not stay out by the stadium unless you want a worse version of the trip.",
  },

  "st-gallen": {
    cityId: "st-gallen",
    name: "St. Gallen",
    country: "Switzerland",
    thingsToDoUrl: GYG["st-gallen"],
    overview:
      "St. Gallen is one of the better smaller-city football trips in Switzerland because the town itself is attractive enough to matter. It is not a giant urban break, but it is exactly the kind of tidy overnight football city that works well in the app.",
    topThings: [
      { title: "Old Town walk", tip: "The best part of the city and the first thing you should do." },
      { title: "Abbey district", tip: "Worth it for the historic texture and city identity." },
      { title: "Station-to-centre loop", tip: "A practical way to understand the place quickly." },
      { title: "St. Gallen matchday", tip: "A clean football stop with a stronger city setting than people expect." },
      { title: "Old-town dinner", tip: "The obvious and correct evening move." },
      { title: "Coffee and pastry stop", tip: "This city suits lower-tempo travel." },
      { title: "Kybunpark trip", tip: "Simple enough from the centre if you stop acting like every stadium move is complicated." },
      { title: "Short overnight football break", tip: "This is the ideal frame for St. Gallen." },
      { title: "Station-led regional base", tip: "Useful if you are chaining cities." },
      { title: "Historic-core browsing", tip: "Good for an easy afternoon, not for fake itinerary padding." },
    ],
    tips: [
      "Best as a simple overnight or one-and-a-half-day trip.",
      "Old Town is the strongest base.",
      "This is a tidy football city, not a giant nightlife destination.",
      "The city quality is what lifts the football product.",
      "Keep the whole trip compact and it works very well.",
    ],
    food: [
      "Old-town restaurants",
      "Relaxed cafés",
      "Simple Swiss dining",
      "Station-adjacent practical meals if moving on quickly",
    ],
    transport:
      "St. Gallen is easy if you stay central or near the station. The stadium move is not hard, and the city is small enough to keep everything low-friction.",
    accommodation:
      "Old Town is the best character base. Near the station is best if you value rail practicality. Both work.",
  },

  lucerne: {
    cityId: "lucerne",
    name: "Lucerne",
    country: "Switzerland",
    thingsToDoUrl: GYG.lucerne,
    overview:
      "Lucerne is one of the best scenic football city breaks in the entire wider coverage map. The football alone is not why the product works. The product works because Lucerne is beautiful, compact, and easy to enjoy even before the match starts.",
    topThings: [
      { title: "Lakefront walk", tip: "Essential, not optional." },
      { title: "Kapellbrücke area", tip: "Touristy, yes. Still worth doing." },
      { title: "Old Town wander", tip: "Exactly the kind of compact central experience that works on a football weekend." },
      { title: "Lucerne matchday", tip: "Best treated as one strong block in a wider scenic city break." },
      { title: "Lake-view dinner", tip: "A major part of the appeal here." },
      { title: "Boat or short scenic ride", tip: "Worth it if the weather behaves and you have spare time." },
      { title: "Station-to-old-town route", tip: "Useful to understand early because it frames the whole trip." },
      { title: "Morning coffee by the water", tip: "One of the cleanest easy wins in the app." },
      { title: "Swiss scenic weekend base", tip: "Lucerne is strong enough to justify a longer stay than the club alone might suggest." },
      { title: "Simple old-town evening", tip: "Good if you want lower-friction quality rather than chaos." },
    ],
    tips: [
      "One of the best scenic football city breaks in the app.",
      "Altstadt or lakefront are the strongest bases.",
      "This is a football-plus-leisure product first.",
      "Better as a two-night trip than a rushed overnight.",
      "Do not undersell Lucerne just because the club is not a giant.",
    ],
    food: [
      "Lakefront dining",
      "Old-town Swiss restaurants",
      "Coffee-and-cake stops",
      "Relaxed evening meals rather than hard nightlife",
    ],
    transport:
      "Lucerne is easy. Stay central, walk most of the trip, and make the stadium move as one simple scheduled journey.",
    accommodation:
      "Altstadt is the best classic base. Lakefront is the premium scenic option. Near the station is the best practical one if you are moving around Switzerland.",
  },

  winterthur: {
    cityId: "winterthur",
    name: "Winterthur",
    country: "Switzerland",
    thingsToDoUrl: GYG.winterthur,
    overview:
      "Winterthur is not a marquee Swiss football weekend by itself. That is the truth. Its value comes from practicality, smaller-ground football character, and its position inside the wider Zurich orbit. Used properly, it works. Oversold, it becomes stupid.",
    topThings: [
      { title: "Compact centre walk", tip: "Useful and pleasant, but do not pretend it is endless." },
      { title: "Small-city coffee stop", tip: "The place suits lower-key travel." },
      { title: "Schützenwiese matchday", tip: "The ground is the main reason a football traveller comes here." },
      { title: "Zurich-based side trip", tip: "Often the smarter way to frame Winterthur." },
      { title: "Simple local dinner", tip: "A clean easy evening move." },
      { title: "Short overnight stop", tip: "Best if you are keeping the whole itinerary efficient." },
      { title: "Rail-linked practical weekend", tip: "The regional transport setup is what keeps the product viable." },
      { title: "Town-centre pre-match", tip: "Enough for a low-key build-up." },
      { title: "Smaller-ground football experience", tip: "This is the actual selling point." },
      { title: "Zurich return option", tip: "Very sensible if you want the stronger city base." },
    ],
    tips: [
      "Best as a Zurich-based trip or a short practical stop.",
      "This is a football stop, not a flagship luxury weekend.",
      "The smaller-ground character is the appeal.",
      "Do not force too much itinerary into Winterthur itself.",
      "Use the regional links intelligently.",
    ],
    food: [
      "Simple central restaurants",
      "Casual cafés",
      "Low-key local dining rather than destination food tourism",
    ],
    transport:
      "Winterthur works because Zurich is close and the rail connections are good. Treat it as a practical football move, not as a grand standalone city-production.",
    accommodation:
      "Winterthur Centre is the simple local base. Zurich is the better wider base if you want a stronger overall weekend.",
  },

  sion: {
    cityId: "sion",
    name: "Sion",
    country: "Switzerland",
    thingsToDoUrl: GYG.sion,
    overview:
      "Sion is niche, scenic, and much better when treated as part of a wider Alpine or Rhône Valley itinerary than as a random one-off. The football product is not huge-club glamour. The value is the setting and the fact it feels like a genuinely different Swiss trip.",
    topThings: [
      { title: "Old Town walk", tip: "The best way to understand why Sion is worth the stop." },
      { title: "Castle hill viewpoints", tip: "Worth it for the visual payoff and city identity." },
      { title: "Wine-region atmosphere", tip: "Part of the broader city appeal if you are staying properly." },
      { title: "Sion matchday", tip: "A good football block inside a scenic Swiss route." },
      { title: "Historic-core dinner", tip: "Best low-friction evening move." },
      { title: "Station-to-old-town route", tip: "Useful for keeping the trip simple." },
      { title: "Alpine-base add-on", tip: "A big part of why Sion makes sense in the app." },
      { title: "Old-town coffee stop", tip: "Good for lower-tempo travel." },
      { title: "Short scenic overnight", tip: "Probably the right frame for most users." },
      { title: "Regional itinerary logic", tip: "Sion improves when it is part of something bigger." },
    ],
    tips: [
      "This is a scenic football stop, not a mainstream big-club weekend.",
      "Old Town or centre are the obvious bases.",
      "Works well in a wider Swiss itinerary.",
      "The setting is what lifts the product.",
      "Do not try to sell it as Zurich with mountains.",
    ],
    food: [
      "Historic-core dining",
      "Wine-bar style evenings",
      "Simple Swiss/French regional meals",
      "Relaxed cafés",
    ],
    transport:
      "Sion is workable if you stay central and keep the whole trip compact. The bigger challenge is reaching the city inside a wider itinerary, not moving around once you are there.",
    accommodation:
      "Centre and Old Town are both strong. Choose based on whether you want ease or more atmospheric historic setting.",
  },

  thun: {
    cityId: "thun",
    name: "Thun",
    country: "Switzerland",
    thingsToDoUrl: GYG.thun,
    overview:
      "Thun is another Swiss trip where the setting matters heavily. It is not a giant atmosphere club destination, but it is a very good scenic football stop if you want lakes, mountains, and a clean relaxed match weekend. That is the right way to position it.",
    topThings: [
      { title: "Lakefront walk", tip: "One of the best reasons to do the trip at all." },
      { title: "Old Town and elevated streets", tip: "Compact, scenic and easy to pair with the lake." },
      { title: "Castle area", tip: "Good for views and obvious town identity." },
      { title: "Thun matchday", tip: "Best framed as one part of a wider scenic Swiss weekend." },
      { title: "Lake or riverfront dinner", tip: "Strong easy evening move." },
      { title: "Bern-linked travel option", tip: "Very useful if you are not basing entirely in Thun." },
      { title: "Scenic overnight break", tip: "That is the natural sweet spot for the city." },
      { title: "Old-town coffee stop", tip: "Exactly the kind of thing that works here." },
      { title: "Short station-to-centre loop", tip: "Useful for orienting the whole trip." },
      { title: "Swiss lakes-and-mountains add-on", tip: "The bigger setting is what gives Thun extra value." },
    ],
    tips: [
      "This is a scenic football stop, not a major crowd-intensity trip.",
      "Thun Centre is the strongest local base.",
      "Bern can also work as the wider base.",
      "The city’s visual setting does a lot of the heavy lifting.",
      "Best for travellers who want football folded into a broader Swiss leisure weekend.",
    ],
    food: [
      "Lakefront dining",
      "Old-town restaurants",
      "Relaxed Swiss evening meals",
      "Casual cafés with scenic value",
    ],
    transport:
      "Thun is easy if you stay central. Bern also gives you a broader practical base if you want a more connected trip and only come into Thun for the match or one overnight.",
    accommodation:
      "Thun Centre is best if you want the local scenic version of the trip. Bern is best if you want stronger transport and wider city-break options.",
  },
};

export default swissSuperLeagueCityGuides;
