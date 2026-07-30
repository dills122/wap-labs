import { describe, expect, it, vi } from 'vitest';
import type { HostSessionState } from '../../../contracts/transport';
import type { BrowserShellRefs } from './browser-shell-template';
import { BrowserController } from './browser-controller';
import { controllerPrivates } from './browser-controller.test-helpers';
import { BrowserPresenter } from './browser-presenter';
import { frame, renderStub, snapshot } from './navigation-state.test-helpers';

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
  const liveAnnouncerEl = document.createElement('div');
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
    liveAnnouncerEl,
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
  it('skips no-op redraws and publishes changed local timer frames atomically', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);

    const engineRender = vi.fn(async () => renderStub);
    const engineRenderFrame = vi.fn(async () => frame({ activeCardId: 'render-fallback' }));
    const engineAdvanceTimeMs = vi.fn(async () =>
      snapshot({ activeCardId: 'legacy-timer', focusedLinkIndex: 0 })
    );
    const engineAdvanceTimeMsFrame = vi.fn(async () =>
      frame({ activeCardId: 'home', focusedLinkIndex: 0 })
    );
    const hostClient = {
      health: vi.fn(async () => 'ok'),
      fetchDeck: vi.fn(),
      engineLoadDeck: vi.fn(),
      engineLoadDeckContext: vi.fn(),
      engineRender,
      engineRenderFrame,
      engineHandleKey: vi.fn(),
      engineHandleKeyFrame: vi.fn(async () => frame({ activeCardId: 'home', focusedLinkIndex: 0 })),
      engineNavigateToCard: vi.fn(),
      engineNavigateToCardFrame: vi.fn(async () =>
        frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      ),
      engineNavigateBack: vi.fn(),
      engineNavigateBackFrame: vi.fn(async () =>
        frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      ),
      engineSetViewportCols: vi.fn(),
      engineAdvanceTimeMs,
      engineAdvanceTimeMsFrame,
      engineSnapshot: vi.fn(async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })),
      engineClearExternalNavigationIntent: vi.fn(),
      engineClearExternalNavigationIntentFrame: vi.fn(async () =>
        frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      ),
      engineBeginFocusedInputEdit: vi.fn(),
      engineBeginFocusedInputEditFrame: vi.fn(async () =>
        frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      ),
      engineSetFocusedInputEditDraft: vi.fn(),
      engineSetFocusedInputEditDraftFrame: vi.fn(async () =>
        frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      ),
      engineCommitFocusedInputEdit: vi.fn(),
      engineCommitFocusedInputEditFrame: vi.fn(async () =>
        frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      ),
      engineCancelFocusedInputEdit: vi.fn(),
      engineCancelFocusedInputEditFrame: vi.fn(async () =>
        frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      ),
      engineBeginFocusedSelectEdit: vi.fn(),
      engineBeginFocusedSelectEditFrame: vi.fn(async () =>
        frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      ),
      engineMoveFocusedSelectEdit: vi.fn(),
      engineMoveFocusedSelectEditFrame: vi.fn(async () =>
        frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      ),
      engineCommitFocusedSelectEdit: vi.fn(),
      engineCommitFocusedSelectEditFrame: vi.fn(async () =>
        frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      ),
      engineCancelFocusedSelectEdit: vi.fn(),
      engineCancelFocusedSelectEditFrame: vi.fn(async () =>
        frame({ activeCardId: 'home', focusedLinkIndex: 0 })
      )
    };

    const controller = new BrowserController(hostClient as never, presenter, refs);
    presenter.setSessionState(initialSession);
    presenter.setSnapshot(snapshot({ activeCardId: 'home', focusedLinkIndex: 0 }));
    await controllerPrivates(controller).tickEngineTimerRuntime();

    expect(engineRender).not.toHaveBeenCalled();
    expect(engineRenderFrame).not.toHaveBeenCalled();
    expect(engineAdvanceTimeMs).not.toHaveBeenCalled();
    expect(engineAdvanceTimeMsFrame).toHaveBeenCalledOnce();

    const timerRender = {
      draw: [{ type: 'text' as const, x: 0, y: 0, text: 'timer committed' }]
    };
    engineAdvanceTimeMsFrame.mockResolvedValueOnce(
      frame({ activeCardId: 'after-timer', focusedLinkIndex: 0 }, timerRender)
    );

    await controllerPrivates(controller).tickEngineTimerRuntime();

    expect(presenter.getSnapshot()?.activeCardId).toBe('after-timer');
    expect(presenter.getRenderList()).toEqual(timerRender);
    expect(engineRenderFrame).not.toHaveBeenCalled();
  });
});
