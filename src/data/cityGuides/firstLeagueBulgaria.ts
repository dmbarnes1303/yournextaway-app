import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
 */
const GYG = {
  sofia:
    "https://www.getyourguide.com/en-gb/sofia-l158/?partner_id=MAQJREP&utm_medium=online_publisher",
  varna:
    "https://www.getyourguide.com/en-gb/varna-l2770/?partner_id=MAQJREP&utm_medium=online_publisher",
  plovdiv:
    "https://www.getyourguide.com/en-gb/plovdiv-l32521/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const firstLeagueBulgariaCityGuides: Record<string, CityGuide> = {
  sofia: {
    cityId: "sofia",
    name: "Sofia",
    country: "Bulgaria",
    thingsToDoUrl: GYG.sofia,

    overview:
      "Sofia is the best football base in Bulgaria because it combines the country’s deepest club concentration with the easiest transport, the broadest hotel stock, and enough city substance to support a proper weekend beyond the match itself. The smart move is not to overcomplicate it: stay central, use the city centre as your social and hotel anchor, and treat the various stadium trips as branches off one strong base. If you plan it properly, Sofia lets you do giant-club football, secondary-club football, and a solid city break in the same trip without much friction.",

    topThings: [
      {
        title: "Alexander Nevsky Cathedral and central historic core",
        tip: "Best first block in the city. It gives you orientation fast and makes the weekend feel bigger than just football.",
      },
      {
        title: "Vitosha Boulevard evening stretch",
        tip: "The easiest central social anchor for food, drinks, and people-watching without overthinking anything.",
      },
      {
        title: "Roman ruins and central archaeological layers",
        tip: "Good because Sofia’s history is right under the surface rather than hidden in one giant attraction.",
      },
      {
        title: "Borisova Gradina walk",
        tip: "Useful on football trips because it connects well to the sporting identity of the city and gives you an easy reset block.",
      },
      {
        title: "One serious pre-match dinner in the centre",
        tip: "Book this properly instead of gambling on random walk-ins near stadium zones.",
      },
      {
        title: "Levski or CSKA major fixture build-up",
        tip: "Arrive early. Sofia’s biggest matches are better when you let the day gather tension rather than rushing to kickoff.",
      },
      {
        title: "Secondary-club contrast stop",
        tip: "If timing allows, adding Slavia, Lokomotiv Sofia, or Septemvri gives you a much better read of Sofia football than only doing the giants.",
      },
      {
        title: "Central market and coffee loop",
        tip: "A simple high-value daytime move when you do not want to waste energy on overlong museum blocks.",
      },
      {
        title: "One rooftop or viewpoint stop",
        tip: "Worth doing once, but do not let it eat prime football-day time.",
      },
      {
        title: "Morning-after slow centre walk",
        tip: "Sofia works best when you leave breathing room rather than trying to speedrun every attraction.",
      },
    ],

    tips: [
      "Stay central. It is the obvious right answer for almost everyone.",
      "Sofia is the best city in the league for stacking multiple clubs in one trip.",
      "Do not stay out by the stadiums unless price forces it.",
      "Big Sofia fixtures need earlier arrival and cleaner matchday planning than smaller regional games.",
      "Use the city centre as the base and think of the football as separate branches, not separate trips.",
    ],

    food: [
      "Traditional Bulgarian restaurants in the centre",
      "Modern Balkan and grill spots",
      "Central wine bars",
      "Good coffee and pastry stops",
      "One proper pre-match booking instead of lazy chain-food improvisation",
    ],

    transport:
      "Sofia is the easiest city in this league to handle. The centre is walkable in useful sections, the Metro solves a lot of movement cleanly, and taxis are cheap enough to fill gaps without much drama. The important thing is not transport complexity. It is just giving yourself time on bigger football days because city traffic and pre-match build-up can slow down careless plans.",

    accommodation:
      "Stay in Sofia City Centre or just off it. That gives you the best mix of nightlife, food, walkability, and stadium access. Vitosha Boulevard area, the cathedral zone, and other central districts are the strongest all-round bases. Avoid suburban stays unless your only goal is saving money.",
  },

  varna: {
    cityId: "varna",
    name: "Varna",
    country: "Bulgaria",
    thingsToDoUrl: GYG.varna,

    overview:
      "Varna is one of the strongest all-round football weekends in Bulgaria because it combines real club depth with a proper seaside-city feel. You have Cherno More and Spartak Varna, a genuine city rivalry, beach and seafront value, and a much more relaxed urban rhythm than Sofia. The trick is not to treat it like a giant metropolis. Varna works best when you let the coast, centre, and football sit naturally together. One good base, one good dinner, one good seafront block, and the football does the rest.",

    topThings: [
      {
        title: "Sea Garden walk",
        tip: "The most obvious Varna move for a reason. It gives the city its shape and mood better than any forced attraction list.",
      },
      {
        title: "Seafront and beach strip",
        tip: "Best used early evening or morning, not only at peak lazy-tourist hours.",
      },
      {
        title: "Varna centre café and pedestrian zone loop",
        tip: "A clean daytime anchor before heading toward the football later.",
      },
      {
        title: "Roman Baths or archaeology stop",
        tip: "Good if you want one cultural block without turning the trip into museum overload.",
      },
      {
        title: "Cherno More matchday build-up",
        tip: "The stronger mainstream football option in the city and worth treating as the weekend’s main sporting event when available.",
      },
      {
        title: "Spartak contrast trip",
        tip: "Useful if you want to understand Varna as a football city, not just a single-club destination.",
      },
      {
        title: "One proper fish or seafood dinner",
        tip: "This is one of the cities in the league where the food-and-football pairing can genuinely add something to the trip.",
      },
      {
        title: "Late-night drinks by the centre or seafront",
        tip: "Varna is best when kept relaxed. Do not force a huge nightclub itinerary unless that is specifically your thing.",
      },
      {
        title: "Morning coffee by the sea",
        tip: "An easy win and a much better closer than squeezing in one more pointless attraction.",
      },
      {
        title: "Varna derby timing",
        tip: "If the derby is on, everything else matters less. Build the whole weekend around it properly.",
      },
    ],

    tips: [
      "Varna is one of the best city bases in the whole league.",
      "Stay central or near the seafront, not in random outer districts.",
      "Cherno More are the stronger headline trip, but Spartak matter if you want the full city picture.",
      "This city works best when you keep the pace easy rather than overstuffed.",
      "A football-plus-coast weekend here is much smarter than treating it as football-only.",
    ],

    food: [
      "Seafood near the seafront",
      "Traditional Bulgarian meals in the centre",
      "Wine bars and casual evening dining",
      "Coffee and pastries near the pedestrian core",
      "One proper sit-down dinner rather than too many weak snack stops",
    ],

    transport:
      "Varna is straightforward if you stay in the right area. Central districts and the seafront solve most of the weekend naturally, and short taxi rides fill the gaps easily. The city is much more about choosing the right base than about solving difficult logistics. Once the base is right, the football is easy to layer in.",

    accommodation:
      "Varna City Centre and the seafront-adjacent areas are the best choices. Centre is better for practicality, restaurants, and football routing. Seafront works well if you want more of the weekend-break mood. Either is fine. Random outlying hotel picks are usually worse unless price is exceptional.",
  },

  plovdiv: {
    cityId: "plovdiv",
    name: "Plovdiv",
    country: "Bulgaria",
    thingsToDoUrl: GYG.plovdiv,

    overview:
      "Plovdiv is one of the best football cities in Bulgaria because the city itself is strong even before you add the football, and once you add Botev and Lokomotiv the whole thing becomes one of the smartest trips in the league. The old town, the creative-food-nightlife layer, and the derby culture all work together. The correct formula is simple: stay central, use the old town and Kapana as your main non-football blocks, and then build the matchday around whichever club or derby you are targeting. This is a proper city-football weekend, not just a stadium stop.",

    topThings: [
      {
        title: "Old Town walk",
        tip: "Essential. This is one of the best-looking city cores in the league and should anchor the trip early.",
      },
      {
        title: "Kapana district",
        tip: "Best all-round social area for food, bars, and the feeling that the city is alive rather than just scenic.",
      },
      {
        title: "Ancient Theatre and Roman remains",
        tip: "Good high-value cultural stop because Plovdiv’s history is unusually easy to absorb on foot.",
      },
      {
        title: "Botev or Lokomotiv matchday build-up",
        tip: "Whichever club you are doing, arrive early enough to let the city-football mood develop properly.",
      },
      {
        title: "Plovdiv derby planning",
        tip: "If the derby is on, that becomes the whole weekend. Build everything else around it, not vice versa.",
      },
      {
        title: "Kapana dinner booking",
        tip: "Worth doing properly because Plovdiv is one of the few cities in this league where the food scene adds real value.",
      },
      {
        title: "Evening central walk after the match",
        tip: "One of the reasons this city works so well is that football and nightlife can flow into each other naturally.",
      },
      {
        title: "Morning coffee with old-town reset",
        tip: "A better use of the final morning than trying to cram in one extra museum.",
      },
      {
        title: "Creative quarter bar stop",
        tip: "Good if you want the city to feel modern as well as historic.",
      },
      {
        title: "One-night or two-night split",
        tip: "Both work. One night is enough for football plus city. Two nights make it feel properly complete.",
      },
    ],

    tips: [
      "Plovdiv is one of the strongest football weekends in Bulgaria.",
      "Stay central. The old town/Kapana area is the obvious sweet spot.",
      "The derby is one of the premium fixtures in the whole country.",
      "Do not treat this as just a football stop. The city genuinely adds value.",
      "Book dinner on Friday and Saturday nights. The best central spots are worth securing.",
    ],

    food: [
      "Kapana small plates and modern bistros",
      "Traditional Bulgarian food in the centre",
      "Strong grill and meat options",
      "Wine bars",
      "Good brunch and coffee culture for the morning-after recovery block",
    ],

    transport:
      "Plovdiv is very manageable if you stay central. Most of the value areas are walkable, and short taxi rides make the stadium movements easy enough. The city is not complicated. The main thing is to avoid staying too far from the core, because that destroys the natural flow that makes Plovdiv such a good football weekend.",

    accommodation:
      "Old Town edges, Kapana, and central Plovdiv are the best bases. That gives you the strongest city feel and easiest access to food, nightlife, and both club routes. Do not over-optimise for one stadium at the expense of the city centre.",
  },

  razgrad: {
    cityId: "razgrad",
    name: "Razgrad",
    country: "Bulgaria",

    overview:
      "Razgrad is not one of the best city breaks in the league, but it is one of the most important football stops because it is home to Ludogorets, the dominant force of the modern Bulgarian era. That means the trip is football-led, not city-led. If you accept that immediately, the planning gets much cleaner. Either do a practical one-night stay or base in a stronger nearby city and travel in. The point of coming is to see the league’s modern powerhouse in its own environment, not to pretend Razgrad is Sofia, Varna, or Plovdiv.",

    topThings: [
      {
        title: "Compact centre orientation walk",
        tip: "Enough to get your bearings, but do not force a fake giant-city itinerary onto Razgrad.",
      },
      {
        title: "One practical local meal",
        tip: "Keep it functional. This is not where you over-design the food side of the trip.",
      },
      {
        title: "Huvepharma Arena early arrival",
        tip: "Important because the club is the point of the trip, not the wider city.",
      },
      {
        title: "Ludogorets-focused matchday",
        tip: "Treat it seriously. This is the dominant club in Bulgaria and deserves proper timing.",
      },
      {
        title: "Post-match quick local drink",
        tip: "Enough to let the evening land without pretending the city has endless nightlife.",
      },
      {
        title: "Varna-base option",
        tip: "A good call if you want the stronger city and are happy to travel for the football.",
      },
      {
        title: "One-night football stop",
        tip: "Usually the best way to do Razgrad unless you are stacking multiple nearby matches.",
      },
      {
        title: "Modern-dominance football trip mindset",
        tip: "You are here for the club’s significance in Bulgarian football history, not for tourism gloss.",
      },
      {
        title: "Morning reset and exit",
        tip: "This is not a place that rewards dragging the itinerary too long.",
      },
      {
        title: "European-night targeting",
        tip: "If you can catch Ludogorets in a bigger continental or major domestic fixture, that improves the trip immediately.",
      },
    ],

    tips: [
      "Razgrad is football-first. Accept that and the trip makes sense.",
      "Ludogorets are the reason to go, not the city itself.",
      "A one-night stay is usually enough.",
      "Varna can be a smarter wider base if you want better city quality around the football.",
      "Do not overbuild the itinerary. Keep it clean and club-led.",
    ],

    food: [
      "Simple Bulgarian local dining",
      "Practical pre-match meals",
      "One decent sit-down dinner rather than scattered weak stops",
      "Coffee and bakery basics",
    ],

    transport:
      "Razgrad itself is not difficult once you are there. The bigger planning decision is whether to sleep locally or use a stronger external base such as Varna. The city does not demand complex inner-city planning; it demands realistic trip framing.",

    accommodation:
      "Stay centrally if staying in Razgrad at all, but many travellers will get more overall value from basing in Varna and travelling in. Razgrad is the club stop. Varna is the stronger broader weekend base.",
  },

  kardzhali: {
    cityId: "kardzhali",
    name: "Kardzhali",
    country: "Bulgaria",

    overview:
      "Kardzhali is a football-first regional stop built around Arda rather than around a heavyweight urban-break identity. That is not a criticism. It is just the correct way to plan the trip. You are coming because Arda give this part of Bulgaria top-flight relevance, not because the city competes with the country’s biggest weekend destinations. Keep the schedule simple, let the match carry the centre of gravity, and do not waste time trying to manufacture a fake city-break script that the place does not need.",

    topThings: [
      {
        title: "Short town-centre orientation walk",
        tip: "Enough to settle the place without pretending there is huge depth to cover.",
      },
      {
        title: "One proper local meal",
        tip: "A better move than bouncing around looking for non-existent trend districts.",
      },
      {
        title: "Arena Arda early arrival",
        tip: "Worth doing because the club is the point of the trip.",
      },
      {
        title: "Arda-focused matchday",
        tip: "This stop only really makes sense if you fully accept that the football is the main event.",
      },
      {
        title: "Post-match quiet drink",
        tip: "Fine locally, but do not force a huge nightlife plan here.",
      },
      {
        title: "Plovdiv-linked base option",
        tip: "Useful if you want a stronger city around the trip and do not mind extra travel.",
      },
      {
        title: "Regional Bulgaria routing",
        tip: "Best if Kardzhali is part of a wider route rather than the only stop.",
      },
      {
        title: "Football-and-region mindset",
        tip: "You are here for domestic football geography, not for giant-city spectacle.",
      },
      {
        title: "One-night local stay",
        tip: "Usually enough if you want the match to feel properly anchored.",
      },
      {
        title: "Morning exit block",
        tip: "Keep the trip tidy and do not overstay the city’s natural scale.",
      },
    ],

    tips: [
      "Kardzhali is a football-first regional stop.",
      "Arda are the reason to travel here.",
      "Do not build a huge leisure-weekend expectation around the city itself.",
      "One night locally or a stronger base elsewhere are both fine.",
      "Plovdiv can be the smarter wider base if you want better hotels, nightlife, and city value.",
    ],

    food: [
      "Simple regional dining",
      "Local grills and practical meals",
      "Coffee and bakery stops",
      "One proper dinner instead of multiple weak snack detours",
    ],

    transport:
      "The local city movement is not difficult. The actual planning question is whether you want to stay in Kardzhali or use a stronger external base. Once you decide that, everything else is fairly simple.",

    accommodation:
      "Central Kardzhali works for a football-first overnight. Plovdiv is the stronger alternative if you want a bigger-city layer around the match and do not mind the extra travel time.",
  },

  vratsa: {
    cityId: "vratsa",
    name: "Vratsa",
    country: "Bulgaria",

    overview:
      "Vratsa is a realistic football town stop, not a premium football-tourism weekend. That is the correct mindset from the start. You come because Botev Vratsa are part of the Bulgarian first-division map and because smaller regional clubs matter if you actually want to understand the league properly. The town can support a simple football overnight, but it should not be over-romanticised. Either keep it as a clean local stop or fold it into a Sofia-based wider trip.",

    topThings: [
      {
        title: "Small centre walk",
        tip: "Enough to settle the town and avoid making the trip feel too transactional.",
      },
      {
        title: "One practical local café or meal",
        tip: "Keep it simple. This is not a city where over-planning improves things much.",
      },
      {
        title: "Hristo Botev Stadium early arrival",
        tip: "The football is the point here, so give it proper time.",
      },
      {
        title: "Botev Vratsa match-led day",
        tip: "Best approached as a proper football stop, not a rushed add-on.",
      },
      {
        title: "Quiet post-match drink",
        tip: "Enough to let the evening breathe without forcing fake nightlife.",
      },
      {
        title: "Sofia-linked base option",
        tip: "Often the smarter wider choice if you want more around the trip than Vratsa alone can provide.",
      },
      {
        title: "One-night football overnight",
        tip: "Usually the best local structure if you want the trip to feel complete.",
      },
      {
        title: "Regional route stacking",
        tip: "Works well if you are covering multiple smaller clubs or northern/western Bulgarian stops.",
      },
      {
        title: "Morning reset and move on",
        tip: "The right tempo for Vratsa. Do not drag it.",
      },
      {
        title: "Football realism mode",
        tip: "This stop works when you value league depth and authenticity, not glamour.",
      },
    ],

    tips: [
      "Vratsa is a football-town stop, not a giant city break.",
      "Botev Vratsa are the reason to go.",
      "Sofia can be a stronger wider base depending on your route.",
      "A short, tidy plan works better than over-designing the weekend.",
      "Good for serious domestic-football travellers rather than casual football tourists.",
    ],

    food: [
      "Simple local Bulgarian food",
      "Grills and practical pre-match meals",
      "Basic café stops",
      "One proper dinner instead of lots of scattered low-value stops",
    ],

    transport:
      "Vratsa is straightforward enough locally. The real planning decision is whether to stay in town or treat the fixture as a branch off a stronger base like Sofia. Once that is decided, the rest is easy.",

    accommodation:
      "Vratsa centre works for a one-night football stop. Sofia is the stronger alternative if you want better hotels, nightlife, and wider city value around the match.",
  },

  dobrich: {
    cityId: "dobrich",
    name: "Dobrich",
    country: "Bulgaria",

    overview:
      "Dobrich is one of those football stops that only makes sense if you are honest about what you want from the trip. If you want glamour, this is the wrong stop. If you want a proper domestic-league map, it makes perfect sense. Dobrudzha give the city football relevance, and the wider value often comes from pairing Dobrich with Varna or a broader northeastern-Bulgaria route rather than trying to sell Dobrich itself as some giant destination.",

    topThings: [
      {
        title: "Short centre loop",
        tip: "Enough to understand the place without pretending there is more urban depth than there is.",
      },
      {
        title: "One local café stop",
        tip: "The right scale for a city like this on a football-first trip.",
      },
      {
        title: "Druzhba Stadium early arrival",
        tip: "Worth doing because the football itself is the reason for the stop.",
      },
      {
        title: "Dobrudzha matchday",
        tip: "Best treated as a proper league-depth experience, not a sideshow.",
      },
      {
        title: "Simple post-match meal",
        tip: "Keep it practical and move on cleanly.",
      },
      {
        title: "Varna pairing",
        tip: "Usually the smartest way to make the wider weekend stronger.",
      },
      {
        title: "One-night local stay only if needed",
        tip: "Many travellers will get more value sleeping elsewhere.",
      },
      {
        title: "Regional route-building",
        tip: "Dobrich works better as part of a broader map than as a standalone headline.",
      },
      {
        title: "Football-and-geography mindset",
        tip: "This is about understanding the full league, not just its tourist magnets.",
      },
      {
        title: "Morning move-on plan",
        tip: "The city rewards a tidy schedule more than an overlong one.",
      },
    ],

    tips: [
      "Dobrich is a football-depth stop, not a glamour break.",
      "Varna is often the stronger wider base.",
      "Dobrudzha are the whole reason to travel here.",
      "Best for serious league coverage and route-building.",
      "Keep the pace simple and practical.",
    ],

    food: [
      "Simple regional meals",
      "Basic cafés",
      "Practical pre- and post-match food",
      "A better dinner in Varna if using it as a wider base",
    ],

    transport:
      "Dobrich is not hard to handle once you are there. The bigger question is whether you are staying locally or using Varna as the stronger hub. That decision matters far more than anything inside the city itself.",

    accommodation:
      "Dobrich centre works if you want the pure football overnight. Varna is usually the smarter choice if you want better hotels, nightlife, and city atmosphere around the match.",
  },

  "stara-zagora": {
    cityId: "stara-zagora",
    name: "Stara Zagora",
    country: "Bulgaria",

    overview:
      "Stara Zagora is a proper football city in the grounded regional sense rather than in the giant-capital sense. Beroe give it domestic substance, and the city is strong enough to support a real football overnight without pretending to be one of the country’s elite tourist magnets. The best way to use it is simply: stay central, keep the match as the anchor, and let the city’s practical scale work in your favour. It is a clean, sensible football stop with more depth than the smaller-town options but less flash than Sofia, Varna, or Plovdiv.",

    topThings: [
      {
        title: "Central pedestrian zone walk",
        tip: "A good first move because the city is easy to understand once you get the centre right.",
      },
      {
        title: "Ayazmoto Park block",
        tip: "Useful if you want one calmer non-football stretch without forcing too much sightseeing.",
      },
      {
        title: "Regional-history or museum stop",
        tip: "Only if you genuinely want a cultural block; do not make it feel like homework.",
      },
      {
        title: "Beroe matchday build-up",
        tip: "Worth treating seriously because Beroe are a real traditional club, not just a random fixture.",
      },
      {
        title: "Pre-match central meal",
        tip: "Usually smarter than killing too much time around the ground too early.",
      },
      {
        title: "Post-match city-centre return",
        tip: "One of the reasons the stop works is that the city is just big enough to keep the night alive after football.",
      },
      {
        title: "One solid local dinner",
        tip: "Better than lots of scattered low-value food stops.",
      },
      {
        title: "Morning centre reset",
        tip: "A clean end to the trip before you move on.",
      },
      {
        title: "Regional Bulgaria route pairing",
        tip: "Works well if linking with Plovdiv or southern Bulgaria stops.",
      },
      {
        title: "One-night football city break",
        tip: "This is usually the sweet spot for Stara Zagora.",
      },
    ],

    tips: [
      "Stara Zagora is one of the better regional football overnights in the league.",
      "Stay central. There is no cleverer answer than that.",
      "Beroe make the city feel like a proper football stop rather than just a town with a stadium.",
      "A one-night plan usually works very well here.",
      "Keep it football-led but leave room for the city to breathe.",
    ],

    food: [
      "Traditional Bulgarian dining",
      "Local grills",
      "Simple central restaurants",
      "Coffee and pastry stops",
      "One decent sit-down dinner rather than too much random grazing",
    ],

    transport:
      "Stara Zagora is manageable and practical rather than complex. The centre should be your base, and from there the football and food routing are easy enough. This city rewards simple planning more than elaborate planning.",

    accommodation:
      "Stara Zagora Centre is the best base. It keeps the trip clean, simple, and properly football-led without making everything feel disconnected.",
  },

  montana: {
    cityId: "montana",
    name: "Montana",
    country: "Bulgaria",

    overview:
      "Montana is a very clear football-depth stop. It is not a glossy city break, and trying to sell it like one would be nonsense. The reason to go is the club, the league map, and the value of seeing a smaller regional side in its own environment. If that is what you want, the trip makes sense. If you want atmosphere spectacle, nightlife, or a premium urban weekend, this is the wrong city. Keep the plan compact, grounded, and football-first.",

    topThings: [
      {
        title: "Short centre orientation walk",
        tip: "Enough to give the stop some shape without pretending the city needs a huge itinerary.",
      },
      {
        title: "One local coffee or bakery stop",
        tip: "The right scale for this kind of trip.",
      },
      {
        title: "Ogosta Stadium early arrival",
        tip: "Important because the football is the entire point of coming.",
      },
      {
        title: "Montana match-led afternoon",
        tip: "Works best when treated as a proper local football experience, not a rushed tick-box.",
      },
      {
        title: "Quiet post-match meal",
        tip: "Keep it simple and local.",
      },
      {
        title: "Sofia-linked base option",
        tip: "Often smarter if you want more city value around the fixture.",
      },
      {
        title: "One-night local stop",
        tip: "Only if you specifically want the full regional football experience.",
      },
      {
        title: "Regional route extension",
        tip: "Useful if stacking smaller-club stops in western or northern Bulgaria.",
      },
      {
        title: "Football realism mode",
        tip: "This stop is for people who actually enjoy the full map of a league, not only its headline cities.",
      },
      {
        title: "Morning exit block",
        tip: "The city rewards tidy planning and quick onward movement.",
      },
    ],

    tips: [
      "Montana is a football-depth stop, not a glamour destination.",
      "The club are the reason to go.",
      "Sofia may be the stronger wider base depending on your route.",
      "Do not overbuild the itinerary.",
      "Good for serious domestic-football travellers and smaller-club enthusiasts.",
    ],

    food: [
      "Simple local meals",
      "Basic cafés and bakeries",
      "Practical pre- or post-match food",
      "One straightforward dinner rather than trying to chase destination dining",
    ],

    transport:
      "Montana itself is easy enough once you are there. The actual planning question is whether to sleep locally or use Sofia as the stronger wider hub. That choice shapes the trip more than anything inside the city.",

    accommodation:
      "Montana centre works if you want the full local football-stop experience. Sofia is usually the stronger alternative if you want better accommodation, more nightlife, and a more flexible wider weekend around the match.",
  },
};

export default firstLeagueBulgariaCityGuides;
