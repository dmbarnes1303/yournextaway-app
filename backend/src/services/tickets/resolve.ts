import { resolveFtnCandidate } from "./ftn.js";
import { resolveSe365Candidate } from "./se365.js";
import { resolveGigsbergCandidate } from "./gigsberg.js";
import type { TicketCandidate, TicketResolution, TicketResolveInput } from "./types.js";

export async function resolveTicket(
  input: TicketResolveInput
): Promise<TicketResolution> {

  const checkedProviders: TicketResolution["checkedProviders"] = [];

  const candidates: TicketCandidate[] = [];

  // Run providers in parallel (faster + proper aggregation)
  const [ftn, se365, gigsberg] = await Promise.all([
    resolveFtnCandidate(input),
    resolveSe365Candidate(input),
    resolveGigsbergCandidate(input),
  ]);

  checkedProviders.push("footballticketsnet");
  if (ftn) candidates.push(ftn);

  checkedProviders.push("sportsevents365");
  if (se365) candidates.push(se365);

  checkedProviders.push("gigsberg");
  if (gigsberg) candidates.push(gigsberg);

  if (!candidates.length) {
    return {
      ok: false,
      provider: null,
      exact: false,
      score: null,
      url: null,
      title: null,
      reason: "not_found",
      checkedProviders,
    };
  }

  // Pick best candidate by score
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

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
