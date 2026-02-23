// src/constants/iataCityCodes.ts

/**
 * IATA CITY codes (not airport codes).
 *
 * Why city codes:
 * - "Any airport in city" behavior reduces wrong-airport friction
 * - Aviasales search URL accepts 3-letter IATA (city or airport). Prefer city.
 *
 * Reality:
 * - Many stadium towns/suburbs have NO IATA city code.
 * - This map covers common major destinations (Top 5 leagues) and key hubs.
 * - For smaller places, resolve via a "nearest major city" strategy (Phase 1/2).
 */

function norm(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\s+/g, " ")
    .replace(/[’']/g, ""); // normalize apostrophes
}

const CITY_TO_IATA_CITY: Record<string, string> = {
  /* -------------------------- UK / Ireland (EPL) -------------------------- */
  "london": "LON",
  "manchester": "MAN",
  "liverpool": "LPL",
  "birmingham": "BHM",
  "leeds": "LBA", // Leeds/Bradford area; no true "LDS" city code in common use
  "newcastle": "NCL",
  "sunderland": "NCL", // metro fallback; keep city-level behavior
  "sheffield": "DSA", // Doncaster/Sheffield area; pragmatic
  "nottingham": "NQT",
  "leicester": "LEI",
  "southampton": "SOU",
  "portsmouth": "SOU",
  "brighton": "LON", // no city code; metro fallback
  "wolverhampton": "BHM",
  "coventry": "BHM",
  "stoke on trent": "MAN",
  "stoke-on-trent": "MAN",
  "bristol": "BRS",
  "cardiff": "CWL",
  "swansea": "CWL",
  "glasgow": "GLA",
  "edinburgh": "EDI",
  "belfast": "BFS",
  "dublin": "DUB",

  /* ------------------------------- Spain --------------------------------- */
  "madrid": "MAD",
  "barcelona": "BCN",
  "valencia": "VLC",
  "sevilla": "SVQ",
  "seville": "SVQ",
  "bilbao": "BIO",
  "san sebastian": "EAS",
  "donostia": "EAS",
  "vitoria gasteiz": "VIT",
  "vitoria-gasteiz": "VIT",
  "zaragoza": "ZAZ",
  "vigo": "VGO",
  "a coruna": "LCG",
  "la coruna": "LCG",
  "coruna": "LCG",
  "oviedo": "OVD",
  "palma": "PMI",
  "palma de mallorca": "PMI",
  "las palmas": "LPA",
  "tenerife": "TCI", // Tenerife city code (multi-airport)
  "malaga": "AGP",
  "murcia": "RMU",
  "granada": "GRX",
  "alicante": "ALC",
  "pamplona": "PNA",
  "valladolid": "VLL",

  /* ------------------------------- France -------------------------------- */
  "paris": "PAR",
  "marseille": "MRS",
  "lyon": "LYS",
  "lille": "LIL",
  "nice": "NCE",
  "toulouse": "TLS",
  "bordeaux": "BOD",
  "nantes": "NTE",
  "rennes": "RNS",
  "montpellier": "MPL",
  "strasbourg": "SXB",
  "metz": "ETZ",
  "lens": "LIL", // metro fallback
  "reims": "RHE",
  "saint etienne": "EBU",
  "saint-etienne": "EBU",
  "brest": "BES",
  "clermont ferrand": "CFE",
  "clermont-ferrand": "CFE",
  "le havre": "LEH",
  "caen": "CFR", // practical regional fallback

  /* ------------------------------- Germany -------------------------------- */
  "berlin": "BER",
  "munich": "MUC",
  "muenchen": "MUC",
  "hamburg": "HAM",
  "frankfurt": "FRA",
  "dortmund": "DTM",
  "duesseldorf": "DUS",
  "dusseldorf": "DUS",
  "cologne": "CGN",
  "koln": "CGN",
  "stuttgart": "STR",
  "leipzig": "LEJ",
  "bremen": "BRE",
  "hanover": "HAJ",
  "hannover": "HAJ",
  "nuremberg": "NUE",
  "nuernberg": "NUE",
  "freiburg": "BSL", // Basel/Mulhouse hub; pragmatic
  "mainz": "FRA",
  "bochum": "DUS",
  "gelsenkirchen": "DUS",
  "monchengladbach": "DUS",
  "moenchengladbach": "DUS",
  "augsburg": "MUC",
  "wolfsburg": "HAJ",

  /* -------------------------------- Italy -------------------------------- */
  "rome": "ROM",
  "roma": "ROM",
  "milan": "MIL",
  "milano": "MIL",
  "turin": "TRN",
  "torino": "TRN",
  "naples": "NAP",
  "napoli": "NAP",
  "florence": "FLR",
  "firenze": "FLR",
  "bologna": "BLQ",
  "genoa": "GOA",
  "genova": "GOA",
  "venice": "VCE",
  "venezia": "VCE",
  "verona": "VRN",
  "bergamo": "MIL", // metro fallback
  "como": "MIL",
  "udine": "TRS", // Trieste region fallback
  "trieste": "TRS",
  "cagliari": "CAG",
  "palermo": "PMO",
  "catania": "CTA",
  "bari": "BRI",
  "salerno": "NAP",
  "parma": "BLQ",
  "pisa": "PSA",
  "lecce": "BDS",
  "reggio emilia": "BLQ",
  "reggio-emilia": "BLQ",

  /* ---------------------- Netherlands / Belgium (useful) ------------------ */
  "amsterdam": "AMS",
  "rotterdam": "RTM",
  "eindhoven": "EIN",
  "utrecht": "AMS",
  "the hague": "RTM",
  "den haag": "RTM",

  "brussels": "BRU",
  "antwerp": "ANR",
  "bruges": "OST",
  "gent": "OST",
  "liege": "LGG",

  /* ------------------------------ Portugal -------------------------------- */
  "lisbon": "LIS",
  "lisboa": "LIS",
  "porto": "OPO",
  "braga": "OPO",
  "guimaraes": "OPO",

  /* --------------------------- Austria / Switzerland ---------------------- */
  "vienna": "VIE",
  "wien": "VIE",
  "salzburg": "SZG",
  "zurich": "ZRH",
  "geneva": "GVA",
  "basel": "EAP",
  "bern": "BRN",

  /* --------------------------- Czech / Hungary / Poland ------------------- */
  "prague": "PRG",
  "praha": "PRG",
  "budapest": "BUD",
  "warsaw": "WAW",
  "krakow": "KRK",
  "wroclaw": "WRO",
  "gdansk": "GDN",

  /* ------------------------------ Nordics --------------------------------- */
  "copenhagen": "CPH",
  "stockholm": "STO",
  "oslo": "OSL",
  "helsinki": "HEL",

  /* ------------------------------ Greece/Turkey --------------------------- */
  "athens": "ATH",
  "istanbul": "IST",

  /* ------------------------------- Generic -------------------------------- */
  // Useful fallback city-codes some users will hit
  "barcelona ": "BCN", // defensive against odd spacing
};

export function toIataCityCode(city: string): string | null {
  const key = norm(city);
  if (!key) return null;

  // direct hit
  const direct = CITY_TO_IATA_CITY[key];
  if (direct) return direct;

  // try common punctuation variants
  const alt = key.replace(/-/g, " ");
  if (alt !== key && CITY_TO_IATA_CITY[alt]) return CITY_TO_IATA_CITY[alt];

  return null;
}

export function normalizeCityName(city: string): string {
  return norm(city);
}
