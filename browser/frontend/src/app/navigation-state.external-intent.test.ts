import { describe, expect, it } from 'vitest';
import { createNavigationStateMachine } from './navigation-state';
import { createHostClientMock, fetchOk, snapshot } from './navigation-state.test-helpers';

describe('navigation-state external intent behavior', () => {
  it('follows external intent loop and applies hop cap', async () => {
    let loadCount = 0;
    let clearCount = 0;
    const host = createHostClientMock({
      fetchDeck: async (request) =>
        fetchOk({
          finalUrl: request.url
        }),
      engineLoadDeckContext: async () => {
        loadCount += 1;
        if (loadCount === 1) {
          return snapshot({
            activeCardId: 'home',
            externalNavigationIntent: 'http://example.test/step-1.wml'
          });
        }
        if (loadCount === 2) {
          return snapshot({
            activeCardId: 'step-1',
            externalNavigationIntent: 'http://example.test/step-2.wml'
          });
        }
        return snapshot({
          activeCardId: 'step-2',
          externalNavigationIntent: 'http://example.test/step-3.wml'
        });
      },
      engineClearExternalNavigationIntent: async () => {
        clearCount += 1;
        return snapshot({ activeCardId: 'clear' });
      }
    });
    const machine = createNavigationStateMachine(host, 'http://seed.test', {}, 2);

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'user',
      followExternalIntent: true
    });

    expect(clearCount).toBe(2);
    expect(machine.getSessionState().navigationStatus).toBe('error');
    expect(machine.getSessionState().lastError).toContain('hop limit');
  });

  it('uses runtime-provided external intent request policy when following intents', async () => {
    const capturedPolicies: unknown[] = [];
    let loadCount = 0;
    const host = createHostClientMock({
      fetchDeck: async (request) => {
        capturedPolicies.push(request.requestPolicy);
        return fetchOk({ finalUrl: request.url });
      },
      engineLoadDeckContext: async () => {
        loadCount += 1;
        if (loadCount === 1) {
          return snapshot({
            activeCardId: 'home',
            externalNavigationIntent: 'http://example.test/step-1.wml',
            externalNavigationRequestPolicy: {
              refererUrl: 'http://example.test/start.wml'
            }
          });
        }
        return snapshot({
          activeCardId: 'step-1'
        });
      }
    });
    const machine = createNavigationStateMachine(host, 'http://seed.test');

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'user',
      followExternalIntent: true
    });

    expect(capturedPolicies).toHaveLength(2);
    expect(capturedPolicies[0]).toEqual({ uaCapabilityProfile: 'wap-baseline' });
    expect(capturedPolicies[1]).toEqual({
      refererUrl: 'http://example.test/start.wml',
      uaCapabilityProfile: 'wap-baseline'
    });
  });

  it('uses POST when external intent policy includes post context', async () => {
    const fetchRequests: Array<{ method: string | undefined; requestPolicy: unknown }> = [];
    let loadCount = 0;
    const host = createHostClientMock({
      fetchDeck: async (request) => {
        fetchRequests.push({ method: request.method, requestPolicy: request.requestPolicy });
        return fetchOk({ finalUrl: request.url });
      },
      engineLoadDeckContext: async () => {
        loadCount += 1;
        if (loadCount === 1) {
          return snapshot({
            activeCardId: 'login',
            externalNavigationIntent: 'http://example.test/login',
            externalNavigationRequestPolicy: {
              refererUrl: 'http://example.test/start.wml',
              postContext: {
                sameDeck: true,
                contentType: 'application/x-www-form-urlencoded',
                payload: 'username=dylan&pin=1234'
              }
            }
          });
        }
        return snapshot({
          activeCardId: 'portal'
        });
      }
    });
    const machine = createNavigationStateMachine(host, 'http://seed.test');

    await machine.loadTransportUrl({
      url: 'http://example.test/start.wml',
      source: 'user',
      followExternalIntent: true
    });

    expect(fetchRequests).toHaveLength(2);
    expect(fetchRequests[0]).toMatchObject({ method: 'GET' });
    expect(fetchRequests[1]).toMatchObject({
      method: 'POST',
      requestPolicy: {
        refererUrl: 'http://example.test/start.wml',
        postContext: {
          sameDeck: true,
          contentType: 'application/x-www-form-urlencoded',
          payload: 'username=dylan&pin=1234'
        },
        uaCapabilityProfile: 'wap-baseline'
      }
    });
  });
});
