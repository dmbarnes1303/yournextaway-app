// src/data/cityGuides/bundesliga.ts
import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * If a city doesn't have a clean GYG landing page, leave it undefined and
 * let UI fall back to buildAffiliateLinks({ city }).experiencesUrl.
 */
const GYG = {
  munich: "https://www.getyourguide.com/en-gb/munich-l139/?partner_id=MAQJREP&utm_medium=online_publisher",
  berlin: "https://www.getyourguide.com/en-gb/berlin-l17/?partner_id=MAQJREP&utm_medium=online_publisher",
  hamburg: "https://www.getyourguide.com/en-gb/hamburg-l23/?partner_id=MAQJREP&utm_medium=online_publisher",
  cologne: "https://www.getyourguide.com/en-gb/cologne-l19/?partner_id=MAQJREP&utm_medium=online_publisher",
  frankfurt:
    "https://www.getyourguide.com/en-gb/frankfurt-l53/?partner_id=MAQJREP&utm_medium=online_publisher",
  leipzig: "https://www.getyourguide.com/en-gb/leipzig-l24/?partner_id=MAQJREP&utm_medium=online_publisher",
  // If you confirm the exact IDs for these later, add them:
  // stuttgart: "https://www.getyourguide.com/en-gb/stuttgart-lXX/?partner_id=MAQJREP&utm_medium=online_publisher",
  // bremen: "https://www.getyourguide.com/en-gb/bremen-lXX/?partner_id=MAQJREP&utm_medium=online_publisher",
  // freiburg: "https://www.getyourguide.com/en-gb/freiburg-im-breisgau-lXX/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const bundesligaCityGuides: Record<string, CityGuide> = {
  munich: {
    cityId: "munich",
    name: "Munich",
    country: "Germany",
    thingsToDoUrl: GYG.munich,

    overview:
      "Munich combines world-class football culture with grand architecture, beer-hall tradition, and easy access to Bavaria’s lakes and mountains. It is polished, efficient, and expensive compared to other German cities, but delivers a premium experience. A Bayern Munich match at the Allianz Arena feels like an event city-wide, and Munich is one of the easiest European cities to combine football, sightseeing, food, and nightlife in a single long weekend.",

    topThings: [
      {
        title: "Marienplatz & Old Town walk",
        tip: "Start at Marienplatz, watch the Glockenspiel on the Neues Rathaus, then walk through Viktualienmarkt, Frauenkirche, and Sendlinger Straße. Early morning is best for photos; late afternoon is better for atmosphere.",
      },
      {
        title: "Viktualienmarkt food market",
        tip: "Graze rather than sit down: sausages, pretzels, cheese stalls, and fresh juices. It’s ideal as a light lunch between sightseeing blocks.",
      },
      {
        title: "English Garden",
        tip: "One of the world’s largest urban parks. Walk north from the city centre and stop at the Eisbach surfers or Chinese Tower beer garden.",
      },
      {
        title: "Nymphenburg Palace",
        tip: "Allow 2–3 hours including gardens. Combine with lunch nearby rather than rushing it.",
      },
      {
        title: "BMW Welt & Museum",
        tip: "Even non-car fans enjoy this. BMW Welt is free; museum ticket adds depth. Easy U-Bahn trip.",
      },
      {
        title: "Beer hall circuit",
        tip: "Hofbräuhaus for history, Augustiner-Keller for locals, Paulaner Bräuhaus for food. Don’t do all in one night.",
      },
      {
        title: "Olympiapark",
        tip: "Good skyline views, relaxed park walks, and occasional events. Combine with BMW Welt.",
      },
      {
        title: "Day trip to Dachau Memorial",
        tip: "Powerful and important. Half-day commitment including travel.",
      },
      {
        title: "Day trip to Tegernsee or Starnberger See",
        tip: "Beautiful lakes reachable by train if you have an extra day.",
      },
      {
        title: "Matchday Allianz Arena",
        tip: "Arrive early, walk around the stadium exterior, and soak up pre-match build-up before entry.",
      },
    ],

    tips: [
      "Munich is walkable in the centre, but U-Bahn/S-Bahn will save serious time.",
      "Book accommodation early on Bayern home weekends – prices jump fast.",
      "Beer halls can be loud and communal; it’s normal to share tables.",
      "Shops close early on Sundays; plan food and essentials in advance.",
      "For Bayern matches, travel via U6 Fröttmaning and allow buffer time.",
    ],

    food: [
      "Weisswurst breakfast",
      "Schnitzel with potato salad",
      "Roast pork with dumplings",
      "Pretzels + Obatzda cheese",
    ],

    transport:
      "Excellent U-Bahn, S-Bahn, trams, and buses. Buy day tickets or group passes. Airport S-Bahn takes ~45 minutes.",

    accommodation:
      "Stay near Marienplatz, Sendlinger Tor, or Hauptbahnhof for convenience. Schwabing is good for nightlife and cafés.",
  },

  dortmund: {
    cityId: "dortmund",
    name: "Dortmund",
    country: "Germany",

    overview:
      "Dortmund is pure football city. The matchday atmosphere around Signal Iduna Park and the legendary Yellow Wall is among the best in world football. Outside of football, Dortmund offers industrial heritage, green spaces, and a compact centre that works well for a short trip.",

    topThings: [
      {
        title: "Signal Iduna Park stadium tour",
        tip: "Do this the day before matchday if possible. Tunnel, dressing rooms, and Yellow Wall views.",
      },
      {
        title: "German Football Museum",
        tip: "Located next to main station. Allow 2 hours. Excellent for history and context.",
      },
      {
        title: "Westfalenpark",
        tip: "Large park with gardens and TV tower views. Good daytime reset.",
      },
      {
        title: "Phoenix See",
        tip: "Modern waterfront area with bars and restaurants.",
      },
      {
        title: "Alter Markt",
        tip: "Classic central square with pubs and beer halls.",
      },
      {
        title: "Brewery visit",
        tip: "Dortmund has a historic brewing culture – seek out local Dortmunder-style lagers.",
      },
      {
        title: "Matchday fan march",
        tip: "Walk from city centre towards stadium with supporters for atmosphere.",
      },
      {
        title: "Hohensyburg ruins",
        tip: "Hilltop ruins outside city with views over Ruhr valley.",
      },
      {
        title: "Thier-Galerie shopping area",
        tip: "Useful if you need clothes or essentials.",
      },
      {
        title: "Post-match beer near stadium",
        tip: "Stay in the area 30–60 minutes after final whistle to avoid transport crush.",
      },
    ],

    tips: [
      "Most visitors come for football – plan at least one non-football block.",
      "Stadium beer is cheaper than many countries; cash still useful.",
      "Wear yellow on matchday if attending Dortmund game – blends in.",
      "Trains around Ruhr region are frequent but can be busy on weekends.",
      "Hotels near main station sell out fast for big fixtures.",
    ],

    food: ["Currywurst", "Bratwurst", "Schnitzel", "Local lager"],

    transport:
      "U-Bahn and regional trains are simple. Stadium reachable by train or 30-minute walk from centre.",

    accommodation:
      "City centre or near Hauptbahnhof best for short stays. Hörde works if staying near Phoenix See.",
  },

  sinsheim: {
    cityId: "sinsheim",
    name: "Sinsheim",
    country: "Germany",

    overview:
      "Sinsheim is a small town built around one major attraction: football and the Rhein-Neckar-Arena, home of Hoffenheim. It’s not a big-city destination, but it works extremely well as a relaxed football-focused trip, especially when paired with nearby Heidelberg or Mannheim.",

    topThings: [
      {
        title: "Rhein-Neckar-Arena matchday",
        tip: "Arrive early to explore fan areas and stadium surroundings.",
      },
      {
        title: "Auto & Technik Museum Sinsheim",
        tip: "World-famous museum with Concorde, military aircraft, and classic cars. Allow 3+ hours.",
      },
      {
        title: "Therme Sinsheim",
        tip: "Large thermal spa complex. Perfect recovery day after travel or match.",
      },
      {
        title: "Sinsheim town centre stroll",
        tip: "Small but pleasant – cafés and bakeries for relaxed lunch.",
      },
      {
        title: "Day trip to Heidelberg",
        tip: "Beautiful old town and castle. 30 minutes by train.",
      },
      {
        title: "Day trip to Mannheim",
        tip: "Bigger city with shopping, dining, and nightlife.",
      },
      {
        title: "Neckar Valley countryside",
        tip: "Great for scenic walks if weather is good.",
      },
      {
        title: "Pre-match beer in Sinsheim",
        tip: "Smaller pubs fill quickly – arrive early.",
      },
      {
        title: "Stadium shop visit",
        tip: "Good place for Hoffenheim merch with shorter queues than big clubs.",
      },
      {
        title: "Post-match museum or spa",
        tip: "Ideal if staying overnight to avoid immediate departure rush.",
      },
    ],

    tips: [
      "Treat Sinsheim as football + attraction hub, not sightseeing city.",
      "Stay near station or stadium for simplicity.",
      "Trains are easiest route; driving also common.",
      "Pair with Heidelberg to create a richer trip.",
      "Food options limited late – plan dinner in advance.",
    ],

    food: [
      "German bakery breakfast",
      "Schnitzel",
      "Bratwurst",
      "Beer garden meals",
    ],

    transport:
      "Regional trains connect Sinsheim to Heidelberg, Mannheim, Stuttgart. Stadium reachable by shuttle or walk from station.",

    accommodation:
      "Small hotels and guesthouses near station or stadium. Heidelberg offers wider choice if basing there.",
  },

  leipzig: {
    cityId: "leipzig",
    name: "Leipzig",
    country: "Germany",
    thingsToDoUrl: GYG.leipzig,

    overview:
      "Leipzig is one of Germany’s best-value city breaks: compact, walkable, creative, and genuinely fun on a weekend. It mixes grand old-city architecture with a modern, youthful energy (music, galleries, cafés, beer gardens), and it’s extremely easy to do without over-planning. Football here is slick and well-run at the Red Bull Arena, but the real win is that Leipzig works as a full trip: you can build a weekend around the match, great food, nightlife, and short sightseeing loops without spending half your time commuting. If you want a German football trip that feels fresh rather than ‘classic’, Leipzig delivers.",

    topThings: [
      {
        title: "Old Town loop (Marktplatz → Thomaskirche → Nikolaikirche)",
        tip: "Do this as your first block. It’s a tight loop that gives you Leipzig’s ‘big city’ feel quickly—historic squares, arcades, churches, and cafés. Thomaskirche is a must if you care even slightly about music history (Bach). Go early morning for photos; late afternoon for atmosphere.",
      },
      {
        title: "Leipzig arcades & passages (Mädler Passage and friends)",
        tip: "Leipzig’s shopping passages feel like a mini-Parisian arcade network. Perfect for a rainy-day plan, and they connect you through the centre without feeling like generic malls. Grab coffee and do a slow browse—this is how Leipzig feels ‘premium’ without Munich prices.",
      },
      {
        title: "St. Thomas Church & Bach footprint",
        tip: "Even if you’re not a classical fan, the Bach story here is tangible. Combine Thomaskirche with the Bach Museum if you’ve got 60–90 minutes to spare and want a proper ‘Leipzig’ cultural hit that’s not just photos.",
      },
      {
        title: "Völkerschlachtdenkmal (Monument to the Battle of the Nations)",
        tip: "One of the most dramatic monuments in Germany. Go on a clear day and climb for views. Allow 2–3 hours with travel. It’s the kind of place that makes a trip feel substantial—not just ‘a match and beers’.",
      },
      {
        title: "Spinnerei (Leipzig’s contemporary art hub)",
        tip: "If you like galleries, this is a strong differentiator versus other football cities. Check opening days/times—some spaces have limited hours. Plan it as a ‘late morning / early afternoon’ block then head to Plagwitz for food and drinks.",
      },
      {
        title: "Plagwitz & Karl-Heine-Kanal walk",
        tip: "This is Leipzig’s ‘cool’ zone—canals, converted industrial spaces, bars, and a calmer vibe than the centre. If weather’s decent, do an hour canal stroll, then settle in for drinks. It’s a perfect pre-match or post-sightseeing decompression zone.",
      },
      {
        title: "Red Bull Arena matchday (RB Leipzig)",
        tip: "Arrive early and treat it like an event: stadium exterior lap, food/drink, then in. The arena is extremely accessible and the process is smooth—less chaos than many big European stadiums. Plan your exit route if you’re heading straight to station after full time.",
      },
      {
        title: "Leipzig Zoo (if you have extra half-day)",
        tip: "Surprisingly strong zoo experience and very family-friendly. Only do this if you have time; it’s not a ‘quick stop’. Combine with a relaxed lunch and you’ve got a ‘non-football’ anchor day.",
      },
      {
        title: "Augustusplatz & modern Leipzig skyline",
        tip: "This gives the ‘new city’ feel—big open square, opera/concert hall energy, and easy access to food. Best as a quick scenic stop rather than a long block.",
      },
      {
        title: "Day trip option: Dresden (if you’re extending the trip)",
        tip: "If you’re making a bigger Saxony weekend, Dresden is one of Europe’s most impressive rebuild stories. Only worth it if you add a day—don’t force it into a tight match weekend.",
      },
    ],

    tips: [
      "Leipzig is a ‘two loop’ city: do Old Town + arcades on one loop, then Plagwitz/canal + modern areas on another. That structure stops you wasting time zig-zagging.",
      "If you’re arriving by train, stay near the centre rather than out by the stadium—you’ll get more trip value and still reach matchday easily.",
      "For match weekends, book restaurants in the centre or Plagwitz; Leipzig is popular with weekend-break travellers and good places fill up fast.",
      "Public transport is straightforward, but you’ll often be faster on foot in the centre—Leipzig rewards walking because the city feels cohesive and lively.",
      "If you want a ‘German beer garden’ feel without tourist traps, aim for local biergartens around parks rather than only sticking to the main square options.",
      "If your match is an evening kickoff, do cultural blocks earlier (monument / galleries) and keep the afternoon flexible for food, drinks, and pre-match pacing.",
    ],

    food: [
      "Leipziger Lerche (local sweet pastry) with coffee",
      "Hearty German classics in traditional pubs (look for seasonal menus)",
      "Modern German / international in Plagwitz",
      "Beer garden meals in warmer months",
    ],

    transport:
      "Leipzig is easy: centre is walkable, trams connect everything quickly, and main station is a major hub. If you’re in the centre, you can treat transport as ‘nice-to-have’ rather than essential. Stadium access is smooth on public transport; allow buffer time pre- and post-match.",

    accommodation:
      "Best bases: Central Leipzig (Altstadt/Mitte) for maximum walkability and evening options, or Plagwitz if you want a more creative, canal-side vibe. Avoid staying too far out unless you’re driving—Leipzig’s value is how much you can do by foot from a central base.",
  },

  stuttgart: {
    cityId: "stuttgart",
    name: "Stuttgart",
    country: "Germany",

    overview:
      "Stuttgart is a high-quality, under-rated football city break that combines elite matchday logistics with genuinely strong non-football attractions—especially if you like cars, design, and clean ‘German efficiency’ travel. VfB Stuttgart matchdays have proper intensity, and the city’s big advantage is how easy it is to do a complete weekend: a stadium event, world-class museums (Mercedes and Porsche), excellent food and wine culture, and quick day-trip options. Stuttgart feels more ‘grown-up’ than some student-heavy cities: fewer gimmicks, more substance, and very reliable transport and accommodation standards.",

    topThings: [
      {
        title: "Mercedes-Benz Museum (world-class even if you’re not a car nerd)",
        tip: "This is the headline attraction. Don’t rush it. Book 2–3 hours minimum, and treat it like a full block. The museum tells a story of engineering, culture, and design—not just cars. Go earlier in the day so you’re not museum-fatigued late afternoon.",
      },
      {
        title: "Porsche Museum (clean, sharp, and fast-paced)",
        tip: "More focused than Mercedes, and ideal if you want a second ‘design’ museum without repeating the same vibe. Combine with a relaxed lunch and don’t try to cram both museums plus matchday into one day unless kickoff timing makes it logical.",
      },
      {
        title: "Schlossplatz + city centre loop",
        tip: "Schlossplatz gives you the ‘Stuttgart postcard’ quickly—gardens, architecture, and central energy. Do a slow loop, then branch into nearby shopping streets or cafés. It’s a good first-hour plan when you arrive.",
      },
      {
        title: "Stuttgart TV Tower (Fernsehturm) for skyline views",
        tip: "On a clear day, this is a simple win. If weather is hazy, downgrade it. Build this in as a flexible option rather than a fixed must-do.",
      },
      {
        title: "Weinwanderung (wine walk) / Stuttgart wine culture",
        tip: "Stuttgart has real local wine culture that visitors overlook. If you want a ‘different’ Germany trip, do a vineyard walk or wine tavern evening. It’s a strong way to make the trip feel unique beyond football and museums.",
      },
      {
        title: "Wilhelma Zoo & Botanical Garden",
        tip: "A strong ‘half-day’ option if you’ve got an extra day or you’re travelling with family. Don’t treat it like a quick add-on; it’s bigger than people expect.",
      },
      {
        title: "Killesberg Park & viewpoints",
        tip: "Great for a calmer block—walks, city views, and a break from museums. Ideal if you’re balancing heavy sightseeing with matchday energy.",
      },
      {
        title: "VfB Stuttgart matchday (MHPArena / Neckarpark)",
        tip: "Neckarpark is built for events: stadium, transport, and crowd flow are strong. Arrive early and plan your ‘before’ and ‘after’—pre-match food/drinks are easier if you pick your spot rather than wandering last minute.",
      },
      {
        title: "Cannstatter Wasen / festival grounds (seasonal)",
        tip: "If your trip lines up with festivals, Stuttgart jumps up a level. Check dates—this can turn a match weekend into a proper ‘event city’ break.",
      },
      {
        title: "Day trip option: Ludwigsburg Palace",
        tip: "A great ‘palace and gardens’ day if you want something non-car and non-football. Works well for a calmer final-day plan.",
      },
    ],

    tips: [
      "Stuttgart is not ‘one flat centre’—it’s built on hills and zones. Plan your day in blocks (centre + one major attraction + match) rather than trying to bounce constantly.",
      "If you’re doing both Mercedes and Porsche, split them across different days or at least a morning/afternoon structure with long breaks—museum overload is real.",
      "Matchday transport is reliable, but crowds still stack after full time. If you’re rushing for a train, leave a few minutes early or position yourself smartly for exit.",
      "Restaurant standards are high, but prime places still fill on weekends. Book dinner, especially if your match is Saturday evening.",
      "If you want the trip to feel ‘local’, lean into wine taverns and Swabian food instead of only international chains.",
      "Stay near the centre for flexibility unless you have a specific reason to be near Neckarpark—central base gives you far more evening options.",
    ],

    food: [
      "Swabian Maultaschen (stuffed pasta-style dumplings)",
      "Spätzle (often with cheese or roast dishes)",
      "Local wine taverns (Wirtschaften/Besenwirtschaften when open)",
      "German bakery breakfasts for cheap quality fuel",
    ],

    transport:
      "Excellent S-Bahn/U-Bahn network with clean, reliable service. The stadium area is designed for event transport, but always keep buffer time around kickoff and full time. Stuttgart Airport connects well into the city via rail. Hills mean walking can feel longer—use public transport strategically.",

    accommodation:
      "Best bases: Stuttgart-Mitte (centre) for walkability and evening life, or near Hauptbahnhof for simple arrivals/departures. Only stay near the stadium if matchday convenience is your top priority and you’re sacrificing city vibe for logistics.",
  },

  leverkusen: {
    cityId: "leverkusen",
    name: "Leverkusen",
    country: "Germany",

    overview:
      "Leverkusen is a ‘smart logistics’ football trip rather than a traditional city-break destination—and that’s exactly why it can be brilliant. Bayer Leverkusen matchdays at the BayArena are high-level: compact, intense, and easy to manage. The key travel hack is that Leverkusen sits in the heart of the Rhine-Ruhr region, meaning you can base yourself in Cologne or Düsseldorf (or even Bonn) and treat Leverkusen as the matchday centrepiece. If you approach it that way, you get the best of both worlds: bigger-city nightlife and sightseeing, plus one of Germany’s most efficient matchday experiences.",

    topThings: [
      {
        title: "BayArena matchday (Bayer Leverkusen)",
        tip: "This is the main reason you’re here. Arrive early, do a full lap of the stadium exterior, and soak up the pre-match build-up. The stadium is compact and modern, so you’re close to the pitch and the atmosphere feels concentrated.",
      },
      {
        title: "Matchday base strategy: Cologne or Düsseldorf",
        tip: "Make this a proper weekend by staying in Cologne (cathedral, nightlife, river walks) or Düsseldorf (Altstadt bars, stylish dining, Rhine promenade). Then travel into Leverkusen for the match. This turns a ‘small city’ into a premium football trip.",
      },
      {
        title: "Rhine river walking / cycling stretches",
        tip: "Leverkusen’s best non-football moments are simple: river air, parks, and relaxed movement before the match. If you’re the type who likes a calm pre-match reset, this is your play.",
      },
      {
        title: "Japanischer Garten (Japanese Garden, Leverkusen)",
        tip: "A small but genuinely pleasant, calm attraction—especially useful if you want a low-effort daytime block without travelling far. Treat it as a 45–90 minute ‘reset’ rather than a major sightseeing mission.",
      },
      {
        title: "Day trip: Cologne Cathedral (Kölner Dom)",
        tip: "If you’re basing in Cologne, this is mandatory. Go early to avoid crowds, then build your day around the riverfront and Altstadt.",
      },
      {
        title: "Cologne Old Town + Rhine promenade (if using Cologne as base)",
        tip: "This is the best ‘football weekend’ pairing: sightseeing by day, proper nightlife by evening, then Leverkusen matchday as the big event.",
      },
      {
        title: "Düsseldorf Altstadt nightlife (if using Düsseldorf as base)",
        tip: "Altstadt is famous for a reason—dense bars, easy movement, and good ‘weekend break’ energy. Perfect after a match if you’re celebrating or just want atmosphere.",
      },
      {
        title: "German beer culture: Kölsch vs Altbier choice",
        tip: "If you base in Cologne, drink Kölsch; if Düsseldorf, drink Altbier. Leaning into that small detail makes the trip feel ‘local’ and deliberate rather than generic.",
      },
      {
        title: "Pre-match food planning",
        tip: "Leverkusen itself is more functional than foodie. If you want a standout meal, do it in Cologne/Düsseldorf and keep matchday eating simple and efficient.",
      },
      {
        title: "Post-match logistics and ‘avoid the crush’ plan",
        tip: "If you’re going straight back to Cologne/Düsseldorf, either leave a few minutes before full time or plan a 30–45 minute decompression (drink, snack, walk) after the final whistle before travelling.",
      },
    ],

    tips: [
      "Don’t treat Leverkusen like a standalone city-break unless you specifically want a quiet, football-first trip. The smart play is to pair it with Cologne or Düsseldorf for maximum value.",
      "BayArena is efficient: less chaos, more comfort. But transport hubs still spike after full time—build in buffer and don’t rely on last-minute connections.",
      "If you’re travelling with a group, Cologne is usually easier for accommodation variety and nightlife density; Düsseldorf is slicker and often feels more ‘upmarket’.",
      "Matchday pacing matters: eat properly before you head to the stadium, then use stadium food/drink as top-up rather than your main meal plan.",
      "If you’re doing back-to-back Ruhr matches (Dortmund, Cologne, Leverkusen, etc.), this region is ideal because trains are frequent—just plan around weekend crowds.",
      "For a ‘premium’ feel: base in a nicer Cologne/Düsseldorf neighbourhood, do a strong dinner booking, then treat matchday as the headline event.",
    ],

    food: [
      "Cologne: Kölsch + hearty pub meals in Altstadt",
      "Düsseldorf: Altbier + Japanese food scene (one of Europe’s best outside Japan)",
      "Matchday: simple, efficient stadium snacks rather than ‘destination dining’ in Leverkusen",
      "German bakery breakfast to fuel travel days",
    ],

    transport:
      "This is a rail region: fast, frequent connections between Cologne, Düsseldorf, and Leverkusen. Plan your matchday route in advance and keep a buffer for crowds after full time. If basing in Cologne/Düsseldorf, you’ll likely find travel easier than trying to stay in Leverkusen itself.",

    accommodation:
      "Best strategy: stay in Cologne or Düsseldorf for better hotels, restaurants, nightlife, and ‘city-break value’. Only stay in Leverkusen if you want maximum matchday simplicity and a quieter trip. If you do base in Leverkusen, prioritise proximity to rail links for easy movement.",
  },

  freiburg: {
    cityId: "freiburg",
    name: "Freiburg im Breisgau",
    country: "Germany",

    overview:
      "Freiburg is one of Germany’s most liveable and likeable small cities: sunny (by German standards), compact, historic, and surrounded by nature. It delivers a very different Bundesliga experience to the big industrial hubs — relaxed streets, outdoor cafés, local wine, and a strong community atmosphere around SC Freiburg. For travellers who want football combined with a beautiful old town and easy countryside access, Freiburg punches far above its weight. It’s a city where slowing down actually improves the trip rather than wasting time.",

    topThings: [
      {
        title: "Altstadt (Old Town) walking loop",
        tip: "Start at Münsterplatz, loop through the pedestrian streets, and follow the small Bächle water channels that run through the city. This gives you Freiburg’s character in under two hours. Best done mid-morning when shops and cafés are open but before lunch crowds peak.",
      },
      {
        title: "Freiburg Minster (Münster)",
        tip: "Climb the tower if weather is clear — views over the Black Forest foothills are excellent. Combine with coffee in Münsterplatz and a slow wander through the surrounding lanes.",
      },
      {
        title: "Schlossberg hill & viewpoint",
        tip: "Walk or take the funicular. Late afternoon / early evening is perfect. Bring a drink, sit, and take in sunset over the city — this is one of Freiburg’s defining experiences.",
      },
      {
        title: "Augustiner Museum",
        tip: "Strong regional art and history in a former monastery. Ideal cultural block if you want one museum without committing a whole day.",
      },
      {
        title: "Black Forest day-trip (short hike or village visit)",
        tip: "If you have a spare half-day, take a train or bus into the Black Forest for light hiking or village wandering. Even a short outing changes the feel of your trip completely.",
      },
      {
        title: "Vauban district",
        tip: "Famous eco-neighbourhood with a relaxed, progressive vibe. Interesting contrast to the medieval centre and good for cafés and casual eating.",
      },
      {
        title: "University quarter & student bars",
        tip: "Freiburg is a university city — evenings here are lively without being chaotic. Good area for affordable drinks and casual food.",
      },
      {
        title: "SC Freiburg matchday (Europa-Park Stadion)",
        tip: "Modern stadium, strong atmosphere, and well-organised transport. Arrive early, walk around the exterior, and soak up pre-match atmosphere rather than rushing straight inside.",
      },
      {
        title: "Local wine taverns (Baden region)",
        tip: "This is wine country. Prioritise a wine-focused evening over beer-only plans at least once.",
      },
      {
        title: "Markets at Münsterplatz (weekday mornings + Saturday)",
        tip: "Great for light lunch, snacks, and local produce. Easy, authentic food stop.",
      },
    ],

    tips: [
      "Freiburg works best at a slower pace — don’t over-pack the itinerary.",
      "If weather is good, prioritise outdoor blocks (Schlossberg, Old Town wandering, wine terraces).",
      "Book restaurants on match weekends — the city is small and good places fill quickly.",
      "Use Freiburg as a base for light Black Forest exploration if you have more than one full day.",
      "Stay central; you’ll barely need transport once you’re in town.",
    ],

    food: [
      "Flammkuchen",
      "Badischer Schäufele (pork shoulder)",
      "Local white wines",
      "Bakery breakfasts + market stalls",
    ],

    transport:
      "Compact and walkable. Trams cover the wider city. Stadion access is well handled by public transport on matchdays.",

    accommodation:
      "Altstadt or near main station for best balance of walkability and transport access. Avoid staying far out — Freiburg’s charm is in its centre.",
  },

  frankfurt: {
    cityId: "frankfurt",
    name: "Frankfurt",
    country: "Germany",
    thingsToDoUrl: GYG.frankfurt,

    overview:
      "Frankfurt is often misunderstood as ‘just a finance city’, but for football travellers it’s one of Germany’s most versatile destinations. You get a major European transport hub, a walkable historic core, a striking modern skyline, excellent food, and one of the loudest atmospheres in German football at Eintracht Frankfurt. It works equally well as a quick match-focused trip or a multi-day base with day trips along the Rhine or into smaller towns.",

    topThings: [
      { title: "Römerberg & Old Town reconstruction", tip: "Start here to anchor yourself. It’s compact, photogenic, and gives instant sense of place." },
      { title: "Main Tower observation deck", tip: "Best skyline view in Frankfurt. Go on a clear day. Late afternoon into dusk is ideal." },
      { title: "River Main promenade walk", tip: "Walk between Eiserner Steg and Museumsufer. Flat, scenic, and good pacing between attractions." },
      { title: "Museumsufer (choose one museum)", tip: "Städel Museum is the strongest all-round choice. Pick one — don’t attempt a museum crawl." },
      { title: "Sachsenhausen apple wine district", tip: "Traditional taverns, hearty food, and local Apfelwein. Great pre-match or evening block." },
      { title: "Zeil shopping street", tip: "Not a destination in itself, but useful for supplies and quick browsing." },
      { title: "Eintracht Frankfurt matchday (Deutsche Bank Park)", tip: "One of Germany’s best atmospheres. Arrive early, walk around stadium, and expect intense noise levels once inside." },
      { title: "Day trip: Mainz or Wiesbaden", tip: "Both reachable in under 40 minutes and excellent for wine, old towns, and relaxed strolling." },
      { title: "Skyline Plaza rooftop", tip: "Free alternative viewpoint if you don’t want to pay for Main Tower." },
      { title: "Palmengarten (botanical gardens)", tip: "Good calm block if you want green space away from the city core." },
    ],

    tips: [
      "Frankfurt airport connections make this a strong short-break city.",
      "Split your days into Old Town / river block and Sachsenhausen / evening block.",
      "Matchday transport is good but crowded — allow buffer time.",
      "Don’t judge Frankfurt only by the station area; walk 10 minutes and it improves dramatically.",
      "Book dinner on Friday/Saturday nights — finance + football crowds combine.",
    ],

    food: [
      "Grüne Soße",
      "Frankfurter sausages",
      "Apfelwein + schnitzel",
      "Modern international dining in Innenstadt",
    ],

    transport:
      "Excellent S-Bahn, U-Bahn, trams, and regional trains. Stadium is well served on matchdays.",

    accommodation:
      "Innenstadt or near Römerberg for sightseeing. Sachsenhausen for atmosphere. Avoid being right next to Hauptbahnhof if you’re sensitive to rough edges.",
  },

  berlin: {
    cityId: "berlin",
    name: "Berlin",
    country: "Germany",
    thingsToDoUrl: GYG.berlin,

    overview:
      "Berlin is a heavyweight European city that easily supports a full football-focused long weekend or longer. It combines deep modern history, creative neighbourhoods, excellent nightlife, and multiple Bundesliga clubs within one urban area. Berlin rewards travellers who plan by neighbourhood rather than trying to tick everything. For football fans, it’s outstanding: big stadiums, passionate fan cultures, and endless pre- and post-match options.",

    topThings: [
      { title: "Brandenburg Gate & Pariser Platz", tip: "Early morning or late evening for fewer crowds and better photos." },
      { title: "Reichstag dome", tip: "Book ahead. Sunset slot if possible." },
      { title: "Berlin Wall Memorial (Bernauer Straße)", tip: "Most powerful open-air history site. Give it real time." },
      { title: "East Side Gallery", tip: "Walk the full stretch, then move on — it’s long but linear." },
      { title: "Museum Island (pick one museum)", tip: "Pergamon or Neues Museum are strong choices." },
      { title: "Kreuzberg & Neukölln food districts", tip: "Excellent for casual eating, late-night snacks, and bars." },
      { title: "Tempelhofer Feld", tip: "Former airport turned giant park. Bike, walk, or just sit and watch the city." },
      { title: "Olympiastadion matchday (Hertha BSC)", tip: "Huge stadium, Olympic history, and big-match feel." },
      { title: "Stadion An der Alten Försterei matchday (Union Berlin)", tip: "One of Europe’s most atmospheric grounds. Arrive very early." },
      { title: "Prenzlauer Berg cafés & bars", tip: "Relaxed daytime base and good evening food scene." },
    ],

    tips: [
      "Berlin is big — plan days by area.",
      "Book Reichstag and popular museums in advance.",
      "Public transport is excellent; don’t rely on taxis.",
      "If attending Union Berlin, plan logistics carefully due to capacity and demand.",
      "Nightlife starts late — don’t expect busy bars before 9pm.",
    ],

    food: ["Currywurst", "Döner kebab", "Modern German bistros", "International street food"],

    transport:
      "Outstanding U-Bahn, S-Bahn, trams, and buses. Both major stadiums well served.",

    accommodation:
      "Mitte for sightseeing, Prenzlauer Berg for calmer stays, Kreuzberg for nightlife. Choose based on trip style.",
  },

  cologne: {
    cityId: "cologne",
    name: "Cologne",
    country: "Germany",
    thingsToDoUrl: GYG.cologne,

    overview:
      "Cologne (Köln) is one of Germany’s great football cities: loud, proud, slightly rough around the edges, and built around community. It blends Roman history, a famous cathedral skyline, a huge student population, strong nightlife, and a deeply rooted supporter culture around 1. FC Köln. For travellers, Cologne offers easy sightseeing, excellent beer culture, and one of the most approachable matchday experiences in the Bundesliga. It’s social, walkable, and full of character rather than polished perfection.",

    topThings: [
      {
        title: "Cologne Cathedral (Kölner Dom)",
        tip: "Go inside first, then climb the tower if you’re fit. Views over the Rhine and city rooftops are excellent. Early morning or late afternoon avoids the heaviest crowds.",
      },
      { title: "Old Town (Altstadt) riverside walk", tip: "Walk along the Rhine between Hohenzollern Bridge and Heumarkt. Great for photos, casual bars, and people-watching." },
      { title: "Hohenzollern Bridge love locks", tip: "Classic quick stop while crossing the Rhine. Combine with river promenade walk." },
      { title: "Belgian Quarter (Belgisches Viertel)", tip: "Best area for independent shops, cafés, and bars. Strong evening base." },
      { title: "Cologne Chocolate Museum", tip: "Touristy but genuinely fun and central. Good rainy-day option." },
      { title: "Museum Ludwig", tip: "Strong modern art collection if you want one cultural stop." },
      { title: "1. FC Köln matchday (RheinEnergieStadion)", tip: "Arrive early. Pre-match Kölsch beers around the stadium area are part of the ritual." },
      { title: "Kölsch beer halls", tip: "Drink Kölsch the local way — small glasses that keep arriving until you put your coaster on top." },
      { title: "Rhine boat cruise (short version)", tip: "Good relaxed sightseeing if weather is decent." },
      { title: "Day trip: Düsseldorf or Bonn", tip: "Both under 40 minutes by train. Easy add-ons if staying multiple nights." },
    ],

    tips: [
      "Cologne is casual — dress comfortably rather than stylishly.",
      "Expect loud, friendly, beer-fuelled matchdays.",
      "Stick mainly to the west side of the Rhine for sightseeing.",
      "Book stadium-adjacent pubs early on big matchdays.",
      "Cologne is excellent for bar-hopping without planning.",
    ],

    food: ["Himmel un Ääd", "Schnitzel", "Bratwurst", "Kölsch beer"],

    transport:
      "Very strong tram and U-Bahn network. Stadion easily reached by public transport on matchdays.",

    accommodation:
      "Altstadt or Belgian Quarter for walkability. Ehrenfeld for nightlife/value.",
  },

  monchengladbach: {
    cityId: "monchengladbach",
    name: "Mönchengladbach",
    country: "Germany",

    overview:
      "Mönchengladbach is a classic football-first destination. It isn’t a major sightseeing city, but for Bundesliga travellers that’s part of the appeal: everything revolves around Borussia Mönchengladbach and matchday culture. The city is compact, affordable, and easy to navigate, making it ideal for short, focused football trips or as a base between Cologne and Düsseldorf.",

    topThings: [
      { title: "Borussia-Park stadium tour", tip: "If available, worth doing. Gives context to one of Germany’s historic clubs." },
      { title: "Borussia Mönchengladbach matchday", tip: "Strong atmosphere, family-friendly but passionate. Arrive early for fan zones." },
      { title: "Abteiberg Museum", tip: "Modern art in an interesting building. Good cultural filler." },
      { title: "Bunter Garten park", tip: "Large green space near city centre. Nice calm block." },
      { title: "Old Town (Alter Markt & Waldhausener Straße)", tip: "Main nightlife spine with bars, pubs, and casual restaurants. Best evening base if staying overnight." },
      { title: "Schloss Rheydt (Rheydt Palace)", tip: "Well-preserved Renaissance palace on the edge of the city. Short cultural stop if you want something beyond football." },
      { title: "Day trip: Cologne or Düsseldorf", tip: "Both 30–45 minutes by train. Many fans base themselves in those cities and travel in for matches." },
      { title: "Pre-match fan pubs", tip: "Look for supporter-heavy pubs in the city centre before heading to the stadium by shuttle or bus." },
    ],

    tips: [
      "This is a football-driven trip — don’t expect big-ticket sightseeing.",
      "If match tickets are scarce, check hospitality or secondary markets early.",
      "Public transport to Borussia-Park is reliable but busy — leave earlier than you think.",
      "If you want nightlife variety, consider sleeping in Cologne and commuting.",
      "Book accommodation early for big fixtures (derbies, Bayern, Dortmund).",
    ],

    food: ["Schnitzel", "Bratwurst", "Hearty German pub plates", "Local beers"],

    transport:
      "Regional trains connect well to Cologne/Düsseldorf. Matchday buses run from the city to Borussia-Park.",

    accommodation:
      "City centre for simplicity. Cologne as an alternative base if you want more nightlife.",
  },

  wolfsburg: {
    cityId: "wolfsburg",
    name: "Wolfsburg",
    country: "Germany",

    overview:
      "Wolfsburg is a purpose-built modern city created around Volkswagen, and its football identity mirrors that DNA. VfL Wolfsburg are one of Germany’s best-supported corporate-backed clubs, and matchdays revolve around the Volkswagen Arena complex. This is not a traditional postcard city — it’s clean, efficient, modern, and functional — but as a football stop it works extremely well. Think of Wolfsburg as a focused football + automotive culture destination rather than a classic sightseeing city.",

    topThings: [
      { title: "Volkswagen Autostadt", tip: "Huge automotive theme park, museum complex, and delivery centre. Even non-car obsessives find it impressive. Allow at least half a day." },
      { title: "Volkswagen Arena matchday", tip: "Stadium sits next to Autostadt. Arrive early, walk around the complex, and soak in the build-up." },
      { title: "Phaeno Science Center", tip: "Hands-on science museum with striking architecture. Good daytime filler." },
      { title: "Allerpark lakeside area", tip: "Green space, lake walks, cafés, and casual dining. Nice contrast to the industrial roots." },
      { title: "Wolfsburg Castle", tip: "Historic anchor of the city with museum spaces and parkland." },
      { title: "Designer Outlets Wolfsburg", tip: "Large outlet mall near station. Useful shopping stop if you have time." },
      { title: "City Centre pedestrian zone", tip: "Compact modern centre for food, supplies, and casual wandering." },
      { title: "Pre-match fan areas", tip: "Fan zones around the stadium and Autostadt concentrate atmosphere — don’t hide in the city centre." },
      { title: "Day trip: Braunschweig", tip: "25 minutes by train. More traditional historic city if you want extra sightseeing." },
      { title: "Evening bars near station", tip: "Limited but functional nightlife clustered around central area." },
    ],

    tips: [
      "Wolfsburg is efficient rather than romantic — plan activities, don’t expect organic wandering magic.",
      "Autostadt + matchday pair perfectly across one day.",
      "Book accommodation early on home match weekends.",
      "If you want nightlife, consider basing in Braunschweig and commuting.",
      "Stadium access is extremely straightforward.",
    ],

    food: ["Modern German bistros", "International chains", "Casual burgers", "Bakeries + cafés"],

    transport:
      "Excellent rail connections. Stadium is walkable from station. Local buses cover rest of city.",

    accommodation:
      "Near main station or stadium area for convenience. Braunschweig as alternative base.",
  },

  augsburg: {
    cityId: "augsburg",
    name: "Augsburg",
    country: "Germany",

    overview:
      "Augsburg is one of Germany’s most underrated short-break cities for football travellers: compact, genuinely historic, easy to navigate, and far less chaotic (and expensive) than Munich. It’s one of Germany’s oldest cities, with Roman roots, Renaissance-era wealth, and a beautiful old town that still feels “lived in” rather than staged. Add FC Augsburg matchday at the WWK ARENA and you’ve got a trip that’s relaxed, walkable, and great value — ideal if you want culture + football without big-city stress. The vibe is Bavarian-Swabian: friendly, practical, slightly quieter than Munich, but with enough beer halls, local food and atmosphere to feel like a proper German weekend away.",

    topThings: [
      { title: "Fuggerei (world’s oldest social housing complex)", tip: "This is Augsburg’s signature ‘only here’ attraction. Go early or late afternoon for fewer crowds, and actually take time to read the history — it’s not just a photo stop. The museum house gives context and makes it far more memorable." },
      { title: "Augsburg Old Town (Rathausplatz + streets around it)", tip: "Base yourself around Rathausplatz: the Town Hall (Rathaus), Perlachturm area, and surrounding lanes give you the best ‘Augsburg feel’ with minimal effort. Do a slow loop, grab a coffee, then repeat in the evening when it’s quieter and prettier." },
      { title: "Augsburg Town Hall (Rathaus) & Golden Hall", tip: "If it’s open, it’s worth it — the Golden Hall is exactly the kind of ‘surprisingly impressive’ interior you don’t expect until you’re standing inside it. Pair with a short wander through the square and nearby courtyards." },
      { title: "Canal district & Lechviertel walk", tip: "Augsburg’s little canals and bridges are what give it charm beyond the main squares. Walk through Lechviertel and let yourself get slightly lost — it’s compact and safe, and it feels genuinely local." },
      { title: "Augsburg Cathedral (Dom) + historic core", tip: "It’s not a ‘must’ like Cologne’s cathedral, but it’s a calm, beautiful stop and helps balance a weekend that otherwise becomes beer/football-heavy. Best as a quiet morning block." },
      { title: "Schaezlerpalais", tip: "For a quick culture hit: elegant interiors and art collection. It’s a strong rainy-day choice and gives a ‘grand’ contrast to Augsburg’s everyday streets." },
      { title: "FC Augsburg matchday (WWK ARENA)", tip: "Arrive early and treat the stadium area as part of the event. The club isn’t a global giant, but matchdays have a proper Bundesliga feel — especially if you make time for pre-match food and a couple of beers rather than arriving last-minute." },
      { title: "Botanical Garden (if in season)", tip: "If the weather is good and you want a calmer block, it’s an excellent reset. This is more of a ‘nice add-on’ than a priority, but it’s genuinely pleasant." },
      { title: "Beer halls + Bavarian-Swabian dining", tip: "Don’t waste time hunting for trendy spots. Augsburg is at its best in solid, traditional places: hearty food, local beer, easy atmosphere. Go where it’s busy with locals." },
      { title: "Day trip option: Munich (if you need a big-city add-on)", tip: "Augsburg–Munich is fast by train, so you can keep Augsburg as your base for value and calm, then dip into Munich for one heavy sightseeing block if you want." },
    ],

    tips: [
      "Augsburg is a ‘walkable win’ — plan loops rather than transport-heavy days.",
      "If you’re comparing to Munich: Augsburg is calmer and cheaper, but you’ll need to be intentional about nightlife (it’s not a 2am city).",
      "For matchdays, do your pre-match eating in town, then head to the stadium with time to spare — it keeps the day smooth.",
      "If you want the prettiest feel: do Old Town once in daytime and once in the evening.",
      "Keep one block unplanned — Augsburg rewards slow wandering more than rigid schedules.",
    ],

    food: [
      "Traditional Bavarian / Swabian plates (hearty, filling)",
      "Schnitzel and roast-style dishes",
      "Local beer halls / brewery pubs",
      "Cafés around Rathausplatz for an easy base",
    ],

    transport:
      "Central Augsburg is very walkable. Trams cover the wider city efficiently. The stadium is reachable by public transport — on matchdays, expect crowds and leave earlier than you think for a stress-free arrival.",

    accommodation:
      "Stay near the Old Town / Rathausplatz for the best short-break experience. If you want quieter value, look slightly outside the core but near a tram line. Augsburg often undercuts Munich heavily on price, so it’s a smart base if you’re cost-sensitive.",
  },

  hamburg: {
    cityId: "hamburg",
    name: "Hamburg",
    country: "Germany",
    thingsToDoUrl: GYG.hamburg,

    overview:
      "Hamburg is a top-tier European weekend city — and arguably Germany’s best ‘big city break’ for travellers who want football plus real urban energy. It’s a port city with swagger: maritime grit, elegant waterfront architecture, world-class nightlife, and neighbourhoods that feel genuinely distinct. For football trips, Hamburg is gold because you’re not just going to a stadium — you’re stepping into a city where matchday blends into pubs, street culture, and a late-night scene that actually delivers. Whether it’s St. Pauli’s cult identity or HSV’s giant-club weight, Hamburg gives you a football weekend that feels like a proper trip, not just a match.",

    topThings: [
      { title: "Harbor & Landungsbrücken waterfront walk", tip: "Do this early to get the city’s maritime identity immediately. Walk the promenade, watch the boats, then grab a fish sandwich — it’s a classic Hamburg ‘set the tone’ block." },
      { title: "Miniatur Wunderland", tip: "It sounds childish until you’re in there — it’s genuinely one of Europe’s best ‘indoor attractions’. Book a timed slot if possible and go off-peak; weekends can be brutally busy." },
      { title: "Speicherstadt & HafenCity (architecture + canals)", tip: "This is Hamburg’s most photogenic zone: brick warehouses, waterways, and modern waterfront development. Best in soft light (morning/evening) and perfect for a slow wander." },
      { title: "Elbphilharmonie Plaza", tip: "Even if you’re not seeing a concert, go up to the public plaza for views. Book free/low-cost access ahead when possible to avoid queues." },
      { title: "Reeperbahn & St. Pauli nightlife strip", tip: "Don’t treat it like a single ‘party street’. Use it as a base, then branch into side streets and bars with actual vibe. Go late — Hamburg nights start later than you think." },
      { title: "St. Pauli district (daytime culture + bars)", tip: "Go before the nightlife. Street art, cafés, and the district identity make more sense in daylight. It’s also a strong pre-match area." },
      { title: "St. Pauli matchday (Millerntor-Stadion)", tip: "This is a bucket-list football experience because it’s embedded in the city. Build it properly: pre-match beers locally, walk to the stadium with the crowd, then stay around afterwards rather than sprinting away." },
      { title: "HSV matchday (Volksparkstadion)", tip: "Bigger stadium, bigger-club feel. Logistics matter more because it’s not in the middle of the nightlife district. Plan transport and a post-match return route." },
      { title: "Alster Lakes (Binnenalster/ Außenalster)", tip: "For a calmer ‘reset’ block, walk around the Alster. It balances the port grit and nightlife with something clean and peaceful." },
      { title: "Fischmarkt (Sunday morning, if you can handle it)", tip: "If you’re up for it, it’s a famously messy Hamburg experience. Expect early start, crowds, and a slightly chaotic vibe — but it’s memorable. If you hate chaos, skip it without guilt." },
    ],

    tips: [
      "Hamburg is neighbourhood-driven — pick your base smartly (St. Pauli for vibe, central for convenience).",
      "If you’re doing nightlife, don’t schedule early starts the next morning. Hamburg nights run late.",
      "Miniatur Wunderland and Elbphilharmonie are ‘book ahead’ items if you want to avoid wasting hours queuing.",
      "For matchdays, build in a pre-match block; Hamburg is best when you treat football as part of the city’s culture, not an isolated event.",
      "Weather can flip fast near the water — pack layers and a proper jacket, not just optimism.",
    ],

    food: [
      "Fischbrötchen (fish sandwich) near the harbor",
      "Classic German pub food + beer halls",
      "Late-night kebabs / street food around St. Pauli",
      "Coffee and pastries in neighbourhood cafés (strong café culture)",
    ],

    transport:
      "Excellent U-Bahn and S-Bahn networks — you can do Hamburg without taxis. The city is big but well-connected. For stadiums, plan your route in advance and expect crowded trains around kick-off and full time.",

    accommodation:
      "Best football-trip bases: St. Pauli (maximum vibe, especially for St. Pauli matchdays), central areas near Hauptbahnhof for pure transport convenience, or HafenCity for modern waterfront stays. Book early on big match weekends — Hamburg is a popular city break even without football.",
  },

  bremen: {
    cityId: "bremen",
    name: "Bremen",
    country: "Germany",

    overview:
      "Bremen is a classic ‘small-city win’ for football travellers: historic, compact, genuinely pretty, and easy to do in a short break without exhausting yourself. It has a fairy-tale old town feel in parts, strong riverside atmosphere, and a relaxed pace that makes it ideal for a weekend where football is the anchor but you still want proper sightseeing and good food. With Werder Bremen, you also get a club that feels deeply tied to the city — the Weserstadion sits right by the river, and matchdays blend naturally into walking, pubs, and city centre life. Bremen isn’t flashy — it’s charming, efficient, and surprisingly satisfying.",

    topThings: [
      { title: "Marktplatz (Market Square) + Bremen Town Hall", tip: "This is Bremen’s ‘wow’ centre — the Town Hall is UNESCO-listed and the square feels properly historic. Go early for photos, then return at night when it’s calmer and beautifully lit." },
      { title: "Roland Statue", tip: "Quick but iconic. It’s part of the Marktplatz cluster — don’t overthink it, just absorb the setting and move on." },
      { title: "Schnoor Quarter (oldest district)", tip: "Narrow lanes, tiny houses, boutique shops — it’s the most atmospheric place in Bremen. Best done as a slow wander with coffee stops rather than rushing through for photos." },
      { title: "Böttcherstraße", tip: "Short street but very distinctive architecture and craft vibe. Perfect ‘10–20 minute high-impact’ stop." },
      { title: "Weser riverside walk", tip: "Walk along the river to feel Bremen’s rhythm. It’s especially good on a match weekend because it ties the city and stadium together naturally." },
      { title: "Werder Bremen matchday (Weserstadion)", tip: "One of the best stadium settings in Germany because of the river location. Arrive early and approach on foot — it makes the whole matchday feel like an event, not a commute." },
      { title: "Bürgerpark (if you want green space)", tip: "Large park that’s perfect as a calm block to reset your energy, especially if you’ve had a heavy night or a long travel day." },
      { title: "Übersee-Museum (rainy-day option)", tip: "If the weather is grim, this is a solid ‘fill 1–2 hours with substance’ museum without needing deep planning." },
      { title: "Beer halls / local pubs", tip: "Bremen is best when you go simple: busy, local-feeling places near the centre. You’ll get better atmosphere than chasing ‘top-rated tourist restaurants’." },
      { title: "Day trip option: Hamburg", tip: "If you want to blend a calm Bremen base with one high-energy day, Hamburg is reachable by train — but Bremen alone is strong enough for a full weekend." },
    ],

    tips: [
      "Bremen is compact — lean into walking and short loops rather than planning complicated transport days.",
      "Do Marktplatz + Schnoor as your core sightseeing; everything else is a bonus.",
      "The stadium setting is a major selling point: approach by foot around the river area if you can.",
      "Bremen is great value compared to bigger German cities — use that to upgrade accommodation or extend your stay.",
      "If you want nightlife, it exists but it’s not Hamburg — set expectations and you’ll enjoy it more.",
    ],

    food: [
      "Hearty German pub meals",
      "Local beer + casual dining near the centre",
      "Cafés in Schnoor for relaxed breaks",
      "Late-night snacks around central areas",
    ],

    transport:
      "City centre is very walkable. Trams help for wider hops, and stadium access is straightforward. Matchdays bring crowds, but Bremen is smaller-scale and easier to manage than the biggest Bundesliga cities.",

    accommodation:
      "Stay central (near Marktplatz / Old Town) for maximum charm and easy walking. For match weekends, being near the centre gives you the best mix of sightseeing + easy stadium access. Book earlier for bigger fixtures — Bremen fills up more than people expect.",
  },

  mainz: {
    cityId: "mainz",
    name: "Mainz",
    country: "Germany",

    overview:
      "Mainz is a brilliant ‘smart pick’ Bundesliga city break: historic, riverside, walkable, and genuinely enjoyable even if you’re only in town for 24–48 hours. It sits on the Rhine opposite Wiesbaden and a short hop from Frankfurt, but it feels far calmer and more characterful than a big hub city. Mainz delivers exactly what football travellers want when they don’t want chaos: a compact old town, strong wine-and-beer culture, great day-trip options on the Rhine, and a matchday that’s easy to do without logistics stress. It’s also a city that rewards slowing down — cafés, riverside promenades, and wine taverns make it feel like a proper mini-break, not just “a place you slept before a game.”",

    topThings: [
      { title: "Mainz Old Town (Altstadt) wander", tip: "Mainz is best done as a slow roam: half-timbered houses, small squares, local shops, and bars tucked into side streets. Don’t try to ‘route plan’ it too much — pick a starting point near the cathedral, then drift." },
      { title: "Mainz Cathedral (Dom St. Martin)", tip: "This is the historic anchor. Go inside for 15–30 minutes, then use the surrounding streets as your base for food and drinks. It’s central, so it naturally connects to everything else." },
      { title: "Rheinpromenade riverside walk", tip: "Do a Rhine walk to reset your head — especially if you’ve travelled in that day. Late afternoon is ideal: good light, calmer vibe, and it sets you up perfectly for dinner and evening drinks." },
      { title: "Gutenberg Museum / Gutenberg history", tip: "Mainz is the Gutenberg city. If you want one “proper culture” block, this is the one. Check opening status before you build the day around it, but when it’s available it adds real substance to your trip beyond football." },
      { title: "Augustinerstraße & the ‘classic Mainz lanes’", tip: "This street and the surrounding area are where Mainz feels most like itself — photogenic but still local. It’s an easy win for atmosphere and a good place to pause for a drink." },
      { title: "Wine taverns (Weinstuben) + local white wines", tip: "Mainz is a Rhine wine city. Don’t just default to beer — try local Riesling and regional whites in a proper Weinstube. The vibe is relaxed and perfect for pre-match or post-match wind-down." },
      { title: "1. FSV Mainz 05 matchday (MEWA ARENA)", tip: "Mainz matchdays are approachable and efficient — a huge plus for travellers. Arrive early, do a pre-match drink/meal in town, then head out with time to spare so you’re not rushing." },
      { title: "Day trip: Rhine river towns (Bingen, Rüdesheim, etc.)", tip: "If you’ve got an extra day, the Rhine is right there. Short trips to classic river scenery and wine towns are easy and turn Mainz into a ‘football + Rhine mini-break’ rather than just a match stop." },
      { title: "Day trip: Frankfurt (big-city bolt-on)", tip: "If you want a ‘big city’ block (skyscraper views, shopping, museums), Frankfurt is close. Mainz lets you sleep somewhere calmer and cheaper, then dip into Frankfurt when you choose." },
      { title: "Chilled café culture + people-watching", tip: "Mainz is underrated for just sitting and enjoying the day. Build at least one low-pressure hour into your trip — coffee, pastries, a slow stroll — it makes the whole weekend feel like a break." },
    ],

    tips: [
      "Mainz works best when you don’t over-pack the itinerary — keep it relaxed and you’ll enjoy it more.",
      "Use the cathedral area as your base: you’re central, walkable, and surrounded by food/drink options.",
      "If you’re doing Rhine day trips, check train times and don’t leave it to the last minute — services can be busy on weekends.",
      "Matchday is simple here compared to bigger cities, but still give yourself buffer time so you’re not arriving stressed.",
      "Mainz is great value: consider upgrading accommodation quality rather than chasing the absolute cheapest option.",
      "If you want a stronger nightlife hit, you can always do a short hop to Frankfurt — but Mainz itself is more ‘wine + relaxed evenings’ than ‘all-night chaos’.",
    ],

    food: [
      "Local Weinstuben (wine taverns) for a proper Mainz evening",
      "Riesling and regional white wines (don’t treat Mainz like a beer-only city)",
      "Hearty German pub meals in the old town lanes",
      "Casual riverside dining (good for a low-effort, high-value evening)",
    ],

    transport:
      "Mainz is very walkable in the centre. Public transport covers the wider city and makes matchday travel straightforward. It’s also a strong rail node for Rhine day trips and quick access to Frankfurt, Wiesbaden, and other nearby cities.",

    accommodation:
      "Stay near the Old Town/cathedral area for maximum walkability and atmosphere. If you want quieter nights, look just outside the core but still within easy tram/bus access. Mainz is a smart ‘base city’ if you want Rhine scenery without paying premium prices in bigger hubs.",
  },

  heidenheim: {
    cityId: "heidenheim",
    name: "Heidenheim an der Brenz",
    country: "Germany",

    overview:
      "Heidenheim is the definition of a ‘pure football trip’ that still feels like a proper break if you do it right. It’s a smaller city on the edge of the Swabian Jura (Baden-Württemberg region), surrounded by green landscapes and day-trip countryside — and that’s exactly why it works. You’re not coming for big-city landmarks; you’re coming for a Bundesliga matchday that feels intimate, local, and different from the usual mega-stadium routine. The upside is huge: fewer crowds, calmer logistics, better value, and a sense of actually visiting somewhere you wouldn’t normally go. If you sell this trip properly to yourself: it’s “Bundesliga + countryside + a relaxed German weekend” rather than “I need 50 attractions.”",

    topThings: [
      { title: "1. FC Heidenheim matchday (Voith-Arena)", tip: "This is the whole point — a top-flight matchday in a smaller city where the club feels like the community. Arrive early, soak up the local pre-match vibe, and don’t treat it like a last-minute stadium dash." },
      { title: "Schloss Hellenstein (Hellenstein Castle) viewpoint", tip: "This is your best ‘Heidenheim signature’ stop: great views and a strong sense of place. Go in daylight for scenery, or late afternoon if you want golden light." },
      { title: "Old Town / central walk (small-city pace)", tip: "Heidenheim isn’t built for checklist sightseeing — it’s built for calm wandering. Do a short loop through the centre, pick a café, then just let the pace slow down." },
      { title: "Nature block: Swabian Jura edge (walks + viewpoints)", tip: "If you’ve got a spare morning, build in a countryside walk or scenic viewpoint. Even a short nature block changes the feel of the trip and makes it “football + outdoors” rather than “football + hotel room.”" },
      { title: "Day trip option: Ulm", tip: "If you want a bigger ‘city’ hit nearby, Ulm is a strong add-on with the cathedral (Ulm Minster) and a pretty old town feel." },
      { title: "Day trip option: Stuttgart (if you want a major hub)", tip: "Stuttgart is the nearest major city option — useful if your flights or trains route through there, or if you want one big-city day and one small-city matchday day." },
      { title: "Local beer halls / simple German dining", tip: "Heidenheim is best when you keep food plans simple and local — hearty German staples, beer, and relaxed service." },
      { title: "Pre-match and post-match ritual time", tip: "Small-city matchdays win because you can actually enjoy the build-up and unwind without fighting crowds. Plan a pre-match meal and a post-match drink." },
      { title: "If you want a ‘regional culture’ angle", tip: "Lean into Baden-Württemberg / Swabian identity — it’s subtly different from Bavaria or the north. Even noticing the food/beer style makes the trip feel deliberate." },
      { title: "Slow morning café + ‘reset’ block", tip: "Crucial in a smaller city: give yourself a calm start, then you’ll enjoy matchday far more. This is how you turn a short trip into something restorative." },
    ],

    tips: [
      "Heidenheim is a ‘different kind of football trip’ — embrace the smaller scale instead of expecting big-city sightseeing.",
      "Build in one scenic/outdoors block and the weekend immediately feels richer.",
      "Plan your transport and accommodation early: smaller cities have fewer options, so the best places go first.",
      "Matchday logistics are easier than big clubs, but still arrive early — the atmosphere is the reward.",
      "If you want more variety, pair Heidenheim with a nearby city (Ulm or Stuttgart) rather than forcing Heidenheim to carry the whole itinerary.",
      "This is a value win: you can often get better accommodation quality for less money than in major German hubs.",
    ],

    food: [
      "Hearty German pub staples (keep it simple and satisfying)",
      "Regional beer and casual dining (local > trendy)",
      "Pre-match meal in town (so you’re not relying on stadium food)",
      "Post-match drink to extend the day and avoid a ‘hard stop’ ending",
    ],

    transport:
      "Heidenheim is straightforward once you’re there, but it’s not a major transport hub — planning matters more than in big cities. Expect regional trains/buses and build buffer time into connections, especially on match weekends.",

    accommodation:
      "Book early for match weekends — supply is smaller. Stay central for easy walking, or slightly outside town for quieter ‘countryside break’ energy. If pairing with Stuttgart/Ulm, decide whether you want to sleep in Heidenheim for matchday simplicity or base elsewhere for broader variety.",
  },
};

export default bundesligaCityGuides;
