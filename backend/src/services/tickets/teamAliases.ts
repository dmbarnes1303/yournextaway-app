type AliasMap = Record<string, string[]>;

const TEAM_ALIASES: AliasMap = {
  arsenal: ["arsenal", "arsenal fc"],
  chelsea: ["chelsea", "chelsea fc"],
  liverpool: ["liverpool", "liverpool fc"],
  "man utd": ["man utd", "manchester united", "man united", "manchester utd"],
  "man city": ["man city", "manchester city", "manchester city fc"],
  tottenham: ["tottenham", "tottenham hotspur", "spurs"],
  newcastle: ["newcastle", "newcastle united", "newcastle utd"],
  astonvilla: ["aston villa", "aston villa fc"],
  westham: ["west ham", "west ham united"],
  wolves: ["wolves", "wolverhampton", "wolverhampton wanderers"],
  brighton: ["brighton", "brighton and hove albion", "brighton & hove albion"],
  leicester: ["leicester", "leicester city"],
  leeds: ["leeds", "leeds united"],
  everton: ["everton", "everton fc"],
  southampton: ["southampton", "southampton fc"],
  brentford: ["brentford", "brentford fc"],
  fulham: ["fulham", "fulham fc"],
  crystalpalace: ["crystal palace", "palace", "crystal palace fc"],
  nottinghamforest: ["nottingham forest", "forest", "nottm forest"],

  inter: ["inter", "inter milan", "internazionale", "fc internazionale milano"],
  milan: ["milan", "ac milan", "associazione calcio milan"],
  juventus: ["juventus", "juve", "juventus fc"],
  roma: ["roma", "as roma", "a.s. roma"],
  lazio: ["lazio", "ss lazio", "s.s. lazio"],
  napoli: ["napoli", "ssc napoli", "s.s.c. napoli"],
  atalanta: ["atalanta", "atalanta bc"],
  fiorentina: ["fiorentina", "acf fiorentina"],
  bologna: ["bologna", "bologna fc"],
  torino: ["torino", "torino fc"],

  barcelona: ["barcelona", "fc barcelona", "barca", "barça"],
  realmadrid: ["real madrid", "real madrid cf"],
  atletico: ["atletico", "atletico madrid", "atlético madrid", "club atletico de madrid"],
  sevilla: ["sevilla", "sevilla fc"],
  valencia: ["valencia", "valencia cf"],
  villarreal: ["villarreal", "villarreal cf"],
  betis: ["betis", "real betis", "real betis balompie", "real betis balompié"],
  sociedad: ["real sociedad", "sociedad", "real sociedad de futbol", "real sociedad de fútbol"],
  bilbao: ["athletic club", "athletic bilbao", "bilbao"],
  girona: ["girona", "girona fc"],

  psg: ["psg", "paris sg", "paris saint-germain", "paris saint germain"],
  marseille: ["marseille", "olympique de marseille"],
  lyon: ["lyon", "olympique lyonnais"],
  monaco: ["monaco", "as monaco"],
  lille: ["lille", "losc", "lille osc"],
  nice: ["nice", "ogc nice"],

  bayern: ["bayern", "bayern munich", "fc bayern", "fc bayern munich", "bayern münchen"],
  dortmund: ["dortmund", "borussia dortmund", "bvb"],
  leverkusen: ["leverkusen", "bayer leverkusen", "bayer 04 leverkusen"],
  leipzig: ["leipzig", "rb leipzig", "rasenballsport leipzig"],
  frankfurt: ["frankfurt", "eintracht frankfurt"],
  gladbach: ["gladbach", "borussia monchengladbach", "borussia mönchengladbach", "monchengladbach"],
  stuttgart: ["stuttgart", "vfb stuttgart", "vfb"],
  wolfsburg: ["wolfsburg", "vfl wolfsburg"],
  hoffenheim: ["hoffenheim", "tsg hoffenheim", "1899 hoffenheim"],

  ajax: ["ajax", "afc ajax"],
  psv: ["psv", "psv eindhoven"],
  feyenoord: ["feyenoord", "feyenoord rotterdam"],
  twente: ["twente", "fc twente"],
  az: ["az", "az alkmaar"],

  benfica: ["benfica", "sl benfica", "sport lisboa e benfica"],
  sporting: ["sporting", "sporting cp", "sporting lisbon", "sporting clube de portugal"],
  porto: ["porto", "fc porto", "f.c. porto"],

  celtic: ["celtic", "celtic fc"],
  rangers: ["rangers", "rangers fc"],

  galatasaray: ["galatasaray", "galatasaray sk"],
  fenerbahce: ["fenerbahce", "fenerbahçe", "fenerbahce sk", "fenerbahçe sk"],
  besiktas: ["besiktas", "beşiktaş", "besiktas jk", "beşiktaş jk"],
};

function clean(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bfc\b/g, " ")
    .replace(/\bcf\b/g, " ")
    .replace(/\bafc\b/g, " ")
    .replace(/\bsc\b/g, " ")
    .replace(/\bsk\b/g, " ")
    .replace(/\bjk\b/g, " ")
    .replace(/\bclub\b/g, " ")
    .replace(/\bde\b/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function generateLooseVariants(name: string): string[] {
  const base = clean(name);
  if (!base) return [];

  const variants = new Set<string>();
  variants.add(base);

  const stripped = base
    .replace(/\bunited\b/g, "")
    .replace(/\bcity\b/g, "")
    .replace(/\bhotspur\b/g, "")
    .replace(/\bwanderers\b/g, "")
    .replace(/\balbion\b/g, "")
    .replace(/\bathletic\b/g, "")
    .replace(/\breal\b/g, "")
    .replace(/\bassociation\b/g, "")
    .replace(/\bcalcio\b/g, "")
    .replace(/\bsporting\b/g, "sporting")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped && stripped !== base) {
    variants.add(stripped);
  }

  const parts = base.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    variants.add(parts.slice(0, 2).join(" "));
    variants.add(parts[0]);
  }

  return Array.from(variants).filter(Boolean);
}

export function expandTeamAliases(name: string): string[] {
  const key = clean(name);
  if (!key) return [];

  for (const aliases of Object.values(TEAM_ALIASES)) {
    const normalized = unique(aliases);
    if (normalized.includes(key)) {
      return unique([...normalized, ...normalized.flatMap(generateLooseVariants)]);
    }
  }

  return unique([key, ...generateLooseVariants(key)]);
}

export function getPreferredTeamName(name: string): string {
  const aliases = expandTeamAliases(name);
  if (aliases.length === 0) return clean(name);
  return titleCaseFromClean(aliases[0]);
}
