import type { EngineRuntimeSnapshot } from '../../../contracts/engine';

export type ControlEditDisposition = 'unhandled' | 'handled' | 'handled-stop';

export interface FocusedControlEditHost {
  getSnapshot(): EngineRuntimeSnapshot | null;
  loadSnapshot(): Promise<EngineRuntimeSnapshot>;
  renderSnapshot(snapshot: EngineRuntimeSnapshot): Promise<void>;
  syncSnapshot(snapshot: EngineRuntimeSnapshot): void;
  recordTimeline(action: string, details: Record<string, unknown>): void;
  beginFocusedInputEdit(): Promise<EngineRuntimeSnapshot>;
  setFocusedInputEditDraft(value: string): Promise<EngineRuntimeSnapshot>;
  commitFocusedInputEdit(): Promise<EngineRuntimeSnapshot>;
  cancelFocusedInputEdit(): Promise<EngineRuntimeSnapshot>;
  beginFocusedSelectEdit(): Promise<EngineRuntimeSnapshot>;
  moveFocusedSelectEdit(delta: number): Promise<EngineRuntimeSnapshot>;
  commitFocusedSelectEdit(): Promise<EngineRuntimeSnapshot>;
  cancelFocusedSelectEdit(): Promise<EngineRuntimeSnapshot>;
}

export class FocusedControlEditController {
  constructor(private readonly host: FocusedControlEditHost) {}

  async applyKey(key: string): Promise<ControlEditDisposition> {
    const initial = this.host.getSnapshot() ?? (await this.host.loadSnapshot());
    if (initial.focusedSelectEditName) {
      return this.applyFocusedSelectEditKey(initial, key);
    }
    if (key === 'Enter' && !initial.focusedInputEditName) {
      const selectSnapshot = await this.host.beginFocusedSelectEdit();
      if (selectSnapshot.focusedSelectEditName) {
        await this.applyInteractiveSnapshot(selectSnapshot);
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
      snapshot = await this.host.beginFocusedInputEdit();
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

    if (key === 'Enter') {
      snapshot = await this.host.commitFocusedInputEdit();
    } else if (key === 'Escape') {
      snapshot = await this.host.cancelFocusedInputEdit();
    } else if (key === 'Backspace') {
      snapshot = await this.host.setFocusedInputEditDraft(
        (snapshot.focusedInputEditValue ?? '').slice(0, -1)
      );
    } else if (key.length === 1) {
      snapshot = await this.host.setFocusedInputEditDraft(
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

    await this.applyInteractiveSnapshot(snapshot);
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

    if (key === 'Enter') {
      snapshot = await this.host.commitFocusedSelectEdit();
    } else if (key === 'Escape') {
      snapshot = await this.host.cancelFocusedSelectEdit();
    } else if (key === 'ArrowUp') {
      snapshot = await this.host.moveFocusedSelectEdit(-1);
    } else if (key === 'ArrowDown') {
      snapshot = await this.host.moveFocusedSelectEdit(1);
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

    await this.applyInteractiveSnapshot(snapshot);
    this.host.recordTimeline('keyboard-select-edit-state', {
      key,
      handled: true,
      focusedSelectEditName: snapshot.focusedSelectEditName ?? null,
      focusedSelectEditValue: snapshot.focusedSelectEditValue ?? null,
      focusedLinkIndex: snapshot.focusedLinkIndex
    });
    return 'handled-stop';
  }

  private async applyInteractiveSnapshot(snapshot: EngineRuntimeSnapshot): Promise<void> {
    await this.host.renderSnapshot(snapshot);
    this.host.syncSnapshot(snapshot);
  }
}
