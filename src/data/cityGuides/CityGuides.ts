// src/data/cityGuides/cityGuides.ts
import type { CityGuide } from "./types";

/**
 * Registry keyed by normalized cityId:
 *   "madrid", "barcelona", "london", "manchester", etc.
 *
 * IMPORTANT:
 * - Keep the full guide content here.
 * - Keep src/data/cityGuides/index.ts focused on helper functions and exports.
 */
export const cityGuides: Record<string, CityGuide> = {
  london: {
    cityId: "london",
    name: "London",
    country: "England",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g186338-Activities-London_England.html",
    overview:
      "London is huge, fast, and endlessly varied. Plan by area, not by ‘must-see lists’, and you’ll get far more value out of your days—especially on a match weekend.",
    topThings: [
      {
        title: "Westminster → South Bank walk",
        tip: "Go at golden hour. Start at Westminster, finish at Tower Bridge if you’ve got time.",
      },
      {
        title: "Borough Market",
        tip: "Avoid peak Saturday lunchtime if you hate queues. Go early or late afternoon and graze.",
      },
      { title: "British Museum", tip: "Pick 3 galleries max. Trying to ‘do it all’ is a waste." },
      {
        title: "Covent Garden / Soho evening",
        tip: "Book dinner, then wander—Soho is better unplanned once you’ve got a base.",
      },
      { title: "Greenwich day trip", tip: "Take the Thames Clipper boat one way. It’s transport + sightseeing in one." },
      {
        title: "Notting Hill & Portobello Road",
        tip: "Best on market days—weekday mornings are calmer if you want photos.",
      },
      {
        title: "Skyline viewpoint",
        tip: "Primrose Hill is free and fast. Paid views are rarely worth it if you’re short on time.",
      },
      { title: "Camden markets", tip: "Good for street food and people-watching; don’t expect ‘authentic’ shopping bargains." },
      { title: "Kew Gardens", tip: "If you’re doing it, commit half a day. It’s not a quick stop." },
      { title: "Proper pub session", tip: "Get out of the tourist core—neighbourhood pubs are the real experience." },
    ],
    tips: [
      "Use contactless on Tube/bus—daily caps make it cheaper than you think.",
      "Don’t Uber across central at rush hour; walk + Tube will beat it.",
      "Book restaurants Thu–Sun; match weekends spike demand.",
      "If you’re going to a match, arrive early and do a pre-match pub near the stadium area.",
      "Treat London like multiple small cities—do one area per day.",
    ],
    food: ["Borough Market", "Dishoom (book ahead)", "Proper Sunday roast (reserve)", "Curry in East London"],
    transport:
      "Contactless payment works on Tube, buses and trains in London zones. Plan around line changes—walking 15 minutes can save 30 minutes of connections.",
    accommodation:
      "Value improves just outside Zone 1—prioritise being near a Tube line over being ‘central’ on paper.",
  },

  madrid: {
    cityId: "madrid",
    name: "Madrid",
    country: "Spain",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187514-Activities-Madrid.html",
    overview:
      "Madrid is built for long lunches, late nights, and walking between lively neighbourhoods. It’s one of Europe’s easiest cities to enjoy without over-planning.",
    topThings: [
      { title: "Prado Museum", tip: "Go early, pick key rooms, and leave before you’re cooked. Quality over quantity." },
      { title: "Retiro Park", tip: "Do it mid-afternoon; it’s a perfect reset between sightseeing and nightlife." },
      { title: "Gran Vía stroll", tip: "Best at night when it lights up—daytime is just shopping crowds." },
      { title: "Puerta del Sol → Plaza Mayor", tip: "Quick photos, then move on—don’t waste prime eating hours here." },
      {
        title: "Mercado de San Miguel (or alternatives)",
        tip: "San Miguel is touristy. For better value, try local markets with fewer queues.",
      },
      { title: "Malasaña", tip: "Great bar-hopping area—start later than you think (10pm onwards)." },
      { title: "La Latina", tip: "Ideal for tapas crawling; go Sunday for the vibe." },
      { title: "Santiago Bernabéu / Metropolitano area", tip: "Matchday logistics matter—plan your route back before kickoff." },
      { title: "Temple of Debod sunset", tip: "Arrive early. It’s small and gets packed at sunset." },
      { title: "Chueca neighbourhood", tip: "Reliable for food + nightlife, easy base for a weekend." },
    ],
    tips: [
      "Eat like a local: late lunch, late dinner. If you eat at 6pm you’ll feel like the city is empty.",
      "Walk neighbourhood-to-neighbourhood; Madrid rewards wandering.",
      "For matchdays, leave buffer time—metro crowds are real.",
      "Tap water is fine; keep a bottle and refill.",
      "Book your big museum early, then keep the rest flexible.",
    ],
    food: ["Tapas in La Latina", "Bocadillo de calamares", "Churros con chocolate (San Ginés-style)", "Jamón + vermouth"],
    transport:
      "Metro is fast and simple. Buy a multi-journey ticket if you’ll do several trips; otherwise walking covers most central routes.",
    accommodation:
      "Best bases: Sol/Gran Vía for first-timers, Malasaña for nightlife, Salamanca for quieter/polished stays.",
  },

  rome: {
    cityId: "rome",
    name: "Rome",
    country: "Italy",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187791-Activities-Rome_Lazio.html",
    overview:
      "Rome is a walking city with world-class history layered into everyday streets. If you try to cram everything in, you’ll hate it—prioritise and enjoy the pace.",
    topThings: [
      { title: "Colosseum & Roman Forum", tip: "Book timed tickets. Morning is cooler and less chaotic." },
      { title: "Vatican Museums", tip: "Earliest slot you can get. The later you go, the worse it gets." },
      { title: "St Peter’s Basilica", tip: "Dress code matters. Go early, and climb the dome if you want the view." },
      { title: "Trevi Fountain", tip: "Go late night or early morning if you want it remotely calm." },
      { title: "Pantheon", tip: "Quick win. Spend time inside—look up, then grab coffee nearby." },
      {
        title: "Piazza Navona",
        tip: "Good for an evening stroll, but don’t eat on the square unless you enjoy paying double.",
      },
      { title: "Trastevere evening", tip: "Best at night. Show up hungry, pick a busy place, don’t overthink it." },
      { title: "Spanish Steps area", tip: "Do the walk-through, then head elsewhere for food/value." },
      { title: "Villa Borghese park", tip: "Perfect reset after heavy sightseeing—rent bikes or just wander." },
      { title: "Matchday (Stadio Olimpico)", tip: "Plan transport both ways; it’s not ‘central Rome’ and crowds are intense." },
    ],
    tips: [
      "Pre-book your big two: Colosseum/Forum and Vatican Museums.",
      "Avoid restaurants with photo menus and aggressive hosts—walk 2 streets away.",
      "Rome is hard on feet. Good shoes are non-negotiable.",
      "Treat fountains/squares as quick hits; spend time where you actually enjoy yourself (food + neighbourhoods).",
      "Matchday travel needs buffer time—don’t assume last-minute taxis will save you.",
    ],
    food: ["Carbonara", "Cacio e pepe", "Supplì", "Gelato from a reputable place (not neon piles)"],
    transport:
      "Walking is best for central. Metro is limited but useful; buses are common but can be slow. Always allow extra time.",
    accommodation:
      "Best bases: Centro Storico for first-timers, Trastevere for vibe, Monti for charm and walkability.",
  },

  berlin: {
    cityId: "berlin",
    name: "Berlin",
    country: "Germany",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187323-Activities-Berlin.html",
    overview:
      "Berlin is big, creative, and historically heavy. It’s also incredibly liveable—great public transport, strong value, and plenty to do beyond the obvious landmarks.",
    topThings: [
      { title: "Brandenburg Gate", tip: "Do it early morning for photos; later it’s just crowds." },
      { title: "Reichstag (dome visit)", tip: "Book in advance. Go near sunset if you want the best light." },
      { title: "East Side Gallery", tip: "Walk the full stretch, but ignore the street hawkers—keep moving." },
      { title: "Museum Island", tip: "Pick one museum that matches your interests. Don’t try to ‘collect them all’." },
      { title: "Checkpoint Charlie area", tip: "Treat it as a quick stop; the best history experiences are elsewhere." },
      { title: "Berlin Wall memorial (Bernauer Straße)", tip: "More meaningful than the tourist spots. Give it proper time." },
      { title: "Kreuzberg food + bars", tip: "Go for Turkish food and late-night energy; it’s a core Berlin experience." },
      { title: "Tempelhofer Feld", tip: "If weather’s decent, it’s unbeatable—picnic, bike, skate, chill." },
      { title: "Teufelsberg", tip: "Worth it for views + atmosphere. Check opening times before you trek." },
      { title: "Matchday (Olympiastadion / Köpenick)", tip: "Use S-Bahn and leave early—Berlin transport is good but crowds still bite." },
    ],
    tips: [
      "Public transport is excellent—use it, don’t overpay for taxis.",
      "Berlin nights start late; plan dinner a bit later than you would in the UK.",
      "Give yourself one ‘history-heavy’ block and one ‘fun’ block per day to avoid fatigue.",
      "Neighbourhood choice matters more than being ‘central’.",
      "For matchdays, have a post-match plan—some areas get sparse late.",
    ],
    food: ["Currywurst (as a snack)", "Döner in Kreuzberg", "Modern German cuisine in Mitte", "Coffee + pastries in Prenzlauer Berg"],
    transport:
      "Get a day pass if you’ll be hopping around. U-Bahn/S-Bahn cover almost everything; Google Maps works well for routes.",
    accommodation:
      "Best bases: Mitte for first-timers, Prenzlauer Berg for calmer stays, Kreuzberg for nightlife/food.",
  },

  paris: {
    cityId: "paris",
    name: "Paris",
    country: "France",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187147-Activities-Paris_Ile_de_France.html",
    overview:
      "Paris rewards smart pacing: do one big ‘iconic’ block, then spend the rest of the day eating, walking, and soaking up neighbourhood life. Over-scheduling ruins it.",
    topThings: [
      { title: "Eiffel Tower area", tip: "For photos, go early. For atmosphere, go at night when it sparkles." },
      {
        title: "Louvre",
        tip: "Decide your top 5 artworks before you go. Otherwise you’ll just drift and burn out.",
      },
      { title: "Montmartre & Sacré-Cœur", tip: "Go early to avoid crowds; sunset is great but packed." },
      { title: "Seine walk", tip: "Do it at dusk—Ponts and river views are peak Paris." },
      { title: "Notre-Dame area", tip: "Combine with a stroll through Île de la Cité and nearby cafés." },
      { title: "Le Marais", tip: "Best for shopping + food. Keep it as a flexible wandering block." },
      { title: "Musée d’Orsay", tip: "Often more enjoyable than the Louvre for a short trip. Strong ‘bang for time’." },
      { title: "Luxembourg Gardens", tip: "Perfect mid-day reset. Bring snacks and sit like a local." },
      { title: "Latin Quarter", tip: "Great for an evening roam—don’t get trapped in tourist menus." },
      {
        title: "Matchday (Parc des Princes)",
        tip: "Plan metro in/out and a pre-match food stop—stadium area isn’t where you want to ‘decide on the fly’.",
      },
    ],
    tips: [
      "Pre-book museums if you’re going weekend peak—walk-up lines waste hours.",
      "Eat off the main squares; one street back usually halves the price and doubles quality.",
      "Paris is best on foot—plan day routes as loops.",
      "Carry a small umbrella; weather flips fast.",
      "Matchday: metro will be packed—leave extra time and expect crowds after full time.",
    ],
    food: ["Boulangerie breakfast", "Bistro lunch (set menu)", "Crêpes (quick win)", "Wine bar in Le Marais"],
    transport:
      "Metro is efficient. Walking between nearby stops is often faster than changing lines. Keep an eye on late-night service times.",
    accommodation:
      "Best bases: 1st–6th for classic central, 9th/10th for value + food, Le Marais for vibe (often pricier).",
  },
};

export default cityGuides;
