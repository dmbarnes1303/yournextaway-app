// utils/errorLogger.ts
/* eslint-disable no-console */

/**
 * Crash-proof console wrapper for RN + Web.
 *
 * Goals:
 * - NEVER crash the app (even if console methods are missing or weirdly patched)
 * - Prefix all logs with a stable tag
 * - Fast Refresh safe (won’t stack wrappers repeatedly)
 * - Best-effort global error forwarding via ErrorUtils when available
 */

type ConsoleMethod = (...args: any[]) => void;

type SafeConsole = {
  log?: ConsoleMethod;
  info?: ConsoleMethod;
  warn?: ConsoleMethod;
  error?: ConsoleMethod;
  debug?: ConsoleMethod;
};

type Originals = {
  log?: ConsoleMethod;
  info?: ConsoleMethod;
  warn?: ConsoleMethod;
  error?: ConsoleMethod;
  debug?: ConsoleMethod;
};

function prefix() {
  return "[YNA]";
}

function getConsole(): SafeConsole {
  const c = (globalThis as any)?.console;
  return c && typeof c === "object" ? (c as SafeConsole) : {};
}

function isFn(x: any): x is ConsoleMethod {
  return typeof x === "function";
}

function safeCall(fn: ConsoleMethod | undefined, thisArg: any, args: any[]) {
  if (!isFn(fn)) return;
  try {
    fn.apply(thisArg, args);
  } catch {
    // swallow — logging must never crash runtime
  }
}

function wrap(
  methodName: keyof Originals,
  originals: Originals,
  getThisArg: () => any
): ConsoleMethod {
  return (...args: any[]) => {
    const c = getConsole();
    const thisArg = getThisArg() ?? c;

    // Always try original first (so we don't recurse into our own wrapper)
    safeCall(originals[methodName], thisArg, [prefix(), ...args]);

    // Phase 2 hook (remote logging) can go here — MUST be best-effort.
    // try { remoteSend(methodName, args) } catch {}
  };
}

(function install() {
  const g = globalThis as any;

  // Single global slot so Fast Refresh doesn’t wrap repeatedly.
  const KEY = "__yna_error_logger__";

  // If already installed, do nothing.
  if (g[KEY]?.installed) return;

  const c = getConsole();

  const originals: Originals = {
    log: isFn(c.log) ? c.log : undefined,
    info: isFn(c.info) ? c.info : undefined,
    warn: isFn(c.warn) ? c.warn : undefined,
    error: isFn(c.error) ? c.error : undefined,
    debug: isFn(c.debug) ? c.debug : undefined,
  };

  // Persist installation state + originals (so wrappers always call the true original)
  g[KEY] = { installed: true, originals };

  const getThisArg = () => getConsole();

  // Override only if the method exists and is callable
  if (isFn(c.log)) c.log = wrap("log", originals, getThisArg);
  if (isFn(c.info)) c.info = wrap("info", originals, getThisArg);
  if (isFn(c.warn)) c.warn = wrap("warn", originals, getThisArg);
  if (isFn(c.error)) c.error = wrap("error", originals, getThisArg);
  if (isFn(c.debug)) c.debug = wrap("debug", originals, getThisArg);

  // Best-effort global error handler (RN only usually).
  try {
    const EU = (g as any)?.ErrorUtils;
    const getHandler = EU?.getGlobalHandler;
    const setHandler = EU?.setGlobalHandler;

    if (isFn(getHandler) && isFn(setHandler)) {
      const prevHandler = getHandler();

      setHandler((err: any, isFatal?: boolean) => {
        try {
          const cc = getConsole();
          safeCall(originals.error ?? originals.log, cc, [
            prefix(),
            "GlobalError",
            isFatal ? "(fatal)" : "",
            err,
          ]);
        } catch {
          // ignore
        }

        try {
          if (isFn(prevHandler)) prevHandler(err, isFatal);
        } catch {
          // ignore
        }
      });
    }
  } catch {
    // ignore
  }
})();
