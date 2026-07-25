import type {
  FetchDeckRequest,
  FetchDeckResponse
} from '../../../contracts/generated/transport-host';
import { EXAMPLES, type HostExample } from '../../../../engine-wasm/examples/generated/examples';

const FIXTURE_ORIGINS = new Set(['http://fixtures.test', 'http://local.test']);
const WML_CONTENT_TYPE = 'text/vnd.wap.wml';

export const fixtureUrlForExample = (exampleKey: string): string =>
  `http://fixtures.test/examples/${encodeURIComponent(exampleKey)}.wml`;

export const createDeterministicFixtureFetch = (
  examples: readonly HostExample[] = EXAMPLES
): ((request: FetchDeckRequest) => Promise<FetchDeckResponse>) => {
  const examplesByKey = new Map(examples.map((example) => [example.key, example]));

  return async (request) => {
    const fixture = resolveFixture(request.url, examplesByKey);
    if (!fixture) {
      return {
        ok: false,
        status: 404,
        finalUrl: request.url,
        contentType: 'text/plain',
        error: {
          code: 'INVALID_REQUEST',
          message: `No deterministic Waves fixture is registered for ${request.url}`
        },
        timingMs: { encode: 0, udpRtt: 0, decode: 0 }
      };
    }

    return {
      ok: true,
      status: 200,
      finalUrl: fixture.url,
      contentType: WML_CONTENT_TYPE,
      wml: fixture.example.wml,
      timingMs: { encode: 0, udpRtt: 0, decode: 0 },
      engineDeckInput: {
        wmlXml: fixture.example.wml,
        baseUrl: fixture.url,
        contentType: WML_CONTENT_TYPE
      }
    };
  };
};

const resolveFixture = (
  candidate: string,
  examplesByKey: ReadonlyMap<string, HostExample>
): { example: HostExample; url: string } | null => {
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (!FIXTURE_ORIGINS.has(parsed.origin) || parsed.search || parsed.hash) {
    return null;
  }
  const match = parsed.pathname.match(/^\/examples\/([^/]+)\.wml$/);
  if (!match) {
    return null;
  }
  let key: string;
  try {
    key = decodeURIComponent(match[1] ?? '');
  } catch {
    return null;
  }
  const example = examplesByKey.get(key);
  return example ? { example, url: parsed.toString() } : null;
};
