// src/data/cityGuides/index.ts

import type { CityGuide } from "./types";

export const cityGuides: Record<string, CityGuide> = {
  london: {
    cityId: "london",
    name: "London",
    country: "England",
    overview:
      "London is overwhelming in the best way: world-class sights, endless neighbourhoods, and reliable transport that makes stadium days easy. Plan around the match kickoff and you can still pack in museums, pubs, and a proper walk along the Thames.",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g186338-Activities-London_England.html",
    topThings: [
      { title: "Westminster & Parliament Square", tip: "Go early for cleaner photos and fewer crowds; then walk to the river for the classic skyline." },
      { title: "Tower of London & Tower Bridge", tip: "Book a timed entry and arrive 15–20 minutes before; the Crown Jewels queue builds fast." },
      { title: "British Museum", tip: "It’s free; aim for the first hour after opening and pick 3–4 galleries max to avoid fatigue." },
      { title: "Tate Modern + Millennium Bridge", tip: "Do the bridge at sunset; the Tate viewing level is a quick win for skyline shots." },
      { title: "Borough Market", tip: "Weekdays are calmer; eat first, shop second. Expect queues at the famous stalls." },
      { title: "South Bank walk (London Eye area)", tip: "Best all-round ‘London’ vibe; pair it with a riverside pub before the match." },
      { title: "Covent Garden & Seven Dials", tip: "Great for pre-game food; reserve if it’s Saturday evening." },
      { title: "Camden Market & Regent’s Canal", tip: "Walk the canal towards King’s Cross for a quieter, better-looking route." },
      { title: "Greenwich (Park + Observatory area)", tip: "Climb for the view; the park is a great reset after a loud night." },
      { title: "Classic pub crawl (Soho / Fitzrovia)", tip: "Choose 3 pubs not 10; you’ll enjoy it more and still make kickoff." },
    ],
    tips: [
      "Use contactless on the Tube; it caps daily automatically—don’t buy paper tickets.",
      "For match days, leave early: station queues can add 20–30 minutes even if the ride is short.",
      "If you’re staying central, aim for a hotel near a Tube line that goes straight to the stadium area.",
      "London pubs fill up hard on Friday/Saturday—book food or accept you’ll be standing.",
      "Keep an umbrella or packable rain jacket; London weather changes quickly.",
    ],
    transport:
      "Use the Tube/Overground with contactless. Plan stadium travel using the nearest station and add time for queues. Night buses are useful but slower; Uber is expensive at peak times.",
    accommodation:
      "If budget allows, stay Zone 1–2 near a major interchange (King’s Cross, Liverpool Street, London Bridge) for maximum flexibility. Otherwise choose a hotel on a direct line to your stadium.",
  },

  madrid: {
    cityId: "madrid",
    name: "Madrid",
    country: "Spain",
    overview:
      "Madrid is built for football weekends: late dinners, walkable neighbourhoods, and a city centre that stays lively. Factor in the heat (or late nights) and you’ll get more out of museums and parks before heading to the stadium.",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187514-Activities-Madrid.html",
    topThings: [
      { title: "Prado Museum", tip: "Go early or late; pick a shortlist (Velázquez/Goya) rather than trying to ‘do it all’." },
      { title: "Retiro Park (Crystal Palace)", tip: "Ideal pre-match calm; bring water and sit by the lake for 20 minutes." },
      { title: "Royal Palace", tip: "Book timed entry; the queues are real. Combine with Plaza de Oriente." },
      { title: "Plaza Mayor & Sol", tip: "Good for atmosphere; don’t eat in the main square—walk 2 streets out for better value." },
      { title: "Gran Vía evening walk", tip: "Do it after dinner; the lights and energy are peak Madrid." },
      { title: "Mercado de San Miguel", tip: "Touristy but fun; treat it as a snack stop, not your main meal." },
      { title: "Malasaña neighbourhood", tip: "Best for bars; start earlier than you think if it’s a big match night." },
      { title: "Santiago Bernabéu area stroll", tip: "Arrive early to soak it in; metro stations get crowded close to kickoff." },
      { title: "Temple of Debod (sunset)", tip: "Get there 30–40 minutes before sunset for a spot; great views." },
      { title: "Day trip to Toledo (if time)", tip: "Worth it if you have a full free day; buy train tickets ahead." },
    ],
    tips: [
      "Madrid runs late: dinner at 9–10pm is normal; plan your day around that.",
      "If it’s hot, do museums in the afternoon and parks/streets in the evening.",
      "Metro is easy; keep cash/card handy for quick snacks but most places take card.",
      "Avoid stadium metro at the last second—aim to arrive 60–75 minutes before kickoff.",
      "If you’re picking one ‘proper’ meal, book a table—walk-ins can be painful on weekends.",
    ],
    transport:
      "Metro is fast and reliable. For stadium travel, build in time for platform crowding near kickoff. Walking is excellent in central areas, but heat can slow you down.",
    accommodation:
      "Stay central (Sol/Gran Vía/Chueca) for walkability and nightlife. If you want quieter, look near Retiro or Salamanca with good metro access.",
  },

  rome: {
    cityId: "rome",
    name: "Rome",
    country: "Italy",
    overview:
      "Rome is a history overload: you’ll burn time just walking past ancient landmarks. Keep your schedule realistic, pre-book the big-ticket sights, and treat match day as one of your anchors rather than an add-on.",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187791-Activities-Rome_Lazio.html",
    topThings: [
      { title: "Colosseum + Roman Forum", tip: "Book timed entry weeks ahead; do it early to avoid the heat and crowds." },
      { title: "Vatican Museums + Sistine Chapel", tip: "Start at opening; if you arrive late, you’ll spend half the visit in queues." },
      { title: "St Peter’s Basilica", tip: "Dress code matters; climb the dome if you want the best view." },
      { title: "Pantheon", tip: "Quick win; go early morning for a calmer experience." },
      { title: "Trevi Fountain", tip: "Visit at dawn or late night; daytime is shoulder-to-shoulder." },
      { title: "Spanish Steps", tip: "Combine with a wander through the surrounding streets rather than a standalone stop." },
      { title: "Trastevere evening", tip: "Perfect for dinner; book a table and avoid the obvious tourist traps." },
      { title: "Piazza Navona", tip: "Nice at night; keep moving—don’t overpay for mediocre food in the square." },
      { title: "Castel Sant’Angelo", tip: "Great rooftop views; pair it with a riverside walk." },
      { title: "Appian Way (if time)", tip: "Rent a bike or go guided; it’s a quieter Rome that most visitors miss." },
    ],
    tips: [
      "Pre-book: Colosseum and Vatican can waste half your day if you don’t.",
      "Rome rewards early starts; do major sights before lunch, then slow down.",
      "On match day, plan transport ahead—some areas get congested and taxis can be a mess.",
      "Don’t try to ‘see everything’; pick 3 anchor sights and let walking fill the gaps.",
      "Carry a refillable bottle; there are public water fountains (nasoni).",
    ],
    transport:
      "Metro coverage is limited but useful. Buses fill in gaps but can be slow. Walking is the real Rome experience—wear comfortable shoes.",
    accommodation:
      "For first-timers, stay central (Centro Storico / near Pantheon) if budget allows. Otherwise look at Trastevere or Prati for strong vibes and access.",
  },

  berlin: {
    cityId: "berlin",
    name: "Berlin",
    country: "Germany",
    overview:
      "Berlin is big, spread out, and built around neighbourhoods. It’s excellent for football weekends because transit is strong and the city’s cultural options are endless. Plan by districts and you’ll waste less time crossing town.",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187323-Activities-Berlin.html",
    topThings: [
      { title: "Brandenburg Gate + Pariser Platz", tip: "Do it early or after dark; mid-day is a crowd farm." },
      { title: "Reichstag Dome", tip: "Book the free slot online; sunset slots go first." },
      { title: "Berlin Wall Memorial (Bernauer Straße)", tip: "More impactful than the touristy fragments; give it proper time." },
      { title: "East Side Gallery", tip: "Go in the morning; it’s best before the influencers arrive." },
      { title: "Museum Island", tip: "Pick one museum; don’t try to speed-run all of them." },
      { title: "Checkpoint Charlie area", tip: "See it quickly then move on; the best history is nearby, not at the spot itself." },
      { title: "Prenzlauer Berg cafés", tip: "Great breakfast area; arrive before 10:30 for shorter waits." },
      { title: "Kreuzberg food scene", tip: "Ideal for pre-match eating; you’ll find better value than central tourist zones." },
      { title: "Tempelhofer Feld", tip: "A huge open space—perfect if you want a reset day." },
      { title: "Spree riverside evening", tip: "Pick a bar near the water; Berlin nights start later than you expect." },
    ],
    tips: [
      "Use the BVG app and expect zone tickets; validate if required and keep proof.",
      "Berlin is spread out—choose 2–3 districts per day rather than ping-ponging across town.",
      "Food is strong and varied; don’t default to tourist centre restaurants.",
      "Match transport is usually easy, but leave buffer time for U/S-Bahn disruptions.",
      "If you’re out late, plan the return route before you go out—night services vary.",
    ],
    transport:
      "U-Bahn + S-Bahn cover the city well. Trams are great in the east. Buy the correct zone ticket and keep it handy for inspectors.",
    accommodation:
      "For convenience, stay central (Mitte) or near strong transport links. For nightlife, look at Friedrichshain/Kreuzberg, but expect more noise.",
  },

  paris: {
    cityId: "paris",
    name: "Paris",
    country: "France",
    overview:
      "Paris is iconic but can be intense: queues, prices, and crowds. The secret is pacing—one major landmark, one neighbourhood wander, and one ‘proper’ meal per day. Then anchor the match as your main event.",
    tripAdvisorTopThingsUrl: "https://www.tripadvisor.com/Attractions-g187147-Activities-Paris_Ile_de_France.html",
    topThings: [
      { title: "Eiffel Tower area", tip: "Book ahead if you’re going up; otherwise enjoy the Champ de Mars and views from Trocadéro." },
      { title: "Louvre Museum", tip: "Go with a plan: 2–3 hours max and target specific wings." },
      { title: "Seine river walk (Île de la Cité)", tip: "Evening strolls are best; it’s calmer and more ‘Paris’." },
      { title: "Notre-Dame area", tip: "Even with restoration, the area is worth it—pair it with a Left Bank wander." },
      { title: "Montmartre + Sacré-Cœur", tip: "Morning is calmer; watch for pickpockets in the busiest pockets." },
      { title: "Musée d’Orsay", tip: "A strong alternative to the Louvre; usually more enjoyable per hour." },
      { title: "Le Marais", tip: "Great for food and shopping; ideal before heading to the stadium." },
      { title: "Arc de Triomphe + Champs-Élysées", tip: "Do the Arc view, then walk away from the Champs for better dining." },
      { title: "Luxembourg Gardens", tip: "Perfect midday break; grab a coffee and slow down." },
      { title: "Canal Saint-Martin", tip: "Great local vibe; go late afternoon into evening for a relaxed night." },
    ],
    tips: [
      "Book major attractions ahead; Paris queues can destroy a day.",
      "Metro is fast; keep belongings close in busy stations and tourist hotspots.",
      "Eat away from landmark zones for better quality and prices.",
      "If you’re going to PSG or a big match, arrive early—security + crowds take time.",
      "A simple neighbourhood plan beats a long checklist; Paris rewards wandering.",
    ],
    transport:
      "Metro is the backbone. Use contactless/metro cards depending on your setup, and keep an eye on last trains if you’re staying out late.",
    accommodation:
      "For walkability, stay central (1st–6th) if budget allows. For value, look at well-connected areas on metro lines rather than chasing ‘close to everything’.",
  },
};

export default cityGuides;
