// src/state/persist.ts
import storage from "@/src/services/storage";

/**
 * Persistence adapter for Zustand stores.
 *
 * IMPORTANT:
 * - Must match src/services/storage.ts
 * - Best-effort: never crash the app if storage fails
 *
 * storage.ts exports:
 * - setString(key, value): Promise<void>
 * - getString(key): Promise<string | null>
 * - remove(key): Promise<void>
 */

function cleanKey(key: string): string {
  const k = String(key ?? "").trim();
  if (!k) throw new Error("persist: key is required");
  return k;
}

export async function readString(key: string): Promise<string | null> {
  const k = cleanKey(key);
  try {
    return await storage.getString(k);
  } catch {
    return null;
  }
}

export async function writeString(key: string, value: string): Promise<void> {
  const k = cleanKey(key);
  try {
    await storage.setString(k, String(value ?? ""));
  } catch {
    // best-effort
  }
}

export async function removeKey(key: string): Promise<void> {
  const k = cleanKey(key);
  try {
    await storage.remove(k);
  } catch {
    // best-effort
  }
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
  await writeString(key, JSON.stringify(value ?? null));
}
