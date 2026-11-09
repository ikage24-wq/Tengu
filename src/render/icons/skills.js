// Hand-drawn 16x16 skill icons, one per skill. Each is a framed, rounded tile: a bevelled rim
// (pearl for actives, gold for buffs, silver with studs for passives), a banded gradient in the
// colors of the skill's job, spell school, or role (heals blue, wards green, blessings rose), so
// no two in a book share a hue, and a bold central motif lit from the top left, inked, and
// glinting. Built with the item icons' kit so both share one look. `SKILL_ART[id]()` returns the
// shapes; icons.js draws them at res 3.

import { shade, mix } from '../pixel.js';
import { hi, lt, sh, dk, ink, S, oval, arcPts, bez, bez3, rect, clip, cut, ball, tube, line, bevel, twinkle, glint, leaf, turn, W, GOLD, D2R } from './items.js';
import { SKILLS } from '../../data/skills.js';

// ---------- The tile ----------

// Background bands, top to bottom: [light, deep].
const BG = {
  sakura: ['#ffc4dc', '#d94f8c'],
  // The Mage's: deep crimson, so her orange fire, pale ice and yellow lightning all stand out.
  magecrimson: ['#ff9aae', '#5e1634'],
  // The Sorcerer's: violet to the deep dark, so her ember flame and claws burn on it.
  sorcery: ['#b48aff', '#24123a'],
  // The Cleric's: warm white to gold.
  clericgold: ['#fffbe8', '#d8902e'],
  crimson: ['#ffa07e', '#a8304a'],
  ember: ['#ffd27a', '#c8452e'],
  steel: ['#b4ccf4', '#3f55a0'],
  arcane: ['#d2a8ff', '#5a33a3'],
  mint: ['#c4f5b4', '#2f9468'],
  holy: ['#fff0a0', '#d6802a'],
  wind: ['#b4f5d4', '#1f8a78'],
  sky: ['#c8ecff', '#2f8a8a'],
  shadow: ['#a594f0', '#26205e'],
  dusk: ['#f0a8e0', '#3a2470'],
  ice: ['#c4f0ff', '#2a74c8'],
  glacier: ['#8fd4ff', '#1c3a8c'],
  storm: ['#9ec4ff', '#2c2f86'],
  fire: ['#ffd074', '#c83224'],
  poison: ['#d4f594', '#4f3196'],
  dawn: ['#fff4c0', '#e0703a'],
  royal: ['#8a78e0', '#1a1440'],
  seraph: ['#ffd2ec', '#9a3f9e'],
  hawk: ['#fff0a8', '#d8802a'],
  skyblue: ['#cdeeff', '#3a74d0'],
  blood: ['#ffa0b4', '#5a0e24'],
  indigo: ['#b8bcff', '#1e1a5e'],
  tempest: ['#cdb4ff', '#262a7e'],
  skydance: ['#e6f6ff', '#3f7ad0'],
  midnight: ['#8a96e8', '#141a4a'],
  brassbg: ['#ffe6a8', '#5a3818'],
  rosegold: ['#ffe0cf', '#a8405a'],
  coral: ['#ffcdb6', '#c23c48'],
  shrine: ['#f6f0ff', '#5a46a8'],
  idolbg: ['#ffe0f0', '#a83a7a'],
  acro: ['#d8fff0', '#1f8a6a'],
  phantom: ['#f2dcf6', '#4a1a5a'],
  lullbg: ['#f4e4ff', '#5a3a9a'],
  astral: ['#c8b8ff', '#24186a'],
};

const FRAME = { active: '#fff0f6', buff: '#ffd25a', passive: '#d4cdee' };

function rrect(x, y, w, h, r, n = 6) {
  const cs = [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]];
  return cs.flatMap(([cx, cy, a]) => arcPts(cx, cy, r, r, a, a + 90, n));
}
const OUTER = rrect(0, 0, 16, 16, 3.4);
const INNER = rrect(0.95, 0.95, 14.1, 14.1, 2.5);
// (The icon redraw: the frame's shape says what kind of skill it is, readable at a glance. Attacks
// keep the rounded square, passives are round, buffs have their corners cut like a gem.)
const circle = (cx, cy, r, n = 28) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2 - Math.PI / 2) * r, cy + Math.sin((i / n) * Math.PI * 2 - Math.PI / 2) * r]);
const chamfer = (x, y, w, h, c) => [[x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c]];
const SHAPES = {
  active: [OUTER, INNER],
  passive: [circle(8, 8, 8), circle(8, 8, 7.05)],
  buff: [chamfer(0, 0, 16, 16, 3.6), chamfer(0.95, 0.95, 14.1, 14.1, 3.1)],
};
let curOuter = OUTER;
let curInner = INNER;
const inTile = (pts) => clip(pts, curInner);

// The tile being drawn: its tones, for glows and drop shadows.
let cur = null;

function tile(bg, kind) {
  const [top, deep] = BG[bg];
  cur = { top, deep, mid: mix(top, deep, 0.5), shadow: mix(deep, '#1c1230', 0.3), kind };
  [curOuter, curInner] = SHAPES[kind] ?? SHAPES.active;
  // The rim takes a little of the job's own colour (the tile's deep tone), so a bar of one job's
  // skills reads as a set.
  const out = bevel(curOuter, curInner, mix(FRAME[kind], deep, 0.3));
  const n = 10;
  for (let i = 0; i < n; i++) {
    const y = 0.9 + (i * 14.2) / n;
    out.push(S(inTile(rect(-1, y, 18, 14.2 / n + 0.06)), mix(top, deep, Math.pow(i / (n - 1), 1.15))));
  }
  // A soft sheen across the upper left, and a darker floor.
  out.push(S(inTile([[0, 0], [9.5, 0], [0, 9.5]]), mix(top, '#ffffff', 0.18)));
  out.push(S(inTile([[0, 0], [5, 0], [0, 5]]), mix(top, '#ffffff', 0.3)));
  out.push(S(inTile(rect(-1, 13.6, 18, 4)), mix(deep, '#1c1230', 0.12)));
  if (kind === 'passive') {
    // Four studs round the ring.
    for (const [x, y] of [[8, 0.5], [15.5, 8], [8, 15.5], [0.5, 8]]) out.push(S(oval(x, y, 0.85, 0.85, 0, 12), '#8f86b8'), S(oval(x - 0.15, y - 0.15, 0.55, 0.55, 0, 12), '#f4f0ff'));
  }
  if (kind === 'buff') {
    // Gold caps on the cut corners.
    for (const [x, y] of [[1.8, 1.8], [14.2, 1.8], [14.2, 14.2], [1.8, 14.2]]) out.push(S(oval(x, y, 0.9, 0.9, 0, 12), '#ffe9a0'));
  }
  return out;
}

// A radial glow behind the motif, blending from the tile toward `c`.
function aura(cx, cy, r, c, k = 1, rings = 4) {
  return Array.from({ length: rings }, (_, i) => {
    const f = 1 - i / rings;
    return S(inTile(oval(cx, cy, r * f, r * f, 0, 28)), mix(cur.mid, c, Math.min(1, (0.22 + 0.2 * i) * k)));
  });
}

// ---------- Drawing kit ----------

const N = (a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
};
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const along = (o, u, n) => (a, b = 0) => [o[0] + u[0] * a + n[0] * b, o[1] + u[1] * a + n[1] * b];
// Rotates finished shapes about (cx, cy), for tilting a whole motif.
const spin = (shapes, deg, cx = 8, cy = 8) => shapes.map((s) => (s ? { ...s, pts: turn(s.pts, deg, cx, cy) } : s));
const move = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);

// Inked edge: the silhouette stamped around itself in the outline color.
const RING = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)]);
const edge = (pts, c, d = 0.5) => RING.map(([dx, dy]) => S(move(pts, dx * d, dy * d), c));
const drop = (pts, k = 1) => S(move(pts, 0.7 * k, 0.9 * k), cur.shadow);

// A solid part: drop shadow on the tile, an inked edge, and a lit rounded fill.
function solid(pts, c, o = {}) {
  return [o.shadow === false ? null : drop(pts, o.drop ?? 1), ...edge(pts, o.ink ?? ink(c), o.d ?? 0.5), ...(o.flat ? [S(pts, c)] : ball(pts, c, { k: o.k ?? 1, glow: o.glow ?? 1, light: o.light ?? lt(c) }))];
}
// A cut gem / blade face: lit side and shadow side split along a -> b.
function facet(pts, a, b, c, o = {}) {
  return [o.shadow === false ? null : drop(pts), ...edge(pts, o.ink ?? ink(c), o.d ?? 0.5), S(pts, lt(c)), S(cut(pts, a, b), o.dark ?? sh(c))];
}
// A blob of overlapping discs, inked and shaded as one mass (clouds, smoke).
function puffs(list, c, o = {}) {
  const out = [];
  if (o.shadow !== false) out.push(...list.map(([x, y, r]) => drop(oval(x, y, r, r, 0, 20))));
  out.push(...list.flatMap(([x, y, r]) => edge(oval(x, y, r, r, 0, 20), o.ink ?? ink(c), 0.5)));
  out.push(...list.map(([x, y, r]) => S(oval(x, y, r, r, 0, 20), o.dark ?? sh(c))));
  out.push(...list.map(([x, y, r]) => S(oval(x - r * 0.18, y - r * 0.22, r * 0.82, r * 0.78, 0, 20), c)));
  out.push(...list.map(([x, y, r]) => S(oval(x - r * 0.36, y - r * 0.42, r * 0.42, r * 0.36, 0, 14), o.light ?? lt(c))));
  return out;
}

function starPts(cx, cy, R, r, n = 5, rot = -90) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = (rot + (i * 180) / n) * D2R;
    const k = i % 2 ? r : R;
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k];
  });
}
function heartPts(cx, cy, s, n = 36) {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return [cx + (x * s) / 16, cy + (y * s) / 16];
  });
}
function polyPts(cx, cy, r, n, rot = -90, sy = 1) {
  return Array.from({ length: n }, (_, i) => {
    const a = (rot + (i * 360) / n) * D2R;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * sy];
  });
}

// A tapered streak from a (thin) to b (thick): motion lines, trails.
const streak = (a, b, w, c) => S(tube([a, b], 0.12, w), c);
// A crescent swoosh along an arc, fat in the middle, with a white edge on its leading side.
function swoosh(cx, cy, rx, ry, a0, a1, w, c, o = {}) {
  const pts = arcPts(cx, cy, rx, ry, a0, a1, 22).map(([x, y]) => turn([[x, y]], o.rot ?? 0, cx, cy)[0]);
  const fat = (t) => w * Math.pow(Math.sin(Math.PI * Math.pow(t, o.skew ?? 1)), 0.75);
  const body = tube(pts, fat);
  const core = tube(arcPts(cx, cy, rx + w * 0.22, ry + w * 0.22, a0 + (a1 - a0) * 0.12, a1 - (a1 - a0) * 0.04, 20).map(([x, y]) => turn([[x, y]], o.rot ?? 0, cx, cy)[0]), (t) => fat(0.12 + t * 0.84) * 0.42);
  return [...(o.ink === false ? [] : edge(body, o.ink ?? ink(c), 0.4)), S(body, c), S(core, o.core ?? W)];
}

// A sword from the guard (base) to the tip.
function sword(base, tip, o = {}) {
  const { w = 2.2, metal = '#e8eefa', guard = GOLD, grip = '#6a4a8a', glen = 2.8, gw = 3.6, gem = '#ff6b8a' } = o;
  const u = N(base, tip);
  const n = [-u[1], u[0]];
  const p = along(base, u, n);
  const len = Math.hypot(tip[0] - base[0], tip[1] - base[1]);
  const sl = len - w * 1.1;
  const blade = [p(0, w / 2), p(sl, w / 2), p(len, 0), p(sl, -w / 2), p(0, -w / 2)];
  const litSide = n[0] * -0.6 + n[1] * -0.8 > 0 ? 1 : -1;
  const lit = [p(0, 0), p(0, (litSide * w) / 2), p(sl, (litSide * w) / 2), p(len, 0)];
  const out = [];
  if (o.shadow !== false) out.push(drop(blade), drop(tube([p(-glen - 0.6), p(0)], 1.2)));
  const gripPts = tube([p(-glen), p(0)], 1.15);
  out.push(...edge(gripPts, ink(grip), 0.45), S(gripPts, grip));
  for (let k = 0.7; k < glen; k += 0.9) out.push(line([p(-k, -0.55), p(-k - 0.45, 0.55)], 0.3, lt(grip)));
  const pom = oval(...p(-glen - 0.35), 0.95, 0.95, 0, 14);
  out.push(...edge(pom, ink(guard), 0.45), ...ball(pom, guard));
  out.push(...edge(blade, ink(metal), 0.5), S(blade, sh(metal)), S(lit, lt(metal)));
  out.push(S(tube([p(0.6, litSide * w * 0.28), p(sl - 0.2, litSide * w * 0.14), p(len - 0.5, 0)], 0.32, 0.1), W));
  out.push(S(tube([p(0.4, 0), p(sl * 0.8, 0)], 0.25), shade(sh(metal), -8)));
  const g = tube([p(0, gw / 2), p(-0.2, 0), p(0, -gw / 2)], 1.25);
  out.push(...edge(g, ink(guard), 0.45), ...ball(g, guard), S(oval(...p(-0.15, 0), 0.6, 0.6, 0, 12), gem));
  return out;
}

// An arrow from the tail (fletching) to the tip.
function arrow(tail, tip, o = {}) {
  const { shaft = '#f6e2c0', head = '#eef3ff', fl = '#ff8fb0', hw = 1.45, hl = 2.3, sw = 0.62, shadow = true } = o;
  const u = N(tail, tip);
  const n = [-u[1], u[0]];
  const len = Math.hypot(tip[0] - tail[0], tip[1] - tail[1]);
  const p = along(tail, u, n);
  const sh0 = tube([p(0.2), p(len - hl + 0.3)], sw);
  const hd = [p(len, 0), p(len - hl, hw), p(len - hl + 0.55, 0), p(len - hl, -hw)];
  const f1 = [p(2.4, 0), p(1, 1.35), p(-0.3, 1.35), p(0.6, 0)];
  const f2 = [p(2.4, 0), p(1, -1.35), p(-0.3, -1.35), p(0.6, 0)];
  const out = [];
  if (shadow) out.push(drop(sh0), drop(hd), drop(f1), drop(f2));
  for (const f of [f1, f2]) out.push(...edge(f, ink(fl), 0.4));
  out.push(...edge(sh0, ink(shaft), 0.4), ...edge(hd, ink(head), 0.45));
  out.push(S(sh0, shaft), S(tube([p(0.4, -0.12), p(len - hl, -0.12)], 0.22), lt(shaft)));
  out.push(S(f1, fl), S(f2, sh(fl)), line([p(2.2, 0), p(0, 0)], 0.25, lt(fl)));
  out.push(S(hd, sh(head)), S([p(len, 0), p(len - hl, n[0] * -0.6 + n[1] * -0.8 > 0 ? hw : -hw), p(len - hl + 0.55, 0)], hi(head)));
  return out;
}

// A jagged bolt along a zigzag, fat at the top and thin at the strike.
function bolt(zig, w, c = '#ffe86b', o = {}) {
  const body = tube(zig, (t) => w * (1 - 0.75 * t));
  const core = tube(zig, (t) => w * 0.4 * (1 - 0.8 * t));
  return [o.shadow === false ? null : drop(body), ...edge(body, o.ink ?? ink(c), o.d ?? 0.5), S(body, c), S(move(core, -0.15, -0.1), o.core ?? W)];
}

// A teardrop flame standing on (cx, by), `h` tall, leaning its tip by `lean`.
function flamePts(cx, by, w, h, lean = 0) {
  const r = w / 2;
  const cy = by - r;
  const bottom = arcPts(cx, cy, r, r, 0, 180, 12);
  const left = bez3([cx - r, cy], [cx - r * 1.1, cy - h * 0.38], [cx + lean - r * 0.55, by - h * 0.72], [cx + lean, by - h], 12);
  const right = bez3([cx + lean, by - h], [cx + lean + r * 0.25, by - h * 0.6], [cx + r * 1.15, cy - h * 0.32], [cx + r, cy], 12);
  return [...bottom, ...left.slice(1), ...right.slice(1, -1)];
}
function flame(cx, by, w, h, cols = ['#ff5a3a', '#ffa23c', '#ffe9a0'], o = {}) {
  const lean = o.lean ?? 0;
  const outer = flamePts(cx, by, w, h, lean);
  const out = [o.shadow === false ? null : drop(outer), ...edge(outer, o.ink ?? ink(cols[0]), o.d ?? 0.5), S(outer, cols[0])];
  out.push(S(flamePts(cx + w * 0.04, by - w * 0.06, w * 0.68, h * 0.72, lean * 0.7), cols[1]));
  out.push(S(flamePts(cx + w * 0.06, by - w * 0.1, w * 0.36, h * 0.42, lean * 0.4), cols[2]));
  return out;
}

// A soft white star sparkle with a tiny edge so it reads on light tiles too.
const spark = (x, y, r, c = W) => [twinkle(x + 0.25, y + 0.3, r, mix(cur.mid, cur.deep, 0.5)), twinkle(x, y, r, c)];

// ---------- Novice ----------

function pebble() {
  return [
    ...tile('sakura', 'active'),
    ...aura(10, 7.4, 5.6, '#fff4fa'),
    streak([1.6, 12.6], [7.4, 9], 1.5, '#fff6fb'),
    streak([3, 14.4], [7.6, 10.8], 1, '#ffd6ea'),
    streak([1.4, 9.6], [6.8, 7.8], 0.9, '#ffd6ea'),
    ...solid(oval(10.2, 7.4, 3.9, 3.4, -20, 30), '#6f5cc4', { glow: 1.1, ink: '#2a1a5a' }),
    S(starPts(10.5, 7.7, 2.3, 0.9), '#b8661a'),
    S(starPts(10.3, 7.5, 2, 0.8), '#ffe36b'),
    ...glint(8.4, 5.4, 0.7),
    ...spark(13.8, 2.8, 1.7),
    ...spark(4.4, 3.4, 1.1, '#fff3a6'),
    ...spark(13.4, 12.8, 1),
  ];
}

function cozyrest() {
  const cup = '#fff6ee';
  const body = [...arcPts(8, 8.4, 4.7, 5, 0, 180, 18), [3.3, 8.4]];
  const handle = tube(arcPts(12.4, 10.2, 1.9, 1.8, -80, 100, 12), 1);
  return [
    ...tile('sakura', 'passive'),
    ...aura(8, 9, 6.4, '#ffe8f2'),
    // Heart-shaped steam rising.
    S(tube(bez3([7, 7.6], [5.6, 6.2], [8.4, 5], [7.2, 3.6], 10), 0.7), '#fff3fa'),
    S(tube(bez3([9.2, 7.6], [10.6, 6.2], [8.4, 5], [9.6, 3.8], 10), 0.55), '#ffe0ef'),
    ...solid(heartPts(8.4, 2.9, 2.4), '#ff6b9a', { d: 0.4 }),
    ...glint(7.6, 2.2, 0.4),
    ...solid(oval(8, 13.6, 6.4, 1.45, 0, 28), '#ffd0e4', { k: 0.9 }),
    ...edge(handle, ink(cup), 0.45), S(handle, sh(cup)),
    ...solid(body, cup, { k: 0.85 }),
    S(clip(body, rect(2, 10.4, 12, 1.3)), '#ff8fb8'),
    S(clip(body, rect(2, 10.4, 12, 0.45)), '#ffc0d8'),
    ...edge(oval(8, 8.4, 4.7, 1.3, 0, 24), '#b0587a', 0.3),
    S(oval(8, 8.4, 4.7, 1.3, 0, 24), '#fff6ee'),
    S(oval(8, 8.6, 4, 0.95, 0, 24), '#c98a5a'),
    S(oval(7.4, 8.4, 2, 0.4, 0, 16), '#e6aa76'),
    S(tube(bez([4.4, 9.6], [4.6, 12], [6.4, 12.8], 6), 0.5), W),
  ];
}

function quickstep() {
  const boot = '#7fc8ff';
  const shoe = [[5, 2.8], [9.8, 2.8], [9.8, 7.4], ...bez3([9.8, 7.4], [12.4, 7.8], [14.8, 9], [14.6, 11.6], 10).slice(1), [14, 13.4], [4.8, 13.4], [4.4, 11.4], [5, 8]];
  return [
    ...tile('sakura', 'buff'),
    ...aura(9, 8, 6.4, '#fff4fa'),
    streak([0.9, 9.4], [4.6, 9.4], 1.1, '#fff0f8'),
    streak([1.4, 12], [4.6, 12], 1, '#fff0f8'),
    streak([1.6, 6.8], [4.4, 6.8], 0.7, '#ffe0ef'),
    // A little wing at the heel.
    ...solid([...leaf([5.8, 6.4], [1.4, 1.8], 3, W, { bend: 0.6 }).A, ...leaf([5.8, 6.4], [1.4, 1.8], 3, W, { bend: 0.6 }).B.reverse()], W, { light: W, ink: '#a03a6a', d: 0.4 }),
    ...solid([...leaf([5.8, 7.4], [1.2, 4.6], 2.4, W, { bend: 0.4 }).A, ...leaf([5.8, 7.4], [1.2, 4.6], 2.4, W, { bend: 0.4 }).B.reverse()], '#ffe8f2', { ink: '#a03a6a', d: 0.4 }),
    ...solid(shoe, boot, { k: 0.9 }),
    S(clip(shoe, rect(0, 12.1, 16, 2)), '#ff6b9a'),
    S(clip(shoe, rect(0, 12.1, 16, 0.45)), '#ffb0cc'),
    S(clip(shoe, oval(12.6, 10.4, 2.2, 1.6)), lt(boot)),
    line([[6.6, 5.8], [9.2, 6.6]], 0.4, '#3f86c8'), line([[6.6, 7.6], [9.6, 8.4]], 0.4, '#3f86c8'),
    ...puffs([[5.6, 3, 1.15], [7.4, 2.7, 1.2], [9.2, 3, 1.15]], '#fff8fb', { shadow: false, ink: '#a03a6a' }),
    ...glint(6.2, 9.6, 0.55),
    ...spark(13.4, 3.6, 1.4, '#fff3a6'),
  ];
}

// ---------- Warrior ----------

function bladerush() {
  return [
    ...tile('steel', 'active'),
    ...aura(8.5, 7.5, 6.5, '#e4f2ff'),
    ...swoosh(4.2, 12.6, 10, 10, -78, 2, 2.2, '#d4ecff'),
    ...sword([5, 11], [13.8, 2.2], { w: 2.4 }),
    ...swoosh(13.4, 12.4, 9.6, 9.6, -175, -100, 1.8, '#eef7ff'),
    ...spark(13.6, 2.2, 1.6, '#fff6c0'),
    ...spark(2.6, 3.6, 1),
  ];
}

function whirlwind() {
  const out = [...tile('steel', 'active'), ...aura(8, 8, 6.6, '#e4f2ff')];
  // A funnel of wind: three flattened rings, wide at the top.
  for (const [cy, rx, ry, w, a0] of [[4.2, 6.2, 1.9, 1.5, 200], [7.6, 4.8, 1.6, 1.3, 30], [10.6, 3.4, 1.2, 1.1, 210], [13, 2, 0.8, 0.9, 40]]) {
    out.push(...swoosh(8, cy, rx, ry, a0, a0 + 290, w, '#eef7ff', { ink: '#2a3a8a' }));
  }
  out.push(...sword([5.4, 11.6], [12.8, 3.4], { w: 2, glen: 2.2 }));
  out.push(...spark(2.6, 7.8, 1.1), ...spark(13.6, 11.4, 1.2, '#fff6c0'));
  return out;
}

// Cross Slash: two steel cuts crossing in an X, a glint where they meet.
function crossslash() {
  const out = [...tile('steel', 'active'), ...aura(8, 8, 6.6, '#e4f2ff', 1.1)];
  out.push(streak([2.6, 2.6], [13.4, 13.4], 1.6, '#eef7ff'), streak([13.4, 2.6], [2.6, 13.4], 1.6, '#cfe6ff'));
  out.push(...sword([12.6, 3.4], [4.4, 11.6], { w: 2.4, gw: 4, glen: 2, gem: '#7fd8ff' }));
  out.push(...spark(8, 8, 1.8, '#fff6c0'));
  return out;
}
function titanbreak() {
  const rock = '#9a9ac8';
  const out = [...tile('steel', 'active'), ...aura(8, 12, 6, '#e4f2ff', 1.2)];
  // Shock rays from the impact.
  for (const a of [-160, -125, -55, -20]) {
    const u = [Math.cos(a * D2R), Math.sin(a * D2R)];
    out.push(streak(add([8, 12.4], u, 7), add([8, 12.4], u, 2.6), 1.3, '#eef7ff'));
  }
  out.push(...solid([[0.8, 12.6], [5.6, 11.6], [7.6, 12.4], [10.4, 11.4], [15.2, 12.6], [15.2, 15.2], [0.8, 15.2]], rock, { shadow: false }));
  out.push(line([[8, 12.4], [6.4, 14], [6.8, 15.2]], 0.45, dk(rock)), line([[8.2, 12.4], [10, 13.6], [11.6, 13.4], [12.4, 15]], 0.45, dk(rock)), line([[7.4, 12.6], [4.4, 13.8]], 0.4, dk(rock)));
  out.push(...facet([[2.4, 9.2], [3.8, 8.4], [4.4, 10], [3, 10.6]], [2.4, 9.2], [4.4, 10], rock, { d: 0.4 }));
  out.push(...facet([[12, 8.4], [13.6, 8.8], [13.2, 10.4], [11.8, 9.8]], [12, 8.4], [13.2, 10.4], rock, { d: 0.4 }));
  out.push(...facet([[4.6, 5.8], [5.6, 5.4], [5.8, 6.6]], [4.6, 5.8], [5.8, 6.6], rock, { d: 0.35 }));
  out.push(...sword([8, 4.2], [8, 12.8], { w: 3.4, gw: 5.4, glen: 2.6, gem: '#7fd8ff' }));
  out.push(...spark(12.8, 3, 1.3, '#fff6c0'));
  return out;
}

function shouldercharge() {
  // The tile first: it sets the palette the helmet's drop shadows are cut from.
  const plate = tile('steel', 'active');
  const helm = '#dfe8f8';
  const dome = [...arcPts(8.6, 9.4, 4.8, 5.2, 180, 360, 18), [13.4, 12.4], [3.8, 12.4]];
  const head = [
    ...solid(tube(bez3([5.4, 6.4], [3.6, 4.6], [3.6, 2], [6.2, 1.4], 12), (t) => 1.9 * (1 - t) + 0.15), '#fff3dc'),
    ...solid(tube(bez3([11.8, 6.4], [13.6, 4.6], [14.2, 2], [11.8, 1.2], 12), (t) => 1.9 * (1 - t) + 0.15), '#fff3dc'),
    ...solid(dome, helm, { k: 0.9 }),
    S(clip(dome, rect(0, 9.4, 16, 3)), sh(helm)),
    ...solid(tube([[5.4, 10], [12.4, 10]], 1.2), '#3a2d4f', { shadow: false, flat: true, ink: '#2a2035' }),
    S(tube([[6.4, 9.9], [8.2, 9.9]], 0.35), '#6fb4ff'), S(tube([[10, 9.9], [11.8, 9.9]], 0.35), '#6fb4ff'),
    S(tube([[8.6, 4.6], [8.6, 9.2]], 1), '#4f7fe0'), S(tube([[8.4, 4.8], [8.4, 9]], 0.35), '#b4dcff'),
    ...glint(6, 6.2, 0.6),
  ];
  return [
    ...plate,
    ...aura(11, 8.6, 6, '#e4f2ff', 1.1),
    streak([0.6, 4.4], [5, 5.6], 1.2, '#fff0e4'), streak([0.6, 8.4], [4.6, 8.8], 1.7, '#fff6ee'), streak([0.6, 12.4], [5, 11.8], 1.2, '#fff0e4'),
    streak([2, 14.6], [5.6, 13.6], 0.8, '#c4dcff'),
    ...spin(head, 18, 8.6, 9),
    ...spark(14.2, 13.6, 1.3, '#fff6c0'), ...spark(14.4, 2.4, 0.9),
  ];
}

function ironguard() {
  const rimC = '#dfe8f8';
  const outer = [[2.2, 2.4], [8, 1.4], [13.8, 2.4], [13.6, 8], [11.6, 12], [8, 14.8], [4.4, 12], [2.4, 8]];
  const inner = [[3.4, 3.4], [8, 2.6], [12.6, 3.4], [12.4, 7.8], [10.7, 11.2], [8, 13.4], [5.3, 11.2], [3.6, 7.8]];
  return [
    ...tile('steel', 'buff'),
    ...aura(8, 8, 6.8, '#e8f0ff'),
    drop(outer),
    ...edge(outer, ink(rimC), 0.5),
    ...bevel(outer, inner, rimC, '#4f7fe0'),
    S(cut(inner, [8, 0], [8, 16]), '#3a62c8'),
    S(clip(inner, oval(5.6, 4.6, 3, 2.4)), '#8fbcff'),
    // A gold cross, and rivets.
    ...solid(tube([[8, 3.6], [8, 12.6]], 1.4), W, { shadow: false, d: 0.35 }),
    ...solid(tube([[4.4, 6.8], [11.6, 6.8]], 1.4), W, { shadow: false, d: 0.35 }),
    ...[[3.2, 3.2], [12.8, 3.2], [8, 2.1], [8, 13.8]].map(([x, y]) => S(oval(x, y, 0.4, 0.4, 0, 8), W)),
    ...glint(4.8, 4.4, 0.6),
    ...spark(14, 13, 1.2),
  ];
}

function warcry() {
  const flag = '#4f7fe0';
  const cloth = [[5.4, 2.6], [9, 3.4], [12, 2.4], [14.6, 3.2], [13.6, 5.8], [14.6, 8.6], [12, 9.2], [9, 8.2], [5.4, 9]];
  return [
    ...tile('steel', 'buff'),
    ...aura(9, 6, 6.6, '#e4f2ff'),
    // The pole.
    ...solid(tube([[4.6, 1.6], [4.6, 15.4]], 1.1), '#c98a5a'),
    ...solid(oval(4.6, 1.5, 1, 1, 0, 12), GOLD),
    ...solid(cloth, flag, { k: 0.9 }),
    S(clip(cloth, rect(8, 0, 4, 16)), sh(flag)),
    S(clip(cloth, rect(5, 0, 16, 1.2).map(([x, y]) => [x, y + 7.2])), '#ffffff'),
    ...solid(starPts(8.6, 5.6, 2.2, 0.95), GOLD, { shadow: false, d: 0.35 }),
    // Shout waves under the flag.
    ...swoosh(5.6, 12.6, 4, 2.6, -40, 40, 0.9, '#ffffff', { ink: '#2a3a8a' }),
    ...swoosh(5.6, 12.6, 6.4, 3.6, -36, 36, 0.9, '#d4ecff', { ink: '#2a3a8a' }),
    ...glint(6.8, 4, 0.5),
  ];
}

function toughness() {
  const wood = '#b87a50';
  const disc = oval(8, 8.4, 6.2, 6.2, 0, 36);
  const boss = oval(8, 8.4, 4, 4, 0, 30);
  return [
    ...tile('steel', 'passive'),
    drop(disc),
    ...edge(disc, ink('#c8d4ec'), 0.5),
    ...bevel(disc, oval(8, 8.4, 5, 5, 0, 36), '#c8d4ec', wood),
    S(clip(oval(8, 8.4, 5, 5, 0, 36), oval(6.6, 6.8, 4.4, 4.2)), lt(wood)),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => S(oval(8 + Math.cos(i * 45 * D2R) * 5.6, 8.4 + Math.sin(i * 45 * D2R) * 5.6, 0.38, 0.38, 0, 8), W)),
    ...edge(boss, ink('#4f7fe0'), 0.4),
    ...solid(heartPts(8, 8.8, 4.4), '#6f9cf0', { drop: 0.6, d: 0.4 }),
    ...glint(6.4, 7.2, 0.5),
    ...glint(3.8, 5, 0.5),
  ].filter((s) => s);
}

function swordmastery() {
  return [
    ...tile('steel', 'passive'),
    ...aura(8, 8, 6.6, '#e4f2ff'),
    ...sword([3.4, 13], [12.8, 3], { w: 2 }),
    ...sword([12.6, 13], [3.2, 3], { w: 2, gem: '#7fd8ff' }),
    ...glint(5, 4.6, 0.5),
    ...spark(13.4, 12.8, 1.2),
  ];
}

// ---------- Paladin ----------

// A kite shield: a silver rim around a colored face, its back half in shadow.
function kite(c, o = {}) {
  const { cx = 8, cy = 8, k = 1, rimC = '#eef2fb' } = o;
  const P = (pts) => pts.map(([x, y]) => [cx + (x - 8) * k, cy + (y - 8) * k]);
  const outer = P([[2.4, 2.6], [8, 1.4], [13.6, 2.6], [13.4, 8], [11.4, 12], [8, 14.8], [4.6, 12], [2.6, 8]]);
  const inner = P([[3.6, 3.6], [8, 2.6], [12.4, 3.6], [12.2, 7.8], [10.5, 11.2], [8, 13.4], [5.5, 11.2], [3.8, 7.8]]);
  return { outer, inner, shapes: [drop(outer), ...edge(outer, ink(rimC), 0.5), ...bevel(outer, inner, rimC, c), S(cut(inner, [cx, 0], [cx, 16]), sh(c)), S(clip(inner, oval(cx - 2.4 * k, cy - 3.4 * k, 3 * k, 2.4 * k)), lt(c))] };
}
// A diamond of light (the holy jobs' emblem).
const gem4 = (x, y, r, c = W, o = {}) => solid(polyPts(x, y, r, 4, -90, 1.3), c, { shadow: false, d: 0.35, ...o });

function paladinmastery() {
  const out = [...tile('holy', 'passive'), ...aura(8, 8, 6.8, '#fffbe0')];
  return [
    ...out,
    ...kite('#ffd24f').shapes,
    ...gem4(8, 7.8, 2.6, W, { ink: '#a8661a' }),
    S(polyPts(8, 7.8, 1.2, 4, -90, 1.3), '#ffe9a0'),
    ...glint(5.2, 4.6, 0.55),
    ...spark(13.8, 13.6, 1.1),
  ];
}

function aegissmite() {
  const out = [...tile('holy', 'active'), ...aura(6, 9, 6.4, '#fffbe0', 1.1)];
  // A round shield of light pushed forward, a sword cutting down behind it, and the shove's ring.
  out.push(...sword([3.4, 13.4], [13.6, 2.6], { w: 2.2, gem: '#7fd8ff' }));
  const face = oval(6.2, 9.4, 3.8, 4.6, 0, 30);
  out.push(drop(face), ...edge(face, '#a8661a', 0.5), S(face, '#ffe36b'), S(clip(face, oval(6.8, 9.4, 2.8, 3.6)), '#fff6c9'));
  out.push(...gem4(6.8, 9.4, 1.6, W, { ink: '#c98a2b' }));
  out.push(...swoosh(9.6, 9.6, 4.4, 5.6, -60, 60, 1, '#fff6c9', { ink: '#a8661a' }));
  out.push(...spark(13.4, 2.6, 1.4, '#fff6c0'), ...spark(2.4, 3.2, 1));
  return out;
}

function hallowedground() {
  const out = [...tile('dawn', 'active'), ...aura(8, 11, 6.4, '#fffbe0', 1.2)];
  // Rays of light rising from the ring.
  for (const x of [2.8, 5.4, 10.6, 13.2]) out.push(streak([x, 2.4 + Math.abs(x - 8) * 0.5], [x, 11.6], 1.1, '#fff6c9'));
  const ring = tube([...oval(8, 12.2, 6.2, 2, 0, 32), oval(8, 12.2, 6.2, 2, 0, 32)[0]], 0.9);
  out.push(...edge(ring, '#a8661a', 0.4), S(ring, '#fff3a6'));
  // The sword driven into the ground in the middle.
  out.push(...sword([8, 3.4], [8, 13], { w: 2.4, gw: 4.6, gem: '#7fd8ff' }));
  out.push(...[[3.2, 12.6], [12.8, 12.6], [8, 14.4]].flatMap(([x, y]) => gem4(x, y, 0.9)));
  out.push(...spark(13.6, 2.4, 1.2, '#fff6c0'));
  return out;
}

function divineaegis() {
  const out = [...tile('holy', 'buff'), ...aura(8, 8.6, 6.8, '#fffbe0', 1.1)];
  const sh0 = kite('#ffe9a0', { cy: 9, k: 0.85 });
  // Small wings either side of the shield, and a halo above.
  for (const sd of [-1, 1]) {
    const wing = [[8 + sd * 3.4, 6.4], [8 + sd * 7, 3.6], [8 + sd * 6.6, 6.8], [8 + sd * 7.2, 8.6], [8 + sd * 5.6, 9.6], [8 + sd * 3.6, 9.4]];
    out.push(...solid(wing, '#ffffff', { d: 0.4, ink: '#a8661a', k: 0.8 }));
  }
  out.push(...sh0.shapes);
  out.push(...gem4(8, 8.8, 2, W, { ink: '#a8661a' }));
  const halo = tube([...oval(8, 2.2, 2.8, 0.9, 0, 24), oval(8, 2.2, 2.8, 0.9, 0, 24)[0]], 0.55);
  out.push(...edge(halo, '#a8661a', 0.35), S(halo, '#ffe36b'));
  out.push(...glint(6, 6.6, 0.5));
  return out;
}

function sacredbulwark() {
  const out = [...tile('holy', 'passive'), ...aura(8, 8.4, 7, '#ffffff', 1.3)];
  // A big shield of light flashing up, rays bursting out behind it, and the shockwave ring at its foot.
  for (const a of [-160, -125, -90, -55, -20]) {
    const u = [Math.cos(a * D2R), Math.sin(a * D2R)];
    out.push(streak(add([8, 8.6], u, 7.6), add([8, 8.6], u, 4.6), 1.1, '#fff6c9'));
  }
  const ring = tube([...oval(8, 13.6, 6.4, 1.6, 0, 32), oval(8, 13.6, 6.4, 1.6, 0, 32)[0]], 0.7);
  out.push(...edge(ring, '#a8661a', 0.4), S(ring, '#fff3a6'));
  out.push(...kite('#ffe36b', { cy: 8.4, k: 0.95 }).shapes);
  out.push(...gem4(8, 8.2, 2.4, W, { ink: '#a8661a' }));
  out.push(...glint(5.4, 5.2, 0.55), ...spark(13.6, 2.6, 1.2, '#ffffff'));
  return out;
}

function judgment() {
  const out = [...tile('dawn', 'active'), ...aura(8, 6, 7, '#ffffff', 1.3)];
  // Three swords of light falling point-first out of a glowing sky.
  out.push(S(inTile(rect(-1, -1, 18, 3.6)), '#fff6c9'));
  for (const [x, top, len] of [[3.6, 1.8, 9], [8, 0.8, 12], [12.4, 2.4, 8.4]]) {
    out.push(...sword([x, top], [x, top + len], { w: 2, gw: 4, glen: 1.6, metal: '#fff6c9', gem: '#ffffff' }));
    out.push(streak([x, top - 0.6], [x, top - 3], 0.7, '#ffffff'));
  }
  out.push(...[[3.6, 14], [12.4, 14]].flatMap(([x, y]) => gem4(x, y, 0.9)));
  out.push(...spark(13.8, 13.4, 1, '#fff6c0'));
  return out;
}

function grandverdict() {
  const out = [...tile('dawn', 'active'), ...aura(8, 9, 7, '#ffffff', 1.4)];
  // A giant sword of light driven point-first into the ground, rays and a ring around the impact.
  for (const a of [-170, -140, -40, -10]) {
    const u = [Math.cos(a * D2R), Math.sin(a * D2R)];
    out.push(streak(add([8, 13.2], u, 7.4), add([8, 13.2], u, 3), 1.2, '#fff6c9'));
  }
  const ring = tube([...oval(8, 13.4, 6.4, 1.7, 0, 32), oval(8, 13.4, 6.4, 1.7, 0, 32)[0]], 0.8);
  out.push(...edge(ring, '#a8661a', 0.4), S(ring, '#fff3a6'));
  out.push(...sword([8, 3.6], [8, 14.2], { w: 3.8, gw: 7, glen: 2.6, metal: '#fff6c9', gem: '#ffffff' }));
  out.push(...gem4(8, 1.6, 1.1, W, { ink: '#a8661a' }));
  out.push(...spark(13.4, 3.2, 1.3, '#ffffff'), ...spark(2.6, 4, 1, '#fff6c0'));
  return out;
}

// ---------- Berserker ----------

// An axe from the butt of the haft (base) to its top (tip): a wooden haft and a broad bearded
// blade on the forward side near the top.
function axe(base, tip, o = {}) {
  const { metal = '#e8eefa', edgeC = '#ffffff', haft = '#a8704a', side = 1, size = 1 } = o;
  const u = N(base, tip);
  const n = [-u[1] * side, u[0] * side];
  const len = Math.hypot(tip[0] - base[0], tip[1] - base[1]);
  const p = along(base, u, n);
  const h = tube([p(0), p(len)], 0.75);
  const at = len - 2.6 * size;
  const blade = [p(at - 1.4 * size, 0.4), p(at - 2.6 * size, 3.4 * size), p(at - 0.6 * size, 5.2 * size), p(at + 1.6 * size, 5.4 * size), p(at + 2.6 * size, 3.6 * size), p(at + 1.6 * size, 0.4)];
  const bite = [p(at - 2.2 * size, 3.6 * size), p(at - 0.6 * size, 5.2 * size), p(at + 1.6 * size, 5.4 * size), p(at + 2.4 * size, 3.8 * size), p(at + 0.8 * size, 4.4 * size)];
  return [
    drop(h), ...edge(h, ink(haft), 0.45), S(h, haft), S(tube([p(0.4, -0.2), p(len - 0.4, -0.2)], 0.25), lt(haft)),
    drop(blade), ...edge(blade, ink(metal), 0.5), S(blade, sh(metal)), S(clip(blade, cut(blade, p(at - 2, 2.4 * size), p(at + 2, 2.4 * size))), lt(metal)), S(bite, edgeC),
    ...solid(oval(...p(len), 0.8, 0.8, 0, 12), GOLD, { shadow: false, d: 0.35 }),
  ];
}

function berserkermastery() {
  return [
    ...tile('crimson', 'passive'),
    ...aura(8, 7, 6.6, '#ffd0c0'),
    ...axe([4, 14], [12, 2.4], { size: 1.1 }),
    ...flame(3.2, 14.6, 1.6, 4.2, ['#c8243a', '#ff6b3b', '#ffd27a'], { shadow: false }),
    ...flame(12.8, 14.6, 1.4, 3.6, ['#c8243a', '#ff6b3b', '#ffd27a'], { shadow: false }),
    ...glint(10.4, 3.6, 0.5),
  ];
}

function ravage() {
  const out = [...tile('crimson', 'active'), ...aura(8, 8, 6.4, '#ffd8c8', 1.1)];
  // Three red claw-like gashes torn across the tile behind a big axe.
  for (const [cx, cy] of [[11.5, 4.2], [12.5, 7.4], [13.5, 10.6]]) out.push(...swoosh(cx, cy, 7, 7, 100, 160, 1.3, '#ff3f4f', { ink: '#5a0a1a', core: '#ffd0c0' }));
  out.push(...axe([3, 14], [10.6, 2], { size: 1.35 }));
  out.push(...spark(2.4, 3, 1.1, '#fff6c0'));
  return out;
}

function bloodfrenzy() {
  const out = [...tile('ember', 'buff'), ...aura(8, 9, 6.6, '#ffd8c0', 1.2)];
  out.push(...flame(8, 15.4, 9.4, 14, ['#c8243a', '#ff6b3b', '#ffd27a']));
  // A small blood drop low in the heart of the flame.
  const drop0 = [...arcPts(8, 11.8, 1.9, 1.9, -20, 200, 14), [8, 8.2]];
  out.push(...solid(drop0, '#e8304a', { d: 0.4, ink: '#5a0a1a' }));
  out.push(S(oval(7.4, 11.3, 0.5, 0.7, -20, 10), '#ffb0b8'));
  out.push(...spark(13.6, 3, 1.2, '#fff6c0'), ...spark(2.6, 4.4, 0.9));
  return out;
}

function rampage() {
  const out = [...tile('fire', 'active'), ...aura(8, 12, 6.6, '#ffe0b0', 1.3)];
  // A jagged burst where the axe comes down, and shards flying.
  out.push(...solid(starPts(8, 12.6, 6.4, 2.4, 7, -90), '#ff5a3c', { shadow: false, d: 0.45, ink: '#6a0a1a' }));
  out.push(S(starPts(8, 12.6, 3.6, 1.4, 7, -90), '#ffd27a'));
  out.push(...axe([12.6, 2], [8.4, 11.6], { size: 1.15, side: -1 }));
  for (const [x, y, a] of [[2.4, 7.4, -30], [13.8, 7, 30], [4, 3.6, -60]]) out.push(...solid(turn([[x, y - 1.2], [x + 0.7, y], [x, y + 1.2], [x - 0.7, y]], a, x, y), '#ff8a3c', { shadow: false, d: 0.3, ink: '#6a0a1a' }));
  out.push(...spark(13.6, 13.8, 1, '#fff6c0'));
  return out;
}

function bloodlust() {
  const out = [...tile('blood', 'passive'), ...aura(8, 8, 6.6, '#ffb0b8', 1.2)];
  // A big blood drop with three claw gashes torn across it, drops flying off.
  const big = [...arcPts(8, 10, 4.6, 4.6, -20, 200, 20), [8, 1.6]];
  out.push(...solid(big, '#d81e3c', { d: 0.45, ink: '#3a0814' }));
  out.push(S(clip(big, oval(6.6, 9.2, 2.2, 2.8, -20, 16)), '#ff5a6a'), S(oval(6.2, 8.8, 0.7, 1.1, -20, 10), '#ffd0d4'));
  for (const [cx, cy] of [[11, 4.8], [12, 8], [13, 11.2]]) out.push(...swoosh(cx, cy, 6, 6, 110, 165, 0.9, '#1e0618', { ink: '#1e0618', core: '#7c0a34' }));
  out.push(...solid([...arcPts(2.6, 13.4, 0.9, 0.9, -20, 200, 10), [2.6, 11.4]], '#e8304a', { shadow: false, d: 0.3, ink: '#3a0814' }));
  out.push(...spark(13.6, 2.6, 1, '#ffd0c0'));
  return out;
}

function demonform() {
  const out = [...tile('blood', 'active'), ...aura(8, 8, 7, '#ff4a1f', 1.3)];
  // A horned demon head, burning slit eyes and a jagged grin, flames licking up behind.
  out.push(...flame(3, 15, 3, 9, ['#7c0a34', '#e01c3c', '#ff7a4e'], { shadow: false }));
  out.push(...flame(13, 15, 3, 9, ['#7c0a34', '#e01c3c', '#ff7a4e'], { shadow: false }));
  for (const sd of [-1, 1]) out.push(...solid([[8 + sd * 3.2, 5.4], [8 + sd * 6.6, 1.2], [8 + sd * 5.4, 5], [8 + sd * 4.6, 7]], '#2a0a18', { d: 0.4, ink: '#120612' }));
  const head = [[3.6, 6], [8, 4.2], [12.4, 6], [12.6, 10.4], [10.4, 14], [8, 14.8], [5.6, 14], [3.4, 10.4]];
  out.push(...solid(head, '#3a0a1e', { d: 0.45, ink: '#120612' }));
  for (const sd of [-1, 1]) out.push(...solid([[8 + sd * 1.2, 8.6], [8 + sd * 3.8, 7.6], [8 + sd * 3.2, 9.4]], '#ffd27a', { shadow: false, d: 0.3, ink: '#c0102e' }));
  out.push(...solid([[5, 11], [6, 12.2], [7, 11.2], [8, 12.4], [9, 11.2], [10, 12.2], [11, 11], [10, 13.2], [6, 13.2]], '#ff4a1f', { shadow: false, d: 0.3, ink: '#120612' }));
  out.push(...spark(13.8, 13.6, 1, '#ffb347'));
  return out;
}

function crimsoneclipse() {
  const out = [...tile('royal', 'active')];
  // A blood moon with the eclipse's bite, and the axe crashing down across it.
  const moon = oval(8.6, 6.4, 5.4, 5.4, 0, 36);
  out.push(...edge(moon, '#3a0814', 0.5), S(moon, '#c8243a'), S(clip(moon, oval(8, 5.8, 4.2, 4.2, 0, 30)), '#ff5a4a'));
  out.push(S(clip(moon, oval(11.2, 5.6, 4.4, 4.4, 0, 30)), '#4a0a1e'));
  out.push(S(clip(tube(arcPts(8.6, 6.4, 5, 5, 110, 240, 14), 0.45), moon), '#ffd27a'));
  out.push(...swoosh(8, 9, 6.6, 6.6, 200, 330, 1.5, '#f0303f', { ink: '#3a0814', core: '#ffd0c0' }));
  out.push(...axe([12.6, 1.4], [6.2, 12.4], { size: 1.2, side: -1 }));
  out.push(...spark(2.6, 13.4, 1.1, '#ffb347'), ...spark(13.6, 13, 0.9));
  return out;
}


// ---------- The Acrobat Archer (mint and gold: gold arrows, mint ribbons, stars) ----------
const AMINT = '#5ed6a8';
const AMINTINK = '#145a4a';
const AGOLD = '#ffd36a';
// A curl of mint ribbon along `pts`.
const ribbonIcon = (pts, w = 0.8, c = AMINT) => solid(tube(pts, w * 0.5, w), c, { shadow: false, d: 0.3, ink: AMINTINK });

// Firework Arrow: a gold arrow bursting into a firework of gold and mint rays.
function blastarrow() {
  const out = [...tile('acro', 'passive'), ...aura(10, 6, 6.4, '#fff4c8', 1.2)];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    out.push(streak([10.4 + Math.cos(a) * 2, 5.8 + Math.sin(a) * 2], [10.4 + Math.cos(a) * 5.2, 5.8 + Math.sin(a) * 5.2], 0.9, k % 2 ? AMINT : AGOLD));
  }
  out.push(...solid(starPts(10.4, 5.8, 2.6, 1.1, 5, -90), '#fff4c8', { shadow: false, d: 0.3, ink: '#8e5228' }));
  out.push(...arrow([1.4, 14.6], [8.6, 7.6], { hw: 1.3, hl: 2, fl: AMINT, head: AGOLD }));
  return out;
}
// Ribbon Snare: a mint ribbon tied in a bow round a gold arrow.
function snarearrow() {
  const out = [...tile('acro', 'passive'), ...aura(8, 8, 6.6, '#e6fff4')];
  out.push(...arrow([1.6, 13.6], [14.2, 3], { hw: 1.2, hl: 1.9, fl: AMINT, head: AGOLD }));
  out.push(...ribbonIcon([[3, 6], [6, 9.4], [9.6, 10.6], [12.6, 9.6]], 1.4));
  for (const sd of [-1, 1]) out.push(...solid([[8, 8.6], [8 + sd * 3.6, 6.4], [8 + sd * 3.8, 10.4]], AMINT, { shadow: false, d: 0.3, ink: AMINTINK }));
  out.push(...solid(oval(8, 8.6, 1.2, 1, 0, 10), AGOLD, { shadow: false, d: 0.3, ink: '#8e5228' }));
  out.push(...spark(13.4, 12.6, 1));
  return out;
}
// Springboard: a striped circus springboard on its spring, a gold star bouncing off it.
function springtrap() {
  const out = [...tile('acro', 'active'), ...aura(8, 8, 6.4, '#fff4c8')];
  out.push(...solid(rect(2.6, 13.4, 10.8, 1.4), '#e09a36', { shadow: false, d: 0.3, ink: '#8e5228' }));
  for (let k = 0; k < 3; k++) out.push(S(tube([[6.4, 12.6 - k * 1.3], [9.6, 12.2 - k * 1.3]], 0.35, 0.35), '#c8d2e8'));
  out.push(...solid(turn(rect(2, 8.6, 12, 1.6), -12, 8, 9.4), AMINT, { shadow: false, d: 0.3, ink: AMINTINK }));
  for (let x = 3.4; x < 13; x += 3) out.push(S(turn(rect(x, 8.8, 1.3, 1.2), -12, 8, 9.4), '#ffffff'));
  out.push(...solid(starPts(9.4, 3.6, 2.6, 1.1, 5, -90), AGOLD, { shadow: false, d: 0.35, ink: '#8e5228' }));
  return out;
}
// Handspring: a figure's arc flipping over, a gold arrow loosed back from the far side.
function vault() {
  const out = [...tile('acro', 'active'), ...aura(8, 6, 6.6, '#e6fff4')];
  out.push(...ribbonIcon(arcPts(8, 11, 6, 7.4, 180, 360, 20), 1.1));
  out.push(...solid(polyPts(14, 11, 1.6, 3, 90, 1), AMINT, { shadow: false, d: 0.3, ink: AMINTINK }));
  out.push(...arrow([14.6, 3.2], [3.4, 9.4], { hw: 1.2, hl: 1.9, fl: AMINT, head: AGOLD }));
  out.push(...spark(2.4, 2.6, 1.1, AGOLD));
  return out;
}
// Grand Somersault (her finisher): a gold ring bursting high, golden arrows raining down from it.
function cometarrow() {
  const out = [...tile('acro', 'active'), ...aura(8, 5, 6.6, '#fff4c8', 1.3)];
  out.push(...solid(tube(arcPts(8, 5, 4, 3, 0, 360, 24), 0.6, 0.6), AGOLD, { shadow: false, d: 0.3, ink: '#8e5228' }));
  out.push(...solid(starPts(8, 5, 2.2, 0.9, 5, -90), '#fff4c8', { shadow: false, d: 0.3, ink: '#8e5228' }));
  for (const x of [3, 8, 13]) out.push(...arrow([x - 1.4, 8.6], [x + 0.6, 14.4], { hw: 1, hl: 1.6, fl: AMINT, head: AGOLD }));
  return out;
}


function steadyhands() {
  const out = [...tile('acro', 'passive'), ...aura(8, 8, 6.6, '#e6fff4')];
  // A drawn bow held dead still on a sight.
  out.push(...sightArt(10, 8, 4.4, AGOLD, 0.5));
  out.push(...longbow([3.4, 14.2], [2.8, 1.8], 2.2, { grip: AMINT }));
  out.push(...arrow([3.4, 8.2], [12.6, 8], { hw: 1.2, hl: 1.9, fl: AMINT, head: AGOLD }));
  out.push(...glint(6.2, 4.4, 0.5), ...spark(13.6, 13.4, 1.1));
  return out;
}


// The Acrobat Archer's Spring Step: a boot with a little feathered wing, speed lines behind it.
function springstep() {
  const out = [...tile('mint', 'passive'), ...aura(9, 8, 6.6, '#f4fff0')];
  // A boot with a little feathered wing, speed lines trailing behind it.
  for (const [y, len] of [[5.4, 5], [8.2, 6.4], [11, 4.6]]) out.push(streak([1.2, y], [1.2 + len, y], 1, '#e8fff4'));
  const boot = [[6.4, 3.4], [10.4, 3.4], [10.6, 10.4], [14.6, 11.4], [14.6, 14], [6.2, 14]];
  out.push(...solid(boot, '#c8945a', { ink: '#5a3a20', d: 0.45, light: '#f0c890' }));
  out.push(S(tube([[6.4, 12.6], [14.4, 12.6]], 0.5), '#5a3a20'));
  out.push(...leaf([10.6, 6.4], [15, 2.4], 2.6, '#ffffff', { bend: 0.6, rib: '#c4e8d4' }).shapes);
  out.push(...spark(13.8, 13.8, 0.9, '#fff3a6'));
  return out;
}

// ---------- Archer paths ----------

// A longbow from the lower tip to the upper, bowed toward `side`, with its string.
function longbow(lo, hi0, bow = 3, o = {}) {
  const { wood = '#c88a5a', grip = '#2f9468', string = '#fff6e0' } = o;
  const m = [(lo[0] + hi0[0]) / 2, (lo[1] + hi0[1]) / 2];
  const u = N(lo, hi0);
  const n = [-u[1], u[0]];
  const pts = bez(lo, add(m, n, bow * 2), hi0, 18);
  const limb = tube(pts, (t) => 0.55 + 0.6 * Math.sin(Math.PI * t));
  const g = tube([add(add(m, n, bow), u, -0.9), add(add(m, n, bow), u, 0.9)], 0.95);
  return [drop(limb), line([lo, hi0], 0.28, string), ...edge(limb, ink(wood), 0.45), S(limb, wood), S(tube(pts.slice(2, 10), 0.22), lt(wood)), ...edge(g, ink(grip), 0.35), S(g, grip)];
}

// A curl of wind: a swoosh with a hooked end.
const curl = (cx, cy, r, a0, c = '#e8fff4') => swoosh(cx, cy, r, r * 0.7, a0, a0 + 250, 1.1, c, { ink: '#1a6a5a' });


// A sight: a ring with four ticks, in the Sniper's rose.
function sightArt(cx, cy, r, c = '#ff5a7a', w = 0.6) {
  const ring = tube([...oval(cx, cy, r, r, 0, 32), oval(cx, cy, r, r, 0, 32)[0]], w);
  const ticks = [0, 90, 180, 270].map((a) => {
    const v = [Math.cos(a * D2R), Math.sin(a * D2R)];
    return tube([add([cx, cy], v, r - 1.4), add([cx, cy], v, r + 1.6)], w);
  });
  return [...edge(ring, ink(c), 0.35), S(ring, c), ...ticks.flatMap((t) => [...edge(t, ink(c), 0.3), S(t, c)])];
}


// ---------- The Phantom Trickster (plum and silver: smoke, cards, doves, top hats) ----------
const PPLUM = '#9a4a9a';
const PPLUMINK = '#3a1446';
const PSIL = '#e6e8f6';
// A playing card at (x, y), `h` tall, turned `deg`, with a suit mark (red or plum).
function cardIcon(x, y, h, deg, red = true) {
  const w = h * 0.68;
  return [...solid(turn(rect(x - w / 2, y - h / 2, w, h), deg, x, y), '#ffffff', { shadow: false, d: 0.3, ink: PPLUMINK }), S(turn(oval(x, y, w * 0.18, h * 0.16, 0, 10), deg, x, y), red ? '#e0405a' : PPLUM)];
}
// A puff of plum stage smoke.
const smokeIcon = (pts) => puffs(pts, '#e6d0f0', { shadow: false, light: '#ffffff', ink: '#5a3a72' });
// A top hat.
function hatIcon(x, y, s) {
  return [...solid(rect(x - s, y, s * 2, s * 0.3), PPLUM, { shadow: false, d: 0.3, ink: PPLUMINK }), ...solid(rect(x - s * 0.6, y - s * 1.2, s * 1.2, s * 1.25), PPLUM, { shadow: false, d: 0.3, ink: PPLUMINK }), S(rect(x - s * 0.6, y - s * 0.25, s * 1.2, s * 0.22), PSIL)];
}
// Sleight of Hand: a card held up between two fingers, sparkling.
function beastmastery() {
  const out = [...tile('phantom', 'passive'), ...aura(8, 7, 6.4, '#f2dcf6')];
  out.push(...cardIcon(8, 6.6, 7.6, 12));
  out.push(...solid(oval(6.4, 12.6, 2.4, 1.6, 0, 12), '#ffe0cf', { shadow: false, d: 0.3, ink: '#8a5a4a' }));
  out.push(...spark(13, 3, 1), ...spark(3, 4, 0.8));
  return out;
}
// Vanishing Arrow: a plum arrow fading into smoke, its head coming out the far side.
function wildhunt() {
  const out = [...tile('phantom', 'passive'), ...aura(8, 8, 6.4, '#f2dcf6')];
  out.push(...arrow([1.4, 12.6], [6, 9.6], { hw: 1, hl: 1.6, fl: PPLUM, head: PSIL }));
  out.push(...smokeIcon([[8, 8.6, 2.4], [6.6, 7, 1.6], [9.6, 7, 1.6]]));
  out.push(...arrow([10.4, 6.4], [14.6, 3.6], { hw: 1, hl: 1.6, fl: PPLUM, head: PSIL }));
  return out;
}
// Dove Arrow: two silver doves flying off an arrow's head.
function wolfpounce() {
  const out = [...tile('phantom', 'passive'), ...aura(9, 7, 6.4, '#f8f6ff')];
  out.push(...arrow([1.4, 14], [7.6, 8.6], { hw: 1, hl: 1.6, fl: PPLUM, head: PSIL }));
  for (const [x, y, s] of [[10.6, 5.4, 2.6], [12.8, 10.4, 2]]) out.push(...solid([[x - s, y + s * 0.2], [x - s * 0.3, y - s * 0.4], [x + s * 0.6, y - s * 0.3], [x + s, y - s * 0.6], [x + s * 0.4, y + s * 0.4]], PSIL, { shadow: false, d: 0.3, ink: '#4a4a6a' }), ...solid([[x - s * 0.2, y - s * 0.2], [x - s * 0.8, y - s * 1.2], [x + s * 0.3, y - s * 0.4]], '#ffffff', { shadow: false, d: 0.3, ink: '#4a4a6a' }));
  return out;
}
// Card Trick: a fan of three cards flying.
function hawkstrike() {
  const out = [...tile('phantom', 'passive'), ...aura(8, 8, 6.4, '#f2dcf6')];
  out.push(...cardIcon(5, 9, 6.4, -20, false), ...cardIcon(8, 8, 6.6, 0, true), ...cardIcon(11, 9, 6.4, 20, false));
  out.push(streak([1, 12], [4, 11], 0.6, '#f2dcf6'), ...spark(13.6, 3, 0.9));
  return out;
}
// Smoke Bomb: a round black bomb bursting into plum smoke.
function packhowl() {
  const out = [...tile('phantom', 'active'), ...aura(8, 9, 6.4, '#f2dcf6')];
  out.push(...smokeIcon([[4.6, 10.6, 2.6], [8, 8.6, 3.2], [11.6, 10.6, 2.6], [8, 12.4, 2.4]]));
  out.push(...solid(oval(8, 5, 2.4, 2.4, 0, 14), '#3a2a4a', { shadow: false, d: 0.3, ink: '#1a1022' }), S(tube([[9.4, 3.2], [11, 1.6]], 0.3, 0.3), '#c8a46a'), ...spark(11.6, 1.4, 0.9, '#ffd36a'));
  return out;
}
// Mirror Dodge: a hand mirror, a copy's silhouette popping in smoke beside it.
function loyalguard() {
  const out = [...tile('phantom', 'passive'), ...aura(8, 8, 6.4, '#f8f6ff')];
  out.push(...solid(oval(6.6, 6.6, 3.6, 4.2, 0, 20), PSIL, { shadow: false, d: 0.35, ink: '#4a4a6a' }), S(oval(6, 5.6, 1.6, 2.2, 0, 14), '#ffffff'));
  out.push(...solid(rect(5.8, 10.6, 1.6, 4), PPLUM, { shadow: false, d: 0.3, ink: PPLUMINK }));
  out.push(...smokeIcon([[12, 10.4, 2], [13.4, 8.6, 1.4]]));
  return out;
}
// Hall of Mirrors: three see-through copies, one behind another.
function alpha() {
  const out = [...tile('phantom', 'passive'), ...aura(8, 8, 6.8, '#f2dcf6', 1.2)];
  for (const [x, c] of [[4.4, '#d8b8e6'], [8, '#c890da'], [11.6, '#b86ac0']]) out.push(...solid([[x - 1.6, 14.4], [x - 1.4, 8.6], [x - 2, 6.4], [x, 3.4], [x + 2, 6.4], [x + 1.4, 8.6], [x + 1.6, 14.4]], c, { shadow: false, d: 0.3, ink: PPLUMINK }));
  return out;
}
// Showstopper: the top hat with a card and a burst of sparkles over it.
function snacktime() {
  const out = [...tile('phantom', 'buff'), ...aura(8, 7, 6.6, '#fff4c8', 1.2)];
  out.push(...hatIcon(8, 10.6, 4.2), ...cardIcon(10.4, 7.6, 4, 18));
  out.push(...spark(4, 3, 1.1, '#ffd36a'), ...spark(12.6, 2.6, 1), ...spark(8, 1.8, 0.8));
  return out;
}
// Grand Illusion (her finisher): a ring of smoke with copies round it and the top hat in the middle.
function stampede() {
  const out = [...tile('phantom', 'active'), ...aura(8, 8, 7, '#f2dcf6', 1.3, 5)];
  out.push(...smokeIcon([[3, 12.6, 1.8], [8, 13.6, 2], [13, 12.6, 1.8], [2.6, 7, 1.4], [13.4, 7, 1.4]]));
  out.push(...hatIcon(8, 8.4, 3.4));
  for (const x of [3.6, 12.4]) out.push(S([[x - 1, 11], [x - 0.8, 7], [x, 5.2], [x + 0.8, 7], [x + 1, 11]], '#c890da'));
  out.push(...spark(8, 2, 1.1));
  return out;
}










// ---------- Thief ----------

function twinfang() {
  const out = [...tile('shadow', 'active'), ...aura(8, 8, 6.8, '#d8ccff')];
  const dagger = { w: 2.3, gw: 3.6, glen: 2.1, guard: '#c9a6ff', grip: '#3a2d4f', gem: '#ff5a8a' };
  out.push(...sword([5.2, 10.8], [12.4, 3.6], dagger));
  out.push(...sword([10.8, 10.8], [3.6, 3.6], dagger));
  for (const [x, y] of [[13.4, 2.6], [2.6, 2.6]]) out.push(S(starPts(x, y, 2.2, 0.6, 4, -45), '#fff3a6'), S(starPts(x, y, 1.2, 0.4, 4, -45), W));
  out.push(...spark(13.6, 13.4, 1.1), ...spark(8, 13.2, 0.8));
  return out;
}

// A four-point throwing star, lit and shaded blade by blade, with its hole.
function throwStar(cx, cy, r, rot, metal = '#dfe6f8') {
  const pts = starPts(cx, cy, r, r * 0.34, 4, rot);
  const res = [...solid(pts, metal, { d: 0.45 })];
  for (let i = 0; i < 4; i++) {
    const a = pts[i * 2];
    res.push(S([a, pts[(i * 2 + 1) % 8], [cx, cy]], i % 2 ? sh(metal) : hi(metal)));
  }
  res.push(S(oval(cx, cy, r * 0.22, r * 0.22, 0, 12), '#3a2d4f'));
  return res;
}
// A crescent moon: the outer arc of a disc with an offset disc bitten out of it.
function crescentPts(cx, cy, r, bite = [1.8, -1.4], k = 0.82) {
  return [...arcPts(cx, cy, r, r, -40, 230, 22), ...arcPts(cx + bite[0], cy + bite[1], r * k, r * k, 230, -40, 22)];
}

function luckyseven() {
  const metal = '#dfe6f8';
  const out = [...tile('shadow', 'active')];
  const star = (cx, cy, r, rot) => throwStar(cx, cy, r, rot, metal);
  out.push(streak([0.8, 11], [6.2, 9.6], 1.8, '#b4a6ee'), streak([2.4, 14.4], [7.6, 13], 1.2, '#b4a6ee'));
  out.push(streak([3.6, 6.8], [8.4, 5.6], 1.2, '#b4a6ee'));
  out.push(...aura(11, 6, 4.4, '#e6dcff'));
  out.push(...star(11, 5.6, 4, -70), ...star(9.4, 12, 2.9, -40));
  out.push(...spark(14, 13, 1, '#fff3a6'), ...spark(3, 2.8, 1.1));
  return out;
}

function quickhaste() {
  const out = [...tile('shadow', 'buff'), ...aura(9, 8, 6, '#e6dcff')];
  out.push(streak([0.8, 5], [5, 5], 0.9, '#c4b6ff'), streak([0.8, 11], [5, 11], 0.9, '#c4b6ff'), streak([1.6, 8], [4.4, 8], 1.1, '#e6dcff'));
  const chev = (x, c) => [[x, 2.8], [x + 3, 2.8], [x + 7, 8], [x + 3, 13.2], [x, 13.2], [x + 4, 8]];
  out.push(...solid(chev(3.6, 0), '#b89cff', { d: 0.45 }));
  out.push(...solid(chev(7.8, 0), '#e8e4ff', { d: 0.45 }));
  out.push(S([[7.8, 2.8], [10.8, 2.8], [12.8, 5.4], [9.8, 5.4]], W));
  out.push(S([[3.6, 2.8], [6.6, 2.8], [8.6, 5.4], [5.6, 5.4]], '#dcfaff'));
  out.push(...spark(14, 13.6, 1.1));
  return out;
}

// ---------- Arbalist Engineer (brass and teal: gears, steam, teal energy) ----------
const BRASSC = '#e8b85a';
const BRASSINK = '#5a3818';
const TEALC = '#4fe0d0';
// A brass cog round (cx, cy), r to its teeth.
function cogIcon(cx, cy, r, n = 8, c = BRASSC) {
  const pts = [];
  for (let i = 0; i < n * 4; i++) {
    const a = (i / (n * 4)) * Math.PI * 2;
    const rr = Math.floor(i / 2) % 2 === 0 ? r : r * 0.78;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return [...solid(pts, c, { d: 0.35, ink: BRASSINK }), S(oval(cx, cy, r * 0.32, r * 0.32, 0, 12), BRASSINK)];
}
// A bolt from (x0, y0) to its teal head at (x1, y1).
const boltIcon = (x0, y0, x1, y1) => [streak([x0, y0], [x1, y1], 0.8, BRASSC), ...solid([[x1 + (x1 - x0) * 0.12, y1 + (y1 - y0) * 0.12], [x1 - 1.2, y1 - 1.4], [x1 - 1.4, y1 + 1.2]], TEALC, { shadow: false, d: 0.3, ink: '#0e4a52' })];
const steamPuff = (list) => puffs(list, W, { ink: '#8a98a8' });
function engmastery() {
  const out = [...tile('brassbg', 'passive'), ...aura(8, 8, 6.6, '#c8fff4')];
  out.push(...cogIcon(6.4, 9.6, 4.2, 8), ...boltIcon(3, 13, 12.6, 3.4));
  return out;
}
// Sticky Bolt: a bolt stuck in a blob, its teal light blinking.
function stickybolt() {
  const out = [...tile('brassbg', 'passive')];
  out.push(...solid(oval(9.4, 10, 4, 3.4, 0, 18), '#7a6a9a', { d: 0.35 }), ...boltIcon(2, 4, 8.6, 8.6));
  out.push(...spark(11.6, 6, 1.4, TEALC), ...spark(13.4, 12.8, 0.9, TEALC));
  return out;
}
// Cluster Bolt: little bomblets bursting in a row.
function clusterbolt() {
  const out = [...tile('brassbg', 'passive')];
  for (const [x, y] of [[3.6, 11], [8, 9.6], [12.4, 11]]) out.push(...solid(oval(x, y, 1.8, 1.8, 0, 12), '#3a3a4a', { d: 0.3 }), ...spark(x + 0.4, y - 2.6, 1.1, TEALC));
  out.push(...boltIcon(1, 3, 6.4, 5.6), ...spark(13.6, 3, 0.9));
  return out;
}
// Steam Vent: a cog blowing out a cloud of steam.
function steamvent() {
  const out = [...tile('brassbg', 'passive')];
  out.push(...cogIcon(5.4, 11, 3.6, 7), ...steamPuff([[9.4, 7.4, 2.6], [12.4, 5.6, 2.2], [11.4, 9.4, 2]]));
  return out;
}
// Deploy Turret: a brass tripod turret with a teal eye.
function deployturret() {
  const out = [...tile('brassbg', 'active')];
  for (const [x0, x1] of [[8, 3.4], [8, 12.6], [8, 9]]) out.push(streak([x0, 9.4], [x1, 14.4], 0.7, '#b8782a'));
  out.push(...solid(rect(4.4, 6.4, 8, 3.2), BRASSC, { d: 0.35, ink: BRASSINK }), ...solid(rect(10.8, 4.4, 1.2, 7.2), '#b8782a', { d: 0.3, ink: BRASSINK }));
  out.push(S(oval(7, 8, 1.1, 1.1, 0, 10), TEALC), ...spark(13.6, 3, 1.1, TEALC));
  return out;
}
// Wind-Up Bomb: a round brass bomb on little feet with a key on top.
function windupbomb() {
  const out = [...tile('brassbg', 'active'), ...aura(8, 9, 6.4, '#fff0c8')];
  out.push(...solid(oval(8, 9.6, 4.4, 4.4, 0, 20), BRASSC, { d: 0.35, ink: BRASSINK }));
  out.push(S(rect(3.8, 10, 8.4, 1.1), '#b8782a'), S(oval(10, 8.6, 1.3, 1.3, 0, 10), TEALC));
  out.push(...solid(rect(7.4, 3.4, 1.2, 2), '#b8782a', { d: 0.3, ink: BRASSINK }), ...solid(oval(6.2, 2.8, 1.4, 1, 0, 10), BRASSC, { d: 0.3, ink: BRASSINK }), ...solid(oval(9.8, 2.8, 1.4, 1, 0, 10), BRASSC, { d: 0.3, ink: BRASSINK }));
  out.push(S(rect(4.8, 13.8, 2, 1), '#b8782a'), S(rect(9.2, 13.8, 2, 1), '#b8782a'));
  out.push(...spark(13.4, 4, 1.1, TEALC));
  return out;
}
// Overclock: a cog with a teal gauge needle pinned in the red.
function overclock() {
  const out = [...tile('brassbg', 'buff'), ...aura(8, 8, 6, '#c8fff4')];
  out.push(...cogIcon(8, 8.6, 5.2, 10), S(oval(8, 8.6, 3, 3, 0, 18), '#fff6e0'));
  out.push(S(arcPts(8, 8.6, 2.6, 2.6, 300, 360, 6).concat([[8, 8.6]]), '#ff6a5a'), streak([8, 8.6], [10.4, 7], 0.6, '#0e4a52'));
  return out;
}
// Big Bertha: a giant ballista bolt with a burst of teal at its head.
function bigbertha() {
  const out = [...tile('brassbg', 'active'), ...aura(11, 6, 5, TEALC, 1.2, 5)];
  out.push(...solid([[1, 13], [2.6, 14.6], [11, 6.6], [9.4, 5]], BRASSC, { d: 0.35, ink: BRASSINK }));
  out.push(...solid([[13.8, 2.2], [9, 4.4], [11.6, 7]], TEALC, { d: 0.35, ink: '#0e4a52' }));
  out.push(...steamPuff([[3, 11, 1.8], [5, 13.4, 1.6]]), ...spark(14, 6, 1.2, TEALC));
  return out;
}


function shadowdash() {
  const navy = '#2e2466';
  const out = [...tile('dusk', 'active')];
  // A masked shadow dashing ahead: scarf tails and smoke streaming behind.
  out.push(streak([0.8, 5.4], [5, 6], 1, '#f0c8f4'), streak([0.8, 9.8], [4.2, 9.6], 0.8, '#f0c8f4'));
  out.push(...puffs([[2.4, 13.4, 2], [4.8, 14, 1.6], [1.6, 11.4, 1.2], [6.8, 14.6, 1.1]], '#7a5ac8', { shadow: false, light: '#a88ae8', ink: '#1a1040' }));
  for (const [y0, y1, w] of [[7.6, 6.4, 1.5], [9, 10.6, 1.2]]) out.push(...solid(tube(bez([7, y0], [4.4, y0 - 0.4], [2, y1], 10), (t) => w * (1 - 0.7 * t)), '#ff5aa0', { ink: '#1a1040', d: 0.4 }));
  const hood = oval(10, 7.8, 4.6, 4.4, 0, 32);
  out.push(...aura(10, 7.8, 6, '#ffc8f0', 0.9, 3));
  out.push(...solid(hood, navy, { ink: '#e6c8ff', d: 0.5, light: '#4a3a90' }));
  // The eye slit: a pale band with two bright, narrowed eyes.
  const slit = [[6, 7.2], [14.4, 6.6], [14.6, 9], [6.2, 9.4]];
  out.push(S(clip(slit, hood), '#ffe6f0'));
  out.push(S([[9, 7.6], [11, 7.4], [10.8, 8.6], [9.2, 8.6]], '#2a1040'), S([[12, 7.3], [13.8, 7.2], [13.6, 8.4], [12.2, 8.5]], '#2a1040'));
  out.push(S(oval(10.2, 8, 0.4, 0.4, 0, 8), '#ff8ae0'), S(oval(13, 7.9, 0.4, 0.4, 0, 8), '#ff8ae0'));
  out.push(S(tube(bez([6.4, 6.8], [10, 6], [14.2, 6.2], 8), 0.5), '#ff5aa0'));
  out.push(...glint(7.6, 4.8, 0.55), ...spark(14, 13.4, 1.2, '#ffd8f8'));
  return out;
}


function backstab() {
  const out = [...tile('dusk', 'active'), ...aura(9, 8, 6.4, '#e6dcff')];
  // A puff of smoke left where she was, and the dagger driving in from behind.
  out.push(...puffs([[3.4, 11.6, 2.2], [5.6, 12.6, 2], [2.6, 13.8, 1.5]], '#c9b4ff', { shadow: false, dark: '#8a6ae8', ink: '#2a1a6a' }));
  out.push(streak([2, 6.4], [7.4, 6.4], 1.1, '#e6dcff'), streak([3, 8.6], [7.6, 8.6], 0.8, '#c4b6ff'));
  out.push(...sword([13.6, 12.8], [6.4, 4.2], { w: 2.4, gw: 3.6, glen: 2.1, guard: '#c9a6ff', grip: '#3a2d4f', gem: '#ff5a8a' }));
  out.push(...spark(5.6, 3.6, 1.4, '#fff6ff'), ...spark(13.6, 3, 0.9));
  return out;
}


function moonlitassassin() {
  const out = [...tile('royal', 'active'), ...aura(8, 6, 6.8, '#e8e4ff', 1.1)];
  // A big crescent moon over the night, and a dagger's X cut across it.
  out.push(...solid(crescentPts(8, 7, 6.2, [2.2, -1.6]), '#f2f0ff', { d: 0.45, ink: '#2a1a6a', glow: 1.1 }));
  const blade = (a, b) => [streak(a, b, 1.5, '#c9b4ff'), streak(a, b, 0.6, W)];
  out.push(...blade([2.6, 14.2], [13.6, 3.2]), ...blade([2.6, 3.2], [13.6, 14.2]));
  out.push(...spark(8, 8.6, 1.6, W), ...spark(2.6, 2.4, 0.9), ...spark(13.8, 13.6, 1));
  return out;
}

function starfan() {
  const out = [...tile('shadow', 'active'), ...aura(3, 13, 5, '#e6dcff', 1.1)];
  const o = [2.2, 13.8];
  for (const [a, r] of [[-82, 1.9], [-62, 2.2], [-43, 2.5], [-24, 2.2], [-5, 1.9]]) {
    const u = [Math.cos(a * D2R), Math.sin(a * D2R)];
    out.push(streak(add(o, u, 3), add(o, u, 8.4), 0.8, '#c4b6ff'));
    out.push(...throwStar(o[0] + u[0] * 10.6, o[1] + u[1] * 10.6, r, a));
  }
  out.push(...puffs([[2.6, 13.2, 1.8]], '#c9b4ff', { shadow: false, dark: '#8a6ae8', ink: '#2a1a6a' }));
  out.push(...spark(13.6, 13.4, 1));
  return out;
}


function fullmoonvolley() {
  const out = [...tile('royal', 'active'), ...aura(8, 6.4, 6.6, '#f2f0ff', 1.1)];
  // A full moon with stars raining down from it.
  const moon = oval(8, 6, 4.6, 4.6, 0, 28);
  out.push(...solid(moon, '#e8e4ff', { d: 0.45, ink: '#2a1a6a', glow: 1.15 }));
  out.push(S(oval(9.4, 7.4, 1.1, 1.1, 0, 12), '#c4b6ff'), S(oval(6.6, 5, 0.8, 0.8, 0, 10), '#c4b6ff'));
  for (const [x, y, r] of [[2.6, 12.4, 1.7], [7.4, 13.6, 1.9], [12.6, 12, 1.6]]) {
    out.push(streak([x - 1.4, y - 4], [x - 0.4, y - 1.4], 0.7, '#c4b6ff'));
    out.push(...throwStar(x, y, r, -30));
  }
  out.push(...spark(14, 2.4, 1, W), ...spark(2, 2.6, 0.8));
  return out;
}

// ---------- Blade Dancer (rose gold: bouncing rings, sparks where they ricochet, a carousel) ----------
const ROSE = '#f2a48c';
const ROSE_INK = '#7e3450';
const RIMGOLD = '#ffd36a';
// A chakram: six blade points round a rose-gold ring with a gold rim, turned by `rot`.
function ringBlade(cx, cy, r, rot = 0, c = ROSE) {
  const out = [];
  for (let k = 0; k < 6; k++) {
    const a = ((rot + k * 60) * Math.PI) / 180;
    const p = (da, d) => [cx + Math.cos(a + da) * d, cy + Math.sin(a + da) * d];
    out.push(...solid([p(-0.3, r * 0.8), p(0.25, r * 1.8), p(0.4, r * 0.8)], RIMGOLD, { shadow: false, d: 0.35, ink: ROSE_INK }));
  }
  const ring = arcPts(cx, cy, r, r, 0, 360, 28);
  out.push(...edge(tube(ring, r * 0.5), ROSE_INK, 0.4), S(tube(ring, r * 0.5), c), S(tube(arcPts(cx - 0.2, cy - 0.2, r, r, 200, 300, 12), r * 0.18), W));
  out.push(S(tube(arcPts(cx, cy, r * 0.62, r * 0.62, 0, 360, 22), r * 0.14), RIMGOLD));
  return out;
}
function ringmastery() {
  const out = [...tile('rosegold', 'passive'), ...aura(8, 8, 6.6, '#fff0d6')];
  out.push(...ringBlade(8, 8, 3.6, 10));
  out.push(...spark(12.8, 3.2, 1.1), ...spark(3.4, 12.6, 0.8, RIMGOLD));
  return out;
}
// Rebound: a ring bouncing off one spark to the next, its path a zigzag of rose streaks.
function rebound() {
  const out = [...tile('rosegold', 'passive')];
  out.push(streak([1.6, 12.4], [5.4, 4.6], 0.9, '#c8666a'), streak([5.4, 4.6], [9.2, 11.6], 0.9, '#c8666a'));
  out.push(...spark(5.4, 4.6, 1.5, RIMGOLD), ...spark(9.2, 11.6, 1.3, RIMGOLD));
  out.push(...ringBlade(12, 5.6, 2.4, 25));
  return out;
}
// Twin Rings: two rings flying side by side, one a beat behind.
function twinrings() {
  const out = [...tile('rosegold', 'passive'), ...aura(8, 8, 6.6, '#fff0d6')];
  out.push(streak([1, 5.4], [4.6, 5.4], 0.7, '#c8666a'), streak([0.6, 11], [6.2, 11], 0.7, '#c8666a'));
  out.push(...ringBlade(9.6, 10.8, 2.7, 0, RIMGOLD), ...ringBlade(8, 5.2, 2.7, 30));
  return out;
}
// Golden Carousel: rings riding a gold track round a bright centre.
function goldencarousel() {
  const out = [...tile('rosegold', 'active'), ...aura(8, 8, 7, RIMGOLD, 1.2, 5)];
  out.push(...edge(tube(arcPts(8, 8.6, 6, 2.6, 0, 360, 30), 0.9), '#8e5228', 0.4), S(tube(arcPts(8, 8.6, 6, 2.6, 0, 360, 30), 0.9), RIMGOLD));
  for (const [x, y, r] of [[2.6, 8, 1.7], [13.4, 8, 1.7], [8, 11.2, 2.1], [8, 5.6, 1.3]]) out.push(...ringBlade(x, y, r, x * 20));
  out.push(...spark(8, 2.6, 1.4), ...spark(13.4, 13.2, 0.9, RIMGOLD));
  return out;
}

// Hoopla: a big ring dropping flat over a little monster, a gold glint on it.
function hoopla() {
  const out = [...tile('rosegold', 'active'), ...aura(8, 9, 6.6, RIMGOLD)];
  out.push(...solid(oval(8, 12, 3, 2.6, 0, 16), '#b0a0c8', { d: 0.3, ink: '#4a3a6a' }));
  out.push(...edge(tube(arcPts(8, 10.6, 5.4, 1.8, 0, 360, 28), 0.9), '#8e5228', 0.4), S(tube(arcPts(8, 10.6, 5.4, 1.8, 0, 360, 28), 0.9), RIMGOLD));
  for (const x of [3.6, 12.4]) out.push(streak([x, 3], [x, 7.6], 0.6, W));
  out.push(...spark(8, 4, 1.6, RIMGOLD));
  return out;
}
// Juggling Act: three rings wheeling in an arc.
function jugglingact() {
  const out = [...tile('rosegold', 'active'), ...aura(8, 8, 6.6, RIMGOLD)];
  out.push(...edge(tube(arcPts(8, 10, 5.6, 6, 200, 340, 18), 0.4), '#8e5228', 0.2));
  for (const [x, y, r] of [[3.2, 9, 1.9], [8, 4.4, 2.1], [12.8, 9, 1.9]]) out.push(...ringBlade(x, y, r, x * 30));
  out.push(...spark(8, 13, 1.2, RIMGOLD));
  return out;
}
// Curtain Call: a gold star bursting, confetti flying.
function showstopper() {
  const out = [...tile('rosegold', 'buff'), ...aura(8, 8, 7, RIMGOLD, 1.2, 5)];
  out.push(...spark(8, 8, 4, RIMGOLD));
  for (const [x, y, c] of [[2.6, 3.4, '#f6ad94'], [13.2, 4, RIMGOLD], [3.4, 13, RIMGOLD], [12.6, 12.4, '#f6ad94'], [8, 2, W]]) out.push(S(rect(x - 0.6, y - 0.6, 1.2, 1.2), c));
  return out;
}

// ---------- Sky Dancer (sky blue, white clouds, a little sunlight) ----------
const SKYBLUE = '#8fd0ff';
const SKYINK = '#2a4f9e';
const SUNGOLD = '#ffe6a0';
// A crescent of wind sweeping from a0 to a1 round (cx, cy).
const gust = (cx, cy, r, a0, a1, w) => swoosh(cx, cy, r, r * 0.9, a0, a1, w, SKYBLUE, { ink: SKYINK });
// A feather: a soft leaf with a white spine, from (x0, y0) to (x1, y1).
function featherIcon(x0, y0, x1, y1, w, c = W) {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const nx = -(y1 - y0);
  const ny = x1 - x0;
  const l = Math.hypot(nx, ny) || 1;
  const pts = [[x0, y0], [mx + (nx / l) * w, my + (ny / l) * w], [x1, y1], [mx - (nx / l) * w * 0.7, my - (ny / l) * w * 0.7]];
  return [...solid(pts, c, { d: 0.35, ink: SKYINK, shadow: false }), streak([x0, y0], [x1, y1], 0.3, '#c8dcf0')];
}
function skymastery() {
  const out = [...tile('skydance', 'passive'), ...aura(8, 8, 6.6, '#e8f8ff')];
  out.push(...gust(8, 8, 5.4, -200, -30, 1.8), ...gust(8, 8.6, 3.4, 20, 160, 1.2));
  out.push(...featherIcon(5, 12.6, 11.6, 4, 1.6));
  out.push(...spark(13, 2.6, 1.1, SUNGOLD));
  return out;
}
// Updraft: a whirl rising out of a little cloud.
function updraft() {
  const out = [...tile('skydance', 'passive')];
  out.push(...puffs([[5.4, 12.6, 2.4], [8.4, 12, 2.8], [11.2, 12.8, 2.2]], W));
  for (const [y, r] of [[9.4, 3.8], [6.6, 3], [4, 2.2]]) out.push(...swoosh(8, y, r, r * 0.42, -200, 60, 0.9, SKYBLUE, { ink: SKYINK }));
  out.push(...spark(12.6, 3, 1, SUNGOLD));
  return out;
}
// Zephyr: two crescents of wind, one a beat behind the other.
function zephyr() {
  const out = [...tile('skydance', 'passive'), ...aura(8, 8, 6.6, '#e8f8ff')];
  out.push(...gust(5.4, 9.4, 4, -60, 60, 1.4), ...gust(10.4, 7, 4, -60, 60, 1.6));
  out.push(streak([1, 6], [4, 6], 0.5, '#c8dcf0'), streak([1.4, 12], [4.4, 12], 0.5, '#c8dcf0'));
  return out;
}
// Sky Waltz: a tornado with a sun sparkle at its top.
function skywaltz() {
  const out = [...tile('skydance', 'active'), ...aura(8, 8, 7, SUNGOLD, 1.2, 5)];
  for (const [y, r] of [[13, 1.6], [11, 2.6], [8.8, 3.6], [6.4, 4.6], [3.8, 5.6]]) out.push(...swoosh(8, y, r, r * 0.38, -210, 40, 1, y < 8 ? W : SKYBLUE, { ink: SKYINK }));
  out.push(...featherIcon(11.6, 6.2, 14.2, 2.4, 1));
  out.push(...spark(3, 3, 1.2, SUNGOLD), ...spark(13.4, 12.6, 0.9));
  return out;
}

// Downburst: a glove diving straight down onto a burst of wind.
function downburst() {
  const out = [...tile('skydance', 'active'), ...aura(8, 9, 6.6, '#e8f8ff')];
  out.push(...swoosh(8, 13, 6, 1.8, 180, 360, 1, SKYBLUE, { ink: SKYINK }));
  out.push(...gust(3.4, 12, 3, 150, 240, 1.2), ...gust(12.6, 12, 3, -60, 30, 1.2));
  for (const x of [6.4, 9.6]) out.push(streak([x, 2], [x, 8], 0.6, W));
  out.push(...featherIcon(8, 3.4, 8, 10, 1.2));
  out.push(...spark(8, 12.2, 1.4, SUNGOLD));
  return out;
}
// Gale Step: three streaks of wind racing right with feathers peeling off.
function galestep() {
  const out = [...tile('skydance', 'active'), ...aura(8, 8, 6.4, '#e8f8ff')];
  for (const [y, c] of [[5.4, SKYBLUE], [8, W], [10.6, SKYBLUE]]) out.push(streak([1.6, y], [13.6, y], 0.8, c));
  out.push(...featherIcon(4, 3.6, 7, 3, 1), ...featherIcon(9, 12.4, 12, 13.6, 1));
  out.push(...spark(13.6, 8, 1.2, SUNGOLD));
  return out;
}
// Cloud Nine: two little clouds under a pair of wings of light.
function cloudnine() {
  const out = [...tile('skydance', 'buff'), ...aura(8, 8, 6.6, SUNGOLD, 1, 4)];
  out.push(...featherIcon(7, 7, 2.6, 3.6, 1.2), ...featherIcon(9, 7, 13.4, 3.6, 1.2));
  for (const [x, y, r] of [[5.6, 11.6, 2.6], [10.6, 11, 3]]) out.push(...solid(oval(x, y, r, r * 0.7, 0, 14), W, { d: 0.3, ink: SKYINK }));
  out.push(...spark(8, 4, 1.2, SUNGOLD), ...spark(2.6, 7.6, 0.8), ...spark(13.4, 8.6, 0.8));
  return out;
}

// ---------- Wind Dancer (coral and cream: swirling ribbons, crescent gusts, spinning chakrams) ----------
const WCORAL = '#f2655c';
const WPEACH = '#ff9d88';
const WCREAM = '#fff1e6';
const WINK = '#8a2c48';
// A ribbon along `pts`: a band that swells in the middle and tapers to its two ends.
function wribbon(pts, w, c = WCORAL, o = {}) {
  const fat = (t) => Math.max(0.25, w * Math.pow(Math.sin(Math.PI * (0.08 + t * 0.84)), o.flat ? 0.3 : 0.6));
  const band = tube(pts, fat);
  const out = [o.shadow === false ? null : drop(band, 0.7), ...edge(band, WINK, 0.35), S(band, c)];
  // A lit edge running along the ribbon's upper side.
  out.push(S(move(tube(pts.slice(1, -1), (t) => fat(t) * 0.32), -0.15, -0.25), o.light ?? mix(c, W, 0.55)));
  return out;
}
// A spiral of `turns` from radius r0 out to r1 round (cx, cy), starting at angle a0 (degrees).
const spiral = (cx, cy, r0, r1, a0, turns, sy = 1, n = 40) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n;
  const a = (a0 + t * turns * 360) * D2R;
  const r = r0 + (r1 - r0) * t;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * sy];
});
// A chakram held on its rim: a coral ring with four cream blade points and a gold grip band.
function wchakram(cx, cy, r, rot = 0) {
  const out = [];
  for (let k = 0; k < 4; k++) {
    const a = (rot + 45 + k * 90) * D2R;
    const p = (da, d) => [cx + Math.cos(a + da) * d, cy + Math.sin(a + da) * d];
    out.push(...solid([p(-0.5, r * 0.9), p(0.18, r * 1.85), p(0.5, r * 0.9)], WCREAM, { shadow: false, d: 0.35, ink: WINK }));
  }
  const ring = arcPts(cx, cy, r, r, 0, 360, 30);
  out.push(drop(tube(ring, r * 0.42)), ...edge(tube(ring, r * 0.42), WINK, 0.4), S(tube(ring, r * 0.42), WCORAL));
  out.push(S(tube(arcPts(cx, cy, r * 1.05, r * 1.05, 190, 290, 12), r * 0.2), mix(WCORAL, W, 0.6)));
  out.push(S(tube(arcPts(cx, cy, r * 0.78, r * 0.78, 0, 360, 24), r * 0.1), mix(WCORAL, WINK, 0.5)));
  // The wrapped grip on the rim.
  const g = (rot + 180) * D2R;
  out.push(...solid(turn(rect(cx + Math.cos(g) * r - 0.9, cy + Math.sin(g) * r - 1.4, 1.8, 2.8), rot, cx + Math.cos(g) * r, cy + Math.sin(g) * r), GOLD, { shadow: false, d: 0.3, ink: '#8e5228' }));
  return out;
}
// A satin ballet slipper at (x, y), tilted `deg`: a long rounded sole, the opening near its heel.
function slipper(x, y, deg, c = WPEACH) {
  const body = oval(x, y, 2.1, 4.4, deg, 28);
  const open = oval(...turn([[x, y - 1.3]], deg, x, y)[0], 1.3, 2.4, deg, 20);
  return [...solid(body, c, { d: 0.45, ink: WINK }), S(open, mix(c, '#a8385a', 0.5)), S(oval(...turn([[x - 0.8, y + 1.6]], deg, x, y)[0], 0.5, 1.4, deg, 12), mix(c, W, 0.6)),
    S(oval(...turn([[x, y + 3.4]], deg, x, y)[0], 1.2, 0.7, deg, 12), WCREAM)];
}
// Pirouette: she whirls away, a coral and a cream ribbon spiralling round her spin and streaking behind.
function pirouette() {
  const out = [...tile('coral', 'active'), ...aura(9.4, 8, 6.4, '#fff1e6', 1.1)];
  out.push(streak([0.6, 5.2], [5, 5.6], 0.8, WCREAM), streak([0.4, 11.4], [4.6, 10.6], 0.9, WCREAM));
  out.push(...wribbon(spiral(9.6, 8, 1, 5.6, 200, 1.05, 0.62), 1.7, WCORAL));
  out.push(...wribbon(spiral(9.6, 8, 1, 4.4, 20, 0.9, 0.62), 1.3, WCREAM, { light: W }));
  out.push(...spark(9.6, 7.6, 1.6, W), ...spark(13.6, 2.6, 1, GOLD), ...spark(3, 14, 0.8));
  return out;
}
// Ribbon Lash: two ribbons cracked across each other like whips, cuts flashing at their tips.
function ribbonlash() {
  const out = [...tile('coral', 'passive'), ...aura(8, 8, 6.6, '#ffe9df')];
  out.push(...wribbon(bez3([2, 14], [6, 12], [4, 5], [13.4, 2.6], 16), 1.8, WCREAM, { light: W }));
  out.push(...wribbon(bez3([14, 14], [10, 12], [12, 5], [2.6, 2.6], 16), 1.9, WCORAL));
  out.push(...swoosh(13.4, 4.4, 2.4, 2.4, -150, -10, 0.9, W, { ink: WINK }), ...swoosh(2.6, 4.4, 2.4, 2.4, -170, -30, 0.9, W, { ink: WINK }));
  out.push(...spark(14.2, 1.8, 1.1, W), ...spark(1.8, 1.8, 1.1, W), ...spark(8, 13.6, 0.8, GOLD));
  return out;
}
// Gust Line: a crescent of wind flung down the line, speed streaks behind it.
function gustline() {
  const out = [...tile('coral', 'passive'), ...aura(10, 8, 6, '#fff1e6', 1.1)];
  for (const [y, x0] of [[4.6, 0.6], [8, 0.2], [11.4, 0.8]]) out.push(streak([x0, y], [x0 + 5.6, y], 0.8, WCREAM));
  out.push(...swoosh(5.6, 8, 7.4, 6.6, -62, 62, 3, WCORAL, { ink: WINK, core: WCREAM }));
  out.push(...swoosh(4.2, 8, 5.4, 4.8, -55, 55, 1.4, WPEACH, { ink: WINK }));
  out.push(...spark(13.6, 2.6, 1, W), ...spark(13.8, 13.2, 0.8, GOLD));
  return out;
}
// Spotlight: a beam of light drops on a star pose; the stage glows under it.
function spotlight() {
  const out = [...tile('coral', 'buff')];
  out.push(S([[6.4, 0.6], [9.6, 0.6], [14, 13.6], [2, 13.6]], '#ffe0d2'), S([[7.2, 0.6], [8.8, 0.6], [11.4, 13.6], [4.6, 13.6]], '#fff6ee'));
  out.push(...solid(oval(8, 13.4, 5.6, 1.4, 0, 20), WPEACH, { shadow: false, d: 0.3, ink: WINK }));
  out.push(...solid(starPts(8, 7.4, 3.8, 1.6, 5, -90), GOLD, { d: 0.35, ink: '#8e5228' }));
  out.push(...wribbon([[3.4, 11.6], [4.6, 8.6], [3.2, 6], [4.4, 3.6]], 1, WCORAL, { shadow: false }), ...wribbon([[12.6, 11.6], [11.4, 8.6], [12.8, 6], [11.6, 3.6]], 1, WCORAL, { shadow: false }));
  out.push(...glint(6.8, 6.4, 0.45), ...spark(13.6, 2.4, 0.9, W));
  return out;
}
// Light Feet: a pair of satin ballet slippers hung by their ribbons, a crescent gust lifting them.
function lightfeet() {
  const out = [...tile('coral', 'passive'), ...aura(8, 8, 6.6, '#fff1e6')];
  out.push(...swoosh(8, 10, 6.6, 4, 20, 160, 1.4, WCREAM, { ink: WINK }));
  out.push(...wribbon([[5, 6.4], [6.4, 3.4], [8, 2.2]], 0.9, WCORAL, { shadow: false }), ...wribbon([[11, 6.4], [9.6, 3.4], [8, 2.2]], 0.9, WCORAL, { shadow: false }));
  out.push(...slipper(5.2, 9.4, 18), ...slipper(10.8, 9.4, -18));
  out.push(...solid(oval(8, 2.4, 1.2, 0.9, 0, 12), WCORAL, { shadow: false, d: 0.3, ink: WINK }));
  out.push(...spark(13.6, 3.4, 1, W), ...spark(2.4, 3.4, 0.8, GOLD));
  return out;
}
// Nimble: a dancer's folding fan flicked open, a gust curling off its edge.
function nimblefeet() {
  const out = [...tile('coral', 'passive'), ...aura(8, 8, 6.6, '#ffe9df')];
  const o = [8, 13.4];
  const blades = 7;
  for (let k = 0; k < blades; k++) {
    const a0 = (-160 + (k * 140) / blades) * D2R;
    const a1 = (-160 + ((k + 1) * 140) / blades) * D2R;
    const R1 = 7.4;
    const R0 = 2;
    const pts = [[o[0] + Math.cos(a0) * R0, o[1] + Math.sin(a0) * R0], [o[0] + Math.cos(a0) * R1, o[1] + Math.sin(a0) * R1], [o[0] + Math.cos(a1) * R1, o[1] + Math.sin(a1) * R1], [o[0] + Math.cos(a1) * R0, o[1] + Math.sin(a1) * R0]];
    if (k === 0) out.push(drop(tube(arcPts(o[0], o[1], 4.8, 4.8, -160, -20, 16), 5.4)));
    out.push(...edge(pts, WINK, 0.3), S(pts, k % 2 ? WCORAL : WCREAM));
  }
  out.push(S(tube(arcPts(o[0], o[1], 7.1, 7.1, -158, -22, 18), 0.6), GOLD));
  out.push(...solid(oval(o[0], o[1], 1.3, 1.3, 0, 12), GOLD, { shadow: false, d: 0.3, ink: '#8e5228' }));
  out.push(...swoosh(13.2, 9.4, 2.6, 4, -80, 60, 1, WPEACH, { ink: WINK }));
  out.push(...spark(2.4, 3, 1, W), ...spark(14, 2.4, 0.8, GOLD));
  return out;
}
// Chakram Mastery: her chakram, a ribbon tied to its grip.
function daggermastery() {
  const out = [...tile('coral', 'passive'), ...aura(8, 8, 6.6, '#fff1e6')];
  out.push(...wribbon([[3.2, 10.4], [1.6, 13], [3.6, 14.6], [5.2, 13.8]], 1.1, WCREAM, { shadow: false, light: W }));
  out.push(...wchakram(8.8, 7.2, 3.3, -30));
  out.push(...spark(13.6, 13, 1, W), ...spark(2.6, 2.8, 0.8, GOLD));
  return out;
}
// Glove Mastery: a coral dance glove, palm open, a crescent gust curling up out of it.
function gauntletmastery() {
  const out = [...tile('coral', 'passive'), ...aura(8, 7, 6.6, '#fff1e6')];
  out.push(...swoosh(8.6, 6, 4.6, 4, -200, -20, 1.8, WCREAM, { ink: WINK }));
  const hand = [[4.6, 15.4], [4.2, 11.6], [2.6, 9.6], [3.4, 9], [5.2, 10.4], [5.2, 7], [6.2, 6.6], [6.8, 9.4], [7.2, 6.2], [8.2, 6.2], [8.4, 9.4], [9.2, 6.8], [10.2, 7.2], [9.8, 10], [10.8, 8.4], [11.6, 8.8], [10.6, 12.4], [10.4, 15.4]];
  out.push(...solid(hand, WCORAL, { d: 0.4, ink: WINK }));
  out.push(...solid(rect(4.2, 13.4, 6.6, 2), WCREAM, { shadow: false, d: 0.3, ink: WINK }));
  out.push(...spark(12.8, 3, 1.2, W), ...spark(13.4, 12.6, 0.8, GOLD));
  return out;
}
// Grand Finale (her finisher): a rose of coral and cream ribbons spun up under a spotlight.
function grandfinale() {
  const out = [...tile('coral', 'active')];
  out.push(S([[6, 0.6], [10, 0.6], [15.4, 15.4], [0.6, 15.4]], mix('#ffd4c0', W, 0.4)));
  out.push(...aura(8, 9, 6.6, '#fff6ee', 1.2, 5));
  out.push(...wribbon(spiral(8, 9.2, 0.6, 6, 0, 1.6, 0.86, 48), 1.6, WCORAL));
  out.push(...wribbon(spiral(8, 9.2, 0.6, 4.4, 180, 1.4, 0.86, 40), 1.2, WCREAM, { light: W }));
  out.push(...solid(oval(8, 9.2, 1.3, 1.2, 0, 12), WPEACH, { shadow: false, d: 0.3, ink: WINK }));
  out.push(...spark(2.6, 4.6, 0.9, GOLD), ...spark(13.4, 4.4, 1, W), ...spark(13.6, 14, 0.8, GOLD));
  return out;
}

// A wisp of spirit light: a bright round head, a soft tail behind it.
function wisp(x, y, r, ang = 0) {
  const c = Math.cos(ang * D2R);
  const sn = Math.sin(ang * D2R);
  const tail = [[x - c * r * 2.6, y - sn * r * 2.6], [x - c * r * 1.2, y - sn * r * 1.2], [x, y]];
  return [S(tube(tail, 0.2, r * 1.4), '#e6dcff'), S(tube(tail.slice(1), 0.2, r * 0.9), W), ...solid(oval(x, y, r, r, 0, 16), W, { d: 0.35, ink: '#7a6cb8' }), S(oval(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.4, 0, 10), '#fff3c4')];
}

// ---------- Game master ----------

function gmsmite() {
  const gold = '#ffd25a';
  const out = [...tile('royal', 'active'), ...aura(9, 6, 7, '#fff3a0', 1.1, 5)];
  for (let i = 0; i < 10; i++) {
    const a = (i * 36 + 10) * D2R;
    out.push(S([[9 + Math.cos(a - 0.1) * 3, 6 + Math.sin(a - 0.1) * 3], [9 + Math.cos(a) * 9, 6 + Math.sin(a) * 9], [9 + Math.cos(a + 0.1) * 3, 6 + Math.sin(a + 0.1) * 3]], '#fff6c8'));
  }
  // A great golden gavel, slamming down.
  out.push(...solid(tube([[3, 14.6], [8.2, 8.4]], 1.4), '#b87adf'));
  out.push(...solid(oval(2.8, 14.8, 1, 1, 0, 12), gold, { shadow: false }));
  const headPts = turn(rect(5.6, 3.6, 8.4, 4.6), 40, 9.8, 5.9);
  out.push(...solid(headPts, gold, { k: 0.85 }));
  for (const t of [0.12, 0.88]) {
    const [a, b, c, d] = headPts;
    const q = (p0, p1) => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
    out.push(S(tube([q(a, b), q(d, c)], 0.9), '#ff6b8a'));
  }
  out.push(S(starPts(9.8, 5.9, 1.6, 0.6, 5, -50), W));
  out.push(...glint(8.2, 3.6, 0.6));
  out.push(...bolt([[12.4, 9.2], [11.2, 11.4], [12.8, 11.6], [11.4, 14.6]], 1.4, '#fff36b', { ink: '#1a1440' }));
  return out;
}

function gmhaste() {
  const out = [...tile('royal', 'buff')];
  const bands = ['#ff6b8a', '#ffb347', '#fff36b', '#7fe87a', '#6fc8ff', '#b48aff'];
  bands.forEach((c, i) => out.push(S(tube(bez([0.6, 13.8 - i * 0.95 + 1.6], [5, 13.6 - i * 0.95], [10, 7.8 - i * 0.95 + 0.6], 14), (t) => 0.2 + 1.05 * t), c)));
  out.push(...aura(10.8, 6.2, 4.6, '#fff6c8', 1.2));
  for (const s of [1, -1]) {
    const wing = turn([[10.8, 6.2], [10.8 + s * 4, 2.4], [10.8 + s * 4.6, 4], [10.8 + s * 4, 6.2], [10.8 + s * 3, 7.8]], -10, 10.8, 6.2);
    out.push(...solid(wing.map(([x, y]) => [Math.min(15, x), y]), W, { d: 0.35, ink: '#5a4aa0', light: W }));
  }
  out.push(...solid(starPts(10.8, 6.4, 3.4, 1.4), '#ffe36b', { d: 0.45, ink: '#7a4a10' }));
  out.push(...glint(9.8, 5.4, 0.45), ...spark(3, 3, 1.1), ...spark(14, 13.6, 1));
  return out;
}

function gmblessing() {
  const gold = '#ffd25a';
  const out = [...tile('royal', 'passive'), ...aura(8, 9, 7, '#fff3a0', 1.1)];
  const crown = [[2.2, 5.4], [5, 8.2], [8, 3.4], [11, 8.2], [13.8, 5.4], [12.8, 12.6], [3.2, 12.6]];
  out.push(...solid(crown, gold, { k: 0.85 }));
  out.push(S(clip(crown, rect(0, 10.6, 16, 2.2)), shade(gold, -10)), S(clip(crown, rect(0, 10.6, 16, 0.5)), '#fff3c0'));
  out.push(...[[2.2, 5.4], [8, 3.4], [13.8, 5.4]].flatMap(([x, y]) => solid(oval(x, y - 0.6, 1.1, 1.1, 0, 14), '#fff3c0', { shadow: false, d: 0.35, ink: '#7a4a10' })));
  out.push(...solid(polyPts(8, 9, 1.5, 4, -90, 1.2), '#ff6b8a', { shadow: false, d: 0.35 }), ...solid(oval(5, 11.6, 0.8, 0.7, 0, 12), '#6fc8ff', { shadow: false, d: 0.3 }), ...solid(oval(11, 11.6, 0.8, 0.7, 0, 12), '#7fe87a', { shadow: false, d: 0.3 }));
  out.push(...glint(4.6, 7.6, 0.5), ...spark(13.6, 13.8, 1.2), ...spark(2.4, 13.6, 0.9), ...spark(13.4, 1.8, 1));
  return out;
}

const ART = {
  pebble, cozyrest, quickstep,
  bladerush, whirlwind, shouldercharge, warcry, ironguard, swordmastery, toughness, titanbreak,
  paladinmastery, aegissmite, hallowedground, divineaegis, sacredbulwark, judgment, grandverdict,
  berserkermastery, ravage, bloodfrenzy, rampage, bloodlust, demonform, crimsoneclipse,
  blastarrow, snarearrow, springtrap, vault, steadyhands, springstep, lightfeet, cometarrow,
  beastmastery, wildhunt, wolfpounce, hawkstrike, packhowl, loyalguard, alpha, snacktime, stampede,
  engmastery, stickybolt, clusterbolt, steamvent, deployturret, overclock, bigbertha,
  shadowdash, quickhaste, nimblefeet, twinfang, backstab, daggermastery, moonlitassassin, luckyseven, starfan, gauntletmastery, fullmoonvolley,
  ringmastery, rebound, twinrings, goldencarousel,
  skymastery, updraft, zephyr, skywaltz, downburst, galestep, cloudnine, hoopla, jugglingact, showstopper, windupbomb, crossslash,
  pirouette, ribbonlash, gustline, spotlight, grandfinale,
  gmsmite, gmhaste, gmblessing,
};

// Each skill's background tones [light, deep], noted as its tile is built, so windows can tint
// the plate behind an icon to match it.
const TONES = {};

// Every design is clipped to the tile, so nothing spills past the frame's own outline.
// Finishers (the ones that spend a full gauge) wear a gold rim and a little gold star on top.
export const SKILL_ART = Object.fromEntries(Object.entries(ART).map(([id, draw]) => [id, () => {
  const shapes = draw().filter(Boolean);
  TONES[id] = [cur.top, cur.deep];
  const outer = curOuter;
  const out = shapes.map((s) => ({ ...s, pts: clip(s.pts, outer) })).filter((s) => s.pts.length > 2);
  if (SKILLS[id]?.fullGauge) {
    out.push(...bevel(outer, curInner, '#ffd25a').slice(1, -1));
    out.push(S([[8, -0.6], [8.9, 1.5], [11, 1.7], [9.4, 3], [9.9, 5], [8, 3.9], [6.1, 5], [6.6, 3], [5, 1.7], [7.1, 1.5]], '#ffe36b'), twinkle(8, 2.1, 0.9));
  }
  return out;
}]));

export function skillTone(id) {
  if (!TONES[id] && SKILL_ART[id]) SKILL_ART[id]();
  return TONES[id] ?? null;
}
