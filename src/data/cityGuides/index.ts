// src/data/cityGuides/index.ts

import type { CityGuide } from "./types";

function slugifyTripAdvisorCity(cityName: string): string {
  // We are NOT trying to perfectly match TripAdvisor’s internal URLs (they vary).
  // This gives you a stable “search landing” that always works.
  return encodeURIComponent(`${cityName} top things to do`);
}

function makeTripAdvisorTopThingsUrl(cityName: string): string {
  return `https://www.tripadvisor.com/Search?q=${slugifyTripAdvisorCity(cityName)}`;
}

export const cityGuides: Record<string, CityGuide> = {
  // ============================
  // LONDON (Premier League capital)
  // ============================
  london: {
    cityId: "london",
    name: "London",
    country: "England",
    airports: "LHR / LGW / STN / LTN / LCY / SEN",
    coversTeams: ["Arsenal", "Chelsea", "Tottenham", "West Ham", "Crystal Palace", "Fulham", "Brentford"],
    hasGuide: true,

    vibe:
      "Massive, fast, and neighbourhood-driven. World-class museums, markets, parks, pubs, and late-night energy — but only if you plan by area.",
    whyGo:
      "Iconic sights plus genuinely great food, theatre, museums and day-to-day culture. London rewards smart planning and punishes winging it.",

    bestAreasToStay: [
      {
        name: "Soho / Covent Garden",
        vibe: "Central and walkable, classic base.",
        whyStay: "Best for first-timers: sights, theatre, restaurants, and simple Tube access.",
        goodFor: ["first-timers", "food", "theatre", "convenience"],
      },
      {
        name: "South Bank / London Bridge",
        vibe: "Riverside, big attractions, modern hotels.",
        whyStay: "Great skyline walks, Borough Market, and fast links across the city.",
        goodFor: ["couples", "scenery", "easy-transport"],
      },
      {
        name: "Shoreditch / Spitalfields",
        vibe: "Creative, street food, bars, late nights.",
        whyStay: "Best for ‘cool London’: markets, cocktails, and walkable East London pockets.",
        goodFor: ["nightlife", "friends", "shopping"],
      },
    ],

    transportTips:
      "Use contactless on Tube and buses (daily caps). Walk short hops (often quicker than changing lines). Avoid taxis at rush hour; Uber/Bolt work well but surge after events.",
    accommodationTips:
      "Stay just outside Zone 1–2 near a good Tube line if price-sensitive. Prioritise ‘walk-to-a-line’ convenience over fancy rooms — London logistics decide whether your trip feels easy or miserable.",

    matchdayTips: [
      "Pubs near big grounds fill early — if you want a seat, go 2–3 hours before KO.",
      "Plan post-match travel: Tube stations near stadiums get controlled queues.",
      "Don’t try to cross the entire city on matchday — pick a neighbourhood and commit.",
      "Book popular restaurants Thu–Sun; walk-ins can be a waste of time.",
    ],
    stadiumAreaTips:
      "London is pocket-based. Build your itinerary around areas (West End, South Bank, East, Greenwich) instead of bouncing end-to-end all day.",

    topThingsToDo: [
      { title: "South Bank skyline walk", tip: "Westminster → South Bank → Tower Bridge; pick a segment if short on time." },
      { title: "Borough Market", tip: "Go hungry and graze — don’t order one thing and leave." },
      { title: "British Museum", tip: "Choose 3–5 highlights; trying to ‘do it all’ is pointless." },
      { title: "National Gallery", tip: "Pair it with Trafalgar Square + Chinatown food nearby." },
      { title: "Greenwich viewpoint", tip: "Do it in daylight; sunset views are elite if weather behaves." },
      { title: "Notting Hill / Portobello Road", tip: "Best on market days; otherwise it’s just a pretty walk." },
      { title: "Hyde Park / Kensington Gardens", tip: "Simple reset day: walk + coffee + museum nearby." },
      { title: "Camden evening", tip: "Good for atmosphere; don’t overpay for mediocre food." },
      { title: "West End show", tip: "Same-day deals exist, but popular shows sell out — book ahead." },
      { title: "Proper pub night", tip: "Pick a neighbourhood pub away from tourist traps for the real vibe." },
    ],

    foodAndDrink: [
      "Borough Market (lunch)",
      "Chinatown (cheap and fast)",
      "Brick Lane (late food options)",
      "Marylebone / Soho (restaurants)",
      "South Bank riverside pubs",
    ],
    nightlife:
      "Soho for classic London chaos, Shoreditch for creative bars, Brixton for live music, Peckham for rooftops. Expect queues and surge pricing late.",
    budgetTips:
      "Free museums + parks keep costs sane. Markets beat overpriced chains. Stay slightly outside the centre near a Tube line. Lunch set menus can save you.",

    tripAdvisorTopThingsUrl: makeTripAdvisorTopThingsUrl("London"),

    cityTips: [
      "Plan days by area; crossing London repeatedly burns hours.",
      "Always check last Tube times if you’re not central.",
      "If you’re doing multiple stadiums, bake in travel buffers — queues are real.",
      "Avoid ‘tourist pub rows’ near the biggest landmarks; quality is worse and prices are higher.",
    ],
  },

  // ============================
  // MADRID (La Liga capital)
  // ============================
  madrid: {
    cityId: "madrid",
    name: "Madrid",
    country: "Spain",
    airports: "MAD",
    coversTeams: ["Real Madrid", "Atlético Madrid", "Getafe", "Rayo Vallecano", "Leganés"],
    hasGuide: true,

    vibe:
      "Late-living, social, and built for walking. Big boulevards, neighbourhood plazas, world-class art, and a food culture that starts when other cities are going to bed.",
    whyGo:
      "If you want a city that feels alive at night without feeling sketchy, Madrid is elite. It’s a top-tier weekend city with easy day trip options.",

    bestAreasToStay: [
      {
        name: "Sol / Gran Vía",
        vibe: "Central, busy, convenient.",
        whyStay: "Perfect if it’s your first time and you want maximum ‘walk-out-the-door’ access.",
        goodFor: ["first-timers", "convenience"],
      },
      {
        name: "Malasaña",
        vibe: "Cool bars, younger energy, indie shops.",
        whyStay: "Great base for nightlife without being stuck in the most touristy blocks.",
        goodFor: ["nightlife", "friends"],
      },
      {
        name: "La Latina",
        vibe: "Tapas streets, plazas, classic Madrid evenings.",
        whyStay: "Strong food/drink location and a more local feel, still walkable to centre.",
        goodFor: ["food", "couples", "walkable"],
      },
    ],

    transportTips:
      "Metro is fast and cheap; walking is even better in the centre. Use taxis/Uber late (safe and easy). Don’t overpay for tours — Madrid rewards self-guided wandering.",
    accommodationTips:
      "Prioritise location over hotel luxury. If you’re outside the centre, stay near a Metro line — otherwise you’ll waste the trip commuting.",

    matchdayTips: [
      "Eat early if you want a proper sit-down meal before a match; kitchens can open late.",
      "Arrive earlier than you think — stadium approaches can be slow and crowded.",
      "Post-match: let the first crowd clear, then move. Madrid is better when you’re not fighting queues.",
    ],
    stadiumAreaTips:
      "Madrid evenings are long. Plan a light afternoon, then go heavier after the match — that’s the local rhythm.",

    topThingsToDo: [
      { title: "Prado Museum", tip: "Pick a focus (Goya/Velázquez) instead of speed-running everything." },
      { title: "Retiro Park", tip: "Do it late afternoon; it’s perfect pre-dinner." },
      { title: "Gran Vía night walk", tip: "It hits different after dark — lights, buzz, people everywhere." },
      { title: "Mercado de San Miguel", tip: "Good for a quick graze; don’t treat it as your only food stop." },
      { title: "Malasaña bar crawl", tip: "Start earlier than you think; it’s an ‘after 11pm’ city." },
      { title: "La Latina tapas streets", tip: "Go plaza-to-plaza; don’t queue for one hyped place." },
      { title: "Royal Palace exterior + area", tip: "Even if you skip inside, the surroundings are worth it." },
      { title: "Plaza Mayor", tip: "Go once for the classic view; don’t waste your whole evening there." },
      { title: "Rooftop viewpoint", tip: "Book a rooftop bar slot around sunset if weather’s clear." },
      { title: "Day trip option", tip: "Toledo or Segovia if you have a spare day; easy and worth it." },
    ],

    foodAndDrink: [
      "La Latina tapas",
      "Churros + chocolate (morning or late)",
      "Mercado grazing",
      "Late dinners (9–11pm is normal)",
      "Vermouth culture (try it)",
    ],
    nightlife:
      "Madrid goes late. Malasaña and Chueca for bars, La Latina for classic evening energy, and bigger clubs if you want a 3am finish.",
    budgetTips:
      "Lunch menus are great value. Walk everywhere. Avoid overpriced tourist set menus in the most central squares.",

    tripAdvisorTopThingsUrl: makeTripAdvisorTopThingsUrl("Madrid"),

    cityTips: [
      "Shift your meal times later or you’ll feel like the city is ‘closed’.",
      "Keep your itinerary light in the afternoon; Madrid is an evening city.",
      "Use Metro for longer hops, but the centre is best on foot.",
    ],
  },

  // ============================
  // ROME (Serie A capital)
  // ============================
  rome: {
    cityId: "rome",
    name: "Rome",
    country: "Italy",
    airports: "FCO / CIA",
    coversTeams: ["AS Roma", "Lazio"],
    hasGuide: true,

    vibe:
      "Historic overload in the best way. Ancient ruins, big piazzas, strong food culture, and a city that rewards early mornings and slower afternoons.",
    whyGo:
      "Few cities hit like Rome: the sights are genuinely world-class, and the best experiences are often simple — walking, eating, and taking it in.",

    bestAreasToStay: [
      {
        name: "Centro Storico",
        vibe: "Walkable, sight-heavy, classic Rome base.",
        whyStay: "You’re close to everything; great for short trips where time matters.",
        goodFor: ["first-timers", "walkable"],
      },
      {
        name: "Trastevere",
        vibe: "Evening atmosphere, restaurants, local energy.",
        whyStay: "Excellent nights out and a more lived-in feel, still near the centre.",
        goodFor: ["food", "nightlife", "couples"],
      },
      {
        name: "Monti",
        vibe: "Stylish, calmer, near major sights.",
        whyStay: "Good balance: close to Colosseum area but less chaotic than the busiest centre blocks.",
        goodFor: ["couples", "walkable", "chill"],
      },
    ],

    transportTips:
      "Walk as much as possible. Use Metro for longer hops, but it’s limited compared to other capitals. Taxis are fine when tired — just avoid unlicensed scams around tourist hotspots.",
    accommodationTips:
      "Rome logistics = walking. Stay central if you can. If not, ensure you’re genuinely near a Metro stop or you’ll spend your life in traffic or on slow buses.",

    matchdayTips: [
      "Eat earlier than match time — the best restaurants get busy, and kitchens can be strict on timings.",
      "Allow extra time for stadium approach and entry; it can be slow.",
      "Post-match: crowds are heavy — plan a simple route back and don’t rely on ‘winging it’.",
    ],
    stadiumAreaTips:
      "Rome is best early. Do your heavy sightseeing in the morning, then slow down before match time.",

    topThingsToDo: [
      { title: "Colosseum + Roman Forum", tip: "Book timed entry. Early morning beats the crowds by miles." },
      { title: "Pantheon", tip: "Go early; it’s quick but unforgettable." },
      { title: "Trevi Fountain", tip: "Best before 8am or late night. Midday is chaos." },
      { title: "Spanish Steps area", tip: "Short stop, then move — don’t burn time there." },
      { title: "Vatican Museums", tip: "Pre-book. It’s intense; plan a lighter day around it." },
      { title: "St Peter’s Basilica dome", tip: "If you do one ‘climb’, do this. Views are worth it." },
      { title: "Trastevere evening", tip: "Best for dinner and wandering; don’t over-plan." },
      { title: "Piazza Navona", tip: "Good night atmosphere; keep expectations realistic on food." },
      { title: "Villa Borghese park", tip: "Great reset day: walk, viewpoints, chill." },
      { title: "Proper gelato + espresso routine", tip: "Small habit that makes the trip feel ‘Rome’ fast." },
    ],

    foodAndDrink: [
      "Carbonara / cacio e pepe (avoid tourist traps)",
      "Pizza al taglio (quick and good value)",
      "Trastevere dinner streets",
      "Espresso culture (stand at the bar = cheaper)",
      "Gelato (choose busy places)",
    ],
    nightlife:
      "Rome nightlife is more ‘evening strolling + bars’ than mega-clubs. Trastevere is the obvious base; Monti also works for calmer drinks.",
    budgetTips:
      "Pre-book major sights so you’re not paying inflated last-minute options. Walk instead of taxis. Avoid restaurants with aggressive staff outside tourist hotspots.",

    tripAdvisorTopThingsUrl: makeTripAdvisorTopThingsUrl("Rome"),

    cityTips: [
      "Start early: Rome is better before the crowds and heat.",
      "Don’t try to do ‘every sight’ — you’ll turn it into a checklist and hate it.",
      "If a restaurant has a guy begging you to come in, keep walking.",
    ],
  },

  // ============================
  // BERLIN (Bundesliga capital)
  // ============================
  berlin: {
    cityId: "berlin",
    name: "Berlin",
    country: "Germany",
    airports: "BER",
    coversTeams: ["Union Berlin"],
    hasGuide: true,

    vibe:
      "Big, gritty, creative, and history-heavy. Less ‘pretty postcard’, more culture, nightlife, and neighbourhood character. It’s a city you learn, not just see.",
    whyGo:
      "Berlin is one of Europe’s best cities for food variety, clubs, and modern culture — plus the history is genuinely powerful when you do it properly.",

    bestAreasToStay: [
      {
        name: "Mitte",
        vibe: "Central, museums, sights, easiest base.",
        whyStay: "Best for first-time visitors and short trips where logistics matter.",
        goodFor: ["first-timers", "convenience", "culture"],
      },
      {
        name: "Kreuzberg",
        vibe: "Creative, busy, bars, food.",
        whyStay: "Great base if you want nightlife and a more local, energetic feel.",
        goodFor: ["nightlife", "food", "friends"],
      },
      {
        name: "Prenzlauer Berg",
        vibe: "Calmer, cafes, nice streets, easier mornings.",
        whyStay: "Good if you want a smoother trip without being far away.",
        goodFor: ["couples", "chill", "cafes"],
      },
    ],

    transportTips:
      "U-Bahn/S-Bahn are excellent. Buy day tickets if you’re moving a lot. Walking is still worth it in neighbourhood pockets. Late-night transport is decent, but expect longer waits than daytime.",
    accommodationTips:
      "Berlin is spread out. Pick a base based on what you want: Mitte (sights), Kreuzberg (nightlife), Prenzlauer Berg (calm). Don’t pick ‘cheap but far’ — you’ll pay in time.",

    matchdayTips: [
      "If you’re going to Union: plan transport early; it’s not central and crowds funnel hard.",
      "Berlin pre-drinks are more ‘bars’ than ‘pub culture’ — pick a neighbourhood and commit.",
      "Cold months: dress properly. Standing outside queues is common.",
    ],
    stadiumAreaTips:
      "Berlin is wide. Treat it like multiple mini-cities: do one area per day rather than bouncing across town.",

    topThingsToDo: [
      { title: "Brandenburg Gate + area", tip: "Go early or late for photos without crowds." },
      { title: "Reichstag dome", tip: "Book ahead; it’s free but timed." },
      { title: "East Side Gallery", tip: "Go with context — it’s more meaningful than ‘just a wall’." },
      { title: "Museum Island", tip: "Pick one museum properly instead of 4 badly." },
      { title: "Checkpoint Charlie area", tip: "Quick stop; don’t linger in tourist traps nearby." },
      { title: "Holocaust Memorial", tip: "Be respectful; pair it with nearby history sites." },
      { title: "Kreuzberg food run", tip: "Berlin’s food variety is a feature — use it." },
      { title: "Tempelhofer Feld", tip: "Massive open space; great reset if weather is decent." },
      { title: "Nightlife experience", tip: "If clubs matter, plan: queues, door policy, and timings are real." },
      { title: "Neighbourhood cafe morning", tip: "Prenzlauer Berg mornings are elite for a slower start." },
    ],

    foodAndDrink: [
      "Street food + markets",
      "International options (very strong)",
      "Currywurst as a quick classic",
      "Late-night kebab culture",
      "Good coffee scenes in the right areas",
    ],
    nightlife:
      "Berlin is a global nightlife capital. If you want clubs, plan your night like a mission (timing, outfit, expectations). If not, the bar scene is still excellent.",
    budgetTips:
      "Public transport keeps costs down. Museums can add up — pick quality over quantity. Berlin can be cheap or expensive depending on nightlife choices.",

    tripAdvisorTopThingsUrl: makeTripAdvisorTopThingsUrl("Berlin"),

    cityTips: [
      "Berlin is spread out — location choice matters more than hotel quality.",
      "Don’t treat it like a ‘2-day checklist city’. It’s better when you slow down.",
      "If clubbing is a goal, do some basic planning or you’ll waste a night queueing.",
    ],
  },

  // ============================
  // PARIS (Ligue 1 capital)
  // ============================
  paris: {
    cityId: "paris",
    name: "Paris",
    country: "France",
    airports: "CDG / ORY",
    coversTeams: ["PSG"],
    hasGuide: true,

    vibe:
      "Elegant and intense. Iconic sights, strong food culture, great walking, and neighbourhoods that feel totally different from each other.",
    whyGo:
      "Paris is a ‘big moment’ city: the classics deliver, and it’s also brilliant when you get off the main tourist routes into real neighbourhood life.",

    bestAreasToStay: [
      {
        name: "Le Marais",
        vibe: "Stylish streets, food, galleries, walkable.",
        whyStay: "One of the best all-round bases: central without being soulless.",
        goodFor: ["food", "couples", "walkable"],
      },
      {
        name: "Saint-Germain / Latin Quarter",
        vibe: "Classic Paris, cafes, bookish vibe.",
        whyStay: "Great for first-timers who want the ‘movie Paris’ feel.",
        goodFor: ["first-timers", "culture", "cafes"],
      },
      {
        name: "Montmartre (edges)",
        vibe: "Hills, views, atmosphere.",
        whyStay: "Strong vibe, great views; just accept some walking uphill.",
        goodFor: ["scenery", "romantic", "photos"],
      },
    ],

    transportTips:
      "Metro is excellent. Walk whenever you can — Paris is best at street level. Keep your bag secure in busy tourist corridors and on trains.",
    accommodationTips:
      "Paris pricing is brutal in the centre. If you go cheaper, ensure you’re near a Metro line and you’re happy with the area at night.",

    matchdayTips: [
      "Eat and drink away from the most touristy strips — quality and value improve instantly.",
      "Allow time for Metro queues on big match nights.",
      "Keep the day lighter; Paris is tiring if you stack too much sightseeing and a match.",
    ],
    stadiumAreaTips:
      "Paris is a walking city. Build slack into your day so you’re not sprinting everywhere and hating it.",

    topThingsToDo: [
      { title: "Eiffel Tower area", tip: "Do it early or late; midday crowds are the worst version of Paris." },
      { title: "Louvre", tip: "Pick priorities (Mona Lisa + 2–3 wings). It’s enormous." },
      { title: "Seine riverside walk", tip: "Sunset stroll is the cheat code for ‘Paris feeling’." },
      { title: "Notre-Dame area", tip: "Even with changes, the area is still worth the walk-through." },
      { title: "Montmartre viewpoint", tip: "Go early to avoid the heaviest crowds." },
      { title: "Musée d’Orsay", tip: "Often a better experience than the Louvre for many people." },
      { title: "Le Marais wandering", tip: "Shops + food + galleries. Low effort, high reward." },
      { title: "Luxembourg Gardens", tip: "Perfect midday reset — slow down and recharge." },
      { title: "Proper bakery crawl", tip: "Croissant + baguette + pastry; avoid ‘Instagram bait’ places." },
      { title: "Neighbourhood bistro dinner", tip: "Book ahead Fri/Sat; Paris rewards reservations." },
    ],

    foodAndDrink: [
      "Bakeries (morning routine)",
      "Neighbourhood bistros (reserve)",
      "Wine bars (excellent)",
      "Markets for casual lunches",
      "Avoid overpriced tourist menus near the biggest landmarks",
    ],
    nightlife:
      "More ‘wine bars + late dinners’ than wild clubbing (unless you chase it). Le Marais and Saint-Germain are safe bets for evenings.",
    budgetTips:
      "The free stuff is the city: walks, neighbourhoods, parks. Museums add up fast. Eat lunch from bakeries/markets to control spend.",

    tripAdvisorTopThingsUrl: makeTripAdvisorTopThingsUrl("Paris"),

    cityTips: [
      "Paris improves massively when you leave the main tourist corridors.",
      "Reserve dinners on weekends or you’ll waste time hunting.",
      "Walk. The ‘Paris experience’ is street-level, not just landmarks.",
    ],
  },
};

export function getCityGuide(cityId: string | undefined | null): CityGuide | null {
  if (!cityId) return null;
  const key = String(cityId).trim().toLowerCase();
  return cityGuides[key] ?? null;
}

export default cityGuides;
