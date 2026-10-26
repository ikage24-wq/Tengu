// Hairstyles, drawn the way the CocoPPa Play / SELFY references do it (docs/art/research/avatar.md)
// and shrunk to sprite size:
//   - the top and bangs are ONE outline (the "inverted dome") whose lower edge is cut into clumps:
//     blunt, wispy, swept or parted, with a shadow crease rising from each notch;
//   - long hair, tails and side locks are LOCKS: tapered ribbons built along a spine, so the whole
//     lock bends as it swings instead of shearing; their ends split into points or turn in a curl;
//   - shapes made of the hair itself (buns, cat-ear buns, a bow, braids, drills), never accessories;
//   - shine as one ring on the crown plus streaks running down the flow;
//   - optional two-tone: the lower part of every lock fades through a blend band into a tip colour.
//
// Motion: every hanging point follows the hair spring (root and tip, the tip a beat behind), plus
// a slow breeze that travels down the hair (`wave`, 8 phases), so long hair ripples instead of
// swinging stiffly. Front locks lag a little more than the hair behind, drills stretch and bounce,
// and the bangs flutter at their tips.
//
// Coordinates are the hero's head space: skull centre (15.5, 14.6), facing right, chin near y 25.
import { R, E, T, F } from './pixel.js';

const HX = 15.5;
const CY = 13.2;

// New styles are added one at a time as each is approved.
export const HAIR_STYLES = ['candy', 'drills', 'sidetail', 'catbun', 'princess', 'bowhair', 'hime', 'crownbraid', 'odango', 'wolf', 'swoop'];
// Any style that no longer exists (older saves) draws as the first one.
export const hairStyleOf = (look) => (HAIR_STYLES.includes(look.hairStyle) ? look.hairStyle : HAIR_STYLES[0]);
// Styles whose long fringe hides the near eye and brow.
export const coversEye = (style, bangs = 'auto') => bangs === 'peek' || ((!bangs || bangs === 'auto') && style === 'swoop');

// ---------- Geometry ----------

const P = (x, y) => [x, y, 1]; // a sharp point, kept crisp when an outline is smoothed
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fx = (pts) => pts.map(([x, y, s]) => (s ? [31 - x, y, s] : [31 - x, y])); // mirror across the face
// Points along the skull's hair line from angle a0 to a1 (degrees; 0 = right, 90 = down).
const dome = (a0, a1, n = 12, rx = 12, ry = 11.2, cy = CY) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [HX + rx * Math.cos(a), cy + ry * Math.sin(a)];
});
// Rounds every corner of a closed outline except the sharp points (corner cutting, 3 passes).
function smooth(pts, passes = 3) {
  let p = pts;
  for (let k = 0; k < passes; k++) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      if (a[2]) out.push(a);
      if (!(a[2] && b[2])) out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    p = out;
  }
  return p;
}
// The same for an open line (a lock's spine): the ends stay put.
function smoothOpen(pts, passes = 2) {
  let p = pts;
  for (let k = 0; k < passes; k++) {
    const out = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i];
      const b = p[i + 1];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}
// Extra points along each edge, so a moving outline bends smoothly.
function dense(pts, step = 1.4) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    out.push(a);
    for (let k = 1; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}
const poly = (pts, c) => F(T(pts.map(([x, y]) => [x, y]), c));
const ellipsePts = (cx, cy, rx, ry, n = 20) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * Math.PI * 2), cy + ry * Math.sin((i / n) * Math.PI * 2)]);

// ---------- Motion ----------

// Moves a point by the hair's motion `m` ({ root, tip, lift, wave }): nothing above `top`, easing
// in over `len` below it. `k` scales the swing (front locks a little more, so they trail the rest).
function mover(m, k = 1, top = 12, len = 24) {
  if (!m) return (p) => p;
  const ph = ((m.wave ?? 0) * Math.PI) / 4;
  return ([x, y, s]) => {
    const u = clamp((y - top) / len, 0, 1);
    const b = u * u * (3 - 2 * u);
    const fan = 1 + 0.22 * Math.min(1, Math.abs(x - HX) / 12);
    const breeze = Math.sin(ph - y * 0.24);
    const dx = ((m.root * b + (m.tip - m.root) * b * b) * fan + 0.55 * b * breeze) * k;
    const dy = (-Math.abs(m.tip - m.root) * 0.3 * b * b + 0.22 * b * Math.cos(ph - y * 0.24)) * k + (y >= 22 ? m.lift ?? 0 : 0);
    return s ? [x + dx, y + dy, s] : [x + dx, y + dy];
  };
}
// A smooth closed mass that bends with the motion.
const mass = (pts, c, m, k = 1) => poly(dense(smooth(pts)).map(mover(m, k)), c);

// A lock: a tapered ribbon along a spine (root first), `w` wide at the root, narrowing to a point
// (or to `w1` of its width). The spine moves with the hair before the ribbon is built, so the
// lock curves as it swings.
function lock(spine, w, c, m, k = 1, w1 = 0) {
  const sp = smoothOpen(spine.map(mover(m, k)), 3);
  const n = sp.length;
  const L = [];
  const R = [];
  for (let i = 0; i < n; i++) {
    const a = sp[Math.max(0, i - 1)];
    const b = sp[Math.min(n - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const t = i / (n - 1);
    const half = (w / 2) * (w1 + (1 - w1) * (1 - t) ** 0.75);
    L.push([sp[i][0] - ((b[1] - a[1]) / len) * half, sp[i][1] + ((b[0] - a[0]) / len) * half]);
    R.push([sp[i][0] + ((b[1] - a[1]) / len) * half, sp[i][1] - ((b[0] - a[0]) / len) * half]);
  }
  return poly([...L, ...R.reverse()], c);
}
// A thin shine streak along the flow: pointed at both ends, `w` wide in the middle.
function streak(x0, y0, x1, y1, w, bow, c, m, k = 1) {
  const mv = mover(m, k);
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [nx, ny] = [-(y1 - y0) / len, (x1 - x0) / len];
  const mx = (x0 + x1) / 2 + nx * bow;
  const my = (y0 + y1) / 2 + ny * bow;
  return poly(smooth([P(x0, y0), [mx + nx * w * 0.5, my + ny * w * 0.5], P(x1, y1), [mx - nx * w * 0.5, my - ny * w * 0.5]]).map(mv), c);
}
// The shadow crease that rises from a notch between two clumps.
const crease = (x, y, len, c, tilt = 0) => F(T([[x - 0.55, y + 0.2], [x + 0.55, y + 0.2], [x + tilt, y - len]], c));

// ---------- Pieces made of hair ----------

// The angel ring: one highlight band following the skull, in a few pieces with a soft zigzag edge.
function ring(c, cx = HX, cy = 9.6, rx = 8.6, ry = 5.2, a0 = 214, a1 = 326, parts = 3) {
  const out = [];
  const gap = 7;
  const span = (a1 - a0 - gap * (parts - 1)) / parts;
  for (let k = 0; k < parts; k++) {
    const s0 = a0 + k * (span + gap);
    const top = [];
    const bot = [];
    for (let i = 0; i <= 6; i++) {
      const a = ((s0 + (span * i) / 6) * Math.PI) / 180;
      const d = 1.25 * (i === 0 || i === 6 ? 0.3 : i % 2 ? 1.1 : 0.65);
      top.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
      bot.push([cx + (rx - d) * Math.cos(a), cy + (ry - d) * Math.sin(a)]);
    }
    out.push(poly([...top, ...bot.reverse()], c));
  }
  return out;
}
// A bun of hair: a round knot with one spiral turn and a shine.
const bun = (x, y, rx, ry, r, dir = 1) => [
  F(E(x, y, rx, ry, r.base)),
  poly(smooth([[x - rx * 0.7 * dir, y + ry * 0.1], [x - rx * 0.2 * dir, y - ry * 0.75], [x + rx * 0.7 * dir, y - ry * 0.3], [x + rx * 0.3 * dir, y - ry * 0.1], [x - rx * 0.2 * dir, y - ry * 0.35]]), r.sh1),
  streak(x - rx * 0.55 * dir, y - ry * 0.55, x - rx * 0.1 * dir, y - ry * 0.9, 0.8, 0.3 * dir, r.hi),
];
// A bow tied out of the hair: two rounded loops, each with a dark hollow, and a knot.
function hairBow(x, y, s, r) {
  const loop = (dir) => [
    poly(smooth([[x, y - 0.6 * s], [x + 2.4 * s * dir, y - 2.6 * s], P(x + 5.4 * s * dir, y - 2.2 * s), [x + 5.2 * s * dir, y + 0.6 * s], P(x + 4 * s * dir, y + 2.2 * s), [x + 1.4 * s * dir, y + 1 * s]]), r.base),
    poly(smooth([[x + 1.6 * s * dir, y - 0.4 * s], [x + 3.6 * s * dir, y - 1.2 * s], [x + 4.2 * s * dir, y + 0.4 * s], [x + 2.6 * s * dir, y + 0.4 * s]]), r.sh2),
    streak(x + 1.6 * s * dir, y - 1.4 * s, x + 4.4 * s * dir, y - 2 * s, 0.7, -0.4 * dir, r.hi),
  ];
  return [...loop(-1), ...loop(1), F(E(x, y, 1.5 * s, 1.4 * s, r.sh1)), F(E(x, y - 0.2 * s, 1.1 * s, 0.9 * s, r.base))];
}
// A plait along a spine: knots that lean one way then the other, each tucked under the one above,
// moving with the hair.
function plait(spine, w, r, m, k = 1, c = r.base) {
  const sp = smoothOpen(spine.map(mover(m, k)), 2);
  const total = sp.reduce((s, p, i) => s + (i ? Math.hypot(p[0] - sp[i - 1][0], p[1] - sp[i - 1][1]) : 0), 0);
  const at = (d) => {
    let acc = 0;
    for (let i = 1; i < sp.length; i++) {
      const seg = Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]);
      if (acc + seg >= d) {
        const t = (d - acc) / (seg || 1);
        const [ax, ay] = sp[i - 1];
        const [bx, by] = sp[i];
        const l = seg || 1;
        return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, tx: (bx - ax) / l, ty: (by - ay) / l };
      }
      acc += seg;
    }
    const a = sp[sp.length - 2];
    const b = sp[sp.length - 1];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return { x: b[0], y: b[1], tx: (b[0] - a[0]) / l, ty: (b[1] - a[1]) / l };
  };
  const step = w * 0.62;
  const n = Math.max(2, Math.floor(total / step));
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = at((i + 0.5) * step);
    const half = (w / 2) * (1 - (i / n) * 0.35);
    const side = i % 2 ? 1 : -1;
    const [nx, ny] = [-p.ty, p.tx];
    // One knot: a leaf leaning across the braid, its lower edge in shadow.
    const a = [p.x + nx * half * side - p.tx * step * 0.6, p.y + ny * half * side - p.ty * step * 0.6];
    const b = [p.x - nx * half * side + p.tx * step * 0.55, p.y - ny * half * side + p.ty * step * 0.55];
    const o1 = [p.x + nx * half * 0.2 - p.tx * half * 0.4, p.y + ny * half * 0.2 - p.ty * half * 0.4];
    out.push(poly(smooth([[a[0], a[1]], [p.x - nx * half, p.y - ny * half], P(b[0], b[1]), [p.x + nx * half, p.y + ny * half]]), c));
    out.push(poly([[o1[0], o1[1]], [b[0], b[1]], [(b[0] + p.x) / 2 + p.tx * 0.5, (b[1] + p.y) / 2 + p.ty * 0.5]], r.sh1));
  }
  const end = at(n * step);
  out.push(lock([[end.x, end.y], [end.x + end.tx * 1.8, end.y + end.ty * 1.8], [end.x + end.tx * 3.6 + 0.4, end.y + end.ty * 3.6]], w * 0.7, c, null));
  out.push(F(E(end.x, end.y, w * 0.32, w * 0.2, r.sh2)));
  return out;
}
// A drill curl: a stack of coils that shrink downward, each with a dark turn line, stretching and
// bouncing a little with the hair.
function drill(x, y, n, r0, dir, r, m, k = 1) {
  const mv = mover(m, k);
  const ph = ((m?.wave ?? 0) * Math.PI) / 4;
  const stretch = 1 + 0.07 * Math.sin(ph);
  const out = [];
  for (let i = 0; i < n; i++) {
    const rr = r0 * (1 - i * 0.09);
    const [cx, cy] = mv([x + (i % 2 ? 0.45 : -0.45) * dir, y + i * 3.7 * stretch]);
    out.push(poly(smooth([[cx - rr, cy - 0.4], [cx - rr * 0.4, cy - rr * 0.78], [cx + rr * 0.6, cy - rr * 0.7], [cx + rr, cy + 0.2], [cx + rr * 0.4, cy + rr * 0.8], [cx - rr * 0.6, cy + rr * 0.7]]), r.sh1));
    out.push(poly(smooth([[cx - rr * 0.85, cy + 0.2], [cx, cy + rr * 0.72], [cx + rr * 0.85, cy - 0.1], [cx, cy + rr * 0.3]]), r.sh2));
    out.push(streak(cx - rr * 0.5 * dir, cy - rr * 0.5, cx + rr * 0.2 * dir, cy - rr * 0.6, 0.7, 0.2, r.base));
  }
  const [ex, ey] = mv([x, y + n * 3.7 * stretch - 1.4]);
  out.push(lock([[ex, ey - 1], [ex + 0.6 * dir, ey + 1.2], [ex - 0.4 * dir, ey + 2.6]], 2.6, r.sh1, null));
  return out;
}
// Long hair hanging behind: a sheet from the crown down to `len`, `flare` wide (half-width) at the
// bottom, its sides rippling by `wave`, and its ends cut as points, curls or a level line.
function sheet({ len, flare = 13, wave = 0, ends = 'points', n = 3, top = 13, w0 = 11.4 }, r, m, k = 1) {
  const c = r.sh1;
  const left = [];
  const right = [];
  const steps = Math.max(3, Math.round((len - top) / 3.5));
  const foot = len - (ends === 'curls' ? 2.4 : 3.6);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = top + (foot - top) * t;
    const hw = w0 + (flare - w0) * Math.sin((t * Math.PI) / 2);
    const wv = wave * Math.sin(t * Math.PI * 2.4) * t;
    left.push([HX - hw + wv, y]);
    right.push([HX + hw + wv, y]);
  }
  const x0 = HX - flare;
  const x1 = HX + flare;
  const bottom = [];
  const extra = [];
  if (ends === 'points') {
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const lift = i === 0 || i === n ? -1.2 : (i % 2 ? 0.8 : 0);
      bottom.push(P(x + (i === 0 ? 0.6 : i === n ? -0.6 : 0), len + lift));
      if (i < n) {
        const nx = x + (x1 - x0) / n / 2;
        bottom.push(P(nx, len - 3.4));
        extra.push(crease(nx, len - 3.4, 5.4, r.sh2, 0));
      }
    }
  } else if (ends === 'curls') {
    // Each end turns in a round curl: a lobe that swells below the hem, deep notches between
    // them, and a dark spiral inside each.
    for (let i = 0; i < n; i++) {
      const xa = x0 + ((x1 - x0) * i) / n;
      const xb = x0 + ((x1 - x0) * (i + 1)) / n;
      const cx = (xa + xb) / 2;
      const rr = (xb - xa) / 2;
      const dir = cx < HX ? -1 : 1;
      const out = i === 0 || i === n - 1 ? 0.8 : 0;
      bottom.push([xa + rr * 0.05 - (i === 0 ? out : 0), len - 2.2], [xa + rr * 0.3 - (i === 0 ? out : 0), len + 0.6], [cx, len + 1.6], [xb - rr * 0.3 + (i === n - 1 ? out : 0), len + 0.6], [xb - rr * 0.05 + (i === n - 1 ? out : 0), len - 2.2]);
      if (i < n - 1) bottom.push(P(xb, len - 3.8));
      extra.push(poly(smooth([[cx - rr * 0.75 * dir, len - 1.6], [cx - rr * 0.2 * dir, len + 0.9], [cx + rr * 0.7 * dir, len + 0.2], [cx + rr * 0.3 * dir, len - 0.8], [cx - rr * 0.1 * dir, len - 0.2]]), r.sh2));
      if (i < n - 1) extra.push(crease(xb, len - 3.8, 4, r.sh2, 0));
    }
  } else {
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      bottom.push(P(x, len));
      if (i < n) bottom.push(P(x + (x1 - x0) / n / 2 - 0.5, len), P(x + (x1 - x0) / n / 2, len - 1.2), P(x + (x1 - x0) / n / 2 + 0.5, len));
    }
  }
  // Lighter streaks run down the flow near each side, so the sheet reads as hair, not cloth.
  for (const dir of [-1, 1]) {
    const xa = HX + dir * (w0 - 2.2);
    const xb = HX + dir * (flare - 2.8);
    extra.push(streak(xa, top + 3, xb + wave * 0.6, foot - 2.4, 1.3, -0.9 * dir, r.base));
    extra.push(streak(xa - dir * 3.4, top + 6, xb - dir * 3.6, foot - 4, 0.9, -0.5 * dir, r.base));
  }
  const out = [mass([...left, ...bottom, ...right.reverse()], c, m, k)];
  const mv = mover(m, k);
  for (const e of extra) out.push({ ...e, pts: e.pts.map(mv) });
  return out;
}
const crown = (r, big = 0) => F(E(HX, 13.2 - big * 0.4, 12 + big, 11.2 + big, r.sh1));
// Darker hair behind the neck, showing between the long locks.
const napeShadow = (r, y = 20) => F(E(HX, y, 9.6, 4.4, r.sh2));

// ---------- Bangs ----------

// The lower edge of the bangs, from the near temple across to the far one: tips and notches.
const FRINGES = {
  // A few big rounded clumps of different lengths, the middle one longest.
  soft: { pts: [[23.8, 13], [22.2, 10.4], [20.4, 15.4], [18.2, 10.8], [15.6, 16.8], [13, 10.8], [10.6, 15.2], [8.8, 10.6], [7.2, 13.2]], lean: 0.9 },
  // Blunt: one heavy straight cut low on the brow, with tiny V notches.
  blunt: { pts: [[23.6, 14.8], [22.9, 13.9], [22.2, 14.9], [18.9, 15], [18.3, 14], [17.7, 15], [13.4, 15], [12.8, 14], [12.2, 15], [8.9, 14.9], [8.3, 13.9], [7.6, 14.8]], lean: 0, blunt: true },
  // Wispy: soft separate strands of uneven length with rounded tips, a little forehead showing
  // between them.
  wispy: { pts: [[23.8, 13.4], [22.4, 10.8], [20.6, 15], [19, 11], [16.8, 15.8], [15.2, 11.2], [13, 15.4], [11.4, 11], [9.4, 14.6], [8, 11.6], [7, 13.2]], lean: -0.4, softTips: true },
  // Swept: a strong diagonal from high on the near side down past the far eye.
  swept: { pts: [[23.4, 10.4], [22.2, 8.6], [20.4, 12.2], [19, 9.8], [16.6, 14.4], [15.4, 11.6], [12.6, 16.4], [11.8, 13.2], [9, 17.6], [8.4, 14.6], [6.6, 16.8]], lean: -1.4, part: [[22.6, 2.6], [24.6, 6.6]] },
  // Parted in the middle, curving apart to open a triangle of forehead.
  part: { pts: [[23.4, 15.2], [21.8, 12.4], [20.2, 14.2], [18.2, 11.2], [16.4, 10.2], [HX, 9.4], [14.6, 10.2], [12.8, 11.2], [10.8, 14.2], [9.2, 12.4], [7.6, 15.2]], lean: 0, part: [[HX, 2.2], [HX, 8.6]], softTips: true, noCrease: true },
  // Hime: one heavy, perfectly straight line low on the brow, no notches.
  hime: { pts: [[24.4, 15.6], [6.6, 15.6]], lean: 0, blunt: true, noCrease: true },
  // Short and choppy, high on the brow.
  short: { pts: [[23, 12.4], [21.4, 10.2], [19.6, 13], [17.6, 10.4], [15.2, 13.4], [13.2, 10.6], [11, 13], [9.2, 10.6], [7.6, 12.4]], lean: 0.5 },
  // Jagged spikes of every length, one long between the eyes.
  spiky: { pts: [[23.6, 13.4], [21.6, 10.2], [19.8, 15], [17.8, 10.4], [15.4, 17.6], [13.4, 10.6], [10.8, 15.4], [9, 10.2], [7.4, 13.4]], lean: 0.4 },
  // Curtain: parted in the middle, sweeping out to the cheekbones, short at the centre.
  curtain: { pts: [[23.6, 17.4], [22.2, 13.4], [20, 10.8], [17.6, 8.8], [HX, 8.2], [13.4, 8.8], [11, 10.8], [8.8, 13.4], [7.4, 17.4]], lean: 0, plain: true, part: [[HX, 2.2], [HX, 7.6]] },
  // Swept back: no fringe at all, the hairline high so the whole brow shows.
  slicked: { pts: [[24.4, 10.6], [20.6, 8], [HX, 7], [10.4, 8], [6.6, 10.6]], lean: 0, plain: true },
  // Baby bangs: very short and straight, high on the forehead.
  baby: { pts: [[23.4, 11.4], [22.8, 10.5], [22.2, 11.5], [17.8, 11.6], [17.2, 10.6], [16.6, 11.6], [13.2, 11.6], [12.6, 10.6], [12, 11.6], [7.6, 11.4]], lean: 0, blunt: true },
  // Heavy: three big thick clumps down to the eyes.
  heavy: { pts: [[23.8, 15.6], [21.4, 11], [19.2, 17.2], [16.6, 11], [13.6, 17.4], [11.2, 11], [8.6, 16.6], [7.2, 14.2]], lean: 0.5, softTips: true },
  // M-shape: short in the middle, longer at the sides.
  mshape: { pts: [[23.6, 15.8], [21.8, 12.4], [19.8, 14.8], [17.8, 11.2], [HX, 12.4], [13.2, 11.2], [11.2, 14.8], [9.2, 12.4], [7.4, 15.8]], lean: 0, softTips: true },
  // Peekaboo: a long fringe swept down from a part on the far side over the near eye to the
  // cheek, in soft points; the far eye stays clear.
  peek: { pts: [[27.2, 18.4], [25.8, 24.2, 1], [24.2, 22, 1], [21.4, 23.6, 1], [19.4, 21.4], [18.6, 21.4], [16.6, 18.6], [15.4, 14.8], [14.6, 14, 1], [11.4, 14.1, 1], [10.9, 13.2, 1], [10.4, 14.1, 1], [7.4, 14, 1]], lean: 0, plain: true,
    part: [[10.4, 2.8], [9.6, 6.4]],
    // Strand lines that follow the sweep from the part down over the eye.
    strands: [[11.2, 5.4, 19.4, 21, 0.8, -1.8], [14.4, 4.8, 23.4, 21.2, 0.8, -1.8], [18.6, 4.6, 26, 16.4, 0.7, -1.4],
      // a few short lines where the ends split
      [18, 18, 20.4, 22.4, 1, -0.4], [22.2, 18.2, 23.6, 22, 1, -0.3]],
    // One long lock on the open side, falling past the cheek over a little of the face.
    locks: [[[6.4, 10.2], [7.6, 14.6], [8.8, 19.4], [8.6, 23.6]]] },
  // Rounded scallops (for curly hair).
  curly: { pts: [[23.6, 13.8], [21.8, 14.8], [19.8, 13.8], [17.8, 15.2], [15.6, 14], [13.4, 15.2], [11.2, 13.8], [9.2, 14.8], [7.6, 13.8]], lean: 0, round: true },
};
// The front hair: the skull's hair line from the far cheek over the top to the near one, closed
// by the bangs. The tips flutter a little with the hair. Returns { shapes, shade }.
function bangs(kind, r, m, extra = [], { shine = true } = {}) {
  const f = FRINGES[BANGS ?? kind];
  const edge = [];
  f.pts.forEach((p, i) => {
    // Soft tips round off (the notches between them stay crisp).
    edge.push(f.round || f.plain || (f.softTips && i % 2 === 0) ? p : P(...p));
    const b = f.pts[i + 1];
    if (b && !f.blunt && !f.round && !f.plain) edge.push([(p[0] + b[0]) / 2 + f.lean, (p[1] + b[1]) / 2]);
  });
  const outline = smooth([...dome(160, 380), [26.4, 14.6], P(24.8, 12), ...edge, P(6.2, 12), [4.6, 14.6]]);
  const flutter = mover(m && { root: 0, tip: m.tip * 0.4, wave: m.wave }, 0.35, 9, 8);
  const pts = dense(outline, 1.2).map(flutter);
  const shapes = [poly(pts, r.base)];
  // Creases rise from the notches.
  if (f.noCrease || f.plain) {
    // no creases
  } else if (!f.round) {
    const notches = f.blunt ? f.pts.filter((_, i) => i % 3 === 1) : f.pts.filter((_, i) => i % 2 === 1);
    for (const [x, y] of notches) shapes.push(crease(x, y, f.blunt ? 2.4 : 3.4, r.sh2, f.lean * 0.5));
  } else {
    for (let i = 1; i < f.pts.length; i += 2) shapes.push(poly(smooth([[f.pts[i][0] - 1.4, f.pts[i][1] - 1.2], [f.pts[i][0], f.pts[i][1] - 0.2], [f.pts[i][0] + 1.4, f.pts[i][1] - 1.2], [f.pts[i][0], f.pts[i][1] - 0.7]]), r.sh1));
  }
  // Where the hair parts, a dark line runs back over the crown.
  if (f.part) shapes.push(streak(...f.part[0], ...f.part[1], 0.9, 0, r.sh2));
  for (const [x0, y0, x1, y1, w, bow] of f.strands ?? []) shapes.push(streak(x0, y0, x1, y1, w, bow, r.sh1));
  for (const spine of f.locks ?? []) shapes.push(lock(spine, 4.6, r.base, m, 1.2), streak(spine[0][0] + 0.6, spine[0][1] + 2, spine[2][0], spine[2][1], 0.6, 0.3, r.sh1, m, 1.2));
  // The band of forehead the bangs shade: a thin strip under each run of the edge over the face.
  const shade = [];
  let run = [];
  const flush = () => {
    if (run.length > 2) shade.push(F(T([...run.map(([x, y]) => [x, y + 1.1]), ...run.map(([x, y]) => [x, y - 0.3]).reverse()], '#000')));
    run = [];
  };
  for (const p of pts) {
    const prev = run[run.length - 1];
    if (p[0] > 7.6 && p[0] < 23.4 && p[1] > 12.6 && p[1] < 18) {
      if (prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 2) flush();
      run.push(p);
    } else flush();
  }
  flush();
  return { shapes: [...shapes, ...extra, ...(shine ? ring(r.hi) : [])], shade, hairline: !f.plain };
}
// Locks that frame the face, one in front of each ear, swinging a beat behind.
const sideLocks = (r, m, near, far = near ? fx(near) : null, w = 3.6, k = 1.2) => [
  ...(near ? [lock(near, w, r.base, m, k), streak(near[0][0] + 0.4, near[0][1] + 2, near[1][0] + 0.4, near[1][1], 0.7, -0.3, r.hi, m, k)] : []),
  ...(far ? [lock(far, w, r.base, m, k)] : []),
];

// Bangs can be chosen apart from the hairstyle ('auto' keeps the style's own).
export const BANG_STYLES = ['auto', 'soft', 'blunt', 'hime', 'baby', 'heavy', 'mshape', 'wispy', 'swept', 'peek', 'part', 'curtain', 'short', 'spiky', 'curly', 'slicked'];
let BANGS = null;

// ---------- The styles ----------

// Each style returns { head, hang, front, top, tips }: `head` behind the skull, `hang` below it
// (behind the body), `front` over the face ({ shapes, shade }), `top` pieces that also show over
// the skull from behind, and `tips` the band [y1, y2] where a two-tone fades in.
const STYLES = {
  // Candy curls: high twintails falling in a big S-wave, curling in at the ends, a lighter lock over
  // each; blunt bangs.
  candy(r, m) {
    const tail = [[5.2, 6.4], [1.6, 8], [-1.6, 13], [-2.8, 19], [-1.2, 24.6], [-3, 30], [-3.6, 35.4], [-1.8, 39.6], [1, 40.8], [2.6, 39.2]];
    const light = [[5.4, 7], [2.8, 10], [1, 15], [1.4, 21], [0.2, 27], [-0.8, 32], [0.2, 36.4]];
    const hang = [];
    for (const flip of [(p) => p, fx]) {
      hang.push(lock(flip(tail), 8, r.sh1, m, 1.05, 0.18), lock(flip(light), 3.8, r.base, m, 1.2));
      const [a, b] = [flip([[1.2, 12], [0.2, 19.6]]), flip([[-1, 31], [-1.4, 35.6]])];
      hang.push(streak(...a[0], ...a[1], 0.9, 0.4, r.hi, m, 1.2), streak(...b[0], ...b[1], 0.8, 0.3, r.base, m, 1.05));
    }
    return { head: [crown(r), F(E(5.4, 6.2, 1.4, 1.9, r.sh2)), F(E(25.6, 6.2, 1.4, 1.9, r.sh2))], hang, front: bangs('blunt', r, m, sideLocks(r, m, [[25.2, 11], [26.2, 16], [26.4, 20.6]], undefined, 3)), tips: [27, 31] };
  },
  // Ojou drills: a ringlet on each side, stretching and bouncing; soft bangs.
  drills(r, m) {
    return {
      head: [crown(r), F(E(4.6, 9, 1.4, 1.9, r.sh2)), F(E(26.4, 9, 1.4, 1.9, r.sh2))],
      hang: [lock([[4.6, 9], [2.4, 11.6], [1.6, 14]], 6, r.sh1, m), lock([[26.4, 9], [28.6, 11.6], [29.4, 14]], 6, r.sh1, m), ...drill(1.6, 15.6, 6, 3.6, 1, r, m), ...drill(29.4, 15.6, 6, 3.6, -1, r, m)],
      front: bangs('soft', r, m, sideLocks(r, m, [[25.2, 11], [26, 16], [25.6, 21]], undefined, 3)),
      tips: [28, 32],
    };
  },
  // A side tail tied high over the near temple, falling in a wave in front of the shoulder with a
  // curl at the end; swept bangs.
  sidetail(r, m) {
    const tail = [[26.2, 6.4], [29.6, 6.6], [31.8, 10.4], [32.2, 16.4], [30.8, 22.4], [32, 28.4], [32.4, 33.4], [30.8, 37], [28.6, 37.4], [28.4, 35.6]];
    const light = [[26.6, 7.4], [28.6, 10], [29.4, 15], [28.4, 21], [29.2, 27], [29.2, 31.6]];
    const pieces = [lock(tail, 7.6, r.sh1, m, 1.1, 0.16), lock(light, 3.6, r.base, m, 1.25), streak(28.8, 9, 29.4, 16, 0.9, -0.4, r.hi, m, 1.2), F(E(26.4, 7.2, 1.5, 1.9, r.sh2))];
    return {
      head: [crown(r)],
      hang: [...sheet({ len: 23, flare: 11.6, n: 3 }, r, m), lock(tail, 7.6, r.sh1, m, 1.1, 0.16)],
      front: bangs('swept', r, m, [...sideLocks(r, m, null, [[5.8, 11], [5, 16], [5.6, 20.4]], 3.2), ...pieces]),
      tips: [26, 31],
    };
  },
  // Cat-ear buns: two little coils of hair on top shaped like ears, over a bell-shaped cut that
  // ends in curls; wispy bangs.
  catbun(r, m) {
    const ear = (dir) => {
      const pts = [[5.6, 6.4], [4.4, 3.4], [4.8, 0.6], P(6.4, -1), [8.6, 0.4], [10.8, 2.4], [10.4, 4.8]];
      const p = dir > 0 ? pts : fx(pts);
      const s = dir > 0 ? (q) => q : (q) => [31 - q[0], q[1]];
      return [poly(smooth(p), r.base), streak(...s([6.6, 0.4]), ...s([9.8, 3.8]), 0.8, 0.9 * dir, r.sh1), streak(...s([5.6, 2]), ...s([7.6, 5.4]), 0.7, 0.7 * dir, r.sh1), streak(...s([5.4, 0.8]), ...s([5.2, 4.4]), 0.9, -0.4 * dir, r.hi)];
    };
    const top = [...ear(1), ...ear(-1)];
    return {
      head: [crown(r), ...top],
      hang: sheet({ len: 30, flare: 14.6, ends: 'curls', n: 5, w0: 12 }, r, m),
      front: bangs('wispy', r, m, sideLocks(r, m, [[25.4, 11], [26.4, 17], [26.6, 22.4], [28, 24.6], [28.6, 23.2]], undefined, 3.2)),
      top,
      tips: [23, 27],
    };
  },
  // Princess: very long flowing hair past the hips in waves, parted in the middle, with long locks
  // framing the face.
  princess(r, m) {
    return {
      head: [crown(r)],
      hang: [napeShadow(r), ...sheet({ len: 49, flare: 13.4, wave: 2, ends: 'points', n: 5 }, r, m)],
      front: bangs('part', r, m, sideLocks(r, m, [[25, 10], [26.6, 17], [26, 24], [27.6, 30], [27, 34]], undefined, 4.2)),
      tips: [36, 42],
    };
  },
  // A big bow tied out of the hair on top, over long straight hair; blunt bangs.
  bowhair(r, m) {
    // The bow sits on top of the head, in front, so it reads from the front and from behind.
    const bow = hairBow(HX + 0.6, 0.2, 1.35, r);
    return {
      head: [crown(r)],
      hang: [napeShadow(r), ...sheet({ len: 40, flare: 12, wave: 1.2, n: 4 }, r, m)],
      front: bangs('blunt', r, m, [...sideLocks(r, m, [[25.2, 11], [26.4, 18], [26, 25], [26.8, 29]], undefined, 3.6), ...bow]),
      top: bow,
      tips: [31, 36],
    };
  },

  // Hime cut: blunt bangs, side locks cut level at the chin, long straight hair cut level.
  hime(r, m) {
    const side = (dir) => {
      const p = [[24, 10], [27.2, 10.6], [27.4, 25.4, 1], [21.8, 25.4, 1], [21.8, 15]];
      return mass(dir > 0 ? p : fx(p), r.base, m, 0.6);
    };
    return {
      head: [crown(r)],
      hang: [napeShadow(r), ...sheet({ len: 42, flare: 12.6, ends: 'level', n: 3 }, r, m, 0.8)],
      front: bangs('hime', r, m, [side(1), side(-1), F(R(21.8, 15.6, 0.7, 9.8, r.sh2)), F(R(8.5, 15.6, 0.7, 9.8, r.sh2))]),
      tips: [33, 38],
    };
  },
  // A braid wound round the head like a crown, over long loose waves; soft bangs below it.
  crownbraid(r, m) {
    // A braid wound over the head like a crown: a dark band with round knots along it (the
    // darker gaps between them make it read as a braid), each with a small shine.
    const band = (pts) => {
      const out = [lock([...pts, pts[pts.length - 1]], 4.8, r.sh2, null, 1, 1)];
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        const k = i % 2 ? 0.35 : -0.35;
        out.push(F(E(x, y + k, 2.3, 1.9, r.base)), F(E(x + 0.5, y - 0.7 + k, 0.8, 0.45, r.hi)));
      }
      return out;
    };
    const arc = dome(198, 342, 8, 11, 7.6, 13.4);
    const braid = band(arc);
    return {
      head: [crown(r)],
      hang: [napeShadow(r), ...sheet({ len: 42, flare: 13.4, wave: 1, ends: 'curls', n: 3 }, r, m)],
      front: bangs('soft', r, m, [...sideLocks(r, m, [[25.4, 11], [26.6, 17], [26.2, 22], [27.6, 25.6]], undefined, 3), ...braid], { shine: false }),
      top: band(fx(arc)),
      tips: [33, 38],
    };
  },

  // Odango: two buns high on the head, a long thin tail from each, swinging; soft bangs.
  odango(r, m) {
    const tail = [[6.2, 6], [3.4, 9.4], [2.4, 16], [3.2, 22], [1.8, 28], [1.6, 34], [2.8, 38.4]];
    const buns = [...bun(6.4, 3.4, 4.2, 3.8, r, 1), ...bun(24.6, 3.4, 4.2, 3.8, r, -1)];
    return {
      head: [crown(r), ...buns],
      hang: [lock(tail, 4.6, r.sh1, m, 1.1), lock(fx(tail), 4.6, r.sh1, m, 1.1)],
      front: bangs('soft', r, m, sideLocks(r, m, [[25.2, 11], [26.2, 16], [25.8, 20.4]], undefined, 3)),
      top: buns,
      tips: [29, 34],
    };
  },
  // Wolf cut: shaggy layers, flicking out at the cheeks and the jaw, with a longer mullet behind.
  wolf(r, m) {
    // Shaggy layers that flick out at the temples, the cheeks and the jaw, over a longer mullet.
    const flick = (pts, w = 4.4) => [lock(pts, w, r.base, m, 1.15), lock(fx(pts), w, r.base, m, 1.15)];
    const mid = (pts) => [lock(pts, 4.4, r.sh1, m, 1), lock(fx(pts), 4.4, r.sh1, m, 1)];
    return {
      head: [crown(r, 0.8), ...mid([[24.4, 12], [28.4, 16], [32, 17.4]])],
      hang: sheet({ len: 33, flare: 14.6, ends: 'points', n: 5, w0: 12.6 }, r, m),
      front: bangs('spiky', r, m, [...flick([[25, 9.4], [29, 11.6], [32.4, 12.4]], 4.2), ...flick([[25.2, 13], [27.4, 18.4], [31.6, 22.6]], 4.6), ...flick([[24.8, 17], [26, 23], [29.2, 27.4]], 3.8)]),
      tips: [22, 27],
    };
  },

  // Swoop: the peekaboo fringe swept over one eye, over a short, neat cut that tapers to points
  // at the nape.
  swoop(r, m) {
    return {
      head: [crown(r, -0.2)],
      hang: sheet({ len: 23, flare: 11.4, n: 3, w0: 11 }, r, m, 0.7),
      front: bangs('peek', r, m),
      tips: [21.6, 23.4],
    };
  },

};

// ---------- Two-tone ----------

// The part of a closed outline below the line y = y0 (clipped).
function below(pts, y0) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const ia = a[1] >= y0;
    if (ia) out.push(a);
    if (ia !== b[1] >= y0) {
      const t = (y0 - a[1]) / (b[1] - a[1]);
      out.push([a[0] + (b[0] - a[0]) * t, y0]);
    }
  }
  return out;
}
// Adds, after each hair shape, its part below y1 in the blend colour and below y2 in the tip
// colour, shade for shade (base stays base, shadow stays shadow).
function twoTone(shapes, r, tint, [y1, y2]) {
  if (!tint) return shapes;
  const role = new Map(Object.entries(r).map(([k, v]) => [v, k]));
  const out = [];
  for (const sh of shapes) {
    out.push(sh);
    const k = role.get(sh.c);
    if (!k || !(k in tint.tip)) continue;
    const pts = sh.t === 'p' ? sh.pts.map(([x, y]) => [x + (sh.x ?? 0), y + (sh.y ?? 0)]) : sh.t === 'e' ? ellipsePts(sh.x, sh.y, sh.rx, sh.ry) : null;
    if (!pts || Math.max(...pts.map((p) => p[1])) < y1) continue;
    for (const [y0, ramp] of [[y1, tint.mid], [y2, tint.tip]]) {
      const part = below(pts, y0);
      if (part.length > 2) out.push({ ...poly(part, ramp[k]), hang: sh.hang });
    }
  }
  return out;
}

// ---------- What the hero draws ----------

// Every part of a hairstyle for one look and motion: { head, hang, front, shade, top }.
// `r` is the hair's colour ramp, `tint` the blend and tip ramps for two-tone (or null), `m` the
// motion ({ root, tip, lift, wave }), and `mood` the face (for the ahoge).
export function hairParts(style, r, tint, m, mood = 'smile', bangsKind = 'auto') {
  const s = STYLES[style];
  if (!s) return { head: [], hang: [], front: [], shade: [], top: [] };
  BANGS = bangsKind && bangsKind !== 'auto' && FRINGES[bangsKind] ? bangsKind : null;
  const p = s(r, m, mood);
  BANGS = null;
  const tips = p.tips ?? [99, 99];
  return {
    head: twoTone(p.head, r, tint, tips),
    hang: twoTone(p.hang, r, tint, tips),
    front: twoTone(p.front.shapes, r, tint, tips),
    shade: p.front.shade,
    hairline: p.front.hairline !== false,
    top: p.top ?? [],
  };
}

// Seen from behind (climbing): the hair over the back of the skull, and anything worn on top.
export function hairNape(style, r) {
  if (!STYLES[style]) return [];
  const big = style === 'cloud' || style === 'wavylong' ? 1 : 0;
  return [F(E(HX, 13.6 - big * 0.4, 12 + big, 11.2 + big, r.base)), F(E(HX, 20.4, 9.8, 4, r.sh1)), ...ring(r.hi, HX, 10, 9, 5.6, 210, 330)];
}
