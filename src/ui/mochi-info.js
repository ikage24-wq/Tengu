// The Mochi window (docs/design/mochi.md step 8): one page per Mochi. Its portrait (a photo card in
// a little garden scene), its stage, path, form, rarity and coat as tags; generation and age; its
// five stats (grade, level, how far to the next, the way it moves now); how it feels (mood, bond,
// tummy) and which way it leans (devil to angel); who it is (personality, the sweet it loves and the
// one it hates, its voice); what it's growing into, while a Mochiko; all 21 tricks, lit as it learns
// them; its race medals, course by course; its parents, if it was bred; and (yours) the costume it
// wears (data/mochi-dress.js: ◀ ▶ through the ones you've won). Opened from its care panel (or, for
// the one picked, the race board): ◀ ▶ go through the rest of your Mochi. Built from the Mochi kit
// (ui/mochi-kit.js).

import { STAGES } from '../data/mochi-genes.js';
import { MOCHI_SWEETS, TRICKS, trendOf, leanOf } from '../data/mochi-raise.js';
import { RACE_STAGES, RANK_ORDER, MEDAL_COLOR, medalKey } from '../data/mochi-race.js';
import { DRESS, dressOpen } from '../data/mochi-dress.js';
import { drawItemIcon } from '../render/icons.js';
import { VW, VH } from '../input.js';
import { COLORS, windowFrame, text, button, hover, tooltip, fit, roundRect, icon } from './kit.js';
import { STAT_ORDER, STAT_INFO, RARITY_COLOR, portraitCard, statRow, feelMeter, heading, tag, cap } from './mochi-kit.js';

const W = 344;
const H = 318;
const COAT = { goma: 'Black Sesame', kurozato: 'Brown Sugar', yoru: 'Midnight', beniume: 'Red Plum', shinkai: 'Deep Sea', kohakutou: 'Kohakutou', moonlit: 'Moonlit', hanabi: 'Hanabi', candied: 'Candied', goldleaf: 'Gold Leaf', glassjelly: 'Glass Jelly', sakura: 'Sakura Storm', twoflavour: 'Two-Flavour', shiny: 'Shiny' };
const FORM = { run: 'Swift', fly: 'Sky', power: 'Strong', stamina: 'Steady', swim: 'Tide', plain: 'Plain', moon: 'Moon' };
const sweetOf = (kind) => MOCHI_SWEETS.find((s) => s.kind === kind) ?? null;
const coatName = (rec) => (rec.coat === 'radiant' ? (rec.path === 'angel' ? 'Halo Dawn' : rec.path === 'demon' ? 'Ember Spice' : 'Radiant') : COAT[rec.coat] ?? null);
const ageOf = (secs) => {
  const m = Math.floor((secs ?? 0) / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} m` : `${m} m`;
};
const ANGEL = '#e0a82a';
const DEVIL = '#a0508a';

export function mochiInfoWindow(ui, state, world) {
  const win = state.windows.mochiinfo;
  const rec = world.mochiInfo;
  if (!rec) {
    win.open = false;
    return;
  }
  const title = rec.name ?? `${cap(rec.personality)} ${STAGES[rec.stage] ?? 'Mochi'}`;
  win.x = Math.max(4, Math.min(VW - W - 4, win.x ?? 0));
  win.y = Math.max(4, Math.min(VH - H - 40, win.y ?? 0));
  if (!windowFrame(ui, win, W, H, title, { icon: 'book' })) {
    if (!win.open) world.mochiInfo = null;
    return;
  }
  const { ctx } = ui;
  const x = win.x + 10;
  const y = win.y + 28;
  // ---- Left: its portrait, and what it is.
  portraitCard(ctx, rec, x, y, 108, 116, world.now, { scale: 2.4 });
  let ly = y + 128;
  let tx = x;
  tx += tag(ctx, STAGES[rec.stage] ?? 'Mochi', tx, ly, '#ff8fb8') + 3;
  if (rec.path) tag(ctx, rec.path === 'angel' ? 'Angel' : 'Devil', tx, ly, rec.path === 'angel' ? ANGEL : DEVIL);
  ly += 14;
  const line = (s, opts = {}) => {
    text(ctx, fit(ctx, s, 108, opts.size ?? 6.5, Boolean(opts.bold)), x + 1, ly, { size: 6.5, color: COLORS.muted, ...opts });
    ly += 10;
  };
  if (rec.form) line(`${FORM[rec.form] ?? cap(rec.form)} form`, { bold: true, color: COLORS.ink });
  line(`Generation ${rec.gen ?? 1} · ${ageOf(rec.age)} old`);
  if (coatName(rec)) line(`${coatName(rec)} coat`, { bold: true, color: RARITY_COLOR[rec.rarity] ?? COLORS.muted });
  if (rec.parents?.length === 2) line(`Parents: ${rec.parents.map((p) => p.name ?? 'a Mochi').join(' & ')}`);
  if (rec.bloom > 0) line('In bloom!', { color: '#ff6f9a', bold: true });
  else if (rec.bredRest > 0) line('Resting after an egg');
  // ---- Right: its stats, how it feels, which way it leans, who it is.
  const rx = x + 118;
  const rw = W - 20 - 118;
  let ry = y;
  heading(ctx, 'Stats', rx, ry, rw);
  ry += 11;
  for (const st of STAT_ORDER) {
    statRow(ui, rx, ry, rw, rec, st);
    ry += 15;
  }
  ry += 2;
  heading(ctx, 'Feelings', rx, ry, rw);
  ry += 11;
  const mw = (rw - 8) / 3;
  feelMeter(ui, rx, ry, mw, 'mood', rec.mood);
  feelMeter(ui, rx + mw + 4, ry, mw, 'bond', rec.bond);
  feelMeter(ui, rx + (mw + 4) * 2, ry, mw, 'tummy', rec.tummy, { hungry: rec.hungry });
  ry += 16;
  // The way it leans: devil (a little flame) to angel (a feather).
  const lean = Math.max(-1, Math.min(1, rec.lean ?? 0));
  icon(ctx, 'flame', rx + 5, ry + 4, 8, DEVIL);
  icon(ctx, 'feather', rx + rw - 5, ry + 4, 8, ANGEL);
  const lx = rx + 14;
  const lw = rw - 28;
  const lg = ctx.createLinearGradient(lx, 0, lx + lw, 0);
  lg.addColorStop(0, '#e2b8d8');
  lg.addColorStop(0.5, '#f6eef2');
  lg.addColorStop(1, '#f8e2a8');
  ctx.fillStyle = lg;
  roundRect(ctx, lx, ry + 2, lw, 5, 2.5);
  ctx.fill();
  const mx = lx + (lw * (lean + 1)) / 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(mx, ry + 4.5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lean >= 0 ? ANGEL : DEVIL;
  ctx.beginPath();
  ctx.arc(mx, ry + 4.5, 2.8, 0, Math.PI * 2);
  ctx.fill();
  if (hover(ui, rx, ry, rw, 10)) {
    const leaning = leanOf(rec);
    tooltip(ui, [{ text: 'Which way it leans', bold: true }, { text: leaning ? `Leaning ${leaning === 'angel' ? 'angel' : 'devil'}: sweet treats and gentle care lean it angel, spicy ones and rough play devil.` : 'Neither way yet.', color: COLORS.muted }]);
  }
  ry += 14;
  // Who it is: its personality, the sweet it loves and the one it hates (their pictures), its voice.
  text(ctx, cap(rec.personality), rx, ry + 7, { size: 7, bold: true });
  const love = sweetOf(rec.loves);
  const hate = sweetOf(rec.hates);
  let sx = rx + 54;
  for (const [sw, ico, color] of [[love, 'heart', '#ff6f9a'], [hate, 'skull', '#9a8aa8']]) {
    if (!sw) continue;
    icon(ctx, ico, sx + 4, ry + 4.5, 7, color);
    ctx.save();
    ctx.translate(sx + 9, ry - 1.5);
    ctx.scale(0.8, 0.8);
    drawItemIcon(ctx, sw.id, 0, 0);
    ctx.restore();
    if (hover(ui, sx, ry - 2, 22, 13)) tooltip(ui, [{ text: `${ico === 'heart' ? 'Loves' : 'Hates'} ${sw.name}`, bold: true }]);
    sx += 30;
  }
  if (rec.voice) text(ctx, `a ${rec.voice.pitch > 1.1 ? 'high' : rec.voice.pitch < 0.9 ? 'low' : 'soft'} ${rec.voice.style}`, rx + rw, ry + 7, { size: 6, align: 'right', color: COLORS.muted });
  ry += 12;
  if (rec.stage === 'mochiko') {
    const tr = trendOf(rec);
    text(ctx, fit(ctx, tr ? (tr.plain ? 'Growing up evenly: the Plain form' : `Growing into the ${FORM[tr.stat]} form (${STAT_INFO[tr.stat].name} ${Math.round(tr.share * 100)}% lately)`) : 'Not growing into anything yet', rw, 6.5, false), rx, ry + 7, { size: 6.5, color: COLORS.muted });
  }
  // ---- Across the bottom: its tricks, then its medals.
  let by = y + 190;
  const learned = rec.tricks ?? [];
  heading(ctx, `Tricks  ${learned.length} of ${TRICKS.length}`, x, by, W - 20);
  by += 11;
  const step = (W - 20) / TRICKS.length;
  TRICKS.forEach((tk, i) => {
    const cx = x + step * i + step / 2;
    const has = learned.includes(tk);
    ctx.fillStyle = has ? '#ffd75e' : '#f4ecf0';
    ctx.beginPath();
    ctx.arc(cx, by + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    if (has) icon(ctx, 'star', cx, by + 5, 6.5, '#ffffff');
    else {
      ctx.strokeStyle = '#e6d6de';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    if (hover(ui, cx - step / 2, by, step, 11)) tooltip(ui, [{ text: has ? cap(tk) : 'Not learned yet', bold: true }, { text: has ? 'A trick it shows off now and then.' : 'Each sweet teaches one, the first time it eats it.', color: COLORS.muted }]);
  });
  by += 17;
  heading(ctx, 'Medals', x, by, W - 20);
  by += 11;
  const ids = Object.keys(RACE_STAGES);
  const cw = (W - 20 - (ids.length - 1) * 4) / ids.length;
  ids.forEach((id, i) => {
    const cx = x + i * (cw + 4);
    ctx.fillStyle = '#fff6fa';
    roundRect(ctx, cx, by, cw, 16, 6);
    ctx.fill();
    ctx.strokeStyle = '#f2d8e4';
    ctx.lineWidth = 1;
    ctx.stroke();
    text(ctx, RACE_STAGES[id].tab, cx + 5, by + 10.5, { size: 6, bold: true, color: '#a8467a' });
    // (Beginner, Challenge, Master as dots; the Hatchling medal is in the tooltip.)
    RANK_ORDER.filter((rk) => rk !== 'hatchling').forEach((rk, k) => {
      const medal = rec.medals?.[medalKey(id, rk)];
      const mx = cx + cw - 22 + k * 7;
      ctx.beginPath();
      ctx.arc(mx, by + 8, 2.8, 0, Math.PI * 2);
      if (medal) {
        ctx.fillStyle = MEDAL_COLOR[medal];
        ctx.fill();
      } else {
        ctx.strokeStyle = '#e6d6de';
        ctx.stroke();
      }
    });
    if (hover(ui, cx, by, cw, 16)) tooltip(ui, [{ text: RACE_STAGES[id].name, bold: true }, { text: RANK_ORDER.map((rk) => `${cap(rk)}: ${rec.medals?.[medalKey(id, rk)] ?? '-'}`).join(' · '), color: COLORS.muted }]);
  });
  // ---- The bottom bar: ◀ ▶ through your Mochi, and (yours) what it wears.
  const list = (world.char.garden?.mochi ?? []).filter((r) => r.stage !== 'egg');
  const at = list.indexOf(rec);
  const wy = win.y + H - 24;
  if (at >= 0 && list.length > 1) {
    if (button(ui, x, wy, 24, 16, '◀', { size: 8 })) world.mochiInfo = list[(at + list.length - 1) % list.length];
    text(ctx, `${at + 1} / ${list.length}`, x + 42, wy + 11, { size: 7, bold: true, align: 'center', color: COLORS.muted });
    if (button(ui, x + 60, wy, 24, 16, '▶', { size: 8 })) world.mochiInfo = list[(at + 1) % list.length];
  }
  // (The album: everything your Mochi have been.)
  if (at >= 0 && button(ui, x + 90, wy, 50, 16, 'Album', { size: 7, iconName: 'book' })) Object.assign(state.windows.album, { open: true, openedAt: performance.now() / 1000 });
  if (at >= 0) {
    const won = Object.keys(DRESS).filter((id) => dressOpen(world.char, id));
    const options = [null, ...won];
    const now = options.indexOf(rec.dress ?? null);
    const dx = x + W - 20 - 178;
    icon(ctx, 'hanger', dx + 5, wy + 8, 9, '#a8467a');
    text(ctx, 'Wears', dx + 13, wy + 11, { size: 7, bold: true, color: '#a8467a' });
    if (button(ui, dx + 44, wy, 18, 16, '◀', { size: 7.5 })) rec.dress = options[(Math.max(0, now) + options.length - 1) % options.length];
    text(ctx, fit(ctx, DRESS[rec.dress]?.name ?? 'Nothing', 82, 7, true), dx + 107, wy + 11, { size: 7, bold: true, align: 'center', color: rec.dress ? '#d0507a' : COLORS.muted });
    if (button(ui, dx + 152, wy, 18, 16, '▶', { size: 7.5 })) rec.dress = options[(Math.max(0, now) + 1) % options.length];
    if (hover(ui, dx, wy, 44, 16)) tooltip(ui, [{ text: `Costumes: ${won.length} of ${Object.keys(DRESS).length}`, bold: true }, ...Object.keys(DRESS).filter((id) => !dressOpen(world.char, id)).map((id) => ({ text: DRESS[id].stage ? `${DRESS[id].name}: win ${RACE_STAGES[DRESS[id].stage].name} (Beginner)` : `${DRESS[id].name}: from Kinako's shop${DRESS[id].secret ? ', after dark' : ''}`, color: COLORS.muted }))]);
  }
}
