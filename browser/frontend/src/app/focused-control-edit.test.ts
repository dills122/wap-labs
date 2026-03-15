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

  it('supports backspace, escape, and commit while input edit is active', async () => {
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

    expect(await controller.applyKey('Enter')).toBe('handled');
    expect(host.commitFocusedInputEdit).toHaveBeenCalledTimes(1);
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
