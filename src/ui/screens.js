// Title (world select), character select, and character creator screens.

import { MAPS } from '../data/maps.js';
import { JOBS } from '../data/jobs.js';
import { drawSceneBack } from '../render/scenery.js';
import { drawHero } from '../render/hero.js';
import { COLORS, FONT, text, box, button, wrap, bar, hover, clicked, roundRect } from './kit.js';
import { stats } from '../core/character.js';
import { expToNext } from '../core/exp.js';
import { lookRows, LOOK_OPTIONS } from './npc.js';

const TITLE_LOOK = { hairStyle: 'twintails', hairColor: '#ff9ec0', skinTone: '#fff0e6', eyeStyle: 'sparkle', eyeColor: '#5aa8ff', outfitColor: '#bfe0ff' };

function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function backdrop(ctx, time) {
  const map = MAPS.meadow1;
  const cam = { x: (time * 30) % (map.width - 640), y: map.height - 360 };
  drawSceneBack(ctx, map, cam, 640, 360, time, null);
}

// A silly subtitle under the logo, rolled fresh on every page load.
const oneOf = (list) => list[Math.floor(Math.random() * list.length)];
const THINGS = ['slimes', 'potions', 'mushrooms', 'bunny hoods', 'loot', 'jumping', 'sparkles', 'crits'];
const QUOTE_MAKERS = [
  () => `Now with ${10 + Math.floor(Math.random() * 90)}% more ${oneOf(THINGS)}!`,
  () => `Warning: may contain ${oneOf(THINGS)}.`,
  () => `Powered by ${oneOf(THINGS)} and questionable decisions.`,
  () => `${oneOf(['Mira', 'Marlo', 'The Crystal King', 'Your mom'])} says hi!`,
  () => oneOf([
    'The slimes have unionized.',
    'Press Z to solve your problems. Mostly.',
    'No mushrooms were harmed. Okay, a few.',
    'Level 1 forever is a lifestyle.',
    'Have you tried jumping at it?',
    'Grinding is just walking with ambition.',
    'Ropes: the original fast travel.',
    'Your bag is full. Of dreams.',
    '100% organic, free-range pixels.',
    'Tengu does not sponsor your sleep schedule.',
  ]),
];
const quote = oneOf(QUOTE_MAKERS)();

// The login screen's world list; the game itself is single-player.
const WORLDS = [{ name: 'Tengu', color: '#ff9ec0' }];
let world = 0;

// A fixed frame like the in-game windows, without dragging or a close button.
function panel(ctx, x, y, w, h, title) {
  ctx.fillStyle = 'rgba(90,63,122,0.22)';
  roundRect(ctx, x + 3, y + 4, w, h, 8);
  ctx.fill();
  box(ctx, x, y, w, h, { fill: 'rgba(255,247,252,0.94)', r: 8 });
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, COLORS.title);
  g.addColorStop(1, COLORS.title2);
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, 18, 8);
  ctx.fill();
  ctx.fillRect(x, y + 10, w, 8);
  text(ctx, title, x + w / 2, y + 13, { size: 10, bold: true, align: 'center', color: '#ffffff', outline: '#b87ac9' });
}

const HERO_Y = MAPS.meadow1.groundY - (MAPS.meadow1.height - 360);

function petals(ctx, time) {
  const colors = ['#ffc2dc', '#ffffff', '#ffd9ec'];
  for (let i = 0; i < 18; i++) {
    const r1 = (i * 0.618) % 1;
    const r2 = (i * 0.414 + 0.3) % 1;
    const x = (r1 * 680 + time * (12 + r2 * 14) + Math.sin(time * 1.3 + i) * 18) % 680 - 20;
    const y = (r2 * 380 + time * (18 + r1 * 16)) % 380 - 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * (1 + r1) + i);
    ctx.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(time * 2 + i)));
    ctx.fillStyle = colors[i % 3];
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// MMO-style login: logo, world select panel, and a status bar. Returns true on Enter World.
export function titleScreen(ui, time) {
  const { ctx } = ui;
  const map = MAPS.meadow1;
  drawSceneBack(ctx, map, { x: 260, y: map.height - 360 }, 640, 360, time, null);
  drawHero(ctx, TITLE_LOOK, null, 130, HERO_Y, { pose: 'idle', time, scale: 2 });
  petals(ctx, time);

  // Logo
  const bob = Math.sin(time * 2) * 2;
  text(ctx, 'Tengu', 320, 70 + bob, { size: 56, bold: true, align: 'center', color: '#ffffff', outline: '#c97ad9' });
  text(ctx, quote, 320, 92 + bob, { size: 12, bold: true, align: 'center', color: '#ffffff', outline: '#c97ad9' });
  for (let i = 0; i < 6; i++) {
    const a = time * 1.5 + i;
    sparkle(ctx, 320 + Math.cos(a) * 110, 55 + Math.sin(a * 1.3) * 24, 3 + (i % 3), i % 2 ? '#ffffff' : '#ffe36b');
  }

  // World select
  const px = 230, py = 108, pw = 180, ph = 76 + WORLDS.length * 22;
  panel(ctx, px, py, pw, ph, 'World Select');
  WORLDS.forEach((w, i) => {
    const ry = py + 24 + i * 22;
    const on = i === world;
    box(ctx, px + 8, ry, pw - 16, 19, { fill: on ? '#ffe9f4' : hover(ui, px + 8, ry, pw - 16, 19) ? '#ffffff' : COLORS.cell, edge: on ? COLORS.accent : COLORS.cellEdge, r: 5 });
    ctx.fillStyle = w.color;
    ctx.beginPath();
    ctx.arc(px + 19, ry + 9.5, 4, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, w.name, px + 28, ry + 13, { size: 9, bold: true });
    if (clicked(ui, px + 8, ry, pw - 16, 19)) world = i;
  });

  const pick = button(ui, px + 10, py + 24 + WORLDS.length * 22 + 6, pw - 20, 22, 'Enter World', { primary: true, size: 10 }) || ui.input.pressed.has('Enter');
  text(ctx, `${WORLDS[world].name} · Channel 1`, px + pw / 2, py + ph - 9, { size: 8, align: 'center', color: COLORS.muted });

  // Status bar
  ctx.fillStyle = 'rgba(90,63,122,0.55)';
  ctx.fillRect(0, 340, 640, 20);
  ctx.fillStyle = COLORS.good;
  ctx.beginPath();
  ctx.arc(12, 350, 3, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, `Server online · ${WORLDS[world].name}`, 20, 353, { size: 8, bold: true, color: '#ffffff' });
  text(ctx, 'Arrows move · Space jumps · Z attacks · X loots · Up talks', 320, 353, { size: 8, align: 'center', color: '#ffffff' });
  text(ctx, 'v1.0.0', 630, 353, { size: 8, bold: true, align: 'right', color: '#ffffff' });
  return pick;
}

// --- Character select: a big tree with two rings of character slots, like a classic MMO lobby.

const SLOT_X = [88, 172, 288, 372];
const TIER_Y = [168, 300];
const slotPos = (i) => [SLOT_X[i % 4], TIER_Y[Math.floor(i / 4)]];

function leaves(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ring(ctx, y) {
  // Underside, face, and a mossy top edge with a few flowers.
  box(ctx, 44, y + 2, 372, 18, { fill: '#b98a5c', edge: null, r: 9 });
  box(ctx, 44, y - 6, 372, 18, { fill: '#f3d6a6', edge: '#d4a574', r: 9 });
  ctx.fillStyle = '#8fd18a';
  for (let x = 54; x < 410; x += 14) ctx.fillRect(x, y - 7, 8, 3);
  const flowers = ['#ffb8dc', '#ffffff', '#ffe36b'];
  for (let i = 0; i < 9; i++) leaves(ctx, 64 + i * 41 + (i % 2) * 9, y - 6, 2.5, flowers[i % 3]);
  ctx.strokeStyle = '#7cc47a';
  ctx.lineWidth = 2;
  for (const vx of [70, 150, 330, 398]) {
    ctx.beginPath();
    ctx.moveTo(vx, y + 18);
    ctx.quadraticCurveTo(vx + 6, y + 28, vx - 2, y + 36);
    ctx.stroke();
  }
}

// Sky and soft hills, so nothing from a real map pokes through the tree.
function lobbySky(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 360);
  g.addColorStop(0, '#9edcff');
  g.addColorStop(1, '#e6f6ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 360);
  [[60, 330, 130], [300, 350, 150], [560, 320, 140]].forEach(([x, y, r]) => leaves(ctx, x, y, r, '#c4ebc0'));
  [[180, 380, 140], [470, 390, 150]].forEach(([x, y, r]) => leaves(ctx, x, y, r, '#a8e09a'));
}

function tree(ctx, time) {
  // Trunk with a flared base and soft grain.
  ctx.fillStyle = '#c89b6d';
  ctx.beginPath();
  ctx.moveTo(186, 20);
  ctx.lineTo(274, 20);
  ctx.quadraticCurveTo(270, 260, 300, 340);
  ctx.lineTo(160, 340);
  ctx.quadraticCurveTo(190, 260, 186, 20);
  ctx.fill();
  ctx.fillStyle = '#ddb487';
  ctx.fillRect(196, 20, 10, 300);
  ctx.strokeStyle = '#a87a52';
  ctx.lineWidth = 2;
  for (const gx of [222, 242, 258]) {
    ctx.beginPath();
    ctx.moveTo(gx, 40);
    ctx.quadraticCurveTo(gx + 8, 180, gx - 4, 330);
    ctx.stroke();
  }
  // Canopy.
  const greens = ['#7cc47a', '#8fd18a', '#a8e09a'];
  [[90, 30, 50], [170, 10, 60], [260, 0, 66], [350, 22, 56], [420, 50, 40], [40, 60, 34], [220, 60, 40], [310, 70, 34], [130, 72, 36]]
    .forEach(([x, y, r], i) => leaves(ctx, x + Math.sin(time + i) * 1.5, y, r, greens[i % 3]));
  for (let i = 0; i < 14; i++) leaves(ctx, 40 + i * 28, 70 + (i % 3) * 10, 12, greens[(i + 1) % 3]);
  // Sunbeams through the leaves.
  ctx.save();
  ctx.globalAlpha = 0.12 + Math.sin(time * 0.8) * 0.03;
  ctx.fillStyle = '#ffffff';
  for (const bx of [250, 330, 400]) {
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx + 24, 0);
    ctx.lineTo(bx - 70, 340);
    ctx.lineTo(bx - 120, 340);
    ctx.fill();
  }
  ctx.restore();
  ring(ctx, TIER_Y[0]);
  ring(ctx, TIER_Y[1]);
}

function ghost(ctx, x, y) {
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c9d8ee';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - 9, y - 26, 18, 24, 7);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - 35, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function infoCard(ui, c, x, y, w, live) {
  const { ctx } = ui;
  box(ctx, x, y, w, 236, { fill: 'rgba(255,247,252,0.95)', r: 10 });
  if (!c) {
    text(ctx, 'Empty Slot', x + w / 2, y + 30, { size: 14, bold: true, align: 'center', color: COLORS.muted });
    wrap(ctx, 'Nobody lives here yet. Make a new hero to fill this spot on the tree.', x + 14, y + 56, w - 28, { size: 8, color: COLORS.muted });
    return button(ui, x + 12, y + 192, w - 24, 32, 'Create', { primary: true, size: 14, enabled: live }) ? 'create' : null;
  }
  const s = stats(c);
  text(ctx, `Lv. ${c.level}`, x + w / 2, y + 26, { size: 16, bold: true, align: 'center', color: COLORS.gold, outline: '#fff3d6' });
  box(ctx, x + 12, y + 34, w - 24, 18, { fill: '#8f6cb0', edge: null, r: 6 });
  text(ctx, c.name, x + w / 2, y + 47, { size: 10, bold: true, align: 'center', color: '#ffffff' });
  const rows = [['Job', JOBS[c.job]?.name ?? ''], ['Location', MAPS[c.mapId]?.name ?? ''], ['Gold', `${c.gold}`]];
  rows.forEach(([k, v], i) => {
    const ry = y + 60 + i * 18;
    box(ctx, x + 12, ry, w - 24, 15, { fill: COLORS.cell, edge: null, r: 5 });
    text(ctx, k, x + 18, ry + 11, { size: 8, bold: true, color: COLORS.muted });
    text(ctx, v, x + w - 18, ry + 11, { size: 8, bold: true, align: 'right' });
  });
  ['str', 'dex', 'int', 'luk'].forEach((k, i) => {
    const cx = x + 12 + (i % 2) * ((w - 24) / 2 + 2);
    const cy = y + 120 + Math.floor(i / 2) * 18;
    box(ctx, cx, cy, (w - 24) / 2 - 2, 15, { fill: COLORS.cell, edge: null, r: 5 });
    text(ctx, k.toUpperCase(), cx + 6, cy + 11, { size: 8, bold: true, color: COLORS.muted });
    text(ctx, `${s[k]}`, cx + (w - 24) / 2 - 8, cy + 11, { size: 8, bold: true, align: 'right' });
  });
  const need = expToNext(c.level);
  text(ctx, 'EXP', x + 14, y + 168, { size: 8, bold: true, color: COLORS.muted });
  const maxed = !Number.isFinite(need);
  bar(ctx, x + 38, y + 160, w - 50, 10, maxed ? 1 : c.exp / need, COLORS.exp, maxed ? 'MAX' : `${((c.exp / need) * 100).toFixed(1)}%`);
  return button(ui, x + 12, y + 192, w - 24, 32, 'Start', { primary: true, size: 14, enabled: live }) ? 'start' : null;
}

// `chars` has one entry (a character or null) per slot; `state` keeps { slot, confirm }.
// Returns 'start', 'create', 'delete', 'back', or null.
export function selectScreen(ui, time, chars, state) {
  const { ctx } = ui;
  const keys = ui.input.pressed;
  const live = !state.confirm;
  lobbySky(ctx);
  tree(ctx, time);

  let pick = null;
  chars.forEach((c, i) => {
    const [x, y] = slotPos(i);
    const on = i === state.slot;
    ctx.fillStyle = on ? `rgba(255,236,150,${0.75 + Math.sin(time * 4) * 0.2})` : 'rgba(191,233,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(x, y - 1, 17, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (on) {
      const g = ctx.createLinearGradient(0, y - 70, 0, y);
      g.addColorStop(0, 'rgba(255,248,200,0)');
      g.addColorStop(1, 'rgba(255,248,200,0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 16, y - 70, 32, 70);
    }
    if (c) {
      drawHero(ctx, c.appearance, c.equipment, x, y, { pose: on ? 'walk' : 'idle', time, seed: i });
      ctx.font = `bold 8px ${FONT}`;
      const tw = ctx.measureText(c.name).width + 10;
      box(ctx, x - tw / 2, y + 3, tw, 12, { fill: 'rgba(70,50,95,0.8)', edge: null, r: 4 });
      text(ctx, c.name, x, y + 12, { size: 8, bold: true, align: 'center', color: '#ffffff' });
    } else {
      ghost(ctx, x, y);
    }
    if (on) {
      const ay = y - 64 + Math.sin(time * 5) * 2;
      ctx.fillStyle = COLORS.select;
      ctx.beginPath();
      ctx.moveTo(x - 6, ay);
      ctx.lineTo(x + 6, ay);
      ctx.lineTo(x, ay + 7);
      ctx.fill();
    }
    if (live && clicked(ui, x - 18, y - 56, 36, 58)) {
      if (on) pick = c ? 'start' : 'create';
      state.slot = i;
    }
  });

  const c = chars[state.slot];
  if (live) {
    if (keys.has('ArrowLeft')) state.slot = (state.slot + chars.length - 1) % chars.length;
    if (keys.has('ArrowRight')) state.slot = (state.slot + 1) % chars.length;
    if (keys.has('ArrowUp') || keys.has('ArrowDown')) state.slot = (state.slot + 4) % chars.length;
    if (keys.has('Enter')) pick = c ? 'start' : 'create';
    if (keys.has('Escape')) pick = 'back';
  }

  // Lobby buttons under the tree.
  if (button(ui, 8, 8, 86, 18, '< World Select', { size: 8, enabled: live })) pick = 'back';
  if (button(ui, 120, 326, 100, 22, '+ Create Character', { size: 9, enabled: live && !c })) pick = 'create';
  if (button(ui, 240, 326, 100, 22, 'x Delete Character', { size: 9, enabled: live && Boolean(c) })) state.confirm = true;

  // World badge and character card.
  const px = 446, pw = 182;
  const wd = WORLDS[world];
  box(ctx, px, 10, pw, 40, { fill: 'rgba(255,247,252,0.95)', r: 10 });
  ctx.fillStyle = wd.color;
  ctx.beginPath();
  ctx.arc(px + 22, 30, 12, 0, Math.PI * 2);
  ctx.fill();
  sparkle(ctx, px + 22, 30, 6, '#ffffff');
  text(ctx, wd.name, px + 42, 29, { size: 14, bold: true });
  text(ctx, 'CH. 1', px + 42, 42, { size: 8, bold: true, color: COLORS.muted });
  text(ctx, `${chars.filter(Boolean).length} / ${chars.length}`, px + pw - 12, 34, { size: 9, bold: true, align: 'right', color: COLORS.muted });
  pick = infoCard(ui, c, px, 60, pw, live) ?? pick;

  if (state.confirm) {
    ctx.fillStyle = 'rgba(60,40,80,0.45)';
    ctx.fillRect(0, 0, 640, 360);
    panel(ctx, 220, 130, 200, 92, 'Delete Character');
    text(ctx, `Delete ${c?.name ?? ''} for good?`, 320, 164, { size: 10, bold: true, align: 'center' });
    text(ctx, 'This cannot be undone.', 320, 178, { size: 8, align: 'center', color: COLORS.muted });
    if (button(ui, 236, 190, 80, 20, 'Delete', { primary: true }) || keys.has('Enter')) {
      state.confirm = false;
      pick = 'delete';
    }
    if (button(ui, 324, 190, 80, 20, 'Cancel') || keys.has('Escape')) state.confirm = false;
  }
  return pick;
}

export function randomLook() {
  const look = {};
  for (const opt of LOOK_OPTIONS) look[opt.key] = opt.options[Math.floor(Math.random() * opt.options.length)];
  return look;
}

// Edits `draft` ({ name, look }) in place. Returns 'start', 'back', or null.
export function creatorScreen(ui, time, draft) {
  const { ctx } = ui;
  backdrop(ctx, time * 0.3);
  ctx.fillStyle = 'rgba(255,247,252,0.35)';
  ctx.fillRect(0, 0, 640, 360);
  text(ctx, 'Make your hero', 320, 40, { size: 22, bold: true, align: 'center', color: '#ffffff', outline: '#c97ad9' });

  // Preview
  box(ctx, 110, 60, 160, 230, { r: 10 });
  const walking = Math.floor(time / 3) % 2 === 1;
  drawHero(ctx, draft.look, null, 190, 250, { pose: walking ? 'walk' : 'idle', time, scale: 3 });
  if (button(ui, 150, 264, 80, 16, 'Randomize', { size: 8 })) draft.look = randomLook();

  // Name and look options
  box(ctx, 290, 60, 240, 230, { r: 10 });
  text(ctx, 'Name', 302, 80, { size: 9, bold: true });
  for (const ch of ui.input.typed) {
    if (ch === '\b') draft.name = draft.name.slice(0, -1);
    else if (/^[\w '-]$/.test(ch) && draft.name.length < 12) draft.name += ch;
  }
  box(ctx, 340, 69, 178, 16, { fill: '#ffffff', edge: COLORS.accent, r: 5 });
  const caret = Math.floor(time * 2) % 2 ? '|' : '';
  text(ctx, `${draft.name}${caret}`, 346, 81, { size: 9, bold: true });
  draft.look = lookRows(ui, draft.look, 300, 94, 220);
  wrap(ctx, 'Gear changes your outfit as you equip it. You can restyle later at the salon in Sprout Village.', 302, 233, 216, { size: 8, color: COLORS.muted });
  const ok = draft.name.trim().length > 0;
  if (button(ui, 8, 8, 86, 18, '< Characters', { size: 8 }) || ui.input.pressed.has('Escape')) return 'back';
  return button(ui, 360, 258, 100, 22, 'Start!', { primary: true, enabled: ok, size: 11 }) || (ok && ui.input.pressed.has('Enter')) ? 'start' : null;
}
