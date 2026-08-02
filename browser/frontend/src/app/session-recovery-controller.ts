import type {
  ApplicationStateLoadStatus,
  ApplicationStateV1,
  SafeSessionV1
} from '../../../contracts/application-state';
import { getApplicationStateStore, type ApplicationStateStore } from './application-state-store';
import { WAVES_COPY } from './waves-copy';

export const RECOVERY_OFFER_DEADLINE_MS = 2_000;

type RecoveryReason = 'crash' | 'launch';
type LatestCommit = { kind: 'safe'; session: SafeSessionV1 } | { kind: 'unsafe' };

interface RecoveryCandidate {
  reason: RecoveryReason;
  session: SafeSessionV1;
}

export interface SessionRecoveryControllerOptions {
  store?: ApplicationStateStore;
  document?: Document;
  shellAppearedAt: number;
  now?: () => number;
  restoreSession: (session: SafeSessionV1) => Promise<void>;
  notify: (message: string) => void;
}

const required = <T extends Element>(document: Document, selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing session recovery element: ${selector}`);
  return element;
};

const persistedKey = (commit: LatestCommit): string =>
  JSON.stringify(
    commit.kind === 'safe'
      ? { recoveryPending: true, session: commit.session }
      : { recoveryPending: false }
  );

const loadStatusNeedsNotice = (status: ApplicationStateLoadStatus): boolean =>
  status === 'defaulted-corrupt' || status === 'defaulted-read-failed';

export class SessionRecoveryController {
  private readonly store: ApplicationStateStore;
  private readonly document: Document;
  private readonly now: () => number;
  private readonly panel: HTMLElement;
  private readonly message: HTMLElement;
  private readonly actions: HTMLElement;
  private readonly restoreButton: HTMLButtonElement;
  private readonly dismissButton: HTMLButtonElement;
  private candidate: RecoveryCandidate | undefined;
  private latestCommit: LatestCommit | undefined;
  private lastPersistedKey: string | undefined;
  private persistence: Promise<void> = Promise.resolve();
  private prepared = false;
  private disposed = false;

  constructor(private readonly options: SessionRecoveryControllerOptions) {
    this.store = options.store ?? getApplicationStateStore();
    this.document = options.document ?? document;
    this.now = options.now ?? (() => performance.now());
    this.panel = required(this.document, '#session-recovery');
    this.message = required(this.document, '#session-recovery-message');
    this.actions = required(this.document, '#session-recovery-actions');
    this.restoreButton = required(this.document, '#btn-session-recovery-restore');
    this.dismissButton = required(this.document, '#btn-session-recovery-dismiss');
    this.restoreButton.addEventListener('click', this.handleRestore);
    this.dismissButton.addEventListener('click', this.handleDismiss);
  }

  async prepare(): Promise<void> {
    const loaded = await this.store.load();
    if (this.disposed) return;
    this.prepared = true;
    const storedSession = loaded.state.safeSession.session;
    if (storedSession) {
      this.lastPersistedKey = JSON.stringify(loaded.state.safeSession);
    }

    if (loadStatusNeedsNotice(loaded.status)) {
      this.options.notify(WAVES_COPY.recovery.stateReset);
    } else if (loaded.status === 'defaulted-future-version') {
      this.options.notify(WAVES_COPY.recovery.futureState);
    }

    const reason: RecoveryReason | undefined = loaded.state.safeSession.recoveryPending
      ? 'crash'
      : shouldRestoreOnOrdinaryLaunch(loaded.state)
        ? 'launch'
        : undefined;
    if (reason && storedSession) {
      this.candidate = { reason, session: storedSession };
      this.showCandidate(this.candidate);
      return;
    }
    await this.persistLatest();
  }

  async activate(): Promise<void> {
    if (this.candidate?.session.kind === 'local-example') {
      await this.restoreCandidate(true);
    }
  }

  commitSafeSession(session: SafeSessionV1): Promise<void> {
    this.latestCommit = { kind: 'safe', session };
    return this.candidate || !this.prepared ? Promise.resolve() : this.persistLatest();
  }

  commitUnsafeSession(): Promise<void> {
    this.latestCommit = { kind: 'unsafe' };
    return this.candidate || !this.prepared ? Promise.resolve() : this.persistLatest();
  }

  settled(): Promise<void> {
    return this.persistence;
  }

  dispose(): void {
    this.disposed = true;
    this.restoreButton.removeEventListener('click', this.handleRestore);
    this.dismissButton.removeEventListener('click', this.handleDismiss);
  }

  private showCandidate(candidate: RecoveryCandidate): void {
    const local = candidate.session.kind === 'local-example';
    this.panel.hidden = false;
    this.panel.dataset.recoveryState = local ? 'restoring' : 'offered';
    this.panel.dataset.recoveryReason = candidate.reason;
    this.panel.dataset.offerWithinDeadline = String(
      this.now() - this.options.shellAppearedAt <= RECOVERY_OFFER_DEADLINE_MS
    );
    this.actions.hidden = local;
    this.message.textContent =
      candidate.reason === 'crash'
        ? local
          ? WAVES_COPY.recovery.crashLocal
          : WAVES_COPY.recovery.crashNetwork
        : local
          ? WAVES_COPY.recovery.launchLocal
          : WAVES_COPY.recovery.launchNetwork;
    this.options.notify(this.message.textContent);
  }

  private readonly handleRestore = (): void => {
    void this.restoreCandidate(false);
  };

  private readonly handleDismiss = (): void => {
    void this.dismissCandidate();
  };

  private async restoreCandidate(automaticLocal: boolean): Promise<void> {
    const candidate = this.candidate;
    if (!candidate || this.disposed) return;
    this.panel.dataset.recoveryState = 'restoring';
    this.restoreButton.disabled = true;
    this.dismissButton.disabled = true;
    try {
      this.latestCommit = undefined;
      await this.options.restoreSession(candidate.session);
      this.latestCommit ??= { kind: 'safe', session: candidate.session };
      this.candidate = undefined;
      await this.persistLatest();
      this.hide();
      this.options.notify(WAVES_COPY.recovery.restored);
    } catch {
      if (automaticLocal) {
        this.candidate = undefined;
        await this.persistLatest();
        this.hide();
      } else {
        this.panel.dataset.recoveryState = 'offered';
        this.restoreButton.disabled = false;
        this.dismissButton.disabled = false;
      }
      this.options.notify(WAVES_COPY.recovery.failed);
    }
  }

  private async dismissCandidate(): Promise<void> {
    if (!this.candidate || this.disposed) return;
    this.candidate = undefined;
    await this.persistLatest();
    this.hide();
    this.options.notify(WAVES_COPY.recovery.dismissed);
  }

  private hide(): void {
    this.panel.hidden = true;
    this.panel.dataset.recoveryState = 'idle';
    this.actions.hidden = false;
    this.restoreButton.disabled = false;
    this.dismissButton.disabled = false;
  }

  private persistLatest(): Promise<void> {
    const commit = this.latestCommit;
    if (!commit || this.disposed) return this.persistence;
    const key = persistedKey(commit);
    if (key === this.lastPersistedKey) return this.persistence;
    this.persistence = this.persistence.then(async () => {
      if (this.disposed || key === this.lastPersistedKey) return;
      try {
        const saved = await this.store.update((current) => ({
          ...current,
          safeSession:
            commit.kind === 'safe'
              ? { recoveryPending: true, session: commit.session }
              : { recoveryPending: false }
        }));
        this.lastPersistedKey = JSON.stringify(saved.safeSession);
        if (commit.kind === 'safe' && !saved.safeSession.session) {
          this.latestCommit = { kind: 'unsafe' };
        }
      } catch {
        // A failed atomic write leaves the previous committed artifact intact. Browsing continues.
      }
    });
    return this.persistence;
  }
}

const shouldRestoreOnOrdinaryLaunch = (state: ApplicationStateV1): boolean =>
  state.settings.safeSessionRestore && state.settings.startBehavior === 'safe-session';
