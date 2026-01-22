// src/utils/city.ts

function stripDiacritics(input: string): string {
  // Converts "München" -> "Munchen", "København" -> "Kobenhavn", etc.
  // Uses Unicode normalization, no dependencies.
  try {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    // Some JS engines can theoretically choke on normalize; keep it safe.
    return input;
  }
}

export function normalizeCityKey(input: string | undefined | null): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  const s = stripDiacritics(raw)
    .toLowerCase()
    .replace(/[,/|].*$/, "") // strip after comma/slash/pipe
    .replace(/\(.*?\)/g, "") // remove parenthesis
    .replace(/\b(france|spain|italy|germany|uk|u\.k\.|england)\b/g, "") // light cleanup; extend later if you want
    .replace(/[^a-z0-9\s-]/g, "") // remove punctuation
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
