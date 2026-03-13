export const DAYS_AHEAD = 365;
export const STRIP_DAYS = 7;

export function isoFromUtcParts(y: number, m0: number, d: number) {
  const ms = Date.UTC(y, m0, d, 0, 0, 0, 0);
  return new Date(ms).toISOString().slice(0, 10);
}

export function utcTodayIso() {
  const now = new Date();
  return isoFromUtcParts(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
}

export function addDaysIsoUtc(iso: string, days: number) {
  const base = new Date(`${iso}T00:00:00.000Z`);
  const ms = base.getTime() + days * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function tomorrowIsoUtc() {
  return addDaysIsoUtc(utcTodayIso(), 1);
}

export function clampIsoToWindow(iso: string, minIso: string, maxIso: string) {
  const s = String(iso ?? "").trim();
  if (!s) return minIso;
  if (s < minIso) return minIso;
  if (s > maxIso) return maxIso;
  return s;
}

export function normalizeRange(fromIso: string, toIso: string) {
  const a = String(fromIso ?? "").trim();
  const b = String(toIso ?? "").trim();
  if (!a) return { from: b, to: b };
  if (!b) return { from: a, to: a };
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

export function isValidIsoDateOnly(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? "").trim());
}

export function daysInMonthUtc(year: number, month0: number) {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

export function firstWeekdayUtc(year: number, month0: number) {
  const sundayBased = new Date(Date.UTC(year, month0, 1)).getUTCDay();
  return (sundayBased + 6) % 7;
}

export function monthLabel(year: number, month0: number) {
  const d = new Date(Date.UTC(year, month0, 1));
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function parseIsoToUtcParts(iso: string) {
  const m = String(iso ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { y: Number(m[1]), m0: Number(m[2]) - 1, d: Number(m[3]) };
}

export function buildMonthGrid(year: number, month0: number) {
  const dim = daysInMonthUtc(year, month0);
  const firstW = firstWeekdayUtc(year, month0);
  const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];

  for (let i = 0; i < firstW; i++) {
    cells.push({ iso: "", day: 0, inMonth: false });
  }

  for (let day = 1; day <= dim; day++) {
    cells.push({ iso: isoFromUtcParts(year, month0, day), day, inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ iso: "", day: 0, inMonth: false });
  }

  return cells;
}
