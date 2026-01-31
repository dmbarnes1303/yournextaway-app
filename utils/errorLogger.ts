// utils/errorLogger.ts
import { Platform } from "react-native";
import Constants from "expo-constants";

declare const __DEV__: boolean;

type LogItem = {
  level: "log" | "warn" | "error";
  message: string;
  source: string;
  timestamp: string;
  platform: string;
};

const recentLogs: Record<string, boolean> = {};
const clearLogAfterDelay = (key: string) => setTimeout(() => delete recentLogs[key], 200);

const MUTED_MESSAGES = [
  'each child in a list should have a unique "key" prop',
  'Each child in a list should have a unique "key" prop',
];

const shouldMuteMessage = (message: string) => MUTED_MESSAGES.some((m) => message.includes(m));

let logQueue: LogItem[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 500;

const getPlatformName = (): string => {
  if (Platform.OS === "ios") return "iOS";
  if (Platform.OS === "android") return "Android";
  if (Platform.OS === "web") return "Web";
  return Platform.OS;
};

let cachedLogServerUrl: string | null = null;
let urlChecked = false;

const getLogServerUrl = (): string | null => {
  if (urlChecked) return cachedLogServerUrl;

  try {
    // Web: same origin
    if (Platform.OS === "web" && typeof window !== "undefined") {
      cachedLogServerUrl = `${window.location.origin}/natively-logs`;
      urlChecked = true;
      return cachedLogServerUrl;
    }

    // Native: Expo dev server
    const experienceUrl = (Constants as any).experienceUrl as string | undefined;
    if (experienceUrl) {
      // exp://192.168.x.x:19000 -> http://192.168.x.x:19000
      const host = experienceUrl.replace("exp://", "").split("/")[0];
      const isLocal = host.includes("192.168.") || host.includes("10.") || host.includes("localhost");
      const protocol = isLocal ? "http" : "https";
      cachedLogServerUrl = `${protocol}://${host}/natively-logs`;
      urlChecked = true;
      return cachedLogServerUrl;
    }

    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
    if (hostUri) {
      const host = String(hostUri).split("/")[0];
      const protocol = host.includes("ngrok") || host.includes(".io") ? "https" : "http";
      cachedLogServerUrl = `${protocol}://${host}/natively-logs`;
      urlChecked = true;
      return cachedLogServerUrl;
    }
  } catch {
    // ignore
  }

  urlChecked = true;
  return cachedLogServerUrl;
};

const safeRawLog = (...args: any[]) => {
  try {
    if (typeof window !== "undefined" && (window as any).console?.log) {
      (window as any).console.log(...args);
      return;
    }
    console.log(...args);
  } catch {
    // never throw from logging
  }
};

const extractSourceLocation = (stack: string): string => {
  if (!stack) return "";
  const lines = stack.split("\n");

  for (const line of lines) {
    if (line.includes("errorLogger") || line.includes("node_modules")) continue;
    const m =
      line.match(/at\s+\S+\s+\((?:.*\/)?([^/\s:)]+\.[jt]sx?):(\d+):(\d+)\)/) ||
      line.match(/at\s+(?:.*\/)?([^/\s:)]+\.[jt]sx?):(\d+):(\d+)/);
    if (m) return `${m[1]}:${m[2]}`;
  }
  return "";
};

const getCallerInfo = (): string => {
  try {
    const stack = new Error().stack || "";
    return extractSourceLocation(stack);
  } catch {
    return "";
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

let fetchErrorLogged = false;

const flushLogs = async () => {
  if (!logQueue.length) return;

  const url = getLogServerUrl();
  if (!url) {
    logQueue = [];
    flushTimeout = null;
    return;
  }

  const logsToSend = [...logQueue];
  logQueue = [];
  flushTimeout = null;

  for (const log of logsToSend) {
    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      }).catch((e) => {
        if (!fetchErrorLogged) {
          fetchErrorLogged = true;
          safeRawLog("[Natively] Fetch error (will not repeat):", e?.message || e);
        }
      });
    } catch {
      // ignore
    }
  }
};

const queueLog = (level: LogItem["level"], message: string, source = "") => {
  const key = `${level}:${message}`;
  if (recentLogs[key]) return;

  recentLogs[key] = true;
  clearLogAfterDelay(key);

  logQueue.push({
    level,
    message,
    source,
    timestamp: new Date().toISOString(),
    platform: getPlatformName(),
  });

  if (!flushTimeout) flushTimeout = setTimeout(flushLogs, FLUSH_INTERVAL);
};

export const setupErrorLogging = () => {
  if (!__DEV__) return;

  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  safeRawLog("[Natively] Setting up error logging…");
  safeRawLog("[Natively] Log server URL:", getLogServerUrl() || "NOT AVAILABLE");
  safeRawLog("[Natively] Platform:", Platform.OS);

  console.log = (...args: any[]) => {
    originalLog(...args);
    queueLog("log", stringifyArgs(args), getCallerInfo());
  };

  console.warn = (...args: any[]) => {
    const msg = stringifyArgs(args);
    if (shouldMuteMessage(msg)) return;
    originalWarn(...args);
    queueLog("warn", msg, getCallerInfo());
  };

  console.error = (...args: any[]) => {
    const msg = stringifyArgs(args);
    if (shouldMuteMessage(msg)) return;
    originalError(...args);
    queueLog("error", msg, getCallerInfo());
  };

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      queueLog("error", `UNHANDLED PROMISE REJECTION: ${String((event as any)?.reason)}`, "");
    });

    window.onerror = (message, source, lineno, colno) => {
      const src = source ? String(source).split("/").pop() : "unknown";
      const msg = `RUNTIME ERROR: ${String(message)} at ${src}:${lineno}:${colno}`;
      queueLog("error", msg, `${src}:${lineno}:${colno}`);
      return false;
    };
  }
};

// Auto-init in dev (safe)
if (__DEV__) {
  try {
    setupErrorLogging();
  } catch {
    // never crash
  }
};
