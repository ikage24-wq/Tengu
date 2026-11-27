// The Night Manager's clothes and props (remade 2026-11-27, drawn from scratch): what he wears is cut from his
// body's own outline or wraps his limbs (never a flat panel pasted on, never over his face or his arms), each
// piece in both of the rig's passes (mode 'line' its outline, 'fill' itself) so only his outer edge is
// outlined, in a deeper shade of its own colour.
//   shirt     white, cut from his torso's outline: a soft collar open at the throat, a button placket, the
//             lamp-blue shade under the chest; tucked into his slacks at a brown belt with a gold buckle
//             (the torso below the belt is his slacks' seat, over both thigh tops)
//   braces    navy, over each shoulder and down to the waistband, gold clips
//   tie       crimson, loosened a hand's width down from the collar, its blade swinging on a spring
//   lanyard   blue, an ID card at the end (his photo: asleep at his desk), swinging on its own spring
//   sleeves   rolled to just under the elbow, a fat roll at the cuff; his forearms bare
//   slacks    charcoal navy, straight legs with a pressed crease, to the ankle
//   loafers   chestnut, a penny strap
//   cardigan  honey mustard, thrown over his shoulders: its body hangs down his back behind him (ribbed hem,
//             swinging after him on a spring), its sleeves come over his shoulders and tie in a loose knot
//             on his chest, the two cuffs dangling, each on its own spring
//   mug       his travel mug, cream with a teal band and a cocoa lid, held by its handle in his near hand,
//             kept level (a.mgMug.rot tips it); steam off its sip hole
//   clipboard pale birch, a steel clip, a checklist, in his far hand (a.mgBoard)
import { TAU, mix, tone, ell, pen, glow, clamp, sstep } from './fx.js';
import { poly, chaikin } from './head.js';
import { SHIRT, NAVY, TIE, KNIT, SLACK, SHOE, GOLD, MUG, BOARD, LANYARD, SKIN } from './palette.js';

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
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];

// ---------- His shirt, braces and the seat of his slacks (cut from his torso's outline) ----------
export function shirt(ctx, a, mode, D, lw) {
  const T = a.blTorsoPts;
  if (!T) return;
  if (mode === 'line') {
    poly(ctx, T);
    pen(ctx, tone(a, SHIRT.ink), lw);
    ctx.stroke();
    return;
  }
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  ctx.fillStyle = tone(a, SHIRT.base);
  ctx.fillRect(-300, -300, 600, 600);
  // the slacks' seat: everything below the waistband, over both thigh tops (in the waist's frame)
  ctx.save();
  enter(ctx, a, D, 'waistB');
  const nv = D.J.navel;
  const by = nv[1] + 2.4;
  ctx.fillStyle = tone(a, SLACK.base);
  ctx.fillRect(nv[0] - 60, by, 120, 80);
  glow(ctx, nv[0] + 6, by + 6, 10, SLACK.lt, 0.35);
  glow(ctx, nv[0] - 12, by + 10, 12, SLACK.deep, 0.5);
  // (the fly's seam and a soft crease where the legs part)
  pen(ctx, tone(a, SLACK.deep, 0.7), 0.4);
  ctx.beginPath();
  ctx.moveTo(nv[0] + 3.2, by + 2.6);
  ctx.quadraticCurveTo(nv[0] + 3.8, by + 7, nv[0] + 2.2, by + 9.6);
  ctx.stroke();
  // the belt: brown leather, a gold buckle, the shirt tucked in above it in soft folds
  ctx.beginPath();
  ctx.moveTo(nv[0] - 60, by - 0.4);
  ctx.quadraticCurveTo(nv[0], by + 0.6, nv[0] + 60, by - 0.4);
  ctx.lineTo(nv[0] + 60, by + 2.8);
  ctx.quadraticCurveTo(nv[0], by + 3.8, nv[0] - 60, by + 2.8);
  ctx.closePath();
  ctx.fillStyle = tone(a, SHOE.base);
  ctx.fill();
  pen(ctx, tone(a, SHOE.lt, 0.6), 0.3);
  ctx.beginPath();
  ctx.moveTo(nv[0] - 40, by + 0.4);
  ctx.quadraticCurveTo(nv[0], by + 1.3, nv[0] + 40, by + 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(nv[0] + 1.4, by - 0.5, 4, 3.6, 0.9);
  ctx.fillStyle = tone(a, GOLD.base);
  ctx.fill();
  pen(ctx, tone(a, GOLD.ink), 0.35);
  ctx.stroke();
  ctx.fillStyle = tone(a, SHOE.deep ?? SHOE.sh);
  ctx.fillRect(nv[0] + 2.4, by + 0.5, 2, 1.6);
  pen(ctx, tone(a, SHIRT.deep, 0.6), 0.35);
  for (const dx of [-7, -2.4, 7.4]) {
    ctx.beginPath();
    ctx.moveTo(nv[0] + dx, by - 0.2);
    ctx.quadraticCurveTo(nv[0] + dx + 0.6, by - 2.6, nv[0] + dx + 0.2, by - 4.4);
    ctx.stroke();
  }
  ctx.restore();
  // the chest: lamp-blue shade low and at the back, the light on the front; the placket, its buttons
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const rb = D.J.ribs;
  const cx = st[0] + 2.2;
  glow(ctx, cx + 6, st[1] + 7, 12, SHIRT.lt, 0.8);
  glow(ctx, cx - 14, rb[1] + 4, 12, SHIRT.sh, 0.75);
  glow(ctx, cx, rb[1] + 12, 14, SHIRT.sh, 0.5);
  pen(ctx, tone(a, SHIRT.deep, 0.75), 0.4);
  ctx.beginPath();
  ctx.moveTo(cx + 1.2, st[1] + 3);
  ctx.lineTo(cx + 1.4, rb[1] + 16);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ell(ctx, cx + 2.2, st[1] + 6 + i * 5.2, 0.5, 0.5);
    ctx.fillStyle = tone(a, SHIRT.sh);
    ctx.fill();
  }
  // (two soft folds pulling toward the braces)
  pen(ctx, tone(a, SHIRT.sh, 0.7), 0.4);
  for (const dx of [-6, 8]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx, st[1] + 4);
    ctx.quadraticCurveTo(cx + dx * 1.1, (st[1] + rb[1]) / 2 + 3, cx + dx * 0.9, rb[1] + 6);
    ctx.stroke();
  }
  // the braces: navy straps over each shoulder, straight down to the waistband, gold clips
  for (const [x0, x1] of [[D.J.shF[0] + 3, cx - 6], [D.J.shN[0] - 3.2, cx + 8.4]]) {
    ctx.beginPath();
    ctx.moveTo(x0 - 1.3, st[1] - 3);
    ctx.quadraticCurveTo(mix(x0, x1, 0.6) - 1.2, rb[1] - 2, x1 - 1.2, rb[1] + 30);
    ctx.lineTo(x1 + 1.2, rb[1] + 30);
    ctx.quadraticCurveTo(mix(x0, x1, 0.6) + 1.2, rb[1] - 2, x0 + 1.3, st[1] - 3);
    ctx.closePath();
    ctx.fillStyle = tone(a, NAVY.base);
    ctx.fill();
    pen(ctx, tone(a, NAVY.lt, 0.6), 0.3);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
  // the braces' clips at the waistband (outside the clip, so they sit on the belt)
  ctx.save();
  enter(ctx, a, D, 'waistB');
  for (const dx of [-5.4, 8.2]) {
    ctx.beginPath();
    ctx.roundRect(nv[0] + dx - 1.2, by - 2.4, 2.4, 2.6, 0.6);
    ctx.fillStyle = tone(a, GOLD.base);
    ctx.fill();
    pen(ctx, tone(a, GOLD.ink), 0.3);
    ctx.stroke();
  }
  ctx.restore();
}
// The collar: soft white points open at the throat, over the neck's base.
export function collar(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const cx = st[0] + 2.2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 3.4, st[1] - 4.6);
    ctx.quadraticCurveTo(cx + s * 6.6, st[1] - 2.4, cx + s * 7.6, st[1] + 1.4);
    ctx.quadraticCurveTo(cx + s * 4.8, st[1] + 3.4, cx + s * 1.8, st[1] + 4.6);
    ctx.quadraticCurveTo(cx + s * 1.6, st[1] + 0.6, cx + s * 3.4, st[1] - 4.6);
    ctx.closePath();
    paint(ctx, a, mode, s > 0 ? SHIRT.lt : SHIRT.base, SHIRT.ink, lw / D.SC);
    if (mode === 'fill') glow(ctx, cx + s * 5, st[1] + 0.6, 2.2, SHIRT.sh, 0.5);
  }
  ctx.restore();
}
// His tie: the knot loosened a hand's width below the open collar, the blade falling to his belt and swinging
// on a spring (a.mgTie). In the chest's frame.
export function tie(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const cx = st[0] + 2.6;
  const ky = st[1] + 3.6;
  const sw = clamp(a.mgTie ?? 0, -0.7, 0.7);
  const w = lw / D.SC;
  // the blade, swinging about the knot (only ever forward of the body or hanging down)
  ctx.save();
  ctx.translate(cx, ky + 1.6);
  ctx.rotate(sw);
  ctx.beginPath();
  ctx.moveTo(-1.6, 0);
  ctx.quadraticCurveTo(-2.6, 9, -2.9, 17);
  ctx.lineTo(0, 20.2);
  ctx.lineTo(2.9, 17);
  ctx.quadraticCurveTo(2.6, 9, 1.6, 0);
  ctx.closePath();
  paint(ctx, a, mode, TIE.base, TIE.ink, w);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, 1.4, 6, 4, TIE.lt, 0.6);
    // (fine diagonal stripes, its own small pattern)
    pen(ctx, tone(a, TIE.deep, 0.5), 0.45);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-4, 1 + i * 3.6);
      ctx.lineTo(4, -1.6 + i * 3.6);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  // the knot
  ctx.beginPath();
  ctx.moveTo(cx - 2.2, ky - 1.4);
  ctx.lineTo(cx + 2.2, ky - 1.4);
  ctx.quadraticCurveTo(cx + 2, ky + 1.6, cx + 1.1, ky + 2.4);
  ctx.lineTo(cx - 1.1, ky + 2.4);
  ctx.quadraticCurveTo(cx - 2, ky + 1.6, cx - 2.2, ky - 1.4);
  ctx.closePath();
  paint(ctx, a, mode, TIE.sh, TIE.ink, w);
  if (mode === 'fill') glow(ctx, cx + 0.6, ky - 0.2, 1.6, TIE.lt, 0.5);
  // (the loose loop up round the open collar)
  if (mode === 'fill') {
    pen(ctx, tone(a, TIE.base), 1);
    ctx.beginPath();
    ctx.moveTo(cx - 2, ky - 1.2);
    ctx.quadraticCurveTo(cx - 3.4, st[1] - 2, cx - 2.6, st[1] - 4);
    ctx.moveTo(cx + 2, ky - 1.2);
    ctx.quadraticCurveTo(cx + 3.6, st[1] - 2, cx + 3, st[1] - 4);
    ctx.stroke();
  }
  ctx.restore();
}
// The lanyard round his neck and his ID card at the end of it, swinging on its own spring (a.mgCard).
export function lanyard(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const cx = st[0] - 3.2;
  const sw = clamp(a.mgCard ?? 0, -0.6, 0.6);
  const w = lw / D.SC;
  const top = [cx, st[1] + 11];
  if (mode === 'fill') {
    pen(ctx, tone(a, LANYARD.base), 0.9);
    ctx.beginPath();
    ctx.moveTo(cx - 3.6, st[1] - 3.2);
    ctx.quadraticCurveTo(cx - 3.4, st[1] + 6, top[0], top[1]);
    ctx.moveTo(cx + 3.2, st[1] - 3.6);
    ctx.quadraticCurveTo(cx + 2.2, st[1] + 6, top[0], top[1]);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(...top);
  ctx.rotate(sw);
  ctx.beginPath();
  ctx.roundRect(-3.2, 1.4, 6.4, 8.4, 1);
  paint(ctx, a, mode, LANYARD.card, LANYARD.cardSh, w);
  if (mode === 'fill') {
    // (the clip, his photo, asleep at his desk, and two lines of name)
    ctx.fillStyle = tone(a, GOLD.sh);
    ctx.fillRect(-0.7, 0, 1.4, 1.8);
    ctx.beginPath();
    ctx.roundRect(-2.3, 2.6, 2.8, 3.2, 0.5);
    ctx.fillStyle = tone(a, LANYARD.photo);
    ctx.fill();
    ell(ctx, -0.9, 4.6, 1.1, 0.9);
    ctx.fillStyle = tone(a, SKIN[1]);
    ctx.fill();
    pen(ctx, tone(a, '#7c5240'), 0.4);
    ctx.beginPath();
    ctx.moveTo(-1.6, 4.4);
    ctx.lineTo(-1.1, 4.5);
    ctx.moveTo(-0.6, 4.5);
    ctx.lineTo(-0.1, 4.4);
    ctx.stroke();
    pen(ctx, tone(a, LANYARD.sh), 0.4);
    ctx.beginPath();
    ctx.moveTo(1.1, 3.4);
    ctx.lineTo(2.4, 3.4);
    ctx.moveTo(1.1, 4.8);
    ctx.lineTo(2.2, 4.8);
    ctx.moveTo(-2.2, 7.4);
    ctx.lineTo(2.2, 7.4);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

// ---------- His sleeves: rolled to just under the elbow ----------
export function sleeve(ctx, a, mode, D, k, lw) {
  const near = k === 'N';
  const sh = orig(a, `arm${k}u`);
  const el = orig(a, `arm${k}f`);
  const wr = orig(a, `hand${k}`);
  const A = D.spec?.arm ?? { aw0: 5, ew: 4.4, aw1: 3.8 };
  const end = lerp2(el, wr, 0.3);
  const pts = [sh, lerp2(sh, el, 0.5), el, end];
  const W = [A.aw0 * 1.32, A.aw0 * 1.24, A.ew * 1.42, A.ew * 1.4].map((v) => v * D.SC);
  tubePath(ctx, pts, W);
  paint(ctx, a, mode, near ? SHIRT.base : SHIRT.sh, SHIRT.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    glow(ctx, ...lerp2(sh, el, 0.3), W[0] * 0.9, near ? SHIRT.lt : SHIRT.base, 0.6);
    glow(ctx, ...lerp2(sh, el, 0.9), W[2] * 0.8, SHIRT.deep, 0.35);
    ctx.restore();
  }
  // the roll: a fat soft band where the sleeve is turned up
  const an = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
  const c = lerp2(el, wr, 0.24);
  ctx.save();
  ctx.translate(c[0], c[1]);
  ctx.rotate(an);
  const r = A.ew * D.SC * 0.84;
  ctx.beginPath();
  ctx.roundRect(-1.4, -r, 2.8, r * 2, 1.2);
  paint(ctx, a, mode, near ? SHIRT.lt : SHIRT.base, SHIRT.ink, lw);
  if (mode === 'fill') {
    pen(ctx, tone(a, SHIRT.sh), 0.35);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.lineTo(0, r * 0.85);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- His slacks and loafers ----------
export function slacks(ctx, a, mode, D, k, lw) {
  const hip = orig(a, `thigh${k}`);
  const knee = orig(a, `shin${k}`);
  const ank = orig(a, `foot${k}`);
  const Lg = D.spec?.leg ?? { tw: 8.5, kw: 5.9, anw: 4.2 };
  const pts = [lerp2(hip, knee, -0.05), lerp2(hip, knee, 0.55), knee, lerp2(knee, ank, 0.5), lerp2(knee, ank, 0.94)];
  const W = [Lg.tw * 1.14, Lg.tw * 1.04, Lg.kw * 1.4, Lg.kw * 1.36, Lg.kw * 1.34].map((v) => v * D.SC);
  tubePath(ctx, pts, W);
  const far = k === 'F';
  paint(ctx, a, mode, far ? SLACK.sh : SLACK.base, SLACK.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    glow(ctx, ...lerp2(hip, knee, 0.4), Lg.tw * D.SC, far ? SLACK.base : SLACK.lt, 0.35);
    glow(ctx, ...lerp2(knee, ank, 0.7), Lg.kw * D.SC * 1.4, SLACK.deep, 0.4);
    // (the pressed crease down the front)
    const an = Math.atan2(ank[1] - knee[1], ank[0] - knee[0]);
    pen(ctx, tone(a, far ? SLACK.base : SLACK.lt, 0.7), 0.4);
    ctx.beginPath();
    const p0 = lerp2(hip, knee, 0.25);
    ctx.moveTo(p0[0] + 1.2, p0[1]);
    ctx.lineTo(knee[0] + 1.4, knee[1]);
    ctx.lineTo(ank[0] + 1.6 * Math.cos(an - Math.PI / 2) * 0, ank[1] - 1);
    ctx.stroke();
    ctx.restore();
  }
}
export function loafer(ctx, a, mode, D, k, lw) {
  const Lg = D.spec?.leg ?? { anw: 4.2, heel: 2.7, toe: 6.8, ftop: 1.2, fbot: 4 };
  const far = k === 'F';
  const M = a.blMat(`foot${k}`);
  ctx.save();
  ctx.transform(...M);
  const s = D.SC;
  const hl = Lg.heel * 1.12;
  const to = Lg.toe * 1.12;
  const pts = chaikin([[-hl, -Lg.ftop * 0.9], [Lg.anw * 0.3, -Lg.ftop * 0.9], [to * 0.62, Lg.fbot * 0.18], [to * 1.04, Lg.fbot * 0.6], [to * 0.96, Lg.fbot + 0.3], [-hl, Lg.fbot + 0.3], [-hl * 1.12, Lg.fbot * 0.3]], 2).map(([x, y]) => [x * s, y * s]);
  poly(ctx, pts);
  paint(ctx, a, mode, far ? SHOE.sh : SHOE.base, SHOE.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    glow(ctx, to * 0.6 * s, Lg.fbot * 0.2 * s, 2.6 * s, SHOE.lt, 0.8);
    ctx.fillStyle = tone(a, SHOE.ink);
    ctx.fillRect(-hl * 1.3 * s, (Lg.fbot - 0.45) * s, (hl + to) * 1.4 * s, s);
    // (the penny strap across the instep, its little slot)
    pen(ctx, tone(a, SHOE.sh), 0.8 * s);
    ctx.beginPath();
    ctx.moveTo(Lg.anw * 0.1 * s, Lg.fbot * -0.05 * s);
    ctx.quadraticCurveTo(to * 0.35 * s, -Lg.ftop * 0.2 * s, to * 0.62 * s, Lg.fbot * 0.35 * s);
    ctx.stroke();
    ell(ctx, to * 0.36 * s, Lg.fbot * 0.08 * s, 0.7 * s, 0.32 * s);
    ctx.fillStyle = tone(a, SHOE.ink);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ---------- The cardigan over his shoulders ----------
// a.mgKnit: { sw (its back's swing), cN, cF (the dangling cuffs' swing), off (0 worn .. 1 swept off in a
// whirl, the cardigan whirl swing) }.
function knitGeom(a, D) {
  const K = a.mgKnit ?? { sw: 0, cN: 0, cF: 0 };
  const sF = ptOf(a, D, 'chest', [D.J.shF[0] + 0.5, D.J.shF[1] - 1.8]);
  const sN = ptOf(a, D, 'chest', [D.J.shN[0] - 0.4, D.J.shN[1] - 2]);
  const nb = ptOf(a, D, 'chest', [D.J.stern[0] - 4, D.J.stern[1] - 4]);
  const knot = ptOf(a, D, 'chest', [D.J.stern[0] + 3, D.J.stern[1] + 7.6]);
  const hip = ptOf(a, D, 'torso', [D.J.hip[0] - 4, D.J.hip[1] + 2]);
  return { K, sF, sN, nb, knot, hip };
}
// Its body hanging down his back behind him, swinging after him; drawn behind everything of his.
export function knitBack(ctx, a, mode, D, lw) {
  const G = knitGeom(a, D);
  const sw = G.K.sw ?? 0;
  const back = sw * 5;
  const hem = G.hip[1] - 2;
  const pts = chaikin([
    [G.sN[0] - 1, G.sN[1] - 0.6], [G.nb[0] + 1, G.nb[1] - 1.6], [G.sF[0] - 1.6, G.sF[1] + 0.2], [G.sF[0] - 3.4 + back * 0.4, mix(G.sF[1], hem, 0.45)],
    [G.sF[0] - 4 + back, hem - 0.6], [mix(G.sF[0], G.sN[0], 0.4) - 2 + back * 0.9, hem + 1.2], [mix(G.sF[0], G.sN[0], 0.75) + back * 0.6, hem + 0.2],
    [mix(G.sF[0], G.sN[0], 0.8) + back * 0.3, mix(G.sN[1], hem, 0.45)],
  ], 3);
  poly(ctx, pts);
  paint(ctx, a, mode, KNIT.sh, KNIT.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    glow(ctx, G.sF[0] - 2, G.sF[1] + 6, 10, KNIT.base, 0.7);
    glow(ctx, mix(G.sF[0], G.sN[0], 0.5) - 3, hem, 9, KNIT.deep, 0.5);
    // (the knit's soft rib lines down it, and the ribbed hem)
    pen(ctx, tone(a, KNIT.deep, 0.35), 0.4);
    for (let i = 0; i < 5; i++) {
      const x = mix(G.sF[0] - 5, G.sN[0], i / 4) + back * 0.6 * (i / 4);
      ctx.beginPath();
      ctx.moveTo(x, G.sF[1] + 2);
      ctx.lineTo(x - 1 + back * 0.4, hem - 1);
      ctx.stroke();
    }
    ctx.fillStyle = tone(a, KNIT.deep, 0.55);
    ctx.fillRect(G.sF[0] - 12, hem - 2.6, 40, 1.2);
    ctx.restore();
  }
}
// Its sleeves over his shoulders, round the front, tied in a loose knot on his chest; the two cuffs dangling.
export function knitFront(ctx, a, mode, D, lw) {
  const G = knitGeom(a, D);
  const W = 3.6;
  const wl = lw;
  // (each sleeve: from behind the shoulder, over it, down to the knot)
  for (const [s, side] of [[G.sF, 'F'], [G.sN, 'N']]) {
    const mid = [mix(s[0], G.knot[0], 0.55) + (side === 'N' ? 1 : -1), mix(s[1], G.knot[1], 0.4) - 0.6];
    tubePath(ctx, [[s[0] + (side === 'N' ? 1.4 : -1.4), s[1] - 0.4], mid, G.knot], [W * 1.1, W, W * 0.95]);
    paint(ctx, a, mode, side === 'N' ? KNIT.base : KNIT.sh, KNIT.ink, wl);
    if (mode === 'fill') {
      ctx.save();
      tubePath(ctx, [[s[0], s[1] - 0.4], mid, G.knot], [W * 1.1, W, W * 0.95]);
      ctx.clip();
      glow(ctx, s[0], s[1] - 1, 3.4, KNIT.lt, 0.6);
      ctx.restore();
    }
  }
  // the dangling cuffs, each on its spring, a ribbed band at the end
  for (const [side, sw, len] of [['F', G.K.cF ?? 0, 9], ['N', G.K.cN ?? 0, 11.5]]) {
    const dx = side === 'N' ? 1.4 : -1.2;
    const an = clamp(sw, -0.8, 0.8) + (side === 'N' ? -0.12 : 0.1);
    const p0 = [G.knot[0] + dx, G.knot[1] + 0.6];
    const p1 = [p0[0] + Math.sin(an) * len * 0.5 + dx * 0.4, p0[1] + Math.cos(an) * len * 0.5];
    const p2 = [p0[0] + Math.sin(an) * len, p0[1] + Math.cos(an) * len];
    tubePath(ctx, [p0, p1, p2], [W * 0.95, W * 0.9, W * 0.95]);
    paint(ctx, a, mode, side === 'N' ? KNIT.base : KNIT.sh, KNIT.ink, wl);
    if (mode === 'fill') {
      const c = lerp2(p1, p2, 0.78);
      ctx.save();
      ctx.translate(...c);
      ctx.rotate(Math.atan2(p2[1] - p1[1], p2[0] - p1[0]));
      ctx.fillStyle = tone(a, KNIT.deep);
      ctx.fillRect(-0.9, -W * 0.48, 2.2, W * 0.96);
      pen(ctx, tone(a, KNIT.sh), 0.3);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-0.8, i * W * 0.28);
        ctx.lineTo(1.2, i * W * 0.28);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  // the knot: a soft round bunch
  ell(ctx, G.knot[0], G.knot[1], W * 0.75, W * 0.62);
  paint(ctx, a, mode, KNIT.base, KNIT.ink, wl);
  if (mode === 'fill') {
    glow(ctx, G.knot[0] - 0.4, G.knot[1] - 0.6, 2, KNIT.lt, 0.7);
    pen(ctx, tone(a, KNIT.deep, 0.6), 0.35);
    ctx.beginPath();
    ctx.arc(G.knot[0] + 0.3, G.knot[1] + 0.2, W * 0.4, 0.4, 2.4);
    ctx.stroke();
  }
}

// ---------- His travel mug (in his near hand, held by its handle) ----------
// a.mgMug: { rot (tipped from level), lid (0 shut .. 1 flicked open), slosh }.
export const MG = { w: 6.4, h: 10.6 };
export function mugGeom(a, D) {
  const hand = ptOf(a, D, 'handN', D.J.handN);
  const M = a.mgMug ?? { rot: 0 };
  return { x: hand[0], y: hand[1], rot: M.rot ?? 0, lid: M.lid ?? 0 };
}
export function mug(ctx, a, mode, D, lw) {
  if (a.mgQ?.noMug) return;
  const G = mugGeom(a, D);
  drawMug(ctx, a, mode, G.x, G.y, G.rot, G.lid, lw);
}
// The mug with its handle at (x, y): the body forward of the handle, level when rot is 0.
export function drawMug(ctx, a, mode, x, y, r, lid, lw) {
  const { w, h } = MG;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(r);
  const bx = 2.2;
  // the handle, a soft loop the fingers curl through
  ctx.beginPath();
  ctx.ellipse(bx - 0.2, -h * 0.5, 2.4, 3.2, 0, Math.PI * 0.5, Math.PI * 1.5);
  ctx.lineTo(bx + 0.4, -h * 0.5 - 1.8);
  ctx.ellipse(bx - 0.2, -h * 0.5, 1.2, 1.8, 0, Math.PI * 1.5, Math.PI * 0.5, true);
  ctx.closePath();
  paint(ctx, a, mode, MUG.bandSh, MUG.ink, lw);
  // the body: a tall soft cylinder, a little wider at the top
  const L = bx;
  const R = bx + w;
  const body = chaikin([[L + 0.2, -h + 1.2], [R - 0.2, -h + 1.2], [R - 0.6, -0.6], [R - 1.2, 0.4], [L + 1.2, 0.4], [L + 0.6, -0.6]], 2);
  poly(ctx, body);
  paint(ctx, a, mode, MUG.base, MUG.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, body);
    ctx.clip();
    glow(ctx, L + w * 0.35, -h * 0.6, w * 0.5, MUG.lt, 0.8);
    glow(ctx, R, -h * 0.3, w * 0.4, MUG.sh, 0.6);
    // the teal band round its middle, a light on it, a little coffee bean on it
    ctx.fillStyle = tone(a, MUG.band);
    ctx.fillRect(L - 1, -h * 0.62, w + 2, h * 0.3);
    glow(ctx, L + w * 0.35, -h * 0.5, w * 0.35, MUG.bandLt, 0.6);
    ell(ctx, L + w * 0.55, -h * 0.47, 0.9, 1.25, 0.3);
    ctx.fillStyle = tone(a, '#7a4a30');
    ctx.fill();
    pen(ctx, tone(a, '#c48a5c'), 0.25);
    ctx.beginPath();
    ctx.moveTo(L + w * 0.55 - 0.3, -h * 0.47 - 1);
    ctx.quadraticCurveTo(L + w * 0.55 + 0.4, -h * 0.47, L + w * 0.55 - 0.1, -h * 0.47 + 1);
    ctx.stroke();
    ctx.restore();
  }
  // the lid: cocoa, a sip spout at the front, a flap that flicks up
  ctx.beginPath();
  ctx.roundRect(L - 0.4, -h, w + 0.8, 2, 0.9);
  paint(ctx, a, mode, MUG.lid, '#4a2e26', lw);
  ctx.beginPath();
  ctx.roundRect(R - 2.6, -h - 1.1 - lid * 0.8, 2, 1.4, 0.6);
  paint(ctx, a, mode, MUG.lidLt, '#4a2e26', lw);
  ctx.restore();
}

// ---------- His clipboard (in his far hand) ----------
// a.mgBoard: { rot, up (0 at his side .. 1 held up to read / swing), ticks (0..4 boxes ticked) }.
export const CB = { w: 9, h: 12 };
export function clipboard(ctx, a, mode, D, lw) {
  if (a.mgQ?.noBoard) return;
  const hand = ptOf(a, D, 'handF', D.J.handF);
  const B = a.mgBoard ?? { rot: 0, ticks: 2 };
  drawBoard(ctx, a, mode, hand[0], hand[1], B.rot ?? 0, B.ticks ?? 2, lw);
}
// The board gripped at the middle of its left edge at (x, y).
export function drawBoard(ctx, a, mode, x, y, r, ticks, lw) {
  const { w, h } = CB;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(r);
  ctx.beginPath();
  ctx.roundRect(-1, -h / 2, w, h, 1);
  paint(ctx, a, mode, BOARD.base, BOARD.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, 2, -h * 0.3, 5, BOARD.lt, 0.7);
    ctx.restore();
    // its paper, the checklist: four boxes, `ticks` of them ticked
    ctx.beginPath();
    ctx.roundRect(0.2, -h / 2 + 1.6, w - 2.4, h - 2.6, 0.4);
    ctx.fillStyle = tone(a, BOARD.paper);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      const yy = -h / 2 + 3.6 + i * 2.2;
      ctx.strokeStyle = tone(a, BOARD.line);
      ctx.lineWidth = 0.3;
      ctx.strokeRect(1, yy - 0.7, 1.2, 1.2);
      ctx.beginPath();
      ctx.moveTo(2.8, yy);
      ctx.lineTo(w - 3, yy);
      ctx.stroke();
      const tk = clamp(ticks - i, 0, 1);
      if (tk > 0.05) {
        pen(ctx, tone(a, BOARD.tick), 0.45);
        ctx.beginPath();
        ctx.moveTo(1.1, yy - 0.1);
        ctx.lineTo(1.5, yy + 0.4);
        ctx.lineTo(1.5 + 1.2 * tk, yy - 1.1 * tk);
        ctx.stroke();
      }
    }
    // the steel clip
    ctx.beginPath();
    ctx.roundRect(w * 0.2, -h / 2 - 0.8, w * 0.46, 2, 0.7);
    ctx.fillStyle = tone(a, BOARD.clip);
    ctx.fill();
    pen(ctx, tone(a, BOARD.clipSh), 0.3);
    ctx.stroke();
  }
  ctx.restore();
}
