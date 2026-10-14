import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { requestJson } from '../src/utils/requestJson.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const stall = (_url, { signal }) => new Promise((resolve, reject) => {
  if (signal.aborted) reject(signal.reason);
  else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
});

test('reads JSON and forwards request options', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/data');
    assert.equal(options.cache, 'no-store');
    return new Response(JSON.stringify({ total: 7 }));
  };
  assert.deepEqual(await requestJson('/api/data', { cache: 'no-store' }), { total: 7 });
});

test('reports server errors including throttling', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Please wait before retrying.' }), { status: 429 });
  await assert.rejects(requestJson('/api/data'), /Please wait before retrying/);
  globalThis.fetch = async () => new Response('<html>Unavailable</html>', { status: 503 });
  await assert.rejects(requestJson('/api/data'), /HTTP 503/);
});

test('times out a stalled server', async () => {
  globalThis.fetch = stall;
  await assert.rejects(requestJson('/api/data', { timeoutMs: 5 }), /took too long/);
});

test('cancels an in-flight request and honors an already aborted caller', async () => {
  globalThis.fetch = stall;
  const controller = new AbortController();
  const pending = requestJson('/api/data', { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  await assert.rejects(requestJson('/api/data', { signal: controller.signal }), { name: 'AbortError' });
});

test('keeps the timeout active while reading a stalled response body', async () => {
  globalThis.fetch = async (_url, { signal }) => ({ ok: true, json: () => stall(_url, { signal }) });
  await assert.rejects(requestJson('/api/data', { timeoutMs: 5 }), /took too long/);
});
