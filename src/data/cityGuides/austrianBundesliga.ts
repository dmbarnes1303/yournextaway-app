import type { CityGuide } from "./types";

const GYG = {
  vienna:
    "https://www.getyourguide.com/en-gb/vienna-l7/?partner_id=MAQJREP&utm_medium=online_publisher",
  salzburg:
    "https://www.getyourguide.com/en-gb/salzburg-l4/?partner_id=MAQJREP&utm_medium=online_publisher",
  graz:
    "https://www.getyourguide.com/en-gb/graz-l32557/?partner_id=MAQJREP&utm_medium=online_publisher",
  linz:
    "https://www.getyourguide.com/en-gb/linz-l32583/?partner_id=MAQJREP&utm_medium=online_publisher",
  innsbruck:
    "https://www.getyourguide.com/en-gb/innsbruck-l164/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const austrianBundesligaCityGuides: Record<string, CityGuide> = {
  vienna: {
    cityId: "vienna",
    name: "Vienna",
    country: "Austria",
    bookingLinks: {
      thingsToDo: GYG.vienna,
    },
    thingsToDoUrl: GYG.vienna,
    overview:
      "Vienna is one of the best football-city weekends in Central Europe because the city itself is already elite before the football even starts. Grand architecture, café culture, efficient public transport and strong evening districts make it easy to build a proper weekend, while Rapid Vienna and Austria Vienna give you two different football versions of the same city. The key is simple: stay central, plan by district, and treat the match as one strong anchor inside a bigger Vienna trip rather than the only reason to leave the hotel.",

    topThings: [
      { title: "St. Stephen’s Cathedral", tip: "The obvious city-centre anchor and the easiest place to orient the weekend fast." },
      { title: "Schönbrunn Palace", tip: "Do it early if you want space; it gets slower and more crowded later." },
      { title: "Belvedere Palace", tip: "Best if you want art plus a more elegant, slightly calmer palace stop." },
      { title: "Naschmarkt", tip: "Good for casual food, but go with a plan rather than wandering hungry into tourist pricing." },
      { title: "Classic coffee house session", tip: "Vienna café culture is part of the trip, not an optional extra." },
      { title: "MuseumQuartier", tip: "Useful flexible block if weather turns or you want culture before dinner." },
      { title: "Prater and Giant Ferris Wheel", tip: "Better as an evening add-on than a whole-day commitment." },
      { title: "Danube Canal bars", tip: "One of the better warm-weather evening zones if you want a looser night." },
      { title: "Rapid Vienna matchday", tip: "Usually the stronger atmosphere and the more obvious football-first pick." },
      { title: "Austria Vienna matchday", tip: "A useful contrast: less raw than Rapid, but still a serious city-club stop." },
    ],

    tips: [
      "Innere Stadt, Neubau, Mariahilf, and areas around Karlsplatz are the cleanest bases.",
      "Rapid is generally the stronger atmosphere play; Austria Vienna is the secondary contrast option.",
      "The U-Bahn makes stadium travel straightforward, so do not stay near the grounds just for convenience.",
      "Vienna rewards a full weekend much more than a rushed one-night stop.",
      "Book dinners and smarter café stops ahead on busy weekends instead of pretending the city will organise itself for you.",
    ],

    food: [
      "Classic schnitzel houses",
      "Traditional coffee houses and pastries",
      "Naschmarkt casual food stalls",
      "Wine taverns and Austrian beer halls",
      "Modern bistros in Neubau and around the centre",
    ],

    transport:
      "Vienna’s public transport is one of the easiest systems in Europe to use properly. The U-Bahn, trams and buses cover the city cleanly, and matchday travel to both Rapid and Austria Vienna is simple if you stay central and leave enough time.",

    accommodation:
      "Innere Stadt is the obvious first-time base if you want the most classic Vienna version. Neubau and Mariahilf give you a livelier, slightly less formal stay with stronger evening options. Staying near Hauptbahnhof is practical for rail trips, but it is not the most atmospheric choice.",
  },

  salzburg: {
    cityId: "salzburg",
    name: "Salzburg",
    country: "Austria",
    bookingLinks: {
      thingsToDo: GYG.salzburg,
    },
    thingsToDoUrl: GYG.salzburg,
    overview:
      "Salzburg is one of Europe’s prettiest small football cities and one of the easiest places in this whole project to turn a match into a proper city break. The old town is visually ridiculous, the mountain backdrop does a lot of the work for you, and Red Bull Salzburg add a high-level football layer even if the stadium itself feels more modern than old-school. The smart move is staying near the centre, doing the obvious scenic blocks properly, and treating the football as part of a polished two-night trip rather than a rushed single-day mission.",

    topThings: [
      { title: "Salzburg Old Town", tip: "This is the city’s core asset, so actually give it time instead of speed-running it." },
      { title: "Hohensalzburg Fortress", tip: "One of the best payoff viewpoints in the league set if weather behaves." },
      { title: "Mirabell Gardens", tip: "A clean, easy central stop that works well before food or coffee." },
      { title: "Mozart Birthplace", tip: "Worth it if you care about the history; skip it if you are just box-ticking." },
      { title: "Getreidegasse", tip: "Best as a wander route rather than a serious shopping mission." },
      { title: "Salzburg Cathedral", tip: "Quick cultural anchor in the middle of the old city." },
      { title: "River Salzach walk", tip: "A low-effort scenic reset that makes the city land properly." },
      { title: "Kapuzinerberg or city viewpoint", tip: "Useful if you want one stronger panoramic block without overcomplicating the day." },
      { title: "Red Bull Salzburg matchday", tip: "Modern, professional, and usually the football standard-setter in Austria." },
      { title: "Day-trip Alpine add-on", tip: "Only do this if you actually have spare time; do not wreck the city weekend trying to cram everything in." },
    ],

    tips: [
      "Stay in or near the old town for the strongest overall weekend feel.",
      "The stadium sits away from the historic core, so keep the day centred in town and travel out later.",
      "Salzburg works best as a two-night city break, not a rushed hit-and-run.",
      "Peak summer and Christmas periods bring heavy visitor traffic, so book early and stop assuming flexibility will save you.",
      "One strong scenic morning and one strong football evening is usually enough to make the trip land properly.",
    ],

    food: [
      "Traditional Austrian restaurants",
      "Beer halls and brewery dining",
      "Coffee and pastry stops in the centre",
      "Salzburger Nockerl if you want the obvious local dessert",
      "Cleaner sit-down dinners around the old town",
    ],

    transport:
      "Salzburg is compact enough that much of the centre is walkable. Buses handle the airport and stadium movement well, and the whole trip becomes easy if you keep the old town as your anchor.",

    accommodation:
      "Altstadt is the strongest base if you want atmosphere, walkability and the classic Salzburg postcard version. Around the main station is more practical for rail links, but it is a downgrade in feel unless logistics are your only concern.",
  },

  graz: {
    cityId: "graz",
    name: "Graz",
    country: "Austria",
    bookingLinks: {
      thingsToDo: GYG.graz,
    },
    thingsToDoUrl: GYG.graz,
    overview:
      "Graz is one of the most underrated football cities in the whole app because it combines genuine city-break quality with one of Austria’s strongest football atmospheres. The old town is attractive without feeling overblown, the student presence keeps the city alive, and Sturm Graz give the football layer real edge. Grazer AK add the historic second-club contrast, but this is basically a Sturm city first if your priority is matchday intensity. Stay central, keep the plan walkable, and Graz becomes a very smart football weekend.",

    topThings: [
      { title: "Graz Old Town", tip: "A compact historic centre that is actually worth wandering rather than just photographing." },
      { title: "Schlossberg hill", tip: "Do this if visibility is good; the city reads much better from above." },
      { title: "Clock Tower", tip: "The obvious city symbol and a natural anchor point on the hill." },
      { title: "Mur river walk", tip: "Good low-effort route between daytime wandering and evening drinks." },
      { title: "Kunsthaus Graz", tip: "Useful contrast stop if you want something more modern than historic-centre Austria." },
      { title: "Farmer’s markets and central squares", tip: "Better for local rhythm than over-committing to formal sightseeing." },
      { title: "University district bars", tip: "One of the better evening zones if you want the city to feel young and alive." },
      { title: "Styrian wine bars", tip: "A smarter evening choice if you want local flavour without chain-bar nonsense." },
      { title: "Sturm Graz matchday", tip: "Usually the premium football experience here and one of the best in Austria." },
      { title: "Grazer AK matchday", tip: "More niche and secondary, but useful if you want the city’s wider football picture." },
    ],

    tips: [
      "If football atmosphere is the priority, Sturm is the clear first choice.",
      "Stay in the old town or near Jakominiplatz rather than near the stadium.",
      "Graz is compact enough that overplanning becomes stupid fast.",
      "This is one of the better balanced football-plus-city weekends in Austria.",
      "Give the city one proper evening; it improves the trip a lot.",
    ],

    food: [
      "Styrian regional dishes",
      "Wine taverns and small bars",
      "Casual student-area food",
      "Traditional Austrian restaurants",
      "Coffee and bakery stops in the centre",
    ],

    transport:
      "Graz trams and buses are simple, and the centre is highly walkable. The stadium is south of the old town but easy enough to reach if you keep the city centre as your base.",

    accommodation:
      "Old Town is the strongest overall visitor base. Around Jakominiplatz is also smart because it gives you transport convenience without losing access to the core city.",
  },

  linz: {
    cityId: "linz",
    name: "Linz",
    country: "Austria",
    bookingLinks: {
      thingsToDo: GYG.linz,
    },
    thingsToDoUrl: GYG.linz,
    overview:
      "Linz is a better football city than outsiders usually assume because the city is clean, manageable, and now has a stronger football identity through both LASK and Blau-Weiß Linz. It is not Vienna or Salzburg in sightseeing terms, so stop expecting that, but it works very well as a football-first weekend with enough modern culture, riverfront space and easy logistics to keep the trip worthwhile. LASK are the bigger football pull; Blau-Weiß Linz are the smaller-scale contrast inside the same city.",

    topThings: [
      { title: "Danube riverside walk", tip: "The easiest way to make the city feel open and readable quickly." },
      { title: "Linz Hauptplatz", tip: "The central anchor and a useful first orientation block." },
      { title: "Ars Electronica Center", tip: "One of the city’s strongest non-football reasons to be here." },
      { title: "Lentos Art Museum area", tip: "Good if you want a cleaner cultural block by the river." },
      { title: "Pöstlingberg", tip: "Worth it for the viewpoint if weather is on your side." },
      { title: "Old Town streets", tip: "A slower wander beats trying to ‘collect’ landmarks here." },
      { title: "LASK matchday", tip: "The main football event in the city and usually the better atmosphere play." },
      { title: "Blau-Weiß Linz matchday", tip: "Smaller and more local-feeling; useful as the alternative club experience." },
      { title: "Danube-side evening", tip: "One of the better ways to keep the trip alive after the football." },
      { title: "Central beer hall stop", tip: "Simple and effective; no need to overdesign the evening." },
    ],

    tips: [
      "LASK are the obvious first football pick if you only do one match.",
      "Stay centrally rather than near either ground.",
      "Linz works best as a clean one- or two-night football trip, not a huge cultural mission.",
      "The city is often underestimated, which is exactly why it can work so well.",
      "If you are routing between Vienna and Salzburg, Linz is an easy practical stop.",
    ],

    food: [
      "Traditional Austrian restaurants",
      "Beer halls",
      "Danube-adjacent dining",
      "Coffee and pastry stops",
      "Casual central bistro food",
    ],

    transport:
      "Linz has a simple tram system and strong rail links. The city centre should be your anchor, with onward movement to the stadiums kept basic and boring.",

    accommodation:
      "City-centre hotels are the correct choice almost every time. Near the station is practical for short stays, but the central core gives the trip more life.",
  },

  innsbruck: {
    cityId: "innsbruck",
    name: "Innsbruck",
    country: "Austria",
    bookingLinks: {
      thingsToDo: GYG.innsbruck,
    },
    thingsToDoUrl: GYG.innsbruck,
    overview:
      "Innsbruck is one of the most visually impressive football destinations in the whole project because the mountains completely change the feel of the trip. Even if the football layer were weaker, the city would still justify the weekend. WSG Tirol give it the football reason, but the real sell is Alpine scenery, a very workable centre, and the fact that the place feels genuinely different from standard league-city travel. The mistake would be treating Innsbruck like an ordinary match stop instead of using the setting properly.",

    topThings: [
      { title: "Old Town", tip: "Compact, attractive, and the right place to begin the trip properly." },
      { title: "Golden Roof", tip: "Quick iconic stop, not something to overinvest time in." },
      { title: "Nordkette cable car", tip: "One of the biggest scenery payoffs in the whole app if conditions are good." },
      { title: "Bergisel ski jump", tip: "A strong modern-landmark contrast to the old town." },
      { title: "River Inn walk", tip: "Simple central route that keeps the city feeling spacious and scenic." },
      { title: "Mountain-view coffee stop", tip: "The city rewards slowing down and actually looking around." },
      { title: "Tyrolean dining", tip: "Go for proper regional food rather than defaulting to generic centre options." },
      { title: "WSG Tirol matchday", tip: "The football stop works because the setting is so distinctive." },
      { title: "Alpine short trip or hike", tip: "Only if you have real time and the weather is with you." },
      { title: "Evening old-town reset", tip: "Strong final move because the centre looks good at night without much effort." },
    ],

    tips: [
      "This is one of the strongest football-plus-scenery trips in the whole Austria set.",
      "Stay in the old town or central Innsbruck rather than trying to optimise around the stadium.",
      "Weather and mountain conditions matter, so stop planning like it is a generic flat city break.",
      "Two nights is the sweet spot if you want both football and scenery without rushing.",
      "The city is compact, but the setting makes it feel bigger than it is.",
    ],

    food: [
      "Tyrolean comfort food",
      "Traditional Austrian restaurants",
      "Mountain-hut style dining if you extend outward",
      "Beer halls and casual taverns",
      "Coffee and bakery stops in the centre",
    ],

    transport:
      "Innsbruck is easy if you stay central. Trams and buses work well, the centre is walkable, and stadium travel is straightforward as long as you are not building the trip around some weird edge-hotel idea.",

    accommodation:
      "Old Town is the best base for atmosphere and easy walking. Around the main station is more practical for rail movement, but central Innsbruck gives you the stronger version of the city.",
  },

  wolfsberg: {
    cityId: "wolfsberg",
    name: "Wolfsberg",
    country: "Austria",
    overview:
      "Wolfsberg is not a grand city-break destination, so do not pretend it is. It is a smaller Austrian football stop built around Wolfsberger AC and the practicality of seeing a top-flight club in a less obvious setting. That is the point. If you approach it honestly, it works as a grounded football-led overnight or part of a wider route. If you expect Vienna-level city content, you are wasting your own time.",

    topThings: [
      { title: "Old town centre", tip: "A short walk is enough to get the feel; do not force a giant sightseeing programme onto it." },
      { title: "Lavant Valley scenery", tip: "The wider setting is one of the town’s main positives if weather is decent." },
      { title: "Local cafés and bakeries", tip: "Better to keep the day calm and local than chase fake attraction lists." },
      { title: "St. Mark’s Church area", tip: "A simple central historic stop if you want one small cultural anchor." },
      { title: "Short regional drive or walk", tip: "Useful if you have a car and want to make the most of the landscape." },
      { title: "Wolfsberger AC matchday", tip: "The football is the actual reason you are here, so build around that honestly." },
      { title: "Pre-match local pub stop", tip: "Keep it simple and close to the centre." },
      { title: "Post-match low-key evening", tip: "This is a calm overnight, not a nightlife mission." },
      { title: "Morning town reset", tip: "Useful if you stay over and want the stop to feel slightly fuller." },
      { title: "Regional-routing add-on", tip: "Works better as part of a broader Austria trip than as a glamour standalone weekend." },
    ],

    tips: [
      "Treat Wolfsberg as a football-first stop and it makes sense.",
      "One overnight is usually enough.",
      "Keep expectations realistic and the trip becomes much better.",
      "A car helps if you want to get more from the wider region.",
      "This is about seeing the breadth of the league, not chasing postcard tourism.",
    ],

    food: [
      "Traditional Austrian taverns",
      "Simple local restaurants",
      "Cafés and bakeries in the centre",
      "Casual pub food before the match",
    ],

    transport:
      "Wolfsberg is straightforward if you keep everything central and practical. Local movement is simple, but this is not a place where you should expect big-city transport frequency or endless late-night options.",

    accommodation:
      "Stay in or near the centre and keep the whole trip easy. There is no upside in getting too clever with location here.",
  },

  hartberg: {
    cityId: "hartberg",
    name: "Hartberg",
    country: "Austria",
    overview:
      "Hartberg is exactly the kind of smaller top-flight destination that exposes whether you actually understand football travel or just chase famous names. This is not a major city weekend. It is a local, compact, football-first stop where the appeal is seeing another layer of the league in a town that would never make a normal tourist shortlist. Used properly, it works. Overhyped, it falls apart immediately.",

    topThings: [
      { title: "Historic town centre", tip: "Short, easy walk is enough; do not force a full-day city itinerary." },
      { title: "Main square cafés", tip: "Best way to make the stop feel local rather than transactional." },
      { title: "Hartberg old streets", tip: "A quick wander gives the town enough shape before matchday." },
      { title: "Regional countryside views", tip: "The surrounding setting matters more than grand landmarks." },
      { title: "Church and hill viewpoints", tip: "Useful if you want a light scenic block without overbuilding the day." },
      { title: "TSV Hartberg matchday", tip: "This is the real purpose of the trip, so stop pretending otherwise." },
      { title: "Pre-match meal in town", tip: "Eat centrally and keep logistics dead simple." },
      { title: "Post-match quiet drink", tip: "A low-key finish suits the place better than trying to create nightlife that is not there." },
      { title: "Morning coffee before departure", tip: "Good final move if you stayed overnight." },
      { title: "Wider Styria routing", tip: "Works best when combined with Graz or other Styrian travel rather than as a luxury standalone break." },
    ],

    tips: [
      "Hartberg is a football-led overnight, nothing more complicated than that.",
      "One night is enough unless you are combining it with wider regional travel.",
      "Keep the plan central and simple.",
      "Best for league-completion travellers and people who actually enjoy smaller club environments.",
      "Do not come here expecting major-city energy.",
    ],

    food: [
      "Local Austrian restaurants",
      "Cafés on or near the main square",
      "Traditional pub-style meals",
      "Simple bakery stops",
    ],

    transport:
      "Hartberg is small enough that practical planning beats transport obsession. Keep the town centre as your base and stadium movement straightforward.",

    accommodation:
      "Central Hartberg is the right answer. This is not a city where district strategy needs to become a personality trait.",
  },

  altach: {
    cityId: "altach",
    name: "Altach",
    country: "Austria",
    overview:
      "Altach is a niche football stop in western Austria and should be treated with basic honesty. It is not a major tourism magnet on its own, but it sits in a very attractive wider region and gives you the chance to see Austrian top-flight football in a more local setting. The club trip makes more sense if you combine it with the surrounding Lake Constance and Vorarlberg area instead of expecting the town itself to carry the whole weekend alone.",

    topThings: [
      { title: "Village centre walk", tip: "Short and functional; enough to orient yourself before football." },
      { title: "Wider Vorarlberg scenery", tip: "The surrounding region is the actual travel strength here." },
      { title: "Lake Constance access", tip: "A strong nearby add-on if you are expanding the trip properly." },
      { title: "Bregenz pairing", tip: "Often the smarter wider base if you want a fuller weekend feel." },
      { title: "Rhine Valley views", tip: "Useful scenic layer if you have transport and decent weather." },
      { title: "Cashpoint Arena matchday", tip: "The football stop is the core point, so keep the day built around that." },
      { title: "Pre-match regional meal", tip: "Better to eat well nearby than assume the immediate stadium zone will carry you." },
      { title: "Post-match low-key finish", tip: "This is not a late-night big-city play." },
      { title: "Morning regional reset", tip: "Good if you stayed over and want to justify the trip beyond 90 minutes." },
      { title: "Western Austria routing", tip: "Altach works better as part of a broader route than as a headline solo destination." },
    ],

    tips: [
      "Do not judge this trip purely on Altach town itself; judge it on the wider western-Austria setting.",
      "Bregenz can be the better stay base if you want more life around the trip.",
      "Best for grounded football travellers rather than glamour hunters.",
      "Weather and scenery matter a lot here.",
      "Keep it simple and regional rather than trying to force a city-break template onto it.",
    ],

    food: [
      "Regional Austrian restaurants",
      "Lake-area dining if you extend toward Bregenz",
      "Simple cafés and bakery stops",
      "Traditional tavern-style meals",
    ],

    transport:
      "This trip is easier if you think regionally rather than only locally. Altach itself is straightforward, but the wider area benefits from practical pre-planning, especially if you are combining stops.",

    accommodation:
      "Stay near Altach for pure football convenience, or use Bregenz if you want a stronger base with more atmosphere, food options and wider visitor value.",
  },

  "ried-im-innkreis": {
    cityId: "ried-im-innkreis",
    name: "Ried im Innkreis",
    country: "Austria",
    overview:
      "Ried im Innkreis is another proper football-first stop: small town, low noise, and useful mainly because SV Ried give it league relevance. That is not a criticism; that is the correct framing. This is a grounded trip for someone who wants to see the full spread of Austrian football rather than just the obvious major cities. Keep it honest, keep it simple, and it does the job perfectly well.",

    topThings: [
      { title: "Town centre walk", tip: "Enough for a short orientation block before football; do not force it into more than it is." },
      { title: "Main square cafés", tip: "Useful for keeping the stop local and low-stress." },
      { title: "Regional Upper Austria feel", tip: "The value here is more in atmosphere than in famous landmarks." },
      { title: "Josko Arena matchday", tip: "The football is the central point of the stop, full stop." },
      { title: "Pre-match local food", tip: "Eat centrally and keep the day efficient." },
      { title: "Post-match pub stop", tip: "One calm local drink works better than chasing a nightlife fantasy." },
      { title: "Morning bakery reset", tip: "A simple overnight closer if you stay." },
      { title: "Nearby countryside add-on", tip: "Useful if you have a car and want to broaden the trip slightly." },
      { title: "Regional rail stopover", tip: "Works well if this is part of a wider Austria route." },
      { title: "One-night football rhythm", tip: "Exactly the right scale for this place." },
    ],

    tips: [
      "Treat Ried as a football-led overnight and stop trying to inflate it into something else.",
      "One night is enough for most travellers.",
      "Keep the trip central and practical.",
      "Best for league-completion style travel rather than mainstream city-break expectations.",
      "The stop makes more sense inside a wider Austria itinerary.",
    ],

    food: [
      "Traditional Austrian taverns",
      "Central cafés and bakeries",
      "Simple local restaurant meals",
      "Casual pub food before or after the match",
    ],

    transport:
      "Ried im Innkreis is a practical small-town stop where basic planning is enough. Keep the station or centre as your anchor and do not invent complexity that the trip does not need.",

    accommodation:
      "Stay centrally if you are sleeping over. This is a simple football stop and the hotel choice should reflect that.",
  },
};

export default austrianBundesligaCityGuides;
