// src/constants/search.ts

/**
 * Centralised search configuration + aliases.
 *
 * Goal (V1):
 * - Users can type countries (e.g. "Austria") and still discover the league ("Austrian Bundesliga").
 * - Users can type common abbreviations and aliases ("EPL", "Prem", "PL", "LaLiga", etc.).
 * - We keep noise low with a small stopword set and simple token normalisation.
 *
 * This file is intentionally small and deterministic: no runtime dependencies.
 */

export type SearchAliasMap = Record<string, string[]>;

/**
 * Very small stopword list to reduce junk matches.
 * Keep it conservative: removing too much harms recall.
 */
export const SEARCH_STOPWORDS = new Set<string>([
  "fc",
  "cf",
  "afc",
  "cfc",
  "sc",
  "ac",
  "the",
  "and",
  "&",
  "club",
  "team",
  "stadium",
  "arena",
  "ground",
  "city",
  "town",
  "united",
]);

/**
 * Country -> league discovery helper terms.
 * If a user types one of these, we treat it as a strong hint for the related league/country bucket.
 */
export const COUNTRY_ALIASES: SearchAliasMap = {
  england: ["uk", "u.k", "united-kingdom", "great-britain", "britain"],
  scotland: ["sco"],
  wales: ["cymru"],
  ireland: ["eire", "republic-of-ireland", "roi"],

  germany: ["deutschland", "ger"],
  france: ["fra", "république-française", "republique-francaise"],
  spain: ["espana", "españa", "esp"],
  italy: ["italia", "ita"],
  netherlands: ["holland", "nl"],
  portugal: ["prt"],

  austria: ["österreich", "osterreich", "aut"],
  switzerland: ["schweiz", "suisse", "svizzera", "che"],
  belgium: ["belgie", "belgië", "belgique", "bel"],
  turkey: ["türkiye", "turkiye", "tur"],
  greece: ["ellas", "ellada", "elláda", "ellada"],

  usa: ["united-states", "united-states-of-america", "america", "u.s", "u.s.a"],
};

/**
 * League label -> common aliases and abbreviations.
 * These are used to expand tokens so that "Austria" can still surface "Austrian Bundesliga",
 * and "EPL" can surface "Premier League", etc.
 *
 * IMPORTANT:
 * - Keys should roughly match your LEAGUES labels or the league display names you index.
 * - Values should be lowercase tokens/phrases (we normalise anyway; keep it clean).
 */
export const LEAGUE_ALIASES: SearchAliasMap = {
  "premier league": ["epl", "pl", "prem", "english premier league", "england premier league"],
  "la liga": ["laliga", "liga", "spanish league", "primera", "primera division", "primera división"],
  "serie a": ["seriea", "italian league", "italy league"],
  bundesliga: ["german league", "germany league", "bundes"],
  "ligue 1": ["ligue1", "french league", "france league"],

  // You will likely add these later in V1:
  // "eredivisie": ["dutch league", "netherlands league", "holland league"],
  // "primeira liga": ["portuguese league", "portugal league"],
  // "austrian bundesliga": ["austria league", "österreich league", "osterreich league", "aut league"],
};

/**
 * Country -> league name terms, for discovery when the country is typed.
 * This does NOT change fixtures filtering; it only helps search.
 *
 * Example:
 * - query: "austria"
 * - we expand to include: ["austrian", "bundesliga", "austrian bundesliga"]
 */
export const COUNTRY_TO_LEAGUE_HINTS: Record<string, string[]> = {
  austria: ["austrian", "bundesliga", "austrian bundesliga"],
  germany: ["bundesliga"],
  england: ["premier league", "epl"],
  spain: ["la liga", "laliga"],
  italy: ["serie a", "seriea"],
  france: ["ligue 1", "ligue1"],
};

/**
 * Normalise text for search (shared logic with searchIndex service).
 * - lowercases
 * - strips diacritics if possible
 * - keeps letters/numbers/spaces/hyphens
 */
export function normalizeSearchText(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  let s = raw;
  try {
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    // ignore
  }

  return s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenise a query into meaningful tokens.
 * - removes stopwords
 * - splits on whitespace and hyphens
 */
export function tokenizeQuery(input: string): string[] {
  const norm = normalizeSearchText(input);
  if (!norm) return [];

  const rawTokens = norm
    .split(/\s+/g)
    .flatMap((t) => t.split("-"))
    .map((t) => t.trim())
    .filter(Boolean);

  const tokens = rawTokens.filter((t) => !SEARCH_STOPWORDS.has(t));
  return tokens;
}

/**
 * Expand tokens using aliases.
 * - If user types "epl" we add "premier" and "league" etc via phrases.
 * - If user types "austria" we add hints for "austrian bundesliga".
 */
export function expandQueryTokens(tokens: string[]): string[] {
  const out = new Set<string>(tokens);

  const addPhrase = (phrase: string) => {
    tokenizeQuery(phrase).forEach((t) => out.add(t));
  };

  // Country aliases
  for (const t of tokens) {
    for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
      if (t === country || aliases.includes(t)) {
        out.add(country);
        (COUNTRY_TO_LEAGUE_HINTS[country] ?? []).forEach(addPhrase);
      }
    }
  }

  // League aliases
  const joined = tokens.join(" ");
  for (const [leagueName, aliases] of Object.entries(LEAGUE_ALIASES)) {
    if (joined === leagueName || aliases.some((a) => joined.includes(a) || tokens.includes(a))) {
      addPhrase(leagueName);
      aliases.forEach(addPhrase);
    }
  }

  return Array.from(out);
}
