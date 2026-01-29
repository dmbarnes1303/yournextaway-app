import type { CityGuide } from "./types";

export const serieACityGuides: Record<string, CityGuide> = {

milan: {
    cityId: "milan",
    name: "Milan",
    country: "Italy",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187849-Activities-Milan_Lombardy.html",
    overview:
      "Milan is Italy’s most efficient big city: fast transport, walkable core, and a ‘do the highlights, then eat well’ rhythm that suits short breaks perfectly. It’s also two-club territory (Inter + AC Milan) with matchdays that change hotel pricing, restaurant availability, and metro crowding—so your best trip is the one you plan by neighbourhood + logistics, not by a generic checklist.",
    topThings: [
      {
        title: "Duomo di Milano + rooftop terraces",
        tip:
          "Book rooftop access in advance and go early (or late afternoon) to avoid queues and harsh midday light. The rooftop is the real payoff—build 60–90 minutes around it, then immediately move away from the square for better-value food and coffee.",
      },
      {
        title: "Galleria Vittorio Emanuele II (and the ‘center’ loop)",
        tip:
          "Treat it as a 15–20 minute walk-through (photos + people-watching), then keep moving. If you want a ‘Milan splurge’ coffee moment, do it here—but otherwise save your budget for dinner in Brera/Navigli where the atmosphere is stronger.",
      },
      {
        title: "Teatro alla Scala area (La Scala Museum / outside view)",
        tip:
          "If you’re into culture, the museum is worth it; if not, do a quick exterior look and use the time for Brera. Evening performances mean the area is busier—factor that in if you’re trying to move across the center fast.",
      },
      {
        title: "Brera district (galleries, boutiques, aperitivo streets)",
        tip:
          "Brera is ‘classic Milan vibes’—best late afternoon into evening. Don’t over-plan: pick one anchor (Pinacoteca di Brera or a specific restaurant), then wander side streets for aperitivo. It’s easy to spend money here—set a budget before you arrive.",
      },
      {
        title: "Sforzesco Castle + Parco Sempione",
        tip:
          "Do the castle as a quick exterior + courtyard (or a targeted museum visit), then use Parco Sempione as your reset space. It’s a smart mid-day break if you’re stacking sightseeing and a match later—feet and energy matter in Milan.",
      },
      {
        title: "Navigli canals (evening aperitivo + nightlife)",
        tip:
          "Navigli is at its best from sunset onwards. The trick: eat a proper dinner (or choose one strong aperitivo spot), then walk the canal strip rather than hopping randomly into tourist-trap menus. Expect crowds Fri–Sun—book if you want a specific restaurant.",
      },
      {
        title: "Santa Maria delle Grazie (The Last Supper)",
        tip:
          "This is strict-ticket territory: if you want it, lock it early and build your day around the timed entry. Don’t assume you can ‘wing it’. If you miss out, don’t waste time chasing scalpers—use that time for Brera or a longer food crawl instead.",
      },
      {
        title: "Porta Nuova + Bosco Verticale (modern Milan)",
        tip:
          "This is your ‘new skyline’ photo walk: start around Piazza Gae Aulenti and loop through the modern towers. It pairs well with a shopping block or a quick café stop—don’t force it if you’re short on time, but it’s a strong contrast to historic Milan.",
      },
      {
        title: "Shopping strategy (Quadrilatero vs. smart value routes)",
        tip:
          "Quadrilatero della Moda is pure window-shopping unless you’re in luxury-spend mode. For a practical trip: decide if you’re ‘browse only’ or ‘buy’. If browse-only, cap it at 30–45 minutes and move on—otherwise it steals time from the parts of Milan that actually feel fun.",
      },
      {
        title: "Matchday at San Siro (Inter / AC Milan)",
        tip:
          "San Siro is a logistics event as much as a match. Plan your metro route (and the return) before you leave the hotel, and build buffer time for crowds. If you’re using the app, open the relevant Team Guide from the team page and keep your saved links (tickets, maps, travel) inside your Trip Hub for fast access.",
      },
    ],
    tips: [
      "Teams in this city: Inter and AC Milan share San Siro. In the app, use their Team Guides for stadium/area context and matchday planning: Inter (team key: inter) • AC Milan (team key: ac-milan). Keep those guides linked back to this city guide so users can jump between ‘trip planning’ and ‘club planning’ without hunting.",
      "Neighbourhood choice matters more than being ‘central’. If you want efficient sightseeing: stay near Duomo / Missori / Cordusio. If you want nightlife: Navigli / Porta Genova. If you want calmer + polished: Brera or around Moscova. If you want modern + transit convenience: Porta Nuova / Centrale corridor (but check noise).",
      "Milan is a ‘do one area at a time’ city. Trying to criss-cross for every point of interest wastes hours. Group your day into blocks: (1) Duomo + center loop, (2) Brera + Sempione, (3) Navigli evening, (4) Matchday logistics block if applicable.",
      "Aperitivo is not automatically ‘free dinner’. Some places are light snacks, some are serious spreads—read reviews and decide whether you’re doing aperitivo as your meal or as a warm-up. If it’s a warm-up, book a real dinner to avoid wandering hungry at 9–10pm.",
      "If you’re going to a match, don’t book dinner right on kickoff/finish times unless you’re staying in the same area. Metro crowds are real, and the last thing you want is a rushed sprint that ruins both the match and the meal.",
      "Money-saving reality check: the most expensive mistakes are (1) taxis at peak times, (2) tourist-menu restaurants right beside the Duomo, and (3) last-minute hotel booking on big match/event weekends. Fix those three and Milan becomes good value quickly.",
      "Use the app’s Fixtures tab for ‘next 2 months’ planning instead of guessing. The city guide should tell users how to act: filter Serie A fixtures for the Milan teams + set your date window (rolling window) so the trip is built around real match dates, not assumptions.",
      "If you’re flying in/out: Malpensa is far, Linate is close, Bergamo is often cheap but adds transfer time. Choose the airport based on total door-to-door time, not ticket price alone—especially for 48–72 hour breaks.",
      "Avoid building your entire day around shopping. Milan’s best ‘trip value’ is the mix of architecture, food, and neighbourhood energy—shopping is a bonus block, not the spine of the itinerary unless you’re explicitly doing a shopping trip.",
      "Ticket links and reservations: save them as Trip Hub links under groups (Tickets / Travel / Stay). When you’re on the move, the win is having everything in one place—tickets, Google Maps pins, hotel confirmation, and transport links.",
    ],
    food: [
      "Aperitivo in Navigli (choose one strong spot, then walk the canals—don’t settle for the first tourist menu).",
      "Risotto alla Milanese (order it somewhere reputable; it’s worth doing properly once).",
      "Cotoletta alla Milanese (classic; make it a planned meal, not a rushed lunch).",
      "Panzerotti / quick street food when you’re moving between areas—use it to protect your schedule.",
      "Gelato rules: avoid neon mountains; look for covered metal tins or natural colours—basic quality filter that saves you wasting ‘treat stops’.",
      "Coffee expectations: espresso culture is fast—stand at the bar for value, sit-down service costs more. Decide what experience you’re paying for.",
    ],
    transport:
      "Milan is built for public transport + walking. Metro is the backbone: use it for cross-city jumps, then walk within each neighbourhood block. For San Siro: metro is usually the default choice, but the key is timing—leave earlier than you think and expect big crowds after full time. If you’re using transfers from airports: Linate is the easiest for short breaks, Malpensa adds significant travel time, and Bergamo can be ‘cheap flight, expensive time’. Build your plan around door-to-door time, and save your transport links (airport transfer, train/metro info, and Maps pins) into the Trip Hub so you aren’t searching while rushing.",
    accommodation:
      "For short breaks, prioritise location + transit access over ‘nice hotel features’. Best practical bases: (1) Duomo/Missori/Cordusio for first-timers who want everything walkable, (2) Brera/Moscova for a more ‘Milan’ feel with strong dining and easy access, (3) Navigli/Porta Genova if nightlife is your priority, (4) Porta Nuova/Centrale corridor for modern hotels and fast connections (but check noise and the exact street). If your dates overlap major matchdays or big events, book earlier than you normally would—Milan prices move fast and the last-minute options are often poor value. Monetisation-wise, this is where affiliate-ready hotel links convert: users will actually click when they feel the ‘price risk’ is real, so the guide should push them to save hotel options into the Trip Hub and lock something cancellable early.",
  },

  rome: {
  cityId: "rome",
  name: "Rome",
  country: "Italy",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187791-Activities-Rome_Lazio.html",
  overview:
    "Rome is a dense, high-impact city where ancient history, everyday Italian life, and elite football culture coexist on almost every street. It rewards travellers who plan their days geographically, build in rest windows, and understand that distances often look short on maps but feel long on foot. For football travellers, Rome offers two Serie A clubs, one major stadium complex, and a matchday culture that is intense but highly organised if you prepare properly.",

  topThings: [
    {
      title: "Colosseum, Roman Forum & Palatine Hill",
      tip: "Book a combined timed-entry ticket in advance. Enter early morning to avoid heat and crowds. Expect 2–3 hours minimum if you do all three properly."
    },
    {
      title: "Vatican Museums & Sistine Chapel",
      tip: "Book the earliest slot available. Late afternoon visits are significantly more crowded and exhausting."
    },
    {
      title: "St Peter’s Basilica & Dome",
      tip: "Arrive before 9am. Dress code is enforced. Dome climb gives the best panoramic view in Rome."
    },
    {
      title: "Pantheon",
      tip: "Free entry at certain times; go early or late evening for calmer conditions."
    },
    {
      title: "Trevi Fountain",
      tip: "Visit either before 8am or after 11pm. Midday is shoulder-to-shoulder."
    },
    {
      title: "Piazza Navona",
      tip: "Good evening stroll area. Avoid restaurants directly on the square — walk 2 streets away."
    },
    {
      title: "Trastevere Neighbourhood",
      tip: "Best area for evening food and bars. Wander first, then choose somewhere busy with locals."
    },
    {
      title: "Villa Borghese Gardens",
      tip: "Ideal rest stop after heavy sightseeing. Combine with Borghese Gallery if you enjoy art."
    },
    {
      title: "Castel Sant’Angelo",
      tip: "Strong viewpoint over the river and Vatican. Combine with a riverside walk."
    },
    {
      title: "Stadio Olimpico Area (matchday zone)",
      tip: "Plan transport both directions before matchday. Food options near stadium are limited."
    }
  ],

  tips: [
    "Rome is a walking city but brutal on feet. Proper trainers are mandatory, not optional.",
    "Plan one major sight block in the morning, lighter wandering in afternoon, and food-focused evenings.",
    "Avoid restaurants with photo menus, multilingual laminated menus, or staff aggressively pulling you inside.",
    "Carry water — Rome has public drinking fountains (nasoni) across the city.",
    "Taxi availability around matches is poor. Assume you will use public transport or walk.",
    "Restaurants fill quickly Friday–Sunday. Book dinner if you have a specific place in mind.",
    "Allow extra time everywhere. Rome rarely runs to schedule.",
    "If staying near the Vatican, evenings are quiet. If staying near Trastevere or Monti, nights are lively."
  ],

  food: [
    "Carbonara",
    "Cacio e Pepe",
    "Amatriciana",
    "Supplì",
    "Pizza al taglio",
    "Gelato from reputable shops (avoid neon colours)"
  ],

  transport:
    "Rome’s Metro has limited lines but is fast where it exists. Buses cover most areas but can be slow. Walking is often fastest in the historic centre. Use Google Maps for live routing. Build 30–40 minute buffers when travelling to Stadio Olimpico.",

  accommodation:
    "Centro Storico and Monti give the best sightseeing access. Trastevere is ideal for nightlife. Vatican area is quieter and good for early mornings. Prioritise proximity to a Metro stop over being 'central' on paper.",

  teams: [
    {
      name: "AS Roma",
      teamKey: "as-roma",
      stadium: "Stadio Olimpico"
    },
    {
      name: "Lazio",
      teamKey: "lazio",
      stadium: "Stadio Olimpico"
    }
  ],

  matchday: {
    stadium: "Stadio Olimpico",
    transportTips: [
      "Use Metro Line A to Ottaviano, then walk or tram.",
      "Arrive in stadium area at least 60–75 minutes before kickoff.",
      "Expect security checks and bag restrictions."
    ],
    preMatchAreas: [
      "Prati district",
      "Ponte Milvio bars",
      "Flaminio neighbourhood"
    ],
    postMatchAdvice:
      "Leave immediately or wait 30 minutes for crowds to thin. Walking toward the river often beats public transport queues."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  naples: {
  cityId: "naples",
  name: "Naples",
  country: "Italy",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187785-Activities-Naples_Province_of_Naples_Campania.html",

  overview:
    "Naples is one of Europe’s most intense and rewarding football cities. It is loud, dense, chaotic, emotionally charged, and fiercely proud of its identity. Unlike Rome, Florence, or Milan, Naples does not attempt to polish its edges for visitors — daily life and tourism overlap completely. For football travellers, this creates a uniquely authentic experience where the club, the city, and the people feel inseparable. If you plan your logistics properly and embrace the character of the city, Naples delivers world-class food, powerful football culture, and unforgettable atmosphere.",

  topThings: [
    {
      title: "Historic Centre (Centro Storico / Spaccanapoli)",
      tip: "Walk Spaccanapoli from Piazza del Gesù to Via San Biagio dei Librai. Expect narrow streets, churches, street food, scooters, markets, noise, and crowds. This is Naples at its most real. Best done late morning or early evening."
    },
    {
      title: "Napoli Sotterranea (Underground Naples)",
      tip: "Guided tours through ancient tunnels, aqueducts, and WWII shelters. Book ahead. Adds important historical context to the city."
    },
    {
      title: "National Archaeological Museum",
      tip: "Essential if visiting Pompeii or Herculaneum. Houses most major finds. Allow at least 2–3 hours."
    },
    {
      title: "Castel dell’Ovo & Seafront",
      tip: "Free castle, excellent views across the bay toward Vesuvius. Combine with a Lungomare walk."
    },
    {
      title: "Vomero Hill & Castel Sant’Elmo",
      tip: "Funicular ride up for panoramic city views. Calmer streets, better air, and good cafés."
    },
    {
      title: "Pompeii Day Trip",
      tip: "Circumvesuviana train from Napoli Garibaldi. Half-day minimum. Go early."
    },
    {
      title: "Herculaneum",
      tip: "Smaller and better preserved than Pompeii. Often preferred by experienced travellers."
    },
    {
      title: "Pizza Trail",
      tip: "Da Michele, Sorbillo, Starita, or Concettina. Expect queues. Quality is exceptional."
    },
    {
      title: "Quartieri Spagnoli (Spanish Quarter)",
      tip: "Dense residential quarter full of murals, bars, laundry lines, and street life. Great in daylight."
    },
    {
      title: "Maradona Murals",
      tip: "Multiple locations around Quartieri Spagnoli and central Naples. Important cultural stops for football fans."
    }
  ],

  tips: [
    "Naples feels rougher than most Italian cities — this is cultural, not automatically dangerous.",
    "Pickpocketing exists. Keep zips closed and phones secure.",
    "Expect loud streets late into the night.",
    "Eat late (8pm+). Earlier evenings feel quiet.",
    "Do not rely heavily on taxis — use metro and walking.",
    "Book major sights and Pompeii trains early in peak months.",
    "Good shoes matter — uneven pavements everywhere.",
    "Stay near a Metro stop to avoid long transfers.",
    "Football scarves and shirts are common across the city on matchdays.",
    "Allow extra buffer time for stadium journeys."
  ],

  food: [
    "Neapolitan Margherita pizza",
    "Marinara pizza",
    "Fried pizza (pizza fritta)",
    "Sfogliatella",
    "Babà rum cake",
    "Seafood pasta",
    "Espresso at standing bar"
  ],

  transport:
    "Metro Line 1 serves much of central Naples. Line 2 serves western districts including Fuorigrotta (stadium area). Circumvesuviana trains connect Pompeii and Herculaneum. Funiculars link lower city to Vomero. Always allow buffer time — delays are common.",

  accommodation:
    "Centro Storico for atmosphere and walkability. Chiaia for cleaner streets and calmer evenings. Vomero for quieter stays with good transport. Avoid remote suburbs unless close to Metro.",

  teams: [
    {
      name: "Napoli",
      teamKey: "napoli",
      stadium: "Stadio Diego Armando Maradona"
    }
  ],

  matchday: {
    stadium: "Stadio Diego Armando Maradona",

    overview:
      "Matchday in Naples is emotionally charged and highly visible across the city. Flags, shirts, and murals dominate streets hours before kickoff. Expect noise, chants, and heavy police presence.",

    transportTips: [
      "Metro Line 2 to Campi Flegrei or Cavalleggeri Aosta.",
      "Avoid driving — parking near stadium is extremely limited.",
      "Arrive 75–90 minutes early.",
      "Expect bag checks and ticket ID checks."
    ],

    preMatchAreas: [
      "Fuorigrotta bars near Campi Flegrei station",
      "Pizzerias along Viale Augusto",
      "Street food stalls around stadium"
    ],

    postMatchAdvice:
      "Queues for trains are heavy after full time. Walk 15–20 minutes away from stadium before boarding to reduce waiting time."
  },

  footballCulture: {
    identity:
      "Napoli is defined by Diego Maradona. He is treated as a near-mythical figure and represents resistance, pride, and southern identity.",
    behaviour:
      "Atmosphere is passionate but not hostile to neutral travellers. Avoid antagonistic behaviour and remain respectful.",
    merchandise:
      "Maradona-themed scarves, shirts, and artwork sold everywhere in central Naples."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  turin: {
  cityId: "turin",
  name: "Turin",
  country: "Italy",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187855-Activities-Turin_Province_of_Turin_Piedmont.html",

  overview:
    "Turin is one of Italy’s most underrated football travel cities. It feels orderly, elegant, and quietly wealthy, with grand boulevards, long arcades, and Alpine backdrops. Unlike Rome or Naples, Turin runs on structure rather than chaos. For travellers, this means easier logistics, calmer streets, and a strong balance between culture, food, and football. It is an ideal city for those who want a high-quality Italian experience without constant crowds.",

  topThings: [
    {
      title: "Mole Antonelliana & National Cinema Museum",
      tip: "Take the glass elevator to the viewing platform for city-wide views. Combine museum visit with sunset timing."
    },
    {
      title: "Piazza Castello & Royal Palace",
      tip: "Central historic core. Visit early morning for quieter atmosphere."
    },
    {
      title: "Egyptian Museum",
      tip: "One of the best outside Egypt. Book tickets in advance and allow 2–3 hours."
    },
    {
      title: "Via Roma Walk",
      tip: "Elegant shopping avenue connecting Porta Nuova station to Piazza Castello."
    },
    {
      title: "Quadrilatero Romano",
      tip: "Old town district with dense bars and restaurants. Excellent for evenings."
    },
    {
      title: "Parco del Valentino",
      tip: "Riverside park for walking, cycling, or relaxing between sightseeing blocks."
    },
    {
      title: "Superga Basilica",
      tip: "Hilltop basilica with sweeping views. Tram ride adds to experience."
    },
    {
      title: "Porta Palazzo Market",
      tip: "Large local market showcasing daily Turin life. Morning best."
    },
    {
      title: "Historic Cafés",
      tip: "Try Bicerin coffee at Café Al Bicerin. Turin is famous for chocolate culture."
    },
    {
      title: "Juventus Museum & Stadium Tour",
      tip: "Book ahead on match weekends. Good half-day football-focused activity."
    }
  ],

  tips: [
    "Turin is walkable but large — plan by neighbourhood clusters.",
    "Restaurants often close between lunch and dinner; check hours.",
    "Book museums in advance on weekends.",
    "Turin is safer and calmer than many Italian cities, but still mind pickpockets.",
    "English is less widely spoken than Rome or Milan — basic Italian phrases help.",
    "Public transport is reliable; trams are useful.",
    "Evenings start later than northern Europe but earlier than Naples.",
    "Football shirts are common around stadium zones on matchdays.",
    "Weather can be cold in winter — pack accordingly."
  ],

  food: [
    "Vitello tonnato",
    "Agnolotti pasta",
    "Bagna càuda",
    "Gianduja chocolate",
    "Bicerin (coffee + chocolate drink)",
    "Hazelnut desserts"
  ],

  transport:
    "Metro Line 1 runs north–south. Extensive tram network across central areas. Taxis reliable. Porta Nuova and Porta Susa stations connect Turin nationally.",

  accommodation:
    "Centro for sightseeing. Crocetta for quieter stays. Near Porta Nuova for transport convenience. Avoid far suburbs unless near Metro.",

  teams: [
    {
      name: "Juventus",
      teamKey: "juventus",
      stadium: "Allianz Stadium"
    },
    {
      name: "Torino",
      teamKey: "torino",
      stadium: "Stadio Olimpico Grande Torino"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Allianz Stadium",
        team: "Juventus",
        area: "Vallette district",
        transport: [
          "Metro Line 1 to Bernini then tram",
          "Direct matchday shuttle buses",
          "Arrive 75–90 mins early"
        ],
        preMatchZones: [
          "Juventus Village",
          "Bars near stadium complex"
        ],
        notes:
          "Modern stadium with strong sightlines. Security checks strict."
      },
      {
        name: "Stadio Olimpico Grande Torino",
        team: "Torino",
        area: "Santa Rita district",
        transport: [
          "Tram from city centre",
          "Bus routes from Porta Nuova",
          "Arrive 60–75 mins early"
        ],
        preMatchZones: [
          "Bars along Corso Sebastopoli",
          "Local cafés near stadium"
        ],
        notes:
          "Traditional bowl stadium. Compact and intense atmosphere."
      }
    ],

    postMatchAdvice:
      "Trams and buses queue after matches. Walk 10–15 minutes away from stadium to board more easily."
  },

  footballCulture: {
    identity:
      "Turin is a two-club city with deep-rooted division. Juventus represent global dominance and success. Torino represent tragedy, tradition, and local pride.",
    behaviour:
      "Supporters are passionate but generally controlled. Neutral travellers face little hostility.",
    derby:
      "Derby della Mole between Juventus and Torino — one of Italy’s oldest derbies."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  como: {
  cityId: "como",
  name: "Como",
  country: "Italy",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187835-Activities-Como_Lake_Como_Lombardy.html",

  overview:
    "Como is one of the most visually striking football trip destinations in Europe. Nestled at the southern tip of Lake Como and surrounded by steep Alpine foothills, it combines postcard scenery, relaxed Italian lifestyle, and top-flight football in an intimate setting. Watching a match here feels less like attending a major event and more like stepping into an Italian weekend ritual — lakeside coffee, slow lunch, evening football, then wine by the water. For travellers who want football woven into a beautiful mini-break rather than dominating it, Como is close to perfect.",

  topThings: [
    {
      title: "Lake Como Waterfront Walk",
      tip: "Stroll from the ferry terminal along the promenade at golden hour. This is the city at its most photogenic."
    },
    {
      title: "Funicular to Brunate",
      tip: "Ride up for panoramic views over the lake and Alps. Best late afternoon before sunset."
    },
    {
      title: "Boat Trip to Bellagio or Varenna",
      tip: "Half-day return trip works well. Sit on open deck if weather allows."
    },
    {
      title: "Como Cathedral (Duomo)",
      tip: "Quick interior visit. Combine with nearby espresso stop."
    },
    {
      title: "Old Town Wandering",
      tip: "Get lost inside the medieval walls — compact, atmospheric, and flat."
    },
    {
      title: "Villa Olmo",
      tip: "Lakeside villa and gardens, 20-minute walk from centre."
    },
    {
      title: "Aperitivo by the Water",
      tip: "Early evening drink with snacks is a must-do ritual."
    },
    {
      title: "Mountain Viewpoints",
      tip: "Short hikes or cable cars reveal elevated lake vistas."
    },
    {
      title: "Local Wine Bars",
      tip: "Seek small enotecas away from ferry crowds."
    },
    {
      title: "Matchday Stroll to Stadium",
      tip: "Walk from centre to Stadio Sinigaglia along the lake."
    }
  ],

  tips: [
    "Stay in Como town for easiest matchday logistics.",
    "Boat schedules drop in winter — check timetables.",
    "Restaurants fill quickly on weekends; reserve.",
    "Bring comfortable shoes — cobbles and slopes.",
    "Evenings are relaxed rather than wild.",
    "Weather can change fast near mountains.",
    "Pack light layers even in summer.",
    "English is widely spoken in tourist areas.",
    "Avoid driving into historic centre."
  ],

  food: [
    "Fresh lake fish",
    "Risotto",
    "Polenta dishes",
    "Northern Italian cured meats",
    "Local cheeses",
    "Gelato by the lake"
  ],

  transport:
    "Como San Giovanni station connects directly to Milan (~40 min). Town is walkable. Ferries connect lake villages. Funicular links Como–Brunate.",

  accommodation:
    "Old Town or waterfront for atmosphere. Near San Giovanni station for easy Milan access. Hillside hotels offer views but require taxis.",

  teams: [
    {
      name: "Como",
      teamKey: "como",
      stadium: "Stadio Giuseppe Sinigaglia"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Stadio Giuseppe Sinigaglia",
        team: "Como",
        area: "Lakefront",
        transport: [
          "10–15 minute walk from city centre",
          "5 minute walk from ferry terminal",
          "Taxis rarely needed"
        ],
        preMatchZones: [
          "Lakefront bars",
          "Old Town cafés"
        ],
        notes:
          "Intimate stadium steps from the lake. Strong visual setting. Arrive 45–60 minutes early."
      }
    ],

    postMatchAdvice:
      "Walk back toward Old Town or waterfront for drinks. Town remains lively but calm."
  },

  footballCulture: {
    identity:
      "Como’s football identity is rooted in community and recent resurgence rather than historic dominance.",
    behaviour:
      "Support is passionate but friendly. Neutral travellers welcomed.",
    derby:
      "Regional Lombardy rivalries add edge, but atmosphere remains relaxed."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  bergamo: {
  cityId: "bergamo",
  name: "Bergamo",
  country: "Italy",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187888-Activities-Bergamo_Province_of_Bergamo_Lombardy.html",

  overview:
    "Bergamo is a rare blend of medieval beauty and modern football power. Divided into two distinct halves — the elegant hilltop Città Alta (Upper City) and the bustling Città Bassa (Lower City) — it offers one of Italy’s most atmospheric backdrops for a football trip. Home to Atalanta, a club synonymous with intense pressing, youth development, and fearless European nights, Bergamo delivers a matchday experience that feels raw, local, and deeply rooted in community. It is less polished than Milan, less touristic than Venice, and far more authentic than most football cities of similar stature.",

  topThings: [
    {
      title: "Città Alta (Upper City)",
      tip: "Enter via funicular or walk up through ancient gates. Wander without a map."
    },
    {
      title: "Piazza Vecchia",
      tip: "Central square of Upper City. Sit with a coffee and watch daily life."
    },
    {
      title: "Bergamo Cathedral & Basilica di Santa Maria Maggiore",
      tip: "Visit both — they sit side by side but feel completely different inside."
    },
    {
      title: "Venetian City Walls (UNESCO)",
      tip: "Walk sections for panoramic views across Lombardy."
    },
    {
      title: "Funicular Ride",
      tip: "Simple but iconic. Best done near sunset."
    },
    {
      title: "Lower City Shopping Streets",
      tip: "Via XX Settembre for cafés, shops, people-watching."
    },
    {
      title: "Local Wine Bars",
      tip: "Upper City has small enotecas with regional wines."
    },
    {
      title: "Parco dei Colli",
      tip: "Green hills north of Upper City. Short hikes and viewpoints."
    },
    {
      title: "Gelato Crawl",
      tip: "Several excellent gelaterias clustered in Upper City."
    },
    {
      title: "Matchday Walk to Gewiss Stadium",
      tip: "Atmosphere builds as you approach — scarves, flares, chants."
    }
  ],

  tips: [
    "Base yourself near Lower City centre or near Upper City funicular.",
    "Upper City streets are steep — good footwear matters.",
    "Book dinner on matchday evenings.",
    "Bergamo airport is extremely close to city.",
    "Trains from Milan take around 50 minutes.",
    "Learn basic Italian greetings — appreciated here.",
    "Expect louder, more intense crowds than tourist cities.",
    "Carry cash for small bars.",
    "Arrive early on matchday to soak atmosphere."
  ],

  food: [
    "Casoncelli (local stuffed pasta)",
    "Polenta with meat or cheese",
    "Stracciatella gelato (originated nearby)",
    "Bergamasco cheeses",
    "Hearty mountain-style stews",
    "Espresso standing at bar"
  ],

  transport:
    "Compact city. Walking + buses cover most areas. Funicular connects Upper and Lower City. Trains connect Bergamo–Milan frequently. Airport (BGY) 15 minutes by bus.",

  accommodation:
    "Upper City for romance. Lower City near funicular for balance. Near station for transport efficiency.",

  teams: [
    {
      name: "Atalanta",
      teamKey: "atalanta",
      stadium: "Gewiss Stadium"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Gewiss Stadium",
        team: "Atalanta",
        area: "Borgo Santa Caterina",
        transport: [
          "20–25 minute walk from city centre",
          "Buses from Lower City",
          "Taxis limited after matches"
        ],
        preMatchZones: [
          "Borgo Santa Caterina streets",
          "Bars near stadium perimeter"
        ],
        notes:
          "Steep stands, close to pitch, extremely loud. One of Italy’s best atmospheres."
      }
    ],

    postMatchAdvice:
      "Walk back toward centre with crowds. Bars fill quickly after night games."
  },

  footballCulture: {
    identity:
      "Atalanta represent provincial pride, youth development, and fearless football.",
    behaviour:
      "Home support is intense, vocal, and constant.",
    derby:
      "Lombardy rivalries add edge, especially vs Milan clubs."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  bologna: {
  cityId: "bologna",
  name: "Bologna",
  country: "Italy",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187801-Activities-Bologna_Province_of_Bologna_Emilia_Romagna.html",

  overview:
    "Bologna is one of Italy’s great all-round cities: medieval streets, endless portico walkways, world-famous cuisine, and a football club woven deeply into local identity. Less chaotic than Rome, less glossy than Milan, Bologna offers an authentic Italian city-break experience with substance. Home to Bologna FC, one of Italy’s historically most successful clubs, matchday in Bologna feels communal, noisy, and proudly traditional. This is a city where food, football, and everyday life overlap naturally.",

  topThings: [
    {
      title: "Piazza Maggiore",
      tip: "Central square. Sit with a coffee or aperitivo and watch the city flow."
    },
    {
      title: "Two Towers (Asinelli & Garisenda)",
      tip: "Climb Asinelli early for views. Expect a leg workout."
    },
    {
      title: "Portico Walks",
      tip: "Miles of covered walkways — perfect in heat or rain."
    },
    {
      title: "Quadrilatero Market Area",
      tip: "Food-focused streets packed with delis and wine bars."
    },
    {
      title: "Archiginnasio",
      tip: "Historic university building and anatomical theatre."
    },
    {
      title: "Santo Stefano Complex",
      tip: "Seven churches in one atmospheric cluster."
    },
    {
      title: "Via Zamboni",
      tip: "Student street with bars, energy, and cheap eats."
    },
    {
      title: "Giardini Margherita",
      tip: "Large park for daytime reset."
    },
    {
      title: "San Luca Sanctuary",
      tip: "Iconic hilltop church reached by world’s longest portico."
    },
    {
      title: "Matchday walk toward Renato Dall’Ara",
      tip: "Atmosphere grows as scarves and shirts appear."
    }
  ],

  tips: [
    "Bologna is extremely walkable — stay central.",
    "Book restaurants in advance on weekends.",
    "Lunch is sacred here; many kitchens close mid-afternoon.",
    "Avoid restaurants with tourist menus near main squares.",
    "Try aperitivo before dinner.",
    "Expect louder streets late near university area.",
    "Stadium area is residential — respect locals.",
    "Carry cash for small bars.",
    "Arrive early on matchday for pre-game food and drinks."
  ],

  food: [
    "Tagliatelle al ragù (true Bolognese)",
    "Tortellini in brodo",
    "Mortadella",
    "Lasagne verdi",
    "Parmigiano Reggiano",
    "Lambrusco wine"
  ],

  transport:
    "Compact historic centre. Walking preferred. Buses cover wider areas. Bologna Centrale station is major rail hub. Airport 20 minutes by bus.",

  accommodation:
    "Historic centre near Piazza Maggiore. University quarter for nightlife. Near station for early departures.",

  teams: [
    {
      name: "Bologna FC",
      teamKey: "bologna",
      stadium: "Stadio Renato Dall’Ara"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Stadio Renato Dall’Ara",
        team: "Bologna FC",
        area: "Saragozza",
        transport: [
          "30-minute walk from centre",
          "Direct buses from centre",
          "Taxis limited post-match"
        ],
        preMatchZones: [
          "Bars along Via Andrea Costa",
          "Local cafés near stadium"
        ],
        notes:
          "Historic stadium with classic curved stands and strong acoustics. Atmosphere feels traditional and communal."
      }
    ],

    postMatchAdvice:
      "Walk back toward centre with crowds. Bars along route stay busy."
  },

  footballCulture: {
    identity:
      "Historic club with seven Serie A titles. Emphasis on identity, youth, and expressive football.",
    behaviour:
      "Support is passionate, vocal, and loyal.",
    derby:
      "Strong regional edge vs Fiorentina and nearby Emilia-Romagna clubs."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  udine: {
  cityId: "udine",
  name: "Udine",
  country: "Italy",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187814-Activities-Udine_Province_of_Udine_Friuli_Venezia_Giulia.html",

  overview:
    "Udine is a refined northeastern Italian city close to the Austrian and Slovenian borders, offering a quieter, more relaxed football trip compared to Italy’s giants. Elegant squares, Venetian-style architecture, excellent regional food, and a proud local club make Udine ideal for travellers who want authenticity over spectacle. Home to Udinese Calcio, the city delivers a calm daytime atmosphere that transforms into something focused and intense on matchdays.",

  topThings: [
    {
      title: "Piazza Libertà",
      tip: "Often called Italy’s most Venetian square. Best early morning or golden hour."
    },
    {
      title: "Udine Castle",
      tip: "Short uphill walk. Views across red rooftops and surrounding plains."
    },
    {
      title: "Via Mercatovecchio",
      tip: "Main shopping and café street connecting squares."
    },
    {
      title: "Piazza Matteotti",
      tip: "Lively square with bars and restaurants."
    },
    {
      title: "Cathedral of Udine",
      tip: "Quick interior visit. Peaceful stop."
    },
    {
      title: "Tiepolo Galleries",
      tip: "For art lovers — housed in the Archbishop’s Palace."
    },
    {
      title: "Giardini Ricasoli",
      tip: "Small green park near castle."
    },
    {
      title: "Day trip to Cividale del Friuli",
      tip: "UNESCO town 30 minutes by train."
    },
    {
      title: "Local wine bars",
      tip: "Friuli is famous for whites. Ask for regional recommendations."
    },
    {
      title: "Matchday walk toward Bluenergy Stadium",
      tip: "Notice the shift from calm city to football focus."
    }
  ],

  tips: [
    "City centre is compact and walkable.",
    "English less common than Milan/Rome — learn basics.",
    "Restaurants close earlier than southern Italy.",
    "Book restaurants on matchday evenings.",
    "Try regional Friuli dishes, not generic pizza/pasta.",
    "Cash useful for small bars.",
    "Stadium area is modern and spread out.",
    "Expect polite, reserved crowds."
  ],

  food: [
    "Frico (cheese & potato dish)",
    "Prosciutto di San Daniele",
    "Cjarsons",
    "Polenta",
    "Gnocchi",
    "Friulano white wine"
  ],

  transport:
    "Walkable centre. Local buses cover suburbs and stadium. Udine station connects Venice, Trieste, and Austria.",

  accommodation:
    "Historic centre near Piazza Libertà or station area for convenience.",

  teams: [
    {
      name: "Udinese Calcio",
      teamKey: "udinese",
      stadium: "Bluenergy Stadium (Stadio Friuli)"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Bluenergy Stadium",
        team: "Udinese Calcio",
        area: "Rizzi District",
        transport: [
          "Bus from centre",
          "Taxi",
          "45-minute walk"
        ],
        preMatchZones: [
          "Bars around stadium perimeter",
          "Small food kiosks"
        ],
        notes:
          "Modern bowl-style stadium with excellent sightlines and roof cover. Atmosphere is focused rather than chaotic."
      }
    ],

    postMatchAdvice:
      "Buses queue after matches. Walking 10–15 minutes before taxiing is easier."
  },

  footballCulture: {
    identity:
      "Smart recruitment, strong scouting network, stable Serie A presence.",
    behaviour:
      "Supporters are loyal, calm, and knowledgeable.",
    derby:
      "Regional tension with Triestina (when applicable)."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  sassuolo: {
  cityId: "sassuolo",
  name: "Sassuolo",
  country: "Italy",
  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.com/Attractions-g187804-Activities-Sassuolo_Province_of_Modena_Emilia_Romagna.html",

  overview:
    "Sassuolo is not a big-city break — it’s a compact Emilia-Romagna town best experienced as a ‘football anchor’ inside a wider weekend base (typically Modena or Bologna). The upside is exactly that: you get a calmer, more local Italy, world-class food nearby, and easy access to multiple attractive cities. If your goal is a glamorous urban itinerary, this isn’t it. If your goal is a distinctive trip built around football logistics, food, and nearby culture — Sassuolo is surprisingly satisfying.\n\nThe key detail: matchday for Sassuolo Calcio is often functionally a trip to Reggio Emilia (Mapei Stadium), not central Sassuolo. So a smart plan is: base in Modena/Bologna, do day-stops in Sassuolo + Maranello (Ferrari territory) or Modena food spots, then hit the stadium via train/bus/taxi depending on where the fixture is actually played.",

  topThings: [
    {
      title: "Palazzo Ducale di Sassuolo (Ducal Palace)",
      tip: "This is the main ‘wow’ in Sassuolo: baroque interiors and serious history. Check opening days/hours before you build your itinerary — it’s not an always-open tourist machine like Rome."
    },
    {
      title: "Ceramic industry ‘identity’ walk",
      tip: "Sassuolo is a global ceramics hub. You won’t do factory tours like a theme park, but you can understand the town’s identity: showrooms, industrial design, and the working rhythm of the area. Great if you like ‘real places’ not curated tourist zones."
    },
    {
      title: "Centro Storico: slow cafés + aperitivo",
      tip: "This is a ‘sit and watch the town’ stop. Don’t expect a packed historic labyrinth; expect a relaxed, local centre where your value is in pacing and food, not attractions-per-hour."
    },
    {
      title: "Parco Ducale / local green breaks",
      tip: "Use parks as a reset before matchday travel. Small Italian towns reward downtime; trying to force ‘ten sights’ here makes the trip feel thin."
    },
    {
      title: "Modena day trip (food + compact city)",
      tip: "Modena is the smarter daytime base: beautiful centre, strong food culture, easy transport. If you only do one add-on city, Modena is the best value."
    },
    {
      title: "Maranello (Ferrari territory)",
      tip: "If you want a ‘headline’ experience near Sassuolo, this is it. Book anything Ferrari-related ahead if it’s a weekend peak — it gets busy."
    },
    {
      title: "Bologna as the ‘proper weekend base’",
      tip: "If you want nightlife, a big food scene, and easy trains — base in Bologna and do Sassuolo/Reggio Emilia as matchday hops. It’s often the best overall traveller experience."
    },
    {
      title: "Reggio Emilia stop (if match at Mapei Stadium)",
      tip: "If the fixture is at Mapei Stadium, you can make Reggio Emilia part of the trip rather than a boring transit point: quick centre stroll + food pre-match."
    },
    {
      title: "Emilia-Romagna food crawl (the real attraction)",
      tip: "This region is built for eating well. Prioritise meals like ‘events’ — it’s the highest ROI part of the trip."
    },
    {
      title: "Aperitivo → matchday routine",
      tip: "The best Sassuolo trip vibe is calm daytime + structured pre-match + relaxed post-match food. Don’t overcomplicate it."
    }
  ],

  tips: [
    "Treat Sassuolo as an anchor, not a ‘full city-break’ — build your weekend around Modena/Bologna plus matchday travel.",
    "Before you plan transport, confirm the match venue: Sassuolo fixtures can effectively be ‘Reggio Emilia trips’.",
    "If you want walkability + nightlife, Bologna is the best base. If you want calm + local, Modena works brilliantly.",
    "If your accommodation is outside Bologna/Modena, taxis can get expensive fast — plan your last-mile route ahead.",
    "Restaurants here are about quality, not speed: expect slower pacing and plan around it (especially pre-match).",
    "Sunday and Monday closures are real in smaller towns — don’t assume everything is open.",
    "If you’re coming from Milan/Florence/Rome, this will feel quiet — that’s the point. Lean into it.",
    "Don’t waste money on ‘tourist trap’ menus. In Emilia-Romagna, pick places that look local, busy, and confident."
  ],

  food: [
    "Tortellini / tortelloni (regional staple — don’t skip it)",
    "Tagliatelle al ragù (this region does it properly)",
    "Parmigiano Reggiano (real origin territory nearby)",
    "Prosciutto + cured meats (local quality is high)",
    "Traditional balsamic (Modena area — learn the difference vs supermarket ‘glaze’)",
    "Lambrusco (often misunderstood; good versions are brilliant with local food)"
  ],

  transport:
    "Sassuolo is workable by regional rail/bus connections, but the ‘smart transport layer’ is using bigger hubs. Bologna is the strongest all-round transport base (major station, frequent services). Modena is excellent for short hops and food-centric stays. For matchday, plan based on the actual stadium: if it’s in Reggio Emilia, trains to Reggio Emilia station plus local taxi/bus can be the cleanest route. If you rely on last-minute taxis from small towns, availability can be hit-and-miss and pricing jumps on matchday.",

  accommodation:
    "For most travellers, don’t stay in Sassuolo unless you deliberately want a quiet, local feel. Bologna gives the best ‘weekend break’ experience with nightlife and effortless trains. Modena is the best ‘food + calm + convenient’ base. If the match venue is Reggio Emilia, staying one night there can make the matchday ultra-smooth — but it’s less exciting as a weekend base than Bologna.",

  teams: [
    {
      name: "Sassuolo Calcio",
      teamKey: "sassuolo",
      stadium: "Home fixtures can be hosted at Mapei Stadium (Reggio Emilia) depending on season arrangements"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Mapei Stadium – Città del Tricolore",
        team: "Sassuolo Calcio (often) / Reggiana",
        area: "Reggio Emilia (outside the historic core)",
        transport: [
          "Train to Reggio Emilia + taxi/bus to stadium area",
          "Base in Bologna/Modena and travel in/out same day",
          "If driving: plan parking and exit timing — post-match traffic builds quickly"
        ],
        preMatchZones: [
          "Reggio Emilia centre for food before heading to the stadium",
          "Stadium perimeter kiosks for quick bites (not a ‘wander district’ vibe)"
        ],
        notes:
          "If the fixture is here, treat it as a Reggio Emilia matchday. The stadium is modern and functional with good sightlines; the surrounding area is not a scenic ‘pre-match neighbourhood’, so do your atmosphere/food in the city centre then move with intent."
      }
    ],

    postMatchAdvice:
      "Don’t expect a ‘big-city surge’ of post-match nightlife around the stadium. The best play is to head back toward your base (Bologna/Modena) for a proper meal. If you’re using taxis, walk a little away from the immediate stadium pickup chaos to speed things up."
  },

  footballCulture: {
    identity:
      "Sassuolo are a modern Italian football story: rapid growth, smart recruitment, and a reputation for organised football. They don’t have the century-old global mythology of the giants, but they offer something travellers often prefer: a more accessible matchday and a ‘real Italy’ trip profile.",
    behaviour:
      "The crowd vibe tends to be more measured than the ultras-heavy cauldrons — still passionate, but not built on intimidating intensity. Great for neutral travellers who want a match without feeling swallowed by chaos.",
    derby:
      "Regional dynamics exist in Emilia-Romagna, but the bigger ‘tourist derby’ tension is logistics: where the match is actually hosted."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  cagliari: {
  cityId: "cagliari",
  name: "Cagliari",
  country: "Italy",
  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.com/Attractions-g187881-Activities-Cagliari_Province_of_Cagliari_Sardinia.html",

  overview:
    "Cagliari is a proper ‘go away’ city break disguised as a football trip. It’s the Sardinian capital: sea views, warm light, a walkable historic core, beaches within minutes, and a pace that immediately forces you to slow down. If you’re used to mainland Italy doing crowds + queues + constant motion, Cagliari feels like someone turned the volume down — in a good way.\n\nFor YourNextAway, Cagliari is high-value because it delivers two things at once: (1) a clear matchday anchor with a stadium that’s easy to treat as a single-day plan, and (2) a genuinely strong weekend itinerary without needing to hop cities. The big decision is not “what sights”; it’s logistics and timing: flights/ferries, where you base (Marina/Stampace vs Poetto vs further out), and how you split the trip between old-town exploration, sea time, and food.\n\nThis is also one of the easiest ‘sell it to a non-football partner’ trips you’ll ever do: even if you only do one match-related block, the rest of the break still feels like a proper Mediterranean getaway.",

  topThings: [
    {
      title: "Castello district (historic hilltop core)",
      tip:
        "Do Castello twice: once in daylight for views + architecture, and once at golden hour for atmosphere. The mistake people make is treating it like a single ‘walk through’. It’s a layered area — viewpoints, small streets, and cafés that reward slow wandering."
    },
    {
      title: "Bastione di Saint Remy (the ‘postcard’ terrace)",
      tip:
        "Go at sunset for the full effect, but arrive early if you want space. It’s also a perfect ‘reset’ stop between a beach afternoon and dinner — you’ll feel like you’ve done something iconic without burning time."
    },
    {
      title: "Marina district (food, bars, evening energy)",
      tip:
        "This is where your evenings should naturally end. Pick one good spot, then drift. Don’t overbook every meal — Cagliari is at its best when you let the night become a crawl of small wins (seafood, wine, gelato, repeat)."
    },
    {
      title: "Poetto Beach (the easy win)",
      tip:
        "Treat Poetto as a half-day minimum: arrive late morning, stay through lunch, and don’t rush back. If it’s windy, it still works — you just pivot to café hopping along the beachfront instead of ‘sunbed mode’."
    },
    {
      title: "Sella del Diavolo (Devil’s Saddle hike)",
      tip:
        "This is the best ‘bang for effort’ viewpoint near the city. Do it early morning to avoid heat and get clearer views. Bring water and proper shoes — it’s not hard, but it’s rocky and you’ll hate yourself in trainers with no grip."
    },
    {
      title: "Mercato di San Benedetto (real local market)",
      tip:
        "Go hungry. Walk the whole market first, then choose what to eat. It’s one of the most ‘Sardinia in 60 minutes’ experiences you can have. If you want something you can’t fake with Google, this is it."
    },
    {
      title: "Day trip to Villasimius (if you want ‘wow’ beaches)",
      tip:
        "If your trip is 3+ days, this is a high-ROI upgrade. The beaches out there are the kind of turquoise that makes the whole break feel expensive. Without a car, plan a tour/transfer early — leaving it to the last minute can be messy."
    },
    {
      title: "Nora (Roman ruins + coastal scenery)",
      tip:
        "This is a perfect ‘non-football cultural anchor’ to balance the weekend. Go morning, then pair it with a long lunch somewhere coastal. It’s the kind of day that makes the trip feel deeper than ‘city + match’."
    },
    {
      title: "Cagliari waterfront + harbour stroll",
      tip:
        "Simple but effective. It’s best as a late afternoon block before dinner. If you’re only in town for 24–48 hours, this is how you get ‘Mediterranean city’ vibes fast without planning."
    },
    {
      title: "Matchday as a structured half-day",
      tip:
        "Cagliari works best when you plan matchday properly: a calm morning, a food block, then stadium travel with buffer. Don’t try to cram a beach + hike + long lunch + match. You’ll either miss the vibe or arrive stressed."
    }
  ],

  tips: [
    "Cagliari is a logistics trip: book flights early, especially if you’re going weekend + match. Sardinia fills up fast and prices swing hard.",
    "Base choice matters more than ‘hotel quality’. Marina = walkable nightlife and easy evenings. Castello/Stampace = charm and views. Poetto = beach-first lifestyle but you’ll commute to restaurants.",
    "If your trip is short, don’t waste time switching beaches. Poetto gives you the ‘sea hit’ with minimal effort. Save the big coastal day trips for longer stays.",
    "Heat is not theoretical in summer — plan your ‘active’ blocks (hike/old town) early and use midday for beach/shade/slow lunch.",
    "Cagliari evenings start later than the UK. If you eat at 6pm you’ll feel like you’re dining alone. Do aperitivo, then dinner later.",
    "If you want the trip to feel premium without spending premium money: pick one standout seafood meal, one sunset viewpoint, and one beach day. That trio sells the whole break.",
    "Matchday transport: add buffer. Taxis and traffic can get unpredictable, and you don’t want to arrive rushed when the whole point is a clean, enjoyable experience.",
    "If you’re travelling with someone neutral on football, sell the match as ‘one cultural block’ inside a Sardinia break — it lands far better.",
    "Don’t over-schedule. Cagliari rewards ‘quality of hours’ more than ‘quantity of attractions’."
  ],

  food: [
    "Seafood in Marina (make this your ‘big meal’ of the trip)",
    "Malloreddus (Sardinian pasta; if you’re here and don’t try it, you’ve done it wrong)",
    "Fregola with seafood (Sardinian comfort-food energy)",
    "Bottarga (Sardinian speciality — strong flavour, very local)",
    "Seadas (dessert — take it seriously: it’s a proper Sardinia signature)",
    "Market grazing at San Benedetto (snack your way through, don’t force a sit-down plan)"
  ],

  transport:
    "Cagliari is straightforward once you accept the island reality: you’re either flying in, or doing a longer ferry + drive plan. Flights are the normal play. From the airport, you can get into the city efficiently; then most of the core (Marina, Castello, Stampace) is walkable. For beaches and day trips, you either rent a car or commit to tours/transfers — public transport can work for some routes, but if you want ‘effortless holiday’, a car (or pre-booked transfer) changes the whole feel of the trip.\n\nInside the city, think in blocks: walk old town + viewpoints, then reset by sea, then evening food/drink. If you’re staying in Poetto, plan a simple route back late-night (taxi/ride) so you’re not stranded trying to be clever after dinner.",

  accommodation:
    "Marina is the best all-round base for most travellers: you step out into restaurants, bars, and the harbour vibe, and you can walk to most sights. Castello gives you romance and views but comes with steep streets (and sometimes a ‘drag luggage uphill’ moment). Stampace is a strong value base: more local, still walkable, often less tourist-priced.\n\nPoetto is for beach-first travellers: perfect if your priority is ‘wake up near sea’. The trade-off is that you’ll travel in for the best evening energy. If you’re only staying 1–2 nights, don’t base too far out — you’ll waste too much time commuting and the trip will feel thinner than it should.",

  teams: [
    {
      name: "Cagliari Calcio",
      teamKey: "cagliari",
      stadium: "Unipol Domus (Cagliari)"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Unipol Domus",
        team: "Cagliari Calcio",
        area: "Cagliari (matchday access is manageable with planning)",
        transport: [
          "From Marina/Centro: taxi/ride is simplest; allow buffer around kickoff",
          "If you’re car-based: plan parking early and expect post-match congestion",
          "If you’re staying Poetto-side: travel is easy but still needs timing discipline"
        ],
        preMatchZones: [
          "Marina for a proper meal + aperitivo before you head over",
          "Castello viewpoint block earlier in the day to ‘earn’ the matchday",
          "Keep stadium-area food as a backup, not your main plan"
        ],
        notes:
          "The best Cagliari matchday is ‘calm + structured’: one daytime city block, one strong pre-match food stop, then a clean run to the stadium. The worst matchday is trying to squeeze in a full beach day and arriving sweaty, late, and annoyed."
      }
    ],

    postMatchAdvice:
      "Don’t overthink post-match. Get back toward Marina and finish the day the right way: a relaxed meal, a drink, and a waterfront walk. If you try to force an aggressive nightlife plan immediately after full time, you’ll fight transport and lose the mood."
  },

  footballCulture: {
    identity:
      "Cagliari is a club with real local identity — not a tourist brand. That’s good for travellers who want something authentic. The vibe is more ‘community pride’ than glamour, and it feels distinctly Sardinian rather than generic Italian football.",
    behaviour:
      "Expect passion without the polished ‘big club show’. It’s a proper matchday, and it fits perfectly into a Sardinia weekend because it doesn’t demand the entire trip’s identity — it complements it.",
    derby:
      "The real ‘rival’ is distance: you’re on an island, so your planning needs to be tighter than mainland trips. When you nail the logistics, it feels effortless; when you don’t, it can feel like you’re constantly reacting."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: false,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  genoa: {
  cityId: "genoa",
  name: "Genoa",
  country: "Italy",
  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.com/Attractions-g187823-Activities-Genoa_Italian_Riviera_Liguria.html",

  overview:
    "Genoa is a city with layers. It doesn’t present itself as ‘pretty’ in the way Florence or Venice does — and that’s exactly why it’s compelling. It’s a historic port city with a dense medieval core, grand seafront architecture, gritty working harbour zones, and a food culture that quietly punches above its weight.\n\nFor a football trip, Genoa is outstanding because it combines genuine urban character with two historic clubs and one of Italy’s most atmospheric stadiums. It also doubles as a gateway to the Italian Riviera, meaning you can build a trip that blends matchday with coastal scenery, food, and slower Mediterranean pacing.\n\nGenoa suits travellers who like cities with texture. If you enjoy places that feel lived-in rather than polished, and if you’re happy navigating narrow alleys, uneven streets, and occasional visual rough edges in exchange for authenticity, Genoa will massively over-deliver.",

  topThings: [
    {
      title: "Genoa Old Town (Centro Storico & caruggi)",
      tip:
        "This is the soul of the city. Don’t try to ‘route plan’ it too tightly — wander, get slightly lost, and follow instinct. The value is in atmosphere, not ticking streets off a map."
    },
    {
      title: "Porto Antico (Old Port)",
      tip:
        "Great as a late afternoon block. Pair a harbour walk with aperitivo. It’s not a full-day destination, but it’s a perfect transition zone between sightseeing and evening food."
    },
    {
      title: "Via Garibaldi (Palazzi dei Rolli)",
      tip:
        "Short, powerful hit of Renaissance grandeur. You don’t need to enter multiple palaces unless you’re a hardcore art person — walking the street itself delivers the impact."
    },
    {
      title: "Boccadasse fishing village",
      tip:
        "Feels like a postcard bolted onto the city. Go late afternoon, grab focaccia or gelato, and sit by the water. Romantic, calm, and very Genoa."
    },
    {
      title: "Lanterna di Genova (lighthouse)",
      tip:
        "More about symbolism than spectacle. If you climb it, do so on a clear day. If not, seeing it from the port area still ticks the box."
    },
    {
      title: "Aquarium of Genoa",
      tip:
        "One of Europe’s best aquariums. Strong option if you’re travelling with non-football companions or want a low-effort daytime block."
    },
    {
      title: "Nervi coastal promenade",
      tip:
        "Great half-day escape. Sea views, cliffside paths, and a calmer atmosphere than central Genoa."
    },
    {
      title: "Day trip to Camogli",
      tip:
        "Classic Ligurian seaside town. Easy train ride. If your trip is 3+ days, this adds serious value."
    },
    {
      title: "Day trip to Portofino",
      tip:
        "Beautiful but pricey. Treat it as scenery + photos + short wander, not an all-day spending spree."
    },
    {
      title: "Matchday as anchor experience",
      tip:
        "Build the day around the match, not the other way round. Genoa’s stadium atmosphere deserves energy and attention."
    }
  ],

  tips: [
    "Base centrally if possible. Genoa rewards walking, and steep hills make long daily commutes annoying.",
    "Expect visual contrast: elegant streets can sit next to gritty blocks. That’s normal here.",
    "Carry cash for small bakeries and focaccia shops.",
    "Genoa food culture is strong but understated — research one or two good spots rather than relying on random tourist menus.",
    "If you’re doing a Riviera day trip, lock the weather forecast first.",
    "Matchdays bring heavy local focus — arrive early and soak it in.",
    "Wear proper shoes. Old-town paving is uneven and slippery.",
    "If you only have 48 hours: one old-town day, one matchday, and optionally a short coastal trip.",
    "Genoa feels best when you slow down. Over-scheduling kills it."
  ],

  food: [
    "Pesto Genovese (this is ground zero — order it)",
    "Focaccia (plain, with onions, or cheese-filled)",
    "Farinata (chickpea flatbread)",
    "Seafood pasta",
    "Troffie al pesto",
    "Local white wines (Vermentino, Pigato)"
  ],

  transport:
    "Genoa’s historic core is best explored on foot. Buses and metro exist but are secondary to walking for visitors. Trains are excellent for Riviera trips (Camogli, Portofino via Santa Margherita Ligure, Nervi). From Genoa Airport, taxi or bus/train combo works.\n\nFor matchday, expect busy public transport. Plan your route in advance and allow buffer time.",

  accommodation:
    "Best areas: Centro Storico (for atmosphere), Porto Antico (for convenience), Brignole area (good transport links). Avoid staying too far up the hills unless you’re comfortable with steep climbs.\n\nPrioritise location over hotel luxury. A simple central base beats a nicer place far out.",

  teams: [
    {
      name: "Genoa CFC",
      teamKey: "genoa",
      stadium: "Stadio Luigi Ferraris"
    },
    {
      name: "Sampdoria",
      teamKey: "sampdoria",
      stadium: "Stadio Luigi Ferraris"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Stadio Luigi Ferraris",
        team: "Genoa CFC / Sampdoria",
        area: "Marassi district",
        transport: [
          "Bus from central Genoa",
          "Taxi from old town",
          "Allow extra time on derby days"
        ],
        preMatchZones: [
          "Bars and streets around Marassi",
          "Centro Storico food block, then travel",
          "Porto Antico aperitivo before heading over"
        ],
        notes:
          "Luigi Ferraris is one of Italy’s great old stadiums. Tight stands, steep angles, and raw atmosphere. Treat matchday as a highlight, not a checkbox."
      }
    ],

    postMatchAdvice:
      "Return toward central Genoa for dinner. Stadium area is about football, not post-match dining."
  },

  footballCulture: {
    identity:
      "Deep-rooted, emotional, and tribal. Genoa and Sampdoria supporters are fiercely proud of their history and identity.",
    behaviour:
      "Singing-heavy, choreographed sections, and constant noise. Even neutral travellers feel the intensity.",
    derby:
      "Derby della Lanterna — one of Italy’s great city derbies. If your trip overlaps one, prioritise it immediately."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  cremona: {
  cityId: "cremona",
  name: "Cremona",
  country: "Italy",
  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.com/Attractions-g187806-Activities-Cremona_Province_of_Cremona_Lombardy.html",

  overview:
    "Cremona is small, elegant, and quietly special. It doesn’t shout for attention, and that’s precisely its appeal. Known worldwide as the birthplace of Stradivari and the spiritual home of violin making, Cremona blends refined culture, beautiful architecture, and a calm pace that feels far removed from Italy’s major tourist circuits.\n\nFor football travellers, Cremona works as a ‘pure Italian weekend’ city — compact, walkable, food-focused, and relaxed. It’s ideal if you want to combine a match with gentle sightseeing, long lunches, and atmospheric evening walks rather than heavy museum marathons or frantic box-ticking.\n\nCremona suits travellers who appreciate craft, tradition, and understated charm. It’s not about spectacle. It’s about quality, rhythm, and depth.",

  topThings: [
    {
      title: "Piazza del Comune",
      tip:
        "This is the heart of the city. Visit multiple times — morning for quiet photos, evening for atmosphere and aperitivo."
    },
    {
      title: "Torrazzo di Cremona",
      tip:
        "Climb if you’re able. Views over Lombardy are excellent, and the climb itself is part of the experience."
    },
    {
      title: "Cremona Cathedral (Duomo)",
      tip:
        "Step inside even if you’re not a church person. The interior artwork and scale justify the visit."
    },
    {
      title: "Violin Museum (Museo del Violino)",
      tip:
        "Non-negotiable in Cremona. Even casual visitors will appreciate the craftsmanship story."
    },
    {
      title: "Luthier workshops",
      tip:
        "Look for small independent violin makers near the historic centre. Many allow quiet browsing."
    },
    {
      title: "Po River embankment walk",
      tip:
        "Good late afternoon stroll. Calm, open space, and a break from stone streets."
    },
    {
      title: "Corso Garibaldi shopping street",
      tip:
        "Compact retail strip with cafés and bakeries. Useful downtime block."
    },
    {
      title: "Local pastry crawl",
      tip:
        "Cremona sweets are famous — try torrone, mostaccino, and nougat-based desserts."
    },
    {
      title: "Small wine bars",
      tip:
        "Focus on local Lombardy wines rather than generic international lists."
    },
    {
      title: "Matchday anchor",
      tip:
        "Keep your daytime plans light so you can lean into matchday atmosphere."
    }
  ],

  tips: [
    "Cremona is walkable end-to-end. Choose central accommodation and forget transport.",
    "Book lunch or dinner in advance on weekends — options are fewer than big cities.",
    "Expect a slower pace. Shops close mid-afternoon.",
    "Bring good walking shoes; historic paving throughout.",
    "If you’re staying multiple nights, combine with a Milan or Parma day trip.",
    "Cremona shines in simple pleasures: food, coffee, wandering.",
    "Arrive earlier than you think on matchday; streets fill quickly.",
    "This is a ‘quality over quantity’ city — don’t overschedule."
  ],

  food: [
    "Torrone (nougat)",
    "Mostaccino biscuits",
    "Fresh pasta with butter and sage",
    "Risotto",
    "Local cured meats",
    "Grana Padano cheeses",
    "Lombardy red wines"
  ],

  transport:
    "Cremona is best explored on foot. Trains connect well to Milan, Parma, Brescia, and Mantua. From Cremona station, the historic centre is a short walk or taxi ride.\n\nOn matchday, local buses run toward the stadium area, but walking or taxi is simplest.",

  accommodation:
    "Stay inside or just outside the historic centre. Anywhere near Piazza del Comune is ideal. Avoid peripheral industrial zones unless you’re purely sleeping and leaving early.",

  teams: [
    {
      name: "US Cremonese",
      teamKey: "cremonese",
      stadium: "Stadio Giovanni Zini"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Stadio Giovanni Zini",
        team: "US Cremonese",
        area: "East of historic centre",
        transport: [
          "25-minute walk from centre",
          "Short taxi ride",
          "Local bus routes"
        ],
        preMatchZones: [
          "Bars around Piazza del Comune",
          "Cafés near Corso Garibaldi",
          "Small bars close to stadium"
        ],
        notes:
          "Traditional Italian stadium feel. Compact, intimate, and loud when full."
      }
    ],

    postMatchAdvice:
      "Head back into the historic centre for dinner. Stadium surroundings are limited for food options."
  },

  footballCulture: {
    identity:
      "Community-focused and proud. Supporters see the club as a representation of the city’s identity.",
    behaviour:
      "Singing-heavy, emotional support. Smaller scale than giants, but intense.",
    derby:
      "Regional Lombardy rivalries add edge depending on opponent."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  parma: {
  cityId: "parma",
  name: "Parma",
  country: "Italy",
  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.com/Attractions-g187804-Activities-Parma_Province_of_Parma_Emilia_Romagna.html",

  overview:
    "Parma is one of Italy’s great understated cities — elegant, calm, wealthy in culture, and obsessed with quality. It sits at the heart of Emilia-Romagna, a region many Italians consider the country’s true gastronomic capital. Parma isn’t about ticking landmarks; it’s about slowing down and enjoying exceptional food, beautiful historic spaces, and a relaxed rhythm that never feels touristic.\n\nFor football travellers, Parma offers a rare combination: a historic club, a classic stadium embedded inside the city, and a centre that feels genuinely liveable rather than built for visitors. You can eat extraordinarily well, walk everywhere, soak up refined Italian atmosphere, and attend a match without logistical stress.\n\nParma suits travellers who value substance over spectacle. It’s for people who care about what they’re eating, where their wine comes from, and why a city feels the way it does. If Milan is high-energy and Rome is overwhelming, Parma is confident, calm, and deeply satisfying.",

  topThings: [
    {
      title: "Parma Cathedral (Duomo di Parma)",
      tip:
        "A masterpiece of Romanesque architecture and one of northern Italy’s finest cathedrals. Go in the morning when it’s quiet and light spills through the interior. Spend time with the ceiling frescoes and carved reliefs — this isn’t a quick photo stop."
    },
    {
      title: "Baptistery of Parma",
      tip:
        "Right beside the Duomo and absolutely essential. The interior fresco cycles are extraordinary. Combine Cathedral + Baptistery as one focused historical block rather than scattering them."
    },
    {
      title: "Teatro Regio di Parma",
      tip:
        "One of Italy’s great opera houses and central to Parma’s identity. Even if you don’t attend a performance, walk past and step inside if open. Parma takes opera seriously."
    },
    {
      title: "Parco Ducale",
      tip:
        "Large historic park on the west side of the river. Perfect mid-afternoon reset spot. Locals picnic, walk dogs, and cycle. Excellent contrast after museum-heavy sightseeing."
    },
    {
      title: "Oltretorrente neighbourhood",
      tip:
        "Cross the river for a more local, residential feel. Narrow streets, bakeries, trattorias, and everyday Parma life. Ideal area to wander without an agenda."
    },
    {
      title: "Parmigiano Reggiano dairy visit",
      tip:
        "If you have half a day, book a morning dairy tour in the countryside. You’ll see production, ageing rooms, and tastings. It dramatically improves your appreciation of the product."
    },
    {
      title: "Prosciutto di Parma / Culatello producers",
      tip:
        "Similar to cheese tours — best booked in advance. Pair with a countryside lunch if possible."
    },
    {
      title: "Strada Cavour & central shopping streets",
      tip:
        "Compact and elegant. More about atmosphere than shopping bargains."
    },
    {
      title: "Wine bars around Borgo delle Colonne & Strada Farini",
      tip:
        "Excellent for aperitivo and relaxed evening drinking. Order local sparkling Lambrusco or Emilia whites."
    },
    {
      title: "Matchday walk to Stadio Tardini",
      tip:
        "Walk from the centre through residential streets. Builds atmosphere gradually and avoids transport stress."
    }
  ],

  tips: [
    "Parma rewards planning meals more than planning sights — research where you want to eat.",
    "Lunch menus offer better value than dinner.",
    "Book Friday and Saturday dinners ahead.",
    "Avoid restaurants with laminated menus or photos.",
    "You don’t need a car unless doing countryside food tours.",
    "Shops often close mid-afternoon.",
    "Evenings are relaxed rather than party-focused.",
    "Quality shoes matter — cobbles and long walks are normal.",
    "Expect slower service; this is a city that doesn’t rush."
  ],

  food: [
    "Parmigiano Reggiano (multiple ages)",
    "Prosciutto di Parma",
    "Culatello di Zibello",
    "Tortelli d’erbetta",
    "Anolini in brodo",
    "Fresh tagliatelle with ragù",
    "Lambrusco",
    "Local Emilia white wines"
  ],

  transport:
    "Parma is compact and highly walkable. Train station is a 10–15 minute walk from the historic centre and connects well to Milan, Bologna, Modena, Reggio Emilia, and La Spezia.\n\nLocal buses serve the stadium area but walking or short taxi rides are easier. Taxis are inexpensive within the city.",

  accommodation:
    "Stay inside the historic centre or near Parco Ducale. Being central matters more than being near the station. Boutique hotels and apartments dominate.",

  teams: [
    {
      name: "Parma Calcio",
      teamKey: "parma",
      stadium: "Stadio Ennio Tardini"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Stadio Ennio Tardini",
        team: "Parma Calcio",
        area: "South-east of historic centre",
        transport: [
          "25 minute walk from centre",
          "Short taxi ride",
          "Local bus"
        ],
        preMatchZones: [
          "Bars near Parco Ducale",
          "Cafés around Strada Cavour",
          "Small bars close to stadium"
        ],
        notes:
          "Historic, traditional Italian stadium embedded within the city. Compact, steep stands, and old-school atmosphere."
      }
    ],

    postMatchAdvice:
      "Head back to the historic centre for dinner or wine bars. Stadium surroundings are limited."
  },

  footballCulture: {
    identity:
      "Proud of the club’s 1990s golden era and famous former players. Support is loyal, knowledgeable, and rooted in tradition.",
    behaviour:
      "Singing-focused, steady atmosphere rather than nonstop chaos.",
    derby:
      "Regional tension with Bologna, Modena, Reggiana."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  lecce: {
  cityId: "lecce",
  name: "Lecce",
  country: "Italy",
  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.com/Attractions-g194791-Activities-Lecce_Province_of_Lecce_Puglia.html",

  overview:
    "Lecce is the cultural jewel of Salento — the deep south of Puglia — and it punches far above its size. The city is famous for its honey-coloured limestone and wildly ornate Baroque architecture, but what makes Lecce special as a trip base is the *feel*: elegant streets, a serious food culture, and evenings built around slow aperitivo, late dinners, and people-watching.\n\nFor a football break, Lecce is a gift because it gives you two trips in one: a beautiful, compact historic city you can fully enjoy on foot, plus quick access to the Salento coastline (Otranto, Gallipoli, Santa Maria di Leuca) if you’ve got extra time. Matchday adds another layer: local pride runs strong, and the club is a major identity anchor for the city.\n\nLecce suits travellers who want atmosphere and authenticity without needing a packed checklist. You can do ‘iconic sights’ in a half day, then spend the rest of the trip eating well, wandering, and using Lecce as a base for day trips. It’s not flashy — it’s stylish, warm, and confidently southern.",

  topThings: [
    {
      title: "Basilica di Santa Croce (Baroque masterpiece)",
      tip:
        "This is Lecce’s signature building and the best example of ‘Lecce Baroque’. Go twice if you can: once in bright daytime to catch the detail, and again near golden hour when the stone glows. Don’t just look at the façade — circle it and take time to spot the carved animals, faces, and symbolic motifs."
    },
    {
      title: "Piazza del Duomo (Cathedral square at night)",
      tip:
        "One of Italy’s most theatrical squares. Visit in daylight, but *especially* go after dinner when it’s softly lit and quieter — it feels like a film set. The square is enclosed and intimate, so it hits differently compared to big open piazzas elsewhere."
    },
    {
      title: "Roman Amphitheatre (Piazza Sant’Oronzo)",
      tip:
        "Right in the centre — a reminder that Lecce has Roman bones under all the Baroque. Best approach: treat this as your city ‘anchor point’ and build your wandering loops from here. It’s not huge like Rome, but it’s atmospheric and very ‘Lecce’ because it sits inside everyday life."
    },
    {
      title: "Baroque wandering loop (the real Lecce experience)",
      tip:
        "Lecce is at its best when you stop trying to ‘do sights’ and just drift: small churches, carved doorways, hidden courtyards, artisan shops. Set a loose loop: Santa Croce → Duomo → Sant’Oronzo → back streets around Via Libertini. Give yourself permission to pause for coffee, gelato, or aperitivo — that’s the point."
    },
    {
      title: "Museo Faggiano (unexpected highlight)",
      tip:
        "A small museum that surprises people because it’s essentially a family home that revealed layers of history during renovations. This is perfect if you want something memorable that isn’t a ‘big museum day’. It’s compact, story-driven, and easy to fit around a match weekend."
    },
    {
      title: "Porta Napoli & the historic entry feel",
      tip:
        "A classic photo point and a good way to understand how the city was ‘entered’. Combine it with a slow walk back into the centre through smaller streets rather than the main drag — that’s where the charm sits."
    },
    {
      title: "Salento day trip: Otranto (coast + old town)",
      tip:
        "If you have one day outside Lecce, Otranto is a strong ‘first pick’: pretty old town, seafront views, and a clear change of pace. Go early to avoid peak crowds in high season, and plan a long lunch rather than rushing back."
    },
    {
      title: "Salento day trip: Gallipoli (sunset + energy)",
      tip:
        "Gallipoli is more ‘lively’ — beach vibes and nightlife in season. It’s great if you want a more social atmosphere and a dramatic sunset. If you’re choosing between Otranto and Gallipoli: Otranto is calmer and prettier; Gallipoli is louder and more party-adjacent."
    },
    {
      title: "Evening aperitivo culture (commit to it properly)",
      tip:
        "This isn’t a ‘one drink then dinner’ city. Do it the southern way: pick a good spot, order a spritz or local wine, snack slowly, then roll into dinner later. Your whole trip will feel more ‘right’ if you follow the local rhythm."
    },
    {
      title: "Matchday at Via del Mare (US Lecce)",
      tip:
        "Build the day around it: lunch → pre-match aperitivo → walk/ride out → match → late dinner back in town. The vibe is better if you *don’t* try to cram sightseeing right up to kickoff. Give yourself buffer time and treat matchday as the main event."
    }
  ],

  tips: [
    "Lecce is best enjoyed at a slower pace — plan one ‘sight block’ per day, then leave space to wander.",
    "Evenings start later: aperitivo into dinner is the default rhythm; don’t eat too early unless you want quiet restaurants.",
    "The stone colour changes dramatically with light — golden hour is your best photo window.",
    "In peak summer, do sightseeing early and late; keep mid-afternoon for shade, cafés, or a rest.",
    "Comfortable shoes matter: historic paving + lots of walking adds up.",
    "If you want a coastline day trip, pick *one* (Otranto or Gallipoli) rather than trying to do both and rushing.",
    "Book your best dinners in advance on Fridays and Saturdays — match weekends can tighten availability.",
    "If you’re sensitive to heat, prioritise indoor stops (Museo Faggiano, churches) between 12:30–16:30.",
    "Treat Lecce like a base: the city is compact, but Salento opens up the moment you take a train/bus/car for an hour."
  ],

  food: [
    "Pasticciotto (the local pastry — best warm, morning or afternoon)",
    "Rustico leccese (savory pastry snack — ideal quick bite)",
    "Orecchiette / local pasta dishes (Puglia staples, often with simple, high-quality ingredients)",
    "Frisella (especially in warm weather — light, salty, satisfying)",
    "Seafood when you day-trip to the coast (make it a long lunch experience)",
    "Primitivo / Negroamaro wines (regional reds worth exploring)",
    "Amaro salentino (digestif culture — end your meal properly)"
  ],

  transport:
    "Lecce’s historic centre is compact and walkable — once you’re in, you rarely need transport. The train station is within walking distance of the centre (roughly 10–15 minutes depending on where you stay).\n\nFor Salento day trips, trains and buses can work (especially to major spots), but schedules vary and can be slower outside peak routes. If you want maximum flexibility for beaches and smaller coastal points, a rental car (or private transfers) makes day trips much easier.\n\nMatchday: expect a short ride out to the stadium area. Plan your route back after full time — taxis can tighten and buses can be crowded.",

  accommodation:
    "Best stays are inside or just outside the historic centre so you can walk everywhere and enjoy the evening atmosphere without logistics. Boutique hotels and apartments dominate, and the value is generally strong compared to Italy’s biggest cities.\n\nIf you’re doing coast-heavy plans, decide whether you want to base in Lecce (culture + city evenings) or the coast (beach-first). For a football trip, Lecce centre is the stronger ‘overall experience’.",

  teams: [
    {
      name: "US Lecce",
      teamKey: "lecce",
      stadium: "Stadio Via del Mare"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Stadio Via del Mare",
        team: "US Lecce",
        area: "Outside the historic centre (stadium district)",
        transport: [
          "Short taxi ride from the centre",
          "Local bus options (crowded near kickoff / full time)",
          "Drive/park if you’re outside town (allow extra time)"
        ],
        preMatchZones: [
          "Historic centre aperitivo then head out (best for atmosphere + food)",
          "Local bars nearer the stadium for more traditional pre-match energy"
        ],
        notes:
          "A proper southern Italian matchday: strong local identity, pride, and intensity. The stadium experience is best when you give yourself time — arrive with buffer, know your route home, and plan your post-match dinner back in the centre rather than hanging around the stadium area."
      }
    ],

    postMatchAdvice:
      "After full time, head back to the centre for a late dinner or wine bar. Lecce evenings are one of the city’s biggest strengths — don’t waste them by trying to improvise around the stadium district."
  },

  footballCulture: {
    identity:
      "US Lecce is a major point of pride in Salento. The club represents the south, resilience, and local identity — especially in seasons where they’re competing against richer northern institutions.",
    behaviour:
      "Matchday energy is emotional and proud rather than polished. Expect passionate support and a strong sense of ‘this is ours’.",
    derby:
      "Regional tension exists across Puglia and the south; rivalries can feel more cultural than purely geographic."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},


  florence: {
  cityId: "florence",
  name: "Florence",
  country: "Italy",
  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.com/Attractions-g187895-Activities-Florence_Tuscany.html",

  overview:
    "Florence is one of Europe’s heavyweight cultural capitals, but it’s also compact, walkable, and surprisingly manageable for a short football-led break if you approach it properly. This is a city of Renaissance masterpieces, tight historic streets, strong food traditions, and evening life built around wine, conversation, and slow pacing.\n\nFor travellers, Florence works because it delivers iconic sights, excellent eating, and a distinct atmosphere without the sprawl of Rome or the chaos of Venice. You can realistically cover the core city on foot, build days around one major cultural block plus wandering, and still have energy left for matchday.\n\nAs a football destination, Florence carries real identity. ACF Fiorentina is tightly woven into local culture, and matchdays feel emotional rather than corporate. Combine that with Florence’s visual beauty and food scene and you get a city that feels special even before you step into the stadium.",

  topThings: [
    {
      title: "Florence Cathedral (Duomo) complex",
      tip:
        "This is not just the cathedral — it’s a cluster: Duomo exterior, Baptistery, Giotto’s Campanile, and the Dome climb. Pick ONE paid element if time-limited (dome climb or tower). The exterior and square give huge impact without spending hours."
    },
    {
      title: "Piazza della Signoria & Palazzo Vecchio",
      tip:
        "Treat this as your visual anchor point. Visit during the day for sculpture and architecture, then again at night when it’s floodlit and buzzing. It’s one of Florence’s best people-watching spots."
    },
    {
      title: "Uffizi Gallery (if you do one major museum)",
      tip:
        "Pre-book and target highlights rather than wandering aimlessly. Early morning or last entry slots are far better than midday."
    },
    {
      title: "Ponte Vecchio → Oltrarno walk",
      tip:
        "Cross the bridge, then keep walking into Oltrarno for a more local feel: artisan workshops, wine bars, and better-value restaurants than the historic core."
    },
    {
      title: "Piazzale Michelangelo viewpoint",
      tip:
        "Best panoramic view of Florence. Go late afternoon or sunset. Walk up if you enjoy hills; otherwise bus or taxi. Stay a little after sunset when crowds thin and lights come on."
    },
    {
      title: "Accademia Gallery (David)",
      tip:
        "If Michelangelo’s David matters to you, book early. The gallery itself is small — this is a quick, focused visit."
    },
    {
      title: "San Lorenzo & Mercato Centrale",
      tip:
        "Downstairs market for produce and quick bites; upstairs food hall for casual eating. Good daytime stop, not a must-see nightlife area."
    },
    {
      title: "Santa Croce district",
      tip:
        "Strong evening area: bars, casual restaurants, and a younger crowd. Good place to base nights if you’re not staying in Oltrarno."
    },
    {
      title: "Tuscan wine bar session",
      tip:
        "Don’t rush. Pick one wine bar, ask for recommendations, pair with small plates, and lean into the slower pace."
    },
    {
      title: "Matchday at Stadio Artemio Franchi",
      tip:
        "Plan food and drinks in the centre or Santa Croce first, then head out. Treat matchday as its own block, not squeezed between museums."
    }
  ],

  tips: [
    "Florence rewards early starts: hit big sights before 10am, wander later.",
    "Pre-book major museums if visiting Fri–Sun or peak season.",
    "Avoid restaurants with photo menus and pushy hosts — walk two streets away.",
    "Lunch menus are often better value than dinner.",
    "Florence is compact: walking beats taxis for most central trips.",
    "Book your best dinner spots in advance on match weekends.",
    "Sunset is prime-time — plan viewpoints or river walks around it.",
    "One big cultural activity per half-day is enough; don’t stack museums."
  ],

  food: [
    "Bistecca alla Fiorentina (share one if you’re not huge eaters)",
    "Ribollita / Pappa al pomodoro (Tuscan classics)",
    "Fresh pasta with wild boar ragù",
    "Lampredotto sandwich (street-food tradition)",
    "Cantucci + Vin Santo (dessert ritual)",
    "Tuscan reds (Chianti Classico, Brunello if available)"
  ],

  transport:
    "Historic Florence is extremely walkable. Buses cover outer districts and the stadium area. Taxis are useful late at night but not essential for daytime.\n\nIf doing Tuscany day trips, trains are strong to Pisa, Siena, and Bologna; cars give more freedom for countryside villages.",

  accommodation:
    "Best bases: Historic Centre for first-timers, Santa Croce for nightlife + walkability, Oltrarno for charm and food. Being within walking distance of the centre matters more than luxury level.",

  teams: [
    {
      name: "ACF Fiorentina",
      teamKey: "fiorentina",
      stadium: "Stadio Artemio Franchi"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Stadio Artemio Franchi",
        team: "ACF Fiorentina",
        area: "Campo di Marte district",
        transport: [
          "Bus from city centre",
          "Train to Firenze Campo di Marte station",
          "Taxi"
        ],
        preMatchZones: [
          "Santa Croce bars",
          "Historic centre wine bars",
          "Local bars near Campo di Marte"
        ],
        notes:
          "Traditional stadium with strong local atmosphere. Expect emotional support and visible club identity. Arrive early for smoother entry."
      }
    ],

    postMatchAdvice:
      "Head back towards Santa Croce or Oltrarno for dinner and drinks. Florence nights are best in neighbourhood areas rather than around the stadium."
  },

  footballCulture: {
    identity:
      "Fiorentina represents Florentine pride, artistic heritage, and emotional support. Success and failure are felt deeply.",
    behaviour:
      "Fans are expressive and critical when standards drop, but intensely loyal.",
    derby:
      "Rivalries across Tuscany add edge, but identity is strongest around Florence itself."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  verona: {
  cityId: "verona",
  name: "Verona",
  country: "Italy",
  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.com/Attractions-g187871-Activities-Verona_Province_of_Verona_Veneto.html",

  overview:
    "Verona sits in a perfect sweet spot for football travel: historic, romantic, compact, and easy to navigate, yet big enough to feel alive across an entire weekend. The city is best known internationally for Roman heritage and Shakespeare associations, but underneath that is a proud northern Italian city with strong local identity, excellent food traditions, and a deep-rooted football culture.\n\nFor travellers, Verona works because almost everything you’ll want is walkable inside the old town, with clear districts, beautiful public spaces, and a relaxed rhythm that contrasts nicely with the intensity of matchday. You can cover major sights without rushing, enjoy long meals, and still treat the match as a central event rather than an afterthought.\n\nAs a football city, Verona offers something increasingly rare in top-level European leagues: raw, emotional support, a traditional stadium environment, and a fanbase that treats survival, mid-table finishes, and derby wins as genuinely meaningful achievements.",

  topThings: [
    {
      title: "Arena di Verona",
      tip:
        "One of the best-preserved Roman amphitheatres in the world. View it during the day for photos, then again at night when the square is lit and lively. Interior visits are optional if short on time."
    },
    {
      title: "Piazza Bra",
      tip:
        "Use this as your central anchor. Cafés, bars, and open space make it ideal for pre-dinner drinks or post-sightseeing downtime."
    },
    {
      title: "Piazza delle Erbe",
      tip:
        "Historic market square with medieval buildings. Good daytime wander and evening atmosphere. Don’t eat directly on the square unless you accept higher prices."
    },
    {
      title: "Juliet’s House (Casa di Giulietta)",
      tip:
        "Treat as a quick photo stop. The courtyard gets crowded; don’t queue unless you’re a die-hard Shakespeare fan."
    },
    {
      title: "Castelvecchio & Ponte Scaligero",
      tip:
        "Strong combination of history, architecture, and river views. Walk across the bridge afterwards for photos."
    },
    {
      title: "Adige riverside walk",
      tip:
        "Slow stroll along the river gives a calmer perspective on the city and great sunset light."
    },
    {
      title: "Torricelle Hills viewpoint",
      tip:
        "Short hike or bus ride above the city for panoramic views. Worth it if you have a spare half-day."
    },
    {
      title: "San Zeno Basilica",
      tip:
        "Beautiful Romanesque church in the San Zeno district, close to Hellas Verona’s stadium."
    },
    {
      title: "Wine bar crawl",
      tip:
        "Veneto wines are excellent. Pick 1–2 quality wine bars rather than hopping endlessly."
    },
    {
      title: "Matchday at Stadio Marcantonio Bentegodi",
      tip:
        "Plan your route and food in advance. Treat matchday as its own focused block."
    }
  ],

  tips: [
    "Verona is compact — walk whenever possible.",
    "Eat lunch in the centre, dinner slightly away from main squares.",
    "Pre-book restaurants on Friday and Saturday nights.",
    "Carry cash for small cafés and bakeries.",
    "Sunset is ideal for river walks or viewpoints.",
    "Matchday transport is simple but buses fill quickly.",
    "Avoid trying to squeeze Lake Garda into a tight schedule — it deserves proper time."
  ],

  food: [
    "Risotto all’Amarone",
    "Bigoli pasta",
    "Polenta with meat or mushroom sauces",
    "Horse-meat specialities (traditional in Verona)",
    "Cicchetti-style small plates",
    "Local Valpolicella and Amarone wines"
  ],

  transport:
    "Historic centre is walkable. Buses connect San Zeno district and the stadium. Taxis useful late night but not essential.\n\nVerona Porta Nuova station has strong rail links to Milan, Venice, Bologna, and Lake Garda towns.",

  accommodation:
    "Best bases: Historic Centre for sightseeing, San Zeno for match proximity, Veronetta for slightly cheaper stays. Prioritise walkability over luxury level.",

  teams: [
    {
      name: "Hellas Verona",
      teamKey: "hellas-verona",
      stadium: "Stadio Marcantonio Bentegodi"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Stadio Marcantonio Bentegodi",
        team: "Hellas Verona",
        area: "Borgo Milano / San Zeno",
        transport: [
          "Bus from city centre",
          "Taxi",
          "20–25 min walk from Arena area"
        ],
        preMatchZones: [
          "San Zeno neighbourhood bars",
          "Historic centre pubs",
          "Local cafés around Borgo Milano"
        ],
        notes:
          "Traditional bowl stadium with strong ultras presence. Expect intense atmosphere, especially against rivals."
      }
    ],

    postMatchAdvice:
      "Return to the historic centre for dinner and wine. San Zeno is quieter after matches."
  },

  footballCulture: {
    identity:
      "Verona fans are fiercely loyal and value grit, organisation, and survival. The club represents local pride more than glamour.",
    behaviour:
      "Home support is loud and confrontational. Atmosphere feels old-school Italian.",
    derby:
      "Strong rivalry with nearby cities, especially regional opponents in Veneto and Lombardy."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},

  pisa: {
  cityId: "pisa",
  name: "Pisa",
  country: "Italy",
  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.com/Attractions-g187899-Activities-Pisa_Province_of_Pisa_Tuscany.html",

  overview:
    "Pisa is far more than a Leaning Tower photo stop. It is a compact Tuscan city with deep academic roots, strong local identity, excellent food culture, and a football tradition that punches above its size. For travellers combining football with a classic Italian city break, Pisa offers a brilliant balance: history, walkability, affordability compared to Florence, and easy rail connectivity across Tuscany.\n\nThe city works especially well for slower, more atmospheric trips. You can cover the headline sights in half a day, then spend the rest of your time eating well, wandering neighbourhoods, and treating the match as a central weekend event rather than something squeezed between attractions.\n\nAs a football destination, Pisa appeals because it feels authentic. The stadium sits close to the historic core, fans are deeply attached to their club, and matchdays feel local, noisy, and personal — not sanitised tourist experiences.",

  topThings: [
    {
      title: "Leaning Tower of Pisa & Piazza dei Miracoli",
      tip:
        "Go early morning or near sunset to avoid tour-bus crowds. Even if you don’t climb the tower, walk the full square and take time inside the cathedral."
    },
    {
      title: "Pisa Cathedral (Duomo)",
      tip:
        "Often overshadowed by the tower but genuinely impressive inside. Quick visit with high payoff."
    },
    {
      title: "Camposanto Monumentale",
      tip:
        "Historic cemetery with frescoes and cloisters. Calm and atmospheric."
    },
    {
      title: "Arno River walk",
      tip:
        "Stroll along the riverbanks for classic Tuscan city views and bridges."
    },
    {
      title: "Borgo Stretto",
      tip:
        "Central street for cafés, bakeries, and casual shopping. Good base area."
    },
    {
      title: "Piazza dei Cavalieri",
      tip:
        "Historic square tied to Pisa’s academic heritage. Quieter than tourist zones."
    },
    {
      title: "Tuttomondo mural",
      tip:
        "Large Keith Haring mural near the station — quick cultural stop."
    },
    {
      title: "Wine bar evening",
      tip:
        "Choose a small local enoteca and stay put rather than hopping constantly."
    },
    {
      title: "Day trip option: Lucca or Florence",
      tip:
        "Lucca is calmer and closer; Florence is iconic but busier."
    },
    {
      title: "Matchday at Arena Garibaldi",
      tip:
        "Plan pre-match food and drinks nearby and arrive early."
    }
  ],

  tips: [
    "Pisa is walkable — taxis rarely needed.",
    "Eat away from Tower-adjacent streets for better value.",
    "Book restaurants on Friday/Saturday nights.",
    "Lunch menus offer excellent value.",
    "Combine Pisa with another Tuscan city if staying more than two nights.",
    "Expect slower service at meals — it’s normal.",
    "Matchdays feel local and communal — lean into it."
  ],

  food: [
    "Cecina (chickpea flatbread)",
    "Pici or fresh Tuscan pasta",
    "Seafood pasta",
    "Tuscan soups",
    "Grilled meats",
    "Local Chianti and Tuscan reds"
  ],

  transport:
    "Historic centre is walkable. Pisa Centrale station connects directly to Florence, Lucca, Livorno, La Spezia, and beyond.\n\nLocal buses cover outer areas, but most visitors won’t need them.",

  accommodation:
    "Best bases: near Borgo Stretto, Arno river area, or near station for rail day trips. Pisa offers better value than Florence for similar quality.",

  teams: [
    {
      name: "Pisa SC",
      teamKey: "pisa",
      stadium: "Arena Garibaldi – Stadio Romeo Anconetani"
    }
  ],

  matchday: {
    stadiums: [
      {
        name: "Arena Garibaldi – Stadio Romeo Anconetani",
        team: "Pisa SC",
        area: "Near historic centre / San Rossore",
        transport: [
          "15–20 min walk from centre",
          "Bus",
          "Taxi"
        ],
        preMatchZones: [
          "Bars around Borgo Stretto",
          "Cafés near stadium",
          "Riverfront pubs"
        ],
        notes:
          "Compact stadium with close-to-pitch stands and loud home support. Traditional Italian atmosphere."
      }
    ],

    postMatchAdvice:
      "Head back toward Borgo Stretto or Arno river for food and drinks. Stadium area quiets quickly."
  },

  footballCulture: {
    identity:
      "Pisa fans value resilience, pride, and togetherness. The club is a major part of city identity.",
    behaviour:
      "Support is vocal and emotional. Expect singing, flags, and coordinated sections.",
    rivals:
      "Strong Tuscan rivalries, especially with nearby cities."
  },

  monetisation: {
    hotelsSearch: true,
    flightsSearch: true,
    trainsSearch: true,
    experiencesSearch: true,
    mapsSearch: true
  }
},




  
};



export default serieACityGuides;
