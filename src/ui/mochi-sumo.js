// Mochi Sumo's window (world/mochi-sumo.js; the sumo hall on the Mochi Market's lane): which of your
// Mochi wrestles, at which ring, how strong it is (its Power most, its Stamina), the move it would
// finish with, and this hour's three rivals - how it measures up to each. "Into the ring" sends it
// in. Walk away and the window closes.

import { STAGES as MOCHI_STAGES } from '../data/mochi-genes.js';
import { styleOf } from '../data/mochi-raise.js';
import { SUMO_RANKS, SUMO_ORDER, sumoOpen, sumoPrize, sumoRivals, sumoStrength, KIMARITE, BOUTS } from '../data/mochi-sumo.js';
import { startSumo } from '../world/mochi-sumo.js';
import { drawMochiAnim } from '../render/mochi-anim.js';
import { COLORS, windowFrame, text, box, button, clicked, fit, tabs, bar } from './kit.js';
import { heading } from './mochi-kit.js';

const W = 300;
const heightFor = (n) => 186 + Math.max(1, Math.ceil(Math.min(n, 6) / 2)) * 22;
const portraits = new WeakMap();
const portraitOf = (rec) => {
  if (!portraits.has(rec)) portraits.set(rec, { genes: rec, dir: 1, speed: 0, dist: 0, size: rec.stage === 'mochiko' ? 'baby' : 'grown', noIdle: true });
  return portraits.get(rec);
};
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const lineOf = (rec) => (rec.name ? `${rec.name} · ${MOCHI_STAGES[rec.stage] ?? 'Mochi'}` : `${cap(rec.personality)} ${MOCHI_STAGES[rec.stage] ?? 'Mochi'}`);
const pips = (rec) => {
  const n = styleOf(rec.stats?.power?.points ?? 0) + 1;
  return '●'.repeat(n) + '○'.repeat(6 - n);
};
// (How it measures up to a rival: the gap in strength, said plainly.)
const MATCH = [[0.12, 'Easy', '#4a9a5a'], [0.03, 'Should win', '#6aa84a'], [-0.03, 'Even match', '#c8902a'], [-0.12, 'Tough', '#d0603a'], [-9, 'Very tough', '#b83a4a']];
const matchOf = (gap) => MATCH.find(([at]) => gap >= at);
const SNEAKY = new Set(['cheeky', 'mischief', 'sneaky', 'clumsy']);
let rivalsAt = { key: null, list: [] };

export function mochiSumoWindow(ui, state, world) {
  const win = state.windows.sumo;
  const at = world.map.sumoHall;
  if (at == null || world.gardenVisit || !world.char.garden || world.sumo || Math.abs(world.body.x - at) > 90) {
    win.open = false;
    return;
  }
  const pool = (world.char.garden?.mochi ?? []).filter((r) => r.stage !== 'egg');
  if (!windowFrame(ui, win, W, heightFor(pool.length), 'Mochi Sumo', { icon: 'star' })) return;
  const { ctx } = ui;
  const char = world.char;
  const x = win.x + 10;
  let y = win.y + 28;
  // The ring: Beginner, Challenge, Master (each opened by winning the one before).
  if (!SUMO_ORDER.includes(win.rank) || !sumoOpen(char, win.rank)) win.rank = 'beginner';
  const pick = tabs(ui, x, y, SUMO_ORDER.map((r) => (sumoOpen(char, r) ? SUMO_RANKS[r].name : `${SUMO_RANKS[r].name} (locked)`)), SUMO_ORDER.indexOf(win.rank), { total: W - 20, h: 14 });
  if (sumoOpen(char, SUMO_ORDER[pick])) win.rank = SUMO_ORDER[pick];
  y += 20;
  const prizes = [3, 2, 1].map((n) => `${n} win${n > 1 ? 's' : ''} ${sumoPrize(win.rank, n)}g`).join(' · ');
  text(ctx, `Prizes: ${prizes}`, x, y + 4, { size: 6.5, color: COLORS.muted });
  y += 12;
  heading(ctx, 'Who wrestles?', x, y, W - 20);
  if (!pool.length) {
    text(ctx, 'Hatch a Mochi in your Garden first!', x, y + 20, { size: 7, color: COLORS.muted });
    return;
  }
  if (!pool.includes(win.pick)) win.pick = pool[0];
  const cw = (W - 24) / 2;
  pool.slice(0, 6).forEach((rec, i) => {
    const cx = x + (i % 2) * (cw + 4);
    const cy = y + 9 + Math.floor(i / 2) * 22;
    const on = win.pick === rec;
    box(ctx, cx, cy, cw, 19, { fill: on ? '#fff0e0' : '#ffffff', edge: on ? '#e0965a' : '#f0e0d4', r: 6, width: on ? 1.5 : 1 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 1, cy + 1, 20, 17);
    ctx.clip();
    ctx.translate(cx + 11, cy + 21);
    ctx.scale(0.72, 0.72);
    drawMochiAnim(ctx, portraitOf(rec), 0, 0, world.now);
    ctx.restore();
    text(ctx, fit(ctx, lineOf(rec), cw - 30, 7, true), cx + 24, cy + 12, { size: 7, bold: true });
    if (clicked(ui, cx, cy, cw, 19)) win.pick = rec;
  });
  y += 9 + Math.ceil(Math.min(pool.length, 6) / 2) * 22 + 4;
  const rec = win.pick;
  // How strong it is, and how it would win.
  heading(ctx, `${rec.name ?? 'It'} in the ring`, x, y, W - 20);
  y += 10;
  for (const [st, word, color, tip] of [['power', 'Power', '#e0704a', 'Pushes hardest; picks its move'], ['stamina', 'Stamina', '#e0b04a', 'Keeps pushing in a long one']]) {
    const v = Math.min(1, (rec.stats?.[st]?.points ?? 0) / 2400);
    text(ctx, word, x, y + 7, { size: 7, bold: true });
    bar(ctx, x + 40, y + 1, 92, 8, v, color, `${rec.stats?.[st]?.points ?? 0}`, { size: 6 });
    text(ctx, tip, x + 138, y + 7, { size: 6, color: COLORS.muted });
    y += 12;
  }
  const move = KIMARITE[styleOf(rec.stats?.power?.points ?? 0)];
  text(ctx, `Its finishing move: ${move.name}${SNEAKY.has(rec.personality) ? ' (or a sneaky Duck and Trip!)' : ''}`, x, y + 6, { size: 6.5, bold: true, color: '#a8562a' });
  y += 13;
  // This hour's rivals, and how it measures up to each.
  const key = `${win.rank}|${Math.floor(Date.now() / 3.6e6)}`;
  if (rivalsAt.key !== key) rivalsAt = { key, list: sumoRivals(win.rank, Math.floor(Date.now() / 3.6e6)) };
  heading(ctx, `This hour's rivals (${BOUTS} bouts)`, x, y, W - 20);
  y += 10;
  const mine = sumoStrength(rec);
  rivalsAt.list.forEach((r, i) => {
    const [, word, color] = matchOf(mine - sumoStrength(r.rec));
    text(ctx, `${i + 1}. ${r.name}`, x, y + 6, { size: 6.5, bold: true });
    text(ctx, `Power ${pips(r.rec)}`, x + 64, y + 6, { size: 6.5, color: COLORS.muted });
    text(ctx, word, x + W - 20, y + 6, { size: 6.5, bold: true, align: 'right', color });
    y += 10;
  });
  text(ctx, 'Press Space as the referee calls "Hakkeyoi!" for a good start.', x, y + 6, { size: 6, color: COLORS.muted });
  y += 13;
  if (button(ui, x + W - 20 - 120, y, 120, 16, 'Into the ring', { size: 8, primary: true, iconName: 'star' })) {
    if (startSumo(world, rec, win.rank)) win.open = false;
  }
}
