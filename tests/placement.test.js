// The art standard's placement and readability checks (CLAUDE.md, "The art standard"), on every
// map: what stands in the world rests on a floor, what stands still never overlaps, and the
// figures read against every background in greyscale.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS } from '../src/data/maps.js';
import { surfacesOf, standAt } from '../src/world/physics.js';
import { INK } from '../src/render/figure.js';

const on = (map, x, y, tol = 3) => surfacesOf(map).some((f) => x >= f.x1 - 2 && x <= f.x2 + 2 && Math.abs(f.yAt(x) - y) <= tol);

test('everything rests on something: portals and room objects stand on a floor', () => {
  // (Floating ledges, platforms, clouds and sky islands are floors themselves; a lamp's point is
  // where its light glows, not a prop.)
  for (const map of Object.values(MAPS)) {
    for (const p of map.portals ?? []) if (!p.hidden) assert.ok(on(map, p.x, p.y), `${map.id}: portal ${p.id} at ${p.x},${p.y} stands on a floor`);
    for (const o of map.objects ?? []) if (o.y != null && !o.float) assert.ok(on(map, o.x, o.y), `${map.id}: ${o.kind} at ${o.x},${o.y} stands on a floor`);
  }
});

test('nothing standing overlaps: people, portals, stoves, benches, machines and spots keep apart', () => {
  // (Players, bots and monsters on the move may pass through each other, as in any MMO.)
  for (const map of Object.values(MAPS)) {
    const things = [];
    for (const n of map.npcs ?? []) things.push({ k: `npc ${n.id}`, x: n.x, y: n.y ?? standAt(map, n.x), w: 26 });
    for (const p of map.portals ?? []) if (!p.hidden) things.push({ k: `portal ${p.id}`, x: p.x, y: p.y, w: 44 });
    for (const key of ['stove', 'bench', 'gacha']) if (typeof map[key] === 'number') things.push({ k: key, x: map[key], y: standAt(map, map[key]), w: 40 });
    for (const nd of map.nodes ?? []) things.push({ k: `${nd.kind} spot`, x: nd.x, y: nd.y, w: 28 });
    for (let i = 0; i < things.length; i++) {
      for (let j = i + 1; j < things.length; j++) {
        const [a, b] = [things[i], things[j]];
        if (a.y == null || b.y == null) continue;
        const clash = Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < 30;
        assert.ok(!clash, `${map.id}: ${a.k} at ${a.x} overlaps ${b.k} at ${b.x}`);
      }
    }
  }
});

// Relative luminance and contrast (WCAG), to judge a figure against a background in greyscale.
const lum = (hex) => {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

test('readability first: a figure stands out from every background colour of every map in greyscale', () => {
  // A figure is its dark outline round light skin and cloth: against each background colour one of
  // the two must hold at least 3:1, so the silhouette always reads.
  const SKIN = '#ffeae0';
  for (const map of Object.values(MAPS)) {
    const look = map.look ?? {};
    const colours = [...(look.sky ?? []), look.far, look.mid, look.midTrim, look.ground].filter((c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c));
    for (const c of colours) {
      const best = Math.max(contrast(INK, c), contrast(SKIN, c));
      assert.ok(best >= 3, `${map.id}: a figure reads against ${c} (${best.toFixed(2)}:1)`);
    }
  }
});
