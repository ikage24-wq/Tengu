// Monster art: the Sunken Aquarium Palace's bosses (docs/design/aquarium-palace.md), on the fin rig
// (searig.js) drawn grand to the queens' size, like the manor's bosses.
//   moraymurri / morayena  The Twin Moray Sisters: eel-tailed sisters with long serpent tails that
//                          coil and strike; Murri green and spotted with coral daggers, Ena gold with
//                          a frill of fins and a bite.
//   abyssia                Lady Abyssia, the Sea Witch: a witch on eight great tentacles, a nautilus
//                          hat, a pearl staff; ink and sweeping arms.
//   coralie                Queen Coralie, the Drowned Queen: a grand mermaid queen with a coral crown,
//                          seafoam hair drifting up in the water and a trident.
// All face right, the tail (or lowest arm) at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { poseAt, solve, drawRig } from './manorrig.js';
import { armPart, bodice, headPart, hairOf, eyes, BANGS, SWEPT } from './manor.js';
import { tailChain, drawTail, bubbles } from './searig.js';

const { grand, within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, TAU } = KIT;

const NOLEGS = [[0, 0], [0, 0]];
function big(w, h, k, fn) {
  return { w, h, res: 3, shapes: grand(k, w / 2 - 36 * k, h - 0.6 - 78 * k, fn) };
}
const frames = (pose) => (pose === 'attack' ? 5 : 8);
function keyed(pose, f, mood, K) {
  if (mood === 'dead') return K.dead;
  let P;
  if (pose === 'walk') P = poseAt(K.walk, f, 8);
  else if (pose === 'attack') P = poseAt(K.attack, f, 4, false);
  else P = poseAt(K.idle, f, 8);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.24, tilt: -0.32, hip: [P.hip[0] - 2, P.hip[1] + 0.6] };
  return P;
}
const swim = (y, lean, arms, extra = {}) => [0, 1, 2, 3].map((i) => {
  const s = Math.sin((i / 4) * TAU);
  return { hip: [36, y + s * 1.6], lean: lean + s * 0.04, tilt: 0.05 - s * 0.05, arms: arms(s), legs: NOLEGS, ...extra };
});

// ---------- The Twin Moray Sisters ----------

const MURRI = soften({
  skin: '#e6fff0', skinDk: '#c4ecd4', hair: '#5ac88a', hairDk: '#3a9a6a', hairLt: '#bff6d6',
  tail: '#4ab87a', tailDk: '#2e8a5a', tailLt: '#a8ecc4', fin: '#ffd36b', finDk: '#e0a82a', spot: '#fff3a6',
  top: '#2e8a5a', topDk: '#1e6a44', blade: '#ff9ab8', bladeDk: '#e0607e', fang: '#ffffff',
});
const ENA = soften({
  skin: '#fff8e6', skinDk: '#f2e0c0', hair: '#ffcf4a', hairDk: '#e0a020', hairLt: '#fff0b0',
  tail: '#ffc84a', tailDk: '#e09a1a', tailLt: '#fff0a8', fin: '#5ac8a8', finDk: '#3a9a8a', spot: '#ffffff',
  top: '#e09a1a', topDk: '#b8780a', blade: '#7fd8ff', bladeDk: '#4aa8e0', fang: '#ffffff',
});
const morayFace = (C, iris) => ({ skin: C.skin, skinSh: C.skinDk, skinSh2: mix(C.skinDk, '#8a7aa8', 0.3), blush: '#ffa8b8', lip: '#e0607e', lipLine: '#a83a58', eye: eyes(iris, mix(iris, '#000000', 0.5), mix(iris, '#ffffff', 0.7), { tilt: 0.35, ry: 2.4, pupil: 'slit' }), brow: { c: C.hairDk, kind: 'arched', w: 0.8 }, moods: { idle: { open: 0.8, mouth: 'smirk' }, angry: { mouth: 'snarl' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } });
const MURRI_FACE = morayFace(MURRI, '#ffd36b');
const ENA_FACE = morayFace(ENA, '#5ac8a8');
const MORAY_K = {
  // A serpent's swim: the long tail coiling in S-bends, the body low and forward.
  walk: swim(38, 0.28, (s) => [[1.2 + s * 0.3, -1.4], [1.4 - s * 0.3, -1.6]]),
  idle: [
    { hip: [36, 38], lean: 0.12, tilt: 0.1, arms: [[0.6, -1.6], [0.9, -1.9]], legs: NOLEGS, coil: 0 },
    { hip: [36, 36.4], lean: 0.08, tilt: 0.16, arms: [[0.6, -1.7], [1, -2]], legs: NOLEGS, coil: 0.5 },
    { hip: [36, 37.4], lean: 0.14, tilt: 0.06, arms: [[0.6, -1.6], [0.9, -1.9]], legs: NOLEGS, coil: 1 },
    { hip: [36, 36], lean: 0.1, tilt: 0.12, arms: [[0.6, -1.7], [1, -2]], legs: NOLEGS, coil: 0.5 },
  ],
  // Coil back, then strike: the whole body shoots forward on the tail.
  attack: [
    { hip: [30, 40], lean: -0.2, tilt: -0.16, arms: [[1, -1.4], [-0.4, -2]], legs: NOLEGS, coil: 1.4 },
    { hip: [27, 41], lean: -0.3, tilt: -0.2, arms: [[1.2, -1.2], [-0.8, -1.8]], legs: NOLEGS, coil: 1.8 },
    { hip: [46, 38], lean: 0.5, tilt: 0.2, arms: [[-0.4, -0.4], [1.6, -0.1]], legs: NOLEGS, coil: -0.6 },
    { hip: [46, 38], lean: 0.46, tilt: 0.18, arms: [[-0.4, -0.4], [1.6, 0]], legs: NOLEGS, coil: -0.5 },
    { hip: [37, 38], lean: 0.12, tilt: 0.08, arms: [[0.6, -1.6], [0.9, -1.9]], legs: NOLEGS, coil: 0 },
  ],
  dead: { hip: [34, 60], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS, coil: 0 },
};

function moray(pose, f, mood, PAL, FACE, gold) {
  const C = fade(PAL, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, MORAY_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#1a3a2a');
  const coil = P.coil ?? 0;
  const strike = pose === 'attack' && (f === 2 || f === 3);
  return big(170, 140, 1.62, () => drawRig(S, {
    behind: () => {
      // The serpent tail: long, laid along the floor in S-bends behind her, spots down its back.
      const chain = tailChain([S.hip[0], S.hip[1] + 4], { base: 0.9 + coil * 0.3, curl: 2.2 + coil, wave: 0.7, len: 64, n: 10 }, ph);
      const out = drawTail(chain, 9, C, ph, { fluke: 8 });
      const sp = KIT.spline(chain.pts, 3);
      for (let i = 3; i < sp.length - 3; i += 3) out.push(dot(sp[i][0] - 1.4, sp[i][1] - 1, 0.9, C.spot));
      // A fin frill running down her back.
      for (let i = 0; i < 6; i++) {
        const [x, y] = sp[Math.min(sp.length - 1, i * 2)];
        out.push(...opoly([[x - 1, y - 2], [x - 4 - Math.sin(ph + i) * 0.8, y - 5], [x - 3, y]], C.fin, 0.3));
      }
      // Long hair streaming back in the water.
      for (const k of [0, 1, 2]) out.push(...KIT.lockHair(KIT.flowPts([S.head[0] - 7, S.head[1] - 4 + k * 3], Math.PI / 2 + 0.8 + k * 0.1, 0.4, 20 - k * 3, ph - k * 0.6, 0.26, 5), 4.6 - k * 0.8, HR));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.topDk, C.skinDk),
    body: () => {
      const out = [...bodice(S, C.top, C.topDk)];
      const [cx, cy] = S.chest;
      out.push(fband(arcPts(cx, cy + 1.4, 3.4, 1.6, 195, 345, 6), 0.6, C.fin, 1), ...KIT.gem(cx + 0.4, cy + 3.6, 1.1, C.blade));
      for (let k = 0; k < 3; k++) out.push(...opoly([[S.arms[1].sh[0] - 2 + k * 1.6, S.arms[1].sh[1] - 1], [S.arms[1].sh[0] - 1 + k * 1.6, S.arms[1].sh[1] - 4], [S.arms[1].sh[0] + k * 1.6, S.arms[1].sh[1] - 0.6]], C.fin, 0.3));
      return out;
    },
    head: () => headPart(S, mood, FACE, gold ? BANGS : SWEPT, HR, 1.12, () => backHair(HR, 7), () => {
      // Fin ears and a crest of fins on the crown.
      const out = [...opoly([[-7.6, -1], [-12, -5], [-11, 1.4]], C.fin), ...opoly([[-7, 2], [-11, 2.6], [-8.6, 4.6]], C.finDk)];
      for (let k = 0; k < 3; k++) out.push(...opoly([[-3 + k * 3, -9.4], [-4 + k * 3, -13.6 + k * 0.6], [-0.6 + k * 3, -9.6]], C.fin, 0.3));
      return out;
    }),
    frontArm: () => {
      const A = S.arms[1];
      const out = [];
      if (!gold) {
        // Murri: a curved coral dagger.
        const a = A.a - Math.PI / 2 - 0.3;
        const tip = [A.hand[0] + Math.cos(a) * 11, A.hand[1] + Math.sin(a) * 11];
        out.push(...oband([A.hand, [lerp(A.hand[0], tip[0], 0.5) - Math.sin(a) * 1.4, lerp(A.hand[1], tip[1], 0.5) + Math.cos(a) * 1.4], tip], taperW(2.2, 0.3), C.blade, 2, 0.3));
      }
      out.push(...armPart(A, C.top, C.skin));
      if (strike) {
        const [x, y] = [S.head[0] + 16, S.head[1] + 6];
        out.push(fband([[S.hip[0] - 20, S.hip[1] + 6], [x, y]], (t) => 3.4 * t * (1 - t) * 4, mix(C.tailLt, '#ffffff', 0.4), 1));
        if (gold) {
          // Ena's bite: jaws of fangs snapping shut.
          for (let k = 0; k < 4; k++) out.push(fpoly([[x - 5 + k * 3, y - 4], [x - 3.5 + k * 3, y - 0.6], [x - 2 + k * 3, y - 4]], C.fang), fpoly([[x - 5 + k * 3, y + 4], [x - 3.5 + k * 3, y + 0.6], [x - 2 + k * 3, y + 4]], C.fang));
        }
        out.push(sparkle(x + 6, y, 3, '#ffffff'), ...bubbles(x - 4, y + 4, f, 5, '#eaf6ff', 4));
      }
      return out;
    },
  }));
}
const moraymurri = (pose, f, mood) => moray(pose, f, mood, MURRI, MURRI_FACE, false);
const morayena = (pose, f, mood) => moray(pose, f, mood, ENA, ENA_FACE, true);

// ---------- Lady Abyssia, the Sea Witch ----------

const AB = soften({
  skin: '#e6dcff', skinDk: '#c4b4ec', hair: '#3a2a6a', hairDk: '#24184a', hairLt: '#7a62c0',
  arm: '#6a3a9a', armDk: '#4a2478', armLt: '#a878d8', sucker: '#ffb3e0',
  dress: '#2a1e4e', dressDk: '#1a1238', trim: '#5ae0c8', shell: '#ffe6d0', shellDk: '#e0b090', pearl: '#ffffff', glow: '#7ff0d8', ink: '#2a1a3e',
});
const AB_FACE = { skin: AB.skin, skinSh: '#c4b4ec', skinSh2: '#a090d0', blush: '#d8a0e0', lip: '#8a3a9a', lipLine: '#5a1a6a', eye: eyes('#5ae0c8', '#1a7a6a', '#d0fff4', { tilt: 0.42, ry: 2.2, rx: 3.4, flicks: 3, lashLen: 1.1 }), brow: { c: '#3a2a6a', kind: 'arched', w: 0.9 }, moods: { idle: { open: 0.6, mouth: 'smirk' }, angry: { mouth: 'grin' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
const AB_K = {
  walk: swim(42, 0.04, (s) => [[0.5, -1.4 + s * 0.2], [0.7, -0.9]], { staff: 0 }),
  idle: [
    { hip: [36, 42], lean: -0.04, tilt: -0.06, arms: [[0.6, -1.6], [0.7, -0.9]], legs: NOLEGS, staff: 0 },
    { hip: [36, 40.6], lean: -0.06, tilt: 0.06, arms: [[1.6, -0.6], [0.8, -1]], legs: NOLEGS, staff: 0.2 },
    { hip: [36, 41.4], lean: -0.04, tilt: -0.08, arms: [[0.6, -1.6], [0.7, -0.9]], legs: NOLEGS, staff: 0 },
    { hip: [36, 40.6], lean: -0.05, tilt: 0.1, arms: [[1.8, -0.4], [0.8, -1]], legs: NOLEGS, staff: 0.2 },
  ],
  // Staff raised, the pearl flares, then thrust down: ink bursts out.
  attack: [
    { hip: [35, 41], lean: -0.1, tilt: -0.14, arms: [[1.2, -1], [-0.6, -2]], legs: NOLEGS, staff: -0.6 },
    { hip: [34, 40], lean: -0.16, tilt: -0.18, arms: [[1.4, -0.8], [-1.2, -1.6]], legs: NOLEGS, staff: -0.9 },
    { hip: [39, 42], lean: 0.2, tilt: 0.12, arms: [[-0.4, -0.6], [1.4, -0.4]], legs: NOLEGS, staff: 0.6 },
    { hip: [39, 42], lean: 0.18, tilt: 0.1, arms: [[-0.4, -0.6], [1.4, -0.3]], legs: NOLEGS, staff: 0.6 },
    { hip: [37, 42], lean: 0, tilt: -0.04, arms: [[0.6, -1.6], [0.7, -0.9]], legs: NOLEGS, staff: 0 },
  ],
  dead: { hip: [34, 62], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS, staff: 1.2 },
};

function abyssia(pose, f, mood) {
  const C = fade(AB, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, AB_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#0a0420');
  const [hx, hy] = S.hip;
  const burst = pose === 'attack' && (f === 2 || f === 3);
  const tentacle = (k, back) => {
    const side = (k - 3.5) / 3.5;
    const pts = [[hx + side * 4, hy + 2]];
    let a = -side * 0.7;
    let [x, y] = pts[0];
    for (let i = 1; i <= 7; i++) {
      a += Math.sin(ph - i * 0.8 + k * 1.3) * 0.18 - side * 0.1 + (i > 4 ? -side * 0.35 : 0);
      x -= Math.sin(a) * 5.6;
      y += Math.cos(a) * 5.6;
      pts.push([x, Math.min(y, 78)]);
    }
    const out = [...oband(pts, (t) => lerp(5.6, 1.2, t), back ? C.armDk : C.arm, 4, 0.4)];
    const sp = KIT.spline(pts, 3);
    for (let i = 2; i < sp.length - 2; i += 2) out.push(dot(sp[i][0] + 1.4, sp[i][1], 0.7, C.sucker));
    out.push(fband(sp.slice(1, Math.round(sp.length * 0.7)).map(([px, py]) => [px - 1.2, py]), (t) => lerp(1.4, 0.4, t), C.armLt, 1));
    return out;
  };
  return big(176, 150, 1.78, () => drawRig(S, {
    behind: () => {
      const out = [...[0, 2, 4, 6].map((k) => tentacle(k, true)).flat()];
      for (const k of [0, 1]) out.push(...KIT.lockHair(KIT.flowPts([S.head[0] - 7, S.head[1] - 3 + k * 4], Math.PI / 2 + 0.4 + k * 0.2, 0.5, 24 - k * 5, ph - k * 0.6, 0.22, 6), 5.4 - k, HR));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk),
    body: () => {
      const out = [...bodice(S, C.dress, C.dressDk)];
      const [cx, cy] = S.chest;
      // A high shell collar flaring behind her neck and a glowing pendant.
      out.push(...opoly(round([[cx - 6, cy - 1], [cx - 8, cy - 8], [cx - 3, cy - 4], [cx, cy - 9], [cx + 2, cy - 3], [cx + 5, cy - 6], [cx + 4, cy - 0.6]], 1), C.shell));
      out.push(fband(arcPts(cx, cy + 1.4, 3.6, 1.6, 195, 345, 6), 0.6, C.trim, 1), ...ooval(cx + 0.4, cy + 4, 1.4, 1.6, C.glow), dot(cx, cy + 3.6, 0.5, '#ffffff'));
      out.push(...[1, 3, 5, 7].map((k) => tentacle(k, false)).flat());
      return out;
    },
    head: () => headPart(S, mood, AB_FACE, SWEPT, HR, 1.12, () => backHair(HR, 9), () => {
      // A nautilus-shell witch hat: a spiral shell tipped on her head, striped, a pearl at its lip.
      const out = [];
      within(at(0, -8.6, -0.25), () => {
        out.push(...opoly([[-10, 2.4], [10, 2.4], [8, 4.2], [-8, 4.2]], C.dress));
        out.push(...ooval(0, -3, 7.6, 6.4, C.shell), fband(arcPts(0.6, -3, 5, 4, 0, 330, 10), 1, C.shellDk, 1), fband(arcPts(1.4, -3, 2.4, 2, 0, 330, 8), 0.8, C.shellDk, 1));
        for (let k = 0; k < 4; k++) out.push(line([[-6 + k * 3.4, -8], [-5 + k * 3.4, 1.4]], 0.4, C.shellDk));
        out.push(...ooval(7.6, 1.2, 1.4, 1.4, C.pearl));
      });
      return out;
    }),
    frontArm: () => {
      const A = S.arms[1];
      // The pearl staff: a twisted driftwood staff crowned with a glowing pearl in a coral claw.
      const a = -Math.PI / 2 + 0.12 + (P.staff ?? 0);
      const top = [A.hand[0] + Math.cos(a) * 14, A.hand[1] + Math.sin(a) * 14];
      const bot = [A.hand[0] - Math.cos(a) * 12, A.hand[1] - Math.sin(a) * 12];
      const out = [...oband([bot, A.hand, top], taperW(1.2, 1.6), C.armLt, 2, 0.3)];
      out.push(...opoly([[top[0] - 2.4, top[1] + 1], [top[0] - 3, top[1] - 3], [top[0], top[1] - 1.4], [top[0] + 3, top[1] - 3], [top[0] + 2.4, top[1] + 1]], C.trim));
      const flare = pose === 'attack' && f <= 1 ? 1 : 0;
      out.push(...ooval(top[0], top[1] - 2, 2.2 + flare, 2.2 + flare, C.pearl), dot(top[0] - 0.7, top[1] - 2.7, 0.8, C.glow));
      if (flare) out.push(sparkle(top[0], top[1] - 2, 5, C.glow));
      out.push(...armPart(A, C.dress, C.skin));
      if (burst) {
        for (let i = 0; i < 7; i++) {
          const ang = -0.6 + i * 0.2;
          const r = f === 2 ? 12 : 20;
          out.push(...ooval(A.hand[0] + 6 + Math.cos(ang) * r, A.hand[1] + 6 + Math.sin(ang) * r * 0.6, 3.4 - (i % 2), 2.8 - (i % 2) * 0.6, C.ink, ang, 0.4));
        }
        out.push(sparkle(A.hand[0] + 22, A.hand[1] + 4, 2.4, C.glow));
      }
      return out;
    },
  }));
}

// ---------- Queen Coralie, the Drowned Queen ----------

const QC = soften({
  skin: '#fff4f0', skinDk: '#f2dcd6', hair: '#9ff0e0', hairDk: '#5ac8b8', hairLt: '#e6fff8',
  tail: '#7fb8ff', tailDk: '#4a80e0', tailLt: '#d0e6ff', fin: '#ffb3cf', finDk: '#ff7aa8',
  top: '#ffffff', topDk: '#d8e6f6', coral: '#ff7a8a', coralDk: '#d84a62', coralLt: '#ffc0c8', gold: '#ffd36b', goldDk: '#c8902a', pearl: '#ffffff', water: '#bfeeff',
});
const QC_FACE = { skin: QC.skin, skinSh: '#f2dcd6', skinSh2: '#dcb4b0', blush: '#ffa8b8', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#4ac8e0', '#1a6aa8', '#d8f8ff', { rx: 3.6, ry: 2.9, tilt: 0.15, flicks: 3, lashLen: 1.15 }), brow: { c: '#5ac8b8', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.75, mouth: 'calm' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { open: 0.9, mouth: 'smile' } } };
const QC_K = {
  walk: swim(38, 0.12, (s) => [[1 + s * 0.4, -1], [0.5, -1.7]], { tri: 0 }),
  idle: [
    { hip: [36, 38], lean: -0.03, tilt: 0.08, arms: [[0.8, -1.2], [0.4, -1.8]], legs: NOLEGS, tri: 0 },
    { hip: [36, 36.4], lean: -0.05, tilt: 0.14, arms: [[1, -1.4], [0.4, -1.9]], legs: NOLEGS, tri: 0.1 },
    { hip: [36, 37.4], lean: -0.03, tilt: 0.04, arms: [[0.8, -1.2], [0.4, -1.8]], legs: NOLEGS, tri: 0 },
    { hip: [36, 36], lean: -0.04, tilt: 0.12, arms: [[1.1, -1.5], [0.4, -1.9]], legs: NOLEGS, tri: 0.1 },
  ],
  // The trident drawn back over her head, then driven forward: a jet of water along the floor.
  attack: [
    { hip: [34, 37], lean: -0.14, tilt: -0.12, arms: [[1, -1], [-1.2, -1.4]], legs: NOLEGS, tri: -0.4 },
    { hip: [32, 36], lean: -0.22, tilt: -0.18, arms: [[1.2, -0.8], [-1.8, -1]], legs: NOLEGS, tri: -0.6 },
    { hip: [41, 38], lean: 0.26, tilt: 0.14, arms: [[-0.4, -0.6], [1.5, -0.1]], legs: NOLEGS, tri: 0.2 },
    { hip: [41, 38], lean: 0.22, tilt: 0.12, arms: [[-0.4, -0.6], [1.55, 0]], legs: NOLEGS, tri: 0.2 },
    { hip: [37, 38], lean: 0.02, tilt: 0.06, arms: [[0.8, -1.2], [0.4, -1.8]], legs: NOLEGS, tri: 0 },
  ],
  // Freed: she rises, hands to her heart.
  dead: { hip: [36, 40], lean: 0.06, tilt: 0.2, arms: [[0.9, -1.8], [0.8, -1.9]], legs: NOLEGS, tri: 0 },
};

function coralie(pose, f, mood) {
  const C = fade(QC, mood === 'dead' ? 'happy' : mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, QC_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#1a5a5a');
  const freed = mood === 'dead';
  const fmood = freed ? 'happy' : mood;
  const A = S.arms[1];
  const thrust = pose === 'attack' && (f === 2 || f === 3);
  return big(180, 160, 1.9, () => drawRig(S, {
    behind: () => {
      const out = [];
      // Seafoam hair drifting up and back in the water, a crown of locks.
      for (const [k, len, w] of [[0, 26, 6], [1, 22, 5], [2, 18, 4.2], [3, 14, 3.4]]) {
        const root = [S.head[0] - 5 - k, S.head[1] - 5 + k * 2.6];
        out.push(...KIT.lockHair(KIT.flowPts(root, Math.PI + 0.6 - k * 0.25, 0.7, len, ph - k * 0.7, 0.22, 6), w, HR));
      }
      out.push(...drawTail(tailChain([S.hip[0], S.hip[1] + 5], { base: 0.3, curl: 1.4, wave: 0.55, len: 40 }, ph), 11, C, ph, { fluke: 14 }));
      // A train of sheer fin trailing from her hips.
      out.push(...oband(KIT.flowPts([S.hip[0] - 4, S.hip[1] + 4], Math.PI / 2 + 0.9, 0.4, 22, ph, 0.24, 5), (t) => lerp(3, 7, t), mix(C.fin, '#ffffff', 0.4), 3));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.topDk, C.skinDk),
    body: () => {
      const out = [...bodice(S, C.top, C.topDk)];
      const [cx, cy] = S.chest;
      // A shell bodice edged in gold, strings of pearls, coral at the shoulders.
      out.push(...ooval(cx - 1.6, cy + 2.4, 2.2, 1.9, C.coralLt), ...ooval(cx + 2.2, cy + 2.4, 2.2, 1.9, C.coralLt), fband(arcPts(cx, cy + 1, 4, 1.8, 195, 345, 6), 0.7, C.gold, 1));
      for (let k = 0; k < 7; k++) out.push(dot(cx - 3 + k, cy + 6 + Math.sin(k * 0.9) * 0.8, 0.5, C.pearl));
      for (let k = 0; k < 6; k++) out.push(dot(S.hip[0] - 4 + k * 1.6, S.hip[1] - 1.4, 0.55, C.pearl));
      const [sx, sy] = S.arms[1].sh;
      out.push(...oband([[sx - 1, sy], [sx + 1, sy - 4], [sx + 3, sy - 6], [sx + 5, sy - 5]], taperW(1.4, 0.6), C.coral, 3, 0.3), ...oband([[sx + 1, sy - 4], [sx - 1, sy - 7]], taperW(1, 0.5), C.coral, 2, 0.3));
      return out;
    },
    head: () => headPart(S, fmood, QC_FACE, SWEPT, HR, 1.16, () => backHair(HR, 10), () => {
      // The coral crown: branching coral and pearls, a gold band, a sea-glass jewel.
      const out = [...opoly(round([[-6.8, -6.6], [6.8, -7], [6.4, -5], [-6.4, -4.6]], 1), C.gold)];
      for (const [x, h, lean] of [[-5.4, 6, -0.4], [-2.4, 8, -0.15], [1, 9.6, 0.05], [4.4, 7.4, 0.3]]) {
        const tip = [x + Math.sin(lean) * h, -6.6 - Math.cos(lean) * h];
        out.push(...oband([[x, -6.4], tip], taperW(1.6, 0.8), C.coral, 2, 0.3), ...oband([[lerp(x, tip[0], 0.5), lerp(-6.4, tip[1], 0.5)], [lerp(x, tip[0], 0.5) + 2, lerp(-6.4, tip[1], 0.5) - 2.4]], taperW(1, 0.5), C.coral, 2, 0.3), dot(tip[0], tip[1], 0.7, C.pearl));
      }
      out.push(...KIT.gem(0.4, -5.8, 1.2, '#7fd8ff'));
      return out;
    }),
    frontArm: () => {
      const out = [];
      if (!freed) {
        // The trident: a long gold shaft, three barbed prongs.
        const a = A.a - Math.PI / 2 - 1.2 + (P.tri ?? 0) * 1.6;
        const tip = [A.hand[0] + Math.cos(a) * 18, A.hand[1] + Math.sin(a) * 18];
        const bot = [A.hand[0] - Math.cos(a) * 12, A.hand[1] - Math.sin(a) * 12];
        out.push(...oband([bot, tip], 1.1, C.gold, 1, 0.3));
        const nx = -Math.sin(a);
        const ny = Math.cos(a);
        out.push(...oband([[tip[0] + nx * 3.4, tip[1] + ny * 3.4], [tip[0] - nx * 3.4, tip[1] - ny * 3.4]], 1, C.gold, 1, 0.3));
        for (const s of [-1, 0, 1]) {
          const b = [tip[0] + nx * 3.4 * s, tip[1] + ny * 3.4 * s];
          const e = [b[0] + Math.cos(a) * (s ? 4.6 : 6.4), b[1] + Math.sin(a) * (s ? 4.6 : 6.4)];
          out.push(...oband([b, e], taperW(1.2, 0.3), C.gold, 1, 0.3));
        }
        out.push(dot(A.hand[0] + Math.cos(a) * 15, A.hand[1] + Math.sin(a) * 15, 0.9, '#7fd8ff'));
        if (thrust) {
          out.push(fband([[A.hand[0] - 6, A.hand[1] + 2], [tip[0] + 18, tip[1] + 6]], (t) => 4 * Math.sin(Math.PI * t), C.water, 1));
          out.push(sparkle(tip[0] + 10, tip[1] + 3, 3, '#ffffff'), ...bubbles(tip[0] + 4, tip[1] + 6, f, 5, '#eaf6ff', 4));
        }
      }
      out.push(...armPart(A, C.top, C.skin));
      if (freed) for (let i = 0; i < 4; i++) out.push(sparkle(S.head[0] - 14 + i * 9, S.head[1] - 14 + (i % 2) * 6 - f, 1.4 + (i % 2), '#ffffff'));
      if (!freed) out.push(...bubbles(S.head[0] + 9, S.head[1] - 12, f, frames(pose), '#eaf6ff', 3));
      return out;
    },
  }));
}

export const ART = {
  moraymurri: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 160, 300, 220], draw: moraymurri },
  morayena: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 160, 300, 220], draw: morayena },
  abyssia: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 26, atkMs: [110, 200, 320, 240], draw: abyssia },
  coralie: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [120, 180, 320, 240], draw: coralie },
};

export const INFO = {
  moraymurri: { name: 'Murri, the Twin Moray', w: 56, h: 100 },
  morayena: { name: 'Ena, the Twin Moray', w: 56, h: 100 },
  abyssia: { name: 'Lady Abyssia, the Sea Witch', w: 70, h: 120 },
  coralie: { name: 'Queen Coralie, the Drowned Queen', w: 64, h: 130 },
};
