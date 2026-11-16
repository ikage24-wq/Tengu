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
  stormbg: ['#8fb8ff', '#18226a'],
  redbg: ['#ff9aa8', '#3a0a24'],
  royal: ['#8a78e0', '#1a1440'],
  indigo: ['#b8bcff', '#1e1a5e'],
  // The Tide Mage's: pale sea foam to the deep sea.
  tidebg: ['#c8f4ff', '#0c4a80'],
  // The Maelstrom's: glowing aqua down into the midnight deep.
  deepbg: ['#8ff3e8', '#070d33'],
  moonbg: ['#c8f7e4', '#1d4a52'],
  // The Moon Moth's: pale moonlit lilac down into the night.
  mothbg: ['#e6dcff', '#24184e'],
  // The Eclipse's: a gold dawn edge down into the dark of totality.
  eclipsebg: ['#ffe4a0', '#140a2e'],
  // The Silkweaver's: warm pearl down into soft plum.
  silkbg: ['#fff3e2', '#5a3a62'],
  // The Sunfeather's: morning cream down into a warm sunrise orange.
  sunbg: ['#fff4d2', '#c8643a'],
  // The Phoenix's: a hot gold down into deep crimson.
  firebg: ['#ffc070', '#7a0e14'],
  // The Songbird's: a sunny yellow up top into a deep sky blue.
  songbg: ['#fff3b0', '#2a6ab0'],
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
const move = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);

// Inked edge: the silhouette stamped around itself in the outline color.
const RING = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)]);
const edge = (pts, c, d = 0.5) => RING.map(([dx, dy]) => S(move(pts, dx * d, dy * d), c));
const drop = (pts, k = 1) => S(move(pts, 0.7 * k, 0.9 * k), cur.shadow);

// A solid part: drop shadow on the tile, an inked edge, and a lit rounded fill.
function solid(pts, c, o = {}) {
  return [o.shadow === false ? null : drop(pts, o.drop ?? 1), ...edge(pts, o.ink ?? ink(c), o.d ?? 0.5), ...(o.flat ? [S(pts, c)] : ball(pts, c, { k: o.k ?? 1, glow: o.glow ?? 1, light: o.light ?? lt(c) }))];
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

// ---------- Thunderguard (the Warrior remade: storm blue, white-gold lightning) ----------
const TGBLUE = '#4a78ff';
const TGINK = '#18226a';
const TGGOLD = '#ffd84a';
// A forked bolt from p0 to p1 through the tile: inked, banded, a white core.
function stormBolt(pts, w = 1) {
  return [S(tube(pts, 1.7 * w, 1.7 * w), TGINK), S(tube(pts, 1.3 * w, 1.3 * w), TGBLUE), S(tube(pts, 0.9 * w, 0.9 * w), TGGOLD), S(tube(pts, 0.4 * w, 0.4 * w), '#ffffff')];
}
// Thunder Rush: a bolt tearing level across the tile, speed lines behind.
function thunderrush() {
  const out = [...tile('stormbg', 'active'), ...aura(10, 8, 6, TGGOLD)];
  for (const y of [5.2, 10.6]) out.push(S(tube([[1, y], [7, y]], 0.25, 0.1), '#dceaff'));
  out.push(...stormBolt([[1.2, 8.6], [5, 7.2], [7.4, 9], [11, 6.8], [14.6, 8]], 1.3), ...spark(14, 8, 1.6, TGGOLD));
  return out;
}
// Storm Cleave: a great crescent of lightning.
function stormcleave() {
  const out = [...tile('stormbg', 'active'), ...aura(8, 8, 6.4, TGGOLD)];
  out.push(...solid([...arcPts(6, 8, 7, 7, -70, 70, 14), ...arcPts(3.6, 8, 6.2, 6.4, 70, -70, 14)], TGBLUE, { ink: TGINK, d: 0.35 }));
  out.push(S(arcPts(6, 8, 7, 7, -55, 55, 12), TGGOLD), ...stormBolt([[10.6, 4.4], [12.4, 3.2], [13.6, 4]], 0.8), ...stormBolt([[10.8, 11.8], [12.8, 12.6], [14, 11.6]], 0.8));
  return out;
}
// Cyclone Edge: rings of storm light whirling round, bolts flung off.
function cycloneedge() {
  const out = [...tile('stormbg', 'active'), ...aura(8, 9, 6.4, TGGOLD)];
  for (const [y, r] of [[12, 6], [9.4, 4.8], [7, 3.6]]) out.push(S(arcPts(8, y, r, r * 0.32, 200, 520, 22), TGINK), S(arcPts(8, y, r - 0.2, r * 0.3, 210, 500, 20), mix(TGBLUE, '#ffffff', 0.4)));
  out.push(...stormBolt([[3, 8], [1.6, 5.4], [2.6, 3.6]], 0.7), ...stormBolt([[13, 7.6], [14.4, 5], [13.4, 3]], 0.7), ...spark(8, 4.2, 1.3, TGGOLD));
  return out;
}
// Lightning Rod: a blade planted point-down, a bolt striking down beside it.
function lightningrod() {
  const out = [...tile('stormbg', 'active'), ...aura(10, 6, 6, TGGOLD)];
  out.push(...sword([5.4, 14.6], [5.4, 4.6], { w: 1.8, gem: '#7fd8ff' }));
  out.push(...stormBolt([[12.6, 0.8], [10.4, 5], [12.4, 7], [10.2, 12.8]], 1.2), ...spark(10.2, 13, 1.6, TGGOLD));
  return out;
}
// Thunderclap: a blade slammed flat on the ground, a ring of thunder bursting out.
function thunderclap() {
  const out = [...tile('stormbg', 'buff'), ...aura(8, 10, 6.6, TGGOLD, 1.2, 5)];
  for (const r of [6.6, 4.6]) out.push(S(arcPts(8, 11.6, r, r * 0.34, 0, 360, 26), r > 5 ? mix(TGBLUE, '#ffffff', 0.3) : TGGOLD));
  out.push(...sword([2.6, 10.8], [13.4, 10.8], { w: 1.6, gem: '#7fd8ff' }));
  for (const [x0, y0, x1, y1] of [[5, 8.6, 3.4, 4.4], [8, 8, 8.6, 3], [11, 8.6, 12.8, 4.6]]) out.push(...stormBolt([[x0, y0], [(x0 + x1) / 2 + 0.8, (y0 + y1) / 2], [x1, y1]], 0.6));
  return out;
}
// Static Guard: a shield outline of crackling static round a blade standing upright.
function staticguard() {
  const out = [...tile('stormbg', 'buff'), ...aura(8, 8, 6.4, TGGOLD)];
  out.push(...sword([8, 14.4], [8, 3.4], { w: 1.6, gem: '#7fd8ff' }));
  out.push(...stormBolt([[3, 13], [2.4, 9], [3.2, 6.4], [5.4, 3], [8, 2.2], [10.6, 3], [12.8, 6.4], [13.6, 9], [13, 13]], 0.7));
  return out;
}
// Storm Steel: a blade with lightning running down it.
function stormsteel() {
  const out = [...tile('stormbg', 'passive'), ...aura(8, 8, 6, TGGOLD)];
  out.push(...sword([12.6, 13], [3.2, 3], { w: 2, gem: '#7fd8ff' }));
  out.push(...stormBolt([[3.6, 6.2], [6.4, 6.6], [7, 9.4], [9.8, 9.8]], 0.7), ...glint(5, 4.6, 0.5));
  return out;
}
// Storm Body: a chest plate crackling with static.
function stormbody() {
  const out = [...tile('stormbg', 'passive'), ...aura(8, 8, 6, TGGOLD)];
  out.push(...solid([[3.6, 4], [12.4, 4], [13.4, 8], [11.6, 13.6], [4.4, 13.6], [2.6, 8]], mix(TGBLUE, '#ffffff', 0.25), { ink: TGINK, d: 0.35 }));
  out.push(S(tube([[8, 4.6], [8, 13]], 0.25, 0.25), TGINK), ...stormBolt([[4.6, 7], [6.4, 8.6], [5.6, 10.4], [7.4, 12]], 0.6), ...stormBolt([[11.4, 7], [9.6, 8.6], [10.4, 10.4], [8.6, 12]], 0.6));
  return out;
}
// Thunderfall: a storm cloud over a giant bolt crashing down, the ground splitting.
function thunderfall() {
  const out = [...tile('stormbg', 'active'), ...aura(8, 9, 7, TGGOLD, 1.2, 5)];
  for (const [x, y, r] of [[4.4, 3.2, 2.4], [8, 2.4, 2.8], [11.6, 3.2, 2.4]]) out.push(S(oval(x, y, r + 0.4, r * 0.75 + 0.4, 0, 18), TGINK), S(oval(x, y, r, r * 0.75, 0, 18), '#7a88c0'));
  out.push(...stormBolt([[8.4, 4.4], [6.6, 8], [9, 9.4], [7.4, 14.2]], 1.4));
  out.push(...stormBolt([[7.4, 14.2], [3.4, 14.8]], 0.6), ...stormBolt([[7.4, 14.2], [12, 14.8]], 0.6), ...spark(7.4, 13.6, 1.8, TGGOLD));
  return out;
}

// ---------- Tempest (the Thunderguard's damage path: red lightning, speed) ----------
const TPRED = '#ff4a5e';
const TPINK = '#3a0a24';
const TPROSE = '#ffd2da';
function redBolt(pts, w = 1) {
  return [S(tube(pts, 1.7 * w, 1.7 * w), TPINK), S(tube(pts, 1.3 * w, 1.3 * w), '#d61f45'), S(tube(pts, 0.9 * w, 0.9 * w), TPRED), S(tube(pts, 0.4 * w, 0.4 * w), '#ffffff')];
}
// A streak: a long tapered ribbon of red light.
const redStreak = (a, b, w) => [S(tube([a, b], 0.1, w + 0.5), TPINK), S(tube([a, b], 0.05, w), TPRED), S(tube([a, b], 0.03, w * 0.45), TPROSE)];
// Flash Step: a bolt across the tile from a fading afterimage to a flash.
function flashstep() {
  const out = [...tile('redbg', 'active'), ...aura(11, 8, 6, TPRED)];
  out.push(S(oval(4, 8.4, 2.4, 3.4, 0, 18), mix(TPRED, cur.mid, 0.6)));
  out.push(...redBolt([[3, 9], [6.6, 7.2], [8.6, 9.4], [13.2, 7.6]], 0.9), ...spark(13.2, 7.6, 1.8, '#fff3f5'));
  return out;
}
// Thousand Cuts: red streaks crossing every way.
function thousandcuts() {
  const out = [...tile('redbg', 'active'), ...aura(8, 8, 6.4, TPRED)];
  for (const [a, b, w] of [[[2.6, 4], [13, 11.4], 1.1], [[3, 12.6], [12.6, 3.6], 1.1], [[1.8, 8.4], [14.2, 7.4], 0.9], [[6, 2.4], [9.6, 13.8], 0.8], [[4, 6.2], [12, 13], 0.7]]) out.push(...redStreak(a, b, w));
  out.push(...spark(8, 8, 1.6, '#fff3f5'));
  return out;
}
// Crimson Arc: two thin red crescents flung one after the other.
function crimsonarc() {
  const out = [...tile('redbg', 'active'), ...aura(9, 8, 6.4, TPRED)];
  for (const [x, k] of [[6.4, 0.9], [10.4, 1]]) out.push(...solid([...arcPts(x, 8, 5.6 * k, 5.6 * k, -70, 70, 14), ...arcPts(x - 1.4, 8, 5.2 * k, 5.4 * k, 70, -70, 14)], TPRED, { ink: TPINK, d: 0.3 }), S(arcPts(x, 8, 5.6 * k, 5.6 * k, -50, 50, 10), TPROSE));
  return out;
}
// Afterimage: the hero's red silhouette doubled behind a bright one.
function afterimage() {
  const out = [...tile('redbg', 'buff'), ...aura(9, 8, 6, TPRED)];
  for (const [x, c] of [[5.2, mix(TPRED, cur.mid, 0.5)], [7.4, TPRED]]) out.push(S(oval(x, 5.4, 2.2, 2.2, 0, 16), c), S(oval(x, 10.4, 2.4, 3.4, 0, 16), c));
  out.push(S(oval(10.2, 5.4, 2.2, 2.2, 0, 16), TPROSE), S(oval(10.2, 10.4, 2.4, 3.4, 0, 16), TPROSE), ...spark(13.4, 3.4, 1.2, '#fff3f5'));
  return out;
}
// Storm Blade: a blade with red lightning streaming off it.
function stormblade() {
  const out = [...tile('redbg', 'passive'), ...aura(8, 8, 6, TPRED)];
  out.push(...sword([12.6, 13], [3.2, 3], { w: 2, gem: '#ff9aa8' }));
  out.push(...redBolt([[3.8, 6.4], [6.2, 7.2], [6.8, 9.6], [9.4, 10.4]], 0.6), ...redStreak([1.4, 3.6], [5.6, 5], 0.6));
  return out;
}
// Red Thunder: a red bolt falling through a scatter of streaks.
function redthunder() {
  const out = [...tile('redbg', 'active'), ...aura(8, 9, 7, TPRED, 1.2, 5)];
  for (const [a, b] of [[[1.6, 5], [5.4, 3.4]], [[10.6, 3.6], [14.4, 5.6]], [[1.8, 12.4], [5.6, 10.8]], [[10.4, 11], [14.2, 12.8]]]) out.push(...redStreak(a, b, 0.6));
  out.push(...redBolt([[8.6, 1], [6.8, 6], [9.2, 7.4], [7.4, 14.2]], 1.3), ...spark(7.4, 13.6, 1.8, '#fff3f5'));
  return out;
}

// ---------- Stormwall (the Thunderguard's tank path: the storm as a fortress) ----------
const BWIND = '#4a4fb0';
const BWINK = '#141433';
const BWGOLD = '#ffcf5a';
function wallBolt(pts, w = 1) {
  return [S(tube(pts, 1.7 * w, 1.7 * w), BWINK), S(tube(pts, 1.3 * w, 1.3 * w), BWIND), S(tube(pts, 0.9 * w, 0.9 * w), BWGOLD), S(tube(pts, 0.4 * w, 0.4 * w), '#ffffff')];
}
// A storm cloud: one inked mass of lobes, darker underneath.
function stormCloud(bits, c = '#5c5a9c') {
  const out = bits.map(([x, y, r]) => S(oval(x, y, r + 0.45, r * 0.8 + 0.45, 0, 18), BWINK));
  out.push(...bits.map(([x, y, r]) => S(oval(x, y, r, r * 0.8, 0, 18), shade(c, -14))));
  out.push(...bits.map(([x, y, r]) => S(oval(x - r * 0.15, y - r * 0.2, r * 0.75, r * 0.58, 0, 18), c)));
  out.push(...bits.slice(0, 2).map(([x, y, r]) => S(oval(x - r * 0.3, y - r * 0.35, r * 0.32, r * 0.24, 0, 12), '#a4a4d8')));
  return out;
}
const rainLine = (x, y, l = 2.4) => [S(tube([[x, y], [x - l * 0.25, y + l]], 0.35, 0.35), '#d8dcff')];
// Lightning Cage: bars of lightning curving up into a dome, a crown of light at the top.
function lightningcage() {
  const out = [...tile('indigo', 'active'), ...aura(8, 9, 6.6, BWGOLD)];
  out.push(S(oval(8, 13, 6, 1.6, 0, 22), mix(BWIND, cur.mid, 0.4)));
  for (const [x0, w] of [[2.4, 0.55], [5, 0.7], [8, 0.75], [11, 0.7], [13.6, 0.55]]) out.push(...wallBolt([[x0, 13.2], [lerpN(x0, 8, 0.25), 7], [lerpN(x0, 8, 0.75), 3.6], [8, 3]], w));
  out.push(...spark(8, 3, 1.8, '#fff6d8'));
  return out;
}
const lerpN = (a, b, t) => a + (b - a) * t;
// Storm Wall: a sheet of driving rain under its cloud, bolts down both edges.
function stormbarrier() {
  const out = [...tile('indigo', 'buff'), ...aura(8, 9, 6.4, BWGOLD)];
  for (let j = 0; j < 9; j++) out.push(...rainLine(4.6 + (j % 3) * 2.4 + (j > 5 ? 1 : 0), 6.2 + Math.floor(j / 3) * 2.6));
  out.push(...wallBolt([[3.4, 14], [4, 10.6], [3.2, 8], [3.8, 5.6]], 0.6), ...wallBolt([[12.6, 14], [12, 10.6], [12.8, 8], [12.2, 5.6]], 0.6));
  out.push(...stormCloud([[5.4, 4, 2.4], [8.4, 3.2, 2.8], [11.2, 4.2, 2.2]]));
  return out;
}
// Magnetize: a lightning tendril hooked onto a far spark and hauling it in, motes streaming with it.
function magnetize() {
  const out = [...tile('indigo', 'active'), ...aura(7, 8, 6.4, BWGOLD)];
  out.push(...wallBolt([[2.4, 9], [5, 7.4], [7.4, 9.2], [10.2, 7.2], [13, 8]], 0.85));
  out.push(...wallBolt([[13, 8], [13.8, 10], [12.4, 11]], 0.5), ...spark(13, 8, 1.6, '#fff6d8'));
  for (const [x, y] of [[5, 12], [8.4, 12.8], [11, 11.6], [6.4, 4.6], [10, 4.8]]) out.push(S(tube([[x, y], [x + 1.6, y]], 0.2, 0.5), BWGOLD));
  out.push(...spark(2.4, 9, 1.1));
  return out;
}
// Overcast: a broad thundercloud spread wide, soft rain and flakes of gold light falling from it.
function overcast() {
  const out = [...tile('indigo', 'buff'), ...aura(8, 8, 6.4, BWGOLD)];
  out.push(...stormCloud([[3.6, 5.6, 2.4], [6.8, 4.4, 3], [10.2, 4.6, 2.8], [12.8, 5.8, 2.2]]));
  for (const [x, y] of [[4, 9.6], [7, 10.4], [10, 9.8], [12.4, 10.8], [5.4, 12.8], [9, 13]]) out.push(...rainLine(x, y, 2));
  out.push(...spark(8, 12.4, 1.1, BWGOLD), ...spark(11.4, 13.2, 0.8, BWGOLD), ...spark(3.6, 13.2, 0.8, BWGOLD));
  return out;
}
// Bedrock: a block of storm-dark stone, a gold vein of lightning frozen through it.
function bedrock() {
  const out = [...tile('indigo', 'passive'), ...aura(8, 8, 6, BWGOLD)];
  out.push(...solid([[3, 6], [7, 3.4], [12.6, 4.6], [13.6, 10], [10.4, 13.6], [4, 13], [2.4, 9.4]], '#6c6aac', { ink: BWINK, d: 0.4 }));
  out.push(S(clip([[3, 6], [7, 3.4], [12.6, 4.6], [13.6, 10], [10.4, 13.6], [4, 13], [2.4, 9.4]], rect(0, 10.4, 16, 6)), '#3e3c78'));
  out.push(...wallBolt([[6.4, 4], [7.6, 7], [6.4, 8.6], [9, 10.6], [8.4, 13.2]], 0.55), ...glint(5, 6, 0.5));
  return out;
}
// Fortress: a blade planted upright under the whole storm, lightning pillars either side.
function fortress() {
  const out = [...tile('indigo', 'active'), ...aura(8, 9, 7, BWGOLD, 1.2, 5)];
  out.push(...wallBolt([[2.6, 14.4], [3.2, 11], [2.4, 8.4], [3, 6]], 0.75), ...wallBolt([[13.4, 14.4], [12.8, 11], [13.6, 8.4], [13, 6]], 0.75));
  out.push(...sword([8, 14.6], [8, 5.6], { w: 1.8, gem: '#ffcf5a' }));
  out.push(...stormCloud([[4.4, 3.4, 2.4], [8, 2.6, 2.8], [11.6, 3.4, 2.4]]));
  out.push(...spark(8, 14, 1.8, '#fff6d8'));
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














// ---------- Thief ----------







// ---------- Tide Mage (sea teal and foam) ----------
const SEA = '#46c4e4';
const SEADEEP = '#1787bb';
const SEAINK = '#0c4a80';
const FOAMC = '#f3fdff';
// A curling wave rising from the floor of the tile to a crest at (cx, cy) tipping right.
function waveIcon(cx, cy, s = 1) {
  const P = (x, y) => [cx + x * s, cy + y * s];
  const out = [];
  out.push(...solid([P(-6.5, 5), P(-4, 2), P(-1.6, -1.8), P(0.6, -4), P(2.6, -4.4), P(4.2, -3.2), P(4.4, -1.6), P(2.8, -1.6), P(1.6, -0.4), P(1.6, 2.2), P(2.6, 5)], SEA, { d: 0.35, ink: SEAINK }));
  out.push(S([P(-4.6, 4), P(-2, 0.6), P(0.4, -2.4), P(1, -1.6), P(-1.4, 1.4), P(-3.4, 4.4)], lt(SEA)));
  out.push(...puffs([[cx + 3.4 * s, cy - 3.6 * s, 1.3 * s], [cx + 1.6 * s, cy - 4.4 * s, 1 * s]], FOAMC, { ink: SEAINK, shadow: false }));
  out.push(...puffs([[cx + 2.6 * s, cy + 4.6 * s, 1.1 * s]], FOAMC, { ink: SEAINK, shadow: false }));
  return out;
}
// A round bubble: a ring of water, a clear middle, a white glint.
function bubbleIcon(x, y, r) {
  return [S(oval(x, y, r + 0.45, r + 0.45, 0, 24), SEAINK), S(oval(x, y, r, r, 0, 24), SEADEEP), S(oval(x, y, r - 0.6, r - 0.6, 0, 24), mix(SEA, '#ffffff', 0.55)), S(oval(x - r * 0.4, y - r * 0.42, r * 0.3, r * 0.2, -40, 12), '#ffffff')];
}
// Bubble Shield: a big bubble round a little figure's silhouette, small bubbles rising.
function bubbleshield() {
  const out = [...tile('tidebg', 'buff'), ...aura(8, 8.4, 6.4, '#c8f4ff')];
  out.push(...bubbleIcon(8, 8.6, 5.4));
  out.push(...solid([[6.6, 12.4], [6.9, 9.6], [7.4, 8.8], [8.6, 8.8], [9.1, 9.6], [9.4, 12.4]], SEADEEP, { d: 0.25, ink: SEAINK }), S(oval(8, 7.6, 1.3, 1.3, 0, 14), SEADEEP));
  out.push(...bubbleIcon(13.2, 3.6, 1.2), ...bubbleIcon(2.8, 4.4, 0.9), ...spark(12.6, 12.4, 1, FOAMC));
  return out;
}
// Tide Pool: a pool on the floor with ripples, a heart-shaped drop welling up out of it.
function tidepool() {
  const out = [...tile('tidebg', 'buff'), ...aura(8, 9, 6, '#c8f4ff')];
  out.push(S(oval(8, 12, 6.4, 2.2, 0, 26), SEAINK), S(oval(8, 12, 5.8, 1.8, 0, 26), SEA), S(oval(8, 11.8, 4, 1.1, 0, 22), lt(SEA)), S(oval(8, 11.8, 2.2, 0.6, 0, 18), FOAMC));
  out.push(...solid([[8, 9.6], [5.4, 6.4], [5.6, 4.4], [7, 3.8], [8, 4.8], [9, 3.8], [10.4, 4.4], [10.6, 6.4]], SEA, { d: 0.3, ink: SEAINK }));
  out.push(S(oval(6.8, 5.2, 0.8, 0.5, -30, 12), '#ffffff'), ...bubbleIcon(12.6, 8.4, 0.9), ...bubbleIcon(3.4, 9, 0.7));
  return out;
}
// Riptide: a whirl of current, three arcs turning in to the middle.
function riptide() {
  const out = [...tile('tidebg', 'active'), ...aura(8, 8, 6.4, '#c8f4ff')];
  for (let k = 0; k < 3; k++) {
    const a0 = k * 120;
    const pts = arcPts(8, 8, 5.8 - k * 0.2, 5.2 - k * 0.2, a0, a0 + 150, 10);
    out.push(S(tube(pts, 0.4, 1.4), SEAINK), S(tube(pts, 0.25, 0.9), k === 1 ? FOAMC : SEA));
  }
  out.push(...bubbleIcon(8, 8, 1.4), ...spark(12.8, 3.4, 1, FOAMC));
  return out;
}
// Tidal Wave: one great curl rearing up.
function tidalwave() {
  const out = [...tile('tidebg', 'active'), ...aura(7, 7, 6, '#c8f4ff')];
  out.push(...waveIcon(7.2, 8, 1.15), ...spark(13.4, 4, 1, FOAMC));
  return out;
}
// Flow: a ribbon of water curling round a staff head.
function flow() {
  const out = [...tile('tidebg', 'buff'), ...aura(8, 8, 6, '#c8f4ff')];
  const pts = [[2.6, 12], [5, 9.6], [8.6, 10.4], [10.8, 7.6], [9, 5], [6.4, 5.8], [7.4, 3.4], [11, 2.6], [13.4, 4.4]];
  out.push(S(tube(pts, 0.5, 1.6), SEAINK), S(tube(pts, 0.3, 1.1), SEA), S(tube(pts.slice(2, 6), 0.2, 0.45), FOAMC));
  out.push(...bubbleIcon(4.4, 4.4, 1.1), ...bubbleIcon(12.2, 11.2, 0.9));
  return out;
}
// Wave Rider: a small wave with a staff laid along its top like a board, spray off the back.
function waverider() {
  const out = [...tile('tidebg', 'active'), ...aura(8, 9, 6, '#c8f4ff')];
  out.push(...waveIcon(8.2, 10.4, 0.85));
  out.push(S(tube([[3, 6.4], [12.6, 4.8]], 0.5, 0.9), SEAINK), S(tube([[3.2, 6.3], [12.4, 4.9]], 0.3, 0.5), '#ffe9a0'));
  out.push(...puffs([[2.4, 9.6, 1], [3.6, 11, 0.8]], FOAMC, { ink: SEAINK, shadow: false }));
  return out;
}
// Ocean Heart: a heart of sea water with a glint.
function oceanheart() {
  const out = [...tile('tidebg', 'passive'), ...aura(8, 8, 6, '#c8f4ff')];
  out.push(...solid([[8, 13], [3.4, 8.4], [3.2, 5.4], [5.4, 3.6], [8, 5.4], [10.6, 3.6], [12.8, 5.4], [12.6, 8.4]], SEA, { d: 0.35, ink: SEAINK }));
  out.push(S([[8, 11.4], [4.6, 8.2], [4.6, 6], [6, 5.2]], lt(SEA)), S(oval(5.8, 6.2, 0.9, 0.6, -30, 12), '#ffffff'), ...bubbleIcon(10.4, 8.6, 1));
  return out;
}
// Great Wave: the giant wave, towering, with its curl of foam over the top.
function greatwave() {
  const out = [...tile('tidebg', 'active'), ...aura(7, 6, 6.6, '#c8f4ff', 1.2, 5)];
  out.push(...waveIcon(7, 9.2, 1.35), ...spark(13.6, 3, 1.2, FOAMC), ...spark(2.6, 3.4, 0.9, FOAMC));
  return out;
}

// ---------- Moon Moth (lilac and moon silver, little gold crescents) ----------
const MOTHC = '#b9a2ff';
const MOTHINK = '#2e1f5e';
const MOTHGOLD = '#ffd36a';
const MOTHSIL = '#f4f2ff';
// A spirit moth seen from above with its wings spread, centred at (cx, cy), `r` its half wingspan:
// round fore wings glowing pale at the middle, the hind wings a shade deeper, a small round body.
// (No eye spots: they read as gross, 2026-11-16.)
function mothIcon(cx, cy, r, c = MOTHC) {
  const out = [];
  for (const side of [-1, 1]) out.push(...solid(oval(cx + side * r * 0.36, cy + r * 0.38, r * 0.36, r * 0.3, side * 35, 16), sh(c), { d: 0.35, ink: MOTHINK, shadow: false }));
  for (const side of [-1, 1]) {
    out.push(...solid(oval(cx + side * r * 0.5, cy - r * 0.16, r * 0.54, r * 0.4, side * -28, 18), c, { d: 0.35, ink: MOTHINK, shadow: false }));
    if (r > 2.4) out.push(S(oval(cx + side * r * 0.5, cy - r * 0.18, r * 0.26, r * 0.18, side * -28, 12), mix(c, '#ffffff', 0.6)));
  }
  out.push(...solid(oval(cx, cy + r * 0.08, r * 0.15, r * 0.32, 0, 14), MOTHSIL, { d: 0.3, ink: MOTHINK, shadow: false }));
  return out;
}
// A dagger laid along (x0, y0) to (x1, y1), point at the far end: a silver blade, a lilac grip.
function daggerIcon(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / l, dy / l];
  const [nx, ny] = [-uy, ux];
  const at = (k, w) => [x0 + dx * k + nx * w, y0 + dy * k + ny * w];
  const blade = [at(0.36, 0.9), at(0.8, 0.7), at(1, 0), at(0.8, -0.7), at(0.36, -0.9)];
  return [
    S(tube([[x0, y0], at(0.34, 0)], 0.5, 0.9), MOTHINK), S(tube([[x0, y0], at(0.32, 0)], 0.3, 0.55), MOTHC),
    ...solid(blade, MOTHSIL, { d: 0.3, ink: MOTHINK, shadow: false }),
    S(tube([at(0.34, 1.4), at(0.34, -1.4)], 0.4, 0.5), MOTHGOLD),
  ];
}
// Moth Step: three moths streaming off a dash, a dagger leading the way.
function mothstep() {
  const out = [...tile('mothbg', 'active'), ...aura(8, 8, 6.4, '#e6dcff')];
  out.push(S(tube([[1.6, 11.6], [6, 9.8], [10.8, 7.6]], 0.3, 1.2), mix(MOTHC, cur.deep, 0.4)));
  out.push(...mothIcon(3.6, 11.4, 2.2), ...mothIcon(6.8, 9.4, 2.7));
  out.push(...daggerIcon(9.2, 9, 14.2, 3.8), ...spark(12.8, 12.2, 1, MOTHSIL), ...spark(3.2, 3.6, 0.9, MOTHGOLD));
  return out;
}
// Wing Flurry: two daggers crossed, crescents of cuts whirling round them.
function wingflurry() {
  const out = [...tile('mothbg', 'active'), ...aura(8, 8, 6.4, '#e6dcff')];
  for (const [a0, a1] of [[200, 320], [20, 140]]) {
    const pts = arcPts(8, 8, 6, 5.4, a0, a1, 10);
    out.push(S(tube(pts, 0.3, 1.2), MOTHINK), S(tube(pts, 0.2, 0.7), MOTHC));
  }
  out.push(...daggerIcon(3.4, 12.6, 12.4, 3.6), ...daggerIcon(12.6, 12.6, 3.6, 3.6));
  out.push(...spark(13.4, 8.4, 1, MOTHSIL), ...spark(2.6, 8, 0.8, MOTHSIL));
  return out;
}
// Moth Swarm: a cloud of moths, big and small, flying out together.
function mothswarm() {
  const out = [...tile('mothbg', 'active'), ...aura(8, 8, 6.6, '#e6dcff')];
  out.push(...mothIcon(4, 4.6, 2.2), ...mothIcon(4.4, 11.4, 2.4), ...mothIcon(9.4, 8.2, 3.8), ...mothIcon(13.2, 4, 1.9), ...mothIcon(13, 12.4, 1.8));
  out.push(...spark(1.8, 8.2, 0.8, MOTHSIL));
  return out;
}
// Night Eyes: a gold crescent moon, a little moth resting on its tip. (A gold eye spot till
// 2026-11-16: it read as gross.)
function nighteyes() {
  const out = [...tile('mothbg', 'passive'), ...aura(8, 8, 6, '#e6dcff')];
  out.push(...solid([...arcPts(7.2, 8.6, 5.4, 5.4, 60, 300, 16), ...arcPts(9.2, 7.6, 4.3, 4.3, 300, 60, 16)], MOTHGOLD, { d: 0.35, ink: '#8e5228' }));
  out.push(...mothIcon(10.8, 6.4, 3.6, '#9a7ae8'), ...spark(3.4, 3.2, 1, MOTHSIL));
  return out;
}
// Moth Veil: three moths circling on a soft ring of light, a glow in the middle where she'd stand.
function mothveil() {
  const out = [...tile('mothbg', 'active'), ...aura(8, 8, 6.4, '#f4f2ff', 1.1, 5)];
  out.push(S(tube(arcPts(8, 9, 6.2, 2.6, 180, 360, 14), 0.25, 0.7), mix(MOTHC, cur.deep, 0.35)));
  out.push(S(tube(arcPts(8, 9, 6.2, 2.6, 0, 180, 14), 0.3, 0.9), mix(MOTHC, '#ffffff', 0.55)));
  out.push(...mothIcon(3, 9.6, 2.2), ...mothIcon(12.6, 7.6, 2.4), ...mothIcon(8.2, 12.6, 2));
  out.push(...spark(12.8, 3, 1, MOTHGOLD), ...spark(3.6, 3.8, 0.8, MOTHSIL));
  return out;
}
// Dazzle Dust: a puff of glittering dust blown off an open hand, big sparkles in it.
function dazzledust() {
  const out = [...tile('mothbg', 'active'), ...aura(8, 8, 6.4, '#f4f2ff')];
  out.push(...solid(oval(10.2, 7, 4.6, 3.4, -10, 22), mix(MOTHC, '#ffffff', 0.55), { d: 0.3, ink: mix(MOTHC, cur.deep, 0.35), shadow: false }));
  // (The hand, palm up, at the bottom left.)
  out.push(...solid([[1.6, 12.2], [4.2, 10.6], [6.8, 10.4], [7.2, 11.4], [5, 12.4], [3.6, 14]], '#f6d2bc', { d: 0.3, ink: '#7a4a52', shadow: false }));
  out.push(...spark(9.2, 6.4, 1.6, '#ffffff'), ...spark(12.4, 8.6, 1.1, MOTHGOLD), ...spark(11.6, 4.4, 0.9, MOTHSIL), ...spark(6.6, 8, 0.8, MOTHSIL));
  return out;
}
// Moonlure: a little round paper lantern glowing on the floor, a gold crescent on it, a moth drawn
// to it.
function moonlure() {
  const out = [...tile('mothbg', 'active'), ...aura(8, 9, 6.4, '#fff3c8')];
  out.push(S(oval(7.6, 14, 5.4, 1.2, 0, 20), mix(MOTHC, '#ffffff', 0.5)));
  out.push(...solid(oval(7.6, 9.6, 3.8, 4, 0, 24), '#f4f2ff', { d: 0.3, ink: MOTHINK, shadow: false }));
  out.push(S(tube(arcPts(7.6, 9.6, 1.8, 3.8, 250, 470, 10), 0.12, 0.3), mix(MOTHC, '#ffffff', 0.2)));
  out.push(...solid([...arcPts(7, 9.8, 1.5, 1.5, 60, 300, 10), ...arcPts(7.8, 9.4, 1.2, 1.2, 300, 60, 10)], MOTHGOLD, { d: 0.3, ink: '#8e5228', shadow: false }));
  out.push(S(oval(7.6, 5.4, 1.8, 0.7, 0, 12), MOTHGOLD), S(oval(7.6, 13.6, 1.6, 0.6, 0, 12), MOTHGOLD));
  out.push(...mothIcon(12.6, 4.2, 2.2), ...spark(3, 3.6, 0.9, MOTHSIL));
  return out;
}
// Wing Feint: a dagger held back low one way, three moths flicked off the other way.
function wingfeint() {
  const out = [...tile('mothbg', 'active'), ...aura(8, 8, 6.4, '#e6dcff')];
  out.push(S(tube([[6.4, 9.6], [9.6, 7.2], [13.2, 5.6]], 0.2, 0.9), mix(MOTHC, cur.deep, 0.4)));
  out.push(...mothIcon(9.4, 7.4, 2), ...mothIcon(12.4, 4.4, 2.4), ...mothIcon(13.6, 9, 1.7));
  out.push(...daggerIcon(5.6, 6, 2.2, 13.2), ...spark(3.6, 3, 1, MOTHGOLD));
  return out;
}
// Midnight Swarm: a full moon with moths across its face.
function midnightswarm() {
  const out = [...tile('mothbg', 'active'), ...aura(8, 7, 6.6, '#f4f2ff', 1.2, 5)];
  out.push(...solid(oval(8.4, 7.4, 5.2, 5.2, 0, 28), MOTHSIL, { d: 0.4, ink: '#5c5690' }));
  out.push(S(oval(6.6, 6.4, 1.2, 1, 20, 12), '#dedcf2'), S(oval(10.2, 9.2, 1.5, 1.2, 0, 12), '#dedcf2'));
  out.push(...mothIcon(5.2, 10.6, 2.6), ...mothIcon(11.2, 4.8, 2), ...mothIcon(11.8, 11.8, 1.8));
  out.push(...spark(2.4, 3, 1, MOTHGOLD));
  return out;
}

// ---------- Eclipse (eclipse violet and corona gold) ----------
const ECDARK = '#24164e';
const ECINK = '#0e0820';
const ECGOLDC = '#ffd36a';
// The eclipse: a ring of gold corona rays round a dark disc.
function eclipseIcon(cx, cy, r) {
  return [
    ...solid(starPts(cx, cy, r * 1.55, r * 1.05, 12, -90), ECGOLDC, { d: 0.3, ink: '#8e5a14', shadow: false }),
    ...solid(oval(cx, cy, r, r, 0, 22), ECDARK, { d: 0.35, ink: ECINK, shadow: false }),
    S(oval(cx + r * 0.12, cy + r * 0.12, r * 0.72, r * 0.72, 0, 18), ECINK),
  ];
}
// Her sign, a little eclipse: a gold sun with the dark moon over it, `dx` how far the moon has still
// to slide (0 = all the way over, a ring of fire). (Gold eyeballs till 2026-11-16.)
const signIcon = (x, y, r, dx = 0) => [...solid(oval(x, y, r, r, 0, 18), ECGOLDC, { d: 0.3, ink: '#8e5a14', shadow: false }), S(oval(x + dx * r, y, r * 0.66, r * 0.66, 0, 16), ECINK)];
// Shadow Step: a dark disc of shadow on the floor, a dagger stabbing out of the far side of it.
function shadowstep() {
  const out = [...tile('eclipsebg', 'active'), ...aura(8, 8, 6.4, '#ffe4a0')];
  out.push(...solid(oval(6.4, 12, 5, 1.8, 0, 22), ECDARK, { d: 0.3, ink: ECINK, shadow: false }), S(tube(arcPts(6.4, 12, 4.8, 1.6, 190, 350, 8), 0.3, 0.5), ECGOLDC));
  out.push(...daggerIcon(7.6, 10.2, 13.6, 4.2), ...spark(3, 4, 1, ECGOLDC));
  return out;
}
// Eye of the Night: her little eclipse flying, a gold streak behind it.
function nighteye() {
  const out = [...tile('eclipsebg', 'active'), ...aura(8, 8, 6.4, '#ffe4a0')];
  out.push(S(tube([[1.4, 13.2], [8, 8.4]], 0.2, 1.3), mix(ECGOLDC, cur.deep, 0.35)), S(tube([[3.4, 12.2], [8, 8.6]], 0.1, 0.6), '#fff3c8'));
  out.push(...eclipseIcon(10.2, 6.4, 3), ...spark(4, 4.4, 1, ECGOLDC));
  return out;
}
// Umbral Edge: one dagger driven deep, a dark crescent behind it, gold flaring at the point.
function umbraledge() {
  const out = [...tile('eclipsebg', 'active'), ...aura(8, 8, 6.4, '#ffe4a0')];
  const pts = arcPts(11, 8, 6.4, 6.4, 150, 250, 10);
  out.push(S(tube(pts, 0.3, 1.6), ECINK), S(tube(pts, 0.2, 1.1), ECDARK), S(tube(pts.slice(2, 8), 0.15, 0.4), ECGOLDC));
  out.push(...daggerIcon(2.6, 13.4, 11.4, 4.6), ...spark(12.2, 3.8, 1.5, ECGOLDC));
  return out;
}
// Corona: a ring of gold fire round a dark middle.
function corona() {
  const out = [...tile('eclipsebg', 'active'), ...aura(8, 8, 6.8, '#ffe4a0')];
  out.push(...solid(starPts(8, 8, 7, 5.2, 14, -90), ECGOLDC, { d: 0.3, ink: '#8e5a14', shadow: false }), S(oval(8, 8, 4.6, 4.6, 0, 22), '#fff3c8'), S(oval(8, 8, 3.6, 3.6, 0, 20), ECDARK));
  out.push(...spark(13.6, 2.6, 1, '#ffffff'));
  return out;
}
// Umbral Mastery: the dark moon sliding over a gold sun, the eclipse on its way.
function umbralmastery() {
  const out = [...tile('eclipsebg', 'passive'), ...aura(8, 8, 6, '#ffe4a0')];
  out.push(...solid(starPts(8, 8.2, 6.6, 4.6, 12, -90), ECGOLDC, { d: 0.3, ink: '#8e5a14', shadow: false }));
  out.push(...signIcon(8, 8.2, 3.8, 0.36), ...spark(13.4, 3, 1, '#ffffff'));
  return out;
}
// Total Eclipse: the eclipse itself, the diamond ring flashing on its rim.
function totaleclipse() {
  const out = [...tile('eclipsebg', 'active'), ...aura(8, 8, 6.8, '#ffe4a0', 1.2, 5)];
  out.push(...eclipseIcon(8, 8.4, 4.2), ...spark(4.6, 4.8, 1.6, '#ffffff'), ...spark(13.4, 13, 0.9, ECGOLDC));
  return out;
}

// ---------- Sunfeather (sunrise gold and peach, warm rose-brown ink) ----------
const SFGOLD = '#ffd36a';
const SFCREAM = '#fff3d6';
const SFPEACH = '#ff9f6a';
const SFINK = '#8a4436';
// A feather of light from (x0, y0) to (x1, y1): a soft vane round a white quill.
function featherIcon(x0, y0, x1, y1, w = 1.2) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [-dy / l, dx / l];
  const at = (k, o) => [x0 + dx * k + nx * o, y0 + dy * k + ny * o];
  const vane = [at(0.12, 0), at(0.3, w * 0.75), at(0.62, w), at(0.9, w * 0.45), at(1, 0.1), at(0.7, -w * 0.55), at(0.32, -w * 0.6)];
  return [S(tube([at(-0.08, 0), at(0.2, 0)], 0.22, 0.28), SFINK), ...solid(vane, SFGOLD, { d: 0.3, ink: SFINK, shadow: false }), S(tube([at(0.14, 0.05), at(0.94, 0.15)], 0.14, 0.14), SFCREAM)];
}
// A light arrow from (x0, y0) to (x1, y1), its point at the far end.
function lightArrowIcon(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / l, dy / l];
  const [nx, ny] = [-uy, ux];
  return [
    S(tube([[x0, y0], [x1 - ux, y1 - uy]], 0.5, 0.7), SFPEACH), S(tube([[x0, y0], [x1 - ux, y1 - uy]], 0.2, 0.35), SFCREAM),
    ...solid([[x1 + ux * 0.6, y1 + uy * 0.6], [x1 - ux * 1.2 + nx, y1 - uy * 1.2 + ny], [x1 - ux * 1.2 - nx, y1 - uy * 1.2 - ny]], '#ffffff', { d: 0.3, ink: SFINK, shadow: false }),
    S(tube([[x0 + nx * 0.9, y0 + ny * 0.9], [x0 + ux * 1.4, y0 + uy * 1.4]], 0.2, 0.3), SFGOLD), S(tube([[x0 - nx * 0.9, y0 - ny * 0.9], [x0 + ux * 1.4, y0 + uy * 1.4]], 0.2, 0.3), SFGOLD),
  ];
}
// A sunbird at (x, y), `r` round, facing right (or left, `f` -1).
function sunbirdIcon(x, y, r, f = 1) {
  return [
    ...solid(oval(x, y, r, r * 0.88, 0, 18), '#ffd896', { d: 0.3, ink: SFINK, shadow: false }),
    S(oval(x + f * r * 0.15, y + r * 0.3, r * 0.58, r * 0.42, 0, 14), '#fffaf0'),
    S(oval(x - f * r * 0.3, y, r * 0.4, r * 0.24, f * -30, 12), '#ffb870'),
    ...solid([[x + f * r * 0.85, y - r * 0.2], [x + f * r * 1.35, y - r * 0.05], [x + f * r * 0.85, y + r * 0.1]], '#f4a24a', { d: 0.3, ink: SFINK, shadow: false }),
    S(oval(x + f * r * 0.5, y - r * 0.25, Math.max(0.3, r * 0.11), Math.max(0.3, r * 0.12), 0, 8), SFINK),
  ];
}
// The sun at (x, y), `r` round, its rays out to `R`.
const sunIcon = (x, y, r, R = r * 1.5) => [...solid(starPts(x, y, R, r * 1.05, 12, -90), SFGOLD, { d: 0.3, ink: '#c06a2a', shadow: false }), ...solid(oval(x, y, r, r, 0, 20), SFCREAM, { d: 0.3, ink: SFINK, shadow: false }), S(oval(x - r * 0.25, y - r * 0.25, r * 0.4, r * 0.4, 0, 12), '#ffffff')];
// Sky Hop: a high arc up and back, a light arrow shot down from the top of it.
function skyhop() {
  const out = [...tile('sunbg', 'active'), ...aura(8, 8, 6.4, '#fff4d2')];
  out.push(S(tube(arcPts(9.2, 10, 5, 6.4, 210, 340, 12), 0.25, 0.9), mix(SFPEACH, cur.deep, 0.3)));
  out.push(...lightArrowIcon(5, 4.4, 12.6, 12.4), ...spark(13, 3, 1, '#ffffff'), ...spark(3, 12.6, 0.8, SFGOLD));
  return out;
}
// Sparrow Volley: three sunbirds flying out in a fan.
function sparrowvolley() {
  const out = [...tile('sunbg', 'active'), ...aura(8, 8, 6.4, '#fff4d2')];
  out.push(...sunbirdIcon(11.4, 4.2, 2.1), ...sunbirdIcon(12.2, 9.2, 2.4), ...sunbirdIcon(6.4, 11.4, 2.2));
  out.push(...featherIcon(2.2, 6, 5.6, 4.4, 0.9), ...spark(4, 2.6, 0.9, '#ffffff'));
  return out;
}
// Sunbeam Shot: a beam of light shooting across from a little sun at the bow.
function sunbeamshot() {
  const out = [...tile('sunbg', 'active'), ...aura(8, 8, 6.4, '#fff4d2')];
  out.push(S(tube([[3.6, 8.6], [15, 7.4]], 2.2, 1.4), SFPEACH), S(tube([[3.6, 8.6], [15, 7.4]], 1.4, 0.9), SFGOLD), S(tube([[3.6, 8.6], [15, 7.4]], 0.6, 0.4), '#ffffff'));
  out.push(...sunIcon(3.8, 8.6, 2, 3.2), ...spark(12, 3.4, 1, '#ffffff'));
  return out;
}
// Feather Rain: feathers of light falling at a slant from a burst of light up top.
function featherrain() {
  const out = [...tile('sunbg', 'active'), ...aura(8, 8, 6.4, '#fff4d2')];
  out.push(...sunIcon(11.6, 3.4, 1.6, 2.6));
  out.push(...featherIcon(4, 4, 6.4, 8.4), ...featherIcon(8.2, 7, 10.6, 11.4), ...featherIcon(3.4, 10, 5.8, 14.2));
  out.push(...spark(13.2, 12.4, 0.9, '#ffffff'));
  return out;
}
// Golden Hour: a sun pouring soft rays down, a feather drifting in the light.
function goldenhour() {
  const out = [...tile('sunbg', 'active'), ...aura(8, 7.4, 6.8, '#fff4d2', 1.2, 5)];
  for (const x of [4.4, 8, 11.6]) out.push(S(tube([[x + 0.6, 6.8], [x - 0.8, 15]], 0.6, 1.2), mix(SFGOLD, '#ffffff', 0.4)));
  out.push(...sunIcon(8, 5, 2.8, 4.2), ...featherIcon(10.4, 10.6, 13.4, 13.2, 0.9));
  return out;
}
// Pin Feather: a big gold feather stuck in the ground at a slant, a glint on it.
function pinfeather() {
  const out = [...tile('sunbg', 'active'), ...aura(8, 8, 6.4, '#fff4d2')];
  out.push(S(oval(9.6, 13.2, 3.6, 0.9, 0, 16), mix(SFPEACH, cur.deep, 0.3)));
  out.push(...featherIcon(6.2, 2.6, 9.8, 13, 1.8), ...spark(4, 5, 1.1, '#ffffff'), ...spark(12.8, 4, 0.8, SFGOLD));
  return out;
}
// Dawn Eyes: the sun coming up over the edge of the world, rays out.
function dawneyes() {
  const out = [...tile('sunbg', 'passive'), ...aura(8, 9, 6, '#fff4d2')];
  out.push(...sunIcon(8, 10.4, 3.2, 5.2), S([[1.6, 10.6], [14.4, 10.6], [14.4, 15], [1.6, 15]], mix(SFPEACH, cur.deep, 0.5)), S(tube([[1.6, 10.6], [14.4, 10.6]], 0.3, 0.3), SFCREAM));
  out.push(...spark(13, 4, 1, '#ffffff'));
  return out;
}
// Sunrise Volley: a great sun, light arrows raining down past it.
function sunrisevolley() {
  const out = [...tile('sunbg', 'active'), ...aura(8, 7, 6.8, '#fff4d2', 1.2, 5)];
  out.push(...sunIcon(8, 6.4, 3.2, 5.2));
  out.push(...lightArrowIcon(2.6, 9.4, 4.4, 14.4), ...lightArrowIcon(7.4, 11, 8.8, 15), ...lightArrowIcon(11.8, 9.4, 13.4, 14.2));
  out.push(...spark(13.6, 2.4, 1.2, '#ffffff'));
  return out;
}

// ---------- Phoenix (flame orange, crimson and gold) ----------
const PHORANGE = '#ff8a3a';
const PHRED = '#e8452a';
const PHGOLD = '#ffd36a';
const PHINK = '#7a1e14';
// A tongue of flame standing at (x, y), `h` tall.
const flameIcon = (x, y, h, w = h * 0.55) => [
  ...solid([[x - w * 0.5, y], [x - w * 0.6, y - h * 0.45], [x - w * 0.1, y - h * 0.75], [x + w * 0.05, y - h], [x + w * 0.45, y - h * 0.6], [x + w * 0.55, y - h * 0.2], [x + w * 0.4, y]], PHRED, { d: 0.3, ink: PHINK, shadow: false }),
  ...solid([[x - w * 0.28, y], [x - w * 0.3, y - h * 0.35], [x + w * 0.02, y - h * 0.68], [x + w * 0.3, y - h * 0.3], [x + w * 0.24, y]], PHORANGE, { d: 0.3, ink: null, shadow: false }),
  S([[x - w * 0.12, y], [x - w * 0.1, y - h * 0.28], [x + w * 0.05, y - h * 0.45], [x + w * 0.15, y - h * 0.22], [x + w * 0.1, y]], PHGOLD),
];
// A crossbow bolt from (x0, y0) to (x1, y1), point at the far end.
function boltIcon(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / l, dy / l];
  const [nx, ny] = [-uy, ux];
  return [
    S(tube([[x0, y0], [x1 - ux, y1 - uy]], 0.35, 0.35), '#6a3a2a'),
    ...solid([[x1 + ux * 0.8, y1 + uy * 0.8], [x1 - ux * 0.9 + nx * 1.1, y1 - uy * 0.9 + ny * 1.1], [x1 - ux * 0.9 - nx * 1.1, y1 - uy * 0.9 - ny * 1.1]], '#fff0d0', { d: 0.3, ink: PHINK, shadow: false }),
    ...solid([[x0, y0], [x0 + nx * 1.2 - ux * 0.6, y0 + ny * 1.2 - uy * 0.6], [x0 + ux * 1.2, y0 + uy * 1.2]], PHRED, { d: 0.3, ink: PHINK, shadow: false }),
    ...solid([[x0, y0], [x0 - nx * 1.2 - ux * 0.6, y0 - ny * 1.2 - uy * 0.6], [x0 + ux * 1.2, y0 + uy * 1.2]], PHRED, { d: 0.3, ink: PHINK, shadow: false }),
  ];
}
// Flame Wing: a wing of flame fanned up and back.
function flamewing() {
  const out = [...tile('firebg', 'active'), ...aura(8, 8, 6.4, '#ffe39a')];
  for (const [x, y, h] of [[4.4, 13, 9], [7, 13.4, 11], [9.8, 13.6, 9.4], [12.4, 13.6, 7]]) out.push(...flameIcon(x, y, h));
  out.push(...spark(13.4, 3, 1, '#ffffff'));
  return out;
}
// Firebrand Bolt: a burning bolt through a line, flame streaming off it.
function firebrandbolt() {
  const out = [...tile('firebg', 'active'), ...aura(8, 8, 6.4, '#ffe39a')];
  out.push(S(tube([[1.6, 10.4], [9, 8.4]], 0.6, 1.6), mix(PHORANGE, cur.deep, 0.2)), S(tube([[2.4, 10.2], [9, 8.4]], 0.3, 0.8), PHGOLD));
  out.push(...boltIcon(4.4, 9.6, 14, 7), ...spark(12.6, 12.6, 0.9, '#ffffff'));
  return out;
}
// Ember Spread: five bolts fanned out, sparks off them.
function emberspread() {
  const out = [...tile('firebg', 'active'), ...aura(8, 8, 6.4, '#ffe39a')];
  for (const [x1, y1] of [[13.6, 3], [14.4, 6.4], [14.6, 9.6], [14, 12.8]]) out.push(...boltIcon(3, 8.6, x1, y1));
  out.push(...flameIcon(3.4, 10.6, 4.6), ...spark(8, 2.6, 0.9, '#ffffff'));
  return out;
}
// Smoulder: a bolt stuck in at a slant, its head glowing, a flame curling off it.
function smoulder() {
  const out = [...tile('firebg', 'active'), ...aura(8, 9, 6.4, '#ffe39a', 1.1, 5)];
  out.push(S(oval(9.4, 10.4, 3.6, 3.2, 0, 18), mix(PHORANGE, '#ffffff', 0.25)));
  out.push(...boltIcon(2.4, 4, 9.6, 10.6), ...flameIcon(10.6, 10.6, 6.4), ...spark(13.2, 3.4, 1, '#ffffff'));
  return out;
}
// Phoenix Mastery: a fire bird's head and a flame crest, proud.
function phoenixmastery() {
  const out = [...tile('firebg', 'passive'), ...aura(8, 8.4, 6, '#ffe39a')];
  out.push(...flameIcon(6.2, 6.4, 4.6), ...flameIcon(8.2, 5.8, 5.4), ...flameIcon(10, 6.6, 4));
  out.push(...solid(oval(8, 9.6, 4, 3.6, 0, 20), '#ffa040', { d: 0.35, ink: PHINK, shadow: false }), S(oval(8.6, 10.6, 2.4, 1.8, 0, 14), '#ffeaa0'));
  out.push(...solid([[11.6, 9.2], [13.8, 9.8], [11.6, 10.4]], PHGOLD, { d: 0.3, ink: PHINK, shadow: false }), S(oval(10.2, 8.8, 0.45, 0.55, 0, 8), PHINK), S(oval(10.4, 10.3, 0.7, 0.45, 0, 8), '#ff7a6a'));
  return out;
}
// Rebirth: the phoenix rising, wings of flame spread wide.
function rebirth() {
  const out = [...tile('firebg', 'active'), ...aura(8, 7.4, 6.8, '#ffe39a', 1.2, 5)];
  for (const [x, y, h] of [[3, 10.6, 7], [5, 10, 8.6], [11, 10, 8.6], [13, 10.6, 7]]) out.push(...flameIcon(x, y, h));
  out.push(...flameIcon(8, 15, 6.4, 4));
  out.push(...solid(oval(8, 8.4, 2.8, 2.6, 0, 18), '#ffa040', { d: 0.35, ink: PHINK, shadow: false }), S(oval(8.4, 9.2, 1.6, 1.2, 0, 12), '#ffeaa0'), S(oval(8.8, 7.6, 0.4, 0.45, 0, 8), PHINK));
  out.push(...solid([[10.6, 7.8], [12, 8.2], [10.6, 8.6]], PHGOLD, { d: 0.3, ink: PHINK, shadow: false }), ...spark(13.6, 2.4, 1.2, '#ffffff'));
  return out;
}

// ---------- Songbird (sky blue, sunny yellow and white, navy ink) ----------
const SBYEL = '#ffd84a';
const SBBLUE = '#5ab4f0';
const SBINK = '#1e3a6a';
// A musical note at (x, y) (its head), `r` big; `two`: two heads beamed together.
function noteIcon(x, y, r, two = false) {
  const head = (hx) => [...solid(oval(hx, y, r, r * 0.78, -25, 14), SBYEL, { d: 0.3, ink: SBINK, shadow: false }), S(oval(hx - r * 0.3, y - r * 0.25, r * 0.3, r * 0.2, -25, 8), '#ffffff')];
  const stem = (hx) => S(tube([[hx + r * 0.8, y - r * 0.1], [hx + r * 0.8, y - r * 2.6]], 0.22, 0.22), SBINK);
  if (two) return [...head(x), ...head(x + r * 2.4), stem(x), stem(x + r * 2.4), S(tube([[x + r * 0.8, y - r * 2.6], [x + r * 3.2, y - r * 2.9]], 0.4, 0.4), SBBLUE)];
  return [...head(x), stem(x), S(tube([[x + r * 0.8, y - r * 2.6], [x + r * 1.7, y - r * 1.9], [x + r * 1.5, y - r * 1.2]], 0.3, 0.2), SBBLUE)];
}
// A bluebird at (x, y), `r` round.
function bluebirdIcon(x, y, r, f = 1) {
  return [
    ...solid(oval(x, y, r, r * 0.88, 0, 18), '#7cc8ff', { d: 0.3, ink: SBINK, shadow: false }),
    S(oval(x + f * r * 0.15, y + r * 0.3, r * 0.58, r * 0.42, 0, 14), '#ffffff'),
    S(oval(x - f * r * 0.3, y, r * 0.4, r * 0.24, f * -30, 12), '#4a9ae8'),
    ...solid([[x + f * r * 0.85, y - r * 0.2], [x + f * r * 1.35, y - r * 0.05], [x + f * r * 0.85, y + r * 0.1]], SBYEL, { d: 0.3, ink: SBINK, shadow: false }),
    S(oval(x + f * r * 0.5, y - r * 0.25, Math.max(0.3, r * 0.11), Math.max(0.3, r * 0.12), 0, 8), SBINK),
  ];
}
// Stave lines along a gentle wave from (x0, y0) to (x1, y1).
function staveIcon(x0, y0, x1, y1, w = 2.4) {
  const out = [];
  for (let l = 0; l < 3; l++) {
    const pts = [];
    for (let j = 0; j <= 8; j++) {
      const t = j / 8;
      pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * 5) * 0.8 + (l - 1) * (w / 2)]);
    }
    out.push(S(tube(pts, 0.14, 0.14), l === 1 ? SBYEL : '#ffffff'));
  }
  return out;
}
// Song Step: a ribbon of stave lines sweeping forward, a note riding it.
function songstep() {
  const out = [...tile('songbg', 'active'), ...aura(8, 8, 6.4, '#fff3b0')];
  out.push(...staveIcon(1.6, 12, 14.4, 7), ...noteIcon(9.6, 6.8, 1.4), ...spark(3.6, 3.6, 1, '#ffffff'));
  return out;
}
// Healing Melody: notes rising round a soft glow, sparkles among them.
function healingmelody() {
  const out = [...tile('songbg', 'active'), ...aura(8, 8, 6.6, '#fff3b0', 1.2, 5)];
  out.push(...noteIcon(4, 11.6, 1.5), ...noteIcon(9.4, 7.4, 1.7, true), ...noteIcon(5.6, 5, 1.2));
  out.push(...spark(12.8, 12, 1.1, '#ffffff'), ...spark(3, 2.8, 0.8, SBYEL));
  return out;
}
// Lullaby: a sleepy crescent moon, a Z and a note drifting off it.
function lullaby() {
  const out = [...tile('songbg', 'active'), ...aura(8, 8, 6.4, '#fff3b0')];
  out.push(...solid([...arcPts(6.6, 8.8, 4.4, 4.4, 60, 300, 14), ...arcPts(8.4, 8, 3.6, 3.6, 300, 60, 14)], SBYEL, { d: 0.35, ink: SBINK }));
  out.push(S(tube([[10.4, 3], [13.2, 3], [10.4, 6], [13.2, 6]], 0.35, 0.35), '#ffffff'), ...noteIcon(11.4, 11.6, 1.3));
  return out;
}
// Anthem: crossed banners of stave lines, a big note between them.
function anthem() {
  const out = [...tile('songbg', 'active'), ...aura(8, 8, 6.6, '#fff3b0', 1.2, 5)];
  out.push(...staveIcon(2, 14, 13.6, 2.6, 2), ...staveIcon(2.4, 2.6, 14, 13.6, 2), ...noteIcon(7.2, 10, 2, true));
  return out;
}
// Songbird Mastery: a bluebird singing, a note coming off its beak.
function songbirdmastery() {
  const out = [...tile('songbg', 'passive'), ...aura(8, 8.4, 6, '#fff3b0')];
  out.push(...bluebirdIcon(7, 9.4, 3.6), ...noteIcon(11.6, 6.4, 1.3), ...spark(3.6, 4, 0.9, '#ffffff'));
  return out;
}
// Grand Chorus: three bluebirds singing together round a burst of notes.
function grandchorus() {
  const out = [...tile('songbg', 'active'), ...aura(8, 7.4, 6.8, '#fff3b0', 1.2, 5)];
  out.push(...noteIcon(6.6, 7.4, 1.8, true));
  out.push(...bluebirdIcon(3.4, 12, 2.2), ...bluebirdIcon(12.6, 12, 2.2, -1), ...bluebirdIcon(8, 13.4, 2));
  out.push(...spark(13.6, 2.6, 1.2, '#ffffff'), ...spark(2.6, 3.4, 0.9, SBYEL));
  return out;
}

// ---------- Silkweaver (pearl silk, gold thread, soft plum) ----------
const SVPEARL = '#fdf8f0';
const SVCREAM = '#efe4d6';
const SVMAUVE = '#cbb2c6';
const SVINK = '#563a62';
const SVGOLDC = '#ffe08a';
// A thread along `pts`: a plum edge and a pearl core.
const thread = (pts, w = 0.5) => [S(tube(pts, w * 0.9, w * 0.9), SVINK), S(tube(pts, w * 0.45, w * 0.45), SVPEARL)];
// A little gold bow at (x, y), `r` across.
const bowIcon = (x, y, r) => [
  ...solid(oval(x - r * 0.55, y, r * 0.55, r * 0.4, -20, 12), SVGOLDC, { d: 0.3, ink: '#7a5222', shadow: false }),
  ...solid(oval(x + r * 0.55, y, r * 0.55, r * 0.4, 20, 12), SVGOLDC, { d: 0.3, ink: '#7a5222', shadow: false }),
  S(oval(x, y, r * 0.2, r * 0.2, 0, 8), '#e2ab52'),
];
// A cocoon at (x, y): a pearl oval wound with silk, a gold bow on top.
function cocoonIcon(x, y, rx, ry) {
  const out = [...solid(oval(x, y, rx, ry, 0, 22), SVCREAM, { d: 0.35, ink: SVINK, shadow: false })];
  for (let j = -1; j <= 1; j++) out.push(S(tube(arcPts(x, y + j * ry * 0.42 - ry * 0.35, rx * 0.95, ry * 0.3, 20, 160, 8), 0.2, 0.2), j % 2 ? SVMAUVE : '#ffffff'));
  out.push(...bowIcon(x, y - ry + 0.1, rx * 0.5));
  return out;
}
// Silk Swing: a thread from a gold glint high up, a dagger swinging on its end along a soft arc.
function silkswing() {
  const out = [...tile('silkbg', 'active'), ...aura(8, 8, 6.4, '#fff3e2')];
  out.push(S(tube(arcPts(9, 2.6, 7.4, 9, 115, 60, 10), 0.3, 0.9), mix(SVMAUVE, cur.deep, 0.3)));
  out.push(...thread([[11.4, 2.6], [6.4, 11.2]]));
  out.push(...daggerIcon(4.6, 12.6, 8.8, 9), ...spark(11.4, 2.6, 1.3, SVGOLDC), ...spark(3, 4, 0.8, SVPEARL));
  return out;
}
// Binding Thread: three threads fanning out from her fingers, a pearl bead on each.
function bindingthread() {
  const out = [...tile('silkbg', 'active'), ...aura(8, 8, 6.4, '#fff3e2')];
  for (const [ex, ey] of [[13.4, 3.6], [14, 8.6], [11.6, 13]]) {
    out.push(...thread([[2.6, 10.6], [(2.6 + ex) / 2, (10.6 + ey) / 2 - 1], [ex, ey]]));
    out.push(...solid(oval(ex, ey, 1.2, 1.2, 0, 12), SVPEARL, { d: 0.3, ink: SVINK, shadow: false }));
  }
  out.push(...spark(5, 4, 1, SVGOLDC));
  return out;
}
// Reel In: a spool wound with silk, its thread pulled in from a loop off to the right.
function reelin() {
  const out = [...tile('silkbg', 'active'), ...aura(8, 8, 6.4, '#fff3e2')];
  out.push(...solid(oval(6.4, 4.4, 4, 1.3, 0, 16), SVGOLDC, { d: 0.3, ink: '#7a5222', shadow: false }));
  out.push(...solid([[3.4, 4.6], [9.4, 4.6], [9.4, 11.4], [3.4, 11.4]], SVCREAM, { d: 0.3, ink: SVINK, shadow: false }));
  for (let j = 0; j < 4; j++) out.push(S(tube([[3.6, 5.8 + j * 1.5], [9.2, 6.4 + j * 1.5]], 0.25, 0.25), j % 2 ? SVMAUVE : '#ffffff'));
  out.push(...solid(oval(6.4, 11.6, 4, 1.3, 0, 16), SVGOLDC, { d: 0.3, ink: '#7a5222', shadow: false }));
  out.push(...thread([[9.2, 8], [11.6, 8.6], [13.6, 7.2]]), S(tube(arcPts(13.4, 9.6, 1.5, 2.2, 250, 600, 16), 0.3, 0.3), SVPEARL));
  out.push(...spark(13, 3.2, 1, SVGOLDC));
  return out;
}
// Spindle: a dagger point-down at the middle, silk whirling round it on three flat rings.
function spindle() {
  const out = [...tile('silkbg', 'active'), ...aura(8, 8, 6.6, '#fff3e2')];
  for (const [y, rx] of [[11.6, 6.2], [8.4, 5.4], [5.2, 4.4]]) out.push(S(tube(arcPts(8, y, rx, 1.4, 190, 350, 10), 0.2, 0.2), mix(SVMAUVE, cur.deep, 0.3)));
  out.push(...daggerIcon(8, 1.8, 8, 14.2));
  for (const [y, rx] of [[11.6, 6.2], [8.4, 5.4], [5.2, 4.4]]) out.push(...thread(arcPts(8, y, rx, 1.4, 10, 170, 10)));
  out.push(...spark(13.4, 3, 1, SVGOLDC));
  return out;
}
// Weaver's Mastery: a cocoon wound in pearl silk with its gold bow, a sparkle by it.
function weavermastery() {
  const out = [...tile('silkbg', 'passive'), ...aura(8, 8.4, 6, '#fff3e2')];
  out.push(...cocoonIcon(8, 8.8, 3.3, 5.2), ...spark(13, 4, 1, SVGOLDC), ...spark(3.2, 12.4, 0.8, SVPEARL));
  return out;
}
// Moonspun Cocoon: a great pearl moon wound like a spool, threads streaming off it to two little
// cocoons below.
function moonspun() {
  const out = [...tile('silkbg', 'active'), ...aura(8, 7, 6.8, '#fff3e2', 1.2, 5)];
  out.push(...solid(oval(8, 6.2, 4.6, 4.6, 0, 26), SVPEARL, { d: 0.4, ink: SVINK }));
  for (let j = -2; j <= 2; j++) out.push(S(tube(arcPts(8, 6.2 + j * 1.6 - 1.2, 4.2, 1.2, 20, 160, 8), 0.18, 0.18), j % 2 ? SVMAUVE : '#ffffff'));
  out.push(...thread([[5, 9.6], [3.6, 11.4]], 0.4), ...thread([[11, 9.6], [12.4, 11.4]], 0.4));
  out.push(...cocoonIcon(3.4, 13, 1.6, 2), ...cocoonIcon(12.6, 13, 1.6, 2));
  out.push(...spark(13.2, 2.6, 1.3, SVGOLDC));
  return out;
}

// ---------- Maelstrom (the deep: midnight water lit by glowing aqua, a magenta accent) ----------
const DEEPC = '#1f4fa0';
const DEEPINK = '#070d33';
const GLOWC = '#8ff3e8';
const PINKC = '#ff7ad8';
const glowDot = (x, y, r, c = GLOWC) => [S(oval(x, y, r * 1.5, r * 1.5, 0, 14), mix(c, cur.mid, 0.6)), S(oval(x, y, r, r, 0, 14), c), S(oval(x, y, r * 0.45, r * 0.45, 0, 10), '#ffffff')];
// A spiral of water arms turning into a glowing eye.
function vortexIcon(cx, cy, r) {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const a0 = k * 120;
    const pts = Array.from({ length: 12 }, (_, i) => {
      const u = i / 11;
      const a = (a0 + u * 200) * D2R;
      const rr = r * (0.25 + 0.75 * u);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    });
    out.push(S(tube(pts, 0.3, 1.4), DEEPINK), S(tube(pts, 0.2, 0.9), k === 1 ? GLOWC : DEEPC));
  }
  out.push(...glowDot(cx, cy, 1.4));
  return out;
}
// Tidal Lance: a great spear of water through the tile, a ring of pressure off its head.
function tidallance() {
  const out = [...tile('deepbg', 'active'), ...aura(11, 5, 5, GLOWC)];
  out.push(...solid([[1.6, 13.6], [2.8, 14.4], [13.6, 3.6], [14.6, 1.4], [12.4, 2.4]], DEEPC, { d: 0.35, ink: DEEPINK }));
  out.push(S(tube([[3, 13], [13, 3]], 0.2, 0.5), '#ffffff'));
  out.push(S(arcPts(11.4, 4.6, 2.6, 1.2, 0, 360, 16), GLOWC), ...glowDot(13.8, 2.2, 1.1), ...glowDot(4.4, 9.4, 0.6, PINKC));
  return out;
}
// Undertow: a vortex dragging, current lines pulled into it.
function undertow() {
  const out = [...tile('deepbg', 'active'), ...aura(8, 8, 6.4, GLOWC)];
  out.push(...vortexIcon(8, 8, 6), ...glowDot(2.6, 3.2, 0.6), ...glowDot(13.4, 12.6, 0.6, PINKC));
  return out;
}
// Hydro Cannon: a thick beam tearing out of the left edge, rings round it.
function hydrocannon() {
  const out = [...tile('deepbg', 'active'), ...aura(9, 8, 6, GLOWC)];
  out.push(...solid([[0.8, 6], [15.2, 6.6], [15.2, 9.4], [0.8, 10]], DEEPC, { d: 0.35, ink: DEEPINK }));
  out.push(S(rect(1, 7.6, 14, 0.8), '#ffffff'), S(rect(1, 7.2, 14, 0.4), GLOWC));
  for (const x of [4, 8, 12]) out.push(S(arcPts(x, 8, 0.9, 3, 0, 360, 14), GLOWC));
  out.push(...glowDot(14.2, 8, 1.4));
  return out;
}
// Depth Charge: three glowing bubbles, one going off.
function depthcharge() {
  const out = [...tile('deepbg', 'active'), ...aura(8, 8, 6, GLOWC)];
  for (const [x, y, r] of [[4.4, 10.6, 2.2], [8.2, 6.4, 2.4]]) out.push(S(oval(x, y, r + 0.4, r + 0.4, 0, 20), DEEPINK), S(oval(x, y, r, r, 0, 20), mix(DEEPC, GLOWC, 0.35)), ...glowDot(x, y, r * 0.45));
  out.push(...spark(12, 10.6, 2.4, GLOWC), ...glowDot(12, 10.6, 1.2, PINKC));
  return out;
}
// Deep Sea Mastery: the staff's head over a swirl of the deep.
function deepmastery() {
  const out = [...tile('deepbg', 'passive'), ...aura(8, 8, 6, GLOWC)];
  out.push(...vortexIcon(8, 9, 5));
  out.push(S(tube([[8, 14], [8, 3.6]], 0.5, 0.9), DEEPINK), S(tube([[8, 13.8], [8, 3.8]], 0.3, 0.5), '#ffe9a0'), ...glowDot(8, 3.2, 1.3));
  return out;
}
// Maelstrom: a giant whirlpool seen from above it, everything turning into it.
function abyssmaelstrom() {
  const out = [...tile('deepbg', 'active'), ...aura(8, 8, 7, GLOWC, 1.2, 5)];
  for (const r of [6.6, 4.4]) out.push(S(arcPts(8, 8, r, r * 0.9, 0, 360, 28), mix(DEEPC, GLOWC, r > 5 ? 0.2 : 0.5)));
  out.push(...vortexIcon(8, 8, 6.2), ...glowDot(2.8, 12.6, 0.7, PINKC), ...glowDot(13, 3.4, 0.7));
  return out;
}

// ---------- Tidecaller (the moon's tide: seafoam water, pearl white, pale moon gold) ----------
const MOONC = '#5fd0b4';
const MOONINK = '#1d4a52';
const PEARLC = '#fff6e4';
const GOLDC = '#ffe08a';
// A crescent moon standing upright, belly to +x.
function moonIcon(cx, cy, r, th, c = GOLDC) {
  const outer = arcPts(cx, cy, r, r, -72, 72, 14);
  const inner = arcPts(cx - th, cy, r * 0.92, r * 0.86, 72, -72, 14);
  return solid([...outer, ...inner], c, { ink: '#8a6420', d: 0.3 });
}
const pearlDot = (x, y, r) => [S(oval(x, y, r + 0.35, r + 0.35, 0, 16), '#7d6a54'), S(oval(x, y, r, r, 0, 16), PEARLC), S(oval(x - r * 0.3, y - r * 0.32, r * 0.3, r * 0.2, -40, 10), '#ffffff')];
// Healing Rain: a soft cloud with drops falling from it.
function healingrain() {
  const out = [...tile('moonbg', 'active'), ...aura(8, 6, 6, GOLDC)];
  for (const [x, y, r] of [[4.6, 5.4, 2.4], [8, 4.4, 3], [11.4, 5.4, 2.4], [8, 6.6, 2.6]]) out.push(S(oval(x, y, r + 0.4, r * 0.8 + 0.4, 0, 18), MOONINK), S(oval(x, y, r, r * 0.8, 0, 18), mix(MOONC, '#ffffff', 0.55)));
  for (const [x, y] of [[4.4, 10.4], [8, 12.2], [11.4, 10.6], [6.2, 14], [10, 14.2]]) out.push(S(tube([[x + 0.3, y - 1.6], [x, y]], 0.2, 0.55), MOONC), S(oval(x, y, 0.55, 0.7, 0, 10), '#e4fff4'));
  out.push(...spark(12.8, 2.6, 1, GOLDC));
  return out;
}
// Spring Surge: water leaping up round a burst of gold light.
function springsurge() {
  const out = [...tile('moonbg', 'active'), ...aura(8, 9, 6.4, GOLDC, 1.2, 5)];
  out.push(S(arcPts(8, 13, 6.4, 1.8, 0, 360, 24), mix(GOLDC, cur.mid, 0.3)));
  for (const s of [-1, 1]) for (const [dx, h] of [[2.2, 7], [4.6, 5]]) out.push(...solid(tube([[8 + s * dx, 13.4], [8 + s * (dx + 0.8), 13.4 - h * 0.6], [8 + s * (dx + 0.2), 13.4 - h]], 0.9, 0.2), MOONC, { ink: MOONINK, d: 0.3 }));
  out.push(...spark(8, 7.6, 2.6, GOLDC), ...pearlDot(3.4, 4, 0.7), ...pearlDot(12.6, 3.4, 0.6));
  return out;
}
// Moon Blessing: a crescent over flakes of moonlight drifting down.
function moonblessing() {
  const out = [...tile('moonbg', 'buff'), ...aura(8, 6, 6, GOLDC)];
  out.push(...moonIcon(8.6, 6, 4.4, 2.2));
  for (const [x, y, r] of [[3.6, 11, 1], [7.4, 13.2, 1.2], [11.6, 11.6, 1], [5.4, 8.6, 0.7], [12.4, 8.2, 0.7]]) out.push(...spark(x, y, r, GOLDC));
  return out;
}
// Tide's Return: a column of light rising out of a ring of water, a crescent over it.
function tidesreturn() {
  const out = [...tile('moonbg', 'active'), ...aura(8, 8, 6.4, GOLDC)];
  out.push(S(arcPts(8, 13.2, 5.2, 1.5, 0, 360, 24), MOONC), S(arcPts(8, 13.2, 3.6, 1, 0, 360, 20), mix(GOLDC, '#ffffff', 0.4)));
  out.push(S(rect(6.6, 4.6, 2.8, 8.6), mix(GOLDC, '#ffffff', 0.55)), S(rect(7.4, 4.6, 1.2, 8.6), '#ffffff'));
  for (const [x, y] of [[4.6, 9.6], [11.2, 8.4], [5.8, 6.4]]) out.push(S(oval(x, y, 0.55, 0.75, 0, 10), MOONC));
  out.push(...moonIcon(8.6, 3.2, 2.2, 1.1));
  return out;
}
// Moonfall: a great crescent of water falling onto a splash.
function moonfall() {
  const out = [...tile('moonbg', 'active'), ...aura(8, 7, 6, GOLDC)];
  out.push(...solid([...arcPts(7, 6.6, 5.2, 5.2, -70, 70, 14), ...arcPts(4.6, 6.6, 4.6, 4.4, 70, -70, 14)], MOONC, { ink: MOONINK, d: 0.35 }));
  out.push(S(arcPts(7, 6.6, 5.2, 5.2, -50, 50, 10), GOLDC));
  out.push(...solid([[2.6, 14.6], [4, 11.6], [5.4, 13.4], [7.6, 10.6], [9.6, 13.2], [11.8, 11.4], [13.4, 14.6]], MOONC, { ink: MOONINK, d: 0.3 }));
  for (const [x, y] of [[3, 3], [13, 9]]) out.push(...spark(x, y, 0.9, GOLDC));
  return out;
}
// Tidesong: the staff's head over a pearl and a crescent.
function tidesong() {
  const out = [...tile('moonbg', 'passive'), ...aura(8, 8, 6, GOLDC)];
  out.push(...moonIcon(9.4, 8.4, 4.8, 2.4, mix(GOLDC, '#ffffff', 0.2)));
  out.push(S(tube([[6.4, 14.4], [6.4, 4.6]], 0.5, 0.9), MOONINK), S(tube([[6.4, 14.2], [6.4, 4.8]], 0.3, 0.5), '#ffe9a0'), ...pearlDot(6.4, 3.8, 1.3));
  return out;
}
// Moon Tide: a great moon over a flood of water across the tile.
function moontide() {
  const out = [...tile('moonbg', 'active'), ...aura(8, 6, 7, GOLDC, 1.2, 5)];
  out.push(S(oval(8, 5.4, 4.2, 4.2, 0, 28), mix(GOLDC, '#ffffff', 0.5)), ...moonIcon(9.4, 5.4, 4, 2));
  out.push(...solid([[0.6, 15.4], [0.6, 10.8], [3, 10], [5.4, 11], [8, 9.8], [10.6, 11], [13, 10], [15.4, 10.8], [15.4, 15.4]], MOONC, { ink: MOONINK, d: 0.35 }));
  out.push(S(tube([[1.2, 11.6], [5, 12], [8, 10.8], [11, 12], [14.8, 11.6]], 0.3, 0.3), '#e4fff4'));
  for (const x of [3.2, 8, 12.8]) out.push(...pearlDot(x, 13.4, 0.6));
  return out;
}













const WPEACH = '#ff9d88';
const WCREAM = '#fff1e6';
const WINK = '#8a2c48';
// A spiral of `turns` from radius r0 out to r1 round (cx, cy), starting at angle a0 (degrees).
const spiral = (cx, cy, r0, r1, a0, turns, sy = 1, n = 40) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n;
  const a = (a0 + t * turns * 360) * D2R;
  const r = r0 + (r1 - r0) * t;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * sy];
});
// A satin ballet slipper at (x, y), tilted `deg`: a long rounded sole, the opening near its heel.
function slipper(x, y, deg, c = WPEACH) {
  const body = oval(x, y, 2.1, 4.4, deg, 28);
  const open = oval(...turn([[x, y - 1.3]], deg, x, y)[0], 1.3, 2.4, deg, 20);
  return [...solid(body, c, { d: 0.45, ink: WINK }), S(open, mix(c, '#a8385a', 0.5)), S(oval(...turn([[x - 0.8, y + 1.6]], deg, x, y)[0], 0.5, 1.4, deg, 12), mix(c, W, 0.6)),
    S(oval(...turn([[x, y + 3.4]], deg, x, y)[0], 1.2, 0.7, deg, 12), WCREAM)];
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
  pebble, quickstep,
  thunderrush, stormcleave, cycloneedge, lightningrod, thunderclap, staticguard, stormsteel, stormbody, thunderfall,
  flashstep, thousandcuts, crimsonarc, afterimage, stormblade, redthunder,
  lightningcage, stormbarrier, magnetize, overcast, bedrock, fortress,
  gmsmite, gmhaste, gmblessing,
  bubbleshield, tidepool, riptide, tidalwave, flow, waverider, oceanheart, greatwave,
  mothstep, wingflurry, mothswarm, nighteyes, midnightswarm, mothveil, dazzledust, moonlure, wingfeint,
  shadowstep, nighteye, umbraledge, corona, umbralmastery, totaleclipse,
  silkswing, bindingthread, reelin, spindle, weavermastery, moonspun,
  skyhop, sparrowvolley, sunbeamshot, featherrain, goldenhour, pinfeather, dawneyes, sunrisevolley,
  flamewing, firebrandbolt, emberspread, smoulder, phoenixmastery, rebirth,
  songstep, healingmelody, lullaby, anthem, songbirdmastery, grandchorus,
  tidallance, undertow, hydrocannon, depthcharge, deepmastery, abyssmaelstrom,
  healingrain, springsurge, moonblessing, tidesreturn, moonfall, tidesong, moontide,
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
