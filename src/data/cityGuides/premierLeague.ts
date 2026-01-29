import type { CityGuide } from "./types";

export const premierLeagueCityGuides: Record<string, CityGuide> = {

london: {
  cityId: "london",
  name: "London",
  country: "England",

  overview:
    "London is less a single city and more a collection of villages stitched together by world-class transport. For football travellers, it offers unmatched variety: multiple Premier League clubs, historic stadiums, endless neighbourhood character, and a matchday culture that ranges from polished big-club spectacle to raw local intensity. The key to enjoying London is zoning — pick areas, not endless checklists.",

  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.com/Attractions-g186338-Activities-London_England.html",

  topThings: [
    {
      title: "Westminster → South Bank Walk",
      tip: "Start at Westminster, walk past Big Ben, London Eye, and finish near Tower Bridge. Best at golden hour. Skip paid viewpoints — this walk gives better atmosphere for free."
    },
    {
      title: "Borough Market",
      tip: "Arrive before noon or mid-afternoon to avoid crush. Focus on one or two food stalls, not everything."
    },
    {
      title: "British Museum",
      tip: "Choose 2–3 galleries only. Trying to ‘do the whole museum’ is counterproductive."
    },
    {
      title: "Soho & Covent Garden Evening",
      tip: "Book dinner first, then wander. Soho is better discovered without a strict plan."
    },
    {
      title: "Greenwich",
      tip: "Take the Thames Clipper boat one way — sightseeing plus transport in one."
    },
    {
      title: "Notting Hill & Portobello Road",
      tip: "Market days are lively; weekday mornings are calmer for photos."
    },
    {
      title: "Camden Markets",
      tip: "Great for street food and people-watching. Shopping is secondary."
    },
    {
      title: "Primrose Hill Viewpoint",
      tip: "Free skyline view, especially good near sunset."
    },
    {
      title: "Neighbourhood Pub Session",
      tip: "Avoid pubs next to major landmarks. Walk 5 minutes into residential streets."
    },
    {
      title: "Pre-match Area Near Stadium",
      tip: "Arrive early and soak up the local streets around the ground — often better than central London pre-drinks."
    }
  ],

  tips: [
    "Use contactless on Tube and buses — daily caps make it cheaper than expected.",
    "Walking + Tube beats Uber in central London.",
    "Book restaurants Thu–Sun, especially on match weekends.",
    "Treat London as zones: one main area per day.",
    "Stadium areas empty fast after matches — plan one post-match stop."
  ],

  food: [
    "Borough Market",
    "Dishoom (book ahead)",
    "Traditional Sunday roast (reserve)",
    "Proper fish & chips",
    "Late-night kebab after match"
  ],

  transport:
    "Contactless works on Tube, buses, and most trains. The Underground is fast but busy at peaks. Citymapper or Google Maps give accurate live routing.",

  accommodation:
    "Prioritise being near a Tube line over being ‘central’. Zone 2 near stations often gives better value than Zone 1."
},

manchester: {
    cityId: "manchester",
    name: "Manchester",
    country: "England",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187069-Activities-Manchester_Greater_Manchester_England.html",
    overview:
      "Manchester is one of the UK’s best football cities and an easy weekend break even if you never set foot near a stadium. It’s compact, walkable, and built around food, music, nightlife, and industrial heritage. You don’t need an overloaded itinerary here — a couple of strong daytime blocks and relaxed evenings will give you a great trip.",

    topThings: [
      {
        title: "Northern Quarter wander",
        tip: "Base yourself here if possible. Independent shops, record stores, street art, and casual food spots all within a small grid."
      },
      {
        title: "Manchester Museum",
        tip: "Free, high quality, and right by the university. Strong natural history and Egypt sections."
      },
      {
        title: "Science and Industry Museum",
        tip: "Great for understanding why Manchester matters historically. Easy half-day visit."
      },
      {
        title: "Castlefield canals",
        tip: "Good daytime stroll or early evening walk. Combine with drinks nearby."
      },
      {
        title: "John Rylands Library",
        tip: "Looks like Hogwarts. Quick visit but genuinely impressive."
      },
      {
        title: "Afflecks",
        tip: "Multi-floor alternative shopping hub. Best mid-afternoon before it fills up."
      },
      {
        title: "Piccadilly Gardens → Market Street loop",
        tip: "Busy but central. Use it as a connector rather than a long stop."
      },
      {
        title: "MediaCityUK (Salford Quays)",
        tip: "Tram out if you’ve got spare time. BBC area, waterside walks, restaurants."
      },
      {
        title: "Etihad Campus area",
        tip: "If you’re visiting City, arrive early and walk around the complex."
      },
      {
        title: "Old Trafford area",
        tip: "Large footprint — plan transport in and out rather than wandering aimlessly."
      }
    ],

    tips: [
      "Manchester centre is walkable — most trips under 25 minutes on foot.",
      "Friday and Saturday nights get busy fast; book dinner.",
      "If you’re doing football and nightlife, rest in the afternoon.",
      "Avoid taxis immediately after matches — walk 10–15 minutes first.",
      "Weather changes quickly; bring a light waterproof."
    ],

    food: [
      "Street food in Mackie Mayor",
      "Pizza in Northern Quarter",
      "Curry Mile (Rusholme)",
      "Modern British small plates",
      "Proper breakfast cafés"
    ],

    transport:
      "Trams cover most useful routes including Etihad Campus and Salford Quays. Walking is fastest inside the city centre. Use contactless everywhere.",

    accommodation:
      "Northern Quarter and Ancoats are ideal for short stays. Deansgate is central but pricier. Avoid staying far out unless you’re near a tram stop."
  },

liverpool: {
    cityId: "liverpool",
    name: "Liverpool",
    country: "England",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g186337-Activities-Liverpool_Merseyside_England.html",
    overview:
      "Liverpool is compact, friendly, and ideal for a football-focused city break. The waterfront is excellent, nightlife is concentrated, and most major sights sit within a tight radius. You can comfortably cover Liverpool in two days without rushing.",

    topThings: [
      {
        title: "Albert Dock",
        tip: "Start here. Waterfront walks, museums, and bars all in one area."
      },
      {
        title: "Royal Albert Dock museums",
        tip: "Tate Liverpool or Maritime Museum are good quick wins."
      },
      {
        title: "The Cavern Quarter",
        tip: "Short visit for music history. Don’t overstay unless you want live music."
      },
      {
        title: "Liverpool ONE → Pier Head walk",
        tip: "Easy central route linking shopping to waterfront landmarks."
      },
      {
        title: "Baltic Triangle",
        tip: "Creative area with breweries, food halls, and bars."
      },
      {
        title: "Anfield area",
        tip: "Arrive early on matchday and walk around the stadium zone."
      },
      {
        title: "Goodison Park area",
        tip: "Traditional neighbourhood stadium setting. Pubs fill early."
      },
      {
        title: "Sefton Park",
        tip: "Nice weather option if you want greenery away from centre."
      },
      {
        title: "Mersey Ferry",
        tip: "Short scenic trip if you’ve got spare time."
      },
      {
        title: "Georgian Quarter",
        tip: "Historic streets and calmer pubs."
      }
    ],

    tips: [
      "City centre is extremely walkable.",
      "Matchday pubs near stadiums get busy early.",
      "Book restaurants on Fridays and Saturdays.",
      "Liverpool nightlife runs late — pace yourself.",
      "Taxis are cheap but walk a few streets away after matches."
    ],

    food: [
      "Baltic Market",
      "Independent burger joints",
      "Seafood by the docks",
      "Italian restaurants",
      "Traditional pubs with kitchens"
    ],

    transport:
      "Most trips inside centre are walkable. Merseyrail trains useful for Anfield/Goodison routes plus suburbs. Contactless works everywhere.",

    accommodation:
      "Albert Dock, Liverpool ONE, and Ropewalks are best bases. Avoid staying too far north or south without rail access."
  },

birmingham: {
    cityId: "birmingham",
    name: "Birmingham",
    country: "England",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g186402-Activities-Birmingham_West_Midlands_England.html",
    overview:
      "Birmingham is a large, modern city with strong food culture, easy transport, and distinct neighbourhoods. It works well for football trips because travel is straightforward and accommodation is good value compared to London.",

    topThings: [
      {
        title: "Brindleyplace canals",
        tip: "Good base area for food, bars, and walking."
      },
      {
        title: "Mailbox",
        tip: "Restaurants, bars, and canal-side walks."
      },
      {
        title: "Bullring & Grand Central",
        tip: "Central shopping landmark and meeting point."
      },
      {
        title: "Digbeth",
        tip: "Street art, creative venues, and independent bars."
      },
      {
        title: "Jewellery Quarter",
        tip: "Historic area with pubs and small museums."
      },
      {
        title: "Cadbury World",
        tip: "Touristy but popular if you have extra time."
      },
      {
        title: "Victoria Square",
        tip: "Central square near major attractions."
      },
      {
        title: "Birmingham Museum & Art Gallery",
        tip: "Strong permanent collection, free entry."
      },
      {
        title: "Villa Park area",
        tip: "Arrive early and walk around the stadium streets."
      },
      {
        title: "St Andrew’s area",
        tip: "Traditional matchday pub culture."
      }
    ],

    tips: [
      "Use trains or trams for stadium travel.",
      "City centre is spread out — plan by area.",
      "Digbeth is best for nightlife.",
      "Book dinner on match weekends.",
      "Leave time for post-match transport queues."
    ],

    food: [
      "Balti Triangle curry houses",
      "Independent pizza spots",
      "Street food in Digbeth",
      "Modern British bistros",
      "Canal-side restaurants"
    ],

    transport:
      "Trains from New Street connect to most areas. Trams cover centre routes. Uber widely available.",

    accommodation:
      "Stay near New Street, Brindleyplace, or Jewellery Quarter for easiest access."
  },

newcastle: {
  cityId: "newcastle",
  name: "Newcastle upon Tyne",
  country: "England",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g186394-Activities-Newcastle_upon_Tyne_Tyne_and_Wear_England.html",
  overview:
    "Newcastle upon Tyne is one of England’s most characterful football cities. Compact, walkable, and built around nightlife, food, and waterfront regeneration, it offers a strong weekend-break feel with a passionate football culture at its core. You can comfortably combine sightseeing, drinking, eating, and matchday atmosphere without long travel times.",
  topThings: [
    {
      title: "Quayside & Millennium Bridge walk",
      tip: "Walk both sides of the Tyne for views of the bridges, bars, and skyline. Best in the evening.",
    },
    {
      title: "Newcastle Castle",
      tip: "Small but central and worth doing for city views and historical context.",
    },
    {
      title: "Grey Street & Grainger Town",
      tip: "Arguably England’s best street for architecture. Combine with shopping or cafés.",
    },
    {
      title: "Tynemouth day trip",
      tip: "Metro ride to the coast for beach walks, fish & chips, and seaside pubs.",
    },
    {
      title: "Victoria Tunnel",
      tip: "Book ahead. A guided underground tour explaining wartime and mining history.",
    },
    {
      title: "Baltic Centre for Contemporary Art",
      tip: "Free entry. Go to the viewing level for river and city panoramas.",
    },
    {
      title: "Ouseburn Valley",
      tip: "Creative quarter with breweries, street art, live music, and independent venues.",
    },
    {
      title: "Jesmond Dene",
      tip: "Leafy park with waterfalls and walking trails. Good daytime reset.",
    },
    {
      title: "Shopping in Eldon Square",
      tip: "Large indoor centre if weather turns bad.",
    },
    {
      title: "St James’ Park area on matchday",
      tip: "Arrive early to experience pubs, street atmosphere, and fan build-up.",
    },
  ],
  tips: [
    "Newcastle city centre is very walkable—accommodation location matters less than in bigger cities.",
    "Friday and Saturday nights are extremely lively; expect busy bars.",
    "Metro is cheap and easy for airport, coast, and suburbs.",
    "Book restaurants on match weekends.",
    "Weather can change quickly—pack layers.",
  ],
  food: [
    "Traditional pub grub",
    "Seafood in Tynemouth",
    "Modern British bistros",
    "Street food in Ouseburn",
  ],
  transport:
    "Tyne & Wear Metro connects airport, city centre, coast, and major districts. Taxis are plentiful at night. Walking covers most central sightseeing.",
  accommodation:
    "City Centre and Quayside give best access to nightlife and sightseeing. Jesmond is slightly quieter with good metro links.",
},

leeds: {
    cityId: "leeds",
    name: "Leeds",
    country: "England",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g186411-Activities-Leeds_West_Yorkshire_England.html",
    overview:
      "Leeds is a fast-growing northern city with a strong football identity, busy nightlife, compact centre, and easy access to countryside. It’s big enough to feel energetic but small enough to navigate easily on a weekend break. For football travellers, Leeds offers a traditional English matchday atmosphere combined with a lively city centre before and after games.",

    topThings: [
      {
        title: "Leeds United matchday (Elland Road)",
        tip: "Arrive early and soak up the pubs around Elland Road or in the city centre before heading out. Atmosphere builds well ahead of kick-off.",
      },
      {
        title: "Royal Armouries Museum",
        tip: "Free entry and genuinely good. Allow 60–90 minutes rather than rushing.",
      },
      {
        title: "Leeds City Museum",
        tip: "Good short stop if you want culture without committing half a day.",
      },
      {
        title: "Trinity Leeds & Victoria Quarter",
        tip: "Best central area for shopping, food, and coffee in one walkable zone.",
      },
      {
        title: "Leeds Waterfront / Calls Landing",
        tip: "Nice riverside walk with bars and restaurants — good early evening spot.",
      },
      {
        title: "Roundhay Park",
        tip: "Huge park with lakes and views. Taxi or bus out if you’ve got spare time.",
      },
      {
        title: "Kirkstall Abbey",
        tip: "Impressive ruins and open green space. Combine with a nearby pub stop.",
      },
      {
        title: "Northern Monk Brewery",
        tip: "Popular local brewery taproom — busy on weekends, but worth it.",
      },
      {
        title: "Corn Exchange",
        tip: "Architectural highlight with indie shops and cafés.",
      },
      {
        title: "Arcade Club (Kirkstall)",
        tip: "Massive retro arcade venue if you want something different.",
      },
    ],

    tips: [
      "Leeds city centre is very walkable — you won’t need transport for most activities.",
      "Matchdays increase hotel demand noticeably — book early.",
      "Nightlife clusters around Call Lane and Merrion Street.",
      "Elland Road isn’t central — plan transport in advance.",
      "Leeds–Manchester trains are frequent if you’re combining cities.",
    ],

    food: [
      "Trinity Kitchen (street food)",
      "Bundobust (Indian street food)",
      "The Man Behind the Curtain (fine dining)",
      "Ox Club (steak)",
      "Kirkgate Market food hall",
    ],

    transport:
      "Leeds is a major rail hub with direct connections to London, Manchester, Sheffield, and Newcastle. Buses run frequently across the city. Taxis and ride-hailing are widely available late into the night.",

    accommodation:
      "Best areas: City Centre, Arena Quarter, or near Leeds Station. Prioritise walkable access to nightlife and rail station rather than suburban hotels.",
  },

leeds: {
    cityId: "leeds",
    name: "Leeds",
    country: "England",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g186411-Activities-Leeds_West_Yorkshire_England.html",
    overview:
      "Leeds is a fast-growing northern city with a strong football identity, busy nightlife, compact centre, and easy access to countryside. It’s big enough to feel energetic but small enough to navigate easily on a weekend break. For football travellers, Leeds offers a traditional English matchday atmosphere combined with a lively city centre before and after games.",

    topThings: [
      {
        title: "Leeds United matchday (Elland Road)",
        tip: "Arrive early and soak up the pubs around Elland Road or in the city centre before heading out. Atmosphere builds well ahead of kick-off.",
      },
      {
        title: "Royal Armouries Museum",
        tip: "Free entry and genuinely good. Allow 60–90 minutes rather than rushing.",
      },
      {
        title: "Leeds City Museum",
        tip: "Good short stop if you want culture without committing half a day.",
      },
      {
        title: "Trinity Leeds & Victoria Quarter",
        tip: "Best central area for shopping, food, and coffee in one walkable zone.",
      },
      {
        title: "Leeds Waterfront / Calls Landing",
        tip: "Nice riverside walk with bars and restaurants — good early evening spot.",
      },
      {
        title: "Roundhay Park",
        tip: "Huge park with lakes and views. Taxi or bus out if you’ve got spare time.",
      },
      {
        title: "Kirkstall Abbey",
        tip: "Impressive ruins and open green space. Combine with a nearby pub stop.",
      },
      {
        title: "Northern Monk Brewery",
        tip: "Popular local brewery taproom — busy on weekends, but worth it.",
      },
      {
        title: "Corn Exchange",
        tip: "Architectural highlight with indie shops and cafés.",
      },
      {
        title: "Arcade Club (Kirkstall)",
        tip: "Massive retro arcade venue if you want something different.",
      },
    ],

    tips: [
      "Leeds city centre is very walkable — you won’t need transport for most activities.",
      "Matchdays increase hotel demand noticeably — book early.",
      "Nightlife clusters around Call Lane and Merrion Street.",
      "Elland Road isn’t central — plan transport in advance.",
      "Leeds–Manchester trains are frequent if you’re combining cities.",
    ],

    food: [
      "Trinity Kitchen (street food)",
      "Bundobust (Indian street food)",
      "The Man Behind the Curtain (fine dining)",
      "Ox Club (steak)",
      "Kirkgate Market food hall",
    ],

    transport:
      "Leeds is a major rail hub with direct connections to London, Manchester, Sheffield, and Newcastle. Buses run frequently across the city. Taxis and ride-hailing are widely available late into the night.",

    accommodation:
      "Best areas: City Centre, Arena Quarter, or near Leeds Station. Prioritise walkable access to nightlife and rail station rather than suburban hotels.",
  },

nottingham: {
  cityId: "nottingham",
  name: "Nottingham",
  country: "England",

  overview:
    "Nottingham is a compact, characterful English city with deep football heritage and a lively centre that works well for short football-focused breaks. It combines a walkable core, strong pub culture, and enough historical identity to feel distinct without requiring heavy sightseeing. On match weekends, the city has a noticeably busier, more energetic edge, particularly around the river and central pub areas.",

  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.co.uk/Attractions-g186356-Activities-Nottingham_Nottinghamshire_England.html",

  topThings: [
    {
      title: "Nottingham Castle",
      tip: "Go mainly for the views over the city rather than the exhibitions. Allow 60–90 minutes, not half a day."
    },
    {
      title: "Old Market Square",
      tip: "Central reference point for the city. Useful meeting spot before heading to pubs or the stadium."
    },
    {
      title: "Ye Olde Trip to Jerusalem",
      tip: "One of England’s oldest pubs. Expect crowds on matchdays – arrive early."
    },
    {
      title: "The Lace Market",
      tip: "Good area for food and bars in the evening. More atmosphere than the main shopping streets."
    },
    {
      title: "River Trent walk",
      tip: "Easy stroll towards West Bridgford and the stadium area if weather is decent."
    },
    {
      title: "Wollaton Hall & Deer Park",
      tip: "Short taxi or bus ride. Nice daytime option if you have a spare morning."
    },
    {
      title: "Hockley district",
      tip: "Independent shops, coffee spots, and casual bars. Best daytime wandering zone."
    },
    {
      title: "National Justice Museum",
      tip: "Interesting if you like darker history, but optional for short trips."
    },
    {
      title: "Motorpoint Arena area",
      tip: "Cluster of chain restaurants and bars useful for quick pre-match food."
    },
    {
      title: "Pre-match pub crawl",
      tip: "Start central, finish closer to the ground rather than only drinking by the stadium."
    }
  ],

  tips: [
    "Nottingham city centre is very walkable – you rarely need taxis.",
    "Book accommodation early for big fixtures; options are limited compared to major cities.",
    "Pre-match atmosphere is stronger in the city than right next to the stadium.",
    "Leave extra time after full-time – transport bottlenecks are common.",
    "One-night stays work well; two nights if you want relaxed pacing."
  ],

  food: [
    "Gastropubs in the Lace Market",
    "Casual burgers & pizza around Hockley",
    "Indian restaurants around Maid Marian Way",
    "Simple pub food before matches"
  ],

  transport:
    "Local trams and buses connect the city centre with West Bridgford and surrounding areas. Walking from central Nottingham to the stadium takes roughly 30 minutes. Taxis are plentiful but slow immediately after matches.",

  accommodation:
    "City centre or Lace Market areas give the best balance of nightlife access and stadium travel. Budget chains fill up quickly on match weekends.",

  teams: [
    {
      name: "Nottingham Forest",
      teamKey: "nottingham-forest"
    }
  ]
}

brighton: {
  cityId: "brighton",
  name: "Brighton",
  country: "England",

  overview:
    "Brighton is a relaxed seaside city with a creative edge, strong café culture, and one of the most distinctive non-London atmospheres in the Premier League. It works particularly well for football weekends that mix a match with coastal wandering, food, and nightlife. The city centre is compact, but the stadium sits outside the core, making transport planning important.",

  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.co.uk/Attractions-g186273-Activities-Brighton_East_Sussex_England.html",

  topThings: [
    {
      title: "Brighton Palace Pier",
      tip: "Walk it rather than treating it as a destination. Best at sunset."
    },
    {
      title: "The Lanes",
      tip: "Small streets full of independent shops, pubs, and cafés. Easy daytime wandering."
    },
    {
      title: "North Laine",
      tip: "More alternative side of Brighton. Good for food and vintage shops."
    },
    {
      title: "Brighton Beachfront walk",
      tip: "Go west towards Hove for a calmer stretch."
    },
    {
      title: "British Airways i360",
      tip: "Only worth it on clear days. Skip if weather is poor."
    },
    {
      title: "Pre-match pubs in city centre",
      tip: "Better atmosphere than near the stadium itself."
    },
    {
      title: "Seven Sisters day trip",
      tip: "Only if you have an extra day. Not realistic on tight football weekends."
    },
    {
      title: "Hove promenade",
      tip: "Quieter than central Brighton and good for breakfast or coffee."
    },
    {
      title: "Street food & small restaurants",
      tip: "Brighton excels at casual dining rather than fine dining."
    },
    {
      title: "Seafront bars at night",
      tip: "Weather dependent, but strong summer vibe."
    }
  ],

  tips: [
    "Stay in central Brighton, not near the stadium.",
    "Use trains to Falmer for the stadium – easiest option.",
    "Book restaurants on Friday/Saturday nights.",
    "Bring layers; coastal wind is common.",
    "Brighton feels busiest late afternoon through evening."
  ],

  food: [
    "Seafood along the seafront",
    "Independent burger joints",
    "Vegan & vegetarian cafés",
    "Small wine bars in The Lanes"
  ],

  transport:
    "Falmer station serves the stadium and is 10 minutes by train from Brighton Station. Trains are frequent but busy on matchdays. Walking around central Brighton covers most needs.",

  accommodation:
    "Central Brighton or Hove are best. Avoid staying near Falmer unless necessary.",

  teams: [
    {
      name: "Brighton & Hove Albion",
      teamKey: "brighton"
    }
  ]
}

nottingham: {
  cityId: "nottingham",
  name: "Nottingham",
  country: "England",

  overview:
    "Nottingham is a compact historic city with strong football heritage, a lively nightlife scene, and good value compared to bigger Premier League hubs. It works well for short football trips: walkable centre, simple transport, and plenty of pubs clustered close together.",

  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.co.uk/Attractions-g186356-Activities-Nottingham_Nottinghamshire_England.html",

  topThings: [
    {
      title: "Nottingham Castle",
      tip: "Good viewpoint over the city. Museum itself is optional."
    },
    {
      title: "Old Market Square",
      tip: "Central hub and easy meeting point."
    },
    {
      title: "Hockley district",
      tip: "Independent shops, bars, and street art."
    },
    {
      title: "Lace Market",
      tip: "Historic area now full of bars and restaurants."
    },
    {
      title: "Ye Olde Trip to Jerusalem",
      tip: "Classic pre-match pub with caves built into the rock."
    },
    {
      title: "Canal-side walk",
      tip: "Short and pleasant if you want fresh air."
    },
    {
      title: "Pre-match city centre pubs",
      tip: "Better atmosphere than around the ground itself."
    },
    {
      title: "Caves of Nottingham",
      tip: "Only if you have spare time."
    },
    {
      title: "Shopping around Victoria Centre",
      tip: "Useful if killing time."
    },
    {
      title: "Evening bar crawl",
      tip: "Hockley → Lace Market works well."
    }
  ],

  tips: [
    "Stay central for walkability.",
    "Book pubs/restaurants on Saturday evenings.",
    "Allow time walking to the ground.",
    "Good city for one-night stays.",
    "Crowds build early on matchdays."
  ],

  food: [
    "Gastropubs",
    "Independent pizza",
    "Street food vendors",
    "Late-night kebabs"
  ],

  transport:
    "City centre is walkable. Nottingham Forest’s stadium is about 25 minutes walk from Old Market Square. Trams and buses also run.",

  accommodation:
    "City centre or Lace Market area is ideal.",

  teams: [
    {
      name: "Nottingham Forest",
      teamKey: "nottingham-forest"
    }
  ]
}
burnley: {
  cityId: "burnley",
  name: "Burnley",
  country: "England",

  overview:
    "Burnley is a compact Lancashire town with deep-rooted football identity and a strong matchday tradition. Trips here are about football first, with simple logistics and a very local feel.",

  tripAdvisorTopThingsUrl:
    "https://www.tripadvisor.co.uk/Attractions-g190820-Activities-Burnley_Lancashire_England.html",

  topThings: [
    {
      title: "Turf Moor stadium exterior",
      tip: "Walk past the stadium pre-match."
    },
    {
      title: "Burnley town centre",
      tip: "Short wander for food and pubs."
    },
    {
      title: "Towneley Park",
      tip: "Large park, good if staying overnight."
    },
    {
      title: "Pre-match pub crawl",
      tip: "Stick to pubs near town centre."
    },
    {
      title: "Post-match pint",
      tip: "Town centre bars quieter after full time."
    },
    {
      title: "Towneley Hall",
      tip: "If you have spare time."
    },
    {
      title: "Local breakfast café",
      tip: "Many open early weekends."
    },
    {
      title: "Canal-side walk",
      tip: "Short relaxing stroll."
    },
    {
      title: "Nearby Pendle countryside",
      tip: "Only if you have car."
    },
    {
      title: "Late evening takeaway",
      tip: "Limited late options."
    }
  ],

  tips: [
    "Town is small — plan food early.",
    "Weather can be cold and wet.",
    "Arrive early on matchdays.",
    "Most travel via Manchester or Preston.",
    "Very football-focused destination."
  ],

  food: [
    "Traditional pubs",
    "Fish & chips",
    "Curry houses",
    "Cafés"
  ],

  transport:
    "Burnley Manchester Road station is main rail hub. Stadium walkable from centre.",

  accommodation:
    "Limited hotels — consider Blackburn or Manchester if needed.",

  teams: [
    {
      name: "Burnley",
      teamKey: "burnley"
    }
  ]
}

wolverhampton: {
  cityId: "wolverhampton",
  name: "Wolverhampton",
  country: "England",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g186400-Activities-Wolverhampton_West_Midlands_England.html",
  overview:
    "Wolverhampton is a compact Midlands city with a strong football identity, industrial heritage, and easy rail links to Birmingham and the wider West Midlands. It works best as a focused football-led break: matchday at Molineux, a solid meal in the city centre, and optional side trips into Birmingham or the Black Country. You’re not coming for grand landmarks — you’re coming for atmosphere, convenience, and a proper English football weekend.",

  topThings: [
    {
      title: "Molineux Stadium (Wolverhampton Wanderers)",
      tip: "Arrive 90 minutes early to soak up pre-match atmosphere around Waterloo Road and the North Bank end. Stadium tours run on non-matchdays and are good value.",
    },
    {
      title: "Wolverhampton City Centre walk",
      tip: "Loop Queen Square → Victoria Street → Molineux → back through the retail core. You’ll cover most of the centre in under 45 minutes.",
    },
    {
      title: "Wolverhampton Art Gallery",
      tip: "Free entry, strong Victorian and contemporary collections. Good daytime filler before food or travel.",
    },
    {
      title: "West Park",
      tip: "Large Victorian park 10 minutes from the centre. Good for a relaxed pre-match walk if weather is decent.",
    },
    {
      title: "Grand Theatre",
      tip: "Check listings in advance — touring West End shows and comedy often pass through midweek.",
    },
    {
      title: "Black Country Living Museum (nearby Dudley)",
      tip: "Short train + bus ride. One of the best open-air museums in England if you have a spare half day.",
    },
    {
      title: "Birmingham side trip",
      tip: "Trains to Birmingham New Street are ~20 minutes. Combine Wolves matchday with Birmingham nightlife easily.",
    },
    {
      title: "Traditional pub crawl",
      tip: "Focus on older pubs rather than bars — the city does traditional better than trendy.",
    },
    {
      title: "Shopping & street food",
      tip: "Mander Centre and surrounding streets cover basics. Don’t expect destination shopping.",
    },
    {
      title: "Post-match drinks near Molineux",
      tip: "Pubs fill fast after full time — move quickly or walk slightly away from the stadium.",
    },
  ],

  tips: [
    "Wolves matches drive most hotel demand — book accommodation as soon as fixtures are confirmed.",
    "Stay walking distance to Molineux if possible to avoid post-match transport queues.",
    "If Wolves kick off late afternoon, eat lunch early — many kitchens get overwhelmed on matchdays.",
    "Use Wolverhampton as a base for Birmingham if prices are cheaper.",
    "Weather can be grim in winter — bring proper outerwear for standing concourses and queues.",
  ],

  food: [
    "Classic British pub food near the centre",
    "Indian and Bangladeshi restaurants (strong local scene)",
    "Burgers / casual dining around Queen Square",
    "Post-match takeaway near the station",
  ],

  transport:
    "Wolverhampton railway station sits next to the city centre and is walkable to Molineux. Trains run frequently to Birmingham New Street (~20 mins). Local buses cover the wider West Midlands but most visitors won’t need them.",

  accommodation:
    "Best areas: city centre or near the station for walkability. Prices spike heavily on Wolves home weekends, so lock hotels early or consider staying in Birmingham and commuting.",

  /* ---------------- Monetisation hooks (for UI wiring) ----------------
     - Teams in this city:
       Wolverhampton Wanderers → link to team guide

     - Suggested booking shortcuts:
       Hotels in Wolverhampton
       Trains to Wolverhampton
       Match tickets (Wolves)
       Things to do in Wolverhampton

     - Fixtures integration:
       Pull upcoming Wolves home fixtures (next 2 months) and surface here
  --------------------------------------------------------------------- */
},sunderland: {
  cityId: "sunderland",
  name: "Sunderland",
  country: "England",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g186401-Activities-Sunderland_Tyne_and_Wear_England.html",
  overview:
    "Sunderland is a proud football city on England’s northeast coast, shaped by shipbuilding heritage and a deep-rooted working-class identity. For travellers, it works as a football-first destination: matchday at the Stadium of Light, coastal walks, simple good food, and easy access to Newcastle if you want a bigger nightlife option. Expect authenticity rather than polish.",

  topThings: [
    {
      title: "Stadium of Light (Sunderland AFC)",
      tip: "Arrive early and walk over the Wearmouth Bridge for classic approach views. Stadium tours are worthwhile on non-matchdays.",
    },
    {
      title: "Roker & Seaburn beaches",
      tip: "Seafront walk with cafés and fish & chip shops. Good morning-after activity.",
    },
    {
      title: "National Glass Centre",
      tip: "Free entry, quick visit. Ties into Sunderland’s industrial past.",
    },
    {
      title: "Sunderland Museum & Winter Gardens",
      tip: "Compact, free, and central — easy filler before lunch.",
    },
    {
      title: "Penshaw Monument (nearby)",
      tip: "Short drive or taxi. Great views over the region if weather is clear.",
    },
    {
      title: "Sunderland city centre walk",
      tip: "Bridge Street → Keel Square → riverside path gives you a feel for the place.",
    },
    {
      title: "Pre-match pubs near the stadium",
      tip: "Expect heavy crowds — go 90 minutes early if you want a seat.",
    },
    {
      title: "Post-match drink in Seaburn",
      tip: "Quieter than city centre after games.",
    },
    {
      title: "Newcastle side trip",
      tip: "Metro to Newcastle in ~30 minutes for nightlife or extra sightseeing.",
    },
    {
      title: "Coastal fish & chips",
      tip: "Eat by the sea rather than central chains for better quality.",
    },
  ],

  tips: [
    "Sunderland is straightforward but limited for late-night options — Newcastle is your backup plan.",
    "Book hotels early for big fixtures or derby weekends.",
    "Wrap up in winter — coastal wind makes it feel colder than inland cities.",
    "Metro is the easiest way to move between Sunderland and Newcastle.",
    "Matchday queues for food and drink can be long — eat early.",
  ],

  food: [
    "Fish & chips along Roker / Seaburn",
    "Traditional pubs near the centre",
    "Casual Italian / grill restaurants",
    "Breakfast cafés near the seafront",
  ],

  transport:
    "Sunderland station and Metro connect to Newcastle, Gateshead and the wider Tyne & Wear network. Stadium of Light has its own Metro stop, but walking from the centre is also manageable.",

  accommodation:
    "Best areas: city centre or Seaburn seafront. For more choice, stay in Newcastle and travel by Metro.",

  /* ---------------- Monetisation hooks (for UI wiring) ----------------
     - Teams in this city:
       Sunderland AFC → link to team guide

     - Suggested booking shortcuts:
       Hotels in Sunderland
       Trains to Sunderland
       Match tickets (Sunderland)
       Things to do in Sunderland

     - Fixtures integration:
       Pull upcoming Sunderland home fixtures (next 2 months) and surface here
  --------------------------------------------------------------------- */
},


bournemouth: {
  cityId: "bournemouth",
  name: "Bournemouth",
  country: "England",
  tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g186262-Activities-Bournemouth_Dorset_England.html",
  overview:
    "Bournemouth is a classic English seaside town that blends beach culture with a growing Premier League presence thanks to AFC Bournemouth. It’s a relaxed, walkable destination that works well for short football-focused breaks: matchday at the Vitality Stadium, beach time, coastal walks, and easy dining.",

  topThings: [
    {
      title: "Vitality Stadium (AFC Bournemouth)",
      tip: "Small, compact ground. Arrive early — queues build quickly due to limited concourse space.",
    },
    {
      title: "Bournemouth Beach",
      tip: "Best early morning or evening in summer. Daytime gets crowded.",
    },
    {
      title: "Bournemouth Pier",
      tip: "Quick stroll, photos, and seaside atmosphere.",
    },
    {
      title: "Lower Gardens",
      tip: "Easy walk between beach and town centre. Good pre-lunch wander.",
    },
    {
      title: "Boscombe Beach & Promenade",
      tip: "Slightly quieter than Bournemouth central beach.",
    },
    {
      title: "Poole Harbour (nearby)",
      tip: "Short bus/train trip. Nice harbour views and restaurants.",
    },
    {
      title: "Jurassic Coast day trip",
      tip: "If staying longer, head towards Lulworth Cove or Durdle Door.",
    },
    {
      title: "Town centre bars",
      tip: "Compact nightlife cluster around Old Christchurch Road.",
    },
    {
      title: "Pre-match pubs",
      tip: "Plan ahead — spaces are limited and fill fast.",
    },
    {
      title: "Seafront walk at sunset",
      tip: "Simple but genuinely good way to end the day.",
    },
  ],

  tips: [
    "Book accommodation early for weekend fixtures — Bournemouth has limited large hotels.",
    "Expect a family/tourist mix in summer; nightlife is calmer outside peak season.",
    "Vitality Stadium is walkable from the centre (~25 minutes).",
    "Eat away from the immediate seafront for better value.",
    "Weather heavily affects the vibe — plan indoor backup options.",
  ],

  food: [
    "Seafood restaurants near the beach",
    "Casual burger and grill spots",
    "Italian restaurants in town centre",
    "Breakfast cafés along the promenade",
  ],

  transport:
    "Bournemouth has a mainline train station with direct services from London. Local buses cover town, beaches and stadium. Taxis are affordable for short hops.",

  accommodation:
    "Best areas: town centre or West Cliff for walkability. Beachfront hotels cost more in season.",

  /* ---------------- Monetisation hooks (for UI wiring) ----------------
     - Teams in this city:
       AFC Bournemouth → link to team guide

     - Suggested booking shortcuts:
       Hotels in Bournemouth
       Trains to Bournemouth
       Match tickets (AFC Bournemouth)
       Things to do in Bournemouth

     - Fixtures integration:
       Pull upcoming Bournemouth home fixtures (next 2 months) and surface here
  --------------------------------------------------------------------- */
},

};



export default premierLeagueCityGuides;
