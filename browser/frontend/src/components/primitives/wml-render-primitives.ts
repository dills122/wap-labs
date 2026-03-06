import type { DrawCmd, RenderList } from '../../../../contracts/engine';

export interface WmlRenderableSegment {
  kind: DrawCmd['type'];
  text: string;
  focused: boolean;
}

export interface WmlRenderableLine {
  y: number;
  segments: WmlRenderableSegment[];
}

export const mapRenderListToLines = (renderList: RenderList): WmlRenderableLine[] => {
  const byLine = new Map<number, WmlRenderableSegment[]>();
  for (const cmd of renderList.draw) {
    const current = byLine.get(cmd.y) ?? [];
    if (cmd.type === 'link') {
      current.push({
        kind: 'link',
        text: cmd.text,
        focused: cmd.focused
      });
    } else {
      current.push({
        kind: 'text',
        text: cmd.text,
        focused: false
      });
    }
    byLine.set(cmd.y, current);
  }

  return Array.from(byLine.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([y, segments]) => ({ y, segments }));
};

export const renderWmlViewportHtml = (renderList: RenderList): string => {
  return mapRenderListToLines(renderList)
    .map(({ segments }) => {
      const segmentHtml = segments
        .map((segment) => {
          const classes = ['wml-segment', `wml-segment-${segment.kind}`];
          if (segment.focused) {
            classes.push('is-focused');
          }
          return `<span class="${classes.join(' ')}">${escapeHtml(segment.text)}</span>`;
        })
        .join('');
      return `<div class="line">${segmentHtml}</div>`;
    })
    .join('');
};

const escapeHtml = (input: string): string =>
  input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
