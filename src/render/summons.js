// Summoned helpers that float beside the player: a guardian angel, a frost sprite, and a salamander.

import { R, E, P, sprite, blit } from './pixel.js';

const INK = '#3a2d4f';
const GLOWS = { angel: 'rgba(255,243,166,0.65)', sprite: 'rgba(143,227,255,0.6)', salamander: 'rgba(255,138,60,0.6)' };

const ART = {
  angel: (f) => ({ w: 30, h: 30, shapes: [
    E(6, 15 + f, 6, 8, '#ffffff'), E(24, 15 + f, 6, 8, '#ffffff'), E(6, 16 + f, 4, 5, '#e8f0ff'), E(24, 16 + f, 4, 5, '#e8f0ff'),
    E(15, 3, 6, 2.2, '#ffe36b'), E(15, 3, 4, 1, 'none'),
    R(11, 16, 9, 12, '#fff6e0'), R(11, 26, 9, 2, '#ffe36b'), R(14, 18, 3, 6, '#ffffff'),
    E(15, 11, 6, 6, '#fff0e6'), R(9, 5, 12, 4, '#ffe9a8'), R(9, 8, 2, 5, '#ffe9a8'), R(19, 8, 2, 5, '#ffe9a8'),
    P(13, 11, INK), P(17, 11, INK), R(11, 13, 2, 1, '#ff9fb8'), R(18, 13, 2, 1, '#ff9fb8'),
  ] }),
  // A little ice fairy: crystal wings, a frosty dress, and a snowflake on her head.
  sprite: (f) => ({ w: 30, h: 30, shapes: [
    E(6, 13 - f, 6, 7, '#c9f6ff'), E(24, 13 - f, 6, 7, '#c9f6ff'), E(6, 13 - f, 3.5, 4.5, '#ffffff'), E(24, 13 - f, 3.5, 4.5, '#ffffff'),
    R(12, 17, 7, 9, '#8fe3ff'), R(10, 24, 11, 3, '#c9f6ff'), R(14, 18, 3, 5, '#e8fbff'),
    E(15, 11, 6, 6, '#f2fbff'), R(9, 5, 12, 4, '#bfe6ff'), R(9, 8, 2, 6, '#bfe6ff'), R(19, 8, 2, 6, '#bfe6ff'),
    R(14, 1, 3, 1, '#ffffff'), R(15, 0, 1, 3, '#ffffff'), P(13, 2, '#8fe3ff'), P(17, 2, '#8fe3ff'),
    P(13, 11, '#3f6fb8'), P(17, 11, '#3f6fb8'), P(13, 10, '#ffffff'), R(11, 13, 2, 1, '#ffb3d0'), R(18, 13, 2, 1, '#ffb3d0'), R(14, 14, 2, 1, '#6f8fc8'),
  ] }),
  // A fat little fire salamander with a venom-green belly and a flame on its tail.
  salamander: (f) => ({ w: 34, h: 26, shapes: [
    E(28, 12 - f, 3, 5, '#ffd66b'), E(28, 10 - f, 2, 3, '#fff3c4'), R(22, 14, 7, 4, '#ff6b2b'),
    E(15, 16, 9, 6, '#ff6b2b'), E(15, 18, 6, 3, '#9be86b'), R(9, 20, 3, 4, '#e0442b'), R(18, 20, 3, 4, '#e0442b'),
    E(7, 11, 7, 6, '#ff8a3c'), E(4, 13, 3, 2, '#ff9b5c'), R(5, 4, 2, 4, '#b46bff'), R(9, 3, 2, 5, '#9be86b'), R(13, 5, 2, 3, '#b46bff'),
    P(5, 10, INK), P(9, 10, INK), P(5, 9, '#ffffff'), P(9, 9, '#ffffff'), R(4, 14, 3, 1, '#8a2a2a'),
    P(14, 14, '#ffd66b'), P(18, 13, '#ffd66b'), P(11, 15, '#ffd66b'),
  ] }),
};

// (x, y) is the summon's center in screen space.
export function drawSummon(ctx, art, x, y, time, facing) {
  const frame = Math.floor(time * 4) % 2;
  const s = sprite(`summon|${art}|${frame}`, () => ART[art](frame));
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 26);
  glow.addColorStop(0, GLOWS[art]);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // The salamander is drawn facing left; everyone else faces right.
  blit(ctx, s, x - s.w / 2, y - s.h / 2, { flip: art === 'salamander' ? facing > 0 : facing < 0 });
}
