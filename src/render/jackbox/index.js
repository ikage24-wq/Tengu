// The Boxing Kangaroo (2026-11-26, the Jack-in-the-Box remade from scratch as a new creature; the id stays
// `jackbox`). Jacky, the Funhouse's bouncer: a wind-up boxing kangaroo in satin shorts and big red
// gloves, and in her pouch her joey, Pip-Pop, who pops out like a jack-in-the-box (a little jester cap
// with bells and all) whenever there's a crowd. Queen Gearheart's toys have to keep performing while
// anyone is watching; Jacky is a pro, but even a pro needs to sit on her tail now and then. She moves
// on her own copy of the creature base (rig.js; body.js `roo`: a slim chest, short arms, strong
// thighs, long kangaroo feet), dressed here; her head, ears, tail, pouch and joey drawn here from
// scratch over the mannequin's (the shared face never used, nothing of the hero's).
//   look    warm apricot fur, a cream belly with her pouch, a long muzzle with a round nose, tall soft
//           ears (each on its own spring, rooted inside her skull); a gold-and-white sweatband on her
//           brow; royal-blue satin boxing shorts with a gold waistband and a star (cut over her own
//           outline at the hips, round her thighs), big cherry-red gloves with white cuffs; a long
//           thick tail; a brass wind-up key in her back. The joey: a tiny apricot head with big ears
//           and a red-and-gold jester cap with two bells.
//   eyes    her own "sporty almond" eyes: almond-shaped, lifting at the outer corner, a clear sky-blue
//           iris (deep blue at the top, a pale ring below), a round glint and a crescent of light
//           low in the iris (fierce and bright); a bold lash line with a round flick. Straight round
//           brows. Faces: game (rest), grin, focus, fierce, puff (out of breath), startled, delight
//           (^ ^), hurt, sleepy, dizzy (beaten), sad, cross, talking (vowel mouths).
//   idle    a 30 s act in pieces, only a piece she has time to finish (data `rest`, m.restUntil):
//           - shadow boxing (6.8 s): jab, jab, cross, a bob and weave, a shuffle;
//           - skipping (7 s): a jump rope swung over and hopped, five quick hops;
//           - pop goes the joey (7.6 s): her pouch wriggles, the joey pops up on a spring, jingles its
//             cap at the crowd; she boops its nose with her glove and it ducks back in;
//           - sitting on her tail (7 s): leaning back on her tail like a stool, puffing, wiping her
//             brow; she spots you, "!", and her gloves come straight up.
//   walk    a boxer's bouncing step, gloves up, her tail swinging behind for balance.
//   fight   her moves in turn: One-Two (a jab and a cross), Tail Kick (back on her tail, both feet
//           kicked out at you: a kangaroo's own kick) and Pop Goes the Joey (she hunches, and the joey
//           springs out of her pouch at you with a tiny glove: BOING).
//   marks   all her own (`ownEmotes`): a "!" bubble as she starts hunting you, a "?" when she loses
//           you, a glove raised to the crowd after landing a hit, z's when she naps, a sweat drop when
//           low, dizzy stars when beaten.
// Every effect is drawn here, live, in her own style: soft white puff-swishes of a punch, dust off her
// big feet, the joey's bell jingles, the game's curvy sparkles.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat, cue, note, spring } from './fx.js';

const BIG = 1.36;
const LW = 1.6 / BIG;
// ---------- Her colours ----------
const INK = '#8a5238';
const FUR = ['#ffe2c2', '#efb27a', '#d08a52', '#a2643a'];
const CREAM = ['#fffaf2', '#fcebd6', '#eed2b2'];
const BLUE = ['#8ab8ff', '#3e6fd8', '#2c52a8', '#1e3a7a'];
const BLUE_INK = '#1e3470';
const GOLD = ['#fff4c0', '#f4c860', '#c49234', '#94681c'];
const RED = ['#ff9a9a', '#e8445a', '#b82e44', '#861e30'];
const RED_INK = '#7a1c2e';
const WHITE = ['#ffffff', '#f6f4fa', '#dcd8e8'];
const EARIN = '#f6b4b4';
const NOSE = '#4a2c2a';
const IRIS = ['#d8f0ff', '#78b8f0', '#3a78c8', '#1c3c78'];
const LASH = '#3a2018';
const BROWC = '#8a5030';

let WK = 1;
const paint = (ctx, a, mode, col, ink = INK, w = LW * WK) => {
  if (mode === 'line') {
    pen(ctx, ink, w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};
function chaikin(pts, n = 2) {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const o = [];
    for (let i = 0; i < q.length; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      o.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    q = o;
  }
  return q;
}
function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
}
function tube(pts, W, capK = 0.6) {
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
  const n = pts.length - 1;
  const tan = Math.atan2(pts[n][1] - pts[n - 1][1], pts[n][0] - pts[n - 1][0]);
  const tip = [pts[n][0] + Math.cos(tan) * W[n] * capK, pts[n][1] + Math.sin(tan) * W[n] * capK];
  return chaikin([...Lp, tip, ...[...Rp].reverse()], 2);
}
const chain = (root, angs, Ls) => {
  const pts = [root];
  for (let i = 0; i < angs.length; i++) {
    const p = pts[i];
    pts.push([p[0] + Math.cos(angs[i]) * Ls[i], p[1] + Math.sin(angs[i]) * Ls[i]]);
  }
  return pts;
};
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
// ---------- Her head ----------
const HO = [2.4, -13];
const HS = 1.02;
const headAt = (a, D, [u, v]) => {
  const n = D.J.neck;
  return ptOf(a, D, 'head', [n[0] + HO[0] + u * HS, n[1] + HO[1] + v * HS]);
};
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0] + HO[0], n[1] + HO[1]);
  ctx.scale(HS, HS);
}

// ---------- Her face ----------
const FACES = {
  game: { lid: 0, shut: 'happy', bt: 0.25, by: 0.1, mw: 0.8, ms: 0.45, mo: 0, te: 0, bl: 0.45, sm: 0 },
  grin: { lid: 0, shut: 'happy', bt: 0.1, by: 0.5, mw: 1.1, ms: 1, mo: 0.3, te: 1, bl: 0.6, sm: 0 },
  focus: { lid: 0, shut: 'happy', bt: 0.6, by: -0.2, mw: 0.7, ms: 0, mo: 0, te: 0, bl: 0.45, sm: 0 },
  fierce: { lid: 0, shut: 'happy', bt: 0.95, by: -0.4, mw: 0.9, ms: -0.2, mo: 0.35, te: 1, bl: 0.5, sm: 0.1 },
  shout: { lid: 0, shut: 'happy', bt: 0.8, by: 0, mw: 1.05, ms: 0.2, mo: 0.95, te: 0.5, bl: 0.6, sm: 0.2 },
  puff: { lid: 0.35, shut: 'sleep', bt: -0.4, by: 0.2, mw: 0.7, ms: 0, mo: 0.55, te: 0, bl: 0.9, sm: 0 },
  startled: { lid: 0, shut: 'happy', bt: -0.3, by: 1.3, mw: 0.6, ms: 0, mo: 0.6, te: 0, bl: 0.6, sm: 0.7 },
  delight: { lid: 1, shut: 'happy', bt: -0.2, by: 0.7, mw: 1, ms: 1, mo: 0.4, te: 0.5, bl: 0.85, sm: 0 },
  soft: { lid: 0, shut: 'happy', bt: -0.3, by: 0.5, mw: 0.8, ms: 0.8, mo: 0, te: 0, bl: 0.8, sm: 0 },
  hurt: { lid: 1, shut: 'squeeze', bt: -0.8, by: 0.2, mw: 0.9, ms: -0.7, mo: 0.6, te: 0.4, bl: 0.7, sm: 0 },
  sleepy: { lid: 1, shut: 'sleep', bt: -0.2, by: -0.1, mw: 0.6, ms: 0.1, mo: 0.1, te: 0, bl: 0.5, sm: 0 },
  dizzy: { lid: 1, shut: 'dizzy', bt: -0.5, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.45, te: 0, bl: 0.5, sm: 0 },
  sad: { lid: 0, shut: 'happy', bt: -0.95, by: 0.3, mw: 0.7, ms: -0.6, mo: 0, te: 0, bl: 0.4, sm: 0.15 },
  worried: { lid: 0, shut: 'happy', bt: -0.8, by: 0.5, mw: 0.7, ms: -0.4, mo: 0.15, te: 0, bl: 0.5, sm: 0.1 },
  cross: { lid: 0, shut: 'happy', bt: 0.95, by: -0.4, mw: 0.85, ms: -0.45, mo: 0.1, te: 0.6, bl: 0.45, sm: 0.1 },
  talk: { lid: 0, shut: 'happy', bt: 0.1, by: 0.3, mw: 0.85, ms: 0.3, mo: 0.4, te: 0, bl: 0.5, sm: 0 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.6, 0.1, 0.8], [1.1, 0.4, 0.55], [0.9, 0.3, 0.25], [0.7, 0.2, 0], [0.8, 0.2, 0.6]];
const EYE = { w: 3.5, h: 3.9 };

function eye(ctx, a, x, y, side, f, look) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.jbUid ?? 0) * 0.71) % 4.6, 4.1, 4.2, 4.28, 4.42) : 0;
  const L = Math.max(f.lid, blink);
  const closedW = sstep((L - 0.93) / 0.07);
  const shutW = blink > f.lid + 0.05 ? { happy: 0, sleep: 1, squeeze: 0, dizzy: 0 } : f.shut;
  const inner = [x - side * w, y + 0.6];
  const outer = [x + side * w, y - 0.7];
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    for (const s of SHUTS) {
      const sw = shutW[s];
      if (sw <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= sw;
      pen(ctx, tone(a, LASH), 1);
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (s === 'happy') {
        ctx.moveTo(inner[0], inner[1] + 0.6);
        ctx.quadraticCurveTo(x, y - h * 0.95, outer[0], outer[1] + 0.9);
      } else if (s === 'sleep') {
        ctx.moveTo(inner[0], inner[1] - 0.2);
        ctx.quadraticCurveTo(x, y + h * 0.5, outer[0], outer[1] + 0.2);
      } else if (s === 'squeeze') {
        ctx.moveTo(x + side * w, y - 2.2);
        ctx.quadraticCurveTo(x - side * w * 0.2, y - 0.3, x - side * w * 0.9, y + 0.2);
        ctx.quadraticCurveTo(x - side * w * 0.2, y + 0.8, x + side * w, y + 2.4);
      } else {
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 + t * 4 * side;
          const r = (i / 26) * w * 0.92;
          const p = [x + Math.cos(an) * r, y + Math.sin(an) * r];
          if (i) ctx.lineTo(...p);
          else ctx.moveTo(...p);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  const openW = 1 - closedW;
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(...inner);
    ctx.bezierCurveTo(x - side * w * 0.7, y - h * 1.15, x + side * w * 0.6, y - h * 1.2, ...outer);
    ctx.bezierCurveTo(x + side * w * 1.05, y + h * 1.0, x - side * w * 0.6, y + h * 1.05, ...inner);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = tone(a, '#fffdfa');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.3 * f.sm;
  const ix = x + side * 0.2 + (look?.[0] ?? 0) * 0.8;
  const iy = y + 0.45 + (look?.[1] ?? 0) * 0.6;
  const ir = [2.6 * small, 3.0 * small];
  const g = ctx.createLinearGradient(0, iy - ir[1], 0, iy + ir[1]);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.5, tone(a, IRIS[2]));
  g.addColorStop(1, tone(a, IRIS[1]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#122248', 0.8), 0.4);
  ctx.stroke();
  ell(ctx, ix, iy + 0.1, 1.2 * small, 1.45 * small);
  ctx.fillStyle = tone(a, '#0e1428');
  ctx.fill();
  // a crescent of light low in the iris, then the glints
  ctx.beginPath();
  ctx.ellipse(ix, iy + 0.3, ir[0] * 0.78, ir[1] * 0.78, 0, 0.35, Math.PI - 0.35);
  pen(ctx, tone(a, IRIS[0], 0.85), 0.55);
  ctx.stroke();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.35);
  sg.addColorStop(0, 'rgba(110,60,40,0.3)');
  sg.addColorStop(1, 'rgba(110,60,40,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.2, w * 2.6, h * 0.9);
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - side * 0.9, iy - 1.25 * small, 0.95, 0.95);
  ctx.fill();
  ell(ctx, ix + side * 1.0, iy - 0.2 * small, 0.35, 0.35);
  ctx.fill();
  if (L > 0.01) {
    ctx.fillStyle = tone(a, FUR[1]);
    ctx.fillRect(x - w * 1.3, y - h * 1.3, w * 2.6, h * 2.6 * Math.min(1, L / 0.93));
  }
  ctx.restore();
  if (L > 0.04) {
    const ly = y - h * 1.3 + h * 2.6 * Math.min(1, L / 0.93);
    const half = Math.sqrt(Math.max(0, 1 - ((ly - y) / h) ** 2)) * w;
    if (half > 0.3) {
      ctx.beginPath();
      ctx.moveTo(x - half, ly - 0.1);
      ctx.quadraticCurveTo(x, ly + 0.5, x + half, ly - 0.1);
      ctx.lineCap = 'round';
      pen(ctx, tone(a, LASH), 0.85);
      ctx.stroke();
    }
  }
  // the bold lash line, lifting with the almond's outer corner, a round flick at its end
  ctx.beginPath();
  ctx.moveTo(inner[0], inner[1] - 0.4);
  ctx.bezierCurveTo(x - side * w * 0.6, y - h * 1.15, x + side * w * 0.55, y - h * 1.22, outer[0], outer[1] - 0.2);
  ctx.quadraticCurveTo(outer[0] + side * 0.9, outer[1] - 0.5, outer[0] + side * 1.3, outer[1] - 1.4);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, LASH), 1.05);
  ctx.stroke();
  ctx.restore();
}
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.by * 1.1);
  ctx.rotate(side * f.bt * 0.42);
  ctx.beginPath();
  ctx.moveTo(-1.8, 0.2);
  ctx.quadraticCurveTo(0, -0.5, 1.8, 0);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, BROWC), 1.15);
  ctx.stroke();
  ctx.restore();
}
function mouth(ctx, a, x, y, f) {
  const w = 2 * f.mw;
  const cy = y - f.ms * 0.55;
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.3 - o * 0.3, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.7 + o * 2.6, x - w, cy);
    ctx.fillStyle = tone(a, '#8a3040');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x + 0.2, y + o * 2.1, w * 0.6, o * 0.9);
    ctx.fillStyle = tone(a, '#f28a9c');
    ctx.fill();
    if (f.te > 0.05) {
      ctx.fillStyle = tone(a, '#ffffff', f.te);
      ctx.fillRect(x - w * 0.8, cy - 0.4, w * 1.6, 0.8);
    }
    ctx.restore();
    pen(ctx, tone(a, '#6a2a30'), 0.5);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, '#6a2a30'), 0.6);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - w, cy - 0.2);
    ctx.quadraticCurveTo(x, y + 1 + f.ms * 0.45, x + w, cy - 0.5 - f.ms * 0.2);
    ctx.stroke();
  }
}
// Her skull and long muzzle, one shape.
function skullPath(ctx, tx) {
  ctx.beginPath();
  ctx.ellipse(-1, -1.6, 12.6, 11.6, 0, 0, TAU);
  ctx.moveTo(tx + 17.4, 4.2);
  ctx.ellipse(tx + 9.6, 4.2, 7.8, 5.6, -0.08, 0, TAU);
}
// A tall soft ear, rooted inside her skull, on its own spring.
function ear(ctx, a, mode, root, ang, far) {
  const pts = chain(root, [ang, ang + 0.06, ang + 0.1], [4.2, 4.4, 3.6]);
  const shape = tube(pts, [4, 5.6, 5.2, 3.6], 0.55);
  poly(ctx, shape);
  paint(ctx, a, mode, far ? FUR[2] : FUR[1]);
  if (mode !== 'fill') return;
  const inner = tube(chain([root[0] + Math.cos(ang) * 2.2, root[1] + Math.sin(ang) * 2.2], [ang, ang + 0.06], [4, 3.6]), [2, 3.2, 1.8], 0.5);
  poly(ctx, inner);
  ctx.fillStyle = tone(a, EARIN, far ? 0.55 : 0.85);
  ctx.fill();
}
// Her sweatband: a soft gold-and-white band round her brow, under her ears.
function band(ctx, a, mode) {
  ctx.beginPath();
  ctx.moveTo(-12.2, -7.4);
  ctx.quadraticCurveTo(-1, -13.4, 10.2, -9.6);
  ctx.lineTo(10.9, -5.8);
  ctx.quadraticCurveTo(-1, -9.6, -12.7, -3.8);
  ctx.closePath();
  paint(ctx, a, mode, WHITE[1], GOLD[3]);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(-12.4, -5.6);
    ctx.quadraticCurveTo(-1, -11.4, 10.5, -7.6);
    pen(ctx, tone(a, GOLD[1]), 1.6);
    ctx.stroke();
  }
}
const HEAD_DARK = [[-9, -6, 3, 3.6]];
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.jbQ ?? {};
  const f = a.jbF;
  const turn = q.turn ?? 0.4;
  const tx = turn * 2.4;
  const eA = q.earA ?? [0, 0];
  ear(ctx, a, mode, [4.2, -8.8], -1.28 + eA[1], true);
  skullPath(ctx, tx);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill' && f) {
    ctx.save();
    skullPath(ctx, tx);
    ctx.clip();
    glow(ctx, tx - 2, -10, 12, FUR[0], 0.9);
    glow(ctx, -12, 4, 8, FUR[2], 0.55);
    // a cream muzzle and chin
    ell(ctx, tx + 10, 5.6, 7.2, 4.6, -0.08);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, tx + 9, 3, 4.6, CREAM[0], 0.8);
    for (const [hx, hy, rx, ry] of HEAD_DARK) {
      ell(ctx, hx, hy, rx, ry);
      ctx.fillStyle = tone(a, FUR[2], 0.35);
      ctx.fill();
    }
    ctx.restore();
    for (const [cx, s] of [[tx - 6.4, 0.85], [tx + 4.2, 1]]) {
      ell(ctx, cx, 3.6, 2.3, 1.3);
      ctx.fillStyle = tone(a, '#ff8e8e', (0.25 + 0.45 * f.bl) * s);
      ctx.fill();
    }
    const ex = (s) => (s < 0 ? -4.4 + tx * 0.7 : 4.8 + tx);
    for (const s of [-1, 1]) eye(ctx, a, ex(s), -1.8, s, f, q.look);
    for (const s of [-1, 1]) brow(ctx, a, ex(s) + s * 0.2, -7.4, s, f);
    // the round nose at the muzzle's tip, a glint
    const nx = tx + 15.2;
    smooth(ctx, [[nx - 2.6, 2], [nx - 1.8, 0.4], [nx + 0.4, 0], [nx + 2.2, 0.8], [nx + 2.4, 2.6], [nx + 0.6, 3.8], [nx - 1.6, 3.6]]);
    ctx.fillStyle = tone(a, NOSE);
    ctx.fill();
    ell(ctx, nx - 0.6, 0.9, 0.9, 0.5, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();
    mouth(ctx, a, tx + 12, 7.6, f);
    if (q.sweat >= 0) sweat(ctx, tx - 12, -5 + q.sweat * 3, 1.1);
  }
  band(ctx, a, mode);
  ear(ctx, a, mode, [-4.6, -8.6], -1.86 + eA[0], false);
  WK = 1;
  ctx.restore();
}

// ---------- Her shorts, belly and pouch, gloves, feet, tail ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
// Her cream belly and pouch (the joey peeking out of it), the top of her satin shorts: all cut from
// her body's own outline.
function belly(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const C = (p) => ptOf(a, D, 'chest', p);
  const W = (p) => ptOf(a, D, 'waistB', p);
  const T = (p) => ptOf(a, D, 'torso', p);
  const st = D.J.stern;
  const nv = D.J.navel;
  const hp = D.J.hip;
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  // the cream belly down her front
  const bl = chaikin([C([st[0] - 1, st[1] + 1]), C([st[0] + 10, st[1] + 2]), W([nv[0] + 14, nv[1] - 2]), T([hp[0] + 12, hp[1]]), T([hp[0] - 2, hp[1] + 2]), W([nv[0] - 4, nv[1] - 4])], 2);
  poly(ctx, bl);
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  const bg = C([st[0] + 4, st[1] + 6]);
  glow(ctx, bg[0], bg[1], 5, CREAM[0], 0.7);
  // the pouch's lip: a soft curve across her tummy, a shade under it
  const p0 = W([nv[0] - 1, nv[1] - 6.6]);
  const p1 = W([nv[0] + 6.4, nv[1] - 8.6]);
  const p2 = W([nv[0] + 13.6, nv[1] - 6.2]);
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...p1, ...p2);
  pen(ctx, tone(a, CREAM[2]), 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1] + 0.8);
  ctx.quadraticCurveTo(p1[0], p1[1] + 0.8, p2[0], p2[1] + 0.8);
  pen(ctx, tone(a, FUR[2], 0.35), 1);
  ctx.stroke();
  // the shorts: royal-blue satin round her hips, a gold waistband and a star
  poly(ctx, [W([nv[0] - 40, nv[1] + 1.4]), W([nv[0] + 40, nv[1] + 1.4]), T([hp[0] + 40, hp[1] + 30]), T([hp[0] - 40, hp[1] + 30])]);
  ctx.fillStyle = tone(a, BLUE[1]);
  ctx.fill();
  const sg = T([hp[0] + 6, hp[1] - 1]);
  glow(ctx, sg[0], sg[1], 4, BLUE[0], 0.7);
  ctx.beginPath();
  ctx.moveTo(...W([nv[0] - 40, nv[1] + 1.4]));
  ctx.lineTo(...W([nv[0] + 40, nv[1] + 1.4]));
  pen(ctx, tone(a, GOLD[1]), 1.6);
  ctx.stroke();
  const sp = T([hp[0] + 7, hp[1] + 1.6]);
  ctx.save();
  ctx.translate(sp[0], sp[1]);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i / 10) * TAU;
    const r = i % 2 ? 0.55 : 1.3;
    if (i) ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
    else ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  pen(ctx, tone(a, GOLD[1]), 0.5);
  ctx.stroke();
  ctx.fillStyle = tone(a, GOLD[0]);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
// A shorts leg: blue satin round the top of her thigh, a gold hem (rig space, round the thigh).
function shortsLeg(ctx, a, mode, D, k) {
  const H = ptOf(a, D, `thigh${k}`, D.J[`hip${k}`]);
  const K = ptOf(a, D, `shin${k}`, D.J[`knee${k}`]);
  const an = Math.atan2(K[1] - H[1], K[0] - H[0]);
  const L = Math.hypot(K[0] - H[0], K[1] - H[1]);
  ctx.save();
  ctx.translate(H[0], H[1]);
  ctx.rotate(an);
  const pts = chaikin([[-2.6, -4.4], [L * 0.5, -4.6], [L * 0.66, -4.1], [L * 0.7, 0], [L * 0.66, 4.1], [L * 0.5, 4.6], [-2.6, 4.4]], 2);
  poly(ctx, pts);
  if (mode === 'line') {
    pen(ctx, BLUE_INK, LW * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, k === 'N' ? BLUE[1] : BLUE[2]);
    ctx.fill();
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    glow(ctx, L * 0.3, -2, 3.4, BLUE[0], k === 'N' ? 0.7 : 0.25);
    ctx.fillStyle = tone(a, GOLD[k === 'N' ? 1 : 2]);
    ctx.fillRect(L * 0.58, -6, 1.2, 12);
    ctx.restore();
  }
  ctx.restore();
}
// A big red boxing glove over a paw, a white cuff at the wrist (in the hand's frame).
function glove(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  const near = k === 'N';
  // the cuff
  smooth(ctx, [[-4.4, -6.6], [4.4, -6.6], [4.8, -3], [-4.8, -3]]);
  paint(ctx, a, mode, near ? WHITE[0] : WHITE[2], RED_INK);
  // the glove: a big round fist, the thumb tucked along its side
  smooth(ctx, [[-5.6, -3.2], [-2.2, -5], [3, -4.8], [6.2, -1.6], [6.8, 3], [4.4, 7.4], [-0.6, 8.6], [-5.2, 6.8], [-6.8, 2.2]]);
  paint(ctx, a, mode, near ? RED[1] : RED[2], RED_INK);
  smooth(ctx, [[4.6, -2.6], [7.4, -0.6], [7.6, 2.8], [5.6, 4], [4.4, 1.4]]);
  paint(ctx, a, mode, near ? RED[1] : RED[2], RED_INK);
  if (mode === 'fill') {
    glow(ctx, -1.4, 0, 5, RED[0], near ? 0.75 : 0.3);
    ell(ctx, -2, -1, 1.6, 2.4, -0.4);
    ctx.fillStyle = tone(a, '#ffffff', near ? 0.55 : 0.2);
    ctx.fill();
    pen(ctx, tone(a, RED[3], 0.6), 0.5);
    ctx.beginPath();
    ctx.moveTo(-3.6, 4.6);
    ctx.quadraticCurveTo(0, 6.2, 3.8, 4.2);
    ctx.stroke();
  }
  ctx.restore();
}
// A long kangaroo foot, bare, with a darker sole.
function foot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 4.6, p[1] - 3], [p[0] + 0.6, p[1] - 3.6], [p[0] + 7, p[1] - 1.6], [p[0] + 13.6, p[1] + 0.4], [p[0] + 14, p[1] + 3.4], [p[0] - 5, p[1] + 3.4], [p[0] - 5.6, p[1] + 0.2]]);
  paint(ctx, a, mode, near ? FUR[1] : FUR[2]);
  if (mode === 'fill') {
    glow(ctx, p[0] + 3, p[1] - 1.4, 5, FUR[0], near ? 0.7 : 0.3);
    smooth(ctx, [[p[0] - 4.6, p[1] + 2], [p[0] + 13.4, p[1] + 2], [p[0] + 13.6, p[1] + 3.4], [p[0] - 5, p[1] + 3.4]]);
    ctx.fillStyle = tone(a, FUR[3], near ? 0.6 : 0.8);
    ctx.fill();
  }
  ctx.restore();
}
// Her long thick tail, from inside her rump, sprung, its tip lifting.
function tail(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const angs = a.jbTail ?? [2.5, 2.75, 2.95, 3.05];
  const pts = chain([h[0] - 8, h[1] + 1], angs, [8, 8, 7.4, 6.4]);
  const shape = tube(pts, [10, 8.6, 7, 5.4, 4], 0.6);
  poly(ctx, shape);
  paint(ctx, a, mode, FUR[2]);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, shape);
    ctx.clip();
    glow(ctx, pts[1][0], pts[1][1] - 3, 7, FUR[1], 0.8);
    glow(ctx, pts[3][0], pts[3][1] + 3, 6, FUR[3], 0.4);
    ctx.restore();
  }
  ctx.restore();
  return pts;
}
function key(ctx, a, mode, D) {
  const q = a.jbQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  ctx.translate(st[0] - 11.8, st[1] + 6.6);
  const c = Math.cos(q.keyA ?? 0);
  ctx.beginPath();
  ctx.moveTo(1.6, 0);
  ctx.lineTo(-4.6, 0);
  ctx.lineCap = 'round';
  pen(ctx, mode === 'line' ? INK : tone(a, GOLD[2]), mode === 'line' ? 1.9 + LW * 2 : 1.9);
  ctx.stroke();
  for (const s of [-1, 1]) {
    ell(ctx, -7, s * 2.3 * Math.abs(c), 1.8, 2 * Math.max(0.35, Math.abs(c)));
    paint(ctx, a, mode, s * c > 0 ? GOLD[1] : GOLD[2], GOLD[3]);
  }
  ell(ctx, -5, 0, 1.05, 1.45);
  paint(ctx, a, mode, GOLD[1], GOLD[3]);
  ctx.restore();
}
// The joey: a tiny apricot head with big ears and a jester cap with two bells, up out of her pouch on
// a spring (q.joey: 0 down inside, 1 popped right up; q.joeyOut: how far forward, for the punch).
function joey(ctx, a, D) {
  const q = a.jbQ ?? {};
  const up = q.joey ?? 0;
  if (up <= 0.02) return;
  const nv = D.J.navel;
  const base = ptOf(a, D, 'waistB', [nv[0] + 6.4, nv[1] - 7.6]);
  const M = a.blMat('waistB');
  const ang = Math.atan2(M[1], M[0]);
  const out = q.joeyOut ?? 0;
  ctx.save();
  ctx.translate(base[0], base[1]);
  ctx.rotate(ang);
  // (clipped above the pouch's lip, so it rises out of it)
  ctx.beginPath();
  ctx.rect(-12, -30, 40, 30.2);
  ctx.clip();
  const lift = up * 6.4;
  const hx = out * 9;
  const hy = -lift + 2.6;
  // the spring it pops up on (only seen when it's well up)
  if (up > 0.5 || out > 0.05) {
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const u = i / 18;
      const px = mix(0, hx, u) + Math.sin(u * TAU * 2.5) * 1.1;
      const py = mix(1, hy + 2.4, u);
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    pen(ctx, tone(a, '#a8a8c0'), 0.7);
    ctx.stroke();
  }
  ctx.translate(hx, hy);
  ctx.rotate((q.joeyTilt ?? 0) + out * 0.2);
  // its little ears
  for (const s of [-1, 1]) {
    poly(ctx, tube(chain([s * 1.2, -1.8], [-Math.PI / 2 + s * 0.42], [2.8]), [1.6, 1.8], 0.55));
    ctx.fillStyle = tone(a, FUR[2]);
    ctx.fill();
    pen(ctx, tone(a, INK), 0.35);
    ctx.stroke();
  }
  ell(ctx, 0, 0, 3, 2.7);
  ctx.fillStyle = tone(a, FUR[1]);
  ctx.fill();
  pen(ctx, tone(a, INK), 0.4);
  ctx.stroke();
  ell(ctx, 1.6, 0.9, 1.5, 1);
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  ell(ctx, 2.8, 0.5, 0.45, 0.35);
  ctx.fillStyle = tone(a, NOSE);
  ctx.fill();
  for (const ex of [-0.6, 1.3]) {
    ell(ctx, ex, -0.4, 0.42, 0.55);
    ctx.fillStyle = tone(a, '#1c1428');
    ctx.fill();
    ell(ctx, ex - 0.12, -0.6, 0.15, 0.15);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  // the jester cap: two soft round-tipped points (red and gold), a bell on each
  const jg = q.jingle ?? 0;
  for (const [s, col] of [[-1, RED[1]], [1, GOLD[1]]]) {
    const tipA = -Math.PI / 2 + s * 0.9 + Math.sin(jg) * 0.15 * s;
    const pts = chain([s * 0.6, -2], [tipA, tipA + s * 0.5], [2.2, 1.8]);
    poly(ctx, tube(pts, [2.6, 1.6, 1], 0.5));
    ctx.fillStyle = tone(a, col);
    ctx.fill();
    pen(ctx, tone(a, s < 0 ? RED[3] : GOLD[3]), 0.3);
    ctx.stroke();
    ell(ctx, pts[2][0], pts[2][1], 0.62, 0.62);
    ctx.fillStyle = tone(a, GOLD[0]);
    ctx.fill();
    pen(ctx, tone(a, GOLD[3]), 0.25);
    ctx.stroke();
  }
  // a tiny boxing glove of its own, when it punches
  if (out > 0.1) {
    ell(ctx, 3.8, 2.2, 1.4 * out, 1.3 * out);
    ctx.fillStyle = tone(a, RED[1]);
    ctx.fill();
    pen(ctx, tone(a, RED_INK), 0.3);
    ctx.stroke();
  }
  ctx.restore();
}
// Her jump rope: two wooden handles in her gloves, a soft cord swung round her (q.rope: its angle; in
// front of her for the lower half of its swing, behind her for the upper).
function ropeArc(a, D, front) {
  const q = a.jbQ ?? {};
  const hN = ptOf(a, D, 'handN', D.J.handN);
  const hF = ptOf(a, D, 'handF', D.J.handF);
  const an = q.rope ?? 0;
  const R = 22;
  const c = Math.cos(an);
  const s = Math.sin(an);
  const mid = [(hN[0] + hF[0]) / 2 + c * 2, (hN[1] + hF[1]) / 2 + s * R];
  return { hN, hF, mid, show: front ? s > 0 : s <= 0 };
}
function rope(ctx, a, D, front) {
  const q = a.jbQ ?? {};
  if (!(q.ropeK > 0.05)) return;
  const R = ropeArc(a, D, front);
  if (!R.show) return;
  ctx.save();
  ctx.globalAlpha *= q.ropeK;
  ctx.beginPath();
  ctx.moveTo(...R.hF);
  ctx.bezierCurveTo(R.hF[0] - 3, R.mid[1], R.hN[0] + 3, R.mid[1], ...R.hN);
  ctx.lineCap = 'round';
  pen(ctx, RED[3], 1.6);
  ctx.stroke();
  pen(ctx, RED[1], 0.8);
  ctx.stroke();
  ctx.restore();
}

// ---------- Her act and her fight ----------
const SWINGS = ['onetwo', 'kick', 'joey'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.jbN ?? 0) % SWINGS.length]);
// Her guard: gloves up before her chin.
const GUARD = { shN: -62, elN: -112, hwN: -10, shF: -48, elF: -118, hwF: -10 };
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'game', look: [0.4, 0], turn: 0.4, sweat: -1, fx: null, keyRate: 1.6, joey: 0, joeyOut: 0, joeyTilt: 0, ropeK: 0, rope: 0, tailSit: 0 };
  a.jbQ = q;
  a.jbUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.7);
  const cineMood = m.cine?.mood;
  const alive = m.hp > 0;
  const low = alive && m.hp / m.def.hp < 0.3;
  const since = now - (m.attackAt ?? -9);
  const anticK = m.windup > 0 ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = alive && (anticK > 0 || (since >= 0 && since < 0.95));
  if (swinging && !st.jbAtk) {
    st.jbN = (st.jbN ?? (m.uid ?? 0)) + 1;
    st.jbPick = pickSwing(m, st);
  }
  st.jbAntic = swinging ? Math.max(anticK, st.jbAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.95;
  st.jbAtk = swinging;
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;
  const busy = !alive || swinging;
  if (busy) st.jbFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.jbFreeAt ?? -9)) / 0.35);

  // Standing: light on her feet, a boxer's bounce, the gloves loose at her chest.
  const bounce = Math.max(0, Math.sin(t * 3.4));
  go({ shN: -44, elN: -96, hwN: -6, shF: -34, elF: -100, hwF: -6, tilt: 1, chest: -1 + breath * 0.5, head: -2, lift: 0.012 * bounce }, 1);
  if (walkW > 0.01) {
    const u = a.blkidU ?? a.wp ?? 0;
    add({ shN: Math.sin(u * TAU) * 6, shF: -Math.sin(u * TAU) * 6, tilt: 3 }, walkW);
    q.turn = mix(q.turn, 0.6, walkW);
  }
  if (fighting && !busy) {
    go({ ...GUARD, tilt: 5, head: 2 }, 0.85 * freeK);
    say('focus');
    q.turn = 0.6;
    q.keyRate = 2.8;
  }
  if (fighting && !st.jbHunt) st.jbBangAt = now;
  if (!fighting && st.jbHunt && alive) st.jbLostAt = now;
  st.jbHunt = fighting;
  q.bang = now - (st.jbBangAt ?? -9);
  q.huh = now - (st.jbLostAt ?? -9);
  if (alive && !busy && q.bang >= 0 && q.bang < 0.9) {
    const k = win(q.bang, 0, 0.12, 0.5, 0.9) * freeK;
    go({ head: -10, tilt: -4 }, k);
    q.earKick = k;
    say('startled', k);
  }
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // a glove raised to the crowd
    const k = win(gloat, 0, 0.25, 0.9, 1.4) * freeK;
    go({ shN: -168, elN: -20, head: -8, tilt: -3 }, k);
    say('grin', k);
    q.fx = { kind: 'gloat', u: gloat };
  }
  if (!alive) {
    st.jbDeadAt ??= now;
    go({ drop: 0.85, tilt: -14, head: 14, shN: 30, elN: -30, shF: 40, elF: -20, fxN: 0.5, fxF: 0.2 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.keyRate = 0;
    q.fx = { kind: 'beaten', u: now - st.jbDeadAt };
  } else st.jbDeadAt = undefined;

  if (alive) {
    if (swinging) {
      const kind = st.jbPick ?? 'onetwo';
      const hitK = struck ? (since < 0.1 ? sstep(since / 0.1) : 1 - sstep((since - 0.36) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.jbAntic) * (since < 0.1 ? 1 : 0) : sstep(anticK);
      q.keyRate = 4;
      if (kind === 'onetwo') {
        // One-Two: gloves up and her weight back; a jab with the near glove, then the cross
        go({ ...GUARD, tilt: -6, head: -2, x: -0.02 }, wK);
        const jab = struck ? win(since, 0, 0.06, 0.14, 0.24) : 0;
        const cross = struck ? win(since, 0.18, 0.26, 0.42, 0.7) : 0;
        go({ shN: -86, elN: -8, tilt: 6, x: 0.03 }, jab);
        go({ shF: -84, elF: -10, shN: -60, elN: -110, tilt: 12, turnC: 0.4, x: 0.06 }, cross);
        say(struck ? 'fierce' : 'focus');
        q.fx = { kind: struck ? 'onetwo' : 'ready', u: struck ? since : now };
      } else if (kind === 'kick') {
        // Tail Kick: back onto her tail, legs drawn up... both feet kicked out at you
        go({ tilt: -14, head: -6, drop: 0.18, fxN: 0.05, fyN: -0.35, fxF: -0.05, fyF: -0.3, ...GUARD }, wK);
        go({ tilt: -24, head: -8, lift: 0.06, fxN: 0.95, fyN: -0.55, fxF: 0.8, fyF: -0.45, shN: -100, elN: -60, shF: -80, elF: -60 }, hitK);
        q.tailSit = Math.max(wK, hitK);
        say(hitK > 0.2 ? 'shout' : 'focus');
        q.fx = { kind: struck ? 'kick' : 'ready', u: struck ? since : now };
      } else {
        // Pop Goes the Joey: she hunches over her pouch... and the joey springs out at you, BOING
        go({ tilt: 10, head: 10, drop: 0.1, shN: 10, elN: -70, shF: 20, elF: -70 }, wK);
        go({ tilt: -8, head: -6, shN: -130, elN: -30, shF: -120, elF: -30 }, hitK);
        q.joey = Math.max(wK * 0.3, struck ? 1 : 0);
        q.joeyOut = hitK;
        q.jingle = now * 18;
        say(hitK > 0.2 ? 'grin' : 'focus');
        q.fx = { kind: struck ? 'joey' : 'ready', u: struck ? since : now };
      }
    } else if (hurt) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -12, x: -0.02, ...GUARD }, k);
      say('hurt', k * 2);
      q.earKick = k;
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const nap = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
    st.jbNap = mix(st.jbNap ?? 0, nap && !busy ? 1 : 0, 1 - Math.exp(-dt * 3));
    if (st.jbNap > 0.01) {
      // a nap sat back on her tail, gloves in her lap
      const k = sstep(st.jbNap);
      go({ tilt: -8, head: 16 + Math.sin(t * 1.1) * 2, drop: 0.12, shN: 0, elN: -50, shF: 6, elF: -50 }, k);
      q.tailSit = Math.max(q.tailSit, k);
      if (k > 0.5) {
        q.mood = 'sleepy';
        q.fx = { kind: 'nap', u: t };
        q.keyRate = 0.2;
      }
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.jbCalm = mix(st.jbCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.jbCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, q, sstep(st.jbCalm), t, now, st);
    if (cineMood && !busy) q.mood = { angry: 'cross', happy: 'delight', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !busy) {
      if (!cineMood) q.mood = q.mood === 'game' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
      q.keyRate *= 0.5;
    }
    if (m.talking) q.mood = 'talk';
  }
  q.turn = spring(st, 'jbTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.game;
  const f = (st.jbF ??= { ...FACES.game, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'bt', 'by', 'mw', 'ms', 'mo', 'te', 'bl', 'sm']) f[k] = mix(f[k], tgt[k], k === 'lid' ? 1 - Math.exp(-dt * (tgt.lid > f.lid ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.jbF = f;
  // springs: the ears, the tail, the joey
  const kick = (st.jbLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.jbLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.jbLast = out.head;
  st.jbLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  q.earA = [0, 1].map((i) => spring(st, `ear${i}`, (q.earKick ?? 0) * (i ? 0.5 : -0.5) + Math.sin(t * 1.3 + i * 2) * 0.04 + (q.mood === 'sad' || q.mood === 'sleepy' ? (i ? 0.35 : -0.35) : 0) - ((out.head ?? 0) * Math.PI) / 180 * 0.3, 80, 7, dt, kick * 0.012));
  const sit = q.tailSit;
  const tiltR = ((out.tilt ?? 0) * Math.PI) / 180;
  // (sitting back on it, the tail lies along the floor; otherwise it hangs out behind, lifting a little
  // at its tip, swinging for balance)
  a.jbTail = [0, 1, 2, 3].map((i) => spring(st, `tl${i}`, mix([2.5, 2.75, 2.95, 3.05][i], [2.0, 2.9, 3.14, 3.2][i], sit) - tiltR * 0.85 + Math.sin(t * 1.4 - i * 0.5) * 0.05 + step * 0.08, 90 - i * 8, 8, dt, kick * 0.006));
  q.joey = clamp(spring(st, 'joey', q.joey, 190, 11, dt), 0, 1.3);
  q.joeyOut = clamp(spring(st, 'joeyOut', q.joeyOut, 160, 12, dt), 0, 1.2);
  q.joeyTilt = spring(st, 'joeyTilt', q.joeyTilt + Math.sin(t * 2) * 0.1, 80, 6, dt, kick * 0.01);
  q.jingle = q.jingle ?? t * 3;
  st.jbKeyRate = mix(st.jbKeyRate ?? q.keyRate, q.keyRate, 1 - Math.exp(-dt * 3));
  st.jbKeyA = ((st.jbKeyA ?? (m.uid ?? 0) * 0.7) + st.jbKeyRate * dt) % (TAU * 100);
  q.keyA = st.jbKeyA;
}
const PIECES = [
  { name: 'shadow', t0: 0.4, len: 6.8 },
  { name: 'skip', t0: 7.8, len: 7 },
  { name: 'joey', t0: 15.4, len: 7.6 },
  { name: 'sit', t0: 23.6, len: 6.2 },
];
function idleAct(m, a, out, go, add, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.jbPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.jbPiece = cur.name;
      else return;
    }
  } else {
    st.jbPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'shadow') {
    // jab, jab, cross; a bob and a weave; a fancy shuffle
    const k = win(u, 0, 0.4, 6.2, 6.8);
    go({ ...GUARD, tilt: 4 }, k * w);
    const p1 = win(u, 0.8, 0.88, 0.98, 1.15);
    const p2 = win(u, 1.4, 1.48, 1.58, 1.75);
    const p3 = win(u, 2.0, 2.1, 2.25, 2.5);
    go({ shN: -88, elN: -8, x: 0.02 }, p1 * k * w);
    go({ shN: -88, elN: -8, x: 0.02 }, p2 * k * w);
    go({ shF: -86, elF: -10, turnC: 0.4, tilt: 10, x: 0.04 }, p3 * k * w);
    const bob = win(u, 3.0, 3.3, 4.2, 4.5);
    go({ drop: 0.16, tilt: 10 + Math.sin(u * 7) * 6, head: Math.sin(u * 7) * 6, x: Math.sin(u * 7) * 0.02 }, bob * k * w);
    const shuf = win(u, 4.7, 4.9, 5.8, 6.1);
    add({ fxN: Math.sin(u * 16) * 0.18 * shuf, fxF: -Math.sin(u * 16) * 0.18 * shuf, fyN: -0.08 * Math.max(0, Math.sin(u * 16)) * shuf, fyF: -0.08 * Math.max(0, -Math.sin(u * 16)) * shuf }, k * w);
    if (at(k)) {
      q.mood = u < 3 ? 'focus' : u < 4.6 ? 'fierce' : 'grin';
      if (p1 + p2 + p3 > 0.3) q.fx = { kind: 'jab', u: u > 1.95 ? u - 2.05 : u > 1.35 ? u - 1.45 : u - 0.85 };
    }
  } else if (cur.name === 'skip') {
    // a jump rope swung over and hopped: five quick hops, the rope under her feet each time
    const k = win(u, 0, 0.5, 6.4, 7);
    const on = win(u, 0.6, 1.0, 5.6, 6.2);
    const ph = Math.max(0, u - 1.0) * 1.6;
    const hop = on * Math.max(0, Math.sin(ph * TAU)) ** 1.5;
    go({ shN: 20, elN: -60, hwN: -20, shF: 26, elF: -60, hwF: -20, head: -2 }, on * k * w);
    add({ hop: 0.09 * hop * k * w, fyN: -0.05 * hop, fyF: -0.05 * hop, tilt: -2 * hop }, 1);
    if (at(k)) {
      q.ropeK = on;
      // (the rope passes under her feet as she's highest, over her head as she lands)
      q.rope = ph * TAU + Math.PI / 2 - 0.4;
      q.mood = u < 5.8 ? 'focus' : 'puff';
    }
  } else if (cur.name === 'joey') {
    // her pouch wriggles; the joey pops up on its spring and jingles its cap at the crowd; she boops its
    // nose with her glove; it ducks back in
    const k = win(u, 0, 0.5, 7, 7.6);
    const look = win(u, 0.3, 0.8, 6.6, 7.2);
    const boop = win(u, 4.2, 4.5, 4.8, 5.2);
    go({ head: 14, tilt: 4, shN: -20, elN: -80 }, look * k * w);
    go({ shN: -46, elN: -40, hwN: -20 }, boop * k * w);
    if (at(k)) {
      q.joey = u < 1.4 ? Math.max(0, Math.sin(u * 30)) * 0.12 * sstep((u - 0.6) / 0.3) : u < 5.4 ? 1 : 0;
      q.joeyTilt = u > 2 && u < 4 ? Math.sin(u * 9) * 0.25 : 0;
      q.jingle = u * 14;
      q.look = [0.6, 1.2];
      q.mood = u < 1.4 ? 'startled' : u < 5.4 ? 'soft' : 'delight';
      if (u > 1.4 && u < 2.4) q.fx = { kind: 'pop', u: u - 1.4 };
      if (u > 2.2 && u < 4.2) q.fx = { kind: 'jingle', u: u - 2.2 };
      if (u > 4.4 && u < 5.2) q.fx = { kind: 'boop', u: u - 4.4 };
    }
  } else {
    // back on her tail like a stool, puffing, a glove to her brow; she spots you: gloves straight up
    const k = win(u, 0, 0.5, 5.7, 6.2);
    const sit = win(u, 0.3, 1.0, 3.8, 4.4);
    const wipe = win(u, 1.6, 2, 2.8, 3.2);
    const up = win(u, 4.0, 4.2, 5.4, 6.0);
    go({ tilt: -10, drop: 0.16, head: 4, shN: 10, elN: -40, shF: 16, elF: -40 }, sit * k * w);
    go({ shN: -150, elN: -110, head: -4 }, wipe * k * w);
    go({ ...GUARD, tilt: 6 }, up * k * w);
    if (at(k)) {
      q.tailSit = sit;
      q.mood = u < 4 ? (wipe > 0.3 ? 'puff' : 'puff') : u < 4.4 ? 'startled' : 'fierce';
      if (u > 3.9 && u < 4.8) q.fx = { kind: 'spotted', u: u - 3.9 };
      if (u > 1 && u < 3.8) q.fx = { kind: 'puffing', u: u - 1 };
    }
  }
}

// ---------- Effects ----------
function bubble(ctx, x, y, mark, e, len, fl) {
  const inn = e < 0.22 ? sstep(e / 0.22) * (1 + 0.2 * Math.sin(Math.PI * clamp(e / 0.22, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  ctx.scale(fl * k, k);
  // her marks sit in a round red glove-shaped bubble with a white cuff
  ell(ctx, 0, -0.4, 4.8, 4.4);
  ctx.fillStyle = '#fffaf8';
  ctx.fill();
  pen(ctx, mark === '!' ? '#b82e44' : '#2c52a8', 0.95);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2.4, 3.6);
  ctx.lineTo(2.4, 3.6);
  pen(ctx, mark === '!' ? '#b82e44' : '#2c52a8', 0.9);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#e8445a' : '#3e6fd8';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 0.2);
  } else {
    ctx.moveTo(-1.4, -1.8);
    ctx.quadraticCurveTo(-1.1, -3.5, 0.4, -3.3);
    ctx.quadraticCurveTo(1.9, -3, 1.3, -1.4);
    ctx.quadraticCurveTo(0.3, -0.7, 0.2, 0.3);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 1.9, 0.75, 0.75);
  ctx.fill();
  ctx.restore();
}
function zee(ctx, x, y, s, al, fl) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(fl * s, s);
  ctx.beginPath();
  ctx.moveTo(-1.5, -1.5);
  ctx.quadraticCurveTo(0, -1.8, 1.5, -1.5);
  ctx.quadraticCurveTo(0, 0, -1.5, 1.5);
  ctx.quadraticCurveTo(0, 1.2, 1.6, 1.5);
  ctx.lineCap = 'round';
  pen(ctx, '#3e6fd8', 1.3);
  ctx.stroke();
  pen(ctx, '#f0f4ff', 0.55);
  ctx.stroke();
  ctx.restore();
}
// A punch's swish: a short soft white crescent ahead of the glove.
function punchSwish(ctx, x, y, u, s = 1) {
  if (u < 0 || u > 0.3) return;
  const k = u / 0.3;
  ctx.save();
  ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 6 * s - k * 2, y - 2.4 * s + i * 2.4 * s);
    ctx.lineTo(x - 1 * s + k * 4, y - 2.4 * s + i * 2.4 * s);
    ctx.lineCap = 'round';
    pen(ctx, '#e8d0d6', 1.4);
    ctx.stroke();
    pen(ctx, '#ffffff', 0.6);
    ctx.stroke();
  }
  ctx.restore();
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  for (const mode of ['line', 'fill']) {
    key(ctx, a, mode, D);
    tail(ctx, a, mode, D);
  }
  rope(ctx, a, D, false);
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.jbQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  rope(ctx, a, D, true);
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -20]);
  const hd = headAt(a, D, [4, 0]);
  const gN = ptOf(a, D, 'handN', D.J.handN);
  const gF = ptOf(a, D, 'handF', D.J.handF);
  const pouch = ptOf(a, D, 'waistB', [D.J.navel[0] + 6.4, D.J.navel[1] - 12]);
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0) bubble(ctx, crown[0] + 3, crown[1] - 7, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0) bubble(ctx, crown[0] + 3, crown[1] - 7, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  if (X.kind === 'ready') {
    sparkle(ctx, gN[0] + 3, gN[1] - 3, 1.4 + Math.sin(t * 9) * 0.5, 0.7, '#fff6c8');
  } else if (X.kind === 'onetwo') {
    punchSwish(ctx, gN[0] + 2, gN[1], u);
    punchSwish(ctx, gF[0] + 2, gF[1], u - 0.2);
    if (u > 0.04 && u < 0.5) {
      const v = clamp((u - 0.04) / 0.4, 0, 1);
      star(ctx, gN[0] + 6 + v * 4, gN[1] - 2 - v * 3, 1.8 * (1 - v), 0.3, 1 - v);
      if (u > 0.22) cue(ctx, 'POW!', hd[0] + 22, hd[1] - 14, 6.5, fl, -0.1, '#b82e44');
    }
  } else if (X.kind === 'jab') {
    punchSwish(ctx, gN[0] + 2, gN[1], u, 0.8);
  } else if (X.kind === 'kick') {
    const k = clamp(u / 0.4, 0, 1);
    if (u < 0.6) {
      const fN = ptOf(a, D, 'footN', [D.J.ankN[0] + 14, D.J.ankN[1]]);
      for (let i = 0; i < 3; i++) {
        const an = -0.9 + i * 0.9;
        star(ctx, fN[0] + 2 + Math.cos(an) * (3 + k * 8), fN[1] + Math.sin(an) * (3 + k * 6), 2 * (1 - k * 0.5), an, 1 - k * 0.6);
      }
      if (u > 0.05) cue(ctx, 'WHUMP!', hd[0] + 20, hd[1] - 12, 6.5, fl, -0.1, '#2c52a8');
    }
    if (u < 0.7) dust(ctx, -6, -1.5, 3.4, 0.6 * (1 - u / 0.7), '#fdf0e4', '#e0c0a0');
  } else if (X.kind === 'joey') {
    if (u > 0.02 && u < 0.6) {
      const k = clamp(u / 0.5, 0, 1);
      cue(ctx, 'BOING!', pouch[0] + 16, pouch[1] - 8, 6.5, fl, -0.1, '#b82e44');
      for (let i = 0; i < 3; i++) sparkle(ctx, pouch[0] + 10 + Math.cos(i * 2) * (3 + k * 6), pouch[1] + Math.sin(i * 2) * (2 + k * 5), 1.6 * (1 - k), 1 - k, '#fff6c8');
    }
  } else if (X.kind === 'pop') {
    const k = clamp(u / 0.6, 0, 1);
    for (let i = 0; i < 4; i++) sparkle(ctx, pouch[0] + Math.cos(i * 1.6 - 1.6) * (2 + k * 7), pouch[1] - 2 + Math.sin(i * 1.6 - 1.6) * (2 + k * 5), 1.5 * (1 - k), 1 - k, '#fff6c8');
    if (u < 0.8) cue(ctx, 'pop!', pouch[0] + 10, pouch[1] - 10, 5.5, fl, -0.1, '#b82e44');
  } else if (X.kind === 'jingle') {
    const v = (u * 0.7) % 1;
    note(ctx, pouch[0] + 6 + v * 4, pouch[1] - 6 - v * 7, 1.2, -0.2, Math.sin(Math.PI * v) * 0.9, '#c49234');
  } else if (X.kind === 'boop') {
    sparkle(ctx, pouch[0] + 3, pouch[1] - 2, 1.8 * Math.sin(Math.PI * clamp(u / 0.6, 0, 1)), 1, '#ffe0e8');
  } else if (X.kind === 'puffing') {
    const v = (u * 0.8) % 1;
    const mp = headAt(a, D, [16, 8]);
    ell(ctx, mp[0] + 2 + v * 4, mp[1] - v * 2, 1 + v, 0.8 + v * 0.6);
    ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - v)})`;
    ctx.fill();
    if (q.sweat < 0 && u > 0.6 && u < 1.6) sweat(ctx, crown[0] - 8, crown[1] + 6 + (u - 0.6) * 3, 1, 1);
  } else if (X.kind === 'spotted') {
    bubble(ctx, crown[0] + 3, crown[1] - 7, '!', u, 0.9, fl);
  } else if (X.kind === 'gloat') {
    const v = clamp(u / 1.2, 0, 1);
    for (let i = 0; i < 3; i++) sparkle(ctx, gN[0] - 3 + i * 3, gN[1] - 4 - v * 4 - i * 1.5, 1.6 * Math.sin(Math.PI * v), 1, '#fff6c8');
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) sparkle(ctx, hd[0] - 6 - v * 6 + i * 4, hd[1] - 8 - v * 5 - i * 2.4, 1.6 * (1 - v), 1 - v, '#fff6c8');
  } else if (X.kind === 'nap') {
    for (let i = 0; i < 3; i++) {
      const v = (u * 0.45 + i / 3) % 1;
      zee(ctx, crown[0] + 5 + v * 7, crown[1] + 2 - v * 11, 0.75 + v * 0.5, Math.sin(Math.PI * v), fl);
    }
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] + 2, 8, t, 3);
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.2, 0.6 * (1 - u / 0.6), '#fdf0e4', '#e0c0a0');
  }
}

const DRESS = {
  id: 'boxingkangaroo',
  // (the skin is her fur; her belly, pouch and shorts are cut over it from the same outline)
  skin: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      belly(ctx, a, mode, D);
      if (mode === 'fill') joey(ctx, a, D);
    },
    handFskin: (ctx, a, mode, S, D) => glove(ctx, a, mode, D, 'F'),
    legF: (ctx, a, mode, S, D) => shortsLeg(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'F'),
    legN: (ctx, a, mode, S, D) => shortsLeg(ctx, a, mode, D, 'N'),
    footNskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    handNskin: (ctx, a, mode, S, D) => glove(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('roo', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.4);
rig.h = Math.round(rig.h * BIG * 1.4);
export const KANGAROO_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [90, 300, 220, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const KANGAROO_SIZE = { w: 30, h: Math.round(R.H * BIG * 1.15), speed: Math.round(R.speed * BIG) };
