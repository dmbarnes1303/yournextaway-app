import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";

import type { WalletAttachment, WalletAttachmentKind } from "@/src/core/savedItemTypes";

const BASE_DIR = FileSystem.documentDirectory ?? "";
const DIR = `${BASE_DIR}yna_wallet_attachments/`;

type PickerParsed =
  | { canceled: true }
  | {
      canceled: false;
      uri: string;
      name?: string;
      mimeType?: string;
      size?: number;
    };

type PickerLike = {
  canceled?: unknown;
  type?: unknown;
  assets?: Array<{
    uri?: unknown;
    name?: unknown;
    mimeType?: unknown;
    size?: unknown;
  }>;
  uri?: unknown;
  name?: unknown;
  mimeType?: unknown;
  size?: unknown;
};

function now() {
  return Date.now();
}

function id(prefix = "att") {
  return `${prefix}_${now()}_${Math.random().toString(16).slice(2)}`;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function sanitizeFilePart(value: unknown) {
  return cleanString(value)
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function ensureDir() {
  if (!DIR) throw new Error("Attachment storage directory unavailable");

  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (info.exists && info.isDirectory) return;
  } catch {
    // ignore
  }

  try {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  } catch {
    // ignore
  }
}

function inferKind(name?: string, mimeType?: string): WalletAttachmentKind {
  const fileName = String(name ?? "").toLowerCase();
  const type = String(mimeType ?? "").toLowerCase();

  if (type.includes("pdf") || fileName.endsWith(".pdf")) return "pdf";
  if (type.startsWith("image/") || /\.(png|jpg|jpeg|webp|heic)$/i.test(fileName)) {
    return "image";
  }

  return "file";
}

function safeExt(name?: string, mimeType?: string): string {
  const fileName = String(name ?? "").trim();
  const dot = fileName.lastIndexOf(".");
  if (dot > -1 && dot < fileName.length - 1) return fileName.slice(dot);

  const type = String(mimeType ?? "").toLowerCase();
  if (type.includes("pdf")) return ".pdf";
  if (type.includes("png")) return ".png";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
  if (type.includes("webp")) return ".webp";
  if (type.includes("heic")) return ".heic";
  return "";
}

function normalizePickerResult(result: unknown): PickerParsed {
  const value = result as PickerLike;

  const canceled =
    value?.canceled === true ||
    String(value?.type ?? "").toLowerCase() === "cancel" ||
    String(value?.type ?? "").toLowerCase() === "canceled";

  if (canceled) return { canceled: true };

  const asset = Array.isArray(value?.assets) ? value.assets[0] : value;
  const uri = cleanString(asset?.uri);
  if (!uri) throw new Error("No file selected");

  return {
    canceled: false,
    uri,
    name: typeof asset?.name === "string" ? asset.name : undefined,
    mimeType: typeof asset?.mimeType === "string" ? asset.mimeType : undefined,
    size: Number.isFinite(Number(asset?.size)) ? Number(asset?.size) : undefined,
  };
}

function buildStoredFilename(itemId?: string, name?: string, mimeType?: string) {
  const ext = safeExt(name, mimeType);
  const itemPart = sanitizeFilePart(itemId || "item");
  return `${itemPart}_${id("wallet")}${ext}`;
}

export function isAppOwnedAttachmentUri(uri: string): boolean {
  const raw = cleanString(uri);
  return Boolean(raw && DIR && raw.startsWith(DIR));
}

export async function attachmentExists(att: Pick<WalletAttachment, "uri">): Promise<boolean> {
  const uri = cleanString(att?.uri);
  if (!uri) return false;

  try {
    const info = await FileSystem.getInfoAsync(uri);
    return Boolean(info.exists);
  } catch {
    return false;
  }
}

export async function pickAndStoreAttachmentForItem(itemId: string): Promise<WalletAttachment> {
  await ensureDir();

  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: "*/*",
  });

  const parsed = normalizePickerResult(result);
  if (parsed.canceled) throw new Error("cancelled");

  const kind = inferKind(parsed.name, parsed.mimeType);
  const storedName = buildStoredFilename(itemId, parsed.name, parsed.mimeType);
  const destination = `${DIR}${storedName}`;

  try {
    await FileSystem.copyAsync({ from: parsed.uri, to: destination });

    return {
      id: id("att"),
      kind,
      name: parsed.name,
      mimeType: parsed.mimeType,
      size: parsed.size,
      uri: destination,
      createdAt: now(),
    };
  } catch {
    return {
      id: id("att"),
      kind,
      name: parsed.name,
      mimeType: parsed.mimeType,
      size: parsed.size,
      uri: parsed.uri,
      createdAt: now(),
    };
  }
}

async function openNativeUri(uri: string) {
  const raw = cleanString(uri);
  if (!raw) throw new Error("Missing attachment URI");

  if (Platform.OS === "web") {
    await Linking.openURL(raw);
    return;
  }

  if (Platform.OS === "android") {
    try {
      const fileUri = raw.startsWith("file://") ? raw : `file://${raw}`;
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      const canOpen = await Linking.canOpenURL(contentUri);

      if (!canOpen) {
        throw new Error("Cannot open content URI");
      }

      await Linking.openURL(contentUri);
      return;
    } catch {
      // fall through
    }
  }

  const url =
    raw.startsWith("file://") ||
    raw.startsWith("content://") ||
    raw.startsWith("http://") ||
    raw.startsWith("https://")
      ? raw
      : `file://${raw}`;

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) throw new Error("Cannot open attachment");

  await Linking.openURL(url);
}

export async function openAttachment(att: WalletAttachment) {
  const uri = cleanString(att?.uri);
  if (!uri) throw new Error("Missing attachment URI");

  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: att.mimeType,
        UTI: att.kind === "pdf" ? "com.adobe.pdf" : undefined,
      });
      return;
    }
  } catch {
    // fall through
  }

  await openNativeUri(uri);
}

export async function deleteAttachmentFile(att: WalletAttachment): Promise<boolean> {
  const uri = cleanString(att?.uri);
  if (!uri) return false;
  if (!isAppOwnedAttachmentUri(uri)) return false;

  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    return true;
  } catch {
    return false;
  }
}
