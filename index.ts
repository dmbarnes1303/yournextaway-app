// index.ts
import { Platform } from "react-native";

// Initialize Natively console log capture before anything else (native only).
// IMPORTANT: Keep this BEFORE expo-router/entry.
if (Platform.OS !== "web") {
  // Use require to avoid pulling the module into the web bundle.
  require("./utils/errorLogger");
}

import "expo-router/entry";
