import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { assertBackendBaseUrl } from "../config/env";

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

type WalletDeleteResponse = {
  ok: boolean;
  deleted: string;
};

type ErrorLike = {
  ok?: boolean;
  error?: string;
  debug?: string;
};

const REQUEST_TIMEOUT_MS = 30000;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined | null>
): string {
  const base = assertBackendBaseUrl();
  const url = new URL(`${base}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    Accept: "application/json",
    ...(extra ?? {}),
  };
}

async function safeJson<T>(
  res: Response
): Promise<T | (ErrorLike & Record<string, unknown>)> {
  const text = await res.text().catch(() => "");

  if (!text) {
    return {
      ok: false,
      error: `HTTP ${res.status}`,
    };
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      ok: false,
      error: text || `HTTP ${res.status}`,
    };
  }
}

async function fetchWithTimeout(
  input: string,
  init?: RequestInit
): Promise<Response> {
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;

  const timeout = controller
    ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    : null;

  try {
    return await fetch(input, {
      ...init,
      signal: controller?.signal,
    });
  } catch (error: any) {
    if (String(error?.name ?? "") === "AbortError") {
      throw new Error("wallet_timeout");
    }
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function walletList(opts?: {
  prefix?: string;
  limit?: number;
  cursor?: string | null;
}): Promise<WalletListResponse> {
  const url = buildUrl("/wallet/list", {
    prefix: opts?.prefix || "wallet/",
    limit: opts?.limit ?? 200,
    cursor: opts?.cursor ?? undefined,
  });

  const res = await fetchWithTimeout(url, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = (await safeJson<WalletListResponse>(res)) as Partial<WalletListResponse> &
    ErrorLike;

  if (!res.ok) {
    throw new Error(data.debug || data.error || `Wallet list failed (${res.status})`);
  }

  return {
    ok: Boolean(data.ok),
    prefix: clean(data.prefix),
    limit:
      typeof data.limit === "number" && Number.isFinite(data.limit)
        ? data.limit
        : opts?.limit ?? 200,
    cursor: typeof data.cursor === "string" ? data.cursor : null,
    truncated: Boolean(data.truncated),
    items: Array.isArray(data.items) ? data.items : [],
  };
}

export async function walletUpload(opts: {
  fileUri: string;
  filename: string;
  mimeType: string;
  userId?: string;
  tripId?: string;
  matchId?: string;
  category?: string;
}): Promise<WalletUploadResponse> {
  const form = new FormData();

  form.append(
    "file",
    {
      uri: opts.fileUri,
      name: opts.filename,
      type: opts.mimeType,
    } as any
  );

  if (opts.userId) form.append("userId", opts.userId);
  if (opts.tripId) form.append("tripId", opts.tripId);
  if (opts.matchId) form.append("matchId", opts.matchId);
  if (opts.category) form.append("category", opts.category);

  const res = await fetchWithTimeout(buildUrl("/wallet/upload"), {
    method: "POST",
    headers: buildHeaders(),
    body: form,
  });

  const data = (await safeJson<WalletUploadResponse>(res)) as Partial<WalletUploadResponse> &
    ErrorLike;

  if (!res.ok) {
    throw new Error(data.debug || data.error || `Wallet upload failed (${res.status})`);
  }

  return {
    ok: Boolean(data.ok),
    key: clean(data.key),
    size:
      typeof data.size === "number" && Number.isFinite(data.size) ? data.size : 0,
    contentType: clean(data.contentType),
    meta: {
      userId: clean(data.meta?.userId),
      tripId: clean(data.meta?.tripId),
      category: clean(data.meta?.category),
      matchId: clean(data.meta?.matchId) || null,
      originalName: clean(data.meta?.originalName),
    },
  };
}

export async function walletDownloadToCache(opts: {
  key: string;
  suggestedFilename?: string;
}): Promise<{ localUri: string; filename: string }> {
  const filename =
    opts.suggestedFilename ||
    decodeURIComponent(opts.key.split("/").pop() || "wallet-file");

  const safeName = sanitizeFilename(filename);
  const cacheDirectory = FileSystem.cacheDirectory;

  if (!cacheDirectory) {
    throw new Error("Wallet cache directory unavailable");
  }

  const localUri = `${cacheDirectory}${safeName}`;
  const url = buildUrl("/wallet/file", { key: opts.key });

  const result = await FileSystem.downloadAsync(url, localUri, {
    headers: buildHeaders(),
  });

  if (result.status >= 400) {
    throw new Error(`Wallet download failed (${result.status})`);
  }

  return { localUri: result.uri, filename: safeName };
}

export async function walletOpenOrShare(opts: { key: string }) {
  const { localUri } = await walletDownloadToCache({ key: opts.key });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(localUri);
    return;
  }

  return localUri;
}

export async function walletDelete(opts: {
  key: string;
}): Promise<WalletDeleteResponse> {
  const url = buildUrl("/wallet/file", { key: opts.key });

  const res = await fetchWithTimeout(url, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  const data = (await safeJson<WalletDeleteResponse>(res)) as Partial<WalletDeleteResponse> &
    ErrorLike;

  if (!res.ok) {
    throw new Error(data.debug || data.error || `Wallet delete failed (${res.status})`);
  }

  return {
    ok: Boolean(data.ok),
    deleted: clean(data.deleted),
  };
}

export function walletPrefixForTrip(opts: {
  userId: string;
  tripId: string;
  category?: string;
}) {
  const user = safeSegment(opts.userId || "anon");
  const trip = safeSegment(opts.tripId || "general");
  const category = safeSegment(opts.category || "");

  return category
    ? `wallet/${user}/${trip}/${category}/`
    : `wallet/${user}/${trip}/`;
}

export function walletPrefixForUser(opts: { userId: string }) {
  const user = safeSegment(opts.userId || "anon");
  return `wallet/${user}/`;
}

function safeSegment(value: string) {
  return (value || "")
    .toString()
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function sanitizeFilename(name: string) {
  return safeSegment(name);
}
