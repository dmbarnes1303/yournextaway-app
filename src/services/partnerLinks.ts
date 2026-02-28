// src/services/partnerLinks.ts

import { findEventForFixture, buildAffiliateUrl } from "./se365";

/**
 * Build SE365 ticket link for a fixture.
 */
export async function buildTicketLink(params: {
  home: string;
  away: string;
  dateIso: string;
}) {
  const ev = await findEventForFixture(
    params.home,
    params.away,
    params.dateIso
  );

  if (!ev?.eventUrl) return null;

  return buildAffiliateUrl(ev.eventUrl);
}
