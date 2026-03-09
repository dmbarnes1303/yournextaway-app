import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
 */
const GYG = {
  sarajevo:
    "https://www.getyourguide.com/en-gb/sarajevo-l2281/?partner_id=MAQJREP&utm_medium=online_publisher",
  mostar:
    "https://www.getyourguide.com/en-gb/mostar-l1334/?partner_id=MAQJREP&utm_medium=online_publisher",
  banjaLuka:
    "https://www.getyourguide.com/en-gb/banja-luka-l142749/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const premierLeagueBosniaCityGuides: Record<string, CityGuide> = {
  sarajevo: {
    cityId: "sarajevo",
    name: "Sarajevo",
    country: "Bosnia and Herzegovina",
    thingsToDoUrl: GYG.sarajevo,

    overview:
      "Sarajevo is the most important football city in Bosnia and Herzegovina because it combines one of the league’s defining derbies with the country’s deepest urban identity, strongest visitor pull, and most emotionally loaded football culture. This is not just the capital. It is the place where football, history, politics, memory, and city pride crash into each other hardest. The correct Sarajevo trip is not overplanned. Stay central or in the old-town orbit, keep your city blocks tight and meaningful, and build the whole weekend around the football if the derby is on. Sarajevo rewards seriousness. If you treat it like a cheap random city break with a game attached, you are wasting the point of being there.",

    topThings: [
      {
        title: "Baščaršija and old-town orientation walk",
        tip: "Do this first. It gives the city its shape immediately and stops you wandering around like you do not know what Sarajevo actually is.",
      },
      {
        title: "Sarajevo derby planning",
        tip: "If FK Sarajevo v Željezničar is on, that is the weekend. Everything else is secondary.",
      },
      {
        title: "Tunnel of Hope or one serious war-history stop",
        tip: "Do one properly. Do not cheapen the city by trying to turn its history into a rushed attraction checklist.",
      },
      {
        title: "Latin Bridge and central historical loop",
        tip: "High value because it anchors the city’s wider story without demanding an entire day.",
      },
      {
        title: "FK Sarajevo matchday",
        tip: "Best if you want the scale and major-club side of the city.",
      },
      {
        title: "Željezničar matchday",
        tip: "Best if you want a grittier stadium culture and one of the country’s most iconic football homes.",
      },
      {
        title: "Yellow Fortress viewpoint",
        tip: "Good late afternoon move. Quick payoff, no need to pretend it is a half-day plan.",
      },
      {
        title: "One serious Bosnian dinner",
        tip: "Book properly. Sarajevo deserves better than random tourist-trap drift.",
      },
      {
        title: "Coffee culture block",
        tip: "This city suits deliberate pauses. Do not rush every hour.",
      },
      {
        title: "Post-match central return",
        tip: "The city core is where the football emotions settle properly after the game.",
      },
    ],

    tips: [
      "Stay in or near Baščaršija or the central zone. Do not stay near the stadium unless you enjoy making your trip worse.",
      "The Sarajevo derby is one of the essential fixtures in the whole app.",
      "This is a football city first, but also one of the strongest city-break destinations in the entire database.",
      "Do not overbook museums and excursions. The city atmosphere itself does a lot of the work.",
      "Sarajevo is best when you combine one meaningful history block, one meaningful football block, and one genuinely good evening.",
    ],

    food: [
      "Ćevapi",
      "Traditional Bosnian grills",
      "Burek and bakery stops",
      "Strong coffee-house sessions",
      "One proper old-town dinner instead of five random snacks",
    ],

    transport:
      "Sarajevo is manageable if you stay central and stop trying to optimise every ten minutes. The old town and core city areas are easy to work on foot, while taxis fill the gaps to stadiums and outer historical stops. This is not a city where hyper-efficiency matters. Good base choice matters far more.",

    accommodation:
      "Baščaršija, the old-town edge, or central Sarajevo are the right answers. They give you the strongest city feel, easiest evening flow, and the cleanest football-weekend logic.",
  },

  mostar: {
    cityId: "mostar",
    name: "Mostar",
    country: "Bosnia and Herzegovina",
    thingsToDoUrl: GYG.mostar,

    overview:
      "Mostar is one of the most compelling football cities in the whole app because the city itself is visually iconic and the football culture is split by one of the most charged rivalries in Bosnia and Herzegovina. Zrinjski and Velež are not just two clubs sharing a place. They represent one of the strongest football fault lines in the country. That is what makes Mostar so good. The trip works when you stay near the old town, let the city’s walkable beauty do its job, and then treat the football as the emotional centrepiece rather than some optional evening add-on.",

    topThings: [
      {
        title: "Old Bridge and old-town loop",
        tip: "Obvious, but still the right first move. Mostar reveals itself quickly and visually.",
      },
      {
        title: "Mostar derby planning",
        tip: "If Zrinjski v Velež is on, that is one of the premium fixtures in the whole league set.",
      },
      {
        title: "Riverside and bridge-view evening walk",
        tip: "Best done around sunset when the city looks absurdly good for very little effort.",
      },
      {
        title: "Zrinjski matchday",
        tip: "Best if you want one of Bosnia’s modern heavyweight clubs in a highly charged city context.",
      },
      {
        title: "Velež matchday",
        tip: "Best if you want the more emotionally layered traditional-club experience.",
      },
      {
        title: "Koski Mehmed Pasha Mosque viewpoint",
        tip: "Short high-value stop. Do not let it turn into a long detour.",
      },
      {
        title: "War-history and rebuilt-city context",
        tip: "Worth understanding because the football rivalry makes less sense if you ignore the city’s deeper realities.",
      },
      {
        title: "One old-town dinner",
        tip: "Book smart and stay close to the historic centre. Mostar is best when the evenings stay compact.",
      },
      {
        title: "Day-trip discipline",
        tip: "You can add Blagaj or nearby stops if staying longer, but do not let side quests weaken the football trip.",
      },
      {
        title: "One-night or two-night split",
        tip: "One night works. Two nights is better if you want the city and football to both breathe.",
      },
    ],

    tips: [
      "Stay in or around Mostar Old Town.",
      "The city is compact enough that you do not need to overthink it.",
      "The derby is the headline football event. Everything else is supporting structure.",
      "Mostar is one of the strongest football-plus-city-break combinations in the app.",
      "Do not get cute with accommodation far out of town to save a few quid. It is stupid and kills the flow.",
    ],

    food: [
      "Bosnian grills",
      "Old-town riverside restaurants",
      "Traditional stews and local dishes",
      "Coffee and pastry stops",
      "One proper evening meal with a bridge or river setting if possible",
    ],

    transport:
      "Mostar is easy because the centre is walkable and the city is not huge. The main planning question is not transport. It is whether you have chosen the right base near the old core. Once that is sorted, the football and city both become simple.",

    accommodation:
      "Old Town or just outside it is the right answer. It gives you the best visual setting, easiest evening flow, and the strongest overall weekend structure.",
  },

  "banja-luka": {
    cityId: "banja-luka",
    name: "Banja Luka",
    country: "Bosnia and Herzegovina",
    thingsToDoUrl: GYG.banjaLuka,

    overview:
      "Banja Luka is one of the best pure football cities in Bosnia because it has proper city substance, a serious club in Borac, and enough nightlife and urban confidence that the trip feels like more than a stadium stop. It does not have Sarajevo’s historical weight or Mostar’s visual drama, but that is fine. Its appeal is different. It feels like a real city with a real club and a real football audience. The correct way to do Banja Luka is to stay central, use the city as your social base, and let Borac provide the football intensity that gives the weekend its edge.",

    topThings: [
      {
        title: "City-centre orientation loop",
        tip: "A smart first move because Banja Luka is best understood as a liveable city, not an attractions circus.",
      },
      {
        title: "Borac matchday",
        tip: "The football is the reason this city matters in the app. Build around it properly.",
      },
      {
        title: "Kastel Fortress area",
        tip: "Useful central stop that gives the city a little historical framing without wasting too much time.",
      },
      {
        title: "Vrbas river walk",
        tip: "Good as a reset block before dinner or on the morning after the match.",
      },
      {
        title: "One strong central dinner",
        tip: "Better to do one proper evening than scatter yourself across average choices.",
      },
      {
        title: "Nightlife and bars in the centre",
        tip: "One of the city’s strengths. This is where Banja Luka beats smaller league towns.",
      },
      {
        title: "Pre-match city build-up",
        tip: "Arrive early enough to let the football feel integrated into the city rather than rushed.",
      },
      {
        title: "Coffee-and-bakery morning",
        tip: "The city suits a slower provincial-city rhythm. Use it.",
      },
      {
        title: "One-night or two-night football break",
        tip: "One night works, but two nights makes the city feel properly complete.",
      },
      {
        title: "Regional-route value",
        tip: "Banja Luka works well as a serious western-Bosnia anchor rather than a one-off detour.",
      },
    ],

    tips: [
      "Stay central. There is no upside in staying by the ground.",
      "Borac are the key football reason to come, but the city is strong enough to support the weekend properly.",
      "This is one of the better non-capital football cities in the Balkans list.",
      "Do not overfill the itinerary. The city works best when kept compact.",
      "A very good choice if you want domestic-football seriousness without relying on postcard tourism.",
    ],

    food: [
      "Bosnian grills",
      "Traditional Balkan comfort food",
      "Strong café culture",
      "Central bars with food",
      "One proper dinner in the city core",
    ],

    transport:
      "Banja Luka is easy if you stay central. Walking covers a lot of the city core and short taxi rides solve the football leg. This is another trip where base choice matters more than transport complexity.",

    accommodation:
      "Stay in the centre. That gives you the strongest bars, restaurants, easiest matchday setup, and the best overall trip flow.",
  },

  "siroki-brijeg": {
    cityId: "siroki-brijeg",
    name: "Široki Brijeg",
    country: "Bosnia and Herzegovina",

    overview:
      "Široki Brijeg is not a giant city-break destination and pretending otherwise is pointless. The correct way to think about it is as a serious regional football stop that either works as a compact overnight or as part of a wider Mostar-based Herzegovina route. The club are the reason to go. The town provides the setting, but it does not carry the full travel weekend on its own the way Sarajevo or Mostar can.",

    topThings: [
      {
        title: "Široki Brijeg matchday",
        tip: "The football is the point of the stop. Treat it accordingly.",
      },
      {
        title: "Short town-centre orientation",
        tip: "Enough to place yourself, no need to force a fake giant-city itinerary.",
      },
      {
        title: "Pecara early arrival",
        tip: "Worth it because smaller grounds like this are better when you let the local rhythm build naturally.",
      },
      {
        title: "One practical local meal",
        tip: "Keep it simple. This is not the place for overplanned culinary tourism.",
      },
      {
        title: "Mostar-based route logic",
        tip: "Often the smartest overall choice if you want stronger city value around the fixture.",
      },
      {
        title: "Regional Herzegovina football route",
        tip: "Works best if paired with Mostar rather than as a standalone glamour weekend.",
      },
      {
        title: "Post-match quiet evening",
        tip: "Enough to complete the stop without trying to manufacture nightlife that is not really there.",
      },
      {
        title: "One-night football stop",
        tip: "Usually sufficient locally.",
      },
      {
        title: "Local-club realism",
        tip: "This is about football authenticity and regional identity, not spectacle.",
      },
      {
        title: "Morning move-on",
        tip: "Keep the trip honest and efficient.",
      },
    ],

    tips: [
      "This is a football-first regional stop.",
      "Most travellers should consider using Mostar as the stronger base.",
      "Široki Brijeg is about the club, not broad tourism depth.",
      "Do not overbuild the trip.",
      "Best for serious domestic-football travellers.",
    ],

    food: [
      "Simple local restaurants",
      "Traditional regional food",
      "One practical sit-down meal",
      "Better wider options in Mostar if using that as your base",
    ],

    transport:
      "The main decision is whether to sleep locally or in Mostar. Once you decide that, the rest is easy. This is not a transport-complex trip. It is a base-choice trip.",

    accommodation:
      "Široki Brijeg works for a pure football overnight, but Mostar is usually the better overall base if you want stronger hotels, food, and wider travel value.",
  },

  bijeljina: {
    cityId: "bijeljina",
    name: "Bijeljina",
    country: "Bosnia and Herzegovina",

    overview:
      "Bijeljina is a regional football stop, not a prestige city break. Radnik are the reason to come, and the trip only really makes sense if you care about league depth and local football identity rather than headline football tourism. That is fine. Not every stop has to be glamorous. But do not lie to yourself about what this is. It is a compact regional club trip.",

    topThings: [
      {
        title: "Radnik matchday",
        tip: "The football is the trip anchor. Everything else is supporting detail.",
      },
      {
        title: "Short central orientation",
        tip: "Enough to understand the town without forcing a fake attraction list.",
      },
      {
        title: "One practical local meal",
        tip: "Keep expectations aligned with the scale of the stop.",
      },
      {
        title: "Pre-match local café block",
        tip: "Useful for letting the day feel a little more deliberate.",
      },
      {
        title: "One-night football stop",
        tip: "Usually all you need.",
      },
      {
        title: "Regional route logic",
        tip: "Works better if folded into broader Bosnia travel than if treated as a headline standalone break.",
      },
      {
        title: "Quiet post-match evening",
        tip: "Enough to settle the trip without pretending there is huge nightlife depth.",
      },
      {
        title: "Practical over glamour mindset",
        tip: "This is a realism stop, not a flex.",
      },
      {
        title: "Morning coffee and move-on",
        tip: "The right way to end a trip like this.",
      },
      {
        title: "League-completion value",
        tip: "Worth it if you genuinely care about seeing the whole competition, not just the famous names.",
      },
    ],

    tips: [
      "Bijeljina is a football-depth stop, not a premium city-break choice.",
      "Radnik are the reason to go.",
      "Best for serious domestic-football travellers.",
      "Keep the stay short and practical.",
      "Do not try to oversell the town.",
    ],

    food: [
      "Simple local grills",
      "Regional Balkan food",
      "Basic café stops",
      "One practical sit-down dinner",
    ],

    transport:
      "The town itself is not complicated. The bigger question is whether the stop fits cleanly into your wider route. Once you are there, local movement is simple.",

    accommodation:
      "Stay centrally if staying overnight. There is little reason to overthink it.",
  },

  posusje: {
    cityId: "posusje",
    name: "Posušje",
    country: "Bosnia and Herzegovina",

    overview:
      "Posušje is a regional football stop that works best when treated honestly: small town, real club, practical logistics, limited wider city-break depth. The football matters because the club matter locally, but the smarter wider travel logic often sits in Mostar or in a broader Herzegovina route. This is not a glamour weekend. It is a proper domestic-football stop.",

    topThings: [
      {
        title: "Posušje matchday",
        tip: "The football is the point. Do not pretend the town is carrying the trip by itself.",
      },
      {
        title: "Short town-centre walk",
        tip: "Enough to settle the place, nothing more.",
      },
      {
        title: "Mokri Dolac arrival with time",
        tip: "Smaller regional grounds are always better when you are not rushing them.",
      },
      {
        title: "One practical local meal",
        tip: "Keep the trip simple and aligned with reality.",
      },
      {
        title: "Mostar-based alternative",
        tip: "Often the smarter broader base if you want stronger non-football value.",
      },
      {
        title: "Herzegovina route pairing",
        tip: "This is how the stop makes the most sense.",
      },
      {
        title: "Quiet post-match evening",
        tip: "Fine locally, but do not expect major nightlife.",
      },
      {
        title: "One-night stop",
        tip: "Usually enough if staying in town.",
      },
      {
        title: "Regional-football realism",
        tip: "This is for people who care about the actual league map.",
      },
      {
        title: "Morning departure",
        tip: "Keep the trip concise and honest.",
      },
    ],

    tips: [
      "Best done as part of a wider Herzegovina trip.",
      "Posušje is about the football, not the town’s broad tourism pull.",
      "Mostar is often the stronger nearby base.",
      "Do not overplan it.",
      "Best for serious domestic-football travellers.",
    ],

    food: [
      "Simple regional dining",
      "Traditional local meals",
      "Basic cafés",
      "Better wider dining if staying in Mostar",
    ],

    transport:
      "The transport is easy once you decide whether you are sleeping in Posušje or using a stronger nearby base. That is the only real decision that matters.",

    accommodation:
      "Posušje centre is fine for a football-only overnight. Mostar is the stronger wider option if you want better overall trip value.",
  },

  prijedor: {
    cityId: "prijedor",
    name: "Prijedor",
    country: "Bosnia and Herzegovina",

    overview:
      "Prijedor is a football-depth stop and nothing more glamorous than that. Rudar are the reason to go, and the trip only really works if you accept that you are doing a smaller regional club route rather than chasing the country’s showcase experiences. That honesty matters because otherwise you will just end up disappointed by something that was never meant to be a postcard weekend in the first place.",

    topThings: [
      {
        title: "Rudar matchday",
        tip: "The football is the entire point of the stop. Build around that and keep it tight.",
      },
      {
        title: "Short centre walk",
        tip: "Enough to understand the town without overcomplicating it.",
      },
      {
        title: "One practical local meal",
        tip: "Do not chase fantasy-city-break standards here.",
      },
      {
        title: "Regional Banja Luka pairing",
        tip: "Often the smarter way to make this stop part of a wider route.",
      },
      {
        title: "Pre-match café block",
        tip: "A simple way to give the day some rhythm.",
      },
      {
        title: "Quiet post-match dinner",
        tip: "Enough to round off a regional football stop properly.",
      },
      {
        title: "One-night football overnight",
        tip: "Usually enough locally.",
      },
      {
        title: "League-depth mindset",
        tip: "This is for people who value domestic completeness, not surface-level glamour.",
      },
      {
        title: "Morning move-on",
        tip: "The right ending for a stop like this.",
      },
      {
        title: "Wider western-Bosnia routing",
        tip: "This is how the trip becomes more useful overall.",
      },
    ],

    tips: [
      "Prijedor is a football-first regional stop.",
      "Rudar are the reason to go.",
      "Best folded into a Banja Luka-region route.",
      "Keep expectations modest and practical.",
      "Not a premium travel stop, but still a real one.",
    ],

    food: [
      "Simple local grills",
      "Regional Balkan dishes",
      "Basic cafés",
      "One straightforward dinner",
    ],

    transport:
      "The town itself is easy enough. The larger planning question is whether you are using Banja Luka as the stronger broader base or staying locally for pure convenience.",

    accommodation:
      "Prijedor centre is fine for a football-only overnight. Banja Luka is the stronger wider option if you want better nightlife and hotel depth.",
  },

  doboj: {
    cityId: "doboj",
    name: "Doboj",
    country: "Bosnia and Herzegovina",

    overview:
      "Doboj is another football-depth stop rather than a showcase destination. Sloga Doboj provide the football logic, but the city itself does not pretend to be one of the country’s major travel weekends. That is fine. Not every stop needs to be. This one works when treated as a practical, honest, smaller-club domestic trip.",

    topThings: [
      {
        title: "Sloga matchday",
        tip: "The club are the reason for the trip. Keep that central.",
      },
      {
        title: "Short central walk",
        tip: "Enough to place the city, no need to fake a giant itinerary.",
      },
      {
        title: "One practical meal",
        tip: "The right scale of planning for a stop like this.",
      },
      {
        title: "Luke Stadium arrival with time",
        tip: "Worth doing because smaller-club venues feel better when not rushed.",
      },
      {
        title: "Regional route logic",
        tip: "Best if this sits inside broader Bosnia travel rather than standing alone.",
      },
      {
        title: "Quiet post-match stop",
        tip: "Enough to let the evening land without forcing nightlife that is not really there.",
      },
      {
        title: "One-night practical overnight",
        tip: "Usually all you need.",
      },
      {
        title: "Smaller-club domestic realism",
        tip: "Only worth it if you actually value the full league structure.",
      },
      {
        title: "Morning coffee and departure",
        tip: "Keep it simple.",
      },
      {
        title: "Completionist route value",
        tip: "This is exactly the sort of stop that separates serious domestic football travellers from casual highlight-chasers.",
      },
    ],

    tips: [
      "Doboj is a football-depth stop, not a premium travel destination.",
      "Sloga are the reason to go.",
      "Best as part of broader Bosnia routing.",
      "Keep the stay short and realistic.",
      "Do not oversell the city to yourself.",
    ],

    food: [
      "Simple local restaurants",
      "Traditional Balkan dishes",
      "Basic café stops",
      "One practical dinner",
    ],

    transport:
      "Local movement is simple enough. The real trip-planning question is whether Doboj fits cleanly into your wider Bosnia route, not whether the city itself is hard to navigate.",

    accommodation:
      "Stay centrally if staying overnight. There is no strong argument for making this more complicated than it needs to be.",
  },
};

export default premierLeagueBosniaCityGuides;
