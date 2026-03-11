const TEAM_ALIASES: Record<string, string[]> = {
  "inter": ["inter", "inter milan", "internazionale"],
  "roma": ["roma", "as roma"],
  "psg": ["psg", "paris sg", "paris saint germain", "paris saint-germain"],
  "bayern": ["bayern", "bayern munich", "fc bayern"],
  "man utd": ["man utd", "manchester united"],
  "man city": ["man city", "manchester city"],
  "atletico": ["atletico", "atlético madrid", "atletico madrid"],
  "real madrid": ["real madrid"],
  "barcelona": ["barcelona", "fc barcelona", "barça"],
  "juventus": ["juventus", "juve"],
  "ac milan": ["ac milan", "milan"],
};

function clean(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

export function expandTeamAliases(name: string): string[] {
  const key = clean(name);

  for (const aliases of Object.values(TEAM_ALIASES)) {
    if (aliases.includes(key)) {
      return aliases;
    }
  }

  return [name];
}
