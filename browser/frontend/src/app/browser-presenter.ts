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

const REPEAT_NAV_HINT_CLASS = 'viewport-navigation-hint';

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
  private announcedScriptFailure: {
    trap: string | undefined;
    errorClass: string | undefined;
    errorCategory: string | undefined;
  } | null = null;
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
  private navigationProgressTimer: ReturnType<typeof setTimeout> | undefined;
  // U7: flushDeveloperPanels() re-serializes whichever dev-panel sub-object
  // is dirty via JSON.stringify(..., null, 2). Each mutating setter used to
  // call it immediately and synchronously, so a burst of same-tick mutations
  // (e.g. patchSessionState's setSessionState + recordTimeline, or several
  // recordTimeline calls in a row while stepping through a navigation) paid
  // for a full flush pass per call instead of once for the batch. Mutating
  // setters now call scheduleDeveloperPanelFlush() instead, which coalesces
  // same-tick mutations into a single microtask-deferred flush. The
  // dev-drawer 'toggle' handler still flushes immediately (see below) so
  // opening the drawer shows current state synchronously rather than a tick
  // late.
  private flushScheduled = false;
  private readonly handleDevDrawerToggle = (): void => {
    this.flushDeveloperPanels();
  };

  constructor(refs: BrowserShellRefs, initialSession: HostSessionState, maxTimelineEvents: number) {
    this.refs = refs;
    this.maxTimelineEvents = maxTimelineEvents;
    this.hostSessionState = initialSession;
    this.refs.devDrawerEl.addEventListener('toggle', this.handleDevDrawerToggle);
  }

  // U6: mirrors the listener registered in the constructor so BrowserController
  // (which owns this presenter) has a symmetric teardown to call from its own
  // dispose(). Currently harmless because mountBrowserShell replaces #app's
  // innerHTML wholesale on every bootstrap/HMR cycle (dropping the old
  // listener with the old DOM), but the class should not rely on that.
  dispose(): void {
    this.refs.devDrawerEl.removeEventListener('toggle', this.handleDevDrawerToggle);
    if (this.navigationProgressTimer) {
      clearTimeout(this.navigationProgressTimer);
      this.navigationProgressTimer = undefined;
    }
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = undefined;
    }
  }

  getSessionState(): HostSessionState {
    return { ...this.hostSessionState };
  }

  setSessionState(next: HostSessionState): void {
    this.hostSessionState = next;
    this.sessionStateDirty = true;
    this.scheduleDeveloperPanelFlush();
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
    this.scheduleDeveloperPanelFlush();
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
    this.scheduleDeveloperPanelFlush();
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
      } else {
        // A repeat navigation (link click, reload, back/forward, external
        // intent) -- content is already on screen, so don't wipe it. Append a
        // small non-destructive hint reusing the existing skeleton-hint style
        // instead of building a separate progress affordance (see U1).
        this.showRepeatNavigationHint();
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
    } else {
      this.hideRepeatNavigationHint();
    }
  }

  // U1: shows a lightweight in-progress indicator for any navigation beyond
  // the very first deck render, gated behind a short delay so instant
  // local-mode loads never flash it. The very first render keeps its
  // existing immediate, full-skeleton behavior. Returns a callback the
  // caller must invoke (typically from a `finally`) once the navigation
  // settles, which cancels the pending delay or clears the indicator if it
  // already appeared. Callers are expected to run one navigation at a time
  // (already true for every current call site), so this does not attempt to
  // coordinate overlapping in-flight calls.
  beginNavigationProgress(delayMs: number = WAVES_CONFIG.navigationProgressDelayMs): () => void {
    if (!this.hasRenderedContent) {
      this.setViewportSkeleton(true);
      return () => {
        this.setViewportSkeleton(false);
      };
    }

    if (this.navigationProgressTimer) {
      clearTimeout(this.navigationProgressTimer);
      this.navigationProgressTimer = undefined;
    }
    let fired = false;
    this.navigationProgressTimer = setTimeout(() => {
      this.navigationProgressTimer = undefined;
      fired = true;
      this.setViewportSkeleton(true);
    }, delayMs);

    return () => {
      if (this.navigationProgressTimer) {
        clearTimeout(this.navigationProgressTimer);
        this.navigationProgressTimer = undefined;
      }
      if (fired) {
        this.setViewportSkeleton(false);
      }
    };
  }

  private showRepeatNavigationHint(): void {
    if (this.refs.viewportEl.querySelector(`.${REPEAT_NAV_HINT_CLASS}`)) {
      return;
    }
    const hint = document.createElement('div');
    hint.className = `skeleton-hint ${REPEAT_NAV_HINT_CLASS}`;
    hint.textContent = WAVES_COPY.shell.navigationPending;
    this.refs.viewportEl.append(hint);
  }

  private hideRepeatNavigationHint(): void {
    this.refs.viewportEl.querySelector(`.${REPEAT_NAV_HINT_CLASS}`)?.remove();
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
    this.scheduleDeveloperPanelFlush();
    this.announceScriptDialogRequests(snapshot.lastScriptDialogRequests);
    this.announceScriptExecutionFailure(snapshot);
  }

  getSnapshot(): EngineRuntimeSnapshot | null {
    return this.latestSnapshot ? { ...this.latestSnapshot } : null;
  }

  setTransportResponse(response: FetchResponse | null): void {
    this.latestTransportResponse = response;
    this.transportResponseDirty = true;
    this.scheduleDeveloperPanelFlush();
  }

  drawRenderList(renderList: RenderList): void {
    this.hasRenderedContent = true;
    // Real content just landed -- cancel any pending delayed in-progress
    // indicator so it can't appear after the fact (see beginNavigationProgress).
    if (this.navigationProgressTimer) {
      clearTimeout(this.navigationProgressTimer);
      this.navigationProgressTimer = undefined;
    }
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

  // U7: coalesces same-tick mutations (e.g. patchSessionState's
  // setSessionState + recordTimeline pair, or several recordTimeline calls
  // made back-to-back while stepping through a navigation) into a single
  // flush instead of one full JSON.stringify pass per mutating call.
  // flushDeveloperPanels() itself is unchanged -- it still only stringifies
  // whichever specific sub-object is dirty, and still no-ops entirely while
  // the drawer is closed.
  private scheduleDeveloperPanelFlush(): void {
    if (this.flushScheduled) {
      return;
    }
    this.flushScheduled = true;
    queueMicrotask(() => {
      this.flushScheduled = false;
      this.flushDeveloperPanels();
    });
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

  // U2: the engine already classifies script failures via lastScriptExecutionOk
  // / lastScriptExecutionTrap / lastScriptExecutionErrorClass /
  // lastScriptExecutionErrorCategory (see EngineRuntimeSnapshot in
  // navigation-state.ts), but until now the frontend only read those fields
  // for render change-detection and never surfaced them -- so a WMLScript
  // fatal trap produced no visible message distinct from a normal action.
  // `lastScriptExecutionOk` is sticky on the engine side (it reflects the
  // *last* script that ran, not "this render"), so track what was already
  // announced and only toast again when the trap actually changes -- the same
  // dedup shape as announceScriptDialogRequests above.
  private announceScriptExecutionFailure(snapshot: EngineRuntimeSnapshot): void {
    if (snapshot.lastScriptExecutionOk !== false) {
      return;
    }
    const current = {
      trap: snapshot.lastScriptExecutionTrap,
      errorClass: snapshot.lastScriptExecutionErrorClass,
      errorCategory: snapshot.lastScriptExecutionErrorCategory
    };
    if (
      this.announcedScriptFailure &&
      this.announcedScriptFailure.trap === current.trap &&
      this.announcedScriptFailure.errorClass === current.errorClass &&
      this.announcedScriptFailure.errorCategory === current.errorCategory
    ) {
      return;
    }
    this.announcedScriptFailure = current;
    const categoryLabel = describeScriptErrorCategory(current.errorCategory);
    const message = current.trap ?? WAVES_COPY.errors.unknownTransportFailure;
    this.showToast(WAVES_COPY.status.scriptExecutionFailed(categoryLabel, message), 'error');
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

// Mirrors the engine's ScriptErrorCategoryLiteral taxonomy
// (engine-wasm/engine/src/engine_script_types.rs) into user-facing wording.
const SCRIPT_ERROR_CATEGORY_LABELS: Record<string, string> = {
  computational: 'computation error',
  integrity: 'data integrity error',
  resource: 'resource limit error',
  'host-binding': 'host binding error'
};

const describeScriptErrorCategory = (category: string | undefined): string =>
  (category && SCRIPT_ERROR_CATEGORY_LABELS[category]) || 'script error';

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
