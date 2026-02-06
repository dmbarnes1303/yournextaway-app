// src/state/persist.ts
import storage from "@/src/services/storage";

/**
 * Single, defensive persistence adapter.
 * We DON'T assume exact storage API shape.
 *
 * Supported storage shapes:
 * - AsyncStorage-like: getItem/setItem/removeItem
 * - MMKV-like: getString/set/delete
 */
type AnyStorage = {
  getItem?: (k: string) => Promise<string | null> | string | null;
  setItem?: (k: string, v: string) => Promise<void> | void;
  removeItem?: (k: string) => Promise<void> | void;

  getString?: (k: string) => string | undefined;
  set?: (k: string, v: string) => void;
  delete?: (k: string) => void;
};

const s = storage as unknown as AnyStorage;

async function maybeAwait<T>(v: Promise<T> | T): Promise<T> {
  return v instanceof Promise ? await v : v;
}

export async function readString(key: string): Promise<string | null> {
  if (typeof s.getItem === "function") {
    const v = await maybeAwait(s.getItem(key));
    return typeof v === "string" ? v : null;
  }
  if (typeof s.getString === "function") {
    const v = s.getString(key);
    return typeof v === "string" ? v : null;
  }
  throw new Error("Storage adapter: no getItem/getString method found.");
}

export async function writeString(key: string, value: string): Promise<void> {
  if (typeof s.setItem === "function") {
    await maybeAwait(s.setItem(key, value));
    return;
  }
  if (typeof s.set === "function") {
    s.set(key, value);
    return;
  }
  throw new Error("Storage adapter: no setItem/set method found.");
}

export async function removeKey(key: string): Promise<void> {
  if (typeof s.removeItem === "function") {
    await maybeAwait(s.removeItem(key));
    return;
  }
  if (typeof s.delete === "function") {
    s.delete(key);
    return;
  }
  throw new Error("Storage adapter: no removeItem/delete method found.");
}

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await readString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  await writeString(key, JSON.stringify(value));
}
