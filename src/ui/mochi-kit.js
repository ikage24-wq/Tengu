// The pieces every Mochi window is built from (the care panel, the Mochi page, the Mochi window, the
// race board and its results, naming, the egg stall): a portrait card (the Mochi itself, alive,
// standing in a little garden scene, framed like a photo), grade badges, a stat row (its icon,
// grade, level and how far to the next, the way it moves now), a feeling meter (mood, bond,
// tummy), and little tags (stage, path, rarity). One look for all of them.

import { drawMochiAnim, GAITS, SWIMS, FLIES, CLIMBS, STAMINAS, runStyle } from '../render/mochi-anim.js';
import { expToNext } from '../data/mochi-raise.js';
import { COLORS, text, fit, icon, roundRect, photoCorners, hover, tooltip } from './kit.js';

export const STAT_ORDER = ['run', 'fly', 'power', 'stamina', 'swim'];
export const STAT_INFO = {
  run: { name: 'Run', icon: 'gust', color: '#ff9e5e' },
  fly: { name: 'Fly', icon: 'feather', color: '#7fb0f0' },
  power: { name: 'Power', icon: 'hammer', color: '#f0708a' },
  stamina: { name: 'Stamina', icon: 'leaf', color: '#62c072' },
  swim: { name: 'Swim', icon: 'drop', color: '#3fa8dc' },
};
export const GRADE_COLOR = { E: '#a8a8b8', D: '#6fbe72', C: '#4a9ad8', B: '#9a6ad8', A: '#f08a3a', S: '#ef4f6e' };
export const RARITY_COLOR = { common: '#a8a8b8', uncommon: '#5aae6a', rare: '#4a8ad8', epic: '#9a5ad8', legendary: '#e0902a', mythic: '#e8508a', mutation: '#2f9a9a' };
const STYLE_OF = { run: GAITS, fly: FLIES, power: CLIMBS, stamina: STAMINAS, swim: SWIMS };
export const styleName = (st, points) => STYLE_OF[st][runStyle(points)]?.name ?? '';
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');

// Its portrait: one animation state a Mochi keeps for every window.
const portraits = new WeakMap();
export function portraitOf(rec) {
  if (!portraits.has(rec)) portraits.set(rec, { genes: rec, dir: 1, speed: 0, dist: 0, easy: true });
  const m = portraits.get(rec);
  m.genes = rec;
  m.size = rec.stage === 'mochiko' || rec.stage === 'egg' ? 'baby' : 'grown';
  return m;
}

// A portrait card at (x, y), `w` by `h`: a white photo card with a soft shadow, and in it the Mochi
// standing on the grass of a little garden scene (a pink sky, two soft hills, a flower or two),
// `scale` times its size (`drop` lowers it, for a close-up), in photo corners; a rare one gets a
// ribbon of its rarity (unless `ribbon` is false).
export function portraitCard(ctx, rec, x, y, w, h, time, { scale = 2, edge = '#ffb3cf', drop = 0, ribbon = true } = {}) {
  ctx.save();
  ctx.fillStyle = 'rgba(70,40,90,0.14)';
  roundRect(ctx, x + 1.5, y + 2.5, w, h, 9);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x, y, w, h, 9);
  ctx.fill();
  const ix = x + 4;
  const iy = y + 4;
  const iw = w - 8;
  const ih = h - 8;
  roundRect(ctx, ix, iy, iw, ih, 6);
  ctx.clip();
  const g = ctx.createLinearGradient(0, iy, 0, iy + ih);
  g.addColorStop(0, '#ffdcea');
  g.addColorStop(0.55, '#fff2ea');
  g.addColorStop(1, '#fff8ee');
  ctx.fillStyle = g;
  ctx.fillRect(ix, iy, iw, ih);
  const gy = iy + ih - 13;
  ctx.fillStyle = '#d6efcc';
  ctx.beginPath();
  ctx.ellipse(ix + iw * 0.26, gy + 4, iw * 0.55, ih * 0.2, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c4e6b4';
  ctx.beginPath();
  ctx.ellipse(ix + iw * 0.86, gy + 5, iw * 0.46, ih * 0.16, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a4dc8e';
  ctx.fillRect(ix, gy, iw, 20);
  ctx.fillStyle = '#c2eaa6';
  ctx.fillRect(ix, gy, iw, 2);
  for (const [fx, c] of [[0.1, '#ffb3c8'], [0.9, '#fff0a0'], [0.78, '#ffffff'], [0.2, '#ffffff']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(ix + iw * fx, gy + 4, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.translate(ix + iw / 2, gy + 3 + drop);
  ctx.scale(scale, scale);
  drawMochiAnim(ctx, portraitOf(rec), 0, 0, time);
  ctx.restore();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.2;
  roundRect(ctx, ix, iy, iw, ih, 6);
  ctx.stroke();
  photoCorners(ctx, ix - 1, iy - 1, iw + 2, ih + 2, edge, 7);
  const rar = rec.rarity && rec.rarity !== 'common' ? rec.rarity : null;
  if (rar && ribbon) tag(ctx, cap(rar), x + w - 4, y + 9, RARITY_COLOR[rar], { align: 'right' });
}

// A little rounded tag: white words on `color` (or `ink` on a light fill), at (x, y) its middle row.
export function tag(ctx, words, x, y, color, { align = 'left', size = 6.5, fill = null, ink = '#ffffff' } = {}) {
  ctx.font = `800 ${size}px Nunito, "Trebuchet MS", system-ui, sans-serif`;
  const w = ctx.measureText(words).width + 10;
  const tx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  ctx.fillStyle = fill ?? color;
  roundRect(ctx, tx, y - 6, w, 12, 6);
  ctx.fill();
  text(ctx, words, tx + w / 2, y + 2.4, { size, bold: true, align: 'center', color: ink });
  return w;
}

// A grade badge: a round sticker in the grade's colour with its letter.
export function gradeBadge(ctx, x, y, grade, r = 5.5) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r + 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = GRADE_COLOR[grade] ?? COLORS.muted;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, grade, x, y + r * 0.55, { size: r * 1.55, bold: true, align: 'center', color: '#ffffff' });
}

// A stat's little icon on a round plate of its colour.
export function statIcon(ctx, st, x, y, r = 5.5) {
  const info = STAT_INFO[st];
  ctx.fillStyle = info.color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  icon(ctx, info.icon, x, y, r * 1.3, '#ffffff');
}

// A stat row at (x, y), `w` wide, 14 tall: its icon and name, its grade badge and level, a bar to
// the next level in its colour, and (if `style`) the way it moves now. Hover: its points.
export function statRow(ui, x, y, w, rec, st, { style = true } = {}) {
  const { ctx } = ui;
  const s = rec.stats[st];
  const info = STAT_INFO[st];
  statIcon(ctx, st, x + 6, y + 7);
  text(ctx, info.name, x + 15, y + 9.6, { size: 7, bold: true });
  gradeBadge(ctx, x + 58, y + 7, s.grade, 5);
  text(ctx, `Lv ${s.level}`, x + 67, y + 9.6, { size: 7, bold: true, color: COLORS.ink });
  const bx = x + 90;
  const bw = Math.max(20, w - 90 - (style ? 62 : 2));
  const k = s.level >= 99 ? 1 : Math.min(1, (s.exp ?? 0) / expToNext(s.level));
  ctx.fillStyle = '#f4e8ef';
  roundRect(ctx, bx, y + 4.5, bw, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = info.color;
  roundRect(ctx, bx, y + 4.5, Math.max(4, bw * k), 5, 2.5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(bx + 2, y + 5, Math.max(0, bw * k - 4), 1);
  if (style) text(ctx, fit(ctx, styleName(st, s.points), 58, 6, false), x + w, y + 9.4, { size: 6, align: 'right', color: COLORS.muted });
  if (hover(ui, x, y, w, 14)) tooltip(ui, [{ text: `${info.name}: grade ${s.grade}, Lv ${s.level}`, bold: true }, { text: `${s.points.toLocaleString()} points · moves: ${styleName(st, s.points)}`, color: COLORS.muted }, { text: s.level >= 99 ? 'Top level' : `${Math.round(k * 100)}% to Lv ${s.level + 1}`, color: COLORS.muted }]);
}

// How it feels: mood (0-100), bond (0-1000), tummy (0-100, `hungry`), as a little meter: an icon,
// its name, a pill bar, the number.
const FEEL = {
  mood: { name: 'Mood', icon: 'heart', color: '#ff7aa8', max: 100 },
  bond: { name: 'Bond', icon: 'star', color: '#f0b53a', max: 1000 },
  tummy: { name: 'Tummy', icon: 'gift', color: '#f09a6a', max: 100 },
};
export function feelMeter(ui, x, y, w, kind, value, { hungry = false } = {}) {
  const { ctx } = ui;
  const f = FEEL[kind];
  const color = hungry ? '#e8485e' : f.color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 5.5, y + 5.5, 5.5, 0, Math.PI * 2);
  ctx.fill();
  icon(ctx, f.icon, x + 5.5, y + 5.5, 7, '#ffffff');
  const k = Math.max(0, Math.min(1, (value ?? 0) / f.max));
  const bx = x + 14;
  const bw = w - 14;
  ctx.fillStyle = '#f4e8ef';
  roundRect(ctx, bx, y + 2.5, bw, 6, 3);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, bx, y + 2.5, Math.max(5, bw * k), 6, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(bx + 2, y + 3.2, Math.max(0, bw * k - 4), 1);
  if (hover(ui, x, y, w, 11)) tooltip(ui, [{ text: hungry ? 'Hungry!' : f.name, bold: true }, { text: `${Math.round(value ?? 0)} of ${f.max}`, color: COLORS.muted }]);
}

// A section heading: a small coloured dot and the words, with a soft rule after them.
export function heading(ctx, words, x, y, w, color = '#e0659f') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 2.5, y + 3.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, words, x + 8, y + 6, { size: 7, bold: true, color: '#a8467a' });
  ctx.font = '800 7px Nunito, "Trebuchet MS", system-ui, sans-serif';
  const tw = ctx.measureText(words).width;
  ctx.fillStyle = '#f6dce8';
  ctx.fillRect(x + 12 + tw, y + 3.5, Math.max(0, w - 12 - tw), 1);
}
