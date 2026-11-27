// Madame Marionette, on screen (2026-11-27, redrawn from scratch: the Toy Workshop's puppeteer, her
// story and role kept; world/carnival.js her new fight). She makes Queen Gearheart's puppets, the little
// harlequins of the Workshop (Dot, render/marionette/): she was carved and strung as the first of them,
// worked her own strings loose long ago, and now holds the crosses herself. A tall porcelain-and-wood
// marionette lady in the harlequins' own mint, lilac and cream, a brass key in her back like the rest
// of the troupe. Elegant, fussy, adoring of a well-made limb ("they need strings"), and terribly proud
// of her puppets. She moves on her own copy of the blank bases' rig (rig.js; body.js `madame`: tall
// and slender), dressed here; her head, hair, hat, clothes and crosses drawn here from scratch (never
// the shared face, nothing of the hero's: her own hair).
//   look    painted porcelain skin with soft lilac shading, little round ball joints at her wrists;
//           plum-violet hair: an even blunt fringe of five cut sections stopping above her lashes, two
//           long straight side locks to her collarbones, a high ponytail behind on its own springs tied
//           with a big mint bow (one shared light, one shine band); a little lilac top hat tilted over
//           her brow, a mint band and a gold diamond; a harlequin tailcoat of mint, lilac and cream
//           diamonds over a cream waistcoat with plum lapels and gold buttons, a gold belt with a
//           cotton-reel buckle (all cut from her own outline); a cream jabot of ruffles at her throat;
//           a short skirt of three petal tiers (lilac, mint, cream frills), each on its own springs;
//           two long coat tails behind her lined with diamonds; lilac sleeves to frilled cream cuffs;
//           mint-and-cream striped stockings (cut from her legs) and lilac heeled boots with gold toe
//           caps and a mint bow; a wooden puppet cross in each hand, its gold-tipped strings dangling.
//   eyes    her own: long almond eyes lifting at the outer corner, a mint-green iris with a fine gold
//           ring round the pupil (a watch-spring's), a diamond-shaped glint and a small round one; a
//           bold plum lash line with three long doll's lashes at the outer end and three little painted
//           lashes under it; a lilac eyeshadow wash and a crease; a painted lilac diamond under her near
//           eye; plum lips with a cupid's bow; round painted cheeks. Faces: poised (rest, a small proud
//           smile), delight (^ ^), coo (soft, lips rounded), focus, scheme (a sly smile), cross,
//           startled, hurt, dizzy, sad, sleepy, talking (vowel mouths); every change eased.
//   idle    a 30 s act in pieces (only one she has time for): sewing (a little wooden arm stitched,
//           the needle flashing, a satisfied smile); the crosses tried (worked in time, their strings
//           dancing, her hips swaying); a twirl and a curtsy (a clean mirror flip of the picture);
//           preening (her hat set straight, a side lock smoothed).
//   walk    a gliding catwalk step, her crosses bobbing, coat tails and ponytail swinging.
//   fight   between casts her swings at the tank in turn: Cross Tap (a rap with the near cross),
//           String Flick (the far cross's strings whipped out) and Twirl (round with her coat tails).
//           Her casts (m.castPose, world/carnival.js): strings (both crosses raised and worked),
//           rap (both crosses up overhead, then brought down), bow (the ribbon looped in both hands),
//           snip (her gold scissors out, snapping), cut (crosses up, a snip: puppets let down), rope
//           (her arms swung round in big circles, the strings a jump rope), tug (a pull to one side,
//           then the other), curtain (arms swept wide, then down in a bow). Phase moments
//           (m.phaseAt): the Puppet Show (a flourish of both crosses), Dance for Me! (arms flung up).
//   scenes  her entrance (carnival_marionetta): 'slump' (sat in a heap on the floor, chin down, her own
//           old strings hanging slack from the dark), 'jerk' (the strings go taut and pull her up limb
//           by limb: head, an arm, the other, her knees, up), 'snip' (her gold scissors: her own strings
//           snipped away, the crosses caught), 'curtsy', 'sway', 'windup', 'attack'.
//   marks   all her own (`ownEmotes`): a "!" and a "?" on a lilac harlequin diamond, a gloating "tsk"
//           after landing a hit, a sweat drop when low, dizzy stars when beaten (her strings gone slack:
//           a puppet's heap, her key still).
// Every effect is drawn live in her own style: gold thread, ribbon loops, snipped string ends, lilac
// swishes, the game's curvy sparkles.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat, cue, spring } from './fx.js';

const BIG = 1.85;
const LW = 1.6 / BIG;
// ---------- Her colours ----------
const INK = '#9a6878';
const SKIN = ['#fffaf8', '#fbeae6', '#ecd2d2', '#d4b0bc'];
const MINT = ['#e2fbf2', '#9fe4cc', '#6cc4a8', '#4a9a82'];
const LILAC = ['#f2e8ff', '#c9b0f0', '#a088d6', '#7a64b0'];
const CREAM = ['#ffffff', '#fdf6ee', '#ece0d2', '#cdbcaa'];
const PLUM = ['#c8a2e2', '#8a5cb0', '#64408a', '#43285e'];
const GOLD = ['#fff4c0', '#f4c860', '#c49234', '#94681c'];
const WOOD = ['#f2d8b4', '#d8ac7c', '#a87a52', '#7a5434'];
const SUIT_INK = '#5e4a86';
const HAIR = ['#d6bcf0', '#8e66b8', '#6a4692', '#46286a'];
const HAIR_INK = '#3a2054';
const IRIS = ['#e6fff4', '#8fe0c4', '#3fa88e', '#1e5e54'];
const LASH = '#3a1e40';
const LIP = ['#f4a8c8', '#c4528a', '#8e2a62'];
const THREAD = '#fff2c4';

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
// A limb's own shape (the base's line through it: a disc at each point, joined), for cutting clothes from.
function limbPath(ctx, L, from = 0, to = 1e9) {
  ctx.beginPath();
  const n = Math.min(L.pts.length, to);
  for (let i = from; i < n; i++) {
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
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
// ---------- Her head (head units about its middle, over her neck) ----------
const HO = [1.2, -16.6];
const HS = 1.1;
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
// width, smile, openness), pk (lips pursed round), bl (blush), sm (small irises), sly (one-sided smile).
const FACES = {
  poised: { lid: 0, shut: 'happy', bt: 0.1, by: 0.3, mw: 0.8, ms: 0.55, mo: 0, pk: 0, bl: 0.45, sm: 0, sly: 0.3 },
  delight: { lid: 1, shut: 'happy', bt: -0.2, by: 0.8, mw: 1, ms: 1, mo: 0.5, pk: 0, bl: 0.85, sm: 0, sly: 0 },
  coo: { lid: 0, shut: 'happy', bt: -0.35, by: 0.7, mw: 0.6, ms: 0.3, mo: 0.35, pk: 1, bl: 0.9, sm: 0, sly: 0 },
  focus: { lid: 0, shut: 'happy', bt: 0.5, by: -0.1, mw: 0.7, ms: 0.15, mo: 0, pk: 0, bl: 0.4, sm: 0.1, sly: 0 },
  scheme: { lid: 0, shut: 'happy', bt: 0.7, by: 0, mw: 0.85, ms: 0.75, mo: 0, pk: 0, bl: 0.5, sm: 0.15, sly: 1 },
  cross: { lid: 0, shut: 'happy', bt: 0.95, by: -0.35, mw: 0.8, ms: -0.5, mo: 0.15, pk: 0, bl: 0.5, sm: 0.15, sly: 0 },
  startled: { lid: 0, shut: 'happy', bt: -0.3, by: 1.3, mw: 0.6, ms: 0, mo: 0.6, pk: 0.4, bl: 0.6, sm: 0.6, sly: 0 },
  hurt: { lid: 1, shut: 'squeeze', bt: -0.8, by: 0.2, mw: 0.8, ms: -0.7, mo: 0.55, pk: 0, bl: 0.6, sm: 0, sly: 0 },
  dizzy: { lid: 1, shut: 'dizzy', bt: -0.5, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.4, pk: 0, bl: 0.5, sm: 0, sly: 0 },
  sad: { lid: 0, shut: 'happy', bt: -0.95, by: 0.35, mw: 0.7, ms: -0.6, mo: 0, pk: 0, bl: 0.4, sm: 0.15, sly: 0 },
  worried: { lid: 0, shut: 'happy', bt: -0.8, by: 0.5, mw: 0.7, ms: -0.35, mo: 0.15, pk: 0, bl: 0.5, sm: 0.1, sly: 0 },
  sleepy: { lid: 1, shut: 'sleep', bt: -0.2, by: -0.1, mw: 0.6, ms: 0.2, mo: 0.08, pk: 0, bl: 0.5, sm: 0, sly: 0 },
  talk: { lid: 0, shut: 'happy', bt: 0.1, by: 0.4, mw: 0.85, ms: 0.35, mo: 0.4, pk: 0, bl: 0.5, sm: 0, sly: 0 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.6, 0.1, 0.75, 0.6], [1.0, 0.4, 0.5, 0], [0.9, 0.3, 0.25, 0], [0.7, 0.2, 0, 0], [0.75, 0.2, 0.55, 0.3]];
const EYE = { w: 3.9, h: 3.7 };

function closedLine(ctx, a, x, y, side, s, t) {
  const { w, h } = EYE;
  pen(ctx, tone(a, LASH), 1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (s === 'happy') {
    ctx.moveTo(x - w, y + 1);
    ctx.quadraticCurveTo(x, y - h * 0.95, x + w, y + 0.6);
    ctx.stroke();
    // (her doll's lashes still flick out at the outer end)
    for (const [d, l] of [[0, 1.4], [0.7, 1.1]]) {
      ctx.beginPath();
      ctx.moveTo(x + side * (w - d), y + 0.6 - d * 0.6);
      ctx.quadraticCurveTo(x + side * (w + 0.5 - d), y - 0.2 - d, x + side * (w + l - d * 0.6), y - 0.8 - d * 1.2);
      ctx.stroke();
    }
    return;
  }
  if (s === 'sleep') {
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x, y + h * 0.6, x + w, y - 0.2);
    ctx.stroke();
    for (const d of [-1.2, 0, 1.2]) {
      ctx.beginPath();
      ctx.moveTo(x + d + side * 0.8, y + h * 0.42);
      ctx.lineTo(x + d + side * 0.95, y + h * 0.42 + 0.9);
      ctx.stroke();
    }
    return;
  }
  if (s === 'squeeze') {
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
  const blink = f.lid < 0.6 ? win((t + (a.mmUid ?? 0) * 0.83) % 5.7, 5.2, 5.3, 5.38, 5.52) : 0;
  const L = Math.max(f.lid, blink);
  const closedW = sstep((L - 0.93) / 0.07);
  const shutW = blink > f.lid + 0.05 ? { happy: 0, sleep: 1, squeeze: 0, dizzy: 0 } : f.shut;
  const inner = [x - side * w, y + 0.7];
  const outer = [x + side * w, y - 1.1];
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
  // a soft lilac wash on the lid above the eye
  glow(ctx, x + side * 0.8, y - h * 1.0, 4.4, '#c8a0f0', 0.45);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(...inner);
    ctx.bezierCurveTo(x - side * w * 0.6, y - h * 1.2, x + side * w * 0.65, y - h * 1.25, ...outer);
    ctx.bezierCurveTo(x + side * w * 0.95, y + h * 0.9, x - side * w * 0.55, y + h * 1.05, ...inner);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = tone(a, '#fffdfb');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.3 * f.sm;
  const ix = x + side * 0.15 + (look?.[0] ?? 0) * 0.8;
  const iy = y + 0.35 + (look?.[1] ?? 0) * 0.6;
  const ir = [2.65 * small, 3.05 * small];
  const g = ctx.createLinearGradient(0, iy - ir[1], 0, iy + ir[1]);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.45, tone(a, IRIS[2]));
  g.addColorStop(0.85, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#163e38', 0.85), 0.4);
  ctx.stroke();
  // the fine gold ring of a watch-spring round her pupil
  ctx.beginPath();
  ctx.ellipse(ix, iy + 0.2, 1.75 * small, 2.05 * small, 0, 0, TAU);
  pen(ctx, tone(a, GOLD[1], 0.75), 0.32);
  ctx.stroke();
  ell(ctx, ix, iy + 0.2, 1.15 * small, 1.45 * small);
  ctx.fillStyle = tone(a, '#123430');
  ctx.fill();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.3);
  sg.addColorStop(0, 'rgba(90,40,100,0.32)');
  sg.addColorStop(1, 'rgba(90,40,100,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.3, w * 2.6, h);
  // the glints: a harlequin diamond up at the back, a small round one low at the front
  const gx = ix - side * 0.95;
  const gy = iy - 1.3 * small;
  ctx.beginPath();
  ctx.moveTo(gx, gy - 1.25);
  ctx.quadraticCurveTo(gx + 0.15, gy - 0.15, gx + 0.95, gy);
  ctx.quadraticCurveTo(gx + 0.15, gy + 0.15, gx, gy + 1.25);
  ctx.quadraticCurveTo(gx - 0.15, gy + 0.15, gx - 0.95, gy);
  ctx.quadraticCurveTo(gx - 0.15, gy - 0.15, gx, gy - 1.25);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, ix + side * 1.05, iy + 0.9 * small, 0.42, 0.42);
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
  // the lash line: fine at the inner corner, fuller toward the outer end, three long doll's lashes
  const top = (u) => [mix(inner[0], outer[0], u), mix(inner[1], outer[1], u) - h * 1.08 * Math.sin(Math.PI * (0.08 + u * 0.82)) + 0.15];
  const N = 12;
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(top(i / N));
  ctx.beginPath();
  pts.forEach((p, i) => {
    const th = 0.16 + 0.5 * (i / N) ** 1.4;
    if (!i) ctx.moveTo(p[0], p[1] - th);
    else ctx.lineTo(p[0], p[1] - th);
  });
  ctx.quadraticCurveTo(outer[0] + side * 0.9, outer[1] - 0.6, outer[0] + side * 1.2, outer[1] - 0.2);
  ctx.quadraticCurveTo(outer[0] + side * 0.4, outer[1] + 0.2, pts[N][0], pts[N][1] + 0.3);
  for (let i = N; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 0.14 + 0.3 * (i / N) ** 1.4);
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  pen(ctx, tone(a, LASH), 0.55);
  ctx.lineCap = 'round';
  for (const [u, len, ang] of [[0.62, 1.4, -1.55], [0.8, 1.7, -1.2], [0.96, 1.9, -0.85]]) {
    const p = top(u);
    const an = side > 0 ? ang : Math.PI - ang;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1] - 0.3);
    ctx.quadraticCurveTo(p[0] + Math.cos(an) * len * 0.6, p[1] - 0.3 + Math.sin(an) * len * 0.6, p[0] + Math.cos(an + side * 0.4) * len, p[1] - 0.3 + Math.sin(an + side * 0.4) * len);
    ctx.stroke();
  }
  // three little painted lashes under the outer half (a porcelain doll's)
  pen(ctx, tone(a, LASH, 0.4), 0.3);
  for (const u of [0.58, 0.76, 0.92]) {
    const bx = mix(inner[0], outer[0], u);
    const by = mix(inner[1], outer[1], u) + h * 0.9 * Math.sin(Math.PI * (0.1 + u * 0.8)) + 0.15;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + side * 0.3, by + 0.5);
    ctx.stroke();
  }
  // the crease over the lid
  pen(ctx, tone(a, '#b07aa0', 0.55), 0.38);
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.4, y - h * 1.4);
  ctx.quadraticCurveTo(x + side * 0.6, y - h * 1.65, x + side * w * 1.0, y - h * 1.35);
  ctx.stroke();
  ctx.restore();
}
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.by * 1.1);
  ctx.rotate(side * f.bt * 0.45);
  ctx.beginPath();
  ctx.moveTo(-1.9, 0.3);
  ctx.quadraticCurveTo(-0.2, -0.75, 1.9, 0.05);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, HAIR[3], 0.7), 0.7);
  ctx.stroke();
  ctx.restore();
}
// Her lips: plum, a cupid's bow, pursing round for a coo, opening for a laugh or a cry, a sly side.
function mouth(ctx, a, x, y, f) {
  const w = 2.2 * f.mw * (1 - 0.35 * f.pk);
  const cy = y - f.ms * (f.ms < 0 ? 1.4 : 0.55);
  const sly = f.sly ?? 0;
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy + sly * 0.3);
    ctx.quadraticCurveTo(x, y + f.ms * 0.3 - o * 0.4 - f.pk * 0.4, x + w, cy - sly * 0.4);
    ctx.quadraticCurveTo(x, y + f.ms * 0.6 + o * 2.6, x - w, cy + sly * 0.3);
    ctx.fillStyle = tone(a, '#7a2048');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x + 0.1, y + o * 2.2, w * 0.6, o * 0.9);
    ctx.fillStyle = tone(a, '#f08aac');
    ctx.fill();
    ctx.restore();
    pen(ctx, tone(a, LIP[2]), 0.55);
    ctx.stroke();
    return;
  }
  // closed: two soft plum lips, a cupid's bow on top, a gloss on the lower one; the sly side lifted
  const lift = (sd) => (sd > 0 ? sly * 0.9 : -sly * 0.15);
  ctx.beginPath();
  ctx.moveTo(x - w, cy - lift(-1));
  ctx.quadraticCurveTo(x - w * 0.5, cy - 0.9 - lift(-1) * 0.5, x - 0.25, cy - 0.55);
  ctx.quadraticCurveTo(x, cy - 0.3, x + 0.25, cy - 0.55);
  ctx.quadraticCurveTo(x + w * 0.5, cy - 0.9 - lift(1) * 0.5, x + w, cy - lift(1));
  ctx.quadraticCurveTo(x + w * 0.4, cy + 1.25 + f.ms * 0.25, x, cy + 1.25 + f.ms * 0.15);
  ctx.quadraticCurveTo(x - w * 0.4, cy + 1.25 + f.ms * 0.25, x - w, cy - lift(-1));
  ctx.closePath();
  ctx.fillStyle = tone(a, LIP[1]);
  ctx.fill();
  pen(ctx, tone(a, LIP[2]), 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w * 0.85, cy - lift(-1) * 0.9 + 0.05);
  ctx.quadraticCurveTo(x, cy + 0.35 + f.ms * 0.1, x + w * 0.85, cy - lift(1) * 0.9 + 0.05);
  pen(ctx, tone(a, LIP[2]), 0.38);
  ctx.stroke();
  ell(ctx, x - 0.3, cy + 0.85, 0.7, 0.25);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
}
// Her face's shape: a soft oval, full at the cheeks, a small rounded chin.
const FACE = [[-14.4, -3], [-13.8, -9.4], [-10.4, -14.4], [-3.8, -16.6], [3.6, -16.6], [10.4, -14.4], [13.8, -9.4], [14.4, -3], [13.6, 4.4], [10.4, 10.2], [5.2, 14.4], [0.8, 15.8], [-3.6, 14.6], [-9.4, 10.6], [-13.4, 4.8]];
// ---------- Her hair (one shared light from above, one shine band) ----------
// The fringe: an even blunt cut of five sections, the hem just above her lashes, a touch longer in the
// middle; its splits rise toward her crown and fade.
const CUTS = [-12.8, -7.8, -2.8, 2.2, 7.0, 12.8];
const HEM = (x) => -3.7 - 1.9 * (x / 12.8) ** 2;
function fringePath(ctx, sway) {
  ctx.beginPath();
  ctx.moveTo(-14, -10.6);
  ctx.quadraticCurveTo(0, -18, 14, -10.6);
  for (let i = CUTS.length - 1; i > 0; i--) {
    const x1 = CUTS[i];
    const x0 = CUTS[i - 1];
    const sw = sway[i - 1] ?? 0;
    const ye = HEM((x0 + x1) / 2) + [0.15, -0.1, 0.2, -0.15, 0.1][i - 1];
    ctx.lineTo(x1 - 0.15 + sw, ye - 1);
    ctx.quadraticCurveTo(x1 - 0.25 + sw, ye, x1 - 1.05 + sw, ye);
    ctx.lineTo(x0 + 1.05 + sw, ye);
    ctx.quadraticCurveTo(x0 + 0.25 + sw, ye, x0 + 0.15 + sw, ye - 1);
  }
  ctx.closePath();
}
const hairLight = (ctx, a, y0, y1) => {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, tone(a, HAIR[2]));
  g.addColorStop(0.45, tone(a, HAIR[1]));
  g.addColorStop(1, tone(a, HAIR[2], 0.95));
  return g;
};
function hairBack(ctx, a, mode) {
  // the sleek mass behind her head, to her nape
  smooth(ctx, [[-16.6, -6], [-16, 4], [-13.4, 10.6], [-7, 13.2], [7, 13.2], [13.4, 10.6], [16, 4], [16.6, -6], [12.4, -14.6], [0, -19.4], [-12.4, -14.6]]);
  paint(ctx, a, mode, HAIR[2], HAIR_INK);
}
// A long straight side lock from her temple to her collarbone, a rounded blunt end, swaying.
function sideLock(ctx, a, mode, side, sw) {
  const x0 = side * 13.2;
  const pts = [[x0 - side * 1.8, -11], [x0 + side * 1.9, -11], [x0 + side * 2.1 + sw * 0.3, -1], [x0 + side * 1.5 + sw * 0.7, 10], [x0 + side * 0.6 + sw, 19.8], [x0 - side * 0.9 + sw, 21.2], [x0 - side * 1.9 + sw, 19.2], [x0 - side * 1.7 + sw * 0.6, 9], [x0 - side * 1.5 + sw * 0.3, -1]];
  smooth(ctx, pts);
  paint(ctx, a, mode, HAIR[1], HAIR_INK);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    const g = ctx.createLinearGradient(0, -11, 0, 23);
    g.addColorStop(0, tone(a, HAIR[2], 0.9));
    g.addColorStop(0.3, tone(a, HAIR[1], 0));
    g.addColorStop(1, tone(a, HAIR[2], 0.5));
    ctx.fillStyle = g;
    ctx.fillRect(x0 - 6, -12, 12, 36);
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
  ctx.fillStyle = hairLight(ctx, a, -16, -2);
  ctx.fillRect(-16, -19, 32, 18);
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
  // the one shine band, broken a little at each split
  for (let i = 0; i < CUTS.length - 1; i++) {
    const x0 = CUTS[i] + 0.8;
    const x1 = CUTS[i + 1] - 0.8;
    const y = -9.6 + 0.004 * ((x0 + x1) / 2) ** 2;
    const fade = 1 - Math.abs((x0 + x1) / 2) / 15;
    ctx.beginPath();
    ctx.moveTo(x0, y + 0.2);
    ctx.quadraticCurveTo((x0 + x1) / 2, y - 0.6, x1, y + 0.2);
    ctx.lineCap = 'round';
    pen(ctx, tone(a, HAIR[0], 0.7 * fade), 1.05);
    ctx.stroke();
  }
  ctx.restore();
}
// The mint ribbon bow at her ponytail's root: two soft loops and two short tails, a round knot.
function bow(ctx, a, mode) {
  const q = a.mmQ ?? {};
  const fl = q.bowFl ?? 0;
  ctx.save();
  ctx.translate(-11.6, -14.6);
  ctx.rotate(-0.5);
  for (const sd of [-1, 1]) {
    smooth(ctx, [[0, 0], [sd * 3, -3.4 - fl * sd * 0.4], [sd * 6.8, -3.2], [sd * 7.6, 0], [sd * 6.6, 3], [sd * 3, 2.6]]);
    paint(ctx, a, mode, sd < 0 ? MINT[2] : MINT[1], MINT[3]);
    smooth(ctx, [[sd * 0.6, 1], [sd * 2.4, 5.4 + fl * 0.6], [sd * 3.6, 7.2], [sd * 1.6, 6.8], [0, 2.4]]);
    paint(ctx, a, mode, MINT[2], MINT[3]);
  }
  ell(ctx, 0, 0.2, 1.9, 1.8);
  paint(ctx, a, mode, MINT[1], MINT[3]);
  if (mode === 'fill') {
    ell(ctx, 3.8, -1.2, 1.6, 0.8, -0.2);
    ctx.fillStyle = tone(a, MINT[0], 0.8);
    ctx.fill();
  }
  ctx.restore();
}
// Her little top hat, tilted over her near brow: lilac, a mint band, a gold diamond on it.
function hat(ctx, a, mode) {
  const q = a.mmQ ?? {};
  ctx.save();
  ctx.translate(3.4, -15.4);
  ctx.rotate(0.24 + (q.hatA ?? 0));
  // the brim
  ell(ctx, 0, 0, 8.8, 1.9);
  paint(ctx, a, mode, LILAC[2], SUIT_INK);
  // the crown
  ctx.beginPath();
  ctx.moveTo(-5.2, -0.2);
  ctx.quadraticCurveTo(-5.6, -5, -5.6, -9.2);
  ctx.quadraticCurveTo(0, -10.6, 5.6, -9.2);
  ctx.quadraticCurveTo(5.6, -5, 5.2, -0.2);
  ctx.quadraticCurveTo(0, 1.2, -5.2, -0.2);
  ctx.closePath();
  paint(ctx, a, mode, LILAC[1], SUIT_INK);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, -2.4, -6.4, 4.4, LILAC[0], 0.9);
    ctx.fillStyle = tone(a, MINT[1]);
    ctx.fillRect(-7, -3.2, 14, 2.6);
    ctx.fillStyle = tone(a, MINT[0], 0.7);
    ctx.fillRect(-7, -3.2, 14, 0.6);
    ctx.restore();
    ell(ctx, 0, -9.6, 5.6, 1.1);
    ctx.fillStyle = tone(a, LILAC[0]);
    ctx.fill();
    // the gold diamond on the band
    ctx.beginPath();
    ctx.moveTo(2, -4.2);
    ctx.quadraticCurveTo(2.3, -2.2, 3.4, -1.9);
    ctx.quadraticCurveTo(2.3, -1.6, 2, 0.4);
    ctx.quadraticCurveTo(1.7, -1.6, 0.6, -1.9);
    ctx.quadraticCurveTo(1.7, -2.2, 2, -4.2);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    pen(ctx, tone(a, GOLD[3]), 0.35);
    ctx.stroke();
    // the brim's top edge, lighter
    ctx.beginPath();
    ctx.ellipse(0, -0.3, 8.4, 1.4, 0, Math.PI * 1.05, Math.PI * 1.95);
    pen(ctx, tone(a, LILAC[0], 0.8), 0.5);
    ctx.stroke();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.mmQ ?? {};
  const f = a.mmF;
  const turn = q.turn ?? 0.35;
  const tx = turn * 2.2;
  const sway = q.fringe ?? [0, 0, 0, 0, 0, 0];
  hairBack(ctx, a, mode);
  bow(ctx, a, mode);
  smooth(ctx, FACE);
  paint(ctx, a, mode, SKIN[1]);
  if (mode === 'fill' && f) {
    ctx.save();
    smooth(ctx, FACE);
    ctx.clip();
    glow(ctx, tx - 2, -8, 13, SKIN[0], 0.95);
    glow(ctx, -14, 4, 7, SKIN[2], 0.5);
    glow(ctx, tx + 1, 15, 8, SKIN[2], 0.45);
    // the forehead's soft shade under her fringe (the skin's own shade, the cut copied down)
    ctx.save();
    ctx.translate(0, 1.2);
    fringePath(ctx, sway);
    ctx.fillStyle = tone(a, SKIN[2], 0.5);
    ctx.fill();
    ctx.restore();
    ctx.restore();
    // round painted cheeks
    for (const [cx, s] of [[tx - 8.2, 0.85], [tx + 8.4, 1]]) {
      ell(ctx, cx, 7, 2.6, 1.9);
      ctx.fillStyle = tone(a, '#ff9ac0', (0.3 + 0.4 * f.bl) * s);
      ctx.fill();
    }
    const ex = (s) => (s < 0 ? -5.6 + tx * 0.7 : 5.9 + tx);
    for (const s of [-1, 1]) eye(ctx, a, ex(s), 1.8, s, f, q.look);
    // the painted lilac diamond under her near eye's outer corner
    ctx.save();
    ctx.translate(tx + 10.4, 7.6);
    ctx.beginPath();
    ctx.moveTo(0, -1.2);
    ctx.quadraticCurveTo(0.15, -0.15, 0.85, 0);
    ctx.quadraticCurveTo(0.15, 0.15, 0, 1.2);
    ctx.quadraticCurveTo(-0.15, 0.15, -0.85, 0);
    ctx.quadraticCurveTo(-0.15, -0.15, 0, -1.2);
    ctx.fillStyle = tone(a, LILAC[2]);
    ctx.fill();
    ctx.restore();
    // a tiny nose light and shade, the lips
    ctx.beginPath();
    ctx.moveTo(tx + 1.8, 4.6);
    ctx.quadraticCurveTo(tx + 2.6, 6.4, tx + 1.2, 7);
    pen(ctx, tone(a, SKIN[3], 0.8), 0.45);
    ctx.lineCap = 'round';
    ctx.stroke();
    mouth(ctx, a, tx + 1, 10.6, f);
    if (q.sweat >= 0) sweat(ctx, tx - 13, -2 + q.sweat * 3, 1.1);
  }
  const ls = q.locks ?? [0, 0];
  sideLock(ctx, a, mode, -1, ls[0]);
  sideLock(ctx, a, mode, 1, ls[1]);
  fringe(ctx, a, mode, sway);
  if (mode === 'fill' && f) {
    const ex = (s) => (s < 0 ? -5.6 + tx * 0.7 : 5.9 + tx);
    for (const s of [-1, 1]) brow(ctx, a, ex(s) + s * 0.3, -5.2, s, f);
  }
  hat(ctx, a, mode);
  WK = 1;
  ctx.restore();
}

// ---------- Her clothes (all cut from her own outline) ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
const diamond = (ctx, P, cx, cy, rw, rh) => poly(ctx, [[cx, cy - rh], [cx + rw, cy], [cx, cy + rh], [cx - rw, cy]].map(P));
// The tailcoat: harlequin diamonds over her body, a cream waistcoat down the middle edged with plum
// lapels and gold piping, gold buttons, a gold belt with a cotton-reel buckle; then the petal skirt.
function coat(ctx, a, mode, D) {
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
      ctx.fillStyle = tone(a, LILAC[1]);
      ctx.fillRect(-80, -120, 160, 160);
      const cols = [MINT[1], CREAM[1], LILAC[1]];
      for (let r = 0; r < 6; r++) {
        for (let c = -3; c <= 3; c++) {
          const cx = st[0] + c * 7 + (r % 2) * 3.5;
          const cy = st[1] - 2 + r * 6.2;
          const P = r < 3 ? C : r < 5 ? W : T;
          diamond(ctx, P, cx, cy, 3.5, 3.1);
          ctx.fillStyle = tone(a, cols[(((c + r) % 3) + 3) % 3]);
          ctx.fill();
        }
      }
      // the waistcoat down her middle, narrowing to her belt
      const vest = [C([st[0] - 4.6, st[1] - 2]), C([st[0] + 6, st[1] - 2]), C([st[0] + 5.6, st[1] + 8]), W([nv[0] + 4.2, nv[1] - 3]), W([nv[0] + 3.6, nv[1] + 1]), W([nv[0] - 3, nv[1] + 1]), W([nv[0] - 3.6, nv[1] - 3]), C([st[0] - 4.2, st[1] + 8])];
      poly(ctx, chaikin(vest, 1));
      ctx.fillStyle = tone(a, CREAM[1]);
      ctx.fill();
      // the plum lapels either side of it, gold piping
      for (const sd of [-1, 1]) {
        const x0 = sd < 0 ? st[0] - 4.6 : st[0] + 6;
        const lap = chaikin([C([x0, st[1] - 2]), C([x0 + sd * 2.6, st[1] - 1]), C([x0 + sd * 1.4, st[1] + 9]), W([nv[0] + (sd < 0 ? -3.6 : 4.2) + sd * 0.6, nv[1] - 2.6]), W([nv[0] + (sd < 0 ? -3.6 : 4.2) - sd * 0.8, nv[1] - 3]), C([x0 - sd * 0.4, st[1] + 8])], 1);
        poly(ctx, lap);
        ctx.fillStyle = tone(a, sd < 0 ? PLUM[2] : PLUM[1]);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(...C([x0 - sd * 0.2, st[1] - 1.6]));
        ctx.quadraticCurveTo(...C([x0 - sd * 0.5, st[1] + 6]), ...W([nv[0] + (sd < 0 ? -3.6 : 4.2) - sd * 0.6, nv[1] - 2.8]));
        pen(ctx, tone(a, GOLD[1]), 0.6);
        ctx.stroke();
      }
      const lt = C([st[0] + 3, st[1] + 4]);
      glow(ctx, lt[0], lt[1], 6, CREAM[0], 0.5);
      const sh = W([nv[0] - 7, nv[1] - 2]);
      glow(ctx, sh[0], sh[1], 7, PLUM[3], 0.25);
      // the gold belt
      ctx.beginPath();
      ctx.moveTo(...W([nv[0] - 30, nv[1] + 1.4]));
      ctx.lineTo(...W([nv[0] + 30, nv[1] + 1.4]));
      pen(ctx, tone(a, GOLD[2]), 2.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(...W([nv[0] - 30, nv[1] + 0.8]));
      ctx.lineTo(...W([nv[0] + 30, nv[1] + 0.8]));
      pen(ctx, tone(a, GOLD[1]), 0.8);
      ctx.stroke();
    }
    ctx.restore();
    // gold buttons down the waistcoat
    for (const [P, p] of [[C, [st[0] + 1.4, st[1] + 3]], [C, [st[0] + 1.4, st[1] + 7.6]], [W, [nv[0] + 0.8, nv[1] - 4.4]]]) {
      const b = P(p);
      ell(ctx, b[0], b[1], 0.75, 0.75);
      ctx.fillStyle = tone(a, GOLD[1]);
      ctx.fill();
      pen(ctx, tone(a, GOLD[3]), 0.3);
      ctx.stroke();
    }
    // the cotton-reel buckle: a little spool of mint thread between two gold rims
    const bk = W([nv[0] + 0.8, nv[1] + 1.1]);
    ctx.save();
    ctx.translate(bk[0], bk[1]);
    ctx.beginPath();
    ctx.roundRect(-1.3, -1.2, 2.6, 2.4, 0.5);
    ctx.fillStyle = tone(a, MINT[1]);
    ctx.fill();
    for (const y of [-1.4, 1.4]) {
      ell(ctx, 0, y, 1.9, 0.5);
      ctx.fillStyle = tone(a, GOLD[1]);
      ctx.fill();
      pen(ctx, tone(a, GOLD[3]), 0.25);
      ctx.stroke();
    }
    ctx.restore();
  }
  skirt(ctx, a, mode, D, T, hp);
}
// The petal skirt: three tiers from her hips (cream frills behind, mint, lilac in front), each petal
// soft and rounded, each tier on its own spring.
function skirt(ctx, a, mode, D, T, hp) {
  const q = a.mmQ ?? {};
  const sk = q.skirt ?? [0, 0, 0];
  const nv = D.J.navel;
  const top = nv[1] + 2;
  const tiers = [
    { col: CREAM[1], ink: CREAM[3], len: 15.6, n: 6, flare: 12.6, frill: true },
    { col: MINT[1], ink: MINT[3], len: 13, n: 5, flare: 11.4 },
    { col: LILAC[1], ink: SUIT_INK, len: 10.4, n: 4, flare: 10.2 },
  ];
  tiers.forEach((tr, ti) => {
    const sw = sk[ti] ?? 0;
    for (let i = 0; i < tr.n; i++) {
      const u = tr.n === 1 ? 0.5 : i / (tr.n - 1);
      const x0 = hp[0] - 7.6 + u * 15.2;
      const xe = hp[0] + (u - 0.5) * 2 * tr.flare + sw * 6 * (0.5 + u);
      const ye = top + tr.len + Math.sin(u * Math.PI) * 1.2 - Math.abs(sw) * 1.2;
      const hw = (tr.flare * 2) / tr.n / 1.6;
      const pts = [[x0 - hw * 0.55, top], [x0 + hw * 0.55, top], [xe + hw * 1.05, ye - 3], [xe + hw * 0.6, ye + 0.6], [xe, ye + 1.4], [xe - hw * 0.6, ye + 0.6], [xe - hw * 1.05, ye - 3]].map(T);
      smooth(ctx, pts);
      if (mode === 'line') {
        pen(ctx, tr.ink, LW * 1.2);
        ctx.stroke();
      } else {
        ctx.fillStyle = tone(a, tr.col);
        ctx.fill();
        ctx.save();
        smooth(ctx, pts);
        ctx.clip();
        const c0 = T([x0, top + 2]);
        glow(ctx, c0[0], c0[1], 6, '#ffffff', 0.35);
        const c1 = T([xe, ye]);
        glow(ctx, c1[0], c1[1], 4, tr.ink, 0.22);
        if (tr.frill) {
          ctx.beginPath();
          ctx.moveTo(...T([xe - hw, ye - 1.2]));
          ctx.quadraticCurveTo(...T([xe, ye + 0.2]), ...T([xe + hw, ye - 1.2]));
          pen(ctx, tone(a, CREAM[3], 0.6), 0.5);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  });
  // a gold band where the skirt meets the belt
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(...T([hp[0] - 8, top]));
    ctx.quadraticCurveTo(...T([hp[0], top + 1]), ...T([hp[0] + 8, top]));
    pen(ctx, tone(a, GOLD[1]), 0.9);
    ctx.stroke();
  }
}
// The jabot: two tiers of cream ruffles cascading from her throat, on a spring.
function jabot(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const fl = (a.mmQ ?? {}).jabot ?? 0;
  for (const [dy, w, h] of [[-0.6, 5.2, 5], [3.4, 4.2, 4.6]]) {
    const cx = st[0] + 0.8 + fl * (dy > 0 ? 0.8 : 0.4);
    const pts = [[cx - w * 0.5, st[1] + dy - 1.6], [cx + w * 0.5, st[1] + dy - 1.6], [cx + w, st[1] + dy + h * 0.6], [cx + w * 0.55, st[1] + dy + h], [cx, st[1] + dy + h * 0.8], [cx - w * 0.55, st[1] + dy + h], [cx - w, st[1] + dy + h * 0.6]];
    smooth(ctx, pts);
    paint(ctx, a, mode, CREAM[0], CREAM[3]);
    if (mode === 'fill') {
      ctx.save();
      smooth(ctx, pts);
      ctx.clip();
      for (const sx of [-w * 0.45, 0, w * 0.45]) {
        ctx.beginPath();
        ctx.moveTo(cx + sx * 0.4, st[1] + dy - 1);
        ctx.quadraticCurveTo(cx + sx * 0.9, st[1] + dy + h * 0.4, cx + sx, st[1] + dy + h);
        pen(ctx, tone(a, CREAM[2], 0.8), 0.45);
        ctx.stroke();
      }
      glow(ctx, cx - 1, st[1] + dy, 3, '#ffffff', 0.7);
      ctx.restore();
    }
  }
  // a gold brooch at her throat, a little lilac stone
  ell(ctx, st[0] + 0.8, st[1] - 1.4, 1.3, 1.2);
  paint(ctx, a, mode, GOLD[1], GOLD[3]);
  if (mode === 'fill') {
    ell(ctx, st[0] + 0.8, st[1] - 1.4, 0.7, 0.65);
    ctx.fillStyle = tone(a, LILAC[2]);
    ctx.fill();
    ell(ctx, st[0] + 0.55, st[1] - 1.65, 0.25, 0.22);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
}
// Her sleeves: lilac, cut from her arm, a puff at the shoulder in the harlequin's mint; frilled cream cuffs.
function sleeve(ctx, a, mode, D, k) {
  const L = a[`blArm${k}`];
  if (!L || mode !== 'fill') return;
  const near = k === 'N';
  ctx.save();
  limbPath(ctx, L);
  ctx.clip('nonzero');
  ctx.fillStyle = tone(a, near ? LILAC[1] : LILAC[2]);
  ctx.fillRect(-200, -200, 400, 400);
  const sh = L.pts[0];
  glow(ctx, sh[0], sh[1], 5.4, near ? MINT[1] : MINT[2], 0.9);
  const mid = L.pts[Math.floor(L.pts.length * 0.55)];
  glow(ctx, mid[0] - 1, mid[1] - 1, 3, LILAC[0], near ? 0.55 : 0.2);
  ctx.restore();
}
function cuffAt(a, D, k) {
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const Wr = ptOf(a, D, `arm${k}f`, D.J[`wr${k}`]);
  return { M: [mix(E[0], Wr[0], 0.86), mix(E[1], Wr[1], 0.86)], an: Math.atan2(Wr[1] - E[1], Wr[0] - E[0]) };
}
function cuff(ctx, a, mode, D, k) {
  const { M, an } = cuffAt(a, D, k);
  ctx.save();
  ctx.translate(...M);
  ctx.rotate(an);
  const pts = [];
  for (let i = 0; i < 14; i++) {
    const u = (i / 14) * TAU;
    pts.push([Math.cos(u) * 1.2 + (Math.cos(u) > 0 ? 0.4 : 0), Math.sin(u) * (2.1 + 0.3 * Math.cos(u * 3))]);
  }
  smooth(ctx, pts);
  paint(ctx, a, mode, k === 'N' ? CREAM[0] : CREAM[2], CREAM[3]);
  if (mode === 'fill') {
    pen(ctx, tone(a, CREAM[3], 0.6), 0.35);
    for (const y of [-1.6, 0, 1.6]) {
      ctx.beginPath();
      ctx.moveTo(-1.2, y);
      ctx.lineTo(1.6, y * 1.1);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// Her porcelain hand, a little ball joint at the wrist, fingers round the cross's stem.
function hand(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  const near = k === 'N';
  ell(ctx, wr[0], wr[1] + 0.4, 1.5, 1.5);
  paint(ctx, a, mode, near ? SKIN[2] : SKIN[3], INK, LW / 1.1);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  ctx.scale(0.86, 0.86);
  const open = (a.mmQ ?? {})[`open${k}`] ?? 0;
  smooth(ctx, [[-3, -2.8], [-0.8, -4], [2, -3.8], [3.4, -1.2], [3.2 + open, 2.4], [1.2, 4.2 + open * 0.6], [-1.6, 4], [-3.4, 1.4]]);
  paint(ctx, a, mode, near ? SKIN[1] : SKIN[2], INK, LW / 1.05);
  if (mode === 'fill') glow(ctx, -0.6, -1, 2.4, SKIN[0], near ? 0.8 : 0.3);
  ctx.restore();
}
// Her stockings: mint and cream stripes round her legs below the skirt, cut from her own legs.
function stocking(ctx, a, mode, D, k) {
  const L = a[`blLeg${k}`];
  if (!L || mode !== 'fill') return;
  const near = k === 'N';
  ctx.save();
  limbPath(ctx, L, 1);
  ctx.clip('nonzero');
  const K = ptOf(a, D, `shin${k}`, D.J[`knee${k}`]);
  const A = ptOf(a, D, `foot${k}`, D.J[`ank${k}`]);
  const H = ptOf(a, D, `thigh${k}`, D.J[`hip${k}`]);
  ctx.fillStyle = tone(a, near ? CREAM[1] : CREAM[2]);
  ctx.fillRect(-200, -200, 400, 400);
  // the stripes: bands across the thigh and the shin, square to each bone
  const bands = (P0, P1, n, off) => {
    const an = Math.atan2(P1[1] - P0[1], P1[0] - P0[0]);
    const len = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]);
    ctx.save();
    ctx.translate(P0[0], P0[1]);
    ctx.rotate(an);
    ctx.fillStyle = tone(a, near ? MINT[1] : MINT[2]);
    for (let i = 0; i < n; i++) ctx.fillRect(off + (i / n) * len, -8, (len / n) * 0.5, 16);
    ctx.restore();
  };
  bands(H, K, 4, 0);
  bands(K, A, 5, 0.6);
  glow(ctx, K[0] + 1, K[1], 2.6, '#ffffff', near ? 0.35 : 0.1);
  ctx.restore();
}
// A lilac heeled boot, a gold toe cap, a mint bow at the ankle.
function boot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 3.4, p[1] - 5.6], [p[0] + 2.6, p[1] - 5.6], [p[0] + 3.2, p[1] - 1.6], [p[0] + 7.6, p[1] + 0.6], [p[0] + 8.4, p[1] + 2.6], [p[0] + 1, p[1] + 3], [p[0] - 2, p[1] + 2.2], [p[0] - 3.6, p[1] + 3.4], [p[0] - 4.6, p[1] + 1]]);
  paint(ctx, a, mode, near ? LILAC[1] : LILAC[2], SUIT_INK);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, [[p[0] - 3.4, p[1] - 5.6], [p[0] + 2.6, p[1] - 5.6], [p[0] + 3.2, p[1] - 1.6], [p[0] + 7.6, p[1] + 0.6], [p[0] + 8.4, p[1] + 2.6], [p[0] + 1, p[1] + 3], [p[0] - 2, p[1] + 2.2], [p[0] - 3.6, p[1] + 3.4], [p[0] - 4.6, p[1] + 1]]);
    ctx.clip();
    ell(ctx, p[0] + 7, p[1] + 1.6, 3.4, 2.6);
    ctx.fillStyle = tone(a, near ? GOLD[1] : GOLD[2]);
    ctx.fill();
    glow(ctx, p[0] - 0.4, p[1] - 3, 3, LILAC[0], near ? 0.7 : 0.25);
    ctx.restore();
    // the heel, a little darker
    ctx.beginPath();
    ctx.roundRect(p[0] - 3.8, p[1] + 1.6, 1.8, 2.2, 0.5);
    ctx.fillStyle = tone(a, PLUM[2]);
    ctx.fill();
    for (const sd of [-1, 1]) {
      ell(ctx, p[0] + 2.6 + sd * 1.3, p[1] - 4.8, 1.3, 0.75, sd * 0.4);
      ctx.fillStyle = tone(a, near ? MINT[1] : MINT[2]);
      ctx.fill();
    }
    ell(ctx, p[0] + 2.6, p[1] - 4.8, 0.55, 0.55);
    ctx.fillStyle = tone(a, MINT[3]);
    ctx.fill();
  }
  ctx.restore();
}
// Her coat tails: two long lilac panels from the back of her waist, lined with diamonds, on springs,
// always swinging in behind her.
function tails(ctx, a, mode, D) {
  const q = a.mmQ ?? {};
  const sw = q.tails ?? [0, 0];
  ctx.save();
  enter(ctx, a, D, 'torso');
  const w = D.J.waist;
  for (let i = 1; i >= 0; i--) {
    const root = [w[0] - 3.4 - i * 3, w[1] + 1];
    const b = Math.PI / 2 + 0.16 + i * 0.12 + sw[i];
    const pts = chain(root, [b, b + 0.04 + sw[i] * 0.4, b + 0.08 + sw[i] * 0.7, b + 0.12 + sw[i] * 0.9], [9.6, 9.6, 9.6, 8.4]);
    const shape = tube(pts, [7.4, 8.4, 8.2, 7.4, 6], 0.5);
    poly(ctx, shape);
    paint(ctx, a, mode, i ? LILAC[2] : LILAC[1], SUIT_INK);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, shape);
      ctx.clip();
      // the lining turned back at its edge: a row of mint diamonds
      for (let j = 1; j < 5; j++) {
        const p = pts[j];
        const an = Math.atan2(pts[j][1] - pts[j - 1][1], pts[j][0] - pts[j - 1][0]);
        ctx.save();
        ctx.translate(p[0] + Math.cos(an + Math.PI / 2) * 2.6, p[1] + Math.sin(an + Math.PI / 2) * 2.6);
        ctx.rotate(an);
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(0, -1.8);
        ctx.lineTo(3, 0);
        ctx.lineTo(0, 1.8);
        ctx.closePath();
        ctx.fillStyle = tone(a, j % 2 ? MINT[1] : CREAM[1]);
        ctx.fill();
        ctx.restore();
      }
      glow(ctx, pts[1][0] + 1, pts[1][1], 5, LILAC[0], 0.4);
      ctx.restore();
    }
  }
  ctx.restore();
}
// Her ponytail: a thick sleek tail from high on the back of her head, on springs, a rounded blunt end.
function ponytail(ctx, a, mode, D) {
  const angs = a.mmTail ?? [2.3, 2.05, 1.85, 1.7, 1.6];
  const root = headAt(a, D, [-11.4, -13]);
  const pts = chain(root, angs, [3.4, 3.8, 3.8, 3.6, 3.2]);
  const W = [4.4, 5.2, 5.2, 4.8, 4.2, 3.4]
  const shape = tube(pts, W, 0.42);
  poly(ctx, shape);
  paint(ctx, a, mode, HAIR[1], HAIR_INK);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, shape);
    ctx.clip();
    // the one light from above, deeper toward the end; a shine band across its top curve
    const g = ctx.createLinearGradient(0, root[1], 0, pts[5][1] + 4);
    g.addColorStop(0, tone(a, HAIR[1]));
    g.addColorStop(1, tone(a, HAIR[2]));
    ctx.fillStyle = g;
    ctx.fillRect(root[0] - 60, root[1] - 10, 120, 80);
    const s0 = pts[1];
    const s1 = pts[2];
    ctx.beginPath();
    ctx.moveTo(s0[0] - 1.4, s0[1] + 0.4);
    ctx.quadraticCurveTo(mix(s0[0], s1[0], 0.5) + 0.3, mix(s0[1], s1[1], 0.5), s1[0] + 1.6, s1[1] - 0.3);
    pen(ctx, tone(a, HAIR[0], 0.55), 0.6);
    ctx.stroke();
    // its split: one soft shade down the middle, fading toward the end
    ctx.beginPath();
    pts.slice(1, 5).forEach((p, i) => (i ? ctx.lineTo(p[0] + 0.3, p[1]) : ctx.moveTo(p[0] + 0.3, p[1])));
    pen(ctx, tone(a, HAIR[3], 0.4), 0.35);
    ctx.stroke();
    ctx.restore();
  }
}
// Her brass wind-up key, through the back of her coat (turning slowly, faster when she works).
function key(ctx, a, mode, D) {
  const q = a.mmQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  ctx.translate(st[0] - 7.4, st[1] + 6);
  const c = Math.cos(q.keyA ?? 0);
  ctx.beginPath();
  ctx.moveTo(1.6, 0);
  ctx.lineTo(-4.4, 0);
  ctx.lineCap = 'round';
  pen(ctx, mode === 'line' ? INK : tone(a, GOLD[2]), mode === 'line' ? 1.8 + LW * 2 : 1.8);
  ctx.stroke();
  for (const s of [-1, 1]) {
    ell(ctx, -6.6, s * 2.2 * Math.abs(c), 1.7, 1.9 * Math.max(0.35, Math.abs(c)));
    paint(ctx, a, mode, s * c > 0 ? GOLD[1] : GOLD[2], GOLD[3]);
  }
  ell(ctx, -4.7, 0, 1, 1.4);
  paint(ctx, a, mode, GOLD[1], GOLD[3]);
  ctx.restore();
}

// ---------- Her crosses and strings (rig space) ----------
// A wooden puppet cross: a long bar and a short one across it, gold caps; held by the stem at `p`,
// level (her wrist keeps it so), wobbling on its own spring; its gold-tipped strings hang beneath.
function crossShape(ctx, a, mode, p, ang, s, near) {
  ctx.save();
  ctx.translate(p[0], p[1] + 2.4 * s);
  ctx.rotate(ang);
  ctx.scale(s, s);
  const bar = (x0, y0, x1, y1, w) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineCap = 'round';
    if (mode === 'line') pen(ctx, WOOD[3], w + LW * 2);
    else pen(ctx, tone(a, near ? WOOD[1] : WOOD[2]), w);
    ctx.stroke();
  };
  bar(-8, 2.2, 8, 2.2, 1.8);
  bar(0, -1.4, 0, 6, 1.6);
  bar(-4, 4.6, 4, 4.6, 1.3);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(-7.6, 1.7);
    ctx.lineTo(7.6, 1.7);
    pen(ctx, tone(a, WOOD[0], 0.8), 0.5);
    ctx.stroke();
    for (const [x, y] of [[-8, 2.2], [8, 2.2], [0, 6.2]]) {
      ell(ctx, x, y, 1.05, 1.05);
      ctx.fillStyle = tone(a, GOLD[1]);
      ctx.fill();
    }
  }
  ctx.restore();
}
// The ends of a cross's strings: from its bar ends, hanging (or flung out by her moves: `fling`).
function crossEnds(p, ang, s) {
  const r = (x, y) => [p[0] + (x * Math.cos(ang) - y * Math.sin(ang)) * s, p[1] + 2.4 * s + (x * Math.sin(ang) + y * Math.cos(ang)) * s];
  return [r(-8, 2.2), r(0, 6.2), r(8, 2.2)];
}
function strings(ctx, a, p, ang, s, k) {
  const q = a.mmQ ?? {};
  const t = a.t ?? 0;
  const ends = crossEnds(p, ang, s);
  const sw = q[`swing${k}`] ?? 0;
  const len = q.strLen ?? 11;
  const fling = q[`fling${k}`] ?? 0;
  ctx.save();
  ctx.lineCap = 'round';
  ends.forEach((e, i) => {
    const w = Math.sin(t * 2.2 + i * 1.3 + (k === 'N' ? 0 : 2)) * 1.2;
    const L = len * (0.85 + 0.1 * i);
    const tip = [e[0] + sw * L * 0.4 + w + fling * L * 0.9, e[1] + L * (1 - Math.abs(fling) * 0.5)];
    const mid = [mix(e[0], tip[0], 0.5) - sw * 2 + w * 0.5, mix(e[1], tip[1], 0.5) + 1.2];
    ctx.beginPath();
    ctx.moveTo(...e);
    ctx.quadraticCurveTo(...mid, ...tip);
    pen(ctx, tone(a, '#c8b098', 0.6), 0.7);
    ctx.stroke();
    pen(ctx, tone(a, THREAD, 0.95), 0.32);
    ctx.stroke();
    ell(ctx, tip[0], tip[1], 0.45, 0.45);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
  });
  ctx.restore();
}
function crossAt(a, D, k) {
  const q = a.mmQ ?? {};
  return { p: ptOf(a, D, `hand${k}`, D.J[`hand${k}`]), ang: q[`crossA${k}`] ?? 0, s: k === 'N' ? 0.62 : 0.56 };
}
function heldCross(ctx, a, mode, D, k) {
  const q = a.mmQ ?? {};
  if ((q[`hold${k}`] ?? 1) < 0.02) return;
  const c = crossAt(a, D, k);
  ctx.save();
  ctx.globalAlpha *= q[`hold${k}`] ?? 1;
  if (mode === 'fill') strings(ctx, a, c.p, c.ang, c.s, k);
  crossShape(ctx, a, mode, c.p, c.ang, c.s, k === 'N');
  ctx.restore();
}

// ---------- Her act and her fight ----------
const SWINGS = ['tap', 'flick', 'twirl'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.mmN ?? 0) % SWINGS.length]);
const READY = { shN: -60, elN: -70, hwN: -10, shF: 40, elF: 60, hwF: 10 };
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'poised', look: [0.4, 0], turn: 0.35, sweat: -1, fx: null, keyRate: 1.2, mirror: 0, holdN: 1, holdF: 1, flingN: 0, flingF: 0, openN: 0, openF: 0, strLen: 11, scissors: 0, ownStr: 0, ownSlack: 0 };
  a.mmQ = q;
  a.mmUid = (m.uid ?? 0) % 7;
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
  const breath = Math.sin(t * 1.4);
  const cineMood = m.cine?.mood;
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  const alive = m.hp > 0;
  const low = alive && m.hp / m.def.hp < 0.25;
  // ----- her casts (world/carnival.js) and her swings at the tank -----
  const cast = alive && m.cast && m.castPose ? m.cast : null;
  if (cast && st.mmCastT0 !== cast.t0) {
    st.mmCastT0 = cast.t0;
    st.mmMove = m.castPose;
  }
  const since = now - (m.attackAt ?? -9);
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const winding = alive && !cast && m.windup > 0;
  if (winding && !(now - (st.mmWindAt ?? -9) < 0.25)) {
    st.mmN = (st.mmN ?? m.uid ?? 0) + 1;
    st.mmMove = pickSwing(m, st);
  }
  if (winding) st.mmWindAt = now;
  const struck = alive && since >= 0 && since < 1.1;
  const mv = cast ? st.mmMove : winding || struck ? (st.mmMove ??= SWINGS[0]) : null;
  const cu = cast ? clamp((now - cast.t0) / cast.dur, 0, 1) : 1;
  const ct = cast ? now - cast.t0 : 99;
  let W = 0;
  if (cast) W = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  else if (winding) W = clamp(1 - m.windup / total, 0, 1);
  const s = cast || winding ? -1 : since;
  const busy = !alive || Boolean(mv);
  if (busy) st.mmFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.mmFreeAt ?? -9)) / 0.35);
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;

  // Standing: tall, a hip cocked, the near cross held out a little, the far one low at her side.
  go({ shN: -24, elN: -46, hwN: -6, shF: 14, elF: 24, hwF: 6, tilt: -2, chest: -2 + breath * 0.5, head: -2 + Math.sin(t * 0.55) * 1.2, pelvis: 3 }, 1);
  if (walkW > 0.01) {
    const u = a.blkidU ?? a.wp ?? 0;
    add({ shN: Math.sin(u * TAU) * 8, shF: -Math.sin(u * TAU) * 8, pelvis: Math.sin(u * TAU) * 3, head: -1 }, walkW);
    q.turn = mix(q.turn, 0.55, walkW);
  }
  if (fighting && !busy) {
    go({ ...READY, tilt: 3, head: 2 }, 0.85 * freeK);
    say('focus');
    q.turn = 0.55;
    q.keyRate = 2.4;
  }
  if (fighting && !st.mmHunt) st.mmBangAt = now;
  if (!fighting && st.mmHunt && alive) st.mmLostAt = now;
  st.mmHunt = fighting;
  q.bang = now - (st.mmBangAt ?? -9);
  q.huh = now - (st.mmLostAt ?? -9);
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // "tsk, tsk": the near cross wagged at you
    const k = win(gloat, 0, 0.25, 1.0, 1.4) * freeK;
    go({ shN: -110, elN: -60 + Math.sin(gloat * 14) * 14, hwN: -20, head: -4, tilt: -3 }, k);
    say('scheme', k);
    q.fx = { kind: 'tsk', u: gloat };
  }
  if (!alive) {
    // her strings gone slack: a puppet's heap, crosses dropped
    st.mmDeadAt ??= now;
    const u = now - st.mmDeadAt;
    go({ drop: 0.95, tilt: 18, head: 34, shN: 8, elN: -4, shF: -10, elF: 4, hwN: 30, hwF: -30, fxN: 0.6, fxF: 0.3, chest: 8 });
    q.mood = 'dizzy';
    q.turn = 0.2;
    q.keyRate = 0;
    q.holdN = q.holdF = 1 - sstep(u / 0.25);
    q.dropped = u;
    q.fx = { kind: 'beaten', u };
  } else st.mmDeadAt = undefined;

  if (alive && mv) {
    q.keyRate = 4;
    const snap = s >= 0 ? sstep(s / 0.14) : 0;
    const rel = s >= 0 ? 1 - sstep((s - 0.45) / 0.55) : 0;
    const hitK = snap * rel;
    const wu = sstep(W) * (1 - snap);
    const perf = cast ? sstep(ct / 0.35) : s >= 0 ? rel : 0;
    if (mv === 'tap') {
      go({ shN: -155, elN: -40, tilt: -6, head: -4, turnC: -0.2 }, wu);
      go({ shN: -45, elN: -15, tilt: 9, head: 5, x: 0.03, turnC: 0.3 }, hitK);
      say(hitK > 0.2 ? 'cross' : 'focus');
      if (s >= 0 && s < 0.4) q.fx = { kind: 'tap', u: s };
    } else if (mv === 'flick') {
      go({ shF: 130, elF: 30, tilt: 6, head: -4, turnC: -0.4 }, wu);
      go({ shF: -70, elF: 10, tilt: -6, head: 3, turnC: 0.4, x: 0.02 }, hitK);
      q.flingF = hitK * 0.9 - wu * 0.4;
      say(hitK > 0.2 ? 'scheme' : 'focus');
      if (s >= 0 && s < 0.4) q.fx = { kind: 'flick', u: s };
    } else if (mv === 'twirl') {
      go({ drop: 0.1, tilt: 6, shN: -40, shF: 40 }, wu);
      go({ shN: -95, elN: -10, shF: 95, elF: 10, head: -4 }, hitK);
      q.mirror = s > 0.12 && s < 0.34 ? 1 : 0;
      q.tailsKick = hitK;
      say(hitK > 0.2 ? 'delight' : 'focus');
      if (s >= 0 && s < 0.5) q.fx = { kind: 'twirl', u: s / 0.5 };
    } else if (mv === 'strings') {
      // both crosses up and worked: the strings on each of you
      const k = perf * (1 - wu * 0.3);
      go({ shN: -125 + Math.sin(now * 8) * 14, elN: -40, shF: 125 - Math.sin(now * 8) * 14, elF: 30, head: -6, tilt: -3 }, k);
      go({ shN: -160, elN: -10, shF: 150, elF: 10, head: -8 }, Math.max(wu, hitK));
      q.flingN = Math.sin(now * 8) * 0.3 * k;
      q.flingF = -Math.sin(now * 8) * 0.3 * k;
      q.strLen = 11 + 10 * k;
      say(hitK > 0.2 ? 'delight' : 'scheme');
      q.look = [0.3, -1];
    } else if (mv === 'rap') {
      // both crosses lifted high overhead, then brought down on the tank
      go({ shN: -165, elN: -20, shF: 150, elF: 20, tilt: -6, head: -6 }, Math.max(perf * 0.7, wu));
      go({ shN: -40, elN: -10, shF: -20, elF: 10, tilt: 14, head: 6, x: 0.04 }, hitK);
      say(hitK > 0.2 ? 'cross' : 'focus');
      if (s >= 0 && s < 0.5) q.fx = { kind: 'rap', u: s };
    } else if (mv === 'bow') {
      // a ribbon looped round her hands, round and round, then pulled into a bow
      const loop = Math.sin(now * 7);
      go({ shN: -80 + loop * 12, elN: -95, shF: -30 - loop * 12, elF: 70, head: 6, tilt: 3 }, perf * (1 - hitK));
      go({ shN: -60, elN: -40, shF: 60, elF: 20, head: -4 }, Math.max(wu, hitK));
      q.ribbon = perf;
      q.ribbonPull = Math.max(wu, hitK);
      q.look = [0.4, 0.6];
      say(hitK > 0.2 ? 'delight' : 'coo');
    } else if (mv === 'snip') {
      // her gold scissors out, snapping open and shut
      go({ shN: -85, elN: -12, hwN: -10, tilt: 2, head: -2, shF: 30, elF: 50 }, perf);
      go({ shN: -105, elN: -5, tilt: -4, x: 0.02 }, hitK);
      q.scissors = perf;
      q.snipPh = cast ? (Math.sin(now * 9) + 1) / 2 : 1 - hitK;
      q.holdN = 1 - perf;
      say(hitK > 0.2 ? 'delight' : 'scheme');
      if (s >= 0 && s < 0.5) q.fx = { kind: 'snip', u: s };
    } else if (mv === 'cut') {
      // the crosses lifted and turned: then a snip, and her puppets are let down
      go({ shN: -140, elN: -30, shF: 140, elF: 30, head: -8 }, perf * (1 - hitK));
      go({ shN: -95, elN: -10, shF: 40, elF: 50, head: 4 }, hitK);
      q.strLen = 11 + 16 * perf;
      q.scissors = hitK;
      q.snipPh = 1 - hitK;
      say(hitK > 0.2 ? 'delight' : 'scheme');
      if (s >= 0 && s < 0.6) q.fx = { kind: 'snip', u: s };
    } else if (mv === 'rope') {
      // her arms swung round in great circles, the crosses' strings a jump rope
      const ph = now * 7;
      go({ shN: -90 + Math.cos(ph) * 75, elN: -20, shF: 90 - Math.cos(ph) * 75, elF: 20, head: -2 }, perf);
      add({ hop: 0.06 * Math.max(0, Math.sin(ph * 2)) * perf }, 1);
      q.strLen = 11 + 12 * perf;
      q.flingN = Math.sin(ph) * 0.8 * perf;
      q.flingF = -Math.sin(ph) * 0.8 * perf;
      say(hitK > 0.2 ? 'delight' : 'scheme');
      if (cast) q.fx = { kind: 'rope', u: ct };
    } else if (mv === 'tug') {
      // a pull hard back, then a heave the other way
      const back = cast ? win(cu, 0, 0.15, 0.55, 0.7) : 0;
      const fwd = cast ? sstep((cu - 0.6) / 0.25) : hitK;
      go({ tilt: -14, x: -0.05, shN: -55, elN: -80, shF: 10, elF: 90, head: -6 }, back);
      go({ tilt: 12, x: 0.05, shN: -80, elN: -10, shF: -40, elF: 10, head: 4, fxN: 0.2 }, fwd);
      q.flingN = back * -0.5 + fwd * 0.6;
      q.flingF = q.flingN;
      say(fwd > 0.4 ? 'cross' : 'focus');
    } else if (mv === 'curtain') {
      // arms swept wide, then a deep curtsy as the curtain comes down on everyone
      go({ shN: -115, elN: -10, shF: 115, elF: 10, head: -8, tilt: -4 }, perf * (1 - wu));
      go({ drop: 0.25, tilt: 22, head: 16, shN: -20, elN: -10, shF: 30, elF: 10, fxF: -0.35 }, Math.max(wu, hitK));
      say(perf > 0.4 && wu < 0.3 ? 'scheme' : 'poised');
    }
  }
  // ----- a phase moment (m.phaseAt): the Puppet Show (a flourish), Dance for Me! (arms flung up) -----
  {
    const pu = now - (m.phaseAt ?? -9);
    if (pu >= 0 && pu < 1.8 && !mv && alive) {
      const k = win(pu, 0, 0.25, 1.4, 1.8);
      if ((m.mech?.phase ?? 1) >= 3) {
        go({ tilt: -8, head: -12, shN: -160, elN: -10, shF: 150, elF: 10 }, k);
        say('delight', k);
        q.fx = { kind: 'dance', u: pu };
      } else {
        go({ shN: -130 + Math.sin(pu * 10) * 10, elN: -30, shF: 130, elF: 30, head: -6 }, k);
        say('scheme', k);
        q.fx = { kind: 'show', u: pu };
      }
    }
  }
  // ----- her puppets' strings snapping back on her (m.snapAt): she reels, dizzy, her crosses flung -----
  {
    const su = now - (m.snapAt ?? -9);
    if (su >= 0 && su < 1.6 && !mv && alive) {
      const k = win(su, 0, 0.12, 1.1, 1.6);
      go({ tilt: -10 + Math.sin(su * 14) * 6 * (1 - su / 1.6), head: 10, x: -0.04, shN: -130, elN: -20, shF: 120, elF: 20, drop: 0.1 }, k);
      q.flingN = Math.sin(su * 16) * 0.8 * k;
      q.flingF = -Math.sin(su * 16) * 0.8 * k;
      say(su < 0.5 ? 'startled' : 'dizzy', k);
      q.fx = { kind: 'snapback', u: su };
    }
  }
  // ----- her entrance's acts -----
  if (act && actU >= 0) {
    const d = act.dur ?? 1;
    const ka = win(actU, 0, 0.2, d - 0.1, d + 0.3);
    if (act.move === 'slump' && actU < d) {
      // sat in a heap on the floor, chin down, her own old strings slack from the dark
      go({ drop: 0.92, tilt: 16, head: 30, chest: 6, shN: 6, elN: -6, shF: -6, elF: 6, hwN: 30, hwF: -30, fxN: 0.55, fxF: 0.35 }, sstep(actU / 0.4));
      q.holdN = q.holdF = 0;
      q.ownStr = 1;
      q.ownSlack = 1;
      q.mood = 'sleepy';
      q.turn = 0.2;
      q.keyRate = 0;
    } else if (act.move === 'jerk' && actU < d + 0.4) {
      // the strings go taut and pull her up limb by limb: head, an arm, the other, the knees, up
      const u = actU;
      const hd = sstep((u - 0.1) / 0.2);
      const aN = sstep((u - 0.55) / 0.2);
      const aF = sstep((u - 0.95) / 0.2);
      const up = sstep((u - 1.4) / 0.5);
      const down = sstep((u - (d - 0.5)) / 0.5);
      go({ drop: 0.92 - 0.62 * sstep((u - 1.4) / 0.25) - 0.3 * up, tilt: 16 * (1 - up), chest: 6 * (1 - up), fxN: 0.55 * (1 - up), fxF: 0.35 * (1 - up), hwN: 30 * (1 - aN), hwF: -30 * (1 - aF) }, 1);
      go({ head: -14 }, hd * (1 - up * 0.6));
      go({ shN: -150, elN: -20 }, aN * (1 - down));
      go({ shF: 140, elF: 20 }, aF * (1 - down));
      q.holdN = q.holdF = 0;
      q.ownStr = 1;
      q.ownSlack = 1 - Math.max(hd * 0.5, up);
      q.mood = u < 0.15 ? 'sleepy' : up > 0.5 ? 'scheme' : 'startled';
      q.keyRate = 2 * up;
      if (u > 1.4 && u < 2.2) q.fx = { kind: 'jerk', u: u - 1.4 };
    } else if (act.move === 'snip' && actU < d + 0.4) {
      // her gold scissors: her own strings snipped away overhead; the crosses caught as they drop
      const u = actU;
      const cutAt = d * 0.4;
      go({ shN: -160 + 50 * sstep((u - cutAt) / 0.4), elN: -10, shF: 20, elF: 40, head: -10 + 10 * sstep((u - cutAt) / 0.4) }, ka);
      q.scissors = ka * (1 - sstep((u - cutAt - 0.3) / 0.3));
      q.snipPh = u < cutAt ? (Math.sin(u * 14) + 1) / 2 : 1;
      q.ownStr = 1;
      q.ownCut = u - cutAt;
      q.ownSlack = 0;
      const catchK = sstep((u - cutAt - 0.3) / 0.35);
      q.holdN = catchK;
      q.holdF = catchK;
      q.mood = u < cutAt + 0.2 ? 'focus' : 'delight';
      if (u > cutAt && u < cutAt + 0.8) q.fx = { kind: 'snip', u: u - cutAt };
    } else if (act.move === 'curtsy') {
      go({ drop: 0.25, tilt: 10, head: 12, shN: -30, elN: -10, shF: 30, elF: 10, fxF: -0.35 }, ka);
      say('poised', ka);
    } else if (act.move === 'windup') {
      go({ shN: -150, elN: -30, shF: 140, elF: 20, tilt: -4 }, ka);
      q.strLen = 11 + 8 * ka;
      say('scheme', ka);
    } else if (act.move === 'sway') {
      go({ tilt: Math.sin(actU * (act.speed ?? 3.5)) * 5, pelvis: Math.sin(actU * (act.speed ?? 3.5)) * 4, shN: -70 + Math.sin(actU * 6) * 14, elN: -60, shF: 40 - Math.sin(actU * 6) * 14 }, ka);
      say('delight', ka);
    }
  }
  if (alive && !mv) {
    // her idle act: only when calm
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.mmCalm = mix(st.mmCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.mmCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, q, sstep(st.mmCalm), t, now, st);
    if (cineMood) q.mood = { angry: 'cross', happy: 'delight', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low) {
      if (!cineMood) q.mood = q.mood === 'poised' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
      q.keyRate *= 0.5;
    }
    if (m.talking) q.mood = 'talk';
    if (hurt) q.mood = 'hurt';
  }
  q.turn = spring(st, 'mmTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.poised;
  const f = (st.mmF ??= { ...FACES.poised, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2], pk: v[3] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'bt', 'by', 'mw', 'ms', 'mo', 'pk', 'bl', 'sm', 'sly']) f[k] = mix(f[k], tgt[k], k === 'lid' ? 1 - Math.exp(-dt * (tgt[k] > f[k] ? 40 : 18)) : kf);
  for (const sh of SHUTS) f.shut[sh] = mix(f.shut[sh], sh === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.mmF = f;
  // (a twirl: the picture mirrored at its middle, never squashed)
  st.mmMirror = q.mirror;
  // springs: fringe, locks, ponytail, coat tails, skirt, jabot, bow, crosses, hat
  const kick = (st.mmLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.mmLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.mmLast = out.head;
  st.mmLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  const headR = (((out.head ?? 0) + (out.tilt ?? 0)) * Math.PI) / 180;
  q.fringe = [0, 1, 2, 3, 4, 5].map((i) => clamp(spring(st, `fr${i}`, Math.sin(t * 1.1 + i * 0.9) * 0.1 - headR * 0.6, 160 + i * 9, 13, dt, kick * 0.02), -0.5, 0.5));
  q.locks = [0, 1].map((i) => clamp(spring(st, `lk${i}`, -headR * 2.4 + Math.sin(t * 1.2 + i * 2) * 0.2 + step * 0.3, 90 + i * 11, 8, dt, kick * 0.04), -1.6, 1.6));
  a.mmTail = [0, 1, 2, 3, 4].map((i) => spring(st, `pt${i}`, [2.3, 2.05, 1.85, 1.7, 1.6][i] - headR * 0.4 + Math.sin(t * 1.3 - i * 0.6) * 0.07 + step * 0.1 + (q.tailsKick ?? 0) * 0.3, 70 - i * 7, 6.5, dt, kick * 0.012));
  q.tails = [0, 1].map((i) => clamp(spring(st, `ct${i}`, -((out.tilt ?? 0) * Math.PI) / 180 * 0.5 + walkW * 0.22 + Math.sin(t * 1.3 + i) * 0.04 + step * 0.1 + (q.tailsKick ?? 0) * 0.5, 80 - i * 9, 7, dt, kick * 0.01), -0.15, 0.9));
  q.skirt = [0, 1, 2].map((i) => clamp(spring(st, `sk${i}`, -((out.tilt ?? 0) * Math.PI) / 180 * 0.3 + step * 0.06 + Math.sin(t * 1.5 + i) * 0.02 + (q.tailsKick ?? 0) * 0.15, 110 - i * 10, 9, dt, kick * 0.01), -0.4, 0.4));
  q.jabot = spring(st, 'jb', -headR * 0.5 + step * 0.2, 120, 10, dt, kick * 0.02);
  q.bowFl = spring(st, 'bw', Math.sin(t * 1.7) * 0.3 + step * 0.5, 100, 8, dt, kick * 0.03);
  q.hatA = clamp(spring(st, 'ht', q.hatA ?? 0, 140, 12, dt, kick * 0.004), -0.3, 0.3);
  for (const k of ['N', 'F']) {
    q[`crossA${k}`] = clamp(spring(st, `ca${k}`, Math.sin(t * 1.6 + (k === 'N' ? 0 : 1.7)) * 0.08 + step * 0.06, 90, 7, dt, kick * 0.01), -0.6, 0.6);
    q[`swing${k}`] = clamp(spring(st, `sw${k}`, step * 0.3 + Math.sin(t * 1.2 + (k === 'N' ? 0 : 2)) * 0.06, 50, 4, dt, kick * 0.015), -0.8, 0.8);
  }
  st.mmKeyRate = mix(st.mmKeyRate ?? q.keyRate, q.keyRate, 1 - Math.exp(-dt * 3));
  st.mmKeyA = ((st.mmKeyA ?? (m.uid ?? 0) * 0.7) + st.mmKeyRate * dt) % (TAU * 100);
  q.keyA = st.mmKeyA;
  q.scissorsK = clamp(spring(st, 'scK', q.scissors, 140, 16, dt), 0, 1);
  q.holdN = clamp(spring(st, 'hN', q.holdN, 160, 18, dt), 0, 1);
  q.holdF = clamp(spring(st, 'hF', q.holdF, 160, 18, dt), 0, 1);
  q.ribbonK = clamp(spring(st, 'rbK', q.ribbon ?? 0, 120, 14, dt), 0, 1);
  // (the strings flung out by her moves, eased: never a jump)
  q.flingN = spring(st, 'flN', q.flingN, 180, 20, dt);
  q.flingF = spring(st, 'flF', q.flingF, 180, 20, dt);
  q.strLen = spring(st, 'sLen', q.strLen, 120, 18, dt);
}
const PIECES = [
  { name: 'sew', t0: 0.4, len: 7 },
  { name: 'tryout', t0: 8, len: 7.2 },
  { name: 'twirl', t0: 15.8, len: 6.4 },
  { name: 'preen', t0: 22.8, len: 6.6 },
];
function idleAct(m, a, out, go, add, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.mmPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.mmPiece = cur.name;
      else return;
    }
  } else {
    st.mmPiece = null;
    return;
  }
  const u = lu - cur.t0;
  const at = (k) => k * w > 0.5;
  if (cur.name === 'sew') {
    // a string re-threaded: the near cross held up at her chest, long pulls of thread with the other hand
    const k = win(u, 0, 0.5, 6.5, 7);
    const pull = (Math.sin(u * 2.2 - 1.2) + 1) / 2;
    go({ shN: -70, elN: -100, hwN: 10, shF: 20 + pull * 70, elF: 90 - pull * 60, head: 8, tilt: 2 }, k * w);
    if (at(k)) {
      q.mood = u > 5.4 ? 'delight' : 'poised';
      q.look = [0.6, 0.8];
      q.thread = { pull, k };
    }
  } else if (cur.name === 'tryout') {
    // the crosses tried: worked in time, their strings dancing, her hips swaying
    const k = win(u, 0, 0.5, 6.7, 7.2);
    const b = now * 5;
    go({ shN: -75 + Math.sin(b) * 22, elN: -50, shF: 50 + Math.sin(b + Math.PI) * 22, elF: 40, pelvis: Math.sin(b * 0.5) * 5, tilt: Math.sin(b * 0.5) * 2, head: Math.sin(b * 0.5 + 0.6) * 4 }, k * w);
    q.flingN = Math.sin(b) * 0.4 * k * w;
    q.flingF = Math.sin(b + Math.PI) * 0.4 * k * w;
    if (at(k)) {
      q.mood = 'delight';
      q.keyRate = 2.4;
    }
  } else if (cur.name === 'twirl') {
    // a twirl (the picture mirrored at its middle, never squashed), then a curtsy
    const k = win(u, 0, 0.5, 5.9, 6.4);
    const tw = win(u, 0.6, 0.9, 1.4, 1.8);
    go({ shN: -95, elN: -10, shF: 95, elF: 10, head: -4, tilt: -2 }, tw * k * w);
    const cs = win(u, 2.4, 3.0, 4.8, 5.6);
    go({ drop: 0.25, tilt: 8, head: 12, shN: -30, elN: -10, shF: 30, elF: 10, fxF: -0.35 }, cs * k * w);
    if (at(k)) {
      q.mirror = u > 1.0 && u < 1.25 ? 1 : 0;
      q.tailsKick = tw;
      q.mood = cs > 0.3 ? 'poised' : 'delight';
      if (u > 0.8 && u < 1.6) q.fx = { kind: 'twirl', u: (u - 0.8) / 0.8 };
    }
  } else {
    // preening: her hat set straight with a tap, a side lock smoothed, a pleased little smile
    const k = win(u, 0, 0.5, 6.1, 6.6);
    const hatK = win(u, 0.5, 1.0, 2.4, 2.9);
    const lockK = win(u, 3.0, 3.5, 5.0, 5.6);
    go({ shN: -158, elN: -120, hwN: -20, head: -4, tilt: -2 }, hatK * k * w);
    go({ shN: -110, elN: -135, hwN: 10, head: 6 }, lockK * k * w);
    if (at(k)) {
      q.hatA = hatK * Math.sin(u * 6) * 0.08;
      q.mood = lockK > 0.3 || hatK > 0.3 ? 'scheme' : 'poised';
    }
  }
}

// ---------- Her marks and effects (rig space, over everything) ----------
function bubble(ctx, x, y, mark, e, len, fl) {
  const inn = sstep(e / 0.18);
  const outK = 1 - sstep((e - len + 0.25) / 0.25);
  const k = inn * outK;
  if (k <= 0.01) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  ctx.scale(fl * k, k);
  // her marks sit on a lilac harlequin diamond, its corners rounded
  ctx.beginPath();
  ctx.moveTo(0, -7.4);
  ctx.quadraticCurveTo(0.8, -0.8, 6.4, 0);
  ctx.quadraticCurveTo(0.8, 0.8, 0, 7.4);
  ctx.quadraticCurveTo(-0.8, 0.8, -6.4, 0);
  ctx.quadraticCurveTo(-0.8, -0.8, 0, -7.4);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#f6efff';
  ctx.fill();
  pen(ctx, mark === '!' ? '#8a5cb0' : '#4a9a82', 1);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#8a5cb0' : '#4a9a82';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -3.2);
    ctx.lineTo(0, 0.4);
  } else {
    ctx.moveTo(-1.3, -1.8);
    ctx.quadraticCurveTo(-1.0, -3.4, 0.4, -3.2);
    ctx.quadraticCurveTo(1.8, -2.9, 1.2, -1.3);
    ctx.quadraticCurveTo(0.3, -0.6, 0.2, 0.5);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.2, 0.8, 0.8);
  ctx.fill();
  ctx.restore();
}
function swish(ctx, cx, cy, r, a0, a1, w, al, col = '#fbf6ff', rim = '#a088d6') {
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
// Her gold scissors (rig space): two looped handles, two blades opening by `open`.
function scissors(ctx, x, y, ang, s, open, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.rotate(sd * open * 0.35);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(5, sd * 1.4, 10, sd * 0.3);
    ctx.quadraticCurveTo(5, sd * -0.2, 0, sd * -0.6);
    ctx.closePath();
    ctx.fillStyle = '#f4f0f8';
    ctx.fill();
    pen(ctx, '#9a8aa8', 0.5);
    ctx.stroke();
    ell(ctx, -3.4, sd * 1.8, 1.9, 1.5);
    pen(ctx, GOLD[2], 1.2);
    ctx.stroke();
    ctx.restore();
  }
  ell(ctx, 0, 0, 0.8, 0.8);
  ctx.fillStyle = GOLD[1];
  ctx.fill();
  ctx.restore();
}
// A loop of mint ribbon (rig space) between her hands, fluttering; pulled into a bow at the end.
function ribbon(ctx, p0, p1, t, k, pull) {
  if (k <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= k;
  const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
  const r = 6 * (1 - pull * 0.6);
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.ellipse(mid[0], mid[1] - 1, r + i * 1.4, (r * 0.55 + i) * (0.8 + 0.2 * Math.sin(t * 7 + i)), t * 1.5 * (i ? -1 : 1) * (1 - pull), 0, TAU);
    pen(ctx, i ? MINT[2] : MINT[1], 1.4 - i * 0.4);
    ctx.stroke();
  }
  if (pull > 0.3) {
    for (const sd of [-1, 1]) {
      ell(ctx, mid[0] + sd * 3, mid[1] - 1, 3, 1.7, sd * 0.3);
      ctx.fillStyle = MINT[1];
      ctx.fill();
      pen(ctx, MINT[3], 0.5);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// Her own old strings, from her crown, wrists and knees up into the dark (her entrance only): slack or
// taut, or snipped (the top whips away up, the cut ends drift down and fade).
function ownStrings(ctx, a, D, q) {
  if (!(q.ownStr > 0.01)) return;
  const ends = [headAt(a, D, [0, -18]), ptOf(a, D, 'armNf', D.J.wrN), ptOf(a, D, 'armFf', D.J.wrF), ptOf(a, D, 'shinN', D.J.kneeN), ptOf(a, D, 'shinF', D.J.kneeF)];
  const cut = q.ownCut ?? -1;
  ctx.save();
  ctx.lineCap = 'round';
  ends.forEach((e, i) => {
    const topX = e[0] + (i - 2) * 3;
    const topY = -240;
    ctx.save();
    if (cut < 0) {
      const sl = q.ownSlack ?? 0;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(mix(topX, e[0], 0.5) + sl * 8 * (i % 2 ? 1 : -1), mix(topY, e[1], 0.6) + sl * 20, e[0], e[1]);
    } else {
      const u = clamp(cut / 0.8, 0, 1);
      const cy = e[1] - 26;
      ctx.globalAlpha *= 1 - u;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(mix(topX, e[0], 0.9), cy - u * 140);
      ctx.moveTo(e[0], e[1]);
      ctx.quadraticCurveTo(e[0] + 3 * u, e[1] - 12 + 10 * u, e[0] + 2 * u, cy + 20 * u);
    }
    pen(ctx, tone(a, '#c8b098', 0.7), 0.8);
    ctx.stroke();
    pen(ctx, tone(a, THREAD, 0.95), 0.35);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  for (const mode of ['line', 'fill']) {
    tails(ctx, a, mode, D);
    ponytail(ctx, a, mode, D);
    key(ctx, a, mode, D);
  }
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.mmQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -26]);
  const hd = headAt(a, D, [4, 0]);
  const hN = ptOf(a, D, 'handN', D.J.handN);
  const hF = ptOf(a, D, 'handF', D.J.handF);
  ownStrings(ctx, a, D, q);
  // the thread she pulls through while sewing, a needle's glint in her fingers
  if (q.thread) {
    const cN = crossAt(a, D, 'N');
    const e = crossEnds(cN.p, cN.ang, cN.s)[2];
    ctx.save();
    ctx.globalAlpha *= q.thread.k;
    ctx.beginPath();
    ctx.moveTo(...e);
    ctx.quadraticCurveTo((e[0] + hF[0]) / 2, Math.max(e[1], hF[1]) + 4, hF[0], hF[1]);
    pen(ctx, THREAD, 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hF[0] - 0.5, hF[1] - 1.6);
    ctx.lineTo(hF[0] + 1.6, hF[1] + 0.6);
    ctx.lineCap = 'round';
    pen(ctx, '#e8e4f0', 0.5);
    ctx.stroke();
    sparkle(ctx, hF[0] + 1.6, hF[1] - 1, 1.2 * Math.sin(Math.PI * q.thread.pull), 0.9, '#ffffff');
    ctx.restore();
  }
  if (q.ribbonK > 0.01) ribbon(ctx, hN, hF, t, q.ribbonK, q.ribbonPull ?? 0);
  if (q.scissorsK > 0.01) scissors(ctx, hN[0] + 1, hN[1] - 1, -0.5, 0.75, q.snipPh ?? 0.5, q.scissorsK);
  // crosses dropped when she's beaten: down to the floor beside her
  if (q.dropped != null) {
    const u = clamp(q.dropped / 0.45, 0, 1);
    const e = 1 - (1 - u) ** 2;
    crossShape(ctx, a, 'fill', [mix(hN[0], hN[0] + 8, e), mix(hN[1], -4, e)], u * 1.2, 0.62, true);
    crossShape(ctx, a, 'fill', [mix(hF[0], hF[0] - 9, e), mix(hF[1], -4, e)], -u * 1.4, 0.56, false);
  }
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0 && !m.cine) bubble(ctx, crown[0] + 4, crown[1] - 6, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0 && !m.cine) bubble(ctx, crown[0] + 4, crown[1] - 6, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  if (X.kind === 'tap') {
    const k = clamp(u / 0.35, 0, 1);
    swish(ctx, hd[0], hd[1] + 12, 18, -1.7 + k * 0.4, 0.3 + k * 0.4, 4, 1 - k);
    for (let i = 0; i < 3; i++) star(ctx, hN[0] + 6 + Math.cos(i * 1.4 - 1) * (2 + k * 7), hN[1] + Math.sin(i * 1.4 - 1) * (2 + k * 5), 1.8 * (1 - k * 0.5), i, 1 - k * 0.6);
  } else if (X.kind === 'flick') {
    const k = clamp(u / 0.35, 0, 1);
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.globalAlpha *= 1 - k;
      ctx.beginPath();
      ctx.moveTo(hF[0], hF[1]);
      ctx.quadraticCurveTo(hF[0] + 14 + i * 3, hF[1] - 10 + i * 4, hF[0] + 26 + k * 10, hF[1] + 2 + i * 3);
      pen(ctx, THREAD, 0.6);
      ctx.stroke();
      ctx.restore();
    }
    sparkle(ctx, hF[0] + 26 + k * 10, hF[1] + 4, 2.4 * (1 - k), 1, '#fff2c4');
  } else if (X.kind === 'twirl') {
    const k = clamp(u, 0, 1);
    swish(ctx, 0, -30, 20, Math.PI * 0.2 + k * 3, Math.PI * 1.2 + k * 3, 3.6, Math.sin(Math.PI * k) * 0.8);
  } else if (X.kind === 'rap') {
    const k = clamp(u / 0.5, 0, 1);
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI / 2 + (i - 2) * 0.5;
      star(ctx, hN[0] + 8 + Math.cos(an) * (4 + k * 12), hN[1] + Math.sin(an) * (4 + k * 8), 2.2 * (1 - k * 0.6), an, 1 - k);
    }
  } else if (X.kind === 'snip') {
    const k = clamp(u / 0.6, 0, 1);
    if (u < 0.7) cue(ctx, 'snip!', hd[0] + 18, hd[1] - 24, 7, fl, -0.12, '#64408a', '#f6efff');
    for (let i = 0; i < 2; i++) {
      ctx.save();
      ctx.globalAlpha *= 1 - k;
      ctx.beginPath();
      ctx.moveTo(hN[0] + 8 + i * 3, hN[1] - 6 + k * 10);
      ctx.quadraticCurveTo(hN[0] + 10 + i * 3, hN[1] - 2 + k * 12, hN[0] + 9 + i * 3 + k * 2, hN[1] + 2 + k * 14);
      pen(ctx, THREAD, 0.5);
      ctx.stroke();
      ctx.restore();
    }
  } else if (X.kind === 'rope') {
    // the jump rope's arc: a gold thread swung right round in front of her
    const ph = (u * 7) % TAU;
    ctx.save();
    ctx.globalAlpha *= 0.85;
    ctx.beginPath();
    ctx.ellipse(0, -30, 26, 30, 0, ph - 0.9, ph + 0.9);
    pen(ctx, THREAD, 0.9);
    ctx.stroke();
    ctx.restore();
  } else if (X.kind === 'jerk') {
    const k = clamp(u / 0.6, 0, 1);
    dust(ctx, -6, -1.5, 3 + k * 4, 0.7 * (1 - k), '#f6efff', '#c9b0f0');
    dust(ctx, 8, -1.5, 3 + k * 4, 0.7 * (1 - k), '#f6efff', '#c9b0f0');
  } else if (X.kind === 'tsk') {
    if (u < 1.1) cue(ctx, 'tsk tsk', hd[0] + 20, hd[1] - 22, 6, fl, -0.1, '#64408a', '#f6efff');
    sparkle(ctx, hN[0] + 4, hN[1] - 6, 1.8 * Math.sin(Math.PI * clamp(u / 1.2, 0, 1)), 1, '#f2e8ff');
  } else if (X.kind === 'show') {
    if (u < 1.4) cue(ctx, 'Showtime!', hd[0] + 22, hd[1] - 26, 7, fl, -0.12, '#64408a', '#f6efff');
    for (let i = 0; i < 5; i++) sparkle(ctx, hd[0] - 20 + i * 10, hd[1] - 18 - Math.sin(Math.PI * clamp(u / 1.4 + i * 0.08, 0, 1)) * 8, 2.2 * Math.sin(Math.PI * clamp(u / 1.6, 0, 1)), 1, i % 2 ? '#e2fbf2' : '#f2e8ff');
  } else if (X.kind === 'dance') {
    if (u < 1.4) cue(ctx, 'Dance for me!', hd[0] + 26, hd[1] - 28, 7, fl, -0.1, '#64408a', '#f6efff');
    const v = clamp(u / 1.2, 0, 1);
    for (let i = 0; i < 6; i++) {
      const an = -Math.PI / 2 + (i - 2.5) * 0.45;
      ctx.save();
      ctx.globalAlpha *= (1 - v) * 0.9;
      ctx.beginPath();
      ctx.moveTo(hd[0], hd[1] - 10);
      ctx.lineTo(hd[0] + Math.cos(an) * (20 + v * 50), hd[1] - 10 + Math.sin(an) * (20 + v * 50));
      ctx.lineCap = 'round';
      pen(ctx, THREAD, 0.7);
      ctx.stroke();
      ctx.restore();
    }
  } else if (X.kind === 'snapback') {
    // the snapped strings whipping back at her: gold threads flying in, little stars round her head
    const v = clamp(u / 0.6, 0, 1);
    for (let i = 0; i < 4; i++) {
      const an = -2.4 + i * 0.5;
      ctx.save();
      ctx.globalAlpha *= 1 - v;
      ctx.beginPath();
      ctx.moveTo(hd[0] + Math.cos(an) * (40 - v * 30), hd[1] + Math.sin(an) * (40 - v * 30));
      ctx.quadraticCurveTo(hd[0] + Math.cos(an + 0.4) * 20, hd[1] + Math.sin(an + 0.4) * 20, hd[0], hd[1]);
      ctx.lineCap = 'round';
      pen(ctx, THREAD, 0.7);
      ctx.stroke();
      ctx.restore();
    }
    if (u > 0.3) dizzy(ctx, crown[0], crown[1] + 8, 8, t, 3);
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] + 8, 9, t, 3);
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.4, 0.6 * (1 - u / 0.6), '#f6efff', '#c9b0f0');
  }
}

const DRESS = {
  id: 'marionetta',
  // (the skin is her painted porcelain; her clothes are cut over it from the same outline)
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    armF: (ctx, a, mode, S, D) => {
      sleeve(ctx, a, mode, D, 'F');
      cuff(ctx, a, mode, D, 'F');
      heldCross(ctx, a, mode, D, 'F');
    },
    handFskin: (ctx, a, mode, S, D) => hand(ctx, a, mode, D, 'F'),
    legF: (ctx, a, mode, S, D) => stocking(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => boot(ctx, a, mode, D, 'F'),
    legN: (ctx, a, mode, S, D) => stocking(ctx, a, mode, D, 'N'),
    footNskin: (ctx, a, mode, S, D) => boot(ctx, a, mode, D, 'N'),
    torsoSkin: (ctx, a, mode, S, D) => coat(ctx, a, mode, D),
    neckSkin: (ctx, a, mode, S, D) => jabot(ctx, a, mode, D),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => {
      sleeve(ctx, a, mode, D, 'N');
      cuff(ctx, a, mode, D, 'N');
      heldCross(ctx, a, mode, D, 'N');
    },
    handNskin: (ctx, a, mode, S, D) => hand(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('madame', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  // (a twirl: the picture mirrored for its middle beat, never squashed)
  if (a.mo?.rig?.mmMirror) ctx.scale(-1, 1);
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.35);
export const MADAME_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [90, 180, 260, 220], draw: R.still, rig, noHop: true, ownEmotes: true };
export const MADAME_SIZE = { w: 44, h: Math.round(R.H * BIG * 1.05), speed: Math.round(R.speed * BIG) };
