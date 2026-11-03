import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS, UNIQUE_IDS, RARITIES, ENDGAME_THEMES, WEAPON_LEVELS } from '../src/data/items.js';
import { NPCS } from '../src/data/npcs.js';
import { makeEquip, rollRarity } from '../src/core/items.js';
import { rollLoot } from '../src/world/drops.js';
import { MOBS } from '../src/data/mobs.js';
import { topShapes, legLook, legShapes, hatShapes, hatBackShapes, capeShapes, handShapes, earringShapes } from '../src/render/gear.js';
import { weaponShapes, weaponIcon, weaponFrames } from '../src/render/weapons.js';
import { gloveShapes } from '../src/render/weapon-designs.js';
import { lookFor } from '../src/render/weapon-kit.js';
import { pieceOf } from '../src/render/jobgear/index.js';
import { ITEM_ART } from '../src/render/icons/items.js';
import '../src/render/icons/craft.js';
import { dropRetiredItems } from '../src/core/save.js';

const seq = (...values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

test('every equip has a design the renderer draws', () => {
  for (const def of Object.values(ITEMS)) {
    if (def.type !== 'equip') continue;
    const c = def.color;
    const pc = pieceOf(def);
    let shapes;
    switch (def.slot) {
      // (A gauntlet is worn as a glove on the weapon hand.)
      case 'weapon': shapes = def.weaponType === 'gauntlet' ? gloveShapes(lookFor('gauntlet', def.tier, def.theme ?? null), 10, 30, 10, 26) : weaponShapes(def.weaponType, def.tier, 0, def.theme ?? null)?.shapes; break;
      case 'hat': shapes = [...hatShapes(def.design, c, pc), ...hatBackShapes(def.design, c, pc)]; break;
      case 'top': shapes = topShapes(def.design, c, pc); break;
      case 'bottom': shapes = legShapes(11, legLook(def.design, c, '#ffffff', pc), { design: 'sneakers', color: c }, false); break;
      case 'shoes': shapes = legShapes(11, legLook('pants', c, '#ffffff'), pc, false); break;
      case 'gloves': shapes = handShapes(10, 30, pc, '#ffffff'); break;
      case 'cape': shapes = capeShapes(def.design, c, 0, false, pc); break;
      case 'earring': shapes = earringShapes(def.design, c, pc); break;
      // Bench-made rings and charms aren't worn on the figure: their own icon (render/icons/craft.js).
      case 'ring': case 'charm': shapes = ITEM_ART[def.id]?.(); break;
    }
    assert.ok(shapes?.length, `${def.id} draws something`);
    if (def.slot !== 'weapon' && def.slot !== 'ring' && def.slot !== 'charm') assert.ok(def.design, `${def.id} has a design`);
  }
});

test('higher armor tiers look different from lower ones', () => {
  for (const slot of ['hat', 'top', 'bottom', 'shoes']) {
    const designs = new Set([0, 1, 2, 3, 4, 5].map((t) => ITEMS[`${slot}_${t}`].design));
    assert.equal(designs.size, 6, `${slot} has six looks`);
  }
});

test('unique outfits exist for several slots and some are sold in shops', () => {
  assert.ok(UNIQUE_IDS.length >= 10);
  const slots = new Set(UNIQUE_IDS.map((id) => ITEMS[id].slot));
  for (const s of ['hat', 'top', 'cape']) assert.ok(slots.has(s), `unique ${s}`);
  const sold = Object.values(NPCS).flatMap((n) => n.shop ?? []);
  assert.ok(UNIQUE_IDS.some((id) => sold.includes(id)));
  for (const id of sold) assert.ok(ITEMS[id], `shop item ${id} exists`);
});

test('rarity rolls from the chance table', () => {
  assert.equal(rollRarity(() => 0.5), 0);
  assert.equal(rollRarity(() => 0.1), 1);
  assert.equal(rollRarity(() => 0.03), 2);
  assert.equal(rollRarity(() => 0.001), 3);
  assert.equal(RARITIES.length, 4);
});

test('rarer gear has better stats and bonus main stats', () => {
  const normal = makeEquip('top_4', { rarity: 0, rng: () => 0.5 });
  const rare = makeEquip('top_4', { rarity: 1, rng: () => 0.5 });
  const legend = makeEquip('top_4', { rarity: 3, rng: () => 0.5 });
  assert.ok(rare.stats.wdef > normal.stats.wdef);
  assert.ok(legend.stats.wdef > rare.stats.wdef);
  const mains = (s) => ['str', 'dex', 'int', 'luk'].filter((k) => s.stats[k]).length;
  assert.equal(mains(normal), 0);
  assert.equal(mains(rare), 1);
  assert.equal(mains(legend), 4);
  assert.equal(legend.rarity, 3);
});

test('bosses always drop at least Rare gear', () => {
  const loot = rollLoot(MOBS.crystalking, seq(0.9, 0.5, 0.3, 0.7));
  const gear = loot.filter((l) => l.inst);
  assert.equal(gear.length, 3);
  for (const g of gear) assert.ok(g.inst.rarity >= 1);
});

test('old saves lose weapons that no longer exist instead of breaking', () => {
  const char = {
    equipment: { weapon: { uid: 1, id: 'lollipop_wand' }, hat: { uid: 2, id: 'hat_0' } },
    inventory: { equip: [{ uid: 3, id: 'moon_staff' }, { uid: 4, id: 'sword_9' }], use: [{ id: 'red_potion', qty: 2 }], etc: [] },
    hotkeys: { Digit1: { item: 'red_potion' } },
  };
  dropRetiredItems(char);
  assert.equal(char.equipment.weapon, null);
  assert.equal(char.equipment.hat.id, 'hat_0');
  assert.deepEqual(char.inventory.equip.map((e) => e.id), [], 'the old weapon lines are gone too');
  assert.equal(char.hotkeys.Digit1.item, 'red_potion');
});

test('every weapon type has a weapon every 5 levels and every endgame design, each with art and an icon', () => {
  for (const type of ['sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'gauntlet']) {
    const ids = WEAPON_LEVELS.map((L) => `${type}_${L}`).concat(ENDGAME_THEMES.map((th) => (type === 'staff' && th === 'holy' ? 'seraphim_staff' : `${type}_${th}`)));
    let last = 0;
    for (const id of ids) {
      const def = ITEMS[id];
      assert.equal(def?.weaponType, type, id);
      if (!def.theme) {
        assert.ok(def.stats.watk >= last, `${id} hits at least as hard as the tier below`);
        last = def.stats.watk;
      }
      for (let f = 0; f < 6; f++) {
        const art = weaponShapes(type, def.tier, f, def.theme ?? null);
        assert.ok((art.shapes.length || type === 'gauntlet') && art.grip[0] < art.w && art.grip[1] < art.h, `${id} frame ${f} has a grip inside it`);
      }
      assert.ok(weaponIcon(type, def.tier, def.theme ?? null)?.length, `${id} icon`);
      if (def.theme) assert.equal(def.element, def.theme, `${id} brings its theme's effects`);
    }
  }
});

test('better weapons animate more', () => {
  const live = (type, tier, theme = null) => Boolean(weaponShapes(type, tier, 0, theme).live);
  // (A gauntlet is a small glove on the hand, with no shimmer of its own.)
  assert.equal(live('gauntlet', 10), false, 'the glove carries no shimmer');
  for (const type of ['sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger']) {
    assert.equal(live(type, 0), false, `${type} tier 0 is still`);
    assert.equal(weaponFrames(type, 0), 1, `${type} tier 0 has one frame`);
    assert.ok(weaponFrames(type, 5) > weaponFrames(type, 4), `${type} gems shine from Silver`);
    assert.ok(weaponFrames(type, 20) >= weaponFrames(type, 5), `${type} top tiers animate at least as much`);
    for (let t = 4; t <= 20; t++) assert.equal(live(type, t), true, `${type} tier ${t} has live effects`);
  }
  for (const th of ENDGAME_THEMES) assert.equal(live('axe', 21, th), true, th);
});

test('every weapon tier looks different, and variants recolor progression weapons only', () => {
  const art = (type, tier, theme = null, variant = null) => JSON.stringify(weaponShapes(type, tier, 0, theme, variant).shapes);
  for (const type of ['sword', 'axe', 'spear', 'dagger', 'wand', 'bow', 'crossbow', 'staff']) {
    assert.equal(new Set(WEAPON_LEVELS.map((_, t) => art(type, t))).size, WEAPON_LEVELS.length, `${type} has a look per tier`);
    assert.ok(weaponShapes(type, 20).w * weaponShapes(type, 20).h > weaponShapes(type, 1).w * weaponShapes(type, 1).h, `${type} grows`);
    for (const v of ['dark', 'white', 'crimson', 'azure', 'gilded']) {
      assert.notEqual(art(type, 10, null, v), art(type, 10), `${type} ${v} recolors`);
      assert.notEqual(JSON.stringify(weaponIcon(type, 10, null, v)), JSON.stringify(weaponIcon(type, 10)), `${type} ${v} icon recolors`);
      assert.equal(art(type, 21, 'bone', v), art(type, 21, 'bone'), `${type} themes ignore ${v}`);
    }
  }
});

test('a gauntlet is a small glove: one look per tier, recoloured by variants, nothing held', () => {
  const glove = (tier, theme = null, variant = null) => JSON.stringify(gloveShapes(lookFor('gauntlet', tier, theme, variant), 10, 30, 10, 26));
  assert.equal(new Set(WEAPON_LEVELS.map((_, t) => glove(t)).slice(0, 11)).size, 11, 'a glove per level up to 50');
  for (const v of ['dark', 'crimson', 'azure']) assert.notEqual(glove(10, null, v), glove(10), `${v} recolors the glove`);
  assert.equal(weaponShapes('gauntlet', 5).shapes.length, 0, 'nothing in the hand');
  const icons = new Set(Array.from({ length: 11 }, (_, t) => JSON.stringify(weaponIcon('gauntlet', t))));
  assert.equal(icons.size, 11, 'a glove icon per level');
});

test('bows keep their string for the draw', () => {
  for (let t = 0; t <= 10; t++) {
    const a = weaponShapes('bow', t).anchors;
    assert.ok(a.string && a.string.h > 15, `bow tier ${t} has its string`);
    assert.ok(weaponShapes('bow', t, 0, null, null, true).shapes.length < weaponShapes('bow', t).shapes.length, 'the string can be left out to draw it live');
  }
});

test('old saves turn their claws into the gauntlets that replaced them', async () => {
  const { dropRetiredItems } = await import('../src/core/save.js');
  const { createCharacter } = await import('../src/core/character.js');
  const c = createCharacter('Old', {});
  c.equipment.weapon = { uid: 1, id: 'claw_20' };
  c.inventory.equip.push({ uid: 2, id: 'claw_cyber' }, { uid: 3, id: 'claw_2' });
  dropRetiredItems(c);
  assert.equal(c.equipment.weapon.id, 'gauntlet_20');
  assert.deepEqual(c.inventory.equip.map((e) => e.id), ['gauntlet_cyber', 'gauntlet_20']);
});

test('the starting outfit can be taken off and put back on, and old saves get it once', async () => {
  const { createCharacter, unequip, equipFromBag } = await import('../src/core/character.js');
  const { giveStartingOutfit } = await import('../src/core/save.js');
  const char = createCharacter('Mia', { outfit: 'casual', outfitColor: '#ffc2d6' });
  for (const slot of ['top', 'bottom', 'shoes']) assert.equal(char.equipment[slot]?.id, `outfit_${slot}`);
  assert.ok(unequip(char, 'top'));
  assert.equal(char.equipment.top, null);
  const i = char.inventory.equip.findIndex((e) => e.id === 'outfit_top');
  assert.ok(equipFromBag(char, i));
  assert.equal(char.equipment.top.id, 'outfit_top');
  // Never dropped by monsters.
  for (const id of ['outfit_top', 'outfit_bottom', 'outfit_shoes']) assert.ok(ITEMS[id].legacy && ITEMS[id].starterOutfit);
  const old = { equipment: { top: null, bottom: makeEquip('bottom_0'), shoes: null } };
  giveStartingOutfit(old);
  assert.equal(old.equipment.top.id, 'outfit_top');
  assert.equal(old.equipment.bottom.id, 'bottom_0');
  assert.equal(old.equipment.shoes.id, 'outfit_shoes');
  old.equipment.top = null;
  giveStartingOutfit(old);
  assert.equal(old.equipment.top, null);
});

test('a gear set adds its bonuses at 2, 3 and 4 pieces worn', async () => {
  const { createCharacter } = await import('../src/core/character.js');
  const { computeStats, setsWorn } = await import('../src/core/stats.js');
  const { makeEquip } = await import('../src/core/items.js');
  const { SETS, SET_SLOTS, setPieceId } = await import('../src/data/sets.js');
  const c = createCharacter('Set', {});
  c.job = 'warrior';
  c.level = 30;
  const before = computeStats(c);
  for (const slot of SET_SLOTS.slice(0, 2)) c.equipment[slot] = makeEquip(setPieceId('tamamo', 'warrior', slot));
  assert.equal(setsWorn(c.equipment).tamamo, 2);
  const two = computeStats(c);
  assert.ok(two.acc >= before.acc + SETS.tamamo.bonus[2].acc, 'two pieces: accuracy');
  for (const slot of SET_SLOTS) c.equipment[slot] = makeEquip(setPieceId('tamamo', 'warrior', slot));
  const four = computeStats(c);
  assert.ok(four.critRate >= before.critRate + 0.05, 'four pieces: crit');
  assert.ok(four.str > two.str, 'four pieces: all stats');
});

test('a boss drops a set piece for your own job, one you are missing first', async () => {
  const { createCharacter } = await import('../src/core/character.js');
  const { setDropFor } = await import('../src/world/world.js');
  const { setPieceId } = await import('../src/data/sets.js');
  const { makeEquip } = await import('../src/core/items.js');
  const c = createCharacter('Drop', {});
  assert.equal(setDropFor(c, 'sylvana', 1), null, 'a Novice gets none');
  c.job = 'archer';
  for (const slot of ['hat', 'top', 'gloves']) c.inventory.equip.push(makeEquip(setPieceId('sylvana', 'archer', slot)));
  assert.equal(setDropFor(c, 'sylvana', 1), setPieceId('sylvana', 'archer', 'cape'));
  assert.equal(setDropFor(c, 'snailbun', 1), null, 'only set bosses');
});

test('polishing adds a step at a time, costs gold, and never breaks the piece', async () => {
  const { createCharacter } = await import('../src/core/character.js');
  const { makeEquip, polish, polishCost, POLISH_MAX } = await import('../src/core/items.js');
  const c = createCharacter('Shine', {});
  const sword = makeEquip('sword_20');
  c.gold = 0;
  assert.equal(polish(c, sword).why, 'gold');
  c.gold = 1e9;
  const atk = sword.stats.watk;
  const cost = polishCost(sword);
  assert.ok(polish(c, sword, () => 0).ok);
  assert.equal(sword.polish, 1);
  assert.ok(sword.stats.watk > atk);
  assert.equal(c.gold, 1e9 - cost);
  const miss = polish(c, sword, () => 0.999);
  assert.equal(miss.ok, false);
  assert.equal(sword.polish, 1, 'a miss keeps the polish');
  while ((sword.polish ?? 0) < POLISH_MAX) polish(c, sword, () => 0);
  assert.equal(polish(c, sword, () => 0).why, 'max');
});
