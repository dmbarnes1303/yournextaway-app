import type { CityGuide } from "./types";

const GYG = {
  istanbul: "https://www.getyourguide.com/en-gb/istanbul-l56/?partner_id=MAQJREP&utm_medium=online_publisher",
  trabzon: "https://www.getyourguide.com/en-gb/trabzon-l984/?partner_id=MAQJREP&utm_medium=online_publisher",
  izmir: "https://www.getyourguide.com/en-gb/izmir-l1082/?partner_id=MAQJREP&utm_medium=online_publisher",
  samsun: "https://www.getyourguide.com/en-gb/samsun-l190451/?partner_id=MAQJREP&utm_medium=online_publisher",
  ankara: "https://www.getyourguide.com/en-gb/ankara-l1236/?partner_id=MAQJREP&utm_medium=online_publisher",
  konya: "https://www.getyourguide.com/en-gb/konya-l1226/?partner_id=MAQJREP&utm_medium=online_publisher",
  antalya: "https://www.getyourguide.com/en-gb/antalya-l172/?partner_id=MAQJREP&utm_medium=online_publisher",
  kayseri: "https://www.getyourguide.com/en-gb/kayseri-l1353/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const superLigCityGuides: Record<string, CityGuide> = {
  istanbul: {
    cityId: "istanbul",
    name: "Istanbul",
    country: "Turkey",
    thingsToDoUrl: GYG.istanbul,
    overview:
      "Istanbul is one of the best football-trip cities in the world because the football is only part of the product. You are really buying into a full-scale city break: Bosphorus views, neighbourhood-hopping, major food depth, late nights, and multiple clubs with very different matchday feels. The mistake is trying to do too much. Pick a side of the city, anchor yourself in one strong base, and treat matchday logistics seriously because distances and traffic can waste half your day if you get sloppy.",
    topThings: [
      { title: "Bosphorus cruise", tip: "One of the best low-effort ways to understand the city’s scale. Do it early in the trip." },
      { title: "Sultanahmet loop", tip: "Hit Hagia Sophia, Blue Mosque and the square early before crowds get stupid." },
      { title: "Galata & Karaköy", tip: "Best for cafés, bars and easy city-break wandering without rigid planning." },
      { title: "Kadıköy market streets", tip: "Best local-feel food district on the Asian side and ideal around Fenerbahçe trips." },
      { title: "Beşiktaş waterfront", tip: "Strong pre-match district if you want bars, noise and movement." },
      { title: "Balat & Fener", tip: "Good for a slower half-day with character rather than headline landmarks." },
      { title: "Grand Bazaar", tip: "Go with discipline. If you browse aimlessly, you waste hours." },
      { title: "Topkapi Palace", tip: "Worth it if you actually want history. Don’t force it on a tight football weekend." },
      { title: "Rooftop dinner with view", tip: "Book one strong dinner instead of three average ones." },
      { title: "Neighbourhood pub / meyhane night", tip: "The best Istanbul evenings usually come from a good area choice, not from chasing a list." },
    ],
    tips: [
      "Stay central, not near the stadium, unless you only care about one club and zero city experience.",
      "Traffic lies. Always leave more time than you think you need.",
      "For Fenerbahçe, Kadıköy is a real asset, not just a transport stop.",
      "For Galatasaray and Beşiktaş, European-side central stays usually make most sense.",
      "Do not overbuild your itinerary. Istanbul punishes greed.",
      "Use ferries when possible because they improve the trip instead of just moving you.",
      "Big-club matches need proper time buffers before and after full-time.",
      "One elite district per half-day works better than trying to cross the whole city repeatedly.",
    ],
    food: [
      "Kebabs done properly, not tourist-trap versions",
      "Meze and grilled fish by the Bosphorus",
      "Kadıköy casual food crawl",
      "Baklava and Turkish tea stops",
      "Late-night dürüm after the match if needed",
    ],
    transport:
      "Ferries, metro, trams and Marmaray are useful, but the real risk is road traffic. Stay near an area you actually want to spend time in, then plan stadium travel separately and conservatively.",
    accommodation:
      "Taksim / Beyoğlu is the best broad city-break base; Şişli is the best practical modern base; Karaköy / Galata is strong for style and views; Kadıköy is best if your trip is Fenerbahçe-led or you want a more local-feel stay.",
  },

  trabzon: {
    cityId: "trabzon",
    name: "Trabzon",
    country: "Turkey",
    thingsToDoUrl: GYG.trabzon,
    overview:
      "Trabzon is not a polished mainstream football weekend. That is exactly why it works. It feels regional, intense, and distinct from the standard European football-city template. If Istanbul is scale and variety, Trabzon is identity. This is a good trip if you want a proper local football atmosphere and a city that still feels like itself rather than a place arranged for tourists.",
    topThings: [
      { title: "Meydan area walk", tip: "This is your practical centre and best general visitor anchor." },
      { title: "Trabzon seafront", tip: "Best for a calmer reset and easy food stops." },
      { title: "Atatürk Mansion", tip: "Fine if you have spare time; not essential if football is the priority." },
      { title: "Boztepe viewpoint", tip: "Good for tea and city views, especially around sunset." },
      { title: "Local tea houses", tip: "Simple but part of the city rhythm. Don’t overcomplicate it." },
      { title: "Fish restaurants", tip: "One of the better non-football angles in the city." },
      { title: "Central bazaars", tip: "Useful for atmosphere, not a whole-day activity." },
      { title: "Stadium-area approach", tip: "Get there early; let the build-up become part of the experience." },
      { title: "Black Sea coastal drive", tip: "Only if you have time and transport." },
      { title: "Short one-night football stop", tip: "Trabzon works very well in compact form." },
    ],
    tips: [
      "This is a football-first trip with regional flavour, not a luxury city break.",
      "Stay central and keep logistics simple.",
      "Trabzonspor is the emotional centre of the product here.",
      "Seafood and tea are obvious for a reason.",
      "Do not expect Istanbul-level nightlife or attraction density.",
      "If you want a different-feeling football destination, Trabzon delivers.",
    ],
    food: [
      "Fresh Black Sea fish",
      "Trabzon pide",
      "Tea stops with sea or hill views",
      "Simple local grills",
    ],
    transport:
      "Airport access is straightforward. Inside the city, short taxi rides and simple central bases are usually enough.",
    accommodation:
      "Meydan / city centre is the right default. Seafront stays can work well if you want a slightly calmer feel.",
  },

  izmir: {
    cityId: "izmir",
    name: "Izmir",
    country: "Turkey",
    thingsToDoUrl: GYG.izmir,
    overview:
      "Izmir is one of the strongest all-round football-trip cities in Turkey because it combines proper city scale with a more relaxed coastal rhythm than Istanbul. It is easier, cleaner to navigate, and much less exhausting. If you want football plus food plus good weather without the full Istanbul chaos tax, Izmir is a serious option.",
    topThings: [
      { title: "Alsancak wander", tip: "Best all-round district for bars, food and staying." },
      { title: "Kordon seafront", tip: "Great for late afternoon into evening. Let it be slow." },
      { title: "Konak Square", tip: "Useful central reference point, not a huge time sink." },
      { title: "Kemeralti Bazaar", tip: "Good for atmosphere and snacking; go with purpose." },
      { title: "Asansör viewpoint", tip: "Short stop, good views, easy add-on." },
      { title: "Karşıyaka ferry hop", tip: "A nice way to see another side of the city without forcing a big plan." },
      { title: "Seafood dinner", tip: "Izmir rewards one good evening meal by the water." },
      { title: "Coffee and pastry stop in Alsancak", tip: "Better use of time than over-chasing attractions." },
      { title: "Göztepe matchday build-up", tip: "Don’t treat the stadium as a last-minute arrival point." },
      { title: "Çeşme add-on", tip: "Only if you actually have the time. Don’t dilute the football weekend." },
    ],
    tips: [
      "Alsancak is the safest all-round base.",
      "Izmir works best as a relaxed two-night football city break.",
      "You do not need a packed itinerary here.",
      "Göztepe gives the trip real football identity beyond generic coastal-city appeal.",
      "Seafront time matters more here than ticking off landmarks.",
      "This is one of Turkey’s better ‘easy sell’ travel products.",
    ],
    food: [
      "Seafood by the water",
      "Boyoz and breakfast pastries",
      "Meyhane-style dinner",
      "Street snacks around Konak and Alsancak",
    ],
    transport:
      "Izmir is far easier than Istanbul. Ferries, local rail and short taxi rides are enough for most visitors.",
    accommodation:
      "Alsancak is the best overall stay base. Konak is more practical and central. Karşıyaka can work if you want a slightly different local rhythm.",
  },

  samsun: {
    cityId: "samsun",
    name: "Samsun",
    country: "Turkey",
    thingsToDoUrl: GYG.samsun,
    overview:
      "Samsun is a better football stop than outsiders expect. It is not selling itself as a glamorous weekend capital, but it does have a proper coastal-city feel, enough local life to avoid feeling dead, and a clear football-first identity. It works best as a short stay rather than a long itinerary city.",
    topThings: [
      { title: "Seafront promenade", tip: "Best simple walk in the city and ideal for decompressing." },
      { title: "Atakum area", tip: "Best wider leisure district for cafés and a more open coastal feel." },
      { title: "City centre loop", tip: "Keep it compact and practical." },
      { title: "Amisos Hill / cable car area", tip: "Decent short add-on for views if weather is clear." },
      { title: "Waterfront dinner", tip: "The best non-football move in town." },
      { title: "Local café stop", tip: "Samsun is a city where small pauses work well." },
      { title: "Museum / Atatürk sites", tip: "Only if you genuinely want the history layer." },
      { title: "Early stadium approach", tip: "This is part of the trip here, not something to rush." },
      { title: "One-night stop", tip: "Samsun often works best in compact form." },
      { title: "Seaside morning reset", tip: "A strong use of the departure day." },
    ],
    tips: [
      "Best as a short football-led trip.",
      "Seafront or central stays usually make the most sense.",
      "Do not expect a huge attraction list.",
      "Samsun’s value is clean logistics plus real football identity.",
      "Good overnight, not necessarily a long city-break product.",
    ],
    food: [
      "Seafood",
      "Local grills",
      "Casual central cafés",
      "Simple seafront dining",
    ],
    transport:
      "Simple enough. Airport transfers are manageable and city distances are not brutal.",
    accommodation:
      "City centre is the practical base. Atakum is better if you want a more relaxed coastal feel.",
  },

  rize: {
    cityId: "rize",
    name: "Rize",
    country: "Turkey",
    overview:
      "Rize is niche. That is the point. This is not a mass-market football city break; it is a regional Black Sea trip with football layered into it. If you want a standard urban weekend, go elsewhere. If you want somewhere distinctive, green, and properly local-feeling, Rize has real value.",
    topThings: [
      { title: "Rize seafront", tip: "A clean, low-stress way to feel the city." },
      { title: "Tea gardens", tip: "Obvious but essential. Don’t come here and ignore the tea angle." },
      { title: "City centre loop", tip: "Short and functional, not a full-day attraction engine." },
      { title: "Black Sea viewpoints", tip: "Best if weather behaves and you have transport." },
      { title: "Regional food stop", tip: "One of the better off-pitch reasons to visit." },
      { title: "Stadium approach", tip: "Keep it simple and practical." },
      { title: "Trabzon pairing", tip: "Rize often works better when combined with Trabzon." },
      { title: "One- or two-night stay", tip: "That is the right scale for most people." },
      { title: "Tea-shopping stop", tip: "A decent small souvenir angle without nonsense." },
      { title: "Slow morning", tip: "Rize suits a slower pace." },
    ],
    tips: [
      "Treat this as a regional trip, not a glamour-weekend product.",
      "It works well paired with Trabzon.",
      "Weather matters a lot to how the trip feels.",
      "The football angle is stronger if you like distinctive local trips.",
      "Do not expect endless nightlife or attraction density.",
    ],
    food: ["Tea", "Black Sea fish", "Simple local dishes", "Regional breakfast"],
    transport:
      "Rize is straightforward once you accept that it is a smaller regional stop. Trabzon often acts as the wider transport anchor.",
    accommodation:
      "Rize centre is fine for practicality. Wider regional routing via Trabzon can also make sense.",
  },

  izmit: {
    cityId: "izmit",
    name: "Izmit",
    country: "Turkey",
    overview:
      "Izmit is not a glamorous football weekender, but it can work well as a proper football-first stop. The value is not in landmark density or nightlife reputation; it is in regional accessibility, the Marmara setting, and the sense that you are doing a real domestic football trip rather than a polished tourism product.",
    topThings: [
      { title: "City centre walk", tip: "Short, practical and enough for most football weekends." },
      { title: "Waterfront area", tip: "Best for a calmer city feel and easy meals." },
      { title: "Local restaurants", tip: "Keep expectations practical, not luxury-led." },
      { title: "Clock Tower / central landmarks", tip: "Fine as short stops, not day-planners." },
      { title: "Football-led itinerary", tip: "This is the right mentality here." },
      { title: "Nearby regional routing", tip: "Izmit works best as part of a wider Marmara trip if you have time." },
      { title: "Simple overnight stay", tip: "Strongest trip shape." },
      { title: "Stadium travel dry run", tip: "Worth understanding in advance rather than winging it." },
      { title: "Coffee stop in centre", tip: "Useful reset, not a destination city move." },
      { title: "Early start departure city", tip: "This city fits practical routing well." },
    ],
    tips: [
      "Football-first trip, not tourism-first trip.",
      "One-night or two-night maximum is usually enough.",
      "Useful strategically in the region.",
      "Do not oversell what the city itself is.",
      "Works better when expectations are disciplined.",
    ],
    food: ["Practical local restaurants", "Simple grills", "Waterfront dining"],
    transport:
      "Good wider regional positioning helps Izmit. Inside the city, keep things simple.",
    accommodation:
      "Izmit centre is the right default. Yahya Kaptan is fine if you want a tidier hotel-led base.",
  },

  gaziantep: {
    cityId: "gaziantep",
    name: "Gaziantep",
    country: "Turkey",
    overview:
      "Gaziantep is one of Turkey’s strongest food cities, which makes it much more interesting than a standard mid-tier football stop. The football might get you there, but the eating gives the city genuine weekend value. That is the product: football plus serious regional character.",
    topThings: [
      { title: "Old City / Bakırcılar Çarşısı", tip: "Good for atmosphere and city texture." },
      { title: "Baklava mission", tip: "Do it properly. This city earns that reputation." },
      { title: "Kebab-heavy dinner", tip: "A major part of the trip, not an afterthought." },
      { title: "Zeugma Mosaic Museum", tip: "The obvious high-value culture stop if you want one." },
      { title: "Castle area", tip: "Short stop, not a full half-day." },
      { title: "Pistachio shopping", tip: "Makes sense here; doesn’t feel forced." },
      { title: "Football-first afternoon", tip: "Let the food and match structure the day." },
      { title: "One big dinner booking", tip: "Better than drifting between average options." },
      { title: "Short city-centre walk", tip: "Enough to ground the trip." },
      { title: "Departure-day food stop", tip: "Worth making time for." },
    ],
    tips: [
      "One of the better food-led football trips in the league.",
      "Come hungry and structured.",
      "Do not waste the city by eating lazily.",
      "This trip has more off-pitch value than many others in the division.",
      "Works well as a football-plus-food weekend.",
    ],
    food: ["Baklava", "Kebabs", "Pistachio-led desserts", "Regional breakfasts"],
    transport:
      "Simple enough for a compact weekend. Central stays keep the city easy.",
    accommodation:
      "City centre or Old City-adjacent stays are the right play for most visitors.",
  },

  alanya: {
    cityId: "alanya",
    name: "Alanya",
    country: "Turkey",
    overview:
      "Alanya is basically a warm-weather holiday destination with a football fixture attached to it. That is not a criticism. It is the reason to sell it. If you want historic football weight, other clubs beat it. If you want sun, sea, easy leisure and a match in the middle, Alanya is extremely viable.",
    topThings: [
      { title: "Beachfront walk", tip: "This is the core of the trip mood." },
      { title: "Harbour area", tip: "Best for evening movement and easy dinner options." },
      { title: "Alanya Castle", tip: "Worth it if weather is clear and you want a viewpoint moment." },
      { title: "Cable car", tip: "Easy scenic add-on, not something to overhype." },
      { title: "Beach club / slow daytime", tip: "A smarter use of time than forcing generic sightseeing." },
      { title: "Sea-view dinner", tip: "One proper dinner matters here." },
      { title: "Football + leisure split day", tip: "This is the city’s natural format." },
      { title: "Harbour drinks", tip: "Good if you want a softer nightlife option." },
      { title: "Morning swim / walk", tip: "Strong departure-day move in good weather." },
      { title: "Regional transfer stop", tip: "Fine if pairing with Antalya or wider coast travel." },
    ],
    tips: [
      "Sell the holiday angle, not just the football angle.",
      "Best in warm weather.",
      "Very easy to keep this trip relaxed.",
      "Do not force a heavy city itinerary here.",
      "Strong leisure-weekend value.",
    ],
    food: ["Seafood", "Casual beachfront dining", "Turkish grills", "Hotel-area easy options"],
    transport:
      "Simple enough. You are mostly managing hotel-to-centre-to-stadium movement rather than major urban complexity.",
    accommodation:
      "Beachfront or central Alanya both work. Pick based on whether you want nightlife or pure relaxation.",
  },

  ankara: {
    cityId: "ankara",
    name: "Ankara",
    country: "Turkey",
    thingsToDoUrl: GYG.ankara,
    overview:
      "Ankara is more functional than romantic, but that does not make it useless. As a football trip it can work well because it is a real capital city with enough scale, enough food, and enough practical structure to support a tidy weekend. The mistake is expecting Istanbul-style glamour. That is not the product.",
    topThings: [
      { title: "Anıtkabir", tip: "The obvious headline site and genuinely worth doing if you have time." },
      { title: "Kızılay base area", tip: "Best practical city anchor for visitors." },
      { title: "Çankaya evening", tip: "Better restaurants and more polished city rhythm." },
      { title: "Ankara Castle area", tip: "Fine for a short historic-city layer." },
      { title: "Museum visit", tip: "Good if you want one structured cultural block." },
      { title: "Coffee-heavy afternoon", tip: "Ankara suits practical, low-drama city pacing." },
      { title: "Football-led day split", tip: "Usually the smartest structure here." },
      { title: "One proper dinner", tip: "Again, better than wandering into average options." },
      { title: "Short central walk", tip: "Enough to ground the city, not enough to waste hours." },
      { title: "Clean one- or two-night stay", tip: "Ideal trip shape." },
    ],
    tips: [
      "Practical city, not romance city.",
      "Kızılay is the easiest base.",
      "Çankaya gives you a more polished evening layer.",
      "Good for a tidy football trip, not a dreamy wander-heavy weekend.",
      "Set expectations correctly and it works.",
    ],
    food: ["Classic grills", "Central modern restaurants", "Casual café chains and local spots"],
    transport:
      "Predictable enough compared with Istanbul. A sensible central base keeps the trip easy.",
    accommodation:
      "Kızılay is the practical default. Çankaya is better if you want nicer evenings.",
  },

  konya: {
    cityId: "konya",
    name: "Konya",
    country: "Turkey",
    thingsToDoUrl: GYG.konya,
    overview:
      "Konya is a more disciplined, cultural football stop. It is not trying to be an all-night city or a flashy break. The value is in a calmer city with genuine heritage, solid practical structure, and a match folded into a more measured trip. That makes it attractive to the right user and boring to the wrong one.",
    topThings: [
      { title: "Mevlana Museum", tip: "The central attraction and worth doing if you are here." },
      { title: "Alaaddin area", tip: "Good city-centre anchor." },
      { title: "Short old-centre walk", tip: "Enough for atmosphere without overextending." },
      { title: "Traditional Turkish dinner", tip: "Best done properly in one strong sitting." },
      { title: "Tea / coffee stop near centre", tip: "The city suits slower pauses." },
      { title: "Football-first afternoon", tip: "Simple structure works well here." },
      { title: "One-night cultural add-on", tip: "Konya is strong in compact form." },
      { title: "Museum / heritage layer", tip: "This city actually benefits from one proper history block." },
      { title: "Central shopping streets", tip: "Useful filler, not the point of the trip." },
      { title: "Departure-day calm breakfast", tip: "Good city for a low-chaos finish." },
    ],
    tips: [
      "Works best as a measured football-plus-culture trip.",
      "Don’t sell nightlife here.",
      "This is a calmer product than Istanbul or Izmir.",
      "The city repays a slower pace.",
      "Good one- or two-night stop.",
    ],
    food: ["Traditional Konya dishes", "Simple grills", "Tea stops", "Central Turkish breakfasts"],
    transport:
      "City logistics are manageable. Central base plus matchday taxi/transfer works fine.",
    accommodation:
      "City centre or Mevlana area makes the most sense for visitors.",
  },

  antalya: {
    cityId: "antalya",
    name: "Antalya",
    country: "Turkey",
    thingsToDoUrl: GYG.antalya,
    overview:
      "Antalya is one of the easiest football-and-leisure combinations in the league. The football alone does not carry the trip; the destination does. That is not a weakness. It is the sales angle. If someone wants sun, old town, coast, hotels and a match as one event inside a broader weekend, Antalya is one of your better Turkish products.",
    topThings: [
      { title: "Kaleiçi old town", tip: "Best district for atmosphere and wandering." },
      { title: "Harbour / marina area", tip: "Best for easy evening views and dinner." },
      { title: "Konyaaltı beach", tip: "Good if you want the relaxed city-plus-sea angle." },
      { title: "Old-town hotel stay", tip: "Adds a lot more charm than anonymous resort logic." },
      { title: "Boat trip", tip: "Fine add-on if weather is right and schedule allows." },
      { title: "Roman gate / old walls", tip: "Short heritage layer, not a huge time sink." },
      { title: "Sunset dinner", tip: "One of the better simple wins in the city." },
      { title: "Football + beach split day", tip: "This is the obvious format." },
      { title: "Morning promenade walk", tip: "Very strong departure-day move." },
      { title: "Hotel-leisure balance", tip: "Don’t make the trip overbusy; Antalya doesn’t need that." },
    ],
    tips: [
      "One of the best football-plus-sun weekend products in the division.",
      "Kaleiçi is the strongest city-break base.",
      "Konyaaltı is better if beach time matters more.",
      "Don’t turn this into a rigid schedule-heavy city break.",
      "The leisure angle is the product here.",
    ],
    food: ["Seafood", "Old-town Turkish dining", "Beachfront cafés", "Hotel breakfast done properly"],
    transport:
      "Airport access is easy and the trip can be low-friction if you stay in the right area.",
    accommodation:
      "Kaleiçi for atmosphere; Konyaaltı for beach; central hotel stays if you want pure practicality.",
  },

  kayseri: {
    cityId: "kayseri",
    name: "Kayseri",
    country: "Turkey",
    thingsToDoUrl: GYG.kayseri,
    overview:
      "Kayseri is not a headline football-weekend city on its own, but it becomes more interesting when tied to wider regional travel. That is the honest pitch. If someone is doing Cappadocia plus football, it works. If someone wants pure city-break glamour, this is not it.",
    topThings: [
      { title: "Cumhuriyet Meydanı", tip: "Best practical city anchor." },
      { title: "Castle / central heritage area", tip: "Good short stop, not a full day." },
      { title: "Pastırma / mantı food angle", tip: "The city’s strongest off-pitch asset." },
      { title: "Local food mission", tip: "One proper meal matters more than generic sightseeing." },
      { title: "Simple centre walk", tip: "Enough to give the trip shape." },
      { title: "Cappadocia extension", tip: "The strongest wider-use case if you have time." },
      { title: "Football-led overnight", tip: "Usually the smartest format." },
      { title: "Short history stop", tip: "Fine if you need a cultural layer." },
      { title: "Morning central coffee", tip: "Useful low-effort reset." },
      { title: "Airport-friendly departure", tip: "A strength of the trip." },
    ],
    tips: [
      "Best sold with regional travel context.",
      "Good food city, not huge tourism city.",
      "Strong overnight football stop.",
      "Do not oversell it as a luxury city break.",
      "The practical trip works better than the romantic one.",
    ],
    food: ["Mantı", "Pastırma", "Local grills", "Central casual restaurants"],
    transport:
      "Airport proximity is a real asset. City logistics are simple enough for short stays.",
    accommodation:
      "City centre around Cumhuriyet Meydanı is the obvious base.",
  },
};

export default superLigCityGuides;
