import { describe, expect, it } from 'vitest';
import { createFirstPartyServiceEntry, serviceNavigationTarget } from './service-catalog';

const serviceInput = () => ({
  id: 'public-weather',
  title: 'Waves Weather',
  targetUrl: 'waps://services.example.test/weather.wml#today',
  publicationState: 'published',
  securityNotice: 'This first-party laboratory service is public and contains no account data.',
  requiredRouteId: 'public-lab',
  requiredProfileId: 'class-c-reference',
  ownerAvailability: 'available'
});

describe('first-party service catalog', () => {
  it('exposes a navigation target only for valid, published, owner-available entries', () => {
    const service = createFirstPartyServiceEntry(serviceInput());
    expect(service.validation.status).toBe('valid');
    expect(serviceNavigationTarget(service)).toEqual({
      allowed: true,
      target: expect.objectContaining({
        kind: 'network',
        url: 'waps://services.example.test/weather.wml#today'
      })
    });
  });

  it.each([
    [{ publicationState: 'unpublished' }, 'unpublished'],
    [{ ownerAvailability: 'unavailable' }, 'owner-unavailable'],
    [{ ownerAvailability: 'unknown' }, 'owner-unavailable']
  ])('blocks disabled or unpublished services', (overrides, reason) => {
    const service = createFirstPartyServiceEntry({ ...serviceInput(), ...overrides });
    expect(service.validation.status).toBe('valid');
    expect(serviceNavigationTarget(service)).toEqual({ allowed: false, reason });
  });

  it.each([
    { targetUrl: 'javascript:alert(1)' },
    { targetUrl: 'https://user:secret@services.example.test/weather.wml' },
    { securityNotice: '   ' },
    { requiredRouteId: '' },
    { publicationState: 'preview' },
    { ownerAvailability: 'maybe' }
  ])('blocks invalid service definitions', (overrides) => {
    const service = createFirstPartyServiceEntry({ ...serviceInput(), ...overrides });
    expect(service.validation.status).toBe('invalid');
    expect(serviceNavigationTarget(service)).toEqual({ allowed: false, reason: 'invalid' });
  });

  it('does not retain credential-bearing target text in an invalid catalog entry', () => {
    const service = createFirstPartyServiceEntry({
      ...serviceInput(),
      targetUrl: 'https://user:secret@services.example.test/weather.wml'
    });
    expect(service.validation.status).toBe('invalid');
    if (!('candidate' in service)) return;
    expect(service.candidate.target).toBe('[credential-bearing URL removed]');
    expect(JSON.stringify(service)).not.toContain('secret');
  });
});
