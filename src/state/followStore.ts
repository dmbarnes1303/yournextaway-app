// src/state/followStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FollowedMatch = {
  fixtureId: string;
  leagueId: number;
  season: number;

  homeTeamId: number;
  awayTeamId: number;

  kickoffIso: string | null; // null = TBC / unknown
  venue: string | null;
  city: string | null;

  createdAt: string; // ISO
  lastSeenAt?: string; // ISO (when we last refreshed snapshot from API)
};

type FollowSnapshot = {
  kickoffIso?: string | null;
  venue?: string | null;
  city?: string | null;
  homeTeamId?: number;
  awayTeamId?: number;
  leagueId?: number;
  season?: number;
};

type FollowState = {
  followed: FollowedMatch[];

  isFollowing: (fixtureId: string) => boolean;

  follow: (m: Omit<FollowedMatch, "createdAt" | "lastSeenAt">) => void;
  unfollow: (fixtureId: string) => void;
  toggle: (m: Omit<FollowedMatch, "createdAt" | "lastSeenAt">) => void;

  upsertKickoff: (fixtureId: string, kickoffIso: string | null) => void;

  // Proper “snapshot update” used by Fixtures fetches to keep followed matches fresh.
  upsertLatestSnapshot: (fixtureId: string, patch: FollowSnapshot) => void;

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

const useFollowStore = create<FollowState>()(
  persist(
    (set, get) => ({
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

          const next: FollowedMatch = {
            ...m,
            fixtureId: id,
            leagueId: clampNum(m.leagueId),
            season: clampNum(m.season),
            homeTeamId: clampNum(m.homeTeamId),
            awayTeamId: clampNum(m.awayTeamId),
            kickoffIso: m.kickoffIso ?? null,
            venue: m.venue ?? null,
            city: m.city ?? null,
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

              kickoffIso: patch.kickoffIso !== undefined ? (patch.kickoffIso ?? null) : x.kickoffIso,
              venue: patch.venue !== undefined ? (patch.venue ?? null) : x.venue,
              city: patch.city !== undefined ? (patch.city ?? null) : x.city,

              lastSeenAt: nowIso(),
            };
          }),
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
        const s = persistedState as any;
        const followed = Array.isArray(s?.followed) ? s.followed : [];
        return { followed };
      },
    }
  )
);

export default useFollowStore;
