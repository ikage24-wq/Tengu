// Entry point: canvas scaling, screens (title -> character select -> creator -> game), the fixed-step loop, and autosave.

import { timed, record } from './core/frametimes.js';
import { awayNow } from './world/nightmarket.js';
import { createInput, endFrame, VW, VH } from './input.js';
import { beginUi, endUi } from './ui/kit.js';
import { titleScreen, selectScreen, creatorScreen, randomLook } from './ui/screens.js';
import { createUiState, routeInput, drawUi } from './ui/manager.js';
import { createCharacter } from './core/character.js';
import { addItem, countItem } from './core/inventory.js';
import { ITEMS } from './data/items.js';
import { saveGame, loadGame, deleteSave, worldChars, loadWorld, createWorldFile, deleteWorld, copyWorld, addPlayTime, FILES } from './core/save.js';
import { filesScreen } from './ui/files.js';
import { createWorld, updateWorld, useItem } from './world/world.js';
import { groundAt } from './world/physics.js';
import { createCamera, updateCamera, drawWorld } from './render/scene.js';
import { settings, loadSettings } from './core/settings.js';
import { setHd, gfx, nextFrame } from './render/pixel.js';
import { VIVID } from './render/post.js';
import { createBots, updateBots, botsIn, bodiedIn } from './world/bots.js';
import { updateGrouping } from './world/grouping.js';
import { partyMembers, shareKill } from './world/party.js';
import { openMenu } from './ui/party.js';
import { openProfile } from './ui/profile.js';
import { unlock, setAway } from './audio/engine.js';
import { hearWorld, hearUi } from './audio/listen.js';
import { updateMusic } from './audio/music.js';
import { stopAmbience } from './audio/ambience.js';
import { preloadFxSprites } from './render/fx-sprites.js';
import { tickNet, leaveRoom, othersHere } from './net/online.js';
import { ISLAND_LESSONS } from './world/tutorial.js';
import { createTouch, touchFrame } from './ui/touch.js';
import { targetAt, walkTo, steer } from './world/clicks.js';

loadSettings();

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
// Phones and tablets: on-screen controls (see ui/touch.js).
const touch = createTouch(canvas, input);

// Render at the display's pixel density so text stays sharp; the game itself is 640x360.
// (Big screen: Fast draws at most twice the game's size and lets the screen stretch it, smoothly,
// since every extra pixel is drawn each frame; Sharp draws them all.)
const FAST_SCALE = 2;
let pixelScale = 1;
let fitFor = null;
function fit() {
  fitFor = settings.sharpness;
  const fitScale = Math.min(window.innerWidth / VW, window.innerHeight / VH);
  canvas.style.width = `${Math.floor(VW * fitScale)}px`;
  canvas.style.height = `${Math.floor(VH * fitScale)}px`;
  const full = Math.max(1, Math.round(fitScale * (window.devicePixelRatio || 1)));
  pixelScale = settings.sharpness === 'sharp' ? full : Math.min(full, FAST_SCALE);
  canvas.style.imageRendering = pixelScale < full ? 'auto' : '';
  canvas.width = VW * pixelScale;
  canvas.height = VH * pixelScale;
}
window.addEventListener('resize', fit);
fit();

const TICK = 1 / 60;
const AUTOSAVE_EVERY = 20;

let screen = 'title';
let chars = [];
const lobby = { slot: 0, file: 0, confirm: false };
// The save files screen: which file is picked, each file's world and heroes.
const files = { file: 0, worlds: [], chars: [], confirm: false, naming: false, name: '' };
let draft = null;
let world = null;
// (For the live speed check: the browser's console reads the world, `__tengu.world`.)
globalThis.__tengu = { get world() { return world; } };
let uiState = null;
let camera = null;
let autosave = AUTOSAVE_EVERY;

// The effect sprite strips load in the background from the start.
preloadFxSprites();

function startGame(char) {
  world = createWorld(char);
  world.settings = settings;
  // (The crowd follows the game's day: world/botsoul.js populationAt.)
  // (Your other heroes in this save file are in town too.)
  const alts = worldChars(char.file ?? 0).filter((c) => c && c.slot !== char.slot);
  world.bots = createBots(world, Math.random, { daily: true, alts });
  world.onKill = (m) => shareKill(world.bots, world, m);
  uiState = createUiState();
  camera = createCamera();
  screen = 'game';
  autosave = AUTOSAVE_EVERY;
  if (char.tutorial && char.tutorial.step === 0) world.log('Welcome to Dawnlight Isle!', '#ffe36b');
  else if (!char.quests.first_steps && (!char.tutorial || char.tutorial.step === ISLAND_LESSONS)) world.log('Welcome! Walk up to Mira and press Up to talk.', '#ffe36b');
}

function loadFiles() {
  files.worlds = Array.from({ length: FILES }, (_, f) => loadWorld(f));
  files.chars = files.worlds.map((w, f) => (w ? worldChars(f) : []));
}

function loadChars() {
  chars = worldChars(lobby.file);
  lobby.worldName = loadWorld(lobby.file)?.name ?? '';
}

// Opens a save file's world at its character select.
function openFile(f) {
  lobby.file = f;
  loadChars();
  lobby.slot = Math.max(0, chars.findIndex(Boolean));
  lobby.confirm = false;
  screen = 'select';
}

function newCharacter(name, look, slot = 0, tutorial = true, file = 0) {
  const char = createCharacter(name, look);
  char.slot = slot;
  char.file = file;
  // On the tutorial island (Dawnlight Isle) unless they chose to skip it.
  if (tutorial) {
    char.mapId = 'dawnbeach';
    char.portal = 'start';
    char.tutorial = { step: 0 };
  } else char.tutorial = { step: ISLAND_LESSONS };
  addItem(char.inventory, 'red_potion', 3);
  char.hotkeys.Digit1 = { item: 'red_potion' };
  char.hotkeys.Digit2 = { item: 'blue_potion' };
  return char;
}

window.addEventListener('visibilitychange', () => {
  if (document.hidden && world) saveGame(world.char);
  setAway(document.hidden);
});
window.addEventListener('blur', () => setAway(true));
window.addEventListener('focus', () => setAway(false));

// Auto potion (Options > Gameplay): when HP or MP drops below the line, a tonic from your hotkeys
// (the first one bound that restores it), as soon as you could drink one by hand.
function autoPotion(world) {
  const line = { '30%': 0.3, '50%': 0.5 }[settings.autoPotion];
  if (!line || world.dead || world.scene) return;
  const s = world.stats;
  const char = world.char;
  for (const [stat, max, keys] of [['hp', s.maxHp, ['hp', 'hpPct']], ['mp', s.maxMp, ['mp', 'mpPct']]]) {
    if (char[stat] >= max * line) continue;
    const id = Object.values(char.hotkeys).map((b) => b?.item).find((it) => it && keys.some((k) => ITEMS[it]?.effect?.[k]) && !ITEMS[it].effect.food && countItem(char.inventory, it) > 0);
    if (id && useItem(world, id)) return;
  }
}

let last = performance.now();
let acc = 0;
let queued = new Set();

// HD drops its costliest extras (the glow, then the lighting) on a device that can't keep up.
const perf = { frames: 0, time: 0 };
function watchSpeed(raw) {
  if (!settings.hdGraphics || raw > 0.25) return;
  perf.frames++;
  perf.time += raw;
  if (perf.time < 4) return;
  if (perf.frames / perf.time < 40) {
    if (!gfx.noGlow) gfx.noGlow = true;
    else gfx.noLight = true;
  }
  perf.frames = 0;
  perf.time = 0;
}

// The world moves in fixed ticks, but the screen may refresh at any rate. Drawing blends each
// mover's position between its last two ticks, so motion (and the camera following it) stays
// smooth instead of stepping, at 60Hz, 144Hz, or with uneven frame timing.
function movers(world) {
  return [world.body, ...world.mobs, ...bodiedIn(world.bots, world.map.id).map((b) => b.body)];
}
function remember(world) {
  for (const o of movers(world)) {
    o.prevX = o.x;
    o.prevY = o.y;
  }
}
function blended(world, alpha, draw) {
  // Anything that jumped (a new map, a teleport) is drawn where it is.
  const list = movers(world).filter((o) => o.prevX != null && Math.abs(o.x - o.prevX) < 48 && Math.abs(o.y - o.prevY) < 48);
  const real = list.map((o) => [o.x, o.y]);
  for (const o of list) {
    o.x = o.prevX + (o.x - o.prevX) * alpha;
    o.y = o.prevY + (o.y - o.prevY) * alpha;
  }
  try {
    draw();
  } finally {
    list.forEach((o, i) => {
      [o.x, o.y] = real[i];
    });
  }
}

// Browsers only allow sound after the player does something: start it on the first key or click.
for (const ev of ['pointerdown', 'pointerup', 'keydown', 'touchstart', 'touchend']) window.addEventListener(ev, unlock, { passive: true });

function step(now) {
  const raw = (now - last) / 1000;
  const dt = Math.min(0.1, raw);
  last = now;
  watchSpeed(raw);
  nextFrame();
  const time = now / 1000;
  if (settings.sharpness !== fitFor) fit();
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  ctx.imageSmoothingEnabled = false;
  setHd(settings.hdGraphics, pixelScale);
  const ui = beginUi(ctx, input);

  if (screen !== 'game') {
    updateMusic('title');
    stopAmbience();
  }
  if (screen === 'title') {
    if (titleScreen(ui, time)) {
      loadFiles();
      // (The last file played is picked to start with.)
      const recent = files.worlds.map((w, f) => [w?.lastPlayed ?? -1, f]).sort((p, q) => q[0] - p[0])[0];
      files.file = recent && recent[0] >= 0 ? recent[1] : 0;
      screen = 'files';
    }
  } else if (screen === 'files') {
    const pick = filesScreen(ui, time, files);
    if (pick === 'back') screen = 'title';
    if (pick === 'open') openFile(files.file);
    if (pick === 'create') {
      createWorldFile(files.file, files.name.trim());
      openFile(files.file);
    }
    if (pick === 'copy') {
      copyWorld(files.file, files.worlds.findIndex((w) => !w));
      loadFiles();
    }
    if (pick === 'delete') {
      deleteWorld(files.file);
      loadFiles();
    }
  } else if (screen === 'select') {
    const pick = selectScreen(ui, time, chars, lobby);
    if (pick === 'back') {
      loadFiles();
      screen = 'files';
    }
    if (pick === 'start') startGame(loadGame(lobby.slot, lobby.file));
    if (pick === 'delete') {
      deleteSave(lobby.slot, lobby.file);
      loadChars();
    }
    if (pick === 'create') {
      draft = { name: '', look: randomLook() };
      screen = 'creator';
    }
  } else if (screen === 'creator') {
    const pick = creatorScreen(ui, time, draft);
    if (pick === 'back') screen = 'select';
    if (pick === 'start') {
      const char = newCharacter(draft.name.trim(), draft.look, lobby.slot, draft.tutorial !== false, lobby.file);
      saveGame(char);
      // (Loaded back, so the new hero moves into the world's shared island, book and chest.)
      startGame(loadGame(lobby.slot, lobby.file) ?? char);
    }
  } else {
    const locked = routeInput(uiState, world, input, dt);
    // Slow motion after a big finish (a boss falling): `world.slowmo` seconds of real time at
    // a third of the speed, once any hit-stop is over. Off along with hit-stop.
    if (!settings.hitStop) world.slowmo = 0;
    const slow = world.slowmo > 0 && !(world.hitstop > 0);
    if (slow) world.slowmo -= dt;
    acc += slow ? dt * 0.35 : dt;
    for (const code of input.pressed) queued.add(code);
    const logicAt = performance.now();
    while (acc >= TICK) {
      acc -= TICK;
      // Hitstop: a few frozen ticks on big hits. Presses wait for the next real tick.
      if (!settings.hitStop) world.hitstop = 0;
      if (world.hitstop > 0) {
        world.hitstop -= TICK;
        // Effects already on screen keep playing through the stop (only the world freezes), so
        // a flash meant for one frame never hangs there; ones still waiting to start stay put.
        for (const f of world.fx) if (f.t >= 0) f.t += TICK;
        continue;
      }
      remember(world);
      // (Walking over to something clicked: world/clicks.js.)
      const walk = locked ? { held: input.held, pressed: queued } : steer(world, input.held, queued);
      updateWorld(world, TICK, { held: walk.held, pressed: walk.pressed, locked });
      queued = new Set();
    }
    record('logic', performance.now() - logicAt);
    // Everything the other players set off this frame is theirs: its sounds play softer, behind
    // yours (listen.js).
    const before = new Set([...world.fx, ...world.juice]);
    autoPotion(world);
    timed('bots', () => {
      updateBots(world.bots, world, dt);
      updateGrouping(world, dt);
    });
    for (const f of world.fx) if (!before.has(f)) f.ally = true;
    for (const j of world.juice) if (!before.has(j)) j.ally = true;
    // Online: tell friends what you're doing, and show what they're doing.
    tickNet(world, dt);
    if (world.events.some((e) => e.type === 'map')) saveGame(world.char);
    addPlayTime(world.char.file ?? 0, dt);
    autosave -= dt;
    if (autosave <= 0) {
      saveGame(world.char);
      autosave = AUTOSAVE_EVERY;
    }
    // Sounds for whatever just happened, before the renderer drains the cues.
    timed('sound', () => hearWorld(world, camera));
    const drawAt = performance.now();
    blended(world, acc / TICK, () => {
      updateCamera(camera, world, dt);
      drawWorld(ctx, world, camera, time);
    });
    // The HUD needs the camera to fly picked-up loot from the world into the Bag button.
    uiState.cam = camera;
    drawUi(ui, uiState, world);
    record('draw', performance.now() - drawAt);
    hearUi(uiState);
    npcPointer(ui);
    // The Options window can send you back to character select or the title.
    if (uiState.action) {
      const action = uiState.action;
      saveGame(world.char);
      leaveRoom(world);
      lobby.slot = world.char.slot ?? 0;
      lobby.file = world.char.file ?? 0;
      world = null;
      uiState = null;
      canvas.style.cursor = '';
      if (action === 'select') {
        loadChars();
        lobby.confirm = false;
        screen = 'select';
      } else {
        screen = 'title';
      }
    }
  }

  // The touch controls over everything else while playing.
  touchFrame(touch, ctx, screen, world, uiState);
  if (canvas.style.filter !== VIVID) canvas.style.filter = VIVID;
  endUi(ui);
  endFrame(input);
}

// One bad frame never freezes the game: the next frame is booked first, and an error is logged
// (once per message) and the frame's input let go, so play carries on.
const crashes = new Set();
let drawnAt = 0;
function frame(now) {
  requestAnimationFrame(frame);
  // Battery saver (Options > Display > Frame rate): every other refresh at most.
  if (settings.fps === '30' && now - drawnAt < 1000 / 30 - 4) return;
  drawnAt = now;
  try {
    step(now);
  } catch (err) {
    if (!crashes.has(err.message)) {
      crashes.add(err.message);
      console.error('Frame error:', err);
    }
    endFrame(input);
  }
}
requestAnimationFrame(frame);

// Clicking people: an NPC to talk to them (a setting), another player or yourself to see their
// profile. Hovering highlights whoever is under the mouse and shows a hand cursor.
function npcPointer(ui) {
  const m = input.mouse;
  let npc = null;
  let bot = null;
  let friend = null;
  let self = false;
  let thing = null;
  if (!uiState.npc && !uiState.death && !ui.used) {
    const wx = m.x + camera.x;
    const wy = m.y + camera.y;
    npc = world.map.npcs.find((n) => !awayNow(world, n) && Math.abs(n.x - wx) < 14 && wy > groundAt(world.map, n.x) - 50 && wy < groundAt(world.map, n.x) + 14) ?? null;
    // Party members and other players hunting, wherever they are on the map.
    if (!npc) bot = bodiedIn(world.bots, world.map.id).find((b) => Math.abs(b.body.x - wx) < 13 && wy > b.body.y - 46 && wy < b.body.y + 13) ?? null;
    if (!npc && !bot && settings.showCrowd && world.map.isTown) {
      bot = botsIn(world.bots, world.map.id).find((b) => {
        const by = groundAt(world.map, b.x);
        return (Math.abs(b.x - wx) < 13 && wy > by - 46 && wy < by + 22) || (b.shop && Math.abs(b.x - wx) < 40 && wy > by - 76 && wy < by - 58);
      }) ?? null;
    }
    // Friends online.
    if (!npc && !bot) friend = othersHere(world).find((g) => Math.abs(g.body.x - wx) < 13 && wy > g.body.y - 46 && wy < g.body.y + 13) ?? null;
    const b = world.body;
    if (!npc && !bot && !friend) self = Math.abs(b.x - wx) < 12 && wy > b.y - 46 && wy < b.y + 13;
    // Things in the Mochi places: the board, the stall, the kitchen, eggs, doors, your Mochi.
    if (!npc && !bot && !friend && !self) thing = targetAt(world, wx, wy);
  }
  world.hoverThing = thing?.label ?? null;
  world.hoverNpc = npc?.id ?? null;
  world.hoverBot = bot?.id ?? null;
  world.hoverSelf = self;
  world.hoverFriend = friend?.id ?? null;
  canvas.style.cursor = npc || bot || friend || self || thing ? 'pointer' : '';
  // Right-click a player or yourself for the menu (invite to party, profile, leave).
  if (m.right && (bot || friend || self)) {
    openMenu(uiState, bot ? { kind: 'bot', id: bot.id, x: m.x + 4, y: m.y } : friend ? { kind: 'ghost', id: friend.id, x: m.x + 4, y: m.y } : { kind: 'self', x: m.x + 4, y: m.y });
    m.right = false;
    return;
  }
  if (!m.clicked) return;
  if (thing) {
    walkTo(world, thing);
    m.clicked = false;
    return;
  }
  if (npc) world.events.push({ type: 'talk', npc: npc.id });
  else if (bot) openProfile(uiState, { kind: 'bot', id: bot.id, shop: Boolean(bot.shop) });
  else if (friend) openProfile(uiState, { kind: 'ghost', id: friend.id });
  else if (self) openProfile(uiState, { kind: 'self' });
  if (npc || bot || friend || self) m.clicked = false;
}

// Exposed for debugging and automated play tests.
window.twzt = {
  get world() { return world; },
  get ui() { return uiState; },
  get camera() { return camera; },
  start(name = 'Tester', look = randomLook()) {
    startGame(newCharacter(name, look));
  },
};
