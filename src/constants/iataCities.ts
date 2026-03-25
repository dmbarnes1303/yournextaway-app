import * as rawIataCitiesModule from "@/src/data/iataCityCodes";

/**
 * Single source of truth for city -> IATA resolution.
 *
 * Rules:
 * - raw dataset remains the base
 * - football-specific overrides patch gaps and awkward stadium-city mappings
 * - accent/local-language aliases are supported
 * - import must never throw
 */

export type IataCity = {
  iata: string;
  city: string;
  country?: string;
  countryCode?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  aliases?: string[];
};

type FootballAirportOverride = {
  iata: string;
  city: string;
  country?: string;
  countryCode?: string;
  aliases: string[];
};

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

function normalizeText(v: unknown): string {
  return safeStr(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normKey(v: unknown): string {
  return normalizeText(v);
}

function toNumberOrUndef(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(new Set(values.map((x) => safeStr(x)).filter(Boolean)));
}

function isIataCode(v: unknown): boolean {
  return /^[A-Z]{3}$/.test(safeStr(v).toUpperCase());
}

function loadRawDataset(): unknown {
  try {
    const mod = rawIataCitiesModule as {
      default?: unknown;
      IATA_CITIES?: unknown;
      cities?: unknown;
    };

    return mod.default ?? mod.IATA_CITIES ?? mod.cities ?? mod;
  } catch {
    return null;
  }
}

export function normalizeIataCity(raw: unknown): IataCity | null {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    const iata = safeStr(raw[0]).toUpperCase();
    const city = safeStr(raw[1]);
    const country = safeStr(raw[2]);
    const countryCode = safeStr(raw[3]).toUpperCase();

    if (!isIataCode(iata) || !city) return null;

    return {
      iata,
      city,
      country: country || undefined,
      countryCode: countryCode || undefined,
    };
  }

  if (typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;

  const iata = safeStr(
    value.iata ?? value.code ?? value.IATA ?? value.airportCode
  ).toUpperCase();
  const city = safeStr(value.city ?? value.name ?? value.cityName);
  const country = safeStr(value.country ?? value.countryName);
  const countryCode = safeStr(
    value.countryCode ?? value.iso2 ?? value.iso
  ).toUpperCase();

  if (!isIataCode(iata) || !city) return null;

  const lat = toNumberOrUndef(value.lat ?? value.latitude);
  const lon = toNumberOrUndef(value.lon ?? value.lng ?? value.longitude);
  const timezone = safeStr(value.timezone);

  const aliases = Array.isArray(value.aliases)
    ? uniqueStrings(value.aliases)
    : undefined;

  return {
    iata,
    city,
    country: country || undefined,
    countryCode: countryCode || undefined,
    lat,
    lon,
    timezone: timezone || undefined,
    aliases,
  };
}

/**
 * Football-specific overrides.
 * These are pragmatic destination mappings for club/stadium travel.
 * Not every city here is a literal airport city; some are nearest viable hubs.
 */
const FOOTBALL_AIRPORT_OVERRIDES: FootballAirportOverride[] = [
  // England
  { iata: "LON", city: "London", country: "England", countryCode: "GB", aliases: ["london"] },
  { iata: "MAN", city: "Manchester", country: "England", countryCode: "GB", aliases: ["manchester"] },
  { iata: "LPL", city: "Liverpool", country: "England", countryCode: "GB", aliases: ["liverpool"] },
  { iata: "BHX", city: "Birmingham", country: "England", countryCode: "GB", aliases: ["birmingham", "aston", "aston villa", "west bromwich", "wolverhampton", "wolves"] },
  { iata: "NCL", city: "Newcastle upon Tyne", country: "England", countryCode: "GB", aliases: ["newcastle", "newcastle upon tyne", "sunderland"] },
  { iata: "LBA", city: "Leeds", country: "England", countryCode: "GB", aliases: ["leeds", "leeds bradford"] },
  { iata: "EMA", city: "Nottingham", country: "England", countryCode: "GB", aliases: ["nottingham", "nottingham forest", "derby"] },
  { iata: "EMA", city: "East Midlands", country: "England", countryCode: "GB", aliases: ["leicester"] },
  { iata: "BRS", city: "Bristol", country: "England", countryCode: "GB", aliases: ["bristol"] },
  { iata: "SOU", city: "Southampton", country: "England", countryCode: "GB", aliases: ["southampton", "portsmouth"] },
  { iata: "NWI", city: "Norwich", country: "England", countryCode: "GB", aliases: ["norwich"] },
  { iata: "BOH", city: "Bournemouth", country: "England", countryCode: "GB", aliases: ["bournemouth"] },
  { iata: "EXT", city: "Exeter", country: "England", countryCode: "GB", aliases: ["exeter", "plymouth"] },
  { iata: "JER", city: "Jersey", country: "Channel Islands", countryCode: "GB", aliases: ["jersey"] },

  // Scotland
  { iata: "GLA", city: "Glasgow", country: "Scotland", countryCode: "GB", aliases: ["glasgow", "celtic", "rangers"] },
  { iata: "EDI", city: "Edinburgh", country: "Scotland", countryCode: "GB", aliases: ["edinburgh", "hearts", "hibs", "hibernian"] },
  { iata: "ABZ", city: "Aberdeen", country: "Scotland", countryCode: "GB", aliases: ["aberdeen"] },
  { iata: "INV", city: "Inverness", country: "Scotland", countryCode: "GB", aliases: ["inverness"] },
  { iata: "DND", city: "Dundee", country: "Scotland", countryCode: "GB", aliases: ["dundee"] },

  // Wales
  { iata: "CWL", city: "Cardiff", country: "Wales", countryCode: "GB", aliases: ["cardiff"] },
  { iata: "CWL", city: "Cardiff", country: "Wales", countryCode: "GB", aliases: ["swansea"] },
  { iata: "LPL", city: "Liverpool", country: "England", countryCode: "GB", aliases: ["wrexham"] },
  { iata: "BRS", city: "Bristol", country: "England", countryCode: "GB", aliases: ["newport"] },

  // Northern Ireland
  { iata: "BFS", city: "Belfast", country: "Northern Ireland", countryCode: "GB", aliases: ["belfast", "linfield"] },

  // Spain
  { iata: "MAD", city: "Madrid", country: "Spain", countryCode: "ES", aliases: ["madrid"] },
  { iata: "BCN", city: "Barcelona", country: "Spain", countryCode: "ES", aliases: ["barcelona", "barca"] },
  { iata: "SVQ", city: "Seville", country: "Spain", countryCode: "ES", aliases: ["seville", "sevilla"] },
  { iata: "VLC", city: "Valencia", country: "Spain", countryCode: "ES", aliases: ["valencia"] },
  { iata: "BIO", city: "Bilbao", country: "Spain", countryCode: "ES", aliases: ["bilbao", "athletic bilbao", "athletic club"] },
  { iata: "EAS", city: "San Sebastian", country: "Spain", countryCode: "ES", aliases: ["san sebastian", "san sebastián", "donostia", "real sociedad"] },
  { iata: "AGP", city: "Malaga", country: "Spain", countryCode: "ES", aliases: ["malaga", "málaga"] },
  { iata: "ALC", city: "Alicante", country: "Spain", countryCode: "ES", aliases: ["alicante", "elche"] },
  { iata: "PMI", city: "Palma de Mallorca", country: "Spain", countryCode: "ES", aliases: ["palma", "mallorca", "palma de mallorca"] },
  { iata: "LPA", city: "Las Palmas", country: "Spain", countryCode: "ES", aliases: ["las palmas", "gran canaria"] },
  { iata: "TCI", city: "Tenerife", country: "Spain", countryCode: "ES", aliases: ["tenerife", "santa cruz de tenerife"] },
  { iata: "GRO", city: "Girona", country: "Spain", countryCode: "ES", aliases: ["girona"] },
  { iata: "VGO", city: "Vigo", country: "Spain", countryCode: "ES", aliases: ["vigo", "celta vigo"] },
  { iata: "SCQ", city: "Santiago de Compostela", country: "Spain", countryCode: "ES", aliases: ["santiago de compostela"] },
  { iata: "OVD", city: "Oviedo", country: "Spain", countryCode: "ES", aliases: ["oviedo", "gijon", "gijón", "sporting gijon", "sporting gijón"] },
  { iata: "ZAZ", city: "Zaragoza", country: "Spain", countryCode: "ES", aliases: ["zaragoza"] },
  { iata: "VIT", city: "Vitoria-Gasteiz", country: "Spain", countryCode: "ES", aliases: ["vitoria", "vitoria gasteiz", "alaves", "alavés"] },
  { iata: "RMU", city: "Murcia", country: "Spain", countryCode: "ES", aliases: ["murcia", "cartagena"] },
  { iata: "GRX", city: "Granada", country: "Spain", countryCode: "ES", aliases: ["granada"] },
  { iata: "XRY", city: "Jerez", country: "Spain", countryCode: "ES", aliases: ["jerez", "cadiz", "cádiz"] },
  { iata: "RGS", city: "Burgos", country: "Spain", countryCode: "ES", aliases: ["burgos"] },
  { iata: "PNA", city: "Pamplona", country: "Spain", countryCode: "ES", aliases: ["pamplona", "osasuna"] },
  { iata: "LEN", city: "Leon", country: "Spain", countryCode: "ES", aliases: ["leon", "león"] },
  { iata: "REU", city: "Reus", country: "Spain", countryCode: "ES", aliases: ["tarragona", "reus"] },

  // Italy
  { iata: "ROM", city: "Rome", country: "Italy", countryCode: "IT", aliases: ["rome", "roma"] },
  { iata: "MIL", city: "Milan", country: "Italy", countryCode: "IT", aliases: ["milan", "milano", "inter", "internazionale", "ac milan"] },
  { iata: "NAP", city: "Naples", country: "Italy", countryCode: "IT", aliases: ["naples", "napoli"] },
  { iata: "TRN", city: "Turin", country: "Italy", countryCode: "IT", aliases: ["turin", "torino", "juventus"] },
  { iata: "BLQ", city: "Bologna", country: "Italy", countryCode: "IT", aliases: ["bologna"] },
  { iata: "FLR", city: "Florence", country: "Italy", countryCode: "IT", aliases: ["florence", "firenze", "fiorentina"] },
  { iata: "PSA", city: "Pisa", country: "Italy", countryCode: "IT", aliases: ["pisa"] },
  { iata: "VRN", city: "Verona", country: "Italy", countryCode: "IT", aliases: ["verona", "hellas verona"] },
  { iata: "VCE", city: "Venice", country: "Italy", countryCode: "IT", aliases: ["venice", "venezia"] },
  { iata: "TRS", city: "Trieste", country: "Italy", countryCode: "IT", aliases: ["trieste", "udine", "udinese"] },
  { iata: "GOA", city: "Genoa", country: "Italy", countryCode: "IT", aliases: ["genoa", "genova", "sampdoria"] },
  { iata: "CAG", city: "Cagliari", country: "Italy", countryCode: "IT", aliases: ["cagliari"] },
  { iata: "PMO", city: "Palermo", country: "Italy", countryCode: "IT", aliases: ["palermo"] },
  { iata: "CTA", city: "Catania", country: "Italy", countryCode: "IT", aliases: ["catania"] },
  { iata: "BRI", city: "Bari", country: "Italy", countryCode: "IT", aliases: ["bari"] },
  { iata: "SUF", city: "Lamezia Terme", country: "Italy", countryCode: "IT", aliases: ["lamezia terme", "reggio calabria", "cosenza"] },

  // Germany
  { iata: "BER", city: "Berlin", country: "Germany", countryCode: "DE", aliases: ["berlin", "union berlin", "hertha berlin"] },
  { iata: "MUC", city: "Munich", country: "Germany", countryCode: "DE", aliases: ["munich", "munchen", "muenchen", "münchen", "bayern munich"] },
  { iata: "DTM", city: "Dortmund", country: "Germany", countryCode: "DE", aliases: ["dortmund"] },
  { iata: "DUS", city: "Dusseldorf", country: "Germany", countryCode: "DE", aliases: ["dusseldorf", "düsseldorf", "monchengladbach", "mönchengladbach", "gladbach", "leverkusen", "koln", "köln", "cologne", "schalke", "gelsenkirchen", "bochum"] },
  { iata: "FRA", city: "Frankfurt", country: "Germany", countryCode: "DE", aliases: ["frankfurt", "eintracht frankfurt", "mainz", "darmstadt", "kaiserslautern"] },
  { iata: "HAM", city: "Hamburg", country: "Germany", countryCode: "DE", aliases: ["hamburg", "st pauli", "st. pauli"] },
  { iata: "STR", city: "Stuttgart", country: "Germany", countryCode: "DE", aliases: ["stuttgart", "vfb stuttgart", "sinsheim", "hoffenheim", "heidenheim"] },
  { iata: "LEJ", city: "Leipzig", country: "Germany", countryCode: "DE", aliases: ["leipzig", "rb leipzig", "dresden", "halle"] },
  { iata: "HAJ", city: "Hannover", country: "Germany", countryCode: "DE", aliases: ["hannover", "wolfsburg", "braunschweig", "brunswick"] },
  { iata: "BRE", city: "Bremen", country: "Germany", countryCode: "DE", aliases: ["bremen"] },
  { iata: "NUE", city: "Nuremberg", country: "Germany", countryCode: "DE", aliases: ["nuremberg", "nurnberg", "nürnberg", "augsburg"] },
  { iata: "SCN", city: "Saarbrucken", country: "Germany", countryCode: "DE", aliases: ["saarbrucken", "saarbrücken"] },
  { iata: "FMO", city: "Munster", country: "Germany", countryCode: "DE", aliases: ["munster", "münster", "bielefeld", "paderborn", "osnabruck", "osnabrück"] },

  // France
  { iata: "PAR", city: "Paris", country: "France", countryCode: "FR", aliases: ["paris", "psg", "paris saint germain"] },
  { iata: "MRS", city: "Marseille", country: "France", countryCode: "FR", aliases: ["marseille"] },
  { iata: "LYS", city: "Lyon", country: "France", countryCode: "FR", aliases: ["lyon"] },
  { iata: "NCE", city: "Nice", country: "France", countryCode: "FR", aliases: ["nice", "monaco"] },
  { iata: "LIL", city: "Lille", country: "France", countryCode: "FR", aliases: ["lille", "lens"] },
  { iata: "TLS", city: "Toulouse", country: "France", countryCode: "FR", aliases: ["toulouse"] },
  { iata: "BOD", city: "Bordeaux", country: "France", countryCode: "FR", aliases: ["bordeaux"] },
  { iata: "NTE", city: "Nantes", country: "France", countryCode: "FR", aliases: ["nantes", "saint nazaire"] },
  { iata: "SXB", city: "Strasbourg", country: "France", countryCode: "FR", aliases: ["strasbourg", "metz"] },
  { iata: "MPL", city: "Montpellier", country: "France", countryCode: "FR", aliases: ["montpellier", "nimes", "nîmes"] },
  { iata: "RNS", city: "Rennes", country: "France", countryCode: "FR", aliases: ["rennes", "brest", "lorient"] },
  { iata: "BIQ", city: "Biarritz", country: "France", countryCode: "FR", aliases: ["biarritz", "bayonne"] },

  // Netherlands
  { iata: "AMS", city: "Amsterdam", country: "Netherlands", countryCode: "NL", aliases: ["amsterdam", "ajax"] },
  { iata: "EIN", city: "Eindhoven", country: "Netherlands", countryCode: "NL", aliases: ["eindhoven", "psv"] },
  { iata: "RTM", city: "Rotterdam", country: "Netherlands", countryCode: "NL", aliases: ["rotterdam", "feyenoord", "the hague", "den haag", "sparta rotterdam"] },
  { iata: "ENS", city: "Enschede", country: "Netherlands", countryCode: "NL", aliases: ["enschede", "twente"] },
  { iata: "MST", city: "Maastricht", country: "Netherlands", countryCode: "NL", aliases: ["maastricht", "sittard"] },
  { iata: "GRQ", city: "Groningen", country: "Netherlands", countryCode: "NL", aliases: ["groningen", "heerenveen"] },

  // Portugal
  { iata: "LIS", city: "Lisbon", country: "Portugal", countryCode: "PT", aliases: ["lisbon", "lisboa", "sporting", "benfica"] },
  { iata: "OPO", city: "Porto", country: "Portugal", countryCode: "PT", aliases: ["porto", "braga", "guimaraes", "guimarães", "boavista"] },
  { iata: "FAO", city: "Faro", country: "Portugal", countryCode: "PT", aliases: ["faro", "portimao", "portimão"] },
  { iata: "FNC", city: "Funchal", country: "Portugal", countryCode: "PT", aliases: ["funchal", "madeira"] },
  { iata: "PDL", city: "Ponta Delgada", country: "Portugal", countryCode: "PT", aliases: ["ponta delgada", "azores"] },

  // Belgium
  { iata: "BRU", city: "Brussels", country: "Belgium", countryCode: "BE", aliases: ["brussels", "bruxelles", "anderlecht"] },
  { iata: "ANR", city: "Antwerp", country: "Belgium", countryCode: "BE", aliases: ["antwerp", "antwerpen", "mechelen"] },
  { iata: "CRL", city: "Charleroi", country: "Belgium", countryCode: "BE", aliases: ["charleroi", "standard liege", "liège", "liege"] },
  { iata: "OST", city: "Ostend", country: "Belgium", countryCode: "BE", aliases: ["bruges", "brugge", "ghent", "gent", "ostend", "genk"] },

  // Turkey
  { iata: "IST", city: "Istanbul", country: "Turkey", countryCode: "TR", aliases: ["istanbul", "galatasaray", "fenerbahce", "fenerbahçe", "besiktas", "beşiktaş"] },
  { iata: "ESB", city: "Ankara", country: "Turkey", countryCode: "TR", aliases: ["ankara"] },
  { iata: "ADB", city: "Izmir", country: "Turkey", countryCode: "TR", aliases: ["izmir", "i̇zmir"] },
  { iata: "AYT", city: "Antalya", country: "Turkey", countryCode: "TR", aliases: ["antalya", "alanya"] },
  { iata: "TZX", city: "Trabzon", country: "Turkey", countryCode: "TR", aliases: ["trabzon"] },
  { iata: "ADA", city: "Adana", country: "Turkey", countryCode: "TR", aliases: ["adana", "mersin"] },
  { iata: "BJV", city: "Bodrum", country: "Turkey", countryCode: "TR", aliases: ["bodrum"] },
  { iata: "DLM", city: "Dalaman", country: "Turkey", countryCode: "TR", aliases: ["dalaman"] },
  { iata: "ASR", city: "Kayseri", country: "Turkey", countryCode: "TR", aliases: ["kayseri"] },
  { iata: "GZT", city: "Gaziantep", country: "Turkey", countryCode: "TR", aliases: ["gaziantep"] },

  // Austria
  { iata: "VIE", city: "Vienna", country: "Austria", countryCode: "AT", aliases: ["vienna", "wien", "rapid vienna", "austria vienna"] },
  { iata: "SZG", city: "Salzburg", country: "Austria", countryCode: "AT", aliases: ["salzburg"] },
  { iata: "LNZ", city: "Linz", country: "Austria", countryCode: "AT", aliases: ["linz"] },
  { iata: "GRZ", city: "Graz", country: "Austria", countryCode: "AT", aliases: ["graz", "hartberg"] },
  { iata: "INN", city: "Innsbruck", country: "Austria", countryCode: "AT", aliases: ["innsbruck", "tirol"] },
  { iata: "KLU", city: "Klagenfurt", country: "Austria", countryCode: "AT", aliases: ["klagenfurt", "wolfsberg"] },

  // Switzerland
  { iata: "ZRH", city: "Zurich", country: "Switzerland", countryCode: "CH", aliases: ["zurich", "zürich"] },
  { iata: "GVA", city: "Geneva", country: "Switzerland", countryCode: "CH", aliases: ["geneva", "genève", "lausanne"] },
  { iata: "BSL", city: "Basel", country: "Switzerland", countryCode: "CH", aliases: ["basel"] },
  { iata: "BRN", city: "Bern", country: "Switzerland", countryCode: "CH", aliases: ["bern", "berne", "young boys"] },

  // Greece
  { iata: "ATH", city: "Athens", country: "Greece", countryCode: "GR", aliases: ["athens", "olympiacos", "aek athens", "panathinaikos"] },
  { iata: "SKG", city: "Thessaloniki", country: "Greece", countryCode: "GR", aliases: ["thessaloniki", "paok", "aris"] },
  { iata: "HER", city: "Heraklion", country: "Greece", countryCode: "GR", aliases: ["heraklion", "crete"] },

  // Czech Republic
  { iata: "PRG", city: "Prague", country: "Czech Republic", countryCode: "CZ", aliases: ["prague", "praha", "sparta prague", "slavia prague"] },
  { iata: "BRQ", city: "Brno", country: "Czech Republic", countryCode: "CZ", aliases: ["brno"] },
  { iata: "OSR", city: "Ostrava", country: "Czech Republic", countryCode: "CZ", aliases: ["ostrava", "banik ostrava", "baník ostrava"] },

  // Poland
  { iata: "WAW", city: "Warsaw", country: "Poland", countryCode: "PL", aliases: ["warsaw", "warszawa", "legia warsaw"] },
  { iata: "KRK", city: "Krakow", country: "Poland", countryCode: "PL", aliases: ["krakow", "kraków", "cracow"] },
  { iata: "GDN", city: "Gdansk", country: "Poland", countryCode: "PL", aliases: ["gdansk", "gdańsk", "gdynia", "sopot"] },
  { iata: "KTW", city: "Katowice", country: "Poland", countryCode: "PL", aliases: ["katowice", "zabrze", "gliwice", "chorzow", "chorzów"] },
  { iata: "POZ", city: "Poznan", country: "Poland", countryCode: "PL", aliases: ["poznan", "poznań"] },
  { iata: "WRO", city: "Wroclaw", country: "Poland", countryCode: "PL", aliases: ["wroclaw", "wrocław"] },
  { iata: "SZZ", city: "Szczecin", country: "Poland", countryCode: "PL", aliases: ["szczecin"] },

  // Croatia
  { iata: "ZAG", city: "Zagreb", country: "Croatia", countryCode: "HR", aliases: ["zagreb", "dinamo zagreb"] },
  { iata: "SPU", city: "Split", country: "Croatia", countryCode: "HR", aliases: ["split", "hajduk split"] },
  { iata: "RJK", city: "Rijeka", country: "Croatia", countryCode: "HR", aliases: ["rijeka"] },
  { iata: "OSI", city: "Osijek", country: "Croatia", countryCode: "HR", aliases: ["osijek"] },

  // Serbia
  { iata: "BEG", city: "Belgrade", country: "Serbia", countryCode: "RS", aliases: ["belgrade", "beograd", "red star", "partizan"] },

  // Denmark
  { iata: "CPH", city: "Copenhagen", country: "Denmark", countryCode: "DK", aliases: ["copenhagen", "kobenhavn", "københavn"] },
  { iata: "BLL", city: "Billund", country: "Denmark", countryCode: "DK", aliases: ["billund", "vejle"] },
  { iata: "AAL", city: "Aalborg", country: "Denmark", countryCode: "DK", aliases: ["aalborg", "ålborg"] },

  // Sweden
  { iata: "STO", city: "Stockholm", country: "Sweden", countryCode: "SE", aliases: ["stockholm", "hammarby", "djurgarden", "djurgården", "aik"] },
  { iata: "GOT", city: "Gothenburg", country: "Sweden", countryCode: "SE", aliases: ["gothenburg", "goteborg", "göteborg"] },
  { iata: "MMX", city: "Malmo", country: "Sweden", countryCode: "SE", aliases: ["malmo", "malmö"] },

  // Norway
  { iata: "OSL", city: "Oslo", country: "Norway", countryCode: "NO", aliases: ["oslo"] },
  { iata: "BGO", city: "Bergen", country: "Norway", countryCode: "NO", aliases: ["bergen"] },
  { iata: "TRD", city: "Trondheim", country: "Norway", countryCode: "NO", aliases: ["trondheim"] },

  // Hungary
  { iata: "BUD", city: "Budapest", country: "Hungary", countryCode: "HU", aliases: ["budapest", "ferencvaros", "ferencváros"] },

  // Romania
  { iata: "BUH", city: "Bucharest", country: "Romania", countryCode: "RO", aliases: ["bucharest", "bucuresti", "bucurești", "steaua", "rapid bucharest"] },
  { iata: "CLJ", city: "Cluj-Napoca", country: "Romania", countryCode: "RO", aliases: ["cluj", "cluj napoca", "cluj-napoca"] },

  // Bulgaria
  { iata: "SOF", city: "Sofia", country: "Bulgaria", countryCode: "BG", aliases: ["sofia", "cska sofia", "levski sofia"] },
  { iata: "VAR", city: "Varna", country: "Bulgaria", countryCode: "BG", aliases: ["varna"] },

  // Ukraine
  { iata: "IEV", city: "Kyiv", country: "Ukraine", countryCode: "UA", aliases: ["kyiv", "kiev", "dynamo kyiv", "dynamo kiev"] },

  // Ireland
  { iata: "DUB", city: "Dublin", country: "Ireland", countryCode: "IE", aliases: ["dublin", "shamrock rovers", "bohemians"] },
  { iata: "ORK", city: "Cork", country: "Ireland", countryCode: "IE", aliases: ["cork"] },

  // Finland
  { iata: "HEL", city: "Helsinki", country: "Finland", countryCode: "FI", aliases: ["helsinki", "hjk"] },
  { iata: "TMP", city: "Tampere", country: "Finland", countryCode: "FI", aliases: ["tampere"] },
];

function buildOverrideCities(): IataCity[] {
  return FOOTBALL_AIRPORT_OVERRIDES
    .filter((row) => isIataCode(row.iata))
    .map((row) => ({
      iata: safeStr(row.iata).toUpperCase(),
      city: safeStr(row.city),
      country: safeStr(row.country) || undefined,
      countryCode: safeStr(row.countryCode).toUpperCase() || undefined,
      aliases: uniqueStrings([row.city, ...(Array.isArray(row.aliases) ? row.aliases : [])]),
    }));
}

function mergeBaseWithOverrides(base: IataCity[], overrides: IataCity[]): IataCity[] {
  const byIata = new Map<string, IataCity>();

  for (const city of base) {
    const key = normKey(city.iata);
    if (!key) continue;
    byIata.set(key, city);
  }

  for (const city of overrides) {
    const key = normKey(city.iata);
    if (!key) continue;

    const existing = byIata.get(key);
    if (!existing) {
      byIata.set(key, city);
      continue;
    }

    byIata.set(key, {
      ...existing,
      iata: city.iata || existing.iata,
      city: city.city || existing.city,
      country: city.country || existing.country,
      countryCode: city.countryCode || existing.countryCode,
      lat: city.lat ?? existing.lat,
      lon: city.lon ?? existing.lon,
      timezone: city.timezone ?? existing.timezone,
      aliases: uniqueStrings([
        ...(existing.aliases ?? []),
        ...(city.aliases ?? []),
        existing.city,
        city.city,
      ]),
    });
  }

  return Array.from(byIata.values());
}

export function buildIndex(listInput: unknown): {
  byCityKey: Record<string, IataCity>;
  byIata: Record<string, IataCity>;
  all: IataCity[];
} {
  const input = listInput as {
    default?: unknown;
    cities?: unknown;
  } | null;

  const rawList = Array.isArray(listInput)
    ? listInput
    : Array.isArray(input?.default)
      ? input.default
      : Array.isArray(input?.cities)
        ? input.cities
        : [];

  const baseAll: IataCity[] = [];

  for (const raw of rawList) {
    const city = normalizeIataCity(raw);
    if (city) baseAll.push(city);
  }

  const mergedAll = mergeBaseWithOverrides(baseAll, buildOverrideCities());

  const byCityKey: Record<string, IataCity> = {};
  const byIata: Record<string, IataCity> = {};

  for (const city of mergedAll) {
    const iataKey = normKey(city.iata);
    if (iataKey && !byIata[iataKey]) {
      byIata[iataKey] = city;
    }

    const cityKeyBase = normKey(city.city);
    const cc = normKey(city.countryCode);
    const cityKey = cc ? `${cityKeyBase}-${cc}` : cityKeyBase;

    if (cityKey && !byCityKey[cityKey]) {
      byCityKey[cityKey] = city;
    }

    if (cityKeyBase && !byCityKey[cityKeyBase]) {
      byCityKey[cityKeyBase] = city;
    }

    const aliases = Array.isArray(city.aliases) ? city.aliases : [];
    for (const alias of aliases) {
      const aliasKey = normKey(alias);
      if (aliasKey && !byCityKey[aliasKey]) {
        byCityKey[aliasKey] = city;
      }
    }
  }

  return { byCityKey, byIata, all: mergedAll };
}

const RAW = loadRawDataset();
const INDEX = buildIndex(RAW);

export const IATA_CITIES: IataCity[] = INDEX.all;
export const IATA_BY_CITYKEY: Record<string, IataCity> = INDEX.byCityKey;
export const IATA_BY_CODE: Record<string, IataCity> = INDEX.byIata;

export function getIataCityCodeForCity(cityName: string): string {
  const key = normKey(cityName);
  if (!key) return "";

  const hit = IATA_BY_CITYKEY[key];
  return hit?.iata ? safeStr(hit.iata).toUpperCase() : "";
}

export function getIataCityCodeForCityKey(cityKey: string): string {
  const key = normKey(cityKey);
  if (!key) return "";

  const hit = IATA_BY_CITYKEY[key];
  return hit?.iata ? safeStr(hit.iata).toUpperCase() : "";
}

export function getIataCityByCode(code: string): IataCity | null {
  const key = normKey(code);
  return key ? IATA_BY_CODE[key] ?? null : null;
}

export function getIataCityByCityKey(cityKey: string): IataCity | null {
  const key = normKey(cityKey);
  return key ? IATA_BY_CITYKEY[key] ?? null : null;
}

export function searchIataCities(query: string, limit = 20): IataCity[] {
  const q = normKey(query);
  if (!q) return [];

  const out: IataCity[] = [];

  for (const city of IATA_CITIES) {
    const haystack = [
      city.city,
      city.iata,
      city.country ?? "",
      city.countryCode ?? "",
      ...(city.aliases ?? []),
    ]
      .map(normKey)
      .join(" ");

    if (haystack.includes(q)) out.push(city);
    if (out.length >= limit) break;
  }

  return out;
  }
