// src/services/followedMatchesRefresh.ts
import useFollowStore from "@/src/state/followStore";
import { getFixtureById } from "@/src/services/apiFootball";
import { notifyKickoffChanged } from "@/src/services/followKickoffNotifications";

function cleanStr(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function clampLimit(v: unknown, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
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

export type RefreshResultRow = {
  fixtureId: string;
  refreshed: boolean;
  notified: boolean;
  error?: string;
};

export async function refreshFollowedMatches(opts?: { limit?: number; concurrency?: number }) {
  const limit = clampLimit(opts?.limit, 1, 50, 25);
  const concurrency = clampLimit(opts?.concurrency, 1, 6, 3);

  const store = useFollowStore.getState();
  const followed = Array.isArray(store.followed) ? store.followed.slice(0, limit) : [];

  if (followed.length === 0) return [] as RefreshResultRow[];

  const ids = followed
    .map((f) => String((f as any)?.fixtureId ?? "").trim())
    .filter(Boolean);

  const rows = await mapLimit(ids, concurrency, async (fixtureId): Promise<RefreshResultRow> => {
    try {
      const fx = await getFixtureById(fixtureId);
      if (!fx) return { fixtureId, refreshed: false, notified: false, error: "no_fixture" };

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
        // kickoffLikelyTbc intentionally omitted → store infers via heuristic
      });

      let notified = false;

      // shouldNotifyKickoff already implies:
      // - alerts.kickoffConfirmed enabled
      // - kickoffIso actually changed (prev vs next)
      if (r?.existed && r.shouldNotifyKickoff) {
        // Prefer store names (follow-time labels), fallback to refreshed snapshot
        const latest = useFollowStore.getState().followed.find((x) => x.fixtureId === fixtureId) ?? null;

        await notifyKickoffChanged({
          fixtureId,
          homeName: latest?.homeName ?? snap.homeName,
          awayName: latest?.awayName ?? snap.awayName,
          leagueName: latest?.leagueName ?? snap.leagueName,
          prevKickoffIso: r.prevKickoffIso,
          nextKickoffIso: r.nextKickoffIso,
        });

        // No “notified” persistence needed:
        // after applyFixtureUpdate, prevKickoffIso becomes nextKickoffIso,
        // so future refreshes won’t re-trigger unless KO changes again.
        notified = true;
      }

      return { fixtureId, refreshed: true, notified };
    } catch (e: any) {
      return {
        fixtureId,
        refreshed: false,
        notified: false,
        error: String(e?.message ?? "refresh_failed"),
      };
    }
  });

  return rows;
}
