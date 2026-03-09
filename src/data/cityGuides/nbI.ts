import type { CityGuide } from "./types";

/**
 * GetYourGuide affiliate entry points (city-level “things to do” pages).
 * Keep this as a single, obvious map so monetisation doesn’t get scattered.
 */
const GYG = {
  budapest:
    "https://www.getyourguide.com/en-gb/budapest-l29/?partner_id=MAQJREP&utm_medium=online_publisher",
  debrecen:
    "https://www.getyourguide.com/en-au/debrecen-l100146/?partner_id=MAQJREP&utm_medium=online_publisher",
  gyor:
    "https://www.getyourguide.com/en-gb/gyor-l2558/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const nbICityGuides: Record<string, CityGuide> = {
  budapest: {
    cityId: "budapest",
    name: "Budapest",
    country: "Hungary",
    thingsToDoUrl: GYG.budapest,

    overview:
      "Budapest is the obvious heavyweight football base in Hungary: the biggest city, the deepest hotel market, the easiest airport arrival, and the one place where you can build a proper multi-club trip without forcing the logistics. Ferencváros, Újpest, and MTK all sit inside a city that already works brilliantly as a weekend destination, so the smart move is simple: stay central, keep your non-football blocks compact, and treat each stadium run as a branch off one strong base. Budapest rewards planning by district rather than by random attraction-hopping, and football fits into that rhythm very naturally.",

    topThings: [
      {
        title: "Buda Castle district",
        tip: "Do this early in the trip. It gives the city immediate shape and stops the weekend feeling like random train-station-to-stadium movement.",
      },
      {
        title: "Danube riverside walk",
        tip: "Best late afternoon into evening. Budapest is one of those cities where the waterline does half the work for you.",
      },
      {
        title: "Parliament and central Pest loop",
        tip: "Good as a first-day orientation block, not as a full-day obsession.",
      },
      {
        title: "Széchenyi or Gellért bath session",
        tip: "Use one bath experience properly instead of trying to cram in too many iconic stops.",
      },
      {
        title: "Ferencváros matchday build-up",
        tip: "Arrive early for bigger fixtures. This is the strongest domestic major-club experience in the country.",
      },
      {
        title: "Újpest contrast trip",
        tip: "If you want real Budapest football culture rather than only the biggest club, this is essential.",
      },
      {
        title: "MTK historical contrast stop",
        tip: "A smarter football traveller’s addition because it deepens your understanding of the city’s football hierarchy.",
      },
      {
        title: "Jewish Quarter evening",
        tip: "Best all-round nightlife and food zone for most visitors, but book properly on busier weekends.",
      },
      {
        title: "Central market or food hall stop",
        tip: "Good for one controlled food block. Do not let it become an entire day.",
      },
      {
        title: "One Danube evening cruise",
        tip: "Worth doing once if the weather behaves, but do not let it steal the prime football hours.",
      },
    ],

    tips: [
      "Stay central. Do not get clever and book out by stadiums.",
      "Budapest is the best city in the league for a multi-club weekend.",
      "Ferencváros are the flagship trip, but Újpest adds major cultural value.",
      "Use the Metro and trams properly instead of defaulting to pointless taxis.",
      "Plan one strong sightseeing block per day, not five mediocre ones.",
    ],

    food: [
      "Traditional Hungarian restaurants",
      "Jewish Quarter small plates and bars",
      "Good coffee and pastry stops",
      "One proper pre-match dinner booking",
      "Late-night casual food after football rather than overplanned fine dining every night",
    ],

    transport:
      "Budapest is easily the cleanest transport city in the league. Metro, tram, and central walkability solve most of the trip if you stay in the right area. The only real mistake is staying too far out and then pretending the city is awkward. It is not. The city is only awkward if you plan badly.",

    accommodation:
      "District V, VI, VII, and the central parts of VIII and IX are the safest general answers. Central Pest is the strongest all-round base for food, nightlife, and stadium access. Buda is scenic but less efficient if football is the main reason for the trip.",
  },

  gyor: {
    cityId: "gyor",
    name: "Győr",
    country: "Hungary",
    thingsToDoUrl: GYG.gyor,

    overview:
      "Győr is one of the smarter provincial football weekends in Hungary because the city is compact, attractive enough, and easy to understand without demanding big-city energy. ETO give it proper football significance, and the city’s old-town setting makes it more appealing than many practical-but-flat football towns. The correct move here is to keep it simple: stay central, walk the old core, let the football anchor the day, and avoid overcomplicating a city that works best when treated as a neat one- or two-night stop.",

    topThings: [
      {
        title: "Baroque old town walk",
        tip: "This is the city’s strongest non-football asset and should be your first move after checking in.",
      },
      {
        title: "Riverside and bridges loop",
        tip: "Best used as a light reset walk rather than a formal sightseeing mission.",
      },
      {
        title: "Basilica and central squares",
        tip: "Good because they add historical shape without requiring a huge time investment.",
      },
      {
        title: "One strong central dinner",
        tip: "Book in the old town and keep the evening concentrated rather than drifting.",
      },
      {
        title: "ETO Park matchday",
        tip: "Give it proper time. ETO are the point of the football trip, not an afterthought.",
      },
      {
        title: "Coffee-and-pastry morning block",
        tip: "Győr suits slow starts better than forced attraction marathons.",
      },
      {
        title: "Pannonhalma add-on if driving or extending",
        tip: "Only if you actually have the time. Do not ruin the football weekend by overreaching.",
      },
      {
        title: "One clean evening stroll after the match",
        tip: "The compact centre is ideal for this and makes the trip feel more complete.",
      },
      {
        title: "Regional gateway logic",
        tip: "Győr can work well as part of a wider Vienna-Bratislava-Budapest route, but it is still worth respecting in its own right.",
      },
      {
        title: "One-night football city break",
        tip: "Usually enough unless you want a genuinely slower provincial weekend.",
      },
    ],

    tips: [
      "Stay in the centre, not near the stadium.",
      "Győr is one of the better non-Budapest city breaks in the league.",
      "This trip works because it is compact. Do not overbuild it.",
      "ETO are the football anchor, but the old town gives the weekend shape.",
      "Perfect for a tidy one-night or two-night stop.",
    ],

    food: [
      "Traditional Hungarian food",
      "Old-town bistros",
      "Coffee and pastry cafés",
      "One proper sit-down dinner rather than lots of random snack stops",
    ],

    transport:
      "Győr is easy because the centre is compact and the city does not ask much of you once you are based properly. Walking does most of the work. Taxis fill the gaps. This is a city where the wrong hotel location causes more problems than the transport system itself.",

    accommodation:
      "Stay in or just off the old town. That gives you the strongest city feel and the easiest balance between football, food, and simple walking routes.",
  },

  debrecen: {
    cityId: "debrecen",
    name: "Debrecen",
    country: "Hungary",
    thingsToDoUrl: GYG.debrecen,

    overview:
      "Debrecen is one of the strongest provincial football cities in Hungary because it has real urban weight, a serious club, and enough city substance to support a proper weekend rather than just a stadium stop. It is not Budapest and should not be treated like Budapest, but it does not need to be. The city works when you build around the centre, use the football as a major anchor, and let the wider weekend stay relatively clean and unfussy. Debrecen rewards structure and punishes overplanning less than some larger cities do.",

    topThings: [
      {
        title: "Great Reformed Church and Kossuth Square",
        tip: "The obvious city-core anchor and the right place to start understanding Debrecen.",
      },
      {
        title: "Nagyerdő Park area",
        tip: "High-value because it links naturally to the stadium and gives the city a wider, calmer feel.",
      },
      {
        title: "Nagyerdei Stadion matchday route",
        tip: "One of the cleanest football-day setups in the league because the park and stadium area work together naturally.",
      },
      {
        title: "Central café and pastry circuit",
        tip: "Debrecen is good for this. Use it to fill dead time without overcomplicating the itinerary.",
      },
      {
        title: "One proper city-centre dinner",
        tip: "Worth doing well because Debrecen is strong enough to support a real evening, not just survival dining.",
      },
      {
        title: "MODEM or one cultural block",
        tip: "Only if you genuinely want culture. The trip does not need excessive museum time to work.",
      },
      {
        title: "Pre-match park walk",
        tip: "An easy win and one of the reasons Debrecen feels more complete than many football stops of similar size.",
      },
      {
        title: "Post-match central return",
        tip: "The city is just big enough that this part of the evening still feels alive after football.",
      },
      {
        title: "Morning reset in the centre",
        tip: "Best done calmly. Debrecen is more rewarding when not rushed.",
      },
      {
        title: "One-night or two-night structure",
        tip: "Both work. One night is enough for football plus city. Two nights make it feel properly rounded.",
      },
    ],

    tips: [
      "Debrecen is one of the best non-Budapest football weekends in Hungary.",
      "Stay central or near Nagyerdő, depending on whether you want city life or cleaner stadium access.",
      "Do not spread yourself too wide; the city is best in a tight loop.",
      "The stadium-and-park setup is one of the strongest in the league.",
      "A very good trip if you want serious football without needing the capital.",
    ],

    food: [
      "Traditional Hungarian restaurants",
      "Modern local bistros",
      "Coffee and pastry cafés",
      "One proper pre- or post-match dinner booking",
      "Casual central bars for later drinks",
    ],

    transport:
      "Debrecen is manageable and logical rather than dramatic. If you stay central, the main city functions are easy. The park and stadium area are simple to work in. It is a city where route choice matters less than just choosing a sensible base in the first place.",

    accommodation:
      "City centre is the best all-round answer. If stadium access matters most, a Nagyerdő-adjacent stay also works well, but central Debrecen gives the stronger overall weekend.",
  },

  kisvarda: {
    cityId: "kisvarda",
    name: "Kisvárda",
    country: "Hungary",

    overview:
      "Kisvárda is a football-first regional stop, nothing more and nothing less. The city is not trying to be a major tourism weekend and you should not pretend otherwise when planning it. The reason to come is the club and the value of seeing a smaller Hungarian top-flight stop in its own context. If you accept that from the beginning, the trip makes sense. If you expect a high-output city break, it does not.",

    topThings: [
      {
        title: "Short centre walk",
        tip: "Enough to understand the place without forcing a fake giant-city itinerary.",
      },
      {
        title: "One practical local meal",
        tip: "Keep it simple. This is not a destination where you chase food hype.",
      },
      {
        title: "Várkerti Stadion early arrival",
        tip: "Important because the football is the point of the trip.",
      },
      {
        title: "Kisvárda matchday",
        tip: "Treat it as a proper football stop, not a rushed detour.",
      },
      {
        title: "Quiet post-match drink",
        tip: "Enough to let the evening land without pretending there is huge nightlife depth.",
      },
      {
        title: "Debrecen-base alternative",
        tip: "A stronger wider base if you want more city around the fixture.",
      },
      {
        title: "One-night regional stop",
        tip: "Usually all you need locally.",
      },
      {
        title: "Eastern Hungary route logic",
        tip: "Works best as part of a broader route rather than as a standalone luxury football break.",
      },
      {
        title: "Football realism mindset",
        tip: "This is about league depth and regional identity, not spectacle.",
      },
      {
        title: "Morning reset and move on",
        tip: "The city rewards a tidy plan more than a long one.",
      },
    ],

    tips: [
      "Kisvárda is a football-depth stop, not a glamour destination.",
      "The club are the reason to go.",
      "Debrecen can be the smarter wider base.",
      "Do not overdesign the weekend.",
      "Best for serious domestic-football travellers.",
    ],

    food: [
      "Simple local restaurants",
      "Basic café stops",
      "One practical sit-down dinner",
      "Straightforward pre- or post-match food",
    ],

    transport:
      "Once you are there, local movement is not the issue. The real decision is whether you sleep in Kisvárda or use a stronger base such as Debrecen and travel in.",

    accommodation:
      "Kisvárda centre works for a football-only overnight. Debrecen is the stronger alternative if you want better accommodation and a more complete wider weekend.",
  },

  zalaegerszeg: {
    cityId: "zalaegerszeg",
    name: "Zalaegerszeg",
    country: "Hungary",

    overview:
      "Zalaegerszeg is a proper provincial football stop with enough city identity to support a clean one-night or two-night trip, but not enough scale that you should try to force a giant-urban weekend template onto it. The club and city work best together when you keep the plan compact: central base, football-led schedule, and one or two good supporting city blocks rather than ten half-hearted attractions.",

    topThings: [
      {
        title: "City-centre orientation loop",
        tip: "A good starting move because the city reveals itself quickly once you have the core right.",
      },
      {
        title: "One central dinner",
        tip: "Better to do one evening meal properly than scatter the trip across weak options.",
      },
      {
        title: "ZTE Arena matchday",
        tip: "The football is the anchor here, so arrive with enough time to let the day feel intentional.",
      },
      {
        title: "Post-match centre walk",
        tip: "A simple way to make the trip feel complete without inventing unnecessary activity.",
      },
      {
        title: "Morning café stop",
        tip: "Zalaegerszeg suits a calm football-trip rhythm rather than aggressive sightseeing.",
      },
      {
        title: "Regional western-Hungary route pairing",
        tip: "Works well if you are linking Győr, Budapest, or border-region travel.",
      },
      {
        title: "One-night football stop",
        tip: "Usually enough unless you specifically want a slower provincial break.",
      },
      {
        title: "Nearby nature add-on",
        tip: "Only if you genuinely have extra time. Do not damage the football structure trying to overreach.",
      },
      {
        title: "Old-school football-town logic",
        tip: "This is about city-plus-club coherence, not tourist-box collecting.",
      },
      {
        title: "Early-evening local bar stop",
        tip: "Useful if you want the city to feel lived-in without expecting major nightlife.",
      },
    ],

    tips: [
      "Zalaegerszeg is a clean provincial football stop, not a giant city break.",
      "Stay central, not by the stadium.",
      "ZTE give the city the trip’s real weight.",
      "This is best done as a tidy one-night or two-night trip.",
      "Western-Hungary routing makes this stop smarter.",
    ],

    food: [
      "Traditional Hungarian dining",
      "Simple regional restaurants",
      "Central cafés",
      "One proper evening meal rather than too much scattered grazing",
    ],

    transport:
      "The city is simple once you are centrally based. Walking and short taxi rides do the job. The real planning variable is not transport complexity. It is just whether you have chosen a sensible base.",

    accommodation:
      "Stay in the centre. It is the easiest and strongest all-round answer for football, food, and keeping the trip compact.",
  },

  paks: {
    cityId: "paks",
    name: "Paks",
    country: "Hungary",

    overview:
      "Paks is one of those trips where the football story is much stronger than the city-break story. The club matter because of their performance and identity inside Hungarian football, not because the city itself is a major tourism magnet. That is fine. In fact, it is better to be honest about it. You come for the club, keep the logistics simple, and either do a neat one-night football stop or fold the match into a wider Hungary route.",

    topThings: [
      {
        title: "Short centre walk",
        tip: "Enough to give the trip shape without trying to manufacture a big-city experience.",
      },
      {
        title: "One straightforward local meal",
        tip: "Keep it practical. This is not a city where culinary overplanning pays off much.",
      },
      {
        title: "Paksi FC Stadion early arrival",
        tip: "Important because the football is the real point of the stop.",
      },
      {
        title: "Paks matchday",
        tip: "Worth treating seriously because the club are more interesting than the city’s general profile suggests.",
      },
      {
        title: "Quiet post-match beer or dinner",
        tip: "Enough to let the evening settle without forcing fake nightlife energy.",
      },
      {
        title: "Budapest-linked base option",
        tip: "Often smarter if you want more around the football than Paks alone can offer.",
      },
      {
        title: "One-night local stop",
        tip: "Usually the right local structure if you want the fixture to feel anchored.",
      },
      {
        title: "Football-efficiency mindset",
        tip: "This is a smart trip for people who care about good clubs, not only good postcards.",
      },
      {
        title: "Regional route stacking",
        tip: "Works well if you are covering multiple central or southern Hungary fixtures.",
      },
      {
        title: "Morning move-on block",
        tip: "Keep it tidy. Paks is stronger as a concise stop than as a dragged-out stay.",
      },
    ],

    tips: [
      "Paks is club-led, not city-led.",
      "The football is stronger than the wider tourism profile.",
      "A one-night stay is usually enough.",
      "Budapest can be the better wider base depending on your route.",
      "Good for serious football travellers who value structure and club identity.",
    ],

    food: [
      "Simple local restaurants",
      "Practical pre-match meals",
      "One solid sit-down dinner",
      "Basic café stops",
    ],

    transport:
      "Paks itself is not complex. The main decision is whether to stay locally or route the fixture from a stronger city base. Once that decision is made, the rest is simple.",

    accommodation:
      "Paks centre is fine for a football-only overnight. Budapest is usually the stronger wider option if you want better hotels, nightlife, and extra trip value around the match.",
  },

  "felcsut": {
    cityId: "felcsut",
    name: "Felcsút",
    country: "Hungary",

    overview:
      "Felcsút is not a normal football-trip town and should not be planned like one. The reason to go is Puskás Akadémia and Pancho Arena. That is the entire logic. The place is football-project context first, broader destination second. This is not a criticism. It is the reality. The trip works if you embrace that and either treat it as a sharply focused football stop or pair it with Budapest or another stronger base.",

    topThings: [
      {
        title: "Pancho Arena visit and matchday",
        tip: "This is the point of the trip. Everything else is secondary.",
      },
      {
        title: "Project-context football stop",
        tip: "The club’s unusual status is a major part of why this place is worth visiting at all.",
      },
      {
        title: "One simple local meal",
        tip: "Enough to support the football day without pretending the town is a culinary destination.",
      },
      {
        title: "Budapest-daytrip logic",
        tip: "Often the smartest way to do it if you want stronger broader trip value.",
      },
      {
        title: "Pre-match arrival with time to look around",
        tip: "Important because the stadium itself is part of the attraction.",
      },
      {
        title: "Post-match return rather than late-night linger",
        tip: "Usually the cleanest call unless you have a very specific local plan.",
      },
      {
        title: "One-night only if necessary",
        tip: "Most travellers do not need more than that here.",
      },
      {
        title: "Football architecture angle",
        tip: "Worth leaning into because Pancho Arena is one of the league’s most visually distinctive venues.",
      },
      {
        title: "Project-club mindset",
        tip: "The trip is richer if you arrive understanding the club’s symbolic place in Hungarian football.",
      },
      {
        title: "Compact scheduling",
        tip: "Felcsút rewards precision, not overcomplication.",
      },
    ],

    tips: [
      "Felcsút is entirely about the club and stadium.",
      "Most people should pair it with a Budapest base.",
      "Do not expect a conventional city-break experience.",
      "Pancho Arena is the reason to go.",
      "Keep the trip sharp and football-focused.",
    ],

    food: [
      "Simple local dining",
      "Practical pre-match meal",
      "Coffee stop if needed",
      "Better wider dining in Budapest if using that as your base",
    ],

    transport:
      "The real transport question is not movement inside Felcsút. It is whether you are coming in from Budapest or staying locally. In most cases, Budapest-based routing is the cleaner and smarter option.",

    accommodation:
      "Budapest is usually the best base. Felcsút itself only makes sense for a very focused football overnight or if route logic absolutely requires it.",
  },

  "nyiregyhaza": {
    cityId: "nyiregyhaza",
    name: "Nyíregyháza",
    country: "Hungary",

    overview:
      "Nyíregyháza is a regional football stop with enough city substance to support a clean overnight but not enough broad pull that you should pretend it is a premium urban weekend. The trip makes sense when built around the club, the local football identity, and a compact city-centre rhythm. This is a useful stop for understanding eastern Hungarian football rather than a headline travel flex.",

    topThings: [
      {
        title: "Centre walk",
        tip: "A sensible first move to make the place feel anchored rather than just functional.",
      },
      {
        title: "One local café or pastry stop",
        tip: "The right scale of city activity for a football-led overnight.",
      },
      {
        title: "Városi Stadion matchday",
        tip: "The football is the point of being here, so give it proper time.",
      },
      {
        title: "Post-match local dinner",
        tip: "Better than trying to chase nightlife the city does not really specialise in.",
      },
      {
        title: "Simple evening central bar stop",
        tip: "Enough to keep the city feeling live without overpromising on it.",
      },
      {
        title: "Regional eastern-Hungary routing",
        tip: "Best if part of a broader route rather than treated as a major standalone destination.",
      },
      {
        title: "One-night football trip",
        tip: "The ideal shape for most visitors.",
      },
      {
        title: "Morning recovery coffee",
        tip: "A smarter final block than trying to squeeze in weak sightseeing.",
      },
      {
        title: "Club-and-city realism mindset",
        tip: "This trip works when treated honestly as a proper regional football stop.",
      },
      {
        title: "Debrecen comparison logic",
        tip: "Debrecen is the stronger bigger-city trip; Nyíregyháza is the more focused local football stop.",
      },
    ],

    tips: [
      "Nyíregyháza is a football-first regional stop.",
      "A one-night stay is usually enough.",
      "Do not force a giant-city template onto it.",
      "Useful in a broader eastern-Hungary football route.",
      "Best for serious domestic-football travellers.",
    ],

    food: [
      "Simple local restaurants",
      "Traditional Hungarian dishes",
      "Basic cafés and bakeries",
      "One proper sit-down dinner",
    ],

    transport:
      "The city is manageable once you are central. This is not a place where transport complexity should worry you. The quality of the trip depends more on route logic than on inner-city movement.",

    accommodation:
      "Stay in the centre for the cleanest football-and-city setup. There is little value in staying further out unless price is dramatically better.",
  },

  miskolc: {
    cityId: "miskolc",
    name: "Miskolc",
    country: "Hungary",

    overview:
      "Miskolc is one of the more characterful football cities outside Budapest because Diósgyőr give it serious emotional football weight and the city itself is large enough to support a real weekend structure. It is not a polished tourism giant, but that is part of the point. Miskolc works when you lean into the football identity, stay centrally or sensibly on-route, and let the club provide the trip’s emotional centre of gravity.",

    topThings: [
      {
        title: "Centre orientation walk",
        tip: "Useful because Miskolc is bigger and more layered than many regional football stops.",
      },
      {
        title: "One strong city-centre dinner",
        tip: "Worth booking properly so the trip feels intentional rather than improvised.",
      },
      {
        title: "DVTK matchday build-up",
        tip: "This is one of the stronger provincial football experiences in Hungary when the atmosphere is there.",
      },
      {
        title: "Post-match central return",
        tip: "A smart way to let the evening continue without overcomplicating the logistics.",
      },
      {
        title: "Cave bath or local wellness add-on",
        tip: "Only if you genuinely have time and energy. Nice bonus, not essential.",
      },
      {
        title: "Regional hiking or nature edge",
        tip: "Useful for a longer stay, but do not let it ruin the football rhythm.",
      },
      {
        title: "Morning-after coffee reset",
        tip: "Miskolc works better with one calm morning block than with excessive sightseeing pressure.",
      },
      {
        title: "One-night or two-night trip",
        tip: "One night works for football. Two nights make the city feel more complete.",
      },
      {
        title: "Supporter-culture focus",
        tip: "The city makes most sense when you respect that Diósgyőr are the emotional point of the trip.",
      },
      {
        title: "Wider northern-Hungary route logic",
        tip: "Very useful if you are covering multiple regional stops.",
      },
    ],

    tips: [
      "Miskolc is one of the better non-Budapest football cities in Hungary if atmosphere matters.",
      "Diósgyőr are the real draw, so build the trip around them properly.",
      "Stay central or choose a base that keeps the football routing easy.",
      "This is a more serious football trip than a polished city-break flex.",
      "Good for travellers who like football identity with a bit of edge.",
    ],

    food: [
      "Traditional Hungarian meals",
      "Strong meat and grill options",
      "City-centre bars and casual dining",
      "Coffee and pastry stops",
      "One proper dinner before or after the football",
    ],

    transport:
      "Miskolc is large enough that base choice matters, but still manageable enough that the city does not become a logistics headache if you plan sensibly. Short taxi rides and a central base solve most problems quickly.",

    accommodation:
      "Stay central for the cleanest all-round trip. If you have a specific wellness or out-of-town plan, fine, but for football purposes central Miskolc is the smartest answer.",
  },

  "kazincbarcika": {
    cityId: "kazincbarcika",
    name: "Kazincbarcika",
    country: "Hungary",

    overview:
      "Kazincbarcika is a pure football-depth stop. There is no point pretending it is anything else. You come because the club are in the division and because smaller clubs matter if you actually care about the full domestic map. This is not a glamour break, not a major atmosphere destination, and not a city built to carry a heavyweight weekend. The trip only works if you accept that immediately and plan accordingly.",

    topThings: [
      {
        title: "Short town-centre walk",
        tip: "Enough to place yourself without trying to fabricate a city-break mythology the town does not have.",
      },
      {
        title: "One simple local meal",
        tip: "The correct scale for a stop like this.",
      },
      {
        title: "Kolorcity Arena matchday",
        tip: "The football is the reason to travel here, so let it be the centre of the plan.",
      },
      {
        title: "Pre-match early arrival",
        tip: "Useful because the club and stadium context are the main event.",
      },
      {
        title: "Quiet post-match food or drink",
        tip: "Enough to complete the stop without dragging it.",
      },
      {
        title: "Miskolc-linked base option",
        tip: "Often the smarter move if you want a stronger city layer around the football.",
      },
      {
        title: "One-night local only if needed",
        tip: "Most travellers will not need longer.",
      },
      {
        title: "League-completion mindset",
        tip: "This stop is rewarding if you value the full shape of a division, not just the biggest names.",
      },
      {
        title: "Northern-Hungary route pairing",
        tip: "Best if used inside a larger route rather than as a standalone showcase weekend.",
      },
      {
        title: "Morning move-on block",
        tip: "Keep the stop efficient and honest.",
      },
    ],

    tips: [
      "Kazincbarcika is for serious domestic-football travellers, not football tourists chasing glamour.",
      "The club are the reason to go.",
      "Miskolc is often the smarter wider base.",
      "Keep the trip compact and realistic.",
      "Do not try to oversell the city itself.",
    ],

    food: [
      "Simple local restaurants",
      "Basic cafés",
      "Practical pre- or post-match food",
      "Better wider dining in Miskolc if using it as your base",
    ],

    transport:
      "Local movement is not the problem. The real decision is whether you sleep in Kazincbarcika or use a stronger nearby base such as Miskolc and travel in.",

    accommodation:
      "Kazincbarcika centre works for a pure football overnight. Miskolc is usually the better wider choice if you want more city, better hotel options, and a stronger overall trip.",
  },
};

export default nbICityGuides;
```0
