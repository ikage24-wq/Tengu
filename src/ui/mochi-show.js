// The Mochi Show's window (world/mochi-show.js; the show tent on the Mochi Market's terrace): which of
// your Mochi goes on, at which rank, and how the judges are likely to see it - Style, Charm and
// Talent, each with what would raise it - and the prizes. "Dress up" opens its closet; "Enter the
// show" sends it on. Walk away and the window closes.

import { STAGES as MOCHI_STAGES } from '../data/mochi-genes.js';
import { SHOW_RANKS, SHOW_ORDER, showOpen, showPrize, styleScore, charmScore, talentScore, ACTS, ACT_ORDER, actOf, actTier } from '../data/mochi-show.js';
import { startShow } from '../world/mochi-show.js';
import { drawMochiAnim } from '../render/mochi-anim.js';
import { COLORS, windowFrame, text, box, button, clicked, fit, tabs, bar } from './kit.js';
import { heading } from './mochi-kit.js';

const W = 300;
// (As tall as what's in it: a row of the picker per two Mochi.)
const heightFor = (n) => 180 + Math.max(1, Math.ceil(Math.min(n, 6) / 2)) * 22;
const portraits = new WeakMap();
const portraitOf = (rec) => {
  if (!portraits.has(rec)) portraits.set(rec, { genes: rec, dir: 1, speed: 0, dist: 0, size: rec.stage === 'mochiko' ? 'baby' : 'grown', noIdle: true });
  return portraits.get(rec);
};
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const lineOf = (rec) => (rec.name ? `${rec.name} · ${MOCHI_STAGES[rec.stage] ?? 'Mochi'}` : `${cap(rec.personality)} ${MOCHI_STAGES[rec.stage] ?? 'Mochi'}`);
// (What would raise each score, said plainly.)
const TIPS = {
  style: 'Finer clothes, a full outfit, or a whole costume',
  charm: 'Time together: pet it, play, feed its favourites',
  talent: 'Teach it tricks with new sweets',
};
// (How well it would do its act, and what helps.)
const WAY = ['a bit wobbly', 'good', 'dazzling!'];
const actTip = (rec, act) => {
  if (act === 'trick') return TIPS.talent;
  const A = ACTS[act];
  const way = WAY[actTier(talentScore(rec, act))];
  return A.loves.includes(rec.personality) ? `Loves it! ${A.word} helps · ${way}` : `${A.word} helps · ${way}`;
};
const RIBBON = { gold: '#f2c94c', silver: '#c8d0dc', bronze: '#d89060' };

export function mochiShowWindow(ui, state, world) {
  const win = state.windows.show;
  const at = world.map.showTent;
  if (at == null || world.gardenVisit || !world.char.garden || world.show || Math.abs(world.body.x - at) > 90) {
    win.open = false;
    return;
  }
  const pool = (world.char.garden?.mochi ?? []).filter((r) => r.stage !== 'egg');
  if (!windowFrame(ui, win, W, heightFor(pool.length), 'The Mochi Show', { icon: 'star' })) return;
  const { ctx } = ui;
  const char = world.char;
  const x = win.x + 10;
  let y = win.y + 28;
  // The rank: Beginner, Challenge, Master (each opened by winning the one before).
  if (!SHOW_ORDER.includes(win.rank) || !showOpen(char, win.rank)) win.rank = 'beginner';
  const pick = tabs(ui, x, y, SHOW_ORDER.map((r) => (showOpen(char, r) ? SHOW_RANKS[r].name : `${SHOW_RANKS[r].name} (locked)`)), SHOW_ORDER.indexOf(win.rank), { total: W - 20, h: 14 });
  if (showOpen(char, SHOW_ORDER[pick])) win.rank = SHOW_ORDER[pick];
  y += 20;
  const prizes = [1, 2, 3].map((p) => `${['1st', '2nd', '3rd'][p - 1]} ${showPrize(win.rank, p)}g`).join(' · ');
  text(ctx, `Prizes: ${prizes}`, x, y + 4, { size: 6.5, color: COLORS.muted });
  y += 12;
  // Who goes on.
  heading(ctx, 'Who goes on?', x, y, W - 20);
  const list = pool;
  if (!list.length) {
    text(ctx, 'Hatch a Mochi in your Garden first!', x, y + 20, { size: 7, color: COLORS.muted });
    return;
  }
  if (!list.includes(win.pick)) win.pick = list[0];
  const cw = (W - 24) / 2;
  list.slice(0, 6).forEach((rec, i) => {
    const cx = x + (i % 2) * (cw + 4);
    const cy = y + 9 + Math.floor(i / 2) * 22;
    const on = win.pick === rec;
    box(ctx, cx, cy, cw, 19, { fill: on ? '#ffe8f0' : '#ffffff', edge: on ? '#ff8fb0' : '#f0dce4', r: 6, width: on ? 1.5 : 1 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 1, cy + 1, 20, 17);
    ctx.clip();
    ctx.translate(cx + 11, cy + 21);
    ctx.scale(0.72, 0.72);
    drawMochiAnim(ctx, portraitOf(rec), 0, 0, world.now);
    ctx.restore();
    text(ctx, fit(ctx, lineOf(rec), cw - 34, 7, true), cx + 24, cy + 12, { size: 7, bold: true });
    // (Its best ribbon at this rank, if it has one.)
    const rb = rec.ribbons?.[win.rank];
    if (rb) {
      ctx.fillStyle = RIBBON[rb];
      ctx.beginPath();
      ctx.arc(cx + cw - 8, cy + 9.5, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (clicked(ui, cx, cy, cw, 19)) win.pick = rec;
  });
  y += 9 + Math.ceil(Math.min(list.length, 6) / 2) * 22 + 4;
  const rec = win.pick;
  // Its act: its best trick, or a turn of its own.
  heading(ctx, 'Its act', x, y, W - 20);
  const now = actOf(rec);
  const cw2 = (W - 20 - 2 * (ACT_ORDER.length - 1)) / ACT_ORDER.length;
  ACT_ORDER.forEach((act, i) => {
    if (button(ui, x + i * (cw2 + 2), y + 9, cw2, 13, ACTS[act].short, { size: 6.5, primary: act === now })) rec.showAct = act;
  });
  y += 27;
  // How the judges will likely see it.
  heading(ctx, `How ${rec.name ?? 'it'} might score`, x, y, W - 20);
  y += 10;
  for (const [key, word, judge, fn, color] of [['style', 'Style', 'Hayate', styleScore, '#ff8fb4'], ['charm', 'Charm', 'Kinako', charmScore, '#ffb86a'], ['talent', 'Talent', 'Mugi', talentScore, '#7ab8f0']]) {
    const v = fn(rec);
    text(ctx, word, x, y + 7, { size: 7, bold: true });
    bar(ctx, x + 34, y + 1, 92, 8, v / 10, color, `${Math.round(v)}/10`, { size: 6 });
    text(ctx, fit(ctx, key === 'talent' ? actTip(rec, now) : TIPS[key], W - 20 - 132, 6, false), x + 132, y + 7, { size: 6, color: COLORS.muted });
    y += 12;
  }
  text(ctx, `Judged by ${['Hayate (Style)', 'Kinako (Charm)', 'Maestro Mugi (Talent)'].join(', ')}`, x, y + 5, { size: 6, color: COLORS.muted });
  y += 12;
  // Dress it up first, or on it goes.
  if (button(ui, x, y, 90, 16, 'Dress up', { size: 7.5, iconName: 'hanger' })) {
    world.closetFor = rec;
    world.events.push({ type: 'closet' });
  }
  if (button(ui, x + W - 20 - 120, y, 120, 16, 'Enter the show', { size: 8, primary: true, iconName: 'star' })) {
    if (startShow(world, rec, win.rank)) win.open = false;
  }
}
