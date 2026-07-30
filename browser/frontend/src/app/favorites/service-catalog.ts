import {
  parseNetworkFavoriteTarget,
  parseProfileId,
  type NetworkFavoriteTarget,
  type ProfileId
} from './favorite-model';

export type FirstPartyServiceId = string & { readonly __firstPartyServiceId: unique symbol };
export type FirstPartyServiceTitle = string & { readonly __firstPartyServiceTitle: unique symbol };
export type ServiceSecurityNotice = string & { readonly __serviceSecurityNotice: unique symbol };
export type RequiredRouteId = string & { readonly __requiredRouteId: unique symbol };

export type ServicePublicationState = 'unpublished' | 'published';
export type ServiceOwnerAvailability = 'unknown' | 'unavailable' | 'available';

export type ServiceValidationIssueCode =
  | 'blank-service-id'
  | 'blank-service-title'
  | 'invalid-service-target'
  | 'blank-security-notice'
  | 'blank-required-route'
  | 'invalid-required-profile'
  | 'invalid-publication-state'
  | 'invalid-owner-availability';

export interface ServiceValidationIssue {
  code: ServiceValidationIssueCode;
  message: string;
}

export interface FirstPartyServiceInput {
  id: string;
  title: string;
  targetUrl: string;
  publicationState: string;
  securityNotice: string;
  requiredRouteId: string;
  requiredProfileId?: string;
  ownerAvailability: string;
}

export interface ValidFirstPartyServiceEntry {
  id: FirstPartyServiceId;
  title: FirstPartyServiceTitle;
  target: NetworkFavoriteTarget;
  publicationState: ServicePublicationState;
  securityNotice: ServiceSecurityNotice;
  requiredRouteId: RequiredRouteId;
  requiredProfileId?: ProfileId;
  ownerAvailability: ServiceOwnerAvailability;
  validation: { status: 'valid' };
}

export interface InvalidFirstPartyServiceEntry {
  publicationState: string;
  ownerAvailability: string;
  candidate: {
    id?: string;
    title?: string;
    target: string;
  };
  validation: {
    status: 'invalid';
    issues: readonly ServiceValidationIssue[];
  };
}

export type FirstPartyServiceEntry = ValidFirstPartyServiceEntry | InvalidFirstPartyServiceEntry;
export type FirstPartyServiceCatalog = readonly FirstPartyServiceEntry[];

export type ServiceNavigationDecision =
  | { allowed: true; target: NetworkFavoriteTarget }
  | { allowed: false; reason: 'invalid' | 'unpublished' | 'owner-unavailable' };

const PUBLICATION_STATES: ReadonlySet<string> = new Set(['unpublished', 'published']);
const OWNER_AVAILABILITY_STATES: ReadonlySet<string> = new Set([
  'unknown',
  'unavailable',
  'available'
]);

const issue = (code: ServiceValidationIssueCode, message: string): ServiceValidationIssue => ({
  code,
  message
});

const safeTargetDescription = (targetUrl: string): string => {
  const parsed = parseNetworkFavoriteTarget(targetUrl);
  if (parsed.ok) return parsed.value.url;
  return parsed.issue.code === 'credential-bearing-url'
    ? '[credential-bearing URL removed]'
    : '[unsafe or invalid network target omitted]';
};

export const createFirstPartyServiceEntry = (
  input: FirstPartyServiceInput
): FirstPartyServiceEntry => {
  const issues: ServiceValidationIssue[] = [];
  const id = input.id.trim();
  const title = input.title.trim();
  const securityNotice = input.securityNotice.trim();
  const requiredRouteId = input.requiredRouteId.trim();
  const target = parseNetworkFavoriteTarget(input.targetUrl);
  const requiredProfile =
    input.requiredProfileId === undefined ? undefined : parseProfileId(input.requiredProfileId);

  if (!id) issues.push(issue('blank-service-id', 'First-party service ID must not be blank.'));
  if (!title)
    issues.push(issue('blank-service-title', 'First-party service title must not be blank.'));
  if (!target.ok) {
    issues.push(issue('invalid-service-target', target.issue.message));
  }
  if (!securityNotice) {
    issues.push(issue('blank-security-notice', 'First-party service security notice is required.'));
  }
  if (!requiredRouteId) {
    issues.push(issue('blank-required-route', 'First-party service required route is required.'));
  }
  if (requiredProfile?.ok === false) {
    issues.push(issue('invalid-required-profile', requiredProfile.issue.message));
  }
  if (!PUBLICATION_STATES.has(input.publicationState)) {
    issues.push(
      issue('invalid-publication-state', 'First-party service publication state is invalid.')
    );
  }
  if (!OWNER_AVAILABILITY_STATES.has(input.ownerAvailability)) {
    issues.push(
      issue('invalid-owner-availability', 'First-party service owner availability is invalid.')
    );
  }

  if (issues.length > 0 || !target.ok) {
    return {
      publicationState: input.publicationState,
      ownerAvailability: input.ownerAvailability,
      candidate: {
        ...(id ? { id: id.slice(0, 160) } : {}),
        ...(title ? { title: title.slice(0, 160) } : {}),
        target: safeTargetDescription(input.targetUrl)
      },
      validation: { status: 'invalid', issues }
    };
  }

  return {
    id: id as FirstPartyServiceId,
    title: title as FirstPartyServiceTitle,
    target: target.value,
    publicationState: input.publicationState as ServicePublicationState,
    securityNotice: securityNotice as ServiceSecurityNotice,
    requiredRouteId: requiredRouteId as RequiredRouteId,
    ...(requiredProfile?.ok ? { requiredProfileId: requiredProfile.value } : {}),
    ownerAvailability: input.ownerAvailability as ServiceOwnerAvailability,
    validation: { status: 'valid' }
  };
};

export const serviceNavigationTarget = (
  service: FirstPartyServiceEntry
): ServiceNavigationDecision => {
  if (!('target' in service)) return { allowed: false, reason: 'invalid' };
  if (service.publicationState !== 'published') {
    return { allowed: false, reason: 'unpublished' };
  }
  if (service.ownerAvailability !== 'available') {
    return { allowed: false, reason: 'owner-unavailable' };
  }
  return { allowed: true, target: service.target };
};
