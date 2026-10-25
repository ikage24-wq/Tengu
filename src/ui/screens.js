// Title screen and character creator.

import { MAPS } from '../data/maps.js';
import { JOBS } from '../data/jobs.js';
import { drawSceneBack } from '../render/scenery.js';
import { drawHero } from '../render/hero.js';
import { COLORS, text, box, button, wrap } from './kit.js';
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

// Returns 'continue', 'new', or null.
export function titleScreen(ui, time, save) {
  const { ctx } = ui;
  backdrop(ctx, time);
  drawHero(ctx, TITLE_LOOK, null, 320, 440 - (MAPS.meadow1.height - 360), { pose: 'walk', time, scale: 2 });

  const bob = Math.sin(time * 2) * 3;
  text(ctx, 'Twzt', 320, 104 + bob, { size: 64, bold: true, align: 'center', color: '#ffffff', outline: '#c97ad9' });
  text(ctx, 'a cozy pastel adventure', 320, 128 + bob, { size: 13, bold: true, align: 'center', color: '#ffffff', outline: '#c97ad9' });
  for (let i = 0; i < 6; i++) {
    const a = time * 1.5 + i;
    sparkle(ctx, 320 + Math.cos(a) * 130, 90 + Math.sin(a * 1.3) * 30, 3 + (i % 3), i % 2 ? '#ffffff' : '#ffe36b');
  }

  let pick = null;
  let y = 170;
  if (save && button(ui, 240, y, 160, 22, `Continue · ${save.name} Lv ${save.level} ${JOBS[save.job]?.name ?? ''}`, { primary: true, size: 9 })) pick = 'continue';
  if (save) y += 28;
  if (button(ui, 240, y, 160, 22, 'New Adventure', { primary: !save, size: 10 })) pick = 'new';
  if (save) text(ctx, 'A new adventure replaces your saved one.', 320, y + 34, { size: 8, align: 'center', color: '#ffffff', outline: '#8f6cb0' });
  text(ctx, 'Arrows move · Space jumps · Z attacks · X loots · Up talks and enters portals', 320, 346, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: '#8f6cb0' });
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
