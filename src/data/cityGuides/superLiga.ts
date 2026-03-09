import type { CityGuide } from "./types";

const GYG = {
  bucharest: "https://www.getyourguide.com/en-gb/bucharest-l111/?partner_id=MAQJREP&utm_medium=online_publisher",
  clujNapoca: "https://www.getyourguide.com/en-gb/cluj-napoca-l325/?partner_id=MAQJREP&utm_medium=online_publisher",
  craiova: "https://www.getyourguide.com/en-gb/craiova-l1159/?partner_id=MAQJREP&utm_medium=online_publisher",
  sibiu: "https://www.getyourguide.com/en-gb/sibiu-l1430/?partner_id=MAQJREP&utm_medium=online_publisher",
  constanta: "https://www.getyourguide.com/en-gb/constanta-l1182/?partner_id=MAQJREP&utm_medium=online_publisher",
} as const;

export const superLigaCityGuides: Record<string, CityGuide> = {

  bucharest: {
    cityId: "bucharest",
    name: "Bucharest",
    country: "Romania",
    thingsToDoUrl: GYG.bucharest,
    overview:
      "Bucharest is the centre of Romanian football and easily the strongest base in the country for a football weekend. Multiple clubs, the country’s biggest stadiums, strong nightlife and a large café culture make it the easiest Romanian trip to build around a match.",
    topThings: [
      { title: "Old Town nightlife district", tip: "Best evening base before or after matches." },
      { title: "Palace of Parliament", tip: "One of the largest buildings in the world." },
      { title: "Herăstrău Park", tip: "Best daylight reset near the north of the city." },
      { title: "Victory Avenue walk", tip: "Historic boulevard with cafés and architecture." },
      { title: "Romanian Athenaeum", tip: "Beautiful landmark building." },
      { title: "Local beer halls", tip: "Good casual matchday atmosphere." },
      { title: "Central cafés", tip: "Bucharest has a strong café culture." },
      { title: "Arena Națională exterior approach", tip: "Arrive early for the scale." },
      { title: "Evening restaurants", tip: "Book ahead for big matches." },
      { title: "Night walk through central boulevards", tip: "City feels very different after dark." },
    ],
    tips: [
      "Old Town or Universitate are the best visitor bases.",
      "Metro is the fastest way to move across the city.",
      "Bucharest has multiple clubs so fixtures often overlap.",
      "Stay central rather than near stadium districts.",
      "Best football-weekend city in Romania."
    ],
    food: [
      "Romanian grills",
      "Central bistros",
      "Craft beer bars",
      "Late-night Old Town restaurants"
    ],
    transport:
      "Bucharest metro and trams cover most key areas. Central stays make stadium travel easier.",
    accommodation:
      "Old Town, Universitate or Victoriei are the strongest football-weekend bases."
  },

  "cluj-napoca": {
    cityId: "cluj-napoca",
    name: "Cluj-Napoca",
    country: "Romania",
    thingsToDoUrl: GYG.clujNapoca,
    overview:
      "Cluj-Napoca is Romania’s most polished second city and one of the easiest football trips in the country. Two top clubs, strong nightlife and a compact centre make it an excellent football-weekend destination.",
    topThings: [
      { title: "Union Square", tip: "The centre of the city’s life." },
      { title: "Central Park", tip: "Good walk before matches." },
      { title: "Cluj Arena surroundings", tip: "Modern sports district." },
      { title: "Old Town restaurants", tip: "Best food concentration." },
      { title: "Local wine bars", tip: "Strong evening options." },
      { title: "Matthias Corvinus statue", tip: "Historic city landmark." },
      { title: "Student nightlife areas", tip: "Cluj is a university city." },
      { title: "Pre-match cafés", tip: "Relaxed atmosphere." },
      { title: "Evening square walk", tip: "City looks best at night." },
      { title: "Weekend food markets", tip: "Good casual dining stops." },
    ],
    tips: [
      "One of Romania’s best football cities.",
      "Stay central for walkability.",
      "Good airport links from Europe.",
      "City centre works better than stadium districts.",
      "Ideal two-night football trip."
    ],
    food: [
      "Transylvanian cuisine",
      "Modern Romanian restaurants",
      "Wine bars",
      "Cafés"
    ],
    transport:
      "Central Cluj is highly walkable and taxis are inexpensive for stadium travel.",
    accommodation:
      "Old Town or Central Cluj are the best visitor bases."
  },

  craiova: {
    cityId: "craiova",
    name: "Craiova",
    country: "Romania",
    thingsToDoUrl: GYG.craiova,
    overview:
      "Craiova is a football-first Romanian trip centred around Universitatea Craiova and the impressive Ion Oblemenco stadium. The city itself is compact and manageable for a short football weekend.",
    topThings: [
      { title: "Ion Oblemenco Stadium exterior", tip: "One of Romania’s best modern stadiums." },
      { title: "Nicolae Romanescu Park", tip: "Large green park near the centre." },
      { title: "Craiova Old Town", tip: "Small but pleasant restaurant district." },
      { title: "Art Museum", tip: "Historic building worth seeing." },
      { title: "Central cafés", tip: "Relaxed pre-match stops." },
      { title: "Local restaurants", tip: "Traditional Romanian food." },
      { title: "University area", tip: "Lively student district." },
      { title: "Evening central walk", tip: "City centre looks best at night." },
      { title: "Matchday stadium approach", tip: "Arrive early." },
      { title: "Central square", tip: "City’s main gathering point." },
    ],
    tips: [
      "Craiova is about the football experience.",
      "Stay central rather than near the stadium.",
      "One-night football trip works well.",
      "Easy city to navigate.",
      "Modern stadium is the highlight."
    ],
  },

  sibiu: {
    cityId: "sibiu",
    name: "Sibiu",
    country: "Romania",
    thingsToDoUrl: GYG.sibiu,
    overview:
      "Sibiu is one of Romania’s most attractive cities and one of the best places to combine sightseeing with football. Hermannstadt’s modern stadium and the beautiful old town make it a strong weekend trip.",
    topThings: [
      { title: "Large Square", tip: "Historic centre of Sibiu." },
      { title: "Bridge of Lies", tip: "Iconic local landmark." },
      { title: "Old Town streets", tip: "Best explored slowly." },
      { title: "Council Tower views", tip: "Great panorama of the city." },
      { title: "Central cafés", tip: "Relaxed daytime rhythm." },
      { title: "Traditional restaurants", tip: "Strong Transylvanian cuisine." },
      { title: "Old Town evening walk", tip: "City atmosphere is excellent." },
      { title: "Pre-match dinner", tip: "Book early on weekends." },
      { title: "Local wine bars", tip: "Good late-night stops." },
      { title: "Morning coffee in the square", tip: "Perfect calm start to the day." },
    ],
    tips: [
      "One of Romania’s best city-break destinations.",
      "Stay in the Old Town.",
      "Great combination of football and tourism.",
      "Walkable city centre.",
      "Two nights recommended."
    ],
  },

  constanta: {
    cityId: "constanta",
    name: "Constanța",
    country: "Romania",
    thingsToDoUrl: GYG.constanta,
    overview:
      "Constanța brings Black Sea coast energy to Romanian football travel. Farul matches combine well with a seaside weekend, especially in warmer months.",
    topThings: [
      { title: "Constanța Casino", tip: "Iconic seafront landmark." },
      { title: "Black Sea waterfront", tip: "Best coastal walk." },
      { title: "Old Town square", tip: "Historic centre area." },
      { title: "Beach promenade", tip: "Relaxed daytime walk." },
      { title: "Seafood restaurants", tip: "Best local dining option." },
      { title: "Harbour district", tip: "Working port atmosphere." },
      { title: "Pre-match seaside drink", tip: "Unique football build-up." },
      { title: "Mamaia resort area", tip: "Lively nightlife." },
      { title: "Morning beach walk", tip: "Calm start to the day." },
      { title: "Local fish markets", tip: "Good casual food stops." },
    ],
    tips: [
      "Best Romanian football + seaside trip.",
      "Summer months offer the best atmosphere.",
      "Stay near the coast.",
      "Combine match with beach time.",
      "Relaxed football weekend."
    ],
  },

};

export default superLigaCityGuides;
