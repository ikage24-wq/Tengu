// Queen Coralie's gown, tail and things (2026-11-26, drawn from scratch): what she wears is cut from her
// body's own outline or wraps her limbs (never a flat panel pasted on, never over her face or her arms),
// each piece in both of the rig's passes (mode 'line' its outline, 'fill' itself) so only her outer edge
// is outlined, in a deeper shade of its own colour.
//   mantle    her royal mantle of sheer sea-silk, aqua white with a coral hem, hanging from inside her
//             shoulders down her back in three rounded panels, each on its own spring (behind her)
//   bodice    the palace livery in full: coral pink, cut from her torso's own outline, a straight
//             neckline edged with a strand of pearls and one big pearl in its middle, running down into
//             a pearl-white sash at her hips with a pearl clasp, where her tail begins
//   sleeves   little puffed sleeves of sea-silk at her shoulders, a pearl bracelet at each wrist
//   tail      a mermaid's tail from her hips: coral at the top fading to a pearly peach, a pearl-white
//             belly, soft rows of scales; a chain of eight pieces on springs, a wave run down it by the
//             distance she swims (slowly at rest), curling forward near the floor (it lies along it where
//             it would go under) to a big two-lobed fluke of sheer coral with fine rays; a small sheer
//             fin at each hip, rooted inside her
//   scepter   in her far hand: a gold rod twisted with coral, topped by her keepsake globe, a glass ball
//             of sea water with one little orange fish swimming round inside it, a pearl on top
import { TAU, mix, tone, ell, smooth, pen, glow } from './fx.js';
import { poly } from './head.js';
import { CORAL, PEARL, GOLD, TAIL, SILK, GLOBE } from './palette.js';

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
export function paint(ctx, a, mode, col, ink, lw) {
  if (mode === 'line') {
    pen(ctx, tone(a, ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = typeof col === 'string' ? tone(a, col) : col;
    ctx.fill();
  }
}
function tube(pts, W) {
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
  return { Lp, Rp };
}

// ---------- The tail ----------
// Its joints in the rig's space (base px), from inside her hips; each piece's angle from the last
// (a.crTail, worked out in the pose); laid along the floor where it would go under.
export const TSEG = 8;
const SEG = 3.9;
const TW = [11.4, 11, 10.2, 9, 7.6, 6.2, 5, 4, 3.4];
export const TAIL_REST = [0, 0.04, 0.08, 0.12, 0.18, 0.26, 0.34, 0.42];
export function tailPts(a, D) {
  const hip = D.J.hip;
  const root = ptOf(a, D, 'torso', [hip[0] - 0.4 / D.SC, hip[1] + 1.2 / D.SC]);
  const angs = a.crTail ?? TAIL_REST;
  const pts = [root];
  let th = -0.16 - boneAng(a, 'torso') * 0.5;
  for (let i = 0; i < TSEG; i++) {
    th += angs[i];
    const p = pts[i];
    pts.push([p[0] + Math.sin(th) * SEG, p[1] + Math.cos(th) * SEG]);
  }
  for (let i = 1; i < pts.length; i++) {
    const lim = -TW[i] * 0.5 - 0.4;
    if (pts[i][1] > lim) pts[i][1] = lim;
  }
  return pts;
}
export function tail(ctx, a, mode, D, lw) {
  const pts = tailPts(a, D);
  const { Lp, Rp } = tube(pts, TW);
  const n = pts.length - 1;
  const tip = pts[n];
  const tan = Math.atan2(tip[1] - pts[n - 1][1], tip[0] - pts[n - 1][0]);
  // the fluke: two rounded lobes spread either side of the tail's end, a little notch between
  const fl = a.crFluke ?? 0;
  const lobe = (side) => {
    // (a broad rounded lobe from the tail's end, sweeping out and back: a soft teardrop)
    const an = tan + side * (0.95 + fl * 0.25);
    const L = 12;
    const d = [Math.cos(an), Math.sin(an)];
    const nrm = [-d[1], d[0]];
    const at = (u, w) => [tip[0] + d[0] * L * u + nrm[0] * w, tip[1] + d[1] * L * u + nrm[1] * w];
    // (resting on the floor where it would go under it)
    return [at(-0.08, 0), at(0.3, -side * 3.6), at(0.75, -side * 4.6), at(1.02, -side * 2.2), at(1.04, side * 0.6), at(0.7, side * 1.6), at(0.3, side * 1.4)].map(([px, py]) => [px, Math.min(py, -0.6)]);
  };
  for (const side of [-1, 1]) {
    smooth(ctx, lobe(side));
    if (mode === 'line') paint(ctx, a, mode, null, TAIL.ink, lw);
    else {
      ctx.fillStyle = tone(a, CORAL.lt, 0.92);
      ctx.fill();
      ctx.save();
      smooth(ctx, lobe(side));
      ctx.clip();
      glow(ctx, tip[0], tip[1], 9, CORAL.base, 0.6);
      pen(ctx, tone(a, CORAL.sh, 0.45), 0.45);
      for (let k = 0; k < 4; k++) {
        const an = tan + side * (0.7 + k * 0.22 + fl * 0.2) - side * 0.35;
        ctx.beginPath();
        ctx.moveTo(tip[0], tip[1]);
        ctx.lineTo(tip[0] + Math.cos(an) * 11, tip[1] + Math.sin(an) * 11);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  // the tail itself
  smooth(ctx, [...Lp, [tip[0] + Math.cos(tan) * 2, tip[1] + Math.sin(tan) * 2], ...[...Rp].reverse()]);
  if (mode === 'line') {
    paint(ctx, a, mode, null, TAIL.ink, lw);
    return;
  }
  const g = ctx.createLinearGradient(pts[0][0], pts[0][1], tip[0], tip[1]);
  g.addColorStop(0, tone(a, TAIL.top));
  g.addColorStop(0.55, tone(a, TAIL.mid));
  g.addColorStop(1, tone(a, TAIL.end));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  smooth(ctx, [...Lp, [tip[0] + Math.cos(tan) * 2, tip[1] + Math.sin(tan) * 2], ...[...Rp].reverse()]);
  ctx.clip();
  // the pearl-white belly along its front side
  const front = Lp.map((p, i) => [mix(p[0], pts[i][0], 0.45), mix(p[1], pts[i][1], 0.45)]);
  smooth(ctx, [...Lp, ...front.reverse()]);
  ctx.fillStyle = tone(a, TAIL.belly, 0.85);
  ctx.fill();
  // soft rows of scales: little arcs across it, fainter down the tail
  pen(ctx, tone(a, TAIL.scale, 0.35), 0.45);
  for (let i = 1; i < n - 1; i++) {
    const c = pts[i];
    const an = Math.atan2(pts[i + 1][1] - c[1], pts[i + 1][0] - c[0]);
    const hw = TW[i] * 0.42;
    for (const k of [-0.5, 0.15]) {
      const ox = Math.cos(an + Math.PI / 2) * hw * k;
      const oy = Math.sin(an + Math.PI / 2) * hw * k;
      ctx.beginPath();
      ctx.arc(c[0] + ox, c[1] + oy, hw * 0.45, an - 0.9, an + 0.9);
      ctx.stroke();
    }
  }
  // a light down its back, a soft shade at its root
  pen(ctx, tone(a, '#ffffff', 0.4), 1.1);
  ctx.beginPath();
  Rp.slice(1, n - 1).forEach((p, i) => {
    const q = [mix(p[0], pts[i + 1][0], 0.3), mix(p[1], pts[i + 1][1], 0.3)];
    if (i) ctx.lineTo(...q);
    else ctx.moveTo(...q);
  });
  ctx.stroke();
  glow(ctx, pts[0][0], pts[0][1], 7, CORAL.deep, 0.35);
  ctx.restore();
}
// A small sheer fin at her hip (side +1 near, -1 far), rooted inside her, swinging on its spring.
export function hipFin(ctx, a, mode, D, side, lw) {
  const hip = D.J.hip;
  const r = ptOf(a, D, 'torso', [hip[0] + (side > 0 ? 4.6 : -5.4) / D.SC, hip[1] - 1 / D.SC]);
  const sw = a.crFin?.[side > 0 ? 1 : 0] ?? 0;
  const an = (side > 0 ? 0.9 : 2.3) + sw;
  const d = [Math.cos(an), Math.sin(an)];
  const nrm = [-d[1], d[0]];
  const L = 5.6;
  const pts = [[r[0] - nrm[0] * 1.2, r[1] - nrm[1] * 1.2], [r[0] + d[0] * L * 0.55 - nrm[0] * 2.2, r[1] + d[1] * L * 0.55 - nrm[1] * 2.2], [r[0] + d[0] * L, r[1] + d[1] * L], [r[0] + d[0] * L * 0.7 + nrm[0] * 1.4, r[1] + d[1] * L * 0.7 + nrm[1] * 1.4], [r[0] + nrm[0] * 1.2, r[1] + nrm[1] * 1.2]];
  smooth(ctx, pts);
  if (mode === 'line') return paint(ctx, a, mode, null, CORAL.ink, lw);
  ctx.fillStyle = tone(a, side > 0 ? CORAL.lt : CORAL.base, 0.95);
  ctx.fill();
  pen(ctx, tone(a, CORAL.sh, 0.5), 0.35);
  for (const k of [-0.6, 0, 0.6]) {
    ctx.beginPath();
    ctx.moveTo(...r);
    ctx.lineTo(r[0] + d[0] * L * 0.85 + nrm[0] * k * 1.6, r[1] + d[1] * L * 0.85 + nrm[1] * k * 1.6);
    ctx.stroke();
  }
}

// ---------- The mantle ----------
// Three rounded panels of sea-silk from inside her shoulders down her back (a.crCape: each panel's
// swing on its spring).
const CAPE = [{ x: -5.2, len: 26, w: 7 }, { x: 0.6, len: 29, w: 8 }, { x: 5.8, len: 24, w: 6.6 }];
export function mantle(ctx, a, mode, D, lw) {
  const sw = a.crCape ?? [0, 0, 0];
  const st = D.J.stern;
  const lean = boneAng(a, 'chest');
  for (let i = 0; i < 3; i++) {
    const P = CAPE[i];
    const r = ptOf(a, D, 'chest', [st[0] + P.x / D.SC - 2.6 / D.SC, st[1] + 1.4 / D.SC]);
    const an = Math.PI / 2 + 0.22 + sw[i] - lean * 0.3 + (i - 1) * 0.08;
    const d = [Math.cos(an), Math.sin(an)];
    const nrm = [-d[1], d[0]];
    const L = P.len;
    const at = (u, s) => [r[0] + d[0] * L * u + nrm[0] * s, r[1] + d[1] * L * u + nrm[1] * s];
    const pts = [at(0, -P.w * 0.3), at(0.4, -P.w * 0.55), at(0.9, -P.w * 0.6), at(1.04, -P.w * 0.25), at(1.08, 0), at(1.04, P.w * 0.25), at(0.9, P.w * 0.6), at(0.4, P.w * 0.55), at(0, P.w * 0.3)];
    smooth(ctx, pts);
    if (mode === 'line') {
      paint(ctx, a, mode, null, SILK.ink, lw);
      continue;
    }
    ctx.fillStyle = tone(a, i === 1 ? SILK.base : SILK.sh, 0.92);
    ctx.fill();
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    glow(ctx, ...at(0.35, -P.w * 0.2), P.w * 1.2, SILK.lt, 0.8);
    // the coral hem
    pen(ctx, tone(a, SILK.hem), 1.6);
    ctx.beginPath();
    ctx.moveTo(...at(0.94, -P.w * 0.6));
    ctx.quadraticCurveTo(...at(1.12, 0), ...at(0.94, P.w * 0.6));
    ctx.stroke();
    pen(ctx, tone(a, SILK.ink, 0.3), 0.5);
    ctx.beginPath();
    ctx.moveTo(...at(0.1, 0));
    ctx.quadraticCurveTo(...at(0.5, P.w * 0.1), ...at(0.95, 0));
    ctx.stroke();
    ctx.restore();
  }
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
  const cx = st[0] + 1;
  const top = st[1] + 5.4;
  // a straight neckline across her chest, dipping softly in the middle
  ctx.beginPath();
  ctx.moveTo(cx - 26, top + 70);
  ctx.lineTo(cx - 26, top + 0.6);
  ctx.quadraticCurveTo(cx, top + 2.2, cx + 26, top + 0.6);
  ctx.lineTo(cx + 26, top + 70);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - 14, 0, cx + 14, 0);
  g.addColorStop(0, tone(a, CORAL.sh));
  g.addColorStop(0.6, tone(a, CORAL.base));
  g.addColorStop(1, tone(a, CORAL.base));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, cx + 5, top + 5, 7, CORAL.lt, 0.75);
  glow(ctx, cx - 12, rb[1] + 7, 9, CORAL.deep, 0.5);
  // soft scallops like the inside of a shell, fanning down from the neckline
  pen(ctx, tone(a, CORAL.deep, 0.35), 0.55);
  for (const dx of [-6, -2, 2.4, 6.6]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * 0.5, top + 3);
    ctx.quadraticCurveTo(cx + dx * 0.9, top + 9, cx + dx * 1.3, rb[1] + 8);
    ctx.stroke();
  }
  ctx.restore();
  // the strand of pearls along the neckline, the big pearl in its middle
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    const px = cx - 15 + u * 30;
    const py = top + 0.9 + Math.sin(Math.PI * u) * 1.4;
    pearl(ctx, a, px, py, 1.15);
  }
  pearl(ctx, a, cx, top + 3.6, 2.4);
  ctx.restore();
  // the sash at her hips (in the hips' frame), its pearl clasp
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const y = h[1] - 2.4;
  ctx.beginPath();
  ctx.moveTo(h[0] - 30, y - 2.6);
  ctx.quadraticCurveTo(h[0], y - 0.6, h[0] + 30, y - 2.6);
  ctx.lineTo(h[0] + 30, y + 3);
  ctx.quadraticCurveTo(h[0], y + 5, h[0] - 30, y + 3);
  ctx.closePath();
  ctx.fillStyle = tone(a, PEARL.base);
  ctx.fill();
  pen(ctx, tone(a, PEARL.deep, 0.7), 0.7);
  ctx.beginPath();
  ctx.moveTo(h[0] - 30, y + 2.4);
  ctx.quadraticCurveTo(h[0], y + 4.3, h[0] + 30, y + 2.4);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, 'torso');
  pearl(ctx, a, h[0] + 3, h[1] - 1.4, 2.6);
  ctx.restore();
}
function pearl(ctx, a, x, y, r) {
  ell(ctx, x, y, r, r);
  ctx.fillStyle = tone(a, PEARL.base);
  ctx.fill();
  pen(ctx, tone(a, PEARL.ink, 0.8), Math.max(0.25, r * 0.22));
  ctx.stroke();
  ell(ctx, x - r * 0.35, y - r * 0.35, r * 0.33, r * 0.25);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  glow(ctx, x + r * 0.2, y + r * 0.3, r * 0.8, '#ffd8e8', 0.4);
}

// ---------- The sleeves ----------
export function sleeve(ctx, a, mode, D, k, lw) {
  const near = k === 'N';
  ctx.save();
  enter(ctx, a, D, `arm${k}u`);
  const sh = D.J[`sh${k}`];
  ctx.beginPath();
  for (const [dx, dy, rx, ry] of [[-2.4, 1.8, 4.2, 4.4], [1.2, 3, 4.6, 4.6], [3.4, 1, 3.6, 3.8]]) {
    ctx.moveTo(sh[0] + dx + rx, sh[1] + dy);
    ctx.ellipse(sh[0] + dx, sh[1] + dy, rx, ry, 0, 0, TAU);
  }
  paint(ctx, a, mode, near ? SILK.base : SILK.sh, SILK.ink, lw);
  if (mode === 'fill') {
    glow(ctx, sh[0] - 0.4, sh[1] + 0.6, 5.4, SILK.lt, 0.8);
    pen(ctx, tone(a, SILK.hem, 0.9), 1.1);
    ctx.beginPath();
    ctx.ellipse(sh[0] + 0.6, sh[1] + 5.6, 6.4, 1.6, 0, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  ctx.restore();
  // the pearl bracelet at the wrist
  if (mode !== 'fill') return;
  ctx.save();
  enter(ctx, a, D, `arm${k}f`);
  const el = D.J[`el${k}`];
  const wr = D.J[`wr${k}`];
  const an = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
  ctx.translate(wr[0], wr[1]);
  ctx.rotate(an);
  for (let i = 0; i < 4; i++) pearl(ctx, a, -1.2, -3.3 + i * 2.2, 1.05);
  ctx.restore();
}

// ---------- The scepter ----------
// Where it is (the rig's space): its rod through her far hand at q.sc (radians off upright, + forward),
// the globe on top, the pearl over it.
export function scepterGeom(a, D) {
  const q = a.crQ ?? {};
  const hd = ptOf(a, D, 'handF', D.J.handF);
  const an = q.sc ?? 0.12;
  const up = [Math.sin(an), -Math.cos(an)];
  return { hd, an, foot: [hd[0] - up[0] * 5, hd[1] - up[1] * 5], top: [hd[0] + up[0] * 14, hd[1] + up[1] * 14], globe: [hd[0] + up[0] * 18.4, hd[1] + up[1] * 18.4], up };
}
export function scepter(ctx, a, mode, D, lw) {
  const q = a.crQ ?? {};
  if (q.noScepter) return;
  const G = scepterGeom(a, D);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...G.foot);
  ctx.lineTo(...G.top);
  if (mode === 'line') {
    ctx.strokeStyle = tone(a, GOLD.ink);
    ctx.lineWidth = 1.8 + lw * 2;
    ctx.stroke();
  } else {
    ctx.strokeStyle = tone(a, GOLD.base);
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // the coral twisted round it
    pen(ctx, tone(a, CORAL.base), 0.7);
    for (let i = 0; i < 4; i++) {
      const u = 0.15 + i * 0.22;
      const p = [mix(G.foot[0], G.top[0], u), mix(G.foot[1], G.top[1], u)];
      ctx.beginPath();
      ctx.ellipse(p[0], p[1], 1.4, 0.6, G.an + 0.5, 0, Math.PI);
      ctx.stroke();
    }
    // the cup that holds the globe
    ell(ctx, G.top[0], G.top[1] - 0.2, 2.6, 1.3, G.an);
    ctx.fillStyle = tone(a, GOLD.base);
    ctx.fill();
  }
  ctx.restore();
  globe(ctx, a, mode, G.globe[0], G.globe[1], 4.6, lw, q.fishOut ?? 0);
  // the pearl on top
  const pt = [G.globe[0] + G.up[0] * 5.4, G.globe[1] + G.up[1] * 5.4];
  ell(ctx, pt[0], pt[1], 1.3, 1.3);
  if (mode === 'line') {
    pen(ctx, tone(a, PEARL.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, PEARL.base);
    ctx.fill();
    ell(ctx, pt[0] - 0.4, pt[1] - 0.4, 0.45, 0.35);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}
// The keepsake globe: a glass ball of sea water, the little fish swimming round in it (gone once she
// has let it go: `out`).
export function globe(ctx, a, mode, x, y, r, lw, out = 0) {
  ell(ctx, x, y, r, r);
  if (mode === 'line') {
    pen(ctx, tone(a, GLOBE.ink), lw);
    ctx.stroke();
    return;
  }
  const t = a.t ?? 0;
  ctx.fillStyle = 'rgba(232,250,255,0.8)';
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, r, r);
  ctx.clip();
  ctx.fillStyle = tone(a, GLOBE.water, 0.75);
  ctx.fillRect(x - r, y - r * 0.35, r * 2, r * 2);
  pen(ctx, 'rgba(255,255,255,0.7)', 0.4);
  ctx.beginPath();
  ctx.moveTo(x - r, y - r * 0.35);
  ctx.quadraticCurveTo(x, y - r * 0.5 + Math.sin(t * 2) * 0.3, x + r, y - r * 0.35);
  ctx.stroke();
  if (out < 0.5) {
    const an = t * 1.6;
    fish(ctx, x + Math.cos(an) * r * 0.42, y + 0.6 + Math.sin(an) * r * 0.2, 1, Math.sin(an) > 0 ? -1 : 1, 0, 1);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, r - 0.8, Math.PI * 1.05, Math.PI * 1.5);
  pen(ctx, 'rgba(255,255,255,0.9)', 0.6);
  ctx.stroke();
  ell(ctx, x + r * 0.35, y + r * 0.4, 0.5, 0.4);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
}
// The little orange fish: a round body, a fan tail, a dot of an eye's shine (no eye spot: a soft dark
// eye with a white glint), facing `f`.
export function fish(ctx, x, y, s, f, ang = 0, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(f * s, s);
  ctx.beginPath();
  ctx.moveTo(-1.2, 0);
  ctx.quadraticCurveTo(-2.6, -1.4, -2.9, -1.1);
  ctx.quadraticCurveTo(-2.4, 0, -2.9, 1.1);
  ctx.quadraticCurveTo(-2.6, 1.4, -1.2, 0);
  ctx.fillStyle = GLOBE.fishSh;
  ctx.fill();
  ell(ctx, 0, 0, 1.6, 1.1);
  ctx.fillStyle = GLOBE.fish;
  ctx.fill();
  ell(ctx, 0.7, -0.2, 0.32, 0.32);
  ctx.fillStyle = '#4a2a2a';
  ctx.fill();
  ell(ctx, 0.8, -0.3, 0.12, 0.12);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// The glass display case of her entrance (in the rig's space, over her): sheer glass, a gold frame at
// its foot, two soft shine streaks down its far edge (never across her face), a little plaque.
export function displayCase(ctx, x, y, w, h, al, lift = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const top = y - h - lift;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, top, w, h, 3);
  ctx.fillStyle = 'rgba(220,248,255,0.16)';
  ctx.fill();
  pen(ctx, 'rgba(150,214,230,0.9)', 0.8);
  ctx.stroke();
  pen(ctx, 'rgba(255,255,255,0.75)', 1.2);
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 3, top + 6);
  ctx.lineTo(x + w / 2 - 3, top + h * 0.45);
  ctx.moveTo(x + w / 2 - 6, top + 10);
  ctx.lineTo(x + w / 2 - 6, top + h * 0.3);
  ctx.stroke();
  // its gold rim at the bottom and the lid
  ctx.fillStyle = GOLD.base;
  ctx.fillRect(x - w / 2 - 1, top + h - 2 + lift, w + 2, 2.4);
  ctx.fillRect(x - w / 2 - 1, top - 1.4, w + 2, 2);
  ctx.restore();
}
export function plaque(ctx, x, y, al, text, f = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  // (its words always read left to right, whichever way she faces)
  ctx.translate(x, 0);
  ctx.scale(f, 1);
  ctx.translate(-x, 0);
  ctx.beginPath();
  ctx.roundRect(x - 15, y - 5, 30, 9, 2);
  ctx.fillStyle = GOLD.base;
  ctx.fill();
  pen(ctx, GOLD.ink, 0.6);
  ctx.stroke();
  ctx.font = '900 4.6px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#7a4a2a';
  ctx.fillText(text, x, y - 0.4);
  ctx.restore();
}
