import type {
  EnginePresentationFrame,
  ScriptExecutionOutcome,
  ScriptInvocationOutcome
} from '../contracts/wml-engine';

export const representativeFrameFixture = {
  contractVersion: 3,
  frameId: 'fixture-frame',
  profileId: 'class-c-reference',
  viewport: { cols: 20, rows: 20, offsetRow: 0, contentRows: 2 },
  deck: {
    baseUrl: 'http://local.test/deck.wml',
    contentType: 'text/vnd.wap.wml'
  },
  card: { id: 'home' },
  rows: [
    { index: 0, segments: [{ type: 'text', x: 0, text: 'Status' }] },
    {
      index: 1,
      segments: [
        {
          type: 'focusable',
          x: 0,
          text: 'Next',
          focusId: 'focus:0',
          targetKind: 'link',
          focused: true
        }
      ]
    }
  ],
  hitRegions: [
    {
      x: 0,
      y: 1,
      width: 4,
      height: 1,
      actionId: 'focus:0',
      targetKind: 'link'
    }
  ],
  focus: { index: 0, focusId: 'focus:0', targetKind: 'link' },
  selection: { type: 'none' },
  affordances: [
    {
      actionId: 'focus:0',
      label: 'Next',
      enabled: true,
      source: 'focused-link',
      control: 'primary'
    }
  ],
  backAvailable: false
} satisfies EnginePresentationFrame;

export const representativeScriptErrorFixture = {
  ok: false,
  result: { invalid: true },
  trap: 'decode: empty compilation unit',
  errorClass: 'fatal',
  errorCategory: 'integrity',
  invocationAborted: true,
  navigationIntent: { type: 'none' },
  requiresRefresh: false
} satisfies ScriptExecutionOutcome;

export const representativeScriptEffectFixture = {
  navigationIntent: { type: 'go', href: '#next' },
  requiresRefresh: true,
  result: 'ok'
} satisfies ScriptInvocationOutcome;
