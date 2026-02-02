// src/state/followStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * FOLLOW MODEL (Option B)
 * "Follow" subscribes users to:
 * - kickoff confirmation (TBC -> confirmed)
 * - material changes (date/time/venue/city changes)
 *
 * Travel alerts are defined but OFF by default until you have real data sources.
 *
 * IMPORTANT:
 * - This store is local, session-only persistence (AsyncStorage).
 * - True alerts (push/email) should be driven by backend jobs later.
 * - Still: we MUST store baseline snapshots now, so we can detect changes later.
 */

export type AlertPrefs = {
  kickoffConfirm: boolean; // TBC -> confirmed
  materialChanges: boolean; // confirmed values change
  flightDrops: boolean; // later
  stayDrops: boolean; // later
  ticketChanges: boolean; // later
};

export type FixtureSnapshot = {
  // identifying context (useful later for backend jobs)
  fixtureId: string;
  leagueId: number;
  season: number;
  homeTeamId: number;
  awayTeamId: number;

  // values we care about for alerts + display
  kickoffIso: string | null; // null => unknown/TBC
  kickoffDateOnly: string | null; // YYYY-MM-DD
  kickoffTimeOnly: string | null; // HH:mm (local display extraction; best-effort)
  venue: string | null;
  city: string | null;

  // computed flags
  isTbc: boolean; // true if kickoffIso is null OR looks like placeholder time
  snapshotHash: string; // stable hash of material fields above
  observedAt: string; // when this snapshot was taken
};

export type FollowedMatch = {
  fixtureId: string;

  // Baseline snapshot captured when user hits Follow
  baseline: FixtureSnapshot;

  // Latest snapshot we’ve seen (updated when we fetch fresh fixture data)
  latest: FixtureSnapshot;

  alerts: AlertPrefs;

  createdAt: string; // when followed
  updatedAt: string; // last time record changed locally

  // Debounce controls (for future notification job + on-device banners)
  lastNotifiedAt: string | null;
  lastChangeDetectedAt: string | null;
};

type FollowState = {
  followed: FollowedMatch[];

  isFollowing: (fixtureId: string) => boolean;
  getFollow: (fixtureId: string) => FollowedMatch | null;

  follow: (snap: Omit<FixtureSnapshot, "snapshotHash" | "observedAt" | "isTbc">) => void;
  unfollow: (fixtureId: string) => void;
  toggle: (snap: Omit<FixtureSnapshot, "snapshotHash" | "observedAt" | "isTbc">) => void;

  /**
   * Update the latest snapshot for a followed match.
   * This is the hook your Fixtures screen (or Match screen) can call after fetching.
   */
  upsertLatestSnapshot: (snap: Omit<FixtureSnapshot, "snapshotHash" | "observedAt" | "isTbc">) => void;

  /**
   * Update alert preferences for a followed match.
   */
  setAlertPrefs: (fixtureId: string, prefs: Partial<AlertPrefs>) => void;

  /**
   * Mark that we actually notified the user (used for debouncing).
   * (Later: the server job will set this in DB; locally you can still use it.)
   */
  markNotified: (fixtureId: string, whenIso?: string) => void;

  clearAll: () => void;
};

// --------------------
// helpers
// --------------------

function normalizeId(id: unknown) {
  return String(id ?? "").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function cleanStr(x: unknown): string {
  return String(x ?? "").trim();
}

function cleanOrNull(x: unknown): string | null {
  const s = cleanStr(x);
  return s ? s : null;
}

/**
 * Best-effort derivations:
 * - kickoffDateOnly: YYYY-MM-DD
 * - kickoffTimeOnly: HH:mm (local) if valid ISO, else null
 */
function deriveDateOnly(kickoffIso: string | null): string | null {
  if (!kickoffIso) return null;
  const m = String(kickoffIso).match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function deriveTimeOnlyLocal(kickoffIso: string | null): string | null {
  if (!kickoffIso) return null;
  const d = new Date(kickoffIso);
  if (Number.isNaN(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * "TBC" detection:
 * You told me La Liga often returns a placeholder kickoff time.
 *
 * Reality: APIs vary. Some use 00:00, some 17:00, some 12:00 as placeholder.
 * So we treat TBC as:
 * - kickoffIso missing OR invalid
 * - OR time looks like a known placeholder for your leagues
 *
 * IMPORTANT: this is a heuristic. The real fix later is:
 * store status.short/long or league-specific "confirmed" flags if API provides.
 */
function isTbcKickoff(kickoffIso: string | null): boolean {
  if (!kickoffIso) return true;
  const d = new Date(kickoffIso);
  if (Number.isNaN(d.getTime())) return true;

  const hh = d.getHours();
  const mm = d.getMinutes();

  // Common placeholder patterns (heuristic):
  // 00:00, 12:00, 17:00 exactly.
  if (mm === 0 && (hh === 0 || hh === 12 || hh === 17)) return true;

  return false;
}

/**
 * Stable hash of material fields:
 * - date/time/venue/city + team ids + league/season
 *
 * If this hash changes, it’s a "material change".
 */
function computeSnapshotHash(s: {
  fixtureId: string;
  leagueId: number;
  season: number;
  homeTeamId: number;
  awayTeamId: number;
  kickoffIso: string | null;
  venue: string | null;
  city: string | null;
}): string {
  const parts = [
    `fx:${s.fixtureId}`,
    `l:${String(s.leagueId)}`,
    `s:${String(s.season)}`,
    `h:${String(s.homeTeamId)}`,
    `a:${String(s.awayTeamId)}`,
    `k:${s.kickoffIso ?? "null"}`,
    `v:${s.venue ?? "null"}`,
    `c:${s.city ?? "null"}`,
  ];
  return parts.join("|");
}

function buildSnapshot(
  input: Omit<FixtureSnapshot, "snapshotHash" | "observedAt" | "isTbc">
): FixtureSnapshot {
  const fixtureId = normalizeId(input.fixtureId);

  const kickoffIso = input.kickoffIso ? cleanStr(input.kickoffIso) : null;
  const venue = cleanOrNull(input.venue);
  const city = cleanOrNull(input.city);

  const snapBase = {
    fixtureId,
    leagueId: Number(input.leagueId) || 0,
    season: Number(input.season) || 0,
    homeTeamId: Number(input.homeTeamId) || 0,
    awayTeamId: Number(input.awayTeamId) || 0,
    kickoffIso,
    venue,
    city,
  };

  const dateOnly = deriveDateOnly(kickoffIso);
  const timeOnly = deriveTimeOnlyLocal(kickoffIso);
  const tbc = isTbcKickoff(kickoffIso);

  return {
    ...snapBase,
    kickoffDateOnly: dateOnly,
    kickoffTimeOnly: timeOnly,
    isTbc: tbc,
    snapshotHash: computeSnapshotHash(snapBase),
    observedAt: nowIso(),
  };
}

const DEFAULT_ALERT_PREFS: AlertPrefs = {
  kickoffConfirm: true,
  materialChanges: true,
  flightDrops: false,
  stayDrops: false,
  ticketChanges: false,
};

// --------------------
// store
// --------------------

const useFollowStore = create<FollowState>()(
  persist(
    (set, get) => ({
      followed: [],

      isFollowing: (fixtureId: string) => {
        const id = normalizeId(fixtureId);
        if (!id) return false;
        return get().followed.some((x) => x.fixtureId === id);
      },

      getFollow: (fixtureId: string) => {
        const id = normalizeId(fixtureId);
        if (!id) return null;
        return get().followed.find((x) => x.fixtureId === id) ?? null;
      },

      follow: (snapInput) => {
        const id = normalizeId(snapInput.fixtureId);
        if (!id) return;

        const snapshot = buildSnapshot({ ...snapInput, fixtureId: id });

        set((state) => {
          const filtered = state.followed.filter((x) => x.fixtureId !== id);

          const next: FollowedMatch = {
            fixtureId: id,
            baseline: snapshot,
            latest: snapshot,
            alerts: { ...DEFAULT_ALERT_PREFS },
            createdAt: nowIso(),
            updatedAt: nowIso(),
            lastNotifiedAt: null,
            lastChangeDetectedAt: null,
          };

          return { followed: [next, ...filtered] };
        });
      },

      unfollow: (fixtureId) => {
        const id = normalizeId(fixtureId);
        if (!id) return;

        set((state) => ({
          followed: state.followed.filter((x) => x.fixtureId !== id),
        }));
      },

      toggle: (snapInput) => {
        const id = normalizeId(snapInput.fixtureId);
        if (!id) return;

        const exists = get().followed.some((x) => x.fixtureId === id);
        if (exists) get().unfollow(id);
        else get().follow(snapInput);
      },

      upsertLatestSnapshot: (snapInput) => {
        const id = normalizeId(snapInput.fixtureId);
        if (!id) return;

        const nextSnap = buildSnapshot({ ...snapInput, fixtureId: id });

        set((state) => {
          const existing = state.followed.find((x) => x.fixtureId === id);
          if (!existing) {
            // If not currently followed, do nothing.
            return state;
          }

          const prevLatest = existing.latest;
          const changed = prevLatest.snapshotHash !== nextSnap.snapshotHash;

          // Detect "kickoff confirmed" transition:
          const wasTbc = Boolean(prevLatest.isTbc);
          const nowTbc = Boolean(nextSnap.isTbc);
          const kickoffConfirmed = wasTbc && !nowTbc;

          // Record change detection timestamp (debounce uses this later)
          const lastChangeDetectedAt =
            changed || kickoffConfirmed ? nowIso() : existing.lastChangeDetectedAt;

          const updated: FollowedMatch = {
            ...existing,
            latest: nextSnap,
            updatedAt: nowIso(),
            lastChangeDetectedAt,
          };

          return {
            followed: state.followed.map((x) => (x.fixtureId === id ? updated : x)),
          };
        });
      },

      setAlertPrefs: (fixtureId, prefs) => {
        const id = normalizeId(fixtureId);
        if (!id) return;

        set((state) => ({
          followed: state.followed.map((x) =>
            x.fixtureId === id
              ? {
                  ...x,
                  alerts: { ...x.alerts, ...prefs },
                  updatedAt: nowIso(),
                }
              : x
          ),
        }));
      },

      markNotified: (fixtureId, whenIso) => {
        const id = normalizeId(fixtureId);
        if (!id) return;

        const when = cleanStr(whenIso) || nowIso();

        set((state) => ({
          followed: state.followed.map((x) =>
            x.fixtureId === id
              ? {
                  ...x,
                  lastNotifiedAt: when,
                  updatedAt: nowIso(),
                }
              : x
          ),
        }));
      },

      clearAll: () => set({ followed: [] }),
    }),
    {
      name: "followedMatches",
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({ followed: state.followed }),

      migrate: (persistedState) => {
        // v1 -> v2 migration (your previous shape was FollowedMatch without snapshots/prefs)
        const s = persistedState as any;
        const arr = Array.isArray(s?.followed) ? s.followed : [];

        // If already in v2 shape, keep as-is.
        const looksV2 = arr.some((x: any) => x?.baseline?.snapshotHash && x?.latest?.snapshotHash);
        if (looksV2) return { followed: arr };

        // Convert v1 rows into v2 by constructing baseline/latest snapshots from existing fields.
        const migrated: FollowedMatch[] = arr
          .map((x: any) => {
            const fixtureId = normalizeId(x?.fixtureId);
            if (!fixtureId) return null;

            const leagueId = Number(x?.leagueId) || 0;
            const season = Number(x?.season) || 0;
            const homeTeamId = Number(x?.homeTeamId) || 0;
            const awayTeamId = Number(x?.awayTeamId) || 0;
            const kickoffIso = x?.kickoffIso ? cleanStr(x.kickoffIso) : null;
            const venue = cleanOrNull(x?.venue);
            const city = cleanOrNull(x?.city);

            const snap = buildSnapshot({
              fixtureId,
              leagueId,
              season,
              homeTeamId,
              awayTeamId,
              kickoffIso,
              venue,
              city,
              kickoffDateOnly: null as any, // ignored by buildSnapshot input type
              kickoffTimeOnly: null as any, // ignored
            } as any);

            const createdAt = x?.createdAt ? cleanStr(x.createdAt) : nowIso();

            const out: FollowedMatch = {
              fixtureId,
              baseline: snap,
              latest: snap,
              alerts: { ...DEFAULT_ALERT_PREFS },
              createdAt,
              updatedAt: nowIso(),
              lastNotifiedAt: null,
              lastChangeDetectedAt: null,
            };

            return out;
          })
          .filter(Boolean) as FollowedMatch[];

        return { followed: migrated };
      },
    }
  )
);

export default useFollowStore;
