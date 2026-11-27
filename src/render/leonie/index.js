// Leonie, the Lioness Acrobat, on screen (2026-11-27, redrawn from scratch: the Big Top's star, her
// story and role kept; world/carnival.js her new fight). The carnival's high-flyer: a wind-up lioness
// acrobat, the head of Queen Gearheart's troupe (the Giraffe Ballerina, the Koala Balloonist, the Cymbal
// Monkey, the Boxing Kangaroo, the Hippo Strongman: the same plush build, the same carnival colours, a
// brass key in her back too). Showy, warm, a born performer who adores her crowd: she will make you
// part of the act. She moves on her own copy of the creature base (rig.js; body.js `lioness`: an
// acrobat's build), dressed here; her head, ruff, tiara, cape, tail and props drawn here from scratch
// (never the shared face, nothing of the hero's).
//   look    warm honey-gold fur, cream muzzle, chest and cheek ruffs (soft rounded tufts, never points),
//           round ears with cocoa backs, a long tail ending in a plump cocoa tuft; a scarlet acrobat's
//           leotard spangled with gold, a gold star on the chest (cut from her own outline, a sweetheart
//           neckline over her cream chest); gold cuffs on her wrists; gold acrobat slippers with
//           ribbons crossed up her ankles; a short scarlet cape lined in gold, three panels on their own
//           springs, always behind her; a gold tiara with a heart-shaped ruby and a curled scarlet
//           plume (its three feathers sprung); her brass wind-up key through the back of her cape.
//   eyes    her own "spotlight" eyes: almond, lifting at the outer corner, a warm amber iris (deep
//           brown at the top, gold below, fine light lines), a round glint, a small one and a crescent
//           of reflected spotlight low in the iris; a bold lash line with a soft wing and two round
//           flicks; a rose eyeshadow wash and a lid crease; round brows that do her acting. Faces:
//           showtime (rest, a confident smile), dazzle (^ ^), wink, focus, fierce, roar, startled,
//           proud, hurt, dizzy, sad, sleepy, talking (vowel mouths); every change eased.
//   idle    a 30 s act in pieces (only one she has time for): stretches (a lunge, an arm overhead);
//           two standing back-flips (a clean turn of the whole figure round her middle, never a squash)
//           and arms up for the crowd; juggling three pins; playing to the crowd (a wave, a blown kiss).
//   walk    a performer's strut, tail swaying, cape fluttering.
//   fight   between casts her swings at the tank in turn: Paw Swipe, High Kick, Tail Whip. Her casts
//           (m.castPose, world/carnival.js): juggle (Juggling Pins: pins juggled faster and faster, then
//           flung up), leap (Flying Leap: a deep crouch, then a pounce), pyramid (Human Pyramid!: a
//           point, then both arms up), cartwheel (Cartwheel Run: arms up, then cartwheels right across the
//           ring, m.dash), swing (The Big Swing: a trapeze lowered to her, grabbed, swung out wide either
//           side), spot (Spotlights: a showgirl's pose, a paw flung up to the lights), cannon (Human
//           Cannonball: tucked into a ball and fired across, m.dash), ovation (Standing Ovation: a deep
//           bow, arms flung wide). Phase moments (m.phaseAt): the Trapeze! (a whistle, a paw raised), the
//           Grand Finale! (a great roar, arms flung up).
//   scenes  her entrance (carnival_leonie): 'trapeze' (high up in the spotlight on a trapeze, swinging,
//           hanging by her knees, waving), 'somersault' (lets go: a triple somersault down to the ring,
//           landing in a crouch), 'tada' (arms flung up, the crowd's star), 'windup', 'attack', 'sway'.
//   marks   all her own (`ownEmotes`): a "!" and a "?" in a gold star-burst, a blown kiss after landing a
//           hit, a sweat drop when low, dizzy stars when beaten (sat down, tail limp, her key still).
// Every effect is drawn live in her own style: sawdust puffs, gold stars, confetti, scarlet swishes.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat, cue, note, spring } from './fx.js';

const BIG = 2.05;
const LW = 1.6 / BIG;
// ---------- Her colours ----------
const INK = '#8e5432';
const FUR = ['#ffe9c4', '#f4c47c', '#dc9c52', '#b0743a'];
const CREAM = ['#fffaf0', '#fdeed6', '#f0d6b2'];
const COCOA = ['#a8704a', '#7a4a30', '#583420'];
const RED = ['#ff9aa0', '#e2404e', '#b02a3c', '#7c1a2c'];
const RED_INK = '#6e1828';
const GOLD = ['#fff4c0', '#f6c94e', '#c8902c', '#8e6418'];
const IRIS = ['#ffe8a6', '#f0aa3e', '#b0622a', '#5a2c14'];
const LASH = '#3e2214';
const NOSE = ['#d48a8a', '#a85a5e'];

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
const HO = [1.6, -13];
const HS = 1.14;
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

// ---------- Her face (every part eased) ----------
// lid (closed eyes only), shut (which closed shape), wink (her near eye shut alone), bt/by (brows'
// tilt and raise), mw/ms/mo (mouth width, smile, openness), te (teeth), bl (blush), sm (small irises).
const FACES = {
  showtime: { lid: 0, shut: 'happy', wink: 0, bt: 0.15, by: 0.3, mw: 0.9, ms: 0.75, mo: 0, te: 0, bl: 0.5, sm: 0 },
  dazzle: { lid: 1, shut: 'happy', wink: 0, bt: -0.2, by: 0.8, mw: 1.1, ms: 1, mo: 0.45, te: 0.7, bl: 0.85, sm: 0 },
  wink: { lid: 0, shut: 'happy', wink: 1, bt: 0.2, by: 0.6, mw: 1, ms: 0.9, mo: 0.15, te: 0.5, bl: 0.75, sm: 0 },
  focus: { lid: 0, shut: 'happy', wink: 0, bt: 0.55, by: -0.1, mw: 0.75, ms: 0.2, mo: 0, te: 0, bl: 0.45, sm: 0 },
  fierce: { lid: 0, shut: 'happy', wink: 0, bt: 0.95, by: -0.4, mw: 1, ms: 0.1, mo: 0.4, te: 1, bl: 0.5, sm: 0.1 },
  roar: { lid: 0, shut: 'happy', wink: 0, bt: 1, by: -0.2, mw: 1.2, ms: 0.2, mo: 1.25, te: 1, bl: 0.7, sm: 0.25 },
  startled: { lid: 0, shut: 'happy', wink: 0, bt: -0.3, by: 1.3, mw: 0.6, ms: 0, mo: 0.6, te: 0, bl: 0.6, sm: 0.7 },
  proud: { lid: 1, shut: 'happy', wink: 0, bt: 0.1, by: 0.8, mw: 0.95, ms: 0.8, mo: 0, te: 0, bl: 0.6, sm: 0 },
  hurt: { lid: 1, shut: 'squeeze', wink: 0, bt: -0.8, by: 0.2, mw: 0.9, ms: -0.7, mo: 0.6, te: 0.6, bl: 0.7, sm: 0 },
  dizzy: { lid: 1, shut: 'dizzy', wink: 0, bt: -0.5, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.45, te: 0, bl: 0.5, sm: 0 },
  sad: { lid: 0, shut: 'happy', wink: 0, bt: -0.95, by: 0.3, mw: 0.8, ms: -0.6, mo: 0, te: 0, bl: 0.4, sm: 0.15 },
  worried: { lid: 0, shut: 'happy', wink: 0, bt: -0.8, by: 0.5, mw: 0.8, ms: -0.4, mo: 0.15, te: 0, bl: 0.5, sm: 0.1 },
  cross: { lid: 0, shut: 'happy', wink: 0, bt: 0.95, by: -0.4, mw: 0.85, ms: -0.45, mo: 0.1, te: 0.6, bl: 0.45, sm: 0.1 },
  sleepy: { lid: 1, shut: 'sleep', wink: 0, bt: -0.2, by: -0.1, mw: 0.6, ms: 0.15, mo: 0.1, te: 0, bl: 0.5, sm: 0 },
  talk: { lid: 0, shut: 'happy', wink: 0, bt: 0.1, by: 0.4, mw: 0.9, ms: 0.4, mo: 0.4, te: 0, bl: 0.55, sm: 0 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.6, 0.1, 0.8], [1.1, 0.4, 0.55], [0.9, 0.3, 0.25], [0.7, 0.2, 0], [0.8, 0.2, 0.6]];
const EYE = { w: 3.7, h: 4.1 };

function closedLine(ctx, a, x, y, side, s, t) {
  const { w, h } = EYE;
  pen(ctx, tone(a, LASH), 1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (s === 'happy') {
    ctx.moveTo(x - w, y + 1.1);
    ctx.quadraticCurveTo(x, y - h * 0.95, x + w, y + 0.8);
    ctx.stroke();
    // (her wing still flicks out at the end of a happy eye)
    ctx.beginPath();
    ctx.moveTo(x + side * w, y + (side > 0 ? 0.8 : 1.1));
    ctx.quadraticCurveTo(x + side * (w + 0.8), y + 0.4, x + side * (w + 1.3), y - 0.4);
    ctx.stroke();
    return;
  }
  if (s === 'sleep') {
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x, y + h * 0.55, x + w, y - 0.2);
    ctx.quadraticCurveTo(x + side * (w + 0.8), y - 0.3, x + side * (w + 1.2), y - 1.1);
  } else if (s === 'squeeze') {
    ctx.moveTo(x + side * w, y - 2.2);
    ctx.quadraticCurveTo(x - side * w * 0.2, y - 0.3, x - side * w * 0.9, y + 0.2);
    ctx.quadraticCurveTo(x - side * w * 0.2, y + 0.8, x + side * w, y + 2.4);
  } else {
    for (let i = 0; i <= 26; i++) {
      const an = (i / 26) * TAU * 2 + t * 4 * side;
      const r = (i / 26) * w * 0.92;
      const p = [x + Math.cos(an) * r, y + Math.sin(an) * r * 1.05];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
  }
  ctx.stroke();
}
function eye(ctx, a, x, y, side, f, look) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.lnUid ?? 0) * 0.77) % 5.4, 4.9, 5.0, 5.08, 5.22) : 0;
  const wink = side > 0 ? f.wink : 0;
  const L = Math.max(f.lid, blink, wink);
  const closedW = sstep((L - 0.93) / 0.07);
  const shutW = wink > 0.5 && f.lid < 0.5 ? { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } : blink > f.lid + 0.05 ? { happy: 0, sleep: 1, squeeze: 0, dizzy: 0 } : f.shut;
  const inner = [x - side * w, y + 0.6];
  const outer = [x + side * w, y - 0.8];
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    for (const s of SHUTS) {
      if (shutW[s] <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= shutW[s];
      closedLine(ctx, a, x, y, side, s, t);
      ctx.restore();
    }
    ctx.restore();
  }
  const openW = 1 - closedW;
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  // a soft rose wash on the lid above the eye
  glow(ctx, x + side * 0.6, y - h * 0.95, 4.2, '#f49a9a', 0.35);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(...inner);
    ctx.bezierCurveTo(x - side * w * 0.7, y - h * 1.15, x + side * w * 0.6, y - h * 1.22, ...outer);
    ctx.bezierCurveTo(x + side * w * 1.05, y + h * 0.98, x - side * w * 0.6, y + h * 1.05, ...inner);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = tone(a, '#fffdf8');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.3 * f.sm;
  const ix = x + side * 0.2 + (look?.[0] ?? 0) * 0.8;
  const iy = y + 0.45 + (look?.[1] ?? 0) * 0.6;
  const ir = [2.75 * small, 3.15 * small];
  const g = ctx.createLinearGradient(0, iy - ir[1], 0, iy + ir[1]);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.42, tone(a, IRIS[2]));
  g.addColorStop(0.8, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#3a1a0c', 0.85), 0.42);
  ctx.stroke();
  pen(ctx, tone(a, '#fff0c0', 0.55), 0.26);
  for (const [a0, a1, rr] of [[0.25, 1.1, 2.0], [1.9, 2.7, 1.8], [3.7, 4.3, 1.85]]) {
    ctx.beginPath();
    ctx.ellipse(ix, iy + 0.2, rr * small, rr * 1.16 * small, 0, a0, a1);
    ctx.stroke();
  }
  ell(ctx, ix, iy + 0.15, 1.3 * small, 1.6 * small);
  ctx.fillStyle = tone(a, '#24100a');
  ctx.fill();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.35);
  sg.addColorStop(0, 'rgba(130,60,40,0.32)');
  sg.addColorStop(1, 'rgba(130,60,40,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.2, w * 2.6, h * 0.9);
  // the glints: a round one up at the back, a small one, and the crescent of the spotlight low down
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - side * 0.95, iy - 1.35 * small, 1.05, 1.0);
  ctx.fill();
  ell(ctx, ix + side * 1.05, iy - 0.2 * small, 0.4, 0.4);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ix, iy + 0.3, ir[0] * 0.74, ir[1] * 0.74, 0, 0.5, Math.PI - 0.5);
  pen(ctx, 'rgba(255,248,220,0.9)', 0.55);
  ctx.stroke();
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
  // the lash line: thin at the inner corner, fuller to a soft wing, two round flicks
  const top = (u) => [mix(inner[0], outer[0], u), mix(inner[1], outer[1], u) - h * 1.05 * Math.sin(Math.PI * (0.1 + u * 0.8)) + 0.15];
  const N = 12;
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(top(i / N));
  const wing = [outer[0] + side * 1.6, outer[1] - 1.2];
  ctx.beginPath();
  pts.forEach((p, i) => {
    const th = 0.18 + 0.55 * (i / N) ** 1.3;
    if (!i) ctx.moveTo(p[0], p[1] - th);
    else ctx.lineTo(p[0], p[1] - th);
  });
  ctx.quadraticCurveTo(outer[0] + side * 1.1, outer[1] - 1.2, wing[0], wing[1]);
  ctx.quadraticCurveTo(outer[0] + side * 0.6, outer[1] - 0.2, pts[N][0], pts[N][1] + 0.3);
  for (let i = N; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 0.16 + 0.36 * (i / N) ** 1.3);
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  pen(ctx, tone(a, LASH), 0.6);
  ctx.lineCap = 'round';
  for (const [u, len, ang] of [[0.7, 1.3, -1.5], [0.9, 1.5, -1.05]]) {
    const p = top(u);
    const an = side > 0 ? ang : Math.PI - ang;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1] - 0.3);
    ctx.quadraticCurveTo(p[0] + Math.cos(an) * len * 0.6, p[1] - 0.3 + Math.sin(an) * len * 0.6, p[0] + Math.cos(an + side * 0.35) * len, p[1] - 0.3 + Math.sin(an + side * 0.35) * len);
    ctx.stroke();
  }
  pen(ctx, tone(a, FUR[3], 0.5), 0.4);
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.5, y - h * 1.3);
  ctx.quadraticCurveTo(x + side * 0.4, y - h * 1.5, x + side * w * 0.95, y - h * 1.1);
  ctx.stroke();
  ctx.restore();
}
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.by * 1.1);
  ctx.rotate(side * f.bt * 0.5);
  ctx.beginPath();
  ctx.moveTo(-1.7, 0.25);
  ctx.quadraticCurveTo(0, -0.75, 1.7, 0.2);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, COCOA[1]), 1.15);
  ctx.stroke();
  ctx.restore();
}
// Her mouth under her nose: a lion's soft "y" that smiles; opens for a cheer or a roar.
function mouth(ctx, a, x, y, f) {
  const w = 2.4 * f.mw;
  const cy = y - f.ms * (f.ms < 0 ? 1.7 : 0.6);
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.3 - o * 0.3, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.7 + o * 3, x - w, cy);
    ctx.fillStyle = tone(a, '#8a2a3c');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x + 0.2, y + o * 2.4, w * 0.62, o * 1.05);
    ctx.fillStyle = tone(a, '#f2889c');
    ctx.fill();
    if (f.te > 0.05) {
      // two little soft fangs at the top corners (round-tipped)
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + s * w * 0.45 - 0.5, cy - 0.2);
        ctx.quadraticCurveTo(x + s * w * 0.45, cy + 1.6, x + s * w * 0.45 + 0.5, cy - 0.2);
        ctx.fillStyle = tone(a, '#ffffff', f.te);
        ctx.fill();
      }
    }
    ctx.restore();
    pen(ctx, tone(a, '#6a2030'), 0.5);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, '#6a2a2a'), 0.65);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - 1.2);
    ctx.lineTo(x, y - 0.2);
    ctx.moveTo(x - w, cy - 0.3);
    ctx.quadraticCurveTo(x - w * 0.5, y + 0.9 + f.ms * (f.ms < 0 ? 1.1 : 0.4), x, y - 0.2);
    ctx.quadraticCurveTo(x + w * 0.5, y + 0.9 + f.ms * (f.ms < 0 ? 1.1 : 0.4), x + w, cy - 0.5);
    ctx.stroke();
  }
}
function skullPath(ctx, tx) {
  ctx.beginPath();
  ctx.ellipse(-0.6, -1.8, 13.2, 12.4, 0, 0, TAU);
  ctx.moveTo(tx + 15.6, 5);
  ctx.ellipse(tx + 8.6, 5, 7, 5.4, -0.06, 0, TAU);
}
function ear(ctx, a, mode, x, y, r, rot, far) {
  ctx.save();
  ctx.translate(x, y + r * 0.7);
  ctx.rotate(rot);
  ell(ctx, 0, -r * 0.7, r, r * 0.92);
  paint(ctx, a, mode, far ? COCOA[1] : COCOA[0]);
  if (mode === 'fill') {
    ell(ctx, 0, -r * 0.55, r * 0.66, r * 0.6);
    ctx.fillStyle = tone(a, far ? FUR[2] : FUR[1]);
    ctx.fill();
    ell(ctx, 0.1, -r * 0.45, r * 0.34, r * 0.34);
    ctx.fillStyle = tone(a, CREAM[1], far ? 0.6 : 0.9);
    ctx.fill();
  }
  ctx.restore();
}
// Her cheek ruff: soft round tufts of cream fur either side of her face (round lobes, never points).
function ruff(ctx, a, mode, side, tx) {
  const x0 = side < 0 ? -11.4 : tx + 11.6;
  const pts = side < 0
    ? [[x0 + 1, -3], [x0 - 3.4, -1.6], [x0 - 4.6, 2.4], [x0 - 3.2, 6.6], [x0 + 0.4, 9.4], [x0 + 4, 8]]
    : [[x0 - 1, -2.2], [x0 + 3, -0.6], [x0 + 4, 3.2], [x0 + 2.4, 7], [x0 - 1, 9.2], [x0 - 4, 7.6]];
  // (its lower edge in three soft round lobes)
  const lobed = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % pts.length];
    lobed.push(p0);
    if (i >= 1 && i <= 3) lobed.push([(p0[0] + p1[0]) / 2 + side * 0.9, (p0[1] + p1[1]) / 2 + 0.9]);
  }
  smooth(ctx, lobed);
  paint(ctx, a, mode, CREAM[1], FUR[3]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, lobed);
    ctx.clip();
    glow(ctx, x0, 0, 5, FUR[1], 0.45);
    glow(ctx, x0 + side * 1.5, 7, 4, CREAM[2], 0.6);
    ctx.restore();
  }
}
// Her tiara: a gold band over her brow, a heart-shaped ruby, a curled scarlet plume of three feathers
// rooted in its clasp on her near side.
function tiara(ctx, a, mode) {
  const q = a.lnQ ?? {};
  const pl = q.plume ?? [0, 0, 0];
  // the plume (behind the band)
  for (let i = 0; i < 3; i++) {
    const root = [-7.4 + i * 0.6, -11.4];
    const b = -1.95 + i * 0.32 + pl[i];
    const pts = chain(root, [b, b - 0.35, b - 0.8], [4.4, 4.2, 3.4]);
    poly(ctx, tube(pts, [2.2, 3.4, 3, 1.8], 0.6));
    paint(ctx, a, mode, i === 1 ? RED[1] : RED[2], RED_INK);
    if (mode === 'fill') {
      ctx.beginPath();
      ctx.moveTo(...pts[0]);
      ctx.quadraticCurveTo(...pts[1], ...pts[2]);
      pen(ctx, tone(a, RED[0], 0.8), 0.45);
      ctx.stroke();
    }
  }
  // the band across her crown
  ctx.beginPath();
  ctx.moveTo(-10.6, -9.4);
  ctx.quadraticCurveTo(0, -15.6, 10.4, -10.4);
  ctx.lineTo(10.6, -8.6);
  ctx.quadraticCurveTo(0, -13.6, -10.8, -7.6);
  ctx.closePath();
  paint(ctx, a, mode, GOLD[1], GOLD[3]);
  // three little peaks, round-topped, and the heart ruby in the middle
  for (const [x, y, s] of [[-4.6, -12.6, 1.2], [0.6, -13.9, 1.6], [5.8, -12.8, 1.2]]) {
    ell(ctx, x, y - s, s, s * 1.2);
    paint(ctx, a, mode, GOLD[1], GOLD[3]);
  }
  ctx.save();
  ctx.translate(0.6, -12.6);
  ctx.beginPath();
  ctx.moveTo(0, 1.9);
  ctx.bezierCurveTo(-2.6, 0.3, -2.2, -2.1, 0, -0.9);
  ctx.bezierCurveTo(2.2, -2.1, 2.6, 0.3, 0, 1.9);
  ctx.closePath();
  paint(ctx, a, mode, RED[1], RED_INK);
  if (mode === 'fill') {
    ell(ctx, -0.8, -0.4, 0.5, 0.35, -0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(-9.4, -9.2);
    ctx.quadraticCurveTo(0, -14.4, 9.4, -10);
    pen(ctx, tone(a, GOLD[0], 0.85), 0.5);
    ctx.stroke();
    if (q.glint) sparkle(ctx, 3, -13.6, 2.2 * q.glint, q.glint, '#fffbe0');
  }
  // the clasp at the plume's root
  ell(ctx, -6.8, -10.6, 1.3, 1.3);
  paint(ctx, a, mode, GOLD[1], GOLD[3]);
}
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.lnQ ?? {};
  const f = a.lnF;
  const turn = q.turn ?? 0.4;
  const tx = turn * 2.6;
  const eA = q.earA ?? [0, 0];
  ear(ctx, a, mode, 9.2, -12.6, 4.2, 0.4 + eA[1], true);
  ruff(ctx, a, mode, 1, tx);
  skullPath(ctx, tx);
  paint(ctx, a, mode, FUR[1]);
  ruff(ctx, a, mode, -1, tx);
  if (mode === 'fill' && f) {
    ctx.save();
    skullPath(ctx, tx);
    ctx.clip();
    glow(ctx, tx - 2, -10, 12, FUR[0], 0.95);
    glow(ctx, -12, 4, 8, FUR[2], 0.5);
    // a cream muzzle and chin
    ell(ctx, tx + 8.6, 5.6, 7.2, 5.4, -0.06);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, tx + 8, 3, 4.8, CREAM[0], 0.9);
    // soft forehead markings: two little cocoa dashes over her eyes
    for (const sx of [-4.2 + tx * 0.7, 5.6 + tx]) {
      ell(ctx, sx, -9.6, 0.6, 1.4);
      ctx.fillStyle = tone(a, FUR[3], 0.5);
      ctx.fill();
    }
    ctx.restore();
    for (const [cx, s] of [[tx - 6.4, 0.85], [tx + 4.6, 1]]) {
      ell(ctx, cx, 4, 2.5, 1.4);
      ctx.fillStyle = tone(a, '#ff8a8a', (0.25 + 0.45 * f.bl) * s);
      ctx.fill();
    }
    const ex = (s) => (s < 0 ? -4.6 + tx * 0.7 : 5.6 + tx);
    for (const s of [-1, 1]) eye(ctx, a, ex(s), -1.6, s, f, q.look);
    for (const s of [-1, 1]) brow(ctx, a, ex(s) + s * 0.2, -7.6, s, f);
    // her nose: a soft rounded heart of rose at the top of the muzzle, a glint
    const nx = tx + 10;
    ctx.beginPath();
    ctx.moveTo(nx, 3.6);
    ctx.bezierCurveTo(nx - 3, 2.6, nx - 2.8, 0.2, nx, 0.9);
    ctx.bezierCurveTo(nx + 2.8, 0.2, nx + 3, 2.6, nx, 3.6);
    ctx.closePath();
    ctx.fillStyle = tone(a, NOSE[0]);
    ctx.fill();
    pen(ctx, tone(a, NOSE[1]), 0.4);
    ctx.stroke();
    ell(ctx, nx - 0.9, 1.4, 0.7, 0.4, -0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();
    // whisker dots
    for (const [dx, dy] of [[-4.6, 5.2], [-3.4, 6.6], [3.4, 5.2], [4.6, 6.6]]) {
      ell(ctx, nx + dx, dy, 0.32, 0.32);
      ctx.fillStyle = tone(a, FUR[3], 0.6);
      ctx.fill();
    }
    mouth(ctx, a, nx, 6.6, f);
    if (q.sweat >= 0) sweat(ctx, tx - 12, -5 + q.sweat * 3, 1.1);
  }
  ear(ctx, a, mode, -9.6, -11.4, 4.3, -0.4 + eA[0], false);
  tiara(ctx, a, mode);
  WK = 1;
  ctx.restore();
}

// ---------- Her costume ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
// The leotard: scarlet, a sweetheart neckline over her cream chest, rows of gold spangles following her
// body, a gold star at the heart, cut high at the hips; all cut from her own outline.
function leotard(ctx, a, mode, D) {
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
  // her cream chest above the neckline
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fillRect(-60, -90, 120, 100);
  const body = chaikin([C([st[0] - 30, st[1] + 4]), C([st[0] - 6, st[1] + 3]), C([st[0] - 1, st[1] + 6.6]), C([st[0] + 3, st[1] + 4.4]), C([st[0] + 7.4, st[1] + 6.6]), C([st[0] + 12, st[1] + 3]), C([st[0] + 30, st[1] + 4]), T([hp[0] + 30, hp[1] + 30]), T([hp[0] - 30, hp[1] + 30])], 1);
  poly(ctx, body);
  ctx.fillStyle = tone(a, RED[1]);
  ctx.fill();
  ctx.save();
  poly(ctx, body);
  ctx.clip();
  const sh = C([st[0] - 10, st[1] + 12]);
  glow(ctx, sh[0], sh[1], 8, RED[3], 0.4);
  const lt = C([st[0] + 4, st[1] + 9]);
  glow(ctx, lt[0], lt[1], 6, RED[0], 0.55);
  // spangles in curving rows round her
  for (let r = 0; r < 4; r++) {
    for (let k = -3; k <= 3; k++) {
      const P = r < 2 ? C : W;
      const base = r < 2 ? [st[0] + k * 4.4 + (r % 2) * 2.2, st[1] + 10 + r * 4.4] : [nv[0] + k * 4.6 + (r % 2) * 2.3, nv[1] - 8 + (r - 2) * 4.6];
      const p = P(base);
      ell(ctx, p[0], p[1], 0.42, 0.42);
      ctx.fillStyle = tone(a, (k + r) % 2 ? GOLD[0] : GOLD[1], 0.95);
      ctx.fill();
    }
  }
  // the hip line: high-cut, a gold trim
  ctx.beginPath();
  ctx.moveTo(...T([hp[0] - 20, hp[1] + 1]));
  ctx.quadraticCurveTo(...T([hp[0] + 2, hp[1] + 6]), ...T([hp[0] + 20, hp[1] + 1]));
  pen(ctx, tone(a, GOLD[1]), 1);
  ctx.stroke();
  ctx.restore();
  // the neckline's gold trim
  ctx.beginPath();
  ctx.moveTo(...C([st[0] - 10, st[1] + 3.6]));
  ctx.quadraticCurveTo(...C([st[0] - 2, st[1] + 4]), ...C([st[0] - 1, st[1] + 6.6]));
  ctx.quadraticCurveTo(...C([st[0] + 2, st[1] + 3.6]), ...C([st[0] + 3, st[1] + 4.4]));
  ctx.quadraticCurveTo(...C([st[0] + 4.6, st[1] + 3.6]), ...C([st[0] + 7.4, st[1] + 6.6]));
  ctx.quadraticCurveTo(...C([st[0] + 9, st[1] + 3.6]), ...C([st[0] + 14, st[1] + 3.2]));
  pen(ctx, tone(a, GOLD[1]), 0.9);
  ctx.stroke();
  ctx.restore();
  // the gold star at her heart
  const sp = C([st[0] + 3.4, st[1] + 11]);
  ctx.save();
  ctx.translate(sp[0], sp[1]);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i / 10) * TAU;
    const r = i % 2 ? 0.8 : 1.9;
    if (i) ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
    else ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  pen(ctx, tone(a, GOLD[3]), 0.5);
  ctx.stroke();
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ctx.restore();
}
// A gold cuff round her wrist (rig space).
function cuff(ctx, a, mode, D, k) {
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const Wr = ptOf(a, D, `arm${k}f`, D.J[`wr${k}`]);
  const M = [mix(E[0], Wr[0], 0.8), mix(E[1], Wr[1], 0.8)];
  const an = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]);
  ctx.save();
  ctx.translate(...M);
  ctx.rotate(an);
  smooth(ctx, [[-1.1, -2.2], [1.1, -2.2], [1.2, 2.2], [-1.1, 2.2]]);
  if (mode === 'line') {
    pen(ctx, GOLD[3], LW * 1.3);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, k === 'N' ? GOLD[1] : GOLD[2]);
    ctx.fill();
    ctx.fillStyle = tone(a, GOLD[0], k === 'N' ? 0.9 : 0.4);
    ctx.fillRect(-0.7, -2.2, 0.5, 4.4);
  }
  ctx.restore();
}
function paw(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  ctx.scale(1.15, 1.15);
  const near = k === 'N';
  const open = (a.lnQ ?? {})[`open${k}`] ?? 0;
  smooth(ctx, [[-3.8, -3], [-1.4, -4.4], [2.2, -4.2], [4, -1.2], [3.8 + open, 2.6], [1.4, 4.6 + open * 0.6], [-1.8, 4.4], [-4, 1.4]]);
  paint(ctx, a, mode, near ? FUR[1] : FUR[2], INK, LW / 1.15);
  if (mode === 'fill') {
    glow(ctx, -0.6, -1.2, 3, FUR[0], near ? 0.8 : 0.3);
    ell(ctx, 0.4, 1.6, 1.6, 1.2);
    ctx.fillStyle = tone(a, CREAM[2], near ? 0.8 : 0.5);
    ctx.fill();
  }
  ctx.restore();
}
// A gold acrobat slipper, ribbons crossed up her ankle.
function slipper(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 3.6, p[1] - 2.8], [p[0] + 0.4, p[1] - 3.6], [p[0] + 4, p[1] - 2], [p[0] + 7.6, p[1] + 0.6], [p[0] + 7.8, p[1] + 3.4], [p[0] - 4, p[1] + 3.4], [p[0] - 4.6, p[1] + 0.4]]);
  paint(ctx, a, mode, near ? GOLD[1] : GOLD[2], GOLD[3]);
  if (mode === 'fill') {
    ell(ctx, p[0] + 3.4, p[1] - 0.2, 2.2, 0.9, -0.2);
    ctx.fillStyle = tone(a, GOLD[0], near ? 0.85 : 0.4);
    ctx.fill();
    // a little scarlet bow at the front of her ankle
    for (const sd of [-1, 1]) {
      ell(ctx, p[0] + 1.6 + sd * 1.3, p[1] - 2.6, 1.3, 0.8, sd * 0.4);
      ctx.fillStyle = tone(a, near ? RED[1] : RED[2]);
      ctx.fill();
    }
    ell(ctx, p[0] + 1.6, p[1] - 2.6, 0.6, 0.6);
    ctx.fillStyle = tone(a, RED[3]);
    ctx.fill();
  }
  ctx.restore();
}
// Her short cape: three scarlet panels from her shoulders, gold-lined, each on its own spring, clamped
// so they only ever swing in behind her.
function cape(ctx, a, mode, D) {
  const q = a.lnQ ?? {};
  const sw = q.cape ?? [0, 0, 0];
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  for (let i = 2; i >= 0; i--) {
    const root = [st[0] - 8 + i * 4.4, st[1] + 1];
    const b = Math.PI / 2 + 0.55 - i * 0.14 + sw[i];
    const pts = chain(root, [b, b + 0.1 + sw[i] * 0.5, b + 0.16 + sw[i] * 0.8], [7.6, 7.6, 7]);
    const shape = tube(pts, [8, 10, 11.4, 10], 0.45);
    poly(ctx, shape);
    paint(ctx, a, mode, i === 0 ? RED[2] : RED[1], RED_INK);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, shape);
      ctx.clip();
      // the gold lining showing at its edge and hem
      ctx.beginPath();
      ctx.moveTo(pts[0][0] + 4, pts[0][1]);
      ctx.quadraticCurveTo(pts[2][0] + 4.6, pts[2][1], pts[3][0] + 4, pts[3][1] + 1);
      pen(ctx, tone(a, GOLD[1]), 1.8);
      ctx.stroke();
      glow(ctx, pts[1][0] - 2, pts[1][1], 5, RED[0], 0.4);
      ell(ctx, pts[2][0], pts[2][1] + 1, 0.6, 0.6);
      ctx.fillStyle = tone(a, GOLD[0]);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}
// Her tail: long, from inside her rump, a plump cocoa tuft at its end; a chain on springs.
function tail(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const angs = a.lnTail ?? [2.6, 2.3, 1.9, 1.5, 1.1];
  const pts = chain([h[0] - 9, h[1] - 1], angs, [5.4, 5, 4.6, 4.2, 3.6]);
  poly(ctx, tube(pts, [3.4, 3, 2.8, 2.6, 2.4, 2.2], 0.4));
  paint(ctx, a, mode, FUR[2]);
  const e = pts[5];
  const d = [Math.cos(angs[4]), Math.sin(angs[4])];
  smooth(ctx, [[e[0] - d[1] * 2.4, e[1] + d[0] * 2.4], [e[0] + d[0] * 3.4 - d[1] * 3, e[1] + d[1] * 3.4 + d[0] * 3], [e[0] + d[0] * 7.4, e[1] + d[1] * 7.4], [e[0] + d[0] * 3.4 + d[1] * 3, e[1] + d[1] * 3.4 - d[0] * 3], [e[0] + d[1] * 2.4, e[1] - d[0] * 2.4]]);
  paint(ctx, a, mode, COCOA[0], COCOA[2]);
  if (mode === 'fill') {
    ell(ctx, e[0] + d[0] * 3, e[1] + d[1] * 3 - 0.8, 1.3, 1);
    ctx.fillStyle = tone(a, '#c8906a', 0.7);
    ctx.fill();
  }
  ctx.restore();
}
function key(ctx, a, mode, D) {
  const q = a.lnQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  ctx.translate(st[0] - 12.4, st[1] + 6);
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
// A trapeze lowered to her (rig space, from far above): two pale ropes and a gold bar at `grip`.
function trapeze(ctx, a, grip, al, up = -1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(grip[0] + s * 7 - (a.lnQ?.ropeLean ?? 0) * 40, grip[1] + up * 140);
    ctx.lineTo(grip[0] + s * 7, grip[1]);
    pen(ctx, '#bfb2d8', 1.2);
    ctx.stroke();
    pen(ctx, '#f4f0ff', 0.5);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(grip[0] - 8, grip[1]);
  ctx.lineTo(grip[0] + 8, grip[1]);
  pen(ctx, tone(a, GOLD[3]), 2.6);
  ctx.stroke();
  pen(ctx, tone(a, GOLD[1]), 1.4);
  ctx.stroke();
  ctx.restore();
}
// Juggling pins (rig space) over her paws.
function pinArt(ctx, x, y, s, ang) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.3);
  ctx.bezierCurveTo(s * 0.45, -s * 1.3, s * 0.3, -s * 0.5, s * 0.6, s * 0.4);
  ctx.bezierCurveTo(s * 0.8, s * 1.2, -s * 0.8, s * 1.2, -s * 0.6, s * 0.4);
  ctx.bezierCurveTo(-s * 0.3, -s * 0.5, -s * 0.45, -s * 1.3, 0, -s * 1.3);
  ctx.closePath();
  pen(ctx, RED[3], 0.5);
  ctx.stroke();
  ctx.fillStyle = '#fffdf4';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = RED[1];
  ctx.fillRect(-s, -s * 0.55, s * 2, s * 0.32);
  ctx.fillRect(-s, s * 0.35, s * 2, s * 0.32);
  ctx.restore();
  ctx.restore();
}

// ---------- Her act and her fight ----------
const SWINGS = ['swipe', 'kick', 'tailwhip'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.lnN ?? 0) % SWINGS.length]);
const READY = { shN: -50, elN: -80, hwN: -10, shF: -30, elF: -90, hwF: -10 };
// (the height of her middle over her feet: what a flip of the whole figure turns round)
const MID = 15;
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'showtime', look: [0.4, 0], turn: 0.4, sweat: -1, fx: null, keyRate: 1.5, rot: 0, pivot: MID, openN: 0, openF: 0, trap: 0, grip: null, pins: 0, pinRate: 1.6, glint: 0 };
  a.lnQ = q;
  a.lnUid = (m.uid ?? 0) % 7;
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
  const breath = Math.sin(t * 1.5);
  const cineMood = m.cine?.mood;
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  const alive = m.hp > 0;
  const low = alive && m.hp / m.def.hp < 0.25;
  // ----- her casts (world/carnival.js) and her swings at the tank -----
  const cast = alive && m.cast && m.castPose ? m.cast : null;
  if (cast && st.lnCastT0 !== cast.t0) {
    st.lnCastT0 = cast.t0;
    st.lnMove = m.castPose;
  }
  const since = now - (m.attackAt ?? -9);
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.45);
  const winding = alive && !cast && m.windup > 0;
  if (winding && !(now - (st.lnWindAt ?? -9) < 0.25)) {
    st.lnN = (st.lnN ?? m.uid ?? 0) + 1;
    st.lnMove = pickSwing(m, st);
  }
  if (winding) st.lnWindAt = now;
  const struck = alive && since >= 0 && since < 1.1;
  const mv = cast ? st.lnMove : winding || struck ? (st.lnMove ??= SWINGS[0]) : null;
  const cu = cast ? clamp((now - cast.t0) / cast.dur, 0, 1) : 1;
  const ct = cast ? now - cast.t0 : 99;
  // (the last half second of a cast or a swing's wind-up gathers; the blow lands as it ends)
  let W = 0;
  if (cast) W = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  else if (winding) W = clamp(1 - m.windup / total, 0, 1);
  const s = cast || winding ? -1 : since;
  const busy = !alive || Boolean(mv) || Boolean(m.dash);
  if (busy) st.lnFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.lnFreeAt ?? -9)) / 0.35);
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;

  // Standing: hips cocked, chin up, the showgirl's smile, the tail curling.
  go({ shN: 14, elN: -34, hwN: -10, shF: -10, elF: -40, hwF: 10, tilt: -2, chest: -2 + breath * 0.5, head: -3 + Math.sin(t * 0.6) * 1.2, pelvis: 2 }, 1);
  if (walkW > 0.01) {
    const u = a.blkidU ?? a.wp ?? 0;
    add({ shN: Math.sin(u * TAU) * 12, shF: -Math.sin(u * TAU) * 12, tilt: 1, head: -2 }, walkW);
    q.turn = mix(q.turn, 0.6, walkW);
  }
  if (fighting && !busy) {
    go({ ...READY, tilt: 4, drop: 0.08, head: 2 }, 0.85 * freeK);
    say('focus');
    q.turn = 0.6;
    q.keyRate = 2.6;
  }
  if (fighting && !st.lnHunt) st.lnBangAt = now;
  if (!fighting && st.lnHunt && alive) st.lnLostAt = now;
  st.lnHunt = fighting;
  q.bang = now - (st.lnBangAt ?? -9);
  q.huh = now - (st.lnLostAt ?? -9);
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // a blown kiss to the crowd
    const k = win(gloat, 0, 0.25, 0.9, 1.4) * freeK;
    go({ shN: -120, elN: -110, hwN: 20, head: -6, tilt: -3 }, k * win(gloat, 0, 0.2, 0.5, 0.7));
    go({ shN: -150, elN: -10, hwN: -20, head: -6 }, k * sstep((gloat - 0.5) / 0.2));
    say('wink', k);
    q.fx = { kind: 'kiss', u: gloat };
  }
  if (!alive) {
    st.lnDeadAt ??= now;
    go({ drop: 0.85, tilt: -12, head: 16, shN: 30, elN: -30, shF: 40, elF: -20, fxN: 0.5, fxF: 0.2 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.keyRate = 0;
    q.fx = { kind: 'beaten', u: now - st.lnDeadAt };
  } else st.lnDeadAt = undefined;

  if (alive && mv) {
    q.keyRate = 4;
    const snap = s >= 0 ? sstep(s / 0.14) : 0;
    const rel = s >= 0 ? 1 - sstep((s - 0.45) / 0.55) : 0;
    const hitK = snap * rel;
    const wu = sstep(W) * (1 - snap);
    // (acted through the cast, eased away with the landing)
    const perf = cast ? sstep(ct / 0.35) : s >= 0 ? rel : 0;
    if (mv === 'swipe') {
      go({ shN: -150, elN: -40, tilt: -6, head: -4, turnC: -0.3 }, wu);
      go({ shN: -40, elN: -10, tilt: 10, head: 4, x: 0.04, turnC: 0.3 }, hitK);
      say(hitK > 0.2 ? 'fierce' : 'focus');
      q.openN = Math.max(wu, hitK);
      if (s >= 0 && s < 0.4) q.fx = { kind: 'swipe', u: s };
    } else if (mv === 'kick') {
      go({ fxN: 0.1, fyN: -0.45, tilt: -6, ...READY }, wu);
      go({ fxN: 1.0, fyN: -0.7, tilt: -14, head: -4, x: 0.03, shN: 20, elN: -30, shF: -60 }, hitK);
      say(hitK > 0.2 ? 'fierce' : 'focus');
      if (s >= 0 && s < 0.4) q.fx = { kind: 'kick', u: s };
    } else if (mv === 'tailwhip') {
      go({ tilt: 6, head: -6, turnC: -0.5, shN: 30, shF: -40 }, wu);
      go({ tilt: -4, turnC: 0.5, head: 6, x: 0.03 }, hitK);
      q.tailWhip = hitK - wu * 0.6;
      say(hitK > 0.2 ? 'wink' : 'focus');
      if (s >= 0 && s < 0.4) q.fx = { kind: 'tailwhip', u: s };
    } else if (mv === 'juggle') {
      // three pins juggled, faster and faster, then flung up high
      go({ shN: -80 + Math.sin(now * 12) * 16, elN: -90, shF: -80 - Math.sin(now * 12) * 16, elF: -90, head: -8 }, perf * (1 - wu));
      go({ shN: -165, elN: -10, shF: 140, elF: 16, tilt: -6, head: -10 }, Math.max(wu, hitK));
      q.pins = perf * (1 - hitK);
      q.pinRate = 1.6 + cu * 2.2;
      say(hitK > 0.2 ? 'dazzle' : 'focus');
      q.look = [0.2, -1];
    } else if (mv === 'leap') {
      // a deep crouch, tail lashing, then a pounce at the tank
      go({ drop: 0.3, tilt: 16, head: -6, ...READY, shN: 30, shF: 20 }, Math.max(perf * 0.6, wu));
      const air = s >= 0 ? Math.sin(Math.PI * clamp(s / 0.4, 0, 1)) : 0;
      go({ hop: 0.3 * air, x: 0.24, tilt: 20, shN: -120, elN: -20, shF: -110, elF: -20, fxN: -0.4, fyN: -0.3, fxF: -0.6, fyF: -0.2 }, hitK);
      say(hitK > 0.2 ? 'roar' : 'fierce');
      if (s >= 0 && s < 0.7) q.fx = { kind: 'leap', u: s };
    } else if (mv === 'pyramid') {
      // a paw pointing out the spot, then both arms up: "hup!"
      go({ shN: -95, elN: -6, hwN: -20, head: -2, tilt: 3 }, perf * (1 - wu));
      go({ shN: -170, elN: -10, shF: 140, elF: 16, lift: 0.03, tilt: -4 }, Math.max(wu, hitK));
      q.openN = 1;
      q.openF = Math.max(wu, hitK);
      say(hitK > 0.2 ? 'dazzle' : 'showtime');
    } else if (mv === 'cartwheel') {
      // arms up, then cartwheels right across the ring (m.dash: two turns, a clean rotation of the
      // whole figure about her middle, never a squash)
      go({ shN: -165, elN: -10, shF: 140, elF: 16, tilt: -4 }, Math.max(perf * 0.7, wu));
      say('wink');
    } else if (mv === 'swing') {
      // a trapeze lowered to her: grabbed with both paws, lifted, swung out wide either side
      const lower = cast ? sstep(cu / 0.4) : 1;
      const lifted = cast ? sstep((cu - 0.4) / 0.25) : 1;
      const swingA = (cast ? Math.sin((ct - cast.dur * 0.6) * 3.2) * 0.9 * sstep((cu - 0.6) / 0.2) : Math.sin(s * 6) * 1.1 * rel);
      go({ shN: -172, elN: -4, shF: -172, elF: -4, hwN: 0, hwF: 0, fyN: -0.2, fyF: -0.1, fxN: 0.2 }, Math.max(lifted, hitK));
      add({ hop: 0.22 * Math.max(cast ? lifted : 0, s >= 0 ? rel : 0) }, 1);
      q.trap = Math.max(lower, s >= 0 ? rel : 0);
      q.hang = Math.max(lifted * (cast ? 1 : 0), s >= 0 ? rel : 0);
      q.swingA = swingA;
      say(hitK > 0.2 ? 'dazzle' : 'wink');
    } else if (mv === 'spot') {
      // a showgirl's pose: one paw flung up to the lights, a hip cocked, a wink
      go({ shN: -150, elN: -10, hwN: -20, shF: 30, elF: -100, pelvis: 6, tilt: -5, head: -8 }, Math.max(perf, hitK));
      q.openN = 1;
      say('wink');
      q.look = [0.6, -1];
      q.glint = perf;
    } else if (mv === 'cannon') {
      // tucked into a ball (rolled up: arms round her knees) as she's fired across (m.dash)
      go({ drop: 0.4, tilt: 30, head: 20, shN: 30, elN: -120, shF: 20, elF: -120, fxN: 0.2, fyN: -0.35, fxF: 0.1, fyF: -0.3 }, Math.max(perf * 0.4 + wu * 0.6, 0));
      say('fierce');
    } else if (mv === 'ovation') {
      // a deep bow, arms flung wide; up with a dazzling smile as the crowd roars
      go({ tilt: 34, head: 22, drop: 0.12, shN: 40, elN: -10, shF: -10, elF: -10, fxF: -0.35 }, perf * (1 - wu));
      go({ tilt: -8, shN: -160, elN: -10, shF: 140, elF: 16, head: -10 }, Math.max(wu, hitK));
      say(perf > 0.4 && wu < 0.3 ? 'proud' : 'dazzle');
      q.openN = 1;
      q.openF = 1;
    }
  }
  // the dash: across the ring cartwheeling (two turns), or as a cannonball (a tuck, spinning on an arc)
  const D0 = m.dash;
  if (alive && D0) {
    const u = clamp((now - D0.t0) / D0.dur, 0, 1);
    if (D0.kind === 'cannon') {
      go({ drop: 0.4, tilt: 30, head: 20, shN: 30, elN: -120, shF: 20, elF: -120, fxN: 0.2, fyN: -0.35, fxF: 0.1, fyF: -0.3 }, 1);
      add({ hop: 0.9 * Math.sin(Math.PI * u) }, 1);
      q.rot = u * TAU * 2;
      say('fierce');
      q.fx = { kind: 'cannon', u };
    } else {
      go({ shN: -165, elN: -6, shF: 140, elF: 10, fxN: 0.3, fxF: -0.3 }, 1);
      add({ hop: 0.12 * Math.abs(Math.sin(Math.PI * u * 2)) }, 1);
      q.rot = u * TAU * 2;
      say('dazzle');
      q.fx = { kind: 'cartwheel', u };
    }
  }
  if (alive) {
    if (hurt && !mv && !D0) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -12, x: -0.02, ...READY }, k);
      say('hurt', k * 2);
      q.earKick = k;
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    // a phase moment (m.phaseAt): the trapeze (a whistle, a paw up), the finale (a great roar)
    const pu = now - (m.phaseAt ?? -9);
    if (pu >= 0 && pu < 1.6 && !mv) {
      const k = win(pu, 0, 0.25, 1.2, 1.6);
      if ((m.mech?.phase ?? 1) >= 3) {
        go({ tilt: -12, head: -16, chest: -6, shN: -150, elN: -30, shF: 130, elF: 30, drop: 0.08 }, k);
        say('roar', k);
        q.fx = { kind: 'roar', u: pu };
      } else {
        go({ shN: -168, elN: -10, hwN: -30, head: -10, tilt: -3, shF: 20, elF: -100 }, k);
        say('wink', k);
        q.fx = { kind: 'whistle', u: pu };
      }
    }
    // ----- her entrance's acts -----
    if (act && actU >= 0) {
      const d = act.dur ?? 1;
      const ka = win(actU, 0, 0.2, d - 0.1, d + 0.3);
      if (act.move === 'trapeze' && actU < d) {
        // high over the ring on a trapeze, hanging by her knees, swinging, waving to the crowd
        const sw = Math.sin(actU * 2.4) * 0.5;
        q.trap = 1;
        q.knees = 1;
        q.swingA = sw;
        add({ hop: 2.7 }, 1);
        go({ fyN: -0.5, fxN: -0.45, fyF: -0.5, fxF: -0.4, shN: 150 + Math.sin(actU * 8) * 20, elN: -20, shF: 160, elF: -10, head: 30 }, 1);
        q.rot = Math.PI + sw;
        q.pivot = 4;
        say('dazzle');
      } else if (act.move === 'somersault' && actU < d + 0.4) {
        // she lets go: a triple somersault down to the ring, landing in a crouch (and up out of it)
        const u = clamp(actU / d, 0, 1);
        const fall = 1 - sstep(u);
        add({ hop: 2.7 * (1 - u * u) }, 1);
        go({ drop: 0.4, tilt: 30, head: 20, shN: 30, elN: -120, shF: 20, elF: -120, fyN: -0.35, fyF: -0.3 }, u < 0.85 ? 1 : 1 - sstep((u - 0.85) / 0.15));
        q.rot = sstep(u) * TAU * 3 + Math.PI * fall * 0;
        if (u >= 0.85) go({ drop: 0.25, tilt: 10, ...READY }, sstep((u - 0.85) / 0.15) * (1 - sstep((actU - d) / 0.4)));
        say('fierce');
        if (u > 0.95) q.fx = { kind: 'land', u: actU - d * 0.95 };
      } else if (act.move === 'tada') {
        go({ shN: -165, elN: -10, shF: 140, elF: 16, tilt: -6, head: -8, fxF: -0.25, lift: 0.02 }, ka);
        q.openN = 1;
        q.openF = 1;
        say('dazzle', ka);
        q.glint = ka;
        q.fx = { kind: 'tada', u: actU };
      } else if (act.move === 'windup') {
        go({ drop: 0.3, tilt: 16, ...READY, shN: 30 }, ka);
        q.tailWhip = Math.sin(actU * 10) * 0.4 * ka;
        say('fierce', ka);
      } else if (act.move === 'sway') {
        go({ tilt: Math.sin(actU * (act.speed ?? 3.5)) * 6, shN: -140, elN: -20, head: -4 }, ka);
        say('dazzle', ka);
      }
    }
    // her idle act: only when calm
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.lnCalm = mix(st.lnCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.lnCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, q, sstep(st.lnCalm), t, now, st);
    if (cineMood && !mv) q.mood = { angry: 'fierce', happy: 'dazzle', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !mv) {
      if (!cineMood) q.mood = q.mood === 'showtime' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
      q.keyRate *= 0.5;
    }
    if (m.talking) q.mood = 'talk';
  }
  q.turn = spring(st, 'lnTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.showtime;
  const f = (st.lnF ??= { ...FACES.showtime, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'wink', 'bt', 'by', 'mw', 'ms', 'mo', 'te', 'bl', 'sm']) f[k] = mix(f[k], tgt[k], k === 'lid' || k === 'wink' ? 1 - Math.exp(-dt * (tgt[k] > f[k] ? 40 : 18)) : kf);
  for (const sh of SHUTS) f.shut[sh] = mix(f.shut[sh], sh === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.lnF = f;
  // the whole figure turned (a flip, a cartwheel, a swing from the trapeze): eased, kept for the draw
  // (an angle that jumps by a whole turn is unwound first, so it never spins back)
  // (her hops are lifted outside the turn, so a hop is always up: never down through the floor
  // when she's upside down on the trapeze or mid-somersault)
  const raise0 = st.lnRaise;
  st.lnRaise = (out.hop ?? 0) * (c.H ?? 0);
  st.lnRaiseV = raise0 == null || !(a.dt > 0) ? 0 : (st.lnRaise - raise0) / Math.min(0.25, a.dt);
  out.hop = 0;
  const target = q.rot + (q.hang ? q.swingA ?? 0 : 0);
  const rot0 = st.lnRot;
  st.lnRot = st.lnRot == null ? target : st.lnRot + (target + TAU * Math.round((st.lnRot - target) / TAU) - st.lnRot) * (Math.abs(target - st.lnRot) > 1.2 && (m.dash || act) ? 1 : 1 - Math.exp(-Math.min(0.25, a.dt ?? 0) * 14));
  // (the pivot: her middle; her paws on the trapeze's bar when she swings from it; her knees over it)
  // (how fast she's turning, so the next picture leads by its own frame's time, a slow frame included)
  st.lnRotV = rot0 == null || !(a.dt > 0) ? 0 : (st.lnRot - rot0) / Math.min(0.25, a.dt);
  // (which way the trapeze's ropes run while it fades: up from her knees, or up from her paws)
  q.trapUp = st.lnTrapUp = q.knees ? 1 : q.trap > 0.5 ? -1 : st.lnTrapUp ?? -1;
  st.lnPivot = q.knees ? 6 : q.hang ? 28 : q.pivot ?? MID;
  // springs: ears, plume, cape, tail
  const kick = (st.lnLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.lnLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.lnLast = out.head;
  st.lnLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  const headR = (((out.head ?? 0) + (out.tilt ?? 0)) * Math.PI) / 180;
  q.earA = [0, 1].map((i) => spring(st, `ear${i}`, (q.earKick ?? 0) * (i ? 0.4 : -0.4) + Math.sin(t * 1.3 + i * 2) * 0.04 + (q.mood === 'sad' ? (i ? 0.3 : -0.3) : 0), 100, 9, dt, kick * 0.01));
  q.plume = [0, 1, 2].map((i) => clamp(spring(st, `pl${i}`, -headR * 0.5 + Math.sin(t * 1.6 + i) * 0.08 + step * 0.12, 70 - i * 8, 6, dt, kick * 0.012 * (i + 1)), -0.8, 0.8));
  q.cape = [0, 1, 2].map((i) => clamp(spring(st, `cp${i}`, -((out.tilt ?? 0) * Math.PI) / 180 * 0.6 + walkW * 0.25 + Math.sin(t * 1.4 + i) * 0.05 + step * 0.12, 80 - i * 8, 7, dt, kick * 0.01), -0.2, 0.9));
  const tw = q.tailWhip ?? 0;
  a.lnTail = [0, 1, 2, 3, 4].map((i) => spring(st, `tl${i}`, [2.6, 2.3, 1.95, 1.55, 1.15][i] - headR * 0.3 + Math.sin(t * 1.4 - i * 0.5) * 0.12 + step * 0.12 - tw * (0.6 + i * 0.2), 80 - i * 8, 7, dt, kick * 0.01));
  st.lnKeyRate = mix(st.lnKeyRate ?? q.keyRate, q.keyRate, 1 - Math.exp(-dt * 3));
  st.lnKeyA = ((st.lnKeyA ?? (m.uid ?? 0) * 0.7) + st.lnKeyRate * dt) % (TAU * 100);
  q.keyA = st.lnKeyA;
  q.pinsK = spring(st, 'pinsK', q.pins, 120, 14, dt);
  st.lnPinPh = ((st.lnPinPh ?? 0) + q.pinRate * dt) % 1000;
  q.pinPh = st.lnPinPh;
  q.trapK = clamp(spring(st, 'trapK', q.trap, 90, 13, dt), 0, 1);
}
const PIECES = [
  { name: 'stretch', t0: 0.4, len: 6.6 },
  { name: 'flips', t0: 7.6, len: 7.2 },
  { name: 'juggle', t0: 15.4, len: 7.6 },
  { name: 'crowd', t0: 23.6, len: 6 },
];
function idleAct(m, a, out, go, add, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.lnPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.lnPiece = cur.name;
      else return;
    }
  } else {
    st.lnPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'stretch') {
    // a deep lunge, an arm stretched overhead and over to the side, then the other
    const k = win(u, 0, 0.5, 6.1, 6.6);
    const l1 = win(u, 0.5, 1.2, 2.6, 3.2);
    const l2 = win(u, 3.2, 3.8, 5.2, 5.8);
    go({ fxN: 0.55, fxF: -0.35, drop: 0.2, shF: 150, elF: 10, tilt: 8, head: 4, chest: 6 }, l1 * k * w);
    go({ fxN: -0.2, fxF: 0.3, drop: 0.1, shN: -170, elN: -10, tilt: -10, chest: -8 }, l2 * k * w);
    if (at(k)) q.mood = l1 + l2 > 0.4 ? 'proud' : 'showtime';
  } else if (cur.name === 'flips') {
    // two standing back-flips (a crouch, up, the whole figure turned once round her middle, a landing
    // crouch), then arms up for the crowd
    const k = win(u, 0, 0.5, 6.7, 7.2);
    let rot = 0;
    let mood = 'focus';
    for (const f0 of [1.2, 3.5]) {
      const crouch = win(u, f0 - 0.5, f0 - 0.15, f0, f0 + 0.05) + win(u, f0 + 0.8, f0 + 0.9, f0 + 1.05, f0 + 1.4);
      go({ drop: 0.32, tilt: 14, head: -4, ...READY }, crouch * 0.8 * k * w);
      const p = (u - f0) / 0.9;
      if (p > 0 && p < 1) {
        add({ hop: 0.85 * Math.sin(Math.PI * p) ** 1.4 }, k * w);
        go({ drop: 0.2, shN: 20, elN: -120, shF: 10, elF: -120, fxN: 0.25, fyN: -0.35, fxF: 0.15, fyF: -0.3, head: 12 }, Math.sin(Math.PI * p) * k * w);
        rot = -TAU * sstep(p);
        mood = 'dazzle';
      }
    }
    const tada = win(u, 5.0, 5.4, 6.3, 6.8);
    go({ shN: -160, elN: -10, shF: 140, elF: 16, tilt: -5, head: -8 }, tada * k * w);
    // (the turn follows the act's own weight, so a hit or a call mid-flip eases her out of it)
    if (k * w > 0.01) {
      q.rot = rot * sstep(k * w);
      q.pivot = MID;
    }
    if (at(k)) {
      q.mood = tada > 0.3 ? 'proud' : mood;
      if (u > 5.0 && u < 6) q.fx = { kind: 'tada', u: u - 5.0 };
    }
  } else if (cur.name === 'juggle') {
    // three pins juggled in a cascade, her eyes on them
    const k = win(u, 0, 0.5, 7.1, 7.6);
    const on = win(u, 0.5, 1.0, 6.4, 7.0);
    go({ shN: -80 + Math.sin(now * 9.6) * 14, elN: -90, shF: -80 - Math.sin(now * 9.6) * 14, elF: -90, head: -8 }, on * k * w);
    if (at(k)) {
      q.pins = on;
      q.pinRate = 1.6;
      q.look = [0.2, -1];
      q.mood = u > 6.4 ? 'dazzle' : 'focus';
    }
  } else {
    // playing to the crowd: a big wave, then a blown kiss
    const k = win(u, 0, 0.4, 5.6, 6);
    const wave = win(u, 0.4, 0.8, 2.6, 3.0);
    const kiss = win(u, 3.2, 3.5, 4.6, 5.2);
    go({ shN: -145, elN: -30 + Math.sin(now * 9) * 22, hwN: -20, head: -4 }, wave * k * w);
    go({ shN: -110, elN: -120, hwN: 20, head: -4 }, kiss * k * w * (u < 4 ? 1 : 0.0001));
    go({ shN: -150, elN: -10, hwN: -20 }, kiss * k * w * (u >= 4 ? 1 : 0.0001));
    if (at(k)) {
      q.mood = kiss > 0.3 ? 'wink' : 'dazzle';
      q.openN = 1;
      if (u > 4 && u < 5.4) q.fx = { kind: 'kiss', u: u - 3.6 };
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
  // her marks sit in a gold star-burst
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const an = -Math.PI / 2 + (i / 16) * TAU;
    const r = i % 2 ? 4.8 : 6;
    if (i) ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
    else ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#fff8e0';
  ctx.fill();
  pen(ctx, mark === '!' ? '#e2404e' : '#c8902c', 1);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#e2404e' : '#c8902c';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 0.5);
  } else {
    ctx.moveTo(-1.4, -1.6);
    ctx.quadraticCurveTo(-1.1, -3.3, 0.4, -3.1);
    ctx.quadraticCurveTo(1.9, -2.8, 1.3, -1.2);
    ctx.quadraticCurveTo(0.3, -0.5, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.4, 0.85, 0.85);
  ctx.fill();
  ctx.restore();
}
function heart(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 1.1, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 1.1, y - s * 1.05, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
  ctx.closePath();
  pen(ctx, '#b02a3c', Math.max(0.6, s * 0.22));
  ctx.stroke();
  ctx.fillStyle = '#ff7a8a';
  ctx.fill();
  ell(ctx, x - s * 0.42, y - s * 0.3, s * 0.2, s * 0.13, -0.6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function swish(ctx, cx, cy, r, a0, a1, w, al, col = '#fff4f0', rim = '#e2404e') {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const n = 18;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const an = a0 + (a1 - a0) * u;
    const ww = w * Math.sin(Math.PI * u) ** 0.8;
    pts.push([[cx + Math.cos(an) * (r + ww / 2), cy + Math.sin(an) * (r + ww / 2)], [cx + Math.cos(an) * (r - ww / 2), cy + Math.sin(an) * (r - ww / 2)]]);
  }
  ctx.beginPath();
  pts.forEach(([p], i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  for (let i = n; i >= 0; i--) ctx.lineTo(...pts[i][1]);
  ctx.closePath();
  pen(ctx, rim, 1.1);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  const q = a.lnQ ?? {};
  // the trapeze over her (behind her: its bar in her paws)
  if (q.trapK > 0.01) {
    const hN = ptOf(a, D, 'handN', D.J.handN);
    const hF = ptOf(a, D, 'handF', D.J.handF);
    const grip = q.trapUp === 1 ? [(hN[0] + hF[0]) / 2, ptOf(a, D, 'shinN', D.J.kneeN)[1]] : [(hN[0] + hF[0]) / 2, Math.min(hN[1], hF[1]) - 1];
    const drop = (1 - q.trapK) * 90;
    // (hung by her knees she's turned over: the ropes still go up to the rigging)
    trapeze(ctx, a, [grip[0], grip[1] + drop * (q.trapUp ?? -1)], q.trapK, q.trapUp ?? -1);
  }
  for (const mode of ['line', 'fill']) {
    tail(ctx, a, mode, D);
    cape(ctx, a, mode, D);
    key(ctx, a, mode, D);
  }
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.lnQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = (a.flip ? -1 : 1);
  const crown = headAt(a, D, [0, -22]);
  const hd = headAt(a, D, [4, 0]);
  const hN = ptOf(a, D, 'handN', D.J.handN);
  const hF = ptOf(a, D, 'handF', D.J.handF);
  // juggled pins over her paws
  if (q.pinsK > 0.02) {
    const mid = [(hN[0] + hF[0]) / 2, Math.min(hN[1], hF[1])];
    for (let k = 0; k < 3; k++) {
      const ph = (q.pinPh + k / 3) % 1;
      const px = mid[0] + Math.cos(ph * TAU) * 6;
      const py = mid[1] - 4 - 14 * Math.sin(Math.PI * ph) * q.pinsK;
      ctx.save();
      ctx.globalAlpha *= q.pinsK;
      pinArt(ctx, px, py, 2.2, ph * TAU * 2 + k);
      ctx.restore();
    }
  }
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0 && !m.cine) bubble(ctx, crown[0] + 4, crown[1] - 6, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0 && !m.cine) bubble(ctx, crown[0] + 4, crown[1] - 6, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  if (X.kind === 'swipe') {
    const k = clamp(u / 0.35, 0, 1);
    swish(ctx, hd[0], hd[1] + 10, 16, -1.6 + k * 0.4, 0.4 + k * 0.4, 4, 1 - k);
  } else if (X.kind === 'kick') {
    const fN = ptOf(a, D, 'footN', [D.J.ankN[0] + 7, D.J.ankN[1]]);
    const k = clamp(u / 0.35, 0, 1);
    swish(ctx, fN[0] - 8, fN[1] + 6, 12, -1.4, -1.4 + 1.6 * k, 3.4, 1 - k * 0.7);
    for (let i = 0; i < 3; i++) star(ctx, fN[0] + 3 + Math.cos(i * 1.2 - 1) * (2 + k * 6), fN[1] + Math.sin(i * 1.2 - 1) * (2 + k * 5), 1.8 * (1 - k * 0.5), i, 1 - k * 0.6);
  } else if (X.kind === 'tailwhip') {
    const k = clamp(u / 0.35, 0, 1);
    swish(ctx, -8, -12, 16, Math.PI * 0.4 + k * 0.8, Math.PI * 1.2 + k * 0.8, 3.4, 1 - k, '#fff4e0', '#b0743a');
  } else if (X.kind === 'leap' || X.kind === 'land') {
    const v = clamp(u / 0.6, 0, 1);
    dust(ctx, -6, -1.5, 3 + v * 4, 0.7 * (1 - v), '#fff2d8', '#d6b07a');
    dust(ctx, 8, -1.5, 3 + v * 4, 0.7 * (1 - v), '#fff2d8', '#d6b07a');
  } else if (X.kind === 'cartwheel') {
    if (u < 0.95) for (let i = 0; i < 3; i++) star(ctx, -12 - i * 8, -4 - i * 3 - Math.sin(u * 10 + i) * 2, 2.2 * (1 - i * 0.25), u * 6 + i, (1 - u) * (1 - i * 0.2));
    dust(ctx, -6, -1.5, 3, 0.4 * (1 - u), '#fff2d8', '#d6b07a');
  } else if (X.kind === 'cannon') {
    for (let i = 1; i <= 4; i++) {
      ell(ctx, -i * 6, -16 + Math.sin(i + u * 8) * 1.5, 2.6 - i * 0.4, 2.2 - i * 0.35);
      ctx.fillStyle = `rgba(255,242,216,${(0.8 - i * 0.16).toFixed(3)})`;
      ctx.fill();
    }
  } else if (X.kind === 'tada') {
    const v = clamp(u / 1.4, 0, 1);
    for (let i = 0; i < 5; i++) sparkle(ctx, hd[0] - 18 + i * 9, hd[1] - 16 - Math.sin(Math.PI * clamp(v + i * 0.08, 0, 1)) * 8, 2.4 * Math.sin(Math.PI * v), 1, i % 2 ? '#fff0c0' : '#ffe0e8');
    if (u < 1.2) cue(ctx, 'ta-da!', hd[0] + 20, hd[1] - 24, 7, fl, -0.12, '#b02a3c');
  } else if (X.kind === 'kiss') {
    const v = clamp((u - 0.4) / 1, 0, 1);
    heart(ctx, hd[0] + 10 + v * 14, hd[1] - 2 - v * 10, 2.4 + v, Math.sin(Math.PI * v));
  } else if (X.kind === 'whistle') {
    if (u < 1.2) cue(ctx, 'hup!', hd[0] + 18, hd[1] - 22, 7, fl, -0.12, '#b02a3c');
    note(ctx, hd[0] + 12 + u * 6, hd[1] - 6 - u * 10, 1.6, -0.2, Math.sin(Math.PI * clamp(u / 1.4, 0, 1)), '#c8902c');
  } else if (X.kind === 'roar') {
    const v = clamp(u / 1.2, 0, 1);
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.globalAlpha *= (1 - v) * 0.8;
      ctx.beginPath();
      ctx.ellipse(hd[0] + 12, hd[1] + 2, 6 + v * 26 + i * 6, 4 + v * 14 + i * 4, 0, -0.9, 0.9);
      pen(ctx, '#f6c94e', 2);
      ctx.stroke();
      ctx.restore();
    }
    if (u < 1.2) cue(ctx, 'ROAAAR!', hd[0] + 24, hd[1] - 22, 8, fl, -0.1, '#b02a3c');
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) sparkle(ctx, hd[0] - 6 - v * 6 + i * 4, hd[1] - 8 - v * 5 - i * 2.4, 1.6 * (1 - v), 1 - v, '#fff6c8');
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] + 4, 9, t, 3);
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.4, 0.6 * (1 - u / 0.6), '#fff2d8', '#d6b07a');
  }
}

const DRESS = {
  id: 'leonie',
  // (the skin is her fur; her leotard is cut over it from the same outline)
  skin: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => leotard(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => slipper(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => slipper(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('lioness', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  // (a flip of the whole figure about her middle, or a swing about the trapeze's bar: the picture
  // turned round, never squashed)
  const st = a.mo?.rig;
  const rot = (st?.lnRot ?? 0) + (st?.lnRotV ?? 0) * Math.min(0.1, a.dt ?? 0);
  // (both led by their own frame's time, as the picture is drawn before this frame's pose is worked out)
  if (st?.lnRaise) ctx.translate(0, -(st.lnRaise + (st.lnRaiseV ?? 0) * Math.min(0.1, a.dt ?? 0)));
  if (Math.abs(rot) > 0.001) {
    const py = st.lnPivot ?? MID;
    ctx.translate(0, -py);
    ctx.rotate(rot);
    ctx.translate(0, py);
  }
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.4);
export const LEONIE_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [90, 160, 280, 220], draw: R.still, rig, noHop: true, ownEmotes: true };
export const LEONIE_SIZE = { w: 46, h: Math.round(R.H * BIG * 1.05), speed: Math.round(R.speed * BIG) };
