// The Mochi window (docs/design/mochi.md step 8): one page per Mochi. Its portrait, name, stage and
// path, form, generation and age, rarity and coat; its five stats (grade, level, points, how far to
// the next level, and the way it moves now); who it is (personality, the sweet it loves and the one
// it hates, its voice); how it feels (mood, bond, tummy) and which way it leans; what it's growing
// into, while a Mochiko; its tricks; its race medals; its parents, if it was bred. Opened from its care panel (or, for the one
// picked, the race board): ◀ ▶ go through the rest of your Mochi.

import { STAGES, STATS } from '../data/mochi-genes.js';
import { MOCHI_SWEETS, TRICKS, trendOf, leanOf, expToNext } from '../data/mochi-raise.js';
import { RACE_STAGES, RANK_ORDER, MEDAL_COLOR, medalKey } from '../data/mochi-race.js';
import { drawMochiAnim, GAITS, SWIMS, FLIES, CLIMBS, STAMINAS, runStyle } from '../render/mochi-anim.js';
import { COLORS, windowFrame, text, box, button, bar, hover, tooltip, fit } from './kit.js';

const W = 320;
const H = 244;
const STAT_WORD = { run: 'Run', fly: 'Fly', power: 'Power', stamina: 'Stamina', swim: 'Swim' };
const STYLE_OF = { run: GAITS, fly: FLIES, power: CLIMBS, stamina: STAMINAS, swim: SWIMS };
const GRADE_COLOR = { E: '#9a9aa8', D: '#6fae6a', C: '#4a9ad0', B: '#9a6ad8', A: '#e08a3a', S: '#e8485e' };
const RARITY_COLOR = { common: '#9a9aa8', uncommon: '#5aae6a', rare: '#4a8ad8', epic: '#9a5ad8', legendary: '#e0902a', mythic: '#e8508a', mutation: '#3a8a8a' };
const COAT = { goma: 'Black Sesame', kurozato: 'Brown Sugar', yoru: 'Midnight', beniume: 'Red Plum', shinkai: 'Deep Sea', kohakutou: 'Kohakutou', moonlit: 'Moonlit', hanabi: 'Hanabi', candied: 'Candied', goldleaf: 'Gold Leaf', glassjelly: 'Glass Jelly', sakura: 'Sakura Storm', twoflavour: 'Two-Flavour', shiny: 'Shiny' };
const FORM = { run: 'Swift', fly: 'Sky', power: 'Strong', stamina: 'Steady', swim: 'Tide', plain: 'Plain', moon: 'Moon' };
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const sweetName = (kind) => MOCHI_SWEETS.find((s) => s.kind === kind)?.name ?? cap(kind ?? '');
const coatName = (rec) => (rec.coat === 'radiant' ? (rec.path === 'angel' ? 'Halo Dawn' : rec.path === 'demon' ? 'Ember Spice' : 'Radiant') : COAT[rec.coat] ?? null);
const ageOf = (secs) => {
  const m = Math.floor((secs ?? 0) / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} m` : `${m} m`;
};
const portraits = new WeakMap();
const portraitOf = (rec) => {
  if (!portraits.has(rec)) portraits.set(rec, { genes: rec, dir: 1, speed: 0, dist: 0 });
  const m = portraits.get(rec);
  m.size = rec.stage === 'mochiko' ? 'baby' : 'grown';
  return m;
};

export function mochiInfoWindow(ui, state, world) {
  const win = state.windows.mochiinfo;
  const rec = world.mochiInfo;
  if (!rec) {
    win.open = false;
    return;
  }
  const title = rec.name ?? `${cap(rec.personality)} ${STAGES[rec.stage] ?? 'Mochi'}`;
  if (!windowFrame(ui, win, W, H, title)) {
    if (!win.open) world.mochiInfo = null;
    return;
  }
  const { ctx } = ui;
  const x = win.x + 10;
  const y = win.y + 28;
  // ---- Left: its portrait (twice its size), and what it is.
  box(ctx, x, y, 92, 96, { fill: '#fff4f8', edge: '#ffc2d4', r: 10, width: 1 });
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, y + 1, 90, 94);
  ctx.clip();
  ctx.translate(x + 46, y + 90);
  ctx.scale(2, 2);
  drawMochiAnim(ctx, portraitOf(rec), 0, 0, world.now);
  ctx.restore();
  let ly = y + 108;
  const line = (s, opts = {}) => {
    text(ctx, fit(ctx, s, 92, opts.size ?? 6.5, Boolean(opts.bold)), x, ly, { size: 6.5, color: COLORS.muted, ...opts });
    ly += 10;
  };
  line(`${STAGES[rec.stage] ?? 'Mochi'}${rec.path ? ` · ${rec.path === 'angel' ? 'angel' : 'devil'} path` : ''}`, { size: 7.5, bold: true, color: COLORS.ink });
  if (rec.form) line(`${FORM[rec.form] ?? cap(rec.form)} form`);
  line(`Generation ${rec.gen ?? 1} · ${ageOf(rec.age)} old`);
  line(cap(rec.rarity ?? 'common'), { bold: true, color: RARITY_COLOR[rec.rarity] ?? COLORS.muted });
  if (coatName(rec)) line(`${coatName(rec)} coat`, { color: RARITY_COLOR[rec.rarity] ?? COLORS.muted });
  if (rec.parents?.length === 2) line(`Parents: ${rec.parents.map((p) => p.name ?? 'a Mochi').join(' & ')}`);
  if (rec.bloom > 0) line('In bloom!', { color: '#ff6f9a', bold: true });
  else if (rec.bredRest > 0) line('Resting after an egg');
  // ---- Right: its stats.
  const rx = x + 102;
  const rw = W - 122;
  let ry = y;
  text(ctx, 'Stats', rx, ry + 6, { size: 7, bold: true, color: COLORS.muted });
  ry += 10;
  for (const st of STATS) {
    const s = rec.stats[st];
    const style = STYLE_OF[st][runStyle(s.points)]?.name ?? '';
    text(ctx, STAT_WORD[st], rx, ry + 8, { size: 7, bold: true });
    text(ctx, s.grade, rx + 46, ry + 8, { size: 8, bold: true, align: 'center', color: GRADE_COLOR[s.grade] ?? COLORS.muted });
    text(ctx, `Lv ${s.level}`, rx + 58, ry + 8, { size: 7 });
    box(ctx, rx + 86, ry + 3, 60, 5, { fill: '#f3e6ee', edge: null, r: 2.5 });
    box(ctx, rx + 86, ry + 3, Math.max(2, 60 * Math.min(1, (s.exp ?? 0) / expToNext(s.level))), 5, { fill: GRADE_COLOR[s.grade] ?? '#ff8fb0', edge: null, r: 2.5 });
    text(ctx, fit(ctx, style, rw - 152, 6, false), rx + rw, ry + 8, { size: 6, align: 'right', color: COLORS.muted });
    if (hover(ui, rx, ry, rw, 11)) tooltip(ui, [{ text: `${STAT_WORD[st]}: grade ${s.grade}, Lv ${s.level}`, bold: true }, { text: `${s.points} points · ${style}`, color: COLORS.muted }]);
    ry += 12;
  }
  // Who it is.
  ry += 4;
  text(ctx, `${cap(rec.personality)} · loves ${sweetName(rec.loves)} · hates ${sweetName(rec.hates)}`, rx, ry + 6, { size: 6.5 });
  if (rec.voice) text(ctx, `Voice: a ${rec.voice.pitch > 1.1 ? 'high' : rec.voice.pitch < 0.9 ? 'low' : 'soft'} ${rec.voice.style}`, rx, ry + 16, { size: 6.5, color: COLORS.muted });
  ry += 22;
  // How it feels, and which way it leans.
  const bw = (rw - 8) / 3;
  bar(ctx, rx, ry, bw, 8, (rec.mood ?? 0) / 100, '#ff8fb0', 'Mood', { size: 5.5 });
  bar(ctx, rx + bw + 4, ry, bw, 8, Math.min(1, (rec.bond ?? 0) / 1000), '#f0b53a', 'Bond', { size: 5.5 });
  bar(ctx, rx + (bw + 4) * 2, ry, bw, 8, (rec.tummy ?? 0) / 100, '#f0a070', 'Tummy', { size: 5.5 });
  ry += 13;
  const lean = Math.max(-1, Math.min(1, rec.lean ?? 0));
  text(ctx, 'Devil', rx, ry + 6, { size: 6, color: '#a0508a' });
  text(ctx, 'Angel', rx + rw, ry + 6, { size: 6, align: 'right', color: '#c8a020' });
  box(ctx, rx + 26, ry + 2, rw - 54, 4, { fill: '#f3e6ee', edge: null, r: 2 });
  ctx.fillStyle = lean >= 0 ? '#f2c94c' : '#b05aa0';
  ctx.beginPath();
  ctx.arc(rx + 26 + (rw - 54) * (lean + 1) / 2, ry + 4, 3, 0, Math.PI * 2);
  ctx.fill();
  const leaning = leanOf(rec);
  ry += 12;
  // What it's growing into (a Mochiko), its tricks.
  if (rec.stage === 'mochiko') {
    const tr = trendOf(rec);
    text(ctx, tr ? (tr.plain ? 'Growing up evenly: the Plain form' : `Growing into the ${FORM[tr.stat]} form (${STAT_WORD[tr.stat]} ${Math.round(tr.share * 100)}% lately)`) : 'Not growing into anything yet', rx, ry + 6, { size: 6.5 });
    if (leaning) text(ctx, `Leaning ${leaning === 'angel' ? 'angel' : 'devil'}`, rx + rw, ry + 6, { size: 6, align: 'right', color: leaning === 'angel' ? '#c8a020' : '#a0508a' });
    ry += 10;
  }
  const tricks = rec.tricks ?? [];
  text(ctx, `Tricks: ${tricks.length} of ${TRICKS.length}`, rx, ry + 6, { size: 6.5, bold: true });
  if (tricks.length && hover(ui, rx, ry, 80, 10)) tooltip(ui, [{ text: 'Tricks', bold: true }, { text: tricks.map(cap).join(', '), color: COLORS.muted }]);
  ry += 12;
  // Its race medals: a row of three (Beginner, Challenge, Master) per stage.
  text(ctx, 'Medals', rx, ry + 6, { size: 6.5, bold: true });
  Object.keys(RACE_STAGES).forEach((id, i) => {
    const mx = rx + 34 + i * 28;
    RANK_ORDER.forEach((rk, k) => {
      const medal = rec.medals?.[medalKey(id, rk)];
      ctx.beginPath();
      ctx.arc(mx + k * 7, ry + 4, 2.6, 0, Math.PI * 2);
      if (medal) {
        ctx.fillStyle = MEDAL_COLOR[medal];
        ctx.fill();
      } else {
        ctx.strokeStyle = '#e8d8e0';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
    if (hover(ui, mx - 4, ry - 1, 24, 10)) tooltip(ui, [{ text: RACE_STAGES[id].name, bold: true }, { text: RANK_ORDER.map((rk) => `${rk}: ${rec.medals?.[medalKey(id, rk)] ?? '-'}`).join(' · '), color: COLORS.muted }]);
  });
  // ◀ ▶: the rest of your Mochi.
  const list = (world.char.garden?.mochi ?? []).filter((r) => r.stage !== 'egg');
  const at = list.indexOf(rec);
  if (at >= 0 && list.length > 1) {
    if (button(ui, x, win.y + H - 22, 24, 15, '◀', { size: 8 })) world.mochiInfo = list[(at + list.length - 1) % list.length];
    if (button(ui, x + 68, win.y + H - 22, 24, 15, '▶', { size: 8 })) world.mochiInfo = list[(at + 1) % list.length];
    text(ctx, `${at + 1} / ${list.length}`, x + 46, win.y + H - 11, { size: 6.5, align: 'center', color: COLORS.muted });
  }
}
