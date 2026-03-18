import Constants from "expo-constants";
import { Platform } from "react-native";

declare const __DEV__: boolean;

type LogLevel = "log" | "warn" | "error";

type QueueItem = {
  level: LogLevel;
  message: string;
  source: string;
  timestamp: string;
  platform: string;
};

let isInstalled = false;

const MUTED_MESSAGES = [
  'each child in a list should have a unique "key" prop',
  'Each child in a list should have a unique "key" prop',
];

const shouldMuteMessage = (message: string) =>
  MUTED_MESSAGES.some((m) => message.includes(m));

const getPlatformName = () => {
  if (Platform.OS === "ios") return "iOS";
  if (Platform.OS === "android") return "Android";
  if (Platform.OS === "web") return "Web";
  return Platform.OS;
};

const stringifyArgs = (args: unknown[]) =>
  args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg == null) return String(arg);
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");

const getCallerInfo = () => {
  try {
    const stack = new Error().stack || "";
    const lines = stack.split("\n");

    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.includes("node_modules")) continue;

      const match =
        line.match(/([^/\s]+\.[jt]sx?):(\d+):(\d+)/);

      if (match) return `${match[1]}:${match[2]}`;
    }
  } catch {}

  return "";
};

let queue: QueueItem[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

const queueLog = (level: LogLevel, message: string, source: string) => {
  queue.push({
    level,
    message,
    source,
    timestamp: new Date().toISOString(),
    platform: getPlatformName(),
  });

  if (!timer) {
    timer = setTimeout(() => {
      timer = null;
      queue = [];
    }, 500);
  }
};

const getLogServerUrl = (): string | null => {
  try {
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      (Constants as any)?.manifest?.hostUri;

    if (!hostUri) return null;

    const host = hostUri.split("/")[0];
    return `http://${host}/natively-logs`;
  } catch {
    return null;
  }
};

export const setupErrorLogging = () => {
  if (!__DEV__) return;
  if (isInstalled) return;

  isInstalled = true;

  try {
    const originalLog = console.log?.bind(console) || (() => {});
    const originalWarn = console.warn?.bind(console) || (() => {});
    const originalError = console.error?.bind(console) || (() => {});

    const serverUrl = getLogServerUrl();

    originalLog("[Logger] enabled");
    originalLog("[Logger] platform:", Platform.OS);
    originalLog("[Logger] server:", serverUrl || "none");

    console.log = (...args) => {
      originalLog(...args);
      try {
        queueLog("log", stringifyArgs(args), getCallerInfo());
      } catch {}
    };

    console.warn = (...args) => {
      originalWarn(...args);
      try {
        const msg = stringifyArgs(args);
        if (shouldMuteMessage(msg)) return;
        queueLog("warn", msg, getCallerInfo());
      } catch {}
    };

    console.error = (...args) => {
      originalError(...args);
      try {
        const msg = stringifyArgs(args);
        if (shouldMuteMessage(msg)) return;
        queueLog("error", msg, getCallerInfo());
      } catch {}
    };
  } catch (e) {
    // never break app
    console.warn("Logger failed safely", e);
  }
};
