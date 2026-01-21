// src/services/storage.ts
import * as SecureStore from "expo-secure-store";

const NS = "yna"; // namespace so keys don’t collide later
const VERSION = 1;

// Keep a tiny in-memory cache to reduce SecureStore reads
const mem = new Map<string, string | null>();

function k(key: string) {
  return `${NS}:v${VERSION}:${key}`;
}

export async function setString(key: string, value: string) {
  const full = k(key);
  mem.set(full, value);
  await SecureStore.setItemAsync(full, value);
}

export async function getString(key: string): Promise<string | null> {
  const full = k(key);
  if (mem.has(full)) return mem.get(full) ?? null;

  const v = await SecureStore.getItemAsync(full);
  mem.set(full, v);
  return v ?? null;
}

export async function remove(key: string) {
  const full = k(key);
  mem.delete(full);
  await SecureStore.deleteItemAsync(full);
}

export async function setJSON<T>(key: string, value: T) {
  await setString(key, JSON.stringify(value));
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await getString(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt data should not brick the app
    return null;
  }
}

/**
 * Optional: clear only our namespace keys (best-effort).
 * SecureStore does not support listing keys, so we can’t truly “wipe all”.
 * We only expose targeted removes via remove(key).
 */
export function storageKey(key: string) {
  return k(key);
}

export default {
  setString,
  getString,
  setJSON,
  getJSON,
  remove,
  storageKey,
};
