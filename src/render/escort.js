// Draws the little Mochi you're bringing home (world/escort.js): hiding behind a bush in the meadow
// (peeking over it now and then, a "?" bobbing over it), waddling after you, or asleep on its cushion
// in Sprout Village once it's home.

import { drawMochiAnim } from './mochi-anim.js';

function bush(ctx, x, y) {
  ctx.save();
  for (const [dx, dy, r, c] of [[-10, -6, 9, '#5f9a6a'], [8, -6, 9, '#5f9a6a'], [0, -11, 10, '#6fb07a'], [-6, -8, 7, '#7fcf9a'], [7, -9, 6, '#8fdc94']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ff9ec0';
  for (const [dx, dy] of [[-8, -13], [6, -15], [12, -6]]) ctx.fillRect(x + dx, y + dy, 2, 2);
  ctx.restore();
}

export function drawEscort(ctx, world, cam, time) {
  const s = world.escort;
  if (!s || s.phase === 'arriving') return;
  const x = s.x - cam.x;
  const y = s.y - cam.y;
  if (x < -40 || x > 700) return;
  if (s.phase === 'hiding') {
    // Peeking up over its bush every few seconds, ducking back down between.
    const cyc = (time % 4.5) / 4.5;
    const up = cyc < 0.15 ? cyc / 0.15 : cyc < 0.55 ? 1 : cyc < 0.7 ? 1 - (cyc - 0.55) / 0.15 : 0;
    const ease = up * up * (3 - 2 * up);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 30, y - 60, 60, 60 - 8);
    ctx.clip();
    s.m.dir = -1;
    drawMochiAnim(ctx, s.m, x, y + 16 - ease * 14, time);
    ctx.restore();
    bush(ctx, x, y);
    if (ease > 0.6) {
      ctx.save();
      ctx.globalAlpha = (ease - 0.6) / 0.4;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#c9a6ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x + 9, y - 36 + Math.sin(time * 5) * 1.2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8a6ad8';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', x + 9, y - 33 + Math.sin(time * 5) * 1.2);
      ctx.restore();
    }
    return;
  }
  drawMochiAnim(ctx, s.m, x, y - (s.lift ?? 0), time);
}
