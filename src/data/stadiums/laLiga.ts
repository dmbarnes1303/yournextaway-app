import type { StadiumRecord } from "./types";

export const laLigaStadiums: Record<string, StadiumRecord> = {
  "san-mames": {
    stadiumKey: "san-mames",
    name: "San Mamés",
    city: "Bilbao",
    country: "Spain",
    capacity: 53332,
    opened: 2013,
    teamKeys: ["athletic-club"],
    airport: "Bilbao Airport (BIO)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "San Mamés", minutes: 3 },
      { label: "Bilbao Abando", minutes: 20, note: "best rail and city-centre hub" },
    ],
    stayAreas: [
      { area: "Abando", why: "Best all-round Bilbao base for food, transport and central access" },
      { area: "Casco Viejo", why: "Best atmosphere, bars and old-town feel" },
    ],
    tips: [
      "One of the best football-city trips in Spain thanks to atmosphere and city quality",
      "Stay central Bilbao rather than near the stadium area itself",
    ],
  },

  "metropolitano": {
    stadiumKey: "metropolitano",
    name: "Metropolitano",
    city: "Madrid",
    country: "Spain",
    capacity: 70460,
    opened: 2017,
    teamKeys: ["atletico-madrid"],
    airport: "Madrid Barajas (MAD)",
    distanceFromAirportKm: 8,
    transit: [
      { label: "Estadio Metropolitano", minutes: 5 },
      { label: "Nuevos Ministerios", minutes: 30, note: "best wider Madrid connection hub" },
    ],
    stayAreas: [
      { area: "Sol / Gran Vía", why: "Best central Madrid base for a full city trip" },
      { area: "Salamanca", why: "Best polished stay with good city access" },
    ],
    tips: [
      "Very easy for airport-linked arrivals because the stadium is on the east side of Madrid",
      "Central Madrid is still the smarter base unless you are doing a very short in-and-out trip",
    ],
  },

  "camp-nou": {
    stadiumKey: "camp-nou",
    name: "Camp Nou",
    city: "Barcelona",
    country: "Spain",
    capacity: 99354,
    opened: 1957,
    teamKeys: ["barcelona"],
    airport: "Barcelona El Prat (BCN)",
    distanceFromAirportKm: 13,
    transit: [
      { label: "Collblanc", minutes: 10 },
      { label: "Sants Estació", minutes: 20, note: "best rail and practical city hub" },
    ],
    stayAreas: [
      { area: "Eixample", why: "Best all-round Barcelona base" },
      { area: "Plaça Espanya / Sants", why: "Best practical option for rail and stadium access" },
    ],
    tips: [
      "One of Europe’s biggest football draws, so matchday areas get very busy",
      "Eixample is usually the best base rather than staying around the stadium itself",
    ],
  },

  "balaidos": {
    stadiumKey: "balaidos",
    name: "Estadio de Balaídos",
    city: "Vigo",
    country: "Spain",
    capacity: 29000,
    opened: 1928,
    teamKeys: ["celta-vigo"],
    airport: "Vigo Airport (VGO)",
    distanceFromAirportKm: 11,
    transit: [
      { label: "Vigo Urzáiz", minutes: 25 },
      { label: "Praza de España / central Vigo", minutes: 20, note: "best city starting point" },
    ],
    stayAreas: [
      { area: "Casco Vello", why: "Best local atmosphere and food" },
      { area: "Around Vigo Urzáiz", why: "Best practical base for rail and movement" },
    ],
    tips: [
      "Good option if you want a more local-feel Spanish football weekend",
      "Stay central Vigo, not by the ground",
    ],
  },

  "mendizorrotza": {
    stadiumKey: "mendizorrotza",
    name: "Mendizorrotza",
    city: "Vitoria-Gasteiz",
    country: "Spain",
    capacity: 19840,
    opened: 1924,
    teamKeys: ["deportivo-alaves"],
    airport: "Bilbao Airport (BIO)",
    distanceFromAirportKm: 75,
    transit: [
      { label: "Vitoria-Gasteiz Station", minutes: 20 },
      { label: "City centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Medieval Quarter / Centre", why: "Best visitor base with food and walkability" },
      { area: "Near station", why: "Best practical rail option" },
    ],
    tips: [
      "Compact, pleasant city and a cleaner football trip than many people expect",
      "Better as a simple one-night football stop than a long luxury weekend",
    ],
  },

  "martinez-valero": {
    stadiumKey: "martinez-valero",
    name: "Estadio Martínez Valero",
    city: "Elche",
    country: "Spain",
    capacity: 31388,
    opened: 1976,
    teamKeys: ["elche"],
    airport: "Alicante Airport (ALC)",
    distanceFromAirportKm: 14,
    transit: [
      { label: "Elche city centre", minutes: 20 },
      { label: "Elche-Parc", minutes: 25, note: "useful local rail point" },
    ],
    stayAreas: [
      { area: "Elche Centre", why: "Best local practical base" },
      { area: "Alicante", why: "Better city-break choice if combining coast and football" },
    ],
    tips: [
      "Works better as part of a wider Alicante / Costa Blanca trip than as a pure football weekend",
      "Good-weather fixture city rather than one of Spain’s elite football breaks",
    ],
  },

  "rcde-stadium": {
    stadiumKey: "rcde-stadium",
    name: "RCDE Stadium",
    city: "Barcelona",
    country: "Spain",
    capacity: 40500,
    opened: 2009,
    teamKeys: ["espanyol"],
    airport: "Barcelona El Prat (BCN)",
    distanceFromAirportKm: 8,
    transit: [
      { label: "Cornellà Centre", minutes: 15 },
      { label: "Barcelona Sants", minutes: 20, note: "best city rail hub" },
    ],
    stayAreas: [
      { area: "Eixample", why: "Best overall Barcelona base" },
      { area: "Sants / Plaça Espanya", why: "Best practical choice for stadium and airport access" },
    ],
    tips: [
      "Very easy to combine with a wider Barcelona weekend",
      "Do not stay by the stadium unless convenience matters more than atmosphere",
    ],
  },

  "coliseum": {
    stadiumKey: "coliseum",
    name: "Coliseum Alfonso Pérez",
    city: "Getafe",
    country: "Spain",
    capacity: 17393,
    opened: 1998,
    teamKeys: ["getafe"],
    airport: "Madrid Barajas (MAD)",
    distanceFromAirportKm: 26,
    transit: [
      { label: "Getafe Central", minutes: 20 },
      { label: "Sol / Atocha", minutes: 30, note: "better wider Madrid base" },
    ],
    stayAreas: [
      { area: "Sol / Gran Vía", why: "Best overall Madrid base" },
      { area: "Atocha", why: "Best practical south-side Madrid option" },
    ],
    tips: [
      "This is a Madrid-trip fixture, not really a Getafe-city-break product",
      "Stay central Madrid and treat the ground as a short suburban outing",
    ],
  },

  "montilivi": {
    stadiumKey: "montilivi",
    name: "Estadi Montilivi",
    city: "Girona",
    country: "Spain",
    capacity: 14500,
    opened: 1970,
    teamKeys: ["girona"],
    airport: "Girona Costa Brava (GRO)",
    distanceFromAirportKm: 14,
    transit: [
      { label: "Girona Station", minutes: 25 },
      { label: "Old Town", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Barri Vell", why: "Best atmosphere and city-break feel" },
      { area: "Near Girona Station", why: "Best practical rail-based option" },
    ],
    tips: [
      "One of the nicest smaller football city breaks in Spain",
      "Excellent one if you want football plus historic-city atmosphere without big-city chaos",
    ],
  },

  "ciutat-de-valencia": {
    stadiumKey: "ciutat-de-valencia",
    name: "Estadi Ciutat de València",
    city: "Valencia",
    country: "Spain",
    capacity: 26354,
    opened: 1969,
    teamKeys: ["levante"],
    airport: "Valencia Airport (VLC)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "Beniferri / Machado", minutes: 10 },
      { label: "Valencia Nord", minutes: 25, note: "best wider city rail hub" },
    ],
    stayAreas: [
      { area: "Ciutat Vella", why: "Best classic Valencia base" },
      { area: "Ruzafa", why: "Best bars, restaurants and nightlife" },
    ],
    tips: [
      "Valencia is strong enough that even secondary-club trips can feel premium",
      "Ruzafa is often the best overall base for visitors",
    ],
  },

  "son-moix": {
    stadiumKey: "son-moix",
    name: "Son Moix",
    city: "Palma",
    country: "Spain",
    capacity: 23142,
    opened: 1999,
    teamKeys: ["mallorca"],
    airport: "Palma de Mallorca Airport (PMI)",
    distanceFromAirportKm: 11,
    transit: [
      { label: "Palma Centre", minutes: 20 },
      { label: "Plaça d'Espanya", minutes: 20, note: "best city transport point" },
    ],
    stayAreas: [
      { area: "Palma Old Town", why: "Best atmosphere and city-break quality" },
      { area: "Santa Catalina", why: "Best restaurants, bars and local nightlife" },
    ],
    tips: [
      "One of the best football-and-sun weekend combinations in Europe",
      "Stay in Palma, not around the ground",
    ],
  },

  "el-sadar": {
    stadiumKey: "el-sadar",
    name: "El Sadar",
    city: "Pamplona",
    country: "Spain",
    capacity: 23576,
    opened: 1967,
    teamKeys: ["osasuna"],
    airport: "Pamplona Airport (PNA)",
    distanceFromAirportKm: 7,
    transit: [
      { label: "Pamplona Centre", minutes: 20 },
      { label: "Bus station", minutes: 20, note: "best practical arrival point" },
    ],
    stayAreas: [
      { area: "Casco Antiguo", why: "Best food, bars and city atmosphere" },
      { area: "City Centre", why: "Best practical general base" },
    ],
    tips: [
      "Excellent football atmosphere and a more old-school match feel than many larger clubs",
      "Great for a compact one- or two-night football trip",
    ],
  },

  "campo-de-vallecas": {
    stadiumKey: "campo-de-vallecas",
    name: "Campo de Fútbol de Vallecas",
    city: "Madrid",
    country: "Spain",
    capacity: 14708,
    opened: 1976,
    teamKeys: ["rayo-vallecano"],
    airport: "Madrid Barajas (MAD)",
    distanceFromAirportKm: 20,
    transit: [
      { label: "Portazgo", minutes: 10 },
      { label: "Atocha", minutes: 20, note: "best central practical hub" },
    ],
    stayAreas: [
      { area: "Lavapiés / Atocha", why: "Best balance of character and convenience" },
      { area: "Sol / Gran Vía", why: "Best classic central Madrid base" },
    ],
    tips: [
      "Very different feel from the giant Madrid clubs and much more local in character",
      "Central Madrid remains the best stay base unless you specifically want a Vallecas neighbourhood feel",
    ],
  },

  "benito-villamarin": {
    stadiumKey: "benito-villamarin",
    name: "Estadio Benito Villamarín",
    city: "Seville",
    country: "Spain",
    capacity: 60721,
    opened: 1929,
    teamKeys: ["real-betis"],
    airport: "Seville Airport (SVQ)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "Prado de San Sebastián", minutes: 20 },
      { label: "Santa Justa", minutes: 25, note: "main rail hub" },
    ],
    stayAreas: [
      { area: "Santa Cruz", why: "Best classic Seville base" },
      { area: "El Arenal / Centro", why: "Best mix of atmosphere and transport" },
    ],
    tips: [
      "One of Spain’s best football-weekend cities because Seville adds so much off the pitch",
      "Stay central and let the stadium be a short taxi/bus trip",
    ],
  },

  "santiago-bernabeu": {
    stadiumKey: "santiago-bernabeu",
    name: "Santiago Bernabéu",
    city: "Madrid",
    country: "Spain",
    capacity: 81044,
    opened: 1947,
    teamKeys: ["real-madrid"],
    airport: "Madrid Barajas (MAD)",
    distanceFromAirportKm: 14,
    transit: [
      { label: "Santiago Bernabéu", minutes: 3 },
      { label: "Nuevos Ministerios", minutes: 10, note: "best wider city and airport link" },
    ],
    stayAreas: [
      { area: "Salamanca", why: "Best polished upscale Madrid base" },
      { area: "Sol / Gran Vía", why: "Best classic central city-break location" },
    ],
    tips: [
      "One of Europe’s flagship football trips and easy to pair with a full Madrid weekend",
      "Book central, not just near the stadium, unless you are doing a very short trip",
    ],
  },

  "carlos-tartiere": {
    stadiumKey: "carlos-tartiere",
    name: "Estadio Carlos Tartiere",
    city: "Oviedo",
    country: "Spain",
    capacity: 30500,
    opened: 2000,
    teamKeys: ["real-oviedo"],
    airport: "Asturias Airport (OVD)",
    distanceFromAirportKm: 47,
    transit: [
      { label: "Oviedo Station", minutes: 25 },
      { label: "Old Town / Centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Oviedo Centre", why: "Best practical and atmospheric local base" },
      { area: "Old Town", why: "Best for food, cider bars and city character" },
    ],
    tips: [
      "Very good northern Spain football trip if you want something less obvious than Madrid or Barcelona",
      "Best as a city-break-style overnight rather than a rushed day trip",
    ],
  },

  "reale-arena": {
    stadiumKey: "reale-arena",
    name: "Reale Arena",
    city: "San Sebastián",
    country: "Spain",
    capacity: 39500,
    opened: 1993,
    teamKeys: ["real-sociedad"],
    airport: "San Sebastián Airport (EAS)",
    distanceFromAirportKm: 22,
    transit: [
      { label: "Anoeta", minutes: 8 },
      { label: "Donostia-San Sebastián", minutes: 20, note: "best city rail hub" },
    ],
    stayAreas: [
      { area: "Parte Vieja", why: "Best food, bars and city atmosphere" },
      { area: "Centro / La Concha", why: "Best scenic premium stay" },
    ],
    tips: [
      "One of the best pure football-city-break trips in Europe thanks to the city quality",
      "Stay central and enjoy the city — the stadium itself is an easy local journey",
    ],
  },

  "ramon-sanchez-pizjuan": {
    stadiumKey: "ramon-sanchez-pizjuan",
    name: "Ramón Sánchez-Pizjuán",
    city: "Seville",
    country: "Spain",
    capacity: 43883,
    opened: 1958,
    teamKeys: ["sevilla"],
    airport: "Seville Airport (SVQ)",
    distanceFromAirportKm: 10,
    transit: [
      { label: "Nervión", minutes: 8 },
      { label: "Santa Justa", minutes: 15, note: "best rail hub and practical city access" },
    ],
    stayAreas: [
      { area: "Santa Cruz", why: "Best classic Seville stay" },
      { area: "Centro / Alameda", why: "Best bars and wider city-break feel" },
    ],
    tips: [
      "Strong atmosphere club in one of Spain’s best weekend cities",
      "Very easy to pair football with food, nightlife and sightseeing",
    ],
  },

  "mestalla": {
    stadiumKey: "mestalla",
    name: "Mestalla",
    city: "Valencia",
    country: "Spain",
    capacity: 49430,
    opened: 1923,
    teamKeys: ["valencia"],
    airport: "Valencia Airport (VLC)",
    distanceFromAirportKm: 11,
    transit: [
      { label: "Aragón", minutes: 5 },
      { label: "Valencia Nord", minutes: 20, note: "best wider rail hub" },
    ],
    stayAreas: [
      { area: "Ciutat Vella", why: "Best classic city-break base" },
      { area: "Ruzafa", why: "Best bars, food and nightlife" },
    ],
    tips: [
      "One of the most iconic traditional stadium trips in Spain",
      "Valencia is strong enough that this can feel like a premium football weekend with little effort",
    ],
  },

  "ceramica": {
    stadiumKey: "ceramica",
    name: "Estadio de la Cerámica",
    city: "Villarreal",
    country: "Spain",
    capacity: 23500,
    opened: 1923,
    teamKeys: ["villarreal"],
    airport: "Valencia Airport (VLC)",
    distanceFromAirportKm: 80,
    transit: [
      { label: "Villarreal Station", minutes: 20 },
      { label: "Castellón", minutes: 25, note: "better wider regional base" },
    ],
    stayAreas: [
      { area: "Villarreal Centre", why: "Simplest local option" },
      { area: "Valencia", why: "Best city-break base if combining football with a larger trip" },
    ],
    tips: [
      "Better handled as part of a wider regional trip than as a pure luxury weekend",
      "Useful football stop, but not on the same travel tier as Madrid, Barcelona, Valencia or Seville",
    ],
  },
};

export default laLigaStadiums;
