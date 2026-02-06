// src/utils/errorLogger.ts
// Dev-only log forwarding + safe console interception.
// Must NEVER crash the app (iOS/Android/Web).

declare const __DEV__: boolean;

import { Platform } from "react-native";
import Constants from "expo-constants";

type LogLevel = "log" | "warn" | "error";

type QueueItem = {
  level: LogLevel;
  message: string;
  source: string;
  timestamp: string;
  platform: string;
};

const MUTED_MESSAGES = [
  'each child in a list should have a unique "key" prop',
  'Each child in a list should have a unique "key" prop',
];

const shouldMuteMessage = (message: string) =>
  MUTED_MESSAGES.some((m) => message.includes(m));

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

const stringifyArgs = (args: any[]): string => {
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg === null) return "null";
      if (arg === undefined) return "undefined";
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
};

// Best-effort "file:line" from stack (dev only)
const getCallerInfo = (): string => {
  try {
    const stack = new Error().stack || "";
    const lines = stack.split("\n");

    for (let i = 3; i < lines.length; i++) {
      const line = lines[i] || "";
      if (line.includes("errorLogger") || line.includes("node_modules")) continue;

      const m =
        line.match(/at\s+\S+\s+\((?:.*\/)?([^/\s:)]+\.[jt]sx?):(\d+):(\d+)\)/) ||
        line.match(/at\s+(?:.*\/)?([^/\s:)]+\.[jt]sx?):(\d+):(\d+)/);

      if (m) return `${m[1]}:${m[2]}`;
    }
  } catch {
    // ignore
  }

  return "";
};

let cachedLogServerUrl: string | null = null;
let urlChecked = false;

const getLogServerUrl = (): string | null => {
  if (urlChecked) return cachedLogServerUrl;

  try {
    // Web: use location.origin if available
    if (Platform.OS === "web") {
      const w = (globalThis as any)?.window;
      const origin = w?.location?.origin;
      if (typeof origin === "string" && origin.length) {
        cachedLogServerUrl = `${origin}/natively-logs`;
        urlChecked = true;
        return cachedLogServerUrl;
      }
    }

    // RN/Expo: try hostUri variants
    const anyConstants = Constants as any;

    const hostUri =
      Constants.expoConfig?.hostUri ||
      anyConstants.manifest?.hostUri ||
      anyConstants.manifest2?.extra?.expoClient?.hostUri;

    if (typeof hostUri === "string" && hostUri.length) {
      const host = hostUri.split("/")[0];
      const protocol = host.includes("ngrok") || host.includes(".io") ? "https" : "http";
      cachedLogServerUrl = `${protocol}://${host}/natively-logs`;
      urlChecked = true;
      return cachedLogServerUrl;
    }

    const experienceUrl = anyConstants.experienceUrl;
    if (typeof experienceUrl === "string" && experienceUrl.length) {
      const stripped = experienceUrl.replace("exp://", "");
      const host = stripped.split("/")[0];
      const protocol = host.includes("ngrok") || host.includes(".io") ? "https" : "http";
      cachedLogServerUrl = `${protocol}://${host}/natively-logs`;
      urlChecked = true;
      return cachedLogServerUrl;
    }
  } catch {
    // ignore
  }

  urlChecked = true;
  cachedLogServerUrl = null;
  return null;
};

const recentLogs: Record<string, number> = {};
const DUP_MS = 200;

const seenRecently = (key: string) => {
  const now = Date.now();
  const last = recentLogs[key] || 0;
  if (now - last < DUP_MS) return true;
  recentLogs[key] = now;
  return false;
};

let queue: QueueItem[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 500;

const queueLog = (level: LogLevel, message: string, source = "") => {
  const key = `${level}:${message}`;
  if (seenRecently(key)) return;

  queue.push({
    level,
    message,
    source,
    timestamp: new Date().toISOString(),
    platform: getPlatformName(),
  });

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flushLogs();
    }, FLUSH_INTERVAL);
  }
};

let fetchErrorLogged = false;

const flushLogs = async () => {
  if (queue.length === 0) return;

  const url = getLogServerUrl();
  if (!url) {
    queue = [];
    return;
  }

  const batch = [...queue];
  queue = [];

  for (const item of batch) {
    try {
      // fire-and-forget
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      }).catch(() => {
        // only log once (and never throw)
        fetchErrorLogged = true;
      });
    } catch {
      // ignore
    }
  }
};

const safeGetWindow = (): any | null => {
  try {
    const w = (globalThis as any)?.window;
    return w && typeof w === "object" ? w : null;
  } catch {
    return null;
  }
};

const sendErrorToParent = (level: LogLevel, message: string, data: any) => {
  // Web-only (and only if postMessage exists)
  if (Platform.OS !== "web") return;

  try {
    const w = safeGetWindow();
    if (!w) return;
    if (!w.parent || w.parent === w) return;
    if (typeof w.parent.postMessage !== "function") return;

    const ua = (globalThis as any)?.navigator?.userAgent ?? "unknown";

    w.parent.postMessage(
      {
        type: "EXPO_ERROR",
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        userAgent: ua,
        source: "expo",
      },
      "*"
    );
  } catch {
    // ignore
  }
};

export const setupErrorLogging = () => {
  if (!__DEV__) return;

  // Guard: don't install twice (fast refresh)
  const markerKey = "__yna_error_logger_installed__";
  const g = globalThis as any;
  if (g[markerKey]) return;
  g[markerKey] = true;

  // Capture originals safely
  const originalLog = typeof console.log === "function" ? console.log.bind(console) : () => {};
  const originalWarn = typeof console.warn === "function" ? console.warn.bind(console) : () => {};
  const originalError = typeof console.error === "function" ? console.error.bind(console) : () => {};

  const serverUrl = getLogServerUrl();
  originalLog("[Natively] Error logging enabled");
  originalLog("[Natively] Platform:", Platform.OS);
  originalLog("[Natively] Log server URL:", serverUrl || "NOT AVAILABLE");

  console.log = (...args: any[]) => {
    originalLog(...args);
    try {
      const message = stringifyArgs(args);
      const source = getCallerInfo();
      queueLog("log", message, source);
    } catch {
      // never throw
    }
  };

  console.warn = (...args: any[]) => {
    originalWarn(...args);
    try {
      const message = stringifyArgs(args);
      if (shouldMuteMessage(message)) return;
      const source = getCallerInfo();
      queueLog("warn", message, source);
    } catch {
      // never throw
    }
  };

  console.error = (...args: any[]) => {
    originalError(...args);
    try {
      const message = stringifyArgs(args);
      if (shouldMuteMessage(message)) return;

      const source = getCallerInfo();
      queueLog("error", message, source);
      sendErrorToParent("error", "Console Error", { message, source });
    } catch {
      // never throw
    }
  };

  // Web-only runtime hooks (must be ultra defensive)
  if (Platform.OS === "web") {
    try {
      const w = safeGetWindow();
      if (!w) return;

      // onerror exists on web; if missing, skip
      w.onerror = (message: any, source: any, lineno: any, colno: any, error: any) => {
        try {
          const src = source ? String(source).split("/").pop() : "unknown";
          const msg = `RUNTIME ERROR: ${String(message)} at ${src}:${lineno}:${colno}`;
          queueLog("error", msg, `${src}:${lineno}:${colno}`);
          sendErrorToParent("error", "JavaScript Runtime Error", {
            message,
            source: `${src}:${lineno}:${colno}`,
            stack: error?.stack,
          });
        } catch {
          // ignore
        }
        return false;
      };

      // addEventListener might exist but not be a function depending on environment
      if (typeof w.addEventListener === "function") {
        w.addEventListener("unhandledrejection", (event: any) => {
          try {
            const msg = `UNHANDLED PROMISE REJECTION: ${String(event?.reason ?? "unknown")}`;
            queueLog("error", msg, "");
            sendErrorToParent("error", "Unhandled Promise Rejection", { reason: event?.reason });
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

// Auto-init on import in dev
if (__DEV__) {
  try {
    setupErrorLogging();
  } catch {
    // absolutely never crash
  }
      }
