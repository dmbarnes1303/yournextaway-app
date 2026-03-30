import type { TicketCandidate, TicketResolveInput } from "./types.js";
import { getPreferredTeamName } from "./teamAliases.js";

const STUBHUB_BASE_URL = "https://stubhubinternational.sjv.io/xJJoL5";
const STUBHUB_FALLBACK_SCORE = 46;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function buildQuery(input: TicketResolveInput): string {
  const home = getPreferredTeamName(input.homeName);
  const away = getPreferredTeamName(input.awayName);
  const league = clean(input.leagueName);

  return [home, "vs", away, league].filter(Boolean).join(" ");
}

function buildStubhubUrl(input: TicketResolveInput): string | null {
  const query = buildQuery(input);
  if (!query) return null;

  try {
    const url = new URL(STUBHUB_BASE_URL);
    url.searchParams.set("u", `search?query=${query}`);
    return url.toString();
  } catch {
    return null;
  }
}

export async function resolveStubhubCandidate(
  input: TicketResolveInput
): Promise<TicketCandidate | null> {
  const homeName = clean(input.homeName);
  const awayName = clean(input.awayName);
  const kickoffIso = clean(input.kickoffIso);

  if (!homeName || !awayName || !kickoffIso) {
    console.log("[StubHub] skipped: missing required input", {
      homeName,
      awayName,
      kickoffIso,
    });
    return null;
  }

  const url = buildStubhubUrl(input);

  if (!url) {
    console.log("[StubHub] failed to build URL", {
      homeName,
      awayName,
      kickoffIso,
      leagueName: clean(input.leagueName) || null,
    });
    return null;
  }

  const preferredHome = getPreferredTeamName(homeName);
  const preferredAway = getPreferredTeamName(awayName);

  console.log("[StubHub] fallback candidate built", {
    url,
    title: `Tickets: ${preferredHome} vs ${preferredAway}`,
  });

  return {
    provider: "stubhub",
    exact: false,
    score: STUBHUB_FALLBACK_SCORE,
    url,
    title: `Tickets: ${preferredHome} vs ${preferredAway}`,
    priceText: null,
    reason: "search_fallback",
  };
}
