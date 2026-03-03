const FALLBACK_START_URL = 'http://127.0.0.1:3000/';
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'wap:', 'waps:']);

export const defaultStartUrl = (candidate = import.meta.env.VITE_WAVES_DEFAULT_URL): string => {
  if (!candidate || !candidate.trim()) {
    return FALLBACK_START_URL;
  }
  const trimmed = candidate.trim();
  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return FALLBACK_START_URL;
    }
    return trimmed;
  } catch {
    return FALLBACK_START_URL;
  }
};

export const defaultStartUrlFallback = (): string => FALLBACK_START_URL;
