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
} as const;

export const ekstraklasaCityGuides: Record<string, CityGuide> = {
  warsaw: {
    cityId: "warsaw",
    name: "Warsaw",
    country: "Poland",
    thingsToDoUrl: GYG.warsaw,
    overview:
      "Warsaw is one of the easiest football capitals in central Europe to use properly: broad hotel stock, strong transport, good nightlife spread, and enough distinct districts that you can shape the weekend around your preferred pace. The right strategy is obvious: stay central, split the trip by area, and treat matchday as one deliberate movement rather than a whole-day logistical puzzle.",
    topThings: [
      { title: "Old Town walk", tip: "Do it early or near dusk. Midday can feel more crowded and less atmospheric." },
      { title: "Nowy Świat & Krakowskie Przedmieście", tip: "Best simple central route for cafés, bars, and easy city flow." },
      { title: "Palace of Culture viewpoint", tip: "Worth doing once for the skyline and city layout." },
      { title: "Łazienki Park", tip: "Strong reset block if you want a calmer daylight spell before matchday." },
      { title: "Vistula riverfront", tip: "Best in the evening, especially in warmer months." },
      { title: "Praga district", tip: "Do it with intent — don’t just drift there blindly expecting the whole area to be curated." },
      { title: "Museum of Warsaw Uprising", tip: "Properly worthwhile if you want context, but don’t squeeze it into a rushed pre-match gap." },
      { title: "Central food hall or modern Polish dinner", tip: "Warsaw is better for one or two good meals than endless casual grazing." },
      { title: "Matchday walk toward Legia", tip: "Keep the final approach simple and avoid needless detours." },
      { title: "Post-match central drinks", tip: "Go back into the centre rather than hanging around the stadium zone too long." },
    ],
    tips: [
      "Śródmieście is the smartest base for almost everyone.",
      "Warsaw is spread out enough to punish random zig-zagging.",
      "Use trams, metro, and walking rather than defaulting to taxis.",
      "Build one clear plan for matchday travel and stick to it.",
      "The city works best when you pick districts, not 20 random pins.",
    ],
    food: [
      "Modern Polish restaurants",
      "Central bistros around Śródmieście",
      "Late drinks around Nowy Świat",
      "Casual food halls if you want flexibility",
    ],
    transport:
      "Warsaw’s public transport is strong enough that you should not be improvising with cars all weekend. Metro, tram, and walking cover most useful movement if you stay central.",
    accommodation:
      "Śródmieście is the best all-round base. Nowy Świat works well if you want a livelier central feel. Areas near Warszawa Centralna are practical if rail links matter more than neighbourhood character.",
  },

  poznan: {
    cityId: "poznan",
    name: "Poznań",
    country: "Poland",
    thingsToDoUrl: GYG.poznan,
    overview:
      "Poznań is one of the best football-weekend cities in Poland because it is compact enough to stay efficient but lively enough to feel like a proper break. The old town, bar scene, and strong Lech identity combine well. Keep it simple: central stay, one good food block, one good nightlife block, and planned stadium travel.",
    topThings: [
      { title: "Stary Rynek", tip: "The obvious anchor for a reason. Best at golden hour and later evening." },
      { title: "Town Hall / old market architecture", tip: "Worth seeing, but don’t stand there too long pretending it is the whole city." },
      { title: "Ostrów Tumski", tip: "Good slower daytime block if you want some history before the football takes over." },
      { title: "Warta river walk", tip: "Useful reset if you want air and space before going back into the centre." },
      { title: "Jeżyce food scene", tip: "Strong for a less tourist-heavy meal." },
      { title: "Croissant Museum or local pastry stop", tip: "Good small local add-on, not a whole itinerary centrepiece." },
      { title: "Lech matchday approach", tip: "Leave enough time and do not cut transport fine." },
      { title: "Pre-match beers in the centre", tip: "Poznań handles this well, but book dinner if it’s a busy fixture weekend." },
      { title: "Post-match old-town drinks", tip: "Best easy finish to the day if you are staying central." },
      { title: "Simple Sunday coffee reset", tip: "Poznań rewards low-friction mornings after a big match night." },
    ],
    tips: [
      "Stay central near Stary Rynek or between there and the station.",
      "Poznań is very walkable in the core.",
      "Lech weekends can tighten hotel demand.",
      "Use the centre as your food and drinks base, not the stadium area.",
      "This is one of the cleanest league trips to execute with very little wasted time.",
    ],
    food: [
      "Modern Polish dining",
      "Old-town bars and grills",
      "Jeżyce cafés and restaurants",
      "Late-night casual food near the centre",
    ],
    transport:
      "Poznań is easy if you base centrally. The stadium should be treated as a planned outward move, not something you freestyle at the last second.",
    accommodation:
      "Stary Rynek is the strongest atmosphere base. Near Poznań Główny is better if you want fast rail and airport practicality.",
  },

  czestochowa: {
    cityId: "czestochowa",
    name: "Częstochowa",
    country: "Poland",
    overview:
      "Częstochowa is a football-led stop more than a polished leisure city break. That does not make it weak. It makes it specialised. The trip works if you understand the priority order: football first, practical overnight second, wider sightseeing only if genuinely relevant to you.",
    topThings: [
      { title: "Jasna Góra area", tip: "The obvious city landmark. Worth seeing if you are staying over." },
      { title: "Simple central walk", tip: "Enough for orientation and a meal, not for pretending the city is endless." },
      { title: "Raków matchday block", tip: "This is the actual anchor of the trip." },
      { title: "Pre-match meal in the centre", tip: "Sort food early rather than relying on late local improvisation." },
      { title: "One-night football stay", tip: "This is the cleanest way to frame the city." },
      { title: "Local café reset", tip: "Useful the morning after, especially if leaving by train." },
      { title: "Short city-centre evening", tip: "Keep expectations aligned and it works fine." },
      { title: "Regional onward travel", tip: "Better when integrated into a wider southern Poland route." },
      { title: "Simple morning walk", tip: "Useful for decompression, not for ticking big attractions." },
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
      "The city is manageable if you keep everything central. The main error is overcomplicating a trip that should stay simple.",
    accommodation:
      "Stay centrally and keep the football as the focus. There is no upside in overengineering this one.",
  },

  szczecin: {
    cityId: "szczecin",
    name: "Szczecin",
    country: "Poland",
    overview:
      "Szczecin is one of the more underrated football cities in Poland because it feels different from the obvious historical tourist centres. It has water, space, a slightly off-mainstream atmosphere, and enough quality to make a football weekend feel distinctive rather than generic.",
    topThings: [
      { title: "Wały Chrobrego", tip: "Best first-look city route. Good views, strong orientation point." },
      { title: "Old Town stroll", tip: "Smaller than Kraków or Gdańsk, so keep expectations sensible." },
      { title: "Riverside walk", tip: "Good daylight reset before evening plans." },
      { title: "Pogoń matchday", tip: "One of the best reasons to visit the city if you want a different Polish football trip." },
      { title: "Central bars", tip: "Best for a low-fuss pre-match or post-match evening." },
      { title: "Port-city feel", tip: "Part of Szczecin’s value is just the city’s different rhythm and layout." },
      { title: "Museum / civic architecture loop", tip: "Fine add-on, but don’t make the trip museum-heavy unless that’s your thing." },
      { title: "Good dinner then match", tip: "The city suits this formula well." },
      { title: "Post-match centre return", tip: "Usually the smart play rather than lingering too long near the stadium." },
      { title: "Easy Sunday morning walk", tip: "Best used to absorb the city properly before leaving." },
    ],
    tips: [
      "Stay central or near the most attractive riverside/old-town zones.",
      "This trip works because it feels different from Warsaw or Kraków.",
      "Use local transport or short taxis for the stadium.",
      "Good pick for a slightly less obvious football weekend.",
      "Best for travellers who like cities with some edge rather than perfect postcard polish.",
    ],
    food: [
      "Central Polish restaurants",
      "Riverfront dining",
      "Casual bars around the centre",
      "Seafood options where appropriate",
    ],
    transport:
      "Central Szczecin is manageable and the stadium movement is straightforward if planned. The city does not need overcomplicated transport strategy.",
    accommodation:
      "Old Town / Centrum is best for most visitors. Wały Chrobrego area adds a slightly more scenic feel.",
  },

  gdansk: {
    cityId: "gdansk",
    name: "Gdańsk",
    country: "Poland",
    thingsToDoUrl: GYG.gdansk,
    overview:
      "Gdańsk is one of the strongest complete weekend cities in the football coverage map: beautiful old-town core, Baltic atmosphere, great food potential, and a stadium trip that fits naturally into a broader city break. This is not a football stop you need to justify. The city already sells itself; the match strengthens it.",
    topThings: [
      { title: "Long Market & Old Town", tip: "Do it early and again at night — different mood, both worth it." },
      { title: "Motława riverfront", tip: "Best simple scenic walk in the city." },
      { title: "European Solidarity Centre", tip: "High-value stop if you want depth and context." },
      { title: "Westerplatte or maritime angle", tip: "Worth considering if you want more than bars and football." },
      { title: "Wrzeszcz food or drinks", tip: "Good practical area if you want to split city and stadium movement smartly." },
      { title: "Lechia matchday", tip: "Treat the stadium as a major event move, not a casual wander." },
      { title: "Seafood or modern Polish dinner", tip: "One of the best cities in the league for a properly good meal." },
      { title: "Baltic coast add-on", tip: "Useful if you have more than one full day." },
      { title: "Post-match old town drinks", tip: "Easy way to finish the trip properly if you are central." },
      { title: "Sunday waterfront reset", tip: "Strong final-morning move before travel home." },
    ],
    tips: [
      "Old Town is the strongest base for most travellers.",
      "Wrzeszcz is good if you want practicality between airport, city, and stadium.",
      "This is one of the easiest ‘football plus proper city break’ weekends in Poland.",
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
      "Gdańsk works well with a central stay and one deliberate transport move to the stadium. The city centre itself is easy to enjoy on foot.",
    accommodation:
      "Old Town is the strongest overall choice. Wrzeszcz is better if you want a more practical and slightly less tourist-heavy base.",
  },

  zabrze: {
    cityId: "zabrze",
    name: "Zabrze",
    country: "Poland",
    overview:
      "Zabrze is not a polished city-break destination in the classical sense. It is a serious football place in a serious football region. That distinction matters. If you sell it like Kraków, you are lying. If you sell it as Silesian football culture with a major historic club at the centre, it becomes far more compelling.",
    topThings: [
      { title: "Górnik matchday", tip: "This is the clear reason the trip exists." },
      { title: "Silesian regional exploration", tip: "Better than trying to force Zabrze itself into a full tourist-city role." },
      { title: "Simple central meal", tip: "Keep it practical." },
      { title: "Industrial heritage angle", tip: "Useful if that kind of regional identity interests you." },
      { title: "Short town-centre walk", tip: "Enough for orientation, not for a full sightseeing day." },
      { title: "Regional football route", tip: "Works best when paired with Katowice or wider Silesia." },
      { title: "Pre-match local pubs", tip: "Part of the football texture here." },
      { title: "Post-match regional return", tip: "Often smarter than lingering late locally." },
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
      "Białystok is a regional football trip more than a classic European city-break product. That is fine. Its value lies in identity, distance, and the feeling that you are reaching a different part of the Polish football map rather than replaying the most obvious urban hits.",
    topThings: [
      { title: "Kościuszko Market Square", tip: "The natural centrepoint for the city." },
      { title: "Branicki Palace area", tip: "Best visual add-on if you want some city context." },
      { title: "Jagiellonia matchday", tip: "The main point of the trip." },
      { title: "Central evening meal", tip: "Keep it clean and central." },
      { title: "Simple city-centre wander", tip: "Enough for orientation, not endless exploration." },
      { title: "Morning coffee in the centre", tip: "Good reset if staying one night." },
      { title: "Regional contrast factor", tip: "Part of the value is that this feels less generic than western-city trips." },
      { title: "Football-first overnight", tip: "Correct product framing." },
      { title: "Local café rhythm", tip: "Useful if keeping the weekend calm and focused." },
      { title: "Efficient departure plan", tip: "Because travel distance is part of the commitment here." },
    ],
    tips: [
      "This is a football-led trip with regional identity value.",
      "Stay central and keep it efficient.",
      "Longer distance means planning matters more.",
      "One night is often enough unless you are doing a broader regional route.",
      "Good for league-completeness travellers.",
    ],
    food: [
      "Central Polish restaurants",
      "Simple cafés",
      "Market-square dining",
      "Low-fuss local meals",
    ],
    transport:
      "The city is easy enough once there. The key challenge is broader travel planning, not inner-city movement.",
    accommodation:
      "Stay centrally near the square or main practical city core. There is no need to overcomplicate the base.",
  },

  krakow: {
    cityId: "krakow",
    name: "Kraków",
    country: "Poland",
    thingsToDoUrl: GYG.krakow,
    overview:
      "Kraków is one of the strongest complete football travel cities in this entire project. The football can sit inside a genuinely top-tier European weekend: old town, Kazimierz, great food, easy walking, strong nightlife, and an atmosphere that already feels worthwhile before kickoff. Football is the anchor, but the city absolutely carries its weight.",
    topThings: [
      { title: "Old Town & Rynek Główny", tip: "Do it early once, then again at night when the city feels completely different." },
      { title: "Kazimierz", tip: "Best area for bars, restaurants, and a more layered evening." },
      { title: "Wawel area walk", tip: "Worth doing, but don’t spend half the trip queueing for everything." },
      { title: "Vistula river walk", tip: "Useful reset between sightseeing and matchday." },
      { title: "Cracovia matchday", tip: "Very easy to integrate into a wider city weekend." },
      { title: "Good Polish dinner", tip: "Kraków is one of the best cities in this map for food value." },
      { title: "Coffee-and-cake morning", tip: "Strong city for slower starts after a late night." },
      { title: "Schindler / museum option", tip: "Only if you genuinely want it — don’t overburden the weekend." },
      { title: "Post-match Kazimierz drinks", tip: "Probably the cleanest finish to a football day here." },
      { title: "Sunday low-pressure wander", tip: "Kraków rewards a slower final morning." },
    ],
    tips: [
      "Old Town and Kazimierz are the strongest stay bases.",
      "This city is walkable enough that you should not over-rely on taxis.",
      "Football fits naturally into a wider weekend here.",
      "Book dinner if the match weekend is busy.",
      "One of the easiest trips in the entire app to recommend.",
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
      "Gliwice is a practical, lower-profile football stop that gains most of its value from the wider Silesian context rather than blockbuster standalone tourism. The trip works when framed honestly: efficient, regional, football-led, and useful for proper league coverage.",
    topThings: [
      { title: "Piast matchday", tip: "The main reason to be here." },
      { title: "Old town square", tip: "Pleasant enough for a short central walk." },
      { title: "Short city-centre food stop", tip: "Good for practicality, not for building a huge gastronomic itinerary." },
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
      "Łódź is far better as a football weekend than many outsiders expect. It has the right kind of gritty urban character, a strong main nightlife spine on Piotrkowska, and enough identity that the trip feels distinct rather than interchangeable. The key is simple: stay central, lean into the city’s texture, and let football sit inside that rather than trying to over-curate everything.",
    topThings: [
      { title: "Piotrkowska Street", tip: "The city’s main social spine and the obvious stay anchor." },
      { title: "OFF Piotrkowska", tip: "Best modern bar-food hangout if you want a bit more style." },
      { title: "Manufaktura", tip: "Useful if you want a polished all-in-one block, but don’t let it eat the whole trip." },
      { title: "Widzew matchday", tip: "A serious football anchor with one of the better supporter cultures in Poland." },
      { title: "Street-art / post-industrial city feel", tip: "Part of Łódź’s value is texture, not landmarks count." },
      { title: "Good dinner then bars", tip: "The city handles this formula very well." },
      { title: "Morning coffee on Piotrkowska", tip: "Strong easy reset after a big football night." },
      { title: "Neighbourhood walking", tip: "Łódź works best when explored casually rather than as a strict checklist." },
      { title: "Post-match central return", tip: "Best move if you want the weekend to keep flowing." },
      { title: "Simple Sunday city loop", tip: "Good city for a slower late-morning final block." },
    ],
    tips: [
      "Piotrkowska is the right answer for most stays.",
      "Łódź works because it has character, not because it is polished everywhere.",
      "Widzew gives the city a serious football edge.",
      "Good option if you want something a bit rougher and more lived-in than Kraków or Gdańsk.",
      "One of the better underrated football weekends in Poland.",
    ],
    food: [
      "Piotrkowska restaurants",
      "OFF Piotrkowska bars",
      "Modern Polish spots",
      "Late casual central food",
    ],
    transport:
      "Central Łódź is manageable if you stay along the main city spine. Matchday should be one deliberate outward movement rather than a whole transport puzzle.",
    accommodation:
      "Piotrkowska Street area is the strongest base. Near Łódź Fabryczna is more practical if rail matters most.",
  },
};

export default ekstraklasaCityGuides;
