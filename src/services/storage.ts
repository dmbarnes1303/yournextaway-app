// src/services/storage.ts
import { Platform } from "react-native";

// Prefer AsyncStorage on native; use localStorage on web.
let AsyncStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {
  AsyncStorage = null;
}

function assertKey(key: string) {
  const k = (key ?? "").trim();
  if (!k) throw new Error("Storage key must be a non-empty string.");
  return k;
}

async function setString(key: string, value: string): Promise<void> {
  const k = assertKey(key);
  const v = value ?? "";
  if (Platform.OS === "web") {
    window.localStorage.setItem(k, v);
    return;
  }
  if (!AsyncStorage) throw new Error("AsyncStorage is not available.");
  await AsyncStorage.setItem(k, v);
}

async function getString(key: string): Promise<string | null> {
  const k = assertKey(key);
  if (Platform.OS === "web") {
    return window.localStorage.getItem(k);
  }
  if (!AsyncStorage) throw new Error("AsyncStorage is not available.");
  return await AsyncStorage.getItem(k);
}

async function remove(key: string): Promise<void> {
  const k = assertKey(key);
  if (Platform.OS === "web") {
    window.localStorage.removeItem(k);
    return;
  }
  if (!AsyncStorage) throw new Error("AsyncStorage is not available.");
  await AsyncStorage.removeItem(k);
}

async function setJSON(key: string, value: unknown): Promise<void> {
  const k = assertKey(key);
  await setString(k, JSON.stringify(value ?? null));
}

async function getJSON<T>(key: string): Promise<T | null> {
  const k = assertKey(key);
  const raw = await getString(k);
  if (raw == null) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    // If the stored value is corrupted, treat as empty rather than crashing.
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
