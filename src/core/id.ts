// src/core/id.ts

function fallbackId(prefix: string) {
  const r = Math.random().toString(16).slice(2);
  const t = Date.now().toString(16);
  return `${prefix}_${t}_${r}`;
}

function randomUuid(): string | null {
  try {
    const g: any = globalThis as any;
    if (g?.crypto?.randomUUID) return String(g.crypto.randomUUID());
  } catch {
    // ignore
  }
  return null;
}

export function makeTripId(): string {
  const u = randomUuid();
  return u ? `trip_${u}` : fallbackId("trip");
}

export function makeSavedItemId(): string {
  const u = randomUuid();
  return u ? `si_${u}` : fallbackId("si");
}

export function makeWorkspaceId(tripId: string): string {
  const base = String(tripId ?? "").trim() || "trip_unknown";
  return `ws_${base}`;
}
