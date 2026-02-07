// src/services/followKickoffNotifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

function safeStr(v: unknown) {
  const s = String(v ?? "").trim();
  return s || "";
}

function formatUkDateTime(iso?: string | null) {
  if (!iso) return "TBC";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBC";
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Cache channel init (Android) so we don’t repeat work.
let _channelReady = false;

export async function ensureKickoffChannel() {
  try {
    if (Platform.OS !== "android") return true;
    if (_channelReady) return true;

    await Notifications.setNotificationChannelAsync("kickoff", {
      name: "Kickoff updates",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });

    _channelReady = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Call this ONLY when user enables kickoff alerts in UI.
 * Returns true if permissions are granted after the call.
 */
export async function requestKickoffNotificationsPermission(): Promise<boolean> {
  try {
    await ensureKickoffChannel();

    const perms = await Notifications.getPermissionsAsync();
    if (perms.status === "granted") return true;

    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  } catch {
    return false;
  }
}

/**
 * Soft-check (no prompt). Useful for UI hints / conditional scheduling.
 */
export async function hasKickoffNotificationsPermission(): Promise<boolean> {
  try {
    const perms = await Notifications.getPermissionsAsync();
    return perms.status === "granted";
  } catch {
    return false;
  }
}

/**
 * Schedules an immediate local notification.
 * NOTE: This will NOT prompt by itself. If permissions are not granted, it will no-op.
 */
export async function notifyKickoffChanged(args: {
  fixtureId: string;
  homeName?: string | null;
  awayName?: string | null;
  leagueName?: string | null;
  prevKickoffIso?: string | null;
  nextKickoffIso?: string | null;
}) {
  try {
    const fixtureId = safeStr(args.fixtureId);
    if (!fixtureId) return;

    const okPerms = await hasKickoffNotificationsPermission();
    if (!okPerms) return;

    await ensureKickoffChannel();

    const home = safeStr(args.homeName) || "Home";
    const away = safeStr(args.awayName) || "Away";
    const league = safeStr(args.leagueName);

    const prevTxt = formatUkDateTime(args.prevKickoffIso ?? null);
    const nextTxt = formatUkDateTime(args.nextKickoffIso ?? null);

    const title = `Kickoff updated: ${home} vs ${away}`;
    const body = league ? `${league}\n${prevTxt} → ${nextTxt}\nTap to view.` : `${prevTxt} → ${nextTxt}\nTap to view.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { kind: "kickoff_update", fixtureId },
        sound: "default",
      },
      trigger: null,
    });
  } catch {
    // never crash
  }
}
