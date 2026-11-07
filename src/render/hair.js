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
import { R, E, T, F, mix } from './pixel.js';

const HX = 15.5;
const CY = 13.2;

// Fifty-two styles: anime, princess and fantasy, cool, punk and cute, a doll's, then short,
// tomboy, evil and cosplay cuts, men's cuts, and the redraw's ten new ones.
export const HAIR_STYLES = ['candy', 'drills', 'sidetail', 'catbun', 'princess', 'bowhair', 'hime', 'crownbraid', 'odango', 'wolf', 'swoop', 'ponytail', 'halfup', 'pixie', 'fluffybob', 'wavylong', 'cloud', 'lowtails', 'braids', 'wolfsleek', 'kokeshi',
  'bowlcut', 'sidecrop', 'curlycrop', 'tomboy', 'stubtail', 'shavedside', 'vampire', 'demonbuns', 'hexlong', 'magical', 'idol', 'samurai',
  'crewcut', 'curtains90', 'slickback', 'buzzcut', 'comma', 'longtied', 'mullet', 'surfer', 'hightop',
  'ribbonbuns', 'hearttails', 'shoulderbraid', 'sharpbob', 'undercuthime', 'cascade', 'starbuns', 'feathertips', 'messycrop', 'pompadour'];
// Older styles draw as the closest current one; anything else unknown draws as the first.
const RETIRED = {
  twintails: 'candy', bob: 'fluffybob', curtain: 'halfup', short: 'pixie', sweep: 'swoop', eyecover: 'swoop', undercut: 'swoop', quiff: 'wolfsleek', hero: 'wolfsleek',
  mohawk: 'wolfsleek', spiky: 'wolfsleek', bun: 'odango', topknot: 'odango', long: 'wavylong', wavy: 'wavylong', fluffy: 'wavylong', curly: 'cloud', ahoge: 'pixie', braid: 'braids',
};
// Styles only one character wears (not offered in the creator or the salon).
const OWN_HAIR = ['villainess'];
export const hairStyleOf = (look) => {
  const s = RETIRED[look.hairStyle] ?? look.hairStyle;
  return HAIR_STYLES.includes(s) || OWN_HAIR.includes(s) ? s : HAIR_STYLES[0];
};
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
  const ph = ((m.wave ?? 0) * Math.PI) / 6;
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
  const body = poly([...L, ...R.reverse()], c);
  if (w < 5 || !m) return body;
  // A big hanging lock (a tail) is several strands (the hero redraw): fine dark gaps and a light
  // strand run down it, pointed at both ends, following its curve as it swings.
  const along = (o, t0, t1, ww) => {
    const a = [];
    const z = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      if (t < t0 || t > t1) continue;
      const u = (t - t0) / (t1 - t0);
      const mid = [L[i][0] + (R[n - 1 - i][0] - L[i][0]) * (0.5 + o / 2), L[i][1] + (R[n - 1 - i][1] - L[i][1]) * (0.5 + o / 2)];
      const hw = ww * Math.sin(Math.PI * u) * (1 - t * 0.4);
      a.push([mid[0] - hw, mid[1]]);
      z.push([mid[0] + hw, mid[1]]);
    }
    return a.length > 2 ? [...a, ...z.reverse()] : null;
  };
  const dark = mix(c, '#3a2650', 0.28);
  const light = mix(c, '#ffffff', 0.22);
  const lines = [[-0.42, 0.06, 0.8, w * 0.07, light], [0.08, 0.1, 0.9, w * 0.06, dark], [0.5, 0.16, 0.72, w * 0.05, dark]];
  return [body, ...lines.map(([o, t0, t1, ww, col]) => { const pts = along(o, t0, t1, ww); return pts && poly(pts, col); }).filter(Boolean)];
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

// The angel ring (the hero redraw, 2026-11): a glossy band following the skull, broken by the
// strands into a few lens-shaped pieces, each fattest in the middle and tapering to points, with a
// bright core along its upper edge, like light on smooth hair.
function ring(c, cx = HX, cy = 9.6, rx = 8.6, ry = 5.2, a0 = 214, a1 = 326, parts = 3) {
  const out = [];
  const gap = 6;
  const span = (a1 - a0 - gap * (parts - 1)) / parts;
  const core = mix(c, '#ffffff', 0.25);
  for (let k = 0; k < parts; k++) {
    const s0 = a0 + k * (span + gap);
    const band = (th, lift) => {
      const top = [];
      const bot = [];
      for (let i = 0; i <= 10; i++) {
        const a = ((s0 + (span * i) / 10) * Math.PI) / 180;
        const d = th * Math.sin((Math.PI * i) / 10) ** 0.7;
        top.push([cx + (rx - lift) * Math.cos(a), cy + (ry - lift) * Math.sin(a)]);
        bot.push([cx + (rx - lift - d) * Math.cos(a), cy + (ry - lift - d) * Math.sin(a)]);
      }
      return [...top, ...bot.reverse()];
    };
    out.push(poly(band(2.0, 0), c));
    out.push(poly(band(0.8, 0.3), core));
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
  const ph = ((m?.wave ?? 0) * Math.PI) / 6;
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
    // (The hero redraw: dark gaps between the clumps, and a fine bright strand on the outer one.)
    extra.push(streak(xa - dir * 1.6, top + 4, xb - dir * 1.8 + wave * 0.4, foot - 3, 0.6, -0.7 * dir, r.sh2));
    extra.push(streak(xa - dir * 5.2, top + 8, xb - dir * 5.6, foot - 5, 0.5, -0.4 * dir, r.sh2));
    extra.push(streak(xa + dir * 0.8, top + 5, xb + dir * 0.6 + wave * 0.6, foot - 6, 0.45, -0.9 * dir, r.hi));
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
  soft: { pts: [[23.8, 13], [22.2, 10.4], [20.4, 15.4], [18.2, 10.8], [15.6, 16.8], [13, 10.8], [10.6, 15.2], [8.8, 10.6], [7.2, 13.2]], lean: 0.9, gentle: true },
  // Blunt: one heavy straight cut low on the brow, with tiny V notches.
  blunt: { pts: [[23.6, 14.8], [22.9, 13.9], [22.2, 14.9], [18.9, 15], [18.3, 14], [17.7, 15], [13.4, 15], [12.8, 14], [12.2, 15], [8.9, 14.9], [8.3, 13.9], [7.6, 14.8]], lean: 0, blunt: true },
  // Wispy: soft separate strands of uneven length with rounded tips, a little forehead showing
  // between them.
  wispy: { pts: [[23.8, 13.4], [22.4, 10.8], [20.6, 15], [19, 11], [16.8, 15.8], [15.2, 11.2], [13, 15.4], [11.4, 11], [9.4, 14.6], [8, 11.6], [7, 13.2]], lean: -0.4, softTips: true, gentle: true },
  // Swept: a strong diagonal from high on the near side down past the far eye.
  swept: { pts: [[23.4, 10.4], [22.2, 8.6], [20.4, 12.2], [19, 9.8], [16.6, 14.4], [15.4, 11.6], [12.6, 16.4], [11.8, 13.2], [9, 17.6], [8.4, 14.6], [6.6, 16.8]], lean: -1.4, part: [[21.4, 3.8], [23, 7]], gentle: true },
  // Parted in the middle, curving apart to open a triangle of forehead.
  part: { pts: [[23.4, 15.2], [21.8, 12.4], [20.2, 14.2], [18.2, 11.2], [16.4, 10.2], [HX, 9.4], [14.6, 10.2], [12.8, 11.2], [10.8, 14.2], [9.2, 12.4], [7.6, 15.2]], lean: 0, part: [[HX, 2.2], [HX, 8.6]], softTips: true, noCrease: true },
  // Hime: one heavy, perfectly straight line low on the brow, no notches.
  hime: { pts: [[24.4, 15.6], [6.6, 15.6]], lean: 0, blunt: true, noCrease: true },
  // Short and choppy, high on the brow.
  short: { pts: [[23, 12.4], [21.4, 10.2], [19.6, 13], [17.6, 10.4], [15.2, 13.4], [13.2, 10.6], [11, 13], [9.2, 10.6], [7.6, 12.4]], lean: 0.5, gentle: true },
  // Jagged spikes of every length, one long between the eyes.
  spiky: { pts: [[23.6, 13.4], [21.6, 10.2], [19.8, 15], [17.8, 10.4], [15.4, 17.6], [13.4, 10.6], [10.8, 15.4], [9, 10.2], [7.4, 13.4]], lean: 0.4, gentle: true },
  // Curtain: parted in the middle, sweeping out to the cheekbones, short at the centre.
  curtain: { pts: [[23.6, 17.2], [22.4, 14], [20.6, 12], [18.4, 10.8], [HX, 10.2], [12.6, 10.8], [10.4, 12], [8.6, 14], [7.4, 17.2]], lean: 0, plain: true, part: [[HX, 2.2], [HX, 9.6]] },
  // Swept back: no fringe at all, the hairline high so the whole brow shows.
  slicked: { pts: [[24.4, 10.6], [20.6, 8], [HX, 7], [10.4, 8], [6.6, 10.6]], lean: 0, plain: true },
  // Baby bangs: very short and straight, high on the forehead.
  baby: { pts: [[23.4, 11.4], [22.8, 10.5], [22.2, 11.5], [17.8, 11.6], [17.2, 10.6], [16.6, 11.6], [13.2, 11.6], [12.6, 10.6], [12, 11.6], [7.6, 11.4]], lean: 0, blunt: true },
  // Heavy: three big thick clumps down to the eyes.
  heavy: { pts: [[23.8, 15.6], [21.4, 11], [19.2, 17.2], [16.6, 11], [13.6, 17.4], [11.2, 11], [8.6, 16.6], [7.2, 14.2]], lean: 0.5, softTips: true, gentle: true },
  // M-shape: short in the middle, longer at the sides.
  mshape: { pts: [[23.6, 15.8], [21.8, 12.4], [19.8, 14.8], [17.8, 11.2], [HX, 12.4], [13.2, 11.2], [11.2, 14.8], [9.2, 12.4], [7.4, 15.8]], lean: 0, softTips: true, gentle: true },
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
  // Gentle bangs (the player's): rounded tips and shallower notches, so they read as soft clumps
  // of hair rather than thin spiky strips.
  const fp = f.gentle ? f.pts.map(([x, y], i) => (i % 2 && f.pts[i + 1] ? [x, y + 0.6 * ((f.pts[i - 1][1] + f.pts[i + 1][1]) / 2 - y)] : [x, y])) : f.pts;
  const edge = [];
  fp.forEach((p, i) => {
    // Soft tips round off (the notches between them stay crisp).
    edge.push(f.round || f.plain || ((f.softTips || f.gentle) && i % 2 === 0) ? p : P(...p));
    const b = fp[i + 1];
    if (b && !f.blunt && !f.round && !f.plain) edge.push([(p[0] + b[0]) / 2 + f.lean, (p[1] + b[1]) / 2]);
  });
  const outline = smooth([...dome(160, 380), [26.4, 14.6], P(24.8, 12), ...edge, P(6.2, 12), [4.6, 14.6]]);
  const flutter = mover(m && { root: 0, tip: m.tip * 0.4, wave: m.wave }, 0.35, 9, 8);
  const pts = dense(outline, 1.2).map(flutter);
  // Side hair over the ears and the sides of the head, so no skin or skull ever shows between
  // the bangs and the hair behind (elf ears are long enough to poke out past it).
  // (`shortSides`: cut short over the ears, tapering to a sideburn, for a man's cut; `cropSides`:
  // cropped closer still, hugging the head.)
  const side = f.cropSides ? [[23, 7], [26.4, 8.6], [27.2, 12], [26.6, 15.6], [25.2, 17.2], [24.4, 14.6], [23.6, 11]] : f.shortSides ? [[22.4, 5.8], [27.6, 7.4], [29.2, 11], [29, 15.6], [26, 19.8], [24.8, 20.6], [24.2, 17.4], [23.4, 11.6]] : [[24.6, 10.6], [27.4, 12.4], [28, 17.4], [27.4, 21.6], [25.8, 22.4], [24.6, 19.6], [24.2, 14.6]];
  const sideHair = [poly(smooth(side), r.base), poly(smooth(side.map(([x, y]) => [31 - x, y])), r.base)];
  const shapes = [...sideHair, poly(pts, r.base)];
  // Creases rise from the notches.
  if (f.noCrease || f.plain) {
    // no creases
  } else if (!f.round) {
    const notches = f.blunt ? fp.filter((_, i) => i % 3 === 1) : fp.filter((_, i) => i % 2 === 1);
    for (const [x, y] of notches) shapes.push(crease(x, y, f.blunt ? 2.4 : f.gentle ? 2 : 3.4, f.gentle ? r.sh1 : r.sh2, f.lean * 0.5));
  } else {
    for (let i = 1; i < f.pts.length; i += 2) shapes.push(poly(smooth([[f.pts[i][0] - 1.4, f.pts[i][1] - 1.2], [f.pts[i][0], f.pts[i][1] - 0.2], [f.pts[i][0] + 1.4, f.pts[i][1] - 1.2], [f.pts[i][0], f.pts[i][1] - 0.7]]), r.sh1));
  }
  // Strand clumps (the hero redraw): a dark gap rises from each notch toward the crown, and a lighter
  // strand runs down the middle of each clump to its tip, so the bangs read as locks of hair.
  if (!f.plain && !f.round && !f.noCrease) {
    fp.forEach(([x, y], i) => {
      const toCrown = (t) => [x + (HX - x) * t, y + (3.2 - y) * t];
      if (i % 2 === 1 && !f.blunt) shapes.push(streak(...toCrown(0.62), x + f.lean * 0.3, y - 0.8, 0.95, 0, r.sh2));
      else if (i % 2 === 0 && i > 0 && i < fp.length - 1) shapes.push(streak(...toCrown(0.5), x, y - 2.2, 0.75, 0, r.hi));
    });
  }
  // A blunt or rounded fringe has no notches to break it into clumps, so fine strands run down
  // it instead, stopping short of the cut edge (the hero redraw).
  if ((f.blunt || f.round || f.noCrease) && !f.plain && fp.length > 1) {
    const xs = fp.map((p) => p[0]);
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
    const hem = fp.reduce((s, p) => s + p[1], 0) / fp.length;
    for (let k = 1; k <= 6; k++) {
      const x = x0 + ((x1 - x0) * k) / 7;
      shapes.push(streak(x + (HX - x) * 0.3, 4.4, x, hem - 1.3, k % 2 ? 0.55 : 0.65, 0, k % 2 ? r.sh1 : r.hi));
    }
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
  return { shapes: [...shapes, ...extra, ...(shine && !f.noShine ? ring(r.hi) : [])], shade: f.noShade ? [] : shade, hairline: !f.plain && !f.noShade };
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

// ---------- Short, tomboy, evil and cosplay ----------
// Three of each, made of hair alone, soft rounded ends, nothing jagged.
Object.assign(FRINGES, {
  // A short neat side part: swept bangs cut high, the sides cropped close over the ears.
  sweptcrop: { pts: [[23.4, 10.2], [22.2, 8.4], [20.4, 11.4], [19, 9.4], [16.6, 12.8], [15.4, 10.8], [12.6, 14], [11.8, 11.8], [9, 14.6], [8.4, 12.6], [6.6, 13.8]], lean: -1.2, part: [[21.4, 3.8], [23, 7]], gentle: true, shortSides: true },
  // Tight curls along the brow, the sides cropped close.
  curlycrop: { pts: [[23.6, 12.4], [21.8, 13.4], [19.8, 12.4], [17.8, 13.8], [15.6, 12.6], [13.4, 13.8], [11.2, 12.4], [9.2, 13.4], [7.6, 12.4]], lean: 0, round: true, shortSides: true },
  // A long floppy fringe falling across from a part on the near side, uneven, soft-tipped.
  flop: { pts: [[23.8, 11.6], [22.6, 9.2], [21, 13.6], [19.4, 10.6], [17, 15.4], [15.6, 12], [12.8, 16.6], [11.8, 13.4], [9.2, 17], [8.6, 14.2], [6.8, 15.6]], lean: -1.3, part: [[22, 2.6], [23.2, 7.6]], gentle: true },
  // The same flop with the near side shaved: a deep part, the hair all thrown to the far side.
  flopside: { pts: [[24.2, 9.4], [22.8, 7.6], [21.2, 11.6], [19.6, 9.6], [17.2, 14.4], [15.8, 11.4], [13, 16], [12, 13], [9.4, 17], [8.8, 14], [6.8, 15.8]], lean: -1.4, part: [[23, 2], [24, 7.4]], gentle: true, shortSides: true },
  // A widow's peak: no fringe, the hairline dipping to a point in the middle of the brow, the hair
  // combed straight back.
  widow: { pts: [[24.6, 12.4], [21.8, 8.6], [18.4, 7.2], P(HX, 10.2), [12.6, 7.2], [9.2, 8.6], [6.4, 12.4]], lean: 0, plain: true, strands: [[18.6, 7.6, 12.6, 2.4, 0.9, 0.5], [21.6, 9, 16, 2.4, 0.8, 0.5], [13, 7.6, 8.4, 3.6, 0.8, 0.4]] },
});
// A short back: the hair behind the skull stopping at the nape, with a few soft tufts.
const shortBack = (r, m, low = 21) => mass([[6, low - 1], P(4.4, low + 0.6), [3.6, 15], [3.8, 9], [7, 3], [13.2, 1.2], [20, 1.4], [26.4, 6], [27.4, 12], [26.8, low - 2], P(25, low + 0.4), [21, low - 0.6], P(15.5, low + 1.6), [10, low - 0.6]], r.sh1, m, 0.5);
// A soft heart of hair: two round lobes and a rounded point, with a hollow line down the middle.
const heart = (x, y, s, r) => [
  poly(smooth([[x, y - 1.2 * s], [x - 1.4 * s, y - 2.6 * s], [x - 3.2 * s, y - 1.8 * s], [x - 3 * s, y + 0.4 * s], [x - 1.4 * s, y + 2 * s], P(x, y + 3.2 * s), [x + 1.4 * s, y + 2 * s], [x + 3 * s, y + 0.4 * s], [x + 3.2 * s, y - 1.8 * s], [x + 1.4 * s, y - 2.6 * s]]), r.base),
  streak(x, y - 1, x, y + 2.6 * s, 0.6, 0, r.sh1),
  streak(x - 2.4 * s, y - 1.6 * s, x - 1 * s, y - 2.2 * s, 0.7, 0.3, r.hi),
];
Object.assign(STYLES, {
  // ----- Short -----
  // Bowl cut: a round glossy helmet cut level all the way round just under the ears, blunt bangs.
  bowlcut(r, m) {
    const side = (dir) => {
      const p = [[24, 9.6], [28.2, 10.4], [28.8, 19, 1], [22.6, 19, 1], [22.6, 14]];
      return mass(dir > 0 ? p : fx(p), r.base, m, 0.4);
    };
    const helmet = [[HX, 0.4], [24.8, 2.4], [29.4, 8.6], [30, 15], P(29.8, 19.4), P(1.2, 19.4), [1, 15], [1.6, 8.6], [6.2, 2.4]];
    return {
      head: [mass(helmet, r.sh1, m, 0.3), F(R(1.6, 18.2, 28, 1, r.sh2))],
      hang: [],
      front: bangs('blunt', r, m, [side(1), side(-1), F(R(22.6, 17.8, 6.2, 1.2, r.sh1)), F(R(2.2, 17.8, 6.2, 1.2, r.sh1))]),
      tips: [16, 19],
    };
  },
  // A neat short crop parted at the side, the bangs swept across and cut high, the nape tapered.
  sidecrop(r, m) {
    return { head: [shortBack(r, m, 20)], hang: [], front: bangs('sweptcrop', r, m), tips: [15, 18] };
  },
  // Tight curls piled on top, the sides and nape cropped close.
  curlycrop(r, m) {
    const curls = [[5.4, 8.6, 3.2], [7.8, 4, 3.4], [12.4, 1.4, 3.6], [18.6, 1.2, 3.6], [23.4, 3.6, 3.4], [26.2, 8.2, 3]];
    const puff = curls.flatMap(([x, y, rr]) => [F(E(x, y, rr, rr * 0.9, r.sh1)), poly(smooth([[x - rr * 0.5, y + rr * 0.1], [x, y + rr * 0.45], [x + rr * 0.5, y + rr * 0.05], [x, y + rr * 0.25]]), r.sh2)]);
    return { head: [shortBack(r, m, 19), ...puff], hang: [], front: bangs('curlycrop', r, m), top: puff, tips: [15, 18] };
  },

  // ----- Tomboy -----
  // Tomboy: short and messy, a long floppy fringe, two cowlicks that won't lie down, tufts at the nape.
  tomboy(r, m) {
    const lick = [lock([[16.4, 3], [17.2, 0.2], [19.4, -0.8], [21.2, 0.6]], 3.4, r.base, m, 0.6, 0.45), lock([[9.6, 3.6], [8, 1.6], [6.6, 1.8]], 2.6, r.base, m, 0.6, 0.45)];
    return {
      head: [shortBack(r, m, 21), lock([[6, 18], [4.4, 21.4], [3.4, 23.4]], 3, r.sh1, m, 1, 0.4), lock([[9.4, 19.6], [8.6, 22.6], [8.2, 24.4]], 2.8, r.sh1, m, 1, 0.4)],
      hang: [],
      front: bangs('flop', r, m, [...sideLocks(r, m, [[25, 10.6], [25.8, 14.4], [25.4, 17.8]], undefined, 3), ...lick]),
      top: lick,
      tips: [16, 20],
    };
  },
  // A short rough ponytail stub tied low at the nape, loose strands left framing the face.
  stubtail(r, m) {
    const stub = [[5.4, 14.6], [2.6, 16.4], [0.8, 19.4], [0.4, 22]];
    return {
      head: [crown(r, -0.2), F(E(5.2, 14.8, 1.5, 1.8, r.sh2))],
      hang: [lock(stub, 5.4, r.sh1, m, 1, 0.45), lock([[5, 15.6], [3, 18.6], [2.4, 21]], 2.4, r.base, m, 1.1, 0.4)],
      front: bangs('short', r, m, sideLocks(r, m, [[24.8, 10.4], [25.6, 15], [25.2, 19.6], [26, 22]], undefined, 2.2)),
      tips: [17, 21],
    };
  },
  // Shaved on the near side, the long top thrown over to the far side in one big flop.
  shavedside(r, m) {
    const buzz = [poly(smooth([[23.4, 6.6], [27.2, 8.2], [28.6, 12.2], [28, 16.6], [25.8, 18.6], [24.6, 15.2], [23.6, 10.6]]), r.sh2)];
    for (const y of [9.6, 12, 14.4]) buzz.push(streak(24.4, y, 27.6, y + 0.6, 0.35, 0, r.sh1));
    const flop = lock([[9, 6], [6, 9], [4.4, 14], [4.6, 19], [5.6, 21.6]], 6, r.base, m, 1.1, 0.3);
    return {
      head: [shortBack(r, m, 20)],
      hang: [],
      front: bangs('flopside', r, m, [...buzz, flop, lock([[8, 10], [6.4, 15.6], [6.8, 21]], 3.4, r.base, m, 1.2, 0.3)]),
      tips: [15, 20],
    };
  },

  // ----- Evil -----
  // Vampire: slicked back from a sharp widow's peak, long, straight and heavy, cut level.
  vampire(r, m) {
    return {
      head: [crown(r, -0.2)],
      hang: [napeShadow(r), ...sheet({ len: 44, flare: 12.4, ends: 'level', n: 3, w0: 11.4 }, r, m, 0.8)],
      front: bangs('widow', r, m, [lock([[25.2, 12], [26.4, 18], [26.2, 25], [26.8, 31]], 3, r.base, m, 1.1, 0.3), lock([[5.8, 12], [4.6, 18], [4.8, 25], [4.2, 31]], 3, r.sh1, m, 1.1, 0.3)]),
      tips: [33, 38],
    };
  },
  // Malvina Grimsworth's (the would-be villainess): two colossal drills down to her knees, tied
  // up high under a pair of bat wings shaped out of her own hair (scalloped, each scallop with
  // its own shine), a short sheet behind, and a sharp widow's-peak fringe. She wears it in one
  // colour, crimson (the player tried a two-tone fade and turned it down).
  villainess(r, m) {
    // Each wing spreads out sideways from the knot like a bat's: a leading edge up to a little
    // claw, then three scalloped fingers along the trailing edge, a bone running to each.
    const wing = (dir) => {
      const p = [[9, 7.6], [6.8, 4.8], [4.2, 2.4], [1.4, 0.8], P(-1.6, 0.2), [-0.6, 2.2], [-0.4, 3.8], P(-1.2, 5.6), [0.6, 4.8], [2.2, 5.2], P(2, 7.2), [3.6, 6], [5.2, 6.6], P(5.6, 8.4), [6.8, 7.6], [8.2, 8.4]];
      const s = dir > 0 ? (q) => q : (q) => [31 - q[0], q[1]];
      const pts = dir > 0 ? p : fx(p);
      return [poly(smooth(pts), r.base),
        streak(...s([8.6, 7.4]), ...s([-0.8, 0.8]), 0.55, 0.3 * dir, r.sh1), streak(...s([8.6, 7.6]), ...s([-0.6, 5]), 0.45, 0.2 * dir, r.sh1),
        streak(...s([8.6, 7.8]), ...s([2.2, 6.6]), 0.4, 0.1 * dir, r.sh1), streak(...s([8.6, 7.9]), ...s([5.4, 7.8]), 0.35, 0, r.sh1),
        streak(...s([7, 5]), ...s([2, 1.6]), 0.7, -0.15 * dir, r.hi),
        F(T([s([-1.6, 0.2]), s([-2.6, -0.8]), s([-1, -0.2])], r.sh2)),
        F(E(...s([9.2, 7.8]), 1.5, 1.6, r.sh2))];
    };
    const wings = [...wing(1), ...wing(-1)];
    return {
      head: [crown(r, 0.6), ...wings],
      hang: [napeShadow(r, 21), ...sheet({ len: 26, flare: 10, wave: 0.6, ends: 'points', n: 4 }, r, m),
        lock([[6.2, 7.8], [3.6, 10.2], [2, 13]], 5.2, r.sh1, m), lock([[24.8, 7.8], [27.4, 10.2], [29, 13]], 5.2, r.sh1, m),
        ...drill(1.6, 15, 7, 3.4, 1, r, m, 1.1), ...drill(29.4, 15, 7, 3.4, -1, r, m, 1.1)],
      front: bangs('mshape', r, m, sideLocks(r, m, [[25.2, 11], [26.2, 16.4], [25.8, 21.4]], undefined, 3.2)),
      top: wings,
      tips: [26, 42],
    };
  },
  // Demon buns: two buns twisted up into smooth curved horns, long hair down the back.
  demonbuns(r, m) {
    const horn = (dir) => {
      const p = [[5.8, 6.6], [3.6, 3], [2.8, -1.2], [3.8, -4.4], P(5.6, -6.6), [6, -3.6], [7.6, -0.2], [9.8, 3.2], [9.6, 5.8]];
      const s = dir > 0 ? (q) => q : (q) => [31 - q[0], q[1]];
      return [poly(smooth(dir > 0 ? p : fx(p)), r.base), streak(...s([4.4, 2.6]), ...s([5, -3.6]), 0.7, 0.3 * dir, r.hi), streak(...s([6.2, 4.4]), ...s([8.4, 1.6]), 0.6, -0.2 * dir, r.sh1), streak(...s([4.4, -1]), ...s([6.8, 0.6]), 0.5, -0.2 * dir, r.sh1)];
    };
    const horns = [...horn(1), ...horn(-1)];
    return {
      head: [crown(r), ...horns],
      hang: [napeShadow(r), ...sheet({ len: 40, flare: 13.4, wave: 1.4, ends: 'points', n: 5 }, r, m)],
      front: bangs('regal', r, m, sideLocks(r, m, [[25, 11], [26.6, 18], [26.4, 24.4], [27.4, 28.4]], undefined, 3.2)),
      top: horns,
      tips: [30, 36],
    };
  },
  // Hex: hair to the knees, two long curtains framing the face, the ends drifting apart.
  hexlong(r, m) {
    const curtain = [[23.6, 11], [26.2, 17], [26.4, 25], [25.6, 33], [26.4, 39]];
    return {
      head: [crown(r, 0.4)],
      hang: [napeShadow(r), ...sheet({ len: 58, flare: 15.4, wave: 2.4, ends: 'points', n: 6 }, r, m)],
      front: bangs('queenpart', r, m, [lock(curtain, 4.4, r.base, m, 1.15, 0.2), lock(fx(curtain), 4.4, r.sh1, m, 1.15, 0.2), streak(24.8, 15, 25.4, 30, 0.7, -0.3, r.hi, m, 1.15)]),
      tips: [42, 50],
    };
  },

  // ----- Cosplay -----
  // Magical girl: huge twin tails tied high with a round loop over each tie, falling past the
  // knees in big soft curls.
  magical(r, m) {
    const tail = [[5.6, 4.8], [1.4, 6.4], [-2.4, 11.6], [-4.6, 19], [-3, 26], [-5, 33], [-5.2, 40], [-2.6, 45], [0.4, 45.2], [1.2, 43]];
    const loop = (dir) => {
      const p = [[6.4, 4], [4.2, 0.6], [1.6, -1], [-0.4, 1.4], [0.6, 4.6], [3.6, 5.6]];
      return lock(dir > 0 ? p : fx(p), 3.8, r.base, m, 0.4, 0.6);
    };
    const loops = [loop(1), loop(-1), F(E(6, 4.6, 1.8, 2, r.sh2)), F(E(25, 4.6, 1.8, 2, r.sh2)), ...heart(6, 4.6, 0.45, r), ...heart(25, 4.6, 0.45, r)];
    return {
      head: [crown(r), ...loops],
      hang: [lock(tail, 9.6, r.sh1, m, 1.05, 0.2), lock(fx(tail), 9.6, r.sh1, m, 1.05, 0.2), lock([[5.4, 6], [2.6, 10], [0.6, 17], [1.2, 24], [-0.6, 31]], 4, r.base, m, 1.2), lock(fx([[5.4, 6], [2.6, 10], [0.6, 17], [1.2, 24], [-0.6, 31]]), 4, r.base, m, 1.2)],
      front: bangs('soft', r, m, sideLocks(r, m, [[25.2, 11], [26.8, 17.4], [26.2, 24], [27.6, 29]], undefined, 3.4)),
      top: loops,
      tips: [32, 40],
    };
  },
  // Idol: a big high side tail on the near side bouncing in a loose curl, a star clip at the tie.
  idol(r, m) {
    const tail = [[25.4, 4.6], [29.6, 3.6], [33, 7], [33.6, 13], [32, 19], [33.6, 24.6], [32.6, 29], [30, 30], [29.6, 27.6]];
    const star = [[26.2, 1.6], [27, 3.4], [29, 3.6], [27.5, 4.8], [28, 6.8], [26.2, 5.7], [24.4, 6.8], [24.9, 4.8], [23.4, 3.6], [25.4, 3.4]];
    const pieces = [lock(tail, 8, r.sh1, m, 1.1, 0.2), lock([[26, 5.4], [29.4, 6], [31.4, 10.4], [31.4, 16], [30.4, 21]], 3.6, r.base, m, 1.25), streak(29.6, 7, 31.2, 13, 0.9, -0.4, r.hi, m, 1.2), F(T(star, '#ffd36a')), F(E(26.2, 4.8, 0.7, 0.6, '#fff6d0'))];
    return {
      head: [crown(r)],
      hang: [...sheet({ len: 26, flare: 12.4, ends: 'curls', n: 3 }, r, m), lock(tail, 8, r.sh1, m, 1.1, 0.2)],
      front: bangs('swept', r, m, [...sideLocks(r, m, null, [[5.8, 11], [5, 16], [5.6, 20.4]], 3), ...pieces]),
      tips: [24, 29],
    };
  },
  // Samurai: a topknot folded forward on the crown, tied in red cord, long locks framing the face
  // and a long tail down the back.
  samurai(r, m) {
    const knot = [poly(smooth([[11.6, 1.6], [13, -1.6], [18.6, -2.6], [22.4, -1], P(23.4, 1.4), [19.6, 0.6], [14, 1.8]]), r.base), streak(14, -0.6, 20.4, -1.6, 0.7, -0.3, r.hi), F(R(11.4, -1, 1.6, 3, '#d8352c')), F(R(11.4, -0.2, 1.6, 0.5, '#8e1c16'))];
    return {
      head: [crown(r), ...knot],
      hang: [lock([[10.6, 1.4], [6, 3], [1.6, 8], [0, 16], [0.8, 26], [-0.6, 34]], 6.4, r.sh1, m, 1.05, 0.25)],
      front: bangs('part', r, m, [lock([[24.4, 10], [26, 16], [25.6, 23], [26.4, 28]], 3, r.base, m, 1.15, 0.25), lock([[6.6, 10], [5, 16], [5.4, 23], [4.6, 28]], 3, r.base, m, 1.15, 0.25)]),
      top: knot,
      tips: [24, 30],
    };
  },
});

// ---------- Men's cuts ----------
// Nine masculine cuts: mostly short at the sides and nape, soft rounded clumps, nothing jagged.
Object.assign(FRINGES, {
  // A crew cut: a short textured fringe high on the brow, the sides cropped close.
  crew: { pts: [[23.4, 10.2], [21.8, 8.6], [20, 10.6], [18, 8.8], [15.8, 10.8], [13.6, 9], [11.4, 10.6], [9.4, 8.8], [7.6, 10.2]], lean: 0.4, gentle: true, cropSides: true },
  // 90s curtains: parted in the middle, two short curtains swept out to the cheekbones.
  curtains90: { pts: [[24.4, 16], [23.2, 12.8], [21, 10.6], [18.4, 9.4], [HX, 8.8], [12.6, 9.4], [10, 10.6], [7.8, 12.8], [6.6, 16]], lean: 0, plain: true, part: [[HX, 1.8], [HX, 8.4]] },
  // Combed straight back with a side part, the sides cropped close.
  slick: { pts: [[24.6, 11.6], [22, 8.4], [18.6, 7], [HX, 6.6], [12.4, 7], [9, 8.4], [6.4, 11.6]], lean: 0, plain: true, cropSides: true, part: [[21, 2], [22, 7.6]],
    strands: [[21, 7.8, 14, 2.4, 0.8, 0.5], [17.6, 7.4, 10.6, 3, 0.8, 0.5], [13.6, 7.6, 7.6, 5.4, 0.7, 0.4]] },
  // A buzz: the hair a close cap following the hairline, no fringe at all.
  buzz: { pts: [[24.4, 11.4], [22, 8.8], [18.6, 7.6], [HX, 7.4], [12.4, 7.6], [9, 8.8], [6.6, 11.4]], lean: 0, plain: true, cropSides: true, noShine: true },
  // Comma bangs: a heavy fringe swept to the far side, its end curling in by the far brow.
  comma: { pts: [[23.6, 11], [22.4, 9.2], [20.6, 12.4], [19, 10.2], [16.6, 13.6], [15.2, 11.2], [12.6, 14.8], [11.4, 12.4], [8.8, 15.4], [7.8, 13.6], [6.6, 14.4]], lean: -1.2, part: [[21.6, 2.4], [22.8, 7.4]], gentle: true, cropSides: true },
});
// The newer styles by kind, for the dev sheet (tools/new-hair.html).
export const NEW_HAIR = {
  Short: ['bowlcut', 'sidecrop', 'curlycrop'],
  Tomboy: ['tomboy', 'stubtail', 'shavedside'],
  Evil: ['vampire', 'demonbuns', 'hexlong'],
  Cosplay: ['magical', 'idol', 'samurai'],
  Cute: ['ribbonbuns', 'hearttails', 'shoulderbraid'],
  Sharp: ['sharpbob', 'undercuthime'],
  Fantasy: ['cascade', 'starbuns', 'feathertips'],
  Boyish: ['messycrop', 'pompadour'],
  Men: ['crewcut', 'curtains90', 'slickback', 'buzzcut', 'comma', 'longtied', 'mullet', 'surfer', 'hightop'],
};
// A man's short back: close to the skull, stopping at the nape.
const cropBack = (r, m, low = 19) => mass([[6.4, low - 2], P(5.4, low), [4.4, 14], [4.4, 9], [7.4, 3.4], [13.2, 1.6], [20, 1.8], [25.8, 6], [26.6, 11.6], [26, low - 2.6], P(25, low - 0.4), [21, low - 1], P(15.5, low + 0.6), [10, low - 1]], r.sh1, m, 0.4);
// The sides cut close: a thin darker fade over each ear under the cropped sides.
const fade = (r) => {
  const p = [[23.8, 10.4], [26.2, 11.4], [26.8, 13.8], [26.2, 16], [25, 16.8], [24.4, 14.6], [23.8, 12.4]];
  return [poly(smooth(p), r.sh1), poly(smooth(fx(p)), r.sh1)];
};
Object.assign(STYLES, {
  // Crew cut: short and tidy all over, a little texture at the front.
  crewcut(r, m) {
    return { head: [cropBack(r, m, 18)], hang: [], front: bangs('crew', r, m, fade(r)), tips: [14, 17] };
  },
  // 90s curtains: parted in the middle, short curtains swept out over the cheekbones, a short back.
  curtains90(r, m) {
    const curl = [[24, 12], [25.6, 15.4], [25.4, 18.4]];
    return {
      head: [cropBack(r, m, 20)],
      hang: [],
      front: bangs('curtains90', r, m, [lock(curl, 3.4, r.base, m, 1.1, 0.3), lock(fx(curl), 3.4, r.sh1, m, 1.1, 0.3)]),
      tips: [15, 19],
    };
  },
  // Slicked back: combed straight back off a side part, neat and glossy, the sides short.
  slickback(r, m) {
    return { head: [cropBack(r, m, 18)], hang: [], front: bangs('slick', r, m, fade(r)), tips: [14, 17] };
  },
  // Buzz cut: a close even cap of hair.
  buzzcut(r, m) {
    const cap = [[HX, 1.6], [23.6, 3.4], [27.2, 8.4], [27.6, 14], [26, 18.4], [HX, 19.6], [5, 18.4], [3.4, 14], [3.8, 8.4], [7.4, 3.4]];
    return { head: [mass(cap, r.sh1, m, 0.2)], hang: [], front: bangs('buzz', r, m, fade(r), { shine: false }), tips: [99, 99] };
  },
  // Comma hair: a heavy swept fringe curling in at the far brow, the sides tapered.
  comma(r, m) {
    const hook = lock([[9.4, 13.4], [8.4, 15.4], [9.2, 16.8], [10.4, 16.4]], 2.6, r.base, m, 0.6, 0.4);
    return { head: [cropBack(r, m, 19)], hang: [], front: bangs('comma', r, m, [...fade(r), hook]), tips: [14, 18] };
  },
  // Long and tied: a ronin's long hair gathered low at the nape, falling down the back, loose
  // locks left framing the face.
  longtied(r, m) {
    const tail = [[5.6, 17], [3.4, 21], [2.6, 27], [3.4, 33], [2.4, 39]];
    return {
      head: [crown(r), F(E(5.6, 17, 1.6, 1.9, r.sh2))],
      hang: [lock(tail, 5.6, r.sh1, m, 1.1, 0.25), streak(4.6, 20, 3.6, 30, 0.7, 0.3, r.base, m, 1.1)],
      front: bangs('part', r, m, sideLocks(r, m, [[24.8, 10.4], [26, 16], [25.6, 21], [26.2, 24.6]], undefined, 2.6)),
      tips: [28, 34],
    };
  },
  // Mullet: short on top and at the sides, long at the back to the shoulders.
  mullet(r, m) {
    return {
      head: [cropBack(r, m, 20)],
      hang: [napeShadow(r, 21), ...sheet({ len: 30, flare: 11.4, n: 4, w0: 9.8, top: 17 }, r, m)],
      front: bangs('crew', r, m, fade(r)),
      tips: [24, 29],
    };
  },
  // Surfer: shaggy waves to the chin, parted in the middle, flicking out at the ends.
  surfer(r, m) {
    const wave = [[25, 10.6], [26.8, 14.6], [26, 18.6], [27.6, 22], [28.6, 21.4]];
    return {
      head: [crown(r, 0.6)],
      hang: sheet({ len: 25, flare: 14, wave: 1.2, ends: 'points', n: 4, w0: 12.4 }, r, m, 0.7),
      front: bangs('curtains90', r, m, sideLocks(r, m, wave, undefined, 4)),
      tips: [19, 23],
    };
  },
  // High-top: a tall flat-topped block of tight curls, the sides faded short.
  hightop(r, m) {
    const block = [poly(smooth([[5.6, 9], [5.4, 3], [6.4, -0.8], [8.8, -2.4], [22.2, -2.4], [24.6, -0.8], [25.6, 3], [25.4, 9]]), r.base)];
    for (const [x, y] of [[9.4, -0.6], [13.2, -1], [17.2, -1], [21, -0.6], [7.8, 2.6], [11.6, 1.8], [15.6, 1.6], [19.6, 1.8], [23.4, 2.6]]) block.push(F(E(x, y, 1, 0.7, r.sh1)));
    block.push(streak(9.4, -1.6, 18, -1.9, 0.7, 0, r.hi));
    return { head: [cropBack(r, m, 18), ...block], hang: [], front: bangs('buzz', r, m, fade(r), { shine: false }), top: block, tips: [99, 99] };
  },
});

// ---------- The 2026-11 redraw: ten new styles ----------
// Cute and fancy, cool and sharp, fantasy and boyish, drawn with the redraw's strand locks and shine.
// A star of hair: five rounded points, `rot` turning it.
const starPts = (x, y, rr, rot = 0) => Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + rot + (i * Math.PI) / 5;
  const d = i % 2 ? rr * 0.52 : rr;
  return [x + Math.cos(a) * d, y + Math.sin(a) * d];
});
// A feather of hair hanging from `spine`: a soft vane, a dark shaft down it and barbs slanting off.
function featherLock(spine, w, r, m, k = 1.1) {
  const out = [lock(spine, w, r.base, m, k, 0.25)];
  const [a, b] = [spine[0], spine[spine.length - 1]];
  out.push(streak(a[0], a[1] + 1, b[0], b[1] - 0.6, 0.7, 0, r.sh2, m, k));
  for (let i = 1; i <= 3; i++) {
    const t = i / 4.2;
    const [x, y] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    out.push(streak(x, y, x - w * 0.46, y + 2.2, 0.55, 0, r.sh1, m, k), streak(x, y, x + w * 0.46, y + 2.2, 0.55, 0, r.sh1, m, k));
  }
  return out;
}
Object.assign(STYLES, {
  // ----- Cute and fancy -----
  // Ribbon buns: a round bun high on each side with a little bow tied out of its own hair, short
  // curly tails slipping out beneath; soft bangs.
  ribbonbuns(r, m) {
    const tail = [[5, 6.6], [2.4, 9.6], [1.6, 14.6], [2.6, 19], [1.6, 23.4], [3, 25.4]];
    const knots = [...bun(5.6, 3.6, 3.9, 3.5, r, 1), ...bun(25.4, 3.6, 3.9, 3.5, r, -1), ...hairBow(5.2, -0.8, 0.62, r), ...hairBow(25.8, -0.8, 0.62, r)];
    return {
      head: [crown(r), ...knots],
      hang: [...sheet({ len: 25, flare: 12.4, ends: 'curls', n: 3 }, r, m), lock(tail, 5.2, r.sh1, m, 1.15, 0.2), lock(fx(tail), 5.2, r.sh1, m, 1.15, 0.2)],
      front: bangs('soft', r, m, sideLocks(r, m, [[25.2, 11], [26.4, 16], [26, 20.6], [27.4, 22.6]], undefined, 3.2)),
      top: knots,
      tips: [20, 24],
    };
  },
  // Heart twintails: twintails tied high that swing down and curl into a heart of hair at each end.
  hearttails(r, m) {
    const tail = [[5.2, 6.4], [1.8, 8.4], [-0.8, 13], [-1.6, 19], [-0.4, 24], [-1.2, 28.4]];
    const light = [[5.4, 7.2], [3, 10], [1.4, 15], [1.6, 21], [0.8, 25.4]];
    const mv = mover(m, 1.05);
    const hang = [];
    for (const flip of [(p) => p, fx]) {
      hang.push(lock(flip(tail), 7.4, r.sh1, m, 1.05, 0.3), lock(flip(light), 3.4, r.base, m, 1.2));
      const [hx, hy] = mv(flip([[-1.2, 31.2]])[0]);
      hang.push(...heart(hx, hy, 1.35, r));
    }
    const ties = [F(E(5.4, 6.2, 1.4, 1.9, r.sh2)), F(E(25.6, 6.2, 1.4, 1.9, r.sh2))];
    return { head: [crown(r), ...ties], hang, front: bangs('wispy', r, m, sideLocks(r, m, [[25.2, 11], [26.2, 16], [25.8, 20.4]], undefined, 3)), top: ties, tips: [24, 29] };
  },
  // Shoulder braid: everything gathered into one thick plait brought forward over the near shoulder;
  // swept bangs.
  shoulderbraid(r, m) {
    const sp = [[24.2, 12], [26.4, 17], [25.6, 23], [24.4, 29], [24.2, 35]];
    return {
      head: [crown(r)],
      hang: sheet({ len: 24, flare: 12, n: 3 }, r, m, 0.8),
      front: bangs('swept', r, m, [...sideLocks(r, m, null, [[5.8, 11], [5, 16], [5.6, 20.4]], 3), lock([[23.4, 8.6], [26, 11.6], [25.2, 14]], 5, r.base, m, 0.8), ...plait(sp, 4.8, r, m, 1.1)]),
      tips: [28, 33],
    };
  },

  // ----- Cool and sharp -----
  // Sharp bob: an uneven bob cut in clean straight lines, long and pointed by the near jaw, short
  // on the far side; a swept fringe.
  sharpbob(r, m) {
    const near = [[23.8, 9.4], [27.6, 10.4], [28, 18], P(27.8, 26), P(23.6, 22.4), [23.2, 14]];
    const far = fx([[24, 9.6], [27, 10.4], [27.4, 15.6], P(27.2, 19.4), P(23.6, 18.2), [23.4, 13.4]]);
    return {
      head: [crown(r, 0.4)],
      hang: sheet({ len: 22, flare: 12.6, ends: 'level', n: 3 }, r, m, 0.5),
      front: bangs('swept', r, m, [mass(near, r.base, m, 0.5), mass(far, r.base, m, 0.5), streak(24.6, 12, 27, 24.4, 0.6, -0.2, r.hi, m, 0.5), streak(23.4, 14, 25, 22, 0.5, 0, r.sh2, m, 0.5)]),
      tips: [17, 21],
    };
  },
  // Undercut hime: long straight hair cut level, one side shaved close, the rest thrown to the far
  // side in a heavy curtain.
  undercuthime(r, m) {
    const buzz = [poly(smooth([[23.4, 6.6], [27.2, 8.2], [28.6, 12.2], [28, 16.6], [25.8, 18.6], [24.6, 15.2], [23.6, 10.6]]), r.sh2)];
    for (const y of [9.6, 12, 14.4]) buzz.push(streak(24.4, y, 27.6, y + 0.6, 0.35, 0, r.sh1));
    const curtain = fx([[24, 10], [27.4, 10.6], [28, 22], P(27.8, 32.4), P(22.2, 32.4), [21.8, 15]]);
    return {
      head: [crown(r)],
      hang: [napeShadow(r), ...sheet({ len: 44, flare: 12.6, ends: 'level', n: 3 }, r, m, 0.8)],
      front: bangs('flopside', r, m, [...buzz, mass(curtain, r.base, m, 0.6), F(R(8.5, 16, 0.7, 16, r.sh2)), streak(5.6, 13, 5, 30, 0.6, 0.2, r.hi, m, 0.6)]),
      tips: [34, 40],
    };
  },

  // ----- Fantasy -----
  // Cascade: hair to the ankles in great slow waves, curling at the ends, long locks by the face.
  cascade(r, m) {
    return {
      head: [crown(r, 1)],
      hang: [napeShadow(r), ...sheet({ len: 66, flare: 14.2, wave: 2.2, ends: 'curls', n: 5, w0: 12 }, r, m)],
      front: bangs('part', r, m, sideLocks(r, m, [[25, 10], [27, 18], [26.2, 26], [27.8, 34], [26.6, 41], [28, 45]], undefined, 4.4)),
      tips: [46, 56],
    };
  },
  // Star buns: two buns twisted into five-pointed stars, a thin tail falling from under each.
  starbuns(r, m) {
    const star = (x, y, rot) => [poly(smooth(starPts(x, y, 4.6, rot), 1), r.base), poly(smooth(starPts(x, y, 2, rot), 1), r.sh1), streak(x - 2, y - 2.6, x - 0.4, y - 3.8, 0.7, 0.2, r.hi)];
    const stars = [...star(5.6, 2.6, -0.2), ...star(25.4, 2.6, 0.2)];
    const tail = [[6, 6.6], [3.6, 10], [2.6, 16], [3.4, 22], [2, 28], [2.6, 32]];
    return {
      head: [crown(r), ...stars],
      hang: [...sheet({ len: 30, flare: 12.6, n: 4 }, r, m), lock(tail, 4.6, r.sh1, m, 1.1), lock(fx(tail), 4.6, r.sh1, m, 1.1)],
      front: bangs('soft', r, m, sideLocks(r, m, [[25.2, 11], [26.2, 16], [25.8, 20.4]], undefined, 3)),
      top: stars,
      tips: [24, 29],
    };
  },
  // Feather tips: long soft hair whose ends part into feathers, each with its shaft and barbs,
  // drifting a beat behind; two feather locks frame the face.
  feathertips(r, m) {
    const ends = [[5.4, 26, 2.4, 40], [15.5, 28, 15.5, 42.6], [25.6, 26, 28.6, 40]];
    const dark = { ...r, base: mix(r.base, r.sh1, 0.4) };
    const feathers = ends.flatMap(([x0, y0, x1, y1]) => featherLock([[x0, y0], [(x0 + x1) / 2 + 0.4, (y0 + y1) / 2], [x1, y1]], 6.4, dark, m));
    const face = [[25.2, 11], [26.6, 17], [26, 23.6], [27, 27]];
    return {
      head: [crown(r)],
      hang: [napeShadow(r), ...sheet({ len: 30, flare: 13, wave: 1, n: 4 }, r, m), ...feathers],
      front: bangs('wispy', r, m, [...featherLock(face, 4.4, r, m, 1.2), ...featherLock(fx(face), 4.4, r, m, 1.2)]),
      tips: [30, 36],
    };
  },

  // ----- Boyish and short -----
  // Messy crop: short and fluffy, tufts sticking up on the crown and flicking out over the ears.
  messycrop(r, m) {
    const tufts = [lock([[13.6, 3], [12.6, -0.4], [10.4, -1.8]], 3.2, r.base, m, 0.6, 0.4), lock([[18, 2.6], [19.6, -0.6], [22.2, -1]], 3.4, r.base, m, 0.6, 0.4), lock([[15.6, 2.4], [16, -1.2]], 2.4, r.base, m, 0.6, 0.4)];
    const flick = (p) => [lock(p, 3.4, r.base, m, 1, 0.35), lock(fx(p), 3.4, r.base, m, 1, 0.35)];
    return {
      head: [shortBack(r, m, 21), lock([[7, 18.6], [5, 21.6], [4.6, 23.4]], 3, r.sh1, m, 1, 0.4), lock([[24, 18.6], [26, 21.6], [26.4, 23.4]], 3, r.sh1, m, 1, 0.4)],
      hang: [],
      front: bangs('spiky', r, m, [...flick([[25, 11.6], [28, 14], [30, 13.6]]), ...flick([[25.2, 15], [27, 18], [28.8, 18.4]]), ...tufts]),
      top: tufts,
      tips: [16, 20],
    };
  },
  // Pompadour: the front swept up and back in one big glossy wave, the sides and back cropped close.
  pompadour(r, m) {
    const wave = [poly(smooth([[8.2, 8.8], [8.6, 3.4], [12.2, -1.2], [18.4, -3.2], [24.4, -1.8], P(26.6, 1.2), [23.6, 1], [21, 1.8], [24, 5.2], [23.8, 9], [18.6, 7], [12.4, 7.6]]), r.base),
      streak(10.6, 5.4, 19.4, -1.8, 0.9, -0.4, r.hi), streak(13, 6.6, 22.6, 2.4, 0.6, -0.3, r.sh1), streak(11.4, 3, 17, -0.4, 0.5, -0.2, r.sh2)];
    return { head: [cropBack(r, m, 18)], hang: [], front: bangs('slick', r, m, [...fade(r), ...wave]), top: wave, tips: [14, 17] };
  },
});

// ---------- Coinbridge's own (2026-11-07): one style each, worn by nobody else ----------
// Not offered in the creator or the salon (OWN_HAIR): each belongs to one of the town's people.
Object.assign(STYLES, {
  // Madame Ledger: a glossy finger-wave bob, deep S-waves pressed across the crown, the ends turned
  // under in curls at the jaw, and one big kiss curl looping on her near cheek.
  ledgerwaves(r, m) {
    const waves = [streak(7.6, 8.2, 13.4, 3.4, 1.4, 0.8, r.hi), streak(13.4, 3.4, 19.6, 4.6, 1.2, -0.8, r.hi), streak(19.6, 4.6, 25, 9.6, 1.2, 0.8, r.hi),
      streak(8.6, 11, 14, 6.6, 0.8, 0.8, r.sh2), streak(14, 6.6, 20.4, 7.6, 0.7, -0.8, r.sh2)];
    const curl = lock([[24.6, 12.6], [27.4, 16.4], [26.6, 20.4], [24.2, 20.6], [23.8, 18.4], [25.4, 17.6]], 3.6, r.base, m, 1.1, 0.5);
    return {
      head: [crown(r)],
      hang: [napeShadow(r, 19), ...sheet({ len: 23, flare: 13, ends: 'curls', n: 4, w0: 12 }, r, m, 0.7)],
      front: bangs('swept', r, m, [curl, lock([[6.8, 12], [5.2, 16.6], [5.8, 20.6]], 3.4, r.base, m, 0.9), ...waves]),
      top: waves,
      tips: [20, 23],
    };
  },
  // Guildmaster Halvard: an old adventurer's grey mane combed straight back and tied in a thick tail
  // worn forward over his shoulder, with a couple of loose strands fallen over his brow.
  veterantail(r, m) {
    // (The tail is brought forward over his near shoulder, the way he wears it.)
    const tail = [[21.4, 17.4], [25, 22], [26, 28], [25.2, 33.6]];
    const strands = [lock([[21.6, 6.8], [24.4, 11.6], [25, 16.4]], 1.7, r.base, m, 1.3, 0.3), lock([[19.6, 7.2], [22.6, 12.2], [23, 15.2]], 1.3, r.hi, m, 1.4, 0.3)];
    return {
      head: [shortBack(r, m, 21), F(E(6.4, 16, 2.2, 3.6, r.sh1)), F(E(24.6, 16, 2.2, 3.6, r.sh1))],
      hang: [],
      front: bangs('bare', r, m, [...strands, lock(tail, 5, r.base, m, 1, 0.35), streak(23.4, 20, 25.4, 29, 0.8, -0.4, r.hi, m), F(E(22.6, 19, 2.2, 1.4, '#6a4a3a')), F(E(22.2, 18.6, 0.9, 0.5, '#8a6a5a'))]),
      tips: [26, 32],
    };
  },
  // Penny: tidy blunt bangs, and two plaits looped up into rings over her ears and pinned, the way a
  // clerk keeps her hair out of the ink.
  clerkloops(r, m) {
    const loop = [[25, 12.4], [27.4, 16.6], [27.6, 21.4], [25.6, 23.8], [23.8, 21.8], [24.2, 17]];
    return {
      head: [crown(r)],
      hang: [...sheet({ len: 21, flare: 12, n: 3 }, r, m, 0.6), ...plait(loop, 3.2, r, m, 0.6, r.sh1), ...plait(fx(loop), 3.2, r, m, 0.6, r.sh1)],
      front: bangs('blunt', r, m, [...plait(loop, 3.2, r, m, 0.6), F(E(24.4, 13, 1, 1, r.hi))]),
      tips: [19, 22],
    };
  },
  // Juniper: everything piled into one big soft bun high on the back of her head, and curly
  // tendrils by her ears from a long day at the stove.
  kettlebun(r, m) {
    const knot = bun(15.5, 0.2, 6.6, 5.4, r);
    const tendril = [[24.8, 11.4], [26.6, 15.4], [25.4, 18.4], [26.8, 21.4], [25.8, 23.6]];
    return {
      head: [crown(r), ...knot],
      hang: [napeShadow(r, 18)],
      front: bangs('wispy', r, m, [lock(tendril, 2.2, r.base, m, 1.3, 0.3), lock(fx(tendril), 2.2, r.base, m, 1.3, 0.3)]),
      top: knot,
      tips: [16, 22],
    };
  },
  // Old Wendell: thin on top and combed over, with two fluffy white tufts puffing out over his ears.
  oldtufts(r, m) {
    const tuft = (x, dir) => [mass([[x, 11], [x + dir * 3.6, 12.6], [x + dir * 4.6, 16.4], [x + dir * 3.6, 20.4], [x + dir * 0.6, 21.6], [x - dir * 0.6, 17]], r.base, m, 0.5), streak(x + dir * 1.4, 13, x + dir * 3.2, 18.6, 0.8, -0.4 * dir, r.hi), streak(x + dir * 0.8, 15, x + dir * 2.2, 20, 0.5, -0.3 * dir, r.sh1)];
    return {
      head: [cropBack(r, m, 19)],
      hang: [],
      front: bangs('buzz', r, m, [...tuft(23.6, 1), ...tuft(7.4, -1), streak(10.4, 6.4, 21.4, 5.4, 0.7, -0.6, r.hi)]),
      tips: [99, 99],
    };
  },
  // Tilly: a choppy little bob, one round topknot bun sitting on her crown like a pompom, and a
  // skinny rat-tail plait down her back (she says it's lucky).
  tillytuft(r, m) {
    const top = [...bun(15.5, -1.6, 4.4, 4, r), lock([[15.5, -5.2], [16.6, -7], [18.2, -6.4]], 1.8, r.base, m, 0.4, 0.4)];
    return {
      head: [crown(r), ...top],
      hang: [...sheet({ len: 22, flare: 12.8, n: 4 }, r, m), ...plait([[15.5, 21], [16.2, 26], [15.4, 31], [16.4, 37]], 2.4, r, m, 1.3, r.sh1)],
      front: bangs('soft', r, m, sideLocks(r, m, [[25, 11.6], [26.4, 16.4], [25.8, 20.6]], undefined, 3.2)),
      top,
      tips: [19, 22],
    };
  },
  // The Masked Moth: long straight dusk-coloured hair to the waist, swept out at the temples into
  // two broad wing-shaped panels like a moth's forewings, and two fine antennae of hair curling up
  // from the crown, each ending in a little feathered tip.
  mothwing(r, m) {
    const wing = (dir) => {
      const X = (x) => HX + dir * x;
      // A forewing: from the temple up and out to a point, its trailing edge curving back in, a
      // light leading edge and an eyespot ringed in the hair's own shine.
      return [mass([[X(9), 9], P(X(13.6), 1.6), P(X(19.4), -2.2), [X(18.8), 3.6], [X(16.4), 9.4], [X(12.4), 13.6]], r.sh1, m, 0.3),
        streak(X(10), 8, X(18.6), -1.6, 0.9, 0.4 * dir, r.hi), F(E(X(15.4), 5.2, 1.8, 1.5, r.hi)), F(E(X(15.4), 5.2, 1, 0.85, r.sh2)), streak(X(12), 11.6, X(17), 5.6, 0.5, -0.3 * dir, r.base)];
    };
    const antenna = (dir) => {
      const sp = [[HX + dir * 2.4, 2.8], [HX + dir * 4, -1.6], [HX + dir * 6.8, -4.4], [HX + dir * 8.8, -3.8]];
      return [lock(sp, 1.1, r.sh1, m, 0.5, 0.6), F(E(HX + dir * 9.2, -3.6, 1.4, 0.9, r.base)), F(E(HX + dir * 9.4, -3.9, 0.6, 0.4, r.hi))];
    };
    const ants = [...antenna(1), ...antenna(-1)];
    return {
      head: [crown(r, 0.4), ...wing(1), ...wing(-1)],
      hang: [napeShadow(r), ...sheet({ len: 46, flare: 13.4, ends: 'level', n: 5, w0: 12 }, r, m)],
      front: bangs('hime', r, m, [...sideLocks(r, m, [[24.8, 12], [25.6, 20], [25.2, 28], [25.8, 34]], undefined, 3.4), ...ants]),
      top: ants,
      tips: [36, 42],
    };
  },
});
OWN_HAIR.push('ledgerwaves', 'veterantail', 'clerkloops', 'kettlebun', 'oldtufts', 'tillytuft', 'mothwing');

// ---------- More fringes ----------
// Long, sharp and centre-parted fringes the court and wild styles above draw with.
Object.assign(FRINGES, {
  // A queen's centre part: two long curtains sweeping down past the cheekbones.
  queenpart: { pts: [[24.8, 19.4], [23.4, 15.4], [21.4, 12.4], [18.8, 10.2], [HX, 9.2], [12.2, 10.2], [9.6, 12.4], [7.6, 15.4], [6.2, 19.4]], lean: 0, plain: true, part: [[HX, 1.6], [HX, 8.8]] },
  // Regal: long, sharp points swept across the brow to the far side, longest by the far eye.
  regal: { pts: [[24.2, 11.8], [22.8, 9], [21.2, 13.4], [19.6, 9.6], [17.2, 14.8], [15.8, 10.2], [13.2, 16.4], [12.2, 11.2], [9.6, 17.8], [8.8, 12.8], [6.8, 16.2]], lean: -1.1 },
  // A wild mane: big jagged spikes of every length.
  mane: { pts: [[24.2, 14.2], [22.2, 9.4], [20.6, 16.2], [18.6, 9.8], [16.4, 17.6], [14.8, 10.2], [12.6, 16.8], [11, 10], [9.2, 15.8], [7.8, 10.8], [6.6, 14.8]], lean: 0.6 },
  // Swept back: no fringe at all, the hairline high and the hair combed straight back.
  bare: { pts: [[24.6, 11.4], [22.2, 8.6], [18.8, 6.8], [HX, 6.4], [12.2, 6.8], [8.8, 8.6], [6.4, 11.4]], lean: 0, plain: true, strands: [[19.6, 6.6, 12.4, 2.6, 1, 0.6], [16.6, 6.4, 9.4, 3.4, 0.9, 0.5], [22, 8, 15.6, 2.4, 0.9, 0.6]] },
});
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
    // (A tail's lock comes as its body plus strands, so the lists are flattened.)
    head: twoTone(p.head.flat(2), r, tint, tips),
    hang: twoTone(p.hang.flat(2), r, tint, tips),
    front: twoTone(p.front.shapes.flat(2), r, tint, tips),
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
