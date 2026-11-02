// Monster art: the Star Observatory's bosses (docs/design/star-observatory.md), on the astral rig
// drawn grand to the queens' size.
//   folio       Folio, the Archivist: an owl-ish librarian in a feathered capelet with ear tufts and
//               huge round glasses; an enormous book floats open at her side, pages turning.
//   eclipsesol  Sol, the Eclipse Twin: a sun-gold twin with a blazing halo ring behind her.
//   eclipseluna Luna, the Eclipse Twin: a moon-silver twin with a crescent behind her.
//   astraea     Astraea, the Star Keeper: a tall keeper in a gown of night sky threaded with
//               constellations, long white hair drifting, a ring of stars in orbit, a star staff.
// All face right, feet (or hem) at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { poseAt, solve, plant, limb3, drawRig } from './manorrig.js';
import { armPart, legPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT, wisp } from './manor.js';
import { orbit, drift, star5 } from './astralrig.js';

const { grand, within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, TAU } = KIT;

const NOLEGS = [[0, 0], [0, 0]];
function big(w, h, k, fn) {
  return { w, h, res: 3, shapes: grand(k, w / 2 - 36 * k, h - 0.6 - 78 * k, fn) };
}
const frames = (pose) => (pose === 'attack' ? 5 : 8);
function keyed(pose, f, mood, K, floaty = true) {
  if (mood === 'dead') return K.dead;
  let P;
  if (pose === 'walk') P = poseAt(K.walk, f, 8);
  else if (pose === 'attack') P = poseAt(K.attack, f, 4, false);
  else P = poseAt(K.idle, f, 8);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.24, tilt: -0.32, hip: [P.hip[0] - 2, P.hip[1] + 0.6] };
  if (floaty && pose !== 'attack') {
    const [dx, dy] = drift(f, frames(pose), 1, 1.2);
    P = { ...P, hip: [P.hip[0] + dx, P.hip[1] + dy] };
  }
  return P;
}
const withOrbit = (S, costume, orb) => drawRig(S, { ...costume, behind: () => [...orb.back, ...(costume.behind ? costume.behind() : [])], front: () => [...(costume.front ? costume.front() : []), ...orb.front] });

// ---------- Folio, the Archivist ----------

const FO = soften({
  skin: '#fff4ea', skinDk: '#f0dcc8', hair: '#c8a87a', hairDk: '#9a7a52', hairLt: '#f0dcb8',
  feather: '#a8886a', featherDk: '#7a5a42', featherLt: '#e6d0b0', dress: '#4a3a6a', dressDk: '#32264e', collar: '#ffffff',
  book: '#7a3a5a', bookDk: '#5a2440', page: '#fff8ec', pageDk: '#e8dcc4', gold: '#ffd36b', glass: '#dff0ff', ink: '#3a2a4a',
});
const FO_FACE = { skin: FO.skin, skinSh: '#f0dcc8', skinSh2: '#d8bca0', blush: '#ffb0a0', lip: '#c8606e', lipLine: '#8a3a4a', eye: eyes('#ffb347', '#8a4a0a', '#fff0c8', { rx: 3.9, ry: 3.8, pupil: 'round' }), brow: { c: '#9a7a52', kind: 'straight', w: 0.9 }, moods: { idle: { open: 0.8, mouth: 'calm' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'smile' } } };
const FO_K = {
  // A brisk, prim librarian's walk, finger raised for silence now and then.
  walk: [
    { hip: [36, 46], lean: 0.04, tilt: 0.04, arms: [[0.3, -0.5], [1.2, -0.9]], legs: [[-0.35, 0.15], [0.35, 0.05]], page: 0 },
    { hip: [36, 45], lean: 0.04, tilt: 0, arms: [[0.1, -0.5], [1.2, -1]], legs: [[0, 0.6], [0.05, 0.05]], page: 1 },
    { hip: [36, 46], lean: 0.04, tilt: -0.04, arms: [[-0.1, -0.5], [1.2, -0.9]], legs: [[0.35, 0.05], [-0.35, 0.15]], page: 2 },
    { hip: [36, 45], lean: 0.04, tilt: 0, arms: [[0.1, -0.5], [1.2, -1]], legs: [[0.05, 0.05], [0, 0.6]], page: 3 },
  ],
  idle: [
    { hip: [36, 46], lean: -0.03, tilt: 0.06, arms: [[0.3, -0.6], [1.2, -0.9]], legs: [[-0.15, 0], [0.2, 0.05]], page: 0 },
    { hip: [36, 45.6], lean: -0.04, tilt: -0.08, arms: [[0.3, -0.6], [0.3, -2.6]], legs: [[-0.15, 0], [0.2, 0.05]], page: 1, shush: 1 },
    { hip: [36, 46], lean: -0.03, tilt: 0.06, arms: [[0.3, -0.6], [1.2, -0.9]], legs: [[-0.15, 0], [0.2, 0.05]], page: 2 },
    { hip: [36, 45.6], lean: -0.03, tilt: 0.1, arms: [[0.3, -0.6], [1.2, -0.9]], legs: [[-0.15, 0], [0.2, 0.05]], page: 3 },
  ],
  // The great book slammed shut: a shockwave of loose pages.
  attack: [
    { hip: [35, 46], lean: -0.12, tilt: -0.1, arms: [[0.6, -1.8], [-0.6, -2]], legs: [[-0.3, 0.1], [0.3, 0.05]], page: 0, slam: 0 },
    { hip: [34, 45], lean: -0.18, tilt: -0.14, arms: [[0.4, -2.4], [-1.2, -1.6]], legs: [[-0.3, 0.1], [0.3, 0.05]], page: 0, slam: 0 },
    { hip: [39, 47], lean: 0.26, tilt: 0.12, arms: [[1.4, -0.4], [1.6, -0.2]], legs: [[-0.5, 0.2], [0.5, 0.1]], page: 0, slam: 1 },
    { hip: [39, 47], lean: 0.22, tilt: 0.1, arms: [[1.4, -0.4], [1.6, -0.2]], legs: [[-0.5, 0.2], [0.5, 0.1]], page: 0, slam: 1 },
    { hip: [37, 46], lean: 0, tilt: 0.06, arms: [[0.3, -0.6], [1.2, -0.9]], legs: [[-0.15, 0], [0.2, 0.05]], page: 0, slam: 0 },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.6, arms: [[0.1, 0.2], [0.4, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]], page: 0 },
};

function folio(pose, f, mood) {
  const C = fade(FO, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, FO_K, false);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#3a2a1a');
  const dead = mood === 'dead';
  const slam = pose === 'attack' && P.slam > 0.5;
  const bookAt = slam ? [S.arms[1].hand[0] + 8, S.arms[1].hand[1] + 6] : [S.chest[0] + 19, S.chest[1] + 9 + Math.sin(ph) * 2];
  const orb = orbit(S.chest[0], S.chest[1] + 2, 5, 15, 4, -0.1, ph * 0.6, (x, y, k, i) => [...opoly([[x - 1.6 - k, y - 1.2], [x + 1.6 + k, y - 1.6], [x + 1.4 + k, y + 1.2], [x - 1.4 - k, y + 1.4]], i % 2 ? C.page : C.pageDk, 0.3)]);
  return big(160, 140, 1.62, () => withOrbit(S, {
    behind: () => {
      // A feathered capelet falling down her back in layered rows.
      const [cx, cy] = S.chest;
      const out = [];
      for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) out.push(...ooval(cx - 6 + k * 3 - r * 0.6, cy + 1 + r * 3.6, 2.2, 3, r % 2 ? C.feather : C.featherDk, 0.2, 0.3));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk),
    backLeg: () => legPart(S.legs[0], C.dressDk, C.featherDk),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 5, hy - 1.4], [hx + 5, hy - 1.4], [hx + 7, hy + 7], [hx - 7, hy + 7]], 2), C.dress), ...bodice(S, C.dress, C.dressDk)];
      const [cx, cy] = S.chest;
      // A high white collar, a brooch shaped like an owl's face, a chain of reading keys.
      out.push(...opoly(round([[cx - 3, cy - 1.4], [cx + 3.4, cy - 1.4], [cx + 2.6, cy - 4.4], [cx - 2.2, cy - 4.4]], 1), C.collar));
      out.push(...ooval(cx + 0.4, cy + 2.4, 1.8, 1.6, C.gold), dot(cx - 0.3, cy + 2.2, 0.5, C.ink), dot(cx + 1.1, cy + 2.2, 0.5, C.ink));
      for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) out.push(...ooval(S.arms[1].sh[0] - 2 + k * 1.6, S.arms[1].sh[1] + r * 2, 1.4, 1.8, r ? C.featherLt : C.feather, 0, 0.25));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.dress, C.featherDk),
    head: () => headPart(S, mood, FO_FACE, BANGS, HR, 1.14, () => backHair(HR, 7), () => [
      // Owl ear tufts and huge round spectacles on a chain.
      ...oband([[-5, -7], [-8, -12], [-9, -15]], taperW(3, 0.6), C.feather, 3), ...oband([[2, -8], [3, -13], [2, -16]], taperW(3, 0.6), C.feather, 3),
      fband(arcPts(2.8, 3.2, 2.6, 2.6, 0, 360, 14), 0.6, C.gold, 1), fband(arcPts(9, 3.2, 2.2, 2.6, 0, 360, 14), 0.6, C.gold, 1), line([[5.4, 3], [6.8, 3]], 0.5, C.gold), fband([[0.2, 3.4], [-3, 7], [-3.6, 11]], 0.3, C.gold, 2),
    ]),
    frontArm: () => {
      const out = [];
      if (!dead) {
        // The enormous book, open, pages turning in a breeze of their own.
        const [bx, by] = bookAt;
        const open = slam ? 0.05 : 1;
        within(at(bx, by, slam ? 0.3 : -0.15), () => {
          out.push(...opoly(round([[-10 * open - 1, -7], [0, -6], [0, 7], [-10 * open - 1, 6]], 1), C.book), ...opoly(round([[0, -6], [10 * open + 1, -7], [10 * open + 1, 6], [0, 7]], 1), C.bookDk));
          if (open > 0.5) {
            out.push(fpoly([[-9, -5.6], [-0.6, -4.8], [-0.6, 5.6], [-9, 4.8]], C.page), fpoly([[0.6, -4.8], [9, -5.6], [9, 4.8], [0.6, 5.6]], C.page));
            for (let l = 0; l < 4; l++) out.push(line([[-8, -3 + l * 2.4], [-2, -2.6 + l * 2.4]], 0.3, C.pageDk), line([[2, -2.6 + l * 2.4], [8, -3 + l * 2.4]], 0.3, C.pageDk));
            const turn = ((P.page ?? 0) + f * 0.25) % 1;
            out.push(fpoly([[0, -5], [lerp(8, -8, turn), -5.4 - Math.sin(turn * Math.PI) * 3], [lerp(8, -8, turn), 5 - Math.sin(turn * Math.PI) * 3], [0, 5.6]], mix(C.page, '#ffffff', 0.4)));
          }
          out.push(...KIT.gem(0, -7.4, 1.2, C.gold));
        });
      }
      out.push(...armPart(S.arms[1], C.dress, C.skin));
      if (slam) for (let i = 0; i < 6; i++) out.push(...opoly([[bookAt[0] + 6 + i * 3, bookAt[1] - 4 + (i % 3) * 4], [bookAt[0] + 9 + i * 3, bookAt[1] - 5 + (i % 3) * 4], [bookAt[0] + 9 + i * 3, bookAt[1] - 2 + (i % 3) * 4], [bookAt[0] + 6 + i * 3, bookAt[1] - 1 + (i % 3) * 4]], C.page, 0.3)), sparkle(bookAt[0] + 14, bookAt[1], 3, '#ffffff');
      return out;
    },
  }, orb));
}

// ---------- The Eclipse Twins ----------

const SOL = soften({
  skin: '#fff0dc', skinDk: '#f2d6b0', hair: '#ffcf4a', hairDk: '#f0a020', hairLt: '#fff4c0',
  dress: '#ff9a3a', dressDk: '#e0702a', dressLt: '#ffd08a', halo: '#ffe066', haloDk: '#ffb347', gem: '#ff5a4a', trim: '#ffffff',
  mist: '#fff0c0', mistDk: '#ffd08a', mistLt: '#ffffff',
});
const LUNA = soften({
  skin: '#f0f2ff', skinDk: '#d4dcf6', hair: '#c8d4ff', hairDk: '#8a9ae0', hairLt: '#f4f6ff',
  dress: '#5a6ad8', dressDk: '#3e4ab8', dressLt: '#9aaaf0', halo: '#eef2ff', haloDk: '#b8c4f0', gem: '#7fd8ff', trim: '#ffffff',
  mist: '#dfe6ff', mistDk: '#a8b4e8', mistLt: '#ffffff',
});
const twinFace = (C, iris) => ({ skin: C.skin, skinSh: C.skinDk, skinSh2: mix(C.skinDk, '#8a7aa8', 0.3), blush: '#ffa8b8', lip: '#e0607e', lipLine: '#a83a58', eye: eyes(iris, mix(iris, '#000000', 0.5), mix(iris, '#ffffff', 0.7), { rx: 3.5, ry: 2.9, tilt: 0.15, flicks: 3, lashLen: 1.1 }), brow: { c: C.hairDk, kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.75, mouth: 'smile' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } });
const SOL_FACE = twinFace(SOL, '#ff8a2a');
const LUNA_FACE = twinFace(LUNA, '#6a8ae0');
const TWIN_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 42], lean: 0.08, tilt: 0.06 + Math.sin((i / 4) * TAU) * 0.04, arms: [[0.6, -1.2], [1.6, -1]], legs: NOLEGS })),
  idle: [
    { hip: [36, 42], lean: 0, tilt: 0.12, arms: [[0.6, -1.4], [2.4, -0.6]], legs: NOLEGS },
    { hip: [36, 41], lean: -0.04, tilt: 0.18, arms: [[1.4, -1.2], [2.6, -0.4]], legs: NOLEGS },
    { hip: [36, 42], lean: 0, tilt: 0.08, arms: [[0.6, -1.4], [2.4, -0.6]], legs: NOLEGS },
    { hip: [36, 41], lean: -0.02, tilt: 0.14, arms: [[0.8, -1.4], [2.7, -0.4]], legs: NOLEGS },
  ],
  // Arms swept up to the halo, then flung forward: a beam.
  attack: [
    { hip: [35, 42], lean: -0.1, tilt: -0.1, arms: [[2.6, -0.4], [2.8, -0.4]], legs: NOLEGS },
    { hip: [34, 41], lean: -0.16, tilt: -0.14, arms: [[3, -0.2], [3.1, -0.1]], legs: NOLEGS },
    { hip: [39, 42], lean: 0.2, tilt: 0.1, arms: [[1.4, -0.2], [1.6, -0.1]], legs: NOLEGS, beam: 1 },
    { hip: [39, 42], lean: 0.18, tilt: 0.1, arms: [[1.4, -0.2], [1.6, -0.1]], legs: NOLEGS, beam: 1 },
    { hip: [37, 42], lean: 0, tilt: 0.1, arms: [[0.6, -1.4], [2.4, -0.6]], legs: NOLEGS },
  ],
  dead: { hip: [34, 62], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS },
};

function twin(pose, f, mood, PAL, FACE, sun) {
  const C = fade(PAL, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, TWIN_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, sun ? '#8a4a0a' : '#2a3a7a');
  const dead = mood === 'dead';
  const orb = orbit(S.hip[0], S.hip[1] - 2, sun ? 3 : 2, 15, 4, sun ? 0.2 : -0.2, sun ? ph : -ph, (x, y, k) => sun ? [...ooval(x, y, 1.6 + k, 1.6 + k, C.halo), dot(x, y, 0.8 + k * 0.4, '#ffffff')] : [...ooval(x, y, 1.8 + k, 1.8 + k, C.halo), ...ooval(x + 0.8, y - 0.4, 1.4 + k * 0.8, 1.4 + k * 0.8, C.haloDk, 0, 0)]);
  return big(160, 140, 1.62, () => withOrbit(S, {
    behind: () => {
      const out = [];
      const [hx, hy] = [S.head[0] - 2, S.head[1] - 2];
      if (!dead) {
        if (sun) {
          // A blazing sun-ring behind her, its rays turning.
          out.push(fband(arcPts(hx, hy, 14, 14, 0, 360, 28), 1.6, C.haloDk, 1), fband(arcPts(hx, hy, 14, 14, 0, 360, 28), 0.8, C.halo, 1));
          for (let k = 0; k < 12; k++) {
            const a = ph * 0.3 + (k / 12) * TAU;
            out.push(...opoly([[hx + Math.cos(a - 0.08) * 15, hy + Math.sin(a - 0.08) * 15], [hx + Math.cos(a) * (19 + (k % 2) * 3), hy + Math.sin(a) * (19 + (k % 2) * 3)], [hx + Math.cos(a + 0.08) * 15, hy + Math.sin(a + 0.08) * 15]], k % 2 ? C.halo : C.haloDk, 0.3));
          }
        } else {
          // A great crescent moon behind her, faintly glowing.
          out.push(...opoly([...arcPts(hx, hy, 15, 15, 40, 320, 16), ...arcPts(hx + 6, hy - 1, 12, 12, 310, 50, 12).reverse()], C.halo, 0.4), fband(arcPts(hx, hy, 14, 14, 140, 220, 6), 0.8, C.haloDk, 1));
        }
      }
      out.push(...wisp([S.hip[0] - 1, S.hip[1] + 14], ph, pose === 'walk' ? 1 : 0.4, 12, 12, C, f, frames(pose)));
      for (const k of [0, 1]) out.push(...KIT.lockHair(KIT.flowPts([S.head[0] - 6, S.head[1] - 1 + k * 4], Math.PI / 2 + 0.3 + k * 0.2, 0.5, 20 - k * 4, ph - k * 0.6, 0.16, 5), 5 - k, HR));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk),
    body: () => {
      const g = gown(S, 14, 10, C.dress, C.dressDk, Math.sin(ph) * 0.8);
      const out = [...g.out, ...bodice(S, C.dress, C.dressDk)];
      const [hx, hy] = S.hip;
      for (let k = 0; k < 5; k++) out.push(...ooval(hx - 8 + k * 4, hy + 14, 2, 1.2, C.dressLt, 0, 0.25));
      const [cx, cy] = S.chest;
      out.push(fband(arcPts(cx, cy + 1.4, 3.6, 1.6, 195, 345, 6), 0.7, C.trim, 1), ...KIT.gem(cx + 0.4, cy + 3.4, 1.3, C.gem));
      return out;
    },
    head: () => headPart(S, mood, FACE, sun ? SWEPT : BANGS, HR, 1.14, () => backHair(HR, 9), () => sun
      ? [...opoly(round([[-6, -7], [-3, -10], [0, -12], [3, -10], [6, -7], [0, -8]], 1), C.halo), ...KIT.gem(0, -9.6, 1, C.gem)]
      : [...opoly([...arcPts(-5, -7, 3, 3, 40, 320, 8), ...arcPts(-3.8, -7.4, 2.4, 2.4, 300, 60, 6).reverse()], C.halo, 0.3), dot(3, -8, 0.7, '#ffffff'), dot(5.6, -6.6, 0.5, '#ffffff')]),
    frontArm: () => {
      const A = S.arms[1];
      const out = [...armPart(A, C.dress, C.skin)];
      if (P.beam > 0.5) {
        out.push(fband([[A.hand[0], A.hand[1]], [A.hand[0] + 34, A.hand[1] + 6]], (t) => 3.6 * Math.sin(Math.PI * Math.min(1, t * 1.6 + 0.1)) + 0.6, sun ? C.halo : C.haloDk, 1));
        out.push(fband([[A.hand[0], A.hand[1]], [A.hand[0] + 34, A.hand[1] + 6]], (t) => 1.4 * Math.sin(Math.PI * Math.min(1, t * 1.6 + 0.1)), '#ffffff', 1), sparkle(A.hand[0] + 34, A.hand[1] + 6, 3.4, '#ffffff'));
      }
      return out;
    },
  }, orb));
}
const eclipsesol = (pose, f, mood) => twin(pose, f, mood, SOL, SOL_FACE, true);
const eclipseluna = (pose, f, mood) => twin(pose, f, mood, LUNA, LUNA_FACE, false);

// ---------- Astraea, the Star Keeper ----------

const AS = soften({
  skin: '#f6f4ff', skinDk: '#dcd8f6', hair: '#f4f6ff', hairDk: '#c4cce8', hairLt: '#ffffff',
  sky: '#2a2a6a', skyDk: '#1a1a4a', skyLt: '#5a5aa8', line: '#c8d4ff', star: '#fff3a6', starHot: '#ffffff', trim: '#ffd36b', staff: '#e6ecff',
  mist: '#c8ccf4', mistDk: '#8a90d8', mistLt: '#ffffff',
});
const AS_FACE = { skin: AS.skin, skinSh: '#dcd8f6', skinSh2: '#b8b4e0', blush: '#c8b4ff', lip: '#a87ad8', lipLine: '#6a4aa8', eye: eyes('#ffd36b', '#a87a0a', '#fff6d0', { rx: 3.6, ry: 2.9, tilt: 0.12, flicks: 3, lashLen: 1.2 }), brow: { c: '#c4cce8', kind: 'soft', w: 0.6 }, moods: { idle: { open: 0.62, mouth: 'calm' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { open: 0.9, mouth: 'smile' } } };
const AS_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 42], lean: 0.06, tilt: 0.06, arms: [[0.6, -1.2], [1.3, -1.3]], legs: NOLEGS, staff: 0 })),
  idle: [
    { hip: [36, 42], lean: -0.03, tilt: 0.1, arms: [[0.6, -1.2], [1.3, -1.3]], legs: NOLEGS, staff: 0 },
    { hip: [36, 41], lean: -0.05, tilt: 0.16, arms: [[1.8, -0.8], [1.3, -1.35]], legs: NOLEGS, staff: 0 },
    { hip: [36, 42], lean: -0.03, tilt: 0.06, arms: [[0.6, -1.2], [1.3, -1.3]], legs: NOLEGS, staff: 0 },
    { hip: [36, 41], lean: -0.04, tilt: 0.12, arms: [[2.2, -0.6], [1.3, -1.35]], legs: NOLEGS, staff: 0 },
  ],
  // The staff raised to the dome, then brought down: stars fall.
  attack: [
    { hip: [35, 42], lean: -0.1, tilt: -0.14, arms: [[1, -1], [2.6, -0.4]], legs: NOLEGS, staff: 1 },
    { hip: [34, 41], lean: -0.16, tilt: -0.2, arms: [[1.2, -0.8], [3, -0.2]], legs: NOLEGS, staff: 1 },
    { hip: [39, 42], lean: 0.22, tilt: 0.12, arms: [[-0.4, -0.6], [1.4, -0.3]], legs: NOLEGS, staff: 2, fall: 1 },
    { hip: [39, 42], lean: 0.2, tilt: 0.1, arms: [[-0.4, -0.6], [1.4, -0.2]], legs: NOLEGS, staff: 2, fall: 1 },
    { hip: [37, 42], lean: 0, tilt: 0.06, arms: [[0.6, -1.2], [1.3, -1.3]], legs: NOLEGS, staff: 0 },
  ],
  // At peace: she lets the stars go, hands open, smiling.
  dead: { hip: [36, 48], lean: 0.04, tilt: 0.2, arms: [[1.6, -0.6], [1.8, -0.5]], legs: NOLEGS, staff: 0 },
};

function astraea(pose, f, mood) {
  const C = fade(AS, mood === 'dead' ? 'happy' : mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, AS_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#5a5a9a');
  const freed = mood === 'dead';
  const fmood = freed ? 'happy' : mood;
  const A = S.arms[1];
  const orb = orbit(S.chest[0], S.chest[1] - 2, 6, 18, 5, -0.15, ph * 0.5, (x, y, k, i) => star5(x, y, 1.2 + k * 1.2, i % 3 ? C.star : C.starHot, ph + i));
  return big(180, 160, 1.86, () => withOrbit(S, {
    behind: () => {
      const out = [];
      // Long white hair drifting up and back as if there were no weight up here.
      for (const [k, len, w] of [[0, 28, 6], [1, 24, 5.2], [2, 20, 4.4]]) out.push(...KIT.lockHair(KIT.flowPts([S.head[0] - 5 - k, S.head[1] - 2 + k * 3], Math.PI / 2 + 0.6 + k * 0.1, -0.5, len, ph - k * 0.7, 0.2, 6), w, HR));
      out.push(...wisp([S.hip[0] - 2, S.hip[1] + 20], ph, pose === 'walk' ? 1 : 0.4, 12, 14, C, f, frames(pose)));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.skyDk, C.skinDk),
    body: () => {
      const [hx, hy] = S.hip;
      const g = gown(S, 20, 13, C.sky, C.skyDk, Math.sin(ph) * 0.8);
      const out = [...g.out];
      // The gown is the night sky: constellations drawn across it, stars twinkling in turn.
      const cons = [[[hx - 6, hy + 6], [hx - 2, hy + 9], [hx + 1, hy + 6], [hx + 5, hy + 10]], [[hx - 8, hy + 15], [hx - 3, hy + 17], [hx + 2, hy + 15], [hx + 7, hy + 18]]];
      for (const c of cons) {
        out.push(line(c, 0.35, C.line));
        c.forEach(([x, y], i) => out.push(sparkle(x, y, 0.9 + (Math.sin(ph * 2 + i + x) > 0.4 ? 0.8 : 0), C.starHot)));
      }
      out.push(...bodice(S, C.sky, C.skyDk));
      const [cx, cy] = S.chest;
      out.push(fband(arcPts(cx, cy + 1.4, 3.8, 1.8, 195, 345, 6), 0.8, C.trim, 1), ...star5(cx + 0.4, cy + 3.6, 1.6, C.star, 0));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 3, 2.8, C.skyLt));
      return out;
    },
    head: () => headPart(S, fmood, AS_FACE, SWEPT, HR, 1.16, () => backHair(HR, 10), () => [
      // A circlet with a crescent and a single great star.
      fband(arcPts(0.4, -2, 7.4, 5.4, 205, 335, 8), 0.8, C.trim, 1),
      ...opoly([...arcPts(0, -9.4, 2.6, 2.6, 40, 320, 8), ...arcPts(1.2, -9.8, 2, 2, 300, 60, 6).reverse()], C.star, 0.3),
      ...star5(0.4, -12.6, 1.8, C.starHot, ph * 0.2),
    ]),
    frontArm: () => {
      const out = [];
      if (!freed) {
        // The star staff: a long silver staff, a star caged in a ring at its head.
        const a = P.staff === 1 ? -Math.PI / 2 - 0.1 : P.staff === 2 ? A.a - Math.PI / 2 - 0.5 : -Math.PI / 2 + 0.25;
        const top = [A.hand[0] + Math.cos(a) * 16, A.hand[1] + Math.sin(a) * 16];
        out.push(...oband([[A.hand[0] - Math.cos(a) * 10, A.hand[1] - Math.sin(a) * 10], top], 1, C.staff, 1, 0.3));
        out.push(fband(arcPts(top[0], top[1], 3.4, 3.4, 0, 360, 14), 0.6, C.trim, 1), ...star5(top[0], top[1], 2.6, C.star, ph));
        if (P.staff === 1) out.push(sparkle(top[0], top[1], 6, '#ffffff'));
      }
      out.push(...armPart(A, C.sky, C.skin));
      if (P.fall > 0.5) for (let i = 0; i < 4; i++) {
        const x = A.hand[0] + 10 + i * 7;
        const y = A.hand[1] - 10 + i * 6;
        out.push(fband([[x - 6, y - 8], [x, y]], (t) => 1.6 * t, mix(C.star, '#ffffff', 0.4), 1), ...star5(x, y, 2, C.star, i));
      }
      if (freed) for (let i = 0; i < 5; i++) out.push(...star5(S.head[0] - 16 + i * 8, S.head[1] - 16 - ((f * 2 + i * 3) % 10), 1.4, C.star, i));
      return out;
    },
  }, orb));
}

export const ART = {
  folio: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 320, 240], draw: folio },
  eclipsesol: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [110, 180, 300, 220], draw: eclipsesol },
  eclipseluna: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [110, 180, 300, 220], draw: eclipseluna },
  astraea: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [120, 180, 320, 240], draw: astraea },
};

export const INFO = {
  folio: { name: 'Folio, the Archivist', w: 54, h: 112 },
  eclipsesol: { name: 'Sol, the Eclipse Twin', w: 50, h: 112 },
  eclipseluna: { name: 'Luna, the Eclipse Twin', w: 50, h: 112 },
  astraea: { name: 'Astraea, the Star Keeper', w: 64, h: 130 },
};
