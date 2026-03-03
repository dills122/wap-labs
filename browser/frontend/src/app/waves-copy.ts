import { WAVES_CONFIG } from './waves-config';

const locale = {
  app: {
    brand: 'Waves',
    tagline: WAVES_CONFIG.appTagline
  },
  shell: {
    back: 'Back',
    reload: 'Reload',
    go: 'Go',
    deckView: 'Deck View',
    idle: 'idle',
    up: 'Up',
    select: 'Select',
    down: 'Down',
    viewportCols: 'Viewport Cols',
    status: 'Status',
    developerTools: 'Developer Tools',
    health: 'Health',
    render: 'Render',
    snapshot: 'Snapshot',
    clearExternalIntent: 'Clear External Intent',
    exportTimeline: 'Export Timeline',
    clearTimeline: 'Clear Timeline',
    rawWmlPaste: 'Raw WML Paste',
    baseUrl: 'Base URL',
    loadRawWml: 'Load Raw WML',
    sessionState: 'Session State',
    transportResponse: 'Transport Response',
    runtimeSnapshot: 'Runtime Snapshot',
    eventTimeline: 'Event Timeline'
  },
  sampleDeck: {
    intro: WAVES_CONFIG.appTagline,
    next: 'Go to next card',
    external: 'External link',
    nextCard: 'You are on the next card.',
    home: 'Go home'
  },
  statusPrefix: {
    loading: 'Loading ',
    followingExternalIntent: 'Following external intent:'
  },
  status: {
    starting: `Starting ${WAVES_CONFIG.appTagline}...`,
    ready: 'Ready.',
    readyNetwork: 'Ready. Network available.',
    health: (message: string) => `Health: ${message}`,
    rawWmlLoaded: 'Raw WML loaded and rendered (debug mode).',
    renderedCurrentCard: 'Rendered current card.',
    navigateBackEngine: 'navigateBack invoked (engine history).',
    navigateBackBrowser: 'navigateBack invoked (browser history).',
    navigateBackNone: 'No back history available.',
    snapshotRefreshed: 'Snapshot refreshed.',
    clearedExternalIntent: 'Cleared external navigation intent.',
    noTimelineToExport: 'No timeline events to export yet.',
    exportedTimeline: 'Exported timeline JSON.',
    clearedTimeline: 'Cleared event timeline.',
    developerToolsOpened: 'Developer tools opened.',
    developerToolsHidden: 'Developer tools hidden.',
    keyboard: (key: string) => `Keyboard: ${key}`,
    keyboardBackEngine: 'Keyboard: back (engine history)',
    keyboardBackBrowser: 'Keyboard: back (browser history)',
    keyboardBackNone: 'Keyboard: no back history',
    handledKey: (key: string) => `Handled key: ${key}`,
    loading: (url: string) => `Loading ${url}...`,
    followingExternalIntent: (url: string) => `Following external intent: ${url}`,
    loadingPreviousPage: (url: string) => `Loading previous page: ${url}`,
    fetchFailed: (message: string) => `Fetch failed: ${message}`,
    fetchedAndLoadedDeck: (url: string) => `Fetched and loaded deck from ${url}`,
    networkUnavailableToast: 'No network available currently. WAP server/gateway is unreachable.',
    networkUnavailable: 'No network available currently. Could not reach WAP server/gateway.',
    error: (message: string) => `Error: ${message}`
  }
} as const;

export const WAVES_COPY = locale;
