// The remade bosses' fine painting (2026-11-28, the player: "they are bosses they need to be extremely
// detailed ... hair face eyes needs to be extremely detailed", "most detailed character is Fawnelle").
// Painted the way Fawnelle is (render/fawnelle/art.js): every shape is an item on a list; all the
// outlines are drawn first and then all the fills, so only the figure's outer edge keeps its ink;
// shading is soft (blurred shapes clipped inside the shape they shade), every lock of hair takes its
// colour from one light shared by the whole head.
// Painting like that is slow, so a boss's head is cut into pieces (the face with one expression, the
// cap of the hair, each lock that sways, each ringlet, each flower) and each piece is painted once, at
// the sharpness the screen needs, into a picture of its own: its outline in one, its fill in another,
// for the rig's two passes. Every frame only those pictures are drawn, each turned and moved by the
// boss's springs. A piece is keyed by its design and expression only (never by time or a spring), so
// nothing is painted again while the boss moves.
// Only ways of painting live here (geometry, the item list, a lock lit by one light, the piece cache):
// each boss draws its own head, face, eyes and hair with them in its own folder.

export const TAU = Math.PI * 2;
export const lerp = (a, b, u) => a + (b - a) * u;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smoothU = (u) => u * u * (3 - 2 * u);
export const L2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

// ---------- Geometry ----------
// A smooth line through the points (Catmull-Rom), `n` steps between each two; closed or open.
export function cr(pts, closed = true, n = 6) {
  const out = [];
  const N = pts.length;
  const at = (i) => (closed ? pts[(i + N) % N] : pts[Math.max(0, Math.min(N - 1, i))]);
  const last = closed ? N : N - 1;
  for (let i = 0; i < last; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  if (!closed) out.push(pts[N - 1]);
  return out;
}
export const poly = (pts) => {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
};
export const smooth = (pts, n = 6) => poly(cr(pts, true, n));
export const ell = (x, y, rx, ry, a = 0) => {
  const p = new Path2D();
  p.ellipse(x, y, Math.max(0.05, rx), Math.max(0.05, ry), a, 0, TAU);
  return p;
};
export const join = (...ps) => {
  const p = new Path2D();
  for (const q of ps) p.addPath(q);
  return p;
};
export const mirrorX = (pts, mx = 0) => pts.map(([x, y]) => [2 * mx - x, y]);
export const shift = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
// A band along a line, `w(u)` its width (u 0..1 along it), round at both ends: its outline points.
export function ribbon(line, w, { n = 8, caps = true } = {}) {
  const c = cr(line, false, n);
  const N = c.length;
  const Lp = [];
  const Rp = [];
  const nrm = (i) => {
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(N - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  };
  for (let i = 0; i < N; i++) {
    const [nx, ny] = nrm(i);
    const h = Math.max(0.05, w(i / (N - 1)) / 2);
    Lp.push([c[i][0] + nx * h, c[i][1] + ny * h]);
    Rp.push([c[i][0] - nx * h, c[i][1] - ny * h]);
  }
  const cap = (i, s) => {
    const [nx, ny] = nrm(i);
    const h = Math.max(0.05, w(i / (N - 1)) / 2);
    const dx = ny * s;
    const dy = -nx * s;
    const o = [];
    for (let k = 1; k < 6; k++) {
      const a = (k / 6) * Math.PI;
      o.push([c[i][0] + (nx * Math.cos(a) + dx * Math.sin(a)) * h, c[i][1] + (ny * Math.cos(a) + dy * Math.sin(a)) * h]);
    }
    return o;
  };
  if (!caps) return [...Lp, ...Rp.reverse()];
  return [...Lp, ...cap(N - 1, 1), ...Rp.reverse(), ...cap(0, -1).reverse()];
}
// The centre line of a band and its direction and normal at u, for laying details along it.
export function along(line, u, n = 8) {
  const c = cr(line, false, n);
  const f = clamp(u, 0, 1) * (c.length - 1);
  const i = Math.min(c.length - 2, Math.floor(f));
  const p = L2(c[i], c[i + 1], f - i);
  const d = [c[i + 1][0] - c[i][0], c[i + 1][1] - c[i][1]];
  const l = Math.hypot(...d) || 1;
  return { p, d: [d[0] / l, d[1] / l], n: [-d[1] / l, d[0] / l] };
}
// A line, sampled densely, moved sideways by k half-widths (+ to the line's left).
export function sideOf(line, w, k, n = 10) {
  const c = cr(line, false, n);
  const N = c.length;
  return c.map((p, i) => {
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(N - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const h = (w(i / (N - 1)) / 2) * k;
    return [p[0] - ((b[1] - a[1]) / l) * h, p[1] + ((b[0] - a[0]) / l) * h];
  });
}
// A soft taper: full in the middle, narrowing to a soft rounded tip at the end.
export const taper = (w0, w1, tip = 0.2, bulge = 0) => (u) => {
  const base = lerp(w0, w1, u) * (1 + bulge * Math.sin(Math.PI * u));
  return u > 1 - tip ? base * (0.35 + 0.65 * Math.cos(((u - (1 - tip)) / tip) * Math.PI * 0.5)) : base;
};
// (a stroke's width: thin at both ends, `w` in the middle)
export const swell = (w, end = 0.06) => (u) => w * Math.sin(Math.PI * clamp(u, 0, 1)) + end;

// ---------- Colour ----------
export const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
export const mixHex = (a, b, t) => {
  const pa = parseInt(a.slice(1, 7), 16);
  const pb = parseInt(b.slice(1, 7), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
};
export const lin = (x0, y0, x1, y1, stops) => (ctx) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
};
export const rad = (x, y, r, stops, x0 = x, y0 = y) => (ctx) => {
  const g = ctx.createRadialGradient(x0, y0, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
};

// ---------- The item list ----------
// add(path, fill, outlined, { clip, alpha, stroke, slw, rule, lw, lc, blur, draw, comp })
export class Painter {
  constructor({ out = '#3a2d4f', lw = 2.1 } = {}) {
    this.items = [];
    this.out = out;
    this.lw = lw;
  }
  add(path, fill, line = true, o = {}) {
    this.items.push({ path, fill, line, ...o });
    return path;
  }
  detail(path, fill, o = {}) {
    return this.add(path, fill, false, o);
  }
  // a stroke along points (no fill)
  stroke(pts, col, w, o = {}) {
    const p = new Path2D();
    pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    this.items.push({ path: p, line: false, strokeOnly: col, slw: w, ...o });
    return p;
  }
  // a soft round glow inside a clip
  glow(clip, x, y, r, col, a, o = {}) {
    if (a <= 0.005) return;
    this.detail(ell(x, y, r, r), rad(x, y, r, [[0, rgba(col, a)], [1, rgba(col, 0)]]), { clip, ...o });
  }
  // a soft band of colour along a line (shading, light, a crease), clipped
  band(clip, line, w, col, o = {}) {
    if (line.length < 2) return;
    this.detail(poly(ribbon(line, typeof w === 'function' ? w : () => w, { n: o.n ?? 6 })), col, { clip, ...o });
  }
  // `which`: 'line' (the outlines), 'fill' or both; `k` pixels to a unit (blur scales with it)
  paint(ctx, k = 1, which = 'both') {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (which !== 'fill') {
      for (const it of this.items) {
        if (!it.line) continue;
        ctx.save();
        if (it.lineClip) ctx.clip(it.lineClip);
        ctx.lineWidth = it.lw ?? this.lw;
        ctx.strokeStyle = it.lc ?? this.out;
        ctx.stroke(it.path);
        ctx.restore();
      }
    }
    if (which === 'line') return;
    for (const it of this.items) {
      ctx.save();
      if (it.clip) for (const c of [].concat(it.clip)) ctx.clip(c);
      if (it.alpha != null) ctx.globalAlpha = it.alpha;
      if (it.comp) ctx.globalCompositeOperation = it.comp;
      if (it.blur) ctx.filter = `blur(${(it.blur * k).toFixed(2)}px)`;
      if (it.draw) it.draw(ctx);
      else if (it.strokeOnly) {
        if (it.dash) ctx.setLineDash(it.dash);
        ctx.strokeStyle = it.strokeOnly;
        ctx.lineWidth = it.slw;
        ctx.stroke(it.path);
      } else {
        ctx.fillStyle = typeof it.fill === 'function' ? it.fill(ctx) : it.fill;
        ctx.fill(it.path, it.rule ?? 'nonzero');
        if (it.stroke) {
          ctx.strokeStyle = it.stroke;
          ctx.lineWidth = it.slw ?? 0.6;
          ctx.stroke(it.path);
        }
      }
      ctx.restore();
    }
  }
}

// ---------- Hair ----------
// A hair colour's ramp: hi (gloss), lt, base, sh1, sh2 (shade), deep.
// The fill all a head's locks share: one light from above, the same shade at the same height on every
// lock, so the locks read as one head of hair (Fawnelle's rule, the player: "it looks too disconnected").
export const hairFill = (R, y0, y1, tone = 0) => lin(0, y0, 0, y1, [[0, mixHex(R.base, R.hi, Math.max(0, 0.26 - tone))], [0.36, mixHex(R.base, R.sh1, 0.06 + tone)], [1, mixHex(R.base, R.sh1, 0.5 + tone)]]);
// A lock of hair down its line (root to tip), w(u) its width: narrowing to a soft round tip ('soft') or
// cut straight with soft corners ('blunt'); its shade soft down one side (shade +1: the line's left,
// −1: its right), a deeper edge there, both fading out toward the root so it grows out of the hair
// above; a gloss only inside the head's one band of shine (gy); `strands` fine lines down it.
export function hlock(P, R, line, w, { end = 'soft', shade = 1, tone = 0, gloss = 1, outline = true, fill = null, fy = [-30, 40], gy = [-22, -12], strands = 2, rim = 0, edge = 0 } = {}) {
  const pts = ribbon(line, w, { n: 10, caps: end !== 'blunt' });
  const shape = poly(cr(pts, true, 3));
  P.add(shape, fill ?? hairFill(R, fy[0], fy[1], tone), outline, edge ? { stroke: rgba(R.sh2, edge), slw: 0.45 } : {});
  const a = line[0];
  const b = line[line.length - 1];
  const grow = (c, al) => lin(a[0], a[1], b[0], b[1], [[0, rgba(c, 0)], [0.28, rgba(c, al)], [1, rgba(c, al)]]);
  P.detail(poly(ribbon(sideOf(line, w, shade * 0.58), (u) => w(u) * 0.56, { n: 1 })), grow(R.sh1, 0.6), { clip: shape, blur: 0.6 });
  P.detail(poly(ribbon(sideOf(line, w, shade * 0.9), (u) => w(u) * 0.16 + 0.2, { n: 1 })), grow(R.sh2, 0.4), { clip: shape, blur: 0.32 });
  for (let s = 0; s < strands; s++) {
    const k = strands === 1 ? 0 : lerp(-0.34, 0.3, s / (strands - 1));
    const sl = sideOf(line, w, k);
    P.detail(poly(ribbon(sl.slice(Math.round(sl.length * 0.12), Math.round(sl.length * 0.92)), swell(0.32, 0.02), { n: 1 })), rgba(R.sh2, 0.28), { clip: shape, blur: 0.12 });
  }
  if (gloss) {
    const seg = sideOf(line, w, -shade * 0.14).filter(([, y]) => y >= gy[0] && y <= gy[1]);
    if (seg.length > 3) {
      P.detail(poly(ribbon(seg, swell(1.9, 0.1), { n: 1 })), rgba(R.hi, 0.42 * gloss), { clip: shape, blur: 0.4 });
      P.detail(poly(ribbon(seg, swell(0.7, 0.05), { n: 1 })), rgba('#ffffff', 0.55 * gloss), { clip: shape, blur: 0.15 });
    }
  }
  if (rim) {
    const e = sideOf(line, w, -shade * 0.88);
    P.detail(poly(ribbon(e.slice(Math.round(e.length * 0.15), Math.round(e.length * 0.85)), swell(0.7, 0.05), { n: 1 })), rgba(R.rim ?? '#ffffff', 0.5 * rim), { clip: shape, blur: 0.18 });
  }
  if (end === 'blunt') {
    const y1 = Math.max(...pts.map((q) => q[1]));
    const cut = new Path2D();
    cut.rect(Math.min(...pts.map((q) => q[0])) - 1, y1 - 3.4, 80, 4);
    P.detail(cut, lin(0, y1 - 3.4, 0, y1, [[0, rgba(R.sh1, 0)], [1, rgba(R.sh1, 0.4)]]), { clip: shape });
  }
  return shape;
}
// A ringlet: a tight spiral of hair hanging in turns from (x0, y0), each turn lit on its upper face
// and deep where it curls under, each casting a soft shadow on the turn below; `s` which way it leans.
export function ringlet(P, R, x0, y0, len, w0, s, { n = 7, fy = [-30, 40] } = {}) {
  const turns = [];
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    turns.push({ x: x0 + s * (1.4 * t + 0.5 * Math.sin(k * 1.7)), y: y0 + len * 0.86 * t, w: lerp(w0, w0 * 0.55, t), h: (len / n) * 1.55 * lerp(1, 0.82, t) });
  }
  const last = turns[n - 1];
  hlock(P, R, [[last.x, last.y], [last.x + s * 0.9, last.y + last.h * 0.85], [last.x - s * 0.5, last.y + last.h * 1.3]], (u) => lerp(last.w * 0.6, 1.4, u), { shade: s, gloss: 0, fy, strands: 1 });
  let below = null;
  for (let k = n - 1; k >= 0; k--) {
    const { x, y, w, h } = turns[k];
    const a = s * 0.42;
    const shape = ell(x, y, w / 2, h / 2, a);
    if (below) P.detail(ell(x - s * w * 0.04, y + h * 0.2, w / 2, h / 2, a), rgba(R.sh2, 0.55), { clip: below, blur: 0.45 });
    P.add(shape, lin(x, y - h / 2, x, y + h / 2, [[0, mixHex(R.base, R.hi, 0.3)], [0.5, R.base], [1, mixHex(R.base, R.sh1, 0.6)]]));
    P.detail(ell(x - s * w * 0.14, y + h * 0.22, w * 0.4, h * 0.24, a), rgba(R.sh1, 0.75), { clip: shape, blur: 0.4 });
    const cs = Math.cos(a);
    const sn = Math.sin(a);
    const RT = ([dx, dy]) => [x + dx * cs - dy * sn, y + dx * sn + dy * cs];
    P.detail(poly(ribbon([[-w * 0.44, h * 0.02], [0, h * 0.3], [w * 0.44, h * 0.08]].map(RT), swell(0.8, 0.05), { n: 6 })), rgba(R.sh2, 0.45), { clip: shape, blur: 0.22 });
    P.detail(poly(ribbon([[-w * 0.26, -h * 0.22], [w * 0.04, -h * 0.32], [w * 0.3, -h * 0.2]].map(RT), swell(0.9, 0.05), { n: 6 })), rgba(R.hi, 0.7), { clip: shape, blur: 0.18 });
    below = shape;
  }
}
// A corkscrew curl: one band of hair wound down round its middle line from (x0, y0), `turns` times;
// the halves of each turn passing behind drawn first, deep, then the halves in front, each lit across
// its middle, deep where it turns away, a gloss on its fullest point, a soft crease where it tucks under
// the turn above; its end a soft little curl. `s` which way it winds.
// (`wEnd`: its width at the end, a share of w0; `open`: its turns spaced wider toward the end, 0..1)
export function corkscrew(P, R, x0, y0, len, w0, s, { turns = 5, r0 = 3.6, r1 = 2.2, fy = [-30, 40], sway = 0, wEnd = 0.6, open = 0 } = {}) {
  const T = turns * TAU;
  const at = (th) => {
    const u = th / T;
    const r = lerp(r0, r1, u);
    return [x0 + s * r * Math.sin(th) + sway * u * u, y0 + len * ((1 - open) * u + open * u * u)];
  };
  const wOf = (th) => lerp(w0, w0 * wEnd, th / T);
  const seg = (a, b) => {
    const pts = [];
    for (let k = 0; k <= 8; k++) pts.push(at(lerp(a, b, k / 8)));
    return pts;
  };
  const halves = [];
  for (let k = 0; k < turns * 2; k++) {
    const a = -Math.PI / 2 + k * Math.PI;
    const b = a + Math.PI;
    if (a < 0 && b <= 0) continue;
    halves.push({ a: Math.max(0, a), b: Math.min(T, b), front: k % 2 === 0 });
  }
  // the back halves, deep
  for (const h of halves.filter((q) => !q.front)) {
    const line = seg(h.a, h.b);
    const w = (u) => wOf(lerp(h.a, h.b, u)) * 0.92;
    const p = poly(ribbon(line, w, { n: 2 }));
    P.add(p, mixHex(R.sh1, R.sh2, 0.45));
  }
  // the front halves, top to bottom, each over the one above's end
  let above = null;
  for (const h of halves.filter((q) => q.front)) {
    const line = seg(h.a, h.b);
    const w = (u) => wOf(lerp(h.a, h.b, u));
    const p = poly(ribbon(line, w, { n: 2 }));
    const a = line[0];
    const b = line[line.length - 1];
    P.add(p, lin(a[0], a[1], b[0], b[1], [[0, mixHex(R.base, R.sh1, 0.55)], [0.45, mixHex(R.base, R.lt, 0.2)], [0.62, R.base], [1, mixHex(R.base, R.sh1, 0.6)]]), true, { stroke: rgba(R.sh2, 0.4), slw: 0.4 });
    // (the crease under the turn above, the shade on its lower edge, a gloss across its fullest point)
    if (above) P.detail(above.path, rgba(R.sh2, 0.5), { clip: p, blur: 0.5, draw: (ctx) => { ctx.translate(0.3, 1.2); ctx.fillStyle = rgba(R.sh2, 0.45); ctx.fill(above.path); } });
    P.detail(poly(ribbon(sideOf(line, w, -0.6, 4), (u) => w(u) * 0.5, { n: 1 })), rgba(R.sh1, 0.55), { clip: p, blur: 0.4 });
    const mid = sideOf(line, w, 0.3, 4);
    const m0 = Math.round(mid.length * 0.32);
    const m1 = Math.round(mid.length * 0.68);
    P.detail(poly(ribbon(mid.slice(m0, m1), swell(1.1, 0.05), { n: 1 })), rgba(R.hi, 0.75), { clip: p, blur: 0.25 });
    above = { path: p };
  }
  // its end: a soft little curl
  const e = at(T);
  hlock(P, R, [e, [e[0] + s * 1.2, e[1] + 2.4], [e[0] + s * 0.2, e[1] + 4.6]], (u) => lerp(w0 * Math.min(0.55, wEnd * 0.92), wEnd < 0.5 ? 0.5 : 1.2, u), { shade: s, gloss: 0, fy, strands: 1 });
}
// A four-point twinkle.
export function star4(P, x, y, r, c, a = 0, o = {}) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const an = a + (i / 8) * TAU;
    const rr = i % 2 ? r * 0.26 : r;
    pts.push([x + Math.cos(an) * rr, y + Math.sin(an) * rr]);
  }
  P.detail(poly(pts), c, o);
}

// ---------- Pieces ----------
// A piece: painted once per sharpness into two pictures (outline, fill), drawn in a box (its design
// units) about its own origin. `build(P)` fills a Painter with its items.
const PIECES = new Map();
const LODS = [1.5, 3, 6, 12, 20];
let canvasOf = (w, h) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  return null;
};
// (`fade`: [y0, y1, a], the piece fading out from y0 to y1 by `a`, outline and all: a ghost's see-through tips)
export function piece(key, box, build, { out = '#3a2d4f', lw = 2.1, fade = null } = {}) {
  let pc = PIECES.get(key);
  if (!pc) {
    pc = { key, box, build, out, lw, fade, P: null, lods: new Map() };
    PIECES.set(key, pc);
  }
  return pc;
}
function render(pc, k) {
  if (!pc.P) {
    pc.P = new Painter({ out: pc.out, lw: pc.lw });
    pc.build(pc.P);
  }
  const [x0, y0, x1, y1] = pc.box;
  const pad = pc.lw + 2;
  const W = Math.max(2, Math.ceil((x1 - x0 + pad * 2) * k));
  const H = Math.max(2, Math.ceil((y1 - y0 + pad * 2) * k));
  const mk = (which) => {
    const c = canvasOf(W, H);
    if (!c) return null;
    const g = c.getContext('2d');
    g.setTransform(k, 0, 0, k, (pad - x0) * k, (pad - y0) * k);
    pc.P.paint(g, k, which);
    if (pc.fade) {
      const [f0, f1, fa] = pc.fade;
      const gr = g.createLinearGradient(0, f0, 0, f1);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(0,0,0,' + fa + ')');
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = gr;
      g.fillRect(x0 - pad, f0, x1 - x0 + pad * 2, y1 + pad - f0);
    }
    return c;
  };
  return { line: mk('line'), fill: mk('fill'), flash: null, x: x0 - pad, y: y0 - pad, w: W / k, h: H / k };
}
// Draws a piece in the rig's pass (`mode` 'line' or 'fill'), sharp enough for the screen; `flash`
// (0..1) whitens it as a hit does.
export function drawPiece(ctx, pc, mode, flash = 0) {
  const T = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
  const s = T && Number.isFinite(T.a) ? Math.hypot(T.a, T.b) : 3;
  const k = LODS.find((v) => v >= s * 0.92) ?? LODS[LODS.length - 1];
  let L = pc.lods.get(k);
  if (!L) {
    L = render(pc, k);
    pc.lods.set(k, L);
  }
  const c = mode === 'line' ? L.line : L.fill;
  if (!c) return;
  ctx.drawImage(c, L.x, L.y, L.w, L.h);
  if (mode === 'fill' && flash > 0.01) {
    if (!L.flash) {
      L.flash = canvasOf(c.width, c.height);
      const g = L.flash?.getContext('2d');
      if (g) {
        g.drawImage(c, 0, 0);
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, c.width, c.height);
      }
    }
    if (L.flash) {
      ctx.save();
      ctx.globalAlpha *= flash;
      ctx.drawImage(L.flash, L.x, L.y, L.w, L.h);
      ctx.restore();
    }
  }
}
// (the tests' screen: no pictures to paint into)
export function piecesCanvas(fn) {
  canvasOf = fn;
}
