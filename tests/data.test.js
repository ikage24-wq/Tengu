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
import { acceptQuest, questState, recordKill, completeQuest } from '../src/core/quests.js';
import { addItem } from '../src/core/inventory.js';

const JUMP_REACH = 100;

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

test('every ledge is reachable by a jump or a rope', () => {
  for (const map of Object.values(MAPS)) {
    const surfaces = [{ x: 0, y: map.groundY, w: map.width }, ...map.platforms];
    for (const p of map.platforms) {
      const fromBelow = surfaces.some((s) => s !== p && s.y > p.y && s.y - p.y <= JUMP_REACH
        && s.x < p.x + p.w + 40 && s.x + s.w > p.x - 40);
      const byRope = map.ropes.some((r) => r.top === p.y && r.x >= p.x && r.x <= p.x + p.w);
      assert.ok(fromBelow || byRope, `${map.id}: ledge at (${p.x}, ${p.y}) can't be reached`);
    }
  }
});

test('ropes hang from a ledge and reach a surface below', () => {
  for (const map of Object.values(MAPS)) {
    const surfaces = [{ x: 0, y: map.groundY, w: map.width }, ...map.platforms];
    for (const r of map.ropes) {
      const top = map.platforms.some((p) => p.y === r.top && r.x >= p.x && r.x <= p.x + p.w);
      const bottom = surfaces.some((s) => s.y === r.bottom && r.x >= s.x && r.x <= s.x + s.w);
      assert.ok(top && bottom, `${map.id}: rope at x=${r.x}`);
    }
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
