// Life-skill spots on every map (docs/design/life-skills.md, part 1): gathering, mining, chopping
// and fishing spots, their finds, and the dishes made from them.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { ITEMS } from '../src/data/items.js';
import { MOBS } from '../src/data/mobs.js';
import { NODES, KINDS, GATHERED, MAP_TIER, TIER_FINDS, TIER_LV, FIND_TIER } from '../src/data/gathering.js';
import { SPOTS, FISH } from '../src/data/fishing.js';
import { DISHES } from '../src/data/cooking.js';
import { TIER_LEVEL } from '../src/core/life.js';
import { MOVES } from '../src/render/moves.js';
import { surfacesOf } from '../src/world/physics.js';

const nodesOf = (id) => NODES[id] ?? MAPS[id].nodes ?? [];
const finds = (n) => [...Object.keys(n.pool), ...(n.rare ? [n.rare[0]] : [])];
const same = (a, b) => Math.abs(a - b) < 10;
// The hunting maps of the plan's region table (towns and the tutorial isle have a few cozy ones).
const HUNTING = ['meadow1', 'meadow2', 'canyon', 'woods', 'glade', 'ruins', 'shrine', 'ridge', 'cave', 'springs', 'peak', 'sky', 'starfall'];

test("the tiers' levels match the life skills' own", () => {
  assert.deepEqual(TIER_LV, TIER_LEVEL);
});

test('every map in the region table has spots, each with its tier, level and a real find', () => {
  for (const [id, tier] of Object.entries(MAP_TIER)) {
    assert.ok(MAPS[id], id);
    const nodes = nodesOf(id);
    assert.ok(nodes.length >= 1, `${id} has spots`);
    if (HUNTING.includes(id)) assert.ok(nodes.length >= 5 && nodes.length <= 10, `${id}: ${nodes.length} spots, about 5-10 on a big hunting map`);
    for (const n of nodes) {
      assert.ok(KINDS[n.kind] && MOVES[KINDS[n.kind].move], `${id}: ${n.kind} has a move`);
      assert.equal(n.tier, tier, `${id}: a ${n.kind} spot is its region's tier`);
      assert.equal(n.lv, TIER_LV[n.tier], `${id}: a ${n.kind} spot needs its tier's level`);
      for (const f of finds(n)) {
        assert.ok(ITEMS[f]?.gathered, `${id} gives ${f}, an item`);
        assert.ok(FIND_TIER[f] <= tier, `${id}: ${f} is from this region or below`);
      }
      // Ore, gems, wood and fibre are the region's own (the plan's table).
      const own = TIER_FINDS[tier];
      if (n.kind === 'ore') assert.deepEqual([Object.keys(n.pool)[0], n.rare?.[0]], [own.ore, own.gem], `${id}: its tier's ore and gem`);
      if (n.kind === 'wood') assert.equal(Object.keys(n.pool)[0], own.wood, `${id}: its tier's wood`);
      if (n.kind === 'fiber') assert.equal(Object.keys(n.pool)[0], own.fiber, `${id}: its tier's fibre`);
      if (n.night) assert.equal(Object.keys(n.pool)[0], own.night, `${id}: its region's night rare`);
    }
  }
  // Each region has its ore, wood, fibre and night rare somewhere.
  for (let t = 1; t <= 4; t++) {
    const all = Object.keys(MAP_TIER).filter((id) => MAP_TIER[id] === t).flatMap((id) => nodesOf(id).flatMap(finds));
    for (const f of Object.values(TIER_FINDS[t])) assert.ok(all.includes(f), `tier ${t} has ${f}`);
  }
  // No dungeon room has any.
  for (const [id, m] of Object.entries(MAPS)) if (m.dungeon) assert.equal(nodesOf(id).length, 0, `${id} is a dungeon room`);
});

test('every find is an item with a price and a use, and sold or cooked somewhere', () => {
  for (const [id, , price, , desc] of GATHERED) {
    assert.ok(ITEMS[id]?.gathered, id);
    assert.ok(price > 0, `${id} sells`);
    const cooked = DISHES.some((d) => d.needs[id]);
    assert.ok(cooked || /craft bench/.test(desc), `${id} is cooked or crafted with`);
    assert.ok(Object.keys(MAP_TIER).some((m) => nodesOf(m).some((n) => finds(n).includes(id))), `${id} grows somewhere`);
  }
  for (const t of [1, 2, 3, 4]) for (const k of ['ore', 'gem', 'wood', 'fiber']) assert.match(ITEMS[TIER_FINDS[t][k]].desc, /craft bench/);
});

test('no spot sits within 120 px of a portal or a monster on its floor, or crowds a rope, spring or updraft', () => {
  for (const id of Object.keys(MAP_TIER)) {
    const m = MAPS[id];
    const surfs = surfacesOf(m);
    const spots = [...nodesOf(id), ...(SPOTS[id] ?? [])];
    for (const n of spots) {
      const what = `${id}: ${n.kind ?? 'fishing'} at ${n.x},${n.y}`;
      assert.ok(surfs.some((f) => n.x >= f.x1 && n.x <= f.x2 && Math.abs(f.yAt(n.x) - n.y) < 2), `${what} stands on something`);
      for (const p of m.portals) if (same(p.y ?? m.groundY, n.y)) assert.ok(Math.abs(p.x - n.x) >= 120, `${what} is ${Math.abs(p.x - n.x)} px from the ${p.id} portal`);
      for (const s of m.spawns) if (same(s.y, n.y)) assert.ok(Math.abs(s.x - n.x) >= 120, `${what} is ${Math.abs(s.x - n.x)} px from a ${s.mob}`);
      for (const s of m.springs ?? []) if (same(s.y, n.y)) assert.ok(Math.abs(s.x - n.x) >= 50, `${what} sits on a spring`);
      for (const u of m.updrafts ?? []) if (n.y >= u.top - 10 && n.y <= u.bottom + 10) assert.ok(Math.abs(u.x - n.x) >= u.w / 2 + 30, `${what} sits in an updraft`);
      // (A dock may have its rope down to it; a gathering spot keeps clear of rope ends.)
      if (n.kind) for (const r of m.ropes ?? []) if (same(r.top, n.y) || same(r.bottom, n.y)) assert.ok(Math.abs(r.x - n.x) >= 30, `${what} sits on a rope's end`);
      for (const o of spots) if (o !== n && same(o.y, n.y)) assert.ok(Math.abs(o.x - n.x) >= 60, `${what} crowds another spot`);
    }
  }
});

test('fishing spots are only by water, quiet nooks no monster reaches, each with its tier and its fish', () => {
  const WATER = ['pond', 'bigpond', 'glowpool', 'hotspring', 'waterfall'];
  for (const [id, spots] of Object.entries(SPOTS)) {
    const m = MAPS[id];
    for (const s of spots) {
      // Water: a pond or pool by the bobber, the sea (a harbor's, the sky's cloud sea), or a hole in the lake ice.
      const wet = s.ice || s.sky || ['harbor', 'sky'].includes(m.theme) || (m.deco ?? []).some((d) => WATER.includes(d[0]) && Math.abs(d[1] - s.bx) < 120);
      assert.ok(wet, `${id}: the fishing spot is by water`);
      assert.equal(s.tier, MAP_TIER[id], `${id}: the fishing spot is its region's tier`);
      for (const f of Object.keys(s.pool)) assert.ok(FISH.find((q) => q.id === f).tier <= s.tier, `${id}: ${f} belongs to this region or below`);
      const surf = surfacesOf(m).find((f) => s.x >= f.x1 && s.x <= f.x2 && Math.abs(f.yAt(s.x) - s.y) < 2);
      for (const sp of m.spawns) {
        if (MOBS[sp.mob].fly) assert.ok(Math.abs(sp.x - s.x) >= 240 || Math.abs(sp.y - s.y) >= 120, `${id}: a ${sp.mob} flies near the fishing spot`);
        else assert.ok(!(sp.x >= surf.x1 && sp.x <= surf.x2 && Math.abs(surf.yAt(sp.x) - sp.y) < 4), `${id}: a ${sp.mob} walks the fishing spot's floor`);
      }
    }
  }
  // Every region past the first has new fish of its own, and every fish has a tier.
  for (const f of FISH) assert.ok(f.tier >= 1 && f.tier <= 4, `${f.id} has a tier`);
  for (const t of [2, 3, 4]) assert.ok(FISH.filter((f) => f.tier === t).length >= 3, `tier ${t} has its own fish`);
});

test('dishes from the new finds scale with their tier', () => {
  for (const d of DISHES) assert.ok(d.tier >= 1 && d.tier <= 4, `${d.id} has a tier`);
  // Each find a cook can use, and every new fish, has a dish.
  for (const f of FISH) assert.ok(DISHES.some((d) => d.needs[f.id]), `${f.id} cooks into something`);
  // Higher tiers heal more on average.
  const avg = (t) => { const ds = DISHES.filter((d) => d.tier === t); return ds.reduce((s, d) => s + d.heal, 0) / ds.length; };
  for (let t = 2; t <= 4; t++) assert.ok(avg(t) > avg(t - 1), `tier ${t} dishes heal more than tier ${t - 1}`);
  // An attack dish of a higher tier gives more attack.
  const atk = (t) => Math.max(0, ...DISHES.filter((d) => d.tier === t).map((d) => d.values.watk ?? 0));
  for (let t = 2; t <= 4; t++) assert.ok(atk(t) > atk(t - 1), `tier ${t} attack dishes beat tier ${t - 1}`);
});
