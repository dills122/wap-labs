import type { EngineFrame, EngineRuntimeSnapshot } from '../../../contracts/engine';

export type ControlEditDisposition = 'unhandled' | 'handled' | 'handled-stop';

export interface FocusedControlEditHost {
  getSnapshot(): EngineRuntimeSnapshot | null;
  loadSnapshot(): Promise<EngineRuntimeSnapshot>;
  syncSnapshot(snapshot: EngineRuntimeSnapshot): void;
  recordTimeline(action: string, details: Record<string, unknown>): void;
  applyFrame(frame: EngineFrame): void;
  beginFocusedInputEdit(): Promise<EngineFrame>;
  setFocusedInputEditDraft(value: string): Promise<EngineFrame>;
  commitFocusedInputEdit(): Promise<EngineFrame>;
  cancelFocusedInputEdit(): Promise<EngineFrame>;
  beginFocusedSelectEdit(): Promise<EngineFrame>;
  moveFocusedSelectEdit(delta: number): Promise<EngineFrame>;
  commitFocusedSelectEdit(): Promise<EngineFrame>;
  cancelFocusedSelectEdit(): Promise<EngineFrame>;
}

export class FocusedControlEditController {
  constructor(private readonly host: FocusedControlEditHost) {}

  async applyKey(key: string): Promise<ControlEditDisposition> {
    const initial = this.host.getSnapshot() ?? (await this.host.loadSnapshot());
    if (initial.focusedSelectEditName) {
      return this.applyFocusedSelectEditKey(initial, key);
    }
    if (key === 'Enter' && !initial.focusedInputEditName) {
      const selectFrame = await this.host.beginFocusedSelectEdit();
      const selectSnapshot = selectFrame.snapshot;
      if (selectSnapshot.focusedSelectEditName) {
        this.applyInteractiveFrame(selectFrame);
        this.host.recordTimeline('keyboard-select-edit-state', {
          key,
          handled: true,
          focusedSelectEditName: selectSnapshot.focusedSelectEditName ?? null,
          focusedSelectEditValue: selectSnapshot.focusedSelectEditValue ?? null,
          focusedLinkIndex: selectSnapshot.focusedLinkIndex,
          phase: 'engaged'
        });
        return 'handled-stop';
      }
    }
    return this.applyFocusedInputEditKey(initial, key);
  }

  private async applyFocusedInputEditKey(
    initialSnapshot: EngineRuntimeSnapshot,
    key: string
  ): Promise<ControlEditDisposition> {
    let snapshot = initialSnapshot;
    if (!snapshot.focusedInputEditName && key.length === 1) {
      snapshot = (await this.host.beginFocusedInputEdit()).snapshot;
    }
    if (!snapshot.focusedInputEditName) {
      this.host.recordTimeline('keyboard-input-edit-state', {
        key,
        handled: false,
        focusedInputEditName: null,
        focusedInputEditValue: null,
        focusedLinkIndex: snapshot.focusedLinkIndex
      });
      return 'unhandled';
    }

    let frame: EngineFrame;
    if (key === 'Enter') {
      frame = await this.host.commitFocusedInputEdit();
    } else if (key === 'Escape') {
      frame = await this.host.cancelFocusedInputEdit();
    } else if (key === 'Backspace') {
      frame = await this.host.setFocusedInputEditDraft(
        (snapshot.focusedInputEditValue ?? '').slice(0, -1)
      );
    } else if (key.length === 1) {
      frame = await this.host.setFocusedInputEditDraft(
        `${snapshot.focusedInputEditValue ?? ''}${key}`
      );
    } else {
      this.host.recordTimeline('keyboard-input-edit-state', {
        key,
        handled: false,
        focusedInputEditName: snapshot.focusedInputEditName ?? null,
        focusedInputEditValue: snapshot.focusedInputEditValue ?? null,
        focusedLinkIndex: snapshot.focusedLinkIndex
      });
      return 'unhandled';
    }

    snapshot = frame.snapshot;
    this.applyInteractiveFrame(frame);
    this.host.recordTimeline('keyboard-input-edit-state', {
      key,
      handled: true,
      focusedInputEditName: snapshot.focusedInputEditName ?? null,
      focusedInputEditValue: snapshot.focusedInputEditValue ?? null,
      focusedLinkIndex: snapshot.focusedLinkIndex
    });
    return 'handled';
  }

  private async applyFocusedSelectEditKey(
    initialSnapshot: EngineRuntimeSnapshot,
    key: string
  ): Promise<ControlEditDisposition> {
    let snapshot = initialSnapshot;
    if (!snapshot.focusedSelectEditName) {
      return 'unhandled';
    }

    let frame: EngineFrame;
    if (key === 'Enter') {
      frame = await this.host.commitFocusedSelectEdit();
    } else if (key === 'Escape') {
      frame = await this.host.cancelFocusedSelectEdit();
    } else if (key === 'ArrowUp') {
      frame = await this.host.moveFocusedSelectEdit(-1);
    } else if (key === 'ArrowDown') {
      frame = await this.host.moveFocusedSelectEdit(1);
    } else {
      this.host.recordTimeline('keyboard-select-edit-state', {
        key,
        handled: false,
        focusedSelectEditName: snapshot.focusedSelectEditName ?? null,
        focusedSelectEditValue: snapshot.focusedSelectEditValue ?? null,
        focusedLinkIndex: snapshot.focusedLinkIndex
      });
      return 'unhandled';
    }

    snapshot = frame.snapshot;
    this.applyInteractiveFrame(frame);
    this.host.recordTimeline('keyboard-select-edit-state', {
      key,
      handled: true,
      focusedSelectEditName: snapshot.focusedSelectEditName ?? null,
      focusedSelectEditValue: snapshot.focusedSelectEditValue ?? null,
      focusedLinkIndex: snapshot.focusedLinkIndex
    });
    return 'handled-stop';
  }

  private applyInteractiveFrame(frame: EngineFrame): void {
    this.host.applyFrame(frame);
    this.host.syncSnapshot(frame.snapshot);
  }
}
