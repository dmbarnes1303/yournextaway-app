import type { RankedTrip, WeekendBucket } from "./types";

function toDateOnly(iso?: string | null): string | null {
  const raw = String(iso ?? "").trim();
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function addDays(dateOnly: string, days: number): string {
  const d = new Date(`${dateOnly}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekendWindow(dateOnly: string) {
  const d = new Date(`${dateOnly}T00:00:00.000Z`);
  const day = d.getUTCDay(); // Sun 0 ... Sat 6

  const fridayOffset = day === 0 ? -2 : 5 - day;
  const sundayOffset = day === 0 ? 0 : 7 - day;

  const from = addDays(dateOnly, fridayOffset);
  const to = addDays(dateOnly, sundayOffset);

  return { from, to };
}

function labelForWindow(from: string, to: string) {
  return `${from} → ${to}`;
}

export function groupTripsByWeekend(trips: RankedTrip[]): WeekendBucket[] {
  const map = new Map<string, RankedTrip[]>();

  for (const trip of trips) {
    const dateOnly = toDateOnly(trip.kickoffIso);
    if (!dateOnly) continue;

    const { from, to } = weekendWindow(dateOnly);
    const key = `${from}__${to}`;
    const existing = map.get(key) ?? [];
    existing.push(trip);
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .map(([key, group]) => {
      const [from, to] = key.split("__");
      const sorted = [...group].sort((a, b) => b.breakdown.combinedScore - a.breakdown.combinedScore);
      const topScore = sorted[0]?.breakdown.combinedScore ?? 0;
      const avgScore =
        sorted.length > 0
          ? Math.round(sorted.reduce((sum, t) => sum + t.breakdown.combinedScore, 0) / sorted.length)
          : 0;

      return {
        key,
        from,
        to,
        label: labelForWindow(from, to),
        trips: sorted,
        topScore,
        avgScore,
      };
    })
    .sort((a, b) => a.from.localeCompare(b.from));
}

export default groupTripsByWeekend;
