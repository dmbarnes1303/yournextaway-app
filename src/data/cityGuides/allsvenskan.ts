import type { CityGuide } from "./types";

const GYG = {
  stockholm:
    "https://www.getyourguide.com/en-gb/stockholm-l50/?partner_id=MAQJREP&utm_medium=online_publisher",
  gothenburg:
    "https://www.getyourguide.com/en-gb/gothenburg-l479/?partner_id=MAQJREP&utm_medium=online_publisher",
  malmo:
    "https://www.getyourguide.com/en-gb/malmo-l1528/?partner_id=MAQJREP&utm_medium=online_publisher",
  uppsala:
    "https://www.getyourguide.com/en-gb/uppsala-l32380/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const allsvenskanCityGuides: Record<string, CityGuide> = {
  stockholm: {
    cityId: "stockholm",
    name: "Stockholm",
    country: "Sweden",
    thingsToDoUrl: GYG.stockholm,
    overview:
      "Stockholm is one of the strongest football-and-city-break combinations in the whole app because it gives you multiple real club experiences inside one proper capital. AIK, Djurgården, Hammarby, and Brommapojkarna all pull the city in slightly different directions, but the winning travel formula stays the same: base centrally or in Södermalm, use the metro and commuter rail properly, and plan by district rather than trying to pinball across the whole city. If you do that, Stockholm feels premium rather than sprawling.",

    topThings: [
      { title: "Gamla Stan walk", tip: "Go early morning or later evening. Midday crowds blunt the charm fast." },
      { title: "Södermalm bars and cafés", tip: "Best all-round football-weekend district if nightlife matters and you want an easy 3Arena route." },
      { title: "Djurgården museum island", tip: "Pick one or two things and stop there. Trying to clear the whole island is amateur planning." },
      { title: "Monteliusvägen viewpoint", tip: "Short walk, big payoff, especially around sunset." },
      { title: "Vasa Museum", tip: "One of the few obvious tourist picks that is actually worth the time." },
      { title: "Östermalm food stop", tip: "Use it when you want a cleaner, more polished dinner than pure pub food." },
      { title: "Stockholm archipelago short boat trip", tip: "Great in good weather, pointless if rushed or badly timed." },
      { title: "Solna pre-match route", tip: "For AIK, treat Strawberry Arena as a clean transport move from central Stockholm rather than a separate overnight base." },
      { title: "3Arena pre-match block", tip: "For Djurgården or Hammarby, start in Södermalm and move south later rather than camping near the ground too early." },
      { title: "Post-match district reset", tip: "After full-time, leave the immediate stadium zone and continue the night centrally." },
    ],

    tips: [
      "Central Stockholm or Södermalm are the strongest bases nearly every time.",
      "Stockholm derbies are the premium Allsvenskan trip if you can get them.",
      "Do not stay in Solna purely for stadium proximity unless the price difference is massive.",
      "Public transport is good enough that overusing taxis is usually a stupid waste of money.",
      "The city is spread out enough that one main district per time block is the smart move.",
    ],

    food: [
      "Classic Swedish meatballs in a proper sit-down restaurant",
      "Södermalm wine bars and small plates",
      "Casual burger spots before the match",
      "Seafood if you want a more polished dinner",
      "Late-night kebab or fast casual after the game",
    ],

    transport:
      "Stockholm’s metro, commuter rail, and tram network are strong enough that most football travel problems are solved before they start if you use them properly. 3Arena is easy from the southern transport spine, Strawberry Arena is a simple Solna move, and central Stockholm remains the right anchor for almost everything.",

    accommodation:
      "Norrmalm works best for rail convenience and central access. Södermalm is the strongest football-weekend base if nightlife and easy 3Arena access matter. Solna is only worth prioritising if you are going to AIK and value pure ground convenience over a better overall city stay.",
  },

  gothenburg: {
    cityId: "gothenburg",
    name: "Gothenburg",
    country: "Sweden",
    thingsToDoUrl: GYG.gothenburg,
    overview:
      "Gothenburg is one of the easiest football weekends in Scandinavia because the city, bars, trams, and stadium geography all work with you rather than against you. It also has real football depth: IFK Göteborg, GAIS, ÖIS, and Häcken give you multiple club identities inside one trip. The practical formula is simple: stay central, use the tram network, and treat Gamla Ullevi as part of the city centre rather than as a separate matchday project.",

    topThings: [
      { title: "Avenyn and adjacent streets", tip: "Best if you want a livelier evening base without having to think too hard." },
      { title: "Haga district", tip: "Go in daylight for cafés, pastries, and a slower pace before the football intensity." },
      { title: "Canal and city-centre walk", tip: "Fastest way to understand the layout without wasting energy." },
      { title: "Feskekôrka area", tip: "Useful if seafood is part of the plan and you want something more city-specific." },
      { title: "Skansen Kronan viewpoint", tip: "Short climb, worthwhile payoff, especially in clear weather." },
      { title: "Liseberg surroundings", tip: "Good visual anchor even if you are not doing the park itself." },
      { title: "Lindholmen waterfront", tip: "A calmer add-on if you want a less obvious slice of the city." },
      { title: "Pre-match central pub session", tip: "Better than trying to force the whole day around the stadium footprint." },
      { title: "Gamla Ullevi arrival walk", tip: "The central approach is part of why this city works so well for football weekends." },
      { title: "Post-match city-centre dinner", tip: "Stay central and keep the evening alive instead of rushing straight into transport queues." },
    ],

    tips: [
      "Central Gothenburg is almost always the right base.",
      "Gamla Ullevi is one of the easiest stadiums in the whole app to build a weekend around.",
      "Do not stay out on Hisingen for Häcken unless you are saving serious money.",
      "The tram network solves most movement problems quickly and cheaply.",
      "Gothenburg is better as a full football weekend than a rushed same-day hit-and-run.",
    ],

    food: [
      "Seafood and shellfish if you want a city-specific dinner",
      "Proper burgers and craft beer",
      "Avenyn restaurants for a more polished evening",
      "Casual pre-match pub food",
      "Coffee and pastries in Haga during the day",
    ],

    transport:
      "Gothenburg’s tram system is the backbone and makes the city very low-friction. Gamla Ullevi is central enough to handle on foot from many hotels. Häcken’s ground is less central, but still easy if you start from a central base rather than trying to over-optimise around Hisingen.",

    accommodation:
      "Stay in Central Gothenburg or around Avenyn for the cleanest mix of nightlife, restaurants, and matchday convenience. Haga is good if you want a calmer feel. Avoid overcomplicating the trip by chasing peripheral hotels unless the saving is substantial.",
  },

  malmo: {
    cityId: "malmo",
    name: "Malmö",
    country: "Sweden",
    thingsToDoUrl: GYG.malmo,
    overview:
      "Malmö is one of the strongest major-club trips in Sweden because the football matters, the city is easy, and the centre has enough nightlife and local character to carry the whole weekend. It is more compact and manageable than Stockholm, but still substantial enough to feel like a real break. If you want a Swedish football city that works without much effort, Malmö is near the top.",

    topThings: [
      { title: "Lilla Torg", tip: "Strong evening area, but better before it gets too obvious and crowded." },
      { title: "Triangeln district", tip: "Best practical base for football weekends thanks to transport and food options." },
      { title: "Turning Torso and waterfront walk", tip: "Worth doing once for the skyline and coastal reset." },
      { title: "Möllevången food scene", tip: "Best if you want something more local, better value, and less polished." },
      { title: "Ribersborg seafront", tip: "Good morning walk if you stayed out the night before." },
      { title: "Malmö Castle area", tip: "Decent daytime stop if you want some structure before food or football." },
      { title: "Old town centre wander", tip: "Compact and easy; ideal before settling into bars or dinner." },
      { title: "Pre-match central meal", tip: "Eat centrally, then head to the stadium rather than hovering around the ground too long." },
      { title: "Eleda Stadion approach", tip: "Arrive with time to spare; Malmö’s bigger games deserve proper rhythm." },
      { title: "Late-night central reset", tip: "Head back to central districts after full-time rather than ending the evening in the stadium zone." },
    ],

    tips: [
      "Triangeln or central Malmö are the strongest bases.",
      "Malmö is one of the easiest serious-club trips in the entire Swedish section.",
      "Book early for bigger fixtures because demand can jump quickly.",
      "The city is compact enough that walking solves more than people assume.",
      "Möllevången is often the better value food area than the more polished central strips.",
    ],

    food: [
      "Middle Eastern food around Möllevången",
      "Seafood if you want a cleaner coastal dinner feel",
      "Burgers and casual pre-match food centrally",
      "Lilla Torg sit-down restaurants",
      "Late-night fast food around the central core",
    ],

    transport:
      "Malmö is very walkable by big-city standards, with strong rail connectivity through Malmö Central and Triangeln. Eleda Stadion is simple enough to fold into a central stay without needing to over-engineer the route.",

    accommodation:
      "Triangeln is the smartest football base. Central Malmö also works very well, especially around Lilla Torg if nightlife matters. There is rarely a good reason to prioritise staying right by the stadium over staying in the better city districts.",
  },

  uppsala: {
    cityId: "uppsala",
    name: "Uppsala",
    country: "Sweden",
    thingsToDoUrl: GYG.uppsala,
    overview:
      "Uppsala is ideal for a clean one-night football trip. It is compact, attractive, easy on foot, and simple enough that you do not waste half the weekend on logistics. If you want a Swedish football break with very little friction and a city that still feels distinct, Uppsala is one of the better options.",

    topThings: [
      { title: "Uppsala Cathedral", tip: "The obvious landmark, but worth it because it genuinely dominates the city." },
      { title: "Castle and viewpoint area", tip: "Good short stop for photos and city context." },
      { title: "Fyrisån riverside walk", tip: "Best easy low-effort wander before food or after coffee." },
      { title: "University quarter", tip: "The academic atmosphere is part of what makes Uppsala feel different." },
      { title: "Botanical Garden", tip: "Useful in good weather if you want a calmer daytime block." },
      { title: "City-centre restaurant loop", tip: "Book once properly instead of drifting and ending up somewhere average." },
      { title: "Station area convenience run", tip: "Good for logistics, not where you should spend the whole day." },
      { title: "Pre-match central café or bar", tip: "The whole city is compact enough that there is no need to overplan." },
      { title: "Studenternas IP approach", tip: "Build in a little walking time and let the city-to-stadium move happen naturally." },
      { title: "Post-match central drink", tip: "One of the easiest cities in the app for carrying the evening on after full-time." },
    ],

    tips: [
      "Stay in the city centre or near the station and keep everything walkable.",
      "Uppsala works best when you do not overcomplicate it.",
      "Studenternas IP is part of a very manageable football day.",
      "This is a good trip for solo travellers because the city is low-stress.",
      "If choosing between a rushed day trip and one overnight, the overnight is better.",
    ],

    food: [
      "Casual Swedish bistro food",
      "Coffee and pastries in the centre",
      "Simple pre-match burgers or pub meals",
      "Sit-down dinner near the river",
      "Late drinks and lighter bites centrally",
    ],

    transport:
      "Uppsala is highly walkable and very easy from the rail station. Trains from Stockholm and Arlanda make the city accessible, but once you are there, most useful football-weekend movement is on foot.",

    accommodation:
      "Stay centrally or near the station. There is no need to overthink districts because the city is compact. The best strategy is simply choosing a clean central hotel and keeping the rest of the trip easy.",
  },

  degerfors: {
    cityId: "degersfors",
    name: "Degerfors",
    country: "Sweden",
    overview:
      "Degerfors is not a conventional city-break destination, and pretending otherwise would be stupid. This is a football-first trip built around a small industrial town and a club with real local identity. If you go, go because the football place itself interests you. That is the point, and once you accept that, the trip makes sense.",

    topThings: [
      { title: "Stora Valla area walk", tip: "The ground and its surroundings are the main point of the trip, so arrive early and take it in." },
      { title: "Town-centre local stop", tip: "Keep expectations realistic; this is about atmosphere of place, not attraction density." },
      { title: "Nearby Karlskoga base", tip: "Useful if you want a more practical overnight with broader hotel options." },
      { title: "Simple local pub session", tip: "Best done without trying to turn it into a big night out." },
      { title: "Matchday local wander", tip: "Small places reward slowing down rather than trying to collect activities." },
      { title: "Rail-and-ground trip rhythm", tip: "Build the day around transport properly because the margin for improvisation is smaller." },
      { title: "Football photography stop", tip: "Good if you like more old-school football settings." },
      { title: "Pre-match meal nearby", tip: "Sort food early because small-town choice is limited." },
      { title: "Post-match simple overnight", tip: "Treat practicality as the goal, not glamour." },
      { title: "Regional road-trip add-on", tip: "Works better as part of a wider Sweden route than as a luxury standalone break." },
    ],

    tips: [
      "Go for the football setting, not for a polished city weekend.",
      "Karlskoga can be the smarter overnight base.",
      "Food and nightlife choice are limited, so plan simply.",
      "This is one of the app’s purest football-first trips.",
      "Build in transport buffer because small-town trips punish bad timing.",
    ],

    food: [
      "Simple local pub food",
      "Basic town-centre cafés",
      "Practical nearby-town dining if driving or staying outside Degerfors",
    ],

    transport:
      "You need to think practically here. Rail connections and local onward travel matter more than in bigger cities, and the smart approach is to keep the plan simple with time margin built into every move.",

    accommodation:
      "Stay in Degerfors only if pure convenience is the priority. Karlskoga is usually the more practical overnight base if you want broader hotel choice and a slightly easier overall stay.",
  },

  boras: {
    cityId: "boras",
    name: "Borås",
    country: "Sweden",
    overview:
      "Borås is a practical football stop rather than a major tourism city. That is not a criticism; it just means you should plan it honestly. The best version of the trip is football-focused, tidy, and efficient, with the option of using Gothenburg as a stronger nightlife or weekend base if you want more out of the overall break.",

    topThings: [
      { title: "Borås Arena approach", tip: "The club and ground are the main reason you are here, so do not rush the matchday flow." },
      { title: "Town-centre wander", tip: "Useful as a short daytime block, not a full-day epic." },
      { title: "Street-art spotting", tip: "Borås has enough public art to make a central walk more interesting." },
      { title: "Simple central dinner", tip: "Keep it efficient and football-led rather than overreaching." },
      { title: "Textile-industry feel", tip: "The city’s identity is part of the background even if you are not doing museums." },
      { title: "Pre-match central café", tip: "The easy, no-drama option before heading towards the ground." },
      { title: "Post-match station return", tip: "Plan this early if you are not staying over." },
      { title: "Football-photo loop", tip: "Good if you like modern club grounds without giant-city distraction." },
      { title: "Short overnight reset", tip: "Borås is perfectly workable for one night if the football is the focus." },
      { title: "Gothenburg add-on", tip: "A strong choice if you want a better overall city weekend around the match." },
    ],

    tips: [
      "Borås works best as a football-first stop.",
      "Gothenburg is the better nightlife base if you are happy to commute.",
      "Do not expect giant-city entertainment density.",
      "The stadium is modern and easy to handle.",
      "This is a very manageable one-night or same-day football trip.",
    ],

    food: [
      "Simple Swedish bistro meals",
      "Central café lunch",
      "Casual burgers or pub food before the match",
      "Practical sit-down dinner in the centre",
      "Coffee and pastries between station and centre",
    ],

    transport:
      "Borås is straightforward if you treat the station and city centre as your anchors. It is not a place where you need a complex local transport strategy; clean timing matters more than anything else.",

    accommodation:
      "Stay centrally if you are overnighting in Borås. If you want the stronger overall weekend, use central Gothenburg and travel in for the match.",
  },

  halmstad: {
    cityId: "halmstad",
    name: "Halmstad",
    country: "Sweden",
    overview:
      "Halmstad is a good football weekend for people who like trips to breathe a bit. It has enough town-centre life, a coastal feel, and a classic-ground setup that makes the whole thing feel easier and more relaxed than the average urban football hit. The mistake would be trying to overcomplicate it or force big-city energy onto a trip that works because it stays calm.",

    topThings: [
      { title: "Örjans Vall approach", tip: "Classic ground, so arrive early and enjoy the setting properly." },
      { title: "Town-centre walk", tip: "Easy low-friction daytime block before food or football." },
      { title: "Seafront or beach area", tip: "Best in good weather and one of the city’s obvious advantages." },
      { title: "Nissan riverside area", tip: "A decent way to reset without doing too much." },
      { title: "Central dinner", tip: "Book if it is a busy summer football weekend." },
      { title: "Morning coastal coffee stop", tip: "Strong move if you stayed overnight." },
      { title: "Simple pub session", tip: "Better than trying to force heavyweight nightlife." },
      { title: "Matchday old-ground photo lap", tip: "Worth doing because the stadium has more character than many modern replacements." },
      { title: "Short seafront walk after check-in", tip: "Good way to switch the weekend into holiday mode quickly." },
      { title: "Relaxed post-match evening", tip: "Halmstad works better as a smooth overnight than a frantic schedule." },
    ],

    tips: [
      "Keep the trip relaxed; that is where Halmstad wins.",
      "The city centre is the best practical base.",
      "Good weather makes a big difference here.",
      "This is a football-plus-coast option rather than a giant-club spectacle.",
      "The stadium is one of the better character grounds in this league set.",
    ],

    food: [
      "Casual central restaurants",
      "Seafood if you want to lean into the coastal setting",
      "Pub food before the match",
      "Coffee-and-pastry daytime stops",
      "A cleaner sit-down dinner if you are overnighting properly",
    ],

    transport:
      "Halmstad is not difficult to handle. The key is simply staying central or near the practical visitor areas and keeping local movement light. Taxis or short onward hops are enough for most weekend needs.",

    accommodation:
      "City centre is the smartest base. A seafront stay can be attractive in good weather if you want more of a summer-break feel, but central Halmstad is usually the better all-round football choice.",
  },

  kalmar: {
    cityId: "kalmar",
    name: "Kalmar",
    country: "Sweden",
    overview:
      "Kalmar is a very decent small-city football weekend if you value ease, a bit of historic character, and a club that gives the trip a proper reason to exist. It is not loud or frantic, but that is exactly why it can work so well for one night. Treat it as a calm football city break and it does its job properly.",

    topThings: [
      { title: "Kvarnholmen old-town area", tip: "Best daytime wander and the clearest source of city character." },
      { title: "Kalmar Castle exterior and grounds", tip: "Worth seeing even if you do not turn it into a full historical deep dive." },
      { title: "Waterfront walk", tip: "Good low-effort reset before food or after coffee." },
      { title: "Central dinner", tip: "Book if you are there on a summer football weekend." },
      { title: "Guldfågeln Arena approach", tip: "Keep it simple and travel out from the centre rather than building the whole day around the ground." },
      { title: "Morning café stop", tip: "Kalmar suits a slower start before the rest of the day." },
      { title: "Local harbour feel", tip: "Adds more to the trip than outsiders often expect." },
      { title: "Pre-match central drink", tip: "Better than hovering around a less interesting stadium area." },
      { title: "One-night football break rhythm", tip: "This city works best when you accept that one relaxed overnight is enough." },
      { title: "Historic-centre photo walk", tip: "Useful if you want the trip to feel like more than just a stadium visit." },
    ],

    tips: [
      "Kalmar is best as a calm one-night football city break.",
      "Stay in the centre rather than near the ground.",
      "The historic core gives the trip more value than the city’s size suggests.",
      "Do not expect huge nightlife density.",
      "This is an easy low-stress trip if you plan honestly.",
    ],

    food: [
      "Central Swedish bistro meals",
      "Harbour-adjacent dining in good weather",
      "Casual pub or burger options before the match",
      "Coffee and bakery stops in the old centre",
      "A proper sit-down dinner rather than random grazing",
    ],

    transport:
      "Kalmar is manageable and compact enough that a central stay solves most problems. The smart play is to make the centre your anchor and then treat the stadium as a simple out-and-back move.",

    accommodation:
      "Stay around the city centre or Kvarnholmen for the best balance of atmosphere, food, and ease. The city is small enough that there is little value in chasing edge-of-town hotels unless they are dramatically cheaper.",
  },

  hallevik: {
    cityId: "hallevik",
    name: "Hällevik",
    country: "Sweden",
    overview:
      "Hällevik is one of the most unusual destinations in the app because it is not a standard city break at all. This is a small coastal place tied to one of the league’s most distinctive clubs. If you go, go with the right mindset: football place first, polished tourist city second. That is what makes it memorable.",

    topThings: [
      { title: "Strandvallen approach", tip: "This is the reason for the trip, so give yourself time around the ground." },
      { title: "Coastal village walk", tip: "Part of the appeal is simply how different the setting feels from normal top-flight football." },
      { title: "Harbour area stop", tip: "Good for photos and for understanding the scale of the place quickly." },
      { title: "Simple pre-match food", tip: "Do not expect metropolitan choice; plan basic but sensible." },
      { title: "Nearby seaside atmosphere", tip: "Best enjoyed slowly rather than rushed." },
      { title: "Small-place football photography", tip: "One of the most distinctive visual trips in the Swedish section." },
      { title: "Nearby Sölvesborg support base", tip: "Practical if you want more accommodation and transport flexibility." },
      { title: "Post-match local reset", tip: "Lean into the quietness rather than fighting it." },
      { title: "Coastal morning after stayover", tip: "The overnight is part of why this trip can be memorable." },
      { title: "Road-trip extension", tip: "Works very well if combined with a wider southern Sweden route." },
    ],

    tips: [
      "This is a football pilgrimage, not a standard city weekend.",
      "Sölvesborg is often the practical overnight base.",
      "Keep food and transport plans simple and realistic.",
      "The uniqueness of the place is the whole point.",
      "If you value odd memorable football trips, Hällevik is excellent.",
    ],

    food: [
      "Simple local seafood or coastal dining when available",
      "Basic pre-match meals planned ahead",
      "Nearby-town dining if you want more choice",
      "Coffee and bakery stops rather than big restaurant expectations",
    ],

    transport:
      "Treat Hällevik as a small-place logistics exercise. The right move is to plan the approach cleanly, know your final transport leg, and avoid assuming the flexibility of a bigger city.",

    accommodation:
      "Stay in Hällevik if you want maximum football-place immersion. Stay in Sölvesborg if you want a more practical base with wider accommodation choice.",
  },

  vasteras: {
    cityId: "vasteras",
    name: "Västerås",
    country: "Sweden",
    overview:
      "Västerås is a practical football city rather than a glamorous one, but that can work in its favour. The trip is simple, the movement is manageable, and the club has enough identity to stop the whole thing feeling generic. It is a solid football-first overnight if you are realistic about what the city is and do not try to force it into something bigger.",

    topThings: [
      { title: "City-centre walk", tip: "Good short orientation loop before food or football." },
      { title: "Lake Mälaren waterfront area", tip: "Best for adding a bit of scenery to an otherwise practical trip." },
      { title: "Historic central quarter", tip: "Useful as a daytime block even if you are not doing museums." },
      { title: "Rocklunda area approach", tip: "The stadium move is straightforward if you plan it cleanly." },
      { title: "Pre-match central meal", tip: "Better than trying to make the immediate stadium area your entire day." },
      { title: "Simple café-and-coffee stop", tip: "A good way to keep the trip low-stress." },
      { title: "Evening central drink", tip: "Keep expectations measured, but a clean one-night rhythm works fine here." },
      { title: "Rail arrival and city reset", tip: "The station area is useful logistically even if it is not your main leisure zone." },
      { title: "Football-first photography", tip: "Good if you like understated practical club trips." },
      { title: "Morning walk before departure", tip: "Helps the city feel more rounded if you are only there briefly." },
    ],

    tips: [
      "Stay in the centre or by the station and keep it simple.",
      "This is a football-first trip, not a big nightlife destination.",
      "Rocklunda movement is easy if timed properly.",
      "One overnight is usually enough.",
      "Good choice if you want practicality and club identity without heavy fuss.",
    ],

    food: [
      "Simple central restaurants",
      "Casual burgers or pub food before the game",
      "Coffee and pastries in the centre",
      "Basic late evening dining near central areas",
      "A decent sit-down dinner rather than trying to chase trendier options",
    ],

    transport:
      "Västerås is easy if you use the station and city centre as your anchors. The smart approach is simple planning, not trying to optimise every tiny move.",

    accommodation:
      "City-centre or station-adjacent hotels are the right call. The city is not big enough to justify overthinking neighbourhood strategy beyond basic convenience.",
  },
};

export default allsvenskanCityGuides;
