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

// Twenty-two styles: anime, princess and fantasy, cool, punk and cute, and a doll's.
export const HAIR_STYLES = ['candy', 'drills', 'sidetail', 'catbun', 'princess', 'bowhair', 'hime', 'crownbraid', 'odango', 'wolf', 'swoop', 'ponytail', 'halfup', 'spiky', 'pixie', 'fluffybob', 'wavylong', 'cloud', 'lowtails', 'braids', 'wolfsleek', 'kokeshi'];
// Older styles draw as the closest current one; anything else unknown draws as the first.
const RETIRED = {
  twintails: 'candy', bob: 'fluffybob', curtain: 'halfup', short: 'pixie', sweep: 'swoop', eyecover: 'swoop', undercut: 'swoop', quiff: 'spiky', hero: 'spiky',
  mohawk: 'spiky', bun: 'odango', topknot: 'odango', long: 'wavylong', wavy: 'wavylong', fluffy: 'wavylong', curly: 'cloud', ahoge: 'pixie', braid: 'braids',
};
export const hairStyleOf = (look) => {
  const s = RETIRED[look.hairStyle] ?? look.hairStyle;
  return HAIR_STYLES.includes(s) || GUARDIAN_HAIR.includes(s) || TROUPE_HAIR.includes(s) ? s : HAIR_STYLES[0];
};
// Styles made for the Shrine Maiden's kitsune guardian alone (render/kitsune.js), never offered in
// the creator: see "The kitsune guardian's own styles" below.
export const GUARDIAN_HAIR = ['heian', 'highqueen', 'foxmane', 'sweptback', 'boundtail', 'moonriver'];
// Styles made for the Onmyoji's yokai troupe alone, never offered in the creator: see "The yokai
// troupe's own styles" below.
export const TROUPE_HAIR = ['onisilver', 'onitwin', 'onibob', 'onipony', 'onimane', 'onitopknot', 'oniwhite', 'yukistraight', 'yukiwave', 'yukistorm', 'yukihime', 'yukibob', 'yukibun', 'yukitails', 'yukifrost'];
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
  swept: { pts: [[23.4, 10.4], [22.2, 8.6], [20.4, 12.2], [19, 9.8], [16.6, 14.4], [15.4, 11.6], [12.6, 16.4], [11.8, 13.2], [9, 17.6], [8.4, 14.6], [6.6, 16.8]], lean: -1.4, part: [[21.4, 3.8], [23, 7]] },
  // Parted in the middle, curving apart to open a triangle of forehead.
  part: { pts: [[23.4, 15.2], [21.8, 12.4], [20.2, 14.2], [18.2, 11.2], [16.4, 10.2], [HX, 9.4], [14.6, 10.2], [12.8, 11.2], [10.8, 14.2], [9.2, 12.4], [7.6, 15.2]], lean: 0, part: [[HX, 2.2], [HX, 8.6]], softTips: true, noCrease: true },
  // Hime: one heavy, perfectly straight line low on the brow, no notches.
  hime: { pts: [[24.4, 15.6], [6.6, 15.6]], lean: 0, blunt: true, noCrease: true },
  // Short and choppy, high on the brow.
  short: { pts: [[23, 12.4], [21.4, 10.2], [19.6, 13], [17.6, 10.4], [15.2, 13.4], [13.2, 10.6], [11, 13], [9.2, 10.6], [7.6, 12.4]], lean: 0.5 },
  // Jagged spikes of every length, one long between the eyes.
  spiky: { pts: [[23.6, 13.4], [21.6, 10.2], [19.8, 15], [17.8, 10.4], [15.4, 17.6], [13.4, 10.6], [10.8, 15.4], [9, 10.2], [7.4, 13.4]], lean: 0.4 },
  // Curtain: parted in the middle, sweeping out to the cheekbones, short at the centre.
  curtain: { pts: [[23.6, 17.2], [22.4, 14], [20.6, 12], [18.4, 10.8], [HX, 10.2], [12.6, 10.8], [10.4, 12], [8.6, 14], [7.4, 17.2]], lean: 0, plain: true, part: [[HX, 2.2], [HX, 9.6]] },
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
  // A doll's: one smooth blunt cut that curves gently round the brow like a painted bowl,
  // combed lines running down into it.
  doll: { pts: [[25, 17.2], [23.4, 15.8], [20.2, 15.1], [HX, 14.9], [10.8, 15.1], [7.6, 15.8], [6, 17.2]], lean: 0, plain: true,
    strands: [[19.6, 5.2, 20.6, 14.4, 0.6, -0.4], [HX + 0.6, 3.8, HX + 0.8, 14.2, 0.6, 0], [11.4, 5.2, 10.4, 14.4, 0.6, 0.4]] },
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
  // Side hair over the ears and the sides of the head, so no skin or skull ever shows between
  // the bangs and the hair behind (elf ears are long enough to poke out past it).
  const side = [[24.6, 10.6], [27.4, 12.4], [28, 17.4], [27.4, 21.6], [25.8, 22.4], [24.6, 19.6], [24.2, 14.6]];
  const sideHair = [poly(smooth(side), r.base), poly(smooth(side.map(([x, y]) => [31 - x, y])), r.base)];
  const shapes = [...sideHair, poly(pts, r.base)];
  // Creases rise from the notches.
  if (f.noCrease || f.plain) {
    // no creases
  } else if (!f.round) {
    const notches = f.blunt ? f.pts.filter((_, i) => i % 3 === 1) : f.pts.filter((_, i) => i % 2 === 1);
    for (const [x, y] of notches) shapes.push(crease(x, y, f.blunt ? 2.4 : 3.4, r.sh2, f.lean * 0.5));
  } else {
    for (let i = 1; i < f.pts.length; i += 2) shapes.push(poly(smooth([[f.pts[i][0] - 1.4, f.pts[i][1] - 1.2], [f.pts[i][0], f.pts[i][1] - 0.2], [f.pts[i][0] + 1.4, f.pts[i][1] - 1.2], [f.pts[i][0], f.pts[i][1] - 0.7]]), r.sh1));
  }
  // A shadowless cut is edged with a thin line in the hair's own shade, so it still reads on pale skin.
  if (f.noShade) shapes.push(F(R(f.pts[f.pts.length - 1][0] + 0.4, f.pts[0][1] - 0.75, f.pts[0][0] - f.pts[f.pts.length - 1][0] - 0.8, 0.75, r.sh2)));
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
  return { shapes: [...shapes, ...extra, ...(shine ? ring(r.hi) : [])], shade: f.noShade ? [] : shade, hairline: !f.plain && !f.noShade };
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
  // Short wolf cut: the wolf cut's shaggy layers cropped short and boyish, straighter, the locks
  // falling to the jaw with only a slight flick out at the ends, the back stopping at the nape.
  wolfsleek(r, m) {
    const fall = (pts, w = 4.2) => [lock(pts, w, r.base, m, 1.1), lock(fx(pts), w, r.base, m, 1.1)];
    const mid = (pts) => [lock(pts, 4.2, r.sh1, m, 1), lock(fx(pts), 4.2, r.sh1, m, 1)];
    return {
      head: [crown(r, 0.8), ...mid([[24.5, 12], [27.8, 16.5], [30.2, 19.7]])],
      hang: sheet({ len: 26, flare: 12.6, ends: 'points', n: 4, w0: 12 }, r, m),
      front: bangs('spiky', r, m, [...fall([[25, 9.5], [28.3, 12.3], [30.7, 14.7]], 4.1), ...fall([[25.2, 13], [27, 17.6], [29.2, 21]], 4.5), ...fall([[24.8, 16.4], [25.6, 20.6], [27.2, 23.6]], 3.7)]),
      tips: [18, 22],
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

  // A high ponytail with lots of body: it lifts out of the tie and falls in a long S, a lighter lock
  // over it; swept bangs.
  ponytail(r, m) {
    const tail = [[5.4, 4.4], [1.6, 3.6], [-2, 6.6], [-4, 12], [-4.2, 19], [-2.6, 25], [-3.6, 31], [-2, 36.4], [0.4, 38]];
    const light = [[5, 5.4], [2, 6], [-0.4, 10], [-1.6, 16], [-0.6, 22], [-1.4, 28]];
    return {
      head: [crown(r), F(E(5.4, 5, 1.6, 2, r.sh2))],
      hang: [lock(tail, 8.6, r.sh1, m, 1.1, 0.12), lock(light, 3.8, r.base, m, 1.25), streak(-0.6, 9, -2, 18, 0.9, 0.6, r.hi, m, 1.25)],
      front: bangs('mshape', r, m, sideLocks(r, m, [[25.2, 11], [26, 16], [25.6, 20.2]], undefined, 3)),
      top: [F(E(5.4, 5, 1.6, 2, r.sh2))],
      tips: [26, 31],
    };
  },
  // Half-up: the top gathered into a small loop of hair at the back, the rest left down in long
  // waves; wispy bangs.
  halfup(r, m) {
    const loop = [...bun(4.2, 5.2, 3, 2.6, r, 1), F(E(5.8, 6.6, 1.2, 1.6, r.sh2))];
    return {
      head: [crown(r), ...loop],
      hang: [napeShadow(r), ...sheet({ len: 44, flare: 14, wave: 1.1, n: 4 }, r, m)],
      front: bangs('curtain', r, m, sideLocks(r, m, [[25.2, 10.6], [26.8, 17], [26.2, 24], [27.4, 29.4]], undefined, 3.4)),
      top: loop,
      tips: [33, 39],
    };
  },
  // Spiky hero hair: big spikes swept back round the head, a jagged fringe.
  spiky(r, m) {
    const spikes = mass([[8, 22], P(1.6, 21.8), [3.4, 17], P(-2.6, 11.4), [3.6, 8.4], P(0.8, 1.6), [7.6, 3.4], P(7.8, -4.2), [12.6, 1.2], P(16.8, -5.2), [19.4, 1.4], P(25.2, -2.2), [26.6, 6], [27.6, 9], [27.6, 15], [23, 22]], r.sh1, m, 0.4);
    return {
      head: [spikes],
      hang: [],
      front: bangs('spiky', r, m, [lock([[25.2, 10.4], [27.8, 14.4], [30, 18.6]], 4, r.base, m, 0.8), lock([[5.8, 10.4], [3.2, 14.4], [1, 18.6]], 4, r.base, m, 0.8)]),
      tips: [18, 21],
    };
  },
  // A short choppy pixie with an ahoge that bounces, perks up when excited and wilts when sulking.
  pixie(r, m, mood) {
    const droop = mood === 'pout' || mood === 'shy';
    const perk = mood === 'excited' || mood === 'angry';
    const tx = 18.6 + (m?.tip ?? 0) * 1.2 + (droop ? 5 : 1.4);
    const ty = droop ? 0.6 : perk ? -6.8 : -5;
    const ahoge = poly(smooth([[13.6, 3.2], [15, -0.4], P(tx, ty), [16.6, 0.6], [15.8, 3.4]]), r.base);
    const back = mass([[6, 21], P(4.2, 22.8), [3.6, 16], [3.6, 10], [7, 3], [13.2, 1.4], [20, 1.6], [27, 7], [27.4, 14], [26.6, 21], P(24.8, 22.6), [21, 21], P(15.5, 23.6), [10, 21]], r.sh1, m, 0.5);
    const b = bangs('short', r, m, sideLocks(r, m, [[25.2, 10.6], [25.8, 15], [25.4, 18.6]], undefined, 3));
    b.shapes.unshift(ahoge);
    return { head: [back], hang: [], front: b, tips: [16, 19] };
  },
  // A fluffy bob to the jaw whose ends flip out in curls.
  fluffybob(r, m) {
    const flip = [[25.2, 10.6], [26.8, 16], [27.4, 20.6], [29.6, 22.8], [30.8, 21.6]];
    return {
      head: [crown(r, 0.8)],
      hang: sheet({ len: 25, flare: 15.4, ends: 'curls', n: 4, w0: 12.6 }, r, m, 0.7),
      front: bangs('baby', r, m, sideLocks(r, m, flip, undefined, 4)),
      tips: [18, 22],
    };
  },
  // Long big waves with lots of volume, curling at the ends.
  wavylong(r, m) {
    const wav = [[25.2, 10.6], [27.4, 16], [26, 21.6], [28.2, 26.6], [27, 31.6], [28.6, 33.4]];
    return {
      head: [crown(r, 1)],
      hang: [napeShadow(r), ...sheet({ len: 41, flare: 17, wave: 1.8, ends: 'curls', n: 5, w0: 12.6 }, r, m)],
      front: bangs('wispy', r, m, sideLocks(r, m, wav, undefined, 4.4)),
      tips: [30, 35],
    };
  },
  // A cloud of curls, much wider than the head: a scalloped outline of round curls all round.
  cloud(r, m) {
    // A soft cloud of curls much wider than the head: round puffs all the way round, each with a
    // small curl line, and no points anywhere.
    const puff = (list) => [...list.map(([x, y, rr]) => F(E(x, y, rr, rr * 0.92, r.sh1))), ...list.map(([x, y, rr]) => poly(smooth([[x - rr * 0.5, y + rr * 0.1], [x, y + rr * 0.45], [x + rr * 0.5, y + rr * 0.05], [x, y + rr * 0.25]]), r.sh2))];
    // The lower puffs hang behind the body, so they never cover the chest.
    const high = [[3.4, 8.6, 4.6], [1.6, 14.4, 4.8], [2.6, 20.4, 4.6], [8.8, 2.6, 4.6], [15.5, 0.6, 5], [22.2, 2.6, 4.6], [27.6, 8.6, 4.6], [29.4, 14.4, 4.8], [28.4, 20.4, 4.6]];
    const low = [[5, 25.4, 4.4], [10.4, 27, 4.2], [15.5, 27.6, 4.4], [20.6, 27, 4.2], [26, 25.4, 4.4]];
    return {
      head: [F(E(HX, 13.4, 13.4, 12.6, r.sh1)), ...puff(high)],
      hang: puff(low),
      front: bangs('curly', r, m, sideLocks(r, m, [[25.2, 11], [27.4, 15.6], [26.8, 19.6], [28.4, 22]], undefined, 4)),
      tips: [22, 26],
    };
  },

  // Kokeshi: a doll's bob, glossy and round as a lacquered bowl, its ends turned in under the
  // jaw; a smooth blunt fringe; a thin lock before each ear bound in scarlet cord, ending in a
  // tassel and a tiny gold bell; a hairpin of a scarlet bow, a gold bell and a paper streamer.
  kokeshi(r, m) {
    // The bob behind: wider than the skull, curving in to the nape at the jaw.
    const bob = [[HX, 1.2], [24.6, 3.4], [29.2, 9.6], [30.2, 16.6], [29.4, 23.2], [27.2, 26.6], [24.2, 27.2], [22.6, 25.2], [HX, 23.6], [8.4, 25.2], [6.8, 27.2], [3.8, 26.6], [1.6, 23.2], [0.8, 16.6], [1.8, 9.6], [6.4, 3.4]];
    // The bob's sides in front of the ears, turned in under the jaw.
    const side = (dir) => {
      const pts = [[24.2, 9.6], [27.6, 11.6], [28.8, 17.4], [28.2, 23.2], [26.6, 26.2], [24.4, 26.6], [23.4, 25], [24.8, 23.6], [24.6, 17.6], [23.4, 13.6]];
      return mass(dir > 0 ? pts : fx(pts), r.base, m, 0.5);
    };
    const tuck = (dir) => {
      const pts = [[24.4, 24.2], [26.8, 25.4], [25.4, 26.4], [23.8, 25.6]];
      return poly(smooth(dir > 0 ? pts : fx(pts)), r.sh1);
    };
    // The bound lock: thin, falling to the chest, wrapped in scarlet near the top, a tassel and bell.
    const cord = (dir) => {
      const sp = [[25.6, 15.4], [26.4, 21], [26.2, 27], [26.6, 31.8]];
      const spine = dir > 0 ? sp : fx(sp);
      const mv = mover(m, 1.3);
      const [wx, wy] = mv(spine[1]);
      const [bx, by] = mv(spine[3]);
      return [
        lock(spine, 2.4, r.base, m, 1.3, 0.3),
        F(R(wx - 1.3, wy - 0.4, 2.6, 1.1, '#e0303e')), F(R(wx - 1.3, wy + 1.1, 2.6, 0.7, '#e0303e')),
        F(T([[bx - 0.9, by], [bx + 0.9, by], [bx + 1.2, by + 2.6], [bx - 1.2, by + 2.6]], '#e0303e')),
        F(E(bx, by + 3.4, 0.95, 0.95, '#ffd36a')), F(E(bx - 0.3, by + 3.1, 0.35, 0.35, '#fff6d0')),
      ];
    };
    // The hairpin, on the near side of the crown.
    const pin = [
      F(T([[21.6, 3.6], [19.4, 1.4], [19.2, 4.6]], '#e0303e')), F(T([[21.6, 3.6], [24.2, 1.2], [24.6, 4.4]], '#e0303e')), F(E(21.8, 3.6, 0.9, 0.9, '#c41e2c')),
      F(T([[22.4, 4.2], [24, 4.6], [24.4, 6.4], [22.8, 6]], '#ffffff')), F(T([[23.4, 6.2], [25, 6.6], [25.4, 8.6], [23.8, 8.2]], '#ddd6ee')),
      F(E(20.4, 5.8, 1.1, 1.1, '#ffd36a')), F(E(20.1, 5.5, 0.4, 0.4, '#fff6d0')), F(R(19.9, 6.4, 1, 0.3, '#c8902a')),
    ];
    return {
      head: [crown(r, 0.6), mass(bob, r.sh1, m, 0.4), ...ring(r.hi, HX, 9.2, 11, 6, 206, 334, 4)],
      hang: [],
      front: bangs('doll', r, m, [side(1), side(-1), tuck(1), tuck(-1), ...cord(1), ...cord(-1), ...pin]),
      top: pin,
      tips: [22, 26],
    };
  },

  // Low twintails tied at the nape, lying forward over the shoulders in soft waves.
  lowtails(r, m) {
    const tail = [[25.6, 19.6], [28, 22.6], [27.4, 27.4], [28.6, 32], [27.6, 36.4], [28.8, 38.4]];
    const pieces = (t) => [lock(t, 5.6, r.base, m, 1.2, 0.12), streak(t[0][0] + 0.4, t[0][1] + 2.4, t[2][0], t[2][1] + 2, 0.8, -0.4, r.hi, m, 1.2)];
    return {
      head: [crown(r)],
      hang: [...sheet({ len: 24, flare: 11.8, n: 3 }, r, m), lock(tail, 5.6, r.sh1, m, 1.2, 0.12), lock(fx(tail), 5.6, r.sh1, m, 1.2, 0.12)],
      front: bangs('heavy', r, m, [...sideLocks(r, m, [[25.2, 10.8], [26.2, 15], [25.8, 19]], undefined, 3), ...pieces(tail), ...pieces(fx(tail)), F(E(26.6, 20.6, 1.3, 1, r.sh2)), F(E(4.4, 20.6, 1.3, 1, r.sh2))]),
      tips: [28, 33],
    };
  },
  // Two plaits brought forward over the shoulders; parted bangs.
  braids(r, m) {
    const sp = [[25.4, 14], [26.6, 19], [26.2, 25], [26.8, 31]];
    return {
      head: [crown(r)],
      hang: [...sheet({ len: 23, flare: 11.6, n: 3 }, r, m), ...plait(sp, 3.8, r, m, 1.1, r.sh1), ...plait(fx(sp), 3.8, r, m, 1.1, r.sh1)],
      front: bangs('part', r, m, [lock([[24.6, 10], [26, 13], [25.6, 15]], 4, r.base, m), lock([[6.4, 10], [5, 13], [5.4, 15]], 4, r.base, m), ...plait(sp, 3.8, r, m, 1.1), ...plait(fx(sp), 3.8, r, m, 1.1)]),
      tips: [28, 32],
    };
  },
};

// ---------- Two-tone ----------

// The part of a closed outline below the line y = y0 (clipped).
// ---------- The kitsune guardian's own styles ----------
// Six styles drawn for her alone: regal, cold and strong, silver-white, leaving her fox ears clear.
// Their bangs are new outlines too.
Object.assign(FRINGES, {
  // Heian court: parted in the middle, no fringe, the hair drawn back and down from a high brow.
  heianpart: { pts: [[24.4, 14.4], [22.2, 10.8], [19.2, 8.4], [HX, 7.6], [11.8, 8.4], [8.8, 10.8], [6.6, 14.4]], lean: 0, plain: true, part: [[HX, 1.6], [HX, 7.2]] },
  // A queen's centre part: two long curtains sweeping down past the cheekbones.
  queenpart: { pts: [[24.8, 19.4], [23.4, 15.4], [21.4, 12.4], [18.8, 10.2], [HX, 9.2], [12.2, 10.2], [9.6, 12.4], [7.6, 15.4], [6.2, 19.4]], lean: 0, plain: true, part: [[HX, 1.6], [HX, 8.8]] },
  // Regal: long, sharp points swept across the brow to the far side, longest by the far eye.
  regal: { pts: [[24.2, 11.8], [22.8, 9], [21.2, 13.4], [19.6, 9.6], [17.2, 14.8], [15.8, 10.2], [13.2, 16.4], [12.2, 11.2], [9.6, 17.8], [8.8, 12.8], [6.8, 16.2]], lean: -1.1 },
  // A wild mane: big jagged spikes of every length.
  mane: { pts: [[24.2, 14.2], [22.2, 9.4], [20.6, 16.2], [18.6, 9.8], [16.4, 17.6], [14.8, 10.2], [12.6, 16.8], [11, 10], [9.2, 15.8], [7.8, 10.8], [6.6, 14.8]], lean: 0.6 },
  // Swept back: no fringe at all, the hairline high and the hair combed straight back.
  bare: { pts: [[24.6, 11.4], [22.2, 8.6], [18.8, 6.8], [HX, 6.4], [12.2, 6.8], [8.8, 8.6], [6.4, 11.4]], lean: 0, plain: true, strands: [[19.6, 6.6, 12.4, 2.6, 1, 0.6], [16.6, 6.4, 9.4, 3.4, 0.9, 0.5], [22, 8, 15.6, 2.4, 0.9, 0.6]] },
});
const PAPER = '#ffffff';
const PAPER_SH = '#ddd6ee';
const CORD = '#d8352c';
const CORD_DK = '#8e1c16';
const RINGG = '#f2c94c';
const RINGG_DK = '#a8781a';
Object.assign(STYLES, {
  // Heian court hair: straight and floor-length, parted in the middle with no fringe, cheek-length
  // side locks cut blunt (binsogi) in front of each ear, and the whole fall tied loosely at the
  // small of the back with a white paper band and a red cord, gathering in there and spreading
  // again below it.
  heian(r, m) {
    const side = (dir) => {
      const pts = [[24, 10], [27.2, 10.8], [27.6, 22.6, 1], [21.8, 21.4, 1], [21.8, 14.6]];
      return mass(dir > 0 ? pts : fx(pts), r.base, m, 0.6);
    };
    const upper = sheet({ len: 36, flare: 12.6, ends: 'level', n: 3 }, r, m, 0.7);
    const lower = [mass([[HX - 8.6, 33.6], [HX + 8.6, 33.6], [HX + 11.4, 46], [HX + 12.6, 57.4], [HX - 12.6, 57.4], [HX - 11.4, 46]], r.sh1, m, 0.7),
      streak(HX - 5.6, 37, HX - 8.6, 55, 1.1, -0.6, r.base, m, 0.7), streak(HX + 5.6, 37, HX + 8.6, 55, 1.1, 0.6, r.base, m, 0.7), crease(HX, 57.2, 9, r.sh2)];
    const tie = [F(R(HX - 9.2, 32.2, 18.4, 2.8, PAPER)), F(R(HX - 9.2, 33.8, 18.4, 0.5, PAPER_SH)), F(R(HX - 9.4, 32.9, 18.8, 0.7, CORD)),
      lock([[HX + 1, 33.4], [HX + 1.6, 37], [HX + 0.6, 40.4]], 0.9, CORD, m, 0.8), lock([[HX - 1, 33.4], [HX - 1.8, 36.6], [HX - 1.2, 39.6]], 0.9, CORD_DK, m, 0.8)];
    return {
      head: [crown(r)],
      hang: [napeShadow(r), ...upper, ...lower, ...tie],
      front: bangs('heianpart', r, m, [side(1), side(-1), F(R(21.8, 14.6, 0.7, 6.8, r.sh2)), F(R(8.5, 14.6, 0.7, 6.8, r.sh2))]),
      tips: [46, 52],
    };
  },
  // An imperial high tail: all of it drawn up and tied high at the back of the crown with a red
  // cord and a gold ring, falling in one long, heavy tail to her knees; sharp swept bangs and two
  // long locks framing the face to the chest.
  highqueen(r, m) {
    const tail = [[5.4, 4.6], [1.6, 3.6], [-2.4, 7], [-4.4, 14.6], [-4.8, 23], [-3.6, 31.4], [-4.4, 39.6], [-3.2, 46.6]];
    const light = [[5, 5.6], [1.6, 7], [-1, 13], [-1.6, 21], [-0.8, 29], [-1.4, 36]];
    const tie = [F(E(5.6, 4.8, 2.1, 2.5, CORD)), F(E(5.6, 4.8, 1.3, 1.6, CORD_DK)), F(E(6.4, 4.2, 1.5, 1.8, RINGG)), F(E(6.6, 4, 0.6, 0.7, RINGG_DK)),
      lock([[5, 6.6], [4.2, 11], [4.8, 15.4]], 0.9, CORD, m, 1.1), lock([[5.8, 6.6], [6.2, 10.4], [5.6, 13.6]], 0.8, CORD_DK, m, 1.1)];
    return {
      head: [crown(r), streak(14, 4, 7.4, 4.8, 1, 0.4, r.sh1), streak(17.4, 6, 8.2, 6.6, 1, 0.4, r.sh1)],
      hang: [F(E(HX, 19.6, 8.4, 3.6, r.sh2)), lock(tail, 9, r.sh1, m, 1.1, 0.14), lock(light, 3.8, r.base, m, 1.25), streak(0, 9, -2.6, 20, 0.9, 0.3, r.hi, m, 1.2), ...tie],
      front: bangs('regal', r, m, sideLocks(r, m, [[25.2, 11], [26.8, 18.4], [27, 26.4], [25.8, 33]], undefined, 3.4)),
      top: tie,
      tips: [32, 42],
    };
  },
  // A wild mane: huge, thick and untamed, flaring out round her shoulders in jagged spikes like a
  // fox's ruff or a flame, a few spikes sticking up off the crown behind her ears; jagged bangs.
  foxmane(r, m) {
    const spike = (pts, w, c = r.base, k = 1.15) => [lock(pts, w, c, m, k), lock(fx(pts), w, c, m, k)];
    return {
      head: [crown(r, 1.6), lock([[7, 6], [2.4, 2.6], [-1.8, 2.4]], 4.8, r.sh1, m, 0.8), lock([[6, 9], [1, 8.6], [-3, 10.4]], 4.6, r.sh1, m, 0.8)],
      hang: [...sheet({ len: 46, flare: 18, ends: 'points', n: 7, w0: 13.4, wave: 1.4 }, r, m, 1.05),
        ...spike([[4, 14], [-1.4, 19], [-6, 22.4]], 5.2, r.sh1), ...spike([[3.4, 20], [-2, 27], [-6.4, 31]], 5.4, r.sh1), ...spike([[4, 27], [-0.6, 35], [-4.2, 40.4]], 5, r.sh1)],
      front: bangs('mane', r, m, [...spike([[25, 12.6], [28.4, 17.6], [32.4, 21.4]], 4.6), ...spike([[25, 17], [27.4, 23.6], [31, 28]], 4.2)]),
      tips: [34, 42],
    };
  },
  // Swept back: no fringe, every strand combed straight back off a high brow (her whole face bare
  // and cold), falling long and straight behind her; two loose strands slip forward over the brow.
  sweptback(r, m) {
    return {
      head: [crown(r, 0.4), streak(20.4, 4.6, 8, 4.4, 1.1, 1.2, r.sh1), streak(22.6, 8, 9.6, 8.4, 1, 1, r.sh1), streak(18, 2.4, 9, 2.6, 0.9, 0.8, r.hi)],
      hang: [napeShadow(r), ...sheet({ len: 50, flare: 13.4, ends: 'points', n: 4, wave: 0.8 }, r, m, 0.9)],
      front: bangs('bare', r, m, [
        lock([[19.4, 6.8], [21, 11.4], [20, 15.6], [20.8, 18]], 1.5, r.base, m, 1.3), lock([[17.6, 6.6], [18.4, 10.6], [17.2, 14]], 1.1, r.sh1, m, 1.3),
        ...sideLocks(r, m, [[25, 10.4], [26.6, 17], [26.4, 24], [27.2, 29]], undefined, 2.8)]),
      tips: [38, 46],
    };
  },
  // A bound tail: gathered low at the nape into one thick tail brought forward over her near
  // shoulder, bound every hand's width with gold rings and red cord, so it hangs in segments down
  // the front of her robes and ends in a full brush like a fox's tail; sharp swept bangs and blunt
  // locks at the cheeks.
  boundtail(r, m) {
    const spine = [[24.2, 16], [26.6, 21], [26.4, 27], [27, 33], [26.4, 39], [26.8, 44]];
    const mv = mover(m, 1.1);
    const bands = [];
    for (const y of [22, 28, 34, 40]) {
      const i = spine.findIndex((p) => p[1] >= y);
      const [a, b] = [spine[Math.max(0, i - 1)], spine[i]];
      const t = (y - a[1]) / (b[1] - a[1] || 1);
      const [x, yy] = mv([a[0] + (b[0] - a[0]) * t, y]);
      // (Each ring as wide as the tail is there: it tapers from the shoulder.)
      const hw = 3.6 * (0.55 + 0.45 * (1 - (y - 16) / 28) ** 0.75);
      bands.push(F(E(x, yy, hw, 1.2, RINGG)), F(E(x, yy + 0.5, hw, 0.6, RINGG_DK)), F(E(x, yy - 0.4, hw * 0.7, 0.35, '#fff3c0')), F(E(x, yy + 1.5, hw * 0.95, 0.45, CORD)));
    }
    const [bx, by] = mv([26.8, 44]);
    const brush = poly(smooth([[bx - 3, by - 1], [bx + 3, by - 1], [bx + 4, by + 3.4], P(bx + 2, by + 7.4), [bx, by + 5.6], P(bx - 2.4, by + 7.6), [bx - 4, by + 3.2]]), r.base);
    const side = (dir) => {
      const pts = [[24, 10], [27, 10.8], [27.4, 21, 1], [22, 19.6, 1], [22, 14.6]];
      return mass(dir > 0 ? pts : fx(pts), r.base, m, 0.6);
    };
    return {
      head: [crown(r), streak(18, 4, 9, 9, 1, 0.6, r.sh1), streak(21, 7, 10.6, 13, 1, 0.6, r.sh1)],
      hang: [napeShadow(r), ...sheet({ len: 26, flare: 12, ends: 'level', n: 3 }, r, m, 0.8)],
      front: bangs('regal', r, m, [side(-1), lock(spine, 7, r.base, m, 1.1, 0.55), streak(25.2, 19, 26, 40, 0.9, -0.3, r.hi, m, 1.1), lock([[23.6, 17], [25.4, 26], [25.2, 38]], 1.4, r.sh1, m, 1.1), brush, ...bands, side(1)]),
      tips: [40, 48],
    };
  },
  // A moon river: floor-length hair falling from a centre part in slow, heavy waves, flaring wide
  // below; long curtains frame the face, and a lock falls in front of each shoulder to her waist.
  moonriver(r, m) {
    const front = [[25, 12], [27, 20], [26, 28], [27.6, 35], [26.6, 41]];
    return {
      head: [crown(r, 0.6)],
      hang: [napeShadow(r), ...sheet({ len: 57, flare: 17.6, ends: 'points', n: 6, wave: 2.2, w0: 12.4 }, r, m, 0.9)],
      front: bangs('queenpart', r, m, [lock(front, 4, r.base, m, 1.2, 0.2), streak(25.6, 15, 26.4, 30, 0.8, -0.3, r.hi, m, 1.2), lock(fx(front), 4, r.base, m, 1.2, 0.2)]),
      tips: [44, 52],
    };
  },
});

// ---------- The yokai troupe's own styles ----------
// The oni's: big, wild and heavy, leaving room for his horns.
Object.assign(FRINGES, {
  // A few big, blunt-tipped spikes falling over the brow, the longest between the eyes.
  onispike: { pts: [[24.2, 13.6], [22, 9.8], [20.2, 15], [17.8, 10.2], [15.6, 16.6], [13.2, 10.2], [11, 15], [9.2, 9.8], [6.8, 13.6]], lean: 0.3 },
  // Messy and swept to the far side, long ragged points falling past the far eye.
  onimessy: { pts: [[24.4, 12.6], [23.2, 11.2], [21.8, 13.2], [20.4, 11.4], [18.6, 14], [17.2, 11.8], [15.2, 14.6], [14, 12.2], [11.8, 15], [10.8, 12.8], [8.2, 14.6]], lean: -0.8 },
  // The yuki-onna's blunt bangs: one heavy, perfectly straight cut just above her eyes, casting no
  // shadow on her pale brow (`noShade`).
  yukiblunt: { pts: [[24.6, 14.4], [6.4, 14.4]], lean: 0, blunt: true, noCrease: true, noShade: true },
  // The yuki-onna's: long, thin strands falling over her brow in an uneven curtain, parted a little
  // off-centre, a few wisps longer than the rest.
  yukicurtain: { pts: [[24.6, 17.4], [23.4, 13.8], [22, 16.4], [20.6, 12.6], [19.2, 15], [17.6, 11.2], [16, 13.6], [14.6, 10.8], [13, 14.6], [11.4, 12.4], [9.8, 16.2], [8.4, 13.4], [6.6, 17]], lean: 0, softTips: true },
  // Short and choppy, pushed up off the brow (the hair all dragged up into the topknot).
  onishort: { pts: [[24.4, 11.6], [22.8, 9.2], [21, 11], [19, 8.4], [16.8, 10], [14.6, 8.2], [12.4, 10], [10.2, 8.6], [8.4, 10.6], [6.6, 11.6]], lean: 0.4 },
});
Object.assign(STYLES, {
  // Silver and messy (the crimson oni's): long, thick and tousled, falling past her shoulders in
  // ragged locks that flick out, a big messy lock over each cheek, bangs swept across.
  onisilver(r, m) {
    const flick = (pts, w, c = r.base, k = 1.1) => [lock(pts, w, c, m, k), lock(fx(pts), w, c, m, k)];
    return {
      head: [crown(r, 1), ...flick([[9.6, 3.4], [6.4, 1.2], [3.6, 1.8]], 3.6, r.sh1, 0.6)],
      hang: [napeShadow(r), ...sheet({ len: 40, flare: 15.4, ends: 'points', n: 6, w0: 12.8, wave: 1.2 }, r, m, 1), ...flick([[4.2, 18], [0.6, 24], [-2.2, 28]], 4.4, r.sh1), ...flick([[4.6, 28], [1.6, 34], [0, 38]], 3.8, r.sh1)],
      front: bangs('onimessy', r, m, [...sideLocks(r, m, [[25.2, 11], [27, 17.6], [26.6, 24], [28, 28.6]], undefined, 3.6), ...flick([[25, 15], [28.4, 20], [30.4, 22]], 3)]),
      tips: [30, 38],
    };
  },
  // Messy high twintails (the oni's bratty look): two thick, spiky tails tied high behind her horns
  // with crimson cord, bouncing out and down to her waist in jagged points; messy bangs.
  onitwin(r, m) {
    const tail = [[5.6, 6], [1.4, 8.4], [-2, 14], [-3, 21], [-1.6, 27], [-3, 32]];
    const tufts = (flip) => [lock(flip(tail), 7.4, r.sh1, m, 1.1, 0.12), lock(flip([[5, 8], [1.6, 12], [0.4, 19], [1, 25]]), 3.2, r.base, m, 1.2),
      lock(flip([[4, 10], [-1.4, 15], [-4.6, 17]]), 3, r.sh1, m, 1.15), lock(flip([[3.4, 16], [-1.8, 22], [-4, 24]]), 2.8, r.sh1, m, 1.15)];
    const ties = [F(E(5.4, 6.4, 1.6, 1.9, '#d8303a')), F(E(25.6, 6.4, 1.6, 1.9, '#d8303a'))];
    return {
      head: [crown(r, 0.6)],
      hang: [napeShadow(r), ...tufts((p) => p), ...tufts(fx), ...ties],
      front: bangs('onimessy', r, m, sideLocks(r, m, [[25, 11], [26.4, 16.4], [26, 20.4]], undefined, 3)),
      top: ties,
      tips: [99, 99],
    };
  },
  // A jagged bob (the oni's sleepy-menace look): cut in rough points just below the jaw, with two
  // long front locks falling to her chest; heavy messy bangs.
  onibob(r, m) {
    const side = (dir) => {
      const pts = [[24, 9.6], [27.6, 11], [28.6, 18], [27.4, 23.4, 1], [25.6, 20.6], [24.6, 24.4, 1], [23, 19.4], [22.2, 14]];
      return mass(dir > 0 ? pts : fx(pts), r.base, m, 0.7);
    };
    return {
      head: [crown(r, 0.8)],
      hang: sheet({ len: 26, flare: 14, ends: 'points', n: 6, w0: 12.6, wave: 0.6 }, r, m, 0.8),
      front: bangs('onimessy', r, m, [side(1), side(-1), ...sideLocks(r, m, [[23.4, 12], [24.6, 20], [24.2, 28], [25.2, 33]], undefined, 2.8)]),
      tips: [99, 99],
    };
  },
  // A long high ponytail (the oni's cool look): everything swept up and back into one long, thick
  // tail tied with crimson cord at the crown, falling to the backs of her knees in a jagged brush;
  // spiky bangs and short side locks.
  onipony(r, m) {
    const tail = [[7.4, 3.6], [2.4, 3.4], [-2, 8], [-3.6, 16], [-3.4, 25], [-4.6, 34], [-3.4, 42]];
    const tie = [F(E(7.6, 4, 1.8, 2.2, '#d8303a')), F(E(7.6, 4, 1, 1.3, '#8e1c16'))];
    return {
      head: [crown(r, 0.4), streak(20, 5, 10, 4, 1, 0.5, r.sh1), streak(22, 9, 11, 7, 0.9, 0.5, r.sh1)],
      hang: [napeShadow(r), lock(tail, 8.4, r.sh1, m, 1.1, 0.14), lock([[7, 4.6], [2.6, 6], [-0.4, 13], [-0.6, 22], [-1.6, 30]], 3.6, r.base, m, 1.2),
        lock([[-3, 38], [-6.4, 44], [-6, 41]], 3, r.sh1, m, 1.1), lock([[-3, 38], [-1, 45.4], [-2, 42]], 3, r.sh1, m, 1.1), ...tie],
      front: bangs('onispike', r, m, sideLocks(r, m, [[25, 11], [26.2, 16], [25.8, 20]], undefined, 2.8)),
      top: tie,
      tips: [99, 99],
    };
  },
  // The yuki-onna's: straight and heavy, falling to the floor behind her like a black waterfall,
  // two long locks in front of her shoulders to her waist; a thin uneven curtain of bangs.
  yukistraight(r, m) {
    const front = [[24.8, 12], [26, 20], [25.6, 28], [26.2, 36], [25.8, 42]];
    return {
      head: [crown(r, 0.3)],
      hang: [napeShadow(r), ...sheet({ len: 58, flare: 14.6, ends: 'level', n: 4, wave: 0.4, w0: 12 }, r, m, 0.7)],
      front: bangs('yukicurtain', r, m, [lock(front, 3.4, r.base, m, 1.1, 0.4), lock(fx(front), 3.4, r.sh1, m, 1.1, 0.4)]),
      tips: [44, 54],
    };
  },
  // The yuki-onna's, with blunt bangs: straight to the floor, heavy blunt bangs, and blunt side
  // locks cut level at her jaw (a hime cut of her own).
  yukihime(r, m) {
    const side = (dir) => {
      const pts = [[24, 10.4], [27.4, 11], [27.6, 24.4, 1], [22, 24.4, 1], [21.8, 16]];
      return mass(dir > 0 ? pts : fx(pts), r.base, m, 0.6);
    };
    return {
      head: [crown(r, 0.3)],
      hang: [napeShadow(r), ...sheet({ len: 58, flare: 14.6, ends: 'level', n: 4, wave: 0.3, w0: 12 }, r, m, 0.7)],
      front: bangs('yukiblunt', r, m, [side(1), side(-1), F(R(21.9, 15, 0.6, 9.2, r.sh2)), F(R(8.6, 15, 0.6, 9.2, r.sh2))]),
      tips: [44, 54],
    };
  },
  // Four more of the yuki-onna's, all with her blunt bangs:
  // A blunt bob: cut straight and level at her jaw all the way round, sleek and heavy, a thin
  // longer lock falling in front of each ear to her collarbone.
  yukibob(r, m) {
    const side = (dir) => {
      const pts = [[24, 10.4], [27.6, 11.4], [28.2, 23.8, 1], [21.8, 23.8, 1], [21.8, 15.4]];
      return mass(dir > 0 ? pts : fx(pts), r.base, m, 0.5);
    };
    const thin = [[23.6, 14], [24.4, 22], [24, 29]];
    return {
      head: [crown(r, 0.6)],
      hang: sheet({ len: 25, flare: 13.4, ends: 'level', n: 3, w0: 12.6 }, r, m, 0.6),
      front: bangs('yukiblunt', r, m, [side(1), side(-1), lock(thin, 1.6, r.sh1, m, 1.1, 0.5), lock(fx(thin), 1.6, r.sh1, m, 1.1, 0.5)]),
      tips: [99, 99],
    };
  },
  // A high bun pinned with icicle hairpins, the rest falling long and straight behind her to her
  // knees; blunt side locks at her cheeks.
  yukibun(r, m) {
    const side = (dir) => {
      const pts = [[24, 10.4], [27.2, 11], [27.4, 21.4, 1], [22, 20.6, 1], [22, 15.4]];
      return mass(dir > 0 ? pts : fx(pts), r.base, m, 0.5);
    };
    // Icicle pins: stout ice crystals pushed through the bun at an angle, a snowflake on the side.
    const icicle = (x, y, dir) => [F(T([[x - dir * 0.4, y + 1.4], [x + dir * 2.4, y - 1.6], [x + dir * 6.4, y - 4.6], [x + dir * 1, y + 1.6]], '#cfe4fb')), F(T([[x + dir * 0.8, y + 0.2], [x + dir * 2.4, y - 1], [x + dir * 5.4, y - 3.6]], '#ffffff')),
      F(T([[x - dir * 0.2, y + 1.2], [x + dir * 1.6, y + 1.2], [x + dir * 1, y + 5.2]], '#b8d4f2'))];
    const flakeAt = (x, y, r0) => [0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI;
      return F(T([[x - Math.cos(a) * r0, y - Math.sin(a) * r0 - 0.25], [x + Math.cos(a) * r0, y + Math.sin(a) * r0 - 0.25], [x + Math.cos(a) * r0, y + Math.sin(a) * r0 + 0.25], [x - Math.cos(a) * r0, y - Math.sin(a) * r0 + 0.25]], '#9cc8f0'));
    });
    const pins = [...icicle(19.6, 0.4, 1), ...icicle(11.4, 0.8, -1), ...flakeAt(20.6, 3.4, 1.6), F(E(20.6, 3.4, 0.5, 0.5, '#ffffff'))];
    const knot = [F(E(15.5, 1.2, 6, 4.6, r.sh1)), F(E(15.5, 0.6, 5, 3.8, r.base)), streak(12.6, -1, 18, -1.6, 0.9, 0.6, r.hi), streak(13, 2, 17.6, 1, 0.6, 0.4, r.sh1)];
    return {
      head: [crown(r, 0.2), ...knot],
      hang: [napeShadow(r), ...sheet({ len: 46, flare: 13, ends: 'level', n: 4, w0: 11.6 }, r, m, 0.7)],
      front: bangs('yukiblunt', r, m, [side(1), side(-1), ...pins]),
      top: [...pins, ...knot],
      tips: [99, 99],
    };
  },
  // Two long low tails tied at her nape with white paper bands, hanging straight down her back to
  // her ankles, swaying apart as she moves; blunt side locks.
  yukitails(r, m) {
    const side = (dir) => {
      const pts = [[24, 10.4], [27.2, 11], [27.4, 22.4, 1], [22, 21.4, 1], [22, 15.4]];
      return mass(dir > 0 ? pts : fx(pts), r.base, m, 0.5);
    };
    const tail = [[8.6, 20], [7, 28], [6.4, 38], [6.8, 48], [6.2, 54]];
    const band = (x) => [F(R(x - 2.4, 21, 4.8, 2.4, '#ffffff')), F(R(x - 2.4, 22, 4.8, 0.5, '#d6def2')), lock([[x, 23.4], [x - 0.4, 25.4], [x - 0.6, 27]], 1, '#ffffff', null)];
    return {
      head: [crown(r, 0.3)],
      hang: [napeShadow(r), lock(tail, 6, r.sh1, m, 1, 0.45), lock(fx(tail), 6, r.sh1, m, 1, 0.45), lock([[8.6, 22], [7.6, 34], [7.4, 46]], 2, r.base, m, 1.1), lock(fx([[8.6, 22], [7.6, 34], [7.4, 46]]), 2, r.base, m, 1.1),
        ...band(8.4), ...band(22.6)],
      front: bangs('yukiblunt', r, m, [side(1), side(-1)]),
      tips: [99, 99],
    };
  },
  // Long and straight, its ends turning to frost: past her knees the hair thins into icy points and
  // drifting crystals; blunt bangs and jaw-length side locks.
  yukifrost(r, m) {
    const side = (dir) => {
      const pts = [[24, 10.4], [27.4, 11], [27.6, 24, 1], [22, 23, 1], [22, 15.4]];
      return mass(dir > 0 ? pts : fx(pts), r.base, m, 0.5);
    };
    const mv = mover(m, 0.8);
    const crystals = [[4, 50], [9, 54], [15, 52.6], [21, 54.4], [26, 50.4]].map(([x, y]) => {
      const [cx, cy] = mv([x, y]);
      return F(T([[cx, cy - 1.4], [cx + 0.8, cy], [cx, cy + 1.4], [cx - 0.8, cy]], '#d8ecff'));
    });
    return {
      head: [crown(r, 0.3)],
      hang: [napeShadow(r), ...sheet({ len: 49, flare: 15, ends: 'points', n: 7, w0: 12 }, r, m, 0.7), ...crystals],
      front: bangs('yukiblunt', r, m, [side(1), side(-1)]),
      tips: [34, 42],
    };
  },
  // The yuki-onna's: long soft waves of silver, loose to the backs of her knees, a wave over each
  // cheek; curtain bangs.
  yukiwave(r, m) {
    const front = [[25, 12], [27.2, 18], [26, 24], [27.6, 30], [26.4, 36]];
    return {
      head: [crown(r, 0.8)],
      hang: [napeShadow(r), ...sheet({ len: 50, flare: 16.4, ends: 'curls', n: 5, wave: 2.4, w0: 12.6 }, r, m, 0.85)],
      front: bangs('yukicurtain', r, m, [lock(front, 3.8, r.base, m, 1.2, 0.3), lock(fx(front), 3.8, r.sh1, m, 1.2, 0.3)]),
      tips: [38, 46],
    };
  },
  // The yuki-onna's: white hair lifted and streaming out behind her as if in a blizzard wind, long
  // strands flying back from the crown; wild uneven bangs.
  yukistorm(r, m) {
    const fly = (pts, w, c = r.base, k = 1.3) => lock(pts, w, c, m, k, 0.1);
    return {
      head: [crown(r, 0.6), fly([[10, 4], [2, 1], [-8, 2], [-16, 5]], 5, r.sh1, 0.6), fly([[9, 8], [0, 7], [-10, 10], [-18, 14]], 5.4, r.sh1, 0.6)],
      hang: [napeShadow(r), fly([[6, 14], [-3, 16], [-12, 20], [-20, 25]], 6, r.sh1), fly([[6, 20], [-2, 25], [-9, 31], [-15, 38]], 5.6, r.sh1), fly([[8, 24], [3, 32], [-2, 40], [-6, 47]], 5, r.sh1),
        fly([[7, 10], [-4, 10], [-14, 13], [-22, 18]], 3, r.base), fly([[7, 18], [-3, 21], [-11, 26], [-18, 32]], 3, r.base)],
      front: bangs('yukicurtain', r, m, [fly([[25, 12], [27, 18], [25, 25], [22, 31]], 3, r.base, 1.4)]),
      tips: [99, 99],
    };
  },
  // A wild mane: thick spikes standing up off the crown and flaring out round his head and nape,
  // shaggy at the back; big spiky bangs.
  onimane(r, m) {
    const spike = (pts, w, c = r.base, k = 1.05) => [lock(pts, w, c, m, k), lock(fx(pts), w, c, m, k)];
    return {
      head: [crown(r, 1.4), ...spike([[11, 4], [8.4, -0.6], [6.4, -3.4]], 4.6, r.sh1, 0.6), ...spike([[13.6, 3], [13, -1.6], [12.6, -4.6]], 4, r.sh1, 0.5)],
      hang: [...sheet({ len: 27, flare: 15.6, ends: 'points', n: 6, w0: 13.2, wave: 0.8 }, r, m), ...spike([[4.4, 13], [0.4, 15.4], [-3.6, 16]], 4.8, r.sh1), ...spike([[4, 19], [0.6, 23], [-2.6, 25]], 4.4, r.sh1)],
      front: bangs('onispike', r, m, spike([[25, 12], [28.4, 16], [31.4, 18.4]], 4.2)),
      tips: [22, 27],
    };
  },
  // A topknot: everything dragged up tight into one thick knot standing up off his crown, bound
  // with a rope, the end flopping back; short and choppy at the brow.
  onitopknot(r, m) {
    const knot = [lock([[15.5, 3.6], [14.4, -1.6], [11.6, -4.2], [8.4, -3.6], [6.6, -1.4]], 5.4, r.base, m, 0.6, 0.35),
      F(E(15.2, 2.6, 2.6, 1.8, r.sh1)), F(R(13, 0.8, 4.6, 1.4, '#e8d9b0')), F(R(13, 1.4, 4.6, 0.4, '#b8a272')),
      streak(14.6, -1, 11.4, -3.6, 0.8, 0.3, r.hi, m, 0.6)];
    return {
      head: [crown(r, 0.2), streak(20, 5, 15.6, 2.4, 0.9, 0.4, r.sh1), streak(11, 5, 15.4, 2.4, 0.9, -0.4, r.sh1), ...knot],
      hang: [napeShadow(r, 19)],
      front: bangs('onishort', r, m),
      top: knot,
      tips: [99, 99],
    };
  },
  // A war mane: long, shaggy and heavy, falling to the middle of his back in thick jagged locks,
  // flicking out at the shoulders; big spiky bangs.
  oniwhite(r, m) {
    const flick = (pts, w, c = r.base, k = 1.1) => [lock(pts, w, c, m, k), lock(fx(pts), w, c, m, k)];
    return {
      head: [crown(r, 1.2), ...flick([[9, 4], [5.4, 1.4], [2.4, 1.8]], 4.4, r.sh1, 0.7)],
      hang: [...sheet({ len: 44, flare: 17, ends: 'points', n: 7, w0: 13, wave: 1.6 }, r, m, 1), ...flick([[4, 16], [-0.6, 21], [-4, 24]], 5, r.sh1), ...flick([[4, 25], [0.4, 32], [-2.6, 37]], 4.6, r.sh1)],
      front: bangs('onispike', r, m, [...flick([[25, 12.4], [28, 18.6], [30.6, 24]], 4.4), ...flick([[25, 17], [26.6, 24], [29, 30]], 3.8)]),
      tips: [32, 40],
    };
  },
});

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
