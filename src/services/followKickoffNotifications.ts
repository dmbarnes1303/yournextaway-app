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

// Cache channel init (Android) so we don’t spam setNotificationChannelAsync
let _channelReady: Promise<void> | null = null;

async function ensureKickoffChannel() {
  if (Platform.OS !== "android") return;

  if (_channelReady) return _channelReady;

  _channelReady = (async () => {
    try {
      await Notifications.setNotificationChannelAsync("kickoff", {
        name: "Kickoff updates",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
      });
    } catch {
      // ignore
    }
  })();

  return _channelReady;
}

export async function hasKickoffNotificationsPermission(): Promise<boolean> {
  try {
    await ensureKickoffChannel();
    const perms = await Notifications.getPermissionsAsync();
    return perms.status === "granted";
  } catch {
    return false;
  }
}

/**
 * Call ONLY on explicit user intent (e.g. toggle ON).
 * This may show the OS permission prompt.
 */
export async function requestKickoffNotificationsPermission(): Promise<boolean> {
  try {
    await ensureKickoffChannel();

    const current = await Notifications.getPermissionsAsync();
    if (current.status === "granted") return true;

    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  } catch {
    return false;
  }
}

/**
 * IMPORTANT: This MUST NOT prompt.
 * It will only schedule if permission is already granted.
 */
export async function notifyKickoffChanged(args: {
  fixtureId: string;
  homeName?: string | null;
  awayName?: string | null;
  leagueName?: string | null;
  prevKickoffIso?: string | null;
  nextKickoffIso?: string | null;
}) {
  const ok = await hasKickoffNotificationsPermission();
  if (!ok) return;

  const fixtureId = safeStr(args.fixtureId);
  if (!fixtureId) return;

  const home = safeStr(args.homeName) || "Home";
  const away = safeStr(args.awayName) || "Away";
  const league = safeStr(args.leagueName);

  const prevTxt = formatUkDateTime(args.prevKickoffIso ?? null);
  const nextTxt = formatUkDateTime(args.nextKickoffIso ?? null);

  const title = `Kickoff updated: ${home} vs ${away}`;
  const body = league
    ? `${league}\n${prevTxt} → ${nextTxt}\nTap to view.`
    : `${prevTxt} → ${nextTxt}\nTap to view.`;

  try {
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
    // ignore
  }
}
