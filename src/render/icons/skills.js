// Hand-drawn 16x16 skill icons, one per skill. Each is a framed, rounded tile: a bevelled rim
// (pearl for actives, gold for buffs, silver with studs for passives), a banded gradient in the
// colors of the skill's job, spell school, or role (heals blue, wards green, blessings rose), so
// no two in a book share a hue, and a bold central motif lit from the top left, inked, and
// glinting. Built with the item icons' kit so both share one look. `SKILL_ART[id]()` returns the
// shapes; icons.js draws them at res 3.

import { shade, mix } from '../pixel.js';
import { hi, lt, sh, dk, ink, S, oval, arcPts, bez, bez3, rect, clip, cut, bbox, ball, tube, line, bevel, twinkle, glint, leaf, turn, W, GOLD, D2R } from './items.js';

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
const grow = (pts, k, cx, cy) => {
  const b = bbox(pts);
  const ox = cx ?? b.cx;
  const oy = cy ?? b.cy;
  return pts.map(([x, y]) => [ox + (x - ox) * k, oy + (y - oy) * k]);
};

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

// A closed tome seen from the front, its cover in `c`, with a medallion that holds the emblem.
function tome(c, medal, emblem) {
  const cover = [[3.4, 3.1], [11.6, 2.1], [12.4, 13.4], [4.1, 14.4]];
  const pages = [[11.6, 2.1], [13.3, 3.1], [14.1, 13.9], [12.4, 13.4]];
  const out = [drop([...cover, ...pages]), ...edge([...cover.slice(0, 1), ...pages.slice(0, 3), ...cover.slice(3)], ink(c), 0.5)];
  out.push(S(pages, '#fff6e4'));
  for (let i = 1; i < 5; i++) out.push(line([[11.9 + i * 0.3, 2.3 + i * 0.2], [12.6 + i * 0.3, 13.5 + i * 0.07]], 0.18, '#e2cfae'));
  out.push(...ball(cover, c, { k: 0.85 }));
  out.push(S(tube([[4.1, 3.1], [4.8, 14.2]], 1.3), sh(c)), S(tube([[4.9, 3], [5.5, 14.1]], 0.35), lt(c)));
  // Gold corner caps and a gilt border line.
  for (const [a, b, d] of [[cover[1], [-2, 0.2], [0, 2]], [cover[2], [-2, 0.2], [0, -2]]]) out.push(S([a, add(a, b), add(a, d)], GOLD));
  out.push(...[[6.2, 3.6], [11, 3], [11.6, 12.8], [6.8, 13.6]].map((q, i, a) => line([q, a[(i + 1) % 4]], 0.3, shade(GOLD, -6))));
  const m = oval(8.8, 8.3, 2.9, 2.9, 0, 26);
  out.push(...edge(m, ink(medal), 0.4), ...ball(m, medal), ...emblem(8.8, 8.3));
  // A ribbon bookmark hanging out of the pages.
  out.push(...solid([[9.6, 13.6], [10.6, 13.5], [10.8, 15.6], [10.15, 15], [9.6, 15.7]], '#ff6b8a', { shadow: false, d: 0.35 }));
  out.push(...glint(5.8, 4.6, 0.55));
  return out;
}

// An archmage's staff head: a gilt crescent claw cradling an orb, the pole running off below.
function staffHead(orb, emblem, o = {}) {
  const metal = o.metal ?? GOLD;
  const wood = o.wood ?? '#9a6ad0';
  const out = [];
  const pole = tube([[2.6, 15.6], [7.6, 10]], 1.6);
  out.push(drop(pole), ...edge(pole, ink(wood), 0.45), S(pole, wood), S(tube([[2.4, 15.1], [7.2, 9.8]], 0.45), lt(wood)));
  out.push(...solid(tube([[4.4, 13.2], [5.4, 14.2]], 1.2), metal, { shadow: false }));
  if (o.behind) out.push(...o.behind);
  // A gilt crescent cupping the orb from below, its two horns rising to points.
  const claw = tube(arcPts(9.4, 7, 4.6, 4.4, -40, 220, 28), (t) => 0.3 + 1.5 * Math.pow(Math.sin(Math.PI * t), 0.7));
  out.push(drop(claw), ...edge(claw, ink(metal), 0.45), S(claw, metal), S(tube(arcPts(9.3, 6.8, 4.5, 4.3, 140, 200, 10), (t) => 0.7 * Math.sin(Math.PI * t)), hi(metal)));
  out.push(S(tube(arcPts(9.4, 7, 4.9, 4.7, 40, 130, 10), (t) => 0.5 * Math.sin(Math.PI * t)), sh(metal)));
  const orbPts = oval(9.4, 6.4, 3.2, 3.2, 0, 28);
  out.push(drop(orbPts), ...edge(orbPts, ink(orb), 0.45), ...ball(orbPts, orb, { glow: 1.1 }), ...emblem(9.4, 6.4));
  for (const a of [-40, 220]) out.push(...solid(oval(9.4 + Math.cos(a * D2R) * 4.6, 7 + Math.sin(a * D2R) * 4.4, 0.75, 0.75, 0, 12), o.tip ?? '#ff6b8a', { shadow: false, d: 0.35 }));
  out.push(...glint(8.2, 4.8, 0.6));
  return out;
}

// A soft white star sparkle with a tiny edge so it reads on light tiles too.
const spark = (x, y, r, c = W) => [twinkle(x + 0.25, y + 0.3, r, mix(cur.mid, cur.deep, 0.5)), twinkle(x, y, r, c)];

// A snowflake: six spokes with little forks.
function snowflake(cx, cy, r, c = W, th = 0.55) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 90) * D2R;
    const u = [Math.cos(a), Math.sin(a)];
    const n = [-u[1], u[0]];
    const p = along([cx, cy], u, n);
    out.push(line([p(0), p(r)], th, c), line([p(r * 0.55), p(r * 0.85, r * 0.3)], th * 0.7, c), line([p(r * 0.55), p(r * 0.85, -r * 0.3)], th * 0.7, c));
  }
  return out;
}

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
    ...tile('steel', 'active'),
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

// ---------- Mage ----------

function magicbolt() {
  const out = [...tile('arcane', 'active'), ...aura(10, 6, 5.6, '#f4e8ff', 1.1)];
  // A broad comet tail of raw magic, with motes shed along it.
  const tail = (a, w, c) => S(tube(bez(a, [(a[0] + 10.4) / 2 + 0.8, (a[1] + 6) / 2 + 0.8], [10.4, 6], 10), (t) => 0.2 + w * Math.pow(t, 0.9)), c);
  out.push(tail([0.8, 15.2], 7, '#c9a6ff'), tail([2, 14.2], 4.6, '#e6d2ff'), tail([3.6, 13], 2.2, W));
  for (const [x, y, r] of [[2.4, 9.6, 0.8], [6.2, 13.8, 0.7], [4.4, 7.4, 0.55]]) out.push(S(polyPts(x, y, r, 4, 0), '#f4e8ff'));
  const orb = oval(10.4, 6, 3.7, 3.7, 0, 30);
  out.push(...solid(orb, '#b98aff', { glow: 1, light: '#e6d2ff', ink: '#3a1a7a' }));
  for (const a of [0, 120, 240]) {
    const arm = turn(arcPts(10.4, 6, 2.6, 2.6, 0, 110, 10), a + 20, 10.4, 6);
    out.push(S(tube(arm, (t) => 0.15 + 0.8 * Math.sin(Math.PI * t)), '#ffffff'));
  }
  out.push(S(starPts(10.4, 6, 1.7, 0.6, 4, -90), '#fff3a6'), S(oval(10.4, 6, 0.6, 0.6, 0, 10), W));
  out.push(...glint(8.8, 4, 0.5), ...spark(14, 11.6, 1.3), ...spark(4, 3, 1.1));
  return out;
}

function sparkburst() {
  const out = [...tile('arcane', 'active'), ...aura(8, 8, 7, '#fff4c8', 1.1)];
  const ring = tube([...oval(8, 8, 5.4, 5.4, 0, 36), oval(8, 8, 5.4, 5.4, 0, 36)[0]], 1.1);
  out.push(...edge(ring, '#4a2a80', 0.4), S(ring, '#e6d2ff'));
  // Runes around the ring.
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 90) * D2R;
    const [x, y] = [8 + Math.cos(a) * 5.4, 8 + Math.sin(a) * 5.4];
    out.push(S(polyPts(x, y, 1.3, 4, i * 60), '#4a2a80'), S(polyPts(x, y, 0.85, 4, i * 60), '#fff3a6'));
  }
  out.push(...solid(starPts(8, 8, 4.6, 1.5, 8, -90), '#fff3a6', { glow: 1.2, d: 0.45 }));
  out.push(S(starPts(8, 8, 2.4, 0.9, 4, -45), W));
  out.push(...spark(13.6, 2.6, 1.2), ...spark(2.4, 13.4, 1.1));
  return out;
}

function blink() {
  const out = [...tile('arcane', 'active')];
  // Dissolving motes on the left, a flash on the right.
  for (const [x, y, s, c] of [[2.4, 8, 1.2, '#e6d2ff'], [3.4, 5.6, 0.9, '#c9a6ff'], [4.2, 10.6, 1, '#e6d2ff'], [5.4, 7.6, 1.3, W], [2.2, 11.6, 0.6, '#c9a6ff'], [5.8, 4.4, 0.6, W], [6.4, 11.4, 0.8, '#c9a6ff']]) {
    out.push(S(polyPts(x, y, s, 4, 45), '#5a33a3'), S(polyPts(x - 0.1, y - 0.1, s * 0.7, 4, 45), c));
  }
  out.push(...aura(10.6, 8, 5.4, '#ffffff', 1.2));
  out.push(S(tube(bez([4.2, 13.6], [7, 15], [9.6, 12.4], 10), (t) => 0.2 + 0.8 * t), '#e6d2ff'));
  const flash = starPts(10.6, 8, 5.2, 1.2, 4, -90);
  out.push(...solid(flash, '#fff6ff', { d: 0.4, ink: '#6a3ab8' }));
  out.push(S(starPts(10.6, 8, 3, 0.8, 4, -45), '#e6d2ff'), S(oval(10.6, 8, 1.2, 1.2, 0, 14), W));
  const ring = tube([...oval(10.6, 8, 3.4, 3.4, 0, 30), oval(10.6, 8, 3.4, 3.4, 0, 30)[0]], 0.45);
  out.push(S(ring, '#f4e8ff'));
  out.push(...spark(14, 3, 1));
  return out;
}

function manashield() {
  const out = [...tile('arcane', 'buff'), ...aura(8, 8, 6.8, '#d8e8ff', 1.1)];
  const hex = polyPts(8, 8.2, 6.4, 6, -90);
  out.push(drop(hex), ...edge(hex, '#2a3a8a', 0.5), ...bevel(hex, polyPts(8, 8.2, 4.8, 6, -90), '#9cc4ff', '#7fa8ff'));
  out.push(S(clip(polyPts(8, 8.2, 4.8, 6, -90), oval(6.4, 6.4, 4, 3.2)), '#a8c8ff'));
  out.push(...solid(flamePts(8, 11.8, 4.2, 6.6), '#5fa0ff', { drop: 0.5, d: 0.4, glow: 1.2, light: '#d8eaff' }));
  out.push(...glint(7, 8.4, 0.55));
  out.push(...[0, 1, 2, 3, 4, 5].map((i) => S(oval(...polyPts(8, 8.2, 5.6, 6, -90)[i], 0.4, 0.4, 0, 8), W)));
  return out;
}

function arcanemind() {
  const gem = '#8fb4ff';
  const top = [8, 1.4];
  const bot = [8, 14.8];
  const L = [3.4, 7.4];
  const Rr = [12.6, 7.4];
  const M = [8.6, 8.6];
  const out = [...tile('arcane', 'passive'), ...aura(8, 8, 7, '#e0eaff', 1.1)];
  out.push(drop([top, Rr, bot, L]), ...edge([top, Rr, bot, L], '#2a2a7a', 0.5));
  out.push(S([top, M, L], hi(gem)), S([top, Rr, M], lt(gem)), S([L, M, bot], gem), S([M, Rr, bot], sh(gem)));
  out.push(S([top, [8.3, 5.4], [5.6, 6.2]], W));
  // Orbiting motes.
  out.push(S(tube(arcPts(8, 8.2, 7, 2.4, 20, 160, 14), 0.4), '#f4e8ff'));
  out.push(...spark(2.4, 10.6, 1.2), ...spark(13.8, 4, 1.4, '#fff3a6'), ...spark(12.8, 12.6, 0.9));
  return out;
}

function mend() {
  const pink = '#ff7aa0';
  const out = [...tile('mint', 'active'), ...aura(8, 8.4, 6.8, '#f0fff0', 1.1)];
  out.push(...solid(heartPts(8, 8.8, 6.2), pink, { glow: 1.15 }));
  out.push(...solid([[6.9, 4.8], [9.1, 4.8], [9.1, 7.2], [11.4, 7.2], [11.4, 9.4], [9.1, 9.4], [9.1, 11.8], [6.9, 11.8], [6.9, 9.4], [4.6, 9.4], [4.6, 7.2], [6.9, 7.2]], W, { drop: 0.5, d: 0.35, ink: '#b03a62' }));
  out.push(...glint(4.6, 4.8, 0.6));
  out.push(...spark(13.6, 2.6, 1.3), ...spark(2.4, 13, 1, '#fff3a6'), ...spark(13.6, 13.4, 0.9));
  return out;
}

function renew() {
  const g = '#7fd86a';
  const out = [...tile('mint', 'buff'), ...aura(8, 9, 6.8, '#f4fff0', 1.1)];
  const ring = tube([...oval(8, 11.4, 5.4, 2.2, 0, 32), oval(8, 11.4, 5.4, 2.2, 0, 32)[0]], 0.9);
  out.push(...edge(ring, '#2a7a4a', 0.4), S(ring, '#fff8c0'));
  out.push(...solid(tube(bez([8, 12.4], [8.4, 9.6], [7.8, 6.6], 8), 0.9), '#5fb84f', { shadow: false, d: 0.35 }));
  out.push(...leaf([7.8, 7.4], [2.6, 3.8], 3.6, g, { bend: 0.8, veins: 2 }).shapes);
  out.push(...leaf([8, 7], [13.4, 2.6], 4, g, { bend: -0.9, veins: 2 }).shapes);
  out.push(...[[3.2, 9], [12.8, 9.6], [5.4, 14], [11, 14]].flatMap(([x, y]) => [S(tube([[x - 0.9, y], [x + 0.9, y]], 0.5), W), S(tube([[x, y - 0.9], [x, y + 0.9]], 0.5), W)]));
  out.push(...spark(13.8, 13.4, 1, '#fff3a6'));
  return out;
}

function barrier() {
  const out = [...tile('arcane', 'buff')];
  const ball0 = oval(8, 8.2, 6.2, 6.2, 0, 40);
  out.push(drop(ball0), ...edge(ball0, '#4a2a90', 0.45));
  out.push(S(ball0, '#c0a8ff'), S(clip(ball0, oval(7.4, 7.4, 5.6, 5.6)), '#d4c0ff'), S(clip(ball0, oval(7, 7, 4.2, 4.2)), '#e4d8ff'));
  // A honeycomb of force across the bubble.
  for (const [x, y] of [[8, 8.2], [5.2, 6.6], [10.8, 6.6], [5.2, 9.8], [10.8, 9.8], [8, 4.9], [8, 11.5]]) {
    const h = polyPts(x, y, 1.75, 6, 0);
    out.push(...h.map((q, i) => S(clip(tube([q, h[(i + 1) % 6]], 0.22), ball0), '#f4ecff')));
  }
  out.push(S(tube(arcPts(8, 8.2, 5.6, 5.6, 20, 140, 16), (t) => 1.2 * Math.sin(Math.PI * t)), '#ffc4e8'));
  out.push(S(tube(arcPts(8, 8.2, 5.6, 5.6, 150, 230, 12), (t) => 0.9 * Math.sin(Math.PI * t)), '#b4f0ff'));
  out.push(S(tube(arcPts(8, 8.2, 4.6, 4.6, 195, 255, 10), (t) => 1.3 * Math.sin(Math.PI * t)), W));
  out.push(S(oval(11, 4.8, 0.7, 0.7, 0, 12), W));
  out.push(...spark(13.8, 13.6, 1.1), ...spark(2.4, 2.8, 1));
  return out;
}

function revive() {
  const out = [...tile('holy', 'active'), ...aura(8, 9, 6.6, '#fffbe0', 1.2)];
  // Light rising.
  for (const x of [5, 8, 11]) out.push(streak([x, 15], [x, 9], 1.2, '#fffbe0'));
  for (const s of [1, -1]) {
    const wing = [[8 + s * 2, 8.2], [8 + s * 5.4, 4], [8 + s * 7.2, 4.6], [8 + s * 6.6, 7.4], [8 + s * 7, 9], [8 + s * 5.2, 11], [8 + s * 2.4, 11]];
    out.push(...solid(wing, '#ffffff', { light: '#ffffff', ink: '#b08a3a' }));
    out.push(line([[8 + s * 5.4, 7.2], [8 + s * 2.8, 9]], 0.35, '#e6dcc0'), line([[8 + s * 5.4, 9.4], [8 + s * 2.8, 10.2]], 0.35, '#e6dcc0'));
  }
  out.push(...solid(heartPts(8, 9.8, 4.6), '#ff6b8a', { glow: 1.1 }));
  out.push(...glint(6.6, 8.4, 0.5));
  const halo = tube([...oval(8, 2.6, 3, 1, 0, 24), oval(8, 2.6, 3, 1, 0, 24)[0]], 0.75);
  out.push(...edge(halo, '#a0702a', 0.35), S(halo, '#fff3a6'));
  return out;
}

// ---------- Archer ----------

function twinshot() {
  const out = [...tile('hawk', 'active'), ...aura(9, 7, 6.4, '#fff8e0')];
  for (const k of [0.75, -0.75]) {
    const c = [8 + k * 2.6 + (k ? 0 : 0.6), 8 + k * 2.6 - (k ? 0 : 0.6)];
    out.push(streak(add(c, [-1, 1], 6.4), add(c, [-1, 1], 3.6), 0.9, '#fff8e0'));
    out.push(...arrow(add(c, [-1, 1], 3.2), add(c, [1, -1], 3.6), { hw: 1.25, hl: 1.9, fl: k > 0 ? '#6fc8ff' : '#ffffff' }));
  }
  out.push(...spark(13.6, 13.4, 1.2), ...spark(2.6, 2.6, 1));
  return out;
}

function arrowfan() {
  const out = [...tile('hawk', 'active'), ...aura(3, 13, 5, '#ffffff', 1.1)];
  const o = [2.2, 13.8];
  for (const a of [-84, -64, -45, -26, -6]) {
    const u = [Math.cos(a * D2R), Math.sin(a * D2R)];
    out.push(...arrow(add(o, u, 4), add(o, u, 12), { hw: 1.2, hl: 1.9, sw: 0.5, fl: a === -45 ? '#ffffff' : '#6fc8ff' }));
  }
  out.push(...solid(starPts(2.6, 13.4, 2.4, 0.8, 4, -45), '#fffbe0', { d: 0.35, ink: '#7a4a10' }));
  out.push(...spark(13.6, 2.6, 1.2));
  return out;
}

function arrowshower() {
  const out = [...tile('skyblue', 'active')];
  for (const [x, y] of [[4.2, 10.6], [8.4, 13], [12.4, 10], [6.4, 15.6]]) {
    out.push(streak([x + 2.2, y - 9], [x + 1.4, y - 6], 1, '#eef8ff'));
    out.push(...arrow([x + 1.6, y - 7], [x, y], { hw: 1.4, hl: 2.1, sw: 0.6, fl: '#ffd25a', head: '#ffffff' }));
  }
  out.push(...puffs([[3.4, 2.6, 2.2], [7, 2, 2.8], [10.8, 2.4, 2.4], [13.6, 3.2, 1.7]], '#f4fbff', { shadow: false, dark: '#c4dcec', ink: '#2a3a8a' }));
  out.push(...spark(14, 13.8, 1));
  return out;
}

function huntersfocus() {
  const white = '#fffaf2';
  const brown = '#9a6a48';
  const out = [...tile('skyblue', 'buff'), ...aura(7, 8, 6.6, '#eef8ff')];
  // A crosshair behind.
  const ring = tube([...oval(8.4, 8, 6, 6, 0, 36), oval(8.4, 8, 6, 6, 0, 36)[0]], 0.5);
  out.push(S(ring, '#eef8ff'));
  out.push(S(tube([[8.4, 1.2], [8.4, 3.6]], 0.5), '#eef8ff'), S(tube([[8.4, 12.4], [8.4, 14.8]], 0.5), '#eef8ff'), S(tube([[1.6, 8], [3.8, 8]], 0.5), '#eef8ff'), S(tube([[13, 8], [15, 8]], 0.5), '#eef8ff'));
  // The eagle's head in profile, facing right.
  const neck = [[2.4, 15], [3, 10.4], [4.6, 7.2], [7.4, 5.4], [10.4, 5.2], [12.2, 6.4], [11.4, 9.2], [9, 10.4], [8, 15]];
  out.push(...solid(neck, white, { k: 0.85 }));
  out.push(S(clip(neck, rect(0, 12.6, 16, 4)), brown), S(clip(neck, rect(0, 12.6, 16, 0.8)), lt(brown)));
  for (const x of [3.4, 5.4, 7.2]) out.push(S([[x, 12.6], [x + 1, 12.6], [x + 0.5, 13.8]], lt(brown)));
  const beak = [[10.6, 5.4], [13.4, 5.6], [14.8, 7.4], [14.4, 9.6], [13.2, 8.2], [11.4, 8.8]];
  out.push(...solid(beak, '#ffc23a', { shadow: false, d: 0.4 }));
  out.push(S([[13.2, 8.2], [14.4, 9.6], [14.8, 7.4], [14, 7.8]], '#e0902a'));
  // A fierce eye with a brow.
  out.push(S(oval(9.2, 7, 1.15, 0.95, 0, 16), '#2a2035'), S(oval(9.35, 7, 0.75, 0.65, 0, 14), '#ffb02a'), S(oval(9.5, 7, 0.38, 0.45, 0, 10), '#2a2035'), S(oval(9.1, 6.7, 0.25, 0.25, 0, 8), W));
  out.push(S([[7.2, 6.2], [10.6, 5.6], [10.4, 6.4]], '#c9b8a8'));
  out.push(...spark(13.6, 13, 1.2), ...spark(2.4, 3, 1, '#fff3a6'));
  return out;
}

function falcondive() {
  // The finisher: a golden falcon of light diving with its wings raised in a V, the primaries
  // along each wing's back edge tipped white, a white head and beak, and speed lines streaming
  // off it. Gold on a sky tile, tipped into the dive.
  const HW = { wing: '#ffc94a', wingDk: '#d8802a', ink: '#7a3a10', gold: '#fff6c0', head: '#fffaf2', beak: '#ffffff' };
  const out = [...tile('skyblue', 'active'), ...aura(8, 7.4, 6.8, '#fffbe0', 1.1)];
  const TILE_N = out.length;
  // Each wing: a broad arm whose back edge breaks into three primaries, lit and shaded facets, a
  // pale leading edge, and gold over the feather tips.
  const wing = (root, tip, side) => {
    const u = N(root, tip);
    const nn = [-u[1] * side, u[0] * side];
    const m = [(root[0] + tip[0]) / 2, (root[1] + tip[1]) / 2];
    const back = [0, 1, 2].flatMap((i) => [add(add(tip, u, -1.5 * i - 0.2), nn, -1.2 - 0.9 * i), add(add(tip, u, -1.5 * i - 1.3), nn, -0.6 - 0.9 * i)]);
    const arm = [root, add(m, nn, 1.9), add(tip, nn, 0.3), tip, ...back, add(root, nn, -1.9)];
    return [...facet(arm, root, tip, HW.wing, { ink: HW.ink, d: 0.5, dark: HW.wingDk }),
      S(clip(arm, oval(tip[0] - u[0] * 1.4, tip[1] - u[1] * 1.4, 2.4, 2.4, 0, 16)), HW.gold), S(tube([add(root, nn, 1.1), add(m, nn, 1.7), add(tip, u, -0.7)], 0.5), '#fff0b0')];
  };
  out.push(...wing([6.4, 8.6], [1.6, 1.6], -1), ...wing([9.8, 8.6], [14.4, 1.8], 1));
  // The body tapering to a fanned tail, the white head on top, turned to the right.
  const body = [[6, 8], [10.2, 8], [9.8, 11.2], [10.6, 14.4], [8.2, 13.4], [5.8, 14.4], [6.4, 11.2]];
  out.push(...solid(body, HW.wing, { ink: HW.ink, d: 0.5, light: '#fff0b0' }));
  // Lightning crackling down on either side of it.
  out.push(streak([2.4, 10.4], [4.6, 13.4], 1, '#eef8ff'), streak([13.6, 10.4], [11.6, 13.6], 1, '#eef8ff'), streak([8.2, 15.4], [8.2, 14.4], 0.9, '#eef8ff'));
  const head = oval(8.4, 6.4, 2.6, 2.3, 0, 22);
  out.push(...solid(head, HW.head, { ink: '#7a3a10', d: 0.45, light: W }));
  const beak = [[10.6, 5.6], [12.8, 6], [12.4, 7.8], [11, 7.4]];
  out.push(...solid(beak, HW.beak, { shadow: false, ink: '#7a4a10', d: 0.4 }), S([[12.4, 7.8], [12.8, 6], [11.8, 6.8]], '#e0902a'));
  out.push(S(oval(9.4, 6.1, 0.75, 0.75, 0, 12), '#2a2035'), S(oval(9.55, 6.15, 0.42, 0.42, 0, 10), '#ffc23a'), S(oval(9.15, 5.8, 0.24, 0.24, 0, 8), W));
  out.push(S([[7.4, 5.1], [10.6, 4.7], [10.4, 5.4]], '#7a3a10'));
  out.push(...spark(8, 1.6, 1.1, W));
  return [...out.slice(0, TILE_N), ...spin(out.slice(TILE_N), 40)];
}

function flipshot() {
  const out = [...tile('hawk', 'active'), ...aura(8, 7.6, 6.6, '#fff8e0')];
  // A gust looping back over the top: a curled arrow.
  const path = arcPts(8.4, 8, 5, 4.8, 25, -185, 26);
  const body = tube(path, (t) => 0.5 + 1.7 * Math.sin(Math.PI * Math.min(0.92, t)));
  out.push(drop(body), ...edge(body, '#7a4a10', 0.45), S(body, '#fff6dc'), S(tube(arcPts(8.4, 8, 5.5, 5.3, -20, -150, 16), (t) => 0.6 * Math.sin(Math.PI * t)), W));
  const end = path[path.length - 1];
  const u = N(path[path.length - 4], end);
  const n = [-u[1], u[0]];
  const p = along(end, u, n);
  out.push(...solid([p(3.2, 0), p(-0.4, 2.6), p(0.4, 0), p(-0.4, -2.6)], '#ffe36b', { ink: '#6a4a10', d: 0.45 }));
  out.push(S(tube(bez([12.6, 4.4], [15, 6.6], [13.6, 9.4], 8), (t) => 0.7 * Math.sin(Math.PI * t)), '#b4e0ff'));
  out.push(...arrow([5.4, 10.4], [14.4, 10.6], { hw: 1.1, hl: 1.7, sw: 0.5 }));
  out.push(...arrow([6.4, 13.4], [14.6, 13.8], { hw: 1.1, hl: 1.7, sw: 0.5, fl: '#6fc8ff' }));
  out.push(...spark(2.4, 2.6, 1));
  return out;
}

function eagleeye() {
  const out = [...tile('hawk', 'passive')];
  const rings = [[6.4, '#ff5a6e'], [5, '#fff6ee'], [3.6, '#ff5a6e'], [2.2, '#fff6ee'], [1, '#ffd25a']];
  out.push(drop(oval(7.4, 8.6, 6.4, 6.4, 0, 36)), ...edge(oval(7.4, 8.6, 6.4, 6.4, 0, 36), '#7a2a3a', 0.5));
  for (const [r, c] of rings) out.push(S(oval(7.4, 8.6, r, r, 0, 36), c), S(cut(oval(7.4, 8.6, r, r, 0, 36), [12, 2], [2, 15]), sh(c)));
  out.push(...arrow([15.4, 1.4], [7.6, 8.4], { hw: 1.2, hl: 1.9, sw: 0.55, fl: '#6fc8ff' }));
  out.push(...[-50, 0, 50, 140, 200].map((a) => streak(add([7.4, 8.6], [Math.cos(a * D2R), Math.sin(a * D2R)], 2.2), add([7.4, 8.6], [Math.cos(a * D2R), Math.sin(a * D2R)], 0.8), 0.4, W)));
  out.push(...glint(4, 5.4, 0.6), ...spark(2.4, 2.6, 1.2, '#fff3a6'));
  return out;
}

function bowmastery() {
  const out = [...tile('hawk', 'passive'), ...aura(8, 8, 6.6, '#fff8e0')];
  out.push(...longbow([3.4, 14.2], [2.8, 1.8], 2.2, { grip: '#3a74d0' }));
  out.push(...arrow([3.4, 8.2], [14.4, 7.8], { hw: 1.25, hl: 2, fl: '#6fc8ff' }));
  out.push(...glint(6.2, 4.4, 0.5), ...spark(13.6, 2.8, 1.1), ...spark(12.4, 13, 1, '#eef8ff'));
  return out;
}

// ---------- Ranger ----------

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

function rangermastery() {
  const out = [...tile('wind', 'passive'), ...aura(8, 8, 6.6, '#f0fff8')];
  out.push(...curl(8.6, 9, 5, 120, '#c4f5d4'));
  out.push(...longbow([3.4, 14.2], [2.8, 1.8], 2.2));
  out.push(...arrow([3.4, 8.2], [14.4, 7.8], { hw: 1.25, hl: 2, fl: '#ffd25a' }));
  out.push(...leaf([10.4, 13.6], [14, 10.4], 2.6, '#7fd86a', { bend: 0.6, veins: 1 }).shapes);
  out.push(...glint(6.2, 4.4, 0.5), ...spark(13.6, 2.8, 1.1));
  return out;
}

function galevolley() {
  const out = [...tile('wind', 'active'), ...aura(9, 8, 6.4, '#f0fff8', 1.1)];
  // Three arrows flying out of one curl of wind, fanned.
  out.push(...swoosh(6.6, 9, 5.4, 4.4, 60, 320, 1.6, '#e8fff4', { ink: '#1a6a5a' }));
  for (const [a, fl] of [[-30, '#ff8fb0'], [0, '#ffd25a'], [30, '#ff8fb0']]) {
    const u = [Math.cos(a * D2R), Math.sin(a * D2R)];
    out.push(...arrow(add([5, 8.6], u, 3.4), add([5, 8.6], u, 10.2), { hw: 1.2, hl: 1.9, sw: 0.5, fl }));
  }
  out.push(...spark(14, 13.4, 1.1), ...spark(2.2, 2.6, 1));
  return out;
}

function cyclone() {
  const out = [...tile('sky', 'active')];
  // A funnel of wind, wide at the top, with an arrow driving through its heart.
  for (const [cy, rx, c] of [[3.4, 6, '#f0fff8'], [6.2, 4.8, '#c8ecff'], [9, 3.6, '#f0fff8'], [11.6, 2.5, '#c8ecff'], [13.8, 1.5, '#f0fff8']]) {
    out.push(...swoosh(8, cy, rx, rx * 0.34, -200, 120, 1.15, c, { ink: '#1f5a6a' }));
  }
  out.push(...arrow([1.2, 9.6], [15, 7.2], { hw: 1.3, hl: 2.1, fl: '#ffd25a', head: '#ffffff' }));
  out.push(...leaf([2.4, 4], [4.6, 2.2], 1.8, '#7fd86a', {}).shapes, ...leaf([12, 13.6], [14.6, 12.4], 1.8, '#7fd86a', {}).shapes);
  return out;
}

function tailwind() {
  const out = [...tile('mint', 'buff'), ...aura(9, 7, 6.6, '#f4fff0', 1.1)];
  // A white feather swept forward on three streams of wind.
  for (const [y, len] of [[4.6, 9], [8.4, 11], [12.2, 8]]) out.push(streak([14.2 - len, y + 1], [14.2, y], 1.4, '#e8fff4'));
  out.push(...leaf([3, 13.6], [13.6, 2.6], 4.6, '#fffaf2', { bend: 0.9, rib: '#c4e8d4', veins: 3, veinC: '#c4e8d4' }).shapes);
  out.push(line([[2.2, 14.6], [4.4, 12.2]], 0.5, '#9a6a48'));
  out.push(...curl(10.6, 11.2, 2.6, 200, '#c4f5b4'));
  out.push(...spark(13.6, 13.6, 1.1, '#fff3a6'), ...spark(2.4, 3, 1));
  return out;
}

function stormvolley() {
  const out = [...tile('storm', 'active'), ...aura(8, 9, 6.6, '#e8fff4', 1.1)];
  // A ring of wind on the ground with arrows pouring down into it from every side.
  out.push(...swoosh(8, 11.6, 6, 2.2, -190, 150, 1.4, '#8fe8c0', { ink: '#1a4a5a' }));
  for (const [x, y] of [[3.4, 10.6], [6.6, 12.8], [9.6, 9.4], [12.6, 11.6]]) {
    out.push(streak([x - 1.4, y - 9.6], [x - 0.9, y - 6.6], 0.9, '#e8fff4'));
    out.push(...arrow([x - 1.2, y - 6.4], [x, y], { hw: 1.2, hl: 1.9, sw: 0.5, fl: '#ffd25a', head: '#ffffff' }));
  }
  out.push(...spark(8, 2, 1.3, '#e8fff4'), ...spark(14, 3.4, 0.9));
  return out;
}

// ---------- Sniper ----------

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

function snipermastery() {
  const out = [...tile('steel', 'passive'), ...aura(8, 8, 6.6, '#e8f2ff')];
  out.push(...sightArt(8.4, 8, 5.4, '#eef8ff', 0.5));
  out.push(...crossbowArt([2, 11.4], [12.4, 6.4]));
  out.push(...glint(5, 9.6, 0.5), ...spark(13.6, 13.6, 1.1));
  return out;
}

function marksman() {
  const out = [...tile('steel', 'active'), ...aura(5, 8, 5.6, '#e8f2ff', 1.1)];
  // Three bolts in a line, one after another, on hard streaks.
  for (const [y, x] of [[4.2, 0], [8, 2], [11.8, 0]]) {
    out.push(streak([x + 1, y + 0.6], [x + 7, y], 1.6, '#eef8ff'));
    out.push(...arrow([x + 4.2, y], [x + 13.4, y], { hw: 1.35, hl: 2, sw: 0.65, fl: '#ff5a7a', head: '#ffffff', shaft: '#d4cde8' }));
  }
  out.push(...spark(14.2, 2.2, 1.1), ...spark(14, 14, 0.9));
  return out;
}

function glacier() {
  const out = [...tile('ice', 'active'), ...aura(11, 7, 6, '#ffffff', 1.1)];
  // A bolt with an ice crystal for a head, and frost shards bursting off it.
  out.push(streak([1, 13.6], [6, 9.4], 1.6, '#e8fbff'));
  out.push(...arrow([2.4, 13.4], [9.6, 6.8], { hw: 1.2, hl: 1.8, sw: 0.6, fl: '#8fe3ff', head: '#e8fbff', shaft: '#d4cde8' }));
  const crystal = [[11.6, 2], [13.8, 4.6], [12.6, 7.6], [9.8, 8.6], [8.6, 6.4], [9.4, 3.6]];
  out.push(...facet(crystal, [11.6, 2], [9.8, 8.6], '#bff0ff', { ink: '#1c4a9a', dark: '#7fc8f0' }));
  for (const [x, y, a] of [[14, 9.6, 30], [6.4, 3, -150], [12, 11.2, 70], [14.4, 1.6, -40]]) out.push(...solid(polyPts(x, y, 1.1, 4, a, 1.6), '#e8fbff', { shadow: false, d: 0.35, ink: '#1c4a9a' }));
  out.push(...glint(11, 3.6, 0.5));
  return out;
}

function steadyaim() {
  const out = [...tile('glacier', 'buff'), ...aura(8, 8, 6.8, '#e8f6ff', 1.1)];
  out.push(...sightArt(8, 8, 5.4, '#ff8aa8', 0.7));
  out.push(...sightArt(8, 8, 2.6, '#eef8ff', 0.45));
  out.push(...solid(polyPts(8, 8, 1.3, 4, -90, 1.2), '#ff5a7a', { shadow: false, d: 0.35, ink: '#6a1030' }));
  out.push(...spark(13.6, 2.6, 1.2), ...spark(2.6, 13.4, 1, '#fff3a6'));
  return out;
}

function heartseeker() {
  const out = [...tile('royal', 'active'), ...aura(10, 6, 6.4, '#ffd0dc', 1.2)];
  // A sight locked on a rose heart, and a giant bolt of light driven through both.
  out.push(...sightArt(10, 6, 4.6, '#ff8aa8', 0.6));
  out.push(...solid(heartPts(10, 6.4, 3.2), '#ff5a7a', { glow: 1.15 }));
  out.push(streak([0.6, 15.6], [6, 10.2], 2.4, '#eef8ff'));
  out.push(...arrow([2, 14.2], [14.6, 1.6], { hw: 1.7, hl: 2.6, sw: 0.75, fl: '#7fc4ff', head: '#ffffff', shaft: '#eef8ff' }));
  out.push(...spark(14, 13.4, 1.2, '#ffd0dc'), ...spark(2.6, 2.6, 1));
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

// ---------- Ice / lightning wizard ----------

function frostEmblem(x, y) {
  return [...snowflake(x, y, 2.1, W, 0.5), S(oval(x, y, 0.6, 0.6, 0, 10), '#fff36b')];
}
function ilmastery() {
  return [...tile('ice', 'passive'), ...aura(8.4, 8.4, 6.6, '#e8fbff'), ...tome('#4f8ae0', '#8fd8ff', frostEmblem), ...spark(14, 13.8, 1, '#fff36b')];
}

function coldbeam() {
  const ice = '#c8f4ff';
  const out = [...tile('ice', 'active'), ...aura(9, 7, 6.4, '#f0fdff')];
  out.push(S(tube([[0.6, 15.4], [7.6, 8.4]], (t) => 0.4 + 3.6 * t), '#e8fbff'), S(tube([[1.6, 14.4], [7.6, 8.4]], (t) => 0.2 + 1.4 * t), W));
  for (const [x, y] of [[2.4, 10.4], [5.2, 13.6], [1.8, 6.6]]) out.push(...snowflake(x, y, 0.9, '#f0fdff', 0.32));
  // The lance: a long six-sided crystal, pointed at both ends.
  const a = [4.6, 11.4];
  const b = [14.6, 1.4];
  const u = N(a, b);
  const n = [-u[1], u[0]];
  const p = along(a, u, n);
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const lance = [p(0, 0), p(3, 1.9), p(L - 3.6, 1.6), p(L, 0), p(L - 3.6, -1.6), p(3, -1.9)];
  out.push(...facet(lance, p(0, 0), p(L, 0), ice, { ink: '#1a4a8a' }));
  out.push(S([p(3, -1.9), p(L - 3.6, -1.6), p(L - 3.4, -0.5), p(3, -0.6)], hi(ice)));
  out.push(S([p(L - 3.6, 1.6), p(L, 0), p(L - 3.4, 0.4)], '#8fd4f8'), S([p(0, 0), p(3, 1.9), p(3, 0.5)], '#8fd4f8'));
  out.push(line([p(2.2, -0.2), p(L - 2.2, -0.2)], 0.25, W));
  out.push(...spark(13.8, 1.8, 1.6), ...spark(12.8, 10.4, 1.1), ...spark(6, 2.6, 1));
  return out;
}

function thunderbolt() {
  const out = [...tile('storm', 'active'), ...aura(8, 11, 5, '#fff8c0', 1.1)];
  out.push(...bolt([[9.6, 3.4], [6.2, 8.4], [9.6, 8.6], [5.4, 15]], 3.4, '#ffe86b', { ink: '#4a3a10' }));
  out.push(...puffs([[3.4, 3.6, 2.4], [7, 2.8, 2.9], [10.8, 3, 2.6], [13.2, 4, 1.8], [8.6, 4.8, 2.2]], '#6a70b8', { shadow: false, light: '#9aa0e0', dark: '#4a4f98', ink: '#1a1a50' }));
  out.push(S(tube([[11.2, 6.4], [12.8, 8.6], [12, 9], [13.6, 11.4]], (t) => 0.8 * (1 - t) + 0.1), '#fff8c0'));
  out.push(S(tube([[3, 6.6], [2.4, 8.4], [3.4, 8.8], [2.4, 10.8]], (t) => 0.7 * (1 - t) + 0.1), '#fff8c0'));
  out.push(...spark(11.8, 14, 1.2, '#fff8c0'));
  return out;
}

function stormfocus() {
  const out = [...tile('storm', 'buff'), ...aura(8, 8, 7, '#fff4a0', 1.1)];
  const orb = oval(8, 8, 4, 4, 0, 30);
  out.push(...solid(orb, '#ffe86b', { glow: 1.2, light: '#fffbe0' }));
  out.push(S(tube([[6.6, 5.4], [8.4, 7.4], [7.2, 8.2], [9.6, 10.8]], (t) => 0.8 * (1 - t) + 0.2), W));
  // Static arcs crackling around it.
  for (const [pts, w] of [[[[2, 4.4], [3.6, 5.4], [2.8, 6.6], [4.4, 7.6]], 0.7], [[[14.2, 9], [12.6, 9.6], [13.6, 11], [11.8, 11.6]], 0.7], [[[11.4, 1.6], [11, 3.4], [12.4, 3.4], [11.8, 5]], 0.6], [[[3.6, 14.4], [4.4, 12.8], [3.2, 12.6], [4.8, 11.2]], 0.6]]) {
    out.push(...edge(tube(pts, w), '#2c2f86', 0.3), S(tube(pts, w), '#fff8c0'));
  }
  out.push(...glint(6.2, 5.8, 0.6));
  return out;
}

// ---------- Fire / poison wizard ----------

function fireEmblem(x, y) {
  return [S(flamePts(x, y + 2, 2.6, 4.2), '#ff5a3a'), S(flamePts(x + 0.1, y + 1.8, 1.5, 2.6), '#ffe9a0')];
}
function firemastery() {
  return [...tile('fire', 'passive'), ...aura(8.4, 8.4, 6.6, '#fff0c0'), ...tome('#9b4fe0', '#ffd27a', fireEmblem), ...spark(14, 13.8, 1, '#fff36b')];
}

function fireball() {
  const out = [...tile('fire', 'active'), ...aura(10, 6, 6, '#fff4c0', 1.1)];
  // Trailing flames, then the blazing head.
  const tail = (a, b, w, c) => S(tube(bez(a, [(a[0] + b[0]) / 2 + 1.2, (a[1] + b[1]) / 2 + 1.2], b, 10), (t) => 0.2 + w * Math.pow(t, 0.8)), c);
  out.push(tail([1, 15], [8.4, 7.6], 4.6, '#ff6a3a'), tail([2.4, 13], [8.8, 7.4], 3, '#ffa23c'), tail([4, 12.4], [9.2, 7.2], 1.6, '#ffe9a0'));
  out.push(tail([1.4, 10.4], [7, 7.2], 1.2, '#ffa23c'), tail([5.4, 15], [9, 9.6], 1.4, '#ff6a3a'));
  const head = oval(10.2, 5.8, 3.8, 3.8, 0, 30);
  out.push(...edge(head, '#7a1a10', 0.5), S(head, '#ff6a3a'), S(oval(10.4, 5.6, 2.9, 2.9, 0, 26), '#ffa23c'), S(oval(10.7, 5.3, 1.8, 1.8, 0, 20), '#ffe9a0'), S(oval(11, 5, 0.8, 0.8, 0, 12), W));
  out.push(...spark(14.2, 12.4, 1.1, '#fff4c0'), ...spark(3.4, 2.6, 1));
  return out;
}

function poisonmist() {
  const out = [...tile('poison', 'active')];
  out.push(...puffs([[4, 10.6, 3], [8.2, 8.6, 4], [12.2, 10.4, 3], [8, 12.4, 3]], '#a8e86b', { light: '#d8ffa8', dark: '#6fb84f', ink: '#2a4a1a' }));
  // A sickly little skull in the cloud.
  out.push(...solid(oval(8.2, 9, 2.6, 2.4, 0, 22), '#f4ffe8', { shadow: false, d: 0.35, ink: '#2a4a1a' }));
  out.push(...solid(rect(6.9, 10.6, 2.6, 1.6), '#f4ffe8', { shadow: false, flat: true, d: 0.35, ink: '#2a4a1a' }));
  out.push(S(oval(7.2, 9.1, 0.75, 0.85, 0, 12), '#5a2a8a'), S(oval(9.2, 9.1, 0.75, 0.85, 0, 12), '#5a2a8a'), S([[8.2, 10], [7.8, 10.7], [8.6, 10.7]], '#5a2a8a'));
  out.push(line([[7.7, 11.2], [7.7, 12.2]], 0.25, '#7a9a6a'), line([[8.7, 11.2], [8.7, 12.2]], 0.25, '#7a9a6a'));
  // Bubbles.
  for (const [x, y, r] of [[3.4, 4.6, 1.2], [12.6, 3.4, 1], [6.6, 2.4, 0.7], [13.4, 6.4, 0.6]]) out.push(...solid(oval(x, y, r, r, 0, 16), '#c88aff', { shadow: false, d: 0.3, ink: '#3a1a6a' }), S(oval(x - r * 0.35, y - r * 0.35, r * 0.3, r * 0.3, 0, 8), W));
  return out;
}

function meditate() {
  const petal = '#ffb8d0';
  const out = [...tile('fire', 'buff'), ...aura(8, 6, 6, '#fff6c0', 1.2)];
  out.push(...flame(8, 8.8, 4, 7.4, ['#ff6a3a', '#ffb347', '#fff1a8'], { lean: 0.4 }));
  // A lotus beneath the flame.
  for (const [b, t, w] of [[[7.6, 13], [1.4, 8.6], 3.2], [[8.4, 13], [14.6, 8.6], 3.2], [[7.8, 13.2], [3.8, 7.4], 3.4], [[8.2, 13.2], [12.2, 7.4], 3.4]]) {
    const lf = leaf(b, t, w, petal, { rib: '#fff0f6' });
    out.push(...edge([...lf.A, ...lf.B.slice().reverse()], '#9a2a5a', 0.4), ...lf.shapes);
  }
  const front = leaf([8, 13.6], [8, 7.6], 3.6, '#ffd0e0', { rib: W });
  out.push(...edge([...front.A, ...front.B.slice().reverse()], '#9a2a5a', 0.4), ...front.shapes);
  out.push(...solid(oval(8, 13.8, 4.6, 1, 0, 24), '#7fd86a', { shadow: false, d: 0.35 }));
  out.push(...spark(13.6, 2.8, 1.2, '#fff6c0'), ...spark(2.6, 3.4, 1));
  return out;
}

// ---------- Cleric ----------

function crossEmblem(x, y) {
  return [S(rect(x - 0.6, y - 2.2, 1.2, 4.4), W), S(rect(x - 1.8, y - 1.1, 3.6, 1.2), W)];
}
function holymastery() {
  return [...tile('holy', 'passive'), ...aura(8.4, 8.4, 6.6, '#fffbe0'), ...tome('#f4f0ff', '#ffc84a', crossEmblem), ...spark(14, 13.8, 1)];
}

function bless() {
  const out = [...tile('seraph', 'buff'), ...aura(8, 4, 7, '#ffffff', 1.1)];
  // Rays of blessing pouring down.
  for (const [x0, x1] of [[5, 2.4], [7, 5.8], [9, 10.2], [11, 13.6]]) out.push(S([[x0 - 0.5, 5], [x0 + 0.5, 5], [x1 + 1, 15], [x1 - 1, 15]], '#fffbe0'));
  const halo = tube([...oval(8, 4.4, 5, 1.9, 0, 30), oval(8, 4.4, 5, 1.9, 0, 30)[0]], 1.3);
  out.push(drop(halo), ...edge(halo, '#a0601a', 0.45), S(halo, '#ffd84a'), S(tube(arcPts(8, 4.4, 5, 1.9, 190, 300, 12), 0.5), '#fffbe0'));
  // Little feathers drifting.
  for (const [b, t] of [[[4, 13.6], [2.6, 9.6]], [[11.6, 12.6], [13.6, 9]]]) out.push(...solid([...leaf(b, t, 1.8, W).A, ...leaf(b, t, 1.8, W).B.reverse()], W, { d: 0.35, ink: '#a0702a', light: W }));
  out.push(...spark(8, 10.6, 2, W), ...spark(5.6, 8, 0.9), ...spark(10.8, 8.4, 0.9));
  return out;
}

function heal() {
  const g = '#6fe07a';
  const out = [...tile('sky', 'active'), ...aura(8, 8, 7.2, '#ffffff', 1.1)];
  for (let i = 0; i < 8; i++) {
    const a = (i * 45 + 22.5) * D2R;
    out.push(S([[8 + Math.cos(a - 0.12) * 3, 8 + Math.sin(a - 0.12) * 3], [8 + Math.cos(a) * 8, 8 + Math.sin(a) * 8], [8 + Math.cos(a + 0.12) * 3, 8 + Math.sin(a + 0.12) * 3]], '#fffbe0'));
  }
  const cross = [[6.2, 2.2], [9.8, 2.2], [9.8, 6.2], [13.8, 6.2], [13.8, 9.8], [9.8, 9.8], [9.8, 13.8], [6.2, 13.8], [6.2, 9.8], [2.2, 9.8], [2.2, 6.2], [6.2, 6.2]];
  out.push(drop(cross), ...edge(cross, '#1a5a2a', 0.55));
  out.push(...bevel(cross, [[6.9, 2.9], [9.1, 2.9], [9.1, 6.9], [13.1, 6.9], [13.1, 9.1], [9.1, 9.1], [9.1, 13.1], [6.9, 13.1], [6.9, 9.1], [2.9, 9.1], [2.9, 6.9], [6.9, 6.9]], g, '#8ff09a'));
  out.push(S([[7.2, 3.2], [8.2, 3.2], [8.2, 7], [7.2, 8]], '#d4ffd8'));
  out.push(...spark(13.4, 2.6, 1.3), ...spark(2.6, 13.4, 1.1), ...spark(13.4, 13.4, 0.9, '#fff3a6'));
  return out;
}

function holybolt() {
  const gold = '#ffe36b';
  const out = [...tile('storm', 'active'), ...aura(11, 5, 5.4, '#fff8d0', 1.2)];
  out.push(S(tube([[1, 15], [10.2, 5.8]], (t) => 0.2 + 3.4 * t), '#fffbe0'));
  const a = [2.6, 13.4];
  const b = [12.8, 3.2];
  const u = N(a, b);
  const n = [-u[1], u[0]];
  const p = along(a, u, n);
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  out.push(...solid(tube([p(0), p(L - 3)], 1.1), gold, { d: 0.45 }));
  const head = [p(L, 0), p(L - 3.6, 1.8), p(L - 3, 0), p(L - 3.6, -1.8)];
  out.push(...facet(head, p(L, 0), p(L - 3, 0), '#fff8d0', { d: 0.45, ink: '#9a5a10' }));
  out.push(...solid(tube([p(L - 3.4, 1.9), p(L - 3.4, -1.9)], 0.9), gold, { shadow: false, d: 0.35 }));
  out.push(S(starPts(13, 3, 3, 0.7, 4, -90), W), S(starPts(13, 3, 1.8, 0.5, 4, -45), '#fff3a6'));
  out.push(...spark(4, 4, 1.2), ...spark(13.8, 12.6, 1));
  return out;
}

// ---------- Ice / lightning archmage ----------

function ilarchmastery() {
  const emblem = (x, y) => [...snowflake(x, y, 2.2, W, 0.45), S(tube([[x + 0.6, y - 2], [x - 0.6, y], [x + 0.6, y], [x - 0.6, y + 2]], 0.5), '#fff36b')];
  return [...tile('ice', 'passive'), ...aura(9.4, 6.6, 6, '#f0fdff', 1.1), ...staffHead('#6fc8ff', emblem, { wood: '#4f6ad0' }), ...spark(13.8, 13.4, 1.2, '#fff36b'), ...spark(2.6, 3, 1)];
}

function chainlightning() {
  const out = [...tile('storm', 'active')];
  const nodes = [[2.8, 12.6], [6.6, 4], [10, 11.6], [13.4, 3.4]];
  nodes.forEach(([x, y]) => out.push(...aura(x, y, 2.8, '#fff8c0', 1.1, 3)));
  for (let i = 0; i < 3; i++) {
    const [a, b] = [nodes[i], nodes[i + 1]];
    const u = N(a, b);
    const n = [-u[1], u[0]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const zig = [a, ...[0.22, 0.42, 0.6, 0.8].map((t, k) => add(add(a, u, len * t), n, (k % 2 ? -1 : 1) * 1.1)), b];
    out.push(drop(tube(zig, 1.2)), ...edge(tube(zig, 1.2), '#1a1a40', 0.45), S(tube(zig, 1.2), '#ffe86b'), S(tube(zig, 0.45), W));
  }
  nodes.forEach(([x, y]) => out.push(...solid(oval(x, y, 1.25, 1.25, 0, 16), '#8fd0ff', { shadow: false, d: 0.4, ink: '#1a2a6a', light: W }), S(starPts(x, y, 2.4, 0.4, 4, -45), W)));
  return out;
}

function icespire() {
  const ice = '#d4f6ff';
  const out = [...tile('glacier', 'active'), ...aura(8, 10, 6.8, '#c8f0ff', 1.1)];
  const spike = (x, base, top, w, lean = 0) => {
    const pts = [[x - w / 2, base], [x + lean, top], [x + w / 2, base]];
    return facet(pts, [x + lean, top], [x + lean * 0.2, base], ice, { ink: '#0a2a6a', d: 0.5, dark: '#8fd0f4' });
  };
  out.push(...spike(3.4, 14, 6, 3.6, -1.2), ...spike(12.8, 14, 4.8, 3.8, 1.2), ...spike(8, 14.4, 1.4, 5, 0.2));
  out.push(S([[7.2, 12.4], [8.1, 2.8], [8.5, 4.8]], W), S([[2.4, 12.6], [2.4, 7.2], [3, 9.2]], W), S([[11.8, 12.6], [13.6, 6], [13.2, 8]], W));
  out.push(...solid([[0.8, 13.4], [4, 12.8], [8, 13.6], [12, 12.8], [15.2, 13.4], [15.2, 15.2], [0.8, 15.2]], '#e8f8ff', { shadow: false, d: 0.4, ink: '#0a2a6a' }));
  out.push(...facet([[5.2, 4.4], [5.8, 2.6], [6.4, 4.4]], [5.8, 2.6], [5.8, 4.4], ice, { d: 0.35, ink: '#0a2a6a' }));
  out.push(...facet([[10.4, 6.6], [11.6, 5.2], [11.4, 7.2]], [11.6, 5.2], [10.8, 7], ice, { d: 0.35, ink: '#0a2a6a' }));
  out.push(...spark(13.6, 2.4, 1.3), ...spark(1.8, 3.4, 1));
  return out;
}

function frostsprite() {
  // The summon: a tiny ice fairy with icy hair, violet eyes, a bell dress, and crystal wings.
  const out = [...tile('ice', 'buff'), ...aura(8, 7.4, 6.8, '#ffffff', 1.1)];
  const iceInk = '#1a4a8a';
  // Crystal shard wings, an upper and a lower pair, each split into a lit and a shaded facet.
  const wing = (root, tip, side, wd) => {
    const m = [(root[0] + tip[0]) / 2, (root[1] + tip[1]) / 2];
    const u = N(root, tip);
    const pts = [root, add(m, [-u[1], u[0]], wd * side), tip, add(m, [-u[1], u[0]], -wd * 0.4 * side)];
    return facet(pts, root, tip, '#c8f2ff', { ink: iceInk, d: 0.4, dark: '#8fcff0' });
  };
  out.push(...wing([6.8, 10.2], [0.9, 5.4], 1, 2.6), ...wing([9.2, 10.2], [15.1, 5.4], -1, 2.6));
  out.push(...wing([6.8, 10.8], [1.8, 13.4], -1, 1.5), ...wing([9.2, 10.8], [14.2, 13.4], 1, 1.5));
  // A bell dress below the head.
  const dress = [[6.8, 10], [9.2, 10], [10.8, 14.4], [5.2, 14.4]];
  out.push(...solid(dress, '#8fe0fa', { ink: iceInk, d: 0.4, light: '#d8f8ff' }), S([[5.8, 13.6], [10.2, 13.6], [10.8, 14.4], [5.2, 14.4]], '#d8f8ff'));
  // Head: skin face under a cap of icy hair with a crystal bun on top.
  out.push(...solid(oval(8, 7, 3.4, 3.1, 0, 24), '#fff1ec', { ink: '#4f7fcf', d: 0.4, light: W }));
  const hair = [...arcPts(8, 7, 3.6, 3.4, 170, 370, 16), [10.8, 6.4], [9.6, 5.6], [8.6, 6.6], [7.4, 5.6], [6, 6.8], [5.2, 6.4]];
  out.push(...edge(hair, '#2f5aa8', 0.4), S(hair, '#a6dcff'), S(clip(hair, oval(6.6, 3.8, 2.6, 1.6)), '#e6f7ff'));
  out.push(...facet([[7, 3.6], [8, 1.2], [9, 3.6]], [8, 1.2], [8, 3.6], '#e8fbff', { ink: iceInk, d: 0.35, shadow: false }));
  // Big violet eyes with white glints, blush, and a small smile.
  for (const x of [6.7, 9.3]) out.push(S(oval(x, 8, 0.7, 0.95, 0, 12), '#5a2aa0'), S(oval(x, 8.3, 0.45, 0.5, 0, 10), '#c46cff'), S(oval(x - 0.25, 7.6, 0.28, 0.3, 0, 8), W));
  out.push(S(oval(5.6, 9.2, 0.7, 0.35, 0, 10), '#ffa6c8'), S(oval(10.4, 9.2, 0.7, 0.35, 0, 10), '#ffa6c8'));
  out.push(S(arcPts(8, 9.2, 0.55, 0.4, 20, 160, 6).concat(arcPts(8, 9.2, 0.2, 0.12, 160, 20, 6)), '#b8406a'));
  out.push(...snowflake(13.4, 2.6, 1, W, 0.3), ...spark(2.6, 2.6, 0.9));
  return out;
}

function tempest() {
  const out = [...tile('storm', 'active')];
  // Ice lances and a bolt falling from a freezing sky.
  const lance = (x, y, s) => facet([[x - 0.8 * s, y - 3.4 * s], [x + 0.8 * s, y - 3.4 * s], [x + 0.4 * s, y + 1.2 * s]], [x, y - 3.4 * s], [x + 0.4 * s, y + 1.2 * s], '#c8f4ff', { ink: '#0a1a4a', d: 0.4 });
  out.push(...aura(8, 11, 5, '#c8f4ff', 1, 3));
  out.push(...lance(3.4, 12.6, 1), ...lance(12.6, 13.2, 1.05), ...lance(10, 9.6, 0.8), ...lance(5.8, 15, 0.8));
  out.push(...bolt([[8.8, 4.4], [6.6, 8.6], [9.2, 9], [7, 14.6]], 2.6, '#ffe86b', { ink: '#2a2a10' }));
  out.push(...puffs([[3, 3.6, 2.4], [6.6, 2.6, 2.8], [10.4, 2.8, 2.6], [13.4, 3.8, 1.9], [8.4, 4.6, 2]], '#b8d8ff', { shadow: false, light: '#f0f8ff', dark: '#7f9ad8', ink: '#0a1a4a' }));
  out.push(...snowflake(13.4, 8.4, 1.1, W, 0.35), ...snowflake(2.4, 8.6, 0.9, W, 0.3));
  return out;
}

// ---------- Fire / poison archmage ----------

function infernomastery() {
  const emblem = (x, y) => [S(flamePts(x, y + 2.1, 2.8, 4.6, 0.3), '#9be86b'), S(flamePts(x + 0.1, y + 1.9, 1.6, 2.8, 0.2), '#f4ffd0')];
  return [...tile('fire', 'passive'), ...aura(9.4, 6.6, 6, '#fff0c0', 1.1), ...staffHead('#ff6a3a', emblem, { wood: '#9b4fe0', metal: '#ffc23a' }), ...spark(13.8, 13.4, 1.2, '#fff36b'), ...spark(2.6, 3, 1)];
}

function toxicblaze() {
  const cols = ['#5fd84a', '#b4f56b', '#f4ffd0'];
  const out = [...tile('poison', 'active'), ...aura(8, 11, 7, '#e8ffc0', 1.1)];
  out.push(...flame(3.4, 14.6, 3.6, 8.6, cols, { lean: 0.8 }));
  out.push(...flame(12.6, 14.6, 3.6, 9.2, cols, { lean: 0.6 }));
  out.push(...flame(8, 14.8, 5.4, 13, cols, { lean: 1 }));
  // Violet venom licks inside.
  out.push(S(flamePts(8.1, 14.4, 2.4, 5.4, 0.3), '#c88aff'), S(flamePts(8.1, 14.2, 1.2, 2.8, 0.2), '#f4e0ff'));
  for (const [x, y] of [[2.2, 4], [13.8, 3], [5, 2.2]]) out.push(...solid(oval(x, y, 0.8, 0.8, 0, 12), '#c88aff', { shadow: false, d: 0.3, ink: '#3a1a6a' }));
  return out;
}

function salamander() {
  const skin = '#ff8a3c';
  const out = [...tile('fire', 'buff'), ...aura(8, 8, 6.8, '#fff4c0', 1.1)];
  // Flame crest along the back of the head.
  out.push(...flame(4.6, 7.6, 2.8, 6.4, ['#9be86b', '#d8ff9a', '#f4ffe0'], { lean: -1 }), ...flame(7.4, 6.4, 2.8, 6, ['#9be86b', '#d8ff9a', '#f4ffe0'], { lean: -0.6 }));
  // The head and snout.
  const head = [...arcPts(7.4, 9.4, 5, 4, 160, 350, 16), [14.4, 9.6], [14.6, 11], [12.8, 12.6], [7.4, 13.6], [3, 12.6]];
  out.push(...solid(head, skin, { k: 0.9 }));
  out.push(S(clip(head, rect(0, 11.6, 16, 3)), '#ffd27a'));
  out.push(line([[8.4, 11.6], [14.4, 10.8]], 0.4, '#a03a1a'));
  for (const [x, y] of [[5, 9.2], [6.6, 8], [4.4, 11]]) out.push(S(oval(x, y, 0.55, 0.45, 0, 10), '#ffd27a'));
  // A big cute eye.
  out.push(S(oval(9.8, 8.8, 1.4, 1.5, 0, 16), '#2a2035'), S(oval(9.5, 8.3, 0.55, 0.55, 0, 10), W), S(oval(10.3, 9.4, 0.25, 0.25, 0, 8), W));
  out.push(S(oval(12.6, 8.9, 0.3, 0.25, 0, 8), '#8a2a1a'));
  out.push(S(oval(11.6, 11.8, 0.8, 0.45, 0, 10), '#ff8aa0'));
  out.push(...glint(4, 8.8, 0.45));
  // A spat ember.
  out.push(...solid(oval(14.4, 13.8, 0.9, 0.9, 0, 12), '#9be86b', { d: 0.3 }), ...spark(13.4, 2.4, 1.2, '#fff6c0'));
  return out;
}

function meteor() {
  const rock = '#a8705a';
  const out = [...tile('fire', 'active'), ...aura(10.4, 10.4, 5.4, '#fff4c0', 1.2)];
  const trail = (a, b, w, c) => S(tube([a, b], (t) => 0.2 + w * Math.pow(t, 0.7)), c);
  out.push(trail([0.6, 0.6], [9.6, 9.6], 6.4, '#ff6a3a'), trail([1.6, 1.2], [9.6, 9.6], 4.4, '#ffa23c'), trail([3.4, 2.6], [9.8, 9.6], 2.4, '#ffe9a0'));
  // A smaller meteor behind.
  out.push(trail([7.6, 0.4], [12.6, 4.6], 2.2, '#ffa23c'), ...solid(oval(12.8, 4.8, 1.3, 1.3, 0, 14), rock, { d: 0.35 }));
  const head = [[7.2, 9.6], [8.6, 7.2], [11.4, 6.8], [13.6, 8.6], [14, 11.6], [12, 13.8], [9, 13.8], [7.4, 12]];
  out.push(...solid(head, rock, { k: 0.85 }));
  out.push(S(clip(head, oval(9.8, 9.4, 2.8, 2.4)), '#ffb37a'), S(clip(head, oval(9.2, 8.8, 1.4, 1.1)), '#ffe0b0'));
  out.push(S(oval(11.8, 11.4, 0.9, 0.7, 0, 12), sh(rock)), S(oval(12.6, 9.2, 0.6, 0.5, 0, 10), sh(rock)), S(oval(9.6, 12.4, 0.5, 0.4, 0, 10), sh(rock)));
  out.push(...spark(3.4, 12.6, 1.2, '#fff4c0'), ...spark(14, 1.8, 0.9));
  return out;
}

// ---------- Bishop ----------

function seraphmastery() {
  const emblem = (x, y) => [S(starPts(x, y, 2.2, 0.8, 4, -90), W), S(oval(x, y, 0.6, 0.6, 0, 10), '#ffe36b')];
  const wings = [-1, 1].flatMap((s) => solid([[9.4 + s * 2.8, 6.6], [9.4 + s * 5.6, 3], [9.4 + s * 6.4, 5.4], [9.4 + s * 5.8, 8.6], [9.4 + s * 3, 9]].map(([x, y]) => [Math.max(1.4, Math.min(14.8, x)), y]), W, { d: 0.4, ink: '#a0702a', light: W }));
  return [...tile('holy', 'passive'), ...aura(9.4, 6.6, 6.4, '#ffffff', 1.1), ...staffHead('#8fd8ff', emblem, { wood: '#f0e6ff', behind: wings }), ...spark(13.8, 13.4, 1.2), ...spark(2.4, 9.6, 0.9)];
}

function shiningray() {
  const out = [...tile('steel', 'active'), ...aura(8, 8, 7.4, '#fff8d0', 0.75, 5)];
  out.push(...solid(starPts(8, 8, 7.2, 1.6, 4, -90), '#ffd84a', { light: '#fff3a6', ink: '#8a4a10', d: 0.5 }));
  out.push(S(starPts(8, 8, 4.4, 1.2, 4, -45), '#ffe36b'));
  out.push(S(starPts(8, 8, 4.8, 1, 4, -90), W));
  out.push(S(oval(8, 8, 1.6, 1.6, 0, 16), W));
  out.push(...spark(3, 3, 1.1), ...spark(13, 13, 1.1), ...spark(13.2, 3, 0.8), ...spark(2.8, 13, 0.8));
  return out;
}

function sanctuary() {
  const out = [...tile('mint', 'buff')];
  const dome = [...arcPts(8, 12.6, 6.4, 8.4, 180, 360, 24)];
  out.push(...edge(dome, '#a0601a', 0.45), S(dome, '#fff3b0'), S(clip(dome, oval(8, 12.6, 5.2, 7.2)), '#fff8d0'), S(clip(dome, oval(8, 12.6, 3.6, 5.6)), '#ffffff'));
  out.push(S(tube(arcPts(8, 12.6, 5.6, 7.6, 200, 250, 10), (t) => 0.9 * Math.sin(Math.PI * t)), W));
  // A shield sheltered inside.
  const shield = [[5.6, 7.6], [8, 6.8], [10.4, 7.6], [10.2, 10.6], [8, 12.6], [5.8, 10.6]];
  out.push(...solid(shield, '#ffd25a', { d: 0.4 }), S(cut(shield, [8, 0], [8, 16]), '#f0b43a'), S(tube([[8, 7.4], [8, 11.6]], 0.5), W), S(tube([[6.6, 8.8], [9.4, 8.8]], 0.5), W));
  out.push(...solid([[0.8, 12.6], [15.2, 12.6], [15.2, 15.2], [0.8, 15.2]], '#e8c070', { shadow: false, d: 0.4 }));
  out.push(S(rect(0.8, 12.6, 14.4, 0.6), '#fff3c0'));
  const halo = tube([...oval(8, 2.6, 2.8, 0.9, 0, 24), oval(8, 2.6, 2.8, 0.9, 0, 24)[0]], 0.7);
  out.push(...edge(halo, '#a0601a', 0.35), S(halo, '#ffe36b'));
  out.push(...spark(13.6, 3.4, 1), ...spark(2.4, 4.4, 0.9));
  return out;
}

function guardianangel() {
  const skin = '#fff0e6';
  const out = [...tile('sky', 'buff'), ...aura(8, 7.4, 7, '#ffffff', 1.15)];
  for (const s of [1, -1]) {
    const wing = [[8 + s * 1.6, 9], [8 + s * 4.6, 4.6], [8 + s * 6.8, 4.4], [8 + s * 6.8, 7], [8 + s * 7, 9], [8 + s * 5.4, 11.6], [8 + s * 2, 11.6]];
    out.push(...solid(wing, '#ffffff', { light: '#ffffff', ink: '#a0702a' }));
    out.push(line([[8 + s * 5.6, 7.4], [8 + s * 2.6, 9.4]], 0.35, '#e6dcc0'), line([[8 + s * 5.4, 9.8], [8 + s * 2.6, 10.8]], 0.35, '#e6dcc0'));
  }
  // A little robed angel.
  out.push(...solid([[6.4, 9.6], [9.6, 9.6], [11, 14.8], [5, 14.8]], '#f4f0ff', { d: 0.45 }), S([[8, 9.6], [9.6, 9.6], [11, 14.8], [8.6, 14.8]], '#ddd4f4'));
  out.push(...solid(oval(8, 7.4, 2.8, 2.7, 0, 24), skin, { d: 0.45 }));
  out.push(...solid([...arcPts(8, 7.2, 3, 2.9, 180, 360, 14), [10.4, 6.6], [9, 5.6], [7.4, 6.8], [5.6, 6.8]], '#ffd27a', { shadow: false, d: 0.35 }));
  out.push(S(oval(7, 8.2, 0.4, 0.55, 0, 10), '#3a2d4f'), S(oval(9, 8.2, 0.4, 0.55, 0, 10), '#3a2d4f'), S(oval(6.3, 9, 0.5, 0.3, 0, 8), '#ffb0c4'), S(oval(9.7, 9, 0.5, 0.3, 0, 8), '#ffb0c4'));
  const halo = tube([...oval(8, 3.3, 2.6, 0.85, 0, 24), oval(8, 3.3, 2.6, 0.85, 0, 24)[0]], 0.7);
  out.push(...edge(halo, '#a0601a', 0.35), S(halo, '#ffe36b'));
  out.push(...spark(13.8, 13.6, 1), ...spark(2.2, 13.6, 1));
  return out;
}

function judgment() {
  const out = [...tile('shadow', 'active')];
  // Three pillars of light slamming down, each bursting where it lands.
  for (const [x, w] of [[3.4, 2.4], [8, 3.4], [12.6, 2.4]]) {
    const pil = [[x - w * 0.32, 0.9], [x + w * 0.32, 0.9], [x + w / 2, 12.6], [x - w / 2, 12.6]];
    out.push(S(inTile(grow(pil, 1.5, x, 7)), '#fff6c8'), ...edge(inTile(pil), '#c06a1a', 0.35), S(inTile(pil), '#ffe36b'), S(inTile([[x - w * 0.12, 0.9], [x + w * 0.12, 0.9], [x + w * 0.2, 12.6], [x - w * 0.2, 12.6]]), W));
  }
  out.push(...solid([[0.8, 13], [15.2, 13], [15.2, 15.2], [0.8, 15.2]], '#c88a5a', { shadow: false, d: 0.35 }));
  out.push(line([[3.4, 13.2], [2.6, 14.4], [3, 15]], 0.35, '#7a4a2a'), line([[8, 13.2], [9, 14.6]], 0.35, '#7a4a2a'), line([[12.6, 13.2], [11.8, 14.8]], 0.35, '#7a4a2a'));
  for (const [x, r] of [[3.4, 2.2], [8, 3], [12.6, 2.2]]) out.push(S(starPts(x, 12.8, r, r * 0.3, 4, -90), W), S(oval(x, 12.9, r * 0.45, r * 0.3, 0, 12), '#fff3a6'));
  out.push(...spark(5.7, 5, 0.9), ...spark(10.3, 3.6, 0.9));
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
  paladinmastery, aegissmite, hallowedground, divineaegis, grandverdict,
  berserkermastery, ravage, bloodfrenzy, rampage, crimsoneclipse,
  magicbolt, sparkburst, blink, manashield, arcanemind, mend, renew, barrier, revive,
  twinshot, arrowfan, arrowshower, flipshot, huntersfocus, bowmastery, eagleeye, falcondive,
  rangermastery, galevolley, cyclonearrow: cyclone, tailwind, stormvolley,
  snipermastery, marksman, glacierbolt: glacier, steadyaim, heartseeker,
  shadowdash, quickhaste, nimblefeet, twinfang, backstab, daggermastery, moonlitassassin, luckyseven, starfan, gauntletmastery, fullmoonvolley,
  ilmastery, coldbeam, thunderbolt, stormfocus,
  firemastery, fireball, poisonmist, meditate,
  holymastery, bless, heal, holybolt,
  ilarchmastery, chainlightning, icespire, frostsprite, tempest,
  infernomastery, toxicblaze, salamander, meteor,
  seraphmastery, shiningray, sanctuary, guardianangel, judgment,
  gmsmite, gmhaste, gmblessing,
};

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
