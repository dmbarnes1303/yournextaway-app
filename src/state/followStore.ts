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

  // Human readable labels captured at follow-time (so Following list can render real names)
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

  venue: string | null;
  city: string | null;

  /**
   * Sportsevents365 event id (enables exact deep-links: /event/{id})
   * null/undefined means we only have "search" level routing.
   */
  sportsevents365EventId: number | null;

  alerts: FollowAlertPrefs;

  /**
   * Anti-spam persistence:
   * - If kickoff flips back/forth due to API quirks, we only notify once per unique kickoffIso value.
   * - After a successful notify, call markKickoffNotified(fixtureId, kickoffIso).
   */
  lastNotifiedKickoffIso: string | null;
  lastNotifiedAt: string | null;

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

  sportsevents365EventId?: number | null;
};

type FollowPayload = Omit<
  FollowedMatch,
  "createdAt" | "lastSeenAt" | "alerts" | "kickoffLikelyTbc" | "lastNotifiedKickoffIso" | "lastNotifiedAt"
> & {
  alerts?: Partial<FollowAlertPrefs>;
  kickoffLikelyTbc?: boolean | null;
};

export type ApplyFixtureUpdateResult = {
  fixtureId: string;
  existed: boolean;

  kickoffChanged: boolean;
  becameConfirmed: boolean;

  /**
   * True when:
   * - user enabled alerts.kickoffConfirmed
   * - kickoffIso changed (prev vs next)
   * - we have not already notified for this exact next kickoffIso
   */
  shouldNotifyKickoff: boolean;

  prevKickoffIso: string | null;
  nextKickoffIso: string | null;

  prevLikelyTbc: boolean | null;
  nextLikelyTbc: boolean | null;

  lastNotifiedKickoffIso: string | null;
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

  /**
   * Call this ONLY after a successful notification send.
   * This is what prevents repeated notifications for the same kickoffIso.
   */
  markKickoffNotified: (fixtureId: string, kickoffIso: string | null) => void;

  setDefaultAlerts: (patch: Partial<FollowAlertPrefs>) => void;
  setAlertsForFixture: (fixtureId: string, patch: Partial<FollowAlertPrefs>) => void;
  toggleAlertForFixture: (fixtureId: string, key: keyof FollowAlertPrefs) => void;

  /**
   * Batch update: apply kickoffConfirmed across ALL existing followed matches.
   * This is what your Profile “Default alert” toggle should do.
   */
  setKickoffConfirmedForAll: (enabled: boolean) => void;

  /**
   * Convenience: sets default + batch for existing.
   */
  setKickoffConfirmedDefaultAndAll: (enabled: boolean) => void;

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

function cleanMaybeNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  // event ids should be integers; but don’t break if they send numeric string
  return Math.trunc(n);
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
 *
 * NOTE: It’s a best-effort signal, not truth.
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

            venue: m.venue ?? null,
            city: m.city ?? null,

            sportsevents365EventId: cleanMaybeNumber((m as any)?.sportsevents365EventId) ?? null,

            alerts,

            lastNotifiedKickoffIso: null,
            lastNotifiedAt: null,

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

            const nextKickoffIso = patch.kickoffIso !== undefined ? (patch.kickoffIso ?? null) : x.kickoffIso;
            const nextRound = patch.round !== undefined ? cleanStr(patch.round) : x.round;

            const nextLeagueId = patch.leagueId != null ? clampNum(patch.leagueId, x.leagueId) : x.leagueId;
            const nextSeason = patch.season != null ? clampNum(patch.season, x.season) : x.season;

            const nextLikelyTbc =
              patch.kickoffLikelyTbc !== undefined
                ? patch.kickoffLikelyTbc
                : inferLikelyTbc({
                    fixtureKickoffIso: nextKickoffIso,
                    leagueId: nextLeagueId,
                    season: nextSeason,
                    round: nextRound,
                    allFollowed: state.followed,
                  });

            const nextSe365EventId =
              patch.sportsevents365EventId !== undefined
                ? cleanMaybeNumber(patch.sportsevents365EventId)
                : x.sportsevents365EventId ?? null;

            return {
              ...x,

              leagueId: nextLeagueId,
              season: nextSeason,

              homeTeamId: patch.homeTeamId != null ? clampNum(patch.homeTeamId, x.homeTeamId) : x.homeTeamId,
              awayTeamId: patch.awayTeamId != null ? clampNum(patch.awayTeamId, x.awayTeamId) : x.awayTeamId,

              homeName: patch.homeName !== undefined ? cleanStr(patch.homeName) : x.homeName,
              awayName: patch.awayName !== undefined ? cleanStr(patch.awayName) : x.awayName,
              leagueName: patch.leagueName !== undefined ? cleanStr(patch.leagueName) : x.leagueName,

              round: nextRound,

              kickoffIso: nextKickoffIso,
              kickoffLikelyTbc: (nextLikelyTbc ?? x.kickoffLikelyTbc ?? null) as any,

              venue: patch.venue !== undefined ? (patch.venue ?? null) : x.venue,
              city: patch.city !== undefined ? (patch.city ?? null) : x.city,

              sportsevents365EventId: nextSe365EventId,

              lastSeenAt: nowIso(),
            };
          }),
        }));
      },

      applyFixtureUpdate: (fixtureId, patch) => {
        const id = normalizeId(fixtureId);
        if (!id) return null;

        const before = get();
        const existing = before.followed.find((x) => x.fixtureId === id);

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
            lastNotifiedKickoffIso: null,
          };
        }

        const prevKickoffIso = existing.kickoffIso ?? null;
        const prevLikelyTbc = existing.kickoffLikelyTbc ?? null;

        const nextKickoffIso = patch.kickoffIso !== undefined ? (patch.kickoffIso ?? null) : prevKickoffIso;

        const nextLeagueId = patch.leagueId != null ? clampNum(patch.leagueId, existing.leagueId) : existing.leagueId;
        const nextSeason = patch.season != null ? clampNum(patch.season, existing.season) : existing.season;
        const nextRound = patch.round !== undefined ? cleanStr(patch.round) : existing.round;

        const nextLikelyTbc =
          patch.kickoffLikelyTbc !== undefined
            ? patch.kickoffLikelyTbc
            : inferLikelyTbc({
                fixtureKickoffIso: nextKickoffIso,
                leagueId: nextLeagueId,
                season: nextSeason,
                round: nextRound,
                allFollowed: before.followed,
              });

        const kickoffChanged = prevKickoffIso !== nextKickoffIso;

        // “became confirmed” = previously TBC-ish (or null) → now likely confirmed
        const becameConfirmed = (prevLikelyTbc === true || prevKickoffIso === null) && nextLikelyTbc === false;

        const lastNotifiedKickoffIso = existing.lastNotifiedKickoffIso ?? null;

        // Anti-spam: only notify if we haven't already notified for THIS next kickoff value.
        const nextIsNewForNotify = nextKickoffIso != null && nextKickoffIso !== lastNotifiedKickoffIso;

        const shouldNotifyKickoff = !!existing.alerts?.kickoffConfirmed && kickoffChanged && nextIsNewForNotify;

        // Apply snapshot (single write)
        get().upsertLatestSnapshot(id, {
          ...patch,
          kickoffIso: nextKickoffIso,
          leagueId: nextLeagueId,
          season: nextSeason,
          round: nextRound,
          kickoffLikelyTbc: nextLikelyTbc ?? null,
          // sportsevents365EventId will be handled by upsertLatestSnapshot if included
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
          lastNotifiedKickoffIso,
        };
      },

      markKickoffNotified: (fixtureId, kickoffIso) => {
        const id = normalizeId(fixtureId);
        if (!id) return;

        const iso = kickoffIso != null ? String(kickoffIso).trim() : "";
        const nextIso = iso ? iso : null;

        set((state) => ({
          followed: state.followed.map((x) => {
            if (x.fixtureId !== id) return x;
            return {
              ...x,
              lastNotifiedKickoffIso: nextIso,
              lastNotifiedAt: nowIso(),
              lastSeenAt: nowIso(),
            };
          }),
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

      setKickoffConfirmedForAll: (enabled) => {
        set((state) => ({
          followed: state.followed.map((x) => ({
            ...x,
            alerts: {
              ...(x.alerts ?? state.defaultAlerts),
              kickoffConfirmed: !!enabled,
            },
          })),
        }));
      },

      setKickoffConfirmedDefaultAndAll: (enabled) => {
        const v = !!enabled;
        set((state) => ({
          defaultAlerts: { ...state.defaultAlerts, kickoffConfirmed: v },
          followed: state.followed.map((x) => ({
            ...x,
            alerts: {
              ...(x.alerts ?? state.defaultAlerts),
              kickoffConfirmed: v,
            },
          })),
        }));
      },

      clearAll: () => set({ followed: [] }),
    }),
    {
      name: "followedMatches",
      version: 9, // bumped: adds sportsevents365EventId persistence
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

            const lastNotifiedKickoffIso = cleanStr(x?.lastNotifiedKickoffIso);
            const lastNotifiedAt = cleanStr(x?.lastNotifiedAt);

            const se365Id =
              cleanMaybeNumber(x?.sportsevents365EventId) ??
              cleanMaybeNumber(x?.se365EventId) ??
              cleanMaybeNumber(x?.sportsevents365_event_id) ??
              null;

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
              kickoffLikelyTbc: x?.kickoffLikelyTbc === true ? true : x?.kickoffLikelyTbc === false ? false : null,

              venue: x?.venue ?? null,
              city: x?.city ?? null,

              sportsevents365EventId: se365Id,

              alerts,

              lastNotifiedKickoffIso: lastNotifiedKickoffIso ?? null,
              lastNotifiedAt: lastNotifiedAt ?? null,

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
