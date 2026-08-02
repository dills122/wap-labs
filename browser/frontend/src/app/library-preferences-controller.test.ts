import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_APPLICATION_STATE_V1 } from '../../../contracts/application-state';
import { MemoryApplicationStateStore } from './application-state-store';
import { LibraryPreferencesController } from './library-preferences-controller';
import { applicationSurfacesTemplate } from './shell/application-surfaces-template';

const mount = (): void => {
  document.body.innerHTML = `
    <button id="btn-library">Library</button>
    <button id="btn-preferences">Preferences</button>
    <select id="handset-scale-select">
      <option value="75">75%</option>
      <option value="100">100%</option>
      <option value="125">125%</option>
      <option value="150">150%</option>
      <option value="200">200%</option>
    </select>
    ${applicationSurfacesTemplate()}
  `;
};

const flush = async (): Promise<void> => {
  await vi.waitFor(() => expect(document.querySelector('#library-favorite-list')).toBeTruthy());
  await Promise.resolve();
};

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-host-theme');
  document.documentElement.removeAttribute('data-high-contrast');
  document.documentElement.removeAttribute('data-reduced-motion');
});

describe('integrated Library and Preferences', () => {
  it('adds, opens, and removes the current favorite with one announcement per action', async () => {
    mount();
    const store = new MemoryApplicationStateStore();
    const openTarget = vi.fn(async () => undefined);
    const notify = vi.fn();
    const controller = new LibraryPreferencesController({
      store,
      openTarget,
      currentTarget: () => ({
        title: 'Basic navigation',
        target: {
          kind: 'local-example',
          exampleId: 'basic' as never,
          fragment: '#home' as never
        }
      }),
      notify,
      now: () => new Date('2026-08-02T12:00:00.000Z'),
      idFactory: () => 'favorite-basic'
    });
    await controller.init();

    document.querySelector<HTMLButtonElement>('#btn-add-favorite')?.click();
    await vi.waitFor(() => {
      expect(store.snapshot()?.favorites.entries).toHaveLength(1);
      expect(notify).toHaveBeenCalledTimes(1);
    });
    expect(notify).toHaveBeenLastCalledWith('Added favorite: Basic navigation');
    expect(notify).toHaveBeenCalledTimes(1);

    const favoriteActions = Array.from(
      document.querySelectorAll<HTMLButtonElement>('#library-favorite-list button')
    );
    favoriteActions.find((button) => button.textContent === 'Open')?.click();
    await vi.waitFor(() => expect(openTarget).toHaveBeenCalledTimes(1));
    expect(openTarget).toHaveBeenCalledWith({
      kind: 'local-example',
      exampleId: 'basic',
      fragment: '#home'
    });

    document.querySelector<HTMLButtonElement>('#btn-library')?.click();
    const remove = Array.from(
      document.querySelectorAll<HTMLButtonElement>('#library-favorite-list button')
    ).find((button) => button.textContent === 'Remove');
    remove?.click();
    await vi.waitFor(() => {
      expect(store.snapshot()?.favorites.entries).toHaveLength(0);
      expect(notify).toHaveBeenLastCalledWith('Removed favorite: Basic navigation');
    });
    expect(notify).toHaveBeenLastCalledWith('Removed favorite: Basic navigation');
    controller.dispose();
  });

  it('imports safe records, quarantines unsafe records, and exports the sanitized collection', async () => {
    mount();
    const store = new MemoryApplicationStateStore();
    const notify = vi.fn();
    const download = vi.fn();
    const controller = new LibraryPreferencesController({
      store,
      openTarget: async () => undefined,
      currentTarget: () => undefined,
      notify,
      download
    });
    await controller.init();

    const input = document.querySelector<HTMLInputElement>('#favorites-import-file');
    const documentJson = JSON.stringify({
      schemaVersion: 1,
      favorites: [
        {
          id: 'safe',
          title: 'Safe service',
          target: { kind: 'network', url: 'https://example.test/deck.wml' },
          createdAt: '2026-08-02T12:00:00.000Z',
          updatedAt: '2026-08-02T12:00:00.000Z'
        },
        {
          id: 'unsafe',
          title: 'Unsafe service',
          target: { kind: 'network', url: 'https://user:secret@example.test/deck.wml' },
          createdAt: '2026-08-02T12:00:00.000Z',
          updatedAt: '2026-08-02T12:00:00.000Z'
        }
      ]
    });
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [{ text: async () => documentJson }]
    });
    input?.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(store.snapshot()?.favorites.entries).toHaveLength(1));
    expect(notify).toHaveBeenLastCalledWith(
      'Imported 1 favorites; quarantined 1 unsafe or invalid records.'
    );

    controller.commandHandlers()['app.export-favorites']?.();
    expect(download).toHaveBeenCalledTimes(1);
    expect(download.mock.calls[0]?.[1]).toContain('https://example.test/deck.wml');
    expect(download.mock.calls[0]?.[1]).not.toContain('secret');
    controller.dispose();
  });

  it('persists host-only preferences and performs an explicit safe reset', async () => {
    mount();
    const store = new MemoryApplicationStateStore();
    const notify = vi.fn();
    const controller = new LibraryPreferencesController({
      store,
      openTarget: async () => undefined,
      currentTarget: () => undefined,
      notify
    });
    await controller.init();

    document.querySelector<HTMLButtonElement>('#btn-preferences')?.click();
    const scale = document.querySelector<HTMLSelectElement>('#preference-display-scale');
    const contrast = document.querySelector<HTMLInputElement>('#preference-high-contrast');
    const retention = document.querySelector<HTMLInputElement>('#preference-retention');
    if (scale) scale.value = '200';
    if (contrast) contrast.checked = true;
    if (retention) retention.value = '500';
    document
      .querySelector<HTMLFormElement>('#preferences-form')
      ?.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() =>
      expect(store.snapshot()?.settings).toMatchObject({
        displayScalePercent: 200,
        highContrast: true,
        timelineRetention: 500
      })
    );
    expect(document.documentElement.dataset.highContrast).toBe('true');
    expect(notify).toHaveBeenLastCalledWith('Preferences saved.');

    document.querySelector<HTMLButtonElement>('#btn-request-reset-all')?.click();
    expect(document.querySelector<HTMLElement>('#reset-all-confirmation')?.hidden).toBe(false);
    document.querySelector<HTMLButtonElement>('#btn-confirm-reset-all')?.click();
    await vi.waitFor(() =>
      expect(store.snapshot()?.settings).toEqual(DEFAULT_APPLICATION_STATE_V1.settings)
    );
    expect(notify).toHaveBeenLastCalledWith(
      'All application data reset safely. The current deck remains open.'
    );
    controller.dispose();
  });

  it('disables all mutation paths when native state loading is read-only', async () => {
    mount();
    const controller = new LibraryPreferencesController({
      store: new MemoryApplicationStateStore({ failReads: true }),
      openTarget: async () => undefined,
      currentTarget: () => undefined,
      notify: vi.fn()
    });
    await controller.init();
    for (const selector of [
      '#btn-add-favorite',
      '#btn-import-favorites',
      '#btn-save-preferences',
      '#btn-reset-preferences',
      '#btn-request-reset-all'
    ]) {
      expect(document.querySelector<HTMLButtonElement>(selector)?.disabled).toBe(true);
    }
    controller.dispose();
    await flush();
  });
});
