// The Giraffe Ballerina (2026-11-26, the Music Box Ballerina remade from scratch as a new creature; the
// id stays `musicballerina`). Clara, the Midway's prima: a little wind-up giraffe who used to turn on the
// lid of the carnival's great music box, and still dances whenever the tune plays, because Queen
// Gearheart's toys have to keep performing while anyone is watching. Graceful, a touch vain, secretly
// footsore; the show must go on. She moves on her own copy of the creature base (rig.js; body.js
// `giraffe`: slim, long-legged), dressed here; her long neck, head, mane and tail drawn here from scratch
// over the mannequin's (the shared face never used, nothing of the hero's).
//   look    butter-cream fur with soft rounded caramel patches (never jagged), two little ossicones with
//           round cocoa tufts, small leaf ears, a short caramel mane down the back of her long neck,
//           a cream muzzle; a pink satin long-sleeved leotard and tights (the base's own skin, so they
//           fit and fold with every pose), a tulle ruff at the base of her neck, a layered white tutu
//           with a sequinned waistband, pink satin pointe shoes with ribbons crossed up her ankles, a
//           pink ribbon bow on one ossicone; a brass wind-up key in her back, turning (faster in a
//           fight, slower when hurt, still when she's beaten). Her own soft rose-cocoa outline, outer
//           edge only, face bare.
//   eyes    her own "stage-light" eyes: tall soft almonds lifting a little at the outer corner, a warm
//           honey iris (dark at the top, amber below, fine light lines), a big round glint, a small
//           one and a tiny four-point stage sparkle; a neat lash line, thin at the inner corner,
//           fuller toward a soft wing, three short round-tipped lashes fanning from the outer half (a
//           giraffe's famous lashes). Round cocoa brows that do her acting. Faces: poised (rest),
//           delighted (^ ^), proud, stage smile, focus, fierce, wince, hurt, sleepy, dizzy (beaten),
//           sad, startled, talking (vowel mouths); every change eased.
//   idle    a 30 s act in pieces, only a piece she has time to finish (data `rest`, m.restUntil):
//           - the barre (7 s): port de bras, the arms rising through a soft arc to fifth, a demi-plié,
//             up onto relevé; notes from her key;
//           - the pirouette (6 s): a plié in fourth, a double turn on pointe (a clean mirror flip at
//             each half turn), a wobbly finish, then "ta-da!";
//           - sore toes (8.4 s): a look round (nobody watching?), the near foot lifted and rubbed, a
//             wince and a sigh; then she spots you, "!", and snaps into a perfect pose, stage smile;
//           - the révérence (6.4 s): a deep curtsy, one arm sweeping, her long neck bowed low.
//   walk    a ballerina's walk: chin high, arms in a soft low curve, the tutu bouncing.
//   fight   her moves in turn (data `moves`): Grand Jeté (a deep plié, then a leap at you, legs split,
//           landing in a puff), Fouetté (a leg drawn up to retiré, then whipped out in a full turn), and
//           Arabesque Headbutt (up on pointe leaning back, then tipped forward into an arabesque, her
//           long neck swinging down to bonk you with her ossicones).
//   marks   all her own (`ownEmotes`): a "!" bubble as she starts hunting you, a "?" when she loses
//           you, a curtsy and a note after landing a hit, z's when she naps (standing, a giraffe's
//           nap), a sweat drop when low, dizzy stars when beaten.
// Every effect is drawn here, live, in her own style: satin-pink ribbon swishes, tulle puffs, gold
// notes, the game's curvy sparkles.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat, cue, note, spring } from './fx.js';

const BIG = 1.3;
const LW = 1.6 / BIG;
// ---------- Her colours ----------
const INK = '#a8686a';
const FUR = ['#fff8e4', '#fbe6b0', '#eccb84', '#c99a58'];
const SPOT = ['#eeb06a', '#d48a46', '#ad6a30'];
const MUZ = ['#fffdf6', '#fdf1de', '#efdcc0'];
const HORN = ['#9a6a4a', '#74482e'];
const LEO = ['#ffd2e4', '#f6a6c6', '#e286ae', '#c4668e'];
const LEO_INK = '#b25a82';
const TUTU = ['#ffffff', '#fff0f6', '#fbd6e6', '#eeb4cf'];
const TUTU_INK = '#d892b4';
const SATIN = ['#ffe6ee', '#f9bcd2', '#e294b2'];
const GOLD = ['#fff4c0', '#f4c860', '#c49234'];
const IRIS = ['#ffe6a8', '#e8a64e', '#a8662c', '#5a3218'];
const LASH = '#4a2a2c';
const BROW = '#a8724a';

// (inside her head, drawn bigger, the line kept the same weight as everywhere else)
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
// Corner cutting: a closed run of points rounded, the shape kept close.
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
// A tapering piece (an ear, a tail, a ribbon): a chain of points and its widths, a rounded end.
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
// A bone's frame in the base's kid-box units.
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
// ---------- Her head: up on her long neck (head units about its middle; the neck joint below) ----------
const HO = [4, -31];
const HS = 1.32;
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
// (her neck in the same frame, unscaled)
function neckFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0] + HO[0], n[1] + HO[1]);
}

// ---------- Her face (every part eased: an expression always passes through an in-between) ----------
// lid: only for closed eyes (0 open .. 1 shut); shut: which closed shape; bt/by: the brows' tilt (+
// knit, - worried) and raise; mw/ms/mo: the mouth's width, smile, openness; te: teeth; bl: blush;
// sm: irises small (startled).
const FACES = {
  poised: { lid: 0, shut: 'happy', bt: 0.1, by: 0.2, mw: 0.8, ms: 0.35, mo: 0, te: 0, bl: 0.45, sm: 0 },
  delight: { lid: 1, shut: 'happy', bt: -0.2, by: 0.7, mw: 1, ms: 1, mo: 0.35, te: 0, bl: 0.9, sm: 0 },
  proud: { lid: 0, shut: 'happy', bt: 0.15, by: 0.8, mw: 0.9, ms: 0.7, mo: 0, te: 0, bl: 0.6, sm: 0 },
  stage: { lid: 0, shut: 'happy', bt: -0.1, by: 0.9, mw: 1.15, ms: 1, mo: 0.25, te: 0.8, bl: 0.75, sm: 0 },
  focus: { lid: 0, shut: 'happy', bt: 0.5, by: -0.1, mw: 0.6, ms: 0, mo: 0, te: 0, bl: 0.45, sm: 0 },
  fierce: { lid: 0, shut: 'happy', bt: 0.95, by: -0.4, mw: 0.9, ms: -0.3, mo: 0.35, te: 1, bl: 0.5, sm: 0.1 },
  shout: { lid: 0, shut: 'happy', bt: 0.7, by: 0.1, mw: 1, ms: 0.2, mo: 0.9, te: 0, bl: 0.6, sm: 0.2 },
  wince: { lid: 1, shut: 'squeeze', bt: -0.7, by: 0.3, mw: 0.9, ms: -0.6, mo: 0.15, te: 1, bl: 0.6, sm: 0 },
  hurt: { lid: 1, shut: 'squeeze', bt: -0.8, by: 0.2, mw: 0.9, ms: -0.7, mo: 0.6, te: 0, bl: 0.7, sm: 0 },
  sigh: { lid: 0.5, shut: 'sleep', bt: -0.6, by: 0.2, mw: 0.7, ms: -0.3, mo: 0.3, te: 0, bl: 0.5, sm: 0 },
  startled: { lid: 0, shut: 'happy', bt: -0.3, by: 1.3, mw: 0.55, ms: 0, mo: 0.6, te: 0, bl: 0.6, sm: 0.8 },
  sleepy: { lid: 1, shut: 'sleep', bt: -0.2, by: -0.1, mw: 0.6, ms: 0.1, mo: 0.1, te: 0, bl: 0.5, sm: 0 },
  dizzy: { lid: 1, shut: 'dizzy', bt: -0.5, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.45, te: 0, bl: 0.5, sm: 0 },
  sad: { lid: 0, shut: 'happy', bt: -0.95, by: 0.3, mw: 0.7, ms: -0.6, mo: 0, te: 0, bl: 0.4, sm: 0.15 },
  worried: { lid: 0, shut: 'happy', bt: -0.8, by: 0.5, mw: 0.7, ms: -0.4, mo: 0.15, te: 0, bl: 0.5, sm: 0.1 },
  cross: { lid: 0, shut: 'happy', bt: 0.9, by: -0.3, mw: 0.8, ms: -0.45, mo: 0, te: 0, bl: 0.45, sm: 0.1 },
  talk: { lid: 0, shut: 'happy', bt: 0, by: 0.4, mw: 0.8, ms: 0.3, mo: 0.4, te: 0, bl: 0.5, sm: 0 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.6, 0.1, 0.8], [1.1, 0.4, 0.55], [0.9, 0.3, 0.25], [0.7, 0.2, 0], [0.8, 0.2, 0.6]];
const EYE = { w: 3.3, h: 4.1 };

// One eye (both the same size). side +1: the near one (toward her muzzle), its outer corner on the right.
function eye(ctx, a, x, y, side, f, look) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.gbUid ?? 0) * 0.83) % 4.9, 4.4, 4.5, 4.58, 4.72) : 0;
  const L = Math.max(f.lid, blink);
  // (a half-closed lid stays a lid over the open eye; only nearly shut does it become a closed line)
  const closedW = sstep((L - 0.93) / 0.07);
  const shutW = blink > f.lid + 0.05 ? { happy: 0, sleep: 1, squeeze: 0, dizzy: 0 } : f.shut;
  const inner = [x - side * w * 0.95, y + 0.4];
  const outer = [x + side * w * 0.98, y - 0.5];
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    for (const s of SHUTS) {
      const sw = shutW[s];
      if (sw <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= sw;
      pen(ctx, tone(a, LASH), 0.9);
      ctx.beginPath();
      if (s === 'happy') {
        ctx.moveTo(inner[0], inner[1] + 0.9);
        ctx.quadraticCurveTo(x, y - h * 0.95, outer[0], outer[1] + 1.1);
        ctx.stroke();
      } else if (s === 'sleep') {
        // a soft closed curve, the lashes resting down along it
        ctx.moveTo(inner[0], inner[1]);
        ctx.quadraticCurveTo(x, y + h * 0.55, outer[0], outer[1] + 0.2);
        ctx.stroke();
        pen(ctx, tone(a, LASH), 0.55);
        for (const u of [0.55, 0.75, 0.95]) {
          const bx = mix(inner[0], outer[0], u);
          const by = y + h * 0.42 * Math.sin(Math.PI * u) + mix(inner[1], outer[1], u) - y;
          ctx.beginPath();
          ctx.moveTo(bx, by + 0.1);
          ctx.quadraticCurveTo(bx + side * 0.5, by + 1, bx + side * 1.1, by + 1.3);
          ctx.stroke();
        }
      } else if (s === 'squeeze') {
        ctx.moveTo(x + side * w, y - 2.2);
        ctx.quadraticCurveTo(x - side * w * 0.2, y - 0.4, x - side * w * 0.9, y + 0.2);
        ctx.quadraticCurveTo(x - side * w * 0.2, y + 0.8, x + side * w, y + 2.4);
        ctx.stroke();
      } else {
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 + t * 4 * side;
          const r = (i / 26) * w * 0.92;
          const p = [x + Math.cos(an) * r, y + Math.sin(an) * r * 1.1];
          if (i) ctx.lineTo(...p);
          else ctx.moveTo(...p);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  const openW = 1 - closedW;
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  // the eye: a tall soft almond, its outer corner lifting a touch
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(...inner);
    ctx.bezierCurveTo(x - side * w * 0.8, y - h * 1.1, x + side * w * 0.7, y - h * 1.18, ...outer);
    ctx.bezierCurveTo(x + side * w * 1.02, y + h * 0.95, x - side * w * 0.7, y + h * 1.08, ...inner);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = tone(a, '#fffdfa');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.3 * f.sm;
  const ix = x + side * 0.15 + (look?.[0] ?? 0) * 0.8;
  const iy = y + 0.5 + (look?.[1] ?? 0) * 0.6;
  // (kept clear of the lash line: its top sits a little below the eye's top edge)
  const ir = [2.55 * small, 3.05 * small];
  const g = ctx.createLinearGradient(0, iy - ir[1], 0, iy + ir[1]);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.4, tone(a, IRIS[2]));
  g.addColorStop(0.78, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#3a1c10', 0.8), 0.38);
  ctx.stroke();
  pen(ctx, tone(a, '#fff0c8', 0.55), 0.26);
  for (const [a0, a1, rr] of [[0.3, 1.2, 1.9], [1.9, 2.7, 1.7], [3.6, 4.2, 1.75]]) {
    ctx.beginPath();
    ctx.ellipse(ix, iy + 0.2, rr * small, rr * 1.18 * small, 0, a0, a1);
    ctx.stroke();
  }
  ell(ctx, ix, iy + 0.15, 1.3 * small, 1.6 * small);
  ctx.fillStyle = tone(a, '#2a140c');
  ctx.fill();
  // the lid's soft shadow across the top of the white
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.4);
  sg.addColorStop(0, 'rgba(150,80,100,0.32)');
  sg.addColorStop(1, 'rgba(150,80,100,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.2, w * 2.6, h * 0.8);
  // glints: a big round one up at the back, a small one low at the front, her stage sparkle
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - side * 0.9, iy - 1.3 * small, 1.05 * small, 1.0 * small);
  ctx.fill();
  ell(ctx, ix + side * 1.0, iy + 1.35 * small, 0.48, 0.44);
  ctx.fill();
  sparkle(ctx, ix + side * 0.9, iy - 1.7 * small, 0.95, 0.95, '#ffffff');
  if (L > 0.01) {
    // (a blink: the lid sweeping down, her own fur)
    ctx.fillStyle = tone(a, FUR[1]);
    ctx.fillRect(x - w * 1.3, y - h * 1.3, w * 2.6, h * 2.6 * Math.min(1, L / 0.93));
  }
  ctx.restore();
  if (L > 0.04) {
    // (the lid's edge: a soft lash line lowered with it)
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
  // the lash line: thin at the inner corner, fuller toward the outer one, ending in a soft upturned wing
  const top = (u) => {
    const bx = mix(inner[0], outer[0], u);
    const by = mix(inner[1], outer[1], u) - h * 0.98 * Math.sin(Math.PI * (0.1 + u * 0.8)) + 0.15;
    return [bx, by];
  };
  const N = 12;
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(top(i / N));
  const wing = [outer[0] + side * 1.3, outer[1] - 1.1];
  ctx.beginPath();
  pts.forEach((p, i) => {
    const th = 0.18 + 0.5 * (i / N) ** 1.3;
    if (!i) ctx.moveTo(p[0], p[1] - th);
    else ctx.lineTo(p[0], p[1] - th);
  });
  ctx.quadraticCurveTo(outer[0] + side * 0.9, outer[1] - 1.1, wing[0], wing[1]);
  ctx.quadraticCurveTo(outer[0] + side * 0.6, outer[1] - 0.2, pts[N][0], pts[N][1] + 0.3);
  for (let i = N; i >= 0; i--) {
    const th = 0.16 + 0.36 * (i / N) ** 1.3;
    ctx.lineTo(pts[i][0], pts[i][1] + th);
  }
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  // three short round-tipped lashes fanning from its outer half (a giraffe's famous lashes)
  pen(ctx, tone(a, LASH), 0.62);
  for (const [u, len, ang] of [[0.55, 1.4, -1.9], [0.75, 1.7, -1.5], [0.93, 1.8, -1.05]]) {
    const p = top(u);
    const an = side > 0 ? ang : Math.PI - ang;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1] - 0.3);
    ctx.quadraticCurveTo(p[0] + Math.cos(an) * len * 0.6, p[1] - 0.3 + Math.sin(an) * len * 0.6, p[0] + Math.cos(an + side * 0.35) * len, p[1] - 0.3 + Math.sin(an + side * 0.35) * len);
    ctx.stroke();
  }
  // a soft crease above the lid
  pen(ctx, tone(a, FUR[3], 0.55), 0.4);
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.5, y - h * 1.22);
  ctx.quadraticCurveTo(x + side * 0.4, y - h * 1.42, x + side * w * 0.95, y - h * 1.05);
  ctx.stroke();
  ctx.restore();
}
// A brow: short, round at both ends, gently curved; lifted and tilted by the mood.
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.by * 1.1);
  ctx.rotate(side * f.bt * 0.42);
  ctx.beginPath();
  ctx.moveTo(-1.6, 0.25);
  ctx.quadraticCurveTo(0, -0.75, 1.6, 0.25);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, BROW), 1.05);
  ctx.stroke();
  ctx.restore();
}
// Her mouth on the muzzle: a small smile at rest, opening and frowning by its numbers.
function mouth(ctx, a, x, y, f) {
  const w = 1.9 * f.mw;
  const cy = y - f.ms * 0.55;
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.35 - o * 0.35, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.7 + o * 2.6, x - w, cy);
    ctx.fillStyle = tone(a, '#a2485c');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x + 0.2, y + o * 2.1, w * 0.65, o * 0.95);
    ctx.fillStyle = tone(a, '#f48ea4');
    ctx.fill();
    if (f.te > 0.05) {
      ctx.fillStyle = tone(a, '#ffffff', f.te);
      ctx.fillRect(x - w, cy - 0.45, w * 2, 0.8);
    }
    ctx.restore();
    pen(ctx, tone(a, '#8a4a50'), 0.5);
    ctx.stroke();
  } else {
    // one smooth stroke whose corners curl up as part of it, lifting more at one corner
    pen(ctx, tone(a, '#8a4a50'), 0.6);
    ctx.beginPath();
    ctx.moveTo(x - w, cy - 0.1);
    ctx.quadraticCurveTo(x, y + 0.9 + f.ms * 0.45, x + w, cy - 0.35 - f.ms * 0.2);
    ctx.stroke();
    if (f.te > 0.4) {
      ctx.fillStyle = tone(a, '#ffffff', f.te);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.6, cy + 0.15);
      ctx.quadraticCurveTo(x, y + 0.75 + f.ms * 0.4, x + w * 0.6, cy);
      ctx.closePath();
      ctx.fill();
    }
  }
}
// Her skull (round, the crown a little high) and her soft muzzle, one shape.
function skullPath(ctx, tx) {
  ctx.beginPath();
  ctx.ellipse(-0.6, -1.2, 12.4, 11.6, 0, 0, TAU);
  ctx.moveTo(tx + 16.6, 4.8);
  ctx.ellipse(tx + 9.4, 4.8, 7.2, 6.0, -0.12, 0, TAU);
}
// An ossicone: a short soft horn grown from inside her skull, a round cocoa tuft on top.
function horn(ctx, a, mode, x, y, ang, len, far) {
  const pts = chain([x, y], [ang, ang + 0.08], [len * 0.55, len * 0.45]);
  const shape = tube(pts, [3.4, 2.8, 2.5], 0.3);
  poly(ctx, shape);
  paint(ctx, a, mode, far ? FUR[2] : FUR[1]);
  const tip = pts[2];
  ell(ctx, tip[0], tip[1], 2.2, 2.0);
  paint(ctx, a, mode, far ? HORN[1] : HORN[0], HORN[1]);
  if (mode === 'fill') {
    ell(ctx, tip[0] - 0.6, tip[1] - 0.7, 0.9, 0.7);
    ctx.fillStyle = tone(a, '#c08a64', 0.8);
    ctx.fill();
  }
  return tip;
}
// A leaf ear sticking out to the side, a soft pink inside, sprung at its root inside her skull.
function ear(ctx, a, mode, root, ang, far) {
  const pts = chain(root, [ang, ang + 0.18], [3.6, 3.4]);
  const shape = tube(pts, [3.2, 4.4, 2.4], 0.6);
  poly(ctx, shape);
  paint(ctx, a, mode, far ? FUR[2] : FUR[1]);
  if (mode !== 'fill') return;
  const inner = tube(chain([root[0] + Math.cos(ang) * 1.2, root[1] + Math.sin(ang) * 1.2], [ang, ang + 0.18], [2.6, 2.4]), [1.2, 2.2, 1], 0.5);
  poly(ctx, inner);
  ctx.fillStyle = tone(a, '#f6b8b8', far ? 0.55 : 0.8);
  ctx.fill();
}
// The pink satin bow on her near ossicone, its two tails on springs.
function hornBow(ctx, a, mode, x, y) {
  const q = a.gbQ ?? {};
  const sw = q.bowSw ?? [0, 0];
  for (const [s, k] of [[-1, 0], [1, 1]]) {
    // (short, and falling out to the sides, clear of her eyes)
    const pts = chain([x + s * 0.4, y + 0.6], [Math.PI / 2 + s * 0.95 + sw[k], Math.PI / 2 + s * 1.15 + sw[k] * 1.4], [1.7, 1.4]);
    poly(ctx, tube(pts, [1.3, 1.2, 1.1], 0.5));
    paint(ctx, a, mode, SATIN[1], LEO_INK);
  }
  for (const s of [-1, 1]) {
    smooth(ctx, [[x, y], [x + s * 1.6, y - 1.6], [x + s * 2.9, y - 0.9], [x + s * 2.8, y + 0.9], [x + s * 1.6, y + 1.3]]);
    paint(ctx, a, mode, SATIN[s > 0 ? 0 : 1], LEO_INK);
  }
  ell(ctx, x, y, 0.95, 0.95);
  paint(ctx, a, mode, SATIN[2], LEO_INK);
}
// Her soft rounded patches (head units), clipped to the fur.
const HEAD_SPOTS = [[-8.4, -6.6, 2.6, 2.1, 0.3], [-10.4, 0.4, 1.9, 2.4, -0.2], [-4.6, -9.8, 1.6, 1.3, 0.5], [-7.2, 6, 1.7, 1.4, 0.1]];
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.gbQ ?? {};
  const f = a.gbF;
  const turn = q.turn ?? 0.4;
  const tx = turn * 2.4;
  const eA = q.earA ?? [0, 0];
  // the far ear and far ossicone behind her skull
  ear(ctx, a, mode, [9.4, -7.6], -0.55 + eA[1], true);
  horn(ctx, a, mode, 3.6 + tx * 0.4, -9.4, -1.32, 8.2, true);
  // the near ossicone (its root sunk inside the skull: drawn first, the skull's fill over its base)
  const tipN = horn(ctx, a, mode, -3.6 + tx * 0.3, -9.2, -1.86, 8.4, false);
  skullPath(ctx, tx);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill' && f) {
    ctx.save();
    skullPath(ctx, tx);
    ctx.clip();
    // one light from above: a lit crown, a soft shade at the back of her head and under her jaw
    glow(ctx, tx - 2, -9, 12, FUR[0], 0.95);
    glow(ctx, -12, 6, 8, FUR[2], 0.55);
    glow(ctx, tx + 3, 12, 9, FUR[2], 0.4);
    for (const [sx, sy, rx, ry, r] of HEAD_SPOTS) {
      ell(ctx, sx - turn * 0.8, sy, rx, ry, r);
      ctx.fillStyle = tone(a, SPOT[0], 0.85);
      ctx.fill();
    }
    // the muzzle: cream, lit on its top
    ell(ctx, tx + 9.4, 4.8, 7.2, 6.0, -0.12);
    ctx.fillStyle = tone(a, MUZ[1]);
    ctx.fill();
    glow(ctx, tx + 8, 2.6, 5.4, MUZ[0], 0.9);
    glow(ctx, tx + 10, 9.6, 5, MUZ[2], 0.5);
    ctx.restore();
    // cheeks
    for (const [cx, cy, s] of [[tx - 6.6, 4.2, 0.85], [tx + 4.4, 5.2, 1]]) {
      ell(ctx, cx, cy, 2.4, 1.4);
      ctx.fillStyle = tone(a, '#ff9aa8', (0.25 + 0.45 * f.bl) * s);
      ctx.fill();
      ell(ctx, cx + 0.2, cy, 1.1, 0.6);
      ctx.fillStyle = tone(a, '#ff8a9c', (0.2 + 0.4 * f.bl) * s);
      ctx.fill();
    }
    // (both eyes the same size, set level on the face, the pair turning with it)
    const ex = (s) => (s < 0 ? -4.6 + tx * 0.7 : 4.6 + tx);
    for (const s of [-1, 1]) eye(ctx, a, ex(s), -2.2, s, f, q.look);
    for (const s of [-1, 1]) brow(ctx, a, ex(s) + s * 0.2, -8.0, s, f);
    // the nostrils: two soft commas at the top of the muzzle; a soft nose light
    for (const [nx, ny, s] of [[tx + 12.6, 2.4, 1], [tx + 8.8, 2.5, 0.8]]) {
      ctx.beginPath();
      ctx.moveTo(nx - 0.7 * s, ny - 0.4);
      ctx.quadraticCurveTo(nx + 0.4, ny - 0.5, nx + 0.5 * s, ny + 0.6);
      pen(ctx, tone(a, '#b07a6a'), 0.7);
      ctx.stroke();
    }
    ell(ctx, tx + 11, 1.4, 1.6, 0.6, -0.1);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    mouth(ctx, a, tx + 10.4, 6.9, f);
    if (q.sweat >= 0) sweat(ctx, tx - 11, -6 + q.sweat * 3, 1.1);
  }
  // the near ear over the skull's back edge, and her bow on the near ossicone
  ear(ctx, a, mode, [-10.6, -5.6], Math.PI + 0.42 + eA[0], false);
  hornBow(ctx, a, mode, mix(-3.6 + tx * 0.3, tipN[0], 0.55), mix(-9.2, tipN[1], 0.55));
  WK = 1;
  ctx.restore();
}

// ---------- Her long neck (in her head's frame, so it swings with it; rooted inside her chest) ----------
// Its spine from the base (inside the chest, below the neck joint) up into the skull, and its widths.
const NECK = [[-5, 38], [-4.8, 28], [-3.6, 18], [-1.4, 7]];
const NECK_W = [11.6, 10.4, 9.4, 8.8];
const NECK_SPOTS = [[-6.2, 30, 2.4, 2.9, 0.2], [-1.6, 23.4, 2.1, 1.8, -0.3], [-6, 18, 1.8, 2.2, 0.4], [-2.2, 35.6, 2.2, 1.6, 0.1]];
function neck(ctx, a, mode, D) {
  ctx.save();
  neckFrame(ctx, a, D);
  const q = a.gbQ ?? {};
  const shape = tube(NECK, NECK_W, 0.5);
  // the mane: a row of soft rounded tufts down the back of her neck, each rooted inside it, rippling
  // (one soft strip, its outer edge in gentle rounded scallops, its inner edge sunk inside the neck)
  const rip = q.mane ?? 0;
  const outer = [];
  const inner = [];
  const M = 16;
  for (let i = 0; i <= M; i++) {
    const u = i / M;
    const y = mix(NECK[3][1] - 3, NECK[0][1] - 7, u);
    const x = mix(NECK[3][0], NECK[0][0], u) - mix(NECK_W[3], NECK_W[0], u) / 2;
    const bump = 1.9 + 0.75 * Math.abs(Math.sin(u * Math.PI * 4.5)) - u * 0.5;
    outer.push([x - bump + Math.sin(rip + u * 4) * 0.25 * u, y]);
    inner.push([x + 2.4, y]);
  }
  const maneShape = chaikin([...outer, ...inner.reverse()], 2);
  poly(ctx, maneShape);
  paint(ctx, a, mode, SPOT[1], SPOT[2]);
  poly(ctx, shape);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, shape);
    ctx.clip();
    const g = ctx.createLinearGradient(-10, 0, 4, 0);
    g.addColorStop(0, tone(a, FUR[2], 0.7));
    g.addColorStop(0.55, tone(a, FUR[1], 0));
    g.addColorStop(1, tone(a, FUR[0], 0.6));
    ctx.fillStyle = g;
    ctx.fillRect(-12, 0, 18, 46);
    for (const [sx, sy, rx, ry, r] of NECK_SPOTS) {
      ell(ctx, sx, sy, rx, ry, r);
      ctx.fillStyle = tone(a, SPOT[0], 0.85);
      ctx.fill();
    }
    // the throat a soft cream, and the shade under her jaw
    ell(ctx, 0.6, 26, 2.4, 14);
    ctx.fillStyle = tone(a, MUZ[1], 0.55);
    ctx.fill();
    glow(ctx, 0, 10.6, 6, FUR[3], 0.45);
    ctx.restore();
    ctx.save();
    poly(ctx, maneShape);
    ctx.clip();
    glow(ctx, NECK[3][0] - 6, NECK[3][1] + 4, 7, SPOT[0], 0.8);
    ctx.restore();
  }
  ctx.restore();
}
// The tulle ruff round the base of her neck (over it, so its base never shows): soft round puffs.
function ruff(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const sw = (a.gbQ ?? {}).ruff ?? 0;
  const puffs = [];
  for (let i = 0; i < 7; i++) {
    const u = i / 6;
    puffs.push([st[0] - 7.4 + u * 15 + sw * 0.3, st[1] - 1.4 + Math.sin(Math.PI * u) * 1.6 + Math.sin(i * 2.1) * 0.3, 2.6 - Math.abs(u - 0.5) * 1.2]);
  }
  ctx.beginPath();
  for (const [x, y, r] of puffs) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
  paint(ctx, a, mode, TUTU[1], TUTU_INK);
  if (mode === 'fill') {
    for (const [x, y, r] of puffs) {
      ell(ctx, x - r * 0.25, y - r * 0.35, r * 0.55, r * 0.4);
      ctx.fillStyle = tone(a, '#ffffff', 0.9);
      ctx.fill();
      ell(ctx, x + r * 0.2, y + r * 0.45, r * 0.6, r * 0.32);
      ctx.fillStyle = tone(a, TUTU[2], 0.6);
      ctx.fill();
    }
    ell(ctx, st[0] + 0.2, st[1] + 0.6, 1.1, 1.1);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    ell(ctx, st[0] - 0.2, st[1] + 0.2, 0.45, 0.4);
    ctx.fillStyle = tone(a, GOLD[0]);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Her leotard, tutu, paws and pointe shoes ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
// The leotard's satin: a sheen down the front, princess seams, cut from the body's own outline.
function leotard(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const C = (p) => ptOf(a, D, 'chest', p);
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  const st = D.J.stern;
  // (sleeveless: the whole body of it pink satin, cut from her own outline, so it fits every pose)
  ctx.fillStyle = tone(a, LEO[1]);
  ctx.fillRect(-60, -90, 120, 100);
  const sh = C([st[0] - 10, st[1] + 10]);
  glow(ctx, sh[0], sh[1], 6, LEO[3], 0.45);
  const s0 = C([st[0] + 3, st[1] + 4]);
  glow(ctx, s0[0], s0[1], 5, LEO[0], 0.9);
  pen(ctx, tone(a, LEO[2], 0.55), 0.4);
  for (const dx of [-2.6, 6.4]) {
    ctx.beginPath();
    ctx.moveTo(...C([st[0] + dx, st[1] + 2]));
    ctx.quadraticCurveTo(...C([st[0] + dx * 0.7, st[1] + 10]), ...C([st[0] + dx * 0.9, st[1] + 16]));
    ctx.stroke();
  }
  ctx.restore();
}
// The tutu (torso frame): a stiff disc of tulle round her waist, seen a little from above; its far half
// under her body, its near half over it; layered, its scalloped hem flouncing on its own spring.
function tutuPts(D, tilt, fl, layer) {
  const h = D.J.hip;
  const cx = h[0] + 0.6;
  const cy = h[1] - 4.2 + layer * 1.6;
  const rx = 25 - layer * 3.4;
  const ry = 6.4 - layer * 0.7;
  const pts = [];
  const N = 15;
  for (let i = 0; i < N; i++) {
    const an = (i / N) * TAU;
    const c = Math.cos(an);
    const s = Math.sin(an);
    // (each scallop a round lobe; the hem rises and falls with the flounce, more at the sides)
    const lob = 1 + 0.07 * Math.cos(an * N);
    const lift = fl * c * 1.6 + Math.sin(an * 3 + fl * 2) * 0.25 * Math.abs(fl);
    pts.push([cx + c * rx * lob, cy + s * ry * lob + c * tilt * rx * 0.08 - lift]);
  }
  return { pts: chaikin(pts, 2), cx, cy, rx, ry };
}
function tutu(ctx, a, mode, D, half) {
  const q = a.gbQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'torso');
  const tilt = q.tutuT ?? 0;
  const fl = q.tutuF ?? 0;
  for (const layer of [0, 1, 2]) {
    const T = tutuPts(D, tilt, fl * (1 - layer * 0.25), layer);
    ctx.save();
    if (half === 'near') {
      // (only its near half: below the line through its middle)
      ctx.beginPath();
      ctx.rect(T.cx - 40, T.cy - 0.4, 80, 30);
      ctx.clip();
    }
    poly(ctx, T.pts);
    paint(ctx, a, mode, [TUTU[2], TUTU[1], TUTU[0]][layer], TUTU_INK);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, T.pts);
      ctx.clip();
      glow(ctx, T.cx - 4, T.cy - T.ry * 0.6, T.rx * 0.55, TUTU[0], 0.9);
      glow(ctx, T.cx + 6, T.cy + T.ry, T.rx * 0.5, TUTU[3], layer ? 0.3 : 0.5);
      // soft pleats radiating from her waist
      pen(ctx, tone(a, TUTU[3], 0.45), 0.35);
      for (let i = 0; i < 9; i++) {
        const an = 0.25 + (i / 8) * (Math.PI - 0.5);
        ctx.beginPath();
        ctx.moveTo(T.cx + Math.cos(an) * T.rx * 0.25, T.cy + Math.sin(an) * T.ry * 0.25);
        ctx.lineTo(T.cx + Math.cos(an) * T.rx * 0.95, T.cy + Math.sin(an) * T.ry * 0.95);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  // the sequinned waistband (near half only, over her)
  if (half === 'near' && mode === 'fill') {
    const h = D.J.hip;
    const cx = h[0] + 0.6;
    const cy = h[1] - 5.8;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10.6, 2.2, 0, 0.1, Math.PI - 0.1);
    pen(ctx, tone(a, LEO[2]), 1.6);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const an = 0.35 + (i / 5) * (Math.PI - 0.7);
      ell(ctx, cx + Math.cos(an) * 10.6, cy + Math.sin(an) * 2.2, 0.55, 0.55);
      ctx.fillStyle = tone(a, i % 2 ? GOLD[0] : GOLD[1]);
      ctx.fill();
    }
  }
  ctx.restore();
}
// A soft round paw, her fur a shade paler at the fingertips.
// Her rounded patches down her arms and legs, each along its bone, a shade darker on the far side.
function limbSpots(ctx, a, mode, D, k, kind) {
  if (mode !== 'fill') return;
  const near = k === 'N';
  const segs = kind === 'arm' ? [[`arm${k}u`, `sh${k}`, `el${k}`, [[0.45, 0.9, 1.6]]], [`arm${k}f`, `el${k}`, `wr${k}`, [[0.4, 0.75, 1.3]]]] : [[`thigh${k}`, `hip${k}`, `knee${k}`, [[0.62, 1.0, 1.8]]], [`shin${k}`, `knee${k}`, `ank${k}`, [[0.35, 0.85, 1.5], [0.72, 0.7, 1.1]]]];
  for (const [bone, j0, j1, list] of segs) {
    const P = D.J[j0];
    const Q = D.J[j1];
    const an = Math.atan2(Q[1] - P[1], Q[0] - P[0]);
    for (const [u, side, r] of list) {
      const c = [mix(P[0], Q[0], u) - Math.sin(an) * side, mix(P[1], Q[1], u) + Math.cos(an) * side];
      const [x, y] = ptOf(a, D, bone, c);
      const M = a.blMat(bone);
      ell(ctx, x, y, r * D.SC * 1.25, r * D.SC * 0.9, Math.atan2(M[1], M[0]) + an);
      ctx.fillStyle = tone(a, SPOT[near ? 0 : 1], near ? 0.85 : 0.7);
      ctx.fill();
    }
  }
}
function paw(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  const near = k === 'N';
  const open = (a.gbQ ?? {})[`open${k}`] ?? 0;
  smooth(ctx, [[-3.4, -2.6], [-1.2, -3.6], [2, -3.4], [3.6, -0.8], [3.4 + open * 0.8, 2.4], [1, 4 + open * 0.6], [-1.6, 3.8], [-3.6, 1.2]]);
  paint(ctx, a, mode, near ? FUR[1] : FUR[2]);
  if (mode === 'fill') {
    glow(ctx, -0.6, -1, 2.8, FUR[0], near ? 0.85 : 0.35);
    // (a graceful hand: two soft finger lines)
    pen(ctx, tone(a, FUR[3], 0.55), 0.4);
    ctx.beginPath();
    ctx.moveTo(-0.4, 1.2);
    ctx.lineTo(-0.2, 3.4);
    ctx.moveTo(1.4, 1);
    ctx.lineTo(1.7 + open * 0.4, 3);
    ctx.stroke();
  }
  ctx.restore();
}
// A pink satin pointe shoe, its ribbons crossed up her ankle.
function shoe(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 3.2, p[1] - 2.6], [p[0] + 0.2, p[1] - 3.4], [p[0] + 3.2, p[1] - 1.6], [p[0] + 6.2, p[1] + 0.6], [p[0] + 6.4, p[1] + 3.6], [p[0] - 3.6, p[1] + 3.6], [p[0] - 4, p[1] + 0.8]]);
  paint(ctx, a, mode, near ? SATIN[1] : SATIN[2], LEO_INK);
  if (mode === 'fill') {
    ell(ctx, p[0] + 3.2, p[1] + 0.2, 2.2, 1, -0.2);
    ctx.fillStyle = tone(a, SATIN[0], near ? 0.85 : 0.4);
    ctx.fill();
    // the ribbons, crossing up over her ankle
    pen(ctx, tone(a, SATIN[2]), 0.7);
    ctx.beginPath();
    ctx.moveTo(p[0] - 2.4, p[1] + 0.4);
    ctx.lineTo(p[0] + 2, p[1] - 4.4);
    ctx.moveTo(p[0] + 2.2, p[1] + 0.2);
    ctx.lineTo(p[0] - 2, p[1] - 4.8);
    ctx.stroke();
    // the sole's line and the darned box at the toe
    pen(ctx, tone(a, SATIN[2], 0.8), 0.45);
    ctx.beginPath();
    ctx.moveTo(p[0] - 3.4, p[1] + 3);
    ctx.lineTo(p[0] + 6, p[1] + 3);
    ctx.stroke();
  }
  ctx.restore();
}
// Her tail (behind her, out from under the tutu): short, a plump cocoa tuft at its end, sprung.
function tail(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const angs = a.gbTail ?? [2.5, 2.1];
  const pts = chain([h[0] - 9, h[1] - 3], angs, [5.2, 4.6]);
  poly(ctx, tube(pts, [3.2, 2.6, 2.2], 0.4));
  paint(ctx, a, mode, FUR[2]);
  const e = pts[2];
  const d = [Math.cos(angs[1]), Math.sin(angs[1])];
  smooth(ctx, [[e[0] - d[1] * 2, e[1] + d[0] * 2], [e[0] + d[0] * 3 - d[1] * 2.6, e[1] + d[1] * 3 + d[0] * 2.6], [e[0] + d[0] * 6.6, e[1] + d[1] * 6.6], [e[0] + d[0] * 3 + d[1] * 2.6, e[1] + d[1] * 3 - d[0] * 2.6], [e[0] + d[1] * 2, e[1] - d[0] * 2]]);
  paint(ctx, a, mode, HORN[0], HORN[1]);
  if (mode === 'fill') {
    ell(ctx, e[0] + d[0] * 2.6, e[1] + d[1] * 2.6 - 0.6, 1.2, 0.9);
    ctx.fillStyle = tone(a, '#c08a64', 0.7);
    ctx.fill();
  }
  ctx.restore();
}
// Her wind-up key: a brass stem into her back, its bow turning (seen edge-on as it turns).
function key(ctx, a, mode, D) {
  const q = a.gbQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const root = [st[0] - 9.6, st[1] + 7.6];
  const spin = q.keyA ?? 0;
  const c = Math.cos(spin);
  ctx.translate(root[0], root[1]);
  ctx.beginPath();
  ctx.moveTo(1.4, 0);
  ctx.lineTo(-5.2, 0);
  ctx.lineCap = 'round';
  pen(ctx, mode === 'line' ? INK : tone(a, GOLD[2]), mode === 'line' ? 1.9 + LW * 2 : 1.9);
  ctx.stroke();
  // the bow: two round lobes, side by side when it faces us, one behind the other edge-on
  for (const s of [-1, 1]) {
    ell(ctx, -7.6, s * 2.4 * Math.abs(c) + 0.0, 1.9, 2.1 * Math.max(0.35, Math.abs(c)));
    paint(ctx, a, mode, s * c > 0 ? GOLD[1] : GOLD[2], GOLD[2]);
    if (mode === 'fill') {
      ell(ctx, -7.6, s * 2.4 * Math.abs(c), 0.7, 0.8 * Math.max(0.35, Math.abs(c)));
      ctx.fillStyle = tone(a, GOLD[2], 0.8);
      ctx.fill();
    }
  }
  ell(ctx, -5.6, 0, 1.1, 1.5);
  paint(ctx, a, mode, GOLD[1], GOLD[2]);
  if (mode === 'fill') {
    ell(ctx, -5.9, -0.6, 0.45, 0.4);
    ctx.fillStyle = tone(a, GOLD[0]);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Her act and her fight (on the base's channels) ----------
const SWINGS = ['jete', 'fouette', 'arabesque'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.gbN ?? 0) % SWINGS.length]);
// A ballerina's carriage: the arms in a soft low curve (bras bas), the chin high.
const CARRIAGE = { shN: 14, elN: -38, hwN: -14, shF: -8, elF: -40, hwF: -14 };
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'poised', look: [0.4, 0], turn: 0.4, sweat: -1, fx: null, openN: 0, openF: 0, spin: 0, keyRate: 1.4, notes: 0 };
  a.gbQ = q;
  a.gbUid = (m.uid ?? 0) % 7;
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
  const alive = m.hp > 0;
  const low = alive && m.hp / m.def.hp < 0.3;
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  const since = now - (m.attackAt ?? -9);
  const anticK = m.windup > 0 ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.4), 0, 1) : 0;
  const swinging = alive && (anticK > 0 || (since >= 0 && since < 0.9));
  if (swinging && !st.gbAtk) {
    st.gbN = (st.gbN ?? (m.uid ?? 0)) + 1;
    st.gbPick = pickSwing(m, st);
  }
  st.gbAntic = swinging ? Math.max(anticK, st.gbAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.9;
  st.gbAtk = swinging;
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;
  const busy = !alive || swinging;
  // (out of a move, what follows eases in: never a snap from the move's end into a stance)
  if (busy) st.gbFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.gbFreeAt ?? -9)) / 0.35);

  // Standing: up straight, chin high, the arms in their soft curve, her weight on one leg.
  go({ ...CARRIAGE, tilt: -2, chest: -2 + breath * 0.5, head: -3 + Math.sin(t * 0.6) * 1.2 }, 1);
  out.shN += breath * 1.5;
  out.shF -= breath * 1.2;
  // Walking: the ballerina's walk, chin up, the arms floating a little with each step.
  if (walkW > 0.01) {
    const u = a.blkidU ?? a.wp ?? 0;
    add({ shN: Math.sin(u * TAU) * 6, shF: -Math.sin(u * TAU) * 6, head: -2 }, walkW);
    q.turn = mix(q.turn, 0.6, walkW);
  }
  if (fighting && !busy) {
    go({ tilt: 2, shN: -52, elN: -62, hwN: -16, shF: 40, elF: -24, hwF: -10, fxN: 0.12 }, 0.8 * freeK);
    say('focus');
    q.turn = 0.6;
    q.keyRate = 2.4;
  }
  // Her marks: a "!" as she starts hunting you, a "?" when she loses you.
  if (fighting && !st.gbHunt) st.gbBangAt = now;
  if (!fighting && st.gbHunt && alive) st.gbLostAt = now;
  st.gbHunt = fighting;
  q.bang = now - (st.gbBangAt ?? -9);
  q.huh = now - (st.gbLostAt ?? -9);
  if (alive && !busy && q.bang >= 0 && q.bang < 0.9) {
    const k = win(q.bang, 0, 0.12, 0.5, 0.9) * freeK;
    go({ head: -10, tilt: -4 }, k);
    say('startled', k);
  }
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // a little curtsy to the crowd, pleased with herself
    const k = win(gloat, 0, 0.25, 0.9, 1.4) * freeK;
    go({ drop: 0.16, tilt: 8, head: 10, shN: 30, elN: -20, shF: 40, elF: -10, fxF: -0.25 }, k);
    say('proud', k);
    q.fx = { kind: 'gloat', u: gloat };
  }
  if (!alive) {
    // beaten: sat down in a heap, the tutu flopped up, legs out, dizzy; her key stopped
    st.gbDeadAt ??= now;
    go({ drop: 0.9, tilt: -10, head: 16, shN: 30, elN: -30, shF: 50, elF: -20, fxN: 0.5, fxF: 0.2, fyN: -0.1 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.keyRate = 0;
    q.fx = { kind: 'beaten', u: now - st.gbDeadAt };
  } else st.gbDeadAt = undefined;

  if (alive) {
    if (swinging) {
      const kind = st.gbPick ?? 'jete';
      const hitK = struck ? (since < 0.11 ? sstep(since / 0.11) : 1 - sstep((since - 0.32) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.gbAntic) * (since < 0.11 ? 1 : 0) : sstep(anticK);
      q.keyRate = 4;
      if (kind === 'jete') {
        // Grand Jeté: a deep plié, arms gathering; then a leap at you, legs split, landing in a puff
        go({ drop: 0.32, tilt: 6, head: 4, shN: 30, elN: -60, shF: 20, elF: -50 }, wK);
        const air = struck ? Math.sin(Math.PI * clamp(since / 0.42, 0, 1)) : 0;
        go({ hop: 0.34 * air, x: 0.22 * hitK, tilt: -6, head: -6, fxN: 0.62, fyN: -0.32, fxF: -0.7, fyF: -0.42, shN: -120, elN: -16, shF: -40, elF: -10 }, Math.min(1, hitK * 1.2) * (0.35 + 0.65 * air));
        if (struck && since > 0.42) go({ drop: 0.18, tilt: 6 }, win(since, 0.42, 0.5, 0.6, 0.85));
        say(hitK > 0.2 ? 'fierce' : 'focus');
        q.fx = { kind: struck ? 'jete' : 'ready', u: struck ? since : now };
      } else if (kind === 'fouette') {
        // Fouetté: the near leg drawn up to retiré, arms rounded in front; then whipped out in a turn
        go({ drop: 0.1, fxN: 0.1, fyN: -0.5, shN: -70, elN: -80, shF: -60, elF: -80, tilt: -3 }, wK);
        const turnU = struck ? clamp(since / 0.5, 0, 1) : 0;
        q.spin = struck ? sstep(turnU) : 0;
        go({ fxN: 0.95, fyN: -0.5, shN: -96, elN: -10, shF: -10, elF: -10, tilt: -6, head: -4 }, hitK);
        q.openN = hitK;
        q.openF = hitK;
        say(hitK > 0.2 ? 'fierce' : 'focus');
        q.fx = { kind: struck ? 'fouette' : 'ready', u: struck ? since : now };
      } else {
        // Arabesque Headbutt: up on pointe leaning back, neck drawn back; then tipped forward into an
        // arabesque, the back leg high, her long neck swinging down to bonk you with her ossicones
        go({ lift: 0.04, tilt: -10, head: -22, shN: -150, elN: -30, shF: -150, elF: -20 }, wK);
        go({ tilt: 24, head: 30, x: 0.06, fxF: -0.85, fyF: -0.62, shN: -70, elN: -10, shF: 20, elF: -10 }, hitK);
        q.openN = hitK;
        say(hitK > 0.2 ? 'shout' : 'focus');
        q.fx = { kind: struck ? 'arabesque' : 'ready', u: struck ? since : now };
      }
    } else if (hurt) {
      // a flinch away from the blow, the ears flicking back
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -12, x: -0.02, shF: -40, elF: -60, shN: 20 }, k);
      say('hurt', k * 2);
      q.earKick = k;
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    // a nap (m.habit nap, or a set sleep pose): asleep on her feet, as giraffes do, her long neck
    // lowered and her head nodding, the arms soft
    const nap = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
    st.gbNap = mix(st.gbNap ?? 0, nap && !busy ? 1 : 0, 1 - Math.exp(-dt * 3));
    if (st.gbNap > 0.01) {
      const k = sstep(st.gbNap);
      go({ head: 22 + Math.sin(t * 1.1) * 2.5, tilt: 3, chest: 2 + Math.sin(t * 1.1) * 1.2, shN: 20, elN: -20, shF: 14, elF: -20 }, k);
      if (k > 0.5) {
        q.mood = 'sleepy';
        q.fx = { kind: 'nap', u: t };
        q.keyRate = 0.3;
      }
    }
    // a scene's acts: 'bow' (her révérence)
    if (act?.move === 'bow' && actU >= 0 && actU < (act.dur ?? 1.4) + 0.3) {
      const k = win(actU, 0, 0.3, (act.dur ?? 1.4) - 0.2, (act.dur ?? 1.4) + 0.3);
      go({ drop: 0.22, tilt: 16, head: 20, shN: 40, elN: -20, fxF: -0.3 }, k);
      say('delight', k);
    }
    // her idle act: only when she's calm, and only a piece she has time to finish
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.gbCalm = mix(st.gbCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.gbCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, q, sstep(st.gbCalm), t, now, st);
    if (cineMood && !busy) q.mood = { angry: 'cross', happy: 'delight', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !busy) {
      if (!cineMood) q.mood = q.mood === 'poised' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
      q.keyRate *= 0.5;
    }
    if (m.talking) q.mood = 'talk';
  }
  // (where her face is turned, eased: never a snap round)
  q.turn = spring(st, 'gbTurn', q.turn, 220, 28, dt);
  // The face, eased toward its mood (talking runs through vowel shapes).
  const F = FACES[q.mood] ?? FACES.poised;
  const f = (st.gbF ??= { ...FACES.poised, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'bt', 'by', 'mw', 'ms', 'mo', 'te', 'bl', 'sm']) f[k] = mix(f[k], tgt[k], k === 'lid' ? 1 - Math.exp(-dt * (tgt.lid > f.lid ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.gbF = f;
  // The spin: a clean mirror flip at each half turn (never a squeeze); kept for the draw.
  const sp = q.spin % 1;
  st.gbFlip = q.spin > 0 && sp > 0.25 && sp < 0.75;
  // springs: the ears, the tail, the tutu's flounce, the bow's tails, the mane, the ruff
  const kick = (st.gbLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.gbLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  const hopV = (out.hop ?? 0) - (st.gbLastH ?? out.hop ?? 0);
  st.gbLast = out.head;
  st.gbLastT = out.tilt;
  st.gbLastH = out.hop;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  q.earA = [0, 1].map((i) => spring(st, `ear${i}`, (q.earKick ?? 0) * (i ? -0.5 : 0.5) + Math.sin(t * 1.3 + i * 2) * 0.05 + (q.mood === 'sad' || q.mood === 'worried' ? (i ? 0.3 : -0.3) : 0), 90, 8, dt, kick * 0.01));
  a.gbTail = [0, 1].map((i) => spring(st, `tl${i}`, 2.2 + i * 0.25 + Math.sin(t * 1.4 + i * 0.7) * 0.12 + step * 0.15 + ((out.tilt ?? 0) * Math.PI) / 180 * -0.6, 70 - i * 10, 6.5, dt, kick * 0.012));
  q.tutuF = clamp(spring(st, 'tutu', step * 0.25 + Math.sin(t * 1.6) * 0.08, 110, 7, dt, kick * 0.006 - hopV * 6), -1.4, 1.4);
  q.tutuT = spring(st, 'tutuT', ((out.tilt ?? 0) * Math.PI) / 180, 140, 12, dt);
  q.bowSw = [0, 1].map((i) => spring(st, `bow${i}`, Math.sin(t * 1.5 + i) * 0.12 - ((out.head ?? 0) * Math.PI) / 180 * 0.5, 80, 6, dt, kick * 0.012));
  q.mane = t * 2.4 + step;
  q.ruff = spring(st, 'ruff', Math.sin(t * 1.2) * 0.4, 90, 8, dt, kick * 0.02);
  // the key turns on its own clock (eased in its speed, never a jump)
  st.gbKeyRate = mix(st.gbKeyRate ?? q.keyRate, q.keyRate, 1 - Math.exp(-dt * 3));
  st.gbKeyA = ((st.gbKeyA ?? (m.uid ?? 0) * 0.7) + st.gbKeyRate * dt) % (TAU * 100);
  q.keyA = st.gbKeyA;
}
// The 30 s act (only a piece she has time to finish before she moves on, m.restUntil).
const PIECES = [
  { name: 'barre', t0: 0.4, len: 7 },
  { name: 'pirouette', t0: 8, len: 6 },
  { name: 'sore', t0: 15, len: 8.4 },
  { name: 'reverence', t0: 24, len: 5.8 },
];
function idleAct(m, a, out, go, add, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.gbPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.gbPiece = cur.name;
      else return;
    }
  } else {
    st.gbPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'barre') {
    // port de bras: the arms rising through a soft arc to fifth; a demi-plié; up onto relevé
    const k = win(u, 0, 0.5, 6.4, 7);
    const up = win(u, 0.5, 2.2, 5.2, 6.6);
    const plie = win(u, 2.4, 3, 3.4, 4);
    const rel = win(u, 4, 4.5, 5.4, 6);
    go({ shN: mix(14, -165, up), elN: mix(-38, -30, up), shF: mix(-8, -150, up), elF: mix(-40, -30, up), head: -6 * up, drop: 0.18 * plie, lift: 0.035 * rel, fxN: 0.12 * plie, fxF: -0.08 * plie }, k * w);
    if (at(k)) {
      q.mood = rel > 0.3 ? 'proud' : 'poised';
      q.look = [0.6, -0.8 * up];
      q.notes = k;
      q.keyRate = 2;
    }
  } else if (cur.name === 'pirouette') {
    // a plié in fourth; a double turn on pointe; a wobbly finish; "ta-da!"
    const k = win(u, 0, 0.4, 5.4, 6);
    const prep = win(u, 0.3, 0.8, 1.1, 1.3);
    const turnK = win(u, 1.2, 1.35, 2.6, 2.8);
    const wob = win(u, 2.7, 2.9, 3.3, 3.6);
    const ta = win(u, 3.6, 3.9, 5.2, 5.8);
    go({ drop: 0.2 * prep, fxN: 0.25 * prep, fxF: -0.2 * prep, shN: -60, elN: -60, shF: -40, elF: -70 }, prep * k * w);
    go({ lift: 0.04, fxN: 0.05, fyN: -0.45, shN: -70, elN: -90, shF: -70, elF: -90, head: -4 }, turnK * k * w);
    go({ tilt: Math.sin(u * 22) * 4, shN: -110, elN: -10, shF: 20, elF: -10 }, wob * k * w);
    go({ shN: -130, elN: -10, shF: -40, elF: -10, head: -8, tilt: -3, fxF: -0.2 }, ta * k * w);
    if (at(k)) {
      q.spin = u > 1.3 && u < 2.7 ? sstep((u - 1.3) / 1.4) * 2 : 0;
      q.mood = u < 1.3 ? 'focus' : u < 2.7 ? 'focus' : u < 3.5 ? 'worried' : 'delight';
      q.openN = ta;
      q.openF = ta;
      if (u > 3.7 && u < 5.4) q.fx = { kind: 'tada', u: u - 3.7 };
    }
  } else if (cur.name === 'sore') {
    // a look round; the near foot lifted and rubbed; a wince and a sigh; then she spots you: "!"
    // and snaps into a perfect pose with a stage smile
    const k = win(u, 0, 0.5, 7.8, 8.4);
    const look = win(u, 0.4, 0.8, 1.6, 2.0);
    const lift = win(u, 2.0, 2.5, 5.0, 5.3);
    const rub = sstep((u - 2.6) / 0.3) * (1 - sstep((u - 4.6) / 0.3));
    const snap = win(u, 5.4, 5.55, 7.4, 8.2);
    go({ head: 8 * look, turnC: -0.3 * look }, look * k * w);
    go({ tilt: 10, head: 16, drop: 0.1, fxN: 0.25, fyN: -0.42, shN: 50 + Math.sin(t * 10) * 8 * rub, elN: -40 + Math.cos(t * 10) * 10 * rub, shF: 10, elF: -30 }, lift * k * w);
    go({ shN: -150, elN: -20, shF: -60, elF: -20, lift: 0.04, head: -8, tilt: -3, fxF: -0.25 }, snap * k * w);
    if (at(k)) {
      q.look = look > 0.3 ? [Math.sin(u * 3) * 0.9, 0] : lift > 0.3 ? [0.5, 0.9] : [0.9, 0];
      q.turn = look > 0.3 ? 0.2 + Math.sin(u * 3) * 0.2 : 0.55;
      q.mood = u < 2 ? 'worried' : u < 4.8 ? (rub > 0.3 ? 'wince' : 'sad') : u < 5.4 ? 'sigh' : u < 6 ? 'startled' : 'stage';
      if (u > 5.35 && u < 6.4) q.fx = { kind: 'spotted', u: u - 5.35 };
      if (u > 4.6 && u < 5.4) q.fx = { kind: 'sigh', u: u - 4.6 };
    }
  } else {
    // the révérence: a deep curtsy, one arm sweeping out and down, her long neck bowed low
    const k = win(u, 0, 0.4, 5.2, 5.8);
    const bow = win(u, 0.8, 2.0, 3.6, 4.7);
    const sweep = win(u, 0.4, 1.2, 4.2, 5.1);
    go({ shN: mix(14, -110, sweep) + 70 * bow, elN: -20, shF: 30, elF: -30 }, sweep * k * w);
    go({ drop: 0.26, tilt: 14, head: 26, fxF: -0.4, fxN: 0.1 }, bow * k * w);
    if (at(k)) {
      q.mood = bow > 0.4 ? 'delight' : 'proud';
      q.openN = sweep;
      if (bow > 0.5) q.fx = { kind: 'bow', u: u - 2 };
    }
  }
}

// ---------- Effects (the rig's space, facing right) ----------
// A soft satin swish: a crescent of pink-white, outlined in its own rose, tapering at both ends.
function swish(ctx, cx, cy, r, a0, a1, w, al, col = '#fff2f7', rim = '#e88ab0') {
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
// A tulle puff: a little cloud of round white-pink tufts.
function tulle(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const L = [[0, 0, 1], [-0.9, 0.3, 0.7], [0.9, 0.25, 0.75], [0.2, -0.6, 0.7]];
  for (const pass of [0, 1]) {
    ctx.beginPath();
    for (const [dx, dy, s] of L) {
      ctx.moveTo(x + dx * r + s * r, y + dy * r);
      ctx.arc(x + dx * r, y + dy * r, s * r, 0, TAU);
    }
    if (pass) {
      ctx.fillStyle = '#fff4f8';
      ctx.fill();
    } else {
      pen(ctx, '#eeb0cc', 1);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// Her marks over her head: a "!" or "?" in a round pink-edged bubble, popping in and settling.
function bubble(ctx, x, y, mark, e, len, fl) {
  const inn = e < 0.22 ? sstep(e / 0.22) * (1 + 0.2 * Math.sin(Math.PI * clamp(e / 0.22, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  ctx.scale(fl * k, k);
  ell(ctx, 0, 0, 4.6, 4.6);
  ctx.fillStyle = '#fffaf6';
  ctx.fill();
  pen(ctx, mark === '!' ? '#e06a96' : '#a888c8', 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-1.4, 4);
  ctx.quadraticCurveTo(-1.6, 5.6, -2.8, 6.4);
  ctx.quadraticCurveTo(-0.6, 6, 0.6, 4.3);
  ctx.fillStyle = '#fffaf6';
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#e06a96' : '#a888c8';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.8);
    ctx.lineTo(0, 0.5);
  } else {
    ctx.moveTo(-1.4, -1.6);
    ctx.quadraticCurveTo(-1.1, -3.3, 0.4, -3.1);
    ctx.quadraticCurveTo(1.9, -2.8, 1.3, -1.2);
    ctx.quadraticCurveTo(0.3, -0.5, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.3, 0.8, 0.8);
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
  pen(ctx, '#c47aa4', 1.3);
  ctx.stroke();
  pen(ctx, '#fff2f8', 0.55);
  ctx.stroke();
  ctx.restore();
}
function under2(ctx, m, a, S, matOf, D) {
  // (faded with the rest of her as she goes)
  ctx.globalAlpha = a.alpha ?? 1;
  for (const mode of ['line', 'fill']) {
    tail(ctx, a, mode, D);
    key(ctx, a, mode, D);
  }
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.gbQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  ctx.scale(1 / BIG, 1 / BIG);
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = (a.flip ? -1 : 1) * (a.gbSpun ? -1 : 1);
  const B = (p) => [p[0] * BIG, p[1] * BIG];
  const crown = B(headAt(a, D, [0, -16]));
  const hd = B(headAt(a, D, [4, 0]));
  const nose = B(headAt(a, D, [14, 4]));
  const keyP = B(ptOf(a, D, 'chest', [D.J.stern[0] - 17, D.J.stern[1] + 7.6]));
  const toeN = B(ptOf(a, D, 'footN', [D.J.ankN[0] + 6, D.J.ankN[1] + 2]));
  const toeF = B(ptOf(a, D, 'footF', [D.J.ankF[0] + 6, D.J.ankF[1] + 2]));
  // the music from her key while she dances at the barre (kept close: notes curl up beside her)
  if (q.notes > 0.05) {
    for (let i = 0; i < 3; i++) {
      const v = (t * 0.4 + i / 3) % 1;
      note(ctx, keyP[0] - 4 - v * 6 + Math.sin(v * 6 + i) * 2, keyP[1] - 4 - v * 18, 1.6 + v * 0.6, -0.2 + Math.sin(v * 4) * 0.3, q.notes * Math.sin(Math.PI * v), i % 2 ? '#f4c860' : '#f08ab4');
    }
  }
  // her marks
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0) bubble(ctx, crown[0] + 4, crown[1] - 8, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0) bubble(ctx, crown[0] + 4, crown[1] - 8, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  if (X.kind === 'ready') {
    sparkle(ctx, toeN[0] + 2, toeN[1] - 4, 1.6 + Math.sin(t * 9) * 0.6, 0.7, '#ffe6f0');
  } else if (X.kind === 'jete') {
    // a satin swish along her leap, and a tulle puff where she lands
    const k = clamp(u / 0.42, 0, 1);
    if (u < 0.5) swish(ctx, hd[0] - 6, hd[1] + 22, 22, Math.PI * 0.95, Math.PI * 0.95 - 1.6 * k - 0.2, 4.2, 1 - k * 0.6);
    if (u > 0.36 && u < 0.95) {
      const v = (u - 0.36) / 0.6;
      tulle(ctx, toeN[0] - 2 - v * 6, -2 - v * 3, 2.6 + v * 2, 1 - v);
      tulle(ctx, toeN[0] + 6 + v * 6, -2 - v * 2, 2.2 + v * 2, 1 - v);
      for (let i = 0; i < 3; i++) sparkle(ctx, toeN[0] + (i - 1) * 7, -6 - v * 8 - i * 2, 2 * (1 - v), 1 - v, '#ffe6f0');
    }
  } else if (X.kind === 'fouette') {
    // a ring of satin swirling round her as she whips through the turn
    const k = clamp(u / 0.5, 0, 1);
    if (u < 0.65) {
      const cy = (toeN[1] + hd[1]) / 2 + 8;
      swish(ctx, hd[0] - 6, cy, 16, -0.4 + k * 3.6, -0.4 + k * 3.6 + 2.2, 3.6, (1 - k) * 0.95);
      for (let i = 0; i < 3; i++) sparkle(ctx, toeN[0] + Math.cos(k * 6 + i * 2) * 8, toeN[1] - 4 + Math.sin(k * 6 + i * 2) * 3, 1.8 * (1 - k), 1 - k, '#fff0c8');
    }
  } else if (X.kind === 'arabesque') {
    // BONK: little stars off her ossicones where they land
    const k = clamp(u / 0.4, 0, 1);
    if (u > 0.02 && u < 0.5) {
      const tip = B(headAt(a, D, [0, -18]));
      for (let i = 0; i < 3; i++) {
        const an = -1.2 + i * 0.9;
        star(ctx, tip[0] + 6 + Math.cos(an) * (5 + k * 9), tip[1] + 4 + Math.sin(an) * (4 + k * 7), 2.2 * (1 - k * 0.5), an, 1 - k * 0.6);
      }
      swish(ctx, hd[0] - 10, hd[1] + 6, 18, -1.6, -1.6 + 1.5 * clamp(u / 0.2, 0, 1), 3.4, 1 - k);
      cue(ctx, 'BONK!', tip[0] + 20, tip[1] - 10, 7, fl, -0.1, '#b2507a');
    }
  } else if (X.kind === 'tada') {
    for (let i = 0; i < 4; i++) {
      const v = clamp(u / 1.4, 0, 1);
      sparkle(ctx, hd[0] - 14 + i * 9, hd[1] - 14 - Math.sin(Math.PI * clamp(v + i * 0.1, 0, 1)) * 6, 2.2 * Math.sin(Math.PI * v), 1, i % 2 ? '#fff0c8' : '#ffe0ee');
    }
    if (u < 1.2) cue(ctx, 'ta-da!', hd[0] + 16, hd[1] - 18, 6.5, fl, -0.12, '#b2507a');
  } else if (X.kind === 'sigh') {
    for (let i = 0; i < 2; i++) {
      const v = clamp(u / 0.8 - i * 0.2, 0, 1);
      tulle(ctx, nose[0] + 3 + v * 5, nose[1] + 1 - v * 3, 0.9 + v * 0.8, (1 - v) * 0.7);
    }
  } else if (X.kind === 'spotted') {
    bubble(ctx, crown[0] + 4, crown[1] - 8, '!', u, 1, fl);
  } else if (X.kind === 'bow' || X.kind === 'gloat') {
    const v = clamp(u / 1.2, 0, 1);
    note(ctx, crown[0] + 6 + v * 5, crown[1] - 2 - v * 9, 1.8, -0.2, Math.sin(Math.PI * v), '#f08ab4');
    sparkle(ctx, crown[0] - 6, crown[1] + 2 - v * 4, 1.8 * Math.sin(Math.PI * v), 1, '#fff0c8');
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) sparkle(ctx, hd[0] - 8 - v * 6 + i * 4, hd[1] - 8 - v * 5 - i * 2.4, 1.8 * (1 - v), 1 - v, '#ffe0ee');
  } else if (X.kind === 'nap') {
    for (let i = 0; i < 3; i++) {
      const v = (u * 0.45 + i / 3) % 1;
      zee(ctx, crown[0] + 4 + v * 7, crown[1] - 2 - v * 11, 0.8 + v * 0.5, Math.sin(Math.PI * v), fl);
    }
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] - 2, 9, t, 3);
  }
  if (X.kind === 'beaten' && u < 0.6) dust(ctx, hd[0] - 4, -1.5, 3.4, 0.6 * (1 - u / 0.6), '#fdf0f4', '#e4c0d0');
  if (X.kind === 'jete' && u > 0.36 && u < 0.8) dust(ctx, toeF[0], -1.5, 3, 0.5 * (1 - (u - 0.36) / 0.44), '#fdf0f4', '#e4c0d0');
  if (q.sweat >= 0 && X.kind === 'beaten') sweat(ctx, crown[0] - 8, crown[1] + 4, 1);
}

const DRESS = {
  id: 'giraffeballerina',
  // (the skin is her fur; her leotard is cut over it from the same outline)
  skin: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  under2,
  under: {
    torsoSkin: (ctx, a, mode, S, D) => tutu(ctx, a, mode, D, 'all'),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      leotard(ctx, a, mode, D);
      tutu(ctx, a, mode, D, 'near');
    },
    neckSkin: (ctx, a, mode, S, D) => {
      neck(ctx, a, mode, D);
      ruff(ctx, a, mode, D);
    },
    armF: (ctx, a, mode, S, D) => limbSpots(ctx, a, mode, D, 'F', 'arm'),
    legF: (ctx, a, mode, S, D) => limbSpots(ctx, a, mode, D, 'F', 'leg'),
    legN: (ctx, a, mode, S, D) => limbSpots(ctx, a, mode, D, 'N', 'leg'),
    armN: (ctx, a, mode, S, D) => limbSpots(ctx, a, mode, D, 'N', 'arm'),
    handFskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    handNskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('giraffe', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  // (a turn is a clean mirror flip at each half: drawn the other way round for the back half)
  // (the picture only: her springs and her facing are left as they are)
  a.gbSpun = Boolean(a.mo?.rig?.gbFlip);
  if (a.gbSpun) ctx.scale(-1, 1);
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.6);
// Her art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over
// her head are her own), her size as drawn and her walking pace (the base's own walk at her size).
export const GIRAFFE_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [90, 300, 200, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const GIRAFFE_SIZE = { w: 28, h: Math.round(R.H * BIG * 1.5), speed: Math.round(R.speed * BIG) };
