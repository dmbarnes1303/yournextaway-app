// src/services/followRefresh.ts
import { AppState, type AppStateStatus, Alert } from "react-native";

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import useFollowStore, { type ApplyFixtureUpdateResult, type FollowSnapshot } from "@/src/state/followStore";
import { kickoffIsoOrNull, isKickoffTbc } from "@/src/utils/kickoffTbc";

/**
 * Phase 1 follow refresh:
 * - Re-fetch followed fixtures (rate-limit friendly)
 * - Apply snapshot patch via applyFixtureUpdate (diff result)
 * - If kickoff changed and alerts.kickoffConfirmed is enabled, raise in-app alert
 *
 * No push, no background fetch yet. Foreground + manual triggers only.
 */

type RefreshOptions = {
  /** max concurrent fetches */
  concurrency?: number;
  /** avoid spamming API on rapid app switches */
  minMinutesBetweenRefreshes?: number;
  /** if true, show Alert.alert when kickoff changes (Phase 1 UI) */
  showInAppAlerts?: boolean;
};

const DEFAULTS: Required<RefreshOptions> = {
  concurrency: 4,
  minMinutesBetweenRefreshes: 10,
  showInAppAlerts: true,
};

let _lastRefreshAtMs = 0;

function nowMs() {
  return Date.now();
}

function minutesSince(ms: number) {
  return (nowMs() - ms) / (1000 * 60);
}

function normId(id: unknown) {
  return String(id ?? "").trim();
}

function safeStr(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function shouldThrottle(minMinutesBetweenRefreshes: number) {
  if (_lastRefreshAtMs === 0) return false;
  return minutesSince(_lastRefreshAtMs) < minMinutesBetweenRefreshes;
}

function toPatchFromRow(row: FixtureListRow): FollowSnapshot {
  const kickoffIso = kickoffIsoOrNull(row);

  // Heuristic: without placeholderIds, isKickoffTbc uses:
  // explicit TBD/TBA OR missing KO OR within-21-day rule.
  const kickoffLikelyTbc = isKickoffTbc(row) ? true : false;

  return {
    kickoffIso,
    kickoffLikelyTbc,

    venue: safeStr(row?.fixture?.venue?.name),
    city: safeStr(row?.fixture?.venue?.city),

    leagueId: row?.league?.id ?? undefined,
    season: (row as any)?.league?.season ?? undefined,

    homeTeamId: row?.teams?.home?.id ?? undefined,
    awayTeamId: row?.teams?.away?.id ?? undefined,

    // Keep names fresh if API supplies them (we also capture at follow-time)
    homeName: safeStr(row?.teams?.home?.name),
    awayName: safeStr(row?.teams?.away?.name),
    leagueName: safeStr(row?.league?.name),

    round: safeStr(row?.league?.round),
  };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length) as any;
  let i = 0;

  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }

  const n = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: n }).map(worker));
  return results;
}

function fmtKo(iso: string | null) {
  if (!iso) return "TBC";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBC";
  return d.toLocaleString("en-GB");
}

function titleForFixtureId(fixtureId: string) {
  const m = useFollowStore.getState().followed.find((x) => x.fixtureId === fixtureId);
  if (m?.homeName && m?.awayName) return `${m.homeName} vs ${m.awayName}`;
  return `Match #${fixtureId}`;
}

function buildAlertSummary(changes: ApplyFixtureUpdateResult[]) {
  // Keep the alert readable; don’t dump 50 lines into a modal.
  const maxLines = 6;

  const lines = changes.slice(0, maxLines).map((r) => {
    const t = titleForFixtureId(r.fixtureId);
    return `${t}\n${fmtKo(r.prevKickoffIso)} → ${fmtKo(r.nextKickoffIso)}`;
  });

  const remaining = changes.length - lines.length;
  if (remaining > 0) lines.push(`+ ${remaining} more updated`);

  const title = changes.length === 1 ? "Kickoff updated" : `${changes.length} kickoffs updated`;
  const message = lines.join("\n\n");

  return { title, message };
}

export async function refreshFollowedMatches(opts?: RefreshOptions) {
  const o = { ...DEFAULTS, ...(opts ?? {}) };

  if (shouldThrottle(o.minMinutesBetweenRefreshes)) {
    return { refreshed: 0, changed: 0, results: [] as ApplyFixtureUpdateResult[] };
  }

  const { followed, applyFixtureUpdate } = useFollowStore.getState();
  const ids = followed.map((m) => normId(m.fixtureId)).filter(Boolean);

  if (ids.length === 0) {
    _lastRefreshAtMs = nowMs();
    return { refreshed: 0, changed: 0, results: [] as ApplyFixtureUpdateResult[] };
  }

  const results = await mapLimit(ids, o.concurrency, async (fixtureId) => {
    try {
      const row = await getFixtureById(fixtureId);
      if (!row) return null;

      const patch = toPatchFromRow(row);
      const res = applyFixtureUpdate(fixtureId, patch);
      return res ?? null;
    } catch {
      // non-fatal per-fixture failures
      return null;
    }
  });

  _lastRefreshAtMs = nowMs();

  const applied = results.filter(Boolean) as ApplyFixtureUpdateResult[];
  const changed = applied.filter((r) => r.existed && r.kickoffChanged);

  if (o.showInAppAlerts) {
    // Only notify the ones the user opted into
    const notify = changed.filter((r) => r.shouldNotifyKickoff);

    if (notify.length > 0) {
      const { title, message } = buildAlertSummary(notify);
      Alert.alert(title, message);
    }
  }

  return { refreshed: applied.length, changed: changed.length, results: applied };
}

/**
 * Convenience helper:
 * - refresh when app returns to foreground
 * - optional interval while active
 *
 * Phase 1 only — not background fetch.
 */
export function startFollowAutoRefresh(opts?: RefreshOptions & { intervalMinutes?: number }) {
  const intervalMinutes = Math.max(0, Number(opts?.intervalMinutes ?? 0));
  let timer: any = null;
  let lastState: AppStateStatus = AppState.currentState;

  const clearTimer = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  const startTimer = () => {
    if (intervalMinutes <= 0) return;
    clearTimer();
    timer = setInterval(() => refreshFollowedMatches(opts).catch(() => null), intervalMinutes * 60 * 1000);
  };

  const onState = (next: AppStateStatus) => {
    const wasBg = lastState !== "active";
    lastState = next;

    if (next === "active" && wasBg) {
      refreshFollowedMatches(opts).catch(() => null);
      startTimer();
      return;
    }

    if (next !== "active") {
      clearTimer();
    }
  };

  const sub = AppState.addEventListener("change", onState);

  // Kick once on start if already active
  if (AppState.currentState === "active") {
    refreshFollowedMatches(opts).catch(() => null);
    startTimer();
  }

  return () => {
    try {
      sub.remove();
    } catch {
      // ignore
    }
    clearTimer();
  };
}
