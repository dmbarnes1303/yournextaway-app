// src/services/walletApi.ts
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

type WalletListItem = {
  key: string;
  size: number;
  etag?: string;
  uploaded?: string;
};

type WalletListResponse = {
  ok: boolean;
  prefix: string;
  limit: number;
  cursor: string | null;
  truncated: boolean;
  items: WalletListItem[];
};

type WalletUploadMeta = {
  userId: string;
  tripId: string;
  category: string;
  matchId: string | null;
  originalName: string;
};

type WalletUploadResponse = {
  ok: boolean;
  key: string;
  size: number;
  contentType: string;
  meta: WalletUploadMeta;
};

const BASE =
  process.env.EXPO_PUBLIC_WALLET_API_BASE?.replace(/\/+$/, "") ||
  "https://yna-email.db-17c.workers.dev";

const API_KEY = process.env.EXPO_PUBLIC_WALLET_API_KEY || "";

function assertConfigured() {
  if (!BASE) throw new Error("Wallet API base URL missing");
  if (!API_KEY) throw new Error("Wallet API key missing");
}

function withAuthHeaders(extra?: Record<string, string>) {
  return {
    "x-api-key": API_KEY,
    ...(extra || {}),
  };
}

function buildUrl(path: string, params?: Record<string, string | number | undefined | null>) {
  const url = new URL(BASE + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: text || `HTTP ${res.status}` };
  }
}

/**
 * LIST
 * GET /wallet/list?prefix=wallet/...&limit=200&cursor=...
 */
export async function walletList(opts?: {
  prefix?: string;
  limit?: number;
  cursor?: string | null;
}): Promise<WalletListResponse> {
  assertConfigured();
  const url = buildUrl("/wallet/list", {
    prefix: opts?.prefix || "wallet/",
    limit: opts?.limit ?? 200,
    cursor: opts?.cursor ?? undefined,
  });

  const res = await fetch(url, {
    method: "GET",
    headers: withAuthHeaders(),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || `Wallet list failed (${res.status})`);
  return data as WalletListResponse;
}

/**
 * UPLOAD
 * POST /wallet/upload (multipart/form-data)
 * Fields: file, userId?, tripId?, matchId?, category?
 *
 * fileUri should be a local uri from DocumentPicker/ImagePicker/etc.
 */
export async function walletUpload(opts: {
  fileUri: string;
  filename: string;
  mimeType: string;
  userId?: string;
  tripId?: string;
  matchId?: string;
  category?: string; // tickets|hotel|flight|insurance|misc etc
}): Promise<WalletUploadResponse> {
  assertConfigured();

  const form = new FormData();
  form.append("file", {
    uri: opts.fileUri,
    name: opts.filename,
    type: opts.mimeType,
  } as any);

  if (opts.userId) form.append("userId", opts.userId);
  if (opts.tripId) form.append("tripId", opts.tripId);
  if (opts.matchId) form.append("matchId", opts.matchId);
  if (opts.category) form.append("category", opts.category);

  const res = await fetch(buildUrl("/wallet/upload"), {
    method: "POST",
    headers: withAuthHeaders({
      // NOTE: DON'T set Content-Type manually for FormData in RN; fetch will set boundary.
    }),
    body: form,
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || `Wallet upload failed (${res.status})`);
  return data as WalletUploadResponse;
}

/**
 * DOWNLOAD (auth required)
 * GET /wallet/file?key=...
 * Saves into cacheDirectory and returns local path.
 */
export async function walletDownloadToCache(opts: {
  key: string;
  suggestedFilename?: string;
}): Promise<{ localUri: string; filename: string }> {
  assertConfigured();

  const filename =
    opts.suggestedFilename ||
    decodeURIComponent(opts.key.split("/").pop() || "wallet-file");

  const url = buildUrl("/wallet/file", { key: opts.key });

  // We must fetch with header → save ourselves
  const res = await fetch(url, {
    method: "GET",
    headers: withAuthHeaders(),
  });

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || `Wallet download failed (${res.status})`);
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  const base64 = BufferFromUint8(bytes);

  const localUri = `${FileSystem.cacheDirectory}${sanitizeFilename(filename)}`;
  await FileSystem.writeAsStringAsync(localUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { localUri, filename };
}

/**
 * VIEW/SHARE helper: downloads then opens share sheet (best universal option).
 * If Sharing isn’t available (rare), it just returns localUri so you can handle it.
 */
export async function walletOpenOrShare(opts: { key: string }) {
  const { localUri } = await walletDownloadToCache({ key: opts.key });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(localUri);
    return;
  }

  // Fallback: caller can open using WebView / intent, etc.
  return localUri;
}

/**
 * DELETE
 * DELETE /wallet/file?key=...
 */
export async function walletDelete(opts: { key: string }): Promise<{ ok: boolean; deleted: string }> {
  assertConfigured();

  const url = buildUrl("/wallet/file", { key: opts.key });
  const res = await fetch(url, {
    method: "DELETE",
    headers: withAuthHeaders(),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || `Wallet delete failed (${res.status})`);
  return data as { ok: boolean; deleted: string };
}

/**
 * Prefix builders (so you don’t mess this up across screens)
 * Matches your Worker’s storage pattern:
 * wallet/{userId}/{tripId}/{category}/[matchId/]timestamp-filename
 */
export function walletPrefixForTrip(opts: { userId: string; tripId: string; category?: string }) {
  const user = safeSegment(opts.userId || "anon");
  const trip = safeSegment(opts.tripId || "general");
  const cat = safeSegment(opts.category || "");
  return cat ? `wallet/${user}/${trip}/${cat}/` : `wallet/${user}/${trip}/`;
}

export function walletPrefixForUser(opts: { userId: string }) {
  const user = safeSegment(opts.userId || "anon");
  return `wallet/${user}/`;
}

// -----------------------
// Small utilities
// -----------------------

function safeSegment(s: string) {
  return (s || "").toString().trim().replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, " ").slice(0, 120);
}

function sanitizeFilename(name: string) {
  return safeSegment(name);
}

// RN doesn’t have Node Buffer by default in all setups; implement base64 encoding ourselves.
function BufferFromUint8(u8: Uint8Array): string {
  // Base64 encode without external deps
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// btoa on Android sometimes missing in certain JS runtimes; if yours lacks it, uncomment below:
// const btoa = globalThis.btoa || ((str: string) => Buffer.from(str, "binary").toString("base64"));
