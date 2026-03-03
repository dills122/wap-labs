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
import { WAVES_COPY } from './waves-copy';

export class BrowserPresenter {
  private readonly refs: BrowserShellRefs;

  private readonly maxTimelineEvents: number;

  private hostSessionState: HostSessionState;

  private timelineState = createTimelineState();

  private toastTimer: ReturnType<typeof setTimeout> | undefined;

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

  showToast(message: string, tone: 'error' | 'ok' = 'error', ttlMs = 6000): void {
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
    const byLine = new Map<number, string[]>();
    for (const cmd of renderList.draw) {
      const current = byLine.get(cmd.y) ?? [];
      if (cmd.type === 'text') {
        current.push(cmd.text);
      } else {
        current.push(cmd.focused ? `[${cmd.text}]` : cmd.text);
      }
      byLine.set(cmd.y, current);
    }

    const lines = Array.from(byLine.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, chunks]) => chunks.join(' '));

    this.refs.viewportEl.innerHTML = lines
      .map((line) => `<div class="line">${escapeHtml(line)}</div>`)
      .join('');
  }

  exportTimeline(): void {
    const payload: TimelineExportPayload = buildTimelineExportPayload(
      this.timelineState.entries,
      this.getSessionState()
    );
    validateTimelineExport(payload);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'waves-event-timeline.json';
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
