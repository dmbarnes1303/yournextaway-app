import { assertBackendBaseUrl } from "../config/env";

export type TicketResult = {
  ok: boolean;
  provider?: string;
  exact?: boolean;
  score?: number;
  url?: string;
  title?: string;
  priceText?: string | null;
  reason?: string;
  error?: string;
  debug?: string;
};

export async function resolveTickets(
  homeName: string,
  awayName: string,
  kickoffIso: string
): Promise<TicketResult | null> {
  try {
    const base = assertBackendBaseUrl();

    const url =
      `${base}/tickets/resolve` +
      `?homeName=${encodeURIComponent(homeName)}` +
      `&awayName=${encodeURIComponent(awayName)}` +
      `&kickoffIso=${encodeURIComponent(kickoffIso)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}
