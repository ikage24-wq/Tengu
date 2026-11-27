// The Harlequin Puppet (2026-11-26, the Marionette Dancer remade from scratch as a new character; the id
// stays `marionette`). Dot, one of Madame Marionette's harlequins from the Toy Workshop: a little wooden
// marionette girl in a diamond-patched harlequin suit, a pleated ruff and a two-lobed jester cap with
// bells, danced on strings from a wooden cross that floats over her head (the Madame's own magic: she
// cuts her loose on the conveyor belts, world/carnival.js). Queen Gearheart's toys have to keep
// performing while anyone is watching; Dot loves it right up until her strings go slack, and then she
// flops down for a lovely rest. She moves on her own copy of the blank kid base (rig.js, `kid`),
// dressed here; her head, hair, cap, ruff, strings and cross drawn here from scratch over the
// mannequin's (the shared face never used, nothing of the hero's: no hero hair, her own).
//   look    smooth painted wood, ivory-peach with a soft sheen; round wooden ball joints at her elbows,
//           wrists and knees; a harlequin tunic of mint, lilac and cream diamonds with lilac pom-pom
//           buttons (cut from her own outline), short puffed sleeves and bloomers to the knee over her
//           wooden arms and legs; a white pleated ruff with a lilac edge (its pleats on springs); mint
//           jester slippers with curled toes and a pom; a jester cap, its two soft lobes (mint and
//           lilac) flopping on their own springs, a gold bell on each; under it her own soft chestnut
//           hair: an even blunt fringe of five cut sections stopping above her lashes, two side locks
//           outside her eyes to her cheeks, a short bob behind (one shared light, one shine band).
//           Five pale strings from her crown, wrists and knees up to a wooden cross that sways above.
//   eyes    her own glass doll eyes: big and round, a violet iris with a darker ring, a ring of glassy
//           light inside it, a soft rounded-square glint and a small round one; a neat painted lash
//           line, a rose crease over it; painted round rosy cheeks with a dot of shine; a little
//           painted gold star under her near eye; a tiny painted heart of a mouth. Faces: sweet
//           (rest), delight (^ ^), giggle, focus, fierce, dizzy-ish wobble, startled, bliss (slack, eyes
//           shut), hurt, sleepy, dizzy (beaten), sad, cross, talking (vowel mouths).
//   idle    a 30 s act in pieces, only a piece she has time to finish (data `rest`, m.restUntil):
//           - a jig (6.8 s): her knees jerked up in turn by the strings, arms flapping, delighted;
//           - in a tangle (7.2 s): the cross spins and her strings twist; she twirls round and round
//             to undo them (clean mirror flips), wobbles, and sighs with relief;
//           - slack strings (7.4 s): the cross droops, her strings go slack and she flops down in a
//             happy heap for a rest... then she's yanked back up, startled, into a pose;
//           - a bow (6 s): a deep curtsy, her cap's bells jingling.
//   walk    a puppet's walk: her knees lifted high by the strings, her feet dangling down to the
//           floor, a little hop, the cross gliding along above her.
//   fight   her moves in turn: String Kick (a knee yanked up high, then the leg snapped out at you),
//           Pirouette Slap (a whirl on her toes, loose arms flung out) and Bell Bonk (a duck of the
//           head, then her cap's lobes whipped over at you, bells first).
//   marks   all her own (`ownEmotes`): a "!" bubble as she starts hunting you, a "?" when she loses
//           you, a giggle after landing a hit, z's when she naps (her strings slack), a sweat drop
//           when low, dizzy stars when beaten.
// Every effect is drawn here, live, in her own style: soft lilac swishes, bell jingles, the game's curvy
// sparkles.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat, cue, note, spring } from './fx.js';

const BIG = 1.3;
const LW = 1.6 / BIG;
// ---------- Her colours ----------
const INK = '#9a6a68';
const WOOD = ['#fff8f0', '#fbe6d2', '#eccaae', '#d0a284'];
const WOOD_INK = '#a8786a';
const MINT = ['#e2fbf2', '#9fe4cc', '#6cc4a8', '#4a9a82'];
const LILAC = ['#f2e8ff', '#c9b0f0', '#a088d6', '#7a64b0'];
const CREAM = ['#ffffff', '#fdf6ee', '#ece0d2', '#cdbcaa'];
const SUIT_INK = '#6a5a8e';
const GOLD = ['#fff4c0', '#f4c860', '#c49234', '#94681c'];
const HAIR = ['#f2c4a0', '#c8865e', '#9e6040', '#74422c'];
const HAIR_INK = '#6a3c2c';
const IRIS = ['#eadcff', '#a888e8', '#6e50b8', '#3e2a74'];
const LASH = '#4a2e3a';
const ROSE = '#f08aa4';
const STRING = '#e8e2f0';
const BAR = ['#e8c49a', '#c89a6a', '#9a7048'];

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
function chaikin(pts, n = 2, open = false) {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const o = open ? [q[0]] : [];
    const N = open ? q.length - 1 : q.length;
    for (let i = 0; i < N; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      o.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    if (open) o.push(q[q.length - 1]);
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
// ---------- Her head (head units about its middle, over her neck) ----------
const HO = [1.4, -17.6];
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

// ---------- Her face ----------
const FACES = {
  sweet: { lid: 0, shut: 'happy', bt: -0.1, by: 0.2, mw: 0.8, ms: 0.5, mo: 0, bl: 0.6, sm: 0 },
  delight: { lid: 1, shut: 'happy', bt: -0.2, by: 0.7, mw: 1, ms: 1, mo: 0.45, bl: 0.9, sm: 0 },
  giggle: { lid: 1, shut: 'happy', bt: -0.3, by: 0.5, mw: 0.9, ms: 0.9, mo: 0.3, bl: 1, sm: 0 },
  focus: { lid: 0, shut: 'happy', bt: 0.5, by: -0.1, mw: 0.6, ms: 0.1, mo: 0, bl: 0.55, sm: 0 },
  fierce: { lid: 0, shut: 'happy', bt: 0.9, by: -0.3, mw: 0.8, ms: -0.1, mo: 0.4, bl: 0.6, sm: 0.1 },
  startled: { lid: 0, shut: 'happy', bt: -0.3, by: 1.2, mw: 0.6, ms: 0, mo: 0.6, bl: 0.7, sm: 0.7 },
  wobbly: { lid: 0, shut: 'happy', bt: -0.6, by: 0.6, mw: 0.8, ms: -0.3, mo: 0.2, bl: 0.7, sm: 0.3 },
  bliss: { lid: 1, shut: 'sleep', bt: -0.4, by: 0.3, mw: 0.9, ms: 0.9, mo: 0.15, bl: 0.9, sm: 0 },
  hurt: { lid: 1, shut: 'squeeze', bt: -0.8, by: 0.2, mw: 0.8, ms: -0.7, mo: 0.55, bl: 0.7, sm: 0 },
  sleepy: { lid: 1, shut: 'sleep', bt: -0.2, by: -0.1, mw: 0.6, ms: 0.15, mo: 0.1, bl: 0.6, sm: 0 },
  dizzy: { lid: 1, shut: 'dizzy', bt: -0.5, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.4, bl: 0.6, sm: 0 },
  sad: { lid: 0, shut: 'happy', bt: -0.95, by: 0.3, mw: 0.7, ms: -0.6, mo: 0, bl: 0.5, sm: 0.15 },
  worried: { lid: 0, shut: 'happy', bt: -0.8, by: 0.5, mw: 0.7, ms: -0.4, mo: 0.15, bl: 0.6, sm: 0.1 },
  cross: { lid: 0, shut: 'happy', bt: 0.9, by: -0.3, mw: 0.8, ms: -0.45, mo: 0, bl: 0.55, sm: 0.1 },
  talk: { lid: 0, shut: 'happy', bt: 0, by: 0.3, mw: 0.8, ms: 0.3, mo: 0.4, bl: 0.6, sm: 0 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.6, 0.1, 0.8], [1.1, 0.4, 0.55], [0.9, 0.3, 0.25], [0.7, 0.2, 0], [0.8, 0.2, 0.6]];
const EYE = { w: 3.7, h: 4.2 };

function eye(ctx, a, x, y, side, f, look) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.mpUid ?? 0) * 0.9) % 5.1, 4.6, 4.7, 4.78, 4.92) : 0;
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
        ctx.moveTo(x - w, y - 0.2);
        ctx.quadraticCurveTo(x, y + h * 0.55, x + w, y - 0.2);
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
  ell(ctx, x, y, w, h);
  ctx.fillStyle = tone(a, '#fffefc');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, w, h);
  ctx.clip();
  const small = 1 - 0.3 * f.sm;
  const ix = x + side * 0.15 + (look?.[0] ?? 0) * 0.7;
  const iy = y + 0.45 + (look?.[1] ?? 0) * 0.5;
  const ir = [3.0 * small, 3.4 * small];
  const g = ctx.createLinearGradient(0, iy - ir[1], 0, iy + ir[1]);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.5, tone(a, IRIS[2]));
  g.addColorStop(1, tone(a, IRIS[1]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, IRIS[3]), 0.55);
  ctx.stroke();
  // the ring of glassy light inside the iris
  ell(ctx, ix, iy + 0.2, ir[0] * 0.66, ir[1] * 0.66);
  pen(ctx, tone(a, IRIS[0], 0.55), 0.35);
  ctx.stroke();
  ell(ctx, ix, iy + 0.25, 1.25 * small, 1.45 * small);
  ctx.fillStyle = tone(a, '#1e1238');
  ctx.fill();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.35);
  sg.addColorStop(0, 'rgba(120,70,110,0.3)');
  sg.addColorStop(1, 'rgba(120,70,110,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.2, w * 2.6, h * 0.9);
  // the glass glints: a soft rounded square, a small round one
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(ix - side * 1.0, iy - 1.3 * small, 1.15, 1.0, 0.15, 0, TAU);
  ctx.fill();
  ell(ctx, ix + side * 1.1, iy + 1.35 * small, 0.45, 0.45);
  ctx.fill();
  if (L > 0.01) {
    ctx.fillStyle = tone(a, WOOD[1]);
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
  // the painted lash line, neat, a little fuller at the outer end; a rose crease over it
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.95, y - h * 0.32);
  ctx.quadraticCurveTo(x - side * 0.1, y - h * 1.3, x + side * w * 1.02, y - h * 0.42);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, LASH), 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + side * w * 0.5, y - h * 0.95);
  ctx.quadraticCurveTo(x + side * w * 0.9, y - h * 0.8, x + side * (w + 0.6), y - h * 0.62);
  pen(ctx, tone(a, LASH), 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.55, y - h * 1.28);
  ctx.quadraticCurveTo(x + side * 0.4, y - h * 1.5, x + side * w * 0.95, y - h * 1.08);
  pen(ctx, tone(a, ROSE, 0.6), 0.45);
  ctx.stroke();
  ctx.restore();
}
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.by * 1);
  ctx.rotate(side * f.bt * 0.4);
  ctx.beginPath();
  ctx.moveTo(-1.5, 0.15);
  ctx.quadraticCurveTo(0, -0.6, 1.5, 0.15);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, HAIR[3]), 1.0);
  ctx.stroke();
  ctx.restore();
}
// A tiny painted heart of a mouth, opening and frowning by its numbers.
function mouth(ctx, a, x, y, f) {
  const w = 1.5 * f.mw;
  const cy = y - f.ms * 0.45;
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.3 - o * 0.3, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.6 + o * 2.4, x - w, cy);
    ctx.fillStyle = tone(a, '#b04060');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x + 0.1, y + o * 2, w * 0.6, o * 0.8);
    ctx.fillStyle = tone(a, '#f48aa4');
    ctx.fill();
    ctx.restore();
  } else {
    // (the painted heart: two little lobes over a soft point)
    ctx.beginPath();
    ctx.moveTo(x, cy + 0.5);
    ctx.quadraticCurveTo(x - w, cy + 0.1 + f.ms * 0.2, x - w * 0.7, cy - 0.45);
    ctx.quadraticCurveTo(x - 0.3, cy - 0.75, x, cy - 0.25);
    ctx.quadraticCurveTo(x + 0.3, cy - 0.75, x + w * 0.7, cy - 0.45);
    ctx.quadraticCurveTo(x + w, cy + 0.1 + f.ms * 0.2, x, cy + 0.5);
    ctx.fillStyle = tone(a, '#e0587a');
    ctx.fill();
    ell(ctx, x - 0.4, cy - 0.25, 0.3, 0.18);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
  }
}
// Her face's shape: full cheeks at eye level, a softly pointed chin.
const FACE = [[-15.6, -2], [-15, -8.6], [-11, -13.6], [-4, -15.8], [3.8, -15.8], [11, -13.6], [15, -8.6], [15.6, -2], [14.4, 5.4], [10.6, 10.6], [5, 14], [0.6, 15.2], [-4.2, 14], [-10, 10.8], [-14.2, 5.6]];
// ---------- Her hair (one shared light from above, one shine band) ----------
// The fringe: an even blunt round cut of five sections, longest in the middle, rising toward the
// temples, the hem just above her lashes; its splits rise toward her crown and fade.
const CUTS = [-12.4, -7.4, -2.8, 2.0, 6.8, 12.4];
const HEM = (x) => -3.4 - 2.2 * (x / 12.4) ** 2;
function fringePath(ctx, sway) {
  ctx.beginPath();
  ctx.moveTo(-13.6, -11);
  ctx.quadraticCurveTo(0, -17, 13.6, -11);
  for (let i = CUTS.length - 1; i > 0; i--) {
    const x1 = CUTS[i];
    const x0 = CUTS[i - 1];
    const sw = sway[i - 1] ?? 0;
    // (each section's end trimmed flat across with soft rounded corners, a little split up between
    // neighbours; its length a touch its own, following the round cut)
    const ye = HEM((x0 + x1) / 2) + [0.1, -0.15, 0.2, -0.1, 0.15][i - 1];
    ctx.lineTo(x1 - 0.15 + sw, ye - 1);
    ctx.quadraticCurveTo(x1 - 0.25 + sw, ye, x1 - 1 + sw, ye);
    ctx.lineTo(x0 + 1 + sw, ye);
    ctx.quadraticCurveTo(x0 + 0.25 + sw, ye, x0 + 0.15 + sw, ye - 1);
  }
  ctx.closePath();
}
function hairBack(ctx, a, mode) {
  // a short bob behind her head, below the cap, to her jaw
  smooth(ctx, [[-17.4, -6], [-16.6, 4], [-13.6, 10], [-8, 12.6], [8, 12.6], [13.6, 10], [16.6, 4], [17.4, -6], [12, -12], [-12, -12]]);
  paint(ctx, a, mode, HAIR[2], HAIR_INK);
}
function sideLock(ctx, a, mode, side, sw) {
  // a soft lock down the side of her face, outside her eye, a rounded end at her cheek
  const x0 = side * 13.4;
  const pts = [[x0 - side * 1.6, -10], [x0 + side * 1.8, -10], [x0 + side * 2.4 + sw * 0.4, -2], [x0 + side * 1.8 + sw, 6.4], [x0 + side * 0.2 + sw, 8.6], [x0 - side * 1.4 + sw * 0.8, 6], [x0 - side * 1.6 + sw * 0.4, -2]];
  smooth(ctx, pts);
  paint(ctx, a, mode, HAIR[1], HAIR_INK);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    const g = ctx.createLinearGradient(0, -10, 0, 9);
    g.addColorStop(0, tone(a, HAIR[2], 0.9));
    g.addColorStop(0.35, tone(a, HAIR[1], 0));
    g.addColorStop(1, tone(a, HAIR[2], 0.35));
    ctx.fillStyle = g;
    ctx.fillRect(x0 - 5, -11, 10, 21);
    ctx.restore();
  }
}
function fringe(ctx, a, mode, sway) {
  fringePath(ctx, sway);
  paint(ctx, a, mode, HAIR[1], HAIR_INK);
  if (mode !== 'fill') return;
  ctx.save();
  fringePath(ctx, sway);
  ctx.clip();
  // the one light, from above: darker up under the cap, lighter toward the cut, the cut's own edge a
  // clean deeper shade
  const g = ctx.createLinearGradient(0, -15, 0, -2);
  g.addColorStop(0, tone(a, HAIR[2]));
  g.addColorStop(0.5, tone(a, HAIR[1]));
  g.addColorStop(1, tone(a, HAIR[2], 0.9));
  ctx.fillStyle = g;
  ctx.fillRect(-16, -18, 32, 17);
  // the splits: a thin shade along each, rising toward the crown and fading
  for (let i = 1; i < CUTS.length - 1; i++) {
    const x = CUTS[i] + (sway[i] ?? 0);
    const gg = ctx.createLinearGradient(0, HEM(x), 0, HEM(x) - 6);
    gg.addColorStop(0, tone(a, HAIR[3], 0.75));
    gg.addColorStop(1, tone(a, HAIR[3], 0));
    ctx.beginPath();
    ctx.moveTo(x - 0.35, HEM(x) + 0.2);
    ctx.quadraticCurveTo(x - 0.2, HEM(x) - 3, x * 0.85, HEM(x) - 6.5);
    ctx.lineTo(x * 0.85 + 0.2, HEM(x) - 6.5);
    ctx.quadraticCurveTo(x + 0.4, HEM(x) - 3, x + 0.4, HEM(x) + 0.2);
    ctx.closePath();
    ctx.fillStyle = gg;
    ctx.fill();
  }
  // the one shine band across it, soft, fading at its ends, broken a little at each split
  for (let i = 0; i < CUTS.length - 1; i++) {
    const x0 = CUTS[i] + 0.7;
    const x1 = CUTS[i + 1] - 0.7;
    const y = -9.2 + 0.08 * ((x0 + x1) / 2) ** 2 * 0.05;
    const fade = 1 - Math.abs((x0 + x1) / 2) / 14;
    ctx.beginPath();
    ctx.moveTo(x0, y + 0.2);
    ctx.quadraticCurveTo((x0 + x1) / 2, y - 0.6, x1, y + 0.2);
    ctx.lineCap = 'round';
    pen(ctx, tone(a, HAIR[0], 0.75 * fade), 1.1);
    ctx.stroke();
  }
  ctx.restore();
}
// The jester cap: a soft dome over her crown with a gold band at its brim; two big soft lobes (mint and
// lilac) flopping out to each side on their own springs, a gold bell at each end.
function capLobe(ctx, a, mode, side, angs) {
  const root = [side * 4, -16];
  const pts = chain(root, angs, [6, 5.6, 4.6]);
  poly(ctx, tube(pts, [8.4, 7, 5, 3.4], 0.5));
  paint(ctx, a, mode, side < 0 ? MINT[1] : LILAC[1], side < 0 ? MINT[3] : LILAC[3]);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, tube(pts, [8.4, 7, 5, 3.4], 0.5));
    ctx.clip();
    glow(ctx, pts[1][0], pts[1][1] - 2, 5, side < 0 ? MINT[0] : LILAC[0], 0.8);
    glow(ctx, pts[2][0], pts[2][1] + 3, 4, side < 0 ? MINT[2] : LILAC[2], 0.6);
    ctx.restore();
  }
  const b = pts[3];
  ell(ctx, b[0], b[1] + 1.4, 1.9, 1.9);
  paint(ctx, a, mode, GOLD[1], GOLD[3]);
  if (mode === 'fill') {
    ell(ctx, b[0] - 0.5, b[1] + 0.9, 0.7, 0.6);
    ctx.fillStyle = tone(a, GOLD[0]);
    ctx.fill();
    ell(ctx, b[0], b[1] + 2.4, 0.9, 0.35);
    ctx.fillStyle = tone(a, GOLD[3]);
    ctx.fill();
  }
  return b;
}
function cap(ctx, a, mode) {
  const q = a.mpQ ?? {};
  const lob = q.lobes ?? [[-2.6, -2.9, -3.4], [-0.5, -0.2, 0.3]];
  // the far (lilac) lobe behind the dome, the near (mint) one over it
  q.bellF = capLobe(ctx, a, mode, 1, lob[1]);
  ctx.beginPath();
  ctx.moveTo(-14.6, -8.4);
  ctx.bezierCurveTo(-15.6, -21, 15.6, -21, 14.6, -8.4);
  ctx.quadraticCurveTo(0, -12, -14.6, -8.4);
  ctx.closePath();
  paint(ctx, a, mode, CREAM[1], LILAC[3]);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    // its two halves: mint on the near side, lilac on the far
    ctx.fillStyle = tone(a, MINT[1]);
    ctx.fillRect(-16, -22, 16, 14);
    ctx.fillStyle = tone(a, LILAC[1]);
    ctx.fillRect(0, -22, 16, 14);
    glow(ctx, -4, -17, 9, CREAM[0], 0.5);
    ctx.restore();
    // the gold band at its brim
    ctx.beginPath();
    ctx.moveTo(-14.7, -8.9);
    ctx.quadraticCurveTo(0, -12.6, 14.7, -8.9);
    pen(ctx, tone(a, GOLD[1]), 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, -9.4);
    ctx.quadraticCurveTo(0, -13, 14, -9.4);
    pen(ctx, tone(a, GOLD[0]), 0.5);
    ctx.stroke();
  }
  q.bellN = capLobe(ctx, a, mode, -1, lob[0]);
}
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.mpQ ?? {};
  const f = a.mpF;
  const turn = q.turn ?? 0.3;
  const tx = turn * 2.2;
  const sway = q.fringe ?? [0, 0, 0, 0, 0, 0];
  hairBack(ctx, a, mode);
  smooth(ctx, FACE);
  paint(ctx, a, mode, WOOD[1], WOOD_INK);
  if (mode === 'fill' && f) {
    ctx.save();
    smooth(ctx, FACE);
    ctx.clip();
    glow(ctx, tx - 2, -8, 13, WOOD[0], 0.9);
    glow(ctx, -14, 4, 7, WOOD[2], 0.5);
    glow(ctx, tx + 1, 15, 8, WOOD[2], 0.45);
    // the forehead's soft shade under her fringe (the skin's own shade, the cut's shape copied down)
    ctx.save();
    ctx.translate(0, 1.2);
    fringePath(ctx, sway);
    ctx.fillStyle = tone(a, WOOD[2], 0.45);
    ctx.fill();
    ctx.restore();
    ctx.restore();
    // painted round rosy cheeks, a dot of shine on each
    for (const [cx, s] of [[tx - 8.4, 0.85], [tx + 8.6, 1]]) {
      ell(ctx, cx, 7, 2.6, 2.1);
      ctx.fillStyle = tone(a, '#ff9ab0', (0.35 + 0.4 * f.bl) * s);
      ctx.fill();
      ell(ctx, cx - 0.7, 6.3, 0.5, 0.4);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fill();
    }
    const ex = (s) => (s < 0 ? -5.8 + tx * 0.7 : 6 + tx);
    for (const s of [-1, 1]) brow(ctx, a, ex(s) + s * 0.2, -4.8, s, f);
    for (const s of [-1, 1]) eye(ctx, a, ex(s), 2.2, s, f, q.look);
    // the little painted gold star under her near eye
    ctx.save();
    ctx.translate(tx + 10.2, 9.4);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const an = -Math.PI / 2 + (i / 10) * TAU;
      const r = i % 2 ? 0.45 : 1.05;
      if (i) ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
      else ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r);
    }
    ctx.closePath();
    ctx.lineJoin = 'round';
    pen(ctx, tone(a, GOLD[2]), 0.45);
    ctx.stroke();
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    ctx.restore();
    // a tiny nose light, the mouth
    ell(ctx, tx + 1.2, 6.4, 0.7, 0.4);
    ctx.fillStyle = tone(a, WOOD[2], 0.8);
    ctx.fill();
    mouth(ctx, a, tx + 1, 10.2, f);
    if (q.sweat >= 0) sweat(ctx, tx - 13, -2 + q.sweat * 3, 1.1);
  }
  const ls = q.locks ?? [0, 0];
  sideLock(ctx, a, mode, -1, ls[0]);
  sideLock(ctx, a, mode, 1, ls[1]);
  fringe(ctx, a, mode, sway);
  cap(ctx, a, mode);
  WK = 1;
  ctx.restore();
}

// ---------- Her suit, ruff, joints and slippers ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
// The harlequin tunic: diamonds of mint, lilac and cream in rows, its pom-pom buttons, a sash of gold at
// the waist; cut from her own outline (her body's skin is the wood under it).
function tunic(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const C = (p) => ptOf(a, D, 'chest', p);
  const W = (p) => ptOf(a, D, 'waistB', p);
  const T = (p) => ptOf(a, D, 'torso', p);
  const st = D.J.stern;
  const nv = D.J.navel;
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fillRect(-60, -90, 120, 100);
  // the diamonds, laid out on the chest and carried by its bones
  const cols = [MINT[1], LILAC[1], CREAM[1], LILAC[1], MINT[1]];
  for (let r = 0; r < 5; r++) {
    for (let c = -3; c <= 3; c++) {
      const cx = st[0] + c * 6 + (r % 2) * 3;
      const cy = st[1] + 1 + r * 5.6;
      const P = r < 3 ? C : r < 4 ? W : T;
      const pts = [[cx, cy - 2.8], [cx + 3, cy], [cx, cy + 2.8], [cx - 3, cy]].map(P);
      poly(ctx, pts);
      ctx.fillStyle = tone(a, cols[(c + 3 + r) % 5]);
      ctx.fill();
    }
  }
  const gg = C([st[0] + 4, st[1] + 6]);
  glow(ctx, gg[0], gg[1], 5, CREAM[0], 0.5);
  const sh = W([nv[0] - 6, nv[1]]);
  glow(ctx, sh[0], sh[1], 6, LILAC[3], 0.25);
  // the gold sash at her waist
  ctx.beginPath();
  ctx.moveTo(...W([nv[0] - 30, nv[1] - 1.2]));
  ctx.lineTo(...W([nv[0] + 30, nv[1] - 1.2]));
  pen(ctx, tone(a, GOLD[1]), 1.2);
  ctx.stroke();
  ctx.restore();
  // pom-pom buttons down her front
  for (const [i, P, p] of [[0, C, [st[0] + 4.6, st[1] + 4]], [1, C, [st[0] + 5, st[1] + 9.6]], [2, W, [nv[0] + 5.2, nv[1] - 5.4]]]) {
    const b = P(p);
    ell(ctx, b[0], b[1], 1.1, 1.05);
    ctx.fillStyle = tone(a, i % 2 ? MINT[2] : LILAC[2]);
    ctx.fill();
    ell(ctx, b[0] - 0.3, b[1] - 0.35, 0.45, 0.4);
    ctx.fillStyle = tone(a, i % 2 ? MINT[0] : LILAC[0]);
    ctx.fill();
  }
}
// The ruff: a ring of soft rounded pleats round her neck, a lilac edge; the pleats ripple on springs.
function ruff(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const rip = (a.mpQ ?? {}).ruff ?? 0;
  const pts = [];
  const N = 22;
  for (let i = 0; i < N; i++) {
    const an = (i / N) * TAU;
    const r = 1 + 0.12 * Math.cos(an * 11);
    pts.push([st[0] + 1 + Math.cos(an) * 12.6 * r, st[1] - 0.8 + Math.sin(an) * 3.8 * r + Math.sin(an * 2 + rip) * 0.3]);
  }
  smooth(ctx, pts);
  paint(ctx, a, mode, CREAM[0], LILAC[3]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    // the pleats: soft shades between them, the lilac edge
    for (let i = 0; i < 11; i++) {
      const an = (i / 11) * TAU + Math.PI / 11;
      ctx.beginPath();
      ctx.moveTo(st[0] + 1 + Math.cos(an) * 4, st[1] - 0.8 + Math.sin(an) * 1.2);
      ctx.lineTo(st[0] + 1 + Math.cos(an) * 13, st[1] - 0.8 + Math.sin(an) * 4);
      pen(ctx, tone(a, CREAM[3], 0.5), 0.6);
      ctx.stroke();
    }
    smooth(ctx, pts);
    pen(ctx, tone(a, LILAC[1]), 1.4);
    ctx.stroke();
    glow(ctx, st[0] - 3, st[1] - 3, 7, '#ffffff', 0.6);
    ctx.restore();
  }
  ctx.restore();
}
// A short puffed sleeve over her upper arm (rig space).
function sleeve(ctx, a, mode, D, k) {
  const S = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const M = [mix(S[0], E[0], 0.5), mix(S[1], E[1], 0.5)];
  const an = Math.atan2(E[1] - S[1], E[0] - S[0]);
  const L = Math.hypot(E[0] - S[0], E[1] - S[1]);
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const u = (i / 16) * TAU;
    pts.push([Math.cos(u) * (L * 0.34 + 0.4), Math.sin(u) * 2.1 * (1 + 0.12 * Math.max(0, Math.cos(u)))]);
  }
  ctx.save();
  ctx.translate(mix(S[0], M[0], 0.4), mix(S[1], M[1], 0.4));
  ctx.rotate(an);
  smooth(ctx, pts);
  if (mode === 'line') {
    pen(ctx, SUIT_INK, LW * 1.25);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, k === 'N' ? LILAC[1] : LILAC[2]);
    ctx.fill();
    glow(ctx, -0.6, -1.2, 2.4, LILAC[0], k === 'N' ? 0.8 : 0.3);
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    ctx.fillStyle = tone(a, k === 'N' ? MINT[1] : MINT[2]);
    ctx.fillRect(pts[0][0] - 1, -4, 1.8, 8);
    ctx.restore();
  }
  ctx.restore();
}
// A bloomer leg to the knee, mint, a lilac band at its hem (rig space).
function bloomer(ctx, a, mode, D, k) {
  const H = ptOf(a, D, `thigh${k}`, D.J[`hip${k}`]);
  const K = ptOf(a, D, `shin${k}`, D.J[`knee${k}`]);
  const an = Math.atan2(K[1] - H[1], K[0] - H[0]);
  const L = Math.hypot(K[0] - H[0], K[1] - H[1]);
  ctx.save();
  ctx.translate(H[0], H[1]);
  ctx.rotate(an);
  const pts = chaikin([[-2.4, -3.4], [L * 0.55, -3.9], [L * 0.86, -3], [L * 0.94, 0], [L * 0.86, 3], [L * 0.55, 3.9], [-2.4, 3.4]], 2);
  poly(ctx, pts);
  if (mode === 'line') {
    pen(ctx, SUIT_INK, LW * 1.25);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, k === 'N' ? MINT[1] : MINT[2]);
    ctx.fill();
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    glow(ctx, L * 0.35, -1.6, 3, MINT[0], k === 'N' ? 0.7 : 0.25);
    ctx.fillStyle = tone(a, k === 'N' ? LILAC[1] : LILAC[2]);
    ctx.fillRect(L * 0.8, -5, 1.8, 10);
    ctx.restore();
  }
  ctx.restore();
}
// A round wooden ball joint (rig space).
function ball(ctx, a, mode, p, r, far) {
  ell(ctx, p[0], p[1], r, r);
  if (mode === 'line') {
    pen(ctx, WOOD_INK, LW * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, far ? WOOD[2] : WOOD[1]);
    ctx.fill();
    ell(ctx, p[0] - r * 0.3, p[1] - r * 0.35, r * 0.4, r * 0.32);
    ctx.fillStyle = tone(a, WOOD[0], 0.9);
    ctx.fill();
  }
}
function joints(ctx, a, mode, D, k, which) {
  const far = k === 'F';
  if (which === 'arm') {
    ball(ctx, a, mode, ptOf(a, D, `arm${k}f`, D.J[`el${k}`]), 1.7, far);
    ball(ctx, a, mode, ptOf(a, D, `arm${k}f`, D.J[`wr${k}`]), 1.3, far);
  } else ball(ctx, a, mode, ptOf(a, D, `shin${k}`, D.J[`knee${k}`]), 1.9, far);
}
// A mint jester slipper with a curled toe and a lilac pom.
function slipper(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 3.4, p[1] - 2.6], [p[0] + 0.6, p[1] - 3.4], [p[0] + 4.6, p[1] - 1.6], [p[0] + 8.4, p[1] - 3.6], [p[0] + 9.4, p[1] - 1.4], [p[0] + 7.6, p[1] + 2.6], [p[0] - 3.8, p[1] + 2.8], [p[0] - 4.4, p[1] + 0.2]]);
  paint(ctx, a, mode, near ? MINT[1] : MINT[2], SUIT_INK);
  ell(ctx, p[0] + 9.2, p[1] - 3.6, 1.5, 1.5);
  paint(ctx, a, mode, near ? LILAC[1] : LILAC[2], SUIT_INK);
  if (mode === 'fill') {
    glow(ctx, p[0] + 2, p[1] - 1.2, 3.4, MINT[0], near ? 0.7 : 0.3);
    ell(ctx, p[0] + 8.8, p[1] - 4, 0.6, 0.5);
    ctx.fillStyle = tone(a, LILAC[0]);
    ctx.fill();
  }
  ctx.restore();
}
// Her wooden hands: a soft mitten of painted wood, a thumb.
function hand(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  ctx.scale(1.15, 1.15);
  const near = k === 'N';
  const open = (a.mpQ ?? {})[`open${k}`] ?? 0;
  smooth(ctx, [[-3.4, -3], [-1, -4.2], [2.2, -4], [3.8, -1.2], [3.6 + open, 2.6], [1.2, 4.6 + open * 0.6], [-1.8, 4.4], [-3.8, 1.4]]);
  paint(ctx, a, mode, near ? WOOD[1] : WOOD[2], WOOD_INK, LW / 1.15);
  if (mode === 'fill') glow(ctx, -0.6, -1, 2.6, WOOD[0], near ? 0.8 : 0.3);
  ctx.restore();
}

// ---------- Her strings and her cross (rig space) ----------
function crossAt(a) {
  const q = a.mpQ ?? {};
  return { x: q.barX ?? 0, y: q.barY ?? -52, ang: q.barA ?? 0 };
}
function cross(ctx, a, mode) {
  const B = crossAt(a);
  ctx.save();
  ctx.translate(B.x, B.y);
  ctx.rotate(B.ang);
  ctx.scale(0.8, 0.8);
  const bar = (x0, y0, x1, y1, w) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineCap = 'round';
    if (mode === 'line') pen(ctx, BAR[2], w + LW * 2);
    else pen(ctx, tone(a, BAR[1]), w);
    ctx.stroke();
  };
  bar(-12, 0, 12, 0, 2.2);
  bar(0, -5, 0, 5, 2.2);
  bar(-6, -3.4, -6, 3.4, 1.6);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(-11.4, -0.5);
    ctx.lineTo(11.4, -0.5);
    pen(ctx, tone(a, BAR[0], 0.8), 0.6);
    ctx.stroke();
    for (const x of [-12, 12, 0]) {
      ell(ctx, x, x === 0 ? -5 : 0, 1.2, 1.2);
      ctx.fillStyle = tone(a, GOLD[1]);
      ctx.fill();
    }
  }
  ctx.restore();
}
// Each string's two ends: on the cross, and on her (crown, wrists, knees).
function strings(ctx, a, D) {
  const q = a.mpQ ?? {};
  const B = crossAt(a);
  const ca = Math.cos(B.ang);
  const sa = Math.sin(B.ang);
  const onBar = (u, v) => [B.x + (u * ca - v * sa) * 0.8, B.y + (u * sa + v * ca) * 0.8];
  const ends = [
    [onBar(0, -5), headAt(a, D, [0, -16])],
    [onBar(12, 0), ptOf(a, D, 'armNf', D.J.wrN)],
    [onBar(-12, 0), ptOf(a, D, 'armFf', D.J.wrF)],
    [onBar(-6, 3.4), ptOf(a, D, 'shinN', D.J.kneeN)],
    [onBar(-6, -3.4), ptOf(a, D, 'shinF', D.J.kneeF)],
  ];
  const slack = q.slack ?? 0;
  ctx.save();
  ctx.lineCap = 'round';
  for (const [p0, p1] of ends) {
    // (taut, a straight line; slack, it sags into a soft curve)
    const mid = [mix(p0[0], p1[0], 0.5) + slack * 6, mix(p0[1], p1[1], 0.5) + slack * 10];
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.quadraticCurveTo(...mid, ...p1);
    pen(ctx, tone(a, '#b8acc8', 0.75), 0.75);
    ctx.stroke();
    pen(ctx, tone(a, STRING, 0.95), 0.35);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Her act and her fight ----------
const SWINGS = ['kick', 'spin', 'bells'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.mpN ?? 0) % SWINGS.length]);
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'sweet', look: [0.4, 0], turn: 0.3, sweat: -1, fx: null, spin: 0, openN: 0, openF: 0, slack: 0, barTilt: 0, barDip: 0, barSpin: 0, lobeK: 0 };
  a.mpQ = q;
  a.mpUid = (m.uid ?? 0) % 7;
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
  const since = now - (m.attackAt ?? -9);
  const anticK = m.windup > 0 ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.35), 0, 1) : 0;
  const swinging = alive && (anticK > 0 || (since >= 0 && since < 0.9));
  if (swinging && !st.mpAtk) {
    st.mpN = (st.mpN ?? (m.uid ?? 0)) + 1;
    st.mpPick = pickSwing(m, st);
  }
  st.mpAntic = swinging ? Math.max(anticK, st.mpAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.9;
  st.mpAtk = swinging;
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;
  const busy = !alive || swinging;
  if (busy) st.mpFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.mpFreeAt ?? -9)) / 0.35);

  // Standing on her strings: a puppet's rest, arms hanging a little out, her head tipped, a gentle
  // bob as the cross breathes above her.
  const bob = Math.sin(t * 1.9);
  go({ shN: 12, elN: -22, hwN: 10, shF: -10, elF: -20, hwF: -10, tilt: -1, head: 5 + bob * 2, chest: breath * 0.6, lift: 0.008 * (bob + 1) }, 1);
  if (walkW > 0.01) {
    // the puppet walk: each knee lifted high by its string in turn, the feet dangling to the floor
    const u = a.blkidU ?? a.wp ?? 0;
    const lN = Math.max(0, Math.sin(u * TAU));
    const lF = Math.max(0, -Math.sin(u * TAU));
    add({ fyN: -0.22 * lN, fyF: -0.22 * lF, shN: -20 * lF, shF: -20 * lN, lift: 0.02 * Math.abs(Math.sin(u * TAU)), head: Math.sin(u * TAU * 2) * 2 }, walkW);
    q.turn = mix(q.turn, 0.5, walkW);
  }
  if (fighting && !busy) {
    go({ shN: -40, elN: -60, shF: -30, elF: -50, tilt: 3, head: 0 }, 0.8 * freeK);
    say('focus');
    q.turn = 0.5;
  }
  if (fighting && !st.mpHunt) st.mpBangAt = now;
  if (!fighting && st.mpHunt && alive) st.mpLostAt = now;
  st.mpHunt = fighting;
  q.bang = now - (st.mpBangAt ?? -9);
  q.huh = now - (st.mpLostAt ?? -9);
  if (alive && !busy && q.bang >= 0 && q.bang < 0.9) {
    const k = win(q.bang, 0, 0.12, 0.5, 0.9) * freeK;
    go({ head: -10, tilt: -4, lift: 0.03 }, k);
    q.barDip = -0.6 * k;
    say('startled', k);
  }
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // a giggle, a hand to her mouth
    const k = win(gloat, 0, 0.25, 0.9, 1.4) * freeK;
    go({ shN: -130, elN: -120, head: -4 + Math.sin(gloat * 18) * 3, tilt: -2 }, k);
    say('giggle', k);
    q.fx = { kind: 'gloat', u: gloat };
  }
  if (!alive) {
    // beaten: her strings cut, she drops in a heap, the cross tumbling away
    st.mpDeadAt ??= now;
    const u = now - st.mpDeadAt;
    go({ drop: 0.9, tilt: 10, head: 28, shN: 40, elN: -10, shF: 50, elF: -10, fxN: 0.5, fxF: 0.2, hwN: 30, hwF: 20 });
    q.mood = 'dizzy';
    q.turn = 0.2;
    q.slack = 1;
    q.cut = u;
    q.fx = { kind: 'beaten', u };
  } else st.mpDeadAt = undefined;

  if (alive) {
    if (swinging) {
      const kind = st.mpPick ?? 'kick';
      const hitK = struck ? (since < 0.1 ? sstep(since / 0.1) : 1 - sstep((since - 0.3) / 0.45)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.mpAntic) * (since < 0.1 ? 1 : 0) : sstep(anticK);
      if (kind === 'kick') {
        // String Kick: her knee yanked up high by its string, arms jerked; then the leg snapped out
        go({ fxN: 0.15, fyN: -0.6, shN: -60, elN: -40, shF: 20, elF: -30, tilt: -6, head: -4 }, wK);
        go({ fxN: 0.95, fyN: -0.5, tilt: -10, shN: 30, elN: -20, shF: -60, elF: -20, x: 0.04 }, hitK);
        q.barTilt = -0.3 * wK + 0.4 * hitK;
        q.barDip = -0.5 * wK;
        say(hitK > 0.2 ? 'fierce' : 'focus');
        q.fx = { kind: struck ? 'kick' : 'ready', u: struck ? since : now };
      } else if (kind === 'spin') {
        // Pirouette Slap: up on her toes, arms pulled in; a whirl with her loose arms flung out
        go({ lift: 0.03, shN: -20, elN: -110, shF: -20, elF: -110, fyN: -0.2 }, wK);
        const turnU = struck ? clamp(since / 0.5, 0, 1) : 0;
        q.spin = sstep(turnU);
        go({ shN: -90, elN: -6, shF: -90, elF: -6, hwN: 30, hwF: 30, x: 0.05 * Math.sin(Math.PI * turnU) }, hitK);
        q.openN = hitK;
        q.openF = hitK;
        q.barSpin = q.spin * TAU * 0.25;
        say(hitK > 0.2 ? 'giggle' : 'focus');
        q.fx = { kind: struck ? 'spin' : 'ready', u: struck ? since : now };
      } else {
        // Bell Bonk: a duck of her head, the cap's lobes swung back; then whipped over at you, bells first
        go({ head: -18, tilt: -8, shN: 10, elN: -30 }, wK);
        go({ head: 26, tilt: 14, x: 0.05, shN: 20, elN: -20, shF: 30, elF: -20 }, hitK);
        q.lobeK = -wK + hitK * 1.6;
        say(hitK > 0.2 ? 'fierce' : 'focus');
        q.fx = { kind: struck ? 'bells' : 'ready', u: struck ? since : now };
      }
    } else if (hurt) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -10, head: -14, x: -0.02, shN: -50, elN: -10, shF: -40, elF: -10 }, k);
      say('hurt', k * 2);
      q.barDip = 0.5 * k;
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const nap = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
    st.mpNap = mix(st.mpNap ?? 0, nap && !busy ? 1 : 0, 1 - Math.exp(-dt * 3));
    if (st.mpNap > 0.01) {
      // a nap on slack strings: sat down, her head on one side
      const k = sstep(st.mpNap);
      go({ drop: 0.55, head: 18 + Math.sin(t * 1.1) * 2, tilt: 6, shN: 20, elN: -20, shF: 30, elF: -20, fxN: 0.3 }, k);
      q.slack = Math.max(q.slack, k * 0.8);
      if (k > 0.5) {
        q.mood = 'sleepy';
        q.fx = { kind: 'nap', u: t };
      }
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.mpCalm = mix(st.mpCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.mpCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, q, sstep(st.mpCalm), t, now, st);
    if (cineMood && !busy) q.mood = { angry: 'cross', happy: 'delight', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !busy) {
      if (!cineMood) q.mood = q.mood === 'sweet' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking) q.mood = 'talk';
  }
  q.turn = spring(st, 'mpTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.sweet;
  const f = (st.mpF ??= { ...FACES.sweet, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'bt', 'by', 'mw', 'ms', 'mo', 'bl', 'sm']) f[k] = mix(f[k], tgt[k], k === 'lid' ? 1 - Math.exp(-dt * (tgt.lid > f.lid ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.mpF = f;
  const sp = q.spin % 1;
  st.mpFlip = q.spin > 0 && sp > 0.25 && sp < 0.75;
  // springs: the cap's lobes, the fringe's sections and side locks, the ruff, and the cross above
  const kick = (st.mpLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.mpLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.mpLast = out.head;
  st.mpLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  const headR = (((out.head ?? 0) + (out.tilt ?? 0)) * Math.PI) / 180;
  const lk = q.lobeK;
  const lobe = (side, i, base) => spring(st, `lb${side}${i}`, base - headR * (0.5 + i * 0.15) + side * lk * (0.5 + i * 0.4) + Math.sin(t * 1.4 + i * 0.6 + side) * 0.05 + step * 0.08 * (i + 1), 60 - i * 8, 5.5, dt, kick * 0.012 * (i + 1));
  q.lobes = [[0, 1, 2].map((i) => lobe(-1, i, [-2.6, -2.9, -3.4][i])), [0, 1, 2].map((i) => lobe(1, i, [-0.5, -0.2, 0.3][i]))];
  // (the fringe's sections each on their own little spring, stiff, never across her eyes)
  q.fringe = [0, 1, 2, 3, 4, 5].map((i) => clamp(spring(st, `fr${i}`, Math.sin(t * 1.3 + i * 1.1) * 0.08 - headR * 0.6, 160 + i * 12, 14, dt, kick * 0.01), -0.6, 0.6));
  q.locks = [0, 1].map((i) => clamp(spring(st, `lk${i}`, -headR * 2 + Math.sin(t * 1.2 + i * 2) * 0.2 + step * 0.4, 90, 8, dt, kick * 0.02), -1.5, 1.5));
  q.ruff = t * 2 + step;
  // the cross floats above her head, following it with a lag, tilting and dipping as it works her
  const crownP = (out.x ?? 0) * 36;
  const dip = q.barDip - (q.slack ?? 0) * 0.5;
  q.barX = spring(st, 'barX', crownP + 2, 50, 9, dt);
  q.barY = -52 + spring(st, 'barY', dip * 12 + Math.sin(t * 1.9) * 1.2 - (out.drop ?? 0) * 0 , 70, 9, dt);
  q.barA = spring(st, 'barA', q.barTilt + Math.sin(t * 0.9) * 0.05 + q.barSpin + (q.slack ?? 0) * 0.35, 60, 7, dt, kick * 0.004);
}
const PIECES = [
  { name: 'jig', t0: 0.4, len: 6.8 },
  { name: 'tangle', t0: 7.8, len: 7.2 },
  { name: 'slack', t0: 15.6, len: 7.4 },
  { name: 'bow', t0: 23.6, len: 6 },
];
function idleAct(m, a, out, go, add, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.mpPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.mpPiece = cur.name;
      else return;
    }
  } else {
    st.mpPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'jig') {
    // her knees jerked up in turn by the strings, arms flapping, a little hop on each
    const k = win(u, 0, 0.4, 6.2, 6.8);
    const on = win(u, 0.4, 0.8, 5.6, 6.2);
    const ph = u * TAU * 1.4;
    const lN = Math.max(0, Math.sin(ph));
    const lF = Math.max(0, -Math.sin(ph));
    add({ fyN: -0.4 * lN * on, fyF: -0.4 * lF * on, fxN: 0.15 * lN * on, fxF: 0.1 * lF * on, lift: 0.03 * Math.abs(Math.sin(ph)) * on }, k * w);
    go({ shN: -70 + Math.sin(ph) * 40, elN: -30, shF: -70 - Math.sin(ph) * 40, elF: -30, head: Math.sin(ph) * 6 }, on * k * w);
    if (at(k)) {
      q.barTilt = Math.sin(ph) * 0.25 * on;
      q.mood = 'delight';
      q.openN = on;
      q.openF = on;
      if (on > 0.5) q.fx = { kind: 'jig', u };
    }
  } else if (cur.name === 'tangle') {
    // the cross spins and her strings twist; she twirls round and round to undo them, wobbles, sighs
    const k = win(u, 0, 0.5, 6.6, 7.2);
    const twist = win(u, 0.4, 1.4, 1.6, 2.0);
    const turns = u > 2 && u < 4.4 ? sstep((u - 2) / 2.4) * 3 : 0;
    const wob = win(u, 4.4, 4.6, 5.4, 5.8);
    go({ shN: -30, elN: -80, shF: -20, elF: -80, head: -6 }, twist * k * w);
    go({ shN: -80, elN: -20, shF: -80, elF: -20, lift: 0.02 }, (turns > 0 && turns < 3 ? 1 : 0.001) * k * w);
    go({ tilt: Math.sin(u * 14) * 6, head: Math.sin(u * 12) * 8 }, wob * k * w);
    if (at(k)) {
      q.spin = turns;
      q.barSpin = twist * 1.2 - turns * 0.4;
      q.mood = u < 2 ? 'worried' : u < 4.4 ? 'focus' : u < 5.8 ? 'wobbly' : 'delight';
      if (u > 5.8) q.fx = { kind: 'phew', u: u - 5.8 };
    }
  } else if (cur.name === 'slack') {
    // the cross droops, her strings go slack: she flops down in a happy heap for a rest... then
    // she's yanked back up, startled, into a pose
    const k = win(u, 0, 0.4, 6.8, 7.4);
    const flop = sstep((u - 0.5) / 0.6) * (1 - sstep((u - 4.6) / 0.18));
    const yank = win(u, 4.6, 4.75, 6.2, 6.9);
    go({ drop: 0.8, head: 26, tilt: 8, shN: 40, elN: -10, shF: 46, elF: -10, hwN: 30, hwF: 20, fxN: 0.4, fxF: 0.1 }, flop * k * w);
    go({ lift: 0.04, shN: -150, elN: -20, shF: -40, elF: -20, head: -6, fyN: -0.3 }, yank * k * w);
    if (at(k)) {
      q.slack = flop;
      q.barDip = -0.4 * yank;
      q.mood = u < 0.6 ? 'sweet' : u < 4.6 ? 'bliss' : u < 5.3 ? 'startled' : 'delight';
      if (u > 1.4 && u < 4.4) q.fx = { kind: 'rest', u: u - 1.4 };
      if (u > 4.6 && u < 5.4) q.fx = { kind: 'yank', u: u - 4.6 };
    }
  } else {
    // a deep curtsy, her cap's bells jingling
    const k = win(u, 0, 0.4, 5.4, 6);
    const bow = win(u, 0.6, 1.6, 3.4, 4.4);
    go({ drop: 0.24, tilt: 16, head: 20, shN: 30, elN: -20, shF: 40, elF: -20, fxF: -0.35 }, bow * k * w);
    if (at(k)) {
      q.lobeK = bow * 0.6 + Math.sin(u * 10) * 0.15 * bow;
      q.barDip = 0.4 * bow;
      q.mood = bow > 0.4 ? 'delight' : 'sweet';
      if (bow > 0.5) q.fx = { kind: 'bow', u: u - 1.6 };
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
  // her marks sit in a diamond-cornered bubble, a harlequin patch
  smooth(ctx, [[0, -5.4], [4.6, -3.4], [5.2, 0.6], [2.6, 4.2], [0, 5.4], [-2.6, 4.2], [-5.2, 0.6], [-4.6, -3.4]]);
  ctx.fillStyle = '#fffcff';
  ctx.fill();
  pen(ctx, mark === '!' ? '#a088d6' : '#4a9a82', 0.95);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#7a64b0' : '#4a9a82';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.8);
    ctx.lineTo(0, 0.4);
  } else {
    ctx.moveTo(-1.4, -1.6);
    ctx.quadraticCurveTo(-1.1, -3.3, 0.4, -3.1);
    ctx.quadraticCurveTo(1.9, -2.8, 1.3, -1.2);
    ctx.quadraticCurveTo(0.3, -0.5, 0.2, 0.5);
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
  pen(ctx, '#a088d6', 1.3);
  ctx.stroke();
  pen(ctx, '#faf6ff', 0.55);
  ctx.stroke();
  ctx.restore();
}
function swish(ctx, cx, cy, r, a0, a1, w, al, col = '#fbf6ff', rim = '#b8a0e8') {
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
  const q = a.mpQ ?? {};
  // the cross over her head and its strings, behind her (so a string never crosses her face)
  if (!(q.cut >= 0)) {
    strings(ctx, a, D);
    for (const mode of ['line', 'fill']) cross(ctx, a, mode);
  }
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.mpQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = (a.flip ? -1 : 1) * (a.mpSpun ? -1 : 1);
  const crown = headAt(a, D, [0, -22]);
  const hd = headAt(a, D, [3, 0]);
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0) bubble(ctx, crown[0] + 8, crown[1] - 4, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0) bubble(ctx, crown[0] + 8, crown[1] - 4, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  const toeN = ptOf(a, D, 'footN', [D.J.ankN[0] + 8, D.J.ankN[1] - 1]);
  if (X.kind === 'ready') {
    sparkle(ctx, toeN[0] + 2, toeN[1] - 3, 1.4 + Math.sin(t * 9) * 0.5, 0.7, '#f2e8ff');
  } else if (X.kind === 'kick') {
    const k = clamp(u / 0.35, 0, 1);
    if (u < 0.45) {
      swish(ctx, toeN[0] - 8, toeN[1] + 4, 12, -1.4, -1.4 + 1.6 * k, 3.4, 1 - k * 0.7);
      for (let i = 0; i < 3; i++) star(ctx, toeN[0] + 3 + Math.cos(i * 1.2 - 1) * (2 + k * 6), toeN[1] + Math.sin(i * 1.2 - 1) * (2 + k * 5), 1.8 * (1 - k * 0.5), i, 1 - k * 0.6);
    }
  } else if (X.kind === 'spin') {
    const k = clamp(u / 0.5, 0, 1);
    if (u < 0.6) {
      swish(ctx, hd[0] - 3, hd[1] + 16, 13, -0.6 + k * 4, -0.6 + k * 4 + 2.2, 3, (1 - k) * 0.9);
      for (let i = 0; i < 3; i++) sparkle(ctx, hd[0] + Math.cos(k * 8 + i * 2) * 12, hd[1] + 14 + Math.sin(k * 8 + i * 2) * 3, 1.6 * (1 - k), 1 - k, '#f2e8ff');
    }
  } else if (X.kind === 'bells') {
    const k = clamp(u / 0.4, 0, 1);
    if (u > 0.02 && u < 0.5) {
      for (let i = 0; i < 3; i++) {
        const an = -1 + i * 0.8;
        star(ctx, hd[0] + 14 + Math.cos(an) * (3 + k * 7), hd[1] + 2 + Math.sin(an) * (3 + k * 6), 1.9 * (1 - k * 0.5), an, 1 - k * 0.6);
      }
      cue(ctx, 'JINGLE!', hd[0] + 22, hd[1] - 14, 6, fl, -0.1, '#7a64b0');
    }
  } else if (X.kind === 'jig') {
    const v = (u * 0.7) % 1;
    note(ctx, crown[0] + 8 + v * 3, crown[1] + 6 - v * 8, 1.3, -0.2, Math.sin(Math.PI * v) * 0.9, '#a088d6');
  } else if (X.kind === 'phew' || X.kind === 'rest') {
    if (X.kind === 'rest') {
      const v = (u * 0.5) % 1;
      note(ctx, crown[0] + 6 + v * 3, crown[1] + 12 - v * 8, 1.2, -0.2, Math.sin(Math.PI * v) * 0.8, '#f08aa4');
    } else if (u < 0.8) cue(ctx, 'phew', hd[0] + 16, hd[1] - 12, 5.5, fl, -0.1, '#7a64b0');
  } else if (X.kind === 'yank') {
    if (u < 0.8) bubble(ctx, crown[0] + 8, crown[1] - 4, '!', u, 0.8, fl);
  } else if (X.kind === 'bow' || X.kind === 'gloat') {
    const v = clamp(u / 1.2, 0, 1);
    const b = q.bellN ? headAt(a, D, q.bellN) : crown;
    sparkle(ctx, b[0] - 2, b[1] - 2 - v * 4, 1.6 * Math.sin(Math.PI * v), 1, '#fff6c8');
    note(ctx, crown[0] + 8 + v * 3, crown[1] + 2 - v * 8, 1.4, -0.2, Math.sin(Math.PI * v), '#a088d6');
    if (X.kind === 'gloat' && u < 1) cue(ctx, 'tee hee', hd[0] + 16, hd[1] - 12, 5.5, fl, -0.1, '#7a64b0');
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) sparkle(ctx, hd[0] - 6 - v * 6 + i * 4, hd[1] - 8 - v * 5 - i * 2.4, 1.6 * (1 - v), 1 - v, '#f2e8ff');
  } else if (X.kind === 'nap') {
    for (let i = 0; i < 3; i++) {
      const v = (u * 0.45 + i / 3) % 1;
      zee(ctx, crown[0] + 6 + v * 7, crown[1] + 6 - v * 11, 0.75 + v * 0.5, Math.sin(Math.PI * v), fl);
    }
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] + 6, 8, t, 3);
    // the cut strings floating down, the cross tumbling away
    const v = clamp(u / 1.4, 0, 1);
    ctx.save();
    ctx.globalAlpha *= 1 - sstep((v - 0.6) / 0.4);
    ctx.translate(crossAt(a).x + v * 14, crossAt(a).y + v * v * 30);
    ctx.rotate(v * 3);
    ctx.translate(-crossAt(a).x, -crossAt(a).y);
    for (const mode of ['line', 'fill']) cross(ctx, a, mode);
    ctx.restore();
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.2, 0.6 * (1 - u / 0.6), '#fbf6ff', '#d8c8e8');
  }
}

const DRESS = {
  id: 'harlequinpuppet',
  // (the skin is her painted wood; her tunic, sleeves and bloomers over it)
  skin: { lt: WOOD[0], base: WOOD[1], sh: WOOD[2], deep: WOOD[3], ink: WOOD_INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => tunic(ctx, a, mode, D),
    neckSkin: (ctx, a, mode, S, D) => ruff(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => {
      joints(ctx, a, mode, D, 'F', 'arm');
      sleeve(ctx, a, mode, D, 'F');
    },
    handFskin: (ctx, a, mode, S, D) => hand(ctx, a, mode, D, 'F'),
    legF: (ctx, a, mode, S, D) => {
      bloomer(ctx, a, mode, D, 'F');
      joints(ctx, a, mode, D, 'F', 'leg');
    },
    footFskin: (ctx, a, mode, S, D) => slipper(ctx, a, mode, D, 'F'),
    legN: (ctx, a, mode, S, D) => {
      bloomer(ctx, a, mode, D, 'N');
      joints(ctx, a, mode, D, 'N', 'leg');
    },
    footNskin: (ctx, a, mode, S, D) => slipper(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => {
      joints(ctx, a, mode, D, 'N', 'arm');
      sleeve(ctx, a, mode, D, 'N');
    },
    handNskin: (ctx, a, mode, S, D) => hand(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('kid', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  a.mpSpun = Boolean(a.mo?.rig?.mpFlip);
  if (a.mpSpun) ctx.scale(-1, 1);
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 2.2);
export const PUPPET_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [80, 280, 200, 220], draw: R.still, rig, noHop: true, ownEmotes: true };
export const PUPPET_SIZE = { w: 28, h: Math.round(R.H * BIG * 1.0), speed: Math.round(R.speed * BIG) };
