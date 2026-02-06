// src/services/walletAttachments.ts
import { Linking, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";

import type { WalletAttachment, WalletAttachmentKind } from "@/src/core/savedItemTypes";

const ROOT = `${FileSystem.documentDirectory ?? ""}yna_wallet`;
const VERSION = "v1";

function now() {
  return Date.now();
}

function newId(prefix = "att") {
  return `${prefix}_${now()}_${Math.random().toString(16).slice(2)}`;
}

async function ensureDir(path: string) {
  try {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  } catch {
    // ignore
  }
}

function pickKindFrom(mimeType?: string, name?: string): WalletAttachmentKind {
  const mt = String(mimeType ?? "").toLowerCase();
  const nm = String(name ?? "").toLowerCase();

  if (mt.includes("pdf") || nm.endsWith(".pdf")) return "pdf";
  if (mt.startsWith("image/") || /\.(png|jpg|jpeg|webp|heic)$/.test(nm)) return "image";
  return "file";
}

function safeExt(mimeType?: string, name?: string) {
  const nm = String(name ?? "").trim();
  const mt = String(mimeType ?? "").toLowerCase();

  // Prefer filename ext if present
  const m = nm.match(/\.([a-z0-9]{2,8})$/i);
  if (m?.[1]) return `.${m[1].toLowerCase()}`;

  if (mt.includes("pdf")) return ".pdf";
  if (mt.includes("png")) return ".png";
  if (mt.includes("jpeg") || mt.includes("jpg")) return ".jpg";
  if (mt.includes("webp")) return ".webp";
  if (mt.includes("heic")) return ".heic";

  return "";
}

function itemDir(itemId: string) {
  return `${ROOT}/${VERSION}/items/${encodeURIComponent(itemId)}`;
}

async function copyIntoWallet(srcUri: string, destUri: string) {
  // iOS/Android: DocumentPicker typically returns a file:// uri we can copy.
  await ensureDir(destUri.slice(0, destUri.lastIndexOf("/")));

  // If file exists, overwrite it.
  try {
    await FileSystem.deleteAsync(destUri, { idempotent: true });
  } catch {
    // ignore
  }

  await FileSystem.copyAsync({ from: srcUri, to: destUri });

  try {
    const info = await FileSystem.getInfoAsync(destUri, { size: true });
    return { exists: !!info.exists, size: typeof info.size === "number" ? info.size : undefined };
  } catch {
    return { exists: true, size: undefined };
  }
}

export async function pickAndStoreAttachmentForItem(itemId: string): Promise<WalletAttachment> {
  const id = String(itemId ?? "").trim();
  if (!id) throw new Error("itemId is required");

  if (!FileSystem.documentDirectory) {
    throw new Error("File storage not available on this device.");
  }

  const res = await DocumentPicker.getDocumentAsync({
    type: ["image/*", "application/pdf"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (res.canceled) {
    throw new Error("cancelled");
  }

  const asset = res.assets?.[0];
  if (!asset?.uri) throw new Error("No file selected");

  const attId = newId("att");
  const ext = safeExt(asset.mimeType, asset.name);
  const dest = `${itemDir(id)}/${attId}${ext}`;

  const kind = pickKindFrom(asset.mimeType, asset.name);
  const info = await copyIntoWallet(asset.uri, dest);

  const att: WalletAttachment = {
    id: attId,
    kind,
    uri: dest,
    name: asset.name ?? undefined,
    mimeType: asset.mimeType ?? undefined,
    size: info.size,
    createdAt: now(),
  };

  return att;
}

export async function deleteAttachmentFile(att: WalletAttachment): Promise<void> {
  const uri = String(att?.uri ?? "").trim();
  if (!uri) return;

  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}

export async function openAttachment(att: WalletAttachment): Promise<void> {
  const uri = String(att?.uri ?? "").trim();
  if (!uri) throw new Error("No URI");

  // Sharing gives the best “open with” UX on both platforms.
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: att.mimeType,
        dialogTitle: att.name ?? "Open attachment",
      });
      return;
    }
  } catch {
    // fall through
  }

  // Fallback: try Linking
  if (Platform.OS === "web") {
    // Web: opening local file URIs is unreliable. Best effort:
    await Linking.openURL(uri);
    return;
  }

  const can = await Linking.canOpenURL(uri);
  if (!can) throw new Error("Cannot open attachment");
  await Linking.openURL(uri);
}
