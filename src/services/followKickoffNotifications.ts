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

// Cache only SUCCESS. Never cache a permanent false, because users can change permissions later.
let _ready = false;
let _inflight: Promise<boolean> | null = null;

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("kickoff", {
    name: "Kickoff updates",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
  });
}

async function hasPermissionGranted(): Promise<boolean> {
  try {
    const perms = await Notifications.getPermissionsAsync();
    return perms.status === "granted";
  } catch {
    return false;
  }
}

async function requestPermission(): Promise<boolean> {
  try {
    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  } catch {
    return false;
  }
}

/**
 * Ensure notification infra is ready.
 *
 * - request=false: NEVER triggers a permission prompt (safe for background/auto refresh)
 * - request=true : prompts if needed (use only from an explicit user action, e.g. a toggle)
 */
export async function ensureNotificationsReady(opts?: { request?: boolean }) {
  const request = opts?.request !== false;

  if (_ready) return true;
  if (_inflight) return await _inflight;

  _inflight = (async () => {
    try {
      await ensureAndroidChannel();

      const granted = await hasPermissionGranted();
      if (granted) {
        _ready = true;
        return true;
      }

      if (!request) return false;

      const afterReq = await requestPermission();
      if (!afterReq) return false;

      _ready = true;
      return true;
    } catch {
      return false;
    } finally {
      // Always clear inflight so future calls can re-check after user changes Settings.
      _inflight = null;
    }
  })();

  return await _inflight;
}

export async function notifyKickoffChanged(args: {
  fixtureId: string;
  homeName?: string | null;
  awayName?: string | null;
  leagueName?: string | null;
  prevKickoffIso?: string | null;
  nextKickoffIso?: string | null;
}) {
  // IMPORTANT: do not prompt here (could be called from auto-refresh).
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
