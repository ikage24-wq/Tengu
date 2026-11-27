// The Cymbal Monkey (2026-11-26, the Tin Drummer remade from scratch as a new creature; the id stays
// `tindrummer`). Bingo, the carnival band's cymbal man: the classic wind-up monkey with a fez and two
// brass cymbals, made sweet: a fluffy chestnut plush monkey with a big peach heart of a face and very
// bright eyes, the march that never ends. Queen Gearheart's toys have to keep performing while anyone
// is watching, and he takes it very seriously: when his spring runs low his clapping slows and slows,
// until his key whirs and he's back on the beat. He moves on his own copy of the creature base (rig.js;
// body.js `monkey`: a small round body, long arms, short legs on long feet), dressed here; his head,
// ears, fez, tail and cymbals drawn here from scratch over the mannequin's (the shared face never used,
// nothing of the hero's).
//   look    chestnut plush fur, a peach heart-shaped face mask and peach ear insides, round ears out
//           at the sides; a cherry fez with a gold tassel on its own spring; a teal velvet vest with
//           gold trim and buttons over a cream shirt with short puffed sleeves (cut from his own outline,
//           so it fits every pose), cherry-and-cream striped bloomers to the knee, bare long monkey
//           feet; a long tail curling into a spiral at its end (sprung, rooted inside him); a brass
//           wind-up key in his back; a brass cymbal on a red strap in each paw.
//   eyes    his own "starburst" eyes: big wide ovals, a hazel-green iris with a gold starburst round
//           the pupil (fine radial lines), a big oval glint, two little dots; a bold lash line with a
//           short round flick; high arched brows that do his acting. Faces: cheery (rest), grin,
//           delight (^ ^), startled, focus, proud, cheeky (tongue out), sleepy, hurt, dizzy (beaten),
//           sad, cross, talking (vowel mouths); every change eased.
//   idle    a 30 s act in pieces, only a piece he has time to finish (data `rest`, m.restUntil):
//           - practice (6.6 s): tiny taps, tink-tink, his head bobbing; then a great CRASH that startles
//             even him (his fez jumps), and a sheepish grin;
//           - the shine (7.2 s): a breath on a cymbal, a polish, his reflection: he pulls a face at it,
//             tongue out, and laughs;
//           - winding down (8 s): marching on the spot, clapping slower and slower, sagging, eyes
//             drooping... his key whirs, and he snaps back upright on the beat;
//           - the plate trick (6.8 s): a cymbal spun on the curl of his tail high behind him, a wobble,
//             caught, a bow.
//   walk    a band march: knees up, the cymbals swinging, the fez tassel bouncing.
//   fight   his moves: from afar, Crash (the cymbals flung wide, then CRASHED together: a ring of
//           brass sound rolls at you, `clangShot`); up close, in turn, Cymbal Clap (a lunge, clapping
//           them shut on you) and Cymbal Spin (a full turn with the cymbals held out like a top).
//   marks   all his own (`ownEmotes`): a "!" bubble as he starts hunting you, a "?" when he loses
//           you, a jaunty tink after landing a hit, z's when he naps, a sweat drop when low, dizzy
//           stars when beaten.
// Every effect is drawn here, live, in his own style: brass rings of sound, gold shimmer, the game's
// curvy sparkles.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat, cue, note, spring } from './fx.js';

const BIG = 1.34;
const LW = 1.6 / BIG;
// ---------- His colours ----------
const INK = '#7a4a3a';
const FUR = ['#f2c99c', '#c8895a', '#a0663a', '#744628'];
const FACE = ['#fff4e8', '#fde0c8', '#efc2a0', '#d89e7e'];
const VEST = ['#7ad6cc', '#3aa8a4', '#2a8486', '#1e6468'];
const VEST_INK = '#1e5a5e';
const SHIRT = ['#ffffff', '#fbf4ea', '#e6dccd', '#c4b6a2'];
const RED = ['#ff9a9a', '#e04a5a', '#b43246', '#8a2236'];
const GOLD = ['#fff4c0', '#f4c860', '#c49234', '#94681c'];
const BRASS = ['#fff6d0', '#f0cc68', '#c89a3a', '#906a22'];
const IRIS = ['#e8f0a0', '#9ab85a', '#5a7a34', '#2e421a'];
const LASH = '#3e2618';
const BROWC = '#6a3e24';

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
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
// ---------- His head ----------
const HO = [1.5, -12.6];
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

// ---------- His face (every part eased) ----------
// lid: only for closed eyes; shut: which closed shape; bt/by: brow tilt (+ knit, - worried) and raise;
// mw/ms/mo: mouth width, smile, openness; te: teeth; tg: tongue out; bl: blush; sm: small irises.
const FACES = {
  cheery: { lid: 0, shut: 'happy', bt: -0.1, by: 0.3, mw: 0.9, ms: 0.6, mo: 0, te: 0, tg: 0, bl: 0.45, sm: 0 },
  grin: { lid: 0, shut: 'happy', bt: -0.2, by: 0.6, mw: 1.15, ms: 1, mo: 0.35, te: 1, tg: 0, bl: 0.6, sm: 0 },
  delight: { lid: 1, shut: 'happy', bt: -0.2, by: 0.8, mw: 1.1, ms: 1, mo: 0.55, te: 0.6, tg: 0, bl: 0.85, sm: 0 },
  startled: { lid: 0, shut: 'happy', bt: -0.3, by: 1.4, mw: 0.6, ms: 0, mo: 0.75, te: 0, tg: 0, bl: 0.6, sm: 0.8 },
  focus: { lid: 0, shut: 'happy', bt: 0.55, by: -0.1, mw: 0.7, ms: 0.1, mo: 0, te: 0, tg: 0, bl: 0.45, sm: 0 },
  proud: { lid: 0, shut: 'happy', bt: 0.1, by: 0.8, mw: 0.95, ms: 0.75, mo: 0, te: 0, tg: 0, bl: 0.6, sm: 0 },
  cheeky: { lid: 0.3, shut: 'happy', bt: 0.3, by: 0.5, mw: 0.9, ms: 0.5, mo: 0.35, te: 0, tg: 1, bl: 0.7, sm: 0 },
  shout: { lid: 0, shut: 'happy', bt: 0.7, by: 0.2, mw: 1.1, ms: 0.3, mo: 1, te: 0.6, tg: 0, bl: 0.6, sm: 0.2 },
  sleepy: { lid: 1, shut: 'sleep', bt: -0.2, by: -0.1, mw: 0.6, ms: 0.1, mo: 0.1, te: 0, tg: 0, bl: 0.5, sm: 0 },
  droop: { lid: 0.55, shut: 'sleep', bt: -0.4, by: -0.2, mw: 0.6, ms: 0, mo: 0.1, te: 0, tg: 0, bl: 0.45, sm: 0 },
  hurt: { lid: 1, shut: 'squeeze', bt: -0.8, by: 0.2, mw: 0.9, ms: -0.7, mo: 0.6, te: 0.5, tg: 0, bl: 0.7, sm: 0 },
  dizzy: { lid: 1, shut: 'dizzy', bt: -0.5, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.45, te: 0, tg: 0.4, bl: 0.5, sm: 0 },
  sad: { lid: 0, shut: 'happy', bt: -0.95, by: 0.3, mw: 0.7, ms: -0.6, mo: 0, te: 0, tg: 0, bl: 0.4, sm: 0.15 },
  worried: { lid: 0, shut: 'happy', bt: -0.8, by: 0.5, mw: 0.7, ms: -0.4, mo: 0.15, te: 0, tg: 0, bl: 0.5, sm: 0.1 },
  cross: { lid: 0, shut: 'happy', bt: 0.95, by: -0.4, mw: 0.85, ms: -0.45, mo: 0.1, te: 0.7, tg: 0, bl: 0.45, sm: 0.1 },
  talk: { lid: 0, shut: 'happy', bt: 0, by: 0.4, mw: 0.9, ms: 0.3, mo: 0.4, te: 0, tg: 0, bl: 0.5, sm: 0 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.6, 0.1, 0.8], [1.1, 0.4, 0.55], [0.9, 0.3, 0.25], [0.7, 0.2, 0], [0.8, 0.2, 0.6]];
const EYE = { w: 3.6, h: 4.4 };

function eye(ctx, a, x, y, side, f, look) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.cmUid ?? 0) * 0.61) % 4.3, 3.8, 3.9, 3.98, 4.12) : 0;
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
      pen(ctx, tone(a, LASH), 1);
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (s === 'happy') {
        ctx.moveTo(x - w, y + 1.2);
        ctx.quadraticCurveTo(x, y - h * 0.9, x + w, y + 1.2);
      } else if (s === 'sleep') {
        ctx.moveTo(x - w, y);
        ctx.quadraticCurveTo(x, y + h * 0.55, x + w, y);
      } else if (s === 'squeeze') {
        ctx.moveTo(x + side * w, y - 2.2);
        ctx.quadraticCurveTo(x - side * w * 0.2, y - 0.3, x - side * w * 0.9, y + 0.2);
        ctx.quadraticCurveTo(x - side * w * 0.2, y + 0.8, x + side * w, y + 2.4);
      } else {
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 + t * 4 * side;
          const r = (i / 26) * w * 0.92;
          const p = [x + Math.cos(an) * r, y + Math.sin(an) * r * 1.1];
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
  ctx.fillStyle = tone(a, '#fffdf8');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, w, h);
  ctx.clip();
  const small = 1 - 0.3 * f.sm;
  const ix = x + side * 0.2 + (look?.[0] ?? 0) * 0.8;
  const iy = y + 0.45 + (look?.[1] ?? 0) * 0.6;
  const ir = [2.9 * small, 3.5 * small];
  const g = ctx.createLinearGradient(0, iy - ir[1], 0, iy + ir[1]);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.45, tone(a, IRIS[2]));
  g.addColorStop(1, tone(a, IRIS[1]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#1e2a10', 0.8), 0.4);
  ctx.stroke();
  // the gold starburst round the pupil
  pen(ctx, tone(a, '#ffd870', 0.85), 0.3);
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU + 0.2;
    ctx.beginPath();
    ctx.moveTo(ix + Math.cos(an) * 1.3 * small, iy + 0.2 + Math.sin(an) * 1.5 * small);
    ctx.lineTo(ix + Math.cos(an) * (2 + (i % 2) * 0.4) * small, iy + 0.2 + Math.sin(an) * (2.4 + (i % 2) * 0.4) * small);
    ctx.stroke();
  }
  ell(ctx, ix, iy + 0.2, 1.25 * small, 1.5 * small);
  ctx.fillStyle = tone(a, '#140e08');
  ctx.fill();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.35);
  sg.addColorStop(0, 'rgba(110,60,40,0.3)');
  sg.addColorStop(1, 'rgba(110,60,40,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.2, w * 2.6, h * 0.9);
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - side * 0.95, iy - 1.45 * small, 1.2 * small, 0.95 * small, -0.5 * side);
  ctx.fill();
  ell(ctx, ix + side * 1.1, iy + 1.3 * small, 0.45, 0.45);
  ctx.fill();
  ell(ctx, ix + side * 1.5, iy + 0.3 * small, 0.25, 0.25);
  ctx.fill();
  if (L > 0.01) {
    ctx.fillStyle = tone(a, FACE[1]);
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
  // the bold lash line with a short round flick at its outer end
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.95, y - h * 0.4);
  ctx.quadraticCurveTo(x - side * 0.2, y - h * 1.3, x + side * w * 0.98, y - h * 0.45);
  ctx.quadraticCurveTo(x + side * (w + 0.9), y - h * 0.55, x + side * (w + 1.4), y - h * 1.0);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, LASH), 1.05);
  ctx.stroke();
  ctx.restore();
}
// A high arched brow, round at both ends.
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.by * 1.2);
  ctx.rotate(side * f.bt * 0.45);
  ctx.beginPath();
  ctx.moveTo(-2, 0.6);
  ctx.quadraticCurveTo(0, -1.1, 2, 0.5);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, BROWC), 1.05);
  ctx.stroke();
  ctx.restore();
}
function mouth(ctx, a, x, y, f) {
  const w = 2.6 * f.mw;
  const cy = y - f.ms * 0.7;
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.35 - o * 0.35, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.8 + o * 3, x - w, cy);
    ctx.fillStyle = tone(a, '#8a3040');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x + 0.2, y + o * 2.4, w * 0.6, o * 1.1);
    ctx.fillStyle = tone(a, '#f2889a');
    ctx.fill();
    if (f.te > 0.05) {
      // two little front teeth
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.rect(x + s * 0.05 - (s < 0 ? 1.1 : 0), cy - 0.3, 1.05, 1.2);
        ctx.fillStyle = tone(a, '#ffffff', f.te);
        ctx.fill();
      }
    }
    ctx.restore();
    pen(ctx, tone(a, '#6a2a30'), 0.5);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, '#6a2a30'), 0.65);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - w, cy - 0.2);
    ctx.quadraticCurveTo(x, y + 1.2 + f.ms * 0.5, x + w, cy - 0.45 - f.ms * 0.2);
    ctx.stroke();
  }
  if (f.tg > 0.05) {
    ctx.save();
    ctx.globalAlpha *= f.tg;
    ctx.beginPath();
    ctx.moveTo(x - 1.2, y + 0.6);
    ctx.quadraticCurveTo(x - 1.4, y + 3.4, x + 0.1, y + 3.6);
    ctx.quadraticCurveTo(x + 1.5, y + 3.4, x + 1.2, y + 0.6);
    ctx.closePath();
    ctx.fillStyle = tone(a, '#f68a9a');
    ctx.fill();
    pen(ctx, tone(a, '#d5677a'), 0.4);
    ctx.stroke();
    ctx.restore();
  }
}
const SKULL = () => {
  const pts = [];
  for (let i = 0; i < 30; i++) {
    const an = (i / 30) * TAU;
    const s = Math.sin(an);
    pts.push([Math.cos(an) * (14.4 + Math.max(0, s) * 0.6), s * (s < 0 ? 13.8 : 12.4)]);
  }
  return pts;
};
// The peach mask: a heart over his eyes (two round lobes up top), widening into a soft muzzle.
const MASK = (tx) => chaikin([[tx - 10.6, -2.4], [tx - 9.4, -7.6], [tx - 4.6, -8.6], [tx + 1.4, -5.2], [tx + 7.4, -8.6], [tx + 12.2, -7.4], [tx + 13.2, -2], [tx + 12, 4.4], [tx + 7.6, 10.4], [tx + 1.4, 11.8], [tx - 5, 10.4], [tx - 9.6, 5]], 3);
function ear(ctx, a, mode, cx, cy, r, far, wig) {
  ctx.save();
  ctx.translate(cx * 0.6, cy);
  ctx.rotate(wig);
  ctx.translate(-cx * 0.6, -cy);
  ell(ctx, cx, cy, r, r * 1.05);
  paint(ctx, a, mode, far ? FUR[2] : FUR[1]);
  if (mode === 'fill') {
    ell(ctx, cx + (far ? -0.8 : 0.8), cy + 0.4, r * 0.62, r * 0.68);
    ctx.fillStyle = tone(a, FACE[far ? 2 : 1]);
    ctx.fill();
    ell(ctx, cx + (far ? -1.4 : 1.4), cy + 0.6, r * 0.28, r * 0.42);
    ctx.fillStyle = tone(a, FACE[3], 0.7);
    ctx.fill();
  }
  ctx.restore();
}
// The fez: a cherry felt cone cut flat on top, a gold tassel swinging from its button on a spring.
function fez(ctx, a, mode) {
  const q = a.cmQ ?? {};
  ctx.save();
  ctx.translate(2.4, -12.4 - (q.fezUp ?? 0) * 7);
  ctx.rotate(0.14 + (q.fezTip ?? 0));
  const tas = q.tassel ?? 0.5;
  // the tassel: a cord from the button down over the side, a round fluffy tuft at its end
  const c0 = [0.4, -7.6];
  const c1 = [c0[0] - 4.2 * Math.cos(tas), c0[1] + 5.6 * Math.sin(tas) + 1];
  ctx.beginPath();
  ctx.moveTo(...c0);
  ctx.quadraticCurveTo(c0[0] - 3, c0[1] - 0.6, ...c1);
  ctx.lineCap = 'round';
  pen(ctx, mode === 'line' ? GOLD[3] : tone(a, GOLD[1]), mode === 'line' ? 0.8 + LW * 2 * WK : 0.8);
  ctx.stroke();
  smooth(ctx, [[c1[0] - 1, c1[1]], [c1[0] + 1, c1[1]], [c1[0] + 1.5, c1[1] + 2.6], [c1[0], c1[1] + 3.6], [c1[0] - 1.5, c1[1] + 2.6]]);
  paint(ctx, a, mode, GOLD[1], GOLD[3]);
  // the cone
  smooth(ctx, [[-5.6, 0.8], [-4.2, -7.4], [4.6, -7.4], [6, 0.8], [0.2, 1.8]]);
  paint(ctx, a, mode, RED[1], RED[3]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, [[-5.6, 0.8], [-4.2, -7.4], [4.6, -7.4], [6, 0.8], [0.2, 1.8]]);
    ctx.clip();
    glow(ctx, -2, -5, 5, RED[0], 0.8);
    glow(ctx, 5, 0, 4, RED[3], 0.5);
    // the gold band round its base
    ctx.beginPath();
    ctx.moveTo(-6, -1);
    ctx.quadraticCurveTo(0, 0.6, 6.4, -1);
    pen(ctx, tone(a, GOLD[1]), 1.1);
    ctx.stroke();
    ctx.restore();
    ell(ctx, 0.2, -7.4, 4.4, 0.9);
    ctx.fillStyle = tone(a, RED[2]);
    ctx.fill();
    ell(ctx, c0[0], c0[1], 0.8, 0.6);
    ctx.fillStyle = tone(a, GOLD[0]);
    ctx.fill();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.cmQ ?? {};
  const f = a.cmF;
  const turn = q.turn ?? 0.35;
  const tx = turn * 2.6;
  const ew = q.earW ?? [0, 0];
  ear(ctx, a, mode, 15.4, -1, 5.2, true, ew[1]);
  smooth(ctx, SKULL());
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill' && f) {
    ctx.save();
    smooth(ctx, SKULL());
    ctx.clip();
    glow(ctx, tx - 2, -10, 13, FUR[0], 0.9);
    glow(ctx, -14, 6, 9, FUR[2], 0.6);
    // a soft tuft of fur on his crown, darker
    const m0 = MASK(tx);
    smooth(ctx, m0);
    ctx.fillStyle = tone(a, FACE[1]);
    ctx.fill();
    ctx.save();
    smooth(ctx, m0);
    ctx.clip();
    glow(ctx, tx + 1, -2, 9, FACE[0], 0.9);
    glow(ctx, tx + 2, 11, 7, FACE[2], 0.6);
    ctx.restore();
    ctx.restore();
    for (const [cx, s] of [[tx - 6.8, 0.85], [tx + 9.6, 1]]) {
      ell(ctx, cx, 4.6, 2.6, 1.5);
      ctx.fillStyle = tone(a, '#ff8e8e', (0.25 + 0.45 * f.bl) * s);
      ctx.fill();
    }
    const ex = (s) => (s < 0 ? -3.6 + tx * 0.7 : 7.6 + tx);
    for (const s of [-1, 1]) eye(ctx, a, ex(s), -1.6, s, f, q.look);
    for (const s of [-1, 1]) brow(ctx, a, ex(s) + s * 0.2, -8.4, s, f);
    // two nostril dots on the muzzle, then the mouth
    for (const dx of [1.2, 3.6]) {
      ell(ctx, tx + dx, 4.6, 0.55, 0.42);
      ctx.fillStyle = tone(a, FACE[3]);
      ctx.fill();
    }
    mouth(ctx, a, tx + 2.6, 7.8, f);
    if (q.sweat >= 0) sweat(ctx, tx - 12, -6 + q.sweat * 3, 1.1);
  }
  ear(ctx, a, mode, -15.2, 0, 5.4, false, ew[0]);
  fez(ctx, a, mode);
  WK = 1;
  ctx.restore();
}

// ---------- His clothes ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
// The shirt, the vest open over it, the bloomers' waist: all cut from his body's own outline.
function vest(ctx, a, mode, D) {
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
  // the cream shirt under everything
  ctx.fillStyle = tone(a, SHIRT[1]);
  ctx.fillRect(-60, -90, 120, 100);
  // the bloomers from the waist down: cherry and cream stripes running down
  poly(ctx, [W([nv[0] - 30, nv[1] - 1.6]), W([nv[0] + 30, nv[1] - 1.6]), T([hp[0] + 30, hp[1] + 20]), T([hp[0] - 30, hp[1] + 20])]);
  ctx.fillStyle = tone(a, RED[1]);
  ctx.fill();
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(...W([nv[0] + i * 4.2, nv[1]]));
    ctx.lineTo(...T([hp[0] + i * 4.6, hp[1] + 10]));
    pen(ctx, tone(a, SHIRT[1]), 1.1);
    ctx.stroke();
  }
  // the vest: two teal fronts open over the shirt down to the waist
  for (const [x0, x1, col] of [[-30, 1.6, VEST[2]], [5.2, 30, VEST[1]]]) {
    poly(ctx, [C([st[0] + x0, st[1] - 10]), C([st[0] + x1, st[1] - 10]), W([nv[0] + x1 + (x1 > 0 && x1 < 3 ? -1.4 : 1.2), nv[1] - 1.2]), W([nv[0] + x0, nv[1] - 1.2])]);
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
  // its gold trim down the opening, its buttons
  for (const [xa, xb] of [[1.6, 0.2], [5.2, 6.4]]) {
    ctx.beginPath();
    ctx.moveTo(...C([st[0] + xa, st[1] - 1]));
    ctx.lineTo(...W([nv[0] + xb, nv[1] - 1.6]));
    pen(ctx, tone(a, GOLD[1]), 0.8);
    ctx.stroke();
  }
  for (const u of [0.3, 0.6]) {
    const p = C([st[0] + 6.6 + u * 1.2, st[1] + 3 + u * 9]);
    ell(ctx, p[0], p[1], 0.65, 0.65);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    ell(ctx, p[0] - 0.2, p[1] - 0.2, 0.25, 0.25);
    ctx.fillStyle = tone(a, GOLD[0]);
    ctx.fill();
  }
  // the bloomers' waistband
  ctx.beginPath();
  ctx.moveTo(...W([nv[0] - 30, nv[1] - 1.2]));
  ctx.lineTo(...W([nv[0] + 30, nv[1] - 1.2]));
  pen(ctx, tone(a, RED[2]), 1.4);
  ctx.stroke();
  const vg = C([st[0] + 9, st[1] + 4]);
  glow(ctx, vg[0], vg[1], 4.4, VEST[0], 0.6);
  ctx.restore();
}
// A short puffed shirt sleeve over the top of an arm (rig space, round the upper arm).
function sleeve(ctx, a, mode, D, k) {
  const S = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const M = [mix(S[0], E[0], 0.62), mix(S[1], E[1], 0.62)];
  const an = Math.atan2(E[1] - S[1], E[0] - S[0]);
  const w = 2.4;
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const u = (i / 16) * TAU;
    // (a puff: round, fuller at its hem)
    const rx = Math.hypot(M[0] - S[0], M[1] - S[1]) * 0.52 + 0.5;
    pts.push([Math.cos(u) * rx, Math.sin(u) * w * (1 + 0.12 * Math.max(0, Math.cos(u)))]);
  }
  ctx.save();
  ctx.translate(mix(S[0], M[0], 0.5), mix(S[1], M[1], 0.5));
  ctx.rotate(an);
  smooth(ctx, pts);
  if (mode === 'line') {
    pen(ctx, SHIRT[3], LW * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, k === 'N' ? SHIRT[1] : SHIRT[2]);
    ctx.fill();
    glow(ctx, -0.6, -1.2, 2.4, SHIRT[0], k === 'N' ? 0.85 : 0.35);
    // the hem: a cherry trim band round the puff's open end
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    ctx.fillStyle = tone(a, k === 'N' ? RED[1] : RED[2]);
    ctx.fillRect(pts[0][0] - 1.1, -w * 1.4, 2, w * 2.8);
    ctx.restore();
  }
  ctx.restore();
}
// A bloomer leg: cherry and cream, puffed, gathered just above the knee (rig space, round the thigh).
function bloomer(ctx, a, mode, D, k) {
  const H = ptOf(a, D, `thigh${k}`, D.J[`hip${k}`]);
  const K = ptOf(a, D, `shin${k}`, D.J[`knee${k}`]);
  const an = Math.atan2(K[1] - H[1], K[0] - H[0]);
  const L = Math.hypot(K[0] - H[0], K[1] - H[1]);
  ctx.save();
  ctx.translate(H[0], H[1]);
  ctx.rotate(an);
  const pts = chaikin([[-2.4, -3.6], [L * 0.55, -4.2], [L * 0.92, -3.2], [L * 1.02, 0], [L * 0.92, 3.2], [L * 0.55, 4.2], [-2.4, 3.6]], 2);
  poly(ctx, pts);
  if (mode === 'line') {
    pen(ctx, RED[3], LW * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, k === 'N' ? RED[1] : RED[2]);
    ctx.fill();
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    for (const dy of [-2.6, 0, 2.6]) {
      ctx.beginPath();
      ctx.moveTo(-3, dy);
      ctx.quadraticCurveTo(L * 0.5, dy * 1.15, L * 1.05, dy * 0.6);
      pen(ctx, tone(a, k === 'N' ? SHIRT[1] : SHIRT[2]), 0.9);
      ctx.stroke();
    }
    glow(ctx, L * 0.4, -2, 3, RED[0], k === 'N' ? 0.6 : 0.2);
    ctx.restore();
  }
  ctx.restore();
}
// A long monkey foot, bare, with a peach sole and toes.
function foot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 4, p[1] - 2.8], [p[0] + 0.4, p[1] - 3.6], [p[0] + 5, p[1] - 1.6], [p[0] + 9.4, p[1] + 0.6], [p[0] + 9.6, p[1] + 3.4], [p[0] - 4.4, p[1] + 3.4], [p[0] - 5, p[1] + 0.4]]);
  paint(ctx, a, mode, near ? FUR[1] : FUR[2]);
  if (mode === 'fill') {
    smooth(ctx, [[p[0] - 3.6, p[1] + 1.6], [p[0] + 9, p[1] + 1.6], [p[0] + 9.2, p[1] + 3.4], [p[0] - 4, p[1] + 3.4]]);
    ctx.fillStyle = tone(a, FACE[near ? 2 : 3]);
    ctx.fill();
    pen(ctx, tone(a, FUR[3], 0.6), 0.5);
    for (const dx of [6.4, 7.8]) {
      ctx.beginPath();
      ctx.moveTo(p[0] + dx, p[1] + 1);
      ctx.lineTo(p[0] + dx + 0.4, p[1] + 3);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// A paw: chestnut fur, a peach palm.
function paw(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  ctx.scale(1.25, 1.25);
  const near = k === 'N';
  smooth(ctx, [[-4, -3], [-1.4, -4.4], [2.2, -4.2], [4.2, -1.2], [4, 2.6], [1.4, 4.6], [-2, 4.4], [-4.2, 1.4]]);
  paint(ctx, a, mode, near ? FUR[1] : FUR[2], INK, LW / 1.25);
  if (mode === 'fill') {
    ell(ctx, 0.4, 1.4, 2.2, 2);
    ctx.fillStyle = tone(a, FACE[near ? 2 : 3], 0.8);
    ctx.fill();
  }
  ctx.restore();
}
// His tail: long, from inside his rump, curling into a spiral at its end; a chain of sprung pieces.
function tail(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const angs = a.cmTail ?? [2.6, 2.2, 1.6, 0.8, 0, -0.9, -1.8];
  const pts = [[h[0] - 8, h[1] - 1]];
  const Ls = [5, 5, 4.6, 3.6, 3, 2.6, 2.2];
  for (let i = 0; i < angs.length; i++) pts.push([pts[i][0] + Math.cos(angs[i]) * Ls[i], pts[i][1] + Math.sin(angs[i]) * Ls[i]]);
  poly(ctx, tube(pts, [3.4, 3.2, 3, 2.9, 2.8, 2.7, 2.6, 2.5], 0.5));
  paint(ctx, a, mode, FUR[2]);
  if (mode === 'fill') {
    poly(ctx, tube(pts.slice(0, 4), [1.2, 1.1, 1, 0.9], 0.5));
    ctx.fillStyle = tone(a, FUR[1], 0.6);
    ctx.fill();
  }
  ctx.restore();
  return pts;
}
// His wind-up key.
function key(ctx, a, mode, D) {
  const q = a.cmQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  ctx.translate(st[0] - 11.6, st[1] + 7.4);
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

// ---------- The cymbals (rig space) ----------
// A cymbal: a brass disc seen at an angle (its face turned by `face`: 1 full on, 0 edge on), a dome in
// the middle, the red strap's knot on the back, a shine sweeping across.
const CR = 6.2;
function cymbal(ctx, a, x, y, ang, face, shine = 0, back = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const fy = Math.max(0.22, Math.abs(face));
  ell(ctx, 0, 0, CR, CR * fy);
  pen(ctx, tone(a, BRASS[3]), LW * 1.5);
  ctx.stroke();
  ctx.fillStyle = tone(a, back ? BRASS[2] : BRASS[1]);
  ctx.fill();
  ctx.save();
  ell(ctx, 0, 0, CR, CR * fy);
  ctx.clip();
  // fine turned rings
  pen(ctx, tone(a, BRASS[2], 0.55), 0.3);
  for (const r of [0.45, 0.68, 0.86]) {
    ell(ctx, 0, 0, CR * r, CR * r * fy);
    ctx.stroke();
  }
  glow(ctx, -CR * 0.35, -CR * 0.35 * fy, CR * 0.8, BRASS[0], 0.85);
  if (shine > 0.01 && shine < 0.99) {
    // (a glint sweeping across, faded at both ends so a loop never jumps)
    const sx = mix(-CR, CR, shine);
    ctx.globalAlpha *= 0.7 * Math.sin(Math.PI * shine);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(sx, 0, 0.8, CR, 0.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // the dome (or the strap's knot behind)
  ell(ctx, 0, 0, CR * 0.3, CR * 0.3 * fy);
  ctx.fillStyle = tone(a, back ? RED[2] : BRASS[2]);
  ctx.fill();
  ell(ctx, -0.4, -0.4 * fy, CR * 0.12, CR * 0.1 * fy);
  ctx.fillStyle = tone(a, back ? RED[1] : BRASS[0]);
  ctx.fill();
  ctx.restore();
}
// Where a cymbal sits in a paw: out from the palm, its face turned toward the other's when clapping.
function cymbalAt(a, D, k) {
  const q = a.cmQ ?? {};
  const hd = ptOf(a, D, `hand${k}`, D.J[`hand${k}`]);
  const M = a.blMat(`hand${k}`);
  const an = Math.atan2(M[1], M[0]);
  const fc = k === 'N' ? q.faceN ?? 0.55 : q.faceF ?? 0.55;
  return { x: hd[0] + Math.cos(an + Math.PI / 2) * 1.4, y: hd[1] + Math.sin(an + Math.PI / 2) * 1.4, ang: an + (k === 'N' ? 0.25 : -0.25), face: fc };
}
// The ring of sound thrown at you (render/dreamfx.js, `clangShot`): a soft brass ring, rolling and
// shimmering, a few sparkles round it.
export function clangShot(ctx, shot, x, y, p, d) {
  if (shot !== 'clang') return false;
  const r = 5 + Math.sin(p * 20) * 0.6;
  ctx.save();
  for (const [rr, w, col, al] of [[r, 3.2, '#c89a3a', 0.9], [r, 1.6, '#fff0b0', 1], [r * 0.62, 1.2, '#f0cc68', 0.7]]) {
    ctx.globalAlpha = al;
    ctx.beginPath();
    ctx.ellipse(x, y, rr * 0.55, rr, 0, 0, TAU);
    pen(ctx, col, w);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    const an = p * 12 + i * 2.1;
    sparkle(ctx, x - d * 4 + Math.cos(an) * 6, y + Math.sin(an) * 6, 1.4 + Math.sin(p * 30 + i) * 0.5, 0.9, '#fff6c8');
  }
  ctx.restore();
  return true;
}

// ---------- His act and his fight ----------
const MELEE = ['clap', 'spin'];
// His carriage: the cymbals held up before his chest, ready.
const READY = { shN: -46, elN: -82, hwN: -10, shF: -30, elF: -90, hwF: -10 };
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'cheery', look: [0.4, 0], turn: 0.38, sweat: -1, fx: null, keyRate: 1.6, fezUp: 0, fezTip: 0, faceN: 0.55, faceF: 0.55, shineN: 0, shineF: 0, spin: 0, plate: 0 };
  a.cmQ = q;
  a.cmUid = (m.uid ?? 0) % 7;
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
  const breath = Math.sin(t * 1.6);
  const cineMood = m.cine?.mood;
  const alive = m.hp > 0;
  const low = alive && m.hp / m.def.hp < 0.3;
  const since = now - (m.attackAt ?? -9);
  const anticK = m.windup > 0 ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = alive && (anticK > 0 || (since >= 0 && since < 0.95));
  if (swinging && !st.cmAtk) {
    st.cmN = (st.cmN ?? (m.uid ?? 0)) + 1;
    st.cmPick = typeof m.move === 'string' && ['crash', ...MELEE].includes(m.move) ? m.move : m.swingFar ? 'crash' : MELEE[st.cmN % MELEE.length];
  }
  st.cmAntic = swinging ? Math.max(anticK, st.cmAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.95;
  st.cmAtk = swinging;
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;
  const busy = !alive || swinging;
  if (busy) st.cmFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.cmFreeAt ?? -9)) / 0.35);

  // Standing: on his toes, the cymbals up before his chest, his weight bobbing to a beat in his head.
  go({ ...READY, tilt: -1, chest: -1 + breath * 0.5, head: Math.sin(t * 2.4) * 1 }, 1);
  if (walkW > 0.01) {
    // the band march: knees up, the cymbals swinging with his steps
    const u = a.blkidU ?? a.wp ?? 0;
    add({ shN: Math.sin(u * TAU) * 14, shF: -Math.sin(u * TAU) * 14, tilt: 1.5, head: -2 }, walkW);
    q.turn = mix(q.turn, 0.6, walkW);
  }
  if (fighting && !busy) {
    go({ shN: -70, elN: -60, shF: -50, elF: -70, tilt: 3 }, 0.8 * freeK);
    say('focus');
    q.turn = 0.6;
    q.keyRate = 2.6;
  }
  if (fighting && !st.cmHunt) st.cmBangAt = now;
  if (!fighting && st.cmHunt && alive) st.cmLostAt = now;
  st.cmHunt = fighting;
  q.bang = now - (st.cmBangAt ?? -9);
  q.huh = now - (st.cmLostAt ?? -9);
  if (alive && !busy && q.bang >= 0 && q.bang < 0.9) {
    const k = win(q.bang, 0, 0.12, 0.5, 0.9) * freeK;
    go({ head: -10, tilt: -4 }, k);
    q.fezUp = 0.5 * k;
    say('startled', k);
  }
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // a jaunty little tink, a wink of a grin
    const k = win(gloat, 0, 0.25, 0.9, 1.4) * freeK;
    go({ shN: -110, elN: -60, shF: -90, elF: -70, head: -6 }, k);
    q.faceN = mix(q.faceN, 0.2, k);
    q.faceF = mix(q.faceF, 0.2, k);
    say('grin', k);
    q.fx = { kind: 'gloat', u: gloat };
  }
  if (!alive) {
    // beaten: sat down with a thump, the cymbals dropped either side, dizzy; his key stopped
    st.cmDeadAt ??= now;
    go({ drop: 0.85, tilt: -10, head: 14, shN: 40, elN: -20, shF: 50, elF: -10, fxN: 0.5, fxF: 0.2 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.keyRate = 0;
    q.fezTip = 0.4;
    q.dropped = true;
    q.fx = { kind: 'beaten', u: now - st.cmDeadAt };
  } else st.cmDeadAt = undefined;

  if (alive) {
    if (swinging) {
      const kind = st.cmPick ?? 'clap';
      const hitK = struck ? (since < 0.1 ? sstep(since / 0.1) : 1 - sstep((since - 0.34) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.cmAntic) * (since < 0.1 ? 1 : 0) : sstep(anticK);
      q.keyRate = 4;
      if (kind === 'crash') {
        // Crash: the cymbals flung wide, leaning back... then CRASHED together in front of him
        go({ shN: -150, elN: -10, shF: -150, elF: -10, tilt: -8, head: -6, chest: -4 }, wK);
        go({ shN: -64, elN: -34, shF: -56, elF: -40, tilt: 8, head: 2, x: 0.02 }, hitK);
        q.faceN = mix(0.55, 0.15, Math.max(wK, hitK));
        q.faceF = q.faceN;
        say(hitK > 0.2 ? 'shout' : 'focus');
        q.fx = { kind: struck ? 'crash' : 'ready', u: struck ? since : now };
      } else if (kind === 'clap') {
        // Cymbal Clap: drawn back wide at his sides, then a lunge and a clap shut on you
        go({ shN: 40, elN: -40, shF: -150, elF: -40, tilt: -6, drop: 0.12 }, wK);
        go({ shN: -90, elN: -10, shF: -96, elF: -14, tilt: 14, head: 6, x: 0.08 }, hitK);
        q.faceN = mix(0.55, 0.15, hitK);
        q.faceF = q.faceN;
        say(hitK > 0.2 ? 'shout' : 'focus');
        q.fx = { kind: struck ? 'clap' : 'ready', u: struck ? since : now };
      } else {
        // Cymbal Spin: arms out with the cymbals edge-on like a top's blades; a full turn into you
        go({ shN: -95, elN: -5, shF: -95, elF: -5, drop: 0.1, tilt: -4 }, Math.max(wK, hitK));
        const turnU = struck ? clamp(since / 0.55, 0, 1) : 0;
        q.spin = sstep(turnU);
        add({ x: 0.05 * Math.sin(Math.PI * turnU) }, hitK);
        q.faceN = 0.25;
        q.faceF = 0.25;
        say(hitK > 0.2 ? 'grin' : 'focus');
        q.fx = { kind: struck ? 'spin' : 'ready', u: struck ? since : now };
      }
    } else if (hurt) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -12, x: -0.02, shN: -120, elN: -60, shF: -110, elF: -60 }, k);
      say('hurt', k * 2);
      q.fezUp = 0.5 * k;
      q.earKick = k;
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const nap = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
    st.cmNap = mix(st.cmNap ?? 0, nap && !busy ? 1 : 0, 1 - Math.exp(-dt * 3));
    if (st.cmNap > 0.01) {
      // run down: arms dropped, chin on his chest, his key barely turning
      const k = sstep(st.cmNap);
      go({ head: 18 + Math.sin(t * 1.1) * 2, tilt: 5, chest: 2 + Math.sin(t * 1.1), shN: 20, elN: -20, shF: 14, elF: -20, drop: 0.05 }, k);
      if (k > 0.5) {
        q.mood = 'sleepy';
        q.fx = { kind: 'nap', u: t };
        q.keyRate = 0.15;
      }
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.cmCalm = mix(st.cmCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.cmCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, q, sstep(st.cmCalm), t, now, st);
    if (cineMood && !busy) q.mood = { angry: 'cross', happy: 'delight', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !busy) {
      if (!cineMood) q.mood = q.mood === 'cheery' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
      q.keyRate *= 0.5;
    }
    if (m.talking) q.mood = 'talk';
  }
  q.turn = spring(st, 'cmTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.cheery;
  const f = (st.cmF ??= { ...FACES.cheery, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'bt', 'by', 'mw', 'ms', 'mo', 'te', 'tg', 'bl', 'sm']) f[k] = mix(f[k], tgt[k], k === 'lid' ? 1 - Math.exp(-dt * (tgt.lid > f.lid ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.cmF = f;
  const sp = q.spin % 1;
  st.cmFlip = q.spin > 0 && sp > 0.25 && sp < 0.75;
  // springs: ears, fez, tassel, tail
  const kick = (st.cmLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.cmLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.cmLast = out.head;
  st.cmLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  q.earW = [0, 1].map((i) => spring(st, `ear${i}`, (q.earKick ?? 0) * (i ? -0.3 : 0.3) + Math.sin(t * 1.4 + i * 2) * 0.03 + (q.mood === 'sad' ? (i ? 0.15 : -0.15) : 0), 100, 9, dt, kick * 0.006));
  q.fezUp = clamp(spring(st, 'fezUp', q.fezUp, 170, 12, dt), -0.2, 1.4);
  q.fezTip = spring(st, 'fezTip', q.fezTip, 120, 10, dt, kick * 0.004);
  q.tassel = spring(st, 'tassel', 0.6 + ((out.head ?? 0) * Math.PI) / 180 * 0.8 + step * 0.4 + Math.sin(t * 1.7) * 0.06, 60, 5, dt, kick * 0.02);
  const plate = q.plate ?? 0;
  const tailBase = [2.6, 2.2, 1.6, 0.8, 0, -0.9, -1.8];
  const tailUp = [4.3, 4.5, 4.66, 4.78, 4.9, 5.3, 5.8];
  a.cmTail = tailBase.map((b, i) => spring(st, `tl${i}`, mix(b, tailUp[i], plate) + Math.sin(t * 1.5 - i * 0.5) * 0.08 * (1 - plate) + step * 0.1 + ((out.tilt ?? 0) * Math.PI) / 180 * -0.5, 70 - i * 5, 6.5, dt, kick * 0.008));
  st.cmKeyRate = mix(st.cmKeyRate ?? q.keyRate, q.keyRate, 1 - Math.exp(-dt * 3));
  st.cmKeyA = ((st.cmKeyA ?? (m.uid ?? 0) * 0.7) + st.cmKeyRate * dt) % (TAU * 100);
  q.keyA = st.cmKeyA;
  q.faceN = spring(st, 'faceN', q.faceN, 200, 20, dt);
  q.faceF = spring(st, 'faceF', q.faceF, 200, 20, dt);
}
// The 30 s act.
const PIECES = [
  { name: 'practice', t0: 0.4, len: 6.6 },
  { name: 'shine', t0: 7.6, len: 7.2 },
  { name: 'wind', t0: 15.4, len: 8 },
  { name: 'plate', t0: 23.6, len: 6.2 },
];
function idleAct(m, a, out, go, add, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.cmPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.cmPiece = cur.name;
      else return;
    }
  } else {
    st.cmPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'practice') {
    // tiny taps, tink-tink; a great CRASH that startles even him; a sheepish grin
    const k = win(u, 0, 0.4, 6, 6.6);
    const taps = sstep((u - 0.3) / 0.3) * (1 - sstep((u - 2.8) / 0.3));
    const tap = Math.sin(u * 13) * 0.5 + 0.5;
    const wide = win(u, 2.9, 3.4, 3.5, 3.6);
    const crash = win(u, 3.55, 3.62, 4.2, 4.6);
    go({ shN: -60 - tap * 10, elN: -90 + tap * 20, shF: -50 - tap * 10, elF: -96 + tap * 20, head: Math.sin(u * 6.5) * 3 }, taps * k * w);
    go({ shN: -150, elN: -10, shF: -150, elF: -10, tilt: -6 }, wide * k * w);
    go({ shN: -62, elN: -38, shF: -54, elF: -42, tilt: -8, head: -12, x: -0.02 }, crash * k * w);
    if (at(k)) {
      q.faceN = mix(0.55, 0.2, Math.max(taps, crash));
      q.faceF = q.faceN;
      q.fezUp = crash * 0.9;
      q.mood = u < 2.9 ? 'cheery' : u < 3.55 ? 'focus' : u < 4.6 ? 'startled' : 'grin';
      if (u > 0.4 && u < 2.8) q.fx = { kind: 'tink', u };
      if (u > 3.55 && u < 4.4) q.fx = { kind: 'bigcrash', u: u - 3.55 };
    }
  } else if (cur.name === 'shine') {
    // a breath on his near cymbal, a polish with his far paw, his reflection: a face pulled, a laugh
    const k = win(u, 0, 0.5, 6.6, 7.2);
    const hold = win(u, 0.3, 0.8, 6.2, 6.8);
    const rub = sstep((u - 1.6) / 0.3) * (1 - sstep((u - 3.6) / 0.3));
    go({ shN: -86, elN: -60, hwN: -30, head: 4, shF: -70 + Math.sin(u * 10) * 10 * rub, elF: -80 + Math.cos(u * 10) * 12 * rub }, hold * k * w);
    if (at(k)) {
      q.faceN = 1;
      q.shineN = u > 3.6 && u < 4.4 ? (u - 3.6) / 0.8 : 0;
      q.look = [0.8, 0.4];
      q.mood = u < 1.5 ? 'talk' : u < 3.7 ? 'focus' : u < 4.4 ? 'proud' : u < 5.6 ? 'cheeky' : 'delight';
      if (u > 0.6 && u < 1.6) q.fx = { kind: 'fog', u: u - 0.6 };
      if (u > 5.6) q.fx = { kind: 'laugh', u: u - 5.6 };
    }
  } else if (cur.name === 'wind') {
    // marching on the spot, clapping slower and slower, sagging, eyes drooping... his key whirs and
    // he snaps back upright, on the beat
    const k = win(u, 0, 0.5, 7.4, 8);
    const slow = clamp((u - 0.5) / 4.5, 0, 1);
    const rate = mix(7, 1.4, slow);
    st.cmClapPh = (st.cmClapPh ?? 0) + rate * clamp(a.dt ?? 0, 0, 0.05);
    const clap = (Math.sin(st.cmClapPh) + 1) / 2;
    const sag = sstep((u - 2.5) / 2.6) * (1 - sstep((u - 5.4) / 0.2));
    const snap = win(u, 5.4, 5.5, 7, 7.6);
    go({ shN: -70 + clap * 30, elN: -70 + clap * 10, shF: -60 + clap * 30, elF: -80 + clap * 10, fyN: -0.15 * (1 - slow) * Math.max(0, Math.sin(st.cmClapPh * 0.5)), fyF: -0.15 * (1 - slow) * Math.max(0, -Math.sin(st.cmClapPh * 0.5)) }, k * w * (1 - sag * 0.4));
    go({ head: 18, tilt: 6, drop: 0.12, shN: 10, elN: -30, shF: 14, elF: -30 }, sag * k * w);
    go({ head: -6, tilt: -4, lift: 0.02 }, snap * k * w);
    if (at(k)) {
      q.keyRate = u < 5.4 ? mix(1.6, 0.3, sag) : 9 * win(u, 5.2, 5.4, 6, 6.6) + 1.6;
      q.faceN = mix(0.55, 0.25, clap);
      q.faceF = q.faceN;
      q.mood = u < 2.5 ? 'cheery' : u < 5.4 ? 'droop' : u < 6 ? 'startled' : 'grin';
      q.fezUp = snap * 0.3;
      if (u > 5.2 && u < 6.2) q.fx = { kind: 'whir', u: u - 5.2 };
    }
  } else {
    // a cymbal spun on the curl of his tail held up high behind him; a wobble; caught; a bow
    const k = win(u, 0, 0.5, 5.7, 6.2);
    const up = win(u, 0.6, 1.4, 4.4, 5.0);
    const wob = win(u, 3.2, 3.4, 4.0, 4.4);
    const bow = win(u, 5.0, 5.4, 5.8, 6.4);
    go({ shF: -150, elF: -30, shN: -60, elN: -90, head: -10 + Math.sin(u * 14) * 5 * wob, tilt: -3 + Math.sin(u * 12) * 3 * wob }, up * k * w);
    go({ tilt: 18, head: 14, shN: 30, elN: -40, shF: -30, elF: -60 }, bow * k * w);
    if (at(k)) {
      q.plate = up;
      q.plateSpin = u;
      q.plateWob = wob;
      q.look = [-0.6, -1];
      q.turn = 0.2;
      q.mood = u < 3.2 ? 'proud' : u < 4.4 ? 'worried' : 'delight';
      q.hideF = up > 0.5;
      if (u > 5 && u < 6.4) q.fx = { kind: 'bow', u: u - 5 };
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
  // his marks sit in a little brass cymbal
  ell(ctx, 0, 0, 5, 4.6);
  ctx.fillStyle = '#fff8e0';
  ctx.fill();
  pen(ctx, '#c89a3a', 1);
  ctx.stroke();
  ell(ctx, 0, 0, 3.9, 3.6);
  pen(ctx, 'rgba(200,154,58,0.35)', 0.4);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#e04a5a' : '#2a8486';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.6);
    ctx.lineTo(0, 0.5);
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
  pen(ctx, '#2a8486', 1.3);
  ctx.stroke();
  pen(ctx, '#effcfa', 0.55);
  ctx.stroke();
  ctx.restore();
}
// Rings of sound off a crash: soft brass ellipses spreading.
function rings(ctx, x, y, u, s = 1) {
  for (let i = 0; i < 3; i++) {
    const kk = clamp(u * 1.6 - i * 0.25, 0, 1);
    if (kk <= 0 || kk >= 1) continue;
    ctx.save();
    ctx.globalAlpha *= (1 - kk) * 0.9;
    ctx.beginPath();
    ctx.ellipse(x, y, (4 + kk * 14) * s * 0.6, (4 + kk * 14) * s, 0, 0, TAU);
    pen(ctx, '#c89a3a', 1.8);
    ctx.stroke();
    pen(ctx, '#fff4c8', 0.8);
    ctx.stroke();
    ctx.restore();
  }
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  const q = a.cmQ ?? {};
  for (const mode of ['line', 'fill']) {
    key(ctx, a, mode, D);
    const pts = tail(ctx, a, mode, D);
    q.tailPts = pts;
  }
  // (behind him) the far cymbal spun on his tail's curl
  if (q.hideF && q.tailPts) {
    // (the tail's points are in the torso's kid units: carried into the rig's space)
    const tip = q.tailPts[q.tailPts.length - 2];
    const p = ptOf(a, D, 'torso', tip);
    const sp = (q.plateSpin ?? 0) * 9;
    cymbal(ctx, a, p[0] + Math.sin((q.plateSpin ?? 0) * 18) * (q.plateWob ?? 0) * 1.2, p[1] - 2.4, Math.sin(sp) * 0.15, 0.24, (sp / TAU) % 1, Math.cos(sp) < 0);
  }
  // the far cymbal, behind him
  if (!q.dropped && !q.hideF) {
    const C = cymbalAt(a, D, 'F');
    cymbal(ctx, a, C.x, C.y, C.ang, C.face, q.shineF, true);
  }
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.cmQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = (a.flip ? -1 : 1) * (a.cmSpun ? -1 : 1);
  const crown = headAt(a, D, [0, -20]);
  const hd = headAt(a, D, [4, 0]);
  // the near cymbal in his paw (over him); dropped beside him when beaten
  if (q.dropped) {
    cymbal(ctx, a, 9, -1.2, 0.15, 0.3, 0, false);
    cymbal(ctx, a, -7, -1.2, -0.1, 0.3, 0, true);
  } else {
    const C = cymbalAt(a, D, 'N');
    cymbal(ctx, a, C.x, C.y, C.ang, C.face, q.shineN, false);
  }
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0) bubble(ctx, crown[0] + 4, crown[1] - 7, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0) bubble(ctx, crown[0] + 4, crown[1] - 7, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  const CN = cymbalAt(a, D, 'N');
  const CF = cymbalAt(a, D, 'F');
  const mid = [(CN.x + CF.x) / 2, (CN.y + CF.y) / 2];
  if (X.kind === 'ready') {
    sparkle(ctx, CN.x + 2, CN.y - 4, 1.5 + Math.sin(t * 9) * 0.5, 0.7, '#fff6c8');
  } else if (X.kind === 'crash' || X.kind === 'bigcrash' || X.kind === 'clap') {
    if (u > -0.02 && u < 0.6) {
      rings(ctx, mid[0] + (X.kind === 'clap' ? 4 : 2), mid[1], u, X.kind === 'clap' ? 0.8 : 1);
      for (let i = 0; i < 4; i++) sparkle(ctx, mid[0] + Math.cos(i * 1.7) * (4 + u * 16), mid[1] + Math.sin(i * 1.7) * (3 + u * 10), 2 * (1 - u / 0.6), 1 - u / 0.6, '#fff4c0');
      cue(ctx, X.kind === 'clap' ? 'CLANG!' : 'CRASH!', hd[0] + 18, hd[1] - 18, 6.5, fl, -0.1, '#b43246');
    }
  } else if (X.kind === 'spin') {
    const k = clamp(u / 0.55, 0, 1);
    if (u < 0.7) {
      for (let i = 0; i < 4; i++) sparkle(ctx, hd[0] - 2 + Math.cos(k * 9 + i * 1.6) * 12, mid[1] + Math.sin(k * 9 + i * 1.6) * 3, 1.8 * (1 - k), 1 - k, '#fff4c0');
      ctx.save();
      ctx.globalAlpha *= (1 - k) * 0.7;
      ctx.beginPath();
      ctx.ellipse(hd[0] - 2, mid[1], 13, 3.2, 0, 0, TAU);
      pen(ctx, '#f0cc68', 1.2);
      ctx.stroke();
      ctx.restore();
    }
  } else if (X.kind === 'tink') {
    const ph = (u * 13) % TAU;
    if (Math.sin(ph) > 0.9) sparkle(ctx, mid[0] + 1, mid[1] - 2, 1.5, 0.9, '#fff4c0');
    const v = (u * 0.8) % 1;
    note(ctx, mid[0] + 4 + v * 4, mid[1] - 4 - v * 8, 1.3, -0.2, Math.sin(Math.PI * v) * 0.9, '#c89a3a');
  } else if (X.kind === 'fog') {
    ell(ctx, CN.x, CN.y, 3.6 * Math.sin(Math.PI * clamp(u, 0, 1)), 2.4 * Math.sin(Math.PI * clamp(u, 0, 1)));
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
  } else if (X.kind === 'laugh') {
    const v = clamp(u / 1.2, 0, 1);
    cue(ctx, 'hee hee', hd[0] + 16, hd[1] - 16 - v * 3, 5.5, fl, -0.1, '#2a8486');
  } else if (X.kind === 'whir') {
    for (let i = 0; i < 3; i++) {
      const p = ptOf(a, D, 'chest', [D.J.stern[0] - 19, D.J.stern[1] + 7.4]);
      const an = u * 14 + i * 2.1;
      sparkle(ctx, p[0] + Math.cos(an) * 4, p[1] + Math.sin(an) * 4, 1.4 * (1 - u), 1 - u, '#fff4c0');
    }
    if (u < 0.9) cue(ctx, 'whirr!', crown[0] - 10, crown[1] + 2, 5.5, fl, 0.1, '#946a1c');
  } else if (X.kind === 'bow' || X.kind === 'gloat') {
    const v = clamp(u / 1.2, 0, 1);
    note(ctx, crown[0] + 6 + v * 4, crown[1] + 2 - v * 8, 1.6, -0.2, Math.sin(Math.PI * v), '#c89a3a');
    sparkle(ctx, crown[0] - 6, crown[1] + 4 - v * 4, 1.6 * Math.sin(Math.PI * v), 1, '#fff6c8');
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
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.2, 0.6 * (1 - u / 0.6), '#fdf0e4', '#d8b8a0');
  }
}

const DRESS = {
  id: 'cymbalmonkey',
  // (the skin is his fur; his shirt, vest and bloomers are cut over it from the same outline)
  skin: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => vest(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'F'),
    legF: (ctx, a, mode, S, D) => bloomer(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'F'),
    legN: (ctx, a, mode, S, D) => bloomer(ctx, a, mode, D, 'N'),
    footNskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('monkey', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  // (a spin is a clean mirror flip at each half turn: the picture only)
  a.cmSpun = Boolean(a.mo?.rig?.cmFlip);
  if (a.cmSpun) ctx.scale(-1, 1);
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.4);
// His art entry (`noHop`, `ownEmotes`), his size as drawn and his walking pace.
export const MONKEY_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [90, 300, 200, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const MONKEY_SIZE = { w: 28, h: Math.round(R.H * BIG * 1.05), speed: Math.round(R.speed * BIG) };
