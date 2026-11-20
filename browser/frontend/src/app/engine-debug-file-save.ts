import { ENGINE_DEBUG_CAPTURE_FILENAME } from './engine-debug-session-controller';
import { saveTimelineFile } from './timeline-file-save';

export const saveEngineDebugCapture = async (
  contents: string,
  notify: (message: string, error: boolean) => void
): Promise<void> => {
  try {
    const saved = await saveTimelineFile(contents, ENGINE_DEBUG_CAPTURE_FILENAME);
    notify(saved ? 'Inspector capture saved.' : 'Inspector capture export cancelled.', false);
  } catch {
    notify('Unable to save Inspector capture.', true);
  }
};
