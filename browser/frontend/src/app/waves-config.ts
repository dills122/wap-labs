export const WAVES_CONFIG = {
  appName: 'Waves Browser',
  appTagline: 'WAP/WML based browser 1.x',
  appDescription: 'Waves is a WAP/WML based browser 1.x.',
  defaultStartUrl: 'wap://localhost/',
  defaultDebugBaseUrl: 'http://local.test/start.wml',
  defaultViewportCols: 20,
  maxTimelineEvents: 200,
  timelineSchemaVersion: 1,
  timelineExportFilename: 'waves-event-timeline.json',
  timelineExportJsonIndent: 2,
  maxExternalIntentHops: 3,
  transportFetchTimeoutMs: 5000,
  transportFetchRetries: 1,
  transportUaCapabilityProfile: 'wap-baseline',
  networkProbeMaxAttempts: 3,
  networkProbeDelayMs: 1200,
  networkProbeTimeoutMs: 1800,
  engineTimerTickMs: 100,
  // Repeat navigations (not the very first deck render) only show an
  // in-progress indicator if they take longer than this, so instant
  // local-mode loads don't flash it (see U1 in USABILITY_RESILIENCE_BACKLOG.md).
  navigationProgressDelayMs: 180,
  toastTtlMs: 6000,
  scriptTimerAnonymousIdPadLength: 6
} as const;
