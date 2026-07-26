import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { registerBrowserComponents } from '../components';
import { mountBrowserShell } from './browser-shell-template';

// jsdom has no real layout engine (getBoundingClientRect returns zeros) and
// no <canvas> 2D context, so the two rules that depend on actual rendered
// geometry/pixels -- color-contrast and target-size -- cannot run
// meaningfully here. Those were checked manually against the live rendered
// shell instead (see the WBP-05 PR description); every other axe rule stays
// enabled because it only depends on DOM/ARIA structure, which jsdom models
// correctly.
const JSDOM_UNSUPPORTED_RULES = ['color-contrast', 'target-size'];

describe('host-chrome accessibility baseline', () => {
  it('has no automatically-detectable violations in the mounted shell', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    registerBrowserComponents();
    mountBrowserShell('wap://localhost/start.wml', 'local');

    const results = await axe.run(document.body, {
      rules: Object.fromEntries(JSDOM_UNSUPPORTED_RULES.map((id) => [id, { enabled: false }]))
    });

    const summary = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => node.target.join(' '))
    }));

    expect(summary).toEqual([]);
  });
});
