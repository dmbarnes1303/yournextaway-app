// src/data/cityGuides/index.ts
import { CityGuide } from "./types";

function taTopThingsSearch(city: string, country?: string) {
  const q = country ? `${city} ${country} things to do` : `${city} things to do`;
  return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(q)}`;
}

export const cityGuides: Record<string, CityGuide> = {
  london: {
    cityId: "london",
    name: "London",
    country: "England",
    overview:
      "London is a world-class football city with nonstop transport, big-match atmosphere, and endless pre/post-game options. Expect crowds, premium prices in the centre, and incredible variety if you plan areas properly.",
    tripAdvisorTopThingsUrl: taTopThingsSearch("London", "England"),
    topThings: [
      { title: "Westminster & Parliament", tip: "Go early for photos; combine with a Thames walk." },
      { title: "Tower of London", tip: "Book ahead; allow 2–3 hours if you like history." },
      { title: "Tower Bridge", tip: "Best views at golden hour; walk to Borough Market after." },
      { title: "British Museum", tip: "Free; arrive near opening to avoid queues." },
      { title: "National Gallery", tip: "Pair with Trafalgar Square and a quick Chinatown meal." },
      { title: "Camden Market", tip: "Great for casual food; weekends are packed." },
      { title: "Borough Market", tip: "Go hungry; weekdays are calmer than Saturday." },
      { title: "South Bank (London Eye area)", tip: "Ideal for a flexible evening walk and drinks." },
      { title: "Hyde Park", tip: "Good reset if you’re doing multiple days and lots of walking." },
      { title: "A stadium tour (if time allows)", tip: "Do it the day before the match to avoid time pressure." },
    ],
    tips: [
      "Matchday transport: use contactless/Oyster; avoid last-minute Uber around grounds.",
      "If you’re doing two matches, plan by areas: North London, West, East, etc. Don’t zig-zag.",
      "Pubs: know the home/away split—some places will refuse away colours on derby days.",
      "Accommodation: stay near a Tube line, not necessarily the stadium.",
      "Budget reality: central London is expensive—eat in markets/local spots to keep it sane.",
    ],
    attractions: ["Museums, river walks, markets, royal landmarks, theatre"],
    food: ["Borough Market, Soho/Chinatown, Indian in Southall, curry houses across the city"],
    transport: "Tube + buses are king. Use contactless, and build in extra time on matchday.",
    accommodation:
      "Prioritise a safe, well-connected neighbourhood near a Tube line (Zone 2/3 often best value).",
  },

  madrid: {
    cityId: "madrid",
    name: "Madrid",
    country: "Spain",
    overview:
      "Madrid delivers big-club football and a city centre designed for walking, food, and late nights. It’s easy to do museums, tapas, and a match without logistical pain if you stay central.",
    tripAdvisorTopThingsUrl: taTopThingsSearch("Madrid", "Spain"),
    topThings: [
      { title: "Prado Museum", tip: "Book a timed ticket; go weekday mornings if possible." },
      { title: "Retiro Park", tip: "Perfect daytime reset; rowboats + snacks nearby." },
      { title: "Royal Palace", tip: "Arrive early; combine with Almudena Cathedral." },
      { title: "Plaza Mayor", tip: "Touristy, but worth a quick stop + photos." },
      { title: "Puerta del Sol & Gran Vía", tip: "Best for an evening wander and shopping." },
      { title: "Mercado de San Miguel", tip: "Great variety; go off-peak to avoid crowds." },
      { title: "Malasaña", tip: "Good nightlife area; lots of casual bars." },
      { title: "La Latina", tip: "Tapas crawl zone; especially lively on weekends." },
      { title: "Santiago Bernabéu / Metropolitano area", tip: "Arrive early on matchday; security/queues vary." },
      { title: "Day trip option (Toledo)", tip: "If you’ve got a spare day, it’s a high-value add." },
    ],
    tips: [
      "Dinner is late; don’t plan a big meal at 6pm and expect places to be open.",
      "If you’re doing a museum + match, do the museum early and keep the afternoon light.",
      "Metro is straightforward; build a buffer for matchday crowd control.",
      "Tapas strategy: 3–5 small stops beats one big sit-down if you want atmosphere.",
      "Stadium tours are best on non-match days—less chaos, more time inside.",
    ],
    transport: "Metro + walking. Central Madrid is very walkable.",
    accommodation:
      "Stay central (Sol/Gran Vía/Retiro edges) for simple logistics; prioritise noise control if you’re near nightlife.",
  },

  rome: {
    cityId: "rome",
    name: "Rome",
    country: "Italy",
    overview:
      "Rome is history first, football second—but when it hits, it hits. Plan around walking and crowds, and treat matchday as one anchor point inside a packed sightseeing itinerary.",
    tripAdvisorTopThingsUrl: taTopThingsSearch("Rome", "Italy"),
    topThings: [
      { title: "Colosseum & Forum", tip: "Timed entry is essential; do it early." },
      { title: "Trevi Fountain", tip: "Visit late evening to avoid the worst crowds." },
      { title: "Pantheon", tip: "Quick win—high impact, low time." },
      { title: "Vatican Museums", tip: "Book ahead; it’s a half-day commitment." },
      { title: "St Peter’s Basilica", tip: "Go early; dress code applies." },
      { title: "Piazza Navona", tip: "Good for a coffee stop and people-watching." },
      { title: "Trastevere", tip: "Best evening neighbourhood for food and vibe." },
      { title: "Spanish Steps", tip: "Short stop; combine with a walking loop." },
      { title: "Villa Borghese", tip: "Ideal if you need greenery + less intensity." },
      { title: "Matchday around Olimpico", tip: "Arrive early; transport can be slow with crowds." },
    ],
    tips: [
      "Rome is walking-heavy: footwear matters if you’re stacking attractions + a match.",
      "Don’t over-pack the matchday morning; leave time for transit and queues.",
      "Trastevere is your safe bet for a good night out without overthinking it.",
      "Vatican day + match day back-to-back is a fatigue trap—split them if possible.",
      "Keep valuables tight in tourist hotspots and busy transport areas.",
    ],
    transport: "Walking + metro/bus. Expect some friction; build buffer time.",
    accommodation:
      "Pick a central base (Pantheon/Termini edges/Trastevere depending on vibe) and accept some walking.",
  },

  berlin: {
    cityId: "berlin",
    name: "Berlin",
    country: "Germany",
    overview:
      "Berlin is big, spread out, and excellent for football weekends if you understand neighbourhoods. Transit is strong, nightlife is top-tier, and there’s loads to do beyond the match.",
    tripAdvisorTopThingsUrl: taTopThingsSearch("Berlin", "Germany"),
    topThings: [
      { title: "Brandenburg Gate", tip: "Quick landmark stop; best paired with Tiergarten." },
      { title: "Reichstag Dome", tip: "Reserve in advance; great views." },
      { title: "East Side Gallery", tip: "Best in daylight; combine with riverside walk." },
      { title: "Museum Island", tip: "Pick 1–2 museums; don’t try to brute-force all." },
      { title: "Checkpoint Charlie area", tip: "Touristy but historically meaningful—keep it brief." },
      { title: "Topography of Terror", tip: "High-impact museum; allow time to absorb it." },
      { title: "Alexanderplatz TV Tower", tip: "Good skyline views if weather is clear." },
      { title: "Kreuzberg", tip: "Food + bars; great for a night out." },
      { title: "Prenzlauer Berg", tip: "Chill cafes and a calmer vibe." },
      { title: "Olympiastadion / stadium area", tip: "Arrive early; it’s a proper ‘event’ journey." },
    ],
    tips: [
      "Berlin is not a ‘one-centre’ city—plan by neighbourhood to avoid time waste.",
      "Public transport is reliable; learn U/S-Bahn routes for matchday.",
      "Nightlife runs late; don’t schedule early-morning heavy sightseeing after a big night.",
      "If you’re doing history museums, pace them—Berlin can get emotionally heavy fast.",
      "Cashless is common, but keep a backup card/cash for small places.",
    ],
    transport: "U-Bahn + S-Bahn + walking. Very efficient once you learn the lines.",
    accommodation:
      "Stay central-ish with good rail links (Mitte/Kreuzberg/Prenzlauer Berg depending on style).",
  },

  paris: {
    cityId: "paris",
    name: "Paris",
    country: "France",
    overview:
      "Paris is built for a football city-break: iconic sights, strong transit, and endless food options. Matchday logistics are easy if you stay on a metro line and avoid overcommitting your itinerary.",
    tripAdvisorTopThingsUrl: taTopThingsSearch("Paris", "France"),
    topThings: [
      { title: "Eiffel Tower", tip: "Book tickets or go very early; evenings are stunning." },
      { title: "Louvre", tip: "Choose highlights; it’s too big to ‘do properly’ in one go." },
      { title: "Musée d’Orsay", tip: "Excellent if you prefer impressionists to the Louvre chaos." },
      { title: "Notre-Dame area", tip: "Great walking loop even if parts are under restoration." },
      { title: "Montmartre & Sacré-Cœur", tip: "Go early or late; daytime crowds are intense." },
      { title: "Seine river walk / cruise", tip: "Low-effort, high payoff." },
      { title: "Champs-Élysées", tip: "Touristy; do a quick pass, don’t burn half a day." },
      { title: "Le Marais", tip: "Food, boutiques, and a good vibe." },
      { title: "Latin Quarter", tip: "Classic Paris atmosphere; easy evening plan." },
      { title: "Matchday to Parc des Princes / Stade de France", tip: "Arrive early; security lines can vary." },
    ],
    tips: [
      "Metro is efficient; pick accommodation near a line, not near a landmark.",
      "Avoid the ‘do everything’ trap—Paris itineraries collapse if you over-stack.",
      "Museum strategy: one major museum per day maximum if you want to enjoy it.",
      "Matchday: build buffer for security and the post-match transport surge.",
      "Food: you don’t need tourist ‘top lists’—good places exist everywhere if you avoid the obvious traps.",
    ],
    transport: "Metro + walking. Keep a simple plan and you’ll move fast.",
    accommodation:
      "Stay in a well-connected arrondissement; optimise for metro access and price rather than ‘icon proximity’.",
  },
};

export default cityGuides;
