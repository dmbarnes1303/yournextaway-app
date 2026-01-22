// src/utils/city.ts

export function normalizeCityKey(input: string | undefined | null): string {
  const s = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[,/|].*$/, "") // strip after comma/slash/pipe
    .replace(/\(.*?\)/g, "") // remove parenthesis
    .replace(/[^a-z0-9\s-]/g, "") // remove punctuation / accents already stripped by API most of the time
    .trim()
    .replace(/\s+/g, "-") // spaces -> hyphen
    .replace(/-+/g, "-") // collapse hyphens
    .replace(/^-|-$/g, ""); // trim hyphens

  // Minimal alias map (extend later)
  if (s === "roma") return "rome";
  if (s === "muenchen") return "munich";
  if (s === "munchen") return "munich";

  return s;
}
