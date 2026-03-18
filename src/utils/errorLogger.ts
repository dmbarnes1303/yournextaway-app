import Constants from "expo-constants";
import { Platform } from "react-native";

declare const __DEV__: boolean;

// Dev-only log forwarding + safe console interception.
// Must NEVER crash the app (iOS/Android/Web).

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

const stringifyArgs = (args: unknown[]): string => {
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

const getCallerInfo = (): string => {
  try {
    const stack = new Error().stack || "";
    const lines = stack.split("\n");

    for (let i = 3; i < lines.length; i += 1) {
      const line = lines[i] || "";
      if (line.includes("errorLogger") || line.includes("node_modules")) continue;

      const match =
        line.match(/at\s+\S+\s+\((?:.*\/)?([^/\s:)]+\.[jt]sx?):(\d+):(\d+)\)/) ||
        line.match(/at\s+(?:.*\/)?([^/\s:)]+\.[jt]sx?):(\d+):(\d+)/);

      if (match) return `${match[1]}:${match[2]}`;
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
    if (Platform.OS === "web") {
      const win = (globalThis as { window?: { location?: { origin?: string } } }).window;
      const origin = win?.location?.origin;

      if (typeof origin === "string" && origin.length > 0) {
        cachedLogServerUrl = `${origin}/natively-logs`;
        urlChecked = true;
        return cachedLogServerUrl;
      }
    }

    const expoConstants = Constants as Constants & {
      manifest?: { hostUri?: string };
      manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
      experienceUrl?: string;
    };

    const hostUri =
      Constants.expoConfig?.hostUri ||
      expoConstants.manifest?.hostUri ||
      expoConstants.manifest2?.extra?.expoClient?.hostUri;

    if (typeof hostUri === "string" && hostUri.length > 0) {
      const host = hostUri.split("/")[0];
      const protocol = host.includes("ngrok") || host.includes(".io") ? "https" : "http";
      cachedLogServerUrl = `${protocol}://${host}/natively-logs`;
      urlChecked = true;
      return cachedLogServerUrl;
    }

    const experienceUrl = expoConstants.experienceUrl;
    if (typeof experienceUrl === "string" && experienceUrl.length > 0) {
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
  const nowTs = Date.now();
  const last = recentLogs[key] || 0;

  if (nowTs - last < DUP_MS) return true;

  recentLogs[key] = nowTs;
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
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      }).catch(() => {
        // ignore
      });
    } catch {
      // ignore
    }
  }
};

const safeGetWindow = (): Window | null => {
  try {
    const win = globalThis.window;
    return win && typeof win === "object" ? win : null;
  } catch {
    return null;
  }
};

const sendErrorToParent = (level: LogLevel, message: string, data: unknown) => {
  if (Platform.OS !== "web") return;

  try {
    const win = safeGetWindow();
    if (!win) return;
    if (!win.parent || win.parent === win) return;
    if (typeof win.parent.postMessage !== "function") return;

    const userAgent = globalThis.navigator?.userAgent ?? "unknown";

    win.parent.postMessage(
      {
        type: "EXPO_ERROR",
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        userAgent,
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

  const markerKey = "__yna_error_logger_installed__";
  const globalObj = globalThis as typeof globalThis & {
    __yna_error_logger_installed__?: boolean;
  };

  if (globalObj[markerKey]) return;
  globalObj[markerKey] = true;

  const originalLog =
    typeof console.log === "function" ? console.log.bind(console) : () => {};
  const originalWarn =
    typeof console.warn === "function" ? console.warn.bind(console) : () => {};
  const originalError =
    typeof console.error === "function" ? console.error.bind(console) : () => {};

  const serverUrl = getLogServerUrl();
  originalLog("[Natively] Error logging enabled");
  originalLog("[Natively] Platform:", Platform.OS);
  originalLog("[Natively] Log server URL:", serverUrl || "NOT AVAILABLE");

  console.log = (...args: unknown[]) => {
    originalLog(...args);
    try {
      const message = stringifyArgs(args);
      const source = getCallerInfo();
      queueLog("log", message, source);
    } catch {
      // never throw
    }
  };

  console.warn = (...args: unknown[]) => {
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

  console.error = (...args: unknown[]) => {
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

  if (Platform.OS === "web") {
    try {
      const win = safeGetWindow();
      if (!win) return;

      win.onerror = (
        message: Event | string,
        source?: string,
        lineno?: number,
        colno?: number,
        error?: Error
      ) => {
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

      if (typeof win.addEventListener === "function") {
        win.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
          try {
            const msg = `UNHANDLED PROMISE REJECTION: ${String(event.reason ?? "unknown")}`;
            queueLog("error", msg, "");
            sendErrorToParent("error", "Unhandled Promise Rejection", {
              reason: event.reason,
            });
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

if (__DEV__) {
  try {
    setupErrorLogging();
  } catch {
    // absolutely never crash
  }
}
