#!/usr/bin/env node
// Defense in depth for local stdio MCP input. This does not patch Ruflo or Zod.
import { spawn } from 'node:child_process';
import { isAbsolute } from 'node:path';
import { TextDecoder } from 'node:util';

const MAX_LINE_BYTES = 262_144;
const MAX_STRING_BYTES = 16_384;
const MAX_COLLECTION_ENTRIES = 256;
const MAX_NODES = 8_192;
const MAX_DEPTH = 32;
const decoder = new TextDecoder('utf-8', { fatal: true });
const cli = process.argv[2];
if (!cli || !isAbsolute(cli) || process.argv.length !== 3) {
  console.error('Usage: node bounded-mcp.mjs /absolute/path/to/ruflo.js');
  process.exit(2);
}
const child = spawn(process.execPath, [cli, 'mcp', 'start'], { stdio: ['pipe', 'pipe', 'pipe'] });
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
let childClosed = false;
let inputEnded = false;
let waitingForDrain = false;
const lineBuffer = Buffer.allocUnsafe(MAX_LINE_BYTES);
let buffered = 0;
let failed = false;

function sendError(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`);
}
function failConnection(message) {
  if (failed) return;
  failed = true;
  console.error(message);
  process.exitCode = 1;
  process.stdin.destroy();
  child.kill();
  const forceKill = setTimeout(() => child.kill('SIGKILL'), 1000);
  forceKill.unref();
}
function append(part) {
  if (buffered + part.length > MAX_LINE_BYTES) {
    failConnection('MCP message exceeds size limit');
    return false;
  }
  if (part.length) {
    part.copy(lineBuffer, buffered);
    buffered += part.length;
  }
  return true;
}
function isBounded(value) {
  const pending = [[value, 0]];
  let nodes = 0;
  while (pending.length) {
    const [item, depth] = pending.pop();
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) return false;
    if (typeof item === 'string' && Buffer.byteLength(item) > MAX_STRING_BYTES) return false;
    if (typeof item === 'number' && !Number.isFinite(item)) return false;
    if (!item || typeof item !== 'object') continue;
    const entries = Array.isArray(item) ? item : Object.entries(item);
    if (entries.length > MAX_COLLECTION_ENTRIES) return false;
    if (Array.isArray(item)) {
      for (const value of entries) pending.push([value, depth + 1]);
    } else {
      for (const [key, value] of entries) {
        if (Buffer.byteLength(key) > MAX_STRING_BYTES) return false;
        pending.push([value, depth + 1]);
      }
    }
  }
  return true;
}
function processLine() {
  let request;
  try {
    request = JSON.parse(decoder.decode(lineBuffer.subarray(0, buffered)));
  } catch {
    sendError(null, -32700, 'Parse error');
    return;
  }
  const object = request && typeof request === 'object' && !Array.isArray(request);
  const hasId = object && Object.hasOwn(request, 'id');
  const validId =
    hasId &&
    (request.id === null ||
      typeof request.id === 'string' ||
      (typeof request.id === 'number' && Number.isFinite(request.id)));
  if (
    validId &&
    typeof request.id === 'string' &&
    Buffer.byteLength(request.id) > MAX_STRING_BYTES
  ) {
    failConnection('MCP message ID exceeds input limits');
    return;
  }
  const id = validId ? request.id : null;
  const isRequest = object && request.jsonrpc === '2.0' && typeof request.method === 'string';
  const isResponse =
    object &&
    request.jsonrpc === '2.0' &&
    validId &&
    !Object.hasOwn(request, 'method') &&
    Object.hasOwn(request, 'result') !== Object.hasOwn(request, 'error');
  if ((!isRequest && !isResponse) || (hasId && !validId)) {
    sendError(null, -32600, 'Invalid Request');
    return;
  }
  if (!isBounded(request)) {
    // Notifications have no response. Responses cannot receive a response either;
    // refusing an oversized one must terminate the connection instead.
    if (isResponse) {
      failConnection('MCP response exceeds input limits');
    } else if (hasId) {
      sendError(id, -32600, 'MCP message exceeds input limits');
    }
    return;
  }
  if (!child.stdin.write(`${JSON.stringify(request)}\n`) && !waitingForDrain) {
    waitingForDrain = true;
    process.stdin.pause();
    child.stdin.once('drain', () => {
      waitingForDrain = false;
      if (!failed) process.stdin.resume();
    });
  }
}
process.stdin.on('data', (chunk) => {
  let from = 0;
  for (;;) {
    const end = chunk.indexOf(10, from);
    if (end < 0) {
      append(chunk.subarray(from));
      break;
    }
    if (!append(chunk.subarray(from, end))) break;
    processLine();
    if (failed) break;
    buffered = 0;
    from = end + 1;
  }
});
process.stdin.on('end', () => {
  inputEnded = true;
  if (failed) return;
  if (buffered) processLine();
  if (!failed) child.stdin.end();
});
process.stdin.on('error', () => failConnection('Cannot read MCP input'));
process.stdout.on('error', () => failConnection('Cannot write MCP output'));
child.stdin.on('error', () => {
  if (!childClosed) {
    failConnection('Cannot write Ruflo input');
  }
});
child.on('error', (error) => {
  console.error(`Cannot start Ruflo: ${error.message}`);
  process.exitCode = 1;
  process.stdin.destroy();
});
child.on('exit', (code, signal) => {
  childClosed = true;
  if (!inputEnded) process.stdin.destroy();
  if (process.exitCode !== 1) process.exitCode = code ?? (signal ? 1 : 0);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    failConnection(`MCP proxy received ${signal}`);
  });
}
