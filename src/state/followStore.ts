// src/state/followStore.ts
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

import storage from "@/src/services/storage";

export type FollowAlertPrefs = {
  kickoffConfirmed: boolean; // notify when kickoff date/time becomes confirmed / changes
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

  // HUMAN LABELS (critical for "Following" list UX)
  homeName: string | null;
  awayName: string | null;
  leagueName: string | null;

  kickoffIso: string | null; // null = TBC / unknown
  venue: string | null;
  city: string | null;

  alerts: FollowAlertPrefs;

  createdAt: string; // ISO
  lastSeenAt?: string; // ISO
};

export type FollowSnapshot = {
  kickoffIso?: string | null;
  venue?: string | null;
  city?: string | null;

  homeTeamId?: number;
  awayTeamId?: number;
  leagueId?: number;
  season?: number;

  // NEW (optional snapshot label refresh)
  homeName?: string | null;
  awayName?: string | null;
  leagueName?: string | null;
};

type FollowState = {
  defaultAlerts: FollowAlertPrefs;
  followed: FollowedMatch[];

  isFollowing: (fixtureId: string) => boolean;

  follow: (
    m: Omit<FollowedMatch, "createdAt" | "lastSeenAt" | "alerts"> & {
      alerts?: Partial<FollowAlertPrefs>;
    }
  ) => void;

  unfollow: (fixtureId: string) => void;

  toggle: (
    m: Omit<FollowedMatch, "createdAt" | "lastSeenAt" | "alerts"> & {
      alerts?: Partial<FollowAlertPrefs>;
    }
  ) => void;

  upsertKickoff: (fixtureId: string, kickoffIso: string | null) => void;
  upsertLatestSnapshot: (fixtureId: string, patch: FollowSnapshot) => void;

  setDefaultAlerts: (patch: Partial<FollowAlertPrefs>) => void;
  setAlertsForFixture: (fixtureId: string, patch: Partial<FollowAlertPrefs>) => void;
  toggleAlertForFixture: (fixtureId: string, key: keyof FollowAlertPrefs) => void;

  clearAll: () => void;
};

function normalizeId(id: unknown) {
  return String(id ?? "").trim();
}

function cleanName(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function nowIso() {
  return new Date().toISOString();
}

function clampNum(n: unknown, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
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
 * Web-safe persisted storage for Zustand.
 * Uses our best-effort storage wrapper:
 * - Web: localStorage (fallback mem)
 * - Native: AsyncStorage (fallback mem)
 */
const followPersistStorage: StateStorage = {
  getItem: async (name) => {
    const v = await storage.getString(name);
    return v;
  },
  setItem: async (name, value) => {
    await storage.setString(name, value);
  },
  removeItem: async (name) => {
    await storage.remove(name);
  },
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

          const next: FollowedMatch = {
            fixtureId: id,

            leagueId: clampNum(m.leagueId),
            season: clampNum(m.season),

            homeTeamId: clampNum(m.homeTeamId),
            awayTeamId: clampNum(m.awayTeamId),

            homeName: cleanName(m.homeName),
            awayName: cleanName(m.awayName),
            leagueName: cleanName(m.leagueName),

            kickoffIso: m.kickoffIso ?? null,
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

        set((state) => ({
          followed: state.followed.filter((x) => x.fixtureId !== id),
        }));
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

            return {
              ...x,
              leagueId: patch.leagueId != null ? clampNum(patch.leagueId, x.leagueId) : x.leagueId,
              season: patch.season != null ? clampNum(patch.season, x.season) : x.season,

              homeTeamId: patch.homeTeamId != null ? clampNum(patch.homeTeamId, x.homeTeamId) : x.homeTeamId,
              awayTeamId: patch.awayTeamId != null ? clampNum(patch.awayTeamId, x.awayTeamId) : x.awayTeamId,

              // Names: only overwrite if patch explicitly provides (including null)
              homeName: patch.homeName !== undefined ? (cleanName(patch.homeName) ?? null) : x.homeName,
              awayName: patch.awayName !== undefined ? (cleanName(patch.awayName) ?? null) : x.awayName,
              leagueName: patch.leagueName !== undefined ? (cleanName(patch.leagueName) ?? null) : x.leagueName,

              kickoffIso: patch.kickoffIso !== undefined ? (patch.kickoffIso ?? null) : x.kickoffIso,
              venue: patch.venue !== undefined ? (patch.venue ?? null) : x.venue,
              city: patch.city !== undefined ? (patch.city ?? null) : x.city,

              // alerts NEVER touched here
              lastSeenAt: nowIso(),
            };
          }),
        }));
      },

      setDefaultAlerts: (patch) => {
        set((state) => ({
          defaultAlerts: mergeAlerts(state.defaultAlerts, patch),
        }));
      },

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
      version: 4, // bump version due to new fields
      storage: createJSONStorage(() => followPersistStorage),

      partialize: (state) => ({ followed: state.followed, defaultAlerts: state.defaultAlerts }),

      migrate: (persistedState) => {
        const s = persistedState as any;

        const defaultAlerts: FollowAlertPrefs = mergeAlerts(
          DEFAULT_FOLLOW_ALERTS,
          (s?.defaultAlerts ?? undefined) as Partial<FollowAlertPrefs> | undefined
        );

        const followedRaw = Array.isArray(s?.followed) ? s.followed : [];
        const followed: FollowedMatch[] = followedRaw.map((x: any) => {
          const alerts = mergeAlerts(defaultAlerts, x?.alerts ?? undefined);

          return {
            fixtureId: normalizeId(x?.fixtureId),

            leagueId: clampNum(x?.leagueId),
            season: clampNum(x?.season),

            homeTeamId: clampNum(x?.homeTeamId),
            awayTeamId: clampNum(x?.awayTeamId),

            // NEW: handle old persisted data without names
            homeName: cleanName(x?.homeName),
            awayName: cleanName(x?.awayName),
            leagueName: cleanName(x?.leagueName),

            kickoffIso: x?.kickoffIso ?? null,
            venue: x?.venue ?? null,
            city: x?.city ?? null,

            alerts,

            createdAt: x?.createdAt ?? nowIso(),
            lastSeenAt: x?.lastSeenAt ?? x?.createdAt ?? nowIso(),
          };
        });

        const cleaned = followed.filter((x) => !!x.fixtureId);
        return { followed: cleaned, defaultAlerts };
      },
    }
  )
);

export default useFollowStore;
