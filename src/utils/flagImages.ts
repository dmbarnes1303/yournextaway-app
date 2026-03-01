// src/utils/flagImages.ts

/**
 * Flag images by code/name.
 *
 * Inputs supported:
 * - ISO-3166-1 alpha-2: "ES", "DE", "IT"
 * - ISO-3166-1 alpha-3 / common variants: "DEU", "GER", "GBR", "FRA", etc
 * - Common UK shortcut: "UK" => "GB"
 * - UK home nations:
 *   - "ENG" => England (St George’s Cross)
 *   - "SCT" => Scotland
 *   - "WLS" => Wales
 *   - "NIR" => Northern Ireland
 * - Country names (best-effort): "Germany", "France", "United Kingdom"
 *
 * Uses FlagCDN PNGs.
 */

const DEFAULT_SIZE = 40;

// FlagCDN supports many sizes, but to avoid random values we "snap" to sensible widths.
const SNAP_SIZES = [20, 40, 80, 160] as const;

function normalize(input: any): string {
  return String(input ?? "").trim();
}

function normalizeUpper(input: any): string {
  return normalize(input).toUpperCase();
}

function snapSize(size?: number): number {
  const s = typeof size === "number" && Number.isFinite(size) ? size : DEFAULT_SIZE;
  // Choose nearest snap size (not just defaulting)
  let best = SNAP_SIZES[0];
  let bestDist = Math.abs(s - best);
  for (const x of SNAP_SIZES) {
    const d = Math.abs(s - x);
    if (d < bestDist) {
      best = x;
      bestDist = d;
    }
  }
  return best;
}

function sizeToken(size?: number): string {
  return `w${snapSize(size)}`;
}

/**
 * UK home nations → FlagCDN subdivision codes
 */
const SPECIAL_TO_FLAGCDN_CODE: Record<string, string> = {
  ENG: "gb-eng",
  SCT: "gb-sct",
  WLS: "gb-wls",
  NIR: "gb-nir",
};

/**
 * Common ISO3/variant → ISO2
 */
const ISO3_TO_ISO2: Record<string, string> = {
  FRA: "FR",
  ESP: "ES",
  DEU: "DE",
  GER: "DE",
  ITA: "IT",
  PRT: "PT",
  NLD: "NL",
  BEL: "BE",
  AUT: "AT",
  CHE: "CH",
  TUR: "TR",
  GRC: "GR",
  POL: "PL",
  CZE: "CZ",
  DNK: "DK",
  SWE: "SE",
  NOR: "NO",
  FIN: "FI",
  IRL: "IE",
  HUN: "HU",
  ROU: "RO",
  HRV: "HR",
  SRB: "RS",
  SVK: "SK",
  SVN: "SI",
  BGR: "BG",
  GBR: "GB",
  ENG: "GB", // fallback if someone passes ENG but wants "GB" country flag
  SCO: "GB",
  WAL: "GB",
  NIR: "GB",
  UK: "GB",
};

/**
 * Common country names → ISO2 (best-effort)
 */
const NAME_TO_ISO2: Record<string, string> = {
  FRANCE: "FR",
  SPAIN: "ES",
  GERMANY: "DE",
  ITALY: "IT",
  PORTUGAL: "PT",
  NETHERLANDS: "NL",
  BELGIUM: "BE",
  AUSTRIA: "AT",
  SWITZERLAND: "CH",
  TURKEY: "TR",
  GREECE: "GR",
  POLAND: "PL",
  CZECHIA: "CZ",
  "CZECH REPUBLIC": "CZ",
  DENMARK: "DK",
  SWEDEN: "SE",
  NORWAY: "NO",
  FINLAND: "FI",
  IRELAND: "IE",
  HUNGARY: "HU",
  ROMANIA: "RO",
  CROATIA: "HR",
  SERBIA: "RS",
  SLOVAKIA: "SK",
  SLOVENIA: "SI",
  BULGARIA: "BG",
  ENGLAND: "GB",
  SCOTLAND: "GB",
  WALES: "GB",
  "NORTHERN IRELAND": "GB",
  "UNITED KINGDOM": "GB",
  BRITAIN: "GB",
  "GREAT BRITAIN": "GB",
  UK: "GB",
};

function toIso2(input?: any): string | null {
  const raw = normalizeUpper(input);
  if (!raw) return null;

  // UK home nations special flags
  if (SPECIAL_TO_FLAGCDN_CODE[raw]) return raw; // keep as special marker

  // ISO2 already
  if (/^[A-Z]{2}$/.test(raw)) return raw;

  // ISO3 / variant
  if (ISO3_TO_ISO2[raw]) return ISO3_TO_ISO2[raw];

  // name
  if (NAME_TO_ISO2[raw]) return NAME_TO_ISO2[raw];

  return null;
}

export function getFlagImageUrl(codeOrName: string, opts?: { size?: number }): string | null {
  const token = sizeToken(opts?.size);

  const normalized = toIso2(codeOrName);
  if (!normalized) return null;

  // Special UK home nations
  const special = SPECIAL_TO_FLAGCDN_CODE[normalized];
  if (special) {
    return `https://flagcdn.com/${token}/${special}.png`;
  }

  // ISO2
  return `https://flagcdn.com/${token}/${normalized.toLowerCase()}.png`;
}
