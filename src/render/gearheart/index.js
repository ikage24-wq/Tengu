// Queen Gearheart, the Grand Automaton, on screen (2026-11-27, redrawn from scratch: the Ferris Wheel's
// queen, her story and role kept; world/carnival.js her new fight). The carnival's queen and its oldest
// toy: a tin wind-up mouse in painted enamel, the one who winds the whole troupe (Leonie, Madame
// Marionette, the Giraffe Ballerina, the Koala Balloonist, the Cymbal Monkey, the Boxing Kangaroo, the
// Hippo Strongman, every little harlequin) and the most wound-up of them all: since festival night she
// has had to perform while anyone is watching, and Elder Kuri never stopped watching. Gracious, proud,
// bone-tired under the smile. She moves on her own copy of the creature base (rig.js; body.js
// `tinmouse`: a dancer's slim build), dressed here; her head, ears, crown, collar, dress, tail, key and
// sceptre drawn here from scratch (never the shared face, nothing of the hero's).
//   look    painted cream enamel with soft rose shading and fine seams of tin, little rivets; a big round
//           head, two great round ears lined in rose, a small rounded snout with a pink nose, painted
//           whisker dots; a gold crown of rounded cog teeth with three pearl points and a ruby heart;
//           a standing collar of gold cog teeth behind her neck; a teal enamel bodice with a gold clock
//           face at her heart (its hands tick), gold seams and rivets; a short skirt of two scalloped
//           ruffle tiers (rose, then cream lace), each on its own spring; white tights with gold bands
//           at her knees (a toy's joints), little rose shoes with a tin wheel at the heel; a long thin
//           tail curling to a gold heart; the great brass winding key in her back (three heart bows),
//           turning; a gold sceptre topped with a spinning pinwheel star.
//   eyes    her own: big round enamel eyes, a deep teal iris fading to sky at the bottom, a dark pupil,
//           a four-point star glint and a small round one; a neat lash line with two rounded flicks;
//           painted rosy cheeks. Faces: gracious (rest, a fond little smile), delight (^ ^), focus,
//           cross, startled, tired (a brave droop), hurt, dizzy, sad, sleepy, talking (vowel mouths).
//   idle    a 30 s act in pieces (only one she has time for): a tick-tock march on the spot; a slow
//           music-box pirouette (the picture mirrored at its middle, never squashed); running down (she
//           slows, droops, almost stops... and her key catches and jolts her upright); a wave to her
//           audience and a curtsy.
//   walk    a toy's gliding roll on her heel wheels, a little bob each step, the sceptre swinging.
//   fight   between casts her swings at the tank in turn: Sceptre Bop, Twirl (with her tail) and Toy
//           Kick. Her casts (m.castPose, world/carnival.js): toss (Cog Toss: little cogs flicked up from
//           both paws), tap (Royal Tap: the sceptre raised high, then brought down), chime (Twelve
//           O'Clock: her arms the clock's hands, sweeping round to noon), wind (Wind Me Up!: she points
//           to the holes and her key spins), melody (Music Box Melody: a music-box pirouette, arms
//           in a crown), duet (Duet: paws clasped, a sway), spring (Springs Loose!: a jolt, arms flung
//           up). Overwound (m.overwound) her key whirs and steams; run down (m.runDownAt) she droops,
//           her key barely turning; phase moments (m.phaseAt): the Music Box, the Last Waltz.
//   scenes  her entrance (carnival_gearheart): 'perform' (pirouettes and bows on and on, her key
//           humming), 'notice' (she stops mid-turn: more audience!), 'present' (arms flung wide: step
//           right up), 'selfwind' (she reaches back and cranks her own key, three great turns), 'windup',
//           'attack', 'sway'. Her ending (carnival_freed): freed, she sits down where she stands; asleep,
//           her key slows and stops; 'fade' (her last moment: one last tick of the key, she curls up
//           smaller and nods off as she fades).
//   marks   all her own (`ownEmotes`): a "!" and a "?" on a little gold cog, a gracious bow after landing
//           a hit, a sweat drop when low, dizzy stars when beaten.
// Every effect is drawn live in her own style: brass cogs, music-box notes, sparkles, little steam puffs.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat, cue, note, spring, steam } from './fx.js';

const BIG = 2.6;
const LW = 1.6 / BIG;
// ---------- Her colours ----------
const INK = '#8a6458';
const TIN = ['#fffdf8', '#f8efe4', '#e8d6c6', '#cbb2a2'];
const ROSE = ['#ffd6e0', '#f49ab4', '#d8708e', '#a84a68'];
const TEAL = ['#c8f2ee', '#5cc4c0', '#3a9a9c', '#22686e'];
const LACE = ['#ffffff', '#fdf8f0', '#efe4d6', '#cdbcaa'];
const GOLD = ['#fff4c0', '#f6c94e', '#c8902c', '#8e6418'];
const BRASS = ['#ffe9a8', '#e8b84a', '#b8862c', '#7e5a1c'];
const IRIS = ['#cdeff8', '#62b8d0', '#2a7090', '#16364e'];
const LASH = '#3a2430';
const NOSE = ['#ff9ab0', '#d0607e'];

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
// A cog: a disc with `n` rounded teeth (never sharp), a hole in the middle.
function cogPath(ctx, x, y, r, n, ang = 0, tooth = 0.22) {
  ctx.beginPath();
  const N = n * 8;
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * TAU + ang;
    const w = Math.cos(u * n);
    const rr = r * (1 + tooth * sstep((w + 0.2) / 0.6));
    const p = [x + Math.cos(u) * rr, y + Math.sin(u) * rr];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.closePath();
}
// ---------- Her head (head units about its middle, over her neck) ----------
const HO = [1.4, -11.6];
const HS = 1.2;
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
// lid (closed eyes only), shut (which closed shape), bt/by (brows' tilt and raise), mw/ms/mo (mouth
// width, smile, openness), bl (blush), sm (small irises), dr (a tired droop of her lids' line).
const FACES = {
  gracious: { lid: 0, shut: 'happy', bt: -0.1, by: 0.3, mw: 0.8, ms: 0.6, mo: 0, bl: 0.5, sm: 0, dr: 0.15 },
  delight: { lid: 1, shut: 'happy', bt: -0.2, by: 0.8, mw: 1, ms: 1, mo: 0.5, bl: 0.85, sm: 0, dr: 0 },
  focus: { lid: 0, shut: 'happy', bt: 0.5, by: -0.1, mw: 0.7, ms: 0.15, mo: 0, bl: 0.45, sm: 0.1, dr: 0 },
  cross: { lid: 0, shut: 'happy', bt: 0.95, by: -0.35, mw: 0.85, ms: -0.5, mo: 0.2, bl: 0.5, sm: 0.15, dr: 0 },
  startled: { lid: 0, shut: 'happy', bt: -0.3, by: 1.3, mw: 0.6, ms: 0, mo: 0.6, bl: 0.6, sm: 0.6, dr: 0 },
  tired: { lid: 0, shut: 'happy', bt: -0.7, by: 0.2, mw: 0.7, ms: 0.25, mo: 0, bl: 0.35, sm: 0.1, dr: 1 },
  hurt: { lid: 1, shut: 'squeeze', bt: -0.8, by: 0.2, mw: 0.8, ms: -0.7, mo: 0.55, bl: 0.6, sm: 0, dr: 0 },
  dizzy: { lid: 1, shut: 'dizzy', bt: -0.5, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.4, bl: 0.5, sm: 0, dr: 0 },
  sad: { lid: 0, shut: 'happy', bt: -0.95, by: 0.35, mw: 0.7, ms: -0.6, mo: 0, bl: 0.4, sm: 0.15, dr: 0.6 },
  worried: { lid: 0, shut: 'happy', bt: -0.8, by: 0.5, mw: 0.7, ms: -0.35, mo: 0.15, bl: 0.5, sm: 0.1, dr: 0.3 },
  sleepy: { lid: 1, shut: 'sleep', bt: -0.2, by: -0.1, mw: 0.6, ms: 0.25, mo: 0.06, bl: 0.5, sm: 0, dr: 0 },
  talk: { lid: 0, shut: 'happy', bt: 0, by: 0.4, mw: 0.85, ms: 0.35, mo: 0.4, bl: 0.5, sm: 0, dr: 0.1 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.6, 0.1, 0.75], [1.0, 0.4, 0.5], [0.9, 0.3, 0.25], [0.7, 0.2, 0], [0.75, 0.2, 0.55]];
const EYE = { w: 3.9, h: 4.3 };

function closedLine(ctx, a, x, y, side, s, t) {
  const { w, h } = EYE;
  pen(ctx, tone(a, LASH), 1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (s === 'happy') {
    ctx.moveTo(x - w, y + 1);
    ctx.quadraticCurveTo(x, y - h * 0.9, x + w, y + 1);
  } else if (s === 'sleep') {
    ctx.moveTo(x - w, y + 0.2);
    ctx.quadraticCurveTo(x, y + h * 0.6, x + w, y + 0.2);
    ctx.stroke();
    // (her two little flicks still curl at the outer corner)
    ctx.beginPath();
    ctx.moveTo(x + side * w, y + 0.2);
    ctx.quadraticCurveTo(x + side * (w + 0.7), y - 0.1, x + side * (w + 1.1), y - 0.9);
  } else if (s === 'squeeze') {
    ctx.moveTo(x + side * w, y - 2.2);
    ctx.quadraticCurveTo(x - side * w * 0.2, y - 0.3, x - side * w * 0.9, y + 0.2);
    ctx.quadraticCurveTo(x - side * w * 0.2, y + 0.8, x + side * w, y + 2.4);
  } else {
    for (let i = 0; i <= 26; i++) {
      const an = (i / 26) * TAU * 2 + t * 4 * side;
      const r = (i / 26) * w * 0.9;
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
  const blink = f.lid < 0.6 ? win((t + (a.ghUid ?? 0) * 0.71) % 5.3, 4.8, 4.9, 4.98, 5.12) : 0;
  const L = Math.max(f.lid, blink);
  const closedW = sstep((L - 0.93) / 0.07);
  const shutW = blink > f.lid + 0.05 ? { happy: 0, sleep: 1, squeeze: 0, dizzy: 0 } : f.shut;
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
  // her round enamel eye (the tired droop tips its outer top down a little)
  const dr = f.dr ?? 0;
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(x - w, y + 0.2);
    ctx.bezierCurveTo(x - w, y - h * 1.15, x + w, y - h * 1.15 + side * dr * 0.9, x + w, y + 0.2);
    ctx.bezierCurveTo(x + w, y + h * 1.25, x - w, y + h * 1.25, x - w, y + 0.2);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = tone(a, '#fffefb');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.3 * f.sm;
  const ix = x + side * 0.2 + (look?.[0] ?? 0) * 0.8;
  const iy = y + 0.6 + (look?.[1] ?? 0) * 0.6;
  const ir = [3.0 * small, 3.35 * small];
  const g = ctx.createLinearGradient(0, iy - ir[1], 0, iy + ir[1]);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.45, tone(a, IRIS[2]));
  g.addColorStop(0.85, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#12283a', 0.85), 0.42);
  ctx.stroke();
  ell(ctx, ix, iy + 0.3, 1.45 * small, 1.75 * small);
  ctx.fillStyle = tone(a, '#10202e');
  ctx.fill();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.3);
  sg.addColorStop(0, 'rgba(60,40,80,0.3)');
  sg.addColorStop(1, 'rgba(60,40,80,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.3, w * 2.6, h);
  // the glints: a four-point star up at the back, a small round one low at the front
  const gx = ix - side * 1.05;
  const gy = iy - 1.4 * small;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU - Math.PI / 2;
    const r = i % 2 ? 0.42 : 1.35;
    const p = [gx + Math.cos(an) * r, gy + Math.sin(an) * r];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, ix + side * 1.2, iy + 1.1 * small, 0.5, 0.5);
  ctx.fill();
  if (L > 0.01) {
    ctx.fillStyle = tone(a, TIN[1]);
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
  // the lash line over its top, two rounded flicks at the outer corner
  ctx.beginPath();
  ctx.moveTo(x - w * 1.02, y + 0.1);
  ctx.bezierCurveTo(x - w, y - h * 1.2, x + w, y - h * 1.2 + side * dr * 0.9, x + w * 1.02, y + 0.1);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, LASH), 0.95);
  ctx.stroke();
  for (const [u, len] of [[0.82, 1.3], [0.98, 1.6]]) {
    const ox = x + side * w * (u * 1.02);
    const oy = y - h * 1.0 * Math.sqrt(Math.max(0, 1 - u * u)) + side * dr * 0.5 * u;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo(ox + side * len * 0.6, oy - 0.3, ox + side * len, oy - len * 0.8);
    pen(ctx, tone(a, LASH), 0.6);
    ctx.stroke();
  }
  ctx.restore();
}
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.by * 1.1);
  ctx.rotate(side * f.bt * 0.5);
  ctx.beginPath();
  ctx.moveTo(-1.6, 0.25);
  ctx.quadraticCurveTo(0, -0.7, 1.6, 0.2);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, ROSE[3], 0.8), 0.9);
  ctx.stroke();
  ctx.restore();
}
// Her mouth under her snout: a small soft "w" that smiles, opens for a laugh, turns down when sad.
function mouth(ctx, a, x, y, f) {
  const w = 2.0 * f.mw;
  const cy = y - f.ms * (f.ms < 0 ? 1.5 : 0.55);
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.3 - o * 0.3, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.6 + o * 2.6, x - w, cy);
    ctx.fillStyle = tone(a, '#8a3048');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x + 0.1, y + o * 2.2, w * 0.6, o * 0.9);
    ctx.fillStyle = tone(a, '#f48aa4');
    ctx.fill();
    ctx.restore();
    pen(ctx, tone(a, '#6a2030'), 0.45);
    ctx.stroke();
    return;
  }
  pen(ctx, tone(a, '#7a3a44'), 0.6);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w, cy - 0.2);
  ctx.quadraticCurveTo(x - w * 0.5, y + 0.8 + f.ms * (f.ms < 0 ? 1 : 0.4), x, y - 0.1);
  ctx.quadraticCurveTo(x + w * 0.5, y + 0.8 + f.ms * (f.ms < 0 ? 1 : 0.4), x + w, cy - 0.2);
  ctx.stroke();
}
// Her head's round, and her snout: a soft bump out the front, lower down.
function skullPath(ctx, tx) {
  ctx.beginPath();
  ctx.ellipse(-0.4, -2.4, 13.6, 12.8, 0, 0, TAU);
  ctx.moveTo(tx + 14.4, 4.6);
  ctx.ellipse(tx + 8.8, 4.6, 5.8, 4.6, -0.08, 0, TAU);
}
// A great round ear, rooted inside her head, rose-lined, on its own spring.
function ear(ctx, a, mode, x, y, r, rot, far) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ell(ctx, 0, -r * 0.9, r, r * 0.96);
  paint(ctx, a, mode, far ? TIN[2] : TIN[1]);
  if (mode === 'fill') {
    ell(ctx, 0.3, -r * 0.82, r * 0.66, r * 0.62);
    ctx.fillStyle = tone(a, far ? ROSE[2] : ROSE[1]);
    ctx.fill();
    glow(ctx, -r * 0.3, -r * 1.2, r * 0.6, '#ffffff', far ? 0.2 : 0.5);
    // a fine tin seam round its rim, a rivet at its root
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.9, r * 0.86, r * 0.82, 0, Math.PI * 1.05, Math.PI * 1.95);
    pen(ctx, tone(a, TIN[3], 0.6), 0.35);
    ctx.stroke();
  }
  ctx.restore();
}
// Her gold crown: a ring of rounded cog teeth, three pearl points, a ruby heart in front.
function crown(ctx, a, mode) {
  const q = a.ghQ ?? {};
  ctx.save();
  ctx.translate(1.4, -14.2);
  ctx.rotate(-0.06 + (q.crownA ?? 0));
  // the band and its teeth
  ctx.beginPath();
  ctx.moveTo(-7.4, 0.6);
  for (let i = 0; i <= 6; i++) {
    const x = -7.4 + (i / 6) * 14.8;
    const tall = i === 1 || i === 3 || i === 5 ? 6.6 : 3.2;
    ctx.lineTo(x - 0.9, -tall + 1.2);
    ctx.quadraticCurveTo(x, -tall - 0.4, x + 0.9, -tall + 1.2);
  }
  ctx.lineTo(7.4, 0.6);
  ctx.quadraticCurveTo(0, 2, -7.4, 0.6);
  ctx.closePath();
  paint(ctx, a, mode, GOLD[1], GOLD[3]);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, -2, -3, 6, GOLD[0], 0.8);
    ctx.fillStyle = tone(a, GOLD[2], 0.6);
    ctx.fillRect(-9, -0.6, 18, 2);
    ctx.restore();
    for (const i of [1, 3, 5]) {
      const x = -7.4 + (i / 6) * 14.8;
      ell(ctx, x, -6.8, 1.1, 1.1);
      ctx.fillStyle = tone(a, '#fffaf4');
      ctx.fill();
      pen(ctx, tone(a, LACE[3]), 0.3);
      ctx.stroke();
    }
    // the ruby heart
    ctx.beginPath();
    ctx.moveTo(0.4, 0.6);
    ctx.bezierCurveTo(-1.6, -0.4, -1.4, -2.4, 0.4, -1.6);
    ctx.bezierCurveTo(2.2, -2.4, 2.4, -0.4, 0.4, 0.6);
    ctx.closePath();
    ctx.fillStyle = tone(a, ROSE[3]);
    ctx.fill();
    ell(ctx, -0.2, -1.4, 0.4, 0.28, -0.4);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.ghQ ?? {};
  const f = a.ghF;
  const turn = q.turn ?? 0.4;
  const tx = turn * 2.4;
  const eA = q.earA ?? [0, 0];
  ear(ctx, a, mode, 8.4, -11.6, 6.4, 0.5 + eA[1], true);
  skullPath(ctx, tx);
  paint(ctx, a, mode, TIN[1]);
  if (mode === 'fill' && f) {
    ctx.save();
    skullPath(ctx, tx);
    ctx.clip();
    glow(ctx, tx - 3, -9, 12, TIN[0], 0.95);
    glow(ctx, -12, 4, 8, TIN[2], 0.55);
    glow(ctx, tx + 9, 3, 4.6, '#ffffff', 0.6);
    // a fine tin seam over her crown, a rivet each end
    ctx.beginPath();
    ctx.moveTo(-12.4, -6);
    ctx.quadraticCurveTo(-2, -15.6, 9.6, -9);
    pen(ctx, tone(a, TIN[3], 0.5), 0.35);
    ctx.stroke();
    ctx.restore();
    for (const [cx, s] of [[tx - 6.6, 0.85], [tx + 4.8, 1]]) {
      ell(ctx, cx, 4.4, 2.4, 1.5);
      ctx.fillStyle = tone(a, '#ff8aa6', (0.25 + 0.45 * f.bl) * s);
      ctx.fill();
    }
    const ex = (s) => (s < 0 ? -4.8 + tx * 0.7 : 5.4 + tx);
    for (const s of [-1, 1]) eye(ctx, a, ex(s), -1.4, s, f, q.look);
    for (const s of [-1, 1]) brow(ctx, a, ex(s) + s * 0.2, -7.8, s, f);
    // her nose: a round pink bead at the tip of her snout, a glint
    const nx = tx + 13.6;
    ell(ctx, nx, 3.4, 1.7, 1.4);
    ctx.fillStyle = tone(a, NOSE[0]);
    ctx.fill();
    pen(ctx, tone(a, NOSE[1]), 0.4);
    ctx.stroke();
    ell(ctx, nx - 0.6, 2.9, 0.55, 0.38, -0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    // painted whisker dots and three short soft whiskers each side
    for (const [dx, dy] of [[-3.4, 5.4], [-2.2, 6.6], [-4.4, 6.8]]) {
      ell(ctx, nx + dx, dy, 0.3, 0.3);
      ctx.fillStyle = tone(a, TIN[3], 0.7);
      ctx.fill();
    }
    ctx.lineCap = 'round';
    pen(ctx, tone(a, TIN[3], 0.55), 0.35);
    for (const [ang, len] of [[-0.18, 4.6], [0.05, 5], [0.28, 4.4]]) {
      ctx.beginPath();
      ctx.moveTo(nx + 0.6, 5.6);
      ctx.quadraticCurveTo(nx + 0.6 + Math.cos(ang) * len * 0.6, 5.6 + Math.sin(ang) * len * 0.6 - 0.3, nx + 0.6 + Math.cos(ang) * len, 5.6 + Math.sin(ang) * len);
      ctx.stroke();
    }
    mouth(ctx, a, nx - 3.2, 7.2, f);
    if (q.sweat >= 0) sweat(ctx, tx - 12, -5 + q.sweat * 3, 1.1);
  }
  ear(ctx, a, mode, -8.6, -10.4, 6.6, -0.42 + eA[0], false);
  crown(ctx, a, mode);
  WK = 1;
  ctx.restore();
}

// ---------- Her dress (all cut from her own outline) ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
function limbPath(ctx, L, from = 0) {
  ctx.beginPath();
  for (let i = from; i < L.pts.length; i++) {
    const [x, y] = L.pts[i];
    const r = Math.max(0.1, L.wl[i] / 2);
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
    if (i > from) {
      const [x0, y0] = L.pts[i - 1];
      const r0 = Math.max(0.1, L.wl[i - 1] / 2);
      const dx = x - x0;
      const dy = y - y0;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      ctx.moveTo(x0 + nx * r0, y0 + ny * r0);
      ctx.lineTo(x0 - nx * r0, y0 - ny * r0);
      ctx.lineTo(x - nx * r, y - ny * r);
      ctx.lineTo(x + nx * r, y + ny * r);
      ctx.closePath();
    }
  }
}
// The bodice: teal enamel, a sweetheart neckline over her cream tin, gold seams and rivets, a gold clock
// face at her heart whose hands tick; then her skirt.
function bodice(ctx, a, mode, D) {
  const C = (p) => ptOf(a, D, 'chest', p);
  const W = (p) => ptOf(a, D, 'waistB', p);
  const T = (p) => ptOf(a, D, 'torso', p);
  const st = D.J.stern;
  const nv = D.J.navel;
  const hp = D.J.hip;
  if (mode === 'fill') {
    ctx.save();
    if (torsoPath(ctx, a)) {
      ctx.clip();
      ctx.fillStyle = tone(a, TIN[1]);
      ctx.fillRect(-80, -120, 160, 160);
      const body = chaikin([C([st[0] - 30, st[1] + 3]), C([st[0] - 5, st[1] + 2.6]), C([st[0] - 1, st[1] + 5.4]), C([st[0] + 2.6, st[1] + 3.6]), C([st[0] + 6.6, st[1] + 5.4]), C([st[0] + 11, st[1] + 2.6]), C([st[0] + 30, st[1] + 3]), T([hp[0] + 30, hp[1] + 30]), T([hp[0] - 30, hp[1] + 30])], 1);
      poly(ctx, body);
      ctx.fillStyle = tone(a, TEAL[1]);
      ctx.fill();
      ctx.save();
      poly(ctx, body);
      ctx.clip();
      const sh = C([st[0] - 9, st[1] + 10]);
      glow(ctx, sh[0], sh[1], 8, TEAL[3], 0.4);
      const lt = C([st[0] + 4, st[1] + 8]);
      glow(ctx, lt[0], lt[1], 6, TEAL[0], 0.6);
      // tin seams down her sides, rivets along them
      for (const sx of [-6.4, 7.6]) {
        ctx.beginPath();
        ctx.moveTo(...C([st[0] + sx, st[1] + 5]));
        ctx.quadraticCurveTo(...W([nv[0] + sx * 0.8, nv[1] - 4]), ...W([nv[0] + sx * 0.7, nv[1] + 1]));
        pen(ctx, tone(a, GOLD[2], 0.8), 0.45);
        ctx.stroke();
        for (const [P, yy] of [[C, st[1] + 8], [C, st[1] + 12.5], [W, nv[1] - 2.5]]) {
          const p = P([P === W ? nv[0] + sx * 0.75 : st[0] + sx * 0.95, yy]);
          ell(ctx, p[0], p[1], 0.38, 0.38);
          ctx.fillStyle = tone(a, GOLD[1]);
          ctx.fill();
        }
      }
      // a gold waistband
      ctx.beginPath();
      ctx.moveTo(...W([nv[0] - 30, nv[1] + 1]));
      ctx.lineTo(...W([nv[0] + 30, nv[1] + 1]));
      pen(ctx, tone(a, GOLD[1]), 1.4);
      ctx.stroke();
      ctx.restore();
      // the neckline's gold trim
      ctx.beginPath();
      ctx.moveTo(...C([st[0] - 9, st[1] + 3]));
      ctx.quadraticCurveTo(...C([st[0] - 2, st[1] + 3.2]), ...C([st[0] - 1, st[1] + 5.4]));
      ctx.quadraticCurveTo(...C([st[0] + 1.6, st[1] + 3]), ...C([st[0] + 2.6, st[1] + 3.6]));
      ctx.quadraticCurveTo(...C([st[0] + 4, st[1] + 3]), ...C([st[0] + 6.6, st[1] + 5.4]));
      ctx.quadraticCurveTo(...C([st[0] + 8, st[1] + 3]), ...C([st[0] + 12, st[1] + 2.6]));
      pen(ctx, tone(a, GOLD[1]), 0.8);
      ctx.stroke();
    }
    ctx.restore();
    // the clock face at her heart: gold rim, cream dial, its hands ticking round
    const q = a.ghQ ?? {};
    const cp = C([st[0] + 2.4, st[1] + 10]);
    ctx.save();
    ctx.translate(cp[0], cp[1]);
    cogPath(ctx, 0, 0, 2.4, 10, q.cogA ?? 0, 0.16);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    pen(ctx, tone(a, GOLD[3]), 0.3);
    ctx.stroke();
    ell(ctx, 0, 0, 1.75, 1.75);
    ctx.fillStyle = tone(a, LACE[1]);
    ctx.fill();
    ctx.lineCap = 'round';
    for (const [ang, len, w] of [[q.hourA ?? 0, 1, 0.4], [q.minA ?? 0, 1.45, 0.28]]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.sin(ang) * len, -Math.cos(ang) * len);
      pen(ctx, tone(a, LASH), w);
      ctx.stroke();
    }
    ell(ctx, 0, 0, 0.3, 0.3);
    ctx.fillStyle = tone(a, ROSE[3]);
    ctx.fill();
    ctx.restore();
  }
  skirt(ctx, a, mode, D, T, hp);
}
// Her skirt: two tiers of scalloped ruffles from her waist (cream lace under, rose over), each tier on
// its own spring, flaring a little as she turns.
function skirt(ctx, a, mode, D, T, hp) {
  const q = a.ghQ ?? {};
  const sk = q.skirt ?? [0, 0];
  const nv = D.J.navel;
  const top = nv[1] + 1.4;
  const tiers = [
    { col: LACE[1], ink: LACE[3], len: 13.2, flare: 13.4, n: 7 },
    { col: ROSE[1], ink: ROSE[3], len: 10, flare: 12, n: 6 },
  ];
  tiers.forEach((tr, ti) => {
    const sw = sk[ti] ?? 0;
    const hemY = top + tr.len;
    const pts = [[hp[0] - 7.4, top - 0.4], [hp[0] + 7.4, top - 0.4]];
    // the hem: soft scallops from front to back
    const N = tr.n;
    const right = hp[0] + tr.flare + sw * 7;
    const left = hp[0] - tr.flare + sw * 7;
    pts.push([right, hemY - 3]);
    for (let i = N; i >= 0; i--) {
      const x = mix(left, right, i / N);
      pts.push([x, hemY + (i % 2 ? 0 : 1.4) + Math.sin((i / N) * Math.PI) * 0.8]);
    }
    pts.push([left, hemY - 3]);
    const P = pts.map(T);
    smooth(ctx, P);
    if (mode === 'line') {
      pen(ctx, tr.ink, LW * 1.2);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = tone(a, tr.col);
    ctx.fill();
    ctx.save();
    smooth(ctx, P);
    ctx.clip();
    const c0 = T([hp[0] + 2, top + 3]);
    glow(ctx, c0[0], c0[1], 8, '#ffffff', 0.4);
    const c1 = T([left + 3, hemY - 2]);
    glow(ctx, c1[0], c1[1], 6, tr.ink, 0.3);
    // soft pleats
    for (let i = 1; i < N; i += 2) {
      const x = mix(left, right, i / N);
      ctx.beginPath();
      ctx.moveTo(...T([mix(hp[0] - 6, hp[0] + 6, i / N), top + 1]));
      ctx.lineTo(...T([x, hemY - 0.5]));
      pen(ctx, tone(a, tr.ink, 0.35), 0.5);
      ctx.stroke();
    }
    if (ti === 1) {
      // a row of tiny gold rivets along the rose tier's hem
      for (let i = 1; i < N; i++) {
        const p = T([mix(left, right, i / N), hemY - 1.4]);
        ell(ctx, p[0], p[1], 0.32, 0.32);
        ctx.fillStyle = tone(a, GOLD[1]);
        ctx.fill();
      }
    }
    ctx.restore();
  });
}
// The standing collar behind her neck: a half-ring of gold cog teeth, slowly turning (behind her).
function collar(ctx, a, mode, D) {
  const q = a.ghQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  cogPath(ctx, st[0] - 1, st[1] - 5, 13.4, 14, q.cogA ?? 0, 0.11);
  paint(ctx, a, mode, GOLD[2], GOLD[3]);
  if (mode === 'fill') {
    ell(ctx, st[0] - 1, st[1] - 5, 10, 10);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    glow(ctx, st[0] - 4, st[1] - 10, 5, GOLD[0], 0.7);
  }
  ctx.restore();
}
// Her tights: white, gold bands at her knees (a toy's joints), cut from her own legs.
function tights(ctx, a, mode, D, k) {
  const L = a[`blLeg${k}`];
  if (!L || mode !== 'fill') return;
  const near = k === 'N';
  ctx.save();
  limbPath(ctx, L, 1);
  ctx.clip('nonzero');
  ctx.fillStyle = tone(a, near ? LACE[1] : LACE[2]);
  ctx.fillRect(-200, -200, 400, 400);
  const K = ptOf(a, D, `shin${k}`, D.J[`knee${k}`]);
  const A = ptOf(a, D, `foot${k}`, D.J[`ank${k}`]);
  const an = Math.atan2(A[1] - K[1], A[0] - K[0]);
  ctx.save();
  ctx.translate(K[0], K[1]);
  ctx.rotate(an);
  ctx.fillStyle = tone(a, near ? GOLD[1] : GOLD[2]);
  ctx.fillRect(-0.9, -6, 1.8, 12);
  ctx.fillStyle = tone(a, GOLD[0], 0.7);
  ctx.fillRect(-0.9, -6, 0.5, 12);
  ctx.restore();
  glow(ctx, K[0] - 1, K[1] - 3, 2.4, '#ffffff', near ? 0.5 : 0.15);
  ctx.restore();
}
// A little rose tin shoe, a gold buckle, a tin wheel at the heel.
function shoe(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  const q = a.ghQ ?? {};
  // the wheel (behind the heel)
  ell(ctx, p[0] - 2.6, p[1] + 3, 2.2, 2.2);
  paint(ctx, a, mode, near ? TIN[2] : TIN[3], INK);
  if (mode === 'fill') {
    ctx.save();
    ctx.translate(p[0] - 2.6, p[1] + 3);
    ctx.rotate(q.wheelA ?? 0);
    pen(ctx, tone(a, TIN[3]), 0.4);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-1.5 * Math.cos((i * TAU) / 6), -1.5 * Math.sin((i * TAU) / 6));
      ctx.lineTo(1.5 * Math.cos((i * TAU) / 6), 1.5 * Math.sin((i * TAU) / 6));
      ctx.stroke();
    }
    ctx.restore();
  }
  smooth(ctx, [[p[0] - 3.2, p[1] - 2.6], [p[0] + 0.6, p[1] - 3.4], [p[0] + 4, p[1] - 1.8], [p[0] + 7.4, p[1] + 0.6], [p[0] + 7.4, p[1] + 3], [p[0] - 3.6, p[1] + 3], [p[0] - 4.2, p[1] + 0.4]]);
  paint(ctx, a, mode, near ? ROSE[1] : ROSE[2], ROSE[3]);
  if (mode === 'fill') {
    ell(ctx, p[0] + 3.4, p[1] - 0.2, 2.2, 0.9, -0.2);
    ctx.fillStyle = tone(a, ROSE[0], near ? 0.8 : 0.35);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(p[0] + 0.4, p[1] - 2.8, 2, 1.6, 0.4);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
  }
  ctx.restore();
}
// Her tin paw, a little round mitten, a gold band at the wrist.
function paw(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  const near = k === 'N';
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  const open = (a.ghQ ?? {})[`open${k}`] ?? 0;
  smooth(ctx, [[-3.2, -2.8], [-1, -4], [2, -3.8], [3.6, -1.2], [3.4 + open, 2.4], [1.2, 4.2 + open * 0.6], [-1.6, 4], [-3.6, 1.4]]);
  paint(ctx, a, mode, near ? TIN[1] : TIN[2]);
  if (mode === 'fill') {
    glow(ctx, -0.6, -1.2, 2.6, TIN[0], near ? 0.8 : 0.3);
    ctx.beginPath();
    ctx.moveTo(-3, -3.4);
    ctx.quadraticCurveTo(0, -4.6, 3, -3.4);
    pen(ctx, tone(a, GOLD[1]), 1);
    ctx.stroke();
  }
  ctx.restore();
}
// Her sceptre (rig space, in her near paw): a gold rod, a pinwheel star at its top, spinning.
function sceptre(ctx, a, mode, D) {
  const q = a.ghQ ?? {};
  if ((q.holdS ?? 1) < 0.02) return;
  const h = ptOf(a, D, 'handN', D.J.handN);
  const ang = q.sceptreA ?? -0.3;
  const dx = Math.sin(ang);
  const dy = -Math.cos(ang);
  const top = [h[0] + dx * 8.4, h[1] + dy * 8.4];
  const bot = [h[0] - dx * 2.6, h[1] - dy * 2.6];
  ctx.save();
  ctx.globalAlpha *= q.holdS ?? 1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...bot);
  ctx.lineTo(...top);
  if (mode === 'line') pen(ctx, GOLD[3], 1 + LW * 2);
  else {
    pen(ctx, tone(a, GOLD[2]), 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bot[0] - 0.3, bot[1]);
    ctx.lineTo(top[0] - 0.3, top[1]);
    pen(ctx, tone(a, GOLD[0], 0.8), 0.4);
  }
  ctx.stroke();
  // the pinwheel star: four rounded blades in rose and teal round a gold pin
  ctx.translate(top[0], top[1]);
  ctx.rotate(q.pinA ?? 0);
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i * TAU) / 4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(1.9, -0.4, 2.4, -1.9);
    ctx.quadraticCurveTo(1.1, -2.2, 0, 0);
    ctx.closePath();
    paint(ctx, a, mode, i % 2 ? ROSE[1] : TEAL[1], i % 2 ? ROSE[3] : TEAL[3]);
    ctx.restore();
  }
  ell(ctx, 0, 0, 0.65, 0.65);
  paint(ctx, a, mode, GOLD[1], GOLD[3]);
  ctx.restore();
}
// Her tail: long and thin from inside her back, curling to a little gold heart; a chain on springs.
function tail(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const angs = a.ghTail ?? [2.7, 2.4, 2.0, 1.4, 0.6, -0.3];
  const pts = chain([h[0] - 6, h[1] + 1], angs, [6, 6, 5.6, 5, 4.4, 3.6]);
  poly(ctx, tube(pts, [2.6, 2.3, 2.1, 1.9, 1.7, 1.5, 1.3], 0.4));
  paint(ctx, a, mode, ROSE[1], ROSE[3]);
  const e = pts[6];
  const d = angs[5];
  ctx.translate(e[0], e[1]);
  ctx.rotate(d + Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(0, 2.6);
  ctx.bezierCurveTo(-3, 0.6, -2.4, -2.4, 0, -1.2);
  ctx.bezierCurveTo(2.4, -2.4, 3, 0.6, 0, 2.6);
  ctx.closePath();
  paint(ctx, a, mode, GOLD[1], GOLD[3]);
  ctx.restore();
}
// The great brass winding key in her back: a stem, three heart-shaped bows, turning (seen edge-on as
// it comes round); faster when she's wound up, still when she's wound down.
function key(ctx, a, mode, D) {
  const q = a.ghQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  ctx.translate(st[0] - 12, st[1] + 7);
  ctx.scale(1.5, 1.5);
  const c = Math.cos(q.keyA ?? 0);
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(-6.6, 0);
  ctx.lineCap = 'round';
  pen(ctx, mode === 'line' ? INK : tone(a, BRASS[2]), mode === 'line' ? 2.4 + LW * 2 : 2.4);
  ctx.stroke();
  for (const s of [-1, 1]) {
    const by = s * 3.4 * Math.abs(c);
    const sy = Math.max(0.3, Math.abs(c));
    ctx.save();
    ctx.translate(-10, by);
    ctx.scale(1, sy);
    ctx.rotate(s * -0.2);
    ctx.beginPath();
    ctx.moveTo(1.6, 0);
    ctx.bezierCurveTo(0.4, -3.8, -4.4, -3.6, -3.4, 0);
    ctx.bezierCurveTo(-4.4, 3.6, 0.4, 3.8, 1.6, 0);
    ctx.closePath();
    paint(ctx, a, mode, s * c > 0 ? BRASS[1] : BRASS[2], BRASS[3]);
    if (mode === 'fill') {
      ell(ctx, -1.2, 0, 1, 1);
      ctx.fillStyle = tone(a, BRASS[3], 0.5);
      ctx.fill();
    }
    ctx.restore();
  }
  ell(ctx, -7.4, 0, 1.5, 2);
  paint(ctx, a, mode, BRASS[1], BRASS[3]);
  if (mode === 'fill') glow(ctx, -8, -1, 3, BRASS[0], 0.5);
  ctx.restore();
}

// ---------- Her act and her fight ----------
const SWINGS = ['bop', 'twirl', 'kick'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.ghN ?? 0) % SWINGS.length]);
const READY = { shN: -50, elN: -70, hwN: -10, shF: -30, elF: -80, hwF: -10 };
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'gracious', look: [0.4, 0], turn: 0.4, sweat: -1, fx: null, keyRate: 1.6, mirror: 0, openN: 0, openF: 0, holdS: 1, sceptre: -0.3, cogs: 0 };
  a.ghQ = q;
  a.ghUid = (m.uid ?? 0) % 7;
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
  const freed = Boolean(m.cine?.freed);
  const alive = m.hp > 0 && !freed;
  const low = alive && m.hp / m.def.hp < 0.25;
  const phase = m.mech?.phase ?? 1;
  // ----- her casts (world/carnival.js) and her swings at the tank -----
  const cast = alive && m.cast && m.castPose ? m.cast : null;
  if (cast && st.ghCastT0 !== cast.t0) {
    st.ghCastT0 = cast.t0;
    st.ghMove = m.castPose;
  }
  const since = now - (m.attackAt ?? -9);
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.55);
  const winding = alive && !cast && m.windup > 0;
  if (winding && !(now - (st.ghWindAt ?? -9) < 0.25)) {
    st.ghN = (st.ghN ?? m.uid ?? 0) + 1;
    st.ghMove = pickSwing(m, st);
  }
  if (winding) st.ghWindAt = now;
  const struck = alive && since >= 0 && since < 1.1;
  const mv = cast ? st.ghMove : winding || struck ? (st.ghMove ??= SWINGS[0]) : null;
  const cu = cast ? clamp((now - cast.t0) / cast.dur, 0, 1) : 1;
  const ct = cast ? now - cast.t0 : 99;
  let W = 0;
  if (cast) W = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  else if (winding) W = clamp(1 - m.windup / total, 0, 1);
  const s = cast || winding ? -1 : since;
  const busy = !alive || Boolean(mv);
  if (busy) st.ghFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.ghFreeAt ?? -9)) / 0.35);
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;
  const over = alive && (phase >= 3 || (m.overwoundUntil ?? 0) > now);
  const runDown = alive && (m.vulnUntil ?? 0) > now && (m.runDownAt ?? -9) > now - 8;

  // Standing: a queen's poise, chin up, the sceptre held at her side, her tail curled.
  go({ shN: 10, elN: -50, hwN: -10, shF: -6, elF: -36, hwF: 10, tilt: -2, chest: -2 + breath * 0.5, head: -3 + Math.sin(t * 0.6) * 1.2, pelvis: 2 }, 1);
  if (walkW > 0.01) {
    const u = a.blkidU ?? a.wp ?? 0;
    add({ shN: Math.sin(u * TAU) * 9, shF: -Math.sin(u * TAU) * 9, head: -1, lift: Math.abs(Math.sin(u * TAU)) * 0.012 }, walkW);
    q.turn = mix(q.turn, 0.6, walkW);
  }
  if (fighting && !busy) {
    go({ ...READY, tilt: 3, head: 2 }, 0.85 * freeK);
    say(over ? 'cross' : 'focus');
    q.turn = 0.6;
    q.keyRate = 3;
  }
  if (over) {
    // overwound: her key whirring, a quick little tremble running through her
    q.keyRate = 9;
    add({ tilt: Math.sin(t * 23) * 0.8, head: Math.sin(t * 19) * 0.8 }, 1);
    q.steam = 1;
  }
  if (runDown && !mv) {
    // run down: drooping, her key barely turning
    const k = win(now - (m.runDownAt ?? now), 0, 0.5, 5.4, 6);
    go({ drop: 0.18, tilt: 12, head: 18, shN: 20, elN: -10, shF: 10, elF: -10 }, k);
    say('tired', k);
    q.keyRate = 0.25;
    q.sceptre = mix(-0.3, 0.9, k);
  }
  if (fighting && !st.ghHunt) st.ghBangAt = now;
  if (!fighting && st.ghHunt && alive) st.ghLostAt = now;
  st.ghHunt = fighting;
  q.bang = now - (st.ghBangAt ?? -9);
  q.huh = now - (st.ghLostAt ?? -9);
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // a gracious little bow, the sceptre flourished
    const k = win(gloat, 0, 0.25, 1.0, 1.4) * freeK;
    go({ tilt: 16, head: 10, shN: -100, elN: -20, shF: 30, elF: -20 }, k);
    say('gracious', k);
    q.fx = { kind: 'bow', u: gloat };
  }
  if (freed) {
    // wound down at last: she sits down where she stands, her paws in her lap
    st.ghFreedAt ??= now;
    const k = sstep((now - st.ghFreedAt) / 1.2);
    go({ drop: 0.82, tilt: 6, head: 10, shN: -20, elN: -80, shF: -10, elF: -80, fxN: 0.55, fyN: -0.1, fxF: 0.45, fyF: -0.08 }, k);
    q.mood = cineMood === 'sleep' ? 'sleepy' : cineMood === 'happy' ? 'delight' : 'tired';
    q.keyRate = cineMood === 'sleep' ? 0 : 0.35;
    q.holdS = 1 - k;
    q.turn = 0.3;
  } else if (m.hp <= 0) {
    st.ghDeadAt ??= now;
    go({ drop: 0.85, tilt: -10, head: 16, shN: 30, elN: -30, shF: 40, elF: -20, fxN: 0.5, fxF: 0.2 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.keyRate = 0;
    q.holdS = 0;
    q.fx = { kind: 'beaten', u: now - st.ghDeadAt };
  } else st.ghDeadAt = undefined;
  if (!freed) st.ghFreedAt = undefined;

  if (alive && mv) {
    q.keyRate = over ? 10 : 4;
    const snap = s >= 0 ? sstep(s / 0.14) : 0;
    const rel = s >= 0 ? 1 - sstep((s - 0.45) / 0.55) : 0;
    const hitK = snap * rel;
    const wu = sstep(W) * (1 - snap);
    const perf = cast ? sstep(ct / 0.35) : s >= 0 ? rel : 0;
    if (mv === 'bop') {
      go({ shN: -160, elN: -30, tilt: -6, head: -4, turnC: -0.3 }, wu);
      go({ shN: -40, elN: -10, tilt: 9, head: 4, x: 0.03, turnC: 0.3 }, hitK);
      q.sceptre = mix(-0.3, 1.2, hitK) - wu * 0.6;
      say(hitK > 0.2 ? 'cross' : 'focus');
      if (s >= 0 && s < 0.4) q.fx = { kind: 'bop', u: s };
    } else if (mv === 'twirl') {
      go({ drop: 0.08, tilt: 5, shN: -40, shF: -40 }, wu);
      go({ shN: -100, elN: -10, shF: -100, elF: -10, head: -4 }, hitK);
      q.mirror = s > 0.12 && s < 0.34 ? 1 : 0;
      q.tailWhip = hitK;
      say(hitK > 0.2 ? 'delight' : 'focus');
      if (s >= 0 && s < 0.5) q.fx = { kind: 'twirl', u: s / 0.5 };
    } else if (mv === 'kick') {
      go({ fxN: 0.1, fyN: -0.4, tilt: -6, ...READY }, wu);
      go({ fxN: 0.95, fyN: -0.6, tilt: -12, head: -4, x: 0.03, shN: 20, elN: -30, shF: -60 }, hitK);
      say(hitK > 0.2 ? 'cross' : 'focus');
      if (s >= 0 && s < 0.4) q.fx = { kind: 'kick', u: s };
    } else if (mv === 'toss') {
      // little cogs flicked up from both paws, again and again
      const b = Math.sin(now * 9);
      go({ shN: -70 + b * 20, elN: -90, shF: -70 - b * 20, elF: -90, head: -8 }, perf * (1 - wu));
      go({ shN: -165, elN: -10, shF: 140, elF: 16, tilt: -6, head: -10 }, Math.max(wu, hitK));
      q.cogs = perf * (1 - hitK);
      q.openN = q.openF = 1;
      say(hitK > 0.2 ? 'delight' : 'focus');
      q.look = [0.2, -1];
    } else if (mv === 'tap') {
      // the sceptre raised high, then brought down on the tank
      go({ shN: -170, elN: -10, tilt: -6, head: -6, shF: 20, elF: -40 }, Math.max(perf * 0.7, wu));
      go({ shN: -50, elN: -10, tilt: 14, head: 6, x: 0.04 }, hitK);
      q.sceptre = mix(-0.2, 1.3, hitK);
      say(hitK > 0.2 ? 'cross' : 'focus');
      if (s >= 0 && s < 0.5) q.fx = { kind: 'tap', u: s };
    } else if (mv === 'chime') {
      // her arms the clock's hands, sweeping round to noon
      const sweep = cast ? cu : 1;
      go({ shN: -60 - 110 * sstep(sweep), elN: -10, shF: 60 + 80 * sstep(sweep), elF: 10, head: -6 }, perf);
      go({ shN: -170, elN: -5, shF: 140, elF: 10, tilt: -4 }, Math.max(wu, hitK));
      say(hitK > 0.2 ? 'delight' : 'focus');
      if (s >= 0 && s < 0.8) q.fx = { kind: 'chime', u: s };
    } else if (mv === 'wind') {
      // she points to the holes; her key spins and spins
      go({ shN: -95, elN: -5, hwN: -10, tilt: -3, head: -4, shF: 20, elF: -50 }, perf);
      q.keyRate = 12;
      say('delight', perf);
      q.look = [0.8, 0.6];
      if (cast) q.fx = { kind: 'windup', u: ct };
    } else if (mv === 'melody') {
      // a music-box pirouette, arms in a crown, mirrored at each half turn (never squashed)
      go({ shN: -165, elN: -40, shF: 140, elF: 40, lift: 0.03, head: -6, fxF: -0.2, fyF: -0.25 }, perf);
      const spin = cast ? Math.floor(ct * 1.6) % 2 : 0;
      q.mirror = spin;
      say('delight', perf);
      if (cast) q.fx = { kind: 'melody', u: ct };
    } else if (mv === 'duet') {
      // paws clasped at her heart, a sway
      go({ shN: -70, elN: -110, shF: -60, elF: -110, head: 8, tilt: Math.sin(now * 3) * 4 }, perf * (1 - hitK));
      go({ shN: -150, elN: -10, shF: 140, elF: 10, head: -6 }, Math.max(wu, hitK));
      say(hitK > 0.2 ? 'delight' : 'gracious');
      q.look = [0.3, -0.5];
      if (cast) q.fx = { kind: 'duet', u: ct };
    } else if (mv === 'spring') {
      // a jolt as every spring in her lets go: arms flung up, up on her toes
      go({ drop: 0.15, tilt: 8, shN: -30, shF: -20 }, perf * (1 - Math.max(wu, hitK)));
      go({ shN: -170, elN: -5, shF: 150, elF: 5, lift: 0.05, head: -10 }, Math.max(wu, hitK));
      add({ hop: 0.12 * hitK }, 1);
      q.keyRate = 14;
      say(hitK > 0.2 ? 'startled' : 'focus');
      if (s >= 0 && s < 0.7) q.fx = { kind: 'spring', u: s };
    }
  }
  // ----- a phase moment (m.phaseAt): the Music Box (a pirouette), the Last Waltz (a brave flourish) -----
  {
    const pu = now - (m.phaseAt ?? -9);
    if (pu >= 0 && pu < 1.8 && !mv && alive) {
      const k = win(pu, 0, 0.25, 1.4, 1.8);
      go({ shN: -165, elN: -40, shF: 140, elF: 40, lift: 0.03, head: -8 }, k);
      q.mirror = pu > 0.5 && pu < 0.9 ? 1 : 0;
      say(phase >= 3 ? 'cross' : 'delight', k);
      q.fx = { kind: phase >= 3 ? 'waltz' : 'musicbox', u: pu };
    }
  }
  // ----- her entrance's acts and her farewell -----
  if (act && actU >= 0) {
    const d = act.dur ?? 1;
    const ka = win(actU, 0, 0.2, d - 0.1, d + 0.3);
    if (act.move === 'perform' && actU < d) {
      // pirouettes and bows, on and on, her key humming
      const c8 = actU % 4;
      const tw = win(c8, 0, 0.3, 1.3, 1.6);
      const bw = win(c8, 2, 2.4, 3.4, 3.9);
      go({ shN: -165, elN: -40, shF: 140, elF: 40, lift: 0.03, head: -6 }, tw * sstep(actU / 0.4));
      go({ tilt: 22, head: 14, shN: -90, elN: -20, shF: 40, elF: -30, fxF: -0.3 }, bw * sstep(actU / 0.4));
      q.mirror = c8 > 0.5 && c8 < 0.95 ? 1 : 0;
      q.keyRate = 9;
      q.mood = bw > 0.4 ? 'tired' : 'gracious';
    } else if (act.move === 'notice') {
      go({ tilt: -6, head: -10, shN: -40, elN: -60, shF: -20, elF: -60 }, ka);
      q.turn = 0.7;
      say('startled', ka);
    } else if (act.move === 'present') {
      go({ shN: -130, elN: -10, shF: 120, elF: 10, head: -8, tilt: -4 }, ka);
      say('delight', ka);
    } else if (act.move === 'selfwind' && actU < d + 0.3) {
      // she reaches back and cranks her own key, three great turns, a jolt at each
      const turns = clamp(actU / d, 0, 1) * 3;
      const jolt = Math.max(0, Math.sin(turns * Math.PI * 2 - 0.4)) ** 2;
      go({ shF: 150, elF: -80, hwF: -30, tilt: 6 + jolt * 4, head: 6 - jolt * 8, shN: -30, elN: -60, drop: 0.04 + jolt * 0.04 }, ka);
      q.keyKick = turns;
      q.keyRate = 0;
      say(jolt > 0.5 ? 'startled' : 'focus', ka);
      if (jolt > 0.6) q.fx = { kind: 'crank', u: (turns % 1) };
    } else if (act.move === 'windup') {
      go({ shN: -160, elN: -30, tilt: -6, shF: 30, elF: -40 }, ka);
      q.sceptre = -0.9;
      q.keyRate = 12;
      say('cross', ka);
    } else if (act.move === 'sway') {
      go({ tilt: Math.sin(actU * (act.speed ?? 3.5)) * 5, shN: -120, elN: -20, head: -4 }, ka);
      say('gracious', ka);
    } else if (act.move === 'fade') {
      // her last moment: one last tick of her key, then she curls up smaller and nods right off
      const k = sstep(actU / Math.max(0.5, d * 0.6));
      go({ drop: 0.86, tilt: 16, head: 26, shN: -30, elN: -100, shF: -20, elF: -100, fxN: 0.4, fxF: 0.3 }, k);
      q.keyKick = actU < 0.6 ? sstep(actU / 0.3) * 0.25 : 0.25;
      q.keyRate = 0;
      q.mood = 'sleepy';
      if (actU > 0.2 && actU < 1.4) q.fx = { kind: 'lasttick', u: actU - 0.2 };
    }
  }
  if (alive && !mv) {
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.ghCalm = mix(st.ghCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.ghCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, q, sstep(st.ghCalm), t, now, st);
    if (cineMood && !act) q.mood = { angry: 'cross', happy: 'delight', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low) {
      if (!cineMood) q.mood = q.mood === 'gracious' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking) q.mood = 'talk';
    if (hurt) q.mood = 'hurt';
  }
  if (freed && m.talking) q.mood = 'talk';
  q.turn = spring(st, 'ghTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.gracious;
  const f = (st.ghF ??= { ...FACES.gracious, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'bt', 'by', 'mw', 'ms', 'mo', 'bl', 'sm', 'dr']) f[k] = mix(f[k], tgt[k], k === 'lid' ? 1 - Math.exp(-dt * (tgt[k] > f[k] ? 40 : 18)) : kf);
  for (const sh of SHUTS) f.shut[sh] = mix(f.shut[sh], sh === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.ghF = f;
  st.ghMirror = q.mirror;
  // springs: ears, skirt, tail, sceptre, crown; her key, clock and cogs turning
  const kick = (st.ghLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.ghLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.ghLast = out.head;
  st.ghLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  const headR = (((out.head ?? 0) + (out.tilt ?? 0)) * Math.PI) / 180;
  q.earA = [0, 1].map((i) => spring(st, `ear${i}`, Math.sin(t * 1.2 + i * 2) * 0.04 + (q.mood === 'sad' || q.mood === 'tired' || q.mood === 'sleepy' ? (i ? 0.35 : -0.35) : 0), 100, 9, dt, kick * 0.01));
  q.skirt = [0, 1].map((i) => clamp(spring(st, `sk${i}`, -((out.tilt ?? 0) * Math.PI) / 180 * 0.3 + step * 0.06 + Math.sin(t * 1.5 + i) * 0.02 + (q.mirror ? 0.15 : 0), 110 - i * 10, 9, dt, kick * 0.01), -0.4, 0.4));
  const tw = q.tailWhip ?? 0;
  a.ghTail = [0, 1, 2, 3, 4, 5].map((i) => spring(st, `tl${i}`, [2.7, 2.4, 2.0, 1.4, 0.6, -0.3][i] - headR * 0.3 + Math.sin(t * 1.3 - i * 0.5) * 0.1 + step * 0.1 - tw * (0.4 + i * 0.15), 80 - i * 7, 7, dt, kick * 0.01));
  q.sceptreA = spring(st, 'scA', q.sceptre, 160, 16, dt);
  q.holdS = clamp(spring(st, 'hS', q.holdS, 160, 18, dt), 0, 1);
  q.crownA = clamp(spring(st, 'crA', 0, 120, 10, dt, kick * 0.004), -0.2, 0.2);
  st.ghKeyRate = mix(st.ghKeyRate ?? q.keyRate, q.keyRate, 1 - Math.exp(-dt * 3));
  st.ghKeyA = ((st.ghKeyA ?? (m.uid ?? 0) * 0.7) + st.ghKeyRate * dt) % (TAU * 100);
  q.keyA = st.ghKeyA + (q.keyKick ?? 0) * TAU;
  st.ghCog = ((st.ghCog ?? 0) + st.ghKeyRate * 0.12 * dt) % (TAU * 100);
  q.cogA = st.ghCog;
  // (her clock's hands: the minute hand ticks round in little eased steps, the hour hand creeps)
  const tick = Math.floor(t) + sstep((t % 1) / 0.15);
  q.minA = (tick / 60) * TAU * 4;
  q.hourA = (t / 3600) * TAU * 40 + 1.2;
  st.ghPin = ((st.ghPin ?? 0) + (2 + st.ghKeyRate * 0.6) * dt) % (TAU * 100);
  q.pinA = st.ghPin;
  st.ghWheel = ((st.ghWheel ?? 0) + walkW * 9 * dt) % (TAU * 100);
  q.wheelA = st.ghWheel;
  q.cogsK = spring(st, 'cogsK', q.cogs, 120, 14, dt);
  st.ghCogPh = ((st.ghCogPh ?? 0) + 1.8 * dt) % 1000;
  q.cogPh = st.ghCogPh;
  q.steamK = spring(st, 'stK', q.steam ?? 0, 60, 10, dt);
}
const PIECES = [
  { name: 'march', t0: 0.4, len: 6.6 },
  { name: 'pirouette', t0: 7.6, len: 6.4 },
  { name: 'rundown', t0: 14.6, len: 7.6 },
  { name: 'wave', t0: 23, len: 6.6 },
];
function idleAct(m, a, out, go, add, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.ghPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.ghPiece = cur.name;
      else return;
    }
  } else {
    st.ghPiece = null;
    return;
  }
  const u = lu - cur.t0;
  const at = (k) => k * w > 0.5;
  if (cur.name === 'march') {
    // a tick-tock march on the spot: knees up in turn, the sceptre shouldered, arms swinging
    const k = win(u, 0, 0.5, 6.1, 6.6);
    const ph = u * Math.PI * 1.6;
    const sN = Math.max(0, Math.sin(ph));
    const sF = Math.max(0, -Math.sin(ph));
    go({ fxN: 0.15 * sN, fyN: -0.32 * sN, fxF: 0.15 * sF, fyF: -0.32 * sF, shN: -120, elN: -60, shF: -Math.sin(ph) * 30, elF: -40, head: Math.sin(ph) * 3 }, k * w);
    if (at(k)) {
      q.sceptre = -0.1;
      q.mood = 'gracious';
      q.keyRate = 3;
    }
  } else if (cur.name === 'pirouette') {
    // a slow music-box pirouette, arms in a crown (the picture mirrored at its middle), then a curtsy
    const k = win(u, 0, 0.5, 5.9, 6.4);
    const tw = win(u, 0.4, 0.9, 2.4, 2.9);
    go({ shN: -165, elN: -40, shF: 140, elF: 40, lift: 0.03, head: -6, fxF: -0.2, fyF: -0.25 }, tw * k * w);
    const cs = win(u, 3.2, 3.7, 5.0, 5.6);
    go({ drop: 0.2, tilt: 10, head: 12, shN: -30, elN: -10, shF: -20, elF: -10, fxF: -0.35 }, cs * k * w);
    if (at(k)) {
      q.mirror = u > 1.4 && u < 1.9 ? 1 : 0;
      q.mood = cs > 0.3 ? 'gracious' : 'delight';
      if (u > 0.9 && u < 2.4) q.fx = { kind: 'musicbox', u: u - 0.9 };
    }
  } else if (cur.name === 'rundown') {
    // running down: she slows, droops, almost stops... and her key catches and jolts her upright
    const k = win(u, 0, 0.5, 7.1, 7.6);
    const droop = win(u, 0.5, 3.6, 4.6, 4.9);
    const jolt = win(u, 4.6, 4.75, 5.1, 6.2);
    go({ drop: 0.16, tilt: 14, head: 22, shN: 24, elN: -10, shF: 16, elF: -10 }, droop * k * w);
    go({ tilt: -6, head: -10, shN: -40, elN: -40, shF: -30, elF: -40, lift: 0.02 }, jolt * k * w);
    if (at(k)) {
      q.keyRate = mix(1.6, 0.1, droop) + jolt * 10;
      q.mood = jolt > 0.3 ? 'startled' : droop > 0.5 ? 'sleepy' : droop > 0.2 ? 'tired' : 'gracious';
      q.sceptre = mix(-0.3, 0.8, droop);
      if (u > 4.6 && u < 5.6) q.fx = { kind: 'catch', u: u - 4.6 };
    }
  } else {
    // a wave to her audience (Elder Kuri, always), then a curtsy
    const k = win(u, 0, 0.5, 6.1, 6.6);
    const wave = win(u, 0.4, 0.8, 2.8, 3.2);
    go({ shF: 140, elF: 40 + Math.sin(now * 9) * 22, hwF: -20, head: -4 }, wave * k * w);
    const cs = win(u, 3.6, 4.1, 5.4, 6);
    go({ drop: 0.2, tilt: 10, head: 12, shN: -30, elN: -10, shF: -20, elF: -10, fxF: -0.35 }, cs * k * w);
    if (at(k)) {
      q.mood = cs > 0.3 ? 'gracious' : 'delight';
      q.look = [0.9, -0.2];
    }
  }
}

// ---------- Her marks and effects (rig space, over everything) ----------
function bubble(ctx, x, y, mark, e, len, fl, t) {
  const inn = sstep(e / 0.18);
  const outK = 1 - sstep((e - len + 0.25) / 0.25);
  const k = inn * outK;
  if (k <= 0.01) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  ctx.scale(fl * k, k);
  // her marks sit on a little gold cog
  cogPath(ctx, 0, 0, 5.6, 8, t * 0.6, 0.16);
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#fff8e0';
  ctx.fill();
  pen(ctx, mark === '!' ? '#c8902c' : '#3a9a9c', 1);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#d8708e' : '#3a9a9c';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 0.4);
  } else {
    ctx.moveTo(-1.3, -1.7);
    ctx.quadraticCurveTo(-1.0, -3.3, 0.4, -3.1);
    ctx.quadraticCurveTo(1.8, -2.8, 1.2, -1.2);
    ctx.quadraticCurveTo(0.3, -0.5, 0.2, 0.5);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.2, 0.8, 0.8);
  ctx.fill();
  ctx.restore();
}
function swish(ctx, cx, cy, r, a0, a1, w, al, col = '#fff8f4', rim = '#d8708e') {
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
// A little brass cog (rig space), turning.
function cog(ctx, x, y, r, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  cogPath(ctx, x, y, r, 7, ang, 0.24);
  ctx.fillStyle = BRASS[1];
  ctx.fill();
  pen(ctx, BRASS[3], Math.max(0.35, r * 0.18));
  ctx.stroke();
  ell(ctx, x, y, r * 0.38, r * 0.38);
  ctx.fillStyle = BRASS[3];
  ctx.fill();
  ctx.restore();
}
// A coil spring (rig space), bouncing loose.
function coil(ctx, x, y, h, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const p = [x + Math.sin(u * TAU * 3) * 1.6, y - u * h];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.lineCap = 'round';
  pen(ctx, BRASS[3], 1.1);
  ctx.stroke();
  pen(ctx, BRASS[1], 0.6);
  ctx.stroke();
  ctx.restore();
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  for (const mode of ['line', 'fill']) {
    tail(ctx, a, mode, D);
    collar(ctx, a, mode, D);
    key(ctx, a, mode, D);
  }
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.ghQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -24]);
  const hd = headAt(a, D, [4, 0]);
  const hN = ptOf(a, D, 'handN', D.J.handN);
  const hF = ptOf(a, D, 'handF', D.J.handF);
  const kp = ptOf(a, D, 'chest', [D.J.stern[0] - 22, D.J.stern[1] + 7]);
  // steam from her key when she's overwound
  if (q.steamK > 0.02) {
    for (let i = 0; i < 3; i++) {
      const v = (t * 0.9 + i / 3) % 1;
      ctx.save();
      ctx.globalAlpha *= q.steamK;
      steam(ctx, kp[0] - 2 - v * 6, kp[1] - 2 - v * 10, 1.4 + v * 2, (1 - v) * 0.7);
      ctx.restore();
    }
  }
  // little cogs tossed up from her paws
  if (q.cogsK > 0.02) {
    const mid = [(hN[0] + hF[0]) / 2, Math.min(hN[1], hF[1])];
    for (let k = 0; k < 3; k++) {
      const ph = (q.cogPh + k / 3) % 1;
      cog(ctx, mid[0] + Math.cos(ph * TAU) * 6, mid[1] - 4 - 13 * Math.sin(Math.PI * ph) * q.cogsK, 1.8, ph * TAU * 2 + k, q.cogsK);
    }
  }
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0 && !m.cine) bubble(ctx, crown[0] + 4, crown[1] - 6, '!', q.bang, 1.1, fl, t);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0 && !m.cine) bubble(ctx, crown[0] + 4, crown[1] - 6, '?', q.huh, 1.4, fl, t);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  if (X.kind === 'bop' || X.kind === 'tap') {
    const k = clamp(u / (X.kind === 'tap' ? 0.5 : 0.35), 0, 1);
    swish(ctx, hd[0], hd[1] + 12, 17, -1.7 + k * 0.4, 0.3 + k * 0.4, 4, 1 - k);
    for (let i = 0; i < (X.kind === 'tap' ? 5 : 3); i++) star(ctx, hN[0] + 10 + Math.cos(i * 1.3 - 1.3) * (3 + k * 9), hN[1] + Math.sin(i * 1.3 - 1.3) * (3 + k * 6), 2 * (1 - k * 0.5), i, 1 - k * 0.6);
  } else if (X.kind === 'twirl') {
    const k = clamp(u, 0, 1);
    swish(ctx, 0, -18, 16, Math.PI * 0.2 + k * 3, Math.PI * 1.2 + k * 3, 3.4, Math.sin(Math.PI * k) * 0.8, '#fff8f4', '#f49ab4');
  } else if (X.kind === 'kick') {
    const fN = ptOf(a, D, 'footN', [D.J.ankN[0] + 6, D.J.ankN[1]]);
    const k = clamp(u / 0.35, 0, 1);
    swish(ctx, fN[0] - 7, fN[1] + 5, 10, -1.4, -1.4 + 1.6 * k, 3, 1 - k * 0.7);
    for (let i = 0; i < 3; i++) cog(ctx, fN[0] + 3 + Math.cos(i * 1.2 - 1) * (2 + k * 6), fN[1] + Math.sin(i * 1.2 - 1) * (2 + k * 5), 1.3, u * 6 + i, 1 - k);
  } else if (X.kind === 'chime') {
    if (u < 0.8) cue(ctx, 'BONG!', hd[0] + 20, hd[1] - 24, 7, fl, -0.12, '#8e6418', '#fff8e0');
    const v = clamp(u / 0.8, 0, 1);
    for (let i = 0; i < 12; i++) {
      const an = (i / 12) * TAU;
      sparkle(ctx, Math.cos(an) * (8 + v * 26), -20 + Math.sin(an) * (6 + v * 16), (i % 3 ? 1.2 : 2) * (1 - v), 1, i % 3 ? '#fff4c0' : '#ffd6e0');
    }
  } else if (X.kind === 'windup') {
    for (let i = 0; i < 2; i++) {
      const v = (u * 1.4 + i * 0.5) % 1;
      cog(ctx, kp[0] - 6 - v * 8, kp[1] - 6 - v * 12, 1.6, u * 8 + i, Math.sin(Math.PI * v));
    }
  } else if (X.kind === 'melody' || X.kind === 'musicbox' || X.kind === 'duet') {
    for (let i = 0; i < 3; i++) {
      const v = (u * 0.7 + i / 3) % 1;
      note(ctx, hd[0] - 10 + i * 9 + Math.sin(v * 6 + i) * 3, hd[1] - 10 - v * 18, 1.6, Math.sin(v * 4) * 0.3, Math.sin(Math.PI * v), i % 2 ? '#f49ab4' : '#5cc4c0');
    }
  } else if (X.kind === 'spring') {
    const v = clamp(u / 0.7, 0, 1);
    for (let i = 0; i < 4; i++) {
      const an = -Math.PI / 2 + (i - 1.5) * 0.6;
      coil(ctx, Math.cos(an) * (6 + v * 18), -28 + Math.sin(an) * (6 + v * 16), 5, 1 - v);
    }
    if (u < 0.7) cue(ctx, 'boing!', hd[0] + 18, hd[1] - 24, 7, fl, -0.12, '#8e6418', '#fff8e0');
  } else if (X.kind === 'waltz') {
    if (u < 1.4) cue(ctx, 'One more dance!', hd[0] + 24, hd[1] - 26, 7, fl, -0.1, '#8e6418', '#fff8e0');
    for (let i = 0; i < 3; i++) cog(ctx, hd[0] - 14 + i * 14, hd[1] - 20 - Math.sin(Math.PI * clamp(u / 1.4 + i * 0.1, 0, 1)) * 8, 1.8, u * 4 + i, Math.sin(Math.PI * clamp(u / 1.6, 0, 1)));
  } else if (X.kind === 'crank') {
    if (u < 0.4) cue(ctx, 'krrk!', kp[0] - 10, kp[1] - 12, 6, fl, 0.1, '#8e6418', '#fff8e0');
  } else if (X.kind === 'catch') {
    if (u < 0.8) cue(ctx, 'tick!', hd[0] + 16, hd[1] - 22, 6, fl, -0.12, '#8e6418', '#fff8e0');
    sparkle(ctx, kp[0] - 4, kp[1] - 4, 2.2 * Math.sin(Math.PI * clamp(u / 0.8, 0, 1)), 1, '#fff4c0');
  } else if (X.kind === 'lasttick') {
    if (u < 0.9) cue(ctx, 'tick...', kp[0] - 8, kp[1] - 14, 6, fl, 0.08, '#8e6418', '#fff8e0');
    sparkle(ctx, kp[0] - 4, kp[1] - 4, 2 * Math.sin(Math.PI * clamp(u / 1.2, 0, 1)), 1, '#fff4c0');
  } else if (X.kind === 'bow') {
    for (let i = 0; i < 3; i++) sparkle(ctx, hN[0] + 4 + i * 5, hN[1] - 8 - i * 3, 1.8 * Math.sin(Math.PI * clamp(u / 1.2, 0, 1)), 1, i % 2 ? '#ffd6e0' : '#fff4c0');
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] + 6, 9, t, 3);
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.4, 0.6 * (1 - u / 0.6), '#fff8f0', '#e6d0c0');
  }
}

const DRESS = {
  id: 'gearheart',
  // (the skin is her painted cream enamel; her dress is cut over it from the same outline)
  skin: { lt: TIN[0], base: TIN[1], sh: TIN[2], deep: TIN[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => bodice(ctx, a, mode, D),
    legF: (ctx, a, mode, S, D) => tights(ctx, a, mode, D, 'F'),
    legN: (ctx, a, mode, S, D) => tights(ctx, a, mode, D, 'N'),
    handFskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => sceptre(ctx, a, mode, D),
    handNskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('tinmouse', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  // (a pirouette: the picture mirrored for its middle beat, never squashed)
  if (a.mo?.rig?.ghMirror) ctx.scale(-1, 1);
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.35);
export const GEARHEART_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [100, 180, 300, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const GEARHEART_SIZE = { w: 48, h: Math.round(R.H * BIG * 1.05), speed: Math.round(R.speed * BIG) };
