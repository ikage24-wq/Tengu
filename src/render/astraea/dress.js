// Astraea, the Star Keeper's cloak, clothes and star abacus (2026-11-27, drawn from scratch): what she wears
// is cut from her body's own outline or wraps her limbs (never a flat panel pasted on, never over her face
// or her arms), each piece in both of the rig's passes (mode 'line' its outline, 'fill' itself) so only her
// outer edge is outlined, in a deeper shade of its own colour.
//   cloak     a long night-sky cloak worn on her shoulders, tied at her throat with a gold star clasp and
//             two plum cords, falling behind her to the floor in a soft train: its inside a plum night sown
//             with little gold stars and the faint lines of the Little Mochi, its outside the rose-to-apricot
//             of dusk (seen as a warm band where it wraps round her back edge and turns up at the hem), a
//             thin gold edge; its hood lowered in a soft roll behind her neck. Three parts on their own
//             springs: the hood, the main fall, the train (behind her)
//   bodice    her dress, the warm peach of first light, cut from her torso's own outline: a round cream
//             collar in two soft lobes, a plum sash at her waist embroidered with gold tally marks (she
//             counts even on her clothes), its bow at the back
//   skirt     from her hips to her knees, its hem spanning wherever her knees are (so it moves with her
//             legs, never a rigid bell), a plum band at the hem with a little gold constellation along it,
//             a cream petticoat peeking below, on a soft spring
//   sleeves   full bishop sleeves along her arms, gathered into cream cuffs with a gold edge
//   legs      cream tights, plum Mary-Janes with a little gold star buckle
//   abacus    her star abacus, in her near hand: a cherry-wood frame, four brass rods, four star beads on
//             each (every bead a star she has counted), hanging from her hand by its top bar
import { TAU, mix, tone, ell, pen, glow, clamp, sstep } from './fx.js';
import { poly, chaikin, starBead } from './head.js';
import { PLUM, DUSK, PEACH, CREAM, GOLD, SHOE, WOOD, STAR } from './palette.js';

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
export function star5(ctx, x, y, r, col, ink, w) {
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
// A tiny four-point star (her embroidery, the stars in her cloak).
function twinkle(ctx, x, y, s, col) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x + s * 0.18, y - s * 0.18, x + s, y);
  ctx.quadraticCurveTo(x + s * 0.18, y + s * 0.18, x, y + s);
  ctx.quadraticCurveTo(x - s * 0.18, y + s * 0.18, x - s, y);
  ctx.quadraticCurveTo(x - s * 0.18, y - s * 0.18, x, y - s);
  ctx.fillStyle = col;
  ctx.fill();
}

// ---------- Her cloak (behind her; rig space, base px, feet at 0, facing +x) ----------
// a.asCloak: { sw (its fall's swing), tr (the train's, later), op (thrown open 0..1), hood (the hood's bob) }
function cloakGeom(a, D) {
  const C = a.asCloak ?? { sw: 0, tr: 0, op: 0, hood: 0 };
  const st = D.J.stern;
  const sF = ptOf(a, D, 'chest', [D.J.shF[0] - 1.5, D.J.shF[1] - 1.2]);
  const sN = ptOf(a, D, 'chest', [D.J.shN[0] + 0.5, D.J.shN[1] - 1.4]);
  const nb = ptOf(a, D, 'chest', [st[0] - 2, st[1] - 3.2]);
  const hip = ptOf(a, D, 'torso', D.J.hip);
  const op = clamp(C.op, 0, 1.3);
  const sw = C.sw;
  const tr = C.tr;
  // (the hem rests on the floor; sitting down, it pools there)
  const hemY = Math.min(0.4, hip[1] + 24.6);
  const lift = op * 6;
  const back = [hip[0] - 15 - op * 12 + sw * 3, hemY - 0.6 - lift * 0.8];
  const tip = [hip[0] - 22 - op * 13 + sw * 4.4 + tr * 5, hemY - 0.2 - lift * 1.4 - Math.max(0, tr) * 1.2];
  const front = [hip[0] + 6.4 + op * 4 + sw * 1.6, hemY - 0.8 - lift * 0.3];
  const midB = [mix(sF[0], back[0], 0.5) - 3.2 - op * 6 + sw * 1.4, mix(sF[1], back[1], 0.5)];
  const midF = [mix(sN[0], front[0], 0.55) + 0.6 + op * 1.6 + sw * 0.6, mix(sN[1], front[1], 0.55)];
  return { sF, sN, nb, hip, back, tip, front, midB, midF, hemY, op, sw, tr, hood: C.hood ?? 0 };
}
function cloakPts(G, grow = 0) {
  const { sF, sN, nb, back, tip, front, midB, midF } = G;
  return chaikin([
    [nb[0] - 1, nb[1] - 1.2], [sF[0] - 1 - grow, sF[1] + 0.4], [midB[0] - grow, midB[1]], [back[0] - grow * 0.6, back[1] - 2.4],
    [tip[0] - grow, tip[1] + grow * 0.4], [mix(tip[0], front[0], 0.35), Math.max(tip[1], front[1]) + 0.9 + grow * 0.6],
    [mix(tip[0], front[0], 0.75), front[1] + 0.7 + grow * 0.6], [front[0] + grow * 0.4, front[1] + grow * 0.3], [midF[0] + grow * 0.3, midF[1]],
    [sN[0] + 0.4, sN[1] + 1], [mix(sN[0], nb[0], 0.5), nb[1] - 0.6],
  ], 3);
}
// The fall and the train: the dusk outside first (a little bigger, so it shows as a warm band round the
// back edge and the hem), then the night inside over it, its stars, its gold edge.
export function cloak(ctx, a, mode, D, lw) {
  const G = cloakGeom(a, D);
  const outer = cloakPts(G, 1.5);
  const inner = cloakPts(G, 0);
  poly(ctx, outer);
  if (mode === 'line') return paint(ctx, a, mode, null, DUSK.ink, lw);
  let y0 = Infinity;
  let y1 = -Infinity;
  let x0 = Infinity;
  let x1 = -Infinity;
  for (const [x, y] of outer) {
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
  }
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, tone(a, DUSK.top));
  g.addColorStop(0.55, tone(a, DUSK.mid));
  g.addColorStop(1, tone(a, DUSK.low));
  ctx.fillStyle = g;
  ctx.fill();
  poly(ctx, inner);
  const n = ctx.createLinearGradient(0, y0, 0, y1);
  n.addColorStop(0, tone(a, PLUM.lt));
  n.addColorStop(0.3, tone(a, PLUM.base));
  n.addColorStop(1, tone(a, PLUM.deep));
  ctx.fillStyle = n;
  ctx.fill();
  ctx.save();
  poly(ctx, inner);
  ctx.clip();
  // (it falls in soft folds: deeper down the back, a light where it turns toward the light)
  glow(ctx, G.midB[0] + 2, G.midB[1] + 6, 12, PLUM.deep, 0.55);
  glow(ctx, G.midF[0] - 2, G.midF[1] - 4, 9, PLUM.lt, 0.35);
  pen(ctx, tone(a, PLUM.deep, 0.55), 0.45);
  for (const u of [0.28, 0.55]) {
    ctx.beginPath();
    const top = lerp2(G.sF, G.sN, u);
    const bot = lerp2(G.tip, G.front, u);
    ctx.moveTo(top[0], top[1] + 3);
    ctx.quadraticCurveTo(mix(top[0], bot[0], 0.5) - 2 + G.sw * 1.2, mix(top[1], bot[1], 0.5), bot[0], bot[1] - 1);
    ctx.stroke();
  }
  // (the night sky inside it: little gold stars sown across, and the faint lines of the Little Mochi;
  // placed from its hem and its shoulders, so they ride with it)
  const at = (u, v) => {
    const top = lerp2(G.sF, G.sN, u);
    const bot = lerp2(G.tip, G.front, u);
    return lerp2(top, bot, v);
  };
  const t = a.t ?? 0;
  const SOWN = [[0.12, 0.62], [0.3, 0.78], [0.18, 0.4], [0.46, 0.9], [0.62, 0.66], [0.38, 0.55], [0.08, 0.86], [0.52, 0.32], [0.24, 0.94], [0.7, 0.84]];
  SOWN.forEach(([u, v], i) => {
    const p = at(u, v);
    const tw = 0.6 + 0.4 * Math.sin(t * 1.7 + i * 2.3);
    twinkle(ctx, p[0], p[1], (i % 3 ? 0.55 : 0.85) * (0.85 + tw * 0.25), tone(a, i % 2 ? GOLD.lt : STAR.base, 0.55 + 0.4 * tw));
  });
  const MOCHI = [[0.3, 0.5], [0.45, 0.62], [0.42, 0.8], [0.18, 0.8], [0.15, 0.62]];
  pen(ctx, tone(a, GOLD.lt, 0.32), 0.25);
  ctx.beginPath();
  MOCHI.forEach(([u, v], i) => (i ? ctx.lineTo(...at(u, v)) : ctx.moveTo(...at(u, v))));
  ctx.closePath();
  ctx.stroke();
  for (const [u, v] of MOCHI) {
    const p = at(u, v);
    ell(ctx, p[0], p[1], 0.35, 0.35);
    ctx.fillStyle = tone(a, GOLD.lt, 0.8);
    ctx.fill();
  }
  ctx.restore();
  // its thin gold edge
  pen(ctx, tone(a, GOLD.sh, 0.9), 0.4);
  poly(ctx, inner);
  ctx.stroke();
}
// The hood, lowered: a soft roll round the back of her neck, the dusk outside, the night just showing in
// its opening; it bobs a little on its own.
export function hood(ctx, a, mode, D, lw) {
  const G = cloakGeom(a, D);
  const h = G.hood;
  const c = lerp2(G.sF, G.nb, 0.5);
  const pts = chaikin([
    [G.sF[0] - 1.2, G.sF[1] + 1.2], [G.sF[0] - 2.6, G.sF[1] - 2.2 + h * 0.4], [c[0] - 2, G.nb[1] - 5.6 + h], [G.nb[0] + 1.4, G.nb[1] - 6.2 + h],
    [G.nb[0] + 4.6, G.nb[1] - 4 + h * 0.6], [G.sN[0] - 1, G.sN[1] - 0.8], [G.sN[0] - 2, G.sN[1] + 1.4], [G.nb[0], G.nb[1] + 1.2],
  ], 2);
  poly(ctx, pts);
  paint(ctx, a, mode, DUSK.top, DUSK.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    glow(ctx, c[0] + 1, G.nb[1] - 5, 5, '#ffd8c8', 0.6);
    glow(ctx, G.sF[0], G.sF[1], 4, DUSK.ink, 0.35);
    // (its opening, the night inside just showing)
    ell(ctx, G.nb[0] + 0.6, G.nb[1] - 1.2, 3.6, 1.8, -0.1);
    ctx.fillStyle = tone(a, PLUM.deep);
    ctx.fill();
    ctx.restore();
    pen(ctx, tone(a, GOLD.sh, 0.85), 0.35);
    ctx.beginPath();
    ctx.moveTo(G.sF[0] - 2.2, G.sF[1] - 1.6 + h * 0.4);
    ctx.quadraticCurveTo(c[0] - 1, G.nb[1] - 5.2 + h, G.nb[0] + 4.2, G.nb[1] - 3.8 + h * 0.6);
    ctx.stroke();
  }
}
// The clasp at her throat: a gold star, two plum cords running back over her shoulders to the cloak.
export function clasp(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const cx = st[0] + 1;
  const cy = st[1] + 0.6;
  for (const [sx, k] of [[D.J.shF[0] + 1.5, -1], [D.J.shN[0] - 1.6, 1]]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 0.9);
    ctx.quadraticCurveTo((cx + sx) / 2, cy - 2.6, sx, st[1] - 1.2 + (k < 0 ? 0.4 : 0));
    ctx.lineTo(sx + k * 0.2, st[1] + 0.5);
    ctx.quadraticCurveTo((cx + sx) / 2, cy - 0.8, cx, cy + 0.9);
    ctx.closePath();
    paint(ctx, a, mode, PLUM.base, PLUM.ink, lw / D.SC);
  }
  if (mode === 'fill') {
    glow(ctx, cx, cy, 4.4, STAR.glow, 0.45);
    star5(ctx, cx, cy, 3, tone(a, GOLD.base), tone(a, GOLD.ink), 0.5);
    ell(ctx, cx - 0.6, cy - 0.9, 0.7, 0.5);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
  } else {
    star5(ctx, cx, cy, 3, 'rgba(0,0,0,0)', tone(a, GOLD.ink), lw / D.SC);
  }
  ctx.restore();
}

// ---------- Her dress (cut from her torso's own outline) ----------
export function bodice(ctx, a, D) {
  const T = a.blTorsoPts;
  if (!T) return;
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  ctx.fillStyle = tone(a, PEACH.base);
  ctx.fillRect(-200, -200, 400, 400);
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const rb = D.J.ribs;
  const cx = st[0] + 1;
  glow(ctx, cx + 6, st[1] + 8, 11, PEACH.lt, 0.7);
  glow(ctx, cx - 12, rb[1] + 4, 11, PEACH.sh, 0.7);
  // (soft gathers down from the collar)
  pen(ctx, tone(a, PEACH.sh, 0.8), 0.5);
  for (const dx of [-3.4, 3.8]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx, st[1] + 4);
    ctx.quadraticCurveTo(cx + dx * 1.15, (st[1] + rb[1]) / 2 + 2, cx + dx * 0.9, rb[1] + 4);
    ctx.stroke();
  }
  // the round cream collar: two soft lobes meeting under the clasp
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx, st[1] - 0.6);
    ctx.quadraticCurveTo(cx + s * 6.6, st[1] - 2.4, cx + s * 8.6, st[1] + 0.6);
    ctx.quadraticCurveTo(cx + s * 8.2, st[1] + 4.6, cx + s * 3.6, st[1] + 4.2);
    ctx.quadraticCurveTo(cx + s * 0.8, st[1] + 3.6, cx, st[1] + 1.4);
    ctx.closePath();
    ctx.fillStyle = tone(a, CREAM.base);
    ctx.fill();
    pen(ctx, tone(a, CREAM.deep), 0.5);
    ctx.stroke();
    glow(ctx, cx + s * 4.6, st[1] + 2.6, 2.6, CREAM.sh, 0.6);
  }
  ctx.restore();
  // the plum sash at her waist with gold tally marks stitched along it (in the waist's frame)
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  enter(ctx, a, D, 'waistB');
  const nv = D.J.navel;
  ctx.beginPath();
  ctx.moveTo(nv[0] - 40, nv[1] - 3.2);
  ctx.quadraticCurveTo(nv[0], nv[1] - 1.8, nv[0] + 40, nv[1] - 3.2);
  ctx.lineTo(nv[0] + 40, nv[1] + 2.2);
  ctx.quadraticCurveTo(nv[0], nv[1] + 3.6, nv[0] - 40, nv[1] + 2.2);
  ctx.closePath();
  ctx.fillStyle = tone(a, PLUM.base);
  ctx.fill();
  glow(ctx, nv[0] + 4, nv[1] - 1, 7, PLUM.lt, 0.45);
  pen(ctx, tone(a, GOLD.base, 0.95), 0.42);
  // (tally marks: four strokes and a fifth across, twice over)
  for (const ox of [-7.6, 0.6]) {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(nv[0] + ox + i * 1.3, nv[1] - 1.5);
      ctx.lineTo(nv[0] + ox + i * 1.3 + 0.2, nv[1] + 1.3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(nv[0] + ox - 0.6, nv[1] + 0.9);
    ctx.lineTo(nv[0] + ox + 4.6, nv[1] - 1.1);
    ctx.stroke();
  }
  ctx.restore();
}
// The sash's bow, at the small of her back (peeking out behind her far side).
export function sashBow(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'waistB');
  const nv = D.J.navel;
  const bx = nv[0] - 9.6;
  const by = nv[1] - 0.6;
  const sw = (a.asCloak?.sw ?? 0) * 0.6;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx - 3 + s * 0.6, by + s * 5.4 - 1, bx - 6.2, by + s * 3.2);
    ctx.quadraticCurveTo(bx - 5.2, by + s * 0.6, bx, by);
    ctx.closePath();
    paint(ctx, a, mode, PLUM.base, PLUM.ink, lw / D.SC);
  }
  for (const s of [0, 1]) {
    ctx.beginPath();
    ctx.moveTo(bx - 0.6, by + 1);
    ctx.quadraticCurveTo(bx - 2 + sw * 4, by + 6 + s * 2, bx - 1 - s * 2.4 + sw * 6, by + 11 + s * 1.6);
    ctx.lineTo(bx + 1 - s * 2.4 + sw * 6, by + 10.6 + s * 1.6);
    ctx.quadraticCurveTo(bx + sw * 4, by + 6, bx + 0.6, by + 1);
    ctx.closePath();
    paint(ctx, a, mode, PLUM.sh, PLUM.ink, lw / D.SC);
  }
  ell(ctx, bx, by, 1.6, 1.8);
  paint(ctx, a, mode, PLUM.lt, PLUM.ink, lw / D.SC);
  ctx.restore();
}

// ---------- Her skirt ----------
// From her hips to her knees; its hem spans her knees (plus a flare), so it moves with her legs. Rig space.
function skirtPts(a, D) {
  const hip = D.J.hip;
  const S = a.asSkirt ?? 0;
  const hl = ptOf(a, D, 'torso', [hip[0] - 12.4, hip[1] - 5]);
  const hr = ptOf(a, D, 'torso', [hip[0] + 12.4, hip[1] - 5]);
  const hm = ptOf(a, D, 'torso', [hip[0], hip[1] - 6]);
  const kN = orig(a, 'shinN');
  const kF = orig(a, 'shinF');
  const back = Math.min(kN[0], kF[0], hl[0]) - 3.4 + S * 2;
  const front = Math.max(kN[0], kF[0], hr[0]) + 3.2 + S * 2;
  const hemY = Math.max(kN[1], kF[1]) + 0.4;
  const mid = (back + front) / 2;
  // (an A-line: straight from the hips out to the hem, never ballooning between)
  return chaikin([hl, hm, hr, [mix(hr[0], front, 0.45), mix(hr[1], hemY, 0.45)], [mix(hr[0], front, 0.9), mix(hr[1], hemY, 0.9)], [front, hemY - 0.6], [mid + S * 1.2, hemY + 1.2], [back, hemY - 0.6], [mix(hl[0], back, 0.9), mix(hl[1], hemY, 0.9)], [mix(hl[0], back, 0.45), mix(hl[1], hemY, 0.45)]], 2);
}
export function skirt(ctx, a, mode, D, lw) {
  const pts = skirtPts(a, D);
  // (the cream petticoat peeking below the hem)
  const under = pts.map(([x, y]) => [x, y + 1.5]);
  poly(ctx, under);
  paint(ctx, a, mode, CREAM.base, CREAM.ink, lw);
  poly(ctx, pts);
  if (mode === 'line') return paint(ctx, a, mode, null, PEACH.ink, lw);
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
  g.addColorStop(0, tone(a, PEACH.sh));
  g.addColorStop(0.3, tone(a, PEACH.base));
  g.addColorStop(1, tone(a, PEACH.sh));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  poly(ctx, pts);
  ctx.clip();
  glow(ctx, xmin + (xmax - xmin) * 0.64, ymin + (ymax - ymin) * 0.4, (xmax - xmin) * 0.4, PEACH.lt, 0.6);
  glow(ctx, xmin + 2, ymax - 3, (xmax - xmin) * 0.35, PEACH.deep, 0.45);
  // (soft folds falling from the hips toward the hem)
  pen(ctx, tone(a, PEACH.deep, 0.5), 0.45);
  for (const u of [0.3, 0.56, 0.8]) {
    ctx.beginPath();
    ctx.moveTo(xmin + (xmax - xmin) * (0.35 + u * 0.3), ymin + 2);
    ctx.quadraticCurveTo(xmin + (xmax - xmin) * (0.25 + u * 0.5), ymin + (ymax - ymin) * 0.6, xmin + (xmax - xmin) * u, ymax);
    ctx.stroke();
  }
  // (the plum band at the hem, a little gold constellation along it)
  ctx.beginPath();
  ctx.moveTo(xmin - 2, ymax - 3.3);
  for (let i = 0; i <= 10; i++) ctx.lineTo(xmin + (xmax - xmin) * (i / 10), ymax - 3.3 + Math.sin(Math.PI * (i / 10)) * 0.6);
  ctx.lineTo(xmax + 2, ymax + 3);
  ctx.lineTo(xmin - 2, ymax + 3);
  ctx.closePath();
  ctx.fillStyle = tone(a, PLUM.base);
  ctx.fill();
  const P = [0.14, 0.3, 0.47, 0.63, 0.8].map((u, i) => [xmin + (xmax - xmin) * u, ymax - 1.4 + (i % 2 ? -0.6 : 0.3)]);
  pen(ctx, tone(a, GOLD.lt, 0.7), 0.22);
  ctx.beginPath();
  P.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.stroke();
  for (const p of P) twinkle(ctx, p[0], p[1], 0.7, tone(a, GOLD.base));
  ctx.restore();
}

// ---------- Her sleeves: full bishop sleeves, gathered into cream cuffs ----------
export function sleeve(ctx, a, mode, D, k, lw) {
  const near = k === 'N';
  const sh = orig(a, `arm${k}u`);
  const el = orig(a, `arm${k}f`);
  const wr = orig(a, `hand${k}`);
  const A = D.spec?.arm ?? { aw0: 5, ew: 4.4, aw1: 3.8 };
  const pts = [sh, lerp2(sh, el, 0.5), el, lerp2(el, wr, 0.45), lerp2(el, wr, 0.8)];
  const W = [A.aw0 * 1.5, A.aw0 * 1.4, A.ew * 1.62, A.ew * 1.85, A.aw1 * 1.95].map((v) => v * D.SC);
  tubePath(ctx, pts, W);
  paint(ctx, a, mode, near ? PEACH.base : PEACH.sh, PEACH.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    glow(ctx, ...lerp2(sh, el, 0.3), W[0] * 0.9, near ? PEACH.lt : PEACH.base, 0.6);
    glow(ctx, ...lerp2(el, wr, 0.6), W[3] * 0.8, PEACH.deep, 0.35);
    // (the fullness gathering toward the cuff)
    const an = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
    pen(ctx, tone(a, PEACH.deep, 0.5), 0.35);
    for (const s of [-0.5, 0.3]) {
      const p0 = lerp2(el, wr, 0.25);
      const p1 = lerp2(el, wr, 0.76);
      ctx.beginPath();
      ctx.moveTo(p0[0] - Math.sin(an) * s * 1.6, p0[1] + Math.cos(an) * s * 1.6);
      ctx.lineTo(p1[0] - Math.sin(an) * s * 0.8, p1[1] + Math.cos(an) * s * 0.8);
      ctx.stroke();
    }
    ctx.restore();
  }
  // the cuff: a cream band round the wrist, a gold edge
  const an = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
  const c = lerp2(el, wr, 0.86);
  ctx.save();
  ctx.translate(c[0], c[1]);
  ctx.rotate(an);
  const r = A.aw1 * D.SC * 0.95;
  ctx.beginPath();
  ctx.ellipse(0, 0, 0.9, r, 0, 0, TAU);
  paint(ctx, a, mode, near ? CREAM.base : CREAM.sh, CREAM.ink, lw);
  if (mode === 'fill') {
    pen(ctx, tone(a, GOLD.sh), 0.3);
    ctx.beginPath();
    ctx.moveTo(0.7, -r * 0.92);
    ctx.lineTo(0.7, r * 0.92);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Tights and shoes ----------
export function stocking(ctx, a, mode, D, k, lw) {
  const hip = orig(a, `thigh${k}`);
  const knee = orig(a, `shin${k}`);
  const ank = orig(a, `foot${k}`);
  const Lg = D.spec?.leg ?? { tw: 8.5, kw: 5.9, anw: 4.2 };
  const pts = [lerp2(hip, knee, 0.1), lerp2(hip, knee, 0.55), knee, lerp2(knee, ank, 0.35), ank];
  const W = [Lg.tw * 1.02, Lg.tw * 0.92, Lg.kw * 1.06, Lg.kw * 1.08, Lg.anw * 1.08].map((v) => v * D.SC);
  tubePath(ctx, pts, W);
  const far = k === 'F';
  paint(ctx, a, mode, far ? CREAM.sh : CREAM.base, CREAM.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    glow(ctx, ...lerp2(knee, ank, 0.5), Lg.kw * D.SC * 1.2, far ? CREAM.deep : CREAM.sh, 0.4);
    pen(ctx, tone(a, '#ffffff', far ? 0.3 : 0.7), 0.8);
    ctx.beginPath();
    ctx.moveTo(...lerp2(knee, ank, 0.05).map((v, i) => v + (i ? 0 : 0.7)));
    ctx.lineTo(...lerp2(knee, ank, 0.85).map((v, i) => v + (i ? 0 : 0.5)));
    ctx.stroke();
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
  // (a Mary-Jane: low at the instep, a round toe)
  const s = D.SC;
  const pts = chaikin([[-hl, -Lg.ftop * 0.6], [Lg.anw * 0.2, -Lg.ftop * 0.4], [to * 0.6, Lg.fbot * 0.28], [to * 1.02, Lg.fbot * 0.62], [to * 0.94, Lg.fbot + 0.25], [-hl, Lg.fbot + 0.25], [-hl * 1.1, Lg.fbot * 0.4]], 2).map(([x, y]) => [x * s, y * s]);
  poly(ctx, pts);
  paint(ctx, a, mode, far ? SHOE.sh : SHOE.base, SHOE.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    glow(ctx, to * 0.55 * s, Lg.fbot * 0.3 * s, 2.4 * s, SHOE.lt, 0.8);
    ctx.fillStyle = tone(a, SHOE.ink);
    ctx.fillRect(-hl * 1.3 * s, (Lg.fbot - 0.5) * s, (hl + to) * 1.4 * s, s);
    ctx.restore();
    // the strap over the instep, a little gold star buckle
    pen(ctx, tone(a, far ? SHOE.sh : SHOE.base), 0.75 * s);
    ctx.beginPath();
    ctx.moveTo(-Lg.anw * 0.3 * s, -Lg.ftop * 1.4 * s);
    ctx.quadraticCurveTo(Lg.anw * 0.4 * s, -Lg.ftop * 1.6 * s, to * 0.5 * s, Lg.fbot * 0.2 * s);
    ctx.stroke();
    star5(ctx, to * 0.45 * s, Lg.fbot * 0.12 * s, 1.2 * s, tone(a, GOLD.base), null);
  }
  ctx.restore();
}

// ---------- Her star abacus ----------
// It hangs from her near hand by the middle of its top bar, turned by a.asAb.rot (0 hanging straight
// down); a.asBeads: how many beads are pushed over on each of its four rods (fractions slide), a.asAb.lit
// how much they glow. Rig space; also drawn loose (the effects) through drawAbacus.
export const AB = { w: 11.4, h: 8.6, bar: 1.3, s: 0.72 };
export function abacusGeom(a, D) {
  const A = a.asAb ?? { rot: 0, lit: 0 };
  const hand = ptOf(a, D, 'handN', D.J.handN);
  return { x: hand[0], y: hand[1] + 0.4, rot: A.rot ?? 0, lit: A.lit ?? 0, s: (A.s ?? 1) * AB.s };
}
export function abacus(ctx, a, mode, D, lw) {
  if (a.asQ?.noAb) return;
  const G = abacusGeom(a, D);
  drawAbacus(ctx, a, mode, G.x, G.y, G.rot, a.asBeads, G.lit, G.s, lw);
}
// The abacus at (x, y) (the middle of its top bar), hanging down the way `rot` turns it.
export function drawAbacus(ctx, a, mode, x, y, rot, beads, lit, s, lw) {
  const { w, h, bar } = AB;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  const L = -w / 2;
  const R = w / 2;
  const T = -bar * 0.4;
  const B = h;
  // the frame: rounded cherry wood, its top bar a touch arched
  ctx.beginPath();
  ctx.moveTo(L + 1.4, T - 0.4);
  ctx.quadraticCurveTo(0, T - 1.4, R - 1.4, T - 0.4);
  ctx.quadraticCurveTo(R + 0.2, T - 0.2, R, T + 1.4);
  ctx.lineTo(R, B - 1);
  ctx.quadraticCurveTo(R, B + 0.6, R - 1.4, B + 0.6);
  ctx.lineTo(L + 1.4, B + 0.6);
  ctx.quadraticCurveTo(L, B + 0.6, L, B - 1);
  ctx.lineTo(L, T + 1.4);
  ctx.quadraticCurveTo(L - 0.2, T - 0.2, L + 1.4, T - 0.4);
  ctx.closePath();
  // (its window: the inside of the frame)
  ctx.moveTo(L + bar, T + bar);
  ctx.lineTo(L + bar, B - bar + 0.6);
  ctx.lineTo(R - bar, B - bar + 0.6);
  ctx.lineTo(R - bar, T + bar);
  ctx.closePath();
  if (mode === 'line') {
    pen(ctx, tone(a, WOOD.ink), lw / s);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, WOOD.base);
    ctx.fill('evenodd');
    ctx.save();
    ctx.clip('evenodd');
    glow(ctx, L + 2, T, 5, WOOD.lt, 0.8);
    glow(ctx, R, B, 5, WOOD.deep, 0.5);
    ctx.restore();
    // (little gold stars at the top corners, a gold star finial on the top bar)
    star5(ctx, L + 0.75, T + 0.4, 0.7, tone(a, GOLD.base), null);
    star5(ctx, R - 0.75, T + 0.4, 0.7, tone(a, GOLD.base), null);
  }
  // the rods and their beads
  const n = 4;
  for (let r = 0; r < n; r++) {
    const ry = T + bar + 0.95 + r * ((B - T - bar * 2 + 0.6 - 1.9) / (n - 1));
    if (mode === 'fill') {
      pen(ctx, tone(a, GOLD.sh), 0.32);
      ctx.beginPath();
      ctx.moveTo(L + bar - 0.2, ry);
      ctx.lineTo(R - bar + 0.2, ry);
      ctx.stroke();
    }
    const k = clamp(beads?.[r] ?? 1, 0, 4);
    const br = 0.72;
    const step = br * 2.05;
    for (let b = 0; b < 4; b++) {
      // (pushed over: packed at the right; not yet: packed at the left; one sliding between)
      const u = clamp(k - (3 - b), 0, 1);
      const leftX = L + bar + br + b * step;
      const rightX = R - bar - br - (3 - b) * step;
      const bx = mix(leftX, rightX, sstep(u));
      starBead(ctx, a, mode, bx, ry, br, lw / s, lit);
    }
  }
  ctx.restore();
}
export { tubePath, twinkle, cloakGeom, lerp2 };
