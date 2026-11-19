import { beforeEach, describe, expect, it, vi } from 'vitest';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { saveTimelineFile } from './timeline-file-save';

vi.mock('@tauri-apps/plugin-dialog', () => ({ save: vi.fn() }));
vi.mock('@tauri-apps/plugin-fs', () => ({ writeTextFile: vi.fn() }));

describe('native timeline export', () => {
  beforeEach(() => vi.resetAllMocks());

  it('writes the selected file before reporting success', async () => {
    vi.mocked(save).mockResolvedValue('/chosen/timeline.json');
    vi.mocked(writeTextFile).mockResolvedValue();
    await expect(saveTimelineFile('{"schemaVersion":2}')).resolves.toBe(true);
    expect(writeTextFile).toHaveBeenCalledWith('/chosen/timeline.json', '{"schemaVersion":2}');
  });

  it('does not write or report success when the dialog is cancelled', async () => {
    vi.mocked(save).mockResolvedValue(null);
    await expect(saveTimelineFile('{}')).resolves.toBe(false);
    expect(writeTextFile).not.toHaveBeenCalled();
  });

  it('reports a safe failure when writing fails', async () => {
    vi.mocked(save).mockResolvedValue('/private/secret-name.json');
    vi.mocked(writeTextFile).mockRejectedValue(new Error('private file detail'));
    await expect(saveTimelineFile('{}')).rejects.toThrow('Unable to save timeline.');
  });

  it('reports a safe failure when the dialog fails', async () => {
    vi.mocked(save).mockRejectedValue(new Error('native dialog detail'));
    await expect(saveTimelineFile('{}')).rejects.toThrow('Unable to save timeline.');
    expect(writeTextFile).not.toHaveBeenCalled();
  });
});
