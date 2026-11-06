// Getting around (world/routes.js): routes along the portals, the guide, quest targets, level ranges.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAPS } from '../src/data/maps.js';
import { MOBS } from '../src/data/mobs.js';
import { QUESTS } from '../src/data/quests.js';
import { createCharacter } from '../src/core/character.js';
import { acceptQuest, completeQuest, recordKill, npcMap, npcMaps, mobMap, itemPlace, itemSources, objectiveHint } from '../src/core/quests.js';
import { addItem } from '../src/core/inventory.js';
import { createWorld, loadMap } from '../src/world/world.js';
import { routeBetween, nextStep, questTarget, setRoute, checkArrival, levelRange, distancesFrom } from '../src/world/routes.js';
import { drawQuestFx, questCompleted } from '../src/ui/questfx.js';
import { createUiState, overWindow, underWindows } from '../src/ui/manager.js';

test('every place on the island can be reached from Sprout Village, and back', () => {
  for (const m of Object.values(MAPS)) {
    // (Your own island is reached by its Home Shell or by boat, not by road.)
    if (m.dungeon || m.voyage || m.private || m.id.startsWith('daw') || ['trainfield', 'dock'].includes(m.id)) continue;
    assert.ok(routeBetween('sprout', m.id), `to ${m.id}`);
    assert.ok(routeBetween(m.id, 'sprout'), `from ${m.id}`);
  }
  const path = routeBetween('sprout', 'glade');
  assert.equal(path.length, 5, 'the shortest way round the ring');
  assert.equal(path.at(-1).to, 'glade');
  assert.ok(path.every((p, i) => i === 0 || MAPS[path[i - 1].to].portals.includes(p)), 'each step leaves from the last');
  assert.equal(nextStep('sprout', 'glade').left, 5);
  assert.equal(levelRange(MAPS.meadow1), 'Lv 1-3');
  // Each map has one road to each neighbour (no doubled portals; a homestone is a shortcut, not a road).
  for (const m of Object.values(MAPS)) {
    const to = m.portals.filter((p) => !p.hidden && !p.homestone && p.to).map((p) => p.to);
    assert.equal(new Set(to).size, to.length, `${m.id} has two roads to one place`);
  }
});

test('every big hunting map has a homestone at its far end, one way back to its town', () => {
  for (const m of Object.values(MAPS)) {
    if (m.isTown || m.dungeon || !m.town || m.width < 2000) continue;
    const stones = m.portals.filter((p) => p.homestone);
    assert.equal(stones.length, 1, `${m.id} has a homestone`);
    const s = stones[0];
    assert.equal(s.to, m.town, `${m.id}'s homestone goes to its town`);
    assert.ok(MAPS[m.town].portals.some((p) => p.id === s.toPortal), `${m.id}: the town has somewhere to arrive`);
    assert.ok(m.platforms.some((p) => !p.drift && s.y === p.y && s.x > p.x + 10 && s.x < p.x + p.w - 10), `${m.id}: it stands on a ledge`);
    assert.ok(!(m.ropes ?? []).some((r) => Math.abs(r.x - s.x) < 40 && s.y >= r.top && s.y <= r.bottom), `${m.id}: clear of ropes`);
    assert.ok(!m.portals.some((p) => p !== s && Math.abs(p.x - s.x) < 80 && Math.abs(p.y - s.y) < 8), `${m.id}: clear of other portals`);
  }
  // The guide never sends you through one (it's one way).
  assert.ok(!routeBetween('sprout', 'starfall').some((p) => p.homestone));
});

test('the guide leads to a place and stops on arrival; a quest knows where it wants you', () => {
  const char = createCharacter('Hana', {});
  char.level = 12;
  const w = createWorld(char);
  loadMap(w, 'sprout', 'start');
  setRoute(w, 'meadow2');
  assert.equal(w.route.to, 'meadow2');
  loadMap(w, 'meadow2', 'west');
  checkArrival(w);
  assert.equal(w.route, null);
  char.quests.first_steps = { state: 'done' };
  acceptQuest(char, 'fluffy');
  assert.equal(questTarget(char, 'fluffy'), 'meadow1', 'Fox Fluff comes from the Kitsune Kits in Petal Meadow');
  char.quests.snail_trouble = { state: 'done' };
  acceptQuest(char, 'pip_parcel');
  assert.equal(questTarget(char, 'pip_parcel'), 'harbor', 'the parcel goes to Rook at the harbor');
});

// A stand-in for the canvas, enough for the quest moments to draw: it keeps the words drawn.
function fakeUi() {
  const said = [];
  const target = {};
  const ctx = new Proxy(target, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === 'measureText') return (s) => ({ width: String(s).length * 4 });
      if (k === 'fillText') return (s) => { said.push(String(s)); };
      return () => ctx;
    },
    set(o, k, v) {
      o[k] = v;
      return true;
    },
  });
  return { ui: { ctx, mouse: { x: -99, y: -99, clicked: false, right: false, double: false, wheel: 0 } }, said, state: { cam: { x: 0, y: 0 }, hud: {} } };
}

test('someone who stands in several places is found where you are, or at the nearest of them', () => {
  assert.deepEqual(npcMaps('kuro').sort(), ['dawnbeach', 'dock', 'trainfield']);
  for (const here of ['dawnbeach', 'trainfield', 'dock']) assert.equal(npcMap('kuro', here), here, `Kuro is right here on ${here}`);
  // Posy keeps shop in four towns: from the meadow, the nearest by road.
  const dist = distancesFrom('meadow1');
  const nearest = npcMaps('posy').reduce((a, b) => ((dist.get(b) ?? 99) < (dist.get(a) ?? 99) ? b : a));
  assert.equal(npcMap('posy', 'meadow1'), nearest);
  assert.equal(objectiveHint({ type: 'talk', npc: 'kuro' }, 'dock'), 'Sunny Dock');
  // A monster on several maps: the hint and the guide start from where you are.
  assert.equal(objectiveHint({ type: 'collect', item: 'fluff' }, 'trainfield'), 'Kitsune Kit, Practice Field');
  assert.equal(mobMap('puffle', 'trainfield'), 'trainfield');
});

test('the Practice Field: a ready quest sends you to the Kuro beside you, and a quest route ends with its hand-in', () => {
  const c = createCharacter('Tutee', {});
  Object.assign(c, { mapId: 'dawnbeach', portal: 'start', tutorial: { step: 7 } });
  const w = createWorld(c);
  c.quests.tut_hello = { state: 'done' };
  loadMap(w, 'trainfield', 'west');
  acceptQuest(c, 'tut_practice');
  const { ui, said, state } = fakeUi();
  drawQuestFx(ui, state, w);
  for (let i = 0; i < 3; i++) recordKill(c, 'puffle');
  addItem(c.inventory, 'fluff', 3);
  assert.equal(questTarget(c, 'tut_practice'), 'trainfield', 'Kuro is on this map');
  for (let i = 0; i < 30; i++) {
    w.now += 1 / 30;
    drawQuestFx(ui, state, w);
  }
  assert.equal(w.route ?? null, null, 'no guide off to Dawnlight Beach');
  const banner = said.find((s) => s.includes('report to Kuro'));
  assert.ok(banner, 'the ready banner names Kuro');
  assert.ok(!banner.includes(' in '), `and no other map: "${banner}"`);
  // An old route to the beach, left over for this quest, ends once Kuro is right here...
  w.route = { to: 'dawnbeach', quest: 'tut_practice' };
  drawQuestFx(ui, state, w);
  assert.equal(w.route, null);
  // ...and a route set for a quest ends when it's handed in.
  w.route = { to: 'dawnbeach', quest: 'tut_practice' };
  questCompleted(w, 'tut_practice', completeQuest(c, 'tut_practice'));
  assert.equal(w.route, null, 'no pill left pointing back west');
  // Somebody else's route stays.
  setRoute(w, 'dock');
  drawQuestFx(ui, state, w);
  assert.equal(w.route?.to, 'dock');
});

test('a quest finished on another map tags its route, which ends when the quest is done', () => {
  const char = createCharacter('Hana', {});
  char.level = 5;
  char.quests.first_steps = { state: 'done' };
  const w = createWorld(char);
  loadMap(w, 'meadow1', 'west');
  acceptQuest(char, 'fluffy');
  const { ui, state } = fakeUi();
  drawQuestFx(ui, state, w);
  addItem(char.inventory, 'fluff', 8);
  w.now += 0.1;
  drawQuestFx(ui, state, w);
  assert.deepEqual(w.route, { to: npcMap('mira', 'meadow1'), quest: 'fluffy' }, 'off to Mira, for this quest');
  // Handed in some other way (a scene, another window): the next frame lets the guide go.
  completeQuest(char, 'fluffy');
  w.now += 0.1;
  drawQuestFx(ui, state, w);
  assert.equal(w.route, null);
});

test('item hints point to a monster that is really out on a map, or to where the thing is gathered', () => {
  // Old MacGoblin drops both, but he sleeps in the barn until 150 hunts wake him.
  assert.equal(objectiveHint({ type: 'collect', item: 'mushcap' }), 'Toadstool Goblin, Clover Hills');
  assert.equal(objectiveHint(QUESTS.story_1_3.objectives.find((o) => o.item === 'mushcap')), 'Toadstool Goblin, Clover Hills');
  assert.equal(objectiveHint({ type: 'collect', item: 'clover' }), 'Gathering, Clover Hills', 'Lucky Clover is picked in the hills');
  for (const q of Object.values(QUESTS)) {
    for (const o of q.objectives) {
      if (o.type !== 'collect') continue;
      const at = itemPlace(o.item);
      assert.ok(at?.map, `${q.id}: ${o.item} says where`);
      assert.ok(at.label.endsWith(MAPS[at.map].dungeon ? at.label.split(', ').at(-1) : MAPS[at.map].name), `${q.id}: ${at.label}`);
      const mob = Object.values(MOBS).find((m) => at.label.startsWith(`${m.name},`));
      if (mob) assert.ok(!mob.boss || itemSources(o.item).every((id) => MOBS[id].boss), `${q.id}: ${at.label} sends you to a boss`);
    }
  }
  // The guide agrees with the hint.
  const char = createCharacter('Hana', {});
  Object.assign(char, { level: 20, mapId: 'sprout' });
  char.quests.bun_buddy = { state: 'active', kills: { sproutling: 15 }, marks: {} };
  assert.equal(questTarget(char, 'bun_buddy', null), 'meadow2');
});

test('the HUD and quest cards under a window never take its clicks', () => {
  const ui = createUiState();
  const bag = ui.windows.bag;
  Object.assign(bag, { open: true, x: 300, y: 56, w: 200, h: 180 });
  const m = { x: 320, y: 90, clicked: true, right: false, double: true, wheel: 0 };
  assert.ok(overWindow(ui, m));
  let seen = null;
  underWindows({ mouse: m }, overWindow(ui, m), () => {
    seen = { clicked: m.clicked, double: m.double };
  });
  assert.deepEqual(seen, { clicked: false, double: false }, 'the reward card under the bag sees no click');
  assert.ok(m.clicked && m.double, 'the bag on top still gets it');
  // Off the window the HUD gets the click as before, and may use it up.
  const off = { x: 120, y: 90, clicked: true, right: false, double: false, wheel: 0 };
  assert.ok(!overWindow(ui, off));
  underWindows({ mouse: off }, overWindow(ui, off), () => {
    off.clicked = false;
  });
  assert.equal(off.clicked, false);
  // The talk box is on top of everything below it too.
  bag.open = false;
  ui.npc = { id: 'kuro' };
  Object.assign(ui.windows.npc, { open: true, x: 100, y: 184, w: 440, h: 138 });
  assert.ok(overWindow(ui, { x: 300, y: 250 }));
  assert.ok(!overWindow(ui, { x: 300, y: 90 }));
});

test('the reward card takes a click on it when nothing is on top', () => {
  const c = createCharacter('Tutee', {});
  const w = createWorld(c);
  const { ui, state } = fakeUi();
  questCompleted(w, 'tut_hello', { exp: 5, gold: 9, items: [] });
  drawQuestFx(ui, state, w);
  w.now += 1.5;
  Object.assign(ui.mouse, { x: 320, y: 90, clicked: true });
  drawQuestFx(ui, state, w);
  assert.equal(ui.mouse.clicked, false, 'used to hurry the card along');
  assert.ok(w.questFx.cur.life < 2.1);
});

test('a find is sent to its best gathering place, not a lone spot that happens to be near', () => {
  // Sprout Village has one clover bed in its garden; the hills have clover and the Mandrakes and
  // Jackalopes that drop it.
  assert.equal(itemPlace('clover', 'sprout').map, 'meadow2');
  const char = createCharacter('Hana', {});
  Object.assign(char, { level: 20, mapId: 'sprout' });
  char.quests.bun_buddy = { state: 'active', kills: { sproutling: 15 }, marks: {} };
  assert.equal(questTarget(char, 'bun_buddy'), 'meadow2');
  assert.equal(objectiveHint(QUESTS.bun_buddy.objectives[1], 'sprout'), 'Gathering, Clover Hills');
});

// A stand-in canvas that also keeps the clip calls.
function clipUi() {
  const clips = [];
  const ctx = new Proxy({}, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === 'measureText') return (s) => ({ width: String(s).length * 4 });
      if (k === 'clip') return (rule) => { clips.push(rule); };
      return () => ctx;
    },
    set(o, k, v) {
      o[k] = v;
      return true;
    },
  });
  return { ui: { ctx, mouse: { x: -99, y: -99, clicked: false, right: false, double: false, wheel: 0 } }, clips };
}

const touches = (a, b) => Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x) && Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y);

test('the quest moments never cover the lesson card, wherever it has stepped to', () => {
  const c = createCharacter('Tutee', {});
  Object.assign(c, { mapId: 'dawnbeach', portal: 'start', tutorial: { step: 3 } });
  const w = createWorld(c);
  loadMap(w, 'trainfield', 'west');
  c.quests.tut_hello = { state: 'done' };
  acceptQuest(c, 'tut_practice');
  // The card where ui/hud.js may put it: its usual spot, beside or above a window, wrapped.
  const cards = [];
  for (const [cw, lines] of [[300, 1], [520, 1], [267, 2], [180, 3], [150, 5]]) {
    for (const x of [4, 60, 170, 320 - cw / 2, 636 - cw]) for (const y of [4, 30, 54, 70, 96, 120]) cards.push({ x, y, w: cw, lines, h: lines > 1 ? 26 + (lines - 1) * 14 : 24 });
  }
  const moments = [
    (fx) => fx.queue.push({ kind: 'accept', ids: ['tut_practice'] }),
    (fx) => fx.queue.push({ kind: 'ready', id: 'tut_practice' }),
    (fx) => fx.queue.push({ kind: 'complete', id: 'tut_practice', r: { exp: 5, gold: 9, items: [] } }),
  ];
  let checked = 0;
  for (const card of cards) {
    if (card.x + card.w > 636) continue;
    for (const bag of [null, { open: true, x: 300, y: 56, w: 332, h: 264 }]) {
      if (bag && touches(card, bag)) continue;
      for (const start of moments) {
        const { ui, clips } = clipUi();
        const state = { cam: { x: 0, y: 0 }, hud: {}, windows: bag ? { bag } : {}, tutCard: { x: card.x, y: card.y, t: performance.now() / 1000, sig: `Do the thing.|${card.w}|${card.lines}`, popAt: -9 } };
        w.questFx = undefined;
        drawQuestFx(ui, state, w);
        start(w.questFx);
        w.questFx.cheers.push({ at: w.now, label: 'Kitsune Kit 3/3' });
        for (let f = 0; f < 40; f++) {
          w.now += 1 / 30;
          drawQuestFx(ui, state, w);
          const fx = w.questFx;
          const where = `card ${JSON.stringify(card)}${bag ? ' beside the bag' : ''}, ${fx.cur?.kind} at frame ${f}`;
          assert.ok(fx.rect && !touches(fx.rect, card), `${where}: ${JSON.stringify(fx.rect)}`);
          assert.ok(!fx.cheerRect || !touches(fx.cheerRect, card), `${where}: the cheer ${JSON.stringify(fx.cheerRect)}`);
          assert.ok(!fx.cheerRect || !touches(fx.cheerRect, fx.rect), `${where}: the cheer sits on the ${fx.cur?.kind}`);
          assert.ok(fx.rect.y >= 2 && fx.rect.y + fx.rect.h <= 300 && fx.rect.x >= 2 && fx.rect.x + fx.rect.w <= 638, `${where}: on screen`);
          checked++;
        }
        // Whatever still crosses it on the way (a sparkle, the stamp landing) goes under it.
        assert.ok(clips.length && clips.every((r) => r === 'evenodd'), 'the card is cut out of what they draw');
      }
    }
  }
  assert.ok(checked > 10000);
  // The skeptic's case: the bag lesson's card beside the bag (two lines), Kuro's reward card.
  const { ui } = clipUi();
  const state = { cam: { x: 0, y: 0 }, hud: {}, windows: { bag: { open: true, x: 300, y: 56, w: 332, h: 264 } }, tutCard: { x: 26, y: 70, t: performance.now() / 1000, sig: 'Open your bag with [I] and double-click your weapon to hold it.|266.86|2', popAt: -9 } };
  w.questFx = undefined;
  questCompleted(w, 'tut_hello', { exp: 5, gold: 9, items: [] });
  drawQuestFx(ui, state, w);
  assert.ok(w.questFx.rect.y >= 70 + 40, 'below the card');
  assert.ok(w.questFx.rect.x + w.questFx.rect.w <= 300, 'and out from under the bag');
});

test('with no lesson and nothing open, the quest moments keep their own spots', () => {
  const c = createCharacter('Hana', {});
  c.tutorial = { step: 999 };
  const w = createWorld(c);
  loadMap(w, 'sprout', 'start');
  const { ui, clips } = clipUi();
  const state = { cam: { x: 0, y: 0 }, hud: {}, windows: {}, tutCard: null };
  questCompleted(w, 'fluffy', { exp: 120, gold: 300, items: [] });
  drawQuestFx(ui, state, w);
  assert.deepEqual(w.questFx.rect, { x: 193, y: 44, w: 254, h: 90 }, 'the reward card at the top middle');
  assert.equal(clips.length, 0, 'nothing cut out');
  // A window over its spot: it steps out into the clear beside it.
  state.windows = { bag: { open: true, x: 300, y: 56, w: 332, h: 264 } };
  for (let f = 0; f < 45; f++) {
    w.now += 1 / 30;
    drawQuestFx(ui, state, w);
  }
  assert.ok(w.questFx.rect.x + w.questFx.rect.w <= 300 && w.questFx.rect.x >= 2, JSON.stringify(w.questFx.rect));
  assert.ok(Math.abs(w.questFx.rect.y - 44) < 0.5, 'at the same height');
});
