import { env, hasGigsbergConfig } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function buildSearchQuery(input: TicketResolveInput): string {
  const home = clean(input.homeName);
  const away = clean(input.awayName);
  const league = clean(input.leagueName);

  if (!home || !away) return "";

  if (league) {
    return `${home} vs ${away} ${league} tickets`;
  }

  return `${home} vs ${away} football tickets`;
}

function buildSearchUrl(input: TicketResolveInput): string | null {
  const query = buildSearchQuery(input);
  if (!query) return null;

  const configuredBase = clean(env.gigsbergBaseUrl);
  const base = configuredBase || "https://www.gigsberg.com/search";

  const url = new URL(base);

  if (!url.searchParams.get("query")) {
    url.searchParams.set("query", query);
  }

  const affiliateId = clean(env.gigsbergAffiliateId);
  if (!url.searchParams.get("aff") && affiliateId) {
    url.searchParams.set("aff", affiliateId);
  }

  return url.toString();
}

export async function resolveGigsbergCandidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasGigsbergConfig()) return null;

  const homeName = clean(input.homeName);
  const awayName = clean(input.awayName);
  const kickoffIso = clean(input.kickoffIso);

  if (!homeName || !awayName || !kickoffIso) return null;

  const url = buildSearchUrl(input);
  if (!url) return null;

  return {
    provider: "gigsberg",
    exact: false,
    score: 5,
    url,
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: null,
    reason: "search_fallback",
  };
}
