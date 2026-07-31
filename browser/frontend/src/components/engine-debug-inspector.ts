import { ENGINE_DEBUG_CONSUMER_LIMITS } from '../app/engine-debug-capture';
import type {
  EngineDebugInspectorAction,
  EngineDebugInspectorSurface
} from '../app/engine-debug-session-controller';
import {
  ENGINE_DEBUG_EVENT_GROUPS,
  type EngineDebugInspectorViewModel
} from '../app/engine-debug-view-model';
import { WAVES_COPY } from '../app/waves-copy';

const COPY = WAVES_COPY.inspector;

const options = ENGINE_DEBUG_EVENT_GROUPS.map(
  ({ value, label }) => `<option value="${value}">${label}</option>`
).join('');

export const engineDebugInspectorTemplate = (): string => `
  <div class="engine-debug-inspector" data-engine-debug-inspector>
    <div class="developer-tools-panel-heading engine-debug-heading">
      <div>
        <h3>${COPY.title}</h3>
        <p>${COPY.description}</p>
      </div>
      <div class="developer-tools-inline-actions">
        <button id="btn-engine-debug-start" class="btn developer-tools-action primary" type="button">
          ${COPY.start}
        </button>
        <button id="btn-engine-debug-stop" class="btn developer-tools-action" type="button" disabled>
          ${COPY.stop}
        </button>
      </div>
    </div>

    <section class="engine-debug-policy" aria-labelledby="engine-debug-policy-title">
      <div>
        <span id="engine-debug-policy-title">${COPY.hostPolicy}</span>
        <strong data-engine-debug-value="policy">${COPY.disabledByDefault}</strong>
      </div>
      <div>
        <span>${COPY.session}</span>
        <strong data-engine-debug-value="status">${COPY.off}</strong>
      </div>
      <p data-engine-debug-value="detail">
        ${COPY.defaultDisabledDetail}
      </p>
    </section>

    <div class="engine-debug-toolbar" aria-label="${COPY.captureControls}">
      <label class="developer-tools-field engine-debug-filter" for="engine-debug-group">
        <span>${COPY.eventGroup}</span>
        <select id="engine-debug-group" class="host-control">${options}</select>
      </label>
      <label class="developer-tools-field engine-debug-filter" for="engine-debug-query">
        <span>${COPY.filter}</span>
        <input
          id="engine-debug-query"
          class="host-control"
          type="search"
          maxlength="${ENGINE_DEBUG_CONSUMER_LIMITS.filterQueryLength}"
          autocomplete="off"
          placeholder="${COPY.filterPlaceholder}"
        />
      </label>
      <div class="developer-tools-inline-actions engine-debug-capture-actions">
        <button id="btn-engine-debug-snapshot" class="btn developer-tools-action" type="button" disabled>
          ${COPY.refreshSnapshot}
        </button>
        <button id="btn-engine-debug-export" class="btn developer-tools-action" type="button" disabled>
          ${COPY.exportCapture}
        </button>
      </div>
    </div>

    <output
      class="engine-debug-live-status"
      data-engine-debug-value="live"
    >${COPY.inspectorOff}</output>

    <div class="engine-debug-accounting" aria-label="${COPY.accounting}">
      <span data-engine-debug-value="capacity">0/${ENGINE_DEBUG_CONSUMER_LIMITS.retainedEvents} retained</span>
      <span data-engine-debug-value="matches">0 ${COPY.matching}</span>
      <span data-engine-debug-value="producer-drops">0 ${COPY.producerGaps}</span>
      <span data-engine-debug-value="frontend-drops">0 ${COPY.frontendDrops}</span>
    </div>

    <section class="engine-debug-events" aria-labelledby="engine-debug-events-title">
      <div class="developer-tools-panel-heading">
        <div>
          <h3 id="engine-debug-events-title">${COPY.eventStream}</h3>
          <p>${COPY.eventDescription}</p>
        </div>
      </div>
      <ol class="engine-debug-event-list" data-engine-debug-events aria-label="${COPY.engineDebugEvents}">
        <li class="engine-debug-empty">${COPY.noEvents}</li>
      </ol>
    </section>

    <details class="developer-tools-disclosure engine-debug-snapshot">
      <summary>
        <span>${COPY.boundedSnapshot}</span>
        <span data-engine-debug-value="snapshot-summary">${COPY.noSnapshot}</span>
      </summary>
      <pre data-engine-debug-snapshot tabindex="0"></pre>
    </details>
  </div>
`;

export interface BindEngineDebugInspectorOptions {
  dispatch(action: EngineDebugInspectorAction): void;
}

export interface EngineDebugInspectorBinding {
  render(viewModel: EngineDebugInspectorViewModel): void;
  dispose(): void;
}

const setText = (root: ParentNode, selector: string, value: string): void => {
  const element = root.querySelector<HTMLElement>(selector);
  if (element && element.textContent !== value) element.textContent = value;
};

const inspectorSurface = (root: HTMLElement): EngineDebugInspectorSurface =>
  root.closest<HTMLElement>('[data-developer-tools-surface]')?.dataset.developerToolsSurface ===
  'window'
    ? 'window'
    : 'docked';

export const bindEngineDebugInspector = (
  root: HTMLElement,
  { dispatch }: BindEngineDebugInspectorOptions
): EngineDebugInspectorBinding => {
  const inspector = root.querySelector<HTMLElement>('[data-engine-debug-inspector]');
  const panel = root.querySelector<HTMLElement>('#devtools-panel-inspector');
  const drawer = root
    .closest<HTMLElement>('[data-developer-tools-surface]')
    ?.querySelector<HTMLDetailsElement>('#dev-drawer');
  if (!inspector || !panel) throw new Error('missing engine Inspector workspace');

  const surface = inspectorSurface(root);
  const liveStatus = inspector.querySelector<HTMLOutputElement>('[data-engine-debug-value="live"]');
  if (surface === 'window' && liveStatus) {
    liveStatus.setAttribute('role', 'status');
    liveStatus.setAttribute('aria-live', 'polite');
    liveStatus.setAttribute('aria-atomic', 'true');
  }
  const cleanups: Array<() => void> = [];
  const startButton = inspector.querySelector<HTMLButtonElement>('#btn-engine-debug-start');
  const stopButton = inspector.querySelector<HTMLButtonElement>('#btn-engine-debug-stop');
  const snapshotButton = inspector.querySelector<HTMLButtonElement>('#btn-engine-debug-snapshot');
  const exportButton = inspector.querySelector<HTMLButtonElement>('#btn-engine-debug-export');
  const groupSelect = inspector.querySelector<HTMLSelectElement>('#engine-debug-group');
  const queryInput = inspector.querySelector<HTMLInputElement>('#engine-debug-query');
  const eventList = inspector.querySelector<HTMLOListElement>('[data-engine-debug-events]');

  if (
    !startButton ||
    !stopButton ||
    !snapshotButton ||
    !exportButton ||
    !groupSelect ||
    !queryInput ||
    !eventList
  ) {
    throw new Error('missing engine Inspector controls');
  }

  const listen = <Target extends EventTarget>(
    target: Target,
    type: string,
    listener: EventListener
  ): void => {
    target.addEventListener(type, listener);
    cleanups.push(() => target.removeEventListener(type, listener));
  };

  listen(startButton, 'click', () => dispatch({ type: 'start' }));
  listen(stopButton, 'click', () => dispatch({ type: 'stop' }));
  listen(snapshotButton, 'click', () => dispatch({ type: 'snapshot' }));
  listen(exportButton, 'click', () => dispatch({ type: 'export' }));

  const dispatchFilter = (): void => {
    dispatch({
      type: 'filter',
      group: groupSelect.value as EngineDebugInspectorViewModel['filter']['group'],
      query: queryInput.value
    });
  };
  listen(groupSelect, 'change', dispatchFilter);
  listen(queryInput, 'input', dispatchFilter);

  let lastVisibility: boolean | undefined;
  const reportVisibility = (): void => {
    const visible =
      !panel.hidden &&
      (drawer?.open ?? true) &&
      (document.visibilityState === undefined || document.visibilityState === 'visible');
    if (visible === lastVisibility) return;
    lastVisibility = visible;
    dispatch({ type: 'visibility', surface, visible });
  };
  const reportAfterTabChange = (): void => queueMicrotask(reportVisibility);
  for (const tab of root.querySelectorAll<HTMLButtonElement>('[role="tab"]')) {
    listen(tab, 'click', reportAfterTabChange);
    listen(tab, 'keydown', reportAfterTabChange);
  }
  if (drawer) listen(drawer, 'toggle', reportVisibility);
  listen(document, 'visibilitychange', reportVisibility);
  reportVisibility();

  const render = (viewModel: EngineDebugInspectorViewModel): void => {
    inspector.setAttribute('aria-busy', String(viewModel.busy));
    startButton.disabled = !viewModel.canStart;
    stopButton.disabled = !viewModel.canStop;
    snapshotButton.disabled = !viewModel.canSnapshot;
    exportButton.disabled = !viewModel.canExport;
    if (groupSelect.value !== viewModel.filter.group) groupSelect.value = viewModel.filter.group;
    if (queryInput.value !== viewModel.filter.query) queryInput.value = viewModel.filter.query;
    setText(inspector, '[data-engine-debug-value="policy"]', viewModel.policyLabel);
    setText(inspector, '[data-engine-debug-value="status"]', viewModel.statusLabel);
    setText(inspector, '[data-engine-debug-value="detail"]', viewModel.statusDetail);
    setText(
      inspector,
      '[data-engine-debug-value="live"]',
      `${viewModel.statusLabel}. ${viewModel.renderedEventCount} event rows rendered.`
    );
    setText(inspector, '[data-engine-debug-value="capacity"]', viewModel.capacitySummary);
    setText(
      inspector,
      '[data-engine-debug-value="matches"]',
      `${viewModel.matchingEventCount} ${COPY.matching}`
    );
    setText(
      inspector,
      '[data-engine-debug-value="producer-drops"]',
      `${viewModel.producerDroppedEvents} ${COPY.producerGaps}`
    );
    setText(
      inspector,
      '[data-engine-debug-value="frontend-drops"]',
      `${viewModel.frontendDroppedEvents} ${COPY.frontendDrops}`
    );
    setText(inspector, '[data-engine-debug-value="snapshot-summary"]', viewModel.snapshotSummary);
    setText(inspector, '[data-engine-debug-snapshot]', viewModel.snapshotText);

    eventList.replaceChildren(
      ...(viewModel.rows.length === 0
        ? [
            Object.assign(document.createElement('li'), {
              className: 'engine-debug-empty',
              textContent: COPY.noMatchingEvents
            })
          ]
        : viewModel.rows.map((row) => {
            const item = document.createElement('li');
            item.className = 'engine-debug-event';
            const sequence = document.createElement('span');
            sequence.className = 'engine-debug-event-seq';
            sequence.textContent = `#${row.seq}`;
            const kind = document.createElement('strong');
            kind.className = 'engine-debug-event-kind';
            kind.textContent = row.kind;
            const time = document.createElement('span');
            time.className = 'engine-debug-event-time';
            time.textContent = row.monotonicTime;
            const summary = document.createElement('span');
            summary.className = 'engine-debug-event-summary';
            summary.textContent = row.cardId ? `${row.cardId} · ${row.summary}` : row.summary;
            item.append(sequence, kind, time, summary);
            return item;
          }))
    );
  };

  return {
    render,
    dispose: () => {
      while (cleanups.length > 0) cleanups.pop()?.();
      if (lastVisibility !== false) {
        dispatch({ type: 'visibility', surface, visible: false });
      }
    }
  };
};
