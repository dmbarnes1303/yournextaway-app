type AliasMap = Record<string, string[]>;

const TEAM_ALIASES: AliasMap = {
  inter: ["inter", "inter milan", "internazionale"],
  roma: ["roma", "as roma"],
  psg: ["psg", "paris sg", "paris saint-germain", "paris saint germain"],
  bayern: ["bayern", "bayern munich", "fc bayern munich", "fc bayern"],
  "man utd": ["man utd", "manchester united"],
  "man city": ["man city", "manchester city"],
  atletico: ["atletico", "atletico madrid", "atlético madrid"],
  barcelona: ["barcelona", "fc barcelona", "barca", "barça"],
  juventus: ["juventus", "juve"],
  milan: ["milan", "ac milan"],
  napoli: ["napoli", "ssc napoli"],
  sporting: ["sporting", "sporting cp", "sporting lisbon"],
  benfica: ["benfica", "sl benfica"],
  porto: ["porto", "fc porto"],
  ajax: ["ajax", "afc ajax"],
  "psv": ["psv", "psv eindhoven"],
  "marseille": ["marseille", "olympique de marseille"],
  "lyon": ["lyon", "olympique lyonnais"],
  "newcastle": ["newcastle", "newcastle united"],
  "spurs": ["spurs", "tottenham", "tottenham hotspur"],
};

function clean(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => clean(v)).filter(Boolean)));
}

export function expandTeamAliases(name: string): string[] {
  const key = clean(name);
  if (!key) return [];

  for (const aliases of Object.values(TEAM_ALIASES)) {
    const normalized = unique(aliases);
    if (normalized.includes(key)) {
      return normalized;
    }
  }

  return [key];
}

export function getPreferredTeamName(name: string): string {
  const variants = expandTeamAliases(name);
  return variants[0] ?? clean(name);
}
