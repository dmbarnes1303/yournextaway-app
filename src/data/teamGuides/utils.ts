// src/data/teamGuides/utils.ts

export function normalizeTeamKey(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, "")     // remove bracketed bits
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[,/|].*$/, "")     // strip suffix after comma/slash/pipe
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9]+/g, "-") // non-alnum -> hyphen
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function titleFromKey(key: unknown): string {
  const s = String(key ?? "").trim();
  if (!s) return "Team";
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
