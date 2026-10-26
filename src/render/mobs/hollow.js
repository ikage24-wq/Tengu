// Monster art: hollow. Rootwood Hollow's minions, the creatures of a giant tree gone sour: root
// imps, mushroom shamans, bramble bears, spore mites, and the corrupted saplings that feed its
// heart. Bark and fungus in soft browns, lilacs, and mossy greens, with the corruption showing as
// glowing teal eyes and purple veins.

import { E, T, F, C, shade, mix, INK, BLUSH, MOUTH, arc, stroke } from './kit.js';

const TAU = Math.PI * 2;
const TEAL = '#5ff0d6';
const TEAL_HI = '#d9fff8';
const PURP = '#b86cff';
const PURP_HI = '#f1ddff';
const SOCKET = '#2b2040';
const BONE = '#f1e5cc';
const FANG = '#fffaf0';
const GUM = '#4a2440';

// ---------- Helpers ----------

const lineOf = (c) => mix(shade(c, -38), INK, 0.45);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// A polyline as one tapering polygon: width w0 at the start and w1 at the end.
function taper(pts, w0, w1, c) {
  const n = pts.length;
  const d = [0];
  for (let i = 1; i < n; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = d[n - 1] || 1;
  const left = [];
  const right = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / dl;
    const ny = (b[0] - a[0]) / dl;
    const w = (w0 + (w1 - w0) * (d[i] / len)) / 2;
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  return T([...left, ...right.reverse()], c);
}

// Pushes both ends of a polyline out by e.
function ext(pts, e) {
  const n = pts.length;
  const out = pts.map((p) => [...p]);
  const push = (i, j) => {
    const dx = pts[i][0] - pts[j][0];
    const dy = pts[i][1] - pts[j][1];
    const l = Math.hypot(dx, dy) || 1;
    out[i] = [pts[i][0] + (dx / l) * e, pts[i][1] + (dy / l) * e];
  };
  push(0, 1);
  push(n - 1, n - 2);
  return out;
}

// A tapered limb with its own thin line around it, so it reads in front of the body.
const limb = (pts, w0, w1, c, line = lineOf(c)) => [F(taper(ext(pts, 0.45), w0 + 1, w1 + 1, line)), taper(pts, w0, w1, c)];
// An ellipse with its own thin line.
const oval = (x, y, rx, ry, c, line = lineOf(c)) => [F(E(x, y, rx + 0.5, ry + 0.5, line)), E(x, y, rx, ry, c)];
const flatLine = (pts, th, c) => stroke(pts, th, c);

// Glowing eyes. list: [x, y, r]; cx is the middle of the face (brows slant toward it); skin is the
// color around the eyes (the angry brow carves into the eye with it).
function eyes(list, mood, { cx, skin, glow = TEAL, core = TEAL_HI, socket = SOCKET, ink = INK, brow = INK, flare = true, shine = true, style = 'glow', look = 0 } = {}) {
  const out = [];
  for (const [x, y, r] of list) {
    const inw = Math.sign(cx - x) || 1;
    switch (mood) {
      case 'blink':
        out.push(arc(x, y - 0.2 * r, r * 1.05, r * 0.75, 15, 165, 0.55, ink));
        break;
      case 'happy':
        out.push(arc(x, y + 0.7 * r, r * 1.05, r * 1.0, 195, 345, 0.6, ink));
        break;
      case 'hurt':
        out.push(...flatLine([[x - inw * r, y - r], [x + inw * 0.8 * r, y], [x - inw * r, y + r]], 0.6, ink));
        break;
      case 'dead':
        out.push(...flatLine([[x - 0.9 * r, y - 0.9 * r], [x + 0.9 * r, y + 0.9 * r]], 0.55, ink), ...flatLine([[x - 0.9 * r, y + 0.9 * r], [x + 0.9 * r, y - 0.9 * r]], 0.55, ink));
        break;
      default: {
        const a = mood === 'angry';
        if (style !== 'glow') {
          out.push(...styledEye(style, x, y, r, inw, a, { skin, glow, core, socket, brow, look }));
          break;
        }
        if (a && flare) {
          // Flames of glow streaming off the outer corner.
          out.push(F(T([[x - inw * 0.9 * r, y - 0.6 * r], [x - inw * 2.6 * r, y - 1.9 * r], [x - inw * 1.6 * r, y - 0.2 * r], [x - inw * 2.3 * r, y + 0.2 * r], [x - inw * 1.0 * r, y + 0.5 * r]], glow)));
        }
        out.push(F(E(x, y, r * 1.18, r * 1.28, socket)));
        out.push(F(E(x + 0.05 * r, y + 0.05 * r, r * (a ? 1.05 : 0.9), r * (a ? 1.05 : 1.02), glow)));
        out.push(F(E(x + 0.12 * r, y + 0.22 * r, r * 0.46, r * 0.52, core)));
        if (a) {
          out.push(F(E(x + 0.1 * r, y + 0.1 * r, r * 0.2, r * 0.72, socket)));
          // The brow carves the top of the eye into a fierce slant.
          out.push(F(T([[x - inw * 1.7 * r, y - 2.6 * r], [x + inw * 1.7 * r, y - 2.6 * r], [x + inw * 1.7 * r, y - 0.05 * r], [x - inw * 1.7 * r, y - 1.25 * r]], skin)));
          out.push(...flatLine([[x - inw * 1.7 * r, y - 1.45 * r], [x + inw * 1.6 * r, y - 0.2 * r]], 0.75, brow));
        } else if (shine) {
          out.push(F(E(x - 0.35 * r, y - 0.42 * r, r * 0.34, r * 0.34, '#ffffff')));
        }
      }
    }
  }
  return out;
}

// The open eye of each species (blinks, squints, and x's stay shared so moods read the same):
//   seed   beady glowing seeds, pointed top and bottom (root imp)
//   sleepy half-lidded glow under a heavy lid (myconid)
//   bear   small and fierce, sunk under a heavy brow (bramble bear)
//   bug    a glossy dome with a glowing rim and two little side eyes (spore mite)
//   knot   a bark knot-hole with a bead of glowing sap inside (sapling)
// `look` slides the pupil (-1 back .. 1 forward).
function styledEye(style, x, y, r, inw, angry, { skin, glow, core, socket, brow, look }) {
  const out = [];
  const lx = look * r * 0.22;
  // The brow carves the top of the eye into a fierce slant.
  const carve = (lo, hi, th = 0.75) => {
    out.push(F(T([[x - inw * 1.7 * r, y - 2.8 * r], [x + inw * 1.7 * r, y - 2.8 * r], [x + inw * 1.7 * r, y + hi * r], [x - inw * 1.7 * r, y + lo * r]], skin)));
    out.push(...flatLine([[x - inw * 1.7 * r, y + (lo - 0.2) * r], [x + inw * 1.6 * r, y + (hi - 0.15) * r]], th, brow));
  };
  switch (style) {
    case 'seed': {
      const seed = (k, dy = 0) => [[x, y - 1.35 * r * k + dy], [x + 0.8 * r * k, y - 0.25 * r * k + dy], [x + 0.62 * r * k, y + 0.75 * r * k + dy], [x, y + 1.1 * r * k + dy], [x - 0.62 * r * k, y + 0.75 * r * k + dy], [x - 0.8 * r * k, y - 0.25 * r * k + dy]];
      out.push(F(T(seed(1.22), socket)), F(T(seed(angry ? 0.95 : 0.86, 0.05 * r), glow)));
      out.push(F(E(x + lx, y + 0.18 * r, r * 0.3, r * (angry ? 0.62 : 0.36), angry ? socket : core)));
      if (angry) carve(-1.2, -0.1);
      else out.push(F(E(x - 0.3 * r + lx * 0.5, y - 0.55 * r, r * 0.22, r * 0.26, '#ffffff')));
      break;
    }
    case 'sleepy': {
      out.push(F(E(x, y, r * 1.18, r * 1.2, socket)), F(E(x + lx * 0.4, y + 0.12 * r, r * 0.95, r * 0.98, glow)), F(E(x + lx, y + 0.35 * r, r * 0.45, r * 0.45, core)));
      if (angry) {
        out.push(F(E(x + lx, y + 0.3 * r, r * 0.2, r * 0.55, socket)));
        carve(-0.9, 0.15, 0.85);
      } else {
        // A drowsy lid down to the middle of the eye, lashed with a soft line.
        out.push(F(T([[x - 1.5 * r, y - 1.8 * r], [x + 1.5 * r, y - 1.8 * r], [x + 1.4 * r, y - 0.1 * r], [x, y + 0.08 * r], [x - 1.4 * r, y - 0.1 * r]], skin)));
        out.push(...flatLine([[x - 1.3 * r, y - 0.05 * r], [x, y + 0.12 * r], [x + 1.3 * r, y - 0.05 * r]], 0.6, brow));
        out.push(F(E(x - 0.45 * r, y + 0.4 * r, r * 0.2, r * 0.18, '#ffffff')));
      }
      break;
    }
    case 'bear': {
      out.push(F(E(x, y, r * 0.95, r * 0.9, socket)), F(E(x + lx, y + 0.1 * r, r * 0.66, r * 0.66, glow)), F(E(x + lx + 0.08 * r, y + 0.12 * r, r * 0.34, r * (angry ? 0.5 : 0.36), angry ? '#fff3b0' : socket)));
      out.push(F(E(x - 0.3 * r + lx, y - 0.22 * r, r * 0.2, r * 0.2, '#ffffff')));
      // The heavy brow always overhangs; anger drives it down hard toward the snout.
      if (angry) carve(-0.8, 0.1, 0.95);
      else carve(-0.45, -0.25, 0.8);
      break;
    }
    case 'bug': {
      for (const [dx, dy, k] of [[-0.95, -0.95, 0.36], [-1.25, 0.15, 0.3]]) {
        const sx = x + dx * r * (inw < 0 ? -1 : 1);
        out.push(F(E(sx, y + dy * r, r * k + 0.25, r * k + 0.25, socket)), F(E(sx, y + dy * r, r * k, r * k, angry ? glow : '#5a3f78')), F(E(sx - r * k * 0.3, y + dy * r - r * k * 0.3, r * k * 0.4, r * k * 0.4, '#ffffff')));
      }
      out.push(F(E(x, y, r * 1.12, r * 1.15, socket)), F(E(x, y, r * 0.98, r * 1.0, angry ? glow : '#4b3366')));
      out.push(F(E(x + 0.1 * r, y + 0.45 * r, r * 0.72, r * 0.42, angry ? core : mix(glow, '#4b3366', 0.35))));
      if (angry) {
        out.push(F(E(x + lx, y + 0.1 * r, r * 0.22, r * 0.62, socket)));
        carve(-1.15, -0.2);
      } else {
        out.push(F(E(x - 0.32 * r, y - 0.38 * r, r * 0.34, r * 0.3, '#ffffff')), F(E(x + 0.4 * r, y + 0.25 * r, r * 0.13, r * 0.13, '#ffffff')));
      }
      break;
    }
    case 'knot': {
      out.push(F(E(x, y, r * 1.35, r * 1.2, shade(skin, -26))), F(E(x + 0.1 * r, y + 0.1 * r, r * 1.0, r * 0.88, socket)));
      out.push(F(E(x + lx, y + 0.2 * r, r * (angry ? 0.68 : 0.52), r * (angry ? 0.68 : 0.56), glow)), F(E(x + lx - 0.12 * r, y + 0.08 * r, r * 0.24, r * 0.24, core)));
      // A drip of sap running from the hole's lower lip.
      out.push(F(E(x + 0.45 * r, y + 1.05 * r, r * 0.16, r * 0.3, glow)));
      if (angry) carve(-1.1, -0.15);
      break;
    }
  }
  return out;
}

// Drifting spore motes: a glowing dot with a bright center.
const mote = (x, y, r, c = TEAL) => [F(E(x, y, r, r, c)), F(E(x - r * 0.25, y - r * 0.25, r * 0.45, r * 0.45, '#ffffff'))];

// ---------- Motion ----------

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (k) => k * k * (3 - 2 * k);
// Picks the attack frame's value from a list (or the fallback outside an attack).
const key = (att, list, other) => (att >= 0 ? list[Math.min(att, list.length - 1)] : other);

// Bends a finished drawing like a body over planted feet: a point takes the motion more the higher
// it sits (fully at `top` and above), turning by `a` about (cx, top) and shifting by (dx, dy); then
// the whole figure squashes by (sx, sy) about (cx, floor), so the feet never leave the ground.
function bend(shapes, { cx, top, floor, a = 0, dx = 0, dy = 0, sx = 1, sy = 1 }) {
  if (!a && !dx && !dy && sx === 1 && sy === 1) return shapes;
  const map = (x, y) => {
    const k = smooth(clamp((floor - y) / (floor - top), 0, 1));
    const aa = a * k;
    const c = Math.cos(aa);
    const s = Math.sin(aa);
    const ox = x - cx;
    const oy = y - top;
    let nx = cx + ox * c - oy * s + dx * k;
    let ny = top + ox * s + oy * c + dy * k;
    nx = cx + (nx - cx) * sx;
    ny = floor - (floor - ny) * sy;
    return [nx, ny];
  };
  return shapes.map((sh) => {
    if (sh.t === 'p') return { ...sh, x: 0, y: 0, pts: sh.pts.map(([x, y]) => map(x + sh.x, y + sh.y)) };
    const [x, y] = map(sh.x, sh.y);
    if (sh.t === 'e') return { ...sh, x, y, rx: sh.rx * sx, ry: sh.ry * sy };
    return { ...sh, x, y };
  });
}

// A slash streak: a crescent along an arc (degrees) that swells in the middle, glow under a bright core.
function swoosh(cx, cy, r, a0, a1, th, glow = TEAL, core = '#ffffff') {
  const band = (w, rr, c) => {
    const outer = [];
    const inner = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
      const k = Math.sin(t * Math.PI) ** 0.8 * (0.35 + 0.65 * t);
      outer.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      inner.push([cx + Math.cos(a) * (rr - w * k), cy + Math.sin(a) * (rr - w * k)]);
    }
    return F(T([...outer, ...inner.reverse()], c));
  };
  return [band(th + 1, r + 0.5, glow), band(th * 0.55, r, core)];
}

// A little four-point impact star.
function star(x, y, r, c = '#ffffff') {
  const q = r * 0.3;
  return F(T([[x, y - r], [x + q, y - q], [x + r, y], [x + q, y + q], [x, y + r], [x - q, y + q], [x - r, y], [x - q, y - q]], c));
}

// ---------- Root Imp (rootling) ----------
// A little horned demon of twisted roots: a knotty face with glowing eyes, a root beard, claw
// hands of thorn, a spade-leaf tail, and corruption glowing through the cracks in its chest.

function rootImp(pose, f, mood) {
  const walk = pose === 'walk';
  const att = pose === 'attack' ? f : -1;
  // A quick, low scurry; the idle looks about and flicks its ears.
  const p = walk ? (f / 8) * TAU : 0;
  const it = walk || att >= 0 ? 0 : (f / 6) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const bark = '#a97c5e';
  const barkD = '#83604a';
  const head = '#bb8f6c';
  const horn = '#7a5a48';
  const lineD = '#5e4232';
  const bob = walk ? -1.2 * Math.cos(p) ** 2 + 0.6 : Math.sin(it) * 0.35;
  const breathe = walk ? 0 : (1 + Math.sin(it)) * 0.3;
  const by = bob + (dead ? 1.4 : 0) + key(att, [0.9, 0, 0.3, 0], 0);
  const hx = (hurt ? -1.4 : 0) + (walk ? 0 : Math.sin(it) * 0.5);
  const hy = (dead ? 1.8 : hurt ? -0.5 : 0) + (walk ? Math.sin(p * 2 - 0.9) * 0.4 : Math.sin(it - 0.5) * 0.25) + key(att, [-0.6, 0.7, 0.9, 0.2], 0);
  const look = walk || att >= 0 ? 0.6 : Math.cos(it) * 1.1;
  // Ears and beard trail the head; one ear flicks now and then.
  const earW = walk ? Math.sin(p * 2 - 1.8) * 0.9 : (f === 3 ? -1.4 : f === 4 ? 0.6 : 0) + key(att, [-1, 1.2, 0.6, 0], 0);
  const glow = dead ? '#9a93a6' : TEAL;
  const pglow = dead ? '#a59ab3' : PURP;
  const out = [];

  // Tail: a root curling up behind, tipped with a corrupted spade leaf.
  // It streams out low behind the scurry and whips through the swipe.
  const tw = walk ? Math.sin(p * 2 - 1.4) * 1.3 : key(att, [0.9, 1.8, 0.9, -0.5], Math.sin(it - 0.8) * 0.9);
  const tlow = walk ? 3 : 0;
  const tip = dead ? [2.6, 31] : [2.6 + tw * 0.4 - tlow * 0.3, 20.5 + tw + tlow];
  out.push(...limb([[10.5, 29 + by], [6, 29 + by], [3.4, 26 + by * 0.5 + tw * 0.3 + tlow * 0.4], tip], 2.2, 0.8, barkD));
  out.push(F(T([[tip[0], tip[1] + 0.6], [tip[0] - 2.4, tip[1] - 1.2], [tip[0] - 0.2, tip[1] - 3.8], [tip[0] + 2, tip[1] - 1.2]], lineOf(pglow))));
  out.push(F(T([[tip[0], tip[1]], [tip[0] - 1.7, tip[1] - 1.3], [tip[0] - 0.1, tip[1] - 3.1], [tip[0] + 1.4, tip[1] - 1.3]], pglow)));
  out.push(F(E(tip[0] - 0.1, tip[1] - 1.5, 0.45, 0.6, PURP_HI)));

  // Legs: root legs with splayed root toes.
  const leg = (hipX, q, c) => {
    const sw = walk ? Math.sin(q) : 0;
    const lift = walk ? Math.max(0, Math.cos(q)) ** 1.5 * 2.6 : 0;
    const st = key(att, [-0.6, 1.8, 2.2, 1], angry ? 0.8 : 0) * (hipX < 16 ? -0.5 : 1);
    const fx = hipX + sw * 3.5 + st + (dead ? (hipX < 16 ? -1.5 : 1.5) : 0);
    const fy = 36.3 - lift;
    const hip = [hipX, 30.4 + by];
    const knee = [(hip[0] + fx) / 2 + 1.4, (hip[1] + fy) / 2];
    return [
      ...limb([[fx, fy], [fx - 1.6, fy + 1.1], [fx - 2.8, fy + 1.3]], 1.6, 0.4, c),
      ...limb([hip, knee, [fx, fy]], 3.8, 2.8, c),
      ...limb([[fx - 0.3, fy], [fx + 1.7, fy + 0.9], [fx + 3.7, fy + 1.3]], 2.3, 0.5, c),
      ...limb([[fx + 0.4, fy + 0.2], [fx + 1.4, fy + 1.1], [fx + 2.2, fy + 1.4]], 1.4, 0.4, c),
    ];
  };
  // Arms: a twisted root arm ending in three thorn claws.
  const arm = (sx, sy, q, c, front) => {
    let hand;
    if (dead) hand = [sx + 0.8, sy + 6];
    else if (att >= 0) hand = front ? [sx + [-5.6, 7.6, 6, 5][att], sy + [-2.6, -3.6, -7, -1.5][att]] : [sx + [3.6, -4.6, -4, 3][att], sy + [-2.6, 0.5, -1.5, -3][att]];
    else if (hurt) hand = front ? [sx + 3.6, sy - 0.6] : [sx - 3.4, sy - 2.6];
    else if (angry) hand = front ? [sx + 5.6, sy - 2.4 + Math.sin(p) * 0.6] : [sx + 4, sy - 3.6];
    else {
      // Scurrying, the claws pump in quick tucked arcs.
      const a = (front ? 0.95 : 0.2) + (walk ? Math.sin(q) * 0.75 + 0.35 : Math.sin(it) * 0.1);
      hand = [sx + Math.sin(a) * 5.4, sy + Math.cos(a) * 5.4];
    }
    const elbow = [lerp([sx, sy], hand, 0.5)[0] - 0.8, lerp([sx, sy], hand, 0.5)[1] + 0.4];
    const dx = hand[0] - elbow[0];
    const dy = hand[1] - elbow[1];
    // Front claws point forward, ready to swipe; the back ones follow the arm.
    const base = front && !dead ? (att >= 0 ? [-2.7, -0.55, -1.15, -0.2][att] : -0.25 + (hurt ? -0.9 : 0)) : Math.atan2(dy, dx);
    const res = [...limb([[sx, sy], elbow, hand], 2.8, 2.1, c)];
    const spread = front && att === 0 ? 0.75 : 0.55;
    for (const k of [-1, 0, 1]) {
      const a = base + k * spread - (angry && !dead && !front ? 0.5 : 0);
      const l = (k === 0 ? 3.8 : 3.1) * (front ? 1 : 0.85);
      const m = [hand[0] + Math.cos(a) * l * 0.55, hand[1] + Math.sin(a) * l * 0.55];
      const t2 = [hand[0] + Math.cos(a + 0.45) * l, hand[1] + Math.sin(a + 0.45) * l];
      res.push(...limb([hand, m, t2], 1.5, 0.1, front ? BONE : shade(BONE, -12)));
    }
    res.push(...oval(hand[0], hand[1], 1.5, 1.4, c));
    return res;
  };

  out.push(...leg(14.6, p + Math.PI, barkD));
  out.push(...arm(13.4, 23.6 + by, p, barkD, false));

  // Back ear and back horn sit behind the head.
  const hcx = 17.6 + hx;
  const hcy = 14.2 + by + hy;
  out.push(...limb([[hcx - 7.4, hcy - 1], [hcx - 11.2, hcy - 3], [hcx - 13.4, hcy - 5.4 + earW]], 3.8, 0.3, barkD));
  out.push(...limb([[hcx - 3.2, hcy - 6.4], [hcx - 5.4, hcy - 10], [hcx - 8.8, hcy - 12.6], [hcx - 12, hcy - 12.2]], 3.4, 0.4, shade(horn, -8)));
  out.push(...flatLine([[hcx - 5.8, hcy - 9.2], [hcx - 4.2, hcy - 10.4]], 0.45, lineD), ...flatLine([[hcx - 8.6, hcy - 11.6], [hcx - 8, hcy - 13.2]], 0.45, lineD));
  out.push(F(E(hcx - 11.8, hcy - 12.2, 0.75, 0.7, pglow)));

  // Body: a knot of roots with corruption glowing through.
  out.push(E(16.6, 27 + by, 6.6, 6.2 + breathe * 0.5, bark), E(16.4, 30.4 + by, 5.4, 3.2, bark));
  out.push(...flatLine([[11, 24.4 + by], [13.6, 26.6 + by], [12.4, 30.6 + by]], 0.55, barkD), ...flatLine([[21.4, 25 + by], [19.6, 28.6 + by], [21, 31.4 + by]], 0.55, barkD));
  out.push(...flatLine([[14.8, 31.6 + by], [16.2, 29.6 + by], [18.4, 31.8 + by]], 0.5, barkD));
  out.push(...flatLine([[16.6, 23.6 + by], [17.6, 25.2 + by], [16.8, 27.4 + by], [18, 29.2 + by]], 0.6, pglow));
  out.push(F(E(17.6, 26.4 + by, 1.5, 1.7, pglow)), F(E(17.5, 26.2 + by, 0.7, 0.8, PURP_HI)));

  out.push(...leg(18.8, p, barkD));
  // A leaf loincloth on a vine belt.
  for (let i = 0; i < 6; i++) {
    const x = 11.4 + i * 2.1;
    const s = walk ? Math.sin(p + i * 0.8) * 0.5 : Math.sin(it + i) * 0.2;
    const c = i === 2 ? '#9a6fd0' : i % 2 ? '#5f8c62' : '#77a774';
    const l = 3 + (i % 2) * 0.8;
    out.push(F(T([[x - 1.4, 28.8 + by], [x + 1.4, 28.8 + by], [x + 0.4 + s, 29.4 + l + by], [x - 0.2 + s, 29.6 + l + by]], lineOf(c))));
    out.push(F(T([[x - 1, 29 + by], [x + 1, 29 + by], [x + 0.3 + s, 28.9 + l + by], [x - 0.1 + s, 29.1 + l + by]], c)));
  }
  out.push(...flatLine([[10.2, 28.8 + by], [16.6, 29.6 + by], [23, 28.6 + by]], 0.9, '#4f7a4c'));

  // Head: big and knotty, with a root beard.
  for (const [x, l] of [[-1.6, 3.6], [0.6, 4.6], [2.6, 3.4]]) {
    const s = walk ? Math.sin(p * 2 - 1.2 + x) * 0.7 - 0.5 : key(att, [0.8, -1, -0.4, 0.2], Math.sin(it + x) * 0.3);
    out.push(...limb([[hcx + 3.4 + x, hcy + 5.4], [hcx + 3 + x + s, hcy + 5.4 + l * 0.6], [hcx + 3.6 + x + s * 1.6, hcy + 5.4 + l]], 1.5, 0.3, barkD));
  }
  out.push(C(E(hcx, hcy, 9.8, 8.4, head)), C(E(hcx + 3.6, hcy + 3.6, 6.4, 4.4, head)), E(hcx - 6.4, hcy - 4.2, 2.8, 2.6, head));
  // Bark texture: forehead grain and a knot on the cheek.
  out.push(...flatLine([[hcx - 7.6, hcy - 2.6], [hcx - 5.6, hcy - 4.8], [hcx - 3.2, hcy - 5.6]], 0.45, barkD));
  out.push(...flatLine([[hcx - 8.6, hcy + 1.6], [hcx - 6.8, hcy - 0.2], [hcx - 6.8, hcy - 2]], 0.45, barkD));
  out.push(...flatLine([[hcx - 1, hcy - 7.2], [hcx + 1.2, hcy - 6.2], [hcx + 3.8, hcy - 6.8]], 0.45, barkD));
  out.push(F(E(hcx - 4.4, hcy + 3.4, 1.4, 1.2, barkD)), F(E(hcx - 4.3, hcy + 3.5, 0.7, 0.6, lineD)));
  out.push(F(E(hcx - 3.4, hcy - 4.6, 2.2, 1.0, mix(head, '#ffffff', 0.28))));

  // Face.
  const ex1 = hcx + 1.2;
  const ex2 = hcx + 6.6;
  const ey = hcy + 0.8;
  if (!angry && !dead) {
    out.push(...flatLine([[ex1 - 1.8, ey - 2.6], [ex1, ey - 3.1], [ex1 + 1.6, ey - 2.5]], 0.5, lineD), ...flatLine([[ex2 - 1.4, ey - 2.5], [ex2 + 0.2, ey - 3.1], [ex2 + 1.6, ey - 2.4]], 0.5, lineD));
  }
  out.push(...eyes([[ex1, ey, 1.6], [ex2, ey, 1.5]], mood, { cx: (ex1 + ex2) / 2, skin: head, glow, brow: lineD, style: 'seed', look }));
  if (mood === 'idle' || mood === 'blink' || mood === 'happy') out.push(F(E(ex1 - 0.8, ey + 2.6, 1.1, 0.5, BLUSH)), F(E(ex2 + 0.9, ey + 2.6, 0.9, 0.45, BLUSH)));
  const mx = hcx + 4.2;
  const my = hcy + 5;
  switch (mood) {
    case 'angry':
      out.push(F(E(mx, my, 2.9, 1.8, GUM)), F(E(mx, my + 0.9, 1.6, 0.7, MOUTH)));
      for (const k of [-2, -0.7, 0.7, 2]) out.push(F(T([[mx + k - 0.55, my - 1.4], [mx + k + 0.55, my - 1.4], [mx + k, my - 0.1]], FANG)));
      for (const k of [-1.3, 1.3]) out.push(F(T([[mx + k - 0.5, my + 1.5], [mx + k + 0.5, my + 1.5], [mx + k, my + 0.4]], FANG)));
      break;
    case 'happy':
      out.push(F(T([[mx - 2.2, my - 0.6], [mx + 2.2, my - 0.6], [mx + 1.2, my + 1.2], [mx - 1.2, my + 1.2]], GUM)), F(E(mx, my + 0.8, 1.2, 0.5, MOUTH)));
      out.push(F(T([[mx - 1.6, my - 0.6], [mx - 0.6, my - 0.6], [mx - 1.1, my + 0.5]], FANG)), F(T([[mx + 0.6, my - 0.6], [mx + 1.6, my - 0.6], [mx + 1.1, my + 0.5]], FANG)));
      break;
    case 'hurt':
      out.push(F(E(mx, my + 0.2, 1.1, 1.3, GUM)), F(E(mx, my + 0.7, 0.6, 0.5, MOUTH)));
      break;
    case 'dead':
      out.push(...flatLine([[mx - 1.8, my], [mx - 0.6, my - 0.6], [mx + 0.6, my], [mx + 1.8, my - 0.6]], 0.45, INK), F(E(mx + 0.8, my + 0.7, 0.7, 0.9, '#ff8fa8')));
      break;
    default:
      out.push(arc(mx, my - 1.1, 1.8, 1.4, 25, 155, 0.5, INK), F(T([[mx + 0.3, my + 0.1], [mx + 1.2, my - 0.1], [mx + 0.8, my + 1.1]], FANG)));
  }

  // Front horn: a twisted root curling back, its tip glowing.
  out.push(...limb([[hcx + 2.4, hcy - 6.8], [hcx + 2.8, hcy - 10.4], [hcx + 1, hcy - 13], [hcx - 2, hcy - 13.6]], 3.6, 0.5, horn));
  out.push(...flatLine([[hcx + 1.2, hcy - 8.4], [hcx + 3.4, hcy - 8.8]], 0.45, lineD), ...flatLine([[hcx + 1, hcy - 11], [hcx + 2.6, hcy - 11.8]], 0.45, lineD));
  out.push(F(E(hcx - 1.7, hcy - 13.6, 0.8, 0.75, pglow)), F(E(hcx - 1.8, hcy - 13.7, 0.35, 0.35, PURP_HI)));
  // Front ear tucked by the horn.
  out.push(...limb([[hcx + 7.6, hcy - 3.2], [hcx + 10, hcy - 5.6], [hcx + 11.4, hcy - 7.4 + earW * 0.8 + (f === 3 && !walk && att < 0 ? -1.2 : 0)]], 2.8, 0.3, head));

  out.push(...arm(20.6, 23.8 + by, p + Math.PI, head, true));
  // The swipe: a glowing claw streak, then sparks where it lands.
  if (att === 1) out.push(...swoosh(20.4, 22 + by, 9.6, 150, -35, 3.4));
  if (att === 2) out.push(...swoosh(20.4, 22 + by, 9.6, 50, -75, 2), star(29.6, 15.6 + by, 2.2), star(31, 21 + by, 1.3, TEAL_HI));
  // Weight: it crouches back to wind up, lunges into the swipe, and settles; it leans into a scurry.
  const lean = walk ? 0.07 + Math.sin(p * 2 - 0.5) * 0.025 : key(att, [-0.09, 0.1, 0.12, 0.03], 0);
  const sq = walk ? Math.cos(p * 2) * 0.025 : key(att, [-0.07, 0.02, -0.03, 0], Math.sin(it) * 0.015);
  const shapes = bend(out, { cx: 17, top: 29, floor: 37.5, a: lean, dx: key(att, [-0.5, 1.2, 1.4, 0.4], walk ? 0.4 : 0), sx: 1 - sq * 0.8, sy: 1 + sq });
  return { w: 34, h: 38, res: 3, shapes };
}

// ---------- Myconid Shaman (sporecap) ----------
// A mushroom-folk caster: a floppy-tipped frilled cap with glowing spots, a leaf mantle and a
// beaded necklace, war paint under its eyes, and a gnarled staff topped with a glowing spore pod in
// a cage of roots. Its walk is a ritual march: the staff rises overhead and swings forward, so the
// same frames read as the cast when it lobs spores.

function myconid(pose, f, mood) {
  const walk = pose === 'walk';
  const att = pose === 'attack' ? f : -1;
  // A shuffling hobble: the staff plants, the body limps past it, and it swings ahead again.
  const p = walk ? (f / 8) * TAU : 0;
  const it = walk || att >= 0 ? 0 : (f / 6) * TAU;
  const u = f / 8;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const stem = '#f4e6d0';
  const stemD = '#e2cdb0';
  const cap = '#8b6dd0';
  const capHi = '#a88ee2';
  const frill = '#f5c6dc';
  const gill = '#c99bc8';
  const wood = '#8a6a52';
  const raise = dead ? 0 : att >= 0 ? [1, 0.5, 0.3, 0.2][att] : walk ? 0 : angry ? 0.6 : 0.08 + 0.06 * Math.sin(it);
  // The limp: a deep dip onto the bad leg, a quick hitch up off the good one.
  const bob = walk ? 0.9 * Math.max(0, Math.sin(p)) ** 1.5 - 0.35 * Math.max(0, -Math.sin(p)) : key(att, [0.8, 0.2, 0.6, 0.1], Math.sin(it) * 0.4);
  const by = bob + (dead ? 1.6 : 0);
  const breathe = walk ? 0 : (1 + Math.sin(it)) * 0.25;
  const hx = hurt ? -1.4 : 0;
  const glow = dead ? '#a49cb0' : TEAL;
  const out = [];

  // Staff (behind the body until the hand grips it): gnarled wood with a caged spore pod.
  const lean = hurt ? -2.4 : dead ? 4 : 0;
  let bot = [29.6 + raise * 1.6 + lean * 0.3, 43.6 - raise * 5.2];
  let top = [28.8 + raise * 3.4 + lean, 14 - raise * 5.6 + (dead ? 4 : 0)];
  if (walk) {
    // Planted for the first half (sliding back as it walks past), then lifted and swung ahead.
    const planted = u < 0.5;
    const k = planted ? u / 0.5 : (u - 0.5) / 0.5;
    const bx = planted ? 33 - k * 8 : 25 + smooth(k) * 8;
    const lift = planted ? 0 : Math.sin(k * Math.PI) * 2.6;
    bot = [bx, 43.6 - lift];
    top = [28.6 - (bx - 29) * 0.35, 14 - lift * 0.8 + by * 0.6];
  } else if (att >= 0) {
    bot = [[28, 40], [24, 38.5], [24.5, 40], [28.6, 43]][att];
    top = [[25, 8.6], [28.6, 12.6], [28.8, 14.6], [28.6, 13.6]][att];
  }
  const staffPts = [];
  for (let i = 0; i <= 6; i++) {
    const q = lerp(bot, top, i / 6);
    staffPts.push([q[0] + Math.sin(i * 1.9) * 0.45, q[1]]);
  }

  // Back foot, back arm.
  const foot = (x, q, c) => {
    // The near foot lifts high; the far one drags a little scuff.
    const lift = walk ? Math.max(0, Math.cos(q)) * (x > 17 ? 2.4 : 1) : 0;
    const fx = x + (walk ? Math.sin(q) * 4 : 0) + key(att, [-1, 1.5, 1.5, 0.5], 0) * (x > 17 ? 1 : -0.4);
    const fy = 42.4 - lift;
    return [...limb([[x, 38 + by], [fx, fy - 0.6]], 2.8, 2.6, c), ...oval(fx + 0.6, fy, 2.7, 1.5, c)];
  };
  out.push(...foot(14, p + Math.PI, stemD));
  const bsx = 11.6;
  const bsy = 31.4 + by;
  const bh = dead ? [bsx - 0.6, bsy + 5.6] : hurt ? [bsx - 4, bsy - 2] : att >= 1 ? [bsx - 4.4, bsy - 1.5 + att] : walk ? [bsx - 2.4 - Math.sin(p) * 1.4, bsy + 4 - Math.cos(p) * 0.6] : [bsx - 2.2 - raise * 1.2, bsy + 4.4 - raise * 9];
  out.push(...limb([[bsx, bsy], lerp([bsx, bsy], bh, 0.5).map((v, i) => v - (i ? 0 : 0.8)), bh], 2.6, 2, stemD), ...oval(bh[0], bh[1], 1.4, 1.4, stemD));
  if (raise > 0.5) {
    // The free hand flares open as the staff goes up, sparking.
    out.push(...mote(bh[0] - 1.6, bh[1] - 2, 0.7, glow), ...mote(bh[0] + 0.6, bh[1] - 3, 0.5, PURP));
  }
  out.push(...foot(20, p, stemD));

  // Body: a stout stem with a leaf mantle and beads.
  out.push(E(17, 32.8 + by, 7.4, 9.8 + breathe, stem), E(17, 38.6 + by, 7.2, 3.6, stem));
  out.push(F(E(19.4, 37 + by, 3, 2.6, mix(stem, '#ffffff', 0.35))));
  out.push(...flatLine([[11.6, 37 + by], [12.6, 39.8 + by]], 0.45, stemD), ...flatLine([[22.6, 37.4 + by], [21.8, 40 + by]], 0.45, stemD));
  // Leaf mantle.
  for (let i = 0; i < 7; i++) {
    const x = 10.4 + i * 2.2;
    const s = walk ? Math.sin(p - 1 + i * 0.6) * 0.6 : key(att, [-0.6, 0.8, 0.4, 0], Math.sin(it + i) * 0.15);
    const c = i % 2 ? '#5f8c6e' : '#74a47e';
    const y0 = 30.2 + by + Math.abs(i - 3) * 0.25;
    out.push(F(T([[x - 1.6, y0], [x + 1.6, y0], [x + 0.3 + s, y0 + 3.8 + (i % 2) * 0.6], [x - 0.5 + s, y0 + 3.6]], lineOf(c))));
    out.push(F(T([[x - 1.2, y0], [x + 1.2, y0], [x + 0.3 + s, y0 + 3.2 + (i % 2) * 0.6], [x - 0.4 + s, y0 + 3]], c)));
    out.push(...flatLine([[x, y0 + 0.4], [x + s * 0.5, y0 + 2.6]], 0.3, shade(c, -12)));
  }
  // Beaded necklace with a fang pendant.
  const beads = [TEAL, BONE, PURP, BONE, TEAL, BONE, PURP];
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.15 + (i / 6) * 0.7);
    const x = 17.6 + Math.cos(a) * 6;
    const y = 32.2 + by + Math.sin(a) * 3.4;
    out.push(F(E(x, y, 0.95, 0.95, lineOf(beads[i]))), F(E(x, y, 0.7, 0.7, beads[i])), F(E(x - 0.2, y - 0.25, 0.25, 0.25, '#ffffff')));
  }
  out.push(F(T([[16.4, 35.4 + by], [18.8, 35.4 + by], [17.8, 38.4 + by]], lineOf(BONE))), F(T([[16.8, 35.5 + by], [18.4, 35.5 + by], [17.7, 37.8 + by]], BONE)));

  // Face on the stem, in the cap's shade.
  const fx = 19.2 + hx;
  const fy = 26 + by;
  const look = walk || att >= 0 ? 0.5 : Math.sin(it + 1) * 1.2;
  out.push(...eyes([[fx - 2.7, fy, 1.75], [fx + 2.5, fy, 1.6]], mood, { cx: fx, skin: stem, glow, brow: '#6a4a5a', flare: false, style: 'sleepy', look }));
  if (!dead && mood !== 'hurt') {
    // War paint: two violet stripes under each eye.
    for (const x of [fx - 4.6, fx + 4.2]) out.push(...flatLine([[x - 0.7, fy + 2.1], [x, fy + 2.8], [x + 0.7, fy + 2.1]], 0.5, '#9b6fd6'));
  }
  const my = fy + 3.2;
  switch (mood) {
    case 'angry':
      out.push(F(E(fx, my, 1.6, 1.1, GUM)), F(T([[fx - 1.1, my - 0.8], [fx - 0.3, my - 0.8], [fx - 0.7, my + 0.1]], FANG)), F(T([[fx + 0.3, my - 0.8], [fx + 1.1, my - 0.8], [fx + 0.7, my + 0.1]], FANG)));
      break;
    case 'happy':
      out.push(F(T([[fx - 1.4, my - 0.5], [fx + 1.4, my - 0.5], [fx, my + 1.1]], MOUTH)));
      break;
    case 'hurt':
      out.push(F(E(fx, my, 0.7, 0.9, MOUTH)));
      break;
    case 'dead':
      out.push(...flatLine([[fx - 1.2, my], [fx - 0.4, my - 0.5], [fx + 0.4, my], [fx + 1.2, my - 0.5]], 0.45, INK));
      break;
    default:
      out.push(arc(fx, my - 0.7, 1, 0.8, 25, 155, 0.45, INK));
  }

  // Cap: a frilled dome with a floppy tip, spotted with glow. It casts its shade over the face.
  // The floppy tip trails the hobble and flicks through the cast.
  const ct = (walk ? -Math.sin(p - 1.2) * 1.4 : key(att, [-1.8, 2, 1, -0.4], Math.sin(it - 0.8) * 0.6)) + (hurt ? -1.2 : 0) + (dead ? 1.4 : 0);
  const cy = 17.6 + by + (dead ? 1.4 : 0);
  const ccx = 16 + hx * 0.6;
  const dome = [];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI * (1 + i / 14);
    dome.push([ccx + Math.cos(a) * 14.8, cy + Math.sin(a) * 10.4]);
  }
  const tipPts = [[ccx - 2, cy - 9.6], [ccx - 4, cy - 14.2], [ccx - 7.4 + ct * 0.5, cy - 16.4 + Math.abs(ct) * 0.2], [ccx - 10.6 + ct, cy - 15 + (dead ? 3 : 0)]];
  out.push(F(taper(ext(tipPts, 0.4), 7.6, 1.6, lineOf(cap))), C(taper(tipPts, 6.6, 0.8, cap)));
  out.push(C(T([...dome, [ccx + 14.6, cy + 1.4], [ccx, cy + 2.6], [ccx - 14.6, cy + 1.4]], cap)));
  out.push(F(E(ccx - 3, cy - 7.6, 5.4, 2, capHi)), F(E(ccx - 5.4, cy - 7.2, 1.6, 0.8, '#d2c2f2')));
  // Gills and the ruffled frill along the brim.
  out.push(F(E(ccx, cy + 2.2, 14, 1.6, gill)));
  for (let i = 0; i < 11; i++) {
    const x = ccx - 13.6 + i * 2.72;
    const wob = Math.sin(i * 2.2 + (walk ? p - 1 : it)) * (walk ? 0.5 : 0.35);
    const yy = cy + 2.6 + (i % 2) * 0.4 + wob - Math.abs(i - 5) * 0.12;
    out.push(E(x, yy, 1.9, 1.5, frill));
    out.push(...flatLine([[x, yy - 0.9], [x, yy + 0.7]], 0.35, shade(frill, -12)));
  }
  // Glowing spots, pulsing.
  const pulse = att >= 0 ? [1, 0.6, 0.2, 0.4][att] : walk ? 0.5 + 0.5 * Math.sin(p) : 0.5 + 0.5 * Math.sin(it);
  for (const [x, y, r] of [[-7.6, -4.6, 2.2], [0.4, -8.4, 2.4], [7.4, -4.2, 2], [-3.4, -1.4, 1.3], [3.8, -0.8, 1.2], [11.6, -0.4, 1], [-11.4, -0.8, 0.9]]) {
    const rr = r * (0.95 + 0.12 * pulse);
    out.push(F(E(ccx + x, cy + y, rr + 0.6, rr * 0.82 + 0.55, mix(cap, glow, 0.45))), F(E(ccx + x, cy + y, rr, rr * 0.82, glow)), F(E(ccx + x - 0.3, cy + y - 0.3, rr * 0.4, rr * 0.35, TEAL_HI)));
  }

  // Staff and the front arm gripping it.
  out.push(...limb(staffPts, 2.2, 1.7, wood));
  for (const t of [0.25, 0.62, 0.86]) {
    const q = staffPts[Math.round(t * 6)];
    out.push(F(E(q[0], q[1], 1.2, 0.5, shade(wood, -14))));
  }
  // Wrapped cloth and a dangling charm under the pod.
  const tq = lerp(bot, top, 0.9);
  out.push(F(E(tq[0], tq[1], 1.5, 0.9, '#c46f8c')), F(E(tq[0], tq[1] + 1.1, 1.5, 0.7, '#e08aa6')));
  const sw = walk ? Math.sin(p * 2 - 1.6) * 1.2 : key(att, [-1.6, 1.8, 0.8, -0.4], Math.sin(it - 0.6) * 0.5);
  out.push(...flatLine([[tq[0] - 0.8, tq[1] + 1.4], [tq[0] - 1.6 - sw * 0.4, tq[1] + 4]], 0.4, '#7a5a3a'), ...oval(tq[0] - 1.7 - sw * 0.4, tq[1] + 4.6, 0.7, 0.9, PURP));
  // The pod: a glowing bulb held in curling root prongs.
  const o = [top[0] + 0.2, top[1] - 3.4];
  const pg = 1 + 0.12 * raise + (att === 0 ? 0.15 : 0) + (walk ? 0 : 0.06 * Math.sin(it));
  out.push(...limb([top, [o[0] - 3, o[1] + 0.6], [o[0] - 2.8, o[1] - 2.6], [o[0] - 1.4, o[1] - 3.6]], 1.4, 0.4, wood));
  out.push(F(E(o[0], o[1], 3.3 * pg, 3.3 * pg, lineOf(glow))), F(E(o[0], o[1], 2.9 * pg, 2.9 * pg, mix(glow, '#2f9f9a', 0.35))), F(E(o[0], o[1], 2.3 * pg, 2.3 * pg, glow)));
  out.push(F(E(o[0] + 0.3, o[1] + 0.3, 1.2 * pg, 1.2 * pg, TEAL_HI)), F(E(o[0] - 1.1, o[1] - 1.1, 0.6, 0.6, '#ffffff')));
  for (const [dx, dy] of [[-1.2, 0.9], [1.3, -0.7], [0.9, 1.4]]) out.push(F(E(o[0] + dx, o[1] + dy, 0.35, 0.35, PURP)));
  out.push(...limb([top, [o[0] + 2.8, o[1] + 0.8], [o[0] + 3, o[1] - 2.2], [o[0] + 1.6, o[1] - 3.8]], 1.4, 0.4, shade(wood, 6)));
  // Motes rising off the pod, more of them as it is raised.
  const mt = walk ? f / 8 : f / 6;
  for (let i = 0; i < (raise > 0.5 || angry ? 4 : 2); i++) {
    const u = (mt + i / 4) % 1;
    out.push(...mote(o[0] + Math.sin(u * TAU + i * 2) * 3.2, o[1] - 3.6 - u * 3.4, 0.55 - u * 0.2, i % 2 ? PURP : glow));
  }
  const fsx = 22.4;
  const fsy = 31.4 + by;
  const grip = lerp(bot, top, 0.42);
  out.push(...limb([[fsx, fsy], [lerp([fsx, fsy], grip, 0.5)[0], lerp([fsx, fsy], grip, 0.5)[1] + 1], grip], 2.6, 2.1, stem), ...oval(grip[0], grip[1], 1.6, 1.6, stem));
  // The cast: spores gather into the raised pod, then burst out of it in a puff as it swings down.
  if (att === 0 && !dead) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.4;
      const d = 4.4 + (i % 2) * 1.1;
      out.push(...mote(o[0] + Math.cos(a) * d, o[1] + Math.sin(a) * d * 0.8 + 1, 0.55, i % 2 ? PURP : glow));
      out.push(...flatLine([[o[0] + Math.cos(a) * (d - 1.1), o[1] + Math.sin(a) * (d - 1.1) * 0.8 + 1], [o[0] + Math.cos(a) * (d - 2.2), o[1] + Math.sin(a) * (d - 2.2) * 0.8 + 1]], 0.4, TEAL_HI));
    }
  }
  if (att === 1 || att === 2) {
    const k = att === 1 ? 0.7 : 1;
    const pc = [o[0] - (att === 1 ? 1 : 2.4), o[1] - 0.5];
    const puffs = att === 1 ? [[0, 0, 2.6], [-2.4, -2.2, 2], [1, -3.4, 1.8]] : [[-1, -1, 3.2], [-4.2, -3.6, 2.6], [0.6, -5.6, 2.8], [-6.6, 0.4, 2.2], [-2.4, 2.4, 2.4], [-5.2, -7.6, 1.8]];
    for (const [dx, dy, r] of puffs) out.push(F(E(pc[0] + dx * k, pc[1] + dy * k, r * k + 0.6, r * k + 0.5, mix(glow, '#ffffff', 0.2))));
    for (const [dx, dy, r] of puffs) out.push(F(E(pc[0] + dx * k - 0.3, pc[1] + dy * k - 0.3, r * k, r * k * 0.9, mix(glow, '#ffffff', 0.62))));
    for (const [dx, dy] of [[-3, -1], [1.4, -6.4], [-6, -5], [-0.4, 2.6], [-7.6, 1.6]].slice(0, att === 1 ? 3 : 5)) out.push(...mote(pc[0] + dx * k * 1.25, pc[1] + dy * k * 1.2, 0.6, PURP));
    if (att === 1) out.push(star(o[0] + 1.4, o[1] - 0.6, 2.4));
  }
  if (att === 3) out.push(...mote(o[0] - 4, o[1] - 6, 0.55, PURP), ...mote(o[0] - 7, o[1] - 2, 0.5, glow), ...mote(o[0] - 2, o[1] - 9, 0.45, glow));
  // The body rocks onto the limp and leans into the cast.
  const rock = walk ? Math.sin(p) * 0.045 : key(att, [-0.02, 0.03, 0.025, 0.01], Math.sin(it) * 0.012);
  const sq = walk ? -Math.max(0, Math.sin(p)) * 0.035 : key(att, [-0.08, 0, -0.04, 0], Math.sin(it) * 0.015);
  const shapes = bend(out, { cx: 17, top: 36, floor: 43.5, a: rock, dx: key(att, [-0.3, 0.5, 0.5, 0.1], 0), sx: 1 - sq * 0.8, sy: 1 + sq });
  return { w: 36, h: 44, res: 3, shapes };
}

// ---------- Bramble Bear (thornback) ----------
// A hulking bear armored in bark plates, bound in thorny brambles, with moss and glowing toadstools
// on its back, corruption seeping purple between the plates, a bark brow-plate with horn thorns,
// and big pale claws. It trots in diagonal pairs.

function brambleBear(pose, f, mood) {
  const walk = pose === 'walk';
  const att = pose === 'attack' ? f : -1;
  // A heavy lumber, one leg after another (hind, fore, hind, fore), the head swinging low.
  const p = walk ? (f / 8) * TAU : 0;
  const it = walk || att >= 0 ? 0 : (f / 6) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const fur = '#9a7460';
  const furD = '#7d5c4c';
  const belly = '#c7a488';
  const muzzle = '#dcbda0';
  const plate = '#68564a';
  const plateHi = '#8a7465';
  const vine = '#5f8c5c';
  const thorn = '#ece0c6';
  const glow = dead ? '#a49cb0' : TEAL;
  const pglow = dead ? '#9f94ad' : PURP;
  const bob = walk ? Math.cos(p * 2 - 0.6) * 0.8 : Math.sin(it) * 0.35;
  const breathe = walk ? 0 : (1 + Math.sin(it)) * 0.35;
  const by = bob + (dead ? 2 : 0);
  const hx = (hurt ? -2 : angry ? 1 : 0) + (walk ? Math.sin(p * 2 - 1.2) * 0.6 : Math.sin(it) * 0.4) + key(att, [-1.6, 0, 0, 0], 0);
  const hy = (dead ? 4.4 : hurt ? -1.4 : angry ? 0.8 : 0) + (walk ? 0.8 + Math.sin(p * 2 - 1.4) * 0.9 : Math.sin(it - 0.6) * 0.3 + Math.max(0, Math.sin(it * 2)) * -0.4) + key(att, [-1.2, 1.2, 1.4, 0.4], 0);
  const out = [];

  const leg = (x, top, q, c, w, fore, foot) => {
    const sw = walk ? Math.sin(q) : 0;
    const lift = walk ? Math.max(0, Math.cos(q)) ** 1.5 * 3.2 : 0;
    const px = foot ? foot[0] : x + sw * 5.5 + (dead ? (fore ? 2 : -2) : 0) + key(att, [-1, 0.4, 0.4, 0.1], 0);
    const py = foot ? foot[1] : 46 - lift;
    const knee = [(x + px) / 2 + (fore ? -0.6 : 1.2), (top + by + py) / 2];
    const res = [...limb([[x, top + by], knee, [px, py - 0.8]], w, w * 0.78, c)];
    // A rounded haunch hides the limb's flat top.
    res.push(E(x + (fore ? 0 : -0.4), top + by - 0.6, w * 0.62, w * 0.62, c));
    res.push(...oval(px + 0.8, py, 3.6, 2, c));
    for (const k of [0, 1, 2]) {
      const cx = px + 3.2 - k * 0.3;
      const cy = py - 0.9 + k * 0.9;
      res.push(...limb([[cx, cy], [cx + 1.4, cy + 0.2], [cx + 2.4, cy + 0.9]], 1.1, 0.1, k === 1 ? thorn : shade(thorn, -8)));
    }
    return res;
  };

  // Far legs, darker and a step back.
  out.push(...leg(12.4, 33, p + Math.PI, shade(fur, -12), 6, false));
  out.push(...leg(36.6, 32, p + Math.PI * 1.5, shade(fur, -12), 5.6, true));

  // Tail: a thorny stub.
  out.push(...oval(6.6, 28 + by, 2.6, 2.4, furD), F(T([[4.4, 26.6 + by], [2.2, 24.6 + by], [5, 25.6 + by]], thorn)));

  // Body: rump, belly, and the big shoulder hump.
  out.push(E(15, 31 + by, 9.6, 9.6 + breathe * 0.5, fur), E(26, 30.6 + by, 17.6, 11.4 + breathe, fur), E(35.6, 27.4 + by, 10.4, 10.6 + breathe * 0.5, fur));
  out.push(E(26.4, 36.8 + by, 13, 4, belly));
  out.push(...flatLine([[19, 35.4 + by], [20, 37 + by]], 0.45, shade(belly, -12)), ...flatLine([[26, 36 + by], [26.6, 38 + by]], 0.45, shade(belly, -12)), ...flatLine([[33, 35.4 + by], [33.4, 37.2 + by]], 0.45, shade(belly, -12)));
  // Fur tufts along the underside.
  for (const x of [15, 21, 28, 34]) out.push(T([[x - 1.6, 38.6 + by], [x + 1.6, 38.6 + by], [x + 0.2, 41 + by]], fur));

  // Bramble wrapped over the body, under the plates, with little thorns and leaves.
  const wrap = (pts, th = 1) => {
    const res = [...flatLine(pts, th + 0.6, lineOf(vine)), ...flatLine(pts, th, vine)];
    for (let i = 1; i < pts.length; i++) {
      const m = lerp(pts[i - 1], pts[i], 0.5);
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      const l = Math.hypot(dx, dy) || 1;
      const nx = (dy / l) * (i % 2 ? 1 : -1);
      const ny = (-dx / l) * (i % 2 ? 1 : -1);
      res.push(F(T([[m[0] - (dx / l) * 0.6, m[1] - (dy / l) * 0.6], [m[0] + (dx / l) * 0.6, m[1] + (dy / l) * 0.6], [m[0] + nx * 1.5, m[1] + ny * 1.5]], thorn)));
    }
    return res;
  };
  out.push(...wrap([[12, 22.6 + by], [16.4, 27.4 + by], [19, 31.6 + by], [23.6, 34.4 + by], [27.8, 39.4 + by]]));
  out.push(...wrap([[29.4, 19.4 + by], [31.2, 24.4 + by], [35.6, 29.2 + by], [37, 35 + by]]));
  out.push(F(T([[19.4, 31.4 + by], [22.6, 29.6 + by], [21.4, 32.4 + by]], '#8fc77a')), F(T([[35.6, 29.2 + by], [38.6, 27.8 + by], [37.8, 30.6 + by]], '#8fc77a')));
  out.push(F(E(18.2, 30 + by, 0.8, 0.8, '#ff9ec0')), F(E(18.2, 30 + by, 0.35, 0.35, '#fff2b8')));

  // Bark plates armoring the back, each with a thorn; purple corruption glows in the seams.
  const plates = [[198, 7, 5.6], [221, 8.4, 6], [246, 9, 6.4], [271, 9, 6.4], [296, 8.4, 6], [318, 6.8, 5.2]];
  const seams = [];
  plates.forEach(([deg, pw, ph], i) => {
    const a = (deg * Math.PI) / 180;
    const cx = 24.8 + Math.cos(a) * 14.6;
    const cy = 31.6 + by + Math.sin(a) * 12.6;
    const tx = -Math.sin(a);
    const ty = Math.cos(a);
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    const pt = (u, v) => [cx + tx * u * pw * 0.5 + nx * v * ph * 0.5, cy + ty * u * pw * 0.5 + ny * v * ph * 0.5];
    const quad = [pt(-1, -0.8), pt(-0.95, 0.5), pt(-0.5, 0.95), pt(0.5, 0.95), pt(0.95, 0.5), pt(1, -0.8), pt(0, -1)];
    seams.push([pt(1, 0.4), pt(1.02, -0.6)]);
    out.push(F(T(quad.map(([x, y]) => [x + nx * 0.5, y + ny * 0.5]), lineOf(plate))), C(T(quad, plate)));
    out.push(...flatLine([pt(-0.7, 0.62), pt(0, 0.78), pt(0.7, 0.62)], 0.7, plateHi));
    out.push(...flatLine([pt(-0.55, -0.5), pt(-0.6, 0.3)], 0.4, shade(plate, -10)), ...flatLine([pt(0.45, -0.55), pt(0.5, 0.25)], 0.4, shade(plate, -10)));
    // Thorn spike.
    const l = (i % 2 ? 4.2 : 5.6) + (angry ? 1.6 : 0);
    const b0 = pt(-0.4, 0.8);
    const b1 = pt(0.4, 0.8);
    const tipP = [cx + nx * (ph * 0.5 + l) - tx * 1.4, cy + ny * (ph * 0.5 + l) - ty * 1.4];
    if (i > 0) out.push(F(T([[b0[0] - nx * 0.4, b0[1] - ny * 0.4], [tipP[0] + nx * 0.5, tipP[1] + ny * 0.5], [b1[0] - nx * 0.4, b1[1] - ny * 0.4]], lineOf(thorn))), T([b0, tipP, b1], thorn));
    if (i === 2 || i === 4) {
      const m = pt(-0.35, 0.1);
      out.push(F(E(m[0] - 1.2, m[1], 1.3, 1, '#6fa565')), F(E(m[0] + 0.6, m[1] - 0.2, 1.5, 1.1, '#7fb26e')), F(E(m[0] + 0.2, m[1] + 0.8, 1.2, 0.8, '#6fa565')), F(E(m[0] + 0.4, m[1] - 0.6, 0.6, 0.35, '#a3d48f')));
    }
  });
  for (const [a, b] of seams.slice(0, -1)) out.push(...flatLine([a, b], 0.9, pglow), F(E(lerp(a, b, 0.5)[0], lerp(a, b, 0.5)[1], 0.35, 0.35, PURP_HI)));
  // Glowing toadstools sprouting from the rump plate.
  for (const [x, y, s] of [[9.6, 20.6, 1], [12.6, 19.2, 0.8]]) {
    out.push(...limb([[x, y + by + 2.6 * s], [x, y + by]], 0.9, 0.8, BONE), ...oval(x, y + by - 0.4, 2 * s, 1.3 * s, '#4fb8b0'), F(E(x - 0.4, y + by - 0.8, 0.6 * s, 0.4 * s, TEAL_HI)));
  }

  // Near legs.
  out.push(...leg(15.6, 34.6, p, fur, 6.6, false));
  // The swiping paw: raised high beside the head, raked down in front, planted, drawn back.
  const paw = att >= 0 ? [[49, 35], [53, 44.5], [52.5, 46], [46, 46]][att] : null;
  if (!paw) out.push(...leg(39.4, 33.6, p + Math.PI * 0.5, fur, 6.2, true));
  // A bramble coiled around the near foreleg.
  if (!paw) {
    const fl = walk ? Math.sin(p + Math.PI * 0.5) * 2.75 : 0;
    out.push(...wrap([[36.4 + fl * 0.3, 36.6 + by], [42.4 + fl * 0.5, 38.4 + by * 0.5], [37 + fl * 0.6, 41.4]], 0.8));
  }

  // Head: big, with a cheek ruff and a bark brow-plate.
  const hcx = 46.4 + hx;
  const hcy = 24.4 + by + hy;
  out.push(...oval(hcx - 5.4, hcy - 7.6, 2.9, 2.9, furD), F(E(hcx - 5.2, hcy - 7.4, 1.4, 1.4, '#8c64b0')));
  for (const [dx, dy] of [[-8.4, 3.6], [-7, 6.8], [-4, 8.4]]) out.push(T([[hcx + dx - 1.8, hcy + dy - 2.4], [hcx + dx + 1.8, hcy + dy - 1.4], [hcx + dx - 1.4, hcy + dy + 2.4]], fur));
  out.push(C(E(hcx, hcy, 9.4, 8.6, fur)));
  out.push(...oval(hcx + 2, hcy - 8.2, 3.1, 3.1, fur), F(E(hcx + 2.1, hcy - 8, 1.6, 1.6, '#8c64b0')));
  out.push(F(E(hcx - 4.6, hcy + 3.4, 2.4, 1.6, mix(fur, '#ffffff', 0.12))));
  out.push(F(T([[hcx - 7, hcy - 2.8], [hcx - 6.2, hcy - 7.4], [hcx - 1.2, hcy - 9], [hcx + 3.6, hcy - 7], [hcx + 4, hcy - 4.2], [hcx - 1.4, hcy - 4.8]], lineOf(plate))));
  out.push(T([[hcx - 6.4, hcy - 3.2], [hcx - 5.8, hcy - 7], [hcx - 1.2, hcy - 8.4], [hcx + 3.2, hcy - 6.6], [hcx + 3.4, hcy - 4.6], [hcx - 1.4, hcy - 5.2]], plate));
  out.push(...flatLine([[hcx - 5.2, hcy - 6.2], [hcx - 1.2, hcy - 7.6], [hcx + 2.6, hcy - 6]], 0.55, plateHi));
  out.push(...flatLine([[hcx - 1.8, hcy - 8], [hcx - 0.9, hcy - 6.4], [hcx - 1.8, hcy - 5.2]], 0.55, pglow));
  out.push(F(T([[hcx - 5.4, hcy - 6.4], [hcx - 8.4, hcy - 11.4], [hcx - 3.2, hcy - 7.4]], lineOf(thorn))), T([[hcx - 5.2, hcy - 6.6], [hcx - 7.8, hcy - 10.8], [hcx - 3.6, hcy - 7.4]], thorn));
  // Muzzle, jaw, and nose.
  const jaw = angry ? 2.6 : hurt ? 1.2 : dead ? 1.4 : 0;
  const mx = hcx + 6;
  const my = hcy + 2.6;
  out.push(...oval(mx + 0.2, my + 2 + jaw * 0.6, 3.8, 2.2, muzzle));
  if (jaw > 0) {
    out.push(F(E(mx + 0.6, my + 2.2 + jaw * 0.3, 3.4, 1.3 + jaw * 0.5, GUM)), F(E(mx + 0.2, my + 2.6 + jaw * 0.6, 1.9, 0.7, MOUTH)));
    if (!hurt) {
      for (const k of [-1.4, 1.2]) out.push(F(T([[mx + k - 0.6, my + 1], [mx + k + 0.7, my + 1], [mx + k, my + 2.8 + jaw * 0.1]], FANG)));
      for (const k of [-0.8, 1.6]) out.push(F(T([[mx + k - 0.5, my + 3.4 + jaw * 0.8], [mx + k + 0.5, my + 3.4 + jaw * 0.8], [mx + k, my + 2.2 + jaw * 0.6]], FANG)));
    }
    if (dead) out.push(F(E(mx + 2, my + 3.6 + jaw * 0.6, 1, 1.3, '#ff8fa8')));
  }
  out.push(...oval(mx, my, 4.6, 3, muzzle));
  out.push(F(E(mx - 0.4, my - 1.1, 2.2, 0.8, mix(muzzle, '#ffffff', 0.4))));
  if (jaw === 0) {
    out.push(...flatLine([[mx - 3, my + 1.8], [mx, my + 2.4], [mx + 3.2, my + 1.4]], 0.5, lineOf(muzzle)));
    out.push(F(T([[mx + 1.2, my + 2.3], [mx + 2.3, my + 2], [mx + 1.9, my + 0.8]], FANG)));
    if (mood === 'happy') out.push(F(E(mx, my + 2.8, 1.3, 0.8, MOUTH)));
  }
  out.push(...flatLine([[mx + 3.6, my - 0.4], [mx + 3.4, my + 1.2]], 0.45, lineOf(muzzle)));
  out.push(F(E(mx + 3.8, my - 1.2, 2, 1.5, '#4a3548')), F(E(mx + 3.3, my - 1.8, 0.7, 0.45, '#a08fbf')));
  const look = walk || att >= 0 ? 0.6 : Math.sin(it + 0.5) * 1.1;
  out.push(...eyes([[hcx - 1.8, hcy - 1.2, 1.75], [hcx + 3.4, hcy - 1.6, 1.6]], mood, { cx: hcx + 0.8, skin: fur, glow, brow: '#4a3548', style: 'bear', look }));
  if (mood === 'idle' || mood === 'happy' || mood === 'blink') out.push(F(E(hcx - 3.4, hcy + 2.4, 1.3, 0.6, BLUSH)));
  // In the swipe the paw comes up in front of the chest, under the snarling head.
  if (paw) out.push(...leg(39.4, 33.6, 0, fur, 6.2, true, paw));
  // The swipe's claw streak, then a burst of sparks and dust where the paw lands.
  if (att === 1) out.push(...swoosh(45, 37, 9, -60, 70, 3.4));
  if (att === 2) {
    out.push(...swoosh(45, 37, 9, 0, 80, 2), star(56.4, 44.6, 2.4), star(51, 41.6, 1.4, TEAL_HI));
    for (const [x, r] of [[47.6, 1.8], [58, 1.4], [50.4, 1.2]]) out.push(F(E(x, 46.4 - r * 0.4, r + 0.4, r * 0.7 + 0.3, '#d9c7b4')), F(E(x - 0.3, 46.2 - r * 0.5, r, r * 0.6, '#f2e6d6')));
  }
  // The lumber rolls the shoulders over each planted forefoot; the swipe rears up and crashes down.
  const pitch = walk ? Math.sin(p * 2) * 0.025 : key(att, [-0.08, 0.025, 0.015, 0.005], Math.sin(it) * 0.008);
  const sq = walk ? Math.cos(p * 2 - 0.6) * 0.02 : key(att, [0.02, -0.03, -0.05, 0], Math.sin(it) * 0.015);
  const shapes = bend(out, { cx: 18, top: 34, floor: 47.5, a: pitch, dx: key(att, [-1.2, 0, 0, 0], 0), sx: 1 - sq * 0.6, sy: 1 + sq });
  return { w: 60, h: 48, res: 3, shapes };
}

// ---------- Spore Mite (sporeling) ----------
// A tiny scuttling puffball bug: a fluffy lilac body on six spindly legs, a translucent spore sac
// glowing on its back (puffing from a little vent), a shiny head with big eyes, glow-tipped
// antennae, and wee mandibles.

function sporeMite(pose, f, mood) {
  const walk = pose === 'walk';
  const att = pose === 'attack' ? f : -1;
  // A fast tripod skitter: three legs push while the other three swing.
  const p = walk ? (f / 8) * TAU : 0;
  const it = walk || att >= 0 ? 0 : (f / 6) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const puff = '#efd2ec';
  const puffD = '#d6aad8';
  const shell = '#a98ad0';
  const leg = '#7e6296';
  const glow = dead ? '#a49cb0' : TEAL;
  const by = (walk ? -0.7 * Math.abs(Math.sin(p)) + 0.2 : Math.sin(it) * 0.3) + (dead ? 3 : -1.2) + key(att, [0.5, -0.3, 0.2, 0], 0);
  const hx = (hurt ? -1 : 0) + key(att, [-0.8, 0.6, 0.4, 0], 0);
  const pulse = att >= 0 ? [1, 0.2, 0.5, 0.7][att] : walk ? 0.5 + 0.5 * Math.cos(p * 2) : 0.5 + 0.5 * Math.sin(it);
  const out = [];

  // Spindly jointed legs with high knees.
  const legShape = (x, q, c, dir, far) => {
    const sw = walk ? Math.sin(q) : 0;
    const lift = walk ? Math.max(0, Math.cos(q)) ** 1.4 * 1.9 : 0;
    const hip = [x, 13.4 + by - (far ? 0.8 : 0)];
    let foot = [x + dir * 3.4 + sw * 3 + key(att, [-0.6, 0.5, 0.4, 0], 0), 19.6 - lift - (far ? 0.5 : 0)];
    if (dead) foot = [x + dir * 2.4, 12.4 + by];
    const knee = [x + dir * 2.2 + sw * 0.6, hip[1] - 1.8 + (dead ? 0.6 : 0)];
    return [taper([hip, knee], 1.1, 0.9, c), taper([knee, [foot[0] - dir * 0.2, foot[1] - 1.2], foot], 0.9, 0.5, c), F(E(knee[0], knee[1], 0.5, 0.5, mix(c, '#ffffff', 0.25)))];
  };
  const xs = [6.6, 10.4, 14.2];
  const dirs = [-1, 0.25, 1.1];
  xs.forEach((x, i) => out.push(...legShape(x + 1.4, p + (i === 1 ? 0 : Math.PI), shade(leg, -12), dirs[i], true)));

  // Spore sac on the rear, glowing through its skin.
  const sr = 3 + pulse * 0.45;
  const sx = 5.4;
  const sy = 7.4 + by;
  out.push(...limb([[sx - 1.4, sy - 2.2], [sx - 2.2, sy - 3.8]], 1.5, 1.2, '#6fb7b0'));
  out.push(F(E(sx - 2.25, sy - 3.9, 0.85, 0.5, TEAL_HI)));
  out.push(...oval(sx, sy, sr, sr * 0.95, mix(glow, '#3aa59c', 0.4)));
  out.push(F(E(sx + 0.25, sy + 0.3, sr * 0.75, sr * 0.72, glow)));
  for (const [x, y, r] of [[-0.9, 0.6, 0.7], [1, -0.5, 0.55], [0.5, 1.4, 0.45]]) out.push(F(E(sx + x, sy + y, r * (0.8 + pulse * 0.4), r * (0.8 + pulse * 0.4), TEAL_HI)));
  out.push(F(E(sx - 1, sy - 1.3, 0.8, 0.5, '#ffffff')));

  // The puffball body: fluff bumps around a round core, dotted with spore pores.
  const bx = 10.2;
  const byy = 11.6 + by;
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * (1.0 + (i / 7) * 1.0);
    const w = walk ? Math.sin(p * 2 - 1 + i) * 0.3 : Math.sin(it + i) * 0.15;
    out.push(E(bx + Math.cos(a) * 5.6, byy + Math.sin(a) * 4.4 + w, 1.9, 1.8, puff));
  }
  out.push(E(bx, byy, 6.4, 5, puff), F(E(bx + 0.4, byy + 3.4, 4.8, 1.2, puffD)));
  for (const [x, y, r] of [[-3.6, 0.6, 0.55], [-1, -1.8, 0.5], [1.4, 1, 0.6], [-1.6, 2, 0.45], [2.8, -1.8, 0.45]]) {
    out.push(F(E(bx + x, byy + y, r, r * 0.8, mix(puff, '#8a5aa8', 0.35))), F(E(bx + x + 0.15, byy + y - 0.15, r * 0.4, r * 0.4, mix(PURP, '#ffffff', 0.4))));
  }
  out.push(F(E(bx - 2, byy - 3, 2, 0.8, '#fff4fc')));

  // Near legs.
  xs.forEach((x, i) => out.push(...legShape(x, p + (i === 1 ? Math.PI : 0), leg, dirs[i], false)));

  // Mite puffs from the vent as it scuttles.
  if (!dead) {
    const u = walk ? f / 8 : f / 6;
    out.push(...mote(sx - 3 - u * 1.4, sy - 5 - u * 1.4, 0.7 - u * 0.25, glow), ...mote(sx - 0.6 + u, sy - 5.8 - u * 1.2, 0.5, PURP));
  }

  // Head: a shiny carapace with big eyes, glow-tipped antennae, and mandibles.
  const hcx = 17 + hx;
  const hcy = 11.4 + by + (dead ? 0.6 : 0);
  // Antennae trail the skitter, twitch while idle, and flatten back for the bite.
  const aw = walk ? Math.sin(p * 2 - 1.6) * 0.9 + 0.6 : key(att, [1.4, -1, -0.4, 0.4], Math.sin(it) * 0.5 + (f === 2 ? -0.8 : 0));
  const ant = (x0, dx, c) => {
    const tip = dead ? [hcx + x0 + 3 + dx, hcy - 3.2] : [hcx + x0 + 2.8 + dx + aw * 0.4, hcy - 7.9 + aw + (angry ? 0.8 : 0)];
    return [...limb([[hcx + x0, hcy - 3.4], [hcx + x0 + 0.4 + dx, hcy - 6.6], tip], 0.8, 0.5, c), ...oval(tip[0], tip[1], 0.95, 0.95, glow), F(E(tip[0] - 0.25, tip[1] - 0.25, 0.4, 0.4, TEAL_HI))];
  };
  out.push(...ant(-1.8, -1.2, shade(shell, -16)));
  for (const s of [-1, 1]) {
    const mo = att >= 0 ? [1.8, -0.3, 0, 0.6][att] : angry ? 0.7 : walk ? Math.max(0, Math.sin(p * 2)) * 0.4 : 0;
    out.push(...limb([[hcx + 3, hcy + 2.2 + s * 0.6], [hcx + 5.2, hcy + 2.4 + s * (0.9 + mo)], [hcx + 5.9, hcy + 1.6 + s * (0.1 + mo)]], 1.1, 0.3, s < 0 ? shade(BONE, -12) : BONE));
  }
  out.push(C(E(hcx, hcy, 4.8, 4.4, shell)), F(E(hcx - 1, hcy - 2.8, 2.2, 0.9, mix(shell, '#ffffff', 0.45))));
  out.push(...ant(0.6, 0, shell));
  const look = walk || att >= 0 ? 0.6 : Math.sin(it * 2) * 1;
  out.push(...eyes([[hcx - 1.1, hcy + 0.3, 1.3], [hcx + 2.4, hcy + 0.2, 1.15]], mood, { cx: hcx + 0.65, skin: shell, glow, brow: '#3f2a58', flare: false, style: 'bug', look }));
  if (mood === 'idle' || mood === 'happy' || mood === 'blink') out.push(F(E(hcx - 2.4, hcy + 2.4, 0.9, 0.45, BLUSH)));
  if (mood === 'angry' || mood === 'hurt' || mood === 'happy') out.push(F(E(hcx + 1.4, hcy + 3, 0.6, 0.5, mood === 'happy' ? MOUTH : GUM)));
  if (hurt) out.push(F(E(hcx + 4, hcy - 3.6, 0.6, 0.9, '#9fe8ff')));
  // The bite: a snap of the mandibles with a spark, and a puff from the sac.
  if (att === 1) out.push(star(hcx + 5.4, hcy + 2.2, 1.9), ...mote(sx - 3, sy - 4.6, 0.8, glow));
  if (att === 2) out.push(star(hcx + 5.2, hcy + 1, 1.1, TEAL_HI), ...mote(sx - 4.2, sy - 6.2, 0.6, PURP));
  const pitch = walk ? Math.sin(p * 2) * 0.02 : key(att, [-0.14, 0.1, 0.06, 0], 0);
  const sq = walk ? -Math.abs(Math.cos(p)) * 0.04 + 0.02 : key(att, [-0.08, 0.04, -0.03, 0], Math.sin(it) * 0.025);
  const shapes = bend(out, { cx: 11, top: 13, floor: 19.6, a: pitch, sx: 1 - sq * 0.8, sy: 1 + sq });
  return { w: 24, h: 20, res: 3, shapes };
}

// ---------- Corrupted Sapling (sapling) ----------
// A twisted young tree rooted to the floor, its trunk spiraling around a hollow where a corrupted
// heart pulses with purple light, veins of glow spreading through the bark, weeping branches of
// drooping leaves (some gone violet), and a sleepy knot face. It never walks: its "walk" frames
// are a heartbeat (lub-dub, rest).

function sapling(pose, f, mood) {
  const walk = pose === 'walk';
  const att = pose === 'attack' ? f : -1;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  // Rooted, its "walk" is a slow swaying dance to its own heartbeat (lub-dub, rest); branches and
  // leaves trail the trunk. The lash rears the whole crown back and whips the front branch down.
  const ph = walk ? (f / 8) * TAU : att >= 0 ? 0 : (f / 6) * TAU;
  const beat = dead ? 0 : att >= 0 ? [1, 0.6, 0.8, 0.3][att] : walk ? [0.15, 1, 0.45, 0.75, 0.25, 0.08, 0, 0.05][f] : 0.2 + 0.15 * Math.sin(ph);
  const sway = (walk ? Math.sin(ph) * 1.5 : key(att, [-2.4, 2.2, 1.6, 0.5], Math.sin(ph) * 0.5)) + (hurt ? -1.6 : 0);
  // The crown follows a beat behind the trunk.
  const lagS = walk ? Math.sin(ph - 0.9) * 1.6 : key(att, [-3, 1.4, 2.4, 1], Math.sin(ph - 0.9) * 0.5);
  const droop = dead ? 2.4 : 0;
  const bark = '#a98468';
  const barkD = '#80624f';
  const barkL = '#c4a084';
  const leafA = dead ? '#a9a08f' : '#97c48c';
  const leafB = dead ? '#9b8f99' : '#b08ad8';
  const leafC = dead ? '#8f8a80' : '#77a978';
  const heart = dead ? '#8f8599' : '#e05cf0';
  const glow = dead ? '#a49cb0' : TEAL;
  const vein = dead ? barkD : mix(barkD, PURP, 0.45 + 0.45 * beat);
  const out = [];
  // Lean: the top of the tree shifts with the sway.
  const sx = (y) => sway * (1 - y / 44) * 1.4 + (lagS - sway) * Math.max(0, 1 - y / 24) * 0.6;

  // Roots gripping the floor.
  out.push(...limb([[14, 40.6], [11, 44.4], [8.6, 45.6]], 2.4, 0.6, barkD));
  out.push(...limb([[13.4, 39.6], [9.6, 42.6], [5, 44.2], [2.4, 44.6], [1.4, 43.4]], 3.2, 0.5, bark));
  out.push(...limb([[16.4, 39.6], [20.4, 42.6], [25, 44.2], [27.6, 44.6], [28.6, 43.4]], 3.2, 0.5, bark));
  out.push(...limb([[15.2, 41.6], [15.6, 44.4], [17.6, 45.6], [19.4, 45.4]], 2.4, 0.5, barkL));

  // A pointed leaf hanging from (x, y), tipping toward side.
  const leaf = (x, y, l, side, c) => {
    const pts = [[x, y], [x - 1.2, y + l * 0.4], [x + side * 0.6, y + l], [x + 1.2, y + l * 0.4]];
    const res = [F(T(pts.map(([px, py]) => [px + (px - x) * 0.25 + (px === x ? 0 : 0), py + (py - y) * 0.12 + (py === y ? -0.4 : 0.3)]), lineOf(c))), F(T(pts, c))];
    res.push(...flatLine([[x, y + 0.3], [x + side * 0.4, y + l * 0.75]], 0.3, shade(c, -14)));
    if (c === leafB && !dead) res.push(F(E(x + side * 0.6, y + l - 0.4, 0.55, 0.55, glow)));
    return res;
  };
  // Weeping branches arching out from the top of the trunk, hung with leaves.
  const branch = (pts, side) => {
    // Attack: the front branch rears up and back, then whips forward and down; the back one counters.
    const ax = side > 0 ? key(att, [-1.6, 1.6, 1.2, 0.3], 0) : key(att, [-1, -1.2, -0.8, 0], 0);
    const ay = side > 0 ? key(att, [-9, 8, 9, 2], 0) : key(att, [-6, 2, 1, 0], 0);
    const flex = walk ? Math.sin(ph - 1.6 + side) * 0.9 : Math.sin(ph - 1.2 + side) * 0.4;
    const b = pts.map(([x, y], i) => {
      const t = i / (pts.length - 1);
      return [x + sx(y) + ax * t * t + flex * t * t * side * 0.5, y + (angry ? -1.4 * Math.abs(x - 15) / 10 : 0) + ay * t * t + flex * t * t];
    });
    const res = [...limb(b, 2.6, 0.7, barkD)];
    for (let i = 0; i < 5; i++) {
      const seg = Math.min(b.length - 2, Math.floor(i * 0.8) + 1);
      const m = lerp(b[seg - (i % 2 ? 0 : 1) + 0], b[seg + (i % 2 ? 1 : 0)] ?? b[seg], i % 2 ? 0.4 : 0.7);
      const dl = droop + (walk ? Math.sin(ph - 1.4 + i) * 0.6 : Math.sin(ph + i) * 0.25);
      const c = i % 3 === 1 ? leafB : i % 2 ? leafA : leafC;
      res.push(...leaf(m[0], m[1] + 0.4, 3.6 + (i % 2) * 0.8 + dl, side, c));
    }
    return res;
  };
  out.push(...branch([[13.8, 16], [9.6, 12.8], [5.4, 13], [3, 15.8], [2.4, 19.6]], -1));
  out.push(...branch([[16.4, 15.6], [20.6, 12.6], [24.8, 12.8], [27, 15.6], [27.6, 19.4]], 1));

  // The twisted trunk.
  const tc = [[15, 42], [13.8, 37], [16.2, 31.6], [14.6, 25.6], [15.4, 19], [15, 13]].map(([x, y]) => [x + sx(y), y]);
  out.push(F(taper(ext(tc, 0.3), 10.2, 6.4, lineOf(bark))), taper(tc, 9.2, 5.4, bark));
  // Spiral grooves and ridges.
  for (const y of [38, 34, 23, 18.6]) out.push(...flatLine([[11.6 + sx(y), y + 1.4], [15 + sx(y), y - 0.2], [18.4 + sx(y), y - 1.8]], 0.5, barkD));
  for (const y of [36.4]) out.push(...flatLine([[12.4 + sx(y), y + 1], [15.6 + sx(y), y - 0.6]], 0.5, barkL));
  // A knotty swell in the trunk carries the face.
  out.push(C(E(15.4 + sx(22), 22.2, 5.6, 4.8, bark)), F(E(13.4 + sx(22), 19.6, 2.2, 0.8, barkL)));
  out.push(...flatLine([[10.4 + sx(22), 23.4], [11.2 + sx(22), 25.4]], 0.45, barkD), ...flatLine([[20.4 + sx(22), 23], [19.8 + sx(22), 25.2]], 0.45, barkD));

  // Hollow with the pulsing heart, and veins of glow spreading out.
  const hcx = 15.6 + sx(32);
  const hcy = 32.4;
  for (const v of [[[hcx - 2.4, hcy - 3.6], [hcx - 3.4, hcy - 6.2], [hcx - 2.6, hcy - 8.4]], [[hcx + 2.6, hcy - 3], [hcx + 3.4, hcy - 5.6]], [[hcx - 2.8, hcy + 3], [hcx - 3.8, hcy + 6], [hcx - 3.2, hcy + 8]], [[hcx + 2.6, hcy + 3.4], [hcx + 3.6, hcy + 6.6]]]) {
    out.push(...flatLine(v, 0.55 + beat * 0.2, vein));
    if (!dead) out.push(F(E(v[v.length - 1][0], v[v.length - 1][1], 0.5 + beat * 0.3, 0.5 + beat * 0.3, mix(PURP, PURP_HI, beat))));
  }
  out.push(F(E(hcx, hcy, 4.5, 5.3, barkL)), F(E(hcx + 0.2, hcy + 0.2, 3.9, 4.7, '#24182f')));
  out.push(F(E(hcx + 0.1, hcy + 0.4, 2.8 + beat * 0.9, 3.4 + beat * 0.9, dead ? '#3a3040' : mix('#3a1f55', PURP, 0.3 + beat * 0.4))));
  const s = 0.95 + beat * 0.4;
  const hy = hcy + 0.2;
  const heartShape = (k, c) => [
    F(E(hcx - 1 * s, hy - 0.7 * s, 1.2 * s * k, 1.15 * s * k, c)), F(E(hcx + 1 * s, hy - 0.7 * s, 1.2 * s * k, 1.15 * s * k, c)),
    F(T([[hcx - 2.15 * s * k, hy - 0.45 * s], [hcx + 2.15 * s * k, hy - 0.45 * s], [hcx, hy + 2.4 * s * k]], c)),
  ];
  out.push(...heartShape(1.12, lineOf(heart)), ...heartShape(1, heart));
  out.push(F(E(hcx - 1.1 * s, hy - 1 * s, 0.55 * s, 0.45 * s, dead ? '#c0b8c8' : PURP_HI)), F(E(hcx + 0.3, hy + 0.3, 0.9 * s, 0.9 * s, dead ? heart : mix(heart, '#ffb8f0', 0.35 + beat * 0.3))));
  // Rootlets curling over the hollow's rim.
  out.push(...limb([[hcx - 4.2, hcy - 3.4], [hcx - 2.4, hcy - 4.4], [hcx - 0.8, hcy - 3.8]], 0.9, 0.4, barkD), ...limb([[hcx + 4.2, hcy + 3], [hcx + 2.8, hcy + 4.6], [hcx + 1, hcy + 4.6]], 0.9, 0.4, barkD));

  // Face: sleepy knot eyes and a crack of a mouth.
  const fx = 15.4 + sx(22) + (hurt ? -0.4 : 0);
  const fy = 22 + (dead ? 0.6 : 0);
  out.push(F(E(fx - 2.4, fy - 2.3, 1.8, 0.5, barkD)), F(E(fx + 2.4, fy - 2.3, 1.8, 0.5, barkD)));
  const look = walk ? Math.sin(ph) * 0.8 : att >= 0 ? 0.8 : Math.sin(ph + 1) * 1.1;
  const sap = angry ? mix('#ff8ad8', PURP_HI, 0.3 * beat) : mix('#ffc964', '#ffe9a8', 0.5 * beat);
  out.push(...eyes([[fx - 2.3, fy, 1.3], [fx + 2.3, fy, 1.3]], mood, { cx: fx, skin: bark, glow: dead ? glow : sap, core: '#fff8dc', brow: '#4a3548', style: 'knot', look }));
  const my = fy + 2.8;
  switch (mood) {
    case 'angry':
      out.push(F(E(fx, my, 1.7, 0.9, GUM)), F(T([[fx - 1.2, my - 0.6], [fx - 0.4, my - 0.6], [fx - 0.8, my + 0.4]], FANG)), F(T([[fx + 0.4, my - 0.6], [fx + 1.2, my - 0.6], [fx + 0.8, my + 0.4]], FANG)));
      break;
    case 'happy':
      out.push(F(T([[fx - 1.3, my - 0.4], [fx + 1.3, my - 0.4], [fx, my + 1]], MOUTH)));
      break;
    case 'hurt':
      out.push(F(E(fx, my + 0.1, 0.7, 0.8, GUM)));
      break;
    case 'dead':
      out.push(...flatLine([[fx - 1.2, my], [fx - 0.4, my - 0.4], [fx + 0.4, my], [fx + 1.2, my - 0.4]], 0.45, INK));
      break;
    default:
      out.push(...flatLine([[fx - 1.2, my - 0.2], [fx - 0.3, my + 0.3], [fx + 0.5, my], [fx + 1.2, my + 0.3]], 0.45, '#4a3548'));
  }
  if (mood === 'idle' || mood === 'happy' || mood === 'blink') out.push(F(E(fx - 3.4, fy + 1.8, 0.9, 0.45, BLUSH)), F(E(fx + 3.4, fy + 1.8, 0.9, 0.45, BLUSH)));

  // Crown: drooping clumps of leaves around a curled shoot, edged with short hanging leaves.
  const cx = 15.2 + sx(6);
  const cy = 8.4 + droop * 0.5;
  out.push(...limb([[cx, cy - 3], [cx + 0.6, cy - 5.8], [cx - 0.6, cy - 7.6], [cx - 2, cy - 7]], 1.4, 0.5, barkD));
  out.push(F(E(cx - 2.1, cy - 7, 0.75, 0.75, dead ? '#9b8f99' : PURP)), F(E(cx - 2.2, cy - 7.1, 0.3, 0.3, PURP_HI)));
  for (let i = 0; i < 7; i++) {
    const x = cx - 7.2 + i * 2.4;
    const w = walk ? Math.sin(ph - 1.5 + i * 0.9) * 0.6 : Math.sin(ph + i) * 0.3;
    const c = i % 3 === 2 ? leafB : i % 2 ? leafA : leafC;
    out.push(...leaf(x + w, cy + 2 - Math.abs(i - 3) * 0.3, 2.6 + (i % 2) * 0.6 + droop * 0.5, i < 3 ? -1 : 1, c));
  }
  for (const [x, y, rx, ry, c] of [[-4.8, 1, 4, 3, leafC], [4.8, 0.8, 4, 3, leafC], [0, 0, 6.2, 4.2, leafA], [-2.4, -2.4, 3.6, 2.6, leafA], [2.8, -2.2, 3.4, 2.4, leafB], [0.2, -3.4, 2.6, 1.8, mix(leafA, '#ffffff', 0.15)]]) {
    out.push(C(E(cx + x, cy + y, rx, ry, c)));
  }
  // A bumpy leafy rim, so the crown reads as foliage.
  for (const [x, y, r, c] of [[-7.6, -0.6, 1.6, leafC], [-6.2, -2.8, 1.7, leafA], [-4, -4.6, 1.7, leafA], [4.4, -4.4, 1.6, leafB], [6.6, -2.6, 1.7, leafC], [7.8, -0.4, 1.5, leafC], [-1.4, -5.6, 1.6, mix(leafA, '#ffffff', 0.15)], [1.8, -5.4, 1.5, leafB]]) {
    out.push(E(cx + x, cy + y, r, r * 0.9, c));
  }
  for (const [x, y] of [[-3.6, 0.8], [1.4, 1.4], [5.6, 1.2]]) out.push(...flatLine([[cx + x - 1, cy + y - 0.6], [cx + x, cy + y], [cx + x + 1, cy + y - 0.6]], 0.35, shade(leafA, -16)));
  out.push(F(E(cx - 2.2, cy - 3, 1.6, 0.7, mix(leafA, '#ffffff', 0.45))), F(E(cx + 3.4, cy - 2.4, 1, 0.5, mix(leafB, '#ffffff', 0.45))));
  for (const [x, y] of [[-4.6, -0.6], [3.8, 0.4], [0.8, -1.6]]) out.push(F(E(cx + x, cy + y, 0.65, 0.65, dead ? '#9b8f99' : PURP)), F(E(cx + x - 0.2, cy + y - 0.2, 0.25, 0.25, PURP_HI)));
  // Spore motes drifting off as the heart beats.
  if (!dead && beat > 0.4) out.push(...mote(hcx + 5.4, hcy - 4 - beat * 2, 0.6, PURP), ...mote(hcx - 5, hcy - 6 - beat, 0.5, glow));
  // The lash: a streak off the whipping branch, then leaves and sparks where it cracks.
  if (att === 1) out.push(...swoosh(21, 19, 7.6, -80, 60, 2.8));
  if (att === 2) out.push(...swoosh(21, 19, 7.6, 0, 75, 1.8), star(28, 27.6, 2), star(25.4, 30, 1.1, TEAL_HI), ...mote(28.2, 22, 0.6, PURP));
  // The trunk swells and settles with each heartbeat.
  const sq = beat * 0.025 + key(att, [-0.04, 0.03, -0.02, 0], 0);
  const shapes = bend(out, { cx: 15, top: 40, floor: 45.5, sx: 1 + sq * 0.5, sy: 1 - sq * 0.3 });
  return { w: 30, h: 46, res: 3, shapes };
}

export const ART = {
  rootling: { walk: 8, idle: 6, attack: 4, stride: 14, draw: rootImp },
  sporecap: { walk: 8, idle: 6, attack: 4, stride: 16, draw: myconid },
  thornback: { walk: 8, idle: 6, attack: 4, stride: 22, draw: brambleBear },
  sporeling: { walk: 8, idle: 6, attack: 4, stride: 12, draw: sporeMite },
  sapling: { walk: 8, idle: 6, attack: 4, cycle: 2.4, draw: sapling },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  rootling: { name: 'Root Imp', w: 22, h: 30 },
  sporecap: { name: 'Myconid Shaman', w: 22, h: 34 },
  thornback: { name: 'Bramble Bear', w: 46, h: 34 },
  sporeling: { name: 'Spore Mite', w: 18, h: 14 },
  sapling: { name: 'Corrupted Sapling', w: 18, h: 36 },
};
