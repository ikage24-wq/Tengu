// The fish, drawn one by one (2026-11-07): every fish has a body of its own kind (a minnow, a carp, a
// bass, a tuna, an eel, a ray, a seahorse...) built from its shape, its fins (each with its rays),
// its scales, a gill, a proper eye and mouth, and its own markings. Swimming right in a 16x16 cell,
// lit from the top left like every other drop icon (icons/items.js), back darker than the belly as
// real fish are.
//
// `fishArt(f)` draws a fish from FISH (data/fishing.js) using its FORM below. A form names a
// `kind` (the drawer) and its options; the kinds:
//   fish  - the everyday fish shape, tuned by its body, tail, fins, mouth, skin and marks
//   eel, ribbon - long bodies along a curve
//   puffer, ray, seahorse, star, whale, angler - their own drawings

import { mix } from '../pixel.js';
import { hi, lt, sh, dk, ink, S, oval, arcPts, bez, bez3, clip, bbox, tube, twinkle, glint, W } from './items.js';

const EYE = '#2a2340';
const line = (pts, th, c) => S(tube(pts, th), c);
const lerp = (a, b, t) => a + (b - a) * t;
const pt = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

function inside(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// A fin: its outline in the fin colour, a lighter leading edge, and rays fanning from the base
// (`base` two points on the body, `edge` the points of its free edge from front to back).
function fin(base, edge, c, { rays = 4, sheer = false } = {}) {
  const poly = [base[0], ...edge, base[1]];
  const out = [S(poly, sheer ? mix(c, '#ffffff', 0.25) : c)];
  const b = bbox(poly);
  out.push(S(clip(poly, oval(b.x0 + b.w * 0.25, b.y0 + b.h * 0.25, b.w * 0.55, b.h * 0.55)), lt(c)));
  const rc = sh(c);
  for (let i = 1; i <= rays; i++) {
    const t = i / (rays + 1);
    const from = pt(base[0], base[1], t);
    const k = t * (edge.length - 1);
    const e = pt(edge[Math.floor(k)], edge[Math.min(edge.length - 1, Math.ceil(k))], k % 1);
    out.push(line([from, pt(from, e, 0.92)], 0.28, rc));
  }
  return out;
}

// An eye: a ring of iris round a dark pupil looking forward, two shines.
function eye(x, y, r, iris = '#ffe9a6') {
  return [
    S(oval(x, y, r, r, 0, 18), iris),
    S(oval(x + r * 0.18, y, r * 0.7, r * 0.72, 0, 16), EYE),
    S(oval(x - r * 0.12, y - r * 0.32, r * 0.3, r * 0.3, 0, 10), W),
    S(oval(x + r * 0.42, y + r * 0.3, r * 0.14, r * 0.14, 0, 8), W),
  ];
}

// Scales: rows of little arcs inside the body, each in a deep shade of the tone under it.
function scales(body, tone, { step = 1.25, r = 0.62, from = 0, to = 16 } = {}) {
  const out = [];
  const b = bbox(body);
  let row = 0;
  for (let y = b.y0 + step * 0.9; y < b.y1 - step * 0.4; y += step * 0.8, row++) {
    for (let x = Math.max(b.x0, from) + (row % 2) * step * 0.5 + step * 0.6; x < Math.min(b.x1, to) - step * 0.3; x += step) {
      const a = [x - r * 0.5, y - r * 0.9];
      const z = [x - r * 0.5, y + r * 0.9];
      if (!inside(a, body) || !inside(z, body) || !inside([x, y], body)) continue;
      out.push(line(arcPts(x + r * 0.6, y, r, r * 1.05, 115, 245, 6), 0.26, tone(y)));
    }
  }
  return out;
}

// ---------- The everyday fish ----------

// body: r (tail root x), n (nose x), h / hb (height above / below the mid line), hump (0-1, how far
// forward the back peaks), blunt (0 pointed - 1 round head), ny (nose up or down), cy (mid line).
function fishShape(o) {
  const { r = 3.2, n = 15.2, h = 3.6, hb = h * 0.9, hump = 0.4, blunt = 0.55, ny = 0.3, cy = 8, root = 0.9 } = o.body ?? {};
  const L = n - r;
  const top = bez3([r, cy - root], [r + L * hump, cy - h * 1.32], [n - L * 0.1, cy - h * (0.35 + 0.7 * blunt)], [n, cy + ny], 18);
  const bot = bez3([n, cy + ny], [n - L * 0.12, cy + hb * (0.35 + 0.65 * blunt)], [r + L * (hump + 0.05), cy + hb * 1.3], [r, cy + root], 18);
  return { r, n, h, hb, cy, L, root, top, bot, body: [...top, ...bot.slice(1)] };
}
// A point along the back (t 0 = tail root .. 1 = nose) or the belly (t 0 = tail root .. 1 = nose).
const onTop = (s, t) => s.top[Math.round(t * (s.top.length - 1))];
const onBot = (s, t) => s.bot[Math.round((1 - t) * (s.bot.length - 1))];

function tail(s, o, c) {
  const { r, cy, root } = s;
  const kind = o.tail ?? 'fork';
  const len = o.tailLen ?? 2.8;
  const span = o.tailSpan ?? 3.6;
  const x0 = r + 0.5;
  const A = [x0, cy - root];
  const B = [x0, cy + root];
  if (kind === 'none') return [];
  if (kind === 'fork') return fin([A, B], [[r - len, cy - span], [r - len * 0.45, cy], [r - len, cy + span]], c, { rays: 5 });
  if (kind === 'lunate') {
    const edge = [...bez([r - len * 0.6, cy - span * 1.15], [r - len * 0.35, cy - span * 0.2], [r - len * 0.2, cy], 5), ...bez([r - len * 0.2, cy], [r - len * 0.35, cy + span * 0.2], [r - len * 0.6, cy + span * 1.15], 5).slice(1)];
    return fin([A, B], [[r - len * 0.3, cy - span * 0.6], ...edge, [r - len * 0.3, cy + span * 0.6]].slice(1, -1), c, { rays: 3 });
  }
  if (kind === 'round') return fin([A, B], arcPts(r, cy, len, span, 225, 135, 10).reverse().map(([x, y]) => [x, y]).reverse(), c, { rays: 6 });
  if (kind === 'fan') return fin([A, B], arcPts(r + 0.4, cy, len * 1.1, span * 1.1, 240, 120, 12).reverse().reverse(), c, { rays: 7, sheer: true });
  if (kind === 'veil') {
    const top = bez3([r - 0.6, cy - span * 0.9], [r - len * 0.9, cy - span * 1.2], [r - len * 1.1, cy - span * 0.2], [r - len * 0.75, cy + 0.4], 6);
    const lo = bez3([r - len * 0.75, cy + 0.4], [r - len * 1.2, cy + span * 0.6], [r - len * 0.8, cy + span * 1.4], [r - 0.4, cy + span * 0.8], 6);
    return fin([A, B], [...top, ...lo.slice(1)], c, { rays: 6, sheer: true });
  }
  if (kind === 'point') return fin([A, B], [[r - len, cy - 0.2]], c, { rays: 0 });
  // A shark's or sturgeon's tail: the top lobe long and swept up, the bottom one short.
  if (kind === 'shark') return fin([A, B], [[r - len * 1.1, cy - span * 1.25], [r - len * 0.5, cy - 0.2], [r - len * 0.55, cy + span * 0.55]], c, { rays: 3 });
  return [];
}

function dorsal(s, o, c) {
  const kind = o.dorsal ?? 'low';
  const hgt = o.dorsalH ?? 2.6;
  const out = [];
  const up = (p, d, back = 0) => [p[0] - back, p[1] - d];
  if (kind === 'none') return out;
  if (kind === 'low') {
    const a = onTop(s, 0.62);
    const b = onTop(s, 0.32);
    out.push(...fin([a, b], [up(a, hgt, 0.4), up(pt(a, b, 0.6), hgt * 0.55, 0.6)], c, { rays: 3 }));
  } else if (kind === 'tall') {
    const a = onTop(s, 0.68);
    const b = onTop(s, 0.36);
    out.push(...fin([a, b], [up(a, hgt * 0.8, -0.2), up(pt(a, b, 0.35), hgt * 1.25, 1.6), up(b, 0.4, 0.4)], c, { rays: 4 }));
  } else if (kind === 'spiny') {
    // Spikes up front, a soft fin behind them.
    const a = onTop(s, 0.75);
    const m = onTop(s, 0.45);
    const b = onTop(s, 0.22);
    const spikes = [];
    for (let i = 0; i <= 4; i++) {
      const p = pt(a, m, i / 4);
      spikes.push(up(p, hgt * (1 - Math.abs(i - 1.5) * 0.16), 0.5), up(pt(a, m, (i + 0.5) / 4), hgt * 0.45, 0.2));
    }
    spikes.pop();
    out.push(...fin([a, m], spikes, c, { rays: 0 }));
    for (let i = 0; i <= 4; i++) out.push(line([pt(a, m, i / 4), up(pt(a, m, i / 4), hgt * (1 - Math.abs(i - 1.5) * 0.16) * 0.95, 0.5)], 0.3, sh(c)));
    out.push(...fin([m, b], [up(m, hgt * 0.8, 0.3), up(pt(m, b, 0.7), hgt * 0.7, 0.8)], c, { rays: 3 }));
  } else if (kind === 'sail') {
    // A great sail from behind the head to near the tail.
    const a = onTop(s, 0.84);
    const b = onTop(s, 0.3);
    out.push(...fin([a, b], [up(a, hgt * 1.2, -0.3), ...bez([a[0] - 1, a[1] - hgt * 1.75], pt(up(a, hgt * 1.4), up(b, hgt * 0.6), 0.5), up(b, hgt * 0.3, 0.3), 8)], c, { rays: 7 }));
  } else if (kind === 'long') {
    const a = onTop(s, 0.86);
    const b = onTop(s, 0.08);
    out.push(...fin([a, b], [up(a, hgt * 0.8), up(pt(a, b, 0.3), hgt), up(pt(a, b, 0.7), hgt * 0.85), up(b, hgt * 0.4, 0.4)], c, { rays: 6 }));
  } else if (kind === 'trail') {
    // Long and trailing back past the tail (angelfish, butterflyfish).
    const a = onTop(s, 0.72);
    const b = onTop(s, 0.12);
    out.push(...fin([a, b], [up(a, hgt * 0.7, -0.2), up(pt(a, b, 0.5), hgt * 1.15, 0.6), [b[0] - 2.4, b[1] - hgt * 0.5]], c, { rays: 5, sheer: true }));
  } else if (kind === 'rear') {
    // Set far back by the tail (pike, gar, arowana).
    const a = onTop(s, 0.32);
    const b = onTop(s, 0.1);
    out.push(...fin([a, b], [up(a, hgt, 0.6), up(b, hgt * 0.5, 0.6)], c, { rays: 3 }));
  } else if (kind === 'shark') {
    const a = onTop(s, 0.62);
    const b = onTop(s, 0.4);
    out.push(...fin([a, b], [up(pt(a, b, 0.5), hgt * 1.3, 1.4), up(b, hgt * 0.35, 0.6)], c, { rays: 0 }));
  } else if (kind === 'lion') {
    // Long venom spines with a web of fin between them.
    const a = onTop(s, 0.8);
    const b = onTop(s, 0.3);
    for (let i = 0; i < 6; i++) {
      const p = pt(a, b, i / 5);
      const tip = up(p, hgt * (1.5 - i * 0.12), 1 + i * 0.2);
      out.push(S(tube([p, tip], 0.5, 0.1), mix(c, '#ffffff', 0.55)), line([p, tip], 0.2, sh(c)));
    }
  } else if (kind === 'finlets') {
    const a = onTop(s, 0.66);
    const b = onTop(s, 0.46);
    out.push(...fin([a, b], [up(a, hgt * 1.2, 1.2)], c, { rays: 2 }));
    for (const t of [0.3, 0.2, 0.1]) {
      const p = onTop(s, t);
      out.push(S([[p[0] + 0.5, p[1] + 0.2], [p[0] - 0.5, p[1] - 0.9], [p[0] - 0.4, p[1] + 0.2]], o.finlet ?? '#ffe08a'));
    }
  }
  return out;
}

function underFins(s, o, c) {
  const out = [];
  if (o.anal !== false) {
    const kind = o.anal ?? 'small';
    const a = onBot(s, 0.36);
    const b = onBot(s, 0.18);
    const d = o.analH ?? 1.2;
    if (kind === 'trail') out.push(...fin([a, b], [[a[0] - 0.6, a[1] + d * 1.2], [b[0] - 2.2, b[1] + d * 0.6]], c, { rays: 4, sheer: true }));
    else if (kind === 'tall') out.push(...fin([a, onBot(s, 0.12)], [[a[0] - 0.2, a[1] + d * 1.8], [b[0] - 1, b[1] + d * 1.3]], c, { rays: 4 }));
    else if (kind === 'finlets') {
      out.push(...fin([a, b], [[a[0] - 1, a[1] + d]], c, { rays: 1 }));
      for (const t of [0.12, 0.06]) {
        const p = onBot(s, t + 0.04);
        out.push(S([[p[0] + 0.5, p[1] - 0.2], [p[0] - 0.5, p[1] + 0.8], [p[0] - 0.4, p[1] - 0.2]], o.finlet ?? '#ffe08a'));
      }
    } else out.push(...fin([a, b], [[a[0] - 0.8, a[1] + d], [b[0] - 0.5, b[1] + d * 0.5]], c, { rays: 2 }));
  }
  if (o.pelvic !== false) {
    const a = onBot(s, 0.62);
    const b = onBot(s, 0.5);
    out.push(...fin([a, b], [[b[0] - 0.6, b[1] + (o.pelvicH ?? 1.1)]], c, { rays: 1 }));
  }
  return out;
}

function pectoral(s, o, c) {
  const kind = o.pectoral ?? 'small';
  if (kind === 'none') return [];
  const gx = s.n - s.L * 0.3;
  const y = s.cy + s.hb * 0.25;
  const base = [[gx + 0.2, y - 0.5], [gx + 0.3, y + 0.5]];
  const tone = mix(c, '#ffffff', 0.15);
  if (kind === 'wing') return fin(base, [[gx - 3, y - 3.2], [gx - 6.4, y - 2.2], [gx - 3.8, y + 0.4]], tone, { rays: 5, sheer: true });
  // A lionfish's fanned pectorals.
  if (kind === 'fan') return fin(base, [[gx - 1, y + 4.6], [gx - 4, y + 5], [gx - 6, y + 3.4], [gx - 5.6, y + 1]], tone, { rays: 6, sheer: true });
  if (kind === 'big') return fin(base, [[gx - 2, y - 1], [gx - 3, y + 1.4], [gx - 1.4, y + 2.2]], tone, { rays: 3 });
  return fin(base, [[gx - 1.6, y - 0.6], [gx - 2.1, y + 0.9], [gx - 0.8, y + 1.4]], tone, { rays: 2 });
}

// The body's colouring: the base, the darker back, the pale belly, a soft light along the top,
// then its markings.
function skin(s, o, c) {
  const { body, r, n, h, hb, cy, L } = s;
  const back = o.back ?? mix(dk(c), c, 0.35);
  const belly = o.belly ?? mix(c, '#fff8ee', 0.6);
  const mid = (r + n) / 2;
  const out = [S(body, c)];
  out.push(S(clip(body, oval(mid, cy - h * 1.55, L * 0.75, h * 1.05, 0, 28)), back));
  out.push(S(clip(body, oval(mid + L * 0.08, cy + hb * 1.35, L * 0.62, hb * 0.95, 0, 28)), belly));
  out.push(S(clip(body, oval(mid, cy + hb * 2.05, L * 0.7, hb * 0.95, 0, 28)), sh(belly)));
  const tone = (y) => (y < cy - h * 0.35 ? ink(back) : y > cy + hb * 0.35 ? sh(belly) : sh(c));
  for (const m of o.marks ?? []) out.push(...mark(s, m, c));
  if (o.skin !== 'smooth') out.push(...scales(body, tone, { step: o.scale ?? 1.25, r: (o.scale ?? 1.25) * 0.5, from: r + 0.8, to: n - L * 0.28 }));
  // A long soft light along the back.
  out.push(S(clip(body, oval(mid + L * 0.05, cy - h * 0.55, L * 0.42, h * 0.22, -4, 20)), mix(lt(c), '#ffffff', 0.25)));
  if (o.lateral) out.push(line(bez([r + 0.6, cy + 0.1], [mid, cy - h * 0.35], [n - L * 0.3, cy - h * 0.3], 10), 0.28, o.lateral));
  return out;
}

// A marking on the body: vertical `bands` (at fractions `at` of the length), a horizontal
// `stripe`, `spots`, koi `patches`, fine `dots`, a `star`, or a `blush` round the face.
function mark(s, m, c) {
  const { body, r, n, h, hb, cy, L } = s;
  const out = [];
  const X = (t) => r + L * t;
  if (m.kind === 'bands') {
    for (const t of m.at) {
      const w = m.w ?? 0.9;
      const x = X(t);
      const band = [[x - w / 2 + 0.3, cy - h * 1.6], [x + w / 2 + 0.3, cy - h * 1.6], [x + w / 2 - 0.3, cy + hb * 1.6], [x - w / 2 - 0.3, cy + hb * 1.6]];
      out.push(S(clip(body, band), m.c));
      if (m.edge) {
        out.push(S(clip(body, [[x - w / 2 - 0.05, cy - h * 1.6], [x - w / 2 + 0.3, cy - h * 1.6], [x - w / 2 - 0.3, cy + hb * 1.6], [x - w / 2 - 0.65, cy + hb * 1.6]]), m.edge));
        out.push(S(clip(body, [[x + w / 2 + 0.3, cy - h * 1.6], [x + w / 2 + 0.65, cy - h * 1.6], [x + w / 2 + 0.05, cy + hb * 1.6], [x + w / 2 - 0.3, cy + hb * 1.6]]), m.edge));
      }
    }
  } else if (m.kind === 'stripe') {
    const y = cy + (m.y ?? 0);
    const w = m.w ?? 0.9;
    out.push(S(clip(body, [[r - 1, y - w / 2], [n + 1, y - w / 2 - 0.4], [n + 1, y + w / 2 - 0.4], [r - 1, y + w / 2]]), m.c));
  } else if (m.kind === 'spots') {
    for (const [t, dy, rad] of m.at) {
      const p = [X(t), cy + dy];
      if (inside(p, body)) out.push(S(clip(oval(p[0], p[1], rad, rad * 0.95, 0, 14), body.length > 3 ? oval(r + L / 2, cy, L * 0.62, (h + hb) * 0.62) : body), m.c));
      if (m.ring) out.push(S(clip(oval(p[0] - rad * 0.2, p[1] - rad * 0.25, rad * 0.4, rad * 0.4, 0, 10), body), m.ring));
    }
  } else if (m.kind === 'patches') {
    for (const [t, dy, rx, ry, deg] of m.at) out.push(S(clip(body, oval(X(t), cy + dy, rx, ry, deg, 18)), m.c));
  } else if (m.kind === 'dots') {
    let i = 0;
    for (let t = 0.12; t < 0.74; t += 0.085) for (const dy of [-h * 0.55, -h * 0.1, hb * 0.35]) {
      const p = [X(t + ((i++ % 2) * 0.04)), cy + dy];
      if (inside(p, body)) out.push(S(oval(p[0], p[1], m.r ?? 0.32, m.r ?? 0.32, 0, 8), m.c));
    }
  } else if (m.kind === 'star') {
    out.push(twinkle(X(m.t ?? 0.45), cy + (m.dy ?? 0), m.r ?? 2, m.c), twinkle(X((m.t ?? 0.45) - 0.22), cy + hb * 0.5, (m.r ?? 2) * 0.45, m.c));
  } else if (m.kind === 'blush') {
    out.push(S(oval(n - L * 0.2, cy + hb * 0.25, 0.9, 0.55, 0, 12), m.c ?? '#ff8fb0'));
  }
  return out;
}

function head(s, o, c) {
  const { n, L, h, hb, cy } = s;
  const out = [];
  // The gill cover's edge.
  const gx = n - L * (o.gill ?? 0.3);
  out.push(line(bez([gx + 0.5, cy - h * 0.55], [gx - 0.5, cy + 0.2], [gx + 0.4, cy + hb * 0.7], 8), 0.32, ink(c)));
  out.push(line(bez([gx + 0.85, cy - h * 0.45], [gx + 0.05, cy + 0.2], [gx + 0.75, cy + hb * 0.6], 8), 0.22, lt(c)));
  const mouth = o.mouth ?? 'smile';
  const mx = n - 0.2;
  const my = cy + 0.35 + (s.body ? 0 : 0);
  if (mouth === 'smile') out.push(line(bez([mx - 1.6, my + 0.2], [mx - 0.8, my + 0.6], [mx, my - 0.1], 5), 0.32, ink(c)));
  else if (mouth === 'big') {
    out.push(S([[mx + 0.3, my - 0.4], [mx - 2.6, my + 0.2], [mx + 0.2, my + 1.1]], ink(c)), line([[mx - 2.6, my + 0.2], [mx + 0.3, my - 0.35]], 0.3, lt(c)));
  } else if (mouth === 'pout') out.push(S(oval(mx + 0.2, my, 0.75, 0.6, 0, 12), mix(c, '#ff8fb0', 0.4)), S(oval(mx + 0.35, my, 0.3, 0.25, 0, 8), ink(c)));
  else if (mouth === 'beak') {
    const bk = o.beak ?? mix(c, '#ffffff', 0.5);
    out.push(S([[mx - 1.6, my - 1.2], [mx + 0.9, my - 0.2], [mx + 0.6, my + 0.4], [mx - 1.6, my + 1.1]], bk), line([[mx - 1.4, my - 0.05], [mx + 0.7, my + 0.1]], 0.28, ink(bk)));
  } else if (mouth === 'bill') {
    out.push(S(tube([[mx - 1, my - 0.4], [mx + 3.2, my - 1.2]], 0.9, 0.15), o.bill ?? dk(c)));
  } else if (mouth === 'under') out.push(line(bez([mx - 1.4, my + 1], [mx - 0.6, my + 1.3], [mx, my + 0.6], 5), 0.32, ink(c)));
  if (o.barbels) for (const k of [0, 1]) out.push(line(bez([mx - 0.2, my + 0.5], [mx + 0.3 + k * 0.4, my + 1.4], [mx - 0.3 + k * 0.9, my + 2.4 - k * 0.3], 6), 0.3, o.barbelC ?? dk(c)));
  if (o.whiskers) for (const [dx, dy] of [[2.4, -1.4], [3, 0.6], [2.2, 2.2]]) out.push(line(bez([mx - 0.3, my + 0.2], [mx + dx * 0.4, my + dy * 0.6], [mx + dx * 0.2 - 1.4, my + dy + 1.6], 6), 0.3, o.whiskerC ?? dk(c)));
  const ex = n - L * (o.eyeX ?? 0.16);
  const ey = cy - h * (o.eyeY ?? 0.24);
  out.push(...eye(ex, ey, o.eye ?? 1.05, o.iris));
  return out;
}

function fishKind(f, o) {
  const s = fishShape(o);
  const c = f.color;
  const fc = o.fin ?? f.fin;
  const out = [...tail(s, o, fc), ...dorsal(s, o, fc), ...underFins(s, o, fc), ...skin(s, o, c), ...head(s, o, c), ...pectoral(s, o, fc)];
  out.push(...extras(s, o, f));
  out.push(...glint(s.r + s.L * 0.42, s.cy - s.h * 0.55, 0.4));
  return out;
}

// Touches some fish wear: steam off a hot one, frost, sparkles, a comet's trail, a little crown.
function extras(s, o, f) {
  const out = [];
  for (const e of o.extras ?? []) {
    if (e === 'steam') for (const [x, k] of [[s.r + s.L * 0.3, 0], [s.r + s.L * 0.68, 1]]) out.push(S(tube(bez3([x, s.cy - s.h - 1.4], [x + 1.1, s.cy - s.h - 2.2], [x - 1.1, s.cy - s.h - 3.2], [x + 0.3, s.cy - s.h - 4.6 + k * 0.6], 10), (t) => 0.75 - t * 0.55), '#fff4f0'));
    if (e === 'frost') for (const [x, y, r] of [[s.r + s.L * 0.3, s.cy - s.h * 0.4, 0.9], [s.r + s.L * 0.6, s.cy + s.hb * 0.5, 0.7], [s.n - 0.4, s.cy - s.h - 1.4, 1]]) out.push(twinkle(x, y, r, '#f4fbff'));
    if (e === 'sparkle') for (const [x, y, r] of [[s.n - 0.6, s.cy - s.h - 1.2, 1.1], [s.r - 0.6, s.cy + s.hb + 1.6, 0.8], [s.r + s.L * 0.5, s.cy + s.hb + 2, 0.6]]) out.push(twinkle(x, y, r, o.sparkleC ?? '#fff6c4'));
    if (e === 'trail') for (let i = 0; i < 3; i++) out.push(S(tube([[s.r - 0.4 - i * 0.2, s.cy - 1.6 + i * 1.6], [0.2, s.cy - 2.6 + i * 2.3]], 0.6 - i * 0.12, 0.05), i === 1 ? '#ffffff' : f.fin));
    if (e === 'scutes') for (let t = 0.15; t < 0.85; t += 0.11) {
      const p = onTop(s, t);
      out.push(S([[p[0] - 0.5, p[1] + 0.5], [p[0], p[1] - 0.4], [p[0] + 0.5, p[1] + 0.5], [p[0], p[1] + 1]], mix(f.color, '#ffffff', 0.45)));
    }
    if (e === 'slits') for (let k = 0; k < 3; k++) out.push(line([[s.n - s.L * 0.3 - k * 0.6, s.cy - s.h * 0.3], [s.n - s.L * 0.32 - k * 0.6, s.cy + s.hb * 0.35]], 0.22, ink(f.color)));
    if (e === 'bolt') {
      const x = s.r + s.L * 0.5;
      const y = s.cy - s.h - 0.8;
      out.push(S([[x + 0.6, y - 2.2], [x - 0.8, y + 0.2], [x, y + 0.1], [x - 0.9, y + 2], [x + 1.2, y - 0.6], [x + 0.3, y - 0.5], [x + 1.3, y - 2.2]], '#ffe86a'));
    }
    if (e === 'bubbles') for (const [x, y, r] of [[s.n + 0.4, s.cy - s.h - 0.6, 0.7], [s.n - 0.4, s.cy - s.h - 2.2, 0.5], [s.n + 0.6, s.cy - s.h - 3.4, 0.35]]) out.push(S(oval(x, y, r, r, 0, 12), '#e8f8ff'), S(oval(x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.3, 0, 8), W));
    if (e === 'flower') {
      const p = onTop(s, 0.86);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        out.push(S(oval(p[0] + Math.cos(a) * 0.9, p[1] - 1.3 + Math.sin(a) * 0.9, 0.7, 0.7, 0, 10), '#ff9ec0'));
      }
      out.push(S(oval(p[0], p[1] - 1.3, 0.5, 0.5, 0, 10), '#ffe36b'));
    }
    if (e === 'glow') out.push(S(clip(s.body, oval(s.r + s.L * 0.5, s.cy, s.L * 0.3, s.h * 0.4, 0, 18)), mix(f.color, '#ffffff', 0.55)));
    if (e === 'crown') {
      const p = onTop(s, 0.82);
      out.push(S([[p[0] - 1.6, p[1] - 0.2], [p[0] - 1.6, p[1] - 1.7], [p[0] - 0.9, p[1] - 1], [p[0] - 0.2, p[1] - 2], [p[0] + 0.5, p[1] - 1], [p[0] + 1.2, p[1] - 1.7], [p[0] + 1.2, p[1] - 0.2]], '#ffd25a'));
    }
  }
  return out;
}

// ---------- Long bodies ----------

// An eel: a body tapering along an S curve, a fin running the length of its back and belly.
function eelKind(f, o) {
  const c = f.color;
  const [p0, p1, p2, p3] = o.spine ?? [[0.8, o.y0 ?? 12], [4.5, 2.5], [9, 14.5], [14.6, o.y1 ?? 6]];
  const spine = bez3(p0, p1, p2, p3, 26);
  const wid = o.wid ?? 3;
  const finC = o.fin ?? f.fin;
  const out = [S(tube(spine, (t) => (t < 0.12 ? lerp(0.2, wid + 1.8, t / 0.12) : wid + 1.8 - t * 0.6)), finC)];
  const bodyPts = tube(spine, (t) => (t < 0.88 ? lerp(0.5, wid, Math.min(1, t * 2.2)) : lerp(wid, wid * 0.7, (t - 0.88) / 0.12)));
  out.push(S(bodyPts, c));
  out.push(S(tube(spine.map(([x, y]) => [x - 0.15, y - wid * 0.22]), (t) => lerp(0.3, wid * 0.35, Math.min(1, t * 2))), mix(dk(c), c, 0.4)));
  out.push(S(tube(spine.map(([x, y]) => [x + 0.15, y + wid * 0.25]), (t) => lerp(0.2, wid * 0.28, Math.min(1, t * 2))), mix(c, '#fff8ee', 0.55)));
  if (o.bands) for (let i = 3; i < 23; i += 3) out.push(S(oval(spine[i][0], spine[i][1], 0.5, wid * 0.42, 0, 10), o.bands));
  if (o.glowDots) for (let i = 4; i < 23; i += 3) out.push(S(oval(spine[i][0] + 0.3, spine[i][1] + 0.2, 0.42, 0.42, 0, 10), o.glowDots));
  for (let i = 5; i < 22; i += 4) out.push(line([[spine[i][0] - 0.2, spine[i][1] - wid * 0.1], [spine[i][0] + 0.6, spine[i][1] + 0.1]], 0.22, mix(c, '#ffffff', 0.45)));
  const hp = spine[spine.length - 1];
  const hp2 = spine[spine.length - 3];
  const dx = hp[0] - hp2[0];
  const dy = hp[1] - hp2[1];
  const l = Math.hypot(dx, dy);
  const ux = dx / l;
  const uy = dy / l;
  out.push(line([[hp[0] - ux * 0.3, hp[1] - uy * 0.3 + 0.6], [hp[0] - ux * 1.5 + 0.2, hp[1] - uy * 1.5 + 1.3]], 0.3, ink(c)));
  out.push(line(bez([hp[0] - ux * 2.4 - 0.3, hp[1] - uy * 2.4 - 0.8], [hp[0] - ux * 2.8, hp[1] - uy * 2.8 + 0.4], [hp[0] - ux * 2.2 + 0.3, hp[1] - uy * 2.2 + 1.2], 5), 0.28, ink(c)));
  out.push(...eye(hp[0] - ux * 1.05 - 0.2, hp[1] - uy * 1.05 - 0.55, 0.72, o.iris));
  if (o.crest) {
    // An oarfish's red crest streaming back from its head.
    for (let k = 0; k < 4; k++) out.push(S(tube(bez([hp[0] - 1.4 - k * 0.5, hp[1] - 1.2], [hp[0] - 2.6 - k * 0.8, hp[1] - 3.2 - k * 0.3], [hp[0] - 4.6 - k * 0.9, hp[1] - 3.6 + k * 0.4], 8), 0.75, 0.1), o.crest));
  }
  out.push(...glint(spine[12][0] - 0.5, spine[12][1] - 0.8, 0.35));
  return out;
}

// ---------- Their own shapes ----------

// A pufferfish blown up round, spikes all over, its little fins paddling.
function pufferKind(f, o) {
  const c = f.color;
  const cx = 8.4;
  const cy = 8.2;
  const R = 5.6;
  const out = [];
  out.push(...fin([[cx - R + 0.6, cy - 0.6], [cx - R + 0.6, cy + 0.6]], [[cx - R - 2.2, cy - 2], [cx - R - 1.6, cy], [cx - R - 2.2, cy + 2]], f.fin, { rays: 3 }));
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.17;
    const b = [cx + Math.cos(a) * (R - 0.4), cy + Math.sin(a) * (R - 0.4)];
    out.push(S([[b[0] + Math.sin(a) * 0.45, b[1] - Math.cos(a) * 0.45], [cx + Math.cos(a) * (R + 1.2), cy + Math.sin(a) * (R + 1.2)], [b[0] - Math.sin(a) * 0.45, b[1] + Math.cos(a) * 0.45]], o.spike ?? mix(f.fin, '#ffffff', 0.3)));
  }
  const body = oval(cx, cy, R, R * 0.96, 0, 36);
  out.push(S(body, c), S(clip(body, oval(cx, cy - R * 1.2, R * 1.1, R * 0.9)), mix(dk(c), c, 0.5)), S(clip(body, oval(cx + 0.6, cy + R * 1.05, R * 0.9, R * 0.75)), mix(c, '#fff8ee', 0.7)));
  for (const [x, y] of [[5.2, 6.4], [7.4, 5], [9.6, 6], [6.2, 8.6], [8.6, 8.2], [4.8, 10.2]]) out.push(S(oval(x, y, 0.55, 0.55, 0, 10), o.spot ?? f.fin), S(oval(x - 0.15, y - 0.2, 0.2, 0.2, 0, 8), lt(c)));
  out.push(S(clip(body, oval(cx - 1.6, cy - 2.6, 2.6, 1.4, -15)), hi(c)));
  out.push(...fin([[10.6, 9.2], [10.8, 10.4]], [[8.6, 9.6], [8.8, 11.4]], mix(f.fin, '#ffffff', 0.2), { rays: 2 }));
  out.push(...eye(11.6, 6.6, 1.35, o.iris));
  out.push(S(oval(14.1, 9.3, 0.85, 0.75, 0, 12), mix(c, '#ff8fb0', 0.45)), S(oval(14.35, 9.3, 0.35, 0.3, 0, 8), ink(c)));
  out.push(S(oval(12.4, 9.6, 0.9, 0.5, 0, 10), '#ff9ec0'));
  out.push(...glint(6, 4.6, 0.45));
  return out;
}

// A ray seen from above: a wide diamond of wings, eyes on top, a long whip tail.
function rayKind(f, o) {
  const c = f.color;
  const out = [];
  out.push(line(bez([7, 10.4], [5, 13.4], [1.2, 15], 10), 0.55, f.fin));
  if (o.barb) out.push(S([[3.2, 13.8], [2.6, 12.6], [3.8, 13.4]], f.fin));
  const wing = [...bez3([8.2, 2.4], [10.6, 2.6], [14.4, 5.6], [15.4, 7.6], 10), ...bez3([15.4, 7.6], [12.6, 8.8], [10.4, 11.4], [8.2, 11.6], 10).slice(1), ...bez3([8.2, 11.6], [6, 11.4], [3.8, 8.8], [1, 7.6], 10).slice(1), ...bez3([1, 7.6], [2, 5.6], [5.8, 2.6], [8.2, 2.4], 10).slice(1, -1)];
  out.push(S(wing, c), S(clip(wing, oval(8.2, 13, 8, 4.2)), mix(c, '#fff8ee', 0.35)));
  out.push(S(clip(wing, oval(8.2, 6.8, 3.2, 4.4)), mix(dk(c), c, 0.45)));
  for (const k of [-1, 1]) out.push(line(bez([8.2 + k * 1.6, 5], [8.2 + k * 4.4, 6.2], [8.2 + k * 6.6, 7.6], 8), 0.26, sh(c)));
  for (const [x, y, r] of o.spots ?? [[4.6, 6.6, 0.55], [11.8, 6.6, 0.55], [6, 9.2, 0.45], [10.4, 9.2, 0.45], [3, 7.6, 0.35], [13.4, 7.6, 0.35]]) out.push(S(oval(x, y, r, r, 0, 10), o.spotC ?? lt(c)));
  if (o.stars) for (const [x, y, r] of [[4.6, 6.6, 1], [11.8, 6.4, 0.8], [8.2, 9.6, 0.7]]) out.push(twinkle(x, y, r, o.stars));
  for (const k of [-1, 1]) out.push(...eye(8.2 + k * 1.15, 4.4, 0.62, o.iris));
  out.push(S(clip(wing, oval(6.2, 4.6, 2.6, 1.2, -25)), hi(c)));
  out.push(...glint(5.4, 5.2, 0.4));
  return out;
}

// A seahorse: curled tail, arched belly, a snout, a crown, a frilly back fin.
function seahorseKind(f, o) {
  const c = f.color;
  const out = [];
  const spine = [...bez3([9.6, 3.6], [6.8, 5.4], [6.6, 10], [8.4, 12.2], 12), ...arcPts(10, 12.4, 1.6, 1.8, 180, 470, 12).slice(1)];
  out.push(...fin([[6.9, 7], [7, 9.6]], [[4.6, 7.2], [4.4, 8.6], [5, 9.8]], f.fin, { rays: 3, sheer: true }));
  out.push(S(tube(spine, (t) => (t < 0.45 ? 3.6 - t * 2 : lerp(2.7, 0.5, (t - 0.45) / 0.55))), c));
  out.push(S(tube(bez3([9.2, 4.6], [8.6, 6.2], [9.6, 9.6], [9.6, 11.2], 10).map(([x, y]) => [x + 0.5, y]), 1.6, 0.6), mix(c, '#fff8ee', 0.55)));
  for (let i = 2; i < 14; i++) out.push(line([[spine[i][0] - 1.1, spine[i][1]], [spine[i][0] + 1.1, spine[i][1] + 0.3]], 0.24, sh(c)));
  const headPts = [...bez3([8.4, 4.6], [8.2, 2.2], [10.6, 1], [12, 2.6], 8), [14.8, 3.6], [15, 4.6], [12.2, 4.8], ...bez([12.2, 4.8], [11, 6.4], [9, 5.6], 5).slice(1)];
  out.push(S(headPts, c), S(clip(headPts, oval(10.4, 1.4, 2.4, 1.6)), mix(dk(c), c, 0.45)));
  out.push(S([[9, 2.4], [8.8, 0.4], [9.8, 1.6], [10.4, 0.2], [10.8, 1.8], [11.6, 1]], o.crown ?? f.fin));
  if (o.leaves) for (const [x, y, a] of [[6.4, 5.6, -150], [5.8, 8.6, 170], [7, 11.6, 150], [10.8, 14.8, 60], [9.6, 1.4, -100]]) {
    const r = a * Math.PI / 180;
    out.push(S(oval(x + Math.cos(r) * 1.2, y + Math.sin(r) * 1.2, 1.5, 0.75, a, 14), o.leaves), line([[x, y], [x + Math.cos(r) * 2.2, y + Math.sin(r) * 2.2]], 0.22, sh(o.leaves)));
  }
  out.push(...eye(11.2, 3.3, 0.85, o.iris));
  out.push(S(oval(11.6, 4.6, 0.6, 0.38, 0, 10), '#ff8fb0'));
  out.push(...glint(8.6, 6.4, 0.38));
  return out;
}

// A five-armed star with bumps down each arm and a sweet face in the middle.
function starKind(f, o) {
  const c = f.color;
  const cx = 8;
  const cy = 8.6;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const rr = i % 2 ? 2.9 : 7.4;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const round = [];
  for (let i = 0; i < 10; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 10];
    round.push(...bez(a, pt(pt(a, b, 0.5), [cx, cy], i % 2 ? -0.08 : 0.08), b, 4).slice(0, -1));
  }
  const out = [S(round, c), S(clip(round, oval(cx + 1.6, cy + 2.6, 6.4, 5)), sh(c)), S(clip(round, oval(cx - 1.4, cy - 2.4, 4.4, 3.6)), lt(c))];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
    for (let k = 1; k <= 3; k++) {
      const d = 2.2 + k * 1.35;
      out.push(S(oval(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.5 - k * 0.06, 0.5 - k * 0.06, 0, 10), o.bump ?? f.fin));
    }
  }
  out.push(...eye(cx - 1.05, cy - 0.5, 0.72, '#fffbe8'), ...eye(cx + 1.05, cy - 0.5, 0.72, '#fffbe8'));
  out.push(line(bez([cx - 0.7, cy + 0.9], [cx, cy + 1.5], [cx + 0.7, cy + 0.9], 5), 0.3, ink(c)));
  out.push(S(oval(cx - 2, cy + 0.6, 0.6, 0.35, 0, 10), '#ff9ec0'), S(oval(cx + 2, cy + 0.6, 0.6, 0.35, 0, 10), '#ff9ec0'));
  out.push(twinkle(13.6, 2.4, 1.3, '#fffbe0'), ...glint(5.6, 4.8, 0.4));
  return out;
}

// A round little whale: tail flukes up behind, a spout, a pale grooved belly, a flipper.
function whaleKind(f, o) {
  const c = f.color;
  const out = [];
  // The tail stock sweeping up into two flukes.
  out.push(S(tube(bez([4.6, 9.4], [2.6, 9], [2.2, 6.2], 8), 2.4, 1.2), c));
  out.push(S([[2.6, 6.8], ...bez3([2.2, 6.2], [0.4, 5.8], [-0.2, 4.2], [0.2, 3.2], 6), ...bez3([0.2, 3.2], [1.4, 4.4], [2, 4.6], [2.4, 5], 4).slice(1), ...bez3([2.4, 5], [2.8, 3.8], [3.6, 2.6], [4.6, 2.2], 4).slice(1), ...bez3([4.6, 2.2], [4.4, 4], [3.6, 5.8], [2.8, 6.8], 6).slice(1)], f.fin));
  out.push(line(bez([2.4, 6.2], [1.4, 5], [0.6, 3.8], 5), 0.25, sh(f.fin)), line(bez([2.6, 6.2], [3.4, 4.4], [4.2, 2.8], 5), 0.25, sh(f.fin)));
  const body = [...bez3([3, 9], [3.6, 3.8], [12, 2.6], [15.2, 7.6], 16), ...bez3([15.2, 7.6], [15, 12.4], [6, 13], [3, 9], 16).slice(1)];
  out.push(S(body, c), S(clip(body, oval(9, 2.4, 7, 3.6)), mix(c, sh(c), 0.6)));
  const belly = clip(body, oval(10.6, 13.2, 6.2, 3.8));
  out.push(S(belly, mix(c, '#ffffff', 0.7)));
  for (const y of [11, 11.9]) out.push(line(bez([9, y], [11.4, y + 0.3], [13.8, y - 1.1], 6), 0.22, sh(mix(c, '#ffffff', 0.6))));
  out.push(...fin([[8.6, 10.2], [10, 10.4]], [[7.4, 12.8], [6.6, 12.4]], mix(f.fin, c, 0.4), { rays: 1 }));
  out.push(S(clip(body, oval(7.4, 5, 3, 1.3, -14)), hi(c)));
  out.push(...eye(12.4, 7.6, 0.85, '#fffbe8'));
  out.push(S(oval(12.6, 9.2, 0.8, 0.4, 0, 10), '#ff9ec0'), line(bez([13.2, 9.6], [14.2, 10], [15, 9.2], 5), 0.3, ink(c)));
  for (const [dx, k] of [[-1.4, 0], [0, 1], [1.4, 2]]) out.push(S(oval(10.4 + dx, 0.9 + Math.abs(dx) * 0.4, 0.75 - k * 0.0, 0.6, 0, 12), '#e6f4ff'));
  out.push(line([[10.4, 3], [10.4, 1.6]], 0.45, '#e6f4ff'));
  if (o.clouds) out.push(S(oval(3.2, 13.6, 2.2, 1.1, 0, 14), '#ffffff'), S(oval(1.6, 13.8, 1.3, 0.8, 0, 12), '#ffffff'));
  out.push(...glint(6.2, 5.4, 0.42));
  return out;
}

// An anglerfish: a huge head and jaw full of little teeth, a glowing lure on a stalk.
function anglerKind(f, o) {
  const c = f.color;
  const big = o.big ?? 1;
  const out = [];
  out.push(...fin([[4.2, 7.4], [4.2, 9.8]], [[1, 6.2], [1.8, 8.6], [1, 11.2]], f.fin === '#ffe08a' ? mix(c, '#000000', 0.15) : f.fin, { rays: 4 }));
  const body = [...bez3([4, 7.2], [5, 2.6], [11.4, 1.6], [15.2, 6], 16), [15.4, 8.4], ...bez3([15.4, 8.4], [14.6, 13.6], [7, 13.6], [4, 10], 16)];
  out.push(S(body, c), S(clip(body, oval(9.4, 2.2, 6.8, 4)), mix(dk(c), c, 0.35)), S(clip(body, oval(10, 13.6, 5.6, 3)), mix(c, '#fff8ee', 0.35)));
  for (const [x, y] of [[6.6, 5.6], [8.4, 4.2], [7, 10.4], [9, 11.6], [5.6, 8.2]]) out.push(S(oval(x, y, 0.42, 0.42, 0, 8), mix(c, '#ffffff', 0.4)));
  // The jaw, open, with teeth.
  const jaw = [[15.4, 7.6], [10.4, 8.6], [15.2, 10.2]];
  out.push(S(jaw, '#2a1f3a'));
  for (let i = 0; i < 4; i++) {
    const x = 11.2 + i * 1.05;
    out.push(S([[x, 8.4 - i * 0.1], [x + 0.5, 8.3 - i * 0.12], [x + 0.25, 9.2]], W), S([[x + 0.2, 9.9 + i * 0.04], [x + 0.7, 9.95 + i * 0.04], [x + 0.45, 9.1]], W));
  }
  out.push(...fin([[8, 8.4], [8.6, 9.6]], [[6, 7.8], [5.4, 9.4], [6.6, 10.6]], mix(c, '#ffffff', 0.25), { rays: 3 }));
  out.push(...eye(12.4, 5.6, 0.95 * big, o.iris ?? '#fff6c4'));
  // The stalk and its glowing lure.
  const glow = o.lure ?? f.fin;
  out.push(line(bez([10.6, 2.2], [12.4, -1.6], [15, 0.2], 10), 0.4, mix(dk(c), c, 0.4)));
  out.push(S(oval(15, 1.2, 1.7, 1.7, 0, 18), mix(glow, '#ffffff', 0.55)), S(oval(15, 1.2, 1.15, 1.15, 0, 16), glow), S(oval(14.7, 0.9, 0.42, 0.42, 0, 10), W));
  if (o.stars) for (const [x, y, r] of [[7.6, 6.8, 1.1], [9.6, 9.4, 0.7], [5.6, 10.6, 0.6]]) out.push(twinkle(x, y, r, o.stars));
  out.push(...glint(7.2, 3.8, 0.42));
  return out;
}

// Old Lumen: the great lantern fish under the point, a glowing lantern hung from its brow and
// stars across its sides.
function lumenKind(f, o) {
  return anglerKind(f, { ...o, lure: '#fff3a6', stars: '#fffbe0', iris: '#8fe8ff' });
}

// A jellyfish: a soft bell with a frilled rim, frilly arms and long trailing threads.
function jellyKind(f, o) {
  const c = f.color;
  const out = [];
  for (let k = 0; k < 5; k++) {
    const x = 4.6 + k * 1.7;
    out.push(S(tube(bez3([x, 8.6], [x - 1.4, 11], [x + 1.2, 12.8], [x - 0.6 + (k % 2) * 1.2, 15.4], 10), 0.45, 0.15), mix(f.fin, '#ffffff', 0.2)));
  }
  for (const x of [6.8, 9.2]) out.push(S(tube(bez3([x, 8.4], [x + 1, 10.4], [x - 1, 11.6], [x + 0.4, 13.6], 10), (t) => 1.5 - t * 0.9), f.fin), line(bez3([x, 8.6], [x + 0.8, 10.4], [x - 0.8, 11.6], [x + 0.3, 13.4], 8), 0.25, sh(f.fin)));
  const bell = [...bez3([2.2, 8.6], [2, 2.4], [14, 2.4], [13.8, 8.6], 18)];
  for (let i = 1; i <= 8; i++) bell.push([13.8 - i * 1.45, 8.6 + (i % 2 ? 0.9 : 0)]);
  out.push(S(bell, c), S(clip(bell, oval(8, 9.6, 6, 2.6)), sh(c)), S(clip(bell, oval(6.6, 3.6, 3.6, 2.2, -10)), mix(c, '#ffffff', 0.55)));
  // The rings inside the bell, seen through it.
  for (const [x, y] of [[6.2, 6.4], [8, 5.6], [9.8, 6.4]]) out.push(S(oval(x, y, 0.9, 0.8, 0, 14), o.rings ?? mix(f.fin, c, 0.3)), S(oval(x, y, 0.45, 0.4, 0, 10), c));
  if (o.face) out.push(...eye(6.4, 7.4, 0.55, '#fffbe8'), ...eye(9.6, 7.4, 0.55, '#fffbe8'), line(bez([7.4, 8.2], [8, 8.6], [8.6, 8.2], 5), 0.25, ink(c)));
  if (o.glow) for (const [x, y, r] of [[2.6, 3.4, 1.1], [13.6, 4, 0.8], [12.6, 13.4, 0.7]]) out.push(twinkle(x, y, r, o.glow));
  out.push(...glint(5.4, 4.2, 0.45));
  return out;
}

// A squid diving: its mantle pointed up behind, the two fins at its tip, big eyes, and arms
// streaming; a cuttlefish (`cuttle`) lies flat with a frilled skirt all round.
function squidKind(f, o) {
  const c = f.color;
  const out = [];
  if (o.cuttle) {
    for (let k = 0; k < 4; k++) out.push(S(tube(bez([12.6, 8.4 + k * 0.4], [14.6, 8 + k * 1.1], [15.4, 7.2 + k * 1.8], 6), 0.7, 0.2), mix(c, f.fin, 0.3)));
    const skirt = oval(7.4, 8, 6.4, 3.6, 0, 30);
    out.push(S(skirt, f.fin));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      out.push(line([[7.4 + Math.cos(a) * 4.6, 8 + Math.sin(a) * 2.4], [7.4 + Math.cos(a) * 6.2, 8 + Math.sin(a) * 3.4]], 0.24, sh(f.fin)));
    }
    const body = oval(7.4, 8, 5, 2.6, 0, 28);
    out.push(S(body, c), S(clip(body, oval(7.4, 5.6, 5.6, 2)), mix(dk(c), c, 0.5)));
    for (const [x, y, r, cc] of [[4.6, 7.2, 0.7, '#ffe36b'], [6.6, 6.6, 0.8, '#a8e8ff'], [8.6, 7.4, 0.7, '#c8a8ff'], [5.6, 8.8, 0.6, '#a8ffc8'], [9.6, 8.6, 0.5, '#ffe36b']]) out.push(S(oval(x, y, r, r * 0.8, 0, 12), cc));
    out.push(...eye(11.6, 7.4, 0.85, '#fff6c4'));
    out.push(...glint(5.4, 6.2, 0.4));
    return out;
  }
  for (let k = 0; k < 5; k++) out.push(S(tube(bez3([9.6 + k * 0.5, 10.6], [10.6 + k * 0.7, 12.4], [9.6 + k * 1.1, 13.6], [11 + k * 1.1, 15.4], 10), 0.8, 0.2), mix(c, f.fin, 0.35)));
  for (const k of [0, 1]) out.push(S(tube(bez3([11, 10.8], [13.4, 11.6 + k], [12.6, 14 + k], [15.2, 14.6 + k * 0.6], 10), 0.4, 0.4), c), S(oval(15.2, 14.6 + k * 0.6, 0.7, 0.5, 0, 10), c));
  const mantle = [...bez3([7.4, 10.6], [5.4, 7.4], [3.2, 3.4], [2.2, 1.4], 12), ...bez3([2.2, 1.4], [5.6, 2.2], [9.8, 5.4], [12.4, 9.6], 12).slice(1), [10.6, 11.4]];
  out.push(S([[2.2, 1.4], [0.6, 4.4], [4.2, 4.2]], f.fin), S([[2.2, 1.4], [5.8, 0.6], [5.4, 3.4]], f.fin));
  out.push(S(mantle, c), S(clip(mantle, oval(4, 5.4, 3.4, 4.8, 40)), mix(dk(c), c, 0.4)), S(clip(mantle, oval(6.2, 3.6, 2, 1, 40)), mix(c, '#ffffff', 0.55)));
  for (const [x, y] of [[5, 5.6], [6.4, 4.6], [7.2, 7], [8.8, 7.6], [4.4, 3.6]]) out.push(S(oval(x, y, 0.38, 0.38, 0, 8), f.fin));
  out.push(...eye(10, 9.6, 1.1, '#fff6c4'));
  out.push(...glint(4.6, 3, 0.38));
  return out;
}

// A flatfish lying on the sand: a round body fringed with fin all the way round, both eyes on
// the top side.
function flatKind(f, o) {
  const c = f.color;
  const out = [];
  out.push(S(tube([[3.4, 9], [0.8, 9]], 3.6, 4.4), f.fin));
  const fringe = oval(8.6, 9.2, 7.2, 4.8, -4, 34);
  out.push(S(fringe, f.fin));
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    out.push(line([[8.6 + Math.cos(a) * 5.4, 9.2 + Math.sin(a) * 3.4], [8.6 + Math.cos(a) * 7, 9.2 + Math.sin(a) * 4.6]], 0.24, sh(f.fin)));
  }
  const body = oval(8.8, 9.2, 5.8, 3.6, -4, 30);
  out.push(S(body, c), S(clip(body, oval(9, 12.2, 6, 2.6)), sh(c)), S(clip(body, oval(7.2, 7.2, 3, 1.4, -6)), lt(c)));
  for (const [x, y, r] of [[5.4, 9.6, 0.6], [7.6, 10.8, 0.5], [9.6, 9.6, 0.65], [6.8, 8, 0.45], [11.2, 11, 0.45]]) out.push(S(oval(x, y, r, r, 0, 10), o.spot ?? sh(f.fin)), S(oval(x, y, r * 0.4, r * 0.4, 0, 8), lt(c)));
  out.push(...eye(12.2, 6.8, 0.75), ...eye(13.4, 8.2, 0.7));
  out.push(line(bez([13.6, 10], [14.4, 10.4], [14.8, 9.8], 5), 0.3, ink(c)));
  out.push(...glint(6.4, 7.6, 0.4));
  return out;
}

const KINDS = { jelly: jellyKind, squid: squidKind, flat: flatKind, fish: fishKind, eel: eelKind, puffer: pufferKind, ray: rayKind, seahorse: seahorseKind, star: starKind, whale: whaleKind, angler: anglerKind, lumen: lumenKind };

// ---------- Every fish's form ----------
// The shapes behind the fish (body proportions, the tail and fins for its kind), then each fish's
// own options on top.
const MINNOW = { body: { r: 4, n: 15, h: 2.7, hb: 2.4, hump: 0.45, blunt: 0.6 }, tail: 'fork', tailLen: 3, tailSpan: 3, dorsal: 'low', dorsalH: 2 };
const SLIM = { body: { r: 3.6, n: 15.4, h: 2.4, hb: 2.1, hump: 0.4, blunt: 0.35, ny: 0.1 }, tail: 'fork', tailLen: 3.2, tailSpan: 3.2, dorsal: 'low', dorsalH: 2 };
const TROUT = { body: { r: 3.6, n: 15.2, h: 2.9, hb: 2.6, hump: 0.42, blunt: 0.45 }, tail: 'fork', tailLen: 2.6, tailSpan: 3, dorsal: 'low', dorsalH: 2.2 };
const CARP = { body: { r: 4, n: 15, h: 3.6, hb: 2.8, hump: 0.5, blunt: 0.75, ny: 0.6 }, tail: 'fork', tailLen: 3, tailSpan: 3.4, dorsal: 'long', dorsalH: 1.8, barbels: true, mouth: 'pout', scale: 1.5 };
const BASS = { body: { r: 4, n: 15.4, h: 3.6, hb: 3.1, hump: 0.45, blunt: 0.5, ny: 0.2 }, tail: 'round', tailLen: 2.8, tailSpan: 3, dorsal: 'spiny', dorsalH: 2.4, mouth: 'big' };
const DEEP = { body: { r: 5, n: 14.6, h: 4.8, hb: 4.4, hump: 0.5, blunt: 0.6, ny: 0.4 }, tail: 'fan', tailLen: 2.6, tailSpan: 3.2, dorsal: 'trail', dorsalH: 3, anal: 'trail', analH: 2.4, mouth: 'pout', eye: 0.95 };
const TUNA = { body: { r: 4.4, n: 15.6, h: 3.4, hb: 3, hump: 0.52, blunt: 0.4, ny: 0.2, root: 0.5 }, tail: 'lunate', tailLen: 4, tailSpan: 4.2, dorsal: 'finlets', dorsalH: 2, anal: 'finlets', skin: 'smooth', lateral: false };

const GOLD = { body: { r: 5.2, n: 14.4, h: 3.8, hb: 3.8, hump: 0.45, blunt: 0.9, ny: 0.4 }, tail: 'veil', tailLen: 3.6, tailSpan: 3.8, dorsal: 'tall', dorsalH: 2.2, mouth: 'pout', scale: 1.4, eye: 1.2 };
const PIKE = { body: { r: 3.4, n: 15.6, h: 2.2, hb: 2, hump: 0.3, blunt: 0.15, ny: 0.2 }, tail: 'fork', tailLen: 2.6, tailSpan: 2.8, dorsal: 'rear', dorsalH: 2, anal: 'small', eye: 0.85, eyeY: 0.35, eyeX: 0.2, mouth: 'big' };
const SHARK = { body: { r: 4, n: 15.4, h: 2.9, hb: 2.4, hump: 0.45, blunt: 0.35, ny: -0.2, root: 0.6 }, tail: 'shark', tailLen: 3.2, tailSpan: 3.4, dorsal: 'shark', dorsalH: 2.6, skin: 'smooth', mouth: 'under', eye: 0.7, pectoral: 'big', extras: ['slits'] };
const FORM_GOBY = { body: { r: 3.4, n: 15, h: 2.5, hb: 2.4, hump: 0.65, blunt: 0.9, ny: 0.4 }, tail: 'round', tailLen: 2.4, tailSpan: 2.4, dorsal: 'tall', dorsalH: 1.8, eye: 1.2, eyeY: 0.45, skin: 'smooth' };
const FORM = {
  fish_minnow: { ...MINNOW, marks: [{ kind: 'stripe', y: 0.1, w: 0.7, c: '#ffe9a6' }, { kind: 'blush' }] },
  fish_carp: { ...CARP, marks: [{ kind: 'patches', c: '#fff4f8', at: [[0.5, -1.6, 1.6, 1, -10], [0.25, 1.2, 1.2, 0.8, 10]] }] },
  fish_trout: { ...TROUT, lateral: '#ff9ec0', marks: [{ kind: 'stripe', y: 0.2, w: 1, c: '#ffc6dc' }, { kind: 'dots', c: '#3f7a5a', r: 0.3 }] },
  fish_sardine: { ...SLIM, skin: 'scales', scale: 1, marks: [{ kind: 'spots', c: '#5a6a9a', at: [[0.62, -1.1, 0.4], [0.5, -1.1, 0.35], [0.38, -1.1, 0.32]] }, { kind: 'stripe', y: 0.2, w: 0.5, c: '#ffffff' }] },
  fish_mackerel: { ...SLIM, body: { ...SLIM.body, h: 2.7, hb: 2.3 }, dorsal: 'finlets', anal: 'finlets', finlet: '#9fb8e8', skin: 'smooth', back: '#3a5ab0', marks: [{ kind: 'bands', at: [0.2, 0.32, 0.44, 0.56], w: 0.45, c: '#2a3f8a' }] },
  fish_puffer: { kind: 'puffer', spot: '#e8b04a' },
  fish_koi: { ...CARP, body: { ...CARP.body, h: 3.3 }, tail: 'veil', tailLen: 3.4, tailSpan: 3.4, fin: '#ffe0d0', skin: 'scales', marks: [{ kind: 'patches', c: '#ff7a4a', at: [[0.62, -2, 1.8, 1.2, -5], [0.3, -0.4, 1.4, 1.6, 15]] }, { kind: 'patches', c: '#3a2d4f', at: [[0.4, -2.2, 0.8, 0.55, 0], [0.18, -0.6, 0.5, 0.4, 0]] }] },
  fish_eel: { kind: 'eel', glowDots: '#c9b6ff', iris: '#c9fff2' },
  fish_hotfish: { ...TROUT, body: { ...TROUT.body, h: 3.1, blunt: 0.7 }, tail: 'round', mouth: 'pout', marks: [{ kind: 'patches', c: '#ff6b5a', at: [[0.55, -2.2, 2.6, 0.9, 0]] }, { kind: 'blush', c: '#ff5a4a' }], extras: ['steam'] },
  fish_icefish: { ...SLIM, body: { ...SLIM.body, h: 2.6 }, dorsal: 'tall', dorsalH: 2.2, skin: 'smooth', iris: '#cfe8ff', marks: [{ kind: 'bands', at: [0.3, 0.5], w: 0.5, c: '#a8d0ff' }], extras: ['frost', 'glow'] },
  fish_starfish: { kind: 'star', bump: '#fff6c4' },
  fish_seraph: { ...DEEP, fin: '#fff4c8', marks: [{ kind: 'bands', at: [0.45, 0.7], w: 0.7, c: '#ffe9a6', edge: '#fffbe8' }], extras: ['sparkle'] },
  fish_whale: { kind: 'whale', clouds: true },
  fish_perch: { ...BASS, body: { ...BASS.body, h: 3.2, hb: 2.7 }, tail: 'fork', mouth: 'smile', marks: [{ kind: 'bands', at: [0.25, 0.42, 0.58], w: 0.8, c: '#ff8fb8' }] },
  fish_mossbass: { ...BASS, marks: [{ kind: 'stripe', y: 0.3, w: 1.1, c: '#3f7a4a' }, { kind: 'dots', c: '#b8e0a0', r: 0.28 }] },
  fish_catfish: { body: { r: 3.6, n: 15.4, h: 2.8, hb: 2.6, hump: 0.55, blunt: 0.85, ny: 0.8 }, tail: 'fork', tailLen: 2.6, tailSpan: 2.6, dorsal: 'tall', dorsalH: 2, anal: 'tall', analH: 1, skin: 'smooth', whiskers: true, mouth: 'under', eye: 0.8, eyeY: 0.35, marks: [{ kind: 'dots', c: '#9a7a6a', r: 0.36 }] },
  fish_sylphfin: { ...DEEP, body: { ...DEEP.body, h: 4.4 }, fin: '#d8c8ff', marks: [{ kind: 'bands', at: [0.62], w: 1.2, c: '#3a2d4f' }, { kind: 'spots', c: '#b89cff', ring: '#ffffff', at: [[0.18, -1, 1]] }], extras: ['sparkle'], sparkleC: '#e8f8ff' },
  fish_cavefish: { ...MINNOW, body: { ...MINNOW.body, blunt: 0.7 }, eye: 1.25, iris: '#7fe6d6', skin: 'smooth', marks: [{ kind: 'spots', c: '#7fe6d6', ring: '#e8fffb', at: [[0.2, 0.9, 0.42], [0.34, 1.2, 0.42], [0.48, 1.3, 0.42], [0.62, 1.2, 0.42]] }], extras: ['glow'] },
  fish_char: { ...TROUT, body: { ...TROUT.body, h: 3.1 }, back: '#3f5ab0', belly: '#ffc4b8', fin: '#ffb3a6', marks: [{ kind: 'spots', c: '#ffd0c4', ring: '#ff6b5a', at: [[0.3, -1.3, 0.45], [0.45, -0.4, 0.4], [0.58, -1.6, 0.38], [0.22, 0.2, 0.34]] }] },
  fish_dragonkoi: { ...CARP, tail: 'veil', tailLen: 3.6, tailSpan: 3.6, dorsal: 'long', dorsalH: 2.4, skin: 'scales', scale: 1.4, barbelC: '#ff6b5a', marks: [{ kind: 'patches', c: '#ff6b5a', at: [[0.5, -2, 2.4, 1.2, -5]] }], extras: ['sparkle'] },
  fish_auroratrout: { ...TROUT, lateral: '#ffffff', marks: [{ kind: 'stripe', y: -0.3, w: 0.7, c: '#c9a6ff' }, { kind: 'stripe', y: 0.5, w: 0.6, c: '#ffb3e6' }], extras: ['frost'] },
  fish_cloudcarp: { ...CARP, tail: 'veil', tailLen: 3.2, tailSpan: 3.2, fin: '#ffffff', marks: [{ kind: 'patches', c: '#c8dcff', at: [[0.55, -1.8, 1.6, 0.9, 0], [0.3, 1, 1.2, 0.7, 0]] }], extras: ['sparkle'], sparkleC: '#ffffff' },
  fish_comet: { ...MINNOW, body: { ...MINNOW.body, h: 2.5, hb: 2.2, r: 5 }, tail: 'fork', marks: [{ kind: 'stripe', y: 0, w: 0.9, c: '#7f9cff' }, { kind: 'stripe', y: 0, w: 0.35, c: '#ffffff' }], extras: ['trail'] },
  fish_nebularay: { kind: 'ray', stars: '#ffe9ff', spotC: '#a898f0' },
  // The sea.
  fish_goby: { ...FORM_GOBY, marks: [{ kind: 'spots', c: '#ff8a6a', ring: '#fff1c4', at: [[0.22, -0.5, 0.5], [0.38, 0.8, 0.45], [0.5, -1, 0.5], [0.64, 0.6, 0.4]] }] },
  fish_clown: { body: { r: 4, n: 14.8, h: 3.3, hb: 3, hump: 0.45, blunt: 0.85, ny: 0.4 }, tail: 'round', tailLen: 2.4, tailSpan: 2.8, dorsal: 'spiny', dorsalH: 1.8, mouth: 'pout', skin: 'smooth', fin: '#ff9e5a', marks: [{ kind: 'bands', at: [0.18, 0.46, 0.76], w: 1.3, c: '#ffffff', edge: '#2a2340' }] },
  fish_seapony: { kind: 'seahorse' },
  fish_flying: { ...SLIM, pectoral: 'wing', tail: 'fork', tailLen: 3.4, marks: [{ kind: 'stripe', y: 0.3, w: 0.5, c: '#ffffff' }], back: '#5a8ad8' },
  fish_dorado: { body: { r: 3.8, n: 15.2, h: 3.6, hb: 2.6, hump: 0.85, blunt: 1, ny: 1 }, tail: 'fork', tailLen: 3.4, tailSpan: 3.8, dorsal: 'long', dorsalH: 1.8, anal: 'tall', analH: 0.8, skin: 'smooth', back: '#2f9a8a', belly: '#ffe36b', marks: [{ kind: 'dots', c: '#2f7ad0', r: 0.3 }] },
  fish_parrot: { body: { r: 3.8, n: 15.2, h: 3.4, hb: 2.9, hump: 0.55, blunt: 0.9, ny: 0.4 }, tail: 'lunate', tailLen: 2.8, tailSpan: 3.2, dorsal: 'long', dorsalH: 1.4, mouth: 'beak', beak: '#fff4e0', scale: 1.5, marks: [{ kind: 'patches', c: '#ff9ec0', at: [[0.8, -0.4, 1.2, 2, 0]] }, { kind: 'stripe', y: 0.6, w: 0.6, c: '#ffe08a' }] },
  fish_grouper: { ...BASS, body: { ...BASS.body, h: 3.8, hb: 3.4, blunt: 0.55 }, fin: '#ff9a8a', marks: [{ kind: 'spots', c: '#5a8ad8', at: [[0.2, -1, 0.45], [0.32, 1.2, 0.45], [0.42, -2, 0.4], [0.52, 0, 0.45], [0.62, 1.8, 0.4], [0.35, -0.2, 0.4]] }] },
  fish_lagoonray: { kind: 'ray', barb: true, spotC: '#e0e8ff' },
  fish_angler: { kind: 'angler' },
  fish_tuna: { ...TUNA, back: '#2a3f8a', belly: '#e8eeff', marks: [{ kind: 'stripe', y: 0.6, w: 0.5, c: '#ffe08a' }] },
  fish_mola: { body: { r: 4.4, n: 14.6, h: 5.2, hb: 5, hump: 0.4, blunt: 0.85, ny: 0.4, root: 3.6 }, tail: 'none', dorsal: 'none', anal: false, pelvic: false, pectoral: 'small', skin: 'smooth', mouth: 'pout', eye: 0.9, gill: 0.32, molaFins: true, marks: [{ kind: 'dots', c: '#ffffff', r: 0.36 }] },
  fish_oarfish: { kind: 'eel', crest: '#ff4a6a', fin: '#ff6b8a', wid: 2.6, bands: '#c8d8f4' },
  fish_marlin: { ...TUNA, body: { ...TUNA.body, r: 4, n: 13.6, h: 3, hb: 2.6 }, tail: 'lunate', tailLen: 3.6, dorsal: 'sail', dorsalH: 2.4, anal: 'small', mouth: 'bill', bill: '#3a5ab0', back: '#2f5ad0', marks: [{ kind: 'bands', at: [0.3, 0.42, 0.54, 0.66], w: 0.35, c: '#8fb8ff' }] },
  fish_lumen: { kind: 'lumen' },

  // ---------- The second catch ----------
  fish_goldfish: { ...GOLD, extras: ['bubbles'], marks: [{ kind: 'patches', c: '#fff0d8', at: [[0.7, 1.4, 1.4, 1, 0]] }] },
  fish_loach: { ...PIKE, body: { ...PIKE.body, h: 1.9, hb: 1.8, blunt: 0.7, ny: 0.6 }, tail: 'round', dorsal: 'low', dorsalH: 1.4, mouth: 'under', barbels: true, skin: 'smooth', marks: [{ kind: 'dots', c: '#8a6a4a', r: 0.34 }] },
  fish_bluegill: { ...BASS, body: { ...BASS.body, h: 4, hb: 3.6, blunt: 0.75 }, tail: 'fork', mouth: 'pout', marks: [{ kind: 'bands', at: [0.25, 0.42, 0.58], w: 0.6, c: '#6a80c0' }, { kind: 'spots', c: '#2a2a5a', at: [[0.72, -0.6, 0.6]] }, { kind: 'patches', c: '#ffb06a', at: [[0.6, 2.4, 2.4, 1, 0]] }] },
  fish_shiner: { ...SLIM, fin: '#ffc0d8', marks: [{ kind: 'stripe', y: 0, w: 0.7, c: '#ffb0d0' }, { kind: 'stripe', y: -0.1, w: 0.3, c: '#ffffff' }], extras: ['sparkle'], sparkleC: '#ffd8ec' },
  fish_firefly: { ...MINNOW, body: { ...MINNOW.body, r: 5, h: 2.4, hb: 2.1 }, eye: 1.15, iris: '#e8ff9a', skin: 'smooth', marks: [{ kind: 'spots', c: '#f8ffc0', ring: '#ffffff', at: [[0.22, 0.6, 0.55], [0.4, 0.9, 0.5]] }], extras: ['glow', 'sparkle'], sparkleC: '#f4ffb0' },
  fish_rainbow: { ...TROUT, lateral: false, marks: [{ kind: 'stripe', y: 0.2, w: 1.3, c: '#ff9ec0' }, { kind: 'dots', c: '#4a6a7a', r: 0.28 }] },
  fish_pike: { ...PIKE, marks: [{ kind: 'spots', c: '#e8f0b0', at: [[0.2, -0.6, 0.5], [0.32, 0.6, 0.45], [0.44, -0.8, 0.5], [0.56, 0.4, 0.45], [0.68, -0.4, 0.4]] }] },
  fish_flounder: { kind: 'flat', spot: '#a88a5a' },
  fish_bream: { ...DEEP, body: { ...DEEP.body, h: 4, hb: 3.6, r: 4.6 }, tail: 'fork', dorsal: 'spiny', dorsalH: 2, anal: 'small', mouth: 'smile', lateral: '#8a9ab8', marks: [] },
  fish_moonjelly: { kind: 'jelly', rings: '#ffb8e0', face: true },
  fish_darter: { ...MINNOW, body: { ...MINNOW.body, blunt: 0.75, h: 2.4, hb: 2.2 }, dorsal: 'spiny', dorsalH: 1.8, fin: '#ff9a7a', marks: [{ kind: 'bands', at: [0.2, 0.34, 0.48, 0.62], w: 0.55, c: '#ff8a6a' }, { kind: 'blush' }] },
  fish_petalking: { ...CARP, body: { ...CARP.body, h: 3.9, hb: 3.1 }, tail: 'veil', tailLen: 3.6, tailSpan: 3.8, scale: 1.6, marks: [{ kind: 'patches', c: '#ff8ab8', at: [[0.55, -2.2, 2.2, 1.1, -5], [0.26, 0.8, 1.2, 1.1, 10]] }, { kind: 'patches', c: '#ffffff', at: [[0.4, 1.8, 1, 0.6, 0]] }], extras: ['flower', 'sparkle'], sparkleC: '#ffd8ec' },
  fish_dace: { ...SLIM, body: { ...SLIM.body, h: 2.6 }, marks: [{ kind: 'stripe', y: 0.1, w: 0.9, c: '#5a9e6a' }, { kind: 'blush', c: '#ff9aa8' }] },
  fish_guppy: { ...MINNOW, body: { ...MINNOW.body, r: 6.4, h: 2.4, hb: 2.2 }, tail: 'fan', tailLen: 4.6, tailSpan: 4, dorsal: 'tall', dorsalH: 1.6, eye: 1.2, skin: 'smooth', marks: [{ kind: 'spots', c: '#ffffff', at: [[0.3, -0.2, 0.4]] }] },
  fish_betta: { ...GOLD, body: { r: 5.4, n: 14.6, h: 2.8, hb: 2.6, hump: 0.45, blunt: 0.6 }, tail: 'veil', tailLen: 4.4, tailSpan: 4.6, dorsal: 'trail', dorsalH: 2.8, anal: 'trail', analH: 2.6, mouth: 'smile', eye: 1, extras: [] },
  fish_wisptetra: { ...MINNOW, body: { ...MINNOW.body, r: 5, h: 2.5, hb: 2.3 }, skin: 'smooth', marks: [{ kind: 'stripe', y: -0.2, w: 0.8, c: '#6affe0' }, { kind: 'stripe', y: 1, w: 0.5, c: '#ff8ac8' }], extras: ['glow', 'sparkle'], sparkleC: '#c8fff4' },
  fish_mistgar: { ...PIKE, body: { ...PIKE.body, h: 2, hb: 1.8 }, mouth: 'bill', bill: '#8aa898', scale: 1.1, marks: [{ kind: 'dots', c: '#6a8878', r: 0.32 }] },
  fish_raincarp: { ...CARP, fin: '#d8e8ff', marks: [{ kind: 'spots', c: '#e0ecff', ring: '#ffffff', at: [[0.3, -1, 0.6], [0.5, -2, 0.5], [0.5, 0.6, 0.55], [0.68, -0.8, 0.45]] }], extras: ['bubbles'] },
  fish_sturgeon: { ...PIKE, body: { ...PIKE.body, h: 2.6, hb: 2.2, blunt: 0.3, ny: 0.8 }, tail: 'shark', tailLen: 3, tailSpan: 3, skin: 'smooth', mouth: 'under', barbels: true, extras: ['scutes'], marks: [] },
  fish_arowana: { ...PIKE, body: { r: 3.6, n: 15.4, h: 2.8, hb: 2.8, hump: 0.5, blunt: 0.25, ny: -0.6 }, scale: 1.7, barbels: true, barbelC: '#ffe07a', mouth: 'smile', marks: [{ kind: 'stripe', y: 0, w: 0.5, c: '#ffe07a' }], extras: ['glow', 'sparkle'], sparkleC: '#e8ffd0' },
  fish_blindfish: { ...MINNOW, body: { ...MINNOW.body, blunt: 0.8 }, eye: 0.45, iris: '#e8d0e8', skin: 'smooth', marks: [{ kind: 'patches', c: '#ffd0e0', at: [[0.75, 0.4, 1, 0.8, 0]] }] },
  fish_crystaltetra: { ...MINNOW, body: { ...MINNOW.body, r: 5, h: 2.8, hb: 2.6 }, dorsal: 'tall', skin: 'smooth', marks: [{ kind: 'bands', at: [0.3, 0.5], w: 0.5, c: '#ffffff' }, { kind: 'star', t: 0.4, r: 1.3, c: '#ffffff' }], extras: ['sparkle'], sparkleC: '#e0f8ff' },
  fish_geode: { kind: 'puffer', spot: '#ffe07a', spike: '#e8d8ff' },
  fish_spiritfish: { ...TROUT, body: { ...TROUT.body, h: 2.6 }, tail: 'veil', tailLen: 3.4, fin: '#ffffff', skin: 'smooth', iris: '#c0eaff', marks: [{ kind: 'stripe', y: 0, w: 0.6, c: '#ffffff' }], extras: ['glow', 'sparkle'], sparkleC: '#e8f8ff' },
  fish_onsengoby: { ...FORM_GOBY, marks: [{ kind: 'spots', c: '#ff9a8a', ring: '#fff0e8', at: [[0.24, -0.4, 0.5], [0.42, 0.8, 0.45], [0.58, -0.8, 0.45]] }, { kind: 'blush', c: '#ff7a7a' }], extras: ['steam'] },
  fish_snapper: { ...BASS, body: { ...BASS.body, blunt: 0.4 }, tail: 'fork', mouth: 'smile', lateral: '#ffb8c0', marks: [] },
  fish_embereel: { kind: 'eel', spine: [[0.8, 5], [5, 15], [9.6, 1.6], [14.6, 9]], bands: '#ffd04a', iris: '#ffe07a' },
  fish_jadeserpent: { kind: 'eel', spine: [[0.8, 8], [3.6, 15.4], [8.6, 0.8], [14.6, 8]], crest: '#ffe07a', bands: '#a8ffd8', iris: '#ffe07a', wid: 3.4 },
  fish_smelt: { ...SLIM, body: { ...SLIM.body, h: 2.1, hb: 1.9 }, marks: [{ kind: 'stripe', y: 0.1, w: 0.6, c: '#c8e0ff' }], extras: ['frost'] },
  fish_glacierpike: { ...PIKE, fin: '#d8ecff', marks: [{ kind: 'spots', c: '#ffffff', at: [[0.22, -0.5, 0.45], [0.36, 0.5, 0.4], [0.5, -0.7, 0.45], [0.64, 0.3, 0.4]] }], extras: ['frost'] },
  fish_cod: { ...TROUT, body: { ...TROUT.body, h: 3.2, hb: 3, blunt: 0.7 }, dorsal: 'long', dorsalH: 1.6, barbels: true, mouth: 'under', lateral: '#ffffff', marks: [{ kind: 'dots', c: '#8a98a8', r: 0.32 }], extras: ['frost'] },
  fish_aurorajelly: { kind: 'jelly', rings: '#8fffd8', glow: '#e0fff4' },
  fish_breeze: { ...MINNOW, pectoral: 'wing', marks: [{ kind: 'stripe', y: 0.1, w: 0.5, c: '#ffffff' }] },
  fish_cloudkoi: { ...CARP, tail: 'veil', tailLen: 3.4, tailSpan: 3.4, fin: '#fff0f8', marks: [{ kind: 'patches', c: '#ffc8e8', at: [[0.62, -1.8, 1.4, 0.8, 0]] }, { kind: 'patches', c: '#c8e8ff', at: [[0.42, -0.4, 1.2, 0.9, 0]] }, { kind: 'patches', c: '#fff0a8', at: [[0.24, 1, 1, 0.8, 0]] }], extras: ['sparkle'] },
  fish_sunangel: { ...DEEP, fin: '#ffb090', marks: [{ kind: 'bands', at: [0.4, 0.65], w: 0.9, c: '#ff8a6a', edge: '#ffe8b0' }], extras: ['sparkle'], sparkleC: '#fff0c0' },
  fish_twinkle: { ...MINNOW, body: { ...MINNOW.body, r: 6.2, h: 2.4, hb: 2.2 }, tail: 'fan', tailLen: 4.4, tailSpan: 3.8, skin: 'smooth', marks: [{ kind: 'star', t: 0.5, r: 1.2, c: '#ffffff' }], extras: ['sparkle'] },
  fish_moonfish: { ...DEEP, body: { r: 4.6, n: 14.6, h: 4.6, hb: 4.4, hump: 0.45, blunt: 0.7 }, tail: 'fork', tailLen: 2.6, dorsal: 'trail', anal: 'trail', fin: '#ff8a9a', marks: [{ kind: 'dots', c: '#ffffff', r: 0.42 }], extras: ['sparkle'], sparkleC: '#ffffff' },
  fish_polaris: { ...CARP, tail: 'veil', tailLen: 3.8, tailSpan: 4, scale: 1.6, fin: '#c8dcff', marks: [{ kind: 'star', t: 0.5, dy: -0.6, r: 2.2, c: '#ffe36b' }, { kind: 'patches', c: '#a8c8ff', at: [[0.3, -1.6, 1.2, 0.8, 0]] }], extras: ['glow', 'sparkle'] },
  fish_tang: { ...DEEP, body: { r: 4.4, n: 14.8, h: 3.8, hb: 3.4, hump: 0.45, blunt: 0.75, ny: 0.2 }, tail: 'lunate', tailLen: 2.6, dorsal: 'long', dorsalH: 1.6, anal: 'small', fin: '#2a4ab0', skin: 'smooth', marks: [{ kind: 'patches', c: '#2a3a8a', at: [[0.45, -1.2, 3, 0.9, -8], [0.24, 0.6, 1.4, 0.7, 10]] }] },
  fish_coralsnapper: { ...BASS, body: { ...BASS.body, blunt: 0.4, h: 3.4 }, tail: 'fork', mouth: 'smile', marks: [{ kind: 'stripe', y: 0.4, w: 0.6, c: '#ffd0b0' }] },
  fish_lanternjelly: { kind: 'jelly', rings: '#ff9a5a', glow: '#fff6c4' },
  fish_seadragon: { kind: 'seahorse', leaves: '#a8d060', crown: '#ffc870' },
  fish_butterfly: { ...DEEP, body: { ...DEEP.body, n: 14.2 }, mouth: 'pout', marks: [{ kind: 'bands', at: [0.72], w: 0.8, c: '#3a2d4f' }, { kind: 'spots', c: '#3a2d4f', ring: '#ffffff', at: [[0.24, -1.6, 0.8]] }] },
  fish_lionfish: { ...BASS, body: { ...BASS.body, h: 3, hb: 2.8 }, dorsal: 'lion', dorsalH: 3, pectoral: 'fan', tail: 'round', marks: [{ kind: 'bands', at: [0.2, 0.34, 0.48, 0.62, 0.76], w: 0.6, c: '#fff0e8' }] },
  fish_moray: { kind: 'eel', spine: [[1, 14.6], [3, 6], [10, 13.4], [14.6, 5.4]], wid: 3.6, glowDots: '#f8f0b0' },
  fish_squid: { kind: 'squid' },
  fish_barracuda: { ...PIKE, body: { ...PIKE.body, h: 2.2, hb: 2 }, tail: 'fork', dorsal: 'low', skin: 'smooth', marks: [{ kind: 'bands', at: [0.24, 0.36, 0.48, 0.6], w: 0.4, c: '#8a98a8' }] },
  fish_shark: { ...SHARK, belly: '#eef2f8' },
  fish_manta: { kind: 'ray', stars: '#e8f0ff', spotC: '#6a7ab8', spots: [[4.6, 6.6, 0.7], [11.8, 6.6, 0.7], [8.2, 9.4, 0.6]] },
  fish_wrasse: { ...SLIM, body: { ...SLIM.body, h: 2.6, blunt: 0.6 }, fin: '#ffb0d0', tail: 'round', marks: [{ kind: 'stripe', y: -0.4, w: 0.6, c: '#ff8ac0' }, { kind: 'stripe', y: 0.7, w: 0.5, c: '#4ab0a0' }] },
  fish_trigger: { ...DEEP, body: { r: 4.4, n: 14.6, h: 4, hb: 3.6, hump: 0.5, blunt: 0.4 }, tail: 'lunate', tailLen: 2.6, dorsal: 'spiny', dorsalH: 2, anal: 'small', mouth: 'pout', skin: 'smooth', marks: [{ kind: 'spots', c: '#4a6ad0', at: [[0.2, 1.4, 0.5], [0.34, 2, 0.5], [0.48, 1.6, 0.5], [0.32, -1.2, 0.45]] }, { kind: 'stripe', y: -0.2, w: 0.5, c: '#3a2d4f' }] },
  fish_glassfish: { ...MINNOW, body: { ...MINNOW.body, r: 5, h: 2.7, hb: 2.5 }, skin: 'smooth', marks: [{ kind: 'stripe', y: 0, w: 0.35, c: '#a8c8e8' }, { kind: 'bands', at: [0.25, 0.4, 0.55], w: 0.18, c: '#c8dcf0' }], extras: ['sparkle'], sparkleC: '#ffffff' },
  fish_seabass: { ...BASS, body: { ...BASS.body, blunt: 0.35, h: 3.2 }, tail: 'fork', mouth: 'big', lateral: '#c8d8f0', marks: [] },
  fish_cuttle: { kind: 'squid', cuttle: true },
  fish_gramma: { ...MINNOW, body: { ...MINNOW.body, blunt: 0.8, h: 2.6 }, dorsal: 'long', tail: 'round', skin: 'smooth', marks: [{ kind: 'patches', c: '#ffd23a', at: [[0.2, 0, 2.6, 4, 0]] }, { kind: 'stripe', y: -1, w: 0.25, c: '#ffe8ff' }], extras: ['crown', 'sparkle'] },
  fish_goliath: { ...BASS, body: { ...BASS.body, h: 4, hb: 3.6, blunt: 0.7 }, eye: 0.8, marks: [{ kind: 'patches', c: '#7a6a48', at: [[0.3, -1, 1.2, 0.9, 0], [0.5, 1, 1.1, 0.8, 0], [0.62, -1.8, 0.9, 0.7, 0]] }] },
  fish_nimbusminnow: { ...MINNOW, fin: '#d8e8ff', skin: 'smooth', marks: [{ kind: 'patches', c: '#e0ecff', at: [[0.4, 1.4, 2.4, 0.8, 0]] }], extras: ['sparkle'], sparkleC: '#ffffff' },
  fish_skymanta: { kind: 'ray', spotC: '#ffffff', spots: [[4.6, 6.6, 0.8], [11.8, 6.6, 0.8], [6, 9.2, 0.6], [10.4, 9.2, 0.6]] },
  fish_rainbowfin: { ...TROUT, fin: '#a8f0ff', tail: 'veil', tailLen: 3.2, marks: [{ kind: 'stripe', y: -0.9, w: 0.55, c: '#ffb0b0' }, { kind: 'stripe', y: -0.2, w: 0.55, c: '#ffe8a0' }, { kind: 'stripe', y: 0.5, w: 0.55, c: '#b0f0c0' }, { kind: 'stripe', y: 1.2, w: 0.55, c: '#b0d0ff' }] },
  fish_sunflyer: { ...SLIM, pectoral: 'wing', fin: '#fff4c8', marks: [{ kind: 'stripe', y: 0.3, w: 0.5, c: '#ffffff' }], extras: ['sparkle'] },
  fish_thundereel: { kind: 'eel', spine: [[0.8, 13], [3.4, 2.6], [11, 15], [14.6, 4]], bands: '#ffe86a', iris: '#ffe86a', crest: '#ffe86a', wid: 3 },
  fish_driftjelly: { kind: 'jelly', rings: '#ffc8e8', face: true, glow: '#ffffff' },
};

// The sunfish's tall fins stand straight up and down from its tail end, a frilly clavus behind.
function molaFins(f, o) {
  const s = fishShape(o);
  const fc = f.fin;
  const out = [];
  const t = onTop(s, 0.25);
  const b = onBot(s, 0.25);
  out.push(...fin([[t[0] + 1, t[1] + 0.2], [t[0] - 2.2, t[1] + 0.8]], [[t[0] - 0.6, t[1] - 4.4], [t[0] - 2.2, t[1] - 4.2]], fc, { rays: 3 }));
  out.push(...fin([[b[0] + 1, b[1] - 0.2], [b[0] - 2.2, b[1] - 0.8]], [[b[0] - 0.6, b[1] + 3.8], [b[0] - 2.2, b[1] + 3.6]], fc, { rays: 3 }));
  const back = [];
  for (let i = 0; i <= 6; i++) {
    const y = lerp(s.cy - s.root, s.cy + s.root, i / 6);
    back.push([s.r - (i % 2 ? 0.6 : 1.4), y]);
  }
  out.push(...fin([[s.r + 0.6, s.cy - s.root], [s.r + 0.6, s.cy + s.root]], back, fc, { rays: 5 }));
  return out;
}

export function fishArt(f) {
  return () => {
    const o = FORM[f.id] ?? f.form ?? MINNOW;
    const kind = o.kind ?? 'fish';
    const out = [];
    if (o.molaFins) out.push(...molaFins(f, o));
    out.push(...KINDS[kind](f, o));
    return out;
  };
}
