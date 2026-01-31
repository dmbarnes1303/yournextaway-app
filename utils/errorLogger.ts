// utils/errorLogger.ts
// Safe dev-only logging helper for Expo / React Native (Hermes-friendly).
// - NO window.console.__proto__ hacks
// - NO auto-patching at import time
// - Optional console interception via setupErrorLogging()
// - Never allowed to crash the app

declare const __DEV__: boolean;

import { Platform } from "react-native";
import Constants from "expo-constants";

type Level = "log" | "warn" | "error";

type QueuedLog = {
  level: Level;
  message: string;
  source: string;
  timestamp: string;
  platform: string;
};

const MUTED_MESSAGES = [
  'each child in a list should have a unique "key" prop',
  'Each child in a list should have a unique "key" prop',
];

const shouldMuteMessage = (message: string): boolean =>
  MUTED_MESSAGES.some((m) => message.includes(m));

// Small dedupe (prevents spam)
const recentLogs: Record<string, boolean> = {};
const markRecent = (key: string) => {
  recentLogs[key] = true;
  setTimeout(() => delete recentLogs[key], 250);
};

// Batching
let logQueue: QueuedLog[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 600;

// Track fetch errors (avoid spamming console)
let fetchErrorLogged = false;

// Cache log server URL
let cachedLogServerUrl: string | null = null;
let urlChecked = false;

const getPlatformName = (): string => {
  switch (Platform.OS) {
    case "ios":
      return "iOS";
    case "android":
      return "Android";
    case "web":
      return "Web";
    default:
      return Platform.OS;
  }
};

// Safer "is web" check
const isWeb = Platform.OS === "web";

// Get dev server base URL (best-effort, never throw)
const getLogServerUrl = (): string | null => {
  if (urlChecked) return cachedLogServerUrl;

  try {
    // Web: use origin if available
    if (isWeb) {
      const w: any = typeof globalThis !== "undefined" ? (globalThis as any).window : undefined;
      if (w?.location?.origin) {
        cachedLogServerUrl = `${w.location.origin}/natively-logs`;
      }
      urlChecked = true;
      return cachedLogServerUrl;
    }

    // Native: try hostUri first (most reliable in Expo)
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest?.hostUri ||
      (Constants as any).manifest2?.extra?.expoClient?.hostUri;

    if (typeof hostUri === "string" && hostUri.length > 0) {
      const host = hostUri.split("/")[0]; // keep host:port
      const isTunnel = host.includes("ngrok") || host.includes(".io") || host.includes(".app");
      const protocol = isTunnel ? "https" : "http";
      cachedLogServerUrl = `${protocol}://${host}/natively-logs`;
    }
  } catch {
    // ignore
  }

  urlChecked = true;
  return cachedLogServerUrl;
};

const safeStringify = (value: unknown): string => {
  try {
    if (typeof value === "string") return value;
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    return JSON.stringify(value);
  } catch {
    try {
      return String(value);
    } catch {
      return "[unstringifiable]";
    }
  }
};

const stringifyArgs = (args: any[]): string => args.map(safeStringify).join(" ");

const getCallerInfo = (): string => {
  try {
    const stack = new Error().stack || "";
    const lines = stack.split("\n").map((l) => l.trim());

    // Skip first lines (Error + this file)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Skip internal frames
      if (line.includes("errorLogger") || line.includes("node_modules")) continue;

      // Common patterns: "at func (file:line:col)" OR "at file:line:col"
      let m = line.match(/\((?:.*\/)?([^/\s:)]+\.[jt]sx?):(\d+):(\d+)\)/);
      if (m) return `${m[1]}:${m[2]}`;

      m = line.match(/at\s+(?:.*\/)?([^/\s:)]+\.[jt]sx?):(\d+):(\d+)/);
      if (m) return `${m[1]}:${m[2]}`;

      m = line.match(/(?:.*\/)?([^/\s:)]+\.[jt]sx?):(\d+):\d+/);
      if (m) return `${m[1]}:${m[2]}`;
    }
  } catch {
    // ignore
  }
  return "";
};

const queueLog = (level: Level, message: string, source = "") => {
  try {
    const key = `${level}:${message}`;
    if (recentLogs[key]) return;
    markRecent(key);

    logQueue.push({
      level,
      message,
      source,
      timestamp: new Date().toISOString(),
      platform: getPlatformName(),
    });

    if (!flushTimeout) {
      flushTimeout = setTimeout(() => {
        flushLogs().catch(() => {
          // never crash because of logging
        });
      }, FLUSH_INTERVAL);
    }
  } catch {
    // ignore
  }
};

const flushLogs = async () => {
  try {
    if (logQueue.length === 0) return;

    const url = getLogServerUrl();
    if (!url) {
      // No URL available. Drop logs silently.
      logQueue = [];
      flushTimeout = null;
      return;
    }

    const logsToSend = [...logQueue];
    logQueue = [];
    flushTimeout = null;

    // Send sequentially; keep it simple + safe
    for (const log of logsToSend) {
      try {
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(log),
        });
      } catch (e: any) {
        if (!fetchErrorLogged) {
          fetchErrorLogged = true;
          // IMPORTANT: do NOT use window / __proto__ / call.
          try {
            console.log("[Natively] Log upload failed (will not repeat):", e?.message ?? e);
          } catch {
            // ignore
          }
        }
      }
    }
  } catch {
    // ignore
  }
};

const sendErrorToParent = (level: Level, message: string, data: any) => {
  // Web-only; never throw
  if (!isWeb) return;

  try {
    const w: any = typeof globalThis !== "undefined" ? (globalThis as any).window : undefined;
    if (!w?.parent || w.parent === w) return;

    const errorKey = `${level}:${message}:${safeStringify(data)}`;
    if (recentLogs[errorKey]) return;
    markRecent(errorKey);

    w.parent.postMessage(
      {
        type: "EXPO_ERROR",
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        userAgent:
          typeof globalThis !== "undefined" && (globalThis as any).navigator?.userAgent
            ? (globalThis as any).navigator.userAgent
            : "unknown",
        source: "expo-template",
      },
      "*"
    );
  } catch {
    // ignore
  }
};

let installed = false;

export const setupErrorLogging = () => {
  // Dev-only. In prod: do nothing.
  if (!__DEV__) return;
  if (installed) return;
  installed = true;

  // Capture originals ONCE
  const originalLog = console.log?.bind(console) ?? (() => {});
  const originalWarn = console.warn?.bind(console) ?? (() => {});
  const originalError = console.error?.bind(console) ?? (() => {});

  try {
    const url = getLogServerUrl();
    originalLog("[Natively] Error logging enabled");
    originalLog("[Natively] Platform:", Platform.OS);
    originalLog("[Natively] Log server URL:", url || "NOT AVAILABLE");
  } catch {
    // ignore
  }

  console.log = (...args: any[]) => {
    try {
      originalLog(...args);
    } catch {
      // ignore
    }
    try {
      const msg = stringifyArgs(args);
      queueLog("log", msg, getCallerInfo());
    } catch {
      // ignore
    }
  };

  console.warn = (...args: any[]) => {
    try {
      originalWarn(...args);
    } catch {
      // ignore
    }
    try {
      const msg = stringifyArgs(args);
      if (shouldMuteMessage(msg)) return;
      queueLog("warn", msg, getCallerInfo());
    } catch {
      // ignore
    }
  };

  console.error = (...args: any[]) => {
    try {
      originalError(...args);
    } catch {
      // ignore
    }
    try {
      const msg = stringifyArgs(args);
      if (shouldMuteMessage(msg)) return;
      const source = getCallerInfo();
      queueLog("error", msg, source);
      sendErrorToParent("error", "Console Error", { message: msg, source });
    } catch {
      // ignore
    }
  };

  // Web-only runtime hooks (optional)
  if (isWeb) {
    try {
      const w: any = typeof globalThis !== "undefined" ? (globalThis as any).window : undefined;

      if (w) {
        w.onerror = (message: any, source: any, lineno: any, colno: any, error: any) => {
          try {
            const srcFile = typeof source === "string" ? source.split("/").pop() : "unknown";
            const errMsg = `RUNTIME ERROR: ${String(message)} at ${srcFile}:${lineno}:${colno}`;
            queueLog("error", errMsg, `${srcFile}:${lineno}:${colno}`);
            sendErrorToParent("error", "JavaScript Runtime Error", {
              message,
              source: `${srcFile}:${lineno}:${colno}`,
              error: error?.stack || error,
            });
          } catch {
            // ignore
          }
          return false;
        };

        w.addEventListener?.("unhandledrejection", (event: any) => {
          try {
            const reason = event?.reason;
            const msg = `UNHANDLED PROMISE REJECTION: ${safeStringify(reason)}`;
            queueLog("error", msg, "");
            sendErrorToParent("error", "Unhandled Promise Rejection", { reason });
          } catch {
            // ignore
          }
        });
      }
    } catch {
      // ignore
    }
  }
};

// IMPORTANT: Do NOT auto-run on import.
// Call setupErrorLogging() once from your app entry (e.g. app/_layout.tsx) in dev if you want it.
