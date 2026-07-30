import {
  APPLICATION_STATE_ALLOWED_NETWORK_SCHEMES,
  APPLICATION_STATE_SAFE_KEYS,
  APPLICATION_STATE_SCHEMA_VERSION,
  APPLICATION_STATE_SENSITIVE_QUERY_KEYS,
  DEFAULT_APPLICATION_STATE_V1,
  type ApplicationStateComponent,
  type ApplicationStateLoadResult,
  type ApplicationStateV1
} from '../../../contracts/application-state';
import type { TauriHostClient } from '../../../contracts/generated/tauri-host-client';

export const WELCOME_STARTUP_STORAGE_KEY = 'waves.showWelcomeOnLaunch';

export interface ApplicationStateStore {
  load(): Promise<ApplicationStateLoadResult>;
  save(state: ApplicationStateV1): Promise<ApplicationStateV1>;
  reset(): Promise<ApplicationStateV1>;
  clear(component: ApplicationStateComponent): Promise<ApplicationStateV1>;
}

export interface LegacyPreferenceStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

const safeStateKeys = new Set<string>(APPLICATION_STATE_SAFE_KEYS);
const allowedNetworkSchemes = new Set<string>(APPLICATION_STATE_ALLOWED_NETWORK_SCHEMES);
const sensitiveQueryKeys = new Set<string>(APPLICATION_STATE_SENSITIVE_QUERY_KEYS);
const localExampleIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const sanitizeNetworkUrl = (value: string, rejectSensitive: boolean): string | undefined => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (!allowedNetworkSchemes.has(url.protocol.slice(0, -1)) || !url.hostname) return undefined;
  const hasCredentials = Boolean(url.username || url.password);
  const hasSensitiveQuery = [...url.searchParams.keys()].some((key) =>
    sensitiveQueryKeys.has(key.toLowerCase())
  );
  if (rejectSensitive && (hasCredentials || hasSensitiveQuery)) return undefined;
  url.username = '';
  url.password = '';
  for (const key of [...url.searchParams.keys()]) {
    if (sensitiveQueryKeys.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  return url.toString();
};

const localExampleIsSafe = (exampleId: string, fragment?: string): boolean =>
  localExampleIdPattern.test(exampleId) &&
  (fragment === undefined || (fragment.startsWith('#') && !/[\u0000-\u001f\u007f]/.test(fragment)));

const sanitizeStateValues = (state: ApplicationStateV1): ApplicationStateV1 => {
  state.favorites.entries = state.favorites.entries.filter((favorite) => {
    if (favorite.target.kind === 'local-example') {
      return localExampleIsSafe(favorite.target.exampleId, favorite.target.fragment);
    }
    const sanitized = sanitizeNetworkUrl(favorite.target.url, false);
    if (!sanitized) return false;
    favorite.target.url = sanitized;
    favorite.target.canonicalUrl = sanitized;
    return true;
  });
  const session = state.safeSession.session;
  const sessionIsSafe =
    session === undefined ||
    (session.kind === 'local-example'
      ? localExampleIsSafe(session.exampleId, session.fragment)
      : sanitizeNetworkUrl(session.url, true) !== undefined);
  if (!sessionIsSafe || session === undefined) {
    state.safeSession = { recoveryPending: false };
  }
  return state;
};

export const projectApplicationStateV1 = (state: ApplicationStateV1): ApplicationStateV1 => {
  if (state.schemaVersion !== APPLICATION_STATE_SCHEMA_VERSION) {
    throw new Error('application-state-schema-version-mismatch');
  }
  const serialized = JSON.stringify(state, function (key, value: unknown): unknown {
    if (key === '' || Array.isArray(this) || safeStateKeys.has(key)) {
      return value;
    }
    return undefined;
  });
  return sanitizeStateValues(JSON.parse(serialized) as ApplicationStateV1);
};

export const defaultApplicationStateV1 = (): ApplicationStateV1 =>
  projectApplicationStateV1(DEFAULT_APPLICATION_STATE_V1 as unknown as ApplicationStateV1);

const defaultLoadResult = (): ApplicationStateLoadResult => ({
  state: defaultApplicationStateV1(),
  status: 'defaulted-read-failed',
  writeAllowed: false,
  removedMonitorWindowState: false
});

const readLegacyWelcomePreference = (
  storage: LegacyPreferenceStorage | null
): boolean | undefined => {
  try {
    const value = storage?.getItem(WELCOME_STARTUP_STORAGE_KEY);
    return value === 'true' ? true : value === 'false' ? false : undefined;
  } catch {
    return undefined;
  }
};

const removeLegacyWelcomePreference = (storage: LegacyPreferenceStorage | null): void => {
  try {
    storage?.removeItem(WELCOME_STARTUP_STORAGE_KEY);
  } catch {
    // A blocked legacy cache must not turn a successful native migration into a startup failure.
  }
};

const cloneState = (state: ApplicationStateV1): ApplicationStateV1 =>
  projectApplicationStateV1(state);

export class TauriApplicationStateStore implements ApplicationStateStore {
  private loaded: Promise<ApplicationStateLoadResult> | undefined;
  private writes: Promise<void> = Promise.resolve();

  constructor(
    private readonly client: Pick<
      TauriHostClient,
      | 'applicationStateLoad'
      | 'applicationStateSave'
      | 'applicationStateReset'
      | 'applicationStateClearComponent'
    >,
    private readonly legacyStorage: LegacyPreferenceStorage | null = getLocalStorage()
  ) {}

  load(): Promise<ApplicationStateLoadResult> {
    this.loaded ??= this.loadAndMigrate();
    return this.loaded;
  }

  async save(state: ApplicationStateV1): Promise<ApplicationStateV1> {
    return this.enqueue(async () => {
      const saved = await this.client.applicationStateSave({
        state: projectApplicationStateV1(state)
      });
      this.loaded = Promise.resolve({
        state: saved,
        status: 'loaded',
        writeAllowed: true,
        removedMonitorWindowState: false
      });
      return saved;
    });
  }

  async reset(): Promise<ApplicationStateV1> {
    return this.enqueue(async () => {
      const state = await this.client.applicationStateReset();
      this.loaded = Promise.resolve({
        state,
        status: 'loaded',
        writeAllowed: true,
        removedMonitorWindowState: false
      });
      return state;
    });
  }

  async clear(component: ApplicationStateComponent): Promise<ApplicationStateV1> {
    return this.enqueue(async () => {
      const state = await this.client.applicationStateClearComponent({ component });
      this.loaded = Promise.resolve({
        state,
        status: 'loaded',
        writeAllowed: true,
        removedMonitorWindowState: false
      });
      return state;
    });
  }

  private async loadAndMigrate(): Promise<ApplicationStateLoadResult> {
    let result: ApplicationStateLoadResult;
    try {
      result = await this.client.applicationStateLoad();
    } catch {
      return defaultLoadResult();
    }

    const legacyWelcomePreference = readLegacyWelcomePreference(this.legacyStorage);
    if (legacyWelcomePreference === undefined || !result.writeAllowed) {
      return result;
    }

    const migratedState = projectApplicationStateV1({
      ...result.state,
      onboarding: {
        ...result.state.onboarding,
        showWelcomeOnLaunch: legacyWelcomePreference
      }
    });
    try {
      const state = await this.client.applicationStateSave({ state: migratedState });
      removeLegacyWelcomePreference(this.legacyStorage);
      return { ...result, state };
    } catch {
      return result;
    }
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.writes.then(operation, operation);
    this.writes = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }
}

export interface MemoryApplicationStateStoreOptions {
  initialState?: ApplicationStateV1;
  failReads?: boolean;
}

export class MemoryApplicationStateStore implements ApplicationStateStore {
  private state: ApplicationStateV1 | undefined;

  constructor(private readonly options: MemoryApplicationStateStoreOptions = {}) {
    this.state = options.initialState ? cloneState(options.initialState) : undefined;
  }

  async load(): Promise<ApplicationStateLoadResult> {
    if (this.options.failReads) {
      return defaultLoadResult();
    }
    return {
      state: this.state ? cloneState(this.state) : defaultApplicationStateV1(),
      status: this.state ? 'loaded' : 'defaulted-absent',
      writeAllowed: true,
      removedMonitorWindowState: false
    };
  }

  async save(state: ApplicationStateV1): Promise<ApplicationStateV1> {
    if (this.options.failReads) {
      throw new Error('application-state-read-before-write-failed');
    }
    this.state = cloneState(state);
    return cloneState(this.state);
  }

  async reset(): Promise<ApplicationStateV1> {
    this.state = defaultApplicationStateV1();
    return cloneState(this.state);
  }

  async clear(component: ApplicationStateComponent): Promise<ApplicationStateV1> {
    if (this.options.failReads) {
      throw new Error('application-state-read-before-clear-failed');
    }
    const current = this.state ? cloneState(this.state) : defaultApplicationStateV1();
    const defaults = defaultApplicationStateV1();
    switch (component) {
      case 'settings':
        current.settings = defaults.settings;
        break;
      case 'onboarding':
        current.onboarding = defaults.onboarding;
        break;
      case 'favorites':
        current.favorites = defaults.favorites;
        break;
      case 'window-state':
        current.windowState = defaults.windowState;
        break;
      case 'safe-session':
        current.safeSession = defaults.safeSession;
        break;
      case 'diagnostic-preferences':
        current.diagnosticPreferences = defaults.diagnosticPreferences;
        break;
    }
    this.state = cloneState(current);
    return cloneState(this.state);
  }

  snapshot(): ApplicationStateV1 | undefined {
    return this.state ? cloneState(this.state) : undefined;
  }
}

const getLocalStorage = (): Storage | null => {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
};

let applicationStateStore: ApplicationStateStore = new MemoryApplicationStateStore();

export const configureApplicationStateStore = (store: ApplicationStateStore): void => {
  applicationStateStore = store;
};

export const getApplicationStateStore = (): ApplicationStateStore => applicationStateStore;
