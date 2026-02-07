// src/services/followRefresh.ts
import { AppState, type AppStateStatus } from "react-native";

import { refreshFollowedMatches } from "@/src/services/followedMatchesRefresh";

/**
 * Compatibility wrapper.
 *
 * Old Phase-1 used:
 * - getFixtureById
 * - applyFixtureUpdate
 * - Alert.alert
 *
 * New truth:
 * - refreshFollowedMatches() diffs kickoffIso vs previous kickoffIso
 * - if changed and alerts.kickoffConfirmed enabled, it triggers a local notification
 * - no in-app Alert spam
 *
 * Keep this module ONLY so existing imports don’t break.
 */

export type RefreshOptions = {
  /** Limits how many followed fixtures we refresh per run (keeps API friendly). */
  limit?: number;
};

export async function refreshFollowedMatchesCompat(opts?: RefreshOptions) {
  // Under the hood this:
  // - reads followed fixtures from followStore
  // - fetches latest fixture rows (bounded)
  // - applies applyFixtureUpdate per fixture
  // - schedules local notifications for kickoff changes (when enabled)
  return await refreshFollowedMatches({ limit: opts?.limit });
}

/**
 * Backwards-compatible name (older code imports refreshFollowedMatches from here).
 * Prefer importing directly from "@/src/services/followedMatchesRefresh" going forward.
 */
export async function refreshFollowedMatches(opts?: RefreshOptions) {
  return await refreshFollowedMatchesCompat(opts);
}

/**
 * Backwards-compatible auto refresh helper.
 *
 * NOTE:
 * Your app/_layout.tsx already owns the real refresh orchestration.
 * Keep this only if something else still calls it.
 */
export function startFollowAutoRefresh(opts?: RefreshOptions & { intervalMinutes?: number }) {
  const intervalMinutes = Math.max(0, Number(opts?.intervalMinutes ?? 0));

  let timer: ReturnType<typeof setInterval> | null = null;
  let lastState: AppStateStatus = AppState.currentState;

  const run = () => {
    refreshFollowedMatchesCompat({ limit: opts?.limit }).catch(() => null);
  };

  const onState = (next: AppStateStatus) => {
    const wasBg = lastState !== "active";
    lastState = next;

    if (next === "active" && wasBg) {
      run();

      if (intervalMinutes > 0) {
        if (timer) clearInterval(timer);
        timer = setInterval(run, intervalMinutes * 60 * 1000);
      }
      return;
    }

    if (next !== "active") {
      if (timer) clearInterval(timer);
      timer = null;
    }
  };

  const sub = AppState.addEventListener("change", onState);

  if (AppState.currentState === "active") {
    run();
    if (intervalMinutes > 0) {
      timer = setInterval(run, intervalMinutes * 60 * 1000);
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
