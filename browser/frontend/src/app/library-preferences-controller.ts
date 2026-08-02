import type {
  ApplicationSettingsV1,
  ApplicationStateV1,
  PersistedFavoriteV1
} from '../../../contracts/application-state';
import type { ApplicationCommandId } from '../../../contracts/generated/application-commands';
import { getApplicationStateStore, type ApplicationStateStore } from './application-state-store';
import {
  createFavorite,
  findFavoriteDuplicates,
  parseLocalExampleFavoriteTarget,
  parseNetworkFavoriteTarget,
  type Favorite,
  type FavoriteTarget
} from './favorites/favorite-model';
import { exportFavoritesJson, importFavoritesJson } from './favorites/favorite-import-export';
import { LOCAL_DECK_EXAMPLES } from './local-examples';
import { WAVES_COPY } from './waves-copy';

export interface LibraryPreferencesControllerOptions {
  store?: ApplicationStateStore;
  document?: Document;
  openTarget: (target: FavoriteTarget) => Promise<void>;
  currentTarget: () => { title: string; target: FavoriteTarget } | undefined;
  notify: (message: string) => void;
  download?: (filename: string, contents: string) => void;
  now?: () => Date;
  idFactory?: () => string;
}

const required = <T extends Element>(document: Document, selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing application surface element: ${selector}`);
  return element;
};

const toFavorite = (entry: PersistedFavoriteV1): Favorite | undefined => {
  const target =
    entry.target.kind === 'network'
      ? parseNetworkFavoriteTarget(entry.target.url)
      : parseLocalExampleFavoriteTarget(entry.target.exampleId, entry.target.fragment);
  if (!target.ok) return undefined;
  const result = createFavorite({
    id: entry.id,
    title: entry.title,
    target: target.value,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    ...(entry.profileId === undefined ? {} : { profileId: entry.profileId })
  });
  return result.ok ? result.favorite : undefined;
};

const toPersistedFavorite = (favorite: Favorite): PersistedFavoriteV1 => ({
  id: favorite.id,
  title: favorite.title,
  target:
    favorite.target.kind === 'network'
      ? {
          kind: 'network',
          url: favorite.target.url,
          canonicalUrl: favorite.target.canonicalUrl
        }
      : {
          kind: 'local-example',
          exampleId: favorite.target.exampleId,
          ...(favorite.target.fragment === undefined ? {} : { fragment: favorite.target.fragment })
        },
  createdAt: favorite.createdAt,
  updatedAt: favorite.updatedAt,
  ...(favorite.profileId === undefined ? {} : { profileId: favorite.profileId })
});

const defaultDownload = (document: Document, filename: string, contents: string): void => {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export class LibraryPreferencesController {
  private readonly document: Document;
  private readonly store: ApplicationStateStore;
  private readonly download: (filename: string, contents: string) => void;
  private readonly now: () => Date;
  private readonly idFactory: () => string;
  private state: ApplicationStateV1 | undefined;
  private favorites: Favorite[] = [];
  private writeAllowed = false;
  private opener: HTMLElement | undefined;
  private bound = false;

  constructor(private readonly options: LibraryPreferencesControllerOptions) {
    this.document = options.document ?? document;
    this.store = options.store ?? getApplicationStateStore();
    this.download =
      options.download ??
      ((filename, contents) => defaultDownload(this.document, filename, contents));
    this.now = options.now ?? (() => new Date());
    this.idFactory =
      options.idFactory ??
      (() => `favorite-${this.now().getTime()}-${Math.random().toString(16).slice(2)}`);
  }

  async init(): Promise<void> {
    const loaded = await this.store.load();
    this.state = loaded.state;
    this.writeAllowed = loaded.writeAllowed;
    this.favorites = loaded.state.favorites.entries.flatMap((entry) => {
      const favorite = toFavorite(entry);
      return favorite ? [favorite] : [];
    });
    this.bind();
    this.renderExamples();
    this.renderFavorites();
    this.renderPreferences();
    this.applyPresentationPreferences();
    this.syncMutationAvailability();
  }

  dispose(): void {
    if (!this.bound) return;
    this.bound = false;
    this.document.removeEventListener('keydown', this.handleKeydown, true);
  }

  commandHandlers(): Partial<Record<ApplicationCommandId, () => void>> {
    return {
      'app.add-favorite': () => void this.run(this.addCurrentFavorite),
      'app.library': () => this.openLibrary(),
      'app.preferences': () => this.openPreferences(),
      'app.import-favorites': () => this.requestImport(),
      'app.export-favorites': () => this.exportFavorites()
    };
  }

  private bind(): void {
    if (this.bound) return;
    this.bound = true;
    required<HTMLButtonElement>(this.document, '#btn-library').addEventListener('click', () =>
      this.openLibrary()
    );
    required<HTMLButtonElement>(this.document, '#btn-preferences').addEventListener('click', () =>
      this.openPreferences()
    );
    required<HTMLButtonElement>(this.document, '#btn-library-close').addEventListener('click', () =>
      this.closeSurfaces()
    );
    required<HTMLButtonElement>(this.document, '#btn-preferences-close').addEventListener(
      'click',
      () => this.closeSurfaces()
    );
    required<HTMLButtonElement>(this.document, '#btn-add-favorite').addEventListener(
      'click',
      () => void this.run(this.addCurrentFavorite)
    );
    required<HTMLButtonElement>(this.document, '#btn-import-favorites').addEventListener(
      'click',
      () => this.requestImport()
    );
    required<HTMLButtonElement>(this.document, '#btn-export-favorites').addEventListener(
      'click',
      () => this.exportFavorites()
    );
    required<HTMLInputElement>(this.document, '#favorites-import-file').addEventListener(
      'change',
      this.handleImportFile
    );
    required<HTMLFormElement>(this.document, '#preferences-form').addEventListener(
      'submit',
      (event) => {
        event.preventDefault();
        void this.run(this.savePreferences);
      }
    );
    required<HTMLButtonElement>(this.document, '#btn-reset-preferences').addEventListener(
      'click',
      () => void this.run(this.resetPreferences)
    );
    required<HTMLButtonElement>(this.document, '#btn-request-reset-all').addEventListener(
      'click',
      () => this.showResetConfirmation()
    );
    required<HTMLButtonElement>(this.document, '#btn-cancel-reset-all').addEventListener(
      'click',
      () => this.hideResetConfirmation()
    );
    required<HTMLButtonElement>(this.document, '#btn-confirm-reset-all').addEventListener(
      'click',
      () => void this.run(this.resetAll)
    );
    this.document.addEventListener('keydown', this.handleKeydown, true);
  }

  private readonly run = async (action: () => Promise<void>): Promise<void> => {
    try {
      await action();
    } catch (error) {
      this.options.notify(
        `Application data action failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  private openLibrary(announce = true): void {
    this.openSurface('#library-surface', '#btn-library', announce);
  }

  private openPreferences(): void {
    this.renderPreferences();
    this.openSurface('#preferences-surface', '#btn-preferences', true);
  }

  private openSurface(surfaceSelector: string, buttonSelector: string, announce: boolean): void {
    this.opener = this.document.activeElement as HTMLElement | undefined;
    const library = required<HTMLElement>(this.document, '#library-surface');
    const preferences = required<HTMLElement>(this.document, '#preferences-surface');
    library.hidden = surfaceSelector !== '#library-surface';
    preferences.hidden = surfaceSelector !== '#preferences-surface';
    required<HTMLButtonElement>(this.document, '#btn-library').setAttribute(
      'aria-expanded',
      String(!library.hidden)
    );
    required<HTMLButtonElement>(this.document, '#btn-preferences').setAttribute(
      'aria-expanded',
      String(!preferences.hidden)
    );
    required<HTMLButtonElement>(this.document, buttonSelector).setAttribute(
      'aria-expanded',
      'true'
    );
    const surface = required<HTMLElement>(this.document, surfaceSelector);
    surface.focus();
    if (announce) {
      this.options.notify(
        surfaceSelector === '#library-surface' ? 'Library opened.' : 'Preferences opened.'
      );
    }
  }

  private closeSurfaces(): void {
    required<HTMLElement>(this.document, '#library-surface').hidden = true;
    required<HTMLElement>(this.document, '#preferences-surface').hidden = true;
    required<HTMLButtonElement>(this.document, '#btn-library').setAttribute(
      'aria-expanded',
      'false'
    );
    required<HTMLButtonElement>(this.document, '#btn-preferences').setAttribute(
      'aria-expanded',
      'false'
    );
    this.hideResetConfirmation();
    this.opener?.focus();
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    const library = required<HTMLElement>(this.document, '#library-surface');
    const preferences = required<HTMLElement>(this.document, '#preferences-surface');
    if (library.hidden && preferences.hidden) return;
    event.preventDefault();
    this.closeSurfaces();
  };

  private renderExamples(): void {
    const list = required<HTMLElement>(this.document, '#library-example-list');
    list.replaceChildren();
    for (const example of LOCAL_DECK_EXAMPLES) {
      const row = this.document.createElement('div');
      row.className = 'library-row';
      const summary = this.document.createElement('div');
      const title = this.document.createElement('strong');
      title.textContent = example.label;
      const description = this.document.createElement('span');
      description.textContent = example.description;
      summary.append(title, description);
      const open = this.document.createElement('button');
      open.className = 'btn';
      open.type = 'button';
      open.textContent = WAVES_COPY.library.open;
      open.addEventListener('click', () => {
        const target = parseLocalExampleFavoriteTarget(example.key);
        if (target.ok) void this.run(async () => this.openAndClose(target.value));
      });
      row.append(summary, open);
      list.append(row);
    }
  }

  private renderFavorites(): void {
    const list = required<HTMLElement>(this.document, '#library-favorite-list');
    const summary = required<HTMLElement>(this.document, '#library-favorites-summary');
    list.replaceChildren();
    summary.textContent =
      this.favorites.length === 0
        ? WAVES_COPY.library.noFavorites
        : WAVES_COPY.library.favoriteCount(this.favorites.length);
    for (const favorite of this.favorites) {
      const row = this.document.createElement('div');
      row.className = 'library-row';
      const text = this.document.createElement('div');
      const title = this.document.createElement('strong');
      title.textContent = favorite.title;
      const target = this.document.createElement('span');
      target.textContent =
        favorite.target.kind === 'network'
          ? favorite.target.url
          : `Bundled example: ${favorite.target.exampleId}${favorite.target.fragment ?? ''}`;
      text.append(title, target);
      const actions = this.document.createElement('div');
      actions.className = 'library-row-actions';
      const open = this.document.createElement('button');
      open.className = 'btn';
      open.type = 'button';
      open.textContent = WAVES_COPY.library.open;
      open.addEventListener(
        'click',
        () => void this.run(async () => this.openAndClose(favorite.target))
      );
      const remove = this.document.createElement('button');
      remove.className = 'btn';
      remove.type = 'button';
      remove.textContent = WAVES_COPY.library.remove;
      remove.disabled = !this.writeAllowed;
      remove.addEventListener(
        'click',
        () => void this.run(async () => this.removeFavorite(favorite))
      );
      actions.append(open, remove);
      row.append(text, actions);
      list.append(row);
    }
  }

  private readonly addCurrentFavorite = async (): Promise<void> => {
    if (!this.state || !this.writeAllowed) throw new Error('Application state is read-only.');
    const candidate = this.options.currentTarget();
    if (!candidate) throw new Error('The current location is not safe to save as a favorite.');
    const timestamp = this.now().toISOString();
    const created = createFavorite({
      id: this.idFactory(),
      title: candidate.title,
      target: candidate.target,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    if (!created.ok) throw new Error(created.issues.map((issue) => issue.message).join(' '));
    if (findFavoriteDuplicates(this.favorites, created.favorite).length > 0) {
      this.openLibrary(false);
      this.options.notify('That location is already in Favorites.');
      return;
    }
    this.favorites.push(created.favorite);
    await this.persistFavorites();
    this.renderFavorites();
    this.openLibrary(false);
    this.options.notify(`Added favorite: ${created.favorite.title}`);
  };

  private async removeFavorite(favorite: Favorite): Promise<void> {
    this.favorites = this.favorites.filter((entry) => entry.id !== favorite.id);
    await this.persistFavorites();
    this.renderFavorites();
    this.options.notify(`Removed favorite: ${favorite.title}`);
  }

  private async openAndClose(target: FavoriteTarget): Promise<void> {
    this.closeSurfaces();
    await this.options.openTarget(target);
  }

  private async persistFavorites(): Promise<void> {
    if (!this.state) throw new Error('Application state has not loaded.');
    this.state = await this.store.save({
      ...this.state,
      favorites: { entries: this.favorites.map(toPersistedFavorite) }
    });
  }

  private requestImport(): void {
    if (!this.writeAllowed) {
      this.options.notify('Favorites cannot be imported while application state is read-only.');
      return;
    }
    required<HTMLInputElement>(this.document, '#favorites-import-file').click();
  }

  private readonly handleImportFile = (event: Event): void => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    void this.run(async () => {
      const imported = importFavoritesJson(await file.text(), this.favorites);
      if (imported.status === 'rejected') throw new Error(imported.message);
      this.favorites.push(...imported.favorites);
      await this.persistFavorites();
      this.renderFavorites();
      this.openLibrary(false);
      this.options.notify(
        `Imported ${imported.favorites.length} favorites; quarantined ${imported.quarantined.length} unsafe or invalid records.`
      );
    });
  };

  private exportFavorites(): void {
    this.download('waves-favorites.json', exportFavoritesJson(this.favorites));
    this.options.notify(`Exported ${this.favorites.length} favorites.`);
  }

  private renderPreferences(): void {
    if (!this.state) return;
    const settings = this.state.settings;
    required<HTMLSelectElement>(this.document, '#preference-default-mode').value =
      settings.defaultRunMode;
    required<HTMLSelectElement>(this.document, '#preference-start-behavior').value =
      settings.startBehavior;
    required<HTMLSelectElement>(this.document, '#preference-display-scale').value = String(
      settings.displayScalePercent
    );
    required<HTMLInputElement>(this.document, '#preference-high-contrast').checked =
      settings.highContrast;
    required<HTMLInputElement>(this.document, '#preference-reduced-motion').checked =
      settings.reducedMotion;
    required<HTMLInputElement>(this.document, '#preference-safe-restore').checked =
      settings.safeSessionRestore;
    required<HTMLInputElement>(this.document, '#preference-developer-mode').checked =
      settings.developerMode;
    required<HTMLInputElement>(this.document, '#preference-retention').value = String(
      settings.timelineRetention
    );
  }

  private readPreferences(): ApplicationSettingsV1 {
    const retention = Number.parseInt(
      required<HTMLInputElement>(this.document, '#preference-retention').value,
      10
    );
    return {
      displayScalePercent: Number.parseInt(
        required<HTMLSelectElement>(this.document, '#preference-display-scale').value,
        10
      ),
      theme: this.state?.settings.theme ?? 'system',
      highContrast: required<HTMLInputElement>(this.document, '#preference-high-contrast').checked,
      reducedMotion: required<HTMLInputElement>(this.document, '#preference-reduced-motion')
        .checked,
      defaultRunMode: required<HTMLSelectElement>(this.document, '#preference-default-mode')
        .value as ApplicationSettingsV1['defaultRunMode'],
      startBehavior: required<HTMLSelectElement>(this.document, '#preference-start-behavior')
        .value as ApplicationSettingsV1['startBehavior'],
      developerMode: required<HTMLInputElement>(this.document, '#preference-developer-mode')
        .checked,
      timelineRetention: Math.min(2000, Math.max(25, Number.isFinite(retention) ? retention : 200)),
      safeSessionRestore: required<HTMLInputElement>(this.document, '#preference-safe-restore')
        .checked
    };
  }

  private readonly savePreferences = async (): Promise<void> => {
    if (!this.state || !this.writeAllowed) throw new Error('Application state is read-only.');
    this.state = await this.store.save({ ...this.state, settings: this.readPreferences() });
    this.renderPreferences();
    this.applyPresentationPreferences();
    this.options.notify('Preferences saved.');
  };

  private readonly resetPreferences = async (): Promise<void> => {
    if (!this.writeAllowed) throw new Error('Application state is read-only.');
    this.state = await this.store.clear('settings');
    this.renderPreferences();
    this.applyPresentationPreferences();
    this.options.notify('Preferences reset to defaults.');
  };

  private showResetConfirmation(): void {
    const confirmation = required<HTMLElement>(this.document, '#reset-all-confirmation');
    confirmation.hidden = false;
    required<HTMLButtonElement>(this.document, '#btn-confirm-reset-all').focus();
  }

  private hideResetConfirmation(): void {
    required<HTMLElement>(this.document, '#reset-all-confirmation').hidden = true;
  }

  private readonly resetAll = async (): Promise<void> => {
    if (!this.writeAllowed) throw new Error('Application state is read-only.');
    this.state = await this.store.reset();
    this.favorites = [];
    this.renderFavorites();
    this.renderPreferences();
    this.applyPresentationPreferences();
    this.hideResetConfirmation();
    this.options.notify('All application data reset safely. The current deck remains open.');
  };

  private applyPresentationPreferences(): void {
    if (!this.state) return;
    const settings = this.state.settings;
    this.document.documentElement.dataset.hostTheme = settings.theme;
    this.document.documentElement.dataset.highContrast = String(settings.highContrast);
    this.document.documentElement.dataset.reducedMotion = String(settings.reducedMotion);
    const scale = this.document.querySelector<HTMLSelectElement>('#handset-scale-select');
    if (scale) {
      scale.value = String(settings.displayScalePercent);
      scale.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  private syncMutationAvailability(): void {
    for (const selector of [
      '#btn-add-favorite',
      '#btn-import-favorites',
      '#btn-save-preferences',
      '#btn-reset-preferences',
      '#btn-request-reset-all'
    ]) {
      required<HTMLButtonElement>(this.document, selector).disabled = !this.writeAllowed;
    }
  }
}
