// src/services/partnerOpen.ts
import { Alert, Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import type { PartnerOpenMode } from "@/src/core/tripTypes";

function withHttps(url: string) {
  const u = String(url ?? "").trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/**
 * Generic URL opener with explicit naming.
 * Do NOT use this for tracked partner clicks.
 * Use beginPartnerClick() for tracked flow.
 */
export async function openUrlWithMode(url: string, mode: PartnerOpenMode = "in_app_browser") {
  const candidate = withHttps(url);
  if (!candidate) return;

  try {
    if (Platform.OS === "web") {
      const can = await Linking.canOpenURL(candidate);
      if (!can) throw new Error("Cannot open URL");
      await Linking.openURL(candidate);
      return;
    }

    if (mode === "system_browser") {
      const can = await Linking.canOpenURL(candidate);
      if (!can) throw new Error("Cannot open URL");
      await Linking.openURL(candidate);
      return;
    }

    await WebBrowser.openBrowserAsync(candidate, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      readerMode: false,
      enableBarCollapsing: true,
      showTitle: true,
    });
  } catch {
    Alert.alert("Couldn’t open link", "Your device could not open that link.");
  }
}
