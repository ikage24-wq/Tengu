// Folio, the Archivist's wings, clothes and things (2026-11-27, drawn from scratch): what she wears is cut
// from her body's own outline or wraps her limbs (never a flat panel pasted on, never over her face or her
// arms), each piece in both of the rig's passes (mode 'line' its outline, 'fill' itself) so only her outer
// edge is outlined, in a deeper shade of its own colour.
//   wings     a snowy owl's wings from her shoulder blades, folded down her back like a long cape at rest
//             and opened up and back for her casts: a rounded shoulder of soft coverts, a fan of long
//             round-tipped flight feathers, soft dusky bars across their ends (behind her)
//   collar    a soft ruff of rounded white feathers round the base of her neck
//   bodice    her archivist's coat-dress, midnight indigo, cut from her torso's own outline: a cream blouse
//             down its front in a narrow V edged in brass, three brass buttons, a cream sash at her waist
//   skirt     its skirt from her hips to just under her knees, its hem spanning wherever her knees are (so
//             it moves with her legs, never a rigid bell), a band of little brass stars round the hem and
//             a cream underskirt peeking below, on a soft spring
//   sleeves   long fitted indigo sleeves along her arms, a soft cuff trimmed with white feathers
//   legs      deep plum stockings, little cream boots with a brass strap
//   keys      the Archive's keys on a brass ring at her near hip, swinging
//   book      the Great Catalogue: an enormous teal book that floats at her side, shut, or open in a fan of
//             pages lit with starlight writing
//   quill     a white owl's quill with a brass nib in her near hand
import { TAU, mix, tone, ell, smooth, pen, glow, clamp, sstep } from './fx.js';
import { poly, chaikin, quill } from './head.js';
import { FEATHER, INDIGO, GOLD, CREAM, STOCK, BOOK, INK } from './palette.js';

// ---------- The kit ----------
export function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
export const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
export const boneAng = (a, bone) => {
  const M = a.blMat(bone);
  return Math.atan2(M[1], M[0]);
};
const orig = (a, bone) => {
  const M = a.blMat(bone);
  return [M[4], M[5]];
};
export function paint(ctx, a, mode, col, ink, lw) {
  if (mode === 'line') {
    pen(ctx, tone(a, ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = typeof col === 'string' ? tone(a, col) : col;
    ctx.fill();
  }
}
// A tube's outline through points with a width at each, its ends round.
function tubePath(ctx, pts, W) {
  const L = [];
  const R = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[Math.min(pts.length - 1, i + 1)];
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const hw = W[i] / 2;
    L.push([pts[i][0] - Math.sin(an) * hw, pts[i][1] + Math.cos(an) * hw]);
    R.push([pts[i][0] + Math.sin(an) * hw, pts[i][1] - Math.cos(an) * hw]);
  }
  const n = pts.length - 1;
  const a0 = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]);
  const a1 = Math.atan2(pts[n][1] - pts[n - 1][1], pts[n][0] - pts[n - 1][0]);
  ctx.beginPath();
  ctx.moveTo(...L[0]);
  for (const p of L) ctx.lineTo(...p);
  ctx.arc(pts[n][0], pts[n][1], W[n] / 2, a1 + Math.PI / 2, a1 - Math.PI / 2, true);
  for (let i = n; i >= 0; i--) ctx.lineTo(...R[i]);
  ctx.arc(pts[0][0], pts[0][1], W[0] / 2, a0 - Math.PI / 2, a0 + Math.PI / 2, true);
  ctx.closePath();
}
const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];

// ---------- Her owl's wings ----------
// One feather in the wing's own frame (u along the wing, v toward its trailing edge): from (x, y) at
// angle `an` toward v, `l` long, `w` wide at its widest, its tip round.
function featherPts(x, y, an, l, w) {
  const c = Math.cos(an);
  const s = Math.sin(an);
  const P = (u, v) => [x + c * u - s * v, y + s * u + c * v];
  return chaikin([P(0, -w * 0.22), P(l * 0.35, -w * 0.5), P(l * 0.8, -w * 0.5), P(l, -w * 0.22), P(l * 1.04, 0), P(l, w * 0.22), P(l * 0.8, w * 0.5), P(l * 0.35, w * 0.5), P(0, w * 0.22)], 2);
}
// The wing's feathers for how open it is (W 0 folded .. 1 open).
function wingParts(W, L) {
  const sp = mix(0.07, 0.42, W);
  const prim = [0, 1, 2, 3].map((i) => ({ x: L * 0.36, y: i * 0.9, an: -0.04 + i * sp * 0.42, l: L * (0.66 - i * 0.045), w: 5.2 }));
  const sec = [0, 1, 2, 3].map((i) => ({ x: L * (0.08 + i * 0.075), y: 1.8, an: sp * (1.05 + i * 0.32) + 0.05, l: L * (0.5 - i * 0.05), w: 5.6 }));
  return { prim, sec };
}
export function wing(ctx, a, mode, D, k, lw) {
  const q = a.foQ ?? {};
  const Wg = a.foWing ?? { open: 0, flap: [0, 0] };
  const W = clamp(Wg.open, 0, 1.2);
  const far = k === 'F';
  const root = ptOf(a, D, 'chest', D.J[`wing${k}`]);
  // (folded: down her back, leaning back a touch; open: up and back, the near one higher)
  const a0 = Math.PI / 2 + (far ? 0.42 : 0.28);
  const a1 = far ? Math.PI * 1.5 + 0.95 : Math.PI * 1.5 + 0.4;
  const an = mix(a0, a1, sstep(Math.min(1, W))) + (Wg.flap?.[far ? 0 : 1] ?? 0) - boneAng(a, 'chest') * 0.3 * (1 - W);
  const L = mix(33, 40, W) * (far ? 0.96 : 1);
  const d = [Math.cos(an), Math.sin(an)];
  const e2 = [d[1], -d[0]];
  ctx.save();
  ctx.translate(root[0], root[1]);
  ctx.transform(d[0], d[1], e2[0], e2[1], 0, 0);
  const { prim, sec } = wingParts(W, L);
  const base = far ? FEATHER.sh : FEATHER.base;
  const one = (P, col) => {
    const pts = featherPts(P.x, P.y, P.an, P.l, P.w);
    poly(ctx, pts);
    if (mode === 'line') return paint(ctx, a, mode, null, FEATHER.ink, lw);
    ctx.fillStyle = tone(a, col);
    ctx.fill();
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    const c = Math.cos(P.an);
    const s = Math.sin(P.an);
    const at = (u, v) => [P.x + c * u - s * v, P.y + s * u + c * v];
    // (its shade down the trailing side, a light along the leading one)
    glow(ctx, ...at(P.l * 0.6, P.w * 0.45), P.w * 1.4, far ? FEATHER.deep : FEATHER.sh, 0.7);
    glow(ctx, ...at(P.l * 0.4, -P.w * 0.3), P.w * 1.2, FEATHER.lt, 0.7);
    // (its shaft, a fine soft line)
    pen(ctx, tone(a, FEATHER.sh, 0.8), 0.35);
    ctx.beginPath();
    ctx.moveTo(...at(P.l * 0.1, 0));
    ctx.lineTo(...at(P.l * 0.92, 0));
    ctx.stroke();
    // (soft dusky bars across its far end: a snowy owl's)
    pen(ctx, tone(a, FEATHER.spot, 0.3), 0.8);
    for (const u of [0.7, 0.86]) {
      ctx.beginPath();
      ctx.moveTo(...at(P.l * u, -P.w * 0.22));
      ctx.lineTo(...at(P.l * u + 0.6, P.w * 0.22));
      ctx.stroke();
    }
    ctx.restore();
  };
  // (the secondaries first, then the long primaries, then the coverts over their roots)
  for (const P of [...sec].reverse()) one(P, base);
  for (const P of [...prim].reverse()) one(P, base);
  const cov = chaikin([[-3, -3.4], [L * 0.2, -4.6], [L * 0.46, -3.2], [L * 0.52, 0.4], [L * 0.44, 3.6], [L * 0.3, 5.2], [L * 0.16, 5.6], [L * 0.04, 5], [-3.2, 2.6]], 3);
  poly(ctx, cov);
  if (mode === 'line') paint(ctx, a, mode, null, FEATHER.ink, lw);
  else {
    ctx.fillStyle = tone(a, far ? FEATHER.sh : FEATHER.lt);
    ctx.fill();
    ctx.save();
    poly(ctx, cov);
    ctx.clip();
    glow(ctx, L * 0.2, -2, 9, '#ffffff', 0.9);
    glow(ctx, L * 0.3, 5, 6, FEATHER.sh, 0.6);
    // (a row of small round coverts along its lower edge)
    pen(ctx, tone(a, FEATHER.sh, 0.9), 0.45);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(L * (0.06 + i * 0.09), 3.1, 1.7, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  void q;
}

// ---------- The feather ruff round her neck ----------
export function collar(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const cx = st[0] + 0.6;
  const y = st[1] - 1.4;
  const n = 7;
  ctx.beginPath();
  // (round feathers in an arc across her shoulders, the middle ones lowest)
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = cx - 12.4 + u * 24.8;
    const yy = y + 2.2 + Math.sin(Math.PI * u) * 2.6;
    const r = 3.3 + Math.sin(Math.PI * u) * 0.9;
    ctx.moveTo(x + r, yy);
    ctx.ellipse(x, yy, r, r * 1.05, 0, 0, TAU);
  }
  ctx.moveTo(cx + 11, y - 1.6);
  ctx.ellipse(cx, y + 0.6, 12, 3.4, 0, 0, TAU);
  paint(ctx, a, mode, FEATHER.base, FEATHER.ink, lw / D.SC);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, cx + 3, y, 9, '#ffffff', 0.9);
    glow(ctx, cx - 8, y + 4, 7, FEATHER.sh, 0.7);
    ctx.restore();
    // a little brass star brooch at its middle
    star5(ctx, cx + 0.8, y + 5.2, 2.1, GOLD.base, GOLD.ink, 0.35);
  }
  ctx.restore();
}
function star5(ctx, x, y, r, col, ink, w) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.5 : r;
    const p = [x + Math.cos(an) * rr, y + Math.sin(an) * rr];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
  if (ink) {
    pen(ctx, ink, w);
    ctx.stroke();
  }
}

// ---------- Her coat-dress (cut from her torso's own outline) ----------
export function bodice(ctx, a, D) {
  const T = a.blTorsoPts;
  if (!T) return;
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  // the indigo over all of it
  ctx.fillStyle = tone(a, INDIGO.base);
  ctx.fillRect(-200, -200, 400, 400);
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const rb = D.J.ribs;
  const cx = st[0] + 1.2;
  glow(ctx, cx + 6, st[1] + 8, 11, INDIGO.lt, 0.55);
  glow(ctx, cx - 13, rb[1] + 4, 12, INDIGO.deep, 0.6);
  // the cream blouse down her front in a narrow V, edged in brass
  const bot = rb[1] + 12;
  ctx.beginPath();
  ctx.moveTo(cx - 6.4, st[1] - 2);
  ctx.lineTo(cx + 6.4, st[1] - 2);
  ctx.quadraticCurveTo(cx + 3, (st[1] + bot) / 2, cx + 0.3, bot);
  ctx.quadraticCurveTo(cx - 3, (st[1] + bot) / 2, cx - 6.4, st[1] - 2);
  ctx.closePath();
  ctx.fillStyle = tone(a, CREAM.base);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, cx - 3, bot - 4, 6, CREAM.sh, 0.7);
  // (soft pin-tucks down it)
  pen(ctx, tone(a, CREAM.sh), 0.45);
  for (const dx of [-1.6, 1.6]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx, st[1]);
    ctx.lineTo(cx + dx * 0.4, bot - 2);
    ctx.stroke();
  }
  ctx.restore();
  pen(ctx, tone(a, GOLD.sh), 0.8);
  ctx.beginPath();
  ctx.moveTo(cx - 6.4, st[1] - 2);
  ctx.quadraticCurveTo(cx - 3, (st[1] + bot) / 2, cx + 0.3, bot);
  ctx.quadraticCurveTo(cx + 3, (st[1] + bot) / 2, cx + 6.4, st[1] - 2);
  ctx.stroke();
  // three brass buttons down the coat beside the V
  for (let i = 0; i < 3; i++) {
    const by = st[1] + 6 + i * 5.2;
    ell(ctx, cx + 6.2 - i * 1.2, by, 1.25, 1.25);
    ctx.fillStyle = tone(a, GOLD.base);
    ctx.fill();
    pen(ctx, tone(a, GOLD.ink), 0.35);
    ctx.stroke();
    ell(ctx, cx + 5.9 - i * 1.2, by - 0.35, 0.4, 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
  // the cream sash at her waist (in the waist's frame)
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  enter(ctx, a, D, 'waistB');
  const nv = D.J.navel;
  ctx.beginPath();
  ctx.moveTo(nv[0] - 40, nv[1] - 3.4);
  ctx.quadraticCurveTo(nv[0], nv[1] - 1.8, nv[0] + 40, nv[1] - 3.4);
  ctx.lineTo(nv[0] + 40, nv[1] + 1.8);
  ctx.quadraticCurveTo(nv[0], nv[1] + 3.4, nv[0] - 40, nv[1] + 1.8);
  ctx.closePath();
  ctx.fillStyle = tone(a, CREAM.base);
  ctx.fill();
  pen(ctx, tone(a, CREAM.deep, 0.8), 0.6);
  ctx.beginPath();
  ctx.moveTo(nv[0] - 40, nv[1] + 1.4);
  ctx.quadraticCurveTo(nv[0], nv[1] + 3, nv[0] + 40, nv[1] + 1.4);
  ctx.stroke();
  ctx.restore();
}

// ---------- Her skirt ----------
// From her hips to just under her knees; its hem spans her knees (plus a flare), so it moves with her
// legs. Rig space.
function skirtPts(a, D) {
  const hip = D.J.hip;
  const S = a.foSkirt ?? 0;
  const top = D.spec?.leg?.tw ?? 12;
  const hl = ptOf(a, D, 'torso', [hip[0] - 12.6, hip[1] - 5]);
  const hr = ptOf(a, D, 'torso', [hip[0] + 12.6, hip[1] - 5]);
  const hm = ptOf(a, D, 'torso', [hip[0], hip[1] - 6]);
  const kN = orig(a, 'shinN');
  const kF = orig(a, 'shinF');
  const back = Math.min(kN[0], kF[0], hl[0]) - 3 + S * 2;
  const front = Math.max(kN[0], kF[0], hr[0]) + 3 + S * 2;
  const hemY = Math.max(kN[1], kF[1]) + 0.8;
  const mid = (back + front) / 2;
  void top;
  // (an A-line: straight from the hips out to the hem, never ballooning between)
  return chaikin([hl, hm, hr, [mix(hr[0], front, 0.45), mix(hr[1], hemY, 0.45)], [mix(hr[0], front, 0.9), mix(hr[1], hemY, 0.9)], [front, hemY - 0.6], [mid + S * 1.2, hemY + 1.2], [back, hemY - 0.6], [mix(hl[0], back, 0.9), mix(hl[1], hemY, 0.9)], [mix(hl[0], back, 0.45), mix(hl[1], hemY, 0.45)]], 2);
}
export function skirt(ctx, a, mode, D, lw) {
  const pts = skirtPts(a, D);
  // (the cream underskirt peeking below the hem)
  const under = pts.map(([x, y]) => [x, y + 1.6]);
  poly(ctx, under);
  paint(ctx, a, mode, CREAM.sh, CREAM.ink, lw);
  poly(ctx, pts);
  if (mode === 'line') return paint(ctx, a, mode, null, INDIGO.ink, lw);
  let ymin = Infinity;
  let ymax = -Infinity;
  let xmin = Infinity;
  let xmax = -Infinity;
  for (const [x, y] of pts) {
    ymin = Math.min(ymin, y);
    ymax = Math.max(ymax, y);
    xmin = Math.min(xmin, x);
    xmax = Math.max(xmax, x);
  }
  const g = ctx.createLinearGradient(0, ymin, 0, ymax);
  g.addColorStop(0, tone(a, INDIGO.sh));
  g.addColorStop(0.35, tone(a, INDIGO.base));
  g.addColorStop(1, tone(a, INDIGO.sh));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  poly(ctx, pts);
  ctx.clip();
  glow(ctx, xmin + (xmax - xmin) * 0.62, ymin + (ymax - ymin) * 0.4, (xmax - xmin) * 0.4, INDIGO.lt, 0.45);
  glow(ctx, xmin + 2, ymax - 3, (xmax - xmin) * 0.35, INDIGO.deep, 0.55);
  // (soft folds falling from the hips toward the hem)
  pen(ctx, tone(a, INDIGO.deep, 0.5), 0.5);
  for (const u of [0.3, 0.55, 0.78]) {
    ctx.beginPath();
    ctx.moveTo(xmin + (xmax - xmin) * (0.35 + u * 0.3), ymin + 2);
    ctx.quadraticCurveTo(xmin + (xmax - xmin) * (0.25 + u * 0.5), ymin + (ymax - ymin) * 0.6, xmin + (xmax - xmin) * u, ymax);
    ctx.stroke();
  }
  // (a band of little brass stars round the hem)
  pen(ctx, tone(a, GOLD.sh, 0.9), 0.6);
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const x = xmin + (xmax - xmin) * (i / 10);
    const y = ymax - 3.2 - Math.sin(Math.PI * (i / 10)) * -0.8;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.stroke();
  for (let i = 1; i < 6; i++) star5(ctx, xmin + (xmax - xmin) * (i / 6), ymax - 1.5, 0.9, tone(a, GOLD.base), null);
  ctx.restore();
}

// ---------- Her sleeves ----------
export function sleeve(ctx, a, mode, D, k, lw) {
  const near = k === 'N';
  const sh = orig(a, `arm${k}u`);
  const el = orig(a, `arm${k}f`);
  const wr = orig(a, `hand${k}`);
  const A = D.spec?.arm ?? { aw0: 7.2, ew: 6.3, aw1: 5.4 };
  const SC = D.SC;
  const pts = [sh, lerp2(sh, el, 0.5), el, lerp2(el, wr, 0.5), lerp2(el, wr, 0.88)];
  const W = [A.aw0 * 1.42, A.aw0 * 1.22, A.ew * 1.25, A.ew * 1.22, A.aw1 * 1.6].map((w) => w * SC);
  tubePath(ctx, pts, W);
  paint(ctx, a, mode, near ? INDIGO.base : INDIGO.sh, INDIGO.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    glow(ctx, ...lerp2(sh, el, 0.3), W[0] * 0.8, near ? INDIGO.lt : INDIGO.base, 0.5);
    ctx.restore();
  }
  // the cuff: a soft ring of little white feathers round the wrist
  const an = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
  const c = lerp2(el, wr, 0.84);
  ctx.save();
  ctx.translate(c[0], c[1]);
  ctx.rotate(an);
  const r = A.aw1 * SC * 0.95;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const y = -r + (i / 3) * r * 2;
    ctx.moveTo(1.6, y);
    ctx.ellipse(0.2, y, 1.6, 1.15, 0, 0, TAU);
  }
  paint(ctx, a, mode, near ? FEATHER.base : FEATHER.sh, FEATHER.ink, lw);
  ctx.restore();
}

// ---------- Stockings and boots ----------
export function stocking(ctx, a, mode, D, k, lw) {
  const hip = orig(a, `thigh${k}`);
  const knee = orig(a, `shin${k}`);
  const ank = orig(a, `foot${k}`);
  const Lg = D.spec?.leg ?? { tw: 11.8, kw: 8.2, anw: 5.9 };
  const SC = D.SC;
  const pts = [lerp2(hip, knee, 0.1), lerp2(hip, knee, 0.55), knee, lerp2(knee, ank, 0.35), ank];
  const W = [Lg.tw * 1.02, Lg.tw * 0.92, Lg.kw * 1.06, Lg.kw * 1.08, Lg.anw * 1.08].map((w) => w * SC);
  tubePath(ctx, pts, W);
  const far = k === 'F';
  paint(ctx, a, mode, far ? STOCK.sh : STOCK.base, STOCK.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    // (a soft sheen down the lit side of the shin)
    pen(ctx, tone(a, STOCK.lt, far ? 0.25 : 0.5), 1.1);
    ctx.beginPath();
    ctx.moveTo(...lerp2(knee, ank, 0.05).map((v, i) => v + (i ? 0 : 0.9)));
    ctx.lineTo(...lerp2(knee, ank, 0.85).map((v, i) => v + (i ? 0 : 0.7)));
    ctx.stroke();
    ctx.restore();
  }
}
export function boot(ctx, a, mode, D, k, lw) {
  const Lg = D.spec?.leg ?? { anw: 5.9, heel: 3.8, toe: 9.6, ftop: 1.8, fbot: 6.6 };
  const s = D.SC;
  const far = k === 'F';
  const M = a.blMat(`foot${k}`);
  ctx.save();
  ctx.transform(...M);
  const hl = Lg.heel * 1.12;
  const to = Lg.toe * 1.06;
  const pts = chaikin([[-hl, -Lg.ftop - 3.2], [Lg.anw * 0.5, -Lg.ftop - 3.4], [Lg.anw * 0.62, -Lg.ftop + 0.6], [to * 0.82, Lg.fbot * 0.36], [to * 1.02, Lg.fbot * 0.7], [to * 0.92, Lg.fbot + 0.25], [-hl, Lg.fbot + 0.25], [-hl * 1.08, Lg.fbot * 0.3]], 2).map(([x, y]) => [x * s, y * s]);
  poly(ctx, pts);
  paint(ctx, a, mode, far ? CREAM.sh : CREAM.base, CREAM.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    // (the sole and a little heel)
    ctx.fillStyle = tone(a, far ? INDIGO.sh : INDIGO.base);
    ctx.fillRect(-hl * 1.3 * s, (Lg.fbot - 0.9) * s, (hl + to) * 1.4 * s, 2 * s);
    glow(ctx, to * 0.5 * s, 0, 3 * s, '#ffffff', 0.7);
    ctx.restore();
    // the brass strap over the instep
    pen(ctx, tone(a, GOLD.sh), 0.9 * s);
    ctx.beginPath();
    ctx.moveTo(Lg.anw * 0.1 * s, -Lg.ftop * 0.4 * s);
    ctx.quadraticCurveTo(Lg.anw * 0.7 * s, Lg.fbot * 0.1 * s, to * 0.58 * s, Lg.fbot * 0.4 * s);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- The Archive's keys, at her near hip ----------
export function keys(ctx, a, mode, D, lw) {
  const hip = D.J.hip;
  const p = ptOf(a, D, 'torso', [hip[0] + 10.6, hip[1] - 3.6]);
  const sw = a.foKeys ?? 0;
  ctx.save();
  ctx.translate(p[0], p[1]);
  ctx.rotate(sw);
  ctx.scale(0.62, 0.62);
  ell(ctx, 0, 1.4, 1.5, 1.5);
  if (mode === 'line') {
    pen(ctx, tone(a, GOLD.ink), 0.6 + lw * 2);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, GOLD.base), 0.55);
    ctx.stroke();
  }
  for (const [dx, len, rot] of [[-0.9, 4.4, 0.25], [0.3, 5.2, 0], [1.3, 3.8, -0.3]]) {
    ctx.save();
    ctx.translate(dx * 0.6, 2.6);
    ctx.rotate(rot + sw * 0.4);
    ctx.beginPath();
    ctx.moveTo(-0.32, 0);
    ctx.lineTo(-0.32, len);
    ctx.lineTo(0.9, len);
    ctx.lineTo(0.9, len - 0.8);
    ctx.lineTo(0.32, len - 0.8);
    ctx.lineTo(0.32, 0);
    ctx.closePath();
    ctx.moveTo(0.9, 0);
    ctx.ellipse(0, 0, 0.9, 0.9, 0, 0, TAU);
    paint(ctx, a, mode, GOLD.base, GOLD.ink, lw);
    ctx.restore();
  }
  ctx.restore();
}

// ---------- The Great Catalogue ----------
// Where it floats (rig space): its middle, its tilt, how open it is (0 shut .. 1 a full spread), its
// pages' flutter. a.foBook is set by the pose (an offset from her chest), placed here.
export function bookGeom(a, D) {
  const B = a.foBook ?? { dx: -14, dy: -4, tilt: 0.1, open: 0, flip: 0 };
  const c = ptOf(a, D, 'chest', D.J.stern);
  return { x: c[0] + B.dx, y: c[1] + B.dy, tilt: B.tilt, open: B.open, flip: B.flip ?? 0, s: B.s ?? 1 };
}
export function book(ctx, a, mode, D, lw) {
  const G = bookGeom(a, D);
  drawBook(ctx, a, mode, G.x, G.y, G.tilt, G.open, G.flip, G.s, lw);
}
// The book itself at (x, y) (its middle), for the rig and her effects alike.
export function drawBook(ctx, a, mode, x, y, tilt, open, flip, s, lw) {
  const t = a?.t ?? 0;
  const BW = 12.4 * s;
  const BH = 16 * s;
  const th = 3.2 * s;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  const o = clamp(open, 0, 1);
  // (shut and open cross-fade between 0.35 and 0.65, so nothing jumps as it opens)
  const shutA = 1 - sstep((o - 0.35) / 0.3);
  const openA = 1 - shutA;
  const base = ctx.globalAlpha;
  if (shutA > 0.01) {
    ctx.globalAlpha = base * shutA;
    // shut: the front cover, the page block's edge and the spine
    const k = 1 - Math.min(o, 0.65) * 0.5;
    const w = BW * k;
    const cover = [[-w / 2, -BH / 2], [w / 2, -BH / 2], [w / 2 + th * 0.4, -BH / 2 + th * 0.4], [w / 2 + th * 0.4, BH / 2 + th * 0.4], [-w / 2 + th * 0.4, BH / 2 + th * 0.4], [-w / 2, BH / 2]];
    rounded(ctx, cover, 1.4 * s);
    paint(ctx, a, mode, BOOK.sh, BOOK.ink, lw);
    if (mode === 'fill') {
      // (the page block, cream, along its edge)
      ctx.fillStyle = tone(a, CREAM.base);
      ctx.fillRect(w / 2 - 0.4, -BH / 2 + 0.9, th * 0.5, BH - 0.6);
      pen(ctx, tone(a, CREAM.sh), 0.25);
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(w / 2, -BH / 2 + 1 + (i * BH) / 4);
        ctx.lineTo(w / 2 + th * 0.4, -BH / 2 + 1.4 + (i * BH) / 4);
        ctx.stroke();
      }
    }
    rounded(ctx, [[-w / 2, -BH / 2], [w / 2, -BH / 2], [w / 2, BH / 2], [-w / 2, BH / 2]], 1.4 * s);
    paint(ctx, a, mode, BOOK.base, BOOK.ink, lw);
    if (mode === 'fill') {
      ctx.save();
      rounded(ctx, [[-w / 2, -BH / 2], [w / 2, -BH / 2], [w / 2, BH / 2], [-w / 2, BH / 2]], 1.4 * s);
      ctx.clip();
      glow(ctx, w * 0.2, -BH * 0.25, BW * 0.7, BOOK.lt, 0.6);
      glow(ctx, -w * 0.4, BH * 0.4, BW * 0.6, BOOK.deep, 0.5);
      // (the spine's band, the gold frame and a star chart pressed into the cover)
      ctx.fillStyle = tone(a, BOOK.deep);
      ctx.fillRect(-w / 2, -BH / 2, 1.8 * s, BH);
      pen(ctx, tone(a, GOLD.base, 0.9), 0.45 * s);
      ctx.strokeRect(-w / 2 + 2.6 * s, -BH / 2 + 1.4 * s, w - 4 * s, BH - 2.8 * s);
      const P = [[-1.6, -3.8], [1.8, -1.6], [-0.6, 1], [2.2, 3.6]].map(([px, py]) => [px * s * k, py * s]);
      pen(ctx, tone(a, GOLD.lt, 0.8), 0.3 * s);
      ctx.beginPath();
      P.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.stroke();
      for (const p of P) star5(ctx, p[0], p[1], 0.9 * s, tone(a, GOLD.base), null);
      // (little brass corners)
      for (const [cx, cy] of [[w / 2, -BH / 2], [w / 2, BH / 2]]) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 2.2 * s, cy);
        ctx.lineTo(cx, cy + (cy < 0 ? 2.2 : -2.2) * s);
        ctx.closePath();
        ctx.fillStyle = tone(a, GOLD.base);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  if (openA > 0.01) {
    ctx.globalAlpha = base * openA;
    // open: the cover under both sides, then two pages bowing up from the spine, starlight writing on
    // them, a page or two lifting as it turns
    const k = sstep((o - 0.35) / 0.65);
    const W2 = BW * (0.55 + 0.45 * k);
    const cov = [[-W2 - 0.8 * s, -BH / 2 - 0.4], [W2 + 0.8 * s, -BH / 2 - 0.4], [W2 + 0.8 * s, BH / 2 + 0.8], [-W2 - 0.8 * s, BH / 2 + 0.8]];
    rounded(ctx, cov, 1.4 * s);
    paint(ctx, a, mode, BOOK.base, BOOK.ink, lw);
    const page = (side, lift) => {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        pts.push([side * W2 * u * (1 - lift * 0.5), -BH / 2 + 0.6 - Math.sin(Math.PI * u) * 1.4 * s - lift * u * 4 * s]);
      }
      for (let i = 8; i >= 0; i--) {
        const u = i / 8;
        pts.push([side * W2 * u * (1 - lift * 0.5), BH / 2 - Math.sin(Math.PI * u) * 0.8 * s - lift * u * 4 * s]);
      }
      return pts;
    };
    for (const side of [-1, 1]) {
      poly(ctx, page(side, 0));
      paint(ctx, a, mode, CREAM.base, CREAM.ink, lw);
      if (mode === 'fill') {
        ctx.save();
        poly(ctx, page(side, 0));
        ctx.clip();
        glow(ctx, 0, 0, 4 * s, CREAM.deep, 0.5);
        // (the star records: lines of glowing writing, a little star chart)
        pen(ctx, tone(a, INK.base, 0.85), 0.35 * s);
        for (let i = 0; i < 5; i++) {
          const yy = -BH / 2 + 3.2 * s + i * 2.4 * s;
          ctx.beginPath();
          ctx.moveTo(side * 1.6 * s, yy);
          for (let j = 1; j <= 5; j++) ctx.lineTo(side * (1.6 + j * (W2 / s - 3.2) / 5) * s, yy + Math.sin(j * 2.1 + i + t * 0.5) * 0.3 * s);
          ctx.stroke();
        }
        glow(ctx, side * W2 * 0.5, 0, W2 * 0.6, INK.glow, 0.25 + 0.1 * Math.sin(t * 3));
        ctx.restore();
      }
    }
    // a page turning over, now and then (flip 0..1)
    // (it swings over the spine: its far edge from the right page's edge, up, to the left one's)
    if (flip > 0.02 && flip < 0.98) {
      const cx = Math.cos(Math.PI * flip);
      const lift = Math.sin(Math.PI * flip);
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        pts.push([W2 * u * cx, -BH / 2 + 0.6 - Math.sin(Math.PI * u) * 1.4 * s - lift * u * 5 * s]);
      }
      for (let i = 8; i >= 0; i--) {
        const u = i / 8;
        pts.push([W2 * u * cx + (cx >= 0 ? 0.01 : -0.01), BH / 2 - Math.sin(Math.PI * u) * 0.8 * s - lift * u * 5 * s]);
      }
      poly(ctx, pts);
      paint(ctx, a, mode, CREAM.lt, CREAM.ink, lw);
    }
    if (mode === 'fill') {
      pen(ctx, tone(a, CREAM.deep), 0.5);
      ctx.beginPath();
      ctx.moveTo(0, -BH / 2);
      ctx.lineTo(0, BH / 2);
      ctx.stroke();
      // (its ribbon bookmark hanging from the spine)
      pen(ctx, tone(a, '#e8607a'), 0.8 * s);
      ctx.beginPath();
      ctx.moveTo(0.3, BH / 2);
      ctx.quadraticCurveTo(1.2 * s, BH / 2 + 3 * s, 0.6 * s + Math.sin(t * 2) * 0.6, BH / 2 + 5.4 * s);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function rounded(ctx, pts, r) {
  const n = pts.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const d0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
    const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
    const rr = Math.min(r, d0 / 2, d2 / 2);
    const a0 = [p1[0] + ((p0[0] - p1[0]) / d0) * rr, p1[1] + ((p0[1] - p1[1]) / d0) * rr];
    const a2 = [p1[0] + ((p2[0] - p1[0]) / d2) * rr, p1[1] + ((p2[1] - p1[1]) / d2) * rr];
    if (i) ctx.lineTo(...a0);
    else ctx.moveTo(...a0);
    ctx.quadraticCurveTo(p1[0], p1[1], a2[0], a2[1]);
  }
  ctx.closePath();
}

// ---------- The quill in her near hand ----------
// Its nib down and out from her hand at q.qa (radians off pointing forward-down).
export function quillGeom(a, D) {
  const q = a.foQ ?? {};
  const hd = orig(a, 'handN');
  const hand = ptOf(a, D, 'handN', D.J.handN);
  const an = boneAng(a, 'handN') + (q.qa ?? 0.3) + Math.PI;
  const d = [Math.cos(an), Math.sin(an)];
  return { hand, tip: [hand[0] + d[0] * 3.2, hand[1] + d[1] * 3.2], end: [hand[0] - d[0] * 11, hand[1] - d[1] * 11], hd };
}
export function heldQuill(ctx, a, mode, D, lw) {
  const q = a.foQ ?? {};
  if (q.noQuill) return;
  const G = quillGeom(a, D);
  quill(ctx, a, mode, G.tip[0], G.tip[1], G.end[0], G.end[1], 0.8, lw);
}
export { star5, rounded, tubePath };
