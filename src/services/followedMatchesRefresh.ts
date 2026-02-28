// src/services/followedMatchesRefresh.ts
// Refresh followed fixtures + trigger kickoff change notifications

import useFollowStore from "@/src/state/followStore";
import { getFixtures } from "@/src/services/apiFootball";
import { notifyKickoffChanged } from "@/src/services/notifications";

type RefreshOptions = {
  limit?: number;
  concurrency?: number;
};

/**
 * Refresh followed matches from API-Football
 * - diffs kickoffIso via followStore.applyFixtureUpdate
 * - respects alert prefs + anti-spam
 * - triggers notifications
 */
export async function refreshFollowedMatches(
  opts: RefreshOptions = {}
): Promise<void> {
  const { limit = 50 } = opts;

  const store = useFollowStore.getState();
  const followed = store.followed.slice(0, limit);

  for (const f of followed) {
    try {
      const rows = await getFixtures({
        league: f.leagueId,
        season: f.season,
        from: f.kickoffIso ?? undefined,
        to: f.kickoffIso ?? undefined,
      });

      if (!rows.length) continue;

      const row = rows.find(
        (r) => String(r.fixture?.id) === String(f.fixtureId)
      );

      if (!row) continue;

      const result = store.applyFixtureUpdate(f.fixtureId, {
        kickoffIso: row.fixture?.date ?? null,
        venue: row.fixture?.venue?.name ?? null,
        city: row.fixture?.venue?.city ?? null,
        round: row.league?.round ?? null,
      });

      if (!result) continue;

      if (result.shouldNotifyKickoff && result.nextKickoffIso) {
        notifyKickoffChanged({
          fixtureId: f.fixtureId,
          home: f.homeName ?? "Match",
          away: f.awayName ?? "",
          newKickoffIso: result.nextKickoffIso,
        });

        store.markKickoffNotified(f.fixtureId, result.nextKickoffIso);
      }
    } catch (e) {
      console.warn("follow refresh failed", f.fixtureId, e);
    }
  }
}
