// Sol and Luna, the Eclipse Twins' clothes and things (2026-11-27, drawn from scratch): what they wear is cut
// from their bodies' own outlines or wraps their limbs (never a flat panel pasted on, never over a face or
// an arm), each piece in both of the rig's passes (mode 'line' its outline, 'fill' itself) so only the
// outer edge is outlined, in a deeper shade of its own colour.
// Sol:
//   halo      the sun at her back: a gold ring of soft round rays floating behind her, turning slowly
//   tail      a big fluffy fox's tail from the small of her back, orange with a cream tip, on springs
//   jacket    a cropped coral jacket cut from her torso's outline, open over a cream top, gold sun buttons,
//             a gold sash with a sun buckle
//   skirt     a short pleated orange skirt from her hips, its hem spanning her thighs
//   sleeves   little puffed coral sleeves; cream arm warmers with gold bands
//   legs      cream knee socks with an orange band, coral ankle boots
// Luna:
//   capelet   a night-blue hooded capelet: its hood down behind her neck, two soft panels down her back on
//             springs, a gold crescent clasp at her collar
//   dress     moon white, cut from her torso's outline, a night-blue ribbon bow at her chest; its skirt to
//             her knees with a band of little crescents round the hem
//   sleeves   loose white sleeves gathered at her wrists with night-blue cuffs
//   legs      white tights, night-blue shoes with a strap
//   tail      a round puff of a bunny's tail
//   mallet    her mochi mallet: a pale wooden pounder, its round head bound with a gold band
import { TAU, mix, tone, ell, pen, glow, clamp, sstep } from './fx.js';
import { poly, chaikin } from './head.js';
import { SOL, LUNA } from './palette.js';

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
const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
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
function inBody(ctx, a, D, bone, fn) {
  const T = a.blTorsoPts;
  if (!T) return;
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  enter(ctx, a, D, bone);
  fn();
  ctx.restore();
}
function sunStar(ctx, x, y, r, col) {
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, TAU);
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU;
    ctx.moveTo(x + Math.cos(an) * r * 0.9 + r * 0.22, y + Math.sin(an) * r * 0.9);
    ctx.arc(x + Math.cos(an) * r * 0.9, y + Math.sin(an) * r * 0.9, r * 0.22, 0, TAU);
  }
  ctx.fillStyle = col;
  ctx.fill();
}
export function crescent(ctx, x, y, r, rot, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI * 0.3, Math.PI * 1.7);
  ctx.arc(r * 0.45, -r * 0.05, r * 0.8, Math.PI * 1.62, Math.PI * 0.38, true);
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
// An A-line skirt from the hips (in the hips' frame: half-width `top`, `drop` below the hip joint at the
// top) to a hem `under` below the lower knee (negative: above it), spanning the knees plus `flare`.
function skirtPts(a, D, top, drop, under, flare, sway) {
  const hip = D.J.hip;
  const hl = ptOf(a, D, 'torso', [hip[0] - top, hip[1] - drop]);
  const hr = ptOf(a, D, 'torso', [hip[0] + top, hip[1] - drop]);
  const hm = ptOf(a, D, 'torso', [hip[0], hip[1] - drop - 1]);
  const kN = orig(a, 'shinN');
  const kF = orig(a, 'shinF');
  const tN = lerp2(orig(a, 'thighN'), kN, 0.6);
  const tF = lerp2(orig(a, 'thighF'), kF, 0.6);
  const short = under < 0;
  const ref = short ? [tN, tF] : [kN, kF];
  const back = Math.min(ref[0][0], ref[1][0], hl[0]) - flare + sway * 2;
  const front = Math.max(ref[0][0], ref[1][0], hr[0]) + flare + sway * 2;
  const hemY = Math.max(ref[0][1], ref[1][1]) + Math.abs(under);
  const mid = (back + front) / 2;
  return chaikin([hl, hm, hr, [mix(hr[0], front, 0.5), mix(hr[1], hemY, 0.5)], [mix(hr[0], front, 0.92), mix(hr[1], hemY, 0.92)], [front, hemY - 0.5], [mid + sway, hemY + 0.9], [back, hemY - 0.5], [mix(hl[0], back, 0.92), mix(hl[1], hemY, 0.92)], [mix(hl[0], back, 0.5), mix(hl[1], hemY, 0.5)]], 2);
}
const bounds = (pts) => {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { x0, x1, y0, y1 };
};
function torsoLine(ctx, a, ink, lw) {
  if (!a.blTorsoPts) return;
  poly(ctx, a.blTorsoPts);
  pen(ctx, tone(a, ink), lw);
  ctx.stroke();
}
function legTube(ctx, a, mode, D, k, top, col, colFar, ink, lw, scale = 1.05) {
  const hip = orig(a, `thigh${k}`);
  const knee = orig(a, `shin${k}`);
  const ank = orig(a, `foot${k}`);
  const Lg = D.spec?.leg ?? { tw: 12, kw: 8.6, anw: 6.2 };
  const SC = D.SC;
  const pts = top > 0 ? [lerp2(hip, knee, top), knee, lerp2(knee, ank, 0.4), ank] : [lerp2(hip, knee, 0.1), lerp2(hip, knee, 0.55), knee, lerp2(knee, ank, 0.4), ank];
  const W = (top > 0 ? [mix(Lg.tw, Lg.kw, top), Lg.kw, Lg.kw * 1.02, Lg.anw] : [Lg.tw, Lg.tw * 0.92, Lg.kw, Lg.kw * 1.02, Lg.anw]).map((w) => w * SC * scale);
  tubePath(ctx, pts, W);
  paint(ctx, a, mode, k === 'F' ? colFar : col, ink, lw);
  return { pts, W, knee, ank };
}
function shoe(ctx, a, mode, D, k, col, colFar, ink, lw, sole, strap) {
  const Lg = D.spec?.leg ?? { anw: 6, heel: 3.8, toe: 10, ftop: 1.8, fbot: 6.6 };
  const s = D.SC;
  const far = k === 'F';
  ctx.save();
  ctx.transform(...a.blMat(`foot${k}`));
  const hl = Lg.heel * 1.12;
  const to = Lg.toe * 1.06;
  const pts = chaikin([[-hl, -Lg.ftop - 2.6], [Lg.anw * 0.5, -Lg.ftop - 2.8], [Lg.anw * 0.62, -Lg.ftop + 0.6], [to * 0.82, Lg.fbot * 0.36], [to * 1.02, Lg.fbot * 0.7], [to * 0.92, Lg.fbot + 0.25], [-hl, Lg.fbot + 0.25], [-hl * 1.08, Lg.fbot * 0.3]], 2).map(([x, y]) => [x * s, y * s]);
  poly(ctx, pts);
  paint(ctx, a, mode, far ? colFar : col, ink, lw);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    ctx.fillStyle = tone(a, sole);
    ctx.fillRect(-hl * 1.3 * s, (Lg.fbot - 0.9) * s, (hl + to) * 1.4 * s, 2 * s);
    glow(ctx, to * 0.5 * s, 0, 3 * s, '#ffffff', 0.5);
    ctx.restore();
    if (strap) {
      pen(ctx, tone(a, strap), 0.9 * s);
      ctx.beginPath();
      ctx.moveTo(Lg.anw * 0.1 * s, -Lg.ftop * 0.4 * s);
      ctx.quadraticCurveTo(Lg.anw * 0.7 * s, Lg.fbot * 0.1 * s, to * 0.58 * s, Lg.fbot * 0.4 * s);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ================= Sol =================
// The sun at her back: a gold ring of soft round rays, turning slowly (q.halo: how bright, 0..1.4).
export function solHalo(ctx, a, mode, D, lw) {
  const q = a.ecQ ?? {};
  const k = q.halo ?? 1;
  if (k <= 0.02) return;
  // (round her head, like the sun behind it)
  const c = ptOf(a, D, 'chest', [D.J.stern[0] - 3, D.J.stern[1] - 25]);
  const t = a.t ?? 0;
  const r = 13 + 1.2 * (k - 1);
  const rot = t * 0.4 + (q.haloSpin ?? 0);
  ctx.save();
  ctx.translate(c[0], c[1]);
  ctx.globalAlpha *= clamp(k, 0, 1);
  if (mode === 'fill') glow(ctx, 0, 0, r * 1.9, SOL.gold.lt, 0.3 * k);
  ctx.beginPath();
  // (its rays: soft round-ended petals, long and short in turn, rooted in the ring)
  const n = 12;
  for (let i = 0; i < n; i++) {
    const an = rot + (i / n) * TAU;
    const L = i % 2 ? 2.2 : 3.4;
    const w = i % 2 ? 1.0 : 1.3;
    const d = [Math.cos(an), Math.sin(an)];
    const nr = [-d[1], d[0]];
    const P = (u, v) => [d[0] * (r + u) + nr[0] * v, d[1] * (r + u) + nr[1] * v];
    ctx.moveTo(...P(0, -w));
    ctx.quadraticCurveTo(...P(L * 0.55, -w), ...P(L, 0));
    ctx.quadraticCurveTo(...P(L * 0.55, w), ...P(0, w));
    ctx.closePath();
  }
  ctx.moveTo(r + 1.1, 0);
  ctx.arc(0, 0, r + 1.1, 0, TAU);
  ctx.moveTo(r - 1.1, 0);
  ctx.arc(0, 0, r - 1.1, 0, TAU, true);
  if (mode === 'line') {
    pen(ctx, tone(a, SOL.gold.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, SOL.gold.base);
    ctx.fill('nonzero');
    ctx.save();
    ctx.clip('nonzero');
    glow(ctx, -r * 0.5, -r * 0.6, r * 1.2, SOL.gold.lt, 0.8);
    ctx.restore();
  }
  ctx.restore();
}
// Her fox's tail: from the small of her back, a chain of pieces on springs (a.ecTail), full and fluffy,
// one smooth taper to a soft round cream tip.
export function solTail(ctx, a, mode, D, lw) {
  const F = SOL.fur;
  const hip = D.J.hip;
  const root = ptOf(a, D, 'torso', [hip[0] - 9, hip[1] - 4]);
  const angs = a.ecTail ?? [0, 0, 0, 0, 0];
  const pts = [root];
  // (held up behind her in a soft S: out and back, then curling up)
  let th = Math.PI * 0.6 + boneAng(a, 'torso');
  const seg = [4.6, 4.6, 4.4, 4, 3.6];
  for (let i = 0; i < 5; i++) {
    th += angs[i];
    const p = pts[i];
    pts.push([p[0] + Math.cos(th) * seg[i], p[1] + Math.sin(th) * seg[i]]);
  }
  const W = [4.6, 7.4, 9.2, 9.6, 8.4, 5.8];
  tubePath(ctx, pts, W);
  paint(ctx, a, mode, F.base, F.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    const tip = pts[5];
    glow(ctx, tip[0], tip[1], 7.4, F.cream, 1);
    ell(ctx, tip[0], tip[1], 4.2, 4.2);
    ctx.fillStyle = tone(a, F.cream);
    ctx.fill();
    glow(ctx, ...pts[2], 6, '#ffd08a', 0.6);
    glow(ctx, ...lerp2(pts[1], pts[3], 0.5), 7, F.sh, 0.35);
    ctx.restore();
  }
}
export function solJacket(ctx, a, mode, D, lw) {
  if (mode === 'line') return torsoLine(ctx, a, SOL.coral.ink, lw);
  const T = a.blTorsoPts;
  if (!T) return;
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  ctx.fillStyle = tone(a, SOL.cream.base);
  ctx.fillRect(-200, -200, 400, 400);
  ctx.restore();
  inBody(ctx, a, D, 'chest', () => {
    const st = D.J.stern;
    const rb = D.J.ribs;
    const cx = st[0] + 1.4;
    const bot = rb[1] + 5;
    // the cropped coral jacket: open down the front, ending above her waist
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 3.4, st[1] - 3);
      ctx.quadraticCurveTo(cx + side * 4.6, (st[1] + bot) / 2, cx + side * 6.2, bot);
      ctx.lineTo(cx + side * 40, bot + 1);
      ctx.lineTo(cx + side * 40, st[1] - 20);
      ctx.lineTo(cx + side * 3.4, st[1] - 20);
      ctx.closePath();
      ctx.fillStyle = tone(a, side > 0 ? SOL.coral.base : SOL.coral.sh);
      ctx.fill();
    }
    glow(ctx, cx + 8, st[1] + 4, 9, SOL.coral.lt, 0.6);
    // its edges, a gold piping
    pen(ctx, tone(a, SOL.gold.base), 0.8);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 3.4, st[1] - 3);
      ctx.quadraticCurveTo(cx + side * 4.6, (st[1] + bot) / 2, cx + side * 6.2, bot);
      ctx.lineTo(cx + side * 24, bot + 0.6);
      ctx.stroke();
    }
    // two sun buttons
    for (const dy of [3.4, 8.4]) sunStar(ctx, cx + 6.4, st[1] + dy, 1.4, tone(a, SOL.gold.base));
    // the cream top's soft shade, a little neckline curve
    glow(ctx, cx, bot + 3, 7, SOL.cream.sh, 0.7);
  });
  // the gold sash with a sun buckle
  inBody(ctx, a, D, 'waistB', () => {
    const nv = D.J.navel;
    ctx.beginPath();
    ctx.moveTo(nv[0] - 40, nv[1] - 2.6);
    ctx.quadraticCurveTo(nv[0], nv[1] - 1.2, nv[0] + 40, nv[1] - 2.6);
    ctx.lineTo(nv[0] + 40, nv[1] + 2);
    ctx.quadraticCurveTo(nv[0], nv[1] + 3.4, nv[0] - 40, nv[1] + 2);
    ctx.closePath();
    ctx.fillStyle = tone(a, SOL.gold.base);
    ctx.fill();
    sunStar(ctx, nv[0] + 3, nv[1] + 0.2, 2.6, tone(a, SOL.gold.sh));
    ell(ctx, nv[0] + 3, nv[1] + 0.2, 1.2, 1.2);
    ctx.fillStyle = tone(a, SOL.gold.lt);
    ctx.fill();
  });
}
export function solSkirt(ctx, a, mode, D, lw) {
  const pts = skirtPts(a, D, 13, 4.6, -1.4, 3.4, a.ecSkirt ?? 0);
  poly(ctx, pts);
  if (mode === 'line') return paint(ctx, a, mode, null, SOL.skirt.ink, lw);
  const B = bounds(pts);
  const g = ctx.createLinearGradient(0, B.y0, 0, B.y1);
  g.addColorStop(0, tone(a, SOL.skirt.sh));
  g.addColorStop(0.4, tone(a, SOL.skirt.base));
  g.addColorStop(1, tone(a, SOL.skirt.sh));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  poly(ctx, pts);
  ctx.clip();
  // the pleats: soft folds fanning from the waistband to the hem
  pen(ctx, tone(a, SOL.skirt.deep, 0.5), 0.55);
  for (let i = 1; i < 6; i++) {
    const u = i / 6;
    ctx.beginPath();
    ctx.moveTo(mix(B.x0 + 3, B.x1 - 3, u), B.y0 + 1.5);
    ctx.lineTo(mix(B.x0, B.x1, u), B.y1);
    ctx.stroke();
  }
  glow(ctx, mix(B.x0, B.x1, 0.66), B.y0 + 3, (B.x1 - B.x0) * 0.35, SOL.skirt.lt, 0.6);
  // a coral band round the hem
  pen(ctx, tone(a, SOL.coral.base), 1.6);
  ctx.beginPath();
  ctx.moveTo(B.x0 - 2, B.y1 - 1.6);
  ctx.quadraticCurveTo((B.x0 + B.x1) / 2, B.y1 - 0.2, B.x1 + 2, B.y1 - 1.6);
  ctx.stroke();
  ctx.restore();
}
export function solSleeve(ctx, a, mode, D, k, lw) {
  const near = k === 'N';
  const sh = orig(a, `arm${k}u`);
  const el = orig(a, `arm${k}f`);
  const wr = orig(a, `hand${k}`);
  const A = D.spec?.arm ?? { aw0: 7.6, ew: 6.7, aw1: 5.8 };
  const SC = D.SC;
  // the cream arm warmer from just under the elbow to the wrist, a gold band at each end
  const wpts = [lerp2(el, wr, 0.08), lerp2(el, wr, 0.5), lerp2(el, wr, 0.9)];
  const ww = [A.ew * 1.22, A.ew * 1.18, A.aw1 * 1.4].map((w) => w * SC);
  tubePath(ctx, wpts, ww);
  paint(ctx, a, mode, near ? SOL.cream.base : SOL.cream.sh, SOL.cream.ink, lw);
  if (mode === 'fill') {
    const an = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
    pen(ctx, tone(a, SOL.gold.base), 1);
    for (const [u, r] of [[0.12, A.ew * 0.6], [0.86, A.aw1 * 0.72]]) {
      const p = lerp2(el, wr, u);
      ctx.beginPath();
      ctx.moveTo(p[0] - Math.sin(an) * r * SC, p[1] + Math.cos(an) * r * SC);
      ctx.lineTo(p[0] + Math.sin(an) * r * SC, p[1] - Math.cos(an) * r * SC);
      ctx.stroke();
    }
  }
  // the little puffed coral sleeve at the shoulder
  const pp = [sh, lerp2(sh, el, 0.35)];
  const pw = [A.aw0 * 1.8, A.aw0 * 1.55].map((w) => w * SC);
  tubePath(ctx, pp, pw);
  paint(ctx, a, mode, near ? SOL.coral.base : SOL.coral.sh, SOL.coral.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pp, pw);
    ctx.clip();
    glow(ctx, sh[0] + 1, sh[1] - 1, pw[0] * 0.7, SOL.coral.lt, 0.7);
    ctx.restore();
  }
}
export function solSock(ctx, a, mode, D, k, lw) {
  const r = legTube(ctx, a, mode, D, k, 0.62, '#ffffff', '#ece4ee', '#c8b8c8', lw);
  if (mode === 'fill') {
    const p = r.pts[0];
    const an = Math.atan2(r.knee[1] - p[1], r.knee[0] - p[0]);
    pen(ctx, tone(a, SOL.skirt.base), 1.1);
    ctx.beginPath();
    ctx.moveTo(p[0] - Math.sin(an) * r.W[0] * 0.48, p[1] + Math.cos(an) * r.W[0] * 0.48 + 0.6);
    ctx.lineTo(p[0] + Math.sin(an) * r.W[0] * 0.48, p[1] - Math.cos(an) * r.W[0] * 0.48 + 0.6);
    ctx.stroke();
  }
}
export const solBoot = (ctx, a, mode, D, k, lw) => shoe(ctx, a, mode, D, k, SOL.boot.base, SOL.boot.sh, SOL.boot.ink, lw, SOL.boot.sh, SOL.gold.base);

// ================= Luna =================
// The capelet behind her: two soft panels down her back on springs (a.ecCape), the hood down behind her
// neck.
export function lunaCape(ctx, a, mode, D, lw) {
  const sw = a.ecCape ?? [0, 0];
  const st = D.J.stern;
  const lean = boneAng(a, 'chest');
  const N = LUNA.night;
  for (let i = 0; i < 2; i++) {
    const r = ptOf(a, D, 'chest', [st[0] - 2 + i * 6, st[1] + 1]);
    const an = Math.PI / 2 + 0.3 - i * 0.12 + sw[i] - lean * 0.3;
    const d = [Math.cos(an), Math.sin(an)];
    const nrm = [-d[1], d[0]];
    const L = 19 - i * 2;
    const w = 8;
    const at = (u, s) => [r[0] + d[0] * L * u + nrm[0] * s, r[1] + d[1] * L * u + nrm[1] * s];
    const pts = chaikin([at(0, -w * 0.4), at(0.5, -w * 0.62), at(0.95, -w * 0.6), at(1.06, 0), at(0.95, w * 0.6), at(0.5, w * 0.62), at(0, w * 0.4)], 2);
    poly(ctx, pts);
    paint(ctx, a, mode, i ? N.base : N.sh, N.ink, lw);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, pts);
      ctx.clip();
      glow(ctx, ...at(0.3, -w * 0.2), w * 1.1, N.lt, 0.6);
      pen(ctx, tone(a, LUNA.gold.base, 0.9), 0.9);
      ctx.beginPath();
      ctx.moveTo(...at(0.92, -w * 0.6));
      ctx.quadraticCurveTo(...at(1.12, 0), ...at(0.92, w * 0.6));
      ctx.stroke();
      ctx.restore();
    }
  }
  // the hood, down behind her neck
  const h = ptOf(a, D, 'chest', [st[0] - 3, st[1] - 3]);
  ctx.beginPath();
  ctx.ellipse(h[0], h[1], 5.4, 3.6, -0.25, 0, TAU);
  paint(ctx, a, mode, N.sh, N.ink, lw);
}
export function lunaClasp(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const cx = st[0] + 0.8;
  const y = st[1] - 0.6;
  // the capelet's front over her shoulders: a soft rounded collar of night blue
  ctx.beginPath();
  ctx.moveTo(cx - 13.6, y + 2);
  ctx.quadraticCurveTo(cx - 12, y - 3, cx, y - 2.4);
  ctx.quadraticCurveTo(cx + 12, y - 3, cx + 13.6, y + 2);
  ctx.quadraticCurveTo(cx + 12, y + 7.6, cx + 2, y + 5.4);
  ctx.quadraticCurveTo(cx, y + 7, cx - 2, y + 5.4);
  ctx.quadraticCurveTo(cx - 12, y + 7.6, cx - 13.6, y + 2);
  ctx.closePath();
  paint(ctx, a, mode, LUNA.night.base, LUNA.night.ink, lw / D.SC);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, cx + 4, y, 9, LUNA.night.lt, 0.6);
    ctx.restore();
    crescent(ctx, cx + 0.6, y + 4.6, 2.6, -0.4, tone(a, LUNA.gold.base));
  }
  ctx.restore();
}
export function lunaDress(ctx, a, mode, D, lw) {
  if (mode === 'line') return torsoLine(ctx, a, LUNA.moon.ink, lw);
  const T = a.blTorsoPts;
  if (!T) return;
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  ctx.fillStyle = tone(a, LUNA.moon.base);
  ctx.fillRect(-200, -200, 400, 400);
  ctx.restore();
  inBody(ctx, a, D, 'chest', () => {
    const st = D.J.stern;
    const rb = D.J.ribs;
    const cx = st[0] + 1.2;
    glow(ctx, cx - 10, rb[1] + 4, 10, LUNA.moon.sh, 0.8);
    glow(ctx, cx + 6, st[1] + 6, 8, '#ffffff', 0.8);
    // the night-blue ribbon bow at her chest
    const by = st[1] + 8;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx, by);
      ctx.quadraticCurveTo(cx + side * 3, by - 3.4, cx + side * 5, by - 1.4);
      ctx.quadraticCurveTo(cx + side * 5.6, by + 1.6, cx, by);
      ctx.fillStyle = tone(a, LUNA.night.base);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, by + 0.4);
      ctx.quadraticCurveTo(cx + side * 1.4, by + 4, cx + side * 2.6, by + 6);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = tone(a, LUNA.night.sh);
      ctx.stroke();
    }
    ell(ctx, cx, by, 1.3, 1.1);
    ctx.fillStyle = tone(a, LUNA.night.sh);
    ctx.fill();
  });
}
export function lunaSkirt(ctx, a, mode, D, lw) {
  const pts = skirtPts(a, D, 12, 5, 0.4, 3.6, a.ecSkirt ?? 0);
  poly(ctx, pts);
  if (mode === 'line') return paint(ctx, a, mode, null, LUNA.moon.ink, lw);
  const B = bounds(pts);
  const g = ctx.createLinearGradient(0, B.y0, 0, B.y1);
  g.addColorStop(0, tone(a, LUNA.moon.base));
  g.addColorStop(1, tone(a, LUNA.moon.sh));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  poly(ctx, pts);
  ctx.clip();
  pen(ctx, tone(a, LUNA.moon.deep, 0.5), 0.5);
  for (const u of [0.3, 0.55, 0.8]) {
    ctx.beginPath();
    ctx.moveTo(mix(B.x0 + 4, B.x1 - 4, u), B.y0 + 2);
    ctx.quadraticCurveTo(mix(B.x0, B.x1, u), B.y0 + (B.y1 - B.y0) * 0.6, mix(B.x0, B.x1, u), B.y1);
    ctx.stroke();
  }
  // a night-blue band round the hem with little gold crescents
  ctx.beginPath();
  ctx.moveTo(B.x0 - 4, B.y1 - 3.4);
  ctx.quadraticCurveTo((B.x0 + B.x1) / 2, B.y1 - 2.2, B.x1 + 4, B.y1 - 3.4);
  ctx.lineTo(B.x1 + 4, B.y1 + 4);
  ctx.lineTo(B.x0 - 4, B.y1 + 4);
  ctx.closePath();
  ctx.fillStyle = tone(a, LUNA.night.base);
  ctx.fill();
  for (let i = 1; i < 5; i++) crescent(ctx, mix(B.x0, B.x1, i / 5), B.y1 - 1.2, 0.95, -0.5, tone(a, LUNA.gold.base));
  ctx.restore();
}
export function lunaSleeve(ctx, a, mode, D, k, lw) {
  const near = k === 'N';
  const sh = orig(a, `arm${k}u`);
  const el = orig(a, `arm${k}f`);
  const wr = orig(a, `hand${k}`);
  const A = D.spec?.arm ?? { aw0: 6.8, ew: 6, aw1: 5.2 };
  const SC = D.SC;
  // a loose sleeve, fuller toward the wrist, gathered into a night-blue cuff
  const pts = [sh, lerp2(sh, el, 0.6), el, lerp2(el, wr, 0.55), lerp2(el, wr, 0.82)];
  const W = [A.aw0 * 1.5, A.aw0 * 1.3, A.ew * 1.45, A.ew * 1.75, A.ew * 1.55].map((w) => w * SC);
  tubePath(ctx, pts, W);
  paint(ctx, a, mode, near ? LUNA.moon.base : LUNA.moon.sh, LUNA.moon.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    glow(ctx, ...lerp2(el, wr, 0.5), W[3] * 0.6, LUNA.moon.sh, 0.8);
    ctx.restore();
  }
  const cp = [lerp2(el, wr, 0.84), lerp2(el, wr, 0.94)];
  const cw = [A.aw1 * 1.55, A.aw1 * 1.45].map((w) => w * SC);
  tubePath(ctx, cp, cw);
  paint(ctx, a, mode, near ? LUNA.night.base : LUNA.night.sh, LUNA.night.ink, lw);
}
export const lunaTights = (ctx, a, mode, D, k, lw) => legTube(ctx, a, mode, D, k, 0, LUNA.moon.base, LUNA.moon.sh, LUNA.moon.ink, lw, 1.03);
export const lunaShoe = (ctx, a, mode, D, k, lw) => shoe(ctx, a, mode, D, k, LUNA.boot.base, LUNA.boot.sh, LUNA.boot.ink, lw, LUNA.boot.sh, LUNA.gold.base);
export function lunaPuff(ctx, a, mode, D, lw) {
  const hip = D.J.hip;
  const p = ptOf(a, D, 'torso', [hip[0] - 12, hip[1] - 1]);
  const j = a.ecPuff ?? 0;
  ctx.beginPath();
  for (const [dx, dy, r] of [[0, 0, 3.6], [-1.6, -1.4, 2.4], [1.4, -1.6, 2.2], [-1.2, 1.6, 2.2]]) {
    ctx.moveTo(p[0] + dx + r - 1 + j, p[1] + dy);
    ctx.ellipse(p[0] + dx - 1 + j, p[1] + dy, r, r, 0, 0, TAU);
  }
  paint(ctx, a, mode, LUNA.fur.base, LUNA.fur.ink, lw);
  if (mode === 'fill') glow(ctx, p[0] - 2 + j, p[1] - 1.4, 3, '#ffffff', 0.9);
}
// Her mochi mallet: in her near hand, its handle at q.ma (radians off straight up, + leaning forward); its
// round head at the far end. Geometry for the rig's space.
export function malletGeom(a, D) {
  const q = a.ecQ ?? {};
  const hand = ptOf(a, D, 'handN', D.J.handN);
  const an = -Math.PI / 2 + (q.ma ?? 0.5);
  const d = [Math.cos(an), Math.sin(an)];
  return { hand, an, d, butt: [hand[0] - d[0] * 3.4, hand[1] - d[1] * 3.4], head: [hand[0] + d[0] * 12.5, hand[1] + d[1] * 12.5] };
}
export function mallet(ctx, a, mode, D, lw) {
  const q = a.ecQ ?? {};
  if (q.noMallet) return;
  const G = malletGeom(a, D);
  const W = LUNA.wood;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...G.butt);
  ctx.lineTo(...G.head);
  if (mode === 'line') {
    ctx.strokeStyle = tone(a, W.ink);
    ctx.lineWidth = 1.6 + lw * 2;
    ctx.stroke();
  } else {
    ctx.strokeStyle = tone(a, W.base);
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  // the head: a round barrel across the handle's end, a gold band round its middle
  ctx.translate(...G.head);
  ctx.rotate(G.an);
  const hw = 4.5;
  const hr = 3.1;
  ctx.beginPath();
  ctx.moveTo(-hr, -hw);
  ctx.lineTo(hr, -hw);
  ctx.quadraticCurveTo(hr + 1.2, 0, hr, hw);
  ctx.lineTo(-hr, hw);
  ctx.quadraticCurveTo(-hr - 1.2, 0, -hr, -hw);
  ctx.closePath();
  paint(ctx, a, mode, W.base, W.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, -1, -2, 5, W.lt, 0.8);
    ctx.fillStyle = tone(a, LUNA.gold.base);
    ctx.fillRect(-hr - 2, -0.9, hr * 2 + 4, 1.8);
    ctx.restore();
    // (the rounded ends of the barrel, paler)
    for (const s of [-1, 1]) {
      ell(ctx, 0, s * hw, hr, 1.1);
      ctx.fillStyle = tone(a, W.lt);
      ctx.fill();
    }
  }
  ctx.restore();
}
export { tubePath, sunStar, sstep };
