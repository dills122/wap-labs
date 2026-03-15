import type { FetchRequest, FetchResponse } from '../../../contracts/transport';
import { isProbeReachable } from './network';
import { defaultRequestPolicyForSource } from './navigation-state';
import { WAVES_CONFIG } from './waves-config';
import { WAVES_COPY } from './waves-copy';

export interface StartupNetworkProbeDependencies {
  fetchDeck(request: FetchRequest): Promise<FetchResponse>;
  getTargetUrl(): string;
  getRunMode(): 'local' | 'network';
  setLastNetworkUrl(url: string): void;
  recordTimeline(action: string, details?: Record<string, unknown>): void;
  setStatus(message: string): void;
  patchSessionState(patch: { navigationStatus: 'error'; lastError: string }): void;
  showToast(message: string, tone: 'error' | 'ok'): void;
  createHeaders(): Record<string, string>;
  wait(ms: number): Promise<void>;
}

export class StartupNetworkProbeController {
  private generation = 0;

  constructor(private readonly deps: StartupNetworkProbeDependencies) {}

  start(): void {
    void this.run();
  }

  cancel(): void {
    this.generation += 1;
  }

  private async run(): Promise<void> {
    const probeGeneration = this.generation;
    const targetUrl = this.deps.getTargetUrl().trim();
    if (!targetUrl) {
      return;
    }
    this.deps.setLastNetworkUrl(targetUrl);

    for (let attempt = 1; attempt <= WAVES_CONFIG.networkProbeMaxAttempts; attempt += 1) {
      if (!this.isCurrent(probeGeneration)) {
        return;
      }
      this.deps.recordTimeline('startup-network-probe', {
        attempt,
        targetUrl
      });
      try {
        const probe = await this.deps.fetchDeck({
          url: targetUrl,
          method: 'GET',
          headers: this.deps.createHeaders(),
          timeoutMs: WAVES_CONFIG.networkProbeTimeoutMs,
          retries: 0,
          requestPolicy: defaultRequestPolicyForSource('user', targetUrl)
        });
        if (!this.isCurrent(probeGeneration)) {
          return;
        }
        if (isProbeReachable(probe)) {
          this.deps.setStatus(WAVES_COPY.status.readyNetwork);
          return;
        }
      } catch {
        if (!this.isCurrent(probeGeneration)) {
          return;
        }
      }
      if (attempt < WAVES_CONFIG.networkProbeMaxAttempts) {
        await this.deps.wait(WAVES_CONFIG.networkProbeDelayMs);
      }
    }

    if (!this.isCurrent(probeGeneration)) {
      return;
    }
    const message = WAVES_COPY.status.networkUnavailable;
    this.deps.patchSessionState({
      navigationStatus: 'error',
      lastError: message
    });
    this.deps.setStatus(message);
    this.deps.showToast(message, 'error');
  }

  private isCurrent(probeGeneration: number): boolean {
    return probeGeneration === this.generation && this.deps.getRunMode() === 'network';
  }
}
