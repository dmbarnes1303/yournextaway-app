import type { CityGuide } from "./types";

const GYG = {
  warsaw:
    "https://www.getyourguide.com/en-gb/warsaw-l41/?partner_id=MAQJREP&utm_medium=online_publisher",
  poznan:
    "https://www.getyourguide.com/en-gb/poznan-l1722/?partner_id=MAQJREP&utm_medium=online_publisher",
  gdansk:
    "https://www.getyourguide.com/en-gb/gdansk-l1960/?partner_id=MAQJREP&utm_medium=online_publisher",
  krakow:
    "https://www.getyourguide.com/en-gb/krakow-l40/?partner_id=MAQJREP&utm_medium=online_publisher",
  lodz:
    "https://www.getyourguide.com/en-gb/lodz-l145233/?partner_id=MAQJREP&utm_medium=online_publisher",
  katowice:
    "https://www.getyourguide.com/en-gb/katowice-l104676/?partner_id=MAQJREP&utm_medium=online_publisher",
  lublin:
    "https://www.getyourguide.com/en-gb/lublin-l2415/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const ekstraklasaCityGuides: Record<string, CityGuide> = {
  warsaw: {
    cityId: "warsaw",
    name: "Warsaw",
    country: "Poland",
    thingsToDoUrl: GYG.warsaw,
    overview:
      "Warsaw is one of the easiest football capitals in central Europe to use well: broad hotel stock, strong public transport, a real nightlife spine, and enough district variation that the trip can feel tailored rather than generic. The city is not ‘cute’ in the way Kraków is, but that is exactly why it works. Warsaw feels like a serious capital with layers, not a museum set.\n\nFor football travel, the winning formula is simple: stay central, split the trip by area, and treat matchday as one deliberate movement rather than a full-day logistical exercise. If you get that right, Warsaw feels efficient and high-value instead of sprawling and slightly anonymous.",
    topThings: [
      { title: "Old Town walk", tip: "Do it early or near dusk. Midday is busier and less atmospheric." },
      { title: "Nowy Świat and Krakowskie Przedmieście", tip: "Best simple central route for cafés, bars, and easy city flow." },
      { title: "Palace of Culture viewpoint", tip: "Worth doing once because it helps you understand the scale and shape of the city." },
      { title: "Łazienki Park", tip: "Strong reset block if you want calmer daylight before the match." },
      { title: "Vistula riverfront", tip: "Best in the evening, especially in warmer months." },
      { title: "Praga district", tip: "Go with intent. It is not one neat tourist strip and punishes aimless wandering." },
      { title: "Warsaw Uprising Museum", tip: "Properly worthwhile, but don’t cram it into a rushed pre-match gap." },
      { title: "One serious dinner", tip: "Warsaw is better for one or two good meals than endless mediocre casual stops." },
      { title: "Legia matchday route", tip: "Keep the approach simple from central Warsaw and don’t overcomplicate it." },
      { title: "Post-match central drinks", tip: "Go back into the centre rather than hanging around the stadium zone too long." },
    ],
    tips: [
      "Śródmieście is the smartest base for almost everyone.",
      "Warsaw is big enough to punish random zig-zagging.",
      "Use metro, trams, and walking rather than defaulting to taxis.",
      "Build one clear matchday transport plan and stick to it.",
      "The city works best when you think in districts, not in scattered pins.",
    ],
    food: [
      "Modern Polish restaurants",
      "Śródmieście bistros",
      "Cocktail and late-bar scene around Nowy Świat",
      "Casual food halls if you want flexibility",
    ],
    transport:
      "Warsaw’s public transport is good enough that there is no excuse for chaotically relying on cars all weekend. Metro, tram, and walking cover most useful movement if you stay central.",
    accommodation:
      "Śródmieście is the best all-round base. Around Nowy Świat is stronger if you want a livelier central feel. Near Warszawa Centralna is practical if rail links matter more than neighbourhood character.",
  },

  poznan: {
    cityId: "poznan",
    name: "Poznań",
    country: "Poland",
    thingsToDoUrl: GYG.poznan,
    overview:
      "Poznań is one of the cleanest football-weekend cities in Poland because it gets the balance right: compact enough to stay efficient, lively enough to feel like a proper break, and serious enough as a football city that the match never feels bolted on. This is not a place where you need a complicated itinerary. It works when you keep it sharp and central.\n\nFor Lech weekends especially, Poznań is excellent because the city centre, nightlife, and stadium trip fit together logically. It is one of the least wasteful trips in the whole Polish set.",
    topThings: [
      { title: "Stary Rynek", tip: "The obvious anchor for a reason. Best at golden hour and later evening." },
      { title: "Town Hall and market architecture", tip: "Worth seeing, but don’t pretend it is the whole city." },
      { title: "Ostrów Tumski", tip: "Good slower daytime block if you want history before football takes over." },
      { title: "Warta river walk", tip: "Useful reset if you want air and space before the evening." },
      { title: "Jeżyce food scene", tip: "Strong for a less tourist-heavy meal." },
      { title: "Saint Martin croissant stop", tip: "Good local add-on, not a whole itinerary centrepiece." },
      { title: "Lech matchday approach", tip: "Leave enough time and do not cut transport fine." },
      { title: "Centre-first pre-match beers", tip: "Poznań handles this well, but book dinner on busy fixture weekends." },
      { title: "Post-match old town drinks", tip: "Best easy finish if you are staying central." },
      { title: "Slow Sunday coffee", tip: "Poznań rewards a low-friction morning after a big football night." },
    ],
    tips: [
      "Stay central near Stary Rynek or between there and the station.",
      "Poznań is very walkable in the core.",
      "Lech weekends can tighten hotel demand quickly.",
      "Use the centre as your food-and-drinks base, not the stadium area.",
      "This is one of the easiest league trips to execute well.",
    ],
    food: [
      "Modern Polish dining",
      "Old-town bars and grills",
      "Jeżyce cafés and restaurants",
      "Late-night casual food near the centre",
    ],
    transport:
      "Poznań is easy if you base centrally. The stadium should be treated as one planned outward move, not something you freestyle at the last second.",
    accommodation:
      "Stary Rynek is the strongest atmosphere base. Near Poznań Główny is better if you want fast rail and airport practicality.",
  },

  czestochowa: {
    cityId: "czestochowa",
    name: "Częstochowa",
    country: "Poland",
    overview:
      "Częstochowa is a football-led stop more than a polished leisure city break. That is not a flaw. It just means you need to frame it honestly. This is not Kraków-lite. It is a more specialised trip where the club, the match, and practical overnight logistics matter more than pretending the city is packed with endless lifestyle content.\n\nFor Raków, that honesty works in your favour. The trip is about a serious modern football project first and a straightforward regional stop second.",
    topThings: [
      { title: "Jasna Góra area", tip: "The obvious local landmark. Worth seeing if you are staying overnight." },
      { title: "Simple central walk", tip: "Enough for orientation and a meal, not for pretending the city is endless." },
      { title: "Raków matchday block", tip: "This is the actual anchor of the trip." },
      { title: "Pre-match meal in the centre", tip: "Sort food early instead of relying on late improvisation." },
      { title: "One-night football stay", tip: "This is the cleanest way to frame the city." },
      { title: "Local café reset", tip: "Useful the morning after if leaving by train or car." },
      { title: "Short city-centre evening", tip: "Keep expectations aligned and it works fine." },
      { title: "Regional onward travel", tip: "Better when integrated into a wider southern Poland route." },
      { title: "Simple morning walk", tip: "Useful for decompression, not for trophy-hunting attractions." },
      { title: "Football-first overnight", tip: "That is the honest product here." },
    ],
    tips: [
      "Treat this as a football stop, not a premium city-break destination.",
      "One night is usually enough.",
      "Central stay is the obvious move.",
      "Keep plans practical and you avoid disappointment.",
      "Better when paired with wider southern Poland travel.",
    ],
    food: [
      "Simple Polish restaurants",
      "Central cafés",
      "Local grills",
      "Straightforward pre-match dining",
    ],
    transport:
      "The city is manageable if you keep everything central. The main mistake is overcomplicating a trip that should stay simple.",
    accommodation:
      "Stay centrally and keep football as the focus. There is no upside in overengineering this one.",
  },

  szczecin: {
    cityId: "szczecin",
    name: "Szczecin",
    country: "Poland",
    overview:
      "Szczecin is one of the more underrated football cities in Poland because it feels different from the usual old-town-heavy route. It has space, water, a slightly rougher edge, and enough quality that the weekend feels distinct rather than generic. That matters if you are trying to build an app around meaningful football travel rather than recycled city clichés.\n\nFor Pogoń, the city adds real value. Szczecin is not the easiest sell to casual tourists, but for football travellers who like places with character, it absolutely works.",
    topThings: [
      { title: "Wały Chrobrego", tip: "Best first-look city route with proper views and orientation value." },
      { title: "Old Town stroll", tip: "Smaller than Kraków or Gdańsk, so keep expectations sensible." },
      { title: "Riverside walk", tip: "Good daylight reset before evening plans." },
      { title: "Pogoń matchday", tip: "One of the best reasons to visit the city if you want a less obvious Polish football weekend." },
      { title: "Central bars", tip: "Best for a low-fuss pre-match or post-match evening." },
      { title: "Port-city atmosphere", tip: "Part of Szczecin’s value is just the city’s different rhythm." },
      { title: "Civic architecture loop", tip: "Fine add-on, but don’t make this a museum-heavy trip unless that is your thing." },
      { title: "One good dinner then football", tip: "The city suits this formula well." },
      { title: "Post-match centre return", tip: "Usually smarter than lingering late near the stadium." },
      { title: "Easy Sunday morning walk", tip: "Best used to absorb the city properly before leaving." },
    ],
    tips: [
      "Stay central or near the better riverside zones.",
      "This trip works because it feels different from Warsaw or Kraków.",
      "Use local transport or short taxis for the stadium.",
      "Good pick for a slightly less obvious football weekend.",
      "Best for travellers who like cities with edge rather than postcard polish.",
    ],
    food: [
      "Central Polish restaurants",
      "Riverfront dining",
      "Casual bars around the centre",
      "Seafood options where appropriate",
    ],
    transport:
      "Central Szczecin is manageable and the stadium movement is straightforward if planned. The city does not need a complicated transport strategy.",
    accommodation:
      "Old Town and Centrum are best for most visitors. Around Wały Chrobrego adds a slightly more scenic feel.",
  },

  gdansk: {
    cityId: "gdansk",
    name: "Gdańsk",
    country: "Poland",
    thingsToDoUrl: GYG.gdansk,
    overview:
      "Gdańsk is one of the strongest complete weekend cities in the entire football coverage map: beautiful core, Baltic atmosphere, serious food potential, and enough depth that the football feels naturally embedded inside a proper city break. This is not a match trip you need to defend. The city sells itself and the football strengthens it.\n\nFor Lechia or Arka-linked wider Tri-City travel, Gdańsk is one of Poland’s most commercially obvious winners because it gives you both clean football logistics and real non-football value.",
    topThings: [
      { title: "Long Market and Old Town", tip: "Do it early once, then again at night. Different mood, both worth it." },
      { title: "Motława riverfront", tip: "Best simple scenic walk in the city." },
      { title: "European Solidarity Centre", tip: "High-value stop if you want depth and context." },
      { title: "Westerplatte angle", tip: "Worth considering if you want more than bars and football." },
      { title: "Wrzeszcz food or drinks", tip: "Good practical area if you want to split city and stadium movement smartly." },
      { title: "Lechia matchday", tip: "Treat the stadium as a major event move, not a casual wander." },
      { title: "Seafood or modern Polish dinner", tip: "One of the best cities in the league for a genuinely good meal." },
      { title: "Baltic coast add-on", tip: "Useful if you have more than one full day." },
      { title: "Post-match old town drinks", tip: "Easy way to finish properly if you are central." },
      { title: "Sunday waterfront reset", tip: "Strong final-morning move before travel home." },
    ],
    tips: [
      "Old Town is the strongest base for most travellers.",
      "Wrzeszcz is good if you want practicality between airport, city, and stadium.",
      "This is one of the easiest football-plus-city weekends in Poland.",
      "Do not waste your best meal on stadium-area convenience.",
      "Best with two nights if possible.",
    ],
    food: [
      "Seafood",
      "Modern Polish dining",
      "Old-town bars and restaurants",
      "Wrzeszcz casual options",
    ],
    transport:
      "Gdańsk works well with a central stay and one deliberate transport move to the stadium. The centre itself is easy to enjoy on foot.",
    accommodation:
      "Old Town is the strongest overall choice. Wrzeszcz is better if you want a more practical and slightly less tourist-heavy base.",
  },

  zabrze: {
    cityId: "zabrze",
    name: "Zabrze",
    country: "Poland",
    overview:
      "Zabrze is not a polished city-break destination in the classical sense. It is a serious football place in a serious football region. That distinction matters. If you try to sell it like Kraków, you are lying. If you sell it as Silesian football culture with a historic club at the centre, it becomes much more compelling.\n\nThis is the sort of trip that works for people who actually care about football geography, supporter culture, and regional identity rather than just wanting a neat tourist loop.",
    topThings: [
      { title: "Górnik matchday", tip: "This is the clear reason the trip exists." },
      { title: "Silesian regional exploration", tip: "Better than trying to force Zabrze into a full tourist-city role." },
      { title: "Simple central meal", tip: "Keep it practical." },
      { title: "Industrial heritage angle", tip: "Useful if that regional identity genuinely interests you." },
      { title: "Short town-centre walk", tip: "Enough for orientation, not a full sightseeing day." },
      { title: "Regional football route", tip: "Works best when paired with Katowice or wider Silesia." },
      { title: "Pre-match local pubs", tip: "Part of the football texture here." },
      { title: "Post-match regional return", tip: "Often smarter than lingering too late locally." },
      { title: "One-night football stop", tip: "Usually the right framing." },
      { title: "Silesian atmosphere absorb-and-go", tip: "This is not a ‘tick attractions’ trip." },
    ],
    tips: [
      "Treat it as part of a Silesian football route.",
      "Katowice can be the smarter stay base.",
      "This is football-first, not postcard tourism.",
      "Górnik is the headline, not the city itinerary.",
      "Best for serious football travellers.",
    ],
    food: [
      "Local pubs",
      "Simple Silesian dining",
      "Regional comfort food",
      "Straightforward matchday meals",
    ],
    transport:
      "The wider Silesian transport logic matters more than intra-city glamour. Plan the region, not just Zabrze in isolation.",
    accommodation:
      "Zabrze centre works for simplicity. Katowice is often stronger if you want broader nightlife and hotel choice.",
  },

  bialystok: {
    cityId: "bialystok",
    name: "Białystok",
    country: "Poland",
    overview:
      "Białystok is a regional football trip more than a classic European city-break product. That is fine. Its value lies in identity, distance, and the feeling that you are reaching a different part of the Polish football map rather than replaying the most obvious urban hits.\n\nFor Jagiellonia, that matters. The city gives the club a strong representational identity, and the trip feels more like proper league exploration than casual tourism.",
    topThings: [
      { title: "Kościuszko Market Square", tip: "The natural centrepoint for the city." },
      { title: "Branicki Palace area", tip: "Best visual add-on if you want city context." },
      { title: "Jagiellonia matchday", tip: "The main point of the trip." },
      { title: "Central evening meal", tip: "Keep it clean and central." },
      { title: "Simple city-centre wander", tip: "Enough for orientation, not endless exploration." },
      { title: "Morning coffee in the centre", tip: "Good reset if staying one night." },
      { title: "Regional contrast factor", tip: "Part of the value is that this feels less generic than western-city trips." },
      { title: "Football-first overnight", tip: "Correct product framing." },
      { title: "Local café rhythm", tip: "Useful if keeping the weekend calm and focused." },
      { title: "Efficient departure plan", tip: "Travel distance is part of the commitment here." },
    ],
    tips: [
      "This is a football-led trip with regional identity value.",
      "Stay central and keep it efficient.",
      "Longer distance means planning matters more.",
      "One night is often enough unless doing a broader regional route.",
      "Good for proper league-completeness travellers.",
    ],
    food: [
      "Central Polish restaurants",
      "Simple cafés",
      "Market-square dining",
      "Low-fuss local meals",
    ],
    transport:
      "The city is easy once you are there. The challenge is broader travel planning, not inner-city movement.",
    accommodation:
      "Stay centrally near the square or main practical core. There is no reason to overcomplicate the base.",
  },

  krakow: {
    cityId: "krakow",
    name: "Kraków",
    country: "Poland",
    thingsToDoUrl: GYG.krakow,
    overview:
      "Kraków is one of the strongest complete football travel cities in the entire app. The football sits inside a genuinely elite European weekend: Old Town, Kazimierz, serious food, easy walking, strong nightlife, and enough quality that even without a match it still sells itself. Football is the anchor, but the city carries huge value on its own.\n\nThat makes Kraków one of your easiest recommendation products. It is almost impossible to make this trip weak unless you plan it badly.",
    topThings: [
      { title: "Old Town and Rynek Główny", tip: "Do it early once, then again at night when the city feels totally different." },
      { title: "Kazimierz", tip: "Best area for bars, restaurants, and a more layered evening." },
      { title: "Wawel area walk", tip: "Worth doing, but don’t burn half the trip queueing for everything." },
      { title: "Vistula river walk", tip: "Useful reset between sightseeing and matchday." },
      { title: "Cracovia matchday", tip: "Very easy to integrate into a wider city weekend." },
      { title: "Good Polish dinner", tip: "Kraków is one of the best cities in this whole map for food value." },
      { title: "Coffee-and-cake morning", tip: "Strong city for slower starts after a late night." },
      { title: "Museum option", tip: "Only if you genuinely want it. Don’t overload the weekend." },
      { title: "Post-match Kazimierz drinks", tip: "Probably the cleanest finish to a football day here." },
      { title: "Sunday low-pressure wander", tip: "Kraków rewards a slower final morning." },
    ],
    tips: [
      "Old Town and Kazimierz are the strongest stay bases.",
      "This city is walkable enough that you should not over-rely on taxis.",
      "Football fits naturally into a wider weekend here.",
      "Book dinner if the match weekend is busy.",
      "One of the easiest trips in the app to recommend.",
    ],
    food: [
      "Traditional Polish food",
      "Kazimierz restaurants",
      "Modern bistros",
      "Late-night bars and casual food",
    ],
    transport:
      "Central Kraków is highly walkable. Keep your base central and the whole weekend becomes low-friction.",
    accommodation:
      "Old Town is the cleanest first-time choice. Kazimierz is better if you want more nightlife and restaurant depth.",
  },

  gliwice: {
    cityId: "gliwice",
    name: "Gliwice",
    country: "Poland",
    overview:
      "Gliwice is a practical, lower-profile football stop that gains most of its value from the wider Silesian context rather than standalone glamour. That is not a weakness. It just means the trip should be framed honestly: efficient, regional, football-led, and useful for proper league coverage.\n\nIf you try to package Gliwice as a bucket-list city break, you are overselling it. If you package it as part of a strong Silesian football route, it makes perfect sense.",
    topThings: [
      { title: "Piast matchday", tip: "The main reason to be here." },
      { title: "Old town square", tip: "Pleasant enough for a short central walk." },
      { title: "Short city-centre food stop", tip: "Good for practicality, not for building a giant itinerary." },
      { title: "Regional Silesia link-up", tip: "This is where the trip gets stronger." },
      { title: "Simple overnight stay", tip: "One night is usually enough." },
      { title: "Local café start", tip: "Useful if you want an easy, low-fuss morning." },
      { title: "Compact centre loop", tip: "Enough for orientation, not endless discovery." },
      { title: "Katowice add-on", tip: "Can improve the broader trip a lot." },
      { title: "Pre-match central walk", tip: "Good low-effort time filler." },
      { title: "Football-region immersion", tip: "The wider area is part of the product." },
    ],
    tips: [
      "Better as part of a Silesian multi-stop than as a glamour weekend.",
      "Stay local for simplicity or use Katowice for broader nightlife.",
      "Piast are the anchor, not the city attraction list.",
      "This is a useful football stop, not a fantasy city-break giant.",
      "Works best for serious domestic-football travellers.",
    ],
    food: [
      "Simple local restaurants",
      "Regional comfort food",
      "Central cafés",
      "Straightforward pre-match meals",
    ],
    transport:
      "The city itself is easy enough. The bigger value comes from planning the wider Silesian movement around it.",
    accommodation:
      "Gliwice centre works fine for convenience. Katowice is stronger if you want a broader weekend base.",
  },

  lodz: {
    cityId: "lodz",
    name: "Łódź",
    country: "Poland",
    thingsToDoUrl: GYG.lodz,
    overview:
      "Łódź is far better as a football weekend than many outsiders expect. It has the right kind of gritty urban character, a serious nightlife spine on Piotrkowska, and enough personality that the trip feels distinct rather than interchangeable. The key is simple: stay central, lean into the city’s texture, and let the football sit inside that instead of trying to over-curate every minute.\n\nFor Widzew especially, the city’s rougher edges actually strengthen the football experience rather than weaken it.",
    topThings: [
      { title: "Piotrkowska Street", tip: "The city’s main social spine and the obvious stay anchor." },
      { title: "OFF Piotrkowska", tip: "Best modern bar-food hangout if you want a bit more style." },
      { title: "Manufaktura", tip: "Useful if you want a polished all-in-one block, but don’t let it eat the trip." },
      { title: "Widzew matchday", tip: "A serious football anchor with one of the better supporter cultures in Poland." },
      { title: "Post-industrial city feel", tip: "Part of Łódź’s value is texture, not landmark count." },
      { title: "Good dinner then bars", tip: "The city handles this formula very well." },
      { title: "Morning coffee on Piotrkowska", tip: "Strong easy reset after a big football night." },
      { title: "Neighbourhood walking", tip: "Łódź works better when explored casually than as a strict checklist." },
      { title: "Post-match central return", tip: "Best move if you want the weekend to keep flowing." },
      { title: "Simple Sunday city loop", tip: "Good city for a slower late-morning final block." },
    ],
    tips: [
      "Piotrkowska is the right answer for most stays.",
      "Łódź works because it has character, not because it is polished everywhere.",
      "Widzew gives the city a serious football edge.",
      "Good option if you want something rougher and more lived-in than Kraków or Gdańsk.",
      "One of the better underrated football weekends in Poland.",
    ],
    food: [
      "Piotrkowska restaurants",
      "OFF Piotrkowska bars",
      "Modern Polish spots",
      "Late casual central food",
    ],
    transport:
      "Central Łódź is manageable if you stay along the main spine. Matchday should be one deliberate outward move rather than a full transport puzzle.",
    accommodation:
      "Piotrkowska Street area is the strongest base. Near Łódź Fabryczna is more practical if rail matters most.",
  },

  lubin: {
    cityId: "lubin",
    name: "Lubin",
    country: "Poland",
    overview:
      "Lubin is a functional football stop rather than a major city-break product. That is not a criticism. It just means the value is in efficiency, lower-profile football texture, and the chance to cover a club that sits outside the obvious glamour route.\n\nFor Zagłębie, the city should be sold honestly: practical overnight, straightforward football, and best when paired with a broader Lower Silesia plan if you want more leisure upside.",
    topThings: [
      { title: "Zagłębie matchday", tip: "This is the central purpose of the trip." },
      { title: "Short central walk", tip: "Enough for orientation and a meal, nothing more dramatic." },
      { title: "One-night football stay", tip: "The cleanest framing for Lubin." },
      { title: "Simple pre-match meal", tip: "Keep it central and practical." },
      { title: "Lower Silesia tie-in", tip: "The trip becomes stronger if folded into wider regional travel." },
      { title: "Morning café reset", tip: "Useful if leaving the next day." },
      { title: "Compact city rhythm", tip: "Low-friction is the point here." },
      { title: "Stadium-first planning", tip: "Do not overengineer a small practical stop." },
      { title: "Straightforward overnight logistics", tip: "This city works best when treated simply." },
      { title: "Regional onward move", tip: "Lubin is often more valuable as part of a route than as a destination by itself." },
    ],
    tips: [
      "Best framed as a football stop, not a leisure weekend.",
      "One night is usually enough.",
      "Stay central if staying at all.",
      "Wrocław can be the stronger broader regional base.",
      "Good for proper league coverage rather than glamour travel.",
    ],
    food: [
      "Simple local restaurants",
      "Practical central dining",
      "Straightforward cafés",
      "Low-fuss pre-match meals",
    ],
    transport:
      "Lubin should be handled practically. The city is small enough that the main issue is broader regional access, not movement inside town.",
    accommodation:
      "Lubin centre is best for simplicity. Wrocław is stronger if you want a fuller regional weekend.",
  },

  plock: {
    cityId: "plock",
    name: "Płock",
    country: "Poland",
    overview:
      "Płock is a tidy smaller-city football trip rather than a major glamour weekend. That makes it more usable than people assume. Smaller Polish cities often work well when kept efficient: one decent central stay, one football-focused evening, and one simple morning reset.\n\nFor Wisła Płock, the city adds enough riverside and old-town atmosphere that the trip feels coherent even if it is not flashy.",
    topThings: [
      { title: "Old Town and river area", tip: "Best part of the city to get a quick sense of place." },
      { title: "Wisła Płock matchday", tip: "The real anchor of the trip." },
      { title: "Cathedral and hilltop views", tip: "Good visual add-on if you have daylight spare." },
      { title: "Simple central dinner", tip: "Best to keep food plans practical and close." },
      { title: "One-night football stay", tip: "Usually the right format." },
      { title: "Morning riverside walk", tip: "Strong low-pressure reset before leaving." },
      { title: "Compact centre loop", tip: "Enough for orientation, no need to force more." },
      { title: "Low-friction logistics", tip: "This is where the city wins." },
      { title: "Post-match central return", tip: "Usually smarter than lingering near the ground." },
      { title: "Football-first short break", tip: "That is the honest product." },
    ],
    tips: [
      "Best as a one-night football-led stop.",
      "Stay central or near the old-town/riverside area.",
      "Keep plans simple and the city works well.",
      "Not a major city-break, but not a dead stop either.",
      "Useful for proper league-depth coverage.",
    ],
    food: [
      "Central Polish dining",
      "Riverside restaurants",
      "Simple cafés",
      "Practical pre-match meals",
    ],
    transport:
      "Płock is easy enough once you are in the centre. The main job is to keep the trip compact and not overcomplicate the route.",
    accommodation:
      "City centre and the old-town/riverside side are the best options for atmosphere and simplicity.",
  },

  kielce: {
    cityId: "kielce",
    name: "Kielce",
    country: "Poland",
    overview:
      "Kielce is a coherent football stop with decent practicality, but it is not a luxury football weekend. That is fine. The city’s strength is that it is straightforward: compact enough to manage easily, lively enough for one evening, and tied to a club with a recognisable domestic identity.\n\nFor Korona, the city gives you a proper football-first product without requiring you to pretend it is one of the elite leisure breaks in the country.",
    topThings: [
      { title: "Sienkiewicza Street", tip: "The central social spine and best base for food and drink." },
      { title: "Korona matchday", tip: "The main event and real reason to be here." },
      { title: "Palace of the Kraków Bishops area", tip: "A decent central add-on if you want a bit of city texture." },
      { title: "Short centre walk", tip: "Enough for a calm afternoon block." },
      { title: "One proper meal", tip: "Kielce is better handled with one solid dinner than lots of drifting." },
      { title: "Simple pre-match pub plan", tip: "Keep it central and low-fuss." },
      { title: "Morning coffee reset", tip: "Useful after a football night." },
      { title: "Low-friction overnight", tip: "This is where Kielce makes sense." },
      { title: "Post-match centre return", tip: "Usually the cleanest move." },
      { title: "Football-led short break", tip: "That is the honest route." },
    ],
    tips: [
      "Best as a simple overnight rather than a long luxury weekend.",
      "Stay central near Sienkiewicza Street.",
      "Korona is the anchor, not a giant city itinerary.",
      "Useful if you value practicality over glamour.",
      "Strong enough as a proper domestic football stop.",
    ],
    food: [
      "Central Polish dining",
      "Simple bars and grills",
      "Street cafés",
      "Straightforward pre-match meals",
    ],
    transport:
      "Kielce works best when you stay central and keep everything simple. You do not need an elaborate transport plan here.",
    accommodation:
      "The centre, especially near Sienkiewicza Street, is the smartest stay zone.",
  },

  katowice: {
    cityId: "katowice",
    name: "Katowice",
    country: "Poland",
    thingsToDoUrl: GYG.katowice,
    overview:
      "Katowice is one of the most underrated football-weekend bases in Poland because it gives you exactly what many football travellers actually need: serious nightlife, good transport, strong regional identity, and access to the wider Silesian football landscape. It is not pretty in the way Kraków or Gdańsk are, but it is more useful than many prettier cities.\n\nFor GKS Katowice, that matters. The city and club fit together in a way that feels grounded and authentic rather than tourist-packaged.",
    topThings: [
      { title: "Mariacka Street", tip: "Best nightlife spine and obvious evening anchor." },
      { title: "Nikiszowiec", tip: "One of the strongest identity-heavy neighbourhood visits in the region." },
      { title: "Silesian Museum", tip: "High-value stop if you want regional context, not fluff." },
      { title: "Spodek area", tip: "Good orientation point and central meeting zone." },
      { title: "GKS Katowice matchday", tip: "A major part of the city’s football-travel appeal now the new stadium is in play." },
      { title: "Regional football planning", tip: "Katowice is the smartest base for wider Silesian coverage." },
      { title: "One serious dinner and drinks", tip: "The city does this well without needing overplanning." },
      { title: "Post-industrial city texture", tip: "Part of the appeal is how different Katowice feels from standard old-town breaks." },
      { title: "Post-match central return", tip: "Best move if you want the night to keep going." },
      { title: "Slow Sunday café block", tip: "Useful after a bigger football night." },
    ],
    tips: [
      "Katowice is often the smartest Silesian overnight base even if your match is elsewhere in the region.",
      "Use it for football-plus-nightlife practicality, not romantic tourism.",
      "Mariacka is the obvious evening district.",
      "Nikiszowiec adds local identity and stops the trip feeling generic.",
      "One of the best utility bases in the whole app.",
    ],
    food: [
      "Modern Polish dining",
      "Mariacka bars and restaurants",
      "Regional Silesian comfort food",
      "Casual central cafés",
    ],
    transport:
      "Katowice works extremely well as a regional base because rail and road links make wider Silesian football movement manageable.",
    accommodation:
      "Katowice centre is the correct answer for most travellers. Stay there unless you have a very specific reason not to.",
  },

  radom: {
    cityId: "radom",
    name: "Radom",
    country: "Poland",
    overview:
      "Radom is a functional football stop with a cleaner, more modern setup than older lower-tier associations might lead you to expect. That does not suddenly make it a major city-break product, but it does make it usable. The honest version is simple: football-focused overnight, straightforward logistics, and low wasted time.\n\nFor Radomiak, the point is commitment to proper league coverage rather than chasing only obvious glamour cities.",
    topThings: [
      { title: "Radomiak matchday", tip: "The clear anchor of the trip." },
      { title: "Simple central walk", tip: "Enough to orient yourself before food or drinks." },
      { title: "One practical dinner", tip: "Do not overcomplicate the city’s role." },
      { title: "Compact overnight", tip: "Usually the correct framing." },
      { title: "Morning reset café", tip: "Useful if leaving by rail or road the next day." },
      { title: "Modern stadium visit focus", tip: "The ground is part of the city’s improved football product." },
      { title: "Warsaw-linked side trip logic", tip: "Sometimes the smarter broader travel setup." },
      { title: "Low-friction planning", tip: "This is where Radom works." },
      { title: "Post-match centre return", tip: "Usually the best move." },
      { title: "Football-first short stop", tip: "That is the honest product." },
    ],
    tips: [
      "Best as a football-focused overnight or side trip.",
      "Keep the stay central and practical.",
      "Warsaw can be the stronger broader travel base.",
      "Do not oversell the city as a luxury break.",
      "Useful for proper domestic-league coverage.",
    ],
    food: [
      "Simple Polish restaurants",
      "Central cafés",
      "Basic bars and grills",
      "Straightforward pre-match meals",
    ],
    transport:
      "Radom is manageable if you keep everything central. The bigger question is whether you are basing locally or linking it with Warsaw.",
    accommodation:
      "Radom centre is best for simplicity. Warsaw makes more sense if you want broader weekend value.",
  },

  lublin: {
    cityId: "lublin",
    name: "Lublin",
    country: "Poland",
    thingsToDoUrl: GYG.lublin,
    overview:
      "Lublin is stronger as a football city-break than many people expect. It has a genuinely attractive old core, a decent nightlife rhythm, and enough cultural weight that the match feels naturally embedded in a worthwhile weekend rather than artificially pasted onto one. That makes it a strong product for your app.\n\nFor Motor Lublin, the city is a major asset. It helps turn what could have been a specialist football stop into something much more broadly recommendable.",
    topThings: [
      { title: "Old Town", tip: "The obvious anchor and best place to begin." },
      { title: "Castle and old-city skyline angles", tip: "Good visual payoff without requiring a huge time sink." },
      { title: "Krakowskie Przedmieście", tip: "Useful for cafés, bars, and city flow." },
      { title: "Motor Lublin matchday", tip: "A proper modern football anchor in a city that already works well." },
      { title: "One good dinner in the centre", tip: "Lublin rewards this more than endless snacking." },
      { title: "Nightlife around the centre", tip: "Not giant-city scale, but enough for a proper football weekend." },
      { title: "Slow daytime architecture loop", tip: "Good if you have a full second day." },
      { title: "Post-match old-town return", tip: "Best move if staying central." },
      { title: "Coffee and pastry morning", tip: "Strong easy reset city." },
      { title: "Longer eastern-Poland route tie-in", tip: "Useful if building a broader football travel arc." },
    ],
    tips: [
      "Lublin is better than many people assume, so don’t undersell it.",
      "Old Town is the best base for atmosphere.",
      "This is a proper city-break-capable football weekend.",
      "One of the better non-obvious Polish destinations in the app.",
      "Works well with two nights.",
    ],
    food: [
      "Old-town restaurants",
      "Modern Polish dining",
      "Casual centre bars and cafés",
      "Strong breakfast options",
    ],
    transport:
      "Central Lublin is manageable on foot if you stay in the right zone. Matchday should be a planned move but not a major headache.",
    accommodation:
      "Old Town is the strongest atmosphere base. The wider centre is better if you want a bit more practicality and hotel choice.",
  },

  gdynia: {
    cityId: "gdynia",
    name: "Gdynia",
    country: "Poland",
    overview:
      "Gdynia is a cleaner, more modern coastal product than Gdańsk, and that gives it a different kind of value. It is less historically rich, but often easier, lighter, and more openly leisure-oriented. As a football trip, that makes sense for Arka especially if you are folding the weekend into the wider Tri-City route.\n\nGdynia alone is fine. Gdynia as part of Tri-City football travel is much stronger.",
    topThings: [
      { title: "Seafront and Skwer Kościuszki", tip: "Best simple city route and immediate identity hit." },
      { title: "Beach and marina zone", tip: "Best in decent weather; obvious, but it works." },
      { title: "Arka matchday", tip: "The key football anchor in the city." },
      { title: "Gdynia centre stroll", tip: "More practical than romantic, but easy to use." },
      { title: "Tri-City linking", tip: "Part of Gdynia’s value is how easily it sits inside a wider coastal trip." },
      { title: "One seafood or coast dinner", tip: "Lean into the location rather than forcing generic city dining." },
      { title: "Post-match coast return", tip: "Good if you want a calmer late evening feel." },
      { title: "Morning seafront reset", tip: "Very strong after a football night." },
      { title: "Gdańsk add-on", tip: "Useful if you want a stronger nightlife or heritage layer." },
      { title: "Simple football-and-coast weekend", tip: "That is the honest product." },
    ],
    tips: [
      "Gdynia works best as part of a Tri-City route.",
      "Central Gdynia is the best local base.",
      "Gdańsk is the stronger broader base if you want more nightlife and depth.",
      "Use the coast as part of the weekend, not just the match.",
      "A cleaner, calmer football trip than some inland cities.",
    ],
    food: [
      "Seafood",
      "Seafront dining",
      "Casual centre cafés",
      "Simple bars and restaurants",
    ],
    transport:
      "Gdynia is easy enough locally and gains major value from Tri-City rail links, which make wider coastal movement straightforward.",
    accommodation:
      "Gdynia centre is best if you want local simplicity. Gdańsk is stronger if you want the broader high-value city-break base.",
  },

  nieciecza: {
    cityId: "nieciecza",
    name: "Nieciecza",
    country: "Poland",
    overview:
      "Nieciecza is not a mainstream weekend destination. It is a committed football stop. That is the entire point. This is one of those fixtures that only makes sense if you actually care about domestic football depth, unusual clubs, and covering the map properly.\n\nTrying to dress it up as a general leisure city would be stupid. The real value is niche football interest, novelty, and the satisfaction of doing something outside the obvious route.",
    topThings: [
      { title: "Bruk-Bet Termalica matchday", tip: "The clear reason to come." },
      { title: "Minimal local stop", tip: "Keep expectations disciplined." },
      { title: "Tarnów base option", tip: "Usually the smarter practical overnight move." },
      { title: "Southern Poland route tie-in", tip: "This trip works better as part of a broader plan." },
      { title: "Simple pre-match meal", tip: "Sort food before relying on ultra-local convenience." },
      { title: "Small-ground novelty", tip: "Part of the appeal is that this is so different from the bigger-city products." },
      { title: "Football-depth bragging rights", tip: "That is genuinely part of the product here." },
      { title: "One-night practical stop", tip: "The correct framing almost every time." },
      { title: "Do not overplan", tip: "You will just expose the limits of the place." },
      { title: "Absorb-and-move-on trip", tip: "That is the honest way to enjoy it." },
    ],
    tips: [
      "This is a niche football stop, not a mainstream weekend away.",
      "Tarnów is usually the best practical base.",
      "Kraków is the broader city-break alternative if combining travel.",
      "Keep expectations realistic and the trip becomes far more enjoyable.",
      "Best for serious league-completeness travellers.",
    ],
    food: [
      "Simple local meals",
      "Practical pre-match dining",
      "Tarnów-based evening food options",
      "Low-fuss cafés",
    ],
    transport:
      "This is a logistics-first trip. The key is not inner-city transport sophistication, but sensible broader planning around Tarnów or Kraków.",
    accommodation:
      "Tarnów is the best practical overnight base. Kraków makes more sense only if you are building a larger southern Poland trip around it.",
  },
};

export default ekstraklasaCityGuides;
