// Summoned helpers that float beside the player: a guardian angel and a shadow cross.

import { R, E, P, sprite, blit } from './pixel.js';

const INK = '#3a2d4f';

const ART = {
  angel: (f) => ({ w: 30, h: 30, shapes: [
    E(6, 15 + f, 6, 8, '#ffffff'), E(24, 15 + f, 6, 8, '#ffffff'), E(6, 16 + f, 4, 5, '#e8f0ff'), E(24, 16 + f, 4, 5, '#e8f0ff'),
    E(15, 3, 6, 2.2, '#ffe36b'), E(15, 3, 4, 1, 'none'),
    R(11, 16, 9, 12, '#fff6e0'), R(11, 26, 9, 2, '#ffe36b'), R(14, 18, 3, 6, '#ffffff'),
    E(15, 11, 6, 6, '#fff0e6'), R(9, 5, 12, 4, '#ffe9a8'), R(9, 8, 2, 5, '#ffe9a8'), R(19, 8, 2, 5, '#ffe9a8'),
    P(13, 11, INK), P(17, 11, INK), R(11, 13, 2, 1, '#ff9fb8'), R(18, 13, 2, 1, '#ff9fb8'),
  ] }),
  cross: (f) => ({ w: 30, h: 36, shapes: [
    R(13, 0, 4, 36, '#2b2a4a'), R(2, 10, 26, 4, '#2b2a4a'), R(11, 2, 8, 2, '#2b2a4a'), R(11, 32, 8, 2, '#2b2a4a'),
    E(15, 12, 6, 6, '#3d3a6b'), E(15, 12, 3, 3, f ? '#a8f0ff' : '#7fe3ff'),
    R(14, 2, 2, 6, '#5fd3ff'), R(14, 20, 2, 11, '#5fd3ff'), R(3, 11, 6, 2, '#5fd3ff'), R(21, 11, 6, 2, '#5fd3ff'),
    P(15, 34, '#a8f0ff'), P(1, 12, '#a8f0ff'), P(28, 12, '#a8f0ff'), P(15, 0, '#a8f0ff'),
  ] }),
};

// (x, y) is the summon's center in screen space.
export function drawSummon(ctx, art, x, y, time, facing) {
  const frame = Math.floor(time * 4) % 2;
  const s = sprite(`summon|${art}|${frame}`, () => ART[art](frame));
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 26);
  glow.addColorStop(0, art === 'angel' ? 'rgba(255,243,166,0.65)' : 'rgba(150,110,255,0.6)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  blit(ctx, s, x - s.w / 2, y - s.h / 2, { flip: facing < 0 });
}
