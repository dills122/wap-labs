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
  fetchUrlInput.value = 'wap://localhost/';
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
  navigationStatus: 'idle',
  requestedUrl: 'wap://localhost/'
};

describe('BrowserController startup probe behavior', () => {
  it('does not block network mode entry on startup probe completion', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    let resolveProbe: ((value: unknown) => void) | undefined;
    const hostClient = {
      health: vi.fn(async () => 'ok'),
      fetchDeck: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveProbe = resolve;
          })
      ),
      engineLoadDeck: vi.fn(),
      engineLoadDeckContext: vi.fn(async () => snapshot({ activeCardId: 'home' })),
      engineRender: vi.fn(async () => renderStub),
      engineHandleKey: vi.fn(),
      engineNavigateToCard: vi.fn(),
      engineNavigateBack: vi.fn(),
      engineSetViewportCols: vi.fn(),
      engineAdvanceTimeMs: vi.fn(),
      engineSnapshot: vi.fn(async () => snapshot({ activeCardId: 'home' })),
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
    let settled = false;
    const modePromise = (controller as any).setRunMode('network', { loadLocalOnEnter: false });
    void modePromise.then(() => {
      settled = true;
    });
    await Promise.resolve();

    expect(settled).toBe(true);
    expect(hostClient.fetchDeck).toHaveBeenCalledTimes(1);

    resolveProbe?.(
      Promise.resolve({
        ok: true,
        status: 200,
        finalUrl: 'wap://localhost/',
        contentType: 'text/vnd.wap.wml',
        wml: undefined,
        timingMs: { encode: 0, udpRtt: 0, decode: 0 },
        engineDeckInput: undefined
      })
    );
  });

  it('ignores stale probe results after switching back to local mode', async () => {
    const refs = createRefs();
    const presenter = new BrowserPresenter(refs, initialSession, 20);
    let resolveProbe:
      | ((value: {
          ok: boolean;
          status: number;
          finalUrl: string;
          contentType: string;
          error: { code: string; message: string };
          wml?: undefined;
          engineDeckInput?: undefined;
          timingMs: { encode: number; udpRtt: number; decode: number };
        }) => void)
      | undefined;
    const hostClient = {
      health: vi.fn(async () => 'ok'),
      fetchDeck: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveProbe = resolve;
          })
      ),
      engineLoadDeck: vi.fn(),
      engineLoadDeckContext: vi.fn(async () => snapshot({ activeCardId: 'home' })),
      engineRender: vi.fn(async () => renderStub),
      engineHandleKey: vi.fn(),
      engineNavigateToCard: vi.fn(),
      engineNavigateBack: vi.fn(),
      engineSetViewportCols: vi.fn(async () => snapshot({ activeCardId: 'home' })),
      engineAdvanceTimeMs: vi.fn(),
      engineSnapshot: vi.fn(async () => snapshot({ activeCardId: 'home' })),
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
    await (controller as any).setRunMode('network', { loadLocalOnEnter: false });
    await (controller as any).setRunMode('local', { loadLocalOnEnter: false });

    resolveProbe?.({
      ok: false,
      status: 0,
      finalUrl: 'wap://localhost/',
      contentType: 'text/plain',
      error: { code: 'TRANSPORT_UNAVAILABLE', message: 'offline' },
      wml: undefined,
      engineDeckInput: undefined,
      timingMs: { encode: 0, udpRtt: 0, decode: 0 }
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(presenter.getSessionState().runMode).toBe('local');
    expect(presenter.getSessionState().navigationStatus).toBe('loaded');
    expect(presenter.getSessionState().lastError).toBeUndefined();
  });
});
