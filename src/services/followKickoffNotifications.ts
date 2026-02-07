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

type EnsureOpts = { request?: boolean };

// Cache init so we don’t spam permission checks.
let _readyPromise: Promise<boolean> | null = null;

export async function ensureNotificationsReady(opts?: EnsureOpts) {
  const request = !!opts?.request;

  // If we already initialised successfully (or failed), reuse it.
  // BUT: if caller explicitly wants to request permissions, we should re-run once.
  if (_readyPromise && !request) return await _readyPromise;

  _readyPromise = (async () => {
    try {
      // Android: channel required
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("kickoff", {
          name: "Kickoff updates",
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: "default",
        });
      }

      const perms = await Notifications.getPermissionsAsync();
      if (perms.status === "granted") return true;

      if (!request) {
        // No prompting unless explicitly requested by user action.
        return false;
      }

      const req = await Notifications.requestPermissionsAsync();
      return req.status === "granted";
    } catch {
      return false;
    }
  })();

  return await _readyPromise;
}

export async function notifyKickoffChanged(args: {
  fixtureId: string;
  homeName?: string | null;
  awayName?: string | null;
  leagueName?: string | null;
  prevKickoffIso?: string | null;
  nextKickoffIso?: string | null;
}) {
  // IMPORTANT: no permission prompt from background refresh
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
  const body = league
    ? `${league}\n${prevTxt} → ${nextTxt}\nTap to view.`
    : `${prevTxt} → ${nextTxt}\nTap to view.`;

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
