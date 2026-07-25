import { describe, expect, it } from 'vitest';
import type { HostExample } from '../../../../engine-wasm/examples/generated/examples';
import {
  createDeterministicFixtureFetch,
  fixtureUrlForExample
} from './deterministic-fixture-fetch';

const example: HostExample = {
  key: 'navigationFixture',
  label: 'Navigation fixture',
  description: 'Fixture',
  goal: 'Fixture',
  workItems: ['A2-01'],
  specItems: ['WML-R-006'],
  testingAc: ['Loads'],
  wml: '<wml><card id="home"><p>Fixture</p></card></wml>'
};

describe('deterministic browser fixture fetch', () => {
  it('returns a transport-shaped response without performing network I/O', async () => {
    const fetchFixture = createDeterministicFixtureFetch([example]);
    const url = fixtureUrlForExample(example.key);

    await expect(fetchFixture({ url })).resolves.toMatchObject({
      ok: true,
      status: 200,
      finalUrl: url,
      contentType: 'text/vnd.wap.wml',
      engineDeckInput: {
        wmlXml: example.wml,
        baseUrl: url,
        contentType: 'text/vnd.wap.wml'
      }
    });
  });

  it('rejects unknown and non-fixture URLs deterministically', async () => {
    const fetchFixture = createDeterministicFixtureFetch([example]);

    await expect(fetchFixture({ url: 'https://example.com/deck.wml' })).resolves.toMatchObject({
      ok: false,
      status: 404,
      error: {
        code: 'INVALID_REQUEST'
      }
    });
    await expect(
      fetchFixture({ url: 'http://fixtures.test/examples/%ZZ.wml' })
    ).resolves.toMatchObject({
      ok: false,
      status: 404
    });
  });
});
