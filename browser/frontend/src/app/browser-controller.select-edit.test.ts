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
  const transportResponseEl = document.createElement('pre');
  const sessionStateEl = document.createElement('pre');
  const timelineEl = document.createElement('pre');
  const activeUrlLabelEl = document.createElement('span');
  const devDrawerEl = document.createElement('details');
  const toastEl = document.createElement('div');
  const wmlInput = document.createElement('textarea');
  const baseUrlInput = document.createElement('input');
  const viewportColsInput = document.createElement('input');
  const runModeSelectEl = document.createElement('select');
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
  navigationStatus: 'idle',
  requestedUrl: 'http://127.0.0.1:3000/'
};

describe('BrowserController select edit keyboard routing', () => {
  it('uses first Enter to engage select edit without committing immediately', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    presenter.setSnapshot(
      snapshot({
        activeCardId: 'profile',
        focusedLinkIndex: 1
      })
    );

    const engineHandleKey = vi.fn(async () => snapshot({ activeCardId: 'profile' }));
    const engineBeginFocusedSelectEdit = vi.fn(async () =>
      snapshot({
        activeCardId: 'profile',
        focusedLinkIndex: 1,
        focusedSelectEditName: 'Country',
        focusedSelectEditValue: 'Jordan'
      })
    );
    const engineCommitFocusedSelectEdit = vi.fn(async () =>
      snapshot({
        activeCardId: 'profile',
        focusedLinkIndex: 1
      })
    );
    const hostClient = {
      health: vi.fn(async () => 'ok'),
      fetchDeck: vi.fn(),
      engineLoadDeck: vi.fn(),
      engineLoadDeckContext: vi.fn(),
      engineRender: vi.fn(async () => renderStub),
      engineHandleKey,
      engineNavigateToCard: vi.fn(),
      engineNavigateBack: vi.fn(),
      engineSetViewportCols: vi.fn(),
      engineAdvanceTimeMs: vi.fn(),
      engineSnapshot: vi.fn(async () =>
        snapshot({
          activeCardId: 'profile',
          focusedLinkIndex: 1
        })
      ),
      engineClearExternalNavigationIntent: vi.fn(),
      engineBeginFocusedInputEdit: vi.fn(),
      engineSetFocusedInputEditDraft: vi.fn(),
      engineCommitFocusedInputEdit: vi.fn(),
      engineCancelFocusedInputEdit: vi.fn(),
      engineBeginFocusedSelectEdit,
      engineMoveFocusedSelectEdit: vi.fn(),
      engineCommitFocusedSelectEdit,
      engineCancelFocusedSelectEdit: vi.fn()
    };

    const controller = new BrowserController(hostClient as never, presenter, refs);
    (controller as any).handleWindowKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    await (controller as any).keyboardActionQueue;

    expect(engineBeginFocusedSelectEdit).toHaveBeenCalledTimes(1);
    expect(engineCommitFocusedSelectEdit).not.toHaveBeenCalled();
    expect(engineHandleKey).not.toHaveBeenCalled();
    expect(presenter.getSnapshot()?.focusedSelectEditName).toBe('Country');
  });

  it('commits select edit on Enter without falling through to engine key handling', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    presenter.setSnapshot(
      snapshot({
        activeCardId: 'profile',
        focusedLinkIndex: 1,
        focusedSelectEditName: 'Country',
        focusedSelectEditValue: 'France'
      })
    );

    const engineHandleKey = vi.fn(async () => snapshot({ activeCardId: 'profile' }));
    const engineCommitFocusedSelectEdit = vi.fn(async () =>
      snapshot({
        activeCardId: 'profile',
        focusedLinkIndex: 1
      })
    );
    const hostClient = {
      health: vi.fn(async () => 'ok'),
      fetchDeck: vi.fn(),
      engineLoadDeck: vi.fn(),
      engineLoadDeckContext: vi.fn(),
      engineRender: vi.fn(async () => renderStub),
      engineHandleKey,
      engineNavigateToCard: vi.fn(),
      engineNavigateBack: vi.fn(),
      engineSetViewportCols: vi.fn(),
      engineAdvanceTimeMs: vi.fn(),
      engineSnapshot: vi.fn(async () =>
        snapshot({
          activeCardId: 'profile',
          focusedLinkIndex: 1,
          focusedSelectEditName: 'Country',
          focusedSelectEditValue: 'France'
        })
      ),
      engineClearExternalNavigationIntent: vi.fn(),
      engineBeginFocusedInputEdit: vi.fn(),
      engineSetFocusedInputEditDraft: vi.fn(),
      engineCommitFocusedInputEdit: vi.fn(),
      engineCancelFocusedInputEdit: vi.fn(),
      engineBeginFocusedSelectEdit: vi.fn(),
      engineMoveFocusedSelectEdit: vi.fn(),
      engineCommitFocusedSelectEdit,
      engineCancelFocusedSelectEdit: vi.fn()
    };

    const controller = new BrowserController(hostClient as never, presenter, refs);
    (controller as any).handleWindowKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    await (controller as any).keyboardActionQueue;

    expect(engineCommitFocusedSelectEdit).toHaveBeenCalledTimes(1);
    expect(engineHandleKey).not.toHaveBeenCalled();
    expect(presenter.getSnapshot()?.focusedSelectEditName).toBeUndefined();
  });
});
