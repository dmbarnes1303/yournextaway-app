import { env, hasGigsbergConfig } from "../../lib/env.js";
import type { TicketCandidate, TicketResolveInput } from "./types.js";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function slug(v: string): string {
  return clean(v)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function buildSearchUrl(input: TicketResolveInput): string {
  const query = `${clean(input.homeName)} ${clean(input.awayName)} football tickets`;
  const base =
    clean(env.gigsbergBaseUrl) ||
    `https://www.gigsberg.com/search?query=${encodeURIComponent(query)}`;

  const joiner = base.includes("?") ? "&" : "?";
  if (/[?&]aff=/.test(base)) return base;
  return `${base}${joiner}aff=${encodeURIComponent(env.gigsbergAffiliateId)}`;
}

export async function resolveGigsbergCandidate(input: TicketResolveInput): Promise<TicketCandidate | null> {
  if (!hasGigsbergConfig()) return null;

  return {
    provider: "gigsberg",
    exact: false,
    score: 10,
    url: buildSearchUrl(input),
    title: `Tickets: ${clean(input.homeName)} vs ${clean(input.awayName)}`,
    priceText: null,
    reason: "search_fallback",
  };
}
