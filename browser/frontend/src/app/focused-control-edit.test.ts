import { describe, expect, it, vi } from 'vitest';
import type { FocusedControlEditHost } from './focused-control-edit';
import { FocusedControlEditController } from './focused-control-edit';
import { frame, snapshot } from './navigation-state.test-helpers';

const createHost = (
  overrides: Partial<FocusedControlEditHost> = {}
): {
  host: FocusedControlEditHost;
  recordTimeline: ReturnType<typeof vi.fn>;
  applyFrame: ReturnType<typeof vi.fn>;
  syncSnapshot: ReturnType<typeof vi.fn>;
} => {
  const recordTimeline = vi.fn();
  const applyFrame = vi.fn();
  const syncSnapshot = vi.fn();
  const host: FocusedControlEditHost = {
    getSnapshot: vi.fn(() => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })),
    loadSnapshot: vi.fn(async () => snapshot({ activeCardId: 'home', focusedLinkIndex: 0 })),
    syncSnapshot,
    recordTimeline,
    applyFrame,
    beginFocusedInputEdit: vi.fn(async () =>
      frame({
        activeCardId: 'home',
        focusedLinkIndex: 0,
        focusedInputEditName: 'username',
        focusedInputEditValue: 'A'
      })
    ),
    setFocusedInputEditDraft: vi.fn(async () =>
      frame({
        activeCardId: 'home',
        focusedLinkIndex: 0,
        focusedInputEditName: 'username',
        focusedInputEditValue: 'AB'
      })
    ),
    commitFocusedInputEdit: vi.fn(async () => frame({ activeCardId: 'home', focusedLinkIndex: 0 })),
    cancelFocusedInputEdit: vi.fn(async () => frame({ activeCardId: 'home', focusedLinkIndex: 0 })),
    beginFocusedSelectEdit: vi.fn(async () =>
      frame({
        activeCardId: 'home',
        focusedLinkIndex: 1,
        focusedSelectEditName: 'country',
        focusedSelectEditValue: 'France'
      })
    ),
    moveFocusedSelectEdit: vi.fn(async () =>
      frame({
        activeCardId: 'home',
        focusedLinkIndex: 1,
        focusedSelectEditName: 'country',
        focusedSelectEditValue: 'Japan'
      })
    ),
    commitFocusedSelectEdit: vi.fn(async () =>
      frame({ activeCardId: 'home', focusedLinkIndex: 1 })
    ),
    cancelFocusedSelectEdit: vi.fn(async () =>
      frame({ activeCardId: 'home', focusedLinkIndex: 1 })
    ),
    ...overrides
  };

  return { host, recordTimeline, applyFrame, syncSnapshot };
};

describe('FocusedControlEditController', () => {
  it('loads a snapshot when the presenter has not received one yet', async () => {
    const loaded = snapshot({
      activeCardId: 'login',
      focusedLinkIndex: 0,
      focusedInputEditName: 'username',
      focusedInputEditValue: 'dill'
    });
    const { host } = createHost({
      getSnapshot: vi.fn(() => null),
      loadSnapshot: vi.fn(async () => loaded)
    });
    const controller = new FocusedControlEditController(host);

    expect(await controller.applyKey('s')).toBe('handled');

    expect(host.loadSnapshot).toHaveBeenCalledOnce();
    expect(host.setFocusedInputEditDraft).toHaveBeenCalledWith('dills');
  });

  it('begins input edit for printable keys and appends the key to the draft', async () => {
    const { host, applyFrame, syncSnapshot } = createHost();
    const controller = new FocusedControlEditController(host);

    const result = await controller.applyKey('B');

    expect(result).toBe('handled');
    expect(host.beginFocusedInputEdit).toHaveBeenCalledTimes(1);
    expect(host.setFocusedInputEditDraft).toHaveBeenCalledWith('AB');
    expect(applyFrame).toHaveBeenCalledTimes(1);
    expect(syncSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        focusedInputEditName: 'username',
        focusedInputEditValue: 'AB'
      })
    );
  });

  it('appends to an active input draft without beginning a second edit session', async () => {
    const { host } = createHost({
      getSnapshot: vi.fn(() =>
        snapshot({
          activeCardId: 'login',
          focusedLinkIndex: 0,
          focusedInputEditName: 'username',
          focusedInputEditValue: 'user'
        })
      )
    });
    const controller = new FocusedControlEditController(host);

    expect(await controller.applyKey('1')).toBe('handled');

    expect(host.beginFocusedInputEdit).not.toHaveBeenCalled();
    expect(host.setFocusedInputEditDraft).toHaveBeenCalledWith('user1');
  });

  it('starts an empty input and preserves a printable space in its draft', async () => {
    const { host } = createHost({
      beginFocusedInputEdit: vi.fn(async () =>
        frame({
          activeCardId: 'login',
          focusedLinkIndex: 0,
          focusedInputEditName: 'username',
          focusedInputEditValue: ''
        })
      )
    });
    const controller = new FocusedControlEditController(host);

    expect(await controller.applyKey(' ')).toBe('handled');

    expect(host.setFocusedInputEditDraft).toHaveBeenCalledWith(' ');
  });

  it('returns unhandled for non-editing non-printable keys', async () => {
    const { host, recordTimeline } = createHost();
    const controller = new FocusedControlEditController(host);

    const result = await controller.applyKey('ArrowLeft');

    expect(result).toBe('unhandled');
    expect(host.beginFocusedInputEdit).not.toHaveBeenCalled();
    expect(recordTimeline).toHaveBeenCalledWith(
      'keyboard-input-edit-state',
      expect.objectContaining({ key: 'ArrowLeft', handled: false, focusedInputEditName: null })
    );
  });

  it('begins input edit for Backspace and removes the final draft character', async () => {
    const { host, applyFrame, syncSnapshot, recordTimeline } = createHost();
    const controller = new FocusedControlEditController(host);

    const result = await controller.applyKey('Backspace');

    expect(result).toBe('handled');
    expect(host.beginFocusedInputEdit).toHaveBeenCalledTimes(1);
    expect(host.setFocusedInputEditDraft).toHaveBeenCalledWith('');
    expect(applyFrame).toHaveBeenCalledTimes(1);
    expect(syncSnapshot).toHaveBeenCalledTimes(1);
    expect(recordTimeline).toHaveBeenLastCalledWith(
      'keyboard-input-edit-state',
      expect.not.objectContaining({ focusedInputEditValue: expect.anything() })
    );
  });

  it('returns Backspace unhandled when the engine reports a non-input focus target', async () => {
    const { host } = createHost({
      beginFocusedInputEdit: vi.fn(async () => frame({ activeCardId: 'home', focusedLinkIndex: 1 }))
    });
    const controller = new FocusedControlEditController(host);

    const result = await controller.applyKey('Backspace');

    expect(result).toBe('unhandled');
    expect(host.beginFocusedInputEdit).toHaveBeenCalledTimes(1);
    expect(host.setFocusedInputEditDraft).not.toHaveBeenCalled();
  });

  it('supports backspace and escape while deferring input commit to the engine', async () => {
    const { host } = createHost({
      getSnapshot: vi.fn(() =>
        snapshot({
          activeCardId: 'home',
          focusedLinkIndex: 0,
          focusedInputEditName: 'username',
          focusedInputEditValue: 'AB'
        })
      )
    });
    const controller = new FocusedControlEditController(host);

    expect(await controller.applyKey('Backspace')).toBe('handled');
    expect(host.setFocusedInputEditDraft).toHaveBeenCalledWith('A');

    expect(await controller.applyKey('Escape')).toBe('handled');
    expect(host.cancelFocusedInputEdit).toHaveBeenCalledTimes(1);

    expect(await controller.applyKey('Enter')).toBe('unhandled');
    expect(host.commitFocusedInputEdit).not.toHaveBeenCalled();
    expect(host.recordTimeline).toHaveBeenLastCalledWith(
      'keyboard-input-edit-state',
      expect.objectContaining({
        key: 'Enter',
        handled: false,
        phase: 'defer-to-engine'
      })
    );
  });

  it('applies the engine frame returned when input editing is cancelled', async () => {
    const cancelled = frame({
      activeCardId: 'login',
      focusedLinkIndex: 0,
      focusedInputEditName: undefined,
      focusedInputEditValue: undefined
    });
    const { host, applyFrame, syncSnapshot } = createHost({
      getSnapshot: vi.fn(() =>
        snapshot({
          activeCardId: 'login',
          focusedLinkIndex: 0,
          focusedInputEditName: 'username',
          focusedInputEditValue: 'temporary'
        })
      ),
      cancelFocusedInputEdit: vi.fn(async () => cancelled)
    });
    const controller = new FocusedControlEditController(host);

    expect(await controller.applyKey('Escape')).toBe('handled');

    expect(applyFrame).toHaveBeenCalledWith(cancelled);
    expect(syncSnapshot).toHaveBeenCalledWith(cancelled.snapshot);
  });

  it('does not publish a frame when a draft update is rejected', async () => {
    const { host, applyFrame, syncSnapshot } = createHost({
      getSnapshot: vi.fn(() =>
        snapshot({
          activeCardId: 'login',
          focusedLinkIndex: 0,
          focusedInputEditName: 'pin',
          focusedInputEditValue: '12'
        })
      ),
      setFocusedInputEditDraft: vi.fn(async () => {
        throw new Error('draft rejected');
      })
    });
    const controller = new FocusedControlEditController(host);

    await expect(controller.applyKey('3')).rejects.toThrow('draft rejected');

    expect(applyFrame).not.toHaveBeenCalled();
    expect(syncSnapshot).not.toHaveBeenCalled();
  });

  it('falls back to normal Enter handling when no select editor can be engaged', async () => {
    const { host } = createHost({
      beginFocusedSelectEdit: vi.fn(async () =>
        frame({ activeCardId: 'login', focusedLinkIndex: 0 })
      )
    });
    const controller = new FocusedControlEditController(host);

    expect(await controller.applyKey('Enter')).toBe('unhandled');

    expect(host.beginFocusedSelectEdit).toHaveBeenCalledOnce();
    expect(host.commitFocusedSelectEdit).not.toHaveBeenCalled();
    expect(host.beginFocusedInputEdit).not.toHaveBeenCalled();
  });

  it('engages select edit on enter and handles movement plus exit keys', async () => {
    const { host, applyFrame, syncSnapshot } = createHost();
    const controller = new FocusedControlEditController(host);

    expect(await controller.applyKey('Enter')).toBe('handled-stop');
    expect(host.beginFocusedSelectEdit).toHaveBeenCalledTimes(1);

    const engagedSnapshot = snapshot({
      activeCardId: 'home',
      focusedLinkIndex: 1,
      focusedSelectEditName: 'country',
      focusedSelectEditValue: 'France'
    });
    vi.mocked(host.getSnapshot).mockReturnValue(engagedSnapshot);

    expect(await controller.applyKey('ArrowDown')).toBe('handled-stop');
    expect(host.moveFocusedSelectEdit).toHaveBeenCalledWith(1);

    expect(await controller.applyKey('Escape')).toBe('handled-stop');
    expect(host.cancelFocusedSelectEdit).toHaveBeenCalledTimes(1);

    expect(await controller.applyKey('Enter')).toBe('handled-stop');
    expect(host.commitFocusedSelectEdit).toHaveBeenCalledTimes(1);
    expect(applyFrame).toHaveBeenCalled();
    expect(syncSnapshot).toHaveBeenCalled();
  });

  it('moves an active select upward with a negative delta', async () => {
    const { host } = createHost({
      getSnapshot: vi.fn(() =>
        snapshot({
          activeCardId: 'profile',
          focusedLinkIndex: 1,
          focusedSelectEditName: 'country',
          focusedSelectEditValue: 'Japan'
        })
      )
    });
    const controller = new FocusedControlEditController(host);

    expect(await controller.applyKey('ArrowUp')).toBe('handled-stop');

    expect(host.moveFocusedSelectEdit).toHaveBeenCalledWith(-1);
  });

  it('does not publish a select frame when committing the edit fails', async () => {
    const { host, applyFrame, syncSnapshot } = createHost({
      getSnapshot: vi.fn(() =>
        snapshot({
          activeCardId: 'profile',
          focusedLinkIndex: 1,
          focusedSelectEditName: 'country',
          focusedSelectEditValue: 'France'
        })
      ),
      commitFocusedSelectEdit: vi.fn(async () => {
        throw new Error('select commit failed');
      })
    });
    const controller = new FocusedControlEditController(host);

    await expect(controller.applyKey('Enter')).rejects.toThrow('select commit failed');

    expect(applyFrame).not.toHaveBeenCalled();
    expect(syncSnapshot).not.toHaveBeenCalled();
  });

  it('records unhandled keys while a select edit is active', async () => {
    const { host, recordTimeline } = createHost({
      getSnapshot: vi.fn(() =>
        snapshot({
          activeCardId: 'home',
          focusedLinkIndex: 1,
          focusedSelectEditName: 'country',
          focusedSelectEditValue: 'France'
        })
      )
    });
    const controller = new FocusedControlEditController(host);

    const result = await controller.applyKey('x');

    expect(result).toBe('unhandled');
    expect(recordTimeline).toHaveBeenCalledWith(
      'keyboard-select-edit-state',
      expect.objectContaining({ key: 'x', handled: false, focusedSelectEditName: 'country' })
    );
  });
});
