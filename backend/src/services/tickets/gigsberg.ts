import { env, hasGigsbergConfig } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function norm(v: unknown): string {
  return clean(v).toLowerCase();
}

function safeDate(v?: string): Date | null {
  const s = clean(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildSearchQuery(input: TicketResolveInput): string {
  const home = clean(input.homeName);
  const away = clean(input.awayName);
  const league = clean(input.leagueName);

  if (league) {
    return `${home} vs ${away} ${league} tickets`;
  }

  return `${home} vs ${away} football tickets`;
}

function buildSearchUrl(input: TicketResolveInput): string {
  const query = buildSearchQuery(input);
  const base =
    clean(env.gigsbergBaseUrl) || "https://www.gigsberg.com/search";

  const hasQuery = base.includes("?");
  const joiner = hasQuery ? "&" : "?";

  let url = base;

  if (!/[?&]query=/.test(url)) {
    url = `${url}${joiner}query=${encodeURIComponent(query)}`;
  }

  if (!/[?&]aff=/.test(url)) {
    const affJoiner = url.includes("?") ? "&" : "?";
    url = `${url}${affJoiner}aff=${encodeURIComponent(env.gigsbergAffiliateId)}`;
  }

  return url;
}

function scoreFallback(input: TicketResolveInput): number {
  let score = 12;

  const home = norm(input.homeName);
  const away = norm(input.awayName);
  const league = norm(input.leagueName);

  if (home && away) score += 4;
  if (league) score += 2;

  const kickoff = safeDate(input.kickoffIso);
  if (kickoff) score += 2;

  return score;
}

export async function resolveGigsbergCandidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  if (!hasGigsbergConfig()) return null;

  const homeName = clean(input.homeName);
  const awayName = clean(input.awayName);
  const kickoffIso = clean(input.kickoffIso);

  if (!homeName || !awayName || !kickoffIso) return null;

  return {
    provider: "gigsberg",
    exact: false,
    score: scoreFallback(input),
    url: buildSearchUrl(input),
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: null,
    reason: "search_fallback",
  };
}
