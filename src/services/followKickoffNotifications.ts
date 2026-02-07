// src/services/followKickoffNotifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

function safeStr(v: unknown) {
  const s = String(v ?? "").trim();
  return s || "";
}

export async function ensureNotificationsReady() {
  // Android: channel required for proper behavior.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("kickoff", {
      name: "Kickoff updates",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const perms = await Notifications.getPermissionsAsync();
  if (perms.status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== "granted") return false;
  }
  return true;
}

export async function notifyKickoffChanged(args: {
  fixtureId: string;
  homeName?: string | null;
  awayName?: string | null;
  leagueName?: string | null;
  prevKickoffIso?: string | null;
  nextKickoffIso?: string | null;
}) {
  const ok = await ensureNotificationsReady();
  if (!ok) return;

  const home = safeStr(args.homeName) || "Home";
  const away = safeStr(args.awayName) || "Away";
  const league = safeStr(args.leagueName);

  const title = `Kickoff updated: ${home} vs ${away}`;
  const body = league
    ? `${league}\nTap to view the fixture.`
    : `Tap to view the fixture.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { kind: "kickoff_update", fixtureId: String(args.fixtureId ?? "").trim() },
      sound: true,
    },
    trigger: null,
  });
}
