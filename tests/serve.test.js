// The dev server (`npm start`) tells browsers to revalidate every file, so a returning player never
// runs a stale module next to a new one (a blank game: "does not provide an export named ...").
// It otherwise behaves like python's http.server: folder index, slash redirect, listing, 404s.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { serve, typeOf } from '../tools/serve.mjs';

let server, base, dir;
before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tengu-serve-'));
  mkdirSync(join(dir, 'src'));
  mkdirSync(join(dir, 'tools'));
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>t</title>');
  writeFileSync(join(dir, 'src', 'kit.js'), 'export const wrapCount = 1;\n');
  writeFileSync(join(dir, 'tools', 'a b.html'), 'x');
  server = serve(dir);
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });

const get = (p, init) => fetch(base + p, { redirect: 'manual', ...init });

test('every reply says no-cache, with the right type for modules', async () => {
  for (const p of ['/', '/src/kit.js', '/nope.js', '/tools']) {
    assert.equal((await get(p)).headers.get('cache-control'), 'no-cache', p);
  }
  const js = await get('/src/kit.js');
  assert.match(js.headers.get('content-type'), /^text\/javascript/);
  assert.equal(await js.text(), 'export const wrapCount = 1;\n');
  for (const [f, t] of [['a.mjs', /javascript/], ['a.json', /json/], ['a.png', /png/], ['a.webp', /webp/], ['a.ogg', /ogg/],
    ['a.mp3', /mpeg/], ['a.wav', /wav/], ['a.woff2', /woff2/], ['a.css', /css/], ['a.svg', /svg/], ['a.HTML', /html/]]) {
    assert.match(typeOf(f), t, f);
  }
});

test('unchanged files come back as 304s; changed ones in full', async () => {
  const first = await get('/src/kit.js');
  const tag = first.headers.get('etag');
  assert.ok(tag);
  assert.equal((await get('/src/kit.js', { headers: { 'if-none-match': tag } })).status, 304);
  assert.equal((await get('/src/kit.js', { headers: { 'if-modified-since': first.headers.get('last-modified') } })).status, 304);
  writeFileSync(join(dir, 'src', 'kit.js'), 'export const wrapCount = 1;\nexport const settleBag = 2;\n');
  const fresh = await get('/src/kit.js', { headers: { 'if-none-match': tag } });
  assert.equal(fresh.status, 200);
  assert.match(await fresh.text(), /settleBag/);
});

test('folders, redirects, listings and 404s work like python http.server', async () => {
  assert.match(await (await get('/')).text(), /<title>t<\/title>/);
  const moved = await get('/tools?x=1');
  assert.equal(moved.status, 301);
  assert.equal(moved.headers.get('location'), '/tools/?x=1');
  const listing = await (await get('/tools/')).text();
  assert.match(listing, /href="a%20b\.html"/);
  assert.equal((await get('/tools/a%20b.html')).status, 200);
  assert.equal((await get('/nope.js')).status, 404);
  assert.equal((await get('/index.html/')).status, 404);
  assert.equal((await get('/src/kit.js?v=2')).status, 200);
  assert.equal((await get('/', { method: 'POST' })).status, 501);
  const head = await get('/src/kit.js', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

// Sent raw (fetch would tidy the dots away before they reach the server).
const raw = (path) => new Promise((ok, no) => {
  request(base, { path }, (res) => { res.resume(); ok(res.statusCode); }).on('error', no).end();
});

test('paths cannot climb out of the served folder', async () => {
  writeFileSync(join(dir, '..', 'tengu-serve-secret.txt'), 'secret');
  try {
    for (const p of ['/../tengu-serve-secret.txt', '/%2e%2e/tengu-serve-secret.txt', '/..%2ftengu-serve-secret.txt', '/src/../../tengu-serve-secret.txt']) {
      assert.equal(await raw(p), 404, p);
    }
  } finally { rmSync(join(dir, '..', 'tengu-serve-secret.txt'), { force: true }); }
});
