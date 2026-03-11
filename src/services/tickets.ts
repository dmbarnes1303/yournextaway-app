const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;

export type TicketResult = {
  ok: boolean;
  provider?: string;
  exact?: boolean;
  score?: number;
  url?: string;
  title?: string;
  priceText?: string | null;
  reason?: string;
};

export async function resolveTickets(
  homeName: string,
  awayName: string,
  kickoffIso: string
): Promise<TicketResult | null> {

  try {
    const url =
      `${BACKEND}/tickets/resolve` +
      `?homeName=${encodeURIComponent(homeName)}` +
      `&awayName=${encodeURIComponent(awayName)}` +
      `&kickoffIso=${encodeURIComponent(kickoffIso)}`;

    const res = await fetch(url);

    if (!res.ok) return null;

    return await res.json();

  } catch {
    return null;
  }
}
