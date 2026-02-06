// utils/errorLogger.ts
/* eslint-disable no-console */

type ConsoleMethod = (...args: any[]) => void;

type SafeConsole = {
  log?: ConsoleMethod;
  info?: ConsoleMethod;
  warn?: ConsoleMethod;
  error?: ConsoleMethod;
  debug?: ConsoleMethod;
};

function getConsole(): SafeConsole {
  // RN + web safe
  const c = (globalThis as any)?.console;
  return c && typeof c === "object" ? (c as SafeConsole) : {};
}

function isFn(x: any): x is ConsoleMethod {
  return typeof x === "function";
}

function safeInvoke(fn: ConsoleMethod | undefined, thisArg: any, args: any[]) {
  if (!isFn(fn)) return;
  try {
    // apply is safer than relying on proto hacks
    fn.apply(thisArg, args);
  } catch {
    // never let logging crash the app
  }
}

function formatPrefix() {
  return "[YNA]";
}

/**
 * This file should NEVER crash the app.
 * It only wraps console methods to:
 * - prefix logs
 * - optionally forward somewhere later (Phase 2)
 *
 * It must be RN-safe:
 * - no window-only assumptions
 * - no __proto__ games
 */
(function install() {
  const c = getConsole();

  // capture originals once
  const original = {
    log: c.log,
    info: c.info,
    warn: c.warn,
    error: c.error,
    debug: c.debug,
  };

  // guard: don’t double-install (fast refresh)
  const markerKey = "__yna_logger_installed__";
  const anyGlobal = globalThis as any;
  if (anyGlobal[markerKey]) return;
  anyGlobal[markerKey] = true;

  function wrap(methodName: keyof typeof original) {
    const orig = original[methodName];
    return (...args: any[]) => {
      // Always print using the original method if it exists
      safeInvoke(orig, c, [formatPrefix(), ...args]);

      // If you later add remote logging, do it here,
      // BUT keep it best-effort and never throw.
      // try { remoteSend(methodName, args) } catch {}
    };
  }

  // Only override if there’s something to override
  if (isFn(c.log)) c.log = wrap("log");
  if (isFn(c.info)) c.info = wrap("info");
  if (isFn(c.warn)) c.warn = wrap("warn");
  if (isFn(c.error)) c.error = wrap("error");
  if (isFn(c.debug)) c.debug = wrap("debug");

  // Also catch unhandled errors (best-effort, RN safe)
  try {
    const prevHandler = (ErrorUtils as any)?.getGlobalHandler?.();
    (ErrorUtils as any)?.setGlobalHandler?.((err: any, isFatal?: boolean) => {
      try {
        safeInvoke(original.error, c, [formatPrefix(), "GlobalError", isFatal ? "(fatal)" : "", err]);
      } catch {
        // ignore
      }
      try {
        if (typeof prevHandler === "function") prevHandler(err, isFatal);
      } catch {
        // ignore
      }
    });
  } catch {
    // ErrorUtils may not exist in some environments
  }
})();
