// The Rootling Dryad (2026-11-24, the player's design: look 3, ringlets and a leaf wreath, a dreamy
// face, on the serpent base): her whole drawing, in smooth paths with soft gradient shading, in the
// serpent base's units (a third of a game pixel; the ground at y 214, her middle at x 150). Built from
// her design page (tools/zz-dryad.html) by the design kit; render/dryad/index.js paints each of her
// parts once into a picture and places it on her rig's bones (render/dryad/serpentrig.js), and builds
// her root live along its tail. Nothing here touches the page until a part is painted.
//
//   PARTS              [part, the bone it rides on, its joint]; 'root' is built live
//   paintPart(ctx, part, face, pass, k)   one part (pass 'lines', 'fills' or both), k px a unit
//   rootItems(T)       her root along the tail's pieces (T: each piece's turn, a matrix, base units)
//   paintItems(ctx, items, pass, k)       paints built items
import { BODIES, DEER } from '../mobs/blankbases.js';
import { hairRamp } from '../hero.js';
import { legDefs, legPhase, stepAt, lowAngle, sinks, placeLeg } from '../mobs/blankquad.js';

const OUT = '#3a2d4f';
// (2026-11-27, second pass: her outline in each part's own deeper colour, never the old dark plum:
// INK is the colour every outlined shape built takes, set round each part as it's built)
const INKS = { hair: '#5f9150', skin: '#b67f76', bark: '#7a543e', leaf: '#558f44' };
let INK = null;
const inked = (c, fn) => {
  const prev = INK;
  INK = c;
  try {
    return fn();
  } finally {
    INK = prev;
  }
};
const B = BODIES.deertaur;
const CX = B.cx;
const GY = B.g;
const HX = CX + B.dx;
const HY = B.head[0];
const HRX = B.head[1];
const HRY = B.head[2];
const lerp = (a, b, u) => a + (b - a) * u;
const L2 = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
const TAU = Math.PI * 2;
const rotP = (pts, cx, cy, a) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);

// ---------- Geometry ----------
// A smooth line through the points (Catmull-Rom), `n` steps between each two; closed or open.
function cr(pts, closed = true, n = 6) {
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
// (a soft body: while WARP is set, every shape built passes its points through it, so a whole part
// bends as one piece of flesh, its shading, fur and stitching with it; small round things move by
// their middles)
let WARP = null;
const poly = (pts) => {
  const p = new Path2D();
  (WARP ? pts.map(WARP) : pts).forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
};
const smooth = (pts, n = 6) => poly(cr(pts, true, n));
const ell = (x, y, rx, ry, a = 0) => {
  const p = new Path2D();
  if (WARP) [x, y] = WARP([x, y]);
  p.ellipse(x, y, Math.max(0.05, rx), Math.max(0.05, ry), a, 0, TAU);
  return p;
};
const join = (...ps) => {
  const p = new Path2D();
  for (const q of ps) p.addPath(q);
  return p;
};
// A band along a line, `w(u)` its width (u 0..1 along it), round at both ends: its outline points.
function ribbon(line, w, { n = 8, caps = true } = {}) {
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
// (the centre line of a band and its normal at u, for laying details along it)
function along(line, u, n = 8) {
  const c = cr(line, false, n);
  const f = u * (c.length - 1);
  const i = Math.min(c.length - 2, Math.floor(f));
  const p = L2(c[i], c[i + 1], f - i);
  const d = [c[i + 1][0] - c[i][0], c[i + 1][1] - c[i][1]];
  const l = Math.hypot(...d) || 1;
  return { p, d: [d[0] / l, d[1] / l], n: [-d[1] / l, d[0] / l] };
}
// A soft taper: full in the middle, narrowing to a soft rounded tip at the end.
const taper = (w0, w1, tip = 0.2, bulge = 0) => (u) => {
  const base = lerp(w0, w1, u) * (1 + bulge * Math.sin(Math.PI * u));
  return u > 1 - tip ? base * (0.35 + 0.65 * Math.cos(((u - (1 - tip)) / tip) * Math.PI * 0.5)) : base;
};
const shift = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);

// ---------- The drawing list: outlines first (only the outer edge survives), then fills ----------
let items = [];
// (the rig: every item drawn while a joint's transform is set carries it, so a whole part (her head,
// her upper body, an ear, the tail) is drawn as designed and then turned and moved as one)
let XF = null;
const withXF = (m, fn) => {
  const prev = XF;
  XF = m ? (prev ? prev.multiply(m) : m) : prev;
  try {
    return fn();
  } finally {
    XF = prev;
  }
};
const rotAbout = (px, py, a) => (a ? new DOMMatrix().translate(px, py).rotate((a * 180) / Math.PI).translate(-px, -py) : new DOMMatrix());
const xfPt = (m, [x, y]) => {
  if (!m) return [x, y];
  const q = m.transformPoint({ x, y });
  return [q.x, q.y];
};
// add(path, fill, outlined, { clip, alpha, stroke, slw, rule, lw, draw })
const add = (path, fill, line = true, o = {}) => items.push({ path, fill, line, lc: INK ?? undefined, ...o, m: XF });
const detail = (path, fill, o = {}) => add(path, fill, false, o);
const lineOf = (pts, c, w, o = {}) => {
  const p = new Path2D();
  (WARP ? pts.map(WARP) : pts).forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  items.push({ path: p, line: false, strokeOnly: c, slw: w, ...o, m: XF });
};
const applyM = (ctx, it) => {
  if (it.m) ctx.transform(it.m.a, it.m.b, it.m.c, it.m.d, it.m.e, it.m.f);
};
// (`pass`: 'lines' the outlines only, 'fills' the fills only, or both)
function paint(ctx, pass = null) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const it of pass === 'fills' ? [] : items) {
    if (it.drawLine) {
      ctx.save();
      it.drawLine(ctx);
      ctx.restore();
      continue;
    }
    if (!it.line) continue;
    ctx.save();
    applyM(ctx, it);
    if (it.lineClip) ctx.clip(it.lineClip);
    ctx.lineWidth = it.lw ?? 2.1;
    ctx.strokeStyle = it.lc ?? OUT;
    ctx.stroke(it.path);
    ctx.restore();
  }
  for (const it of pass === 'lines' ? [] : items) {
    ctx.save();
    applyM(ctx, it);
    if (it.clip) for (const c of [].concat(it.clip)) ctx.clip(c);
    if (it.alpha != null) ctx.globalAlpha = it.alpha;
    if (it.blur) ctx.filter = `blur(${(it.blur * HAIR_SCALE).toFixed(2)}px)`;
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
const lin = (x0, y0, x1, y1, stops) => (ctx) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
};
const rad = (x, y, r, stops) => (ctx) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
};
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
// a soft glow inside a clip
const glow = (clip, x, y, r, col, a) => {
  const [gx, gy] = WARP ? WARP([x, y]) : [x, y];
  const w0 = WARP;
  WARP = null;
  detail(ell(gx, gy, r, r), rad(gx, gy, r, [[0, rgba(col, a)], [1, rgba(col, 0)]]), { clip });
  WARP = w0;
};

// ---------- Small motifs ----------
// A five-petal blossom (sakura: each petal notched at its tip), facing us, turned `a`.
function blossom(x, y, r, a, petal, deep, centre) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const q = a + (i * TAU) / 5;
    const w = (TAU / 5) * 0.5;
    pts.push([x + Math.cos(q - w) * r * 0.42, y + Math.sin(q - w) * r * 0.42]);
    pts.push([x + Math.cos(q - w * 0.55) * r * 1.0, y + Math.sin(q - w * 0.55) * r * 1.0]);
    pts.push([x + Math.cos(q) * r * 0.82, y + Math.sin(q) * r * 0.82]);
    pts.push([x + Math.cos(q + w * 0.55) * r * 1.0, y + Math.sin(q + w * 0.55) * r * 1.0]);
  }
  const p = smooth(pts, 3);
  add(p, rad(x, y, r, [[0, deep], [0.45, petal], [1, petal]]), true, { lw: 1.3 });
  for (let i = 0; i < 5; i++) {
    const q = a + (i * TAU) / 5;
    lineOf([[x + Math.cos(q) * r * 0.18, y + Math.sin(q) * r * 0.18], [x + Math.cos(q) * r * 0.5, y + Math.sin(q) * r * 0.5]], deep, r * 0.08);
  }
  detail(ell(x, y, r * 0.2, r * 0.2), centre);
}
const bud = (x, y, r, a, c, deep) => {
  add(smooth(rotP([[x, y - r * 1.2], [x + r * 0.7, y - r * 0.2], [x + r * 0.5, y + r * 0.6], [x - r * 0.5, y + r * 0.6], [x - r * 0.7, y - r * 0.2]], x, y, a), 4), lin(x, y - r, x, y + r, [[0, c], [1, deep]]), true, { lw: 1.1 });
};
// A four-pointed twinkle.
function star4(x, y, r, c, a = 0) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const q = a + (i * Math.PI) / 4;
    const rr = i % 2 ? r * 0.28 : r;
    pts.push([x + Math.cos(q) * rr, y + Math.sin(q) * rr]);
  }
  detail(poly(pts), c);
}
// A five-pointed star, plump.
function star5(x, y, r, fill, line = true, a = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const q = a + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.5 : r;
    pts.push([x + Math.cos(q) * rr, y + Math.sin(q) * rr]);
  }
  add(smooth(pts, 2), fill, line, { lw: 1.1 });
}
// A crescent moon (a disc with a disc taken out).
function crescent(x, y, r, a, fill, line = true) {
  if (WARP) [x, y] = WARP([x, y]);
  const p = new Path2D();
  p.arc(x, y, r, a + 0.35, a + TAU - 0.35);
  p.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.78, a + TAU - 1.0, a + 1.0, true);
  p.closePath();
  add(p, fill, line, { lw: 1.1 });
}
// A maple leaf.
function maple(x, y, r, a, c, deep) {
  const raw = [[0, -1], [0.18, -0.55], [0.5, -0.78], [0.42, -0.3], [0.95, -0.38], [0.62, 0.02], [0.8, 0.28], [0.3, 0.26], [0.12, 0.62], [0, 0.42], [-0.12, 0.62], [-0.3, 0.26], [-0.8, 0.28], [-0.62, 0.02], [-0.95, -0.38], [-0.42, -0.3], [-0.5, -0.78], [-0.18, -0.55]];
  const pts = rotP(raw.map(([u, v]) => [x + u * r, y + v * r]), x, y, a);
  add(smooth(pts, 2), lin(x, y - r, x, y + r, [[0, c], [1, deep]]), true, { lw: 1.1 });
  for (const t of [[0, -0.85], [0.75, -0.3], [-0.75, -0.3]]) lineOf(rotP([[x, y + r * 0.3], [x + t[0] * r, y + t[1] * r]], x, y, a), rgba(deep, 0.8), r * 0.07);
}


// ---------- The design kit's character (Fawnelle's, copied), turned into the Rootling Dryad ----------
// Her colours: four tones a material at most, hue-shifted (cool toward violet in the shade).
const SK = { hi: '#fffaf4', base: '#ffefe3', sh1: '#f4d3c6', sh2: '#dcae9f', line: '#b98478', blush: '#f7a0ae', lip: '#e0707e', lipDk: '#a64a5c' };
const HR = { hi: '#ffffff', lt: '#eefae0', base: '#cfe8b0', sh1: '#9fcd7c', sh2: '#6fa856', deep: '#4f8a40', lash: '#2f3424' };
const EY = { dk: '#1e3a16', mid: '#3c7a2a', base: '#76b544', lt: '#e2d86a', glow: '#fff6c8', pupil: '#14240c' };
const CO = { hi: '#f5f3fb', base: '#dbd6ea', sh: '#b8b2d0', deep: '#8e88ae', belly: '#fdfcff', hoof: '#5e5a80' };
const AN = { hi: '#ffffff', base: '#e2f3fe', mid: '#c2e2f8', sh: '#95c1e4', edge: '#6e9fd0' };
const NV = { lt: '#5157a0', base: '#363b7a', dk: '#22255a', deep: '#181a45' };
const SV = { lt: '#ffffff', base: '#e4e8f7', dk: '#aab1d8' };
const GD = { lt: '#fff1bd', base: '#f2c96a', dk: '#b98a3a' };
const LV = { lt: '#efeeff', base: '#cfcbf6', dk: '#a29de2' };

// ---------- The deer ----------
// A deer leg, shaped like one: a foreleg's forearm thick under the body, a neat knee, a slim cannon,
// the fetlock, a split hoof; a hind leg's gaskin full under the haunch, the hock's point behind. The
// lower leg a deeper shade toward the hoof; a little pale feather behind the fetlock; silver rings
// and a crescent charm above the hoof.
// A soft tuft of fur: a teardrop from a round base to a rounded tip, pointing the way the fur lies.
function furTuft(x, y, len, w, ang) {
  const c = Math.cos(ang);
  const sn = Math.sin(ang);
  return poly(cr(ribbon([[x, y], [x + c * len * 0.5, y + sn * len * 0.5], [x + c * len, y + sn * len]], (u) => lerp(w, w * 0.34, u ** 1.1), { n: 4 }), true, 2));
}
// (redrawn 2026-11-23, the player: "heavily polish/redraw her body, tail, ears": soft shading in
// place of drawn lines, gentle joints, a little white fluff at the fetlock, glossy split hooves, her
// silver anklets with their gold crescents)
function deerLeg(js, w, far, hind, tilt = 0) {
  const [a, b, d, e] = js;
  // (the rig: the hoof sits under its foot wherever the foot is, tilting with the lowest bone)
  const gy = e[1] + 8;
  const hoofTop = xfPt(rotAbout(e[0], e[1], tilt), [e[0] + 0.6, gy - 6.6]);
  const line = [a, b, L2(b, d, 0.5), d, L2(d, e, 0.45), e, hoofTop];
  const ws = hind ? [w[0] * 1.05, w[0] * 0.78, w[1] * 0.98, w[2] * 1.15, 4.2, 5, 4.4] : [w[0], w[0] * 0.74, w[1] * 0.95, w[2] * 1.06, 4.2, 5, 4.4];
  const wl = (u) => {
    const f = u * (ws.length - 1);
    const i2 = Math.min(ws.length - 2, Math.floor(f));
    return lerp(ws[i2], ws[i2 + 1], f - i2);
  };
  const leg = poly(cr(ribbon(line, wl, { n: 6 }), true, 2));
  add(leg, far ? lin(a[0], a[1], a[0], gy, [[0, CO.sh], [0.6, CO.sh], [1, CO.deep]]) : lin(a[0], a[1], a[0], gy, [[0, CO.base], [0.5, CO.base], [0.8, CO.sh], [1, CO.deep]]));
  // (a hind leg's hock: its point behind, rounded)
  let hock = null;
  if (hind) {
    hock = ell(d[0] - 2.4, d[1] - 0.6, 3, 2.6);
    add(hock, far ? CO.sh : CO.base);
  }
  // soft volume: shade down the back of the leg, light down its front (lit from the upper right)
  detail(poly(ribbon(sideOf(line, wl, 0.62), (u) => wl(u) * 0.55, { n: 1 })), rgba(CO.deep, far ? 0.32 : 0.3), { clip: leg, blur: 0.7 });
  if (!far) detail(poly(ribbon(sideOf(line, wl, -0.42).slice(4, -10), (u) => 1.6 * Math.sin(Math.PI * u) + 0.2, { n: 1 })), rgba('#ffffff', 0.55), { clip: leg, blur: 0.5 });
  // the joints: a soft light on the knee, a soft shade beneath it
  detail(ell(b[0] + 1, b[1] - 0.4, 2.6, 2), rgba('#ffffff', far ? 0.12 : 0.3), { clip: leg, blur: 0.5 });
  detail(ell(b[0] + 0.4, b[1] + 2.6, 2.4, 1.4), rgba(CO.deep, 0.18), { clip: leg, blur: 0.5 });
  if (hock) detail(ell(d[0] - 2.2, d[1] + 0.6, 2.4, 1.4), rgba(CO.deep, 0.3), { clip: hock, blur: 0.5 });
  const hx = e[0] + 0.6;
  withXF(rotAbout(e[0], e[1], tilt), () => {
  // the hoof: glossy, split, deepest where it meets the ground
  const hoof = smooth([[hx - 2.6, gy - 6.5], [hx + 2.2, gy - 6.8], [hx + 4.2, gy - 3.2], [hx + 5.4, gy - 0.7], [hx + 3.6, gy - 0.05], [hx + 1.9, gy - 1], [hx + 0.4, gy - 0.05], [hx - 3.4, gy - 0.1], [hx - 3.8, gy - 3]], 3);
  add(hoof, lin(hx, gy - 7, hx, gy, [[0, far ? '#6c6890' : '#8a86ad'], [1, CO.hoof]]));
  detail(poly(ribbon([[hx + 1.2, gy - 5.6], [hx + 1.6, gy - 3], [hx + 1.9, gy - 1]], (u) => 0.5 * Math.sin(Math.PI * u) + 0.1, { n: 4 })), rgba('#3e3a60', 0.5), { clip: hoof, blur: 0.12 });
  detail(poly(ribbon([[hx - 2.4, gy - 5.6], [hx, gy - 6], [hx + 1, gy - 5.2]], (u) => 0.8 * Math.sin(Math.PI * u) + 0.1, { n: 4 })), rgba('#ffffff', far ? 0.25 : 0.5), { clip: hoof, blur: 0.15 });
  // her silver anklet and its gold crescent
  const ry = gy - 11.2;
  const band = poly(cr(ribbon([[hx - 3, ry + 1.1], [hx + 0.4, ry + 1.9], [hx + 3.3, ry + 0.9]], () => 1.2, { n: 4 }), true, 2));
  add(band, lin(hx, ry, hx, ry + 2.6, [[0, far ? SV.dk : SV.lt], [1, far ? '#8f95c0' : SV.dk]]), true, { lw: 0.7 });
  withXF(rotAbout(hx + 0.6, ry + 2.6, -tilt), () => {
    lineOf([[hx + 0.6, ry + 2.6], [hx + 0.6, ry + 4.4]], far ? GD.dk : GD.base, 0.45);
    crescent(hx + 0.6, ry + 5.6, 1.3, 0, far ? GD.dk : GD.base);
  });
  });
  return leg;
}
// (the rig: a near leg's lower part again, over the deer's body, fading in below the knee, a soft
// shadow under it on the body, so a foot lifted and folded up crosses in front of the belly instead of
// slipping behind it)
function deerLegOver(js, w, hind, tilt, bodyW) {
  const [a, b, d, e] = js;
  const gy = e[1] + 8;
  const hoofTop = xfPt(rotAbout(e[0], e[1], tilt), [e[0] + 0.6, gy - 6.6]);
  const ws = hind ? [w[0] * 1.05, w[0] * 0.78, w[1] * 0.98, w[2] * 1.15, 4.2, 5, 4.4] : [w[0], w[0] * 0.74, w[1] * 0.95, w[2] * 1.06, 4.2, 5, 4.4];
  const wl = (u) => {
    const f = u * (ws.length - 1);
    const i2 = Math.min(ws.length - 2, Math.floor(f));
    return lerp(ws[i2], ws[i2 + 1], f - i2);
  };
  const line = [L2(b, d, 0.26), L2(b, d, 0.6), d, L2(d, e, 0.45), e, hoofTop];
  const wl2 = (u) => wl(0.26 + 0.74 * u);
  const leg = poly(cr(ribbon(line, wl2, { n: 6, caps: false }), true, 2));
  detail(poly(ribbon(line.map(([x, y]) => [x - 0.6, y + 1.2]), wl2, { n: 6 })), rgba(CO.deep, 0.3), { clip: bodyW, blur: 0.8 });
  detail(leg, lin(line[0][0], line[0][1], hoofTop[0], hoofTop[1], [[0, rgba(CO.base, 0)], [0.1, CO.base], [0.5, CO.base], [0.8, CO.sh], [1, CO.deep]]));
  detail(poly(ribbon(sideOf(line, wl2, 0.62), (u) => wl2(u) * 0.55, { n: 1 })), lin(line[0][0], line[0][1], hoofTop[0], hoofTop[1], [[0, rgba(CO.deep, 0)], [0.2, rgba(CO.deep, 0.3)], [1, rgba(CO.deep, 0.3)]]), { clip: leg, blur: 0.7 });
  detail(poly(ribbon(sideOf(line, wl2, -0.42).slice(6, -8), (u) => 1.6 * Math.sin(Math.PI * u) + 0.2, { n: 1 })), rgba('#ffffff', 0.5), { clip: leg, blur: 0.5 });
  // (its hoof and anklet again, over everything)
  const hx = e[0] + 0.6;
  withXF(rotAbout(e[0], e[1], tilt), () => {
    const hoof = smooth([[hx - 2.6, gy - 6.5], [hx + 2.2, gy - 6.8], [hx + 4.2, gy - 3.2], [hx + 5.4, gy - 0.7], [hx + 3.6, gy - 0.05], [hx + 1.9, gy - 1], [hx + 0.4, gy - 0.05], [hx - 3.4, gy - 0.1], [hx - 3.8, gy - 3]], 3);
    add(hoof, lin(hx, gy - 7, hx, gy, [[0, '#8a86ad'], [1, CO.hoof]]));
    detail(poly(ribbon([[hx + 1.2, gy - 5.6], [hx + 1.6, gy - 3], [hx + 1.9, gy - 1]], (u) => 0.5 * Math.sin(Math.PI * u) + 0.1, { n: 4 })), rgba('#3e3a60', 0.5), { clip: hoof, blur: 0.12 });
    detail(poly(ribbon([[hx - 2.4, gy - 5.6], [hx, gy - 6], [hx + 1, gy - 5.2]], (u) => 0.8 * Math.sin(Math.PI * u) + 0.1, { n: 4 })), rgba('#ffffff', 0.5), { clip: hoof, blur: 0.15 });
    const ry = gy - 11.2;
    const band = poly(cr(ribbon([[hx - 3, ry + 1.1], [hx + 0.4, ry + 1.9], [hx + 3.3, ry + 0.9]], () => 1.2, { n: 4 }), true, 2));
    add(band, lin(hx, ry, hx, ry + 2.6, [[0, SV.lt], [1, SV.dk]]), true, { lw: 0.7 });
    withXF(rotAbout(hx + 0.6, ry + 2.6, -tilt), () => {
      lineOf([[hx + 0.6, ry + 2.6], [hx + 0.6, ry + 4.4]], GD.base, 0.45);
      crescent(hx + 0.6, ry + 5.6, 1.3, 0, GD.base);
    });
  });
}
const BARREL = DEER.barrel.map(([x, y]) => [CX + x, y]);
const legJoints = (G, off) => {
  const js = [[CX + G.top[0] + off[0], G.top[1] + off[1]]];
  for (const b of G.bones) js.push([js[js.length - 1][0] + b[0], js[js.length - 1][1] + b[1]]);
  return js;
};
const LEGS = { hindF: legJoints(DEER.hind, DEER.far), foreF: legJoints(DEER.fore, DEER.far), hindN: legJoints(DEER.hind, [0, 0]), foreN: legJoints(DEER.fore, [0, 0]) };
// The deer's body (redrawn 2026-11-23): soft and round, lit along its back, shaded softly under the
// barrel and behind the shoulder; a fluffy white chest ruff in layered rounded tufts; the white belly
// with a soft edge of small fur tufts; pale dapples on the rump; soft creases where the legs come out.
function deerBody() {
  const barrel = smooth(BARREL, 5);
  add(barrel, lin(140, 104, 140, 154, [[0, CO.hi], [0.3, CO.base], [0.75, CO.base], [1, CO.sh]]));
  glow(barrel, 116, 124, 22, CO.hi, 0.8);
  glow(barrel, 182, 124, 13, CO.hi, 0.5);
  // (soft shade low along the barrel and behind the shoulder; the haunch's curve)
  detail(ell(150, 151, 44, 7), rgba(CO.sh, 0.55), { clip: barrel, blur: 1.4 });
  detail(poly(ribbon([[176, 130], [172, 140], [170, 150]], (u) => 5 * Math.sin(Math.PI * u) + 0.5, { n: 6 })), rgba(CO.sh, 0.35), { clip: barrel, blur: 1 });
  detail(poly(ribbon([[118, 122], [126, 132], [128, 146]], (u) => 3.6 * Math.sin(Math.PI * u) + 0.4, { n: 6 })), rgba(CO.sh, 0.35), { clip: barrel, blur: 0.9 });
  // the white belly, its edge a soft row of small fur tufts
  const belly = smooth([[186, 138], [180, 149], [160, 152.4], [134, 152], [114, 147], [114, 156], [190, 156]], 4);
  detail(belly, lin(150, 144, 150, 153, [[0, CO.base], [1, CO.belly]]), { clip: barrel });
  const bw = [];
  for (let k = 0; k <= 16; k++) {
    const x = 118 + k * 4.4;
    bw.push([x, 146.4 + Math.sin((k / 16) * Math.PI) * 3.2 + Math.sin(k * 1.7) * 0.45]);
  }
  detail(smooth([...bw, [190, 157], [116, 157]], 3), rgba(CO.belly, 0.9), { clip: barrel, blur: 0.5 });
  // the chest ruff: fluffy white tufts in three layers, each softly shaded under the one above
  const ruff = smooth([[184, 124], [194.4, 122], [198.4, 131], [196.6, 141], [190.6, 147], [184.6, 142], [182, 132]], 4);
  detail(ruff, lin(190, 122, 190, 147, [[0, '#ffffff'], [1, CO.belly]]), { clip: barrel, blur: 0.4 });
  for (const [x, y, len, w, ang] of [[188, 128, 6, 3.4, 1.75], [192.6, 127, 6.4, 3.4, 1.6], [186.4, 135, 6.4, 3.4, 1.85], [191.4, 134.6, 6.6, 3.6, 1.7], [189, 141, 5.6, 3, 1.9]]) {
    detail(furTuft(x - 0.6, y + 1.2, len, w, ang), rgba(CO.sh, 0.3), { clip: barrel, blur: 0.45 });
    detail(furTuft(x, y, len, w, ang), lin(x, y, x, y + len, [[0, '#ffffff'], [1, CO.belly]]), { clip: barrel, blur: 0.1 });
  }
  // pale dapples on the rump, soft-edged
  for (const [x, y, r] of [[103, 124, 1.6], [106.4, 130.4, 1.4], [102, 133, 1.2], [109, 125.6, 1.2]]) detail(ell(x, y, r * 1.2, r), rgba('#ffffff', 0.8), { clip: barrel, blur: 0.35 });
  // where the near legs come out: soft creases
  detail(poly(ribbon([[126, 128], [131, 138], [130, 148]], (u) => 1.8 * Math.sin(Math.PI * u) + 0.2, { n: 5 })), rgba(CO.sh, 0.55), { clip: barrel, blur: 0.5 });
  detail(poly(ribbon([[186, 128], [182, 138], [180, 148]], (u) => 1.6 * Math.sin(Math.PI * u) + 0.2, { n: 5 })), rgba(CO.sh, 0.4), { clip: barrel, blur: 0.5 });
  return barrel;
}
// The tail (2026-11-24, the player chose the pom-pom): a round pom-pom of fluff on a short stub held
// up, snowy white below and soft lavender-grey on top, fine soft fur, a gloss and a little sparkle.
// (a fluffy outline: a round shape with soft scallops of fur round its edge)
function fluffy(cx, cy, rx, ry, n, bump, a0 = 0) {
  const pts = [];
  for (let k = 0; k < n * 4; k++) {
    const t = (k / (n * 4)) * TAU + a0;
    const b = 1 + bump * Math.abs(Math.sin(((t - a0) * n) / 2));
    pts.push([cx + Math.cos(t) * rx * b, cy + Math.sin(t) * ry * b]);
  }
  return smooth(pts, 2);
}
function deerTail() {
  const [tx, ty] = [CX + DEER.tail.root[0], DEER.tail.root[1]];
  return withXF(rotAbout(tx, ty, POSE?.tail ?? 0), () => deerTailDraw(tx, ty));
}
function deerTailDraw(tx, ty) {
  const cx = tx - 7.4;
  const cy = ty - 7.8;
  add(poly(cr(ribbon([[tx + 1, ty + 1], [tx - 3, ty - 3], [cx, cy]], (u) => lerp(6, 8, u), { n: 4 }), true, 2)), CO.base);
  const pom = fluffy(cx, cy, 8.4, 8.2, 14, 0.045, 0);
  add(pom, rad(cx + 2, cy - 3, 12, [[0, '#ffffff'], [0.55, CO.belly], [1, CO.hi]]));
  detail(ell(cx + 1.6, cy - 3.6, 6.6, 4.6), rgba(CO.base, 0.55), { clip: pom, blur: 1 });
  detail(ell(cx - 1, cy + 4, 6, 3.4), rgba(LV.base, 0.35), { clip: pom, blur: 0.9 });
  for (let k = 0; k < 6; k++) {
    const a = -2.6 + k * 0.5;
    const p0 = [cx + Math.cos(a) * 8.4 * 0.35, cy + Math.sin(a) * 8.4 * 0.35];
    const p1 = [cx + Math.cos(a) * 8.4 * 0.85, cy + Math.sin(a) * 8.4 * 0.85];
    detail(poly(ribbon([p0, L2(p0, p1, 0.5), p1], (u) => 0.55 * Math.sin(Math.PI * u) + 0.05, { n: 3 })), rgba(LV.base, 0.35), { clip: pom, blur: 0.2 });
  }
  detail(ell(cx - 2.6, cy - 4.4, 2.4, 1.3, -0.5), rgba('#ffffff', 0.9), { clip: pom, blur: 0.3 });
  star4(cx - 5.4, cy - 6.4, 1.3, 'rgba(255,255,255,0.95)', 0.3);
}
// The navy velvet blanket over the deer's back: deep folds, a silver border with a thin gold line,
// crescent moons stitched on it, silver tassels with gold caps.
function caparison() {
  const top = [[177, 103.6], [160, 105.4], [140, 107.4], [120, 110.6], [104, 116], [96.4, 122]];
  const hem0 = [[98, 133.4], [110, 137], [126, 139.4], [142, 139.2], [156, 136.8], [168, 132.2], [177, 124]];
  // (the hem draped: trailing and rippling, more in the middle than at the ends, where it's held at
  // the rump and the chest)
  const C = POSE?.cloth ?? { x: 0, y: 0, ph: 0, go: 0 };
  const HOLD = [0.75, 1, 1, 1, 0.95, 0.75, 0.35];
  const sway = (k) => C.x * (0.65 + 0.35 * Math.sin(C.ph * 2 - k * 0.9)) * HOLD[k];
  const hemL = hem0.map(([x, y], k) => [x + sway(k), y + (C.y + C.go * 0.5 * Math.sin(C.ph * 2 - k * 0.9 + 1)) * HOLD[k]]);
  const hemAt = (x) => {
    for (let k = 0; k < hem0.length - 1; k++) if (x >= hem0[k][0] && x <= hem0[k + 1][0]) {
      const f = (x - hem0[k][0]) / (hem0[k + 1][0] - hem0[k][0]);
      return [lerp(hemL[k][0] - hem0[k][0], hemL[k + 1][0] - hem0[k + 1][0], f), lerp(hemL[k][1] - hem0[k][1], hemL[k + 1][1] - hem0[k + 1][1], f)];
    }
    return [0, 0];
  };
  const shape = smooth([...top, ...hemL], 4);
  add(shape, lin(130, 104, 130, 140, [[0, NV.lt], [0.22, NV.base], [1, NV.dk]]));
  for (let k = 0; k < 7; k++) {
    const x = 104 + k * 11;
    const [ex, ey] = hemAt(x + 1.4);
    const [fx2, fy2] = hemAt(x + 5.6);
    detail(poly(ribbon([[x, 110], [x - 1 + ex * 0.5, 124 + ey * 0.5], [x + 1.4 + ex, 138 + ey]], (u) => 2.6 * Math.sin(Math.PI * u) + 0.4, { n: 4 })), rgba(NV.deep, 0.5), { clip: shape });
    detail(poly(ribbon([[x + 4.4, 110], [x + 3.4 + fx2 * 0.5, 124 + fy2 * 0.5], [x + 5.6 + fx2, 137 + fy2]], (u) => 1.6 * Math.sin(Math.PI * u) + 0.2, { n: 4 })), rgba(NV.lt, 0.45), { clip: shape });
  }
  const border = hemL.map(([x, y]) => [x, y - 2.6]);
  detail(poly(ribbon(border, () => 2.6, { n: 6, caps: false })), SV.base, { clip: shape });
  lineOf(cr(border.map(([x, y]) => [x, y - 2.4]), false, 6), rgba(GD.base, 0.95), 0.6, { clip: shape });
  for (const u of [0.18, 0.42, 0.66, 0.88]) {
    const q = along(border, u).p;
    crescent(q[0], q[1] - 7.4, 2.6, -0.5, SV.base, false);
    star4(q[0] + 4.4, q[1] - 9.4, 1.1, SV.lt);
  }
  for (let k = 0; k <= 8; k++) {
    const q0 = along(hemL, k / 8).p;
    const q = WARP ? WARP(q0) : q0;
    const w0 = WARP;
    WARP = null;
    withXF(rotAbout(q[0], q[1], POSE?.tassels?.[k] ?? (POSE?.tassel ?? 0) * (1 + 0.12 * Math.sin(k * 2.1))), () => {
    lineOf([q, [q[0] - 0.2, q[1] + 2.2]], SV.dk, 0.6);
    const ts = smooth([[q[0] - 1, q[1] + 2.4], [q[0] + 0.9, q[1] + 2.4], [q[0] + 1.6, q[1] + 6.4], [q[0] + 0.8, q[1] + 7.2], [q[0] - 0.9, q[1] + 7.2], [q[0] - 1.7, q[1] + 6.4]], 2);
    add(ts, lin(q[0], q[1] + 2, q[0], q[1] + 7, [[0, SV.lt], [1, SV.dk]]), true, { lw: 0.9 });
    for (const dx of [-0.8, 0, 0.8]) lineOf([[q[0] + dx * 0.6, q[1] + 3.4], [q[0] + dx, q[1] + 7]], rgba(SV.dk, 0.7), 0.3, { clip: ts });
    add(smooth([[q[0] - 1.1, q[1] + 1.4], [q[0] + 1, q[1] + 1.4], [q[0] + 1.2, q[1] + 3], [q[0] - 1.3, q[1] + 3]], 2), lin(q[0], q[1] + 1.4, q[0], q[1] + 3, [[0, GD.lt], [1, GD.dk]]), true, { lw: 0.8 });
    });
    WARP = w0;
  }
  return shape;
}

// ---------- Hair ----------
// A lock: a band down its line, light at the root and through its middle, deepening, then catching
// light again at the tips; its shade down one side, a sheen high on it, fine strands; long ones part
// into two or three soft points at the end.
function lock(line, w, { sheen = 1, tips = 1, outline = true, deep = false } = {}) {
  const p = poly(ribbon(line, w, { n: 8 }));
  const a = line[0];
  const b = line[line.length - 1];
  add(p, lin(a[0], a[1], b[0], b[1], [[0, deep ? HR.sh1 : HR.base], [0.5, deep ? HR.sh1 : HR.base], [0.86, deep ? HR.sh2 : HR.sh1], [1, HR.lt]]), outline, { stroke: rgba(HR.sh2, 0.65), slw: 0.75 });
  const off = (d, k) => line.map((q, i) => {
    const n = along(line, i / (line.length - 1)).n;
    return [q[0] + n[0] * d * k, q[1] + n[1] * d * k];
  });
  detail(poly(ribbon(off(-1, w(0.5) * 0.32), (u) => w(u) * 0.36, { n: 8 })), rgba(HR.sh1, 0.75), { clip: p });
  if (sheen) {
    const top = [];
    for (let k = 0.1; k <= 0.42; k += 0.04) {
      const q = along(line, k);
      top.push([q.p[0] + q.n[0] * w(k) * 0.16, q.p[1] + q.n[1] * w(k) * 0.16]);
    }
    detail(poly(ribbon(top, (u) => w(0.25) * 0.2 * Math.sin(Math.PI * u) * sheen, { n: 2 })), rgba(HR.hi, 0.85), { clip: p });
  }
  for (const s of [-0.2, 0.16]) {
    const sl = [];
    for (let k = 0.06; k < 0.94; k += 0.08) {
      const q = along(line, k);
      sl.push([q.p[0] + q.n[0] * w(k) * s, q.p[1] + q.n[1] * w(k) * s]);
    }
    lineOf(cr(sl, false, 3), rgba(HR.sh2, 0.26), 0.4, { clip: p });
  }
  // the end parting into soft points
  for (let t = 0; t < 0; t++) {
    const s = t ? -1 : 1;
    const q = along(line, 0.82);
    const e = along(line, 1);
    const tip = [e.p[0] + q.n[0] * w(0.82) * 0.32 * s + e.d[0] * (t ? -1.2 : 1.6), e.p[1] + q.n[1] * w(0.82) * 0.32 * s + e.d[1] * (t ? -1.2 : 1.6)];
    const sub = [[q.p[0] + q.n[0] * w(0.82) * 0.2 * s, q.p[1] + q.n[1] * w(0.82) * 0.2 * s], L2(q.p, tip, 0.6), tip];
    const sp = poly(ribbon(sub, (u) => w(0.82) * 0.42 * (1 - u) + 0.5, { n: 4 }));
    add(sp, lin(sub[0][0], sub[0][1], tip[0], tip[1], [[0, HR.sh1], [1, HR.lt]]), outline, { stroke: rgba(HR.sh2, 0.6), slw: 0.7 });
  }
  return p;
}
let HAIR_STYLE = 'own';
const HAIR_COLOR = '#a6d67e';
let HAIR_SCALE = 1;
// (two colours mixed)
const mixHex = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh2) => Math.round((((pa >> sh2) & 255) * (1 - t)) + (((pb >> sh2) & 255) * t));
  return `#${[16, 8, 0].map((sh2) => ch(sh2).toString(16).padStart(2, '0')).join('')}`;
};
// ---------- Her own hair (2026-11-23, the player: "never reuse, make new super high quality ones") ----------
// No hairstyle taken from the game: every style is built here from her own pieces, shaded the same
// way as her bangs (light from above and the upper right, soft-edged shade, a gloss near the crown, a
// faint sheen down each lock), outlined only where the hair meets the air.
// (2026-11-23, the player chose the crescent twin tails; 2026-11-24, from new options: "the side tail
// without the side tail": long straight hair, both sides, with side-swept bangs)
let HAIR_LOOK = 'sweep';
const HL = () => hairRamp(HAIR_COLOR);
const HLOOKS = {
  moonfall: 'Moonfall (long, trimmed)',
  ringlets: 'Royal ringlets',
  tails: 'Crescent twin tails',
  sweep: 'Long side sweep',
  waves: 'Long waves',
  buns: 'Moon buns',
  braids: 'Low braids',
};
// (a line, sampled densely, moved sideways by k half-widths: + to the line's left)
function sideOf(line, w, k, n = 10) {
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
// (a line with a gentle sideways wave, growing from nothing at its root)
function waved(line, amp, period, phase = 0, n = 8) {
  const c = cr(line, false, n);
  const y0 = c[0][1];
  return c.map(([x, y], i) => {
    const u = i / (c.length - 1);
    return [x + amp * Math.sin(((y - y0) / period) * TAU + phase) * Math.min(1, u * 2.5), y];
  });
}
const hairFill = (y0, y1, tone = 0) => {
  const r = HL();
  return lin(0, y0, 0, y1, [[0, mixHex(r.base, r.hi, Math.max(0, 0.24 - tone))], [0.38, mixHex(r.base, r.sh1, 0.08 + tone)], [1, mixHex(r.base, r.sh1, 0.42 + tone)]]);
};
// A lock of hair down its line (root to tip), w(u) its width: cut straight with soft corners
// ('blunt') or narrowing to a soft round tip ('soft'); its shade soft down one side (shade: +1 the
// line's left, −1 its right), a deeper edge there, a gloss near the root and a faint sheen down it;
// `tone` deeper for hair farther back.
// (2026-11-23, the player: "it looks too disconnected": every lock now takes its colour from one light
// for all her hair (the same shade at the same height on every lock), its shade and deeper edge fade
// out toward its root so it grows out of the hair above, and its shine sits only inside one shared
// band of height, so the lights of all the locks line up into one ring)
function hlock(line, w, { end = 'soft', shade = 1, tone = 0, gloss = 1, outline = true, fill = null, gy = [HY + 3, HY + 16] } = {}) {
  const r = HL();
  const pts = ribbon(line, w, { n: 10, caps: end !== 'blunt' });
  const shape = poly(cr(pts, true, 3));
  const y1 = Math.max(...pts.map((q) => q[1]));
  add(shape, fill ?? hairFill(HY - 30, 106, tone), outline);
  const a = line[0];
  const b = line[line.length - 1];
  const grow = (c, al) => lin(a[0], a[1], b[0], b[1], [[0, rgba(c, 0)], [0.3, rgba(c, al)], [1, rgba(c, al)]]);
  detail(poly(ribbon(sideOf(line, w, shade * 0.58), (u) => w(u) * 0.56, { n: 1 })), grow(r.sh1, 0.55), { clip: shape, blur: 0.6 });
  detail(poly(ribbon(sideOf(line, w, shade * 0.9), (u) => w(u) * 0.16 + 0.2, { n: 1 })), grow(r.sh2, 0.3), { clip: shape, blur: 0.32 });
  if (gloss) {
    const seg = sideOf(line, w, -shade * 0.12).filter(([, y]) => y >= gy[0] && y <= gy[1]);
    if (seg.length > 3) detail(poly(ribbon(seg, (u) => 1.7 * Math.sin(Math.PI * u) + 0.1, { n: 1 })), rgba('#ffffff', 0.5 * gloss), { clip: shape, blur: 0.35 });
  }
  if (end === 'blunt') {
    const cut = new Path2D();
    cut.rect(Math.min(...pts.map((q) => q[0])) - 1, y1 - 3.4, 60, 4);
    detail(cut, lin(0, y1 - 3.4, 0, y1, [[0, rgba(r.sh1, 0)], [1, rgba(r.sh1, 0.4)]]), { clip: shape });
  }
  return shape;
}
// The hair behind it all: its deeper inner layer, from behind her crown down to `bottom`.
function backMass(bottom, wide = 28.4) {
  const r = HL();
  const m = FR_MID;
  const right = [[m + 25.4, HY - 6], [m + 27, HY + 10]];
  if (bottom > 70) right.push([m + wide, 58], [m + wide + 0.3, Math.max(66, bottom - 16)]);
  right.push([m + wide - 1, bottom - 1.5]);
  const left = right.map(([x, y]) => [2 * m - x, y]).reverse();
  const pts = [...right, [m + 13, bottom], [m, bottom - 3], [m - 13, bottom], ...left, [m - 22.6, HY - 22], [m - 12.4, HY - 30.4], [m, HY - 32.2], [m + 12.4, HY - 30.4], [m + 22.6, HY - 22]];
  const shape = smooth(pts, 5);
  add(shape, lin(0, HY - 32, 0, bottom, [[0, mixHex(r.base, r.sh1, 0.5)], [1, mixHex(r.sh1, r.sh2, 0.4)]]));
  return shape;
}
// (the long straight curtain: three locks a side)
function curtain(bottom, end = 'blunt', wave = 0) {
  for (const s of [-1, 1]) {
    const X = (dx) => FR_MID + s * dx;
    const tone = s < 0 ? 0.06 : 0;
    const L = [
      [[[X(12), HY + 2], [X(17), HY + 24], [X(19.6), 72], [X(20.6), bottom - 0.2]], (u) => lerp(8, 7.4, u), 0.2],
      [[[X(17), HY - 6], [X(22.2), HY + 14], [X(24.2), 64], [X(24.8), bottom + 0.3]], (u) => lerp(7.8, 7, u), 1.6],
      [[[X(21), HY - 12], [X(25.8), HY + 4], [X(27.6), 50], [X(27.6), 80], [X(27.2), bottom - 0.1]], (u) => lerp(6.6, 5.8, u), 3.1],
    ];
    for (const [line, w, ph] of L) {
      let ln = line;
      if (wave) {
        ln = waved(line, wave, 23, ph);
        // (soft ends curl a little outward)
        const e = ln[ln.length - 1];
        ln = [...ln.slice(0, -2), [e[0] + s * 0.8, e[1] - 1.2], [e[0] + s * 1.9, e[1] + 0.4]];
      }
      hlock(ln, end === 'soft' ? (u) => (u < 0.82 ? w(u) : lerp(w(0.82), 1.6, smoothU((u - 0.82) / 0.18))) : w, { end, shade: s > 0 ? 1 : -1, tone });
    }
  }
}
// Her leafy locks (2026-11-27, second pass, the lead reviewer: from a distance the first pass still
// read as one bumpy green block). Now a few big soft locks a side, each one smooth (no wave along its
// edge), wide, round-tipped, of its own length and its own tone, lying one over another: each casts a
// soft shadow on the locks beneath it and shows a fine deeper line where its edge crosses them, so they
// read as separate locks even at game size; a soft light down its outer side, its shade toward her.
// (a polygon turned the same way round as every lock's, so the locks beneath can be one clip)
const clockwise = (pts) => {
  let area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) area += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  return area < 0 ? pts.slice().reverse() : pts;
};
function softLock(line, w, { shade = 1, tone = 0, under = [], lit = 1 } = {}) {
  const r = HL();
  const pts = clockwise(cr(ribbon(line, w, { n: 10, caps: true }), true, 3));
  const shape = poly(pts);
  let below = null;
  if (under.length) {
    below = new Path2D();
    for (const q of under) below.addPath(poly(q));
    // its soft shadow on the locks beneath, down and toward her
    const cast = new Path2D();
    cast.addPath(shape, new DOMMatrix().translate(shade * -1.1, 1.6));
    detail(cast, rgba(r.sh2, 0.65), { clip: below, blur: 0.9 });
  }
  add(shape, hairFill(HY - 30, 106, tone));
  const a = line[0];
  const b = line[line.length - 1];
  const grow = (c, al) => lin(a[0], a[1], b[0], b[1], [[0, rgba(c, 0)], [0.25, rgba(c, al)], [1, rgba(c, al)]]);
  // its shade down the side toward her, a deeper edge there
  detail(poly(ribbon(sideOf(line, w, shade * 0.55), (u) => w(u) * 0.5, { n: 1 })), grow(r.sh1, 0.6), { clip: shape, blur: 0.7 });
  detail(poly(ribbon(sideOf(line, w, shade * 0.88), (u) => w(u) * 0.14 + 0.3, { n: 1 })), grow(r.sh2, 0.4), { clip: shape, blur: 0.35 });
  // a soft light down its outer side, from its gloss band to above its tip
  const lt = sideOf(line, w, -shade * 0.4);
  const n = lt.length;
  detail(poly(ribbon(lt.slice(Math.round(n * 0.08), Math.round(n * 0.78)), (u) => (w(0.4) * 0.2 + 0.4) * Math.sin(Math.PI * u) + 0.1, { n: 1 })), rgba('#ffffff', 0.32 * lit), { clip: shape, blur: 0.6 });
  // a gloss in the shared band of shine near her crown
  const seg = sideOf(line, w, -shade * 0.15).filter(([, y]) => y >= HY + 3 && y <= HY + 16);
  if (seg.length > 3) detail(poly(ribbon(seg, (u) => 1.6 * Math.sin(Math.PI * u) + 0.1, { n: 1 })), rgba('#ffffff', 0.45 * lit), { clip: shape, blur: 0.35 });
  // the fine deeper line where its edge crosses the locks beneath (only there)
  if (below) detail(shape, 'rgba(0,0,0,0)', { clip: below, stroke: rgba(r.sh2, 0.75), slw: 0.75 });
  return pts;
}
// (a lock's width: full from its root, swelling a touch through its middle, rounding off to its tip)
const lockW = (w0, w1, tip = 0.24) => (u) => {
  const base = lerp(w0, w1, u) * (1 + 0.1 * Math.sin(Math.PI * u));
  return u > 1 - tip ? base * (0.3 + 0.7 * Math.cos(((u - (1 - tip)) / tip) * Math.PI * 0.5) ** 0.8) : base;
};
function leafyLocks(s, X) {
  const sh = s > 0 ? 1 : -1;
  const done = [];
  // (each lock a long soft S: out over her shoulder, in a little, out again, its tip turning)
  // the outer lock, behind: its tip flicking out
  done.push(softLock([[X(21.6), HY - 12], [X(28.4), HY + 6], [X(31.8), HY + 22], [X(30), HY + 34], [X(30.8), HY + 42], [X(33), HY + 47]], lockW(10, 11.6), { shade: sh, tone: 0.3, lit: 0.7 }));
  // the longest, in the middle: down past her waist, its tip turning in
  done.push(softLock([[X(17.6), HY - 10], [X(24.4), HY + 10], [X(27.4), HY + 26], [X(25), HY + 42], [X(25.4), HY + 54], [X(23.2), HY + 60]], lockW(11, 12.2), { shade: sh, tone: 0.12, under: done.slice() }));
  // the inner one, in front: shorter, its tip turning out
  softLock([[X(14), HY + 2], [X(19.6), HY + 18], [X(22.4), HY + 30], [X(20.8), HY + 39], [X(22.6), HY + 45]], lockW(9.4, 10.2, 0.3), { shade: sh, tone: 0, under: done.slice() });
}
// A ringlet: a tight spiral of hair hanging in turns, each turn lit on its upper face and deep where
// it curls under, each casting a soft shadow on the turn below; a soft little curl at its tip.
function ringlet(x0, y0, len, w0, s) {
  const r = HL();
  const n = 7;
  const turns = [];
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    turns.push({ x: x0 + s * (1.4 * t + 0.5 * Math.sin(k * 1.7)), y: y0 + len * 0.86 * t, w: lerp(w0, w0 * 0.5, t), h: (len / n) * 1.55 * lerp(1, 0.82, t) });
  }
  // the lock it hangs from
  hlock([[FR_MID + s * 21.4, HY - 4], [x0 - s * 0.6, y0 - turns[0].h * 0.6], [x0, y0]], (u) => lerp(6.4, w0 * 0.8, u), { shade: s, gloss: 0.8 });
  const last = turns[n - 1];
  hlock([[last.x, last.y], [last.x + s * 0.9, last.y + last.h * 0.85], [last.x - s * 0.5, last.y + last.h * 1.3]], (u) => lerp(last.w * 0.6, 1.4, u), { shade: s, gloss: 0 });
  let below = null;
  for (let k = n - 1; k >= 0; k--) {
    const { x, y, w, h } = turns[k];
    const a = s * 0.42;
    const shape = ell(x, y, w / 2, h / 2, a);
    if (below) detail(ell(x - s * w * 0.04, y + h * 0.2, w / 2, h / 2, a), rgba(r.sh2, 0.5), { clip: below, blur: 0.45 });
    add(shape, lin(x, y - h / 2, x, y + h / 2, [[0, mixHex(r.base, r.hi, 0.3)], [0.5, r.base], [1, mixHex(r.base, r.sh1, 0.55)]]));
    detail(ell(x - s * w * 0.14, y + h * 0.22, w * 0.4, h * 0.24, a), rgba(r.sh1, 0.7), { clip: shape, blur: 0.4 });
    const cs = Math.cos(a);
    const sn = Math.sin(a);
    const R = ([dx, dy]) => [x + dx * cs - dy * sn, y + dx * sn + dy * cs];
    detail(poly(ribbon([[-w * 0.44, h * 0.02], [0, h * 0.3], [w * 0.44, h * 0.08]].map(R), (u) => 0.8 * Math.sin(Math.PI * u) + 0.05, { n: 6 })), rgba(r.sh2, 0.42), { clip: shape, blur: 0.22 });
    detail(poly(ribbon([[-w * 0.26, -h * 0.22], [w * 0.04, -h * 0.32], [w * 0.3, -h * 0.2]].map(R), (u) => 0.9 * Math.sin(Math.PI * u) + 0.05, { n: 6 })), rgba('#ffffff', 0.6), { clip: shape, blur: 0.18 });
    below = shape;
  }
}
// A bun: hair wound into a soft ball, a little flattened and tilted outward; the wind shown by one
// soft spiral crease from its heart outward, its underside deep, a gloss arc on its upper side.
function bun(x, y, rr, s) {
  const r = HL();
  const a0 = s * 0.32;
  const shape = ell(x, y, rr * 1.06, rr * 0.86, a0);
  add(shape, rad(x + s * rr * 0.3, y - rr * 0.35, rr * 1.6, [[0, mixHex(r.base, r.hi, 0.35)], [0.55, r.base], [1, mixHex(r.base, r.sh1, 0.5)]]));
  detail(ell(x - s * rr * 0.2, y + rr * 0.38, rr * 0.86, rr * 0.48, a0), rgba(r.sh1, 0.6), { clip: shape, blur: 0.6 });
  const sp = [];
  for (let k = 0; k <= 40; k++) {
    const t = k / 40;
    const a = 0.4 + t * Math.PI * 2.3;
    const rk = rr * (0.12 + 0.8 * t);
    sp.push([x + Math.cos(a) * rk * 1.06 * s, y + Math.sin(a) * rk * 0.86]);
  }
  detail(poly(ribbon(sp, (u) => 0.9 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 0.08, { n: 1 })), rgba(r.sh2, 0.42), { clip: shape, blur: 0.25 });
  const g = [];
  for (let k = 0; k <= 8; k++) {
    const a = -2.35 + (k / 8) * 1.5;
    g.push([x + Math.cos(a) * rr * 0.74 * s, y + Math.sin(a) * rr * 0.62]);
  }
  detail(poly(ribbon(g, (u) => 1.2 * Math.sin(Math.PI * u) + 0.05, { n: 2 })), rgba('#ffffff', 0.62), { clip: shape, blur: 0.2 });
  return shape;
}
// A braid down its line: woven lobes leaning left and right in turn, each lit above and deep below,
// each shadowing the lobe beneath it.
function braid(line, n, w0, w1, lean = 0.78) {
  const r = HL();
  let below = null;
  for (let k = n - 1; k >= 0; k--) {
    const t = k / (n - 1);
    const { p, d, n: nr } = along(line, t);
    const side = k % 2 ? 1 : -1;
    const w = lerp(w0, w1, t);
    const cx = p[0] + nr[0] * side * w * 0.2;
    const cy = p[1] + nr[1] * side * w * 0.2;
    const a = Math.atan2(d[1], d[0]) - Math.PI / 2 + side * lean;
    const shape = ell(cx, cy, w * 0.33, w * 0.64, a);
    if (below) detail(ell(cx + d[0] * w * 0.2, cy + d[1] * w * 0.2, w * 0.33, w * 0.64, a), rgba(r.sh2, 0.5), { clip: below, blur: 0.45 });
    add(shape, lin(cx, cy - w * 0.5, cx, cy + w * 0.5, [[0, mixHex(r.base, r.hi, 0.28)], [0.5, r.base], [1, mixHex(r.base, r.sh1, 0.55)]]));
    detail(ell(cx + nr[0] * side * w * 0.05, cy + w * 0.2, w * 0.3, w * 0.22, a), rgba(r.sh1, 0.6), { clip: shape, blur: 0.35 });
    detail(ell(cx - nr[0] * side * w * 0.06, cy - w * 0.2, w * 0.12, w * 0.24, a), rgba('#ffffff', 0.55), { clip: shape, blur: 0.18 });
    below = shape;
  }
}
// A small ribbon bow (navy silk, a silver edge) with a little gold crescent charm.
function hairBowOld(x, y, s, size = 1) {
  const z = size;
  for (const side of [-1, 1]) {
    const loop = smooth([[x, y], [x + side * 2.2 * z, y - 2.1 * z], [x + side * 3.6 * z, y - 1.2 * z], [x + side * 3.4 * z, y + 0.9 * z], [x + side * 1.8 * z, y + 1.1 * z]], 4);
    add(loop, lin(x, y - 2 * z, x, y + 1.2 * z, [[0, NV.lt], [1, NV.base]]));
    detail(poly(ribbon([[x + side * 1 * z, y - 0.4 * z], [x + side * 2.6 * z, y - 0.9 * z]], (u) => 0.5 * Math.sin(Math.PI * u) + 0.05, { n: 3 })), rgba('#ffffff', 0.4), { clip: loop, blur: 0.1 });
    const tail = smooth([[x - side * 0.2 * z, y + 0.6 * z], [x + side * 1.1 * z, y + 3.4 * z], [x + side * 1.8 * z, y + 4.6 * z], [x + side * 0.7 * z, y + 4.4 * z], [x - side * 0.3 * z, y + 1.6 * z]], 3);
    add(tail, NV.base);
  }
  add(ell(x, y, 1.05 * z, 0.95 * z), lin(x, y - 1, x, y + 1, [[0, NV.lt], [1, NV.dk]]));
  crescent(x + s * 0.2, y + 2.2 * z, 1.15 * z, Math.PI / 2, GD.base);
}

// (a mass of hair from its outline points, filled the way her other hair is)
function hairMass(pts, y0, y1, tone = 0.4) {
  const r = HL();
  const shape = smooth(pts, 5);
  add(shape, lin(0, y0, 0, y1, [[0, mixHex(r.base, r.sh1, tone)], [1, mixHex(r.sh1, r.sh2, tone)]]));
  return shape;
}
// (the back of her head, rounded, down to `bottom` and `wide` out to each side)
function crownMass(bottom, wide = 27.6) {
  const m = FR_MID;
  const right = [[m + 25.4, HY - 6], [m + wide, HY + 8], [m + wide - 0.6, bottom - 6], [m + wide - 4, bottom - 1]];
  const left = right.map(([x, y]) => [2 * m - x, y]).reverse();
  return hairMass([...right, [m + 12, bottom + 0.6], [m, bottom - 1], [m - 12, bottom + 0.6], ...left, [m - 22.6, HY - 22], [m - 12.4, HY - 30.4], [m, HY - 32.2], [m + 12.4, HY - 30.4], [m + 22.6, HY - 22]], HY - 32, bottom, 0.5);
}
// Her back hair, in her chosen style (behind her body; her bangs and side locks come later).
function hairBack() {
  const m = FR_MID;
  const look = HAIR_LOOK;
  if (look === 'sweep') {
    // Long and straight down both sides to below her shoulders, soft-ended; walking, it sways and
    // trails, more toward its ends (POSE.backHair).
    const bh = POSE?.backHair ?? 0;
    WARP = bh ? ([x, y]) => [x + bh * smoothU(clamp01((y - HY - 4) / 36)), y] : null;
    crownMass(72, 27);
    for (const s of [-1, 1]) {
      const X = (dx) => m + s * dx;
      hlock([[X(12), HY + 2], [X(17), HY + 18], [X(19.6), 66], [X(20), 76]], (u) => (u < 0.78 ? lerp(8, 7.4, u) : lerp(7.4, 1.6, smoothU((u - 0.78) / 0.22))), { shade: s > 0 ? 1 : -1, tone: s < 0 ? 0.06 : 0 });
      hlock([[X(18), HY - 6], [X(23.4), HY + 14], [X(25.4), 66], [X(25.6), 80]], (u) => (u < 0.78 ? lerp(7.6, 6.8, u) : lerp(6.8, 1.6, smoothU((u - 0.78) / 0.22))), { shade: s > 0 ? 1 : -1, tone: s < 0 ? 0.08 : 0.02 });
    }
    WARP = null;
  } else if (look === 'moonfall') {
    backMass(102.2);
    curtain(103.4, 'blunt');
  } else if (look === 'waves') {
    backMass(99);
    curtain(101.6, 'soft', 1.9);
  } else if (look === 'leafy') {
    // (2026-11-27, the player: her ringlets read as a bumpy block, like dreadlocks or cornrows. Now
    // soft leafy locks: big, smooth, separate locks of different lengths, see leafyLocks.)
    // (second pass: the deep inner layer behind, then three big soft locks a side over it)
    backMass(88, 27);
    for (const s of [-1, 1]) leafyLocks(s, (dx) => m + s * dx);
  } else if (look === 'ringlets') {
    backMass(95);
    for (const s of [-1, 1]) {
      const X = (dx) => m + s * dx;
      hlock([[X(12), HY + 2], [X(17), HY + 24], [X(19.6), 72], [X(20.2), 94]], (u) => (u < 0.8 ? lerp(8, 7.2, u) : lerp(7.2, 1.6, smoothU((u - 0.8) / 0.2))), { shade: s > 0 ? 1 : -1, tone: s < 0 ? 0.06 : 0 });
      hlock([[X(17), HY - 6], [X(22.2), HY + 14], [X(24), 64], [X(24.2), 92]], (u) => (u < 0.8 ? lerp(7.6, 6.8, u) : lerp(6.8, 1.6, smoothU((u - 0.8) / 0.2))), { shade: s > 0 ? 1 : -1, tone: s < 0 ? 0.06 : 0 });
      ringlet(X(28.4), HY + 13, 44, 10.4, s);
    }
  } else if (look === 'tails') {
    // (the long hair behind her sways and trails, more toward its ends: POSE.backHair)
    const bh = POSE?.backHair ?? 0;
    const backWarp = bh ? ([x, y]) => [x + bh * smoothU(clamp01((y - HY - 4) / 36)), y] : null;
    WARP = backWarp;
    backMass(73, 27);
    WARP = null;
    for (const s of [-1, 1]) {
      const X = (dx) => m + s * dx;
      WARP = backWarp;
      hlock([[X(12), HY + 2], [X(17), HY + 18], [X(19.6), 66], [X(20), 75]], (u) => (u < 0.78 ? lerp(8, 7.4, u) : lerp(7.4, 1.6, smoothU((u - 0.78) / 0.22))), { shade: s > 0 ? 1 : -1 });
      WARP = null;
      const T = [X(22.6), HY - 19];
      // (the hair's deeper underside between her head and the tail, down to her shoulder, so no thin
      // sliver of background shows between them)
      add(smooth([[X(23), HY - 15], [X(31), HY - 13], [X(33.6), HY + 4], [X(32.6), 58], [X(29.4), 72], [X(25.4), 71], [X(25.6), HY + 6]].map(tailBend(s)), 4), lin(0, HY - 15, 0, 72, [[0, mixHex(HL().base, HL().sh1, 0.5)], [1, mixHex(HL().sh1, HL().sh2, 0.45)]]));
      twinTail(s);
    }
  } else if (look === 'buns') {
    backMass(102.2);
    curtain(103.4, 'blunt');
    for (const s of [-1, 1]) bun(m + s * 22.4, HY - 25, 7.4, s);
  } else if (look === 'braids') {
    backMass(73, 27);
    for (const s of [-1, 1]) {
      const X = (dx) => m + s * dx;
      hlock([[X(12), HY + 2], [X(17), HY + 18], [X(19.6), 66], [X(20), 75]], (u) => (u < 0.78 ? lerp(8, 7.4, u) : lerp(7.4, 1.6, smoothU((u - 0.78) / 0.22))), { shade: s > 0 ? 1 : -1 });
      const line = [[X(23.2), HY + 6], [X(26.6), HY + 24], [X(28.2), 80], [X(27.8), 93]];
      hlock([[X(21), HY - 6], [X(23.4), HY + 4], [X(24), HY + 9]], (u) => lerp(6.4, 7.4, u), { shade: s });
      // the tuft below the tie
      for (const [dx, len, wd] of [[-1.2, 5.6, 2.6], [0, 7, 3], [1.3, 5.2, 2.4]]) hlock([[X(27.8 + dx * 0.4), 94], [X(27.8 + dx), 94 + len * 0.6], [X(27.8 + dx * 1.5), 94 + len]], (u) => lerp(wd, 1, u), { shade: s, gloss: 0 });
      braid(line, 17, 7.6, 5.2);
      hairBow(X(27.8), 94, s, 0.85);
    }
  }
}
// (the rig: a twin tail swings from its tie, its lower part lagging, so it bends and follows; the same
// bend for the tail and for the darker hair joining it to her head, so the two never part)
function tailBend(s) {
  const [a1, a2, a3 = a2] = POSE ? POSE.tails[s > 0 ? 1 : 0] : [0, 0, 0];
  const T = [FR_MID + s * 22.6, HY - 19];
  return ([x, y]) => {
    const u = Math.min(1, Math.max(0, (y - T[1]) / (100.6 - T[1])));
    return xfPt(rotAbout(T[0], T[1], a1 * u + (a2 - a1) * u * u + (a3 - a2) * u * u * u), [x, y]);
  };
}
// A crescent twin tail (redrawn 2026-11-23, the player: "heavily polish/redraw, improve it"): it
// springs from its tie in a full soft puff, sweeps out and down in a gentle S, slims toward the end and
// parts there into soft curling tips of different lengths. One soft mass with five locks over it, all
// fanning from the tie (so it reads as one tail with real clumps, not separate tubes); the side toward
// her deeper; a ring of shine across the puff; the bow's shadow under the tie; two ribbon streamers
// fluttering down from the bow behind her ear.
function twinTail(s) {
  const r = HL();
  const m = FR_MID;
  const X = (dx) => m + s * dx;
  const tone = s < 0 ? 0.05 : 0;
  const C0 = [[X(22.6), HY - 19], [X(28.6), HY - 19.8], [X(33.6), HY - 11.4], [X(36.2), HY + 6], [X(35.4), 62], [X(32.4), 80], [X(31.8), 92], [X(33.4), 100.6]];
  const C = C0.map(tailBend(s));
  const W = (u) => (u < 0.2 ? lerp(5, 13, smoothU(u / 0.2)) : u < 0.5 ? lerp(13, 10.6, (u - 0.2) / 0.3) : lerp(10.6, 6.4, (u - 0.5) / 0.5));
  // (the end: one smooth taper to a soft round tip, curling gently outward; no parting, no bumps)
  const Wm = (u) => (u < 0.62 ? W(u) : lerp(W(0.62), 2.4, smoothU((u - 0.62) / 0.38) ** 0.9));
  const mass = poly(cr(ribbon(C, Wm, { n: 10 }), true, 3));
  add(mass, hairFill(HY - 30, 106, tone + 0.1));
  const cc = cr(C, false, 10);
  const N = cc.length;
  // (each lock: across the tail (share of its half-width, + toward the line's left), its width (share
  // of the tail's), where it ends along the tail, how its tip curls)
  const L = [[0.42, 0.44, 0.7, 1], [-0.42, 0.46, 0.72, -1], [0.18, 0.5, 0.76, 0.5], [-0.2, 0.5, 0.76, -0.6], [0, 0.54, 0.8, 0.1]];
  for (const [k, ws, uEnd, curl] of L) {
    const line = [];
    const iEnd = Math.round((N - 1) * uEnd);
    for (let i = 0; i <= iEnd; i += 3) {
      const u = i / (N - 1);
      const a = cc[Math.max(0, i - 1)];
      const b = cc[Math.min(N - 1, i + 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const off = k * W(u) * 0.5 * Math.min(1, u * 5);
      line.push([cc[i][0] - ((b[1] - a[1]) / l) * off, cc[i][1] + ((b[0] - a[0]) / l) * off]);
    }
    const e = line[line.length - 1];
    const lw = (u) => Wm(u * uEnd) * ws * (u > 0.7 ? lerp(1, 0.55, (u - 0.7) / 0.3) : 1);
    const inner = k * s > 0;
    hlock(line, lw, { shade: s, tone: tone + (inner ? 0.06 : 0), gloss: inner ? 0.6 : 1, gy: [HY - 14, HY - 2] });
  }
  // (down the tail into its tip: the side toward her soft in shade, a soft light down the other side)
  detail(poly(ribbon(sideOf(C, Wm, s * 0.55), (u) => Wm(u) * 0.5, { n: 1 })), lin(0, HY, 0, 104, [[0, rgba(r.sh1, 0)], [0.4, rgba(r.sh1, 0.5)], [1, rgba(r.sh1, 0.6)]]), { clip: mass, blur: 0.6 });
  const lit = sideOf(C, Wm, -s * 0.3);
  const nL = lit.length;
  detail(poly(ribbon(lit.slice(Math.round(nL * 0.45), Math.round(nL * 0.97)), (u) => 1.3 * Math.sin(Math.PI * u) + 0.1, { n: 1 })), rgba('#ffffff', 0.42), { clip: mass, blur: 0.35 });
  // (the bow's shadow under the tie)
  detail(ell(X(25.6), HY - 17.4, 4.6, 3.2), rgba(r.sh2, 0.5), { clip: mass, blur: 0.8 });
  // (2026-11-23, the player: "could polish the hair more with shading and stuff". Deeper shade where
  // the tail turns from the light and where it hangs beside her; a thin rim of light down its lit
  // edge; a soft periwinkle bounce light on its shadowed edge; fine streaks of light across the puff;
  // its ends lightening a little, moonlit; two tiny sparkles)
  detail(poly(ribbon(sideOf(C, Wm, s * 0.5).slice(8), (u) => Wm(u) * 0.42, { n: 1 })), lin(0, HY - 10, 0, 100, [[0, rgba(r.sh2, 0)], [0.25, rgba(r.sh2, 0.26)], [1, rgba(r.sh2, 0.34)]]), { clip: mass, blur: 1 });
  detail(poly(ribbon(sideOf(C, Wm, -s * 0.88).slice(6, -4), (u) => 0.9 * Math.sin(Math.PI * u) + 0.1, { n: 1 })), rgba('#ffffff', 0.6), { clip: mass, blur: 0.2 });
  const inEdge = sideOf(C, Wm, s * 0.86);
  detail(poly(ribbon(inEdge.slice(Math.round(inEdge.length * 0.35), -6), (u) => 1.1 * Math.sin(Math.PI * u) + 0.1, { n: 1 })), rgba('#cfdcff', 0.5), { clip: mass, blur: 0.3 });
  for (const [k, u0, u1, a0] of [[-0.42, 0.13, 0.3, 0.7], [-0.18, 0.15, 0.27, 0.55], [0.08, 0.14, 0.31, 0.6], [0.3, 0.16, 0.25, 0.45]]) {
    const st = sideOf(C, Wm, k * s);
    const seg = st.slice(Math.round(st.length * u0), Math.round(st.length * u1));
    detail(poly(cr(ribbon(seg, (u) => 0.4 + 0.55 * Math.sin(Math.PI * u), { n: 1 }), true, 2)), rgba('#ffffff', a0), { clip: mass, blur: 0.1 });
  }
  const tipGlow = new Path2D();
  tipGlow.rect(m - 60, 78, 120, 30);
  detail(tipGlow, lin(0, 78, 0, 104, [[0, rgba('#f6f0ff', 0)], [1, rgba('#f6f0ff', 0.42)]]), { clip: mass });
  for (const [dx, y, rr] of [[35.4, HY - 4, 1.1], [33, 70, 0.8]]) star4(X(dx), y, rr, 'rgba(255,255,255,0.95)', 0.3);
  // (two navy ribbon streamers from the bow, fluttering down behind her ear, round-ended)
  const bx = X(23.6);
  const by = HY - 17.6;
  for (const [dx, len, ph, wd] of [[0.4, 13, 0, 2.6], [2.6, 10.5, 1.5, 2.3]]) {
    const line = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const fl = POSE ? POSE.stream * t + Math.sin(t * Math.PI * 1.6 - POSE.t * 5 + ph) * 0.9 * POSE.go * t : 0;
      line.push([bx + s * (dx + t * 3.6 + Math.sin(t * Math.PI * 1.7 + ph) * 1.1) + fl * len * 0.5, by + 1 + t * len]);
    }
    const rb = poly(cr(ribbon(line, (u) => lerp(wd, wd * 0.8, u), { n: 4 }), true, 2));
    add(rb, lin(bx, by, bx, by + len, [[0, NV.lt], [1, NV.base]]));
    detail(poly(ribbon(line.map(([x, y]) => [x + s * 0.35, y]), (u) => 0.45 * Math.sin(Math.PI * u) + 0.05, { n: 4 })), rgba('#ffffff', 0.35), { clip: rb, blur: 0.12 });
  }
}
// The tie of a twin tail: a navy bow with full folded loops (deep inside the fold, a sheen along the
// top), its knot clasped with a gold crescent and a little pearl.
function tieBow(x, y, s) {
  for (const side of [-1, 1]) {
    const L = (dx, dy) => [x + side * dx, y + dy];
    const loop = smooth([L(0.4, -0.2), L(2.4, -3.2), L(4.8, -3.4), L(5.6, -1), L(4.6, 1.2), L(2.2, 1.2)], 4);
    add(loop, lin(x, y - 3.4, x, y + 1.2, [[0, NV.lt], [0.6, NV.base], [1, NV.dk]]));
    detail(ell(x + side * 1.8, y - 0.6, 1.5, 1.1), rgba(NV.deep, 0.65), { clip: loop, blur: 0.25 });
    detail(poly(ribbon([L(1.6, -2.4), L(3.4, -3.1), L(5, -2.4)], (u) => 0.6 * Math.sin(Math.PI * u) + 0.05, { n: 4 })), rgba('#ffffff', 0.45), { clip: loop, blur: 0.12 });
  }
  add(smooth([[x - 1.3, y - 1.3], [x + 1.3, y - 1.3], [x + 1.5, y + 1.1], [x - 1.5, y + 1.1]], 3), lin(x, y - 1.3, x, y + 1.1, [[0, NV.lt], [1, NV.dk]]));
  crescent(x - s * 0.1, y - 0.1, 1.55, s > 0 ? Math.PI * 0.95 : Math.PI * 0.05, GD.base);
  add(ell(x + s * 0.5, y - 0.15, 0.62, 0.62), lin(x, y - 0.8, x, y + 0.5, [[0, '#ffffff'], [1, '#c9d8f4']]), true, { lw: 0.6 });
  detail(ell(x + s * 0.3, y - 0.4, 0.2, 0.2), '#ffffff');
}
// Her hair's ornaments that sit in front of her crown: moon clasps on her twin tails and buns.
function hairTop() {
  const m = FR_MID;
  if (HAIR_LOOK === 'tails') {
    for (const s of [-1, 1]) tieBow(m + s * 23.6, HY - 18.6, s);
  } else if (HAIR_LOOK === 'buns') {
    // (a gold pin through each bun, a crescent at its end)
    for (const s of [-1, 1]) {
      const a = [m + s * 17.4, HY - 21.4];
      const b = [m + s * 29.4, HY - 30.2];
      add(poly(ribbon([a, b], () => 0.95, { n: 2 })), lin(a[0], a[1], b[0], b[1], [[0, GD.dk], [0.5, GD.base], [1, GD.lt]]), true, { lw: 0.9 });
      crescent(b[0] + s * 0.8, b[1] - 0.6, 1.7, s > 0 ? Math.PI * 0.85 : Math.PI * 0.15, GD.base);
    }
  }
}

// Her fringe (2026-11-23, the player: "no sharp hair, just make it an even blunt bangs", "it needs
// to be multiple cut parts", "you can google how hairs are done", then "not bad, just smooth out the
// hair and give me multiple examples"): a hime cut, built the way anime hair tutorials build one. One
// even cut line following the curve of her forehead, just above her lashes; splits rising from it,
// spread evenly but each a little different in width and depth, so the bangs fall in trimmed clumps
// (narrower toward the sides, where her head turns away); every clump's end cut straight with soft
// round corners. Behind the splits, the deeper inner layer of her hair. Shaded smoothly (every shade
// soft-edged): light from above, soft shadows along each clump's sides at the splits, each split
// carried on up toward her crown as a soft fading line, the sides deeper where her head turns away,
// and a shine across the bangs. The variations (FR_LOOKS) differ in their splits and their shine.
const FR_MID = HX + 1;
// (the crown's outline, its right half from the side up to the top; mirrored for the left)
const FR_CROWN = [[23.6, 2], [24.9, -8], [22, -19], [15, -26.6], [5.2, -29.6]];
// (the even cut's height below HY: just above her brows (2026-11-23, the player: "brows ... rework":
// the cut lifted so her brows show beneath it); it follows her forehead's roundness)
const FR_CUT = -1;
// Her bang styles (2026-11-23, the player: "now do the same with bangs": new ones drawn from scratch):
// the moon hime (hers), a centre-parted moon curtain, a side sweep, airy see-through bangs, the crescent
// cut (her hime cut arching up like a crescent moon), and a braid crown along her hairline.
// (2026-11-23, the player drew the cut they want: curving like a U, longest in the middle just above
// her brows, rising evenly to her temples beside her ears: the round cut, with a gentler and a deeper
// curve beside it)
const BANG_LOOKS = { hime: 'Moon hime', round: 'Round cut', roundSoft: 'Round cut, gentle', roundDeep: 'Round cut, deep', curtain: 'Moon curtain', swept: 'Side sweep', air: 'Air bangs', crescent: 'Crescent cut', braid: 'Braid crown' };
const ROUND_RISE = { round: 5.8, roundSoft: 3.8, roundDeep: 8 };
const isHimeCut = () => BANG_LOOK === 'hime' || BANG_LOOK === 'crescent' || ROUND_RISE[BANG_LOOK] != null;
// (the player asked to try the round cut; it is hers for now)
let BANG_LOOK = 'swept';
const frCutY = (dx) => {
  if (BANG_LOOK === 'crescent') return HY - 6.2 + 8.4 * Math.min(1, (dx / 21.5) ** 2);
  const rise = ROUND_RISE[BANG_LOOK];
  // (the player: "a bit lower": the round cut sits one step lower on her forehead)
  if (rise != null) return HY + 1.1 - rise * Math.min(1.05, (dx / 22) ** 2);
  return HY + FR_CUT + 0.4 * (1 - Math.min(1, (dx / 21.5) ** 2));
};
const FR_END = 21.8;
// The variations: the splits (right half from the middle out: where, how deep; mirrored on the left),
// the shine, and how strongly the splits are shaded.
const FR_LOOKS = {
  soft: { name: 'Soft hime', splits: [[2.9, 4.8], [7.5, 2.6], [11.9, 5.2], [15.9, 2.4], [19.5, 4]], shine: 'lines' },
  wide: { name: 'Wide clumps', splits: [[3.6, 3.4], [9.6, 2.4], [15.2, 3.6], [19.8, 2.2]], shine: 'band' },
  layered: { name: 'Layered', splits: [[2.9, 6.6], [7.5, 3.4], [11.9, 7.2], [15.9, 3.2], [19.5, 5.6]], shine: 'lines', crease: 0.5, side: 0.5 },
  airy: { name: 'Airy', splits: [[2.2, 3.2], [5.4, 2], [8.6, 3.8], [11.8, 2.2], [14.8, 3.4], [17.6, 2], [20.2, 2.8]], shine: 'lines', crease: 0.3 },
  ring: { name: 'Angel ring', splits: [[2.9, 4.8], [7.5, 2.6], [11.9, 5.2], [15.9, 2.4], [19.5, 4]], shine: 'ring' },
  plain: { name: 'Simple', splits: [[3.2, 2.6], [8.4, 1.8], [13.4, 2.8], [18.4, 1.8]], shine: 'band', crease: 0, side: 0.3 },
};
let FR_LOOK = 'soft';
const frLook = () => ({ crease: 0.4, side: 0.42, ...FR_LOOKS[FR_LOOK] });
function frShape(cutLift = 0) {
  const P = (dx, dy) => [FR_MID + dx, HY + dy];
  const right = FR_CROWN.map(([dx, dy]) => P(dx, dy));
  const left = FR_CROWN.map(([dx, dy]) => P(-dx, dy)).reverse();
  const cut = [];
  for (let k = -5; k <= 5; k++) cut.push([FR_MID + k * 4.36, frCutY(k * 4.36) - cutLift]);
  return poly(cr([...cut, ...right.slice(1, -1), P(0, -30), ...left.slice(1, -1)], true, 4));
}
function frBangs(splits) {
  const mid = FR_MID;
  const half = [];
  for (const [xs, d0] of splits) {
    const d = ROUND_RISE[BANG_LOOK] != null ? d0 * (1 - 0.35 * (xs / 22) ** 2) : d0;
    const ax = xs - d * 0.1;
    const y0 = frCutY(xs);
    // (each clump's corner rounded softly into the split; the split's top round)
    half.push(
      [xs - 1.3, frCutY(xs - 1.3)],
      [xs - 0.5, y0 - 0.85],
      [ax - 0.32, y0 - d + 0.6],
      [ax, y0 - d],
      [ax + 0.32, y0 - d + 0.6],
      [xs + 0.5, y0 - 0.85],
      [xs + 1.3, frCutY(xs + 1.3)],
    );
  }
  half.push([FR_END - 1.2, frCutY(FR_END - 1.2)], [FR_END - 0.15, frCutY(FR_END) - 1]);
  const edge = [...half.map(([x, y]) => [mid - x, y]).reverse(), [mid, frCutY(0)], ...half.map(([x, y]) => [mid + x, y])];
  const right = FR_CROWN.slice(1, -1).map(([dx, dy]) => [mid + dx, HY + dy]);
  const left = FR_CROWN.slice(1, -1).map(([dx, dy]) => [mid - dx, HY + dy]).reverse();
  return poly(cr([...edge, ...right, [mid, HY - 30], ...left], true, 5));
}
function hairFront() {
  if (!isHimeCut()) return bangsNew(BANG_LOOK);
  const ramp = hairRamp(HAIR_COLOR);
  const mid = FR_MID;
  const look = frLook();
  castShade(frBangs(look.splits));
  const fill = lin(mid, HY - 30, mid, HY + FR_CUT + 0.4, [[0, mixHex(ramp.base, ramp.hi, 0.35)], [0.45, ramp.base], [0.84, mixHex(ramp.base, ramp.sh1, 0.18)], [1, mixHex(ramp.base, ramp.sh1, 0.4)]]);
  // the inner layer, seen only up inside the splits: deeper, ending a little above the cut
  const inner = frShape(1.8);
  add(inner, lin(mid, HY - 12, mid, HY + FR_CUT, [[0, mixHex(ramp.base, ramp.sh1, 0.4)], [1, mixHex(ramp.sh1, ramp.sh2, 0.3)]]));
  // the bangs
  const bangs = frBangs(look.splits);
  add(bangs, fill);
  const shade = (a) => (y0, y1) => lin(mid, y0, mid, y1, [[0, rgba(ramp.sh1, 0)], [1, rgba(ramp.sh1, a)]]);
  for (const sd of [-1, 1]) {
    for (const [xs, d0] of look.splits) {
      const d = ROUND_RISE[BANG_LOOK] != null ? d0 * (1 - 0.35 * (xs / 22) ** 2) : d0;
      const ax = xs - d * 0.1;
      const y0 = frCutY(xs);
      // soft shadows along the clumps' sides at the split
      const sp = [[mid + sd * xs, y0 + 0.4], [mid + sd * (ax + (xs - ax) * 0.4), y0 - d * 0.6], [mid + sd * ax, y0 - d - 1.8]];
      detail(poly(ribbon(sp, (u) => lerp(3.2, 1, u), { n: 6 })), shade(look.side)(y0 - d - 1.8, y0), { clip: bangs, blur: 0.55 });
      // the split carried on up toward her crown, fading
      if (look.crease > 0) {
        const up = [[mid + sd * ax, y0 - d + 0.2], [mid + sd * ax * 0.93, y0 - d - 4.5], [mid + sd * ax * 0.72, HY - 17]];
        detail(poly(ribbon(up, (u) => 1 * (1 - u) + 0.2, { n: 8 })), lin(mid, HY - 17, mid, y0 - d, [[0, rgba(ramp.sh1, 0)], [1, rgba(ramp.sh1, look.crease)]]), { clip: bangs, blur: 0.35 });
      }
    }
  }
  // the clumps' cut ends a touch deeper; the sides deeper where her head turns away
  if (BANG_LOOK !== 'hime') {
    // (each clump's end a clean, slightly deeper shade, crisp at the cut)
    const cutL = [];
    for (let k = -22; k <= 22; k += 2) cutL.push([mid + k, frCutY(k) - 0.9]);
    detail(poly(ribbon(cutL, () => 2.4, { n: 2 })), rgba(ramp.sh1, 0.42), { clip: bangs, blur: 0.25 });
    const cutL2 = [];
    for (let k = -22; k <= 22; k += 2) cutL2.push([mid + k, frCutY(k) - 0.25]);
    detail(poly(ribbon(cutL2, () => 0.9, { n: 2 })), rgba(ramp.sh2, 0.32), { clip: bangs, blur: 0.08 });
  } else {
    const low = new Path2D();
    low.rect(mid - 30, HY - 6, 60, 10);
    detail(low, shade(0.26)(HY - 2.6, HY + FR_CUT + 0.4), { clip: bangs });
  }
  const sides = new Path2D();
  sides.rect(mid - 30, HY - 32, 60, 36);
  detail(sides, lin(mid - 25, 0, mid + 25, 0, [[0, rgba(ramp.sh1, 0.3)], [0.24, rgba(ramp.sh1, 0)], [0.76, rgba(ramp.sh1, 0)], [1, rgba(ramp.sh1, 0.3)]]), { clip: bangs });
  if (HAIR_LOOK === 'tails') {
    // (her hair drawn up into each tie: soft lines across her crown sweeping to the ties, fading at
    // both ends)
    for (const sd of [-1, 1]) {
      for (const [x0, y0, a] of [[3.4, -27.4, 0.42], [8, -25.6, 0.4], [12.6, -23, 0.34]]) {
        const ln = [[mid + sd * x0, HY + y0], [mid + sd * (x0 + 5), HY + y0 + 0.6], [mid + sd * 15.6, HY - 20.6], [mid + sd * 20.6, HY - 19.6]];
        detail(poly(ribbon(ln, (u) => 1 * Math.sin(Math.PI * u) + 0.05, { n: 6 })), rgba(ramp.sh1, a), { clip: bangs, blur: 0.3 });
      }
    }
  }
  // the shine: a soft band following her head's curve, fading at its ends; with fine lines of light
  // on the clumps ('lines'), the band alone ('band'), or high on the crown as a ring ('ring')
  const rise = ROUND_RISE[BANG_LOOK];
  const sy = look.shine === 'ring' ? -15.4 : BANG_LOOK === 'crescent' ? -14.4 : rise != null ? -11.2 - rise * 0.25 : -9.6;
  const arcY = (dx) => HY + sy + (look.shine === 'ring' ? 6.6 : rise != null ? 2.6 : 4.6) * (dx / 20) ** 2;
  const band = [];
  for (let k = 0; k <= 40; k++) band.push([mid - 20 + k, arcY(-20 + k)]);
  const fade = (a, col) => lin(mid - 20, 0, mid + 20, 0, [[0, rgba(col, 0)], [0.18, rgba(col, a)], [0.82, rgba(col, a)], [1, rgba(col, 0)]]);
  detail(poly(cr(ribbon(band, () => 4, { n: 1 }), true, 2)), fade(0.4, ramp.hi), { clip: bangs, blur: 0.8 });
  if (look.shine === 'band' || look.shine === 'ring') detail(poly(cr(ribbon(band, () => 1.4, { n: 1 }), true, 2)), fade(0.5, '#ffffff'), { clip: bangs, blur: 0.35 });
  if (look.shine === 'lines' || look.shine === 'ring') {
    // (one fine line on each clump, a second on the wide ones, each a different length)
    const xs = [0, ...look.splits.map(([x]) => x), FR_END];
    const lens = [5.4, 3.8, 4.8, 3.4, 4.2, 3.2, 3.8, 3];
    for (const sd of [-1, 1]) {
      for (let i = 0; i < xs.length - 1; i++) {
        const w = i === 0 ? xs[1] * 2 : xs[i + 1] - xs[i];
        const cx = i === 0 ? 0 : (xs[i] + xs[i + 1]) / 2;
        if (cx > 19) continue;
        const marks = [[cx + (i === 0 ? -0.9 : 0), lens[i % lens.length], 0]];
        if (w > 4.4) marks.push([cx + w * 0.26, lens[i % lens.length] * 0.62, 0.6]);
        for (const [mx, len, dy] of marks) {
          if (i === 0 && sd < 0 && mx < 0) continue;
          const x = mid + sd * mx;
          const y = arcY(mx) + dy;
          const lean = sd * mx * 0.03;
          const st = [[x - lean * len * 0.5, y - len * 0.45], [x + lean * len * 0.5, y + len * 0.55]];
          detail(poly(cr(ribbon(st, (u) => 0.45 + 0.5 * Math.sin(Math.PI * u), { n: 4 }), true, 2)), rgba('#ffffff', 0.62), { clip: bangs, blur: 0.12 });
        }
      }
    }
  }
  // (more shading: the tiara's soft shadow across her hair just below its band; the bows' shadows on
  // her crown; a soft warm glow along the bangs' lower edge, light bouncing up from her face)
  const tb = [[HX - 20.4, HY - 11.4], [HX - 13, HY - 20.6], [HX + 2, HY - 24.4], [HX + 16, HY - 20.6], [HX + 22, HY - 11.4]];
  detail(poly(ribbon(cr(tb, false, 6).map(([x, y]) => [x - 0.4, y + 1.6]), () => 1.8, { n: 1 })), rgba(ramp.sh2, 0.32), { clip: bangs, blur: 0.5 });
  if (HAIR_LOOK === 'tails') for (const sd of [-1, 1]) detail(ell(mid + sd * 22.4, HY - 15.8, 5.4, 2.6), rgba(ramp.sh2, 0.4), { clip: bangs, blur: 0.8 });
  // moonlight along the crown's upper edge, toward the light
  const rim = FR_CROWN.slice(1, 5).map(([dx, dy]) => [mid + dx - 1.6, HY + dy + 1.2]).reverse();
  detail(poly(ribbon(rim, (u) => 1.4 * Math.sin(Math.PI * u), { n: 8 })), rgba('#ffffff', 0.5), { clip: bangs, blur: 0.4 });
}
// (a soft shadow on her face under a hair shape, a little below it)
function castShade(path, dx = 0.3, dy = 1.3, a = 0.55) {
  const p2 = new Path2D();
  p2.addPath(path, new DOMMatrix().translate(dx, dy));
  detail(p2, rgba(SK.sh1, a), { clip: HEAD, blur: 0.7 });
}
// (her crown's cap down to a hairline: `edge` from the left temple to the right)
function capShape(edge) {
  const m = FR_MID;
  const right = FR_CROWN.slice(1, -1).map(([dx, dy]) => [m + dx, HY + dy]);
  const left = FR_CROWN.slice(1, -1).map(([dx, dy]) => [m - dx, HY + dy]).reverse();
  return poly(cr([...edge, ...right, [m, HY - 30], ...left], true, 5));
}
// (a lock narrowing from its root to a soft round end)
const bangTaper = (w0, w1) => (u) => (u < 0.22 ? lerp(w0 * 0.82, w0, u / 0.22) : lerp(w0, w1, ((u - 0.22) / 0.78) ** 1.15));
// The new bang styles: her crown's cap down to each style's hairline, then its locks (or braid), each
// casting a soft shadow on her forehead; the cap lit from above, a band of shine round it, moonlight
// along its upper edge.
function bangsNew(look) {
  const m = FR_MID;
  const r = HL();
  const locks = [];
  let edge;
  if (look === 'curtain') {
    // parted in the middle; each side sweeping out and down to her temples, curving as it goes, the
    // locks nearest the part lying on top; her forehead shows in a soft arch between them
    edge = [[m - 21.8, HY + 1.5], [m - 17.5, HY - 5], [m - 10.5, HY - 12.5], [m - 4.2, HY - 17.2], [m, HY - 18.4], [m + 4.2, HY - 17.2], [m + 10.5, HY - 12.5], [m + 17.5, HY - 5], [m + 21.8, HY + 1.5]];
    for (const s of [-1, 1]) {
      const X = (dx) => m + s * dx;
      locks.push([[[X(7.4), HY - 21], [X(15.2), HY - 13], [X(19.8), HY - 3.4], [X(21.2), HY + 5]], bangTaper(6.4, 2.6), s]);
      locks.push([[[X(3.4), HY - 21.6], [X(10.6), HY - 13.2], [X(16.2), HY - 4.2], [X(18.6), HY + 4]], bangTaper(6.6, 2.6), s]);
      locks.push([[[X(1), HY - 20.8], [X(5.8), HY - 13.6], [X(11), HY - 5.6], [X(14.8), HY + 1.4]], bangTaper(5.8, 2.4), s]);
    }
    locks.sort((a, b) => Math.abs(b[0][0][0] - m) - Math.abs(a[0][0][0] - m));
  } else if (look === 'swept') {
    // parted on her left: the hair sweeps across her forehead to the right in long soft locks, above
    // her brows, its ends tucking by her right temple; a short lock falls by her left temple
    edge = [[m - 21.8, HY + 2], [m - 18, HY - 6], [m - 12.4, HY - 13], [m - 8, HY - 15.8], [m - 4, HY - 13], [m + 4, HY - 9], [m + 12, HY - 5], [m + 18, HY - 1], [m + 21.8, HY + 2.5]];
    locks.push([[[m - 10.6, HY - 18], [m - 15.6, HY - 10], [m - 19, HY - 2], [m - 20.2, HY + 4.4]], bangTaper(5.8, 2.4), -1]);
    locks.push([[[m - 4, HY - 24.4], [m + 6, HY - 20.6], [m + 15, HY - 14], [m + 21, HY - 6], [m + 23, HY + 1]], bangTaper(6.4, 2.6), 1]);
    locks.push([[[m - 7, HY - 22], [m + 2, HY - 17], [m + 11, HY - 10.4], [m + 18, HY - 4], [m + 21.4, HY + 3.6]], bangTaper(6.8, 2.6), 1]);
    locks.push([[[m - 9, HY - 19], [m - 2, HY - 14], [m + 7, HY - 7.6], [m + 14.6, HY - 2.6], [m + 18.8, HY + 2.8]], bangTaper(6.6, 2.6), 1]);
    locks.push([[[m - 10, HY - 16.4], [m - 4, HY - 10.6], [m + 3.6, HY - 4.8], [m + 10.4, HY - 1.4], [m + 14, HY + 0.6]], bangTaper(5.4, 2.2), 1]);
  } else if (look === 'air') {
    // light see-through bangs: seven soft clumps from her hairline to her brows, a little of her
    // forehead showing between them, each ending in a soft round tip
    edge = [[m - 21.8, HY + 1.5], [m - 18.5, HY - 3.6], [m - 12, HY - 6], [m, HY - 6.8], [m + 12, HY - 6], [m + 18.5, HY - 3.6], [m + 21.8, HY + 1.5]];
    const cl = [[-16.4, 1.6, 6.2], [-11, 0.9, 6.4], [-5.5, 0.5, 6.4], [0, 1.0, 6.6], [5.5, 0.5, 6.4], [11, 0.9, 6.4], [16.4, 1.6, 6.2]];
    for (const [dx, ty, w] of cl) {
      const lean = Math.sign(dx) * 0.6;
      locks.push([[[m + dx * 0.8, HY - 15], [m + dx * 0.96, HY - 6], [m + dx + lean, HY + ty]], (u) => (u < 0.5 ? w : lerp(w, 1.9, smoothU((u - 0.5) / 0.5))), 1]);
    }
  } else if (look === 'braid') {
    // her front hair braided across her hairline like a circlet, just under her tiara; a short soft
    // lock framing each temple
    edge = [[m - 21.8, HY + 1], [m - 18, HY - 6.5], [m - 11, HY - 12], [m, HY - 13.6], [m + 11, HY - 12], [m + 18, HY - 6.5], [m + 21.8, HY + 1]];

  }
  const cap = capShape(edge);
  // their shadows on her forehead
  castShade(cap);
  for (const [line, w] of locks) castShade(poly(ribbon(line, w, { n: 8 })), 0.4, 1.2, 0.5);
  const fill = lin(m, HY - 30, m, HY + 6, [[0, mixHex(r.base, r.hi, 0.35)], [0.5, r.base], [1, mixHex(r.base, r.sh1, 0.34)]]);
  add(cap, fill);
  // (the cap's edge a touch deeper; its sides deeper where her head turns away)
  detail(poly(cr(ribbon(edge, () => 3, { n: 4 }), true, 2)), rgba(r.sh1, 0.32), { clip: cap, blur: 0.6 });
  const sides = new Path2D();
  sides.rect(m - 30, HY - 32, 60, 36);
  detail(sides, lin(m - 25, 0, m + 25, 0, [[0, rgba(r.sh1, 0.3)], [0.24, rgba(r.sh1, 0)], [0.76, rgba(r.sh1, 0)], [1, rgba(r.sh1, 0.3)]]), { clip: cap });
  // the locks (or the braid) over it
  for (const [line, w, sh] of locks) hlock(line, w, { shade: sh, gloss: 0, fill, outline: true });
  // (a band of shine round the crown, fading at its ends)
  const arcY = (dx) => HY - 17.2 + 6.4 * (dx / 20) ** 2;
  const band = [];
  for (let k = 0; k <= 40; k++) band.push([m - 20 + k, arcY(-20 + k)]);
  const fade = (a, col) => lin(m - 20, 0, m + 20, 0, [[0, rgba(col, 0)], [0.18, rgba(col, a)], [0.82, rgba(col, a)], [1, rgba(col, 0)]]);
  detail(poly(cr(ribbon(band, () => 4, { n: 1 }), true, 2)), fade(0.38, r.hi), { clip: cap, blur: 0.8 });
  detail(poly(cr(ribbon(band, () => 1.4, { n: 1 }), true, 2)), fade(0.45, '#ffffff'), { clip: cap, blur: 0.35 });
  const rim = FR_CROWN.slice(1, 5).map(([dx, dy]) => [m + dx - 1.6, HY + dy + 1.2]).reverse();
  detail(poly(ribbon(rim, (u) => 1.4 * Math.sin(Math.PI * u), { n: 8 })), rgba('#ffffff', 0.5), { clip: cap, blur: 0.4 });
  if (look === 'braid') braid([[m - 18.4, HY - 4.6], [m - 14.6, HY - 9.4], [m - 7.6, HY - 12.8], [m, HY - 13.6], [m + 7.6, HY - 12.8], [m + 14.6, HY - 9.4], [m + 18.4, HY - 4.6]], 25, 5.6, 5.6, 0.55);
}
function sideLocks() {
  const ramp = hairRamp(HAIR_COLOR);
  const mid = HX + 1;
  for (const s2 of [-1, 1]) {
    const X = (dx) => mid + s2 * dx;
    // (the player: "this side of the face on both sides should be covered by hair": wide enough to
    // cover her face's sides right up to her lashes' wings, clear of them and of her cheek mark)
    const sw0 = POSE ? POSE.locks[s2 > 0 ? 1 : 0] : 0;
    // (her leafy look, 2026-11-27: the same gentle S as her other locks, its tip turning out)
    const base = HAIR_LOOK === 'leafy' ? [[X(19.2), HY - 9], [X(20.4), HY + 2], [X(20.6), HY + 13], [X(22.2), HY + 24], [X(21.2), 72], [X(22.6), 80]] : [[X(19.2), HY - 9], [X(20.4), HY + 2], [X(20.2), HY + 13], [X(21), HY + 23], [X(21), 72], [X(20.4), 80]];
    const line = base.map(([x, y]) => {
      const u = Math.max(0, (y - HY) / 40);
      return [x + sw0 * 45 * u * u, y];
    });
    const w = (u) => (u < 0.72 ? lerp(9.8, 7.6, u / 0.72) : 7.6 * Math.cos(((u - 0.72) / 0.28) * Math.PI * 0.5) ** 0.75 + 0.6);
    const pts = ribbon(line, w, { n: 8 });
    const shape = poly(cr(pts, true, 2));
    add(shape, lin(X(20), HY - 8, X(20), 80, [[0, ramp.base], [0.7, ramp.base], [1, ramp.sh1]]));
    // (the side toward her face in soft shade; a shine down the outside)
    const inner = line.map(([x, y]) => [x - s2 * 2.6, y]);
    detail(poly(ribbon(inner, (u) => w(u) * 0.42, { n: 8 })), rgba(ramp.sh1, 0.7), { clip: shape, blur: 0.6 });
    const outer = line.slice(0, 4).map(([x, y]) => [x + s2 * 2.2, y + 3]);
    detail(poly(ribbon(outer, (u) => 1.6 * Math.sin(Math.PI * u) + 0.2, { n: 8 })), rgba(ramp.hi, 0.75), { clip: shape, blur: 0.4 });
    // (one soft line between its two clumps, fading at both ends)
    const groove = line.slice(1).map(([x, y]) => [x - s2 * 0.4, y]);
    detail(poly(ribbon(groove, (u) => 0.9 * Math.sin(Math.PI * u), { n: 8 })), rgba(ramp.sh2, 0.4), { clip: shape, blur: 0.35 });
    // (more shading: deep where it tucks under the bangs, a thin rim of light down its outer edge, a
    // periwinkle bounce light low on its inner edge, its ends lightening a little)
    detail(ell(X(20.4), HY - 4, 6, 4), rgba(ramp.sh2, 0.35), { clip: shape, blur: 0.9 });
    const sw = (u) => (u < 0.72 ? lerp(9.8, 7.6, u / 0.72) : 7.6 * Math.cos(((u - 0.72) / 0.28) * Math.PI * 0.5) ** 0.75 + 0.6);
    const oe = sideOf(line, sw, -s2 * 0.86);
    detail(poly(ribbon(oe.slice(Math.round(oe.length * 0.12), -6), (u) => 0.8 * Math.sin(Math.PI * u) + 0.1, { n: 1 })), rgba('#ffffff', 0.55), { clip: shape, blur: 0.2 });
    const ie = sideOf(line, sw, s2 * 0.86);
    detail(poly(ribbon(ie.slice(Math.round(ie.length * 0.45), -6), (u) => 1 * Math.sin(Math.PI * u) + 0.1, { n: 1 })), rgba('#cfdcff', 0.45), { clip: shape, blur: 0.3 });
    // (its ends lightening a little; not on her leafy locks, where it read as glassy)
    if (HAIR_LOOK !== 'leafy') {
      const lt = new Path2D();
      lt.rect(X(10) - 20, 64, 40, 20);
      detail(lt, lin(0, 64, 0, 80, [[0, rgba('#f6f0ff', 0)], [1, rgba('#f6f0ff', 0.4)]]), { clip: shape });
    }
  }
}
function longHair() {}
// (the fringe's shadow on her forehead, drawn with her face, under the fringe)
function fringeShade() {}
// The veil: sheer moonlight silk from her crown, down her back and over the deer to its rump, its
// border stitched with silver and little stars.
function veilPt([x, y]) {
  if (!POSE) return [x, y];
  // (near her head it moves with her head, low on the deer's back with the deer, between the two;
  // a soft ripple runs down it)
  const t = smoothU(Math.min(1, Math.max(0, (y - 40) / 72)));
  const ph = xfPt(POSE.Mh, [x, y]);
  const pb = xfPt(POSE.Mb, [x, y]);
  const rip = POSE.veil * Math.sin((y - 40) * 0.09 - POSE.t * 2.4) * t;
  return [lerp(ph[0], pb[0], t) + rip, lerp(ph[1], pb[1], t) + rip * 0.2 + (POSE.veilY ?? 0) * t];
}
function veil() {
  const outer = [[HX - 8, HY - 18], [HX - 20, HY - 10], [HX - 32, HY + 10], [HX - 44, 66], [HX - 56, 84], [HX - 68, 99], [HX - 78, 111], [HX - 82, 121]].map(veilPt);
  const hem = [[HX - 76, 127], [HX - 66, 124.6], [HX - 58, 128], [HX - 48, 125], [HX - 40, 128.4], [HX - 32, 124]].map(veilPt);
  const inner = [[HX - 26, 104], [HX - 20, 80], [HX - 14, HY + 14], [HX - 2, HY - 12]].map(veilPt);
  const shape = smooth([...outer, ...hem, ...inner], 5);
  add(shape, lin(HX - 40, HY, HX - 60, 130, [[0, rgba(LV.lt, 0.28)], [1, rgba(LV.base, 0.46)]]), false);
  // folds: long soft creases falling from the crown
  for (let k = 0; k < 5; k++) {
    const f = [[HX - 10 - k * 3, HY - 8 + k * 4], [HX - 24 - k * 6, 74 + k * 2], [HX - 38 - k * 8, 104 + k * 2], [HX - 40 - k * 8, 124]].map(veilPt);
    detail(poly(ribbon(f, (u) => 1.8 * Math.sin(Math.PI * u) + 0.2, { n: 5 })), rgba('#ffffff', 0.4), { clip: shape });
    detail(poly(ribbon(f.map(([x, y]) => [x + 2.6, y]), (u) => 1.2 * Math.sin(Math.PI * u) + 0.1, { n: 5 })), rgba(LV.dk, 0.25), { clip: shape });
  }
  // its hem: a stitched silver line, little stars
  const hl = cr([outer[outer.length - 1], ...hem], false, 6);
  lineOf(hl.map(([x, y]) => [x, y - 2]), rgba(SV.base, 0.95), 0.5, { clip: shape });
  for (let k = 3; k < hl.length - 2; k += 7) star4(hl[k][0], hl[k][1] - 4.2, 1.2, 'rgba(255,255,255,0.95)', 0.3);
  return shape;
}

// ---------- The antlers ----------
// Crystal: a soft glow inside, a bright line down each tine, a cooler edge on the far side, small
// facets; fine gold chains swinging between the tines with a little moon and a star.
function antler(s) {
  const far = s < 0;
  const k = far ? 0.94 : 1;
  const b = [HX + s * 8.4, HY - 22];
  const X = (dx) => HX + s * dx * k;
  const beam = [b, [X(10.6), HY - 33 * k], [X(16.4), HY - 43 * k], [X(24.6), HY - 50.6 * k], [X(33.6), HY - 54.4 * k]];
  const tines = [
    [along(beam, 0.24).p, [X(8.2), HY - 45 * k], [X(7.2), HY - 52.6 * k]],
    [along(beam, 0.52).p, [X(18.6), HY - 55 * k], [X(17.4), HY - 63.4 * k]],
    [along(beam, 0.78).p, [X(29.4), HY - 61 * k], [X(30.4), HY - 68.4 * k]],
  ];
  const shapes = [poly(ribbon(beam, (u) => lerp(5.2, 2.4, u) * k, { n: 8 })), ...tines.map((t) => poly(ribbon(t, (u) => lerp(3.2, 1.5, u) * k, { n: 6 })))];
  for (const p of shapes) add(p, lin(b[0], b[1], X(30), HY - 66, [[0, far ? AN.mid : AN.base], [1, far ? AN.sh : AN.mid]]));
  const all = join(...shapes);
  glow(all, X(16), HY - 42, 16, '#ffffff', far ? 0.35 : 0.7);
  for (const t of [beam, ...tines]) {
    lineOf(cr(t, false, 6).slice(1, -2), rgba('#ffffff', far ? 0.55 : 0.95), 0.85, { clip: all });
    lineOf(cr(t.map(([x, y]) => [x + s * 1.2, y + 0.4]), false, 6).slice(2, -1), rgba(AN.edge, far ? 0.4 : 0.55), 0.8, { clip: all });
  }
  for (const u of [0.16, 0.36, 0.6, 0.84]) {
    const q = along(beam, u);
    lineOf([[q.p[0] - q.n[0] * 1.8 - q.d[0] * 0.8, q.p[1] - q.n[1] * 1.8 - q.d[1] * 0.8], [q.p[0] + q.n[0] * 1.8 + q.d[0] * 0.8, q.p[1] + q.n[1] * 1.8 + q.d[1] * 0.8]], rgba('#ffffff', 0.7), 0.5, { clip: all });
  }
  for (const t of tines) star4(t[2][0], t[2][1] - 1.6, far ? 1.6 : 2.1, '#ffffff', 0.2);
  // the chains
  const chain = (p0, p1, sag, charm) => {
    const mid = [(p0[0] + p1[0]) / 2 + (POSE?.chain ?? 0) * sag * 0.6, (p0[1] + p1[1]) / 2 + sag];
    const line = cr([p0, mid, p1], false, 8);
    lineOf(line, far ? '#9c7638' : GD.dk, 1.05);
    lineOf(line, far ? '#d8b25c' : GD.lt, 0.5, { dash: [0.7, 0.7] });
    const m = line[Math.floor(line.length / 2)];
    withXF(rotAbout(m[0], m[1], POSE?.charm ?? 0), () => {
    lineOf([m, [m[0], m[1] + 2.2]], GD.dk, 0.5);
    if (charm === 'moon') {
      crescent(m[0], m[1] + 4, 1.9, 0.5, far ? '#d8b25c' : GD.base);
      detail(ell(m[0] - 0.4, m[1] + 3.6, 0.5, 0.5), '#ffffff');
    } else {
      star5(m[0], m[1] + 4, 1.9, far ? '#d8b25c' : GD.base);
      detail(ell(m[0] - 0.3, m[1] + 3.6, 0.45, 0.45), '#ffffff');
    }
    });
  };
  const tp = (t, u) => along(t, u).p;
  chain(tp(tines[0], 0.72), tp(tines[1], 0.6), 5, 'moon');
  chain(tp(tines[1], 0.72), tp(tines[2], 0.62), 4.4, 'star');
  chain(tp(beam, 0.34), tp(beam, 0.96), 8.6, far ? 'star' : 'moon');
}

// ---------- The deer ears ----------
// (redrawn 2026-11-23): a soft leaf-shaped deer ear with a rounded tip; its inside pink, fluffy white
// fur tufts along the inner edge and at its base, a soft rim of light along the top, a soft shade where
// it meets her head; her crescent earring.
function deerEar(s) {
  return withXF(rotAbout(HX + s * 20.5, HY - 7, POSE ? POSE.ear[s > 0 ? 1 : 0] * s : 0), () => deerEarDraw(s));
}
function deerEarDraw(s) {
  const base = [HX + s * 20.5, HY - 7];
  const a = s > 0 ? -0.2 : Math.PI + 0.2;
  const len = 17.4;
  const wd = 9.8;
  const far = s < 0;
  const R = (u, v) => [base[0] + Math.cos(a) * len * u - Math.sin(a) * wd * v * s, base[1] + Math.sin(a) * len * u + Math.cos(a) * wd * v * s];
  const ear = smooth([R(-0.05, -0.34), R(0.26, -0.56), R(0.58, -0.54), R(0.86, -0.32), R(1.01, -0.05), R(0.98, 0.12), R(0.78, 0.36), R(0.48, 0.52), R(0.18, 0.5), R(-0.05, 0.38)], 4);
  add(ear, far ? lin(...R(0, -0.5), ...R(0, 0.5), [[0, CO.base], [1, CO.sh]]) : lin(...R(0, -0.5), ...R(0, 0.5), [[0, CO.hi], [1, CO.base]]));
  // (the inside: pink, deepest toward the base)
  const inner = smooth([R(0.1, -0.2), R(0.4, -0.32), R(0.72, -0.2), R(0.88, 0.02), R(0.66, 0.24), R(0.34, 0.3), R(0.1, 0.16)], 4);
  detail(inner, lin(...R(0.08, 0), ...R(0.9, 0), [[0, far ? '#c9a0bd' : '#e6b6cf'], [1, far ? '#dcbdd2' : '#f9e4ef']]), { clip: ear, blur: 0.15 });
  detail(ell(...R(0.2, 0.02), 3, 2.4), rgba(far ? '#b58aa9' : '#d99bbd', 0.5), { clip: inner, blur: 0.5 });
  // (fluffy white fur tufts along the inner lower edge and at the base)
  const along2 = Math.atan2(R(1, 0)[1] - R(0, 0)[1], R(1, 0)[0] - R(0, 0)[0]);
  for (const [u, v, len, w] of [[0.06, 0.28, 7, 3.4], [0.24, 0.34, 6.4, 3], [0.42, 0.32, 5.4, 2.6]]) {
    const [cx, cy] = R(u, v);
    const tilt = s * -0.18;
    detail(furTuft(cx, cy + 0.6, len, w, along2 + tilt), rgba(far ? CO.sh : '#d9b3c9', 0.45), { clip: ear, blur: 0.35 });
    detail(furTuft(cx, cy, len, w, along2 + tilt), lin(cx, cy, cx + Math.cos(along2) * len, cy, [[0, far ? CO.hi : '#ffffff'], [1, far ? CO.base : '#fdf6fa']]), { clip: ear, blur: 0.1 });
  }
  // (a soft rim of light along its top, a soft shade where it meets her head)
  detail(poly(ribbon([R(0.12, -0.44), R(0.45, -0.5), R(0.78, -0.34), R(0.95, -0.1)], (u) => 1.4 * Math.sin(Math.PI * u) + 0.1, { n: 6 })), rgba('#ffffff', far ? 0.3 : 0.75), { clip: ear, blur: 0.3 });
  detail(ell(...R(-0.02, 0), 3.4, 4.4), rgba(CO.sh, 0.55), { clip: ear, blur: 0.7 });
  // a crescent earring
  const [x, y] = R(0.44, 0.42);
  withXF(rotAbout(x, y, POSE ? POSE.earring[s > 0 ? 1 : 0] : 0), () => {
    lineOf([[x, y], [x, y + 2.6]], GD.dk, 0.5);
    crescent(x, y + 4.4, 1.9, 0.2, far ? '#d8b25c' : GD.base);
    detail(ell(x - 0.5, y + 4, 0.45, 0.45), '#ffffff');
  });
}

// ---------- The face ----------
// (2026-11-23, the player: "polish the head to be more sharp and less round": an anime face's shape:
// the skull and cheeks full at her eyes, then a cleaner, straighter jaw tapering to a smaller chin,
// softly pointed but round at its very tip (no corner anywhere); the chin under her mouth)
const HEAD_CTRL = (() => {
  const upR = [[0, -23], [11.8, -20.2], [18.6, -13.8], [21, -4.6], [21, 3.6]];
  const lowR = [[20.5, 9.2], [18.6, 13.6], [15.4, 17.3], [11.4, 20.4], [7.2, 22.8], [3.9, 24.2]];
  const chin = [1, 24.7];
  const lowL = lowR.map(([x, y]) => [2 - x, y]).reverse();
  const upL = upR.slice(1).map(([x, y]) => [-x, y]).reverse();
  return [...upR, ...lowR, chin, ...lowL, ...upL].map(([x, y]) => [HX + x, HY + y]);
})();
const HEAD_PTS = cr(HEAD_CTRL, true, 3);
const HEAD = poly(HEAD_PTS);
// ---------- Her face (reworked 2026-11-23, the player: "heavily rework the face, eyes, mouth to be
// extremely well drawn, make lower eye lids and such, give the face personality") ----------
// Who she is: serene, gentle and a little dreamy, a kind queen with a quiet smile. Her eyes are
// relaxed (the upper lids eased down, the outer corners lifting a touch), the moon in them: a star
// for a glint and a crescent of light in the lower iris. Every eye has its lid crease and a soft
// shadow of colour on the lid, a heavy lash sweeping into a soft wing with rounded clumps, a real
// lower lid with its waterline and two small lashes, and the soft little bulge beneath it. Her
// mouth is a small closed smile lifting more on one side; a tiny silver crescent sits on her cheek.
const EYE_W = 10.8;
const EYE_H = 11.4;
const EYE_Y = HY + 8.3;
const EYES = [[HX - 7.1, -1], [HX + 9.1, 1]];
const LASH = HR.lash;
const LID = '#c9927e';
const smoothU = (u) => u * u * (3 - 2 * u);
// The eye in each expression: lid (how far the upper lid is lowered, share of the height), lift (the
// outer corner raised), ik (iris size), and optionally bot (the lower edge pushed up, as a smile
// lifts the cheeks), inner (the upper lid raised at its inner end, as in sorrow), look (where she
// looks: the iris moved, the same way for both eyes), star (starry eyes), wet (eyes brimming).
const EYE_SPEC = {
  idle: { lid: 0.14, lift: 0.05, ik: 1 },
  serene: { lid: 0.14, lift: 0.05, ik: 1 },
  neutral: { lid: 0.2, lift: 0, ik: 1 },
  wonder: { lid: -0.03, lift: 0.02, ik: 0.86 },
  hurt: { lid: 0.2, lift: -0.02, ik: 0.92 },
  smile: { lid: 0.2, lift: 0.08, ik: 1, bot: 0.13 },
  starry: { lid: -0.01, lift: 0.04, ik: 1.04, star: true },
  dreamy: { lid: 0.32, lift: 0.07, ik: 1, look: [0.06, -0.06], bot: 0.06 },
  shy: { lid: 0.22, lift: 0.03, ik: 0.95, look: [-0.13, 0.07], bot: 0.05 },
  pout: { lid: 0.3, lift: -0.01, ik: 0.97, look: [0.1, 0] },
  smug: { lid: 0.36, lift: 0.13, ik: 0.97, look: [-0.09, 0.02], bot: 0.08 },
  teary: { lid: 0.1, lift: -0.09, ik: 1.03, inner: 0.1, wet: true },
};
// (how narrowed her eyes are, on top of every expression: the upper lid lower and the lower lid a
// little higher; 2026-11-24, the player: "lets try making her eyes more narrowed to test")
let EYE_NARROW = 0;
function eyeGeom(x, y, w, h, o, mood) {
  const sp = mood && typeof mood === 'object' ? mood : (EYE_SPEC[mood] ?? EYE_SPEC.idle);
  const { lid, lift, ik } = sp;
  const L = (lid + 0.13 * EYE_NARROW) * h;
  const inn = (sp.inner ?? 0) * h;
  const b = ((sp.bot ?? 0) + 0.07 * EYE_NARROW) * h;
  const inner = [x - o * w * 0.5, y + h * 0.13];
  const outer = [x + o * w * 0.52, y - h * (0.04 + lift)];
  const top = [inner, [x - o * w * 0.32, y - h * 0.3 + L * 0.7 - inn], [x - o * w * 0.02, y - h * 0.43 + L - inn * 0.4], [x + o * w * 0.3, y - h * 0.4 + L * 0.9], outer];
  const bot = [outer, [x + o * w * 0.38, y + h * 0.27 - b * 0.8], [x + o * w * 0.04, y + h * 0.43 - b], [x - o * w * 0.3, y + h * 0.37 - b * 0.9], inner];
  return { inner, outer, top, bot, ik, sp };
}
function eye(x, y, w, h, o, mood) {
  if (mood && typeof mood === 'object' && mood.closed) return closedEye(x, y, w, h, o, mood.closed);
  if (mood === 'happy' || mood === 'blink') return closedEye(x, y, w, h, o, mood);
  if (EYE_D[EYE_STYLE]) return eyeDesign(x, y, w, h, o, mood, EYE_D[EYE_STYLE]);
  const { inner, outer, top, bot, ik, sp } = eyeGeom(x, y, w, h, o, mood);
  const topC = cr(top, false, 8);
  const botC = cr(bot, false, 8);
  const white = poly([...topC, ...botC.slice(1, -1)]);
  // the white: cool under the lid, warm toward the inner corner
  detail(white, lin(x, y - h * 0.45, x, y + h * 0.45, [[0, '#e6e2f6'], [0.45, '#fbfaff'], [1, '#ffffff']]));
  detail(ell(inner[0] + o * 0.8, inner[1] - 0.3, 1.3, 1.1), rgba('#f2b5c4', 0.7), { clip: white });
  // the iris: deep at its rim, royal blue, lightening low; darkest under the lid
  const ix = x + o * w * 0.04 + (sp.look?.[0] ?? 0) * w;
  const iy = y + h * 0.05 + (sp.look?.[1] ?? 0) * h;
  const irx = w * 0.4 * ik;
  const iry = h * 0.5 * ik;
  const iris = ell(ix, iy, irx, iry);
  detail(iris, rad(ix, iy + iry * 0.35, iry * 1.12, [[0, EY.lt], [0.34, EY.base], [0.7, EY.mid], [1, EY.dk]]), { clip: white });
  detail(iris, lin(ix, iy - iry, ix, iy + iry, [[0, rgba(EY.dk, 0.95)], [0.38, rgba(EY.dk, 0.6)], [0.6, rgba(EY.dk, 0)]]), { clip: white });
  // fine light lines from the pupil out through the lower iris
  for (let k = 0; k < 11; k++) {
    const q = Math.PI * 0.08 + (k / 10) * Math.PI * 0.84;
    detail(poly(ribbon([[ix + Math.cos(q) * irx * 0.34, iy + Math.sin(q) * iry * 0.34], [ix + Math.cos(q) * irx * 0.84, iy + Math.sin(q) * iry * 0.84]], (u) => 0.42 * (1 - u) + 0.12, { n: 2 })), rgba(EY.glow, 0.36), { clip: [white, iris] });
  }
  // the crescent of moonlight in the lower iris, her signature
  const cres = new Path2D();
  cres.ellipse(ix, iy + iry * 0.18, irx * 0.78, iry * 0.7, 0, Math.PI * 0.12, Math.PI * 0.88);
  cres.ellipse(ix, iy + iry * 0.02, irx * 0.74, iry * 0.62, 0, Math.PI * 0.86, Math.PI * 0.14, true);
  cres.closePath();
  detail(cres, lin(ix, iy + iry * 0.3, ix, iy + iry * 0.9, [[0, rgba('#d8ecff', 0.25)], [1, rgba('#eaf5ff', 0.85)]]), { clip: [white, iris] });
  // the limbal ring and the pupil, its edge soft
  items.push({ path: iris, line: false, strokeOnly: rgba(EY.dk, 0.75), slw: 0.6, clip: white, m: XF });
  detail(ell(ix, iy + iry * 0.02, w * 0.15, h * 0.23), rgba(EY.dk, 0.4), { clip: white });
  detail(ell(ix, iy + iry * 0.02, w * 0.11, h * 0.18), EY.pupil, { clip: white });
  // the lid's shadow across the top of the eye
  detail(poly(ribbon(top, (u) => h * 0.24 * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.05)) + 0.4, { n: 8, caps: false })), rgba(HR.sh2, 0.5), { clip: white });
  // glints: a star toward the light, a round one low on the other side, two fine sparkles
  const gx = ix + w * 0.13;
  const gy = iy - iry * 0.12;
  const st = [];
  for (let k = 0; k < 8; k++) {
    const q = (k * Math.PI) / 4;
    const rr = k % 2 ? w * 0.04 : w * (k % 4 === 0 ? 0.2 : 0.14);
    st.push([gx + Math.cos(q) * rr, gy + Math.sin(q) * rr]);
  }
  if (sp.star) {
    const sx = ix + w * 0.02;
    const sy2 = iy - iry * 0.02;
    const big = [];
    for (let k = 0; k < 8; k++) {
      const q = (k * Math.PI) / 4 - Math.PI / 2;
      const rr = k % 2 ? w * 0.07 : w * 0.27;
      big.push([sx + Math.cos(q) * rr, sy2 + Math.sin(q) * rr]);
    }
    detail(smooth(big, 3), '#ffffff', { clip: white });
    detail(ell(sx, sy2, w * 0.09, w * 0.09), rgba('#fff6c9', 0.9), { clip: white });
    star4(ix - w * 0.2, iy + iry * 0.42, w * 0.07, 'rgba(255,255,255,0.95)');
    star4(ix + w * 0.21, iy - iry * 0.36, w * 0.05, 'rgba(255,255,255,0.9)');
  } else {
    detail(smooth(st, 2), '#ffffff', { clip: white });
    detail(ell(ix - w * 0.15, iy + iry * 0.3, w * 0.065, w * 0.06), 'rgba(255,255,255,0.95)', { clip: white });
    detail(ell(ix + w * 0.2, iy + iry * 0.36, w * 0.03, w * 0.03), 'rgba(255,255,255,0.85)', { clip: white });
    detail(ell(gx - w * 0.14, gy - w * 0.08, w * 0.025, w * 0.025), 'rgba(255,255,255,0.9)', { clip: white });
  }
  if (sp.wet) {
    const wc = new Path2D();
    wc.ellipse(ix, iy + iry * 0.2, irx * 0.86, iry * 0.72, 0, Math.PI * 0.1, Math.PI * 0.9);
    wc.ellipse(ix, iy + iry * 0.06, irx * 0.82, iry * 0.62, 0, Math.PI * 0.88, Math.PI * 0.12, true);
    wc.closePath();
    detail(wc, rgba('#ffffff', 0.6), { clip: white, blur: 0.15 });
    detail(ell(ix - w * 0.05, iy + iry * 0.55, w * 0.05, w * 0.04), 'rgba(255,255,255,0.95)', { clip: white });
    detail(poly(ribbon(bot.slice(1, 4).map(([px, py]) => [px, py - 0.5]), (u) => 1.1 * Math.sin(Math.PI * u) + 0.2, { n: 6 })), rgba('#cfe6ff', 0.75), { clip: white, blur: 0.2 });
  }
  if (mood === 'wonder' || sp.wonder) star4(ix - w * 0.04, iy + iry * 0.08, w * 0.08, 'rgba(255,255,255,0.8)');
  // the upper lash (2026-11-23, the player: "rework the eye lashes to be smooth, perfect and nice"):
  // one smooth shape. Thin at the inner corner, it thickens evenly along the lid to the outer corner
  // and sweeps on into a soft upturned wing; two short soft flicks rise from its outer part, grown
  // from the same outline (no seams, no bumps), every tip round. A soft sheen along it.
  drawLashes(topC, botC, inner, outer, o);
}
// Her lashes, upper and lower (2026-11-24, the player: "try redrawing the eyelashes and down lashes
// to test"): 'now' (her one smooth lash with its wing and flicks, no lower lashes), 'flutter' (a slim
// line with five separate curling lashes fanning out toward the outer corner; three little lower
// lashes), 'doll' (a fuller line with three long doll lashes curling up at the corner; a row of tiny
// lower lashes under a soft pink waterline), 'soft' (a fine natural line easing into a short wing; a
// faint lower lid and two tiny lashes), 'wing' (a bold line sweeping out into a long elegant wing; a
// fine lower line toward the corner with two flicks). Every lash round-tipped.
let LASH_LOOK = 'now';
const LASH_LOOKS = { now: 'Now', flutter: 'Flutter', doll: 'Doll', soft: 'Soft natural', wing: 'Winged' };
function lidFrame(lid, i, o) {
  const N = lid.length;
  const a = lid[Math.max(0, i - 1)];
  const b = lid[Math.min(N - 1, i + 1)];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const t = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  return { t, n: [o * t[1], -o * t[0]] };
}
// (the line of the lash along the lid: thick(u) above the lid, then `wing` points past the outer corner)
function lashBand(lid, inner, outer, o, thick, wing) {
  const N = lid.length;
  const top = [];
  for (let i = N - 2; i >= 1; i--) {
    const { n } = lidFrame(lid, i, o);
    const u = i / (N - 1);
    top.push([lid[i][0] + n[0] * thick(u), lid[i][1] + n[1] * thick(u)]);
  }
  const { t: tw } = lidFrame(lid, N - 1, o);
  const W = wing.map(([a, b]) => [outer[0] + tw[0] * a, outer[1] + tw[1] * a - b]);
  const shape = poly(cr([...lid, ...W, ...top], true, 3));
  add(shape, lin(inner[0], inner[1], outer[0], outer[1], [[0, mixHex(LASH, EY.mid, 0.4)], [0.4, LASH], [1, LASH]]), false);
  const sheen = [];
  for (let i = Math.round(N * 0.25); i <= Math.round(N * 0.8); i += 2) {
    const { n } = lidFrame(lid, i, o);
    const u = i / (N - 1);
    sheen.push([lid[i][0] + n[0] * thick(u) * 0.55, lid[i][1] + n[1] * thick(u) * 0.55]);
  }
  detail(poly(ribbon(sheen, (u) => 0.45 * Math.sin(Math.PI * u) + 0.05, { n: 3 })), rgba('#a49ce6', 0.5), { clip: shape, blur: 0.12 });
  return shape;
}
// (one lash: from the lid at u, rising along the lid's outward normal tipped `tilt` toward the outer
// corner, curling further outward toward its round tip)
function lashStrand(lid, o, u, lift, len, tilt, curl, w0, col = LASH) {
  const N = lid.length;
  const i = Math.min(N - 1, Math.round((N - 1) * u));
  const { t, n } = lidFrame(lid, i, o);
  const b0 = [lid[i][0] + n[0] * lift, lid[i][1] + n[1] * lift];
  const d = [n[0] * Math.cos(tilt) + t[0] * Math.sin(tilt), n[1] * Math.cos(tilt) + t[1] * Math.sin(tilt)];
  const line = [b0, [b0[0] + d[0] * len * 0.55, b0[1] + d[1] * len * 0.55], [b0[0] + d[0] * len + t[0] * len * curl, b0[1] + d[1] * len + t[1] * len * curl]];
  add(poly(cr(ribbon(line, (q) => w0 * (1 - q) + 0.22, { n: 4 }), true, 2)), col, false);
}
// (the lower lid: its line from the outer corner inward over `span`, an optional pink waterline just
// above it, and little lashes at the given places, each leaning toward the outer corner)
function lowerLid(bot, o, { span = 0.6, a = 0.5, water = 0, lashes = [], col = rgba(LASH, 0.8) } = {}) {
  const N = bot.length;
  const seg = bot.slice(0, Math.max(2, Math.round(N * span)));
  if (water) lineOf(seg.map(([x, y]) => [x, y - 0.45]), rgba('#f7c3d4', water), 0.5);
  lineOf(seg, rgba(LID, a), 0.5);
  for (const [u, len] of lashes) {
    const i = Math.round((N - 1) * u);
    const { t } = lidFrame(bot, i, o);
    const nn = [o * t[1], -o * t[0]];
    const p0 = [bot[i][0] + nn[0] * 0.2, bot[i][1] + nn[1] * 0.2];
    const line = [p0, [p0[0] + nn[0] * len * 0.6 - t[0] * len * 0.15, p0[1] + nn[1] * len * 0.6 - t[1] * len * 0.15], [p0[0] + nn[0] * len - t[0] * len * 0.42, p0[1] + nn[1] * len - t[1] * len * 0.42]];
    add(poly(cr(ribbon(line, (q) => 0.4 * (1 - q) + 0.22, { n: 3 }), true, 2)), col, false);
  }
}
function drawLashes(lid, bot, inner, outer, o) {
  const L = LASH_LOOK;
  if (L === 'flutter') {
    lashBand(lid, inner, outer, o, (u) => 0.45 + 1.15 * smoothU(Math.min(1, u * 1.05)), [[0.8, 0.5], [1.3, 1.1]]);
    for (const [u, len, tilt] of [[0.62, 1.5, 0.8], [0.78, 1.9, 1.0], [0.93, 2.1, 1.2]]) lashStrand(lid, o, u, 0.6, len, tilt, 0.5, 0.95);
    lowerLid(bot, o, { span: 0.55, a: 0.5, lashes: [[0.1, 0.9], [0.26, 0.7]], col: rgba(LASH, 0.7) });
  } else if (L === 'doll') {
    lashBand(lid, inner, outer, o, (u) => 0.6 + 1.7 * smoothU(Math.min(1, u * 1.05)), [[0.9, 0.6], [1.6, 1.3], [1.5, 1.9]]);
    for (const [u, len, tilt] of [[0.74, 2.0, 0.9], [0.88, 2.4, 1.1], [0.98, 2.6, 1.3]]) lashStrand(lid, o, u, 0.9, len, tilt, 0.55, 1.05);
    lowerLid(bot, o, { span: 0.75, a: 0.45, water: 0.75, lashes: [[0.1, 0.85], [0.27, 0.75], [0.44, 0.6]], col: rgba(LASH, 0.6) });
  } else if (L === 'twilight') {
    lashBand(lid, inner, outer, o, (u) => 0.5 + 1.6 * smoothU(Math.min(1, u * 1.05)), [[1, 0.6], [1.8, 1.3], [2.2, 1.9], [2, 2.2], [1.4, 2.1], [0.7, 1.8]]);
    lashStrand(lid, o, 0.86, 1.3, 1.3, 1.0, 0.45, 0.7);
    lowerLid(bot, o, { span: 0.5, a: 0.6, water: 0.6, lashes: [[0.08, 0.85], [0.22, 0.65]], col: rgba(LASH, 0.7) });
  } else if (L === 'scholar') {
    lashBand(lid, inner, outer, o, (u) => 0.5 + 1.55 * smoothU(Math.min(1, u * 1.05)), [[1, 0.6], [1.9, 1.3], [1.6, 1.9]]);
    for (const [u, len, tilt] of [[0.8, 1.5, 0.95], [0.94, 1.8, 1.2]]) lashStrand(lid, o, u, 0.8, len, tilt, 0.5, 0.9);
    lowerLid(bot, o, { span: 0.7, a: 0.42, water: 0.7, lashes: [[0.12, 0.8], [0.28, 0.62]], col: rgba(LASH, 0.65) });
  } else if (L === 'soft') {
    lashBand(lid, inner, outer, o, (u) => 0.35 + 1.05 * smoothU(Math.min(1, u * 1.05)), [[1, 0.5], [1.7, 1.05], [1.4, 1.5]]);
    lowerLid(bot, o, { span: 0.7, a: 0.32, water: 0.6, lashes: [[0.12, 0.7], [0.26, 0.55]], col: rgba(LASH, 0.55) });
  } else if (L === 'wing') {
    lashBand(lid, inner, outer, o, (u) => 0.5 + 1.75 * smoothU(Math.min(1, u * 1.05)), [[1.2, 0.7], [2.6, 1.8], [4.0, 3.2], [3.9, 3.7], [2.6, 3.1], [1.1, 2.4]]);
    lashStrand(lid, o, 0.84, 1.4, 1.2, 0.95, 0.3, 0.55);
    lowerLid(bot, o, { span: 0.45, a: 0.75, lashes: [[0.06, 0.9], [0.2, 0.7]] });
  } else lash(lid, inner, outer, o);
}
// ---------- Her eyes redesigned (2026-11-24, the player: "can we redesign the eyes? To fit her look
// more now? Heavy draw") ----------
// Her look now: long soft lavender hair swept to one side, a pom-pom
// tail, the moon on everything: a gentle, bookish, moonlit girl. Three eyes drawn for her, each in
// full: the lid's soft colour and crease, the white shaded under the lid with a warm inner corner and
// a pink waterline, an iris built in layers (its gradient, the lid's shadow across its top, fine
// fibres of light, a ring of colour, a glow pooling low, a soft halo round the pupil), its own lights,
// its own lashes above and below, and a soft light on the cheek beneath the lower lid.
//  scholar: gentle, a little drooping at the outer corners; periwinkle blue with a pale ring; a
//           crescent moon for a light; soft natural lashes.
//  doe:     big and round; violet deepening to indigo, a few stars scattered low in the iris like a
//           night sky; a big round light and a twinkle; fluttering curled lashes.
//  twilight: almond, lifting softly at the corners; lilac above melting into a glow of aqua below;
//           a soft oval pupil, a heart-shaped light; a gentle wing.
// (2026-11-24, the player tried Dreamy twilight, then went back to her original eyes)
let EYE_STYLE = 'dryad';
const EYE_STYLES = { now: 'Original (hers)', scholar: 'Moonlit scholar', doe: 'Starry doe', twilight: 'Dreamy twilight' };
const EYE_D = {
  dryad: { s: 1.05, sh: 1.04, dl: 0.04, dlift: 0.03, ik: 1.04, lash: 'twilight', shadow: '#ebbca6', pal: { dk: '#1a3412', mid: '#357026', base: '#6fae3e', lt: '#e4d564', glow: '#fff4c4', pupil: '#12200c', ring: '#c6df74' } },
  scholar: { s: 1.06, sh: 1.02, dl: 0.06, dlift: -0.09, ik: 1.04, lash: 'scholar', shadow: '#c7b6f2', pal: { dk: '#15165a', mid: '#2c3aa6', base: '#4f72e2', lt: '#a6c6ff', glow: '#e4f1ff', pupil: '#0d0b38', ring: '#9fbcff' } },
  doe: { s: 1.1, sh: 1.12, dl: -0.05, dlift: -0.02, ik: 1.07, lash: 'flutter', shadow: '#e5b8d9', pal: { dk: '#22145a', mid: '#4a33a6', base: '#7b64df', lt: '#cbbbff', glow: '#f4eeff', pupil: '#140b37', ring: '#b8a7ff' } },
  twilight: { s: 1.06, sh: 1.02, dl: 0.03, dlift: 0.08, ik: 1.02, lash: 'twilight', shadow: '#efb6d0', pal: { dk: '#1f1260', mid: '#5238b8', base: '#8a70e6', lt: '#86dcec', glow: '#e0faff', pupil: '#140c3a', ring: '#cdbaff' } },
};
function eyeDesign(x, y, w0, h0, o, mood, D) {
  const b0 = mood && typeof mood === 'object' ? mood : (EYE_SPEC[mood] ?? EYE_SPEC.idle);
  const sp = { ...b0, lid: b0.lid + D.dl, lift: b0.lift + D.dlift };
  const w = w0 * D.s;
  const h = h0 * D.sh;
  const P = D.pal;
  const { inner, outer, top, bot } = eyeGeom(x, y, w, h, o, sp);
  const topC = cr(top, false, 8);
  const botC = cr(bot, false, 8);
  const N = topC.length;
  const nrm = (i) => lidFrame(topC, i, o).n;
  // the lid: a soft wash of colour above the lash, deepest toward the outer corner, and its crease
  const wash = [];
  for (let i = 2; i < N; i++) {
    const n = nrm(i);
    const u = i / (N - 1);
    wash.push([topC[i][0] + n[0] * (1.4 + 1.2 * u), topC[i][1] + n[1] * (1.4 + 1.2 * u)]);
  }
  detail(poly(ribbon(wash, (u) => 1.2 + 2.4 * u, { n: 2 })), lin(inner[0], inner[1], outer[0], outer[1], [[0, rgba(D.shadow, 0.05)], [0.6, rgba(D.shadow, 0.35)], [1, rgba(D.shadow, 0.55)]]), { clip: HEAD, blur: 0.9 });
  const crease = [];
  for (let i = Math.round(N * 0.28); i < N - 1; i++) {
    const n = nrm(i);
    const u = i / (N - 1);
    crease.push([topC[i][0] + n[0] * (2.6 + 0.9 * u), topC[i][1] + n[1] * (2.6 + 0.9 * u)]);
  }
  detail(poly(ribbon(crease, (u) => 0.42 * Math.sin(Math.PI * u) + 0.05, { n: 2 })), rgba(LID, 0.5), { clip: HEAD, blur: 0.1 });
  // the white: cool under the lid, a warm inner corner, soft shade along the bottom
  const white = poly([...topC, ...botC.slice(1, -1)]);
  detail(white, lin(x, y - h * 0.45, x, y + h * 0.45, [[0, '#e2ddf5'], [0.45, '#fbfaff'], [1, '#ffffff']]));
  detail(ell(inner[0] + o * 0.9, inner[1] - 0.2, 1.5, 1.2), rgba('#f2b0c2', 0.75), { clip: white, blur: 0.2 });
  detail(poly(ribbon(botC.slice(1, -1), (u) => 0.9 * Math.sin(Math.PI * u) + 0.1, { n: 2 })), rgba('#d9d2f0', 0.6), { clip: white, blur: 0.3 });
  // the iris
  const ix = x + o * w * 0.04 + (sp.look?.[0] ?? 0) * w;
  const iy = y + h * 0.05 + (sp.look?.[1] ?? 0) * h;
  const ik = (sp.ik ?? 1) * D.ik;
  const irx = w * 0.41 * ik;
  const iry = h * 0.51 * ik;
  const iris = ell(ix, iy, irx, iry);
  const C = [white, iris];
  const st = EYE_STYLE;
  if (st === 'twilight') detail(iris, lin(ix, iy - iry, ix, iy + iry, [[0, P.dk], [0.3, P.mid], [0.62, P.base], [1, P.lt]]), { clip: white });
  else detail(iris, rad(ix, iy + iry * 0.38, iry * 1.15, [[0, P.lt], [0.34, P.base], [0.7, P.mid], [1, P.dk]]), { clip: white });
  // (the lid's shadow across its top)
  detail(iris, lin(ix, iy - iry, ix, iy + iry, [[0, rgba(P.dk, 0.95)], [0.36, rgba(P.dk, 0.55)], [0.6, rgba(P.dk, 0)]]), { clip: white });
  // (fine fibres of light from the pupil out through the lower iris)
  for (let k = 0; k < 15; k++) {
    const q = Math.PI * 0.05 + (k / 14) * Math.PI * 0.9;
    const r1 = k % 2 ? 0.8 : 0.9;
    detail(poly(ribbon([[ix + Math.cos(q) * irx * 0.34, iy + Math.sin(q) * iry * 0.34], [ix + Math.cos(q) * irx * r1, iy + Math.sin(q) * iry * r1]], (u) => 0.36 * (1 - u) + 0.1, { n: 2 })), rgba(P.glow, 0.32), { clip: C });
  }
  // (a ring of paler colour inside the rim)
  items.push({ path: ell(ix, iy + iry * 0.03, irx * 0.72, iry * 0.72), line: false, strokeOnly: rgba(P.ring, st === 'doe' ? 0.3 : 0.5), slw: 0.5, clip: white, m: XF });
  // (the glow pooling low)
  const band = new Path2D();
  band.ellipse(ix, iy + iry * 0.2, irx * 0.82, iry * 0.74, 0, Math.PI * 0.1, Math.PI * 0.9);
  band.ellipse(ix, iy + iry * 0.04, irx * 0.78, iry * 0.62, 0, Math.PI * 0.88, Math.PI * 0.12, true);
  band.closePath();
  detail(band, lin(ix, iy + iry * 0.3, ix, iy + iry * 0.92, [[0, rgba(P.lt, 0.2)], [1, rgba(P.glow, 0.85)]]), { clip: C, blur: 0.25 });
  if (st === 'doe') {
    // (a night sky low in the iris: a scatter of tiny stars)
    for (const [dx, dy, r, a] of [[-0.42, 0.42, 0.22, 0.85], [-0.18, 0.62, 0.16, 0.75], [0.12, 0.7, 0.2, 0.8], [0.38, 0.5, 0.14, 0.7], [0.5, 0.22, 0.18, 0.75], [-0.55, 0.1, 0.13, 0.6], [0.02, 0.48, 0.12, 0.6], [0.28, 0.66, 0.11, 0.55]]) detail(ell(ix + dx * irx, iy + dy * iry, r, r), rgba('#ffffff', a), { clip: C });
    star4(ix - irx * 0.3, iy + iry * 0.55, w * 0.06, 'rgba(255,255,255,0.9)', 0.3);
  }
  // (the rim)
  items.push({ path: iris, line: false, strokeOnly: rgba(P.dk, 0.8), slw: 0.6, clip: white, m: XF });
  // the pupil and its soft halo
  if (st === 'twilight') {
    detail(ell(ix, iy + iry * 0.02, w * 0.12, h * 0.25), rgba(P.dk, 0.35), { clip: white, blur: 0.2 });
    detail(ell(ix, iy + iry * 0.02, w * 0.08, h * 0.19), P.pupil, { clip: white });
  } else {
    const pr = st === 'doe' ? 0.17 : 0.14;
    detail(ell(ix, iy + iry * 0.02, w * (pr + 0.05), h * (pr + 0.11)), rgba(P.dk, 0.38), { clip: white, blur: 0.2 });
    detail(ell(ix, iy + iry * 0.02, w * pr, h * (pr + 0.07)), P.pupil, { clip: white });
  }
  // the lid's shadow across the top of the eye
  detail(poly(ribbon(top, (u) => h * 0.24 * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.05)) + 0.4, { n: 8, caps: false })), rgba(HR.sh2, 0.45), { clip: white });
  // the lights
  const W = (k) => w * k;
  if (st === 'scholar') {
    const cx = ix + o * W(0.13);
    const cy = iy - iry * 0.1;
    const cres = new Path2D();
    cres.arc(cx, cy, W(0.14), Math.PI * 0.55, Math.PI * 1.95);
    cres.arc(cx + W(0.065), cy - W(0.035), W(0.11), Math.PI * 1.8, Math.PI * 0.7, true);
    cres.closePath();
    detail(cres, '#ffffff', { clip: white });
    detail(ell(ix - o * W(0.15), iy + iry * 0.34, W(0.06), W(0.055)), 'rgba(255,255,255,0.95)', { clip: white });
    detail(ell(ix + o * W(0.22), iy + iry * 0.24, W(0.028), W(0.028)), 'rgba(255,255,255,0.85)', { clip: white });
  } else if (st === 'doe') {
    detail(ell(ix + o * W(0.12), iy - iry * 0.3, W(0.15), W(0.13)), '#ffffff', { clip: white });
    star4(ix + o * W(0.25), iy - iry * 0.05, W(0.1), 'rgba(255,255,255,0.95)');
    detail(ell(ix - o * W(0.16), iy + iry * 0.34, W(0.06), W(0.055)), 'rgba(255,255,255,0.95)', { clip: white });
  } else if (st === 'dryad') {
    // (her own lights: a soft oval of sun high in the iris, a small leaf of light low, a dot)
    detail(ell(ix + o * W(0.12), iy - iry * 0.32, W(0.14), W(0.1), -0.45 * o), 'rgba(255,255,255,0.95)', { clip: white });
    const lx = ix - o * W(0.15);
    const ly = iy + iry * 0.36;
    detail(smooth([[lx - W(0.09), ly + W(0.03)], [lx - W(0.02), ly - W(0.05)], [lx + W(0.09), ly - W(0.04)], [lx + W(0.02), ly + W(0.05)]], 3), 'rgba(255,255,255,0.92)', { clip: white });
    detail(ell(ix + o * W(0.22), iy + iry * 0.28, W(0.03), W(0.03)), 'rgba(255,255,255,0.85)', { clip: white });
  } else {
    detail(ell(ix + o * W(0.12), iy - iry * 0.3, W(0.13), W(0.09), -0.5 * o), 'rgba(255,255,255,0.95)', { clip: white });
    detail(heartShape(ix - o * W(0.15), iy + iry * 0.34, W(0.08)), '#ffffff', { clip: white });
    star4(ix + o * W(0.22), iy + iry * 0.3, W(0.06), 'rgba(255,255,255,0.9)');
  }
  // a soft light on the cheek under the lower lid
  const lowMid = botC[Math.round(botC.length * 0.45)];
  detail(ell(lowMid[0], lowMid[1] + 1.6, w * 0.3, 0.9), rgba('#ffffff', 0.3), { clip: HEAD, blur: 0.6 });
  // the lashes
  const keep = LASH_LOOK;
  LASH_LOOK = D.lash;
  drawLashes(topC, botC, inner, outer, o);
  LASH_LOOK = keep;
}
// (the lash along a lid line from the inner corner to the outer; o: which way is outward)
function lash(lid, inner, outer, o) {
  const N = lid.length;
  const thick = (u) => 0.5 + 2.15 * smoothU(Math.min(1, u * 1.04));
  // (the outward normal and the outward tangent along the lid)
  const frame = (i) => {
    const a = lid[Math.max(0, i - 1)];
    const b = lid[Math.min(N - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const t = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    return { t, n: [o * t[1], -o * t[0]] };
  };
  const topAt = (i) => {
    const { n } = frame(i);
    const u = i / (N - 1);
    return [lid[i][0] + n[0] * thick(u), lid[i][1] + n[1] * thick(u)];
  };
  // (a soft flick from the top edge at lid point i: tilted outward, round-tipped)
  const flick = (i, len, tilt) => {
    const { t, n } = frame(i);
    const base = topAt(i);
    const d = [n[0] * Math.cos(tilt) + t[0] * Math.sin(tilt), n[1] * Math.cos(tilt) + t[1] * Math.sin(tilt)];
    const pp = [-d[1], d[0]];
    const tip = [base[0] + d[0] * len, base[1] + d[1] * len];
    const r = 0.34;
    return [
      [tip[0] - d[0] * 0.45 + pp[0] * r * o, tip[1] - d[1] * 0.45 + pp[1] * r * o],
      tip,
      [tip[0] - d[0] * 0.45 - pp[0] * r * o, tip[1] - d[1] * 0.45 - pp[1] * r * o],
    ];
  };
  // (the wing past the outer corner: its underside, its round tip, its top running back into the lash)
  const { t: tw } = frame(N - 1);
  const W = (a, b) => [outer[0] + tw[0] * a + o * 0 + 0, outer[1] + tw[1] * a - b];
  const wing = [W(0.9, 0.55), W(1.7, 1.2), W(2.25, 1.85), W(2.2, 2.3), W(1.6, 2.55), W(0.7, 2.75)];
  const f1 = Math.round((N - 1) * 0.7);
  const f2 = Math.round((N - 1) * 0.88);
  const top = [];
  for (let i = N - 2; i >= 1; i--) {
    if (i === f2) top.push(...flick(i, 1.25, 1.1));
    else if (i === f1) top.push(...flick(i, 1.0, 0.95));
    else if (Math.abs(i - f2) <= 1 || Math.abs(i - f1) <= 1) continue;
    else top.push(topAt(i));
  }
  const outline = [...lid, ...wing, ...top];
  const shape = poly(cr(outline, true, 3));
  add(shape, lin(inner[0], inner[1], outer[0], outer[1], [[0, mixHex(LASH, EY.mid, 0.4)], [0.4, LASH], [1, LASH]]), false);
  // a soft sheen along its middle
  const sheen = [];
  for (let i = Math.round(N * 0.22); i <= Math.round(N * 0.8); i += 2) {
    const { n } = frame(i);
    const u = i / (N - 1);
    sheen.push([lid[i][0] + n[0] * thick(u) * 0.58, lid[i][1] + n[1] * thick(u) * 0.58]);
  }
  detail(poly(ribbon(sheen, (u) => 0.55 * Math.sin(Math.PI * u) + 0.05, { n: 3 })), rgba('#a49ce6', 0.55), { clip: shape, blur: 0.12 });
  return shape;
}
// Eyes closed: happy, a soft ∩ with its lashes curling up and the cheek pushing up beneath; a blink,
// a soft ∪ with its lashes down.
function closedEye(x, y, w, h, o, mood) {
  // (one smooth stroke: thin at the inner corner, full through the middle, easing out into a little
  // curled tail at the outer corner, round at both ends)
  const up = mood === 'happy';
  const line = up
    ? [[x - o * w * 0.5, y + h * 0.16], [x - o * w * 0.16, y - h * 0.12], [x + o * w * 0.26, y - h * 0.1], [x + o * w * 0.54, y + h * 0.12], [x + o * w * 0.68, y + h * 0.1]]
    : [[x - o * w * 0.5, y + h * 0.06], [x - o * w * 0.12, y + h * 0.3], [x + o * w * 0.3, y + h * 0.26], [x + o * w * 0.56, y - h * 0.02], [x + o * w * 0.68, y - h * 0.12]];
  const wd = (u) => (u < 0.72 ? lerp(0.7, 1.95, smoothU(u / 0.72)) : lerp(1.95, 0.75, smoothU((u - 0.72) / 0.28)));
  add(poly(cr(ribbon(line, wd, { n: 10 }), true, 2)), LASH, false);
}
// Her expressions (2026-11-23, the player: "give her multiple expressions, I will choose one"): eyes
// (one kind for both, or [far, near]), mouth, blush, and the touches some have.
const EXPR = {
  // (2026-11-23, the player: "make her default face emotionless": calm open eyes with level lids, a
  // small flat mouth, lighter blush; her old calm smile is kept as Serene)
  idle: { name: 'Emotionless (default)', eyes: 'neutral', mouth: 'flat', blush: 0.36 },
  serene: { name: 'Serene', eyes: 'serene', mouth: 'rest', blush: 0.58 },
  blink: { name: 'Blink', eyes: 'blink', mouth: 'flat', blush: 0.36, hide: true },
  smile: { name: 'Gentle smile', eyes: 'smile', mouth: 'smile', blush: 0.66 },
  peaceful: { name: 'Peaceful', eyes: 'blink', mouth: 'smile', blush: 0.62 },
  happy: { name: 'Happy', eyes: 'happy', mouth: 'happy', blush: 0.8 },
  starry: { name: 'Starry-eyed', eyes: 'starry', mouth: 'grin', blush: 0.78 },
  wonder: { name: 'Wonder', eyes: 'wonder', mouth: 'wonder', blush: 0.58 },
  dreamy: { name: 'Dreamy', eyes: 'dreamy', mouth: 'smile', blush: 0.8 },
  shy: { name: 'Shy', eyes: 'shy', mouth: 'wavy', blush: 1, lines: 5 },
  pout: { name: 'Pout', eyes: 'pout', mouth: 'pout', blush: 0.8, puff: true },
  wink: { name: 'Wink', eyes: ['smile', 'happy'], mouth: 'tongue', blush: 0.72 },
  smug: { name: 'Smug', eyes: 'smug', mouth: 'smirk', blush: 0.45 },
  teary: { name: 'Teary', eyes: 'teary', mouth: 'frown', blush: 0.66, tear: true },
};
// A tear: a soft round drop, pale blue, with a shine.
function tear(x, y) {
  const d = smooth([[x, y - 2.1], [x + 0.75, y - 0.9], [x + 1.25, y + 0.35], [x + 0.95, y + 1.25], [x, y + 1.6], [x - 0.95, y + 1.25], [x - 1.25, y + 0.35], [x - 0.75, y - 0.9]], 4);
  detail(d, lin(x, y - 2, x, y + 1.6, [[0, rgba('#eef7ff', 0.95)], [1, rgba('#a9cdf3', 0.95)]]), { stroke: rgba('#7fa3d6', 0.8), slw: 0.35 });
  detail(ell(x - 0.4, y + 0.1, 0.35, 0.5), '#ffffff');
}
function face(mood = 'idle') {
  const ex = mood && typeof mood === 'object' ? mood : (EXPR[mood] ?? { eyes: mood, mouth: mood, blush: mood === 'happy' ? 0.8 : 0.58 });
  glow(HEAD, HX + 7, HY - 4, 22, SK.hi, 0.6);
  // (2026-11-23, "shade it a bit": soft shade where her side locks frame her face, a gentle shade along
  // the jaw and under the chin, a little warmth in the cheeks)
  for (const sd of [-1, 1]) {
    const ex0 = HX + 1 + sd * 15.4;
    detail(poly(ribbon([[ex0, HY - 2], [ex0 + sd * 0.2, HY + 8], [ex0 - sd * 0.8, HY + 16], [ex0 - sd * 3, HY + 21]], (u) => 3.6 * Math.sin(Math.PI * Math.min(1, u * 1.2 + 0.1)) + 0.4, { n: 6 })), rgba(SK.sh1, sd < 0 ? 0.6 : 0.45), { clip: HEAD, blur: 1 });
  }
  detail(poly(ribbon([[HX - 10, HY + 21.2], [HX + 1, HY + 24.6], [HX + 12, HY + 21.2]], (u) => 2.4 * Math.sin(Math.PI * u) + 0.3, { n: 6 })), rgba(SK.sh1, 0.5), { clip: HEAD, blur: 0.8 });
  for (const [bx] of [[HX + 12.2], [HX - 10.4]]) detail(ell(bx, HY + 13.6, 7, 4.6), rgba('#ffd9cf', 0.3), { clip: HEAD, blur: 1.4 });
  // (2026-11-23, "shade and polish the head": the far side in a soft shadow shape that follows her
  // temple, cheek and jaw round to her chin, deeper right at the edge; a soft light high on the near
  // cheekbone; a touch of pink on the tip of her nose and on her chin)
  const farShade = smooth([[HX - 15.6, HY - 4], [HX - 14.8, HY + 5], [HX - 13.6, HY + 12], [HX - 10.6, HY + 18], [HX - 5.6, HY + 22.4], [HX + 0.4, HY + 24.2], [HX - 6, HY + 30], [HX - 30, HY + 20], [HX - 30, HY - 6]], 4);
  detail(farShade, rgba(SK.sh1, 0.55), { clip: HEAD, blur: 0.5 });
  detail(poly(ribbon([[HX - 21.4, HY - 4], [HX - 20.8, HY + 6], [HX - 18, HY + 14], [HX - 12, HY + 20.6], [HX - 4, HY + 24.2]], (u) => 3 * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.08)) + 0.4, { n: 6 })), rgba(SK.sh2, 0.32), { clip: HEAD, blur: 0.8 });
  detail(ell(HX + 11.6, HY + 10.4, 3.8, 2.4), rgba('#ffffff', 0.38), { clip: HEAD, blur: 0.9 });
  const blush = ex.blush;
  const nl = ex.lines ?? 3;
  for (const [bx, o] of [[HX + 11.6, 1], [HX - 9.8, -1]]) {
    const big = ex.puff && o > 0 ? 1.25 : 1;
    // (2026-11-23, "polish the blush": a wide soft peachy flush, a rosier heart inside it, neat curved
    // strokes with soft tapered ends, a tiny gloss of light high on the cheek)
    detail(ell(bx, HY + 15.2, 5.6 * big, 2.9 * big), rgba('#f8b8c6', blush * 0.8), { clip: HEAD, blur: 1.1 });
    detail(ell(bx + o * 0.2, HY + 15.2, 3.4 * big, 1.7 * big), rgba(SK.blush, blush * 0.95), { clip: HEAD, blur: 0.7 });
    for (let k = 0; k < nl; k++) {
      const kx = (k - (nl - 1) / 2) * (nl > 3 ? 1.2 : 1.45);
      const len = k === Math.floor(nl / 2) ? 1 : 0.85;
      detail(poly(cr(ribbon([[bx + kx - 0.55 * len, HY + 16.1 * 1 - 0 + (1 - len)], [bx + kx - 0.05, HY + 15.1], [bx + kx + 0.6 * len, HY + 14.1 + (1 - len) * 0.5]], (u) => 0.42 * Math.sin(Math.PI * u) + 0.06, { n: 3 }), true, 2)), rgba('#d9718f', 0.55), { clip: HEAD, blur: 0.05 });
    }
    detail(ell(bx - o * 0.4, HY + 14, 0.7, 0.42), rgba('#ffffff', 0.8), { clip: HEAD, blur: 0.12 });
    // (a puffed cheek: round, with a soft light on its curve)
    if (ex.puff && o > 0) detail(poly(ribbon([[bx - 2.6, HY + 12.4], [bx, HY + 11.6], [bx + 2.4, HY + 12.6]], (u) => 0.9 * Math.sin(Math.PI * u), { n: 5 })), rgba('#ffffff', 0.7), { clip: HEAD, blur: 0.2 });
  }
  const ek = Array.isArray(ex.eyes) ? ex.eyes : [ex.eyes, ex.eyes];
  EYES.forEach(([exx, o], i) => eye(exx, EYE_Y, EYE_W, EYE_H, o, ek[i]));
  // (a tear: welling up, it grows from nothing at the eye's corner)
  const tk = ex.tear === true ? 1 : +ex.tear || 0;
  if (tk > 0.04) withXF(new DOMMatrix().translate(HX - 11.4, EYE_Y + 3).scale(tk).translate(-(HX - 11.4), -(EYE_Y + 3)), () => tear(HX - 11.4, EYE_Y + 5.2 + (1 - tk) * -1));
  nose();
  mouth(ex.mouth);
  detail(poly(ribbon([[HX + 20.2, HY + 6], [HX + 18.4, HY + 13.4], [HX + 15, HY + 17.6], [HX + 10.6, HY + 20.8]], (u) => 2 * Math.sin(Math.PI * u) + 0.3, { n: 6 })), rgba(SK.sh2, 0.45), { clip: HEAD, blur: 0.6 });
  // (a soft light on the chin's tip)
  detail(ell(HX + 1.2, HY + 23.2, 2.8, 1.2), rgba(SK.blush, 0.2), { clip: HEAD, blur: 0.6 });
  detail(ell(HX + 1.6, HY + 22.4, 2.2, 1), rgba('#ffffff', 0.4), { clip: HEAD, blur: 0.5 });
  fringeShade();
  brows(mood);
}
// Her nose (reworked 2026-11-23, the player: "brows, mouth, nose shape rework"): small and soft,
// lit from the upper right: a soft shade on its shaded side curling under the tip, a little light on
// the tip. Styles: soft shade (hers), a fine line, a button.
const NOSE_STYLES = { soft: 'Soft shade', line: 'Fine line', button: 'Button' };
let NOSE_STYLE = 'soft';
function nose() {
  const nx = HX + 1.5;
  const ny = HY + 13.7;
  if (NOSE_STYLE === 'line') {
    detail(poly(cr(ribbon([[nx - 0.7, ny - 1.1], [nx - 0.3, ny + 0.15], [nx + 0.7, ny + 0.4]], (u) => 0.12 + 0.5 * Math.sin(Math.PI * u), { n: 4 }), true, 2)), rgba(SK.sh2, 0.95));
  } else if (NOSE_STYLE === 'button') {
    detail(ell(nx - 0.1, ny + 0.35, 1.05, 0.48), rgba(SK.sh2, 0.6), { blur: 0.22 });
  } else {
    detail(smooth([[nx - 0.95, ny - 1.6], [nx - 0.35, ny - 0.35], [nx + 0.95, ny + 0.3], [nx - 0.3, ny + 0.62], [nx - 1.15, ny - 0.2]], 3), rgba(SK.sh2, 0.8), { blur: 0.22 });
  }
  detail(ell(nx + 0.2, ny + 0.1, 1.3, 0.85), rgba(SK.blush, 0.3), { blur: 0.4 });
  detail(ell(nx + 0.45, ny - 0.75, 0.5, 0.38), rgba('#ffffff', 0.9), { blur: 0.08 });
}
// Her mouth (reworked 2026-11-23), on her face's centre line: one smooth stroke, full in the middle,
// its corners curling softly up as part of the same stroke (no separate dimple marks), a soft rosy
// lower lip with a little shine, a faint shade beneath. Open mouths: a soft round bowl under the
// smile line, deep rose inside, a tongue, the lip line's corners curling up. Rest styles: soft smile
// (hers), petite, rosy lips.
const MOUTH_STYLES = { soft: 'Soft smile', petite: 'Petite', lips: 'Rosy lips' };
let MOUTH_STYLE = 'lips';
function mouthStroke(line, wmax) {
  detail(poly(cr(ribbon(line, (u) => 0.28 + wmax * Math.sin(Math.PI * u) ** 1.2, { n: 8 }), true, 2)), lin(line[0][0], 0, line[line.length - 1][0], 0, [[0, rgba(SK.lipDk, 0.8)], [0.5, SK.lipDk], [1, rgba(SK.lipDk, 0.8)]]));
}
function lowerLip(cx, cy, rx, a) {
  detail(ell(cx, cy, rx, rx * 0.42), rad(cx, cy, rx, [[0, rgba(SK.lip, a)], [1, rgba(SK.lip, 0)]]), { blur: 0.2 });
  detail(ell(cx + rx * 0.3, cy - rx * 0.08, rx * 0.26, rx * 0.1), rgba('#ffffff', 0.75), { blur: 0.05 });
}
const MOUTH_LINES = {
  rest: [[-3, -0.95], [-2.5, -0.25], [-1.3, 0.45], [0, 0.72], [1.4, 0.4], [2.6, -0.4], [3.05, -1.15]],
  smile: [[-3.3, -1.45], [-2.8, -0.55], [-1.5, 0.35], [0, 0.78], [1.6, 0.32], [2.9, -0.7], [3.35, -1.6]],
  tongue: [[-3.1, -1.2], [-2.6, -0.4], [-1.4, 0.38], [0, 0.66], [1.5, 0.4], [2.8, -0.55], [3.25, -1.35]],
  smirk: [[-2.4, 0.15], [-1.2, 0.45], [0.2, 0.42], [1.5, 0.05], [2.6, -0.75], [3, -1.55]],
  wavy: [[-2, 0.2], [-1, -0.3], [0, 0.15], [1, 0.45], [1.9, -0.05]],
  flat: [[-1.7, 0.3], [-0.8, 0.38], [0.2, 0.4], [1.1, 0.36], [1.8, 0.28]],
  frown: [[-2.4, 0.8], [-1.2, 0], [0.1, -0.2], [1.3, 0.05], [2.4, 0.8]],
};
const THIN_MOUTH = { wavy: 1, frown: 1, flat: 1 };
// (a closed mouth's line resampled to 9 points, so any two can be blended)
const mouthPts = (name) => {
  const c = cr(MOUTH_LINES[name] ?? MOUTH_LINES.rest, false, 8);
  return Array.from({ length: 9 }, (_, i) => c[Math.round((i / 8) * (c.length - 1))]);
};
function mouth(mood) {
  if (mood && typeof mood === 'object') return mouthLive(mood);
  const mx = HX + 1.2;
  const my = HY + 18.2;
  const TONGUE = '#f2899f';
  const inside = (y0, y1) => lin(mx, y0, mx, y1, [[0, '#7a2a4a'], [1, '#ad4563']]);
  const openMouth = (w, open, teeth) => {
    const topE = [[mx - w, my - 0.5], [mx - w * 0.5, my + 0.12], [mx, my + 0.25], [mx + w * 0.5, my + 0.1], [mx + w, my - 0.62]];
    const bowl = [[mx + w * 0.74, my + open * 0.6], [mx + w * 0.3, my + open * 0.98], [mx - w * 0.3, my + open * 0.98], [mx - w * 0.74, my + open * 0.6]];
    const shape = poly(cr([...topE, ...bowl], true, 6));
    add(shape, inside(my, my + open), false);
    detail(ell(mx + 0.15, my + open * 0.95, w * 0.56, open * 0.42), TONGUE, { clip: shape, blur: 0.12 });
    detail(ell(mx + 0.55, my + open * 0.8, w * 0.17, open * 0.11), rgba('#ffffff', 0.45), { clip: shape, blur: 0.08 });
    if (teeth) detail(ell(mx, my - 0.1, w * 0.84, 0.66), '#ffffff', { clip: shape });
    lineOf(cr([topE[4], ...bowl, topE[0]], false, 6), rgba(SK.lipDk, 0.55), 0.35);
    mouthStroke([[mx - w - 0.6, my - 1.1], [mx - w, my - 0.5], [mx - w * 0.5, my + 0.12], [mx, my + 0.25], [mx + w * 0.5, my + 0.1], [mx + w, my - 0.62], [mx + w + 0.6, my - 1.25]], 0.32);
    lowerLip(mx + 0.1, my + open + 0.55, w * 0.45, 0.32);
  };
  if (mood === 'happy') return openMouth(3, 2.7, false);
  if (typeof mood === 'string' && mood.startsWith('happyOpen')) {
    const k = Math.min(1, +mood.slice(9));
    return openMouth(lerp(2.2, 3, k), lerp(0.5, 2.7, k), false);
  }
  if (mood === 'grin') return openMouth(2.7, 2.2, true);
  if (mood === 'wonder') {
    // a small soft round "o", a touch wider low
    const o = smooth([[mx, my - 0.55], [mx + 1.15, my + 0.15], [mx + 1.3, my + 1.4], [mx + 0.7, my + 2.35], [mx, my + 2.55], [mx - 0.7, my + 2.35], [mx - 1.3, my + 1.4], [mx - 1.15, my + 0.15]], 4);
    add(o, inside(my - 0.5, my + 2.5), false);
    detail(ell(mx, my + 2.0, 0.9, 0.55), TONGUE, { clip: o, blur: 0.1 });
    items.push({ path: o, line: false, strokeOnly: rgba(SK.lipDk, 0.75), slw: 0.4, m: XF });
    lowerLip(mx, my + 3.05, 1.05, 0.3);
    return;
  }
  if (mood === 'pout') {
    // lips pursed: small and round, pushed a little to one side, a shine on the lower lip
    const px = mx + 0.5;
    const lips = smooth([[px - 1.4, my + 0.6], [px - 0.8, my - 0.2], [px, my - 0.05], [px + 0.8, my - 0.2], [px + 1.4, my + 0.6], [px + 0.9, my + 1.6], [px, my + 1.85], [px - 0.9, my + 1.6]], 4);
    detail(lips, lin(px, my - 0.2, px, my + 1.9, [[0, rgba(SK.lipDk, 0.75)], [1, rgba(SK.lip, 0.95)]]));
    lineOf(cr([[px - 0.9, my + 0.75], [px, my + 0.95], [px + 0.9, my + 0.75]], false, 4), SK.lipDk, 0.5);
    detail(ell(px + 0.35, my + 1.35, 0.4, 0.18), rgba('#ffffff', 0.8));
    detail(ell(px, my + 2.7, 1.1, 0.3), rgba(SK.sh1, 0.4), { blur: 0.15 });
    return;
  }
  if (mood === 'tongue') {
    // a playful smile with the tip of her tongue showing at one side
    const t = smooth([[mx + 0.5, my + 0.3], [mx + 2, my + 0.15], [mx + 1.95, my + 1.15], [mx + 1.25, my + 1.6], [mx + 0.6, my + 1.15]], 4);
    detail(t, lin(mx + 1.2, my + 0.2, mx + 1.2, my + 1.6, [[0, '#e0718a'], [1, TONGUE]]), { stroke: rgba(SK.lipDk, 0.45), slw: 0.3 });
    lineOf([[mx + 1.25, my + 0.55], [mx + 1.28, my + 1.1]], rgba('#c4566f', 0.45), 0.3);
    detail(ell(mx + 1.55, my + 0.95, 0.25, 0.17), rgba('#ffffff', 0.6));
  }
  // the closed mouths: one smooth stroke each, its ends curling as part of it
  const LINES = MOUTH_LINES;
  const _unused = {
    rest: [[-3, -0.95], [-2.5, -0.25], [-1.3, 0.45], [0, 0.72], [1.4, 0.4], [2.6, -0.4], [3.05, -1.15]],
    smile: [[-3.3, -1.45], [-2.8, -0.55], [-1.5, 0.35], [0, 0.78], [1.6, 0.32], [2.9, -0.7], [3.35, -1.6]],
    tongue: [[-3.1, -1.2], [-2.6, -0.4], [-1.4, 0.38], [0, 0.66], [1.5, 0.4], [2.8, -0.55], [3.25, -1.35]],
    smirk: [[-2.4, 0.15], [-1.2, 0.45], [0.2, 0.42], [1.5, 0.05], [2.6, -0.75], [3, -1.55]],
    wavy: [[-2, 0.2], [-1, -0.3], [0, 0.15], [1, 0.45], [1.9, -0.05]],
    flat: [[-1.7, 0.3], [-0.8, 0.38], [0.2, 0.4], [1.1, 0.36], [1.8, 0.28]],
    frown: [[-2.4, 0.8], [-1.2, 0], [0.1, -0.2], [1.3, 0.05], [2.4, 0.8]],
  };
  const key = LINES[mood] ? mood : 'rest';
  const pet = MOUTH_STYLE === 'petite' && (key === 'rest' || key === 'smile');
  const line = LINES[key].map(([dx, dy]) => [mx + dx * (pet ? 0.74 : 1), my + dy * (pet ? 1.12 : 1)]);
  const thin = key === 'wavy' || key === 'frown' || key === 'flat';
  if (MOUTH_STYLE === 'lips' && (key === 'rest' || key === 'smile')) {
    // a soft rosy lower lip, shaped
    // (a soft rosy lower lip: shallow, close under the line, fading low, so it never reads as a tongue)
    const lip = smooth([[mx - 1.7, my + 0.85], [mx, my + 1.05], [mx + 1.7, my + 0.8], [mx + 1.0, my + 1.6], [mx, my + 1.78], [mx - 1.0, my + 1.6]], 4);
    detail(lip, lin(mx, my + 0.85, mx, my + 1.8, [[0, rgba(mixHex(SK.lip, SK.base, 0.25), 0.6)], [1, rgba(mixHex(SK.lip, SK.base, 0.45), 0.15)]]), { blur: 0.18 });
    detail(ell(mx + 0.5, my + 1.28, 0.5, 0.15), rgba('#ffffff', 0.75), { blur: 0.05 });
  }
  mouthStroke(line, thin ? 0.38 : 0.55);
  if (!(MOUTH_STYLE === 'lips' && (key === 'rest' || key === 'smile'))) lowerLip(mx + 0.1, my + (thin ? 1.5 : 1.75), thin ? 1.3 : 1.6, thin ? 0.35 : 0.48);
  detail(ell(mx, my + 3.1, 1.25, 0.32), rgba(SK.sh1, 0.42), { blur: 0.2 });
}
// Her mouth, live: its closed line blended between shapes, opening into a smile, rounding into an "o",
// pursing into a pout, or showing the tip of her tongue, each growing in from nothing.
function mouthLive(M) {
  const mx = HX + 1.2;
  const my = HY + 18.2;
  if (M.open > 0.03) return mouth('happyOpen' + M.open);
  if (M.o > 0.03) {
    const k = Math.min(1, 0.35 + M.o * 0.65);
    return withXF(new DOMMatrix().translate(mx, my + 1).scale(k).translate(-mx, -(my + 1)), () => mouth('wonder'));
  }
  if (M.pout > 0.5) {
    const k = Math.min(1, (M.pout - 0.5) * 2 * 0.6 + 0.4);
    return withXF(new DOMMatrix().translate(mx + 0.5, my + 0.8).scale(k).translate(-(mx + 0.5), -(my + 0.8)), () => mouth('pout'));
  }
  if (M.tongue > 0.05) {
    const k = Math.min(1, M.tongue);
    withXF(new DOMMatrix().translate(mx + 1.2, my + 0.3).scale(k).translate(-(mx + 1.2), -(my + 0.3)), () => {
      const t = smooth([[mx + 0.5, my + 0.3], [mx + 2, my + 0.15], [mx + 1.95, my + 1.15], [mx + 1.25, my + 1.6], [mx + 0.6, my + 1.15]], 4);
      detail(t, lin(mx + 1.2, my + 0.2, mx + 1.2, my + 1.6, [[0, '#e0718a'], [1, '#f2899f']]), { stroke: rgba(SK.lipDk, 0.45), slw: 0.3 });
      detail(ell(mx + 1.55, my + 0.95, 0.25, 0.17), rgba('#ffffff', 0.6));
    });
  }
  const line = M.pts.map(([dx, dy]) => [mx + dx, my + dy]);
  const thin = M.thin ?? 0;
  mouthStroke(line, lerp(0.55, 0.38, thin));
  lowerLip(mx + 0.1, my + lerp(1.75, 1.5, thin), lerp(1.6, 1.3, thin), lerp(0.48, 0.35, thin));
  detail(ell(mx, my + 3.1, 1.25, 0.32), rgba(SK.sh1, 0.42), { blur: 0.2 });
}
// Her brows (reworked 2026-11-23): soft and kind, just beneath her bangs; fuller at the inner end,
// arching gently and tapering to a round outer end, deep lavender fading outward. They move with her:
// raised in joy and wonder, inner ends lifting in shyness and sorrow, drawn in for a pout, one up for
// a smug look, one down over a wink. Styles: soft arch (hers), gentle straight, high arch.
// (2026-11-23, the player: "just do round brows": round is hers now, short and full, the same
// thickness all along, round at both ends, gently curved; also a longer round arch, and maro brows,
// the small round ovals of the old Japanese court)
const BROW_STYLES = {
  round: { name: 'Round', arch: 0.75, w0: 1.32, w1: 1.18, even: true, len: [3.5, 4.3] },
  roundArch: { name: 'Round arch', arch: 1.15, w0: 1.05, w1: 0.95, even: true, len: [4.5, 5.4] },
  maro: { name: 'Maro (court ovals)', maro: true },
  soft: { name: 'Soft arch', arch: 1, w0: 1.15, w1: 0.4 },
  straight: { name: 'Gentle straight', arch: 0.45, w0: 1.3, w1: 0.48 },
  high: { name: 'High arch', arch: 1.55, w0: 0.95, w1: 0.34 },
};
// (2026-11-23, the player chose to try the maro ovals)
let BROW_STYLE = 'soft';
// ([all of it up (−) or down, the inner end, the outer end] in each expression)
const BROW_MOOD = {
  idle: [0, 0, 0], serene: [0, 0, 0], smile: [-0.25, 0, 0], peaceful: [0.15, 0.1, 0], happy: [-0.55, 0, -0.2], starry: [-0.85, -0.2, -0.1],
  wonder: [-1.3, -0.3, 0], dreamy: [-0.15, 0.15, 0.15], shy: [-0.15, -0.85, 0.45], pout: [0.25, 0.75, -0.4], wink: [-0.35, 0, 0],
  smug: [0, 0.35, -0.45], teary: [-0.35, -1.25, 0.65], blink: [0.1, 0.1, 0], hurt: [-0.2, -0.8, 0.4],
};
function brows(mood) {
  const st = BROW_STYLES[BROW_STYLE];
  const col = mixHex(hairRamp(HAIR_COLOR).sh2, LASH, 0.42);
  EYES.forEach(([ex, o]) => {
    let [lift, inn, out] = mood && typeof mood === 'object' ? (mood.brow ?? [0, 0, 0]) : (BROW_MOOD[mood] ?? BROW_MOOD.idle);
    if (mood && typeof mood === 'object' && mood.winkN && o > 0) lift += 0.75;
    if (mood === 'wink' && o > 0) lift += 0.75;
    if (mood === 'smug' && o > 0) lift -= 0.55;
    const by = HY + 1.7 + lift;
    if (st.maro) {
      // a small soft oval over the inner half of the eye, tilting with her mood
      // (soft-edged, deepest a little toward her nose, fading outward, a faint light on top)
      const cx = ex - o * 1.3;
      const cy = by - 0.05 + (inn + out) * 0.35;
      const a = o * (out - inn) * 0.16;
      const ov = ell(cx, cy, 2.05, 1.12, a);
      detail(ov, rad(cx - o * 0.45, cy + 0.1, 2.4, [[0, rgba(col, 0.95)], [0.7, rgba(col, 0.88)], [1, rgba(col, 0.72)]]), { clip: HEAD, blur: 0.04 });
      detail(ell(cx + o * 0.2, cy - 0.45, 1.1, 0.28, a), rgba('#ffffff', 0.22), { clip: ov, blur: 0.12 });
      return;
    }
    const x0 = ex - o * (st.len?.[0] ?? 4.5);
    const x1 = ex + o * (st.len?.[1] ?? 5.6);
    const line = [[x0, by + 0.2 + inn], [lerp(x0, x1, 0.3), by - st.arch * 0.75 + inn * 0.5], [lerp(x0, x1, 0.62), by - st.arch + out * 0.3], [x1, by + 0.45 + out]];
    const wd = st.even ? (u) => lerp(st.w0, st.w1, u) : (u) => lerp(st.w0, st.w1, smoothU(u)) * (1 + 0.12 * Math.sin(Math.PI * u));
    const shape = poly(cr(ribbon(line, wd, { n: 8 }), true, 2));
    detail(shape, lin(x0, by, x1, by, [[0, rgba(col, 0.92)], [1, rgba(col, st.even ? 0.75 : 0.58)]]), { clip: HEAD, blur: 0.05 });
  });
}

// ---------- Her clothes ----------
// Everything here follows her body's own outline (the base's): the bodice is her torso's shape a hair
// larger, the collar wraps her neck, the sleeves wrap her arms, the skirt flares from her waist.
const TORSO_R = [[185.8, 66.6], [188.5, 68.7], [192.3, 69.9], [194.7, 73.6], [193.4, 81], [193.4, 85.8], [190.4, 97], [193.6, 110], [192.5, 115.6], [185, 118]];
const mirror = (pts) => pts.map(([x, y]) => [2 * CX - x, y]);
const TORSO = smooth([...TORSO_R, ...mirror(TORSO_R).reverse()], 4);
const ARM0 = { N: { sh: [193.2, 74], el: [195.3, 91.6], wr: [195.7, 108.6] }, F: { sh: [166.8, 74], el: [164.7, 91.6], wr: [164.3, 108.6] } };
let ARM = ARM0;
// (the rig: each arm turns at the shoulder and the elbow on the screen, `sa` and `ea`, and swings in
// depth, toward you, `da` and `db`: her body faces you a little turned to the right, so a bone swung
// toward her front tips its downward part toward you (shorter as it shows) and a little to the right)
const FWD_X = 0.34;
const turnV = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const depthV = ([x, y], a) => [x + y * Math.sin(a) * FWD_X, y * Math.cos(a)];
function poseArms() {
  if (!POSE) {
    ARM = ARM0;
    return;
  }
  ARM = {};
  for (const k of ['N', 'F']) {
    const A = ARM0[k];
    const [sa, ea, hw = 0, rx = 0, ry = 0, da = 0, db = 0] = POSE.arm[k];
    const sh = [A.sh[0] + rx, A.sh[1] + ry];
    const up = depthV(turnV([A.el[0] - A.sh[0], A.el[1] - A.sh[1]], sa), da);
    const el = [sh[0] + up[0], sh[1] + up[1]];
    const f0 = [A.wr[0] - A.el[0], A.wr[1] - A.el[1]];
    const fo = depthV(turnV(f0, sa + ea), da + db);
    const wr = [el[0] + fo[0], el[1] + fo[1]];
    // (the hand turns as its forearm shows, and tips forward a little as the forearm comes toward you)
    const shown = Math.atan2(fo[1], fo[0]) - Math.atan2(f0[1], f0[0]);
    ARM[k] = { sh, el, wr, turn: shown - (da + db) * 0.25 + hw, cuff: POSE.cuff?.[k] ?? 0 };
  }
}
// (an outline grown outward a little about the body's middle)
const grow = (pts, d, cx = CX, cy = 90) => pts.map(([x, y]) => {
  const l = Math.hypot(x - cx, y - cy) || 1;
  return [x + ((x - cx) / l) * d, y + ((y - cy) / l) * d * 0.4];
});
function armSkin(k) {
  const A = ARM[k];
  const far = k === 'F';
  // (the hand comes out of the bell cuff: its wrist inside the sleeve, a little past the forearm's end)
  const dl = Math.hypot(A.wr[0] - A.el[0], A.wr[1] - A.el[1]) || 1;
  const hw = [A.wr[0] + ((A.wr[0] - A.el[0]) / dl) * 2, A.wr[1] + ((A.wr[1] - A.el[1]) / dl) * 2];
  const arm = poly(ribbon([A.sh, A.el, hw], (u) => lerp(7.2, 4.8, u), { n: 6 }));
  add(arm, far ? SK.sh1 : lin(A.sh[0] + 4, 0, A.sh[0] - 4, 0, [[0, SK.hi], [1, SK.base]]));
  // the hand, hanging relaxed: fingers together, a little curled, the thumb in front
  const [wx, wy] = hw;
  const s = far ? -1 : 1;
  return withXF(rotAbout(wx, wy, A.turn ?? 0), () => handDraw(arm, wx, wy, s, far));
}
// A hand (redrawn 2026-11-24, the player: "hands are kinda bad"): small and soft and relaxed, a
// rounded palm narrowing a touch at the wrist, the fingers together and gently curled in toward her,
// their tips round with a hint of pink, a little thumb lying along the front of the palm; lit on the
// back of the hand, shaded on the palm side. `s` mirrors it for the far hand, which is in shade.
function handDraw(arm, wx, wy, s, far) {
  const P = (x, y) => [wx + x * s, wy + y];
  const hand = smooth([P(2.35, -0.6), P(2.7, 1.8), P(2.6, 3.8), P(2.1, 5.25), P(1.1, 6.15), P(-0.1, 6.45), P(-1.2, 6.1), P(-1.9, 5.2), P(-2.25, 3.9), P(-2.4, 2.0), P(-2.3, -0.6)], 4);
  const [ax, ay] = P(-2.4, 2);
  const [bx, by] = P(2.7, 2);
  // (its own fine edge, in a deeper skin tone: over her dress there is no outline round it)
  add(hand, far ? lin(ax, ay, bx, by, [[0, SK.sh2], [1, SK.sh1]]) : lin(ax, ay, bx, by, [[0, SK.sh1], [0.5, SK.base], [1, SK.hi]]), true, { lw: 1.5, stroke: rgba(SK.line, far ? 0.7 : 0.85), slw: 0.55 });
  // (the fingertips' blush, and the light on the knuckles)
  detail(ell(...P(0, 5.6), 2.5, 1.1), rgba(SK.blush, far ? 0.18 : 0.32), { clip: hand, blur: 0.5 });
  if (far) return { arm, hand };
  detail(ell(...P(1.3, 3.2), 0.9, 1.8), rgba('#ffffff', 0.55), { clip: hand, blur: 0.5 });
  // (the thumb lying along the front of the palm, and the fingers' soft partings)
  lineOf(cr([P(-1.9, 1.4), P(-1.1, 2.6), P(-0.6, 4.1), P(-0.9, 4.9)], false, 4), rgba(SK.sh2, 0.75), 0.5, { clip: hand });
  detail(poly(ribbon([P(-1.7, 2), P(-1.3, 3.3), P(-1.2, 4.5)], (u) => 0.9 * Math.sin(Math.PI * u) + 0.1, { n: 4 })), rgba(SK.sh1, 0.55), { clip: hand, blur: 0.35 });
  lineOf(cr([P(0.05, 4.7), P(0.0, 5.6), P(-0.15, 6.2)], false, 3), rgba(SK.sh2, 0.6), 0.4, { clip: hand });
  lineOf(cr([P(1.15, 4.5), P(1.15, 5.3), P(1.0, 5.9)], false, 3), rgba(SK.sh2, 0.5), 0.38, { clip: hand });
  return { arm, hand };
}
// A sleeve: a navy puff gathered at the shoulder over a sheer sleeve down to a bell cuff with a
// scalloped silver edge, little stars stitched near it; the arm shows faintly through.
function sleeve(k) {
  const A = ARM[k];
  const dy = POSE?.sleeve?.[k] ?? 0;
  // (soft below the elbow: the sheer sleeve and its bell bounce)
  WARP = dy ? ([x, y]) => {
    const w = smoothU(clamp01((y - A.el[1] + 4) / 18));
    return [x, y + dy * w];
  } : null;
  try {
    return sleeveDraw(k);
  } finally {
    WARP = null;
  }
}
function sleeveDraw(k) {
  const A = ARM[k];
  const far = k === 'F';
  const s = far ? -1 : 1;
  const top = [A.sh[0] + s * 0.6, A.sh[1] + 7];
  // (the bell's end trails the arm about the elbow, as cloth does)
  const line = [top, A.el, xfPt(rotAbout(A.el[0], A.el[1], A.cuff ?? 0), [A.wr[0] + s * 0.4, A.wr[1] + 1.6])];
  const sh = poly(ribbon(line, (u) => lerp(8.4, 13.4, u ** 1.6), { n: 8, caps: false }));
  add(sh, lin(A.el[0], top[1], A.el[0], A.wr[1], [[0, rgba(far ? LV.dk : LV.base, 0.8)], [1, rgba(far ? LV.base : LV.lt, 0.72)]]), true, { lw: 1.6 });
  for (const off of [-2.4, 0.4, 3]) lineOf(cr([[A.el[0] + off * 0.4 + s * 0.6, A.el[1] - 6], [A.el[0] + off * 0.8, A.el[1] + 4], [A.wr[0] + off * 1.4, A.wr[1] + 1]], false, 4), rgba(far ? LV.dk : '#ffffff', far ? 0.4 : 0.6), 0.5, { clip: sh });
  // the cuff's lace: round scallops along the bell's edge, a stitched line above
  const e0 = along(line, 0.995);
  const half = 6.6;
  for (let j = 0; j < 5; j++) {
    const u = (j + 0.5) / 5;
    const cx2 = e0.p[0] + e0.n[0] * lerp(-half, half, u) - e0.d[0] * 0.2;
    const cy2 = e0.p[1] + e0.n[1] * lerp(-half, half, u) - e0.d[1] * 0.2;
    const r = (half * 2) / 10 + 0.2;
    const pth = new Path2D();
    pth.arc(cx2, cy2, r, Math.atan2(e0.d[1], e0.d[0]) - Math.PI / 2, Math.atan2(e0.d[1], e0.d[0]) + Math.PI / 2);
    pth.closePath();
    add(pth, far ? SV.dk : SV.base, true, { lw: 1 });
  }
  if (!far) for (const [u, dx] of [[0.72, -2], [0.82, 2.2], [0.9, -0.4]]) {
    const q = along(line, u).p;
    star4(q[0] + dx, q[1], 1.1, '#ffffff');
  }
  // the puff: gathered pleats radiating from the seam at the top of the shoulder, a silver band
  const pc = [A.sh[0] + s * 1.6, A.sh[1] + 2.6];
  const puff = smooth([[pc[0] - 5.4, pc[1] - 3.4], [pc[0] - 1, pc[1] - 6.2], [pc[0] + 4.4 * 1, pc[1] - 4.6], [pc[0] + 6.6, pc[1] + 0.6], [pc[0] + 5, pc[1] + 5.4], [pc[0], pc[1] + 6.4], [pc[0] - 5, pc[1] + 5], [pc[0] - 6.6, pc[1] + 0.4]].map(([x, y]) => [pc[0] + (x - pc[0]) * s, y]), 4);
  add(puff, far ? lin(pc[0], pc[1] - 6, pc[0], pc[1] + 6, [[0, NV.base], [1, NV.dk]]) : rad(pc[0] + 2, pc[1] - 2.4, 9, [[0, NV.lt], [0.6, NV.base], [1, NV.dk]]));
  for (let j = -2; j <= 2; j++) lineOf(cr([[pc[0] + j * 0.6 * s, pc[1] - 5.6], [pc[0] + j * 2.2 * s, pc[1]], [pc[0] + j * 2.8 * s, pc[1] + 5.4]], false, 3), rgba(far ? NV.deep : NV.dk, 0.7), 0.6, { clip: puff });
  if (!far) glow(puff, pc[0] + 2.4, pc[1] - 2.6, 4, NV.lt, 0.8);
  lineOf(cr([[pc[0] - 6 * s, pc[1] + 4.4], [pc[0], pc[1] + 6.2], [pc[0] + 6.2 * s, pc[1] + 4.2]], false, 5), far ? SV.dk : SV.base, 1.2);
}
// The gown: a navy velvet bodice cut to her torso, a lavender silk panel down the front with a
// constellation stitched in silver, silver piping down the princess seams, a waist dipping to a point;
// a silver sash with a bow on her hip; a high standing collar with a gold crescent brooch.
function bodice() {
  const R = [[186.6, 66.2], [189.2, 68.2], [192.8, 69.4], [195.4, 73.4], [194.2, 81.2], [194.2, 86], [191.2, 97], [192.2, 100.6]];
  const pts = [...R, [186, 102.4], [181, 105.4], [176, 102.4], ...mirror(R).reverse(), [176.4, 65.2], [181, 64.6], [185.6, 65.2]];
  const body = smooth(pts, 4);
  add(body, lin(166, 0, 196, 0, [[0, NV.dk], [0.35, NV.base], [0.72, NV.lt], [1, NV.base]]));
  // the bust: a soft light on each curve, a shade beneath
  glow(body, 187.6, 79.6, 6.4, '#7b82c8', 0.55);
  glow(body, 175.4, 80.4, 4.6, '#6a70b8', 0.35);
  for (const [x0, x1] of [[170, 178.6], [183.6, 192.2]]) detail(poly(ribbon([[x0, 86.4], [(x0 + x1) / 2, 88], [x1, 86.6]], (u) => 2 * Math.sin(Math.PI * u), { n: 5 })), rgba(NV.deep, 0.32), { clip: body });
  detail(poly(ribbon([[168.8, 72], [168.2, 84], [170.4, 97]], () => 3.4, { n: 4 })), rgba(NV.deep, 0.5), { clip: body });
  // the front panel
  const panel = smooth([[177.2, 64.4], [184.8, 64.4], [184, 84], [182.6, 97], [181, 104.4], [179.4, 97], [178, 84]], 3);
  detail(panel, lin(177, 69, 185, 104, [[0, LV.lt], [0.5, LV.base], [1, LV.dk]]), { clip: body });
  glow(panel, 182.6, 78, 4, '#ffffff', 0.6);
  const stars = [[179.6, 74.4], [182.6, 79.4], [180, 85.4], [182.2, 91], [180.6, 97.4]];
  lineOf(stars, rgba('#ffffff', 0.85), 0.4, { clip: panel });
  stars.forEach(([x, y], i) => star4(x, y, i === 1 ? 1.8 : 1.2, '#ffffff', 0.2));
  lineOf(cr([[177, 65], [177.8, 84], [179.2, 97], [181, 104.6]], false, 5), SV.base, 0.9, { clip: body });
  lineOf(cr([[185, 65], [184.2, 84], [182.8, 97], [181, 104.6]], false, 5), SV.base, 0.9, { clip: body });
  // the princess seams' piping, over the bust to the waist
  lineOf(cr([[190.8, 69.8], [189.6, 77], [189.2, 84], [188, 97], [186.2, 102.2]], false, 5), rgba(SV.base, 0.85), 0.6, { clip: body });
  lineOf(cr([[171.2, 69.8], [172.4, 77], [172.8, 84], [174, 97], [175.8, 102.2]], false, 5), rgba(SV.dk, 0.7), 0.6, { clip: body });
  // a velvet sheen down the near side
  lineOf(cr([[193.4, 74], [192.8, 84], [190.4, 96]], false, 4), rgba('#8a90d4', 0.55), 1.4, { clip: body });
  // the sash at her waist: a flat satin ribbon, a fold of light along it
  const sashLine = [[170.4, 98.4], [176, 100.2], [181, 100.8], [186, 100.2], [191.8, 98.4]];
  add(poly(ribbon(sashLine, () => 3, { n: 6, caps: false })), lin(181, 97, 181, 103, [[0, SV.lt], [0.5, SV.base], [1, SV.dk]]), true, { lw: 1.1 });
  lineOf(cr(sashLine.map(([x, y]) => [x, y - 0.5]), false, 6), rgba('#ffffff', 0.9), 0.45);
  lineOf(cr(sashLine.map(([x, y]) => [x, y + 1]), false, 6), rgba(SV.dk, 0.6), 0.4);
  // its bow on her near hip, the tails falling over the skirt, cut in a V
  const bx = CX + 1;
  const by = 100.4;
  for (const [i, [tx, ty, bend]] of [[CX + 5.4, 116, 1.2], [CX - 2.6, 118, -1]].entries()) {
    // (each tail turns from the knot, more toward its end)
    const sa = POSE?.sash?.[i] ?? 0;
    WARP = sa ? ([x, y]) => {
      const f = clamp01(Math.hypot(x - bx, y - by - 1) / 18);
      const a = sa * f;
      return [bx + (x - bx) * Math.cos(a) - (y - by - 1) * Math.sin(a), by + 1 + (x - bx) * Math.sin(a) + (y - by - 1) * Math.cos(a)];
    } : null;
    const tl = [[bx, by + 1], [lerp(bx, tx, 0.5) + bend, lerp(by, ty, 0.5)], [tx, ty]];
    const pts = ribbon(tl, () => 2.6, { n: 6, caps: false });
    const half = pts.length / 2;
    const end = along(tl, 1);
    const notch = [end.p[0] - end.d[0] * 1.4, end.p[1] - end.d[1] * 1.4];
    add(poly([...pts.slice(0, half), notch, ...pts.slice(half)]), lin(bx, by, tx, ty, [[0, SV.base], [1, SV.dk]]), true, { lw: 1 });
    lineOf(cr(tl, false, 4).slice(1, -2).map(([x, y]) => [x + 0.5, y]), rgba('#ffffff', 0.7), 0.4);
    WARP = null;
  }
  for (const s2 of [1, -1]) {
    const loop = smooth([[bx, by], [bx + s2 * 3, by - 3.6], [bx + s2 * 6.4, by - 3.4], [bx + s2 * 7, by + 0.4], [bx + s2 * 5, by + 3], [bx + s2 * 0.6, by + 1.2]], 4);
    add(loop, lin(bx, by - 4, bx, by + 3, [[0, SV.lt], [1, SV.dk]]), true, { lw: 1 });
    lineOf(cr([[bx + s2 * 1, by - 0.2], [bx + s2 * 3.6, by - 1.6], [bx + s2 * 5.6, by - 1]], false, 3), rgba(SV.dk, 0.8), 0.45);
    lineOf(cr([[bx + s2 * 1, by + 0.6], [bx + s2 * 3.4, by + 1.6], [bx + s2 * 5, by + 1.8]], false, 3), rgba(SV.dk, 0.6), 0.4);
  }
  add(smooth([[bx - 1.4, by - 1.6], [bx + 1.4, by - 1.6], [bx + 1.8, by + 1.8], [bx - 1.6, by + 1.8]], 2), lin(bx, by - 2, bx, by + 2, [[0, SV.lt], [1, SV.dk]]), true, { lw: 1 });
  return body;
}
// The skirt: a lavender tulle underskirt falling over the deer's chest, stars caught in it; a navy
// velvet overskirt open at the front, its edges trimmed in silver, sweeping back along the deer.
// (the skirt's soft warp: nothing moves at the waist, more toward the hem)
function skirtWarp([x, y]) {
  const S = POSE?.skirt;
  if (!S) return [x, y];
  const w = smoothU(clamp01((y - 103) / 26));
  const rip = S.go * 0.9 * Math.sin(S.ph * 2 - (x - 160) * 0.12);
  return [x + (S.x + rip) * w, y + S.y * w];
}
function skirt() {
  WARP = POSE?.skirt ? skirtWarp : null;
  try {
    return skirtDraw();
  } finally {
    WARP = null;
  }
}
function skirtDraw() {
  const under = smooth([[170.4, 100], [191.6, 100], [197.4, 112], [201.6, 126], [196, 131], [189, 128.6], [182, 132.4], [175, 129], [167.6, 131.4], [162.4, 126], [165, 112]], 4);
  add(under, lin(181, 100, 181, 132, [[0, LV.base], [1, LV.lt]]));
  for (let k = 0; k < 6; k++) lineOf(cr([[172 + k * 3.6, 102], [170 + k * 5, 116], [166 + k * 6.4, 129]], false, 4), rgba(LV.dk, 0.5), 0.5, { clip: under });
  for (const [x, y] of [[172, 118], [186, 121], [178, 126], [193, 115]]) star4(x, y, 1.2, '#ffffff');
  const hemU = [[162.4, 126], [167.6, 131.4], [175, 129], [182, 132.4], [189, 128.6], [196, 131], [201.6, 126]];
  lineOf(cr(hemU, false, 6).map(([x, y]) => [x, y - 1.2]), rgba('#ffffff', 0.8), 0.6, { clip: under });
  // the overskirt's two panels, open over the underskirt
  for (const s of [-1, 1]) {
    const x0 = CX + s * 9.4;
    const pts = [[x0 - s * 1.6, 100.4], [CX + s * 11.6, 100], [CX + s * 15, 108], [CX + s * 19.6, 118], [CX + s * 23.4, 126], [CX + s * 18.4, 130.6], [CX + s * 13.6, 128.2], [CX + s * 10, 118], [x0 - s * 0.4, 108]];
    const pn = smooth(pts, 4);
    add(pn, lin(CX + s * 9, 100, CX + s * 20, 130, s > 0 ? [[0, NV.lt], [0.5, NV.base], [1, NV.dk]] : [[0, NV.base], [1, NV.deep]]));
    for (const off of [0.3, 0.6]) lineOf(cr([[lerp(x0, CX + s * 11.6, off), 101], [lerp(CX + s * 10, CX + s * 19.6, off), 118], [lerp(CX + s * 13.6, CX + s * 23.4, off), 128]], false, 4), rgba(NV.deep, 0.6), 0.7, { clip: pn });
    // the silver trim down its front edge and along its hem
    const trim = [[x0 - s * 0.6, 100.8], [x0 - s * 0.2, 108], [CX + s * 10.4, 118], [CX + s * 13.8, 127.4], [CX + s * 18.4, 130]];
    lineOf(cr(trim, false, 5), s > 0 ? SV.base : SV.dk, 1.3, { clip: pn });
    lineOf(cr(trim.map(([x, y]) => [x + s * 1.4, y]), false, 5), rgba(GD.base, 0.9), 0.4, { clip: pn });
    const q = along(trim, 0.62).p;
    crescent(q[0] + s * 4.2, q[1] - 1, 1.8, s > 0 ? -0.4 : Math.PI + 0.4, s > 0 ? SV.base : SV.dk, false);
  }
  return under;
}
// The high collar wraps her neck: its back stands up behind it (its lavender lining showing), its two
// fronts come round to meet in a V, a gold crescent brooch where they meet.
function collarBack() {
  add(smooth([[171.6, 56.6], [176, 55.4], [186, 55.4], [190.4, 56.6], [191.6, 64], [190.2, 67.8], [171.8, 67.8], [170.4, 64]], 4), lin(181, 55, 181, 68, [[0, LV.base], [1, LV.dk]]));
}
function collarFront() {
  const inner = smooth([[HX - 4.4, 59.6], [HX + 4.4, 59.6], [HX + 1.4, 69.4], [HX - 1.4, 69.4]], 2);
  add(inner, lin(HX, 59, HX, 70, [[0, LV.base], [1, LV.lt]]));
  star4(HX, 63.4, 1, '#ffffff');
  for (const s of [-1, 1]) {
    const pts = [[CX + s * 9.4, 56.4], [CX + s * 6.6, 57.6], [CX + s * 3.4, 61.4], [CX + s * 0.4, 65.6], [CX + s * 0.4, 69.6], [CX + s * 10.4, 68], [CX + s * 11.2, 62.6]].map(([x, y]) => [x + B.dx, y]);
    const c = smooth(pts, 3);
    add(c, lin(CX + s * 10, 56, CX, 69, s > 0 ? [[0, NV.lt], [1, NV.base]] : [[0, NV.base], [1, NV.dk]]));
    lineOf(cr(pts.slice(0, 4), false, 4), s > 0 ? SV.base : SV.dk, 1.1);
    for (let j = 0; j < 3; j++) star4(HX + s * (8 - j * 2.6), 61.4 + j * 1.6, 0.8, rgba('#ffffff', 0.85));
  }
  crescent(HX, 67, 3.2, -Math.PI / 2 - 0.3, GD.base);
  add(ell(HX + 0.6, 67.6, 1.25, 1.25), lin(HX, 66.4, HX, 68.8, [[0, '#f0f7ff'], [1, '#a9c8f0']]), true, { lw: 0.9 });
  detail(ell(HX + 0.2, 67.1, 0.4, 0.4), '#ffffff');
}
function neck() {
  // (it ends inside the collar, so nothing of it shows below)
  const nk = smooth([[176.2, 55], [185.8, 55], [186.6, 65.6], [175.4, 65.6]], 2);
  add(nk, SK.base);
  detail(smooth([[175.5, 58], [186.6, 58], [186.8, 64.6], [175.2, 64.6]], 2), rgba(SK.sh1, 0.85), { clip: nk });
  detail(smooth([[175.5, 57.4], [186.6, 57.4], [186.6, 60.6], [175.5, 60.6]], 2), rgba(SK.sh2, 0.5), { clip: nk });
}
// The tiara: a fine gold circlet over her hair, a crescent with a moonstone where the fringe parts,
// filigree curls beside it, a little crystal drop at each temple.
function tiara() {
  const band = [[HX - 20.4, HY - 11.4], [HX - 13, HY - 20.6], [HX + 2, HY - 24.4], [HX + 16, HY - 20.6], [HX + 22, HY - 11.4]];
  lineOf(cr(band, false, 6), GD.dk, 1.2);
  lineOf(cr(band, false, 6), GD.lt, 0.5);
  for (const s of [-1, 1]) {
    const c0 = [HX + 2 + s * 4.6, HY - 24.6];
    lineOf(cr([c0, [c0[0] + s * 2, c0[1] - 2.2], [c0[0] + s * 3.8, c0[1] - 1.2], [c0[0] + s * 3.2, c0[1] + 0.4]], false, 4), GD.base, 0.7);
    const t = [HX + 2 + s * 20, HY - 12.4];
    withXF(rotAbout(t[0], t[1], POSE?.drop ?? 0), () => {
      lineOf([t, [t[0], t[1] + 2.6]], GD.dk, 0.45);
      add(smooth([[t[0], t[1] + 2.6], [t[0] + 1, t[1] + 4.4], [t[0], t[1] + 6.2], [t[0] - 1, t[1] + 4.4]], 2), lin(t[0], t[1] + 2.6, t[0], t[1] + 6.2, [[0, '#ffffff'], [1, AN.mid]]), true, { lw: 0.8 });
    });
  }
  crescent(HX + 2, HY - 26.8, 4, Math.PI / 2, GD.base);
  add(ell(HX + 2, HY - 25.6, 1.5, 1.5), lin(HX + 2, HY - 27, HX + 2, HY - 24, [[0, '#f0f7ff'], [1, '#a9c8f0']]), true, { lw: 0.9 });
  detail(ell(HX + 1.5, HY - 26.1, 0.5, 0.5), '#ffffff');
  for (const [x, y, r] of [[HX - 14, HY - 16, 1.6], [HX + 17.6, HY - 9, 1.4], [HX - 6, HY - 21, 1.2], [HX + 10, HY - 18, 1]]) star4(x, y, r, '#ffffff', 0.3);
}

// ---------- Her, whole ----------
function build(mood = 'idle') {
  items = [];
  const P = POSE;
  const Mb = P?.Mb ?? null;
  const Mu = P?.Mu ?? null;
  const Mh = P?.Mh ?? null;
  poseArms();
  const leg = (k, w, far, hind) => (P ? deerLeg(P.legs[k].js, w, far, hind, P.legs[k].tilt) : deerLeg(LEGS[k], w, far, hind));
  leg('hindF', DEER.hind.w, true, true);
  leg('foreF', DEER.fore.w, true, false);
  withXF(P?.body ? Mb.multiply(shiftAt(P.body, [CX + DEER.tail.root[0], DEER.tail.root[1]])) : Mb, deerTail);
  leg('hindN', DEER.hind.w, false, true);
  leg('foreN', DEER.fore.w, false, false);
  let barrelP = null;
  withXF(Mb, () => {
    // (the body and its blanket bend with the soft body)
    WARP = warpOf(P?.body);
    barrelP = deerBody();
    caparison();
    WARP = null;
  });
  if (P) {
    const bodyW = new Path2D();
    bodyW.addPath(barrelP, Mb);
    deerLegOver(P.legs.foreN.js, DEER.fore.w, false, P.legs.foreN.tilt, bodyW);
  }
  veil();
  withXF(Mh, () => {
    longHair();
    hairBack();
    antler(-1);
    antler(1);
  });
  let faceEnd = 0;
  withXF(Mu, () => {
    const farFront = !!POSE?.farFront;
    const nearFront = !!POSE?.nearFront;
    if (!farFront) {
      armSkin('F');
      sleeve('F');
    }
    add(TORSO, SK.base);
    skirt();
    bodice();
    if (farFront) {
      armSkin('F');
      sleeve('F');
    }
    if (!nearFront) {
      armSkin('N');
      sleeve('N');
    }
    collarBack();
    neck();
    collarFront();
    withXF(P?.Mhr ?? null, () => {
      deerEar(-1);
      deerEar(1);
      detail(ell(HX + 1, HY + 25.4, 8.4, 2.2), rgba(NV.deep, 0.45), { blur: 0.7 });
      add(HEAD, lin(HX + 12, HY - 20, HX - 14, HY + 22, [[0, SK.hi], [0.5, SK.base], [1, SK.base]]));
      face(mood);
      faceEnd = items.length;
      sideLocks();
      hairFront();
      tiara();
      hairTop();
      drawFX(P?.fx);
    });
    if (POSE?.nearFront) {
      armSkin('N');
      sleeve('N');
    }
  });
  // (every shadow cast on her skin goes under her hair)
  const fs = items.filter((it) => it.faceShadow);
  items = [...items.slice(0, faceEnd), ...fs, ...items.slice(faceEnd).filter((it) => !it.faceShadow)];
}

// Her emotions' little effects, drawn with her head: soft hearts floating up and fading, sparkles
// twinkling round her, a nervous sweat drop at her temple.
function heartShape(x, y, r) {
  const pts = [];
  for (let k = 0; k < 24; k++) {
    const t = (k / 24) * TAU;
    pts.push([x + (16 * Math.sin(t) ** 3 * r) / 16, y - ((13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * r) / 16]);
  }
  return smooth(pts, 2);
}
function drawFX(fx) {
  if (!fx) return;
  const t = fx.t;
  if (fx.hearts > 0.02) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.55 + i / 3) % 1;
      const a = fx.hearts * Math.sin(Math.PI * ph) ** 0.8;
      if (a < 0.02) continue;
      const x = HX + 25 + i * 3.4 + Math.sin(ph * TAU + i) * 1.6;
      const y = HY - 6 - ph * 24;
      const r = 1.9 + 0.5 * Math.sin(ph * Math.PI);
      const h = heartShape(x, y, r);
      detail(h, lin(x, y - r, x, y + r, [[0, rgba('#ffd0e2', a)], [1, rgba('#ff8fb8', a)]]), { stroke: rgba('#d9658f', a * 0.8), slw: 0.35 });
      detail(ell(x - r * 0.35, y - r * 0.35, r * 0.22, r * 0.15), rgba('#ffffff', a * 0.9));
    }
  }
  if (fx.sparkle > 0.02) {
    for (const [dx, dy, r0, ph] of [[-24, -8, 1.5, 0], [27, -14, 1.8, 1.7], [24, 8, 1.2, 3.1], [-20, 10, 1.1, 4.4]]) {
      const tw = 0.5 + 0.5 * Math.sin(t * 7 + ph);
      star4(HX + dx, HY + dy, r0 * (0.6 + 0.5 * tw) * fx.sparkle, `rgba(255,255,255,${(0.95 * fx.sparkle * (0.4 + 0.6 * tw)).toFixed(3)})`, 0.3);
    }
  }
  if (fx.sweat > 0.02) {
    const k = fx.sweat;
    const x = HX + 22;
    const y = HY - 8 + Math.min(2, t * 0.6);
    withXF(new DOMMatrix().translate(x, y).scale(k).translate(-x, -y), () => {
      const d = smooth([[x, y - 2.6], [x + 0.9, y - 1.1], [x + 1.6, y + 0.5], [x + 1.2, y + 1.6], [x, y + 2], [x - 1.2, y + 1.6], [x - 1.6, y + 0.5], [x - 0.9, y - 1.1]], 4);
      detail(d, lin(x, y - 2.6, x, y + 2, [[0, rgba('#eef8ff', 0.95)], [1, rgba('#9fcaf5', 0.95)]]), { stroke: rgba('#6f9fd8', 0.85), slw: 0.4 });
      detail(ell(x - 0.5, y + 0.1, 0.4, 0.6), '#ffffff');
    });
  }
}

// ---------- Her emotions, animated (2026-11-23, the player: "heavily polish her emotions animations,
// she's very shy and cute") ----------
// Each emotion is a little performance: keys in time, her face and body easing from one to the next
// (lids, gaze, brows, the mouth's shape, the blush), never snapping, and her whole body joining in:
// her ears perk or droop, her tail wags or tucks, her head tilts and dips, her hands come up to her
// chest when she's shy, a little hop when she's happy; hearts, sparkles, a sweat drop, a welling tear.
const NEUTRAL = {
  lid: [0.2, 0.2], lift: 0, ik: 1, look: [0, 0], bot: 0, inner: 0, star: 0, wet: 0, wonder: 0, closed: ['', ''], mouth: 'flat', open: 0, o: 0, pout: 0, tongue: 0,
  blush: 0.36, lines: 3, puff: 0, tear: 0, sweat: 0, brow: [0, 0, 0], head: 0, headDy: 0, ear: 0, tail: 0, wag: 0, armW: 0, armN: [0, 0, 0, 0, 0], armF: [0, 0, 0, 0, 0], lean: 0, hop: 0, hearts: 0, sparkle: 0,
  farFront: 0, nearFront: 0, paw: [0, 0], tuck: 0, skirtPat: 0,
};
const SHY_ARMS = { armW: 1, armN: [0.36, 2.1, 0, 0, 0], armF: [-0.36, -2.1, 0, 0, 0] };
const EMOTES = {
  neutral: { name: 'Calm', keys: [[0, {}]] },
  shy: { name: 'Shy', keys: [
    [0, {}],
    [0.5, { lid: [0.12, 0.12], look: [0.05, -0.01], brow: [-0.25, 0, 0], ear: -0.12, blush: 0.5 }],
    [1.1, { lid: [0.3, 0.3], look: [-0.15, 0.09], bot: 0.06, mouth: 'wavy', blush: 1.05, lines: 5, brow: [-0.15, -0.85, 0.45], head: 0.055, headDy: 1.1, ear: 0.38, tail: -0.35, lean: -0.015, ...SHY_ARMS }],
    [2.2, { look: [-0.17, 0.1], blush: 1.15 }],
    [2.8, { look: [0.04, 0.03], lid: [0.26, 0.26], mouth: 'smile', head: 0.03, ear: 0.3 }],
    [3.5, { look: [-0.16, 0.1], lid: [0.32, 0.32], mouth: 'wavy', head: 0.065, ear: 0.42, blush: 1.2 }],
    [4.3, { look: [-0.05, 0.04], blush: 0.7, armW: 0.3, ear: 0.15, tail: -0.1, head: 0.02, headDy: 0.4, mouth: 'flat' }],
    [4.8, 'N'],
  ] },
  happy: { name: 'Happy', keys: [
    [0, {}],
    [0.35, { lid: [0.4, 0.4], bot: 0.2, mouth: 'smile', blush: 0.6, ear: -0.15 }],
    [0.55, { closed: ['happy', 'happy'], open: 0.9, blush: 0.85, brow: [-0.55, 0, -0.2], ear: -0.28, tail: 0.3, wag: 1, hop: 1, hearts: 1, head: -0.035, lean: 0.015 }],
    [3.0, { hearts: 0.9 }],
    [3.4, { closed: ['', ''], open: 0, lid: [0.25, 0.25], bot: 0.05, hop: 0, wag: 0.3, hearts: 0 }],
    [3.8, 'N'],
  ] },
  flustered: { name: 'Flustered', keys: [
    [0, {}],
    [0.3, { lid: [-0.02, -0.02], ik: 0.9, brow: [-0.45, -0.6, 0.3], blush: 0.9, ear: -0.3, look: [0.06, 0] }],
    [0.75, { blush: 1.3, lines: 5, mouth: 'wavy', sweat: 1, look: [-0.13, 0.06], ear: 0.45, tail: -0.4, head: -0.05, ...SHY_ARMS }],
    [1.3, { look: [0.12, 0.05] }],
    [1.85, { look: [-0.13, 0.06] }],
    [2.15, { lid: [0.45, 0.45], bot: 0.15 }],
    [2.4, { closed: ['happy', 'happy'], head: 0.04 }],
    [3.1, { closed: ['', ''], lid: [0.25, 0.25], bot: 0, look: [-0.06, 0.04], blush: 1, armW: 0.4, sweat: 0.6 }],
    [3.8, 'N'],
  ] },
  pout: { name: 'Pout', keys: [
    [0, {}],
    [0.45, { lid: [0.3, 0.3], look: [0.11, 0], pout: 1, puff: 1, blush: 0.85, brow: [0.25, 0.75, -0.4], ear: 0.3, head: 0.04, tail: -0.12 }],
    [1.6, { look: [0.13, 0.02] }],
    [2.2, { look: [-0.02, 0], lid: [0.34, 0.34] }],
    [2.8, { look: [0.12, 0.01], lid: [0.3, 0.3] }],
    [3.4, 'N'],
  ] },
  wonder: { name: 'Wonder', keys: [
    [0, {}],
    [0.3, { lid: [-0.03, -0.03], ik: 0.86, wonder: 1, o: 1, brow: [-1.3, -0.3, 0], ear: -0.55, tail: 0.45, headDy: -0.9, lean: -0.025, sparkle: 1 }],
    [2.5, { sparkle: 0.8 }],
    [3.2, 'N'],
  ] },
  dreamy: { name: 'Dreamy', keys: [
    [0, {}],
    [0.6, { lid: [0.32, 0.32], lift: 0.07, look: [0.06, -0.06], bot: 0.06, mouth: 'smile', blush: 0.82, brow: [-0.15, 0.15, 0.15], head: -0.06, ear: 0.12, hearts: 0.6, tail: 0.1, wag: 0.3 }],
    [1.9, { head: -0.02 }],
    [2.9, { head: -0.065 }],
    [3.8, 'N'],
  ] },
  wink: { name: 'Wink', keys: [
    [0, {}],
    [0.25, { lid: [0.2, 0.45], bot: 0.08, mouth: 'smile' }],
    [0.4, { closed: ['', 'happy'], mouth: 'tongue', tongue: 1, blush: 0.75, brow: [-0.35, 0, 0], head: -0.05, sparkle: 1, ear: -0.15, tail: 0.3, wag: 0.7, lid: [0.2, 0.2] }],
    [2.1, {}],
    [2.4, { closed: ['', ''], tongue: 0, mouth: 'smile' }],
    [2.8, 'N'],
  ] },
  teary: { name: 'Teary', keys: [
    [0, {}],
    [0.5, { lid: [0.1, 0.1], lift: -0.09, ik: 1.03, inner: 0.1, wet: 1, mouth: 'frown', brow: [-0.35, -1.25, 0.65], blush: 0.66, ear: 0.5, tail: -0.4, headDy: 0.9, look: [0, 0.04] }],
    [1.6, { tear: 1 }],
    [2.9, { tear: 1 }],
    [3.3, { tear: 0, wet: 0 }],
    [3.8, 'N'],
  ] },
  glance: { name: 'Shy glance', keys: [
    [0, {}],
    [0.6, { look: [0.07, 0], lid: [0.16, 0.16] }],
    [1.0, { look: [-0.14, 0.07], blush: 0.75, lines: 4, head: 0.035, ear: 0.2, mouth: 'wavy', lid: [0.26, 0.26] }],
    [2.4, { look: [-0.1, 0.05], blush: 0.6 }],
    [3.4, 'N'],
  ] },
};
// (each key's whole state: the one before with this key's changes; 'N' back to calm)
const keyStates = (keys) => {
  let st = { ...NEUTRAL };
  return keys.map(([t, k]) => {
    st = k === 'N' ? { ...NEUTRAL } : { ...st, ...k };
    return [t, st];
  });
};
// (values mixed; lists of different lengths count a missing number as 0)
const mixV = (a, b, u) => (Array.isArray(a) ? Array.from({ length: Math.max(a.length, b.length) }, (_, i) => {
  const v = a[i] ?? (typeof b[i] === 'number' ? 0 : b[i]);
  const w = b[i] ?? (typeof a[i] === 'number' ? 0 : a[i]);
  return typeof v === 'number' ? lerp(v, w, u) : u < 0.4 ? v : w;
}) : typeof a === 'number' ? lerp(a, b, u) : u < 0.4 ? a : b);
// The emotion's values at `tc` seconds into it, eased between its keys.
function emoteAt(name, tc) {
  return keysAt(EMOTES[name].keys, tc);
}
function keysAt(keys, tc) {
  const ks = keyStates(keys);
  let i = 0;
  while (i < ks.length - 1 && ks[i + 1][0] <= tc) i++;
  const [t0, A] = ks[i];
  const [t1, B] = ks[Math.min(ks.length - 1, i + 1)];
  const u = t1 > t0 ? smoothU(Math.min(1, Math.max(0, (tc - t0) / (t1 - t0)))) : 1;
  const out = {};
  for (const k of Object.keys(NEUTRAL)) out[k] = mixV(A[k], B[k], u);
  const pa = mouthPts(A.mouth);
  const pb = mouthPts(B.mouth);
  out.mouthPts = pa.map((q, j) => [lerp(q[0], pb[j][0], u), lerp(q[1], pb[j][1], u)]);
  out.thin = lerp(THIN_MOUTH[A.mouth] ?? 0, THIN_MOUTH[B.mouth] ?? 0, u);
  return out;
}
// ---------- Her idles (2026-11-24, the player: "now we need to build her idle animations. Crossed
// arms. Any suggestions?", then "all ten") ----------
// Little things she does on her own while she stands calm (not walking, not talking, no emotion
// playing): every 7 to 13 seconds one of these, in a shuffled order that never repeats the last one.
// Each eases in from calm and back to calm; if she sets off, is startled or starts talking in the
// middle of one, she eases out of it in a third of a second. Moon gaze waits for the night. Her hair, skirt, sleeves and charms keep
// reacting to every move. Arms: [shoulder, elbow, swing toward you, forearm toward you, hand's turn,
// shoulder lifted];
// farFront / nearFront draw that arm in front of her body / her head while it is there.
const REST_N = [0.06, 0.2, 0, 0, 0];
const REST_F = [-0.06, -0.2, 0, 0, 0];
const IDLES = {
  // Crossed arms: she folds her arms under her chest with a little sigh, shifts her weight, tilts her
  // head and glances aside, taps a finger on her arm three times, then lets her arms down.
  crossed: { dur: 6.4, keys: [
    [0, { farFront: 1 }],
    [0.7, { armW: 1, armN: [0.3, 1.32, 0, 0, 0], armF: [-0.2, -1.45, 0, 0, 0], headDy: 0.6, lean: -0.008, lid: [0.27, 0.27], look: [0.02, 0.03], ear: 0.15, tail: -0.1 }],
    [1.2, { headDy: 0.1, lean: 0.003 }],
    [1.7, { lean: 0.012, head: 0.035, look: [-0.09, 0.02], lid: [0.24, 0.24] }],
    [2.2, { armN: [0.3, 1.32, 0, 0, 0.2] }],
    [2.4, { armN: [0.3, 1.32, 0, 0, 0] }],
    [2.6, { armN: [0.3, 1.32, 0, 0, 0.2] }],
    [2.8, { armN: [0.3, 1.32, 0, 0, 0] }],
    [3.0, { armN: [0.3, 1.32, 0, 0, 0.2] }],
    [3.2, { armN: [0.3, 1.32, 0, 0, 0] }],
    [4.4, { look: [0.04, 0.01], head: 0.015, lid: [0.22, 0.22] }],
    [5.4, { armN: REST_N, armF: REST_F, lean: 0, head: 0, headDy: 0, ear: 0, tail: 0 }],
    [6.4, 'N'],
  ] },
  // Tucking her hair: her near hand comes up and slides behind the long lock by her face, sweeping it
  // back past her ear, and comes down; the lock springs softly back.
  tuck: { dur: 4.2, keys: [
    [0, {}],
    [0.3, { armW: 1, armN: [-0.7, -0.5, 0, 0, 0.1] }],
    [0.75, { nearFront: 1, armN: [-1.9, -1.47, 0, 0, 0.25], head: 0.04, look: [0.06, 0], ear: -0.1 }],
    [1.25, { armN: [-2.0, -1.3, 0, 0, 0.3], tuck: 0.24, head: 0.05 }],
    [1.8, { armN: [-1.75, -1.55, 0, 0, 0.2], tuck: 0.14 }],
    [2.5, { armN: REST_N, tuck: 0, head: 0.01, look: [0.02, 0] }],
    [3.2, { nearFront: 0 }],
    [4.2, 'N'],
  ] },
  // Ear flick: her ears twitch twice, then perk as she lifts her head and listens toward a sound,
  // still for a beat, her tail up; then she relaxes.
  earflick: { dur: 3.4, keys: [
    [0, {}],
    [0.15, { ear: -0.55 }],
    [0.3, { ear: 0.15 }],
    [0.45, { ear: -0.5 }],
    [0.7, { ear: -0.32, head: -0.045, headDy: -0.3, look: [0.15, -0.03], lid: [0.1, 0.1], tail: 0.35 }],
    [2.2, { ear: -0.25, look: [0.13, -0.02] }],
    [2.7, { ear: 0.05, head: 0, headDy: 0, look: [0.02, 0], lid: [0.2, 0.2], tail: 0 }],
    [3.4, 'N'],
  ] },
  // Moon gaze: she looks up at the sky, hands clasped at her chest, and her eyes catch the starlight.
  moongaze: { dur: 5.4, night: true, keys: [
    [0, { farFront: 1 }],
    [0.8, { armW: 1, armN: [0.36, 2.1, 0, 0, 0], armF: [-0.36, -2.1, 0, 0, 0], headDy: -0.6, head: -0.045, look: [0.05, -0.16], lid: [0.06, 0.06], brow: [-0.6, 0, 0], ear: -0.2, lean: -0.012 }],
    [1.4, { star: 1, sparkle: 1, blush: 0.6, mouth: 'rest' }],
    [3.8, { sparkle: 0.8, look: [0.07, -0.15] }],
    [4.4, { star: 0, sparkle: 0, armN: REST_N, armF: REST_F, headDy: 0, head: 0, look: [0, 0], lid: [0.2, 0.2], brow: [0, 0, 0], lean: 0, mouth: 'flat', ear: 0, blush: 0.36 }],
    [5.4, 'N'],
  ] },
  // A sleepy yawn: a soft stretch back with her arms easing out, then a yawn behind her hand, eyes
  // closed, ears drooping; she blinks it away.
  yawn: { dur: 4.4, keys: [
    [0, {}],
    [0.7, { lean: -0.022, headDy: -0.5, head: -0.03, armW: 1, armN: [-0.4, 0.15, 0, 0, 0], armF: [0.4, -0.15, 0, 0, 0], lid: [0.3, 0.3], ear: -0.2, tail: 0.2 }],
    [1.25, { nearFront: 1, lean: -0.008, headDy: 0, armN: [0, 2.41, 1.2, -1.2, 0.3], armF: REST_F, closed: ['blink', 'blink'], o: 1, ear: 0.3, tail: 0 }],
    [2.4, { o: 0.7 }],
    [2.9, { o: 0, closed: ['', ''], lid: [0.34, 0.34], armN: REST_N, ear: 0.15, lean: 0, head: 0 }],
    [3.6, { nearFront: 0 }],
    [4.4, 'N'],
  ] },
  // Pom-pom flick: her tail flicks quickly a few times as she glances back at it.
  tailflick: { dur: 2.6, keys: [
    [0, {}],
    [0.2, { tail: 0.5, wag: 1, ear: -0.1, look: [-0.12, 0.04], head: 0.02 }],
    [1.4, { wag: 0.4 }],
    [1.9, { tail: 0.1, wag: 0, look: [0, 0], head: 0 }],
    [2.6, 'N'],
  ] },
  // Hoof shuffle: she lifts her near forehoof and paws the grass gently twice, looking down at it.
  hoof: { dur: 3.6, keys: [
    [0, {}],
    [0.45, { paw: [6, 1.5], ear: 0.1, look: [0.05, 0.12], headDy: 0.4 }],
    [0.8, { paw: [0.6, 3] }],
    [1.15, { paw: [5, 1.2] }],
    [1.5, { paw: [0.4, 2.4] }],
    [1.9, { paw: [4, 0.6] }],
    [2.35, { paw: [0, 0], look: [0.02, 0.02], headDy: 0 }],
    [3.6, 'N'],
  ] },
  // Fixing her tiara: her near hand comes up to straighten it at her temple, a little adjusting wiggle,
  // then a small proud nod with her eyes closed in a smile.
  tiara: { dur: 3.8, keys: [
    [0, {}],
    [0.3, { armW: 1, armN: [-0.9, -0.4, 0, 0, 0.1, 1.5] }],
    [0.8, { nearFront: 1, armN: [-2.3, -0.85, 0, 0, 0.3, 6], head: 0.09, look: [0.09, -0.06] }],
    [1.25, { armN: [-2.25, -0.98, 0, 0, 0.1, 6.4] }],
    [1.6, { armN: [-2.3, -0.85, 0, 0, 0.3, 6] }],
    [2.15, { armN: REST_N, head: 0, headDy: -0.4, mouth: 'rest', lid: [0.3, 0.3], bot: 0.08 }],
    [2.5, { headDy: 0.35, closed: ['happy', 'happy'] }],
    [3.0, { headDy: 0, closed: ['', ''], lid: [0.22, 0.22], bot: 0, nearFront: 0 }],
    [3.8, 'N'],
  ] },
  // Smoothing her skirt: she looks down and brushes her skirt flat with both hands, twice.
  skirt: { dur: 3.4, keys: [
    [0, { farFront: 1 }],
    [0.6, { armW: 1, armN: [0.2, 0.25, 0, 0, 0.1], armF: [-0.2, -0.25, 0, 0, -0.1], look: [0.02, 0.16], headDy: 0.7, lean: 0.012, lid: [0.3, 0.3] }],
    [1.1, { armN: [0.06, 0.06, 0, 0, -0.05], armF: [-0.06, -0.06, 0, 0, 0.05], skirtPat: 1.6, lean: 0.022 }],
    [1.4, { armN: [0.2, 0.25, 0, 0, 0.1], armF: [-0.2, -0.25, 0, 0, -0.1], skirtPat: -0.6, lean: 0.012 }],
    [1.9, { armN: [0.06, 0.06, 0, 0, -0.05], armF: [-0.06, -0.06, 0, 0, 0.05], skirtPat: 1.4, lean: 0.022 }],
    [2.4, { skirtPat: 0, armN: REST_N, armF: REST_F, look: [0.05, 0.03], headDy: 0, lean: 0, lid: [0.22, 0.22], mouth: 'rest' }],
    [3.4, 'N'],
  ] },
  // A quiet hum: eyes closed and a small smile, she sways gently side to side, a few sparkles round her.
  hum: { dur: 5.4, keys: [
    [0, {}],
    [0.6, { closed: ['blink', 'blink'], mouth: 'rest', blush: 0.55, lean: -0.008, head: -0.03, sparkle: 0.6, ear: 0.1 }],
    [1.6, { lean: 0.008, head: 0.03 }],
    [2.6, { lean: -0.008, head: -0.03 }],
    [3.6, { lean: 0.008, head: 0.03 }],
    [4.5, { lean: 0, head: 0, closed: ['', ''], sparkle: 0, lid: [0.26, 0.26], mouth: 'flat', blush: 0.36, ear: 0 }],
    [5.4, 'N'],
  ] },
};
let CALM0 = null;
const calmState = () => (CALM0 ??= keysAt([[0, {}]], 0));
// (two emotion states mixed)
function mixState(A, B, u) {
  const out = {};
  for (const k of Object.keys(NEUTRAL)) out[k] = mixV(A[k] ?? NEUTRAL[k], B[k] ?? NEUTRAL[k], u);
  const pa = A.mouthPts ?? calmState().mouthPts;
  out.mouthPts = pa.map((q, j) => [lerp(q[0], B.mouthPts[j][0], u), lerp(q[1], B.mouthPts[j][1], u)]);
  out.thin = lerp(A.thin ?? 0, B.thin ?? 0, u);
  return out;
}
// The idle player: picks and plays her idles while she stands calm; her state with the idle mixed in.
function idleMix(E, dt, emo) {
  const I = (RIG.idle ??= { name: null, t: 0, w: 0, next: 5, bag: [], last: null, seed: 7 });
  const calm = RIG.calm ?? !emo;
  const standing = (RIG.spr.go?.x ?? 0) < 0.03;
  const ok = calm && standing;
  if (!I.name) {
    if (ok) I.next -= dt;
    else I.next = Math.max(I.next, 2.5);
    if (I.next <= 0) {
      if (!I.bag.length) {
        const names = Object.keys(IDLES);
        for (let i = names.length - 1; i > 0; i--) {
          I.seed = (I.seed * 9301 + 49297) % 233280;
          const j = Math.floor((I.seed / 233280) * (i + 1));
          [names[i], names[j]] = [names[j], names[i]];
        }
        if (names[0] === I.last) names.push(names.shift());
        I.bag = names;
      }
      // (a night-only idle waits for the night: the next one plays instead)
      const day = RIG.night === false;
      const at = I.bag.findIndex((n) => !(day && IDLES[n].night));
      I.name = at < 0 ? null : I.bag.splice(at, 1)[0];
      I.t = 0;
      I.w = 1;
      if (!I.name) I.next = 4;
    }
  }
  if (!I.name) return E;
  I.t += dt;
  if (!ok) I.w = Math.max(0, I.w - dt / 0.33);
  if (I.t >= IDLES[I.name].dur || I.w <= 0) {
    I.last = I.name;
    I.name = null;
    I.seed = (I.seed * 9301 + 49297) % 233280;
    I.next = 7 + 6 * (I.seed / 233280);
    return E;
  }
  const S = keysAt(IDLES[I.name].keys, I.t);
  return I.w >= 1 ? S : mixState(E.mouthPts ? E : calmState(), S, smoothU(I.w));
}
// Her face from an emotion's values (and a blink).
function faceOf(e, blink) {
  const eyes = [0, 1].map((i) => ({
    lid: e.lid[i], lift: e.lift, ik: e.ik, look: e.look, bot: e.bot, inner: e.inner, star: e.star > 0.5, wet: e.wet > 0.5, wonder: e.wonder > 0.5,
    closed: e.closed[i] || (blink && !e.closed[0] && !e.closed[1] ? 'blink' : null),
  }));
  return {
    eyes,
    mouth: { pts: e.mouthPts, thin: e.thin, open: e.open, o: e.o, pout: e.pout, tongue: e.tongue },
    blush: e.blush, lines: Math.round(e.lines), puff: e.puff > 0.5, tear: e.tear, brow: e.brow, winkN: !!e.closed[1] && !e.closed[0],
  };
}

// ---------- Her rig (2026-11-23, the player: "now she needs heavy rigging") ----------
// Every part on its joint: the deer body rides on the game's own deer legs (blankquad.js: they walk
// one foot at a time or trot in diagonal pairs, each foot planted, rolling and lifting, the body
// rocking and bobbing over the planted feet); her upper body turns at the waist, her head at the
// neck, her arms swing at the shoulders and bend at the elbows. Everything loose rides on springs
// fed by how her head and body move: the twin tails swing from their ties and bend, their tips
// lagging; the side locks sway; the bows' streamers flutter; the earrings, the tiara's drops and the
// antlers' charms swing and hang plumb; the blanket's tassels swing; the veil ripples and follows her
// head. Her ears twitch now and then, her tail flicks, she breathes and blinks. Nothing squashes or
// stretches: every motion is a part turning or moving.
let POSE = null;
// Her deer body, soft (2026-11-24, the player: "i don't want 1 big moving object, it should jiggle,
// be a bit realistic"): a warp every point of the body is drawn through (its outline, shading, fur,
// belly, ruff, blanket and stitching alike), so the body bends as flesh does. Its parts each ride a
// spring (rigStep `body`): the chest end and the rump end lift and settle as their legs land; the
// spine flexes with the stride, the hind half turning a touch about the middle of the back; the low
// belly hangs and swings a beat behind; the round of the haunch and the chest ruff jiggle. Parts only
// shift and bend: nothing grows or shrinks, and it is subtle. Her measures: the rump at x ~100, the
// chest at ~196, the back at y ~105, the belly at ~152.
const clamp01 = (v) => Math.min(1, Math.max(0, v));
function bodyWarp(B, [x, y]) {
  if (!B) return [x, y];
  const wF = smoothU(clamp01((x - 120) / 56));
  const fa = B.flex * (1 - wF);
  const c = Math.cos(fa);
  const sn = Math.sin(fa);
  let X = 148 + (x - 148) * c - (y - 112) * sn;
  let Y = 112 + (x - 148) * sn + (y - 112) * c;
  Y += B.chest * wF + B.rump * (1 - wF);
  const mb = smoothU(clamp01((y - 130) / 18)) * Math.sin(Math.PI * clamp01((x - 110) / 82));
  X += B.bellyX * mb;
  Y += B.bellyY * mb;
  const mr = smoothU(clamp01((126 - x) / 22)) * (1 - 0.5 * smoothU(clamp01((y - 140) / 12)));
  X += B.rumpX * mr;
  Y += B.rumpY * mr;
  const mc = smoothU(clamp01((x - 176) / 16)) * smoothU(clamp01((y - 116) / 14));
  Y += B.ruffY * mc;
  return [X, Y];
}
const warpOf = (B) => (B ? (p) => bodyWarp(B, p) : null);
// (how a point riding on the body has moved, as a transform: for her waist and her tail's root)
const shiftAt = (B, p) => {
  const q = bodyWarp(B, p);
  return new DOMMatrix().translate(q[0] - p[0], q[1] - p[1]);
};
const LEGDEFS = legDefs({ fore: { ...DEER.fore, top: [CX + DEER.fore.top[0], DEER.fore.top[1]] }, hind: { ...DEER.hind, top: [CX + DEER.hind.top[0], DEER.hind.top[1]] }, far: DEER.far }, (v) => v);
const LFORE = LEGDEFS.foreN.lens.reduce((a, b) => a + b, 0);
const RIG = { t: 0, u: 0, x: 0, spr: {}, prev: null, move: 'idle' };
function spr(name, goal, k, c, dt) {
  const v = RIG.spr[name] ?? (RIG.spr[name] = { x: goal, v: 0 });
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    v.v += (-k * (v.x - goal) - c * v.v) * h;
    v.x += v.v * h;
  }
  return v.x;
}
const kickSpr = (name, dv) => {
  if (RIG.spr[name]) RIG.spr[name].v += dv;
};
// One step of the rig: `move` idle, walk or trot.
function rigStep(dt, move, emo = null) {
  const E0 = idleMix(emo ?? calmState(), dt, emo);
  RIG.E = E0;
  RIG.t += dt;
  const t = RIG.t;
  const go = Math.min(1, Math.max(0, spr('go', move === 'idle' ? 0 : 1, 14, 7.5, dt)));
  const trot = Math.min(1, Math.max(0, spr('trot', move === 'trot' ? 1 : 0, 14, 7.5, dt)));
  const period = lerp(1.3, 0.74, trot);
  const cycle = lerp(28, 40, trot);
  RIG.u = (RIG.u + (dt / period) * Math.max(go, 0.0001)) % 1;
  RIG.x += (cycle / period) * go * dt;
  const u = RIG.u;
  // the legs: each foot's place through the step, the body over them
  const steps = {};
  for (const k of ['hindN', 'foreN', 'hindF', 'foreF']) {
    const g = stepAt(u, legPhase(k, trot, 0), 0, cycle, LFORE);
    steps[k] = { ...g, dx: g.dx * go, lift: g.lift * go };
  }
  const { fS, hS } = sinks(LEGDEFS, steps);
  const breath = Math.sin((t / 3.6) * TAU);
  const hopS = spr('hop', E0.hop, 40, 9, dt);
  // (her body sinks a touch at each footfall, eased rather than following every hoof exactly: it
  // jerked; the player's "her body looks extremely stiff", 2026-11-24)
  const sinkS = spr('sinkS', (fS + hS) * 0.5, 260, 30, dt);
  const bob = sinkS + trot * go * 0.9 * Math.abs(Math.sin(u * TAU * 2)) - hopS * 2.2 * Math.abs(Math.sin(t * TAU * 1.7));
  // Her deer body walks with a deer's grace (2026-11-24, the player: "this body ... she should have
  // some grace"): her back rocks gently and smoothly, the front dipping as her forelegs take her
  // weight and the hind end as her hind legs do, rather than jerking with each hoof; she surges
  // forward a touch with each step and eases back; her blanket's hem trails her and ripples, and each
  // tassel swings on its own (caparison).
  const fore = u * TAU * 2 - Math.PI;
  const rock = go * (1 - trot * 0.5) * 0.03 * Math.cos(fore);
  const pitch = spr('pitch', Math.atan2(fS - hS, 66) * (1 - 0.75 * go), 90, 16, dt) + rock;
  const surge = go * 0.7 * Math.sin(fore - 0.4);
  const Mb = new DOMMatrix().translate(surge, bob).multiply(rotAbout(CX - 30, 126, pitch));
  // (the soft body's parts: each landing hoof jolts its end of the body, which settles with a small
  // bounce; the belly hangs a little lower walking, bounces slower and swings against her surges, and
  // breathes when she stands; the haunch and the ruff jiggle; last frame's push, RIG.bax, swings them)
  const push = RIG.bax ?? 0;
  const body = {
    chest: spr('bChest', go * fS * 0.5, 230, 9, dt),
    rump: spr('bRump', go * hS * 0.5, 210, 8.5, dt),
    bellyY: spr('bBellyY', go * ((fS + hS) * 0.35 + 0.5) + (1 - go) * 0.35 * breath, 85, 4.6, dt),
    bellyX: spr('bBellyX', -push * 0.0035, 55, 4, dt),
    rumpX: spr('bRumpX', -push * 0.0025, 90, 5, dt),
    rumpY: spr('bRumpY', go * hS * 0.35, 150, 5.5, dt),
    ruffY: spr('bRuffY', go * fS * 0.3, 170, 5.5, dt),
    flex: go * 0.014 * Math.sin(fore + 0.5),
  };
  // Everything she wears and carries is soft too (2026-11-24, the player: "can you do it to her whole
  // stuff also?"): the moment a hoof lands (a foot's sink jumps), every loose thing gets a little jolt
  // and swings or bounces on its own spring and settles: the twin tails flare out, the side locks,
  // antler chains and charms, earrings, tiara drops and bow streamers swing, the skirt hem, sheer
  // sleeves, sash bow tails and veil bounce, the tassels sway. Her own body above the waist stays as
  // it is; only cloth, hair and trinkets move.
  const land = go * Math.min(1.5, Math.max(0, fS - (RIG.lastFS ?? fS)) + Math.max(0, hS - (RIG.lastHS ?? hS)));
  RIG.lastFS = fS;
  RIG.lastHS = hS;
  // (each landing's jolt goes the other way from the last, so loose things swing about where they
  // hang and settle, never pushed out and held there; the hair is moved by her head's own bounce)
  if (land > 0.05) {
    RIG.landN = (RIG.landN ?? 0) + 1;
    const j = land * (RIG.landN % 2 ? 1 : -1);
    for (const sd of [-1, 1]) kickSpr(`lock${sd}`, -sd * 0.2 * j);
    kickSpr('chain', 1.2 * j);
    kickSpr('charm', 1.4 * j);
    kickSpr('ringF', 1.2 * j);
    kickSpr('ringN', -1.2 * j);
    kickSpr('drop', 1.4 * j);
    kickSpr('stream', 1.2 * j);
    kickSpr('skY', 9 * j);
    kickSpr('slvN', 7 * j);
    kickSpr('slvF', -7 * j);
    kickSpr('sash0', 1.4 * j);
    kickSpr('sash1', -1.4 * j);
    kickSpr('veilY', 6 * j);
    for (let k = 0; k <= 8; k++) kickSpr(`tas${k}`, (k % 2 ? 0.9 : -0.9) * j);
  }
  const legs = {};
  for (const [k, L] of Object.entries(LEGDEFS)) {
    const g = steps[k];
    const T = xfPt(Mb, bodyWarp(body, L.top));
    // (an idle's raised forefoot: lifted and set forward, the wrist folding as it lifts)
    const pw = k === 'foreN' ? (E0.paw ?? [0, 0]) : [0, 0];
    const paw = [L.rest[3][0] + g.dx + pw[1], L.rest[3][1] - g.lift - pw[0]];
    const la = lowAngle(L, g);
    const a3 = lerp(L.a3, L.a3 + (la - L.a3) * (L.hind ? 0.85 : 0.62), go) - 0.75 * Math.min(1, pw[0] / 6);
    const pl = placeLeg(L, T, paw, a3);
    legs[k] = { js: [pl.T, pl.J1, pl.J2, pl.P], tilt: L.a3 - a3 };
  }
  // her upper body, head and arms
  const glance = smoothU(Math.min(1, Math.max(0, (t % 9 - 5.2) / 0.7))) - smoothU(Math.min(1, Math.max(0, (t % 9 - 7.4) / 0.8)));
  // Walking, she rides her own steps like a rider on a walking deer (2026-11-24, the player: "her body
  // looks extremely stiff, there is very little motion"): as her forelegs take her weight (twice a
  // stride) her upper body dips and rises a beat late, rocking forward and back with it; once a stride
  // she sways a little from side to side, her weight going from one side to the other; her head nods
  // and tilts a beat after her body rather than being held still. Standing, she breathes (her chest
  // and shoulders rising), shifts her weight slowly and tilts her head now and then. Smooth, with a
  // light bounce, never much.
  // (2026-11-24, the player: "more grace and less hunched over and less wiggle, jiggle is nice tho":
  // she rides upright and poised, her upper body balancing against the deer back's rocking (it no
  // longer tips forward with it), a gentle rise and fall, the sway and rock only a touch; the soft
  // body, cloth and hair keep their jiggle)
  const rideY = go * (1 - trot * 0.4) * 0.9 * (0.5 + 0.5 * Math.cos(fore - 0.7));
  const lean = -0.85 * pitch - 0.004 * go + 0.006 * trot * go * Math.sin(u * TAU * 2) + go * (0.005 * Math.sin(fore - 1.0) + 0.007 * Math.sin(u * TAU - 0.5)) + (1 - go) * (0.006 * breath + 0.01 * Math.sin((t / 6.1) * TAU)) + E0.lean;
  const Mu = Mb.multiply(shiftAt(body, [CX + 1, 106])).multiply(rotAbout(CX + 1, 106, lean)).multiply(new DOMMatrix().translate(0, rideY - 0.9 * (breath * 0.5 + 0.5) * (1 - go)));
  const head = spr('head', -0.85 * (pitch + lean) + 0.015 * Math.sin((t / 6.4) * TAU + 1) * (1 - go) + go * (0.008 * Math.sin(fore - 1.8) + 0.01 * Math.sin(u * TAU - 1.4)) + 0.03 * glance * (1 - go) * (emo ? 0 : 1) + E0.head, 70, 15, dt);
  // (walking, she carries her head a touch higher, her neck long; only a soft nod with her steps)
  const headDy = spr('headDy', E0.headDy + go * (0.25 * (0.5 + 0.5 * Math.cos(fore - 1.5)) - 0.4), 70, 15, dt);
  const Mhr = new DOMMatrix().translate(0, headDy).multiply(rotAbout(HX, 64, head));
  const Mh = Mu.multiply(Mhr);
  // Her arms (2026-11-24, the player: "her hands just sway left and right while walking, so stiff"):
  // her upper body faces you, so walking her arms swing toward you and away (in depth, drawn as they
  // show from the front: poseArms), not across the screen: opposite each other, in time with her
  // steps, about 22 degrees each way; each elbow bends forward as its arm comes toward you (the
  // forearm rising and shortening as it points at you) and eases nearly straight as it swings back,
  // a beat behind the shoulder; each shoulder reaches and lifts a touch with its arm; the relaxed
  // hands trail the swing and catch up, and the sheer sleeves' bell cuffs trail behind like cloth.
  // Standing, the arms hang soft, elbows bent a little inward, and breathe. (`sa`/`ea` turn the arm
  // and the forearm on the screen, clockwise; `da`/`db` swing them in depth, toward you.)
  const armW = Math.min(1, Math.max(0, spr('armW', E0.armW, 26, 9, dt)));
  const fid = 0.06 * Math.sin(t * 5.2);
  const arm = {};
  const armTurn = {};
  for (const [k, sd] of [['N', 1], ['F', -1]]) {
    // (+1 at the front of its swing, -1 at the back)
    const ph = sd * Math.cos(u * TAU - 0.15);
    const da = spr(`da${k}`, 0.3 * ph * go, 120, 17, dt);
    const fwd = Math.min(1, Math.max(0, 0.5 + da / 0.76));
    const db = spr(`db${k}`, (0.1 + 0.32 * fwd ** 1.5) * go + 0.08 * (1 - go), 70, 9, dt);
    const sa = 0.025 * breath * (1 - go);
    const ea = sd * 0.06 * (1 - go);
    const tv = (da + db - (RIG.turn?.[k] ?? da + db)) / Math.max(dt, 1e-3);
    (RIG.turn ??= {})[k] = da + db;
    armTurn[k] = tv;
    const hw = spr(`hw${k}`, Math.max(-0.25, Math.min(0.25, tv * 0.045)), 90, 12, dt);
    const em = sd > 0 ? E0.armN : E0.armF;
    const off = 1 - armW;
    arm[k] = [lerp(sa, em[0] + sd * fid * 0.3, armW), lerp(ea, em[1] + sd * fid, armW), hw * off + (em[4] ?? 0) * armW, 1.1 * ph * go * off, -0.6 * Math.max(0, ph) * go * off - (em[5] ?? 0) * armW, da * off + (em[2] ?? 0) * armW, db * off + (em[3] ?? 0) * armW];
  }
  // how her head is moving (its velocity and acceleration), to drive the springs
  const hp = xfPt(Mh, [HX, HY - 18]);
  const bp = xfPt(Mb, [CX - 40, 128]);
  const prev = RIG.prev ?? { hp, bp, hv: [0, 0], bv: [0, 0] };
  const hv = [(hp[0] - prev.hp[0]) / dt - RIG.x * 0, (hp[1] - prev.hp[1]) / dt];
  const bv = [(bp[0] - prev.bp[0]) / dt, (bp[1] - prev.bp[1]) / dt];
  const ha = [(hv[0] - prev.hv[0]) / dt, (hv[1] - prev.hv[1]) / dt];
  const ba = [(bv[0] - prev.bv[0]) / dt, (bv[1] - prev.bv[1]) / dt];
  RIG.prev = { hp, bp, hv, bv };
  RIG.bax = Math.max(-400, Math.min(400, (bv[0] - prev.bv[0]) / dt)) + go * 60;
  const clampA = (v) => Math.max(-400, Math.min(400, v));
  const hax = clampA(ha[0]) + go * 60; // (moving forward, the air pushes loose things back)
  const hay = clampA(ha[1]);
  const bax = clampA(ba[0]) + go * 60;
  const phH = pitch + lean + head;
  // Her hair flows (2026-11-24, the player: "nothing changed much, hair also please"): walking, the
  // twin tails swing like pendulums with her body's sway, flare out a little a beat after each
  // forefoot lands, trail behind her as she goes, and their tips whip a beat later still; the side
  // locks sway with them; the long hair down her back sways and trails (hairBack). Clockwise is +:
  // a tail's lower part going back, the way the air pushes it as she walks to the right.
  const hSway = go * Math.sin(u * TAU - 1.0);
  const hDip = go * (0.5 + 0.5 * Math.cos(fore - 1.4));
  const tails = [-1, 1].map((sd) => {
    const g1 = -phH * 0.85 - hax * 0.0007 + sd * hay * 0.0006 + 0.03 * Math.sin((t / 3.1) * TAU + sd) + 0.09 * hSway - sd * 0.07 * hDip + go * 0.05;
    const a1 = spr(`tail1${sd}`, g1, 30, 4.2, dt);
    const a2 = spr(`tail2${sd}`, a1 + 0.05 * hSway - hax * 0.0005, 44, 5, dt);
    const a3 = spr(`tail3${sd}`, a2 + sd * hay * 0.0003 - hax * 0.0003 + 0.06 * hSway, 58, 4.4, dt);
    return [a1 * sd * sd, a2, a3];
  });
  const locks = [-1, 1].map((sd) => spr(`lock${sd}`, -phH * 0.5 - hax * 0.0004 + 0.008 * Math.sin((t / 2.7) * TAU + sd) + 0.05 * hSway - sd * 0.03 * hDip + go * 0.02 + (sd > 0 ? E0.tuck ?? 0 : 0), 40, 5, dt));
  const backHair = spr('backHair', 1.6 * hSway + go * 0.8 - hax * 0.004, 34, 4.2, dt);
  const drop = spr('drop', -phH - hax * 0.0016, 70, 3.5, dt);
  const earT = Math.floor(t / 4.3);
  if (RIG.earT !== earT) {
    RIG.earT = earT;
    if (t > 1) kickSpr(earT % 2 ? 'earN' : 'earF', earT % 3 ? -2.4 : 2);
  }
  // (her ears bob a little with her steps)
  const earStep = go * 0.03 * Math.sin(fore - 2.2);
  const ear = [spr('earF', E0.ear + earStep + 0.02 * Math.sin((t / 3.3) * TAU), 120, 9, dt), spr('earN', E0.ear + earStep + 0.02 * Math.sin((t / 3.7) * TAU + 1), 120, 9, dt)];
  const earring = [spr('ringF', -phH + ear[0] - hax * 0.0016, 60, 3, dt), spr('ringN', -phH - ear[1] - hax * 0.0016, 60, 3, dt)];
  const chain = spr('chain', -hax * 0.0025 - phH * 0.6, 40, 3.2, dt);
  const charm = spr('charm', -phH - hax * 0.0018, 60, 3, dt);
  const tassel = spr('tassel', -pitch - bax * 0.0016 + 0.12 * trot * go * Math.sin(u * TAU * 2), 50, 3.5, dt);
  // (the blanket: its hem trails behind as she goes and swings back as she stops, bounces a little
  // with her steps, and a slow ripple runs back along it; each tassel hangs from the hem on its own
  // spring, so they swing out of step with each other)
  const clothX = spr('clothX', -go * 2.2 - bax * 0.007, 30, 4, dt);
  const clothY = spr('clothY', go * 0.9 * Math.cos(fore - 1.2), 60, 5.5, dt);
  const tassels = [];
  for (let k = 0; k <= 8; k++) tassels.push(spr(`tas${k}`, -pitch - bax * 0.0018 + go * 0.3 * Math.sin(fore - k * 0.55) + 0.1 * trot * go * Math.sin(u * TAU * 2), 44 + k * 5, 3.2, dt));
  const flickT = Math.floor(t / 3.1);
  if (RIG.flickT !== flickT) {
    RIG.flickT = flickT;
    if (t > 1) kickSpr('tailflick', 9);
  }
  const tail = spr('tailflick', -0.12 * go + 0.1 * go * Math.sin(u * TAU * 2) + 0.1 * go * Math.sin(u * TAU + 0.8) + E0.tail + E0.wag * 0.22 * Math.sin(t * 13), 90, 7, dt);
  const stream = spr('stream', -phH * 0.6 - hax * 0.0008, 40, 4, dt);
  // (the skirt's hem trails as she goes and bounces as she lands; the sheer sleeves bounce below the
  // elbow; the sash bow's two tails swing from the knot; the veil bobs)
  const sag = (k) => Math.max(-1.2, Math.min(1.2, -hay * k));
  const skirtS = { x: spr('skX', -go * 1.6 - hax * 0.002 + go * 0.5 * Math.sin(u * TAU - 1.4) + (E0.skirtPat ?? 0), 40, 4.2, dt), y: spr('skY', sag(0.003), 85, 5, dt), ph: u * TAU, go };
  const sleeveS = { N: spr('slvN', sag(0.0028), 76, 4.6, dt), F: spr('slvF', sag(0.0028), 72, 4.6, dt) };
  const sash = [spr('sash0', -phH * 0.7 - hax * 0.002 + go * 0.2 + 0.15 * hSway, 46, 3.8, dt), spr('sash1', -phH * 0.7 - hax * 0.002 + go * 0.2 + 0.15 * hSway, 42, 3.8, dt)];
  const veilY = spr('veilY', sag(0.003), 56, 4.2, dt);
  // (the bell cuffs: trailing the arm's swing and the way she's going, swinging on a little)
  const cuff = {};
  for (const k of ['N', 'F']) cuff[k] = spr(`cf${k}`, Math.max(-0.35, Math.min(0.35, armTurn[k] * 0.08)) + hax * 0.0004, 50, 5, dt);
  const blink = t % 3.7 > 3.55;
  RIG.fxT = (RIG.fxT ?? 0) + dt;
  const fx = { t: RIG.fxT, hearts: spr('fxH', E0.hearts, 20, 9, dt), sparkle: spr('fxS', E0.sparkle, 20, 9, dt), sweat: spr('fxW', E0.sweat, 30, 9, dt) };
  POSE = { farFront: (E0.farFront ?? 0) > 0.5, nearFront: (E0.nearFront ?? 0) > 0.5, fx, t, go, trot, u, Mb, Mu, Mh, Mhr, legs, arm, cuff, body, skirt: skirtS, sleeve: sleeveS, sash, veilY, cloth: { x: clothX, y: clothY, ph: u * TAU, go }, tassels, tails, locks, backHair, drop, ear, earring, chain, charm, tassel, tail, stream, veil: 0.7 + 2.6 * go, blink };
  return POSE;
}


// ====================================================================================================
// The Rootling Dryad (2026-11-24, the player: Root Tendril pick "A", "dont make her child looking ...
// adult kinda mature", then "1": a soft, cute, clearly grown-up face like Fawnelle's). Drawn in the
// same hand-painted way, every piece her own: green-gold eyes like sunlight through leaves, rosy
// lips, leaf-green hair with leaves in it, pointed leaf ears, a twig crown with blossoms, a fitted
// bark bodice laced with vine, a layered leaf skirt, and below it a living root that curls along the
// floor (the serpent base's lower body), bark with moss, sprouts, blossoms and rootlets.
// ====================================================================================================

const BK = { hi: '#d9b08a', lt: '#c49572', base: '#a6795a', sh: '#835c44', deep: '#5f4132', grain: '#4e3428' };
const LF = { hi: '#d8f4b0', lt: '#a8dc7c', base: '#7cc25a', sh: '#579a42', deep: '#3d7634', vein: '#c8ec9c' };
const MS = { lt: '#b8e08a', base: '#86c062', sh: '#5f9a48' };
const PK = { petal: '#ffc2d6', deep: '#f088ac', centre: '#ffe27a' };
// (her chosen look, 2026-11-24: ringlets, centre-parted bangs, the leaf wreath, the short skirt; a dreamy
// face with her eyes a little narrowed)
let DRY = { hair: 'leafy', bangs: 'curtain', crown: true, flower: 'near', skirt: 'short', ears: true, mood: 'dreamy', narrow: 0.5 };

// A leaf: from its stalk at (x, y) out along angle `a`, `len` long and `w` wide, a soft point, its
// midrib and two veins, lit toward its tip.
function leaf(x, y, a, len, w, { c = LF, line = true, far = false } = {}) {
  const P = (u, v) => [x + Math.cos(a) * u * len - Math.sin(a) * v * w, y + Math.sin(a) * u * len + Math.cos(a) * v * w];
  const pts = [P(0, 0), P(0.18, 0.36), P(0.5, 0.5), P(0.82, 0.3), P(1, 0), P(0.82, -0.3), P(0.5, -0.5), P(0.18, -0.36)];
  const shape = smooth(pts, 4);
  add(shape, lin(...P(0, 0), ...P(1, 0), [[0, far ? c.sh : c.base], [0.7, far ? c.base : c.lt], [1, far ? c.lt : c.hi]]), line, { lw: 1.1 });
  detail(poly(ribbon([P(0.05, 0.05), P(0.5, 0.18), P(0.95, 0.04)], (u) => w * 0.36 * Math.sin(Math.PI * u), { n: 4 })), rgba(c.sh, 0.45), { clip: shape, blur: 0.3 });
  lineOf(cr([P(0.04, 0), P(0.5, 0.02), P(0.92, 0)], false, 4), rgba(c.vein, far ? 0.4 : 0.75), Math.max(0.3, w * 0.07), { clip: shape });
  for (const u of [0.35, 0.6]) for (const s of [-1, 1]) lineOf([P(u, 0.01), P(u + 0.14, s * 0.28)], rgba(c.vein, 0.45), Math.max(0.25, w * 0.04), { clip: shape });
  return shape;
}
// A five-petal blossom (the helper's) in her pinks.
const flower = (x, y, r, a = 0) => blossom(x, y, r, a, PK.petal, PK.deep, PK.centre);

// ---------- The leaf skirt ----------
// Big soft leaves hanging from her waist round her hips, two layers (the back one deeper), covering
// where she becomes the root, their tips flaring a little; a vine belt with a blossom on her hip.
function leafSkirt() {
  const top = 100.6;
  const back = [[-17, 0.3], [-11, 0.1], [-4, -0.05], [3, 0.05], [10, 0.12], [17, 0.3]];
  for (const [dx, tilt] of back) leaf(CX + dx * 1.04, top + 1, Math.PI / 2 + tilt + dx * 0.012, DRY.skirt === 'long' ? 31 : 25, 12.4, { far: true });
  const front = [[-14, 0.36], [-7, 0.16], [0, 0.02], [7, -0.1], [14, -0.3]];
  for (const [dx, tilt] of front) leaf(CX + dx, top + 0.4, Math.PI / 2 - tilt * 0.6 + dx * 0.01, DRY.skirt === 'long' ? 27 : 22, 11.6, {});
  // the vine belt, a twist of green, a blossom and two little leaves on her near hip
  const belt = [[CX - 13.4, 99.6], [CX - 6, 101.6], [CX + 2, 102.2], [CX + 9, 101.4], [CX + 13.6, 99.6]];
  add(poly(ribbon(belt, () => 2.2, { n: 6, caps: true })), lin(CX, 98.6, CX, 103, [[0, LF.lt], [1, LF.sh]]), true, { lw: 1 });
  for (let k = 0; k < 6; k++) {
    const q = along(belt, (k + 0.5) / 6).p;
    lineOf([[q[0] - 1, q[1] - 0.9], [q[0] + 1, q[1] + 0.9]], rgba(LF.deep, 0.6), 0.45);
  }
  leaf(CX + 9.4, 101, -0.5, 6, 3.4);
  leaf(CX + 9.4, 101, 0.9, 5.4, 3);
  flower(CX + 9.6, 101.2, 3.2, 0.3);
}

// ---------- The bark bodice ----------
// Fitted to her torso as the gown was (the base's own outline a hair larger): soft bark, a light on
// each curve of the bust and a shade beneath, its grain running down it, a sweetheart neckline edged
// in moss with tiny blossoms, laced up the front with a green vine.
function barkBodice() {
  const R = [[186.4, 72.4], [190, 70.8], [193.4, 72.8], [194.4, 76.4], [194.2, 81.2], [194.2, 86], [191.2, 97], [192.2, 101]];
  const pts = [...R, [186, 102.6], [181, 103.6], [176, 102.6], ...mirror(R).reverse(), [176, 72.4], [178.6, 74.4], [181, 75.6], [183.4, 74.4]];
  const body = smooth(pts, 4);
  add(body, lin(166, 0, 196, 0, [[0, BK.sh], [0.4, BK.base], [0.74, BK.lt], [1, BK.base]]));
  glow(body, 187.4, 80.6, 6, BK.hi, 0.6);
  glow(body, 175.2, 81.2, 4.4, BK.lt, 0.4);
  for (const [x0, x1] of [[170, 178.6], [183.6, 192.2]]) detail(poly(ribbon([[x0, 86.8], [(x0 + x1) / 2, 88.4], [x1, 87]], (u) => 2 * Math.sin(Math.PI * u), { n: 5 })), rgba(BK.deep, 0.34), { clip: body, blur: 0.4 });
  detail(poly(ribbon([[168.8, 74], [168.4, 86], [170.4, 99]], () => 3.6, { n: 4 })), rgba(BK.deep, 0.45), { clip: body, blur: 0.8 });
  for (const [x0, x1, al] of [[172, 175, 0.32], [176.6, 178.2, 0.28], [186.4, 185.2, 0.28], [190.6, 188.2, 0.3]]) lineOf(cr([[x0, 76], [lerp(x0, x1, 0.5) + 0.4, 88], [x1, 101]], false, 4), rgba(BK.grain, al), 0.45, { clip: body });
  // the vine lacing up the front
  const lace = [];
  for (let k = 0; k < 5; k++) {
    const y = 80 + k * 4.4;
    lace.push([[CX - 2.2, y], [CX + 2.4, y + 2.4]], [[CX + 2.2, y], [CX - 2.2, y + 2.4]]);
  }
  for (const [a, b] of lace) lineOf([a, b], LF.sh, 0.8);
  for (const [a, b] of lace) lineOf([a, b].map(([x, y]) => [x, y - 0.25]), rgba(LF.lt, 0.9), 0.35);
  // the moss neckline, little blossoms in it
  const neck = [[169.6, 75.6], [173, 72.6], [177.4, 74.6], [181, 76.4], [184.6, 74.6], [189, 72.6], [192.4, 75.6]];
  for (let k = 0; k < 11; k++) {
    const q = along(neck, k / 10).p;
    add(ell(q[0], q[1], 2.1, 1.7), lin(q[0], q[1] - 1.7, q[0], q[1] + 1.7, [[0, MS.lt], [1, MS.sh]]), true, { lw: 0.9 });
  }
  flower(172.6, 73.2, 1.9, 0.4);
  flower(189.6, 73.2, 2.1, 1.2);
  return body;
}

// ---------- Her ears, twig crown and flower ----------
// Pointed leaf ears: long and soft, out and up from under her hair, pink inside.
function leafEar(s) {
  const b = [HX + s * 19.6, HY + 5.4];
  const P = (dx, dy) => [b[0] + s * dx, b[1] + dy];
  const ear = smooth([P(-1.2, -4.6), P(4.4, -8.6), P(10.6, -14.6), P(13.6, -16.4), P(11.6, -11.6), P(8.6, -4), P(4.4, 2.4), P(-0.4, 3.4)], 4);
  add(ear, lin(b[0], b[1] - 14, b[0], b[1] + 3, s > 0 ? [[0, SK.hi], [1, SK.base]] : [[0, SK.base], [1, SK.sh1]]), true, { lw: 1.4 });
  detail(smooth([P(1.4, -3.6), P(5.6, -7.6), P(10.2, -12.6), P(8.4, -7.6), P(5, -1.6), P(1.6, 0.6)], 3), rgba(SK.blush, 0.45), { clip: ear, blur: 0.5 });
  lineOf(cr([P(1.6, -3.2), P(6, -7.4), P(10.6, -13)], false, 4), rgba(SK.sh2, 0.6), 0.5, { clip: ear });
}
// A wreath of little leaves and blossoms over her hair, round her crown.
function wreath() {
  const arc = [[HX - 21, HY - 11], [HX - 14, HY - 21], [HX - 3, HY - 25.6], [HX + 9, HY - 24.6], [HX + 18.6, HY - 17], [HX + 22.4, HY - 8.6]];
  for (let k = 0; k < 13; k++) {
    const q = along(arc, k / 12);
    const a = Math.atan2(q.d[1], q.d[0]) + (k % 2 ? -0.9 : 0.9) * (k % 4 < 2 ? 1 : -1) * 0.6;
    leaf(q.p[0], q.p[1], a + (k % 2 ? -0.5 : 0.5), 6.4, 3.4, { far: k % 3 === 0 });
  }
  for (const [u, r] of [[0.18, 2.2], [0.42, 2.8], [0.7, 2.2], [0.9, 1.8]]) {
    const q = along(arc, u).p;
    flower(q[0], q[1] - 0.6, r, u * 4);
  }
}
function twigs(s) {
  const b = [HX + s * 9, HY - 24];
  const ln = [b, [b[0] + s * 4, b[1] - 8], [b[0] + s * 10, b[1] - 14], [b[0] + s * 17, b[1] - 16.6]];
  add(poly(ribbon(ln, (u) => lerp(2.6, 1, u), { n: 6 })), lin(b[0], b[1], ln[3][0], ln[3][1], [[0, BK.base], [1, BK.lt]]), true, { lw: 1.1 });
  const f = along(ln, 0.45).p;
  add(poly(ribbon([f, [f[0] - s * 1, f[1] - 5], [f[0] + s * 0.6, f[1] - 9]], (u) => lerp(1.6, 0.7, u), { n: 4 })), BK.base, true, { lw: 1 });
  leaf(f[0] + s * 0.6, f[1] - 9, -Math.PI / 2 + s * 0.3, 7, 3.8);
  leaf(ln[3][0], ln[3][1], s > 0 ? -0.3 : Math.PI + 0.3, 7.6, 4, {});
  leaf(...along(ln, 0.75).p, s > 0 ? -1.2 : Math.PI + 1.2, 6, 3.2, {});
}
// The flower in her hair: a big blossom over her near temple, two leaves, a bud.
function hairFlower() {
  if (DRY.flower === 'none') return;
  const s = DRY.flower === 'far' ? -1 : 1;
  const x = HX + s * 16.6;
  const y = HY - 14.6;
  leaf(x, y, s > 0 ? 0.3 : Math.PI - 0.3, 8.6, 4.4);
  leaf(x, y, s > 0 ? -1.1 : Math.PI + 1.1, 7.6, 4);
  flower(x, y, 5.4, 0.2);
  bud(x - s * 6.4, y - 3, 1.8, -s * 0.5, PK.petal, PK.deep);
}
// Little leaves woven through the hair, here and there down her locks.
function hairLeaves() {
  for (const [dx, y, a, len] of [[-24.6, HY + 20, 2.2, 5.6], [25.6, HY + 30, 0.9, 5.2], [-26.4, HY + 44, 2.5, 4.8], [24.4, HY + 52, 0.6, 4.6]]) leaf(FR_MID + dx, y, a, len, 2.8, {});
  // (her leafy look, 2026-11-27: one blossom tucked into the locks on her near side, two leaves under
  // it, so the eye finds a soft pink accent in the green)
  if (HAIR_LOOK === 'leafy') {
    const x = FR_MID + 26.4;
    const y = HY + 15;
    leaf(x, y, 0.5, 7, 3.6);
    leaf(x, y, 2.3, 6, 3.2);
    flower(x, y, 3.8, 0.4);
  }
}
// Leaf armlets round her upper arms.
function armlet(k) {
  const A = ARM[k];
  const far = k === 'F';
  const p = L2(A.sh, A.el, 0.56);
  const s = far ? -1 : 1;
  add(poly(ribbon([[p[0] - 4.2, p[1] - 0.6], [p[0], p[1] + 0.6], [p[0] + 4.2, p[1] - 0.6]], () => 1.6, { n: 4 })), far ? LF.sh : LF.base, true, { lw: 1 });
  if (!far) {
    leaf(p[0] + s * 3.4, p[1] - 0.2, 0.6, 5.4, 3);
    leaf(p[0] + s * 3.4, p[1] - 0.2, -0.5, 4.6, 2.6);
  }
}
function dryNeck() {
  const nk = smooth([[176.2, 55], [185.8, 55], [186.6, 75], [175.4, 75]], 2);
  add(nk, SK.base);
  detail(smooth([[175.5, 58], [186.6, 58], [186.8, 64.6], [175.2, 64.6]], 2), rgba(SK.sh1, 0.85), { clip: nk });
  detail(smooth([[175.5, 57.4], [186.6, 57.4], [186.6, 60.6], [175.5, 60.6]], 2), rgba(SK.sh2, 0.5), { clip: nk });
  // (the collarbones, faint)
  for (const s of [-1, 1]) lineOf(cr([[HX + s * 3, 70.8], [HX + s * 7.6, 71.6], [HX + s * 11.4, 70.8]], false, 3), rgba(SK.sh2, 0.45), 0.5);
}
function dryShoulders() {
  // her bare shoulders and chest above the bodice: the torso's own skin
  add(TORSO, lin(166, 0, 196, 0, [[0, SK.sh1], [0.45, SK.base], [1, SK.hi]]));
}


// (her braids are tied with blossoms, not ribbons)
function hairBow(x, y, s, size = 1) {
  leaf(x, y, s > 0 ? 0.5 : Math.PI - 0.5, 6 * size, 3.2 * size);
  leaf(x, y, s > 0 ? -0.8 : Math.PI + 0.8, 5.4 * size, 3 * size);
  flower(x, y, 3.4 * size, s);
}

// ---------- The serpent base (copied from blankbases.js, so the base itself stays clean) ----------
// Its measurements (a third of a game pixel; the ground at 214, its middle at x 150) and its tail in
// four pieces, as the base lays them: [piece, centre line, width at its start, width at its end],
// with the joints they turn at (serp0 where the body meets the ground, then serp1, serp2).
const SB = { cx: 150, g: 214, head: [62, 22, 24], neck: [85, 90], sh: [92, 13.6], chest: [100, 13.8], waist: [114, 10.6], hips: [126, 14], crotch: [134, 4] };
const SERPENT = [
  ['tailC', [[50, 208], [39, 208], [31, 204], [29, 196], [35, 190.4]], 12, 3],
  ['tailB', [[88, 204], [68, 206], [50, 208]], 20, 12],
  ['tailA', [[128, 201], [108, 202.5], [88, 204]], 26, 20],
  ['lower', [[150, 124], [155, 150], [154, 174], [146, 197], [128, 201]], 31, 26],
];
const SJ = { serp0: [128, 201], serp1: [88, 204], serp2: [50, 208] };
// Her upper body sits on the serpent's: drawn in the design frame it was first drawn in and moved
// onto the base (its shoulders, waist and hips land on the serpent's within a pixel).
const UPPER = () => new DOMMatrix().translate(-30, 19);
// How her tail lies (each piece turned at its joint; 0: the base's own rest).
let TAILPOSE = { A: 0, B: 0, C: 0 };
// (in the game: the tail's turns from the rig, as matrices, and how open the sprout at its tip is)
let ROOT_T = null;
let ROOT_BLOOM = 0;

// ---------- The root ----------
// Her lower body is the serpent base's tail dressed as a living root. The base's four pieces still
// turn at their joints (TAILPOSE, the rig), but the root is painted as ONE piece along all of them:
// each piece's centre line is turned by its joints and the four are joined end to end into one line,
// so there is one outline, one light and one grain from her hips to the tip, and nothing ever sits
// on top of anything else at a joint.
// (each piece's turn: the joints, each carrying the pieces past it)
function tailMats() {
  if (ROOT_T) return ROOT_T;
  const A = rotAbout(...SJ.serp0, TAILPOSE.A);
  const B2 = A.multiply(rotAbout(...SJ.serp1, TAILPOSE.B));
  const C2 = B2.multiply(rotAbout(...SJ.serp2, TAILPOSE.C));
  return { lower: null, tailA: A, tailB: B2, tailC: C2 };
}
// The whole root's centre line (dense) and its width at each point.
function rootLine() {
  const M = tailMats();
  const P = Object.fromEntries(SERPENT.map(([n, line, w0, w1]) => [n, { line, w0, w1 }]));
  const pts = [];
  const ws = [];
  for (const n of ['lower', 'tailA', 'tailB', 'tailC']) {
    const d = cr(P[n].line, false, 6).map((q) => xfPt(M[n], q));
    d.forEach((q, i) => {
      if (pts.length && i === 0) return;
      pts.push(q);
      ws.push(lerp(P[n].w0, P[n].w1, i / (d.length - 1)));
    });
  }
  const W = (u) => {
    const f = Math.max(0, Math.min(ws.length - 1, u * (ws.length - 1)));
    const i = Math.min(ws.length - 2, Math.floor(f));
    return lerp(ws[i], ws[i + 1], f - i);
  };
  return { pts, W };
}
function serpentRoot() {
  detail(ell(100, SB.g - 0.6, 62, 2.8), rgba('#3a2d4f', 0.14), { blur: 1.4 });
  const { pts, W } = rootLine();
  const outline = ribbon(pts, W, { n: 1, caps: true });
  const shape = poly(cr(outline, true, 2));
  // one light for all of it, from the upper right: lit where it comes down in front of her and along
  // its top on the floor, deepening toward the far end and underneath
  add(shape, lin(SB.cx + 18, 132, 44, SB.g, [[0, BK.lt], [0.35, BK.base], [0.8, BK.base], [1, BK.sh]]));
  // (round like a branch: a soft deeper edge down both sides, a sheen along its middle)
  for (const k of [-0.9, 0.9]) detail(poly(ribbon(sideOf(pts, W, k, 1), (u) => W(u) * 0.24 + 0.3, { n: 1 })), rgba(BK.deep, 0.42), { clip: shape, blur: 0.9 });
  detail(poly(ribbon(sideOf(pts, W, -0.18, 1), (u) => W(u) * 0.2, { n: 1 })), rgba(BK.hi, 0.42), { clip: shape, blur: 1 });
  // (the shade where it comes down behind her, and underneath where it lies on the floor)
  detail(shape, lin(SB.cx - 15, 0, SB.cx + 2, 0, [[0, rgba(BK.deep, 0.42)], [1, rgba(BK.deep, 0)]]), { clip: smooth([[SB.cx - 30, 118], [SB.cx + 20, 118], [SB.cx + 20, 190], [SB.cx - 30, 190]], 1) });
  detail(shape, lin(0, SB.g - 12, 0, SB.g, [[0, rgba(BK.deep, 0)], [1, rgba(BK.deep, 0.5)]]), { clip: shape });
  // the grain: long fine lines all the way along it, a little wavy
  for (const [k, al] of [[-0.6, 0.36], [-0.24, 0.3], [0.1, 0.28], [0.44, 0.24]]) {
    const sl = sideOf(pts, W, k, 1).map(([x, y], i) => [x + Math.sin(i * 0.45 + k * 9) * 0.4, y + Math.cos(i * 0.45 + k * 7) * 0.3]);
    lineOf(sl, rgba(BK.grain, al), 0.5, { clip: shape });
  }
  // moss, sprouts, blossoms and a knot, each riding on its own piece
  const M = tailMats();
  const P = Object.fromEntries(SERPENT.map(([n, line, w0, w1]) => [n, { line: cr(line, false, 4), w: (u) => lerp(w0, w1, u) }]));
  const dress = {
    tailC: [['sprout', 0.9, 0.5], ['moss', 0.3, 0.6]],
    tailB: [['moss', 0.3, 0.75], ['flower', 0.55, 2], ['moss', 0.75, 0.7]],
    tailA: [['moss', 0.2, 0.9], ['sprout', 0.45, -0.3], ['flower', 0.62, 2.6], ['moss', 0.8, 1]],
    lower: [['knot', 0.42, 2.2]],
  };
  for (const n of ['tailC', 'tailB', 'tailA', 'lower']) withXF(M[n], () => rootDress(P[n], 1, dress[n]));
  // the sprout at the tip of her root, opening into a blossom as she tends it
  if (ROOT_BLOOM > 0.02) {
    withXF(M.tailC, () => {
      const q = along(P.tailC.line, 0.97);
      const k = ROOT_BLOOM;
      const c = [q.p[0] + 1.6, q.p[1] - 5 - 3 * k];
      lineOf(cr([[q.p[0], q.p[1] - 1], [q.p[0] + 0.6, q.p[1] - 3], c], false, 3), MS.sh, 0.9);
      leaf(c[0], c[1] + 1, -0.4, 4 + 2 * k, 2.4 + k, {});
      leaf(c[0], c[1] + 1, Math.PI + 0.5, 3.6 + 2 * k, 2.2 + k, {});
      flower(c[0], c[1] - 1, 1.2 + 3 * k, 0.4);
    });
  }
}
// Moss, sprouts and blossoms on a piece, along its top (`top`: which side of its line is up).
function rootDress(piece, top, bits) {
  const { line, w } = piece;
  for (const [kind, u, s] of bits) {
    const q = along(line, u);
    const k = w(u) * 0.44 * top;
    const c = [q.p[0] + q.n[0] * k, q.p[1] + q.n[1] * k];
    if (kind === 'moss') {
      const clump = join(ell(c[0], c[1], 3.6 * s, 2.2 * s), ell(c[0] - 2.4 * s, c[1] + 0.6, 2.4 * s, 1.6 * s), ell(c[0] + 2.6 * s, c[1] + 0.5, 2.2 * s, 1.5 * s));
      add(clump, lin(c[0], c[1] - 2.4 * s, c[0], c[1] + 2 * s, [[0, MS.lt], [0.6, MS.base], [1, MS.sh]]), true, { lw: 1 });
      detail(ell(c[0] - 0.6, c[1] - 1, 1.4 * s, 0.6 * s), rgba('#ffffff', 0.45), { clip: clump, blur: 0.3 });
    } else if (kind === 'sprout') {
      const a = -Math.PI / 2 + s;
      const len = 4;
      lineOf(cr([c, [c[0] + Math.cos(a) * len * 0.5, c[1] + Math.sin(a) * len * 0.5 - 0.6], [c[0] + Math.cos(a) * len, c[1] + Math.sin(a) * len]], false, 3), MS.sh, 0.8);
      const e = [c[0] + Math.cos(a) * len, c[1] + Math.sin(a) * len];
      leaf(e[0], e[1], a - 0.7, 5.4, 3, {});
      leaf(e[0], e[1], a + 0.6, 4.6, 2.6, {});
    } else if (kind === 'flower') flower(c[0], c[1] - 1, s, u * 3);
    else if (kind === 'knot') {
      const a = Math.atan2(q.d[1], q.d[0]);
      detail(ell(q.p[0], q.p[1], s, s * 0.66, a), rgba(BK.deep, 0.55));
      detail(ell(q.p[0] + 0.3, q.p[1] - 0.3, s * 0.5, s * 0.3, a), rgba(BK.hi, 0.6));
    }
  }
}
// ---------- Her, whole, on the serpent base ----------
function buildDryad(mood = 'idle') {
  items = [];
  HAIR_LOOK = DRY.hair;
  BANG_LOOK = DRY.bangs;
  // (how narrowed her eyes are, on top of every expression)
  EYE_NARROW = DRY.narrow ?? 0;
  ARM = ARM0;
  serpentRoot();
  withXF(UPPER(), () => {
    longHair();
    hairBack();
    if (DRY.ears) {
      leafEar(-1);
      leafEar(1);
    }
    armSkin('F');
    armlet('F');
    dryShoulders();
    leafSkirt();
    barkBodice();
    armSkin('N');
    armlet('N');
    dryNeck();
    detail(ell(HX + 1, HY + 25.4, 8.4, 2.2), rgba('#5f4132', 0.4), { blur: 0.7 });
    add(HEAD, lin(HX + 12, HY - 20, HX - 14, HY + 22, [[0, SK.hi], [0.5, SK.base], [1, SK.base]]));
    face(mood);
  });
  const faceEnd = items.length;
  withXF(UPPER(), () => {
    sideLocks();
    hairFront();
    hairTop();
    if (DRY.crown) wreath();
    else hairFlower();
    hairLeaves();
  });
  const fs = items.filter((it) => it.faceShadow);
  items = [...items.slice(0, faceEnd), ...fs, ...items.slice(faceEnd).filter((it) => !it.faceShadow)];
}



// ---------- Her parts, for the game ----------
// The game draws her on her own copy of the serpent rig (render/dryad/serpentrig.js): each part of her
// painted once (render/dryad/index.js keeps the pictures) and placed on its bone every frame, in two
// passes (every part's outline, then every part's fill), so only her outer edge is outlined; her root
// is built live along the tail's joints, as one piece.
// Each part's joint (the serpent base's own, in its units), the bone it rides on.
export const PARTS = [
  ['hairBack', 'head', [151, 85]],
  ['armFu', 'armFu', [136.4, 92]],
  ['armFf', 'armFf', [134.168, 110.6]],
  ['root', null, null],
  ['skin', 'chest', [150, 108.4]],
  ['skirt', 'torso', [150, 126]],
  ['chest', 'chest', [150, 108.4]],
  ['neck', 'neckB', [150, 90.6]],
  ['head', 'head', [151, 85]],
  ['armNu', 'armNu', [163.6, 92]],
  ['armNf', 'armNf', [165.832, 110.6]],
];
// (the area every part's picture covers, in the base's units: x, y, w, h)
export const PART_BOX = [90, -6, 126, 162];
// An arm in two pieces, the upper (shoulder to elbow, the leaf armlet on it) and the lower (elbow to
// wrist, the hand), each round at both ends, so they overlap at the elbow with no seam.
function armUpper(k) {
  const A = ARM0[k];
  const far = k === 'F';
  add(poly(ribbon([A.sh, L2(A.sh, A.el, 0.5), A.el], (u) => lerp(7.2, 6.2, u), { n: 6 })), far ? SK.sh1 : lin(A.sh[0] + 4, 0, A.sh[0] - 4, 0, [[0, SK.hi], [1, SK.base]]));
  inked(INKS.leaf, () => armlet(k));
}
function armLower(k) {
  const A = ARM0[k];
  const far = k === 'F';
  const dl = Math.hypot(A.wr[0] - A.el[0], A.wr[1] - A.el[1]) || 1;
  const hw = [A.wr[0] + ((A.wr[0] - A.el[0]) / dl) * 2, A.wr[1] + ((A.wr[1] - A.el[1]) / dl) * 2];
  const arm = poly(ribbon([A.el, L2(A.el, hw, 0.5), hw], (u) => lerp(6.2, 4.8, u), { n: 6 }));
  add(arm, far ? SK.sh1 : lin(A.el[0] + 4, 0, A.el[0] - 4, 0, [[0, SK.hi], [1, SK.base]]));
  handDraw(arm, hw[0], hw[1], far ? -1 : 1, far);
}
// One part's drawing (items), in the serpent base's units, `mood` her face.
function partItems(name, mood) {
  items = [];
  HAIR_LOOK = DRY.hair;
  BANG_LOOK = DRY.bangs;
  EYE_NARROW = DRY.narrow ?? 0;
  ARM = ARM0;
  withXF(UPPER(), () => {
    if (name === 'hairBack') {
      inked(INKS.hair, () => {
        longHair();
        hairBack();
      });
      if (DRY.ears)
        inked(INKS.skin, () => {
          leafEar(-1);
          leafEar(1);
        });
    } else if (name === 'armFu') inked(INKS.skin, () => armUpper('F'));
    else if (name === 'armFf') inked(INKS.skin, () => armLower('F'));
    else if (name === 'armNu') inked(INKS.skin, () => armUpper('N'));
    else if (name === 'armNf') inked(INKS.skin, () => armLower('N'));
    else if (name === 'skirt') inked(INKS.leaf, () => leafSkirt());
    else if (name === 'skin') inked(INKS.skin, () => dryShoulders());
    else if (name === 'chest') inked(INKS.bark, () => barkBodice());
    else if (name === 'neck') {
      inked(INKS.skin, () => dryNeck());
      detail(ell(HX + 1, HY + 25.4, 8.4, 2.2), rgba('#5f4132', 0.4), { blur: 0.7 });
    } else if (name === 'head') {
      inked(INKS.skin, () => {
        add(HEAD, lin(HX + 12, HY - 20, HX - 14, HY + 22, [[0, SK.hi], [0.5, SK.base], [1, SK.base]]));
        face(mood);
      });
      const faceEnd = items.length;
      inked(INKS.hair, () => {
        sideLocks();
        hairFront();
        hairTop();
      });
      inked(INKS.leaf, () => {
        if (DRY.crown) wreath();
        else hairFlower();
        hairLeaves();
      });
      const fs = items.filter((it) => it.faceShadow);
      items = [...items.slice(0, faceEnd), ...fs, ...items.slice(faceEnd).filter((it) => !it.faceShadow)];
    }
  });
  const out = items;
  items = [];
  return out;
}
// Paints a list of items, one pass ('lines': the outlines, 'fills') or both, at k pixels a unit.
export function paintItems(ctx, list, pass = null, k = 1) {
  const keep = items;
  items = list;
  HAIR_SCALE = k;
  try {
    paint(ctx, pass);
  } finally {
    items = keep;
  }
}
// One part, painted in the base's units (ctx set so one unit is k pixels).
export function paintPart(ctx, name, mood, pass, k) {
  paintItems(ctx, partItems(name, mood), pass, k);
}
// Her root, built along the rig's tail: `T` each piece's turn, as a matrix in the base's own units
// (lower, tailA, tailB, tailC). Its soft shading is drawn without blur (it's built every frame).
export function rootItems(T, bloom = 0) {
  ROOT_BLOOM = bloom;
  items = [];
  ROOT_T = T;
  try {
    inked(INKS.bark, () => serpentRoot());
  } finally {
    ROOT_T = null;
  }
  const out = items;
  items = [];
  for (const it of out) it.blur = 0;
  return out;
}
// Her faces (the expressions the game shows).
export const FACES = ['dreamy', 'blink', 'teary', 'peaceful'];
