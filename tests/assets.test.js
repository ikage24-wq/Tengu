// The speed rules' size limits (CLAUDE.md, "Loading and size"): every sound, music track and
// effect strip stays under its limit. Strips already over when the limit was set are listed as
// KNOWN, to be cut down when next touched; a listed one that's been cut down must come off it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';

const KB = 1024;
const dir = (d) => new URL(`../assets/${d}/`, import.meta.url);
const sizes = (d, ext) => readdirSync(dir(d)).filter((f) => f.endsWith(ext)).map((f) => [f, statSync(new URL(f, dir(d))).size]);

const KNOWN_BIG_STRIPS = [];

test('sounds stay small: a sound effect 100 KB, an ambience loop 600 KB, a music track 2 MB', () => {
  for (const [f, s] of sizes('audio/rec', '.mp3')) assert.ok(s <= 100 * KB, `${f} is ${Math.round(s / KB)} KB`);
  for (const [f, s] of sizes('audio/amb', '.mp3')) assert.ok(s <= 600 * KB, `${f} is ${Math.round(s / KB)} KB`);
  for (const [f, s] of sizes('audio/music', '.mp3')) assert.ok(s <= 2048 * KB, `${f} is ${Math.round(s / KB)} KB`);
});

test('effect strips stay small: 600 KB, a big version 1.5 MB', () => {
  const over = sizes('fx', '.png').filter(([f, s]) => s > (f.endsWith('big.png') ? 1536 : 600) * KB).map(([f]) => f);
  assert.deepEqual(over.filter((f) => !KNOWN_BIG_STRIPS.includes(f)), [], 'new strips over the limit');
  assert.deepEqual(KNOWN_BIG_STRIPS.filter((f) => !over.includes(f)), [], 'cut down now: take them off the known list');
});
