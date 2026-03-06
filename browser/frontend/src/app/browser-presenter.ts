import type { FetchResponse, HostSessionState } from '../../../contracts/transport';
import type { EngineRuntimeSnapshot, RenderList } from '../../../contracts/engine';
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
  private hasRenderedContent = false;

  constructor(refs: BrowserShellRefs, initialSession: HostSessionState, maxTimelineEvents: number) {
    this.refs = refs;
    this.maxTimelineEvents = maxTimelineEvents;
    this.hostSessionState = initialSession;
  }

  getSessionState(): HostSessionState {
    return { ...this.hostSessionState };
  }

  setSessionState(next: HostSessionState): void {
    this.hostSessionState = next;
    this.refs.sessionStateEl.textContent = JSON.stringify(this.hostSessionState, null, 2);
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
    this.refs.timelineEl.textContent = JSON.stringify(this.timelineState.entries, null, 2);
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
    this.refs.timelineEl.textContent = JSON.stringify(this.timelineState.entries, null, 2);
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
  }

  showToast(
    message: string,
    tone: 'error' | 'ok' = 'error',
    ttlMs = WAVES_CONFIG.toastTtlMs
  ): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.refs.toastEl.textContent = message;
    this.refs.toastEl.className = `toast toast-${tone}`;
    this.toastTimer = setTimeout(() => {
      this.refs.toastEl.className = 'toast toast-hidden';
    }, ttlMs);
  }

  setSnapshot(snapshot: EngineRuntimeSnapshot): void {
    this.refs.snapshotEl.textContent = JSON.stringify(snapshot, null, 2);
  }

  setTransportResponse(response: FetchResponse | null): void {
    this.refs.transportResponseEl.textContent = response ? JSON.stringify(response, null, 2) : '';
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
}

const escapeHtml = (input: string): string =>
  input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
