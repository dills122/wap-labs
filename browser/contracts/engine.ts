import type {
  LoadDeckContextRequest,
  ScriptDialogRequestSnapshot,
  ScriptTimerRequestSnapshot
} from './generated/engine-host';

export type {
  AdvanceTimeRequest,
  DrawCmd,
  EngineHostClient,
  EngineKey,
  EngineRuntimeSnapshot,
  HandleKeyRequest,
  LoadDeckContextRequest,
  LoadDeckRequest,
  NavigateToCardRequest,
  RenderList,
  ScriptDialogRequestSnapshot,
  ScriptTimerRequestSnapshot,
  SetViewportColsRequest
} from './generated/engine-host';

export type WmlDeckInput = LoadDeckContextRequest;
export type ScriptDialogRequest = ScriptDialogRequestSnapshot;
export type ScriptTimerRequest = ScriptTimerRequestSnapshot;
