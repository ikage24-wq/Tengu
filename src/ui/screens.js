// Title, character select, and character creator screens.

import { MAPS } from '../data/maps.js';
import { VERSION } from '../version.js';
import { JOBS } from '../data/jobs.js';
import { drawHero } from '../render/hero.js';
import { COLORS, THEMES, text, box, button, tabs, wrap, bar, hover, clicked, roundRect, font, softShadow, icon, tooltip, lighten, darken, toggle } from './kit.js';
import { stats, wornGear } from '../core/character.js';
import { expToNext } from '../core/exp.js';
import { lookRows, randomLook, LOOK_TABS } from './looks.js';
import { drawPeekers, drawPeekerTalk } from './title-peek.js';
import { drawShow, drawBlock } from './title-show.js';

export { randomLook };


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

// A silly subtitle under the logo, rolled fresh on every page load.
const oneOf = (list) => list[Math.floor(Math.random() * list.length)];
const JOB_NAMES = ['Paladin', 'Berserker', 'Phantom Trickster', 'Arbalist Engineer', 'Blade Dancer', 'Sky Dancer', 'Starlight Idol', 'Astronomer'];
const QUOTE_MAKERS = [
  () => `${oneOf(JOB_NAMES)}s are perfectly balanced. Probably.`,
  () => `${oneOf(['Mira', 'Marlo', 'Lulu', 'The Crystal King'])} says hi!`,
  () => oneOf([
    'Bring friends. Share the loot. Or don\'t.',
    'Pick a card. Any card.',
    'Paladins hit like a pillow, on purpose.',
    'Engineers: please stop blowing up the bots.',
    'Smug face sold separately.',
    'New hair. Same bad decisions.',
    'Big round glasses: now in the Cash Shop.',
    'Swimwear is not armor. We checked.',
    'Now on Windows. It even updates itself.',
    'Every sound made by hand. Mostly by beeping.',
    'The bots are learning. Be nice to them.',
    'Your bag is full. Of dreams.',
    'Kill 10 snails. Then 10 more. Then 10 more.',
    'Quest givers do not move. It\'s in their contract.',
    'Drop rate: yes.',
    'Contains one (1) dramatic reveal.',
    'Now 30 hours long. The training montage is extra.',
    'Grinding is a lifestyle, not a choice.',
  ]),
];
const quote = oneOf(QUOTE_MAKERS)();

// A fixed frame like the in-game windows, without dragging or a close button.
function panel(ctx, x, y, w, h, title) {
  ctx.fillStyle = 'rgba(90,63,122,0.18)';
  roundRect(ctx, x + 2, y + 4, w, h, 14);
  ctx.fill();
  box(ctx, x - 2, y - 2, w + 4, h + 4, { fill: null, edge: '#ffe0ef', r: 16, width: 3 });
  box(ctx, x, y, w, h, { fill: 'rgba(255,247,252,0.96)', edge: '#f4bcd8', r: 14, width: 2 });
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, COLORS.title);
  g.addColorStop(1, COLORS.title2);
  ctx.fillStyle = g;
  ctx.save();
  roundRect(ctx, x, y, w, h, 14);
  ctx.clip();
  ctx.fillRect(x, y, w, 18);
  ctx.beginPath();
  for (let sx = x; sx < x + w; sx += 8) ctx.arc(sx + 4, y + 18, 4, 0, Math.PI);
  ctx.fill();
  ctx.restore();
  text(ctx, title, x + w / 2, y + 13, { size: 10, bold: true, align: 'center', color: '#ffffff', outline: '#b87ac9' });
}


// ---------- Title screen ----------

// The title is a show that goes wrong (title-show.js), and the island's folk pop in for close-ups
// once it's over (title-peek.js). Any key, click or tap skips the show; after it, any key (or a click that isn't
// on a face) goes on to character select.
export function titleScreen(ui, time) {
  const { ctx } = ui;
  const keyed = ui.input.pressed.size > 0;
  // Any key, click or tap skips the show.
  const show = drawShow(ctx, time, quote, keyed || ui.mouse.clicked);
  drawPeekers(ui, time, show.letters, (c, ch, x, y, rot) => drawBlock(c, ch, x, y, rot, 30, 12), show.settled);
  drawPeekerTalk(ctx);
  text(ctx, `v${VERSION}`, 634, 356, { size: 6.5, bold: true, align: 'right', color: 'rgba(255,240,220,0.5)' });
  if (show.skipped || !show.settled) {
    ui.mouse.clicked = false;
    return false;
  }
  const go = keyed || ui.mouse.clicked;
  ui.mouse.clicked = false;
  return go;
}

// --- Character select: a big tree with a ring of four spots, one per hero in this world.

const SLOT_X = [88, 172, 288, 372];
const RING_Y = 236;
const slotPos = (i) => [SLOT_X[i % 4], RING_Y];
// Each job family's colour, for the card's accents and the glow under a hero's spot.
// Each save file's colour (the same as its playbill's band).
const FILE_COLORS = ['#d83a5a', '#4a8ad8', '#3aa878'];
const FAMILY_COLOR = { beginner: '#6fb8ff', warrior: '#ff8a5c', archer: '#5fd3a0', thief: '#9b7bd8', mage: '#ff8fc1', gm: '#ffc94f' };
const familyColor = (c) => FAMILY_COLOR[JOBS[c?.job]?.family] ?? '#b48cff';

function leaves(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// A paper lantern hanging from a ring, glowing and swaying.
function lantern(ctx, x, y, time, i) {
  const sw = Math.sin(time * 1.6 + i) * 2;
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + sw, y + 8);
  ctx.stroke();
  const lx = x + sw;
  const g = ctx.createRadialGradient(lx, y + 14, 0, lx, y + 14, 16);
  g.addColorStop(0, `rgba(255,220,150,${0.45 + 0.1 * Math.sin(time * 3 + i)})`);
  g.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(lx - 16, y - 2, 32, 32);
  ctx.fillStyle = i % 2 ? '#ff9ec0' : '#ffb86b';
  ctx.beginPath();
  ctx.ellipse(lx, y + 14, 5, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(lx - 1.5, y + 9, 1.5, 9);
  ctx.fillStyle = '#8a5a3a';
  ctx.fillRect(lx - 3, y + 7, 6, 1.5);
  ctx.fillRect(lx - 3, y + 20, 6, 1.5);
}

function ring(ctx, y, time, tier) {
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
  // Lanterns between the spots.
  [130, 230, 330].forEach((lx, i) => lantern(ctx, lx, y + 18, time, i + tier * 3));
}

// Sky and soft hills, so nothing from a real map pokes through the tree; clouds drifting by.
function lobbySky(ctx, time) {
  const g = ctx.createLinearGradient(0, 0, 0, 360);
  g.addColorStop(0, '#9edcff');
  g.addColorStop(1, '#e6f6ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 4; i++) {
    const x = ((i * 190 + time * (6 + i * 2)) % 760) - 80;
    const y = 30 + i * 22;
    for (const [dx, dy, r] of [[0, 0, 12], [14, -5, 15], [30, 0, 11], [14, 4, 12]]) leaves(ctx, x + dx, y + dy, r, 'rgba(255,255,255,0.85)');
  }
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
  // Treehouse windows in the trunk, lit warm, and a little round door at the foot.
  for (const [wx, wy] of [[228, 132], [218, 290]]) {
    box(ctx, wx - 9, wy - 11, 18, 22, { fill: '#ffe6a8', edge: '#8a5a3a', r: 9, width: 2 });
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(wx - 0.75, wy - 10, 1.5, 20);
    ctx.fillRect(wx - 8, wy, 16, 1.5);
  }
  box(ctx, 216, 318, 26, 26, { fill: '#a8714a', edge: '#6e4a30', r: 13, width: 2 });
  leaves(ctx, 236, 332, 1.6, '#f2c94c');
  // Canopy.
  const greens = ['#7cc47a', '#8fd18a', '#a8e09a'];
  [[90, 30, 50], [170, 10, 60], [260, 0, 66], [350, 22, 56], [420, 50, 40], [40, 60, 34], [220, 60, 40], [310, 70, 34], [130, 72, 36]]
    .forEach(([x, y, r], i) => leaves(ctx, x + Math.sin(time + i) * 1.5, y, r, greens[i % 3]));
  for (let i = 0; i < 14; i++) leaves(ctx, 40 + i * 28, 70 + (i % 3) * 10, 12, greens[(i + 1) % 3]);
  // Bunting strung across under the canopy.
  const flags = ['#ff9ec0', '#ffe36b', '#9edcff', '#b8f0c8', '#c9a6ff'];
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, 96);
  ctx.quadraticCurveTo(230, 122, 404, 96);
  ctx.stroke();
  for (let i = 0; i < 15; i++) {
    const u = (i + 0.5) / 15;
    const fx = 56 + u * 348;
    const fy = 96 + 2 * u * (1 - u) * 26 * 2 * 0.5 + Math.sin(time * 2 + i) * 0.6;
    ctx.fillStyle = flags[i % flags.length];
    ctx.beginPath();
    ctx.moveTo(fx - 5, fy);
    ctx.lineTo(fx + 5, fy);
    ctx.lineTo(fx, fy + 8);
    ctx.fill();
  }
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
  ring(ctx, RING_Y, time, 0);
}

// Leaves drifting down past the tree.
function fallingLeaves(ctx, time) {
  for (let i = 0; i < 10; i++) {
    const r1 = (i * 0.618) % 1;
    const x = (r1 * 460 + Math.sin(time * 1.1 + i) * 20 + time * 6) % 460;
    const y = ((i * 0.37) % 1 * 360 + time * (14 + r1 * 10)) % 380 - 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time * 2 + i) * 0.8);
    ctx.fillStyle = i % 3 ? '#8fd18a' : '#ffb8dc';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// An empty spot: a flower bud on a short stem, glowing, with a "+" on it. Hovered it parts a
// little; chosen, it blooms open.
function bud(ctx, x, y, time, open) {
  ctx.strokeStyle = '#6fbf6a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 1);
  ctx.quadraticCurveTo(x + 3, y - 10, x, y - 18);
  ctx.stroke();
  leaves(ctx, x - 5, y - 8, 3, '#8fd18a');
  const g = ctx.createRadialGradient(x, y - 26, 0, x, y - 26, 20);
  g.addColorStop(0, `rgba(255,220,240,${0.5 + 0.2 * Math.sin(time * 2.5 + x)})`);
  g.addColorStop(1, 'rgba(255,220,240,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 20, y - 46, 40, 40);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + ((i - (n - 1) / 2) / n) * (0.9 + 2.2 * open);
    ctx.save();
    ctx.translate(x, y - 18);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = i % 2 ? '#ffb8dc' : '#ff9ec0';
    ctx.beginPath();
    ctx.ellipse(0, -8, 4.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  leaves(ctx, x, y - 22, 5.5 * (0.6 + 0.4 * open), '#fff3fa');
  text(ctx, '+', x, y - 18.5, { size: 10, bold: true, align: 'center', color: '#ff6fa8' });
}

// The chosen hero's card: a big round portrait in their job's colour, the level and name, their
// place and gold, stats as pills, EXP, and Start (or Create) with Delete beside it as a trash can.
function infoCard(ui, c, x, y, w, live, time) {
  const { ctx } = ui;
  const H = 288;
  const col = familyColor(c);
  box(ctx, x - 2, y - 2, w + 4, H + 4, { fill: null, edge: '#ffe0ef', r: 16, width: 3 });
  box(ctx, x, y, w, H, { fill: 'rgba(255,247,252,0.96)', edge: '#f4bcd8', r: 14, width: 2 });
  const cx = x + w / 2;
  if (!c) {
    bud(ctx, cx, y + 92, time, 0.6 + 0.4 * Math.sin(time * 1.5));
    text(ctx, 'An empty spot', cx, y + 124, { size: 13, bold: true, align: 'center', color: COLORS.ink });
    text(ctx, 'Nobody lives here yet.', cx, y + 144, { size: 8, align: 'center', color: COLORS.muted });
    text(ctx, 'Plant a new hero on the tree.', cx, y + 156, { size: 8, align: 'center', color: COLORS.muted });
    return button(ui, x + 12, y + H - 44, w - 24, 32, 'Create', { primary: true, size: 14, enabled: live }) ? 'create' : null;
  }
  // The portrait.
  const py = y + 48;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, py, 36, 0, Math.PI * 2);
  ctx.clip();
  const bg = ctx.createRadialGradient(cx, py - 10, 4, cx, py, 36);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(1, lighten(col, 0.45));
  ctx.fillStyle = bg;
  ctx.fillRect(cx - 36, py - 36, 72, 72);
  drawHero(ctx, c.appearance, wornGear(c), cx, py + 58, { pose: 'idle', time, scale: 2, facing: 1 });
  ctx.restore();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, py, 36, 0, Math.PI * 2);
  ctx.stroke();
  box(ctx, cx - 22, py + 28, 44, 15, { fill: COLORS.gold, edge: '#ffffff', r: 7.5, width: 1.5 });
  text(ctx, `Lv ${c.level}`, cx, py + 39, { size: 9, bold: true, align: 'center', color: '#ffffff', outline: '#a8661a' });
  // Name and job.
  text(ctx, c.name, cx, y + 110, { size: 12, bold: true, align: 'center', color: COLORS.ink });
  const job = JOBS[c.job]?.name ?? '';
  ctx.font = font(8, true);
  const jw = ctx.measureText(job).width + 18;
  box(ctx, cx - jw / 2, y + 115, jw, 14, { fill: col, edge: '#ffffff', r: 7, width: 1.2 });
  text(ctx, job, cx, y + 125, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: darken(col, 0.3) });
  // Where and how rich.
  [['map', MAPS[c.mapId]?.name ?? ''], ['coin', c.gold.toLocaleString()]].forEach(([ic, v], i) => {
    const ry = y + 136 + i * 17;
    box(ctx, x + 12, ry, w - 24, 14, { fill: COLORS.cell, edge: null, r: 7 });
    icon(ctx, ic, x + 22, ry + 7, 8, i ? '#f0b53a' : '#6fb8ff');
    text(ctx, v, x + w - 18, ry + 10, { size: 8, bold: true, align: 'right' });
  });
  const s = stats(c);
  ['str', 'dex', 'int', 'luk'].forEach((k, i) => {
    const sx = x + 12 + (i % 2) * ((w - 24) / 2 + 2);
    const sy = y + 172 + Math.floor(i / 2) * 17;
    box(ctx, sx, sy, (w - 24) / 2 - 2, 14, { fill: COLORS.cell, edge: null, r: 7 });
    text(ctx, k.toUpperCase(), sx + 7, sy + 10, { size: 7.5, bold: true, color: COLORS.muted });
    text(ctx, `${s[k]}`, sx + (w - 24) / 2 - 9, sy + 10, { size: 8, bold: true, align: 'right' });
  });
  const need = expToNext(c.level);
  const maxed = !Number.isFinite(need);
  text(ctx, 'EXP', x + 14, y + 218, { size: 7.5, bold: true, color: COLORS.muted });
  bar(ctx, x + 36, y + 210, w - 48, 10, maxed ? 1 : c.exp / need, COLORS.exp, maxed ? 'MAX' : `${((c.exp / need) * 100).toFixed(1)}%`);
  const start = button(ui, x + 12, y + H - 44, w - 56, 32, 'Start', { primary: true, size: 14, enabled: live });
  // Delete: a little trash-can button that blushes red under the mouse.
  const tx = x + w - 40;
  const ty = y + H - 44;
  const hot = live && hover(ui, tx, ty, 28, 30);
  box(ctx, tx, ty + 2, 28, 28, { fill: hot ? '#ffd3dc' : '#f3e8fb', edge: hot ? COLORS.bad : COLORS.cellEdge, r: 14, width: 1.5 });
  icon(ctx, 'trash', tx + 14, ty + 16, 12, hot ? COLORS.bad : COLORS.muted);
  if (hot) tooltip(ui, [{ text: 'Delete this hero', bold: true, color: COLORS.bad }]);
  if (live && clicked(ui, tx, ty, 28, 30)) return 'delete?';
  return start ? 'start' : null;
}

// `chars` has one entry (a character or null) per slot; `state` keeps { slot, confirm }.
// Returns 'start', 'create', 'delete', 'back', or null.
export function selectScreen(ui, time, chars, state) {
  const { ctx } = ui;
  const keys = ui.input.pressed;
  const live = !state.confirm;
  lobbySky(ctx, time);
  tree(ctx, time);

  // The chosen hero steps forward and waves for a moment.
  if (state.slot !== state.shown) {
    state.shown = state.slot;
    state.pickedAt = time;
  }
  const since = time - (state.pickedAt ?? -9);

  let pick = null;
  chars.forEach((c, i) => {
    const [x, y] = slotPos(i);
    const on = i === state.slot;
    const hot = live && hover(ui, x - 18, y - 56, 36, 58);
    // A soft glow on the branch under a hero, in their job's colour; brighter when chosen.
    const g = ctx.createRadialGradient(x, y - 1, 0, x, y - 1, 22);
    const glow = c ? familyColor(c) : '#ffd6ea';
    g.addColorStop(0, on ? '#fff6c0' : glow);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = on ? 0.9 : 0.55;
    ctx.fillStyle = g;
    ctx.fillRect(x - 22, y - 10, 44, 16);
    ctx.globalAlpha = 1;
    if (on) {
      const sg = ctx.createLinearGradient(0, y - 80, 0, y);
      sg.addColorStop(0, 'rgba(255,248,200,0)');
      sg.addColorStop(1, `rgba(255,248,200,${0.45 + 0.1 * Math.sin(time * 3)})`);
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 80);
      ctx.lineTo(x + 8, y - 80);
      ctx.lineTo(x + 20, y);
      ctx.lineTo(x - 20, y);
      ctx.fill();
    }
    if (c) {
      // Chosen: a hop and a cheer, then back to their idle bits.
      const hop = on && since < 0.9 ? Math.max(0, Math.sin((since / 0.45) * Math.PI)) * 6 * (since < 0.45 ? 1 : 0) : 0;
      const cheer = on && since < 1.1;
      drawHero(ctx, c.appearance, wornGear(c), x, y - hop, { pose: cheer ? 'cheer' : 'idle', progress: Math.min(1, since / 1.1), dur: 1.1, time: time + i * 3.7, seed: i, facing: 1 });
      ctx.font = font(8, true);
      const tw = ctx.measureText(c.name).width + 12;
      box(ctx, x - tw / 2, y + 3, tw, 12, { fill: on ? familyColor(c) : 'rgba(70,50,95,0.8)', edge: on ? '#ffffff' : null, r: 6, width: 1.2 });
      text(ctx, c.name, x, y + 12, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: on ? darken(familyColor(c), 0.35) : null });
    } else {
      bud(ctx, x, y, time, on ? Math.min(1, since / 0.5) : hot ? 0.3 : 0);
    }
    if (on) {
      const ay = y - 66 + Math.sin(time * 5) * 2;
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
  fallingLeaves(ctx, time);

  const c = chars[state.slot];
  if (live) {
    if (keys.has('ArrowLeft')) state.slot = (state.slot + chars.length - 1) % chars.length;
    if (keys.has('ArrowRight')) state.slot = (state.slot + 1) % chars.length;
    if (keys.has('Enter')) pick = c ? 'start' : 'create';
    if (keys.has('Escape')) pick = 'back';
    if (keys.has('Delete') && c) state.confirm = true;
  }

  if (button(ui, 8, 8, 64, 18, '< Save files', { size: 8, enabled: live })) pick = 'back';

  // The world's badge: a pill with ribbon tails, the save file's colour, its name and its cast.
  const px = 446, pw = 182;
  ctx.fillStyle = '#e0659f';
  for (const sd of [-1, 1]) {
    const ex = sd < 0 ? px + 6 : px + pw - 6;
    ctx.beginPath();
    ctx.moveTo(ex, 22);
    ctx.lineTo(ex + sd * 14, 22);
    ctx.lineTo(ex + sd * 9, 30);
    ctx.lineTo(ex + sd * 14, 38);
    ctx.lineTo(ex, 38);
    ctx.fill();
  }
  box(ctx, px - 2, 8, pw + 4, 44, { fill: null, edge: '#ffe0ef', r: 22, width: 3 });
  box(ctx, px, 10, pw, 40, { fill: 'rgba(255,247,252,0.97)', edge: '#f4bcd8', r: 20, width: 2 });
  ctx.fillStyle = FILE_COLORS[state.file ?? 0];
  ctx.beginPath();
  ctx.arc(px + 22, 30, 12, 0, Math.PI * 2);
  ctx.fill();
  sparkle(ctx, px + 22, 30, 6 + Math.sin(time * 3), '#ffffff');
  ctx.font = font(12, true);
  let wn = state.worldName ?? '';
  while (wn.length > 4 && ctx.measureText(wn).width > pw - 80) wn = wn.slice(0, -1);
  text(ctx, wn === state.worldName ? wn : `${wn}…`, px + 42, 29, { size: 12, bold: true });
  text(ctx, `File ${(state.file ?? 0) + 1}`, px + 42, 42, { size: 7, bold: true, color: COLORS.muted });
  text(ctx, `${chars.filter(Boolean).length} / ${chars.length}`, px + pw - 14, 34, { size: 9, bold: true, align: 'right', color: COLORS.muted });
  const card = infoCard(ui, c, px, 60, pw, live, time);
  if (card === 'delete?') state.confirm = true;
  else pick = card ?? pick;

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

// ---------- Character creator ----------

// The stage poses: stand, walk in place, a cheer, and a turn to show the back of the hair.
const POSES = ['Idle', 'Walk', 'Cheer', 'Back'];
const POSE_DUR = 1.1;

function stage(ctx, x, y, w, h, time) {
  // A soft sky card with a spotlight falling on a round pedestal.
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#fbe9ff');
  sky.addColorStop(0.65, '#ffeef6');
  sky.addColorStop(1, '#ffe2ee');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  const cx = x + w / 2;
  const fy = y + h - 62;
  const beam = ctx.createLinearGradient(0, y, 0, fy);
  beam.addColorStop(0, 'rgba(255,255,255,0)');
  beam.addColorStop(1, 'rgba(255,255,255,0.75)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(cx - 22, y);
  ctx.lineTo(cx + 22, y);
  ctx.lineTo(cx + 62, fy);
  ctx.lineTo(cx - 62, fy);
  ctx.fill();
  // Drifting motes in the light.
  for (let i = 0; i < 9; i++) {
    const k = (time * 0.12 + i * 0.137) % 1;
    const mx = cx + Math.sin(i * 2.3 + time * 0.8) * (20 + (i % 3) * 14);
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
    sparkle(ctx, mx, fy - k * (h - 80), 1.6 + (i % 2), i % 2 ? '#ffffff' : '#ffd6ea');
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // The pedestal: a pastel stone drum with a lit top and a flower trim.
  ctx.fillStyle = '#d9b8ea';
  ctx.beginPath();
  ctx.ellipse(cx, fy + 7, 58, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 58, fy, 116, 7);
  ctx.fillStyle = '#f6e6ff';
  ctx.beginPath();
  ctx.ellipse(cx, fy, 58, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx - 6, fy - 3, 40, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.08 + (i / 8) * 0.84);
    const px = cx - Math.cos(a) * 56;
    const py = fy + Math.sin(a) * 12 + 5;
    ctx.fillStyle = ['#ffb3d1', '#ffe36b', '#b9e8ff'][i % 3];
    ctx.beginPath();
    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  box(ctx, x, y, w, h, { fill: null, edge: '#f4bcd8', r: 14, width: 2 });
  return [cx, fy + 2];
}

// Edits `draft` ({ name, look, tab, pose, facing, history }) in place. Returns 'start', 'back',
// or null.
export function creatorScreen(ui, time, draft) {
  const { ctx } = ui;
  ui.theme = THEMES.pink;
  draft.tab ??= 0;
  draft.pose ??= 0;
  draft.facing ??= 1;
  draft.history ??= [];
  const remember = (look) => {
    if (look === draft.look) return;
    draft.history.push(draft.look);
    if (draft.history.length > 40) draft.history.shift();
    draft.look = look;
  };
  backdrop(ctx, time * 0.3);
  ctx.fillStyle = 'rgba(255,240,250,0.45)';
  ctx.fillRect(0, 0, 640, 360);
  petals(ctx, time);
  text(ctx, 'Create your hero', 320, 30, { size: 18, bold: true, align: 'center', color: '#ffffff', outline: '#c97ad9' });

  // The stage: your hero on a pedestal, the name on a plate at their feet.
  const SX = 22;
  const SY = 44;
  const SW = 250;
  const SH = 290;
  softShadow(ctx, SX, SY, SW, SH, 12, 4);
  const [cx, fy] = stage(ctx, SX, SY, SW, SH, time);
  const pose = POSES[draft.pose];
  const cheer = pose === 'Cheer' ? (time % (POSE_DUR + 0.6)) / POSE_DUR : 2;
  const state = pose === 'Walk' ? { pose: 'walk' } : pose === 'Back' ? { pose: 'climb' } : cheer <= 1 ? { pose: 'cheer', progress: cheer, dur: POSE_DUR } : { pose: 'idle' };
  drawHero(ctx, draft.look, null, cx, fy, { ...state, time, facing: draft.facing, scale: 3, seed: 1 });
  const shown = draft.name || 'Your name';
  ctx.font = font(10, true);
  const nw = Math.max(70, ctx.measureText(shown).width + 20);
  box(ctx, cx - nw / 2, fy + 14, nw, 16, { fill: 'rgba(90,63,122,0.82)', edge: '#ffffff', r: 8, width: 1.5 });
  text(ctx, shown, cx, fy + 26, { size: 10, bold: true, align: 'center', color: draft.name ? '#ffffff' : 'rgba(255,255,255,0.55)' });
  // Pose chips and a turn button along the bottom of the stage.
  draft.pose = tabs(ui, SX + 14, SY + SH - 22, POSES, draft.pose, { w: 44, h: 15 });
  if (button(ui, SX + SW - 46, SY + SH - 24, 34, 17, 'Turn', { size: 8 })) draft.facing = -draft.facing;

  // The wardrobe: tabs over the look picker, then the name, then the buttons.
  const PX = 286;
  const PY = 44;
  const PW = 332;
  const PH = 290;
  softShadow(ctx, PX, PY, PW, PH, 12, 4);
  box(ctx, PX - 2, PY - 2, PW + 4, PH + 4, { fill: null, edge: '#ffe0ef', r: 16, width: 3 });
  box(ctx, PX, PY, PW, PH, { fill: 'rgba(255,250,253,0.97)', edge: '#f4bcd8', r: 14, width: 2 });
  const tabNames = LOOK_TABS.map((t) => t.label);
  draft.tab = tabs(ui, PX + (PW - tabNames.length * 60) / 2, PY + 10, tabNames, draft.tab, { w: 58, h: 17 });
  const cell = [21, 30, 27, 24, 40][draft.tab];
  const picked = lookRows(ui, draft.look, draft.tab, PX + 14, PY + 36, PW - 28, { cell, time });
  remember(picked.look);

  // Name entry: a field with a blinking caret and a placeholder.
  const NY = PY + PH - 62;
  // The tip only shows when the rows leave room for it (the Hair tab is full).
  if (PY + 36 + picked.h < NY - 26) wrap(ctx, 'Gear you equip covers your outfit. Restyle any time at Lulu\'s salon in Sprout Village.', PX + 16, NY - 24, PW - 32, { size: 7, color: COLORS.muted });
  ctx.strokeStyle = COLORS.cellEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PX + 14, NY - 6);
  ctx.lineTo(PX + PW - 14, NY - 6);
  ctx.stroke();
  for (const ch of ui.input.typed) {
    if (ch === '\b') draft.name = draft.name.slice(0, -1);
    else if (/^[\w '-]$/.test(ch) && draft.name.length < 12 && !(ch === ' ' && !draft.name)) draft.name += ch;
  }
  text(ctx, 'Name', PX + 16, NY + 11, { size: 9, bold: true });
  box(ctx, PX + 52, NY, PW - 66, 17, { fill: '#ffffff', edge: COLORS.accent, r: 8.5 });
  const caret = Math.floor(time * 2) % 2 ? '|' : '';
  if (draft.name) text(ctx, `${draft.name}${caret}`, PX + 58, NY + 12, { size: 9, bold: true });
  else text(ctx, `${caret}Type a name`, PX + 58, NY + 12, { size: 9, color: COLORS.muted });
  text(ctx, `${draft.name.length}/12`, PX + PW - 20, NY + 12, { size: 7, align: 'right', color: COLORS.muted });

  const BY = PY + PH - 34;
  if (button(ui, PX + 14, BY, 82, 22, 'Randomize', { size: 9, iconName: 'star' })) remember(randomLook());
  if (button(ui, PX + 102, BY, 56, 22, 'Undo', { size: 9, enabled: draft.history.length > 0 })) draft.look = draft.history.pop();
  const ok = draft.name.trim().length > 0;
  // Start on Dawnlight Isle (the tutorial) or skip straight to Sprout Village.
  draft.tutorial ??= true;
  text(ctx, 'Tutorial', PX + 166, BY + 14.5, { size: 8, bold: true, color: draft.tutorial ? COLORS.ink : COLORS.muted });
  draft.tutorial = toggle(ui, PX + 206, BY + 4.5, draft.tutorial);
  if (hover(ui, PX + 162, BY, 72, 22)) tooltip(ui, [{ text: draft.tutorial ? 'Start on Dawnlight Isle' : 'Skip the tutorial', bold: true }, { text: draft.tutorial ? 'A short island that shows you the ropes, then a boat to Sprout Village.' : 'Start right in Sprout Village.', size: 8, color: COLORS.muted }]);
  if (button(ui, 8, 8, 86, 18, '< Characters', { size: 8 }) || ui.input.pressed.has('Escape')) return 'back';
  return button(ui, PX + PW - 94, BY, 80, 22, 'Start!', { primary: true, enabled: ok, size: 11 }) || (ok && ui.input.pressed.has('Enter')) ? 'start' : null;
}
