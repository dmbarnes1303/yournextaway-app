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
    // ignore (we’ll fail later on copy if truly broken)
  }
}

function inferKind(name?: string, mimeType?: string): WalletAttachmentKind {
  const n = String(name ?? "").toLowerCase();
  const m = String(mimeType ?? "").toLowerCase();

  if (m.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  if (m.startsWith("image/") || n.match(/\.(png|jpg|jpeg|webp|heic)$/)) return "image";
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

export async function pickAndStoreAttachmentForItem(_itemId: string): Promise<WalletAttachment> {
  // itemId currently unused, but kept because you’ll want per-item folders later.
  await ensureDir();

  const res = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: "*/*",
  });

  // SDK differences: res.canceled vs res.type === "cancel"
  const canceled =
    (res as any)?.canceled === true || String((res as any)?.type ?? "").toLowerCase() === "cancel";
  if (canceled) throw new Error("cancelled");

  const asset = Array.isArray((res as any)?.assets) ? (res as any).assets[0] : (res as any);
  const uri = String(asset?.uri ?? "").trim();
  if (!uri) throw new Error("No file selected");

  const name = typeof asset?.name === "string" ? asset.name : undefined;
  const mimeType = typeof asset?.mimeType === "string" ? asset.mimeType : undefined;
  const size = Number.isFinite(Number(asset?.size)) ? Number(asset.size) : undefined;

  const kind = inferKind(name, mimeType);
  const ext = safeExt(name, mimeType);

  const storedName = `${id("wallet")}${ext}`;
  const dest = `${DIR}${storedName}`;

  // Copy into app-owned storage
  try {
    await FileSystem.copyAsync({ from: uri, to: dest });
  } catch (e) {
    // If copy fails, don’t crash the app — but we can’t promise offline storage.
    // Still return an attachment pointing to original uri (best-effort).
    return {
      id: id("att"),
      kind,
      name,
      mimeType,
      size,
      uri,
      createdAt: now(),
    };
  }

  return {
    id: id("att"),
    kind,
    name,
    mimeType,
    size,
    uri: dest,
    createdAt: now(),
  };
}

export async function openAttachment(att: WalletAttachment) {
  const uri = String(att?.uri ?? "").trim();
  if (!uri) throw new Error("Missing attachment URI");

  // Best result in Expo: share sheet (user can open in Drive/Files/PDF viewer/etc)
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

  // Fallback: attempt to open directly
  if (Platform.OS === "web") {
    await Linking.openURL(uri);
    return;
  }

  // Native Linking sometimes needs file://
  const url = uri.startsWith("file://") ? uri : `file://${uri}`;
  const can = await Linking.canOpenURL(url);
  if (!can) throw new Error("Cannot open attachment");
  await Linking.openURL(url);
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
