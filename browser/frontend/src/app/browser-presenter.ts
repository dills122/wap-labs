import type { FetchResponse, HostSessionState } from '../../../contracts/transport';
import type {
  EngineRuntimeSnapshot,
  RenderList,
  ScriptDialogRequestSnapshot
} from '../../../contracts/engine';
import {
  appendTimelineEntry,
  buildTimelineExport as buildTimelineExportPayload,
  clearTimelineState,
  createTimelineState,
  type TimelineExportPayload,
  type TimelineEntry,
  validateTimelineExport
} from './timeline';
import type { BrowserShellRefs } from './browser-shell-template';
import { inferStatusTone, uiEvents } from '../ui-helpers';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';
import { renderWmlViewportHtml } from '../components/primitives/wml-render-primitives';

export type BootPhase = 'booting' | 'shell-ready' | 'engine-ready' | 'deck-ready';

export class BrowserPresenter {
  private readonly refs: BrowserShellRefs;

  private readonly maxTimelineEvents: number;

  private hostSessionState: HostSessionState;

  private timelineState = createTimelineState();

  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private toastShowing = false;
  private toastQueue: Array<{ message: string; tone: 'error' | 'ok'; ttlMs: number }> = [];
  private hasRenderedContent = false;
  private announcedDialogRequests: readonly ScriptDialogRequestSnapshot[] = [];
  private latestSnapshot: EngineRuntimeSnapshot | null = null;
  private latestTransportResponse: FetchResponse | null = null;
  private sessionStateText = '';
  private timelineText = '';
  private snapshotText = '';
  private transportResponseText = '';
  private sessionStateDirty = true;
  private timelineDirty = true;
  private snapshotDirty = true;
  private transportResponseDirty = true;

  constructor(refs: BrowserShellRefs, initialSession: HostSessionState, maxTimelineEvents: number) {
    this.refs = refs;
    this.maxTimelineEvents = maxTimelineEvents;
    this.hostSessionState = initialSession;
    this.refs.devDrawerEl.addEventListener('toggle', () => {
      this.flushDeveloperPanels();
    });
  }

  getSessionState(): HostSessionState {
    return { ...this.hostSessionState };
  }

  setSessionState(next: HostSessionState): void {
    this.hostSessionState = next;
    this.sessionStateDirty = true;
    this.flushDeveloperPanels();
    const shownUrl =
      this.hostSessionState.finalUrl ?? this.hostSessionState.requestedUrl ?? WAVES_COPY.shell.idle;
    this.refs.activeUrlLabelEl.textContent = shownUrl;
  }

  patchSessionState(patch: Partial<HostSessionState>): void {
    this.setSessionState({
      ...this.hostSessionState,
      ...patch
    });
    this.recordTimeline('session-state', 'state', { patch });
  }

  clearTimeline(): void {
    this.timelineState = clearTimelineState();
    this.timelineDirty = true;
    this.flushDeveloperPanels();
  }

  recordTimeline(
    action: string,
    phase: TimelineEntry['phase'],
    details?: Record<string, unknown>
  ): void {
    this.timelineState = appendTimelineEntry(
      this.timelineState,
      this.maxTimelineEvents,
      action,
      phase,
      this.getSessionState(),
      details
    );
    uiEvents.emit('timeline', { action, phase });
    this.timelineDirty = true;
    this.flushDeveloperPanels();
  }

  setStatus(message: string): void {
    const tone = inferStatusTone(message);
    this.refs.statusEl.setStatus(message, tone);
    uiEvents.emit('status', { message, tone });
  }

  setBootPhase(phase: BootPhase): void {
    document.body.setAttribute('data-boot-phase', phase);
    this.recordTimeline('boot-phase', 'state', { phase });
  }

  hasRenderedDeck(): boolean {
    return this.hasRenderedContent;
  }

  setViewportSkeleton(visible: boolean): void {
    if (visible) {
      this.refs.viewportEl.classList.add('viewport-skeleton');
      this.refs.viewportEl.setAttribute('aria-busy', 'true');
      if (!this.hasRenderedContent) {
        this.refs.viewportEl.innerHTML = `
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line-wide"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line-short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line-wide"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-hint">${escapeHtml(WAVES_COPY.shell.firstRenderPending)}</div>
        `;
      }
      return;
    }

    this.refs.viewportEl.classList.remove('viewport-skeleton');
    this.refs.viewportEl.setAttribute('aria-busy', 'false');
    if (!this.hasRenderedContent) {
      // Nothing has ever successfully rendered yet, so the viewport still
      // contains the injected skeleton placeholder markup (shimmering bars +
      // "waiting for first render" hint). Removing just the CSS class above
      // does not stop that markup from sitting there indefinitely if the
      // load that was supposed to replace it instead failed. Clear it so a
      // failed first load doesn't leave a frozen "still loading" viewport
      // behind the real error, which is surfaced via status/toast instead.
      this.refs.viewportEl.innerHTML = '';
    }
  }

  showToast(
    message: string,
    tone: 'error' | 'ok' = 'error',
    ttlMs: number = WAVES_CONFIG.toastTtlMs
  ): void {
    if (this.toastShowing) {
      this.toastQueue.push({ message, tone, ttlMs });
      return;
    }
    this.presentToast(message, tone, ttlMs);
  }

  private presentToast(message: string, tone: 'error' | 'ok', ttlMs: number): void {
    this.toastShowing = true;
    this.refs.toastEl.textContent = message;
    this.refs.toastEl.className = `toast toast-${tone}`;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.dismissToastAndShowNext();
    }, ttlMs);
  }

  private dismissToastAndShowNext(): void {
    this.refs.toastEl.className = 'toast toast-hidden';
    this.toastShowing = false;
    this.toastTimer = undefined;
    const next = this.toastQueue.shift();
    if (next) {
      this.presentToast(next.message, next.tone, next.ttlMs);
    }
  }

  setSnapshot(snapshot: EngineRuntimeSnapshot): void {
    this.latestSnapshot = snapshot;
    this.snapshotDirty = true;
    this.flushDeveloperPanels();
    this.announceScriptDialogRequests(snapshot.lastScriptDialogRequests);
  }

  getSnapshot(): EngineRuntimeSnapshot | null {
    return this.latestSnapshot ? { ...this.latestSnapshot } : null;
  }

  setTransportResponse(response: FetchResponse | null): void {
    this.latestTransportResponse = response;
    this.transportResponseDirty = true;
    this.flushDeveloperPanels();
  }

  drawRenderList(renderList: RenderList): void {
    this.hasRenderedContent = true;
    this.setViewportSkeleton(false);
    this.refs.viewportEl.innerHTML = renderWmlViewportHtml(renderList);
  }

  exportTimeline(): void {
    const payload: TimelineExportPayload = buildTimelineExportPayload(
      this.timelineState.entries,
      this.getSessionState()
    );
    validateTimelineExport(payload);
    const blob = new Blob([JSON.stringify(payload, null, WAVES_CONFIG.timelineExportJsonIndent)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = WAVES_CONFIG.timelineExportFilename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  timelineLength(): number {
    return this.timelineState.entries.length;
  }

  private flushDeveloperPanels(): void {
    if (!this.refs.devDrawerEl.open) {
      return;
    }
    if (this.sessionStateDirty) {
      this.sessionStateText = this.writeTextIfChanged(
        this.refs.sessionStateEl,
        this.sessionStateText,
        JSON.stringify(this.hostSessionState, null, 2)
      );
      this.sessionStateDirty = false;
    }
    if (this.timelineDirty) {
      this.timelineText = this.writeTextIfChanged(
        this.refs.timelineEl,
        this.timelineText,
        JSON.stringify(this.timelineState.entries, null, 2)
      );
      this.timelineDirty = false;
    }
    if (this.snapshotDirty) {
      this.snapshotText = this.writeTextIfChanged(
        this.refs.snapshotEl,
        this.snapshotText,
        this.latestSnapshot ? JSON.stringify(this.latestSnapshot, null, 2) : ''
      );
      this.snapshotDirty = false;
    }
    if (this.transportResponseDirty) {
      this.transportResponseText = this.writeTextIfChanged(
        this.refs.transportResponseEl,
        this.transportResponseText,
        this.latestTransportResponse ? JSON.stringify(this.latestTransportResponse, null, 2) : ''
      );
      this.transportResponseDirty = false;
    }
  }

  // Waves' WMLScript runtime resolves confirm()/prompt()/alert() calls to a
  // deterministic default (see engine-wasm/engine/src/wavescript/stdlib/dialogs.rs)
  // rather than blocking for real interactive input - there is no modal to show.
  // The frontend previously only used `lastScriptDialogRequests` for
  // change-detection and never surfaced it, so a script-triggered dialog was
  // invisible. Announce it via toast instead of building an interactive
  // dialog subsystem, which would be scope creep beyond this deterministic MVP.
  private announceScriptDialogRequests(requests: readonly ScriptDialogRequestSnapshot[]): void {
    if (requests.length === 0) {
      this.announcedDialogRequests = requests;
      return;
    }
    if (dialogRequestListsEqual(requests, this.announcedDialogRequests)) {
      return;
    }
    this.announcedDialogRequests = requests;
    for (const request of requests) {
      this.showToast(describeScriptDialogRequest(request), 'ok');
    }
  }

  private writeTextIfChanged<T extends HTMLElement>(
    element: T,
    currentText: string,
    nextText: string
  ): string {
    if (currentText === nextText) {
      return currentText;
    }
    element.textContent = nextText;
    return nextText;
  }
}

const escapeHtml = (input: string): string =>
  input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const dialogRequestListsEqual = (
  a: readonly ScriptDialogRequestSnapshot[],
  b: readonly ScriptDialogRequestSnapshot[]
): boolean => {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((request, index) => {
    const other = b[index];
    return (
      other !== undefined &&
      request.type === other.type &&
      request.message === other.message &&
      ('defaultValue' in request ? request.defaultValue : undefined) ===
        ('defaultValue' in other ? other.defaultValue : undefined)
    );
  });
};

// Mirrors the engine's deterministic dialog resolution
// (engine-wasm/engine/src/wavescript/stdlib/dialogs.rs): confirm() always
// resolves to false/Cancel and prompt() always resolves to its declared
// default value (or empty string). Describing the resolved value here keeps
// the announcement accurate without the engine needing to round-trip it.
const describeScriptDialogRequest = (request: ScriptDialogRequestSnapshot): string => {
  if (request.type === 'alert') {
    return WAVES_COPY.status.scriptDialogAlert(request.message);
  }
  if (request.type === 'confirm') {
    return WAVES_COPY.status.scriptDialogConfirm(request.message);
  }
  return WAVES_COPY.status.scriptDialogPrompt(request.message, request.defaultValue ?? '');
};
