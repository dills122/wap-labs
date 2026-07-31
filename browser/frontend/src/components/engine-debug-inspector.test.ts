import { beforeEach, describe, expect, it, vi } from 'vitest';
import { developerDrawerTemplate } from '../app/shell/developer-drawer-template';
import { EngineDebugStore } from '../app/engine-debug-store';
import { buildEngineDebugInspectorViewModel } from '../app/engine-debug-view-model';
import { bindDeveloperToolsWorkspace } from '../app/developer-tools-workspace';
import { bindEngineDebugInspector } from './engine-debug-inspector';

describe('engine debug Inspector component', () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `<main>${developerDrawerTemplate('window')}</main>`;
    const workspace = document.querySelector<HTMLElement>('#developer-tools-workspace');
    if (!workspace) throw new Error('missing Developer Tools workspace');
    root = workspace;
  });

  it('uses semantic controls and exposes the Inspector through roving keyboard tabs', async () => {
    const dispatch = vi.fn();
    const disposeWorkspace = bindDeveloperToolsWorkspace(root);
    const binding = bindEngineDebugInspector(root, { dispatch });
    const runtimeTab = root.querySelector<HTMLButtonElement>('#devtools-tab-runtime');
    const inspectorTab = root.querySelector<HTMLButtonElement>('#devtools-tab-inspector');

    runtimeTab?.click();
    runtimeTab?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await Promise.resolve();

    expect(inspectorTab?.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(inspectorTab);
    expect(root.querySelector('#btn-engine-debug-start')?.tagName).toBe('BUTTON');
    expect(root.querySelector('#engine-debug-query')?.getAttribute('maxlength')).toBe('80');
    expect(root.querySelector('[data-engine-debug-value="live"]')?.getAttribute('role')).toBe(
      'status'
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: 'visibility',
      surface: 'window',
      visible: true
    });

    binding.dispose();
    disposeWorkspace();
  });

  it('renders projected text with textContent and relays read-only capture actions', () => {
    const canary = 'CANARY-MASKED-ORIGINAL';
    const unsafeMaskedValue = {
      state: 'masked' as const,
      reason: 'password-input' as const,
      originalValue: canary
    };
    const store = new EngineDebugStore();
    store.appendEvents(
      [
        {
          seq: '1',
          kind: 'input.edit.draft',
          monotonicTimeMs: 1,
          payload: {
            type: 'input-edit-draft',
            name: 'password',
            value: unsafeMaskedValue
          }
        }
      ],
      0
    );
    const dispatch = vi.fn();
    const binding = bindEngineDebugInspector(root, { dispatch });
    binding.render(buildEngineDebugInspectorViewModel(store.getState()));

    expect(root.textContent).toContain('[masked: password-input]');
    expect(root.textContent).not.toContain(canary);
    expect(root.querySelector('[data-engine-debug-events] script')).toBeNull();

    root.querySelector<HTMLButtonElement>('#btn-engine-debug-start')?.click();
    const query = root.querySelector<HTMLInputElement>('#engine-debug-query');
    if (query) {
      query.value = 'input';
      query.dispatchEvent(new Event('input', { bubbles: true }));
    }

    expect(dispatch).toHaveBeenCalledWith({ type: 'start' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'filter', group: 'all', query: 'input' });
    binding.dispose();
  });
});
