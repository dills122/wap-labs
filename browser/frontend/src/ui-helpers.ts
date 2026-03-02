import clsx from 'clsx';
import { createNanoEvents } from 'nanoevents';

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
  if (message.startsWith('Error:') || message.startsWith('Fetch failed:')) {
    return 'error';
  }
  if (message.startsWith('Loading ') || message.startsWith('Following external intent:')) {
    return 'loading';
  }
  if (message.startsWith('Ready') || message.startsWith('Fetched and loaded')) {
    return 'ok';
  }
  return 'idle';
};

export const statusClassName = (tone: StatusTone): string =>
  clsx('status', `status-${tone}`);
