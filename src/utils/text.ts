export function titleCase(input: string): string {
  const s = (input ?? "").trim();
  if (!s) return s;

  // Keep small words lowercase unless first/last.
  const small = new Set(["a","an","and","as","at","but","by","for","from","in","nor","of","on","or","per","the","to","vs","via","with"]);
  const words = s.split(/\s+/);

  return words
    .map((w, idx) => {
      const raw = w;
      const lower = raw.toLowerCase();

      // Preserve ALL-CAPS acronyms (EU, UK, API, etc.)
      if (raw.length <= 6 && raw === raw.toUpperCase() && /[A-Z]/.test(raw)) return raw;

      // Keep words with numbers/symbols mostly intact (2025/26, etc.)
      const cleaned = lower.replace(/[^a-z]/g, "");
      const isSmall = small.has(cleaned);

      const shouldCap = idx === 0 || idx === words.length - 1 || !isSmall;
      if (!shouldCap) return lower;

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
