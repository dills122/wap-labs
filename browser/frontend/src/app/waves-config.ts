export const WAVES_CONFIG = {
  appName: 'Waves Browser',
  appTagline: 'WAP/WML based browser 1.x',
  defaultStartUrl: 'http://127.0.0.1:3000/',
  defaultDebugBaseUrl: 'http://local.test/start.wml',
  defaultViewportCols: 20,
  maxTimelineEvents: 200,
  maxExternalIntentHops: 3,
  networkProbeMaxAttempts: 3,
  networkProbeDelayMs: 1200,
  networkProbeTimeoutMs: 1800,
  engineTimerTickMs: 100
} as const;
