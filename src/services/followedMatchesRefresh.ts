// src/services/followedMatchesRefresh.ts
import * as Notifications from "expo-notifications";
import { getFixtureById } from "@/src/services/apiFootball";
import { isKickoffTbc, computeLikelyPlaceholderTbcIds } from "@/src/utils/kickoffTbc";

type FollowedItem = {
  fixtureId: string;
  kickoffIso?: string | null;
  leagueId?: number;
  season?: number;
  round?: string | null;
  homeName?: string | null;
  awayName?: string | null;
};

type FollowStoreShape = {
  followed: FollowedItem[];
  upsertLatestSnapshot?: (fixtureId: string, patch: Record<string, any>) => void;
  // optional: if you store latestSnapshots map
  latestSnapshots?: Record<string, any>;
};

// IMPORTANT: keep this import path exactly as in your app
import useFollowStore from "@/src/state/followStore";

function cleanIso(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function titleFor(item: FollowedItem) {
  const h = String(item.homeName ?? "").trim();
  const a = String(item.awayName ?? "").trim();
  if (h && a) return `${h} vs ${a}`;
  return "Match update";
}

async function canNotify(): Promise<boolean> {
  try {
    const perms = await Notifications.getPermissionsAsync();
    return perms?.status === "granted";
  } catch {
    return false;
  }
}

async function notifyKickoffChanged(args: { title: string; fixtureId: string }) {
  if (!(await canNotify())) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Kickoff changed",
        body: `${args.title} — check your trip`,
        data: {
          kind: "kickoff_update",
          fixtureId: String(args.fixtureId),
        },
      },
      trigger: null,
    });
  } catch {
    // ignore – never crash refresh loop
  }
}

/**
 * Refresh followed matches.
 * - Best-effort, never throws.
 * - Updates followStore snapshots.
 * - Fires "Kickoff changed" local notification when:
 *   oldIso !== newIso AND new kickoff is not TBC (heuristic)
 */
export async function refreshFollowedMatches(opts?: { limit?: number; concurrency?: number }) {
  const limit = typeof opts?.limit === "number" ? opts!.limit! : 25;
  const concurrency = typeof opts?.concurrency === "number" ? opts!.concurrency! : 3;

  const store = (useFollowStore as any) as { getState: () => FollowStoreShape };
  const state = store.getState?.();
  const followedAll = Array.isArray(state?.followed) ? state.followed : [];
  const followed = followedAll.slice(0, Math.max(0, limit));

  if (followed.length === 0) return;

  // lightweight worker pool
  let idx = 0;
  const workers = new Array(Math.max(1, concurrency)).fill(null).map(async () => {
    while (idx < followed.length) {
      const my = followed[idx++];
      const fid = String(my?.fixtureId ?? "").trim();
      if (!fid) continue;

      let row: any = null;
      try {
        row = await getFixtureById(fid);
      } catch {
        continue;
      }
      if (!row) continue;

      const newIso = cleanIso(row?.fixture?.date);
      const oldIso = cleanIso(my?.kickoffIso);

      // We need placeholder inference to avoid firing false “changed” when API still placeholder.
      // We don’t have a round list here (costly). So we use per-row heuristic only.
      const newIsTbc = isKickoffTbc(row, undefined);

      // Trigger only when:
      // - both iso exist
      // - they differ
      // - new isn't TBC
      if (oldIso && newIso && oldIso !== newIso && !newIsTbc) {
        await notifyKickoffChanged({ title: titleFor(my), fixtureId: fid });
      }

      // Update store snapshot (best-effort)
      try {
        const upsert = (store.getState() as any)?.upsertLatestSnapshot;
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
        } else {
          // If your store doesn’t expose upsertLatestSnapshot,
          // you still get notifications, but snapshot persistence depends on your store.
        }
      } catch {
        // never crash refresh
      }
    }
  });

  try {
    await Promise.all(workers);
  } catch {
    // ignore
  }
}
