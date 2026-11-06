import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settings, DEFAULT_SETTINGS } from '../src/core/settings.js';
import { createUiState } from '../src/ui/manager.js';

test('windows come back where you left them; talk boxes and trades never fold or wander', () => {
  const had = settings.windowPos;
  settings.windowPos = { bag: { x: 420, y: 90, min: true }, quests: { x: 9999, y: -50 } };
  try {
    const s = createUiState();
    assert.deepEqual([s.windows.bag.x, s.windows.bag.y, s.windows.bag.moved, s.windows.bag.key], [420, 90, true, 'bag']);
    assert.ok(s.windows.quests.x <= 600 && s.windows.quests.y >= 8, 'a spot off the screen is pulled back on');
    assert.equal(s.windows.npc.key, undefined);
    assert.equal(s.windows.trade.key, undefined);
  } finally {
    settings.windowPos = had;
  }
});

test('the layout settings start in their usual places', () => {
  assert.deepEqual(DEFAULT_SETTINGS.windowPos, {});
  assert.equal(DEFAULT_SETTINGS.minimapSize, 'normal');
  assert.equal(DEFAULT_SETTINGS.minimapPos, null);
  assert.equal(DEFAULT_SETTINGS.minimapMin, false);
});

test('a moved, resized HUD piece takes the mouse with it, and hidden ones see no clicks', async () => {
  const { piece, intoPiece } = await import('../src/ui/layout.js');
  const had = settings.layout;
  const ctx = { save() {}, restore() {}, translate() {}, scale() {}, beginPath() {}, rect() {}, clip() {} };
  const mouse = { x: 0, y: 0, clicked: true, down: true, right: false, double: false, wheel: 0 };
  const ui = { ctx, mouse };
  try {
    settings.layout = { hotkeys: { dx: -100, dy: -200, s: 2 }, log: { hide: true } };
    let seen = null;
    Object.assign(mouse, { x: 300 + 10, y: 100 + 10 });
    piece(ui, 'hotkeys', { x: 400, y: 300, w: 100, h: 20 }, () => { seen = [mouse.x, mouse.y]; });
    assert.deepEqual(seen, [405, 305], 'a point 10 px into the moved, doubled piece is 5 px into it');
    assert.deepEqual(intoPiece('hotkeys', 310, 110), [405, 305]);
    piece(ui, 'log', { x: 0, y: 200, w: 100, h: 50 }, () => { seen = mouse.clicked; });
    assert.equal(seen, false);
    assert.equal(mouse.clicked, true, "the click is still there for whatever's under it");
  } finally {
    settings.layout = had;
  }
});

test('keys rebind: the action moves, its old key goes quiet, and a clash swaps', async () => {
  const { bind, gameCode, physOf, resetKeys } = await import('../src/core/keys.js');
  const had = settings.keys;
  try {
    settings.keys = {};
    assert.equal(gameCode('KeyI'), 'KeyI');
    bind('KeyI', 'KeyU');
    assert.equal(gameCode('KeyU'), 'KeyI', 'U opens the Bag now');
    assert.equal(gameCode('KeyI'), null, 'and I does nothing');
    bind('KeyI', 'KeyC');
    assert.equal(gameCode('KeyC'), 'KeyI', 'C opens the Bag');
    assert.equal(physOf('KeyC'), 'KeyU', 'and Stats went onto the Bag\'s old key');
    assert.equal(gameCode('KeyU'), 'KeyC');
    assert.equal(bind('KeyI', 'Escape'), false, 'Esc is never taken');
    resetKeys();
    assert.equal(gameCode('KeyC'), 'KeyC');
  } finally {
    settings.keys = had;
  }
});

// ---------- Drawing windows in node: a canvas that remembers what was written and filled ----------

// Every fillText (with its size) and every filled shape's bounds, for checking a layout. Text is
// measured at about half its size per letter, near enough for wrapping to behave.
function fakeCanvas() {
  const texts = [];
  const fills = [];
  let font = '10px x';
  let bounds = null;
  const sizeOf = () => parseFloat(/([\d.]+)px/.exec(font)?.[1] ?? 10);
  const grow = (x, y) => {
    bounds ??= { x0: x, y0: y, x1: x, y1: y };
    Object.assign(bounds, { x0: Math.min(bounds.x0, x), y0: Math.min(bounds.y0, y), x1: Math.max(bounds.x1, x), y1: Math.max(bounds.y1, y) });
  };
  const anything = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()), apply: () => anything(), set: () => true });
  const own = {
    measureText: (s) => ({ width: String(s).length * sizeOf() * 0.52 }),
    fillText: (s, x, y) => texts.push({ s: String(s), x, y, size: sizeOf(), w: String(s).length * sizeOf() * 0.52 }),
    getTransform: () => ({ a: 1 }),
    beginPath: () => { bounds = null; },
    moveTo: grow, lineTo: grow,
    quadraticCurveTo: (cx, cy, x, y) => grow(x, y),
    arcTo: (x1, y1, x2, y2) => { grow(x1, y1); grow(x2, y2); },
    rect: (x, y, w, h) => { grow(x, y); grow(x + w, y + h); },
    fill() { if (bounds) fills.push({ style: this.fillStyle, ...bounds }); },
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
  };
  const ctx = new Proxy(own, {
    get: (t, k) => (k === 'font' ? font : k in t ? t[k] : typeof k === 'symbol' ? undefined : (t[k] = () => anything())),
    set: (t, k, v) => ((k === 'font' ? (font = v) : (t[k] = v)), true),
  });
  globalThis.document ??= { createElement: () => ({ getContext: () => ctx, width: 1, height: 1 }) };
  globalThis.ImageData ??= class { constructor(data, width, height) { Object.assign(this, { data, width, height }); } };
  return { ctx, texts, fills, clear: () => { texts.length = 0; fills.length = 0; } };
}

// One frame of a window: `keys` pressed this frame, the mouse at `mouse`.
async function uiFrame(canvas, draw, { keys = [], mouse = {}, typed = [], touch = false } = {}) {
  const { beginUi } = await import('../src/ui/kit.js');
  const input = { mouse: { x: -100, y: -100, clicked: false, down: false, wheel: 0, ...mouse }, pressed: new Set(keys), held: new Set(), typed, touch };
  const ui = beginUi(canvas.ctx, input);
  canvas.clear();
  draw(ui);
  return ui;
}

async function talkSetup(npcId, job, level, quests = {}) {
  const { createCharacter } = await import('../src/core/character.js');
  const char = createCharacter('Rin', {});
  Object.assign(char, { job, level });
  for (const [id, state] of Object.entries(quests)) char.quests[id] = { state };
  const state = createUiState();
  state.npc = { id: npcId };
  state.windows.npc.open = true;
  const logs = [];
  const world = { char, now: 1, log: (t) => logs.push(t), fx: [], events: [], body: { x: 0, y: 0, vx: 0 }, map: { id: 'village' }, mobs: [] };
  return { char, state, world, logs };
}

test('every job card fits its words: no blurb runs over the next line, out of its card, or off the page', async () => {
  const { npcWindow } = await import('../src/ui/npc.js');
  const { JOBS, nextJobs } = await import('../src/data/jobs.js');
  const { NPCS } = await import('../src/data/npcs.js');
  const canvas = fakeCanvas();
  const instructors = Object.values(NPCS).filter((n) => n.role === 'instructor');
  let cards = 0;
  // (On a phone too, where small text is held to a bigger size.)
  for (const touch of [false, true]) for (const first of Object.values(JOBS).filter((j) => j.parent === 'novice')) {
    const teacher = instructors.find((n) => n.family === first.family);
    // The first job at level 5, then its paths at 30 with the trial passed.
    for (const [job, level] of [['novice', first.level], [first.id, 30]]) {
      const paths = nextJobs(job, level).filter((j) => j.family === first.family);
      const { state, world } = await talkSetup(teacher.id, job, level, Object.fromEntries(paths.filter((j) => j.trial).map((j) => [j.trial, 'done'])));
      state.npc.job = true;
      await uiFrame(canvas, (ui) => npcWindow(ui, state, world), { touch });
      const win = state.windows.npc;
      const white = canvas.fills.filter((f) => f.style === '#ffffff' && f.x1 - f.x0 > 250);
      assert.equal(white.length, paths.length, `${teacher.id}: one card per path`);
      const names = paths.map((j) => canvas.texts.find((t) => t.s === j.name && t.size === 9.5));
      for (const [k, j] of paths.entries()) {
        cards++;
        // A card's words: everything written at its name's left edge, down to the next card's name.
        const name = names[k];
        const below = canvas.texts.filter((t) => t.x === name.x && t.y > name.y && t.y < (names[k + 1]?.y ?? Infinity));
        const lines = below.filter((t) => t.size === (touch ? 7.5 : 7) && !t.s.includes('· grows'));
        assert.equal(lines.map((t) => t.s).join(' '), j.blurb, `${j.name}: the whole blurb shows`);
        const stat = below.find((t) => t.s.includes('· grows'));
        assert.ok(stat, `${j.name}: what it fights with and grows`);
        const card = white.find((f) => f.y0 <= name.y && name.y <= f.y1);
        assert.ok(card, `${j.name}: its blurb starts inside a card`);
        for (const t of [stat, ...lines]) {
          assert.ok(t.y - t.size * 0.8 >= card.y0 && t.y + 2 <= card.y1, `${j.name}: "${t.s}" sits inside its card`);
          assert.ok(t.y - t.size >= win.y && t.y <= win.y + win.h, `${j.name}: "${t.s}" is on the page`);
        }
      }
      // Nothing written on the page overprints anything else.
      const onPage = canvas.texts.filter((t) => t.x > win.x + 100);
      for (const [i, a] of onPage.entries()) {
        for (const b of onPage.slice(i + 1)) {
          const sideBySide = a.x < b.x + b.w && b.x < a.x + a.w;
          if (sideBySide) assert.ok(Math.abs(a.y - b.y) >= Math.min(a.size, b.size) * 0.95 || /Choose/.test(a.s + b.s), `"${a.s}" and "${b.s}" don't overprint`);
        }
      }
    }
  }
  assert.ok(cards >= 24, 'every first job and every path was checked');
});

test('taking a job says "a" or "an" as the name needs', async () => {
  const { npcWindow } = await import('../src/ui/npc.js');
  const canvas = fakeCanvas();
  for (const [teacher, name] of [['kestrel', 'You are now an Acrobat Archer!'], ['brann', 'You are now a Warrior!']]) {
    const { state, world, logs } = await talkSetup(teacher, 'novice', 5);
    state.npc.job = true;
    await uiFrame(canvas, (ui) => npcWindow(ui, state, world), { keys: ['Digit1'] });
    assert.ok(logs.some((l) => l.startsWith(name)), `${teacher}: ${logs[0]}`);
    assert.ok(!logs.some((l) => / a [AEIOU]/.test(l)), `no "a" before a vowel: ${logs.join(' / ')}`);
    assert.equal(world.scene?.vars?.aJob, name.slice('You are now '.length, -1));
  }
});

test('Enter shows the rest of the words first, and only a fresh Enter takes the quest', async () => {
  const { npcWindow } = await import('../src/ui/npc.js');
  const { QUESTS } = await import('../src/data/quests.js');
  const canvas = fakeCanvas();
  const { NPCS } = await import('../src/data/npcs.js');
  // A plain quest anyone can take (no story scene, nothing to carry, no step before it).
  const q = Object.values(QUESTS).find((d) => NPCS[d.giver]?.quests?.includes(d.id) && !d.prereq && !d.family && !d.story && !d.scenes && !d.gives && !d.daily && d.minLevel <= 30);
  const id = q.id;
  const { state, world, char } = await talkSetup(q.giver, 'novice', 30);
  state.npc.quest = id;
  const frame = (keys) => uiFrame(canvas, (ui) => npcWindow(ui, state, world), { keys });
  await frame([]);
  world.now += 0.1;
  await frame(['Enter']);
  assert.notEqual(char.quests[id]?.state, 'active', 'the first Enter only finished the words');
  assert.equal(state.npc.talking, false, 'all the words are out');
  assert.ok(canvas.texts.some((t) => QUESTS[id].text.endsWith(t.s)), 'down to the last word');
  world.now += 0.1;
  await frame(['Enter']);
  assert.equal(char.quests[id]?.state, 'active', 'the next Enter accepts it');
  // On the greeting, Enter, the keypad's Enter, Z and Space all finish the words too.
  for (const key of ['Enter', 'NumpadEnter', 'KeyZ', 'Space']) {
    state.npc = { id: 'kestrel' };
    await frame([]);
    world.now += 0.05;
    const ui = await frame([key]);
    assert.equal(state.npc.talking, false, `${key} finishes the greeting`);
    assert.ok(!ui.input.pressed.has(key), `${key} was used up doing it`);
    world.now += 1;
  }
});

test("the Skills window's + note sits over the list, never on the skill's details", async () => {
  const { skillsWindow } = await import('../src/ui/skills.js');
  const { createCharacter } = await import('../src/core/character.js');
  const canvas = fakeCanvas();
  const char = createCharacter('Rin', {});
  Object.assign(char, { level: 3, sp: 2 });
  const state = createUiState();
  const win = Object.assign(state.windows.skills, { open: true, x: 150, y: 50, pick: 'quickstep' });
  const world = { char, now: 1, log: () => {} };
  const draw = (ui) => skillsWindow(ui, state, world);
  await uiFrame(canvas, draw);
  const row = canvas.texts.find((t) => t.s === 'Quick Step' && t.x < win.x + 160);
  const details = canvas.texts.find((t) => t.s === 'Quick Step' && t.x > win.x + 160);
  const desc = canvas.texts.find((t) => /faster/.test(t.s));
  // The mouse on that row's + button.
  const ui = await uiFrame(canvas, draw, { mouse: { x: win.x + 8 + 150 - 11, y: row.y - 11 + 12 } });
  const note = canvas.texts.find((t) => t.s === 'Learn Quick Step');
  assert.ok(note, 'the note shows');
  assert.equal(ui.tooltip, null, 'pinned in place, not following the mouse');
  assert.ok(note.x + note.w <= details.x - 8, 'it stays left of the details');
  assert.ok(note.y < row.y - 8, 'above the row it explains');
  assert.ok(note.y < desc.y - 20, "and nowhere near the skill's description");
});

test("Lulu reacts to the name on the door, and asks for one only while there isn't one", async () => {
  const { creatorScreen } = await import('../src/ui/creator.js');
  const { randomLook } = await import('../src/ui/looks.js');
  const canvas = fakeCanvas();
  const asks = /needs a name|no name|blank/i;
  for (let run = 0; run < 12; run++) {
    const draft = { name: '', look: randomLook() };
    let time = 0;
    const frame = (typed = []) => uiFrame(canvas, (ui) => creatorScreen(ui, time, draft), { typed });
    // Waiting with no name: she nudges toward the name field before long.
    for (; time < 12; time += 0.25) await frame();
    assert.match(draft.lulu.line, asks, 'no name yet: she asks for one');
    for (const ch of 'Pip') {
      await frame([ch]);
      time += 0.1;
      assert.doesNotMatch(draft.lulu.line, asks, 'a name is going on the door: no more asking');
    }
    for (const end = time + 2; time < end; time += 0.1) await frame();
    assert.match(draft.lulu.line, /Pip|name/, `she reacts to the name: "${draft.lulu.line}"`);
    assert.doesNotMatch(draft.lulu.line, asks);
    // Rubbed out: the praise goes, and she asks again.
    await frame(['\b', '\b', '\b']);
    assert.doesNotMatch(draft.lulu.line, /Pip|that name/, 'no praise for a name that is gone');
    assert.match(draft.lulu.line, asks);
  }
});

test('the emote wheel and the right-click menu keep their clicks from what is drawn under them', async () => {
  const { overWindow } = await import('../src/ui/manager.js');
  const base = { order: [], windows: {}, npc: null, death: null };
  assert.equal(overWindow({ ...base }, { x: 320, y: 120 }), false, 'nothing open: the world (and the quest card) gets it');
  assert.equal(overWindow({ ...base, emotes: true }, { x: 320, y: 120 }), true, 'the wheel covers the screen');
  const menu = { kind: 'self', x: 300, y: 100, box: { x: 300, y: 100, w: 118, h: 52 } };
  assert.equal(overWindow({ ...base, menu }, { x: 320, y: 120 }), true, 'inside the menu');
  assert.equal(overWindow({ ...base, menu }, { x: 200, y: 120 }), false, 'outside it');
});
