import type {
  EngineDebugCloseSessionOutcome,
  EngineDebugOpenSessionOutcome,
  EngineDebugPollEventsOutcome,
  EngineDebugSnapshotOutcome
} from '../../../contracts/engine';
import type { TauriHostClient } from '../../../contracts/generated/tauri-host-client';

export interface EngineDebugSessionClient {
  open(): Promise<EngineDebugOpenSessionOutcome>;
  poll(sessionId: string, cursor: string, maxEvents: number): Promise<EngineDebugPollEventsOutcome>;
  snapshot(sessionId: string): Promise<EngineDebugSnapshotOutcome>;
  close(sessionId: string): Promise<EngineDebugCloseSessionOutcome>;
}

type EngineDebugHostClient = Pick<
  TauriHostClient,
  | 'engineDebugOpenSession'
  | 'engineDebugPollEvents'
  | 'engineDebugGetSnapshot'
  | 'engineDebugCloseSession'
>;

export const createEngineDebugSessionClient = (
  hostClient: EngineDebugHostClient
): EngineDebugSessionClient => ({
  open: () => hostClient.engineDebugOpenSession({ protocolVersion: 1 }),
  poll: (sessionId, cursor, maxEvents) =>
    hostClient.engineDebugPollEvents({ sessionId, cursor, maxEvents }),
  snapshot: (sessionId) => hostClient.engineDebugGetSnapshot({ sessionId }),
  close: (sessionId) => hostClient.engineDebugCloseSession({ sessionId })
});
