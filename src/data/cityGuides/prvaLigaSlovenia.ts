import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
 */
const GYG = {
  ljubljana:
    "https://www.getyourguide.com/en-gb/ljubljana-l318/?partner_id=MAQJREP&utm_medium=online_publisher",
  maribor:
    "https://www.getyourguide.com/en-gb/maribor-l1338/?partner_id=MAQJREP&utm_medium=online_publisher",
  koper:
    "https://www.getyourguide.com/en-gb/koper-l1320/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const prvaLigaSloveniaCityGuides: Record<string, CityGuide> = {
  ljubljana: {
    cityId: "ljubljana",
    name: "Ljubljana",
    country: "Slovenia",
    thingsToDoUrl: GYG.ljubljana,

    overview:
      "Ljubljana is the strongest football city break in Slovenia by a distance because it gives you the best airport access, the best nightlife, the best hotel stock, and the easiest all-round city experience while also covering two clubs at the same stadium. Olimpija are the main event, Bravo are the alternative city-club angle, and the wider city is compact enough that the whole weekend can be done smoothly without needing a car. The smart formula is simple: stay central, treat the old town and river as your social base, then head to Stožice with proper timing rather than building the whole day around the stadium area.",

    topThings: [
      {
        title: "Old Town and riverfront loop",
        tip: "Best first move in the city. It gives you the shape of Ljubljana immediately without wasting time.",
      },
      {
        title: "Ljubljana Castle",
        tip: "Worth doing for the views, but go at a sensible hour rather than peak tourist crush time.",
      },
      {
        title: "Triple Bridge and central square area",
        tip: "Useful as a natural city anchor, not a place to stand around for hours.",
      },
      {
        title: "Riverside café and evening bars",
        tip: "One of the city’s main strengths, especially if you want the weekend to feel properly alive without chaos.",
      },
      {
        title: "Metelkova alternative-nightlife stop",
        tip: "Good if you want a rougher-edged, more alternative side of Ljubljana rather than polished tourist bars.",
      },
      {
        title: "Tivoli Park reset walk",
        tip: "Ideal morning-after move if you stayed out and want the city to slow down a bit.",
      },
      {
        title: "Central market and food stop",
        tip: "Strong daytime block if you want the city to feel local rather than purely scenic.",
      },
      {
        title: "Stožice early arrival",
        tip: "Important for bigger Olimpija fixtures because the stadium works better when you treat it as a proper matchday rather than a rushed commute.",
      },
      {
        title: "Bravo match as contrast trip",
        tip: "Useful if you want to see Ljubljana football without the full Olimpija status weight and pressure.",
      },
      {
        title: "Morning final coffee by the river",
        tip: "A better last block than trying to cram one more forced attraction before heading out.",
      },
    ],

    tips: [
      "Ljubljana is compact, so do not overcomplicate the city plan.",
      "Stay central. That is the obvious right answer for almost everyone.",
      "Stožice is easy enough from the centre, so there is no reason to stay out by the stadium unless price forces it.",
      "Olimpija are the main club experience; Bravo are the useful secondary contrast inside the same city.",
      "This is the best Slovenia football weekend if you want city quality and easy logistics together.",
    ],

    food: [
      "Riverside restaurants in the old centre",
      "Traditional Slovenian dining in the old town",
      "Casual wine bars and bistros",
      "Coffee and pastry stops around the centre",
      "One proper dinner booking rather than too much random grazing",
    ],

    transport:
      "Ljubljana is one of the easiest cities in this whole project to handle. The centre is highly walkable, buses cover the wider links, and taxis are simple enough when needed. Stožice is straightforward from the centre if you use basic timing instead of last-minute improvisation. Airport transfer logic is also cleaner here than in most Slovenian league cities.",

    accommodation:
      "Old Town or just outside it is the best base. That gives you nightlife, food, river walks, and easy movement to Stožice. Bežigrad is only worth prioritising if you care more about stadium proximity than actual city experience, which most people should not.",
  },

  maribor: {
    cityId: "maribor",
    name: "Maribor",
    country: "Slovenia",
    thingsToDoUrl: GYG.maribor,

    overview:
      "Maribor is one of the best football cities in Slovenia because the club are major, the city is big enough to support a proper overnight, and Ljudski vrt gives the trip real football credibility. It is not as polished or as easy-flight convenient as Ljubljana, but it is one of the strongest pure club-and-city combinations in the league. The right move is to stay in or near the old town, let the city centre carry the daytime and evening, and treat matchday as a natural extension of the weekend rather than its only purpose.",

    topThings: [
      {
        title: "Old Town riverside walk",
        tip: "A very clean first block that gives the city structure quickly.",
      },
      {
        title: "Lent district",
        tip: "One of the better parts of the city to use as a relaxed food and drinks zone.",
      },
      {
        title: "Main square and central café stop",
        tip: "Good as a daytime anchor before football or a wider city loop.",
      },
      {
        title: "Wine-bar evening",
        tip: "Maribor is strong for a calmer, more grown-up evening rather than pure chaos.",
      },
      {
        title: "Pohorje add-on if staying longer",
        tip: "Only if you actually have time; do not jam it into a short football weekend.",
      },
      {
        title: "Ljudski vrt early arrival",
        tip: "Worth doing because this is one of the most important club grounds in the country.",
      },
      {
        title: "Pre-match central dinner",
        tip: "The city centre is the smarter place to eat than hovering pointlessly near the ground too early.",
      },
      {
        title: "Post-match old-town return",
        tip: "One of the reasons Maribor works well is that the city can keep the night alive after football.",
      },
      {
        title: "Morning coffee by the river",
        tip: "Good final block before departure and better than forcing one more museum stop.",
      },
      {
        title: "One-night football city break",
        tip: "Usually the perfect rhythm for Maribor unless you are adding wider regional travel.",
      },
    ],

    tips: [
      "Maribor is one of the essential club trips in Slovenia.",
      "Stay central or near the old town. That is the correct base.",
      "Ljudski vrt is a proper football ground, so do not rush the matchday.",
      "Very good option if you want atmosphere and a credible city break without needing the capital.",
      "One overnight works really well here. Two can also make sense if you want a slower pace.",
    ],

    food: [
      "Old-town Slovenian restaurants",
      "Wine bars and relaxed evening dining",
      "Simple pub food before the match",
      "Coffee and pastries in the centre",
      "One stronger sit-down dinner if making a full weekend of it",
    ],

    transport:
      "Maribor is easy if you stay central. The old town and station area are manageable on foot, and Ljudski vrt is not a difficult stadium trip from a good base. The wider transport question matters more than the inner-city one, especially if you are arriving via Graz or rail.",

    accommodation:
      "Old Town is the best overall base. Near the railway station can also work if onward travel matters a lot, but most visitors should prioritise the old-centre feel and walkability.",
  },

  celje: {
    cityId: "celje",
    name: "Celje",
    country: "Slovenia",

    overview:
      "Celje is a practical football city rather than a huge destination break, but it works well enough if you treat it honestly. The club are serious, the stadium is one of the better ones in the league, and the town is manageable for a clean football overnight. What Celje is not is a nightlife heavyweight or a city you should pretend has endless layers. The correct formula is one overnight, central base, and a match-led schedule with one or two sensible daytime blocks.",

    topThings: [
      {
        title: "Old centre walk",
        tip: "Enough to get the city under control without overcommitting time.",
      },
      {
        title: "Celje Castle",
        tip: "Worth doing if you want one stronger sightseeing block beyond the football.",
      },
      {
        title: "Central café stop",
        tip: "A smart low-effort move before heading toward the stadium later.",
      },
      {
        title: "Riverside or old-town short loop",
        tip: "Useful as a calm daytime reset rather than a headline attraction.",
      },
      {
        title: "Stadion Z'dežele early arrival",
        tip: "Worth doing because it is one of the more substantial grounds in the league.",
      },
      {
        title: "Pre-match dinner in the centre",
        tip: "Better than wasting too much time near the ground.",
      },
      {
        title: "Post-match central return",
        tip: "The city is small enough that this keeps the whole trip tidy.",
      },
      {
        title: "One practical local drink",
        tip: "A better fit than trying to manufacture a huge nightlife crawl.",
      },
      {
        title: "Morning final city-centre reset",
        tip: "The right way to finish a Celje overnight.",
      },
      {
        title: "Ljubljana-linked football routing",
        tip: "A smart option if you want a stronger wider base and do not mind the travel in.",
      },
    ],

    tips: [
      "Celje is a good football overnight, not a giant city-break destination.",
      "Stay in the centre if you are staying locally at all.",
      "Ljubljana can work as a wider base, but Celje itself is fine for a one-night football stop.",
      "The stadium is better than a lot of the league, so it does help the trip.",
      "Keep the plan clean and practical and it works well enough.",
    ],

    food: [
      "Simple Slovenian restaurants in the centre",
      "Coffee and pastry stops",
      "A practical pre-match meal in town",
      "One decent sit-down dinner rather than scattered weak stops",
    ],

    transport:
      "Celje is manageable if you use the centre and rail station as your anchors. The real value is that it is straightforward. The city is not complicated, and bad planning is more likely to come from overthinking it than underthinking it.",

    accommodation:
      "Celje centre is the best local base. Ljubljana becomes the stronger alternative only if you want a much better nightlife and hotel layer around the match.",
  },

  koper: {
    cityId: "koper",
    name: "Koper",
    country: "Slovenia",
    thingsToDoUrl: GYG.koper,

    overview:
      "Koper is one of the best away-style weekends in the Slovenian league because the football sits inside a very easy coastal break. The city is compact, attractive enough, and naturally relaxed, while FC Koper give the trip a real top-flight anchor. The smart way to use Koper is not to overload it with fake big-city expectations. Just stay near the old town or coast, enjoy the Adriatic atmosphere, and treat the match as part of a wider seaside football weekend.",

    topThings: [
      {
        title: "Koper Old Town walk",
        tip: "Best first move. It gets the city’s scale and charm across very quickly.",
      },
      {
        title: "Seafront and harbour area",
        tip: "A strong daytime block and one of the reasons the trip feels different from inland league stops.",
      },
      {
        title: "Tito Square and historic core",
        tip: "Worth doing as part of your main city loop rather than treating it as a separate mission.",
      },
      {
        title: "Coastal dinner or drink stop",
        tip: "Use the setting. It is one of the main reasons to make the trip.",
      },
      {
        title: "Bonifika early arrival",
        tip: "Important if you want the football to feel like more than an add-on to a beach-style weekend.",
      },
      {
        title: "Post-match old-town return",
        tip: "One of the easiest cities in the league for shifting from football back into the evening.",
      },
      {
        title: "Piran or Portorož add-on",
        tip: "Worth it if you have two nights and want a broader Slovenian coast feel.",
      },
      {
        title: "Morning waterfront coffee",
        tip: "The perfect final block before moving on.",
      },
      {
        title: "Short Adriatic football break",
        tip: "Exactly what Koper is best at.",
      },
      {
        title: "Trieste-linked travel option",
        tip: "Useful if you are coming in via Italy and building a wider regional route.",
      },
    ],

    tips: [
      "Koper is one of the best overall weekend trips in the Slovenian league.",
      "Stay in or near the old town if possible.",
      "This is football plus coast. Let both parts do the work.",
      "Bonifika is not a giant stadium, so the city and setting carry a lot of the overall appeal.",
      "A one- or two-night stay both make sense here.",
    ],

    food: [
      "Seafood and coastal Slovenian/Italian-influenced meals",
      "Old-town restaurants",
      "Casual seafront bars and cafés",
      "Coffee and pastry stops in the compact centre",
      "One proper evening booking if you are making a full weekend of it",
    ],

    transport:
      "Koper is compact enough that walking solves most of the useful city movement. Bonifika is manageable from a central base, and the wider challenge is really how you arrive into the coast rather than how you move once you are there.",

    accommodation:
      "Koper Old Town is the best base. Piran or Portorož can also work if you are prioritising a stronger seaside-break feel and do not mind treating the football as a travel-in element.",
  },

  domzale: {
    cityId: "domzale",
    name: "Domžale",
    country: "Slovenia",

    overview:
      "Domžale is a football stop in the Ljubljana orbit, not a standalone premium city break. The club are credible, but the location itself is best used pragmatically. Most travellers should stay in Ljubljana and travel in unless they specifically want a quiet, match-only overnight. That is the blunt truth. The good news is that the trip is easy, the club are worth seeing for the right reasons, and the connection to the capital keeps the whole thing low-friction.",

    topThings: [
      {
        title: "Small town-centre walk",
        tip: "Enough to settle the place, but do not force a giant itinerary onto it.",
      },
      {
        title: "Simple local café stop",
        tip: "A smart pre-match move if you are staying or arriving early.",
      },
      {
        title: "Ljubljana-linked split stay",
        tip: "Usually the best way to do Domžale properly.",
      },
      {
        title: "Športni park Domžale early arrival",
        tip: "Worth doing because the football itself is the main reason you came.",
      },
      {
        title: "Post-match Ljubljana return",
        tip: "Often smarter than trying to build a full night around Domžale itself.",
      },
      {
        title: "Practical dinner",
        tip: "Keep it simple. This is not a food-destination stop.",
      },
      {
        title: "One local drink if staying over",
        tip: "Enough to make the football trip feel complete without pretending there is huge nightlife.",
      },
      {
        title: "Fast rail or road connection planning",
        tip: "The ease of linking back to Ljubljana is one of the city’s main strengths.",
      },
      {
        title: "Football-only overnight",
        tip: "Fine if that is the explicit aim, but not the best wider Slovenia weekend base.",
      },
      {
        title: "Capital-area fixture stacking",
        tip: "Very useful if you are trying to catch multiple clubs around Ljubljana.",
      },
    ],

    tips: [
      "Most people should base in Ljubljana, not Domžale.",
      "Domžale works best as a football stop, not a city break.",
      "The club are more interesting than the town from a traveller’s point of view.",
      "Easy logistics are the main advantage here.",
      "Good in a multi-club Slovenia weekend rather than as a single headline trip.",
    ],

    food: [
      "Simple local restaurants",
      "Coffee and bakery stops",
      "Basic pre-match meals",
      "A better dinner back in Ljubljana if you are using the capital as your base",
    ],

    transport:
      "The entire point of Domžale travel is that it is easy from Ljubljana. Keep the capital as your main anchor and this becomes a straightforward football leg rather than a destination-planning exercise.",

    accommodation:
      "Ljubljana centre is the best base by far. Local Domžale stays only make sense if you want a very quiet, very football-focused stop with no real need for nightlife or broader city atmosphere.",
  },

  radomlje: {
    cityId: "radomlje",
    name: "Radomlje",
    country: "Slovenia",

    overview:
      "Radomlje is not a city break. It is a tiny football stop in the Ljubljana area and should be planned exactly that way. The match is the point. The town is not where you build a wide weekend. Anyone pretending otherwise is wasting time. The right approach is to base in Ljubljana or occasionally Domžale, head in for the fixture, and treat Radomlje as part of a broader Slovenia football route rather than a destination in its own right.",

    topThings: [
      {
        title: "Quick local orientation walk",
        tip: "Enough to stop the trip feeling totally transactional, but nothing more is needed.",
      },
      {
        title: "Simple local coffee stop",
        tip: "The right kind of scale for this place.",
      },
      {
        title: "Športni park Radomlje early arrival",
        tip: "Because the ground is tiny, getting there with time helps the experience feel fuller.",
      },
      {
        title: "Ljubljana-based football day",
        tip: "By far the smartest way to do this fixture for most people.",
      },
      {
        title: "Domžale local anchor",
        tip: "Useful if you want the nearest stronger practical base.",
      },
      {
        title: "Post-match immediate move",
        tip: "Often the right answer unless you are deliberately doing the smallest-scale local experience possible.",
      },
      {
        title: "Capital-area league coverage",
        tip: "Radomlje makes sense as part of a broader football plan, not a standalone prestige trip.",
      },
      {
        title: "One practical meal",
        tip: "Keep it basic and move on.",
      },
      {
        title: "Tiny-venue football mindset",
        tip: "The appeal is closeness and honesty, not stadium spectacle.",
      },
      {
        title: "Short local stop, no drama",
        tip: "That is the right tone for Radomlje.",
      },
    ],

    tips: [
      "Base in Ljubljana unless you have a very specific reason not to.",
      "Radomlje is one of the smallest-scale trips in the whole project.",
      "Good for serious league travellers, not casual football tourists.",
      "Do not overdesign this stop. That just makes it worse.",
      "Treat the match as a useful part of a broader route rather than the main event of an entire weekend.",
    ],

    food: [
      "Simple local cafés",
      "Basic practical meals",
      "A better dinner in Ljubljana or Domžale afterward",
      "Coffee and pastry stops rather than full destination dining",
    ],

    transport:
      "The key decision is not how to move around Radomlje. It is where to base yourself. Ljubljana is the best answer for almost everyone. From there, the football leg is straightforward enough and the rest of the weekend does not suffer.",

    accommodation:
      "Ljubljana is the correct base. Domžale can work as a nearby fallback. Radomlje itself should only be your stay choice if you are intentionally doing the most stripped-down football stop possible.",
  },

  kidricevo: {
    cityId: "kidricevo",
    name: "Kidričevo",
    country: "Slovenia",

    overview:
      "Kidričevo is a football-first stop in the bluntest possible sense. This is not a broad tourism weekend, not a nightlife city, and not somewhere you go for urban depth. You go because Aluminij are there and because you want to cover the league properly. The better versions of this trip usually involve staying in Ptuj or Maribor and treating Kidričevo as the match leg inside a wider regional route.",

    topThings: [
      {
        title: "Short local orientation loop",
        tip: "Enough to understand the place without forcing fake sightseeing.",
      },
      {
        title: "Coffee stop before the match",
        tip: "A practical move in a stop of this scale.",
      },
      {
        title: "Športni park Aluminij early arrival",
        tip: "Important if you want the football part to feel like more than a rushed tick.",
      },
      {
        title: "Ptuj add-on",
        tip: "The smartest nearby pairing if you want more charm around the fixture.",
      },
      {
        title: "Maribor wider base option",
        tip: "Best if you want a stronger city and better overall travel weekend.",
      },
      {
        title: "One practical meal",
        tip: "This is not destination dining territory. Keep it simple.",
      },
      {
        title: "Post-match move to better base",
        tip: "Often the right call instead of forcing a full local night.",
      },
      {
        title: "Regional football routing",
        tip: "Best if Aluminij is one piece of a bigger Slovenia plan.",
      },
      {
        title: "Tiny-ground appreciation",
        tip: "The point is intimacy and league depth, not glamour.",
      },
      {
        title: "Quiet overnight only if necessary",
        tip: "Most people get more value sleeping elsewhere.",
      },
    ],

    tips: [
      "Kidričevo is a football stop, nothing more.",
      "Ptuj or Maribor are usually better bases.",
      "Do not try to build a whole premium weekend around Aluminij alone.",
      "Good for proper league coverage and small-ground fans.",
      "Keep everything practical and this trip makes sense.",
    ],

    food: [
      "Simple local meals",
      "Basic café stops",
      "A stronger dinner in Ptuj or Maribor",
      "Functional pre-match food rather than experience dining",
    ],

    transport:
      "The main question here is where you are sleeping, not how you navigate Kidričevo itself. The football leg is manageable enough once you are in the region. The real planning value is in choosing a stronger surrounding base.",

    accommodation:
      "Ptuj is the best nearby choice for character. Maribor is the stronger wider choice for nightlife, transport, and broader city value. Kidričevo itself is only for the most stripped-down football-focused plan.",
  },

  "murska-sobota": {
    cityId: "murska-sobota",
    name: "Murska Sobota",
    country: "Slovenia",

    overview:
      "Murska Sobota is not one of Slovenia’s strongest city breaks, but it is one of the strongest football-first identity trips because Mura carry real local weight. The city itself is practical rather than spectacular, yet the club make the stop worthwhile for anyone who values supporter culture and place-based football. The smart way to do it is simple: stay centrally if you are staying local, keep the schedule light, and let the club rather than the city carry the emotional centre of the weekend.",

    topThings: [
      {
        title: "Compact centre walk",
        tip: "Enough to settle the city without pretending it has huge sightseeing density.",
      },
      {
        title: "Local café or bakery stop",
        tip: "Good pre-match anchor and part of the slower pace that suits the trip.",
      },
      {
        title: "Fazanerija early arrival",
        tip: "Important because Mura’s atmosphere is one of the real reasons to travel here.",
      },
      {
        title: "Post-match central return",
        tip: "Best if you are staying local and want the football night to land properly.",
      },
      {
        title: "One traditional local meal",
        tip: "Keep it grounded and regional rather than chasing something overdesigned.",
      },
      {
        title: "Morning-after slow reset",
        tip: "The right way to finish a Mura overnight.",
      },
      {
        title: "Maribor-based wider routing",
        tip: "Useful if you want a stronger city around the football but are happy to travel more.",
      },
      {
        title: "Football-led overnight",
        tip: "Exactly what this city is best at.",
      },
      {
        title: "Regional identity pacing",
        tip: "This trip works because it feels local, not because it is packed with attractions.",
      },
      {
        title: "One proper pub stop",
        tip: "Better than trying to turn the place into a nightlife sprint.",
      },
    ],

    tips: [
      "Mura are the reason to go. Plan around the club, not around fake big-city expectations.",
      "Stay central if sleeping in Murska Sobota.",
      "This is one of the best atmosphere-led trips outside Slovenia’s biggest cities.",
      "Good for football purists and identity-first travellers.",
      "Keep the weekend local, simple, and club-focused.",
    ],

    food: [
      "Traditional regional food",
      "Simple local restaurants",
      "Coffee and bakery stops in the centre",
      "A practical post-match dinner rather than lots of fragmented stops",
    ],

    transport:
      "Murska Sobota is manageable locally once you stay central. The bigger issue is whether you want to base here for the full club-focused experience or travel in from a stronger city such as Maribor. Either can work, but the local stay gives the football more emotional weight.",

    accommodation:
      "City centre is the best local base. Maribor is the smarter wider alternative if you want a stronger city break around the fixture and do not mind the added travel.",
  },

  ajdovscina: {
    cityId: "ajdovscina",
    name: "Ajdovščina",
    country: "Slovenia",

    overview:
      "Ajdovščina is a small western-Slovenian football stop that works far better as part of a wider regional trip than as a standalone football-tourism headline. The town itself is modest, but the surrounding region gives it more value than the raw football scale might suggest. Primorje are the local anchor; the wider appeal comes from western Slovenia, the Vipava Valley, and road-trip style travel rather than from big-city energy.",

    topThings: [
      {
        title: "Town-centre walk",
        tip: "Enough to get the place under control quickly without forcing an oversized plan.",
      },
      {
        title: "Local café stop",
        tip: "A good way to give the football day a little shape before the match.",
      },
      {
        title: "Vipava Valley add-on",
        tip: "One of the best reasons to do this trip properly if you have time and transport.",
      },
      {
        title: "Mestni stadion early arrival",
        tip: "Useful because the football setting is small and benefits from not being rushed.",
      },
      {
        title: "Post-match local meal",
        tip: "Keep it simple and regional rather than expecting destination-city variety.",
      },
      {
        title: "Wine-region routing",
        tip: "Very good if you are building a broader western Slovenia weekend.",
      },
      {
        title: "Nova Gorica wider base option",
        tip: "Useful if you want a somewhat stronger nearby city layer.",
      },
      {
        title: "Short regional overnight",
        tip: "Works better than a huge same-day push if you want the stop to feel worthwhile.",
      },
      {
        title: "Football-and-road-trip pacing",
        tip: "This is the mentality that makes Ajdovščina make sense.",
      },
      {
        title: "Quiet local drink",
        tip: "A better fit than trying to create nightlife that is not really there.",
      },
    ],

    tips: [
      "Ajdovščina is best as part of a western Slovenia football route, not as a huge standalone city break.",
      "The region adds more value than the town alone.",
      "Good for smaller-club travellers and road-trip style planning.",
      "Keep expectations modest and the stop becomes much better.",
      "This is a place-based football trip, not a big stadium weekend.",
    ],

    food: [
      "Simple local Slovenian meals",
      "Wine-region dining if broadening the trip",
      "Coffee and pastry stops",
      "Practical pre- or post-match food rather than destination gastronomy",
    ],

    transport:
      "The local logistics are simple enough once you are there. The more important question is the wider routing across western Slovenia. This trip works best if you think region first, town second, football third in transport terms.",

    accommodation:
      "Ajdovščina works for the closest simple stay. Vipava Valley stays can make the trip more scenic and memorable. Nova Gorica is a useful stronger nearby base if you want a bit more around the football.",
  },
};

export default prvaLigaSloveniaCityGuides;
