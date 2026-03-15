import { describe, expect, it, vi } from 'vitest';
import type { HostSessionState } from '../../../contracts/transport';
import type { BrowserShellRefs } from './browser-shell-template';
import { BrowserController } from './browser-controller';
import { BrowserPresenter } from './browser-presenter';
import { renderStub, snapshot } from './navigation-state.test-helpers';

const createRefs = (): BrowserShellRefs => {
  const viewportEl = document.createElement('div');
  const snapshotEl = document.createElement('pre');
  const fetchUrlInput = document.createElement('input');
  fetchUrlInput.value = 'http://local.test/start.wml';
  const transportResponseEl = document.createElement('pre');
  const sessionStateEl = document.createElement('pre');
  const timelineEl = document.createElement('pre');
  const activeUrlLabelEl = document.createElement('span');
  const devDrawerEl = document.createElement('details');
  const toastEl = document.createElement('div');
  const wmlInput = document.createElement('textarea');
  const baseUrlInput = document.createElement('input');
  const viewportColsInput = document.createElement('input');
  viewportColsInput.value = '20';
  const runModeSelectEl = document.createElement('select');
  const localOption = document.createElement('option');
  localOption.value = 'local';
  runModeSelectEl.append(localOption);
  const networkOption = document.createElement('option');
  networkOption.value = 'network';
  runModeSelectEl.append(networkOption);
  const localExampleSelectEl = document.createElement('select');
  const loadLocalBtnEl = document.createElement('button');
  const localExampleWrapEl = document.createElement('label');
  const localExampleNotesEl = document.createElement('details');
  const localExampleCoverageEl = document.createElement('p');
  const localExampleDescriptionEl = document.createElement('p');
  const localExampleGoalEl = document.createElement('p');
  const localExampleTestingAcEl = document.createElement('ul');
  const statusEl = {
    setStatus: () => {
      // no-op
    }
  } as unknown as BrowserShellRefs['statusEl'];

  return {
    wmlInput,
    baseUrlInput,
    viewportColsInput,
    viewportEl,
    snapshotEl,
    statusEl,
    fetchUrlInput,
    transportResponseEl,
    sessionStateEl,
    timelineEl,
    activeUrlLabelEl,
    devDrawerEl,
    toastEl,
    runModeSelectEl,
    localExampleSelectEl,
    loadLocalBtnEl,
    localExampleWrapEl,
    localExampleNotesEl,
    localExampleCoverageEl,
    localExampleDescriptionEl,
    localExampleGoalEl,
    localExampleTestingAcEl
  };
};

const initialSession: HostSessionState = {
  runMode: 'local',
  navigationStatus: 'loaded',
  requestedUrl: 'http://local.test/start.wml',
  finalUrl: 'http://local.test/start.wml',
  contentType: 'text/vnd.wap.wml',
  activeCardId: 'home',
  focusedLinkIndex: 0
};

describe('BrowserController local timer behavior', () => {
  it('skips redraw for no-op local timer ticks', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);

    const engineRender = vi.fn(async () => renderStub);
    const hostClient = {
      health: vi.fn(async () => 'ok'),
      fetchDeck: vi.fn(),
      engineLoadDeck: vi.fn(),
      engineLoadDeckContext: vi.fn(),
      engineRender,
      engineHandleKey: vi.fn(),
      engineNavigateToCard: vi.fn(),
      engineNavigateBack: vi.fn(),
      engineSetViewportCols: vi.fn(),
      engineAdvanceTimeMs: vi.fn(async () =>
        snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })
      ),
      engineSnapshot: vi.fn(async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })),
      engineClearExternalNavigationIntent: vi.fn(),
      engineBeginFocusedInputEdit: vi.fn(),
      engineSetFocusedInputEditDraft: vi.fn(),
      engineCommitFocusedInputEdit: vi.fn(),
      engineCancelFocusedInputEdit: vi.fn(),
      engineBeginFocusedSelectEdit: vi.fn(),
      engineMoveFocusedSelectEdit: vi.fn(),
      engineCommitFocusedSelectEdit: vi.fn(),
      engineCancelFocusedSelectEdit: vi.fn()
    };

    const controller = new BrowserController(hostClient as never, presenter, refs);
    presenter.setSessionState(initialSession);
    presenter.setSnapshot(snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }));
    await (controller as any).tickEngineTimerRuntime();

    expect(engineRender).not.toHaveBeenCalled();
  });
});
