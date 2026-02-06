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
 * POLICY (locked for Phase 1):
 * - Native: open with expo-web-browser (Chrome Custom Tabs / SFSafariVC)
 * - Web: window open via Linking
 * - Fallback: system browser if needed
 */
export async function openPartnerUrl(url: string, mode: PartnerOpenMode = "in_app_browser") {
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

    // Default: in-app browser tab (NOT a WebView)
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
