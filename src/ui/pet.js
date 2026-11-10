// The Mochi window (P): which of your Mochi comes along with you (world/mochi.js). With none hatched
// yet, where to get one. Otherwise: one of your Mochi on the left (◀ ▶ for the others), its name,
// and Take along / Send home; on the right what it does for you: fetching loot (how far it reaches),
// the HP and MP it gives you a tonic at, and what its form lends you while it's out.

import { STAGES } from '../data/mochi-genes.js';
import { companionOf, takeAlong, sendHome, petReach, formHelp } from '../world/mochi.js';
import { COLORS, windowFrame, button, text, hover, tooltip, toggle, wrap, fit } from './kit.js';
import { STAT_ORDER, portraitCard, statRow, heading, tag } from './mochi-kit.js';

const W = 340;
const H = 250;
const WORD = { speed: 'speed', watk: 'attack', matk: 'magic', jump: 'jump', regenPct: 'HP back/s', mp: 'max MP', expPct: 'EXP' };
const helpLine = (values) => Object.entries(values).map(([k, v]) => (k === 'regenPct' || k === 'expPct' ? `+${Math.round(v * 1000) / 10}% ${WORD[k]}` : `+${Math.round(v)} ${WORD[k]}`)).join(', ');

export function petWindow(ui, state, world) {
  const win = state.windows.pet;
  if (!windowFrame(ui, win, W, H, 'Mochi', { icon: 'paw' })) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const x0 = win.x + 10;
  const y0 = win.y + 28;
  const list = (char.garden?.mochi ?? []).filter((r) => r.stage !== 'egg');
  if (!list.length) {
    // None hatched yet: where they come from.
    text(ctx, 'Your Mochi can come along!', x0, y0 + 12, { size: 9, bold: true, color: th.ink });
    wrap(ctx, "Any Mochi from your Mochi Garden can follow you round: it fetches your loot, gives you a tonic when you run low, and a grown one lends you a little of its form. Hatch one in your Garden (through the Mochi gate past Sprout Village's footbridge).", x0, y0 + 28, W - 20, { size: 7.5, color: COLORS.ink });
    return;
  }
  const out = companionOf(char);
  if (!list.includes(win.pick)) win.pick = out ?? list[0];
  const rec = win.pick;
  // ----- The left: the Mochi -----
  portraitCard(ctx, rec, x0, y0, 112, 118, world.now, { scale: 2.4 });
  const along = out === rec && Boolean(char.pet?.out);
  text(ctx, fit(ctx, rec.name ?? STAGES[rec.stage] ?? 'Mochi', 108, 10, true), x0 + 56, y0 + 132, { size: 10, bold: true, align: 'center', color: th.ink });
  tag(ctx, along ? 'Out with you' : 'In the Garden', x0 + 56, y0 + 144, along ? '#4fbf72' : '#b8a8c8', { align: 'center' });
  if (button(ui, x0 + 10, y0 + 154, 92, 18, along ? 'Send home' : 'Take along', { size: 8.5, primary: !along, iconName: along ? 'door' : 'paw' })) {
    if (along) sendHome(char);
    else takeAlong(char, rec);
  }
  if (list.length > 1) {
    const at = list.indexOf(rec);
    if (button(ui, x0 + 4, y0 + 178, 24, 15, '◀', { size: 7.5 })) win.pick = list[(at + list.length - 1) % list.length];
    if (button(ui, x0 + 84, y0 + 178, 24, 15, '▶', { size: 7.5 })) win.pick = list[(at + 1) % list.length];
    text(ctx, `${at + 1} / ${list.length}`, x0 + 56, y0 + 189, { size: 7, bold: true, align: 'center', color: COLORS.muted });
  }
  // ----- The right: how it helps (the settings are kept with whoever's out), its form, its stats -----
  const rx = x0 + 122;
  const rw = W - 20 - 122;
  let y = y0;
  heading(ctx, 'Helps you', rx, y, rw);
  y += 12;
  const opts = char.pet?.opts ?? (win.opts ??= { loot: true, hp: 40, mp: 25 });
  text(ctx, 'Fetch loot', rx, y + 9, { size: 7.5, bold: true, color: th.ink });
  opts.loot = toggle(ui, rx + 56, y + 1, opts.loot);
  text(ctx, `reaches ${petReach(rec).range}px`, rx + rw, y + 9, { size: 6.5, align: 'right', color: COLORS.muted });
  if (hover(ui, rx, y, rw, 14)) tooltip(ui, [{ text: 'Fetches your loot', bold: true }, { text: 'The faster a runner, the further it reaches and the quicker it fetches.', color: COLORS.muted }]);
  y += 17;
  const stepper = (label, key, color) => {
    text(ctx, label, rx, y + 9, { size: 7.5, bold: true, color });
    if (button(ui, rx + 56, y, 16, 13, '-', { size: 8 })) opts[key] = Math.max(0, opts[key] - 5);
    text(ctx, opts[key] ? `below ${opts[key]}%` : 'off', rx + 104, y + 9.5, { size: 7.5, bold: true, align: 'center', color: COLORS.ink });
    if (button(ui, rx + 136, y, 16, 13, '+', { size: 8 })) opts[key] = Math.min(90, opts[key] + 5);
    y += 16;
  };
  stepper('HP tonic', 'hp', COLORS.hp);
  stepper('MP tonic', 'mp', COLORS.mp);
  y += 4;
  // What its form lends you.
  heading(ctx, 'Its form lends you', rx, y, rw);
  y += 12;
  const help = formHelp(rec);
  if (help) {
    text(ctx, help.name, rx, y + 8, { size: 7.5 });
    text(ctx, helpLine(help.values), rx, y + 19, { size: 7.5, bold: true, color: '#4fbf72' });
    y += 24;
  } else {
    wrap(ctx, 'Nothing yet: a grown Mochi lends you a little of its form.', rx, y + 8, rw, { size: 7, color: COLORS.muted });
    y += 22;
  }
  heading(ctx, 'Stats', rx, y, rw);
  y += 11;
  for (const st of STAT_ORDER) {
    statRow(ui, rx, y, rw, rec, st, { style: false });
    y += 14;
  }
}
