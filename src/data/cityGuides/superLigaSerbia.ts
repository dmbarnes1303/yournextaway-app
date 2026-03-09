import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
 */
const GYG = {
  belgrade:
    "https://www.getyourguide.com/en-gb/belgrade-l1688/?partner_id=MAQJREP&utm_medium=online_publisher",
  "novi-sad":
    "https://www.getyourguide.com/en-gb/novi-sad-l2392/?partner_id=MAQJREP&utm_medium=online_publisher",
  nis:
    "https://www.getyourguide.com/en-gb/nis-l32549/?partner_id=MAQJREP&utm_medium=online_publisher",
  subotica:
    "https://www.getyourguide.com/en-gb/subotica-l191110/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const superLigaSerbiaCityGuides: Record<string, CityGuide> = {
  belgrade: {
    cityId: "belgrade",
    name: "Belgrade",
    country: "Serbia",
    thingsToDoUrl: GYG.belgrade,

    overview:
      "Belgrade is one of the strongest football cities in Europe full stop, not just in Serbia. The reason is obvious: Red Star, Partizan, the Eternal Derby, major football history, and a city that already has enough nightlife, food, and energy to carry a weekend without needing the match to do all the work. Then the football arrives and turns the whole thing up several levels. The correct Belgrade trip is not complicated. Stay central, accept that derby and giant-club logistics need real planning, and build the weekend around the football rather than trying to cram fifteen sightseeing tasks into the same 48 hours. This is a city where one huge football moment plus one huge evening usually beats a 'productive' tourist checklist.",

    topThings: [
      {
        title: "Eternal Derby planning",
        tip: "If Red Star v Partizan is on, that is the trip. Everything else becomes secondary immediately.",
      },
      {
        title: "Kalemegdan and fortress loop",
        tip: "Best first move because it gives you city geography, views, and proper Belgrade atmosphere in one clean block.",
      },
      {
        title: "Knez Mihailova and old-centre walk",
        tip: "Do it as a connector, not as some all-day mission. Belgrade is better when you keep moving with purpose.",
      },
      {
        title: "Red Star matchday",
        tip: "Best if you want giant-club scale and one of the biggest football experiences in the region.",
      },
      {
        title: "Partizan matchday",
        tip: "Best if you want another giant historical institution with slightly different texture but equally serious football weight.",
      },
      {
        title: "Skadarlija dinner block",
        tip: "Good if you book or choose smartly. Bad if you drift into the first tourist trap you see.",
      },
      {
        title: "Savamala or central nightlife zone",
        tip: "Belgrade nights are one of the city’s main assets. Use them properly.",
      },
      {
        title: "Riverside / confluence walk",
        tip: "Good morning-after reset if you stayed out hard the night before.",
      },
      {
        title: "Secondary Belgrade club stop",
        tip: "Useful if you want to understand the city beyond Red Star and Partizan, but do not let it dilute the giant-club experience if time is tight.",
      },
      {
        title: "One serious Serbian meal and one serious late night",
        tip: "That combination is usually worth more than overfilling the schedule with average filler.",
      },
    ],

    tips: [
      "Stay central: Stari Grad or Vračar are the smart answers most of the time.",
      "The Eternal Derby is one of the premium fixtures in the entire app.",
      "Big-match logistics are not casual. Arrive early and leave buffer time.",
      "Belgrade is one of those cities where the football and nightlife genuinely strengthen each other.",
      "Do not treat giant-club tickets and travel like last-minute afterthoughts.",
    ],

    food: [
      "Traditional Serbian grills",
      "Kafana dining",
      "Strong meat-heavy comfort food",
      "Late-night street food",
      "One proper dinner reservation instead of random wandering",
    ],

    transport:
      "Belgrade works best when you stay central and use taxis or app-based rides selectively, with walking covering the core city blocks. For giant-club matchdays, the key is not finding the perfect route. It is leaving enough time and not acting like a normal quiet Saturday commute still exists. Derby logic especially is different.",

    accommodation:
      "Stari Grad is the cleanest all-round choice for nightlife, city feel, and football-weekend energy. Vračar is also excellent, especially if easier access to the big stadium district matters. Do not stay far out to save a little money and then wreck the whole flow.",
  },

  "novi-sad": {
    cityId: "novi-sad",
    name: "Novi Sad",
    country: "Serbia",
    thingsToDoUrl: GYG["novi-sad"],

    overview:
      "Novi Sad is one of the best balanced football weekends in the whole Serbia set because it gives you a real club in Vojvodina and one of the most pleasant, easiest city-break environments in the region. It is calmer than Belgrade, less intense than the giant derby world, but that is exactly why it works so well. The city is compact, attractive, bar-friendly, and easy to enjoy without overplanning. The smart Novi Sad trip is simple: stay central, use the city on foot, and let the football sit inside a weekend that already feels good even before kickoff.",

    topThings: [
      {
        title: "Vojvodina matchday",
        tip: "The football anchor of the trip and the reason Novi Sad matters in the Serbian app footprint.",
      },
      {
        title: "Old centre and pedestrian streets",
        tip: "Best opening block because the city immediately feels clean, liveable, and easy.",
      },
      {
        title: "Petrovaradin Fortress",
        tip: "One of the city’s obvious wins. Do it early or late, not in the most crowded middle of the day.",
      },
      {
        title: "Danube-side walk",
        tip: "Perfect as a low-effort reset before dinner or the morning after the match.",
      },
      {
        title: "One proper central dinner",
        tip: "Novi Sad is good enough that you should not settle for random mediocre food.",
      },
      {
        title: "Wine or café block in the centre",
        tip: "This city rewards slower pacing better than frantic checklist tourism.",
      },
      {
        title: "Pre-match city-centre build-up",
        tip: "A major advantage here is that the city and football feel naturally connected rather than separated.",
      },
      {
        title: "One-night or two-night split",
        tip: "Two nights is ideal if you want both the football and the city to breathe properly.",
      },
      {
        title: "Subotica or northern Serbia pair-up",
        tip: "Only if you have extra time. Do not weaken a clean Novi Sad weekend just to tick more boxes.",
      },
      {
        title: "Morning coffee and bakery routine",
        tip: "Novi Sad suits this more than almost any other city in the Serbian set.",
      },
    ],

    tips: [
      "Stay central. The city is best on foot.",
      "This is one of the strongest football-plus-city breaks in the whole Serbian league map.",
      "Vojvodina give the trip football credibility without needing Belgrade’s chaos.",
      "Two nights is the sweet spot.",
      "Novi Sad works best when you keep the itinerary clean and do not overcomplicate it.",
    ],

    food: [
      "Traditional Serbian food",
      "Central European-influenced local dishes",
      "Good city-centre cafés",
      "Proper sit-down dinner in the old centre",
      "Wine bars and smart casual spots",
    ],

    transport:
      "Novi Sad is straightforward. Most of the core city makes sense on foot, and short taxi rides fill any gaps. This is one of the lowest-friction football city trips in the app, which is a big part of why it scores so well overall.",

    accommodation:
      "Stay in or right next to the city centre. That is the clear best answer for restaurants, bars, walkability, and a smooth match weekend.",
  },

  pancevo: {
    cityId: "pancevo",
    name: "Pančevo",
    country: "Serbia",

    overview:
      "Pančevo is not a premium standalone football city break. The right way to do it is to treat Železničar Pančevo as a football branch off a Belgrade base. That is the obvious answer and there is no point pretending otherwise. The city has local value and the club have local meaning, but the wider trip quality overwhelmingly sits in Belgrade. This is a useful stop for serious Serbian league coverage, not a glamour weekend recommendation.",

    topThings: [
      {
        title: "Železničar Pančevo matchday",
        tip: "This is the only real reason the trip exists in the app. Treat it accordingly.",
      },
      {
        title: "Belgrade-based stay",
        tip: "The correct move for almost every visitor unless you have a very specific local reason not to.",
      },
      {
        title: "Short Pančevo orientation",
        tip: "Enough to place the city, but do not try to force a giant-city itinerary out of it.",
      },
      {
        title: "Simple local pre-match meal",
        tip: "Fine if practical, but the better broader dining choices remain in Belgrade.",
      },
      {
        title: "Post-match return to Belgrade",
        tip: "Usually the smartest move if you want the weekend to retain quality.",
      },
      {
        title: "Belgrade football pair-up",
        tip: "This stop makes more sense when folded into a wider capital football trip.",
      },
      {
        title: "One-night route logic",
        tip: "Usually enough if the fixture is the main target.",
      },
      {
        title: "Smaller-club realism",
        tip: "This is for league-depth travellers, not for giant-stadium tourists.",
      },
      {
        title: "Easy half-day football branch",
        tip: "That is the best mindset for the stop overall.",
      },
      {
        title: "Morning return to the main base",
        tip: "Keep the trip practical and honest.",
      },
    ],

    tips: [
      "Stay in Belgrade, not Pančevo, unless convenience is your only goal.",
      "This is a football-depth stop, not a primary Serbia weekend.",
      "Works best as part of a wider Belgrade trip.",
      "Do not overplan it.",
      "Best for serious domestic-football travellers.",
    ],

    food: [
      "Simple local restaurants",
      "Basic cafés",
      "Better nightlife and dinner options in Belgrade",
      "One practical pre-match meal",
    ],

    transport:
      "The only real decision is where you base yourself, and the answer is usually Belgrade. Once you accept that, the Pančevo football leg becomes straightforward enough.",

    accommodation:
      "Belgrade is the right base nearly every time. Pančevo only makes sense if you want maximum simplicity for the fixture and do not care about broader weekend quality.",
  },

  "novi-pazar": {
    cityId: "novi-pazar",
    name: "Novi Pazar",
    country: "Serbia",

    overview:
      "Novi Pazar is one of the most distinctive football trips in the Serbian set because the city has a clear identity, the club have real local emotional weight, and the whole weekend feels different from the rest of the league map. It is not the easiest logistics trip, which means you need to stop being lazy about transport planning, but that effort is exactly what makes the stop more memorable. This is a football-first trip with cultural and regional depth, not a polished easy-mode city break.",

    topThings: [
      {
        title: "Novi Pazar matchday",
        tip: "The clear centrepiece and the reason the trip matters.",
      },
      {
        title: "City-centre orientation walk",
        tip: "Useful because the place has a clearly different feel from the standard Serbian football-city template.",
      },
      {
        title: "One serious local meal",
        tip: "The city is worth engaging with properly, not just as a stadium transfer point.",
      },
      {
        title: "Market and central-street block",
        tip: "Good for understanding the rhythm of the city without wasting the whole day.",
      },
      {
        title: "Pre-match build-up in town",
        tip: "This is where the local identity becomes obvious, so do not rush straight to the ground too late.",
      },
      {
        title: "One-night focused football trip",
        tip: "Enough for many people, but only if logistics are well planned.",
      },
      {
        title: "Regional-culture mindset",
        tip: "You get more from this city if you stop expecting it to behave like Belgrade or Novi Sad.",
      },
      {
        title: "Post-match central return",
        tip: "The city itself is part of why the football stop matters.",
      },
      {
        title: "Early transport planning",
        tip: "This is non-negotiable. Last-minute optimism is how you turn a good stop into a stupid one.",
      },
      {
        title: "Route discipline",
        tip: "Treat it as a focused destination, not a casual detour.",
      },
    ],

    tips: [
      "Plan transport first. This is not a lazy late-booking trip.",
      "One of the most distinctive Serbian football trips outside the giants.",
      "Best for serious domestic-football travellers.",
      "The city has real identity, so give it proper time.",
      "Do not compare it to Belgrade. That misses the point.",
    ],

    food: [
      "Strong local grilled dishes",
      "Regional specialties",
      "Traditional cafés",
      "One proper city-centre dinner",
      "Bakery and coffee stops",
    ],

    transport:
      "The difficulty here is not moving around once you are in Novi Pazar. It is getting there cleanly and without bad planning. Solve the route first, then the city itself becomes manageable.",

    accommodation:
      "Stay centrally. This is the simplest and smartest way to keep the city and football connected without creating unnecessary friction.",
  },

  nis: {
    cityId: "nis",
    name: "Niš",
    country: "Serbia",
    thingsToDoUrl: GYG.nis,

    overview:
      "Niš is one of the best non-Belgrade football cities in Serbia because it combines a traditional club in Radnički with a genuinely easy travel setup, a real city centre, and enough identity that the weekend feels substantial rather than improvised. It is less glamorous than Belgrade and less polished than Novi Sad, but that is not a weakness. It feels more direct. The smart Niš trip is simple: stay central, let the city centre and fortress area carry the non-football time, and build the weekend around Radnički at Čair.",

    topThings: [
      {
        title: "Radnički Niš matchday",
        tip: "The football reason to come and still one of the stronger non-Belgrade club experiences in Serbia.",
      },
      {
        title: "Niš Fortress and river area",
        tip: "Best first-day block because it gives you city shape without wasting half the weekend.",
      },
      {
        title: "Central square and pedestrian zone",
        tip: "Good connector block for coffee, food, and city feel.",
      },
      {
        title: "One serious Niš dinner",
        tip: "Do not underrate the city’s food. Book or choose with actual intent.",
      },
      {
        title: "Skull Tower or one meaningful historical stop",
        tip: "Do one properly rather than scattering weakly across several sites.",
      },
      {
        title: "Pre-match city-centre build-up",
        tip: "Niš works well because the city and football feel naturally linked.",
      },
      {
        title: "Compact one-night football trip",
        tip: "Very doable here because logistics are much easier than in many other regional Serbia stops.",
      },
      {
        title: "Airport-to-city efficiency",
        tip: "A genuine advantage. Use it.",
      },
      {
        title: "Morning café reset",
        tip: "Niš suits a clean, lower-chaos weekend rhythm.",
      },
      {
        title: "Straightforward football weekend planning",
        tip: "One of the city’s biggest strengths is that you do not need to overengineer it.",
      },
    ],

    tips: [
      "Niš is one of the easiest football-city trips in the Serbian set.",
      "Stay centrally.",
      "Radnički give the trip real traditional-club credibility.",
      "A very strong one-night or two-night football weekend.",
      "Good for travellers who want serious football without Belgrade’s scale and hassle.",
    ],

    food: [
      "Serbian grilled food",
      "Traditional kafana options",
      "Strong regional meat dishes",
      "Central cafés",
      "One proper dinner in the city core",
    ],

    transport:
      "Niš is easy by Serbian regional standards. Stay central, walk most of the core, and use short rides only when needed. The airport advantage is real and makes the city more practical than many people expect.",

    accommodation:
      "Central Niš is the clear best answer. It keeps the city simple, the football easy, and the whole weekend low-friction.",
  },

  zaječar: {
    cityId: "zajecar",
    name: "Zaječar",
    country: "Serbia",

    overview:
      "Zaječar only makes sense in this context if you are going specifically for the current OFK Beograd listed venue reality. That means this is not a classic Belgrade historic-club weekend. It is a venue-context stop. Treat it honestly or do not bother. The city itself can work for a practical overnight, but the main reason to come is to observe a traditional club under unusual present conditions, not to chase one of Serbia’s flagship football-travel experiences.",

    topThings: [
      {
        title: "OFK Beograd current-venue matchday",
        tip: "The only real football reason this stop belongs in the route right now.",
      },
      {
        title: "Short town-centre orientation",
        tip: "Enough to understand the setting, no need to force an oversized itinerary.",
      },
      {
        title: "One practical local dinner",
        tip: "Keep the stop realistic and useful.",
      },
      {
        title: "Stadium-context trip logic",
        tip: "This is about understanding current Serbian football reality, not nostalgia tourism alone.",
      },
      {
        title: "One-night football stop",
        tip: "Usually enough if the match is the main purpose.",
      },
      {
        title: "Pre-match route simplicity",
        tip: "Do not overcomplicate a trip whose value is already quite specific.",
      },
      {
        title: "Morning move-on",
        tip: "The stop works best when kept concise.",
      },
      {
        title: "Purist football mindset",
        tip: "Casual travellers will probably get less from this than serious domestic-league followers.",
      },
      {
        title: "Route honesty",
        tip: "This is not a replacement for a true Belgrade OFK experience.",
      },
      {
        title: "Practical over romantic mindset",
        tip: "That is how the stop becomes worthwhile.",
      },
    ],

    tips: [
      "Only do this if you understand the OFK venue context properly.",
      "This is not a standard Belgrade football weekend.",
      "Best for football purists and league-depth travellers.",
      "Keep expectations practical.",
      "One-night stop is usually enough.",
    ],

    food: [
      "Simple local restaurants",
      "Basic Serbian dishes",
      "Practical café stops",
      "One straightforward dinner",
    ],

    transport:
      "The trip is mainly about getting to the correct current venue cleanly. Local city movement is not the main challenge. Understanding why you are there is.",

    accommodation:
      "Stay centrally if staying overnight. There is little reason to overcomplicate a very context-specific stop like this.",
  },

  kragujevac: {
    cityId: "kragujevac",
    name: "Kragujevac",
    country: "Serbia",

    overview:
      "Kragujevac is a strong football-first city stop if you want a serious Serbian club outside the capital and without the awkward remoteness of some smaller regional destinations. Radnički 1923 give the city real football meaning, and the trip works best when kept focused rather than dressed up as some giant tourism weekend. The appeal here is substance, not spectacle: proper city, proper club, proper domestic-football logic.",

    topThings: [
      {
        title: "Radnički 1923 matchday",
        tip: "The football centrepiece and the reason Kragujevac matters in the app.",
      },
      {
        title: "Central city orientation",
        tip: "Useful to place the club inside the city rather than treating the trip as a pure stadium transfer.",
      },
      {
        title: "One practical but good local meal",
        tip: "Kragujevac suits a grounded, football-first rhythm.",
      },
      {
        title: "Pre-match city build-up",
        tip: "Worth doing because this is a city-club relationship, not just a random venue.",
      },
      {
        title: "One-night football stop",
        tip: "Very workable if the fixture is the main purpose.",
      },
      {
        title: "Simple regional route logic",
        tip: "This trip works better when cleanly planned than when overloaded with side ideas.",
      },
      {
        title: "Post-match city-centre return",
        tip: "The stop lands better when you keep the evening compact and local.",
      },
      {
        title: "Traditional-club mindset",
        tip: "This is what makes Kragujevac interesting. Do not expect giant-club theatre.",
      },
      {
        title: "Morning coffee and move-on",
        tip: "A good fit for this sort of weekend.",
      },
      {
        title: "Practical football-city break",
        tip: "That is the right way to think about Kragujevac overall.",
      },
    ],

    tips: [
      "Kragujevac is a strong football-first Serbia stop.",
      "Radnički 1923 give the city real credibility.",
      "Best for travellers who value actual domestic clubs over flashy tourism framing.",
      "Keep the weekend simple and it works well.",
      "One-night or two-night max is usually enough.",
    ],

    food: [
      "Traditional Serbian food",
      "Local grills",
      "Central cafés",
      "One proper dinner in town",
    ],

    transport:
      "This is a practical city, not a complicated one. The real win is that the club and city still feel naturally connected, so central basing solves most of the trip cleanly.",

    accommodation:
      "Stay centrally. That gives you the best balance of city access, simple matchday logistics, and overall trip flow.",
  },

  "backa-topola": {
    cityId: "backa-topola",
    name: "Bačka Topola",
    country: "Serbia",

    overview:
      "Bačka Topola is not a classic city-break trip. It is a modern-project football stop built around TSC and little else at headline-travel level. That is not necessarily a criticism. It just means you need to plan it properly. The smartest way to approach it is either as a focused short football stop or as a branch off a stronger nearby base like Subotica. You go because you care about modern Serbian club development, not because the city sells itself like Novi Sad or Belgrade.",

    topThings: [
      {
        title: "TSC matchday",
        tip: "The entire reason the stop exists at this level of travel relevance.",
      },
      {
        title: "Modern-project club focus",
        tip: "This is what makes the stop interesting. Lean into it.",
      },
      {
        title: "Short local orientation",
        tip: "Enough to place yourself, not enough to pretend this is a giant city-break environment.",
      },
      {
        title: "Subotica-based option",
        tip: "Often the smarter wider travel move if you want more hotel and city value.",
      },
      {
        title: "One practical local meal",
        tip: "Keep the stop efficient and honest.",
      },
      {
        title: "One-night football trip",
        tip: "Usually enough locally.",
      },
      {
        title: "Northern Serbia route pairing",
        tip: "Works well with Novi Sad or Subotica if done properly.",
      },
      {
        title: "Pre-match arrival with time",
        tip: "Useful if you want to understand the club and venue rather than just tick a fixture.",
      },
      {
        title: "Project-club mindset",
        tip: "This is a trip for football structure nerds more than atmosphere hunters.",
      },
      {
        title: "Morning move-on",
        tip: "Best when kept concise.",
      },
    ],

    tips: [
      "Bačka Topola is a football stop, not a major city break.",
      "TSC are the reason to go.",
      "Subotica is often the better nearby stay base.",
      "Best for travellers who actually care about modern club projects.",
      "Do not oversell the town to yourself.",
    ],

    food: [
      "Simple regional dining",
      "Basic cafés",
      "One practical meal",
      "Better broader options in Subotica if staying there",
    ],

    transport:
      "This is another trip where the key question is not local transport complexity but where you choose to sleep. If you solve the base properly, the fixture is easy enough.",

    accommodation:
      "Bačka Topola works for a football-only overnight. Subotica is often the better choice if you want stronger hotels, architecture, and broader weekend value.",
  },

  loznica: {
    cityId: "loznica",
    name: "Loznica",
    country: "Serbia",

    overview:
      "Loznica only really makes sense in the app right now because of IMT’s listed current home arrangement. That means the stop is venue-context first, city-break second. The city can work for a practical overnight, but the real point is understanding the current football logistics rather than chasing a classic Belgrade-associated club experience. Treat it like that and it becomes coherent. Pretend it is something bigger and you are just setting yourself up to misunderstand the whole trip.",

    topThings: [
      {
        title: "IMT current-venue matchday",
        tip: "The core reason the stop matters in the current Serbian league map.",
      },
      {
        title: "Short city-centre orientation",
        tip: "Enough to settle the place, no need to overinflate it into a giant itinerary.",
      },
      {
        title: "One practical meal",
        tip: "Keep the stop efficient and football-led.",
      },
      {
        title: "Venue-reality mindset",
        tip: "This is not a normal Belgrade-linked club trip.",
      },
      {
        title: "One-night stop",
        tip: "Usually enough unless route logistics demand more.",
      },
      {
        title: "Pre-match simplicity",
        tip: "Do not complicate an already context-specific trip.",
      },
      {
        title: "Morning move-on",
        tip: "The right way to handle this kind of stop.",
      },
      {
        title: "Football-purist value",
        tip: "Only really worth it if you care about the actual live league structure.",
      },
      {
        title: "Route honesty",
        tip: "The point is current venue context, not giant-club nostalgia.",
      },
      {
        title: "Practical overnight logic",
        tip: "That is what makes the stop useful.",
      },
    ],

    tips: [
      "Only do this if you understand the IMT venue reality.",
      "This is not a standard Belgrade football experience.",
      "Best for serious domestic-football travellers.",
      "Keep expectations practical.",
      "One-night stop is usually enough.",
    ],

    food: [
      "Simple local dining",
      "Basic Serbian dishes",
      "One straightforward dinner",
      "Café stops",
    ],

    transport:
      "The main issue is getting the wider route right, not moving around Loznica itself. This is a context stop before it is anything else.",

    accommodation:
      "Stay centrally if overnighting. Do not overcomplicate a trip whose main value is tied to the venue situation.",
  },

  ivanjica: {
    cityId: "ivanjica",
    name: "Ivanjica",
    country: "Serbia",

    overview:
      "Ivanjica is one of the purest football-depth stops in the Serbian set. Javor are the whole reason to go, and the city itself is there to support that football reality rather than to compete with it as a giant tourism destination. That is fine. In fact it is part of the appeal if you like proper domestic-football travel rather than soft-focus curated weekends. This is a serious smaller-town football stop. Treat it that way.",

    topThings: [
      {
        title: "Javor matchday",
        tip: "The football is the trip. Everything else is secondary.",
      },
      {
        title: "Short town-centre orientation",
        tip: "Enough to understand the setting without pretending there is a giant city-break agenda here.",
      },
      {
        title: "One practical local meal",
        tip: "Keep the weekend aligned with reality.",
      },
      {
        title: "Pre-match local café time",
        tip: "Useful for getting the rhythm of a smaller-town football stop.",
      },
      {
        title: "One-night football overnight",
        tip: "Usually enough unless your route forces otherwise.",
      },
      {
        title: "Čačak-based alternative",
        tip: "Worth considering if you want more accommodation choice around the football leg.",
      },
      {
        title: "Smaller-club realism",
        tip: "This is absolutely not a glamour stop, and that is the point.",
      },
      {
        title: "Morning move-on",
        tip: "Best when the trip stays compact.",
      },
      {
        title: "League-depth reward",
        tip: "Completionists and serious domestic-football travellers will get more from this than casual fans.",
      },
      {
        title: "Regional football texture",
        tip: "That is the real value of the stop overall.",
      },
    ],

    tips: [
      "Javor are the reason to go.",
      "This is a football-depth Serbia stop, not a mainstream city break.",
      "Plan travel properly.",
      "Best for serious domestic-football travellers.",
      "Keep expectations realistic and the stop works.",
    ],

    food: [
      "Simple local food",
      "Traditional Serbian meals",
      "Basic cafés",
      "One practical dinner",
    ],

    transport:
      "The challenge is wider route planning more than movement within Ivanjica itself. Once there, the stop is straightforward enough.",

    accommodation:
      "Stay in Ivanjica for simplicity or consider Čačak if you want a stronger wider service base.",
  },

  lučani: {
    cityId: "lucani",
    name: "Lučani",
    country: "Serbia",

    overview:
      "Lučani is another honest smaller-club stop: football-first, low-glamour, locally rooted, and only really rewarding if you understand the value of seeing how deep a league actually runs beneath its biggest brands. Mladost are the point. The town is the setting. That is enough. Not every trip needs to pretend to be something broader than it is.",

    topThings: [
      {
        title: "Mladost Lučani matchday",
        tip: "The whole reason this stop belongs in the route.",
      },
      {
        title: "Short local orientation",
        tip: "Enough to place yourself, no need to force a fake sightseeing checklist.",
      },
      {
        title: "One practical meal",
        tip: "Keep it efficient and football-led.",
      },
      {
        title: "Čačak-based stay option",
        tip: "Often smarter if you want a slightly stronger overnight base.",
      },
      {
        title: "Small-ground football realism",
        tip: "This is what makes the trip interesting to the right person.",
      },
      {
        title: "Pre-match arrival with time",
        tip: "Worth doing because local clubs like this feel better when not rushed.",
      },
      {
        title: "One-night stop",
        tip: "Usually all you need.",
      },
      {
        title: "Morning departure",
        tip: "The right rhythm for a stop like this.",
      },
      {
        title: "League-depth focus",
        tip: "This is not for casual highlight tourists.",
      },
      {
        title: "Practical route value",
        tip: "Works best as part of a broader Serbia circuit.",
      },
    ],

    tips: [
      "Mladost are the reason to go.",
      "This is a football-depth, smaller-club stop.",
      "Čačak is often the better nearby base.",
      "Do not overplan it.",
      "Best for serious domestic-football travellers.",
    ],

    food: [
      "Simple local dining",
      "Traditional Serbian food",
      "Basic café stops",
      "One practical dinner",
    ],

    transport:
      "This is another trip where your main decision is where you sleep, not how you move locally. Solve the base and the football stop becomes simple enough.",

    accommodation:
      "Lučani is fine for pure match convenience. Čačak is usually better if you want stronger hotels and broader trip practicality.",
  },

  subotica: {
    cityId: "subotica",
    name: "Subotica",
    country: "Serbia",
    thingsToDoUrl: GYG.subotica,

    overview:
      "Subotica is one of the most underrated city-break football stops in the Serbian set because the city itself is attractive, distinctive, and architecturally stronger than many places at this level, while Spartak give it enough football logic to justify the trip beyond just pretty buildings. It is not a giant atmosphere destination, but it does not need to be. The weekend works because the city is genuinely pleasant and the football gives the break a proper shape. The smart Subotica trip is relaxed, central, and well-paced.",

    topThings: [
      {
        title: "Spartak Subotica matchday",
        tip: "The football reason the city enters the route and still worth doing as the anchor event.",
      },
      {
        title: "Art Nouveau city-centre walk",
        tip: "One of the strongest non-football city blocks in the whole Serbian league map.",
      },
      {
        title: "Town Hall and central-square orientation",
        tip: "Best first move because Subotica’s visual character reveals itself quickly.",
      },
      {
        title: "One proper central dinner",
        tip: "Subotica is good enough that you should eat properly rather than lazily.",
      },
      {
        title: "Synagogue or one major architectural stop",
        tip: "Do one serious city-culture block, not ten scattered ones.",
      },
      {
        title: "Café and pastry morning",
        tip: "The city suits a slower, cleaner rhythm than Belgrade.",
      },
      {
        title: "Northern-Serbia route pairing",
        tip: "Works well with TSC or Novi Sad if you have the time.",
      },
      {
        title: "Pre-match central build-up",
        tip: "The city is compact enough that the football weekend stays smooth.",
      },
      {
        title: "One-night or two-night city-football break",
        tip: "Either works. Two nights lets the city breathe properly.",
      },
      {
        title: "Balanced football-weekend mindset",
        tip: "This is more about a good overall trip than about one insane atmosphere peak.",
      },
    ],

    tips: [
      "Subotica is one of the best smaller city-break bases in the Serbia set.",
      "Stay central.",
      "Spartak are a useful football anchor, but the city itself does a lot of the work.",
      "Great if you want a calmer football weekend with actual visual character.",
      "Do not expect giant-club theatre. That is not the point here.",
    ],

    food: [
      "Central European-influenced regional dishes",
      "Traditional Serbian meals",
      "Good cafés and pastries",
      "One proper central dinner",
      "Wine or slower evening dining",
    ],

    transport:
      "Subotica works best on foot once you are central. The city is compact and visually coherent, which is one of its major strengths as a football weekend base.",

    accommodation:
      "Stay in the centre. It is the obvious and correct answer for architecture, food, walkability, and smooth football-weekend flow.",
  },

  kruševac: {
    cityId: "krusevac",
    name: "Kruševac",
    country: "Serbia",

    overview:
      "Kruševac is a practical traditional-club stop rather than a glamour city break. Napredak give it football meaning and the city gives you enough structure to make the trip workable, but this is not a place you should oversell to yourself. It works when treated honestly: one real club, one real city, one clean football-first weekend. That is enough.",

    topThings: [
      {
        title: "Napredak matchday",
        tip: "The football reason the city matters in the route.",
      },
      {
        title: "Short central orientation",
        tip: "Enough to place the city and keep the football connected to it.",
      },
      {
        title: "One practical local meal",
        tip: "This is not the trip for hyper-ambitious lifestyle planning.",
      },
      {
        title: "Pre-match city-centre block",
        tip: "Useful for giving the day some shape before kickoff.",
      },
      {
        title: "One-night football trip",
        tip: "Usually enough unless you are deliberately slowing the route down.",
      },
      {
        title: "Traditional-club mindset",
        tip: "That is the real value of the stop, not giant tourism pull.",
      },
      {
        title: "Quiet post-match evening",
        tip: "Enough to complete the weekend without forcing nightlife that is not really the point.",
      },
      {
        title: "Morning coffee and move-on",
        tip: "A good fit for this kind of stop.",
      },
      {
        title: "Broader Serbia route logic",
        tip: "Works better as part of a wider domestic circuit than as a headline destination.",
      },
      {
        title: "Grounded football travel mindset",
        tip: "Exactly what this trip rewards.",
      },
    ],

    tips: [
      "Napredak are the reason to go.",
      "This is a practical football-first Serbia stop.",
      "Best for serious domestic-football travellers.",
      "Keep the plan clean and realistic.",
      "One-night stay is usually enough.",
    ],

    food: [
      "Traditional Serbian dishes",
      "Simple local restaurants",
      "Basic cafés",
      "One practical sit-down dinner",
    ],

    transport:
      "Kruševac is not complicated. The real question is whether it fits cleanly into your wider route. Once there, central basing keeps everything simple enough.",

    accommodation:
      "Stay centrally. There is little value in making a place like Kruševac harder than it needs to be.",
  },
};

export default superLigaSerbiaCityGuides;
