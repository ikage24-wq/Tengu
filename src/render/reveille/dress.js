// Madame Reveille's clothes and things (remade 2026-11-27, drawn from scratch): what she wears is cut from her body's
// own outline or wraps her limbs (never a flat panel pasted on, never over her face or her arms), each piece in both of
// the rig's passes (mode 'line' its outline, 'fill' itself) so only her outer edge is outlined, in a deeper shade of its
// own colour. The Queen's pink-and-brass bedside clock, worn as a brisk morning governess, with a rooster's pride.
//   waistcoat  rose, cut from her torso's outline, two rows of gold buttons down its fronts, gold piping; a cream
//              blouse in its V with a jabot of three soft ruffles cascading down it
//   collar     a cream ruffled stand collar round her throat, her clock brooch at the front (a little gold-rimmed dial)
//   skirt      rose, pleated, from her hips to just above her knees, its hem spanning wherever her knees are (so it
//              moves with her legs, never a rigid bell); a gold hem band marked like a clock's bezel, a cream petticoat
//              frill peeking under it
//   bustle     at the small of her back: a rose bow with a gold heart, and out of it three rooster plumes arching back
//              and down (deep iridescent teal, the longest tipped gold), each on its own spring
//   sleeves    leg-of-mutton: a big soft puff at the shoulder, fitted down the forearm, a cream ruffle at the wrist
//   legs       white stockings, rose button boots with a little gold heel
//   handbell   her brass handbell in her near hand (a.rvBell: { rot }, 0 hanging straight down from her grip), a
//              cream handle with a gold knob, its clapper swinging inside on its own spring (a.rvClap)
//   watch      a gold pocket watch on a chain clipped at her hip (a.rvWatch: 0 hanging .. 1 up in her far hand)
import { TAU, mix, tone, ell, pen, glow, clamp, sstep } from './fx.js';
import { poly, chaikin } from './head.js';
import { ROSE, CREAM, GOLD, PLUME, STOCK, SHOE, HANDLE, DIAL } from './palette.js';

// ---------- The kit ----------
export function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
export const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
export const orig = (a, bone) => {
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
export function tubePath(ctx, pts, W) {
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
export const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
function button(ctx, a, x, y, r) {
  ell(ctx, x, y, r, r);
  ctx.fillStyle = tone(a, GOLD.base);
  ctx.fill();
  pen(ctx, tone(a, GOLD.deep), r * 0.32);
  ctx.stroke();
  ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.34, r * 0.26);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
}
// a soft ruffle: a band of round scallops along a line from p to q, `n` of them, `d` deep
function ruffle(ctx, p, q, n, d, out = 1) {
  const an = Math.atan2(q[1] - p[1], q[0] - p[0]);
  const nx = -Math.sin(an) * out;
  const ny = Math.cos(an) * out;
  ctx.beginPath();
  ctx.moveTo(p[0] - nx * d * 0.3, p[1] - ny * d * 0.3);
  for (let i = 0; i < n; i++) {
    const u0 = i / n;
    const u1 = (i + 1) / n;
    const um = (u0 + u1) / 2;
    const m = lerp2(p, q, um);
    const e = lerp2(p, q, u1);
    ctx.quadraticCurveTo(m[0] + nx * d * 1.6, m[1] + ny * d * 1.6, e[0] + nx * d * 0.1, e[1] + ny * d * 0.1);
  }
  ctx.lineTo(q[0] - nx * d * 0.3, q[1] - ny * d * 0.3);
  ctx.closePath();
}

// ---------- Waistcoat and blouse (cut from her torso's outline) ----------
export function waistcoat(ctx, a, mode, D, lw) {
  const T = a.blTorsoPts;
  if (!T) return;
  if (mode === 'line') {
    poly(ctx, T);
    pen(ctx, tone(a, ROSE.ink), lw);
    ctx.stroke();
    return;
  }
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  ctx.fillStyle = tone(a, ROSE.base);
  ctx.fillRect(-300, -300, 600, 600);
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const rb = D.J.ribs;
  const cx = st[0] + 1.6;
  glow(ctx, cx + 6, st[1] + 7, 10, ROSE.lt, 0.6);
  glow(ctx, cx - 10, rb[1] + 3, 10, ROSE.deep, 0.5);
  // the cream blouse in the waistcoat's V, from the throat down to its point at the waist
  const vb = rb[1] + 13;
  ctx.beginPath();
  ctx.moveTo(cx - 4.4, st[1] - 3);
  ctx.lineTo(cx + 5.2, st[1] - 3);
  ctx.quadraticCurveTo(cx + 3.6, rb[1] + 2, cx + 0.8, vb);
  ctx.quadraticCurveTo(cx - 2.6, rb[1] + 2, cx - 4.4, st[1] - 3);
  ctx.closePath();
  ctx.fillStyle = tone(a, CREAM.base);
  ctx.fill();
  glow(ctx, cx - 1.6, rb[1] + 2, 4, CREAM.sh, 0.6);
  // gold piping down the V's edges and along the hem
  pen(ctx, tone(a, GOLD.base), 0.8);
  ctx.beginPath();
  ctx.moveTo(cx - 4.4, st[1] - 3);
  ctx.quadraticCurveTo(cx - 2.6, rb[1] + 2, cx + 0.8, vb);
  ctx.quadraticCurveTo(cx + 3.6, rb[1] + 2, cx + 5.2, st[1] - 3);
  ctx.stroke();
  // the jabot: three soft cream ruffles cascading down the V
  for (let i = 0; i < 3; i++) {
    const y0 = st[1] + 1 + i * 4.6;
    const hw = 3.6 - i * 0.7;
    // (a little fan of cloth: narrow at its top, three round scallops along its foot)
    const jx = cx + 0.4;
    ctx.beginPath();
    ctx.moveTo(jx - 0.9, y0);
    ctx.quadraticCurveTo(jx, y0 - 0.6, jx + 0.9, y0);
    ctx.lineTo(jx + hw, y0 + 3.0);
    for (let k = 0; k < 3; k++) {
      const xa = jx + hw - ((k + 1) * 2 * hw) / 3;
      const xm = jx + hw - ((k + 0.5) * 2 * hw) / 3;
      ctx.quadraticCurveTo(xm, y0 + 4.6, xa, y0 + 3.0);
    }
    ctx.closePath();
    ctx.fillStyle = tone(a, CREAM.lt);
    ctx.fill();
    pen(ctx, tone(a, CREAM.deep), 0.4);
    ctx.stroke();
    glow(ctx, cx + 0.4, y0 + 2.6, 2.2, CREAM.sh, 0.5);
  }
  // two rows of gold buttons down the fronts
  for (let i = 0; i < 3; i++) {
    const y = st[1] + 4 + i * 5.2;
    const off = 6.2 - i * 0.9;
    button(ctx, a, cx - off - 0.4, y, 0.95);
    button(ctx, a, cx + off + 1.2, y, 0.95);
  }
  ctx.restore();
  // the waistcoat's pointed hem at her waist: a gold piping line (in the waist's frame)
  ctx.save();
  enter(ctx, a, D, 'waistB');
  const nv = D.J.navel;
  pen(ctx, tone(a, GOLD.sh), 0.8);
  ctx.beginPath();
  ctx.moveTo(nv[0] - 40, nv[1] + 1.4);
  ctx.quadraticCurveTo(nv[0] - 6, nv[1] + 2.6, nv[0] + 2.4, nv[1] + 6.2);
  ctx.quadraticCurveTo(nv[0] + 8, nv[1] + 2.6, nv[0] + 40, nv[1] + 1.4);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
// The cream stand collar, ruffled, and her clock brooch at the front.
export function collar(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const cx = st[0] + 1.4;
  const y = st[1] - 3.6;
  const w = lw / D.SC;
  // the collar's band round the throat, scalloped on top
  ruffle(ctx, [cx - 6.4, y], [cx + 7.4, y], 6, 1.6, -1);
  paint(ctx, a, mode, CREAM.base, CREAM.ink, w);
  if (mode === 'fill') {
    glow(ctx, cx - 3, y + 0.6, 3.4, CREAM.sh, 0.6);
    // the brooch: a little dial in a gold rim, hands at seven to six
    ell(ctx, cx + 0.8, y + 1.6, 2.0, 2.0);
    ctx.fillStyle = tone(a, GOLD.base);
    ctx.fill();
    pen(ctx, tone(a, GOLD.deep), 0.35);
    ctx.stroke();
    ell(ctx, cx + 0.8, y + 1.6, 1.4, 1.4);
    ctx.fillStyle = tone(a, DIAL.base);
    ctx.fill();
    pen(ctx, tone(a, DIAL.hand), 0.3);
    ctx.beginPath();
    ctx.moveTo(cx + 0.8, y + 1.6);
    ctx.lineTo(cx + 0.8, y + 0.5);
    ctx.moveTo(cx + 0.8, y + 1.6);
    ctx.lineTo(cx + 0.2, y + 2.4);
    ctx.stroke();
    ell(ctx, cx + 0.3, y + 1.0, 0.36, 0.26);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  }
  ctx.restore();
}

// ---------- The bustle: a rose bow and three rooster plumes ----------
// a.rvPlume: [three springs], each a turn about its root.
export function bustle(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'waistB');
  const nv = D.J.navel;
  const bx = nv[0] - 9.0;
  const by = nv[1] + 1.4;
  const sp = a.rvPlume ?? [0, 0, 0];
  const fan = a.rvFan ?? 0;
  const w = lw / D.SC;
  // the three plumes: [length, its rest turn, how high it arches, width at its root, gold tip]
  const P = [
    [34, 0.7 + fan * 0.4, 12, 8.4, true],
    [28, 0.98 + fan * 0.3, 9, 7.2, false],
    [23, 0.42 + fan * 0.3, 6, 6.4, false],
  ];
  P.forEach(([len, r0, arch, wd, tip], i) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(r0 + clamp(sp[i] ?? 0, -0.7, 0.7));
    // (a sickle feather: up and back, then sweeping down, tapering to a round tip)
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const u = k / 10;
      pts.push([-len * u, -arch * Math.sin(u * Math.PI * 0.85) + u * u * len * 0.32]);
    }
    // (a feather: full through its middle, narrow at the quill, tapering to a soft round tip)
    const W = pts.map((_, k) => Math.max(1.4, wd * (0.55 + 0.45 * Math.sin(Math.min(1, (k / 10) * 1.6) * Math.PI * 0.5)) * (1 - Math.max(0, k / 10 - 0.55) * 1.3)));
    tubePath(ctx, pts, W);
    paint(ctx, a, mode, i === 0 ? PLUME.base : i === 1 ? PLUME.sh : PLUME.deep, PLUME.ink, w);
    if (mode === 'fill') {
      ctx.save();
      tubePath(ctx, pts, W);
      ctx.clip();
      // an iridescent sheen along its top, its shaft a fine light line
      glow(ctx, ...pts[4], wd * 1.4, PLUME.lt, 0.45);
      pen(ctx, tone(a, PLUME.sheen, 0.7), 0.55);
      ctx.beginPath();
      ctx.moveTo(...pts[1]);
      for (let k = 2; k < 9; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.stroke();
      if (tip) {
        const e = pts[10];
        glow(ctx, e[0], e[1], 5, GOLD.base, 0.9);
        glow(ctx, e[0], e[1], 2.6, GOLD.lt, 0.8);
      }
      ctx.restore();
    }
    ctx.restore();
  });
  // the rose bow over their roots, a gold heart
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx - 2 + s * 3.6, by + s * 5.6 - 1.4, bx - 6.4, by + s * 3.4);
    ctx.quadraticCurveTo(bx - 5.4, by + s * 0.6, bx, by);
    ctx.closePath();
    paint(ctx, a, mode, ROSE.base, ROSE.ink, w);
    if (mode === 'fill') glow(ctx, bx - 4.2, by + s * 2.4, 2.2, ROSE.lt, 0.55);
  }
  ell(ctx, bx, by, 1.9, 2.1);
  paint(ctx, a, mode, GOLD.base, GOLD.ink, w);
  if (mode === 'fill') {
    ell(ctx, bx - 0.5, by - 0.6, 0.6, 0.45);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Her skirt: rose, pleated, to just above her knees (its hem spans her knees) ----------
function skirtPts(a, D) {
  const hip = D.J.hip;
  const S = a.rvSkirt ?? 0;
  const hl = ptOf(a, D, 'torso', [hip[0] - 11.4, hip[1] - 4.4]);
  const hr = ptOf(a, D, 'torso', [hip[0] + 11.4, hip[1] - 4.4]);
  const hm = ptOf(a, D, 'torso', [hip[0], hip[1] - 5.6]);
  const kN = orig(a, 'shinN');
  const kF = orig(a, 'shinF');
  // (sat down, her knees come up: the skirt still drapes down over them, never flips up, never splays)
  const back = Math.max(hl[0] - 9, Math.min(kN[0], kF[0], hl[0]) - 5) + S * 2.2;
  const front = Math.min(hr[0] + 14, Math.max(kN[0], kF[0], hr[0]) + 3.6) + S * 2.2;
  const hemY = Math.max(Math.max(kN[1], kF[1]) - 3.2, hm[1] + 11);
  const mid = (back + front) / 2;
  return { pts: chaikin([hl, hm, hr, [mix(hr[0], front, 0.45), mix(hr[1], hemY, 0.45)], [mix(hr[0], front, 0.9), mix(hr[1], hemY, 0.9)], [front, hemY - 0.6], [mid + S * 1.2, hemY + 1.2], [back, hemY - 0.6], [mix(hl[0], back, 0.9), mix(hl[1], hemY, 0.9)], [mix(hl[0], back, 0.45), mix(hl[1], hemY, 0.45)]], 2), back, front, hemY, top: hm[1] };
}
export function skirt(ctx, a, mode, D, lw) {
  const K = skirtPts(a, D);
  const mid = (K.back + K.front) / 2;
  // the cream petticoat frill peeking under the hem
  ruffle(ctx, [K.back + 1, K.hemY - 1], [K.front - 1, K.hemY - 1], 7, 1.0, 1);
  paint(ctx, a, mode, CREAM.base, CREAM.ink, lw);
  poly(ctx, K.pts);
  if (mode === 'line') return paint(ctx, a, mode, null, ROSE.ink, lw);
  const g = ctx.createLinearGradient(0, K.top, 0, K.hemY);
  g.addColorStop(0, tone(a, ROSE.sh));
  g.addColorStop(0.35, tone(a, ROSE.base));
  g.addColorStop(1, tone(a, ROSE.sh));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  poly(ctx, K.pts);
  ctx.clip();
  // (knife pleats, each lit or shaded by the way it faces, fanning from the waist)
  const n = 8;
  for (let i = 0; i < n; i++) {
    const u0 = i / n;
    const x0 = mix(K.back, K.front, u0);
    const x1 = mix(K.back, K.front, u0 + 1 / n);
    ctx.fillStyle = i % 2 ? tone(a, ROSE.lt, 0.3) : tone(a, ROSE.deep, 0.2);
    ctx.beginPath();
    ctx.moveTo(mix(x0, mid, 0.5), K.top);
    ctx.lineTo(mix(x1, mid, 0.5), K.top);
    ctx.lineTo(x1, K.hemY + 2);
    ctx.lineTo(x0, K.hemY + 2);
    ctx.closePath();
    ctx.fill();
  }
  // the gold hem band, marked like a clock's bezel
  const bandTop = (x) => K.hemY - 2.6 + 0.0004 * (x - mid) ** 2 * 0;
  ctx.fillStyle = tone(a, GOLD.base);
  ctx.beginPath();
  ctx.moveTo(K.back - 2, bandTop(K.back));
  ctx.quadraticCurveTo(mid, K.hemY - 1.2, K.front + 2, K.hemY - 2.6);
  ctx.lineTo(K.front + 2, K.hemY + 2);
  ctx.lineTo(K.back - 2, K.hemY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tone(a, GOLD.lt, 0.7);
  ctx.fillRect(K.back - 2, K.hemY - 1.6, K.front - K.back + 4, 0.5);
  pen(ctx, tone(a, GOLD.deep, 0.8), 0.45);
  for (let i = 1; i < 6; i++) {
    const x = mix(K.back, K.front, i / 6);
    ctx.beginPath();
    ctx.moveTo(x, K.hemY - 0.6);
    ctx.lineTo(x, K.hemY + 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Sleeves: leg-of-mutton, a soft puff at the shoulder, a ruffle at the wrist ----------
export function sleeve(ctx, a, mode, D, k, lw) {
  const near = k === 'N';
  const sh = orig(a, `arm${k}u`);
  const el = orig(a, `arm${k}f`);
  const wr = orig(a, `hand${k}`);
  const A = D.spec?.arm ?? { aw0: 5, ew: 4.4, aw1: 3.8 };
  const pts = [sh, lerp2(sh, el, 0.38), lerp2(sh, el, 0.86), el, lerp2(el, wr, 0.5), lerp2(el, wr, 0.86)];
  const W = [A.aw0 * 1.9, A.aw0 * 2.15, A.ew * 1.25, A.ew * 1.1, A.aw1 * 1.12, A.aw1 * 1.08].map((v) => v * D.SC);
  tubePath(ctx, pts, W);
  paint(ctx, a, mode, near ? ROSE.base : ROSE.sh, ROSE.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    glow(ctx, ...lerp2(sh, el, 0.3), W[1] * 0.75, near ? ROSE.lt : ROSE.base, 0.65);
    // (the puff's gathers where it meets the forearm)
    pen(ctx, tone(a, ROSE.deep, 0.4), 0.35);
    const g = lerp2(sh, el, 0.78);
    const an = Math.atan2(el[1] - sh[1], el[0] - sh[0]);
    for (const d of [-0.5, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(g[0] - Math.sin(an) * W[2] * d, g[1] + Math.cos(an) * W[2] * d);
      ctx.lineTo(g[0] - Math.cos(an) * W[2] * 0.6 - Math.sin(an) * W[1] * d * 0.8, g[1] - Math.sin(an) * W[2] * 0.6 + Math.cos(an) * W[1] * d * 0.8);
      ctx.stroke();
    }
    ctx.restore();
  }
  // the cream ruffle at the wrist
  const an = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
  const c = lerp2(el, wr, 0.92);
  ctx.save();
  ctx.translate(c[0], c[1]);
  ctx.rotate(an);
  const r = A.aw1 * D.SC * 0.95;
  ctx.beginPath();
  ctx.moveTo(-0.6, -r);
  for (let i = 0; i < 3; i++) {
    const y0 = -r + (i * 2 * r) / 3;
    ctx.quadraticCurveTo(1.6, y0 + r / 3, -0.2, y0 + (2 * r) / 3);
  }
  ctx.lineTo(-0.9, r);
  ctx.lineTo(-0.9, -r);
  ctx.closePath();
  paint(ctx, a, mode, near ? CREAM.base : CREAM.sh, CREAM.ink, lw);
  ctx.restore();
}

// ---------- Stockings and button boots ----------
export function stocking(ctx, a, mode, D, k, lw) {
  const hip = orig(a, `thigh${k}`);
  const knee = orig(a, `shin${k}`);
  const ank = orig(a, `foot${k}`);
  const Lg = D.spec?.leg ?? { tw: 8.5, kw: 5.9, anw: 4.2 };
  const pts = [lerp2(hip, knee, 0.1), lerp2(hip, knee, 0.55), knee, lerp2(knee, ank, 0.35), ank];
  const W = [Lg.tw * 1.02, Lg.tw * 0.92, Lg.kw * 1.06, Lg.kw * 1.08, Lg.anw * 1.08].map((v) => v * D.SC);
  tubePath(ctx, pts, W);
  const far = k === 'F';
  paint(ctx, a, mode, far ? STOCK.sh : STOCK.base, STOCK.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    glow(ctx, ...lerp2(knee, ank, 0.5), Lg.kw * D.SC * 1.2, far ? STOCK.deep : STOCK.sh, 0.45);
    ctx.restore();
  }
}
export function boot(ctx, a, mode, D, k, lw) {
  const Lg = D.spec?.leg ?? { anw: 4.2, heel: 2.7, toe: 6.8, ftop: 1.2, fbot: 4 };
  const far = k === 'F';
  const M = a.blMat(`foot${k}`);
  ctx.save();
  ctx.transform(...M);
  const hl = Lg.heel * 1.12;
  const to = Lg.toe * 1.06;
  const s = D.SC;
  // (an ankle boot: its shaft up round the ankle, a round toe, a little heel)
  const pts = chaikin([[-hl, -Lg.ftop * 2.6], [Lg.anw * 0.55, -Lg.ftop * 2.6], [Lg.anw * 0.6, -Lg.ftop * 0.4], [to * 0.62, Lg.fbot * 0.24], [to * 1.02, Lg.fbot * 0.6], [to * 0.94, Lg.fbot + 0.25], [-hl * 0.6, Lg.fbot + 0.25], [-hl, Lg.fbot + 1.0], [-hl * 1.15, Lg.fbot * 0.3]], 2).map(([x, y]) => [x * s, y * s]);
  poly(ctx, pts);
  paint(ctx, a, mode, far ? SHOE.sh : SHOE.base, SHOE.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    glow(ctx, to * 0.55 * s, Lg.fbot * 0.3 * s, 2.4 * s, SHOE.lt, 0.8);
    // the gold heel
    ctx.fillStyle = tone(a, GOLD.sh);
    ctx.fillRect(-hl * 1.2 * s, (Lg.fbot - 0.6) * s, hl * 0.75 * s, 2 * s);
    ctx.restore();
    // two little gold buttons up its side
    for (const y of [-Lg.ftop * 1.9, -Lg.ftop * 0.7]) button(ctx, a, Lg.anw * 0.3 * s, y * s, 0.45 * s);
  }
  ctx.restore();
}

// ---------- Her brass handbell (near hand) ----------
// a.rvBell.rot: 0 hanging straight down from her grip (handle up in her hand, the bell below).
export const HB = { handle: 6.2, r: 4.4, h: 6.8 };
export function bellGeom(a, D) {
  const hand = ptOf(a, D, 'handN', D.J.handN);
  return { x: hand[0], y: hand[1], rot: a.rvBell?.rot ?? 0, clap: a.rvClap ?? 0 };
}
export function handbell(ctx, a, mode, D, lw) {
  if (a.rvQ?.noBell) return;
  const G = bellGeom(a, D);
  drawHandbell(ctx, a, mode, G.x, G.y, G.rot, G.clap, lw);
}
export function drawHandbell(ctx, a, mode, x, y, rot, clap, lw) {
  const { handle, r, h } = HB;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // the handle: from a gold knob above her grip down into the bell's crown
  const y0 = -handle * 0.45;
  const y1 = handle * 0.55;
  ctx.beginPath();
  ctx.roundRect(-0.85, y0, 1.7, y1 - y0, 0.85);
  paint(ctx, a, mode, HANDLE.base, HANDLE.ink, lw);
  if (mode === 'fill') {
    ctx.fillStyle = tone(a, HANDLE.lt);
    ctx.fillRect(-0.55, y0 + 0.6, 0.45, y1 - y0 - 1.2);
  }
  ell(ctx, 0, y0 - 0.5, 1.35, 1.2);
  paint(ctx, a, mode, GOLD.base, GOLD.ink, lw);
  // the clapper, swinging inside (drawn first: the bell's mouth covers its top)
  const by0 = y1 + 0.4;
  const mouthY = by0 + h;
  ctx.save();
  ctx.translate(0, by0 + 1.6);
  ctx.rotate(clamp(clap, -0.6, 0.6));
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, h - 3.2);
  pen(ctx, tone(a, mode === 'line' ? GOLD.ink : GOLD.deep), mode === 'line' ? 0.5 + lw : 0.5);
  ctx.stroke();
  ell(ctx, 0, h - 2.4, 1.15, 1.15);
  paint(ctx, a, mode, GOLD.sh, GOLD.ink, lw);
  ctx.restore();
  // the bell: a crown, flaring to a rolled lip
  const body = chaikin([[-r * 0.42, by0], [r * 0.42, by0], [r * 0.6, by0 + h * 0.45], [r * 0.92, by0 + h * 0.85], [r * 1.08, mouthY], [r * 0.6, mouthY - 0.6], [-r * 0.6, mouthY - 0.6], [-r * 1.08, mouthY], [-r * 0.92, by0 + h * 0.85], [-r * 0.6, by0 + h * 0.45]], 2);
  poly(ctx, body);
  paint(ctx, a, mode, GOLD.base, GOLD.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, body);
    ctx.clip();
    const g = ctx.createLinearGradient(-r, 0, r, 0);
    g.addColorStop(0, tone(a, GOLD.sh));
    g.addColorStop(0.3, tone(a, GOLD.lt));
    g.addColorStop(0.55, tone(a, GOLD.base));
    g.addColorStop(1, tone(a, GOLD.deep));
    ctx.fillStyle = g;
    ctx.fillRect(-r * 1.2, by0 - 1, r * 2.4, h + 2);
    // a rose ribbon tied round its waist, and its sharp brass shine
    ctx.fillStyle = tone(a, ROSE.base);
    ctx.fillRect(-r * 1.2, by0 + h * 0.3, r * 2.4, 1.1);
    ell(ctx, -r * 0.36, by0 + h * 0.62, 0.55, 1.6, 0.15);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    ctx.restore();
    // the rolled lip
    ell(ctx, 0, mouthY - 0.3, r * 1.06, 0.9);
    ctx.fillStyle = tone(a, GOLD.deep);
    ctx.fill();
  }
  ctx.restore();
}
// The bell's mouth in rig space (for effects): where the rings of sound come out.
export const bellMouth = (G) => [G.x - Math.sin(G.rot) * (HB.handle * 0.55 + HB.h + 1), G.y + Math.cos(G.rot) * (HB.handle * 0.55 + HB.h + 1)];

// ---------- Her pocket watch ----------
// Hanging from a chain clipped at her hip (a.rvWatch 0), or up in her far hand (1, drawn in front by her effects).
export function watchHang(ctx, a, mode, D, lw) {
  if ((a.rvWatch ?? 0) > 0.5) return;
  const hip = D.J.hip;
  const clip = ptOf(a, D, 'torso', [hip[0] + 7.4, hip[1] - 6]);
  const sw = a.rvWatchSw ?? 0;
  const wx = clip[0] + Math.sin(sw) * 4.6;
  const wy = clip[1] + Math.cos(sw) * 4.6;
  if (mode === 'fill') {
    pen(ctx, tone(a, GOLD.sh), 0.5);
    ctx.beginPath();
    ctx.moveTo(clip[0], clip[1]);
    ctx.quadraticCurveTo(clip[0] + 1.6, clip[1] + 3.4, wx, wy - 1.6);
    ctx.stroke();
  }
  drawWatch(ctx, a, mode, wx, wy, 1.7, lw);
}
export function drawWatch(ctx, a, mode, x, y, r, lw, open = 0) {
  ell(ctx, x, y - r - 0.5, r * 0.36, r * 0.3);
  paint(ctx, a, mode, GOLD.base, GOLD.ink, lw);
  ell(ctx, x, y, r, r);
  paint(ctx, a, mode, GOLD.base, GOLD.ink, lw);
  if (mode === 'fill') {
    ell(ctx, x, y, r * 0.74, r * 0.74);
    ctx.fillStyle = tone(a, open > 0.5 ? DIAL.base : GOLD.lt);
    ctx.fill();
    if (open > 0.5) {
      pen(ctx, tone(a, DIAL.hand), r * 0.14);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - r * 0.6);
      ctx.moveTo(x, y);
      ctx.lineTo(x + r * 0.42, y + r * 0.1);
      ctx.stroke();
    }
    ell(ctx, x - r * 0.3, y - r * 0.32, r * 0.22, r * 0.16);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
  }
}
export { sstep, TAU };
