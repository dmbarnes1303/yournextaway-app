// src/data/cityGuides/ligue1.ts
import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * If a city doesn't have a clean GYG landing page, leave it undefined and
 * let UI fall back to buildAffiliateLinks({ city }).experiencesUrl.
 *
 * NOTE: I have intentionally removed ALL TripAdvisor usage (per your layout).
 * Add/verify any missing GYG city URLs later if you want hard-coded landing pages.
 */
const GYG = {
  paris:
    "https://www.getyourguide.com/en-gb/paris-l16/?partner_id=MAQJREP&utm_medium=online_publisher",
  lyon:
    "https://www.getyourguide.com/en-gb/lyon-l295/?partner_id=MAQJREP&utm_medium=online_publisher",
  lille:
    "https://www.getyourguide.com/en-gb/lille-l4436/?partner_id=MAQJREP&utm_medium=online_publisher",
  rennes:
    "https://www.getyourguide.com/en-gb/rennes-l287/?partner_id=MAQJREP&utm_medium=online_publisher",
  strasbourg:
    "https://www.getyourguide.com/en-gb/strasbourg-l293/?partner_id=MAQJREP&utm_medium=online_publisher",
  toulouse:
    "https://www.getyourguide.com/en-gb/toulouse-l288/?partner_id=MAQJREP&utm_medium=online_publisher",
  lorient:
    "https://www.getyourguide.com/en-gb/lorient-l34694/?partner_id=MAQJREP&utm_medium=online_publisher",
  monaco:
    "https://www.getyourguide.com/en-gb/monaco-l515/?partner_id=MAQJREP&utm_medium=online_publisher",
  angers:
    "https://www.getyourguide.com/en-gb/angers-l32319/?partner_id=MAQJREP&utm_medium=online_publisher",
  brest:
    "https://www.getyourguide.com/en-gb/brest-l32565/?partner_id=MAQJREP&utm_medium=online_publisher",
  nice:
    "https://www.getyourguide.com/en-gb/nice-l314/?partner_id=MAQJREP&utm_medium=online_publisher",
  lehavre:
    "https://www.getyourguide.com/en-gb/le-havre-l32566/?partner_id=MAQJREP&utm_medium=online_publisher",
  nantes:
    "https://www.getyourguide.com/en-gb/nantes-l296/?partner_id=MAQJREP&utm_medium=online_publisher",
  auxerre:
    "https://www.getyourguide.com/en-gb/auxerre-l32563/?partner_id=MAQJREP&utm_medium=online_publisher",
  metz:
    "https://www.getyourguide.com/en-gb/metz-l32323/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const ligue1CityGuides: Record<string, CityGuide> = {
  paris: {
    cityId: "paris",
    name: "Paris",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.paris,
    },
    thingsToDoUrl: GYG.paris,

    overview:
      "Paris is one of the world’s great city-break destinations and a heavyweight football capital to match. Home to Paris Saint-Germain and Paris FC, the city combines iconic landmarks, neighbourhood culture, elite cuisine, and a strong modern football identity. For football travellers, Paris delivers both spectacle and substance: a major stadium experience at Parc des Princes, a second-club alternative at Stade Charléty, and an endless supply of culture, food, nightlife, and walkable districts between matches. It is a city where you can pair Champions League-level football with museum mornings, café afternoons, and late-night wine bars without ever feeling rushed.",

    topThings: [
      {
        title: "Eiffel Tower & Trocadéro",
        tip: "Visit early morning for photos or late evening when the tower sparkles hourly. You do not need to go up unless it is a bucket-list item; views from Trocadéro and along the Seine are often better and free.",
      },
      {
        title: "Louvre Museum",
        tip: "Pre-book a timed ticket. Choose a small number of wings or masterpieces (Mona Lisa, Venus de Milo, Egyptian collection) rather than attempting everything. Expect 2–3 hours minimum.",
      },
      {
        title: "Seine River Walk",
        tip: "Walk from Notre-Dame toward the Louvre at dusk. One of the most atmospheric routes in Europe and completely free.",
      },
      {
        title: "Montmartre & Sacré-Cœur",
        tip: "Go in the morning for fewer crowds. Wander side streets behind the basilica for quieter cafés and village-style streets.",
      },
      {
        title: "Le Marais",
        tip: "Excellent area for shopping, galleries, cafés, and evening drinks. Compact, walkable, and lively without being chaotic.",
      },
      {
        title: "Musée d’Orsay",
        tip: "Ideal alternative to the Louvre if you prefer Impressionism. Easier to cover in 2 hours.",
      },
      {
        title: "Latin Quarter",
        tip: "Student-heavy area with bookshops, bars, and budget-friendly food options. Good evening base.",
      },
      {
        title: "Luxembourg Gardens",
        tip: "Perfect midday break spot. Grab pastries and sit in the chairs like locals.",
      },
      {
        title: "PSG Matchday – Parc des Princes",
        tip: "Arrive early. Security queues and metro crowds build quickly. Walk around the stadium to soak up atmosphere and fan merchandise stalls.",
      },
      {
        title: "Paris FC Matchday – Stade Charléty",
        tip: "Smaller, calmer, cheaper experience. Good alternative if PSG tickets are expensive or sold out.",
      },
    ],

    tips: [
      "Base yourself near a metro line rather than focusing purely on postcode.",
      "Book museums and big attractions in advance on weekends.",
      "Walk whenever distances are under 25 minutes – Paris is a street-level city.",
      "Eat away from major landmarks for better quality and prices.",
      "On PSG matchdays, leave central areas earlier than you think; trains get busy.",
      "Late dinners are normal (8:30–10pm).",
    ],

    food: [
      "Croque monsieur / croque madame",
      "Steak frites",
      "Crêpes (sweet and savoury)",
      "Cheese and charcuterie boards",
      "Boulangerie breakfasts (croissant + coffee)",
    ],

    transport:
      "Extensive metro network covers almost everywhere. Buy carnet (10-ticket pack) or use contactless. Walking + metro combination is ideal.",

    accommodation:
      "Le Marais, Latin Quarter, Saint-Germain for walkability. Montmartre for character. 9th–11th arrondissements for better value.",
  },

  lyon: {
    cityId: "lyon",
    name: "Lyon",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.lyon,
    },
    thingsToDoUrl: GYG.lyon,

    overview:
      "Lyon is arguably the best all-round city break in France for travellers who want culture, food, and football without Paris-level stress. It’s a UNESCO-listed old city built on two rivers (Rhône + Saône), with walkable neighbourhoods, serious dining credibility (this is the home of the ‘bouchon’), and a modern stadium setup for Olympique Lyonnais. Lyon also works brilliantly for football travel because it’s compact, efficient, and good value relative to what you get: you can do proper sightseeing by day, eat extremely well at night, and still have an easy matchday plan without feeling like you’re fighting the city.",

    topThings: [
      {
        title: "Vieux Lyon (Old Town) + riverside wandering",
        tip: "This is your essential ‘Lyon texture’ block: pick a slow morning or late afternoon, walk the Saône river edge, then cut into the old streets. Don’t treat it like a checklist — the value is in drifting between small squares, cafés, and viewpoints. If you’re short on time, this single area gives you the strongest Lyon vibe fastest.",
      },
      {
        title: "Basilica of Notre-Dame de Fourvière + the viewpoint",
        tip: "Go for the panoramic city view — it’s the best in Lyon. Funicular up is easy, but walking down through the old town is a great route if the weather’s decent. Aim for golden hour if you want a ‘wow’ skyline shot.",
      },
      {
        title: "Traboules (secret passageways) in Vieux Lyon / Croix-Rousse",
        tip: "These covered corridors are one of Lyon’s signature experiences. Find a couple rather than hunting dozens. The best way is to pick a couple of known addresses and then let yourself get lost. Wear grippy shoes — some passages are slick in rain.",
      },
      {
        title: "Presqu’île shopping + Place Bellecour core loop",
        tip: "This is the ‘central spine’ between the rivers. Use it for orientation, quick shopping, and café stops. It’s also a good base for first-timers who want everything walkable.",
      },
      {
        title: "Parc de la Tête d’Or",
        tip: "A top-tier urban park and the best reset in Lyon. Ideal for: (1) post-travel decompression, (2) a calm morning before a night match, or (3) a picnic break if your itinerary is heavy. You can spend 60 minutes or half a day depending on your pace.",
      },
      {
        title: "Les Halles de Lyon Paul Bocuse (food market)",
        tip: "This is where you go to feel Lyon’s food obsession in one place. It’s not cheap, but it’s the highest ‘quality-per-minute’ food stop in the city: pastries, cheese, charcuterie, quick wine. Go hungry, don’t over-plan, and try small portions across multiple stalls.",
      },
      {
        title: "Bouchon dinner (Lyon’s traditional restaurants)",
        tip: "Book ahead on weekends. Order something you won’t eat at home — Lyon is about indulgent, old-school comfort food. Don’t pick the first place on the main tourist drag; go 1–2 streets back for better quality and less ‘tour menu’ energy.",
      },
      {
        title: "Croix-Rousse neighbourhood",
        tip: "More local, slightly bohemian vibe, with good cafés and a different feel to the old town. Great for a half-day wander if you’re staying longer than 24 hours.",
      },
      {
        title: "Matchday – Olympique Lyonnais (Groupama Stadium / Décines)",
        tip: "The stadium is outside the historic centre, so matchday is about logistics. Your win condition is simple: choose your transport plan early (tram/shuttle/metro connections), go early, and avoid last-minute panic. If you do it right, it’s smooth — if you leave it late, you’ll waste time in queues and crowds.",
      },
      {
        title: "Rivers at night (Rhône embankments)",
        tip: "Lyon looks better after dark than people expect. Do a simple post-dinner walk along the Rhône — it’s the easiest ‘free premium’ experience you can add to the trip.",
      },
    ],

    tips: [
      "Lyon is easiest if you plan by neighbourhood blocks: Vieux Lyon + Fourvière one day, Presqu’île + Rhône another, Croix-Rousse as a bonus.",
      "Book dinner on Fridays/Saturdays if you want a ‘proper’ bouchon — walk-ins can be hard at peak times.",
      "If you’re doing the stadium, treat it like an ‘event outside town’ — leave earlier than instinct says and you’ll enjoy it more.",
      "Lyon is very walkable, but the hills (Fourvière/Croix-Rousse) make comfortable shoes non-negotiable.",
      "If your trip is short, skip trying to do every museum — Lyon’s best value is street-level: food, views, neighbourhoods, rivers.",
      "Weather matters: in rain, prioritise markets, museums, and covered old-town streets; in sun, go hard on parks, viewpoints, and riverside time.",
    ],

    food: [
      "Bouchon classics (rich, traditional Lyonnais dishes)",
      "Charcuterie + cheese boards (top-tier here)",
      "Pastries from a serious boulangerie (don’t settle for average)",
      "Market grazing at Les Halles Paul Bocuse",
      "Local wine bars (easy win for evenings)",
    ],

    transport:
      "Lyon’s public transport is reliable and simple. Metro/trams cover the key areas; walking is excellent in the centre. For Groupama Stadium (Décines), plan your route before matchday and leave early — the stadium is not in the old town, and crowds can make ‘quick trips’ slow.",

    accommodation:
      "Best bases: Presqu’île for first-timers (central + walkable), Vieux Lyon for character and evening atmosphere, Part-Dieu for transport convenience/value, Croix-Rousse for a more local, calmer stay. If matchday is a key priority, staying central is still usually better than staying near the stadium — the stadium area is functional, not charming.",
  },

  lille: {
    cityId: "lille",
    name: "Lille",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.lille,
    },
    thingsToDoUrl: GYG.lille,

    overview:
      "Lille is one of France’s most underrated city breaks and one of the best football-trip bases in Europe. It’s compact, stylish, and built for weekend travel: a beautiful old centre, strong bar and restaurant scene, and excellent rail connections (Paris, Brussels, London via Eurostar routes). Add Lille OSC and a modern stadium setup, and you’ve got a city that delivers both football and a genuinely enjoyable short-break atmosphere. It feels more ‘Flemish’ than stereotypically French — brick architecture, hearty food, big beer culture — which makes it feel distinct quickly.",

    topThings: [
      {
        title: "Vieux Lille (Old Town) wander",
        tip: "This is the core experience. Do it slowly: cobbled streets, boutique shops, cafés, and bars. The best Lille trips are built around wandering and stopping, not rushing landmark-to-landmark. If you only have a day, spend most of it here.",
      },
      {
        title: "Grand Place (Place du Général de Gaulle) + Old Stock Exchange",
        tip: "Short, high-impact sightseeing. The Old Stock Exchange courtyard is a quick win — it’s beautiful and often has small stalls. Do it early, then drift into side streets for food and shopping.",
      },
      {
        title: "Citadel Park (Parc de la Citadelle)",
        tip: "Best ‘reset’ in the city. Ideal morning walk or pre-match calm time. Great if you want a break from cafés and crowds without leaving the centre.",
      },
      {
        title: "Palais des Beaux-Arts",
        tip: "One of France’s best art museums outside Paris. If you want one proper cultural stop, make it this. It’s also a strong rainy-day anchor.",
      },
      {
        title: "Rue de Béthune + shopping spine",
        tip: "Not ‘unique’, but useful. Treat it as a practical block for quick errands, then escape back to the old town for better atmosphere.",
      },
      {
        title: "Wazemmes Market (if timing works)",
        tip: "A more local-feeling experience with food stalls and big energy. Worth it if you’re there on the right day — not essential otherwise.",
      },
      {
        title: "Beer culture crawl (estaminets + craft)",
        tip: "Lille is a beer city. Build a simple crawl: one classic estaminet for local vibe, one modern craft spot for variety. Don’t try to do 8 venues — do 3 good ones and you’ll remember it.",
      },
      {
        title: "Matchday – Lille OSC (Stade Pierre-Mauroy / Decathlon Arena)",
        tip: "The stadium is outside the old town, so matchday needs a transport plan. The venue itself is modern and comfortable; the key is leaving early enough that you arrive relaxed, not sprinting. Pre-drinks in the centre, then head out with time buffer.",
      },
      {
        title: "Day trip: Brussels / Ghent / even Paris",
        tip: "Lille’s rail connections are insane for weekend travellers. If you’re staying 3+ nights, it’s one of the easiest ‘add another city’ bases in Europe.",
      },
      {
        title: "Late-night Old Town vibe",
        tip: "Lille is at its best in the evening — warm lights, busy terraces, and a social crowd. Don’t retreat early; build at least one ‘wander + bar’ night into your trip.",
      },
    ],

    tips: [
      "Lille is perfect for 1–3 night trips: compact enough to feel ‘done’, but lively enough to keep you out at night.",
      "If you’re combining football + nightlife, stay central (Vieux Lille / near Grand Place). You want walking access to bars.",
      "The stadium isn’t in the pretty bit — plan transport so matchday feels smooth rather than like a commute.",
      "For food, avoid obvious ‘tourist menus’ right on the main squares; the best value is usually on side streets.",
      "If you’re coming from the UK, Lille is one of the easiest Eurostar-style weekend escapes — build your trip around rail times and you’ll maximise time on the ground.",
      "Cold weather trips still work brilliantly here because the city is built for bars, hearty food, and museums.",
    ],

    food: [
      "Carbonnade flamande (rich beef stew)",
      "Welsh (the regional rarebit-style dish — heavy but iconic)",
      "Moules-frites",
      "Tarte au sucre / local pastries",
      "Local beer + estaminet-style plates",
    ],

    transport:
      "Lille is very walkable in the centre. Metro is useful for reaching the stadium and outer areas. Rail links are a major advantage: fast trains to Paris and Belgium make Lille a powerful base city.",

    accommodation:
      "Stay in Vieux Lille / near Grand Place for the best city-break experience (walkability, atmosphere, bars). Euralille is practical for stations and value. If football is the main goal, central is still best — the stadium area is functional rather than charming.",
  },

  rennes: {
    cityId: "rennes",
    name: "Rennes",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.rennes,
    },
    thingsToDoUrl: GYG.rennes,

    overview:
      "Rennes is a smart, youthful Breton city that punches above its weight for weekend travellers. It’s lively without being exhausting, compact without being boring, and packed with strong food and bar options thanks to its student population. For football travellers, Stade Rennais gives you a genuine ‘local club, real atmosphere’ matchday, and the city itself is an excellent base for exploring Brittany if you want more than just a stadium stop. Rennes is the kind of place that quietly becomes a favourite because it’s easy to live in for a few days — everything works, everything is close, and it feels authentically French without being over-touristed.",

    topThings: [
      {
        title:
          "Rennes Old Town (half-timbered streets) – especially around Place Sainte-Anne",
        tip: "This is the heart of Rennes’ charm: crooked half-timbered buildings, small squares, and an easy café/bar rhythm. Do it as a slow wandering block and you’ll ‘get’ the city fast.",
      },
      {
        title: "Marché des Lices (one of France’s best markets)",
        tip: "If your dates align, this is non-negotiable. It’s a huge, high-quality market and a perfect cultural experience even if you don’t ‘love markets’. Go early, graze, then build your day outward from there.",
      },
      {
        title: "Parlement de Bretagne (external + surrounding streets)",
        tip: "One of the most striking buildings in the city. Even if you don’t tour inside, the area gives you a strong ‘historic Rennes’ feel and good photo angles.",
      },
      {
        title: "Thabor Park (Parc du Thabor)",
        tip: "A top-tier urban park and the best reset in Rennes. Ideal for: morning walk, post-lunch calm, or a ‘fresh air’ break before a night match.",
      },
      {
        title: "Brittany food + cider crawl",
        tip: "Rennes is the perfect place to lean into Breton culture: galettes (savory crêpes), cider, seafood. Build one evening around a proper galette dinner followed by bars rather than generic brasseries.",
      },
      {
        title: "Rue Saint-Michel (Rue de la Soif) nightlife strip",
        tip: "It’s famous for a reason: packed with bars and energy. Go earlier if you want seats; go later if you want the full student-heavy chaos. It’s not elegant — it’s fun.",
      },
      {
        title: "Matchday – Stade Rennais (Roazhon Park)",
        tip: "A proper local football experience: passionate without being hostile, and very walkable from parts of the city depending on where you stay. Go early and soak up pre-match pubs and street energy.",
      },
      {
        title: "Museum stop: Musée des Beaux-Arts",
        tip: "Good ‘1–2 hour’ culture block if you want a structured daytime activity. Rennes isn’t about huge tourist attractions; it’s about high quality smaller experiences.",
      },
      {
        title: "Day trip: Saint-Malo",
        tip: "One of the strongest add-ons from Rennes. If you have 2+ nights, a day trip to the walled coastal city is a major upgrade to the overall trip value.",
      },
      {
        title: "Day trip: Mont Saint-Michel (longer but iconic)",
        tip: "Doable from Rennes, but plan it like a real excursion and check timings. Worth it if you’ve never been, but don’t force it if you only have a short weekend.",
      },
    ],

    tips: [
      "Rennes rewards ‘soft planning’: pick 1–2 anchor activities (market, park, match) and let the rest flow naturally.",
      "If your trip includes the market, build your schedule around it — it’s one of the best daytime experiences in the city.",
      "Lean into Breton food properly: galette + cider is the signature combo and an easy win for visitors.",
      "Nightlife is strong and student-heavy — expect energy, not polish. Choose your vibe: calmer wine bars or the full Rue Saint-Michel chaos.",
      "For matchday, arrive early and make time for a pre-match drink; Rennes is at its best when you adopt the local rhythm rather than rushing straight to seats.",
      "Rennes is a great base for Brittany — if you’re staying longer, add a coastal day trip to maximise trip value.",
    ],

    food: [
      "Galette complète (savory buckwheat crêpe)",
      "Breton cider (the correct pairing with galettes)",
      "Seafood when available (Brittany strength)",
      "Kouign-amann / Breton pastries",
      "Casual bistro plates in the old town",
    ],

    transport:
      "Rennes is compact and walkable. Metro/buses are useful but often unnecessary in the centre. Rail connections make day trips to Saint-Malo and beyond very practical.",

    accommodation:
      "Stay central near the old town (Sainte-Anne / République area) for the best city-break experience. This keeps food, nightlife, and walking routes easy. If matchday is a priority, central still works best — you’ll enjoy the trip more than staying out by functional areas.",
  },

  strasbourg: {
    cityId: "strasbourg",
    name: "Strasbourg",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.strasbourg,
    },
    thingsToDoUrl: GYG.strasbourg,

    overview:
      "Strasbourg is one of France’s most visually distinctive cities: half-timbered medieval streets, canals, flower-lined bridges, and a strong Franco-German identity that shows up in architecture, food, and beer culture. It feels intimate, walkable, and atmospheric, making it an excellent football weekend destination where sightseeing, eating, and matchday all fit comfortably into a short trip. RC Strasbourg provide a passionate, old-school fan culture, and the city itself delivers postcard beauty without Paris crowds.",

    topThings: [
      {
        title: "La Petite France quarter",
        tip: "This is the postcard core of Strasbourg. Go early morning or after dinner for the best experience. Wander without a route — canals, bridges, and crooked streets are the whole point. If you only have time for one sightseeing block, make it this.",
      },
      {
        title: "Strasbourg Cathedral (Cathédrale Notre-Dame)",
        tip: "Visit inside first, then climb the tower if energy allows. The view over rooftops and the Rhine plain is excellent. Early slots avoid queues.",
      },
      {
        title: "Grande Île riverside walk",
        tip: "Loop the island on foot. It gives you constant scenery without needing attractions. Perfect for a relaxed afternoon block.",
      },
      {
        title: "Boat cruise on the Ill River",
        tip: "High value if weather is good. Lets you see the city’s layout with minimal effort.",
      },
      {
        title: "European Quarter (EU Parliament area)",
        tip: "Only worth it if you’re staying longer than one night or want a quiet walk. Not essential on short trips.",
      },
      {
        title: "Wine bar hopping",
        tip: "Alsace wines are excellent and affordable locally. Build one evening around wine bars rather than generic pubs.",
      },
      {
        title: "Traditional winstub (Alsatian tavern)",
        tip: "Book ahead on weekends. Heavy, comforting food but very local.",
      },
      {
        title: "Matchday – RC Strasbourg (Stade de la Meinau)",
        tip: "Strong atmosphere. Stadium is south of centre but easy by tram. Arrive early for pre-match bars and fan activity.",
      },
      {
        title: "Day trip option: Colmar",
        tip: "If staying 3+ nights, Colmar is an easy and beautiful addition.",
      },
      {
        title: "Evening canal walk",
        tip: "Strasbourg lights beautifully at night. Free, romantic, and high-impact.",
      },
    ],

    tips: [
      "Stay inside or close to Grande Île for maximum walkability.",
      "Book dinner on Friday/Saturday — small restaurants fill fast.",
      "Alsatian food is heavy; balance lunches lighter if you plan big dinners.",
      "Trams are reliable; walking covers most central routes.",
      "Matchday trams get busy — leave earlier than instinct.",
    ],

    food: [
      "Tarte flambée (flammekueche)",
      "Choucroute garnie",
      "Sausages + potatoes",
      "Alsace white wines",
      "Pastries from local boulangeries",
    ],

    transport:
      "Excellent tram network. City centre is largely walkable. Stadium reached easily by tram from centre.",

    accommodation:
      "Grande Île or Petite France for atmosphere. South-central areas offer better value with short tram rides.",
  },

  toulouse: {
    cityId: "toulouse",
    name: "Toulouse",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.toulouse,
    },
    thingsToDoUrl: GYG.toulouse,

    overview:
      "Toulouse is known as 'La Ville Rose' thanks to its pink-brick buildings, and it delivers a warm, relaxed southern French city break with excellent food, big squares, and a strong student energy. It’s less tourist-heavy than Paris or Nice, which makes it ideal for football travellers who want authenticity, space, and value. Combine that with Toulouse FC’s modern stadium and an easygoing matchday culture, and you get a city that works extremely well for weekend football trips.",

    topThings: [
      {
        title: "Place du Capitole",
        tip: "City’s main square and natural starting point. Grab a coffee, orient yourself, then branch into side streets.",
      },
      {
        title: "Capitole building interior",
        tip: "Free and quick visit. Good cultural context with minimal time investment.",
      },
      {
        title: "Garonne river walk",
        tip: "Best at sunset. Long open views, bridges, and relaxed atmosphere.",
      },
      {
        title: "Basilica of Saint-Sernin",
        tip: "Major Romanesque church and pilgrimage site. Short, worthwhile stop.",
      },
      {
        title: "Carmes district",
        tip: "Best neighbourhood for food and bars. Lively but not messy.",
      },
      {
        title: "Victor Hugo Market",
        tip: "Food-focused market with strong lunch options. Great daytime anchor.",
      },
      {
        title: "Canal du Midi stroll",
        tip: "Tree-lined walking path for calmer sightseeing.",
      },
      {
        title: "Matchday – Toulouse FC (Stadium de Toulouse)",
        tip: "South of centre. Metro access is straightforward. Friendly, relaxed atmosphere.",
      },
      {
        title: "Wine bar evening",
        tip: "Occitanie wines are excellent and often overlooked internationally.",
      },
      {
        title: "Late-night square hopping",
        tip: "Multiple busy squares make it easy to move organically.",
      },
    ],

    tips: [
      "Toulouse runs at a slower pace — embrace long lunches and late dinners.",
      "Stay central to minimise transport needs.",
      "Book restaurants Fri/Sat nights.",
      "Use metro for stadium; walking for sightseeing.",
      "Expect more locals than tourists — that’s a positive.",
    ],

    food: [
      "Cassoulet",
      "Duck confit",
      "Saucisse de Toulouse",
      "Local red wines",
      "Market lunches",
    ],

    transport:
      "Compact centre, strong metro lines. Stadium served by metro + short walk.",

    accommodation:
      "Capitole or Carmes areas for best balance of sightseeing and nightlife.",
  },

  lorient: {
    cityId: "lorient",
    name: "Lorient",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.lorient,
    },
    thingsToDoUrl: GYG.lorient,

    overview:
      "Lorient is a coastal Breton city built around maritime culture, fishing heritage, and access to the sea. It’s not a classic tourist heavyweight, but that’s exactly why it works for football travel: affordable, relaxed, authentic, and different from the usual French city break. FC Lorient offers a genuinely local matchday atmosphere, and the surrounding coastline gives the trip added depth if you stay more than one night.",

    topThings: [
      {
        title: "Lorient harbour area",
        tip: "Walk around the docks and marina. Simple but atmospheric.",
      },
      {
        title: "Submarine base (Keroman)",
        tip: "Major WWII site with museums and exhibitions. Strong rainy-day option.",
      },
      {
        title: "Boat trip to Groix Island",
        tip: "Excellent half-day trip if weather is good. Adds serious value.",
      },
      {
        title: "City beaches",
        tip: "Several nearby options for coastal walks and sea air.",
      },
      {
        title: "Fishing port early morning",
        tip: "If you’re an early riser, it shows the city’s working identity.",
      },
      {
        title: "Seafood lunch",
        tip: "Prioritise fish restaurants — this is where Lorient shines.",
      },
      {
        title: "Matchday – FC Lorient (Stade du Moustoir)",
        tip: "Central stadium with walkable access. Friendly, compact atmosphere.",
      },
      {
        title: "Breton cider bars",
        tip: "Casual evening culture rather than big nightlife.",
      },
      {
        title: "Coastal path walking",
        tip: "Strong scenery even on short routes.",
      },
      {
        title: "Day trip: Quimper or Vannes",
        tip: "If staying multiple nights, both are easy additions.",
      },
    ],

    tips: [
      "Treat Lorient as a relaxed coastal + football combo, not a landmark-heavy city.",
      "Weather shapes the trip — plan indoor museum backup.",
      "Seafood quality is high; use it.",
      "Stay central for walkability.",
      "Expect calm evenings rather than party nightlife.",
    ],

    food: [
      "Fresh seafood platters",
      "Mussels",
      "Crêpes & galettes",
      "Breton cider",
      "Fish stew",
    ],

    transport: "Small, walkable city. Trains connect to other Breton towns.",

    accommodation:
      "Central Lorient near harbour or stadium for easiest stay.",
  },

  monaco: {
    cityId: "monaco",
    name: "Monaco",
    country: "Monaco",
    bookingLinks: {
      thingsToDo: GYG.monaco,
    },
    thingsToDoUrl: GYG.monaco,

    overview:
      "Monaco is football’s strangest top-flight destination: a microstate of extreme wealth, Mediterranean scenery, yacht-filled harbours, and a club that feels global rather than local. For travellers, Monaco delivers a completely different matchday experience from traditional football cities — glamorous, compact, visually spectacular, and seamlessly combined with Riviera sightseeing. It works best as a 1–2 night stop blended with Nice or the surrounding Côte d’Azur rather than a standalone long stay.",

    topThings: [
      {
        title: "Monte Carlo Casino & Square",
        tip: "Visit early morning or late evening for photos before crowds. Even if you don’t gamble, the architecture and setting are essential Monaco.",
      },
      {
        title: "Prince’s Palace (Monaco-Ville)",
        tip: "Walk up through the old town streets. Time your visit for the changing of the guard if possible.",
      },
      {
        title: "Old Town (Le Rocher)",
        tip: "Wander slowly — narrow lanes, viewpoints, cafés. This feels more human than the modern marina zones.",
      },
      {
        title: "Oceanographic Museum",
        tip: "One of Monaco’s strongest attractions. Worth 2–3 hours if you enjoy marine life or grand museums.",
      },
      {
        title: "Port Hercules harbour walk",
        tip: "Yachts, waterfront bars, and classic Monaco scenery. Best late afternoon into sunset.",
      },
      {
        title: "Japanese Garden",
        tip: "Small but peaceful green space near the sea.",
      },
      {
        title: "Larvotto Beach",
        tip: "Public beach with clear water. Good daytime break in warmer months.",
      },
      {
        title: "Matchday – AS Monaco (Stade Louis II)",
        tip: "Arrive 45–60 mins early. Stadium is modern, comfortable, and close to the port area.",
      },
      {
        title: "Nice day trip",
        tip: "20 minutes by train. Many fans base in Nice and travel to Monaco for the match.",
      },
      {
        title: "Èze village side trip",
        tip: "Hilltop medieval village with exceptional views. Half-day option.",
      },
    ],

    tips: [
      "Stay in Nice if Monaco hotel prices are extreme.",
      "Dress slightly smarter here than most football cities.",
      "Book restaurants in advance — casual walk-ins can still be pricey.",
      "Expect a quieter stadium than most Ligue 1 venues.",
      "Use trains rather than taxis to move along the coast.",
    ],

    food: [
      "Seafood",
      "Mediterranean pasta dishes",
      "Niçoise-style cuisine",
      "Fresh pastries",
      "French desserts",
    ],

    transport:
      "Excellent regional trains along Riviera. Monaco is compact and walkable.",

    accommodation: "Nice (budget + nightlife) or Monte Carlo (premium, central).",
  },

  angers: {
    cityId: "angers",
    name: "Angers",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.angers,
    },
    thingsToDoUrl: GYG.angers,

    overview:
      "Angers is a refined, livable Loire Valley city with a medieval core, major castle, wine culture, and a calm but youthful energy thanks to its large student population. It’s ideal for travellers who want history, walkability, strong food, and a relaxed matchday rather than big-city chaos. Angers SCO matches feel local, grounded, and accessible — perfect for a cultural football weekend.",

    topThings: [
      {
        title: "Château d’Angers",
        tip: "Massive medieval fortress dominating the city. Allow at least 2 hours. Walk the ramparts.",
      },
      {
        title: "Apocalypse Tapestry Gallery",
        tip: "Inside the castle. Unique and genuinely impressive.",
      },
      {
        title: "Historic Old Town",
        tip: "Wander between castle, cathedral, and river. Compact and charming.",
      },
      {
        title: "Angers Cathedral",
        tip: "Quick interior visit. Strong Gothic architecture.",
      },
      {
        title: "Maine river walk",
        tip: "Flat, scenic, and good for daytime strolling.",
      },
      {
        title: "Wine bars",
        tip: "Loire Valley wines are a highlight — build one evening around wine tasting.",
      },
      {
        title: "Matchday – Angers SCO (Stade Raymond Kopa)",
        tip: "Short tram ride from centre. Friendly, family-oriented atmosphere.",
      },
      {
        title: "Place du Ralliement",
        tip: "Central square for cafés and people-watching.",
      },
      {
        title: "Museum of Fine Arts",
        tip: "Good small museum if weather is poor.",
      },
      {
        title: "Day trip: Saumur",
        tip: "Another Loire Valley town with château and wine caves.",
      },
    ],

    tips: [
      "Angers is walkable — stay central.",
      "Plan castle visit earlier in the day.",
      "Dinner times are relaxed; don’t rush.",
      "Tram is easiest way to stadium.",
      "Expect quieter nightlife than major cities.",
    ],

    food: [
      "Rillauds (pork speciality)",
      "Goat cheese",
      "River fish dishes",
      "Loire wines",
      "Classic French bistro food",
    ],

    transport: "Compact centre. Tram and buses reliable.",

    accommodation: "Old Town or near Place du Ralliement.",
  },

  brest: {
    cityId: "brest",
    name: "Brest",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.brest,
    },
    thingsToDoUrl: GYG.brest,

    overview:
      "Brest is a rugged Atlantic port city with a strong naval identity and a practical, working-class feel. It’s not about pretty medieval streets — it’s about maritime heritage, fresh seafood, wind-swept coastal scenery, and an honest football culture. For travellers, Brest works best as a football + coastal exploration trip rather than a pure sightseeing break.",

    topThings: [
      {
        title: "Brest Castle & National Maritime Museum",
        tip: "Core attraction explaining the city’s naval history.",
      },
      {
        title: "Telepherique cable car",
        tip: "Short but scenic harbour crossing.",
      },
      {
        title: "Port promenade",
        tip: "Good for evening walks and casual bars.",
      },
      {
        title: "Océanopolis aquarium",
        tip: "Large, modern aquarium — strong half-day option.",
      },
      {
        title: "Recouvrance district",
        tip: "Older part of the city with more character.",
      },
      {
        title: "Coastal cliff walks",
        tip: "If weather allows, explore nearby coastline.",
      },
      {
        title: "Matchday – Stade Brestois (Stade Francis-Le Blé)",
        tip: "Traditional ground, passionate home support. Arrive early for local bars.",
      },
      {
        title: "Seafood lunch",
        tip: "Prioritise oysters, mussels, and fish stews.",
      },
      {
        title: "Breton crêperie",
        tip: "Good casual dinner option.",
      },
      {
        title: "Day trip: Crozon Peninsula",
        tip: "Dramatic cliffs and beaches if staying longer.",
      },
    ],

    tips: [
      "Expect functional architecture rather than beauty.",
      "Weather-proof your plans.",
      "Seafood quality is excellent.",
      "Stay central for walkability.",
      "Great destination for travellers who like rough-edged port cities.",
    ],

    food: [
      "Seafood platters",
      "Mussels",
      "Crêpes & galettes",
      "Fish stew",
      "Breton cider",
    ],

    transport: "Compact city. Buses cover most routes.",

    accommodation: "City centre near port or close to stadium.",
  },

  nice: {
    cityId: "nice",
    name: "Nice",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.nice,
    },
    thingsToDoUrl: GYG.nice,

    overview:
      "Nice is one of Europe’s most complete football travel cities because it combines a strong Ligue 1 club, Mediterranean climate, beach culture, historic old town, excellent food, and unbeatable regional connectivity. It works both as a base for Riviera exploration and as a standalone destination with enough depth for several days. Matchdays blend seamlessly into city life, with supporters drifting through Old Town bars, along the seafront, and onto trams heading toward the stadium.",

    topThings: [
      {
        title: "Promenade des Anglais",
        tip: "Walk it end to end once during your trip. Early morning gives calm sea views; sunset brings atmosphere. It anchors the entire city experience.",
      },
      {
        title: "Vieux Nice (Old Town)",
        tip: "Narrow lanes, pastel buildings, bakeries, wine bars, and casual restaurants. This is where most evenings should be spent.",
      },
      {
        title: "Castle Hill (Colline du Château)",
        tip: "Climb or use the lift. Panoramic views over Old Town and the port make this a must-do.",
      },
      {
        title: "Port Lympia",
        tip: "Quieter than the main seafront, with good seafood spots and local bars.",
      },
      {
        title: "Cours Saleya Market",
        tip: "Best in the morning. Flowers, produce, and street food stalls.",
      },
      {
        title: "Beach time",
        tip: "Public pebbled beaches are free. Bring water shoes if sensitive to stones.",
      },
      {
        title: "Matchday – OGC Nice (Allianz Riviera)",
        tip: "Tram ride from centre. Arrive early to soak in pre-match atmosphere around the stadium concourse.",
      },
      {
        title: "Monaco day trip",
        tip: "20 minutes by train. Easy combination with Nice stay.",
      },
      {
        title: "Èze village",
        tip: "Half-day trip with spectacular hilltop views.",
      },
      {
        title: "Antibes",
        tip: "Charming old town and beaches. Easy train ride.",
      },
    ],

    tips: [
      "Base yourself near Old Town or Jean Médecin for walkability.",
      "Book restaurants on Friday and Saturday nights.",
      "Use trains, not taxis, along the coast.",
      "Nice is relaxed — daytime casual, smart-casual evenings.",
      "Summer fixtures can be hot; hydrate heavily.",
    ],

    food: ["Socca", "Salade Niçoise", "Seafood pasta", "Fresh pastries", "Gelato"],

    transport:
      "Excellent tram network and regional trains. Allianz Riviera served by tram.",

    accommodation:
      "Old Town for character, Jean Médecin for transport access, Port area for calmer stays.",
  },

  lehavre: {
    cityId: "lehavre",
    name: "Le Havre",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.lehavre,
    },
    thingsToDoUrl: GYG.lehavre,

    overview:
      "Le Havre is a rebuilt modernist port city with a strong working-class identity, UNESCO-listed architecture, and deep maritime heritage. It feels very different from postcard France, which makes it appealing for travellers who like authentic, non-touristy destinations. Football fits naturally here: practical, honest, and community-driven. A Le Havre trip works best when paired with Normandy coastal exploration or Rouen.",

    topThings: [
      {
        title: "City Centre Modernist Architecture",
        tip: "Rebuilt after WWII. Walk the grid to understand the city’s unique design.",
      },
      {
        title: "St Joseph’s Church",
        tip: "Iconic concrete tower visible across the city. Go inside for light effects.",
      },
      {
        title: "Hanging Gardens",
        tip: "Clifftop botanical gardens with views over the port.",
      },
      {
        title: "Le Havre Beach",
        tip: "Wide pebble beach, strong winds. Best for walks rather than swimming.",
      },
      {
        title: "Port area",
        tip: "Core of city identity. Walk and observe shipping activity.",
      },
      {
        title: "Matchday – Le Havre AC (Stade Océane)",
        tip: "Modern stadium. Arrive early to see local supporters gathering.",
      },
      {
        title: "Seafood dinner",
        tip: "Normandy seafood quality is excellent.",
      },
      {
        title: "Honfleur day trip",
        tip: "Pretty harbour town 30 minutes away.",
      },
      {
        title: "Étretat cliffs",
        tip: "Famous white cliffs and natural arches.",
      },
      {
        title: "Rouen",
        tip: "Historic old town and cathedral.",
      },
    ],

    tips: [
      "Expect a functional rather than beautiful cityscape.",
      "Windproof jacket recommended year-round.",
      "Good value hotels compared to Paris.",
      "Public transport easiest to stadium.",
      "Combine with other Normandy stops.",
    ],

    food: [
      "Seafood platters",
      "Moules-frites",
      "Normandy cheeses",
      "Apple tart",
      "Cider",
    ],

    transport: "Tram and buses cover city. Trains to Rouen and Paris.",

    accommodation: "City centre or near waterfront.",
  },

  nantes: {
    cityId: "nantes",
    name: "Nantes",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.nantes,
    },
    thingsToDoUrl: GYG.nantes,

    overview:
      "Nantes is one of France’s most liveable large cities: youthful, creative, culturally ambitious, and built around the Loire River. It blends medieval heritage, industrial reinvention, strong food culture, and a proud football tradition. Nantes works brilliantly for long weekends because it balances sightseeing, nightlife, and relaxed pacing.",

    topThings: [
      {
        title: "Château des Ducs de Bretagne",
        tip: "Central castle with museum and ramparts. Start here to understand the city.",
      },
      {
        title: "Les Machines de l’Île",
        tip: "Giant mechanical elephant and industrial art park. Unique experience.",
      },
      {
        title: "Trentemoult",
        tip: "Colourful fishing village across the river. Ferry ride adds charm.",
      },
      {
        title: "Bouffay district",
        tip: "Historic core with bars and restaurants.",
      },
      {
        title: "Île de Nantes riverside",
        tip: "Regenerated creative area with cafés and galleries.",
      },
      {
        title: "Matchday – FC Nantes (Stade de la Beaujoire)",
        tip: "Traditional stadium. Passionate support. Tram access.",
      },
      {
        title: "Jardin des Plantes",
        tip: "Large botanical gardens near station.",
      },
      {
        title: "Wine bars",
        tip: "Muscadet region nearby. Focus on Loire whites.",
      },
      {
        title: "Atlantic coast day trip",
        tip: "La Baule or Pornic within reach.",
      },
      {
        title: "Evening riverside walk",
        tip: "Relaxed atmosphere and good casual dining.",
      },
    ],

    tips: [
      "Compact centre — walk most places.",
      "Book Machines de l’Île in advance in summer.",
      "Tram easiest way to stadium.",
      "Good nightlife without being rowdy.",
      "Great balance of culture and football.",
    ],

    food: [
      "Seafood",
      "Galettes",
      "Muscadet wine",
      "Duck dishes",
      "French pastries",
    ],

    transport: "Excellent tram network. Trains to Paris in ~2 hours.",

    accommodation: "Bouffay or city centre near castle.",
  },

  auxerre: {
    cityId: "auxerre",
    name: "Auxerre",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.auxerre,
    },
    thingsToDoUrl: GYG.auxerre,

    overview:
      "Auxerre is a compact, historic Burgundy town that feels purpose-built for slow, atmospheric football travel. It sits on the Yonne River, surrounded by rolling vineyards, medieval streets, timber-framed houses, and wine culture that quietly underpins everyday life. Unlike major French cities, Auxerre is intimate and walkable, meaning your entire trip naturally centres on the old town, riverfront, local bars, and matchday rituals. For football travellers, AJ Auxerre offers one of the most traditional provincial club experiences in France: strong local identity, loyal support, and a stadium woven into the fabric of the town rather than isolated on the outskirts. Auxerre is ideal for travellers who value authenticity over spectacle, and who want football to feel like part of daily life rather than an event disconnected from the city.",

    topThings: [
      {
        title: "Auxerre Old Town (Centre Historique)",
        tip: "Spend several hours wandering slowly. The joy is in discovering small wine bars, bakeries, and timber-framed streets rather than ticking sights.",
      },
      {
        title: "Saint-Étienne Cathedral",
        tip: "Go inside for the stained glass and crypt, then walk around the exterior to appreciate its position above the river.",
      },
      {
        title: "Clock Tower (Tour de l’Horloge)",
        tip: "Central meeting point and natural anchor for exploring the old town.",
      },
      {
        title: "Yonne River Walk",
        tip: "Walk along the river in late afternoon or early evening. Calm, scenic, and very local.",
      },
      {
        title: "Abbey of Saint-Germain",
        tip: "Historic abbey complex with museum and crypts. Good cultural counterbalance to football focus.",
      },
      {
        title: "Wine cellar visit",
        tip: "Burgundy is the identity of the region. Even a short tasting adds depth to the trip.",
      },
      {
        title: "Matchday – AJ Auxerre (Stade de l’Abbé-Deschamps)",
        tip: "Arrive early and walk from town along the river. The approach builds atmosphere naturally.",
      },
      {
        title: "Local bistro lunch",
        tip: "Choose a small traditional restaurant away from the main square for better value and atmosphere.",
      },
      {
        title: "Burgundy countryside drive",
        tip: "If you have a car, small villages and vineyards surround Auxerre.",
      },
      {
        title: "Evening wine bars",
        tip: "Quiet, conversational atmosphere rather than nightlife clubs.",
      },
    ],

    tips: [
      "Auxerre works best as a 1–2 night stay.",
      "Most places close early on Sundays — plan meals ahead.",
      "Book match tickets early if AJ Auxerre are pushing for promotion or playing big opponents.",
      "Expect a slower pace than big cities.",
      "English is less widely spoken than Paris — basic French helps.",
    ],

    food: [
      "Boeuf bourguignon",
      "Coq au vin",
      "Charcuterie boards",
      "Local cheeses",
      "Burgundy red and white wines",
    ],

    transport:
      "Auxerre station connects to Paris in around 2 hours. Town is largely walkable. Stadium reachable on foot from centre.",

    accommodation:
      "Old Town near Clock Tower or riverside for walkability and atmosphere.",
  },

  metz: {
    cityId: "metz",
    name: "Metz",
    country: "France",
    bookingLinks: {
      thingsToDo: GYG.metz,
    },
    thingsToDoUrl: GYG.metz,

    overview:
      "Metz is one of France’s most underrated historic cities, combining French and Germanic influences through centuries of shifting borders. It has a grand cathedral, elegant old town, rivers, and a relaxed pace that makes it excellent for weekend football travel. FC Metz represents deep regional identity, with strong local support and a reputation for developing talent. Metz is not about blockbuster sightseeing; it is about atmosphere, walkability, architectural beauty, good food, and football embedded into daily life. It suits travellers who appreciate understated cities with real character rather than polished tourist centres.",

    topThings: [
      {
        title: "Metz Cathedral (Saint-Étienne)",
        tip: "Go inside for stained glass — among the best in Europe. Allow proper time.",
      },
      {
        title: "Place de la Comédie & Opera area",
        tip: "Photogenic square and good base for cafés.",
      },
      {
        title: "Old Town (Centre-Ville Historique)",
        tip: "Walk without a route. Stone streets, small squares, and shops are the appeal.",
      },
      {
        title: "Centre Pompidou-Metz",
        tip: "Strong modern art museum and architectural landmark.",
      },
      {
        title: "Moselle river walks",
        tip: "Flat, scenic, relaxing, good before dinner.",
      },
      {
        title: "Matchday – FC Metz (Stade Saint-Symphorien)",
        tip: "Atmospheric stadium on river island. Arrive early to experience supporter build-up.",
      },
      {
        title: "Local brasseries",
        tip: "Classic French-German influenced menus.",
      },
      {
        title: "Wine bar evening",
        tip: "Lorraine and nearby Alsace wines widely available.",
      },
      {
        title: "Day trip: Nancy",
        tip: "Elegant squares and architecture under 1 hour away.",
      },
      {
        title: "Day trip: Luxembourg City",
        tip: "International flavour and old town scenery.",
      },
    ],

    tips: [
      "Metz centre is compact and walkable.",
      "Evenings are calm rather than party-focused.",
      "Book match tickets early for derby fixtures.",
      "Cold winters — pack accordingly.",
      "Good value compared to Paris or Strasbourg.",
    ],

    food: [
      "Quiche Lorraine",
      "Choucroute garnie",
      "Pâté en croûte",
      "Tarts and pastries",
      "Alsace white wines",
    ],

    transport:
      "High-speed trains to Paris, Strasbourg, and Luxembourg. Stadium reachable by bus or tram.",

    accommodation: "City centre near cathedral or river.",
  },
};

export default ligue1CityGuides;
