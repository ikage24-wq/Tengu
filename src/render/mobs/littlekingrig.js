// Prismaris, the Little Crystal King (2026-11-22, replaces the Crystal Dragon Kid; the player's pick
// from the concept sheet): a little boy-king, scared of the dark, under a crystal crown far too big
// for him (it slips and wobbles), a geode cape (its sparkling lining is what you see of it from the
// front), a white royal tunic with a gold sash and an ermine collar, puffy shorts, crystal slippers,
// hugging the Queen's alarm clock to his chest, glowing like a little star, a sock pulled over one
// of its bells to keep it quiet. Built on the kid base (kidbase.js, kidrig.js) at a boss's size,
// every part re-drawn at that size; his own face: big round eyes like little night skies (deep violet
// with tiny stars in them, a crescent moon of light, a wobbly shine of tears along the bottom),
// worried brows, a pout for tantrums; a floppy fringe that falls in his eyes. (Remade the same day
// to the approved standard: real hair, every panel a soft shape, hand shading, even outlines, and
// the kid walk: knees, heels, the hips sinking into each step.)
//
// How he moves:
//   idle    a 16 s act: peeks nervously into the dark, left and right, shivering; the clock RINGS
//           and he panics, smothers it against his chest, "shh!", then sighs with relief; his crown
//           slides down over one eye and he shoves it back up; cuddles the clock, swaying, eyes shut.
//   walk    small careful steps (the kid walk, slow), the clock hugged tight and bobbing with each
//           step, glancing about, the crown wobbling, the cape dragging after.
//   slam    (the Crystal Throne) a tantrum: hunched and shaking, then a hop and a STOMP, the crown
//           jumping on his head and the cape flaring.
//   trial   (world/story.js QUEENS.nightking, m.castMove) Crystal Spikes: lets go with one hand and
//           jabs a finger at the floor; Nightlight Flare: holds the clock out at you as it flares;
//           Cape Sweep: crouches and swings his cape out low across the floor; Lights Out: curls up
//           small round the clock, shaking, eyes squeezed shut.
//   scenes  sad and sniffling when it's over; holds the clock out to give it back (m.cine.gave),
//           then a little star of his own (m.cine.star).

import { E, T, F } from './kit.js';
import { W, H, CX, G, SKIN, SKIN_SH, BLUSH, band, curve, groups, skull, HS, mapShape, twinkle, kidHead, blob } from './kidbase.js';
import { kidWalk, WALK_STIFF } from './kidwalk.js';
import { kidKit, SOFT, twoPass, hold, D2R } from './kidrig.js';
import { makeRig, smooth, clamp, TAU } from './rig.js';
import { puff, sparkle, dot } from './rigkit.js';

const KG = 'littleking2';
const SCALE = 2.6;
const HX = CX + 2;
const NECK = 86;
const HY = NECK - 31 * HS;
const C = {
  hair: '#cfe8ff', hairSh: '#9cc4ee', hairDk: '#6e94cc', hairLt: '#f4fbff',
  iris: '#9a7af0', irisDk: '#4e2ea8', irisLt: '#e2d6ff', lash: '#3a2a5c',
  gold: '#f4cf6a', goldSh: '#c99a3a', goldLt: '#fff2b8',
  cry: '#aedcff', crySh: '#7aa8e8', cryLt: '#eef8ff', pink: '#ff7eb0', blue: '#9ad4ff',
  tunic: '#eef0ff', tunicSh: '#c6cbee', ermine: '#ffffff', ermineSh: '#dfe3f4', spot: '#5a4c74',
  shorts: '#8a6ad2', shortsSh: '#6a4cb0', tights: '#f6f2ff',
  cape: '#5d3d9e', capeSh: '#43287a', capeLt: '#8a68c8', geo: '#6a4ab4', geoLt: '#d6c2ff', geoDk: '#4c3290',
  clock: '#ff9ec2', clockSh: '#e0709a', clockLt: '#ffd0e2', face: '#fffaf4', sock: '#8fd0ff', sockSh: '#5aa8e0',
  mouth: '#a8406a', line: '#7a3058', tongue: '#ff8eaa', tear: '#c4ecff', sweat: '#bfe6ff',
};

// ---------- The face ----------

const place = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY + y * HS], HS));

const EX = {
  idle: { e: 'open', lid: 0.06, m: 'wobble', b: 'worried' },
  scared: { e: 'open', lid: 0, pupil: 'small', m: 'wobble', b: 'worried', sweat: true },
  shush: { e: 'squeeze', m: 'shh', b: 'worried', puff: true },
  relief: { e: 'shut', m: 'phew', b: 'up' },
  cuddle: { e: 'arch', m: 'smile', b: 'up', blush: 1 },
  angry: { e: 'open', lid: 0.22, slant: 0.75, m: 'pout', b: 'cross', puff: true },
  shout: { e: 'open', lid: 0.04, slant: 0.6, m: 'mine', b: 'cross' },
  sad: { e: 'open', lid: 0.36, m: 'frown', b: 'worried', tear: true },
  happy: { e: 'arch', m: 'open', b: 'up', blush: 1 },
  surprised: { e: 'open', lid: 0, pupil: 'small', m: 'o', b: 'up' },
  hurt: { e: 'squeeze', m: 'wail', b: 'worried', tear: true },
  dizzy: { e: 'swirl', m: 'wobble', b: 'worried' },
  fear: { e: 'squeeze', m: 'wobble', b: 'worried', tear: true, sweat: true },
};
const GAZE = { c: [0, 0], f: [1.8, 0.2], b: [-1.8, 0.2], u: [0.4, -1.6], d: [0.4, 1.4] };

function kgEye(x, y, o, ex, blink, g) {
  const out = [];
  const w = 7.6;
  const h = 9.6;
  const L = C.lash;
  let kind = ex.e;
  let lid = ex.lid ?? 0;
  if (kind === 'open' && blink === 2) kind = 'shut';
  if (kind === 'open' && blink === 1) lid = Math.max(lid, 0.62);
  if (kind === 'arch') {
    out.push(...band(curve([[x - w, y + 2], [x - w * 0.42, y - h * 0.38], [x + w * 0.42, y - h * 0.38], [x + w, y + 2]], 3), 2.5, 2.5, L, true));
    return out;
  }
  if (kind === 'shut') {
    out.push(...band(curve([[x - w, y], [x - w * 0.3, y + h * 0.3], [x + w * 0.4, y + h * 0.28], [x + w, y - 0.2]], 3), 2.2, 2.6, L, true));
    out.push(...band([[x + w * o * 0.92, y], [x + w * o * 1.36, y + 1.8]], 1.8, 0.6, L, true));
    return out;
  }
  if (kind === 'squeeze') {
    out.push(...band([[x + w * o, y - h * 0.42], [x - w * 0.6 * o, y + 0.4], [x + w * o, y + h * 0.46]], 2.5, 2.2, L, true));
    return out;
  }
  if (kind === 'swirl') {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = i * 0.6 * o;
      const r = 0.5 + i * 0.35;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 1.1]);
    }
    out.push(...band(pts, 1.5, 1.6, L, true));
    return out;
  }
  const [gx, gy] = g;
  // His eyes are little night skies (he's scared of the dark, and carries a bit of it with him):
  // big and round, the iris deep violet at the top fading to lilac below, a few tiny stars in it,
  // a crescent moon of light, and a wobbly shine along the bottom where the tears gather.
  out.push(F(E(x, y + 0.4, w, h - 0.2, '#fbf8ff')));
  const ix = x + gx * 0.5;
  const iy = y + 1 + gy * 0.4;
  const iw = w - 1.2;
  const ih = h - 1.5;
  out.push(F(E(ix, iy, iw, ih, C.irisDk)), F(E(ix, iy + ih * 0.3, iw * 0.92, ih * 0.68, C.iris)), F(E(ix, iy + ih * 0.58, iw * 0.72, ih * 0.34, C.irisLt)));
  const pr = ex.pupil === 'small' ? 1.1 : 1.9;
  out.push(F(E(ix + gx * 0.4, iy - 0.4 + gy * 0.3, pr, pr * 1.25, '#24124a')));
  out.push(...twinkle(ix + iw * 0.46, iy - ih * 0.12, 1.5, '#ffffff'), ...twinkle(ix - iw * 0.28, iy + ih * 0.34, 1.1, '#ffffff'), F(E(ix + iw * 0.24, iy + ih * 0.5, 0.45, 0.45, '#ffffff')));
  const mx = x - w * 0.34 + gx * 0.3;
  const my = y - h * 0.3 + gy * 0.3;
  const mr = w * 0.3;
  out.push(F(E(mx, my, mr, mr, '#ffffff')), F(E(mx + mr * 0.55 * -o, my - mr * 0.3, mr * 0.78, mr * 0.78, C.irisDk)));
  out.push(...band(curve([[ix - iw * 0.66, iy + ih * 0.6], [ix - iw * 0.3, iy + ih * 0.84], [ix + iw * 0.1, iy + ih * 0.78], [ix + iw * 0.4, iy + ih * 0.88], [ix + iw * 0.66, iy + ih * 0.6]], 3), 0.9, 0.9, '#f4ecff', true));
  const sl = ex.slant ?? 0;
  const inner = x - w * 1.12 * o;
  const outer = x + w * 1.14 * o;
  const yi = y - h * 0.94 + h * 1.8 * lid + sl * h * 0.55;
  const yo = y - h * 0.86 + h * 1.55 * lid - sl * h * 0.1;
  const ym = (yi + yo) / 2 - h * 0.16 * (1 - lid);
  out.push(F(T([[inner, yi], [x, ym], [outer, yo], [outer, y - h * 1.7], [inner, y - h * 1.7]], SKIN)));
  // (The eye's round bottom, kept clean: skin below it.)
  out.push(F(T([...Array.from({ length: 13 }, (_, k) => [x + Math.cos((k / 12) * Math.PI) * (w + 0.1), y + 0.4 + Math.sin((k / 12) * Math.PI) * (h - 0.1)]), [x - w - 3, y + h + 5], [x + w + 3, y + h + 5]], SKIN)));
  // A soft round lash line, the outer corner drooping (he's always a little worried).
  out.push(...band(curve([[inner, yi + 0.3], [x, ym], [outer, yo]], 3), 2.3, 2.6, L, true));
  out.push(...band(curve([[outer - w * 0.1 * o, yo + 0.2], [outer + w * 0.3 * o, yo + 1.2], [outer + w * 0.4 * o, yo + 2.6]], 2), 2, 0.6, L, true));
  out.push(...band(curve([[x - w * 0.4 * o, y + h * 0.98], [x + w * 0.35 * o, y + h * 0.96], [x + w * 0.8 * o, y + h * 0.7]], 2), 0.7, 1.1, L, true));
  return out;
}

function kgMouth(kind) {
  const my = 23.4;
  const L = C.line;
  switch (kind) {
    case 'open':
      return [F(T([[-4, my - 1], [4, my - 1], [3, my + 2.6], [0, my + 3.8], [-3, my + 2.6]], C.mouth)), F(E(0, my + 2.6, 2, 1.2, C.tongue))];
    case 'mine':
      return [F(T([[-5, my - 1.6], [5, my - 1.6], [4.2, my + 3.6], [0, my + 6], [-4.2, my + 3.6]], C.mouth)), F(E(0, my + 4.2, 2.6, 1.5, C.tongue))];
    case 'wail':
      return [F(T([[-4, my], [4, my], [3.4, my + 3.4], [-3.4, my + 3.4]], C.mouth)), F(E(0, my + 2.8, 2.2, 1, C.tongue))];
    case 'pout':
      return [...band(curve([[-2.4, my + 1.6], [0, my + 0.6], [2.4, my + 1.6]], 2), 1.2, 1.2, L, true), ...band([[-1.4, my + 2.6], [1.4, my + 2.6]], 0.7, 0.7, C.mouth, true)];
    case 'shh':
      return [F(E(0, my + 1, 1.6, 1.4, C.mouth)), ...band([[-2.4, my + 1], [-1.4, my + 1]], 0.6, 0.6, L, true), ...band([[1.4, my + 1], [2.4, my + 1]], 0.6, 0.6, L, true)];
    case 'phew':
      return [F(E(0, my + 1, 2.2, 1.6, C.mouth)), F(E(-0.6, my + 1.4, 1, 0.6, C.tongue))];
    case 'smile':
      return band(curve([[-3.4, my - 0.4], [0, my + 2], [3.4, my - 0.4]], 3), 1.2, 1.2, L, true);
    case 'frown':
      return band(curve([[-3.2, my + 2], [-1.4, my + 0.6], [1.4, my + 0.6], [3.2, my + 2]], 3), 1.1, 1.1, L, true);
    case 'o':
      return [F(E(0, my + 1.2, 2, 2.4, C.mouth))];
    default:
      return band(curve([[-3.6, my + 1], [-1.8, my], [0, my + 1], [1.8, my], [3.6, my + 1]], 2), 1.1, 1.1, L, true);
  }
}

function kgFace(ex, blink, gaze, bangShade = []) {
  // (The skull without its angled jaw shadow; the blush and puffed cheeks go on after the eyes, well
  // inside his side locks.)
  const L = skull(0, 0).slice(0, 4);
  L.push(...kgEye(-13.6, 10, -1, ex, blink, gaze), ...kgEye(13.6, 10, 1, ex, blink, gaze));
  for (const sx of [-1, 1]) {
    const cx = 16 * sx;
    // (A tantrum puffs his cheeks out round and pink.)
    if (ex.puff) L.push(F(E(cx + sx, 19.4, 7, 4.8, '#ffd6dc')));
    L.push(F(E(cx, 21, 5 + (ex.blush ?? 0) * 1.4, 2.4 + (ex.blush ?? 0) * 0.5, BLUSH)));
    for (let k = 0; k < 3; k++) L.push(...band([[cx - 3 + k * 2.6, 22], [cx - 1.8 + k * 2.6, 20]], 0.7, 0.7, '#f06a8a', true));
  }
  L.push(...kgMouth(ex.m));
  if (ex.tear) for (const sx of [-1, 1]) L.push(E(sx * 21.8, 17, 2.2, 3, C.tear), F(E(sx * 21.8 - 0.6, 16, 0.7, 0.9, '#ffffff')));
  if (ex.sweat) L.push(E(25, -2, 2.4, 3.4, C.sweat), F(E(24.4, -3, 0.8, 1, '#ffffff')));
  // (The shadow his fringe casts goes right over the skull, under everything else.)
  const placed = place(L);
  return [...placed.slice(0, 4), ...bangShade, ...placed.slice(4)];
}
function kgBrows(kind) {
  const P = {
    worried: [[6.4, -6.2], [12, -4.6], [17.6, -2.2]],
    up: [[6.2, -6.8], [12, -8], [17.6, -6.8]],
    cross: [[6.6, 0.2], [12, -2.2], [17.6, -5.2]],
  }[kind] ?? [[6.4, -6.2], [12, -4.6], [17.6, -2.2]];
  const B = [];
  for (const sx of [-1, 1]) B.push(...band(curve(P.map(([x, y]) => [x * sx, y]), 3), 2.3, 1.3, C.hairDk, true));
  return place(B);
}

// ---------- The drawing ----------

const J = {
  hip: [CX, 108], neck: [HX, NECK], crown: [HX, 40], crownBand: [HX, 43],
  shF: [CX - 11, 92], elF: [CX - 13, 101], wrF: [CX - 13, 109],
  shN: [CX + 12, 92], elN: [CX + 14, 101], wrN: [CX + 15, 109],
  hipF: [CX - 8, 110], kneeF: [CX - 8, 124], ankF: [CX - 8, G - 8],
  hipN: [CX + 7, 110], kneeN: [CX + 7, 124], ankN: [CX + 7, G - 8],
  capeB: [CX, 88], capeB2: [CX - 1, 117], capeL: [CX - 13, 88], capeR: [CX + 13, 88],
  clock: [CX + 3, 101],
};
const HANDS = new Set(['hug', 'point', 'open', 'star']);

function clockShape(out, [kx, ky], r) {
  // The Queen's alarm clock: pink and gold, two bells and their hammer, little feet, a white face
  // with its hands at ten to seven, and a striped sock pulled over the right bell.
  out.push(...band(curve([[kx - r * 0.62, ky - r * 1.16], [kx, ky - r * 1.42], [kx + r * 0.62, ky - r * 1.16]], 2), 1.6, 1.6, C.goldSh, true), E(kx, ky - r * 1.42, 1.8, 1.8, C.gold));
  out.push(E(kx - r * 0.66, ky - r * 0.98, r * 0.42, r * 0.38, C.gold), F(E(kx - r * 0.78, ky - r * 1.06, r * 0.14, r * 0.1, C.goldLt)));
  out.push(E(kx + r * 0.66, ky - r * 1.02, r * 0.46, r * 0.44, C.sock), F(E(kx + r * 0.66, ky - r * 0.86, r * 0.46, r * 0.12, C.sockSh)), F(E(kx + r * 0.66, ky - r * 1.22, r * 0.4, r * 0.08, C.sockSh)), E(kx + r * 0.9, ky - r * 1.34, r * 0.16, r * 0.16, C.sock));
  out.push(E(kx - r * 0.55, ky + r * 0.95, r * 0.2, r * 0.15, C.goldSh), E(kx + r * 0.55, ky + r * 0.95, r * 0.2, r * 0.15, C.goldSh));
  out.push(E(kx, ky, r, r * 0.96, C.clock), F(T([[kx - r, ky], [kx - r * 0.2, ky + r * 0.9], [kx - r * 0.7, ky + r * 0.6]], C.clockSh)), F(E(kx + r * 0.5, ky - r * 0.6, r * 0.28, r * 0.16, C.clockLt)));
  out.push(E(kx, ky, r * 0.74, r * 0.71, C.face));
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    const big = k % 3 === 0;
    out.push(F(E(kx + Math.cos(a) * r * 0.58, ky + Math.sin(a) * r * 0.55, big ? 0.9 : 0.5, big ? 0.9 : 0.5, '#6a5070')));
  }
  out.push(...band([[kx, ky], [kx - r * 0.36, ky - r * 0.22]], 1.4, 1, '#4a3a5a', true), ...band([[kx, ky], [kx - r * 0.1, ky + r * 0.5]], 1.1, 0.8, '#4a3a5a', true), F(E(kx, ky, 1.1, 1.1, C.gold)));
}

function kingShapes(v = 'idle') {
  const { G: parts, use, out } = groups();
  const faceKey = v.includes('|') ? v : `${EX[v] ? v : 'idle'}|0|c`;
  const [exName, blink, gaze] = faceKey.split('|');
  const ex = EX[exName] ?? EX.idle;
  const handKind = HANDS.has(v) ? v : 'hug';
  const hd = kidHead(HX, NECK, 'idle', { iris: C.iris, irisDk: C.irisDk, irisLt: C.irisLt }, 'tomboy', C.hair, 'auto');

  // The geode cape: the back of it (its sparkling lining, what you see of it from the front),
  // sweeping down to the floor behind him.
  // (In two halves, so it bends as it swings: the lower half hangs from the upper.)
  const crystals = (lo, hi) => {
    for (const [x, y, s] of [[-24, 128, 1.2], [-17, 138, 1], [18, 134, 1.1], [24, 122, 0.8], [-22, 110, 0.8], [10, 140, 0.8], [14, 104, 0.7]]) {
      if (y < lo || y >= hi) continue;
      out.push(F(T([[CX + x - 2.4 * s, y + 3 * s], [CX + x, y - 5 * s], [CX + x + 2.4 * s, y + 3 * s]], C.geoLt)), F(T([[CX + x + 2.6 * s, y + 3 * s], [CX + x + 4.4 * s, y - 2 * s], [CX + x + 5.6 * s, y + 3 * s]], C.geoLt)));
    }
  };
  use('capeB');
  out.push(blob([[CX - 15, 85], [CX + 15, 85], [CX + 23, 121], [CX - 26, 121]], C.geo, 2));
  out.push(F(blob([[CX - 15, 86], [CX - 4, 86], [CX - 7.6, 120], [CX - 25.4, 120]], C.geoDk, 2)));
  crystals(0, 116);
  use('capeB2');
  out.push(blob([[CX - 25.6, 114], [CX + 22.6, 114], [CX + 30, G - 4], [CX + 22, G + 0.6], [CX - 24, G + 0.6], [CX - 34, G - 4]], C.geo));
  out.push(F(blob([[CX - 25, 116], [CX - 7.6, 116], [CX - 14, G], [CX - 24, G], [CX - 33, G - 4]], C.geoDk, 2)));
  crystals(116, 200);
  out.push(...band([[CX - 31, G - 2.6], [CX + 27, G - 2.6]], 3, 3, C.gold, true));

  // His hair's back: short and messy, tufts at the nape.
  use('hairBack');
  out.push(...hd.back);

  // The far arm: a puffed white sleeve and his hand (its front twin hugs the clock).
  use('armFu');
  out.push(blob([[J.shF[0] - 5.6, J.shF[1] - 3], [J.shF[0] + 5.4, J.shF[1] - 3.2], [J.shF[0] + 6, J.shF[1] + 3], [J.elF[0] + 4.6, J.elF[1] + 1.6], [J.elF[0] - 4.8, J.elF[1] + 1.8], [J.shF[0] - 6, J.shF[1] + 3]], C.tunicSh));
  use('armFf');
  out.push(E(J.elF[0], J.elF[1], 4.3, 4.3, C.tunicSh), blob([[J.elF[0] - 4.3, J.elF[1] - 0.6], [J.elF[0] + 4.3, J.elF[1] - 0.6], [J.wrF[0] + 4, J.wrF[1] + 0.4], [J.wrF[0] - 4, J.wrF[1] + 0.4]], C.tunicSh, 2));
  out.push(blob([[J.wrF[0] - 4.4, J.wrF[1] - 2.4], [J.wrF[0] + 4.4, J.wrF[1] - 2.4], [J.wrF[0] + 4.4, J.wrF[1] + 0.6], [J.wrF[0] - 4.4, J.wrF[1] + 0.6]], C.goldSh, 2));
  use('handF');
  out.push(E(J.wrF[0], J.wrF[1] + 3.8, 5, 4.6, SKIN_SH), E(J.wrF[0] + 3.4, J.wrF[1] + 2, 2, 2, SKIN_SH));

  // Legs in white tights: a thigh running well up under the shorts, the knee one smooth round, the
  // shin; crystal slippers with a curl at the toe (the walk rolls them heel to toe).
  for (const [k, far] of [['F', true], ['N', false]]) {
    const [hx, hy] = J[`hip${k}`];
    const [kx, ky] = J[`knee${k}`];
    const [ax, ay] = J[`ank${k}`];
    const tg = far ? '#dcd6f0' : C.tights;
    use(`thigh${k}`);
    out.push(blob([[hx - 4.4, hy - 6], [hx + 4.4, hy - 6], [kx + 4, ky], [kx + 3.4, ky + 3.4], [kx - 3.4, ky + 3.4], [kx - 4, ky]], tg, 2));
    if (!far) out.push(F(blob([[hx - 4.2, hy + 4], [hx - 2, hy + 4], [kx - 2.2, ky + 1], [kx - 3.8, ky + 1]], '#e4def4', 1)));
    use(`shin${k}`);
    out.push(E(kx, ky + 0.4, 3.9, 3.7, tg), blob([[kx - 3.8, ky], [kx + 3.8, ky], [ax + 3.5, ay + 1.4], [ax - 3.5, ay + 1.4]], tg, 2));
    if (!far) out.push(F(blob([[kx - 3.7, ky + 2.4], [kx - 1.8, ky + 2.4], [ax - 1.6, ay + 0.6], [ax - 3.4, ay + 0.6]], '#e4def4', 1)));
    use(`foot${k}`);
    const c = far ? C.crySh : C.cry;
    out.push(blob([[ax - 6.4, ay - 1.4], [ax + 5, ay - 1.6], [ax + 9.4, ay + 1], [ax + 11.6, ay + 5], [ax + 8, ay + 7.6], [ax - 6, ay + 7.6], [ax - 7.6, ay + 3.6]], far ? '#5a7ac0' : C.crySh));
    out.push(blob([[ax - 6, ay - 1.4], [ax + 5, ay - 1.6], [ax + 9, ay + 0.8], [ax + 11, ay + 4.4], [ax + 7.6, ay + 6.4], [ax - 5.6, ay + 6.4], [ax - 7, ay + 3]], c));
    out.push(...band(curve([[ax + 8.4, ay + 2], [ax + 12.4, ay - 0.2], [ax + 12, ay - 3]], 2), 2.8, 1.4, c, true));
    out.push(F(E(ax - 0.4, ay + 0.8, 3, 1.1, far ? C.cry : C.cryLt)), F(E(ax + 11.8, ay - 3.4, 1.1, 1.1, C.pink)));
  }

  // Puffy purple shorts, the white tunic, the gold sash, the ermine collar.
  use('shorts');
  out.push(blob([[CX - 16, 105], [CX + 16, 105], [CX + 19.6, 115], [CX + 15, 120], [CX + 2, 118.6], [CX - 13, 120], [CX - 19.6, 115]], C.shorts), F(blob([[CX - 16, 106], [CX - 8, 106], [CX - 9, 118.6], [CX - 13, 119], [CX - 19, 115.6]], C.shortsSh, 2)));
  use('body');
  out.push(blob([[CX - 12, 83], [CX + 13, 83], [CX + 17, 100], [CX + 16.4, 111], [CX - 16.4, 111], [CX - 17, 100]], C.tunic));
  out.push(F(blob([[CX - 12, 86], [CX - 6, 86], [CX - 7.6, 108], [CX - 16, 108], [CX - 16.6, 100]], C.tunicSh, 2)));
  out.push(blob([[CX - 12.6, 85.4], [CX - 6, 84.4], [CX + 16.6, 104.6], [CX + 16, 110.6], [CX + 10.6, 110.6]], C.gold, 2), F(blob([[CX - 12, 86], [CX - 9, 85.6], [CX + 12, 106.4], [CX + 11, 110]], C.goldSh, 1)));
  out.push(...band(curve([[CX - 16.4, 109], [CX, 109.8], [CX + 16.4, 109]], 2), 2.4, 2.4, C.gold, true));
  use('collar');
  out.push(blob([[CX - 17.6, 83.6], [CX + 18.6, 83.6], [CX + 16.6, 91.4], [CX + 6, 94], [CX - 4, 94], [CX - 15.6, 91.4]], C.ermine), F(blob([[CX - 17, 84.6], [CX - 7, 84.6], [CX - 4, 93.4], [CX - 15, 91]], C.ermineSh, 2)));
  for (const [x, y] of [[-11, 88.6], [-2, 91], [7, 90.4], [14, 87.6]]) out.push(F(T([[CX + x, y - 1.4], [CX + x + 0.8, y], [CX + x, y + 1.6], [CX + x - 0.8, y]], C.spot)));

  // The cape's two front edges, outside purple and gold-trimmed, each swinging from his shoulder.
  for (const [k, s, col] of [['capeL', -1, C.capeSh], ['capeR', 1, C.cape]]) {
    use(k);
    const [px, py] = J[k];
    out.push(blob([[px - 3 * s, py - 2.6], [px + 4.4 * s, py - 1.6], [px + 12.4 * s, py + 30], [px + 16.6 * s, G - 5.6], [px + 9 * s, G - 1.4], [px + 2.6 * s, py + 26]], col));
    out.push(...band(curve([[px + 4 * s, py - 1], [px + 11 * s, py + 28], [px + 15 * s, G - 5]], 3), 1.8, 2.2, C.gold, true));
    out.push(...band(curve([[px + 1 * s, py + 4], [px + 6 * s, py + 30], [px + 7 * s, G - 4]], 2), 1.2, 0.8, s < 0 ? C.cape : C.capeLt, true));
  }

  // His head, face, fringe, brows, the cowlick.
  use('head');
  out.push(...kgFace(ex, Number(blink), GAZE[gaze] ?? GAZE.c, hd.shade));
  use('fringe');
  out.push(...hd.fringe);
  use('brows');
  out.push(...kgBrows(ex.b));

  // The crown, far too big for him: a gold band round his head, five crystal prisms, gems.
  use('crown');
  const by = J.crownBand[1];
  for (const [i, h] of [[-2, 13], [-1, 18], [0, 24], [1, 18], [2, 13]]) {
    const x = HX + i * 11;
    out.push(T([[x - 5.4, by], [x - 5.4, by - h * 0.62], [x, by - h], [x + 5.4, by - h * 0.62], [x + 5.4, by]], i === 0 ? C.cry : i < 0 ? C.crySh : C.cry));
    out.push(F(T([[x, by], [x, by - h], [x + 5.4, by - h * 0.62], [x + 5.4, by]], C.cryLt)));
  }
  out.push(blob([[HX - 31, by - 3.4], [HX + 31, by - 3.4], [HX + 29.4, by + 6.6], [HX - 29.4, by + 6.6]], C.gold, 2), F(blob([[HX - 30.6, by - 3], [HX - 18, by - 3], [HX - 18, by + 6.2], [HX - 29, by + 6.2]], C.goldSh, 2)));
  out.push(...band([[HX - 30, by - 1.6], [HX + 30, by - 1.6]], 1.4, 1.4, C.goldLt, true));
  for (const i of [-2, -1, 0, 1, 2]) out.push(F(E(HX + i * 11, by + 1.8, 2.2, 2.2, i === 0 ? C.pink : C.blue)), F(E(HX + i * 11 - 0.6, by + 1.2, 0.6, 0.6, '#ffffff')));

  // The near arm, the clock in his arms, and the far hand round the front of it.
  use('armNu');
  out.push(blob([[J.shN[0] - 5.4, J.shN[1] - 3.2], [J.shN[0] + 5.6, J.shN[1] - 3], [J.shN[0] + 6, J.shN[1] + 3], [J.elN[0] + 4.8, J.elN[1] + 1.8], [J.elN[0] - 4.6, J.elN[1] + 1.6], [J.shN[0] - 6, J.shN[1] + 3]], C.tunic), F(E(J.shN[0] + 1.6, J.shN[1] + 2, 2.6, 3, C.tunicSh)));
  use('armNf');
  out.push(E(J.elN[0], J.elN[1], 4.3, 4.3, C.tunic), blob([[J.elN[0] - 4.3, J.elN[1] - 0.6], [J.elN[0] + 4.3, J.elN[1] - 0.6], [J.wrN[0] + 4, J.wrN[1] + 0.4], [J.wrN[0] - 4, J.wrN[1] + 0.4]], C.tunic, 2));
  out.push(blob([[J.wrN[0] - 4.4, J.wrN[1] - 2.4], [J.wrN[0] + 4.4, J.wrN[1] - 2.4], [J.wrN[0] + 4.4, J.wrN[1] + 0.6], [J.wrN[0] - 4.4, J.wrN[1] + 0.6]], C.gold, 2));
  use('clock');
  clockShape(out, J.clock, 13);
  for (const [hand, [wx, wy], col] of [['handN', J.wrN, SKIN], ['handFf', J.wrF, SKIN]]) {
    use(hand);
    if (handKind === 'point' && hand === 'handN') {
      out.push(E(wx, wy + 3.4, 4.6, 4.2, col), ...band([[wx + 0.4, wy + 6.4], [wx + 0.8, wy + 12]], 2.4, 2, col), E(wx + 3.4, wy + 2.2, 1.8, 1.8, col));
    } else if (handKind === 'star' && hand === 'handN') {
      out.push(E(wx, wy + 3.6, 4.8, 4.4, col));
      const pts = [];
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const rr = k % 2 ? 2.8 : 6.4;
        pts.push([wx + 1 + Math.cos(a) * rr, wy + 9 + Math.sin(a) * rr]);
      }
      out.push(T(pts, '#fff3a6'), F(E(wx + 1, wy + 9, 2, 2, '#ffffff')));
    } else if (handKind === 'open') {
      out.push(E(wx, wy + 3.8, 5, 4.6, col), E(wx + 3.8, wy + 2, 2, 2, col), ...band([[wx - 1.6, wy + 7.6], [wx + 2.4, wy + 7.6]], 0.6, 0.6, SKIN_SH, true));
    } else {
      out.push(E(wx, wy + 3.6, 5, 4.6, col), E(wx + 3.4, wy + 2, 2, 2, col), ...band(curve([[wx - 2.8, wy + 4.6], [wx + 0.4, wy + 6], [wx + 3, wy + 4.6]], 2), 0.6, 0.6, SKIN_SH, true));
    }
  }

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

// ---------- The rig ----------

const K = kidKit(KG, kingShapes, J, { scale: SCALE, flat: true, cel: new Set(['hairBack', 'fringe']) });
const { rel, through } = K;
const U = K.SC;
// (Small careful steps: a short stride for his long boss-size legs, the swinging foot kept low.)
const WK = kidWalk(K, { stride: 27, kick: 4.6, peel: 24, key: 'kg' });
const LOOP = 16;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// A story move he's acting out (world/story.js m.castMove): its wind-up 0..1, and its release
// (0..1 over the 0.7 s after it goes off).
function castOf(m, now) {
  const c = m.castMove;
  if (!c) return null;
  const s = now - c.at;
  if (s < 0 || s > c.warn + 0.7) return null;
  const wind = smooth(clamp(s / Math.min(0.5, c.warn), 0, 1)) * (s < c.warn ? 1 : 1 - smooth((s - c.warn) / 0.7));
  return { id: c.id, wind, go: s >= c.warn ? (s - c.warn) / 0.7 : -1, u: clamp(s / c.warn, 0, 1) };
}

export const littleKingRig = makeRig({
  w: K.BW,
  h: K.BH,
  soft: true,
  stride: 27,
  recover: 0.7,
  springs: {
    x: [170, 15], lift: [170, 13], tilt: [130, 11], head: [90, 9], hop: [260, 15],
    shF: [130, 12], elF: [140, 12], shN: [130, 12], elN: [140, 12],
    crown: [70, 5.5], clkX: [150, 13], clkY: [150, 13], clkR: [200, 9], capeO: [70, 8], feet: [240, 18], toeF: [220, 16], toeN: [220, 16],
  },
  walkStiff: { ...WALK_STIFF, crown: [140, 9], clkR: [260, 18], clkY: [400, 30] },
  fast: ['x', 'lift', 'tilt', 'hop', 'shN', 'elN', 'shF', 'elF', 'clkX', 'clkY'],
  kick: { tilt: -200, head: 320, crown: 420, clkR: 260 },
  turnKick: { tilt: 120, head: -140, crown: 300, capeO: 120 },
  pose(m, a) {
    const t = a.t + (m.uid % 7) * 1.3;
    WK.step(m, a);
    const lu = t % LOOP;
    const cine = m.cine ?? {};
    const freed = Boolean(cine.freed);
    // (No act in the middle of a fight or a scene of his own.)
    const calm = freed || m.castMove && a.now - m.castMove.at < m.castMove.warn + 1 ? 0 : a.calm ?? 1;
    const breath = Math.sin(t * 1.9);
    // The act.
    const peek = hold(lu, 1.2, 1.6, 4.6, 5.1) * calm;
    const peekDir = Math.sin((lu - 1.2) * 1.4) > 0 ? 1 : -1;
    const ring = hold(lu, 6, 6.08, 6.9, 7) * calm;
    const smother = hold(lu, 6.8, 7.1, 8.4, 8.8) * calm;
    const relief = hold(lu, 8.6, 8.9, 9.6, 10.1) * calm;
    const slip = hold(lu, 10.6, 11.4, 12.2, 12.5) * calm;
    const push = hold(lu, 11.6, 11.9, 12.3, 12.7) * calm;
    const cuddle = hold(lu, 13.2, 13.7, 15.3, 15.8) * calm;
    const shiver = peek * Math.sin(t * 38) * 0.6;
    a.kgRing = ring;
    // The story move, if he's casting one; the cutscene's hand-over and star.
    const cm = castOf(m, a.now);
    const mv = (id) => (cm && cm.id === id ? cm.wind : 0);
    const spikes = mv('spikes');
    const flare = mv('flare');
    const sweep = mv('sweep');
    const dark = mv('dark');
    a.kgCast = cm;
    const gave = cine.gave != null ? clamp((a.now - cine.gave) / 0.9, 0, 1) : 0;
    const giving = gave > 0 && gave < 1 ? Math.sin(Math.PI * gave) : 0;
    a.kgClock = cine.gave != null && gave >= 0.85 ? 0 : 1;
    a.kgStar = Boolean(cine.star);
    const sad = freed && cine.mood !== 'happy' ? 1 : 0;
    const glad = freed && cine.mood === 'happy' ? Math.abs(Math.sin(t * 5)) : 0;
    const hugging = a.kgClock;
    const idle = {
      x: 0,
      lift: breath * 0.2 - peek * 1 - smother * 2 + relief * 0.6 + cuddle * Math.abs(Math.sin(t * 2.2)) * 0.8 - sad * 5 + glad * 3,
      tilt: breath * 0.5 + shiver + peek * peekDir * 4 - smother * -6 + cuddle * Math.sin(t * 2.2) * 6 + push * -4 - sad * 6,
      head: Math.sin(t * 0.6) * 2 + peek * (peekDir * 9 - 4) + ring * Math.sin(t * 40) * 4 + smother * 10 - relief * 6 + slip * 4 - push * 8 + cuddle * Math.sin(t * 2.2 - 0.5) * 6 + sad * 14,
      hop: glad * 2,
      // Hugging the clock: near forearm across its front, far hand round its side.
      shF: 14 + breath * 1 - smother * 6 + cuddle * 4,
      elF: -96 - smother * 12,
      shN: -14 - breath * 1 + smother * 6 - push * 118,
      elN: 100 + smother * 14 - push * 150,
      crown: 6 + slip * 18 - push * 22 + Math.sin(t * 0.8) * 1.4,
      clkX: 0,
      clkY: -smother * 1.6 + cuddle * 0.6,
      clkR: ring * Math.sin(t * 46) * 9 + cuddle * Math.sin(t * 2.2) * 6 + push * 10,
      capeO: smother * -10 + sad * -6,
      feet: 0,
      toeF: 0,
      toeN: 0,
    };
    // Small careful steps, the clock hugged tight, glancing about.
    // (The kid walk: his hips sink just as far as his planted feet need, a sharp little bob on top;
    // his head rides a beat behind and keeps glancing about; the clock bobs in his arms and the
    // crown wobbles with each step.)
    const p = (a.kgU ?? 0) * TAU;
    const roll = Math.sin(p - 0.5);
    const hb = WK.headBob(a);
    const walk = {
      ...idle,
      x: 0.8 + roll * 0.6,
      lift: -WK.sink(a) - 0.9 + WK.bob(a) * 1.4,
      tilt: 3 + roll * 2.2,
      head: -2 + Math.sin(t * 0.9) * 7 - roll * 1.4 + hb * 7,
      hop: 0,
      shF: 14 + hb * 5,
      shN: -14 - hb * 5,
      crown: 6 + hb * 9,
      clkY: hb * 1.2,
      clkR: roll * 4,
      capeO: 6,
      feet: 0,
    };
    // The tantrum (the Crystal Throne's slam): hunched, shaking; then a hop and a STOMP.
    const shake = Math.sin(t * 40);
    const antic = { ...idle, x: -1, lift: -4, tilt: -4 + shake * 1.6, head: 8 + shake * 2, hop: 0, shF: 10, elF: -104, shN: -8, elN: 112, crown: 10, clkY: -2, clkR: shake * 4, capeO: -8, feet: 2.4 };
    const since = a.ph.since;
    const stompHop = since >= 0 && since < 0.3 ? Math.sin((Math.PI * since) / 0.3) * 9 : 0;
    const strike = { ...idle, x: 3, lift: -3, tilt: 6, head: -8, hop: stompHop, shF: 18, elF: -90, shN: -18, elN: 96, crown: -6, clkY: 2, clkR: -6, capeO: 26, feet: 2.4, toeF: stompHop > 1 ? 8 : 0, toeN: stompHop > 1 ? -10 : 0 };
    const rest = Math.max(0, 1 - a.ph.antic - a.ph.strike);
    const out = {};
    for (const k of Object.keys(idle)) out[k] = (idle[k] * (1 - a.walkW) + walk[k] * a.walkW) * rest + antic[k] * a.ph.antic + strike[k] * a.ph.strike;
    // The trial's moves, layered over whatever he was doing.
    const lay = (w, pose) => {
      if (w <= 0) return;
      for (const [k, v] of Object.entries(pose)) out[k] = out[k] * (1 - w) + v * w;
    };
    const jab = cm && cm.go >= 0 && cm.go < 1 ? Math.sin(Math.PI * cm.go) : 0;
    lay(spikes, { lift: -2 - jab * 2, tilt: 8, head: 6, shN: -38 - jab * 10, elN: -30, crown: 10, clkX: -3, clkR: 8 });
    lay(flare, { x: 1, lift: 0.6, tilt: 4, head: -6, shN: -80, elN: -18, shF: -62, elF: -12, clkX: 19, clkY: 6, clkR: 0, crown: 4 });
    lay(sweep, { x: -1, lift: -5, tilt: 14, head: 4, shN: -60, elN: -10, capeO: 46 + jab * 16, crown: 12 });
    lay(dark, { lift: -9, tilt: -2 + Math.sin(t * 34) * 1.2, head: 18, shF: 6, elF: -110, shN: -6, elN: 118, clkY: -2, capeO: -26, crown: 16 });
    // Handing the clock back: both arms out with it, then empty.
    lay(giving, { tilt: 6, head: -4, shN: -72, elN: -16, shF: -56, elF: -16, clkX: 17, clkY: 2 });
    if (!hugging) lay(1, { shN: a.kgStar ? -40 : -8, elN: a.kgStar ? -40 : -14, shF: 8, elF: 12, clkY: 0 });
    if (m.hp <= 0 && !freed) Object.assign(out, { lift: -6, tilt: -10, head: 12, crown: 24 });
    out.elN = clamp(out.elN, -150, 150);
    out.elF = clamp(out.elF, -150, 150);
    a.kgHugF = hugging * (1 - giving * 0.2);
    // His face.
    let ex = a.face === 'dead' ? (freed ? 'sad' : 'dizzy') : a.face === 'hurt' ? 'hurt' : null;
    if (!ex && dark > 0.3) ex = 'fear';
    else if (!ex && flare > 0.3) ex = cm.go >= 0 ? 'shout' : 'fear';
    else if (!ex && (spikes > 0.3 || sweep > 0.3)) ex = cm.go >= 0 ? 'shout' : 'angry';
    else if (!ex && a.ph.strike > 0.15) ex = 'shout';
    else if (!ex && a.ph.antic > 0.05) ex = 'angry';
    else if (!ex && a.face === 'angry') ex = 'angry';
    else if (!ex && a.face === 'happy') ex = 'happy';
    else if (!ex && a.face === 'sleepy') ex = 'relief';
    else if (!ex && EX[a.face] && a.face !== 'idle') ex = a.face;
    if (!ex) ex = ring > 0.3 ? 'scared' : smother > 0.3 ? 'shush' : relief > 0.3 ? 'relief' : push > 0.3 || slip > 0.6 ? 'surprised' : cuddle > 0.3 ? 'cuddle' : peek > 0.3 ? 'scared' : 'idle';
    const P = 2.4 + (m.uid % 7) * 0.31;
    const q = (a.t + (m.uid % 5) * 0.8) % P;
    const blink = q < 0.05 ? 1 : q < 0.13 ? 2 : q < 0.19 ? 1 : 0;
    const n = Math.floor((a.t + m.uid * 0.37) / 0.9);
    const atk = a.ph.antic > 0.02 || a.ph.strike > 0.02 || Boolean(cm);
    const gaze = peek > 0.3 ? (peekDir > 0 ? 'f' : 'b') : slip > 0.5 ? 'u' : a.face === 'angry' || atk ? 'f' : ['c', 'f', 'b', 'c', 'd', 'f', 'b', 'c'][Math.floor(hash(n + m.uid) * 8)];
    a.mo.rig.kgFace = `${ex}|${EX[ex].e === 'open' && !atk ? blink : 0}|${gaze}`;
    a.kgHand = a.kgStar && !hugging ? 'star' : spikes > 0.3 ? 'point' : push > 0.3 || giving > 0.3 || !hugging ? 'open' : 'hug';
    return out;
  },
  fx(ctx, m, a, S, matOf) {
    const t = a.t + (m.uid % 7) * 1.3;
    const [kx, ky] = through(matOf('clock'), 'clock', 'clock');
    const cm = a.kgCast;
    // The clock glows like a little star in his arms (brighter as it flares; dimmer in the dark).
    if (a.kgClock) {
      const flare = cm?.id === 'flare' ? cm.wind : 0;
      const dim = cm?.id === 'dark' ? cm.wind * 0.5 : 0;
      const R = 13 * U;
      puff(ctx, a, kx, ky, R * (1.6 + Math.sin(t * 2.4) * 0.1) * (1 + flare * 0.7), 0.26 + flare * 0.22 - dim, '255,236,170');
      for (let i = 0; i < 2; i++) {
        const P = 1.6 + i * 0.5;
        const f = (((t + i * 0.8) % P) + P) % P / P;
        sparkle(ctx, a, kx + (i ? 0.8 : -0.7) * R, ky - (0.7 + f) * R, 1.6 * (1 - f), 1 - f, '#fff3c8');
      }
      // Ringing: lines of sound off the bells, and the bells' shudder.
      const ring = a.kgRing ?? 0;
      if (ring > 0.05) {
        ctx.strokeStyle = '#fff3a6';
        ctx.lineWidth = 0.9;
        for (let i = 0; i < 3; i++) {
          const r = (0.6 + i * 0.3 + ((t * 18) % 3) * 0.1) * R;
          ctx.globalAlpha = (a.alpha ?? 1) * ring * (1 - i / 3);
          ctx.beginPath();
          ctx.arc(kx, ky - R * 1.1, r, -Math.PI * 0.85, -Math.PI * 0.15);
          ctx.stroke();
        }
      }
      // The flare going off: rays of light from the clock.
      if (cm?.id === 'flare' && cm.go >= 0) {
        const u = cm.go;
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * TAU + t;
          sparkle(ctx, a, kx + Math.cos(ang) * (10 + u * 40) * U, ky + Math.sin(ang) * (10 + u * 40) * U, 2.4 * (1 - u), 1 - u, i % 2 ? '#fff3c8' : '#ffffff');
        }
      }
    }
    // Crystal Spikes: glints off his pointing finger; the Cape Sweep: sparkles along the floor.
    if (cm?.id === 'spikes' && cm.wind > 0.3) {
      const [hx, hy] = through(matOf('handN'), 'wrN', 'wrN');
      sparkle(ctx, a, hx + 1, hy + 12 * U, 2 * cm.wind, cm.wind, '#eef8ff');
    }
    if (cm?.id === 'sweep' && cm.go >= 0) {
      const u = cm.go;
      for (let i = 0; i < 7; i++) sparkle(ctx, a, (10 + i * 12 + u * 30) * (U * 1.1), -2 - (i % 2) * 3, 2 * (1 - u), 1 - u, i % 2 ? '#c9adff' : '#ffffff');
    }
    // The stomp's crystals jumping off the floor.
    if (a.ph.since >= 0 && a.ph.since < 0.5 && !cm) {
      const u = a.ph.since / 0.5;
      for (let i = 0; i < 8; i++) {
        const dir = i < 4 ? -1 : 1;
        const x = dir * (6 + (i % 4) * 7) * (1 + u);
        dot(ctx, a, x, -u * (10 + (i % 3) * 6) + u * u * 14, 1.2 * (1 - u * 0.5), 1 - u, i % 2 ? '#aedcff' : '#eef8ff');
      }
    }
    if (m.hp <= 0 && !m.cine?.freed) {
      const [hx, hy] = through(matOf('head'), 'crown', 'neck');
      for (let i = 0; i < 3; i++) {
        const ang = a.t * 3 + (i * TAU) / 3;
        sparkle(ctx, a, hx + Math.cos(ang) * 14, hy - 6 + Math.sin(ang) * 4, 2.4, 0.9, '#ffe9a0');
      }
    }
  },
  parts: twoPass([
    K.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel('hip')[0] + S.x, rel('hip')[1] - S.lift - S.hop], rot: (S) => S.tilt * D2R }),
    K.layer('capeB2', { parent: 'capeB', pivot: 'capeB2', from: 'capeB', rot: (S) => S.capeO * 0.35 * D2R, soft: { ...SOFT.CLOTH, k: 52, max: 14, gain: 0.45, hang: 0.6 } }),
    K.layer('capeB', { parent: 'torso', pivot: 'capeB', from: 'hip', rot: (S) => S.capeO * 0.25 * D2R, soft: { ...SOFT.CLOTH, k: 60, max: 8, gain: 0.35, hang: 0.7 } }),
    K.layer('hairBack', { parent: 'head', pivot: 'neck', from: 'neck', soft: { ...SOFT.HAIR, k: 80, max: 6, gain: 0.25, hang: 0.4 } }),
    K.layer('armFu', { parent: 'torso', pivot: 'shF', from: 'hip', rot: (S) => S.shF * D2R }),
    K.layer('armFf', { parent: 'armFu', pivot: 'elF', rot: (S) => S.elF * D2R }),
    { ...K.layer('handF', { parent: 'armFf', pivot: 'wrF' }), alpha: (a) => 1 - (a.kgHugF ?? 1) },
    ...WK.parts(),
    K.layer('shorts', { parent: 'torso', pivot: 'hip' }),
    K.layer('body', { parent: 'torso', pivot: 'hip' }),
    K.layer('collar', { parent: 'torso', pivot: 'hip' }),
    K.layer('capeL', { parent: 'torso', pivot: 'capeL', from: 'hip', rot: (S) => S.capeO * 0.5 * D2R, soft: { ...SOFT.CLOTH, k: 70, max: 20, hang: 0.6 } }),
    K.layer('capeR', { parent: 'torso', pivot: 'capeR', from: 'hip', rot: (S) => -S.capeO * 0.6 * D2R, soft: { ...SOFT.CLOTH, k: 76, max: 20, hang: 0.6 } }),
    { ...K.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R }), s: (a, S, b) => K.piece('head', a.mo.rig?.kgFace ?? 'idle|0|c', b) },
    K.layer('fringe', { parent: 'head', pivot: 'crown', from: 'neck', soft: SOFT.FRINGE }),
    { ...K.layer('brows', { parent: 'head', pivot: 'neck', from: 'neck' }), s: (a, S, b) => K.piece('brows', (a.mo.rig?.kgFace ?? 'idle').split('|')[0], b) },
    // The crown sits loose: tipped by how far it has slipped, wobbling on its own.
    K.layer('crown', { parent: 'head', pivot: 'crownBand', from: 'neck', at: (S) => {
      const [x, y] = rel('crownBand', 'neck');
      return [x + S.crown * 0.05 * U * 3, y + Math.abs(S.crown) * 0.09 * U * 3];
    }, rot: (S) => S.crown * D2R, soft: { ...SOFT.PROP, k: 90, c: 5, gain: 0.3, max: 14 } }),
    K.layer('armNu', { parent: 'torso', pivot: 'shN', from: 'hip', rot: (S) => S.shN * D2R }),
    K.layer('armNf', { parent: 'armNu', pivot: 'elN', rot: (S) => S.elN * D2R }),
    { ...K.layer('clock', { parent: 'torso', pivot: 'clock', from: 'hip', at: (S) => {
      const [x, y] = rel('clock', 'hip');
      return [x + S.clkX * U, y - S.clkY * U];
    }, rot: (S) => S.clkR * D2R, soft: { ...SOFT.PROP, k: 120, gain: 0.2, max: 10 } }), alpha: (a) => a.kgClock ?? 1 },
    { ...K.layer('handFf', { parent: 'armFf', pivot: 'wrF' }), alpha: (a) => a.kgHugF ?? 1 },
    { ...K.layer('handN', { parent: 'armNf', pivot: 'wrN' }), s: (a, S, b) => K.piece('handN', a.kgHand ?? 'hug', b) },
  ]),
});

export const littleKingStill = K.still;
export { kingShapes };
