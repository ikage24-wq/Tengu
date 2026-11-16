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
  const normal = makeEquip('puffer_jacket', { rarity: 0, rng: () => 0.5 });
  const rare = makeEquip('puffer_jacket', { rarity: 1, rng: () => 0.5 });
  const legend = makeEquip('puffer_jacket', { rarity: 3, rng: () => 0.5 });
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

test('old saves lose weapons that no longer exist instead of breaking, and retired gear sells back', () => {
  const char = {
    gold: 0,
    equipment: { weapon: { uid: 1, id: 'lollipop_wand' }, hat: { uid: 2, id: 'hat_0' } },
    inventory: { equip: [{ uid: 3, id: 'moon_staff' }, { uid: 4, id: 'sword_9' }, { uid: 5, id: 'warrior_top_30' }], use: [{ id: 'red_potion', qty: 2 }], etc: [] },
    hotkeys: { Digit1: { item: 'red_potion' } },
  };
  dropRetiredItems(char);
  assert.equal(char.equipment.weapon, null);
  // (The cotton beanie was retired with the rest of the armour, 2026-11-16: it and the plate top
  // sell back for a tenth of their price.)
  assert.equal(char.equipment.hat, null);
  assert.equal(char.gold, Math.floor(ITEMS.hat_0.price * 0.1) + Math.floor(ITEMS.warrior_top_30.price * 0.1));
  assert.deepEqual(char.inventory.equip.map((e) => e.id), [], 'the old weapon lines are gone too');
  assert.equal(char.hotkeys.Digit1.item, 'red_potion');
});

test('every weapon type keeps its starter, the job weapons climb the new ladder, and the rest are looks that still draw', async () => {
  // (Every old weapon was retired, 2026-11-16, to make way for new ones: the rest stay only as looks,
  // for weapon covers and the NPCs who carry them. The seven job weapons get the Island Journey
  // ladder, docs/design/island-journey-gear.md: Sprout starters, then Rootwood at Lv 10.)
  const { LADDER_TYPES, LADDER_TIERS } = await import('../src/data/items.js');
  for (const type of ['sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'gauntlet']) {
    const plain = ITEMS[`${type}_0`];
    assert.equal(plain.type, 'equip', `${type}_0 is gear`);
    assert.ok(plain.stats.watk > 0, `${type}_0 hits`);
    const live = Object.keys(LADDER_TIERS).map((L) => `${type}_${L}`).filter(() => LADDER_TYPES.includes(type));
    let last = plain.stats.watk;
    for (const id of live) {
      assert.equal(ITEMS[id].type, 'equip', `${id} is gear`);
      assert.ok(ITEMS[id].stats.watk > last, `${id} hits harder than the tier below`);
      last = ITEMS[id].stats.watk;
    }
    assert.equal(Object.values(ITEMS).filter((d) => d.type === 'equip' && d.weaponType === type).length, 1 + live.length, `${type}: the starter and its ladder`);
    const ids = WEAPON_LEVELS.map((L) => `${type}_${L}`).concat(ENDGAME_THEMES.map((th) => (type === 'staff' && th === 'holy' ? 'seraphim_staff' : `${type}_${th}`)));
    for (const id of ids) {
      const def = ITEMS[id];
      assert.equal(def?.weaponType, type, id);
      if (id !== `${type}_0` && !live.includes(id)) assert.ok(def.retiredGear && def.type === 'look' && !def.stats, `${id} is a look now`);
      for (let f = 0; f < 6; f++) {
        const art = weaponShapes(type, def.tier, f, def.theme ?? null);
        assert.ok((art.shapes.length || type === 'gauntlet') && art.grip[0] < art.w && art.grip[1] < art.h, `${id} frame ${f} has a grip inside it`);
      }
      assert.ok(weaponIcon(type, def.tier, def.theme ?? null)?.length, `${id} icon`);
      if (def.theme) assert.equal(def.element, def.theme, `${id} brings its theme's effects`);
    }
  }
});

test('a retired material cover keeps its old design where the ladder has taken its level', () => {
  // (The Crystal cover wears tier 8, Lv 40, which is the Dreamsilk ladder's now.)
  const sig = (d) => JSON.stringify(d.shapes.slice(0, 6));
  for (const type of ['sword', 'bow', 'staff']) {
    const ladder = weaponShapes(type, 8, 0, null);
    const old = weaponShapes(type, 8, 0, null, null, false, true);
    assert.equal(ladder.anchors.fx, 'dreamsilk', `${type} Lv 40 is Dreamsilk`);
    assert.notEqual(old.anchors.fx, 'dreamsilk', `${type} cover keeps its old design`);
    assert.notEqual(sig(old), sig(ladder));
    assert.ok(weaponFrames(type, 8, null, true) > 1, 'the old design still shines');
  }
  // The ladder's designs are one picture each (their motion is the live effect).
  for (const t of [0, 2, 4, 6, 8, 10]) assert.equal(weaponFrames('sword', t), 1, `tier ${t}`);
  // The job teachers keep their old Lv 50 weapons too, until their halls are reworked.
  for (const id of ['brann', 'elowen', 'kestrel', 'vex']) {
    const w = NPCS[id].gear.weapon;
    assert.ok(w.legacy, id);
    const def = ITEMS[w.id];
    assert.notEqual(weaponShapes(def.weaponType, def.tier, 0, null, w.variant ?? null, false, true).anchors.fx, 'regalia', id);
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
    // (Variants recolor the old designs, still drawn for Cash covers; the ladder's tiers have none.)
    for (const v of ['dark', 'white', 'crimson', 'azure', 'gilded']) {
      assert.notEqual(art(type, 9, null, v), art(type, 9), `${type} ${v} recolors`);
      assert.notEqual(JSON.stringify(weaponIcon(type, 9, null, v)), JSON.stringify(weaponIcon(type, 9)), `${type} ${v} icon recolors`);
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
    // (The sample bow is a compact recurve, short enough to tuck behind her head when drawn upright.)
    assert.ok(a.string && a.string.h > 10, `bow tier ${t} has its string`);
    assert.ok(weaponShapes('bow', t, 0, null, null, true).shapes.length < weaponShapes('bow', t).shapes.length, 'the string can be left out to draw it live');
  }
});

test('old saves turn their claws into the gauntlets that replaced them, then sell the retired ones back', async () => {
  const { dropRetiredItems } = await import('../src/core/save.js');
  const { createCharacter } = await import('../src/core/character.js');
  const c = createCharacter('Old', {});
  c.gold = 0;
  c.equipment.weapon = { uid: 1, id: 'claw_20' };
  c.inventory.equip.push({ uid: 2, id: 'claw_cyber' }, { uid: 3, id: 'claw_2' });
  dropRetiredItems(c);
  // (Those gauntlets were retired, 2026-11-16: the one in her hand becomes the plain gauntlet, and
  // every one of them sells back for a tenth of its price.)
  assert.equal(c.equipment.weapon.id, 'gauntlet_0');
  assert.deepEqual(c.inventory.equip.map((e) => e.id), []);
  const tenth = (id) => Math.floor(ITEMS[id].price * 0.1);
  assert.equal(c.gold, tenth('gauntlet_20') + tenth('gauntlet_cyber') + tenth('gauntlet_20'));
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
  const old = { equipment: { top: null, bottom: makeEquip('blue_jeans'), shoes: null } };
  giveStartingOutfit(old);
  assert.equal(old.equipment.top.id, 'outfit_top');
  assert.equal(old.equipment.bottom.id, 'blue_jeans');
  assert.equal(old.equipment.shoes.id, 'outfit_shoes');
  old.equipment.top = null;
  giveStartingOutfit(old);
  assert.equal(old.equipment.top, null);
});

// A stand-in set while the game has none (they were retired with the armour, 2026-11-16): the
// system stays ready for new ones, so it's tested on a set and pieces made up for the test.
async function withTestSet(run) {
  const { SETS, SET_SLOTS, setPieceId } = await import('../src/data/sets.js');
  SETS.testset = { name: 'Test', level: 20, color: '#88aaff', accent: '#ffffff', bonus: { 2: { acc: 10 }, 3: { watk: 5, matk: 5 }, 4: { str: 5, dex: 5, int: 5, luk: 5, critRate: 0.05 } } };
  const ids = SET_SLOTS.map((slot) => setPieceId('testset', 'warrior', slot));
  SET_SLOTS.forEach((slot, i) => {
    ITEMS[ids[i]] = { id: ids[i], name: `Test ${slot}`, type: 'equip', slot, design: 'job', family: 'warrior', tier: 3, reqLevel: 20, set: 'testset', stats: { wdef: 5 }, price: 100, color: '#88aaff' };
  });
  try {
    await run(SETS.testset);
  } finally {
    delete SETS.testset;
    for (const id of ids) delete ITEMS[id];
  }
}

test('the game has no gear sets now, and no retired set gives a bonus', async () => {
  const { SETS, RETIRED_SETS, setPieceId } = await import('../src/data/sets.js');
  const { setBonus } = await import('../src/core/stats.js');
  assert.deepEqual(Object.keys(SETS), []);
  assert.ok(Object.keys(RETIRED_SETS).length > 0);
  const id = setPieceId('tamamo', 'warrior', 'hat');
  assert.ok(ITEMS[id].retiredGear && !ITEMS[id].stats, 'a retired piece is a look');
  assert.deepEqual(setBonus({ hat: { id }, top: { id: setPieceId('tamamo', 'warrior', 'top') } }), {});
});

test('a gear set adds its bonuses at 2, 3 and 4 pieces worn', async () => {
  const { createCharacter } = await import('../src/core/character.js');
  const { computeStats, setsWorn } = await import('../src/core/stats.js');
  const { makeEquip } = await import('../src/core/items.js');
  const { SET_SLOTS, setPieceId } = await import('../src/data/sets.js');
  await withTestSet(async (set) => {
    const c = createCharacter('Set', {});
    c.job = 'warrior';
    c.level = 30;
    const before = computeStats(c);
    for (const slot of SET_SLOTS.slice(0, 2)) c.equipment[slot] = makeEquip(setPieceId('testset', 'warrior', slot));
    assert.equal(setsWorn(c.equipment).testset, 2);
    const two = computeStats(c);
    assert.ok(two.acc >= before.acc + set.bonus[2].acc, 'two pieces: accuracy');
    for (const slot of SET_SLOTS) c.equipment[slot] = makeEquip(setPieceId('testset', 'warrior', slot));
    const four = computeStats(c);
    assert.ok(four.critRate >= before.critRate + 0.05, 'four pieces: crit');
    assert.ok(four.str > two.str, 'four pieces: all stats');
  });
});

test('a boss drops a set piece for your own job, one you are missing first', async () => {
  const { createCharacter } = await import('../src/core/character.js');
  const { setDropFor } = await import('../src/world/world.js');
  const { SETS, RETIRED_SETS, setPieceId } = await import('../src/data/sets.js');
  const c = createCharacter('Drop', {});
  c.job = 'warrior';
  assert.equal(setDropFor(c, 'sylvana', 1), null, 'no boss drops a set while there are none');
  // (The system, on a boss's set put back for the test.)
  SETS.sylvana = RETIRED_SETS.sylvana;
  try {
    c.job = 'novice';
    assert.equal(setDropFor(c, 'sylvana', 1), null, 'a Novice gets none');
    c.job = 'warrior';
    for (const [i, slot] of ['hat', 'top', 'gloves'].entries()) c.inventory.equip.push({ uid: 900 + i, id: setPieceId('sylvana', 'warrior', slot) });
    assert.equal(setDropFor(c, 'sylvana', 1), setPieceId('sylvana', 'warrior', 'cape'));
    assert.equal(setDropFor(c, 'snailbun', 1), null, 'only set bosses');
  } finally {
    delete SETS.sylvana;
  }
});

test('polishing adds a step at a time, costs gold, and never breaks the piece', async () => {
  const { createCharacter } = await import('../src/core/character.js');
  const { makeEquip, polish, polishCost, POLISH_MAX } = await import('../src/core/items.js');
  const c = createCharacter('Shine', {});
  const sword = makeEquip('sword_0');
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

test('the ladder armour: every tier a set for each job, sold in a shop, drawn in its own theme', async () => {
  const { ARMOUR_FAMILIES, ARMOUR_TIERS, armourId, JOB_SLOTS } = await import('../src/data/items.js');
  const { equipBlocker, createCharacter } = await import('../src/core/character.js');
  const { skirtShapes, shoulderShapes, capeFrontShapes, sleeveColor } = await import('../src/render/gear.js');
  const jobOf = { warrior: 'warrior', mage: 'tidemage', thief: 'moonmoth', archer: 'sunfeather' };
  for (const [L, theme] of Object.entries(ARMOUR_TIERS).map(([l, th]) => [Number(l), th.toLowerCase()])) for (const family of ARMOUR_FAMILIES) {
    for (const slot of JOB_SLOTS) {
      const id = armourId(L, family, slot);
      const def = ITEMS[id];
      assert.equal(def?.type, 'equip', id);
      assert.equal(def.ladder, theme);
      assert.ok(def.stats.wdef > 0 && def.price >= 100 && def.price < 400 * L, `${id} is priced for its level`);
      assert.ok(Object.values(NPCS).some((n) => n.shop?.includes(id)), `a shop sells ${id}`);
      if (L === 5) assert.ok(NPCS.pip.shop.includes(id), `Pip sells ${id}`);
      // Its own job and a Novice can wear it; another job can't.
      const char = createCharacter('T', {});
      char.level = L;
      assert.equal(equipBlocker(char, { id }) === null, L === 5, `only the Lv 5 sets fit a Novice (${id})`);
      char.job = jobOf[family];
      assert.equal(equipBlocker(char, { id }), null);
      char.job = jobOf[ARMOUR_FAMILIES.find((f) => f !== family)];
      assert.ok(equipBlocker(char, { id }));
      // Drawn by the Sprout module, with no colour variants.
      const pc = pieceOf(def);
      assert.equal(pc.ladder, theme);
      const shapes = slot === 'hat' ? [...hatShapes(def.design, def.color, pc), ...hatBackShapes(def.design, def.color, pc)]
        : slot === 'top' ? [...topShapes(def.design, def.color, pc), ...shoulderShapes(pc, 1), sleeveColor(def.design, def.color, pc)]
          : slot === 'bottom' ? [...legShapes(11, legLook(def.design, def.color, '#fff0e6', pc), { design: 'none', color: '#fff' }, false), ...(skirtShapes(def.design, def.color, pc) ?? [])]
            : slot === 'shoes' ? legShapes(11, { top: '#fff', low: '#fff' }, pc, false)
              : slot === 'gloves' ? handShapes(11, 31, pc, '#fff0e6', 10, 26)
                : [...capeShapes(def.design, def.color, 0, 0, pc), ...capeFrontShapes(def.design, def.color, pc)];
      assert.ok(shapes.length > 2 && shapes.every(Boolean), `${id} draws`);
    }
  }
});
