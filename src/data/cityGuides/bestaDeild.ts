import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
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
    thingsToDoUrl: GYG.reykjavik,

    overview:
      "Reykjavík is one of the easiest football weekends in the app to make work because the city itself is compact, distinctive, and built for short stays. That matters even more in Iceland, where many football trips are really wider travel trips first and city breaks second. Reykjavík solves that problem immediately. It gives you multiple clubs, walkable neighbourhoods, a real food and bar scene, and enough atmosphere that the weekend still feels like a proper break even if the match itself is not the biggest in the calendar. The smart Reykjavík football trip is obvious: stay central, pick your football carefully, and stop pretending you need to overfill every hour with geothermal clichés just because you’re in Iceland.",

    topThings: [
      {
        title: "One Reykjavík matchday done properly",
        tip: "The city has multiple clubs, so choose the fixture with actual weight rather than blindly picking the nearest kickoff.",
      },
      {
        title: "Hallgrímskirkja and central-city orientation walk",
        tip: "Best first move because it gives you immediate city shape without wasting time.",
      },
      {
        title: "Old Harbour and waterfront block",
        tip: "Good for a calmer football-weekend daytime stretch before dinner or pre-match drinks.",
      },
      {
        title: "One strong Reykjavík dinner booking",
        tip: "Iceland is expensive, so random mediocre choices hurt more. Choose properly.",
      },
      {
        title: "Laugavegur evening",
        tip: "Best general nightlife and bar axis for most visitors. Easy, central, and no nonsense.",
      },
      {
        title: "Perlan or one paid viewpoint / museum choice",
        tip: "Choose one. Collecting attractions in Reykjavík is a stupid use of limited football-weekend time.",
      },
      {
        title: "Harpa exterior and harbour-side loop",
        tip: "Worth doing because it’s fast, central, and actually looks like Reykjavík rather than generic city filler.",
      },
      {
        title: "Football double-header planning",
        tip: "Reykjavík is one of the few cities in the app where multiple-club coverage can make real sense if fixtures line up.",
      },
      {
        title: "Morning coffee and bakery reset",
        tip: "The city suits slower starts well, especially if you had a proper late one.",
      },
      {
        title: "Geothermal add-on only if it fits naturally",
        tip: "Do not let a football trip get hijacked by every tourist cliché in the country.",
      },
    ],

    tips: [
      "Stay central. Reykjavík is much better when you can walk most of it.",
      "Pick the right fixture, not just any fixture. Club context matters here.",
      "Do not overload the trip with day-tour nonsense if football is the priority.",
      "A Reykjavík football weekend works best when it is compact and deliberate.",
      "Expect high prices. Bad planning costs more here than in most leagues.",
    ],

    food: [
      "Good central seafood spots",
      "One proper Icelandic dinner if budget allows",
      "Bakery and coffee breakfast stops",
      "Casual burger / grill options",
      "A booked dinner rather than lazy walk-in roulette",
    ],

    transport:
      "Central Reykjavík is very walkable, which is one of its biggest strengths. Most football-weekend visitors should think in walking blocks plus occasional short taxi or bus support rather than trying to engineer complicated transport plans. The airport leg is the only part that really needs deliberate planning.",

    accommodation:
      "Stay in central Reykjavík, full stop. That gives you the best football-weekend flow, easiest restaurant and bar access, and least wasted time. Outer-area savings usually are not worth the drag they add.",
  },

  "kopavogur": {
    cityId: "kopavogur",
    name: "Kópavogur",
    country: "Iceland",

    overview:
      "Kópavogur is not a standalone city-break winner ahead of Reykjavík, and there is no point pretending otherwise. The right way to handle it is as a football location tied to the wider capital area, with Breiðablik as the main reason it matters. That does not make it weak. It just means the trip logic is obvious: use Reykjavík as your proper stay-and-play base unless you have a specific reason to go more local. Kópavogur works because the football matters, not because it outshines the capital for nightlife or broad visitor appeal.",

    topThings: [
      {
        title: "Breiðablik matchday",
        tip: "The reason this stop belongs in the route. Treat the club as the headline, not the suburb itself.",
      },
      {
        title: "Simple local pre-match block",
        tip: "Fine for practicality, but do not try to turn Kópavogur into a fake full-tourism weekend.",
      },
      {
        title: "Reykjavík-based stay strategy",
        tip: "Usually the smartest choice unless convenience matters more than overall trip quality.",
      },
      {
        title: "Hamraborg / local-centre orientation",
        tip: "Enough to place yourself without wasting half the day.",
      },
      {
        title: "Capital-area football pairing",
        tip: "This stop works well when folded into a wider Reykjavík football weekend.",
      },
      {
        title: "One practical local meal",
        tip: "Useful if it fits your route, but Reykjavík is still stronger overall.",
      },
      {
        title: "Short-stay football logic",
        tip: "This is a football-first stop, not a place to force a giant sightseeing agenda.",
      },
      {
        title: "Easy post-match return to Reykjavík",
        tip: "Often the smartest move if you want the weekend to stay lively.",
      },
      {
        title: "One-night capital-region plan",
        tip: "Works well if your goal is league coverage and good trip efficiency.",
      },
      {
        title: "No-fuss football stop",
        tip: "That is where Kópavogur is strongest.",
      },
    ],

    tips: [
      "Use Reykjavík as the main base unless you have a strong reason not to.",
      "Breiðablik are the real draw here.",
      "Do not overcomplicate the suburb side of the trip.",
      "Best used as part of a wider capital-area football weekend.",
      "This is about football quality more than city-break glamour.",
    ],

    food: [
      "Practical local cafés",
      "Simple pre-match food options",
      "Better wider dinner choices in Reykjavík",
      "Coffee stop plus quick meal",
    ],

    transport:
      "The real transport decision is where you base yourself, not how you move within Kópavogur. For most people the answer is Reykjavík, with the Breiðablik leg treated as a simple football branch from there.",

    accommodation:
      "Reykjavík is the stronger overall base. Kópavogur only makes sense if you want quieter surroundings and shorter matchday travel.",
  },

  "hafnarfjordur": {
    cityId: "hafnarfjordur",
    name: "Hafnarfjörður",
    country: "Iceland",

    overview:
      "Hafnarfjörður is more substantial than some of the other Reykjavík-area satellite stops because FH are a serious club and the town has a clearer local identity of its own. Even so, the same rule still applies: for most football travellers this is best handled as part of a wider Reykjavík-area plan, not as a superior replacement for staying in the capital. Hafnarfjörður’s value is that it gives you a proper club environment without demanding a whole separate destination-weekend mentality.",

    topThings: [
      {
        title: "FH matchday",
        tip: "The clear football reason to come and one of the stronger capital-region club experiences.",
      },
      {
        title: "Harbour-area walk",
        tip: "Good for a short local block before or after football without forcing the day too hard.",
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
        title: "One practical evening here, one bigger evening in Reykjavík",
        tip: "Usually a better balance than trying to make every night happen in one place.",
      },
      {
        title: "Capital-region football route building",
        tip: "This stop has real value when paired intelligently with other Reykjavík-area clubs.",
      },
      {
        title: "Short harbour / town reset",
        tip: "Useful if you want the trip to feel slightly less generic than airport-hotel-stadium-back.",
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
      "Still, Reykjavík remains the better all-round stay base for most people.",
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
      "Akranes is one of the strongest non-capital football-history stops in Iceland because ÍA give the town real weight. That is the key. Without ÍA, it would just be another smaller Icelandic place. With ÍA, it becomes one of the country’s proper football towns. This is a football-first stop with historical depth, not a flashy Iceland lifestyle break. If you treat it that way, it becomes one of the better serious domestic-football trips in the whole league map.",

    topThings: [
      {
        title: "ÍA matchday",
        tip: "The whole point of the trip and one of the better traditional-club experiences in Iceland.",
      },
      {
        title: "Akranes old-town / harbour feel",
        tip: "Useful because it helps the football stop feel rooted in a real place rather than just a venue pin.",
      },
      {
        title: "One local meal done properly",
        tip: "This is a town where keeping things simple is smarter than trying to over-curate everything.",
      },
      {
        title: "Football-history mindset",
        tip: "This is not about nightlife or tourist flash. It is about club significance.",
      },
      {
        title: "One-night football trip",
        tip: "Usually the right amount if ÍA are the main target.",
      },
      {
        title: "Reykjavík-base option",
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
        tip: "This is one of the Iceland stops that rewards football seriousness.",
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
      "One-night stop works well.",
      "Reykjavík is still the better base if nightlife matters more than local football immersion.",
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
      "Vestmannaeyjar is one of the standout football destinations in the whole app because it is one of the rare places where the logistics, location, and club identity all combine to create something genuinely different. This is not just an Iceland stop. It is an island-football trip with real top-flight meaning. That immediately puts it above most ordinary league detours. The catch is obvious: the planning matters. You cannot drift into Vestmannaeyjar with the lazy mindset you can sometimes get away with in a capital city. But if you do it properly, it is one of the best football experiences in the entire Iceland build.",

    topThings: [
      {
        title: "ÍBV matchday",
        tip: "One of the most distinctive football experiences anywhere in the app. Treat it with the respect it deserves.",
      },
      {
        title: "Harbour and town-centre orientation",
        tip: "Best first move because it explains the place immediately and links the football to the island reality.",
      },
      {
        title: "Volcanic / landscape viewpoint block",
        tip: "Do one meaningful natural stop. Do not turn the football trip into an exhausting geography lesson.",
      },
      {
        title: "Ferry or air logistics planning",
        tip: "This is not optional. Get this wrong and the whole trip gets messy fast.",
      },
      {
        title: "One proper island dinner",
        tip: "Worth doing because the place is memorable enough that a rushed bad meal feels especially stupid.",
      },
      {
        title: "Football-plus-island overnight",
        tip: "This is one of the clearest cases in the app where staying overnight is part of the experience, not a luxury extra.",
      },
      {
        title: "Harbour-area evening",
        tip: "A simple and smart way to let the island atmosphere actually register.",
      },
      {
        title: "Pre-match local build-up",
        tip: "Essential. The club and place are too linked for you to parachute in too late.",
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
      "Do not treat it like a casual same-day add-on unless logistics force you to.",
    ],

    food: [
      "Harbour-side seafood",
      "One proper island dinner",
      "Simple cafés and bakery stops",
      "Practical pre-match local meal",
    ],

    transport:
      "This is the most planning-sensitive major stop in the Iceland set. The internal town movement is easy enough. The real issue is getting on and off the island cleanly and leaving enough margin for weather and schedule realities.",

    accommodation:
      "Stay in Vestmannaeyjar town centre or near the harbour. This is one of the clear cases where staying locally massively improves the football trip.",
  },

  akureyri: {
    cityId: "akureyri",
    name: "Akureyri",
    country: "Iceland",
    thingsToDoUrl: GYG.akureyri,

    overview:
      "Akureyri is one of the strongest football cities in the entire Iceland set because it is one of the few places outside Reykjavík where the trip genuinely works as a football city break in its own right. That is because the city is compact, attractive, properly useful for overnight stays, and home to more than one relevant club. It feels like a real football place, not just a scenic stop with a stadium attached. The correct Akureyri trip is simple: stay central, give the football room to matter, and use the city’s size to your advantage rather than pretending you need a huge itinerary to justify the trip.",

    topThings: [
      {
        title: "KA or Þór matchday",
        tip: "The city is best when you pick the right football context rather than treating all fixtures as interchangeable.",
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
        title: "Church / hill view orientation",
        tip: "Useful for getting city geography and atmosphere quickly.",
      },
      {
        title: "Compact football-weekend pacing",
        tip: "Akureyri rewards clean planning more than overambitious sightseeing.",
      },
      {
        title: "One good coffee-and-bakery morning",
        tip: "This city suits slower starts and compact weekend rhythm very well.",
      },
      {
        title: "North-Iceland route pairing",
        tip: "Only if it helps. Do not dilute the football by turning the weekend into a frantic ring-road parody.",
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
      "Harbour-area dining if the mood suits it",
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
      "Keflavík is one of the most practical football stops in the whole Iceland build because the airport proximity changes the entire travel equation. That is its strength and its limitation. It is brilliant for convenience, but weaker than Reykjavík if what you want is an actual big-feel city weekend. The right way to use Keflavík is to be brutally honest about your priorities. If efficiency matters, it is excellent. If atmosphere, nightlife, and broad weekend depth matter more, Reykjavík is still the better base and this becomes a football branch from there.",

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
        tip: "Excellent if you have early flights and still want football in the trip.",
      },
      {
        title: "Blue Lagoon / Reykjanes pairing only if it fits naturally",
        tip: "Do not cram in cliché add-ons that wreck the football timing.",
      },
      {
        title: "One practical local dinner",
        tip: "Good enough if the aim is efficiency rather than major-city energy.",
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
        title: "Arrival or departure day football",
        tip: "One of the best places in the entire app for that exact use case.",
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
      "Garðabær is another capital-area football location where the correct answer is usually to treat the football seriously and the town modestly. Stjarnan make it relevant. Without the club, it would not be one of the app’s real football destinations. That is fine. Not every stop needs to win on nightlife or giant-city energy. The trip logic is clear: use Reykjavík as the broader base unless you specifically want quiet convenience, and make Stjarnan the reason the stop exists.",

    topThings: [
      {
        title: "Stjarnan matchday",
        tip: "The football reason this stop belongs in the route. The club is the headline, not the town itself.",
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
        tip: "Fine if convenient, but do not expect it to outcompete Reykjavík for wider trip value.",
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
