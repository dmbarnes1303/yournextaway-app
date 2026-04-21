type AliasMap = Record<string, string[]>;

const TEAM_ALIASES: AliasMap = {
  arsenal: ["arsenal", "arsenal fc"],
  chelsea: ["chelsea", "chelsea fc"],
  liverpool: ["liverpool", "liverpool fc"],
  manchesterunited: ["manchester united", "man utd", "man united", "manchester utd"],
  manchestercity: ["manchester city", "man city", "manchester city fc"],
  tottenhamhotspur: ["tottenham hotspur", "tottenham", "spurs"],
  newcastleunited: ["newcastle united", "newcastle", "newcastle utd"],
  astonvilla: ["aston villa", "aston villa fc"],
  westhamunited: ["west ham united", "west ham"],
  wolverhamptonwanderers: ["wolverhampton wanderers", "wolves", "wolverhampton"],
  brightonandhovealbion: [
    "brighton and hove albion",
    "brighton & hove albion",
    "brighton",
  ],
  leicestercity: ["leicester city", "leicester"],
  leedsunited: ["leeds united", "leeds"],
  everton: ["everton", "everton fc"],
  southampton: ["southampton", "southampton fc"],
  brentford: ["brentford", "brentford fc"],
  fulham: ["fulham", "fulham fc"],
  crystalpalace: ["crystal palace", "palace", "crystal palace fc"],
  nottinghamforest: ["nottingham forest", "forest", "nottm forest"],

  internazionale: ["inter", "inter milan", "internazionale", "fc internazionale milano"],
  acmilan: ["ac milan", "milan", "associazione calcio milan"],
  juventus: ["juventus", "juve", "juventus fc"],
  roma: ["roma", "as roma", "a s roma"],
  lazio: ["lazio", "ss lazio", "s s lazio"],
  napoli: ["napoli", "ssc napoli", "s s c napoli"],
  atalanta: ["atalanta", "atalanta bc"],
  fiorentina: ["fiorentina", "acf fiorentina"],
  bologna: ["bologna", "bologna fc"],
  torino: ["torino", "torino fc"],
  parma: ["parma", "parma calcio", "parma calcio 1913"],

  barcelona: ["barcelona", "fc barcelona", "barca", "barça"],
  realmadrid: ["real madrid", "real madrid cf"],
  atleticodemadrid: ["atletico madrid", "atlético madrid", "atletico", "club atletico de madrid"],
  sevilla: ["sevilla", "sevilla fc"],
  valencia: ["valencia", "valencia cf"],
  villarreal: ["villarreal", "villarreal cf"],
  realbetis: ["real betis", "betis", "real betis balompie", "real betis balompié"],
  realsociedad: ["real sociedad", "sociedad", "real sociedad de futbol", "real sociedad de fútbol"],
  athleticclub: ["athletic club", "athletic bilbao", "bilbao"],
  girona: ["girona", "girona fc"],

  parissaintgermain: ["paris saint germain", "paris saint-germain", "paris sg", "psg"],
  marseille: ["marseille", "olympique de marseille"],
  lyon: ["lyon", "olympique lyonnais"],
  monaco: ["monaco", "as monaco"],
  lille: ["lille", "losc", "lille osc"],
  nice: ["nice", "ogc nice"],

  bayernmunich: ["bayern munich", "bayern", "fc bayern", "fc bayern munich", "bayern münchen"],
  borussiadortmund: ["borussia dortmund", "dortmund", "bvb"],
  bayerleverkusen: ["bayer leverkusen", "leverkusen", "bayer 04 leverkusen"],
  rbleipzig: ["rb leipzig", "leipzig", "rasenballsport leipzig"],
  eintrachtfrankfurt: ["eintracht frankfurt", "frankfurt"],
  borussiamonchengladbach: [
    "borussia monchengladbach",
    "borussia mönchengladbach",
    "monchengladbach",
    "gladbach",
  ],
  vfbstuttgart: ["vfb stuttgart", "stuttgart"],
  vflwolfsburg: ["vfl wolfsburg", "wolfsburg"],
  tsghoffenheim: ["tsg hoffenheim", "hoffenheim", "1899 hoffenheim"],

  ajax: ["ajax", "afc ajax"],
  psv: ["psv", "psv eindhoven"],
  feyenoord: ["feyenoord", "feyenoord rotterdam"],
  fctwente: ["fc twente", "twente"],
  azalkmaar: ["az alkmaar", "az"],

  benfica: ["benfica", "sl benfica", "sport lisboa e benfica"],
  sportingcp: ["sporting cp", "sporting", "sporting lisbon", "sporting clube de portugal"],
  porto: ["porto", "fc porto", "f c porto"],

  celtic: ["celtic", "celtic fc"],
  rangers: ["rangers", "rangers fc"],

  galatasaray: ["galatasaray", "galatasaray sk"],
  fenerbahce: ["fenerbahce", "fenerbahçe", "fenerbahce sk", "fenerbahçe sk"],
  besiktas: ["besiktas", "beşiktaş", "besiktas jk", "beşiktaş jk"],
};

const REMOVABLE_WORDS = new Set([
  "fc",
  "cf",
  "afc",
  "sc",
  "sk",
  "jk",
  "club",
  "de",
  "the",
]);

function clean(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return clean(value)
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => clean(v)).filter(Boolean)));
}

function titleCaseFromClean(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function canonicalKey(value: string): string {
  return clean(value).replace(/\s+/g, "");
}

function stripRemovableWords(tokens: string[]): string[] {
  return tokens.filter((token) => !REMOVABLE_WORDS.has(token));
}

function generateLooseVariants(name: string): string[] {
  const base = clean(name);
  if (!base) return [];

  const variants = new Set<string>();
  variants.add(base);

  const tokens = tokenize(base);
  const strippedTokens = stripRemovableWords(tokens);

  if (strippedTokens.length) {
    variants.add(strippedTokens.join(" "));
  }

  const softStripped = base
    .replace(/\bunited\b/g, "")
    .replace(/\bcity\b/g, "")
    .replace(/\bhotspur\b/g, "")
    .replace(/\bwanderers\b/g, "")
    .replace(/\balbion\b/g, "")
    .replace(/\bathletic\b/g, "")
    .replace(/\breal\b/g, "")
    .replace(/\bassociation\b/g, "")
    .replace(/\bcalcio\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (softStripped && softStripped !== base) {
    variants.add(softStripped);
  }

  if (tokens.length >= 2) {
    variants.add(tokens.slice(0, 2).join(" "));
    variants.add(tokens[0]);
  }

  if (strippedTokens.length >= 2) {
    variants.add(strippedTokens.slice(0, 2).join(" "));
    variants.add(strippedTokens[0]);
  }

  return unique(Array.from(variants));
}

export function expandTeamAliases(name: string): string[] {
  const normalized = clean(name);
  if (!normalized) return [];

  const inputKey = canonicalKey(normalized);

  for (const aliases of Object.values(TEAM_ALIASES)) {
    const normalizedAliases = unique(aliases);
    const aliasKeys = new Set(normalizedAliases.map((alias) => canonicalKey(alias)));

    if (aliasKeys.has(inputKey)) {
      return unique([
        ...normalizedAliases,
        ...normalizedAliases.flatMap(generateLooseVariants),
      ]);
    }
  }

  return unique([normalized, ...generateLooseVariants(normalized)]);
}

export function getPreferredTeamName(name: string): string {
  const aliases = expandTeamAliases(name);
  if (aliases.length === 0) return clean(name);
  return titleCaseFromClean(aliases[0]);
}
