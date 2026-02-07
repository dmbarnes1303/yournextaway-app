// src/services/followRefresh.ts
import { AppState, type AppStateStatus, Alert } from "react-native";

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import useFollowStore, { type ApplyFixtureUpdateResult, type FollowSnapshot } from "@/src/state/followStore";
import { kickoffIsoOrNull, isKickoffTbc } from "@/src/utils/kickoffTbc";

/**
 * Phase 1 follow refresh:
 * - Re-fetch followed fixtures (rate-limit friendly)
 * - Apply snapshot patch via applyFixtureUpdate (gives us diff result)
 * - If kickoff changed and alerts.kickoffConfirmed is enabled, raise an in-app alert
 *
 * No push, no background fetch yet. Just correctness on foreground + manual triggers.
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

function toPatchFromRow(row: FixtureListRow): FollowSnapshot {
  const kickoffIso = kickoffIsoOrNull(row);

  // Heuristic: compute likely TBC using the kickoffTbc util.
  // NOTE: this call without placeholderIds relies on explicit TBD/TBA + missing KO + 21-day rule.
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

    // Keep names fresh if API supplies them (but we already store at follow-time)
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

function describeChange(res: ApplyFixtureUpdateResult, meta?: { title?: string }) {
  const prev = res.prevKickoffIso ? new Date(res.prevKickoffIso).toLocaleString("en-GB") : "TBC";
  const next = res.nextKickoffIso ? new Date(res.nextKickoffIso).toLocaleString("en-GB") : "TBC";
  const t = meta?.title ? `${meta.title}` : `Match #${res.fixtureId}`;
  return { title: "Kickoff updated", message: `${t}\n${prev} → ${next}` };
}

function shouldThrottle(minMinutesBetweenRefreshes: number) {
  if (_lastRefreshAtMs === 0) return false;
  return minutesSince(_lastRefreshAtMs) < minMinutesBetweenRefreshes;
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

      // res can be null if fixtureId was invalid
      return res ?? null;
    } catch {
      // Non-fatal per-fixture failures (rate limit / network / API)
      return null;
    }
  });

  _lastRefreshAtMs = nowMs();

  const applied = results.filter(Boolean) as ApplyFixtureUpdateResult[];
  const changed = applied.filter((r) => r.existed && r.kickoffChanged);

  if (o.showInAppAlerts) {
    // Phase 1: show alerts only while app is active, and only for kickoff changes with user pref enabled.
    for (const r of changed) {
      if (!r.shouldNotifyKickoff) continue;
      const m = useFollowStore.getState().followed.find((x) => x.fixtureId === r.fixtureId);
      const title = m?.homeName && m?.awayName ? `${m.homeName} vs ${m.awayName}` : undefined;
      const msg = describeChange(r, { title });
      Alert.alert(msg.title, msg.message);
    }
  }

  return { refreshed: applied.length, changed: changed.length, results: applied };
}

/**
 * Convenience helper:
 * - refresh when app returns to foreground
 * - optional interval while active
 *
 * This is Phase 1 only — not background fetch.
 */
export function startFollowAutoRefresh(opts?: RefreshOptions & { intervalMinutes?: number }) {
  const intervalMinutes = Math.max(0, Number(opts?.intervalMinutes ?? 0));
  let timer: any = null;
  let lastState: AppStateStatus = AppState.currentState;

  const onState = (next: AppStateStatus) => {
    const wasBg = lastState !== "active";
    lastState = next;

    if (next === "active" && wasBg) {
      refreshFollowedMatches(opts).catch(() => null);
      if (intervalMinutes > 0) {
        if (timer) clearInterval(timer);
        timer = setInterval(() => refreshFollowedMatches(opts).catch(() => null), intervalMinutes * 60 * 1000);
      }
    }

    if (next !== "active") {
      if (timer) clearInterval(timer);
      timer = null;
    }
  };

  const sub = AppState.addEventListener("change", onState);

  // kick once on start if active
  if (AppState.currentState === "active") {
    refreshFollowedMatches(opts).catch(() => null);
    if (intervalMinutes > 0) {
      timer = setInterval(() => refreshFollowedMatches(opts).catch(() => null), intervalMinutes * 60 * 1000);
    }
  }

  return () => {
    try {
      sub.remove();
    } catch {
      // ignore
    }
    if (timer) clearInterval(timer);
  };
  }
