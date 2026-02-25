import * as Notifications from "expo-notifications";
import { getFixtureById } from "@/src/services/apiFootball";
import { isKickoffTbc } from "@/src/utils/kickoffTbc";

// IMPORTANT: keep this import path exactly as in your app
import useFollowStore from "@/src/state/followStore";

/* -------------------------------------------------------------------------- */
/* types                                                                      */
/* -------------------------------------------------------------------------- */

type FollowedItem = {
  fixtureId: string;
  kickoffIso?: string | null;
  leagueId?: number | null;
  season?: number | null;
  round?: string | null;
  homeName?: string | null;
  awayName?: string | null;
};

type FollowStoreShape = {
  followed: FollowedItem[];
  upsertLatestSnapshot?: (fixtureId: string, patch: Record<string, any>) => void;
};

/* -------------------------------------------------------------------------- */
/* helpers                                                                    */
/* -------------------------------------------------------------------------- */

function cleanIso(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function matchTitle(item: FollowedItem): string {
  const h = String(item.homeName ?? "").trim();
  const a = String(item.awayName ?? "").trim();
  if (h && a) return `${h} vs ${a}`;
  if (h) return `${h} match`;
  if (a) return `${a} match`;
  return "Match";
}

async function hasNotificationPermission(): Promise<boolean> {
  try {
    const p = await Notifications.getPermissionsAsync();
    return p?.status === "granted";
  } catch {
    return false;
  }
}

async function fireKickoffChangedNotification(args: {
  title: string;
  fixtureId: string;
}) {
  if (!(await hasNotificationPermission())) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Kickoff changed",
        body: `${args.title} — check your trip`,
        data: {
          kind: "kickoff_changed",
          fixtureId: String(args.fixtureId),
        },
      },
      trigger: null,
    });
  } catch {
    // never crash refresh
  }
}

/* -------------------------------------------------------------------------- */
/* core                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Refresh followed matches snapshots + kickoff alerts
 *
 * Fires alert when:
 *   oldIso !== newIso
 *   AND new kickoff exists
 *   AND new kickoff is NOT TBC
 *
 * Safe:
 * - best effort
 * - concurrency limited
 * - never throws
 */
export async function refreshFollowedMatches(opts?: {
  limit?: number;
  concurrency?: number;
}) {
  const limit = Math.max(0, Number(opts?.limit ?? 25));
  const concurrency = Math.max(1, Number(opts?.concurrency ?? 3));

  const store = (useFollowStore as any) as {
    getState: () => FollowStoreShape;
  };

  const state = store.getState?.();
  const followedAll: FollowedItem[] = Array.isArray(state?.followed)
    ? state.followed
    : [];

  if (!followedAll.length) return;

  const followed = followedAll.slice(0, limit);

  let cursor = 0;

  async function worker() {
    while (cursor < followed.length) {
      const item = followed[cursor++];
      const fid = String(item?.fixtureId ?? "").trim();
      if (!fid) continue;

      let row: any = null;

      try {
        row = await getFixtureById(fid);
      } catch {
        continue;
      }

      if (!row) continue;

      const newIso = cleanIso(row?.fixture?.date);
      const oldIso = cleanIso(item?.kickoffIso);

      // TBC heuristic (row-only safe version)
      const newIsTbc = isKickoffTbc(row);

      /* -------------------------------------------------- */
      /* kickoff change detection                           */
      /* -------------------------------------------------- */

      if (
        oldIso &&
        newIso &&
        oldIso !== newIso &&
        !newIsTbc
      ) {
        await fireKickoffChangedNotification({
          title: matchTitle(item),
          fixtureId: fid,
        });
      }

      /* -------------------------------------------------- */
      /* snapshot update                                    */
      /* -------------------------------------------------- */

      try {
        const upsert = store.getState()?.upsertLatestSnapshot;
        if (typeof upsert === "function") {
          upsert(fid, {
            kickoffIso: newIso,
            venue: row?.fixture?.venue?.name ?? null,
            city: row?.fixture?.venue?.city ?? null,
            leagueId: row?.league?.id ?? null,
            season: row?.league?.season ?? null,
            round: row?.league?.round ?? null,
            homeName: row?.teams?.home?.name ?? null,
            awayName: row?.teams?.away?.name ?? null,
          });
        }
      } catch {
        // never crash refresh
      }
    }
  }

  try {
    await Promise.all(
      new Array(concurrency).fill(0).map(worker)
    );
  } catch {
    // ignore
  }
}
