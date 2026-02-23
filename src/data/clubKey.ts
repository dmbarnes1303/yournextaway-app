// src/data/clubKey.ts

/**
 * Normalize user/team/club strings to a stable key.
 * - lowercases
 * - strips diacritics
 * - converts "&" to "and"
 * - strips punctuation
 * - collapses to hyphens
 *
 * Then applies pragmatic aliases for real-world API variance.
 *
 * IMPORTANT:
 * - Canonical keys must match your data registries (ticketGuides, matchdayLogistics, etc).
 */
export function normalizeClubKey(input: string): string {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "";

  // Pragmatic aliases (fixes real-world inputs + API name variance)
  // NOTE: values MUST be your canonical keys used inside league files.
  const alias: Record<string, string> = {
    /* ------------------------------ Premier League ------------------------------ */
    "man utd": "manchester-united",
    "man united": "manchester-united",
    "manchester utd": "manchester-united",
    "manchester utd.": "manchester-united",
    "manutd": "manchester-united",
    "man-utd": "manchester-united",

    "spurs": "tottenham-hotspur",
    "tottenham": "tottenham-hotspur",
    "tottenham hotspur": "tottenham-hotspur",

    "wolves": "wolverhampton-wanderers",
    "wolverhampton": "wolverhampton-wanderers",
    "wolverhampton wanderers": "wolverhampton-wanderers",

    "west ham": "west-ham-united",
    "west ham united": "west-ham-united",

    "newcastle": "newcastle-united",
    "newcastle united": "newcastle-united",

    "nottingham forest": "nottingham-forest",
    "nottm forest": "nottingham-forest",
    "nffc": "nottingham-forest",

    "bournemouth": "bournemouth",
    "afc bournemouth": "bournemouth",
    "afc-bournemouth": "bournemouth",

    "brighton": "brighton",
    "brighton and hove albion": "brighton",
    "brighton & hove albion": "brighton",

    "leeds": "leeds-united",
    "leeds utd": "leeds-united",
    "leeds united": "leeds-united",

    "man city": "manchester-city",
    "manchester city": "manchester-city",
    "mancity": "manchester-city",
    "man-city": "manchester-city",

    /* --------------------------------- La Liga --------------------------------- */
    "athletic": "athletic-club",
    "athletic bilbao": "athletic-club",
    "athletic club bilbao": "athletic-club",

    "atletico": "atletico-madrid",
    "atletico madrid": "atletico-madrid",
    "atlético madrid": "atletico-madrid",
    "atl madrid": "atletico-madrid",
    "atl. madrid": "atletico-madrid",

    // ⚠️ risky shorthand, keep only if you really want it:
    "real": "real-madrid",

    "real madrid": "real-madrid",
    "real-madrid cf": "real-madrid",
    "real madrid cf": "real-madrid",

    "barca": "barcelona",
    "fc barcelona": "barcelona",
    "barcelona fc": "barcelona",

    "betis": "real-betis",
    "real betis balompie": "real-betis",
    "real betis balompié": "real-betis",
    "real betis": "real-betis",

    "real sociedad": "real-sociedad",
    "r. sociedad": "real-sociedad",

    "rc celta": "celta-vigo",
    "celta": "celta-vigo",
    "celta vigo": "celta-vigo",
    "celta de vigo": "celta-vigo",

    "rayo": "rayo-vallecano",
    "rayo vallecano": "rayo-vallecano",
    "rayo vallecano de madrid": "rayo-vallecano",

    "deportivo alaves": "alaves",
    "deportivo alavés": "alaves",
    "alavés": "alaves",

    /* -------------------------------- Serie A ---------------------------------- */
    "juve": "juventus",
    "juventus fc": "juventus",

    "inter milan": "inter",
    "inter milano": "inter",
    "internazionale": "inter",
    "fc internazionale": "inter",
    "internazionale milano": "inter",

    "ac milan": "milan",
    "a.c. milan": "milan",
    "milan ac": "milan",

    "as roma": "roma",
    "a.s. roma": "roma",
    "roma fc": "roma",

    "ss lazio": "lazio",
    "s.s. lazio": "lazio",

    /* ------------------------------- Bundesliga -------------------------------- */
    "bayern munchen": "bayern-munich",
    "bayern münchen": "bayern-munich",
    "fc bayern": "bayern-munich",
    "fc bayern munchen": "bayern-munich",

    "borussia dortmund": "borussia-dortmund",
    "bvb": "borussia-dortmund",
    "bvb 09": "borussia-dortmund",

    "rb leipzig": "rb-leipzig",
    "rasenballsport leipzig": "rb-leipzig",

    "bayer 04 leverkusen": "bayer-leverkusen",
    "bayer leverkusen": "bayer-leverkusen",
    "leverkusen": "bayer-leverkusen",

    "eintracht": "eintracht-frankfurt",
    "eintracht frankfurt": "eintracht-frankfurt",

    "vfb stuttgart": "vfb-stuttgart",
    "vfb stuttgart 1893": "vfb-stuttgart",

    "borussia monchengladbach": "borussia-monchengladbach",
    "borussia mönchengladbach": "borussia-monchengladbach",
    "mgladbach": "borussia-monchengladbach",
    "mönchengladbach": "borussia-monchengladbach",
    "borussia m'gladbach": "borussia-monchengladbach",

    "sc freiburg": "sc-freiburg",
    "freiburg": "sc-freiburg",

    "1. fc union berlin": "union-berlin",
    "1 fc union berlin": "union-berlin",
    "union berlin": "union-berlin",

    "werder": "werder-bremen",
    "werder bremen": "werder-bremen",

    "mainz": "mainz-05",
    "mainz 05": "mainz-05",
    "1. fsv mainz 05": "mainz-05",
    "1 fsv mainz 05": "mainz-05",

    "vfl wolfsburg": "wolfsburg",
    "wolfsburg": "wolfsburg",

    "hoffenheim": "tsg-hoffenheim",
    "tsg 1899 hoffenheim": "tsg-hoffenheim",
    "tsg hoffenheim": "tsg-hoffenheim",

    "1. fc koln": "fc-koln",
    "1 fc koln": "fc-koln",
    "1. fc köln": "fc-koln",
    "fc koln": "fc-koln",
    "fc köln": "fc-koln",
    "koln": "fc-koln",
    "köln": "fc-koln",

    "hamburg": "hamburger-sv",
    "hamburger sv": "hamburger-sv",
    "hsv": "hamburger-sv",

    "1. fc heidenheim": "fc-heidenheim",
    "1 fc heidenheim": "fc-heidenheim",
    "heidenheim": "fc-heidenheim",

    "st. pauli": "st-pauli",
    "st pauli": "st-pauli",
    "fc st pauli": "st-pauli",

    /* -------------------------------- Ligue 1 --------------------------------- */
    "psg": "paris-saint-germain",
    "paris sg": "paris-saint-germain",
    "paris saint germain": "paris-saint-germain",
    "paris-saint germain": "paris-saint-germain",
    "paris-saint-germain fc": "paris-saint-germain",

    "om": "marseille",
    "olympique de marseille": "marseille",
    "marseille": "marseille",

    "ol": "lyon",
    "olympique lyonnais": "lyon",
    "lyon": "lyon",

    "as monaco": "monaco",
    "monaco": "monaco",

    "ogc nice": "nice",
    "nice": "nice",

    "rc lens": "lens",
    "lens": "lens",

    "rc strasbourg": "strasbourg",
    "rc strasbourg alsace": "strasbourg",
    "strasbourg": "strasbourg",

    "paris fc": "paris-fc",
    "paris-fc": "paris-fc",
  };

  const directAlias = alias[raw];
  if (directAlias) return directAlias;

  const cleaned = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return alias[cleaned] ?? cleaned;
    }
