import type { components } from './transport.openapi.generated';

type OpenApiFetchRequest = components['schemas']['FetchRequest'];

export type FetchRequest = Pick<OpenApiFetchRequest, 'url'> &
  Partial<Pick<OpenApiFetchRequest, 'method' | 'headers' | 'timeoutMs' | 'retries'>>;

export type FetchResponse = components['schemas']['FetchResponse'];

// Contract for the desktop host's transport boundary.
export interface TransportClient {
  fetchDeck(request: FetchRequest): Promise<FetchResponse>;
}

export interface HostSessionState {
  requestedUrl: string;
  finalUrl?: string;
  contentType?: string;
  activeCardId?: string;
  focusedLinkIndex?: number;
  externalNavigationIntent?: string;
  lastError?: string;
}
