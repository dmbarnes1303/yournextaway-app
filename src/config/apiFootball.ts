function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function safeUrl(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

export function getBackendBaseUrl(): string {
  const raw =
    clean(process.env.EXPO_PUBLIC_BACKEND_URL) ||
    clean((process.env as any)?.EXPO_PUBLIC_BACKEND_BASE_URL);

  const safe = safeUrl(raw);
  return safe ? safe.replace(/\/+$/, "") : "";
}

export function assertBackendBaseUrl(): string {
  const url = getBackendBaseUrl();

  if (!url) {
    throw new Error(
      "Missing backend URL. Set EXPO_PUBLIC_BACKEND_URL."
    );
  }

  return url;
}
