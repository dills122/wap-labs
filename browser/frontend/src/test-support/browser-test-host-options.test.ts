import { describe, expect, it } from 'vitest';
import { parseBrowserTestHostOptions } from './browser-test-host-options';

describe('parseBrowserTestHostOptions', () => {
  it('defaults to an immediate host when no latency is requested', () => {
    expect(parseBrowserTestHostOptions(new URLSearchParams())).toEqual({ commandDelaysMs: {} });
  });

  it('parses repeated allow-listed command delays', () => {
    const params = new URLSearchParams();
    params.append('host-delay', 'engineSetFocusedInputEditDraftFrame:40');
    params.append('host-delay', 'engineHandleInputFrame:25');

    expect(parseBrowserTestHostOptions(params)).toEqual({
      commandDelaysMs: {
        engineSetFocusedInputEditDraftFrame: 40,
        engineHandleInputFrame: 25
      }
    });
  });

  it.each([
    'engineDeleteEverything:40',
    'engineSetFocusedInputEditDraftFrame:0',
    'engineSetFocusedInputEditDraftFrame:5001',
    'engineSetFocusedInputEditDraftFrame:1.5',
    'engineSetFocusedInputEditDraftFrame',
    ':40'
  ])('rejects invalid host-delay value %s', (value) => {
    expect(() => parseBrowserTestHostOptions(new URLSearchParams({ 'host-delay': value }))).toThrow(
      /host-delay/
    );
  });

  it('rejects duplicate command delays instead of silently choosing one', () => {
    const params = new URLSearchParams();
    params.append('host-delay', 'engineHandleInputFrame:10');
    params.append('host-delay', 'engineHandleInputFrame:20');

    expect(() => parseBrowserTestHostOptions(params)).toThrow(/duplicate host-delay/);
  });
});
