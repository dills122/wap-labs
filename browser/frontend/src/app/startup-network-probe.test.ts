import { describe, expect, it, vi } from 'vitest';
import type { FetchResponse, RunMode } from '../../../contracts/transport';
import {
  StartupNetworkProbeController,
  type StartupNetworkProbeDependencies
} from './startup-network-probe';
import { WAVES_COPY } from './waves-copy';

const flushAsyncWork = async (turns = 6): Promise<void> => {
  for (let index = 0; index < turns; index += 1) {
    await Promise.resolve();
  }
};

const createDeps = (
  overrides: Partial<StartupNetworkProbeDependencies> = {}
): StartupNetworkProbeDependencies & {
  recordTimeline: ReturnType<typeof vi.fn>;
  setStatus: ReturnType<typeof vi.fn>;
  patchSessionState: ReturnType<typeof vi.fn>;
  showToast: ReturnType<typeof vi.fn>;
} => {
  const recordTimeline = vi.fn();
  const setStatus = vi.fn();
  const patchSessionState = vi.fn();
  const showToast = vi.fn();

  const base: StartupNetworkProbeDependencies = {
    fetchDeck: vi.fn(async (): Promise<FetchResponse> => ({
      ok: true,
      status: 200,
      finalUrl: 'wap://gateway.test/',
      contentType: 'text/vnd.wap.wml',
      timingMs: { encode: 0, udpRtt: 1, decode: 0 },
      engineDeckInput: undefined,
      wml: '<wml/>'
    })),
    getTargetUrl: vi.fn(() => 'wap://gateway.test/'),
    getRunMode: vi.fn((): RunMode => 'network'),
    setLastNetworkUrl: vi.fn(),
    recordTimeline,
    setStatus,
    patchSessionState,
    showToast,
    createHeaders: vi.fn(() => ({ Accept: 'text/vnd.wap.wml' })),
    wait: vi.fn(async () => undefined)
  };

  return Object.assign(base, overrides, {
    recordTimeline,
    setStatus,
    patchSessionState,
    showToast
  });
};

describe('StartupNetworkProbeController', () => {
  it('does nothing when there is no target URL', async () => {
    const deps = createDeps({
      getTargetUrl: vi.fn(() => '  ')
    });

    const controller = new StartupNetworkProbeController(deps);
    controller.start();
    await flushAsyncWork();

    expect(deps.fetchDeck).not.toHaveBeenCalled();
  });

  it('reports the checked gateway when a reachable probe succeeds', async () => {
    const deps = createDeps();

    const controller = new StartupNetworkProbeController(deps);
    controller.start();
    await flushAsyncWork();

    expect(deps.fetchDeck).toHaveBeenCalledTimes(1);
    expect(deps.setLastNetworkUrl).toHaveBeenCalledWith('wap://gateway.test/');
    expect(deps.setStatus).toHaveBeenCalledWith(
      WAVES_COPY.status.readyNetwork('wap://gateway.test/')
    );
    expect(deps.patchSessionState).not.toHaveBeenCalled();
  });

  it('retries unreachable responses and reports that the gateway was not verified', async () => {
    const deps = createDeps({
      fetchDeck: vi.fn(async (): Promise<FetchResponse> => ({
        ok: false,
        status: 0,
        finalUrl: 'wap://gateway.test/',
        contentType: 'text/plain',
        timingMs: { encode: 0, udpRtt: 0, decode: 0 },
        error: { code: 'TRANSPORT_UNAVAILABLE', message: 'offline' }
      }))
    });

    const controller = new StartupNetworkProbeController(deps);
    controller.start();
    await flushAsyncWork();

    expect(deps.fetchDeck).toHaveBeenCalledTimes(3);
    expect(deps.wait).toHaveBeenCalledTimes(2);
    const expectedMessage = WAVES_COPY.status.gatewayCheckFailed('wap://gateway.test/', 'offline');
    expect(deps.patchSessionState).toHaveBeenCalledWith({
      navigationStatus: 'error',
      lastError: expectedMessage
    });
    expect(deps.setStatus).toHaveBeenCalledWith(expectedMessage);
    expect(deps.showToast).toHaveBeenCalledWith(expectedMessage, 'error');
  });

  it('ignores stale failures after cancellation', async () => {
    let releaseProbe: (() => void) | undefined;
    const deps = createDeps({
      fetchDeck: vi.fn(
        async (): Promise<FetchResponse> =>
          new Promise<FetchResponse>((resolve) => {
            releaseProbe = () =>
              resolve({
                ok: false,
                status: 503,
                finalUrl: 'wap://gateway.test/',
                contentType: 'text/plain',
                timingMs: { encode: 0, udpRtt: 0, decode: 0 },
                error: { code: 'TRANSPORT_UNAVAILABLE', message: 'offline' }
              });
          })
      )
    });

    const controller = new StartupNetworkProbeController(deps);
    controller.start();
    controller.cancel();
    releaseProbe?.();
    await flushAsyncWork();

    expect(deps.patchSessionState).not.toHaveBeenCalled();
    expect(deps.showToast).not.toHaveBeenCalled();
  });
});
