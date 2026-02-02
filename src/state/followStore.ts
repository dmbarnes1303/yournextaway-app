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

  kickoffIso: string | null; // null = TBC
  venue: string | null;
  city: string | null;

  createdAt: string; // ISO
};

type FollowState = {
  followed: FollowedMatch[];

  isFollowing: (fixtureId: string) => boolean;

  follow: (m: Omit<FollowedMatch, "createdAt">) => void;
  unfollow: (fixtureId: string) => void;
  toggle: (m: Omit<FollowedMatch, "createdAt">) => void;

  upsertKickoff: (fixtureId: string, kickoffIso: string | null) => void;

  clearAll: () => void;
};

function normalizeId(id: unknown) {
  return String(id ?? "").trim();
}

function nowIso() {
  return new Date().toISOString();
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
          // de-dupe (fixtureId is the key)
          const filtered = state.followed.filter((x) => x.fixtureId !== id);

          const next: FollowedMatch = {
            ...m,
            fixtureId: id,
            createdAt: nowIso(),
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
            x.fixtureId === id ? { ...x, kickoffIso: kickoffIso ?? null } : x
          ),
        }));
      },

      clearAll: () => set({ followed: [] }),
    }),
    {
      name: "followedMatches",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Keep storage clean + resilient if you ever refactor fields
      partialize: (state) => ({ followed: state.followed }),
      migrate: (persistedState) => {
        // In case old shapes ever exist, keep it safe.
        const s = persistedState as any;
        const followed = Array.isArray(s?.followed) ? s.followed : [];
        return { followed };
      },
    }
  )
);

export default useFollowStore;
