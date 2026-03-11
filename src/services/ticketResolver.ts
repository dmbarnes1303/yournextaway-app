// src/services/ticketResolver.ts

export type TicketResolutionResult = {
  ok: boolean;
  provider: string | null;
  exact: boolean;
  score: number | null;
  url: string | null;
  title: string | null;
  priceText?: string | null;
  reason: "exact_event" | "search_fallback" | "not_found";
  checkedProviders?: string[];
};

export type ResolveTicketArgs = {
  fixtureId?: string | number;
  homeName: string;
  awayName: string;
  kickoffIso: string;
  leagueName?: string;
  leagueId?: string | number;
};

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function getBackendBaseUrl(): string {
  const raw =
    clean(process.env.EXPO_PUBLIC_BACKEND_URL) ||
    clean((process.env as any)?.EXPO_PUBLIC_BACKEND_BASE_URL);

  return raw.replace(/\/+$/, "");
}

export async function resolveTicketForFixture(
  args: ResolveTicketArgs
): Promise<TicketResolutionResult | null> {
  const base = getBackendBaseUrl();
  if (!base) return null;

  const homeName = clean(args.homeName);
  const awayName = clean(args.awayName);
  const kickoffIso = clean(args.kickoffIso);

  if (!homeName || !awayName || !kickoffIso) return null;

  const qs = new URLSearchParams({
    homeName,
    awayName,
    kickoffIso,
  });

  if (clean(args.fixtureId)) qs.set("fixtureId", clean(args.fixtureId));
  if (clean(args.leagueName)) qs.set("leagueName", clean(args.leagueName));
  if (clean(args.leagueId)) qs.set("leagueId", clean(args.leagueId));

  const url = `${base}/tickets/resolve?${qs.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = (await res.json()) as TicketResolutionResult;
    return json ?? null;
  } catch {
    return null;
  }
}
