// Hand-drawn 16x16 skill icons, one per skill. Each is a framed, rounded tile: a bevelled rim
// (pearl for actives, gold for buffs, silver with studs for passives), a banded gradient in the
// colors of the skill's job, spell school, or role (heals blue, wards green, blessings rose), so
// no two in a book share a hue, and a bold central motif lit from the top left, inked, and
// glinting. Built with the item icons' kit so both share one look. `SKILL_ART[id]()` returns the
// shapes; icons.js draws them at res 3.

import { shade, mix } from '../pixel.js';
import { hi, lt, sh, dk, ink, S, oval, arcPts, bez, bez3, rect, clip, cut, ball, tube, line, bevel, twinkle, glint, leaf, turn, W, GOLD, D2R } from './items.js';

// ---------- The tile ----------

// Background bands, top to bottom: [light, deep].
const BG = {
  sakura: ['#ffc4dc', '#d94f8c'],
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
  shrine: ['#f6f0ff', '#5a46a8'],
  idolbg: ['#ffe0f0', '#a83a7a'],
  lullbg: ['#f4e4ff', '#5a3a9a'],
};

const FRAME = { active: '#fff0f6', buff: '#ffd25a', passive: '#d4cdee' };

function rrect(x, y, w, h, r, n = 6) {
  const cs = [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]];
  return cs.flatMap(([cx, cy, a]) => arcPts(cx, cy, r, r, a, a + 90, n));
}
const OUTER = rrect(0, 0, 16, 16, 3.4);
const INNER = rrect(0.95, 0.95, 14.1, 14.1, 2.5);
const inTile = (pts) => clip(pts, INNER);

// The tile being drawn: its tones, for glows and drop shadows.
let cur = null;

function tile(bg, kind) {
  const [top, deep] = BG[bg];
  cur = { top, deep, mid: mix(top, deep, 0.5), shadow: mix(deep, '#1c1230', 0.3) };
  const out = bevel(OUTER, INNER, FRAME[kind]);
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
    for (const [x, y] of [[1.5, 1.5], [14.5, 1.5], [1.5, 14.5], [14.5, 14.5]]) out.push(S(oval(x, y, 0.95, 0.95, 0, 12), '#8f86b8'), S(oval(x - 0.15, y - 0.15, 0.65, 0.65, 0, 12), '#f4f0ff'));
  }
  if (kind === 'buff') {
    // Gold corner caps.
    for (const [x, y, a] of [[1.4, 1.4, 0], [14.6, 1.4, 90], [14.6, 14.6, 180], [1.4, 14.6, 270]]) {
      out.push(S(turn([[x - 0.9, y - 0.9], [x + 1.8, y - 0.9], [x - 0.9, y + 1.8]], a, x, y), '#ffe9a0'));
    }
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


// ---------- Archer ----------

function blastarrow() {
  const out = [...tile('fire', 'passive'), ...aura(10, 6, 6.4, '#fff3c0', 1.2)];
  // An arrow striking home in a burst of fire and cloud.
  out.push(...solid(starPts(10.4, 5.8, 5.6, 2.4, 8, -90), '#ffb347', { shadow: false, d: 0.45, ink: '#8a3a10' }));
  out.push(S(starPts(10.4, 5.8, 3.2, 1.4, 8, -70), '#fff3c0'));
  out.push(...puffs([[13.6, 9.4, 1.6], [6.6, 2.6, 1.4], [14, 2.6, 1.2]], '#fff6ee', { shadow: false, dark: '#e8c8b8', ink: '#8a4a3a' }));
  out.push(...arrow([1.4, 14.6], [9, 7.2], { hw: 1.3, hl: 2, fl: '#6fc8ff' }));
  out.push(...spark(2.6, 3, 1.1, '#fff3a6'));
  return out;
}

function snarearrow() {
  const out = [...tile('hawk', 'passive'), ...aura(9, 8, 6.6, '#fff8e0')];
  // A rope net spread over the tile, knotted, an arrow pinning it.
  const rope = '#a8743e';
  for (let k = -3; k <= 3; k++) {
    out.push(S(tube([[3 + k * 2.6, 2.4], [9 + k * 2.6, 14.4]], 0.32), rope), S(tube([[9 + k * 2.6, 2.4], [3 + k * 2.6, 14.4]], 0.32), rope));
  }
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) out.push(S(oval(8 + (a + b) * 1.3, 8.4 + (b - a) * 2.6, 0.5, 0.5, 0, 8), '#f0d6a0'));
  out.push(...arrow([1.2, 3], [12.6, 12.4], { hw: 1.2, hl: 1.9, fl: '#6fc8ff' }));
  out.push(...spark(13.6, 2.6, 1.1));
  return out;
}

function springtrap() {
  const out = [...tile('steel', 'passive'), ...aura(8, 10, 6.4, '#e4f2ff')];
  // A steel trap snapping shut, its teeth meeting, sparks flying off it.
  for (const sd of [-1, 1]) {
    const jaw = arcPts(8, 11.4, 5.6, 5.6 * 0.9, sd > 0 ? -90 : 90, sd > 0 ? 0 : 180, 10);
    out.push(...solid(tube(jaw, 0.9), '#c8d8f4', { shadow: false, d: 0.35, ink: '#2a3a6a' }));
  }
  for (let k = 0; k < 5; k++) out.push(...solid([[4 + k * 2, 7.8], [5 + k * 2, 10.2], [3 + k * 2 + 0.6, 10]], '#ffffff', { shadow: false, d: 0.25, ink: '#2a3a6a' }));
  out.push(...solid(oval(8, 13.4, 5.2, 1.4, 0, 20), '#ffc94a', { shadow: false, d: 0.35, ink: '#7a4a10' }));
  out.push(...spark(2.6, 3, 1.1, '#ffffff'), ...spark(13.4, 2.4, 1.2, '#fff3a6'));
  return out;
}

function vault() {
  const out = [...tile('skyblue', 'active'), ...aura(8, 6, 6.6, '#eef8ff')];
  // A leap arcing up and over, an arrow loosed back down from the far side.
  const arc = arcPts(8, 11, 6, 7.4, 180, 360, 20);
  out.push(...solid(tube(arc, 0.7), '#fff6dc', { shadow: false, d: 0.3, ink: '#2a3a8a' }));
  out.push(...solid(polyPts(14, 11, 1.6, 3, 90, 1), '#fff6dc', { shadow: false, d: 0.3, ink: '#2a3a8a' }));
  out.push(...solid(oval(8, 14.4, 2.4, 1.1, 0, 14), '#8a6a9a', { shadow: false, d: 0.3, ink: '#3a2a4a' }));
  out.push(...arrow([14.6, 3.2], [3.4, 9.4], { hw: 1.2, hl: 1.9, fl: '#ffd25a' }));
  out.push(...spark(2.4, 2.6, 1.1));
  return out;
}

function steadyhands() {
  const out = [...tile('hawk', 'passive'), ...aura(8, 8, 6.6, '#fff8e0')];
  // A drawn bow held dead still on a sight.
  out.push(...sightArt(10, 8, 4.4, '#ff8aa8', 0.5));
  out.push(...longbow([3.4, 14.2], [2.8, 1.8], 2.2, { grip: '#3a74d0' }));
  out.push(...arrow([3.4, 8.2], [12.6, 8], { hw: 1.2, hl: 1.9, fl: '#6fc8ff' }));
  out.push(...glint(6.2, 4.4, 0.5), ...spark(13.6, 13.4, 1.1));
  return out;
}

function lightfeet() {
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

function cometarrow() {
  const out = [...tile('fire', 'active'), ...aura(10, 11, 6.6, '#fff3c0', 1.3)];
  // A flaming arrow plunging into the ground in a burst, its fire tail streaming back up the tile.
  out.push(...flame(4.8, 7.6, 4.4, 9, ['#c8452e', '#ffa23c', '#fff3c0'], { shadow: false, lean: -0.9 }));
  out.push(...solid(starPts(10.6, 12.2, 5, 2, 8, -90), '#ffc94a', { shadow: false, d: 0.45, ink: '#8a3a10' }));
  out.push(S(starPts(10.6, 12.2, 2.8, 1.1, 8, -70), '#fffbe0'));
  out.push(...arrow([2.4, 2.6], [10.2, 11.6], { hw: 1.7, hl: 2.6, sw: 0.7, fl: '#ff8a3c', head: '#fff6c0' }));
  out.push(...spark(13.6, 3, 1.2, '#fff3a6'), ...spark(14.4, 8, 0.8));
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

// A crossbow seen side-on, pointing along base -> tip: the stock, the prod across its front, the
// string drawn back, and a bolt laid in it.
function crossbowArt(base, tip, o = {}) {
  const { wood = '#8a5a3a', prod = '#cfe0ff', bolt0 = '#ff5a7a' } = o;
  const u = N(base, tip);
  const n = [-u[1], u[0]];
  const p = along(base, u, n);
  const len = Math.hypot(tip[0] - base[0], tip[1] - base[1]);
  const stock = tube([p(0, 0.4), p(len * 0.45, 0), p(len, 0)], (t) => 1.5 - 0.6 * t);
  const pr = tube(bez(p(len - 1.6, -4.6), p(len + 1.2, 0), p(len - 1.6, 4.6), 14), (t) => 0.5 + 0.5 * Math.sin(Math.PI * t));
  const bolt1 = arrow(p(len * 0.35, 0), p(len + 2.6, 0), { hw: 1.1, hl: 1.7, sw: 0.45, fl: bolt0, head: '#ffffff', shadow: false });
  return [drop(stock), drop(pr), line([p(len - 1.6, -4.6), p(len * 0.42, 0), p(len - 1.6, 4.6)], 0.25, '#fff6e0'), ...edge(stock, ink(wood), 0.45), S(stock, wood), S(tube([p(0.5, -0.3), p(len - 1, -0.3)], 0.3), lt(wood)), ...edge(pr, ink(prod), 0.45), S(pr, prod), ...bolt1];
}

// A sight: a ring with four ticks, in the Sniper's rose.
function sightArt(cx, cy, r, c = '#ff5a7a', w = 0.6) {
  const ring = tube([...oval(cx, cy, r, r, 0, 32), oval(cx, cy, r, r, 0, 32)[0]], w);
  const ticks = [0, 90, 180, 270].map((a) => {
    const v = [Math.cos(a * D2R), Math.sin(a * D2R)];
    return tube([add([cx, cy], v, r - 1.4), add([cx, cy], v, r + 1.6)], w);
  });
  return [...edge(ring, ink(c), 0.35), S(ring, c), ...ticks.flatMap((t) => [...edge(t, ink(c), 0.3), S(t, c)])];
}

// A crescent moon bulging toward +x (turned by `rot` degrees), silver-blue moonlight.
function moonCrescent(cx, cy, r, rot = 0) {
  const outer = arcPts(cx, cy, r, r, -100, 100, 16);
  const inner = arcPts(cx - r * 0.45, cy, r * 0.85, r * 0.85, 72, -72, 16);
  return turn([...outer, ...inner], rot, cx, cy);
}
const MOON = '#e4eeff';
const MOON_INK = '#3f4f9e';
// Snow wolf's head, facing the viewer: a white wolf cut with ice-blue tips, wolf ears, half-shut
// blue eyes and a bored mouth. `tilt` turns it (degrees), for the howl.
function snowHead(cx, cy, k = 1, tilt = 0, howling = false) {
  const P = (pts) => turn(pts.map(([x, y]) => [cx + x * k, cy + y * k]), tilt, cx, cy);
  const out = [];
  for (const s of [-1, 1]) {
    out.push(...solid(P([[s * 1.4, -2.6], [s * 3.4, -6], [s * 3.8, -2]]), '#f4f6fc', { shadow: false, d: 0.35, ink: '#3a4664' }));
    out.push(S(P([[s * 2.2, -2.8], [s * 3.3, -4.8], [s * 3.4, -2.6]]), '#c8d4ea'));
  }
  out.push(...solid(P(oval(0, 0, 4.2, 3.8, 0, 24)), '#f4f6fc', { d: 0.4, ink: '#3a4664' }));
  out.push(S(P([[-3.6, 1.2], [-4.2, 3.6], [-3, 2.6], [-2.6, 3.8], [-2, 2]]), '#9fd8ff'), S(P([[3.6, 1.2], [4.2, 3.6], [3, 2.6], [2.6, 3.8], [2, 2]]), '#9fd8ff'));
  out.push(S(P(oval(0, 1.2, 2.6, 2.2, 0, 18)), '#fff0e6'));
  for (const s of [-1, 1]) {
    out.push(S(P([[s * 0.6, 0.6], [s * 2, 0.4], [s * 2, 1], [s * 0.6, 1.1]]), '#1e2a48'));
    out.push(S(P([[s * 1, 1], [s * 1.8, 1], [s * 1.6, 1.5], [s * 1.1, 1.5]]), '#4fc8ff'));
    out.push(S(P([[s * 0.7, -0.6], [s * 1.9, -0.7], [s * 1.9, -0.2], [s * 0.7, -0.1]]), '#3a4664'));
  }
  out.push(howling ? S(P(oval(0, 2.7, 0.7, 0.8, 0, 10)), '#7a2a3a') : S(P([[-0.8, 2.6], [0.8, 2.6], [0.8, 2.9], [-0.8, 2.9]]), '#b04a5a'));
  return out;
}
// The Fang of the Wolf Queen in small: a broad pale blade with a crescent cut through it, a silver
// guard and a gold pommel with an ice stone.
const fang = (base, tip, o = {}) => sword(base, tip, { w: 2.6, metal: '#eef3fb', guard: '#dfe6f2', grip: '#f4f1ea', gem: '#8fe6ff', ...o });

function beastmastery() {
  const out = [...tile('mint', 'passive'), ...aura(8, 8, 6.6, '#f4fff0')];
  // A bow with a crescent moon tied to the grip.
  out.push(...longbow([3.4, 14.2], [2.8, 1.8], 2.2, { grip: '#3aa060' }));
  out.push(...arrow([3.4, 8.2], [14.4, 7.8], { hw: 1.25, hl: 2, fl: '#9cf0b8' }));
  out.push(...solid(moonCrescent(10.8, 11.8, 2.4, 200), MOON, { d: 0.35, ink: MOON_INK }));
  out.push(...spark(13.6, 2.6, 1.1, '#ffffff'));
  return out;
}

// Wild Hunt: three green arrows streaming forward, the Fang of the Wolf Queen cutting across
// beside them, leaves tumbling on the wind.
function wildhunt() {
  const out = [...tile('mint', 'passive'), ...aura(8, 8, 6.6, '#f4fff0')];
  out.push(...swoosh(8, 8.6, 6.4, 5.6, -150, 30, 1.2, '#bdf5d6', { ink: '#13706e' }));
  out.push(...fang([2.6, 13.6], [13.6, 4.4], { w: 2.2 }));
  for (const [y, x0] of [[4.2, 1.6], [7.8, 3.2], [11.6, 5.2]]) out.push(...arrow([x0, y], [x0 + 9.4, y - 0.6], { hw: 1.1, hl: 1.8, fl: '#9cf0b8' }));
  out.push(...leaf([11.6, 13.6], [14.2, 11.2], 1.4, '#7ad860').shapes, ...leaf([2.2, 3.8], [4.4, 1.8], 1.1, '#7ad860').shapes);
  out.push(...spark(14, 2.4, 1, '#ffffff'));
  return out;
}

function wolfpounce() {
  const out = [...tile('indigo', 'passive'), ...aura(8, 8, 6.8, '#dce8ff', 1.2)];
  // Fine, I'll Go: the greatsword swung round in a full ring of moonlight.
  out.push(...swoosh(8, 8.4, 6, 5.6, -200, 20, 1.6, '#cfe0ff', { ink: MOON_INK }));
  out.push(...fang([4.6, 11.4], [14, 3.2]));
  out.push(...swoosh(8, 8.4, 6, 5.6, 40, 150, 1.2, '#cfe0ff', { ink: MOON_INK }));
  out.push(...spark(2.4, 2.8, 1.1, '#ffffff'));
  return out;
}

function hawkstrike() {
  const out = [...tile('royal', 'passive'), ...aura(8, 9, 6.6, '#dce8ff', 1.2)];
  // Moonfall: a crescent moon high up, a beam of moonlight crashing down from it.
  out.push(...solid(moonCrescent(8.4, 3.4, 2.4, 160), MOON, { d: 0.35, ink: MOON_INK }));
  const beam = [[6.4, 5.4], [9.6, 5.4], [11, 14], [5, 14]];
  out.push(S(beam, '#9cb8f4'), S([[7.4, 5.4], [8.6, 5.4], [9.4, 14], [6.6, 14]], '#eef4ff'));
  out.push(...solid(starPts(8, 13.2, 3, 1.1, 4, -90), '#ffffff', { shadow: false, d: 0.3, ink: MOON_INK }));
  out.push(...spark(13.4, 9, 1, '#ffffff'), ...spark(2.6, 10.4, 0.8, '#ffffff'));
  return out;
}

function packhowl() {
  const out = [...tile('indigo', 'passive'), ...aura(8, 9, 6.6, '#dce8ff', 1.2)];
  // Lunar Howl: Snow wolf howling (grudgingly) under a pale full moon, rings racing out.
  out.push(...solid(oval(12.4, 3.6, 2.4, 2.4, 0, 18), MOON, { shadow: false, d: 0.35, ink: MOON_INK }));
  out.push(S(oval(11.8, 3, 0.6, 0.6, 0, 8), '#c4d2f0'), S(oval(13, 4.4, 0.5, 0.5, 0, 8), '#c4d2f0'));
  for (const r of [3.4, 5.2]) out.push(...swoosh(4.4, 7.6, r, r, -160, -40, 0.7, '#dce8ff', { ink: MOON_INK }));
  out.push(...snowHead(7.4, 10.4, 0.95, -18, true));
  return out;
}

function loyalguard() {
  const out = [...tile('glacier', 'passive'), ...aura(8, 9, 6.8, '#dce8ff', 1.1)];
  // Moon Ward: the greatsword planted point-down, a crescent shield of moonlight round it, a hit
  // glancing off.
  out.push(...swoosh(7.4, 8.6, 5, 6.4, -70, 70, 1.6, '#cfe0ff', { ink: MOON_INK }));
  out.push(...fang([7.4, 3.4], [7.4, 14.6], { w: 2.8 }));
  out.push(streak([14.6, 2.4], [12.2, 4.6], 0.9, '#ffffff'), streak([15, 5], [12.8, 6], 0.7, '#ffffff'));
  out.push(...spark(2.4, 13, 1, '#ffffff'));
  return out;
}

function alpha() {
  const out = [...tile('royal', 'passive'), ...aura(7, 7.4, 7, '#e8f0ff', 1.3)];
  // Queen's Awakening: the silver wolf's head on the greatsword's guard, the blade in its jaws,
  // crowned, its ice-blue eye open and burning.
  out.push(...fang([7.6, 9.6], [15, 13.6], { w: 2.6 }));
  const P = (pts) => pts.map(([x, y]) => [1 + x * 0.78, 1.4 + y * 0.78]);
  out.push(...solid(P([[3, 6], [3.6, 1.6], [6, 4.6]]), '#eef3fb', { shadow: false, d: 0.35, ink: '#2e3850' }));
  out.push(...solid(P([[5.6, 5], [6.6, 1], [8.4, 4.4]]), '#eef3fb', { shadow: false, d: 0.35, ink: '#2e3850' }));
  const head = P([[2.4, 7], [4.4, 4.4], [8.6, 4.2], [12.4, 6.4], [14.4, 8.4], [13.6, 10], [9.6, 10], [11, 12.6], [5.6, 13.6], [2.4, 11]]);
  out.push(...solid(head, '#eef3fb', { d: 0.45, ink: '#2e3850', light: '#ffffff' }));
  out.push(S(oval(12.2, 8.1, 0.7, 0.6, 0, 10), '#2a3048'));
  out.push(...solid(P([[7.4, 6.6], [10, 6.8], [9, 7.8]]), '#8fe6ff', { shadow: false, d: 0.3, ink: '#1c6a96' }));
  out.push(...spark(8.4, 6.8, 1.5, '#e8fbff'));
  out.push(...solid(P([[4.6, 4.4], [5, 2], [6, 3.2], [7, 1.4], [8, 3.2], [9, 2], [9.4, 4.4]]), '#f2c94c', { shadow: false, d: 0.3, ink: '#8a5a10' }));
  return out;
}

function snacktime() {
  const out = [...tile('dawn', 'buff'), ...aura(8, 8.4, 6.8, '#fff6e0', 1.2)];
  // Snack Time: a moon cookie with a crescent of blue icing, crumbs, little hearts.
  out.push(...solid(oval(8, 8.6, 5.2, 5, 0, 26), '#e8c08a', { d: 0.45, ink: '#8a5a30', light: '#f8dcb0' }));
  out.push(...solid(moonCrescent(8.6, 8, 2.6, 0), '#cfe0ff', { shadow: false, d: 0.3, ink: MOON_INK }));
  for (const [x, y] of [[5, 6], [6.4, 11.6], [10.8, 11.4]]) out.push(S(oval(x, y, 0.5, 0.45, 0, 8), '#8a5a30'));
  for (const [x, y, s] of [[13, 3, 1.2], [3, 3.2, 1]]) out.push(...solid(heartPts(x, y, s * 2.2), '#ff7aa8', { shadow: false, d: 0.3, ink: '#a8306a' }));
  return out;
}

function stampede() {
  const out = [...tile('indigo', 'active'), ...aura(8, 7, 7, '#e8f0ff', 1.4)];
  // Last Straw: a great full moon, crescents of moonlight sweeping out under it, and an anger vein.
  out.push(...solid(oval(8, 6, 4.6, 4.6, 0, 28), MOON, { d: 0.45, ink: MOON_INK, light: '#ffffff' }));
  for (const [x, y, r] of [[6.4, 4.6, 0.9], [9.6, 7.4, 1.2], [9.2, 3.8, 0.6]]) out.push(S(oval(x, y, r, r, 0, 10), '#c4d2f0'));
  for (const [y, rx] of [[12.2, 7], [14.2, 6]]) out.push(...swoosh(8, y - 4, rx, 4, 40, 140, 1.3, '#cfe0ff', { ink: MOON_INK }));
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) out.push(S(tube([[12.6 + sx * 0.5, 3 + sy * 1.5], [12.6 + sx * 0.5, 3 + sy * 0.5], [12.6 + sx * 1.5, 3 + sy * 0.5]], 0.55), '#ff4d6d'));
  out.push(...spark(2, 3, 0.8, '#ffffff'));
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

function nimblefeet() {
  const out = [...tile('shadow', 'passive'), ...aura(8, 8, 6.6, '#e6dcff')];
  out.push(...swoosh(9, 12, 6.6, 4, 150, 260, 1.4, '#c4b6ff', { ink: '#2a1f5e' }));
  const f = leaf([3.6, 13.4], [13.4, 2.4], 5, '#f8f4ff', { bend: -1.4, rib: '#c9b8ff', veins: 4, veinC: '#d8ccf0' });
  out.push(drop([...f.A, ...f.B.slice().reverse()]), ...edge([...f.A, ...f.B.slice().reverse()], '#3a2a70', 0.45), ...f.shapes);
  out.push(S(tube([[2.4, 14.8], [4.4, 12.6]], 0.55), '#c9b8ff'));
  // Notches in the vane.
  out.push(S([[9, 6], [11, 5.2], [10.6, 6]], '#4a3a90'), S([[6, 10.6], [5.6, 9.2], [6.6, 9.8]], '#4a3a90'));
  out.push(...spark(13.6, 12.6, 1.2), ...spark(2.6, 3, 1.1, '#fff3a6'));
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

function daggermastery() {
  const out = [...tile('shadow', 'passive'), ...aura(8, 8, 6.6, '#e6dcff')];
  out.push(...solid(crescentPts(8, 8.4, 5.8), '#e8e4ff', { d: 0.4, ink: '#2a1a6a' }));
  out.push(...sword([4.6, 13], [11.8, 3.4], { w: 2.2, gw: 3.4, glen: 2, guard: '#c9a6ff', grip: '#3a2d4f', gem: '#7fd8ff' }));
  out.push(...glint(6, 5, 0.5), ...spark(13.6, 12.6, 1.1));
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

function gauntletmastery() {
  const out = [...tile('shadow', 'passive'), ...aura(8, 8, 6.6, '#e6dcff')];
  // A gauntlet's knuckle plate with a star held up from it.
  const glove = [[3.4, 15], [3.2, 10.4], [4.6, 8.6], [11.4, 8.6], [12.8, 10.4], [12.6, 15]];
  out.push(...solid(glove, '#6a4ab8', { d: 0.45, ink: '#2a1a6a' }));
  out.push(...[4.8, 7.1, 9.4, 11.6].map((x) => S(oval(x, 9.4, 1, 0.8, 0, 10), '#c9b4ff')));
  out.push(...throwStar(8, 4.6, 3.6, -20));
  out.push(...glint(5.6, 11.6, 0.5), ...spark(13.6, 3, 1.1, '#fff6ff'));
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

// ---------- The mage paths' shrine pieces (paper streamers, wisps of spirit light) ----------
const SCARLET = '#e0303e';
// A wisp of spirit light: a bright round head, a soft tail behind it.
function wisp(x, y, r, ang = 0) {
  const c = Math.cos(ang * D2R);
  const sn = Math.sin(ang * D2R);
  const tail = [[x - c * r * 2.6, y - sn * r * 2.6], [x - c * r * 1.2, y - sn * r * 1.2], [x, y]];
  return [S(tube(tail, 0.2, r * 1.4), '#e6dcff'), S(tube(tail.slice(1), 0.2, r * 0.9), W), ...solid(oval(x, y, r, r, 0, 16), W, { d: 0.35, ink: '#7a6cb8' }), S(oval(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.4, 0, 10), '#fff3c4')];
}
// ---------- Star Witch (midnight blue and gold: stars, comets, constellations) ----------
const STARG = '#ffd36a';
const STARINK = '#8e5228';
// A five-point star's points round (cx, cy), r out to its tips.
const star5Pts = (cx, cy, r, rot = 0) => Array.from({ length: 10 }, (_, i) => {
  const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
  const rr = i % 2 ? r * 0.45 : r;
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
});
const goldStar = (cx, cy, r, rot = 0) => solid(star5Pts(cx, cy, r, rot), STARG, { d: 0.35, ink: STARINK });
// A comet's tail: a midnight-to-white streak from (x0, y0) to its head at (x1, y1).
const cometTrail = (x0, y0, x1, y1, w) => [S(tube([[x0, y0], [x1, y1]], 0.2, w), '#3a48b8'), S(tube([[x0 + (x1 - x0) * 0.4, y0 + (y1 - y0) * 0.4], [x1, y1]], 0.15, w * 0.55), '#c8d0ff')];
function spiritbolt() {
  const out = [...tile('midnight', 'active')];
  out.push(...cometTrail(1.6, 13, 9.6, 6, 2.6), ...goldStar(10.4, 5.4, 3.6, 0.2));
  out.push(...spark(3, 3.4, 1, STARG), ...spark(13.6, 12.4, 0.8));
  return out;
}
// Star Step: a burst of sparkles where she was, and a star where she pops out.
function spiritstep() {
  const out = [...tile('midnight', 'active')];
  for (const [x, y, r] of [[3, 10, 1.2], [4.6, 6.6, 0.9], [2.2, 4.4, 0.7], [5.6, 12.4, 0.8]]) out.push(...spark(x, y, r, STARG));
  out.push(streak([5, 9], [10, 8.4], 0.6, '#9aa6f0'), ...goldStar(11.4, 8, 3.2));
  return out;
}
// Comet: a great comet with a ring round its head.
function spiritwave() {
  const out = [...tile('midnight', 'active'), ...aura(10, 6, 5.6, '#fff4c8')];
  out.push(...cometTrail(0.8, 15, 8.6, 7.4, 4));
  out.push(...edge(tube(arcPts(10.2, 5.8, 4, 4, 0, 360, 24), 0.9), STARINK, 0.35), S(tube(arcPts(10.2, 5.8, 4, 4, 0, 360, 24), 0.9), STARG));
  out.push(...goldStar(10.2, 5.8, 2.8, 0.3));
  return out;
}
// Wishing Star: a star falling into a column of soft gold light.
function blessing() {
  const out = [...tile('midnight', 'buff')];
  out.push(S([[6, 6], [10, 6], [12.6, 15], [3.4, 15]], '#fff4c8'), S([[7.2, 6], [8.8, 6], [9.8, 15], [6.2, 15]], W));
  out.push(...cometTrail(8, 0.4, 8, 3.6, 1.6), ...goldStar(8, 5, 2.8));
  out.push(...spark(3.4, 9, 0.9, STARG), ...spark(12.6, 10.4, 0.9, STARG));
  return out;
}
// Star Veil: a dome of linked stars.
function spiritward() {
  const out = [...tile('midnight', 'buff')];
  out.push(S(arcPts(8, 13.4, 6, 9, 180, 360, 20), '#6a78d8'));
  const pts = arcPts(8, 13.4, 6, 9, 180, 360, 6);
  for (let i = 0; i < pts.length - 1; i++) out.push(streak(pts[i], pts[i + 1], 0.35, STARG));
  pts.forEach(([x, y], i) => out.push(...(i % 2 ? spark(x, y, 1, W) : goldStar(x, y, 1.4))));
  return out;
}
// Mana Mastery: a star wand crossed by a crescent moon.
function manamastery() {
  const out = [...tile('midnight', 'passive'), ...aura(8, 8, 6.6, '#c8d0ff')];
  out.push(...solid([[3.4, 14], [4.6, 14.6], [10.4, 7.6], [9.2, 7]], '#2a2230', { d: 0.3 }));
  out.push(...goldStar(10.6, 5.6, 3.2, 0.2));
  out.push(...solid([...arcPts(5, 5, 3, 3, 60, 300, 10), ...arcPts(6.4, 4.8, 2.4, 2.5, 300, 60, 10)], '#c8d0ff', { d: 0.3, ink: '#222a7e' }));
  return out;
}
// Starfall: the constellation joined in gold, meteors falling from it.
function heavenslantern() {
  const out = [...tile('midnight', 'active'), ...aura(8, 8, 7, STARG, 1.2, 5)];
  const c = [[2.4, 4], [5.4, 2.4], [8.6, 3.6], [11.4, 1.8], [13.6, 3.8]];
  for (let i = 0; i < c.length - 1; i++) out.push(streak(c[i], c[i + 1], 0.35, STARG));
  c.forEach(([x, y]) => out.push(...spark(x, y, 1, W)));
  for (const [x, y] of [[4.6, 12.4], [9.6, 10.8], [13, 14]]) out.push(...cometTrail(x - 3, y - 4, x, y, 1.6), ...goldStar(x, y, 1.8));
  return out;
}
// ---------- The Starlight Idol (pink and gold: notes, hearts, her mic, the stage) ----------
const IPINK = '#ff8fc0';
const IPINKINK = '#8a2a5e';
// A music note: a round head with a stem and a flag (or two beamed together, `pair`).
function noteIcon(x, y, r, c = IPINK, pair = false) {
  const head = (hx, hy) => solid(turn(oval(hx, hy, r * 0.62, r * 0.46, 0, 14), -20, hx, hy), c, { d: 0.3, ink: IPINKINK });
  const stem = (hx, hy) => S(rect(hx + r * 0.38, hy - r * 2.1, r * 0.26, r * 2.1), IPINKINK);
  if (pair) {
    return [stem(x - r, y), stem(x + r * 0.8, y - r * 0.3), S([[x - r + r * 0.38, y - r * 2.1], [x + r * 0.8 + r * 0.64, y - r * 2.4], [x + r * 0.8 + r * 0.64, y - r * 1.8], [x - r + r * 0.38, y - r * 1.5]], IPINKINK), ...head(x - r, y), ...head(x + r * 0.8, y - r * 0.3)];
  }
  return [stem(x, y), S([[x + r * 0.38, y - r * 2.1], [x + r * 1.3, y - r * 1.3], [x + r * 1.1, y - r * 0.9], [x + r * 0.6, y - r * 1.4]], IPINKINK), ...head(x, y)];
}
// A heart, `r` across half its width.
function heartIcon(x, y, r, c = IPINK) {
  const pts = Array.from({ length: 24 }, (_, j) => {
    const t = (j / 24) * Math.PI * 2;
    return [x + (Math.sin(t) ** 3) * r, y - ((13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16) * r];
  });
  return solid(pts, c, { d: 0.35, ink: IPINKINK });
}
// Her mic: a gold handle and a round pink head with a gold band, standing at (x, y) (its foot).
function micIcon(x, y, h, lean = 0) {
  const top = turn([[x, y - h]], lean, x, y)[0];
  const r = h * 0.3;
  return [S(tube([[x, y], [top[0], top[1] + r * 0.6]], h * 0.11, h * 0.08), '#e8a83a'), ...solid(oval(top[0], top[1], r, r, 0, 18), IPINK, { d: 0.35, ink: IPINKINK }), S(rect(top[0] - r, top[1] + r * 0.05, r * 2, r * 0.32), '#ffd36a')];
}
// Stage Presence (the Starlight Idol): her mic on a stand in a spotlight's glow.
function shrinemastery() {
  const out = [...tile('idolbg', 'passive'), ...aura(8, 7, 6.6, '#fff0f6', 1.2)];
  out.push(S([[7, 0.8], [9, 0.8], [11.6, 15], [4.4, 15]], '#fff2f8'));
  out.push(S(tube([[8, 14.4], [8, 7.6]], 0.4, 0.4), '#8a5a2a'), S(oval(8, 14.6, 3, 0.8, 0, 14), '#8a5a2a'));
  out.push(...micIcon(8, 8.4, 5.6));
  out.push(...spark(3.2, 4, 1, '#ffd36a'), ...spark(13, 3.4, 0.9));
  return out;
}
// Healing Song: a heart with notes rising off it.
function grandblessing() {
  const out = [...tile('idolbg', 'active'), ...aura(7, 10, 6.4, '#fff0f6', 1.1)];
  out.push(...heartIcon(6.6, 10.4, 4.6));
  out.push(...noteIcon(11.6, 7, 1.6, '#ffd36a'), ...noteIcon(12.6, 13.4, 1.2));
  out.push(...spark(3, 3.4, 1), ...spark(9.4, 2.4, 0.9, '#ffd36a'));
  return out;
}
// Cheer: the mic thrust up in a burst of gold stars.
function idolcheer() {
  const out = [...tile('idolbg', 'buff'), ...aura(9, 6, 6.4, '#fff4c8', 1.3, 5)];
  out.push(...goldStar(10.4, 5, 3.6, 0.1), ...goldStar(3.6, 3.6, 1.6, 0.4), ...goldStar(13.4, 11.6, 1.4, 0.2));
  out.push(...micIcon(5.6, 15, 9.4, 20));
  out.push(...spark(13.2, 1.8, 1));
  return out;
}
// Lullaby: a sleepy crescent moon with a soft lilac note and a "z".
function purification() {
  const out = [...tile('lullbg', 'active'), ...aura(7, 8, 6, '#f4e4ff', 1.1)];
  out.push(...solid([...arcPts(7, 8.4, 5.2, 5.2, 70, 290, 14), ...arcPts(9.4, 7.6, 4.2, 4.2, 280, 80, 14)], '#e6d2ff', { d: 0.35, ink: '#5a3a9a' }));
  out.push(...noteIcon(12, 13, 1.4, '#d4b0ff'));
  out.push(S([[10.4, 2], [13.6, 2], [13.6, 2.8], [11.6, 5], [13.6, 5], [13.6, 5.8], [10.4, 5.8], [10.4, 5], [12.4, 2.8], [10.4, 2.8]], '#fff0f6'));
  out.push(...spark(3, 13.4, 0.9, '#ffd36a'));
  return out;
}
// Curtain Call: pink stage curtains drawn back, a burst of light where she bows.
function resurrection() {
  const out = [...tile('idolbg', 'active'), ...aura(8, 9, 5.6, '#fff4c8', 1.3)];
  out.push(S(rect(1, 1, 14, 1.8), '#ffd36a'));
  out.push(...solid([[1, 2.6], [5.6, 2.6], [4, 7], [2.8, 15], [1, 15]], '#e0609e', { d: 0.35, ink: IPINKINK }));
  out.push(...solid([[15, 2.6], [10.4, 2.6], [12, 7], [13.2, 15], [15, 15]], '#e0609e', { d: 0.35, ink: IPINKINK }));
  out.push(...goldStar(8, 9.4, 3, 0), ...heartIcon(8, 14, 1.2, '#fff0f6'));
  out.push(...spark(8, 3.6, 1));
  return out;
}
// Grand Concert (her finisher): the stage of light, two spotlights crossing on her mic, notes over it.
function thousandtorii() {
  const out = [...tile('idolbg', 'active'), ...aura(8, 9, 7, '#fff4c8', 1.3, 5)];
  out.push(S([[0.6, 0.6], [2, 0.6], [9.4, 12], [7.4, 12]], '#fff4c8'), S([[15.4, 0.6], [14, 0.6], [6.6, 12], [8.6, 12]], '#ffeaf4'));
  out.push(...solid(rect(1.4, 12.4, 13.2, 2.6), IPINK, { d: 0.35, ink: IPINKINK }), S(rect(1.4, 12, 13.2, 0.9), '#ffd36a'));
  out.push(...micIcon(8, 12, 6.4));
  out.push(...noteIcon(3.2, 7, 1.2, '#ffd36a'), ...noteIcon(12.2, 6, 1.2, '#fff0f6'));
  return out;
}
// Onmyodo (the Onmyoji): a paper talisman with a red five-pointed star seal on it.
function onmyodo() {
  const out = [...tile('indigo', 'passive'), ...aura(8, 8, 6.4, '#e6dcff')];
  out.push(...solid([[4.6, 1.4], [11.4, 1.4], [11.4, 14.6], [4.6, 14.6]], '#fbf8ff', { d: 0.35, ink: '#5a4a8a' }));
  const star = [];
  for (let k = 0; k <= 5; k++) {
    const a = (-90 + k * 144) * D2R;
    star.push([8 + Math.cos(a) * 2.6, 8 + Math.sin(a) * 2.6]);
  }
  out.push(S(tube(star, 0.45, 0.45), '#d8323e'), S(tube(arcPts(8, 8, 3.2, 3.2, 0, 360, 20), 0.3, 0.3), '#d8323e'));
  out.push(S(tube([[6.2, 3], [9.8, 3]], 0.35, 0.35), '#2a2440'), S(tube([[6.6, 13], [9.4, 13]], 0.35, 0.35), '#2a2440'));
  out.push(...spark(13.4, 3, 0.9, '#ffd36a'));
  return out;
}

// A five-pointed star seal (onmyodo's seiman) at (cx, cy), radius r.
function seimanStar(cx, cy, r, c, w = 0.45) {
  const star = [];
  for (let k = 0; k <= 5; k++) {
    const a = (-90 + k * 144) * D2R;
    star.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return [S(tube(star, w, w), c), S(tube(arcPts(cx, cy, r * 1.2, r * 1.2, 0, 360, 20), w * 0.7, w * 0.7), c)];
}
// A paper talisman at (x, y) turned `deg`, with its red star.
function ofudaTag(x, y, deg) {
  const tag = turn(rect(x - 1.6, y - 3.2, 3.2, 6.4), deg, x, y);
  return [...solid(tag, '#fbf8ff', { d: 0.3, ink: '#5a4a8a', shadow: false }), ...seimanStar(x, y - 0.6, 1, '#d8323e', 0.3)];
}
// Ofuda Barrage: a fan of three talismans flying out, one bursting red.
function ofudabarrage() {
  const out = [...tile('indigo', 'active'), ...aura(11, 6, 5, '#ffd0d4')];
  out.push(...ofudaTag(4.4, 11, -30), ...ofudaTag(8, 8.6, 10), ...ofudaTag(11.6, 6.2, 45));
  out.push(...spark(13.6, 3, 1.2, '#ff5a5a'), ...spark(14, 9, 0.8, '#ff9aa0'));
  return out;
}
// Seiman Seal: the five-pointed star glowing red on the ground, seen from above.
function seimanseal() {
  const out = [...tile('indigo', 'active'), ...aura(8, 8, 7, '#ffd0d4', 1.1)];
  out.push(...seimanStar(8, 8.4, 5, '#ff3a46', 0.6));
  out.push(...spark(13.4, 2.6, 1, '#ffd36a'), ...spark(2.6, 13.4, 0.8, '#ff9aa0'));
  return out;
}
// Yokai Rally: a talisman held high, three red stars over it (the troupe answering).
function yokairally() {
  const out = [...tile('indigo', 'buff'), ...aura(8, 9, 6, '#ffd0d4')];
  out.push(...ofudaTag(8, 10.4, 0));
  out.push(...seimanStar(3.4, 3.8, 1.5, '#ff3a46', 0.35), ...seimanStar(8, 2.6, 1.7, '#ff3a46', 0.35), ...seimanStar(12.6, 3.8, 1.5, '#ff3a46', 0.35));
  return out;
}
// Troupe Combo: the three of them at once: a snowflake, a black feather and the oni's crimson
// club crossed over a red star seal.
function troupecombo() {
  const out = [...tile('indigo', 'active'), ...aura(8, 8, 7, '#ffd0d4', 1.1)];
  out.push(...seimanStar(8, 8.4, 5.2, '#ff3a46', 0.4));
  out.push(...solid(tube([[3.2, 13.4], [12.2, 3.2]], 1.5), '#c4242a', { d: 0.35, ink: '#5a0a10' }));
  out.push(...solid([[11.4, 2.4], [14, 3.4], [7, 12.6], [5.6, 11.6]], '#17151f', { shadow: false, d: 0.3, ink: '#3a4a7a' }));
  for (const a of [0, 60, 120]) out.push(S(tube([[4.6 + Math.cos(a * D2R) * 2.6, 4.6 + Math.sin(a * D2R) * 2.6], [4.6 - Math.cos(a * D2R) * 2.6, 4.6 - Math.sin(a * D2R) * 2.6]], 0.45, 0.45), '#cfe4fb'));
  out.push(...spark(13.4, 13, 1, '#ffd36a'));
  return out;
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
  blastarrow, snarearrow, springtrap, vault, steadyhands, lightfeet, cometarrow,
  beastmastery, wildhunt, wolfpounce, hawkstrike, packhowl, loyalguard, alpha, snacktime, stampede,
  engmastery, stickybolt, clusterbolt, steamvent, deployturret, overclock, bigbertha,
  shadowdash, quickhaste, nimblefeet, twinfang, backstab, daggermastery, moonlitassassin, luckyseven, starfan, gauntletmastery, fullmoonvolley,
  ringmastery, rebound, twinrings, goldencarousel,
  skymastery, updraft, zephyr, skywaltz,
  spiritbolt, spiritstep, spiritwave, blessing, spiritward, manamastery, heavenslantern, shrinemastery, grandblessing, idolcheer, purification, resurrection, thousandtorii, onmyodo, ofudabarrage, seimanseal, yokairally, troupecombo,
  gmsmite, gmhaste, gmblessing,
};
// The Wind Dancer's skills wear the old Thief's pictures until she has her own.
Object.assign(ART, { pirouette: ART.shadowdash, ribbonlash: ART.twinfang, gustline: ART.starfan, spotlight: ART.quickhaste, lightfeet: ART.nimblefeet, grandfinale: ART.fullmoonvolley });

// Each skill's background tones [light, deep], noted as its tile is built, so windows can tint
// the plate behind an icon to match it.
const TONES = {};

// Every design is clipped to the tile, so nothing spills past the frame's own outline.
export const SKILL_ART = Object.fromEntries(Object.entries(ART).map(([id, draw]) => [id, () => {
  const shapes = draw().filter(Boolean);
  TONES[id] = [cur.top, cur.deep];
  return shapes.map((s) => ({ ...s, pts: clip(s.pts, OUTER) })).filter((s) => s.pts.length > 2);
}]));

export function skillTone(id) {
  if (!TONES[id] && SKILL_ART[id]) SKILL_ART[id]();
  return TONES[id] ?? null;
}
