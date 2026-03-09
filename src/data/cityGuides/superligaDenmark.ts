import type { CityGuide } from "./types";

const GYG = {
  copenhagen:
    "https://www.getyourguide.com/en-gb/copenhagen-l12/?partner_id=MAQJREP&utm_medium=online_publisher",
  aarhus:
    "https://www.getyourguide.com/en-gb/aarhus-l1154/?partner_id=MAQJREP&utm_medium=online_publisher",
  herning:
    "https://www.getyourguide.com/en-gb/herning-l1553/?partner_id=MAQJREP&utm_medium=online_publisher",
  silkeborg:
    "https://www.getyourguide.com/en-gb/silkeborg-l1547/?partner_id=MAQJREP&utm_medium=online_publisher",
  randers:
    "https://www.getyourguide.com/en-gb/randers-l1546/?partner_id=MAQJREP&utm_medium=online_publisher",
  odense:
    "https://www.getyourguide.com/en-gb/odense-l1518/?partner_id=MAQJREP&utm_medium=online_publisher",
  viborg:
    "https://www.getyourguide.com/en-gb/viborg-l1548/?partner_id=MAQJREP&utm_medium=online_publisher",
  vejle:
    "https://www.getyourguide.com/en-gb/vejle-l1549/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const superligaDenmarkCityGuides: Record<string, CityGuide> = {
  copenhagen: {
    cityId: "copenhagen",
    name: "Copenhagen",
    country: "Denmark",
    thingsToDoUrl: GYG.copenhagen,
    overview:
      "Copenhagen is one of the best football city breaks in Europe full stop, not just in Denmark. The city is compact by capital standards, transport is easy, food and nightlife are strong, and multiple Superliga clubs sit inside the wider trip footprint. That makes it one of the highest-value neutral-traveller bases in the entire app.",
    topThings: [
      { title: "Nyhavn and canal area", tip: "Touristy, obvious, still worth doing. Just do not let it eat half your day." },
      { title: "Indre By walk", tip: "The cleanest way to understand the city and the right place to start." },
      { title: "Vesterbro evening", tip: "Best all-round zone for bars, restaurants and a more lived-in feel." },
      { title: "Nørrebro food and drinks", tip: "Good if you want a slightly less polished, more local-feel evening." },
      { title: "Tivoli / central district", tip: "Useful central anchor, but do not mistake centrality for depth." },
      { title: "Harbour walk or waterside cycle route", tip: "One of the easiest high-value daytime moves." },
      { title: "FC Copenhagen matchday", tip: "One of the app’s easiest premium football products because the city already does most of the work." },
      { title: "Brøndby or Lyngby trip from central base", tip: "Stay in Copenhagen and travel out. Anything else is usually worse." },
      { title: "Late brunch and coffee culture", tip: "This city suits lower-friction mornings better than frantic itinerary stacking." },
      { title: "Neighbourhood-based weekend planning", tip: "Pick one or two districts per day instead of zig-zagging like an idiot." },
    ],
    tips: [
      "Stay central Copenhagen, not near the suburban grounds.",
      "Vesterbro and Indre By are the strongest all-round bases.",
      "Copenhagen works brilliantly for FC Copenhagen, Brøndby, Nordsjælland and Lyngby trips.",
      "This is a city-break-first football base, which is exactly why it is so strong.",
      "A two-night minimum makes sense here if you want to do it properly.",
    ],
    food: [
      "Vesterbro restaurants and bars",
      "Nørrebro for broader food choice and livelier evenings",
      "Smørrebrød and classic Danish brunch spots",
      "Canal-side dining if you want one polished evening",
    ],
    transport:
      "Copenhagen is simple. Metro, rail and buses are all usable, the centre is very walkable, and all four wider-region football trips are manageable from a strong central base. Do not stay out by the stadiums just because the map makes them look convenient.",
    accommodation:
      "Vesterbro is the best all-round base. Indre By is the classic central option. Nørrebro is stronger if you want a more local, food-and-bars-heavy trip. Central station area is best if you want sheer practicality.",
  },

  brondby: {
    cityId: "brondby",
    name: "Brøndby",
    country: "Denmark",
    thingsToDoUrl: GYG.copenhagen,
    overview:
      "Brøndby is not a standalone city-break product in the way Copenhagen is. The correct framing is brutal but true: this is a Copenhagen football weekend with a Brøndby match as the key emotional block. That does not weaken it. It makes it cleaner and more honest.",
    topThings: [
      { title: "Brøndby matchday", tip: "This is the reason you are here. Do not pretend the suburb is the wider leisure product." },
      { title: "Central Copenhagen base", tip: "The smartest move almost every time." },
      { title: "Vesterbro pre-match plan", tip: "One of the strongest practical build-up options before travelling out." },
      { title: "Simple suburban travel-out", tip: "Give yourself time. Do not act like this is a walk-up local pub fixture." },
      { title: "Copenhagen city weekend", tip: "That is what turns Brøndby into a high-value trip rather than a narrow one." },
      { title: "Short post-match reset back in the city", tip: "Often better than hanging around too long out west." },
      { title: "Central dining before the game", tip: "Stronger choice than trying to force a full suburb-led itinerary." },
      { title: "Neighbourhood return night", tip: "Good if you want the match to sit inside a full city evening." },
      { title: "One-club weekend anchor", tip: "Brøndby is a serious anchor if the fixture is right." },
      { title: "Copenhagen plus football route", tip: "The correct way to sell and use this trip." },
    ],
    tips: [
      "Stay in Copenhagen, not Brøndby.",
      "This is a suburb-club guide, not a suburb-tourism guide.",
      "Use Vesterbro or central Copenhagen as your overnight base.",
      "Build buffer time into stadium travel.",
      "Best when treated as one heavy football block inside a wider city weekend.",
    ],
    food: [
      "Central Copenhagen pre-match meals",
      "Vesterbro bars and restaurants",
      "Casual city-centre dining before travelling out",
    ],
    transport:
      "This trip only works cleanly because Copenhagen is such a strong base. Use the city properly, then make the stadium move with time in hand.",
    accommodation:
      "Stay in central Copenhagen. Brøndby itself is almost never the right overnight choice for a neutral traveller.",
  },

  herning: {
    cityId: "herning",
    name: "Herning",
    country: "Denmark",
    thingsToDoUrl: GYG.herning,
    overview:
      "Herning is a football stop, not a glamour weekend. That is fine. The correct way to position it is as a compact, practical overnight trip for a serious league traveller rather than a city-break masterpiece. FC Midtjylland give it real football relevance even if the city itself is more functional than seductive.",
    topThings: [
      { title: "Midtjylland matchday", tip: "This is the core reason the trip exists." },
      { title: "Town-centre practical stay", tip: "Keep it simple and stop trying to invent magic where there is none." },
      { title: "Station-to-centre loop", tip: "Useful for basic orientation, not for a fake sightseeing marathon." },
      { title: "Pre-match central dinner", tip: "The cleanest way to structure the day." },
      { title: "One-night football stop", tip: "This is the right scale for most travellers." },
      { title: "Compact local bars", tip: "Enough for a low-key evening, not a huge nightlife pitch." },
      { title: "MCH Arena trip", tip: "Straightforward if you actually plan the move." },
      { title: "League-coverage depth stop", tip: "One of the stronger non-city-break clubs because the football itself matters." },
      { title: "Simple morning departure plan", tip: "Herning is best when handled efficiently." },
      { title: "Low-friction football travel", tip: "That is the product, not fantasy tourism fluff." },
    ],
    tips: [
      "This is a football-first overnight stop.",
      "Do not oversell Herning as a city-break heavyweight.",
      "Town centre is the obvious base.",
      "Midtjylland’s football status is what carries the trip.",
      "One night is enough for most users.",
    ],
    food: [
      "Town-centre brasseries and casual restaurants",
      "Simple bars and pubs",
      "Practical pre-match meals rather than destination dining",
    ],
    transport:
      "Herning is workable if you keep everything central and practical. This is not a trip that rewards complexity.",
    accommodation:
      "Town centre or near the station. Anything else is usually unnecessary.",
  },

  aarhus: {
    cityId: "aarhus",
    name: "Aarhus",
    country: "Denmark",
    thingsToDoUrl: GYG.aarhus,
    overview:
      "Aarhus is one of the best football city breaks in Denmark outside Copenhagen. That is not debate. It is a genuinely enjoyable weekend city with enough bars, restaurants, and central-life energy to support the trip even before AGF enter the picture. For the app, Aarhus is a very strong product.",
    topThings: [
      { title: "Latin Quarter", tip: "One of the best bases in the city and the right place to spend time." },
      { title: "Canal and city-centre route", tip: "Good first-day orientation loop without much wasted movement." },
      { title: "Aarhus Ø waterfront", tip: "Worth seeing, but do not let newer polished districts swallow the whole trip." },
      { title: "AGF matchday", tip: "One of Denmark’s strongest football-city combinations outside Copenhagen." },
      { title: "Central food and bars", tip: "A major part of why the city is worth doing properly." },
      { title: "Old-town and central browsing", tip: "Good for low-friction daytime movement." },
      { title: "Coffee-led slower morning", tip: "Aarhus suits that rhythm well." },
      { title: "One polished evening meal", tip: "Easy city for this without forcing anything." },
      { title: "Compact city weekend", tip: "Exactly the right scale for Aarhus." },
      { title: "Rail-led city break", tip: "Good if you are threading multiple Danish stops together." },
    ],
    tips: [
      "Latin Quarter is the strongest all-round base.",
      "Aarhus is one of the app’s better medium-city football weekends.",
      "Stay central, not by the ground.",
      "This is a real city break, not just a match trip with filler.",
      "Two nights works very well here.",
    ],
    food: [
      "Latin Quarter restaurants",
      "Canal-side dining",
      "Smart-casual Danish spots",
      "Bars and cafés in the central core",
    ],
    transport:
      "Aarhus is easy if you stay central. The city is manageable and the stadium move is simple enough when treated as one scheduled block.",
    accommodation:
      "Latin Quarter is best for atmosphere. Around Aarhus H is best for practicality. Either works if you keep the trip central.",
  },

  farum: {
    cityId: "farum",
    name: "Farum",
    country: "Denmark",
    thingsToDoUrl: GYG.copenhagen,
    overview:
      "Farum is not a destination weekend. Stop pretending it is. This is a Copenhagen-region football trip built around FC Nordsjælland, and the correct strategy is to use Copenhagen as the actual leisure base and travel out for the match.",
    topThings: [
      { title: "Nordsjælland matchday", tip: "The only reason a neutral traveller should be specifically targeting Farum." },
      { title: "Central Copenhagen stay", tip: "The correct overnight play almost every time." },
      { title: "Nørreport-linked travel plan", tip: "The simplest wider base logic." },
      { title: "Short day-trip football block", tip: "Exactly how this should be used." },
      { title: "Pre-match Copenhagen meal", tip: "Better than overcommitting to the suburban setting." },
      { title: "Post-match return to city", tip: "Often the move if you want the better evening." },
      { title: "Copenhagen weekend with fixture add-on", tip: "That is the right framing." },
      { title: "Farum station access route", tip: "Plan it once properly and the trip stays clean." },
      { title: "Low-friction suburban football stop", tip: "Useful if you position it honestly." },
      { title: "Wider Copenhagen-region football use", tip: "Farum gains value because Copenhagen is so strong." },
    ],
    tips: [
      "Stay in Copenhagen, not Farum.",
      "This is a suburban fixture guide, not a suburb-break guide.",
      "Nørrebro or Indre By are stronger than trying to stay near the ground.",
      "Treat Farum as a football block inside a wider city weekend.",
      "Works best for efficient scheduling, not for destination romance.",
    ],
    food: [
      "Copenhagen pre-match dining",
      "Nørrebro or central city bars and restaurants",
      "Simple stadium-adjacent purchases only when needed",
    ],
    transport:
      "The trip only makes sense because Copenhagen’s transport and city quality are strong. Use that properly and Farum becomes easy.",
    accommodation:
      "Central Copenhagen. There is no serious argument for Farum as the better neutral-traveller base.",
  },

  silkeborg: {
    cityId: "silkeborg",
    name: "Silkeborg",
    country: "Denmark",
    thingsToDoUrl: GYG.silkeborg,
    overview:
      "Silkeborg is calmer and more scenic than a lot of small-club football weekends. That is its strength. This is not a giant stadium, giant crowd, giant nightlife product. It is a tidy smaller Danish town with some scenery value and a coherent football stop attached.",
    topThings: [
      { title: "Lakeside walk", tip: "One of the main reasons the town feels better than a generic football stop." },
      { title: "Silkeborg matchday", tip: "Best used as one strong block inside a calm weekend." },
      { title: "Town-centre dining", tip: "Exactly the kind of low-friction evening this trip suits." },
      { title: "JYSK Park trip", tip: "Easy enough if you keep the stay compact." },
      { title: "Coffee by the water", tip: "A genuine value-add here, not fake itinerary filler." },
      { title: "One-night football stop", tip: "The cleanest frame for most users." },
      { title: "Scenic small-town break", tip: "This is the real product, not faux big-city energy." },
      { title: "Relaxed evening loop", tip: "Good if you like lower-tempo travel." },
      { title: "Regional Denmark route stop", tip: "Useful if combining multiple fixtures." },
      { title: "Simple town-centre base", tip: "The smartest move." },
    ],
    tips: [
      "This is a calmer scenic football trip, not a high-intensity one.",
      "Town centre or lakeside are the right bases.",
      "One night is usually enough.",
      "The scenery is what improves the football product.",
      "Position it honestly and it works well.",
    ],
    food: [
      "Town-centre restaurants",
      "Lakeside cafés and relaxed dinners",
      "Simple Danish local dining rather than destination-food chasing",
    ],
    transport:
      "Silkeborg works best when you keep everything central and low-friction. The trip is easy if you stop trying to make it more complicated than it is.",
    accommodation:
      "Town centre is the best practical base. Lakeside is the better scenic option if the price and timing make sense.",
  },

  randers: {
    cityId: "randers",
    name: "Randers",
    country: "Denmark",
    thingsToDoUrl: GYG.randers,
    overview:
      "Randers is functional rather than glamorous. That is the correct description. It works as a football stop, especially for league coverage, but it is not one of the Danish headline leisure weekends. The smartest play is often to treat it practically or even use Aarhus as the stronger wider base.",
    topThings: [
      { title: "Randers matchday", tip: "The main reason to include the city in an itinerary." },
      { title: "Town-centre loop", tip: "Enough for orientation, not enough to fake a giant city itinerary." },
      { title: "Simple central dinner", tip: "Best low-friction move before or after the match." },
      { title: "Aarhus-linked wider base", tip: "Often the more intelligent overnight strategy." },
      { title: "Cepheus Park trip", tip: "Easy enough if you keep the plans compact." },
      { title: "One-night football stop", tip: "This is the right scale." },
      { title: "Low-key bars and cafés", tip: "Adequate for a tidy evening, not a big social weekend." },
      { title: "League-depth stop", tip: "Useful in the app, just do not oversell it." },
      { title: "Central station logic", tip: "Good if handling the trip efficiently." },
      { title: "Practical rather than premium football travel", tip: "That is exactly what Randers is." },
    ],
    tips: [
      "Randers is a football stop, not a flagship Danish weekend.",
      "Aarhus may be the smarter wider base.",
      "Keep the trip compact and practical.",
      "The stadium is the main anchor, not the city itself.",
      "One night is enough for most users.",
    ],
    food: [
      "Town-centre casual dining",
      "Simple bars and local restaurants",
      "Functional pre-match meals",
    ],
    transport:
      "Randers is manageable if you keep everything central. If you want more off-pitch value, use Aarhus as the broader base and come in for the fixture.",
    accommodation:
      "Randers Centre is the obvious local base. Aarhus is the better wider city-break option if you are not committed to staying local.",
  },

  odense: {
    cityId: "odense",
    name: "Odense",
    country: "Denmark",
    thingsToDoUrl: GYG.odense,
    overview:
      "Odense is better than many people expect as a tidy short football city. It is not on Copenhagen or Aarhus level, but it has enough compact-city value to support a clean overnight or short break around OB. That is enough to make it useful and worth writing properly.",
    topThings: [
      { title: "Old centre walk", tip: "The obvious place to start and still the right one." },
      { title: "Odense matchday", tip: "A good anchor for a simple one-night football break." },
      { title: "Station-to-centre route", tip: "Useful for practical trip planning." },
      { title: "Compact central dinner", tip: "Strong low-friction evening move." },
      { title: "Neighbourhood coffee stop", tip: "Good if you want a lower-tempo trip." },
      { title: "Simple old-town circuit", tip: "Enough to give the city shape without forcing nonsense." },
      { title: "Nature Energy Park trip", tip: "Straightforward if you stay central." },
      { title: "One-night city football break", tip: "Exactly the correct framing." },
      { title: "Rail-based Denmark stop", tip: "Useful if chaining several places." },
      { title: "Clean practical weekend", tip: "The city’s strength is coherence, not giant scale." },
    ],
    tips: [
      "Good for a clean short football trip.",
      "Stay central or near the station.",
      "Do not compare it to Copenhagen and then complain.",
      "One night works well here.",
      "OB plus central Odense is a coherent product.",
    ],
    food: [
      "Central casual dining",
      "Station-adjacent practical meals",
      "Old-town cafés and bars",
    ],
    transport:
      "Odense is easiest when handled as a central stay with one stadium move. Keep the whole trip simple and it works well.",
    accommodation:
      "Odense Centre is best overall. Near the station is best if you are moving on quickly or arriving late.",
  },

  viborg: {
    cityId: "viborg",
    name: "Viborg",
    country: "Denmark",
    thingsToDoUrl: GYG.viborg,
    overview:
      "Viborg is another smaller Danish football stop that works best when positioned honestly. It is a tidy, cleaner-feel town with enough central quality for an overnight, but it is not a giant destination weekend. The right user for this guide is someone who values league depth and lower-friction travel.",
    topThings: [
      { title: "Central Viborg walk", tip: "Good for orientation and enough to make the stop feel coherent." },
      { title: "Cathedral area", tip: "Worth folding into the central route." },
      { title: "Viborg matchday", tip: "The football is the anchor and should stay that way." },
      { title: "Simple evening meal", tip: "The correct tone for the city." },
      { title: "Town-centre coffee stop", tip: "Exactly the kind of pace Viborg suits." },
      { title: "One-night football stop", tip: "The cleanest frame for the product." },
      { title: "Energi Viborg Arena trip", tip: "Simple if you stay central." },
      { title: "Practical regional movement", tip: "Useful if you are stringing together Danish stops." },
      { title: "Low-key local evening", tip: "Enough for a tidy trip, not for nightlife fantasy." },
      { title: "Smaller-city football break", tip: "The honest sales pitch." },
    ],
    tips: [
      "This is a smaller-city overnight football stop.",
      "Centre is the best base.",
      "Do not oversell the city or undercut the usefulness.",
      "The trip works because it is simple.",
      "One night is generally enough.",
    ],
    food: [
      "Town-centre restaurants",
      "Local cafés",
      "Simple Danish dining",
    ],
    transport:
      "Viborg is easy if you stay central and keep the trip compact. There is no upside in bloating the plan.",
    accommodation:
      "Viborg Centre is the best practical base. Around the cathedral/centre is the stronger atmospheric version.",
  },

  vejle: {
    cityId: "vejle",
    name: "Vejle",
    country: "Denmark",
    thingsToDoUrl: GYG.vejle,
    overview:
      "Vejle is a coherent football stop with some decent town-and-waterfront value, but it is not one of Denmark’s headline football weekends. That is fine. Not every guide needs to be fireworks. This is a cleaner, easy enough smaller stop inside a wider Denmark route.",
    topThings: [
      { title: "Town-centre walk", tip: "Useful orientation, not endless depth." },
      { title: "Waterfront area", tip: "Worth seeing because it gives the city a slightly stronger leisure feel." },
      { title: "Vejle matchday", tip: "The main reason for the trip." },
      { title: "Central dinner", tip: "Simple and usually enough." },
      { title: "One-night practical break", tip: "The best frame for most users." },
      { title: "Station-to-centre route", tip: "Useful if planning the trip efficiently." },
      { title: "Vejle Stadium trip", tip: "Simple enough when the whole stay is central." },
      { title: "Regional route stop", tip: "Works if you are moving around Jutland." },
      { title: "Low-key evening", tip: "This city suits calmer football travel." },
      { title: "Short functional football stay", tip: "Exactly the correct product description." },
    ],
    tips: [
      "A useful smaller football stop, not a flagship city break.",
      "Centre or waterfront are the best bases.",
      "Keep the itinerary short and efficient.",
      "One night is usually enough.",
      "Works better as part of a wider Denmark trip.",
    ],
    food: [
      "Town-centre dining",
      "Waterfront meals",
      "Simple cafés and casual bars",
    ],
    transport:
      "Vejle works when kept central and simple. There is no need to overplan the stay.",
    accommodation:
      "Vejle Centre is the best base. Waterfront/centre is the better scenic version if available at a sensible price.",
  },

  lyngby: {
    cityId: "lyngby",
    name: "Lyngby",
    country: "Denmark",
    thingsToDoUrl: GYG.copenhagen,
    overview:
      "Lyngby is another Copenhagen-region football stop rather than a standalone destination weekend. The right way to sell it is simple: use Copenhagen as your real trip base, then travel to Lyngby for the match. That makes it logical and useful instead of underwhelming.",
    topThings: [
      { title: "Lyngby matchday", tip: "The reason this guide exists." },
      { title: "Central Copenhagen base", tip: "Almost always the right overnight move." },
      { title: "Nørreport or central transit plan", tip: "Useful for keeping the football day easy." },
      { title: "Pre-match Copenhagen lunch or dinner", tip: "Stronger than trying to force suburban tourism." },
      { title: "Short suburban football trip", tip: "Exactly what Lyngby is in neutral-traveller terms." },
      { title: "City weekend with football add-on", tip: "The correct framing, not a compromise." },
      { title: "Local station-led access", tip: "Plan it once properly and the trip is fine." },
      { title: "Post-match return to Copenhagen", tip: "Often the better move for the evening." },
      { title: "Efficient fixture block", tip: "This is a football slot inside a larger city-break." },
      { title: "Wider Copenhagen football use", tip: "Lyngby has value because the capital is such a strong base." },
    ],
    tips: [
      "Stay in Copenhagen, not Lyngby.",
      "This is a regional fixture guide, not a suburb-break guide.",
      "Central or north-central Copenhagen bases work best.",
      "Use the city, then travel out.",
      "Simple planning is the whole point.",
    ],
    food: [
      "Central Copenhagen dining",
      "Nørrebro and central bars/restaurants",
      "Pre-match city meals, not suburb-led evenings",
    ],
    transport:
      "The only correct way to think about Lyngby is as a Copenhagen-region trip. Do that and the product becomes simple and useful.",
    accommodation:
      "Central Copenhagen remains the best base by a mile.",
  },

  haderslev: {
    cityId: "haderslev",
    name: "Haderslev",
    country: "Denmark",
    overview:
      "Haderslev is a football stop, not a destination weekend. That is the clean truth. SønderjyskE give it league-coverage value, but the wider leisure case is limited. Used honestly, it works as a practical one-night stop or as part of a broader route through Denmark.",
    topThings: [
      { title: "SønderjyskE matchday", tip: "The central reason to include the city in a trip." },
      { title: "Town-centre loop", tip: "Enough for basic orientation and that is about it." },
      { title: "Simple local dinner", tip: "The correct style of evening here." },
      { title: "Sydbank Park trip", tip: "Easy if you keep expectations and logistics realistic." },
      { title: "One-night football stop", tip: "Exactly the scale that makes sense." },
      { title: "Bus-area arrival practicality", tip: "Useful if moving efficiently rather than romantically." },
      { title: "Regional route stop", tip: "Best if folded into a wider Denmark itinerary." },
      { title: "Low-key evening", tip: "Enough for a tidy stop, not a destination nightlife pitch." },
      { title: "Practical football coverage", tip: "That is the app value here." },
      { title: "Early departure logic", tip: "Haderslev is better when handled neatly." },
    ],
    tips: [
      "This is a football stop, not a flagship city break.",
      "Town centre is the obvious base.",
      "Keep it to one night for most users.",
      "Useful for depth and coverage, not glamour.",
      "Positioning honesty is what makes the guide good.",
    ],
    food: [
      "Town-centre practical dining",
      "Simple local cafés and restaurants",
      "Low-key evening meals",
    ],
    transport:
      "Haderslev is most useful when treated as a compact football stop with simple local movement. Do not overcomplicate it.",
    accommodation:
      "Haderslev Centre is the most practical local base. Kolding is the stronger wider base if you are not committed to staying in town.",
  },
};

export default superligaDenmarkCityGuides;
