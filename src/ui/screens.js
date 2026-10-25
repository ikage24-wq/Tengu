// Title screen and character creator.

import { MAPS } from '../data/maps.js';
import { JOBS } from '../data/jobs.js';
import { drawSceneBack } from '../render/scenery.js';
import { drawHero } from '../render/hero.js';
import { COLORS, text, box, button, wrap, bar, hover, clicked, roundRect } from './kit.js';
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

// Cosmetic worlds for the login screen; the game itself is single-player.
const WORLDS = [
  { name: 'Sakura', load: 0.45, color: '#ff9ec0' },
  { name: 'Kitsune', load: 0.78, color: '#ffb36b' },
  { name: 'Momiji', load: 0.96, color: '#ff7b7b' },
  { name: 'Yuki', load: 0.22, color: '#9fd4ff' },
];
let world = 0;

function loadLabel(load) {
  return load > 0.9 ? ['Full', COLORS.bad] : load > 0.65 ? ['Busy', COLORS.gold] : ['Normal', COLORS.good];
}

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

// MMO-style login: logo, world select panel, and a status bar. Returns 'continue', 'new', or null.
export function titleScreen(ui, time, save) {
  const { ctx } = ui;
  backdrop(ctx, time);
  drawHero(ctx, TITLE_LOOK, null, 130, 440 - (MAPS.meadow1.height - 360), { pose: 'idle', time, scale: 2 });

  // Logo
  const bob = Math.sin(time * 2) * 2;
  text(ctx, 'Tengu', 320, 70 + bob, { size: 56, bold: true, align: 'center', color: '#ffffff', outline: '#c97ad9' });
  text(ctx, 'a cozy pastel adventure', 320, 92 + bob, { size: 12, bold: true, align: 'center', color: '#ffffff', outline: '#c97ad9' });
  for (let i = 0; i < 6; i++) {
    const a = time * 1.5 + i;
    sparkle(ctx, 320 + Math.cos(a) * 110, 55 + Math.sin(a * 1.3) * 24, 3 + (i % 3), i % 2 ? '#ffffff' : '#ffe36b');
  }

  // World select
  const px = 230, py = 108, pw = 180, ph = save ? 196 : 164;
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
    const load = Math.min(1, w.load + Math.sin(time * 0.4 + i * 2) * 0.03);
    const [label, color] = loadLabel(load);
    bar(ctx, px + 82, ry + 6, 50, 7, load, color, null);
    text(ctx, label, px + pw - 14, ry + 13, { size: 7, bold: true, align: 'right', color });
    if (clicked(ui, px + 8, ry, pw - 16, 19)) world = i;
  });

  let pick = null;
  let y = py + 24 + WORLDS.length * 22 + 6;
  if (save && button(ui, px + 10, y, pw - 20, 22, `Continue · ${save.name} Lv ${save.level} ${JOBS[save.job]?.name ?? ''}`, { primary: true, size: 9 })) pick = 'continue';
  if (save) y += 26;
  if (button(ui, px + 10, y, pw - 20, 22, 'New Character', { primary: !save, size: 10 })) pick = 'new';
  if (save) text(ctx, 'A new character replaces your saved one.', px + pw / 2, y + 34, { size: 7, align: 'center', color: COLORS.muted });
  else text(ctx, `Entering ${WORLDS[world].name} · Channel 1`, px + pw / 2, y + 36, { size: 8, align: 'center', color: COLORS.muted });

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

export function randomLook() {
  const look = {};
  for (const opt of LOOK_OPTIONS) look[opt.key] = opt.options[Math.floor(Math.random() * opt.options.length)];
  return look;
}

// Edits `draft` ({ name, look }) in place. Returns true when the player presses Start.
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
  wrap(ctx, 'Gear changes your outfit as you equip it. You can restyle later at the salon in Sprout Village.', 302, 220, 216, { size: 8, color: COLORS.muted });
  const ok = draft.name.trim().length > 0;
  return button(ui, 360, 258, 100, 22, 'Start!', { primary: true, enabled: ok, size: 11 }) || (ok && ui.input.pressed.has('Enter'));
}
