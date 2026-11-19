// The art standard's rules that a test can check (CLAUDE.md, "The art standard"), beyond the rigs and
// motion (rig.test.js), placement and readability (placement.test.js) and sizes (assets.test.js).
// Anything that broke a rule when its check was written sits on that test's KNOWN list, to be fixed
// (and taken off the list when it is).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { NPCS } from '../src/data/npcs.js';
import { MOBS } from '../src/data/mobs.js';
import { MAPS } from '../src/data/maps.js';
import '../src/world/world.js';

test('recognisable silhouettes: no two named characters share a hair shape and headwear', () => {
  const seen = new Map();
  for (const n of Object.values(NPCS)) {
    if (!n.look) continue;
    const key = `${n.look.hairStyle}|${n.look.hat ?? ''}`;
    assert.ok(!seen.has(key), `${n.id} looks like ${seen.get(key)} (${key})`);
    seen.set(key, n.id);
  }
});

test('no stuck default smile: every character has a face of its own, and no face is on more than a fifth of them', () => {
  const looks = Object.values(NPCS).filter((n) => n.look);
  const count = {};
  for (const n of looks) {
    assert.ok(n.look.face, `${n.id} has no face chosen`);
    count[n.look.face] = (count[n.look.face] ?? 0) + 1;
  }
  for (const [face, k] of Object.entries(count)) assert.ok(k <= looks.length / 5, `${k} of ${looks.length} wear the '${face}' face`);
});

test('a full set of mouth shapes: the Mochi act with at least six', () => {
  const src = readFileSync(new URL('../src/render/mochi-anim.js', import.meta.url), 'utf8');
  const mouths = new Set([...src.matchAll(/mouth: '(\w+)'/g)].map((m) => m[1]));
  assert.ok(mouths.size >= 6, `${mouths.size} mouths: ${[...mouths].join(', ')}`);
});

// (Pieces that are one of a set by design: lanterns along a road, fruit trees in an orchard, lily
// pads and reeds round a pond. Each of these takes a variant, and two the same must not stand close.)
const STAMP_NEAR = 360;
// (Drawn differently for each place they stand: Lantern Lagoon's stilt houses take their colours and
// height from their spot, render/lagoon.js.)
const BY_PLACE = new Set(['stilthouse']);
// (To check and fix: the same race-course piece twice close together.)
const KNOWN_STAMPS = new Set(['mrace_climb:mr_pound@556/836', 'mrace_climb:mr_pound@836/1116', 'mrace_glide:mr_toro@180/430']);
test('no stamped copies: the same prop, drawn the same, never stands twice within a short walk on a map', () => {
  const bad = [];
  for (const map of Object.values(MAPS)) {
    const pieces = (map.townPieces ?? []).map(([kind, x, extra]) => ({ kind, x, key: `${kind}|${JSON.stringify(extra ?? null)}` }));
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const [a, b] = [pieces[i], pieces[j]];
        if (a.key !== b.key || BY_PLACE.has(a.kind) || Math.abs(a.x - b.x) >= STAMP_NEAR) continue;
        const id = `${map.id}:${a.kind}@${a.x}/${b.x}`;
        if (!KNOWN_STAMPS.has(id)) bad.push(id);
      }
    }
  }
  assert.deepEqual(bad, []);
});

const KNOWN_WINDUPS = new Set([]);
test('every enemy attack has a visible wind-up (a quarter of a second at least)', () => {
  const bad = [];
  for (const [id, mob] of Object.entries(MOBS)) {
    const f = mob.fight;
    // (Some never attack at all: a sapling that only stands and takes hits.)
    if (!f || !(mob.atk > 0)) continue;
    if (!((f.windup ?? 0) >= 0.25) && !KNOWN_WINDUPS.has(id)) bad.push(`${id} (${f.windup})`);
  }
  assert.deepEqual(bad, []);
});

// Every picture is cached by its name, so two monsters drawing a part under the same name would
// borrow each other's faces and bodies (whichever is drawn first wins). Seven pairs did this until
// the 2026-11-19 audit: Lady Marigold lost her face to the Meteor Golem.
test('own pictures: no two monster rig files share a part name prefix or a face name', () => {
  const dir = new URL('../src/render/mobs/', import.meta.url);
  const owner = new Map();
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.js'))) {
    const s = readFileSync(new URL(f, dir), 'utf8');
    const names = new Set();
    for (const m of s.matchAll(/pairOf\(\s*['"`]([^'"`]+)['"`]/g)) names.add(m[1]);
    for (const m of s.matchAll(/`([a-zA-Z0-9_]+)\|face\|/g)) names.add(`${m[1]}|face`);
    for (const n of names) {
      assert.ok(!owner.has(n) || owner.get(n) === f, `${f} and ${owner.get(n)} both draw pictures named "${n}"`);
      owner.set(n, f);
    }
  }
});
