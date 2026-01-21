// src/services/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "yna:";

// Keep keys simple and predictable to avoid bugs.
function k(key: string) {
  const safe = (key ?? "").trim();
  if (!safe) throw new Error("storage key is empty");
  return `${PREFIX}${safe}`;
}

export async function setString(key: string, value: string) {
  await AsyncStorage.setItem(k(key), value);
}

export async function getString(key: string) {
  return AsyncStorage.getItem(k(key));
}

export async function remove(key: string) {
  await AsyncStorage.removeItem(k(key));
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
