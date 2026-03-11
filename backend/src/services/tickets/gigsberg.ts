import { env, hasGigsbergConfig } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function norm(v: unknown): string {
  return clean(v).toLowerCase();
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

function buildAltSearchQuery(input: TicketResolveInput): string {
  const home = clean(input.homeName);
  const away = clean(input.awayName);

  if (!home || !away) return "";
  return `${home} ${away} tickets`;
}

function looksLikeSearchUrl(url: URL): boolean {
  const path = norm(url.pathname);
  return path.includes("search") || url.searchParams.has("query") || url.searchParams.has("q");
}

function buildSearchUrl(input: TicketResolveInput): string | null {
  const primaryQuery = buildSearchQuery(input);
  const fallbackQuery = buildAltSearchQuery(input);
  const query = primaryQuery || fallbackQuery;
  if (!query) return null;

  const configuredBase = clean(env.gigsbergBaseUrl);
  const base = configuredBase || "https://www.gigsberg.com/search";

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    console.log("[Gigsberg] invalid base URL", { base });
    return null;
  }

  if (!looksLikeSearchUrl(url)) {
    console.log("[Gigsberg] base URL does not look like a search page, forcing /search", {
      originalBase: base,
    });
    url = new URL("https://www.gigsberg.com/search");
  }

  if (!url.searchParams.get("query") && !url.searchParams.get("q")) {
    url.searchParams.set("query", query);
  }

  const affiliateId = clean(env.gigsbergAffiliateId);
  if (!url.searchParams.get("aff") && affiliateId) {
    url.searchParams.set("aff", affiliateId);
  }

  return url.toString();
}

function buildSecondarySearchUrl(input: TicketResolveInput): string | null {
  const query = buildAltSearchQuery(input);
  if (!query) return null;

  const url = new URL("https://www.gigsberg.com/search");
  url.searchParams.set("query", query);

  const affiliateId = clean(env.gigsbergAffiliateId);
  if (affiliateId) {
    url.searchParams.set("aff", affiliateId);
  }

  return url.toString();
}

function scoreFallback(input: TicketResolveInput): number {
  let score = 5;

  const home = clean(input.homeName);
  const away = clean(input.awayName);
  const league = clean(input.leagueName);
  const kickoffIso = clean(input.kickoffIso);

  if (home && away) score += 2;
  if (league) score += 1;
  if (kickoffIso) score += 1;

  return score;
}

export async function resolveGigsbergCandidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasGigsbergConfig()) {
    console.log("[Gigsberg] skipped: missing config");
    return null;
  }

  const homeName = clean(input.homeName);
  const awayName = clean(input.awayName);
  const kickoffIso = clean(input.kickoffIso);
  const leagueName = clean(input.leagueName);

  if (!homeName || !awayName || !kickoffIso) {
    console.log("[Gigsberg] skipped: missing required input", {
      homeName,
      awayName,
      kickoffIso,
    });
    return null;
  }

  const primaryUrl = buildSearchUrl(input);
  const secondaryUrl = buildSecondarySearchUrl(input);

  if (!primaryUrl) {
    console.log("[Gigsberg] failed to build primary search URL", {
      homeName,
      awayName,
      leagueName: leagueName || null,
    });
    return null;
  }

  console.log("[Gigsberg] built fallback URLs", {
    homeName,
    awayName,
    leagueName: leagueName || null,
    primaryUrl,
    secondaryUrl: secondaryUrl || null,
  });

  return {
    provider: "gigsberg",
    exact: false,
    score: scoreFallback(input),
    url: primaryUrl,
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: null,
    reason: "search_fallback",
  };
                         }
