import type { FetchResponse } from '../../../contracts/transport';

export const isNetworkUnavailableErrorCode = (code?: string): boolean =>
  code === 'TRANSPORT_UNAVAILABLE' || code === 'GATEWAY_TIMEOUT';

export const isProbeReachable = (response: FetchResponse): boolean => {
  if (response.ok) {
    return true;
  }
  // A non-zero status proves that an upstream endpoint answered, even when
  // the returned deck itself is unusable. Status-zero failures such as a
  // destination-policy rejection happen before any network exchange and must
  // not be presented as evidence that a WAP gateway is reachable.
  const errorCode = response.error?.code;
  return (
    response.status > 0 &&
    errorCode !== 'INVALID_REQUEST' &&
    !isNetworkUnavailableErrorCode(errorCode)
  );
};
