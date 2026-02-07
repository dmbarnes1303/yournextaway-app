// src/state/followStore.ts
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import storage from "@/src/services/storage";

export type FollowAlertPrefs = {
  kickoffConfirmed: boolean;

  flightPriceDrops: boolean;
  stayPriceDrops: boolean;
  ticketAvailability: boolean;

  reminders: boolean;
};

export const DEFAULT_FOLLOW_ALERTS: FollowAlertPrefs = {
  kickoffConfirmed: true,
  flightPriceDrops: false,
  stayPriceDrops: false,
  ticketAvailability: false,
  reminders: false,
};

export type FollowedMatch = {
  fixtureId: string;

  leagueId: number;
  season: number;

  homeTeamId: number;
  awayTeamId: number;

  // Human readable labels captured at follow-time
  homeName: string | null;
  awayName: string | null;
  leagueName: string | null;

  // Needed for “likely TBC” inference later
  round: string | null;

  kickoffIso: string | null;

  /**
   * Heuristic: many leagues publish “default KO times” before TV/ops confirms.
   * null = unknown, true = likely TBC, false = likely confirmed.
   */
  kickoffLikelyTbc: boolean | null;

  /**
   * Anti-spam: last kickoffIso we already notified the user about (for kickoff alerts).
   * If kickoff changes to a *new* value, we can notify again and update this.
   */
  lastNotifiedKickoffIso?: string | null;

  venue: string | null;
  city: string | null;

  alerts: FollowAlertPrefs;

  createdAt: string;
  lastSeenAt?: string;
};

export type FollowSnapshot = {
  kickoffIso?: string | null;
  venue?: string | null;
  city?: string | null;

  homeTeamId?: number;
  awayTeamId?: number;

  leagueId?: number;
  season?: number;

  homeName?: string | null;
  awayName?: string | null;
  leagueName?: string | null;

  round?: string | null;

  kickoffLikelyTbc?: boolean | null;
};

type FollowPayload = Omit<
  FollowedMatch,
  "createdAt" | "lastSeenAt" | "alerts" | "kickoffLikelyTbc" | "lastNotifiedKickoffIso"
> & {
  alerts?: Partial<FollowAlertPrefs>;
  kickoffLikelyTbc?: boolean | null;
};

export type ApplyFixtureUpdateResult = {
  fixtureId: string;
  existed: boolean;

  kickoffChanged: boolean;
  becameConfirmed: boolean;

  shouldNotifyKickoff: boolean;

  prevKickoffIso: string | null;
  nextKickoffIso: string | null;

  prevLikelyTbc: boolean | null;
  nextLikelyTbc: boolean | null;
};

type FollowState = {
  defaultAlerts: FollowAlertPrefs;
  followed: FollowedMatch[];

  isFollowing: (fixtureId: string) => boolean;

  follow: (m: FollowPayload) => void;
  unfollow: (fixtureId: string) => void;
  toggle: (m: FollowPayload) => void;

  upsertKickoff: (fixtureId: string, kickoffIso: string | null) => void;
  upsertLatestSnapshot: (fixtureId: string, patch: FollowSnapshot) => void;

  applyFixtureUpdate: (fixtureId: string, patch: FollowSnapshot) => ApplyFixtureUpdateResult | null;

  /** Mark that we already notified the user about kickoffIso for this fixture. */
  markKickoffNotified: (fixtureId: string, kickoffIso: string | null) => void;

  setDefaultAlerts: (patch: Partial<FollowAlertPrefs>) => void;
  setAlertsForFixture: (fixtureId: string, patch: Partial<FollowAlertPrefs>) => void;
  toggleAlertForFixture: (fixtureId: string, key: keyof FollowAlertPrefs) => void;

  clearAll: () => void;
};

function normalizeId(id: unknown) {
  return String(id ?? "").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function clampNum(n: unknown, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function cleanStr(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function mergeAlerts(base: FollowAlertPrefs, patch?: Partial<FollowAlertPrefs>): FollowAlertPrefs {
  if (!patch) return { ...base };
  return {
    kickoffConfirmed: patch.kickoffConfirmed ?? base.kickoffConfirmed,
    flightPriceDrops: patch.flightPriceDrops ?? base.flightPriceDrops,
    stayPriceDrops: patch.stayPriceDrops ?? base.stayPriceDrops,
    ticketAvailability: patch.ticketAvailability ?? base.ticketAvailability,
    reminders: patch.reminders ?? base.reminders,
  };
}

/**
 * Heuristic helper for “likely TBC”.
 * - Anything within 21 days: treat as confirmed.
 * - Otherwise: if >= threshold fixtures share same KO within (leagueId+season+round), treat as likely TBC.
 */
function inferLikelyTbc(opts: {
  fixtureKickoffIso: string | null;
  leagueId: number;
  season: number;
  round: string | null;
  allFollowed: FollowedMatch[];
  now?: Date;
  daysConfirmedCutoff?: number; // default 21
  clusterThreshold?: number; // default 7
}): boolean | null {
  const {
    fixtureKickoffIso,
    leagueId,
    season,
    round,
    allFollowed,
    now = new Date(),
    daysConfirmedCutoff = 21,
    clusterThreshold = 7,
  } = opts;

  if (!fixtureKickoffIso) return true;

  const d = new Date(fixtureKickoffIso);
  if (Number.isNaN(d.getTime())) return true;

  const ms = d.getTime() - now.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  if (days <= daysConfirmedCutoff) return false;

  const r = String(round ?? "").trim();
  if (!r) return null;

  const keyLeague = Number.isFinite(leagueId) ? leagueId : 0;
  const keySeason = Number.isFinite(season) ? season : 0;

  const sameBucket = allFollowed.filter(
    (x) =>
      x.leagueId === keyLeague &&
      x.season === keySeason &&
      String(x.round ?? "").trim() === r &&
      !!x.kickoffIso
  );

  const sameKo = sameBucket.filter((x) => x.kickoffIso === fixtureKickoffIso);

  if (sameKo.length >= clusterThreshold) return true;

  return false;
}

const followPersistStorage: StateStorage = {
  getItem: async (name) => storage.getString(name),
  setItem: async (name, value) => storage.setString(name, value),
  removeItem: async (name) => storage.remove(name),
};

const useFollowStore = create<FollowState>()(
  persist(
    (set, get) => ({
      defaultAlerts: { ...DEFAULT_FOLLOW_ALERTS },
      followed: [],

      isFollowing: (fixtureId: string) => {
        const id = normalizeId(fixtureId);
        if (!id) return false;
        return get().followed.some((x) => x.fixtureId === id);
      },

      follow: (m) => {
        const id = normalizeId(m.fixtureId);
        if (!id) return;

        set((state) => {
          const filtered = state.followed.filter((x) => x.fixtureId !== id);
          const alerts = mergeAlerts(state.defaultAlerts, m.alerts);

          const kickoffIso = m.kickoffIso ?? null;

          const inferred =
            m.kickoffLikelyTbc !== undefined
              ? m.kickoffLikelyTbc
              : inferLikelyTbc({
                  fixtureKickoffIso: kickoffIso,
                  leagueId: clampNum(m.leagueId),
                  season: clampNum(m.season),
                  round: cleanStr(m.round),
                  allFollowed: state.followed,
                });

          const next: FollowedMatch = {
            fixtureId: id,

            leagueId: clampNum(m.leagueId),
            season: clampNum(m.season),

            homeTeamId: clampNum(m.homeTeamId),
            awayTeamId: clampNum(m.awayTeamId),

            homeName: cleanStr(m.homeName),
            awayName: cleanStr(m.awayName),
            leagueName: cleanStr(m.leagueName),
            round: cleanStr(m.round),

            kickoffIso,
            kickoffLikelyTbc: inferred ?? null,

            lastNotifiedKickoffIso: null,

            venue: m.venue ?? null,
            city: m.city ?? null,

            alerts,

            createdAt: nowIso(),
            lastSeenAt: nowIso(),
          };

          return { followed: [next, ...filtered] };
        });
      },

      unfollow: (fixtureId) => {
        const id = normalizeId(fixtureId);
        if (!id) return;
        set((state) => ({ followed: state.followed.filter((x) => x.fixtureId !== id) }));
      },

      toggle: (m) => {
        const id = normalizeId(m.fixtureId);
        if (!id) return;

        const exists = get().followed.some((x) => x.fixtureId === id);
        if (exists) get().unfollow(id);
        else get().follow(m);
      },

      upsertKickoff: (fixtureId, kickoffIso) => {
        const id = normalizeId(fixtureId);
        if (!id) return;

        set((state) => ({
          followed: state.followed.map((x) =>
            x.fixtureId === id ? { ...x, kickoffIso: kickoffIso ?? null, lastSeenAt: nowIso() } : x
          ),
        }));
      },

      upsertLatestSnapshot: (fixtureId, patch) => {
        const id = normalizeId(fixtureId);
        if (!id) return;

        set((state) => ({
          followed: state.followed.map((x) => {
            if (x.fixtureId !== id) return x;

            const nextKickoffIso =
              patch.kickoffIso !== undefined ? (patch.kickoffIso ?? null) : x.kickoffIso;

            const nextRound = patch.round !== undefined ? cleanStr(patch.round) : x.round;

            const nextLikelyTbc =
              patch.kickoffLikelyTbc !== undefined
                ? patch.kickoffLikelyTbc
                : inferLikelyTbc({
                    fixtureKickoffIso: nextKickoffIso,
                    leagueId: patch.leagueId != null ? clampNum(patch.leagueId, x.leagueId) : x.leagueId,
                    season: patch.season != null ? clampNum(patch.season, x.season) : x.season,
                    round: nextRound,
                    allFollowed: state.followed,
                  });

            return {
              ...x,
              leagueId: patch.leagueId != null ? clampNum(patch.leagueId, x.leagueId) : x.leagueId,
              season: patch.season != null ? clampNum(patch.season, x.season) : x.season,

              homeTeamId: patch.homeTeamId != null ? clampNum(patch.homeTeamId, x.homeTeamId) : x.homeTeamId,
              awayTeamId: patch.awayTeamId != null ? clampNum(patch.awayTeamId, x.awayTeamId) : x.awayTeamId,

              homeName: patch.homeName !== undefined ? cleanStr(patch.homeName) : x.homeName,
              awayName: patch.awayName !== undefined ? cleanStr(patch.awayName) : x.awayName,
              leagueName: patch.leagueName !== undefined ? cleanStr(patch.leagueName) : x.leagueName,
              round: nextRound,

              kickoffIso: nextKickoffIso,
              kickoffLikelyTbc: nextLikelyTbc ?? x.kickoffLikelyTbc ?? null,

              venue: patch.venue !== undefined ? (patch.venue ?? null) : x.venue,
              city: patch.city !== undefined ? (patch.city ?? null) : x.city,

              lastSeenAt: nowIso(),
            };
          }),
        }));
      },

      applyFixtureUpdate: (fixtureId, patch) => {
        const id = normalizeId(fixtureId);
        if (!id) return null;

        const stateBefore = get();
        const existing = stateBefore.followed.find((x) => x.fixtureId === id);
        if (!existing) {
          return {
            fixtureId: id,
            existed: false,
            kickoffChanged: false,
            becameConfirmed: false,
            shouldNotifyKickoff: false,
            prevKickoffIso: null,
            nextKickoffIso: null,
            prevLikelyTbc: null,
            nextLikelyTbc: null,
          };
        }

        const prevKickoffIso = existing.kickoffIso ?? null;
        const prevLikelyTbc = existing.kickoffLikelyTbc ?? null;

        const nextKickoffIso =
          patch.kickoffIso !== undefined ? (patch.kickoffIso ?? null) : prevKickoffIso;

        const nextLeagueId =
          patch.leagueId != null ? clampNum(patch.leagueId, existing.leagueId) : existing.leagueId;
        const nextSeason =
          patch.season != null ? clampNum(patch.season, existing.season) : existing.season;
        const nextRound = patch.round !== undefined ? cleanStr(patch.round) : existing.round;

        const nextLikelyTbc =
          patch.kickoffLikelyTbc !== undefined
            ? patch.kickoffLikelyTbc
            : inferLikelyTbc({
                fixtureKickoffIso: nextKickoffIso,
                leagueId: nextLeagueId,
                season: nextSeason,
                round: nextRound,
                allFollowed: stateBefore.followed,
              });

        const kickoffChanged = prevKickoffIso !== nextKickoffIso;
        const becameConfirmed = (prevLikelyTbc === true || prevKickoffIso === null) && nextLikelyTbc === false;

        const wantsKickoffAlert = !!existing.alerts?.kickoffConfirmed;
        const alreadyNotifiedFor = existing.lastNotifiedKickoffIso ?? null;

        // Notify only if:
        // - user wants kickoff alerts
        // - kickoff changed to a new value
        // - and we have not already notified for this exact kickoffIso
        const shouldNotifyKickoff =
          wantsKickoffAlert &&
          kickoffChanged &&
          (nextKickoffIso ? nextKickoffIso !== alreadyNotifiedFor : true);

        get().upsertLatestSnapshot(id, {
          ...patch,
          kickoffIso: nextKickoffIso,
          round: nextRound,
          leagueId: nextLeagueId,
          season: nextSeason,
          kickoffLikelyTbc: nextLikelyTbc ?? null,
        });

        return {
          fixtureId: id,
          existed: true,
          kickoffChanged,
          becameConfirmed,
          shouldNotifyKickoff,
          prevKickoffIso,
          nextKickoffIso,
          prevLikelyTbc,
          nextLikelyTbc: (nextLikelyTbc ?? null) as any,
        };
      },

      markKickoffNotified: (fixtureId, kickoffIso) => {
        const id = normalizeId(fixtureId);
        if (!id) return;

        set((state) => ({
          followed: state.followed.map((x) =>
            x.fixtureId === id ? { ...x, lastNotifiedKickoffIso: kickoffIso ?? null } : x
          ),
        }));
      },

      setDefaultAlerts: (patch) => set((state) => ({ defaultAlerts: mergeAlerts(state.defaultAlerts, patch) })),

      setAlertsForFixture: (fixtureId, patch) => {
        const id = normalizeId(fixtureId);
        if (!id) return;

        set((state) => ({
          followed: state.followed.map((x) =>
            x.fixtureId === id ? { ...x, alerts: mergeAlerts(x.alerts ?? state.defaultAlerts, patch) } : x
          ),
        }));
      },

      toggleAlertForFixture: (fixtureId, key) => {
        const id = normalizeId(fixtureId);
        if (!id) return;

        set((state) => ({
          followed: state.followed.map((x) => {
            if (x.fixtureId !== id) return x;
            const current = x.alerts ?? state.defaultAlerts;
            return { ...x, alerts: { ...current, [key]: !current[key] } };
          }),
        }));
      },

      clearAll: () => set({ followed: [] }),
    }),
    {
      name: "followedMatches",
      version: 6,
      storage: createJSONStorage(() => followPersistStorage),
      partialize: (state) => ({ followed: state.followed, defaultAlerts: state.defaultAlerts }),

      migrate: (persistedState) => {
        const s = persistedState as any;

        const defaultAlerts: FollowAlertPrefs = mergeAlerts(
          DEFAULT_FOLLOW_ALERTS,
          (s?.defaultAlerts ?? undefined) as Partial<FollowAlertPrefs> | undefined
        );

        const followedRaw = Array.isArray(s?.followed) ? s.followed : [];
        const followed: FollowedMatch[] = followedRaw
          .map((x: any) => {
            const id = normalizeId(x?.fixtureId);
            if (!id) return null;

            const alerts = mergeAlerts(defaultAlerts, x?.alerts ?? undefined);

            const lastNotifiedKickoffIso =
              x?.lastNotifiedKickoffIso != null ? String(x.lastNotifiedKickoffIso ?? "").trim() || null : null;

            return {
              fixtureId: id,

              leagueId: clampNum(x?.leagueId),
              season: clampNum(x?.season),

              homeTeamId: clampNum(x?.homeTeamId),
              awayTeamId: clampNum(x?.awayTeamId),

              homeName: cleanStr(x?.homeName),
              awayName: cleanStr(x?.awayName),
              leagueName: cleanStr(x?.leagueName),
              round: cleanStr(x?.round),

              kickoffIso: x?.kickoffIso ?? null,
              kickoffLikelyTbc:
                x?.kickoffLikelyTbc === true ? true : x?.kickoffLikelyTbc === false ? false : null,

              lastNotifiedKickoffIso,

              venue: x?.venue ?? null,
              city: x?.city ?? null,

              alerts,

              createdAt: x?.createdAt ?? nowIso(),
              lastSeenAt: x?.lastSeenAt ?? x?.createdAt ?? nowIso(),
            } as FollowedMatch;
          })
          .filter(Boolean) as FollowedMatch[];

        return { followed, defaultAlerts };
      },
    }
  )
);

export default useFollowStore;
