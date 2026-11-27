// The Cup-Noodle Dragon's cup, noodles, happi coat and chopsticks (remade 2026-11-27, drawn from scratch):
// what he wears is cut from his body's own outline or wraps his arms (never a flat panel pasted on, never over
// his face or his arms), each piece in both of the rig's passes (mode 'line' its outline, 'fill' itself) so
// only his outer edge is outlined, in a deeper shade of its own colour.
//   cup       his big cup of noodles, standing on the floor: he rises out of it from the waist, his serpent's
//             lower body down in the broth. White, a cherry-red band with gold lines and a kamaboko badge,
//             a rounded rim; it rocks with him (the base's `lower` bone). Drawn in two halves: its back wall,
//             rim and broth behind him, its front and the near half of the broth in front of him; noodles
//             looping over its front rim, swinging on a spring (a.ndCup.spill)
//   tail      his noodle dragon's tail: a rope of wavy golden strands that comes up out of the broth, arches
//             over the back rim and curls away behind him in the air in a soft S, a little dragon fin at its
//             tip, every joint on its own spring (2026-11-27; it lay in a stiff L along the floor before)
//   lid       the peeled foil lid, still stuck at the back rim, hanging back down behind the cup, round with its tab,
//             swaying on its spring (a.ndCup.lid), hauled up behind his head for the Lid Flip
//   happi     his ramen-shop happi coat: indigo, cut from his torso's outline, a white collar band down the
//             front, white waves along the hem, a cherry obi tied at his waist with its knot at the side
//   sleeves   the happi's wide square sleeves along his arms to the forearm, a white stripe at the cuff
//   sticks    his red lacquered chopsticks in his near hand (a.ndSticks: { rot, open })
import { TAU, mix, tone, ell, pen, glow, clamp, sstep } from './fx.js';
import { poly, chaikin } from './head.js';
import { NOOD, BROTH, CUP, FOIL, HAPPI, OBI, STICK, KAMA, FIN } from './palette.js';
import { G } from '../mobs/kidbase.js';

// ---------- The kit ----------
export function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone] ?? 'serp0'];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
export const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
// (a point in a bone's frame, its pivot joint named: for the base's lower body and tail, which the dress kit's
// pivot table doesn't list)
export const ptAt = (a, D, bone, piv, p) => {
  const M = a.blMat(bone);
  const lx = (p[0] - D.J[piv][0]) * D.SC;
  const ly = (p[1] - D.J[piv][1]) * D.SC;
  return [M[0] * lx + M[2] * ly + M[4], M[1] * lx + M[3] * ly + M[5]];
};
function enterLower(ctx, a, D) {
  ctx.transform(...a.blMat('lower'));
  ctx.scale(D.SC, D.SC);
  ctx.translate(-D.J.serp0[0], -D.J.serp0[1]);
}
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
// A smooth path through points (Catmull-Rom), as one stroke.
function curveThrough(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
}

// ---------- The cup (in the base's lower body's frame: kid units, the ground at G) ----------
export function cupGeom(D) {
  const cx = D.J.hip[0] + 0.6;
  const rimY = D.J.hip[1] - 3.2;
  return { cx, rimY, rw: 15.6, rh: 3.8, bw: 12, bot: G - 0.2 };
}
function cupBody(G0) {
  const { cx, rimY, rw, bw, bot } = G0;
  return chaikin([[cx - rw, rimY], [cx + rw, rimY], [cx + bw + 0.6, bot - 3], [cx + bw - 1.4, bot], [cx - bw + 1.4, bot], [cx - bw - 0.6, bot - 3]], 2);
}
// Behind him: the cup's back wall seen inside its rim, the broth, the back of the rim.
export function cupBack(ctx, a, mode, D, lw) {
  const C = cupGeom(D);
  ctx.save();
  enterLower(ctx, a, D);
  const w = lw / D.SC;
  // the whole cup's body behind him (its front is drawn again in front, so only its edges show here)
  poly(ctx, cupBody(C));
  paint(ctx, a, mode, CUP.sh, CUP.ink, w);
  ell(ctx, C.cx, C.rimY, C.rw, C.rh);
  paint(ctx, a, mode, CUP.sh, CUP.ink, w);
  if (mode === 'fill') {
    // the broth inside, glossy amber, a soft light on it
    ell(ctx, C.cx, C.rimY + 0.4, C.rw - 1.1, C.rh - 0.8);
    const g = ctx.createLinearGradient(0, C.rimY - C.rh, 0, C.rimY + C.rh);
    g.addColorStop(0, tone(a, BROTH.sh));
    g.addColorStop(1, tone(a, BROTH.base));
    ctx.fillStyle = g;
    ctx.fill();
    glow(ctx, C.cx + 5, C.rimY, 4, BROTH.lt, 0.8);
  }
  ctx.restore();
}
// In front of him: the near half of the broth over his waist, the cup's front wall and its print, the
// noodles looping over the front rim.
export function cupFront(ctx, a, mode, D, lw) {
  const C = cupGeom(D);
  const sp = a.ndCup?.spill ?? 0;
  ctx.save();
  enterLower(ctx, a, D);
  const w = lw / D.SC;
  const body = cupBody(C);
  poly(ctx, body);
  paint(ctx, a, mode, CUP.base, CUP.ink, w);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, body);
    ctx.clip();
    const g = ctx.createLinearGradient(C.cx - C.rw, 0, C.cx + C.rw, 0);
    g.addColorStop(0, tone(a, CUP.sh));
    g.addColorStop(0.35, tone(a, CUP.lt));
    g.addColorStop(0.8, tone(a, CUP.base));
    g.addColorStop(1, tone(a, CUP.deep));
    ctx.fillStyle = g;
    ctx.fillRect(C.cx - C.rw - 2, C.rimY - 4, C.rw * 2 + 4, C.bot - C.rimY + 6);
    // the cherry band round its middle, gold lines above and below it
    const by0 = mix(C.rimY, C.bot, 0.36);
    const by1 = mix(C.rimY, C.bot, 0.7);
    const rg = ctx.createLinearGradient(C.cx - C.rw, 0, C.cx + C.rw, 0);
    rg.addColorStop(0, tone(a, CUP.redSh));
    rg.addColorStop(0.35, tone(a, CUP.redLt));
    rg.addColorStop(1, tone(a, CUP.red));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(C.cx - 30, by0 + 1.2);
    ctx.quadraticCurveTo(C.cx, by0 + 3.2, C.cx + 30, by0 + 1.2);
    ctx.lineTo(C.cx + 30, by1 + 1.2);
    ctx.quadraticCurveTo(C.cx, by1 + 3.2, C.cx - 30, by1 + 1.2);
    ctx.closePath();
    ctx.fill();
    pen(ctx, tone(a, CUP.gold), 0.7);
    for (const yy of [by0 - 0.6, by1 + 2.6]) {
      ctx.beginPath();
      ctx.moveTo(C.cx - 30, yy + 1.2);
      ctx.quadraticCurveTo(C.cx, yy + 3.2, C.cx + 30, yy + 1.2);
      ctx.stroke();
    }
    // (the kamaboko badge on the band: a white wheel, a pink swirl)
    const kx = C.cx + 3;
    const ky = (by0 + by1) / 2 + 1.6;
    ell(ctx, kx, ky, 4.4, 4.2);
    ctx.fillStyle = tone(a, KAMA.base);
    ctx.fill();
    pen(ctx, tone(a, KAMA.ink), 0.4);
    ctx.stroke();
    pen(ctx, tone(a, KAMA.swirl), 0.7);
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const an = (i / 20) * TAU * 1.6;
      const r = 0.3 + (i / 20) * 3;
      if (i) ctx.lineTo(kx + Math.cos(an) * r, ky + Math.sin(an) * r);
      else ctx.moveTo(kx + Math.cos(an) * r, ky + Math.sin(an) * r);
    }
    ctx.stroke();
    // (soft round dots of steam printed round the top: a pattern, not eyes)
    pen(ctx, tone(a, CUP.red, 0.55), 0.55);
    for (let i = 0; i < 3; i++) {
      const sx = C.cx - 8 + i * 7;
      ctx.beginPath();
      ctx.moveTo(sx, by0 - 3);
      ctx.quadraticCurveTo(sx + 1.2, by0 - 5, sx, by0 - 7);
      ctx.stroke();
    }
    glow(ctx, C.cx - C.rw * 0.4, mix(C.rimY, C.bot, 0.5), 7, '#ffffff', 0.4);
    ctx.restore();
  }
  // the rim's front lip, rounded
  ctx.beginPath();
  ctx.ellipse(C.cx, C.rimY, C.rw, C.rh, 0, 0, Math.PI);
  ctx.ellipse(C.cx, C.rimY + 0.2, C.rw - 1.2, C.rh - 0.9, 0, Math.PI, 0, true);
  ctx.closePath();
  paint(ctx, a, mode, CUP.lt, CUP.ink, w);
  // the near half of the broth, over his waist
  if (mode === 'fill') {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(C.cx, C.rimY + 0.4, C.rw - 1.1, C.rh - 0.8, 0, 0.05, Math.PI - 0.05);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, C.rimY, 0, C.rimY + C.rh);
    g.addColorStop(0, tone(a, BROTH.base));
    g.addColorStop(1, tone(a, BROTH.sh));
    ctx.fillStyle = g;
    ctx.fill();
    glow(ctx, C.cx + 6, C.rimY + 1.2, 3, BROTH.lt, 0.7);
    ctx.restore();
  }
  // noodles looping over the front rim, swinging
  for (let i = 0; i < 3; i++) {
    const x0 = C.cx - 9 + i * 7.6;
    const len = [7.4, 10.4, 6.2][i] + sp * (i % 2 ? 1.2 : 0.8);
    const sw = sp * (2 + i);
    const pts = [[x0 - 1, C.rimY + 1], [x0 + 0.6 + sw * 0.2, C.rimY + len * 0.5], [x0 + 2.2 + sw * 0.5, C.rimY + len], [x0 + 3.6 + sw * 0.3, C.rimY + len * 0.5], [x0 + 3.2, C.rimY + 1]];
    noodleLoop(ctx, a, mode, pts, w);
  }
  ctx.restore();
}
// One noodle: a soft golden ribbon through points, a light along it, a gentle wave.
function noodleLoop(ctx, a, mode, pts, w) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  curveThrough(ctx, pts);
  if (mode === 'line') {
    pen(ctx, tone(a, NOOD.ink), 1.5 + w * 2);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, NOOD.base), 1.5);
    ctx.stroke();
    pen(ctx, tone(a, NOOD.lt, 0.8), 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- His noodle tail (rig space) ----------
// (2026-11-27, the player: the noodles hung in a stiff L to the floor and never moved, and nothing read as
// a dragon.) A noodle dragon's tail: a rope of wavy golden strands up out of the broth, arched over the back
// rim, then curling away behind him in the air in a soft S, its tip turned up with a little dragon fin.
// Every joint rides its own spring (a.ndTail: each segment's turn, in degrees, from the dress's pose: a wave
// running down it to the tip, swung on by his hops, his turns and the Noodle Lash), so it sways, wiggles and
// settles late; drawn in the cup's own frame, so it rocks with the cup.
export const TAIL_L = [7, 7, 6.6, 6, 5.4, 4.6];
export const TAIL_REST = [150, 110, 140, 195, 245, 285];
export function tailPts(a, D) {
  const C = cupGeom(D);
  const P = (p) => ptAt(a, D, 'lower', 'serp0', p);
  const ang = a.ndTail ?? TAIL_REST;
  const local = [[C.cx - C.rw + 4, C.rimY - 0.4], [C.cx - C.rw - 3, C.rimY - 8.6]];
  for (let i = 0; i < TAIL_L.length; i++) {
    const [x, y] = local[local.length - 1];
    const r = (ang[i] * Math.PI) / 180;
    // (never below the cup's foot: a low curl rests on the floor's air, never through it)
    local.push([x + Math.cos(r) * TAIL_L[i], Math.min(C.bot - 3.2, y + Math.sin(r) * TAIL_L[i])]);
  }
  return local.map(P);
}
export function noodleTail(ctx, a, mode, D, lw) {
  const t = a.t ?? 0;
  const spine = tailPts(a, D);
  const W = [5.6, 5.8, 5.4, 5, 4.4, 3.7, 3, 2.4].map((v) => v * D.SC);
  // the fin at its tip: a soft fan of three round lobes, pale gold, along the last segment
  const n = spine.length;
  const tip = spine[n - 1];
  const prev = spine[n - 2];
  const fa = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
  ctx.save();
  ctx.translate(...tip);
  ctx.rotate(fa);
  ctx.scale(D.SC, D.SC);
  const fin = chaikin([[-2.4, -1.4], [1, -4.6], [3.8, -3.6], [5.4, -5], [7.6, -2.4], [6.4, 0], [7.6, 2.4], [5.4, 5], [3.8, 3.6], [1, 4.6], [-2.4, 1.4]], 3);
  poly(ctx, fin);
  if (mode === 'line') {
    pen(ctx, tone(a, FIN.ink), lw / D.SC);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, FIN.base);
    ctx.fill();
    ctx.save();
    poly(ctx, fin);
    ctx.clip();
    glow(ctx, 3, -1.6, 4, FIN.lt, 0.9);
    pen(ctx, tone(a, FIN.sh, 0.8), 0.4);
    for (const y1 of [-3.8, 0, 3.8]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(3, y1 * 0.5, 6.4, y1);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  // (the rope's body: a soft deep-gold tube so the strands read as one tail)
  tubePath(ctx, spine, W);
  if (mode === 'line') {
    pen(ctx, tone(a, NOOD.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, NOOD.sh);
    ctx.fill();
    // the strands along it, each its own wave
    const N = 5;
    for (let k = 0; k < N; k++) {
      const off = (k / (N - 1) - 0.5) * 0.7;
      const pts = spine.map((p, i) => {
        const q = spine[Math.min(spine.length - 1, i + 1)];
        const r = spine[Math.max(0, i - 1)];
        const an = Math.atan2(q[1] - r[1], q[0] - r[0]);
        const wv = Math.sin(t * 3 + i * 1.4 + k * 2.1) * 0.35 * W[i];
        const d = off * W[i] + wv * 0.5;
        return [p[0] - Math.sin(an) * d, p[1] + Math.cos(an) * d];
      });
      ctx.save();
      ctx.lineCap = 'round';
      curveThrough(ctx, pts);
      pen(ctx, tone(a, k % 2 ? NOOD.base : NOOD.lt), 1.1 * D.SC);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ---------- The foil lid (behind him, at the back rim) ----------
// a.ndCup.lid: its sway (rad); a.ndCup.flip: 0 standing up behind him .. 1 flipped over ahead (Lid Flip).
export function lid(ctx, a, mode, D, lw) {
  const C = cupGeom(D);
  const L = a.ndCup ?? {};
  const flip = clamp(L.flip ?? 0, -0.6, 1);
  ctx.save();
  enterLower(ctx, a, D);
  const w = lw / D.SC;
  // (2026-11-27: peeled right back and hanging down behind the cup, out of sight, round like a real lid with
  // its pull tab, so it never reads as a wing at his shoulder; the Lid Flip hauls it up behind him by its
  // old hinge at the back rim and over, ending where it did)
  const up = clamp(flip, 0, 1);
  const hk = sstep(up / 0.35);
  ctx.translate(mix(C.cx + 11, C.cx - C.rw + 1.6, hk), C.rimY - 0.4 - C.rh * 0.6 * (1 - hk));
  ctx.rotate(-Math.PI + (L.lid ?? 0) + up ** 0.3 * (Math.PI - 0.1));
  const pts = chaikin([[0, 1], [-1.6, -7], [0.6, -16], [6, -22.4], [10.4, -24], [11, -27.4], [14.6, -27.6], [15, -24], [20, -20], [23.4, -12], [22.4, -4], [16, 1]], 3);
  poly(ctx, pts);
  paint(ctx, a, mode, FOIL.base, FOIL.ink, w);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    const g = ctx.createLinearGradient(0, -30, 24, 0);
    g.addColorStop(0, tone(a, FOIL.lt));
    g.addColorStop(0.5, tone(a, FOIL.base));
    g.addColorStop(1, tone(a, FOIL.sh));
    ctx.fillStyle = g;
    ctx.fillRect(-4, -34, 36, 40);
    // (a soft foil crinkle, the gold rim, a faint printed bowl and steam)
    pen(ctx, tone(a, FOIL.sh, 0.7), 0.5);
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.quadraticCurveTo(10, -12, 8, -20);
    ctx.moveTo(15, -4);
    ctx.quadraticCurveTo(19, -12, 17, -22);
    ctx.stroke();
    pen(ctx, tone(a, CUP.red, 0.6), 1.2);
    ctx.beginPath();
    ctx.arc(13, -12, 4.6, 0.1, Math.PI - 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -18);
    ctx.quadraticCurveTo(11.4, -20, 10.4, -22);
    ctx.moveTo(15, -18.4);
    ctx.quadraticCurveTo(16.4, -20.4, 15.4, -22.4);
    ctx.stroke();
    ctx.restore();
    pen(ctx, tone(a, FOIL.rim), 0.8);
    poly(ctx, pts);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- His happi coat (cut from his torso's outline) ----------
export function happi(ctx, a, mode, D, lw) {
  const T = a.blTorsoPts;
  if (!T) return;
  if (mode === 'line') {
    poly(ctx, T);
    pen(ctx, tone(a, HAPPI.ink), lw);
    ctx.stroke();
    return;
  }
  ctx.save();
  poly(ctx, T);
  ctx.clip();
  ctx.fillStyle = tone(a, HAPPI.base);
  ctx.fillRect(-300, -300, 600, 600);
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const rb = D.J.ribs;
  const cx = st[0] + 1.4;
  glow(ctx, cx + 6, st[1] + 6, 10, HAPPI.lt, 0.7);
  glow(ctx, cx - 11, rb[1] + 4, 10, HAPPI.deep, 0.6);
  // the white collar band, from behind his neck down the front, crossing left over right
  for (const [s, k] of [[-1, 0], [1, 1]]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 3.4, st[1] - 3.6);
    ctx.lineTo(cx + s * 5.6, st[1] - 2.4);
    ctx.quadraticCurveTo(cx + s * 2 - (k ? 1 : 0), rb[1] - 2, cx - s * 2.6, rb[1] + 9);
    ctx.lineTo(cx - s * 5.4, rb[1] + 9);
    ctx.quadraticCurveTo(cx - s * 1, rb[1] - 3, cx + s * 3.4, st[1] - 3.6);
    ctx.closePath();
    ctx.fillStyle = tone(a, k ? HAPPI.band : HAPPI.bandSh);
    ctx.fill();
    pen(ctx, tone(a, HAPPI.bandSh), 0.35);
    ctx.stroke();
  }
  // (a small white undershirt V at the throat)
  ctx.beginPath();
  ctx.moveTo(cx - 2.2, st[1] - 3.4);
  ctx.lineTo(cx + 2.4, st[1] - 3.4);
  ctx.lineTo(cx + 0.2, st[1] + 2.2);
  ctx.closePath();
  ctx.fillStyle = tone(a, '#fffaf2');
  ctx.fill();
  ctx.restore();
  // the hem, low by the cup's rim: two rows of little white waves
  ctx.save();
  enter(ctx, a, D, 'waistB');
  const nv = D.J.navel;
  pen(ctx, tone(a, HAPPI.wave, 0.85), 0.45);
  for (let row = 0; row < 2; row++) {
    for (let i = -6; i <= 6; i++) {
      const x = nv[0] + i * 3.2 + row * 1.6;
      const y = nv[1] + 5.6 + row * 2.2;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, Math.PI, 0);
      ctx.stroke();
    }
  }
  // the cherry obi at his waist, its knot at his near side
  ctx.beginPath();
  ctx.moveTo(nv[0] - 30, nv[1] - 2.6);
  ctx.quadraticCurveTo(nv[0], nv[1] - 1.4, nv[0] + 30, nv[1] - 2.6);
  ctx.lineTo(nv[0] + 30, nv[1] + 2.2);
  ctx.quadraticCurveTo(nv[0], nv[1] + 3.4, nv[0] - 30, nv[1] + 2.2);
  ctx.closePath();
  ctx.fillStyle = tone(a, OBI.base);
  ctx.fill();
  glow(ctx, nv[0] + 4, nv[1] - 0.6, 6, OBI.lt, 0.5);
  pen(ctx, tone(a, OBI.sh), 0.4);
  ctx.beginPath();
  ctx.moveTo(nv[0] - 30, nv[1] + 0.2);
  ctx.quadraticCurveTo(nv[0], nv[1] + 1.4, nv[0] + 30, nv[1] + 0.2);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
// The obi's knot, at his near side, its two short ends swinging (drawn over the coat, outlined).
export function obiKnot(ctx, a, mode, D, lw) {
  ctx.save();
  enter(ctx, a, D, 'waistB');
  const nv = D.J.navel;
  const w = lw / D.SC;
  const sw = a.ndCup?.knot ?? 0;
  const kx = nv[0] + 7.4;
  const ky = nv[1] - 0.2;
  for (const [dx, len] of [[-0.8, 5.4], [1, 4.4]]) {
    ctx.save();
    ctx.translate(kx + dx, ky + 0.8);
    ctx.rotate(sw * (dx < 0 ? 1 : 0.8) + dx * 0.25);
    ctx.beginPath();
    ctx.moveTo(-1.1, 0);
    ctx.lineTo(-1.3, len);
    ctx.lineTo(0, len - 0.9);
    ctx.lineTo(1.3, len);
    ctx.lineTo(1.1, 0);
    ctx.closePath();
    paint(ctx, a, mode, OBI.sh, OBI.ink, w);
    ctx.restore();
  }
  ell(ctx, kx, ky, 1.9, 1.7);
  paint(ctx, a, mode, OBI.base, OBI.ink, w);
  if (mode === 'fill') glow(ctx, kx - 0.4, ky - 0.5, 1.2, OBI.lt, 0.7);
  ctx.restore();
}

// ---------- The happi's sleeves: wide and square, to the forearm ----------
export function sleeve(ctx, a, mode, D, k, lw) {
  const near = k === 'N';
  const sh = orig(a, `arm${k}u`);
  const el = orig(a, `arm${k}f`);
  const wr = orig(a, `hand${k}`);
  const A = D.spec?.arm ?? { aw0: 5, ew: 4.4, aw1: 3.8 };
  const end = lerp2(el, wr, 0.42);
  const pts = [sh, lerp2(sh, el, 0.5), el, end];
  const W = [A.aw0 * 1.45, A.aw0 * 1.6, A.ew * 2.1, A.ew * 2.3].map((v) => v * D.SC);
  tubePath(ctx, pts, W);
  paint(ctx, a, mode, near ? HAPPI.base : HAPPI.sh, HAPPI.ink, lw);
  if (mode === 'fill') {
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip();
    glow(ctx, ...lerp2(sh, el, 0.3), W[0], near ? HAPPI.lt : HAPPI.base, 0.6);
    glow(ctx, ...lerp2(el, end, 0.7), W[3] * 0.8, HAPPI.deep, 0.4);
    // the white stripe at the cuff
    const an = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
    const c = lerp2(el, wr, 0.3);
    ctx.translate(...c);
    ctx.rotate(an);
    ctx.fillStyle = tone(a, HAPPI.band);
    ctx.fillRect(-0.9, -W[3], 1.6, W[3] * 2);
    ctx.restore();
  }
}

// ---------- His chopsticks (in his near hand) ----------
export const CS = { len: 26 };
export function sticksGeom(a, D) {
  const hand = ptOf(a, D, 'handN', D.J.handN);
  const S = a.ndSticks ?? { rot: 0, open: 0 };
  return { x: hand[0], y: hand[1], rot: S.rot ?? 0, open: S.open ?? 0 };
}
export function chopsticks(ctx, a, mode, D, lw) {
  if (a.ndQ?.noSticks) return;
  const Sg = sticksGeom(a, D);
  drawSticks(ctx, a, mode, Sg.x, Sg.y, Sg.rot, Sg.open, lw);
}
// The pair gripped a third of the way down at (x, y), pointing along rot (0: straight ahead), `open` apart.
export function drawSticks(ctx, a, mode, x, y, rot, open, lw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const L = CS.len;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.rotate(s * open * 0.16);
    ctx.beginPath();
    ctx.moveTo(-L * 0.32, -0.75);
    ctx.lineTo(L * 0.68, -0.4);
    ctx.quadraticCurveTo(L * 0.7, 0, L * 0.68, 0.4);
    ctx.lineTo(-L * 0.32, 0.75);
    ctx.quadraticCurveTo(-L * 0.34, 0, -L * 0.32, -0.75);
    ctx.closePath();
    paint(ctx, a, mode, s > 0 ? STICK.base : STICK.sh, STICK.ink, lw);
    if (mode === 'fill') {
      ctx.fillStyle = tone(a, STICK.tip);
      ctx.fillRect(L * 0.46, -0.5, L * 0.21, 1);
      ctx.fillStyle = tone(a, STICK.gold);
      ctx.fillRect(-L * 0.24, -0.8, 1.2, 1.6);
      ctx.fillRect(-L * 0.12, -0.75, 0.6, 1.5);
      pen(ctx, tone(a, STICK.lt, 0.8), 0.3);
      ctx.beginPath();
      ctx.moveTo(-L * 0.28, -0.35);
      ctx.lineTo(L * 0.44, -0.2);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
