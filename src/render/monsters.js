// Monster art. Each design is built from shapes facing right, with two animation frames
// (a squash-and-stretch bounce or a wing flap). Drawn with a white flash when hit.

import { R, E, P, sprite, blit, shade } from './pixel.js';

const INK = '#3a2d4f';
const BLUSH = '#ff9fb8';

// Two dot eyes with a shine, plus blush.
const face = (x, y, gap = 6, eye = INK) => [
  R(x, y, 2, 3, eye), R(x + gap, y, 2, 3, eye), P(x, y, '#ffffff'), P(x + gap, y, '#ffffff'),
  R(x - 2, y + 3, 2, 1, BLUSH), R(x + gap + 2, y + 3, 2, 1, BLUSH),
];

const ART = {
  puffle: (f) => {
    const s = f ? 1 : 0;
    return { w: 26, h: 22, shapes: [
      R(6, 19, 4, 3, '#ffb3c6'), R(15, 19, 4, 3, '#ffb3c6'),
      E(13, 13 + s, 12, 9 - s, '#fff0fa'), E(7, 8 + s, 5, 4, '#fff0fa'), E(18, 7 + s, 5, 4, '#fff0fa'),
      E(12, 6 + s, 4, 3, '#ffffff'), ...face(13, 11 + s), R(16, 16 + s, 2, 1, '#c25b78'),
    ] };
  },
  snailbun: (f) => {
    const s = f ? 1 : 0;
    return { w: 32, h: 24, shapes: [
      E(13, 19, 13, 4 - s, '#ffe9a8'), E(12, 11 + s, 9, 9, '#ffb38a'), E(12, 11 + s, 5, 5, '#ffd0a8'), E(12, 11 + s, 2, 2, '#ffb38a'),
      E(25, 16, 5, 6, '#ffe9a8'), R(22, 2 + s, 3, 10, '#ffe9a8'), R(27, 3 + s, 3, 9, '#ffe9a8'), R(23, 4 + s, 1, 6, '#ffb3c6'), R(28, 5 + s, 1, 5, '#ffb3c6'),
      R(25, 14, 2, 3, INK), P(25, 14, '#ffffff'), R(28, 17, 2, 1, BLUSH),
    ] };
  },
  sproutling: (f) => {
    const s = f ? 1 : 0;
    return { w: 24, h: 30, shapes: [
      R(6, 27, 4, 3, '#8fbf7a'), R(14, 27, 4, 3, '#8fbf7a'),
      E(12, 19 + s, 10, 10 - s, '#c6f2a6'), R(11, 4 + s, 2, 7, '#5fb050'), E(7, 5 + s, 5, 3, '#7fd17a'), E(17, 4 + s, 5, 3, '#9be08f'),
      ...face(9, 17 + s), R(12, 22 + s, 2, 1, '#5f8f4a'),
    ] };
  },
  mushkin: (f) => {
    const s = f ? 1 : 0;
    return { w: 30, h: 32, shapes: [
      R(8, 29, 5, 3, '#e8d0b0'), R(17, 29, 5, 3, '#e8d0b0'),
      R(8, 15 + s, 14, 15 - s, '#fff1dc'), E(15, 11 + s, 15, 10, '#ff8a6b'), R(1, 13 + s, 28, 3, shade('#ff8a6b', -12)),
      E(8, 7 + s, 3, 2.5, '#ffffff'), E(18, 5 + s, 3.5, 2.5, '#ffffff'), E(24, 10 + s, 2, 2, '#ffffff'),
      ...face(12, 19 + s), R(15, 24 + s, 2, 1, '#c25b78'),
    ] };
  },
  piglet: (f) => {
    const s = f ? 1 : 0;
    return { w: 34, h: 26, shapes: [
      R(8, 21, 4, 5 - s, '#ff8fab'), R(14, 21, 4, 4 + s, '#ff8fab'), R(20, 21, 4, 5 - s, '#ff8fab'), R(25, 21, 4, 4 + s, '#ff8fab'),
      E(16, 14, 14, 9, '#ffc2d6'), R(1, 9, 3, 2, '#ff8fab'), P(0, 8, '#ff8fab'),
      R(20, 2, 4, 5, '#ff8fab'), R(26, 3, 4, 4, '#ff8fab'), E(29, 15, 4, 3, '#ff8fab'), P(28, 15, INK), P(30, 15, INK),
      R(22, 10, 2, 3, INK), P(22, 10, '#ffffff'), R(25, 13, 2, 1, BLUSH),
    ] };
  },
  leafling: (f) => {
    const s = f ? 1 : 0;
    return { w: 28, h: 36, shapes: [
      R(9, 32, 3, 4, '#5f8f4a'), R(16, 32, 3, 4, '#5f8f4a'),
      R(2, 18 + s, 5, 2, '#7fd17a'), R(21, 17 - s, 5, 2, '#7fd17a'),
      E(14, 19, 10, 13, '#7fd17a'), R(14, 7, 1, 24, '#5fb050'), R(9, 14, 5, 1, '#5fb050'), R(15, 20, 5, 1, '#5fb050'),
      E(14, 4, 4, 3, '#9be08f'), ...face(10, 17), R(13, 22, 3, 1, '#3f7a4a'),
    ] };
  },
  boarlet: (f) => {
    const s = f ? 1 : 0;
    return { w: 42, h: 30, shapes: [
      R(8, 24, 5, 6 - s, '#8a6045'), R(16, 24, 5, 5 + s, '#8a6045'), R(24, 24, 5, 6 - s, '#8a6045'), R(31, 24, 5, 5 + s, '#8a6045'),
      E(19, 16, 17, 10, '#c98e66'), R(4, 7, 22, 4, '#8a6045'), R(6, 5, 3, 3, '#8a6045'), R(12, 4, 3, 3, '#8a6045'),
      E(36, 17, 6, 6, '#c98e66'), E(40, 19, 2.5, 2.5, '#ffb3c6'), R(36, 21, 2, 5, '#fff4dc'), R(39, 21, 2, 4, '#fff4dc'),
      R(31, 12, 2, 2, INK), R(29, 10, 4, 1, INK), R(33, 4, 3, 5, '#a57250'),
    ] };
  },
  mossgolem: (f) => {
    const s = f ? 1 : 0;
    return { w: 48, h: 48, shapes: [
      R(13, 42, 8, 6, '#9a876f'), R(28, 42, 8, 6, '#9a876f'),
      E(5, 28 + s, 5, 7, '#b4a28a'), E(43, 28 - s, 5, 7, '#b4a28a'),
      E(24, 26, 18, 18, '#b4a28a'), E(24, 11, 15, 6, '#7fb069'), E(14, 13, 5, 3, '#9fd17f'), E(34, 12, 4, 3, '#9fd17f'),
      R(10, 34, 1, 6, '#8a7a62'), R(36, 30, 1, 7, '#8a7a62'),
      R(17, 24, 4, 3, '#c6ff9a'), R(28, 24, 4, 3, '#c6ff9a'), R(21, 32, 7, 1, '#6f5f48'),
    ] };
  },
  wisp: (f) => {
    const s = f ? 1 : 0;
    return { w: 28, h: 32, shapes: [
      E(14, 18, 10, 11, '#a8fff0'), E(14, 8 - s, 6, 7, '#a8fff0'), E(12, 3 - s, 3, 4, '#d6fff8'),
      R(5, 26, 4, 5 - s, '#a8fff0'), R(12, 27, 4, 5 + s, '#a8fff0'), R(19, 26, 4, 5 - s, '#a8fff0'),
      E(14, 16, 6, 6, '#e8fffb'), ...face(10, 15, 7), R(13, 21, 3, 1, '#4fb0a0'),
    ] };
  },
  gloombat: (f) => {
    const up = f ? -4 : 2;
    return { w: 34, h: 26, shapes: [
      E(6, 12 + up, 6, 5, '#6f5fa8'), E(28, 12 + up, 6, 5, '#6f5fa8'), R(1, 14 + up, 4, 3, '#6f5fa8'), R(29, 14 + up, 4, 3, '#6f5fa8'),
      E(17, 13, 7, 7, '#8f7cc4'), R(12, 3, 3, 5, '#8f7cc4'), R(19, 3, 3, 5, '#8f7cc4'),
      R(13, 11, 2, 2, '#ffe36b'), R(19, 11, 2, 2, '#ffe36b'), P(15, 17, '#ffffff'), P(18, 17, '#ffffff'),
    ] };
  },
  boneknight: (f) => {
    const s = f ? 1 : 0;
    return { w: 32, h: 46, shapes: [
      R(10, 34, 3, 12, '#efe8d8'), R(17, 34, 3, 12, '#efe8d8'), R(9, 44, 5, 2, '#a8b0bd'), R(16, 44, 5, 2, '#a8b0bd'),
      R(2, 20 + s, 7, 12, '#a8b0bd'), R(3, 21 + s, 5, 10, '#cfd8e6'), E(5.5, 26 + s, 1.5, 1.5, '#ff9ec0'),
      R(14, 18, 2, 16, '#efe8d8'), R(9, 21, 12, 1, '#efe8d8'), R(9, 25, 12, 1, '#efe8d8'), R(9, 29, 12, 1, '#efe8d8'), R(10, 32, 10, 3, '#efe8d8'),
      R(22, 20 - s, 3, 10, '#efe8d8'), R(26, 6 - s, 2, 20, '#cfd8e6'), R(23, 24 - s, 8, 2, '#ffd66b'),
      E(15, 10, 8, 8, '#efe8d8'), R(7, 1, 16, 6, '#a8b0bd'), R(14, 0, 2, 3, '#ff9ec0'),
      R(11, 9, 3, 3, INK), R(17, 9, 3, 3, INK), P(12, 10, '#7fe3ff'), P(18, 10, '#7fe3ff'), R(12, 15, 6, 1, INK),
    ] };
  },
  crystalslime: (f) => {
    const s = f ? 1 : 0;
    return { w: 36, h: 30, shapes: [
      R(9, 2 + s, 4, 8, '#c9f2ff'), R(16, 0 + s, 4, 10, '#e2fbff'), R(23, 3 + s, 4, 7, '#c9f2ff'),
      E(18, 19 + s, 17, 11 - s, '#8fe3ff'), E(11, 15 + s, 4, 3, '#d6f7ff'),
      ...face(14, 17 + s, 7), R(17, 23 + s, 3, 1, '#3f8fb0'),
    ] };
  },
  rockgolem: (f) => {
    const s = f ? 1 : 0;
    return { w: 54, h: 54, shapes: [
      R(14, 46, 10, 8, '#8a7050'), R(31, 46, 10, 8, '#8a7050'),
      E(6, 30 + s, 6, 9, '#a58a6a'), E(48, 30 - s, 6, 9, '#a58a6a'),
      E(27, 28, 21, 21, '#a58a6a'), E(27, 18, 14, 8, '#b49872'), R(12, 30, 1, 9, '#7a6045'), R(40, 24, 1, 10, '#7a6045'), R(22, 42, 8, 1, '#7a6045'),
      R(18, 24, 5, 4, '#ffb347'), R(31, 24, 5, 4, '#ffb347'), P(19, 24, '#fff4dc'), P(32, 24, '#fff4dc'), R(23, 34, 9, 2, '#5f4a35'),
    ] };
  },
  shade: (f) => {
    const s = f ? 1 : 0;
    return { w: 32, h: 42, shapes: [
      E(16, 22, 13, 17, '#5d5285'), R(4, 32, 6, 9 - s, '#5d5285'), R(13, 33, 6, 9 + s, '#5d5285'), R(22, 32, 6, 9 - s, '#5d5285'),
      E(16, 13, 10, 10, '#3e3466'), E(16, 15, 7, 6, '#241d3d'),
      R(12, 14, 3, 2, '#ff9ec0'), R(18, 14, 3, 2, '#ff9ec0'), P(13, 14, '#ffffff'), P(19, 14, '#ffffff'),
    ] };
  },
  cloudsheep: (f) => {
    const s = f ? 1 : 0;
    return { w: 42, h: 34, shapes: [
      R(11, 26, 4, 8 - s, '#6b5a7e'), R(18, 26, 4, 7 + s, '#6b5a7e'), R(25, 26, 4, 8 - s, '#6b5a7e'),
      E(20, 17, 17, 11, '#ffffff'), E(9, 11, 7, 6, '#ffffff'), E(20, 8, 8, 6, '#ffffff'), E(30, 11, 7, 6, '#ffffff'), E(15, 9, 4, 3, '#fff0fa'),
      E(35, 18, 6, 7, '#8f7cc4'), R(33, 9, 4, 3, '#ffd66b'), R(38, 10, 3, 3, '#ffd66b'),
      R(34, 16, 2, 2, '#ffffff'), R(38, 16, 2, 2, '#ffffff'), P(35, 17, INK), P(39, 17, INK), R(36, 21, 2, 1, '#ff9fb8'),
    ] };
  },
  windbird: (f) => {
    const up = f ? -5 : 2;
    return { w: 40, h: 32, shapes: [
      E(12, 14 + up, 10, 5, '#8fd3ff'), R(3, 14 + up, 6, 3, '#6fb8ff'),
      E(20, 17, 11, 9, '#bfe0ff'), E(31, 12, 6, 6, '#bfe0ff'), R(29, 3, 2, 5, '#6fb8ff'), R(32, 2, 2, 5, '#8fd3ff'),
      R(36, 12, 4, 2, '#ffd66b'), R(31, 10, 2, 2, INK), P(31, 10, '#ffffff'), E(18, 21, 6, 3, '#e6f4ff'),
      R(18, 25, 2, 5, '#ffd66b'), R(23, 25, 2, 5, '#ffd66b'),
    ] };
  },
  starspirit: (f) => {
    const s = f ? 1 : 0;
    return { w: 36, h: 38, shapes: [
      R(16, 0 + s, 4, 12, '#ffe36b'), R(0, 13, 12, 4, '#ffe36b'), R(24, 13, 12, 4, '#ffe36b'),
      R(5, 26, 6, 6, '#ffe36b'), R(25, 26, 6, 6, '#ffe36b'),
      E(18, 18, 11, 11, '#ffe36b'), E(18, 16, 6, 5, '#fff6c9'),
      ...face(14, 16, 6), R(17, 21, 2, 1, '#c27a2b'), P(4, 4, '#ffffff'), P(32, 6, '#ffffff'),
    ] };
  },
  crystalking: (f) => {
    const s = f ? 2 : 0;
    return { w: 112, h: 112, shapes: [
      R(30, 96, 18, 16, '#8f7cc4'), R(64, 96, 18, 16, '#8f7cc4'),
      E(14, 66 + s, 12, 20, '#a58cff'), E(98, 66 - s, 12, 20, '#a58cff'), E(14, 86 + s, 9, 7, '#c9b6ff'), E(98, 86 - s, 9, 7, '#c9b6ff'),
      E(56, 70, 40, 34, '#b8a6ff'), E(56, 64, 28, 20, '#c9b6ff'), R(36, 74, 2, 16, '#8f7cc4'), R(76, 70, 2, 18, '#8f7cc4'),
      E(56, 32 + s, 24, 20, '#b8a6ff'),
      R(36, 2 + s, 7, 18, '#8fe3ff'), R(47, 0 + s, 8, 20, '#c9f2ff'), R(58, 0 + s, 8, 20, '#8fe3ff'), R(69, 2 + s, 7, 18, '#c9f2ff'),
      R(34, 16 + s, 44, 5, '#ffd66b'), E(56, 18 + s, 3, 3, '#ff9ec0'),
      R(44, 30 + s, 7, 8, '#ffffff'), R(61, 30 + s, 7, 8, '#ffffff'), R(46, 33 + s, 4, 5, INK), R(63, 33 + s, 4, 5, INK),
      R(40, 40 + s, 6, 2, BLUSH), R(66, 40 + s, 6, 2, BLUSH), R(52, 44 + s, 9, 2, '#6b5a9e'),
    ] };
  },
};

export function monsterSprite(art, frame) {
  return sprite(`mob|${art}|${frame}`, () => ART[art](frame));
}

// (x, y) is the monster's feet center in screen space.
// Walkers bounce along with a squash on every landing, everyone breathes while idle, new
// monsters pop in, hits squash them flat for a moment, and defeated ones shrink away.
export function drawMonster(ctx, m, x, y, time) {
  const flying = m.def.fly;
  const moving = (m.state === 'walk' && m.stagger <= 0) || flying;
  const t = time + m.uid * 0.37;
  const frame = moving ? Math.floor(t * (flying ? 6 : 4)) % 2 : 0;
  const s = monsterSprite(m.def.art, frame);
  let alpha = 1;
  let sx = 1;
  let sy = 1;
  let hop = 0;
  if (m.def.boss) {
    sy = 1 + Math.sin(t * 2) * 0.015;
    if (m.special?.warn > 0) {
      // Wind-up: crouch and tremble before the slam.
      sy = 0.9;
      sx = 1.08;
      x += Math.sin(time * 60) * 1.5;
    }
  } else if (moving && !flying) {
    const p = (t * 2.6) % 1;
    hop = Math.sin(p * Math.PI) * 3;
    const squash = p < 0.12 || p > 0.9 ? 0.12 : 0;
    sx = 1 + squash - (hop > 2 ? 0.04 : 0);
    sy = 1 - squash + (hop > 2 ? 0.06 : 0);
  } else {
    sy = 1 + Math.sin(t * 3) * 0.03;
    sx = 1 - Math.sin(t * 3) * 0.02;
  }
  if (m.flash > 0) {
    sx *= 1.14;
    sy *= 0.86;
  }
  if (m.age < 0.3 && m.hp > 0) {
    // Spawn pop with a little overshoot.
    const k = m.age / 0.3;
    const pop = 1 + Math.sin(k * Math.PI) * 0.25;
    sx *= k * pop;
    sy *= k * pop;
    alpha = Math.min(1, k * 2);
  }
  if (m.hp <= 0) {
    alpha = Math.max(0, 1 - m.dying * 2.2);
    sx *= 1 + m.dying * 0.6;
    sy *= Math.max(0.05, 1 - m.dying * 1.8);
  }
  if (sx <= 0 || sy <= 0) return;
  if (!flying) {
    // Ground shadow; it shrinks a little at the top of each hop.
    ctx.save();
    ctx.globalAlpha = 0.16 * alpha;
    ctx.fillStyle = '#3a2d4f';
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(6, s.w * 0.36) * (1 - hop * 0.04), 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - hop));
  ctx.scale(sx, sy);
  blit(ctx, s, -s.w / 2, -s.h, { flip: m.dir < 0, flash: m.flash, alpha });
  ctx.restore();
}
