// The Mochi window (P): which of your Mochi comes along with you (world/mochi.js). With none hatched
// yet, where to get one. Otherwise: one of your Mochi on the left (◀ ▶ for the others), its name,
// and Take along / Send home; on the right what it does for you: fetching loot (how far it reaches),
// the HP and MP it gives you a tonic at, and what its form lends you while it's out.

import { STAGES } from '../data/mochi-genes.js';
import { drawMochiAnim } from '../render/mochi-anim.js';
import { companionOf, takeAlong, sendHome, petReach, formHelp } from '../world/mochi.js';
import { COLORS, windowFrame, button, text, hover, tooltip, well, toggle, wrap, fit } from './kit.js';

const W = 330;
const H = 214;
const WORD = { speed: 'speed', watk: 'attack', matk: 'magic', jump: 'jump', regenPct: 'HP back/s', mp: 'max MP', expPct: 'EXP' };
const helpLine = (values) => Object.entries(values).map(([k, v]) => (k === 'regenPct' || k === 'expPct' ? `+${Math.round(v * 1000) / 10}% ${WORD[k]}` : `+${Math.round(v)} ${WORD[k]}`)).join(', ');
const portraits = new WeakMap();
const portraitOf = (rec) => {
  if (!portraits.has(rec)) portraits.set(rec, { genes: rec, dir: 1, speed: 0, dist: 0 });
  const m = portraits.get(rec);
  m.size = rec.stage === 'mochiko' ? 'baby' : 'grown';
  return m;
};

export function petWindow(ui, state, world) {
  const win = state.windows.pet;
  if (!windowFrame(ui, win, W, H, 'Mochi')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const x0 = win.x + 10;
  const y0 = win.y + 26;
  const list = (char.garden?.mochi ?? []).filter((r) => r.stage !== 'egg');
  well(ctx, x0, y0, 110, H - 36, th);
  if (!list.length) {
    // None hatched yet: where they come from.
    text(ctx, 'Your Mochi can come along!', x0 + 120, y0 + 12, { size: 8.5, bold: true, color: th.ink });
    wrap(ctx, "Any Mochi from your Mochi Garden can follow you round: it fetches your loot, gives you a tonic when you run low, and a grown one lends you a little of its form. Hatch one in your Garden (at the end of Sprout Village's Pond Garden).", x0 + 120, y0 + 26, W - 140, { size: 7.5, color: COLORS.ink });
    return;
  }
  const out = companionOf(char);
  if (!list.includes(win.pick)) win.pick = out ?? list[0];
  const rec = win.pick;
  // ----- The left: the Mochi -----
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 + 2, y0 + 2, 106, 98);
  ctx.clip();
  ctx.translate(x0 + 55, y0 + 92);
  ctx.scale(2, 2);
  drawMochiAnim(ctx, portraitOf(rec), 0, 0, world.now);
  ctx.restore();
  text(ctx, fit(ctx, rec.name ?? STAGES[rec.stage] ?? 'Mochi', 100, 10, true), x0 + 55, y0 + 114, { size: 10, bold: true, align: 'center', color: th.ink });
  const along = out === rec && Boolean(char.pet?.out);
  text(ctx, along ? 'Out with you' : 'In the Garden', x0 + 55, y0 + 125, { size: 7, align: 'center', color: along ? '#4fbf72' : COLORS.muted });
  if (button(ui, x0 + 12, y0 + 132, 86, 16, along ? 'Send home' : 'Take along', { size: 8, primary: !along })) {
    if (along) sendHome(char);
    else takeAlong(char, rec);
  }
  if (list.length > 1) {
    const at = list.indexOf(rec);
    if (button(ui, x0 + 6, y0 + 154, 22, 14, '◀', { size: 7.5 })) win.pick = list[(at + list.length - 1) % list.length];
    if (button(ui, x0 + 82, y0 + 154, 22, 14, '▶', { size: 7.5 })) win.pick = list[(at + 1) % list.length];
    text(ctx, `${at + 1} / ${list.length}`, x0 + 55, y0 + 164, { size: 6.5, align: 'center', color: COLORS.muted });
  }
  // ----- The right: helping (the settings are kept with whoever's out) -----
  const rx = x0 + 118;
  const rw = W - 138;
  let y = y0 + 4;
  const opts = char.pet?.opts ?? (win.opts ??= { loot: true, hp: 40, mp: 25 });
  text(ctx, 'Loot', rx, y + 9, { size: 7.5, bold: true, color: th.ink });
  opts.loot = toggle(ui, rx + 26, y + 1, opts.loot);
  text(ctx, `reaches ${petReach(rec).range}px`, rx + rw - 4, y + 9, { size: 6.5, align: 'right', color: COLORS.muted });
  if (hover(ui, rx, y, rw, 14)) tooltip(ui, [{ text: 'Fetches your loot', bold: true }, { text: 'The faster a runner, the further it reaches and the quicker it fetches.', color: COLORS.muted }]);
  y += 16;
  const stepper = (label, key, color) => {
    text(ctx, label, rx, y + 9, { size: 7.5, bold: true, color });
    if (button(ui, rx + 44, y, 16, 13, '-', { size: 8 })) opts[key] = Math.max(0, opts[key] - 5);
    text(ctx, opts[key] ? `${opts[key]}%` : 'off', rx + 76, y + 9.5, { size: 8, bold: true, align: 'center', color: COLORS.ink });
    if (button(ui, rx + 92, y, 16, 13, '+', { size: 8 })) opts[key] = Math.min(90, opts[key] + 5);
    y += 15;
  };
  stepper('HP tonic', 'hp', COLORS.hp);
  stepper('MP tonic', 'mp', COLORS.mp);
  y += 6;
  // What its form lends you.
  const help = formHelp(rec);
  text(ctx, 'Its form lends you', rx, y + 8, { size: 7.5, bold: true, color: th.ink });
  y += 12;
  if (help) {
    text(ctx, help.name, rx, y + 8, { size: 7.5 });
    text(ctx, helpLine(help.values), rx, y + 19, { size: 7, bold: true, color: '#4fbf72' });
  } else wrap(ctx, 'Nothing yet: a grown Mochi lends you a little of its form.', rx, y + 8, rw, { size: 7, color: COLORS.muted });
}
