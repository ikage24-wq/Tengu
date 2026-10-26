import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS, UNIQUE_IDS, RARITIES, ENDGAME_THEMES, WEAPON_LEVELS } from '../src/data/items.js';
import { NPCS } from '../src/data/npcs.js';
import { makeEquip, rollRarity } from '../src/core/items.js';
import { rollLoot } from '../src/world/drops.js';
import { MOBS } from '../src/data/mobs.js';
import { topShapes, legLook, legShapes, hatShapes, hatBackShapes, capeShapes, handShapes, earringShapes } from '../src/render/gear.js';
import { weaponShapes, weaponIcon, weaponFrames } from '../src/render/weapons.js';
import { pieceOf } from '../src/render/jobgear/index.js';
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
      case 'weapon': shapes = weaponShapes(def.weaponType, def.tier, 0, def.theme ?? null)?.shapes; break;
      case 'hat': shapes = [...hatShapes(def.design, c, pc), ...hatBackShapes(def.design, c, pc)]; break;
      case 'top': shapes = topShapes(def.design, c, pc); break;
      case 'bottom': shapes = legShapes(11, legLook(def.design, c, '#ffffff', pc), { design: 'sneakers', color: c }, false); break;
      case 'shoes': shapes = legShapes(11, legLook('pants', c, '#ffffff'), pc, false); break;
      case 'gloves': shapes = handShapes(10, 30, pc, '#ffffff'); break;
      case 'cape': shapes = capeShapes(def.design, c, 0, false, pc); break;
      case 'earring': shapes = earringShapes(def.design, c, pc); break;
    }
    assert.ok(shapes?.length, `${def.id} draws something`);
    if (def.slot !== 'weapon') assert.ok(def.design, `${def.id} has a design`);
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
        assert.ok(art.shapes.length && art.grip[0] < art.w && art.grip[1] < art.h, `${id} frame ${f} has a grip inside it`);
      }
      assert.ok(weaponIcon(type, def.tier, def.theme ?? null)?.length, `${id} icon`);
      if (def.theme) assert.equal(def.element, def.theme, `${id} brings its theme's effects`);
    }
  }
});

test('better weapons animate more', () => {
  const live = (type, tier, theme = null) => Boolean(weaponShapes(type, tier, 0, theme).live);
  for (const type of ['sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'gauntlet']) {
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
  for (const type of ['sword', 'bow', 'staff', 'gauntlet']) {
    assert.equal(new Set(WEAPON_LEVELS.map((_, t) => art(type, t))).size, WEAPON_LEVELS.length, `${type} has a look per tier`);
    assert.ok(weaponShapes(type, 20).w * weaponShapes(type, 20).h > weaponShapes(type, 1).w * weaponShapes(type, 1).h, `${type} grows`);
    for (const v of ['dark', 'white', 'crimson', 'azure', 'gilded']) {
      assert.notEqual(art(type, 10, null, v), art(type, 10), `${type} ${v} recolors`);
      assert.notEqual(JSON.stringify(weaponIcon(type, 10, null, v)), JSON.stringify(weaponIcon(type, 10)), `${type} ${v} icon recolors`);
      assert.equal(art(type, 21, 'bone', v), art(type, 21, 'bone'), `${type} themes ignore ${v}`);
    }
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
