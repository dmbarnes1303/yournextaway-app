
// src/services/storage.ts
import { Platform } from "react-native";

/**
 * Storage policy:
 * - Web: localStorage when available; otherwise in-memory Map.
 * - Native: AsyncStorage when available; otherwise in-memory Map.
 * - NEVER throw "AsyncStorage not available" to callers. Persistence is best-effort.
 */

let AsyncStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {
  AsyncStorage = null;
}

const mem = new Map<string, string>();

function assertKey(key: string) {
  const k = (key ?? "").trim();
  if (!k) throw new Error("Storage key must be a non-empty string.");
  return k;
}

/** Web helpers */
function webSet(k: string, v: string) {
  try {
    // window may exist but localStorage can be blocked (privacy mode, etc.)
    window.localStorage.setItem(k, v);
    return true;
  } catch {
    mem.set(k, v);
    return false;
  }
}

function webGet(k: string): string | null {
  try {
    const v = window.localStorage.getItem(k);
    if (v !== null) return v;
  } catch {
    // fall through
  }
  return mem.has(k) ? mem.get(k)! : null;
}

function webRemove(k: string) {
  try {
    window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
  mem.delete(k);
}

/** Native helpers */
async function nativeSet(k: string, v: string): Promise<void> {
  if (AsyncStorage?.setItem) {
    try {
      await AsyncStorage.setItem(k, v);
      return;
    } catch {
      // fall through to mem
    }
  }
  mem.set(k, v);
}

async function nativeGet(k: string): Promise<string | null> {
  if (AsyncStorage?.getItem) {
    try {
      const v = await AsyncStorage.getItem(k);
      if (v != null) return v;
    } catch {
      // fall through
    }
  }
  return mem.has(k) ? mem.get(k)! : null;
}

async function nativeRemove(k: string): Promise<void> {
  if (AsyncStorage?.removeItem) {
    try {
      await AsyncStorage.removeItem(k);
    } catch {
      // ignore
    }
  }
  mem.delete(k);
}

async function setString(key: string, value: string): Promise<void> {
  const k = assertKey(key);
  const v = value ?? "";

  if (Platform.OS === "web") {
    webSet(k, v);
    return;
  }

  await nativeSet(k, v);
}

async function getString(key: string): Promise<string | null> {
  const k = assertKey(key);

  if (Platform.OS === "web") return webGet(k);

  return await nativeGet(k);
}

async function remove(key: string): Promise<void> {
  const k = assertKey(key);

  if (Platform.OS === "web") {
    webRemove(k);
    return;
  }

  await nativeRemove(k);
}

async function setJSON(key: string, value: unknown): Promise<void> {
  const k = assertKey(key);
  try {
    await setString(k, JSON.stringify(value ?? null));
  } catch {
    // Best-effort. Do not throw.
  }
}

async function getJSON<T>(key: string): Promise<T | null> {
  const k = assertKey(key);

  let raw: string | null = null;
  try {
    raw = await getString(k);
  } catch {
    raw = null;
  }

  if (raw == null) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default {
  setString,
  getString,
  remove,
  setJSON,
  getJSON,
};
