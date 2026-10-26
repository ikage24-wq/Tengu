// Content integrity: every reference in the data points at something real, and every ledge is reachable.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { MOBS } from '../src/data/mobs.js';
import { ITEMS } from '../src/data/items.js';
import { NPCS } from '../src/data/npcs.js';
import { QUESTS } from '../src/data/quests.js';
import { JOBS } from '../src/data/jobs.js';
import { SKILLS, skillAt } from '../src/data/skills.js';
import { createCharacter, gainExp } from '../src/core/character.js';
import { acceptQuest, questState, recordKill, completeQuest, trackedQuests, toggleTracked, TRACK_MAX, npcMap, objectiveHint } from '../src/core/quests.js';
import { addItem } from '../src/core/inventory.js';
import { surfacesOf, groundAt, ropeTop } from '../src/world/physics.js';
import { navOf } from '../src/world/nav.js';

test('every portal leads to a real map and a real portal there', () => {
  for (const map of Object.values(MAPS)) {
    for (const p of map.portals) {
      if (p.hidden) continue;
      const dest = MAPS[p.to];
      assert.ok(dest, `${map.id}.${p.id} -> missing map ${p.to}`);
      assert.ok(dest.portals.some((q) => q.id === p.toPortal), `${map.id}.${p.id} -> missing portal ${p.to}.${p.toPortal}`);
    }
  }
});

test('spawns, NPCs, and towns reference real things', () => {
  for (const map of Object.values(MAPS)) {
    assert.ok(MAPS[map.town], `${map.id} town`);
    for (const s of map.spawns) assert.ok(MOBS[s.mob], `${map.id} spawn ${s.mob}`);
    for (const n of map.npcs) assert.ok(NPCS[n.id], `${map.id} npc ${n.id}`);
  }
});

test('every surface can be reached from the way in, and left again', () => {
  for (const map of Object.values(MAPS)) {
    const surfaces = surfacesOf(map);
    const nav = navOf(map);
    const start = map.portals.find((p) => !p.hidden) ?? map.portals[0];
    const s0 = surfaces.findIndex((s) => start.x >= s.x1 && start.x <= s.x2 && Math.abs(s.yAt(start.x) - start.y) < 2);
    assert.ok(s0 >= 0, `${map.id}: the entrance stands on a surface`);
    const reach = (back) => {
      const seen = new Set([s0]);
      const queue = [s0];
      while (queue.length) {
        const i = queue.shift();
        surfaces.forEach((_, j) => {
          const linked = back ? nav.edges[j].some((e) => e.to === i) : nav.edges[i].some((e) => e.to === j);
          if (linked && !seen.has(j)) {
            seen.add(j);
            queue.push(j);
          }
        });
      }
      return seen;
    };
    const there = reach(false);
    const home = reach(true);
    surfaces.forEach((s, i) => {
      const name = s.ground ? `ground ${s.x1}-${s.x2}` : `ledge at (${s.x1}, ${s.y})`;
      assert.ok(there.has(i), `${map.id}: ${name} can't be reached`);
      assert.ok(home.has(i), `${map.id}: ${name} is a dead end`);
    });
  }
});

test('ropes hang from a surface and reach one below; ledges clear the ground', () => {
  for (const map of Object.values(MAPS)) {
    const surfaces = surfacesOf(map);
    for (const r of map.ropes) {
      const bottom = surfaces.some((s) => r.x >= s.x1 && r.x <= s.x2 && Math.abs(s.yAt(r.x) - r.bottom) < 2);
      assert.ok(ropeTop(map, r) && bottom, `${map.id}: rope at x=${r.x}`);
    }
    for (const p of map.platforms) {
      for (let x = p.x; x <= p.x + p.w; x += 10) assert.ok(groundAt(map, x) - p.y >= 44, `${map.id}: ledge at (${p.x}, ${p.y}) sits on the ground at x ${x}`);
    }
  }
});

test("town ledges stay clear of the NPCs' buildings", () => {
  for (const map of Object.values(MAPS).filter((m) => m.isTown)) {
    for (const n of map.npcs) {
      for (const p of map.platforms) {
        const over = p.x < n.x + 75 && p.x + p.w > n.x - 75;
        assert.ok(!over || p.y + (p.thick ?? 40) < groundAt(map, n.x) - 170, `${map.id}: ledge at (${p.x}, ${p.y}) hides ${n.id}'s building`);
      }
    }
  }
});

test('monsters and portals stand on something, and NPCs on flat ground', () => {
  for (const map of Object.values(MAPS)) {
    const surfaces = surfacesOf(map);
    const on = (x, y, slack) => surfaces.some((s) => x >= s.x1 && x <= s.x2 && Math.abs(s.yAt(x) - y) < slack);
    for (const sp of map.spawns) assert.ok(on(sp.x, sp.y, 4), `${map.id}: ${sp.mob} at (${sp.x}, ${sp.y})`);
    for (const p of map.portals) assert.ok(on(p.x, p.y, 2), `${map.id}: portal ${p.id}`);
    for (const n of map.npcs) assert.equal(groundAt(map, n.x - 12), groundAt(map, n.x + 12), `${map.id}: ${n.id}`);
  }
});

test('mob drops, NPC shops, and quest rewards are real items', () => {
  for (const m of Object.values(MOBS)) for (const d of m.drops) assert.ok(ITEMS[d.id], `${m.id} drop ${d.id}`);
  for (const n of Object.values(NPCS)) {
    for (const id of n.shop ?? []) assert.ok(ITEMS[id], `${n.id} sells ${id}`);
    for (const q of n.quests ?? []) assert.ok(QUESTS[q], `${n.id} quest ${q}`);
  }
  for (const q of Object.values(QUESTS)) {
    assert.ok(NPCS[q.giver], `${q.id} giver`);
    for (const r of q.rewards.items) assert.ok(ITEMS[r.id], `${q.id} reward ${r.id}`);
    for (const o of q.objectives) assert.ok(o.type === 'kill' ? MOBS[o.mob] : ITEMS[o.item], `${q.id} objective`);
  }
});

test('every job but Novice has skills, and every skill works at every level', () => {
  for (const job of Object.values(JOBS)) {
    assert.ok(Object.values(SKILLS).some((s) => s.job === job.id), `${job.id} has no skills`);
  }
  for (const s of Object.values(SKILLS)) {
    for (let lv = 1; lv <= s.maxLevel; lv++) {
      const at = skillAt(s.id, lv);
      if (s.type === 'passive') assert.ok(at.passive, s.id);
      else assert.ok(Number.isFinite(at.mp), `${s.id} mp at ${lv}`);
    }
  }
});

test('a quest runs from accept to rewards', () => {
  const c = createCharacter('Q', {});
  gainExp(c, 200);
  assert.equal(acceptQuest(c, 'first_steps'), true);
  assert.equal(questState(c, 'first_steps'), 'ready', 'no objectives means ready at once');
  const r = completeQuest(c, 'first_steps');
  assert.ok(r && c.inventory.equip.some((e) => e.id === 'bottom_0'));
  assert.equal(questState(c, 'fluffy'), 'available');
  acceptQuest(c, 'fluffy');
  addItem(c.inventory, 'fluff', 8);
  assert.equal(questState(c, 'fluffy'), 'ready');
  completeQuest(c, 'fluffy');
  assert.equal(questState(c, 'fluffy'), 'done');
  assert.equal(c.inventory.etc.length, 0, 'collected items are handed in');
  gainExp(c, 1000);
  acceptQuest(c, 'snail_trouble');
  for (let i = 0; i < 12; i++) recordKill(c, 'snailbun');
  assert.equal(questState(c, 'snail_trouble'), 'ready');
});

test('every skill plays a move the hero knows how to draw', async () => {
  const { MOVES } = await import('../src/render/moves.js');
  const { SKILLS } = await import('../src/data/skills.js');
  for (const s of Object.values(SKILLS)) {
    if (s.type === 'passive') continue;
    assert.ok(s.anim, `${s.id} has a move`);
    assert.ok(MOVES[s.anim], `${s.id} plays "${s.anim}", which exists`);
  }
});

test('NPCs wear real gear, and shops list their job-gear levels apart from it', () => {
  for (const npc of Object.values(NPCS)) {
    if (npc.gear) {
      assert.ok(!Array.isArray(npc.gear) && typeof npc.gear === 'object', `${npc.id} wears gear by slot`);
      for (const [slot, g] of Object.entries(npc.gear)) assert.ok(ITEMS[g.id], `${npc.id} ${slot}: ${g.id} exists`);
    }
    if (npc.stockLevels) assert.ok(Array.isArray(npc.stockLevels) && npc.stockLevels[0] <= npc.stockLevels[1], `${npc.id} stock levels`);
  }
});

test('every quest giver stands somewhere and every objective says where to go', () => {
  for (const q of Object.values(QUESTS)) {
    assert.ok(npcMap(q.giver), `${q.id}: giver ${q.giver} is on no map`);
    for (const o of q.objectives) assert.ok(objectiveHint(o), `${q.id}: no hint for ${o.mob ?? o.item}`);
  }
});

test('the tracker follows every quest until you pin your own, and new quests join your pins', () => {
  const char = createCharacter('Pinner', {});
  char.level = 20;
  char.quests.first_steps = { state: 'done' };
  for (const id of ['fluffy', 'snail_trouble', 'mush_menace']) acceptQuest(char, id);
  assert.deepEqual(trackedQuests(char), ['fluffy', 'snail_trouble', 'mush_menace']);
  assert.equal(toggleTracked(char, 'snail_trouble'), false);
  assert.deepEqual(trackedQuests(char), ['fluffy', 'mush_menace']);
  acceptQuest(char, 'tusk_trader');
  assert.deepEqual(trackedQuests(char), ['fluffy', 'mush_menace', 'tusk_trader']);
  // Finished quests drop off; the list never grows past the limit.
  char.quests.fluffy = { state: 'done' };
  assert.deepEqual(trackedQuests(char), ['mush_menace', 'tusk_trader']);
  toggleTracked(char, 'snail_trouble');
  assert.ok(trackedQuests(char).length <= TRACK_MAX);
});
