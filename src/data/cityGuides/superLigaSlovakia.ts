import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
 *
 * If a city doesn't have a clean verified GYG city landing page, leave it
 * undefined and let UI fall back to buildAffiliateLinks({ city }).experiencesUrl.
 */
const GYG = {
  bratislava:
    "https://www.getyourguide.com/en-gb/bratislava-l765/?partner_id=MAQJREP&utm_medium=online_publisher",
  kosice:
    "https://www.getyourguide.com/en-gb/kosice-l148934/?partner_id=MAQJREP&utm_medium=online_publisher",
  zilina:
    "https://www.getyourguide.com/en-gb/zilina-l2115/?partner_id=MAQJREP&utm_medium=online_publisher",
  trencin:
    "https://www.getyourguide.com/en-gb/trencin-l150506/?partner_id=MAQJREP&utm_medium=online_publisher",
  presov:
    "https://www.getyourguide.com/en-gb/presov-l150517/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const superLigaSlovakiaCityGuides: Record<string, CityGuide> = {
  bratislava: {
    cityId: "bratislava",
    name: "Bratislava",
    country: "Slovakia",
    thingsToDoUrl: GYG.bratislava,

    overview:
      "Bratislava is the easiest and strongest football city break in Slovakia because it gives you the best blend of airport access, walkable old town, nightlife, hotel choice, and easy onward transport to multiple clubs. Slovan Bratislava are the obvious headline, but the city also works brilliantly as a base for DAC and Spartak Trnava if you are stacking fixtures or building a wider Slovak football weekend. The winning formula is simple: stay central, split the trip into Old Town and riverfront blocks, and treat matchday transport as a timed practical move rather than the whole day.",

    topThings: [
      {
        title: "Old Town core loop",
        tip: "Best first move. It gets the city under control fast without wasting hours.",
      },
      {
        title: "Bratislava Castle viewpoint",
        tip: "Do it early or near sunset. Midday crowds make it feel more touristy than it needs to.",
      },
      {
        title: "Danube riverfront walk",
        tip: "Good as a reset block before dinner or after a long travel morning.",
      },
      {
        title: "Blue Church and old-centre side streets",
        tip: "Worth folding into a wider walk, not worth building a whole day around.",
      },
      {
        title: "UFO bridge viewpoint",
        tip: "Only do it if the weather is clear enough to make the views count.",
      },
      {
        title: "Traditional pub and beer-cellar stop",
        tip: "Better than generic tourist bars if you actually want the city to feel Slovak.",
      },
      {
        title: "Tehelné pole early arrival",
        tip: "Arrive with time. It is the league’s biggest stadium and works better when you let the area breathe.",
      },
      {
        title: "Day-trip rail logic for Trnava",
        tip: "Very easy add-on if you are trying to catch more than one Slovak club in a weekend.",
      },
      {
        title: "DAC travel planning from the capital",
        tip: "Most travellers should base in Bratislava and go in, rather than forcing a full stay in Dunajská Streda.",
      },
      {
        title: "Morning coffee and final old-town sweep",
        tip: "A better final block than trying to cram one more attraction before checkout.",
      },
    ],

    tips: [
      "Bratislava is the correct base for most Slovak football weekends.",
      "Stay in or near the Old Town unless you have a very specific reason not to.",
      "Slovan is the headline fixture, but Bratislava also works as a clean rail base for Trnava and DAC.",
      "Do not overbuild the sightseeing. This is a compact city that rewards good pacing, not checklist tourism.",
      "A one- or two-night football weekend works very well here without needing a car.",
    ],

    food: [
      "Traditional Slovak restaurants in or just outside the Old Town",
      "Beer halls and cellar-style pubs",
      "Casual riverfront dining if the weather is good",
      "Coffee and pastry stops around the centre",
      "One stronger dinner booking rather than lots of weak tourist stops",
    ],

    transport:
      "Bratislava is easy if you stay central. Walking covers most city-break needs, while trams, buses, and simple taxi use handle the rest. Tehelné pole is a straightforward stadium trip from the centre. The city is also an excellent rail base for Trnava and a sensible wider base for Dunajská Streda.",

    accommodation:
      "Old Town is the safest all-round base. Around the edge of Staré Mesto also works well if prices are better. Nové Mesto can make sense if Slovan is the main focus, but most visitors should still prioritise central city life over stadium proximity.",
  },

  "dunajska-streda": {
    cityId: "dunajska-streda",
    name: "Dunajská Streda",
    country: "Slovakia",

    overview:
      "Dunajská Streda is a football-first stop built around DAC and the atmosphere at MOL Aréna rather than around big-city tourism. That is not a weakness. It just means you need to plan the trip honestly. The town itself is manageable and straightforward, but most travellers get more value by staying in Bratislava and travelling in for the match. If you do stay local, keep the plan simple and let the football be the centre of gravity.",

    topThings: [
      {
        title: "Town-centre walk",
        tip: "Enough to settle in and understand the place without forcing fake tourism onto a football stop.",
      },
      {
        title: "MOL Aréna area pre-walk",
        tip: "Worth doing because the stadium and the buildup are the whole point here.",
      },
      {
        title: "Local café stop",
        tip: "A good pre-match move before the town gets folded fully into football mode.",
      },
      {
        title: "Simple town-centre meal",
        tip: "Pick one decent place and do not overcomplicate the evening.",
      },
      {
        title: "DAC early arrival",
        tip: "Important here, because atmosphere is the major reason to make the trip.",
      },
      {
        title: "Post-match local drink",
        tip: "Useful if you want the football night to feel complete rather than commuter-style.",
      },
      {
        title: "Short overnight football rhythm",
        tip: "Usually enough if you are staying local at all.",
      },
      {
        title: "Bratislava-linked day trip",
        tip: "Still the smartest option for many travellers.",
      },
      {
        title: "Station-to-ground practical routing",
        tip: "Keep it simple and timed rather than trying to improvise late.",
      },
      {
        title: "Football-led pace",
        tip: "This is not a city to overprogram. Let the match carry the day.",
      },
    ],

    tips: [
      "DAC is the reason to go. Plan around the match, not around pretending the town is a giant city break.",
      "Most travellers should seriously consider a Bratislava base.",
      "If you stay locally, keep the itinerary light and football-led.",
      "MOL Aréna is one of the best pure football experiences in the country.",
      "This is a strong atmosphere trip, not a strong sightseeing trip.",
    ],

    food: [
      "Simple local restaurants in the centre",
      "Pre-match casual food rather than destination dining",
      "Coffee and bakery stops",
      "One practical sit-down dinner if staying overnight",
    ],

    transport:
      "The trip is straightforward if you keep expectations realistic. The station and town centre are the key anchors locally. For most visitors, the smarter transport logic is using Bratislava as the wider base and treating DAC as an in-and-out football mission with proper timing.",

    accommodation:
      "Dunajská Streda centre works if football is the only priority. Bratislava is the stronger overall base if you want nightlife, better hotels, and a fuller city-break layer around the match.",
  },

  zilina: {
    cityId: "zilina",
    name: "Žilina",
    country: "Slovakia",
    thingsToDoUrl: GYG.zilina,

    overview:
      "Žilina is a practical medium-size football city: not a giant tourist magnet, but definitely good enough for a focused overnight built around MŠK. The city is compact, the ground is close enough to keep logistics clean, and the club themselves give the trip more substance than a routine mid-market football stop. The smart way to do Žilina is one overnight, central stay, and a calm schedule that lets football and the town sit together naturally.",

    topThings: [
      {
        title: "Historic centre walk",
        tip: "Best first move. It gives the city shape quickly without overcommitting time.",
      },
      {
        title: "Mariánske Square area",
        tip: "Useful as the natural anchor for food, coffee, and orientation.",
      },
      {
        title: "Central café or bakery stop",
        tip: "A good pre-match move before heading toward the ground.",
      },
      {
        title: "Budatín Castle or short cultural add-on",
        tip: "Only if you have time and want one extra block beyond football and centre life.",
      },
      {
        title: "Štadión pod Dubňom early arrival",
        tip: "Worth doing because the ground is compact and the club are one of the league’s more serious football identities.",
      },
      {
        title: "Post-match city-centre dinner",
        tip: "Better than trying to turn the stadium area into your whole evening.",
      },
      {
        title: "Simple local pub stop",
        tip: "Žilina works better with one grounded local session than with overplanned nightlife.",
      },
      {
        title: "Rail-station practical routing",
        tip: "Good if you are moving between cities and trying to keep the weekend efficient.",
      },
      {
        title: "One-night football city stay",
        tip: "Usually the correct tempo for Žilina.",
      },
      {
        title: "Morning centre reset",
        tip: "Best final move before departure rather than forcing one more attraction.",
      },
    ],

    tips: [
      "Žilina is a very solid football-first overnight, not a flashy tourism weekend.",
      "Stay in the centre and keep the trip walkable.",
      "The city and stadium sit close enough together that bad location choices are avoidable.",
      "Good option if you want a serious football club without the intensity or scale of Bratislava.",
      "One night is usually enough unless you are pairing it with surrounding-region travel.",
    ],

    food: [
      "Central Slovak restaurants",
      "Casual pub food in the old centre",
      "Coffee and pastry stops",
      "One good dinner near the main square rather than random scattered stops",
    ],

    transport:
      "Žilina is easy if you use the centre and rail station as your anchors. The city is compact, the stadium is manageable, and this is one of those places where walking plus a little planning beats trying to optimise every leg.",

    accommodation:
      "Stay in the city centre. That gives you food, bars, and the easiest stadium logic. There is almost no good reason to stay far out unless price forces you to.",
  },

  trnava: {
    cityId: "trnava",
    name: "Trnava",
    country: "Slovakia",

    overview:
      "Trnava is one of the best football-first city trips in Slovakia because the club matter, the atmosphere matters, and the old-town setting is strong enough to support a proper overnight without pretending to be Bratislava. Spartak give the city real domestic weight, and the simple rail link to the capital makes the whole trip very easy. The smart choice is either a clean one-night stay in Trnava itself or a Bratislava base with deliberate match travel in and out.",

    topThings: [
      {
        title: "Old Town walk",
        tip: "A strong starting block that makes Trnava feel more than just a stadium stop.",
      },
      {
        title: "Town walls and historic core",
        tip: "Worth doing on foot rather than trying to tick it off from a taxi window.",
      },
      {
        title: "Main square cafés and bars",
        tip: "A natural pre-match base and better than drifting randomly.",
      },
      {
        title: "One proper local dinner",
        tip: "Trnava is good enough to justify a real booking rather than pure convenience eating.",
      },
      {
        title: "Anton Malatinský Stadium early arrival",
        tip: "Important here because Spartak’s supporter culture is one of the trip’s biggest assets.",
      },
      {
        title: "Post-match old-town return",
        tip: "One of the better Slovak football cities for keeping the night alive after the game.",
      },
      {
        title: "Rail-linked Bratislava add-on",
        tip: "Easy enough if you want to make Trnava part of a bigger weekend base.",
      },
      {
        title: "Traditional pub stop",
        tip: "Good move if you want the trip to feel more local and less like stadium commuting.",
      },
      {
        title: "Morning historic-centre loop",
        tip: "A better final-hour option than forcing another major attraction.",
      },
      {
        title: "One-night football city break",
        tip: "Exactly the right tempo for most Spartak trips.",
      },
    ],

    tips: [
      "Trnava is one of the best atmosphere-led club trips in Slovakia.",
      "Staying locally works very well here; this is not just a commuter match from Bratislava.",
      "Spartak home games are the main event, so do not arrive late and flatten the experience yourself.",
      "Good choice for travellers who want football culture without the scale and price layer of the capital.",
      "Bratislava is a workable base, but Trnava is strong enough to deserve its own overnight.",
    ],

    food: [
      "Old-town Slovak restaurants",
      "Traditional pubs with kitchens",
      "Central cafés before the match",
      "A proper sit-down dinner post-match or pre-match depending kickoff time",
    ],

    transport:
      "Trnava is very easy. The rail connection to Bratislava is one of the cleanest travel links in the league, and once in town the old centre and stadium logic are manageable. This is one of the simplest Slovak football weekends to execute well.",

    accommodation:
      "Old Town is the best base if you are staying in Trnava. If you are doing the match as part of a wider trip, Bratislava remains the obvious alternative. But unlike some smaller towns, Trnava is genuinely worth the local overnight.",
  },

  podbrezova: {
    cityId: "podbrezova",
    name: "Podbrezová",
    country: "Slovakia",

    overview:
      "Podbrezová is a football stop in a scenic part of Slovakia, not a broad-spectrum city break. That needs saying clearly because the trip only works if you plan it honestly. The town itself is small, the stadium is very much a local-ground experience, and most visitors will get more value by pairing the match with a stronger nearby base such as Banská Bystrica. The appeal is not urban variety. The appeal is football plus scenery plus league depth.",

    topThings: [
      {
        title: "Local town-centre walk",
        tip: "Enough to settle in, but do not pretend there is a giant attraction list here.",
      },
      {
        title: "Mountain-region scenery block",
        tip: "This is where the wider trip gets value, especially if you are travelling by car or with extra time.",
      },
      {
        title: "Simple local café stop",
        tip: "Good pre-match move if you are staying nearby or arriving early.",
      },
      {
        title: "Banská Bystrica add-on",
        tip: "Often the smartest way to improve the whole weekend if you need a stronger town base.",
      },
      {
        title: "ZELPO Aréna early arrival",
        tip: "Because the ground is small, it pays to let the local football setting actually register.",
      },
      {
        title: "Post-match practical meal",
        tip: "Keep it simple. This is not the place for overdesigned itinerary building.",
      },
      {
        title: "Short overnight in the region",
        tip: "Better than a long forced same-day mission if you want the stop to feel worthwhile.",
      },
      {
        title: "Rail or road logistics planning",
        tip: "Important here because the broader region matters more than the town alone.",
      },
      {
        title: "Football-and-scenery pacing",
        tip: "This trip improves if you stop expecting city energy and lean into regional calm.",
      },
      {
        title: "One grounded local drink",
        tip: "A better fit than trying to manufacture nightlife that is not really there.",
      },
    ],

    tips: [
      "Podbrezová is a football stop, not a city break.",
      "Banská Bystrica is often the smarter overnight base.",
      "The scenic region does more work for the trip than the town itself.",
      "This is a good choice for proper league travellers, not casual weekenders chasing buzz.",
      "Keep everything practical and the stop makes sense.",
    ],

    food: [
      "Simple local Slovak meals",
      "Practical pub food",
      "Coffee and bakery stops",
      "A stronger dinner in Banská Bystrica if using it as your base",
    ],

    transport:
      "This is a region where planning matters more than city navigation. Podbrezová itself is straightforward once you are there, but the broader routing around trains, roads, and your overnight base is the real key. Do not wing it late.",

    accommodation:
      "Banská Bystrica is the strongest wider base for most travellers. Podbrezová itself only makes sense if you want maximum football proximity and accept the lack of wider city value.",
  },

  michalovce: {
    cityId: "michalovce",
    name: "Michalovce",
    country: "Slovakia",

    overview:
      "Michalovce is a practical eastern-Slovak football stop rather than a high-ceiling destination weekend. It works fine if you keep the expectations right: compact local city, straightforward enough matchday, and a club trip that makes more sense for serious league travellers than for casual football tourists. Many visitors will sensibly use Košice as their wider base and travel in, because the city-break value there is stronger.",

    topThings: [
      {
        title: "Compact centre walk",
        tip: "Enough to understand the place without trying to invent a full attraction itinerary.",
      },
      {
        title: "Simple café or bakery stop",
        tip: "A good pre-match move before the football becomes the whole day.",
      },
      {
        title: "Town-park or calm central loop",
        tip: "Useful if you want the stop to feel less purely transactional.",
      },
      {
        title: "Mestský futbalový štadión early arrival",
        tip: "Because the football setting is small, getting there with time helps the trip feel fuller.",
      },
      {
        title: "Post-match local drink",
        tip: "Works if you are staying locally and want the football night to land properly.",
      },
      {
        title: "Košice-linked day trip logic",
        tip: "Often the smartest way to do this fixture if you want stronger accommodation and nightlife.",
      },
      {
        title: "One practical dinner",
        tip: "Do not overthink it. This is a football-first stop.",
      },
      {
        title: "Short overnight rhythm",
        tip: "Enough if you are staying local at all.",
      },
      {
        title: "Rail-station anchor planning",
        tip: "Keeps the trip cleaner than relying on last-minute local improvisation.",
      },
      {
        title: "Eastern-Slovakia football route-building",
        tip: "Best used as part of a broader eastern circuit rather than a standalone prestige weekend.",
      },
    ],

    tips: [
      "Michalovce is a grounded league stop, not a glamour recommendation.",
      "Košice is often the better base if you want more than just the football.",
      "Stay local only if the aim is to keep the trip purely club-focused.",
      "The match should be the centre of gravity. Do not expect a huge city around it.",
      "Good for travellers who are serious about covering the league properly.",
    ],

    food: [
      "Simple local restaurants",
      "Basic pub food",
      "Coffee and pastries in the centre",
      "A stronger meal in Košice if you are basing there instead",
    ],

    transport:
      "Michalovce is straightforward locally, but the bigger transport decision is really where you base yourself. Košice gives the best wider travel and nightlife logic. If you stay local, keep everything centred and low-fuss.",

    accommodation:
      "Local city-centre stays are fine for pure football practicality. Košice is the stronger recommendation for most travellers who want the football plus a better wider city experience.",
  },

  kosice: {
    cityId: "kosice",
    name: "Košice",
    country: "Slovakia",
    thingsToDoUrl: GYG.kosice,

    overview:
      "Košice is one of the best all-round city breaks in Slovak football outside Bratislava because it gives you a proper city, a new stadium, a strong old-town core, and enough nightlife and architecture to make the weekend stand up even if the match itself is only average. It is the cleanest eastern-Slovak football base and works well both for FC Košice and as a wider anchor for other eastern trips. The right play is simple: stay in or near the Old Town, walk the city properly, and let the football slot into a wider city weekend.",

    topThings: [
      {
        title: "Hlavná Street walk",
        tip: "This is the spine of the city and the fastest way to see why Košice works so well.",
      },
      {
        title: "St Elisabeth Cathedral area",
        tip: "Best done as part of your wider old-town loop rather than as a standalone mission.",
      },
      {
        title: "Old Town café and bar block",
        tip: "One of the city’s biggest strengths. Use it well.",
      },
      {
        title: "Evening old-town pub session",
        tip: "Košice is good enough for a proper city night, not just a quick match pint.",
      },
      {
        title: "Lower old-town side streets",
        tip: "Worth doing if you want the city to feel less like a single boulevard and more rounded.",
      },
      {
        title: "Košická Futbalová Aréna early arrival",
        tip: "The stadium is new enough that it is part of the point of the trip, so give it some time.",
      },
      {
        title: "Post-match Old Town return",
        tip: "Very easy and one of the best parts of making Košice your base.",
      },
      {
        title: "Morning city-centre reset",
        tip: "Ideal before departure and much better than forcing a rushed extra museum block.",
      },
      {
        title: "Košice as eastern base",
        tip: "A very smart way to link Michalovce or Prešov without killing the weekend vibe.",
      },
      {
        title: "One stronger dinner booking",
        tip: "Worth it here because the city is genuinely good enough to support one.",
      },
    ],

    tips: [
      "Košice is one of the smartest non-capital bases in the entire Slovak league.",
      "Stay in the Old Town. That is the obvious correct move.",
      "The city is strong enough to justify the trip even before the football starts.",
      "Good option if you want to stack multiple eastern Slovak fixtures from one base.",
      "One or two nights both make sense here, which is not true for many league cities.",
    ],

    food: [
      "Old-town Slovak and Central European restaurants",
      "Wine bars and bistros",
      "Coffee and pastry stops on or near Hlavná Street",
      "Casual pub food before the match",
      "One proper dinner after football rather than too much random grazing",
    ],

    transport:
      "Košice is easy if you stay central. The old town is walkable, the stadium trip is manageable, and the airport is close enough to keep the whole weekend low-fuss. It is also the best eastern-Slovak transport base if you are building a multi-city football route.",

    accommodation:
      "Old Town is the best base by a distance. It gives you food, bars, architecture, and easy stadium access. Staying outside it usually costs you more in atmosphere than you gain in convenience.",
  },

  komarno: {
    cityId: "komarno",
    name: "Komárno",
    country: "Slovakia",

    overview:
      "Komárno is a football-first stop and a niche one at that. The city itself has some local and border-town character, but this is not a major Slovak city-break draw. The match matters more than the attraction list. If you are going, go because you want the club and the league coverage, not because you expect a huge football-tourism weekend. Nearby stronger bases can improve the experience if you want more around the fixture.",

    topThings: [
      {
        title: "Town-centre walk",
        tip: "Useful for grounding the stop, but do not try to turn it into a giant sightseeing day.",
      },
      {
        title: "Fortress or riverside local context",
        tip: "Worth a short look if you want the town to feel more specific than just a fixture pin.",
      },
      {
        title: "Simple local café stop",
        tip: "A good way to give the trip some rhythm before the match.",
      },
      {
        title: "ViOn Aréna travel planning",
        tip: "Important because the temporary home setup means you need to think more practically about the football leg.",
      },
      {
        title: "One practical meal",
        tip: "Keep it grounded. This is not destination dining territory.",
      },
      {
        title: "Post-match low-key local drink",
        tip: "Works only if you are staying local and want the stop to breathe a little.",
      },
      {
        title: "Nitra-linked base logic",
        tip: "Often smarter if you want something wider around the fixture.",
      },
      {
        title: "Border-town pacing",
        tip: "Lean into the smaller-scale feel rather than fighting it.",
      },
      {
        title: "Football-led overnight",
        tip: "Enough if you are staying at all.",
      },
      {
        title: "League-depth travel mindset",
        tip: "The trip works best when you know exactly why you are doing it.",
      },
    ],

    tips: [
      "Komárno is not a glamour trip. It is a proper league-depth stop.",
      "If you want more around the match, a stronger nearby base can help.",
      "Plan the stadium leg carefully because the club’s current home setup is part of the complexity.",
      "Good for serious groundhoppers and full-league travellers.",
      "Keep expectations low and the trip becomes much more enjoyable.",
    ],

    food: [
      "Simple local Central European meals",
      "Small-town café stops",
      "Practical pub food",
      "A stronger dinner in a nearby larger base if using one",
    ],

    transport:
      "The wider routing matters more than local city navigation here. Once you are in place, the stop is manageable. The bigger question is whether you are staying locally or using a smarter nearby base to make the overall weekend better.",

    accommodation:
      "Komárno can work for a pure football stop, but nearby larger bases often make more sense if you want more hotel choice and a stronger non-football layer around the trip.",
  },

  ruzomberok: {
    cityId: "ruzomberok",
    name: "Ružomberok",
    country: "Slovakia",

    overview:
      "Ružomberok is a football-town stop in a scenic part of Slovakia and works best when treated exactly that way. It is not a major nightlife city and not a broad urban weekend. What it does offer is a credible football club, mountain-region atmosphere, and a calmer, more grounded kind of trip than the league’s bigger city entries. The smart play is a simple overnight with the football at the centre and the surroundings adding texture rather than trying to manufacture a giant itinerary.",

    topThings: [
      {
        title: "Town-centre walk",
        tip: "Enough to understand the place without dragging the day out unnecessarily.",
      },
      {
        title: "Scenic mountain backdrop block",
        tip: "One of the best reasons to appreciate the stop properly rather than treating it as just a fixture pin.",
      },
      {
        title: "Simple local café",
        tip: "A good pre-match anchor in a town of this scale.",
      },
      {
        title: "Štadión pod Čebraťom early arrival",
        tip: "Because the stadium is compact, getting there with time helps the football-town feel land better.",
      },
      {
        title: "Post-match central drink",
        tip: "Useful if you stayed overnight and want the evening to keep some shape.",
      },
      {
        title: "One practical dinner",
        tip: "Do not overdesign this. Just choose one decent local option.",
      },
      {
        title: "Morning scenic reset",
        tip: "A good final block if the weather is on your side.",
      },
      {
        title: "Rail-linked regional trip",
        tip: "Works if you are combining football with a broader central-Slovakia route.",
      },
      {
        title: "Football-and-landscape pacing",
        tip: "The place improves when you let the setting do part of the work.",
      },
      {
        title: "One-night football town rhythm",
        tip: "Usually the perfect amount of time here.",
      },
    ],

    tips: [
      "Ružomberok is a proper football-town stop, not a city-break heavyweight.",
      "The scenery adds real value if you lean into it.",
      "Stay central and keep the whole weekend simple.",
      "Best for travellers who like smaller clubs and quieter settings.",
      "Do not try to force giant nightlife or attraction density onto the trip.",
    ],

    food: [
      "Simple Slovak restaurants",
      "Traditional local meals",
      "Coffee and pastries in the town centre",
      "One practical sit-down dinner rather than multiple weaker stops",
    ],

    transport:
      "Ružomberok is about practical routing more than city transport sophistication. The town itself is manageable. The important thing is keeping your base central and not making the regional movement harder than it needs to be.",

    accommodation:
      "Town-centre stays are the obvious choice. This is not the sort of place where complicated accommodation strategy creates meaningful upside.",
  },

  trencin: {
    cityId: "trencin",
    name: "Trenčín",
    country: "Slovakia",
    thingsToDoUrl: GYG.trencin,

    overview:
      "Trenčín is one of the most attractive medium-size city trips in the Slovak league because it has more visual character than most clubs in its bracket can offer. The castle, old-town feel, and relatively easy scale make it a very workable one-night football break. It is not Bratislava, but it does not need to be. The city is strong enough to support the football naturally, and AS Trenčín give the stop proper sporting substance.",

    topThings: [
      {
        title: "Castle and upper-town viewpoint",
        tip: "One of the best visual payoffs in the whole league set. Do not skip it if the weather allows.",
      },
      {
        title: "Old Town streets walk",
        tip: "Best early move for getting the place under control quickly.",
      },
      {
        title: "Main square café stop",
        tip: "A clean anchor for the day before football takes over.",
      },
      {
        title: "Riverside or lower-town loop",
        tip: "Good as a calm reset block rather than a headline attraction.",
      },
      {
        title: "Traditional pub session",
        tip: "Trenčín works well when you keep the evening local and grounded.",
      },
      {
        title: "Štadión Sihoť early arrival",
        tip: "Worth doing because the castle and football setting together are part of the trip’s appeal.",
      },
      {
        title: "Post-match old-town return",
        tip: "This city is small enough that football and evening city life fit together well.",
      },
      {
        title: "One strong dinner booking",
        tip: "Useful if you want the overnight to feel like a proper city break rather than just a ground tick.",
      },
      {
        title: "Morning final castle-view loop",
        tip: "Great last-hour move before leaving.",
      },
      {
        title: "One-night football city break",
        tip: "Exactly the right rhythm for Trenčín.",
      },
    ],

    tips: [
      "Trenčín is one of the better all-round non-heavyweight trips in the Slovak league.",
      "Stay in or near the Old Town.",
      "The castle genuinely improves the weekend, so use it properly.",
      "Good option if you want football plus city character without the bigger-capital feel.",
      "One overnight is usually enough, but it is a very good one.",
    ],

    food: [
      "Old-town Slovak and Central European restaurants",
      "Simple pub meals",
      "Coffee and pastry stops in the centre",
      "One proper dinner with a castle-area or central setting if possible",
    ],

    transport:
      "Trenčín is easy to handle. The centre is walkable, the old town is compact, and the football leg can be folded into the wider weekend without much trouble. This is a city where walking does most of the useful work.",

    accommodation:
      "Old Town is the best base. That gives you the strongest city feel and the easiest flow between sightseeing, food, and the match.",
  },

  presov: {
    cityId: "presov",
    name: "Prešov",
    country: "Slovakia",
    thingsToDoUrl: GYG.presov,

    overview:
      "Prešov is a historical regional city whose football value is tied heavily to Tatran and the club’s older-name status. It is not the strongest city break in the league, but it has more substance than a flat one-club stop because the centre carries some real local character and the new stadium improves the football proposition. The best way to do Prešov is one grounded overnight with the football at the centre and the city providing a modest but real supporting layer.",

    topThings: [
      {
        title: "Historic centre walk",
        tip: "A useful first move that gives the city more shape than outsiders often expect.",
      },
      {
        title: "Main square and church area",
        tip: "Best central anchor for food, coffee, and basic orientation.",
      },
      {
        title: "Local café or bakery stop",
        tip: "Good pre-match block that helps the trip feel more city-based than stadium-only.",
      },
      {
        title: "Short old-town architecture loop",
        tip: "Worth doing if you want the stop to feel more rounded without overplanning.",
      },
      {
        title: "Futbal Tatran Arena early arrival",
        tip: "Important because the new stadium is part of why this trip has become easier to recommend.",
      },
      {
        title: "Post-match central return",
        tip: "Better than treating the venue area as the whole evening.",
      },
      {
        title: "Simple local dinner",
        tip: "Keep it clean and grounded. Prešov is not trying to be a giant restaurant city.",
      },
      {
        title: "Košice-linked travel option",
        tip: "Useful if you want a stronger wider base while still covering Tatran.",
      },
      {
        title: "Morning old-centre reset",
        tip: "A better final-hour move than forcing one more random attraction.",
      },
      {
        title: "One-night football city stay",
        tip: "Usually the right amount of time here.",
      },
    ],

    tips: [
      "Prešov is more interesting than a raw table glance suggests because the club name still carries weight.",
      "The new stadium improves the trip considerably.",
      "Stay central if you are sleeping locally.",
      "Košice can work as a wider base, but Prešov itself is enough for a clean football overnight.",
      "Good for travellers who like older clubs with some history and a rebuilding feel.",
    ],

    food: [
      "Simple Slovak restaurants in the centre",
      "Coffee and pastries around the main square",
      "Practical pub meals",
      "One decent local dinner rather than trying to turn it into a gourmet weekend",
    ],

    transport:
      "Prešov is manageable once you use the centre as your anchor. The main planning decision is whether you base locally or use Košice as the wider city hub. Either can work, but local stays make the football trip feel more focused.",

    accommodation:
      "City-centre stays are the best local option. Košice remains the stronger wider base if you want more nightlife and a broader city layer around the football.",
  },

  skalica: {
    cityId: "skalica",
    name: "Skalica",
    country: "Slovakia",

    overview:
      "Skalica is a very small football-town stop near the Czech border and should be treated exactly that way. It is not a broad city break, not a nightlife destination, and not somewhere you go for a premium stadium experience. What it offers is a tiny-scale top-flight matchday and a chance to see the smaller end of Slovak football properly. The trip only works if you stop expecting more than that. Brno can be a smarter wider base if you want stronger accommodation and city value around the fixture.",

    topThings: [
      {
        title: "Compact centre walk",
        tip: "Enough to understand the town and no more needs to be forced.",
      },
      {
        title: "Local café or pastry stop",
        tip: "A good way to give the day some structure before the football.",
      },
      {
        title: "Historic-town feel block",
        tip: "Worth a short wander, but this is not a city that supports hours of attraction hunting.",
      },
      {
        title: "Mestský štadión early arrival",
        tip: "Useful because at this scale the closeness of the whole matchday is part of the point.",
      },
      {
        title: "Post-match simple drink",
        tip: "Fine if you stayed local and want the stop to land a little more fully.",
      },
      {
        title: "Brno-linked wider base",
        tip: "A strong option if you want better hotels and nightlife while still catching the game.",
      },
      {
        title: "One practical dinner",
        tip: "Do not complicate this. Keep it small-town and easy.",
      },
      {
        title: "Border-region football mindset",
        tip: "This stop is best understood as part of a broader route, not as a major standalone weekend.",
      },
      {
        title: "One-night football stop",
        tip: "Enough if you insist on staying local.",
      },
      {
        title: "League-completion pacing",
        tip: "This is a serious-traveller trip, not a casual football-tourism headline.",
      },
    ],

    tips: [
      "Skalica is a tiny-scale top-flight stop. Plan with that reality, not fantasy.",
      "Brno can be the smarter wider base for many travellers.",
      "Stay local only if the point is to keep the match extremely close and simple.",
      "Best for proper groundhoppers and full-league travellers.",
      "Do not try to inflate the weekend. It works precisely because it is small.",
    ],

    food: [
      "Simple local restaurants",
      "Basic pub food",
      "Coffee and bakery stops",
      "A stronger dinner in Brno if using it as your wider base",
    ],

    transport:
      "The key here is wider routing, not city transport complexity. Once you are local, everything is small enough to manage. The bigger strategic decision is whether you build the trip from Skalica itself or from a stronger nearby base.",

    accommodation:
      "Local stays work for pure football practicality. Brno is the stronger recommendation if you want a much better non-football layer and are happy to travel to the match.",
  },
};

export default superLigaSlovakiaCityGuides;
