// src/data/cityGuides/serieA.ts
import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * If a city doesn't have a clean verified GYG landing page, leave it undefined and
 * let UI fall back to buildAffiliateLinks({ city }).experiencesUrl.
 */
const GYG = {
  milan:
    "https://www.getyourguide.com/en-gb/milan-l139/?partner_id=MAQJREP&utm_medium=online_publisher",
  rome:
    "https://www.getyourguide.com/en-gb/rome-l33/?partner_id=MAQJREP&utm_medium=online_publisher",
  naples:
    "https://www.getyourguide.com/en-gb/naples-l162/?partner_id=MAQJREP&utm_medium=online_publisher",
  turin:
    "https://www.getyourguide.com/en-gb/turin-l52/?partner_id=MAQJREP&utm_medium=online_publisher",
  como:
    "https://www.getyourguide.com/en-gb/lake-como-l63/?partner_id=MAQJREP&utm_medium=online_publisher",
  bologna:
    "https://www.getyourguide.com/en-gb/bologna-l1431/?partner_id=MAQJREP&utm_medium=online_publisher",
  genoa:
    "https://www.getyourguide.com/en-gb/genoa-l1009/?partner_id=MAQJREP&utm_medium=online_publisher",
  florence:
    "https://www.getyourguide.com/en-gb/florence-l32/?partner_id=MAQJREP&utm_medium=online_publisher",
  verona:
    "https://www.getyourguide.com/en-gb/verona-l389/?partner_id=MAQJREP&utm_medium=online_publisher",
  pisa:
    "https://www.getyourguide.com/en-gb/pisa-l157/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const serieACityGuides: Record<string, CityGuide> = {
  milan: {
    cityId: "milan",
    name: "Milan",
    country: "Italy",
    thingsToDoUrl: GYG.milan,

    overview:
      "Milan is Italy’s most efficient big city: fast transport, a walkable core, and a ‘do the highlights, then eat well’ rhythm that suits short breaks. It’s also a huge events city, so match weekends and major shows can spike hotel prices and crowd the metro. The trip is best when you plan by neighbourhood blocks and keep matchday logistics boring and predictable.",

    topThings: [
      {
        title: "Duomo di Milano + rooftop terraces",
        tip: "Book rooftop access ahead and go early or late afternoon. Rooftop is the real payoff—then move away from the square for better-value food.",
      },
      {
        title: "Galleria Vittorio Emanuele II loop",
        tip: "Treat it as a 15–20 minute walk-through. If you want a splurge coffee moment, do it here—otherwise save budget for dinner elsewhere.",
      },
      {
        title: "Teatro alla Scala area",
        tip: "Quick exterior hit if you’re not doing the museum. Evening performances increase crowds—factor that into your centre timings.",
      },
      {
        title: "Brera district",
        tip: "Best late afternoon into evening. Pick one anchor (gallery or dinner), then wander. Set a spend limit—Brera is built to tempt you.",
      },
      {
        title: "Sforzesco Castle + Parco Sempione",
        tip: "Do a targeted visit (not a museum marathon), then use the park as a reset. Great mid-day pacing tool.",
      },
      {
        title: "Navigli canals (evening)",
        tip: "Sunset onwards is the window. Choose one solid dinner/aperitivo spot, then walk—don’t trap yourself in tourist menus.",
      },
      {
        title: "The Last Supper (Santa Maria delle Grazie)",
        tip: "Strict ticket territory: if you want it, book early. If you miss out, don’t waste time chasing it—pivot to Brera or food.",
      },
      {
        title: "Porta Nuova + Piazza Gae Aulenti",
        tip: "Your ‘modern Milan’ contrast block. Best as a short photo walk + café, not a whole day.",
      },
      {
        title: "Shopping strategy",
        tip: "Quadrilatero is mainly window-shopping unless you’re luxury spending. Cap it hard if you’re here for the trip experience.",
      },
      {
        title: "Matchday logistics (San Siro)",
        tip: "Plan your route and return before you leave the hotel. Build buffer for metro crowds and post-match queues.",
      },
    ],

    tips: [
      "Plan by neighbourhood blocks (Centre → Brera/Sempione → Navigli). Criss-crossing wastes hours.",
      "Aperitivo varies wildly: sometimes snacks, sometimes a spread. Decide if it’s your meal or a warm-up.",
      "Avoid Duomo-adjacent tourist-menu restaurants—walk 5–10 minutes and quality/price improves fast.",
      "Airport realism: Linate is the short-break winner; Malpensa adds time; Bergamo can be cheap but slow door-to-door.",
      "If you’re going to a match, don’t book tight dinner times around kickoff/full time unless you’re staying nearby.",
      "Save key links and confirmations in your Trip Hub so you’re not searching while rushing.",
    ],

    food: [
      "Aperitivo in Navigli (pick one strong spot, then walk the canals)",
      "Risotto alla Milanese (do it properly once)",
      "Cotoletta alla Milanese (plan it as a proper meal)",
      "Panzerotti / quick street food between areas",
      "Gelato quality rule: natural colours, covered tins (avoid neon mountains)",
      "Espresso value: drink at the bar; sitting costs more",
    ],

    transport:
      "Metro + walking is the backbone. Use metro for cross-city jumps, then walk within each neighbourhood block. For San Siro, metro is usually the cleanest option—timing and patience matter.",

    accommodation:
      "Best practical bases: Duomo/Missori/Cordusio for first-timers, Brera/Moscova for a more ‘Milan’ feel, Navigli/Porta Genova for nightlife, Porta Nuova/Centrale corridor for modern hotels (check noise and exact street). Book earlier on event weekends.",
  },

  rome: {
    cityId: "rome",
    name: "Rome",
    country: "Italy",
    thingsToDoUrl: GYG.rome,

    overview:
      "Rome is dense, high-impact, and deceptively tiring: distances look short on maps but feel long on foot. It rewards travellers who plan geographically, build rest windows, and accept that you won’t ‘complete’ the city in a weekend. For football travellers, matchday works best when you plan transport early and avoid last-minute decisions.",

    topThings: [
      {
        title: "Colosseum + Forum + Palatine",
        tip: "Book timed entry ahead. Early morning is the only sane option in peak months. Allow 2–3 hours if doing all properly.",
      },
      {
        title: "Vatican Museums + Sistine Chapel",
        tip: "Earliest slot possible. Later in the day is more crowded and more exhausting.",
      },
      {
        title: "St Peter’s Basilica + Dome",
        tip: "Arrive early, dress code matters, dome climb gives the best panoramic payoff.",
      },
      {
        title: "Pantheon",
        tip: "Go early or late evening for calmer conditions.",
      },
      {
        title: "Trevi Fountain",
        tip: "Before 8am or after 11pm. Midday is a crush and not enjoyable.",
      },
      {
        title: "Piazza Navona evening loop",
        tip: "Good for a stroll—eat two streets away from the square for value.",
      },
      {
        title: "Trastevere nights",
        tip: "Wander first, then pick somewhere busy with locals. It’s an evening district, not a daytime checklist.",
      },
      {
        title: "Villa Borghese park reset",
        tip: "Perfect between heavy sightseeing blocks. Don’t stack big sights without a reset.",
      },
      {
        title: "Castel Sant’Angelo + river walk",
        tip: "Strong viewpoint and a clean connector block.",
      },
      {
        title: "Matchday travel plan",
        tip: "Assume taxis are unreliable after full time. Build buffers and have a clear route both ways.",
      },
    ],

    tips: [
      "Comfortable trainers are non-negotiable—Rome destroys weak footwear.",
      "One major sight block in the morning, lighter wandering afternoon, food-focused evenings is the right rhythm.",
      "Avoid photo-menu restaurants and aggressive hosts pulling you inside.",
      "Carry water; use public fountains to refill.",
      "Book key dinners Fri–Sun if you care where you eat—walk-ins get punished.",
      "Save your confirmed links/addresses in Trip Hub so you’re not hunting under pressure.",
    ],

    food: [
      "Carbonara",
      "Cacio e pepe",
      "Amatriciana",
      "Supplì",
      "Pizza al taglio",
      "Gelato from reputable shops (avoid neon colours)",
    ],

    transport:
      "Metro is fast where it exists; buses cover more but can be slow. Walking is often best in the historic centre. Build a 30–40 minute buffer when travelling to/from stadium areas on matchday.",

    accommodation:
      "Centro Storico and Monti are best for sightseeing access. Trastevere is ideal for nightlife. Vatican area is quieter and good for early starts. Prioritise proximity to a good transport corridor over being ‘central’ on paper.",
  },

  naples: {
    cityId: "naples",
    name: "Naples",
    country: "Italy",
    thingsToDoUrl: GYG.naples,

    overview:
      "Naples is intense, loud, and genuinely rewarding—an unfiltered city where everyday life and tourism overlap completely. If you embrace the character and plan logistics properly, you get world-class food, powerful street atmosphere, and one of Europe’s best ‘real’ football-weekend backdrops.",

    topThings: [
      {
        title: "Centro Storico / Spaccanapoli walk",
        tip: "Late morning or early evening is the sweet spot. Expect crowds, noise, scooters, and street food—this is the point.",
      },
      {
        title: "Napoli Sotterranea",
        tip: "Book ahead. Adds real historical context and breaks up the street intensity.",
      },
      {
        title: "National Archaeological Museum",
        tip: "Essential if doing Pompeii/Herculaneum. Allow 2–3 hours.",
      },
      {
        title: "Castel dell’Ovo + Lungomare",
        tip: "Easy high-payoff waterfront block—great at golden hour.",
      },
      {
        title: "Vomero + Castel Sant’Elmo views",
        tip: "Use funiculars. Cooler air and strong panoramas.",
      },
      {
        title: "Pompeii day trip",
        tip: "Go early. Half-day minimum. Don’t cram it before a match unless you love stress.",
      },
      {
        title: "Herculaneum alternative",
        tip: "Smaller and often better preserved than Pompeii—strong choice if time-limited.",
      },
      {
        title: "Pizza trail",
        tip: "Expect queues. Pick 1–2 iconic spots and commit rather than wandering hungry.",
      },
      {
        title: "Quartieri Spagnoli daylight loop",
        tip: "Great for murals and texture—best in daylight.",
      },
      {
        title: "Matchday planning block",
        tip: "Arrive early and expect crowding on return. Build buffer and don’t book tight post-match plans.",
      },
    ],

    tips: [
      "Naples can feel rougher than other Italian cities—keep your awareness up, but don’t dramatise it.",
      "Pickpocket risk is real: zip pockets, don’t flash your phone.",
      "Eat late (8pm+). Earlier evenings can feel quiet.",
      "Metro is your friend; taxis are not a reliable plan around matches.",
      "Wear proper shoes—pavements and streets are unforgiving.",
      "Save your confirmed addresses and travel links in Trip Hub before matchday.",
    ],

    food: [
      "Neapolitan Margherita",
      "Marinara",
      "Pizza fritta",
      "Sfogliatella",
      "Babà",
      "Seafood pasta",
      "Fast espresso at the bar",
    ],

    transport:
      "Metro Line 1 serves the centre; Line 2 connects key western corridors. Circumvesuviana trains serve Pompeii/Herculaneum. Funiculars make Vomero easy. Always add buffer—delays happen.",

    accommodation:
      "Centro Storico for atmosphere and walkability. Chiaia for calmer, cleaner-feeling evenings. Vomero for quieter stays with strong transport. Avoid remote areas unless you’re right by a metro stop.",
  },

  turin: {
    cityId: "turin",
    name: "Turin",
    country: "Italy",
    thingsToDoUrl: GYG.turin,

    overview:
      "Turin is orderly, elegant, and quietly wealthy—grand boulevards, arcades, and an Alpine edge. It’s a great football-weekend city because logistics are easier than Rome/Naples and the centre feels liveable. The trip works best when you cluster sights and plan one strong museum block plus food-focused evenings.",

    topThings: [
      {
        title: "Mole Antonelliana + Cinema Museum",
        tip: "Take the lift for views. Time it near sunset if weather is clear.",
      },
      {
        title: "Piazza Castello + Royal sites",
        tip: "Do early for calm and clean photos.",
      },
      {
        title: "Egyptian Museum",
        tip: "Book ahead on weekends; allow 2–3 hours.",
      },
      {
        title: "Quadrilatero Romano evenings",
        tip: "Dense bars and restaurants—ideal for nights.",
      },
      {
        title: "Parco del Valentino river walk",
        tip: "Great mid-day reset.",
      },
      {
        title: "Superga viewpoint",
        tip: "Go if skies are clear; it’s about views and atmosphere.",
      },
      {
        title: "Porta Palazzo market",
        tip: "Morning is best. Go hungry.",
      },
      {
        title: "Historic cafés (chocolate culture)",
        tip: "Do one proper ‘Turin café’ stop—this city does it better than most.",
      },
      {
        title: "One football block (tour or museum)",
        tip: "Book ahead on match weekends if you want it to be smooth.",
      },
      {
        title: "Matchday route planning",
        tip: "Pick your pre-match area, then move with intent. Don’t improvise across the city last-minute.",
      },
    ],

    tips: [
      "Plan by neighbourhood clusters; the city is walkable but not tiny.",
      "Some restaurants close between lunch and dinner—check hours.",
      "English is less universal than Milan/Rome; basic Italian helps.",
      "Trams are genuinely useful—learn one or two routes and your life gets easier.",
      "Cold winters are real—pack accordingly.",
    ],

    food: [
      "Vitello tonnato",
      "Agnolotti",
      "Gianduja chocolate",
      "Bicerin (coffee + chocolate drink)",
      "Hazelnut desserts",
    ],

    transport:
      "Metro Line 1 plus a strong tram network makes Turin easy. Walking covers the centre; trams handle longer jumps reliably.",

    accommodation:
      "Centro for sightseeing. Crocetta for quieter stays. Near Porta Nuova if transport is your priority. Avoid far suburbs unless you’re right on metro/tram.",
  },

  como: {
    cityId: "como",
    name: "Como",
    country: "Italy",
    thingsToDoUrl: GYG.como,

    overview:
      "Como is football woven into a postcard lake break: waterfront walks, mountain views, slow lunches, then an evening match. It’s best when you treat it like a mini-holiday rather than trying to stack a ‘big city’ itinerary.",

    topThings: [
      {
        title: "Lakefront promenade",
        tip: "Golden hour is the money shot. Walk from the ferry area and keep it slow.",
      },
      {
        title: "Funicular to Brunate",
        tip: "Go late afternoon for panoramic views; bring a layer—temps can drop.",
      },
      {
        title: "Boat trip (Bellagio or Varenna)",
        tip: "Half-day return works well. Check seasonal timetables.",
      },
      {
        title: "Como Cathedral (Duomo)",
        tip: "Quick interior visit, then coffee nearby.",
      },
      {
        title: "Old Town wandering",
        tip: "Compact and flat—ideal for drifting without a plan.",
      },
      {
        title: "Villa Olmo gardens",
        tip: "Easy add-on walk from centre.",
      },
      {
        title: "Aperitivo by the water",
        tip: "Make it a ritual: one good spot, slow pacing.",
      },
      {
        title: "Enoteca wine stop",
        tip: "Step away from ferry crowds for better value.",
      },
      {
        title: "Scenic viewpoint block",
        tip: "Choose one elevated view (Brunate or a short hike)—don’t chase five.",
      },
      {
        title: "Matchday lakefront walk-in",
        tip: "Do the stadium approach on foot from centre—low stress, high vibe.",
      },
    ],

    tips: [
      "Weekend restaurants fill fast—reserve if you care.",
      "Weather changes quickly near the mountains—pack layers.",
      "Avoid driving into the historic centre.",
      "Boat schedules drop in winter—plan around reality, not hope.",
    ],

    food: [
      "Lake fish specials (when available)",
      "Risotto",
      "Polenta dishes",
      "Northern Italian cured meats",
      "Gelato by the water (quality-filter it)",
    ],

    transport:
      "Como has direct rail links to Milan (~40 minutes). Town is walkable; ferries connect the lake towns; the funicular makes Brunate easy.",

    accommodation:
      "Old Town or waterfront for atmosphere. Near Como San Giovanni station for Milan access. Hillside hotels give views but add taxi reliance.",
  },

  bergamo: {
    cityId: "bergamo",
    name: "Bergamo",
    country: "Italy",

    overview:
      "Bergamo is two cities in one: medieval Città Alta on the hill and the modern lower city below. It’s compact, atmospheric, and ideal for a football weekend because you can do a high-impact historic day, then keep matchday simple without big-city chaos.",

    topThings: [
      {
        title: "Città Alta wandering",
        tip: "Enter via funicular and wander without a map. That’s the correct way.",
      },
      {
        title: "Piazza Vecchia",
        tip: "Coffee and people-watching. Don’t rush it.",
      },
      {
        title: "Basilica di Santa Maria Maggiore",
        tip: "High payoff interior—combine with the Cathedral next door.",
      },
      {
        title: "Venetian Walls walk",
        tip: "UNESCO views over Lombardy. Best near sunset.",
      },
      {
        title: "Funicular ride",
        tip: "Simple but iconic; it stitches the city together.",
      },
      {
        title: "Lower city café strip",
        tip: "Useful for downtime and a calmer pace.",
      },
      {
        title: "Enoteca stop",
        tip: "Try regional wines—don’t default to generic lists.",
      },
      {
        title: "Parco dei Colli",
        tip: "If you want a light hike and fresh air outside the stone streets.",
      },
      {
        title: "Gelato loop",
        tip: "Quality gelaterias cluster in Città Alta—easy win.",
      },
      {
        title: "Matchday early approach",
        tip: "Arrive early and keep the rest of the day light so you’re not exhausted.",
      },
    ],

    tips: [
      "Base near the funicular or central Lower City for the easiest ‘both halves’ access.",
      "Upper City streets are steep—shoes matter.",
      "Bergamo airport proximity is a real advantage—use it for short-break efficiency.",
      "Book Fri/Sat dinners; options compress on weekends.",
    ],

    food: [
      "Casoncelli (local stuffed pasta)",
      "Polenta + hearty sauces",
      "Local cheeses",
      "Espresso at the bar",
    ],

    transport:
      "Walking + buses cover most areas; funicular connects Upper/Lower. Frequent trains connect Bergamo–Milan.",

    accommodation:
      "Upper City for romance; Lower City near the funicular for balance and convenience; near the station if you’re doing lots of rail travel.",
  },

  bologna: {
    cityId: "bologna",
    name: "Bologna",
    country: "Italy",
    thingsToDoUrl: GYG.bologna,

    overview:
      "Bologna is one of Italy’s best all-round cities: medieval streets, endless porticos, and a food culture that’s the real headline. It’s less chaotic than Rome and less glossy than Milan, so it’s ideal for a football weekend where the trip still feels relaxed.",

    topThings: [
      {
        title: "Piazza Maggiore",
        tip: "Sit with coffee or aperitivo and watch the city flow. Simple, high-value.",
      },
      {
        title: "Two Towers area",
        tip: "Climb early if you’re doing it; it’s a leg workout and queues grow fast.",
      },
      {
        title: "Portico walks",
        tip: "Use them strategically—perfect in heat or rain.",
      },
      {
        title: "Quadrilatero food streets",
        tip: "Snack your way through delis and wine bars. Don’t force a big sit-down here.",
      },
      {
        title: "Archiginnasio",
        tip: "Quick cultural hit with real character.",
      },
      {
        title: "Santo Stefano complex",
        tip: "Atmospheric cluster that feels distinct from the main squares.",
      },
      {
        title: "Via Zamboni/student energy",
        tip: "Louder, cheaper, more nightlife-adjacent.",
      },
      {
        title: "Giardini Margherita reset",
        tip: "Good mid-day breathing space.",
      },
      {
        title: "San Luca viewpoint",
        tip: "Do it if you want a ‘signature’ walk. Don’t attempt it right before matchday.",
      },
      {
        title: "Matchday timing",
        tip: "Arrive early and have your pre-match food plan locked—stadium area is residential.",
      },
    ],

    tips: [
      "Bologna is very walkable—stay central and your trip becomes effortless.",
      "Book weekend dinners; Bologna is popular and kitchens fill.",
      "Lunch hours matter—many places close mid-afternoon.",
      "Avoid tourist menus near the most obvious squares; quality improves one street away.",
      "Use porticos to pace the day and keep energy for matchday.",
    ],

    food: [
      "Tagliatelle al ragù (real Bolognese)",
      "Tortellini in brodo",
      "Mortadella done properly",
      "Lasagne verdi",
      "Lambrusco with food",
    ],

    transport:
      "Walking dominates the centre; buses fill gaps. Bologna Centrale is a major hub—great for onward travel and day trips.",

    accommodation:
      "Historic centre near Piazza Maggiore is best for most travellers. University quarter if nightlife is the priority. Near the station if you want maximal rail convenience.",
  },

  udine: {
    cityId: "udine",
    name: "Udine",
    country: "Italy",

    overview:
      "Udine is a refined northeastern city with Venetian-style squares, excellent regional food, and a calmer pace than Italy’s big tourist magnets. It’s ideal for travellers who want authenticity and an easy logistics weekend rather than headline attractions.",

    topThings: [
      {
        title: "Piazza Libertà",
        tip: "Go early morning or golden hour—best light, calmer atmosphere.",
      },
      {
        title: "Udine Castle viewpoint",
        tip: "Short uphill walk for rooftops and wide plains views.",
      },
      {
        title: "Via Mercatovecchio café loop",
        tip: "The city’s daily-life spine—perfect for slow walking and stops.",
      },
      {
        title: "Piazza Matteotti evening base",
        tip: "A strong drinks/dinner square without big-city chaos.",
      },
      {
        title: "Cathedral quick stop",
        tip: "Peaceful interior—good pacing tool.",
      },
      {
        title: "Tiepolo art option",
        tip: "For art lovers—targeted visit, not a full-day museum marathon.",
      },
      {
        title: "Short park reset",
        tip: "Use green space near the centre to protect your energy.",
      },
      {
        title: "Cividale del Friuli day trip",
        tip: "Easy add-on if you have spare time; don’t force it into a tight weekend.",
      },
      {
        title: "Friuli wine bar",
        tip: "Ask for regional whites—this is what Friuli does best.",
      },
      {
        title: "Matchday route planning",
        tip: "Know your route to/from the ground early; suburban stadium areas are less intuitive.",
      },
    ],

    tips: [
      "Centre is compact and walkable—choose central accommodation and keep it simple.",
      "English is less common than in Rome/Milan; basic Italian helps.",
      "Restaurants can close earlier than southern Italy—plan meals deliberately.",
      "This is a ‘quality over quantity’ weekend city.",
    ],

    food: [
      "Frico (cheese + potato dish)",
      "Prosciutto di San Daniele",
      "Cjarsons (local pasta)",
      "Polenta",
      "Friuli white wines",
    ],

    transport:
      "Walkable centre with buses for outer areas. Udine station connects well to Venice, Trieste, and cross-border routes.",

    accommodation:
      "Historic centre or near the station for convenience. Prioritise walkability to your evening food/drinks zone.",
  },

  sassuolo: {
    cityId: "sassuolo",
    name: "Sassuolo",
    country: "Italy",

    overview:
      "Sassuolo is not a classic standalone city break. The smart play is using it as a football anchor inside a wider Emilia-Romagna weekend (often based in Bologna or Modena). Your trip value comes from food, nearby cities, and clean matchday logistics—trying to force a big sightseeing itinerary here will feel thin.",

    topThings: [
      {
        title: "Palazzo Ducale di Sassuolo",
        tip: "The main ‘wow’ locally. Check opening days/hours before building plans.",
      },
      {
        title: "Centro Storico slow loop",
        tip: "This is about pacing and cafés, not attractions-per-hour.",
      },
      {
        title: "Local parks reset",
        tip: "Use downtime to keep matchday energy intact.",
      },
      {
        title: "Modena day trip",
        tip: "Best add-on city for food and a compact centre.",
      },
      {
        title: "Maranello (Ferrari territory)",
        tip: "If you want a headline experience nearby, book ahead on weekends.",
      },
      {
        title: "Bologna as main base",
        tip: "Best nightlife and easiest trains; treat Sassuolo as a planned matchday hop.",
      },
      {
        title: "Reggio Emilia stop",
        tip: "If your match routing goes via Reggio, make it a food block rather than a boring transit point.",
      },
      {
        title: "Emilia-Romagna food crawl",
        tip: "This region’s real attraction is eating well. Plan meals like events.",
      },
      {
        title: "Aperitivo → matchday routine",
        tip: "Calm daytime + structured pre-match beats chaotic improvisation.",
      },
      {
        title: "Post-match return plan",
        tip: "Go back to your base for dinner. Stadium-adjacent areas are rarely the best finish.",
      },
    ],

    tips: [
      "Treat Sassuolo as an anchor, not the full weekend base, unless you want quiet by design.",
      "Confirm venue/logistics early and plan last-mile transport—small-town taxi availability can be inconsistent.",
      "Sunday/Monday closures are real—don’t assume everything is open.",
      "If you want the best overall trip experience, Bologna is usually the best base.",
    ],

    food: [
      "Tortellini / tortelloni",
      "Tagliatelle al ragù",
      "Parmigiano Reggiano territory tasting",
      "Traditional balsamic (learn real vs supermarket glaze)",
      "Lambrusco with food",
    ],

    transport:
      "Regional rail/bus links work, but the trip becomes easy when you base in Bologna or Modena and travel in/out with intent. Avoid relying on last-minute taxis from smaller towns.",

    accommodation:
      "Most travellers should base in Bologna (all-round) or Modena (food + calm). Stay in Sassuolo only if you deliberately want a quieter local base.",
  },

  cagliari: {
    cityId: "cagliari",
    name: "Cagliari",
    country: "Italy",

    overview:
      "Cagliari is a proper ‘go away’ break disguised as a football trip: sea views, a walkable historic core, beaches close by, and a slower rhythm that makes weekends feel longer. The key is logistics—flights and base choice—then splitting time between old-town wandering, sea air, and one clean matchday block.",

    topThings: [
      {
        title: "Castello district (historic core)",
        tip: "Do it twice: daylight for views and golden hour for atmosphere. It’s not a one-pass zone.",
      },
      {
        title: "Bastione di Saint Remy",
        tip: "Sunset is the moment—arrive early if you want space.",
      },
      {
        title: "Marina evenings",
        tip: "This is where nights should end. Pick one strong place then drift.",
      },
      {
        title: "Poetto Beach",
        tip: "Half-day minimum. If windy, pivot to café hopping along the beachfront.",
      },
      {
        title: "Sella del Diavolo hike",
        tip: "Early morning, water, proper shoes. Big payoff for moderate effort.",
      },
      {
        title: "Mercato di San Benedetto",
        tip: "Go hungry. Walk first, then choose—this is Sardinia in one hour.",
      },
      {
        title: "Nora day trip",
        tip: "Great non-football cultural anchor; pair with a long coastal lunch.",
      },
      {
        title: "Waterfront stroll",
        tip: "Low effort, high vibe—perfect late afternoon block before dinner.",
      },
      {
        title: "One standout seafood meal",
        tip: "Make it a deliberate ‘event’ meal. It sells the whole trip.",
      },
      {
        title: "Matchday as structured half-day",
        tip: "Calm morning + food block + buffer-time travel beats cramming beach + hike + match.",
      },
    ],

    tips: [
      "Book flights early—Sardinia weekends swing hard on price.",
      "Marina is the best all-round base for evenings and walkability; Poetto is beach-first but needs commuting for nights.",
      "Heat in summer is serious—do active blocks early and use midday for shade/beach.",
      "If travelling with a non-football partner, sell the match as one cultural block inside a Sardinia break.",
    ],

    food: [
      "Seafood in Marina",
      "Malloreddus (Sardinian pasta)",
      "Fregola with seafood",
      "Bottarga (strong, very local)",
      "Seadas (dessert—do it properly once)",
      "Market grazing at San Benedetto",
    ],

    transport:
      "City core is walkable. For beaches/day trips, a rental car or pre-booked transfer makes the trip feel effortless; public transport can work but is slower and schedule-dependent.",

    accommodation:
      "Marina is best for most travellers (evenings + walkability). Castello offers charm and views but steep streets. Stampace is good value and still central. Avoid basing far out on a short 1–2 night trip.",
  },

  genoa: {
    cityId: "genoa",
    name: "Genoa",
    country: "Italy",
    thingsToDoUrl: GYG.genoa,

    overview:
      "Genoa is textured and layered: a dense medieval core, grand seafront architecture, gritty port zones, and a food culture that quietly over-delivers. It’s excellent for football weekends because it feels real and it doubles as a gateway to the Riviera—matchday plus coastal add-ons is the winning formula.",

    topThings: [
      {
        title: "Old Town (caruggi) wander",
        tip: "Don’t over-route it. Wander, get slightly lost, and follow instinct—atmosphere is the point.",
      },
      {
        title: "Porto Antico late afternoon",
        tip: "Perfect transition block: harbour walk → aperitivo → dinner.",
      },
      {
        title: "Via Garibaldi (Palazzi dei Rolli)",
        tip: "Short, high-impact hit. Walking the street delivers most of the payoff.",
      },
      {
        title: "Boccadasse",
        tip: "Go late afternoon; grab focaccia/gelato and sit by the water.",
      },
      {
        title: "Aquarium (low-effort big block)",
        tip: "Great if you want something contained and weather-proof.",
      },
      {
        title: "Nervi promenade",
        tip: "Cliffside coastal walk—strong half-day escape.",
      },
      {
        title: "Camogli day trip",
        tip: "Easy train ride and a high-ROI add-on if you have spare time.",
      },
      {
        title: "Portofino (scenery play)",
        tip: "Beautiful but pricey—treat as photos + short wander, not a spending marathon.",
      },
      {
        title: "Focaccia mission",
        tip: "Try a few versions. Genoa does this better than almost anywhere.",
      },
      {
        title: "Matchday as anchor",
        tip: "Keep the rest of the day lighter so you arrive with energy.",
      },
    ],

    tips: [
      "Stay central if possible—hills make long commutes annoying.",
      "Expect visual contrast (elegant next to gritty). That’s normal here.",
      "Good shoes matter—uneven paving and narrow lanes.",
      "If you’re doing a Riviera add-on, check weather and train times first.",
    ],

    food: [
      "Pesto Genovese (order it)",
      "Focaccia (plain/onion/cheese variants)",
      "Farinata",
      "Seafood pasta",
      "Troffie al pesto",
      "Ligurian whites (Vermentino, Pigato)",
    ],

    transport:
      "Centre is best on foot. Trains are excellent for Riviera trips (Camogli, Nervi, Santa Margherita for Portofino). Plan matchday routing early and add buffer.",

    accommodation:
      "Centro Storico for atmosphere, Porto Antico for convenience, Brignole area for transport links. Avoid being stranded up steep hills unless you’re happy with climbs/taxis.",
  },

  cremona: {
    cityId: "cremona",
    name: "Cremona",
    country: "Italy",

    overview:
      "Cremona is small, elegant, and quietly special—famous for Stradivari and violin-making culture. It’s perfect for a calm football-led weekend: walkable, food-focused, and relaxed. The win is quality over quantity—long lunches, gentle sightseeing, and an easy evening rhythm.",

    topThings: [
      {
        title: "Piazza del Comune",
        tip: "Visit twice: morning for quiet photos, evening for atmosphere and aperitivo.",
      },
      {
        title: "Torrazzo climb",
        tip: "If you’re able, do it—views over Lombardy are worth the effort.",
      },
      {
        title: "Cathedral interior",
        tip: "Step inside even if you’re not a church person—high payoff.",
      },
      {
        title: "Violin Museum",
        tip: "Non-negotiable here. It’s the city’s identity in one place.",
      },
      {
        title: "Luthier workshops",
        tip: "Look for independent makers near the centre; browsing is part of the charm.",
      },
      {
        title: "Po River embankment walk",
        tip: "Late afternoon calm block—good contrast to stone streets.",
      },
      {
        title: "Corso Garibaldi cafés",
        tip: "Simple downtime and people-watching spine.",
      },
      {
        title: "Torrone/pastry crawl",
        tip: "Cremona sweets are a signature—don’t skip.",
      },
      {
        title: "Small wine bar",
        tip: "Focus on local Lombardy labels, not generic lists.",
      },
      {
        title: "Matchday pacing",
        tip: "Keep daytime light so matchday doesn’t feel like a slog.",
      },
    ],

    tips: [
      "Pick central accommodation and forget transport—Cremona is walkable end-to-end.",
      "Book dinner on weekends; options are fewer than big cities.",
      "Expect slower pace and mid-afternoon closures.",
      "If staying longer, pair with a day trip (Milan/Parma) rather than forcing extra sights locally.",
    ],

    food: [
      "Torrone (nougat)",
      "Mostaccino biscuits",
      "Fresh pasta + butter/sage styles",
      "Local cured meats",
      "Grana Padano/cheese culture nearby",
    ],

    transport:
      "Walking covers the city. Trains connect well to Milan and nearby hubs. Matchday: walking or short taxi rides are simplest.",

    accommodation:
      "Stay in/near the historic centre. Anywhere close to Piazza del Comune is ideal. Avoid peripheral industrial zones unless you’re purely sleeping.",
  },

  parma: {
    cityId: "parma",
    name: "Parma",
    country: "Italy",

    overview:
      "Parma is calm, confident, and obsessed with quality—right in the heart of Emilia-Romagna’s food culture. It’s a brilliant football weekend city because you can walk everywhere, eat extremely well, and keep logistics simple. Parma shines when you plan meals deliberately and let the city’s rhythm do the work.",

    topThings: [
      {
        title: "Cathedral + Baptistery block",
        tip: "Do them as one focused block in the morning for the best experience.",
      },
      {
        title: "Teatro Regio area",
        tip: "Even an exterior visit adds cultural weight—Parma takes opera seriously.",
      },
      {
        title: "Parco Ducale reset",
        tip: "Perfect mid-afternoon decompression after sightseeing.",
      },
      {
        title: "Oltretorrente wander",
        tip: "More local-feeling streets, bakeries, and trattorias. Great for drifting.",
      },
      {
        title: "Food producer tour (if time)",
        tip: "Book a morning dairy/producer visit—high ROI if you love food culture.",
      },
      {
        title: "Central shopping spine",
        tip: "More atmosphere than bargains—use it as a connector block.",
      },
      {
        title: "Wine bar evening",
        tip: "Pick one good spot and stay. Parma evenings are calmer, not clubby.",
      },
      {
        title: "Long lunch strategy",
        tip: "Lunch menus are often better value than dinner—use them.",
      },
      {
        title: "Matchday walk-in",
        tip: "Walking to the stadium keeps the day smooth and removes transport stress.",
      },
      {
        title: "One ‘event meal’",
        tip: "Make one standout meal the anchor—this is Parma’s superpower.",
      },
    ],

    tips: [
      "Plan meals more than sights—food is the real headline here.",
      "Book Fri/Sat dinners; kitchens fill.",
      "You don’t need a car unless doing countryside tours.",
      "Service is slower by design—don’t try to rush meals before matchday.",
    ],

    food: [
      "Parmigiano Reggiano (different ages)",
      "Prosciutto di Parma",
      "Culatello di Zibello (if you find it)",
      "Tortelli d’erbetta",
      "Anolini in brodo",
      "Lambrusco with local dishes",
    ],

    transport:
      "Parma is compact and walkable. Station connects well to Milan/Bologna/Modena/Reggio. Taxis are simple within the city when needed.",

    accommodation:
      "Stay in the historic centre or near Parco Ducale for best feel. Central location beats luxury add-ons for short breaks.",
  },

  lecce: {
    cityId: "lecce",
    name: "Lecce",
    country: "Italy",

    overview:
      "Lecce is the cultural jewel of Salento: honey-coloured stone, ornate Baroque architecture, and a slow evening rhythm built around aperitivo and late dinners. It’s perfect for a football-led weekend because the centre is compact, atmospheric, and still gives you easy access to coastline add-ons if you have time.",

    topThings: [
      {
        title: "Basilica di Santa Croce",
        tip: "Circle the façade and take time with the detail. Golden hour makes the stone glow.",
      },
      {
        title: "Piazza del Duomo at night",
        tip: "Go after dinner when it’s softly lit and quieter—film-set vibes.",
      },
      {
        title: "Roman Amphitheatre (Sant’Oronzo)",
        tip: "Use it as your anchor point for city loops. It’s woven into everyday life.",
      },
      {
        title: "Baroque wandering loop",
        tip: "The real experience is drifting: side streets, small churches, artisan shops, pauses for coffee.",
      },
      {
        title: "Museo Faggiano",
        tip: "Compact, story-driven, and memorable—great on a tight weekend.",
      },
      {
        title: "Porta Napoli",
        tip: "Quick photo + context stop; return via smaller streets for better atmosphere.",
      },
      {
        title: "Otranto day trip",
        tip: "Calmer and pretty—best ‘first pick’ coastal add-on if you want one.",
      },
      {
        title: "Gallipoli day trip",
        tip: "More lively and social—choose this if you want energy and sunset scenes.",
      },
      {
        title: "Proper aperitivo session",
        tip: "Don’t rush. Do it the southern way, then dinner later.",
      },
      {
        title: "Matchday pacing",
        tip: "Treat matchday as its own block—don’t cram heavy sightseeing right up to kickoff.",
      },
    ],

    tips: [
      "One ‘sight block’ per day is enough—leave space to wander.",
      "In peak summer, sightsee early/late and hide in shade midday.",
      "Book your best dinners Fri/Sat—match weekends tighten availability.",
      "If doing a coastal day trip, pick one (Otranto or Gallipoli) rather than rushing both.",
    ],

    food: [
      "Pasticciotto (best warm)",
      "Rustico leccese",
      "Orecchiette and local pasta dishes",
      "Frisella (great in warm weather)",
      "Regional reds (Negroamaro/Primitivo)",
      "Amaro to finish the meal properly",
    ],

    transport:
      "Historic centre is walkable. For Salento coast day trips, trains/buses can work but vary; a rental car or pre-booked transfers make it significantly easier and more flexible.",

    accommodation:
      "Stay in/near the historic centre to maximise evenings and walkability. If you’re doing beach-first, decide whether you want Lecce nights (culture/food) or coastal nights (beach lifestyle).",
  },

  florence: {
    cityId: "florence",
    name: "Florence",
    country: "Italy",
    thingsToDoUrl: GYG.florence,

    overview:
      "Florence is an iconic cultural heavyweight, but it’s also compact and walkable—perfect for a football-led weekend if you plan properly. The best approach is one major cultural block per half-day, lots of wandering in between, and evenings built around wine, conversation, and slower pacing.",

    topThings: [
      {
        title: "Duomo complex",
        tip: "Pick ONE paid element if time-limited (dome or tower). The exterior/square delivers huge impact without hours.",
      },
      {
        title: "Piazza della Signoria + Palazzo Vecchio area",
        tip: "Visit day and night; floodlit evenings are a different experience.",
      },
      {
        title: "Uffizi (one big museum choice)",
        tip: "Pre-book. Early or late slots beat midday crowd crush.",
      },
      {
        title: "Ponte Vecchio → Oltrarno drift",
        tip: "Cross then keep walking for a more local-feeling food and bar scene.",
      },
      {
        title: "Piazzale Michelangelo sunset",
        tip: "Best city panorama. Stay after sunset when crowds thin and lights come on.",
      },
      {
        title: "Accademia (David)",
        tip: "Targeted quick visit if it matters to you; the gallery is small.",
      },
      {
        title: "Mercato Centrale block",
        tip: "Good daytime food stop; not a nightlife destination.",
      },
      {
        title: "Santa Croce evening zone",
        tip: "Strong nights area with bars and casual restaurants.",
      },
      {
        title: "Tuscan wine bar session",
        tip: "Pick one good wine bar and stay put—don’t turn it into frantic hopping.",
      },
      {
        title: "Matchday as its own block",
        tip: "Food first, then travel. Don’t squeeze it between museums.",
      },
    ],

    tips: [
      "Florence rewards early starts—hit major sights before 10am.",
      "Avoid restaurants with photo menus and pushy hosts—walk two streets away.",
      "Book Fri/Sat dinners and museum tickets in peak periods.",
      "Walking beats taxis for most central routes.",
    ],

    food: [
      "Bistecca alla Fiorentina (share if needed)",
      "Ribollita / pappa al pomodoro",
      "Wild boar ragù",
      "Lampredotto (street-food tradition)",
      "Cantucci + Vin Santo",
      "Tuscan reds (Chianti Classico etc.)",
    ],

    transport:
      "Central Florence is extremely walkable. Buses cover outer areas. Trains are strong for day trips (Pisa, Bologna, etc.).",

    accommodation:
      "Historic centre for first-timers, Santa Croce for nightlife, Oltrarno for charm and food. Walkability matters more than hotel ‘features’.",
  },

  verona: {
    cityId: "verona",
    name: "Verona",
    country: "Italy",
    thingsToDoUrl: GYG.verona,

    overview:
      "Verona is compact, romantic, and easy to navigate, making it ideal for a football-led weekend that still feels like a proper city break. The old town is walkable, the evening atmosphere is strong, and you can cover major sights without rushing.",

    topThings: [
      {
        title: "Arena di Verona",
        tip: "See it by day for photos and again at night when the square is lively.",
      },
      {
        title: "Piazza Bra anchor time",
        tip: "Best for a slow drink and people-watching—don’t rush it.",
      },
      {
        title: "Piazza delle Erbe",
        tip: "Great atmosphere; eat off-square for better value.",
      },
      {
        title: "Juliet’s House (quick stop)",
        tip: "Photo moment only unless you’re genuinely obsessed.",
      },
      {
        title: "Castelvecchio + Ponte Scaligero",
        tip: "Strong architecture + river views combo.",
      },
      {
        title: "Adige riverside sunset loop",
        tip: "Low effort, high payoff block.",
      },
      {
        title: "Torricelle viewpoint",
        tip: "Do it if you’ve got a spare half-day—panorama is worth it.",
      },
      {
        title: "San Zeno Basilica",
        tip: "A genuinely beautiful church and a quieter district moment.",
      },
      {
        title: "Wine bar session",
        tip: "Pick 1–2 quality bars. Veneto wines are excellent.",
      },
      {
        title: "Matchday route planning",
        tip: "Have your food plan and travel plan locked so the day stays relaxed.",
      },
    ],

    tips: [
      "Walk whenever possible—Verona is made for it.",
      "Book Fri/Sat dinners—summer weekends fill quickly.",
      "Don’t try to squeeze Lake Garda into a tight 48-hour trip; it deserves time.",
      "Use river walks and viewpoints as pacing tools between heavier blocks.",
    ],

    food: [
      "Risotto all’Amarone",
      "Bigoli pasta",
      "Polenta dishes",
      "Local Valpolicella/Amarone wines",
      "Small-plate cicchetti-style snacks",
    ],

    transport:
      "Old town is walkable. Buses connect outer districts. Verona Porta Nuova station has strong links to Milan, Venice, Bologna and beyond.",

    accommodation:
      "Historic centre for sightseeing, San Zeno if you want calmer nights and proximity to that district, Veronetta for value. Prioritise walkability.",
  },

  pisa: {
    cityId: "pisa",
    name: "Pisa",
    country: "Italy",
    thingsToDoUrl: GYG.pisa,

    overview:
      "Pisa is more than a Leaning Tower photo stop: it’s a compact Tuscan city with strong local life, good food, and excellent rail links. It works well for a football-led weekend because you can cover headline sights quickly, then spend the rest of the trip eating well and wandering without big-city fatigue.",

    topThings: [
      {
        title: "Piazza dei Miracoli + Tower area",
        tip: "Go early or near sunset to avoid tour-bus crush. Even without climbing, the square is worth time.",
      },
      {
        title: "Cathedral interior",
        tip: "Often overlooked—quick visit with high payoff.",
      },
      {
        title: "Camposanto",
        tip: "Calm, atmospheric, and a good break from crowds.",
      },
      {
        title: "Arno river walk",
        tip: "Best late afternoon for light and calmer streets.",
      },
      {
        title: "Borgo Stretto",
        tip: "Cafés and walking spine—perfect for slow pacing.",
      },
      {
        title: "Piazza dei Cavalieri",
        tip: "Quieter historic square with real character.",
      },
      {
        title: "Keith Haring mural (Tuttomondo)",
        tip: "Quick cultural hit near the station.",
      },
      {
        title: "One enoteca evening",
        tip: "Pick one small wine bar and stay; it’s better than hopping.",
      },
      {
        title: "Lucca add-on (if time)",
        tip: "Short train ride and very high ROI if you have a spare half-day.",
      },
      {
        title: "Matchday pacing",
        tip: "Plan pre-match food nearby and arrive early so the day doesn’t feel rushed.",
      },
    ],

    tips: [
      "Eat away from Tower-adjacent streets—quality and value improve fast.",
      "Pisa is walkable; taxis are rarely needed.",
      "If staying more than two nights, add one Tuscan day trip rather than forcing more city sights.",
      "Book Fri/Sat dinners if you want specific places.",
    ],

    food: [
      "Cecina (chickpea flatbread)",
      "Tuscan soups",
      "Seafood pasta",
      "Grilled meats",
      "Tuscan reds",
    ],

    transport:
      "Walkable centre. Pisa Centrale connects directly to Florence, Lucca, Livorno, La Spezia and more. Local buses exist but most visitors won’t need them.",

    accommodation:
      "Best bases: near Borgo Stretto, the Arno area, or near the station for rail day trips. Pisa can be better value than Florence for similar quality.",
  },
};

export default serieACityGuides;
