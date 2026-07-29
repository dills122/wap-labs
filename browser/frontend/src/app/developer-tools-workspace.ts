import type { EngineRuntimeSnapshot } from '../../../contracts/engine';
import type { FetchResponse, HostSessionState } from '../../../contracts/transport';
import type { TimelineEntry } from './timeline';

export interface DeveloperToolsDocumentState {
  coverage: string;
  description: string;
  goal: string;
  testingAcceptance: string[];
}

export interface DeveloperToolsSourceState {
  baseUrl: string;
  wml: string;
}

export interface DeveloperToolsState {
  hostStatus: string;
  sessionState: HostSessionState;
  transportResponse: FetchResponse | null;
  runtimeSnapshot: EngineRuntimeSnapshot | null;
  timeline: TimelineEntry[];
  document: DeveloperToolsDocumentState;
  source: DeveloperToolsSourceState;
}

const EMPTY_VALUE = '—';

const setText = (root: ParentNode, selector: string, value: string): void => {
  const element = root.querySelector<HTMLElement>(selector);
  if (element && element.textContent !== value) {
    element.textContent = value;
  }
};

const setJson = (root: ParentNode, selector: string, value: unknown): void => {
  setText(root, selector, value === null ? '' : JSON.stringify(value, null, 2));
};

const displayValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') {
    return EMPTY_VALUE;
  }
  return String(value);
};

const transportDuration = (response: FetchResponse | null): string => {
  if (!response) {
    return EMPTY_VALUE;
  }
  const { encode, udpRtt, decode } = response.timingMs;
  return `${encode + udpRtt + decode} ms`;
};

export const renderDeveloperToolsSummary = (root: ParentNode, state: DeveloperToolsState): void => {
  const { sessionState, runtimeSnapshot, transportResponse, timeline, document } = state;
  setText(root, '#developer-tools-host-status', state.hostStatus);
  setText(
    root,
    '#developer-tools-target',
    displayValue(sessionState.finalUrl ?? sessionState.requestedUrl)
  );
  setText(root, '[data-devtools-value="run-mode"]', sessionState.runMode);
  setText(root, '[data-devtools-value="navigation-status"]', sessionState.navigationStatus);
  setText(root, '[data-devtools-value="active-card"]', displayValue(sessionState.activeCardId));
  setText(root, '[data-devtools-value="event-count"]', String(timeline.length));
  setText(
    root,
    '[data-devtools-value="document-coverage"]',
    document.coverage || 'No fixture coverage'
  );

  setText(
    root,
    '[data-devtools-value="transport-status"]',
    transportResponse
      ? `${transportResponse.status} ${transportResponse.ok ? 'OK' : 'Error'}`
      : EMPTY_VALUE
  );
  setText(
    root,
    '[data-devtools-value="content-type"]',
    displayValue(transportResponse?.contentType)
  );
  setText(root, '[data-devtools-value="final-url"]', displayValue(transportResponse?.finalUrl));
  setText(root, '[data-devtools-value="transport-time"]', transportDuration(transportResponse));

  setText(
    root,
    '[data-devtools-value="runtime-card"]',
    displayValue(runtimeSnapshot?.activeCardId)
  );
  setText(
    root,
    '[data-devtools-value="focused-link"]',
    displayValue(runtimeSnapshot?.focusedLinkIndex)
  );
  setText(
    root,
    '[data-devtools-value="next-timer"]',
    runtimeSnapshot?.nextTimerWakeupMs === undefined
      ? EMPTY_VALUE
      : `${runtimeSnapshot.nextTimerWakeupMs} ms`
  );
  setText(root, '[data-devtools-value="runtime-base-url"]', displayValue(runtimeSnapshot?.baseUrl));
};

export const renderDeveloperToolsState = (root: ParentNode, state: DeveloperToolsState): void => {
  renderDeveloperToolsSummary(root, state);
  setJson(root, '#session-state', state.sessionState);
  setJson(root, '#transport-response', state.transportResponse);
  setJson(root, '#snapshot', state.runtimeSnapshot);
  setJson(root, '#timeline', state.timeline);

  const coverageEl = root.querySelector<HTMLElement>('#local-example-coverage');
  const descriptionEl = root.querySelector<HTMLElement>('#local-example-description');
  const goalEl = root.querySelector<HTMLElement>('#local-example-goal');
  const acceptanceEl = root.querySelector<HTMLUListElement>('#local-example-testing-ac');
  const baseUrlEl = root.querySelector<HTMLInputElement>('#base-url');
  const wmlEl = root.querySelector<HTMLTextAreaElement>('#wml-input');

  if (coverageEl) coverageEl.textContent = state.document.coverage;
  if (descriptionEl) descriptionEl.textContent = state.document.description;
  if (goalEl) goalEl.textContent = state.document.goal;
  if (acceptanceEl) {
    acceptanceEl.replaceChildren(
      ...state.document.testingAcceptance.map((item) => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        return listItem;
      })
    );
  }
  if (baseUrlEl && document.activeElement !== baseUrlEl) baseUrlEl.value = state.source.baseUrl;
  if (wmlEl && document.activeElement !== wmlEl) wmlEl.value = state.source.wml;
};

const selectTab = (root: HTMLElement, nextTab: HTMLButtonElement): void => {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  for (const tab of tabs) {
    const selected = tab === nextTab;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    const panelId = tab.getAttribute('aria-controls');
    const panel = panelId ? root.querySelector<HTMLElement>(`#${panelId}`) : null;
    if (panel) panel.hidden = !selected;
  }
};

export const bindDeveloperToolsWorkspace = (root: HTMLElement): (() => void) => {
  const cleanups: Array<() => void> = [];
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));

  for (const tab of tabs) {
    const handleClick = (): void => selectTab(root, tab);
    const handleKeydown = (event: KeyboardEvent): void => {
      const currentIndex = tabs.indexOf(tab);
      let nextIndex = currentIndex;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
      else if (event.key === 'ArrowLeft')
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;

      event.preventDefault();
      const nextTab = tabs[nextIndex];
      if (nextTab) {
        selectTab(root, nextTab);
        nextTab.focus({ preventScroll: true });
      }
    };
    tab.addEventListener('click', handleClick);
    tab.addEventListener('keydown', handleKeydown);
    cleanups.push(() => {
      tab.removeEventListener('click', handleClick);
      tab.removeEventListener('keydown', handleKeydown);
    });
  }

  return () => {
    while (cleanups.length > 0) cleanups.pop()?.();
  };
};
