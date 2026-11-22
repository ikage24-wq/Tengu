// The Ruin Acolyte (2026-11-22, replaces the Will-o'-Wisp in the Twilight Ruins): a little temple
// acolyte who floats through the halls she still tends, hooded in plum and gold, her robe trailing
// away into wisps where her feet would be, long bell sleeves, silver hair spilling out of the hood.
// She carries a censer on a chain, and a little wisp lives in it: her friend. Built on the kid base
// (kidbase.js, kidrig.js), drawn from scratch, with her own face: calm almond eyes in teal under a
// heavy lid, long lashes, a gold mark on her brow. (Remade the same day to the approved standard:
// real parted bangs and long wavy hair, half-moon eyes glowing with no pupil, every panel a soft shape,
// hand shading and even outlines.)
//
// How she moves (her signature is the censer: a real pendulum on its chain, and the wisp in it):
//   glide   she leans into it and floats along on a slow swell, never a bounce; the robe's tails
//           stream out behind her, the sleeves trail, the censer swings back on its chain.
//   idle    a 20 s act: lifts the censer high in offering, eyes shut, smoke curling up; lets the
//           wisp out to play (it circles her, her eyes follow it, it boops her cheek, she giggles,
//           it goes home); dozes off mid-prayer, head sinking, then startles awake, flustered.
//   attack  draws the censer back past her hip, then swings it up and round in a big arc, and the
//           wisp shoots out of it at you and zips back; then a polite little bow.
//   beaten  her eyes swirl and she sinks, the censer slipping on its chain.

import { E, T, F } from './kit.js';
import { W, H, CX, G, SKIN, SKIN_SH, BLUSH, band, curve, petal, groups, skull, HS, mapShape, kidHead, blob, ovalPts } from './kidbase.js';
import { kidKit, SOFT, twoPass, hold, D2R } from './kidrig.js';
import { makeRig, spring, smooth, clamp, TAU } from './rig.js';
import { blit } from '../pixel.js';
import { puff, sparkle } from './rigkit.js';

const AC = 'acolyte2';
const HX = CX + 2;
const NECK = 86;
const HY = NECK - 31 * HS;
const C = {
  robe: '#5a4aa8', robeSh: '#40347e', robeDk: '#2c2358', robeLt: '#8a7cd2',
  gold: '#f2c862', goldSh: '#c99a3a', goldLt: '#fff0b4',
  glow: '#8eeee2', glowLt: '#e6fffb', glowDk: '#4cc4bc',
  hair: '#ece6ff', hairSh: '#c6bcf0', hairDk: '#a496dc',
  iris: '#56d2c6', irisDk: '#1f7a78', irisLt: '#c8fff6', lash: '#3c2c5c', lid: '#c4b4e8',
  mouth: '#a44a66', line: '#7c3858', tongue: '#ff95aa', tear: '#c8f0ff',
  metal: '#c9a24a', metalSh: '#8e6a2a',
};

// ---------- The face ----------

const place = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY + y * HS], HS));

const EX = {
  idle: { e: 'open', lid: 0.3, m: 'smile', b: 'soft', gaze: 'd' },
  pray: { e: 'shut', m: 'smile', b: 'soft' },
  happy: { e: 'arch', m: 'open', b: 'up' },
  surprised: { e: 'open', lid: 0, pupil: 'small', m: 'o', b: 'up' },
  flustered: { e: 'wavy', m: 'wobble', b: 'worried', blush: 1 },
  doze: { e: 'open', lid: 0.82, m: 'o', b: 'soft' },
  angry: { e: 'open', lid: 0.3, slant: 0.7, m: 'line', b: 'cross' },
  shout: { e: 'open', lid: 0.08, slant: 0.4, m: 'ha', b: 'cross' },
  hurt: { e: 'squeeze', m: 'ha', b: 'worried', tear: true },
  dizzy: { e: 'swirl', m: 'wobble', b: 'worried' },
  sad: { e: 'open', lid: 0.5, m: 'frown', b: 'worried', tear: true },
  bow: { e: 'shut', m: 'open', b: 'up' },
};
const GAZE = { c: [0, 0], f: [1.5, 0.3], b: [-1.5, 0.3], u: [0.3, -1.5], d: [0.4, 1.4], fu: [1.3, -1.2], bu: [-1.3, -1.2] };

// Her own eyes (remade 2026-11-22): half-moons, the upper lid a heavy near-straight line, the bottom
// round; glowing teal irises with no pupil at all, only a bright ring and a soft star of light in the
// middle (a temple girl's calm, faraway look); two little lashes flicking up off the outer corner.
// Shut, they're a soft downward curve with long lashes; wide, the lid lifts off round.
function acEye(x, y, o, ex, blink, g) {
  const out = [];
  const w = 7;
  const h = 7.4;
  const L = C.lash;
  let kind = ex.e;
  let lid = ex.lid ?? 0;
  if (kind === 'open' && blink === 2) kind = 'shut';
  if (kind === 'open' && blink === 1) lid = Math.max(lid, 0.8);
  const P = (dx, dy) => [x + dx * o, y + dy];
  if (kind === 'arch') {
    out.push(...band(curve([P(-w, 1.6), P(-w * 0.4, -h * 0.4), P(w * 0.4, -h * 0.4), P(w, 1.6)], 3), 2, 2, L, true), ...band([P(w * 0.95, 1.2), P(w * 1.45, 0.2)], 1.4, 0.5, L, true));
    return out;
  }
  if (kind === 'shut') {
    out.push(...band(curve([P(-w, 0), P(-w * 0.2, h * 0.36), P(w * 0.5, h * 0.32), P(w, -0.2)], 3), 1.8, 2.3, L, true));
    out.push(...band(curve([P(w * 0.9, 0), P(w * 1.4, 1.6), P(w * 1.6, 3.4)], 2), 1.6, 0.5, L, true));
    for (const k of [-0.3, 0.2]) out.push(...band([P(w * k, h * 0.46), P(w * (k + 0.06), h * 0.68)], 0.6, 0.4, L, true));
    return out;
  }
  if (kind === 'wavy') {
    out.push(...band(curve([P(-w, 0.6), P(-w * 0.5, -1), P(0, 0.6), P(w * 0.5, -1), P(w, 0.6)], 3), 1.7, 1.7, L, true));
    return out;
  }
  if (kind === 'squeeze') {
    out.push(...band([P(w, -h * 0.44), P(-w * 0.6, 0.2), P(w, h * 0.44)], 2.1, 1.9, L, true));
    return out;
  }
  if (kind === 'swirl') {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = i * 0.6 * o;
      const r = 0.5 + i * 0.3;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 1.1]);
    }
    out.push(...band(pts, 1.3, 1.4, L, true));
    return out;
  }
  const [gx, gy] = g;
  const wide = kind === 'wide' || lid < 0.05;
  // The lid's line: nearly straight, a touch lower toward the outer corner, lifting off round when
  // she's wide-eyed; the stern slant tips it down toward her nose.
  const sl = ex.slant ?? 0;
  const ly = -h * 0.62 + lid * h * 0.8;
  const lidLine = wide
    ? curve([P(-w - 0.4, -0.6), P(-w * 0.45, -h * 0.92), P(w * 0.5, -h * 0.92), P(w + 0.4, -0.8)], 4)
    : curve([P(-w - 0.4, ly + 0.6 + sl * 2.6), P(-w * 0.3, ly + sl * 1.2), P(w * 0.5, ly + 0.3), P(w + 0.4, ly + 1.4)], 4);
  const bottom = ovalPts(x, y, w, h, 0, 0, Math.PI, 16);
  // The eye: deep teal, the glowing iris (a bright ring, no pupil), a soft star of light.
  out.push(F(T([P(-w, ly - 2), P(w, ly - 2), ...bottom.slice().reverse().map(([bx, by]) => [x + (bx - x) * o * o, by])], C.irisDk)));
  out.push(F(E(x + gx * 0.7, y + 1.4 + gy * 0.5, 4.8, 5, C.irisDk)), F(E(x + gx * 0.7, y + 1.4 + gy * 0.5, 4.2, 4.4, C.iris)), F(E(x + gx * 0.7, y + 1.4 + gy * 0.5, 2.8, 3, C.irisLt)), F(E(x + gx * 0.7, y + 1.4 + gy * 0.5, 1.8, 2, C.iris)));
  const sx = x + gx * 0.7;
  const sy = y + 1.4 + gy * 0.5;
  out.push(F(T([[sx, sy - 1.8], [sx + 0.5, sy - 0.5], [sx + 1.8, sy], [sx + 0.5, sy + 0.5], [sx, sy + 1.8], [sx - 0.5, sy + 0.5], [sx - 1.8, sy], [sx - 0.5, sy - 0.5]], '#ffffff')));
  out.push(F(E(x - w * 0.42 * o, y - 0.6, 1.2, 0.9, '#ffffff')));
  // Skin over everything above the lid's line and below the round bottom.
  out.push(F(T([...lidLine, P(w + 3, -h - 6), P(-w - 3, -h - 6)], SKIN)));
  out.push(F(T([...ovalPts(x, y, w + 0.2, h + 0.2, 0, 0, Math.PI, 16), [x - w - 3, y + h + 6], [x + w + 3, y + h + 6]], SKIN)));
  // The heavy lash line along the lid, a soft lilac line under the eye, two long lashes off the
  // outer corner below.
  out.push(...band(lidLine, 2.2, 2.6, L, true));
  out.push(...band(curve(ovalPts(x, y, w + 0.4, h + 0.3, 0, 0.35, Math.PI - 0.35, 8), 1), 0.8, 0.8, C.lid, true));
  const end = lidLine[lidLine.length - 1];
  out.push(...band(curve([end, [end[0] + 1.6 * o, end[1] - 1.4], [end[0] + 2.6 * o, end[1] - 3.2]], 2), 1.4, 0.4, L, true), ...band(curve([[end[0] - 0.8 * o, end[1] - 0.4], [end[0] + 0.4 * o, end[1] - 2.4], [end[0] + 0.8 * o, end[1] - 4.2]], 2), 1.1, 0.35, L, true));
  return out;
}

function acMouth(kind) {
  const my = 23.4;
  const L = C.line;
  switch (kind) {
    case 'open':
      return [F(T([[-3.4, my - 0.8], [3.4, my - 0.8], [2.4, my + 2.2], [0, my + 3.2], [-2.4, my + 2.2]], C.mouth)), F(E(0, my + 2.2, 1.7, 1, C.tongue))];
    case 'ha':
      return [F(E(0, my + 1.4, 3, 3, C.mouth)), F(E(0, my + 2.8, 1.8, 1.1, C.tongue))];
    case 'o':
      return [F(E(0, my + 1, 1.5, 1.8, C.mouth))];
    case 'wobble':
      return band(curve([[-3.2, my + 1], [-1.6, my], [0, my + 1], [1.6, my], [3.2, my + 1]], 2), 1, 1, L, true);
    case 'line':
      return band([[-2.6, my + 0.8], [2.6, my + 0.8]], 1, 1, L, true);
    case 'frown':
      return band(curve([[-2.8, my + 1.6], [0, my + 0.4], [2.8, my + 1.6]], 2), 1, 1, L, true);
    default:
      return band(curve([[-2.8, my], [0, my + 1.5], [2.8, my]], 2), 1, 1, L, true);
  }
}

function acFace(ex, blink, gaze, bangShade = []) {
  // (The skull without its angled jaw shadow: her wavy side locks shade her cheeks instead. The blush
  // sits well inside them, under each eye, over the eyes' skin masks.)
  const L = skull(0, 0).slice(0, 4);
  L.push(...acEye(-13.4, 10.5, -1, ex, blink, gaze), ...acEye(13.4, 10.5, 1, ex, blink, gaze));
  for (const sx of [-1, 1]) {
    const cx = 15 * sx;
    L.push(F(E(cx, 20, 4.4 + (ex.blush ?? 0) * 1.6, 2 + (ex.blush ?? 0) * 0.6, BLUSH)));
    for (let k = 0; k < (ex.blush ? 3 : 2); k++) L.push(...band([[cx - 2 + k * 2.6, 21], [cx - 0.9 + k * 2.6, 19]], 0.6, 0.6, '#ef6f90', true));
  }
  L.push(...acMouth(ex.m));
  if (ex.tear) for (const sx of [-1, 1]) L.push(E(sx * 20.6, 16.4, 1.9, 2.6, C.tear), F(E(sx * 20.6 - 0.5, 15.4, 0.6, 0.8, '#ffffff')));
  const placed = place(L);
  return [...placed.slice(0, 4), ...bangShade, ...placed.slice(4)];
}
function acBrows(kind) {
  const P = {
    soft: [[6.6, -2.4], [12, -3.6], [17, -3]],
    up: [[6.6, -5.4], [12, -6.8], [17, -5.8]],
    cross: [[6.8, 0], [12, -1.8], [17, -4]],
    worried: [[6.8, -5.8], [12, -4.4], [17, -2]],
  }[kind] ?? [[6.6, -2.4], [12, -3.6], [17, -3]];
  const B = [];
  for (const sx of [-1, 1]) B.push(...band(curve(P.map(([x, y]) => [x * sx, y]), 3), 1.8, 1, C.hairDk, true));
  // The gold mark on her brow.
  B.push(F(T([[0, -3.6], [1.3, -1.6], [0, 0.6], [-1.3, -1.6]], C.gold)), F(E(-0.3, -2, 0.4, 0.5, C.goldLt)));
  return place(B);
}

// ---------- The drawing ----------

const J = {
  hip: [CX, 110], neck: [HX, NECK], crown: [HX, 40], hoodTip: [HX - 15, 44],
  shF: [CX - 11, 92], elF: [CX - 14, 102], wrF: [CX - 15, 111],
  shN: [CX + 12, 92], elN: [CX + 15, 102], wrN: [CX + 16, 111],
  grip: [CX + 17, 116], cens: [CX + 17, 128],
  stole: [CX + 3, 92], cape: [CX, 86],
  hem0: [CX - 18, 128], hem1: [CX - 6, 129], hem2: [CX + 6, 129], hem3: [CX + 18, 128],
  wisp: [CX + 17, 128],
};
const HANDS = new Set(['hold', 'open', 'up']);
const HEMS = [[-18, 8, 13, 2.2], [-6, 8, 15, 1.9], [6, 8, 13, 1.65], [18, 7, 10, 1.4]];

// The little wisp: a teal flame, pale at its heart, curling at the tip. (Drawn standing on (x, y).)
function wispShape(out, x, y, k = 1) {
  out.push(F(petal(x, y, -1.72, 20 * k, 13 * k, C.glowDk)), F(petal(x, y - 0.5, -1.7, 17 * k, 11 * k, C.glow)));
  out.push(F(petal(x + 0.4, y - 1, -1.66, 10 * k, 6.4 * k, C.glowLt)), F(petal(x - 1.6 * k, y - 15 * k, -2.5, 7 * k, 4.2 * k, C.glow)));
}

function acolyteShapes(v = 'idle') {
  const { G: parts, use, out } = groups();
  const faceKey = v.includes('|') ? v : `${EX[v] ? v : 'idle'}|0|${EX[v]?.gaze ?? 'd'}`;
  const [exName, blink, gaze] = faceKey.split('|');
  const ex = EX[exName] ?? EX.idle;
  const handKind = HANDS.has(v) ? v : 'hold';
  const hd = kidHead(HX, NECK, 'idle', { iris: C.iris, irisDk: C.irisDk, irisLt: C.irisLt }, 'wavylong', C.hair, 'part');

  // Her long wavy silver hair, spilling out of the hood and down her back in soft curls.
  use('hairBack');
  out.push(...hd.hang);

  // The hood's point, falling back behind her.
  use('hoodTip');
  out.push(petal(J.hoodTip[0], J.hoodTip[1], 2.55, 32, 19, C.robeSh), F(petal(J.hoodTip[0], J.hoodTip[1], 2.6, 22, 6, C.robeDk)));
  // The hood's back, round her head.
  use('hoodBack');
  out.push(blob([[HX - 27, 66], [HX - 25, 42], [HX, 32], [HX + 25, 42], [HX + 27, 66], [HX + 18, 88], [HX - 18, 88]], C.robeSh), F(blob([[HX - 22, 66], [HX - 20, 46], [HX, 38], [HX + 20, 46], [HX + 22, 66], [HX + 14, 86], [HX - 14, 86]], C.robeDk)));

  // The robe's tails, streaming away into wisps where her feet would be (each one swings).
  HEMS.forEach(([x, w, len, a], i) => {
    use(`hem${i}`);
    const [px, py] = J[`hem${i}`];
    out.push(blob([[px - w, py - 4], [px + w, py - 4], [px + w * 0.6, py + len * 0.55], [px - 2.4 + (x < 0 ? -1.4 : 1.4), py + len], [px - w * 0.9, py + len * 0.45]], i < 2 ? C.robeSh : C.robe, 2));
    out.push(...band(curve([[px - w * 0.9, py + len * 0.45], [px - 2 + (x < 0 ? -1.4 : 1.4), py + len - 1], [px + w * 0.6, py + len * 0.55]], 2), 1.6, 1.6, C.gold, true));
  });

  // The far arm: a long bell sleeve, a hand peeking out, the sleeve's drape hanging below.
  use('armFu');
  out.push(blob([[J.shF[0] - 5, J.shF[1] - 2], [J.shF[0] + 4.6, J.shF[1] - 2.6], [J.elF[0] + 4.8, J.elF[1] + 1], [J.elF[0] - 5, J.elF[1] + 1.4]], C.robeSh));
  use('armFf');
  out.push(E(J.elF[0], J.elF[1], 4.6, 4.6, C.robeSh), blob([[J.elF[0] - 4.6, J.elF[1] - 0.6], [J.elF[0] + 4.6, J.elF[1] - 0.6], [J.wrF[0] + 7.2, J.wrF[1] + 0.6], [J.wrF[0] - 7.2, J.wrF[1] + 0.6]], C.robeSh, 2));
  out.push(...band([[J.wrF[0] - 7, J.wrF[1] - 0.6], [J.wrF[0] + 7, J.wrF[1] - 0.6]], 2, 2, C.goldSh, true));
  use('cuffF');
  out.push(petal(J.wrF[0] - 3, J.wrF[1] - 1, 1.75, 12, 11, C.robeDk));
  use('handF');
  out.push(E(J.wrF[0] + 0.6, J.wrF[1] + 3.4, 4.6, 4.2, SKIN_SH), E(J.wrF[0] + 3.4, J.wrF[1] + 2, 1.8, 1.8, SKIN_SH));

  // The robe: its body flaring down to the tails, the shadow side, a lit edge, the gold hem; the
  // stole down the front with its own swing; the short capelet over her shoulders.
  use('body');
  out.push(blob([[CX - 12, 84], [CX + 13, 84], [CX + 20, 104], [CX + 25, 126], [CX + 14, 129], [CX - 14, 129], [CX - 25, 126], [CX - 20, 104]], C.robe));
  out.push(F(blob([[CX - 12, 86], [CX - 5, 86], [CX - 9, 126], [CX - 23.6, 126], [CX - 19.6, 106]], C.robeSh, 2)));
  out.push(...band(curve([[CX + 14, 90], [CX + 20.6, 108], [CX + 23, 125]], 3), 1.8, 1.8, C.robeLt, true));
  out.push(...band([[CX - 23, 125.4], [CX + 23.4, 125.4]], 2.6, 2.6, C.gold, true));
  for (const [x, y] of [[-14, 118], [-2, 114], [11, 119]]) out.push(...band(curve([[CX + x, y - 10], [CX + x - 1.4, y], [CX + x - 0.6, y + 6]], 2), 1, 0.6, C.robeSh, true));
  use('stole');
  out.push(blob([[CX + 0, 92], [CX + 6, 92], [CX + 7.4, 130], [CX + 3.6, 135], [CX - 0.4, 130]], C.gold, 2), F(blob([[CX + 0, 92], [CX + 2.4, 92], [CX + 1.4, 131], [CX - 0.4, 130]], C.goldSh, 1)));
  out.push(F(T([[CX + 3.4, 106], [CX + 5.8, 110], [CX + 3.4, 114.4], [CX + 1, 110]], C.robeDk)), F(E(CX + 3.4, 110, 0.9, 1, C.glow)));
  use('cape');
  out.push(blob([[CX - 17, 84], [CX + 18, 84], [CX + 24, 97], [CX + 12, 100.6], [CX + 2, 102], [CX - 9, 100.6], [CX - 21, 97]], C.robeLt));
  out.push(F(blob([[CX - 17, 85], [CX - 8, 85], [CX - 9, 100.4], [CX - 21, 96.6]], C.robe, 2)));
  out.push(...band(curve([[CX - 21, 96.6], [CX - 9, 100.4], [CX + 2, 101.6], [CX + 12, 100.4], [CX + 24, 96.6]], 3), 2, 2, C.gold, true));

  use('head');
  out.push(...acFace(ex, Number(blink), GAZE[gaze] ?? GAZE.c, hd.shade));
  use('fringe');
  out.push(...hd.bangs);
  use('brows');
  out.push(...acBrows(ex.b));
  // The hood's rim round her face, trimmed in gold.
  use('hoodRim');
  const rim = curve([[HX - 23, 84], [HX - 25.4, 62], [HX - 15, 46], [HX, 42.4], [HX + 15, 46], [HX + 25.4, 62], [HX + 23, 84]], 4);
  out.push(...band(rim, 8.6, 8.6, C.robe));
  out.push(...band(curve([[HX - 20.6, 80], [HX - 21.6, 62], [HX - 12.6, 48.6], [HX, 45.8], [HX + 12.6, 48.6], [HX + 21.6, 62], [HX + 20.6, 80]], 4), 1.5, 1.5, C.gold, true));
  out.push(...band(curve([[HX - 19, 51], [HX - 10, 43.4], [HX + 3, 40.6]], 3), 1.5, 1.1, C.robeLt, true));

  // The near arm: sleeve, drape, hand (holding the chain, open, or raised), then the censer on
  // its chain, and the wisp in it.
  use('armNu');
  out.push(blob([[J.shN[0] - 4.6, J.shN[1] - 2.6], [J.shN[0] + 5, J.shN[1] - 2], [J.elN[0] + 5, J.elN[1] + 1.4], [J.elN[0] - 4.8, J.elN[1] + 1]], C.robe));
  use('armNf');
  out.push(E(J.elN[0], J.elN[1], 4.6, 4.6, C.robe), blob([[J.elN[0] - 4.6, J.elN[1] - 0.6], [J.elN[0] + 4.6, J.elN[1] - 0.6], [J.wrN[0] + 7.2, J.wrN[1] + 0.6], [J.wrN[0] - 7.2, J.wrN[1] + 0.6]], C.robe, 2));
  out.push(F(blob([[J.elN[0] - 4.6, J.elN[1]], [J.elN[0] - 1, J.elN[1]], [J.wrN[0] - 2, J.wrN[1]], [J.wrN[0] - 7, J.wrN[1]]], C.robeSh, 1)));
  out.push(...band([[J.wrN[0] - 7, J.wrN[1] - 0.6], [J.wrN[0] + 7, J.wrN[1] - 0.6]], 2, 2, C.gold, true));
  use('cuffN');
  out.push(petal(J.wrN[0] - 3, J.wrN[1] - 1, 1.78, 12, 11, C.robeSh), F(petal(J.wrN[0] - 3, J.wrN[1] - 1, 1.78, 7, 3, C.robeDk)));
  use('handN');
  const [hx, hy] = J.wrN;
  if (handKind === 'open') out.push(E(hx + 0.6, hy + 3.6, 4.6, 4.4, SKIN), E(hx + 4, hy + 1.6, 1.9, 1.9, SKIN), ...band([[hx - 1.6, hy + 7.2], [hx + 2.6, hy + 7.2]], 0.6, 0.6, SKIN_SH, true));
  else if (handKind === 'up') out.push(E(hx + 0.4, hy + 3.4, 4.4, 4.4, SKIN), E(hx + 3.6, hy + 4.6, 1.8, 1.8, SKIN), F(E(hx - 1, hy + 2.4, 1.6, 1.2, SKIN_SH)));
  else out.push(E(hx + 0.6, hy + 3.4, 4.6, 4.2, SKIN), E(hx + 3.6, hy + 1.8, 1.8, 1.8, SKIN), ...band(curve([[hx - 2.8, hy + 4], [hx + 0.4, hy + 5.6], [hx + 3, hy + 4.2]], 2), 0.6, 0.6, SKIN_SH, true));
  use('chain');
  for (let k = 0; k < 4; k++) out.push(E(J.grip[0], J.grip[1] + 1.6 + k * 2.8, 1, 1.4, k % 2 ? C.metalSh : C.metal));
  use('censer');
  const [cx, cy] = J.cens;
  out.push(blob([[cx - 6.6, cy + 6], [cx + 6.6, cy + 6], [cx + 4, cy + 0.6], [cx - 4, cy + 0.6]], C.goldSh, 2), E(cx, cy, 2, 2, C.gold));
  out.push(E(cx, cy + 10, 7.6, 6.4, C.gold), F(E(cx - 2, cy + 8, 3.4, 2, C.goldLt)), F(E(cx, cy + 13.6, 6, 2.2, C.goldSh)));
  for (const x of [-3.2, 0, 3.2]) out.push(F(E(cx + x, cy + 10, 1.2, 1.6, C.glow)), F(E(cx + x, cy + 9.6, 0.5, 0.7, C.glowLt)));
  out.push(blob([[cx - 3.4, cy + 15], [cx + 3.4, cy + 15], [cx + 4.6, cy + 18], [cx - 4.6, cy + 18]], C.goldSh, 2));
  // (The wisp, home in the censer: its own part, so it can flicker, and leave.)
  use('wisp');
  wispShape(out, J.wisp[0] + 0.6, J.wisp[1] + 0.4, 0.62);
  // (And the wisp out at play, bigger: only drawn on its own, for the rig's fx.)
  if (v === 'wispFree') {
    use('wispFree');
    wispShape(out, J.wisp[0], J.wisp[1], 0.9);
  }

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

// ---------- The rig ----------

const K = kidKit(AC, acolyteShapes, J, { flat: true, cel: new Set(['fringe', 'hairBack']) });
const { rel, through } = K;
const LOOP = 20;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// (A flyer is always "moving" to the game, so she works out for herself whether she's really going
// anywhere: her own speed, eased, from how far she has travelled.)
function glideOf(m, a) {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(120, Math.abs(odo - (st.acOdo ?? odo)) / dt);
  st.acOdo = odo;
  st.acV = (st.acV ?? 0) + (raw - (st.acV ?? 0)) * Math.min(1, dt * 4);
  return spring(st, '_glide', clamp((st.acV - 4) / 16, 0, 1), 30, 11, dt);
}
// Where the wisp is when it's out of the censer: [x, y] in the rig's space, or null when home.
// Out to play in her idle (a lazy loop round her head, a boop on her cheek) and out at you in an
// attack (a zip forward and back).
function wispOut(a) {
  const play = a.acPlay ?? 0;
  const zip = a.ph.since >= 0 && a.ph.since < 0.7 ? a.ph.since / 0.7 : -1;
  if (zip >= 0) {
    const out = Math.sin(Math.PI * Math.min(1, zip * 1.2));
    return { x: 6 + out * 34, y: -24 - out * 6 + Math.sin(zip * 18) * 1.4, k: 1, al: 1 };
  }
  if (play <= 0.01) return null;
  const u = a.acPlayU ?? 0;
  const ang = u * TAU * 1.6 - 1.2;
  const r = 15 * play;
  return { x: 5 + Math.cos(ang) * r, y: -36 + Math.sin(ang) * r * 0.55 - play * 4, k: 0.9 + play * 0.1, al: play };
}

export const acolyteRig = makeRig({
  w: K.BW,
  h: K.BH,
  soft: true,
  stride: 40,
  recover: 0.7,
  springs: {
    x: [90, 12], lift: [40, 9], tilt: [70, 9], head: [60, 8],
    shF: [90, 10], elF: [100, 11], shN: [110, 11], elN: [120, 12], hdN: [140, 12],
  },
  fast: ['x', 'tilt', 'shN', 'elN'],
  kick: { tilt: -240, head: 360, x: -40 },
  turnKick: { tilt: 120, head: -120, lift: -20 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 1.07;
    const glide = glideOf(m, a);
    const st = a.mo.rig;
    const atk = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const calm = spring(st, '_acCalm', glide < 0.3 && !atk && m.hp > 0 && (a.hurtAgo ?? 9) > 3 ? 1 : 0, 30, 11, a.dt);
    const lu = t % LOOP;
    const swell = Math.sin(t * 1.3);
    // Her act.
    const offer = hold(lu, 1.6, 2.6, 5, 6) * calm;
    const play = hold(lu, 7.4, 8, 11.6, 12.4) * calm;
    const boop = hold(lu, 10.6, 10.75, 11.2, 11.6) * calm;
    const doze = hold(lu, 14, 15.6, 17, 17.06) * calm;
    const startle = hold(lu, 17, 17.08, 17.4, 17.9) * calm;
    const fluster = hold(lu, 17.5, 17.8, 18.8, 19.4) * calm;
    a.acPlay = play;
    a.acPlayU = (lu - 7.4) / 4.6;
    a.acOffer = offer;
    // Her eyes follow the wisp round while it plays.
    const wa = ((a.acPlayU * TAU * 1.6 - 1.2) % TAU + TAU) % TAU;
    const follow = Math.cos(wa) > 0.4 ? 'fu' : Math.cos(wa) < -0.4 ? 'bu' : 'u';
    const actFace = offer > 0.4 ? 'pray' : boop > 0.4 ? 'happy' : play > 0.4 ? 'idle' : startle > 0.3 ? 'surprised' : fluster > 0.3 ? 'flustered' : doze > 0.3 ? (doze > 0.8 ? 'pray' : 'doze') : null;
    const actGaze = play > 0.4 ? follow : startle > 0.3 ? 'f' : fluster > 0.3 ? 'b' : null;
    const nod = doze * (1 - startle);
    const idle = {
      x: 0,
      lift: 4 + swell * 1.1 + offer * 1.2 - nod * 1.6 + startle * 2.2,
      tilt: Math.sin(t * 0.7) * 1.6 - offer * 3 + nod * 6 - startle * 4 + fluster * Math.sin(t * 7) * 1.6,
      head: Math.sin(t * 0.55) * 2.4 + 4 - offer * 12 - play * 8 + boop * 7 + nod * 22 - startle * 10 + fluster * 6,
      shF: 6 + swell * 2 + offer * 18 + play * 24 - nod * 4 + startle * 30,
      elF: 14 + offer * 10 + play * 30 + startle * 20,
      shN: -6 - swell * 2 - offer * 128 - play * 40 + nod * 4 - startle * 40,
      elN: -12 - offer * 6 - play * 70 - startle * 40,
      hdN: offer * 70 - play * 10,
    };
    // Gliding: leaning into it on a slow swell, the arms trailing a little.
    const gl = {
      x: 0.6,
      lift: 4.6 + Math.sin(t * 1.9) * 1,
      tilt: 9 + Math.sin(t * 1.9 - 0.6) * 1.4,
      head: -4 + Math.sin(t * 1.9 - 1.2) * 1.6,
      shF: 18 + Math.sin(t * 1.9) * 4,
      elF: 20,
      shN: 14 - Math.sin(t * 1.9) * 4,
      elN: -18,
      hdN: 10,
    };
    // The censer drawn back past her hip, then swung up and round at you.
    const antic = { x: -2.6, lift: 3, tilt: -10, head: -8, shF: 40, elF: 30, shN: 58, elN: -10, hdN: 20 };
    const strike = { x: 4.4, lift: 5, tilt: 12, head: 6, shF: -10, elF: 10, shN: -96, elN: -14, hdN: -20 };
    const rest = Math.max(0, 1 - a.ph.antic - a.ph.strike);
    const out = {};
    for (const k of Object.keys(idle)) out[k] = (idle[k] * (1 - glide) + gl[k] * glide) * rest + antic[k] * a.ph.antic + strike[k] * a.ph.strike;
    // After the swing, a polite little bow.
    const bow = a.ph.since > 0.35 && a.ph.since < 0.95 ? Math.sin(Math.PI * (a.ph.since - 0.35) / 0.6) : 0;
    out.tilt += bow * 14;
    out.head += bow * 10;
    if (m.hp <= 0) Object.assign(out, { lift: -2, tilt: -10, head: 14, shF: 30, elF: 10, shN: -20, elN: -10, hdN: 0 });
    out.elN = clamp(out.elN, -150, 0);
    out.elF = clamp(out.elF, -150, 150);
    // Her face: the game's mood first, then the fight, then her act; her own blink; where she looks.
    let ex = a.face === 'dead' ? 'dizzy' : a.face === 'hurt' ? 'hurt' : null;
    if (!ex && a.ph.strike > 0.15) ex = 'shout';
    else if (!ex && a.ph.antic > 0.05) ex = 'angry';
    else if (!ex && bow > 0.3) ex = 'bow';
    else if (!ex && a.face === 'angry') ex = 'angry';
    else if (!ex && a.face === 'happy') ex = 'happy';
    else if (!ex && (a.face === 'sleep' || m.habit?.kind === 'nap')) ex = 'pray';
    else if (!ex && EX[a.face] && a.face !== 'idle') ex = a.face;
    if (!ex) ex = actFace ?? 'idle';
    const P = 3.1 + (m.uid % 7) * 0.41;
    const q = (a.t + (m.uid % 5) * 0.7) % P;
    const blink = q < 0.05 ? 1 : q < 0.13 ? 2 : q < 0.2 ? 1 : 0;
    const n = Math.floor((a.t + m.uid * 0.29) / 1.7);
    const gaze = actGaze ?? (a.face === 'angry' || atk ? 'f' : ['d', 'c', 'd', 'f', 'd', 'b', 'c', 'd'][Math.floor(hash(n + m.uid) * 8)]);
    st.acFace = `${ex}|${EX[ex].e === 'open' && !atk ? blink : 0}|${gaze}`;
    a.acHand = offer > 0.3 ? 'up' : play > 0.4 || startle > 0.2 ? 'open' : 'hold';
    a.acHome = 1 - Math.max(play, a.ph.since >= 0 && a.ph.since < 0.7 ? 1 : 0);
    return out;
  },
  fx(ctx, m, a, S, matOf) {
    // Smoke curling up out of the censer (more while she offers it up); the wisp when it's out,
    // with a trail of sparkles; a burst as it shoots out at you.
    const [cx, cy] = through(matOf('censer'), 'cens', 'cens');
    const t = a.t + (m.uid % 9) * 1.07;
    const lots = 1 + (a.acOffer ?? 0) * 1.6;
    for (let i = 0; i < 3; i++) {
      const P = 2.2;
      const f = (((t + i * 0.73) % P) + P) % P / P;
      const sx = cx + Math.sin(f * 5 + i * 2) * (1 + f * 2.4);
      puff(ctx, a, sx, cy + 1 - f * 16 * lots, 1 + f * 2.6, 0.36 * Math.sin(Math.PI * f) * Math.min(1, lots), '214,200,255');
    }
    const w = wispOut(a);
    if (w) {
      const s = K.piece('wispFree', 'wispFree', true);
      const [wx, wy] = K.pv('wisp');
      ctx.save();
      ctx.globalAlpha = (a.alpha ?? 1) * w.al;
      ctx.translate(w.x, w.y);
      ctx.scale(w.k, w.k);
      blit(ctx, s, -wx, -wy, { alpha: (a.alpha ?? 1) * w.al });
      ctx.restore();
      for (let i = 0; i < 3; i++) sparkle(ctx, a, w.x - 3 - i * 3 + Math.sin(t * 6 + i) * 1.2, w.y - 2 + Math.cos(t * 5 + i) * 1.6, 1.1 - i * 0.25, w.al * (0.9 - i * 0.25), '#e6fffb');
    }
    if (a.ph.since >= 0 && a.ph.since < 0.35) {
      const u = a.ph.since / 0.35;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * TAU + 0.3;
        sparkle(ctx, a, 30 + Math.cos(ang) * (4 + u * 10), -28 + Math.sin(ang) * (3 + u * 8), 1.6 * (1 - u), 1 - u, i % 2 ? '#8eeee2' : '#ffffff');
      }
    }
    if (m.hp <= 0) {
      const [hx, hy] = through(matOf('head'), 'crown', 'neck');
      for (let i = 0; i < 3; i++) {
        const ang = a.t * 3 + (i * TAU) / 3;
        sparkle(ctx, a, hx + Math.cos(ang) * 6, hy - 2 + Math.sin(ang) * 1.8, 1.4, 0.9, '#c8f0ff');
      }
    }
  },
  parts: twoPass([
    K.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel('hip')[0] + S.x, rel('hip')[1] - S.lift], rot: (S) => S.tilt * D2R }),
    K.layer('hairBack', { parent: 'head', pivot: 'neck', from: 'neck', soft: { ...SOFT.HAIR, k: 60, max: 10, gain: 0.35, hang: 0.6 } }),
    K.layer('hoodTip', { parent: 'head', pivot: 'hoodTip', from: 'neck', soft: { ...SOFT.HOOD, k: 60, max: 22 } }),
    K.layer('hoodBack', { parent: 'head', pivot: 'neck', from: 'neck' }),
    ...HEMS.map((h, i) => K.layer(`hem${i}`, { parent: 'torso', pivot: `hem${i}`, from: 'hip', soft: { ...SOFT.CLOTH, k: 70 - i * 6, c: 5, gain: 0.7, hang: 0.5, max: 26, flutter: 4, hz: 0.6 + i * 0.13 } })),
    K.layer('armFu', { parent: 'torso', pivot: 'shF', from: 'hip', rot: (S) => S.shF * D2R }),
    K.layer('armFf', { parent: 'armFu', pivot: 'elF', rot: (S) => S.elF * D2R }),
    K.layer('cuffF', { parent: 'armFf', pivot: 'wrF', soft: { ...SOFT.CLOTH, k: 80, hang: 0.85, max: 60, gain: 0.5 } }),
    K.layer('handF', { parent: 'armFf', pivot: 'wrF' }),
    K.layer('body', { parent: 'torso', pivot: 'hip' }),
    K.layer('stole', { parent: 'torso', pivot: 'stole', from: 'hip', soft: { ...SOFT.CLOTH, k: 85, hang: 0.6, max: 18 } }),
    K.layer('cape', { parent: 'torso', pivot: 'cape', from: 'hip', soft: { ...SOFT.CLOTH, k: 120, max: 8, gain: 0.3 } }),
    { ...K.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R }), s: (a, S, b) => K.piece('head', a.mo.rig?.acFace ?? 'idle|0|d', b) },
    K.layer('fringe', { parent: 'head', pivot: 'crown', from: 'neck', soft: SOFT.FRINGE }),
    { ...K.layer('brows', { parent: 'head', pivot: 'neck', from: 'neck' }), s: (a, S, b) => K.piece('brows', (a.mo.rig?.acFace ?? 'idle').split('|')[0], b) },
    K.layer('hoodRim', { parent: 'head', pivot: 'neck', from: 'neck' }),
    K.layer('armNu', { parent: 'torso', pivot: 'shN', from: 'hip', rot: (S) => S.shN * D2R }),
    K.layer('armNf', { parent: 'armNu', pivot: 'elN', rot: (S) => S.elN * D2R }),
    K.layer('cuffN', { parent: 'armNf', pivot: 'wrN', soft: { ...SOFT.CLOTH, k: 78, hang: 0.85, max: 60, gain: 0.5 } }),
    { ...K.layer('handN', { parent: 'armNf', pivot: 'wrN', rot: (S) => S.hdN * D2R }), s: (a, S, b) => K.piece('handN', a.acHand ?? 'hold', b) },
    // The chain hangs from her hand and the censer from the chain: a real double pendulum, hanging
    // straight down however her arm turns, swinging with every move.
    K.layer('chain', { parent: 'handN', pivot: 'grip', from: 'wrN', soft: { k: 55, c: 6, gain: 0.8, turn: 0.95, hang: 1, max: 175 } }),
    K.layer('censer', { parent: 'chain', pivot: 'cens', soft: { k: 70, c: 6.6, gain: 0.6, turn: 0.9, hang: 1, max: 175 } }),
    { ...K.layer('wisp', { parent: 'censer', pivot: 'wisp', soft: { ...SOFT.PETAL, k: 90, hang: 1, max: 60, flutter: 8, hz: 1.7 } }), alpha: (a) => a.acHome ?? 1 },
  ]),
});

// (The wisp out of its censer, drawn by the rig's fx at its own place.)
export const acolyteStill = K.still;
export { acolyteShapes };
