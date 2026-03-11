import { resolveFtnCandidate } from "./ftn.js";
import { resolveSe365Candidate } from "./se365.js";
import { resolveGigsbergCandidate } from "./gigsberg.js";
import type { TicketCandidate, TicketResolution, TicketResolveInput } from "./types.js";

function normalizeCandidate(candidate: TicketCandidate): TicketCandidate {
  const isExact = Boolean(candidate.exact);

  return {
    ...candidate,
    reason: isExact ? "exact_event" : "search_fallback",
  };
}

function compareCandidates(a: TicketCandidate, b: TicketCandidate): number {
  // Exact beats fallback every time
  if (a.exact !== b.exact) return a.exact ? -1 : 1;

  // Higher score wins
  if (a.score !== b.score) return b.score - a.score;

  // Prefer providers with real event resolution over generic search fallback
  const providerPriority: Record<TicketCandidate["provider"], number> = {
    footballticketsnet: 3,
    sportsevents365: 2,
    gigsberg: 1,
  };

  return providerPriority[b.provider] - providerPriority[a.provider];
}

export async function resolveTicket(input: TicketResolveInput): Promise<TicketResolution> {
  const checkedProviders: TicketResolution["checkedProviders"] = [];
  const candidates: TicketCandidate[] = [];

  const ftn = await resolveFtnCandidate(input);
  checkedProviders.push("footballticketsnet");
  if (ftn) candidates.push(normalizeCandidate(ftn));

  const se365 = await resolveSe365Candidate(input);
  checkedProviders.push("sportsevents365");
  if (se365) candidates.push(normalizeCandidate(se365));

  const gigsberg = await resolveGigsbergCandidate(input);
  checkedProviders.push("gigsberg");
  if (gigsberg) candidates.push(normalizeCandidate(gigsberg));

  if (!candidates.length) {
    return {
      ok: false,
      provider: null,
      exact: false,
      score: null,
      url: null,
      title: null,
      priceText: null,
      reason: "not_found",
      checkedProviders,
    };
  }

  const sorted = [...candidates].sort(compareCandidates);
  const best = sorted[0];

  return {
    ok: true,
    provider: best.provider,
    exact: best.exact,
    score: best.score,
    url: best.url,
    title: best.title,
    priceText: best.priceText ?? null,
    reason: best.reason,
    checkedProviders,
  };
}
