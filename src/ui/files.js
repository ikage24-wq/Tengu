// The save files, after the title: three playbills pinned up backstage at Madame Encore's theatre
// (the title show's own set), one per save file. Each file is a world with up to four heroes who
// share an island, a Monster Book, a wardrobe and a storage chest (core/save.js). A playbill shows
// the world's name, its heroes with their levels, the time played and when it was last played; an
// empty one is a fresh poster asking for a new world. Pick one to play it; copy it into an empty
// file, or delete it (after a warning).

import { drawHero } from '../render/hero.js';
import { withZoom } from '../render/pixel.js';
import { wornGear } from '../core/character.js';
import { FILES } from '../core/save.js';
import { COLORS, text, box, button, hover, clicked, font, icon, tooltip } from './kit.js';

// Silly world names to start from (a new world can be renamed before it's made).
const NAMES = ['Biscuit Bay', 'Snail Hollow', 'Grindstone Isle', 'Loot Lagoon', 'Side Quest Shores', 'Puffbun Point', 'Mount Respawn',
  'Fetch Quest Falls', 'Drop Rate Downs', 'Ten Snails Cove', 'The Isle of Mild Peril', 'Nap Rock', 'Windbag Reef', 'Popcorn Atoll'];
const rollName = (not) => {
  const pool = NAMES.filter((n) => n !== not);
  return pool[Math.floor(Math.random() * pool.length)];
};

const W = 172;
const H = 236;
const X = (i) => 320 + (i - 1) * (W + 16) - W / 2;
const Y = 54;

// Played time as "3 h 20 min" (or "12 min").
const played = (s) => {
  const m = Math.floor((s ?? 0) / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
};
const when = (t) => {
  if (!t) return 'Never';
  const d = (Date.now() - t) / 1000;
  if (d < 90) return 'Just now';
  if (d < 3600) return `${Math.round(d / 60)} min ago`;
  if (d < 86400) return `${Math.round(d / 3600)} h ago`;
  return `${Math.round(d / 86400)} days ago`;
};

// The backstage wall the playbills hang on: bricks, a lamp's warm light, the curtains either side.
function backstage(ctx, time) {
  ctx.fillStyle = '#3a2440';
  ctx.fillRect(0, 0, 640, 360);
  for (let y = 0, row = 0; y < 330; y += 16, row++) {
    for (let x = row % 2 ? -20 : 0; x < 640; x += 40) {
      ctx.fillStyle = (x * 7 + y * 3) % 5 ? '#4a2e4e' : '#523454';
      ctx.fillRect(x + 1, y + 1, 38, 14);
    }
  }
  const sway = Math.sin(time * 1.1) * 0.1;
  const lx = 320 + Math.sin(sway) * 50;
  const g = ctx.createRadialGradient(lx, 30, 4, lx, 30, 300);
  g.addColorStop(0, 'rgba(255,236,170,0.3)');
  g.addColorStop(1, 'rgba(255,236,170,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = '#7a4a2a';
  ctx.fillRect(0, 330, 640, 30);
  ctx.fillStyle = '#9a6a3a';
  for (let x = 0; x < 640; x += 46) ctx.fillRect(x, 330, 44, 3);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = side < 0 ? i * 10 : 600 + i * 10;
      const s = Math.sin(time * 1.2 + i) * 1.5;
      const cg = ctx.createLinearGradient(x, 0, x + 10, 0);
      cg.addColorStop(0, '#7a1430');
      cg.addColorStop(0.5, '#d83a5a');
      cg.addColorStop(1, '#7a1430');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 10.5, 0);
      ctx.quadraticCurveTo(x + 10 + s, 180, x + 10 + s * 2, 360);
      ctx.lineTo(x + s * 2, 360);
      ctx.quadraticCurveTo(x + s, 180, x, 0);
      ctx.fill();
    }
  }
}

// One playbill, pinned at the top and fluttering a little.
function playbill(ui, i, w, chars, time, live, state) {
  const { ctx } = ui;
  const x = X(i);
  const on = state.file === i;
  const hot = live && hover(ui, x, Y, W, H);
  const lift = on ? -4 : hot ? -2 : 0;
  ctx.save();
  ctx.translate(x + W / 2, Y + lift);
  ctx.rotate(Math.sin(time * 1.3 + i * 2) * 0.008 + (i - 1) * 0.012);
  ctx.translate(-(x + W / 2), -(Y + lift));
  const y = Y + lift;
  ctx.fillStyle = 'rgba(20,8,30,0.35)';
  ctx.fillRect(x + 3, y + 5, W, H);
  ctx.fillStyle = w ? '#fff3d8' : '#f4ead8';
  ctx.fillRect(x, y, W, H);
  ctx.strokeStyle = on ? '#ffd66b' : 'rgba(138,90,58,0.5)';
  ctx.lineWidth = on ? 3 : 1.5;
  ctx.strokeRect(x, y, W, H);
  // The header band and the pin.
  ctx.fillStyle = w ? ['#d83a5a', '#4a8ad8', '#3aa878'][i] : '#a8a0b8';
  ctx.fillRect(x, y, W, 30);
  text(ctx, `FILE ${i + 1}`, x + W / 2, y + 12, { size: 7, bold: true, align: 'center', color: 'rgba(255,255,255,0.8)' });
  text(ctx, w ? w.name : 'Empty', x + W / 2, y + 25, { size: 11, bold: true, align: 'center', color: '#ffffff' });
  ctx.fillStyle = '#ffd66b';
  ctx.beginPath();
  ctx.arc(x + W / 2, y + 3, 4, 0, Math.PI * 2);
  ctx.fill();
  if (!w) {
    // A fresh poster: a big plus, and an invitation.
    const cx = x + W / 2;
    const pulse = 1 + Math.sin(time * 3) * 0.06;
    ctx.save();
    ctx.translate(cx, y + 104);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ffe0ef';
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '+', 0, 12, { size: 34, bold: true, align: 'center', color: '#ff6fa8' });
    ctx.restore();
    text(ctx, 'New World', cx, y + 158, { size: 13, bold: true, align: 'center', color: COLORS.ink });
    text(ctx, 'Now casting: you.', cx, y + 174, { size: 8, align: 'center', color: COLORS.muted });
    text(ctx, 'No experience necessary.', cx, y + 186, { size: 8, align: 'center', color: COLORS.muted });
  } else {
    // The cast: up to four heroes side by side, each with their level and job.
    const list = chars.filter(Boolean);
    text(ctx, list.length ? 'STARRING' : 'AUDITIONS OPEN', x + W / 2, y + 44, { size: 7, bold: true, align: 'center', color: '#a0703a' });
    // The empty spots in the cast: dashed outlines with a question mark, bobbing.
    for (let k = 0; k < chars.length && !list.length; k++) {
      const cx = x + W / 2 + (k - (chars.length - 1) / 2) * 36;
      const bob = Math.sin(time * 2 + k) * 1.5;
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(160,112,58,0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, y + 76 + bob, 11, 0, Math.PI * 2);
      ctx.moveTo(cx - 12, y + 108);
      ctx.quadraticCurveTo(cx - 12, y + 90 + bob, cx, y + 90 + bob);
      ctx.quadraticCurveTo(cx + 12, y + 90 + bob, cx + 12, y + 108);
      ctx.stroke();
      ctx.restore();
      text(ctx, '?', cx, y + 80 + bob, { size: 10, bold: true, align: 'center', color: 'rgba(160,112,58,0.6)' });
    }
    list.forEach((c, k) => {
      const cx = x + W / 2 + (k - (list.length - 1) / 2) * 40;
      withZoom(2, () => drawHero(ctx, c.appearance, wornGear(c), cx, y + 108, { pose: 'idle', time: time + k * 2.3, seed: k, scale: 1.1, facing: 1 }));
      ctx.font = font(7, true);
      text(ctx, c.name.length > 7 ? `${c.name.slice(0, 6)}…` : c.name, cx, y + 120, { size: 7, bold: true, align: 'center', color: COLORS.ink });
      text(ctx, `Lv ${c.level}`, cx, y + 130, { size: 7, align: 'center', color: COLORS.muted });
    });
    // The world's numbers.
    const rows = [
      ['Heroes', `${list.length} / ${chars.length}`],
      ['Played', played(w.playSeconds)],
      ['Last played', when(w.lastPlayed)],
      ['Island', w.home ? `Stage ${w.home.stage ?? 1}` : 'Not yet'],
      ['Monster Book', `${Object.keys(w.book ?? {}).length} cards`],
    ];
    rows.forEach(([k, v], r) => {
      const ry = y + 138 + r * 13.5;
      box(ctx, x + 10, ry, W - 20, 12, { fill: 'rgba(160,112,58,0.12)', edge: null, r: 6 });
      text(ctx, k, x + 16, ry + 9, { size: 7, bold: true, color: COLORS.muted });
      text(ctx, v, x + W - 16, ry + 9, { size: 7.5, bold: true, align: 'right', color: COLORS.ink });
    });
  }
  ctx.restore();
  if (live && clicked(ui, x, Y, W, H - 32)) {
    if (on) return 'open';
    state.file = i;
  }
  // Under the selected playbill: Play (or New World), and Copy and Delete for a world.
  if (!on) return null;
  const by = Y + H - 26;
  if (!w) return button(ui, x + 12, by, W - 24, 20, 'Create World', { primary: true, size: 10, enabled: live }) ? 'open' : null;
  if (button(ui, x + 10, by, W - 66, 20, 'Play', { primary: true, size: 10, enabled: live })) return 'open';
  const free = state.worlds.findIndex((o) => !o);
  for (const [k, ic, tip, act, ok] of [[0, 'copy', free < 0 ? 'No empty file to copy into' : `Copy to File ${free + 1}`, 'copy', free >= 0], [1, 'trash', 'Delete this world', 'delete?', true]]) {
    const tx = x + W - 52 + k * 22;
    const h = live && hover(ui, tx, by, 20, 20);
    box(ctx, tx, by, 20, 20, { fill: h && ok ? (act === 'copy' ? '#e6f4ff' : '#ffd3dc') : '#f3e8fb', edge: COLORS.cellEdge, r: 10, width: 1.2 });
    icon(ctx, ic, tx + 10, by + 10, 10, ok ? (h && act !== 'copy' ? COLORS.bad : COLORS.muted) : '#d0c8d8');
    if (h) tooltip(ui, [{ text: tip, bold: true }]);
    if (live && ok && clicked(ui, tx, by, 20, 20)) return act;
  }
  return null;
}

// `state`: { file, worlds: [world|null x3], chars: [[...4] x3], confirm, naming, name }.
// Returns 'open', 'create', 'copy', 'delete', 'back' or null.
export function filesScreen(ui, time, state) {
  const { ctx } = ui;
  const keys = ui.input.pressed;
  const live = !state.confirm && !state.naming;
  backstage(ctx, time);
  text(ctx, 'Choose a save file', 320, 32, { size: 15, bold: true, align: 'center', color: '#ffe9a6', outline: '#5a2a3a' });
  text(ctx, 'Each one is a world of its own. Up to four heroes live in it and share an island, a Monster Book, a wardrobe and a storage chest.', 320, 46, { size: 7.5, align: 'center', color: 'rgba(255,240,220,0.8)' });
  let pick = null;
  for (let i = 0; i < FILES; i++) {
    const r = playbill(ui, i, state.worlds[i], state.chars[i], time, live, state);
    if (r) pick = r;
  }
  if (live) {
    if (keys.has('ArrowLeft')) state.file = (state.file + FILES - 1) % FILES;
    if (keys.has('ArrowRight')) state.file = (state.file + 1) % FILES;
    if (keys.has('Enter')) pick = 'open';
    if (keys.has('Escape')) pick = 'back';
  }
  if (button(ui, 18, 8, 56, 18, '< Title', { size: 8, enabled: live })) pick = 'back';
  // Opening an empty file asks for the new world's name first.
  if (pick === 'open' && !state.worlds[state.file]) {
    state.naming = true;
    state.namingAt = time;
    state.name = rollName();
    pick = null;
  }
  if (pick === 'delete?') {
    state.confirm = true;
    pick = null;
  }
  if (state.naming) pick = naming(ui, state, time) ?? pick;
  if (state.confirm) pick = confirmDelete(ui, state) ?? pick;
  return pick;
}

function modal(ctx, title, h) {
  ctx.fillStyle = 'rgba(30,14,40,0.55)';
  ctx.fillRect(0, 0, 640, 360);
  const x = 200;
  const y = 180 - h / 2;
  ctx.fillStyle = 'rgba(20,8,30,0.35)';
  ctx.fillRect(x + 3, y + 5, 240, h);
  ctx.fillStyle = '#fff3d8';
  ctx.fillRect(x, y, 240, h);
  ctx.fillStyle = '#d83a5a';
  ctx.fillRect(x, y, 240, 22);
  text(ctx, title, 320, y + 15, { size: 10, bold: true, align: 'center', color: '#ffffff' });
  return { x, y };
}

// Naming a new world: a suggested silly name to keep, reroll or type over.
function naming(ui, state, time) {
  const { ctx } = ui;
  const keys = ui.input.pressed;
  const { x, y } = modal(ctx, `New world in File ${state.file + 1}`, 110);
  text(ctx, 'What is this world called?', 320, y + 40, { size: 9, bold: true, align: 'center', color: COLORS.ink });
  for (const ch of ui.input.typed) {
    if (ch === '\b') state.name = state.name.slice(0, -1);
    else if (/^[\w '&-]$/.test(ch) && state.name.length < 22 && !(ch === ' ' && !state.name)) state.name += ch;
  }
  box(ctx, x + 20, y + 48, 170, 20, { fill: '#ffffff', edge: COLORS.cellEdge, r: 10, width: 1.5 });
  const caret = Math.floor(Date.now() / 500) % 2 ? '' : '|';
  text(ctx, `${state.name}${caret}`, x + 30, y + 62, { size: 10, bold: true, color: COLORS.ink });
  if (button(ui, x + 196, y + 48, 24, 20, '', { size: 8 })) state.name = rollName(state.name);
  icon(ctx, 'dice', x + 208, y + 58, 10, COLORS.muted);
  if (hover(ui, x + 196, y + 48, 24, 20)) tooltip(ui, [{ text: 'Another name', bold: true }]);
  const ok = state.name.trim().length > 0;
  // (The Enter that opened this box doesn't also make the world.)
  if (button(ui, x + 20, y + 80, 120, 20, 'Create World', { primary: true, size: 10, enabled: ok }) || (ok && keys.has('Enter') && time - state.namingAt > 0.2)) {
    state.naming = false;
    return 'create';
  }
  if (button(ui, x + 150, y + 80, 70, 20, 'Cancel', { size: 10 }) || keys.has('Escape')) state.naming = false;
  return null;
}

function confirmDelete(ui, state) {
  const { ctx } = ui;
  const keys = ui.input.pressed;
  const w = state.worlds[state.file];
  const n = state.chars[state.file].filter(Boolean).length;
  const { x, y } = modal(ctx, 'Delete World', 104);
  text(ctx, `Delete ${w?.name ?? 'this world'} for good?`, 320, y + 42, { size: 10, bold: true, align: 'center', color: COLORS.ink });
  text(ctx, `${n} hero${n === 1 ? '' : 'es'}, the island, the book and the chest all go.`, 320, y + 56, { size: 7.5, align: 'center', color: COLORS.muted });
  text(ctx, 'This cannot be undone.', 320, y + 67, { size: 7.5, bold: true, align: 'center', color: COLORS.bad });
  if (button(ui, x + 20, y + 76, 100, 20, 'Delete', { primary: true, size: 10 })) {
    state.confirm = false;
    return 'delete';
  }
  if (button(ui, x + 130, y + 76, 90, 20, 'Cancel', { size: 10 }) || keys.has('Escape')) state.confirm = false;
  return null;
}
