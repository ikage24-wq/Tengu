// The Masquerade Diva (the Understudy Ghost; first remade 2026-11-25 on the spirit base, the player's pick
// "B"; rebuilt to today's standard 2026-11-27, her idea kept; the id stays `understudy`). The theatre's
// understudy: a little ghost who has borrowed the leading lady's costume, three sizes too big, and plays
// the star in it every night to an empty house. Her own copy of the spirit base (rig.js, body.js `spirit`:
// a slim upper body over a wisp, hovering), dressed here; her head, hair, gown, boa, mask and wisp drawn
// here from scratch over the mannequin (never the shared face, never the hero).
//   look    pale lilac ghost skin; glossy plum hair: an even blunt fringe cut in five sections just above
//           her lashes (round cut, longest in the middle), a long ringlet each side outside her cheeks,
//           long back hair falling behind her shoulders, and curls piled high and pinned (swirls wound
//           into them, a pin with a pearl) under a gold tiara that never sits straight; all lit from one
//           shared light with one shine band. Her gown is worn: the bodice and its long sleeves are the
//           base's own skin in wine velvet (so they fold with every pose), puffed and slashed at the
//           shoulders (pink lining showing, gold bands), a high lace collar under a pink feather boa,
//           a brocade stomacher to a pointed waist and a jewel brooch; the skirt hangs from her waist in
//           two velvet panels (back and a brocade front) on springs, gold at the hem, a pinned tuck where
//           it's three sizes too big; below it her ghost wisp trails and curls. Lace cuffs at her pale
//           ghost hands. A gold masquerade mask on a ribboned stick in her near hand, its feathers
//           swaying, always held up beside her face, never over it. Her own soft plum outline, outer
//           edge only, face bare.
//   eyes    her own "footlight eyes": long almonds lifted at the outer corner, a layered violet iris lit
//           from below and a jewel glint (a soft rounded diamond) and a small round one; a heavy smooth
//           lash line thickening to a soft upturned wing with two short round flicks; short round brows
//           that do her acting; a beauty mark under her near eye; rouged lips.
//   glide   a stately ghost's glide, her far hand on her hip, the mask held up, the skirt trailing.
//   idle    four pieces, each the next that fits the time she has before she moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - warm-up (5.8 s): a hand on her heart, singing scales (notes float up), rising up on the high
//             note;
//           - toss (5.2 s): a hair toss, her far hand flicking back past her ringlet; the tiara slips
//             crooked; a pout; composed again;
//           - fright (5.6 s): she spots the (empty) audience, jumps, fans herself in a fluster with the
//             mask, a bead of sweat; a deep breath to compose herself;
//           - curtsy (8.4 s): her skirt held out, a deep curtsy, roses landing round her; then a pose with
//             the mask beside her face, a wink and a blown kiss.
//   moves   Aria (a deep breath, a hand on her heart, chin up; then her arms flung open and a high note
//           belted at you, a burst of notes and sparkles bowling out); Mask Swat (the mask wound back
//           over her shoulder; then swatted down at you, its feathers puffing); Swoon (the back of her hand
//           to her brow, swaying back, "oh!"; then a theatrical faint forward onto you, and up again
//           with a flourish).
//   else    hurt: a gasp, the tiara knocked crooked; after landing a hit: a smug little curtsy; hunting
//           you: the mask raised beside her face, a cool look; low on health: a dramatic fret, the back
//           of her hand to her brow, a bead of sweat; a nap (habitat): dozing as she floats, the mask
//           lowered; beaten: dizzy. Her marks over her head (!, ?, z's, sweat) are her own: little
//           gold dressing-room stars (`ownEmotes`).
// Every effect is drawn here, live, in her own soft style: music notes with a white rim, pink hearts,
// soft boa feathers, roses, twinkles; never specks.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, dizzy, sweat } from './fx.js';

const BIG = 0.9;
const LW = 1.6 / BIG;
const INK = '#7a4a78';
const GHOST = ['#ffffff', '#fbf6ff', '#ece2f8', '#d8c8ee'];
const HAIR = ['#c498dc', '#8e5aac', '#6c3a88', '#4e2266'];
const HAIR_INK = '#5e3478';
const VEL = ['#e8789a', '#c04a6c', '#9a3254', '#741e3c'];
const LINING = ['#ffe0ea', '#ffb4cc'];
const GOLD = ['#fff2b8', '#ffd36a', '#d8a040'];
const BOA = ['#fff2f6', '#ffcadc', '#f6a2c2'];
const LACE = ['#ffffff', '#f6eefc', '#ddd0ec'];
const PANEL = ['#ffd6e2', '#f2a6c0', '#d87a9c'];
const GEM = ['#e6fcff', '#7ae0e8', '#3aa8b8'];
const WISP = ['#fbf6ff', '#ecdcf8', '#d4bcec', '#b89cdc'];
const LASH = '#3a1e48';
const IRIS = ['#3a1a52', '#6a2a98', '#a85ad8', '#dcb8ff'];
const LIP = ['#ff9ab8', '#d8406a', '#a82a50'];
const NOTE_COLS = ['#ff7aa8', '#b890ff', '#ffc85a', '#7ad8e8'];

const paint = (ctx, a, mode, col, ink = INK, w = LW) => {
  if (mode === 'line') {
    pen(ctx, ink, w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};

// ---------- Frames ----------
const NECK = [80.7, 69.8];
const HS = 1;
const HO = [0.8, -18.6];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const SK_B = [76, 90];
const SK_F = [84, 90];
const JOINTS = { skB: SK_B, skF: SK_F };
const PIV2 = { skB: 'skB', skF: 'skF' };
const SOFTS = [
  // (her skirt's two panels hang from her waist and swing on their own, the front stiffer with brocade)
  { name: 'skB', parent: 'torso', pivot: 'skB', rot: (S, a) => a.gl?.skirtB ?? 0, soft: { k: 70, c: 6, gain: 0.42, turn: 0.6, hang: 0.3, max: 10, flutter: 1.2, hz: 0.42, dir: [-3, 10] } },
  { name: 'skF', parent: 'torso', pivot: 'skF', rot: (S, a) => a.gl?.skirtF ?? 0, soft: { k: 95, c: 7.4, gain: 0.32, turn: 0.5, hang: 0.3, max: 8, flutter: 0.9, hz: 0.5, dir: [2, 10] } },
];
const pivOf = (D, bone) => D.J[D.PIV[bone] ?? PIV2[bone] ?? bone];
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = pivOf(D, bone);
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => {
  const q = pivOf(D, bone);
  return D.at(a, bone, [(p[0] - q[0]) * D.SC, (p[1] - q[1]) * D.SC]);
};
const headAt = (a, D, uv) => ptOf(a, D, 'head', hk(uv));
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
}

// ---------- Her face ----------
const FACES = {
  calm: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'calm' },
  smug: { e: 'open', g: [1.2, 0.2], b: [-0.6, 0.4], m: 'smirk' },
  sing: { e: 'happy', b: [-0.8, -1.2], m: 'sing' },
  belt: { e: 'happy', b: [-1.4, -1.8], m: 'belt' },
  pout: { e: 'open', g: [-1.2, 0.6], b: [0.8, 0.6], m: 'pout' },
  gasp: { e: 'wide', g: [1.6, 0.4], b: [-2, -2.2], m: 'o' },
  fluster: { e: 'squeeze', b: [1.2, -1.6], m: 'wobble' },
  breathe: { e: 'shut', b: [-0.4, -0.8], m: 'o' },
  happy: { e: 'happy', b: [-0.9, -1], m: 'smile' },
  wink: { e: 'wink', g: [1.2, 0.2], b: [-0.8, -0.4], m: 'smile' },
  kiss: { e: 'happy', b: [-0.6, -0.6], m: 'kiss' },
  cool: { e: 'open', g: [1.6, 0.4], b: [-0.4, 1], m: 'smirk' },
  focus: { e: 'open', g: [1.4, -0.6], b: [-0.6, 0.4], m: 'calm' },
  swoon: { e: 'shut', b: [1.2, -1.6], m: 'o' },
  shout: { e: 'squeeze', b: [-0.8, 1.6], m: 'belt' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'o' },
  worried: { e: 'open', g: [0.3, -0.8], b: [1.4, -1.8], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [1.6, -2], m: 'pout' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'calm' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['sing', 'belt', 'fluster', 'breathe', 'happy', 'wink', 'kiss', 'swoon', 'shout', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// Her almond eye, lifted at the outer corner (o: +1 the near eye, its outer corner to the right).
function eyePath(ctx, x, y, w, h, o) {
  ctx.beginPath();
  ctx.moveTo(x - w * o, y + h * 0.18);
  ctx.bezierCurveTo(x - w * 0.7 * o, y - h * 1.05, x + w * 0.55 * o, y - h * 1.15, x + w * 1.05 * o, y - h * 0.4);
  ctx.bezierCurveTo(x + w * 0.85 * o, y + h * 0.75, x - w * 0.5 * o, y + h * 1.1, x - w * o, y + h * 0.18);
  ctx.closePath();
}
// Her lash line: one closed soft shape, thin at the inner corner, thickening to an upturned wing, with
// two short round-tipped flicks grown from it.
function lash(ctx, a, x, y, w, h, o) {
  ctx.beginPath();
  ctx.moveTo(x - w * o, y + h * 0.1);
  ctx.bezierCurveTo(x - w * 0.7 * o, y - h * 1.12, x + w * 0.55 * o, y - h * 1.22, x + w * 1.08 * o, y - h * 0.48);
  ctx.quadraticCurveTo(x + w * 1.42 * o, y - h * 0.72, x + w * 1.55 * o, y - h * 1.0);
  ctx.quadraticCurveTo(x + w * 1.3 * o, y - h * 0.4, x + w * 1.0 * o, y - h * 0.22);
  ctx.bezierCurveTo(x + w * 0.5 * o, y - h * 0.92, x - w * 0.6 * o, y - h * 0.86, x - w * o, y + h * 0.1);
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  stroke3(ctx, a, [x + w * 0.62 * o, y - h * 0.92], [x + w * 0.78 * o, y - h * 1.12], [x + w * 0.9 * o, y - h * 1.18], 0.95, LASH);
  stroke3(ctx, a, [x + w * 0.9 * o, y - h * 0.72], [x + w * 1.08 * o, y - h * 0.9], [x + w * 1.22 * o, y - h * 0.94], 0.9, LASH);
}
function eye(ctx, a, x, y, o, f) {
  const w = 3.8;
  const h = 4.4;
  let kind = f.e;
  if (kind === 'wink') kind = o > 0 ? 'happy' : 'open';
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 0.8], [x, y - h * 0.9], [x + w, y + 0.6 - o * 0.4], 1.35, LASH);
    stroke3(ctx, a, [x + w * o, y + 0.6 - o * 0.4], [x + (w + 0.8) * o, y - 0.2], [x + (w + 1.1) * o, y - 0.9], 0.75, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 1.8], [x + w * 0.3 * o, y - 0.2], [x + w * 0.9 * o, y + 0.2], 1.3, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2], [x + w * 0.2 * o, y + 1], [x + w * 0.9 * o, y + 0.4], 1.15, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y + 0.2], [x, y + (kind === 'sleep' ? 2.6 : 2.1)], [x + w, y + 0.1], 1.3, LASH);
    stroke3(ctx, a, [x + w * o, y + 0.1], [x + (w + 0.9) * o, y - 0.1], [x + (w + 1.2) * o, y - 0.8], 0.75, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.06 : 1;
  eyePath(ctx, x, y, w * big, h * big, o);
  ctx.fillStyle = tone(a, '#fffcff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      const px = x + Math.cos(an) * u * w * 0.7;
      const py = y + Math.sin(an) * u * h * 0.6;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    pen(ctx, tone(a, IRIS[1]), 0.8);
    ctx.stroke();
  } else {
    const [gx, gy] = f.g ?? [0.6, 0.3];
    ctx.save();
    eyePath(ctx, x, y, w * big, h * big, o);
    ctx.clip();
    const ir = kind === 'wide' ? 0.62 : 0.72;
    const ix = x + gx * 0.5;
    const iy = y + gy * 0.45;
    const iw = w * ir;
    const ih = h * ir * 1.04;
    ell(ctx, ix, iy, iw, ih);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    ell(ctx, ix, iy + ih * 0.12, iw * 0.88, ih * 0.84);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + ih * 0.46, iw * 0.7, ih * 0.44);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy + ih * 0.7, iw * 0.44, ih * 0.16);
    ctx.fillStyle = tone(a, IRIS[3], 0.9);
    ctx.fill();
    ell(ctx, ix, iy - ih * 0.04, iw * 0.42, ih * 0.44);
    ctx.fillStyle = tone(a, '#1e0e2a');
    ctx.fill();
    // her jewel glint: a soft rounded diamond, and a small round one
    smooth(ctx, [[ix - iw * 0.3, iy - ih * 0.72], [ix - iw * 0.3 + 1.1, iy - ih * 0.36], [ix - iw * 0.3, iy], [ix - iw * 0.3 - 1.1, iy - ih * 0.36]]);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ell(ctx, ix + iw * 0.42, iy + ih * 0.42, 0.5, 0.5);
    ctx.fill();
    ctx.restore();
  }
  lash(ctx, a, x, y, w * big, h * big, o);
}
// Short round brows (her acting): even thickness, round at both ends, gently curved.
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.1, y + bi * 0.6);
  ctx.quadraticCurveTo(x, y - 0.9 + (bo + bi) * 0.3, x + o * 2.1, y + bo * 0.6);
  pen(ctx, tone(a, HAIR[2]), 1.25);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y - 0.4], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, LIP[1]);
    ctx.fill();
    smooth(ctx, [[x - w * 0.75, y + 0.4], [x + w * 0.75, y + 0.4], [x + w * 0.55, y + h * 0.95], [x, y + h * 1.05], [x - w * 0.55, y + h * 0.95]]);
    ctx.fillStyle = tone(a, '#6a1a3a');
    ctx.fill();
    ell(ctx, x, y + h * 0.82, w * 0.5, h * 0.26);
    ctx.fillStyle = tone(a, '#ff9ab0');
    ctx.fill();
  };
  const line = (pts, w = 0.7, col = LIP[2]) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, col), w);
    ctx.stroke();
  };
  const lips = (w = 1.7, lift = 0.4) => {
    // rouged lips at rest: a soft full lower lip under the line, its near corner lifted
    ell(ctx, x, y + 0.7, w * 0.62, 0.62);
    ctx.fillStyle = tone(a, LIP[0]);
    ctx.fill();
    line([[x - w, y + 0.1], [x, y + 0.45], [x + w, y - lift]], 0.62);
  };
  switch (m) {
    case 'smirk':
      lips(1.7, 0.9);
      break;
    case 'smile':
      ell(ctx, x, y + 0.8, 1.1, 0.6);
      ctx.fillStyle = tone(a, LIP[0]);
      ctx.fill();
      line([[x - 2, y - 0.3], [x, y + 0.9], [x + 2, y - 0.5]], 0.66);
      break;
    case 'sing':
      open(1.5, 2);
      break;
    case 'belt':
      open(2, 3);
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 1, 1.25);
      ctx.fillStyle = tone(a, LIP[1]);
      ctx.fill();
      ell(ctx, x, y + 0.9, 0.55, 0.75);
      ctx.fillStyle = tone(a, '#6a1a3a');
      ctx.fill();
      break;
    case 'kiss':
      smooth(ctx, [[x - 0.9, y + 0.2], [x, y - 0.4], [x + 0.9, y + 0.2], [x + 0.6, y + 1.4], [x, y + 1.8], [x - 0.6, y + 1.4]]);
      ctx.fillStyle = tone(a, LIP[1]);
      ctx.fill();
      break;
    case 'pout':
      ell(ctx, x - 0.2, y + 0.9, 1.1, 0.75);
      ctx.fillStyle = tone(a, LIP[0]);
      ctx.fill();
      line([[x - 1.5, y + 0.6], [x, y + 0.1], [x + 1.4, y + 0.5]], 0.62);
      break;
    case 'wobble':
      line([[x - 1.8, y + 0.4], [x - 0.9, y - 0.2], [x, y + 0.3], [x + 0.9, y - 0.2], [x + 1.8, y + 0.4]], 0.6);
      break;
    case 'talkA':
      open(1.4, 1.8);
      break;
    case 'talkE':
      open(1.8, 1.1);
      break;
    default:
      lips(1.6, 0.35);
  }
}
const SKULL = [[-16.6, -2], [-15.4, -11], [-9.6, -17], [0, -19], [9, -17.4], [15, -11.4], [17.2, -3], [16.6, 5.2], [13.4, 11.4], [7.6, 16], [2, 17.4], [-4, 16.2], [-10.6, 11.6], [-15.2, 5]];

// ---------- Her hair (head units): one shared light, top to bottom, and one shine band ----------
const hairFill = (ctx, a, top = -30, bot = 30) => {
  const g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, tone(a, HAIR[0]));
  g.addColorStop(0.32, tone(a, HAIR[1]));
  g.addColorStop(1, tone(a, HAIR[2]));
  return g;
};
function paintHair(ctx, a, mode, top, bot) {
  if (mode === 'line') {
    pen(ctx, HAIR_INK, LW / HS);
    ctx.stroke();
  } else {
    ctx.fillStyle = hairFill(ctx, a, top, bot);
    ctx.fill();
  }
}
// The long back hair behind her shoulders (under everything).
function backHair(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  const sw = a.gl?.hairSway ?? 0;
  smooth(ctx, [[-17.4, -12], [-12, -20], [0, -22], [12, -19.6], [17.4, -10], [18.2, 6], [17 + sw, 22], [11 + sw, 30], [0 + sw, 32], [-11 + sw, 30], [-18 + sw, 22], [-19, 6]]);
  paintHair(ctx, a, mode, -24, 34);
  if (mode === 'fill') glow(ctx, 0, 18, 14, HAIR[3], 0.4);
  ctx.restore();
}
// The piled curls on top, wound into swirls and pinned with a pearl (so they never read as ears).
const LOBES = [[-9, -21.6, 7], [1.4, -25, 8], [11, -21, 6.4]];
function updo(ctx, a, mode) {
  ctx.beginPath();
  for (const [x, y, r] of LOBES) {
    ctx.moveTo(x + r, y);
    ctx.ellipse(x, y, r, r * 0.86, 0, 0, TAU);
  }
  paintHair(ctx, a, mode, -34, -12);
  if (mode !== 'fill') return;
  for (const [x, y, r] of LOBES) {
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const an = -1.2 + u * TAU * 0.95;
      const rr = r * (0.78 - u * 0.5);
      if (i) ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.86);
      else ctx.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.86);
    }
    pen(ctx, tone(a, HAIR[3], 0.55), 0.6);
    ctx.stroke();
  }
  ell(ctx, 6.4, -27.2, 1.3, 1.3);
  ctx.fillStyle = tone(a, '#fff8fc');
  ctx.fill();
  ell(ctx, 6, -27.6, 0.45, 0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
// The cap of hair over her crown (behind the fringe), the side ringlets, and the fringe itself: an even
// blunt round cut in five sections, longest in the middle, stopping above her lashes.
const CUTS = [[-15.8, -9.6, -7.6], [-9.6, -3.8, -8.2], [-3.8, 3.4, -8.6], [3.4, 9.4, -8.3], [9.4, 15.6, -7.8]];
function cap(ctx, a, mode) {
  smooth(ctx, [[-17.4, -6], [-16.6, -13.4], [-10.6, -19.2], [0, -21.2], [10, -19.4], [16.2, -13.2], [17.4, -6], [12, -9.6], [0, -11], [-12, -9.8]]);
  paintHair(ctx, a, mode, -24, -6);
}
function ringlet(ctx, a, mode, x0, side) {
  const sw = (a.gl?.lockSway ?? 0) * side;
  const pts = [[x0 - 2.4 * side, -11], [x0 + 2.4 * side, -11.6], [x0 + 3 * side + sw * 0.3, -2], [x0 + 2.4 * side + sw * 0.6, 7], [x0 + 3.4 * side + sw, 13.6], [x0 + 0.6 * side + sw, 17.4], [x0 - 2.2 * side + sw, 14.6], [x0 - 0.6 * side + sw * 0.8, 11.4], [x0 - 2 * side + sw * 0.5, 4], [x0 - 2.6 * side + sw * 0.2, -4]];
  smooth(ctx, pts);
  paintHair(ctx, a, mode, -12, 18);
  if (mode !== 'fill') return;
  ctx.beginPath();
  ctx.arc(x0 + 0.4 * side + sw, 13.6, 2, -0.4, 3.4);
  pen(ctx, tone(a, HAIR[3], 0.5), 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x0 + 0.6 * side, -8);
  ctx.quadraticCurveTo(x0 + 1 * side + sw * 0.4, 2, x0 + 0.8 * side + sw * 0.7, 9);
  pen(ctx, tone(a, HAIR[0], 0.5), 0.6);
  ctx.stroke();
}
function fringe(ctx, a, mode) {
  for (const [x0, x1, yb] of CUTS) {
    const cx = (x0 + x1) / 2;
    const ow = (x1 - x0) * 0.58;
    smooth(ctx, [[cx - ow, -19], [cx + ow, -19], [cx + ow * 1.02, yb - 2.2], [cx + ow * 0.8, yb], [cx - ow * 0.8, yb], [cx - ow * 1.02, yb - 2.2]]);
    paintHair(ctx, a, mode, -22, -6);
  }
  if (mode !== 'fill') return;
  // a thin shadow at each split, fading up toward the crown
  for (let i = 1; i < CUTS.length; i++) {
    const x = CUTS[i][0];
    const yb = Math.max(CUTS[i][2], CUTS[i - 1][2]);
    ctx.beginPath();
    ctx.moveTo(x, yb - 0.6);
    ctx.quadraticCurveTo(x - 0.3, yb - 4, x - 0.6, yb - 7.4);
    const g = ctx.createLinearGradient(0, yb, 0, yb - 8);
    g.addColorStop(0, tone(a, HAIR[3], 0.8));
    g.addColorStop(1, tone(a, HAIR[3], 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = 0.6;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  // the one shine band across the bangs: a soft arc of light, fading at its ends
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0.2, -11.6, 13, 2.6, 0, Math.PI * 1.08, Math.PI * 1.92);
  const sg = ctx.createLinearGradient(-13, 0, 13, 0);
  sg.addColorStop(0, 'rgba(255,240,255,0)');
  sg.addColorStop(0.35, 'rgba(255,240,255,0.75)');
  sg.addColorStop(0.65, 'rgba(255,240,255,0.75)');
  sg.addColorStop(1, 'rgba(255,240,255,0)');
  ctx.strokeStyle = sg;
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}
// The tiara: a gold band with three points and a jewel, set crooked (`tilt`).
function tiara(ctx, a, mode, tilt) {
  ctx.save();
  ctx.translate(1.2, -18.6);
  ctx.rotate(-0.08 + tilt);
  smooth(ctx, [[-9, 1.2], [-8, -2.2], [-4.4, -1.6], [-2.4, -4.4], [0, -6.4], [2.4, -4.4], [4.4, -1.6], [8, -2.2], [9, 1.2], [0, 2.2]]);
  paint(ctx, a, mode, GOLD[1], GOLD[2], LW / HS);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(-8.6, 0.6);
    ctx.quadraticCurveTo(0, 1.8, 8.6, 0.6);
    pen(ctx, tone(a, GOLD[0], 0.8), 0.5);
    ctx.stroke();
    ell(ctx, 0, -2.2, 1.5, 1.7);
    ctx.fillStyle = tone(a, GEM[1]);
    ctx.fill();
    ell(ctx, -0.4, -2.8, 0.55, 0.5);
    ctx.fillStyle = tone(a, GEM[0]);
    ctx.fill();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  updo(ctx, a, mode);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, GHOST[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, 4, 2, 15, GHOST[0], 0.8);
    glow(ctx, -14, 6, 8, GHOST[2], 0.6);
    glow(ctx, 4, 18, 9, GHOST[2], 0.5);
    // the fringe's soft cast shadow on her forehead (her skin's own shade, never grey)
    ctx.beginPath();
    for (const [x0, x1, yb] of CUTS) {
      ctx.moveTo(x0, -16);
      ctx.lineTo(x1, -16);
      ctx.lineTo(x1, yb + 1.1);
      ctx.quadraticCurveTo((x0 + x1) / 2, yb + 1.8, x0, yb + 1.1);
      ctx.closePath();
    }
    ctx.fillStyle = tone(a, GHOST[2], 0.8);
    ctx.fill();
    ctx.restore();
    for (const [cx, cy, k] of [[-8.6, 5.8, 0.7], [10, 5.8, 1]]) {
      ell(ctx, cx, cy, 3.2, 1.7);
      ctx.fillStyle = tone(a, '#ffb0cc', 0.5 * k);
      ctx.fill();
      ell(ctx, cx, cy, 1.6, 0.8);
      ctx.fillStyle = tone(a, '#ff90b4', 0.45 * k);
      ctx.fill();
    }
    eye(ctx, a, -5.4, 0.6, -1, f);
    eye(ctx, a, 6.8, 0.4, 1, f);
    brow(ctx, a, -5.6, -6.9, -1, f.b);
    brow(ctx, a, 7, -7.1, 1, f.b);
    glow(ctx, 3.6, 6, 1.6, GHOST[3], 0.6);
    ell(ctx, 3.2, 5.4, 0.5, 0.35);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ell(ctx, 11.4, 6.6, 0.42, 0.42);
    ctx.fillStyle = tone(a, '#6a3a6a');
    ctx.fill();
    mouth(ctx, a, 2.6, 10.6, f.m);
  }
  cap(ctx, a, mode);
  ringlet(ctx, a, mode, -16.6, -1);
  ringlet(ctx, a, mode, 15.6, 1);
  fringe(ctx, a, mode);
  tiara(ctx, a, mode, q.tiaraTilt ?? 0);
  ctx.restore();
}

// ---------- Her gown ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
// The bodice details over her body: the brocade stomacher to a pointed waist, the brooch, a soft light.
function bodice(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const J = D.J;
  const st = J.stern;
  const w = J.waist;
  const C = (p) => ptOf(a, D, 'chest', p);
  const W = (p) => ptOf(a, D, 'waistB', p);
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  const c0 = C([st[0] + 3, st[1] + 7]);
  glow(ctx, c0[0], c0[1], 6, VEL[0], 0.5);
  const pan = [C([st[0] - 3.4, st[1] + 3]), C([st[0] + 8.2, st[1] + 3]), W([w[0] + 5.8, w[1] + 3]), W([w[0] + 2.6, w[1] + 6.6]), W([w[0] - 0.6, w[1] + 3])];
  smooth(ctx, pan);
  ctx.fillStyle = tone(a, PANEL[1]);
  ctx.fill();
  pen(ctx, tone(a, GOLD[1]), 0.6);
  ctx.stroke();
  pen(ctx, tone(a, GOLD[0], 0.8), 0.35);
  for (let i = 0; i < 4; i++) {
    const p0 = C([st[0] - 1 + i * 0.6, st[1] + 6 + i * 3.4]);
    const p1 = C([st[0] + 6 - i * 0.6, st[1] + 6 + i * 3.4]);
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.lineTo(...p1);
    ctx.stroke();
  }
  const br = C([st[0] + 2.4, st[1] + 4.2]);
  ell(ctx, br[0], br[1], 1.3, 1.3);
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ell(ctx, br[0], br[1], 0.8, 0.8);
  ctx.fillStyle = tone(a, GEM[1]);
  ctx.fill();
  ctx.restore();
}
// The high lace collar and the pink feather boa round her shoulders.
function collarBoa(ctx, a, mode, D) {
  const st = D.J.stern;
  const C = (p) => ptOf(a, D, 'chest', p);
  const col = [[-7, -1], [-6, -5], [0, -6.4], [6.6, -5], [8, -1], [0.6, 1]].map(([x, y]) => C([st[0] + x, st[1] + y]));
  smooth(ctx, col);
  paint(ctx, a, mode, LACE[1]);
  const boa = [[-13, 0.6], [-12, -3.4], [-4, -1.6], [4, -1.2], [12.6, -3], [14.4, 1], [9, 4.4], [0, 3.6], [-8, 4.6]].map(([x, y]) => C([st[0] + x, st[1] + y]));
  smooth(ctx, boa);
  paint(ctx, a, mode, BOA[1]);
  if (mode !== 'fill') return;
  ctx.save();
  smooth(ctx, boa);
  ctx.clip();
  for (let i = 0; i < 7; i++) {
    const p = C([st[0] - 11 + i * 4, st[1] + 0.6 + Math.sin(i * 1.7) * 0.8]);
    glow(ctx, p[0], p[1] - 0.6, 2.2, BOA[0], 0.85);
  }
  ctx.restore();
}
// The puffed, slashed sleeve at the shoulder: a velvet puff, pink lining in the slashes, a gold band.
function puff(ctx, a, mode, D, k) {
  const S0 = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const ang = Math.atan2(E[1] - S0[1], E[0] - S0[0]);
  ctx.save();
  ctx.translate(S0[0], S0[1]);
  ctx.rotate(ang);
  smooth(ctx, [[-1.6, -3.4], [3, -4.2], [6, -3], [6.4, 0], [6, 3], [3, 4.2], [-1.6, 3.4], [-2.6, 0]]);
  paint(ctx, a, mode, k === 'F' ? VEL[2] : VEL[1]);
  if (mode === 'fill') {
    for (const yy of [-2.2, 0, 2.2]) {
      ell(ctx, 3, yy, 1.8, 0.45);
      ctx.fillStyle = tone(a, LINING[k === 'F' ? 1 : 0]);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(5.8, -3.2);
    ctx.lineTo(5.8, 3.2);
    pen(ctx, tone(a, GOLD[1]), 0.8);
    ctx.stroke();
  }
  ctx.restore();
}
// A frill of lace at the wrist.
function lace(ctx, a, mode, D, k) {
  const Wr = ptOf(a, D, `hand${k}`, D.J[`wr${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const ang = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]);
  ctx.save();
  ctx.translate(...Wr);
  ctx.rotate(ang);
  smooth(ctx, [[-1.6, -2.6], [0.8, -3.2], [1.6, -1.6], [1.4, 0], [1.6, 1.6], [0.8, 3.2], [-1.6, 2.6]]);
  paint(ctx, a, mode, k === 'F' ? LACE[2] : LACE[0]);
  ctx.restore();
}
function hem(ctx, a, [p0, p1, p2], k) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...p1, ...p2);
  pen(ctx, tone(a, k < 1 ? GOLD[2] : GOLD[1]), 1.1);
  ctx.stroke();
}
// Her skirt: two velvet panels from her waist (on springs), gold at the hem, a pinned tuck.
function skirtPanel(ctx, a, mode, D, which) {
  const P = (p) => ptOf(a, D, which, p);
  const fl = a.gl?.skirtFlare ?? 0;
  if (which === 'skB') {
    const pts = [[64, 92], [79, 88], [92, 92], [97 + fl * 3, 112], [94 + fl * 3, 120], [78, 122], [60 - fl * 4, 120], [58 - fl * 4, 112]].map(P);
    smooth(ctx, pts);
    paint(ctx, a, mode, VEL[2]);
    if (mode === 'fill') {
      const lt = P([70, 104]);
      glow(ctx, lt[0], lt[1], 7, VEL[1], 0.6);
      hem(ctx, a, [P([59 - fl * 4, 117]), P([78, 121]), P([95 + fl * 3, 117])], 0.9);
    }
    return;
  }
  const pts = [[72, 92], [84, 88.6], [94, 92], [99 + fl * 3, 110], [96 + fl * 3, 119], [84, 121], [70 - fl * 2, 119], [68 - fl * 2, 110]].map(P);
  smooth(ctx, pts);
  paint(ctx, a, mode, VEL[1]);
  if (mode !== 'fill') return;
  ctx.save();
  smooth(ctx, pts);
  ctx.clip();
  for (const x of [76, 84, 92]) {
    const p0 = P([x, 94]);
    const p1 = P([x + (x - 84) * 0.3, 119]);
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.lineTo(...p1);
    pen(ctx, tone(a, VEL[2], 0.6), 0.6);
    ctx.stroke();
  }
  const lt = P([90, 104]);
  glow(ctx, lt[0], lt[1], 6, VEL[0], 0.55);
  // the tuck where it's pinned to fit, a gold safety pin
  const pn = P([94, 98]);
  ctx.beginPath();
  ctx.moveTo(pn[0] - 1.4, pn[1] - 0.6);
  ctx.lineTo(pn[0] + 1.4, pn[1] + 0.6);
  pen(ctx, tone(a, GOLD[1]), 0.5);
  ctx.stroke();
  ctx.restore();
  hem(ctx, a, [P([69 - fl * 2, 117]), P([84, 120]), P([97 + fl * 3, 117])], 1);
}
// The ghost wisp below her skirt: a soft tapering curl, glowing toward its middle.
function wisp(ctx, a, mode, D) {
  const L = (p) => D.at(a, 'lower', [(p[0] - D.J.lower[0]) * D.SC, (p[1] - D.J.lower[1]) * D.SC]);
  const pts = [[70, 112], [88, 112], [87, 122], [80, 128], [70, 131], [61, 130.4], [58, 126], [62, 124.6], [68, 124], [72, 119]].map(L);
  smooth(ctx, pts);
  paint(ctx, a, mode, WISP[1]);
  if (mode === 'fill') {
    const c = L([75, 120]);
    glow(ctx, c[0], c[1], 6, WISP[0], 0.9);
  }
}
// The mask on its stick (rig space): the stick upright in her near hand, the mask at its top beside her
// face, its feathers swaying.
function maskAt(a, D) {
  const p = ptOf(a, D, 'handN', D.J.handN);
  return { x: p[0], y: p[1], ang: -Math.PI / 2 + (a.gl?.maskTilt ?? 0) };
}
function mask(ctx, a, mode, D) {
  const M = maskAt(a, D);
  ctx.save();
  ctx.translate(M.x, M.y);
  ctx.rotate(M.ang);
  ctx.scale(0.78, 0.78);
  smooth(ctx, [[-4, -0.5], [13, -0.5], [13, 0.5], [-4, 0.5]]);
  paint(ctx, a, mode, GOLD[1], GOLD[2]);
  if (mode === 'fill') {
    pen(ctx, tone(a, LINING[1]), 0.55);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 2.4 - 1, -0.55);
      ctx.lineTo(i * 2.4 + 0.4, 0.55);
      ctx.stroke();
    }
  }
  // the mask: a gold half-mask facing out, its eye holes soft cream (never dark)
  ctx.save();
  ctx.translate(15.6, 0);
  ctx.rotate(Math.PI / 2);
  smooth(ctx, [[-6.4, 0.4], [-5.8, -2.2], [-2.6, -2.8], [0, -1.6], [2.6, -2.8], [5.8, -2.2], [6.4, 0.4], [4.4, 2.6], [1.4, 2], [0, 1.2], [-1.4, 2], [-4.4, 2.6]]);
  paint(ctx, a, mode, GOLD[1], GOLD[2]);
  if (mode === 'fill') {
    for (const x of [-3, 3]) {
      ell(ctx, x, -0.1, 1.5, 0.95, x < 0 ? 0.2 : -0.2);
      ctx.fillStyle = tone(a, '#fff4d6');
      ctx.fill();
    }
    ell(ctx, -4.4, -1.6, 1, 0.5, -0.3);
    ctx.fillStyle = tone(a, GOLD[0]);
    ctx.fill();
    ell(ctx, 0, -1.8, 0.8, 0.8);
    ctx.fillStyle = tone(a, GEM[1]);
    ctx.fill();
    const sway = a.gl?.plume ?? 0;
    for (const [i, col] of [[0, LINING[1]], [1, '#c8a8ff'], [2, '#9ae6e6']]) {
      ctx.save();
      ctx.translate(5.6, -1.6);
      ctx.rotate(-0.9 + i * 0.32 + sway * (0.8 + i * 0.2));
      smooth(ctx, [[0, -0.9], [5, -1.6], [8.6, -0.4], [8.8, 0.2], [5, 1.2], [0, 0.9]]);
      ctx.fillStyle = tone(a, col);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0.4, 0);
      ctx.quadraticCurveTo(4.6, -0.2, 8.2, -0.1);
      pen(ctx, tone(a, '#ffffff', 0.7), 0.3);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
  ctx.restore();
}

// ---------- Her act and fight ----------
const PIECES = { warmup: 5.8, toss: 5.2, fright: 5.6, curtsy: 8.4 };
const ORDER = ['warmup', 'toss', 'fright', 'curtsy'];
const POOL = ['divaAria', 'maskSwat', 'swoon'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, maskTilt: 0.05, plume: 0, tiaraTilt: 0, hairSway: 0, lockSway: 0, skirtB: 0, skirtF: 0, skirtFlare: 0, sing: 0, high: 0, fret: 0, bow: -1, kiss: -1, aria: -1, swat: -1, swoonS: -1, sweat: -1, zz: 0 };
  a.gl = q;
  const go = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (f, k) => {
    if (k > 0.45) q.face = f;
  };
  const alive = m.hp > 0;
  const walking = clamp(a.walkW ?? 0, 0, 1);
  const br = c.breath ?? 0;
  // Floating: poised, the mask held up beside her face in her near hand, her far hand on her hip; the
  // glide the same (never arms out like a sleepwalker), leaning a touch, the skirt trailing.
  go({ shN: -46 + br * 1.5, elN: -70, hwN: -10, shF: 34 + br, elF: -100, hwF: 20, tilt: 1 + walking * 6, head: -3, chest: -br * 0.6 - 1, wisp: Math.sin(t * 2.2) * 5 + walking * 16 }, 1);
  q.plume = Math.sin(t * 1.6) * 0.08 + walking * 0.12;
  q.hairSway = -walking * 2 + Math.sin(t * 1.1) * 0.4;
  q.lockSway = Math.sin(t * 1.3) * 0.5 - walking * 1.2;
  q.skirtB = -0.08 * walking;
  q.skirtFlare = walking * 0.6;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.dvWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.1;
  if ((wind > 0 || striking) && alive) {
    if (!st.dvAtk) {
      const pool = m.def.moves ?? POOL;
      st.dvN = (st.dvN ?? m.uid ?? 0) + 1;
      st.dvMove = m.move ?? pool[st.dvN % pool.length];
    }
    st.dvAtk = true;
  } else st.dvAtk = false;
  const mvName = st.dvAtk ? st.dvMove : null;
  const hadWind = now - (st.dvWindAt ?? -9) < Math.max(0, since) + 0.15;
  let W = wind;
  let s = striking ? since : -1;
  if (mvName && striking) {
    if (!hadWind) {
      W = since < 0.22 ? sstep(since / 0.22) : 1;
      s = since - 0.22;
    } else W = 1;
  }
  const busy = Boolean(mvName) || !alive;
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.6;
  const fighting = (m.aggroUntil ?? 0) > now;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const cine = m.cine?.mood;
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;

  // ----- The act -----
  const calmGoal = !busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.dvCalm = mix(st.dvCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.dvCalm);
  let PC = st.dvPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.dvOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.dvOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.dvOrd = (st.dvOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.dvPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;

  if (k > 0.001 && piece === 'warmup') {
    // a hand on her heart, singing scales, swaying; rising up on the high note
    const warm = win(pu, 0.2, 0.8, 4.8, 5.6);
    const high = win(pu, 2.8, 3.1, 3.9, 4.3);
    const swy = Math.sin(pu * 2.6);
    go({ shF: -30, elF: -110, hwF: 10, head: -4 + swy * 3, tilt: -2 + swy * 1.2, chest: -2, waist: swy * 3, wisp: swy * 10 }, warm * k);
    go({ head: -14, tilt: -5, chest: -6, shN: -62, elN: -60, lift: 0.04, wisp: -10 }, high * k);
    q.sing = warm * k;
    q.high = high * k;
    say(high > 0.4 ? 'belt' : 'sing', warm * k);
  }
  if (k > 0.001 && piece === 'toss') {
    // a hair toss, her far hand flicking back past her ringlet; the tiara slips crooked
    const toss = win(pu, 0.2, 0.6, 1.3, 1.8);
    const flick = win(pu, 0.6, 0.85, 1.1, 1.5);
    go({ shF: -20, elF: -130, hwF: 30, head: -8, neckR: -4, tilt: -3 }, toss * k);
    go({ shF: 30, elF: -90, head: -16, neckR: -8, tilt: -5, lift: 0.015 }, flick * k);
    q.lockSway -= 2.4 * flick * k;
    q.hairSway -= 2 * flick * k;
    say('smug', toss * k);
    q.tiaraTilt -= 0.22 * sstep((pu - 1.0) / 0.25) * (1 - sstep((pu - 4.3) / 0.4)) * k;
    // a pout; then composed again
    const pout = win(pu, 1.8, 2.2, 3.8, 4.3);
    go({ head: 7, neckR: 5, chest: 3, tilt: 3 }, pout * k);
    say('pout', pout * k);
    const fix = win(pu, 4.0, 4.3, 4.6, 5.0);
    go({ head: -6, chest: -2 }, fix * k);
    say('smug', fix * k);
  }
  if (k > 0.001 && piece === 'fright') {
    // she spots the audience: a jump
    const jump = win(pu, 0.2, 0.32, 0.5, 0.9);
    go({ lift: 0.07, head: -10, tilt: -5, shF: 20, elF: -40, wisp: -16 }, jump * k);
    say('gasp', win(pu, 0.2, 0.3, 0.9, 1.1) * k);
    // a fluster: fanning herself with the mask, a bead of sweat
    const fan = win(pu, 0.8, 1.1, 3.3, 3.7);
    const fs = Math.sin(pu * 16);
    go({ shN: -70, elN: -96 + fs * 16, head: 4 + Math.sin(pu * 31) * 1.2, neckR: -4 }, fan * k);
    q.maskTilt += fs * 0.3 * fan * k;
    q.fret = fan * k;
    say('fluster', fan * k);
    // a deep breath to compose herself
    const breath = win(pu, 3.6, 4.1, 4.9, 5.4);
    go({ chest: -6, head: -6, lift: 0.025, shF: -30, elF: -110 }, breath * k);
    say('breathe', breath * k);
  }
  if (k > 0.001 && piece === 'curtsy') {
    // her skirt held out with her far hand, a deep curtsy, roses landing
    const bow = win(pu, 0.2, 1.0, 2.8, 3.6);
    const dip = win(pu, 0.8, 1.4, 2.4, 3.0);
    go({ shF: 50, elF: -20, hwF: 30, head: 4, chest: 2, wisp: 8 }, bow * k);
    q.skirtFlare = Math.max(q.skirtFlare, bow * k);
    go({ head: 18, chest: 10, waist: 6, lift: -0.04, tilt: 4 }, dip * k);
    say('happy', bow * k);
    if (pu > 0.6 && pu < 4.2) q.bow = (pu - 0.6) / 3.4;
    // then a pose with the mask beside her face, a wink, a blown kiss
    const pose0 = win(pu, 4.0, 4.6, 7.6, 8.4);
    const blow = win(pu, 5.8, 6.1, 6.8, 7.2) * pose0;
    go({ shN: -66, elN: -56, head: -5, tilt: -2, waist: 3 }, pose0 * k);
    go({ head: -9, tilt: 3, chest: 3, lift: 0.015 }, blow * k);
    say(blow > 0.3 ? 'kiss' : 'wink', pose0 * k);
    if (pu > 6.2 && pu < 8.2) q.kiss = (pu - 6.2) / 2;
  }

  if (fighting && alive && !st.dvHunt) st.dvBangAt = now;
  if (!fighting && st.dvHunt && alive) st.dvLostAt = now;
  st.dvHunt = fighting && alive;
  q.bang = now - (st.dvBangAt ?? -9);
  q.huh = now - (st.dvLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: the mask raised beside her face, a cool look -----
  // (the stance eases off as a move or a flinch takes over, never dropping out in one frame: the 2026-11-27
  // jitter probe found the arm and its prop leaping at the start of every wind-up)
  st.huntK = mix(st.huntK ?? 0, fighting && alive && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    go({ shN: -78, elN: -64, tilt: 4, head: -2 }, huntW * (1 - walking * 0.5));
    if (huntW > 0.5 && !mvName) q.face = 'cool';
  }
  // ----- Low on health: a dramatic fret, the back of her hand to her brow -----
  if (low && !busy) {
    go({ shF: -40, elF: -150, hwF: 30, head: -6, tilt: -2 }, 1 - walking * 0.5);
    q.face = q.face === 'cool' || !q.face ? 'worried' : q.face;
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Her moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'divaAria') {
      // a deep breath, a hand on her heart, chin up
      go({ tilt: -8, x: -0.02, chest: -4, head: -8, shF: -30, elF: -110, hwF: 10, shN: 14, elN: -40, wisp: 12 }, wu);
      say('breathe', W);
      // then her arms flung open and a high note belted at you
      if (s >= 0) {
        go({ tilt: 8, x: 0.04, chest: 4, head: -12, shN: -116, elN: -16, shF: 46, elF: -26, wisp: -12 }, sw);
        q.aria = s;
        say('belt', win(s, 0, 0.03, 0.55, 0.65));
        q.skirtFlare = Math.max(q.skirtFlare, sw * 0.6);
      }
    } else if (mvName === 'maskSwat') {
      // the mask wound back over her shoulder
      go({ tilt: -8, x: -0.03, waist: -5, head: -6, shN: 40, elN: -120, shF: 24, elF: -60, wisp: 14 }, wu);
      q.maskTilt -= 1.1 * wu;
      say('focus', W);
      // then swatted down at you, its feathers puffing
      if (s >= 0) {
        go({ tilt: 14, x: 0.07, waist: 6, head: 6, shN: -60, elN: -10, shF: 30, elF: -50, wisp: -12 }, sw);
        q.maskTilt += 1.6 * snap * sw;
        q.plume += 0.6 * sw;
        q.swat = s;
        say('shout', win(s, 0, 0.03, 0.35, 0.45));
      }
    } else {
      // the back of her hand to her brow, swaying back: "oh!"
      go({ tilt: -14, x: -0.03, chest: -6, head: -14, shF: -60, elF: -150, hwF: 40, shN: -40, elN: -60, wisp: 16 }, wu);
      add({ tilt: Math.sin(W * 9) * 2 * wu }, 1);
      say('swoon', W);
      // then a theatrical faint forward onto you, and up again with a flourish
      if (s >= 0) {
        const fall = sstep(s / 0.16) * (1 - sstep((s - 0.5) / 0.35));
        go({ tilt: 38 * fall, x: 0.08 * fall, chest: 10 * fall, head: 18 * fall, lift: -0.05 * fall, shF: -40, elF: -150, shN: 10, elN: -30, wisp: -20 * fall }, sw);
        const up = win(s, 0.48, 0.74, 0.85, 1.05); // (the flourish swept up over a quarter second, never flung)
        go({ shN: -110, elN: -30, head: -8, tilt: -4 }, up);
        q.swoonS = s;
        say(s < 0.55 ? 'swoon' : 'smug', sw);
      }
    }
  }
  // ----- Hurt: a gasp, the tiara knocked crooked -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: 12, neckR: 4, shF: -40, elF: -140, lift: -0.02, wisp: 14 }, kh);
    q.face = 'hurt';
    q.tiaraTilt += 0.3 * kh;
    q.lockSway += 1.6 * kh;
  }
  // ----- After landing a hit: a smug little curtsy -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.3 && alive && !hurt) {
    const kg = win(gl, 0, 0.25, 0.95, 1.3) * (1 - moveW);
    go({ shF: 46, elF: -20, hwF: 30, head: 10, chest: 5, lift: -0.02 }, kg);
    q.skirtFlare = Math.max(q.skirtFlare, kg * 0.7);
    say('smug', kg);
  }
  // ----- A nap (her habitat): dozing as she floats, the mask lowered -----
  st.dvNap = mix(st.dvNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.dvNap);
  if (nw > 0.001) {
    go({ head: 16 + Math.sin(now * 1.3) * 2.5, neckR: 6, chest: 4, shN: -10, elN: -40, lift: -0.02 + Math.sin(now * 1.3) * 0.006 }, nw);
    q.maskTilt += 0.35 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'cool';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.tiaraTilt += 0.4;
  }
  // ----- The face: an in-between (a blink) on every change; her own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.dvFace) {
    st.dvFaceFrom = st.dvFace;
    st.dvFace = f;
    st.dvFaceAt = now;
  }
  const since0 = now - (st.dvFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.07 && st.dvFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.dvFaceFrom) && !(talky(f) && talky(st.dvFaceFrom))) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.61) % 4.8;
  if (bl < 0.12 && !SHUTS.has(f) && f !== 'dizzy') f = 'shut';
  q.face = f;
  for (const key of ['maskTilt', 'plume', 'tiaraTilt', 'hairSway', 'lockSway', 'skirtB', 'skirtF', 'skirtFlare', 'sing', 'fret']) {
    // (its prop's angle rides a critically damped spring, sub-stepped: it sets off and lands smoothly, where an
    // eased chase leapt off at full speed the frame a new aim was set; the 2026-11-27 jitter probe)
    if (key === 'maskTilt') {
      let x = st.dv_maskTilt ?? q[key];
      let v = st.dv_maskTiltV ?? 0;
      const n = Math.max(1, Math.ceil(dt / 0.008));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        v += (400 * (q[key] - x) - 40 * v) * h;
        x += v * h;
      }
      st.dv_maskTiltV = v;
      st.dv_maskTilt = x;
      q[key] = x;
      continue;
    }
    const rate = key === 'maskTilt' ? 14 : key === 'plume' || key === 'lockSway' ? 7 : 9;
    st[`dv_${key}`] = mix(st[`dv_${key}`] ?? q[key], q[key], ease(rate));
    q[key] = st[`dv_${key}`];
  }
  q.calm = cw;
}

// ---------- Live effects (rig space, game px, her feet at 0, 0) ----------
function twinkle(ctx, x, y, r, al, col = '#ffffff') {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.16, y - r * 0.16, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.16, y + r * 0.16, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.16, y + r * 0.16, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.16, y - r * 0.16, x, y - r);
  ctx.fill();
  ctx.restore();
}
// A music note (a quaver, or two beamed), with a soft white rim.
function note(ctx, x, y, s, al, col, rot = 0, two = false) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha *= al;
  const draw = (cc, grow) => {
    ctx.fillStyle = cc;
    ctx.strokeStyle = cc;
    ctx.lineCap = 'round';
    ctx.lineWidth = s * 0.32 + grow * 2;
    const heads = two ? [[-s * 0.7, 0], [s * 0.7, -s * 0.3]] : [[0, 0]];
    for (const [hx, hy] of heads) {
      ctx.beginPath();
      ctx.ellipse(hx, hy, s * 0.62 + grow, s * 0.46 + grow, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx + s * 0.52, hy - s * 0.1);
      ctx.lineTo(hx + s * 0.52, hy - s * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    if (two) {
      ctx.moveTo(-s * 0.18, -s * 2);
      ctx.lineTo(s * 1.22, -s * 2.3);
    } else {
      ctx.moveTo(s * 0.52, -s * 2);
      ctx.quadraticCurveTo(s * 1.3, -s * 1.6, s * 1.1, -s * 0.9);
    }
    ctx.stroke();
  };
  draw('#ffffff', 0.5);
  draw(col, 0);
  ctx.restore();
}
function heart(ctx, x, y, r, al, col = '#ff8ab0') {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  for (const [cc, g] of [['#ffffff', 0.7], [col, 0]]) {
    const rr = r + g;
    ctx.fillStyle = cc;
    ctx.beginPath();
    ctx.moveTo(x, y + rr * 0.9);
    ctx.bezierCurveTo(x - rr * 1.4, y - rr * 0.1, x - rr * 0.7, y - rr * 1.2, x, y - rr * 0.4);
    ctx.bezierCurveTo(x + rr * 0.7, y - rr * 1.2, x + rr * 1.4, y - rr * 0.1, x, y + rr * 0.9);
    ctx.fill();
  }
  ctx.fillStyle = '#ffe0ec';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.45, y - r * 0.35, r * 0.25, r * 0.18, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function feather(ctx, x, y, s, al, rot, col = '#ffc4da') {
  if (al <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha *= al;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.7, -s * 0.2, 0.1 * s, s);
  ctx.quadraticCurveTo(-s * 0.6, -s * 0.1, 0, -s);
  ctx.fill();
  ctx.fillStyle = '#ffeef4';
  ctx.beginPath();
  ctx.ellipse(-s * 0.05, -s * 0.2, s * 0.18, s * 0.45, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
// Her own marks: a little gold dressing-room star with the mark on it.
function starCard(ctx, x, y, mark, e, dur, fl = false) {
  if (e < 0) return;
  const kk = Math.max(0, 1 - Math.exp(-9 * e) * Math.cos(18 * e)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (kk <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -kk : kk, kk);
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? 3.6 : 6.6;
    pts.push([Math.cos(an) * rr, Math.sin(an) * rr + 0.4]);
  }
  for (const pass of ['line', 'fill']) {
    smooth(ctx, pts);
    if (pass === 'line') {
      pen(ctx, GOLD[2], 1.3);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff6d0';
      ctx.fill();
    }
  }
  ctx.strokeStyle = mark === '!' ? '#e8507a' : '#8a5aa8';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -1.8);
    ctx.lineTo(0, 0.8);
  } else {
    ctx.moveTo(-1.2, -1.2);
    ctx.quadraticCurveTo(-1, -2.6, 0.3, -2.5);
    ctx.quadraticCurveTo(1.6, -2.3, 1.1, -1);
    ctx.quadraticCurveTo(0.3, -0.4, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.2, 0.7, 0.7);
  ctx.fill();
  ctx.restore();
}
function zee(ctx, x, y, s, al, fl = false) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(fl ? -s : s, s);
  ctx.beginPath();
  ctx.moveTo(-1.6, -1.6);
  ctx.quadraticCurveTo(0, -1.9, 1.6, -1.6);
  ctx.quadraticCurveTo(0, 0, -1.6, 1.6);
  ctx.quadraticCurveTo(0, 1.3, 1.7, 1.6);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#9a6ab8';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#fff6ff';
  ctx.stroke();
  ctx.restore();
}
const hash = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
  for (const mode of ['line', 'fill']) {
    backHair(ctx, a, mode, D);
    wisp(ctx, a, mode, D);
    skirtPanel(ctx, a, mode, D, 'skB');
  }
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.43;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -34]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const [mx, my] = headAt(a, D, [4, 11]);
  // the tiara's jewel twinkling now and then
  const gu = ((t + (m.uid % 7) * 0.6) % 3.4) / 0.5;
  if (gu < 1) {
    const [gx, gy] = headAt(a, D, [1.2, -21]);
    twinkle(ctx, gx + 0.4, gy - 0.6, 2.4 * Math.sin(Math.PI * gu), 0.95);
  }
  // a feather drifting down off her boa now and then (kept where it came off, falling)
  {
    const P = 4.4;
    const fu = ((t + (m.uid % 5) * 1.3) % P) / 2.6;
    const fn = Math.floor((t + (m.uid % 5) * 1.3) / P);
    if (fu < 1) {
      if (!a.mo.dvFeather || a.mo.dvFeather.n !== fn) {
        const b0 = ptOf(a, D, 'chest', [D.J.stern[0] + (hash(fn) - 0.5) * 18, D.J.stern[1] + 2]);
        a.mo.dvFeather = { n: fn, x: b0[0], y: b0[1] };
      }
      const F0 = a.mo.dvFeather;
      feather(ctx, F0.x - fu * 4 + Math.sin(fu * 7 + fn) * 2, F0.y + 2 + fu * 14, 1.6, Math.sin(Math.PI * fu) * 0.95, Math.sin(fu * 6 + fn) * 0.8, hash(fn + 3) > 0.5 ? BOA[1] : BOA[2]);
    }
  }
  // notes floating up from her lips as she warms up
  if ((q.sing ?? 0) > 0.05) {
    for (let i = 0; i < 3; i++) {
      const PP = 1.3;
      const u = ((t + (i * PP) / 3) % PP) / PP;
      const n = Math.floor((t + (i * PP) / 3) / PP);
      note(ctx, mx + 3 + u * 6 + Math.sin(u * 6 + n) * 1.6, my - 2 - u * 14, 1.4 + (q.high ?? 0) * 0.7, q.sing * Math.sin(Math.PI * u), NOTE_COLS[(n + i) % 4], Math.sin(u * 4 + n) * 0.3, hash(n * 3 + i) > 0.6);
    }
  }
  // stage fright: a bead of sweat
  if ((q.fret ?? 0) > 0.05) {
    const [sx, sy] = headAt(a, D, [-15, -8]);
    sweat(ctx, sx, sy + ((t * 0.9) % 1) * 3, 0.9, q.fret * Math.sin(Math.PI * ((t * 0.9) % 1)));
  }
  // the curtsy: roses tossed on stage, landing round her
  if ((q.bow ?? -1) >= 0 && q.bow < 1.15) {
    const [fx0] = ptOf(a, D, 'chest', D.J.stern);
    for (let i = 0; i < 5; i++) {
      const v = clamp((q.bow - i * 0.08) * 1.6, 0, 1);
      if (v <= 0) continue;
      const x = fx0 + (i - 2) * 7 + (hash(i + 2) - 0.5) * 4;
      const y = -48 + sstep(Math.min(1, v * 1.4)) * 46;
      const al = Math.min(1, v * 6) * clamp((1.15 - q.bow) * 4, 0, 1);
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2.4, y + 3.4);
      pen(ctx, '#5aa86a', 0.8);
      ctx.stroke();
      ctx.restore();
      heart(ctx, x, y, 1.6, al, i % 2 ? '#ff5a8a' : '#ff8ab0');
    }
  }
  // the blown kiss: a heart floating off her lips, out toward you
  if ((q.kiss ?? -1) >= 0) {
    const u = clamp(q.kiss, 0, 1);
    heart(ctx, mx + 3 + sstep(u) * 16, my - u * 6 + Math.sin(u * 8) * 1.2, 1.4 + sstep(Math.min(1, u * 3)) * 1.4, Math.min(1, (1 - u) * 2.4));
  }
  // Aria: a burst of notes and sparkles bowling out ahead of her
  if ((q.aria ?? -1) >= 0 && q.aria < 0.8) {
    const u = q.aria / 0.65;
    const kk = clamp(1 - (u - 0.85) / 0.3, 0, 1);
    glow(ctx, mx + 4 + u * 10, my, 6 + u * 9, '#ffd0e4', 0.45 * kk * (1 - u * 0.4));
    for (let i = 0; i < 9; i++) {
      const v = clamp(u * 1.3 - (i % 3) * 0.14, 0, 1);
      if (v <= 0) continue;
      const ang = -0.6 + (i / 8) * 1.1 + (hash(i + 4) - 0.5) * 0.2;
      const d = 4 + sstep(v) * (22 + hash(i) * 12);
      note(ctx, mx + Math.cos(ang) * d, my + Math.sin(ang) * d * 0.8 + Math.sin(v * 9 + i) * 1.4, 1.6 + hash(i + 1) * 0.7, kk * Math.min(1, v * 5) * (1 - v * 0.3), NOTE_COLS[i % 4], Math.sin(v * 6 + i) * 0.4, i % 3 === 1);
      twinkle(ctx, mx + Math.cos(ang + 0.15) * d * 0.8, my + Math.sin(ang + 0.15) * d * 0.7, 1.5 * (1 - v), kk * (1 - v));
    }
  }
  // Mask Swat: the feathers puffing out, sparkles
  if ((q.swat ?? -1) >= 0 && q.swat < 0.5) {
    const u = q.swat / 0.45;
    const M = maskAt(a, D);
    const cx = M.x + Math.cos(M.ang) * 12.2;
    const cy = M.y + Math.sin(M.ang) * 12.2;
    glow(ctx, cx, cy, 5 + u * 8, GOLD[0], 0.55 * (1 - u));
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI * 0.9 + (i / 5) * Math.PI * 1.3 + (hash(i + 7) - 0.5) * 0.4;
      const d = 2 + sstep(u) * (7 + hash(i) * 6);
      feather(ctx, cx + Math.cos(ang) * d, cy + Math.sin(ang) * d + u * u * 6, 2, 1 - u, ang + Math.PI / 2 + u * 2, [LINING[1], '#c8a8ff', '#9ae6e6'][i % 3]);
      twinkle(ctx, cx + Math.cos(ang + 0.3) * d * 1.2, cy + Math.sin(ang + 0.3) * d * 1.2, 1.8 * (1 - u), 1 - u, '#fff0b0');
    }
  }
  // Swoon: a little swirl of hearts where she lands on you, then a twinkle of a flourish
  if ((q.swoonS ?? -1) >= 0.12 && q.swoonS < 0.9) {
    const u = (q.swoonS - 0.12) / 0.78;
    const [hx, hy] = headAt(a, D, [14, -6]);
    for (let i = 0; i < 4; i++) {
      const an = u * 5 + (i * TAU) / 4;
      heart(ctx, hx + Math.cos(an) * (5 + u * 3), hy - 6 + Math.sin(an) * 2.4 - u * 4, 1.1, (1 - u) * 0.95, i % 2 ? '#ff8ab0' : '#c8a8ff');
    }
    twinkle(ctx, hx + 6, hy - 10, 2.4 * Math.sin(Math.PI * u), 1, '#fff0b0');
  }
  if ((q.sweat ?? -1) >= 0) {
    const [sx, sy] = headAt(a, D, [-15, -8]);
    sweat(ctx, sx, sy + (q.sweat % 1) * 3, 0.9, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [zx, zy] = headAt(a, D, [10, -32]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, zx + f * 6 + Math.sin(f * 5) * 1.4, zy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [4, -40]);
  if (q.bang >= 0 && q.bang < 1.1) starCard(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) starCard(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'masqueradediva',
  // (the skin is her velvet bodice and its long sleeves; her pale ghost hands and neck her own)
  skin: {
    lt: VEL[0], base: VEL[1], sh: VEL[2], deep: VEL[3], ink: INK, guides: false, out: LW,
    parts: {
      hand: { lt: GHOST[0], base: GHOST[1], sh: GHOST[2], deep: GHOST[3] },
      neck: { lt: GHOST[0], base: GHOST[1], sh: GHOST[2], deep: GHOST[3] },
    },
  },
  liveHead: true,
  noMoves: true,
  hide: ['lower'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    handNskin: (ctx, a, mode, S, D) => mask(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      bodice(ctx, a, mode, D);
      skirtPanel(ctx, a, mode, D, 'skF');
    },
    neckSkin: (ctx, a, mode, S, D) => collarBoa(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => {
      puff(ctx, a, mode, D, 'F');
      lace(ctx, a, mode, D, 'F');
    },
    armN: (ctx, a, mode, S, D) => {
      puff(ctx, a, mode, D, 'N');
      lace(ctx, a, mode, D, 'N');
    },
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('spirit', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.3);
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over her head left to
// her, drawn here in her own style)
export const DIVA_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const DIVA_SIZE = { w: 30, h: Math.round(R.H * BIG * 1.02) };
