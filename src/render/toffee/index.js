// Toffee, the Caramel Smith, on screen (2026-11-27, redrawn from scratch: the Caramel Forge's smith, her
// story, lines and role kept; world/volcano.js her new fight). A chubby caramel salamander, the forge's
// smith since forever: salamanders live in fire, so the forge is the comfiest room on the island for
// her. Cheerful, loud, a show-off with her hammer, never mean: she just loves to test things on things.
// She moves on her own copy of the creature base (rig.js; body.js `salamander`: a round barrel of a body
// on short sturdy legs), dressed here; her head, face, tail, clothes, hammer and anvil drawn here from
// scratch (never the shared face, nothing of the hero's).
//   look    glossy caramel-amber skin, a cream throat, darker toffee "drizzle" markings poured over the
//           back of her head and down her tail in soft round drips; a wide flat salamander head with
//           her eyes up on two round domes; a mint work shirt with rolled sleeves (cut from her own
//           outline), a cocoa leather smith's apron (bib, pocket with a striped rag, short skirt that
//           swings on its own), a cherry neckerchief knotted at her throat (its two tails sprung), one
//           big leather gauntlet on her hammer hand, bare round salamander toes. Her signature: her
//           hammer's head is a block of hard-crack caramel, glassy amber in brass bands, a soft drip
//           hanging under it; and she carries her little anvil on her back like a rucksack (the apron's
//           straps), the horn poking out behind her.
//   eyes    her own "forge-glass" eyes, set high on her head's two domes: round below, a gentle arch
//           above, a mint-teal iris (deep teal at the top to pale mint below) with the forge's warm
//           amber glow along its lower rim, a round pupil, a big round glint and a little rounded
//           window-shaped glint (the forge's window); a chocolate lash line with a soft wing and one
//           round flick; round cocoa brows. Faces: cheery (rest), grin (^ ^), proud, focus, fierce,
//           shout, startled, hurt, dizzy, sad, worried, cross, sleepy, puff (cheeks full, blowing),
//           yum (eyes shut, tongue out), smug, talking (vowel mouths); every change eased.
//   idle    a 30 s act in pieces (only one she has time for): huffing on her hammer's head and
//           polishing it on her apron, then winking at herself in it; pulling a strand of caramel
//           off it, stretching it long and eating it; chewing, blowing an amber caramel bubble that
//           pops on her nose; practice taps of the hammer on the floor, each with a little splash.
//   walk    a chubby plod, the hammer swinging low at her side, her tail swaying, apron and
//           neckerchief tails swinging.
//   fight   between casts her swings at the tank in turn: Bonk (over her head and down), Scoop (a low
//           underhand swing flinging caramel), Tail Swat (a turn and a sweep of her heavy tail). Her
//           casts (m.castPose, world/volcano.js): strike (Hot Off the Anvil: the hammer raised high in
//           both hands, then down on the tank), drizzle (Caramel Drizzle: the hammer twirled over her
//           head flinging caramel up), glass (Sugar Glass: cheeks puffed, blowing a great pane of
//           sugar glass), quench (Quench!: a crouch and the hammer driven into the floor, steam all
//           round), toss (Anvil Toss: the anvil off her back, heaved overhead and thrown), ring (Ring
//           the Anvil: a scoop that flings a hot caramel ball at her anvil), reel (Taffy Pull: a strand
//           of taffy hooked on her anvil, pulled hand over hand, leaning back), crack (Hard Crack!:
//           the hammer swung high and slammed down with everything). Phase moments (m.phaseAt): Hard
//           Ball (she knocks on her anvil and grins), Hard Crack (a fierce shout, hammer flung up).
//   scenes  her entrance (volcano_toffee): 'forge' (at her anvil on the floor, hammering a glowing
//           bar), 'heave' (the anvil swung up onto her back), 'windup', 'attack', 'sway'.
//   marks   all her own (`ownEmotes`): a "!" and a "?" in a little caramel drop, a happy "mm!" after
//           landing a hit, a sweat drop when low, dizzy sparks when beaten (sat on her tail).
// Every effect is drawn live in her own style: caramel drops and ribbons, warm sparks (soft four-point
// sparkles, never specks), steam puffs, sugar-glass glints.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, dust, steam, sweat, cue, spring, hash } from './fx.js';

const BIG = 2.25;
const LW = 1.6 / BIG;
// ---------- Her colours ----------
const INK = '#9a4e22';
const SKIN = ['#ffd08a', '#f6a24e', '#e0823a', '#b4602a'];
const CREAM = ['#fff6dc', '#ffe6b4', '#f4cc8c'];
const DRIZ = ['#e09050', '#b8622c', '#8a4420'];
const MINT = ['#d8fff0', '#8ee0c8', '#5ab8a2', '#3a8a7a'];
const MINT_INK = '#2e7266';
const LEATH = ['#b07a52', '#8a5636', '#6a3e26', '#4e2c1c'];
const LEATH_INK = '#5a3420';
const RED = ['#ff9a9a', '#e8505a', '#b8303e'];
const BRASS = ['#fff0b0', '#f0c860', '#c49234', '#8a6420'];
const IRON = ['#b4b8d4', '#8c90b2', '#6a6e92', '#50547a'];
const CARA = ['#fff2c0', '#ffc860', '#e8902c', '#b4601c'];
const WOOD = ['#e8b880', '#c48a56', '#9a6236'];
const IRIS = ['#c8fff0', '#6ad8c0', '#2a9a8e', '#14555a'];
const LASH = '#4a2614';

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
const HO = [1.4, -17.6];
const HS = 1.55;
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
// lid (closed eyes only), shut (which closed shape), wink (her near eye alone), bt/by (brows' tilt and
// raise), mw/ms/mo (mouth width, smile, openness), tg (tongue), bl (blush), sm (small irises), pf
// (cheeks puffed).
const FACES = {
  cheery: { lid: 0, shut: 'happy', wink: 0, bt: 0.1, by: 0.25, mw: 1, ms: 0.6, mo: 0, tg: 0, bl: 0.5, sm: 0, pf: 0 },
  grin: { lid: 1, shut: 'happy', wink: 0, bt: -0.15, by: 0.7, mw: 1.2, ms: 1, mo: 0.5, tg: 0.3, bl: 0.85, sm: 0, pf: 0 },
  proud: { lid: 1, shut: 'happy', wink: 0, bt: 0.2, by: 0.6, mw: 1.05, ms: 0.85, mo: 0, tg: 0, bl: 0.6, sm: 0, pf: 0 },
  smug: { lid: 0, shut: 'happy', wink: 1, bt: 0.35, by: 0.4, mw: 1, ms: 0.75, mo: 0.1, tg: 0, bl: 0.6, sm: 0, pf: 0 },
  focus: { lid: 0, shut: 'happy', wink: 0, bt: 0.5, by: -0.1, mw: 0.8, ms: 0.15, mo: 0, tg: 0, bl: 0.4, sm: 0.1, pf: 0 },
  fierce: { lid: 0, shut: 'happy', wink: 0, bt: 0.95, by: -0.5, mw: 1.05, ms: -0.4, mo: 0.32, tg: 0, bl: 0.5, sm: 0.15, pf: 0 },
  shout: { lid: 0, shut: 'happy', wink: 0, bt: 0.9, by: 0.2, mw: 1.25, ms: 0.3, mo: 1.2, tg: 0.4, bl: 0.7, sm: 0.25, pf: 0 },
  startled: { lid: 0, shut: 'happy', wink: 0, bt: -0.3, by: 1.2, mw: 0.6, ms: 0, mo: 0.6, tg: 0, bl: 0.6, sm: 0.6, pf: 0 },
  hurt: { lid: 1, shut: 'squeeze', wink: 0, bt: -0.8, by: 0.2, mw: 0.9, ms: -0.6, mo: 0.55, tg: 0, bl: 0.7, sm: 0, pf: 0 },
  dizzy: { lid: 1, shut: 'dizzy', wink: 0, bt: -0.5, by: 0.3, mw: 0.8, ms: -0.2, mo: 0.4, tg: 0.5, bl: 0.5, sm: 0, pf: 0 },
  sad: { lid: 0, shut: 'happy', wink: 0, bt: -0.95, by: 0.3, mw: 0.8, ms: -0.6, mo: 0, tg: 0, bl: 0.4, sm: 0.15, pf: 0 },
  worried: { lid: 0, shut: 'happy', wink: 0, bt: -0.8, by: 0.5, mw: 0.8, ms: -0.35, mo: 0.15, tg: 0, bl: 0.5, sm: 0.1, pf: 0 },
  cross: { lid: 0, shut: 'happy', wink: 0, bt: 0.95, by: -0.4, mw: 0.85, ms: -0.45, mo: 0.05, tg: 0, bl: 0.45, sm: 0.1, pf: 0.4 },
  sleepy: { lid: 1, shut: 'sleep', wink: 0, bt: -0.2, by: -0.1, mw: 0.6, ms: 0.15, mo: 0.1, tg: 0, bl: 0.5, sm: 0, pf: 0 },
  puff: { lid: 0, shut: 'happy', wink: 0, bt: 0.3, by: 0.3, mw: 0.35, ms: 0, mo: 0.25, tg: 0, bl: 0.9, sm: 0, pf: 1 },
  yum: { lid: 1, shut: 'happy', wink: 0, bt: -0.3, by: 0.7, mw: 1, ms: 0.9, mo: 0.35, tg: 1, bl: 0.9, sm: 0, pf: 0 },
  talk: { lid: 0, shut: 'happy', wink: 0, bt: 0.1, by: 0.4, mw: 0.95, ms: 0.4, mo: 0.4, tg: 0, bl: 0.55, sm: 0, pf: 0 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.7, 0.1, 0.8], [1.15, 0.4, 0.55], [0.95, 0.3, 0.25], [0.75, 0.2, 0], [0.85, 0.2, 0.6]];
const EYE = { w: 3.4, h: 3.7 };

function closedLine(ctx, a, x, y, side, s, t) {
  const { w, h } = EYE;
  pen(ctx, tone(a, LASH), 1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (s === 'happy') {
    ctx.moveTo(x - w, y + 1);
    ctx.quadraticCurveTo(x, y - h * 1.05, x + w, y + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + side * w, y + 1);
    ctx.quadraticCurveTo(x + side * (w + 0.8), y + 0.5, x + side * (w + 1.2), y - 0.3);
    ctx.stroke();
    return;
  }
  if (s === 'sleep') {
    ctx.moveTo(x - w, y + 0.2);
    ctx.quadraticCurveTo(x, y + h * 0.55, x + w, y);
    ctx.quadraticCurveTo(x + side * (w + 0.8), y - 0.2, x + side * (w + 1.1), y - 1);
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
// Her eye on its dome: round below, a gentle arch above; mint-teal iris with the forge's amber glow along
// its lower rim, a round pupil, a big round glint and a little window-shaped glint.
function eye(ctx, a, x, y, side, f, look) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.tfUid ?? 0) * 0.83) % 6.1, 5.6, 5.7, 5.78, 5.92) : 0;
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
  // a soft peach wash on the dome above the eye
  glow(ctx, x + side * 0.4, y - h * 0.9, 3.8, '#ffb08a', 0.32);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(x - w, y - 0.3);
    ctx.bezierCurveTo(x - w * 0.8, y - h * 1.12, x + w * 0.8, y - h * 1.12, x + w, y - 0.3);
    ctx.bezierCurveTo(x + w * 1.04, y + h * 1.1, x - w * 1.04, y + h * 1.1, x - w, y - 0.3);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = tone(a, '#fffdf6');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.3 * f.sm;
  const ix = x + side * 0.15 + (look?.[0] ?? 0) * 0.75;
  const iy = y + 0.4 + (look?.[1] ?? 0) * 0.55;
  const ir = [2.6 * small, 2.95 * small];
  const g = ctx.createLinearGradient(0, iy - ir[1], 0, iy + ir[1]);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.45, tone(a, IRIS[2]));
  g.addColorStop(0.85, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#0e3a3e', 0.85), 0.4);
  ctx.stroke();
  // the forge's warm glow along the lower rim of the iris
  ctx.save();
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(ix, iy + 0.2, ir[0] * 0.86, ir[1] * 0.86, 0, 0.35, Math.PI - 0.35);
  pen(ctx, tone(a, '#ffc070', 0.85), 0.75);
  ctx.stroke();
  ctx.restore();
  ell(ctx, ix, iy + 0.1, 1.15 * small, 1.35 * small);
  ctx.fillStyle = tone(a, '#0c3036');
  ctx.fill();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.3);
  sg.addColorStop(0, 'rgba(120,60,30,0.3)');
  sg.addColorStop(1, 'rgba(120,60,30,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.2, w * 2.6, h * 0.9);
  // the glints: a big round one up at the back, the forge's little window lower down at the front
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - side * 0.9, iy - 1.25 * small, 1.0, 0.95);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(ix + side * 0.55 - 0.45, iy + 0.35 * small, 0.9, 0.75, 0.3);
  ctx.fillStyle = 'rgba(255,252,236,0.92)';
  ctx.fill();
  if (L > 0.01) {
    ctx.fillStyle = tone(a, SKIN[1]);
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
  // the lash line along the arch: thin at the inner corner, fuller to a soft wing, one round flick
  const inner = [x - side * w, y - 0.3];
  const outer = [x + side * w, y - 0.3];
  const top = (u) => {
    const px = mix(inner[0], outer[0], u);
    return [px, y - 0.3 - h * 1.0 * Math.sin(Math.PI * (0.06 + u * 0.88)) + 0.2];
  };
  const N = 12;
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(top(i / N));
  const wing = [outer[0] + side * 1.5, outer[1] - 1.1];
  ctx.beginPath();
  pts.forEach((p, i) => {
    const th = 0.18 + 0.6 * (i / N) ** 1.4;
    if (!i) ctx.moveTo(p[0], p[1] - th);
    else ctx.lineTo(p[0], p[1] - th);
  });
  ctx.quadraticCurveTo(outer[0] + side * 1.1, outer[1] - 1.2, wing[0], wing[1]);
  ctx.quadraticCurveTo(outer[0] + side * 0.5, outer[1] - 0.1, pts[N][0], pts[N][1] + 0.3);
  for (let i = N; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 0.14 + 0.34 * (i / N) ** 1.4);
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  pen(ctx, tone(a, LASH), 0.6);
  ctx.lineCap = 'round';
  const p = top(0.82);
  const an = side > 0 ? -1.2 : Math.PI + 1.2;
  ctx.beginPath();
  ctx.moveTo(p[0], p[1] - 0.3);
  ctx.quadraticCurveTo(p[0] + Math.cos(an) * 0.8, p[1] - 0.3 + Math.sin(an) * 0.8, p[0] + Math.cos(an + side * 0.4) * 1.4, p[1] - 0.3 + Math.sin(an + side * 0.4) * 1.4);
  ctx.stroke();
  // the dome's crease above it
  pen(ctx, tone(a, SKIN[3], 0.45), 0.4);
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.6, y - h * 1.32);
  ctx.quadraticCurveTo(x + side * 0.3, y - h * 1.5, x + side * w * 0.95, y - h * 1.15);
  ctx.stroke();
  ctx.restore();
}
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.by * 1.0);
  // (cross = her inner end low: the far brow turns one way, the near one the other)
  ctx.rotate(-side * f.bt * 0.6);
  ctx.beginPath();
  ctx.moveTo(-1.5, 0.25);
  ctx.quadraticCurveTo(0, -0.7, 1.5, 0.2);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, '#7a3e1c'), 1.15);
  ctx.stroke();
  ctx.restore();
}
// Her wide salamander smile, centred under her eyes: one smooth line whose corners curl up; opens wide
// (a soft D) for a shout, a little pink tongue for yum.
function mouth(ctx, a, x, y, f) {
  const w = 4.4 * f.mw;
  const cy = y - f.ms * (f.ms < 0 ? 1.4 : 0.5);
  if (f.mo > 0.08) {
    const o = f.mo;
    const sm = Math.max(0, f.ms);
    // (a soft D: the top a gentle curve, the bottom deeper; rebuilt for its rim after the tongue)
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x - w, cy);
      ctx.quadraticCurveTo(x, cy + 0.4 + sm * 0.7 + Math.min(0, f.ms) * 1.8, x + w, cy);
      ctx.quadraticCurveTo(x, cy + 1.4 + o * 3.4 + sm * 0.9 + Math.min(0, f.ms) * 1.2, x - w, cy);
      ctx.closePath();
    };
    path();
    ctx.fillStyle = tone(a, '#8a2a2a');
    ctx.fill();
    ctx.save();
    path();
    ctx.clip();
    ell(ctx, x + 0.3, cy + 1.2 + o * 2.8 + sm * 0.6, w * 0.55, o * 1.1 + f.tg * 0.5);
    ctx.fillStyle = tone(a, '#ff8a8a');
    ctx.fill();
    ctx.restore();
    path();
    pen(ctx, tone(a, '#6a2418'), 0.5);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, '#6a2a18'), 0.62);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - w, cy - 0.5);
    ctx.quadraticCurveTo(x - w * 0.45, y + 0.6 + f.ms * (f.ms < 0 ? 1 : 0.35), x, y + 0.2 + f.ms * (f.ms < 0 ? 0.5 : 0.5));
    ctx.quadraticCurveTo(x + w * 0.45, y + 0.6 + f.ms * (f.ms < 0 ? 1 : 0.35), x + w, cy - 0.7);
    ctx.stroke();
    // (the corners curl as part of the line)
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + s * w, cy - (s > 0 ? 0.7 : 0.5));
      ctx.quadraticCurveTo(x + s * (w + 0.5), cy - 0.9 - f.ms * 0.4, x + s * (w + 0.4), cy - 1.4 - f.ms * 0.4);
      ctx.stroke();
    }
  }
  if (f.tg > 0.05 && f.mo <= 0.08) {
    ctx.beginPath();
    ctx.moveTo(x + 0.4, y + 0.5);
    ctx.quadraticCurveTo(x + 1.5, y + 0.6 + 2.4 * f.tg, x + 2.6, y + 0.5);
    ctx.closePath();
    ctx.fillStyle = tone(a, '#ff8a9a', f.tg);
    ctx.fill();
  }
}
const SKX = 15.4;
const SKY = 11;
const domeN = (tx) => [6.2 + tx, -8.2, 6];
const domeF = (tx) => [-5.6 + tx * 0.7, -8.4, 5.5];
function skullPath(ctx, tx) {
  ctx.beginPath();
  ctx.ellipse(tx * 0.3, 0, SKX, SKY, 0, 0, TAU);
  for (const [x, y, r] of [domeN(tx), domeF(tx)]) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
}
// The caramel "drizzle" poured over the back of her head: a darker cap whose edge runs in a soft
// diagonal down behind her far eye, three rounded drips hanging from it (one shape, joined).
function drizzleCap(ctx, a, tx) {
  const o = tx * 0.3;
  const P0 = [-2 + o, -13];
  const C = [-11 + o, -8.6];
  const P1 = [-19 + o, 3];
  const at = (t) => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * C[0] + t * t * P1[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * C[1] + t * t * P1[1]];
  const pts = [[-30, -24], [P0[0], -24]];
  const drips = [[0.3, 3.4], [0.55, 4.6], [0.8, 3]];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    pts.push(at(t));
    for (const [td, L] of drips) {
      if (Math.abs(t - td) < 0.026) {
        const B = at(td);
        const B2 = at(td + 0.04);
        const tg = [B2[0] - B[0], B2[1] - B[1]];
        const n = Math.hypot(...tg) || 1;
        const u = [tg[0] / n, tg[1] / n];
        pts.push([B[0] - u[0] * 1.1, B[1] + L * 0.55], [B[0] + u[0] * 0.1, B[1] + L], [B[0] + u[0] * 1.3, B[1] + L * 0.5]);
      }
    }
  }
  pts.push([-30, 8]);
  poly(ctx, chaikin(pts, 2));
  ctx.fillStyle = tone(a, DRIZ[1]);
  ctx.fill();
  ell(ctx, -12 + o, -9.4, 3.2, 1, 0.55);
  ctx.fillStyle = tone(a, DRIZ[0], 0.8);
  ctx.fill();
}
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.tfQ ?? {};
  const f = a.tfF;
  const turn = q.turn ?? 0.4;
  const tx = turn * 2.4;
  skullPath(ctx, tx);
  paint(ctx, a, mode, SKIN[1]);
  if (mode === 'fill' && f) {
    ctx.save();
    skullPath(ctx, tx);
    ctx.clip();
    glow(ctx, tx * 0.5, -6, 13, SKIN[0], 0.9);
    glow(ctx, -12, 5, 9, SKIN[2], 0.55);
    drizzleCap(ctx, a, tx);
    // a cream throat and jaw
    ell(ctx, tx * 0.7 + 1, 9.4, 12.5, 5);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, tx + 2, 8, 5, CREAM[0], 0.8);
    // the domes catch the light
    for (const [x, y, r] of [domeN(tx), domeF(tx)]) glow(ctx, x - 0.8, y - r * 0.55, r * 0.7, SKIN[0], 0.7);
    // a gloss streak across her brow (glossy salamander skin)
    ell(ctx, tx * 0.6 + 1, -4.4, 4.2, 0.8, -0.08);
    ctx.fillStyle = 'rgba(255,246,220,0.55)';
    ctx.fill();
    ctx.restore();
    const mx = 0.5 + tx * 0.85;
    for (const [cx, s] of [[domeF(tx)[0] - 0.6, 0.85], [domeN(tx)[0] + 0.4, 1]]) {
      ell(ctx, cx, -1.4, 2.6, 1.4);
      ctx.fillStyle = tone(a, '#ff7a7a', (0.25 + 0.45 * f.bl) * s);
      ctx.fill();
    }
    // puffed cheeks: round, either side of her mouth
    if (f.pf > 0.02) {
      for (const s of [-1, 1]) {
        ell(ctx, mx + s * 5.6, 3.6, 3.4 * f.pf, 3 * f.pf);
        ctx.fillStyle = tone(a, SKIN[1]);
        ctx.fill();
        glow(ctx, mx + s * 5.6 - 0.6, 2.6, 2.4 * f.pf, SKIN[0], 0.8);
        ell(ctx, mx + s * 5.6, 3.8, 2 * f.pf, 1.2 * f.pf);
        ctx.fillStyle = tone(a, '#ff8a8a', 0.4 * f.pf);
        ctx.fill();
      }
    }
    eye(ctx, a, domeF(tx)[0], domeF(tx)[1] + 0.9, -1, f, q.look);
    eye(ctx, a, domeN(tx)[0], domeN(tx)[1] + 0.9, 1, f, q.look);
    brow(ctx, a, domeF(tx)[0] - 0.2, domeF(tx)[1] - 4.2, -1, f);
    brow(ctx, a, domeN(tx)[0] + 0.2, domeN(tx)[1] - 4.5, 1, f);
    // her nostrils: two little soft curved dashes
    pen(ctx, tone(a, SKIN[3], 0.75), 0.42);
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(mx + s * 1.3 - 0.4, -0.6);
      ctx.quadraticCurveTo(mx + s * 1.3, -0.1, mx + s * 1.3 + 0.4, -0.6);
      ctx.stroke();
    }
    mouth(ctx, a, mx, 4, f);
    if (q.sweat >= 0) sweat(ctx, -13, -6 + q.sweat * 3, 1.1);
  }
  WK = 1;
  ctx.restore();
}

// ---------- Her clothes ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
// The mint work shirt, cut from her own outline; the leather bib apron over it (its straps over her
// shoulders: they hold her anvil too), a pocket with a striped rag tucked in.
function shirt(ctx, a, mode, D) {
  if (mode !== 'fill') return;
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
  ctx.fillStyle = tone(a, MINT[1]);
  ctx.fillRect(-80, -120, 160, 140);
  const sh = C([st[0] - 14, st[1] + 18]);
  glow(ctx, sh[0], sh[1], 9, MINT[3], 0.45);
  const lt = C([st[0] + 8, st[1] + 6]);
  glow(ctx, lt[0], lt[1], 7, MINT[0], 0.6);
  // the shirt's V at her throat: cream skin showing
  poly(ctx, chaikin([C([st[0] - 6, st[1] - 3]), C([st[0] + 8, st[1] - 3]), C([st[0] + 1.4, st[1] + 6])], 1));
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  // the bib: from her chest down over her tummy, the skirt below it (drawn on its own)
  const bib = chaikin([C([st[0] - 9, st[1] + 6]), C([st[0] + 12, st[1] + 6]), T([hp[0] + 14, hp[1] + 2]), T([hp[0] - 11, hp[1] + 2])], 1);
  poly(ctx, bib);
  ctx.fillStyle = tone(a, LEATH[1]);
  ctx.fill();
  ctx.save();
  poly(ctx, bib);
  ctx.clip();
  const bl = C([st[0] + 4, st[1] + 10]);
  glow(ctx, bl[0], bl[1], 6, LEATH[0], 0.6);
  const bs = T([hp[0] - 8, hp[1] - 2]);
  glow(ctx, bs[0], bs[1], 6, LEATH[3], 0.4);
  // stitching along its top edge
  ctx.setLineDash([0.7, 0.8]);
  ctx.beginPath();
  ctx.moveTo(...C([st[0] - 8, st[1] + 7.6]));
  ctx.lineTo(...C([st[0] + 11, st[1] + 7.6]));
  pen(ctx, tone(a, LEATH[0], 0.9), 0.3);
  ctx.stroke();
  ctx.setLineDash([]);
  // the pocket, a striped rag tucked in it
  const pk = [T([hp[0] - 2, hp[1] - 9]), T([hp[0] + 9, hp[1] - 9]), T([hp[0] + 8.4, hp[1] - 2]), T([hp[0] - 1.4, hp[1] - 2])];
  const rag = chaikin([T([hp[0] + 0.5, hp[1] - 9]), T([hp[0] + 2, hp[1] - 13.4]), T([hp[0] + 5, hp[1] - 14]), T([hp[0] + 6.4, hp[1] - 9])], 1);
  poly(ctx, rag);
  ctx.fillStyle = tone(a, '#fff4f0');
  ctx.fill();
  ctx.save();
  poly(ctx, rag);
  ctx.clip();
  for (let k = 0; k < 3; k++) {
    const p0 = T([hp[0] - 1, hp[1] - 10 - k * 1.6]);
    const p1 = T([hp[0] + 8, hp[1] - 11 - k * 1.6]);
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.lineTo(...p1);
    pen(ctx, tone(a, RED[1]), 0.55);
    ctx.stroke();
  }
  ctx.restore();
  poly(ctx, chaikin(pk, 1));
  ctx.fillStyle = tone(a, LEATH[2]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(...pk[0]);
  ctx.lineTo(...pk[1]);
  pen(ctx, tone(a, LEATH[0], 0.8), 0.35);
  ctx.stroke();
  ctx.restore();
  // the straps up over her shoulders
  for (const [x0, x1] of [[st[0] - 7.6, st[0] - 12], [st[0] + 10.6, st[0] + 15]]) {
    ctx.beginPath();
    ctx.moveTo(...C([x0, st[1] + 7]));
    ctx.lineTo(...C([x1, st[1] - 6]));
    ctx.lineCap = 'round';
    pen(ctx, tone(a, LEATH[2]), 2.2);
    ctx.stroke();
    ell(ctx, ...C([x0, st[1] + 7.2]), 0.75, 0.75);
    ctx.fillStyle = tone(a, BRASS[1]);
    ctx.fill();
  }
  ctx.restore();
}
// The apron's skirt: one leather panel hung from her waist, swinging on its own (a short one: her legs
// show under it), its hem rounded.
function apronSkirt(ctx, a, mode, D) {
  const q = a.tfQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'torso');
  const hp = D.J.hip;
  ctx.translate(hp[0] + 1.6, hp[1] + 1);
  ctx.rotate(q.apron ?? 0);
  const pts = chaikin([[-12.4, -1.6], [14.4, -1.6], [15.8, 11.4], [9, 13.6], [0.5, 14], [-7.6, 13.4], [-13.8, 11]], 2);
  poly(ctx, pts);
  paint(ctx, a, mode, LEATH[1], LEATH_INK);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    glow(ctx, 4, 3, 9, LEATH[0], 0.5);
    glow(ctx, -11, 10, 7, LEATH[3], 0.5);
    // a soft fold
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(-4, 7, -2.6, 13.6);
    pen(ctx, tone(a, LEATH[2], 0.7), 0.8);
    ctx.stroke();
    ctx.setLineDash([0.7, 0.8]);
    ctx.beginPath();
    ctx.moveTo(-12.6, 10.4);
    ctx.quadraticCurveTo(1, 13, 14.8, 10.6);
    pen(ctx, tone(a, LEATH[0], 0.9), 0.3);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  ctx.restore();
}
// The cherry neckerchief knotted at her throat, its two tails sprung.
function kerchief(ctx, a, mode, D) {
  const q = a.tfQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const tl = q.kerch ?? [0, 0];
  for (let i = 1; i >= 0; i--) {
    const root = [st[0] + 3 + i * 1.6, st[1] + 1.4];
    const b = Math.PI / 2 - 0.3 + i * 0.5 + tl[i];
    const pts = chain(root, [b, b + 0.2 + tl[i] * 0.4], [4.4, 4]);
    poly(ctx, tube(pts, [3.2, 3.6, 2.8], 0.5));
    paint(ctx, a, mode, i ? RED[2] : RED[1], RED[2]);
  }
  const band = chaikin([[st[0] - 11, st[1] - 3.4], [st[0] - 2, st[1] - 0.6], [st[0] + 10, st[1] - 3], [st[0] + 9.6, st[1] + 0.6], [st[0] + 3.6, st[1] + 3], [st[0] - 4, st[1] + 2.4], [st[0] - 11.4, st[1] - 0.6]], 2);
  poly(ctx, band);
  paint(ctx, a, mode, RED[1], RED[2]);
  ell(ctx, st[0] + 3.6, st[1] + 1.4, 2.3, 2);
  paint(ctx, a, mode, RED[1], RED[2]);
  if (mode === 'fill') {
    ell(ctx, st[0] + 2.8, st[1] + 0.8, 1, 0.6, -0.3);
    ctx.fillStyle = tone(a, RED[0], 0.8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(st[0] - 9, st[1] - 2.2);
    ctx.quadraticCurveTo(st[0] - 2, st[1] + 0.8, st[0] + 8, st[1] - 1.8);
    pen(ctx, tone(a, '#fff0f0', 0.7), 0.4);
    ctx.stroke();
  }
  ctx.restore();
}
// A rolled short sleeve on an upper arm (rig space).
function sleeve(ctx, a, mode, D, k) {
  const S = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const E = ptOf(a, D, `arm${k}u`, D.J[`el${k}`]);
  const an = Math.atan2(E[1] - S[1], E[0] - S[0]);
  const len = Math.hypot(E[0] - S[0], E[1] - S[1]);
  ctx.save();
  ctx.translate(...S);
  ctx.rotate(an);
  const near = k === 'N';
  const pts = chaikin([[-1.6, -2.3], [len * 0.62, -2.5], [len * 0.66, 2.5], [-1.6, 2.3]], 2);
  poly(ctx, pts);
  paint(ctx, a, mode, near ? MINT[1] : MINT[2], MINT_INK);
  smooth(ctx, [[len * 0.5, -2.7], [len * 0.72, -2.6], [len * 0.74, 2.6], [len * 0.5, 2.7]]);
  paint(ctx, a, mode, near ? MINT[0] : MINT[1], MINT_INK);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(len * 0.62, -2.4);
    ctx.lineTo(len * 0.62, 2.4);
    pen(ctx, tone(a, MINT[3], 0.6), 0.3);
    ctx.stroke();
  }
  ctx.restore();
}
// Her hands: the near one in a big leather smith's gauntlet, the far one bare (four round fingers).
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
  const open = (a.tfQ ?? {})[`open${k}`] ?? 0;
  if (near) {
    // the gauntlet's flared cuff, then the mitt
    smooth(ctx, [[-4.4, -6.4], [4.4, -6.4], [3.4, -2.4], [-3.4, -2.4]]);
    paint(ctx, a, mode, LEATH[1], LEATH_INK, LW / 1.2);
    smooth(ctx, [[-3.8, -3], [-1.4, -4.2], [2.2, -4], [4, -1], [3.8 + open, 2.6], [1.4, 4.6 + open * 0.6], [-1.8, 4.4], [-4, 1.4]]);
    paint(ctx, a, mode, LEATH[0], LEATH_INK, LW / 1.2);
    if (mode === 'fill') {
      glow(ctx, -0.6, -1, 3, '#d4a07a', 0.7);
      ctx.beginPath();
      ctx.moveTo(-3.6, -5.2);
      ctx.lineTo(3.6, -5.2);
      pen(ctx, tone(a, LEATH[2], 0.8), 0.4);
      ctx.stroke();
    }
  } else {
    smooth(ctx, [[-3.4, -2.6], [-1.2, -3.8], [2, -3.6], [3.6, -1], [3.4 + open, 2.2], [1.2, 3.8 + open * 0.6], [-1.6, 3.8], [-3.6, 1.2]]);
    paint(ctx, a, mode, SKIN[2], INK, LW / 1.2);
    if (mode === 'fill') {
      for (const dx of [-1.6, 0, 1.6]) {
        ctx.beginPath();
        ctx.moveTo(dx, 1.6);
        ctx.lineTo(dx, 3.4);
        pen(ctx, tone(a, SKIN[3], 0.5), 0.3);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}
// Her round salamander feet: wide, three soft toe lobes, a cream sole.
function foot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  const pts = [[p[0] - 4.4, p[1] - 2.6], [p[0] + 1, p[1] - 3.4], [p[0] + 5.6, p[1] - 1.6], [p[0] + 8.8, p[1] + 0.8], [p[0] + 9, p[1] + 3.6], [p[0] - 4.6, p[1] + 3.6], [p[0] - 5.4, p[1] + 0.4]];
  smooth(ctx, pts);
  paint(ctx, a, mode, near ? SKIN[1] : SKIN[2]);
  if (mode === 'fill') {
    for (const [dx, s] of [[3.2, 0.9], [5.8, 1], [8, 0.8]]) {
      ctx.beginPath();
      ctx.moveTo(p[0] + dx - 0.2, p[1] + 3.4);
      ctx.lineTo(p[0] + dx - 0.6, p[1] + 1.6 * s);
      pen(ctx, tone(a, SKIN[3], near ? 0.55 : 0.35), 0.35);
      ctx.stroke();
    }
    ctx.fillStyle = tone(a, CREAM[2], near ? 0.8 : 0.5);
    ctx.fillRect(p[0] - 4.4, p[1] + 2.8, 13, 0.8);
    ell(ctx, p[0] + 2, p[1] - 1.6, 2.6, 0.8, -0.2);
    ctx.fillStyle = tone(a, SKIN[0], near ? 0.7 : 0.3);
    ctx.fill();
  }
  ctx.restore();
}
// Her tail: thick at her rump, from inside it, tapering to a round tip; the drizzle in bands down it.
function tail(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const angs = a.tfTail ?? [2.7, 2.55, 2.35, 2.1, 1.8, 1.5];
  const pts = chain([h[0] - 7, h[1] - 3], angs, [5, 5, 4.8, 4.4, 4, 3.4]);
  const W = [11, 10, 8.8, 7.4, 6, 4.6, 3.4];
  const shape = tube(pts, W, 0.55);
  poly(ctx, shape);
  paint(ctx, a, mode, SKIN[2]);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, shape);
    ctx.clip();
    glow(ctx, pts[2][0], pts[2][1] - 3, 8, SKIN[1], 0.8);
    // the drizzle bands, soft rounded chevrons
    for (const i of [2, 4]) {
      const p = pts[i];
      const an = angs[i];
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(an);
      ctx.beginPath();
      ctx.ellipse(0, -W[i] * 0.25, 1.6, W[i] * 0.55, 0, 0, TAU);
      ctx.fillStyle = tone(a, DRIZ[1]);
      ctx.fill();
      ctx.restore();
    }
    // the cream underside
    ctx.beginPath();
    pts.forEach((p, i) => {
      const an = angs[Math.min(i, angs.length - 1)];
      const o = [p[0] - Math.sin(an) * -W[i] * 0.42, p[1] + Math.cos(an) * -W[i] * 0.42];
      if (i) ctx.lineTo(...o);
      else ctx.moveTo(...o);
    });
    pen(ctx, tone(a, CREAM[2], 0.8), 1.4);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
// Her little anvil: soft slate iron, a brass band, its horn rounded (rig space, (x, y) its foot's
// middle, `sc` its size, `rot` its turn). Its face catches the forge's light.
function anvilArt(ctx, a, mode, x, y, sc = 1, rot = 0, hot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(sc, sc);
  const pts = chaikin([[-4.6, 0], [4.6, 0], [3.6, -1.6], [2.2, -2.4], [2.6, -4.2], [5.4, -4.8], [9.4, -5.6], [5.6, -7.2], [-5.6, -7.2], [-6.4, -5.4], [-3, -4.2], [-2.4, -2.4], [-3.8, -1.6]], 2);
  poly(ctx, pts);
  if (mode === 'line') {
    pen(ctx, IRON[3], LW * 1.1);
    ctx.stroke();
  } else {
    ctx.fillStyle = a ? tone(a, IRON[2]) : IRON[2];
    ctx.fill();
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    ctx.fillStyle = IRON[1];
    ctx.fillRect(-7, -7.4, 17, 1.6);
    ctx.fillStyle = IRON[0];
    ctx.fillRect(-4, -7.4, 6, 0.6);
    ctx.fillStyle = BRASS[2];
    ctx.fillRect(-3, -3.8, 6.4, 0.9);
    ctx.fillStyle = IRON[3];
    ctx.fillRect(-6, -0.9, 12, 0.9);
    if (hot > 0.01) {
      ctx.globalAlpha *= hot;
      ctx.fillStyle = '#ffb060';
      ctx.fillRect(-7, -7.4, 17, 2.2);
    }
    ctx.restore();
  }
  ctx.restore();
}
// The anvil on her back like a rucksack (behind her, the horn poking out behind).
function anvilBack(ctx, a, mode, D) {
  const q = a.tfQ ?? {};
  if ((q.anvilBack ?? 1) < 0.5) return;
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  ctx.translate(st[0] - 15, st[1] + 13);
  ctx.rotate(q.anvilJig ?? 0);
  ctx.scale(-1, 1);
  anvilArt(ctx, a, mode, 0, 0, 1.45, 0, 0);
  ctx.restore();
}
// Her caramel hammer: a wooden handle, the head a block of hard-crack caramel, glassy amber in brass
// bands, a soft drip hanging under it on its own spring. Held in her near hand at `hamA` from her forearm.
function hammer(ctx, a, mode, D) {
  const q = a.tfQ ?? {};
  if ((q.holdH ?? 1) < 0.5) return;
  const h = ptOf(a, D, 'handN', D.J.handN);
  const w = ptOf(a, D, 'handN', D.J.wrN);
  const fa = Math.atan2(h[1] - w[1], h[0] - w[0]);
  const ang = fa + (q.hamA ?? 0);
  hammerAt(ctx, a, mode, h[0], h[1], ang, q.drip ?? 0);
}
const HK = 0.64;
export function hammerAt(ctx, a, mode, x, y, ang, drip = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(HK, HK);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2.4, 0);
  ctx.lineTo(9.4, 0);
  if (mode === 'line') {
    pen(ctx, WOOD[2], 1.8 + (LW * 2) / HK);
    ctx.stroke();
  } else {
    pen(ctx, a ? tone(a, WOOD[1]) : WOOD[1], 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2.4, -0.4);
    ctx.lineTo(9.4, -0.4);
    pen(ctx, WOOD[0], 0.5);
    ctx.stroke();
  }
  // the head: across the handle's end
  ctx.translate(9.4, 0);
  ctx.rotate(Math.PI / 2);
  // its drip, hanging from its lower face on its own spring
  const dr = [0.6 + Math.sin(drip) * 0.8, 3.4];
  ctx.beginPath();
  ctx.moveTo(-1.2, 2.6);
  ctx.quadraticCurveTo(dr[0] - 1, dr[1] + 1, dr[0], dr[1] + 2.4);
  ctx.quadraticCurveTo(dr[0] + 1.1, dr[1] + 1, 1.2, 2.6);
  ctx.closePath();
  if (mode === 'line') {
    pen(ctx, CARA[3], (LW * 1.2) / HK);
    ctx.stroke();
  } else {
    ctx.fillStyle = CARA[2];
    ctx.fill();
  }
  const blk = chaikin([[-5.6, -3.2], [5.6, -3.2], [5.6, 3.2], [-5.6, 3.2]], 2);
  poly(ctx, blk);
  if (mode === 'line') {
    pen(ctx, CARA[3], (LW * 1.2) / HK);
    ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(0, -3.2, 0, 3.2);
    g.addColorStop(0, CARA[0]);
    g.addColorStop(0.35, CARA[1]);
    g.addColorStop(1, CARA[2]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    poly(ctx, blk);
    ctx.clip();
    // brass bands at both faces
    ctx.fillStyle = BRASS[1];
    ctx.fillRect(-5.8, -3.4, 1.6, 6.8);
    ctx.fillRect(4.2, -3.4, 1.6, 6.8);
    ctx.fillStyle = BRASS[0];
    ctx.fillRect(-5.8, -3.4, 0.55, 6.8);
    ctx.fillRect(4.2, -3.4, 0.55, 6.8);
    // the glassy gloss
    ell(ctx, -1, -1.7, 2.6, 0.75, 0);
    ctx.fillStyle = 'rgba(255,255,240,0.85)';
    ctx.fill();
    ell(ctx, 1.8, 1.5, 1.4, 0.6, 0);
    ctx.fillStyle = 'rgba(255,214,140,0.7)';
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ---------- Her act and her fight ----------
const SWINGS = ['bonk', 'scoop', 'tail'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.tfN ?? 0) % SWINGS.length]);
const READY = { shN: -40, elN: -60, hwN: -10, shF: -30, elF: -80, hwF: -10 };
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'cheery', look: [0.4, 0], turn: 0.4, sweat: -1, fx: null, hamA: -0.35, holdH: 1, anvilBack: 1, anvilHands: 0, anvilFloor: 0, openN: 0, openF: 0, mirror: 0, rope: 0, bubble: 0, strand: 0 };
  a.tfQ = q;
  a.tfUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const ham = (v, k = 1) => {
    q.hamA = mix(q.hamA, v, clamp(k, 0, 1));
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.4);
  const cineMood = m.cine?.mood;
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  const alive = m.hp > 0;
  const low = alive && m.hp / m.def.hp < 0.25;
  // the anvil: thrown out into the room (world/volcano.js m.mech.anvilOut) or on her back
  const anvilOut = Boolean(m.mech?.anvilOut);
  if (anvilOut) q.anvilBack = 0;
  // ----- her casts (world/volcano.js) and her swings at the tank -----
  const cast = alive && m.cast && m.castPose ? m.cast : null;
  if (cast && st.tfCastT0 !== cast.t0) {
    st.tfCastT0 = cast.t0;
    st.tfMove = m.castPose;
  }
  const since = now - (m.attackAt ?? -9);
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.45);
  const winding = alive && !cast && m.windup > 0;
  if (winding && !(now - (st.tfWindAt ?? -9) < 0.25)) {
    st.tfN = (st.tfN ?? m.uid ?? 0) + 1;
    st.tfMove = pickSwing(m, st);
  }
  if (winding) st.tfWindAt = now;
  const struck = alive && since >= 0 && since < 1.1;
  const mv = cast ? st.tfMove : winding || struck ? (st.tfMove ??= SWINGS[0]) : null;
  const cu = cast ? clamp((now - cast.t0) / cast.dur, 0, 1) : 1;
  const ct = cast ? now - cast.t0 : 99;
  let W = 0;
  if (cast) W = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  else if (winding) W = clamp(1 - m.windup / total, 0, 1);
  const s = cast || winding ? -1 : since;
  const busy = !alive || Boolean(mv);
  if (busy) st.tfFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.tfFreeAt ?? -9)) / 0.35);
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;

  // Standing: weight on her back foot, the hammer's head resting on the floor beside her, her
  // gauntlet on the end of its handle; chin up, the cheery grin.
  go({ shN: -18, elN: -40, hwN: 10, shF: 12, elF: -30, hwF: 8, tilt: -1, chest: -1.5 + breath * 0.5, head: -2 + Math.sin(t * 0.55) * 1.2, pelvis: 1.5 }, 1);
  ham(1.05);
  if (walkW > 0.01) {
    const u = a.blkidU ?? a.wp ?? 0;
    go({ shN: 8, elN: -14, hwN: 0 }, walkW);
    add({ shN: Math.sin(u * TAU) * 10, shF: -Math.sin(u * TAU) * 12, tilt: 2, head: -1 }, walkW);
    ham(0.25, walkW);
    q.turn = mix(q.turn, 0.6, walkW);
  }
  if (fighting && !busy) {
    go({ ...READY, tilt: 4, drop: 0.08, head: 2 }, 0.85 * freeK);
    ham(-0.9, 0.85 * freeK);
    say('focus');
    q.turn = 0.6;
  }
  if (fighting && !st.tfHunt) st.tfBangAt = now;
  if (!fighting && st.tfHunt && alive) st.tfLostAt = now;
  st.tfHunt = fighting;
  q.bang = now - (st.tfBangAt ?? -9);
  q.huh = now - (st.tfLostAt ?? -9);
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // the hammer flung up on her shoulder: "mm!"
    const k = win(gloat, 0, 0.25, 0.9, 1.4) * freeK;
    go({ shN: -120, elN: -110, hwN: 10, head: -6, tilt: -3, shF: 20, elF: -100 }, k);
    ham(0.2, k);
    say('proud', k);
    q.fx = { kind: 'mm', u: gloat };
  }
  if (!alive) {
    st.tfDeadAt ??= now;
    // sat down on her tail, the hammer dropped beside her
    go({ drop: 0.85, tilt: -10, head: 14, shN: 30, elN: -30, shF: 40, elF: -20, fxN: 0.5, fxF: 0.2 });
    ham(1.3);
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.fx = { kind: 'beaten', u: now - st.tfDeadAt };
  } else st.tfDeadAt = undefined;

  if (alive && mv) {
    const snap = s >= 0 ? sstep(s / 0.14) : 0;
    const rel = s >= 0 ? 1 - sstep((s - 0.45) / 0.55) : 0;
    const hitK = snap * rel;
    const wu = sstep(W) * (1 - snap);
    const perf = cast ? sstep(ct / 0.35) : s >= 0 ? rel : 0;
    if (mv === 'bonk') {
      // up over her head (the hammer behind her), then down in front with everything
      go({ shN: -165, elN: -30, shF: -150, elF: -40, tilt: -8, head: -4, chest: -4 }, wu);
      ham(0.2, wu);
      go({ shN: -60, elN: -10, shF: -55, elF: -10, tilt: 14, head: 6, drop: 0.12, x: 0.03 }, hitK);
      ham(-0.1, hitK);
      say(hitK > 0.2 ? 'fierce' : 'focus');
      if (s >= 0 && s < 0.5) q.fx = { kind: 'bonk', u: s };
    } else if (mv === 'scoop') {
      // the hammer low behind her, then an underhand swing up and through, flinging caramel
      go({ shN: 40, elN: -10, tilt: 10, drop: 0.15, head: -2, turnC: -0.3 }, wu);
      ham(0.4, wu);
      go({ shN: -150, elN: -20, tilt: -8, head: -6, turnC: 0.3, x: 0.02 }, hitK);
      ham(0.1, hitK);
      say(hitK > 0.2 ? 'grin' : 'focus');
      if (s >= 0 && s < 0.6) q.fx = { kind: 'scoop', u: s };
    } else if (mv === 'tail') {
      // a turn (the picture mirrored at its middle: never squashed) and a sweep of her heavy tail
      go({ tilt: 6, head: -6, turnC: -0.5, shN: 20, shF: -30 }, wu);
      go({ tilt: -4, turnC: 0.5, head: 6, x: 0.03 }, hitK);
      q.tailWhip = hitK - wu * 0.7;
      q.mirror = s >= 0 ? win(s, 0.02, 0.12, 0.32, 0.44) : 0;
      say(hitK > 0.2 ? 'smug' : 'focus');
      if (s >= 0 && s < 0.45) q.fx = { kind: 'tail', u: s };
    } else if (mv === 'strike') {
      // Hot Off the Anvil: the hammer raised high in both hands, trembling, then down on the tank
      const shake = Math.sin(now * 30) * 3 * perf * (1 - wu);
      go({ shN: -170 + shake, elN: -20, shF: -165 - shake, elF: -25, tilt: -10, head: -6, chest: -5, drop: 0.05 }, Math.max(perf * (1 - hitK), wu));
      ham(0.15, Math.max(perf, wu));
      go({ shN: -55, elN: -6, shF: -50, elF: -8, tilt: 18, head: 8, drop: 0.2, x: 0.05 }, hitK);
      ham(-0.05, hitK);
      say(hitK > 0.2 ? 'shout' : 'fierce');
      q.glow = perf * (1 - hitK);
      if (s >= 0 && s < 0.6) q.fx = { kind: 'slam', u: s };
    } else if (mv === 'drizzle') {
      // Caramel Drizzle: the hammer twirled over her head, caramel flung up in ribbons
      const spin = now * 9;
      go({ shN: -160 + Math.sin(spin) * 14, elN: -30 - Math.cos(spin) * 20, shF: -40, elF: -90, tilt: -6, head: -10 }, perf * (1 - hitK));
      ham(-1.2 + Math.sin(spin) * 0.6, perf * (1 - hitK));
      go({ shN: -170, elN: -6, shF: 120, elF: 10, tilt: -8, head: -12 }, hitK);
      say(hitK > 0.2 ? 'grin' : 'focus');
      q.look = [0.2, -1];
      if (perf > 0.2) q.fx = { kind: 'drizzle', u: ct };
    } else if (mv === 'glass') {
      // Sugar Glass: cheeks puffed, blowing up at a great pane of sugar glass; then a cheer
      go({ shN: -110, elN: -100, hwN: 20, shF: -90, elF: -110, tilt: -14, head: -16, chest: -6 }, perf * (1 - hitK));
      ham(1.2, perf * (1 - hitK));
      go({ shN: -170, elN: -10, shF: 140, elF: 10, tilt: -4, head: -6 }, hitK);
      say(hitK > 0.2 ? 'grin' : 'puff', 1);
      q.look = [0.3, -1];
      if (perf > 0.2 && hitK < 0.3) q.fx = { kind: 'blow', u: ct };
    } else if (mv === 'quench') {
      // Quench!: a crouch, the hammer driven head first into the floor, steam bursting all round
      go({ drop: 0.3, tilt: 16, head: 4, shN: -70, elN: -40, shF: -60, elF: -50 }, Math.max(perf * 0.5, wu));
      ham(-0.3, Math.max(perf, wu));
      go({ drop: 0.4, tilt: 26, head: 10, shN: -10, elN: -10, shF: -6, elF: -14 }, hitK);
      ham(0.1, hitK);
      say(hitK > 0.2 ? 'shout' : 'fierce');
      if (s >= 0 && s < 1) q.fx = { kind: 'quench', u: s };
    } else if (mv === 'toss') {
      // Anvil Toss: the anvil off her back, heaved up overhead in both hands, then thrown
      const lift = cast ? sstep((cu - 0.1) / 0.35) : 0;
      q.anvilBack = cast ? (cu < 0.12 ? 1 : 0) : anvilOut ? 0 : 1;
      q.anvilHands = cast && cu >= 0.12 ? 1 : 0;
      q.holdH = cast && cu >= 0.08 ? 0 : 1;
      go({ shN: -150, elN: -60, shF: -150, elF: -60, drop: 0.12 * (1 - lift), tilt: -10 * lift, head: -8 }, perf * (1 - wu * 0.3));
      go({ shN: -170, elN: -40, shF: -170, elF: -40, tilt: -16, head: -10, chest: -6 }, wu);
      go({ shN: -80, elN: -10, shF: -75, elF: -10, tilt: 16, head: 4, x: 0.04 }, hitK);
      say(hitK > 0.2 ? 'shout' : 'fierce');
      q.look = [0.6, -0.6];
    } else if (mv === 'ring') {
      // Ring the Anvil: a scoop flinging a hot caramel ball at her anvil
      go({ shN: 45, elN: -10, tilt: 12, drop: 0.18, head: -2 }, Math.max(perf * (1 - hitK) * 0.8, wu));
      ham(0.5, Math.max(perf, wu));
      go({ shN: -150, elN: -20, tilt: -8, head: -6, x: 0.02 }, hitK);
      ham(0.1, hitK);
      say(hitK > 0.2 ? 'grin' : 'focus');
      if (perf > 0.2 && hitK < 0.2) q.fx = { kind: 'ball', u: ct };
    } else if (mv === 'reel') {
      // Taffy Pull: hand over hand on a strand of taffy, leaning right back
      const pull = Math.sin(now * 7);
      q.holdH = 0;
      q.rope = 1;
      go({ shN: -80 + pull * 18, elN: -40 - pull * 20, shF: -85 - pull * 18, elF: -30 + pull * 20, tilt: -16, head: -4, drop: 0.14, fxN: -0.2, fxF: 0.25 }, Math.max(perf * (1 - hitK), wu));
      go({ shN: -60, elN: -80, shF: -70, elF: -80, tilt: -22, drop: 0.2, head: -8 }, hitK);
      say(hitK > 0.2 ? 'shout' : 'fierce');
    } else if (mv === 'crack') {
      // Hard Crack!: the hammer swung up and round behind her, then slammed down with everything
      go({ shN: -175, elN: -10, shF: -170, elF: -14, tilt: -16, head: -10, chest: -8, lift: 0.02 }, Math.max(perf * (1 - hitK), wu));
      ham(0.1, Math.max(perf, wu));
      go({ shN: -40, elN: -4, shF: -36, elF: -6, tilt: 24, head: 10, drop: 0.3, x: 0.04 }, hitK);
      ham(0, hitK);
      say(hitK > 0.2 ? 'shout' : 'fierce');
      q.glow = perf * (1 - hitK);
      if (s >= 0 && s < 0.8) q.fx = { kind: 'crack', u: s };
    }
  }
  if (alive) {
    if (hurt && !mv) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -12, x: -0.02, ...READY }, k);
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    // a phase moment (m.phaseAt): Hard Ball (a knock on her anvil, a grin), Hard Crack (a shout)
    const pu = now - (m.phaseAt ?? -9);
    if (pu >= 0 && pu < 1.8 && !mv) {
      const k = win(pu, 0, 0.25, 1.4, 1.8);
      if ((m.mech?.phase ?? 1) >= 3) {
        go({ tilt: -12, head: -14, chest: -6, shN: -170, elN: -10, shF: 120, elF: 30, drop: 0.06 }, k);
        ham(0.2, k);
        say('shout', k);
        q.fx = { kind: 'roar', u: pu };
      } else {
        // a knock over her shoulder on the anvil on her back
        const knock = Math.abs(Math.sin(pu * 9));
        go({ shF: -150 - knock * 10, elF: -150, hwF: 20, head: 6, tilt: 2 }, k);
        say('grin', k);
        q.anvilJig = knock * 0.05 * k;
        q.fx = { kind: 'knock', u: pu };
      }
    }
    // ----- her entrance's acts -----
    if (act && actU >= 0) {
      const d = act.dur ?? 1;
      const ka = win(actU, 0, 0.2, d - 0.1, d + 0.3);
      if (act.move === 'forge' && actU < d + 0.3) {
        // at her anvil on the floor in front of her, hammering a glowing bar in a steady ring
        q.anvilBack = 0;
        q.anvilFloor = 1;
        const beat = (actU % 1.05) / 1.05;
        const up = sstep(beat / 0.55);
        const down = sstep((beat - 0.62) / 0.12);
        go({ shN: -150 * up * (1 - down) - 60 * down, elN: -60 + 30 * up, shF: -60, elF: -50, tilt: 6 + 8 * down, head: 8, drop: 0.08 }, ka);
        ham(-0.2, ka);
        q.bar = 1;
        say(down > 0.5 ? 'grin' : 'focus', ka);
        q.look = [0.6, 0.9];
        if (beat > 0.62 && beat < 0.9) q.fx = { kind: 'forge', u: (beat - 0.62) * 1.05 };
      } else if (act.move === 'heave' && actU < d + 0.3) {
        // the anvil heaved up off the floor and swung onto her back
        const u = clamp(actU / d, 0, 1);
        q.holdH = u < 0.15 || u > 0.85 ? 1 : 0;
        q.anvilFloor = u < 0.2 ? 1 : 0;
        q.anvilHands = u >= 0.2 && u < 0.7 ? 1 : 0;
        q.anvilBack = u >= 0.7 ? 1 : 0;
        go({ drop: 0.3, tilt: 20, shN: -40, elN: -30, shF: -40, elF: -30 }, win(u, 0, 0.12, 0.2, 0.32) * ka);
        go({ shN: -170, elN: -60, shF: -170, elF: -60, tilt: -14, head: -8 }, win(u, 0.22, 0.42, 0.6, 0.75) * ka);
        go({ shN: -20, elN: -40, shF: 20, elF: -30, tilt: 4, head: -4 }, sstep((u - 0.72) / 0.2) * ka);
        say(u > 0.75 ? 'proud' : 'fierce', ka);
        if (u > 0.68 && u < 0.95) q.fx = { kind: 'thump', u: (u - 0.68) * d };
      } else if (act.move === 'windup') {
        go({ drop: 0.2, tilt: 12, ...READY, shN: -150, elN: -40 }, ka);
        ham(0.2, ka);
        q.tailWhip = Math.sin(actU * 10) * 0.3 * ka;
        say('fierce', ka);
      } else if (act.move === 'sway') {
        go({ tilt: Math.sin(actU * (act.speed ?? 3.5)) * 6, shN: -120, elN: -60, head: -4 }, ka);
        say('grin', ka);
      }
    }
    // her idle act: only when calm
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.tfCalm = mix(st.tfCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.tfCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, ham, q, sstep(st.tfCalm), t, now, st);
    if (cineMood && !mv) q.mood = { angry: 'fierce', happy: 'grin', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !mv) {
      if (!cineMood) q.mood = q.mood === 'cheery' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking) q.mood = 'talk';
  }
  q.turn = spring(st, 'tfTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.cheery;
  const f = (st.tfF ??= { ...FACES.cheery, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'wink', 'bt', 'by', 'mw', 'ms', 'mo', 'tg', 'bl', 'sm', 'pf']) f[k] = mix(f[k], tgt[k], k === 'lid' || k === 'wink' ? 1 - Math.exp(-dt * (tgt[k] > f[k] ? 40 : 18)) : kf);
  for (const sh of SHUTS) f.shut[sh] = mix(f.shut[sh], sh === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.tfF = f;
  // the hammer's angle eased (a whole-turn jump unwound first, so it never spins back)
  // (on a stiff, just-damped spring, so a big change of grip starts smoothly as well as ending so)
  q.hamA = spring(st, 'tfHam', q.hamA, 300, 34, dt);
  // a tail swat's turn: the picture mirrored at its middle beat
  st.tfMirror = q.mirror > 0.5;
  // springs: neckerchief tails, apron, tail, the hammer's drip
  const kick = (st.tfLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.tfLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.tfLast = out.head;
  st.tfLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  const tiltR = ((out.tilt ?? 0) * Math.PI) / 180;
  q.kerch = [0, 1].map((i) => clamp(spring(st, `kc${i}`, -tiltR * 0.6 + walkW * 0.3 + Math.sin(t * 1.5 + i * 2) * 0.06 + step * 0.1, 90 - i * 10, 8, dt, kick * 0.012), -0.4, 1.1));
  q.apron = clamp(spring(st, 'apron', -tiltR * 0.5 + step * 0.06 + Math.sin(t * 1.2) * 0.02, 110, 12, dt, kick * 0.006), -0.25, 0.25);
  const tw = q.tailWhip ?? 0;
  a.tfTail = [0, 1, 2, 3, 4, 5].map((i) => spring(st, `tl${i}`, [2.75, 2.6, 2.42, 2.2, 1.95, 1.7][i] - tiltR * 0.3 + Math.sin(t * 1.1 - i * 0.5) * 0.07 + step * 0.08 - tw * (0.5 + i * 0.18), 80 - i * 8, 8, dt, kick * 0.008));
  q.drip = spring(st, 'drip', (q.hamA ?? 0) * 0.5, 70, 6, dt, kick * 0.01);
  q.anvilJig = q.anvilJig ?? 0;
}
const PIECES = [
  { name: 'polish', t0: 0.4, len: 7 },
  { name: 'taste', t0: 8, len: 7 },
  { name: 'bubble', t0: 15.6, len: 7.4 },
  { name: 'practice', t0: 23.6, len: 6 },
];
function idleAct(m, a, out, go, add, ham, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.tfPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.tfPiece = cur.name;
      else return;
    }
  } else {
    st.tfPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'polish') {
    // the hammer's head up to her face (beside it, never over it): a huff, a rub on her apron, then a
    // wink at herself in the shine
    const k = win(u, 0, 0.6, 6.4, 7);
    const huff = win(u, 0.6, 1.0, 1.8, 2.2);
    const rub = win(u, 2.3, 2.6, 4.2, 4.6);
    const admire = win(u, 4.6, 5, 6.2, 6.8);
    go({ shN: -95, elN: -55, hwN: 10, head: 4, tilt: 2 }, huff * k * w);
    go({ shN: -60 + Math.sin(now * 11) * 10, elN: -70, shF: -50 + Math.sin(now * 11 + 1.6) * 14, elF: -70, head: 10, tilt: 8 }, rub * k * w);
    go({ shN: -100, elN: -50, hwN: 20, head: -4, tilt: -3 }, admire * k * w);
    ham(-1.25, (huff + admire) * k * w);
    ham(-1.4, rub * k * w);
    if (at(k)) {
      q.mood = admire > 0.4 ? 'smug' : huff > 0.4 ? 'puff' : 'focus';
      q.look = admire > 0.4 ? [0.8, -0.2] : [0.6, 0.6];
      if (huff > 0.4) q.fx = { kind: 'huff', u: u - 0.8 };
      if (admire > 0.6) q.fx = { kind: 'gleam', u: u - 5 };
    }
  } else if (cur.name === 'taste') {
    // a strand of caramel pulled off the hammer's head with her bare hand, stretched long, eaten
    const k = win(u, 0, 0.6, 6.4, 7);
    const hold = win(u, 0.4, 0.9, 4.6, 5);
    const pull = win(u, 1.2, 2.8, 3.6, 4);
    const eat = win(u, 3.8, 4.2, 5.4, 6);
    go({ shN: -85, elN: -45, hwN: 20, head: 2 }, hold * k * w);
    ham(-1.2, hold * k * w);
    go({ shF: -60 - 60 * pull, elF: -40 + 30 * pull, head: 6 * pull - 4 }, (hold - eat * 0.6) * k * w);
    go({ shF: -110, elF: -140, head: -6, tilt: -4 }, eat * k * w);
    if (at(k)) {
      q.strand = hold * (1 - eat);
      q.openF = pull;
      q.mood = eat > 0.4 ? 'yum' : pull > 0.4 ? 'startled' : 'focus';
      q.look = [0.1, -0.4];
      if (u > 5 && u < 6.4) q.fx = { kind: 'mm', u: u - 5 };
    }
  } else if (cur.name === 'bubble') {
    // chewing, then an amber caramel bubble blown bigger and bigger... pop, on her nose
    const k = win(u, 0, 0.6, 6.8, 7.4);
    const chew = win(u, 0.5, 0.8, 2.2, 2.5);
    const blow = clamp((u - 2.5) / 2.6, 0, 1);
    const pop = u > 5.1;
    go({ head: Math.sin(now * 9) * 3 * chew, tilt: -2 }, k * w);
    go({ tilt: -6, head: -6, shN: -20, shF: 10 }, (u > 2.5 && !pop ? 1 : 0) * k * w);
    go({ tilt: -12, head: -14, drop: 0.06, shN: -60, elN: -40, shF: -50, elF: -40 }, (pop ? win(u, 5.1, 5.2, 5.8, 6.4) : 0) * k * w);
    if (at(k)) {
      q.bubble = !pop && u > 2.5 ? 0.3 + blow * 0.7 : 0;
      q.mood = pop ? (u < 5.9 ? 'startled' : 'grin') : u > 2.5 ? 'puff' : 'cheery';
      if (chew > 0.3) q.mood = 'smug';
      if (pop && u < 6.4) q.fx = { kind: 'pop', u: u - 5.1 };
    }
  } else {
    // practice: the hammer up on her shoulder, two taps on the floor (a little splash each), a nod
    const k = win(u, 0, 0.5, 5.5, 6);
    for (const t0 of [0.8, 2.6]) {
      const up = win(u, t0, t0 + 0.4, t0 + 0.75, t0 + 0.9);
      const down = win(u, t0 + 0.8, t0 + 0.92, t0 + 1.3, t0 + 1.6);
      go({ shN: -150, elN: -40, tilt: -4, head: -4 }, up * k * w);
      ham(0.2, up * k * w);
      go({ shN: -55, elN: -10, tilt: 10, head: 4, drop: 0.06 }, down * k * w);
      ham(0.05, down * k * w);
      if (at(k) && u > t0 + 0.88 && u < t0 + 1.5) q.fx = { kind: 'tap', u: u - t0 - 0.88 };
    }
    const nod = win(u, 4.2, 4.5, 5.2, 5.6);
    go({ head: 8 * Math.abs(Math.sin((u - 4.2) * 6)), shN: -100, elN: -110 }, nod * k * w);
    ham(-2.4, nod * k * w);
    if (at(k)) q.mood = nod > 0.3 ? 'proud' : 'focus';
  }
}

// ---------- Effects ----------
// A caramel drop (her mark bubbles sit in one).
function drop(ctx, x, y, s, al = 1, col = CARA[1], rim = CARA[3]) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.5);
  ctx.bezierCurveTo(x + s * 0.4, y - s * 0.8, x + s, y - s * 0.2, x + s, y + s * 0.3);
  ctx.arc(x, y + s * 0.3, s, 0, Math.PI);
  ctx.bezierCurveTo(x - s, y - s * 0.2, x - s * 0.4, y - s * 0.8, x, y - s * 1.5);
  ctx.closePath();
  pen(ctx, rim, Math.max(0.5, s * 0.22));
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ell(ctx, x - s * 0.35, y, s * 0.22, s * 0.35, 0.2);
  ctx.fillStyle = 'rgba(255,255,240,0.85)';
  ctx.fill();
  ctx.restore();
}
function bubbleMark(ctx, x, y, mark, e, len, fl) {
  const inn = e < 0.22 ? sstep(e / 0.22) * (1 + 0.2 * Math.sin(Math.PI * clamp(e / 0.22, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  ctx.scale(fl * k, k);
  drop(ctx, 0, 0, 5.2, 1, '#fff4dc', CARA[3]);
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? RED[2] : CARA[3];
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -3.2);
    ctx.lineTo(0, 0.6);
  } else {
    ctx.moveTo(-1.4, -1.6);
    ctx.quadraticCurveTo(-1.1, -3.3, 0.4, -3.1);
    ctx.quadraticCurveTo(1.9, -2.8, 1.3, -1.2);
    ctx.quadraticCurveTo(0.3, -0.5, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.5, 0.8, 0.8);
  ctx.fill();
  ctx.restore();
}
// A warm spark: a soft four-point sparkle in gold with a peach glow (never a speck).
const spark = (ctx, x, y, s, al) => sparkle(ctx, x, y, s, al, '#ffe9a0');
// A caramel ribbon: a soft tapered stroke of caramel with a gloss line.
function ribbon(ctx, pts, w, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const W = pts.map((_, i) => w * (0.4 + 0.6 * Math.sin(Math.PI * (i + 0.5) / pts.length)));
  poly(ctx, tube(pts, W, 0.5));
  pen(ctx, CARA[3], 0.7);
  ctx.stroke();
  ctx.fillStyle = CARA[1];
  ctx.fill();
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] - w * 0.15) : ctx.moveTo(p[0], p[1] - w * 0.15)));
  pen(ctx, 'rgba(255,248,220,0.8)', w * 0.18);
  ctx.stroke();
  ctx.restore();
}
// The anvil in her hands: overhead it is drawn in front of her; brought down past her head (onto her
// back) it goes behind her, so it never sits over her face.
function anvilHeld(a, D, q) {
  const hN = ptOf(a, D, 'handN', D.J.handN);
  const hF = ptOf(a, D, 'handF', D.J.handF);
  const mid = [(hN[0] + hF[0]) / 2 + 2, Math.min(hN[1], hF[1]) - 3];
  return { mid, behind: mid[1] > headAt(a, D, [0, -16])[1] - 2 };
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  const q = a.tfQ ?? {};
  const held = q.anvilHands > 0.5 ? anvilHeld(a, D, q) : null;
  for (const mode of ['line', 'fill']) {
    tail(ctx, a, mode, D);
    anvilBack(ctx, a, mode, D);
    if (held?.behind) anvilArt(ctx, a, mode, held.mid[0], held.mid[1], 1.25, 0, 0);
  }
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.tfQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
// (where her hammer's head is now, rig space)
function hamHead(a, D, q) {
  const h = ptOf(a, D, 'handN', D.J.handN);
  const w = ptOf(a, D, 'handN', D.J.wrN);
  const ang = Math.atan2(h[1] - w[1], h[0] - w[0]) + (q.hamA ?? 0);
  return [h[0] + Math.cos(ang) * 9.4 * HK, h[1] + Math.sin(ang) * 9.4 * HK];
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -16]);
  const hd = headAt(a, D, [0.5, 0]);
  const mo = headAt(a, D, [2.6, 4.2]);
  const hN = ptOf(a, D, 'handN', D.J.handN);
  const hF = ptOf(a, D, 'handF', D.J.handF);
  const hh = hamHead(a, D, q);
  // the anvil in her hands (overhead), or on the floor in front of her (her entrance)
  if (q.anvilHands > 0.5) {
    const { mid, behind } = anvilHeld(a, D, q);
    if (!behind) for (const mode of ['line', 'fill']) anvilArt(ctx, a, mode, mid[0], mid[1], 1.25, 0, 0);
  }
  if (q.anvilFloor > 0.5) {
    for (const mode of ['line', 'fill']) anvilArt(ctx, a, mode, 13, 0, 1.4, 0, 0.6);
    if (q.bar) {
      // the glowing bar on the anvil's face
      ctx.beginPath();
      ctx.roundRect(9.6, -11.6, 7, 1.7, 0.8);
      ctx.fillStyle = '#ffd080';
      ctx.fill();
      glow(ctx, 13, -10.6, 5, '#ffb060', 0.5 + 0.2 * Math.sin(t * 8));
    }
  }
  // the taffy strand off the hammer's head (her taste), or the pull rope (Taffy Pull)
  if (q.strand > 0.02) {
    const p0 = hh;
    const p1 = ptOf(a, D, 'handF', D.J.handF);
    ctx.save();
    ctx.globalAlpha *= clamp(q.strand * 2, 0, 1);
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, Math.max(p0[1], p1[1]) + 2, ...p1);
    pen(ctx, CARA[3], 1.1);
    ctx.stroke();
    pen(ctx, CARA[1], 0.6);
    ctx.stroke();
    ctx.restore();
  }
  if (q.rope > 0.5) {
    const mid = [(hN[0] + hF[0]) / 2, (hN[1] + hF[1]) / 2];
    ctx.beginPath();
    ctx.moveTo(mid[0] - 10, mid[1] + 6);
    ctx.quadraticCurveTo(mid[0] + 10, mid[1] + 1, mid[0] + 40, mid[1] + 8);
    pen(ctx, CARA[3], 1.5);
    ctx.stroke();
    pen(ctx, CARA[1], 0.9);
    ctx.stroke();
  }
  // a caramel bubble at her lips
  if (q.bubble > 0.02) {
    const r = 1.5 + q.bubble * 5;
    ctx.save();
    ell(ctx, mo[0] + r * 0.8, mo[1] - 0.2, r, r * 0.95);
    ctx.fillStyle = 'rgba(255,190,90,0.55)';
    ctx.fill();
    pen(ctx, 'rgba(200,110,40,0.7)', 0.4);
    ctx.stroke();
    ell(ctx, mo[0] + r * 0.5, mo[1] - r * 0.4, r * 0.3, r * 0.18, -0.4);
    ctx.fillStyle = 'rgba(255,255,240,0.9)';
    ctx.fill();
    ctx.restore();
  }
  if (q.glow > 0.02) glow(ctx, hh[0], hh[1], 7 + 2 * Math.sin(t * 12), '#ffb060', 0.5 * q.glow);
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0 && !m.cine) bubbleMark(ctx, crown[0] + 4, crown[1] - 7, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0 && !m.cine) bubbleMark(ctx, crown[0] + 4, crown[1] - 7, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  if (X.kind === 'bonk' || X.kind === 'slam' || X.kind === 'tap' || X.kind === 'forge') {
    const big = X.kind === 'slam' ? 1.5 : X.kind === 'tap' ? 0.6 : 1;
    const v = clamp(u / 0.5, 0, 1);
    const at = X.kind === 'forge' ? [13, -11] : [hh[0], Math.min(-0.5, hh[1] + 2)];
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI / 2 + (i - 2) * 0.55;
      spark(ctx, at[0] + Math.cos(an) * (2 + v * 10 * big), at[1] + Math.sin(an) * (2 + v * 9 * big) + v * v * 4, 1.6 * big * (1 - v * 0.7), 1 - v);
    }
    if (X.kind !== 'forge') {
      for (const sd of [-1, 1]) drop(ctx, at[0] + sd * (3 + v * 8 * big), at[1] - Math.sin(Math.PI * v) * 5 * big, 1.1 * big, 1 - v);
      dust(ctx, at[0], -1, 2 + v * 4 * big, 0.6 * (1 - v), '#fff2d8', '#e0b07a');
    }
  } else if (X.kind === 'scoop' || X.kind === 'ball') {
    const v = clamp(X.kind === 'ball' ? (u - 1) / 1.6 : u / 0.6, 0, 1);
    if (X.kind === 'ball' && u < 1.8) {
      // a hot caramel ball gathering on the hammer's head
      drop(ctx, hh[0], hh[1] - 3, 1.4 + clamp(u / 1.8, 0, 1) * 1.6, 1);
      glow(ctx, hh[0], hh[1] - 3, 5, '#ffb060', 0.4);
    } else {
      const pts = [0, 1, 2, 3, 4].map((i) => [hh[0] + i * 4 * (0.5 + v), hh[1] - i * 2.4 + i * i * 0.5 * v]);
      ribbon(ctx, pts, 2.2, 1 - v);
    }
  } else if (X.kind === 'tail') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) dust(ctx, -14 - i * 5 + v * 6, -1.5, 2.4 + v * 2, 0.6 * (1 - v), '#fff2d8', '#e0b07a');
  } else if (X.kind === 'drizzle') {
    // caramel ribbons flung up off the twirling hammer
    for (let i = 0; i < 3; i++) {
      const ph = (u * 1.4 + i / 3) % 1;
      const pts = [0, 1, 2, 3].map((j) => [hh[0] + Math.cos(ph * TAU + j * 0.4) * (4 + j * 2), hh[1] - 4 - ph * 26 - j * 2]);
      ribbon(ctx, pts, 1.6, Math.sin(Math.PI * ph));
    }
  } else if (X.kind === 'blow') {
    // a pane of sugar glass swelling over her head as she blows
    const v = clamp(u / 2.4, 0, 1);
    const cx = hd[0] + 8;
    const cy = hd[1] - 18 - v * 6;
    ctx.save();
    ctx.globalAlpha *= 0.85;
    ctx.beginPath();
    ctx.roundRect(cx - 4 - v * 8, cy - 3 - v * 5, 8 + v * 16, 6 + v * 10, 3);
    ctx.fillStyle = 'rgba(255,210,130,0.45)';
    ctx.fill();
    pen(ctx, 'rgba(220,140,60,0.8)', 0.6);
    ctx.stroke();
    ell(ctx, cx - 2 - v * 4, cy - 1 - v * 2.4, 1.4 + v * 2, 0.5 + v * 0.5, -0.4);
    ctx.fillStyle = 'rgba(255,255,245,0.9)';
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 2; i++) steam(ctx, mo[0] + 3 + i * 2, mo[1] - 2 - ((u * 3 + i * 0.5) % 1) * 8, 1.2, 0.5 * (1 - ((u * 3 + i * 0.5) % 1)));
  } else if (X.kind === 'quench') {
    const v = clamp(u / 0.9, 0, 1);
    for (let i = 0; i < 6; i++) {
      const sd = i % 2 ? 1 : -1;
      steam(ctx, hh[0] + sd * (4 + v * (10 + i * 4)), -3 - v * (6 + i * 2), 2.4 + v * 3, 0.75 * (1 - v));
    }
  } else if (X.kind === 'crack') {
    const v = clamp(u / 0.7, 0, 1);
    for (let i = 0; i < 7; i++) {
      const an = -Math.PI + (i / 6) * Math.PI;
      spark(ctx, hh[0] + Math.cos(an) * (3 + v * 18), -2 + Math.sin(an) * (2 + v * 12), 2 * (1 - v * 0.6), 1 - v);
    }
    dust(ctx, hh[0], -1, 3 + v * 7, 0.7 * (1 - v), '#fff2d8', '#e0b07a');
  } else if (X.kind === 'mm') {
    const v = clamp(u / 1.3, 0, 1);
    if (u < 1.3) cue(ctx, 'mm!', hd[0] + 16, hd[1] - 20 - v * 4, 7, fl, -0.1, CARA[3]);
  } else if (X.kind === 'huff') {
    const v = clamp(u / 1.2, 0, 1);
    for (let i = 0; i < 3; i++) steam(ctx, mo[0] + 3 + i * 2.2 + v * 4, mo[1] - 1 - i, 1 + v * 1.4, 0.5 * Math.sin(Math.PI * v));
  } else if (X.kind === 'gleam') {
    sparkle(ctx, hh[0] - 1, hh[1] - 2, 2.6 * Math.sin(Math.PI * clamp(u / 1.2, 0, 1)), 1, '#fffbe6');
  } else if (X.kind === 'pop') {
    const v = clamp(u / 0.5, 0, 1);
    for (let i = 0; i < 6; i++) {
      const an = (i / 6) * TAU;
      drop(ctx, mo[0] + 5 + Math.cos(an) * (2 + v * 6), mo[1] + Math.sin(an) * (2 + v * 5), 0.8, 1 - v);
    }
    if (u < 1.1) cue(ctx, 'pop!', hd[0] + 18, hd[1] - 18, 6, fl, -0.12, CARA[3]);
  } else if (X.kind === 'knock') {
    if (u < 1.4) cue(ctx, 'knock knock!', hd[0] + 22, hd[1] - 22, 6, fl, -0.1, CARA[3]);
  } else if (X.kind === 'thump') {
    const v = clamp(u / 0.4, 0, 1);
    dust(ctx, -8, -1.5, 2.6 + v * 3, 0.6 * (1 - v), '#fff2d8', '#e0b07a');
  } else if (X.kind === 'roar') {
    const v = clamp(u / 1.2, 0, 1);
    for (let i = 0; i < 6; i++) spark(ctx, hh[0] + Math.cos(i) * (3 + v * 12), hh[1] - 2 + Math.sin(i * 2) * (3 + v * 8), 1.8 * (1 - v), 1 - v);
    if (u < 1.3) cue(ctx, 'HARD CRACK!', hd[0] + 26, hd[1] - 24, 7, fl, -0.1, RED[2]);
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) spark(ctx, hd[0] - 6 - v * 6 + i * 4, hd[1] - 10 - v * 5 - i * 2.4, 1.5 * (1 - v), 1 - v);
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] + 4, 9, t, 3);
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.4, 0.6 * (1 - u / 0.6), '#fff2d8', '#e0b07a');
  }
}

const DRESS = {
  id: 'toffee',
  // (the skin is her caramel hide; her shirt is cut over it from the same outline)
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      shirt(ctx, a, mode, D);
      apronSkirt(ctx, a, mode, D);
      kerchief(ctx, a, mode, D);
    },
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => hand(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => {
      sleeve(ctx, a, mode, D, 'N');
      hammer(ctx, a, mode, D);
    },
    handNskin: (ctx, a, mode, S, D) => hand(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('salamander', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  // (a tail swat's turn: the picture mirrored for its middle beat, never squashed)
  if (a.mo?.rig?.tfMirror) ctx.scale(-1, 1);
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.4);
rig.h = Math.round(rig.h * BIG * 1.4);
// Her art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over
// her head are her own).
export const TOFFEE_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 320, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const TOFFEE_SIZE = { w: 58, h: Math.round(R.H * BIG * 1.1), speed: Math.round(R.speed * BIG) };
export { anvilArt };
