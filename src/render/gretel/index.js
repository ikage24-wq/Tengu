// Gretel, the Gingerbread Knight, on screen (2026-11-27, redrawn from scratch: the Gingerbread Ramparts'
// knight, her story, lines and role kept; world/volcano.js her new fight). A living gingerbread cookie
// who knighted herself the day she came out of the oven: brave, proper, terribly earnest, a little
// worried about crumbs. She holds the wall for her queen with an icing spatula for a sword and a heart
// cookie cutter for a shield. She moves on her own copy of the creature base (rig.js; body.js `cookie`:
// a gingerbread cookie's build, no neck, a wide flat body, thick limbs ending round), dressed here; her
// head, face, armour and props drawn here from scratch (never the shared face, nothing of the hero's).
//   look    warm ginger-brown cookie with darker baked edges, white royal-icing squiggles piped round
//           her wrists and ankles, round mitten hands and feet; armour of mint fondant shaped to her
//           (a breastplate cut from her own outline, piped round its edges, three gumdrop buttons down
//           it in cherry, lemon and lime; a pink fondant belt with a little silver heart buckle; round
//           pauldrons; a short skirt of four rounded fondant tabs, each on its own spring); an
//           open-faced mint fondant helm with a piped rim, a gumdrop on top and a pink candy-floss
//           plume (three soft lobes, sprung). Her signature: her sword is an offset icing spatula (a
//           smear of pink icing near its round tip), her shield a heart-shaped cookie cutter you can see
//           straight through.
//   eyes    her own "gumdrop" eyes: round, the raspberry iris almost filling them (deep berry at the
//           top to bright raspberry below, a sugary pale sheen low in it, no pupil: a glazed sweet), a
//           big tilted oval glint and a little four-point sugar sparkle; a blunt piped chocolate lash
//           line with rounded ends and one small flick (no wing: she's a knight). Piped white icing
//           brows, round. Piped pink icing cheek dots. A piped white icing mouth. Faces: stern (rest,
//           earnest), proud, beam (^ ^), salute, focus, fierce, shout, startled, hurt, dizzy, sad,
//           worried, fluster, sleepy, sniff (crumb trouble), talking (vowel mouths); every change eased.
//   idle    a 30 s act in pieces (only one she has time for): breathing on her cutter and polishing it;
//           sword drill (a salute, two thrusts, a parry); a crumb falls off her elbow, she frets, dabs
//           a bit of icing off her spatula to stick it back, proud of the repair; sentry march (marching
//           on the spot, an about-face, the spatula shouldered).
//   walk    a brisk knightly march, plume bobbing, the tabs of her skirt swinging.
//   fight   between casts her swings at the tank in turn: Thrust (a lunge), Shield Bash (the cutter
//           shoved forward), Overhead Chop. Her casts (m.castPose, world/volcano.js): smack (Spatula
//           Smack: the spatula raised high in both hands, flat side down on the tank), buttons (Gumdrop
//           Buttons: chest flung out, her buttons popping off), icing (Royal Icing: spatula raised,
//           pointing out a spot), bash (Heartcutter Bash: crouched behind the cutter, then a shove
//           forward), roll (Roll Out!: arms flung wide, the cutters coming down), press (Press!: both
//           fists down, a stamp), heat (Preheat!: fanning herself, then a warm "ding!"). Phase moments
//           (m.phaseAt): Cut Out! (the cutter held up proudly), Into the Oven! (fanning, then fierce).
//   scenes  her entrance (volcano_gretel): 'drum' (beating her cutter with the spatula), 'pipe' (piping
//           a line of icing along the floor between you: the line you shall not cross), 'windup',
//           'attack', 'sway'.
//   marks   all her own (`ownEmotes`): a "!" and a "?" on a little heart-cutter badge, a crumb fretted
//           over when hit, a sweat drop when low, dizzy stars when beaten (sat down, helm askew).
// Every effect is drawn live in her own style: crumbs (soft rounded nubs), piped icing swirls,
// gumdrops, warm sugar sparkles.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, dust, sweat, cue, spring } from './fx.js';

const BIG = 2.2;
const LW = 1.6 / BIG;
// ---------- Her colours ----------
const INK = '#8a4a22';
const COOKIE = ['#f4c48e', '#dc9a5c', '#bc7640', '#96562a'];
const ICING = ['#ffffff', '#fdf6f0', '#e8dcea'];
const MINT = ['#e4fff4', '#a8ecd2', '#72c8ac', '#4c9e86'];
const MINT_INK = '#3e8a74';
const PINK = ['#ffd6e6', '#ff9ec4', '#e872a0', '#b84a7a'];
const TIN = ['#f6f4fc', '#d4d0e6', '#a8a2c4', '#7c769c'];
const GUM = { red: ['#ff8a8a', '#e8404e', '#b02a3c'], gold: ['#fff0a0', '#f6c94e', '#c89a2c'], lime: ['#c8f490', '#7ccc4a', '#4e9a2e'] };
const IRIS = ['#ffc6d8', '#ff6a96', '#c82a5e', '#6e1238'];
const LASH = '#4a2412';
const CHOC = ['#8a5030', '#5e3018'];

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
// A piped icing squiggle along a line from p0 to p1 (a soft wave, round ends).
function squiggle(ctx, p0, p1, amp, n, w, col = ICING[0]) {
  ctx.beginPath();
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  for (let i = 0; i <= n * 8; i++) {
    const u = i / (n * 8);
    const o = Math.sin(u * n * TAU) * amp;
    const px = p0[0] + dx * u + nx * o;
    const py = p0[1] + dy * u + ny * o;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  pen(ctx, col, w);
  ctx.stroke();
}
// ---------- Her head ----------
const HO = [1.2, -16.8];
const HS = 1.5;
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
// lid (closed eyes only), shut, wink, bt/by (brows' tilt and raise), mw/ms/mo (mouth width, smile,
// openness), bl (cheek dots' glow), sm (small irises), tg (tongue).
const FACES = {
  stern: { lid: 0, shut: 'happy', wink: 0, bt: 0.35, by: 0, mw: 0.8, ms: 0.05, mo: 0, bl: 0.4, sm: 0, tg: 0 },
  proud: { lid: 1, shut: 'happy', wink: 0, bt: 0.2, by: 0.55, mw: 1, ms: 0.85, mo: 0, bl: 0.7, sm: 0, tg: 0 },
  beam: { lid: 1, shut: 'happy', wink: 0, bt: -0.2, by: 0.8, mw: 1.15, ms: 1, mo: 0.5, bl: 0.9, sm: 0, tg: 0.3 },
  salute: { lid: 0, shut: 'happy', wink: 1, bt: 0.3, by: 0.3, mw: 0.95, ms: 0.6, mo: 0, bl: 0.6, sm: 0, tg: 0 },
  focus: { lid: 0, shut: 'happy', wink: 0, bt: 0.6, by: -0.15, mw: 0.75, ms: -0.05, mo: 0, bl: 0.4, sm: 0.1, tg: 0 },
  fierce: { lid: 0, shut: 'happy', wink: 0, bt: 1, by: -0.5, mw: 1, ms: -0.4, mo: 0.32, bl: 0.5, sm: 0.15, tg: 0 },
  shout: { lid: 0, shut: 'happy', wink: 0, bt: 0.9, by: 0.2, mw: 1.2, ms: 0.1, mo: 1.15, bl: 0.7, sm: 0.25, tg: 0.4 },
  startled: { lid: 0, shut: 'happy', wink: 0, bt: -0.3, by: 1.2, mw: 0.6, ms: 0, mo: 0.6, bl: 0.6, sm: 0.6, tg: 0 },
  hurt: { lid: 1, shut: 'squeeze', wink: 0, bt: -0.8, by: 0.2, mw: 0.9, ms: -0.6, mo: 0.5, bl: 0.7, sm: 0, tg: 0 },
  dizzy: { lid: 1, shut: 'dizzy', wink: 0, bt: -0.5, by: 0.3, mw: 0.8, ms: -0.2, mo: 0.4, bl: 0.5, sm: 0, tg: 0.4 },
  sad: { lid: 0, shut: 'happy', wink: 0, bt: -0.95, by: 0.3, mw: 0.8, ms: -0.6, mo: 0, bl: 0.4, sm: 0.15, tg: 0 },
  worried: { lid: 0, shut: 'happy', wink: 0, bt: -0.8, by: 0.5, mw: 0.75, ms: -0.35, mo: 0.15, bl: 0.5, sm: 0.1, tg: 0 },
  fluster: { lid: 0, shut: 'happy', wink: 0, bt: -0.6, by: 0.9, mw: 0.9, ms: -0.2, mo: 0.35, bl: 1, sm: 0.3, tg: 0 },
  sniff: { lid: 0, shut: 'happy', wink: 0, bt: -0.9, by: 0.6, mw: 0.6, ms: -0.5, mo: 0.05, bl: 0.8, sm: 0.25, tg: 0 },
  sleepy: { lid: 1, shut: 'sleep', wink: 0, bt: -0.2, by: -0.1, mw: 0.6, ms: 0.15, mo: 0.1, bl: 0.5, sm: 0, tg: 0 },
  talk: { lid: 0, shut: 'happy', wink: 0, bt: 0.3, by: 0.3, mw: 0.9, ms: 0.3, mo: 0.4, bl: 0.55, sm: 0, tg: 0 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.65, 0.1, 0.8], [1.05, 0.35, 0.5], [0.9, 0.25, 0.25], [0.7, 0.15, 0], [0.8, 0.2, 0.6]];
const EYE = { r: 3.15 };

function closedLine(ctx, a, x, y, side, s, t) {
  const w = EYE.r;
  pen(ctx, tone(a, LASH), 1.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (s === 'happy') {
    ctx.moveTo(x - w, y + 1);
    ctx.quadraticCurveTo(x, y - w * 1.1, x + w, y + 1);
  } else if (s === 'sleep') {
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x, y + w * 0.6, x + w, y);
  } else if (s === 'squeeze') {
    ctx.moveTo(x + side * w, y - 2);
    ctx.quadraticCurveTo(x - side * w * 0.2, y - 0.2, x - side * w * 0.9, y + 0.3);
    ctx.quadraticCurveTo(x - side * w * 0.2, y + 0.8, x + side * w, y + 2.3);
  } else {
    for (let i = 0; i <= 26; i++) {
      const an = (i / 26) * TAU * 2 + t * 4 * side;
      const r = (i / 26) * w * 0.9;
      const p = [x + Math.cos(an) * r, y + Math.sin(an) * r];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
  }
  ctx.stroke();
}
// Her gumdrop eye: round, the raspberry iris nearly filling it, no pupil (a glazed sweet), a big tilted
// oval glint and a little sugar sparkle; a blunt piped chocolate lash line with rounded ends.
function eye(ctx, a, x, y, side, f, look) {
  const r = EYE.r;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.grUid ?? 0) * 0.71) % 6.3, 5.8, 5.9, 5.98, 6.12) : 0;
  const wink = side > 0 ? f.wink : 0;
  const L = Math.max(f.lid, blink, wink);
  const closedW = sstep((L - 0.93) / 0.07);
  const shutW = wink > 0.5 && f.lid < 0.5 ? { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } : blink > f.lid + 0.05 ? { happy: 0, sleep: 1, squeeze: 0, dizzy: 0 } : f.shut;
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
  const shape = () => {
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 1.08, 0, 0, TAU);
  };
  shape();
  ctx.fillStyle = tone(a, '#fffaf6');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.28 * f.sm;
  const ix = x + side * 0.15 + (look?.[0] ?? 0) * 0.55;
  const iy = y - 0.1 + (look?.[1] ?? 0) * 0.45;
  const ir = [2.55 * small, 2.8 * small];
  const g = ctx.createLinearGradient(0, iy - ir[1], 0, iy + ir[1]);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.4, tone(a, IRIS[2]));
  g.addColorStop(0.85, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#4e0a26', 0.8), 0.38);
  ctx.stroke();
  // a sugary pale sheen low in it
  ctx.beginPath();
  ctx.ellipse(ix, iy + 0.4, ir[0] * 0.7, ir[1] * 0.62, 0, 0.35, Math.PI - 0.35);
  pen(ctx, tone(a, '#ffe0ec', 0.75), 0.7);
  ctx.stroke();
  // the lid's soft shadow
  const sg = ctx.createLinearGradient(0, y - r, 0, y - r * 0.3);
  sg.addColorStop(0, 'rgba(110,40,40,0.3)');
  sg.addColorStop(1, 'rgba(110,40,40,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - r * 1.3, y - r * 1.2, r * 2.6, r * 0.9);
  // the glints: a big tilted oval up at the back, a little sugar sparkle low at the front
  ell(ctx, ix - side * 0.85, iy - 1.05 * small, 1.05, 0.72, side * -0.6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  sparkle(ctx, ix + side * 0.9, iy + 0.9 * small, 0.75, 1, '#ffffff');
  if (L > 0.01) {
    ctx.fillStyle = tone(a, COOKIE[1]);
    ctx.fillRect(x - r * 1.3, y - r * 1.3, r * 2.6, r * 2.6 * Math.min(1, L / 0.93));
  }
  ctx.restore();
  // the lash line: a blunt piped chocolate line over the top, rounded ends, one small flick outward
  ctx.beginPath();
  ctx.ellipse(x, y + 0.1, r + 0.15, r * 1.08 + 0.15, 0, Math.PI * 1.12, Math.PI * 1.88);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, LASH), 0.95);
  ctx.stroke();
  const fa = side > 0 ? -0.42 : Math.PI + 0.42;
  const fp = [x + Math.cos(side > 0 ? -0.5 : Math.PI + 0.5) * (r + 0.2), y + Math.sin(-0.5) * (r * 1.08 + 0.2)];
  ctx.beginPath();
  ctx.moveTo(...fp);
  ctx.quadraticCurveTo(fp[0] + Math.cos(fa) * 0.8, fp[1] + Math.sin(fa) * 0.8, fp[0] + Math.cos(fa - side * 0.3) * 1.4, fp[1] + Math.sin(fa - side * 0.3) * 1.4);
  pen(ctx, tone(a, LASH), 0.6);
  ctx.stroke();
  if (L > 0.04) {
    const ly = y - r * 1.2 + r * 2.4 * Math.min(1, L / 0.93);
    const half = Math.sqrt(Math.max(0, 1 - ((ly - y) / (r * 1.08)) ** 2)) * r;
    if (half > 0.3) {
      ctx.beginPath();
      ctx.moveTo(x - half, ly - 0.1);
      ctx.quadraticCurveTo(x, ly + 0.5, x + half, ly - 0.1);
      pen(ctx, tone(a, LASH), 0.85);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// Piped white icing brows, round.
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.by * 0.9);
  // (cross = her inner end low: the far brow turns one way, the near one the other)
  ctx.rotate(-side * f.bt * 0.6);
  ctx.beginPath();
  ctx.moveTo(-1.5, 0.3);
  ctx.quadraticCurveTo(0, -0.6, 1.5, 0.25);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, COOKIE[3], 0.5), 1.35);
  ctx.stroke();
  pen(ctx, tone(a, ICING[0]), 1);
  ctx.stroke();
  ctx.restore();
}
// Her piped white icing mouth, centred under her eyes; open: chocolate inside, the icing round its rim.
function mouth(ctx, a, x, y, f) {
  const w = 2.5 * f.mw;
  const cy = y - f.ms * (f.ms < 0 ? 1.1 : 0.4);
  if (f.mo > 0.08) {
    const o = f.mo;
    const sm = Math.max(0, f.ms);
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x - w, cy);
      ctx.quadraticCurveTo(x, cy + 0.3 + sm * 0.6 + Math.min(0, f.ms) * 4, x + w, cy);
      ctx.quadraticCurveTo(x, cy + 1.2 + o * 3 + sm * 0.7 + Math.min(0, f.ms) * 3, x - w, cy);
      ctx.closePath();
    };
    path();
    ctx.fillStyle = tone(a, CHOC[1]);
    ctx.fill();
    ctx.save();
    path();
    ctx.clip();
    ell(ctx, x + 0.2, cy + 1 + o * 2.6 + sm * 0.5, w * 0.55, o * 0.9 + f.tg * 0.4);
    ctx.fillStyle = tone(a, '#ff8aa6');
    ctx.fill();
    ctx.restore();
    path();
    ctx.lineJoin = 'round';
    pen(ctx, tone(a, ICING[0]), 0.7);
    ctx.stroke();
  } else {
    ctx.lineCap = 'round';
    for (const [col, wd, dy] of [[tone(a, COOKIE[3], 0.45), 1.2, 0.25], [tone(a, ICING[0]), 0.8, 0]]) {
      ctx.beginPath();
      ctx.moveTo(x - w, cy - 0.3 + dy);
      ctx.quadraticCurveTo(x, y + 0.5 + f.ms * (f.ms < 0 ? 0.6 : 1.1) + dy, x + w, cy - 0.4 + dy);
      pen(ctx, col, wd);
      ctx.stroke();
    }
  }
}
const SKX = 13.6;
const SKY = 12.8;
function skullPath(ctx, tx) {
  ctx.beginPath();
  ctx.ellipse(tx * 0.25, 0, SKX, SKY, 0, 0, TAU);
}
// Her helm: an open-faced dome of mint fondant over her crown, a piped rim along its brim, a gumdrop
// on top, a pink candy-floss plume of three soft lobes behind it (sprung).
const BRIM = (tx) => [[-14.6 + tx * 0.25, -3.4], [-6 + tx * 0.6, -7.2], [tx * 0.9 + 1, -7.8], [8 + tx, -6.8], [14.8 + tx * 0.25, -3.2]];
function helmPath(ctx, tx) {
  const b = BRIM(tx);
  const o = tx * 0.25;
  ctx.beginPath();
  ctx.moveTo(...b[4]);
  ctx.bezierCurveTo(16 + o, -12, 9 + o, -16.8, 0.6 + o, -16.8);
  ctx.bezierCurveTo(-8 + o, -16.8, -16 + o, -12, b[0][0], b[0][1]);
  ctx.quadraticCurveTo(b[1][0], b[1][1] - 0.3, b[2][0], b[2][1]);
  ctx.quadraticCurveTo(b[3][0], b[3][1] - 0.3, b[4][0], b[4][1]);
  ctx.closePath();
}
function plume(ctx, a, mode, tx) {
  const q = a.grQ ?? {};
  const pl = q.plume ?? [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    const root = [-1 + tx * 0.3 - i * 1.4, -16];
    const b = -1.9 - i * 0.42 + pl[i];
    const pts = chain(root, [b, b - 0.5, b - 0.9], [3.6, 3.4, 2.8]);
    poly(ctx, tube(pts, [3.2, 4.6, 4.4, 3], 0.7));
    paint(ctx, a, mode, i === 1 ? PINK[0] : PINK[1], PINK[3]);
    if (mode === 'fill') {
      ell(ctx, pts[1][0], pts[1][1] - 0.6, 1.2, 0.7, b);
      ctx.fillStyle = tone(a, '#ffffff', 0.7);
      ctx.fill();
    }
  }
}
// The helm's two rounded cheek guards, down the sides of her face from the brim to her jaw (outside her
// eyes, her face left open between them).
function guards(ctx, a, mode, tx) {
  const o = tx * 0.25;
  for (const [x0, s, far] of [[-14.6 + o, -1, true], [14.8 + o, 1, false]]) {
    const pts = chaikin([[x0 - s * 0.8, -5.4], [x0 - s * 4.2 + (far ? 0 : tx * 0.25), -6.4], [x0 - s * 3.4 + (far ? 0 : tx * 0.2), 4.6], [x0 - s * 1.2, 7.6], [x0 + s * 1, 4]], 2);
    poly(ctx, pts);
    paint(ctx, a, mode, far ? MINT[2] : MINT[1], MINT_INK);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, pts);
      ctx.clip();
      glow(ctx, x0 - s * 1.6, -2, 3, MINT[0], far ? 0.3 : 0.7);
      ctx.restore();
      squiggle(ctx, [x0 - s * 3.2 + (far ? 0 : tx * 0.2), -4.4], [x0 - s * 2.6 + (far ? 0 : tx * 0.2), 4.4], 0.3, 3, 0.7);
    }
  }
}
function helm(ctx, a, mode, tx) {
  guards(ctx, a, mode, tx);
  helmPath(ctx, tx);
  paint(ctx, a, mode, MINT[1], MINT_INK);
  // the gumdrop on top
  ctx.beginPath();
  const gx = 0.6 + tx * 0.3;
  ctx.moveTo(gx - 2.4, -16.4);
  ctx.quadraticCurveTo(gx - 2.3, -20, gx, -20.2);
  ctx.quadraticCurveTo(gx + 2.3, -20, gx + 2.4, -16.4);
  ctx.closePath();
  paint(ctx, a, mode, GUM.red[1], GUM.red[2]);
  if (mode !== 'fill') return;
  ell(ctx, gx - 0.8, -18.6, 0.6, 0.9, -0.3);
  ctx.fillStyle = 'rgba(255,240,240,0.85)';
  ctx.fill();
  ctx.save();
  helmPath(ctx, tx);
  ctx.clip();
  glow(ctx, -2 + tx * 0.3, -14, 8, MINT[0], 0.9);
  glow(ctx, 12 + tx * 0.3, -6, 7, MINT[2], 0.5);
  glow(ctx, -13, -5, 6, MINT[3], 0.4);
  // a soft ridge down its middle
  ctx.beginPath();
  ctx.moveTo(gx, -16.4);
  ctx.quadraticCurveTo(gx + 0.6, -12, tx * 0.9 + 1, -8.4);
  pen(ctx, tone(a, MINT[0], 0.8), 1);
  ctx.stroke();
  ctx.restore();
  // the piped rim along its brim
  const b = BRIM(tx);
  const pts = [];
  for (let i = 0; i < 4; i++) {
    for (let k = 0; k < 6; k++) {
      const u = k / 6;
      pts.push([mix(b[i][0], b[i + 1][0], u), mix(b[i][1], b[i + 1][1], u)]);
    }
  }
  pts.push(b[4]);
  ctx.beginPath();
  pts.forEach((p, i) => {
    const o = Math.sin(i * 1.3) * 0.45;
    if (i) ctx.lineTo(p[0], p[1] - 0.4 + o);
    else ctx.moveTo(p[0], p[1] - 0.4 + o);
  });
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  pen(ctx, tone(a, MINT[3], 0.4), 1.9);
  ctx.stroke();
  pen(ctx, tone(a, ICING[0]), 1.3);
  ctx.stroke();
}
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.grQ ?? {};
  const f = a.grF;
  const turn = q.turn ?? 0.4;
  const tx = turn * 2.4;
  plume(ctx, a, mode, tx);
  skullPath(ctx, tx);
  paint(ctx, a, mode, COOKIE[1]);
  if (mode === 'fill' && f) {
    ctx.save();
    skullPath(ctx, tx);
    ctx.clip();
    glow(ctx, tx * 0.6 + 1, -1, 12, COOKIE[0], 0.85);
    // the baked rim: a deeper ring just inside her edge
    ctx.beginPath();
    ctx.ellipse(tx * 0.25, 0, SKX - 0.6, SKY - 0.6, 0, 0, TAU);
    pen(ctx, tone(a, COOKIE[2], 0.55), 1.6);
    ctx.stroke();
    glow(ctx, -11, 6, 7, COOKIE[2], 0.45);
    ctx.restore();
    const ex = (s) => (s < 0 ? -4.6 + tx * 0.7 : 5.2 + tx);
    const ey = 1.4;
    const mx = 0.5 + tx * 0.85;
    // her piped pink cheek dots
    for (const [s, k] of [[-1, 0.85], [1, 1]]) {
      ell(ctx, ex(s) + s * 0.6, 5.2, 1.5, 1.35);
      ctx.fillStyle = tone(a, PINK[1], 0.55 + 0.4 * f.bl * k);
      ctx.fill();
      ell(ctx, ex(s) + s * 0.6 - 0.5, 4.7, 0.45, 0.35);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
    }
    for (const s of [-1, 1]) eye(ctx, a, ex(s), ey, s, f, q.look);
    for (const s of [-1, 1]) brow(ctx, a, ex(s) + s * 0.1, -4, s, f);
    // a small nose shade
    ell(ctx, mx + 0.4, 4.6, 0.9, 0.55);
    ctx.fillStyle = tone(a, COOKIE[2], 0.45);
    ctx.fill();
    mouth(ctx, a, mx, 7.6, f);
    if (q.sweat >= 0) sweat(ctx, -12, -2 + q.sweat * 3, 1.1);
  }
  helm(ctx, a, mode, tx);
  WK = 1;
  ctx.restore();
}

// ---------- Her armour ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
function gumdrop(ctx, a, x, y, s, col) {
  ctx.beginPath();
  ctx.moveTo(x - s, y + s * 0.6);
  ctx.quadraticCurveTo(x - s * 0.95, y - s * 0.9, x, y - s);
  ctx.quadraticCurveTo(x + s * 0.95, y - s * 0.9, x + s, y + s * 0.6);
  ctx.quadraticCurveTo(x, y + s * 0.9, x - s, y + s * 0.6);
  ctx.closePath();
  ctx.fillStyle = tone(a, col[1]);
  ctx.fill();
  pen(ctx, tone(a, col[2]), 0.4);
  ctx.stroke();
  ell(ctx, x - s * 0.35, y - s * 0.3, s * 0.22, s * 0.32, -0.3);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
}
// The breastplate: mint fondant cut from her own outline, cookie showing at the neck, piped icing
// round its edges, three gumdrop buttons down it (popped off for her Gumdrop Buttons: q.buttons), a
// pink fondant belt with a silver heart buckle.
function breastplate(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const q = a.grQ ?? {};
  const C = (p) => ptOf(a, D, 'chest', p);
  const T = (p) => ptOf(a, D, 'torso', p);
  const st = D.J.stern;
  const hp = D.J.hip;
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  const plate = chaikin([C([st[0] - 30, st[1] + 3]), C([st[0] - 6, st[1] + 2.6]), C([st[0] + 1, st[1] + 5.4]), C([st[0] + 8, st[1] + 2.6]), C([st[0] + 30, st[1] + 3]), T([hp[0] + 30, hp[1] - 2]), T([hp[0] - 30, hp[1] - 2])], 1);
  poly(ctx, plate);
  ctx.fillStyle = tone(a, MINT[1]);
  ctx.fill();
  ctx.save();
  poly(ctx, plate);
  ctx.clip();
  const lt = C([st[0] + 5, st[1] + 8]);
  glow(ctx, lt[0], lt[1], 8, MINT[0], 0.85);
  const sh = C([st[0] - 13, st[1] + 14]);
  glow(ctx, sh[0], sh[1], 9, MINT[3], 0.4);
  ctx.restore();
  // the piped icing along the neckline
  const neck = [C([st[0] - 14, st[1] + 3]), C([st[0] - 6, st[1] + 3]), C([st[0] + 1, st[1] + 5.8]), C([st[0] + 8, st[1] + 3]), C([st[0] + 16, st[1] + 3.2])];
  for (let i = 0; i < neck.length - 1; i++) squiggle(ctx, neck[i], neck[i + 1], 0.35, 2, 0.9);
  // the belt and its heart buckle
  const b0 = T([hp[0] - 30, hp[1] - 4.6]);
  const b1 = T([hp[0] + 30, hp[1] - 4.6]);
  const b2 = T([hp[0] + 30, hp[1] - 1]);
  const b3 = T([hp[0] - 30, hp[1] - 1]);
  poly(ctx, [b0, b1, b2, b3]);
  ctx.fillStyle = tone(a, PINK[1]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(...T([hp[0] - 30, hp[1] - 4]));
  ctx.lineTo(...T([hp[0] + 30, hp[1] - 4]));
  pen(ctx, tone(a, PINK[0], 0.8), 0.35);
  ctx.stroke();
  ctx.restore();
  const bk = T([hp[0] + 3, hp[1] - 2.8]);
  ctx.save();
  ctx.translate(...bk);
  ctx.beginPath();
  ctx.moveTo(0, 1.6);
  ctx.bezierCurveTo(-2.2, 0.2, -1.9, -1.8, 0, -0.8);
  ctx.bezierCurveTo(1.9, -1.8, 2.2, 0.2, 0, 1.6);
  ctx.closePath();
  ctx.fillStyle = tone(a, TIN[1]);
  ctx.fill();
  pen(ctx, tone(a, TIN[3]), 0.35);
  ctx.stroke();
  ell(ctx, -0.6, -0.5, 0.4, 0.3, -0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  // three gumdrop buttons down the middle (gone while they're flying)
  const on = 1 - (q.buttons ?? 0);
  if (on > 0.5) {
    const cols = [GUM.red, GUM.gold, GUM.lime];
    for (let i = 0; i < 3; i++) {
      const p = i < 2 ? C([st[0] + 2.4, st[1] + 9 + i * 5.4]) : T([hp[0] + 2.6, hp[1] - 9]);
      gumdrop(ctx, a, p[0], p[1], 1.5, cols[i]);
    }
  }
}
// Her skirt: four rounded fondant tabs from her belt, mint and pink in turn, each swinging on its own.
function skirt(ctx, a, mode, D) {
  const q = a.grQ ?? {};
  const sw = q.tabs ?? [0, 0, 0, 0];
  ctx.save();
  enter(ctx, a, D, 'torso');
  const hp = D.J.hip;
  for (const i of [0, 3, 1, 2]) {
    const x = hp[0] - 12 + i * 8.4;
    ctx.save();
    ctx.translate(x, hp[1] - 1);
    ctx.rotate(sw[i] + (i - 1.5) * 0.08);
    const pts = chaikin([[-4.6, -1], [4.6, -1], [4.8, 6.4], [2.6, 8.8], [-2.6, 8.8], [-4.8, 6.4]], 2);
    poly(ctx, pts);
    const pinkTab = i % 2 === 1;
    paint(ctx, a, mode, pinkTab ? PINK[1] : MINT[1], pinkTab ? PINK[3] : MINT_INK);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, pts);
      ctx.clip();
      glow(ctx, -1, 2, 4, pinkTab ? PINK[0] : MINT[0], 0.7);
      ctx.restore();
      squiggle(ctx, [-3.6, 7.4], [3.6, 7.4], 0.35, 2, 0.75);
    }
    ctx.restore();
  }
  ctx.restore();
}
// A round fondant pauldron on a shoulder, piped round its edge.
function pauldron(ctx, a, mode, D, k) {
  const S = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const E = ptOf(a, D, `arm${k}u`, D.J[`el${k}`]);
  const an = Math.atan2(E[1] - S[1], E[0] - S[0]);
  ctx.save();
  ctx.translate(...S);
  ctx.rotate(an);
  const near = k === 'N';
  ctx.scale(0.85, 0.85);
  const pts = chaikin([[-1.8, -3], [2.4, -3.4], [4.4, -1.4], [4.4, 1.4], [2.4, 3.4], [-1.8, 3]], 2);
  poly(ctx, pts);
  paint(ctx, a, mode, near ? MINT[1] : MINT[2], MINT_INK);
  if (mode === 'fill') {
    glow(ctx, 0.4, -1, 2.6, MINT[0], near ? 0.8 : 0.3);
    squiggle(ctx, [3.9, -2.4], [3.9, 2.4], 0.3, 2, 0.6);
  }
  ctx.restore();
}
// Her round mitten hands with a piped icing cuff; her round cookie feet with one too.
function hand(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  ctx.scale(1.2, 1.2);
  const near = k === 'N';
  smooth(ctx, [[-3.6, -2.8], [-1.2, -4], [2, -3.8], [3.8, -1.2], [3.6, 2.2], [1.2, 3.8], [-1.6, 3.8], [-3.8, 1.4]]);
  paint(ctx, a, mode, near ? COOKIE[1] : COOKIE[2], INK, LW / 1.2);
  if (mode === 'fill') {
    glow(ctx, -0.4, 0, 2.6, COOKIE[0], near ? 0.7 : 0.3);
    squiggle(ctx, [-3.2, -2.6], [3.2, -2.6], 0.4, 2, 0.75);
  }
  ctx.restore();
}
function foot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 4, p[1] - 3.4], [p[0] + 1.6, p[1] - 3.8], [p[0] + 5.6, p[1] - 1.8], [p[0] + 7.2, p[1] + 1], [p[0] + 6.6, p[1] + 3.6], [p[0] - 4.4, p[1] + 3.6], [p[0] - 5, p[1]]]);
  paint(ctx, a, mode, near ? COOKIE[1] : COOKIE[2]);
  if (mode === 'fill') {
    ell(ctx, p[0] + 2, p[1] - 1, 2.6, 1, -0.2);
    ctx.fillStyle = tone(a, COOKIE[0], near ? 0.7 : 0.3);
    ctx.fill();
    squiggle(ctx, [p[0] - 3.6, p[1] - 2.6], [p[0] + 2.6, p[1] - 3], 0.4, 2, 0.75);
  }
  ctx.restore();
}
// Her icing spatula (the near hand): a pink-painted handle, a silver ferrule, an offset bend and a long
// round-ended blade, a smear of pink icing near its tip. `swA` its angle from her forearm.
const SK = 0.62;
function spatula(ctx, a, mode, D) {
  const q = a.grQ ?? {};
  const h = ptOf(a, D, 'handN', D.J.handN);
  const w = ptOf(a, D, 'handN', D.J.wrN);
  const ang = Math.atan2(h[1] - w[1], h[0] - w[0]) + (q.swA ?? 0);
  spatulaAt(ctx, a, mode, h[0], h[1], ang);
}
function spatulaAt(ctx, a, mode, x, y, ang) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(SK, SK);
  const lw = (LW * 1.2) / SK;
  // the handle
  ctx.beginPath();
  ctx.roundRect(-3, -1.3, 8, 2.6, 1.2);
  paint(ctx, a, mode, PINK[1], PINK[3], lw);
  // the blade, offset: a little bend up, then long and straight to a round end
  const blade = chaikin([[5, -0.6], [7, -0.6], [8.4, -2.2], [25, -2.6], [26.6, -1.4], [26.6, 0.4], [25, 1.4], [8.4, 1], [7, 0.6], [5, 0.6]], 2);
  poly(ctx, blade);
  if (mode === 'line') {
    pen(ctx, TIN[3], lw);
    ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(0, -2.6, 0, 1.4);
    g.addColorStop(0, TIN[0]);
    g.addColorStop(0.5, TIN[1]);
    g.addColorStop(1, TIN[2]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9.4, -1.6);
    ctx.lineTo(24, -1.9);
    pen(ctx, 'rgba(255,255,255,0.9)', 0.55);
    ctx.stroke();
    // the smear of pink icing
    smooth(ctx, [[19, -2], [24.8, -2.3], [26, -0.6], [24.4, 0.8], [21, 0.4], [19.6, -0.6]]);
    ctx.fillStyle = PINK[0];
    ctx.fill();
    ell(ctx, 22.6, -1.2, 1, 0.35);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(4.4, -1.5, 1.6, 3, 0.6);
    ctx.fillStyle = TIN[2];
    ctx.fill();
  }
  ctx.restore();
}
// Her heart cookie cutter (the far hand's): a tin heart you see straight through, its wall showing.
function heartPath(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, 5.6 * s);
  ctx.bezierCurveTo(-7.6 * s, 0.6 * s, -6.4 * s, -6.2 * s, 0, -2.8 * s);
  ctx.bezierCurveTo(6.4 * s, -6.2 * s, 7.6 * s, 0.6 * s, 0, 5.6 * s);
  ctx.closePath();
}
function shieldAt(ctx, a, mode, x, y, ang, sc = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(sc, sc);
  // the wall behind (offset), then the rim
  for (const [dx, dy, col, w] of [[0.8, 0.5, TIN[3], 1.4], [0, 0, TIN[1], 1.15]]) {
    ctx.save();
    ctx.translate(dx, dy);
    heartPath(ctx, 1.3);
    if (mode === 'line') {
      pen(ctx, TIN[3], w + (LW * 2.4) / sc);
      ctx.stroke();
    } else {
      pen(ctx, a ? tone(a, col) : col, w);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(-6.4, -3.4);
    ctx.bezierCurveTo(-6.6, -6.4, -3, -7, -1.2, -4.8);
    pen(ctx, 'rgba(255,255,255,0.85)', 0.6);
    ctx.lineCap = 'round';
    ctx.stroke();
    // its little handle grip
    ctx.beginPath();
    ctx.roundRect(-2.2, -0.9, 4.4, 1.8, 0.8);
    ctx.fillStyle = a ? tone(a, TIN[2]) : TIN[2];
    ctx.fill();
  }
  ctx.restore();
}
// (raised above her chin, the cutter comes round in front of her head instead of hiding behind it:
// drawn over the head then, see-through as ever)
const shieldHigh = (a, D) => ptOf(a, D, 'handF', D.J.handF)[1] < D.at(a, 'head', [0, 0])[1] - 1;
function shield(ctx, a, mode, D, over = false) {
  if (shieldHigh(a, D) !== over) return;
  const q = a.grQ ?? {};
  const h = ptOf(a, D, 'handF', D.J.handF);
  shieldAt(ctx, a, mode, h[0] + 1.4, h[1] - 1.2, q.shA ?? 0, 0.78 * (q.shS ?? 1));
}

// ---------- Her act and her fight ----------
const SWINGS = ['thrust', 'bash', 'chop'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.grN ?? 0) % SWINGS.length]);
// (en garde: the spatula forward, the cutter up before her chest)
const READY = { shN: -60, elN: -30, hwN: -10, shF: -70, elF: -60, hwF: 0 };
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'stern', look: [0.4, 0], turn: 0.4, sweat: -1, fx: null, swA: -1.1, shA: 0, shS: 1, buttons: 0, mirror: 0 };
  a.grQ = q;
  a.grUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const sw = (v, k = 1) => {
    q.swA = mix(q.swA, v, clamp(k, 0, 1));
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.6);
  const cineMood = m.cine?.mood;
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  const alive = m.hp > 0;
  const low = alive && m.hp / m.def.hp < 0.25;
  const cast = alive && m.cast && m.castPose ? m.cast : null;
  if (cast && st.grCastT0 !== cast.t0) {
    st.grCastT0 = cast.t0;
    st.grMove = m.castPose;
  }
  const since = now - (m.attackAt ?? -9);
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.45);
  const winding = alive && !cast && m.windup > 0;
  if (winding && !(now - (st.grWindAt ?? -9) < 0.25)) {
    st.grN = (st.grN ?? m.uid ?? 0) + 1;
    st.grMove = pickSwing(m, st);
  }
  if (winding) st.grWindAt = now;
  const struck = alive && since >= 0 && since < 1.1;
  const mv = cast ? st.grMove : winding || struck ? (st.grMove ??= SWINGS[0]) : null;
  const cu = cast ? clamp((now - cast.t0) / cast.dur, 0, 1) : 1;
  const ct = cast ? now - cast.t0 : 99;
  let W = 0;
  if (cast) W = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  else if (winding) W = clamp(1 - m.windup / total, 0, 1);
  const s = cast || winding ? -1 : since;
  const busy = !alive || Boolean(mv);
  if (busy) st.grFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.grFreeAt ?? -9)) / 0.35);
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;

  // Standing at attention: the spatula's tip resting on the floor before her like a sword, the cutter
  // at her side; chin up, earnest.
  go({ shN: -24, elN: -36, hwN: 0, shF: 8, elF: -24, hwF: 6, tilt: -1.5, chest: -1 + breath * 0.5, head: -2 + Math.sin(t * 0.5) * 1, pelvis: 1 }, 1);
  sw(0.55);
  if (walkW > 0.01) {
    const u = a.blkidU ?? a.wp ?? 0;
    // a brisk march: the spatula shouldered, arms swinging
    go({ shN: -30, elN: -80, hwN: 0, shF: 0, elF: -20 }, walkW);
    add({ shF: -Math.sin(u * TAU) * 16, tilt: 1, head: -1 }, walkW);
    sw(-0.7, walkW);
    q.turn = mix(q.turn, 0.6, walkW);
  }
  if (fighting && !busy) {
    go({ ...READY, tilt: 3, drop: 0.08, head: 2 }, 0.85 * freeK);
    sw(-0.2, 0.85 * freeK);
    say('focus');
    q.turn = 0.6;
  }
  if (fighting && !st.grHunt) st.grBangAt = now;
  if (!fighting && st.grHunt && alive) st.grLostAt = now;
  st.grHunt = fighting;
  q.bang = now - (st.grBangAt ?? -9);
  q.huh = now - (st.grLostAt ?? -9);
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // a smart salute with the spatula's flat beside her face
    const k = win(gloat, 0, 0.25, 0.9, 1.4) * freeK;
    go({ shN: -95, elN: -110, hwN: 0, head: -4, tilt: -2, shF: 10, elF: -20 }, k);
    sw(-1.5, k);
    say('salute', k);
    q.fx = { kind: 'salute', u: gloat };
  }
  if (!alive) {
    st.grDeadAt ??= now;
    // sat down with a bump, the spatula dropped, the cutter on her lap
    go({ drop: 0.85, tilt: -10, head: 16, shN: 30, elN: -30, shF: 40, elF: -20, fxN: 0.5, fxF: 0.2 });
    sw(1.2);
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.fx = { kind: 'beaten', u: now - st.grDeadAt };
  } else st.grDeadAt = undefined;

  if (alive && mv) {
    const snap = s >= 0 ? sstep(s / 0.14) : 0;
    const rel = s >= 0 ? 1 - sstep((s - 0.45) / 0.55) : 0;
    const hitK = snap * rel;
    const wu = sstep(W) * (1 - snap);
    const perf = cast ? sstep(ct / 0.35) : s >= 0 ? rel : 0;
    if (mv === 'thrust') {
      // a fencer's lunge: back, then the spatula driven straight out
      go({ shN: -60, elN: -100, tilt: -6, fxN: -0.2, head: -2, ...{ shF: -70, elF: -60 } }, wu);
      sw(0.1, wu);
      go({ shN: -95, elN: -4, tilt: 12, fxN: 0.55, fxF: -0.25, drop: 0.15, head: 4, x: 0.05 }, hitK);
      sw(0, hitK);
      say(hitK > 0.2 ? 'fierce' : 'focus');
      if (s >= 0 && s < 0.4) q.fx = { kind: 'thrust', u: s };
    } else if (mv === 'bash') {
      // crouched behind the cutter, then shoved forward
      go({ shF: -60, elF: -100, drop: 0.15, tilt: 6, shN: 20, elN: -40 }, wu);
      go({ shF: -95, elF: -10, tilt: 14, x: 0.05, fxN: 0.3, head: 4 }, hitK);
      q.shS = 1 + 0.15 * hitK;
      say(hitK > 0.2 ? 'shout' : 'focus');
      if (s >= 0 && s < 0.4) q.fx = { kind: 'bash', u: s };
    } else if (mv === 'chop') {
      go({ shN: -170, elN: -40, tilt: -8, head: -4, chest: -4 }, wu);
      sw(0.2, wu);
      go({ shN: -55, elN: -10, tilt: 12, head: 6, drop: 0.1, x: 0.03 }, hitK);
      sw(0, hitK);
      say(hitK > 0.2 ? 'fierce' : 'focus');
      if (s >= 0 && s < 0.45) q.fx = { kind: 'chop', u: s };
    } else if (mv === 'smack') {
      // Spatula Smack: up high in both hands, then the flat of it down on the tank
      const shake = Math.sin(now * 28) * 3 * perf * (1 - wu);
      go({ shN: -172 + shake, elN: -24, shF: 120 - shake, elF: 10, tilt: -10, head: -6, chest: -5 }, Math.max(perf * (1 - hitK), wu));
      sw(0.1, Math.max(perf, wu));
      go({ shN: -58, elN: -6, shF: -50, elF: -20, tilt: 18, head: 8, drop: 0.2, x: 0.05 }, hitK);
      sw(0, hitK);
      say(hitK > 0.2 ? 'shout' : 'fierce');
      if (s >= 0 && s < 0.6) q.fx = { kind: 'smack', u: s };
    } else if (mv === 'buttons') {
      // Gumdrop Buttons: chest flung out, arms back, her buttons pop off one after another
      go({ shN: 40, elN: -20, shF: 50, elF: -20, tilt: -12, chest: -10, head: -8 }, Math.max(perf * (1 - hitK), wu));
      go({ shN: -150, elN: -20, shF: 120, elF: -10, tilt: -4, head: -6 }, hitK);
      sw(1.4, perf);
      q.buttons = cast ? sstep((cu - 0.55) / 0.2) : s >= 0 && s < 1.2 ? 1 : 0;
      say(hitK > 0.2 ? 'beam' : 'fierce');
      if (cast && cu > 0.55) q.fx = { kind: 'pop', u: ct - cast.dur * 0.55 };
    } else if (mv === 'icing') {
      // Royal Icing: the spatula raised, pointing out the spot, a swirl gathering on its tip
      go({ shN: -140, elN: -20, hwN: -10, shF: -30, elF: -70, tilt: -4, head: -6 }, Math.max(perf * (1 - hitK), wu));
      sw(-0.15, perf);
      go({ shN: -100, elN: -6, tilt: 6, head: 2 }, hitK);
      say(hitK > 0.2 ? 'proud' : 'focus');
      q.look = [0.6, -0.4];
      if (perf > 0.2 && hitK < 0.2) q.fx = { kind: 'swirl', u: ct };
    } else if (mv === 'hbash') {
      // Heartcutter Bash: crouched low behind the cutter, then a great shove forward
      go({ shF: -70, elF: -100, drop: 0.3, tilt: 14, shN: 30, elN: -50, head: 2 }, Math.max(perf * 0.6, wu));
      go({ shF: -95, elF: -6, tilt: 18, x: 0.08, fxN: 0.45, fxF: -0.2, head: 6, drop: 0.12 }, hitK);
      q.shS = 1 + 0.25 * Math.max(perf * 0.5, hitK);
      say(hitK > 0.2 ? 'shout' : 'fierce');
      if (s >= 0 && s < 0.6) q.fx = { kind: 'bash', u: s, big: 1 };
    } else if (mv === 'roll') {
      // Roll Out!: arms flung wide and up, calling the cutters down
      go({ shN: -150, elN: -10, shF: 130, elF: 10, tilt: -6, head: -10 }, Math.max(perf * (1 - hitK), wu));
      go({ shN: -110, elN: -10, shF: 100, elF: -10, tilt: 2, head: -2 }, hitK);
      sw(-0.1, perf);
      say(hitK > 0.2 ? 'proud' : 'shout');
      q.look = [0.3, -1];
    } else if (mv === 'press') {
      // Press!: a hop, both fists brought down, a stamp
      const hop = cast ? win(cu, 0.55, 0.75, 0.85, 1) : 0;
      add({ hop: 0.2 * hop }, 1);
      go({ shN: -150, elN: -60, shF: 140, elF: 20, tilt: -6, head: -6 }, Math.max(perf * (1 - hitK) * 0.8, wu));
      go({ shN: -40, elN: -20, shF: -40, elF: -20, tilt: 14, drop: 0.3, head: 8 }, hitK);
      sw(0.4, Math.max(perf, hitK));
      say(hitK > 0.2 ? 'shout' : 'fierce');
      if (s >= 0 && s < 0.6) q.fx = { kind: 'stamp', u: s };
    } else if (mv === 'heat') {
      // Preheat!: fanning herself with the cutter, the heat rising; then a warm "ding!"
      const fan = Math.sin(now * 11);
      go({ shF: 124 + fan * 12, elF: 28 + fan * 10, hwF: fan * 20, shN: -30, elN: -40, tilt: -4, head: 4 }, Math.max(perf * (1 - hitK), wu));
      go({ shN: -160, elN: -10, shF: 120, elF: 10, tilt: -6, head: -8 }, hitK);
      say(hitK > 0.2 ? 'beam' : 'fluster');
      if (perf > 0.2) q.fx = { kind: 'heat', u: ct };
    }
  }
  if (alive) {
    if (hurt && !mv) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -12, x: -0.02, ...READY }, k);
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    // a phase moment (m.phaseAt): Cut Out! (her cutter held up high, proud), Into the Oven! (fanning)
    const pu = now - (m.phaseAt ?? -9);
    if (pu >= 0 && pu < 1.8 && !mv) {
      const k = win(pu, 0, 0.25, 1.4, 1.8);
      if ((m.mech?.phase ?? 1) >= 3) {
        const fan = Math.sin(pu * 12);
        go({ shF: 124 + fan * 12, elF: 28 + fan * 10, hwF: fan * 20, shN: -150, elN: -30, tilt: -8, head: -10 }, k);
        say(pu < 0.9 ? 'fluster' : 'fierce', k);
        q.fx = { kind: 'oven', u: pu };
      } else {
        go({ shF: 150, elF: -5, shN: -40, elN: -60, tilt: -6, head: -4 }, k);
        q.shS = 1 + 0.2 * k;
        say('proud', k);
        q.fx = { kind: 'cutout', u: pu };
      }
    }
    // ----- her entrance's acts -----
    if (act && actU >= 0) {
      const d = act.dur ?? 1;
      const ka = win(actU, 0, 0.2, d - 0.1, d + 0.3);
      if (act.move === 'drum' && actU < d + 0.3) {
        // beating her cutter with the flat of her spatula: three strokes
        const beat = (actU % 0.7) / 0.7;
        const up = sstep(beat / 0.45);
        const hit = sstep((beat - 0.5) / 0.1);
        // (each stroke starts from where the last one landed, so the loop never jumps)
        go({ shF: -22, elF: -88, hwF: -10, shN: -30 - 100 * up * (1 - hit), elN: -90 + 40 * up * (1 - hit), tilt: 6 - 4 * up * (1 - hit), head: 2 }, ka);
        sw(-0.9 + 3.4 * (1 - up * (1 - hit)), ka);
        say(hit > 0.5 ? 'shout' : 'fierce', ka);
        if (beat > 0.5 && beat < 0.85 && actU < d) q.fx = { kind: 'clang', u: (beat - 0.5) * 0.7 };
      } else if (act.move === 'pipe' && actU < d + 0.3) {
        // piping a line of icing along the floor between you with her spatula's tip, walking it out
        const u = clamp(actU / d, 0, 1);
        go({ shN: -40, elN: -10, tilt: 22, drop: 0.25, head: 8 }, ka);
        sw(0.3, ka);
        say('focus', ka);
        q.look = [0.8, 1];
        if (st.grLine == null) st.grLine = { x: m.x + (m.dir || 1) * 20, dir: m.dir || 1 };
        st.grLine.u = u;
      } else if (act.move === 'windup') {
        go({ drop: 0.2, tilt: 10, ...READY, shN: -70, elN: -90 }, ka);
        sw(0.1, ka);
        say('fierce', ka);
      } else if (act.move === 'sway') {
        go({ tilt: Math.sin(actU * (act.speed ?? 3.5)) * 6, shN: -100, elN: -100, head: -4 }, ka);
        sw(-1.5, ka);
        say('salute', ka);
      }
    }
    // (the piped line stays on the floor through her scene; gone when the fight starts)
    if (!m.cine) st.grLine = null;
    q.line = st.grLine ? { x: st.grLine.x - m.x, dir: st.grLine.dir, u: st.grLine.u } : null;
    // her idle act: only when calm
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.grCalm = mix(st.grCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.grCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, sw, q, sstep(st.grCalm), t, now, st);
    if (cineMood && !mv) q.mood = { angry: 'fierce', happy: 'beam', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !mv) {
      if (!cineMood) q.mood = q.mood === 'stern' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking) q.mood = 'talk';
  }
  q.turn = spring(st, 'grTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.stern;
  const f = (st.grF ??= { ...FACES.stern, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'wink', 'bt', 'by', 'mw', 'ms', 'mo', 'bl', 'sm', 'tg']) f[k] = mix(f[k], tgt[k], k === 'lid' || k === 'wink' ? 1 - Math.exp(-dt * (tgt[k] > f[k] ? 40 : 18)) : kf);
  for (const sh of SHUTS) f.shut[sh] = mix(f.shut[sh], sh === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.grF = f;
  // the spatula's grip and the cutter's size on stiff, just-damped springs
  q.swA = spring(st, 'grSw', q.swA, 300, 34, dt);
  q.shS = spring(st, 'grShS', q.shS, 260, 30, dt);
  st.grMirror = q.mirror > 0.5;
  // springs: plume, skirt tabs
  const kick = (st.grLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.grLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.grLast = out.head;
  st.grLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  const tiltR = ((out.tilt ?? 0) * Math.PI) / 180;
  const headR = (((out.head ?? 0) + (out.tilt ?? 0)) * Math.PI) / 180;
  q.plume = [0, 1, 2].map((i) => clamp(spring(st, `pl${i}`, -headR * 0.5 + Math.sin(t * 1.5 + i) * 0.07 + step * 0.12 + walkW * 0.15, 75 - i * 8, 7, dt, kick * 0.012 * (i + 1)), -0.7, 0.8));
  q.tabs = [0, 1, 2, 3].map((i) => clamp(spring(st, `tb${i}`, -tiltR * 0.5 + step * (i % 2 ? 0.1 : -0.1) + Math.sin(t * 1.3 + i) * 0.03, 110 - i * 6, 12, dt, kick * 0.006), -0.3, 0.3));
}
const PIECES = [
  { name: 'polish', t0: 0.4, len: 6.6 },
  { name: 'drill', t0: 7.6, len: 7 },
  { name: 'crumb', t0: 15.2, len: 8 },
  { name: 'march', t0: 23.8, len: 6 },
];
function idleAct(m, a, out, go, add, sw, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.grPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.grPiece = cur.name;
      else return;
    }
  } else {
    st.grPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'polish') {
    // the cutter held up before her (below her face), a huff on it, a polish with her mitten, admired
    const k = win(u, 0, 0.6, 6, 6.6);
    const huff = win(u, 0.6, 1, 1.8, 2.2);
    const rub = win(u, 2.2, 2.5, 4, 4.4);
    const admire = win(u, 4.4, 4.8, 5.8, 6.4);
    go({ shF: -55, elF: -60, shN: 10, elN: -30, head: 8 }, (huff + admire) * k * w);
    go({ shF: -55, elF: -60, shN: -55 + Math.sin(now * 12) * 12, elN: -60, head: 10 }, rub * k * w);
    sw(1.1, (huff + rub + admire) * k * w);
    if (at(k)) {
      q.mood = admire > 0.4 ? 'proud' : huff > 0.4 ? 'focus' : 'stern';
      q.look = [0.5, 0.7];
      if (huff > 0.4) q.fx = { kind: 'huff', u: u - 0.8 };
      if (admire > 0.5) q.fx = { kind: 'shine', u: u - 4.6 };
    }
  } else if (cur.name === 'drill') {
    // a salute, two thrusts, a parry, back to attention
    const k = win(u, 0, 0.5, 6.5, 7);
    const sal = win(u, 0.4, 0.8, 1.8, 2.2);
    go({ shN: -95, elN: -110, head: -4 }, sal * k * w);
    sw(-1.5, sal * k * w);
    for (const t0 of [2.6, 3.6]) {
      const back = win(u, t0, t0 + 0.25, t0 + 0.35, t0 + 0.45);
      const out2 = win(u, t0 + 0.4, t0 + 0.5, t0 + 0.7, t0 + 0.95);
      go({ shN: -60, elN: -100, tilt: -4, shF: -70, elF: -60 }, back * k * w);
      go({ shN: -95, elN: -4, tilt: 8, fxN: 0.4, drop: 0.1, shF: -70, elF: -60 }, out2 * k * w);
      sw(0, (back + out2) * k * w);
    }
    const parry = win(u, 4.8, 5.1, 5.6, 6);
    go({ shN: -125, elN: -20, shF: -50, elF: -60, tilt: -6 }, parry * k * w);
    sw(-0.3, parry * k * w);
    if (at(k)) q.mood = sal > 0.4 ? 'salute' : parry > 0.4 ? 'fierce' : 'focus';
  } else if (cur.name === 'crumb') {
    // a crumb falls off her elbow; she frets over it, dabs icing off her spatula and sticks it back on
    const k = win(u, 0, 0.5, 7.5, 8);
    const look = win(u, 0.8, 1.1, 3, 3.3);
    const dab = win(u, 3.4, 3.8, 5.6, 6);
    const proud = win(u, 6, 6.3, 7.3, 7.8);
    go({ head: 14, tilt: 6, shF: 20, elF: -90, shN: -20, elN: -40 }, look * k * w);
    go({ head: 10, tilt: 4, shF: 10, elF: -100, shN: -60, elN: -90 }, dab * k * w);
    go({ shN: -95, elN: -110, head: -6, tilt: -3 }, proud * k * w);
    sw(-0.6, dab * k * w);
    sw(-1.5, proud * k * w);
    if (at(k)) {
      q.mood = proud > 0.4 ? 'proud' : dab > 0.4 ? 'focus' : look > 0.4 ? 'sniff' : u < 0.9 ? 'startled' : 'stern';
      q.look = look + dab > 0.4 ? [-0.6, 0.8] : [0.4, 0];
      q.fx = u < 3.4 ? { kind: 'crumb', u } : dab > 0.4 ? { kind: 'dab', u: u - 3.4 } : null;
    }
  } else {
    // sentry march: stepping on the spot, an about-face (the picture mirrored), back again
    const k = win(u, 0, 0.5, 5.5, 6);
    const mar = win(u, 0.4, 0.7, 5, 5.4);
    const ph = Math.sin(u * 7);
    go({ shN: -30, elN: -80, shF: -ph * 14, elF: -20, fyN: -0.25 * Math.max(0, ph), fyF: -0.25 * Math.max(0, -ph), head: -2 }, mar * k * w);
    sw(-0.7, mar * k * w);
    if (at(k)) {
      q.mood = 'stern';
      q.mirror = u > 2.2 && u < 4.2 ? 1 : 0;
    }
  }
}

// ---------- Effects ----------
// A crumb: a soft rounded nub of cookie.
function crumb(ctx, x, y, s, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  smooth(ctx, [[-s, -s * 0.5], [-s * 0.2, -s * 0.9], [s * 0.9, -s * 0.4], [s * 0.8, s * 0.6], [-s * 0.4, s * 0.8]]);
  ctx.fillStyle = COOKIE[1];
  ctx.fill();
  pen(ctx, COOKIE[3], Math.max(0.4, s * 0.25));
  ctx.stroke();
  ctx.restore();
}
function badge(ctx, x, y, mark, e, len, fl) {
  const inn = e < 0.22 ? sstep(e / 0.22) * (1 + 0.2 * Math.sin(Math.PI * clamp(e / 0.22, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  ctx.scale(fl * k, k);
  ctx.save();
  ctx.translate(0, 0.6);
  heartPath(ctx, 1.05);
  ctx.fillStyle = '#fffafc';
  ctx.fill();
  pen(ctx, TIN[3], 1.1);
  ctx.stroke();
  ctx.restore();
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? PINK[3] : MINT_INK;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.6);
    ctx.lineTo(0, 0.6);
  } else {
    ctx.moveTo(-1.3, -1.4);
    ctx.quadraticCurveTo(-1, -3, 0.4, -2.8);
    ctx.quadraticCurveTo(1.8, -2.5, 1.2, -1);
    ctx.quadraticCurveTo(0.3, -0.4, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.4, 0.75, 0.75);
  ctx.fill();
  ctx.restore();
}
function swish(ctx, cx, cy, r, a0, a1, w, al, col = '#fff8fb', rim = PINK[2]) {
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
  pen(ctx, rim, 1);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  const q = a.grQ ?? {};
  // the piped line on the floor (her entrance)
  const L = q.line;
  if (L) {
    // (world px from her, in her own picture's space: mirrored when she faces left)
    const fs = a.flip ? -1 : 1;
    const x0 = (L.x / BIG) * fs;
    const len = 34 * (L.u ?? 1);
    const p0 = [x0, -0.6];
    const p1 = [x0 + len * L.dir * fs, -0.6];
    squiggle(ctx, p0, p1, 0.6, Math.max(1, Math.round(len / 3)), 2.2, ICING[2]);
    squiggle(ctx, p0, p1, 0.6, Math.max(1, Math.round(len / 3)), 1.5, ICING[0]);
  }
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.grQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function tipOf(a, D, q) {
  const h = ptOf(a, D, 'handN', D.J.handN);
  const w = ptOf(a, D, 'handN', D.J.wrN);
  const ang = Math.atan2(h[1] - w[1], h[0] - w[0]) + (q.swA ?? 0);
  return [h[0] + Math.cos(ang) * 25 * SK, h[1] + Math.sin(ang) * 25 * SK];
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -21]);
  const hd = headAt(a, D, [0.5, 0]);
  const tip = tipOf(a, D, q);
  const hF = ptOf(a, D, 'handF', D.J.handF);
  const chest = ptOf(a, D, 'chest', [D.J.stern[0] + 3, D.J.stern[1] + 12]);
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0 && !m.cine) badge(ctx, crown[0] + 4, crown[1] - 6, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0 && !m.cine) badge(ctx, crown[0] + 4, crown[1] - 6, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  if (X.kind === 'thrust') {
    const k = clamp(u / 0.35, 0, 1);
    for (let i = 0; i < 3; i++) sparkle(ctx, tip[0] + 2 + k * 8 + i * 2, tip[1] - 2 + i * 2, 1.6 * (1 - k), 1 - k, '#fff6fa');
    swish(ctx, tip[0] - 10, tip[1], 10, -0.5, 0.5, 2.4, 1 - k);
  } else if (X.kind === 'chop') {
    const k = clamp(u / 0.4, 0, 1);
    swish(ctx, hd[0], hd[1] + 6, 15, -1.7 + k * 0.4, 0.5 + k * 0.3, 3.6, 1 - k);
    for (let i = 0; i < 3; i++) crumb(ctx, tip[0] + (i - 1) * 3 * (1 + k * 2), -1 - Math.sin(Math.PI * k) * 5, 0.8, i + k * 4, 1 - k);
  } else if (X.kind === 'bash') {
    const k = clamp(u / 0.5, 0, 1);
    const big = X.big ? 1.6 : 1;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.globalAlpha *= (1 - k) * 0.8;
      ctx.translate(hF[0] + 6 + k * 14 * big + i * 4, hF[1] - 1);
      heartPath(ctx, (0.5 + i * 0.25) * big);
      pen(ctx, PINK[1], 0.8);
      ctx.stroke();
      ctx.restore();
    }
  } else if (X.kind === 'smack' || X.kind === 'stamp') {
    const v = clamp(u / 0.5, 0, 1);
    const at = X.kind === 'smack' ? [tip[0], -1] : [hd[0] + 4, -1];
    for (let i = 0; i < 6; i++) {
      const an = -Math.PI + (i / 5) * Math.PI;
      crumb(ctx, at[0] + Math.cos(an) * (2 + v * 12), at[1] + Math.sin(an) * (2 + v * 8) + v * v * 4, 1.1, i + v * 6, 1 - v);
    }
    dust(ctx, at[0], -1, 2.4 + v * 5, 0.6 * (1 - v), '#fff6ea', '#e6c49a');
  } else if (X.kind === 'pop') {
    // the gumdrops popping off her chest and flying up
    const cols = [GUM.red, GUM.gold, GUM.lime];
    for (let i = 0; i < 3; i++) {
      const v = clamp((u - i * 0.12) / 0.8, 0, 1);
      if (v <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= 1 - sstep((v - 0.7) / 0.3);
      gumdrop(ctx, a, chest[0] + (i - 1) * 4 + v * 8 * (i - 1), chest[1] - v * 28 + v * v * 6, 1.6, cols[i]);
      ctx.restore();
    }
  } else if (X.kind === 'swirl') {
    // a soft-serve swirl of icing gathering on the spatula's tip
    const v = clamp(u / 2.2, 0, 1);
    for (let i = 0; i < 3; i++) {
      ell(ctx, tip[0], tip[1] - 1.2 - i * 1.3 * v, (2.2 - i * 0.6) * (0.4 + 0.6 * v), (1 - i * 0.2) * (0.4 + 0.6 * v));
      ctx.fillStyle = i % 2 ? '#fff6fa' : PINK[0];
      ctx.fill();
      pen(ctx, PINK[2], 0.4);
      ctx.stroke();
    }
  } else if (X.kind === 'heat' || X.kind === 'oven') {
    const v = (u * 0.9) % 1;
    for (let i = 0; i < 4; i++) {
      const x = hd[0] - 14 + i * 9;
      ctx.save();
      ctx.globalAlpha *= 0.5 * Math.sin(Math.PI * ((v + i * 0.25) % 1));
      ctx.beginPath();
      const y0 = -6 - ((v + i * 0.25) % 1) * 30;
      ctx.moveTo(x, y0);
      ctx.bezierCurveTo(x + 2, y0 - 3, x - 2, y0 - 6, x, y0 - 9);
      pen(ctx, '#ffb070', 1);
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }
    if (X.kind === 'oven' && u < 1.5) cue(ctx, 'into the oven!', hd[0] + 24, hd[1] - 26, 6, fl, -0.1, PINK[3]);
  } else if (X.kind === 'cutout') {
    sparkle(ctx, hF[0], hF[1] - 8, 2.6 * Math.sin(Math.PI * clamp(u / 1.4, 0, 1)), 1, '#ffffff');
    if (u < 1.5) cue(ctx, 'cut out!', hd[0] + 22, hd[1] - 26, 6.5, fl, -0.1, PINK[3]);
  } else if (X.kind === 'clang') {
    const v = clamp(u / 0.3, 0, 1);
    for (let i = 0; i < 4; i++) crumb(ctx, hF[0] + Math.cos(i * 1.6) * (2 + v * 8), hF[1] - 4 + Math.sin(i * 1.6) * (2 + v * 6) + v * v * 5, 0.8, i + v * 4, 1 - v);
    sparkle(ctx, hF[0] + 2, hF[1] - 6, 2 * (1 - v), 1 - v, '#ffffff');
  } else if (X.kind === 'salute') {
    if (u > 0.2 && u < 1.3) sparkle(ctx, tip[0], tip[1], 2.4 * Math.sin(Math.PI * clamp((u - 0.2) / 1.1, 0, 1)), 1, '#ffffff');
  } else if (X.kind === 'huff') {
    const v = clamp(u / 1.2, 0, 1);
    for (let i = 0; i < 3; i++) {
      ell(ctx, hd[0] + 9 + i * 2 + v * 4, hd[1] + 6 - i, 1 + v * 1.4, 1 + v);
      ctx.fillStyle = `rgba(255,255,255,${(0.5 * Math.sin(Math.PI * v)).toFixed(3)})`;
      ctx.fill();
    }
  } else if (X.kind === 'shine') {
    sparkle(ctx, hF[0] + 3, hF[1] - 6, 2.6 * Math.sin(Math.PI * clamp(u / 1.2, 0, 1)), 1, '#ffffff');
  } else if (X.kind === 'crumb') {
    // the crumb: off her near elbow, a bounce on the floor, lying there
    const el = ptOf(a, D, 'armFf', D.J.elF);
    const v = clamp(u / 0.7, 0, 1);
    const y = v < 1 ? el[1] + (-1 - el[1]) * v * v : -1 - Math.abs(Math.sin(Math.min(1, (u - 0.7) / 0.4) * Math.PI)) * 2 * (1 - clamp((u - 0.7) / 0.4, 0, 1));
    crumb(ctx, el[0] + v * 3, y, 1, u * 3, 1);
    if (u < 0.9) cue(ctx, 'oh no!', hd[0] + 18, hd[1] - 22, 6, fl, -0.12, PINK[3]);
  } else if (X.kind === 'dab') {
    if (u > 1.2 && u < 2.4) sparkle(ctx, hF[0], hF[1] - 3, 2 * Math.sin(Math.PI * (u - 1.2) / 1.2), 1, '#ffffff');
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) crumb(ctx, hd[0] - 8 - v * 6 + i * 4, hd[1] + 4 + v * 10 + i * 2, 0.9, i + v * 5, 1 - v);
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] + 6, 9, t, 3);
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.4, 0.6 * (1 - u / 0.6), '#fff6ea', '#e6c49a');
  }
}

const DRESS = {
  id: 'gretel',
  // (the skin is her gingerbread; her armour is shaped over it from the same outline)
  skin: { lt: COOKIE[0], base: COOKIE[1], sh: COOKIE[2], deep: COOKIE[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      breastplate(ctx, a, mode, D);
      skirt(ctx, a, mode, D);
      shield(ctx, a, mode, D);
    },
    armF: (ctx, a, mode, S, D) => pauldron(ctx, a, mode, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => hand(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => {
      head(ctx, a, mode, D);
      shield(ctx, a, mode, D, true);
    },
    armN: (ctx, a, mode, S, D) => {
      pauldron(ctx, a, mode, D, 'N');
      spatula(ctx, a, mode, D);
    },
    handNskin: (ctx, a, mode, S, D) => hand(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('cookie', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  // (an about-face: the picture mirrored, never squashed)
  if (a.mo?.rig?.grMirror) ctx.scale(-1, 1);
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.4);
rig.h = Math.round(rig.h * BIG * 1.45);
// Her art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over
// her head are her own).
export const GRETEL_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [100, 170, 300, 220], draw: R.still, rig, noHop: true, ownEmotes: true };
export const GRETEL_SIZE = { w: 52, h: Math.round(R.H * BIG * 1.12), speed: Math.round(R.speed * BIG) };
export { heartPath, shieldAt, spatulaAt };
