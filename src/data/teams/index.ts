// src/data/teams/index.ts
import { LEAGUES, type LeagueOption } from "@/src/constants/football";
import type { TeamRecord } from "./types";
import premierLeagueTeams from "./premierLeague";
import laLigaTeams from "./laLiga";
import serieATeams from "./serieA";
import bundesligaTeams from "./bundesliga";

/**
 * V1 Team Registry (single source of truth)
 *
 * Why this exists:
 * - Home search must be able to find teams even when fixtures API results don't include them yet.
 * - Team guides will be keyed by a stable `teamKey`.
 *
 * Notes:
 * - Keep this registry accurate and deterministic.
 * - Bundesliga and Ligue 1 are 18-team leagues (do NOT force 20).
 * - Avoid hardcoding season per team unless absolutely necessary; prefer LEAGUES season.
 * - Add aliases for common user inputs + API-Football variants (diacritics, prefixes, punctuation).
 */


// League IDs (API-Football conventional IDs used throughout the project)
const EPL = 39;
const LALIGA = 140;
const SERIE_A = 135;
const BUNDESLIGA = 78;
const LIGUE_1 = 61;

const ENGLAND = "England";
const SPAIN = "Spain";
const ITALY = "Italy";
const GERMANY = "Germany";
const FRANCE = "France";

/**
 * Popular teams (single source of truth)
 * - Keys must exist in `teams`.
 * - Team IDs must be correct for crest + scoring in Home.
 */
export const POPULAR_TEAM_KEYS = [
  "real-madrid",
  "arsenal",
  "bayern-munich",
  "inter",
  "borussia-dortmund",
] as const;

export type PopularTeamKey = (typeof POPULAR_TEAM_KEYS)[number];

/**
 * Remove diacritics safely (Köln -> Koln, München -> Munchen).
 * This is critical for matching API/fixture names to registry keys.
 */
function stripDiacritics(input: string): string {
  try {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return input;
  }
}

/**
 * Normalise any user input or label into a comparable key.
 * Deterministic and diacritics-safe.
 */
export function normalizeTeamKey(input: string): string {
  const s = stripDiacritics(String(input ?? ""))
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "");

  return s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Registry keyed by teamKey.
 *
 * Gold standard:
 * - Alphabetical by teamKey (ideal, not required for correctness)
 * - Minimal but useful aliases
 * - leagueId set for routing + filtering
 */

export const teams: Record<string, TeamRecord> = {
  ...premierLeagueTeams,
  ...laLigaTeams,
  ...serieATeams,
  ...bundesligaTeams,

    
  
  
    
  
  
  
 
     

  // -------------------------
// Ligue 1 (18 teams)
// -------------------------
"angers": {
  teamKey: "angers",
  name: "Angers",
  country: FRANCE,
  city: "Angers",
  leagueId: LIGUE_1,
  stadiumKey: "raymond-kopa",
  founded: 1919,
  clubColors: ["black", "white"],
  aliases: ["angers sco", "sco angers"],
},

"as-monaco": {
  teamKey: "as-monaco",
  name: "AS Monaco",
  country: FRANCE,
  city: "Monaco",
  leagueId: LIGUE_1,
  stadiumKey: "stade-louis-ii",
  founded: 1924,
  clubColors: ["red", "white"],
  aliases: ["monaco", "as monaco fc"],
},

"auxerre": {
  teamKey: "auxerre",
  name: "Auxerre",
  country: FRANCE,
  city: "Auxerre",
  leagueId: LIGUE_1,
  stadiumKey: "stade-abbe-deschamps",
  founded: 1905,
  clubColors: ["blue", "white"],
  aliases: ["aj auxerre", "aja"],
},

"brest": {
  teamKey: "brest",
  name: "Brest",
  country: FRANCE,
  city: "Brest",
  leagueId: LIGUE_1,
  stadiumKey: "stade-francis-le-ble",
  founded: 1950,
  clubColors: ["red", "white"],
  aliases: ["stade brestois", "stade brestois 29"],
},

"le-havre": {
  teamKey: "le-havre",
  name: "Le Havre",
  country: FRANCE,
  city: "Le Havre",
  leagueId: LIGUE_1,
  stadiumKey: "stade-oceane",
  founded: 1872,
  clubColors: ["sky blue", "navy"],
  aliases: ["le havre ac", "hac"],
},

"lens": {
  teamKey: "lens",
  name: "Lens",
  country: FRANCE,
  city: "Lens",
  leagueId: LIGUE_1,
  stadiumKey: "stade-bollaert-delelis",
  founded: 1906,
  clubColors: ["red", "yellow"],
  aliases: ["rc lens", "rcl"],
},

"lille": {
  teamKey: "lille",
  name: "Lille",
  country: FRANCE,
  city: "Lille",
  leagueId: LIGUE_1,
  stadiumKey: "pierre-mauroy",
  founded: 1944,
  clubColors: ["red", "white"],
  aliases: ["losc", "lille osc"],
},

"lorient": {
  teamKey: "lorient",
  name: "Lorient",
  country: FRANCE,
  city: "Lorient",
  leagueId: LIGUE_1,
  stadiumKey: "stade-du-moustoir",
  founded: 1926,
  clubColors: ["orange", "black"],
  aliases: ["fc lorient"],
},

"lyon": {
  teamKey: "lyon",
  name: "Lyon",
  country: FRANCE,
  city: "Lyon",
  leagueId: LIGUE_1,
  stadiumKey: "groupama-stadium",
  founded: 1950,
  clubColors: ["white", "red", "blue"],
  aliases: ["ol", "olympique lyonnais"],
},

"marseille": {
  teamKey: "marseille",
  name: "Marseille",
  country: FRANCE,
  city: "Marseille",
  leagueId: LIGUE_1,
  stadiumKey: "velodrome",
  founded: 1899,
  clubColors: ["white", "sky blue"],
  aliases: ["om", "olympique de marseille"],
},

"metz": {
  teamKey: "metz",
  name: "Metz",
  country: FRANCE,
  city: "Metz",
  leagueId: LIGUE_1,
  stadiumKey: "saint-symphorien",
  founded: 1932,
  clubColors: ["maroon"],
  aliases: ["fc metz"],
},

"nantes": {
  teamKey: "nantes",
  name: "Nantes",
  country: FRANCE,
  city: "Nantes",
  leagueId: LIGUE_1,
  stadiumKey: "la-beaujoire",
  founded: 1943,
  clubColors: ["yellow", "green"],
  aliases: ["fc nantes"],
},

"nice": {
  teamKey: "nice",
  name: "Nice",
  country: FRANCE,
  city: "Nice",
  leagueId: LIGUE_1,
  stadiumKey: "allianz-riviera",
  founded: 1904,
  clubColors: ["red", "black"],
  aliases: ["ogc nice"],
},

"paris-fc": {
  teamKey: "paris-fc",
  name: "Paris FC",
  country: FRANCE,
  city: "Paris",
  leagueId: LIGUE_1,
  stadiumKey: "stade-charlety",
  founded: 1969,
  clubColors: ["blue"],
  aliases: ["paris fc"],
},

"paris-saint-germain": {
  teamKey: "paris-saint-germain",
  name: "Paris Saint-Germain",
  country: FRANCE,
  city: "Paris",
  leagueId: LIGUE_1,
  stadiumKey: "parc-des-princes",
  founded: 1970,
  clubColors: ["blue", "red", "white"],
  aliases: ["psg", "paris sg", "paris st germain"],
},

"rennes": {
  teamKey: "rennes",
  name: "Rennes",
  country: FRANCE,
  city: "Rennes",
  leagueId: LIGUE_1,
  stadiumKey: "roazhon-park",
  founded: 1901,
  clubColors: ["red", "black"],
  aliases: ["stade rennais", "stade rennais fc"],
},

"strasbourg": {
  teamKey: "strasbourg",
  name: "Strasbourg",
  country: FRANCE,
  city: "Strasbourg",
  leagueId: LIGUE_1,
  stadiumKey: "meinau",
  founded: 1906,
  clubColors: ["blue", "white"],
  aliases: ["rc strasbourg", "racing"],
},

"toulouse": {
  teamKey: "toulouse",
  name: "Toulouse",
  country: FRANCE,
  city: "Toulouse",
  leagueId: LIGUE_1,
  stadiumKey: "municipal-de-toulouse",
  founded: 1970,
  clubColors: ["purple"],
  aliases: ["tfc", "toulouse fc"],
},
  
// -------------------------
// Eredivisie (18 teams)
// -------------------------
"ajax": {
  teamKey: "ajax",
  name: "Ajax",
  country: "Netherlands",
  city: "Amsterdam",
  leagueId: 88,
  aliases: ["ajax amsterdam", "afc ajax"],
},

"psv": {
  teamKey: "psv",
  name: "PSV",
  country: "Netherlands",
  city: "Eindhoven",
  leagueId: 88,
  aliases: ["psv eindhoven", "psv fc"],
},

"feyenoord": {
  teamKey: "feyenoord",
  name: "Feyenoord",
  country: "Netherlands",
  city: "Rotterdam",
  leagueId: 88,
  aliases: ["feyenoord rotterdam"],
},

"az": {
  teamKey: "az",
  name: "AZ Alkmaar",
  country: "Netherlands",
  city: "Alkmaar",
  leagueId: 88,
  aliases: ["az alkmaar", "az67"],
},

"twente": {
  teamKey: "twente",
  name: "FC Twente",
  country: "Netherlands",
  city: "Enschede",
  leagueId: 88,
  aliases: ["twente", "fc twente"],
},

"utrecht": {
  teamKey: "utrecht",
  name: "FC Utrecht",
  country: "Netherlands",
  city: "Utrecht",
  leagueId: 88,
  aliases: ["utrecht", "fc utrecht"],
},

"sparta-rotterdam": {
  teamKey: "sparta-rotterdam",
  name: "Sparta Rotterdam",
  country: "Netherlands",
  city: "Rotterdam",
  leagueId: 88,
  aliases: ["sparta", "sparta rotterdam"],
},

"nec": {
  teamKey: "nec",
  name: "NEC Nijmegen",
  country: "Netherlands",
  city: "Nijmegen",
  leagueId: 88,
  aliases: ["nec", "nec nijmegen"],
},

"go-ahead-eagles": {
  teamKey: "go-ahead-eagles",
  name: "Go Ahead Eagles",
  country: "Netherlands",
  city: "Deventer",
  leagueId: 88,
  aliases: ["go ahead", "gae"],
},

"pec-zwolle": {
  teamKey: "pec-zwolle",
  name: "PEC Zwolle",
  country: "Netherlands",
  city: "Zwolle",
  leagueId: 88,
  aliases: ["zwolle"],
},

"heracles": {
  teamKey: "heracles",
  name: "Heracles Almelo",
  country: "Netherlands",
  city: "Almelo",
  leagueId: 88,
  aliases: ["heracles", "heracles almelo"],
},

"heerenveen": {
  teamKey: "heerenveen",
  name: "Heerenveen",
  country: "Netherlands",
  city: "Heerenveen",
  leagueId: 88,
  aliases: ["sc heerenveen"],
},

"fortuna-sittard": {
  teamKey: "fortuna-sittard",
  name: "Fortuna Sittard",
  country: "Netherlands",
  city: "Sittard",
  leagueId: 88,
  aliases: ["fortuna"],
},

"nac-breda": {
  teamKey: "nac-breda",
  name: "NAC Breda",
  country: "Netherlands",
  city: "Breda",
  leagueId: 88,
  aliases: ["nac", "breda"],
},

"willem-ii": {
  teamKey: "willem-ii",
  name: "Willem II",
  country: "Netherlands",
  city: "Tilburg",
  leagueId: 88,
  aliases: ["willem ii", "willem 2"],
},

"groningen": {
  teamKey: "groningen",
  name: "Groningen",
  country: "Netherlands",
  city: "Groningen",
  leagueId: 88,
  aliases: ["fc groningen"],
},

"rkc-waalwijk": {
  teamKey: "rkc-waalwijk",
  name: "RKC Waalwijk",
  country: "Netherlands",
  city: "Waalwijk",
  leagueId: 88,
  aliases: ["rkc"],
},

"almere-city": {
  teamKey: "almere-city",
  name: "Almere City",
  country: "Netherlands",
  city: "Almere",
  leagueId: 88,
  aliases: ["almere city fc"],
},

  // -------------------------
// Primeira Liga (18 teams)
// -------------------------
"benfica": {
  teamKey: "benfica",
  name: "Benfica",
  country: "Portugal",
  city: "Lisbon",
  leagueId: 94,
  aliases: ["sl benfica", "benfica lisbon"],
},

"porto": {
  teamKey: "porto",
  name: "FC Porto",
  country: "Portugal",
  city: "Porto",
  leagueId: 94,
  aliases: ["porto", "fc porto"],
},

"sporting-cp": {
  teamKey: "sporting-cp",
  name: "Sporting CP",
  country: "Portugal",
  city: "Lisbon",
  leagueId: 94,
  aliases: ["sporting", "sporting lisbon", "sporting clube de portugal"],
},

"braga": {
  teamKey: "braga",
  name: "Braga",
  country: "Portugal",
  city: "Braga",
  leagueId: 94,
  aliases: ["sc braga"],
},

"vitoria-guimaraes": {
  teamKey: "vitoria-guimaraes",
  name: "Vitória Guimarães",
  country: "Portugal",
  city: "Guimarães",
  leagueId: 94,
  aliases: ["vitoria", "guimaraes", "vitoria sc"],
},

"boavista": {
  teamKey: "boavista",
  name: "Boavista",
  country: "Portugal",
  city: "Porto",
  leagueId: 94,
  aliases: ["boavista fc"],
},

"famalicao": {
  teamKey: "famalicao",
  name: "Famalicão",
  country: "Portugal",
  city: "Vila Nova de Famalicão",
  leagueId: 94,
  aliases: ["fc famalicao"],
},

"moreirense": {
  teamKey: "moreirense",
  name: "Moreirense",
  country: "Portugal",
  city: "Moreira de Cónegos",
  leagueId: 94,
  aliases: ["moreirense fc"],
},

"gil-vicente": {
  teamKey: "gil-vicente",
  name: "Gil Vicente",
  country: "Portugal",
  city: "Barcelos",
  leagueId: 94,
  aliases: ["gil vicente fc"],
},

"rio-ave": {
  teamKey: "rio-ave",
  name: "Rio Ave",
  country: "Portugal",
  city: "Vila do Conde",
  leagueId: 94,
  aliases: ["rio ave fc"],
},

"estoril": {
  teamKey: "estoril",
  name: "Estoril",
  country: "Portugal",
  city: "Estoril",
  leagueId: 94,
  aliases: ["estoril praia"],
},

"casa-pia": {
  teamKey: "casa-pia",
  name: "Casa Pia",
  country: "Portugal",
  city: "Lisbon",
  leagueId: 94,
  aliases: ["casa pia ac"],
},

"arouca": {
  teamKey: "arouca",
  name: "Arouca",
  country: "Portugal",
  city: "Arouca",
  leagueId: 94,
  aliases: ["fc arouca"],
},

"farense": {
  teamKey: "farense",
  name: "Farense",
  country: "Portugal",
  city: "Faro",
  leagueId: 94,
  aliases: ["sc farense"],
},

"nacional": {
  teamKey: "nacional",
  name: "Nacional",
  country: "Portugal",
  city: "Funchal",
  leagueId: 94,
  aliases: ["cd nacional"],
},

"santa-clara": {
  teamKey: "santa-clara",
  name: "Santa Clara",
  country: "Portugal",
  city: "Ponta Delgada",
  leagueId: 94,
  aliases: ["cd santa clara"],
},

"estrela-amadora": {
  teamKey: "estrela-amadora",
  name: "Estrela Amadora",
  country: "Portugal",
  city: "Amadora",
  leagueId: 94,
  aliases: ["estrela da amadora"],
},

"avs": {
  teamKey: "avs",
  name: "AVS",
  country: "Portugal",
  city: "Vila das Aves",
  leagueId: 94,
  aliases: ["avs futebol sad"],
},

  // -------------------------
// Scottish Premiership (12 teams)
// -------------------------
"celtic": {
  teamKey: "celtic",
  name: "Celtic",
  country: "Scotland",
  city: "Glasgow",
  leagueId: 179,
  aliases: ["celtic fc", "the bhoys"],
},

"rangers": {
  teamKey: "rangers",
  name: "Rangers",
  country: "Scotland",
  city: "Glasgow",
  leagueId: 179,
  aliases: ["rangers fc", "glasgow rangers"],
},

"aberdeen": {
  teamKey: "aberdeen",
  name: "Aberdeen",
  country: "Scotland",
  city: "Aberdeen",
  leagueId: 179,
  aliases: ["aberdeen fc", "the dons"],
},

"hearts": {
  teamKey: "hearts",
  name: "Hearts",
  country: "Scotland",
  city: "Edinburgh",
  leagueId: 179,
  aliases: ["heart of midlothian", "hearts fc"],
},

"hibernian": {
  teamKey: "hibernian",
  name: "Hibernian",
  country: "Scotland",
  city: "Edinburgh",
  leagueId: 179,
  aliases: ["hibs", "hibernian fc"],
},

"dundee-united": {
  teamKey: "dundee-united",
  name: "Dundee United",
  country: "Scotland",
  city: "Dundee",
  leagueId: 179,
  aliases: ["dundee utd"],
},

"dundee": {
  teamKey: "dundee",
  name: "Dundee",
  country: "Scotland",
  city: "Dundee",
  leagueId: 179,
  aliases: ["dundee fc"],
},

"st-mirren": {
  teamKey: "st-mirren",
  name: "St Mirren",
  country: "Scotland",
  city: "Paisley",
  leagueId: 179,
  aliases: ["st mirren fc"],
},

"motherwell": {
  teamKey: "motherwell",
  name: "Motherwell",
  country: "Scotland",
  city: "Motherwell",
  leagueId: 179,
  aliases: ["motherwell fc"],
},

"kilmarnock": {
  teamKey: "kilmarnock",
  name: "Kilmarnock",
  country: "Scotland",
  city: "Kilmarnock",
  leagueId: 179,
  aliases: ["killie"],
},

"ross-county": {
  teamKey: "ross-county",
  name: "Ross County",
  country: "Scotland",
  city: "Dingwall",
  leagueId: 179,
  aliases: ["ross county fc"],
},

"livingston": {
  teamKey: "livingston",
  name: "Livingston",
  country: "Scotland",
  city: "Livingston",
  leagueId: 179,
  aliases: ["livingston fc", "livi"],
},

  // -------------------------
// Süper Lig (20 teams)
// -------------------------
"galatasaray": {
  teamKey: "galatasaray",
  name: "Galatasaray",
  country: "Turkey",
  city: "Istanbul",
  leagueId: 203,
  aliases: ["galatasaray sk", "gala"],
},

"fenerbahce": {
  teamKey: "fenerbahce",
  name: "Fenerbahçe",
  country: "Turkey",
  city: "Istanbul",
  leagueId: 203,
  aliases: ["fenerbahce sk", "fener"],
},

"besiktas": {
  teamKey: "besiktas",
  name: "Beşiktaş",
  country: "Turkey",
  city: "Istanbul",
  leagueId: 203,
  aliases: ["besiktas jk", "bjk"],
},

"trabzonspor": {
  teamKey: "trabzonspor",
  name: "Trabzonspor",
  country: "Turkey",
  city: "Trabzon",
  leagueId: 203,
  aliases: ["trabzon"],
},

"istanbul-basaksehir": {
  teamKey: "istanbul-basaksehir",
  name: "İstanbul Başakşehir",
  country: "Turkey",
  city: "Istanbul",
  leagueId: 203,
  aliases: ["basaksehir", "basaksehir fk"],
},

"adana-demirspor": {
  teamKey: "adana-demirspor",
  name: "Adana Demirspor",
  country: "Turkey",
  city: "Adana",
  leagueId: 203,
  aliases: ["demirspor"],
},

"sivasspor": {
  teamKey: "sivasspor",
  name: "Sivasspor",
  country: "Turkey",
  city: "Sivas",
  leagueId: 203,
  aliases: ["sivasspor fk"],
},

"konyaspor": {
  teamKey: "konyaspor",
  name: "Konyaspor",
  country: "Turkey",
  city: "Konya",
  leagueId: 203,
  aliases: ["konyaspor fk"],
},

"antalyaspor": {
  teamKey: "antalyaspor",
  name: "Antalyaspor",
  country: "Turkey",
  city: "Antalya",
  leagueId: 203,
  aliases: ["antalya"],
},

"gaziantep": {
  teamKey: "gaziantep",
  name: "Gaziantep FK",
  country: "Turkey",
  city: "Gaziantep",
  leagueId: 203,
  aliases: ["gaziantep fk"],
},

"kasimpasa": {
  teamKey: "kasimpasa",
  name: "Kasımpaşa",
  country: "Turkey",
  city: "Istanbul",
  leagueId: 203,
  aliases: ["kasimpasa sk"],
},

"alanyaspor": {
  teamKey: "alanyaspor",
  name: "Alanyaspor",
  country: "Turkey",
  city: "Alanya",
  leagueId: 203,
  aliases: ["alanya"],
},

"hatayspor": {
  teamKey: "hatayspor",
  name: "Hatayspor",
  country: "Turkey",
  city: "Hatay",
  leagueId: 203,
  aliases: ["hatay"],
},

"rizespor": {
  teamKey: "rizespor",
  name: "Çaykur Rizespor",
  country: "Turkey",
  city: "Rize",
  leagueId: 203,
  aliases: ["rize", "rizespor fk"],
},

"samsunspor": {
  teamKey: "samsunspor",
  name: "Samsunspor",
  country: "Turkey",
  city: "Samsun",
  leagueId: 203,
  aliases: ["samsunspor fk"],
},

"kayserispor": {
  teamKey: "kayserispor",
  name: "Kayserispor",
  country: "Turkey",
  city: "Kayseri",
  leagueId: 203,
  aliases: ["kayseri"],
},

"ankaragucu": {
  teamKey: "ankaragucu",
  name: "Ankaragücü",
  country: "Turkey",
  city: "Ankara",
  leagueId: 203,
  aliases: ["mke ankaragucu"],
},

"pendikspor": {
  teamKey: "pendikspor",
  name: "Pendikspor",
  country: "Turkey",
  city: "Istanbul",
  leagueId: 203,
  aliases: ["pendik"],
},

"bodrumspor": {
  teamKey: "bodrumspor",
  name: "Bodrumspor",
  country: "Turkey",
  city: "Bodrum",
  leagueId: 203,
  aliases: ["bodrum fk"],
},

"goztepe": {
  teamKey: "goztepe",
  name: "Göztepe",
  country: "Turkey",
  city: "Izmir",
  leagueId: 203,
  aliases: ["goztepe sk"],
},

  // -------------------------
// Belgium Pro League (16 teams)
// -------------------------
"anderlecht": {
  teamKey: "anderlecht",
  name: "Anderlecht",
  country: "Belgium",
  city: "Brussels",
  leagueId: 144,
  aliases: ["rsc anderlecht"],
},

"club-brugge": {
  teamKey: "club-brugge",
  name: "Club Brugge",
  country: "Belgium",
  city: "Bruges",
  leagueId: 144,
  aliases: ["club brugge kv"],
},

"union-saint-gilloise": {
  teamKey: "union-saint-gilloise",
  name: "Union Saint-Gilloise",
  country: "Belgium",
  city: "Brussels",
  leagueId: 144,
  aliases: ["union sg", "usg"],
},

"antwerp": {
  teamKey: "antwerp",
  name: "Royal Antwerp",
  country: "Belgium",
  city: "Antwerp",
  leagueId: 144,
  aliases: ["antwerp fc", "royal antwerp"],
},

"gent": {
  teamKey: "gent",
  name: "Gent",
  country: "Belgium",
  city: "Ghent",
  leagueId: 144,
  aliases: ["k aa gent"],
},

"genk": {
  teamKey: "genk",
  name: "Genk",
  country: "Belgium",
  city: "Genk",
  leagueId: 144,
  aliases: ["krc genk"],
},

"standard-liege": {
  teamKey: "standard-liege",
  name: "Standard Liège",
  country: "Belgium",
  city: "Liège",
  leagueId: 144,
  aliases: ["standard liege", "standard de liege"],
},

"charleroi": {
  teamKey: "charleroi",
  name: "Charleroi",
  country: "Belgium",
  city: "Charleroi",
  leagueId: 144,
  aliases: ["sporting charleroi"],
},

"mechelen": {
  teamKey: "mechelen",
  name: "KV Mechelen",
  country: "Belgium",
  city: "Mechelen",
  leagueId: 144,
  aliases: ["mechelen", "yellow red kv mechelen"],
},

"leuven": {
  teamKey: "leuven",
  name: "OH Leuven",
  country: "Belgium",
  city: "Leuven",
  leagueId: 144,
  aliases: ["oud-heverlee leuven"],
},

"st-truiden": {
  teamKey: "st-truiden",
  name: "Sint-Truiden",
  country: "Belgium",
  city: "Sint-Truiden",
  leagueId: 144,
  aliases: ["stvv", "sint truiden"],
},

"kortrijk": {
  teamKey: "kortrijk",
  name: "Kortrijk",
  country: "Belgium",
  city: "Kortrijk",
  leagueId: 144,
  aliases: ["kv kortrijk"],
},

"cercle-brugge": {
  teamKey: "cercle-brugge",
  name: "Cercle Brugge",
  country: "Belgium",
  city: "Bruges",
  leagueId: 144,
  aliases: ["cercle"],
},

"westerlo": {
  teamKey: "westerlo",
  name: "Westerlo",
  country: "Belgium",
  city: "Westerlo",
  leagueId: 144,
  aliases: ["kvc westerlo"],
},

"dender": {
  teamKey: "dender",
  name: "Dender",
  country: "Belgium",
  city: "Denderleeuw",
  leagueId: 144,
  aliases: ["fc dender"],
},

"beerschot": {
  teamKey: "beerschot",
  name: "Beerschot",
  country: "Belgium",
  city: "Antwerp",
  leagueId: 144,
  aliases: ["beerschot va"],
},

  // -------------------------
// Austrian Bundesliga (12 teams)
// -------------------------
"salzburg": {
  teamKey: "salzburg",
  name: "RB Salzburg",
  country: "Austria",
  city: "Salzburg",
  leagueId: 218,
  aliases: ["red bull salzburg", "fc salzburg"],
},

"rapid-vienna": {
  teamKey: "rapid-vienna",
  name: "Rapid Vienna",
  country: "Austria",
  city: "Vienna",
  leagueId: 218,
  aliases: ["rapid wien", "sk rapid wien"],
},

"austria-vienna": {
  teamKey: "austria-vienna",
  name: "Austria Vienna",
  country: "Austria",
  city: "Vienna",
  leagueId: 218,
  aliases: ["fk austria wien"],
},

"sturm-graz": {
  teamKey: "sturm-graz",
  name: "Sturm Graz",
  country: "Austria",
  city: "Graz",
  leagueId: 218,
  aliases: ["sk sturm graz"],
},

"lask": {
  teamKey: "lask",
  name: "LASK",
  country: "Austria",
  city: "Linz",
  leagueId: 218,
  aliases: ["lask linz"],
},

"hartberg": {
  teamKey: "hartberg",
  name: "Hartberg",
  country: "Austria",
  city: "Hartberg",
  leagueId: 218,
  aliases: ["tsv hartberg"],
},

"altach": {
  teamKey: "altach",
  name: "Altach",
  country: "Austria",
  city: "Altach",
  leagueId: 218,
  aliases: ["rheindorf altach"],
},

"austria-klagenfurt": {
  teamKey: "austria-klagenfurt",
  name: "Austria Klagenfurt",
  country: "Austria",
  city: "Klagenfurt",
  leagueId: 218,
  aliases: ["sk austria klagenfurt"],
},

"bw-linz": {
  teamKey: "bw-linz",
  name: "Blau-Weiß Linz",
  country: "Austria",
  city: "Linz",
  leagueId: 218,
  aliases: ["blau weiss linz"],
},

"wsg-tirol": {
  teamKey: "wsg-tirol",
  name: "WSG Tirol",
  country: "Austria",
  city: "Wattens",
  leagueId: 218,
  aliases: ["wsg swarovski tirol"],
},

"grazer-ak": {
  teamKey: "grazer-ak",
  name: "Grazer AK",
  country: "Austria",
  city: "Graz",
  leagueId: 218,
  aliases: ["gak"],
},

"wolfsberger-ac": {
  teamKey: "wolfsberger-ac",
  name: "Wolfsberger AC",
  country: "Austria",
  city: "Wolfsberg",
  leagueId: 218,
  aliases: ["wac"],
},

  // -------------------------
// Swiss Super League (12 teams)
// -------------------------
"young-boys": {
  teamKey: "young-boys",
  name: "Young Boys",
  country: "Switzerland",
  city: "Bern",
  leagueId: 207,
  aliases: ["bsc young boys"],
},

"basel": {
  teamKey: "basel",
  name: "Basel",
  country: "Switzerland",
  city: "Basel",
  leagueId: 207,
  aliases: ["fc basel"],
},

"zurich": {
  teamKey: "zurich",
  name: "FC Zürich",
  country: "Switzerland",
  city: "Zurich",
  leagueId: 207,
  aliases: ["fc zurich", "zurich fc"],
},

"grasshoppers": {
  teamKey: "grasshoppers",
  name: "Grasshoppers",
  country: "Switzerland",
  city: "Zurich",
  leagueId: 207,
  aliases: ["grasshopper club", "gc zurich"],
},

"servette": {
  teamKey: "servette",
  name: "Servette",
  country: "Switzerland",
  city: "Geneva",
  leagueId: 207,
  aliases: ["servette fc"],
},

"lugano": {
  teamKey: "lugano",
  name: "Lugano",
  country: "Switzerland",
  city: "Lugano",
  leagueId: 207,
  aliases: ["fc lugano"],
},

"st-gallen": {
  teamKey: "st-gallen",
  name: "St. Gallen",
  country: "Switzerland",
  city: "St. Gallen",
  leagueId: 207,
  aliases: ["fc st gallen"],
},

"winterthur": {
  teamKey: "winterthur",
  name: "Winterthur",
  country: "Switzerland",
  city: "Winterthur",
  leagueId: 207,
  aliases: ["fc winterthur"],
},

"lausanne": {
  teamKey: "lausanne",
  name: "Lausanne-Sport",
  country: "Switzerland",
  city: "Lausanne",
  leagueId: 207,
  aliases: ["lausanne sport", "ls"],
},

"sion": {
  teamKey: "sion",
  name: "Sion",
  country: "Switzerland",
  city: "Sion",
  leagueId: 207,
  aliases: ["fc sion"],
},

"yverdon": {
  teamKey: "yverdon",
  name: "Yverdon Sport",
  country: "Switzerland",
  city: "Yverdon",
  leagueId: 207,
  aliases: ["yverdon sport fc"],
},

"lucerne": {
  teamKey: "lucerne",
  name: "Lucerne",
  country: "Switzerland",
  city: "Lucerne",
  leagueId: 207,
  aliases: ["fc luzern", "luzern"],
},

  // -------------------------
// Greek Super League (14 teams)
// -------------------------
"olympiacos": {
  teamKey: "olympiacos",
  name: "Olympiacos",
  country: "Greece",
  city: "Piraeus",
  leagueId: 197,
  aliases: ["olympiacos fc"],
},

"panathinaikos": {
  teamKey: "panathinaikos",
  name: "Panathinaikos",
  country: "Greece",
  city: "Athens",
  leagueId: 197,
  aliases: ["pao", "panathinaikos fc"],
},

"aek-athens": {
  teamKey: "aek-athens",
  name: "AEK Athens",
  country: "Greece",
  city: "Athens",
  leagueId: 197,
  aliases: ["aek"],
},

"paok": {
  teamKey: "paok",
  name: "PAOK",
  country: "Greece",
  city: "Thessaloniki",
  leagueId: 197,
  aliases: ["paok fc"],
},

"aris": {
  teamKey: "aris",
  name: "Aris",
  country: "Greece",
  city: "Thessaloniki",
  leagueId: 197,
  aliases: ["aris fc"],
},

"asteras-tripolis": {
  teamKey: "asteras-tripolis",
  name: "Asteras Tripolis",
  country: "Greece",
  city: "Tripoli",
  leagueId: 197,
  aliases: ["asteras"],
},

"atromitos": {
  teamKey: "atromitos",
  name: "Atromitos",
  country: "Greece",
  city: "Athens",
  leagueId: 197,
  aliases: ["atromitos fc"],
},

"ofi": {
  teamKey: "ofi",
  name: "OFI Crete",
  country: "Greece",
  city: "Heraklion",
  leagueId: 197,
  aliases: ["ofi"],
},

"panetolikos": {
  teamKey: "panetolikos",
  name: "Panetolikos",
  country: "Greece",
  city: "Agrinio",
  leagueId: 197,
  aliases: ["panetolikos fc"],
},

"lamia": {
  teamKey: "lamia",
  name: "Lamia",
  country: "Greece",
  city: "Lamia",
  leagueId: 197,
  aliases: ["pas lamia"],
},

"volos": {
  teamKey: "volos",
  name: "Volos",
  country: "Greece",
  city: "Volos",
  leagueId: 197,
  aliases: ["volos nfc"],
},

"kallithea": {
  teamKey: "kallithea",
  name: "Athens Kallithea",
  country: "Greece",
  city: "Athens",
  leagueId: 197,
  aliases: ["kallithea fc"],
},

"levadiakos": {
  teamKey: "levadiakos",
  name: "Levadiakos",
  country: "Greece",
  city: "Livadeia",
  leagueId: 197,
  aliases: ["levadiakos fc"],
},

"panserraikos": {
  teamKey: "panserraikos",
  name: "Panserraikos",
  country: "Greece",
  city: "Serres",
  leagueId: 197,
  aliases: ["panserraikos fc"],
},

  // -------------------------
// Danish Superliga (12 teams)
// -------------------------
"copenhagen": {
  teamKey: "copenhagen",
  name: "FC Copenhagen",
  country: "Denmark",
  city: "Copenhagen",
  leagueId: 119,
  aliases: ["fc copenhagen", "fck"],
},

"brondby": {
  teamKey: "brondby",
  name: "Brøndby",
  country: "Denmark",
  city: "Brøndby",
  leagueId: 119,
  aliases: ["brondby if"],
},

"midtjylland": {
  teamKey: "midtjylland",
  name: "Midtjylland",
  country: "Denmark",
  city: "Herning",
  leagueId: 119,
  aliases: ["fc midtjylland"],
},

"aarhus": {
  teamKey: "aarhus",
  name: "Aarhus",
  country: "Denmark",
  city: "Aarhus",
  leagueId: 119,
  aliases: ["agf", "aarhus gf"],
},

"nordsjaelland": {
  teamKey: "nordsjaelland",
  name: "Nordsjælland",
  country: "Denmark",
  city: "Farum",
  leagueId: 119,
  aliases: ["fc nordsjaelland"],
},

"silkeborg": {
  teamKey: "silkeborg",
  name: "Silkeborg",
  country: "Denmark",
  city: "Silkeborg",
  leagueId: 119,
  aliases: ["silkeborg if"],
},

"viborg": {
  teamKey: "viborg",
  name: "Viborg",
  country: "Denmark",
  city: "Viborg",
  leagueId: 119,
  aliases: ["viborg ff"],
},

"odense": {
  teamKey: "odense",
  name: "Odense",
  country: "Denmark",
  city: "Odense",
  leagueId: 119,
  aliases: ["ob", "odense bk"],
},

"randers": {
  teamKey: "randers",
  name: "Randers",
  country: "Denmark",
  city: "Randers",
  leagueId: 119,
  aliases: ["randers fc"],
},

"lyngby": {
  teamKey: "lyngby",
  name: "Lyngby",
  country: "Denmark",
  city: "Lyngby",
  leagueId: 119,
  aliases: ["lyngby bk"],
},

"vejle": {
  teamKey: "vejle",
  name: "Vejle",
  country: "Denmark",
  city: "Vejle",
  leagueId: 119,
  aliases: ["vejle bk"],
},

"sonderjyske": {
  teamKey: "sonderjyske",
  name: "Sønderjyske",
  country: "Denmark",
  city: "Haderslev",
  leagueId: 119,
  aliases: ["sonderjyske fc"],
},

  // -------------------------
// Chance Liga (16 teams)
// -------------------------
"sparta-prague": {
  teamKey: "sparta-prague",
  name: "Sparta Prague",
  country: "Czech Republic",
  city: "Prague",
  leagueId: 345,
  aliases: ["ac sparta prague", "sparta"],
},

"slavia-prague": {
  teamKey: "slavia-prague",
  name: "Slavia Prague",
  country: "Czech Republic",
  city: "Prague",
  leagueId: 345,
  aliases: ["sk slavia prague", "slavia"],
},

"viktoria-plzen": {
  teamKey: "viktoria-plzen",
  name: "Viktoria Plzeň",
  country: "Czech Republic",
  city: "Plzeň",
  leagueId: 345,
  aliases: ["plzen", "fc viktoria plzen"],
},

"banik-ostrava": {
  teamKey: "banik-ostrava",
  name: "Banik Ostrava",
  country: "Czech Republic",
  city: "Ostrava",
  leagueId: 345,
  aliases: ["fc banik ostrava"],
},

"slovan-liberec": {
  teamKey: "slovan-liberec",
  name: "Slovan Liberec",
  country: "Czech Republic",
  city: "Liberec",
  leagueId: 345,
  aliases: ["fc slovan liberec"],
},

"sigma-olomouc": {
  teamKey: "sigma-olomouc",
  name: "Sigma Olomouc",
  country: "Czech Republic",
  city: "Olomouc",
  leagueId: 345,
  aliases: ["sk sigma olomouc"],
},

"mlada-boleslav": {
  teamKey: "mlada-boleslav",
  name: "Mladá Boleslav",
  country: "Czech Republic",
  city: "Mladá Boleslav",
  leagueId: 345,
  aliases: ["fk mlada boleslav"],
},

"ceske-budejovice": {
  teamKey: "ceske-budejovice",
  name: "České Budějovice",
  country: "Czech Republic",
  city: "České Budějovice",
  leagueId: 345,
  aliases: ["dynamo ceske budejovice"],
},

"hradec-kralove": {
  teamKey: "hradec-kralove",
  name: "Hradec Králové",
  country: "Czech Republic",
  city: "Hradec Králové",
  leagueId: 345,
  aliases: ["fc hradec kralove"],
},

"bohemians-1905": {
  teamKey: "bohemians-1905",
  name: "Bohemians 1905",
  country: "Czech Republic",
  city: "Prague",
  leagueId: 345,
  aliases: ["bohemians"],
},

"pardubice": {
  teamKey: "pardubice",
  name: "Pardubice",
  country: "Czech Republic",
  city: "Pardubice",
  leagueId: 345,
  aliases: ["fk pardubice"],
},

"karvina": {
  teamKey: "karvina",
  name: "Karviná",
  country: "Czech Republic",
  city: "Karviná",
  leagueId: 345,
  aliases: ["mfc karvina"],
},

"jablonec": {
  teamKey: "jablonec",
  name: "Jablonec",
  country: "Czech Republic",
  city: "Jablonec",
  leagueId: 345,
  aliases: ["fk jablonec"],
},

"teplice": {
  teamKey: "teplice",
  name: "Teplice",
  country: "Czech Republic",
  city: "Teplice",
  leagueId: 345,
  aliases: ["fk teplice"],
},

"zlin": {
  teamKey: "zlin",
  name: "Zlín",
  country: "Czech Republic",
  city: "Zlín",
  leagueId: 345,
  aliases: ["fc zlin"],
},

"dukla-prague": {
  teamKey: "dukla-prague",
  name: "Dukla Prague",
  country: "Czech Republic",
  city: "Prague",
  leagueId: 345,
  aliases: ["dukla"],
},

  // -------------------------
// Ekstraklasa (18 teams)
// -------------------------
"legia-warsaw": {
  teamKey: "legia-warsaw",
  name: "Legia Warsaw",
  country: "Poland",
  city: "Warsaw",
  leagueId: 106,
  aliases: ["legia", "legia warszawa"],
},

"lech-poznan": {
  teamKey: "lech-poznan",
  name: "Lech Poznań",
  country: "Poland",
  city: "Poznań",
  leagueId: 106,
  aliases: ["lech", "kks lech poznan"],
},

"rakow": {
  teamKey: "rakow",
  name: "Raków Częstochowa",
  country: "Poland",
  city: "Częstochowa",
  leagueId: 106,
  aliases: ["rakow czestochowa"],
},

"pogon-szczecin": {
  teamKey: "pogon-szczecin",
  name: "Pogoń Szczecin",
  country: "Poland",
  city: "Szczecin",
  leagueId: 106,
  aliases: ["pogon"],
},

"jagiellonia": {
  teamKey: "jagiellonia",
  name: "Jagiellonia Białystok",
  country: "Poland",
  city: "Białystok",
  leagueId: 106,
  aliases: ["jagiellonia bialystok"],
},

"lechia-gdansk": {
  teamKey: "lechia-gdansk",
  name: "Lechia Gdańsk",
  country: "Poland",
  city: "Gdańsk",
  leagueId: 106,
  aliases: ["lechia"],
},

"piast-gliwice": {
  teamKey: "piast-gliwice",
  name: "Piast Gliwice",
  country: "Poland",
  city: "Gliwice",
  leagueId: 106,
  aliases: ["piast"],
},

"gornik-zabrze": {
  teamKey: "gornik-zabrze",
  name: "Górnik Zabrze",
  country: "Poland",
  city: "Zabrze",
  leagueId: 106,
  aliases: ["gornik"],
},

"widzew-lodz": {
  teamKey: "widzew-lodz",
  name: "Widzew Łódź",
  country: "Poland",
  city: "Łódź",
  leagueId: 106,
  aliases: ["widzew"],
},

"cracovia": {
  teamKey: "cracovia",
  name: "Cracovia",
  country: "Poland",
  city: "Kraków",
  leagueId: 106,
  aliases: ["ks cracovia"],
},

"korona-kielce": {
  teamKey: "korona-kielce",
  name: "Korona Kielce",
  country: "Poland",
  city: "Kielce",
  leagueId: 106,
  aliases: ["korona"],
},

"stal-mielec": {
  teamKey: "stal-mielec",
  name: "Stal Mielec",
  country: "Poland",
  city: "Mielec",
  leagueId: 106,
  aliases: ["fks stal mielec"],
},

"radomiak": {
  teamKey: "radomiak",
  name: "Radomiak Radom",
  country: "Poland",
  city: "Radom",
  leagueId: 106,
  aliases: ["radomiak radom"],
},

"motor-lublin": {
  teamKey: "motor-lublin",
  name: "Motor Lublin",
  country: "Poland",
  city: "Lublin",
  leagueId: 106,
  aliases: ["motor"],
},

"puszcza-niepolomice": {
  teamKey: "puszcza-niepolomice",
  name: "Puszcza Niepołomice",
  country: "Poland",
  city: "Niepołomice",
  leagueId: 106,
  aliases: ["puszcza"],
},

"slask-wroclaw": {
  teamKey: "slask-wroclaw",
  name: "Śląsk Wrocław",
  country: "Poland",
  city: "Wrocław",
  leagueId: 106,
  aliases: ["slask"],
},

"zaglebie-lubin": {
  teamKey: "zaglebie-lubin",
  name: "Zagłębie Lubin",
  country: "Poland",
  city: "Lubin",
  leagueId: 106,
  aliases: ["zaglebie"],
},

"katowice": {
  teamKey: "katowice",
  name: "GKS Katowice",
  country: "Poland",
  city: "Katowice",
  leagueId: 106,
  aliases: ["gks katowice"],
},

  // -------------------------
// Allsvenskan (16 teams)
// -------------------------
"malmo": {
  teamKey: "malmo",
  name: "Malmö",
  country: "Sweden",
  city: "Malmö",
  leagueId: 113,
  aliases: ["malmo ff"],
},

"aik": {
  teamKey: "aik",
  name: "AIK",
  country: "Sweden",
  city: "Stockholm",
  leagueId: 113,
  aliases: ["aik stockholm"],
},

"djurgarden": {
  teamKey: "djurgarden",
  name: "Djurgården",
  country: "Sweden",
  city: "Stockholm",
  leagueId: 113,
  aliases: ["djurgarden if"],
},

"hammarby": {
  teamKey: "hammarby",
  name: "Hammarby",
  country: "Sweden",
  city: "Stockholm",
  leagueId: 113,
  aliases: ["hammarby if"],
},

"goteborg": {
  teamKey: "goteborg",
  name: "IFK Göteborg",
  country: "Sweden",
  city: "Gothenburg",
  leagueId: 113,
  aliases: ["ifk goteborg", "goteborg"],
},

"elfsborg": {
  teamKey: "elfsborg",
  name: "Elfsborg",
  country: "Sweden",
  city: "Borås",
  leagueId: 113,
  aliases: ["if elfsborg"],
},

"hacken": {
  teamKey: "hacken",
  name: "Häcken",
  country: "Sweden",
  city: "Gothenburg",
  leagueId: 113,
  aliases: ["bk hacken"],
},

"norrkoping": {
  teamKey: "norrkoping",
  name: "Norrköping",
  country: "Sweden",
  city: "Norrköping",
  leagueId: 113,
  aliases: ["ifk norrkoping"],
},

"kalmar": {
  teamKey: "kalmar",
  name: "Kalmar",
  country: "Sweden",
  city: "Kalmar",
  leagueId: 113,
  aliases: ["kalmar ff"],
},

"sirius": {
  teamKey: "sirius",
  name: "Sirius",
  country: "Sweden",
  city: "Uppsala",
  leagueId: 113,
  aliases: ["ik sirius"],
},

"halmstad": {
  teamKey: "halmstad",
  name: "Halmstad",
  country: "Sweden",
  city: "Halmstad",
  leagueId: 113,
  aliases: ["halmstads bk"],
},

"mjalby": {
  teamKey: "mjalby",
  name: "Mjällby",
  country: "Sweden",
  city: "Hällevik",
  leagueId: 113,
  aliases: ["mjalby aif"],
},

"brommapojkarna": {
  teamKey: "brommapojkarna",
  name: "Brommapojkarna",
  country: "Sweden",
  city: "Stockholm",
  leagueId: 113,
  aliases: ["if brommapojkarna"],
},

"varnamo": {
  teamKey: "varnamo",
  name: "Värnamo",
  country: "Sweden",
  city: "Värnamo",
  leagueId: 113,
  aliases: ["ifk varnamo"],
},

"vasteras": {
  teamKey: "vasteras",
  name: "Västerås",
  country: "Sweden",
  city: "Västerås",
  leagueId: 113,
  aliases: ["vasteras sk"],
},

"ga is": {
  teamKey: "ga is",
  name: "GAIS",
  country: "Sweden",
  city: "Gothenburg",
  leagueId: 113,
  aliases: ["gais gothenburg"],
},

  // -------------------------
// Eliteserien (16 teams)
// -------------------------
"bodo-glimt": {
  teamKey: "bodo-glimt",
  name: "Bodø/Glimt",
  country: "Norway",
  city: "Bodø",
  leagueId: 103,
  aliases: ["bodo glimt", "fk bodo glimt"],
},

"rosenborg": {
  teamKey: "rosenborg",
  name: "Rosenborg",
  country: "Norway",
  city: "Trondheim",
  leagueId: 103,
  aliases: ["rosenborg bk"],
},

"molde": {
  teamKey: "molde",
  name: "Molde",
  country: "Norway",
  city: "Molde",
  leagueId: 103,
  aliases: ["molde fk"],
},

"brann": {
  teamKey: "brann",
  name: "Brann",
  country: "Norway",
  city: "Bergen",
  leagueId: 103,
  aliases: ["sk brann"],
},

"viking": {
  teamKey: "viking",
  name: "Viking",
  country: "Norway",
  city: "Stavanger",
  leagueId: 103,
  aliases: ["viking fk"],
},

"stromsgodset": {
  teamKey: "stromsgodset",
  name: "Strømsgodset",
  country: "Norway",
  city: "Drammen",
  leagueId: 103,
  aliases: ["stromsgodset if"],
},

"tromso": {
  teamKey: "tromso",
  name: "Tromsø",
  country: "Norway",
  city: "Tromsø",
  leagueId: 103,
  aliases: ["tromso il"],
},

"lillestrom": {
  teamKey: "lillestrom",
  name: "Lillestrøm",
  country: "Norway",
  city: "Lillestrøm",
  leagueId: 103,
  aliases: ["lillestrom sk"],
},

"odd": {
  teamKey: "odd",
  name: "Odd",
  country: "Norway",
  city: "Skien",
  leagueId: 103,
  aliases: ["odd bk"],
},

"sarpsborg": {
  teamKey: "sarpsborg",
  name: "Sarpsborg 08",
  country: "Norway",
  city: "Sarpsborg",
  leagueId: 103,
  aliases: ["sarpsborg 08 ff"],
},

"haugesund": {
  teamKey: "haugesund",
  name: "Haugesund",
  country: "Norway",
  city: "Haugesund",
  leagueId: 103,
  aliases: ["fk haugesund"],
},

"hamkam": {
  teamKey: "hamkam",
  name: "HamKam",
  country: "Norway",
  city: "Hamar",
  leagueId: 103,
  aliases: ["hamar kam"],
},

"sandefjord": {
  teamKey: "sandefjord",
  name: "Sandefjord",
  country: "Norway",
  city: "Sandefjord",
  leagueId: 103,
  aliases: ["sandefjord fotball"],
},

"kfum-oslo": {
  teamKey: "kfum-oslo",
  name: "KFUM Oslo",
  country: "Norway",
  city: "Oslo",
  leagueId: 103,
  aliases: ["kfum"],
},

"fredrikstad": {
  teamKey: "fredrikstad",
  name: "Fredrikstad",
  country: "Norway",
  city: "Fredrikstad",
  leagueId: 103,
  aliases: ["fredrikstad fk"],
},

"kristiansund": {
  teamKey: "kristiansund",
  name: "Kristiansund",
  country: "Norway",
  city: "Kristiansund",
  leagueId: 103,
  aliases: ["kristiansund bk"],
},

  // -------------------------
// NB I (12 teams)
// -------------------------
"ferencvaros": {
  teamKey: "ferencvaros",
  name: "Ferencváros",
  country: "Hungary",
  city: "Budapest",
  leagueId: 271,
  aliases: ["ferencvarosi tc", "fradi"],
},

"ujpest": {
  teamKey: "ujpest",
  name: "Újpest",
  country: "Hungary",
  city: "Budapest",
  leagueId: 271,
  aliases: ["ujpest fc"],
},

"mtk-budapest": {
  teamKey: "mtk-budapest",
  name: "MTK Budapest",
  country: "Hungary",
  city: "Budapest",
  leagueId: 271,
  aliases: ["mtk"],
},

"puskas-akademia": {
  teamKey: "puskas-akademia",
  name: "Puskás Akadémia",
  country: "Hungary",
  city: "Felcsút",
  leagueId: 271,
  aliases: ["puskas akademia"],
},

"fehervar": {
  teamKey: "fehervar",
  name: "Fehérvár",
  country: "Hungary",
  city: "Székesfehérvár",
  leagueId: 271,
  aliases: ["videoton", "mol fehervar"],
},

"debrecen": {
  teamKey: "debrecen",
  name: "Debrecen",
  country: "Hungary",
  city: "Debrecen",
  leagueId: 271,
  aliases: ["dvsc"],
},

"diosgyor": {
  teamKey: "diosgyor",
  name: "Diósgyőr",
  country: "Hungary",
  city: "Miskolc",
  leagueId: 271,
  aliases: ["dvtk"],
},

"zalaegerszeg": {
  teamKey: "zalaegerszeg",
  name: "Zalaegerszeg",
  country: "Hungary",
  city: "Zalaegerszeg",
  leagueId: 271,
  aliases: ["zete"],
},

"kecskemeti": {
  teamKey: "kecskemeti",
  name: "Kecskeméti TE",
  country: "Hungary",
  city: "Kecskemét",
  leagueId: 271,
  aliases: ["kecskemeti"],
},

"paksi": {
  teamKey: "paksi",
  name: "Paksi",
  country: "Hungary",
  city: "Paks",
  leagueId: 271,
  aliases: ["paksi fc"],
},

"nyiregyhaza": {
  teamKey: "nyiregyhaza",
  name: "Nyíregyháza",
  country: "Hungary",
  city: "Nyíregyháza",
  leagueId: 271,
  aliases: ["nyiregyhaza spartacus"],
},

"gyor": {
  teamKey: "gyor",
  name: "Győr",
  country: "Hungary",
  city: "Győr",
  leagueId: 271,
  aliases: ["eto gyor"],
},

  // -------------------------
// SuperLiga Romania (16 teams)
// -------------------------
"fcsb": {
  teamKey: "fcsb",
  name: "FCSB",
  country: "Romania",
  city: "Bucharest",
  leagueId: 283,
  aliases: ["steaua bucharest", "fcsb bucharest"],
},

"cfr-cluj": {
  teamKey: "cfr-cluj",
  name: "CFR Cluj",
  country: "Romania",
  city: "Cluj-Napoca",
  leagueId: 283,
  aliases: ["cfr"],
},

"universitatea-craiova": {
  teamKey: "universitatea-craiova",
  name: "Universitatea Craiova",
  country: "Romania",
  city: "Craiova",
  leagueId: 283,
  aliases: ["u craiova"],
},

"rapid-bucharest": {
  teamKey: "rapid-bucharest",
  name: "Rapid Bucharest",
  country: "Romania",
  city: "Bucharest",
  leagueId: 283,
  aliases: ["rapid bucuresti"],
},

"dinamo-bucharest": {
  teamKey: "dinamo-bucharest",
  name: "Dinamo Bucharest",
  country: "Romania",
  city: "Bucharest",
  leagueId: 283,
  aliases: ["dinamo bucuresti"],
},

"farul": {
  teamKey: "farul",
  name: "Farul Constanța",
  country: "Romania",
  city: "Constanța",
  leagueId: 283,
  aliases: ["farul constanta"],
},

"sepsi": {
  teamKey: "sepsi",
  name: "Sepsi OSK",
  country: "Romania",
  city: "Sfântu Gheorghe",
  leagueId: 283,
  aliases: ["sepsi osk"],
},

"petrolul": {
  teamKey: "petrolul",
  name: "Petrolul Ploiești",
  country: "Romania",
  city: "Ploiești",
  leagueId: 283,
  aliases: ["petrolul ploiesti"],
},

"uta-arad": {
  teamKey: "uta-arad",
  name: "UTA Arad",
  country: "Romania",
  city: "Arad",
  leagueId: 283,
  aliases: ["uta"],
},

"hermannstadt": {
  teamKey: "hermannstadt",
  name: "Hermannstadt",
  country: "Romania",
  city: "Sibiu",
  leagueId: 283,
  aliases: ["afc hermannstadt"],
},

"botosani": {
  teamKey: "botosani",
  name: "Botoșani",
  country: "Romania",
  city: "Botoșani",
  leagueId: 283,
  aliases: ["fc botosani"],
},

"arges": {
  teamKey: "arges",
  name: "FC Argeș",
  country: "Romania",
  city: "Pitești",
  leagueId: 283,
  aliases: ["arges pitesti"],
},

"otelul": {
  teamKey: "otelul",
  name: "Oțelul Galați",
  country: "Romania",
  city: "Galați",
  leagueId: 283,
  aliases: ["otelul galati"],
},

"poli-iasi": {
  teamKey: "poli-iasi",
  name: "Politehnica Iași",
  country: "Romania",
  city: "Iași",
  leagueId: 283,
  aliases: ["poli iasi"],
},

"unirea-slobozia": {
  teamKey: "unirea-slobozia",
  name: "Unirea Slobozia",
  country: "Romania",
  city: "Slobozia",
  leagueId: 283,
  aliases: ["unirea"],
},

"metaloglobus": {
  teamKey: "metaloglobus",
  name: "Metaloglobus",
  country: "Romania",
  city: "Bucharest",
  leagueId: 283,
  aliases: ["metaloglobus bucharest"],
},

  // -------------------------
// SuperLiga Serbia (16 teams)
// -------------------------
"red-star-belgrade": {
  teamKey: "red-star-belgrade",
  name: "Red Star Belgrade",
  country: "Serbia",
  city: "Belgrade",
  leagueId: 286,
  aliases: ["crvena zvezda", "fk crvena zvezda"],
},

"partizan": {
  teamKey: "partizan",
  name: "Partizan",
  country: "Serbia",
  city: "Belgrade",
  leagueId: 286,
  aliases: ["fk partizan"],
},

"vojvodina": {
  teamKey: "vojvodina",
  name: "Vojvodina",
  country: "Serbia",
  city: "Novi Sad",
  leagueId: 286,
  aliases: ["fk vojvodina"],
},

"cukarički": {
  teamKey: "cukarički",
  name: "Čukarički",
  country: "Serbia",
  city: "Belgrade",
  leagueId: 286,
  aliases: ["fk cukaricki"],
},

"tsc": {
  teamKey: "tsc",
  name: "TSC Bačka Topola",
  country: "Serbia",
  city: "Bačka Topola",
  leagueId: 286,
  aliases: ["tsc backa topola"],
},

"radnicki-nis": {
  teamKey: "radnicki-nis",
  name: "Radnički Niš",
  country: "Serbia",
  city: "Niš",
  leagueId: 286,
  aliases: ["fk radnicki nis"],
},

"napredak": {
  teamKey: "napredak",
  name: "Napredak Kruševac",
  country: "Serbia",
  city: "Kruševac",
  leagueId: 286,
  aliases: ["fk napredak"],
},

"mladost-lucani": {
  teamKey: "mladost-lucani",
  name: "Mladost Lučani",
  country: "Serbia",
  city: "Lučani",
  leagueId: 286,
  aliases: ["fk mladost lucani"],
},

"radnicki-kragujevac": {
  teamKey: "radnicki-kragujevac",
  name: "Radnički Kragujevac",
  country: "Serbia",
  city: "Kragujevac",
  leagueId: 286,
  aliases: ["fk radnicki kragujevac"],
},

"vozodovac": {
  teamKey: "vozodovac",
  name: "Voždovac",
  country: "Serbia",
  city: "Belgrade",
  leagueId: 286,
  aliases: ["fk vozodovac"],
},

"javor": {
  teamKey: "javor",
  name: "Javor Ivanjica",
  country: "Serbia",
  city: "Ivanjica",
  leagueId: 286,
  aliases: ["fk javor"],
},

"zeleznicar": {
  teamKey: "zeleznicar",
  name: "Železničar Pančevo",
  country: "Serbia",
  city: "Pančevo",
  leagueId: 286,
  aliases: ["fk zeleznicar pancevo"],
},

"imts": {
  teamKey: "imts",
  name: "IMT Belgrade",
  country: "Serbia",
  city: "Belgrade",
  leagueId: 286,
  aliases: ["imt novi beograd"],
},

"radnik": {
  teamKey: "radnik",
  name: "Radnik Surdulica",
  country: "Serbia",
  city: "Surdulica",
  leagueId: 286,
  aliases: ["fk radnik surdulica"],
},

"novi-pazar": {
  teamKey: "novi-pazar",
  name: "Novi Pazar",
  country: "Serbia",
  city: "Novi Pazar",
  leagueId: 286,
  aliases: ["fk novi pazar"],
},

"spartak-subotica": {
  teamKey: "spartak-subotica",
  name: "Spartak Subotica",
  country: "Serbia",
  city: "Subotica",
  leagueId: 286,
  aliases: ["fk spartak"],
},

  // -------------------------
// HNL (10 teams)
// -------------------------
"dinamo-zagreb": {
  teamKey: "dinamo-zagreb",
  name: "Dinamo Zagreb",
  country: "Croatia",
  city: "Zagreb",
  leagueId: 210,
  aliases: ["gnk dinamo", "dinamo"],
},

"hajduk-split": {
  teamKey: "hajduk-split",
  name: "Hajduk Split",
  country: "Croatia",
  city: "Split",
  leagueId: 210,
  aliases: ["hnk hajduk", "hajduk"],
},

"rijeka": {
  teamKey: "rijeka",
  name: "Rijeka",
  country: "Croatia",
  city: "Rijeka",
  leagueId: 210,
  aliases: ["hnk rijeka"],
},

"osijek": {
  teamKey: "osijek",
  name: "Osijek",
  country: "Croatia",
  city: "Osijek",
  leagueId: 210,
  aliases: ["nk osijek"],
},

"lokomotiva-zagreb": {
  teamKey: "lokomotiva-zagreb",
  name: "Lokomotiva Zagreb",
  country: "Croatia",
  city: "Zagreb",
  leagueId: 210,
  aliases: ["nk lokomotiva"],
},

"varazdin": {
  teamKey: "varazdin",
  name: "Varaždin",
  country: "Croatia",
  city: "Varaždin",
  leagueId: 210,
  aliases: ["nk varazdin"],
},

"istra-1961": {
  teamKey: "istra-1961",
  name: "Istra 1961",
  country: "Croatia",
  city: "Pula",
  leagueId: 210,
  aliases: ["nk istra"],
},

"slaven-belupo": {
  teamKey: "slaven-belupo",
  name: "Slaven Belupo",
  country: "Croatia",
  city: "Koprivnica",
  leagueId: 210,
  aliases: ["nk slaven"],
},

"gorica": {
  teamKey: "gorica",
  name: "Gorica",
  country: "Croatia",
  city: "Velika Gorica",
  leagueId: 210,
  aliases: ["hnk gorica"],
},

"sibenik": {
  teamKey: "sibenik",
  name: "Šibenik",
  country: "Croatia",
  city: "Šibenik",
  leagueId: 210,
  aliases: ["hnk sibenik"],
},

  // -------------------------
// Slovak Super Liga (12 teams)
// -------------------------
"slovan-bratislava": {
  teamKey: "slovan-bratislava",
  name: "Slovan Bratislava",
  country: "Slovakia",
  city: "Bratislava",
  leagueId: 332,
  aliases: ["sk slovan bratislava", "slovan"],
},

"spartak-trnava": {
  teamKey: "spartak-trnava",
  name: "Spartak Trnava",
  country: "Slovakia",
  city: "Trnava",
  leagueId: 332,
  aliases: ["fc spartak trnava"],
},

"dac-dunajska-streda": {
  teamKey: "dac-dunajska-streda",
  name: "DAC Dunajská Streda",
  country: "Slovakia",
  city: "Dunajská Streda",
  leagueId: 332,
  aliases: ["dac", "dac 1904"],
},

"zilina": {
  teamKey: "zilina",
  name: "Žilina",
  country: "Slovakia",
  city: "Žilina",
  leagueId: 332,
  aliases: ["msk zilina"],
},

"trencin": {
  teamKey: "trencin",
  name: "Trenčín",
  country: "Slovakia",
  city: "Trenčín",
  leagueId: 332,
  aliases: ["as trencin"],
},

"ruzomberok": {
  teamKey: "ruzomberok",
  name: "Ružomberok",
  country: "Slovakia",
  city: "Ružomberok",
  leagueId: 332,
  aliases: ["mfk ruzomberok"],
},

"banska-bystrica": {
  teamKey: "banska-bystrica",
  name: "Banská Bystrica",
  country: "Slovakia",
  city: "Banská Bystrica",
  leagueId: 332,
  aliases: ["dukla banska bystrica"],
},

"skalica": {
  teamKey: "skalica",
  name: "Skalica",
  country: "Slovakia",
  city: "Skalica",
  leagueId: 332,
  aliases: ["mfk skalica"],
},

"michalovce": {
  teamKey: "michalovce",
  name: "Michalovce",
  country: "Slovakia",
  city: "Michalovce",
  leagueId: 332,
  aliases: ["michalovce fc"],
},

"komarno": {
  teamKey: "komarno",
  name: "Komárno",
  country: "Slovakia",
  city: "Komárno",
  leagueId: 332,
  aliases: ["kfc komarno"],
},

"podbrezova": {
  teamKey: "podbrezova",
  name: "Podbrezová",
  country: "Slovakia",
  city: "Podbrezová",
  leagueId: 332,
  aliases: ["fk zeleziarne podbrezova"],
},

"kosiče": {
  teamKey: "kosice",
  name: "Košice",
  country: "Slovakia",
  city: "Košice",
  leagueId: 332,
  aliases: ["fc kosice"],
},

  // -------------------------
// PrvaLiga Slovenia (10 teams)
// -------------------------
"olimpija-ljubljana": {
  teamKey: "olimpija-ljubljana",
  name: "Olimpija Ljubljana",
  country: "Slovenia",
  city: "Ljubljana",
  leagueId: 373,
  aliases: ["nk olimpija", "olimpija"],
},

"maribor": {
  teamKey: "maribor",
  name: "Maribor",
  country: "Slovenia",
  city: "Maribor",
  leagueId: 373,
  aliases: ["nk maribor"],
},

"celje": {
  teamKey: "celje",
  name: "Celje",
  country: "Slovenia",
  city: "Celje",
  leagueId: 373,
  aliases: ["nk celje"],
},

"koper": {
  teamKey: "koper",
  name: "Koper",
  country: "Slovenia",
  city: "Koper",
  leagueId: 373,
  aliases: ["fc koper"],
},

"domzale": {
  teamKey: "domzale",
  name: "Domžale",
  country: "Slovenia",
  city: "Domžale",
  leagueId: 373,
  aliases: ["nk domzale"],
},

"mura": {
  teamKey: "mura",
  name: "Mura",
  country: "Slovenia",
  city: "Murska Sobota",
  leagueId: 373,
  aliases: ["ns mura"],
},

"radomlje": {
  teamKey: "radomlje",
  name: "Radomlje",
  country: "Slovenia",
  city: "Radomlje",
  leagueId: 373,
  aliases: ["nk radomlje"],
},

"bravo": {
  teamKey: "bravo",
  name: "Bravo",
  country: "Slovenia",
  city: "Ljubljana",
  leagueId: 373,
  aliases: ["nk bravo"],
},

"aluminij": {
  teamKey: "aluminij",
  name: "Aluminij",
  country: "Slovenia",
  city: "Kidričevo",
  leagueId: 373,
  aliases: ["nk aluminij"],
},

"nafta": {
  teamKey: "nafta",
  name: "Nafta 1903",
  country: "Slovenia",
  city: "Lendava",
  leagueId: 373,
  aliases: ["nk nafta"],
},

  // -------------------------
// First League Bulgaria (16 teams)
// -------------------------
"ludogorets": {
  teamKey: "ludogorets",
  name: "Ludogorets",
  country: "Bulgaria",
  city: "Razgrad",
  leagueId: 172,
  aliases: ["ludogorets razgrad"],
},

"levski-sofia": {
  teamKey: "levski-sofia",
  name: "Levski Sofia",
  country: "Bulgaria",
  city: "Sofia",
  leagueId: 172,
  aliases: ["levski"],
},

"cska-sofia": {
  teamKey: "cska-sofia",
  name: "CSKA Sofia",
  country: "Bulgaria",
  city: "Sofia",
  leagueId: 172,
  aliases: ["cska"],
},

"cska-1948": {
  teamKey: "cska-1948",
  name: "CSKA 1948",
  country: "Bulgaria",
  city: "Sofia",
  leagueId: 172,
  aliases: ["cska 1948 sofia"],
},

"lokomotiv-plovdiv": {
  teamKey: "lokomotiv-plovdiv",
  name: "Lokomotiv Plovdiv",
  country: "Bulgaria",
  city: "Plovdiv",
  leagueId: 172,
  aliases: ["loko plovdiv"],
},

"botev-plovdiv": {
  teamKey: "botev-plovdiv",
  name: "Botev Plovdiv",
  country: "Bulgaria",
  city: "Plovdiv",
  leagueId: 172,
  aliases: ["botev"],
},

"chernomorets": {
  teamKey: "chernomorets",
  name: "Cherno More",
  country: "Bulgaria",
  city: "Varna",
  leagueId: 172,
  aliases: ["chernomore varna"],
},

"beroe": {
  teamKey: "beroe",
  name: "Beroe",
  country: "Bulgaria",
  city: "Stara Zagora",
  leagueId: 172,
  aliases: ["beroe stara zagora"],
},

"slavia-sofia": {
  teamKey: "slavia-sofia",
  name: "Slavia Sofia",
  country: "Bulgaria",
  city: "Sofia",
  leagueId: 172,
  aliases: ["slavia"],
},

"lokomotiv-sofia": {
  teamKey: "lokomotiv-sofia",
  name: "Lokomotiv Sofia",
  country: "Bulgaria",
  city: "Sofia",
  leagueId: 172,
  aliases: ["loko sofia"],
},

"septemvri": {
  teamKey: "septemvri",
  name: "Septemvri Sofia",
  country: "Bulgaria",
  city: "Sofia",
  leagueId: 172,
  aliases: ["septemvri sofia"],
},

"hebar": {
  teamKey: "hebar",
  name: "Hebar",
  country: "Bulgaria",
  city: "Pazardzhik",
  leagueId: 172,
  aliases: ["hebar pazardzhik"],
},

"etyr": {
  teamKey: "etyr",
  name: "Etyr",
  country: "Bulgaria",
  city: "Veliko Tarnovo",
  leagueId: 172,
  aliases: ["etyr veliko tarnovo"],
},

"pirin": {
  teamKey: "pirin",
  name: "Pirin Blagoevgrad",
  country: "Bulgaria",
  city: "Blagoevgrad",
  leagueId: 172,
  aliases: ["pirin blagoevgrad"],
},

"ardа": {
  teamKey: "arda",
  name: "Arda Kardzhali",
  country: "Bulgaria",
  city: "Kardzhali",
  leagueId: 172,
  aliases: ["arda"],
},

"spartak-varna": {
  teamKey: "spartak-varna",
  name: "Spartak Varna",
  country: "Bulgaria",
  city: "Varna",
  leagueId: 172,
  aliases: ["spartak"],
},

  // -------------------------
// First Division Cyprus (14 teams)
// -------------------------
"apoel": {
  teamKey: "apoel",
  name: "APOEL",
  country: "Cyprus",
  city: "Nicosia",
  leagueId: 318,
  aliases: ["apoel nicosia"],
},

"omonia-nicosia": {
  teamKey: "omonia-nicosia",
  name: "Omonia Nicosia",
  country: "Cyprus",
  city: "Nicosia",
  leagueId: 318,
  aliases: ["omonia"],
},

"aek-larnaca": {
  teamKey: "aek-larnaca",
  name: "AEK Larnaca",
  country: "Cyprus",
  city: "Larnaca",
  leagueId: 318,
  aliases: ["aek"],
},

"anorthosis": {
  teamKey: "anorthosis",
  name: "Anorthosis",
  country: "Cyprus",
  city: "Famagusta",
  leagueId: 318,
  aliases: ["anorthosis famagusta"],
},

"apollon-limassol": {
  teamKey: "apollon-limassol",
  name: "Apollon Limassol",
  country: "Cyprus",
  city: "Limassol",
  leagueId: 318,
  aliases: ["apollon"],
},

"ael-limassol": {
  teamKey: "ael-limassol",
  name: "AEL Limassol",
  country: "Cyprus",
  city: "Limassol",
  leagueId: 318,
  aliases: ["ael"],
},

"aris-limassol": {
  teamKey: "aris-limassol",
  name: "Aris Limassol",
  country: "Cyprus",
  city: "Limassol",
  leagueId: 318,
  aliases: ["aris"],
},

"karmiotissa": {
  teamKey: "karmiotissa",
  name: "Karmiotissa",
  country: "Cyprus",
  city: "Pano Polemidia",
  leagueId: 318,
  aliases: ["karmiotissa fc"],
},

"ethnikos-achna": {
  teamKey: "ethnikos-achna",
  name: "Ethnikos Achna",
  country: "Cyprus",
  city: "Achna",
  leagueId: 318,
  aliases: ["ethnikos"],
},

"nea-salamis": {
  teamKey: "nea-salamis",
  name: "Nea Salamis",
  country: "Cyprus",
  city: "Famagusta",
  leagueId: 318,
  aliases: ["nea salamis famagusta"],
},

"pafos": {
  teamKey: "pafos",
  name: "Pafos",
  country: "Cyprus",
  city: "Paphos",
  leagueId: 318,
  aliases: ["pafos fc"],
},

"aez-zakakiou": {
  teamKey: "aez-zakakiou",
  name: "AEZ Zakakiou",
  country: "Cyprus",
  city: "Limassol",
  leagueId: 318,
  aliases: ["aez"],
},

"enosis-paralimni": {
  teamKey: "enosis-paralimni",
  name: "Enosis Paralimni",
  country: "Cyprus",
  city: "Paralimni",
  leagueId: 318,
  aliases: ["enosis"],
},

"doxa-katokopias": {
  teamKey: "doxa-katokopias",
  name: "Doxa Katokopias",
  country: "Cyprus",
  city: "Katokopia",
  leagueId: 318,
  aliases: ["doxa"],
},

  // -------------------------
// Veikkausliiga (12 teams)
// -------------------------
"hjk": {
  teamKey: "hjk",
  name: "HJK",
  country: "Finland",
  city: "Helsinki",
  leagueId: 244,
  aliases: ["hjk helsinki"],
},

"kups": {
  teamKey: "kups",
  name: "KuPS",
  country: "Finland",
  city: "Kuopio",
  leagueId: 244,
  aliases: ["kuopion palloseura"],
},

"ilves": {
  teamKey: "ilves",
  name: "Ilves",
  country: "Finland",
  city: "Tampere",
  leagueId: 244,
  aliases: ["ilves tampere"],
},

"haka": {
  teamKey: "haka",
  name: "Haka",
  country: "Finland",
  city: "Valkeakoski",
  leagueId: 244,
  aliases: ["fc haka"],
},

"inter-turku": {
  teamKey: "inter-turku",
  name: "Inter Turku",
  country: "Finland",
  city: "Turku",
  leagueId: 244,
  aliases: ["fc inter turku"],
},

"ifk-mariehamn": {
  teamKey: "ifk-mariehamn",
  name: "IFK Mariehamn",
  country: "Finland",
  city: "Mariehamn",
  leagueId: 244,
  aliases: ["mariehamn"],
},

"vaasan-palloseura": {
  teamKey: "vaasan-palloseura",
  name: "Vaasan Palloseura",
  country: "Finland",
  city: "Vaasa",
  leagueId: 244,
  aliases: ["vps"],
},

"seinajoen": {
  teamKey: "seinajoen",
  name: "Seinäjoen JK",
  country: "Finland",
  city: "Seinäjoki",
  leagueId: 244,
  aliases: ["sjk"],
},

"gnistan": {
  teamKey: "gnistan",
  name: "Gnistan",
  country: "Finland",
  city: "Helsinki",
  leagueId: 244,
  aliases: ["if gnistan"],
},

"ac-oulu": {
  teamKey: "ac-oulu",
  name: "AC Oulu",
  country: "Finland",
  city: "Oulu",
  leagueId: 244,
  aliases: ["oulu"],
},

"lahti": {
  teamKey: "lahti",
  name: "Lahti",
  country: "Finland",
  city: "Lahti",
  leagueId: 244,
  aliases: ["fc lahti"],
},

"jaro": {
  teamKey: "jaro",
  name: "Jaro",
  country: "Finland",
  city: "Jakobstad",
  leagueId: 244,
  aliases: ["ff jaro"],
},

  // -------------------------
// Besta Deild (12 teams)
// -------------------------
"valur": {
  teamKey: "valur",
  name: "Valur",
  country: "Iceland",
  city: "Reykjavík",
  leagueId: 164,
  aliases: ["valur reykjavik"],
},

"kr-reykjavik": {
  teamKey: "kr-reykjavik",
  name: "KR Reykjavík",
  country: "Iceland",
  city: "Reykjavík",
  leagueId: 164,
  aliases: ["kr", "kr reykjavik"],
},

"fh": {
  teamKey: "fh",
  name: "FH",
  country: "Iceland",
  city: "Hafnarfjörður",
  leagueId: 164,
  aliases: ["fh hafnarfjordur"],
},

"breidablik": {
  teamKey: "breidablik",
  name: "Breiðablik",
  country: "Iceland",
  city: "Kópavogur",
  leagueId: 164,
  aliases: ["breidablik kopavogur"],
},

"stjarnan": {
  teamKey: "stjarnan",
  name: "Stjarnan",
  country: "Iceland",
  city: "Garðabær",
  leagueId: 164,
  aliases: ["stjarnan gardabaer"],
},

"vikkingur-reykjavik": {
  teamKey: "vikkingur-reykjavik",
  name: "Víkingur Reykjavík",
  country: "Iceland",
  city: "Reykjavík",
  leagueId: 164,
  aliases: ["vikingur"],
},

"fram": {
  teamKey: "fram",
  name: "Fram",
  country: "Iceland",
  city: "Reykjavík",
  leagueId: 164,
  aliases: ["fram reykjavik"],
},

"hk": {
  teamKey: "hk",
  name: "HK",
  country: "Iceland",
  city: "Kópavogur",
  leagueId: 164,
  aliases: ["hk kopavogur"],
},

"ka": {
  teamKey: "ka",
  name: "KA",
  country: "Iceland",
  city: "Akureyri",
  leagueId: 164,
  aliases: ["ka akureyri"],
},

"vikingur": {
  teamKey: "vikingur",
  name: "Víkingur Ólafsvík",
  country: "Iceland",
  city: "Ólafsvík",
  leagueId: 164,
  aliases: ["vikingur olafsvik"],
},

"fylkir": {
  teamKey: "fylkir",
  name: "Fylkir",
  country: "Iceland",
  city: "Reykjavík",
  leagueId: 164,
  aliases: ["fylkir reykjavik"],
},

"keflavik": {
  teamKey: "keflavik",
  name: "Keflavík",
  country: "Iceland",
  city: "Keflavík",
  leagueId: 164,
  aliases: ["keflavik fc"],
},
  
};

/**
 * Export a single Set of popular IDs for fast lookups (Home scoring, etc.)
 */
export const POPULAR_TEAM_IDS = new Set<number>(
  POPULAR_TEAM_KEYS.map((k) => teams[k]?.teamId).filter((n): n is number => typeof n === "number")
);

export function getPopularTeams(): TeamRecord[] {
  return POPULAR_TEAM_KEYS.map((k) => teams[k]).filter(Boolean);
}

/**
 * Deterministic resolver:
 * - matches canonical team keys
 * - matches aliases
 * - diacritics-safe and punctuation-safe
 *
 * Returns the canonical teamKey (e.g. "bayern-munich") or null.
 */
let _aliasToTeamKey: Map<string, string> | null = null;

function buildAliasMap(): Map<string, string> {
  const map = new Map<string, string>();

  Object.values(teams).forEach((t) => {
    const canonical = normalizeTeamKey(t.teamKey);
    if (canonical) map.set(canonical, t.teamKey);

    const nameKey = normalizeTeamKey(t.name);
    if (nameKey) map.set(nameKey, t.teamKey);

    (t.aliases ?? []).forEach((a) => {
      const k = normalizeTeamKey(a);
      if (!k) return;
      // first write wins (deterministic)
      if (!map.has(k)) map.set(k, t.teamKey);
    });
  });

  return map;
}

export function resolveTeamKey(input: string): string | null {
  const k = normalizeTeamKey(input);
  if (!k) return null;

  if (!_aliasToTeamKey) _aliasToTeamKey = buildAliasMap();
  return _aliasToTeamKey.get(k) ?? null;
}

export function getTeam(teamInput: string): TeamRecord | null {
  const resolved = resolveTeamKey(teamInput);
  const key = resolved ? normalizeTeamKey(resolved) : normalizeTeamKey(teamInput);
  return teams[key] ?? null;
}

/**
 * Search helper (V1): returns a scored list based on name/aliases.
 */
export function searchTeams(query: string, limit = 10): TeamRecord[] {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [];

  const list = Object.values(teams);

  const scored = list
    .map((t) => {
      const name = t.name.toLowerCase();
      const aliases = (t.aliases ?? []).map((a) => a.toLowerCase());

      let score = 0;

      if (name === q) score += 100;
      if (aliases.includes(q)) score += 95;

      if (name.startsWith(q)) score += 70;
      if (aliases.some((a) => a.startsWith(q))) score += 60;

      if (name.includes(q)) score += 35;
      if (aliases.some((a) => a.includes(q))) score += 25;

      if (t.leagueId) score += 5;

      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit))
    .map((x) => x.t);

  return scored;
}

/**
 * Utility: attempt to infer league option for a team (if linked)
 */
export function leagueForTeam(t: TeamRecord): LeagueOption | null {
  if (!t.leagueId) return null;
  const match = LEAGUES.find((l) => l.leagueId === t.leagueId);
  if (!match) return null;

  const season = typeof t.season === "number" ? t.season : match.season;
  return { ...match, season };
}

export default teams;
