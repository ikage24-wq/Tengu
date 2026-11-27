// Lady Abyssia's gown, arms and things (2026-11-26, drawn from scratch): everything she wears is cut
// from her body's own outline or wraps her limbs (never a flat panel pasted on, never over her face or
// her arms), each piece in both of the rig's passes (mode 'line' its outline, 'fill' itself) so only
// her outer edge is outlined, in a deeper shade of its own colour.
//   collar    a scallop-shell collar, pearl, standing up behind her neck and head like a fan (its ribs
//             and scalloped rim); behind her head, in front of her long hair
//   bodice    violet, cut from her torso's own outline: a sweetheart neckline, a teal satin sash at
//             her waist, a glowing sea-glass brooch at the neckline
//   choker    a teal ribbon at her throat with a sea-glass drop
//   sleeves   long fitted violet sleeves on her arms to the wrist, a soft puff at each shoulder and an
//             orchid frill at each cuff
//   peplum    a ruffled orchid peplum over her hips: six soft rounded frills, each hanging from inside
//             her waist on its own spring (never one rigid bell), three behind her, three in front
//   arms      six octopus arms from under the peplum, three far (in shade, behind her) and three near:
//             orchid on top, a blush-pink underside, thick at the root and tapering to a round tip that
//             curls up; each a chain of seven pieces on springs (a wave runs down them from the root,
//             its phase from the distance she has glided and slowly at rest); where one would go under
//             the floor it lies along it
//   crook     her lamplighter's crook in her far hand: dark violet lacquer, its top curled over into a
//             hook; on the hook, on a little ring (swinging on a spring), her lantern: violet sea-glass
//             (the darlings' lanterns, grown up) under a dark-violet cap with her teal band and a tiny
//             starfish, a warm golden light inside (the light she has taken from the wards)
//   compact   a clamshell compact mirror, pearl, for her idle act
import { TAU, clamp, mix, tone, ell, smooth, pen, glow, sparkle } from './fx.js';
import { poly, starfish } from './head.js';
import { GOWN, FRILL, ARM, PEARL, TEAL, STAFF, GLASS, CAP, LIGHT } from './palette.js';

// ---------- The kit (shared with index.js) ----------
export function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
// (a point in kid units on a bone, in the rig's space, base px)
export const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
export const boneAng = (a, bone) => {
  const M = a.blMat(bone);
  return Math.atan2(M[1], M[0]);
};
// Paints the current path: its outline (line pass) or its fill.
export function paint(ctx, a, mode, col, ink, lw) {
  if (mode === 'line') {
    pen(ctx, tone(a, ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = typeof col === 'string' ? tone(a, col) : col;
    ctx.fill();
  }
}
// A tube along points with widths, a round end (the arms, the hair's curls).
function tubePts(pts, W, cap = 0.6) {
  const Lp = [];
  const Rp = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[Math.min(pts.length - 1, i + 1)];
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const hw = W[i] / 2;
    Lp.push([pts[i][0] - Math.sin(an) * hw, pts[i][1] + Math.cos(an) * hw]);
    Rp.push([pts[i][0] + Math.sin(an) * hw, pts[i][1] - Math.cos(an) * hw]);
  }
  const n = pts.length;
  const tip = pts[n - 1];
  const tan = Math.atan2(tip[1] - pts[n - 2][1], tip[0] - pts[n - 2][0]);
  return { Lp, Rp, shape: [...Lp, [tip[0] + Math.cos(tan) * W[n - 1] * cap, tip[1] + Math.sin(tan) * W[n - 1] * cap], ...[...Rp].reverse()] };
}

// ---------- The octopus arms ----------
// Each: its root (base px from her hips' middle, x toward the way she faces, y down), the angle it
// leaves at (from straight down, + forward), how much it bends along (per piece, + forward), its curl
// at the tip, its length (per piece), its width at the root; near (in front of her) or far.
export const ARMS = [
  { near: false, x: 3.6, y: 1.4, an: 0.62, bend: 0.2, curl: 0.55, seg: 3.7, w: 4.6, ph: 0.6 },
  { near: false, x: -0.6, y: 2.2, an: -0.06, bend: -0.2, curl: -0.5, seg: 3.9, w: 4.8, ph: 2.1 },
  { near: false, x: -4, y: 1.4, an: -0.62, bend: -0.22, curl: -0.6, seg: 3.8, w: 4.6, ph: 3.4 },
  { near: true, x: -2.8, y: 2.4, an: -0.42, bend: -0.24, curl: -0.6, seg: 3.9, w: 5, ph: 1.2 },
  { near: true, x: 3, y: 2.6, an: 0.4, bend: 0.25, curl: 0.62, seg: 4.0, w: 5.2, ph: 4.4 },
  { near: true, x: 0.2, y: 3, an: 0.04, bend: 0.2, curl: 0.58, seg: 4.1, w: 5.4, ph: 2.8 },
];
export const NSEG = 7;
const WID = (A, i) => A.w * (1 - (i / NSEG) * 0.78) ** 0.9 + 0.35;
// Each arm's joints in the rig's space (base px): its root on her hips, each piece's angle from the
// last (a.abArms: its springs, worked out in the pose); laid along the floor where it would go under.
export function armPts(a, D, A, k) {
  const hip = D.J.hip;
  const root = ptOf(a, D, 'torso', [hip[0] + A.x / D.SC, hip[1] + A.y / D.SC]);
  const angs = a.abArms?.[k] ?? null;
  const pts = [root];
  let th = A.an - boneAng(a, 'torso') * 0.6;
  for (let i = 0; i < NSEG; i++) {
    th += angs ? angs[i] : i ? A.bend + (i >= NSEG - 2 ? A.curl : 0) : 0;
    const p = pts[i];
    pts.push([p[0] + Math.sin(th) * A.seg, p[1] + Math.cos(th) * A.seg]);
  }
  // (lying along the floor: never under it; each piece kept its length as far as it can)
  for (let i = 1; i < pts.length; i++) {
    const lim = -WID(A, i) * 0.5;
    if (pts[i][1] > lim) pts[i][1] = lim;
  }
  return pts;
}
export function octoArm(ctx, a, mode, D, A, k, lw) {
  const pts = armPts(a, D, A, k);
  const W = pts.map((_, i) => WID(A, i));
  const T = tubePts(pts, W);
  smooth(ctx, T.shape);
  const C = A.near ? ARM : { ...ARM, base: ARM.sh, lt: ARM.base, sh: ARM.deep, under: ARM.underSh };
  if (mode === 'line') {
    paint(ctx, a, mode, null, ARM.ink, lw);
    return;
  }
  const g = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[NSEG][0], pts[NSEG][1]);
  g.addColorStop(0, tone(a, C.sh));
  g.addColorStop(0.35, tone(a, C.base));
  g.addColorStop(1, tone(a, C.lt));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  smooth(ctx, T.shape);
  ctx.clip();
  // the blush-pink underside: a soft band along its inner side (toward the way it curls)
  const inner = (A.curl > 0) === (A.an > -0.2) ? T.Lp : T.Rp;
  const band = inner.map((p, i) => [mix(p[0], pts[i][0], 0.55), mix(p[1], pts[i][1], 0.55)]);
  smooth(ctx, [...inner, ...band.reverse()]);
  ctx.fillStyle = tone(a, C.under, A.near ? 0.9 : 0.7);
  ctx.fill();
  // a soft light along its top, a shade at its root under the peplum
  pen(ctx, tone(a, '#ffffff', A.near ? 0.35 : 0.18), Math.max(0.5, A.w * 0.16));
  ctx.beginPath();
  const top = inner === T.Lp ? T.Rp : T.Lp;
  for (let i = 1; i < NSEG - 1; i++) {
    const p = [mix(top[i][0], pts[i][0], 0.4), mix(top[i][1], pts[i][1], 0.4)];
    if (i > 1) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.stroke();
  glow(ctx, pts[0][0], pts[0][1], A.w * 1.6, ARM.deep, A.near ? 0.45 : 0.3);
  ctx.restore();
}

// ---------- The peplum ----------
// Six soft frills from inside her waist (base px about her hips' middle): x, angle at rest (from
// straight down, + forward), length, half-width; back (behind her) or front.
const PEP = [
  { back: true, x: -5.2, an: -0.7, len: 7.6, hw: 3.6 },
  { back: true, x: 4.6, an: 0.62, len: 7.2, hw: 3.4 },
  { back: true, x: -0.4, an: -0.12, len: 8.2, hw: 3.8 },
  { back: false, x: -3.8, an: -0.42, len: 8.4, hw: 3.9 },
  { back: false, x: 3.6, an: 0.36, len: 8.2, hw: 3.8 },
  { back: false, x: 0, an: 0.02, len: 9, hw: 4.2 },
];
export function peplum(ctx, a, mode, D, back, lw) {
  const sw = a.abPep ?? PEP.map(() => 0);
  const w = D.J.waist;
  const hip = D.J.hip;
  for (let i = 0; i < PEP.length; i++) {
    const P = PEP[i];
    if (P.back !== back) continue;
    const r = ptOf(a, D, 'torso', [hip[0] + P.x / D.SC, mix(w[1], hip[1], 0.55)]);
    const an = P.an + sw[i] + boneAng(a, 'torso');
    const dir = [Math.sin(an), Math.cos(an)];
    const nrm = [dir[1], -dir[0]];
    const L = P.len;
    const tip = [r[0] + dir[0] * L, r[1] + dir[1] * L];
    const at = (u, s) => [r[0] + dir[0] * L * u + nrm[0] * s, r[1] + dir[1] * L * u + nrm[1] * s];
    // (a soft rounded frill: narrow at its root, widest low down, its hem one round curve with a
    // gentle ruffle line in it, never a wavy sheet)
    const pts = [at(0, -P.hw * 0.5), at(0.45, -P.hw * 0.95), at(0.85, -P.hw * 1.02), at(1.04, -P.hw * 0.5), [tip[0] + dir[0] * 1.0, tip[1] + dir[1] * 1.0], at(1.04, P.hw * 0.5), at(0.85, P.hw * 1.02), at(0.45, P.hw * 0.95), at(0, P.hw * 0.5)];
    smooth(ctx, pts);
    if (mode === 'line') {
      paint(ctx, a, mode, null, FRILL.ink, lw);
      continue;
    }
    ctx.fillStyle = tone(a, back ? FRILL.sh : FRILL.base);
    ctx.fill();
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    glow(ctx, ...at(0.5, -P.hw * 0.3), P.hw * 1.8, back ? FRILL.base : FRILL.lt, 0.8);
    glow(ctx, ...at(0.05, 0), P.hw * 1.4, FRILL.deep, 0.45);
    // its soft folds
    pen(ctx, tone(a, FRILL.deep, 0.5), 0.45);
    for (const s of [-0.35, 0.3]) {
      ctx.beginPath();
      ctx.moveTo(...at(0.15, s * P.hw * 0.6));
      ctx.quadraticCurveTo(...at(0.6, s * P.hw * 1.1), ...at(0.95, s * P.hw * 1.3));
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ---------- The scallop-shell collar ----------
export function collar(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const cx = st[0] - 1.6;
  const cy = st[1] - 4.4;
  const R = 31;
  // a fan of seven ribs from the back of her neck, its rim one round scallop between each two
  const n = 7;
  const a0 = -Math.PI + 0.32;
  const a1 = -0.32;
  const rim = [];
  for (let i = 0; i <= n; i++) {
    const an = a0 + ((a1 - a0) * i) / n;
    rim.push([cx + Math.cos(an) * R, cy + Math.sin(an) * R * 0.92]);
    if (i < n) {
      const am = a0 + ((a1 - a0) * (i + 0.5)) / n;
      rim.push([cx + Math.cos(am) * R * 1.1, cy + Math.sin(am) * R * 1.02]);
    }
  }
  const pts = [[cx - 9, cy + 6], ...rim, [cx + 9, cy + 6]];
  smooth(ctx, pts);
  if (mode === 'line') {
    paint(ctx, a, mode, null, PEARL.ink, lw);
    ctx.restore();
    return;
  }
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, R * 1.1);
  g.addColorStop(0, tone(a, PEARL.deep));
  g.addColorStop(0.5, tone(a, PEARL.sh));
  g.addColorStop(0.85, tone(a, PEARL.base));
  g.addColorStop(1, tone(a, PEARL.sh));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  smooth(ctx, pts);
  ctx.clip();
  // the ribs: soft grooves of shade, a light along each ridge
  for (let i = 1; i < n; i++) {
    const an = a0 + ((a1 - a0) * i) / n;
    pen(ctx, tone(a, PEARL.ink, 0.75), 1.6);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(an) * 6, cy + Math.sin(an) * 6);
    ctx.lineTo(cx + Math.cos(an) * R * 1.02, cy + Math.sin(an) * R * 0.95);
    ctx.stroke();
    const al = an + 0.12;
    pen(ctx, 'rgba(255,255,255,0.6)', 0.8);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(al) * 8, cy + Math.sin(al) * 8);
    ctx.lineTo(cx + Math.cos(al) * R * 0.98, cy + Math.sin(al) * R * 0.9);
    ctx.stroke();
  }
  // a pearly sheen across it
  glow(ctx, cx - 8, cy - R * 0.6, 12, '#ffffff', 0.5);
  ctx.restore();
  ctx.restore();
}

// ---------- The bodice (cut from her torso's own outline) ----------
export function bodice(ctx, a, D) {
  const T = a.blTorsoPts;
  if (!T) return;
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const rb = D.J.ribs;
  const cx = st[0] + 1.2;
  const top = st[1] + 6.4;
  // the sweetheart neckline: two soft rounds over her bust dipping to a point in the middle, then the
  // gown on down past her hips (the torso's outline trims it)
  const neck = [[cx - 26, top + 3], [cx - 14, top - 1.2], [cx - 6.4, top - 1.4], [cx - 0.6, top + 2.6], [cx + 0.6, top + 2.6], [cx + 6.6, top - 1.6], [cx + 14.4, top - 1.0], [cx + 26, top + 3]];
  ctx.beginPath();
  ctx.moveTo(cx - 26, top + 60);
  ctx.lineTo(...neck[0]);
  for (let i = 1; i < neck.length - 1; i++) ctx.quadraticCurveTo(...neck[i], (neck[i][0] + neck[i + 1][0]) / 2, (neck[i][1] + neck[i + 1][1]) / 2);
  ctx.lineTo(...neck[neck.length - 1]);
  ctx.lineTo(cx + 26, top + 60);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - 14, 0, cx + 14, 0);
  g.addColorStop(0, tone(a, GOWN.sh));
  g.addColorStop(0.55, tone(a, GOWN.base));
  g.addColorStop(1, tone(a, GOWN.base));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // the bust's soft lights, the waist drawn in with shade, soft boning seams
  glow(ctx, cx + 6, top + 4.4, 6.4, GOWN.lt, 0.7);
  glow(ctx, cx - 6.4, top + 4.4, 5.4, GOWN.lt, 0.4);
  glow(ctx, cx - 12, rb[1] + 6, 9, GOWN.deep, 0.5);
  pen(ctx, tone(a, GOWN.deep, 0.5), 0.6);
  for (const dx of [-4, 4.6]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx, top + 6);
    ctx.quadraticCurveTo(cx + dx * 0.75, rb[1] + 2, cx + dx * 0.6, rb[1] + 9);
    ctx.stroke();
  }
  // a pale edging along the neckline
  pen(ctx, tone(a, FRILL.base, 0.95), 1.3);
  ctx.beginPath();
  ctx.moveTo(...neck[0]);
  for (let i = 1; i < neck.length - 1; i++) ctx.quadraticCurveTo(...neck[i], (neck[i][0] + neck[i + 1][0]) / 2, (neck[i][1] + neck[i + 1][1]) / 2);
  ctx.lineTo(...neck[neck.length - 1]);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
  // the teal sash at her waist (in the waist's frame) and the brooch at the neckline
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  enter(ctx, a, D, 'waistB');
  const w = D.J.waist;
  ctx.beginPath();
  ctx.moveTo(w[0] - 30, w[1] - 2.6);
  ctx.quadraticCurveTo(w[0], w[1] - 1.2, w[0] + 30, w[1] - 2.6);
  ctx.lineTo(w[0] + 30, w[1] + 3.2);
  ctx.quadraticCurveTo(w[0], w[1] + 4.6, w[0] - 30, w[1] + 3.2);
  ctx.closePath();
  ctx.fillStyle = tone(a, TEAL.base);
  ctx.fill();
  pen(ctx, tone(a, TEAL.lt, 0.85), 0.8);
  ctx.beginPath();
  ctx.moveTo(w[0] - 30, w[1] - 1.2);
  ctx.quadraticCurveTo(w[0], w[1] + 0.2, w[0] + 30, w[1] - 1.2);
  ctx.stroke();
  pen(ctx, tone(a, TEAL.sh, 0.8), 0.7);
  ctx.beginPath();
  ctx.moveTo(w[0] - 30, w[1] + 2.4);
  ctx.quadraticCurveTo(w[0], w[1] + 3.8, w[0] + 30, w[1] + 2.4);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, 'chest');
  seaGlass(ctx, a, cx + 0.2, top + 3.4, 2.3, a.abQ?.glow ?? 0.5);
  ctx.restore();
}
// A drop of violet sea-glass in a little teal setting, glowing softly.
function seaGlass(ctx, a, x, y, r, k) {
  glow(ctx, x, y, r * 2.6, LIGHT.halo, 0.25 + 0.35 * k);
  ell(ctx, x, y - r * 0.9, r * 0.55, r * 0.4);
  ctx.fillStyle = tone(a, TEAL.sh);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r, y - r * 0.2, x + r * 0.7, y + r * 0.5);
  ctx.quadraticCurveTo(x, y + r * 1.25, x - r * 0.7, y + r * 0.5);
  ctx.quadraticCurveTo(x - r, y - r * 0.2, x, y - r);
  ctx.fillStyle = tone(a, GLASS.base);
  ctx.fill();
  pen(ctx, tone(a, GLASS.ink), 0.45);
  ctx.stroke();
  glow(ctx, x, y + r * 0.1, r * 0.8, LIGHT.mid, 0.4 + 0.5 * k);
  ell(ctx, x - r * 0.3, y - r * 0.25, r * 0.22, r * 0.14, -0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
}
// The choker: a teal ribbon round her throat, a sea-glass drop.
export function choker(ctx, a, mode, D, lw) {
  if (mode !== 'fill') return;
  ctx.save();
  enter(ctx, a, D, 'chest');
  const n = D.J.neck;
  const st = D.J.stern;
  const y = mix(n[1], st[1], 0.6);
  ctx.beginPath();
  ctx.moveTo(n[0] - 4.6, y - 1.2);
  ctx.quadraticCurveTo(n[0], y + 0.8, n[0] + 4.8, y - 1.2);
  ctx.lineTo(n[0] + 4.8, y + 0.9);
  ctx.quadraticCurveTo(n[0], y + 2.9, n[0] - 4.6, y + 0.9);
  ctx.closePath();
  ctx.fillStyle = tone(a, TEAL.base);
  ctx.fill();
  seaGlass(ctx, a, n[0] + 0.6, y + 3.4, 1.3, a.abQ?.glow ?? 0.5);
  ctx.restore();
}

// ---------- The sleeves ----------
// A fitted violet sleeve on one arm (k 'N' near, 'F' far): the upper arm and the forearm each a tube a
// little wider than the arm, a soft puff at the shoulder, an orchid frill at the cuff.
export function sleeve(ctx, a, mode, D, k, lw) {
  const near = k === 'N';
  const C = near ? GOWN.base : GOWN.sh;
  const tube = (bone, j0, j1, w0, w1, extra) => {
    ctx.save();
    enter(ctx, a, D, bone);
    const p0 = D.J[j0];
    const p1 = D.J[j1];
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    ctx.translate(p0[0], p0[1]);
    ctx.rotate(an);
    smooth(ctx, [[-w0 * 0.6, -w0], [L * 0.5, -(w0 + w1) * 0.52], [L + extra, -w1], [L + extra + w1 * 0.3, 0], [L + extra, w1], [L * 0.5, (w0 + w1) * 0.52], [-w0 * 0.6, w0]]);
    paint(ctx, a, mode, C, GOWN.ink, lw);
    if (mode === 'fill') {
      ctx.save();
      ctx.clip();
      const g = ctx.createLinearGradient(0, -w0, 0, w0);
      g.addColorStop(0, tone(a, near ? GOWN.lt : GOWN.base, 0.8));
      g.addColorStop(0.45, tone(a, C, 0));
      g.addColorStop(1, tone(a, GOWN.deep, 0.5));
      ctx.fillStyle = g;
      ctx.fillRect(-w0 * 2, -w0 * 1.4, L + w0 * 4, w0 * 2.8);
      ctx.restore();
    }
    ctx.restore();
    return { an, L };
  };
  tube(`arm${k}u`, `sh${k}`, `el${k}`, 4.6, 4.0, 1.4);
  tube(`arm${k}f`, `el${k}`, `wr${k}`, 4.0, 3.3, 0.4);
  // the puff at the shoulder
  ctx.save();
  enter(ctx, a, D, `arm${k}u`);
  const sh = D.J[`sh${k}`];
  ctx.beginPath();
  for (const [dx, dy, rx, ry] of [[-2.2, 1.6, 4, 4.2], [1.4, 2.6, 4.4, 4.4], [3.2, 0.8, 3.4, 3.6]]) {
    ctx.moveTo(sh[0] + dx + rx, sh[1] + dy);
    ctx.ellipse(sh[0] + dx, sh[1] + dy, rx, ry, 0, 0, TAU);
  }
  paint(ctx, a, mode, C, GOWN.ink, lw);
  if (mode === 'fill') glow(ctx, sh[0] - 0.4, sh[1] + 0.6, 5, near ? GOWN.lt : GOWN.base, 0.75);
  ctx.restore();
  // the frill at the cuff: a ring of soft round ruffles round the wrist
  ctx.save();
  enter(ctx, a, D, `arm${k}f`);
  const el = D.J[`el${k}`];
  const wr = D.J[`wr${k}`];
  const an = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
  ctx.translate(wr[0], wr[1]);
  ctx.rotate(an);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const v = -4.4 + i * 2.2;
    ctx.moveTo(-0.6 + 2.2, v);
    ctx.ellipse(-0.6, v, 2.2, 1.6, 0, 0, TAU);
  }
  paint(ctx, a, mode, near ? FRILL.base : FRILL.sh, FRILL.ink, lw);
  if (mode === 'fill') glow(ctx, -0.6, -2, 3.4, FRILL.lt, 0.8);
  ctx.restore();
}

// ---------- The crook and the lantern ----------
// Where the lantern hangs (the rig's space, base px), from the far hand: the crook's foot in her hand,
// its shaft up past her shoulder, its top curling over forward; the lantern on its ring under the hook.
// q.crook: the crook's angle off upright (radians, + leaning forward); a.abLamp: the lantern's swing.
export function crookGeom(a, D) {
  const q = a.abQ ?? {};
  const hd = ptOf(a, D, 'handF', D.J.handF);
  const an = q.crook ?? 0.08;
  const up = [Math.sin(an), -Math.cos(an)];
  const fw = [Math.cos(an), Math.sin(an)];
  const foot = [hd[0] - up[0] * 7, hd[1] - up[1] * 7];
  const top = [hd[0] + up[0] * 31, hd[1] + up[1] * 31];
  // (the hook: round over forward and a little down)
  const hook = [top[0] + fw[0] * 5.4 + up[0] * 2.2, top[1] + fw[1] * 5.4 + up[1] * 2.2];
  const end = [top[0] + fw[0] * 8.6 - up[0] * 1.6, top[1] + fw[1] * 8.6 - up[1] * 1.6];
  const sw = a.abLamp ?? 0;
  const ring = [end[0], end[1] + 0.6];
  const hang = 5.6;
  const lamp = [ring[0] + Math.sin(sw) * hang, ring[1] + Math.cos(sw) * hang];
  return { hd, foot, top, hook, end, ring, lamp, sw, an };
}
export function crook(ctx, a, mode, D, lw) {
  const q = a.abQ ?? {};
  if (q.noCrook) return;
  const G = crookGeom(a, D);
  ctx.save();
  // the shaft and the hook: one smooth stroke, a tube of lacquered wood
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(...G.foot);
    ctx.lineTo(...G.top);
    ctx.bezierCurveTo(G.top[0] + (G.hook[0] - G.top[0]) * 0.4 - (G.end[0] - G.top[0]) * 0.1, G.top[1] - 5, G.hook[0] + 2.6 * Math.cos(G.an), G.hook[1] - 2.4, G.end[0], G.end[1]);
  };
  path();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (mode === 'line') {
    ctx.strokeStyle = tone(a, STAFF.ink);
    ctx.lineWidth = 2.4 + lw * 2;
    ctx.stroke();
  } else {
    ctx.strokeStyle = tone(a, STAFF.base);
    ctx.lineWidth = 2.4;
    ctx.stroke();
    path();
    ctx.strokeStyle = tone(a, STAFF.lt, 0.6);
    ctx.lineWidth = 0.7;
    ctx.save();
    ctx.translate(-0.5, -0.3);
    ctx.stroke();
    ctx.restore();
    // a teal band near the top
    ell(ctx, G.top[0] - Math.sin(G.an) * 3, G.top[1] + Math.cos(G.an) * 3, 1.7, 1.1, G.an);
    ctx.fillStyle = tone(a, TEAL.base);
    ctx.fill();
  }
  ctx.restore();
  lantern(ctx, a, mode, G.ring, G.lamp, G.sw, q.lamp ?? 1, lw);
}
// The lantern: a ring and its little chain, the cap, the glass globe with the light in it.
export function lantern(ctx, a, mode, ring, at, sw, Lv, lw, s = 1) {
  const t = a.t ?? 0;
  ctx.save();
  ctx.translate(at[0], at[1]);
  ctx.rotate(-sw);
  ctx.scale(s, s);
  const gr = 4.6;
  const gy = 5.4;
  if (mode === 'line') {
    ell(ctx, 0, gy, gr, gr * 0.98);
    pen(ctx, tone(a, GLASS.ink), lw);
    ctx.stroke();
    smooth(ctx, [[-3.2, 1.2], [0, -1.6], [3.2, 1.2], [2.6, 2.6], [-2.6, 2.6]]);
    pen(ctx, tone(a, CAP.ink), lw);
    ctx.stroke();
    ctx.restore();
    return;
  }
  // the ring it hangs by
  pen(ctx, tone(a, CAP.base), 0.7);
  ctx.beginPath();
  ctx.arc(0, -2.6, 1.3, 0, TAU);
  ctx.moveTo(0, -1.3);
  ctx.lineTo(0, -0.6);
  ctx.stroke();
  // the glass globe: violet sea-glass, frosted, the light inside
  ell(ctx, 0, gy, gr, gr * 0.98);
  ctx.fillStyle = tone(a, GLASS.base);
  ctx.fill();
  ctx.save();
  ell(ctx, 0, gy, gr, gr * 0.98);
  ctx.clip();
  ell(ctx, 1.2, gy + 1.4, gr * 0.95, gr * 0.9);
  ctx.fillStyle = tone(a, GLASS.sh, 0.5);
  ctx.fill();
  const k = clamp(Lv, 0, 2.6);
  const r = 1.6 + 1.3 * Math.min(k, 2);
  if (k > 0.01) {
    const g = ctx.createRadialGradient(0, gy + 0.2, 0, 0, gy + 0.2, r * 1.4);
    g.addColorStop(0, `rgba(255,251,230,${Math.min(1, k)})`);
    g.addColorStop(0.4, `rgba(255,215,112,${0.92 * Math.min(1, k)})`);
    g.addColorStop(1, 'rgba(255,184,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-r * 1.5, gy - r * 1.5, r * 3, r * 3);
    for (let i = 0; i < 2; i++) {
      const qq = t * 0.9 + i * 3.1;
      sparkle(ctx, Math.sin(qq) * 1.5, gy + Math.cos(qq * 0.8 + i) * 1.2, (0.6 + 0.25 * Math.sin(qq * 2.3)) * Math.min(1, k), 0.9 * Math.min(1, k), '#ffffff');
    }
  }
  ctx.restore();
  // its shine
  ctx.beginPath();
  ctx.arc(0, gy, gr - 0.8, Math.PI * 1.05, Math.PI * 1.48);
  pen(ctx, 'rgba(255,255,255,0.85)', 0.6);
  ctx.stroke();
  // the cap: dark violet, the teal band, a tiny starfish
  smooth(ctx, [[-3.2, 1.2], [0, -1.6], [3.2, 1.2], [2.6, 2.6], [-2.6, 2.6]]);
  ctx.fillStyle = tone(a, CAP.base);
  ctx.fill();
  ell(ctx, -0.8, 0.1, 1.2, 0.6, -0.3);
  ctx.fillStyle = tone(a, CAP.lt, 0.7);
  ctx.fill();
  ctx.fillStyle = tone(a, TEAL.base);
  ctx.fillRect(-3, 1.6, 6, 0.9);
  starfish(ctx, a, 'fill', 1.6, 2.1, 0.85, 0.3, lw);
  // the little knob under it
  ell(ctx, 0, gy + gr + 0.3, 1, 0.7);
  ctx.fillStyle = tone(a, CAP.base);
  ctx.fill();
  ctx.restore();
  // its glow on the water round it
  if (Lv > 0.02) glow(ctx, at[0], at[1] + gy * s, 13 * s * Math.min(1.6, Lv), LIGHT.halo, 0.22 * Math.min(1, Lv));
}

// ---------- The compact mirror (her idle act) ----------
export function compact(ctx, a, mode, x, y, open, ang, lw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // the bottom shell, and the lid swung up on its hinge (open 0..1)
  const shell = (flip) => {
    ctx.beginPath();
    ctx.moveTo(-3.2, 0);
    ctx.quadraticCurveTo(-3.4, flip * 3.2, 0, flip * 3.4);
    ctx.quadraticCurveTo(3.4, flip * 3.2, 3.2, 0);
    ctx.closePath();
  };
  shell(1);
  paint(ctx, a, mode, PEARL.base, PEARL.ink, lw);
  ctx.save();
  ctx.rotate(-open * 2.2);
  shell(-1);
  paint(ctx, a, mode, PEARL.sh, PEARL.ink, lw);
  if (mode === 'fill' && open > 0.3) {
    // the mirror inside the lid
    ell(ctx, 0, -1.6, 2.3, 1.4);
    ctx.fillStyle = tone(a, '#e8f6ff');
    ctx.fill();
    pen(ctx, 'rgba(255,255,255,0.9)', 0.4);
    ctx.beginPath();
    ctx.moveTo(-1.2, -2.2);
    ctx.lineTo(-0.2, -1.0);
    ctx.stroke();
  }
  ctx.restore();
  if (mode === 'fill') {
    pen(ctx, tone(a, PEARL.deep, 0.7), 0.35);
    for (const dx of [-1.4, 0, 1.4]) {
      ctx.beginPath();
      ctx.moveTo(dx * 0.3, 0.6);
      ctx.lineTo(dx, 2.8);
      ctx.stroke();
    }
  }
  ctx.restore();
}
