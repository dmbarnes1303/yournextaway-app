import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * If a city doesn't have a clean GYG landing page, leave it undefined and
 * let UI fall back to buildAffiliateLinks({ city }).experiencesUrl.
 */
const GYG = {
  munich:
    "https://www.getyourguide.com/en-gb/munich-l139/?partner_id=MAQJREP&utm_medium=online_publisher",
  berlin:
    "https://www.getyourguide.com/en-gb/berlin-l17/?partner_id=MAQJREP&utm_medium=online_publisher",
  hamburg:
    "https://www.getyourguide.com/en-gb/hamburg-l23/?partner_id=MAQJREP&utm_medium=online_publisher",
  cologne:
    "https://www.getyourguide.com/en-gb/cologne-l19/?partner_id=MAQJREP&utm_medium=online_publisher",
  frankfurt:
    "https://www.getyourguide.com/en-gb/frankfurt-l53/?partner_id=MAQJREP&utm_medium=online_publisher",
  leipzig:
    "https://www.getyourguide.com/en-gb/leipzig-l24/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const bundesligaCityGuides: Record<string, CityGuide> = {
  munich: {
    cityId: "munich",
    name: "Munich",
    country: "Germany",
    bookingLinks: {
      thingsToDo: GYG.munich,
    },
    thingsToDoUrl: GYG.munich,

    overview:
      "Munich is one of Europe’s easiest premium football weekends: clean transport, beautiful central districts, serious beer-hall culture, and one of the world’s most recognisable stadiums. The key is not to overdo it. Pick one strong cultural block, one strong food-and-beer block, and keep Allianz Arena travel simple.",

    topThings: [
      { title: "Marienplatz → Viktualienmarkt loop", tip: "Best first move. You get the core old-city feel fast without wasting half the day." },
      { title: "English Garden", tip: "Use it as a reset block rather than trying to 'cover' the whole park." },
      { title: "Beer hall session", tip: "Do one properly instead of bouncing between famous names for the sake of it." },
      { title: "BMW Welt / Museum", tip: "Strong half-day choice if you want one standout modern attraction." },
      { title: "Nymphenburg Palace", tip: "Worth it if you want one grand sightseeing anchor beyond the centre." },
      { title: "Olympiapark", tip: "Good add-on if you're already doing BMW or want skyline views without much effort." },
      { title: "Schwabing cafés", tip: "A better slower-paced district block than endlessly circling the main square." },
      { title: "Allianz Arena matchday", tip: "Arrive early. The exterior and scale are part of the point, not just the 90 minutes." },
      { title: "One proper Bavarian meal", tip: "Book it. Munich punishes lazy walk-in planning on football weekends." },
      { title: "Lake day trip (optional)", tip: "Only if you have a real extra day. Don’t wreck the football trip chasing scenery just because Bavaria exists." },
    ],

    tips: [
      "Stay central Munich, not near the stadium.",
      "U-Bahn beats taxis almost every time.",
      "Book accommodation early on Bayern home weekends.",
      "Beer halls are better with a fixed plan than random queue-hopping.",
      "For Allianz travel, keep it boring: U6 and enough buffer time.",
    ],

    food: [
      "Weisswurst breakfast",
      "Roast pork with dumplings",
      "Pretzels and Obatzda",
      "Beer hall classics",
      "Proper coffee-and-cake stop",
    ],

    transport:
      "Munich public transport is excellent. U-Bahn, S-Bahn, trams and buses cover the city cleanly, and Allianz Arena access is straightforward if you stay central and stop improvising last minute.",

    accommodation:
      "Altstadt / Marienplatz is the premium classic base. Hauptbahnhof is more practical for rail and airport links. Schwabing gives you a stronger café-and-bars feel without losing easy city access.",
  },

  berlin: {
    cityId: "berlin",
    name: "Berlin",
    country: "Germany",
    bookingLinks: {
      thingsToDo: GYG.berlin,
    },
    thingsToDoUrl: GYG.berlin,

    overview:
      "Berlin is not a neat weekend city unless you treat it properly. It is huge, layered, and neighbourhood-driven. The winning formula is simple: stop trying to 'do Berlin' and build the trip by area. One football anchor, one history block, one nightlife block, and one slower daytime district is enough for a very good trip.",

    topThings: [
      { title: "Brandenburg Gate → Reichstag → Tiergarten loop", tip: "Best central-history block if it’s your first Berlin trip." },
      { title: "Berlin Wall Memorial", tip: "Better than speed-running random Cold War stops with no context." },
      { title: "Museum Island (pick one)", tip: "Choose one museum only. Berlin punishes cultural greed." },
      { title: "East Side Gallery", tip: "Worth doing once, then move on. Don’t let it eat the whole day." },
      { title: "Kreuzberg food block", tip: "Good for casual eating and evening drift without needing formal plans." },
      { title: "Prenzlauer Berg cafés", tip: "A strong slower-paced daytime district if you need a reset from heavy sightseeing." },
      { title: "Tempelhofer Feld", tip: "One of the easiest ‘Berlin feels different’ moments with very little effort." },
      { title: "Union Berlin matchday", tip: "The best football-culture pick in the city. Arrive early and treat the build-up seriously." },
      { title: "Hertha matchday at Olympiastadion", tip: "More scale and history, less intimacy. Stronger for major-event feel than local intensity." },
      { title: "Neighbourhood bar night", tip: "Berlin nightlife works better when you pick an area than when you chase famous names across town." },
    ],

    tips: [
      "Plan by neighbourhood, not by attractions list.",
      "Berlin is too big for random zig-zagging.",
      "Public transport is the answer; taxis are often a waste.",
      "Union needs more planning than Hertha because of demand and logistics.",
      "One history block per day is enough unless you enjoy being mentally dead by dinner.",
    ],

    food: [
      "Proper döner",
      "Currywurst",
      "Casual modern German",
      "Kreuzberg / Neukölln small plates",
      "Late-night street food",
    ],

    transport:
      "Berlin’s U-Bahn, S-Bahn, trams and buses are excellent. The city is too large to wing it on foot alone, so build simple day-zones and let public transport do the heavy lifting.",

    accommodation:
      "Mitte is the easiest first-trip base. Friedrichshain and Kreuzberg are stronger if nightlife matters more. Prenzlauer Berg is calmer and cleaner for a slower weekend.",
  },

  hamburg: {
    cityId: "hamburg",
    name: "Hamburg",
    country: "Germany",
    bookingLinks: {
      thingsToDo: GYG.hamburg,
    },
    thingsToDoUrl: GYG.hamburg,

    overview:
      "Hamburg is one of the best football weekends in Europe because the city itself is elite before you even get to the match. Waterfront walks, proper nightlife, strong food, and two very different football experiences make it easy to build a trip with real shape. The only mistake is staying too far out and treating the stadium as the whole weekend.",

    topThings: [
      { title: "Landungsbrücken → harbour walk", tip: "Best first move if you want Hamburg to make sense quickly." },
      { title: "Speicherstadt & HafenCity", tip: "A clean sightseeing loop that actually looks like Hamburg, not generic Germany." },
      { title: "Elbphilharmonie Plaza", tip: "Do it for the view, then move on. Don’t overcommit time." },
      { title: "Miniatur Wunderland", tip: "Book ahead if you care. Otherwise skip the queue drama." },
      { title: "Alster walk", tip: "Good calmer block if you need air after heavier nightlife or stadium energy." },
      { title: "St. Pauli district daytime wander", tip: "Do it before dark once, not only as a nightlife zone." },
      { title: "St. Pauli matchday", tip: "One of the best culture-heavy football experiences in Europe. Build the whole day around it." },
      { title: "HSV matchday", tip: "Bigger-club scale and a more traditional major-stadium feel." },
      { title: "One proper seafood stop", tip: "Worth doing here more than in most inland Bundesliga cities." },
      { title: "Reeperbahn / side-street night", tip: "Use the area intelligently. Going only to the obvious strip is lazy and usually worse." },
    ],

    tips: [
      "Stay central Hamburg, not near the stadiums.",
      "St. Pauli is best for vibe; central/Hbf is best for transport.",
      "Book Miniatur Wunderland if you actually want to do it.",
      "Hamburg nights run late, so stop planning 8am starts after bar-heavy evenings.",
      "For both clubs, build in pre-match time rather than arriving flat and rushed.",
    ],

    food: [
      "Fischbrötchen",
      "Port-area seafood",
      "German pub food",
      "St. Pauli late-night eats",
      "Strong café breakfasts",
    ],

    transport:
      "Hamburg’s U-Bahn and S-Bahn are excellent. The city is large but very manageable if you stay central and use rail properly rather than bouncing around in taxis.",

    accommodation:
      "St. Pauli and Schanzenviertel are strongest for atmosphere. St. Georg / Hbf is best for practical arrivals and wider movement. HafenCity is cleaner and more polished, but less lively at night.",
  },

  cologne: {
    cityId: "cologne",
    name: "Cologne",
    country: "Germany",
    bookingLinks: {
      thingsToDo: GYG.cologne,
    },
    thingsToDoUrl: GYG.cologne,

    overview:
      "Cologne is one of Germany’s best all-round football weekends because it gets the basics right: compact centre, huge cathedral, strong pub culture, easy stadium transport, and a supporter base that turns ordinary fixtures into proper occasions. It’s not subtle, and that’s exactly why it works.",

    topThings: [
      { title: "Cathedral + station-front start", tip: "The obvious first move and still worth doing properly." },
      { title: "Altstadt riverside wander", tip: "Good low-effort route for pubs, views and easy city rhythm." },
      { title: "Hohenzollern Bridge walk", tip: "Fast, iconic, and easy to combine with the riverfront." },
      { title: "Belgisches Viertel", tip: "Best district if you want a more local bar-and-food block than the tourist-heavy centre." },
      { title: "Chocolate Museum (optional)", tip: "Fine if it fits naturally. Not worth hijacking the trip for." },
      { title: "Museum Ludwig", tip: "One smart culture pick if weather turns or you want an art stop." },
      { title: "FC Cologne matchday", tip: "Arrive early. Cologne are a noise-and-beer culture club, not a turn-up-10-minutes-before side." },
      { title: "Kölsch beer hall session", tip: "Do this properly once and lean into the local ritual." },
      { title: "Rhine evening walk", tip: "Simple but very effective after dinner or post-match." },
      { title: "Leverkusen add-on", tip: "Easy if you’re building a wider Rhine football weekend." },
    ],

    tips: [
      "Cologne is ideal for bar-hopping without overplanning.",
      "Stay central and use trams for stadium travel.",
      "Book accommodation early for major fixtures and carnival-style busy weekends.",
      "Kölsch is small-glass drinking; if you don’t stop it, it keeps coming.",
      "Belgisches Viertel is usually the smarter evening base than only doing Altstadt.",
    ],

    food: [
      "Kölsch beer hall food",
      "Schnitzel",
      "Bratwurst",
      "Modern bistro dinners",
      "Post-match pub plates",
    ],

    transport:
      "Cologne’s tram and rail network is strong and easy to use. RheinEnergieStadion access is simple from the centre, so there is no good reason to stay out by the ground.",

    accommodation:
      "Altstadt is the easiest first-trip base. Belgisches Viertel is better for bars and food. Ehrenfeld works if you want a slightly more local feel with good nightlife.",
  },

  frankfurt: {
    cityId: "frankfurt",
    name: "Frankfurt",
    country: "Germany",
    bookingLinks: {
      thingsToDo: GYG.frankfurt,
    },
    thingsToDoUrl: GYG.frankfurt,

    overview:
      "Frankfurt is one of the easiest high-value football trips in Germany because it combines big-hub convenience with a very strong matchday, a compact old-town core, and quick access to the Rhine-Main region. The airport makes it brutally efficient. The trick is not wasting the trip hiding around the station area and pretending that’s the whole city.",

    topThings: [
      { title: "Römerberg & reconstructed old town", tip: "Compact and easy. Good first block after arrival." },
      { title: "Main river walk", tip: "A very easy way to make Frankfurt feel less like a business hub and more like a city break." },
      { title: "Main Tower viewpoint", tip: "Best skyline view if weather is clear. Time it properly." },
      { title: "Sachsenhausen evening", tip: "Best for apple wine, food, and a stronger local feel than the business core." },
      { title: "Städel Museum", tip: "Strong single-museum choice if you want one cultural anchor." },
      { title: "Palmengarten", tip: "Useful calmer block if you want green space without leaving the city." },
      { title: "Eintracht Frankfurt matchday", tip: "One of Germany’s best atmospheres. Treat it seriously and arrive early." },
      { title: "Skyline + old-town split", tip: "This is the correct way to understand Frankfurt fast: one modern block, one historic block." },
      { title: "Mainz or Wiesbaden add-on", tip: "Very easy if you have an extra day and want a softer Rhine-side contrast." },
      { title: "One proper dinner booking", tip: "Worth it here because the city has stronger food than the lazy 'finance city' stereotype suggests." },
    ],

    tips: [
      "Frankfurt airport convenience makes this a strong short-break city.",
      "Don’t judge the whole city by the immediate station zone.",
      "Sachsenhausen is the better evening play than staying only in the business core.",
      "Eintracht matchdays need buffer time — the atmosphere is worth arriving for.",
      "Use Frankfurt as a base if you want easy wider-region movement.",
    ],

    food: [
      "Apfelwein taverns",
      "Schnitzel with green sauce",
      "Modern Innenstadt dining",
      "Bakery breakfasts",
      "Casual riverfront meals",
    ],

    transport:
      "Frankfurt’s S-Bahn, U-Bahn, trams and regional rail are excellent. The stadium is easy on matchdays, the airport is close, and wider-region day trips are very simple if you base yourself centrally.",

    accommodation:
      "Innenstadt and Römer area are best for first trips. Sachsenhausen is stronger for atmosphere. Hauptbahnhof is practical but rougher, so only choose it if you value logistics over feel.",
  },

  leipzig: {
    cityId: "leipzig",
    name: "Leipzig",
    country: "Germany",
    bookingLinks: {
      thingsToDo: GYG.leipzig,
    },
    thingsToDoUrl: GYG.leipzig,

    overview:
      "Leipzig is one of Germany’s best-value football weekends: compact, energetic, creative, and easy to navigate without much wasted movement. It’s a very good city for people who want one modern football anchor and a weekend that still feels like a proper city break rather than just stadium logistics.",

    topThings: [
      { title: "Old Town loop", tip: "Do Marktplatz, Thomaskirche and the centre in one clean block." },
      { title: "Arcades and passages", tip: "One of the quickest ways to get the Leipzig feel without forcing sightseeing." },
      { title: "St. Thomas Church area", tip: "A stronger culture stop than random museum-hopping." },
      { title: "Monument to the Battle of the Nations", tip: "Worth it if you want one bigger landmark away from the core." },
      { title: "Plagwitz & Karl-Heine-Kanal", tip: "Best alternative district block for bars, walks and a more creative feel." },
      { title: "Spinnerei", tip: "Only if you genuinely like galleries and art spaces. Otherwise skip." },
      { title: "RB Leipzig matchday", tip: "The city makes this trip stronger than the club alone would." },
      { title: "Augustusplatz", tip: "Useful quick stop, not a long commitment." },
      { title: "One proper dinner in the centre or Plagwitz", tip: "Leipzig is good enough that lazy food choices are a waste." },
      { title: "Canal-side evening drinks", tip: "A clean way to make the weekend feel modern and relaxed." },
    ],

    tips: [
      "Leipzig is very easy to overplan. Don’t.",
      "Split your time between centre and one second district.",
      "Stay central rather than near the stadium.",
      "It’s one of the better Bundesliga cities for a straightforward two-night break.",
      "The city itself does a lot of the work here — use it.",
    ],

    food: [
      "Pastry and coffee in the centre",
      "Modern German dining",
      "Casual canalside bars",
      "Beer hall / brewery stops",
      "Good brunch cafés",
    ],

    transport:
      "Leipzig is easy. The centre is walkable, trams fill the gaps, and stadium access is clean if you keep the base central.",

    accommodation:
      "Innenstadt is the obvious best base. Plagwitz works if you want a more creative district feel. Around the Hauptbahnhof is practical but less interesting at night.",
  },

  stuttgart: {
    cityId: "stuttgart",
    name: "Stuttgart",
    country: "Germany",

    overview:
      "Stuttgart is a smarter football weekend than people expect: a serious club, a big stadium, elite car museums, and a city that works best when you build the trip around one or two strong anchors rather than trying to 'do everything'. It is less charming than Freiburg and less instantly exciting than Hamburg, but very good if you want structure and substance.",

    topThings: [
      { title: "Mercedes-Benz Museum", tip: "One of the strongest non-football attractions in the whole Bundesliga set. Give it proper time." },
      { title: "Porsche Museum", tip: "Best if you want a second automotive block, but don’t cram both in badly." },
      { title: "Schlossplatz loop", tip: "The obvious city-centre orientation block." },
      { title: "TV Tower / viewpoint", tip: "Worth it on a clear day. Skip it in poor visibility." },
      { title: "Wine tavern evening", tip: "A much better Stuttgart move than generic chain dining." },
      { title: "Killesberg / park reset", tip: "Useful if you want a lighter daytime block." },
      { title: "VfB Stuttgart matchday", tip: "Big-club feel and strong emotional crowd energy. Arrive with time." },
      { title: "Bad Cannstatt area", tip: "Worth understanding because it shapes the matchday more than staying only in the centre." },
      { title: "One proper Swabian meal", tip: "Do it once properly instead of defaulting to generic pub food." },
      { title: "Ludwigsburg add-on", tip: "Only if you have the extra day. Don’t force it into a tight match trip." },
    ],

    tips: [
      "Stuttgart is best done in blocks, not constant movement.",
      "Pick one or two major attractions only.",
      "Stay central unless matchday convenience is your only priority.",
      "Restaurant bookings matter more here than people assume.",
      "If you do both car museums plus football in one weekend, pace yourself properly.",
    ],

    food: [
      "Maultaschen",
      "Spätzle",
      "Swabian tavern food",
      "Wine-bar dinners",
      "Bakery breakfasts",
    ],

    transport:
      "Stuttgart’s public transport is strong, but the city is hillier and more spread than it first looks. Use rail and trams intelligently instead of assuming all walks are easy.",

    accommodation:
      "Stuttgart-Mitte is the best overall base. Hauptbahnhof area is practical. Bad Cannstatt only makes sense if you want shorter stadium access and are willing to sacrifice broader city feel.",
  },

  bremen: {
    cityId: "bremen",
    name: "Bremen",
    country: "Germany",

    overview:
      "Bremen is one of the cleanest short football weekends in Germany: small enough to stay easy, historic enough to feel worthwhile, and home to one of the best stadium settings in the league. If you want a proper city break without heavy logistics, Bremen is a very strong pick.",

    topThings: [
      { title: "Marktplatz & Town Hall", tip: "The obvious centrepiece and worth doing properly." },
      { title: "Schnoor Quarter", tip: "Best area for a slower wander and the strongest 'old Bremen' feel." },
      { title: "Böttcherstraße", tip: "Quick, high-impact stop. Don’t overstay it." },
      { title: "Weser riverside walk", tip: "A very good football-weekend route because it naturally links city and stadium feel." },
      { title: "Weserstadion matchday", tip: "One of the best-located stadium experiences in Germany. Approach on foot if you can." },
      { title: "Bürgerpark", tip: "Good calm reset if you have time beyond football and city centre." },
      { title: "Übersee-Museum", tip: "Solid indoor option if weather turns ugly." },
      { title: "One proper local pub session", tip: "Bremen works better with one good simple evening than overcomplicated nightlife chasing." },
      { title: "Harbour / river evening", tip: "A low-effort way to make the trip feel fuller." },
      { title: "Hamburg add-on", tip: "Possible, but Bremen is strong enough to stand alone for a football weekend." },
    ],

    tips: [
      "Bremen is compact. Walking is the default.",
      "The stadium setting is one of the city’s biggest strengths.",
      "Stay central and let the whole trip stay easy.",
      "Bremen is stronger for charm than nightlife chaos.",
      "Good value compared with bigger Bundesliga cities.",
    ],

    food: [
      "German pub classics",
      "Riverfront meals",
      "Café stops in Schnoor",
      "Simple beer-hall dinners",
      "Post-match local bars",
    ],

    transport:
      "Bremen is very manageable. Trams help, but a central base makes most of the key trip walkable, including a very pleasant stadium approach if you pace it right.",

    accommodation:
      "Old Town is the strongest base. Viertel is better if you want slightly more bars and local feel. Stay central and don’t overthink it.",
  },

  freiburg: {
    cityId: "freiburg",
    name: "Freiburg im Breisgau",
    country: "Germany",

    overview:
      "Freiburg is one of the best smaller football city breaks in Germany because it combines a very likeable old town, strong café and wine culture, and a club that feels rooted rather than manufactured. This is not a loud macho football trip. It’s a smarter, calmer, very good one.",

    topThings: [
      { title: "Altstadt loop", tip: "The city centre is the point. Walk it properly rather than chasing too many add-ons." },
      { title: "Freiburg Minster", tip: "Worth doing once properly, especially with the square and market around it." },
      { title: "Schlossberg viewpoint", tip: "One of the best low-effort scenic payoffs in the Bundesliga set." },
      { title: "Münsterplatz market", tip: "Great for a simple lunch or snack without planning too much." },
      { title: "Black Forest add-on", tip: "Only if you have real extra time. Don’t sabotage the city weekend trying to overachieve." },
      { title: "Vauban district", tip: "A good contrast if you want one non-old-town block." },
      { title: "SC Freiburg matchday", tip: "A calmer, more grounded Bundesliga experience than the giant-club cities." },
      { title: "Wine tavern evening", tip: "A better Freiburg move than only doing standard beer halls." },
      { title: "University quarter bars", tip: "Good for a relaxed evening that still has life." },
      { title: "One slower morning", tip: "Freiburg is better when you stop trying to sprint through it." },
    ],

    tips: [
      "Freiburg is best at a slower pace.",
      "Stay central and keep the whole weekend walkable.",
      "The city rewards one or two strong blocks, not overstuffed planning.",
      "Good weather massively upgrades the trip, so lean into outdoors when you can.",
      "It’s one of the best football-plus-scenery options in Germany.",
    ],

    food: [
      "Flammkuchen",
      "Regional wine",
      "Market-square snacks",
      "Traditional Baden meals",
      "Strong café breakfasts",
    ],

    transport:
      "Freiburg is easy. The centre is very walkable, trams are useful, and stadium movement is straightforward if you stay in or near the old town.",

    accommodation:
      "Altstadt is the clear best base. Near the station is more practical for rail trips, but slightly weaker in feel. Central wins here.",
  },

  mainz: {
    cityId: "mainz",
    name: "Mainz",
    country: "Germany",

    overview:
      "Mainz is one of Germany’s smartest football weekend picks because it gives you old-town charm, Rhine-side atmosphere, strong wine culture, and a very manageable matchday without the overhead of a giant city. It works especially well for people who want football plus a proper mini-break rather than football plus urban chaos.",

    topThings: [
      { title: "Altstadt wander", tip: "This is the city’s best asset. Don’t over-route it — just let the centre work." },
      { title: "Mainz Cathedral area", tip: "Best anchor point for getting the city shape fast." },
      { title: "Rhine promenade walk", tip: "An easy daytime or post-dinner block that makes the city land properly." },
      { title: "Wine tavern evening", tip: "Mainz is better when you lean into wine, not just default beer hall mode." },
      { title: "Augustinerstraße", tip: "A very good old-town street for casual bars and city feel." },
      { title: "Gutenberg connection", tip: "Worth a museum/history stop if it fits, but don’t force it." },
      { title: "Mainz 05 matchday", tip: "A very good club if you like intensity and a real local feel." },
      { title: "Mainz + Frankfurt split", tip: "A smart wider-weekend option if you want one calmer city and one bigger-city block." },
      { title: "Rhine town add-on", tip: "Only if you’ve got the spare day and want a softer scenic extension." },
      { title: "One café-and-bakery morning", tip: "Mainz suits slower starts very well." },
    ],

    tips: [
      "Mainz is better when you keep it relaxed.",
      "Stay near the old town if you can.",
      "Wine is part of the city’s identity, so use it.",
      "Very strong for a one- or two-night football trip.",
      "Frankfurt is an easy add-on, but Mainz does not need it to justify itself.",
    ],

    food: [
      "Wine tavern plates",
      "Regional white wine",
      "Hearty pub food",
      "Old-town café stops",
      "Simple riverfront meals",
    ],

    transport:
      "Mainz is walkable in the centre and easy on public transport beyond that. Matchday access is straightforward, and wider Rhine-Main rail links make add-ons very easy.",

    accommodation:
      "Altstadt is the best overall base. Near Mainz Hbf is better for rail practicality. The centre wins if you want the trip to feel like more than a transit stop.",
  },

  augsburg: {
    cityId: "augsburg",
    name: "Augsburg",
    country: "Germany",

    overview:
      "Augsburg is a very good football weekend for people who want a calmer, cheaper, lower-friction alternative to Munich. It has enough history and old-town charm to feel worthwhile, but not so much scale that the trip becomes work. FC Augsburg fits that same logic: straightforward, local, and easy to build into a clean weekend.",

    topThings: [
      { title: "Fuggerei", tip: "The city’s most distinctive non-football stop. Worth doing properly once." },
      { title: "Rathausplatz & old-town loop", tip: "Best way to orient the weekend quickly." },
      { title: "Golden Hall / Town Hall", tip: "A good short cultural anchor if open." },
      { title: "Lechviertel canal walk", tip: "One of the best 'Augsburg feels different' blocks." },
      { title: "Cathedral stop", tip: "Good calmer morning block if you want one historic anchor." },
      { title: "FC Augsburg matchday", tip: "A straightforward Bundesliga experience with far less friction than the giant clubs." },
      { title: "Traditional beer hall meal", tip: "The right move here is simple and local, not trendy." },
      { title: "Botanical Garden (optional)", tip: "Only if you have extra time and good weather." },
      { title: "Old-town evening", tip: "Worth doing twice — day and night feel different enough." },
      { title: "Munich add-on", tip: "Possible, but Augsburg stands up fine on its own for a football weekend." },
    ],

    tips: [
      "Augsburg is better when you walk it than when you over-transport it.",
      "A very good value alternative to Munich.",
      "Stay central and keep the trip easy.",
      "Nightlife is lighter than Munich, so set expectations properly.",
      "Good for a cleaner, more relaxed Bundesliga break.",
    ],

    food: [
      "Traditional Bavarian / Swabian dishes",
      "Beer hall dinners",
      "Café stops near Rathausplatz",
      "Hearty pub meals",
      "Simple breakfast bakeries",
    ],

    transport:
      "Central Augsburg is walkable. Trams are useful for stadium travel and outer-city movement. If you stay in the core, the weekend stays very low-friction.",

    accommodation:
      "Old Town / Rathausplatz is the best overall base. Near the Hauptbahnhof works if you care more about rail practicality. Central is still the better football-weekend answer.",
  },

  leverkusen: {
    cityId: "leverkusen",
    name: "Leverkusen",
    country: "Germany",

    overview:
      "Leverkusen is not the city you stay in because it has the best nightlife or prettiest old town. It’s the city you use intelligently because Bayer Leverkusen are a serious football product and the Rhine region around them is excellent. The smart move is usually Cologne or Düsseldorf as the wider base, then Leverkusen as the matchday centrepiece.",

    topThings: [
      { title: "BayArena matchday", tip: "The main reason you’re here. Build the day around it properly." },
      { title: "Cologne-based football weekend", tip: "Usually the strongest trip structure if you want nightlife and a fuller city feel." },
      { title: "Düsseldorf-based football weekend", tip: "A slicker alternative if you want a slightly more polished wider base." },
      { title: "Japanese Garden", tip: "A decent calmer stop if you actually have time in Leverkusen itself." },
      { title: "Rhine-side walking block", tip: "Good for a pre-match reset, but don’t pretend Leverkusen is the star attraction over Cologne." },
      { title: "One practical local meal", tip: "Fine, but most standout dining should happen in your wider base city." },
      { title: "Cologne Cathedral add-on", tip: "Easy if you’re basing there, and worth it." },
      { title: "Düsseldorf Altstadt night", tip: "A strong play if you want post-match nightlife beyond Leverkusen itself." },
      { title: "Kölsch vs Altbier choice", tip: "Lean into the region rather than making the trip feel generic." },
      { title: "Post-match decompression", tip: "Often smarter than charging straight into packed regional trains." },
    ],

    tips: [
      "Leverkusen is usually best as a matchday city, not a full weekend base.",
      "Cologne is the default best wider base.",
      "Düsseldorf is a good alternative if you want cleaner upscale city energy.",
      "BayArena logistics are easier than many bigger Bundesliga grounds.",
      "This trip improves massively when you stop forcing Leverkusen to be more than it is.",
    ],

    food: [
      "Regional pub food",
      "Cologne Kölsch halls",
      "Düsseldorf Altbier pubs",
      "Simple matchday food in Leverkusen",
      "Stronger dinners in your base city",
    ],

    transport:
      "The Rhine region is made for rail-based football travel. Regional trains between Cologne, Düsseldorf and Leverkusen are frequent, so the key is choosing the right base and not overcomplicating the movement.",

    accommodation:
      "Cologne is usually the strongest answer. Düsseldorf is the slicker alternative. Stay in Leverkusen only if maximum matchday simplicity matters more than wider trip quality.",
  },

  monchengladbach: {
    cityId: "monchengladbach",
    name: "Mönchengladbach",
    country: "Germany",

    overview:
      "Mönchengladbach is a football-first stop. The city itself is functional rather than destination-led, but Borussia give it real value. This is the kind of trip that works best when you’re honest about it: strong stadium, strong club, and often better as part of a wider western Germany football weekend.",

    topThings: [
      { title: "Borussia matchday", tip: "The main reason to come. Give it proper time and don’t treat it like a throw-in stop." },
      { title: "Borussia-Park tour", tip: "Worth doing if it fits the schedule." },
      { title: "Alter Markt / old-town bar area", tip: "Best place to anchor the local evening if staying over." },
      { title: "Abteiberg Museum", tip: "A decent short culture block if you want more than football." },
      { title: "Bunter Garten", tip: "Useful calmer green-space reset." },
      { title: "Schloss Rheydt", tip: "Only if you actually have extra time and want one non-football historical stop." },
      { title: "Cologne add-on", tip: "A very sensible base choice if you want more city value." },
      { title: "Düsseldorf add-on", tip: "Often the smarter nightlife option." },
      { title: "Pre-match local pubs", tip: "Worth doing once because it helps the trip feel less generic." },
      { title: "Post-match regional travel plan", tip: "Know it before kickoff. Don’t improvise under crowd pressure." },
    ],

    tips: [
      "This is a football-led trip, not a blockbuster city break.",
      "Works very well inside a Rhine-Ruhr football route.",
      "Düsseldorf or Cologne may be the better sleep base.",
      "Gladbach itself is simplest if you want maximum matchday ease.",
      "Be honest about what the trip is and it works better.",
    ],

    food: [
      "Traditional German pub meals",
      "Pre-match beers and sausage",
      "Simple bar food in the old town",
      "Better higher-end dining in Düsseldorf / Cologne",
    ],

    transport:
      "Regional rail links are good, but the trip works best when you already know whether you’re sleeping local or returning to a stronger nearby city. Stadium access is straightforward if you plan it early.",

    accommodation:
      "Mönchengladbach centre is simplest. Düsseldorf is stronger for nightlife and overall trip quality. Cologne works too if you want to stack multiple football stops.",
  },

  wolfsburg: {
    cityId: "wolfsburg",
    name: "Wolfsburg",
    country: "Germany",

    overview:
      "Wolfsburg is a functional football stop, not a romantic city break. The city works because everything is easy, modern, and predictable, and because the football and Volkswagen identity are tightly linked. If you want charm, pick somewhere else. If you want a very efficient Bundesliga trip, Wolfsburg does the job well.",

    topThings: [
      { title: "Volkswagen Arena matchday", tip: "The football anchor and the obvious reason to come." },
      { title: "Autostadt", tip: "The strongest non-football reason to be here and worth doing properly." },
      { title: "Phaeno Science Center", tip: "A good add-on if you want one more structured attraction." },
      { title: "Allerpark lakeside area", tip: "Useful as a calmer walk-and-reset block." },
      { title: "Wolfsburg Castle", tip: "A decent historic counterpoint to the otherwise modern city." },
      { title: "Designer outlets", tip: "Only if you actually want shopping. Don’t pretend it’s culture." },
      { title: "Autostadt + matchday split", tip: "That’s the smartest one-day version of Wolfsburg." },
      { title: "Braunschweig add-on", tip: "A stronger nearby city if you want a bit more character." },
      { title: "One practical dinner", tip: "This city is about clean logistics, not food discovery." },
      { title: "No-fuss overnight", tip: "That is where Wolfsburg is strongest." },
    ],

    tips: [
      "Wolfsburg is efficient rather than atmospheric.",
      "Autostadt is the main non-football value driver.",
      "Good for a practical one-night football stop.",
      "Braunschweig is worth considering if you want more character.",
      "Stop expecting organic city-break magic here — it’s not that kind of place.",
    ],

    food: [
      "Modern casual dining",
      "German pub standards",
      "Simple pre-match meals",
      "Cafés near the centre / station",
    ],

    transport:
      "Wolfsburg is one of the easiest Bundesliga cities to handle because the station, city core and stadium logic are so straightforward. That simplicity is the main appeal.",

    accommodation:
      "Near the station or city centre is the cleanest choice. Braunschweig only makes sense if you want a stronger wider-city feel and don’t mind commuting.",
  },

  sinsheim: {
    cityId: "sinsheim",
    name: "Sinsheim",
    country: "Germany",

    overview:
      "Sinsheim is not a city-break heavyweight, but it works well as a football-and-attractions stop if you frame it correctly. Hoffenheim gives it Bundesliga relevance, and the museum/spa pairing makes it much better than a random small-town football pin. The smart play is often Heidelberg as the wider base.",

    topThings: [
      { title: "Hoffenheim matchday", tip: "The football reason to come, and the day’s anchor." },
      { title: "Auto & Technik Museum", tip: "A genuinely strong attraction and a big part of why this stop works." },
      { title: "Therme Sinsheim", tip: "A very good recovery-day or post-travel play if that’s your thing." },
      { title: "Simple town-centre loop", tip: "Enough to orient yourself. Don’t force it into more." },
      { title: "Heidelberg add-on", tip: "Usually the best move if you want the trip to feel richer than pure logistics." },
      { title: "Mannheim add-on", tip: "Good if you want a bigger city feel without going too far." },
      { title: "Museum + matchday split", tip: "That’s the cleanest way to structure a one-night trip." },
      { title: "Neckar countryside feel", tip: "Nice if weather behaves and you have margin." },
      { title: "Practical dinner plan", tip: "Food options get thin late, so stop winging it." },
      { title: "Post-match stay instead of instant escape", tip: "Often smarter if you want to avoid dead travel stress." },
    ],

    tips: [
      "This is football + attraction logic, not classic city-break logic.",
      "Heidelberg is often the better base.",
      "The museum is not filler — it’s one of the stop’s main strengths.",
      "Plan dinner and late transport properly.",
      "A smart practical trip if you use the surrounding region well.",
    ],

    food: [
      "German bakery breakfast",
      "Schnitzel",
      "Beer garden meals",
      "Practical local dining",
      "Stronger food in Heidelberg if basing there",
    ],

    transport:
      "Regional rail connections are fine, but the trip improves a lot when you decide up front whether you are doing Sinsheim local or Sinsheim from Heidelberg. Don’t leave that decision too late.",

    accommodation:
      "Sinsheim is fine for a simple football stop. Heidelberg is the stronger base if you want a better overall weekend and are happy to commute.",
  },

  heidenheim: {
    cityId: "heidenheim",
    name: "Heidenheim an der Brenz",
    country: "Germany",

    overview:
      "Heidenheim is a football-first small-city stop where the value comes from the club, the intimacy, and the fact it feels different from the giant Bundesliga names. You are not here for metropolitan energy. You are here for a proper local top-flight experience and, if you’re smart, a calmer countryside-tinged weekend around it.",

    topThings: [
      { title: "FC Heidenheim matchday", tip: "The reason the stop matters and the thing to build around properly." },
      { title: "Hellenstein Castle viewpoint", tip: "Best non-football payoff in the city and worth doing." },
      { title: "Small-city centre loop", tip: "Enough to get the feel without forcing a fake tourism agenda." },
      { title: "Swabian Jura edge / countryside block", tip: "A good add-on if you want the trip to feel fuller than just matchday." },
      { title: "Ulm add-on", tip: "Strongest nearby city if you want one broader non-football block." },
      { title: "Stuttgart add-on", tip: "More useful as a transport / bigger-city extension than a same-day rush." },
      { title: "Simple local dining", tip: "Heidenheim is best when you keep food plans straightforward." },
      { title: "Pre-match local rhythm", tip: "Smaller-city football stops reward arriving with time." },
      { title: "Slow morning coffee block", tip: "A good way to stop the whole trip feeling transactional." },
      { title: "One-night football logic", tip: "Usually exactly the right scale here." },
    ],

    tips: [
      "This is a smaller-scale football weekend. Embrace that.",
      "One scenic/non-football block improves the trip a lot.",
      "Book early — smaller cities have thinner hotel supply.",
      "Good for groundhoppers and people who actually like local football texture.",
      "Don’t compare it to Dortmund or Munich. Wrong lens entirely.",
    ],

    food: [
      "Hearty German meals",
      "Simple local pubs",
      "Pre-match town-centre food",
      "Bakery breakfasts",
    ],

    transport:
      "Heidenheim is easy enough once you’re there, but it rewards pre-planning because it is not a major hub. Build in buffer and keep the trip simple.",

    accommodation:
      "Stay centrally for a football-first stop. Slightly out of town works if you want a quieter countryside feel, but central is simpler for a short weekend.",
  },
};

export default bundesligaCityGuides;
