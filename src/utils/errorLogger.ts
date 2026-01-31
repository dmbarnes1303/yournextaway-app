// src/utils/errorLogger.ts
// Dev-only log forwarding + safe console interception
// Works on iOS/Android/Web without relying on console.__proto__ hacks.

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

// Try to extract a useful "file:line" from stack
const getCallerInfo = (): string => {
  const stack = new Error().stack || "";
  const lines = stack.split("\n");

  for (let i = 3; i < lines.length; i++) {
    const line = lines[i] || "";
    if (line.includes("errorLogger") || line.includes("node_modules")) continue;

    // e.g. "at Foo (file.tsx:10:5)" or "at file.tsx:10:5"
    const m =
      line.match(/at\s+\S+\s+\((?:.*\/)?([^/\s:)]+\.[jt]sx?):(\d+):(\d+)\)/) ||
      line.match(/at\s+(?:.*\/)?([^/\s:)]+\.[jt]sx?):(\d+):(\d+)/);

    if (m) return `${m[1]}:${m[2]}`;
  }

  return "";
};

let cachedLogServerUrl: string | null = null;
let urlChecked = false;

const getLogServerUrl = (): string | null => {
  if (urlChecked) return cachedLogServerUrl;

  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      cachedLogServerUrl = `${window.location.origin}/natively-logs`;
      urlChecked = true;
      return cachedLogServerUrl;
    }

    // Expo dev server URLs vary by SDK. Try a few known locations.
    const anyConstants = Constants as any;

    // Some builds expose hostUri via expoConfig / manifest
    const hostUri =
      Constants.expoConfig?.hostUri ||
      anyConstants.manifest?.hostUri ||
      anyConstants.manifest2?.extra?.expoClient?.hostUri;

    if (hostUri) {
      const protocol =
        hostUri.includes("ngrok") || hostUri.includes(".io") ? "https" : "http";
      cachedLogServerUrl = `${protocol}://${hostUri.split("/")[0]}/natively-logs`;
      urlChecked = true;
      return cachedLogServerUrl;
    }

    // As a last resort, try experienceUrl (older)
    const experienceUrl = anyConstants.experienceUrl;
    if (experienceUrl && typeof experienceUrl === "string") {
      // exp://192.168.1.10:8081
      const stripped = experienceUrl.replace("exp://", "");
      const host = stripped.split("/")[0];
      const protocol =
        host.includes("ngrok") || host.includes(".io") ? "https" : "http";
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
      flushLogs();
    }, FLUSH_INTERVAL);
  }
};

let fetchErrorLogged = false;

const flushLogs = async () => {
  if (queue.length === 0) return;

  const url = getLogServerUrl();
  if (!url) {
    // If there is no dev log endpoint, just drop the queue.
    queue = [];
    return;
  }

  const batch = [...queue];
  queue = [];

  for (const item of batch) {
    try {
      // Fire and forget
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      }).catch((e) => {
        if (fetchErrorLogged) return;
        fetchErrorLogged = true;
        // IMPORTANT: use a safe console reference (no __proto__ nonsense)
        // We will rely on originalConsoleLog captured in setupErrorLogging.
      });
    } catch {
      // ignore
    }
  }
};

const sendErrorToParent = (level: LogLevel, message: string, data: any) => {
  try {
    if (typeof window === "undefined") return;
    if (!window.parent || window.parent === window) return;

    window.parent.postMessage(
      {
        type: "EXPO_ERROR",
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
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

  // Capture originals once
  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  const serverUrl = getLogServerUrl();
  originalLog("[Natively] Error logging enabled");
  originalLog("[Natively] Platform:", Platform.OS);
  originalLog("[Natively] Log server URL:", serverUrl || "NOT AVAILABLE");

  console.log = (...args: any[]) => {
    originalLog(...args);
    const message = stringifyArgs(args);
    const source = getCallerInfo();
    queueLog("log", message, source);
  };

  console.warn = (...args: any[]) => {
    originalWarn(...args);
    const message = stringifyArgs(args);
    if (shouldMuteMessage(message)) return;
    const source = getCallerInfo();
    queueLog("warn", message, source);
  };

  console.error = (...args: any[]) => {
    originalError(...args);
    const message = stringifyArgs(args);
    if (shouldMuteMessage(message)) return;

    const source = getCallerInfo();
    queueLog("error", message, source);
    sendErrorToParent("error", "Console Error", { message, source });
  };

  // Web-only runtime hooks
  if (typeof window !== "undefined") {
    window.onerror = (message, source, lineno, colno, error) => {
      const src = source ? source.split("/").pop() : "unknown";
      const msg = `RUNTIME ERROR: ${String(message)} at ${src}:${lineno}:${colno}`;
      queueLog("error", msg, `${src}:${lineno}:${colno}`);
      sendErrorToParent("error", "JavaScript Runtime Error", {
        message,
        source: `${src}:${lineno}:${colno}`,
        stack: (error as any)?.stack,
      });
      return false;
    };

    window.addEventListener("unhandledrejection", (event: any) => {
      const msg = `UNHANDLED PROMISE REJECTION: ${String(event?.reason ?? "unknown")}`;
      queueLog("error", msg, "");
      sendErrorToParent("error", "Unhandled Promise Rejection", { reason: event?.reason });
    });
  }
};

// Auto-init on import in dev
if (__DEV__) {
  setupErrorLogging();
  }
