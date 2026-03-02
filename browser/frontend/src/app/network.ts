import type { FetchResponse } from '../../../contracts/transport';

export const isNetworkUnavailableErrorCode = (code?: string): boolean =>
  code === 'TRANSPORT_UNAVAILABLE' || code === 'GATEWAY_TIMEOUT';

export const isProbeReachable = (response: FetchResponse): boolean => {
  if (response.ok) {
    return true;
  }
  return !isNetworkUnavailableErrorCode(response.error?.code);
};
