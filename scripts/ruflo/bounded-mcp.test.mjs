import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const guard = fileURLToPath(new URL('./bounded-mcp.mjs', import.meta.url));
const fake = `let s='';process.stdin.setEncoding('utf8');process.stdin.on('data',c=>{s+=c;let i;while((i=s.indexOf('\\n'))>=0){const line=s.slice(0,i);s=s.slice(i+1);const r=JSON.parse(line);if(Object.hasOwn(r,'id'))process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:r.id,result:r.params??null})+'\\n')}});`;

async function exercise(chunks, expectedCode = 0) {
  const directory = mkdtempSync(join(tmpdir(), 'bounded-mcp-test-'));
  const fakePath = join(directory, 'server.cjs');
  writeFileSync(fakePath, fake);
  const child = spawn(process.execPath, [guard, fakePath], { stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdin.on('error', (error) => {
    if (error.code !== 'EPIPE') throw error;
  });
  let out = '';
  let err = '';
  child.stdout.setEncoding('utf8').on('data', (s) => {
    out += s;
  });
  child.stderr.setEncoding('utf8').on('data', (s) => {
    err += s;
  });
  for (const chunk of chunks) child.stdin.write(chunk);
  child.stdin.end();
  const [code] = await once(child, 'close');
  rmSync(directory, { recursive: true, force: true });
  assert.equal(code, expectedCode, err);
  return out
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const req = (id, params = {}) =>
  JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params });

test('forwards fragmented and coalesced valid requests', async () => {
  const line = req(1, { name: 'task_list', arguments: { filter: 'ok' } });
  const result = await exercise([line.slice(0, 17), line.slice(17) + '\n' + req(2) + '\n']);
  assert.deepEqual(result, [
    { jsonrpc: '2.0', id: 1, result: { name: 'task_list', arguments: { filter: 'ok' } } },
    { jsonrpc: '2.0', id: 2, result: {} }
  ]);
});

test('forwards a burst of valid requests under backpressure', async () => {
  const requests = Array.from({ length: 3000 }, (_, id) => req(id)).join('\n') + '\n';
  const results = await exercise([requests]);
  assert.equal(results.length, 3000);
  assert.equal(results[0].id, 0);
  assert.equal(results.at(-1).id, 2999);
});

test('rejects excessive collection, string and nesting while preserving following requests', async () => {
  const deep = {};
  let pointer = deep;
  for (let i = 0; i < 40; i++) {
    pointer.x = {};
    pointer = pointer.x;
  }
  const r = await exercise([
    req(1, { x: Array(300).fill(1) }) +
      '\n' +
      req(2, { x: 'x'.repeat(20000) }) +
      '\n' +
      req(3, deep) +
      '\n' +
      req(4) +
      '\n'
  ]);
  assert.deepEqual(
    r.map((x) => x.id),
    [1, 2, 3, 4]
  );
  assert.ok(r.slice(0, 3).every((x) => x.error?.code === -32600));
  assert.deepEqual(r[3].result, {});
});

test('closes on oversized request and response lines without an uncorrelated reply', async () => {
  for (const message of [
    req(8, { x: 'x'.repeat(300000) }),
    JSON.stringify({ jsonrpc: '2.0', id: 9, result: 'x'.repeat(300000) })
  ]) {
    assert.deepEqual(await exercise([`${message}\n`], 1), []);
  }
});

test('caps aggregate nodes even when every individual array is small', async () => {
  const params = { rows: Array.from({ length: 100 }, () => Array(100).fill(0)) };
  const r = await exercise([`${req(6, params)}\n${req(7)}\n`]);
  assert.equal(r[0].id, 6);
  assert.equal(r[0].error.code, -32600);
  assert.equal(r[1].id, 7);
});

test('closes when a message ID is too large to correlate safely', async () => {
  assert.deepEqual(await exercise([`${req('x'.repeat(20000))}\n`], 1), []);
});

test('reaps a child that ignores termination after a rejected oversized frame', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'bounded-mcp-test-'));
  const fakePath = join(directory, 'server.cjs');
  writeFileSync(
    fakePath,
    "process.on('SIGTERM',()=>{});process.stderr.write('ready');setInterval(()=>{},1000)"
  );
  const child = spawn(process.execPath, [guard, fakePath], { stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdin.on('error', (error) => {
    if (error.code !== 'EPIPE') throw error;
  });
  await once(child.stderr, 'data');
  child.stdin.end(`${req(11, { x: 'x'.repeat(300000) })}\n`);
  const [code] = await once(child, 'close');
  rmSync(directory, { recursive: true, force: true });
  assert.equal(code, 1);
});

test('rejects invalid UTF-8 and continues after the bad frame', async () => {
  const r = await exercise([Buffer.from([0xff, 0x0a]), `${req(10)}\n`]);
  assert.equal(r[0].error.code, -32700);
  assert.equal(r[1].id, 10);
});

test('rejects malformed JSON and JSON-RPC batches; notifications get no reply', async () => {
  const r = await exercise([
    '{bad}\n[]\n',
    JSON.stringify({ jsonrpc: '2.0', method: 'notify', params: { x: Array(300).fill(1) } }) + '\n',
    req(9) + '\n'
  ]);
  assert.equal(r[0].error.code, -32700);
  assert.equal(r[1].error.code, -32600);
  assert.equal(r[2].id, 9);
  assert.equal(r.length, 3);
});
