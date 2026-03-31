import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this centralised so monetised outbound links stay easy to audit.
 */
const GYG = {
  reykjavik:
    "https://www.getyourguide.com/en-gb/reykjavik-l30/?partner_id=MAQJREP&utm_medium=online_publisher",
  akureyri:
    "https://www.getyourguide.com/en-gb/akureyri-l2028/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const bestaDeildCityGuides: Record<string, CityGuide> = {
  reykjavik: {
    cityId: "reykjavik",
    name: "Reykjavík",
    country: "Iceland",
    bookingLinks: {
      thingsToDo: GYG.reykjavik,
    },
    thingsToDoUrl: GYG.reykjavik,

    overview:
      "Reykjavík is the anchor city of Icelandic football travel because it gives you what most Iceland stops do not: multiple clubs, a walkable centre, a real food-and-bar scene, and enough quality accommodation that the trip still feels like a proper weekend rather than a logistical exercise. That matters because many Iceland football trips can easily become ‘country trip with a match somewhere in it’ if you do not stay disciplined. Reykjavík avoids that problem. It lets you build a compact, football-led city break where the match actually fits naturally into the weekend instead of feeling bolted on. The correct approach is obvious: stay central, choose the right fixture, and stop trying to cram every geothermal cliché in the country into the same two-day plan.",

    topThings: [
      {
        title: "One Reykjavík matchday chosen properly",
        tip: "Fixture quality matters here. Pick the club, rivalry, and table context that actually give the weekend edge.",
      },
      {
        title: "Hallgrímskirkja and central orientation walk",
        tip: "Best first move because it gives you city shape fast without wasting half a day.",
      },
      {
        title: "Old Harbour and waterfront block",
        tip: "Good calmer daytime stretch before pre-match drinks or dinner.",
      },
      {
        title: "Harpa exterior and harbour-side loop",
        tip: "Fast, central, and visually worth it without hijacking the whole day.",
      },
      {
        title: "Laugavegur evening",
        tip: "Still the easiest central nightlife axis for most visitors. No need to reinvent it.",
      },
      {
        title: "One serious dinner booking",
        tip: "Iceland is expensive, so bad spontaneous choices punish you harder than in most leagues.",
      },
      {
        title: "Perlan or one paid museum/viewpoint choice",
        tip: "Choose one and move on. Attraction collecting is a stupid use of a football weekend.",
      },
      {
        title: "Football double-header planning",
        tip: "Reykjavík is one of the few cities in the app where multi-club coverage can actually make sense if kickoffs line up.",
      },
      {
        title: "Morning coffee and bakery reset",
        tip: "The city suits slower starts well, especially after a proper late night.",
      },
      {
        title: "Geothermal add-on only if it fits cleanly",
        tip: "Do not let football get buried under generic Iceland tourism filler.",
      },
    ],

    tips: [
      "Stay central. Reykjavík gets worse fast when you add unnecessary transport.",
      "Pick the right fixture, not just any fixture.",
      "Do not overload the trip with out-of-town detours if football is the priority.",
      "A compact Reykjavík weekend usually works better than an overambitious one.",
      "Expect high prices and book the good stuff early instead of hoping mediocrity will somehow be charming.",
    ],

    food: [
      "Strong seafood restaurants in the centre",
      "One proper Icelandic dinner if budget allows",
      "Bakery-and-coffee breakfast stops",
      "Casual burger and grill options",
      "A booked dinner instead of lazy walk-in roulette",
    ],

    transport:
      "Central Reykjavík is highly walkable, which is one of its biggest strengths. Most football-weekend visitors should think in walking blocks plus the occasional short taxi or bus, not in overengineered transport plans. The airport transfer is the one leg that actually needs deliberate planning.",

    accommodation:
      "Stay in central Reykjavík, full stop. That gives you the best football-weekend flow, easiest bar and restaurant access, and the least wasted time. Outer-area savings usually are not worth the drag they add.",
  },

  kopavogur: {
    cityId: "kopavogur",
    name: "Kópavogur",
    country: "Iceland",

    overview:
      "Kópavogur matters because Breiðablik matter. That is the honest version and the correct one. This is not a stronger leisure base than Reykjavík, and pretending otherwise would just make the trip worse. The value comes from having one of Iceland’s most serious modern clubs in the capital region, which means you can fold a strong football stop into a Reykjavík weekend without much friction. The right strategy is usually simple: sleep in Reykjavík, travel over for the football, and let Breiðablik be the reason the stop exists. Kópavogur works best when treated as a football branch from the capital, not as a fake standalone city-break heavyweight.",

    topThings: [
      {
        title: "Breiðablik matchday",
        tip: "The clear reason this stop belongs in the route. Treat the club as the headline, not the suburb.",
      },
      {
        title: "Simple local pre-match block",
        tip: "Fine for practicality, but do not try to manufacture a giant sightseeing day from nothing.",
      },
      {
        title: "Reykjavík-based stay strategy",
        tip: "Usually the smartest call unless quiet convenience matters more than overall trip quality.",
      },
      {
        title: "Hamraborg / local-centre orientation",
        tip: "Enough to place yourself without wasting the whole afternoon.",
      },
      {
        title: "Capital-area football pairing",
        tip: "This stop works well when folded into a wider Reykjavík football weekend.",
      },
      {
        title: "One practical local meal",
        tip: "Useful if it fits your route, but Reykjavík is still stronger for broader dining value.",
      },
      {
        title: "Short-stay football-first planning",
        tip: "This is a football stop, not a place to force a tourism performance.",
      },
      {
        title: "Easy post-match return to Reykjavík",
        tip: "Often the smartest move if you want the weekend to stay lively.",
      },
      {
        title: "One-night capital-region route building",
        tip: "Works well if your goal is efficiency and serious league coverage.",
      },
      {
        title: "Low-fuss football stop",
        tip: "That is exactly where Kópavogur is strongest.",
      },
    ],

    tips: [
      "Use Reykjavík as the main base unless you have a strong reason not to.",
      "Breiðablik are the real draw here.",
      "Do not overcomplicate the suburb side of the trip.",
      "Best used as part of a wider capital-area football weekend.",
      "This is about football quality, not city-break glamour.",
    ],

    food: [
      "Practical local cafés",
      "Simple pre-match food options",
      "Better wider dinner choices in Reykjavík",
      "Coffee stop plus one quick meal",
    ],

    transport:
      "The real transport decision is where you base yourself, not how you move within Kópavogur. For most people the answer is Reykjavík, with the Breiðablik leg treated as a simple football branch from there.",

    accommodation:
      "Reykjavík is the stronger overall base. Kópavogur only makes sense if you want quieter surroundings and shorter matchday travel.",
  },

  hafnarfjordur: {
    cityId: "hafnarfjordur",
    name: "Hafnarfjörður",
    country: "Iceland",

    overview:
      "Hafnarfjörður is a stronger football stop than some of the other Reykjavík-area satellite locations because FH are a genuinely serious club and the town has more local shape of its own. Even so, the same basic rule still applies: for most football travellers this works best as part of a wider capital-area trip, not as a smarter substitute for staying in Reykjavík. The value is that you get a proper club environment with real football weight, a recognisable local centre, and an easy route back into the capital if you want the stronger evening scene. Used properly, Hafnarfjörður is a very good football branch. Used badly, it becomes a place people overstay out of stubbornness.",

    topThings: [
      {
        title: "FH matchday",
        tip: "The clear football reason to come and one of the stronger capital-region club experiences.",
      },
      {
        title: "Harbour-area walk",
        tip: "Good short local block before or after football without forcing the day too hard.",
      },
      {
        title: "Local-centre food stop",
        tip: "Works well if you are keeping the trip simple and football-led.",
      },
      {
        title: "Reykjavík plus Hafnarfjörður split",
        tip: "A very sensible way to cover FH without sacrificing the stronger broader city base.",
      },
      {
        title: "Pre-match local timing",
        tip: "Worth doing because FH are serious enough that the local football context matters.",
      },
      {
        title: "One evening here, one stronger evening in Reykjavík",
        tip: "Usually a better balance than trying to make every night happen in one place.",
      },
      {
        title: "Capital-region football route building",
        tip: "This stop has real value when paired intelligently with other Reykjavík-area clubs.",
      },
      {
        title: "Short harbour / town reset",
        tip: "Useful if you want the trip to feel less generic than airport-hotel-stadium-back.",
      },
      {
        title: "One-night football stop",
        tip: "Enough for many visitors if the football is the main target.",
      },
      {
        title: "No-fake-glamour planning",
        tip: "The trip works when you respect what it is instead of overselling it.",
      },
    ],

    tips: [
      "FH make this a serious football stop, not just a suburb detour.",
      "Reykjavík remains the better all-round stay base for most people.",
      "Good as part of a wider multi-club Iceland trip.",
      "Keep the plan practical and it works well.",
      "Do not force it into being a giant standalone city break.",
    ],

    food: [
      "Simple harbour or town-centre meals",
      "Practical pre-match cafés",
      "One local dinner if convenient",
      "Better broader nightlife options in Reykjavík",
    ],

    transport:
      "The trip is straightforward enough. The only real strategic choice is whether to sleep here or in Reykjavík. For most football travellers, Reykjavík still wins on total weekend quality.",

    accommodation:
      "Hafnarfjörður works if you want a quieter football-first stop. Reykjavík is still the stronger overall base for most users.",
  },

  akranes: {
    cityId: "akranes",
    name: "Akranes",
    country: "Iceland",

    overview:
      "Akranes is one of the strongest football-history stops in the whole Iceland build because ÍA give the town real national football weight. That is the point. Without the club, this would be a much smaller leisure proposition. With ÍA, it becomes one of Iceland’s genuine football towns and one of the clearest examples of why the country’s football geography is better than just following Reykjavík. This is not a flashy nightlife trip and there is no point pretending it is. It is a football-first stop with deep club meaning, strong local pride, and enough town texture to make the overnight worthwhile if you actually care about football culture instead of just collecting stadium pins.",

    topThings: [
      {
        title: "ÍA matchday",
        tip: "The whole reason the trip matters and one of the better traditional-club experiences in Iceland.",
      },
      {
        title: "Akranes harbour and town-centre feel",
        tip: "Useful because it makes the football stop feel rooted in a real place rather than just a venue pin.",
      },
      {
        title: "One local meal done properly",
        tip: "This is a town where keeping things simple is smarter than trying to over-curate everything.",
      },
      {
        title: "Football-history mindset",
        tip: "This trip is about club significance, not urban glamour.",
      },
      {
        title: "One-night football stay",
        tip: "Usually the right amount if ÍA are the main target.",
      },
      {
        title: "Reykjavík-base alternative",
        tip: "Valid if you want stronger nightlife and are happy to travel in and out.",
      },
      {
        title: "Ground-area arrival with time",
        tip: "Worth doing because the old-club feel is part of the appeal.",
      },
      {
        title: "Harbour or seafront reset",
        tip: "Good low-effort add-on around the football.",
      },
      {
        title: "Traditional-club route planning",
        tip: "This is one of the Iceland stops that rewards actual football seriousness.",
      },
      {
        title: "No-rush day structure",
        tip: "Akranes works better when the trip has breathing room.",
      },
    ],

    tips: [
      "ÍA are the reason this stop matters.",
      "Great for football history and local identity.",
      "Better for serious football travellers than for generic leisure tourists.",
      "One night usually works well.",
      "Reykjavík is still the stronger base if nightlife matters more than football immersion.",
    ],

    food: [
      "Simple local seafood options",
      "Traditional Icelandic small-town dining",
      "One practical sit-down meal",
      "Coffee and bakery stop",
    ],

    transport:
      "Akranes is mostly about deciding whether you stay locally or treat it as a Reykjavík branch trip. Once you make that choice, the rest is fairly straightforward by Iceland standards.",

    accommodation:
      "Stay in Akranes if ÍA and local football immersion are the point. Stay in Reykjavík if you want a broader weekend and better nightlife depth.",
  },

  vestmannaeyjar: {
    cityId: "vestmannaeyjar",
    name: "Vestmannaeyjar",
    country: "Iceland",

    overview:
      "Vestmannaeyjar is one of the standout football destinations in the entire app because almost nowhere else combines top-flight football, island logistics, volcanic setting, and real club identity this well. This is not a gimmick stop. ÍBV are a proper club in a place that genuinely changes the meaning of the matchday. That is why the trip is so strong. The catch is obvious: planning matters. You cannot treat Vestmannaeyjar like a casual capital-city add-on and expect the weekend to organise itself. But if you handle the ferry or flight properly, allow enough time, and stay overnight, it becomes one of the most memorable football experiences anywhere in the project.",

    topThings: [
      {
        title: "ÍBV matchday",
        tip: "One of the most distinctive football experiences anywhere in the app. Treat it like a headline trip, not a novelty extra.",
      },
      {
        title: "Harbour and town-centre orientation",
        tip: "Best first move because it immediately explains the place and links the football to the island reality.",
      },
      {
        title: "One meaningful volcanic / landscape stop",
        tip: "Do one good natural block. Do not turn the football trip into an exhausting geography marathon.",
      },
      {
        title: "Ferry or air logistics planning",
        tip: "This is not optional. Get this wrong and the whole trip gets messy fast.",
      },
      {
        title: "One proper island dinner",
        tip: "Worth doing because the place is memorable enough that rushed bad food feels especially stupid.",
      },
      {
        title: "Football-plus-island overnight",
        tip: "This is one of the clearest cases in the app where staying over is part of the experience, not a luxury extra.",
      },
      {
        title: "Harbour-area evening",
        tip: "A simple and smart way to let the island atmosphere actually register.",
      },
      {
        title: "Pre-match local build-up",
        tip: "Essential. Club and place are too linked for you to parachute in too late.",
      },
      {
        title: "One clean morning-after walk",
        tip: "This stop benefits from slower pacing more than frantic scheduling.",
      },
      {
        title: "Island-first realism",
        tip: "The football is elite here, but only if you respect the transport and weather variables.",
      },
    ],

    tips: [
      "One of the best football trips in the app, full stop.",
      "Transport planning matters here far more than in Reykjavík-area stops.",
      "Stay overnight if possible. Rushing this trip is idiotic.",
      "ÍBV plus island setting is what makes this special.",
      "Do not treat it like a casual same-day add-on unless logistics leave you no choice.",
    ],

    food: [
      "Harbour-side seafood",
      "One proper island dinner",
      "Simple cafés and bakery stops",
      "Practical pre-match local meal",
    ],

    transport:
      "This is the most planning-sensitive major stop in the Iceland set. Internal town movement is easy enough. The real issue is getting on and off the island cleanly and leaving enough margin for weather and schedule reality.",

    accommodation:
      "Stay in Vestmannaeyjar town centre or near the harbour. This is one of the clearest cases where staying locally massively improves the football trip.",
  },

  akureyri: {
    cityId: "akureyri",
    name: "Akureyri",
    country: "Iceland",
    bookingLinks: {
      thingsToDo: GYG.akureyri,
    },
    thingsToDoUrl: GYG.akureyri,

    overview:
      "Akureyri is one of the strongest football cities in the whole Iceland set because it is one of the few places outside Reykjavík where the trip genuinely works as a football city break in its own right. That is because the town is compact, attractive, easy to stay in, and home to more than one relevant club. It feels like a real football place, not just a scenic stop with a stadium attached. That makes it extremely valuable in the app. The correct Akureyri plan is simple: stay central, choose the right football context, and let the city’s size work for you instead of inventing some oversized itinerary just to feel busy.",

    topThings: [
      {
        title: "KA or Þór matchday",
        tip: "The city is best when you pick the right football context rather than treating every fixture as interchangeable.",
      },
      {
        title: "Central Akureyri and harbour walk",
        tip: "The easiest way to understand why the city works so well for football weekends.",
      },
      {
        title: "One strong local dinner",
        tip: "Akureyri is good enough that you should eat properly, not lazily.",
      },
      {
        title: "Church / hill-view orientation",
        tip: "Useful for getting city geography and atmosphere quickly.",
      },
      {
        title: "Compact football-weekend pacing",
        tip: "Akureyri rewards clean planning more than overambitious sightseeing.",
      },
      {
        title: "One good coffee-and-bakery morning",
        tip: "This city suits slower starts and a compact weekend rhythm very well.",
      },
      {
        title: "North-Iceland route pairing only if it genuinely helps",
        tip: "Do not dilute the football by turning the weekend into a frantic ring-road parody.",
      },
      {
        title: "Pre-match city-centre block",
        tip: "Worth doing because the football and city genuinely connect here.",
      },
      {
        title: "One-night or two-night stay",
        tip: "Both work. Two nights give the city and football much more breathing room.",
      },
      {
        title: "Real football-city mindset",
        tip: "That is why Akureyri ranks so highly in the Iceland set.",
      },
    ],

    tips: [
      "Akureyri is one of the best non-capital football city trips in the app.",
      "Stay central.",
      "Good for both KA and Þór coverage.",
      "Two nights is ideal if you want football plus city without rushing.",
      "Do not overcomplicate it. The city’s strength is how manageable it is.",
    ],

    food: [
      "Strong local seafood and Icelandic options",
      "Good town-centre cafés",
      "Bakery breakfasts",
      "One proper evening meal in the centre",
      "Harbour-area dining if it fits the mood",
    ],

    transport:
      "Akureyri is compact enough that central basing solves most of the trip. Walking is the core move. Short rides only matter at the edges. Compared with many Iceland trips, this is refreshingly straightforward.",

    accommodation:
      "Stay in central Akureyri or near the harbour. That is the obvious best answer for football flow, dining, and overall weekend quality.",
  },

  keflavik: {
    cityId: "keflavik",
    name: "Keflavík",
    country: "Iceland",

    overview:
      "Keflavík is one of the most practical football stops in the whole Iceland build because the airport proximity changes the entire travel equation. That is both its strength and its limitation. It is brilliant for efficiency, but weaker than Reykjavík if what you want is an actual city weekend with more atmosphere, bars, and depth. The right way to use Keflavík is to be brutally honest about priorities. If convenience matters, it is excellent. If broader football-weekend feel matters more, Reykjavík is still the better base and Keflavík becomes a football branch from there. Either approach can work. The stupid move is pretending both goals are equal here.",

    topThings: [
      {
        title: "Keflavík matchday",
        tip: "A very smart football stop if route efficiency matters and you still want a real club, not just convenience.",
      },
      {
        title: "Airport-to-football planning",
        tip: "This is the obvious edge here. Use it intelligently.",
      },
      {
        title: "Simple harbour / town-centre block",
        tip: "Enough to give the stop some shape without pretending it is Reykjavík.",
      },
      {
        title: "One practical overnight near the airport",
        tip: "Excellent if you have an early flight and still want football in the trip.",
      },
      {
        title: "Blue Lagoon / Reykjanes pairing only if it fits naturally",
        tip: "Do not cram in cliché add-ons that wreck the football timing.",
      },
      {
        title: "One practical local dinner",
        tip: "Good enough if the aim is efficiency rather than big-city energy.",
      },
      {
        title: "Reykjavík-base alternative",
        tip: "Still the better move if nightlife and broader trip feel matter more than convenience.",
      },
      {
        title: "No-fuss football stop",
        tip: "That is where Keflavík is strongest.",
      },
      {
        title: "Short-stay football logic",
        tip: "Works very well here because the transport side is so simple.",
      },
      {
        title: "Arrival-day or departure-day football",
        tip: "One of the best places in the entire app for exactly that use case.",
      },
    ],

    tips: [
      "One of the easiest football stops in the whole Iceland set.",
      "Best for efficiency and airport convenience.",
      "Less strong than Reykjavík as a broader leisure base.",
      "Excellent for arrival-day or departure-day football planning.",
      "Be honest about whether you want convenience or city energy.",
    ],

    food: [
      "Simple local dining",
      "Harbour-side or town-centre meals",
      "Practical airport-adjacent overnight food options",
      "Coffee and bakery stop",
    ],

    transport:
      "This city is all about friction reduction. Once you land, the football logistics are among the easiest in Iceland. That is the main value and the reason the stop is useful.",

    accommodation:
      "Stay in Keflavík if route efficiency and airport practicality are the priority. Stay in Reykjavík if you want the stronger overall football-weekend experience.",
  },

  gardabaer: {
    cityId: "gardabaer",
    name: "Garðabær",
    country: "Iceland",

    overview:
      "Garðabær is another capital-area football location where the correct answer is usually to take the football seriously and the town modestly. Stjarnan make it relevant. Without the club, it would not be one of the app’s real football destinations. That is perfectly fine. Not every stop has to win on nightlife or giant-city energy. The trip logic is straightforward: use Reykjavík as the broader base unless you specifically want quiet convenience, and make Stjarnan the reason the stop exists. Garðabær works best when treated as part of a wider Reykjavík football network, not as an isolated city-break statement.",

    topThings: [
      {
        title: "Stjarnan matchday",
        tip: "The football reason this stop exists. The club is the headline, not the town itself.",
      },
      {
        title: "Short local-centre orientation",
        tip: "Enough to place yourself without wasting time on fake tourist padding.",
      },
      {
        title: "Reykjavík-base strategy",
        tip: "Usually the correct move if you care about overall weekend quality.",
      },
      {
        title: "Capital-area multi-club planning",
        tip: "Garðabær works best when folded into wider Reykjavík football coverage.",
      },
      {
        title: "One practical local meal",
        tip: "Fine if convenient, but do not expect it to outperform Reykjavík for wider trip value.",
      },
      {
        title: "Quiet match-first stay",
        tip: "Useful only if that is exactly what you want.",
      },
      {
        title: "Pre-match arrival with time",
        tip: "Worth doing because smaller-club stops work better when not rushed.",
      },
      {
        title: "Post-match return to the capital",
        tip: "Often the cleanest option if you want the evening to have more life.",
      },
      {
        title: "One-night football branch",
        tip: "Works well if efficiency matters.",
      },
      {
        title: "No-overthinking football stop",
        tip: "That is the right mindset here.",
      },
    ],

    tips: [
      "Stjarnan are the only real reason to come.",
      "Reykjavík is still the better all-round base.",
      "Best as part of a wider capital-area football trip.",
      "Do not try to turn this into a giant city-break stop.",
      "Works well for efficient league coverage.",
    ],

    food: [
      "Simple local cafés",
      "Practical pre-match food options",
      "Better broader dinner and nightlife in Reykjavík",
      "Coffee stop plus quick meal",
    ],

    transport:
      "Like several Reykjavík-area satellite stops, the main issue is where you sleep, not local complexity. For most football travellers, staying in Reykjavík and treating Garðabær as a football leg is the obvious move.",

    accommodation:
      "Garðabær is fine for quiet convenience. Reykjavík is the better base if you want a stronger overall trip.",
  },
};

export default bestaDeildCityGuides;
