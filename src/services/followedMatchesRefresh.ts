// src/services/followedMatchesRefresh.ts
import useFollowStore from "@/src/state/followStore";
import { getFixtureById } from "@/src/services/apiFootball";
import { notifyKickoffChanged } from "@/src/services/followKickoffNotifications";

function cleanStr(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function pickFixtureSnapshot(fx: any) {
  // API-Football typical shape:
  // fx.fixture.date, fx.fixture.venue.name/city
  // fx.league.id/name/season/round
  // fx.teams.home.id/name, fx.teams.away.id/name
  const kickoffIso = cleanStr(fx?.fixture?.date);
  const venue = cleanStr(fx?.fixture?.venue?.name);
  const city = cleanStr(fx?.fixture?.venue?.city);

  const leagueId = fx?.league?.id != null ? Number(fx.league.id) : undefined;
  const season = fx?.league?.season != null ? Number(fx.league.season) : undefined;
  const leagueName = cleanStr(fx?.league?.name);
  const round = cleanStr(fx?.league?.round);

  const homeTeamId = fx?.teams?.home?.id != null ? Number(fx.teams.home.id) : undefined;
  const awayTeamId = fx?.teams?.away?.id != null ? Number(fx.teams.away.id) : undefined;
  const homeName = cleanStr(fx?.teams?.home?.name);
  const awayName = cleanStr(fx?.teams?.away?.name);

  return {
    kickoffIso,
    venue,
    city,
    leagueId,
    season,
    leagueName,
    round,
    homeTeamId,
    awayTeamId,
    homeName,
    awayName,
  };
}

export async function refreshFollowedMatches(opts?: { limit?: number }) {
  const limit = Math.max(1, Math.min(50, Number(opts?.limit ?? 25)));

  const store = useFollowStore.getState();
  const followed = store.followed.slice(0, limit);

  const results: Array<{
    fixtureId: string;
    refreshed: boolean;
    notified: boolean;
    error?: string;
  }> = [];

  for (const f of followed) {
    const fixtureId = String(f.fixtureId ?? "").trim();
    if (!fixtureId) continue;

    try {
      const fx = await getFixtureById(fixtureId);
      if (!fx) {
        results.push({ fixtureId, refreshed: false, notified: false, error: "no_fixture" });
        continue;
      }

      const snap = pickFixtureSnapshot(fx);

      const r = useFollowStore.getState().applyFixtureUpdate(fixtureId, {
        kickoffIso: snap.kickoffIso,
        venue: snap.venue,
        city: snap.city,
        leagueId: snap.leagueId,
        season: snap.season,
        leagueName: snap.leagueName,
        round: snap.round,
        homeTeamId: snap.homeTeamId,
        awayTeamId: snap.awayTeamId,
        homeName: snap.homeName,
        awayName: snap.awayName,
        // kickoffLikelyTbc intentionally omitted → store will infer based on your heuristic
      });

      let notified = false;

      if (r?.existed && r.shouldNotifyKickoff) {
        // Use human-readable names saved in store (or refreshed snapshot)
        const latest = useFollowStore.getState().followed.find((x) => x.fixtureId === fixtureId) ?? null;

        await notifyKickoffChanged({
          fixtureId,
          homeName: latest?.homeName ?? snap.homeName,
          awayName: latest?.awayName ?? snap.awayName,
          leagueName: latest?.leagueName ?? snap.leagueName,
          prevKickoffIso: r.prevKickoffIso,
          nextKickoffIso: r.nextKickoffIso,
        });

        // Anti-spam: persist that we notified for this kickoffIso
        useFollowStore.getState().markKickoffNotified(fixtureId, r.nextKickoffIso);
        notified = true;
      }

      results.push({ fixtureId, refreshed: true, notified });
    } catch (e: any) {
      results.push({
        fixtureId,
        refreshed: false,
        notified: false,
        error: String(e?.message ?? "refresh_failed"),
      });
    }
  }

  return results;
}
