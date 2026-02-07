// src/services/walletAttachments.ts
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform, Linking } from "react-native";

import type { WalletAttachment, WalletAttachmentKind } from "@/src/core/savedItemTypes";

const DIR = `${FileSystem.documentDirectory}yna_wallet_attachments/`;

function now() {
  return Date.now();
}

function id(prefix = "att") {
  return `${prefix}_${now()}_${Math.random().toString(16).slice(2)}`;
}

async function ensureDir() {
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
  const n = String(name ?? "").toLowerCase();
  const m = String(mimeType ?? "").toLowerCase();

  if (m.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  if (m.startsWith("image/") || /\.(png|jpg|jpeg|webp|heic)$/i.test(n)) return "image";
  return "file";
}

function safeExt(name?: string, mimeType?: string): string {
  const n = String(name ?? "").trim();
  const dot = n.lastIndexOf(".");
  if (dot > -1 && dot < n.length - 1) return n.slice(dot);

  const m = String(mimeType ?? "").toLowerCase();
  if (m.includes("pdf")) return ".pdf";
  if (m.includes("png")) return ".png";
  if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
  if (m.includes("webp")) return ".webp";
  return "";
}

function normalizePickerResult(res: any) {
  const canceled =
    res?.canceled === true || String(res?.type ?? "").toLowerCase() === "cancel";

  if (canceled) return { canceled: true as const };

  const asset = Array.isArray(res?.assets) ? res.assets[0] : res;
  const uri = String(asset?.uri ?? "").trim();
  if (!uri) throw new Error("No file selected");

  return {
    canceled: false as const,
    uri,
    name: typeof asset?.name === "string" ? asset.name : undefined,
    mimeType: typeof asset?.mimeType === "string" ? asset.mimeType : undefined,
    size: Number.isFinite(Number(asset?.size)) ? Number(asset.size) : undefined,
  };
}

export async function pickAndStoreAttachmentForItem(_itemId: string): Promise<WalletAttachment> {
  await ensureDir();

  const res = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: "*/*",
  });

  const parsed = normalizePickerResult(res as any);
  if (parsed.canceled) throw new Error("cancelled");

  const kind = inferKind(parsed.name, parsed.mimeType);
  const ext = safeExt(parsed.name, parsed.mimeType);

  const storedName = `${id("wallet")}${ext}`;
  const dest = `${DIR}${storedName}`;

  // Copy into app-owned storage (offline)
  try {
    await FileSystem.copyAsync({ from: parsed.uri, to: dest });
    return {
      id: id("att"),
      kind,
      name: parsed.name,
      mimeType: parsed.mimeType,
      size: parsed.size,
      uri: dest,
      createdAt: now(),
    };
  } catch {
    // Best-effort fallback: keep original URI (may not be offline)
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
  // Android: file:// often fails. Convert to content:// where possible.
  if (Platform.OS === "android") {
    try {
      // getContentUriAsync expects a file URI (no scheme sometimes in expo FS)
      const fileUri = uri.startsWith("file://") ? uri : `file://${uri}`;
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      const can = await Linking.canOpenURL(contentUri);
      if (!can) throw new Error("Cannot open content URI");
      await Linking.openURL(contentUri);
      return;
    } catch {
      // fall through to generic
    }
  }

  // iOS: file:// usually works
  const url = uri.startsWith("file://") || uri.startsWith("content://") ? uri : `file://${uri}`;
  const can = await Linking.canOpenURL(url);
  if (!can) throw new Error("Cannot open attachment");
  await Linking.openURL(url);
}

export async function openAttachment(att: WalletAttachment) {
  const uri = String(att?.uri ?? "").trim();
  if (!uri) throw new Error("Missing attachment URI");

  // Best UX: share sheet (user can open in Files/Drive/PDF viewer, etc.)
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: att.mimeType,
        UTI: att.kind === "pdf" ? "com.adobe.pdf" : undefined,
      } as any);
      return;
    }
  } catch {
    // fall through
  }

  // Web: just open URL
  if (Platform.OS === "web") {
    await Linking.openURL(uri);
    return;
  }

  await openNativeUri(uri);
}

export async function deleteAttachmentFile(att: WalletAttachment) {
  const uri = String(att?.uri ?? "").trim();
  if (!uri) return;

  // Only delete if it looks like our app-owned dir
  if (!uri.startsWith(DIR)) return;

  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // best-effort
  }
                                       }
