// src/services/identity.ts
import storage from "@/src/services/storage";

type IdentityState = {
  deviceId: string;
  accountId: string | null; // future
};

const DEVICE_KEY = "deviceId";
const ACCOUNT_KEY = "accountId"; // future (nullable)

function randomId(len = 24) {
  // Not crypto-grade, but fine for Phase-1 device identity.
  // If you want crypto later, swap to expo-crypto.
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await storage.getString(DEVICE_KEY);
  if (existing && existing.trim()) return existing.trim();

  const created = `dev_${randomId(28)}`;
  await storage.setString(DEVICE_KEY, created);
  return created;
}

async function getAccountId(): Promise<string | null> {
  const v = await storage.getString(ACCOUNT_KEY);
  const s = (v ?? "").trim();
  return s ? s : null;
}

async function setAccountId(accountId: string | null): Promise<void> {
  const v = (accountId ?? "").trim();
  if (!v) {
    await storage.remove(ACCOUNT_KEY);
    return;
  }
  await storage.setString(ACCOUNT_KEY, v);
}

export async function ensureIdentity(): Promise<IdentityState> {
  const deviceId = await getOrCreateDeviceId();
  const accountId = await getAccountId();
  return { deviceId, accountId };
}

export async function getOwnerId(): Promise<string> {
  const { deviceId, accountId } = await ensureIdentity();
  return accountId ?? deviceId;
}

// convenience (if you need “userId” naming for the worker form-data)
export async function getWalletUserId(): Promise<string> {
  return await getOwnerId();
}

export default {
  ensureIdentity,
  getOwnerId,
  getWalletUserId,
  setAccountId, // for later
};
