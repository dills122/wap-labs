import type {
  RenderList,
  ScriptExecutionOutcome,
  ScriptInvocationOutcome
} from '../contracts/wml-engine';

export const representativeRenderFixture = {
  draw: [
    { type: 'text', x: 0, y: 0, text: 'Status' },
    { type: 'link', x: 0, y: 1, text: 'Next', focused: true, href: '#next' }
  ]
} satisfies RenderList;

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
