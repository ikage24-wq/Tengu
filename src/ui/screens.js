// Title, character select, and character creator screens.

import { MAPS } from '../data/maps.js';
import { VERSION } from '../version.js';
import { JOBS } from '../data/jobs.js';
import { drawHero } from '../render/hero.js';
import { COLORS, text, box, button, bar, hover, clicked, roundRect, font, icon, tooltip, lighten, darken } from './kit.js';
import { stats, wornGear } from '../core/character.js';
import { expToNext } from '../core/exp.js';
import { randomLook } from './looks.js';
import { drawPeekers, drawPeekerTalk } from './title-peek.js';
import { drawShow, drawBlock } from './title-show.js';
import { dressingRooms } from './dressing.js';

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

// --- Character select: the theatre's dressing rooms, one per hero in this world (ui/dressing.js).

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
    text(ctx, 'An empty dressing room', cx, y + 124, { size: 12, bold: true, align: 'center', color: COLORS.ink });
    text(ctx, 'Auditions are open.', cx, y + 144, { size: 8, align: 'center', color: COLORS.muted });
    text(ctx, 'Cast a new hero in this world.', cx, y + 156, { size: 8, align: 'center', color: COLORS.muted });
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
  // The dressing rooms (ui/dressing.js): click a room to pick its hero, again to start; an empty
  // room goes straight to casting a new one.
  let pick = null;
  const click = dressingRooms(ui, time, chars, state, live);
  if (click) {
    if (!chars[click.slot]) pick = 'create';
    else if (click.again) pick = 'start';
    state.slot = click.slot;
  }

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

// The character creator is the theatre's costume department (ui/creator.js).
export { creatorScreen } from './creator.js';
