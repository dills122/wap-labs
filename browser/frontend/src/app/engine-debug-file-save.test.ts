import { describe, expect, it, vi } from 'vitest';
import { saveEngineDebugCapture } from './engine-debug-file-save';
import { saveTimelineFile } from './timeline-file-save';

vi.mock('./timeline-file-save', () => ({ saveTimelineFile: vi.fn() }));

describe('native Inspector capture export', () => {
  it('reports success only after the selected capture is written', async () => {
    vi.mocked(saveTimelineFile).mockResolvedValueOnce(true);
    const notify = vi.fn();
    await saveEngineDebugCapture('{"schemaVersion":1}', notify);
    expect(saveTimelineFile).toHaveBeenCalledWith(
      '{"schemaVersion":1}',
      'waves-engine-debug-capture-v1.json'
    );
    expect(notify).toHaveBeenCalledWith('Inspector capture saved.', false);
  });

  it('reports cancellation without claiming a save', async () => {
    vi.mocked(saveTimelineFile).mockResolvedValueOnce(false);
    const notify = vi.fn();
    await saveEngineDebugCapture('{}', notify);
    expect(notify).toHaveBeenCalledWith('Inspector capture export cancelled.', false);
  });

  it('reports a safe failure without exposing file paths', async () => {
    vi.mocked(saveTimelineFile).mockRejectedValueOnce(new Error('/private/secret'));
    const notify = vi.fn();
    await saveEngineDebugCapture('{}', notify);
    expect(notify).toHaveBeenCalledWith('Unable to save Inspector capture.', true);
  });
});
