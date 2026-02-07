// src/services/followKickoffNotifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

type EnsureOpts = {
  /**
   * If true, we may prompt the user (requestPermissionsAsync).
   * If false/omitted, we only check current permission status.
   */
  request?: boolean;
};

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

// Cache channel init; DO NOT cache permissions forever (users can change settings).
let _channelReady = false;

async function ensureAndroidChannel() {
  if (_channelReady) return;
  if (Platform.OS !== "android") {
    _channelReady = true;
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync("kickoff", {
      name: "Kickoff updates",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  } catch {
    // ignore
  } finally {
    _channelReady = true;
  }
}

export async function ensureNotificationsReady(opts?: EnsureOpts): Promise<boolean> {
  const request = !!opts?.request;

  try {
    await ensureAndroidChannel();

    const perms = await Notifications.getPermissionsAsync();
    if (perms.status === "granted") return true;

    // If we are not allowed to prompt here, bail.
    if (!request) return false;

    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  } catch {
    return false;
  }
}

export async function notifyKickoffChanged(args: {
  fixtureId: string;
  homeName?: string | null;
  awayName?: string | null;
  leagueName?: string | null;
  prevKickoffIso?: string | null;
  nextKickoffIso?: string | null;
}) {
  // Critical: background refresh must NOT prompt.
  const ok = await ensureNotificationsReady({ request: false });
  if (!ok) return;

  const fixtureId = safeStr(args.fixtureId);
  if (!fixtureId) return;

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
}
