// Monster art: the Candy Volcano's sweets-folk (the levels 35-40 group dungeon, 2026-11, see
// docs/design/candy-volcano.md), on the gummy rig (gummyrig.js: every move a bounce that overshoots
// and settles, the jiggle running out through hair, ears and props).
//   gummybear     Gummy Bear Brawler: a gummy-bear hood, see-through jelly gloves; bouncy hop-punches.
//   cottoncandy   Cotton Candy Fairy: a cloud of spun-sugar hair, sugar-glass wings; a puff of floss.
//   lollipopwitch Lollipop Witch: a swirl lollipop staff, a striped hat; a spiral of sugar.
//   peppermint    Peppermint Spinner: a peppermint-swirl skirt that turns; a twirling slash.
//   chocoknight   Chocolate Knight Girl: chocolate-bar armour, a foil-wrapper cape; a heavy slam.
//   jellyninja    Jelly Bean Ninja: jelly bean colours, a candy scarf; throws a spread of shuriken.
// All face right, feet at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { RW, RH, poseAt, solve, plant, limb3, drawRig } from './manorrig.js';
import { armPart, legPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT } from './manor.js';
import { bounce, jiggle } from './gummyrig.js';

const { within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, TAU } = KIT;

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
// Keys, then the bounce: walking hops, idling bobs.
function keyed(pose, f, mood, K, hop = 4) {
  if (mood === 'dead') return { P: K.dead, u: 0 };
  const n = frames(pose);
  let P;
  if (pose === 'walk') P = poseAt(K.walk, f, 8);
  else if (pose === 'attack') P = poseAt(K.attack, f, 3, false);
  else P = poseAt(K.idle, f, 6);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.22, tilt: -0.3, hip: [P.hip[0] - 1.5, P.hip[1]] };
  const u = (f / n) % 1;
  if (pose !== 'attack') P = { ...P, hip: [P.hip[0], P.hip[1] + bounce(pose === 'walk' ? (u * 2) % 1 : u, pose === 'walk' ? hop : hop * 0.25)] };
  return { P, u };
}
const NOLEGS = [[0, 0], [0, 0]];
// A candy-stripe band along pts, alternating two colours.
function stripes(pts, w, a, b) {
  const sp = KIT.spline(pts, 4);
  const out = [];
  for (let i = 0; i < sp.length - 1; i++) out.push(fband([sp[i], sp[i + 1]], w, i % 2 ? a : b, 1));
  return out;
}

// ---------- Gummy Bear Brawler ----------

const GB = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#ff6a6a', hairDk: '#d84a4a', hairLt: '#ffb0a8',
  gummy: '#ff5a6a', gummyDk: '#d83a4a', gummyLt: '#ffb0b8', glove: '#9ae66a', gloveDk: '#5ab83a', gloveLt: '#e0ffc8',
  top: '#ffd36b', topDk: '#e0a82a', short: '#5a6ad8', shoe: '#ffffff', shoeDk: '#e0dcec',
});
const GB_FACE = { skin: GB.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ff8a9a', lip: '#e0505e', lipLine: '#a8303e', eye: eyes('#ff6a6a', '#a81a2a', '#ffd8d8', { rx: 3.4, ry: 3, tilt: 0.15 }), brow: { c: '#d84a4a', kind: 'straight', w: 1 }, moods: { idle: { open: 0.95, mouth: 'grin' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
const GB_K = {
  // A boxer's bounce: up on the toes, fists up, hopping forward.
  walk: [
    { hip: [36, 46], lean: 0.1, tilt: 0.04, arms: [[0.3, -2.2], [0.6, -2.3]], legs: [[-0.3, 0.3], [0.4, 0.3]] },
    { hip: [36, 46], lean: 0.06, tilt: -0.04, arms: [[0.2, -2.3], [0.5, -2.4]], legs: [[-0.1, 1.2], [0.3, 1]] },
  ],
  idle: [
    { hip: [36, 46], lean: 0.04, tilt: 0.06, arms: [[0.3, -2.2], [0.6, -2.3]], legs: [[-0.25, 0.2], [0.3, 0.15]] },
    { hip: [36, 46], lean: 0.06, tilt: -0.06, arms: [[0.4, -2.1], [0.5, -2.4]], legs: [[-0.25, 0.2], [0.3, 0.15]] },
    { hip: [36, 46], lean: 0.04, tilt: 0.08, arms: [[0.3, -2.2], [0.7, -2.2]], legs: [[-0.25, 0.2], [0.3, 0.15]] },
  ],
  attack: [
    { hip: [34, 47], lean: -0.1, tilt: -0.1, arms: [[0.4, -2.2], [-0.4, -2.2]], legs: [[-0.4, 0.4], [0.4, 0.4]] },
    { hip: [41, 44], lean: 0.3, tilt: 0.12, arms: [[0.2, -2.3], [1.6, -0.1]], legs: [[-0.7, 0.4], [0.4, 0.9]], punch: 1 },
    { hip: [41, 45], lean: 0.26, tilt: 0.1, arms: [[0.2, -2.3], [1.6, 0]], legs: [[-0.6, 0.3], [0.5, 0.3]], punch: 1 },
    { hip: [37, 46], lean: 0.04, tilt: 0.06, arms: [[0.3, -2.2], [0.6, -2.3]], legs: [[-0.25, 0.2], [0.3, 0.15]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function jellyGlove(A, C, back) {
  const [x, y] = A.hand;
  return [...ooval(x, y, 3.6, 3.2, back ? C.gloveDk : C.glove), ...ooval(x - 1, y - 1, 1.4, 1.1, C.gloveLt, 0, 0.2), line([[x - 2.4, y + 1.6], [x + 2, y + 1.6]], 0.4, C.gloveDk)];
}

function gummybear(pose, f, mood) {
  const C = fade(GB, mood);
  const { P, u } = keyed(pose, f, mood, GB_K, 5);
  const S = plant(solve(P), 77.4 + Math.min(0, bounce(pose === 'walk' ? (u * 2) % 1 : u, 5)));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#6a1a1a');
  const jig = jiggle(pose === 'walk' ? (u * 2) % 1 : u, 0.5);
  const shapes = drawRig(S, {
    backArm: () => [...armPart(S.arms[0], C.gummyDk, C.gummyDk), ...jellyGlove(S.arms[0], C, true)],
    backLeg: () => legPart(S.legs[0], C.gummyDk, C.shoeDk),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 4.4, hy - 1.4], [hx + 4.4, hy - 1.4], [hx + 5, hy + 3.4], [hx - 5, hy + 3.4]], 1), C.short)];
      out.push(line([[hx - 4.6, hy - 1], [hx + 4.6, hy - 1]], 1.2, '#ffffff'));
      out.push(...bodice(S, C.top, C.topDk));
      const [cx, cy] = S.chest;
      out.push(...ooval(cx + 0.4, cy + 3, 2.4, 2.2, C.gummy), ...ooval(cx - 0.4, cy + 2.4, 0.8, 0.7, C.gummyLt, 0, 0.2));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.gummy, C.shoe),
    head: () => headPart(S, mood, GB_FACE, SWEPT, HR, 1.12, () => backHair(HR, 5), () => {
      // The gummy-bear hood: glossy red jelly, round ears that jiggle a beat behind every hop.
      const out = [...opoly(round([[-8.4, 3], [-8.6, -4.6], [-4, -10], [3.4, -10.4], [8.4, -6], [8.8, 0], [6.6, -2], [6, -6.6], [1.6, -8.2], [-3.4, -7.6], [-6.6, -3.4], [-6.6, 3]], 2), C.gummy)];
      out.push(fband(arcPts(-1, -6, 5, 3.4, 200, 280, 6), 1.1, C.gummyLt, 1));
      for (const [x, y] of [[-6, -10], [5, -10.6]]) {
        const jx = Math.sin(jig) * 1.6;
        out.push(...ooval(x + jx, y + Math.abs(jx) * 0.3, 3.2, 3.2, C.gummy), ...ooval(x + jx - 0.8, y - 0.8, 1.1, 1, C.gummyLt, 0, 0.2));
      }
      return out;
    }),
    frontArm: () => {
      const out = [...armPart(S.arms[1], C.gummy, C.gummy), ...jellyGlove(S.arms[1], C, false)];
      if (P.punch > 0.5) {
        const [x, y] = S.arms[1].hand;
        out.push(sparkle(x + 7, y, 3.4, '#ffffff'), ...[0, 1, 2].map((k) => fband(arcPts(x + 4, y, 4 + k * 3, 3 + k * 2, -60, 60, 6), 0.6, mix(C.glove, '#ffffff', 0.4), 1)));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Cotton Candy Fairy ----------

const CF = soften({
  skin: '#fff4f8', skinDk: '#f2dce6', hair: '#ffb3e0', hair2: '#b3d8ff', hairDk: '#e080b8', hairLt: '#ffffff',
  dress: '#ffffff', dressDk: '#f0e0ec', wing: '#e6f6ff', wingDk: '#a8d8f0', stick: '#fff4dc', sprinkle: ['#ff7aa8', '#7fd8ff', '#ffd36b', '#9ae6a8'],
});
const CF_FACE = { skin: CF.skin, skinSh: '#f2dce6', skinSh2: '#dcb8c8', blush: '#ffa8d0', lip: '#e0608e', lipLine: '#a83a68', eye: eyes('#7fb8ff', '#2a5aa8', '#e0f0ff', { rx: 3.6, ry: 3.3 }), brow: { c: '#e080b8', kind: 'soft', w: 0.5 }, moods: { idle: { open: 0.85, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const CF_K = {
  walk: [{ hip: [36, 42], lean: 0.12, tilt: 0.08, arms: [[0.6, -1], [1, -1.4]], legs: [[0.4, 0.8], [0.1, 0.5]] }, { hip: [36, 42], lean: 0.1, tilt: 0.02, arms: [[0.8, -1.2], [1.2, -1.6]], legs: [[0.2, 0.6], [0.3, 0.9]] }],
  idle: [
    { hip: [36, 42], lean: 0, tilt: 0.12, arms: [[0.6, -1], [0.9, -1.8]], legs: [[0.3, 0.6], [0, 0.4]] },
    { hip: [36, 42], lean: 0, tilt: 0.18, arms: [[0.7, -1.1], [1.1, -2]], legs: [[0.4, 0.9], [0, 0.3]] },
    { hip: [36, 42], lean: 0, tilt: 0.08, arms: [[0.6, -1], [0.9, -1.8]], legs: [[0.3, 0.6], [0.1, 0.5]] },
  ],
  attack: [
    { hip: [35, 42], lean: -0.12, tilt: -0.1, arms: [[0.8, -1], [-0.8, -1.4]], legs: [[0.3, 0.6], [0, 0.4]] },
    { hip: [38, 42], lean: 0.16, tilt: 0.1, arms: [[0.4, -0.6], [1.7, -0.2]], legs: [[0.3, 0.6], [0, 0.4]], puff: 1 },
    { hip: [38, 42], lean: 0.14, tilt: 0.08, arms: [[0.4, -0.6], [1.8, -0.1]], legs: [[0.3, 0.6], [0, 0.4]], puff: 1 },
    { hip: [36, 42], lean: 0, tilt: 0.1, arms: [[0.6, -1], [0.9, -1.8]], legs: [[0.3, 0.6], [0, 0.4]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function floss(cx, cy, w, h, C, ph, n = 10) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    out.push(...ooval(cx + Math.cos(a) * w * 0.6 + Math.sin(ph + i) * 0.6, cy + Math.sin(a) * h * 0.6, w * 0.45, h * 0.45, i % 2 ? C.hair : C.hair2, a, 0.25));
  }
  out.push(...ooval(cx, cy, w * 0.6, h * 0.6, C.hair, 0, 0.25));
  return out;
}

function cottoncandy(pose, f, mood) {
  const C = fade(CF, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const { P, u } = keyed(pose, f, mood, CF_K, 3);
  const S = mood === 'dead' ? plant(solve(P)) : solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a2a6a');
  const jig = jiggle(u, 0.3);
  const shapes = drawRig(S, {
    behind: () => {
      // Sugar-glass wings, sparkling; the cloud of spun-sugar hair puffing behind her head.
      const [cx, cy] = S.chest;
      const beat = Math.sin(ph * 2) * 0.2;
      const out = [];
      for (const [s, c] of [[0, C.wingDk], [1, C.wing]]) {
        within(at(cx - 3 - s, cy, -0.5 - beat - s * 0.2), () => {
          out.push(...opoly(round([[0, 0], [-6, -10], [-13, -9], [-10, -2], [-3, 2]], 3), c, 0.3), ...opoly(round([[0, 2], [-8, 4], [-10, 9], [-3, 7]], 2), c, 0.3));
        });
      }
      out.push(...floss(S.head[0] - 6, S.head[1] - 6 + Math.sin(jig) * 1.4, 14, 14, C, ph));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk, 0.9),
    backLeg: () => legPart(S.legs[0], C.skinDk, C.hair, 0.85),
    body: () => {
      const g = gown(S, 8, 7, C.dress, C.dressDk, Math.sin(ph) * 0.8);
      const out = [...g.out, ...bodice(S, C.dress, C.dressDk)];
      const [hx, hy] = S.hip;
      for (let k = 0; k < 8; k++) out.push(...opoly([[hx - 5 + k * 1.6, hy + 2 + (k % 3) * 2], [hx - 4 + k * 1.6, hy + 2.4 + (k % 3) * 2], [hx - 4.2 + k * 1.6, hy + 3 + (k % 3) * 2]], C.sprinkle[k % 4], 0.2));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.skin, C.hair2, 0.85),
    head: () => headPart(S, mood, CF_FACE, BANGS, HR, 1.14, () => [], () => floss(-2, -7 + Math.sin(jig) * 1.4, 10, 7, C, ph, 8)),
    frontArm: () => {
      const A = S.arms[1];
      // A paper cone of cotton candy held up like a wand.
      const a = A.a - Math.PI / 2 - 0.5;
      const top = [A.hand[0] + Math.cos(a) * 7, A.hand[1] + Math.sin(a) * 7];
      const out = [...oband([A.hand, top], taperW(0.8, 1.6), C.stick, 1, 0.3), ...floss(top[0] + Math.cos(a) * 3, top[1] + Math.sin(a) * 3, 5, 5, C, ph, 6), ...armPart(A, C.dress, C.skin, 0.9)];
      if (P.puff > 0.5) out.push(...floss(A.hand[0] + 14 * (f === 1 ? 1 : 1.5), A.hand[1] - 1, 8, 6, C, ph * 2, 8), sparkle(A.hand[0] + 20, A.hand[1] - 6, 2.4, '#ffffff'));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Lollipop Witch ----------

const LW = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#9a6ae0', hairDk: '#6a3ab8', hairLt: '#d0b8ff',
  dress: '#ff7aa8', dressDk: '#e0507e', stripe: '#ffffff', hat: '#ff7aa8', candy: ['#ff5a6a', '#ffd36b', '#7fd8ff', '#9ae66a'], stick: '#ffffff', stickDk: '#e0dcec',
  sock: '#ffffff', sockStripe: '#9a6ae0', shoe: '#5a3a8a',
});
const LW_FACE = { skin: LW.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ffa0c0', lip: '#e0507e', lipLine: '#a8305e', eye: eyes('#9a6ae0', '#4a1a8a', '#ecdcff', { tilt: 0.2, ry: 2.7, flicks: 3 }), brow: { c: '#6a3ab8', kind: 'arched', w: 0.7 }, moods: { idle: { open: 0.8, mouth: 'smirk' }, angry: { mouth: 'grin' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
const LW_K = {
  walk: [
    { hip: [36, 46], lean: 0.04, tilt: 0.06, arms: [[0.4, -0.6], [0.4, -1.6]], legs: [[-0.4, 0.3], [0.4, 0.05]] },
    { hip: [36, 46], lean: 0.04, tilt: -0.04, arms: [[0, -0.6], [0.4, -1.6]], legs: [[0.4, 0.05], [-0.4, 0.3]] },
  ],
  idle: [
    { hip: [36, 46], lean: -0.03, tilt: 0.1, arms: [[0.2, -0.6], [0.4, -1.6]], legs: [[-0.15, 0], [0.2, 0.05]] },
    { hip: [36, 46], lean: -0.03, tilt: -0.06, arms: [[0.2, -0.6], [0.6, -1.8]], legs: [[-0.15, 0], [0.2, 0.05]] },
    { hip: [36, 46], lean: -0.03, tilt: 0.14, arms: [[1.4, -0.6], [0.4, -1.6]], legs: [[-0.15, 0], [0.2, 0.05]] },
  ],
  attack: [
    { hip: [35, 46], lean: -0.12, tilt: -0.1, arms: [[0.6, -0.6], [-0.6, -2]], legs: [[-0.3, 0.1], [0.3, 0.05]] },
    { hip: [38, 46], lean: 0.18, tilt: 0.1, arms: [[0.2, -0.4], [1.6, -0.3]], legs: [[-0.4, 0.1], [0.4, 0.05]], spiral: 1 },
    { hip: [38, 46], lean: 0.14, tilt: 0.08, arms: [[0.2, -0.4], [1.7, -0.2]], legs: [[-0.4, 0.1], [0.4, 0.05]], spiral: 1 },
    { hip: [36, 46], lean: 0, tilt: 0.1, arms: [[0.2, -0.6], [0.4, -1.6]], legs: [[-0.15, 0], [0.2, 0.05]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function swirl(cx, cy, r, turn, cols) {
  const out = [...ooval(cx, cy, r, r, cols[0])];
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const a = turn + k * ((TAU / 3)) + t * 4.4;
      pts.push([cx + Math.cos(a) * r * t * 0.92, cy + Math.sin(a) * r * t * 0.92]);
    }
    out.push(fband(pts, (t) => 0.6 + t * 0.9, cols[k + 1], 1));
  }
  out.push(dot(cx - r * 0.4, cy - r * 0.45, r * 0.18, '#ffffff'));
  return out;
}

function lollipopwitch(pose, f, mood) {
  const C = fade(LW, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const { P, u } = keyed(pose, f, mood, LW_K, 3);
  const S = plant(solve(P), 77.4 + Math.min(0, bounce(pose === 'walk' ? (u * 2) % 1 : u, 3)));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#2a0a4a');
  const jig = jiggle(pose === 'walk' ? (u * 2) % 1 : u, 0.4);
  const A = S.arms[1];
  const stockLeg = (L, back) => {
    const out = [...limb3(L.hip, L.kn, L.ft, 2.8, 2.4, 2, back ? C.stickDk : C.sock)];
    for (let k = 1; k < 4; k++) out.push(line([[lerp(L.kn[0], L.ft[0], k / 4) - 1.4, lerp(L.kn[1], L.ft[1], k / 4)], [lerp(L.kn[0], L.ft[0], k / 4) + 1.4, lerp(L.kn[1], L.ft[1], k / 4) - 0.4]], 0.8, C.sockStripe));
    out.push(...opoly(round([[L.ft[0] - 1.6, L.ft[1] - 1.6], [L.ft[0] + 2, L.ft[1] - 1.8], [L.ft[0] + 4.4, L.ft[1] - 2.8], [L.ft[0] + 3.6, L.ft[1] + 0.8], [L.ft[0] - 1.8, L.ft[1] + 0.8]], 1), C.shoe));
    return out;
  };
  const shapes = drawRig(S, {
    backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk),
    backLeg: () => stockLeg(S.legs[0], true),
    body: () => {
      const [hx, hy] = S.hip;
      const g = gown(S, 9, 8, C.dress, C.dressDk, Math.sin(ph) * 0.8);
      const out = [...g.out];
      for (const k of [-2, 0, 2]) out.push(line([[hx + k * 1.6, hy], [hx + k * 3.2, hy + 8.4]], 1, C.stripe));
      out.push(...bodice(S, C.dress, C.dressDk));
      out.push(...swirl(S.chest[0] + 0.4, S.chest[1] + 3, 1.8, ph, [C.stripe, ...C.candy]));
      return out;
    },
    frontLeg: () => stockLeg(S.legs[1], false),
    head: () => headPart(S, mood, LW_FACE, SWEPT, HR, 1.12, () => [...backHair(HR, 7), ...[-1, 1].flatMap((s) => KIT.lockHair(KIT.flowPts([s * 6, -1], Math.PI / 2 + s * 0.3, s * 0.4, 12, ph - 0.7 + s, 0.2, 4), 3.6, HR))], () => {
      // A striped witch's hat, its tip a candy curl that bobs a beat behind.
      const out = [...opoly(round([[-11, -4.4], [11, -6], [8, -3], [-8, -2]], 2), C.dressDk)];
      const tip = [5 + jig * 6, -18];
      out.push(...oband([[-3, -5], [0, -11], tip], taperW(9, 1.6), C.hat, 4));
      out.push(...stripes([[-1.6, -7], [1, -12], [tip[0] - 1, tip[1] + 2]], 1, C.stripe, C.hat));
      out.push(...swirl(tip[0] + 1.6, tip[1] + 0.4, 2.2, ph, [C.stripe, ...C.candy]));
      return out;
    }),
    frontArm: () => {
      // The lollipop staff: a striped stick, a big swirl candy turning at its head.
      // (Held upright beside her at rest, swung forward in the spell.)
      const a = pose === 'attack' && f >= 1 ? A.a - Math.PI / 2 - 0.4 : -Math.PI / 2 + 0.25;
      const top = [A.hand[0] + Math.cos(a) * 13, A.hand[1] + Math.sin(a) * 13];
      const out = [...oband([[A.hand[0] - Math.cos(a) * 5, A.hand[1] - Math.sin(a) * 5], top], 1.2, C.stick, 1, 0.3), ...stripes([[A.hand[0] - Math.cos(a) * 5, A.hand[1] - Math.sin(a) * 5], top], 1, C.sockStripe, C.stick)];
      out.push(...swirl(top[0] + Math.cos(a) * 4, top[1] + Math.sin(a) * 4, 4.6, ph * (P.spiral ? 3 : 1), [C.stripe, ...C.candy]), ...armPart(A, C.dress, C.skin));
      if (P.spiral > 0.5) {
        const pts = [];
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          pts.push([A.hand[0] + 6 + t * 24 * (f === 1 ? 1 : 1.3), A.hand[1] + Math.sin(t * 12 + ph) * 5 * (1 - t * 0.5)]);
        }
        out.push(...stripes(pts, 2, C.candy[0], C.stripe), sparkle(pts[20][0], pts[20][1], 2.4, '#ffffff'));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Peppermint Spinner ----------

const PS = soften({
  skin: '#fff4f0', skinDk: '#f2dcd6', hair: '#ffffff', hairDk: '#e6dcec', hairLt: '#ffffff', hairAcc: '#e0304e',
  red: '#e0304e', redDk: '#a81a36', white: '#ffffff', whiteDk: '#e6e0ec', mint: '#7fe0c0', tight: '#ffffff', shoe: '#e0304e',
});
const PS_FACE = { skin: PS.skin, skinSh: '#f2dcd6', skinSh2: '#dcb4b0', blush: '#ff8a9a', lip: '#e0304e', lipLine: '#a81a36', eye: eyes('#4ac8a8', '#1a6a5a', '#d0fff0', { rx: 3.4, ry: 2.8, tilt: 0.12 }), brow: { c: '#c8bcd8', kind: 'soft', w: 0.6 }, moods: { idle: { open: 0.85, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const PS_K = {
  // She glides on one toe, turning: a clean mirror flip at each half turn.
  walk: [
    { hip: [36, 42], lean: 0.04, tilt: 0.06, arms: [[2.4, -0.4], [2.6, -0.4]], legs: [[-1.2, 0.2], [0, 0]], flip: 0 },
    { hip: [36, 42], lean: 0, tilt: 0, arms: [[1.4, -0.8], [1.4, -0.8]], legs: [[0.6, 1.8], [0, 0]], flip: 1 },
  ],
  idle: [
    { hip: [36, 42], lean: 0, tilt: 0.1, arms: [[0.8, -1.6], [0.8, -1.6]], legs: [[0.6, 1.8], [0, 0]], flip: 0 },
    { hip: [36, 42], lean: 0, tilt: 0.16, arms: [[2.6, -0.4], [2.8, -0.4]], legs: [[0.6, 1.8], [0, 0]], flip: 0 },
    { hip: [36, 42], lean: 0, tilt: 0.06, arms: [[0.8, -1.6], [0.8, -1.6]], legs: [[0.6, 1.8], [0, 0]], flip: 0 },
  ],
  attack: [
    { hip: [35, 42], lean: -0.1, tilt: -0.1, arms: [[2.4, -0.2], [2.4, -0.2]], legs: [[0.6, 1.8], [0, 0]], flip: 0 },
    { hip: [38, 42], lean: 0.1, tilt: 0.1, arms: [[1.6, 0], [1.6, 0]], legs: [[1.4, 0.2], [0, 0]], flip: 1, slash: 1 },
    { hip: [39, 42], lean: 0.14, tilt: 0.1, arms: [[1.6, 0], [1.7, 0]], legs: [[1.4, 0.2], [0, 0]], flip: 0, slash: 1 },
    { hip: [36, 42], lean: 0, tilt: 0.1, arms: [[0.8, -1.6], [0.8, -1.6]], legs: [[0.6, 1.8], [0, 0]], flip: 0 },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]], flip: 0 },
};

function peppermint(pose, f, mood) {
  const C = fade(PS, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const { P } = keyed(pose, f, mood, PS_K, 2);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a8aa8');
  const draw = () => drawRig(S, {
    backArm: () => armPart(S.arms[0], C.skinDk, C.skinDk),
    backLeg: () => [...limb3(S.legs[0].hip, S.legs[0].kn, S.legs[0].ft, 2.6, 2.2, 1.6, C.whiteDk), ...ooval(S.legs[0].ft[0], S.legs[0].ft[1], 1.6, 1.4, C.shoe, 0, 0.3)],
    body: () => {
      const [hx, hy] = S.hip;
      // The peppermint skirt: a wide disc of red and white wedges, turning as she spins.
      const out = [...ooval(hx, hy + 2, 12, 3.6, C.white)];
      for (let k = 0; k < 8; k++) {
        const a0 = ph + (k / 8) * TAU;
        if (k % 2) continue;
        const pts = [[hx, hy + 2]];
        for (let i = 0; i <= 4; i++) {
          const a = a0 + (i / 4) * (TAU / 8);
          pts.push([hx + Math.cos(a) * 12, hy + 2 + Math.sin(a) * 3.6]);
        }
        out.push(fpoly(pts, C.red));
      }
      out.push(...bodice(S, C.red, C.redDk));
      const [cx, cy] = S.chest;
      out.push(...ooval(cx, cy + 3, 1.6, 1.6, C.white), dot(cx, cy + 3, 0.7, C.red));
      return out;
    },
    frontLeg: () => [...limb3(S.legs[1].hip, S.legs[1].kn, S.legs[1].ft, 2.6, 2.2, 1.6, C.tight), ...ooval(S.legs[1].ft[0], S.legs[1].ft[1], 1.6, 1.4, C.shoe, 0, 0.3)],
    head: () => headPart(S, mood, PS_FACE, BANGS, HR, 1.12, () => backHair(HR, 7), () => [
      // Two buns, each a peppermint, and a mint leaf clip.
      ...[-6.4, 5.6].flatMap((x) => [...ooval(x, -8.6, 3.2, 3.2, C.white), ...[0, 1, 2].map((k) => fband(arcPts(x, -8.6, 2.6, 2.6, k * 120 + ph * 30, k * 120 + 60 + ph * 30, 4), 1.2, C.red, 1))]),
      ...ooval(-1, -9.6, 1.6, 0.9, C.mint, 0.4),
    ]),
    frontArm: () => {
      const out = [...armPart(S.arms[1], C.skin, C.skin)];
      if (P.slash > 0.5) out.push(fband(arcPts(S.hip[0], S.hip[1] - 4, 22, 9, 180, 540, 18), (t) => 2.4 * Math.sin(Math.PI * t), mix(C.red, '#ffffff', 0.5), 1), sparkle(S.hip[0] + 20, S.hip[1] - 6, 2.4, '#ffffff'));
      return out;
    },
  });
  const shapes = P.flip > 0.5 ? within((x, y) => [72 - x, y], draw) : draw();
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Chocolate Knight Girl ----------

const CK = soften({
  skin: '#ffe6d6', skinDk: '#f2c8b0', hair: '#ffe0a0', hairDk: '#e8b860', hairLt: '#fff6dc',
  choc: '#8a5a3a', chocDk: '#5a3a2a', chocLt: '#b8885a', white: '#fff4e0', foil: '#ffd36b', foilDk: '#c8902a', foilLt: '#fff2b0', blade: '#fff0f4', bladeDk: '#e0b8c8',
});
const CK_FACE = { skin: CK.skin, skinSh: '#f2c8b0', skinSh2: '#d8a890', blush: '#ff9a8a', lip: '#d8505e', lipLine: '#a8303e', eye: eyes('#8a5a3a', '#3a1a0a', '#e6c8a8', { tilt: 0.25, ry: 2.5 }), brow: { c: '#c8904a', kind: 'straight', w: 0.9 }, moods: { idle: { open: 0.88, mouth: 'smirk' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const CK_K = {
  walk: [
    { hip: [36, 46], lean: 0.03, tilt: 0.02, arms: [[0.4, -0.8], [-0.2, -1.4]], legs: [[-0.45, 0.2], [0.45, 0.05]] },
    { hip: [36, 46], lean: 0.03, tilt: -0.02, arms: [[-0.2, -0.8], [0.4, -1.4]], legs: [[0.45, 0.05], [-0.45, 0.2]] },
  ],
  idle: [
    { hip: [36, 46], lean: -0.02, tilt: -0.04, arms: [[0.4, -0.9], [-0.2, -1.4]], legs: [[-0.2, 0], [0.24, 0]] },
    { hip: [36, 46], lean: -0.03, tilt: 0.04, arms: [[0.4, -0.9], [-0.1, -1.5]], legs: [[-0.2, 0], [0.24, 0]] },
    { hip: [36, 46], lean: -0.02, tilt: -0.04, arms: [[0.4, -0.9], [-0.2, -1.4]], legs: [[-0.2, 0], [0.24, 0]] },
  ],
  attack: [
    { hip: [34, 47], lean: -0.14, tilt: -0.1, arms: [[0.6, -1], [-2.2, -1]], legs: [[-0.4, 0.2], [0.4, 0.05]] },
    { hip: [39, 48], lean: 0.32, tilt: 0.14, arms: [[0.2, -0.9], [1, 0.3]], legs: [[-0.6, 0.2], [0.6, 0.2]], slam: 1 },
    { hip: [39, 48], lean: 0.3, tilt: 0.12, arms: [[0.2, -0.9], [0.8, 0.5]], legs: [[-0.6, 0.2], [0.6, 0.2]], slam: 1 },
    { hip: [36, 46], lean: 0, tilt: -0.04, arms: [[0.4, -0.9], [-0.2, -1.4]], legs: [[-0.2, 0], [0.24, 0]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function chocoknight(pose, f, mood) {
  const C = fade(CK, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const { P, u } = keyed(pose, f, mood, CK_K, 2);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a5a1a');
  const A = S.arms[1];
  const sA = A.a - Math.PI / 2 - 0.9;
  const tip = [A.hand[0] + Math.cos(sA) * 16, A.hand[1] + Math.sin(sA) * 16];
  const chocLimb = (L, back) => [...limb3(L.hip ?? L.sh, L.kn ?? L.el, L.ft ?? L.hand, 3.6, 3.2, 2.8, back ? C.chocDk : C.choc), ...ooval((L.kn ?? L.el)[0], (L.kn ?? L.el)[1], 2, 1.8, back ? C.chocDk : C.chocLt)];
  const shapes = drawRig(S, {
    behind: () => {
      // The foil-wrapper cape, crinkled gold, rippling.
      const [cx, cy] = S.chest;
      const tr = pose === 'walk' ? 1 : 0.4;
      const pts = [[cx - 3, cy - 1], [cx + 1, cy - 1], [S.hip[0] - 1, S.hip[1] + 8], [S.hip[0] - 8 - tr * 3, S.hip[1] + 7 + Math.sin(ph)]];
      const out = [...opoly(pts, C.foil)];
      for (let k = 0; k < 3; k++) out.push(line([[cx - 2 + k, cy + 2 + k * 3], [S.hip[0] - 6 - tr * 2 + k * 2, S.hip[1] + 6]], 0.4, k % 2 ? C.foilLt : C.foilDk));
      return out;
    },
    backArm: () => chocLimb(S.arms[0], true),
    backLeg: () => [...chocLimb(S.legs[0], true), ...opoly(round([[S.legs[0].ft[0] - 2, S.legs[0].ft[1] - 2.4], [S.legs[0].ft[0] + 4, S.legs[0].ft[1] - 2.4], [S.legs[0].ft[0] + 4, S.legs[0].ft[1] + 0.8], [S.legs[0].ft[0] - 2, S.legs[0].ft[1] + 0.8]], 1), C.chocDk)],
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 5, hy - 1.4], [hx + 5, hy - 1.4], [hx + 6, hy + 5], [hx - 6, hy + 5]], 1), C.choc)];
      for (const k of [-3, 0, 3]) out.push(line([[hx + k, hy - 1], [hx + k * 1.3, hy + 4.6]], 0.5, C.chocDk));
      out.push(...bodice(S, C.choc, C.chocDk));
      const [cx, cy] = S.chest;
      // The breastplate is a chocolate bar: squares scored into it, a white-chocolate heart.
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) out.push(fband([[cx - 2.8 + c * 3, cy + 2 + r * 3], [cx - 0.6 + c * 3, cy + 2 + r * 3]], 0.4, C.chocLt, 1));
      out.push(...ooval(cx + 0.2, cy + 0.6, 1.3, 1.1, C.white));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 0.6, 3.2, 2.6, C.chocLt));
      return out;
    },
    frontLeg: () => [...chocLimb(S.legs[1], false), ...opoly(round([[S.legs[1].ft[0] - 2, S.legs[1].ft[1] - 2.4], [S.legs[1].ft[0] + 4, S.legs[1].ft[1] - 2.4], [S.legs[1].ft[0] + 4, S.legs[1].ft[1] + 0.8], [S.legs[1].ft[0] - 2, S.legs[1].ft[1] + 0.8]], 1), C.choc)],
    head: () => headPart(S, mood, CK_FACE, SWEPT, HR, 1.12, () => [...backHair(HR, 6), ...KIT.lockHair(KIT.flowPts([-6, -3], Math.PI / 2 + 0.5, 0.5, 12, ph - 0.8, 0.16, 5), 4.4, HR)], () => [
      // An open helm shaped like a truffle, a curl of white chocolate on top.
      ...opoly(round([[-8, -1], [-7.6, -7], [-3, -10.6], [3.4, -10.6], [7.6, -7.4], [8.4, -3.6], [6.4, -4.6], [2.6, -7.6], [-3, -7.2], [-6.2, -3.4], [-6.2, 1]], 2), C.choc),
      ...oband([[0, -10.6], [2, -13], [-1, -14.4], [1.6, -16]], taperW(1.4, 0.6), C.white, 3, 0.3),
    ]),
    frontArm: () => {
      // A wafer sword: layered cream and biscuit.
      const out = [...oband([A.hand, tip], taperW(2.6, 1.6), C.chocLt, 1, 0.3)];
      for (let k = 1; k < 5; k++) out.push(line([[lerp(A.hand[0], tip[0], k / 5) - Math.sin(sA) * 1.2, lerp(A.hand[1], tip[1], k / 5) + Math.cos(sA) * 1.2], [lerp(A.hand[0], tip[0], k / 5) + Math.sin(sA) * 1.2, lerp(A.hand[1], tip[1], k / 5) - Math.cos(sA) * 1.2]], 0.4, C.white));
      out.push(...chocLimb(A, false), ...ooval(A.hand[0], A.hand[1], 1.8, 1.6, C.chocLt));
      if (P.slam > 0.5) {
        const x = tip[0];
        for (let r = 0; r < 2; r++) out.push(fband(arcPts(x, 77, 9 + r * 6, 3 + r * 2, 180, 360, 10), 1, C.chocLt, 1));
        for (let i = 0; i < 5; i++) out.push(...ooval(x + Math.cos(i * 1.3) * 8, 74 - Math.abs(Math.sin(i * 1.3)) * 7, 1.4, 1.2, C.chocDk, i, 0.3));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Jelly Bean Ninja ----------

const JN = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#3a3a5a', hairDk: '#24243e', hairLt: '#6a6a8a',
  suit: '#5a3a8a', suitDk: '#3e246a', beans: ['#ff5a6a', '#ffd36b', '#7fd8ff', '#9ae66a', '#ff9ad8', '#ffa84a'], scarf: '#ff5a6a', scarfDk: '#d83a4a', star: '#ffd36b',
});
const JN_FACE = { skin: JN.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ff9aa8', lip: '#d8505e', lipLine: '#a8303e', eye: eyes('#ff5a6a', '#8a1a2a', '#ffd8dc', { tilt: 0.35, ry: 2.3 }), brow: { c: '#24243e', kind: 'straight', w: 1 }, moods: { idle: { open: 0.9, mouth: 'smirk' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const JN_K = {
  // A low, quick ninja dash, hand back.
  walk: [
    { hip: [36, 49], lean: 0.5, tilt: 0.1, arms: [[-1.4, -0.2], [-1.2, -0.3]], legs: [[-0.8, 0.8], [0.8, 0.6]] },
    { hip: [36, 49], lean: 0.5, tilt: 0.1, arms: [[-1.4, -0.2], [-1.2, -0.3]], legs: [[0.8, 0.6], [-0.8, 0.8]] },
  ],
  idle: [
    { hip: [36, 50], lean: 0.12, tilt: 0.06, arms: [[0.6, -1.6], [0.2, -2.2]], legs: [[-0.6, 0.8], [0.6, 0.8]] },
    { hip: [36, 50], lean: 0.12, tilt: -0.04, arms: [[0.6, -1.6], [0.3, -2.3]], legs: [[-0.6, 0.8], [0.6, 0.8]] },
    { hip: [36, 50], lean: 0.12, tilt: 0.08, arms: [[0.6, -1.6], [0.2, -2.2]], legs: [[-0.6, 0.8], [0.6, 0.8]] },
  ],
  attack: [
    { hip: [35, 50], lean: 0, tilt: -0.1, arms: [[0.6, -1.6], [-1.6, -1.2]], legs: [[-0.6, 0.8], [0.6, 0.8]] },
    { hip: [38, 48], lean: 0.3, tilt: 0.1, arms: [[-0.6, -0.4], [1.7, -0.3]], legs: [[-0.8, 0.6], [0.7, 0.6]], throw: 1 },
    { hip: [38, 48], lean: 0.26, tilt: 0.08, arms: [[-0.6, -0.4], [1.8, -0.2]], legs: [[-0.8, 0.6], [0.7, 0.6]], throw: 1 },
    { hip: [36, 50], lean: 0.12, tilt: 0.06, arms: [[0.6, -1.6], [0.2, -2.2]], legs: [[-0.6, 0.8], [0.6, 0.8]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function shuriken(x, y, r, a, c) {
  return opoly(Array.from({ length: 8 }, (_, i) => {
    const rr = i % 2 ? r * 0.35 : r;
    const t = a + (i * Math.PI) / 4;
    return [x + Math.cos(t) * rr, y + Math.sin(t) * rr];
  }), c, 0.3);
}

function jellyninja(pose, f, mood) {
  const C = fade(JN, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const { P, u } = keyed(pose, f, mood, JN_K, 2);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#0a0a1a');
  const shapes = drawRig(S, {
    behind: () => {
      // The long scarf streaming behind, its ends flicking.
      const tr = pose === 'walk' ? 1 : 0.4;
      const out = [];
      for (const k of [0, 1]) out.push(...oband(KIT.flowPts([S.neck[0] - 1, S.neck[1] + 1], Math.PI + 0.1 + k * 0.3, 0.3, 14 + tr * 8 - k * 3, ph * 2 + k, 0.3, 5), taperW(2.6, 1.4), k ? C.scarfDk : C.scarf, 3));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.suitDk, C.skinDk),
    backLeg: () => legPart(S.legs[0], C.suitDk, C.suitDk),
    body: () => {
      const out = [...opoly(round([[S.hip[0] - 4.4, S.hip[1] - 1.4], [S.hip[0] + 4.4, S.hip[1] - 1.4], [S.hip[0] + 5, S.hip[1] + 3], [S.hip[0] - 5, S.hip[1] + 3]], 1), C.suit)];
      out.push(...bodice(S, C.suit, C.suitDk));
      // A belt of jelly beans and a sash.
      for (let k = 0; k < 5; k++) out.push(...ooval(S.hip[0] - 4 + k * 2, S.hip[1] - 1, 1.1, 0.7, C.beans[k], 0.3, 0.25));
      out.push(line([[S.chest[0] - 3.4, S.chest[1]], [S.hip[0] + 3.6, S.hip[1] - 1]], 1, C.scarf));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.suit, C.suitDk),
    head: () => headPart(S, mood, JN_FACE, SWEPT, HR, 1.1, () => [...backHair(HR, 5), ...KIT.lockHair(KIT.flowPts([-5, -6], Math.PI + 0.4, 0.4, 10, ph - 0.7, 0.2, 4), 3, HR)], () => [
      // A ninja headband with a jelly-bean knot whose tails flutter.
      ...oband(arcPts(0.4, -1.4, 7.6, 6.4, 200, 340, 8), 1.6, C.scarf, 2, 0.3),
      ...oband([[-7, -3], [-11, -2 + Math.sin(ph * 2) * 1.6], [-14, -4 + Math.sin(ph * 2 + 1) * 2]], taperW(1.6, 0.8), C.scarf, 3, 0.3),
      ...ooval(-7, -3.4, 1.4, 1, C.beans[1], 0.4),
    ]),
    frontArm: () => {
      const A = S.arms[1];
      const out = [...armPart(A, C.suit, C.skin)];
      if (P.throw > 0.5) {
        const k = f === 1 ? 1 : 1.6;
        for (let i = 0; i < 3; i++) out.push(...shuriken(A.hand[0] + 8 * k + i * 3, A.hand[1] - 4 + i * 4, 2.2, ph * 3 + i, C.beans[i * 2]));
      } else out.push(...shuriken(A.hand[0] + 1, A.hand[1], 1.8, ph, C.star));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

export const ART = {
  gummybear: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 230, 170], draw: gummybear },
  cottoncandy: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 240, 180], draw: cottoncandy },
  lollipopwitch: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [80, 240, 180], draw: lollipopwitch },
  peppermint: { walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [60, 220, 170], draw: peppermint },
  chocoknight: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [100, 300, 220], draw: chocoknight },
  jellyninja: { walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [60, 220, 160], draw: jellyninja },
};

export const INFO = {
  gummybear: { name: 'Gummy Bear Brawler', w: 28, h: 64 },
  cottoncandy: { name: 'Cotton Candy Fairy', w: 30, h: 64 },
  lollipopwitch: { name: 'Lollipop Witch', w: 28, h: 72 },
  peppermint: { name: 'Peppermint Spinner', w: 32, h: 64 },
  chocoknight: { name: 'Chocolate Knight Girl', w: 30, h: 66 },
  jellyninja: { name: 'Jelly Bean Ninja', w: 30, h: 58 },
};
