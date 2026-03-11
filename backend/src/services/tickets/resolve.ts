import { resolveFtnCandidate } from "./ftn.js";
import { resolveSe365Candidate } from "./se365.js";
import { resolveGigsbergCandidate } from "./gigsberg.js";
import type { TicketResolution, TicketResolveInput } from "./types.js";

export async function resolveTicket(input: TicketResolveInput): Promise<TicketResolution> {
  const checkedProviders: TicketResolution["checkedProviders"] = [];

  const ftn = await resolveFtnCandidate(input);
  checkedProviders.push("footballticketsnet");
  if (ftn) {
    return {
      ok: true,
      provider: ftn.provider,
      exact: ftn.exact,
      score: ftn.score,
      url: ftn.url,
      title: ftn.title,
      priceText: ftn.priceText,
      reason: ftn.reason,
      checkedProviders,
    };
  }

  const se365 = await resolveSe365Candidate(input);
  checkedProviders.push("sportsevents365");
  if (se365) {
    return {
      ok: true,
      provider: se365.provider,
      exact: se365.exact,
      score: se365.score,
      url: se365.url,
      title: se365.title,
      priceText: se365.priceText,
      reason: se365.reason,
      checkedProviders,
    };
  }

  const gigsberg = await resolveGigsbergCandidate(input);
  checkedProviders.push("gigsberg");
  if (gigsberg) {
    return {
      ok: true,
      provider: gigsberg.provider,
      exact: gigsberg.exact,
      score: gigsberg.score,
      url: gigsberg.url,
      title: gigsberg.title,
      priceText: gigsberg.priceText,
      reason: gigsberg.reason,
      checkedProviders,
    };
  }

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
