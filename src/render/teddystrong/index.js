// The Hippo Strongman (2026-11-26, Teddy Strongbear remade from scratch as a new creature; the id stays
// `teddystrong`). Hugo, the carnival's strongman: a big round wind-up hippo in an old-time striped
// strongman suit and a champion's belt, a barbell with two great round weights across his shoulders,
// a curled moustache he is very proud of. Queen Gearheart's toys have to keep performing while anyone
// is watching, and Hugo would love nothing more than to put the barbell down and have a good long yawn.
// He moves on his own copy of the creature base (rig.js; body.js `hippo`: a big round barrel of a body,
// short thick arms and legs), dressed here; his head, ears, moustache and barbell drawn here from
// scratch over the mannequin's (the shared face never used, nothing of the hero's).
//   look    dusty-rose hippo hide, paler on his muzzle and tummy; a wide rounded head, a great soft
//           muzzle with round nostrils on top, little round ears, his eyes up on two soft bumps (a
//           hippo's), a caramel curled moustache (each curl on its own spring, rooted in the muzzle);
//           a cherry-and-cream striped strongman suit with shoulder straps, cut from his own outline
//           and down round his thighs, a gold champion's belt with a star buckle, cherry wristbands;
//           bare round feet; a brass wind-up key in his back. The barbell: a steel bar, two great round
//           charcoal-plum weights with gold rims and a painted "100".
//   eyes    his own "moon-bump" eyes: round and kind, set high, a soft periwinkle iris with a big
//           pupil, one big glint and a curved line of light; a soft lash line with one round flick;
//           thick round bushy brows. Faces: proud (rest), beam (^ ^), strain (puffed cheeks), focus,
//           fierce, yawn, startled, sleepy, hurt, dizzy (beaten), sad, cross, talking (vowel mouths).
//   idle    a 30 s act in pieces, only a piece he has time to finish (data `rest`, m.restUntil):
//           - posing (7 s): the barbell set down, a double-biceps flex, a side-chest flex, a twinkle;
//           - presses (7.4 s): the barbell pressed overhead three times, cheeks puffed, a wobble;
//           - a good yawn (6 s): a huge hippo yawn and a stretch;
//           - a sneaky rest (7 s): leaning on the barbell (set down) for forty winks, a nod... he spots
//             you, "!", and hoists it back up with a flex.
//   walk    a heavy proud plod, the barbell steady on his shoulders, the weights bobbing.
//   fight   his moves in turn: Barbell Slam (heaved up high over his head, then brought down in front
//           of him, the ground shaking: the longest wind-up of the troupe), Belly Bump (a breath in,
//           then his great tummy bumped into you, BOING) and Big Yawn (a stretch... and a yawn so
//           huge it blows you back, a gust of air).
//   marks   all his own (`ownEmotes`): a "!" bubble as he starts hunting you, a "?" when he loses
//           you, a flex after landing a hit, z's when he naps, a sweat drop when low, dizzy stars
//           when beaten.
// Every effect is drawn here, live, in his own style: dust and soft rubble off a slam, gusts of breath,
// the game's curvy sparkles.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat, cue, note, spring } from './fx.js';

const BIG = 1.42;
const LW = 1.6 / BIG;
// ---------- His colours ----------
const INK = '#8a5a72';
const HIDE = ['#fde8ef', '#eabace', '#cc96b2', '#a8728e'];
const PALE = ['#fff6f8', '#fbe2ea', '#f0c8d6'];
const RED = ['#ff9a9a', '#e04a5a', '#b43246', '#8a2236'];
const CREAM = ['#ffffff', '#fdf4ea', '#eadcc8', '#c8b49c'];
const GOLD = ['#fff4c0', '#f4c860', '#c49234', '#94681c'];
const STACHE = ['#e8b880', '#b8834a', '#8a5a2c'];
const STEEL = ['#ffffff', '#dfe4f0', '#a8b0c8', '#727a98'];
const WEIGHT = ['#7a6a8e', '#4a3e5e', '#2e2640', '#1e1830'];
const IRIS = ['#e4ecff', '#98a8e8', '#5a68b8', '#2c3478'];
const LASH = '#4a2a3a';

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
// ---------- His head ----------
const HO = [1.6, -12.4];
const HS = 1.12;
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

// ---------- His face ----------
// pf: cheeks puffed (straining); yw: the yawn (the mouth's great opening).
const FACES = {
  proud: { lid: 0, shut: 'happy', bt: 0.1, by: 0.4, mw: 0.9, ms: 0.55, mo: 0, te: 0, bl: 0.45, sm: 0, pf: 0, yw: 0 },
  beam: { lid: 1, shut: 'happy', bt: -0.2, by: 0.7, mw: 1.1, ms: 1, mo: 0.35, te: 0.6, bl: 0.8, sm: 0, pf: 0, yw: 0 },
  strain: { lid: 1, shut: 'squeeze', bt: 0.6, by: 0.2, mw: 0.5, ms: 0, mo: 0, te: 0, bl: 1, sm: 0, pf: 1, yw: 0 },
  focus: { lid: 0, shut: 'happy', bt: 0.55, by: -0.1, mw: 0.8, ms: 0.1, mo: 0, te: 0, bl: 0.45, sm: 0, pf: 0, yw: 0 },
  fierce: { lid: 0, shut: 'happy', bt: 0.95, by: -0.4, mw: 1, ms: -0.2, mo: 0.4, te: 1, bl: 0.5, sm: 0.1, pf: 0, yw: 0 },
  yawn: { lid: 1, shut: 'squeeze', bt: -0.4, by: 0.6, mw: 1, ms: 0, mo: 0, te: 0, bl: 0.6, sm: 0, pf: 0, yw: 1 },
  startled: { lid: 0, shut: 'happy', bt: -0.3, by: 1.3, mw: 0.6, ms: 0, mo: 0.6, te: 0, bl: 0.6, sm: 0.7, pf: 0, yw: 0 },
  sleepy: { lid: 1, shut: 'sleep', bt: -0.2, by: -0.1, mw: 0.7, ms: 0.15, mo: 0.1, te: 0, bl: 0.5, sm: 0, pf: 0, yw: 0 },
  hurt: { lid: 1, shut: 'squeeze', bt: -0.8, by: 0.2, mw: 0.9, ms: -0.7, mo: 0.6, te: 0.5, bl: 0.7, sm: 0, pf: 0, yw: 0 },
  dizzy: { lid: 1, shut: 'dizzy', bt: -0.5, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.45, te: 0, bl: 0.5, sm: 0, pf: 0, yw: 0 },
  sad: { lid: 0, shut: 'happy', bt: -0.95, by: 0.3, mw: 0.8, ms: -0.6, mo: 0, te: 0, bl: 0.4, sm: 0.15, pf: 0, yw: 0 },
  worried: { lid: 0, shut: 'happy', bt: -0.8, by: 0.5, mw: 0.8, ms: -0.4, mo: 0.15, te: 0, bl: 0.5, sm: 0.1, pf: 0, yw: 0 },
  cross: { lid: 0, shut: 'happy', bt: 0.95, by: -0.4, mw: 0.9, ms: -0.45, mo: 0.1, te: 0.6, bl: 0.45, sm: 0.1, pf: 0, yw: 0 },
  talk: { lid: 0, shut: 'happy', bt: 0.1, by: 0.4, mw: 0.9, ms: 0.3, mo: 0.4, te: 0, bl: 0.5, sm: 0, pf: 0, yw: 0 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.6, 0.1, 0.8], [1.1, 0.4, 0.55], [0.9, 0.3, 0.25], [0.7, 0.2, 0], [0.8, 0.2, 0.6]];
const EYE = { w: 3.0, h: 3.4 };

function eye(ctx, a, x, y, side, f, look) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.hsUid ?? 0) * 0.53) % 5.6, 5.1, 5.2, 5.28, 5.42) : 0;
  const L = Math.max(f.lid, blink);
  const closedW = sstep((L - 0.93) / 0.07);
  const shutW = blink > f.lid + 0.05 ? { happy: 0, sleep: 1, squeeze: 0, dizzy: 0 } : f.shut;
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    for (const s of SHUTS) {
      const sw = shutW[s];
      if (sw <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= sw;
      pen(ctx, tone(a, LASH), 0.95);
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (s === 'happy') {
        ctx.moveTo(x - w, y + 1);
        ctx.quadraticCurveTo(x, y - h * 0.9, x + w, y + 1);
      } else if (s === 'sleep') {
        ctx.moveTo(x - w, y);
        ctx.quadraticCurveTo(x, y + h * 0.55, x + w, y);
      } else if (s === 'squeeze') {
        ctx.moveTo(x + side * w, y - 2);
        ctx.quadraticCurveTo(x - side * w * 0.2, y - 0.3, x - side * w * 0.9, y + 0.2);
        ctx.quadraticCurveTo(x - side * w * 0.2, y + 0.8, x + side * w, y + 2.2);
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
  ell(ctx, x, y, w, h);
  ctx.fillStyle = tone(a, '#fffdfc');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, w, h);
  ctx.clip();
  const small = 1 - 0.3 * f.sm;
  const ix = x + side * 0.15 + (look?.[0] ?? 0) * 0.6;
  const iy = y + 0.4 + (look?.[1] ?? 0) * 0.5;
  const ir = [2.45 * small, 2.75 * small];
  const g = ctx.createRadialGradient(ix, iy + 1, 0.3, ix, iy, ir[1]);
  g.addColorStop(0, tone(a, IRIS[1]));
  g.addColorStop(0.65, tone(a, IRIS[2]));
  g.addColorStop(1, tone(a, IRIS[3]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, ix, iy + 0.1, 1.45 * small, 1.6 * small);
  ctx.fillStyle = tone(a, '#14142e');
  ctx.fill();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.3);
  sg.addColorStop(0, 'rgba(120,70,100,0.3)');
  sg.addColorStop(1, 'rgba(120,70,100,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.2, w * 2.6, h);
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - side * 0.85, iy - 1.0 * small, 0.95, 0.9);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ix, iy + 0.2, ir[0] * 0.72, ir[1] * 0.72, 0, 0.5, 1.4);
  pen(ctx, 'rgba(255,255,255,0.75)', 0.35);
  ctx.stroke();
  if (L > 0.01) {
    ctx.fillStyle = tone(a, HIDE[1]);
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
      pen(ctx, tone(a, LASH), 0.8);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.92, y - h * 0.45);
  ctx.quadraticCurveTo(x, y - h * 1.32, x + side * w * 0.98, y - h * 0.5);
  ctx.quadraticCurveTo(x + side * (w + 0.7), y - h * 0.6, x + side * (w + 1.05), y - h * 0.95);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, LASH), 0.85);
  ctx.stroke();
  ctx.restore();
}
// A thick round bushy brow.
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.by * 1.1);
  ctx.rotate(side * f.bt * 0.4);
  smooth(ctx, [[-2.4, 0.6], [-2, -0.8], [0, -1.3], [2, -0.8], [2.5, 0.5], [0, 0.6]]);
  ctx.fillStyle = tone(a, HIDE[3]);
  ctx.fill();
  ctx.restore();
}
// His mouth: a wide soft line under the muzzle (the moustache over it); opens; the great yawn.
function mouth(ctx, a, x, y, f) {
  const w = 3.6 * f.mw;
  const cy = y - f.ms * 0.6;
  const o = Math.max(f.mo, f.yw * 2.6);
  if (o > 0.08) {
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.3 - o * 0.4, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.6 + o * 2.8, x - w, cy);
    ctx.fillStyle = tone(a, '#7a2a40');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x + 0.2, y + o * 2.4, w * 0.62, o * 1);
    ctx.fillStyle = tone(a, '#f2889e');
    ctx.fill();
    // two little round teeth at the corners (a hippo's), soft
    for (const s of [-1, 1]) {
      ell(ctx, x + s * w * 0.62, cy + 0.5, 0.7, 0.9);
      ctx.fillStyle = tone(a, '#ffffff', Math.max(f.te, f.yw));
      ctx.fill();
    }
    ctx.restore();
    pen(ctx, tone(a, '#5a2034'), 0.5);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, '#7a3a50'), 0.65);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - w, cy - 0.3);
    ctx.quadraticCurveTo(x, y + 1.3 + f.ms * 0.5, x + w, cy - 0.5 - f.ms * 0.2);
    ctx.stroke();
  }
}
// His head and great muzzle, one shape; his eye bumps.
function headPath(ctx, tx, yw) {
  ctx.beginPath();
  ctx.ellipse(-0.6, -3, 14.6, 12.6, 0, 0, TAU);
  // (the muzzle: wide and soft, a touch forward; the jaw drops for a yawn)
  ctx.moveTo(tx + 19.6, 6.6 + yw * 2);
  ctx.ellipse(tx + 3.6, 6.6 + yw * 2, 16, 9.4 + yw * 2.4, 0, 0, TAU);
}
function ear(ctx, a, mode, x, y, r, rot, far) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ell(ctx, 0, -r * 0.4, r, r * 1.15);
  paint(ctx, a, mode, far ? HIDE[2] : HIDE[1]);
  if (mode === 'fill') {
    ell(ctx, 0, -r * 0.4, r * 0.55, r * 0.7);
    ctx.fillStyle = tone(a, '#f6a8bc', far ? 0.55 : 0.85);
    ctx.fill();
  }
  ctx.restore();
}
// His curled moustache: two curls each rooted under his nostrils, each a short chain on its spring,
// curling up at the end.
function moustache(ctx, a, mode, tx, yw) {
  const q = a.hsQ ?? {};
  const sw = q.stache ?? [0, 0];
  const cx = tx + 7.2;
  const cy = 4.6 + yw * 1.2;
  for (const [s, k] of [[-1, 0], [1, 1]]) {
    const pts = chain([cx + s * 0.6, cy], [Math.PI / 2 - s * 1.25 + sw[k], -s * 0.5 + sw[k] * 1.2 - Math.PI / 2 * (s < 0 ? 0 : 0) + (s < 0 ? Math.PI : 0), (s < 0 ? Math.PI + 1.5 : -1.5) + sw[k] * 1.4], [3.2, 2.6, 1.8]);
    poly(ctx, tube(pts, [2.4, 2.1, 1.6, 1.1], 0.6));
    paint(ctx, a, mode, STACHE[1], STACHE[2]);
    if (mode === 'fill') {
      poly(ctx, tube(pts.slice(0, 3), [0.8, 0.7, 0.5], 0.5));
      ctx.fillStyle = tone(a, STACHE[0], 0.8);
      ctx.fill();
    }
  }
}
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.hsQ ?? {};
  const f = a.hsF;
  const turn = q.turn ?? 0.35;
  const tx = turn * 2.4;
  const yw = f?.yw ?? 0;
  const ew = q.earW ?? [0, 0];
  ear(ctx, a, mode, 10.4, -12.6, 3.2, 0.45 + ew[1], true);
  // the eye bumps up on top of his head
  const ex = (s) => (s < 0 ? -4.4 + tx * 0.7 : 6 + tx);
  for (const s of [-1, 1]) {
    ell(ctx, ex(s), -8.6, 5, 4.6);
    paint(ctx, a, mode, HIDE[1]);
  }
  headPath(ctx, tx, yw);
  paint(ctx, a, mode, HIDE[1]);
  if (mode === 'fill' && f) {
    ctx.save();
    headPath(ctx, tx, yw);
    for (const s of [-1, 1]) {
      ctx.moveTo(ex(s) + 5, -8.6);
      ctx.ellipse(ex(s), -8.6, 5, 4.6, 0, 0, TAU);
    }
    ctx.clip();
    glow(ctx, tx - 3, -11, 13, HIDE[0], 0.9);
    glow(ctx, -14, 2, 9, HIDE[2], 0.55);
    // the pale muzzle, lit on top
    ell(ctx, tx + 3.6, 8 + yw * 2, 14.6, 7.6 + yw * 2.2);
    ctx.fillStyle = tone(a, PALE[1]);
    ctx.fill();
    glow(ctx, tx + 4, 3.4, 9, PALE[0], 0.85);
    glow(ctx, tx + 4, 15 + yw * 4, 9, HIDE[2], 0.4);
    ctx.restore();
    // cheeks (puffed when he strains)
    for (const [cx, s] of [[tx - 8.4, 0.85], [tx + 13.4, 1]]) {
      if (f.pf > 0.02) {
        ell(ctx, cx, 6.4, 3 * f.pf + 0.01, 2.7 * f.pf + 0.01);
        ctx.fillStyle = tone(a, PALE[0], 0.85 * f.pf);
        ctx.fill();
      }
      ell(ctx, cx, 6.6, 2.6 + f.pf * 0.8, 1.5 + f.pf * 0.6);
      ctx.fillStyle = tone(a, '#ff8eaa', (0.25 + 0.45 * f.bl) * s);
      ctx.fill();
    }
    for (const s of [-1, 1]) eye(ctx, a, ex(s), -7.6, s, f, q.look);
    for (const s of [-1, 1]) brow(ctx, a, ex(s) + s * 0.3, -12.8, s, f);
    // the two round nostrils on top of his muzzle
    for (const dx of [3.4, 9.6]) {
      ell(ctx, tx + dx, 1.6 + yw * 0.6, 1.3, 0.9, dx < 6 ? 0.3 : -0.3);
      ctx.fillStyle = tone(a, HIDE[3]);
      ctx.fill();
      ell(ctx, tx + dx - 0.3, 1.2 + yw * 0.6, 0.45, 0.3);
      ctx.fillStyle = tone(a, PALE[0], 0.6);
      ctx.fill();
    }
    mouth(ctx, a, tx + 6.6, 10.2 + yw * 1.6, f);
    if (q.sweat >= 0) sweat(ctx, tx - 13, -6 + q.sweat * 3, 1.1);
  }
  moustache(ctx, a, mode, tx, yw);
  ear(ctx, a, mode, -10.6, -12.2, 3.3, -0.4 + ew[0], false);
  WK = 1;
  ctx.restore();
}

// ---------- His suit, belt, wristbands, feet ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
// The striped strongman suit: cherry and cream stripes round his barrel, wide shoulder straps (his
// shoulders and upper chest bare), the champion's belt; all cut from his own outline.
function suit(ctx, a, mode, D) {
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
  // the suit's body: from a scooped neckline down past his hips
  const body = chaikin([C([st[0] - 30, st[1] + 8]), C([st[0] - 9, st[1] + 4]), C([st[0] + 2, st[1] + 7.6]), C([st[0] + 13, st[1] + 4]), C([st[0] + 30, st[1] + 8]), T([hp[0] + 30, hp[1] + 30]), T([hp[0] - 30, hp[1] + 30])], 1);
  poly(ctx, body);
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  ctx.save();
  poly(ctx, body);
  ctx.clip();
  // the cherry stripes, curving round his barrel (each carried by the bone it sits on)
  for (let i = 0; i < 7; i++) {
    const y0 = st[1] + 6 + i * 4.2;
    const P = y0 < st[1] + 16 ? C : y0 < nv[1] - 1 ? W : T;
    const dy = P === T ? hp[1] - st[1] - 22 : 0;
    ctx.beginPath();
    ctx.moveTo(...P([st[0] - 30, y0 - 1 - dy * 0]));
    ctx.quadraticCurveTo(...P([st[0] + 2, y0 + 2]), ...P([st[0] + 30, y0 - 1]));
    ctx.lineTo(...P([st[0] + 30, y0 + 1.1]));
    ctx.quadraticCurveTo(...P([st[0] + 2, y0 + 4.1]), ...P([st[0] - 30, y0 + 1.1]));
    ctx.closePath();
    ctx.fillStyle = tone(a, RED[1]);
    ctx.fill();
  }
  const bg = W([nv[0] + 4, nv[1] - 6]);
  glow(ctx, bg[0], bg[1], 8, CREAM[0], 0.45);
  const sh = W([nv[0] - 12, nv[1]]);
  glow(ctx, sh[0], sh[1], 8, RED[3], 0.25);
  ctx.restore();
  // the straps over his shoulders
  for (const [x0, x1] of [[-8, -13], [11, 15]]) {
    ctx.beginPath();
    ctx.moveTo(...C([st[0] + x0, st[1] + 5]));
    ctx.lineTo(...C([st[0] + x1, st[1] - 4]));
    pen(ctx, tone(a, RED[1]), 2.4);
    ctx.stroke();
  }
  // the gold champion's belt, a star buckle
  ctx.beginPath();
  ctx.moveTo(...W([nv[0] - 30, nv[1] + 0.6]));
  ctx.lineTo(...W([nv[0] + 30, nv[1] + 0.6]));
  pen(ctx, tone(a, GOLD[2]), 3.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(...W([nv[0] - 30, nv[1] - 0.2]));
  ctx.lineTo(...W([nv[0] + 30, nv[1] - 0.2]));
  pen(ctx, tone(a, GOLD[1]), 1.4);
  ctx.stroke();
  ctx.restore();
  const bk = W([nv[0] + 5, nv[1] + 0.4]);
  ell(ctx, bk[0], bk[1], 2.4, 2.2);
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  pen(ctx, tone(a, GOLD[3]), 0.35);
  ctx.stroke();
  ctx.save();
  ctx.translate(bk[0], bk[1]);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i / 10) * TAU;
    const r = i % 2 ? 0.55 : 1.4;
    if (i) ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
    else ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r);
  }
  ctx.closePath();
  ctx.fillStyle = tone(a, GOLD[0]);
  ctx.fill();
  ctx.restore();
}
// A suit leg round the top of his thigh, striped, a cherry hem (rig space).
function suitLeg(ctx, a, mode, D, k) {
  const H = ptOf(a, D, `thigh${k}`, D.J[`hip${k}`]);
  const K = ptOf(a, D, `shin${k}`, D.J[`knee${k}`]);
  const an = Math.atan2(K[1] - H[1], K[0] - H[0]);
  const L = Math.hypot(K[0] - H[0], K[1] - H[1]);
  ctx.save();
  ctx.translate(H[0], H[1]);
  ctx.rotate(an);
  const pts = chaikin([[-3, -5.4], [L * 0.45, -5.8], [L * 0.62, -5], [L * 0.66, 0], [L * 0.62, 5], [L * 0.45, 5.8], [-3, 5.4]], 2);
  poly(ctx, pts);
  if (mode === 'line') {
    pen(ctx, RED[3], LW * 1.3);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, k === 'N' ? CREAM[1] : CREAM[2]);
    ctx.fill();
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    for (const x of [-1, 2.6]) {
      ctx.fillStyle = tone(a, k === 'N' ? RED[1] : RED[2]);
      ctx.fillRect(x, -7, 1.8, 14);
    }
    ctx.fillStyle = tone(a, k === 'N' ? RED[2] : RED[3]);
    ctx.fillRect(L * 0.55, -7, 1.4, 14);
    ctx.restore();
  }
  ctx.restore();
}
// A cherry wristband round his forearm, just above his paw (rig space).
function wristband(ctx, a, mode, D, k) {
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const Wr = ptOf(a, D, `arm${k}f`, D.J[`wr${k}`]);
  const M = [mix(E[0], Wr[0], 0.68), mix(E[1], Wr[1], 0.68)];
  const an = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]);
  ctx.save();
  ctx.translate(...M);
  ctx.rotate(an);
  smooth(ctx, [[-1.3, -2.5], [1.3, -2.5], [1.4, 2.5], [-1.3, 2.5]]);
  if (mode === 'line') {
    pen(ctx, RED[3], LW * 1.3);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, k === 'N' ? RED[1] : RED[2]);
    ctx.fill();
    ctx.fillStyle = tone(a, CREAM[1], k === 'N' ? 0.9 : 0.5);
    ctx.fillRect(-0.25, -2.6, 0.55, 5.2);
  }
  ctx.restore();
}
// A big round paw.
function paw(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  ctx.scale(1.2, 1.2);
  const near = k === 'N';
  smooth(ctx, [[-5.4, -3.4], [-2, -5.6], [3, -5.4], [5.6, -1.6], [5.4, 3.2], [2, 5.6], [-2.6, 5.4], [-5.6, 1.6]]);
  paint(ctx, a, mode, near ? HIDE[1] : HIDE[2], INK, LW / 1.2);
  if (mode === 'fill') glow(ctx, -1, -1.6, 4, HIDE[0], near ? 0.75 : 0.3);
  ctx.restore();
}
function foot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 6, p[1] - 3.6], [p[0], p[1] - 4.6], [p[0] + 6, p[1] - 3], [p[0] + 9, p[1] + 0.6], [p[0] + 8.6, p[1] + 3.6], [p[0] - 6.4, p[1] + 3.6], [p[0] - 7, p[1] + 0.2]]);
  paint(ctx, a, mode, near ? HIDE[1] : HIDE[2]);
  if (mode === 'fill') {
    glow(ctx, p[0] + 1, p[1] - 1.6, 5, HIDE[0], near ? 0.7 : 0.3);
    for (const dx of [4.4, 6.6, 8.2]) {
      ell(ctx, p[0] + dx, p[1] + 2.6, 0.9, 0.7);
      ctx.fillStyle = tone(a, HIDE[3], 0.6);
      ctx.fill();
    }
  }
  ctx.restore();
}
function tail(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const an = a.hsTail ?? 2.4;
  const pts = chain([h[0] - 16, h[1] - 2], [an, an + 0.2], [3.4, 2.6]);
  poly(ctx, tube(pts, [3.2, 2.6, 2.4], 0.6));
  paint(ctx, a, mode, HIDE[2]);
  ctx.restore();
}
function key(ctx, a, mode, D) {
  const q = a.hsQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  ctx.translate(st[0] - 18.6, st[1] + 9);
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

// ---------- The barbell (rig space) ----------
// The bar runs through both his paws (its middle between them), the weights out past each; set down,
// it rests on the floor in front of him.
const WR = 4.8;
function barAt(a, D) {
  const q = a.hsQ ?? {};
  const hN = ptOf(a, D, 'handN', D.J.handN);
  const hF = ptOf(a, D, 'handF', D.J.handF);
  let c = [(hN[0] + hF[0]) / 2, (hN[1] + hF[1]) / 2];
  let ang = Math.atan2(hN[1] - hF[1], hN[0] - hF[0]);
  const down = clamp(q.barDown ?? 0, 0, 1);
  if (down > 0) {
    const [bx] = ptOf(a, D, 'torso', D.J.hip);
    c = [mix(c[0], bx + 4, down), mix(c[1], -WR, down)];
    ang = mix(ang, 0, down);
  }
  const half = 13;
  return { c, ang, ends: [-1, 1].map((s) => [c[0] + Math.cos(ang) * half * s, c[1] + Math.sin(ang) * half * s]) };
}
function barbell(ctx, a, D, part) {
  const B = barAt(a, D);
  const q = a.hsQ ?? {};
  ctx.save();
  ctx.lineCap = 'round';
  if (part === 'bar') {
    ctx.beginPath();
    ctx.moveTo(...B.ends[0]);
    ctx.lineTo(...B.ends[1]);
    pen(ctx, tone(a, STEEL[3]), 2.4);
    ctx.stroke();
    pen(ctx, tone(a, STEEL[1]), 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(B.ends[0][0], B.ends[0][1] - 0.4);
    ctx.lineTo(B.ends[1][0], B.ends[1][1] - 0.4);
    pen(ctx, tone(a, STEEL[0], 0.7), 0.4);
    ctx.stroke();
  }
  if (part === 'near' || part === 'far') {
    // the weights: round, charcoal-plum, a gold rim, "100" painted on, a shine
    for (const [i, e] of B.ends.entries()) {
      if (part === 'far' && i === 1) continue;
      if (part === 'near' && i === 0) continue;
      const wob = (q.wob ?? 0) * (i ? 1 : -1);
      ctx.save();
      ctx.translate(e[0], e[1] + wob);
      ell(ctx, 0, 0, WR, WR);
      pen(ctx, tone(a, WEIGHT[3]), LW * 1.6);
      ctx.stroke();
      const g = ctx.createRadialGradient(-WR * 0.35, -WR * 0.4, 0.5, 0, 0, WR);
      g.addColorStop(0, tone(a, WEIGHT[0]));
      g.addColorStop(0.6, tone(a, WEIGHT[1]));
      g.addColorStop(1, tone(a, WEIGHT[2]));
      ctx.fillStyle = g;
      ctx.fill();
      ell(ctx, 0, 0, WR * 0.82, WR * 0.82);
      pen(ctx, tone(a, GOLD[1], 0.85), 0.6);
      ctx.stroke();
      ell(ctx, -WR * 0.38, -WR * 0.42, WR * 0.26, WR * 0.16, -0.6);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
      // (the painted number reads the right way round whichever way he faces)
      if (a.flip) ctx.scale(-1, 1);
      ctx.font = '900 4px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = tone(a, GOLD[0], 0.9);
      ctx.fillText('100', 0, 0.6);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ---------- His act and his fight ----------
const SWINGS = ['slam', 'bump', 'yawn'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.hsN ?? 0) % SWINGS.length]);
// The barbell carried low before him in both paws (a strongman's carry: his face kept clear).
const SHOULDER = { shN: 14, elN: -46, hwN: 16, shF: 2, elF: -50, hwF: 16 };
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'proud', look: [0.4, 0], turn: 0.35, sweat: -1, fx: null, keyRate: 1.3, barDown: 0, wob: 0, belly: 0 };
  a.hsQ = q;
  a.hsUid = (m.uid ?? 0) % 7;
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
  const breath = Math.sin(t * 1.3);
  const cineMood = m.cine?.mood;
  const alive = m.hp > 0;
  const low = alive && m.hp / m.def.hp < 0.3;
  const since = now - (m.attackAt ?? -9);
  const anticK = m.windup > 0 ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.7), 0, 1) : 0;
  const swinging = alive && (anticK > 0 || (since >= 0 && since < 1.1));
  if (swinging && !st.hsAtk) {
    st.hsN = (st.hsN ?? (m.uid ?? 0)) + 1;
    st.hsPick = pickSwing(m, st);
  }
  st.hsAntic = swinging ? Math.max(anticK, st.hsAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 1.1;
  st.hsAtk = swinging;
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;
  const busy = !alive || swinging;
  if (busy) st.hsFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.hsFreeAt ?? -9)) / 0.4);

  // Standing: chest out, the barbell across his shoulders, a slow proud breath.
  go({ ...SHOULDER, tilt: -3, chest: -3 + breath * 1, head: -2 + Math.sin(t * 0.6) * 1.2 }, 1);
  if (walkW > 0.01) {
    q.turn = mix(q.turn, 0.55, walkW);
    q.wob = Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2) * 0.6 * walkW;
  }
  if (fighting && !busy) {
    go({ tilt: 3, head: 4 }, 0.8 * freeK);
    say('focus');
    q.turn = 0.55;
    q.keyRate = 2.2;
  }
  if (fighting && !st.hsHunt) st.hsBangAt = now;
  if (!fighting && st.hsHunt && alive) st.hsLostAt = now;
  st.hsHunt = fighting;
  q.bang = now - (st.hsBangAt ?? -9);
  q.huh = now - (st.hsLostAt ?? -9);
  if (alive && !busy && q.bang >= 0 && q.bang < 0.9) {
    const k = win(q.bang, 0, 0.12, 0.5, 0.9) * freeK;
    go({ head: -8, tilt: -3 }, k);
    say('startled', k);
  }
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // a flex for the crowd, the bar still up on his shoulders
    const k = win(gloat, 0, 0.25, 0.9, 1.4) * freeK;
    go({ tilt: -5, chest: -6, head: -6 }, k);
    say('beam', k);
    q.fx = { kind: 'gloat', u: gloat };
  }
  if (!alive) {
    // beaten: sat down with a bump, the barbell dropped in front of him, dizzy
    st.hsDeadAt ??= now;
    go({ drop: 0.8, tilt: -10, head: 14, shN: 20, elN: -40, shF: 30, elF: -30, fxN: 0.4, fxF: 0.15 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.keyRate = 0;
    q.barDown = 1;
    q.fx = { kind: 'beaten', u: now - st.hsDeadAt };
  } else st.hsDeadAt = undefined;

  if (alive) {
    if (swinging) {
      const kind = st.hsPick ?? 'slam';
      const hitK = struck ? (since < 0.12 ? sstep(since / 0.12) : 1 - sstep((since - 0.45) / 0.6)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.hsAntic) * (since < 0.12 ? 1 : 0) : sstep(anticK);
      q.keyRate = 3.6;
      if (kind === 'slam') {
        // Barbell Slam: heaved high over his head, leaning back; then brought down before him, BOOM
        go({ shN: -172, elN: -8, shF: -168, elF: -8, tilt: -12, head: -10, chest: -6, lift: 0.02 }, wK);
        go({ shN: -60, elN: -10, shF: -54, elF: -10, tilt: 18, head: 10, drop: 0.2, x: 0.04 }, hitK);
        q.slamDown = hitK;
        q.wob = Math.sin(now * 22) * 0.8 * wK;
        say(hitK > 0.2 ? 'fierce' : 'strain');
        q.fx = { kind: struck ? 'slam' : 'ready', u: struck ? since : now };
      } else if (kind === 'bump') {
        // Belly Bump: a great breath in, leaning back; then his tummy bumped into you
        go({ tilt: -10, chest: -8, head: -6, x: -0.02 }, wK);
        go({ tilt: -16, chest: -10, head: -8, x: 0.1, pelvis: 8 }, hitK);
        q.belly = Math.max(wK, hitK);
        say(hitK > 0.2 ? 'beam' : 'strain');
        q.fx = { kind: struck ? 'bump' : 'ready', u: struck ? since : now };
      } else {
        // Big Yawn: a stretch, his head back; then a yawn so huge it blows you back
        go({ tilt: -8, head: -18, chest: -6 }, wK);
        go({ tilt: 10, head: 6, x: 0.03 }, hitK);
        say(wK > 0.3 || hitK > 0.2 ? 'yawn' : 'focus');
        q.fx = { kind: struck ? 'yawn' : 'ready', u: struck ? since : now };
      }
    } else if (hurt) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -12, x: -0.02 }, k);
      q.wob = Math.sin(hurtU * 30) * 1.2 * k;
      say('hurt', k * 2);
      q.earKick = k;
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const nap = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
    st.hsNap = mix(st.hsNap ?? 0, nap && !busy ? 1 : 0, 1 - Math.exp(-dt * 3));
    if (st.hsNap > 0.01) {
      // a nap leant on his barbell, set down before him
      const k = sstep(st.hsNap);
      go({ tilt: 14, head: 14 + Math.sin(t * 1.1) * 2, shN: -40, elN: -50, shF: -36, elF: -50, chest: 2 + Math.sin(t * 1.1) }, k);
      q.barDown = Math.max(q.barDown, k);
      if (k > 0.5) {
        q.mood = 'sleepy';
        q.fx = { kind: 'nap', u: t };
        q.keyRate = 0.2;
      }
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.hsCalm = mix(st.hsCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.hsCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, q, sstep(st.hsCalm), t, now, st);
    if (cineMood && !busy) q.mood = { angry: 'cross', happy: 'beam', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !busy) {
      if (!cineMood) q.mood = q.mood === 'proud' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
      q.keyRate *= 0.5;
    }
    if (m.talking) q.mood = 'talk';
  }
  q.turn = spring(st, 'hsTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.proud;
  const f = (st.hsF ??= { ...FACES.proud, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'bt', 'by', 'mw', 'ms', 'mo', 'te', 'bl', 'sm', 'pf', 'yw']) f[k] = mix(f[k], tgt[k], k === 'lid' ? 1 - Math.exp(-dt * (tgt.lid > f.lid ? 40 : 18)) : k === 'yw' ? 1 - Math.exp(-dt * 6) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.hsF = f;
  const kick = (st.hsLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.hsLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.hsLast = out.head;
  st.hsLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  q.earW = [0, 1].map((i) => spring(st, `ear${i}`, (q.earKick ?? 0) * (i ? 0.4 : -0.4) + Math.sin(t * 1.7 + i * 2) * 0.05 + (q.mood === 'sad' ? (i ? 0.3 : -0.3) : 0), 110, 9, dt, kick * 0.01));
  q.stache = [0, 1].map((i) => spring(st, `st${i}`, Math.sin(t * 1.4 + i) * 0.06 - ((out.head ?? 0) * Math.PI) / 180 * 0.3 + step * 0.1, 90, 7, dt, kick * 0.012));
  a.hsTail = spring(st, 'tail', 2.4 + Math.sin(t * 2.2) * 0.15 + step * 0.2, 90, 8, dt, kick * 0.01);
  q.barDown = clamp(spring(st, 'barDown', q.barDown, 120, 16, dt), 0, 1);

  q.wob = spring(st, 'wob', q.wob, 120, 8, dt, kick * 0.02);
  st.hsKeyRate = mix(st.hsKeyRate ?? q.keyRate, q.keyRate, 1 - Math.exp(-dt * 3));
  st.hsKeyA = ((st.hsKeyA ?? (m.uid ?? 0) * 0.7) + st.hsKeyRate * dt) % (TAU * 100);
  q.keyA = st.hsKeyA;
}
const PIECES = [
  { name: 'pose', t0: 0.4, len: 7 },
  { name: 'press', t0: 8, len: 7.4 },
  { name: 'yawn', t0: 16, len: 6 },
  { name: 'rest', t0: 22.6, len: 7 },
];
function idleAct(m, a, out, go, add, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.hsPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.hsPiece = cur.name;
      else return;
    }
  } else {
    st.hsPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'pose') {
    // the barbell set down; a double-biceps flex; a side-chest flex; a twinkle; picked back up
    const k = win(u, 0, 0.5, 6.4, 7);
    const down = win(u, 0.3, 1.0, 5.6, 6.4);
    const flex1 = win(u, 1.2, 1.6, 2.8, 3.2);
    const flex2 = win(u, 3.3, 3.7, 4.9, 5.3);
    go({ shN: -30, elN: -40, shF: -24, elF: -40, tilt: 6 }, down * k * w);
    go({ shN: -95, elN: -130, hwN: -20, shF: -95, elF: -130, hwF: -20, tilt: -4, chest: -6, head: -6 }, flex1 * k * w);
    go({ shN: -30, elN: -110, shF: -50, elF: -120, turnC: 0.5, tilt: -2, chest: -4, head: 4 }, flex2 * k * w);
    if (at(k)) {
      q.barDown = down;
      q.mood = flex1 + flex2 > 0.3 ? 'beam' : 'proud';
      if (flex1 > 0.5 || flex2 > 0.5) q.fx = { kind: 'flex', u: flex1 > 0.5 ? u - 1.6 : u - 3.7 };
    }
  } else if (cur.name === 'press') {
    // three presses overhead, cheeks puffed; a wobble on the last; back to his shoulders
    const k = win(u, 0, 0.5, 6.8, 7.4);
    const on = win(u, 0.5, 1.0, 5.8, 6.6);
    const ph = Math.max(0, u - 1.0) / 1.5;
    const up = ph < 3 ? sstep(Math.sin(Math.PI * (ph % 1))) : 0;
    go({ shN: mix(-146, -172, up), elN: mix(-96, -8, up), shF: mix(-136, -168, up), elF: mix(-96, -8, up), tilt: -4 * up, head: -6 * up }, on * k * w);
    if (at(k)) {
      q.wob = ph > 2 && ph < 3 ? Math.sin(u * 20) * 1.4 * up : 0;
      q.mood = up > 0.3 ? 'strain' : u > 5.8 ? 'beam' : 'focus';
      if (u > 5.8) q.fx = { kind: 'phew', u: u - 5.8 };
    }
  } else if (cur.name === 'yawn') {
    // a huge hippo yawn and a stretch
    const k = win(u, 0, 0.5, 5.4, 6);
    const yawn = win(u, 0.6, 1.4, 3.0, 3.8);
    go({ head: -20, tilt: -6, chest: -6, shN: -160, elN: -60, shF: -150, elF: -60 }, yawn * k * w);
    if (at(k)) {
      q.mood = yawn > 0.3 ? 'yawn' : 'proud';
      if (u > 3.6 && u < 4.8) q.fx = { kind: 'smack', u: u - 3.6 };
    }
  } else {
    // the barbell set down; he leans on it for forty winks; spots you, "!", hoists it, flexes
    const k = win(u, 0, 0.5, 6.4, 7);
    const lean = win(u, 0.4, 1.2, 4.0, 4.4);
    const nod = sstep((u - 1.4) / 1.8) * (1 - sstep((u - 4.0) / 0.2));
    const hoist = win(u, 4.4, 4.9, 6.0, 6.6);
    go({ tilt: 16, head: 10 + nod * 10, shN: -40, elN: -50, shF: -36, elF: -50 }, lean * k * w);
    go({ tilt: -6, chest: -6, head: -6 }, hoist * k * w);
    if (at(k)) {
      q.barDown = lean;
      q.mood = u < 1.4 ? 'proud' : u < 4.0 ? 'sleepy' : u < 4.5 ? 'startled' : 'beam';
      if (u > 1.6 && u < 4.0) q.fx = { kind: 'doze', u: u - 1.6 };
      if (u > 4.0 && u < 4.9) q.fx = { kind: 'spotted', u: u - 4.0 };
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
  // his marks sit on a little round weight plate
  ell(ctx, 0, 0, 5, 5);
  ctx.fillStyle = '#fff8fa';
  ctx.fill();
  pen(ctx, mark === '!' ? '#b43246' : '#5a68b8', 1);
  ctx.stroke();
  ell(ctx, 0, 0, 4, 4);
  pen(ctx, 'rgba(196,146,52,0.5)', 0.4);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#e04a5a' : '#5a68b8';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.7);
    ctx.lineTo(0, 0.4);
  } else {
    ctx.moveTo(-1.4, -1.5);
    ctx.quadraticCurveTo(-1.1, -3.2, 0.4, -3);
    ctx.quadraticCurveTo(1.9, -2.7, 1.3, -1.1);
    ctx.quadraticCurveTo(0.3, -0.4, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.2, 0.8, 0.8);
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
  pen(ctx, '#5a68b8', 1.3);
  ctx.stroke();
  pen(ctx, '#f2f4ff', 0.55);
  ctx.stroke();
  ctx.restore();
}
// A gust of breath: three soft white curls rolling out.
function gust(ctx, x, y, u, s = 1) {
  for (let i = 0; i < 3; i++) {
    const v = clamp(u * 1.5 - i * 0.15, 0, 1);
    if (v <= 0 || v >= 1) continue;
    ctx.save();
    ctx.globalAlpha *= (1 - v) * 0.9;
    ctx.beginPath();
    const cx = x + v * 22 * s;
    const cy = y + (i - 1) * 3.6;
    ctx.arc(cx, cy, 2.4 + v * 2, -1.2, 1.6);
    pen(ctx, '#c8cce8', 1.6);
    ctx.stroke();
    pen(ctx, '#ffffff', 0.7);
    ctx.stroke();
    ctx.restore();
  }
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  const q = a.hsQ ?? {};
  // (the bar in front of him while it's below his chin: carried, set down, slammed; behind him when
  // it's lifted up over his head)
  const B = barAt(a, D);
  q.barFront = B.c[1] > headAt(a, D, [0, 14])[1];
  for (const mode of ['line', 'fill']) {
    key(ctx, a, mode, D);
    tail(ctx, a, mode, D);
  }
  // the barbell on his shoulders goes behind his head and body (its far weight behind, always)
  if (!q.barFront) {
    barbell(ctx, a, D, 'bar');
    barbell(ctx, a, D, 'far');
    barbell(ctx, a, D, 'near');
  } else barbell(ctx, a, D, 'far');
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.hsQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  // the near weight in front of him; set down, the whole bar in front
  if (q.barFront) {
    barbell(ctx, a, D, 'bar');
    barbell(ctx, a, D, 'near');
  }
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -18]);
  const hd = headAt(a, D, [4, 0]);
  const mouthP = headAt(a, D, [(q.turn ?? 0.35) * 2.4 + 12, 12]);
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0) bubble(ctx, crown[0] + 4, crown[1] - 7, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0) bubble(ctx, crown[0] + 4, crown[1] - 7, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  const B = barAt(a, D);
  if (X.kind === 'ready') {
    sparkle(ctx, B.ends[1][0] + 3, B.ends[1][1] - 6, 1.6 + Math.sin(t * 9) * 0.6, 0.7, '#fff6c8');
  } else if (X.kind === 'slam') {
    if (u > 0.08 && u < 0.9) {
      const v = clamp((u - 0.08) / 0.7, 0, 1);
      dust(ctx, B.c[0] + 10, -1.5, 3 + v * 5, 0.8 * (1 - v), '#fdf0f4', '#d8b8c8');
      dust(ctx, B.c[0] - 6, -1.5, 2.6 + v * 4, 0.7 * (1 - v), '#fdf0f4', '#d8b8c8');
      for (let i = 0; i < 4; i++) star(ctx, B.c[0] + 4 + (i - 1.5) * 7 * (0.6 + v), -4 - Math.sin(Math.PI * clamp(v * 1.4 - i * 0.1, 0, 1)) * 8, 1.8 * (1 - v), i, 1 - v);
      cue(ctx, 'BOOM!', hd[0] + 22, hd[1] - 14, 7.5, fl, -0.1, '#b43246');
    }
  } else if (X.kind === 'bump') {
    if (u > 0.05 && u < 0.6) {
      const k = clamp(u / 0.5, 0, 1);
      const bp = ptOf(a, D, 'waistB', [D.J.navel[0] + 26, D.J.navel[1] - 4]);
      for (let i = 0; i < 3; i++) sparkle(ctx, bp[0] + 2 + k * 6, bp[1] + (i - 1) * 4, 1.8 * (1 - k), 1 - k, '#fff6c8');
      cue(ctx, 'BOING!', hd[0] + 22, hd[1] - 12, 6.5, fl, -0.1, '#b43246');
    }
  } else if (X.kind === 'yawn') {
    if (u < 0.9) {
      gust(ctx, mouthP[0] + 2, mouthP[1], u);
      if (u > 0.05) cue(ctx, 'HWAAA!', hd[0] + 20, hd[1] - 16, 6.5, fl, -0.1, '#5a68b8');
    }
  } else if (X.kind === 'flex' || X.kind === 'gloat') {
    const v = clamp(u / 1.2, 0, 1);
    const p = ptOf(a, D, 'armNu', D.J.elN);
    sparkle(ctx, p[0] + 2, p[1] - 4, 2.2 * Math.sin(Math.PI * v), 1, '#fff6c8');
    sparkle(ctx, crown[0] - 6, crown[1] + 4 - v * 4, 1.6 * Math.sin(Math.PI * v), 1, '#fff6c8');
  } else if (X.kind === 'phew') {
    if (u < 0.8) cue(ctx, 'hup!', hd[0] + 16, hd[1] - 14, 6, fl, -0.1, '#b43246');
  } else if (X.kind === 'smack') {
    const v = clamp(u / 1.2, 0, 1);
    note(ctx, crown[0] + 6 + v * 4, crown[1] + 2 - v * 8, 1.4, -0.2, Math.sin(Math.PI * v), '#cc96b2');
  } else if (X.kind === 'doze' || X.kind === 'nap') {
    for (let i = 0; i < 3; i++) {
      const v = (u * 0.45 + i / 3) % 1;
      zee(ctx, crown[0] + 5 + v * 7, crown[1] + 2 - v * 11, 0.75 + v * 0.5, Math.sin(Math.PI * v), fl);
    }
  } else if (X.kind === 'spotted') {
    bubble(ctx, crown[0] + 4, crown[1] - 7, '!', u, 0.9, fl);
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) sparkle(ctx, hd[0] - 6 - v * 6 + i * 4, hd[1] - 8 - v * 5 - i * 2.4, 1.6 * (1 - v), 1 - v, '#fff6c8');
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] + 2, 9, t, 3);
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.4, 0.6 * (1 - u / 0.6), '#fdf0f4', '#d8b8c8');
  }
}

const DRESS = {
  id: 'hippostrongman',
  // (the skin is his hide; his striped suit is cut over it from the same outline)
  skin: { lt: HIDE[0], base: HIDE[1], sh: HIDE[2], deep: HIDE[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => suit(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => wristband(ctx, a, mode, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'F'),
    legF: (ctx, a, mode, S, D) => suitLeg(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'F'),
    legN: (ctx, a, mode, S, D) => suitLeg(ctx, a, mode, D, 'N'),
    footNskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => wristband(ctx, a, mode, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('hippo', DRESS);
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
export const HIPPO_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 320, 240, 260], draw: R.still, rig, noHop: true, ownEmotes: true };
export const HIPPO_SIZE = { w: 38, h: Math.round(R.H * BIG * 1.05), speed: Math.round(R.speed * BIG) };
