// src/data/cityGuides/index.ts
import type { CityGuide } from "./types";

export const cityGuides: Record<string, CityGuide> = {
  london: {
    cityId: "london",
    name: "London",
    country: "England",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g186338-Activities-London_England.html",
    overview:
      "London is multiple cities stitched together. If you attack it like one checklist, you’ll spend your weekend underground, tired, and annoyed. The winning approach is to plan by area (and by travel lines), anchor each day with one ‘big’ thing, then build everything else around food, walkable loops, and matchday logistics. London is also expensive by default, so the difference between a great trip and a mediocre one is usually decisions: where you stay (near a Tube line), what time you go (early beats queues), and whether you move smartly (walk + Tube beats traffic).",

    topThings: [
      {
        title: "Westminster → South Bank loop",
        tip:
          "Do it early (before 10am) or at golden hour. Walk Westminster Bridge → London Eye → Tate Modern → Millennium Bridge → St Paul’s. It’s a high-impact route with minimal planning.",
      },
      {
        title: "Borough Market + riverside food crawl",
        tip:
          "Peak Saturday lunchtime is chaos. Go weekday morning or late afternoon. Pick 2–3 stalls max, then sit by the river—don’t waste 45 minutes queueing for one ‘viral’ bite.",
      },
      {
        title: "British Museum (or a single ‘hero’ museum)",
        tip:
          "Choose a mission (e.g., Egypt + Greece) and leave after 90 minutes. The museum is enormous; ‘doing it all’ is how you burn half a day and remember none of it.",
      },
      {
        title: "Soho / Covent Garden evening base",
        tip:
          "Book dinner as an anchor, then wander. Soho works best when you’re not trying to micromanage every stop—pick a lane (cocktail bars, pubs, late eats) and let it flow.",
      },
      {
        title: "Greenwich (cut-through day trip)",
        tip:
          "Take the Thames Clipper boat one way. It’s transport + sightseeing in one ticket. Pair Cutty Sark/Observatory with a pub by the river and leave before it gets crowded.",
      },
      {
        title: "Notting Hill & Portobello (short and sharp)",
        tip:
          "If you want photos and less crowd stress, do weekday mornings. If you want energy, go Saturday and accept the crowds—just don’t pretend it’ll be calm.",
      },
      {
        title: "A free skyline moment",
        tip:
          "Primrose Hill or Hampstead Heath beats a paid platform if time is tight. If you do pay: go near sunset and commit—rushing in and out is pointless value.",
      },
      {
        title: "Camden (street food + atmosphere)",
        tip:
          "Camden is more vibe than bargains. Go with a ‘snack crawl’ mindset and don’t overbuy random souvenirs. If it’s heaving, walk 10 minutes along the canal and it calms down.",
      },
      {
        title: "Kew Gardens (half-day commitment)",
        tip:
          "This isn’t a quick stop. Go when the weather is decent and commit half a day. If you’re time-poor, swap it for a shorter park loop (Regent’s Park + Primrose Hill).",
      },
      {
        title: "Proper pub culture (neighbourhood > tourist core)",
        tip:
          "Avoid the obvious central chains. Pick a neighbourhood pub near where you’re staying or near your matchday route. The ‘real’ London feeling is in local pubs, not Leicester Square.",
      },
    ],

    tips: [
      "Use contactless on Tube/bus—daily caps can make it cheaper than you expect.",
      "At rush hour, walk + Tube beats Uber. Traffic is a trap, not a convenience.",
      "Plan each day as one area: Central/Westminster, South Bank, East (Shoreditch), North (Camden), West (Notting Hill).",
      "Restaurants Thu–Sun book out fast on match weekends. Lock key meals early, stay flexible otherwise.",
      "If you’re going to a match, arrive early and do a pre-match pub near the stadium area. It’s half the experience.",
      "Budget time for station transfers—some ‘interchanges’ are long walks underground.",
      "Avoid changing lines multiple times for small distances. Often, a 15–20 minute walk saves 30 minutes.",
      "If you’re doing museums, go early. Afternoon crowds + fatigue makes them worse.",
      "Don’t stay ‘central on paper’ if it means poor transport. A direct Tube line is worth more than a postcode.",
      "For sightseeing photos: mornings are the cheat code in London.",
      "If you want markets: weekday mornings are calmer; weekends are energy but stressful.",
      "Carry a light rain layer. London weather changes quickly, and walking is your best tool.",
      "Matchday: decide your post-match route before kickoff. Crowds around stations are predictable chaos.",
      "If you’re doing nightlife, don’t start too early—London evenings build from 8–9pm onward in most areas.",
    ],

    food: [
      "Borough Market (graze, don’t queue endlessly)",
      "Dishoom (book ahead, especially weekends)",
      "Proper Sunday roast (reserve)",
      "Curry in East London / Brick Lane (choose well, avoid tourist traps)",
      "Chinatown quick eats (good value if you pick busy spots)",
      "Pub pies + pints (do it properly at least once)",
      "Coffee + pastries in neighbourhood cafés (better than chain central)",
    ],

    transport:
      "Contactless payment works across Tube, buses and most rail within the London zones. The main skill is reducing transfers: fewer line changes beats ‘shortest distance’. Walking between nearby stations often saves time. On matchdays, expect crowd control at key stations—arrive earlier than you think, and have a backup route (a different line or a 15-minute walk to a quieter station).",

    accommodation:
      "Value improves just outside Zone 1. Prioritise a direct Tube line to where you’ll spend time over being ‘central’. Strong bases depend on your plan: South Bank for walkable sightseeing, King’s Cross area for connections, Shoreditch for nightlife/food, Paddington for easy Heathrow access, and areas with simple lines to stadiums if matchday is the anchor.",
  },

  madrid: {
    cityId: "madrid",
    name: "Madrid",
    country: "Spain",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187514-Activities-Madrid.html",
    overview:
      "Madrid is a city of rhythm: late lunches, later dinners, and neighbourhood energy that builds as the day goes on. It’s also one of the easiest major European capitals to enjoy without over-planning—provided you understand how people actually live here. The best trips balance culture (a museum or two), long park breaks, and evenings that drift through food, vermouth, and bars. On match weekends, logistics matter: the metro is easy, but crowds are real, and last-minute plans become expensive or stressful.",

    topThings: [
      {
        title: "Prado Museum (high-value culture block)",
        tip:
          "Go early, pick a short list of highlights, and leave before you’re fried. The goal is ‘memorable’ not ‘exhaustive’. Pair it with a nearby lunch.",
      },
      {
        title: "Retiro Park reset",
        tip:
          "Perfect mid-afternoon when the city heat and walking catches up. Bring water, slow down, then reboot for the evening.",
      },
      {
        title: "Gran Vía at night",
        tip:
          "It’s better after dark when the city lights up. Daytime can feel like a shopping corridor; nighttime feels like Madrid.",
      },
      {
        title: "Sol → Plaza Mayor (quick hit, then escape)",
        tip:
          "Do photos, get your bearings, then move. Don’t waste prime eating hours in the most tourist-dense square.",
      },
      {
        title: "Markets (San Miguel or smarter alternatives)",
        tip:
          "San Miguel is fun but touristy and pricey. Treat it as a ‘one drink + one bite’ stop, then go elsewhere for real tapas value.",
      },
      {
        title: "La Latina tapas crawl",
        tip:
          "This is where you do the classic ‘one drink, one bite’ rhythm. Keep moving—don’t sit for a full meal unless you’ve found the perfect place.",
      },
      {
        title: "Malasaña nightlife district",
        tip:
          "Start later than you think (10pm+). Pick one strong bar as a base, then roam—Malasaña is best when you don’t over-structure it.",
      },
      {
        title: "Temple of Debod sunset",
        tip:
          "Arrive early; it packs out. If it’s mobbed, walk a little further for quieter viewpoints rather than forcing the crowd.",
      },
      {
        title: "Football stadium area (Bernabéu / Metropolitano)",
        tip:
          "Treat matchday like an operation: plan metro in/out, pre-match food, and a post-match meeting point. ‘We’ll figure it out later’ is how you lose time.",
      },
      {
        title: "Chueca (reliable all-round base)",
        tip:
          "Good food density, walkable, and a strong weekend vibe. If you’re staying short-term, this is a safe ‘works for almost everyone’ area.",
      },
    ],

    tips: [
      "Madrid runs late. If you eat dinner at 6pm you’ll feel like the city is closed.",
      "Do one major museum max per day. Pair it with a long lunch and you’ll enjoy it more.",
      "Walk neighbourhood-to-neighbourhood; Madrid rewards wandering more than tight schedules.",
      "Tap water is fine—carry a bottle and refill.",
      "For matchdays, leave buffer time. Metro crowds spike and station exits can bottleneck.",
      "If you want great tapas, avoid places with menu photos and aggressive street staff.",
      "Do a vermouth moment (especially weekends). It’s a cultural cheat code.",
      "Siesta hours affect some smaller spots; don’t panic—plan your day around late openings.",
      "If you want shopping, do it earlier. Evenings are for food and atmosphere.",
      "Pick 1–2 ‘anchor reservations’ for a weekend. Keep the rest flexible.",
      "Avoid overusing taxis in central—metro + walking usually wins.",
      "If you’re doing a day trip (Toledo/Segovia), commit early start. Don’t half-do it.",
      "Expect late-night noise in nightlife areas—choose accommodation accordingly if you need sleep.",
    ],

    food: [
      "Tapas in La Latina (crawl-style)",
      "Bocadillo de calamares (classic quick win)",
      "Churros con chocolate (go off-peak to avoid queues)",
      "Jamón + vermouth (simple, perfect)",
      "Seafood/rice dishes (book a solid spot if it matters to you)",
      "Late-night sandwiches and snacks (Madrid does ‘after’ food well)",
    ],

    transport:
      "Madrid’s metro is fast and intuitive. For a weekend, you’ll usually do a mix of walking and metro hops. On matchdays, stations near stadiums get crowded—arrive early and know your route back (including a backup line or a short walk to a less busy station).",

    accommodation:
      "Best bases depend on your goals: Sol/Gran Vía for first-timers who want maximum convenience, Malasaña for nightlife and a younger vibe, Salamanca for a quieter/polished stay, and Chueca for a balanced ‘food + access’ base. Noise can be real in nightlife areas—check reviews if sleep matters.",
  },

  rome: {
    cityId: "rome",
    name: "Rome",
    country: "Italy",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187791-Activities-Rome_Lazio.html",
    overview:
      "Rome is a walking city where world-class history is baked into everyday streets. The mistake people make is trying to do it like a checklist. Rome punishes over-scheduling: queues, heat, distance, and fatigue stack quickly. The winning play is to pre-book the big-ticket sites, accept that you’ll miss some things, and build your day around neighbourhood loops (with food stops as anchors). Matchdays add another layer: Stadio Olimpico is not ‘central Rome’ and crowd logistics are real.",

    topThings: [
      {
        title: "Colosseum + Roman Forum (properly planned)",
        tip:
          "Book timed tickets. Go early to avoid heat and peak crowds. Treat the Forum as a slow wander, not a sprint—this is where Rome feels like Rome.",
      },
      {
        title: "Vatican Museums (survival mode required)",
        tip:
          "Earliest slot you can get. The later you go, the worse it gets. Decide your priorities before you enter or you’ll just drift in a crowd river.",
      },
      {
        title: "St Peter’s Basilica + dome view",
        tip:
          "Dress code matters. Go early, and if you’re doing the dome, do it before midday heat. The payoff is worth it if you time it right.",
      },
      {
        title: "Pantheon + nearby coffee",
        tip:
          "High impact, low time. Spend time inside looking up—then grab coffee nearby. It’s one of Rome’s best ‘bang for minutes’ stops.",
      },
      {
        title: "Trevi Fountain (off-peak strategy)",
        tip:
          "Go very early or late at night. Midday is shoulder-to-shoulder and drains your patience for the rest of the day.",
      },
      {
        title: "Piazza Navona → Campo de’ Fiori stroll",
        tip:
          "Great evening walk. Don’t eat on the square unless you enjoy paying double—walk two streets away for value and quality.",
      },
      {
        title: "Trastevere night block",
        tip:
          "Show up hungry. Pick a busy place with locals, then roam. Trastevere is the ‘Rome vibe’ zone once the sun goes down.",
      },
      {
        title: "Villa Borghese reset",
        tip:
          "Use it as a recovery block between heavy sightseeing. Rent bikes or just wander. Rome trips are won on pacing, not on grinding.",
      },
      {
        title: "Food mission: Carbonara / Cacio e pepe / Supplì",
        tip:
          "Do at least one ‘proper’ pasta meal and one quick street snack (supplì). Avoid anywhere with photo menus or pushy hosts.",
      },
      {
        title: "Matchday at Stadio Olimpico",
        tip:
          "Plan transport both ways and build in buffer time. Crowds are intense and routes can bottleneck. Decide your post-match meeting point in advance.",
      },
    ],

    tips: [
      "Pre-book the big two: Colosseum/Forum and Vatican Museums. Everything else can flex.",
      "Rome is hard on feet. Good shoes are not optional.",
      "Treat fountains and famous squares as quick hits. Don’t donate half your day to photos.",
      "Avoid restaurants with photo menus and aggressive hosts. Walk 2 streets away.",
      "If you’re doing museums/sites, go early. Midday heat + crowds is the worst combo.",
      "Carry water. Rome walking miles without water is how you crash.",
      "Build your day as loops: one neighbourhood, one anchor meal, one big site.",
      "Don’t assume taxis will save you. Traffic can be brutal and availability unreliable on peak days.",
      "If you’re short on time, pick one ‘ancient’ day and one ‘neighbourhood/food’ day.",
      "Matchday: leave extra time and expect slow exits after full time.",
      "Gelato: avoid neon mountains. Look for covered tubs and busy local spots.",
      "Coffee culture: drink quickly at the bar like locals; sit-down adds cost.",
      "Rome is better when you stop trying to win it. Enjoy the pace.",
    ],

    food: [
      "Carbonara (do it properly once)",
      "Cacio e pepe (classic, simple, perfect)",
      "Supplì (street snack win)",
      "Roman-style pizza by the slice",
      "Gelato from a reputable place (avoid neon piles)",
      "Trastevere evening food crawl (choose busy spots)",
    ],

    transport:
      "Walking wins in central Rome. Metro is limited but useful; buses are common but can be slow/unpredictable. Plan extra time for anything time-sensitive. For Stadio Olimpico, treat matchday as a separate logistics plan: know your route there, your route back, and your fallback.",

    accommodation:
      "Best bases: Centro Storico for first-timers (walkable classics), Trastevere for vibe and evenings, Monti for charm and food, and areas near major connections if you’re doing day trips. Prioritise walkability and realistic travel times over ‘cheap but far’—Rome distance fatigue stacks fast.",
  },

  berlin: {
    cityId: "berlin",
    name: "Berlin",
    country: "Germany",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187323-Activities-Berlin.html",
    overview:
      "Berlin is big, creative, and historically heavy, but it’s also one of Europe’s most liveable capitals: excellent public transport, strong value, and neighbourhoods with distinct personalities. The key is not trying to ‘do all history all the time.’ Mix one serious block (memorials, museums) with one fun block (neighbourhood food, bars, parks). Matchdays are straightforward if you use S-Bahn/U-Bahn properly—but crowds still bite, so build in buffer time.",

    topThings: [
      {
        title: "Brandenburg Gate (photo timing)",
        tip:
          "Do it early morning for clean photos. Later it becomes a background for crowds rather than a moment you enjoy.",
      },
      {
        title: "Reichstag dome visit",
        tip:
          "Book in advance. Go near sunset for the best light. Pair it with a walk around government quarter and the Spree.",
      },
      {
        title: "Berlin Wall Memorial (Bernauer Straße)",
        tip:
          "More meaningful than the tourist-heavy spots. Give it proper time and read the context—this is where history lands.",
      },
      {
        title: "East Side Gallery (walk the stretch)",
        tip:
          "Walk the full section, then leave. Don’t get dragged into street hawker nonsense. It’s best treated as a strong walk-through.",
      },
      {
        title: "Museum Island (choose one, don’t hoard)",
        tip:
          "Pick a museum that matches your interests. Trying to ‘collect’ them turns into fatigue and shallow experience.",
      },
      {
        title: "Checkpoint Charlie area (quick stop only)",
        tip:
          "Treat it as a quick photo/context moment. The best Berlin history experiences are elsewhere.",
      },
      {
        title: "Kreuzberg food + bars",
        tip:
          "Go for Turkish food, late-night energy, and proper Berlin edge. It’s one of the best ‘real city’ areas for visitors.",
      },
      {
        title: "Tempelhofer Feld",
        tip:
          "If weather’s decent, it’s unbeatable: picnic, bike, skate, chill. Great reset after heavy sightseeing.",
      },
      {
        title: "Teufelsberg",
        tip:
          "Worth it for views + atmosphere. Check opening times and weather; it’s not a ‘casual pop-in.’",
      },
      {
        title: "Matchday (Olympiastadion / Köpenick)",
        tip:
          "Use S-Bahn and leave early. Transport is good but crowds still bottleneck. Have a clear post-match route and meeting point.",
      },
    ],

    tips: [
      "Public transport is excellent—use it. Berlin punishes unnecessary taxi spending.",
      "Neighbourhood choice matters more than being ‘central’. Pick a base that matches your vibe.",
      "Mix one history-heavy block with one fun/food block per day to avoid burnout.",
      "Berlin nights start late. Plan dinner later than you would in the UK.",
      "Book Reichstag in advance. It’s a simple win that people miss.",
      "If you’re doing clubs, don’t try to force it. Berlin nightlife has its own rules and pace.",
      "Döner is part of the experience. Don’t overthink it—pick busy local spots.",
      "For sightseeing, mornings are calmer; afternoons can get busy around key landmarks.",
      "If it’s cold, plan indoor blocks (museums) and warm food breaks. Berlin weather can bite.",
      "Matchday: transport is reliable but not magical—buffer time matters.",
      "Berlin is big. Don’t try to cross the city repeatedly in one day; cluster activities by area.",
      "Sunday trading can be limited. Plan essentials ahead.",
    ],

    food: [
      "Döner in Kreuzberg (pick busy local spots)",
      "Currywurst as a snack (not a ‘meal plan’)",
      "Modern German cuisine in Mitte",
      "Coffee + pastries in Prenzlauer Berg",
      "Beer gardens (seasonal) for relaxed evenings",
    ],

    transport:
      "U-Bahn and S-Bahn cover almost everything and are generally reliable. A day pass can be good value if you’re bouncing around. Google Maps works well for routing. On matchdays, expect packed trains near stadium routes—arrive early and plan a clear return route.",

    accommodation:
      "Best bases: Mitte for first-timers who want convenience, Prenzlauer Berg for calmer stays and café culture, Kreuzberg for nightlife/food, and Friedrichshain for energy and access. Prioritise being near an S/U-Bahn stop over chasing a slightly cheaper place far out.",
  },

  paris: {
    cityId: "paris",
    name: "Paris",
    country: "France",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187147-Activities-Paris_Ile_de_France.html",
    overview:
      "Paris rewards smart pacing. If you try to ‘win’ it with a schedule, it fights back with queues, crowds, and decision fatigue. The best approach is one iconic anchor per day (a major museum or landmark), then long neighbourhood walks, cafés, and food. Paris is also a city where small decisions matter: eating one street off the main squares, choosing walkable loops, and knowing when to book ahead. Matchdays at Parc des Princes are straightforward if you plan metro and pre/post-match food—stadium areas are not the place to improvise.",

    topThings: [
      {
        title: "Eiffel Tower area (timing strategy)",
        tip:
          "For photos, go early. For atmosphere, go at night when it sparkles. Don’t spend hours queueing unless you truly want the ascent.",
      },
      {
        title: "Louvre (survive it properly)",
        tip:
          "Decide your top 5 artworks before you enter. Otherwise you’ll drift in crowds and leave exhausted with no highlights.",
      },
      {
        title: "Musée d’Orsay (high value for short trips)",
        tip:
          "Often more enjoyable than the Louvre if you’re time-limited. Great ‘bang for time’ and less overwhelming.",
      },
      {
        title: "Montmartre & Sacré-Cœur",
        tip:
          "Go early to avoid crowds. Sunset is beautiful but packed. Pair it with a simple café stop and keep moving.",
      },
      {
        title: "Seine walk at dusk",
        tip:
          "Do it at dusk for peak Paris. Choose a bridge-to-bridge loop and stop for a drink rather than marching nonstop.",
      },
      {
        title: "Le Marais (flexible wandering block)",
        tip:
          "Great for shopping + food. Keep it loose; the joy is discovering spots rather than sticking to a rigid plan.",
      },
      {
        title: "Luxembourg Gardens reset",
        tip:
          "Perfect midday break. Bring snacks, sit, and slow down. Paris is better when you pace it.",
      },
      {
        title: "Latin Quarter evening roam",
        tip:
          "Good vibe, lots of options. Avoid tourist menus—pick busy places with locals and minimal ‘sales pitch’ energy.",
      },
      {
        title: "Notre-Dame area (context walk)",
        tip:
          "Combine with Île de la Cité and nearby café streets. Treat it as part of a loop, not a standalone mission.",
      },
      {
        title: "Matchday (Parc des Princes)",
        tip:
          "Plan metro in/out and a pre-match food stop. The stadium area isn’t where you want to ‘decide on the fly’ under time pressure.",
      },
    ],

    tips: [
      "Pre-book museums on weekend peak. Walk-up lines can delete hours.",
      "Eat one street off the main squares; price drops and quality rises.",
      "Paris is best on foot—plan day routes as loops rather than back-and-forth zigzags.",
      "Carry a small umbrella. Weather can flip fast.",
      "Pick one ‘iconic’ anchor per day, then let the rest be neighbourhood life.",
      "Avoid restaurants with overly tourist-facing menus. Busy local energy is your best signal.",
      "Café culture: you’re paying for the seat and the vibe—use it as a pacing tool.",
      "Metro is efficient, but line changes can be slower than walking between nearby stops.",
      "If you want views without the Eiffel Tower grind, find a good viewpoint and enjoy the cityscape.",
      "Matchday: metro will be packed after full time—expect it and plan your exit.",
      "Don’t stack museums back-to-back. You’ll stop absorbing anything.",
      "If you want romance and atmosphere, go out later—Paris evenings build slowly and then hit.",
      "Stay realistic about distances. ‘It’s Paris’ doesn’t mean it’s small.",
    ],

    food: [
      "Boulangerie breakfast (proper pastries + coffee)",
      "Bistro lunch (set menu is usually best value)",
      "Crêpes (quick win)",
      "Wine bar in Le Marais",
      "Cheese + charcuterie picnic (Luxembourg / Seine spots)",
      "One ‘proper’ dinner booking (weekends fill fast)",
    ],

    transport:
      "Metro is efficient and usually the best value. Walking between nearby stops is often faster than changing lines. Keep an eye on late-night service times if you’re out late. On matchdays, expect crowded trains—leave buffer time and avoid last-minute sprints.",

    accommodation:
      "Best bases depend on budget and vibe: 1st–6th for classic central (often pricier), 9th/10th for value + food density, Le Marais for atmosphere (often pricey), and well-connected areas near major metro lines if you want better value. Prioritise walkability and transport links over ‘cheap but awkward.’",
  },
};

export default cityGuides;
