// The Whispering Glade's two little folk (2026-11-12), drawn from scratch at chibi size: nothing
// scaled down from a taller figure. About two heads tall: a big round head, a small soft body,
// stubby arms with mitten hands, short legs with big round shoes.
//
// - The Puddle Kid: a tiny rain-sprite in a too-big yellow raincoat and round blue boots, standing
//   in her own little puddle, a lily pad held over her shoulder for an umbrella, dripping.
// - The Blossom Fairy: a tiny flower fairy, her skirt an upside-down bellflower, her hair up in two
//   rosebud buns, butterfly-petal wings, a dandelion puff for a wand.
//
// `gladeKidShapes(kind, mood)` gives the whole figure in a 160 x 150 box, feet (or the hover
// point) at the bottom middle, facing right.

import { E, T, F } from './kit.js';
import { hairParts } from '../hair.js';
import { hairRamp } from '../hero.js';

const W = 160;
const H = 150;
const CX = 80;
const G = 146;

const INK = '#3a2430';
const SKIN = '#ffe8da';
const SKIN_SH = '#f6c8b4';
const BLUSH = '#ff8fa6';
const MOUTH = '#9a3a4e';
const TONGUE = '#ff8a9e';

// ---------- Helpers ----------

function band(pts, w0, w1, c, flat = false) {
  const out = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const wa = w0 + ((w1 - w0) * i) / n;
    const wb = w0 + ((w1 - w0) * (i + 1)) / n;
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    const q = T([[ax + (nx * wa) / 2, ay + (ny * wa) / 2], [bx + (nx * wb) / 2, by + (ny * wb) / 2], [bx - (nx * wb) / 2, by - (ny * wb) / 2], [ax - (nx * wa) / 2, ay - (ny * wa) / 2]], c);
    out.push(flat ? F(q) : q);
    if (i > 0) out.push(flat ? F(E(ax, ay, wa / 2, wa / 2, c)) : E(ax, ay, wa / 2, wa / 2, c));
  }
  return out;
}
function curve(pts, k = 4) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < k; j++) {
      const t = j / k;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// A tilted oval as a polygon (always convex).
function ovalPts(x, y, rx, ry, a = 0, from = 0, to = Math.PI * 2, n = 20) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = from + ((to - from) * i) / n;
    const u = Math.cos(t) * rx;
    const v = Math.sin(t) * ry;
    pts.push([x + ca * u - sa * v, y + sa * u + ca * v]);
  }
  return pts;
}
const oval = (x, y, rx, ry, a, c) => T(ovalPts(x, y, rx, ry, a), c);
// A rounded petal from (x, y) along angle a: long `len`, wide `w`, round at the tip.
function petal(x, y, a, len, w, c, flat = false) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const p = (u, v) => [x + ca * u - sa * v, y + sa * u + ca * v];
  const pts = [p(0, 0), p(len * 0.25, -w * 0.42)];
  for (let i = 0; i <= 8; i++) {
    const t = -Math.PI / 2 + (i / 8) * Math.PI;
    pts.push(p(len * 0.62 + Math.cos(t) * len * 0.38, Math.sin(t) * w * 0.5));
  }
  pts.push(p(len * 0.25, w * 0.42));
  const s = T(pts, c);
  return flat ? F(s) : s;
}
// A mitten hand: a round palm and a little thumb, turned along `a`.
function mitten(x, y, a, c, r = 5.4) {
  const tx = x + Math.cos(a - 1.4) * r * 0.8;
  const ty = y + Math.sin(a - 1.4) * r * 0.8;
  return [E(x, y, r, r * 0.92, c), E(tx, ty, r * 0.42, r * 0.42, c)];
}

// ---------- The face (head centre hx, hy; turned three-quarters to the right) ----------

// One eye: a big tall oval, dark under the lid, bright below, two highlights and a twinkle, a heavy
// lash line flicking out at the outer corner (`o` = 1: outer corner right; -1: left).
function eye(x, y, w, h, mood, o, col) {
  const out = [];
  if (mood === 'happy' || mood === 'blink') {
    out.push(...band(curve([[x - w, y + 1.4], [x, y - h * 0.45], [x + w, y + 1.4]], 3), 2.2, 2.2, INK, true));
    return out;
  }
  if (mood === 'hurt') {
    out.push(...band([[x + w * o, y - h * 0.5], [x - w * 0.7 * o, y], [x + w * o, y + h * 0.5]], 2.2, 2, INK, true));
    return out;
  }
  out.push(F(E(x, y, w, h, INK)));
  out.push(F(E(x, y + 0.8, w - 1.3, h - 1.6, col.iris)));
  out.push(F(E(x, y - h * 0.32, w - 1.3, h * 0.5, col.irisDk)));
  out.push(F(E(x, y + h * 0.52, w * 0.62, h * 0.3, col.irisLt)));
  out.push(F(E(x + 0.4 * o, y + h * 0.08, w * 0.34, h * 0.36, INK)));
  out.push(F(E(x - w * 0.32, y - h * 0.36, w * 0.4, h * 0.3, '#ffffff')), F(E(x + w * 0.38, y + h * 0.4, w * 0.2, h * 0.14, '#ffffff')));
  out.push(F(E(x + w * 0.42, y - h * 0.1, w * 0.12, h * 0.1, '#ffffff')));
  const lid = mood === 'angry' ? h * 0.42 : 0;
  if (mood === 'angry') out.push(F(T([[x - w * 1.3, y - h * 1.3], [x + w * 1.3, y - h * 1.3], [x + w * 1.3 * o, y - h * 0.9 + lid * 0.2], [x - w * 1.3 * o, y - h * 0.4]].map(([a, b]) => [a, b]), SKIN)));
  out.push(...band(curve([[x - w * 1.08, y - h * 0.2], [x - w * 0.4, y - h * 1.0 + lid * 0.5], [x + w * 0.5, y - h * 1.0 + lid], [x + w * 1.08, y - h * 0.3 + lid * 0.5]], 3), 2.4, 2.4, INK, true));
  out.push(...band([[x + w * 0.95 * o, y - h * 0.4 + lid * 0.5], [x + w * 1.5 * o, y - h * 0.8 + lid * 0.5]], 2, 0.6, INK, true));
  out.push(...band(curve([[x - w * 0.5 * o, y + h * 0.98], [x + w * 0.3 * o, y + h * 0.96], [x + w * 0.85 * o, y + h * 0.7]], 2), 0.6, 1, INK, true));
  return out;
}
function face(hx, hy, mood, col) {
  const out = [];
  // Facing the screen like the hero: eyes set low and wide, blush under each, a small mouth.
  for (const sx of [-1, 1]) {
    const cx = hx + 19 * sx;
    out.push(F(E(cx, hy + 21, 6, 2.8, BLUSH)));
    for (let k = 0; k < 3; k++) out.push(...band([[cx - 3 + k * 2.7, hy + 22], [cx - 1.8 + k * 2.7, hy + 20]], 0.7, 0.7, '#f06a8a', true));
    out.push(F(E(cx + 3, hy + 19.6, 0.9, 0.7, '#ffffff')));
  }
  out.push(...eye(hx - 13.5, hy + 10, 6.4, 8.6, mood, -1, col), ...eye(hx + 13.5, hy + 10, 6.4, 8.6, mood, 1, col));
  const mx = hx;
  const my = hy + 23;
  if (mood === 'happy') {
    out.push(F(T([[mx - 4, my - 1], [mx + 4, my - 1], [mx + 3, my + 2.6], [mx, my + 4], [mx - 3, my + 2.6]], MOUTH)), F(E(mx, my + 2.6, 2, 1.1, TONGUE)));
  } else if (mood === 'angry') {
    out.push(...band(curve([[mx - 2.6, my + 1.2], [mx, my - 0.4], [mx + 2.6, my + 1.2]], 2), 1.3, 1.3, INK, true));
  } else if (mood === 'hurt') {
    out.push(F(E(mx, my + 1, 2.2, 2, MOUTH)), F(E(mx, my + 2, 1.3, 0.8, TONGUE)));
  } else {
    out.push(...band(curve([[mx - 3, my - 0.6], [mx - 1.5, my + 1], [mx, my - 0.2]], 2), 1.2, 1.2, INK, true), ...band(curve([[mx, my - 0.2], [mx + 1.5, my + 1], [mx + 3, my - 0.6]], 2), 1.2, 1.2, INK, true));
  }
  return out;
}
// The head, facing the screen like the hero's: round with full soft cheeks, an ear each side.
function skull(hx, hy) {
  return [
    E(hx - 31, hy + 8, 4.4, 6, SKIN_SH), E(hx + 31, hy + 8, 4.4, 6, SKIN),
    E(hx, hy, 32, 30.8, SKIN), E(hx, hy + 12.6, 29.5, 18.2, SKIN),
    F(T([[hx - 29, hy + 8], [hx - 22, hy + 24], [hx - 12, hy + 30], [hx - 20, hy + 18], [hx - 25, hy + 4]], SKIN_SH)),
  ];
}

// ---------- The head on the hero's hair ----------

// The kids wear real hero hairstyles (hair.js), drawn exactly as the hero's are: one dome cut into
// clumps over the face, tapered locks, a shine ring. Hero head space (skull centre 15.5, 15, about
// 10 across) is blown up to the kids' head space (HK), and the whole head is then drawn at HS of
// that about the neck, so the head is a bit over a third of her height.
const HK = 32 / 10.2;
const HS = 0.66;
function mapShape(sh, f, k) {
  if (sh.t === 'p') {
    const ox = sh.x ?? 0;
    const oy = sh.y ?? 0;
    return { ...sh, x: 0, y: 0, pts: sh.pts.map(([x, y, s]) => {
      const q = f([x + ox, y + oy]);
      return s ? [q[0], q[1], s] : q;
    }) };
  }
  const [x, y] = f([sh.x, sh.y]);
  if (sh.t === 'e') return { ...sh, x, y, rx: sh.rx * k, ry: sh.ry * k };
  if (sh.t === 'r') return { ...sh, x, y, w: sh.w * k, h: sh.h * k };
  return { ...sh, x, y };
}
// { back, front }: `back` (hair hanging behind, the back of the head) goes under the body; `front`
// (the head, face and bangs) over it. (hx, neck): where the chin sits.
function kidHead(hx, neck, mood, col, style, color, bangs = 'auto') {
  const r = hairRamp(color);
  const p = hairParts(style, r, null, null, mood === 'angry' ? 'angry' : 'smile', bangs);
  const fromHero = ([x, y]) => [(x - 15.5) * HK, (y - 15) * HK];
  const kid = (list) => list.map((sh) => mapShape(sh, fromHero, HK));
  const y0 = neck - 31 * HS;
  const place = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [hx + x * HS, y0 + y * HS], HS));
  const shade = kid([...(p.hairline ? [F(E(15.5, 8.2, 10.4, 3.2, SKIN_SH))] : []), ...p.shade]).map((sh) => ({ ...sh, c: SKIN_SH }));
  return {
    back: place([...kid(p.hang), ...kid(p.head)]),
    hang: place(kid(p.hang)),
    backHead: place(kid(p.head)),
    front: place([...skull(0, 0), ...shade, ...face(0, 0, mood, col), ...kid(p.front), ...kid(p.top)]),
  };
}

// A four-pointed twinkle, as two crossed slim diamonds (each convex).
function twinkle(x, y, r, col) {
  return [F(T([[x, y - r], [x + r * 0.24, y], [x, y + r], [x - r * 0.24, y]], col)), F(T([[x - r * 0.8, y], [x, y - r * 0.2], [x + r * 0.8, y], [x, y + r * 0.2]], col))];
}

// Each kid is drawn in named groups (the rig moves each as its own part); `shapes` is all of them
// in drawing order.
function groups() {
  const G = {};
  let cur = null;
  const use = (n) => {
    cur = G[n] ??= [];
  };
  return { G, use, out: { push: (...a) => cur.push(...a) } };
}

// ---------- The Puddle Kid ----------

const PUD = {
  hair: '#7ad6e8', hairSh: '#4fb0cc', hairDk: '#2e7a9a', hairLt: '#bff4fb',
  iris: '#4a9ae8', irisDk: '#24508e', irisLt: '#b8e2ff',
  coat: '#ffd84a', coatSh: '#eeb22a', coatDk: '#c88a1e', coatLt: '#fff2a6',
  boot: '#5aa8ec', bootSh: '#3a7ec4', bootDk: '#2a5e9e', bootLt: '#a8d8ff',
  pad: '#6cc46a', padSh: '#4a9a50', padDk: '#3a7a42', padLt: '#a6e28e',
  water: '#9ad8f0', waterLt: '#d2f2fc', waterDk: '#6ab8dc',
};

function puddleKid(mood) {
  const c = PUD;
  const { G: parts, use, out } = groups();
  use('puddle');
  const hx = CX + 2;
  const hy = 56;

  // Her puddle: a soft uneven pool, rings spreading round her boots, the boots' blue in the water.
  for (const [x, y, rx, ry, col] of [[CX - 6, G - 2, 40, 5.4, c.waterDk], [CX + 12, G - 1.6, 34, 5, c.waterDk], [CX - 6, G - 2.6, 38, 4.4, c.water], [CX + 12, G - 2.2, 32, 4, c.water]]) out.push(F(E(x, y, rx, ry, col)));
  out.push(F(E(CX - 14, G - 3.4, 20, 1.8, c.waterLt)), F(E(CX + 22, G - 2.6, 12, 1.4, c.waterLt)));
  for (const x of [CX - 9, CX + 8]) {
    out.push(F(E(x + 3, G - 1.4, 9, 1.4, c.bootSh)));
    out.push(...band(curve(ovalPts(x + 3, G - 2, 15, 3.2, 0, 0.25, Math.PI - 0.25, 6), 2), 0.9, 0.9, '#ffffff', true));
  }

  // The lily-pad umbrella over her far shoulder: tipped back, its notch to the front, a thick
  // dark underside, a light rim on the top edge, veins from the middle, two rain beads sitting on
  // it, drips running off. Its stem down behind her to her far hand, curling at the end.
  const hd = kidHead(CX + 2, 86, mood, c, 'fluffybob', c.hair, 'heavy');
  use('umbrella');
  const uc = [CX - 28, 40];
  const ua = -0.32;
  out.push(...band(curve([[uc[0] + 2, uc[1] + 4], [CX - 30, 70], [CX - 24, 104], [CX - 21, 110], [CX - 17, 110]], 4), 3.6, 2.6, c.padSh));
  out.push(oval(uc[0], uc[1] + 4.4, 50, 15, ua, c.padDk));
  const notch = -Math.PI / 2 + 0.9;
  out.push(T([[...uc], ...ovalPts(uc[0], uc[1], 50, 15, ua, notch + 0.2, notch + Math.PI, 12)], c.pad));
  out.push(T([[...uc], ...ovalPts(uc[0], uc[1], 50, 15, ua, notch + Math.PI, notch + Math.PI * 2 - 0.2, 12)], c.pad));
  out.push(F(T([[...uc], ...ovalPts(uc[0], uc[1], 50, 15, ua, 0.3, Math.PI - 0.3, 10)], c.padSh)));
  for (let k = 0; k < 7; k++) {
    const t = notch + 0.6 + k * 0.78;
    const [ex, ey] = ovalPts(uc[0], uc[1], 42, 12, ua, t, t, 1)[0];
    const mid = [(uc[0] + ex) / 2, (uc[1] + ey) / 2 - 1.4];
    out.push(...band(curve([[uc[0], uc[1]], mid, [ex, ey]], 3), 1.3, 0.5, c.padLt, true));
  }
  out.push(...band(curve(ovalPts(uc[0], uc[1], 48.6, 13.8, ua, Math.PI + 0.25, notch - 0.12, 8), 2), 1.6, 1.6, c.padLt, true));
  out.push(F(E(uc[0] - 12, uc[1] - 4, 12, 2.6, c.padLt)));
  for (const [x, y, r] of [[uc[0] - 22, uc[1] + 3, 2.8], [uc[0] + 12, uc[1] - 1, 2.1]]) out.push(E(x, y, r, r * 0.84, c.waterLt), F(E(x + r * 0.4, y + r * 0.4, r * 0.5, r * 0.3, c.water)), F(E(x - r * 0.3, y - r * 0.3, r * 0.34, r * 0.26, '#ffffff')));
  for (const [x, y, r] of [[CX - 74, 56, 2.6], [CX - 66, 70, 2], [CX + 18, 32, 2.2]]) {
    out.push(E(x, y, r, r * 1.2, c.water), T([[x - r * 0.9, y - r * 0.4], [x, y - r * 2.6], [x + r * 0.9, y - r * 0.4]], c.water), F(E(x - r * 0.3, y - r * 0.2, r * 0.3, r * 0.4, '#ffffff')));
  }

  use('hood');
  // The hood, bunched behind her neck, its rim showing.
  out.push(E(CX - 12, 88, 16, 9, c.coatSh), E(CX - 12, 87, 14, 7, c.coat), F(E(CX - 12, 88.4, 9, 3.4, c.coatDk)));

  use('hairBack');
  // The back of her hair.
  out.push(...hd.back);

  use('farArm');
  // Far arm, up to the umbrella's stem.
  out.push(...band([[CX - 12, 92], [CX - 20, 100]], 9, 8.4, c.coatSh), ...mitten(CX - 23, 103, -2, SKIN_SH));
  out.push(...band([[CX - 27, 100], [CX - 19, 101]], 3.6, 3.6, c.padSh));

  // Boots: round and shiny; a dark sole, a fold-over cuff, a pull tab at the back, a shine down the
  // shaft and on the toe.
  const boot = (x, far) => {
    const bc = far ? c.bootSh : c.boot;
    const lt = far ? c.boot : c.bootLt;
    out.push(E(x - 6, G - 25, 2.4, 2.8, far ? c.bootDk : c.bootSh));
    out.push(T([[x - 6.6, G - 22], [x + 6.6, G - 22], [x + 7.4, G - 8], [x - 7.4, G - 8]], bc));
    out.push(E(x + 3, G - 5, 11, 6, c.bootDk), E(x + 3, G - 6.4, 11, 6, bc));
    out.push(F(E(x + 7, G - 9, 3.6, 1.6, lt)), F(E(x + 8.6, G - 9.6, 1.2, 0.7, '#ffffff')));
    out.push(...band([[x - 7.6, G - 21], [x + 7.6, G - 21]], 3.4, 3.4, lt), ...band([[x - 7.4, G - 19], [x + 7.4, G - 19]], 0.9, 0.9, far ? c.bootDk : c.bootSh, true));
    out.push(F(T([[x - 4.4, G - 17.6], [x - 2, G - 17.6], [x - 2.8, G - 10], [x - 4.8, G - 10]], lt)));
  };
  use('bootF');
  boot(CX - 9, true);
  use('bootN');
  boot(CX + 8, false);
  use('puddle');
  for (const [x, y, r] of [[CX + 30, G - 10, 1.8], [CX + 35, G - 15, 1.3], [CX - 30, G - 9, 1.6], [CX - 34, G - 14, 1.1]]) out.push(F(E(x, y, r, r, c.waterLt)));

  use('body');
  // The raincoat: roomy, swinging out to a rounded hem above the boots; the shadow side, two soft
  // folds, a lit edge, the placket with three big buttons, two flapped pockets, a stitched hem.
  const coat = [[CX - 12, 84], [CX + 13, 84], [CX + 17, 102], [CX + 21, 122], [CX + 20, 127], [CX + 11, 129], [CX, 129.6], [CX - 11, 129], [CX - 20, 127], [CX - 21, 122], [CX - 17, 102]];
  out.push(T(coat, c.coat));
  out.push(F(T([[CX - 12, 86], [CX - 6, 86], [CX - 10, 129], [CX - 11, 129], [CX - 20, 127], [CX - 21, 122], [CX - 16, 103]], c.coatSh)));
  out.push(...band(curve([[CX - 4, 104], [CX - 7, 116], [CX - 8, 128]], 3), 1, 2.4, c.coatSh, true));
  out.push(...band(curve([[CX + 13, 106], [CX + 15, 116], [CX + 16, 127]], 3), 0.8, 2, c.coatSh, true));
  out.push(...band(curve([[CX + 12, 87], [CX + 16, 103], [CX + 19, 123]], 3), 1.8, 1.8, c.coatLt, true));
  out.push(...band(curve([[CX - 20, 124], [CX - 10, 126.4], [CX, 127], [CX + 10, 126.4], [CX + 20, 124]], 2), 2.6, 2.6, c.coatSh, true));
  for (let k = 0; k < 9; k++) out.push(F(E(CX - 17 + k * 4.25, 122.4 + Math.abs(k - 4) * -0.26 + (k === 0 || k === 8 ? -0.6 : 0), 1, 0.5, c.coatLt)));
  out.push(...band([[CX + 3, 88], [CX + 4, 127]], 1.2, 1.2, c.coatDk, true));
  for (let k = 0; k < 3; k++) out.push(F(E(CX + 8, 94 + k * 11, 3, 3, c.coatDk)), F(E(CX + 8, 93.6 + k * 11, 2.6, 2.6, '#ffffff')), F(E(CX + 7.2, 92.8 + k * 11, 0.9, 0.9, c.bootLt)));
  for (const x of [-16, 8]) {
    out.push(F(T([[CX + x, 109], [CX + x + 8, 109], [CX + x + 8, 120], [CX + x + 1, 120.6]], x < 0 ? c.coatDk : c.coatSh)));
    out.push(F(T([[CX + x - 0.6, 107.6], [CX + x + 8.6, 107.6], [CX + x + 8, 112], [CX + x, 112]], x < 0 ? c.coatSh : c.coat)), F(T([[CX + x, 111.4], [CX + x + 8, 111.4], [CX + x + 8, 112.4], [CX + x, 112.4]], c.coatDk)));
    out.push(F(E(CX + x + 4, 111, 1.2, 1.2, '#ffffff')));
  }
  // The collar: two round flaps under her chin, the chin's soft shadow on them.
  out.push(oval(CX - 6, 86, 8, 4.4, 0.25, c.coatLt), oval(CX + 8, 86, 8, 4.4, -0.25, c.coatLt));
  out.push(F(E(CX + 3, 85.6, 13, 2.6, c.coatSh)));

  use('head');
  out.push(...hd.front);

  use('nearArm');
  // Near arm: held out, palm up, catching the rain; the sleeve's underside in shadow, a cuff.
  out.push(...band(curve([[CX + 12, 92], [CX + 22, 98], [CX + 30, 94]], 3), 9.6, 8.4, c.coat));
  out.push(...band(curve([[CX + 14, 96.6], [CX + 22, 101.4], [CX + 28, 98.4]], 3), 2, 1.6, c.coatSh, true));
  out.push(...band([[CX + 27.6, 91.6], [CX + 31, 97.6]], 3, 3, c.coatLt), ...band([[CX + 29.2, 91.2], [CX + 32.4, 97]], 0.8, 0.8, c.coatDk, true));
  out.push(...mitten(CX + 35, 92, -0.4, SKIN), F(E(CX + 34, 93.6, 2.4, 1.4, SKIN_SH)));
  out.push(E(CX + 37, 82, 1.8, 2.2, c.water), T([[CX + 35.4, 81.2], [CX + 37, 76.6], [CX + 38.6, 81.2]], c.water), F(E(CX + 36.4, 81.6, 0.6, 0.8, '#ffffff')));

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

// ---------- The Blossom Fairy ----------

const FAI = {
  hair: '#c8b0f4', hairSh: '#a68adc', hairDk: '#7a5eb4', hairLt: '#ece4ff',
  iris: '#e85a8a', irisDk: '#9a2a5a', irisLt: '#ffc8dc',
  bell: '#ff9ec4', bellSh: '#e878a4', bellDk: '#c4507e', bellLt: '#ffd4e4',
  wing: '#ffe2f0', wingRim: '#f6a8cc', wingFar: '#eab6d6', wingIn: '#fffafd', wingSpot: '#ff9ec4',
  leaf: '#7ccc6a', leafSh: '#58a852', leafLt: '#b4ec96',
  rose: '#ff7eae', roseSh: '#e0548a', roseLt: '#ffc0d8',
  puff: '#ffffff', puffSh: '#e8eef6', gold: '#fff2a0',
};

function blossomFairy(mood) {
  const c = FAI;
  const { G: parts, use, out } = groups();
  const hx = CX + 2;
  const hy = 50;

  // Wings: butterfly-petal wings from between her shoulders, the far pair peeking past the near.
  // Each: a rosy rim, the pale wing, a bright heart toward the root, veins, rosy eyespots toward
  // the tip with a light in each, a dusting of gold.
  const root = [CX - 6, 88];
  const wing = (a, len, w, far) => {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const at = (u, v) => [root[0] + ca * len * u - sa * w * v, root[1] + sa * len * u + ca * w * v];
    const m = at(0.56, 0);
    out.push(oval(m[0], m[1], len * 0.56, w * 0.5, a, far ? c.wingFar : c.wingRim));
    out.push(F(oval(...at(0.53, 0), len * 0.5, w * 0.42, a, far ? c.bellLt : c.wing)));
    out.push(F(oval(...at(0.36, 0), len * 0.3, w * 0.24, a, c.wingIn)));
    for (const v of [-0.28, 0, 0.28]) out.push(...band(curve([root, at(0.5, v * 0.7), at(0.9, v)], 3), 1, 0.4, far ? c.wingFar : c.wingRim, true));
    out.push(F(E(...at(0.8, 0.16), w * 0.12, w * 0.12, c.wingSpot)), F(E(...at(0.8, 0.16), w * 0.05, w * 0.05, '#ffffff')));
    out.push(F(E(...at(0.74, -0.24), w * 0.08, w * 0.08, c.wingSpot)));
    for (const [u, v] of [[0.62, 0.3], [0.92, -0.1], [0.5, -0.3]]) out.push(F(E(...at(u, v), 0.9, 0.9, c.gold)));
  };
  use('wingFU');
  wing(-2.2, 52, 34, true);
  use('wingFL');
  wing(2.35, 34, 22, true);
  use('wingNU');
  wing(-2.75, 64, 42, false);
  use('wingNL');
  wing(2.85, 42, 28, false);

  // The back of her hair.
  const hd = kidHead(CX + 2, 83, mood, c, 'odango', c.hair);
  use('tails');
  out.push(...hd.hang);
  use('hairBack');
  out.push(...hd.backHead);

  use('farArm');
  // Far arm: back and out a little, the hand open.
  out.push(...band([[CX - 8, 90], [CX - 20, 100]], 7, 6.4, SKIN_SH), ...mitten(CX - 23, 102, 2.4, SKIN_SH, 4.8));

  // Legs: short and dangling from under the skirt, the near one kicked back, toes pointed; little
  // leaf slippers curling up at the toe, a vein down each.
  const leg = (hip, foot, far) => {
    const sc = far ? SKIN_SH : SKIN;
    out.push(...band([hip, foot], 8.4, 7.4, sc));
    const lc = far ? c.leafSh : c.leaf;
    out.push(oval(foot[0] + 2, foot[1] + 2, 7, 4.4, 0.5, lc));
    out.push(...band(curve([[foot[0] + 7, foot[1] + 5], [foot[0] + 11, foot[1] + 4], [foot[0] + 11, foot[1]]], 2), 2.6, 1.4, lc));
    out.push(...band([[foot[0] - 2, foot[1] + 0.4], [foot[0] + 7, foot[1] + 4.6]], 0.8, 0.5, far ? c.leafSh : c.leafSh, true));
    out.push(F(E(foot[0] + 1, foot[1] + 0.2, 3, 1.3, far ? c.leaf : c.leafLt)));
  };
  use('legF');
  leg([CX - 5, 112], [CX - 8, 132], true);
  use('legN');
  leg([CX + 5, 112], [CX + 1, 137], false);

  use('body');
  // The bellflower skirt: the bell, then five round-pointed petals at the hem flaring out, the
  // outer ones curling most; a dark vein up each petal, the tips catching the light.
  out.push(T([[CX - 9, 96], [CX + 9, 96], [CX + 18, 112], [CX - 18, 112]], c.bell));
  out.push(F(T([[CX - 9, 96], [CX - 4, 96], [CX - 11, 112], [CX - 18, 112]], c.bellSh)));
  for (let k = 0; k < 5; k++) {
    const x = CX - 16 + k * 8;
    const a = Math.PI / 2 + (k - 2) * -0.3;
    const col = k === 0 ? c.bellSh : k === 3 ? c.bellLt : c.bell;
    out.push(petal(x, 104, a, 19, 12, col));
    const tip = [x + Math.cos(a) * 16, 104 + Math.sin(a) * 16];
    out.push(...band([[x + Math.cos(a) * 4, 104 + Math.sin(a) * 4], tip], 1, 0.5, c.bellDk, true));
    out.push(F(E(tip[0] - 1, tip[1] - 1, 3, 1.6, k === 0 ? c.bell : c.bellLt)));
  }
  out.push(F(T([[CX + 4, 98], [CX + 7, 98], [CX + 13, 110], [CX + 9, 111]], c.bellLt)));
  // The bodice: a little rounded top of the same petal, a sweetheart neckline, a ring of sepal
  // leaves at the waist with a tiny rosebud at the front.
  out.push(T([[CX - 8, 83], [CX + 8, 83], [CX + 9.5, 98], [CX - 9.5, 98]], c.bell), E(CX - 3.4, 83, 5, 3, c.bell), E(CX + 4, 83, 5, 3, c.bell));
  out.push(F(T([[CX - 8, 84], [CX - 4, 84], [CX - 6, 97], [CX - 9.5, 97]], c.bellSh)), F(T([[CX + 3, 84], [CX + 6.5, 84], [CX + 7.5, 96], [CX + 4.5, 96]], c.bellLt)));
  out.push(...band([[CX + 0.6, 82.6], [CX + 0.6, 86]], 0.9, 0.5, c.bellDk, true));
  for (let k = 0; k < 5; k++) out.push(petal(CX - 11 + k * 5.5, 96, Math.PI / 2 + (k - 2) * 0.32, 8, 5, k % 2 ? c.leaf : c.leafSh));
  out.push(E(CX + 6, 96, 2.6, 2.3, c.rose), F(E(CX + 5.4, 95.4, 1.2, 0.9, c.roseLt)), ...band(curve([[CX + 4.6, 96.4], [CX + 6, 97.2], [CX + 7.4, 96]], 2), 0.7, 0.7, c.roseSh, true));
  out.push(F(E(CX + 2, 84.4, 7, 1.6, c.bellSh)));

  use('head');
  out.push(...hd.front);

  use('nearArm');
  // Near arm: raised, holding her dandelion-puff wand out in front.
  const hand = [CX + 30, 92];
  out.push(...band(curve([[CX + 8, 88], [CX + 20, 96], hand], 3), 7.4, 6.4, SKIN), ...band(curve([[CX + 11, 91.6], [CX + 20, 99]], 2), 1.4, 1, SKIN_SH, true));
  out.push(...band(curve([[hand[0] + 1, hand[1] + 3], [CX + 38, 76], [CX + 44, 62]], 3), 2, 1.6, c.leafSh), ...band([[hand[0] + 2, hand[1]], [CX + 41, 70]], 0.6, 0.6, c.leafLt, true));
  out.push(...mitten(hand[0], hand[1], -0.9, SKIN, 5));
  const pf = [CX + 46, 56];
  out.push(F(E(pf[0], pf[1], 12, 12, '#fffdf2')));
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    out.push(...band([pf, [pf[0] + Math.cos(a) * 11, pf[1] + Math.sin(a) * 11]], 0.7, 0.5, c.puffSh, true), F(E(pf[0] + Math.cos(a) * 11.6, pf[1] + Math.sin(a) * 11.6, 1.6, 1.6, c.puff)));
  }
  out.push(E(pf[0], pf[1], 4, 4, c.puff), F(E(pf[0] + 1, pf[1] + 1, 2.4, 2.4, c.puffSh)));
  for (const [x, y] of [[CX + 61, 43], [CX + 66, 61], [CX + 58, 30]]) out.push(F(E(x, y, 1.4, 1.4, c.puff)), ...band([[x, y], [x - 3, y + 3]], 0.5, 0.5, c.puffSh, true));

  use('twinkles');
  // Twinkles round her: fairy dust.
  for (const [x, y, r] of [[CX - 52, 112, 4], [CX + 34, 120, 3.4], [CX - 30, 30, 3], [CX + 52, 96, 2.6]]) out.push(...twinkle(x, y, r, c.gold));

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

export function gladeKidShapes(kind = 'puddle', mood = 'idle') {
  return kind === 'fairy' ? blossomFairy(mood) : puddleKid(mood);
}

// The box, and the joints the rig turns each part about (in the drawing's units; the feet, or for
// the fairy the point under her hover, at (CX, G)).
export const KID_BOX = { W, H, CX, G };
export const KID_JOINTS = {
  puddle: { hip: [CX, 104], neck: [CX + 2, 86], shF: [CX - 12, 92], shN: [CX + 12, 92], grip: [CX - 23, 103], ankF: [CX - 9, G - 12], ankN: [CX + 8, G - 12], palm: [CX + 36, 88] },
  fairy: { hip: [CX, 100], neck: [CX + 2, 83], shF: [CX - 8, 90], shN: [CX + 8, 88], wing: [CX - 6, 88], hipF: [CX - 5, 112], hipN: [CX + 5, 112], puff: [CX + 46, 56] },
};
export { mapShape };
