// src/data/cityGuides/bundesliga.ts
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
  stuttgart:
    "https://www.getyourguide.com/en-gb/stuttgart-l27/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const bundesligaCityGuides: Record<string, CityGuide> = {
  munich: {
    cityId: "munich",
    name: "Munich",
    country: "Germany",
    thingsToDoUrl: GYG.munich,

    overview:
      "Munich is one of Europe’s cleanest football-city weekend combinations because it gives you elite football, a beautiful historic centre, major museums, beer-hall culture, and transport that makes the whole trip feel frictionless. Bayern Munich matchdays add scale and event feel, but the city is strong enough that the football never has to carry the weekend alone. The right Munich trip is simple: stay central, split the city into clean day-blocks, and treat Allianz Arena as one major event inside a wider high-quality break rather than the whole reason you came.",

    topThings: [
      {
        title: "Marienplatz and Old Town loop",
        tip: "Best first block in the city. Do Marienplatz, Frauenkirche, Viktualienmarkt and the surrounding lanes in one walk instead of wasting time zig-zagging.",
      },
      {
        title: "Viktualienmarkt",
        tip: "Ideal for a football-weekend lunch because you can eat quickly without sinking half the day into a formal sit-down meal.",
      },
      {
        title: "English Garden",
        tip: "One of the easiest high-value resets in the city. Good for a slower morning or a pre-dinner walk.",
      },
      {
        title: "Nymphenburg Palace",
        tip: "Worth doing properly if you have the time, but do not cram it into the same day as a tightly timed evening match.",
      },
      {
        title: "BMW Welt and Museum",
        tip: "Excellent if you want one big non-football block. Better as a focused half-day than as a rushed add-on.",
      },
      {
        title: "Olympiapark",
        tip: "Good skyline and open-space option if you want something lower-pressure than museums and palace interiors.",
      },
      {
        title: "Beer hall night",
        tip: "Pick one strong beer hall and do it well. Trying to collect three in one evening is tourist-brain nonsense.",
      },
      {
        title: "Day trip to Dachau Memorial",
        tip: "Serious and worthwhile, but only do it if you actually want the depth. It changes the tone of the day completely.",
      },
      {
        title: "Lake day trip (Tegernsee or Starnberger See)",
        tip: "Only if you have an extra day. Great upgrade if you want football plus Bavaria rather than football plus urban overkill.",
      },
      {
        title: "Bayern Munich matchday",
        tip: "Use central Munich as your base, then travel out properly. Arrive early and treat the Allianz Arena exterior and approach as part of the event.",
      },
    ],

    tips: [
      "Munich centre is very walkable, but the U-Bahn saves serious time if you stop pretending every detour is scenic.",
      "Book accommodation early on Bayern home weekends because prices move quickly.",
      "Stay central rather than near the stadium. There is no upside in sleeping out there.",
      "Beer halls are communal by default. Shared tables are normal, not a problem.",
      "Sunday closures still catch lazy planners out, so buy essentials beforehand.",
    ],

    food: [
      "Weisswurst breakfast",
      "Roast pork with dumplings",
      "Pretzels and Obatzda",
      "Schnitzel",
      "Beer-hall classics",
    ],

    transport:
      "Munich is one of the easiest big-city systems in Europe to use well. U-Bahn, S-Bahn, trams and buses all work cleanly, and Allianz Arena access via the U6 is simple if you leave proper time.",

    accommodation:
      "Altstadt / Marienplatz is the best classic base. Hauptbahnhof is stronger for pure practicality. Schwabing works well if you want more bars, cafés and a slightly less tourist-heavy feel.",
  },

  dortmund: {
    cityId: "dortmund",
    name: "Dortmund",
    country: "Germany",

    overview:
      "Dortmund is one of the clearest football-first cities in Europe. You are not coming for polished grand-tour sightseeing. You are coming for Borussia Dortmund, Signal Iduna Park, and a matchday atmosphere that can justify the whole trip on its own. The city outside football is functional rather than beautiful, but that does not matter much because the football payoff is massive. This is a trip that works when you lean into football, beer, and simple pre- and post-match structure rather than pretending Dortmund needs to compete with Berlin or Munich on culture-weekend terms.",

    topThings: [
      {
        title: "Signal Iduna Park stadium tour",
        tip: "Best done the day before the match, not on it. Matchday should stay focused on atmosphere, not admin.",
      },
      {
        title: "German Football Museum",
        tip: "One of the strongest football-adjacent attractions in Germany and an easy high-value stop by the station.",
      },
      {
        title: "Alter Markt",
        tip: "Good central pub and beer anchor rather than a major attraction in itself.",
      },
      {
        title: "Westfalenpark",
        tip: "Useful if you want one calmer daylight block to stop the trip becoming 100 percent concrete and lager.",
      },
      {
        title: "Phoenix See",
        tip: "Better as a relaxed side block than as a headline destination.",
      },
      {
        title: "Local brewery stop",
        tip: "Worth doing because Dortmund still has proper brewing identity, but keep it simple and local.",
      },
      {
        title: "Fan-walk atmosphere",
        tip: "If you want the full Dortmund feel, do not teleport to the stadium late. Walk with the crowd and let the build-up happen.",
      },
      {
        title: "Signal Iduna Park matchday",
        tip: "This is the reason the city matters. Arrive early enough that the approach, exterior and rising crowd noise all register properly.",
      },
      {
        title: "Post-match beer near the ground",
        tip: "One of the smartest moves here because it lets you avoid the worst transport crush and extends the atmosphere.",
      },
      {
        title: "One simple central evening",
        tip: "Dortmund does not need over-designed nightlife plans. A few good pubs and a good match is enough.",
      },
    ],

    tips: [
      "Do not judge Dortmund like a classic city-break destination. Judge it by football quality and trip efficiency.",
      "Hotels near the station move fast on big fixtures, so book early.",
      "Stadium transport works, but the better experience is often walking in with supporters.",
      "One non-football block is enough. More than that and you are forcing the city.",
      "This is one of the few trips where football can genuinely carry the whole weekend.",
    ],

    food: [
      "Currywurst",
      "Bratwurst",
      "Schnitzel",
      "German pub food",
      "Local lager",
    ],

    transport:
      "Regional trains and local transit are easy enough, and the stadium is reachable by rail or on foot from the centre. The bigger issue is crowd volume, not system quality.",

    accommodation:
      "Stay in the city centre or near Hauptbahnhof for the cleanest short-break plan. Keep it simple.",
  },

  sinsheim: {
    cityId: "sinsheim",
    name: "Sinsheim",
    country: "Germany",

    overview:
      "Sinsheim is not a classic city break and pretending it is would be bullshit. It works as a football-focused stop because Hoffenheim give it Bundesliga relevance and because the Technik Museum and Therme Sinsheim make the surrounding trip more useful than the town itself would otherwise be. This is a smart logistics destination, not a romantic one. The right move is usually to pair it with Heidelberg or Mannheim if you want a fuller weekend, or keep it brutally simple and use it as a football-plus-one-attraction stop.",

    topThings: [
      {
        title: "Hoffenheim matchday",
        tip: "The main football reason to come. Keep the day focused and efficient.",
      },
      {
        title: "Technik Museum Sinsheim",
        tip: "The strongest non-football reason to be here and genuinely worth serious time.",
      },
      {
        title: "Therme Sinsheim",
        tip: "A very good recovery-day or pre-travel block if you are staying overnight.",
      },
      {
        title: "Simple town-centre stroll",
        tip: "Enough to orient yourself, not enough to build a fake sightseeing day around.",
      },
      {
        title: "Day trip to Heidelberg",
        tip: "The obvious quality upgrade if you want beauty, old-town atmosphere and better food options.",
      },
      {
        title: "Day trip to Mannheim",
        tip: "Useful if you want a bigger city and more nightlife without much effort.",
      },
      {
        title: "Countryside add-on",
        tip: "Only if weather is good and you genuinely want a quieter scenic block.",
      },
      {
        title: "Pre-match local beer",
        tip: "Fine, but do not expect giant-city density or variety.",
      },
      {
        title: "Stadium shop visit",
        tip: "Easy and low-friction if you want merch without the chaos of bigger clubs.",
      },
      {
        title: "Post-match museum or spa logic",
        tip: "A smart way to stop the trip ending in a rushed station-platform anticlimax.",
      },
    ],

    tips: [
      "Treat Sinsheim as football plus attraction hub, not a broad sightseeing city.",
      "If you want a richer overnight base, Heidelberg is usually the better answer.",
      "Food options thin out late, so stop assuming you can improvise dinner.",
      "This is a clean, practical trip. Lean into that rather than fighting it.",
      "Good for efficient travel, weaker for atmosphere outside matchday.",
    ],

    food: [
      "German bakery breakfast",
      "Schnitzel",
      "Bratwurst",
      "Beer-hall basics",
    ],

    transport:
      "Regional rail links are the key. Once you understand that Sinsheim is a branch trip rather than a major hub, the travel side becomes easy.",

    accommodation:
      "Stay near the station or stadium for simplicity, or use Heidelberg if you want a much stronger overall city-break base.",
  },

  leipzig: {
    cityId: "leipzig",
    name: "Leipzig",
    country: "Germany",
    thingsToDoUrl: GYG.leipzig,

    overview:
      "Leipzig is one of Germany’s strongest modern football-city weekends because it combines a compact centre, strong food and bar options, a clear city identity, and a football product that is easy to integrate into the trip. It does not rely on one huge landmark. It works because the whole city is manageable, lively and coherent. For YourNextAway purposes, Leipzig is elite because it behaves well as a football-first trip without becoming one-dimensional. You can do architecture, cafés, bars, galleries and the match without ever feeling like you are spending the weekend in transit.",

    topThings: [
      {
        title: "Old Town loop",
        tip: "Best first-day move because it gives you the city shape quickly and efficiently.",
      },
      {
        title: "Arcades and passages",
        tip: "One of Leipzig’s best little differentiators. Great in bad weather and good for a slower central block.",
      },
      {
        title: "Thomaskirche and Bach footprint",
        tip: "Worth doing properly if you want one real cultural anchor rather than surface-level sightseeing.",
      },
      {
        title: "Monument to the Battle of the Nations",
        tip: "Big visual payoff, but only worth it if you give it real time instead of cramming it into a packed matchday.",
      },
      {
        title: "Spinnerei",
        tip: "A good call if you want Leipzig’s creative side, but check opening times and do not build the day on assumptions.",
      },
      {
        title: "Plagwitz and canal walk",
        tip: "One of the best evening zones if you want the trip to feel modern, local and less obvious than the centre.",
      },
      {
        title: "Red Bull Arena matchday",
        tip: "Very easy to do logistically, which is one of Leipzig’s biggest strengths as a football weekend.",
      },
      {
        title: "Zoo or family block",
        tip: "Only if you genuinely have the time. Do not let it crowd out the city and football core.",
      },
      {
        title: "Augustusplatz",
        tip: "Good central connective stop, not a whole plan in itself.",
      },
      {
        title: "One strong dinner booking",
        tip: "Leipzig is good enough that lazy walk-in decisions are unnecessary and usually worse.",
      },
    ],

    tips: [
      "Leipzig works best when split into two clean loops: centre and Plagwitz/outer culture.",
      "Stay central rather than near the stadium. There is zero reason to sacrifice the city.",
      "Walk as much as possible because the centre rewards it.",
      "Book food properly on weekends; the city is popular and good places fill fast.",
      "A football weekend here should feel modern and easy, not overly curated.",
    ],

    food: [
      "Coffee and pastries in the centre",
      "German pub food",
      "Modern bistro dining",
      "Beer gardens in season",
    ],

    transport:
      "Leipzig is very easy: strong trams, strong station, and a centre compact enough that walking beats overthinking.",

    accommodation:
      "Stay in the Innenstadt for the cleanest overall trip. Plagwitz works if you want more local creative energy.",
  },

  stuttgart: {
    cityId: "stuttgart",
    name: "Stuttgart",
    country: "Germany",
    thingsToDoUrl: GYG.stuttgart,

    overview:
      "Stuttgart is one of the better Bundesliga city-break combinations for travellers who want football plus quality rather than football plus chaos. VfB Stuttgart give you a proper major-club matchday, while the city itself adds two world-class automotive museums, strong food, local wine culture and an efficient transport network. It is not as instantly charming as Munich or as obviously wild as Hamburg, but it is a very strong all-rounder. The trip works best when you plan it as centre plus one major attraction plus matchday, rather than trying to collect everything in one rushed weekend.",

    topThings: [
      {
        title: "Mercedes-Benz Museum",
        tip: "One of the strongest single attractions in the whole league set. Give it real time.",
      },
      {
        title: "Porsche Museum",
        tip: "Strong second museum option, but split it from Mercedes unless you enjoy total museum overload.",
      },
      {
        title: "Schlossplatz and city-centre loop",
        tip: "Best central orientation block and a good first-day move.",
      },
      {
        title: "TV Tower",
        tip: "Good only if weather is clear. Treat it as flexible, not mandatory.",
      },
      {
        title: "Wine walk or wine tavern evening",
        tip: "This is one of Stuttgart’s better differentiators, so use it instead of defaulting to generic bars.",
      },
      {
        title: "Wilhelma",
        tip: "Worth it if you have spare time, but do not pretend it belongs in a tight one-night football trip.",
      },
      {
        title: "Killesberg Park",
        tip: "Good calmer block if you want green space without leaving the city.",
      },
      {
        title: "VfB Stuttgart matchday",
        tip: "Neckarpark is easy to do, but still plan your entry and exit rather than improvising like an idiot.",
      },
      {
        title: "Festival grounds if dates align",
        tip: "Can massively improve the trip if your weekend happens to land right.",
      },
      {
        title: "One strong Swabian meal",
        tip: "Do it properly. Stuttgart is good enough that a lazy chain dinner is a waste.",
      },
    ],

    tips: [
      "Plan the city in blocks because Stuttgart is hillier and more spread than people assume.",
      "If doing both big car museums, split them or you will blunt both.",
      "Stay central unless stadium proximity is your only concern.",
      "Local wine is part of the city identity, so use it.",
      "This is a quality trip, not a frantic one.",
    ],

    food: [
      "Maultaschen",
      "Spätzle",
      "Swabian comfort food",
      "Local wine taverns",
    ],

    transport:
      "Excellent U-Bahn and S-Bahn coverage, plus strong airport links. Matchday travel is easy if you leave enough margin.",

    accommodation:
      "Stuttgart-Mitte is the best overall base. Hauptbahnhof works for practicality. Only stay near Neckarpark if logistics matter more than city quality.",
  },

  leverkusen: {
    cityId: "leverkusen",
    name: "Leverkusen",
    country: "Germany",

    overview:
      "Leverkusen is one of the clearest examples of a city you should not treat as a standalone glamour break. The football is high level, BayArena is excellent, and the real trip value comes from using Cologne or Düsseldorf as your base and treating Leverkusen as the matchday centrepiece. That is the smart move. Try to force Leverkusen into carrying the whole weekend and the trip gets thinner fast. Use it as part of a wider Rhine-Ruhr football plan and it becomes genuinely strong.",

    topThings: [
      {
        title: "BayArena matchday",
        tip: "This is the main event and the whole reason the stop belongs in the app.",
      },
      {
        title: "Cologne-based trip strategy",
        tip: "Usually the smartest answer if you want the best overall weekend quality.",
      },
      {
        title: "Düsseldorf-based alternative",
        tip: "A stronger option if you want a slicker, more nightlife-heavy base.",
      },
      {
        title: "Japanischer Garten",
        tip: "Pleasant low-effort local block if you are actually spending time in Leverkusen itself.",
      },
      {
        title: "Rhine-side walk",
        tip: "Good as a calmer football-day reset rather than a major sightseeing plan.",
      },
      {
        title: "Cologne Cathedral add-on",
        tip: "Obvious and worth it if Cologne is your base.",
      },
      {
        title: "Altstadt evening in Cologne or Düsseldorf",
        tip: "This is how you upgrade the trip from efficient to genuinely good.",
      },
      {
        title: "Kölsch versus Altbier choice",
        tip: "Tiny detail, but it makes the weekend feel deliberate rather than generic.",
      },
      {
        title: "Pre-match proper meal outside Leverkusen",
        tip: "Leverkusen is not where you chase standout dining if you have Cologne or Düsseldorf available.",
      },
      {
        title: "Post-match decompression",
        tip: "Far better than sprinting for crowded trains and ending the day annoyed.",
      },
    ],

    tips: [
      "Base in Cologne or Düsseldorf unless simplicity matters more than everything else.",
      "BayArena is compact and strong, so the football payoff is real.",
      "This is a smart logistics trip, not a romantic city break.",
      "If doing multiple Ruhr/Rhine matches, Leverkusen fits perfectly.",
      "Do not oversell the city. Oversell the regional weekend instead.",
    ],

    food: [
      "Cologne pub meals",
      "Düsseldorf bars and Japanese food scene",
      "Simple matchday food",
      "German bakery breakfast",
    ],

    transport:
      "Rail does the work here. Cologne, Düsseldorf and Leverkusen connect cleanly, which is the whole point of the trip logic.",

    accommodation:
      "Stay in Cologne or Düsseldorf for the best overall experience. Leverkusen only wins if you want maximum simplicity and a quieter stay.",
  },

  freiburg: {
    cityId: "freiburg",
    name: "Freiburg im Breisgau",
    country: "Germany",

    overview:
      "Freiburg is one of the best smaller Bundesliga weekend cities because it gives you a beautiful old town, a genuinely good football stop, and access to Black Forest scenery without making the trip feel complicated. It is relaxed, compact and very easy to like. This is not a maximalist city. That is exactly why it works. If you want football plus a slower, cleaner, more scenic break than the industrial heavyweights, Freiburg is one of the smartest picks in the whole German set.",

    topThings: [
      {
        title: "Old Town walk",
        tip: "The centre is compact enough that slow wandering beats overplanning every time.",
      },
      {
        title: "Freiburg Minster",
        tip: "Worth doing properly because it gives the city immediate weight and shape.",
      },
      {
        title: "Schlossberg viewpoint",
        tip: "One of the best payoff blocks in the city, especially late in the day.",
      },
      {
        title: "Augustiner Museum",
        tip: "Good if you want one cultural anchor without swallowing half the trip.",
      },
      {
        title: "Black Forest half-day",
        tip: "Excellent upgrade if you have the time, but do not wreck the football weekend by cramming too much.",
      },
      {
        title: "Vauban district",
        tip: "Useful if you want a more modern local contrast to the old centre.",
      },
      {
        title: "University quarter evening",
        tip: "Best if you want the city to feel alive without forcing a huge nightlife plan.",
      },
      {
        title: "SC Freiburg matchday",
        tip: "A strong community-feel Bundesliga stop that fits the city’s wider pace well.",
      },
      {
        title: "Wine tavern evening",
        tip: "A much better move here than trying to copy a beer-city template.",
      },
      {
        title: "Münsterplatz market",
        tip: "High-value daytime food stop if your timing works.",
      },
    ],

    tips: [
      "Freiburg improves when you slow down. Stop trying to turn it into Berlin.",
      "Stay central because the whole appeal is walkability and atmosphere.",
      "Book restaurants on match weekends because the city is small and good tables disappear quickly.",
      "Weather matters more here because outdoor walking is such a big part of the trip.",
      "One scenic block plus one football block is usually enough for a very strong day.",
    ],

    food: [
      "Flammkuchen",
      "Badischer dishes",
      "Local white wines",
      "Market food and cafés",
    ],

    transport:
      "Very walkable centre with good trams for the wider city. Matchday transport is straightforward and not overly stressful by Bundesliga standards.",

    accommodation:
      "Altstadt is the best overall stay. Near the main station works if you want easier rail handling without losing much quality.",
  },

  frankfurt: {
    cityId: "frankfurt",
    name: "Frankfurt",
    country: "Germany",
    thingsToDoUrl: GYG.frankfurt,

    overview:
      "Frankfurt is one of Germany’s most useful football cities because it combines major-hub convenience with an excellent football culture and enough city depth to support a full weekend. Eintracht Frankfurt give the trip real atmosphere and edge, while the city adds skyline views, a reconstructed old centre, strong food options and easy Rhine-region branching. It is also one of the easiest places to build a short trip around because the airport, city and stadium all link cleanly. For football travellers, that matters more than postcard perfection.",

    topThings: [
      {
        title: "Römerberg and Old Town",
        tip: "Best starting block because it gives you immediate city shape without much effort.",
      },
      {
        title: "Main Tower",
        tip: "Strong skyline play if weather is good. Better late afternoon than dead midday.",
      },
      {
        title: "Main river promenade",
        tip: "Simple, low-effort, high-value city block.",
      },
      {
        title: "Museumsufer",
        tip: "Pick one museum. Trying to do several is just bad pacing.",
      },
      {
        title: "Sachsenhausen apple-wine evening",
        tip: "One of the better ways to make Frankfurt feel like Frankfurt rather than just another station city.",
      },
      {
        title: "Eintracht Frankfurt matchday",
        tip: "One of Germany’s stronger atmosphere trips, so respect the build-up and do not arrive late.",
      },
      {
        title: "Mainz or Wiesbaden day trip",
        tip: "Very good add-on if you have another day and want Rhine-city contrast.",
      },
      {
        title: "Skyline Plaza alternative viewpoint",
        tip: "Useful if you do not care enough to pay for the tower.",
      },
      {
        title: "Palmengarten",
        tip: "Good quieter block if you want green space and lower intensity.",
      },
      {
        title: "One proper dinner booking",
        tip: "Frankfurt is strong enough that lazy evening planning is unnecessary.",
      },
    ],

    tips: [
      "Do not judge Frankfurt by the station district alone. That is amateur-hour thinking.",
      "This is a top short-break city because of airport and stadium convenience.",
      "Matchday transport is good, but crowds are still crowds, so leave margin.",
      "Sachsenhausen is one of the better evening bases.",
      "If flying in and out quickly, Frankfurt is one of the smartest football weekend picks in Europe.",
    ],

    food: [
      "Grüne Soße",
      "Frankfurter sausages",
      "Apfelwein",
      "Schnitzel",
      "Modern international dining",
    ],

    transport:
      "Excellent S-Bahn, U-Bahn and trams. Airport access is strong and stadium connections are easy on matchdays.",

    accommodation:
      "Innenstadt or Römerberg for sightseeing. Sachsenhausen for atmosphere. Avoid leaning too hard into the roughest station-area streets unless price is your only concern.",
  },

  berlin: {
    cityId: "berlin",
    name: "Berlin",
    country: "Germany",
    thingsToDoUrl: GYG.berlin,

    overview:
      "Berlin is not a city you ‘complete’ in one football weekend, so stop thinking like that. It works when you pick neighbourhoods, choose one or two serious cultural blocks, then build the football around that. For YourNextAway, Berlin is elite because it offers multiple club identities, world-class history, nightlife that actually matters, and enough scale that you can tailor the weekend around what you want. The trap is trying to see everything. The smart play is to choose your Berlin version and let the match anchor it.",

    topThings: [
      {
        title: "Brandenburg Gate and central core",
        tip: "Do this early when the city is calmer and the photos are cleaner.",
      },
      {
        title: "Reichstag dome",
        tip: "Book ahead or do not bother pretending it will just work.",
      },
      {
        title: "Berlin Wall Memorial",
        tip: "One of the strongest history stops in the city and worth actual time.",
      },
      {
        title: "East Side Gallery",
        tip: "Worth seeing, but do not let it eat half the day.",
      },
      {
        title: "Museum Island",
        tip: "Pick one museum and move on. Do not build a museum marathon.",
      },
      {
        title: "Kreuzberg and Neukölln food zones",
        tip: "Great for evenings that feel actually urban rather than over-touristed.",
      },
      {
        title: "Tempelhofer Feld",
        tip: "A good reset block if the trip needs air and space.",
      },
      {
        title: "Hertha BSC matchday",
        tip: "The big-stadium version of Berlin football and worth it for scale and history.",
      },
      {
        title: "Union Berlin matchday",
        tip: "One of the strongest atmosphere experiences in Europe if you can get it right.",
      },
      {
        title: "Prenzlauer Berg calmer evening",
        tip: "Better if you want Berlin without going full nightlife chaos.",
      },
    ],

    tips: [
      "Plan by neighbourhood. Anyone who plans Berlin as one giant loop is wasting time.",
      "Book key attractions in advance.",
      "Union needs careful planning because demand and logistics are tighter.",
      "Nightlife starts late, so do not schedule yourself like a countryside B&B guest.",
      "Berlin is best when you accept that one weekend only gives you one slice.",
    ],

    food: [
      "Currywurst",
      "Döner",
      "International street food",
      "Modern German dining",
    ],

    transport:
      "Outstanding U-Bahn, S-Bahn, trams and buses. The city is huge, but the network is good enough that you should never need to rely on taxis.",

    accommodation:
      "Mitte for first-time practicality, Friedrichshain or Kreuzberg for more nightlife, Prenzlauer Berg for a calmer stay.",
  },

  cologne: {
    cityId: "cologne",
    name: "Cologne",
    country: "Germany",
    thingsToDoUrl: GYG.cologne,

    overview:
      "Cologne is one of Germany’s best football weekends because it feels social, loud, relaxed and easy. The cathedral gives it instant visual identity, the old town and Rhinefront make it easy to wander, and 1. FC Köln add one of the country’s strongest local supporter cultures. This is not a city that needs over-curating. It works because you can walk, drink Kölsch, eat well enough, and let matchday merge naturally into the rest of the weekend.",

    topThings: [
      {
        title: "Cathedral",
        tip: "Obvious and worth it. Do not skip the one thing the city is actually famous for.",
      },
      {
        title: "Altstadt and Rhine walk",
        tip: "Best core city block and the easiest way to make the trip feel like Cologne quickly.",
      },
      {
        title: "Hohenzollern Bridge",
        tip: "Fast, easy, good visual stop. Do it as part of a wider river loop, not a standalone mission.",
      },
      {
        title: "Belgian Quarter",
        tip: "Best area for better bars, shops and evening energy beyond the obvious tourist zone.",
      },
      {
        title: "Chocolate Museum",
        tip: "Fine if you want an easy indoor block, but not essential unless it actually appeals.",
      },
      {
        title: "Museum Ludwig",
        tip: "Good pick if you want one proper art stop.",
      },
      {
        title: "1. FC Köln matchday",
        tip: "One of the strongest crowd-led football experiences in Germany if you actually give yourself time to do it properly.",
      },
      {
        title: "Kölsch beer hall session",
        tip: "Do it the local way and stop overcomplicating it.",
      },
      {
        title: "Short Rhine cruise",
        tip: "Useful relaxed add-on if weather is good and you have time.",
      },
      {
        title: "Day trip to Bonn or Düsseldorf",
        tip: "Easy enough, but Cologne is strong enough to carry its own full weekend.",
      },
    ],

    tips: [
      "Cologne is casual, social and easy. Dress for comfort, not theatre.",
      "Stay central because the city works best on foot plus tram.",
      "Book big-match weekends early.",
      "Kölsch is part of the trip, not just a drink choice.",
      "Excellent city for bar-hopping without needing a rigid plan.",
    ],

    food: [
      "Kölsch beer",
      "Schnitzel",
      "Bratwurst",
      "Hearty pub food",
    ],

    transport:
      "Strong trams and U-Bahn with easy stadium access. Cologne is one of the easier big football weekends to navigate well.",

    accommodation:
      "Altstadt and Belgisches Viertel are the strongest bases. Ehrenfeld works for nightlife and value.",
  },

  monchengladbach: {
    cityId: "monchengladbach",
    name: "Mönchengladbach",
    country: "Germany",

    overview:
      "Mönchengladbach is a football-first destination and should be sold honestly as that. It is not a giant sightseeing city. It matters because Borussia Mönchengladbach matter, because Borussia-Park is a serious Bundesliga stop, and because the wider Rhine-Ruhr region makes it easy to fold into a broader football route. If you want a fuller lifestyle weekend, use Düsseldorf or Cologne as the base. If you want straightforward football focus, stay locally and keep it simple.",

    topThings: [
      {
        title: "Borussia-Park stadium tour",
        tip: "Worth doing if available because the club history carries more weight than the city itself.",
      },
      {
        title: "Borussia Mönchengladbach matchday",
        tip: "The reason the stop belongs in the route.",
      },
      {
        title: "Abteiberg Museum",
        tip: "A decent culture filler if you want one non-football block.",
      },
      {
        title: "Bunter Garten",
        tip: "Useful green-space reset, not a major attraction.",
      },
      {
        title: "Alter Markt and evening strip",
        tip: "Best local nightlife pocket if staying overnight.",
      },
      {
        title: "Schloss Rheydt",
        tip: "Good if you want a short local-history contrast to the football focus.",
      },
      {
        title: "Cologne day-trip option",
        tip: "Often a better wider base if you want more city around the football.",
      },
      {
        title: "Düsseldorf day-trip option",
        tip: "Good if you want better nightlife and an easier premium-feel stay.",
      },
      {
        title: "Pre-match supporter pubs",
        tip: "Better than hiding in a hotel bar pretending the football starts at kickoff.",
      },
      {
        title: "Simple football-led overnight",
        tip: "This is the right mindset here.",
      },
    ],

    tips: [
      "This is a football-driven trip, not a sightseeing one.",
      "Use Düsseldorf or Cologne if you want to upgrade the broader weekend.",
      "Stay local if the match is the main point and nothing else matters.",
      "Good for regional football routing.",
      "Do not overstate the city. Overstate the football logic.",
    ],

    food: [
      "German pub plates",
      "Schnitzel",
      "Bratwurst",
      "Local beers",
    ],

    transport:
      "Regional rail makes the city easy enough to integrate into wider travel. Matchday buses and shuttles do the rest.",

    accommodation:
      "Stay in Mönchengladbach for simple football focus. Stay in Düsseldorf or Cologne for better all-round trip quality.",
  },

  wolfsburg: {
    cityId: "wolfsburg",
    name: "Wolfsburg",
    country: "Germany",

    overview:
      "Wolfsburg is one of the easiest cities in the league to understand: it is modern, corporate, efficient and football-relevant because of VfL Wolfsburg and the Volkswagen ecosystem around it. This is not a romance trip. It is a clean, functional football stop with an obvious automotive side. If that sounds dull, fine — then do not go. If that sounds useful, it works well because the city is easy, the stadium is easy, and Autostadt gives the weekend enough substance to justify the stop.",

    topThings: [
      {
        title: "Autostadt",
        tip: "The strongest non-football attraction by miles and the clear thing to pair with matchday.",
      },
      {
        title: "Volkswagen Arena matchday",
        tip: "Very easy to do because the city and complex were basically built for organised movement.",
      },
      {
        title: "Phaeno",
        tip: "Good if you want one extra modern indoor block.",
      },
      {
        title: "Allerpark",
        tip: "Useful if you want open space and a calmer hour.",
      },
      {
        title: "Wolfsburg Castle",
        tip: "Short local-history contrast if you want to avoid making the whole weekend pure automotive branding.",
      },
      {
        title: "Designer outlets",
        tip: "Only if it genuinely helps the trip. Do not waste football-weekend time fake-shopping.",
      },
      {
        title: "Simple city-centre loop",
        tip: "Enough to orient yourself, not enough to build your ego around.",
      },
      {
        title: "Braunschweig add-on",
        tip: "The better option if you want a more traditional city layer around the trip.",
      },
      {
        title: "Pre-match local food",
        tip: "Keep it practical. This is not a gourmet pilgrimage.",
      },
      {
        title: "One efficient overnight",
        tip: "That is where Wolfsburg usually makes the most sense.",
      },
    ],

    tips: [
      "Wolfsburg is efficient rather than atmospheric. Accept that and it works better.",
      "Autostadt plus football is the obvious pairing.",
      "If you want nightlife, use Braunschweig or Hannover instead.",
      "One night is often enough.",
      "Good for practical routing, weaker for romance.",
    ],

    food: [
      "Casual modern German dining",
      "Bakeries and cafés",
      "Simple pre-match meals",
      "International chains if needed",
    ],

    transport:
      "Excellent rail simplicity and easy stadium access from the station. One of the least stressful matchday transport setups in the league.",

    accommodation:
      "Stay near the station or central area for maximum efficiency. Use Braunschweig if you want more city character.",
  },

  augsburg: {
    cityId: "augsburg",
    name: "Augsburg",
    country: "Germany",

    overview:
      "Augsburg is one of the better value Bundesliga city trips because it gives you a genuinely attractive historic centre, enough food and beer culture for a proper weekend, and a football stop that fits neatly into the city rather than dominating it. It is calmer and cheaper than Munich, but not dead. That is the sweet spot. The city works best as a relaxed football break where you walk, eat, do one or two historic blocks, then head to the stadium without trying to force a giant itinerary.",

    topThings: [
      {
        title: "Fuggerei",
        tip: "A genuinely distinctive stop and one of the best reasons the city is more than just a match location.",
      },
      {
        title: "Rathausplatz and Old Town loop",
        tip: "Best central orientation move and enough to make the city land quickly.",
      },
      {
        title: "Town Hall and Golden Hall",
        tip: "Worth it if open. Better than it sounds.",
      },
      {
        title: "Lechviertel canals walk",
        tip: "One of the city’s best atmosphere blocks and good for slower pacing.",
      },
      {
        title: "Cathedral",
        tip: "Useful if you want one calmer historic stop without overcommitting.",
      },
      {
        title: "Schaezlerpalais",
        tip: "Good rainy-day or culture add-on if you want one more substantial non-football block.",
      },
      {
        title: "FC Augsburg matchday",
        tip: "The football is solid, but the trip works best when city and match feel balanced.",
      },
      {
        title: "Botanical Garden",
        tip: "Good in season, non-essential otherwise.",
      },
      {
        title: "Traditional beer hall evening",
        tip: "The obvious and correct move here.",
      },
      {
        title: "Munich day-trip option",
        tip: "Only if you really need the bigger-city hit. Augsburg can easily hold its own for a weekend.",
      },
    ],

    tips: [
      "Walk the city in loops rather than overusing transport.",
      "Augsburg is calmer than Munich. That is a benefit, not a flaw.",
      "Stay central, then tram out to the stadium.",
      "One slower evening and one football block is enough for a very good trip.",
      "Good value by southern Germany standards.",
    ],

    food: [
      "Bavarian-Swabian dishes",
      "Schnitzel",
      "Beer-hall meals",
      "Café stops around Rathausplatz",
    ],

    transport:
      "Compact centre plus useful trams. Matchday travel is easy enough if you do not leave everything too late.",

    accommodation:
      "Old Town / Rathausplatz is the strongest stay base. Tram-line value options just outside the core also work well.",
  },

  hamburg: {
    cityId: "hamburg",
    name: "Hamburg",
    country: "Germany",
    thingsToDoUrl: GYG.hamburg,

    overview:
      "Hamburg is one of Europe’s elite football-weekend cities because it gives you proper city scale, two distinct football identities, nightlife that actually matters, and a waterfront setting that makes the whole trip feel bigger than a basic stadium break. St. Pauli is culture-heavy and embedded in the city. HSV is bigger-club, bigger-stadium and more event-led. Both work because Hamburg itself is strong enough that the football plugs into a real weekend rather than carrying it alone.",

    topThings: [
      {
        title: "Harbour and Landungsbrücken walk",
        tip: "Best first-day move because it gives Hamburg’s identity to you immediately.",
      },
      {
        title: "Miniatur Wunderland",
        tip: "Book if possible. This gets too busy to just wing it comfortably.",
      },
      {
        title: "Speicherstadt and HafenCity",
        tip: "One of the best visual city blocks in Germany and worth doing slowly.",
      },
      {
        title: "Elbphilharmonie Plaza",
        tip: "High payoff if booked or timed well, annoying if you leave it to chance.",
      },
      {
        title: "Reeperbahn and St. Pauli district",
        tip: "Better when treated as an area to branch through than a single strip to tick off.",
      },
      {
        title: "St. Pauli daytime district walk",
        tip: "Do it in daylight too. Otherwise you only see half the place.",
      },
      {
        title: "St. Pauli matchday",
        tip: "One of Europe’s best football-culture experiences if you let the district and stadium merge properly.",
      },
      {
        title: "HSV matchday",
        tip: "A bigger, more classic giant-club day that needs slightly more logistics planning.",
      },
      {
        title: "Alster Lakes",
        tip: "Excellent calmer block to balance the port and nightlife intensity.",
      },
      {
        title: "Fish Market if timing works",
        tip: "Only if you genuinely want the chaos. This is not compulsory.",
      },
    ],

    tips: [
      "Pick your Hamburg base properly. St. Pauli and central are not interchangeable experiences.",
      "Nightlife runs late, so stop planning 8 a.m. hero starts if you know you are going out.",
      "For football weekends, the city is stronger when you treat the match as part of district life, not a detached event.",
      "Weather around the water changes quickly, so dress properly.",
      "One of the best all-round football weekends in Europe, full stop.",
    ],

    food: [
      "Fish sandwiches",
      "German pub food",
      "Late-night street food",
      "Neighbourhood café breakfasts",
    ],

    transport:
      "Strong U-Bahn and S-Bahn network. The city is big but easy if you base well and know your lines.",

    accommodation:
      "St. Pauli for maximum vibe, central near the station for practical movement, HafenCity for cleaner modern stays.",
  },

  bremen: {
    cityId: "bremen",
    name: "Bremen",
    country: "Germany",

    overview:
      "Bremen is one of the best smaller football weekends in Germany because it is compact, attractive and very easy to do well. The old town has enough charm to carry the non-football side, the river gives the city space and atmosphere, and Werder Bremen make the football feel tied to the place rather than detached from it. This is not a giant nightlife city, but it is an excellent football-plus-historic-centre weekend that does not waste your time.",

    topThings: [
      {
        title: "Marktplatz and Town Hall",
        tip: "The obvious centrepiece and worth doing properly because it gives the city instant visual value.",
      },
      {
        title: "Roland Statue",
        tip: "Fast central stop that naturally comes with the square.",
      },
      {
        title: "Schnoor Quarter",
        tip: "One of the most atmospheric small old-town quarters in the Bundesliga set. Walk it slowly.",
      },
      {
        title: "Böttcherstraße",
        tip: "Short, distinctive and easy to fold into the old-town route.",
      },
      {
        title: "Weser riverside walk",
        tip: "Important because it links the city and football feel together.",
      },
      {
        title: "Werder Bremen matchday",
        tip: "Approach on foot if you can. The riverside/stadium blend is part of the appeal.",
      },
      {
        title: "Bürgerpark",
        tip: "Good calmer block if you want green space without leaving the city rhythm entirely.",
      },
      {
        title: "Übersee-Museum",
        tip: "Solid rainy-day filler and enough substance for a short indoor block.",
      },
      {
        title: "Simple pub evening",
        tip: "Bremen works better when you keep it local and unforced.",
      },
      {
        title: "Hamburg day-trip option",
        tip: "Possible, but Bremen is strong enough that you do not need to flee to a bigger city to justify the weekend.",
      },
    ],

    tips: [
      "Bremen is compact, so walk more and plan less.",
      "The city plus stadium setting is the real value here.",
      "Good choice if you want a calmer German football weekend.",
      "One or two nights is enough for a very strong trip.",
      "Stay central and let the city work for you.",
    ],

    food: [
      "German pub dishes",
      "Local beers",
      "Café stops in the old town",
      "Simple riverside dining",
    ],

    transport:
      "Very manageable city with useful trams, but central walking covers most of what matters for a short football break.",

    accommodation:
      "Stay near the Old Town or central core for the best blend of charm and easy stadium access.",
  },

  mainz: {
    cityId: "mainz",
    name: "Mainz",
    country: "Germany",

    overview:
      "Mainz is one of the smartest football-weekend cities in Germany because it gives you a compact old town, Rhine atmosphere, wine culture and an easy matchday without the heaviness of a giant city. It is calmer than Frankfurt and more obviously pleasant to wander. For YourNextAway purposes, that makes it a very good football-first but still proper city-break stop. The key is not to overcomplicate it. Mainz works when you stay central, walk the old town, do one river block, one wine-led evening and the match.",

    topThings: [
      {
        title: "Old Town wander",
        tip: "The city is best done slowly and centrally, not as a checklist sprint.",
      },
      {
        title: "Mainz Cathedral",
        tip: "Good historic anchor and the obvious place to orient the trip.",
      },
      {
        title: "Rhine promenade",
        tip: "Simple, high-value city block and a good reset before or after football.",
      },
      {
        title: "Gutenberg angle",
        tip: "Worth using if available because it gives the city more substance than just squares and wine.",
      },
      {
        title: "Augustinerstraße area",
        tip: "One of the better atmospheric central lanes and a good food/drink zone.",
      },
      {
        title: "Wine tavern evening",
        tip: "This is one of Mainz’s biggest differentiators, so use it properly.",
      },
      {
        title: "Mainz 05 matchday",
        tip: "Approachable and low-stress by Bundesliga standards, which is part of the appeal.",
      },
      {
        title: "Rhine day trip",
        tip: "Excellent if you have another day and want more scenery without much complexity.",
      },
      {
        title: "Frankfurt add-on",
        tip: "Useful if you want big-city contrast, but Mainz itself is usually enough for a football weekend.",
      },
      {
        title: "Slow coffee-and-pastry morning",
        tip: "Exactly the kind of city where this improves the trip rather than wasting time.",
      },
    ],

    tips: [
      "Do not rush Mainz. That ruins the point of it.",
      "Stay around the old town or cathedral zone.",
      "Use wine culture as a real part of the trip, not a side note.",
      "Good value and very manageable for 24–48 hours.",
      "One of the better understated Bundesliga city weekends.",
    ],

    food: [
      "Wine-tavern meals",
      "Regional white wines",
      "German pub dishes",
      "Cafés and bakery breakfasts",
    ],

    transport:
      "Very walkable centre with easy local public transport and strong rail links into Frankfurt and the Rhine corridor.",

    accommodation:
      "Old Town is the strongest stay base. Just outside the core also works if you stay close to tram or bus links.",
  },

  heidenheim: {
    cityId: "heidenheim",
    name: "Heidenheim an der Brenz",
    country: "Germany",

    overview:
      "Heidenheim is a football-first trip with a countryside edge, not a classic city break. That is exactly why it can work. The club gives you a rarer Bundesliga stop, the setting gives you quieter regional Germany, and the smaller scale means lower stress, lower prices and a more local-feeling weekend. This is for people who actually like football travel, not just landmark collection. Pair it with one scenic block and one strong matchday and it becomes much better than people expect.",

    topThings: [
      {
        title: "Heidenheim matchday",
        tip: "The club is the point of the stop, so build the day around it properly.",
      },
      {
        title: "Schloss Hellenstein",
        tip: "Best local viewpoint and the one clear high-value non-football move.",
      },
      {
        title: "Central Heidenheim walk",
        tip: "Enough to get a feel for the place, not enough to justify inflated expectations.",
      },
      {
        title: "Scenic Swabian Jura block",
        tip: "A smart upgrade if you have a spare morning and want the trip to feel fuller.",
      },
      {
        title: "Ulm add-on",
        tip: "The better nearby city option if you want stronger architecture and atmosphere.",
      },
      {
        title: "Stuttgart add-on",
        tip: "Useful if transport runs that way and you want one bigger-city contrast day.",
      },
      {
        title: "Simple regional pub dinner",
        tip: "Keep this honest and local. That is the whole point.",
      },
      {
        title: "Pre-match and post-match pacing",
        tip: "Smaller-city football works best when you actually use the calmer pace instead of rushing anyway.",
      },
      {
        title: "One quiet morning reset",
        tip: "Important because this is more mini-break than mega-event.",
      },
      {
        title: "Regional identity angle",
        tip: "Good if you want the trip to feel meaningfully different from the bigger football cities.",
      },
    ],

    tips: [
      "Do not expect big-city sightseeing. That is not what this stop is for.",
      "One scenic block massively improves the weekend.",
      "Book early because accommodation supply is smaller.",
      "Good for committed football travellers and league-depth coverage.",
      "Better sold as football plus countryside than football plus city.",
    ],

    food: [
      "Hearty German staples",
      "Regional beer",
      "Simple pre-match meals",
      "Local pub dining",
    ],

    transport:
      "Planning matters more here because you are not in a giant hub. Once you accept that, the trip becomes easy enough.",

    accommodation:
      "Stay central for simplicity or slightly outside if you want more countryside feel. Pair with Ulm or Stuttgart only if that genuinely improves the route.",
  },
};

export default bundesligaCityGuides;
