import clsx from 'clsx';
import { createNanoEvents } from 'nanoevents';
import { WAVES_COPY } from './app/waves-copy';

export type StatusTone = 'idle' | 'loading' | 'ok' | 'error';

export interface TimelineEvent {
  action: string;
  phase: 'start' | 'ok' | 'error' | 'state';
}

export interface StatusEvent {
  message: string;
  tone: StatusTone;
}

export interface UiEvents {
  timeline: (event: TimelineEvent) => void;
  status: (event: StatusEvent) => void;
}

export const uiEvents = createNanoEvents<UiEvents>();

export const inferStatusTone = (message: string): StatusTone => {
  if (
    message.startsWith(WAVES_COPY.statusPrefix.error) ||
    message.startsWith(WAVES_COPY.statusPrefix.fetchFailed)
  ) {
    return 'error';
  }
  if (
    message.startsWith(WAVES_COPY.statusPrefix.loading) ||
    message.startsWith(WAVES_COPY.statusPrefix.followingExternalIntent)
  ) {
    return 'loading';
  }
  if (
    message.startsWith(WAVES_COPY.statusPrefix.ready) ||
    message.startsWith(WAVES_COPY.statusPrefix.fetchedAndLoaded)
  ) {
    return 'ok';
  }
  return 'idle';
};

export const statusClassName = (tone: StatusTone): string => clsx('status', `status-${tone}`);
