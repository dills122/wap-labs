import { WAVES_CONFIG } from './waves-config';

const FALLBACK_START_URL = WAVES_CONFIG.defaultStartUrl;
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'wap:', 'waps:']);
const RUN_MODES = new Set(['local', 'network']);

export type DefaultRunMode = 'local' | 'network';

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
    return parsed.toString();
  } catch {
    return FALLBACK_START_URL;
  }
};

export const defaultStartUrlFallback = (): string => FALLBACK_START_URL;

export const defaultRunMode = (
  candidate = import.meta.env.VITE_WAVES_DEFAULT_RUN_MODE,
  startUrl = defaultStartUrl()
): DefaultRunMode => {
  if (candidate && RUN_MODES.has(candidate.trim())) {
    return candidate.trim() as DefaultRunMode;
  }

  try {
    const parsed = new URL(startUrl);
    return parsed.protocol === 'wap:' || parsed.protocol === 'waps:' ? 'network' : 'local';
  } catch {
    return 'local';
  }
};
