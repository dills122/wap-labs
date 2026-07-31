import type {
  EngineDebugCapabilities,
  EngineDebugErrorCode,
  EngineDebugEvent,
  EngineDebugSnapshot
} from '../../../contracts/engine';
import {
  ENGINE_DEBUG_CONSUMER_LIMITS,
  projectEngineDebugCapabilities,
  projectEngineDebugEvent,
  projectEngineDebugSnapshot
} from './engine-debug-capture';

export type EngineDebugInspectorPhase =
  'idle' | 'opening' | 'active' | 'closing' | 'unavailable' | 'error';

export type EngineDebugPolicyState = 'default-disabled' | 'enabled' | 'disabled' | 'unknown';

export type EngineDebugEventGroup =
  'all' | 'deck' | 'navigation' | 'input' | 'action' | 'script' | 'timer';

export interface EngineDebugFilter {
  group: EngineDebugEventGroup;
  query: string;
}

export interface EngineDebugStoreState {
  phase: EngineDebugInspectorPhase;
  policy: EngineDebugPolicyState;
  capabilities?: EngineDebugCapabilities;
  events: readonly EngineDebugEvent[];
  snapshot?: EngineDebugSnapshot;
  producerDroppedEvents: number;
  frontendDroppedEvents: number;
  errorCode?: EngineDebugErrorCode;
  filter: EngineDebugFilter;
}

const EVENT_GROUPS = new Set<EngineDebugEventGroup>([
  'all',
  'deck',
  'navigation',
  'input',
  'action',
  'script',
  'timer'
]);

const boundedCounter = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;

export class EngineDebugStore {
  private state: EngineDebugStoreState = {
    phase: 'idle',
    policy: 'default-disabled',
    events: [],
    producerDroppedEvents: 0,
    frontendDroppedEvents: 0,
    filter: { group: 'all', query: '' }
  };

  getState(): EngineDebugStoreState {
    return this.state;
  }

  beginOpen(): void {
    this.state = {
      phase: 'opening',
      policy: this.state.policy === 'disabled' ? 'unknown' : this.state.policy,
      events: [],
      producerDroppedEvents: 0,
      frontendDroppedEvents: 0,
      filter: this.state.filter
    };
  }

  markActive(capabilities: EngineDebugCapabilities): void {
    this.state = {
      ...this.state,
      phase: 'active',
      policy: 'enabled',
      capabilities: projectEngineDebugCapabilities(capabilities),
      errorCode: undefined
    };
  }

  beginClose(): void {
    this.state = { ...this.state, phase: 'closing', errorCode: undefined };
  }

  markStopped(): void {
    this.state = {
      ...this.state,
      phase: 'idle',
      errorCode: undefined
    };
  }

  markFailure(code: EngineDebugErrorCode): void {
    this.state = {
      ...this.state,
      phase: code === 'DEBUG_DISABLED' ? 'unavailable' : 'error',
      policy:
        code === 'DEBUG_DISABLED'
          ? 'disabled'
          : this.state.policy === 'enabled'
            ? 'unknown'
            : this.state.policy,
      errorCode: code
    };
  }

  appendEvents(events: readonly EngineDebugEvent[], producerDroppedEvents: number): void {
    const projected = events.map((event) => projectEngineDebugEvent(event));
    const combined = [...this.state.events, ...projected];
    const overflow = Math.max(0, combined.length - ENGINE_DEBUG_CONSUMER_LIMITS.retainedEvents);
    this.state = {
      ...this.state,
      events: overflow > 0 ? combined.slice(overflow) : combined,
      producerDroppedEvents:
        this.state.producerDroppedEvents + boundedCounter(producerDroppedEvents),
      frontendDroppedEvents: this.state.frontendDroppedEvents + overflow
    };
  }

  setSnapshot(snapshot: EngineDebugSnapshot): void {
    this.state = {
      ...this.state,
      snapshot: projectEngineDebugSnapshot(snapshot)
    };
  }

  setFilter(group: EngineDebugEventGroup, query: string): void {
    this.state = {
      ...this.state,
      filter: {
        group: EVENT_GROUPS.has(group) ? group : 'all',
        query: query.slice(0, ENGINE_DEBUG_CONSUMER_LIMITS.filterQueryLength)
      }
    };
  }
}
