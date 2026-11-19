import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { WAVES_CONFIG } from './waves-config';

/** Returns false when the user dismisses the native save dialog. */
export const saveTimelineFile = async (contents: string): Promise<boolean> => {
  try {
    const path = await save({
      defaultPath: WAVES_CONFIG.timelineExportFilename,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (path === null) return false;
    await writeTextFile(path, contents);
    return true;
  } catch {
    throw new Error('Unable to save timeline.');
  }
};
