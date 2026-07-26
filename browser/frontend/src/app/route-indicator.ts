import { WAVES_COPY } from './waves-copy';

// Derives the read-only "Route" toolbar label from the current run mode and
// address. Distinct from "Source" (the Local/Network mode select, which the
// user actively configures): route is diagnostic display only until a real
// transport route becomes configurable (see WBP-03 accept criteria in
// WAVES_BROWSER_PRODUCT_IMPLEMENTATION_PLAN.md). Never presents an
// unavailable feature as functional -- no control, just text.
export const deriveRouteLabel = (mode: 'local' | 'network', url: string): string => {
  if (mode === 'local') {
    return WAVES_COPY.shell.routeLocalFixtures;
  }
  try {
    const parsed = new URL(url);
    const host = parsed.host || parsed.hostname;
    return WAVES_COPY.shell.routeNetwork(host || url);
  } catch {
    return url ? WAVES_COPY.shell.routeNetwork(url) : WAVES_COPY.shell.networkMode;
  }
};

export const bindRouteIndicator = (
  routeLabelEl: HTMLElement,
  runModeSelectEl: HTMLSelectElement,
  fetchUrlInputEl: HTMLInputElement
): (() => void) => {
  const update = (): void => {
    const mode = runModeSelectEl.value === 'local' ? 'local' : 'network';
    routeLabelEl.textContent = deriveRouteLabel(mode, fetchUrlInputEl.value);
  };
  update();
  runModeSelectEl.addEventListener('change', update);
  fetchUrlInputEl.addEventListener('input', update);
  fetchUrlInputEl.addEventListener('change', update);
  return () => {
    runModeSelectEl.removeEventListener('change', update);
    fetchUrlInputEl.removeEventListener('input', update);
    fetchUrlInputEl.removeEventListener('change', update);
  };
};
