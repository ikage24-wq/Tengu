// Monster art: the Candy Volcano's bosses (docs/design/candy-volcano.md), on the gummy rig drawn
// grand to the queens' size.
//   toffee   Toffee, the Caramel Smith: a smith in a leather apron and bandana, a great hammer with
//            caramel dripping off its head; heavy, bouncing steps.
//   gretel   Gretel, the Gingerbread Knight: armour of gingerbread with icing piping, gumdrop
//            buttons, a candy-cane lance and an iced cookie shield.
//   bonbon   Queen Bonbon: a queen in a gown of layered cake, caramel dripping from each tier, a
//            candy crown with a cherry, and a great spoon for a sceptre.
// All face right, feet (or hem) at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { poseAt, solve, plant, limb3, drawRig } from './manorrig.js';
import { armPart, legPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT } from './manor.js';
import { bounce, jiggle } from './gummyrig.js';

const { grand, within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, TAU } = KIT;

function big(w, h, k, fn) {
  return { w, h, res: 3, shapes: grand(k, w / 2 - 36 * k, h - 0.6 - 78 * k, fn) };
}
const frames = (pose) => (pose === 'attack' ? 5 : 8);
function keyed(pose, f, mood, K, hop = 3) {
  if (mood === 'dead') return { P: K.dead, u: 0 };
  let P;
  if (pose === 'walk') P = poseAt(K.walk, f, 8);
  else if (pose === 'attack') P = poseAt(K.attack, f, 4, false);
  else P = poseAt(K.idle, f, 8);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.24, tilt: -0.32, hip: [P.hip[0] - 2, P.hip[1] + 0.6] };
  const u = f / frames(pose);
  if (pose !== 'attack') P = { ...P, hip: [P.hip[0], P.hip[1] + bounce(pose === 'walk' ? (u * 2) % 1 : u, pose === 'walk' ? hop : hop * 0.3)] };
  return { P, u };
}
const NOLEGS = [[0, 0], [0, 0]];
// Drips of caramel hanging under an edge (x0..x1 at y), each its own length, swelling and falling.
function drips(x0, x1, y, n, c, ph) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, (i + 0.5) / n);
    const len = 1.6 + ((i * 37) % 5) * 0.6 + Math.max(0, Math.sin(ph + i * 1.3)) * 1.2;
    out.push(...oband([[x, y - 0.4], [x, y + len]], taperW(1.2, 0.8), c, 1, 0.3), dot(x, y + len, 0.8, c));
  }
  return out;
}

// ---------- Toffee, the Caramel Smith ----------

const TF = soften({
  skin: '#ffe0c8', skinDk: '#f2c0a0', hair: '#ff8a3a', hairDk: '#d8601a', hairLt: '#ffc08a',
  apron: '#8a5a3a', apronDk: '#5a3a2a', shirt: '#fff4e0', shirtDk: '#e8d8c0', bandana: '#e0304e', boot: '#3a2a2a',
  metal: '#c8c4e0', metalDk: '#8a86a8', caramel: '#e8a040', caramelDk: '#b8701a', caramelLt: '#ffd08a', handle: '#a8784a', spark: '#ffe066',
});
const TF_FACE = { skin: TF.skin, skinSh: '#f2c0a0', skinSh2: '#d8a080', blush: '#ff8a7a', lip: '#d8504e', lipLine: '#a8302e', eye: eyes('#e8a040', '#8a4a0a', '#ffe8c0', { tilt: 0.2, ry: 2.6 }), brow: { c: '#d8601a', kind: 'straight', w: 1.1 }, moods: { idle: { open: 0.9, mouth: 'grin' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
// The hammer rides on her shoulder; her steps are heavy and bounce.
const HAM = [-0.4, -2.4];
const TF_K = {
  walk: [
    { hip: [36, 47], lean: 0.06, tilt: 0.04, arms: [[0.4, -0.6], HAM], legs: [[-0.5, 0.2], [0.5, 0.05]] },
    { hip: [36, 47], lean: 0.06, tilt: -0.04, arms: [[-0.2, -0.6], HAM], legs: [[0.5, 0.05], [-0.5, 0.2]] },
  ],
  idle: [
    { hip: [36, 47], lean: -0.02, tilt: 0.06, arms: [[0.2, -0.8], HAM], legs: [[-0.25, 0], [0.3, 0.05]] },
    { hip: [36, 47], lean: -0.03, tilt: -0.06, arms: [[0.1, -2.6], HAM], legs: [[-0.25, 0], [0.3, 0.05]] },
    { hip: [36, 47], lean: -0.02, tilt: 0.08, arms: [[0.2, -0.8], HAM], legs: [[-0.25, 0], [0.3, 0.05]] },
    { hip: [36, 47], lean: -0.02, tilt: 0.04, arms: [[0.2, -0.8], [-0.2, -2.6]], legs: [[-0.25, 0], [0.3, 0.05]] },
  ],
  // The hammer raised high behind her head, then brought down in a ground-shaking blow.
  attack: [
    { hip: [35, 47], lean: -0.14, tilt: -0.1, arms: [[0.4, -1], [-1.6, -1.6]], legs: [[-0.4, 0.2], [0.4, 0.05]], hammer: -1 },
    { hip: [34, 46], lean: -0.22, tilt: -0.16, arms: [[0.2, -1.2], [-2.6, -0.8]], legs: [[-0.4, 0.2], [0.4, 0.05]], hammer: -1.4 },
    { hip: [40, 49], lean: 0.4, tilt: 0.16, arms: [[0.8, -0.4], [1.1, 0.4]], legs: [[-0.7, 0.3], [0.6, 0.3]], hammer: 0.4, quake: 1 },
    { hip: [40, 49], lean: 0.36, tilt: 0.14, arms: [[0.8, -0.4], [1, 0.5]], legs: [[-0.7, 0.3], [0.6, 0.3]], hammer: 0.5, quake: 1 },
    { hip: [37, 47], lean: 0, tilt: 0.06, arms: [[0.2, -0.8], HAM], legs: [[-0.25, 0], [0.3, 0.05]], hammer: 0 },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.6, arms: [[0.1, 0.2], [0.4, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]], hammer: 1 },
};

function toffee(pose, f, mood) {
  const C = fade(TF, mood);
  const ph = (f / frames(pose)) * TAU;
  const { P, u } = keyed(pose, f, mood, TF_K, 3);
  const S = plant(solve(P), 77.4 + Math.min(0, bounce(pose === 'walk' ? (u * 2) % 1 : u, 3)));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#6a2a0a');
  const A = S.arms[1];
  const quake = pose === 'attack' && P.quake > 0.5;
  // The hammer: from her hand along the forearm's line (tilted by the key), a block head dripping
  // caramel.
  // (At rest it lies over her shoulder, head up behind her.)
  const hA = pose === 'attack' || mood === 'dead' ? A.a - Math.PI / 2 + (P.hammer ?? 0) * 0.6 : -Math.PI / 2 - 0.7;
  const head = [A.hand[0] + Math.cos(hA) * 14, A.hand[1] + Math.sin(hA) * 14];
  return big(160, 140, 1.62, () => drawRig(S, {
    backArm: () => armPart(S.arms[0], C.shirtDk, C.skinDk),
    backLeg: () => legPart(S.legs[0], C.apronDk, C.boot),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 4.6, hy - 1.4], [hx + 4.6, hy - 1.4], [hx + 5, hy + 4], [hx - 5, hy + 4]], 1), C.apronDk)];
      out.push(...bodice(S, C.shirt, C.shirtDk));
      const [cx, cy] = S.chest;
      // The leather apron with a pocket of tools and caramel splashes, rolled sleeves.
      out.push(...opoly(round([[cx - 3, cy + 1], [cx + 3.6, cy + 1], [hx + 5, hy + 7], [hx - 4, hy + 7]], 2), C.apron));
      out.push(...opoly([[hx - 1, hy + 1], [hx + 3, hy + 1], [hx + 3, hy + 4], [hx - 1, hy + 4]], C.apronDk), line([[hx, hy], [hx - 0.4, hy - 3]], 0.6, C.metal));
      out.push(...ooval(cx + 2, cy + 4, 1.4, 1, C.caramel, 0.3), ...ooval(hx - 2, hy + 5, 1.1, 0.8, C.caramel, -0.3));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 2.6, 2.2, C.shirt));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.apronDk, C.boot),
    head: () => headPart(S, mood, TF_FACE, SWEPT, HR, 1.12, () => [...backHair(HR, 6), ...KIT.lockHair(KIT.flowPts([-6, -4], Math.PI / 2 + 0.5, 0.4, 12, ph - 0.7 + jiggle(u, 1), 0.16, 5), 4.6, HR)], () => [
      // A red bandana tied back, its tails flicking; goggles pushed up.
      ...oband(arcPts(0.4, -1, 7.6, 6.8, 200, 340, 8), 2, C.bandana, 2, 0.3),
      ...oband([[-7, -2], [-10, 0 + Math.sin(ph * 2) * 1.4], [-12, -1]], taperW(1.6, 0.8), C.bandana, 3, 0.3),
      ...ooval(-1, -7.6, 2, 1.6, C.metal), ...ooval(3.6, -7.8, 2, 1.6, C.metal), dot(-1, -7.6, 1, '#bfe6ff'), dot(3.6, -7.8, 1, '#bfe6ff'),
    ]),
    frontArm: () => {
      const out = [...oband([[A.hand[0] - Math.cos(hA) * 3, A.hand[1] - Math.sin(hA) * 3], head], 1.6, C.handle, 1, 0.3)];
      within(at(head[0], head[1], hA + Math.PI / 2), () => {
        out.push(...opoly(round([[-6, -3.4], [6, -3.4], [6, 3.4], [-6, 3.4]], 1), C.metal), fpoly([[-6, 1.6], [6, 1.6], [6, 3.4], [-6, 3.4]], C.metalDk));
        out.push(...opoly(round([[-6.4, -3.6], [6.4, -3.6], [6.4, -1.4], [-6.4, -1.4]], 1), C.caramel), ...drips(-5.6, 5.6, -1.4, 5, C.caramel, ph));
      });
      out.push(...armPart(A, C.shirt, C.skin));
      if (quake) {
        const x = head[0];
        for (let r = 0; r < 3; r++) out.push(fband(arcPts(x, 77, 10 + r * 8, 3 + r * 2, 180, 360, 12), 1.1, r % 2 ? C.caramelLt : C.caramel, 1));
        for (let i = 0; i < 6; i++) out.push(sparkle(x + Math.cos(i) * 12, 70 - Math.abs(Math.sin(i)) * 10, 1.6, C.spark));
      }
      return out;
    },
  }));
}

// ---------- Gretel, the Gingerbread Knight ----------

const GR = soften({
  skin: '#ffe6d6', skinDk: '#f2c8b0', hair: '#ffe0a0', hairDk: '#e8b860', hairLt: '#fff6dc',
  ginger: '#c8804a', gingerDk: '#9a5a2a', gingerLt: '#e8a870', icing: '#ffffff', icingPink: '#ffb3cf', gum: ['#ff5a6a', '#9ae66a', '#7fd8ff'],
  cane: '#ffffff', caneStripe: '#e0304e', plume: '#9ae66a', plumeDk: '#5ab83a',
});
const GR_FACE = { skin: GR.skin, skinSh: '#f2c8b0', skinSh2: '#d8a890', blush: '#ff9aa0', lip: '#e0505e', lipLine: '#a8303e', eye: eyes('#5ab8e0', '#1a5a8a', '#d0f0ff', { tilt: 0.3, ry: 2.5 }), brow: { c: '#e8b860', kind: 'straight', w: 0.9 }, moods: { idle: { open: 0.88, mouth: 'smirk' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const LANCE = [0.9, -0.9];
const GR_K = {
  walk: [
    { hip: [36, 46], lean: 0.04, tilt: 0.02, arms: [[0.4, -1.2], LANCE], legs: [[-0.45, 0.2], [0.45, 0.05]] },
    { hip: [36, 46], lean: 0.04, tilt: -0.02, arms: [[0.3, -1.2], LANCE], legs: [[0.45, 0.05], [-0.45, 0.2]] },
  ],
  idle: [
    { hip: [36, 46], lean: -0.02, tilt: -0.04, arms: [[0.5, -1.3], [1.1, -0.9]], legs: [[-0.2, 0], [0.24, 0]], upright: 1 },
    { hip: [36, 46], lean: -0.03, tilt: 0.04, arms: [[0.5, -1.3], [1.15, -0.95]], legs: [[-0.2, 0], [0.24, 0]], upright: 1 },
    { hip: [36, 46], lean: -0.02, tilt: -0.04, arms: [[0.5, -1.3], [1.1, -0.9]], legs: [[-0.2, 0], [0.24, 0]], upright: 1 },
    { hip: [36, 46], lean: -0.02, tilt: 0.06, arms: [[0.6, -1.4], [1.1, -0.9]], legs: [[-0.2, 0], [0.24, 0]], upright: 1 },
  ],
  // Couched lance, a lunging charge.
  attack: [
    { hip: [33, 47], lean: -0.1, tilt: -0.1, arms: [[0.6, -1.4], [0.4, -1.2]], legs: [[-0.5, 0.3], [0.4, 0.3]] },
    { hip: [32, 48], lean: -0.12, tilt: -0.1, arms: [[0.6, -1.4], [0.6, -1.4]], legs: [[-0.5, 0.4], [0.4, 0.4]] },
    { hip: [44, 50], lean: 0.4, tilt: 0.16, arms: [[0.4, -1.4], [1.5, -0.2]], legs: [[-1, 0.2], [0.8, 0.5]], thrust: 1 },
    { hip: [44, 50], lean: 0.36, tilt: 0.14, arms: [[0.4, -1.4], [1.5, -0.1]], legs: [[-1, 0.2], [0.8, 0.5]], thrust: 1 },
    { hip: [37, 46], lean: 0, tilt: -0.04, arms: [[0.5, -1.3], LANCE], legs: [[-0.2, 0], [0.24, 0]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.6, arms: [[0.1, 0.2], [0.4, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function gretel(pose, f, mood) {
  const C = fade(GR, mood);
  const ph = (f / frames(pose)) * TAU;
  const { P, u } = keyed(pose, f, mood, GR_K, 2.4);
  const S = plant(solve(P), 77.4 + Math.min(0, bounce(pose === 'walk' ? (u * 2) % 1 : u, 2.4)));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a5a1a');
  const A = S.arms[1];
  const dead = mood === 'dead';
  const lA = P.upright ? -Math.PI / 2 + 0.4 : A.a - Math.PI / 2;
  const tip = [A.hand[0] + Math.cos(lA) * 26, A.hand[1] + Math.sin(lA) * 26];
  const gLimb = (a, b, c, back) => [...limb3(a, b, c, 3.6, 3.2, 2.8, back ? C.gingerDk : C.ginger), fband([[a[0], a[1]], [b[0], b[1]]], 0.5, C.icing, 1), ...ooval(b[0], b[1], 1.6, 1.4, C.icing, 0, 0.25)];
  return big(170, 140, 1.62, () => drawRig(S, {
    backArm: () => {
      // The iced cookie shield on her back arm.
      const B = S.arms[0];
      const out = [...gLimb(B.sh, B.el, B.hand, true)];
      const [sx, sy] = B.hand;
      out.push(...ooval(sx + 1, sy, 6, 6.4, C.ginger), fband(arcPts(sx + 1, sy, 5, 5.4, 0, 360, 20), 0.7, C.icing, 1));
      out.push(...ooval(sx + 1, sy, 2.4, 2.4, C.icingPink), ...[0, 1, 2, 3, 4].map((k) => dot(sx + 1 + Math.cos(k * 1.26) * 3.8, sy + Math.sin(k * 1.26) * 3.8, 0.6, C.gum[k % 3])));
      return out;
    },
    backLeg: () => gLimb(S.legs[0].hip, S.legs[0].kn, S.legs[0].ft, true),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 5, hy - 1.4], [hx + 5, hy - 1.4], [hx + 6, hy + 5], [hx - 6, hy + 5]], 1), C.ginger)];
      out.push(fband(arcPts(hx, hy + 4, 5.6, 1, 0, 180, 8), 0.6, C.icing, 1));
      out.push(...bodice(S, C.ginger, C.gingerDk));
      const [cx, cy] = S.chest;
      // Icing piping in squiggles and three gumdrop buttons.
      const sq = [];
      for (let i = 0; i <= 8; i++) sq.push([cx - 3.4 + i * 0.85, cy + 0.4 + (i % 2) * 0.8]);
      out.push(fband(sq, 0.5, C.icing, 1));
      for (let k = 0; k < 3; k++) out.push(...ooval(lerp(cx, hx, 0.25 + k * 0.25) + 1, lerp(cy, hy, 0.25 + k * 0.25), 1, 1.1, C.gum[k]));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 0.6, 3.2, 2.6, C.ginger), fband(arcPts(S.arms[1].sh[0], S.arms[1].sh[1] + 0.6, 3, 2.4, 10, 170, 6), 0.6, C.icing, 1));
      return out;
    },
    frontLeg: () => gLimb(S.legs[1].hip, S.legs[1].kn, S.legs[1].ft, false),
    head: () => headPart(S, mood, GR_FACE, BANGS, HR, 1.12, () => [...backHair(HR, 5), ...KIT.lockHair(KIT.flowPts([-6, -2], Math.PI / 2 + 0.4, 0.3, 14, ph - 0.7, 0.14, 5), 4, HR)], () => [
      // A gingerbread helm with icing trim and a green gumdrop plume that jiggles.
      ...opoly(round([[-8, -1], [-7.6, -7], [-3, -10.6], [3.4, -10.6], [7.6, -7.4], [8.4, -3.6], [6.4, -4.6], [2.6, -7.6], [-3, -7.2], [-6.2, -3.4], [-6.2, 1]], 2), C.ginger),
      fband(arcPts(0, -5, 7, 5, 205, 330, 8), 0.7, C.icing, 1),
      ...oband([[0, -10.6], [-2 + jiggle(u, 4), -15], [-6 + jiggle(u, 6), -17]], taperW(3, 1), C.plume, 3), ...ooval(-6 + jiggle(u, 6), -17, 1.6, 1.4, C.plumeDk),
    ]),
    frontArm: () => {
      const out = [];
      if (!dead) {
        // The candy-cane lance, striped, its crook at the grip.
        const butt = [A.hand[0] - Math.cos(lA) * 6, A.hand[1] - Math.sin(lA) * 6];
        out.push(...oband([butt, tip], taperW(2.6, 1), C.cane, 1, 0.3));
        for (let k = 0; k < 9; k++) {
          const p = [lerp(butt[0], tip[0], (k + 0.5) / 9), lerp(butt[1], tip[1], (k + 0.5) / 9)];
          out.push(line([[p[0] - Math.sin(lA) * 1.2 - Math.cos(lA) * 0.8, p[1] + Math.cos(lA) * 1.2 - Math.sin(lA) * 0.8], [p[0] + Math.sin(lA) * 1.2 + Math.cos(lA) * 0.8, p[1] - Math.cos(lA) * 1.2 + Math.sin(lA) * 0.8]], 0.9, C.caneStripe));
        }
        out.push(...oband(arcPts(butt[0] - Math.cos(lA) * 2, butt[1] - Math.sin(lA) * 2 - 2, 2.4, 2.4, 0, 200, 6), 1.4, C.cane, 2, 0.3));
      }
      out.push(...gLimb(A.sh, A.el, A.hand, false), ...ooval(A.hand[0], A.hand[1], 1.8, 1.6, C.gingerLt));
      if (pose === 'attack' && P.thrust > 0.5) out.push(fband([[A.hand[0] - 10, A.hand[1]], [tip[0] + 6, tip[1]]], (t) => 3 * Math.sin(Math.PI * t), mix(C.icingPink, '#ffffff', 0.4), 1), sparkle(tip[0] + 4, tip[1], 3.4, '#ffffff'));
      return out;
    },
  }));
}

// ---------- Queen Bonbon ----------

const BB = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#ff9ad8', hairDk: '#e060a8', hairLt: '#ffd8f0',
  cake1: '#fff4e0', cake2: '#ffb3cf', cake3: '#c88a5a', cream: '#ffffff', caramel: '#e8a040', caramelLt: '#ffd08a',
  crown: '#ffd36b', crownDk: '#c8902a', cherry: '#e0304e', cherryLt: '#ff8a9a', spoon: '#e6ecf6', spoonDk: '#a8b4c8',
  sprinkle: ['#ff5a6a', '#7fd8ff', '#ffd36b', '#9ae66a', '#c9a6ff'],
});
const BB_FACE = { skin: BB.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ff9ac0', blushK: 1.2, lip: '#e0407e', lipLine: '#a8205e', eye: eyes('#ff6ab8', '#a81a6a', '#ffe0f2', { rx: 3.7, ry: 3.2, flicks: 3, lashLen: 1.2 }), brow: { c: '#e060a8', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.85, mouth: 'grin' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { open: 0.95, mouth: 'laugh' } } };
// She sways from side to side as if tasting something wonderful, spoon raised.
const BB_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 52], lean: 0.04, tilt: Math.sin((i / 4) * TAU) * 0.1, arms: [[0.6, -1.2], [1.2, -1.4]], legs: NOLEGS })),
  idle: [
    { hip: [36, 52], lean: -0.03, tilt: 0.12, arms: [[0.6, -1.2], [1.2, -1.4]], legs: NOLEGS },
    { hip: [36, 52], lean: -0.04, tilt: -0.1, arms: [[1.6, -0.6], [1.2, -1.5]], legs: NOLEGS },
    { hip: [36, 52], lean: -0.03, tilt: 0.14, arms: [[0.6, -1.2], [1.2, -1.4]], legs: NOLEGS },
    { hip: [36, 52], lean: -0.03, tilt: -0.06, arms: [[0.6, -1.2], [0.6, -2.4]], legs: NOLEGS },
  ],
  // The spoon scooped back, then flung: a dollop of hot candy thrown ahead.
  attack: [
    { hip: [35, 52], lean: -0.12, tilt: -0.12, arms: [[1, -1], [-1, -1.8]], legs: NOLEGS, spoon: -1 },
    { hip: [34, 51], lean: -0.18, tilt: -0.16, arms: [[1.2, -0.8], [-1.6, -1.2]], legs: NOLEGS, spoon: -1 },
    { hip: [39, 52], lean: 0.2, tilt: 0.12, arms: [[-0.4, -0.6], [1.7, -0.3]], legs: NOLEGS, spoon: 1, fling: 1 },
    { hip: [39, 52], lean: 0.18, tilt: 0.1, arms: [[-0.4, -0.6], [1.7, -0.2]], legs: NOLEGS, spoon: 1, fling: 1 },
    { hip: [37, 52], lean: 0, tilt: 0.1, arms: [[0.6, -1.2], [1.2, -1.4]], legs: NOLEGS, spoon: 0 },
  ],
  // Calmed: she sits back in her cake, laughing, hands up.
  dead: { hip: [36, 58], lean: -0.06, tilt: 0.2, arms: [[2.4, -0.6], [2.6, -0.4]], legs: NOLEGS, spoon: 0 },
};

function bonbon(pose, f, mood) {
  const C = fade(BB, mood === 'dead' ? 'happy' : mood);
  const ph = (f / frames(pose)) * TAU;
  const { P, u } = keyed(pose, f, mood, BB_K, 1.4);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#6a1a4a');
  const calm = mood === 'dead';
  const fmood = calm ? 'happy' : mood;
  const A = S.arms[1];
  return big(190, 160, 1.86, () => drawRig(S, {
    behind: () => {
      // Two great swirls of pink hair like whipped cream, bouncing a beat behind.
      const out = [];
      for (const s of [-1, 1]) {
        const root = [S.head[0] - 4 + s * 6, S.head[1] - 2];
        for (let k = 0; k < 5; k++) out.push(...ooval(root[0] + s * (2 + k * 0.6) + jiggle(u, 2) * s, root[1] + 3 + k * 3.6, 3.8 - k * 0.4, 2.6, k % 2 ? C.hair : C.hairDk, 0, 0.3));
      }
      return out;
    },
    backArm: () => armPart(S.arms[0], C.cake2, C.skinDk),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [];
      // The cake gown: three tiers, each with a band of cream, caramel dripping off its edge and
      // sprinkles across it; the hem is a plate of cream rosettes.
      const tiers = [[hy + 18, 13, C.cake3], [hy + 11, 10, C.cake2], [hy + 5, 7.4, C.cake1]];
      for (const [y, w, c] of tiers) {
        out.push(...opoly(round([[hx - w, y - 6], [hx + w, y - 6], [hx + w + 0.6, y + 1], [hx - w - 0.6, y + 1]], 1.4), c));
        out.push(fband([[hx - w, y - 6], [hx + w, y - 6]], 1.6, C.cream, 1), ...drips(hx - w + 0.6, hx + w - 0.6, y - 5.2, Math.round(w / 1.8), C.caramel, ph));
        for (let k = 0; k < 5; k++) out.push(...opoly([[hx - w + 2 + k * (w * 0.42), y - 2 + (k % 2)], [hx - w + 3 + k * (w * 0.42), y - 1.8 + (k % 2)], [hx - w + 2.6 + k * (w * 0.42), y - 1.2 + (k % 2)]], C.sprinkle[k], 0.2));
      }
      for (let k = 0; k < 9; k++) out.push(...ooval(hx - 13 + k * 3.25, hy + 19.6, 1.8, 1.2, C.cream, 0, 0.25));
      out.push(...bodice(S, C.cake2, mix(C.cake2, '#000000', 0.1)));
      const [cx, cy] = S.chest;
      out.push(fband(arcPts(cx, cy + 1.4, 3.6, 1.8, 195, 345, 6), 1, C.cream, 1), ...ooval(cx + 0.4, cy + 3.6, 1.6, 1.6, C.cherry), dot(cx - 0.2, cy + 3, 0.5, C.cherryLt));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 3.2, 2.8, C.cream));
      return out;
    },
    head: () => headPart(S, fmood, BB_FACE, BANGS, HR, 1.16, () => backHair(HR, 7), () => [
      // A candy crown: gold points tipped with gumdrops, a cherry on top bobbing on its stem.
      ...opoly(round([[-6.6, -6], [-6.4, -10.4], [-3.6, -8], [-1.4, -11.6], [1.6, -8.2], [4, -11.4], [6.6, -8.4], [6.8, -6.2]], 0.6), C.crown),
      ...[[-6.4, -10.4], [-1.4, -11.6], [4, -11.4]].flatMap(([x, y], k) => ooval(x, y, 1.2, 1.1, C.sprinkle[k], 0, 0.25)),
      line([[-0.4, -11.6], [-1 + jiggle(u, 3), -15]], 0.4, '#5ab83a'), ...ooval(-1 + jiggle(u, 3), -15.6, 2, 2, C.cherry), dot(-1.6 + jiggle(u, 3), -16.2, 0.6, C.cherryLt),
    ]),
    frontArm: () => {
      const out = [];
      if (!calm) {
        // The great spoon, its bowl full of glowing candy.
        const a = A.a - Math.PI / 2 - 0.9 + (P.spoon ?? 0) * 0.4;
        const bowl = [A.hand[0] + Math.cos(a) * 15, A.hand[1] + Math.sin(a) * 15];
        out.push(...oband([[A.hand[0] - Math.cos(a) * 3, A.hand[1] - Math.sin(a) * 3], bowl], 1.2, C.spoon, 1, 0.3));
        out.push(...ooval(bowl[0], bowl[1], 3.4, 4.4, C.spoon, a + Math.PI / 2), ...ooval(bowl[0], bowl[1], 2.4, 3.2, C.caramel, a + Math.PI / 2), dot(bowl[0] - 0.8, bowl[1] - 0.8, 0.8, C.caramelLt));
        if (P.fling > 0.5) {
          const k = f === 2 ? 1 : 1.6;
          const g = [bowl[0] + 12 * k, bowl[1] + 2 * k];
          out.push(...ooval(g[0], g[1], 3.6, 3, C.caramel), ...drips(g[0] - 2.6, g[0] + 2.6, g[1] + 2, 3, C.caramel, ph), fband([[bowl[0], bowl[1]], [g[0] - 3, g[1]]], (t) => 1.6 * t, C.caramelLt, 1), sparkle(g[0] + 4, g[1] - 4, 2.4, '#ffffff'));
        }
      }
      out.push(...armPart(A, C.cake2, C.skin), ...ooval(lerp(A.el[0], A.hand[0], 0.75), lerp(A.el[1], A.hand[1], 0.75), 1.8, 1.3, C.cream, 0, 0.25));
      if (calm) for (let i = 0; i < 6; i++) out.push(...opoly([[S.head[0] - 16 + i * 6, S.head[1] - 14 - ((f * 2 + i * 3) % 10)], [S.head[0] - 14 + i * 6, S.head[1] - 14 - ((f * 2 + i * 3) % 10)], [S.head[0] - 15 + i * 6, S.head[1] - 12 - ((f * 2 + i * 3) % 10)]], C.sprinkle[i % 5], 0.2));
      return out;
    },
  }));
}

export const ART = {
  toffee: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [120, 180, 340, 240], draw: toffee },
  gretel: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 320, 220], draw: gretel },
  bonbon: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 26, atkMs: [120, 180, 340, 240], draw: bonbon },
};

export const INFO = {
  toffee: { name: 'Toffee, the Caramel Smith', w: 54, h: 112 },
  gretel: { name: 'Gretel, the Gingerbread Knight', w: 54, h: 112 },
  bonbon: { name: 'Queen Bonbon', w: 70, h: 130 },
};
