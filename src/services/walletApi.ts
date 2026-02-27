// src/services/walletApi.ts
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

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
 */
export async function walletUpload(opts: {
  fileUri: string;
  filename: string;
  mimeType: string;
  userId?: string;
  tripId?: string;
  matchId?: string;
  category?: string;
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
    headers: withAuthHeaders(),
    body: form,
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || `Wallet upload failed (${res.status})`);
  return data as WalletUploadResponse;
}

/**
 * DOWNLOAD (auth required)
 * Uses FileSystem.downloadAsync with headers (reliable, no base64, no btoa).
 */
export async function walletDownloadToCache(opts: {
  key: string;
  suggestedFilename?: string;
}): Promise<{ localUri: string; filename: string }> {
  assertConfigured();

  const filename =
    opts.suggestedFilename ||
    decodeURIComponent(opts.key.split("/").pop() || "wallet-file");

  const safeName = sanitizeFilename(filename);
  const localUri = `${FileSystem.cacheDirectory}${safeName}`;

  const url = buildUrl("/wallet/file", { key: opts.key });

  const result = await FileSystem.downloadAsync(url, localUri, {
    headers: withAuthHeaders(),
  });

  if (result?.status && result.status >= 400) {
    throw new Error(`Wallet download failed (${result.status})`);
  }

  return { localUri: result.uri, filename: safeName };
}

/**
 * VIEW/SHARE helper
 */
export async function walletOpenOrShare(opts: { key: string }) {
  const { localUri } = await walletDownloadToCache({ key: opts.key });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(localUri);
    return;
  }

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
 * Prefix builders
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
  return (s || "")
    .toString()
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function sanitizeFilename(name: string) {
  return safeSegment(name);
}
