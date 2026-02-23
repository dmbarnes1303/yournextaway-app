// src/state/preferences.ts
import { create } from "zustand";
import { readJson, writeJson } from "@/src/state/persist";

const STORAGE_KEY = "yna_prefs_v1";

export type PreferencesState = {
  loaded: boolean;

  /**
   * Preferred origin for flight searches.
   * Use IATA CITY codes where possible (LON, PAR, MIL) not a single airport.
   */
  preferredOriginIata: string; // e.g. "LON", "MAN"

  load: () => Promise<void>;
  setPreferredOriginIata: (codeOrLabel: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

let inflightLoad: Promise<void> | null = null;

function extractIataFromAny(input: unknown): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  // If it's already "ABC"
  const direct = raw.toUpperCase();
  if (/^[A-Z]{3}$/.test(direct)) return direct;

  // If it contains "(ABC)"
  const m = raw.match(/\(([A-Z]{3})\)/i);
  if (m?.[1]) return String(m[1]).toUpperCase();

  // If it contains " ABC " (rare)
  const m2 = raw.match(/\b([A-Z]{3})\b/i);
  if (m2?.[1]) return String(m2[1]).toUpperCase();

  return null;
}

function cleanUpper3(input: unknown, fallback: string) {
  const extracted = extractIataFromAny(input);
  if (extracted && /^[A-Z]{3}$/.test(extracted)) return extracted;
  return fallback;
}

async function persist(next: { preferredOriginIata: string }) {
  await writeJson(STORAGE_KEY, next);
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  loaded: false,
  preferredOriginIata: "LON", // default: London city code (covers LHR/LGW/LCY/LTN/STN/SEN)

  load: async () => {
    if (get().loaded) return;
    if (inflightLoad) return inflightLoad;

    inflightLoad = (async () => {
      try {
        const raw = await readJson<any>(STORAGE_KEY, null);
        const preferredOriginIata = cleanUpper3(raw?.preferredOriginIata, get().preferredOriginIata);
        set({ preferredOriginIata, loaded: true });
      } catch {
        // fail open
        set({ loaded: true });
      }
    })().finally(() => {
      inflightLoad = null;
    });

    return inflightLoad;
  },

  setPreferredOriginIata: async (codeOrLabel) => {
    const next = cleanUpper3(codeOrLabel, get().preferredOriginIata);

    // optimistic
    set({ preferredOriginIata: next, loaded: true });

    try {
      await persist({ preferredOriginIata: next });
    } catch {
      // best-effort
    }
  },

  clearAll: async () => {
    set({ loaded: true, preferredOriginIata: "LON" });
    try {
      await persist({ preferredOriginIata: "LON" });
    } catch {
      // best-effort
    }
  },
}));

/* -------------------------------------------------------------------------- */
/* Wrapper (matches your other stores style) */
/* -------------------------------------------------------------------------- */

const preferencesStore = {
  getState: usePreferencesStore.getState,
  setState: usePreferencesStore.setState,
  subscribe: usePreferencesStore.subscribe,

  load: async () => {
    await usePreferencesStore.getState().load();
  },

  getPreferredOriginIata: () => {
    const s = usePreferencesStore.getState();
    return String(s.preferredOriginIata || "LON").trim().toUpperCase();
  },

  setPreferredOriginIata: async (codeOrLabel: string) => {
    await usePreferencesStore.getState().setPreferredOriginIata(codeOrLabel);
  },

  clearAll: async () => {
    await usePreferencesStore.getState().clearAll();
  },
};

export default preferencesStore;
