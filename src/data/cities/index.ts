// src/data/cities/index.ts

export interface City {
  /**
   * Unique id (can match slug for simplicity)
   */
  id: string;

  /**
   * Display name
   */
  name: string;

  /**
   * URL-safe key used in routes (this is what your CityScreen calls cityKey)
   * Example: "paris"
   */
  slug: string;

  /**
   * Country display name (e.g. "France")
   */
  country: string;

  /**
   * ISO-2 country code (e.g. "FR") used for flags
   */
  countryCode: string;

  /**
   * Teams (optional; can be used later for discovery/browse)
   */
  teams: string[];

  /**
   * Hero/cover image URL (optional)
   */
  image?: string;

  /**
   * Optional: venue ids to make fixture filtering precise when API venue.city varies.
   * These are API-Football venue ids.
   */
  venueIds?: number[];

  /**
   * Optional small subtitle/tagline for hero.
   */
  subtitle?: string;
}

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function normalizeCityKey(input: string) {
  return safeStr(input)
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Starter city registry.
 * IMPORTANT: This is the single source of truth for:
 * - country flag (countryCode)
 * - country label (country)
 * - optional venueIds (higher fixture match accuracy)
 *
 * NOTE:
 * This list is aligned to the teams you screenshotted (your in-app tables),
 * not to “real world” 25/26 rosters. If your API source changes, we can switch
 * to deriving cities dynamically from team data instead of hardcoding.
 */
export const cities: City[] = [
  // ---------------------------
  // FRANCE — Ligue 1 (from your screenshot list)
  // ---------------------------
  {
    id: "paris",
    name: "Paris",
    slug: "paris",
    country: "France",
    countryCode: "FR",
    teams: ["Paris Saint-Germain", "Paris FC"],
    subtitle: "Iconic city-break capital with world-class football and endless culture.",
  },
  { id: "lens", name: "Lens", slug: "lens", country: "France", countryCode: "FR", teams: ["Lens"] },
  { id: "lyon", name: "Lyon", slug: "lyon", country: "France", countryCode: "FR", teams: ["Lyon"] },
  { id: "marseille", name: "Marseille", slug: "marseille", country: "France", countryCode: "FR", teams: ["Marseille"] },
  { id: "lille", name: "Lille", slug: "lille", country: "France", countryCode: "FR", teams: ["Lille"] },
  { id: "rennes", name: "Rennes", slug: "rennes", country: "France", countryCode: "FR", teams: ["Rennes"] },
  { id: "strasbourg", name: "Strasbourg", slug: "strasbourg", country: "France", countryCode: "FR", teams: ["Strasbourg"] },
  { id: "toulouse", name: "Toulouse", slug: "toulouse", country: "France", countryCode: "FR", teams: ["Toulouse"] },
  { id: "lorient", name: "Lorient", slug: "lorient", country: "France", countryCode: "FR", teams: ["Lorient"] },
  { id: "brest", name: "Brest", slug: "brest", country: "France", countryCode: "FR", teams: ["Brest"] },
  { id: "angers", name: "Angers", slug: "angers", country: "France", countryCode: "FR", teams: ["Angers"] },
  { id: "lehavre", name: "Le Havre", slug: "le-havre", country: "France", countryCode: "FR", teams: ["Le Havre"] },
  { id: "nice", name: "Nice", slug: "nice", country: "France", countryCode: "FR", teams: ["Nice"] },
  { id: "auxerre", name: "Auxerre", slug: "auxerre", country: "France", countryCode: "FR", teams: ["Auxerre"] },
  { id: "nantes", name: "Nantes", slug: "nantes", country: "France", countryCode: "FR", teams: ["Nantes"] },
  { id: "metz", name: "Metz", slug: "metz", country: "France", countryCode: "FR", teams: ["Metz"] },
  {
    id: "monaco",
    name: "Monaco",
    slug: "monaco",
    country: "Monaco",
    countryCode: "MC",
    teams: ["AS Monaco"],
  },

  // ---------------------------
  // ENGLAND — Premier League (from your screenshot list)
  // ---------------------------
  {
    id: "london",
    name: "London",
    slug: "london",
    country: "United Kingdom",
    countryCode: "GB",
    teams: ["Arsenal", "Chelsea", "Tottenham Hotspur", "West Ham United"],
  },
  { id: "manchester", name: "Manchester", slug: "manchester", country: "United Kingdom", countryCode: "GB", teams: ["Manchester City", "Manchester United"] },
  { id: "liverpool", name: "Liverpool", slug: "liverpool", country: "United Kingdom", countryCode: "GB", teams: ["Liverpool", "Everton"] },
  { id: "birmingham", name: "Birmingham", slug: "birmingham", country: "United Kingdom", countryCode: "GB", teams: ["Aston Villa"] },
  { id: "newcastle", name: "Newcastle", slug: "newcastle", country: "United Kingdom", countryCode: "GB", teams: ["Newcastle United"] },
  { id: "brighton", name: "Brighton", slug: "brighton", country: "United Kingdom", countryCode: "GB", teams: ["Brighton"] },
  { id: "brentford", name: "Brentford", slug: "brentford", country: "United Kingdom", countryCode: "GB", teams: ["Brentford"] },
  { id: "bournemouth", name: "Bournemouth", slug: "bournemouth", country: "United Kingdom", countryCode: "GB", teams: ["AFC Bournemouth"] },
  { id: "fulham", name: "Fulham", slug: "fulham", country: "United Kingdom", countryCode: "GB", teams: ["Fulham"] },
  { id: "nottingham", name: "Nottingham", slug: "nottingham", country: "United Kingdom", countryCode: "GB", teams: ["Nottingham Forest"] },
  { id: "sunderland", name: "Sunderland", slug: "sunderland", country: "United Kingdom", countryCode: "GB", teams: ["Sunderland"] },
  { id: "leeds", name: "Leeds", slug: "leeds", country: "United Kingdom", countryCode: "GB", teams: ["Leeds United"] },
  { id: "burnley", name: "Burnley", slug: "burnley", country: "United Kingdom", countryCode: "GB", teams: ["Burnley"] },
  { id: "wolverhampton", name: "Wolverhampton", slug: "wolverhampton", country: "United Kingdom", countryCode: "GB", teams: ["Wolves"] },
  { id: "crystal-palace", name: "London (South)", slug: "crystal-palace", country: "United Kingdom", countryCode: "GB", teams: ["Crystal Palace"] },

  // ---------------------------
  // SPAIN — LaLiga (from your screenshot list)
  // ---------------------------
  {
    id: "barcelona",
    name: "Barcelona",
    slug: "barcelona",
    country: "Spain",
    countryCode: "ES",
    teams: ["Barcelona", "Espanyol"],
  },
  { id: "madrid", name: "Madrid", slug: "madrid", country: "Spain", countryCode: "ES", teams: ["Real Madrid", "Atletico Madrid", "Rayo Vallecano", "Getafe"] },
  { id: "villarreal", name: "Villarreal", slug: "villarreal", country: "Spain", countryCode: "ES", teams: ["Villarreal"] },
  { id: "seville", name: "Seville", slug: "seville", country: "Spain", countryCode: "ES", teams: ["Sevilla", "Real Betis"] },
  { id: "vigo", name: "Vigo", slug: "vigo", country: "Spain", countryCode: "ES", teams: ["Celta Vigo"] },
  { id: "bilbao", name: "Bilbao", slug: "bilbao", country: "Spain", countryCode: "ES", teams: ["Athletic Club"] },
  { id: "pamplona", name: "Pamplona", slug: "pamplona", country: "Spain", countryCode: "ES", teams: ["Osasuna"] },
  { id: "san-sebastian", name: "San Sebastián", slug: "san-sebastian", country: "Spain", countryCode: "ES", teams: ["Real Sociedad"] },
  { id: "girona", name: "Girona", slug: "girona", country: "Spain", countryCode: "ES", teams: ["Girona"] },
  { id: "vitoria-gasteiz", name: "Vitoria-Gasteiz", slug: "vitoria-gasteiz", country: "Spain", countryCode: "ES", teams: ["Deportivo Alaves"] },
  { id: "valencia", name: "Valencia", slug: "valencia", country: "Spain", countryCode: "ES", teams: ["Valencia", "Levante"] },
  { id: "elche", name: "Elche", slug: "elche", country: "Spain", countryCode: "ES", teams: ["Elche"] },
  { id: "palma", name: "Palma", slug: "palma", country: "Spain", countryCode: "ES", teams: ["Mallorca"] },
  { id: "oviedo", name: "Oviedo", slug: "oviedo", country: "Spain", countryCode: "ES", teams: ["Real Oviedo"] },

  // ---------------------------
  // ITALY — Serie A (from your screenshot list)
  // ---------------------------
  { id: "milan", name: "Milan", slug: "milan", country: "Italy", countryCode: "IT", teams: ["Inter", "AC Milan"] },
  { id: "naples", name: "Naples", slug: "naples", country: "Italy", countryCode: "IT", teams: ["Napoli"] },
  { id: "rome", name: "Rome", slug: "rome", country: "Italy", countryCode: "IT", teams: ["AS Roma", "Lazio"] },
  { id: "turin", name: "Turin", slug: "turin", country: "Italy", countryCode: "IT", teams: ["Juventus", "Torino"] },
  { id: "como", name: "Como", slug: "como", country: "Italy", countryCode: "IT", teams: ["Como 1907"] },
  { id: "bergamo", name: "Bergamo", slug: "bergamo", country: "Italy", countryCode: "IT", teams: ["Atalanta"] },
  { id: "bologna", name: "Bologna", slug: "bologna", country: "Italy", countryCode: "IT", teams: ["Bologna"] },
  { id: "sassuolo", name: "Sassuolo", slug: "sassuolo", country: "Italy", countryCode: "IT", teams: ["Sassuolo"] },
  { id: "udine", name: "Udine", slug: "udine", country: "Italy", countryCode: "IT", teams: ["Udinese"] },
  { id: "parma", name: "Parma", slug: "parma", country: "Italy", countryCode: "IT", teams: ["Parma"] },
  { id: "cagliari", name: "Cagliari", slug: "cagliari", country: "Italy", countryCode: "IT", teams: ["Cagliari"] },
  { id: "genoa", name: "Genoa", slug: "genoa", country: "Italy", countryCode: "IT", teams: ["Genoa"] },
  { id: "florence", name: "Florence", slug: "florence", country: "Italy", countryCode: "IT", teams: ["Fiorentina"] },
  { id: "cremona", name: "Cremona", slug: "cremona", country: "Italy", countryCode: "IT", teams: ["Cremonese"] },
  { id: "lecce", name: "Lecce", slug: "lecce", country: "Italy", countryCode: "IT", teams: ["Lecce"] },
  { id: "pisa", name: "Pisa", slug: "pisa", country: "Italy", countryCode: "IT", teams: ["Pisa"] },
  { id: "verona", name: "Verona", slug: "verona", country: "Italy", countryCode: "IT", teams: ["Hellas Verona"] },

  // ---------------------------
  // GERMANY — Bundesliga (from your screenshot list)
  // ---------------------------
  { id: "munich", name: "Munich", slug: "munich", country: "Germany", countryCode: "DE", teams: ["Bayern Munich"] },
  { id: "dortmund", name: "Dortmund", slug: "dortmund", country: "Germany", countryCode: "DE", teams: ["Borussia Dortmund"] },
  { id: "sinsheim", name: "Sinsheim", slug: "sinsheim", country: "Germany", countryCode: "DE", teams: ["Hoffenheim"] },
  { id: "stuttgart", name: "Stuttgart", slug: "stuttgart", country: "Germany", countryCode: "DE", teams: ["VfB Stuttgart"] },
  { id: "leipzig", name: "Leipzig", slug: "leipzig", country: "Germany", countryCode: "DE", teams: ["RB Leipzig"] },
  { id: "leverkusen", name: "Leverkusen", slug: "leverkusen", country: "Germany", countryCode: "DE", teams: ["Bayer Leverkusen"] },
  { id: "freiburg", name: "Freiburg", slug: "freiburg", country: "Germany", countryCode: "DE", teams: ["Freiburg"] },
  { id: "frankfurt", name: "Frankfurt", slug: "frankfurt", country: "Germany", countryCode: "DE", teams: ["Eintracht Frankfurt"] },
  { id: "berlin", name: "Berlin", slug: "berlin", country: "Germany", countryCode: "DE", teams: ["Union Berlin"] },
  { id: "augsburg", name: "Augsburg", slug: "augsburg", country: "Germany", countryCode: "DE", teams: ["Augsburg"] },
  { id: "hamburg", name: "Hamburg", slug: "hamburg", country: "Germany", countryCode: "DE", teams: ["Hamburger SV", "St. Pauli"] },
  { id: "cologne", name: "Cologne", slug: "cologne", country: "Germany", countryCode: "DE", teams: ["FC Cologne"] },
  { id: "mainz", name: "Mainz", slug: "mainz", country: "Germany", countryCode: "DE", teams: ["Mainz 05"] },
  { id: "monchengladbach", name: "Mönchengladbach", slug: "monchengladbach", country: "Germany", countryCode: "DE", teams: ["Borussia M'gladbach"] },
  { id: "wolfsburg", name: "Wolfsburg", slug: "wolfsburg", country: "Germany", countryCode: "DE", teams: ["Wolfsburg"] },
  { id: "bremen", name: "Bremen", slug: "bremen", country: "Germany", countryCode: "DE", teams: ["Werder Bremen"] },
  { id: "heidenheim", name: "Heidenheim", slug: "heidenheim", country: "Germany", countryCode: "DE", teams: ["FC Heidenheim"] },
];

/**
 * Lookup helpers used by screens.
 * Your CityScreen tries getCity() or getCityByKey().
 */
export function getCityByKey(cityInput: string): City | null {
  const key = normalizeCityKey(cityInput);
  if (!key) return null;

  // 1) Exact slug match
  const direct = cities.find((c) => normalizeCityKey(c.slug) === key);
  if (direct) return direct;

  // 2) Exact name match
  const byName = cities.find((c) => normalizeCityKey(c.name) === key);
  if (byName) return byName;

  // 3) Team match (lets you resolve city from club name if needed)
  const byTeam = cities.find((c) => (c.teams ?? []).some((t) => normalizeCityKey(t) === key));
  return byTeam ?? null;
}

export function getCity(cityInput: string): City | null {
  return getCityByKey(cityInput);
}

export default cities;
