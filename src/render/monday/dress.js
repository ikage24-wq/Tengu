// Monday's clothes and props (remade 2026-11-27, drawn from scratch): what she wears is cut from her body's own
// outline or wraps her limbs (never a flat panel pasted on, never over her face or her arms), each piece in both of
// the rig's passes (mode 'line' its outline, 'fill' itself) so only her outer edge is outlined, in a deeper shade
// of its own colour. A baku's two tones: night navy above and below, a cream saddle round her middle.
//   jacket   a cropped navy bolero cut from her torso's outline, a white blouse showing at the front with a round
//            collar and a little red bow at the throat
//   sash     the cream saddle: a wide soft sash round her waist, tied at the back in a big bow whose two tails
//            are calendar pages (a red header, MON), swinging on their own spring
//   skirt    navy, pleated, from her hips to her knees, its hem spanning wherever her knees are (so it moves with
//            her legs, never a rigid bell), a cream stripe at the hem
//   sleeves  short puffed sleeves gathered at the elbow with a cream band, her forearms bare
//   legs     white tights, navy Mary-Janes with a gold buckle
//   tail     a short round baku tail peeking out behind her skirt, flicking
//   pen      her giant red fountain pen in her near hand, held like a staff (a.mnPen: { rot }, 0 straight
//            down, nib first), a gold clip and nib
//   cookie   the sun cookie (Saturday) in her far hand, half eaten (a.mnCookie: bites taken)
import { TAU, mix, tone, ell, pen, glow, clamp, sstep } from './fx.js';
import { poly, chaikin } from './head.js';
import { NAVY, CREAM, WHITE, PAGE, PEN, COOKIE, GOLD, SHOE } from './palette.js';

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

// ---------- Jacket, blouse and sash (cut from her torso's outline) ----------
export function jacket(ctx, a, mode, D, lw) {
  const T = a.blTorsoPts;
  if (!T) return;
  if (mode === 'line') {
    poly(ctx, T);
    pen(ctx, tone(a, NAVY.ink), lw);
    ctx.stroke();
    return;
  }
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  ctx.fillStyle = tone(a, NAVY.base);
  ctx.fillRect(-300, -300, 600, 600);
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const rb = D.J.ribs;
  const cx = st[0] + 1.4;
  glow(ctx, cx + 6, st[1] + 6, 9, NAVY.lt, 0.6);
  glow(ctx, cx - 10, rb[1] + 3, 9, NAVY.deep, 0.6);
  // the white blouse between the bolero's fronts: a V widening down to the sash
  ctx.beginPath();
  ctx.moveTo(cx - 3.6, st[1] - 3);
  ctx.lineTo(cx + 4.4, st[1] - 3);
  ctx.quadraticCurveTo(cx + 5.6, rb[1], cx + 6.6, rb[1] + 10);
  ctx.lineTo(cx - 5.4, rb[1] + 10);
  ctx.quadraticCurveTo(cx - 4.4, rb[1], cx - 3.6, st[1] - 3);
  ctx.closePath();
  ctx.fillStyle = tone(a, WHITE.base);
  ctx.fill();
  glow(ctx, cx - 2, rb[1] + 2, 4, WHITE.sh, 0.6);
  // (the bolero's soft front edges, a navy piping line)
  pen(ctx, tone(a, NAVY.deep, 0.8), 0.5);
  ctx.beginPath();
  ctx.moveTo(cx - 3.6, st[1] - 3);
  ctx.quadraticCurveTo(cx - 4.4, rb[1], cx - 5.4, rb[1] + 10);
  ctx.moveTo(cx + 4.4, st[1] - 3);
  ctx.quadraticCurveTo(cx + 5.6, rb[1], cx + 6.6, rb[1] + 10);
  ctx.stroke();
  // the round collar, two soft white lobes, and a little red bow at the throat
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + 0.4, st[1] - 1.6);
    ctx.quadraticCurveTo(cx + s * 5.4, st[1] - 3.2, cx + s * 7, st[1] - 0.2);
    ctx.quadraticCurveTo(cx + s * 6.6, st[1] + 3.4, cx + s * 2.8, st[1] + 3);
    ctx.quadraticCurveTo(cx + s * 0.6, st[1] + 2.4, cx + 0.4, st[1] - 1.6);
    ctx.closePath();
    ctx.fillStyle = tone(a, WHITE.lt);
    ctx.fill();
    pen(ctx, tone(a, WHITE.deep), 0.45);
    ctx.stroke();
  }
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + 0.4, st[1] + 1.4);
    ctx.quadraticCurveTo(cx + s * 2.6, st[1] - 0.6, cx + s * 3, st[1] + 1.6);
    ctx.quadraticCurveTo(cx + s * 2.4, st[1] + 3, cx + 0.4, st[1] + 1.4);
    ctx.fillStyle = tone(a, PEN.base);
    ctx.fill();
  }
  ell(ctx, cx + 0.4, st[1] + 1.4, 0.9, 0.9);
  ctx.fillStyle = tone(a, PEN.sh);
  ctx.fill();
  ctx.restore();
  // the cream saddle: a wide soft sash round her waist (in the waist's frame)
  ctx.save();
  enter(ctx, a, D, 'waistB');
  const nv = D.J.navel;
  ctx.beginPath();
  ctx.moveTo(nv[0] - 40, nv[1] - 4.6);
  ctx.quadraticCurveTo(nv[0], nv[1] - 3, nv[0] + 40, nv[1] - 4.6);
  ctx.lineTo(nv[0] + 40, nv[1] + 2.4);
  ctx.quadraticCurveTo(nv[0], nv[1] + 4, nv[0] - 40, nv[1] + 2.4);
  ctx.closePath();
  ctx.fillStyle = tone(a, CREAM.base);
  ctx.fill();
  glow(ctx, nv[0] + 4, nv[1] - 1.4, 7, CREAM.lt, 0.8);
  glow(ctx, nv[0] - 9, nv[1], 6, CREAM.sh, 0.7);
  pen(ctx, tone(a, CREAM.deep, 0.8), 0.4);
  for (const dy of [-2.6, 0.6]) {
    ctx.beginPath();
    ctx.moveTo(nv[0] - 40, nv[1] + dy);
    ctx.quadraticCurveTo(nv[0], nv[1] + dy + 1.4, nv[0] + 40, nv[1] + dy);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}
// The sash's bow at the small of her back: two cream loops, its tails two calendar pages (MON), on a spring.
export function sashBow(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'waistB');
  const nv = D.J.navel;
  const bx = nv[0] - 9.4;
  const by = nv[1] - 1;
  const sw = clamp(a.mnBow ?? 0, -0.6, 0.6);
  const w = lw / D.SC;
  // the two pages, hanging from the knot, swinging
  for (const [i, dx, len, rot0] of [[0, -0.8, 9.6, 0.32], [1, 0.8, 8.4, 0.08]]) {
    ctx.save();
    ctx.translate(bx + dx, by + 1.2);
    ctx.rotate(rot0 + sw * (i ? 0.8 : 1));
    ctx.beginPath();
    ctx.roundRect(-2.6, 0, 5.2, len, 0.7);
    paint(ctx, a, mode, PAGE.base, PAGE.ink, w);
    if (mode === 'fill') {
      ctx.fillStyle = tone(a, PAGE.head);
      ctx.fillRect(-2.6, 0.4, 5.2, 2.2);
      ctx.fillStyle = tone(a, '#ffffff');
      ctx.font = '900 1.6px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MON', 0, 1.5);
      ctx.fillStyle = tone(a, PAGE.head);
      ctx.font = '900 3.2px "Trebuchet MS", sans-serif';
      ctx.fillText(i ? '1' : '1', 0, 5.4);
      pen(ctx, tone(a, PAGE.sh), 0.3);
      ctx.beginPath();
      ctx.moveTo(-1.8, len - 1.4);
      ctx.lineTo(1.8, len - 1.4);
      ctx.stroke();
    }
    ctx.restore();
  }
  // the loops and the knot
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx - 3.6 + s * 0.6, by + s * 6.2 - 1, bx - 7, by + s * 3.6);
    ctx.quadraticCurveTo(bx - 5.8, by + s * 0.6, bx, by);
    ctx.closePath();
    paint(ctx, a, mode, CREAM.base, CREAM.ink, w);
    if (mode === 'fill') glow(ctx, bx - 4.4, by + s * 2.6, 2, CREAM.sh, 0.7);
  }
  ell(ctx, bx, by, 1.8, 2);
  paint(ctx, a, mode, CREAM.sh, CREAM.ink, w);
  ctx.restore();
}

// ---------- Her skirt: navy, pleated, to her knees (its hem spans her knees) ----------
function skirtPts(a, D) {
  const hip = D.J.hip;
  const S = a.mnSkirt ?? 0;
  const hl = ptOf(a, D, 'torso', [hip[0] - 10.6, hip[1] - 4]);
  const hr = ptOf(a, D, 'torso', [hip[0] + 10.6, hip[1] - 4]);
  const hm = ptOf(a, D, 'torso', [hip[0], hip[1] - 5]);
  const kN = orig(a, 'shinN');
  const kF = orig(a, 'shinF');
  const back = Math.min(kN[0], kF[0], hl[0]) - 4 + S * 2;
  const front = Math.max(kN[0], kF[0], hr[0]) + 3.6 + S * 2;
  const hemY = Math.max(kN[1], kF[1]) - 1.2;
  const mid = (back + front) / 2;
  return { pts: chaikin([hl, hm, hr, [mix(hr[0], front, 0.45), mix(hr[1], hemY, 0.45)], [mix(hr[0], front, 0.9), mix(hr[1], hemY, 0.9)], [front, hemY - 0.6], [mid + S * 1.2, hemY + 1.2], [back, hemY - 0.6], [mix(hl[0], back, 0.9), mix(hl[1], hemY, 0.9)], [mix(hl[0], back, 0.45), mix(hl[1], hemY, 0.45)]], 2), back, front, hemY, top: hm[1] };
}
export function skirt(ctx, a, mode, D, lw) {
  const K = skirtPts(a, D);
  poly(ctx, K.pts);
  if (mode === 'line') return paint(ctx, a, mode, null, NAVY.ink, lw);
  const g = ctx.createLinearGradient(0, K.top, 0, K.hemY);
  g.addColorStop(0, tone(a, NAVY.sh));
  g.addColorStop(0.35, tone(a, NAVY.base));
  g.addColorStop(1, tone(a, NAVY.sh));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  poly(ctx, K.pts);
  ctx.clip();
  // (box pleats, each lit or shaded by the way it faces)
  const n = 7;
  for (let i = 0; i < n; i++) {
    const u0 = i / n;
    const x0 = mix(K.back, K.front, u0);
    const x1 = mix(K.back, K.front, u0 + 1 / n);
    ctx.fillStyle = i % 2 ? tone(a, NAVY.lt, 0.28) : tone(a, NAVY.deep, 0.22);
    ctx.beginPath();
    ctx.moveTo(mix(x0, (K.back + K.front) / 2, 0.45), K.top);
    ctx.lineTo(mix(x1, (K.back + K.front) / 2, 0.45), K.top);
    ctx.lineTo(x1, K.hemY + 2);
    ctx.lineTo(x0, K.hemY + 2);
    ctx.closePath();
    ctx.fill();
  }
  // the cream stripe at the hem
  ctx.fillStyle = tone(a, CREAM.base);
  ctx.beginPath();
  ctx.moveTo(K.back - 2, K.hemY - 2.6);
  ctx.quadraticCurveTo((K.back + K.front) / 2, K.hemY - 1.2, K.front + 2, K.hemY - 2.6);
  ctx.lineTo(K.front + 2, K.hemY - 1.4);
  ctx.quadraticCurveTo((K.back + K.front) / 2, K.hemY, K.back - 2, K.hemY - 1.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
// Her baku tail: short and round, navy, peeking out behind her skirt, flicking (a.mnTail).
export function tail(ctx, a, mode, D, lw) {
  const hip = D.J.hip;
  const p = ptOf(a, D, 'torso', [hip[0] - 10, hip[1] - 2]);
  const fl = a.mnTail ?? 0;
  ctx.save();
  ctx.translate(...p);
  ctx.rotate(-0.5 + fl);
  ell(ctx, -1.8, 0, 2.1, 1.5);
  paint(ctx, a, mode, NAVY.base, NAVY.ink, lw);
  if (mode === 'fill') glow(ctx, -2.1, -0.5, 1.1, NAVY.lt, 0.6);
  ctx.restore();
}

// ---------- Sleeves: short and puffed, gathered at the elbow ----------
export function sleeve(ctx, a, mode, D, k, lw) {
  const near = k === 'N';
  const sh = orig(a, `arm${k}u`);
  const el = orig(a, `arm${k}f`);
  const wr = orig(a, `hand${k}`);
  const A = D.spec?.arm ?? { aw0: 5, ew: 4.4, aw1: 3.8 };
  const pts = [sh, lerp2(sh, el, 0.45), lerp2(sh, el, 0.92)];
  const W = [A.aw0 * 1.7, A.aw0 * 2, A.ew * 1.5].map((v) => v * D.SC);
  tubePath(ctx, pts, W);
  paint(ctx, a, mode, near ? NAVY.base : NAVY.sh, NAVY.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    glow(ctx, ...lerp2(sh, el, 0.35), W[1] * 0.8, near ? NAVY.lt : NAVY.base, 0.6);
    ctx.restore();
  }
  // the cream band where it's gathered
  const an = Math.atan2(el[1] - sh[1], el[0] - sh[0]);
  const c = lerp2(sh, el, 0.9);
  ctx.save();
  ctx.translate(c[0], c[1]);
  ctx.rotate(an);
  const r = A.ew * D.SC * 0.78;
  ctx.beginPath();
  ctx.roundRect(-0.9, -r, 1.8, r * 2, 0.8);
  paint(ctx, a, mode, near ? CREAM.base : CREAM.sh, CREAM.ink, lw);
  ctx.restore();
  void wr;
}

// ---------- Tights and Mary-Janes ----------
export function tights(ctx, a, mode, D, k, lw) {
  const hip = orig(a, `thigh${k}`);
  const knee = orig(a, `shin${k}`);
  const ank = orig(a, `foot${k}`);
  const Lg = D.spec?.leg ?? { tw: 8.5, kw: 5.9, anw: 4.2 };
  const pts = [lerp2(hip, knee, 0.1), lerp2(hip, knee, 0.55), knee, lerp2(knee, ank, 0.35), ank];
  const W = [Lg.tw * 1.02, Lg.tw * 0.92, Lg.kw * 1.06, Lg.kw * 1.08, Lg.anw * 1.08].map((v) => v * D.SC);
  tubePath(ctx, pts, W);
  const far = k === 'F';
  paint(ctx, a, mode, far ? WHITE.sh : WHITE.base, WHITE.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    glow(ctx, ...lerp2(knee, ank, 0.5), Lg.kw * D.SC * 1.2, far ? WHITE.deep : WHITE.sh, 0.45);
    ctx.restore();
  }
}
export function shoe(ctx, a, mode, D, k, lw) {
  const Lg = D.spec?.leg ?? { anw: 4.2, heel: 2.7, toe: 6.8, ftop: 1.2, fbot: 4 };
  const far = k === 'F';
  const M = a.blMat(`foot${k}`);
  ctx.save();
  ctx.transform(...M);
  const hl = Lg.heel * 1.12;
  const to = Lg.toe * 1.06;
  const s = D.SC;
  const pts = chaikin([[-hl, -Lg.ftop * 0.6], [Lg.anw * 0.2, -Lg.ftop * 0.4], [to * 0.6, Lg.fbot * 0.28], [to * 1.02, Lg.fbot * 0.62], [to * 0.94, Lg.fbot + 0.25], [-hl, Lg.fbot + 0.25], [-hl * 1.1, Lg.fbot * 0.4]], 2).map(([x, y]) => [x * s, y * s]);
  poly(ctx, pts);
  paint(ctx, a, mode, far ? SHOE.sh : SHOE.base, SHOE.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    glow(ctx, to * 0.55 * s, Lg.fbot * 0.3 * s, 2.4 * s, SHOE.lt, 0.8);
    ctx.restore();
    pen(ctx, tone(a, far ? SHOE.sh : SHOE.base), 0.75 * s);
    ctx.beginPath();
    ctx.moveTo(-Lg.anw * 0.3 * s, -Lg.ftop * 1.4 * s);
    ctx.quadraticCurveTo(Lg.anw * 0.4 * s, -Lg.ftop * 1.6 * s, to * 0.5 * s, Lg.fbot * 0.2 * s);
    ctx.stroke();
    ell(ctx, to * 0.45 * s, Lg.fbot * 0.12 * s, 0.8 * s, 0.8 * s);
    ctx.fillStyle = tone(a, GOLD.base);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Her giant fountain pen (near hand) ----------
// a.mnPen.rot: 0 hanging straight down, nib first; the grip a third of the way from the cap end.
export const PN = { len: 27, w: 2.1 };
export function penGeom(a, D) {
  const hand = ptOf(a, D, 'handN', D.J.handN);
  return { x: hand[0], y: hand[1], rot: a.mnPen?.rot ?? 0 };
}
export function bigPen(ctx, a, mode, D, lw) {
  if (a.mnQ?.noPen) return;
  const G = penGeom(a, D);
  drawPen(ctx, a, mode, G.x, G.y, G.rot, lw);
}
export function drawPen(ctx, a, mode, x, y, rot, lw) {
  const { len, w } = PN;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // (its fittings drawn at a 46-unit pen's size, scaled to this one)
  const k = len / 46;
  const y0 = -len * 0.34;
  const y1 = len * 0.66;
  // the barrel (cap end up), the section, the nib down
  const body = chaikin([[-w / 2, y0], [w / 2, y0], [w / 2, y1 - 9 * k], [w * 0.36, y1 - 6 * k], [-w * 0.36, y1 - 6 * k], [-w / 2, y1 - 9 * k]], 1);
  poly(ctx, body);
  paint(ctx, a, mode, PEN.base, PEN.ink, lw);
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, y1 - 6.4 * k);
  ctx.lineTo(w * 0.34, y1 - 6.4 * k);
  ctx.quadraticCurveTo(w * 0.3, y1 - 2 * k, 0, y1);
  ctx.quadraticCurveTo(-w * 0.3, y1 - 2 * k, -w * 0.34, y1 - 6.4 * k);
  ctx.closePath();
  paint(ctx, a, mode, PEN.gold, PEN.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, body);
    ctx.clip();
    glow(ctx, -w * 0.25, y0 + len * 0.3, w * 1.4, PEN.lt, 0.7);
    ctx.fillStyle = tone(a, PEN.sh);
    ctx.fillRect(w * 0.15, y0, w * 0.4, len);
    ctx.restore();
    // the gold bands and the cap's clip, the nib's slit
    ctx.fillStyle = tone(a, PEN.gold);
    ctx.fillRect(-w / 2, y0 + 3.4 * k, w, 0.9 * k);
    ctx.fillRect(-w / 2, y1 - 9.8 * k, w, 0.9 * k);
    ctx.beginPath();
    ctx.roundRect(-w * 0.15, y0 + 0.6 * k, w * 0.3, 9 * k, 0.4 * k);
    ctx.fill();
    pen(ctx, tone(a, PEN.goldSh), 0.25 * k);
    ctx.beginPath();
    ctx.moveTo(0, y1 - 4.6 * k);
    ctx.lineTo(0, y1 - 0.6 * k);
    ctx.stroke();
    ell(ctx, 0, y1 - 4.8 * k, 0.35 * k, 0.35 * k);
    ctx.fillStyle = tone(a, PEN.goldSh);
    ctx.fill();
  }
  ell(ctx, 0, y0, w / 2, w * 0.3);
  paint(ctx, a, mode, PEN.sh, PEN.ink, lw);
  ctx.restore();
}
// The tip of the nib, in rig space (for effects).
export const nibAt = (G) => [G.x - Math.sin(G.rot) * PN.len * 0.66, G.y + Math.cos(G.rot) * PN.len * 0.66];

// ---------- The sun cookie (Saturday), half eaten, in her far hand ----------
export function cookie(ctx, a, mode, D, lw) {
  if (a.mnQ?.noCookie || a.mnQ?.cookieFront) return;
  const hand = ptOf(a, D, 'handF', D.J.handF);
  drawCookie(ctx, a, mode, hand[0] + 1, hand[1] - 0.8, a.mnCookie ?? 1, lw);
}
export function drawCookie(ctx, a, mode, x, y, bites, lw) {
  const r = 2.7;
  ctx.save();
  ctx.translate(x, y);
  // (the bites taken out of its top-front: round scallops pulled into its edge)
  const bitAt = [-0.6, -0.05, 0.5].slice(0, Math.min(3, Math.round(bites)));
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const an = (i / 48) * TAU - Math.PI;
    let rr = r * (1 + 0.07 * Math.cos(an * 8));
    for (const b of bitAt) {
      const d = Math.abs(Math.atan2(Math.sin(an - b), Math.cos(an - b)));
      if (d < 0.32) rr -= 1.1 * Math.cos((d / 0.32) * (Math.PI / 2));
    }
    ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
  }
  ctx.closePath();
  if (mode === 'line') {
    pen(ctx, tone(a, COOKIE.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, COOKIE.base);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, -0.8, -0.8, 2.1, COOKIE.glaze, 0.8);
    glow(ctx, 0.9, 1.2, 1.8, COOKIE.sh, 0.6);
    // (a little sugar sun on it)
    ell(ctx, -0.25, 0.25, 0.8, 0.8);
    ctx.fillStyle = tone(a, COOKIE.glaze);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
