#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DOC_ROOTS = [
  'README.md',
  'docs',
  'browser/README.md',
  'engine-wasm/README.md',
  'transport-rust/README.md',
  'wml-server/README.md'
];

export function isActiveDocPath(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  const segments = normalized.toLowerCase().split('/');
  const basename = segments.at(-1) ?? '';

  if (segments.some((segment) => segment === 'archive' || segment === 'legacy-tickets')) {
    return false;
  }
  if (basename.includes('archive')) {
    return false;
  }
  return !/(?:^|[_-])\d{4}-\d{2}(?:-\d{2})?(?:[_-]|\.md$)/i.test(basename);
}

function walkMarkdownFiles(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return [];
  }
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    return relativePath.endsWith('.md') && isActiveDocPath(relativePath) ? [relativePath] : [];
  }

  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .flatMap((entry) => {
      const child = path.join(relativePath, entry.name);
      if (!isActiveDocPath(child)) {
        return [];
      }
      if (entry.isDirectory()) {
        return walkMarkdownFiles(root, child);
      }
      return entry.isFile() && entry.name.endsWith('.md') ? [child] : [];
    })
    .sort();
}

function githubSlug(value) {
  let withoutTags = value;
  let previous;
  do {
    previous = withoutTags;
    withoutTags = withoutTags.replace(/<[^>]*>/g, '');
  } while (withoutTags !== previous);

  return withoutTags
    .replace(/!?(?:\[([^\]]*)\])\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/&[a-zA-Z0-9#]+;/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

export function markdownAnchors(source) {
  const anchors = new Set();
  const slugCounts = new Map();
  let fence = null;

  for (const line of source.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === marker) {
        fence = null;
      } else if (fence === null) {
        fence = marker;
      }
      continue;
    }
    if (fence !== null) {
      continue;
    }

    for (const match of line.matchAll(/\b(?:id|name)=["']([^"']+)["']/gi)) {
      anchors.add(match[1]);
    }

    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!heading) {
      continue;
    }
    const base = githubSlug(heading[1]);
    const count = slugCounts.get(base) ?? 0;
    anchors.add(count === 0 ? base : `${base}-${count}`);
    slugCounts.set(base, count + 1);
  }
  return anchors;
}

function stripLinkTitle(target) {
  const trimmed = target.trim().replace(/^<|>$/g, '');
  const title = trimmed.match(/^(\S+)(?:\s+["'][^"']*["'])$/);
  return title ? title[1] : trimmed;
}

function markdownTargets(source) {
  const targets = [];
  let fence = null;

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === marker) {
        fence = null;
      } else if (fence === null) {
        fence = marker;
      }
      continue;
    }
    if (fence !== null) {
      continue;
    }

    for (const match of line.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      targets.push({ line: index + 1, target: stripLinkTitle(match[1]) });
    }
    const reference = line.match(/^\s*\[[^\]]+\]:\s*(\S+)/);
    if (reference) {
      targets.push({ line: index + 1, target: stripLinkTitle(reference[1]) });
    }
  }
  return targets;
}

function resolveLocalTarget(root, sourceRelativePath, rawTarget) {
  if (rawTarget === '' || rawTarget.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(rawTarget)) {
    return null;
  }

  const [rawPath, rawAnchor = ''] = rawTarget.split('#', 2);
  const withoutQuery = rawPath.split('?', 1)[0];
  let decodedPath;
  let decodedAnchor;
  try {
    decodedPath = decodeURIComponent(withoutQuery);
    decodedAnchor = decodeURIComponent(rawAnchor);
  } catch {
    return { error: `invalid percent encoding in target \`${rawTarget}\`` };
  }

  const sourceDirectory = path.dirname(path.join(root, sourceRelativePath));
  let targetPath = decodedPath.startsWith('/')
    ? path.join(root, decodedPath.slice(1))
    : path.resolve(sourceDirectory, decodedPath || path.basename(sourceRelativePath));

  const relativeTarget = path.relative(root, targetPath);
  if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
    return { error: `target escapes the repository: \`${rawTarget}\`` };
  }
  if (!fs.existsSync(targetPath) && path.extname(targetPath) === '') {
    const markdownCandidate = `${targetPath}.md`;
    if (fs.existsSync(markdownCandidate)) {
      targetPath = markdownCandidate;
    }
  }
  if (!fs.existsSync(targetPath)) {
    return { error: `missing target \`${rawTarget}\`` };
  }
  if (
    decodedAnchor &&
    fs.statSync(targetPath).isFile() &&
    path.extname(targetPath).toLowerCase() === '.md'
  ) {
    const anchors = markdownAnchors(fs.readFileSync(targetPath, 'utf8'));
    if (!anchors.has(decodedAnchor)) {
      return {
        error: `missing anchor \`#${decodedAnchor}\` in \`${path.relative(root, targetPath)}\``
      };
    }
  }
  return null;
}

export function checkDocumentationLinks(root, docRoots = DEFAULT_DOC_ROOTS) {
  const files = [...new Set(docRoots.flatMap((entry) => walkMarkdownFiles(root, entry)))].sort();
  const failures = [];
  let linkCount = 0;

  for (const relativePath of files) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    for (const link of markdownTargets(source)) {
      const failure = resolveLocalTarget(root, relativePath, link.target);
      if (failure) {
        failures.push(`${relativePath}:${link.line}: ${failure.error}`);
      }
      linkCount += 1;
    }
  }

  return { failures, fileCount: files.length, linkCount };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const result = checkDocumentationLinks(root);
  if (result.failures.length > 0) {
    console.error(`Active documentation link check failed (${result.failures.length} errors).`);
    for (const failure of result.failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }
  console.log(
    `Active documentation links OK (${result.fileCount} files, ${result.linkCount} links parsed)`
  );
}
