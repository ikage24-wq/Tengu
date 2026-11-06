import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { saveGame, loadGame, loadWorld, createWorldFile, worldChars, deleteWorld, copyWorld, hasSave, oldKey, charKey, FILES, PER_FILE } from '../src/core/save.js';
import { recordBook } from '../src/core/collection.js';

// A fresh pretend browser storage for each test.
function withStore(fn) {
  const store = new Map();
  const had = globalThis.localStorage;
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  try {
    return fn(store);
  } finally {
    globalThis.localStorage = had;
  }
}
const hero = (name, file, slot) => Object.assign(createCharacter(name, {}), { file, slot });

test('three save files, four heroes each', () => {
  assert.equal(FILES, 3);
  assert.equal(PER_FILE, 4);
  withStore(() => {
    createWorldFile(1, 'Biscuit Bay');
    for (let s = 0; s < 4; s++) assert.ok(saveGame(hero(`H${s}`, 1, s)));
    assert.equal(worldChars(1).filter(Boolean).length, 4);
    assert.equal(loadWorld(1).name, 'Biscuit Bay');
    assert.equal(loadWorld(0), null);
    assert.equal(loadWorld(2), null);
  });
});

test('heroes in a world share the island (each with their own way back) and the Monster Book', () => {
  withStore(() => {
    createWorldFile(0, 'Snail Hollow');
    const a = hero('Ann', 0, 0);
    a.home = { stage: 3, back: { map: 'harbor', x: 500 }, placed: [{ uid: 1, id: 'bench', map: 'home', x: 10, y: 0 }], bag: {} };
    recordBook(a, 'snailbun');
    saveGame(a);
    const b = hero('Bo', 0, 1);
    saveGame(b);
    const bo = loadGame(1, 0);
    assert.equal(bo.home.stage, 3, 'Bo lives on the island Ann built');
    assert.equal(bo.home.back, null, "Bo has no way back of their own yet");
    assert.equal(bo.book.snailbun, 1, 'and reads the same book');
    bo.home.back = { map: 'sprout', x: 200 };
    bo.home.placed.push({ uid: 2, id: 'lamp', map: 'home', x: 40, y: 0 });
    recordBook(bo, 'snailbun');
    saveGame(bo);
    const ann = loadGame(0, 0);
    assert.equal(ann.home.placed.length, 2, "Bo's lamp is on Ann's island too");
    assert.deepEqual(ann.home.back, { map: 'harbor', x: 500 }, 'Ann keeps her own way back');
    assert.equal(ann.book.snailbun, 2);
  });
});

test('the wardrobe keeps every cash look any hero in the world has had', () => {
  withStore(() => {
    createWorldFile(2, 'Nap Rock');
    const a = hero('Ann', 2, 0);
    a.inventory.cash.push({ uid: 99, id: 'cash_casual_cap' });
    saveGame(a);
    assert.ok(loadWorld(2).wardrobe.includes('cash_casual_cap'));
  });
});

test('worlds copy into an empty file and delete whole', () => {
  withStore(() => {
    createWorldFile(0, 'Loot Lagoon');
    saveGame(hero('Ann', 0, 0));
    assert.ok(copyWorld(0, 2));
    assert.equal(loadWorld(2).name, 'Loot Lagoon (copy)');
    assert.equal(loadGame(0, 2).name, 'Ann');
    assert.equal(loadGame(0, 2).file, 2);
    assert.ok(!copyWorld(0, 2), "a file that's in use isn't copied over");
    deleteWorld(0);
    assert.equal(loadWorld(0), null);
    assert.ok(!hasSave(0, 0));
    assert.equal(loadGame(0, 2).name, 'Ann', 'the copy stays');
  });
});

test('old saves (eight loose slots) move into the files, four to a file, sharing the best island', () => {
  withStore((store) => {
    for (let s = 0; s < 6; s++) {
      const c = createCharacter(`Old${s}`, {});
      if (s === 1) c.home = { stage: 2, back: { map: 'harbor', x: 1 }, placed: [], bag: {} };
      if (s === 2) c.home = { stage: 4, back: { map: 'sprout', x: 2 }, placed: [], bag: {} };
      c.book = { snailbun: s };
      store.set(oldKey(s), JSON.stringify(c));
    }
    assert.equal(worldChars(0).filter(Boolean).length, 4);
    assert.equal(worldChars(1).filter(Boolean).length, 2);
    assert.equal(loadWorld(2), null);
    assert.equal(loadGame(0, 1).name, 'Old4');
    const old1 = loadGame(1, 0);
    assert.equal(old1.home.stage, 4, 'the most built-up island is the one they share');
    assert.deepEqual(old1.home.back, { map: 'harbor', x: 1 }, 'each keeps their own way back');
    assert.equal(old1.book.snailbun, 3, 'the books merge, the higher count of each');
    assert.ok(store.get(oldKey(0)), 'the old saves stay as a backup');
    // Deleting everything doesn't bring the old saves back.
    for (let f = 0; f < FILES; f++) deleteWorld(f);
    assert.equal(loadWorld(0), null);
    assert.ok(!store.get(charKey(0, 0)));
  });
});

test('the storage chest: stash on one hero, take it out on another; nothing splits, doubles or vanishes', async () => {
  const { storeItem, takeItem } = await import('../src/core/storage.js');
  const { addItem, countItem, TAB_SIZE } = await import('../src/core/inventory.js');
  const { makeEquip } = await import('../src/core/items.js');
  withStore(() => {
    const w = createWorldFile(0, 'Popcorn Atoll');
    const a = hero('Ann', 0, 0);
    addItem(a.inventory, 'red_potion', 30);
    addItem(a.inventory, makeEquip('sword_5'));
    const potions = a.inventory.use.findIndex((e) => e.id === 'red_potion');
    assert.ok(storeItem(a, w, 'use', potions));
    assert.ok(storeItem(a, w, 'equip', a.inventory.equip.findIndex((e) => e.id === 'sword_5')));
    saveGame(a);
    const b = loadGame(1, 0) ?? (saveGame(hero('Bo', 0, 1)), loadGame(1, 0));
    const bw = loadWorld(0);
    assert.equal(countItem(bw.storage, 'red_potion'), 30);
    assert.ok(takeItem(b, bw, 'use', 0));
    assert.equal(countItem(b.inventory, 'red_potion'), 30 + countItem(createCharacter('x', {}).inventory, 'red_potion'));
    assert.equal(countItem(bw.storage, 'red_potion'), 0);
    // A full bag takes nothing.
    while (b.inventory.equip.length < TAB_SIZE) b.inventory.equip.push(makeEquip('sword_5'));
    assert.ok(!takeItem(b, bw, 'equip', 0));
    assert.equal(bw.storage.equip.length, 1);
  });
});

test("listing a world's heroes doesn't change the playing hero's way back from the island", () => {
  withStore(() => {
    createWorldFile(0, 'Nap Rock');
    const a = hero('Ann', 0, 0);
    a.home = { stage: 1, back: { map: 'harbor', x: 5 }, placed: [], bag: {} };
    saveGame(a);
    const b = hero('Bo', 0, 1);
    saveGame(b);
    const bo = loadGame(1, 0);
    bo.home.back = { map: 'sprout', x: 9 };
    saveGame(bo);
    const ann = loadGame(0, 0);
    worldChars(0);
    assert.deepEqual(ann.home.back, { map: 'harbor', x: 5 });
  });
});

test('your other heroes walk the towns as themselves, with "Your hero" under their name', async () => {
  const { createWorld } = await import('../src/world/world.js');
  const { createBots } = await import('../src/world/bots.js');
  const me = createCharacter('Me', {});
  const alt = Object.assign(createCharacter('Altie', {}), { level: 23, mapId: 'harbor', slot: 1 });
  const world = createWorld(me);
  world.log = () => {};
  const bots = createBots(world, Math.random, { alts: [alt] });
  const b = bots.list.find((x) => x.alt);
  assert.ok(b, 'Altie is out and about');
  assert.equal(b.name, 'Altie');
  assert.equal(b.level, 23);
  assert.equal(b.map, 'harbor');
  assert.equal(b.title, 'Your hero');
  assert.equal(b.session, Infinity);
  assert.notEqual(b.char, alt, 'a copy: nothing they do touches the save');
});

test('reloading while fainted is no way out: the hero comes back as "Return to town" would bring them', async () => {
  const { createWorld } = await import('../src/world/world.js');
  const { gainExp } = await import('../src/core/character.js');
  withStore(() => {
    const h = hero('Pip', 0, 0);
    gainExp(h, 500);
    Object.assign(h, { exp: 50, hp: 0, mapId: 'cave', portal: 'sprout' });
    saveGame(h);
    const back = loadGame(0, 0);
    assert.equal(back.hp, 0, 'the save keeps the faint');
    const w = createWorld(back);
    assert.equal(w.dead, false);
    assert.equal(w.map.id, 'sprout', 'awake in the town by the cave');
    assert.ok(back.exp < 50, 'with the EXP lost');
    saveGame(back);
    assert.ok(loadGame(0, 0).hp > 0, 'and that is what is saved next');
  });
});

test("a save holding Captain Rook's retired 'Heart of Crystal' loads cleanly, and his harpies follow the ruins", async () => {
  const { dropRetiredQuests } = await import('../src/core/save.js');
  const { QUESTS } = await import('../src/data/quests.js');
  const { NPCS } = await import('../src/data/npcs.js');
  assert.equal(QUESTS.crystal_heart, undefined, 'the copy of the finale is gone');
  assert.equal(QUESTS.rook_harpies.prereq, 'restless_ruins');
  assert.ok(!NPCS.rook.quests.includes('crystal_heart'));
  const char = { quests: { crystal_heart: { state: 'active', kills: {}, marks: {} }, restless_ruins: { state: 'done' } }, tracked: ['crystal_heart', 'restless_ruins'] };
  dropRetiredQuests(char);
  assert.deepEqual(Object.keys(char.quests), ['restless_ruins']);
  assert.deepEqual(char.tracked, ['restless_ruins']);
});
