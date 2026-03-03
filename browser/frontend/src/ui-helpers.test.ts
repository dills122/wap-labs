import { describe, expect, it, vi } from 'vitest';
import { WAVES_COPY } from './app/waves-copy';
import { inferStatusTone, statusClassName, uiEvents } from './ui-helpers';

describe('ui-helpers', () => {
  it('infers status tones from deterministic message prefixes', () => {
    expect(inferStatusTone(`${WAVES_COPY.statusPrefix.error} boom`)).toBe('error');
    expect(inferStatusTone(`${WAVES_COPY.statusPrefix.fetchFailed} timeout`)).toBe('error');
    expect(inferStatusTone(`${WAVES_COPY.statusPrefix.loading}http://x`)).toBe('loading');
    expect(inferStatusTone(`${WAVES_COPY.statusPrefix.followingExternalIntent} http://x`)).toBe(
      'loading'
    );
    expect(inferStatusTone(WAVES_COPY.status.ready)).toBe('ok');
    expect(inferStatusTone(WAVES_COPY.status.fetchedAndLoadedDeck('http://x'))).toBe('ok');
    expect(inferStatusTone('Rendered current card.')).toBe('idle');
  });

  it('builds stable status classes', () => {
    expect(statusClassName('idle')).toBe('status status-idle');
    expect(statusClassName('loading')).toBe('status status-loading');
    expect(statusClassName('ok')).toBe('status status-ok');
    expect(statusClassName('error')).toBe('status status-error');
  });

  it('emits typed UI events', () => {
    const onStatus = vi.fn();
    const onTimeline = vi.fn();
    const unbindStatus = uiEvents.on('status', onStatus);
    const unbindTimeline = uiEvents.on('timeline', onTimeline);

    uiEvents.emit('status', { message: 'Ready.', tone: 'ok' });
    uiEvents.emit('timeline', { action: 'bootstrap', phase: 'state' });

    expect(onStatus).toHaveBeenCalledWith({ message: 'Ready.', tone: 'ok' });
    expect(onTimeline).toHaveBeenCalledWith({ action: 'bootstrap', phase: 'state' });

    unbindStatus();
    unbindTimeline();
  });
});
