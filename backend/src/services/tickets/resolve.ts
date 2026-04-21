import { resolveFtnCandidate } from "./ftn.js";
import { resolveSe365Candidate } from "./se365.js";
import type {
  TicketCandidate,
  TicketResolution,
  TicketResolveInput,
} from "./types.js";

const PROVIDERS = [
  { id: "footballticketnet", fn: resolveFtnCandidate },
  { id: "sportsevents365", fn: resolveSe365Candidate },
] as const;

/**
 * HARD RULES (your new system):
 *
 * 1. If a provider returns a valid URL → it is usable
 * 2. If multiple providers return → show all
 * 3. NO scoring wars
 * 4. NO rejection because score is "too low"
 * 5. Only reject if:
 *    - no URL
 *    - broken data
 */

function isValidCandidate(c: TicketCandidate | null): c is TicketCandidate {
  if (!c) return false;
  if (!c.url || typeof c.url !== "string") return false;
  if (!c.title) return false;
  return true;
}

function pickPrimary(candidates: TicketCandidate[]): TicketCandidate {
  /**
   * Simple priority:
   * 1. exact event
   * 2. has price
   * 3. fallback
   */

  return [...candidates].sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1;

    const aHasPrice = !!a.priceText;
    const bHasPrice = !!b.priceText;
    if (aHasPrice !== bHasPrice) return aHasPrice ? -1 : 1;

    return 0;
  })[0];
}

export async function resolveTicket(
  input: TicketResolveInput
): Promise<TicketResolution> {
  const checkedProviders: TicketResolution["checkedProviders"] = [
    "footballticketnet",
    "sportsevents365",
  ];

  const results = await Promise.allSettled(
    PROVIDERS.map((p) => p.fn(input))
  );

  const candidates: TicketCandidate[] = [];

  for (const result of results) {
    if (result.status === "fulfilled" && isValidCandidate(result.value)) {
      candidates.push(result.value);
    }
  }

  // 🚫 THIS is what was killing you before
  // If providers returned something but scoring rejected it → user saw NOTHING
  // That logic is now completely gone

  if (candidates.length === 0) {
    return {
      ok: false,
      provider: null,
      exact: false,
      score: null,
      rawScore: null,
      url: null,
      title: null,
      priceText: null,
      reason: "not_found",
      checkedProviders,
      options: [],
    };
  }

  const primary = pickPrimary(candidates);

  return {
    ok: true,
    provider: primary.provider,
    exact: primary.exact,
    score: null, // 🔥 hidden from UI
    rawScore: null,
    url: primary.url,
    title: primary.title,
    priceText: primary.priceText ?? null,
    reason: primary.reason,
    checkedProviders,

    // 👇 THIS is what your UI should use
    options: candidates.map((c) => ({
      provider: c.provider,
      exact: c.exact,
      score: null,
      rawScore: null,
      url: c.url,
      title: c.title,
      priceText: c.priceText ?? null,
      reason: c.reason,
      urlQuality: c.urlQuality,
    })),

    urlQuality: primary.urlQuality,
  };
}
